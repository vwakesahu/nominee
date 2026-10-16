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
import { describeErr } from '../session.js';
import type { Heir, Owner } from '../witnesses.js';
import { DEVICE_URL } from '../config.js';
import {
  panel, short, NOWHERE, HIDDEN, NEVER, UNDISCLOSED, ok, fail, note,
} from '../display.js';
import type { TxRecord } from '../state.js';

export const nowSeconds = () => BigInt(Math.floor(Date.now() / 1000));
export const randomBytes32 = () => new Uint8Array(randomBytes(32));

const rec = (circuit: string, r: { txHash: string | null; block: number | null }): TxRecord => ({
  circuit, txHash: r.txHash, block: r.block, status: 'accepted',
});
const blockRow = (r: { block: number | null }): [string, string] => ['block', String(r.block ?? '—')];
const txRow = (r: { txHash: string | null }): [string, string] => ['tx', short(r.txHash ?? '')];
const remainingText = (v: bigint | null) => v === null ? 'none, entry removed' : `${v}`;

/**
 * Ask the external device (nominee device, or an ESP32 speaking the same
 * endpoints) to sign the heartbeat timestamp. Returns null when no device is
 * configured, in which case the owner's key signs in-process.
 */
export async function deviceSignature(now: bigint) {
  if (!DEVICE_URL) return null;
  const r = await fetch(`${DEVICE_URL.replace(/\/$/, '')}/sign`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ now: now.toString() }),
  });
  if (r.status === 409) throw new Error('device: no pulse, the heartbeat is refused by the device itself');
  if (!r.ok) throw new Error(`device: HTTP ${r.status}`);
  return (await r.json()) as { announcement: { x: string; y: string }; response: string };
}

// ---------------------------------------------------------------------------
// LIVE steps
// ---------------------------------------------------------------------------

export async function stepRegister(s: LiveSession, owner: Owner): Promise<TxRecord> {
  const r = await s.call('register');
  const tag = s.tag(owner);
  panel('register', [
    `${owner.name} joins the registry.`,
    'Proof of membership in the deployed cohort, not of which member. The leaf commits to a secret AND a device key.',
  ], [
    ['ownerTag', short(tag)],
    ['cohort root', 'unchanged'],
    ['lastSeen[tag]', '0'],
    [`${owner.name}'s name`, NOWHERE],
    ['which cohort member', UNDISCLOSED],
    ['device public key', NEVER],
    ['the will itself', NEVER],
    txRow(r), blockRow(r),
  ]);
  return rec('register', r);
}

export async function stepDeposit(
  s: LiveSession, owner: Owner, coin: { nonce: Uint8Array; color: Uint8Array; value: bigint },
): Promise<TxRecord> {
  const r = await s.call('deposit', coin);
  panel('deposit', [
    `${owner.name} funds the vault with a shielded coin.`,
    'Real shielded custody: the contract holds the coin and records its Merkle index, so the next claimant needs no indexer lookup.',
  ], [
    ['ownerTag', short(s.tag(owner))],
    ['coin nonce', short(coin.nonce)],
    ['coin value', `${coin.value} (public: the coin is a circuit argument)`],
    ['who deposited', NOWHERE],
    ['linked wallet', NOWHERE],
    txRow(r), blockRow(r),
  ]);
  return rec('deposit', r);
}

export async function stepHeartbeat(
  s: LiveSession, owner: Owner, now: bigint, label = 'heartbeat',
): Promise<TxRecord> {
  const ext = await deviceSignature(now);
  s.patch({ deviceSignature: ext ?? undefined });
  let r;
  try { r = await s.heartbeat(now); }
  finally { s.patch({ deviceSignature: undefined }); }
  panel(label, [
    `${owner.name} proves she is alive. Two factors: she knows the secret, and her device signed the timestamp` +
      (ext ? ' (external device, pulse present).' : ' (in-process stand-in).'),
    'Membership in the cohort is proven; her identity is not.',
  ], [
    ['ownerTag', short(s.tag(owner))],
    ['lastSeen[tag]', String(now) + ' (unix s)'],
    ['device signature', 'verified in-circuit'],
    ['device public key', NEVER],
    ['who checked in', UNDISCLOSED],
    ['the will contents', NEVER],
    txRow(r), blockRow(r),
  ]);
  return rec(label, r);
}

