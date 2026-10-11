// SPDX-License-Identifier: Apache-2.0
//
// Register NIGHT UTxOs for DUST generation.
//
// DUST — not NIGHT — pays Midnight transaction fees. A freshly funded wallet
// holds NIGHT and zero DUST, so every transaction it tries to send fails with
// "Insufficient Funds: could not balance dust". NIGHT only starts generating
// DUST once its UTxOs have been designated for generation by an on-chain
// registration transaction.
//
// The chicken-and-egg — the registration itself costs a fee — is resolved by
// the SDK: `waitForGeneratedDust` blocks until the DUST *projected* from these
// UTxOs covers the registration fee, so the transaction pays for itself.
import { Buffer } from 'node:buffer';
import chalk from 'chalk';
import { networkConfig, walletSeedHex } from '../config.js';
import { buildWallet, startAndSync, readFunds } from '../wallet.js';
import { initializeNetwork } from '../netid.js';
import { ok, fail, note, warn, banner } from '../display.js';

/** Native NIGHT is the all-zero token type. */
const NATIVE = '0'.repeat(64);

/**
 * The unshielded wallet reports coins as `{ utxo, meta }` and the dust API reads
 * `.meta.ctime` off exactly that shape — so these objects are passed through
 * untouched. Flattening them (as the dust package's own `UtxoWithMeta` type
 * declaration suggests) makes the SDK throw "Cannot read properties of undefined
 * (reading 'ctime')". Only our own filtering needs to know the nesting.
 */
const tokenTypeOf = (c: any) => c?.utxo?.type ?? c?.type ?? c?.utxo?.tokenType ?? c?.tokenType;
const isRegistered = (c: any): boolean =>
  Boolean(c?.meta?.registeredForDustGeneration ?? c?.registeredForDustGeneration);

const isNight = (c: any): boolean => {
  const t = tokenTypeOf(c);
  if (t === undefined || t === null) return true; // shape varies; don't over-filter
  const hex = typeof t === 'string' ? t.replace(/^0x/, '') : Buffer.from(t).toString('hex');
  return hex === NATIVE;
};

export async function registerDust(opts: { timeout?: string; direct?: boolean } = {}) {
  banner();
  const net = networkConfig();
  console.log();
  note(`Network: ${chalk.bold(net.name)}`);

  if (net.local) {
    note('Local devnet: the genesis wallet already generates DUST. Nothing to do.');
    return;
  }

  initializeNetwork();
  const bundle = await buildWallet(Buffer.from(walletSeedHex(), 'hex'), { useCheckpoint: false });
  note('Syncing the wallet…');
  const state = await startAndSync(bundle);

  const { night, dust } = readFunds(state);
  note(`NIGHT: ${night}   DUST: ${dust}`);

  const all: any[] = [...(state?.unshielded?.availableCoins ?? [])];
  if (all.length === 0) {
    fail('No NIGHT UTxOs. Fund the wallet first:  nominee address');
    process.exit(1);
  }

  const nightUtxos = all.filter(isNight);
  const unregistered = nightUtxos.filter((u) => !isRegistered(u));

  note(`${nightUtxos.length} NIGHT UTxO(s); ${unregistered.length} not yet registered.`);
  if (unregistered.length === 0) {
    ok('Already registered for DUST generation.');
    note('DUST accrues over ~5 minutes. If it is still 0, wait and re-check with:  nominee address');
    await bundle.facade.stop().catch(() => {});
    return;
  }

  // `estimateRegistration` and `waitForGeneratedDust` both need the DUST wallet's
  // generation-event history, which on Preprod is a multi-hour cold scan (see
  // wallet.ts). `--direct` skips straight to building the registration and lets
  // the node judge whether it can pay for itself.
  if (!opts.direct) {
    const { fee } = await bundle.facade.estimateRegistration(unregistered);
    note(`Registration fee: ${fee} DUST.`);

    const timeoutMs = Number(opts.timeout ?? 600_000);
    note(`Waiting for the projected DUST to cover the fee (up to ${Math.round(timeoutMs / 1000)}s)…`);
    await bundle.facade.waitForGeneratedDust(unregistered, fee, { timeoutMs });
    ok('Projected DUST covers the fee.');
  } else {
    warn('--direct: skipping fee estimation and the projected-DUST wait.');
  }

  const recipe = await bundle.facade.registerNightUtxosForDustGeneration(
    unregistered,
    bundle.keystore.getPublicKey(),
    (payload: Uint8Array) => bundle.keystore.signData(payload),
  );
  const tx = await bundle.facade.finalizeRecipe(recipe);
  note('Submitting the registration transaction…');
  const res = await bundle.facade.submitTransaction(tx);

  const hash = (res as any)?.hash ?? (res as any)?.txHash ?? (res as any)?.transaction?.hash ?? null;
  console.log();
  ok('Registered for DUST generation.');
  if (hash) console.log(`  tx  ${chalk.bold(String(hash))}`);
  console.log();
  note('DUST generates over roughly 5 minutes. Then deploy:  nominee deploy');

  await bundle.facade.stop().catch(() => {});
}
