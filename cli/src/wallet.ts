// SPDX-License-Identifier: Apache-2.0
// src/wallet.ts, build the facade and sync safely
import * as fs from "node:fs";
import * as path from "node:path";
import * as ledger from "@midnight-ntwrk/midnight-js-protocol/ledger";
import {
  WalletFacade, ShieldedWallet, DustWallet, UnshieldedWallet, PublicKey,
  createKeystore, InMemoryTransactionHistoryStorage, TransactionHistoryStorage,
} from "@midnight-ntwrk/wallet-sdk";
import * as rx from "rxjs";
import { networkConfig, networkId, dustCheckpointFile } from "./config.js";
import { deriveShieldedSeed, deriveUnshieldedSeed, deriveDustSeed } from "./keys.js";

/** Public networks need the DUST wallet fully caught up before anything can be balanced.
 *  Functions, not constants: the --network flag is parsed after this module loads. */
const isPublic = () => !networkConfig().local;
const checkpointEnabled = () => isPublic() && dustCheckpointFile() !== "off";

/**
 * Read the persisted DUST snapshot, if there is one for this network AND this
 * key (a snapshot made with another mnemonic is ignored, not an error).
 */
function loadDustCheckpoint(dustSecretKey: ledger.DustSecretKey): string | null {
  if (!checkpointEnabled()) return null;
  try {
    const raw = fs.readFileSync(dustCheckpointFile(), "utf8");
    const snap = JSON.parse(raw);
    if (String(snap?.publicKey?.publicKey) !== String(dustSecretKey.publicKey)) return null;
    return raw;
  } catch { return null; }
}

/** Persist the DUST wallet state so the next run resumes instead of rescanning. Best effort. */
export async function saveDustCheckpoint(bundle: { facade: any }): Promise<boolean> {
  if (!checkpointEnabled()) return false;
  try {
    const file = dustCheckpointFile();
    const serialized: string = await bundle.facade.dust.serializeState();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(`${file}.tmp`, serialized);
    fs.renameSync(`${file}.tmp`, file);
    return true;
  } catch { return false; }
}

/**
 * Build the wallet facade.
 *
 * On a public network the DUST wallet is RESTORED from `dustCheckpointFile()`
 * when that file exists and belongs to this key; otherwise it cold-scans every
 * generation event since genesis (~1.67M on Preprod). The SDK resumes from the
 * snapshot's offset and re-applies anything newer, so a snapshot taken before
 * our own spends is still correct. Restore is governed by the network and
 * NOMINEE_DUST_CHECKPOINT, not by `opts.useCheckpoint`, which every caller
 * still passes as `false` from when the checkpoint was a stub; it is accepted
 * and ignored. The shielded wallet has no restore path in this SDK, but we
 * never block on it.
 */
export async function buildWallet(seed: Buffer, _opts: { useCheckpoint?: boolean } = {}) {
  const zswapSecretKeys = ledger.ZswapSecretKeys.fromSeed(deriveShieldedSeed(seed));
  const dustSecretKey = ledger.DustSecretKey.fromSeed(deriveDustSeed(seed));
  const net = networkConfig();
  const keystore = createKeystore(deriveUnshieldedSeed(seed), networkId() as any);

  const checkpoint = loadDustCheckpoint(dustSecretKey);

  const configuration = {
    networkId: networkId() as any,
    indexerClientConnection: {
      indexerHttpUrl: net.indexerHttpUrl,
      indexerWsUrl: net.indexerWsUrl,
    },
    costParameters: { additionalFeeOverhead: 300_000_000_000_000n, feeBlocksMargin: 5 },
    txHistoryStorage: new InMemoryTransactionHistoryStorage(
      TransactionHistoryStorage.TransactionHistoryCommonSchema,
    ),
    provingServerUrl: new URL(net.proofServer),
    relayURL: new URL(net.node),
    // Event batching for the dust and shielded scans (CPU-bound in wasm). On
    // Preprod via Blockfrost the SDK default (10 events, 1 ms, 4 ms spacing)
    // applied ~180 DUST events/s over the first 100k events, 200-event
    // batches ~800/s; past ~110k both run ~190/s. It also lets the shielded
    // scan finish in about two minutes instead of competing for the thread.
    batchUpdates: { size: 200, timeout: 20, spacing: 0 },
  };

  const facade = await WalletFacade.init({
    configuration,
    shielded: (cfg) => ShieldedWallet(cfg).startWithSecretKeys(zswapSecretKeys),
    unshielded: (cfg) => UnshieldedWallet(cfg).startWithPublicKey(PublicKey.fromKeyStore(keystore)),
    dust: (cfg) => checkpoint
      ? DustWallet(cfg).restore(checkpoint)
      : DustWallet(cfg).startWithSecretKey(
          dustSecretKey, ledger.LedgerParameters.initialParameters().dust,
        ),
  });

  return { facade, keystore, zswapSecretKeys, dustSecretKey, restoredDust: checkpoint !== null };
}

