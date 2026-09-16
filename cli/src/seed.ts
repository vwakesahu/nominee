// SPDX-License-Identifier: Apache-2.0
import { Buffer } from 'node:buffer';
import { mnemonicToSeedSync, validateMnemonic } from 'bip39';
import { GENESIS_SEED_HEX, MNEMONIC, NETWORK } from './config.js';

/**
 * Resolve the wallet seed. A mnemonic takes precedence, because that is what a
 * Lace-imported wallet uses — and on a public testnet Lace is currently the
 * only way to complete DUST registration.
 */
export function resolveSeed(): Buffer {
  if (MNEMONIC) {
    if (!validateMnemonic(MNEMONIC)) throw new Error('NOMINEE_MNEMONIC failed BIP-39 validation');
    return Buffer.from(mnemonicToSeedSync(MNEMONIC));
  }
  if (!GENESIS_SEED_HEX) {
    throw new Error(
      `No wallet for network "${NETWORK}". Set NOMINEE_MNEMONIC="word word ..." ` +
      `(recommended — matches a Lace wallet) or NOMINEE_SEED_HEX=<64 hex chars>.`,
    );
  }
  return Buffer.from(GENESIS_SEED_HEX, 'hex');
}
