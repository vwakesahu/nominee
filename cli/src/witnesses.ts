// SPDX-License-Identifier: Apache-2.0
//
// Private state and the witness implementations the circuits read from.
//
// EVERY secret in Nominee arrives through one of these. Circuit *arguments*
// are public; only witnesses are private. This is enforced by the ZKIR leak
// check in test/privacy/leakcheck.py.
import type { Entry, GuardianKey, JubjubPoint, SchnorrSignature } from './crypto.js';
import { SparseTree, heirLeaf, ownerLeaf, schnorrReduction, schnorrSign, GUARDIAN_MSG } from './crypto.js';

export const OWNER_DEPTH = 16;
export const HEIR_DEPTH = 16;

export interface Heir {
  name: string;
  secret: Uint8Array;
  share: bigint;
}

export interface Owner {
  name: string;
  secret: Uint8Array;
  willRoot: Uint8Array;
}

export interface PrivateState {
  /** The owner this CLI instance acts as. */
  owner: Owner;
  /** Every registered owner, so the membership path can be built. */
  cohort: Owner[];
  ownerTree?: SparseTree;

  /** Beneficiaries of this owner's vault. */
  heirs: Heir[];
  heirTree?: SparseTree;
  /** Which heir is currently claiming. */
  activeHeir: number;

  /** Replacement beneficiary root for updateWill. */
  newVaultRoot?: { field: bigint };
  /** Duress decoy root. */
  decoyRoot?: { field: bigint };

  /** The coin the contract currently holds, plus its Zswap qualification. */
  spendCoin?: { nonce: Uint8Array; color: Uint8Array; value: bigint; mt_index: bigint };

  /** Guardian signing keys (off-chain; only public keys reach the contract). */
  guardianKeys: GuardianKey[];
  /** Which guardians are attesting, in strictly increasing id order. */
  attesting: number[];

  /** Probate disclosure. */
  totalValue: bigint;
  executorId: Uint8Array;
  probateBlind: Uint8Array;
  envelopeCipher: Uint8Array;

  /** Duress PIN. */
  pin: bigint;
}

const ZERO32 = new Uint8Array(32);
const ZERO_DIGEST = { field: 0n };

/**
 * Build the witness object the generated Contract requires. The contract
 * validates that every declared witness is present, so all of them are here
 * even when a given command only exercises a few.
 */
export function makeWitnesses(hasher: any) {
  const ownerTreeOf = (ps: PrivateState) =>
    ps.ownerTree ??
    (ps.ownerTree = new SparseTree(hasher, OWNER_DEPTH,
      ps.cohort.map((o) => ownerLeaf(hasher, o.secret, o.willRoot))));

  const heirTreeOf = (ps: PrivateState) =>
    ps.heirTree ??
    (ps.heirTree = new SparseTree(hasher, HEIR_DEPTH,
      ps.heirs.map((h) => heirLeaf(hasher, h.secret, h.share))));

  const sig = (ps: PrivateState, slot: number): SchnorrSignature => {
    const which = ps.attesting[slot];
    if (which === undefined) {
      // Unused slot — a well-formed but irrelevant signature keeps the shape valid.
      return schnorrSign(hasher, ps.guardianKeys[0], GUARDIAN_MSG);
    }
    return schnorrSign(hasher, ps.guardianKeys[which], GUARDIAN_MSG);
  };

  return {
    getSchnorrReduction: (ctx: any, cFull: bigint) =>
      [ctx.privateState, schnorrReduction(cFull)] as [PrivateState, [bigint, bigint]],

    ownerSecret: (ctx: any) => [ctx.privateState, ctx.privateState.owner.secret],
    willRoot:    (ctx: any) => [ctx.privateState, ctx.privateState.owner.willRoot],

    ownerPath: (ctx: any, leaf: Uint8Array) => {
      const ps: PrivateState = ctx.privateState;
      const tree = ownerTreeOf(ps);
      const i = ps.cohort.findIndex(
        (o) => Buffer.compare(Buffer.from(ownerLeaf(hasher, o.secret, o.willRoot)), Buffer.from(leaf)) === 0,
      );
      if (i < 0) throw new Error('ownerPath: leaf is not in the registered cohort');
      return [ps, { leaf, path: tree.pathFor(i) as Entry[] }];
    },

    newVaultRoot: (ctx: any) => [ctx.privateState, ctx.privateState.newVaultRoot ?? ZERO_DIGEST],
    decoyRoot:    (ctx: any) => [ctx.privateState, ctx.privateState.decoyRoot ?? ZERO_DIGEST],

    heirSecret: (ctx: any) => [ctx.privateState, ctx.privateState.heirs[ctx.privateState.activeHeir].secret],
    heirShare:  (ctx: any) => [ctx.privateState, ctx.privateState.heirs[ctx.privateState.activeHeir].share],

    heirPath: (ctx: any, leaf: Uint8Array) => {
      const ps: PrivateState = ctx.privateState;
      const tree = heirTreeOf(ps);
      const i = ps.heirs.findIndex(
        (h) => Buffer.compare(Buffer.from(heirLeaf(hasher, h.secret, h.share)), Buffer.from(leaf)) === 0,
      );
      if (i < 0) throw new Error('heirPath: leaf is not a beneficiary');
      return [ps, { leaf, path: tree.pathFor(i) as Entry[] }];
    },

    spendCoin: (ctx: any) => [
      ctx.privateState,
      ctx.privateState.spendCoin ?? { nonce: ZERO32, color: ZERO32, value: 0n, mt_index: 0n },
    ],

    gSig0: (ctx: any) => [ctx.privateState, sig(ctx.privateState, 0)],
    gSig1: (ctx: any) => [ctx.privateState, sig(ctx.privateState, 1)],
    gSig2: (ctx: any) => [ctx.privateState, sig(ctx.privateState, 2)],

    totalValue:     (ctx: any) => [ctx.privateState, ctx.privateState.totalValue],
    executorId:     (ctx: any) => [ctx.privateState, ctx.privateState.executorId],
    probateBlind:   (ctx: any) => [ctx.privateState, ctx.privateState.probateBlind],
    envelopeCipher: (ctx: any) => [ctx.privateState, ctx.privateState.envelopeCipher],

    pin: (ctx: any) => [ctx.privateState, ctx.privateState.pin],
  };
}
