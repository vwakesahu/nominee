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
  SparseTree, guardianKeypair, deviceKeypair, heirLeaf, ownerLeaf, ownerTag, randScalar,
  type GuardianKey,
} from '../../cli/src/crypto.js';
import {
  makeWitnesses, OWNER_DEPTH, HEIR_DEPTH, WITNESS_NAMES,
  type Heir, type Owner, type PrivateState,
} from '../../cli/src/witnesses.js';

export const GRACE = 60n;
export const CHALLENGE = 30n;
export const NATIVE = new Uint8Array(32);

// A throwaway instance is needed first: the hashers live on the instance,
// but the witness object needs a hasher. Build it with vacant witnesses.
const vacant: any = {};
for (const k of WITNESS_NAMES) vacant[k] = () => { throw new Error(`vacant witness ${k}`); };
export const hasher: any = new Contract(vacant);

export const randKey = () => new Uint8Array(randomBytes(32));

export function makeOwner(name: string): Owner {
  return { name, secret: randKey(), willRoot: randKey(), device: deviceKeypair(hasher) };
}
export function makeHeir(name: string, share: bigint, key: Uint8Array = randKey()): Heir {
  return { name, secret: randKey(), share, key };
}
/** The same owner with a device that has the right public key and the wrong secret: a seed thief. */
export const withoutDevice = (o: Owner): Owner => ({ ...o, device: { ...o.device, sk: randScalar() } });

export class Vault {
  readonly contract: any;
  readonly hasher: any = hasher;
  ctx: CircuitContext<PrivateState>;
  readonly guardianKeys: GuardianKey[];
  readonly ownerTree: SparseTree;
  heirTree: SparseTree;

  constructor(opts: {
    owners: Owner[];
    heirs: Heir[];
    actingAs?: number;
    grace?: bigint;
    challenge?: bigint;
  }) {
    const { owners, heirs, actingAs = 0, grace = GRACE, challenge = CHALLENGE } = opts;

    this.guardianKeys = [0, 1, 2].map(() => guardianKeypair(hasher));
    this.ownerTree = new SparseTree(hasher, OWNER_DEPTH,
      owners.map((o) => ownerLeaf(hasher, o.secret, o.willRoot, o.device)));
    this.heirTree = new SparseTree(hasher, HEIR_DEPTH,
      heirs.map((h) => heirLeaf(hasher, h.secret, h.share, h.key)));

    const ps: PrivateState = {
      owner: owners[actingAs],
      cohort: owners,
      ownerTree: this.ownerTree,
      heirs,
      heirTree: this.heirTree,
      activeHeir: 0,
      heartbeatNow: 0n,
      guardianKeys: this.guardianKeys,
      attesting: [0, 1],
      guardianKind: 'resolve',
      guardianTag: new Uint8Array(32),
      totalValue: heirs.reduce((a, h) => a + h.share, 0n),
      executorId: randKey(),
      probateBlind: randKey(),
      envelopeCipher: randKey(),
      pin: 1234n,
    };

    this.contract = new Contract(makeWitnesses(hasher));
    const init = this.contract.initialState(
      createConstructorContext(ps, sampleContractAddress()),
      this.ownerTree.digest(),
      grace,
      challenge,
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
  tag(owner: Owner = this.ps.owner): Uint8Array {
    return ownerTag(hasher, owner.secret, owner.willRoot);
  }

  actAs(i: number) { this.patch({ owner: this.ps.cohort[i] }); }

  private call(name: string, ...args: any[]) {
    this.ctx = this.contract.impureCircuits[name](this.ctx, ...args).context;
    return this.ledger;
  }

  register()                    { return this.call('register'); }
  heartbeat(now: bigint)        { this.patch({ heartbeatNow: now }); return this.call('heartbeat', now); }
  veto(now: bigint)             { return this.call('veto', now); }
  deposit(coin: any)            { return this.call('deposit', coin); }
  updateWill()                  { return this.call('updateWill'); }
  resolve(tag: Uint8Array, deadline: bigint) { return this.call('resolve', tag, deadline); }
  finalize(tag: Uint8Array, until: bigint)   { return this.call('finalize', tag, until); }
  /** Guardians sign for `signedTag` (default: the tag they are presented against). */
  guardianResolve2of3(tag: Uint8Array, g0: bigint, g1: bigint, signedTag = tag) {
    this.patch({ attesting: [Number(g0), Number(g1)], guardianKind: 'resolve', guardianTag: signedTag });
    return this.call('guardianResolve2of3', tag, g0, g1);
  }
  guardianResolve3of5(tag: Uint8Array, g0: bigint, g1: bigint, g2: bigint) {
    this.patch({ attesting: [Number(g0), Number(g1), Number(g2)], guardianKind: 'resolve', guardianTag: tag });
    return this.call('guardianResolve3of5', tag, g0, g1, g2);
  }
  guardianVeto2of3(tag: Uint8Array, g0: bigint, g1: bigint, signedTag = tag) {
    this.patch({ attesting: [Number(g0), Number(g1)], guardianKind: 'veto', guardianTag: signedTag });
    return this.call('guardianVeto2of3', tag, g0, g1);
  }
  /** Heir `activeHeir` claims to `heirKey` (default: the key bound in their leaf). */
  claim(tag: Uint8Array, heirKey?: Uint8Array) {
    return this.call('claim', tag, { bytes: heirKey ?? this.ps.heirs[this.ps.activeHeir].key });
  }
  openProbate(tag: Uint8Array, vaultCommit: Uint8Array) {
    return this.call('openProbate', tag, vaultCommit);
  }
  resolveUnderPin(tag: Uint8Array, realCommit: Uint8Array, decoyCommit: Uint8Array) {
    return this.call('resolveUnderPin', tag, realCommit, decoyCommit);
  }

  /** Fund the vault with a fresh native coin. */
  fund(value: bigint) {
    const coin = { nonce: randKey(), color: NATIVE, value };
    this.deposit(coin);
    return coin;
  }

  /** Resolve and finalize in one go: the common path to an unlocked vault. */
  unlock(tag: Uint8Array, lastSeen: bigint) {
    this.resolve(tag, lastSeen + GRACE);
    this.finalize(tag, lastSeen + GRACE + CHALLENGE);
  }

  /** The outstanding coin value, or null once the last claim removed the entry. */
  remaining(tag: Uint8Array): bigint | null {
    return this.ledger.heldCoin.member(tag) ? this.ledger.heldCoin.lookup(tag).value : null;
  }
}
