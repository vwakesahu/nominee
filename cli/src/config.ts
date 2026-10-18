// SPDX-License-Identifier: Apache-2.0
//
// Which network the CLI is pointed at, and the credentials it needs to act there.
//
// Default target is PREPROD, the public Midnight test network. The local
// docker-compose devnet is fully supported; select it with
// `--network undeployed` or NOMINEE_NETWORK=undeployed.
//
// Everything that depends on the network is a FUNCTION, not a constant: the
// `--network` flag is parsed after the module graph has loaded, so a value
// captured at import time would go stale.
import * as os from 'node:os';
import * as path from 'node:path';
import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { mnemonicToSeedSync, validateMnemonic } from 'bip39';
import { NETWORKS, parseNetworkName, type NetworkName, type NetworkSpec } from './networks.js';

export type { NetworkName, NetworkSpec };

/** Local devnet genesis wallet, funded at chain start. Public, dev-only. */
export const GENESIS_SEED_HEX = '00'.repeat(31) + '01';

let selected: NetworkName = parseNetworkName(process.env.NOMINEE_NETWORK ?? 'preprod');

/** Set the target network before anything reads `networkConfig()`. */
export function selectNetwork(name: string) {
  selected = parseNetworkName(name);
}

export const currentNetwork = (): NetworkName => selected;

/** The wallet-sdk / midnight-js network id is the network name itself. */
export const networkId = (): string => selected;

/** Blockfrost project id for the selected network (Preprod ids start with `nightpreprod`). */
export const BLOCKFROST_PROJECT_ID = process.env.NOMINEE_BLOCKFROST ?? '';

const withBlockfrost = (url: string) =>
  BLOCKFROST_PROJECT_ID ? `${url}?project_id=${BLOCKFROST_PROJECT_ID}` : url;

/**
 * Endpoints for the selected network. Individual endpoints can be overridden
 * per run for a custom node.
 */
export function networkConfig(): NetworkSpec {
  const base = NETWORKS[selected];
  const bf = (u: string) => (base.blockfrost ? withBlockfrost(u) : u);
  return {
    ...base,
    indexerHttpUrl: process.env.NOMINEE_INDEXER_HTTP ?? bf(base.indexerHttpUrl),
    indexerWsUrl: process.env.NOMINEE_INDEXER_WS ?? bf(base.indexerWsUrl),
    node: process.env.NOMINEE_NODE_WS ?? bf(base.node),
    proofServer: process.env.NOMINEE_PROOF_SERVER ?? base.proofServer,
  };
}

/**
 * The seed the CLI acts as, as hex.
 *
 * A recovery phrase wins when both are set: it is what a browser wallet like
 * Lace gives you, and DUST is non-transferable, so the CLI must act as the very
 * same wallet that registered for DUST, not merely a funded one. Lace feeds
 * HDWallet.fromSeed the standard 64-byte BIP39 seed, which is what this returns;
 * `nominee address` is the check that it matches what Lace shows.
 *
 * On the local devnet this defaults to the pre-funded genesis wallet. On a
 * public network there is no default, and the genesis seed is refused outright:
 * it is a published constant, and anything sent to it is anyone's to spend.
 */
export function walletSeedHex(): string {
  const net = NETWORKS[selected];
  const phrase = readMnemonic();
  if (phrase) {
    if (!validateMnemonic(phrase)) {
      throw new Error('recovery phrase is not a valid BIP39 mnemonic (check word count and spelling).');
    }
    return Buffer.from(mnemonicToSeedSync(phrase)).toString('hex');
  }
  const raw = process.env.NOMINEE_SEED_HEX?.trim().replace(/^0x/, '');

  if (net.local) return raw || GENESIS_SEED_HEX;

  if (!raw) {
    throw new Error(
      `no wallet for ${net.name}.\n` +
        `  Use a recovery phrase:   NOMINEE_MNEMONIC_FILE=<file>   or   NOMINEE_MNEMONIC="word word ..."\n` +
        `  or a 32-byte hex seed:   NOMINEE_SEED_HEX=<64 hex chars>   (openssl rand -hex 32)\n` +
        (net.faucet
          ? `  Then fund its address at ${net.faucet}\n` +
            `  (\`nominee address\` prints the address to paste into the faucet)`
          : `  ${net.name} has no faucet; fund the address with real NIGHT.`),
    );
  }
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error(`NOMINEE_SEED_HEX must be exactly 64 hex characters (32 bytes); got ${raw.length}.`);
  }
  if (raw.toLowerCase() === GENESIS_SEED_HEX) {
    throw new Error(
      `refusing to use the devnet genesis seed on ${net.name}.\n` +
        `  That seed is a published constant; any funds sent to it are anyone's to spend.`,
    );
  }
  return raw.toLowerCase();
}

