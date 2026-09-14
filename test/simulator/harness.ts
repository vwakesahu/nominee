// SPDX-License-Identifier: Apache-2.0
//
// Simulator harness. Runs the real circuits through the Compact runtime with
// no proof server and no network, so every assertion in the contract is
// exercised exactly as it would be on chain.
import { randomBytes } from 'node:crypto';
import {
  createCircuitContext, createConstructorContext, sampleContractAddress,
  type CircuitContext,
} from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger, type Ledger } from '../../contract/out/contract/index.js';
import {
  SparseTree, guardianKeypair, guardianPk, heirLeaf, ownerLeaf, ownerTag,
  type GuardianKey,
} from '../../cli/src/crypto.js';
import { makeWitnesses, OWNER_DEPTH, HEIR_DEPTH, type Heir, type Owner, type PrivateState } from '../../cli/src/witnesses.js';

export const GRACE = 60n;
export const NATIVE = new Uint8Array(32);

export function makeOwner(name: string): Owner {
  return { name, secret: new Uint8Array(randomBytes(32)), willRoot: new Uint8Array(randomBytes(32)) };
}
export function makeHeir(name: string, share: bigint): Heir {
  return { name, secret: new Uint8Array(randomBytes(32)), share };
}

export class Vault {
  readonly contract: any;
  readonly hasher: any;
  ctx: CircuitContext<PrivateState>;
  readonly guardianKeys: GuardianKey[];
  readonly ownerTree: SparseTree;
  heirTree: SparseTree;

  constructor(opts: {
    owners: Owner[];
    heirs: Heir[];
    actingAs?: number;
    grace?: bigint;
  }) {
    const { owners, heirs, actingAs = 0, grace = GRACE } = opts;

    // A throwaway instance is needed first: the hashers live on the instance,
    // but the witness object needs a hasher. Build it with vacant witnesses.
    const vacant: any = {};
    for (const k of [
      'getSchnorrReduction', 'ownerSecret', 'willRoot', 'ownerPath', 'newVaultRoot',
      'heirSecret', 'heirShare', 'heirPath', 'spendCoin', 'gSig0', 'gSig1', 'gSig2',
      'totalValue', 'executorId', 'probateBlind', 'envelopeCipher', 'pin', 'decoyRoot',
    ]) vacant[k] = () => { throw new Error(`vacant witness ${k}`); };
    this.hasher = new Contract(vacant);

    this.guardianKeys = [0, 1, 2].map(() => guardianKeypair(this.hasher));
    this.ownerTree = new SparseTree(this.hasher, OWNER_DEPTH,
      owners.map((o) => ownerLeaf(this.hasher, o.secret, o.willRoot)));
    this.heirTree = new SparseTree(this.hasher, HEIR_DEPTH,
      heirs.map((h) => heirLeaf(this.hasher, h.secret, h.share)));

    const ps: PrivateState = {
      owner: owners[actingAs],
      cohort: owners,
      ownerTree: this.ownerTree,
      heirs,
      heirTree: this.heirTree,
      activeHeir: 0,
      guardianKeys: this.guardianKeys,
      attesting: [0, 1],
      totalValue: heirs.reduce((a, h) => a + h.share, 0n),
      executorId: new Uint8Array(randomBytes(32)),
      probateBlind: new Uint8Array(randomBytes(32)),
      envelopeCipher: new Uint8Array(randomBytes(32)),
      pin: 1234n,
    };

    this.contract = new Contract(makeWitnesses(this.hasher));
    const init = this.contract.initialState(
      createConstructorContext(ps, sampleContractAddress()),
      this.ownerTree.digest(),
      grace,
      ...this.guardianKeys.flatMap((k) => [k.x, k.y]),
    );
    this.ctx = createCircuitContext(
      sampleContractAddress(), init.currentZswapLocalState,
      init.currentContractState, init.currentPrivateState,
    );
  }

  get ledger(): Ledger { return ledger(this.ctx.currentQueryContext.state); }
  get ps(): PrivateState { return this.ctx.currentPrivateState; }

  patch(p: Partial<PrivateState>) {
    this.ctx = { ...this.ctx, currentPrivateState: { ...this.ctx.currentPrivateState, ...p } };
  }

  /** The acting owner's public tag. */
  tag(): Uint8Array {
    const o = this.ps.owner;
    return ownerTag(this.hasher, o.secret, o.willRoot);
  }

  actAs(i: number) { this.patch({ owner: this.ps.cohort[i] }); }

  private call(name: string, ...args: any[]) {
    this.ctx = this.contract.impureCircuits[name](this.ctx, ...args).context;
    return this.ledger;
  }

  register()                    { return this.call('register'); }
  heartbeat(now: bigint)        { return this.call('heartbeat', now); }
  deposit(coin: any)            { return this.call('deposit', coin); }
  updateWill()                  { return this.call('updateWill'); }
  resolve(tag: Uint8Array, deadline: bigint) { return this.call('resolve', tag, deadline); }
  guardianResolve2of3(tag: Uint8Array, g0: bigint, g1: bigint) {
    return this.call('guardianResolve2of3', tag, g0, g1);
  }
  guardianResolve3of5(tag: Uint8Array, g0: bigint, g1: bigint, g2: bigint) {
    return this.call('guardianResolve3of5', tag, g0, g1, g2);
  }
  claim(tag: Uint8Array, heirKey: Uint8Array) {
    return this.call('claim', tag, { bytes: heirKey });
  }
  openProbate(tag: Uint8Array, vaultCommit: Uint8Array) {
    return this.call('openProbate', tag, vaultCommit);
  }
  resolveUnderPin(tag: Uint8Array, realCommit: Uint8Array, decoyCommit: Uint8Array) {
    return this.call('resolveUnderPin', tag, realCommit, decoyCommit);
  }

  /** Fund the vault and record the qualification the next claimant needs. */
  fund(value: bigint) {
    const coin = { nonce: new Uint8Array(randomBytes(32)), color: NATIVE, value };
    this.deposit(coin);
    const held = this.ledger.heldCoin.lookup(this.tag());
    this.patch({ spendCoin: { nonce: held.nonce, color: held.color, value: held.value, mt_index: 0n } });
    return coin;
  }

  /** Refresh the qualification from the outstanding coin after a claim. */
  refreshCoin() {
    const held = this.ledger.heldCoin.lookup(this.tag());
    this.patch({ spendCoin: { nonce: held.nonce, color: held.color, value: held.value, mt_index: 0n } });
  }
}

export const randKey = () => new Uint8Array(randomBytes(32));
