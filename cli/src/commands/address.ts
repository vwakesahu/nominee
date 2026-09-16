// SPDX-License-Identifier: Apache-2.0
// Print the wallet addresses for the configured network, so a public testnet
// wallet can be funded from the faucet.
import { Buffer } from 'node:buffer';
import * as Rx from 'rxjs';
import { NETWORK, GENESIS_SEED_HEX, networkConfig } from '../config.js';
import { initializeNetwork } from '../netid.js';
import { buildWallet, startAndSync } from '../wallet.js';
import { note, ok, fail } from '../display.js';

export async function address() {
  if (!GENESIS_SEED_HEX) {
    fail(`No seed for network "${NETWORK}". Set NOMINEE_SEED_HEX=<64 hex chars>.`);
    process.exit(1);
  }
  initializeNetwork();
  note(`network: ${NETWORK}`);
  note(`node:    ${networkConfig.node}`);
  const bundle = await buildWallet(Buffer.from(GENESIS_SEED_HEX, 'hex'), { useCheckpoint: false });
  await startAndSync(bundle);
  const st: any = await Rx.firstValueFrom(bundle.facade.state());
  console.log();
  ok(`unshielded (NIGHT) : ${st.unshielded?.address ?? st.unshielded?.bech32Address ?? '—'}`);
  ok(`shielded           : ${st.shielded?.address ?? '—'}`);
  ok(`dust               : ${st.dust?.address ?? '—'}`);
  console.log();
  note('Fund the unshielded address at the faucet, then register DUST before deploying.');
  try { await (bundle.facade as any).close?.(); } catch { /* best effort */ }
  process.exit(0);
}
