// SPDX-License-Identifier: Apache-2.0
// The one interface both the simulator and the live devnet backend implement.
import type { Envelope } from './envelope.js';
import type { VaultView } from './view.js';

export interface ClaimResult {
  /** Transaction hash, or null in the simulator (nothing was broadcast). */
  txHash: string | null;
  block: number | null;
  /** Decimal Uint<128>: what the heir received (their share). */
  received: string;
  /** Decimal Uint<128> left in the vault after this claim, or null when it is now empty. */
  remaining: string | null;
  /** The nullifier the chain recorded (hex). Reveals nothing about who claimed. */
  nullifier: string;
  /** The payout key from the envelope, the only place the funds can go. */
  heirKey: string;
  simulated: boolean;
}

export class ClaimError extends Error {
  constructor(public readonly reason: string, public readonly status = 409) { super(reason); }
}

export interface Backend {
  readonly mode: 'simulator' | 'live';
  readonly network: string;
  contractAddress(): string;
  vault(tagHex: string): Promise<VaultView>;
  claim(envelope: Envelope): Promise<ClaimResult>;
  /** Simulator only: an envelope for the seeded demo vault. */
  demoEnvelope?(heir: number): Envelope;
}