export async function stepUpdateWill(
  s: LiveSession, owner: Owner, newRoot: { field: bigint }, version: bigint,
): Promise<TxRecord> {
  s.patch({ newVaultRoot: newRoot });
  const r = await s.call('updateWill');
  panel('update-will', [
    `${owner.name} writes her will: three nominees, three shares, each bound to the nominee's own payout key.`,
    'Only the Merkle root is published. Neither version of the will is revealed.',
  ], [
    ['ownerTag', short(s.tag(owner))],
    ['vaultRoot', short(newRoot.field)],
    ['willVersion', String(version)],
    ['beneficiaries', HIDDEN],
    ['how many', NOWHERE],
    ['shares', HIDDEN],
    txRow(r), blockRow(r),
  ]);
  return rec('updateWill', r);
}

export async function stepResolve(
  s: LiveSession, owner: Owner, deadline: bigint, challenge: bigint,
): Promise<TxRecord> {
  const r = await s.call('resolve', s.tag(owner), deadline);
  panel('resolve', [
    'The grace period has elapsed with no heartbeat.',
    'Anyone may call this. It does NOT unlock the vault: it opens a veto window. Death is never asserted, only absence, and absence can be contested.',
  ], [
    ['ownerTag', short(s.tag(owner))],
    ['deadline', String(deadline) + ' (unix s)'],
    ['challengeUntil[tag]', `${deadline + challenge} (unix s)`],
    ['resolvedVault', 'unchanged'],
    ['who called resolve', 'anyone, permissionless'],
    ['why the heartbeat stopped', NOWHERE],
    txRow(r), blockRow(r),
  ]);
  return rec('resolve', r);
}

export async function stepFinalize(s: LiveSession, owner: Owner, until: bigint): Promise<TxRecord> {
  const r = await s.finalize(s.tag(owner), until);
  panel('finalize', [
    'The veto window closed with no veto, no heartbeat and no guardian objection.',
    'The vault unlocks. Permissionless.',
  ], [
    ['ownerTag', short(s.tag(owner))],
    ['until', String(until) + ' (unix s)'],
    ['challengeUntil[tag]', 'removed'],
    ['resolvedVault', '+1 entry'],
    ['who finalized', 'anyone, permissionless'],
    txRow(r), blockRow(r),
  ]);
  return rec('finalize', r);
}

export async function stepVeto(s: LiveSession, owner: Owner, now: bigint): Promise<TxRecord> {
  const r = await s.veto(now);
  panel('veto', [
    `${owner.name} is alive but his device is hidden. With his secret alone he contests the window.`,
    'Knowledge only, no device. Someone holding only the seed can DELAY inheritance; they can never redirect it.',
  ], [
    ['ownerTag', short(s.tag(owner))],
    ['challengeUntil[tag]', 'removed'],
    ['lastSeen[tag]', String(now) + ' (unix s)'],
    ['who vetoed', UNDISCLOSED],
    ['device signature', 'not required'],
    txRow(r), blockRow(r),
  ]);
  return rec('veto', r);
}

export async function stepGuardianResolve(
  s: LiveSession, owner: Owner, g0: bigint, g1: bigint,
): Promise<TxRecord> {
  const r = await s.guardianResolve2of3(s.tag(owner), g0, g1);
  panel('guardian-resolve', [
    'Two of three guardians attest the owner is gone.',
    'Their signatures are bound to THIS vault tag, so they cannot be replayed against another vault. This short-circuits the grace period.',
  ], [
    ['ownerTag', short(s.tag(owner))],
    ['guardians', `#${g0} and #${g1} of 3`],
    ['signatures', 'verified in-circuit'],
    ['guardian private keys', NEVER],
    ['resolvedVault', '+1 entry'],
    txRow(r), blockRow(r),
  ]);
  return rec('guardianResolve2of3', r);
}

/** A LIVE claim: a real shielded payout from the contract to the heir's bound key. */
export async function stepClaim(
  s: LiveSession, owner: Owner, index: number, heir: Heir,
): Promise<TxRecord & { remaining: bigint | null }> {
  const tag = s.tag(owner);
  const before = await s.remaining(tag);
  const r = await s.claim(tag, index);
  const after = await s.remaining(tag);
  const l = await s.ledger();
  panel(`claim, nominee ${index + 1}`, [
    `${heir.name} claims their share: ${heir.share} tokens, paid by the contract to the key the owner bound into their leaf.`,
    'They prove membership in the beneficiary set and spend a one-time nullifier. No wallet connection, no identity.',
  ], [
    ['nullifier', 'spent (+1)'],
    ['spent set size', String(l?.spent.size() ?? '?')],
    ['heldCoin[tag]', `${remainingText(after)} (was ${remainingText(before)})`],
    ['payout key', short(heir.key)],
    [`${heir.name}'s identity`, NOWHERE],
    ['share amount', HIDDEN],
    ['how many nominees', NOWHERE],
    txRow(r), blockRow(r),
  ]);
  return { ...rec('claim', r), remaining: after };
}

