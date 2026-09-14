// Build Merkle paths using the CONTRACT'S OWN hashing methods, so the root the
// test computes is identical by construction to the one the circuit computes.
export type Entry = { sibling: { field: bigint }, goes_left: boolean };

export interface Hasher {
  _persistentHash_0(v: [Uint8Array, Uint8Array]): Uint8Array;   // Vector<2,Bytes<32>>
  _persistentHash_1(v: bigint): Uint8Array;                     // Uint<128>
  _merkleTreePathRoot_0(p: { leaf: Uint8Array, path: Entry[] }): { field: bigint };
  _merkleTreePathEntryRoot_0(acc: bigint, e: Entry): bigint;
  _degradeToTransient_0(b: Uint8Array): bigint;
  _persistentHash_3(v: { domain_sep: Uint8Array, data: Uint8Array }): Uint8Array;
  _transientHash_0(v: [bigint, bigint]): bigint;
}

const MDN_LH = new Uint8Array([109, 100, 110, 58, 108, 104]); // "mdn:lh"

export function leafFor(c: Hasher, sk: Uint8Array, share: bigint): Uint8Array {
  return c._persistentHash_0([sk, c._persistentHash_1(share)]);
}

/** Sparse tree: `leaves` occupy slots 0..n-1; every other slot is 32 zero bytes. */
export class SparseTree {
  readonly emptyAt: bigint[] = [];
  readonly base: bigint[];
  constructor(private c: Hasher, readonly depth: number, leaves: Uint8Array[]) {
    const leafDigest = (b: Uint8Array) =>
      c._degradeToTransient_0(c._persistentHash_3({ domain_sep: MDN_LH, data: b }));
    this.base = leaves.map(leafDigest);
    let e = leafDigest(new Uint8Array(32));
    for (let l = 0; l < depth; l++) { this.emptyAt.push(e); e = c._transientHash_0([e, e]); }
    this.emptyAt.push(e);
  }
  private node(level: number, index: number): bigint {
    if (level === 0) return index < this.base.length ? this.base[index] : this.emptyAt[0];
    if (index * (1 << level) >= this.base.length) return this.emptyAt[level];
    return this.c._transientHash_0([this.node(level - 1, index * 2), this.node(level - 1, index * 2 + 1)]);
  }
  pathFor(i: number): Entry[] {
    const out: Entry[] = []; let idx = i;
    for (let level = 0; level < this.depth; level++) {
      const goesLeft = idx % 2 === 0;
      out.push({ sibling: { field: this.node(level, goesLeft ? idx + 1 : idx - 1) }, goes_left: goesLeft });
      idx = Math.floor(idx / 2);
    }
    return out;
  }
  root(): bigint { return this.node(this.depth, 0); }
}