/** The unshielded (NIGHT) wallet has caught up with the indexer. */
function isReallySynced(state: any): boolean {
  const p = state?.unshielded?.progress;
  if (!p) return false;
  const applied = Number(p.appliedId ?? p.appliedIndex ?? 0);
  const highest = Number(p.highestTransactionId ?? p.highestIndex ?? 0);
  return highest > 0 && applied >= highest;
}

/**
 * The DUST wallet has applied every generation event the indexer knows about.
 * `isConnected` and the tip are only set once the first event arrives, so a
 * fresh wallet reads 0/0 until then. Only required on public networks: the
 * local devnet's DUST history is a few events and never lagged.
 */
function isDustSynced(state: any): boolean {
  if (!isPublic()) return true;
  const p = state?.dust?.progress;
  if (!p) return false;
  const applied = Number(p.appliedIndex ?? 0);
  const highest = Number(p.highestRelevantWalletIndex ?? 0);
  return p.isConnected === true && highest > 0 && applied >= highest;
}

/**
 * A wallet that has never received anything reports 0/0 forever.
 *
 * `isReallySynced` requires `highest > 0`, so an unfunded address never
 * satisfies it and the sync would spin until the timeout, which looks like a
 * network fault and is really just an empty wallet. Once 0/0 has held steady
 * for this long, treat it as caught up and let the caller report the real
 * problem: there are no funds.
 */
const EMPTY_WALLET_SETTLE_MS = Number(process.env.NOMINEE_EMPTY_SETTLE_MS ?? 20_000);

/**
 * Keeps the facade's services from shutting down. Dropping the last state
 * subscriber lets the facade tear down its services, and the node client goes
 * with them: a submission issued afterwards dies with "disconnected from
 * wss://...: 1000:: Normal Closure" (on Preprod it surfaced as the wallet SDK's
 * "Failed to prove transaction"). startAndSync holds one subscriber for the
 * rest of the process.
 */
let keepAlive: rx.Subscription | null = null;

/** Release the keep-alive subscriber once no more transactions will be sent. */
export function releaseWallet() {
  try { keepAlive?.unsubscribe(); } catch { /* best effort */ }
  keepAlive = null;
}

/** Total NIGHT and DUST the wallet can see. Defensive: shapes vary by SDK version. */
export function readFunds(state: any): { night: bigint; dust: bigint } {
  let night = 0n;
  try {
    for (const v of Object.values(state?.unshielded?.balances ?? {})) night += BigInt(v as any);
  } catch { /* leave at 0 */ }
  let dust = 0n;
  try {
    const b = state?.dust?.balance;
    const raw = typeof b === 'function' ? b.call(state.dust, new Date()) : b;
    dust = BigInt(raw?.value ?? raw ?? 0);
  } catch { /* leave at 0 */ }
  return { night, dust };
}