/** Run a LIVE call that the circuit must refuse. The refusal happens at circuit execution, before any proof. */
export async function liveRefusal(
  label: string, narrative: string[], fn: () => Promise<unknown>, expect: RegExp,
): Promise<TxRecord> {
  try {
    await fn();
    fail(`${label}: NOT rejected, this is a bug`);
    return { circuit: label, txHash: null, block: null, status: 'accepted', error: 'unexpectedly accepted' };
  } catch (e: any) {
    const msg = describeErr(e);
    const reason = (msg.match(expect) ?? [msg.split('\n')[0].slice(0, 60)])[0];
    panel(label, narrative, [
      ['result', 'REJECTED'],
      ['reason', reason],
      ['state change', 'none'],
      ['transaction', 'never built'],
    ]);
    if (expect.test(msg)) ok(`${label} correctly refused`);
    else note(`${label} refused (${reason})`);
    return { circuit: label, txHash: null, block: null, status: 'rejected', error: reason, expected: true };
  }
}

// ---------------------------------------------------------------------------
// SIMULATOR steps
// ---------------------------------------------------------------------------

const SIM = 'SIMULATOR';

export function simClaim(sim: SimSession, tag: Uint8Array, index: number, heir: Heir, quiet = false) {
  const before = sim.remaining(tag);
  sim.claim(tag, index);
  const after = sim.remaining(tag);
  if (quiet) return after;
  panel(`claim, nominee ${index + 1}`, [
    `${heir.name} claims their share: ${heir.share} tokens, paid to the key the owner bound into their leaf.`,
    'They prove membership in the beneficiary set and spend a one-time nullifier.',
  ], [
    ['nullifier', 'spent (+1)'],
    ['spent set size', String(sim.ledger.spent.size())],
    ['heldCoin[tag]', `${remainingText(after)} (was ${remainingText(before)})`],
    ['payout key', short(heir.key)],
    [`${heir.name}'s identity`, NOWHERE],
    ['share amount', HIDDEN],
    ['how many nominees', NOWHERE],
  ], SIM);
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
    ], SIM);
    if (matched) ok(`${label} correctly refused`);
    else note(`${label} refused (${reason})`);
    return true;
  }
}

// Simulator equivalents of the on-chain steps, so the story is complete even
// when no node is reachable. Same circuits, same assertions, no proof, no chain.

export function simRegister(sim: SimSession, owner: Owner, quiet = false) {
  sim.call('register');
  if (quiet) return;
  panel('register', [
    `${owner.name} joins the registry.`,
    'Proof of membership in the deployed cohort, not of which member. The leaf commits to a secret AND a device key.',
  ], [
    ['ownerTag', short(sim.tag(owner))],
    ['lastSeen[tag]', '0'],
    [`${owner.name}'s name`, NOWHERE],
    ['which cohort member', UNDISCLOSED],
    ['device public key', NEVER],
    ['the will itself', NEVER],
  ], SIM);
}

export function simDeposit(sim: SimSession, owner: Owner, value: bigint, quiet = false) {
  sim.call('deposit', { nonce: randomBytes32(), color: new Uint8Array(32), value });
  if (quiet) return;
  panel('deposit', [
    `${owner.name} funds the vault with a shielded coin.`,
    'The contract holds the coin and records its Merkle index for the next claimant.',
  ], [
    ['ownerTag', short(sim.tag(owner))],
    ['coin value', `${value} (public: the coin is a circuit argument)`],
    ['who deposited', NOWHERE],
    ['linked wallet', NOWHERE],
  ], SIM);
}

export function simHeartbeat(sim: SimSession, owner: Owner, now: bigint, label = 'heartbeat', quiet = false) {
  sim.heartbeat(now);
  if (quiet) return;
  panel(label, [
    `${owner.name} proves she is alive. Two factors: she knows the secret, and her device signed the timestamp.`,
    'Membership in the cohort is proven; her identity is not.',
  ], [
    ['ownerTag', short(sim.tag(owner))],
    ['lastSeen[tag]', `${now} (unix s)`],
    ['device signature', 'verified in-circuit'],
    ['device public key', NEVER],
    ['who checked in', UNDISCLOSED],
    ['the will contents', NEVER],
  ], SIM);
}

