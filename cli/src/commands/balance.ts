// SPDX-License-Identifier: Apache-2.0
// Sync the wallet and report NIGHT, DUST and shielded balances on the selected network.
import { Buffer } from 'node:buffer';
import * as Rx from 'rxjs';
import chalk from 'chalk';
import { networkConfig, walletSeedHex } from '../config.js';
import { initializeNetwork } from '../netid.js';
import { buildWallet, startAndSync, readFunds } from '../wallet.js';
import { note, ok, warn } from '../display.js';

const j = (v: any) => JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? String(x) : x));

export async function balance() {
  const net = networkConfig();
  initializeNetwork();
  note(`network: ${chalk.bold(net.name)}`);
  const bundle = await buildWallet(Buffer.from(walletSeedHex(), 'hex'), { useCheckpoint: false });
  if (bundle.restoredDust) note('DUST wallet restored from its checkpoint.');
  try { await startAndSync(bundle); }
  catch (e: any) { warn(`sync did not complete: ${String(e?.message ?? e).slice(0, 120)}`); }
  const st: any = await Rx.firstValueFrom(bundle.facade.state());
  const { night, dust } = readFunds(st);
  const regd = (st.unshielded?.availableCoins ?? []).map((c: any) => !!c.meta?.registeredForDustGeneration);

  console.log();
  ok(`NIGHT (unshielded)   : ${night}  in ${regd.length} UTXO(s), registered for DUST: ${j(regd)}`);
  ok(`DUST                 : ${dust}  in ${st.dust?.availableCoins?.length ?? 0} spendable coin(s)`);
  ok(`shielded balances    : ${j(st.shielded?.balances ?? {})}`);
  note(`unshielded sync: ${j(st.unshielded?.progress)}`);
  note(`dust sync      : ${j(st.dust?.progress)}`);
  if (!net.local && night > 0n && regd.some((r: boolean) => !r)) {
    warn('Some NIGHT is not registered for DUST generation: nominee register-dust');
  }
  process.exit(0);
}