/**
 * Start the facade and wait until the wallet can pay for a transaction: the
 * unshielded wallet caught up, and on a public network the DUST wallet too
 * (the fee balancer fails with "could not balance dust" before that). We never
 * block on the shielded wallet; it trial-decrypts the whole chain only to
 * confirm this wallet has no shielded coins.
 *
 * Redraws progress every second, saves a DUST checkpoint every minute and at
 * the end, and fails loudly on timeout. The default timeout covers a cold
 * Preprod scan; a restored wallet is usually done in a minute or two.
 */
export async function startAndSync(
  bundle: Awaited<ReturnType<typeof buildWallet>>,
  timeoutMs = Number(process.env.NOMINEE_SYNC_TIMEOUT_MS ?? (isPublic() ? 4 * 3_600_000 : 600_000)),
) {
  const { facade, zswapSecretKeys, dustSecretKey } = bundle;
  await facade.start(zswapSecretKeys, dustSecretKey);

  return new Promise<any>((resolve, reject) => {
    const startedAt = Date.now();
    let lastApplied = 0;
    let lastHighest = 0;
    let dustApplied = 0;
    let dustHighest = 0;

    const draw = () => {
      const secs = Math.floor((Date.now() - startedAt) / 1000);
      const night = `${Math.min(lastApplied, lastHighest)}/${lastHighest} transactions`;
      const dust = isPublic()
        ? `, DUST ${dustApplied}/${dustHighest} events` +
          (dustHighest > 0 ? ` (${Math.floor((100 * Math.min(dustApplied, dustHighest)) / dustHighest)}%)` : "")
        : "";
      process.stdout.write(`\r  syncing… ${night}${dust} (${secs}s)   `);
    };
    const heartbeat = setInterval(draw, 1000);
    const checkpointer = checkpointEnabled()
      ? setInterval(() => { void saveDustCheckpoint(bundle); }, 60_000)
      : null;

    let sub: rx.Subscription;
    const stop = () => {
      clearInterval(heartbeat);
      if (checkpointer) clearInterval(checkpointer);
      clearTimeout(timeout);
      sub?.unsubscribe();
    };
    const timeout = setTimeout(async () => {
      stop();
      await saveDustCheckpoint(bundle);
      reject(new Error(
        `Sync timed out after ${timeoutMs / 1000}s. Run the command again; ` +
        `the indexer resumes from where it left off.`,
      ));
    }, timeoutMs);

    let settling = false;
    let emptySince: number | null = null;
    sub = facade.state().subscribe(async (state: any) => {
      const p = state.unshielded?.progress;
      if (p) {
        lastApplied = Number(p.appliedId);
        lastHighest = Number(p.highestTransactionId);
      }
      const d = state.dust?.progress;
      if (d) {
        dustApplied = Number(d.appliedIndex ?? 0);
        dustHighest = Number(d.highestRelevantWalletIndex ?? 0);
      }
      // Nothing to walk: an address with no history. Give the indexer a moment
      // to contradict us, then stop pretending we are making progress.
      const empty = !!p && lastHighest === 0;
      if (empty) emptySince ??= Date.now();
      else emptySince = null;
      const settledEmpty = emptySince !== null && Date.now() - emptySince >= EMPTY_WALLET_SETTLE_MS;

      if (!settling && ((isReallySynced(state) && isDustSynced(state)) || settledEmpty)) {
        settling = true;
        stop();
        keepAlive ??= facade.state().subscribe({ next: () => {}, error: () => {} });
        draw();
        process.stdout.write("\n");
        await saveDustCheckpoint(bundle);
        if (!settledEmpty && isPublic() && (state.dust?.availableCoins?.length ?? 0) === 0) {
          process.stdout.write(
            "  DUST is synced but this wallet has no spendable DUST coin; " +
            "register NIGHT for DUST generation first (nominee register-dust).\n",
          );
        }
        resolve(state);
      }
    });
  });
}
