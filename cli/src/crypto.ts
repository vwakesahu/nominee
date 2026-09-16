// SPDX-License-Identifier: Apache-2.0
//
// Merkle and Schnorr helpers that use the CONTRACT'S OWN hashing and EC
// methods, so anything computed here matches what the circuit computes by
// construction rather than by reimplementation.
//
// The Jubjub subgroup order below was verified empirically against the
// runtime: scalars >= L are rejected ("failed to decode for built-in type
// EmbeddedFr"), and s*G == A + c*P holds for s = (r + c*x) mod L.
import { randomBytes } from 'node:crypto';
import { constructJubjubPoint, jubjubPointX, jubjubPointY } from '@midnight-ntwrk/compact-runtime';

/** Jubjub subgroup order. */
export const JUBJUB_ORDER =
  6554484396890773809930967563523245729705921265872317281365359162392183254199n;

/** Matches TWO_248 in the Schnorr polyfill. */
const TWO_248 =
  452312848583266388373324160190187140051835877600158453279131187530910662656n;

export type Entry = { sibling: { field: bigint }; goes_left: boolean };
export type Path = { leaf: Uint8Array; path: Entry[] };
export type JubjubPoint = any;
export type SchnorrSignature = { announcement: JubjubPoint; response: bigint };

/** The subset of the generated contract we borrow. */
// Variant indices are read off contract/out/contract/index.js for THIS contract:
//   _persistentHash_1  LeafPreimage{domain_sep: Bytes<6>, data: Bytes<32>}  (Merkle leaf)
//   _persistentHash_2  Uint<128>                                            (share)
//   _persistentHash_3  Vector<2, Bytes<32>>                                 (leaves, nullifier)
//   _persistentHash_4  Vector<3, Bytes<32>>                                 (owner tag)
//   _transientHash_0   SchnorrHashInput                                     (challenge)
//   _transientHash_1   Vector<2, Field>                                     (Merkle node)
export interface Hasher {
  _ownerTag_0(sk: Uint8Array, wr: Uint8Array): Uint8Array;
  _persistentHash_1(v: { domain_sep: Uint8Array; data: Uint8Array }): Uint8Array;
  _persistentHash_2(v: bigint): Uint8Array;
  _persistentHash_3(v: [Uint8Array, Uint8Array]): Uint8Array;
  _persistentHash_4(v: [Uint8Array, Uint8Array, Uint8Array]): Uint8Array;
  _transientHash_0(v: any): bigint;   // SchnorrHashInput, the Schnorr challenge
  _transientHash_1(v: [bigint, bigint]): bigint;  // Vector<2,Field>, Merkle node
  _degradeToTransient_0(b: Uint8Array): bigint;
  _ecMulGenerator_0(s: bigint): JubjubPoint;
  _ecMul_0(p: JubjubPoint, s: bigint): JubjubPoint;
  _ecAdd_0(a: JubjubPoint, b: JubjubPoint): JubjubPoint;
  _jubjubPointX_0(p: JubjubPoint): bigint;
  _jubjubPointY_0(p: JubjubPoint): bigint;
}

const MDN_LH = new Uint8Array([109, 100, 110, 58, 108, 104]); // "mdn:lh"

/** pad(32, s), right-zero-pad an ASCII literal to 32 bytes, as Compact does. */
export function pad32(s: string): Uint8Array {
  const out = new Uint8Array(32);
  out.set(new TextEncoder().encode(s));
  return out;
}

export const rand32 = () => new Uint8Array(randomBytes(32));

// ---------------------------------------------------------------------------
// Merkle
// ---------------------------------------------------------------------------

/**
 * Sparse fixed-depth tree. `leaves` occupy slots 0..n-1; every other slot holds
 * 32 zero bytes, so only O(depth) hashing is needed per path.
 */
export class SparseTree {
  private emptyAt: bigint[] = [];
  private base: bigint[];

  constructor(private c: Hasher, readonly depth: number, leaves: Uint8Array[]) {
    const leafDigest = (b: Uint8Array) =>
      c._degradeToTransient_0(c._persistentHash_1({ domain_sep: MDN_LH, data: b }));
    this.base = leaves.map(leafDigest);
    let e = leafDigest(new Uint8Array(32));
    for (let l = 0; l < depth; l++) { this.emptyAt.push(e); e = c._transientHash_1([e, e]); }
    this.emptyAt.push(e);
  }

  private node(level: number, index: number): bigint {
    if (level === 0) return index < this.base.length ? this.base[index] : this.emptyAt[0];
    if (index * (1 << level) >= this.base.length) return this.emptyAt[level];
    return this.c._transientHash_1([
      this.node(level - 1, index * 2),
      this.node(level - 1, index * 2 + 1),
    ]);
  }

