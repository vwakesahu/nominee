// SPDX-License-Identifier: Apache-2.0
//
// Which network the CLI is pointed at, and the credentials it needs to act there.
//
// Default target is PREPROD — the public Midnight test network. The local
// docker-compose devnet is still fully supported; select it with
// `--network undeployed` or NOMINEE_NETWORK=undeployed.
import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import * as bip39 from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english.js';
import { NETWORKS, parseNetworkName, type NetworkName, type NetworkSpec } from './networks.js';

export type { NetworkName, NetworkSpec };

/** Local devnet genesis wallet — funded at chain start. Public, dev-only. */
export const GENESIS_SEED_HEX = '00'.repeat(31) + '01';

let selected: NetworkName = parseNetworkName(process.env.NOMINEE_NETWORK ?? 'preprod');

/** Set the target network before anything reads `networkConfig`. */
export function selectNetwork(name: string) {
  selected = parseNetworkName(name);
}

export const currentNetwork = (): NetworkName => selected;

/**
 * Endpoints for the selected network.
 *
 * Read this through the function, not once at import — the `--network` flag is
 * parsed after the module graph is loaded, so a captured value goes stale.
 * Individual endpoints can still be overridden per-run for a custom node.
 */
export function networkConfig(): NetworkSpec {
  const base = NETWORKS[selected];
  return {
    ...base,
    indexerHttpUrl: process.env.NOMINEE_INDEXER_HTTP ?? base.indexerHttpUrl,
    indexerWsUrl: process.env.NOMINEE_INDEXER_WS ?? base.indexerWsUrl,
    node: process.env.NOMINEE_NODE_WS ?? base.node,
    proofServer: process.env.NOMINEE_PROOF_SERVER ?? base.proofServer,
  };
}

/** The wallet-sdk / midnight-js network id is the network name itself. */
export const networkId = (): string => selected;

/**
 * The seed the CLI acts as.
 *
 * On the local devnet this defaults to the pre-funded genesis wallet. On a
 * public network there is no such thing: you must supply a seed whose address
 * has been funded from the faucet, and the genesis seed is refused outright —
 * it is a published constant, and anything sent to it is anyone's to spend.
 */
export function walletSeedHex(): string {
  const net = NETWORKS[selected];
  // A recovery phrase wins when both are set: it is what a browser wallet like
  // Lace gives you, and DUST is non-transferable, so the CLI must act as the
  // very same wallet that registered for DUST — not merely a funded one.
  const phrase = readMnemonic();
  if (phrase) return mnemonicToSeedHex(phrase);
  const raw = process.env.NOMINEE_SEED_HEX?.trim().replace(/^0x/, '');

  if (net.local) return raw || GENESIS_SEED_HEX;

  if (!raw) {
    throw new Error(
      `no wallet seed for ${net.name}.\n` +
        `  Set a 32-byte hex seed:  export NOMINEE_SEED_HEX=<64 hex chars>\n` +
        `  Generate one:            openssl rand -hex 32\n` +
        (net.faucet
          ? `  Then fund its address at ${net.faucet}\n` +
            `  (run \`nominee address\` to print the address to paste into the faucet)`
          : `  ${net.name} has no faucet — fund the address with real NIGHT.`),
    );
  }
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error(
      `NOMINEE_SEED_HEX must be exactly 64 hex characters (32 bytes); got ${raw.length}.`,
    );
  }
  if (raw.toLowerCase() === GENESIS_SEED_HEX) {
    throw new Error(
      `refusing to use the devnet genesis seed on ${net.name}.\n` +
        `  That seed is a published constant — any funds sent to it are anyone's to spend.\n` +
        `  Generate your own:  openssl rand -hex 32`,
    );
  }
  return raw.toLowerCase();
}


/**
 * A BIP39 recovery phrase, from NOMINEE_SEED_MNEMONIC or a file named by
 * NOMINEE_MNEMONIC_FILE. Kept out of argv and out of logs.
 */
function readMnemonic(): string | null {
  const inline = process.env.NOMINEE_SEED_MNEMONIC?.trim();
  if (inline) return inline;
  const file = process.env.NOMINEE_MNEMONIC_FILE?.trim();
  if (!file) return null;
  const text = readFileSync(file, 'utf8');
  // Tolerate the comment lines we write into these files.
  const words = text
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .join(' ')
    .trim()
    .split(/\s+/);
  if (words.length === 0) throw new Error(`no recovery phrase found in ${file}`);
  return words.join(' ');
}

/**
 * Phrase to the seed the Midnight HD wallet takes.
 *
 * Lace feeds HDWallet.fromSeed the standard 64-byte BIP39 (PBKDF2) seed, not
 * the 32 bytes of entropy — the entropy mapping derives a different wallet.
 * Confirmed against a Lace Midnight #0 address. `nominee address` is the check
 * that this matches what the browser wallet shows.
 */
function mnemonicToSeedHex(phrase: string): string {
  if (!bip39.validateMnemonic(phrase, english)) {
    throw new Error('recovery phrase is not a valid BIP39 mnemonic (check word count and spelling).');
  }
  return Buffer.from(bip39.mnemonicToSeedSync(phrase)).toString('hex');
}

/** Grace period for the demo, in SECONDS.
 *  blockTime* takes Unix SECONDS; the indexer reports MILLISECONDS. */
export const DEMO_GRACE_SECONDS = BigInt(process.env.NOMINEE_GRACE ?? '60');

/** Deployment records are per-network — a devnet address means nothing on preprod. */
export const deploymentsFile = (): string => `deployments/${selected}.json`;