/** True when some wallet credential is configured (for `doctor`). */
export const walletConfigured = (): boolean =>
  !!(readMnemonic() || process.env.NOMINEE_SEED_HEX?.trim());

/**
 * A BIP39 recovery phrase from NOMINEE_MNEMONIC (or NOMINEE_SEED_MNEMONIC), or
 * from a file named by NOMINEE_MNEMONIC_FILE. Kept out of argv and out of logs.
 */
function readMnemonic(): string | null {
  const inline = (process.env.NOMINEE_MNEMONIC ?? process.env.NOMINEE_SEED_MNEMONIC)?.trim();
  if (inline) return inline.split(/\s+/).join(' ');
  const file = process.env.NOMINEE_MNEMONIC_FILE?.trim();
  if (!file) return null;
  const words = readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith('#'))   // tolerate comment lines
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) throw new Error(`no recovery phrase found in ${file}`);
  return words.join(' ');
}

/** Grace period for the demo, in SECONDS.
 *  blockTime* takes Unix SECONDS; the indexer reports MILLISECONDS. */
export const DEMO_GRACE_SECONDS = BigInt(process.env.NOMINEE_GRACE ?? '60');

/** Veto window opened by `resolve`, in SECONDS. `finalize` unlocks once it has closed. */
export const DEMO_CHALLENGE_SECONDS = BigInt(process.env.NOMINEE_CHALLENGE ?? '30');

/**
 * A stand-in hardware signer (`nominee device`, or an ESP32 with a MAX30102
 * speaking the same two endpoints). Unset: the demo signs heartbeats in-process.
 */
export const DEVICE_URL = process.env.NOMINEE_DEVICE_URL ?? '';

/**
 * Name of an heir whose claim the demo SKIPS (e.g. `sam`), so the heir web
 * page can claim it afterwards from the envelope. Unset: all nominees claim.
 */
export const HOLD_HEIR = (process.env.NOMINEE_HOLD_HEIR ?? '').trim().toLowerCase();

/**
 * Deployment records are per network; a devnet address means nothing on
 * Preprod. The local devnet keeps its historical name, deployments/devnet.json.
 */
export const deploymentsFile = (): string =>
  `deployments/${selected === 'undeployed' ? 'devnet' : selected}.json`;

/**
 * Where the DUST wallet snapshot is persisted between runs, OUTSIDE the repo.
 * On a public network the DUST wallet replays every generation event since
 * genesis (1.67M on Preprod, Oct 2026; about 30 min even with large batches),
 * so wallet.ts restores from this file and refreshes it while syncing.
 * NOMINEE_DUST_CHECKPOINT=<file> relocates it, `off` forces a cold scan.
 * Never used on the local devnet, whose chain is reset too often.
 */
export const dustCheckpointFile = (): string =>
  process.env.NOMINEE_DUST_CHECKPOINT ?? path.join(os.homedir(), '.nominee', `dust-${selected}.json`);

/**
 * What the demo deposits into the vault:  NOMINEE_DEPOSIT = native | token
 *   native  a shielded native coin (colour = 32 zero bytes). Only the local
 *           devnet's genesis wallet holds those.
 *   token   tNOM, minted by the testnet-only demo token (contract/token) to
 *           this wallet first. The default on public networks, where the
 *           funded wallet holds unshielded NIGHT only and NIGHT cannot be
 *           shielded. Nominee's deposit and claim accept any colour.
 */
export const depositAsset = (): string =>
  process.env.NOMINEE_DEPOSIT ?? (NETWORKS[selected].local ? 'native' : 'token');

/** Address of an already deployed demo token to attach to. Unset: the demo deploys a fresh one. */
export const TOKEN_CONTRACT = process.env.NOMINEE_TOKEN_CONTRACT ?? '';
