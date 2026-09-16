// SPDX-License-Identifier: Apache-2.0
// Sync the wallet and report NIGHT / DUST balances for the configured network.
import { Buffer } from 'node:buffer';
import * as Rx from 'rxjs';
import { NETWORK, networkConfig } from '../config.js';
import { resolveSeed } from '../seed.js';
import { initializeNetwork } from '../netid.js';
import { buildWallet, startAndSync } from '../wallet.js';
import { note, ok, fail } from '../display.js';

export async function balance() {
  initializeNetwork();
  note(`network: ${NETWORK}   node: ${networkConfig.node}`);
  const bundle = await buildWallet(resolveSeed(), { useCheckpoint: false });
  try { await startAndSync(bundle, 300_000); }
  catch (e: any) { note(`sync did not complete: ${String(e?.message ?? e).slice(0, 90)}`); }
  const st: any = await Rx.firstValueFrom(bundle.facade.state());
  const dump = (label: string, v: any) => {
    if (v === undefined || v === null) { note(`${label}: —`); return; }
    if (typeof v === 'bigint' || typeof v === 'string' || typeof v === 'number') {
      ok(`${label}: ${v}`); return;
    }
    if (typeof v === 'function') {
      try { ok(`${label}: ${String(v.call(st.dust, Date.now()))}`); } catch { note(`${label}: (fn)`); }
      return;
    }
    try { ok(`${label}: ${JSON.stringify(v, (k, x) => typeof x === 'bigint' ? String(x) : x)}`); }
    catch { note(`${label}: ${String(v)}`); }
  };
  console.log();
  const dustCoins = st.dust?.availableCoins?.length ?? 0;
  let dustBal: any = '—';
  try { dustBal = st.dust?.balance(new Date()); } catch { /* fn shape varies */ }
  ok(`DUST spendable coins : ${dustCoins}`);
  ok(`DUST balance         : ${dustBal}`);
  const regd = (st.unshielded?.availableCoins ?? []).map((c: any) => c.meta?.registeredForDustGeneration);
  ok(`NIGHT utxos          : ${regd.length}  registeredForDust: ${JSON.stringify(regd)}`);
  dump('NIGHT balance', st.unshielded?.balance);
  dump('NIGHT balances', st.unshielded?.balances);
  dump('DUST balance', st.dust?.balance);
  const j = (v: any) => JSON.stringify(v, (k, x) => typeof x === 'bigint' ? String(x) : x);
  note(`unshielded sync: ${j(st.unshielded?.progress)}`);
  note(`dust sync      : ${j(st.dust?.progress)}`);
  note(`dust connected : ${st.dust?.isConnected}`);
  note(`dust coins     : ${j((st.dust?.availableCoins ?? []).length)}`);
  process.exit(0);
}
