// SPDX-License-Identifier: Apache-2.0
//
// One function per circuit. Each runs the circuit and prints the two-panel
// view: what happened, and what the chain actually saw.
//
// LIVE steps go through the proof server and the devnet.
// SIMULATOR steps run the same compiled circuit with no proof and no ledger,
// the assertions are identical, only the proof and the chain are absent.
import { randomBytes } from 'node:crypto';
import type { LiveSession, SimSession } from '../session.js';
import type { Heir, Owner } from '../witnesses.js';
import { ownerTag } from '../crypto.js';
import {
  panel, short, NOWHERE, HIDDEN, NEVER, UNDISCLOSED, ok, fail, note,
} from '../display.js';
import type { TxRecord } from '../state.js';

export const nowSeconds = () => BigInt(Math.floor(Date.now() / 1000));
export const randomBytes32 = () => new Uint8Array(randomBytes(32));

const rec = (circuit: string, r: { txHash: string | null; block: number | null }): TxRecord => ({
  circuit, txHash: r.txHash, block: r.block, status: 'accepted',
});

// ---------------------------------------------------------------------------
// LIVE steps
// ---------------------------------------------------------------------------

export async function stepRegister(s: LiveSession, owner: Owner): Promise<TxRecord> {
  const r = await s.call('register');
  const tag = s.tag(owner);
  panel('register', [
    `${owner.name} joins the registry.`,
    'She proves she is in the deployed cohort without saying which member she is.',
  ], [
    ['ownerTag', short(tag)],
    ['cohort root', 'unchanged'],
    ['lastSeen[tag]', '0'],
    [`${owner.name}'s name`, NOWHERE],
    ['which cohort member', UNDISCLOSED],
    ['the will itself', NEVER],
    ['block', String(r.block ?? ', ')],
  ]);
  return rec('register', r);
}

export async function stepDeposit(
  s: LiveSession, owner: Owner, coin: { nonce: Uint8Array; color: Uint8Array; value: bigint },
): Promise<TxRecord> {
  const r = await s.call('deposit', coin);
  panel('deposit', [
    `${owner.name} funds the vault with a shielded coin.`,
    'This is real shielded custody on the devnet, the contract now holds value.',
  ], [
    ['ownerTag', short(s.tag(owner))],
    ['coin nonce', short(coin.nonce)],
    ['coin colour', short(coin.color) + ' (native)'],
    ['who deposited', NOWHERE],
    ['linked wallet', NOWHERE],
    ['block', String(r.block ?? ', ')],
  ]);
  return rec('deposit', r);
}

export async function stepHeartbeat(
  s: LiveSession, owner: Owner, now: bigint, label = 'heartbeat',
): Promise<TxRecord> {
  const r = await s.call('heartbeat', now);
  panel(label, [
    `${owner.name} proves she is alive.`,
    'Membership in the cohort is proven; her identity is not.',
  ], [
    ['ownerTag', short(s.tag(owner))],
    ['lastSeen[tag]', String(now) + ' (unix s)'],
    ['who checked in', UNDISCLOSED],
    ['the will contents', NEVER],
    ['block', String(r.block ?? ', ')],
  ]);
  return rec(label, r);
}

export async function stepUpdateWill(s: LiveSession, owner: Owner, version: bigint): Promise<TxRecord> {
  const r = await s.call('updateWill');
  panel('update-will', [
    `${owner.name} amends her will.`,
    'A new beneficiary root replaces the old one. Neither version is revealed.',
  ], [
    ['ownerTag', short(s.tag(owner))],
    ['vaultRoot', 'replaced'],
    ['willVersion', String(version)],
    ['old beneficiaries', NEVER],
    ['new beneficiaries', HIDDEN],
    ['what changed', UNDISCLOSED],
    ['block', String(r.block ?? ', ')],
  ]);
  return rec('updateWill', r);
}

export async function stepResolve(
  s: LiveSession, owner: Owner, deadline: bigint,
): Promise<TxRecord> {
  const r = await s.call('resolve', s.tag(owner), deadline);
  panel('resolve', [
    'The grace period has elapsed with no heartbeat.',
    'Anyone may call this, no privileged keeper, no operator.',
  ], [
    ['ownerTag', short(s.tag(owner))],
    ['deadline', String(deadline) + ' (unix s)'],
    ['resolvedVault', '+1 entry'],
    ['who called resolve', 'anyone, permissionless'],
    ['why the heartbeat stopped', NOWHERE],
    ['block', String(r.block ?? ', ')],
  ]);
  return rec('resolve', r);
}

export async function stepGuardianResolve(
  s: LiveSession, owner: Owner, g0: bigint, g1: bigint,
): Promise<TxRecord> {
  const r = await s.call('guardianResolve2of3', s.tag(owner), g0, g1);
  panel('guardian-resolve', [
    'Two of three guardians attest the owner is gone.',
    'This short-circuits the grace period, no waiting.',
  ], [
    ['ownerTag', short(s.tag(owner))],
    ['guardians', `#${g0} and #${g1} of 3`],
    ['signatures', 'verified in-circuit'],
    ['guardian private keys', NEVER],
    ['what they attested to', UNDISCLOSED],
    ['block', String(r.block ?? ', ')],
  ]);
  return rec('guardianResolve2of3', r);
}

// ---------------------------------------------------------------------------
// SIMULATOR steps, the payout path
// ---------------------------------------------------------------------------

