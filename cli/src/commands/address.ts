// SPDX-License-Identifier: Apache-2.0
// Print the wallet addresses for the configured network so a public testnet
// wallet can be funded. Addresses are derived from the seed directly — no
// chain sync, which matters because an unfunded wallet never reports "synced".
import { Buffer } from 'node:buffer';
import * as ledger from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { createKeystore } from '@midnight-ntwrk/wallet-sdk';
import { NETWORK, NETWORK_ID, networkConfig } from '../config.js';
import { resolveSeed } from '../seed.js';
import { initializeNetwork } from '../netid.js';
import { deriveShieldedSeed, deriveUnshieldedSeed, deriveDustSeed } from '../keys.js';
import { note, ok, fail } from '../display.js';

export async function address() {
  initializeNetwork();
  const seed = resolveSeed();

  const zswap = ledger.ZswapSecretKeys.fromSeed(deriveShieldedSeed(seed));
  const dustSk = ledger.DustSecretKey.fromSeed(deriveDustSeed(seed));
  const keystore = createKeystore(deriveUnshieldedSeed(seed), NETWORK_ID);

  console.log();
  note(`network : ${NETWORK}`);
  note(`node    : ${networkConfig.node}`);
  console.log();

  const show = (label: string, fn: () => any) => {
    try {
      const v = fn();
      ok(`${label.padEnd(20)} ${typeof v === 'string' ? v : String(v)}`);
    } catch (e: any) {
      note(`${label.padEnd(20)} (unavailable: ${String(e?.message ?? e).slice(0, 60)})`);
    }
  };

  show('unshielded (NIGHT)', () => (keystore as any).getBech32Address().toString());
  show('shielded', () => (zswap as any).coinPublicKey?.toHexString?.() ?? '—');
  show('dust', () => (dustSk as any).publicKey?.toString?.() ?? '—');
  console.log();
  note('Fund the unshielded (NIGHT) address, then register DUST before deploying.');
  process.exit(0);
}