export function simUpdateWill(sim: SimSession, owner: Owner, newRoot: { field: bigint }, quiet = false) {
  sim.patch({ newVaultRoot: newRoot });
  sim.call('updateWill');
  if (quiet) return;
  panel('update-will', [
    `${owner.name} writes her will: three nominees, three shares, each bound to the nominee's own payout key.`,
    'Only the Merkle root is published. Neither version of the will is revealed.',
  ], [
    ['ownerTag', short(sim.tag(owner))],
    ['vaultRoot', short(newRoot.field)],
    ['willVersion', String(sim.ledger.willVersion.lookup(sim.tag(owner)))],
    ['beneficiaries', HIDDEN],
    ['how many', NOWHERE],
    ['shares', HIDDEN],
  ], SIM);
}

export function simResolve(sim: SimSession, owner: Owner, deadline: bigint, quiet = false) {
  const tag = sim.tag(owner);
  sim.call('resolve', tag, deadline);
  if (quiet) return;
  panel('resolve', [
    'The grace period has elapsed with no heartbeat.',
    'Anyone may call this. It does NOT unlock the vault: it opens a veto window. Death is never asserted, only absence.',
  ], [
    ['ownerTag', short(tag)],
    ['deadline', `${deadline} (unix s)`],
    ['challengeUntil[tag]', `${sim.ledger.challengeUntil.lookup(tag)} (unix s)`],
    ['resolvedVault', 'unchanged'],
    ['who called resolve', 'anyone, permissionless'],
    ['why the heartbeat stopped', NOWHERE],
  ], SIM);
}

export function simFinalize(sim: SimSession, owner: Owner, until: bigint, quiet = false) {
  const tag = sim.tag(owner);
  sim.finalize(tag, until);
  if (quiet) return;
  panel('finalize', [
    'The veto window closed with no veto, no heartbeat and no guardian objection.',
    'The vault unlocks. Permissionless.',
  ], [
    ['ownerTag', short(tag)],
    ['until', `${until} (unix s)`],
    ['challengeUntil[tag]', 'removed'],
    ['resolvedVault', '+1 entry'],
  ], SIM);
}

export function simVeto(sim: SimSession, owner: Owner, now: bigint, quiet = false) {
  sim.veto(now);
  if (quiet) return;
  panel('veto', [
    `${owner.name} is alive but his device is hidden. With his secret alone he contests the window.`,
    'Knowledge only, no device. A seed alone can DELAY inheritance; it can never redirect it.',
  ], [
    ['ownerTag', short(sim.tag(owner))],
    ['challengeUntil[tag]', 'removed'],
    ['lastSeen[tag]', `${now} (unix s)`],
    ['who vetoed', UNDISCLOSED],
    ['device signature', 'not required'],
  ], SIM);
}

export function simGuardianResolve(sim: SimSession, owner: Owner, g0: bigint, g1: bigint, quiet = false) {
  sim.guardianResolve2of3(sim.tag(owner), g0, g1);
  if (quiet) return;
  panel('guardian-resolve', [
    'Two of three guardians attest the owner is gone.',
    'Their signatures are bound to THIS vault tag. This short-circuits the grace period.',
  ], [
    ['ownerTag', short(sim.tag(owner))],
    ['guardians', `#${g0} and #${g1} of 3`],
    ['signatures', 'verified in-circuit'],
    ['guardian private keys', NEVER],
    ['resolvedVault', '+1 entry'],
  ], SIM);
}

export function simGuardianVeto(sim: SimSession, owner: Owner, g0: bigint, g1: bigint, quiet = false) {
  sim.guardianVeto2of3(sim.tag(owner), g0, g1);
  if (quiet) return;
  panel('guardian-veto', [
    'Two of three guardians contest the window: "we have seen the owner".',
    'Signed over a distinct message kind, so a resolve signature cannot double as a veto.',
  ], [
    ['ownerTag', short(sim.tag(owner))],
    ['guardians', `#${g0} and #${g1} of 3`],
    ['challengeUntil[tag]', 'removed'],
    ['guardian private keys', NEVER],
  ], SIM);
}