  pathFor(i: number): Entry[] {
    const out: Entry[] = [];
    let idx = i;
    for (let level = 0; level < this.depth; level++) {
      const goesLeft = idx % 2 === 0;
      out.push({ sibling: { field: this.node(level, goesLeft ? idx + 1 : idx - 1) }, goes_left: goesLeft });
      idx = Math.floor(idx / 2);
    }
    return out;
  }

  root(): bigint { return this.node(this.depth, 0); }
  digest(): { field: bigint } { return { field: this.root() }; }
}

/** Owner leaf: persistentHash([ownerSecret, willRoot]) */
export const ownerLeaf = (c: Hasher, sk: Uint8Array, willRoot: Uint8Array) =>
  c._persistentHash_3([sk, willRoot]);

/** Owner tag, the contract's own circuit, so it cannot drift. */
export const ownerTag = (c: Hasher, sk: Uint8Array, willRoot: Uint8Array) =>
  c._ownerTag_0(sk, willRoot);

/** Heir leaf: persistentHash([heirSecret, persistentHash(share)]) */
export const heirLeaf = (c: Hasher, sk: Uint8Array, share: bigint) =>
  c._persistentHash_3([sk, c._persistentHash_2(share)]);

/** Nullifier: persistentHash([pad32("nominee:nf:v1"), heirSecret]) */
export const nullifier = (c: Hasher, sk: Uint8Array) =>
  c._persistentHash_3([pad32('nominee:nf:v1'), sk]);

// ---------------------------------------------------------------------------
// Schnorr over Jubjub, matches contract/src/schnorr.compact exactly
// ---------------------------------------------------------------------------

const randScalar = (): bigint => {
  // rejection-free: 256 random bits reduced mod L, then forced non-zero
  const v = BigInt('0x' + randomBytes(32).toString('hex')) % JUBJUB_ORDER;
  return v === 0n ? 1n : v;
};

/**
 * Guardian keys are stored as PLAIN COORDINATES, never as live wasm objects.
 *
 * A wasm-bindgen value is consumed when it is passed into another wasm call.
 * The deploy path hands the private state to the SDK *and* passes guardian
 * points as constructor arguments, so a shared live object is moved by the
 * first use and the second use reads a dangling pointer, which surfaces far
 * away as "expected instance of ContractMaintenanceAuthority". Rebuilding the
 * point on each access keeps every use independent.
 */
export interface GuardianKey { sk: bigint; x: bigint; y: bigint }

/** A fresh JubjubPoint for this key. Never cache the result. */
export const guardianPk = (k: GuardianKey): JubjubPoint => constructJubjubPoint(k.x, k.y);

export function guardianKeypair(c: Hasher): GuardianKey {
  const sk = randScalar();
  const p = c._ecMulGenerator_0(sk);
  return { sk, x: jubjubPointX(p), y: jubjubPointY(p) };
}

/** The challenge the circuit will recompute, and its 248-bit reduction. */
export function schnorrChallenge(
  c: Hasher, announcement: JubjubPoint, pk: JubjubPoint, msg: bigint[],
): { cFull: bigint; q: bigint; cTruncated: bigint } {
  const cFull = c._transientHash_0({
    ann_x: c._jubjubPointX_0(announcement),
    ann_y: c._jubjubPointY_0(announcement),
    pk_x: c._jubjubPointX_0(pk),
    pk_y: c._jubjubPointY_0(pk),
    msg,
  });
  return { cFull, q: cFull / TWO_248, cTruncated: cFull % TWO_248 };
}

/**
 * Sign `msg` under `key`. The circuit verifies
 *   ecMulGenerator(response) == ecAdd(announcement, ecMul(pk, cTruncated))
 * so response = (r + cTruncated * sk) mod L.
 */
export function schnorrSign(c: Hasher, key: GuardianKey, msg: bigint[]): SchnorrSignature {
  const r = randScalar();
  const announcement = c._ecMulGenerator_0(r);
  const { cTruncated } = schnorrChallenge(c, announcement, guardianPk(key), msg);
  const response = (r + cTruncated * key.sk) % JUBJUB_ORDER;
  return { announcement, response };
}

/** The `getSchnorrReduction` witness the polyfill asks for. */
export function schnorrReduction(cFull: bigint): [bigint, bigint] {
  return [cFull / TWO_248, cFull % TWO_248];
}

/** The message both guardian circuits sign: [1, 0, 0, 0]. */
export const GUARDIAN_MSG: bigint[] = [1n, 0n, 0n, 0n];
