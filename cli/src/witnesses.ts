// SPDX-License-Identifier: Apache-2.0
//
// Private state and the witness implementations the circuits read from.
//
// EVERY secret in Nominee arrives through one of these. Circuit *arguments*
// are public; only witnesses are private. This is enforced by the ZKIR leak
// check in test/privacy/leakcheck.py.
import type { DeviceKey, Entry, GuardianKey, SchnorrSignature } from './crypto.js';
import {
  SparseTree, heirLeaf, ownerLeaf, schnorrReduction, schnorrSign,
  deviceMsg, guardianMsg, guardianVetoMsg, fromPlainSignature, type PlainSignature,
} from './crypto.js';

export const OWNER_DEPTH = 16;
export const HEIR_DEPTH = 16;

export interface Heir {
  name: string;
  secret: Uint8Array;
  share: bigint;
  /** The heir's Zswap coin public key (32 bytes), bound into the leaf. */
  key: Uint8Array;
}

export interface Owner {
  name: string;
  secret: Uint8Array;
  willRoot: Uint8Array;
  /** The possession factor. Only its commitment reaches the chain. */
  device: DeviceKey;
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

  /** The timestamp the next heartbeat will carry; the device signs it. Set before each heartbeat. */
  heartbeatNow: bigint;
  /** A signature produced by an external device (nominee device / ESP32), used instead of in-process signing. */
  deviceSignature?: PlainSignature;

  /** Guardian signing keys (off-chain; only public keys reach the contract). */
  guardianKeys: GuardianKey[];
  /** Which guardians are attesting, in strictly increasing id order. */
  attesting: number[];
  /** What the guardians are signing: a resolve or a veto, and for which vault. */
  guardianKind: 'resolve' | 'veto';
  guardianTag: Uint8Array;

  /** Probate disclosure. */
  totalValue: bigint;
  executorId: Uint8Array;
  probateBlind: Uint8Array;
  envelopeCipher: Uint8Array;

  /** Duress PIN. */
  pin: bigint;
}

const ZERO_DIGEST = { field: 0n };
const eq = (a: Uint8Array, b: Uint8Array) => Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0;

/** A mutable handle the CLI can steer between circuit calls. */
export interface StateRef { ps: PrivateState }

/** Every witness the generated Contract requires. The contract validates all are present. */
export const WITNESS_NAMES = [
  'getSchnorrReduction', 'ownerSecret', 'willRoot', 'ownerPath', 'newVaultRoot',
  'heirSecret', 'heirShare', 'heirPath', 'devicePkX', 'devicePkY', 'deviceSig',
  'gSig0', 'gSig1', 'gSig2',
  'totalValue', 'executorId', 'probateBlind', 'envelopeCipher', 'pin', 'decoyRoot',
];

/**
 * Build the witness object the generated Contract requires. The contract
 * validates that every declared witness is present, so all of them are here
 * even when a given command only exercises a few.
 *
 * When `ref` is supplied the witnesses read from it instead of the context's
 * private state. The live SDK owns the private state it threads through calls,
 * so this is how the CLI switches which owner it is acting as. The simulator
 * passes no ref and threads state normally.
 *
 * Path witnesses never refuse: when a leaf is not in the tree they return the
 * acting party's path, so it is the CIRCUIT that says "not a registered owner"
 * or "not a beneficiary", exactly as it would on chain.
 */
export function makeWitnesses(hasher: any, ref?: StateRef): any {
  const st = (ctx: any): PrivateState => (ref ? ref.ps : ctx.privateState);
  const ownerTreeOf = (ps: PrivateState) =>
    ps.ownerTree ??
    (ps.ownerTree = new SparseTree(hasher, OWNER_DEPTH,
      ps.cohort.map((o) => ownerLeaf(hasher, o.secret, o.willRoot, o.device))));

  const heirTreeOf = (ps: PrivateState) =>
    ps.heirTree ??
    (ps.heirTree = new SparseTree(hasher, HEIR_DEPTH,
      ps.heirs.map((h) => heirLeaf(hasher, h.secret, h.share, h.key))));

  const gmsg = (ps: PrivateState) =>
    ps.guardianKind === 'veto' ? guardianVetoMsg(hasher, ps.guardianTag) : guardianMsg(hasher, ps.guardianTag);

  const sig = (ps: PrivateState, slot: number): SchnorrSignature => {
    const which = ps.attesting[slot] ?? 0;   // unused slot: well-formed, irrelevant
    return schnorrSign(hasher, ps.guardianKeys[which], gmsg(ps));
  };

  return {
    getSchnorrReduction: (ctx: any, cFull: bigint) =>
      [ctx.privateState, schnorrReduction(cFull)] as [PrivateState, [bigint, bigint]],

    ownerSecret: (ctx: any) => [ctx.privateState, st(ctx).owner.secret],
    willRoot:    (ctx: any) => [ctx.privateState, st(ctx).owner.willRoot],

    ownerPath: (ctx: any, leaf: Uint8Array) => {
      const ps: PrivateState = st(ctx);
      const tree = ownerTreeOf(ps);
      let i = ps.cohort.findIndex((o) => eq(ownerLeaf(hasher, o.secret, o.willRoot, o.device), leaf));
      if (i < 0) i = Math.max(0, ps.cohort.findIndex((o) => eq(o.secret, ps.owner.secret)));
      return [ctx.privateState, { leaf, path: tree.pathFor(i) as Entry[] }];
    },

    newVaultRoot: (ctx: any) => [ctx.privateState, st(ctx).newVaultRoot ?? ZERO_DIGEST],
    decoyRoot:    (ctx: any) => [ctx.privateState, st(ctx).decoyRoot ?? ZERO_DIGEST],

    heirSecret: (ctx: any) => [ctx.privateState, st(ctx).heirs[st(ctx).activeHeir].secret],
    heirShare:  (ctx: any) => [ctx.privateState, st(ctx).heirs[st(ctx).activeHeir].share],

    heirPath: (ctx: any, leaf: Uint8Array) => {
      const ps: PrivateState = st(ctx);
      const tree = heirTreeOf(ps);
      let i = ps.heirs.findIndex((h) => eq(heirLeaf(hasher, h.secret, h.share, h.key), leaf));
      if (i < 0) i = ps.activeHeir;
      return [ctx.privateState, { leaf, path: tree.pathFor(i) as Entry[] }];
    },

    devicePkX: (ctx: any) => [ctx.privateState, st(ctx).owner.device.x],
    devicePkY: (ctx: any) => [ctx.privateState, st(ctx).owner.device.y],
    deviceSig: (ctx: any) => {
      const ps = st(ctx);
      const s = ps.deviceSignature
        ? fromPlainSignature(ps.deviceSignature)
        : schnorrSign(hasher, ps.owner.device, deviceMsg(ps.heartbeatNow));
      return [ctx.privateState, s];
    },

    gSig0: (ctx: any) => [ctx.privateState, sig(st(ctx), 0)],
    gSig1: (ctx: any) => [ctx.privateState, sig(st(ctx), 1)],
    gSig2: (ctx: any) => [ctx.privateState, sig(st(ctx), 2)],

    totalValue:     (ctx: any) => [ctx.privateState, st(ctx).totalValue],
    executorId:     (ctx: any) => [ctx.privateState, st(ctx).executorId],
    probateBlind:   (ctx: any) => [ctx.privateState, st(ctx).probateBlind],
    envelopeCipher: (ctx: any) => [ctx.privateState, st(ctx).envelopeCipher],

    pin: (ctx: any) => [ctx.privateState, st(ctx).pin],
  };
}
