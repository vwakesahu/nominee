import { describe, it, expect, beforeEach } from 'vitest';
import { randomBytes } from 'node:crypto';
import {
  createCircuitContext, createConstructorContext, sampleContractAddress,
  type CircuitContext,
} from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger, type Ledger, type Witnesses } from '../managed/contract/index.js';
import { SparseTree, leafFor as mkLeaf, type Entry, type Hasher } from './merkle.js';

const DEPTH = 16;
const NATIVE = new Uint8Array(32);

type Heir = { sk: Uint8Array; share: bigint };
let H: Hasher;                      // the contract instance, used as the hasher
const leafFor = (h: Heir) => mkLeaf(H, h.sk, h.share);

type PS = {
  heirs: Heir[];
  active: number;                       // which heir is calling
  qual: { nonce: Uint8Array; color: Uint8Array; value: bigint; mt_index: bigint };
  tree: SparseTree;
};


const witnesses: Witnesses<PS> = {
  heirSecret: (ctx) => [ctx.privateState, ctx.privateState.heirs[ctx.privateState.active].sk],
  heirShare:  (ctx) => [ctx.privateState, ctx.privateState.heirs[ctx.privateState.active].share],
  heirPath:   (ctx, leaf) => {
    const ps = ctx.privateState;
    const i = ps.heirs.findIndex((h) => Buffer.compare(Buffer.from(leafFor(h)), Buffer.from(leaf)) === 0);
    if (i < 0) throw new Error('no path for leaf (not a beneficiary)');
    return [ps, { leaf, path: ps.tree.pathFor(i) as Entry[] }];
  },
  outstandingQual: (ctx) => [ctx.privateState, ctx.privateState.qual],
};

describe('A3 — multi-heir claim sequence', () => {
  let contract: Contract<PS>;
  let cc: CircuitContext<PS>;
  let heirs: Heir[];
  let tree: SparseTree;
  const DEPOSIT = 1000n;

  const L = () => ledger(cc.currentQueryContext.state) as Ledger;

  beforeEach(() => {
    heirs = [
      { sk: randomBytes(32), share: 500n },
      { sk: randomBytes(32), share: 300n },
      { sk: randomBytes(32), share: 200n },
    ];
    contract = new Contract<PS>(witnesses);
    H = contract as unknown as Hasher;
    tree = new SparseTree(H, DEPTH, heirs.map(leafFor));
    const ps: PS = {
      heirs, active: 0, tree,
      qual: { nonce: new Uint8Array(32), color: NATIVE, value: 0n, mt_index: 0n },
    };
    const init = contract.initialState(createConstructorContext(ps, sampleContractAddress()),
                                       { field: tree.root() });
    cc = createCircuitContext(sampleContractAddress(), init.currentZswapLocalState,
                              init.currentContractState, init.currentPrivateState);
  });

  const setPS = (patch: Partial<PS>) => { cc = { ...cc, currentPrivateState: { ...cc.currentPrivateState, ...patch } }; };

  function deposit(value: bigint) {
    const nonce = randomBytes(32);
    cc = contract.impureCircuits.deposit(cc, { nonce, color: NATIVE, value }).context;
    // the contract now holds this coin; record its qualification for the next claim
    setPS({ qual: { nonce: L().outstanding.nonce, color: L().outstanding.color, value: L().outstanding.value, mt_index: 0n } });
  }
  function resolveNow() { cc = contract.impureCircuits.resolveNow(cc).context; }
  function claim(i: number) {
    setPS({ active: i });
    cc = contract.impureCircuits.claim(cc, { bytes: randomBytes(32) }).context;
    // refresh the qualification from the new outstanding coin
    const o = L().outstanding;
    setPS({ qual: { nonce: o.nonce, color: o.color, value: o.value, mt_index: 0n } });
  }

  it('three heirs claim in sequence; residual decreases correctly', () => {
    deposit(DEPOSIT); resolveNow();
    expect(L().outstanding.value).toBe(1000n);

    claim(0); expect(L().outstanding.value).toBe(500n); expect(L().claimCount).toBe(1n);
    claim(1); expect(L().outstanding.value).toBe(200n); expect(L().claimCount).toBe(2n);
    claim(2); expect(L().claimCount).toBe(3n);
    expect(L().spent.size()).toBe(3n);
  });

  it('heir 3 can still claim after heirs 1-2', () => {
    deposit(DEPOSIT); resolveNow();
    claim(0); claim(1);
    expect(() => claim(2)).not.toThrow();
  });

  it('double claim is rejected by the nullifier', () => {
    deposit(DEPOSIT); resolveNow(); claim(0);
    expect(() => claim(0)).toThrow(/already claimed/);
  });

  it('claim before resolution is rejected', () => {
    deposit(DEPOSIT);
    expect(() => claim(0)).toThrow(/not resolved/);
  });

  it('non-beneficiary is rejected', () => {
    deposit(DEPOSIT); resolveNow();
    const stranger: Heir = { sk: randomBytes(32), share: 100n };
    setPS({ heirs: [...heirs, stranger] });
    expect(() => claim(3)).toThrow();
  });

  it('STALE qualification (from before heir 1 claimed) is rejected', () => {
    deposit(DEPOSIT); resolveNow();
    const stale = { ...cc.currentPrivateState.qual };   // snapshot pre-claim
    claim(0);
    setPS({ active: 1, qual: stale });                   // heir 2 replays the old coin
    expect(() => { cc = contract.impureCircuits.claim(cc, { bytes: randomBytes(32) }).context; })
      .toThrow(/stale coin/);
  });

  it('share exceeding the remaining balance is rejected', () => {
    deposit(100n); resolveNow();                         // less than heir 0's 500
    expect(() => claim(0)).toThrow(/exceeds remaining/);
  });
});
