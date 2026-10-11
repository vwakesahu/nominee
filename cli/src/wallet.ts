// SPDX-License-Identifier: Apache-2.0
// src/wallet.ts — build the facade and sync safely
import * as ledger from "@midnight-ntwrk/midnight-js-protocol/ledger";
import {
  WalletFacade, ShieldedWallet, DustWallet, UnshieldedWallet, PublicKey,
  createKeystore, InMemoryTransactionHistoryStorage, TransactionHistoryStorage,
} from "@midnight-ntwrk/wallet-sdk";
import * as rx from "rxjs";
import { networkConfig, networkId } from "./config";
import { deriveShieldedSeed, deriveUnshieldedSeed, deriveDustSeed } from "./keys";

/**
 * Build the wallet facade.
 *
 * If a checkpoint file exists (written by the `sync` command), the DUST and
 * unshielded wallets are RESTORED from it instead of starting a cold scan from
 * index 0. On Preprod the DUST wallet has to walk ~1.3M historical generation
 * events; restoring from a checkpoint is what makes that survivable across runs.
 * The shielded wallet has no restore path in this SDK, but we never block on it.
 */
export async function buildWallet(seed: Buffer, opts: { useCheckpoint?: boolean } = {}) {
  const { useCheckpoint = true } = opts;
  const net = networkConfig();
  const zswapSecretKeys = ledger.ZswapSecretKeys.fromSeed(deriveShieldedSeed(seed));
  const dustSecretKey = ledger.DustSecretKey.fromSeed(deriveDustSeed(seed));
  const keystore = createKeystore(deriveUnshieldedSeed(seed), networkId());

  const checkpoint = null;

  const configuration = {
    networkId: networkId(),
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
  };

  const facade = await WalletFacade.init({
    configuration,
    shielded: (cfg) => ShieldedWallet(cfg).startWithSecretKeys(zswapSecretKeys),
    unshielded: (cfg) => UnshieldedWallet(cfg).startWithPublicKey(PublicKey.fromKeyStore(keystore)),
    dust: (cfg) => DustWallet(cfg).startWithSecretKey(
      dustSecretKey, ledger.LedgerParameters.initialParameters().dust,
    ),
  });

  return { facade, keystore, zswapSecretKeys, dustSecretKey };
}

/**
 * Per-wallet sync check — we wait for the UNSHIELDED wallet only.
 *
 * We deliberately DON'T block on the shielded wallet (it scans the whole chain
 * and trial-decrypts every shielded output just to confirm this wallet has none)
 * nor on the dust wallet (its full generation-event scan takes hours on Preprod;
 * see the `sync` command for that). The DUST balance is readable regardless.
 */
function isReallySynced(state: any): boolean {
  const p = state?.unshielded?.progress;
  if (!p) return false;
  const applied = Number(p.appliedId ?? p.appliedIndex ?? 0);
  const highest = Number(p.highestTransactionId ?? p.highestIndex ?? 0);
  return highest > 0 && applied >= highest && dustCaughtUp(state);
}

/**
 * The DUST wallet syncs separately and far more slowly — on Preprod it walks
 * over a million generation events while the unshielded wallet finishes in a
 * second. Balancing a fee before it catches up reads 0 DUST and fails with
 * "could not balance dust" even though the NIGHT is registered.
 */
function dustProgress(state: any): { applied: bigint; target: bigint } | null {
  const d = state?.dust?.progress;
  if (!d || d.highestRelevantWalletIndex === undefined) return null;
  return { applied: BigInt(d.appliedIndex ?? 0), target: BigInt(d.highestRelevantWalletIndex) };
}

function dustCaughtUp(state: any): boolean {
  const d = dustProgress(state);
  if (!d) return networkConfig().local;
  // Before its first indexer response the dust wallet reports 0/0 — that is
  // "not started", not "caught up".
  if (d.target === 0n && !networkConfig().local) return false;
  return d.applied >= d.target;
}

/**
 * A wallet that has never received anything reports 0/0 forever.
 *
 * `isReallySynced` requires `highest > 0`, so an unfunded address never
 * satisfies it and the sync spins until the timeout — half an hour of "syncing…
 * 0/0" that looks like a network fault and is really just an empty wallet. Once
 * 0/0 has held steady for this long, treat it as caught up and let the caller
 * report the real problem: there are no funds.
 */
const EMPTY_WALLET_SETTLE_MS = Number(process.env.NOMINEE_EMPTY_SETTLE_MS ?? 20_000);

/** See the note in startAndSync: keeps the facade's services from shutting down. */
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
 * Start the facade and wait until the unshielded wallet is caught up.
 * Redraws progress every second and fails loudly on timeout.
 */
export async function startAndSync(
  bundle: Awaited<ReturnType<typeof buildWallet>>,
  // A public network has millions of historical transactions to walk where the
  // devnet has a handful, so the ceiling is network-dependent and overridable.
  timeoutMs = Number(process.env.NOMINEE_SYNC_TIMEOUT_MS ?? (networkConfig().local ? 600_000 : 1_800_000)),
) {
  const { facade, zswapSecretKeys, dustSecretKey } = bundle;
  await facade.start(zswapSecretKeys, dustSecretKey);

  return new Promise<any>((resolve, reject) => {
    const startedAt = Date.now();
    let lastApplied = 0;
    let lastHighest = 0;
    let dust = '';

    const draw = () => {
      const secs = Math.floor((Date.now() - startedAt) / 1000);
      process.stdout.write(
        `\r  syncing… ${Math.min(lastApplied, lastHighest)}/${lastHighest} transactions${dust} (${secs}s)`,
      );
    };
    // Redraw on a fixed beat, not per state emission: the dust sync emits
    // hundreds of states a second.
    const heartbeat = setInterval(draw, 10_000);

    let sub: rx.Subscription;
    const timeout = setTimeout(() => {
      clearInterval(heartbeat);
      sub?.unsubscribe();
      reject(new Error(
        `Sync timed out after ${timeoutMs / 1000}s. Run the command again; ` +
        `the indexer resumes from where it left off.`,
      ));
    }, timeoutMs);

    let emptySince: number | null = null;

    sub = facade.state().subscribe((state: any) => {
      const p = state.unshielded?.progress;
      const d = dustProgress(state);
      if (d) dust = `, dust ${d.applied < d.target ? d.applied : d.target}/${d.target}`;
      if (p) {
        lastApplied = Number(p.appliedId);
        lastHighest = Number(p.highestTransactionId);
      }
      // Nothing to walk: an address with no history. Give the indexer a moment
      // to contradict us, then stop pretending we are making progress.
      const empty = !!p && lastHighest === 0;
      if (empty) emptySince ??= Date.now();
      else emptySince = null;
      const settledEmpty = emptySince !== null && Date.now() - emptySince >= EMPTY_WALLET_SETTLE_MS;

      if (isReallySynced(state) || settledEmpty) {
        clearInterval(heartbeat);
        clearTimeout(timeout);
        sub.unsubscribe();
        // Hold one live subscriber for the rest of the process. Dropping the
        // last one lets the facade tear down its services, and the node client
        // goes with them — a submission issued afterwards dies with
        // "disconnected from wss://…: 1000:: Normal Closure".
        keepAlive ??= facade.state().subscribe({ next: () => {}, error: () => {} });
        process.stdout.write("\n");
        resolve(state);
      }
    });
  });
}
