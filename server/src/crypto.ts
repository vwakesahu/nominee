// SPDX-License-Identifier: Apache-2.0
//
// Hashing, Merkle and Schnorr helpers for the NEW contract (SPEC §0), using
// the generated contract's own hash methods so every value matches the circuit
// by construction.
//
// TODO(cli-live): once cli/src/crypto.ts is rebuilt against the new variant
// indices, replace this file with imports from ../../cli/dist/crypto.js. It is
// duplicated here only so the server builds and runs while that rewrite is in
// flight (cli/dist still carries the old indices at the time of writing).
import { randomBytes } from 'node:crypto';
import { constructJubjubPoint, jubjubPointX, jubjubPointY } from '@midnight-ntwrk/compact-runtime';
import { Contract } from '../../contract/out/contract/index.js';

/** Every witness the generated Contract requires (SPEC §0). */
export const WITNESS_NAMES = [
  'getSchnorrReduction', 'ownerSecret', 'willRoot', 'ownerPath', 'newVaultRoot',
  'heirSecret', 'heirShare', 'heirPath', 'devicePkX', 'devicePkY', 'deviceSig',
  'gSig0', 'gSig1', 'gSig2', 'totalValue', 'executorId', 'probateBlind',
  'envelopeCipher', 'pin', 'decoyRoot',
] as const;

export type Hasher = any;

/** A contract instance used only for its hashing / EC helpers. */
export function makeHasher(): Hasher {
  const vacant: any = {};
  for (const k of WITNESS_NAMES) vacant[k] = () => { throw new Error(`vacant witness ${k}`); };
  return new Contract(vacant);
}

export type Entry = { sibling: { field: bigint }; goes_left: boolean };
export type Path = { leaf: Uint8Array; path: Entry[] };

export const OWNER_DEPTH = 16;
export const HEIR_DEPTH = 16;

export const rand32 = () => new Uint8Array(randomBytes(32));
export const ZERO32 = new Uint8Array(32);

/** pad(32, s): right-zero-pad an ASCII literal to 32 bytes, as Compact does. */
export function pad32(s: string): Uint8Array {
  const out = new Uint8Array(32);
  out.set(new TextEncoder().encode(s));
  return out;
}

export const toHex = (b: Uint8Array) => Buffer.from(b).toString('hex');
export function fromHex(h: string, bytes?: number): Uint8Array {
  const clean = h.startsWith('0x') ? h.slice(2) : h;
  if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2) throw new Error('not hex');
  const out = new Uint8Array(Buffer.from(clean, 'hex'));
  if (bytes !== undefined && out.length !== bytes) throw new Error(`expected ${bytes} bytes, got ${out.length}`);
  return out;
}

// ---------------------------------------------------------------------------
// Hash formulas (SPEC §0, "Off-chain formulas")
// ---------------------------------------------------------------------------

const MDN_LH = new Uint8Array([109, 100, 110, 58, 108, 104]); // "mdn:lh"

export const deviceCommit = (c: Hasher, x: bigint, y: bigint): Uint8Array => c._deviceCommit_0(x, y);
export const ownerLeaf = (c: Hasher, sk: Uint8Array, wr: Uint8Array, dev: { x: bigint; y: bigint }) =>
  c._persistentHash_5([sk, wr, deviceCommit(c, dev.x, dev.y)]) as Uint8Array;
export const ownerTag = (c: Hasher, sk: Uint8Array, wr: Uint8Array): Uint8Array => c._ownerTag_0(sk, wr);
export const heirLeaf = (c: Hasher, sk: Uint8Array, share: bigint, heirKey: Uint8Array) =>
  c._persistentHash_5([sk, c._persistentHash_3(share), heirKey]) as Uint8Array;
export const nullifier = (c: Hasher, sk: Uint8Array) =>
  c._persistentHash_4([pad32('nominee:nf:v1'), sk]) as Uint8Array;

/** Device message: [kind, now, 0, 0]. Kind 2 is a heartbeat, kind 4 a will update. */
export const deviceMsg = (now: bigint, kind: 2 | 4 = 2): bigint[] => [BigInt(kind), now, 0n, 0n];
export const guardianMsg = (c: Hasher, tag: Uint8Array): bigint[] => c._guardianMsg_0(1n, tag);
export const guardianVetoMsg = (c: Hasher, tag: Uint8Array): bigint[] => c._guardianMsg_0(3n, tag);

// ---------------------------------------------------------------------------
// Merkle: sparse fixed-depth tree, slots beyond the leaves are 32 zero bytes
// ---------------------------------------------------------------------------

export class SparseTree {
  private emptyAt: bigint[] = [];
  private base: bigint[];

  constructor(private c: Hasher, readonly depth: number, leaves: Uint8Array[]) {
    const leafDigest = (b: Uint8Array) =>
      c._degradeToTransient_0(c._persistentHash_2({ domain_sep: MDN_LH, data: b }));
    this.base = leaves.map(leafDigest);
    let e = leafDigest(new Uint8Array(32));
    for (let l = 0; l < depth; l++) { this.emptyAt.push(e); e = c._transientHash_1([e, e]); }
    this.emptyAt.push(e);
  }

  private node(level: number, index: number): bigint {
    if (level === 0) return index < this.base.length ? this.base[index] : this.emptyAt[0];
    if (index * (1 << level) >= this.base.length) return this.emptyAt[level];
    return this.c._transientHash_1([this.node(level - 1, index * 2), this.node(level - 1, index * 2 + 1)]);
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

// ---------------------------------------------------------------------------
// Schnorr over Jubjub (contract/src/schnorr.compact)
// ---------------------------------------------------------------------------

export const JUBJUB_ORDER =
  6554484396890773809930967563523245729705921265872317281365359162392183254199n;
const TWO_248 =
  452312848583266388373324160190187140051835877600158453279131187530910662656n;

/** Plain coordinates, never live wasm objects (see cli/src/crypto.ts for why). */
export interface SchnorrKey { sk: bigint; x: bigint; y: bigint }
export type SchnorrSignature = { announcement: any; response: bigint };

const randScalar = (): bigint => {
  const v = BigInt('0x' + randomBytes(32).toString('hex')) % JUBJUB_ORDER;
  return v === 0n ? 1n : v;
};

export function schnorrKeypair(c: Hasher): SchnorrKey {
  const sk = randScalar();
  const p = c._ecMulGenerator_0(sk);
  return { sk, x: jubjubPointX(p), y: jubjubPointY(p) };
}
export const deviceKeypair = schnorrKeypair;
export const guardianKeypair = schnorrKeypair;

export function schnorrSign(c: Hasher, key: SchnorrKey, msg: bigint[]): SchnorrSignature {
  const r = randScalar();
  const announcement = c._ecMulGenerator_0(r);
  const pk = constructJubjubPoint(key.x, key.y);
  const cFull: bigint = c._transientHash_0({
    ann_x: c._jubjubPointX_0(announcement),
    ann_y: c._jubjubPointY_0(announcement),
    pk_x: c._jubjubPointX_0(pk),
    pk_y: c._jubjubPointY_0(pk),
    msg,
  });
  const cTruncated = cFull % TWO_248;
  return { announcement, response: (r + cTruncated * key.sk) % JUBJUB_ORDER };
}

export function schnorrReduction(cFull: bigint): [bigint, bigint] {
  return [cFull / TWO_248, cFull % TWO_248];
}