export function simClaim(sim: SimSession, index: number, heir: Heir, heirKey: Uint8Array) {
  sim.patch({ activeHeir: index });
  sim.refreshCoin();
  const tag = sim.tag();
  const before = sim.ledger.heldCoin.lookup(tag).value;
  sim.call('claim', tag, { bytes: heirKey });
  const after = sim.ledger.heldCoin.lookup(tag).value;

  panel(`claim, nominee ${index + 1}`, [
    `${heir.name} claims their share.`,
    'They prove membership in the beneficiary set and spend a one-time nullifier.',
    `Received: ${heir.share} tokens.`,
  ], [
    ['nullifier', 'spent (+1)'],
    ['spent set size', String(sim.ledger.spent.size())],
    ['residual', `${after} (was ${before})`],
    [`${heir.name}'s identity`, NOWHERE],
    ['share amount', HIDDEN],
    ['how many nominees', NOWHERE],
    ['which nominee claimed', UNDISCLOSED],
  ], 'SIMULATOR');
  return after;
}

/** Run an attack and report that it was refused. */
export function simAttack(label: string, narrative: string[], fn: () => void, expect: RegExp) {
  try {
    fn();
    fail(`${label}: NOT rejected, this is a bug`);
    return false;
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    const matched = expect.test(msg);
    const reason = (msg.match(expect) ?? [msg.split('\n')[0].slice(0, 60)])[0];
    panel(label, narrative, [
      ['result', 'REJECTED'],
      ['reason', reason],
      ['state change', 'none'],
      ['what the attacker learned', NOWHERE],
    ], 'SIMULATOR');
    if (matched) ok(`${label} correctly refused`);
    else note(`${label} refused (${reason})`);
    return true;
  }
}

// ---------------------------------------------------------------------------
// SIMULATOR equivalents of the on-chain steps, so the story is complete even
// when no node is reachable. Same circuits, same assertions, no proof, no chain.
// ---------------------------------------------------------------------------

export function simRegister(sim: SimSession, owner: Owner, quiet = false) {
  sim.call('register');
  if (quiet) return;
  panel('register', [
    `${owner.name} joins the registry.`,
    'She proves she is in the deployed cohort without saying which member she is.',
  ], [
    ['ownerTag', short(sim.tag())],
    ['lastSeen[tag]', '0'],
    [`${owner.name}'s name`, NOWHERE],
    ['which cohort member', UNDISCLOSED],
    ['the will itself', NEVER],
  ], 'SIMULATOR');
}

export function simDeposit(sim: SimSession, owner: Owner, value: bigint, quiet = false) {
  sim.call('deposit', { nonce: randomBytes32(), color: new Uint8Array(32), value });
  sim.refreshCoin();
  if (quiet) return;
  panel('deposit', [
    `${owner.name} funds the vault with a shielded coin.`,
    'The contract now holds value on her behalf.',
  ], [
    ['ownerTag', short(sim.tag())],
    ['coin colour', 'native'],
    ['who deposited', NOWHERE],
    ['linked wallet', NOWHERE],
  ], 'SIMULATOR');
}

export function simHeartbeat(sim: SimSession, owner: Owner, now: bigint, label = 'heartbeat', quiet = false) {
  sim.call('heartbeat', now);
  if (quiet) return;
  panel(label, [
    `${owner.name} proves she is alive.`,
    'Membership in the cohort is proven; her identity is not.',
  ], [
    ['ownerTag', short(sim.tag())],
    ['lastSeen[tag]', `${now} (unix s)`],
    ['who checked in', UNDISCLOSED],
    ['the will contents', NEVER],
  ], 'SIMULATOR');
}

export function simUpdateWill(sim: SimSession, owner: Owner, newRoot: { field: bigint }, quiet = false) {
  sim.patch({ newVaultRoot: newRoot });
  sim.call('updateWill');
  if (quiet) return;
  panel('update-will', [
    `${owner.name} amends her will.`,
    'A new beneficiary root replaces the old one. Neither version is revealed.',
  ], [
    ['ownerTag', short(sim.tag())],
    ['willVersion', String(sim.ledger.willVersion.lookup(sim.tag()))],
    ['old beneficiaries', NEVER],
    ['new beneficiaries', HIDDEN],
    ['what changed', UNDISCLOSED],
  ], 'SIMULATOR');
}

export function simResolve(sim: SimSession, deadline: bigint, quiet = false) {
  sim.call('resolve', sim.tag(), deadline);
  if (quiet) return;
  panel('resolve', [
    'The grace period has elapsed with no heartbeat.',
    'Anyone may call this, no privileged keeper, no operator.',
  ], [
    ['ownerTag', short(sim.tag())],
    ['deadline', `${deadline} (unix s)`],
    ['resolvedVault', '+1 entry'],
    ['who called resolve', 'anyone, permissionless'],
    ['why the heartbeat stopped', NOWHERE],
  ], 'SIMULATOR');
}

export function simGuardianResolve(sim: SimSession, owner: Owner, g0: bigint, g1: bigint, quiet = false) {
  sim.patch({ attesting: [Number(g0), Number(g1)] });
  sim.call('guardianResolve2of3', sim.tag(), g0, g1);
  if (quiet) return;
  panel('guardian-resolve', [
    'Two of three guardians attest the owner is gone.',
    'This short-circuits the grace period, no waiting.',
  ], [
    ['ownerTag', short(sim.tag())],
    ['guardians', `#${g0} and #${g1} of 3`],
    ['signatures', 'verified in-circuit'],
    ['guardian private keys', NEVER],
    ['what they attested to', UNDISCLOSED],
  ], 'SIMULATOR');
}
