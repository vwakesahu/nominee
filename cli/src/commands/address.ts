// SPDX-License-Identifier: Apache-2.0
//
// Print the address the CLI acts as, so it can be pasted into the faucet.
//
// This derives keys only — no wallet start, no indexer, no sync. It is the one
// command that works before the wallet has any funds, which is exactly when
// you need it.
import { Buffer } from 'node:buffer';
import chalk from 'chalk';
import { createKeystore } from '@midnight-ntwrk/wallet-sdk';
import { networkConfig, networkId, walletSeedHex } from '../config.js';
import { deriveUnshieldedSeed } from '../keys.js';
import { ok, note, warn } from '../display.js';

export async function address() {
  const net = networkConfig();
  const keystore = createKeystore(
    deriveUnshieldedSeed(Buffer.from(walletSeedHex(), 'hex')),
    networkId(),
  );
  const addr = keystore.getBech32Address().toString();

  console.log();
  ok(`network: ${chalk.bold(net.name)}`);
  console.log(`\n  ${chalk.bold(addr)}\n`);

  if (net.faucet) {
    note(`Fund it at ${chalk.cyan(net.faucet)} — paste the address above.`);
    note('You need tNIGHT for fees; DUST is generated from it automatically.');
  } else if (net.local) {
    note('Local devnet: the genesis wallet is pre-funded, no faucet needed.');
  } else {
    warn('This network has no faucet — it needs real NIGHT registered for DUST.');
  }
  console.log();
}
