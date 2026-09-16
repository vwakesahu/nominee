// SPDX-License-Identifier: Apache-2.0
//
// A session is either LIVE (real circuits, real proofs, real devnet) or
// SIMULATOR (real circuits, no proofs, no network). Both run the same compiled
// contract, so a simulator result is the circuit's real behaviour, only the
// proof and the ledger are absent.
import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';
// NOTE: the generated contract imports '@midnight-ntwrk/compact-runtime', so
// everything that touches a ContractState must come from that same specifier.
// '@midnight-ntwrk/midnight-js-protocol' carries a second copy of the wasm
// bindings; loading both puts two instances in the graph and a ContractState
// built by one is rejected by the other:
//   'contractState' parameter ContractState (...) has unexpected type
// That is the open issue behind the simulator path in the CLI.
import {
  createCircuitContext, createConstructorContext, sampleContractAddress,
} from '@midnight-ntwrk/compact-runtime';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { Contract, ledger as readLedger, type Ledger } from '../../contract/out/contract/index.js';
import { DEMO_GRACE_SECONDS } from './config.js';
import { resolveSeed } from './seed.js';
import { initializeNetwork } from './netid.js';
import { buildWallet, startAndSync } from './wallet.js';
import { createProviders, ZK_CONFIG_PATH } from './providers.js';
import { withRetries, describe as describeErr, errorCode } from './retry.js';
import {
  SparseTree, guardianKeypair, guardianPk, heirLeaf, ownerLeaf, ownerTag,
  type GuardianKey,
} from './crypto.js';
import {
  makeWitnesses, OWNER_DEPTH, HEIR_DEPTH,
  type Heir, type Owner, type PrivateState, type StateRef,
} from './witnesses.js';

const WITNESS_NAMES = [
  'getSchnorrReduction', 'ownerSecret', 'willRoot', 'ownerPath', 'newVaultRoot',
  'heirSecret', 'heirShare', 'heirPath', 'spendCoin', 'gSig0', 'gSig1', 'gSig2',
  'totalValue', 'executorId', 'probateBlind', 'envelopeCipher', 'pin', 'decoyRoot',
];

/** A contract instance used only for its hashing / EC helpers. */
export function makeHasher(): any {
  const vacant: any = {};
  for (const k of WITNESS_NAMES) vacant[k] = () => { throw new Error(`vacant witness ${k}`); };
  return new Contract(vacant);
}

export const makeOwner = (name: string): Owner => ({
  name, secret: new Uint8Array(randomBytes(32)), willRoot: new Uint8Array(randomBytes(32)),
});
export const makeHeir = (name: string, share: bigint): Heir => ({
  name, secret: new Uint8Array(randomBytes(32)), share,
});
export const randKey = () => new Uint8Array(randomBytes(32));

export interface Cast {
  owners: Owner[];
  heirs: Heir[];
  guardianKeys: GuardianKey[];
  ownerTree: SparseTree;
  heirTree: SparseTree;
}

/** Build the off-chain cohort: owner tree, heir tree, guardian keys. */
export function buildCast(hasher: any, ownerNames: string[], heirs: Heir[]): Cast {
  const owners = ownerNames.map(makeOwner);
  const guardianKeys = [0, 1, 2].map(() => guardianKeypair(hasher));
  const ownerTree = new SparseTree(hasher, OWNER_DEPTH,
    owners.map((o) => ownerLeaf(hasher, o.secret, o.willRoot)));
  const heirTree = new SparseTree(hasher, HEIR_DEPTH,
    heirs.map((h) => heirLeaf(hasher, h.secret, h.share)));
  return { owners, heirs, guardianKeys, ownerTree, heirTree };
}

export function initialPrivateState(cast: Cast): PrivateState {
  return {
    owner: cast.owners[0],
    cohort: cast.owners,
    ownerTree: cast.ownerTree,
    heirs: cast.heirs,
    heirTree: cast.heirTree,
    activeHeir: 0,
    guardianKeys: cast.guardianKeys,
    attesting: [0, 1],
    totalValue: cast.heirs.reduce((a, h) => a + h.share, 0n),
    executorId: new Uint8Array(randomBytes(32)),
    probateBlind: new Uint8Array(randomBytes(32)),
    envelopeCipher: new Uint8Array(randomBytes(32)),
    pin: 1234n,
  };
}

// ---------------------------------------------------------------------------
// Simulator session
// ---------------------------------------------------------------------------

export class SimSession {
  readonly hasher: any;
  readonly contract: any;
  ctx: any;

