// SPDX-License-Identifier: Apache-2.0
//
// The public ledger view the web app shows, plus the claim preconditions.
// Seconds are JSON numbers; Uint<128> values are decimal strings.
import type { Ledger } from '../../contract/out/contract/index.js';

export type VaultStatus = 'unknown' | 'alive' | 'grace-lapsed' | 'challenge' | 'resolved' | 'empty';

export interface VaultView {
  tag: string;
  known: boolean;
  /** Unix seconds of the last heartbeat (0 = registered, never heartbeat). */
  lastSeen: number | null;
  graceSeconds: number;
  challengeSeconds: number;
  /** lastSeen + graceSeconds, when the vault becomes resolvable. */
  deadline: number | null;
  /** End of an open veto window, or null when none is open. */
  challengeUntil: number | null;
  resolved: boolean;
  /** Nullifiers spent across the registry (the ledger does not attribute them to a vault). */
  claimsSpent: number;
  /** heldCoin.value as a decimal string, or null when nothing is outstanding. */
  remaining: string | null;
  willVersion: number | null;
  status: VaultStatus;
  /** Server clock, Unix seconds, so the UI can phrase "n minutes left". */
  now: number;
}

export function vaultView(ledger: Ledger, tag: Uint8Array, tagHex: string, now = Math.floor(Date.now() / 1000)): VaultView {
  const known = ledger.lastSeen.member(tag);
  const lastSeen = known ? Number(ledger.lastSeen.lookup(tag)) : null;
  const graceSeconds = Number(ledger.graceSeconds);
  const challengeSeconds = Number(ledger.challengeSeconds);
  const challengeUntil = ledger.challengeUntil.member(tag) ? Number(ledger.challengeUntil.lookup(tag)) : null;
  const resolved = ledger.resolvedVault.member(tag);
  const remaining = ledger.heldCoin.member(tag) ? ledger.heldCoin.lookup(tag).value.toString() : null;
  const willVersion = ledger.willVersion.member(tag) ? Number(ledger.willVersion.lookup(tag)) : null;
  const deadline = lastSeen === null ? null : lastSeen + graceSeconds;

  let status: VaultStatus;
  if (!known && !resolved) status = 'unknown';
  else if (resolved) status = remaining === null || remaining === '0' ? 'empty' : 'resolved';
  else if (challengeUntil !== null) status = 'challenge';
  else if (deadline !== null && now >= deadline) status = 'grace-lapsed';
  else status = 'alive';

  return {
    tag: tagHex, known, lastSeen, graceSeconds, challengeSeconds, deadline, challengeUntil,
    resolved, claimsSpent: Number(ledger.spent.size()), remaining, willVersion, status, now,
  };
}

/** Why a claim cannot proceed yet, in the words the circuit would use; null when it can. */
export function claimBlocker(v: VaultView): string | null {
  if (v.status === 'unknown') return 'unknown owner';
  if (v.resolved) {
    if (v.remaining === null || v.remaining === '0') return 'vault is empty';
    return null;
  }
  if (v.challengeUntil !== null) return `challenge window open until ${new Date(v.challengeUntil * 1000).toISOString()}`;
  return 'vault not resolved';
}

/** Map a circuit failure to the assert message the contract raised. */
export function circuitReason(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const known = [
    'vault not resolved', 'not a beneficiary', 'already claimed', 'share exceeds remaining',
    'unknown owner', 'no open challenge', 'challenge window still open', 'grace not elapsed',
    'Invalid attestation signature', 'failed assert',
  ];
  for (const k of known) if (msg.includes(k)) return k === 'failed assert' ? msg : k;
  return msg;
}