  constructor(readonly cast: Cast, grace = DEMO_GRACE_SECONDS) {
    this.hasher = makeHasher();
    this.contract = new Contract(makeWitnesses(this.hasher));
    const init = this.contract.initialState(
      createConstructorContext(initialPrivateState(cast), sampleContractAddress()),
      cast.ownerTree.digest(), grace,
      ...cast.guardianKeys.flatMap((k) => [k.x, k.y]),
    );
    this.ctx = createCircuitContext(
      sampleContractAddress(), init.currentZswapLocalState,
      init.currentContractState, init.currentPrivateState,
    );
  }

  get ledger(): Ledger { return readLedger(this.ctx.currentQueryContext.state); }
  get ps(): PrivateState { return this.ctx.currentPrivateState; }
  patch(p: Partial<PrivateState>) {
    this.ctx = { ...this.ctx, currentPrivateState: { ...this.ctx.currentPrivateState, ...p } };
  }
  tag(): Uint8Array {
    const o = this.ps.owner;
    return ownerTag(this.hasher, o.secret, o.willRoot);
  }
  call(name: string, ...args: any[]) {
    this.ctx = this.contract.impureCircuits[name](this.ctx, ...args).context;
    return this.ledger;
  }
  refreshCoin() {
    const held = this.ledger.heldCoin.lookup(this.tag());
    this.patch({ spendCoin: { nonce: held.nonce, color: held.color, value: held.value, mt_index: 0n } });
  }
}

// ---------------------------------------------------------------------------
// Live session
// ---------------------------------------------------------------------------

export interface CallResult { txHash: string | null; block: number | null }

export class LiveSession {
  private constructor(
    readonly hasher: any,
    readonly providers: any,
    readonly deployed: any,
    readonly address: string,
    readonly cast: Cast,
    private bundle: any,
    readonly ref: StateRef,
  ) {}

  /** Switch which owner the next call acts as. */
  actAs(owner: Owner) { this.ref.ps = { ...this.ref.ps, owner }; }
  patch(p: Partial<PrivateState>) { this.ref.ps = { ...this.ref.ps, ...p }; }

  static async connect(cast: Cast, opts: { address?: string; grace?: bigint } = {}) {
    initializeNetwork();
    const bundle = await buildWallet(resolveSeed(), { useCheckpoint: false });
    await startAndSync(bundle);
    const providers = await createProviders(
      bundle.facade, bundle.zswapSecretKeys, bundle.dustSecretKey, bundle.keystore,
    );
    const hasher = makeHasher();
    const ref: StateRef = { ps: initialPrivateState(cast) };

    const compiled = (CompiledContract.make('Nominee', Contract) as any).pipe(
      (CompiledContract as any).withWitnesses(makeWitnesses(hasher, ref)),
      (CompiledContract as any).withCompiledFileAssets(ZK_CONFIG_PATH),
    );

    // The SDK stores and threads whatever we hand it as private state. Our
    // real private state holds SparseTree objects that reference the wasm-backed
    // contract instance, and serialising that corrupts the deploy path (it
    // surfaces as "expected instance of ContractMaintenanceAuthority"). So the
    // SDK gets an inert placeholder; the witnesses read from `ref`, which never
    // leaves this process.
    const ps: any = {};
    let deployed: any;
    let address: string;

    if (opts.address) {
      deployed = await findDeployedContract(providers, {
        compiledContract: compiled,
        contractAddress: opts.address,
        privateStateId: 'nominee',
        initialPrivateState: ps,
      } as any);
      address = opts.address;
    } else {
      deployed = await withRetries('deploy', async () =>
        deployContract(providers, {
          compiledContract: compiled,
          privateStateId: 'nominee',
          initialPrivateState: ps,
          args: [
            cast.ownerTree.digest(),
            opts.grace ?? DEMO_GRACE_SECONDS,
            ...cast.guardianKeys.flatMap((k) => [k.x, k.y]),
          ],
        } as any),
      );
      address = deployed.deployTxData.public.contractAddress;
    }
    return new LiveSession(hasher, providers, deployed, address, cast, bundle, ref);
  }

  /** Run a circuit on chain, rebuilding and re-proving on Custom(170). */
  async call(circuit: string, ...args: any[]): Promise<CallResult> {
    const r: any = await withRetries(circuit, () => this.deployed.callTx[circuit](...args));
    return {
      txHash: r?.public?.txHash ?? r?.public?.txId ?? null,
      block: r?.public?.blockHeight ?? null,
    };
  }

  async ledger(): Promise<Ledger | null> {
    const s = await this.providers.publicDataProvider.queryContractState(this.address);
    return s ? readLedger(s.data) : null;
  }

  tag(owner: Owner): Uint8Array { return ownerTag(this.hasher, owner.secret, owner.willRoot); }

  async close() { try { await this.bundle?.facade?.close?.(); } catch { /* best effort */ } }
}

export { describeErr, errorCode };
