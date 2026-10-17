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
import {
  createCircuitContext, createConstructorContext, sampleContractAddress, ContractState,
} from '@midnight-ntwrk/compact-runtime';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import {
  deployContract, findDeployedContract,
  createCircuitCallTxInterface, createCircuitMaintenanceTxInterfaces,
} from '@midnight-ntwrk/midnight-js-contracts';
import { Contract, ledger as readLedger, type Ledger } from '../../contract/out/contract/index.js';
import { DEMO_GRACE_SECONDS, DEMO_CHALLENGE_SECONDS } from './config.js';
import { resolveSeed } from './seed.js';
import { initializeNetwork } from './netid.js';
import { buildWallet, startAndSync } from './wallet.js';
import { createProviders, ZK_CONFIG_PATH } from './providers.js';
import { withRetries, describe as describeErr, errorCode } from './retry.js';
import {
  SparseTree, guardianKeypair, deviceKeypair, heirLeaf, ownerLeaf, ownerTag, randScalar,
  type GuardianKey, type Hasher,
} from './crypto.js';
import {
  makeWitnesses, OWNER_DEPTH, HEIR_DEPTH, WITNESS_NAMES,
  type Heir, type Owner, type PrivateState, type StateRef,
} from './witnesses.js';

/** A contract instance used only for its hashing / EC helpers. */
export function makeHasher(): any {
  const vacant: any = {};
  for (const k of WITNESS_NAMES) vacant[k] = () => { throw new Error(`vacant witness ${k}`); };
  return new Contract(vacant);
}

export const randKey = () => new Uint8Array(randomBytes(32));

/** An owner: two secrets (knowledge) and a device key (possession). */
export const makeOwner = (hasher: Hasher, name: string): Owner => ({
  name, secret: randKey(), willRoot: randKey(), device: deviceKeypair(hasher),
});
/** An heir: a claim secret, a share, and the coin public key the payout is bound to. */
export const makeHeir = (name: string, share: bigint, key: Uint8Array = randKey()): Heir => ({
  name, secret: randKey(), share, key,
});

export interface Cast {
  hasher: Hasher;
  owners: Owner[];
  heirs: Heir[];
  guardianKeys: GuardianKey[];
  ownerTree: SparseTree;
  heirTree: SparseTree;
}

export const buildHeirTree = (hasher: Hasher, heirs: Heir[]) =>
  new SparseTree(hasher, HEIR_DEPTH, heirs.map((h) => heirLeaf(hasher, h.secret, h.share, h.key)));

/** Build the off-chain cohort: owner tree, heir tree, guardian keys. */
export function buildCast(hasher: Hasher, ownerNames: string[], heirs: Heir[]): Cast {
  const owners = ownerNames.map((n) => makeOwner(hasher, n));
  const guardianKeys = [0, 1, 2].map(() => guardianKeypair(hasher));
  const ownerTree = new SparseTree(hasher, OWNER_DEPTH,
    owners.map((o) => ownerLeaf(hasher, o.secret, o.willRoot, o.device)));
  return { hasher, owners, heirs, guardianKeys, ownerTree, heirTree: buildHeirTree(hasher, heirs) };
}

/**
 * Replace the heirs after the cast exists. Live, the heirs' payout keys come
 * from a wallet that is only connected AFTER the contract is deployed, so the
 * heir tree is rebuilt here and published by the next `updateWill`.
 */
export function setHeirs(cast: Cast, heirs: Heir[]) {
  cast.heirs = heirs;
  cast.heirTree = buildHeirTree(cast.hasher, heirs);
}

const ZERO32 = new Uint8Array(32);

export function initialPrivateState(cast?: Cast | null): PrivateState {
  const placeholder: Owner = { name: '', secret: ZERO32, willRoot: ZERO32, device: { sk: 1n, x: 0n, y: 0n } };
  return {
    owner: cast?.owners[0] ?? placeholder,
    cohort: cast?.owners ?? [],
    ownerTree: cast?.ownerTree,
    heirs: cast?.heirs ?? [],
    heirTree: cast?.heirTree,
    activeHeir: 0,
    heartbeatNow: 0n,
    deviceKind: 2,
    guardianKeys: cast?.guardianKeys ?? [],
    attesting: [0, 1],
    guardianKind: 'resolve',
    guardianTag: ZERO32,
    totalValue: (cast?.heirs ?? []).reduce((a, h) => a + h.share, 0n),
    executorId: randKey(),
    probateBlind: randKey(),
    envelopeCipher: randKey(),
    pin: 1234n,
  };
}

// ---------------------------------------------------------------------------
// Simulator session
// ---------------------------------------------------------------------------

export class SimSession {
  readonly hasher: any;
  readonly contract: any;
  readonly address: string;
  ctx: any;

  constructor(readonly cast: Cast, grace = DEMO_GRACE_SECONDS, challenge = DEMO_CHALLENGE_SECONDS) {
    this.hasher = cast.hasher;
    this.contract = new Contract(makeWitnesses(this.hasher));
    this.address = sampleContractAddress();
    const init = this.contract.initialState(
      createConstructorContext(initialPrivateState(cast), this.address),
      cast.ownerTree.digest(), grace, challenge,
      ...cast.guardianKeys.flatMap((k) => [k.x, k.y]),
    );
    this.ctx = createCircuitContext(
      this.address, init.currentZswapLocalState,
      init.currentContractState, init.currentPrivateState,
    );
  }

  get ledger(): Ledger { return readLedger(this.ctx.currentQueryContext.state); }
  get ps(): PrivateState { return this.ctx.currentPrivateState; }
  patch(p: Partial<PrivateState>) {
    this.ctx = { ...this.ctx, currentPrivateState: { ...this.ctx.currentPrivateState, ...p } };
  }
  actAs(owner: Owner) { this.patch({ owner }); }
  tag(owner: Owner = this.ps.owner): Uint8Array {
    return ownerTag(this.hasher, owner.secret, owner.willRoot);
  }
  call(name: string, ...args: any[]) {
    this.ctx = this.contract.impureCircuits[name](this.ctx, ...args).context;
    return this.ledger;
  }

  heartbeat(now: bigint) { this.patch({ heartbeatNow: now, deviceKind: 2 }); return this.call('heartbeat', now); }
  /** Amend the will: knowledge AND the device (kind-4 signature over `now`). Set `newVaultRoot` first. */
  updateWill(now: bigint) { this.patch({ heartbeatNow: now, deviceKind: 4 }); return this.call('updateWill', now); }
  veto(now: bigint) { return this.call('veto', now); }
  finalize(tag: Uint8Array, until: bigint) { return this.call('finalize', tag, until); }
  guardianResolve2of3(tag: Uint8Array, g0: bigint, g1: bigint) {
    this.patch({ attesting: [Number(g0), Number(g1)], guardianKind: 'resolve', guardianTag: tag });
    return this.call('guardianResolve2of3', tag, g0, g1);
  }
  guardianVeto2of3(tag: Uint8Array, g0: bigint, g1: bigint) {
    this.patch({ attesting: [Number(g0), Number(g1)], guardianKind: 'veto', guardianTag: tag });
    return this.call('guardianVeto2of3', tag, g0, g1);
  }
  /** Heir `index` claims to the key bound in their leaf (or another, to show it fails). */
  claim(tag: Uint8Array, index: number, heirKey?: Uint8Array) {
    this.patch({ activeHeir: index });
    return this.call('claim', tag, { bytes: heirKey ?? this.ps.heirs[index].key });
  }
  /** The outstanding coin value, or null once the last claim removed the entry. */
  remaining(tag: Uint8Array): bigint | null {
    const l = this.ledger;
    return l.heldCoin.member(tag) ? l.heldCoin.lookup(tag).value : null;
  }
}

// ---------------------------------------------------------------------------
// Live session
// ---------------------------------------------------------------------------

export interface CallResult { txHash: string | null; block: number | null }

/**
 * Circuits whose verifier keys are added AFTER the deploy, by the contract's
 * maintenance authority, in one transaction each.
 *
 * Measured on node 1.0.0: a deploy carrying all 13 verifier keys writes
 * 33,474 modelled bytes, 0.67 of a block's write budget, and the node refuses
 * it with "Transaction would exhaust the block limits". With these two Wave 3
 * circuits deferred the deploy writes 0.57 of a block and is accepted; each
 * insertion then writes 0.06. The chain ends up with the full 13-circuit
 * contract, which `findDeployedContract` verifies key by key.
 */
export const DEFERRED_CIRCUITS = ['openProbate', 'resolveUnderPin'];

/** The generated Contract minus the deferred circuits, for the deploy transaction only. */
function deployContractClass(drop: string[]): any {
  return class DeployContract extends (Contract as any) {
    constructor(w: any) {
      super(w);
      this.provableCircuits = Object.fromEntries(
        Object.entries(this.provableCircuits).filter(([k]) => !drop.includes(k)));
    }
    initialState(ctx: any, ...args: any[]) {
      const r = super.initialState(ctx, ...args);
      const old = r.currentContractState;
      const fresh = new ContractState();
      fresh.data = old.data;
      for (const op of old.operations()) if (!drop.includes(String(op))) fresh.setOperation(op, old.operation(op));
      return { ...r, currentContractState: fresh };
    }
  };
}

export interface ConnectOptions {
  /** Attach to an existing contract instead of deploying one. */
  address?: string;
  grace?: bigint;
  challenge?: bigint;
  /** Witnesses merged over `makeWitnesses` (the heir web server supplies the envelope's). */
  witnessOverrides?: Record<string, Function>;
}

export class LiveSession {
  private constructor(
    readonly hasher: any,
    readonly providers: any,
    readonly deployed: any,
    readonly address: string,
    readonly cast: Cast | null,
    private bundle: any,
    readonly ref: StateRef,
    /** Transactions that completed the deployment (verifier key insertions). */
    readonly setupTxs: (CallResult & { circuit: string })[] = [],
  ) {}

  /** Switch which owner the next call acts as. */
  actAs(owner: Owner) { this.ref.ps = { ...this.ref.ps, owner }; }
  patch(p: Partial<PrivateState>) { this.ref.ps = { ...this.ref.ps, ...p }; }
  get ps(): PrivateState { return this.ref.ps; }

  static async connect(cast: Cast | null | undefined, opts: ConnectOptions = {}) {
    initializeNetwork();
    const bundle = await buildWallet(resolveSeed(), { useCheckpoint: false });
    await startAndSync(bundle);
    const providers = await createProviders(
      bundle.facade, bundle.zswapSecretKeys, bundle.dustSecretKey, bundle.keystore,
    );
    const hasher = cast?.hasher ?? makeHasher();
    const ref: StateRef = { ps: initialPrivateState(cast) };
    const witnesses = { ...makeWitnesses(hasher, ref), ...(opts.witnessOverrides ?? {}) };

    const compiled = (CompiledContract.make('Nominee', Contract) as any).pipe(
      (CompiledContract as any).withWitnesses(witnesses),
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
    const setupTxs: (CallResult & { circuit: string })[] = [];

    if (opts.address) {
      deployed = await findDeployedContract(providers, {
        compiledContract: compiled,
        contractAddress: opts.address,
        privateStateId: 'nominee',
        initialPrivateState: ps,
      } as any);
      address = opts.address;
    } else {
      if (!cast) throw new Error('LiveSession.connect: a cast is required to deploy');
      const forDeploy = (CompiledContract.make('Nominee', deployContractClass(DEFERRED_CIRCUITS)) as any).pipe(
        (CompiledContract as any).withWitnesses(witnesses),
        (CompiledContract as any).withCompiledFileAssets(ZK_CONFIG_PATH),
      );
      const d: any = await withRetries('deploy', async () =>
        deployContract(providers, {
          compiledContract: forDeploy,
          privateStateId: 'nominee',
          initialPrivateState: ps,
          args: [
            cast.ownerTree.digest(),
            opts.grace ?? DEMO_GRACE_SECONDS,
            opts.challenge ?? DEMO_CHALLENGE_SECONDS,
            ...cast.guardianKeys.flatMap((k) => [k.x, k.y]),
          ],
        } as any),
      );
      address = d.deployTxData.public.contractAddress;
      // Complete the contract: the maintenance authority (this wallet) adds the deferred verifier keys.
      const maint: any = createCircuitMaintenanceTxInterfaces(providers, compiled, address);
      for (const c of DEFERRED_CIRCUITS) {
        const vk = await providers.zkConfigProvider.getVerifierKey(c);
        const r: any = await withRetries(`insertVerifierKey(${c})`, () => maint[c].insertVerifierKey(vk));
        setupTxs.push({ circuit: `insertVerifierKey(${c})`, txHash: r?.txHash ?? null, block: r?.blockHeight ?? null });
      }
      deployed = {
        deployTxData: d.deployTxData,
        callTx: createCircuitCallTxInterface(providers, compiled, address, 'nominee'),
        circuitMaintenanceTx: maint,
      };
    }
    return new LiveSession(hasher, providers, deployed, address, cast ?? null, bundle, ref, setupTxs);
  }

  /** The wallet facade this session balances and submits with (shielded balances live on its state). */
  get facade(): any { return this.bundle?.facade; }

  /** The connected wallet's Zswap coin public key, 32 bytes: the only key it can receive shielded coins at. */
  coinPublicKey(): Uint8Array {
    const hex = String(this.providers.walletProvider.getCoinPublicKey()).replace(/^0x/, '');
    const b = Buffer.from(hex, 'hex');
    if (b.length !== 32) throw new Error(`coin public key is ${b.length} bytes, expected 32`);
    return new Uint8Array(b);
  }

  /** Run a circuit on chain, rebuilding and re-proving on Custom(170). */
  async call(circuit: string, ...args: any[]): Promise<CallResult> {
    const r: any = await withRetries(circuit, () => this.deployed.callTx[circuit](...args));
    return {
      txHash: r?.public?.txHash ?? r?.public?.txId ?? null,
      block: r?.public?.blockHeight ?? null,
    };
  }

  heartbeat(now: bigint) { this.patch({ heartbeatNow: now, deviceKind: 2 }); return this.call('heartbeat', now); }
  /** Amend the will: knowledge AND the device (kind-4 signature over `now`). Set `newVaultRoot` first. */
  updateWill(now: bigint) { this.patch({ heartbeatNow: now, deviceKind: 4 }); return this.call('updateWill', now); }
  veto(now: bigint) { return this.call('veto', now); }
  finalize(tag: Uint8Array, until: bigint) { return this.call('finalize', tag, until); }
  guardianResolve2of3(tag: Uint8Array, g0: bigint, g1: bigint) {
    this.patch({ attesting: [Number(g0), Number(g1)], guardianKind: 'resolve', guardianTag: tag });
    return this.call('guardianResolve2of3', tag, g0, g1);
  }
  guardianVeto2of3(tag: Uint8Array, g0: bigint, g1: bigint) {
    this.patch({ attesting: [Number(g0), Number(g1)], guardianKind: 'veto', guardianTag: tag });
    return this.call('guardianVeto2of3', tag, g0, g1);
  }
  claim(tag: Uint8Array, index: number, heirKey?: Uint8Array) {
    this.patch({ activeHeir: index });
    return this.call('claim', tag, { bytes: heirKey ?? this.ps.heirs[index].key });
  }

  async ledger(): Promise<Ledger | null> {
    const s = await this.providers.publicDataProvider.queryContractState(this.address);
    return s ? readLedger(s.data) : null;
  }

  /** The outstanding coin value, or null once the last claim removed the entry. */
  async remaining(tag: Uint8Array): Promise<bigint | null> {
    const l = await this.ledger();
    return l && l.heldCoin.member(tag) ? l.heldCoin.lookup(tag).value : null;
  }

  tag(owner: Owner): Uint8Array { return ownerTag(this.hasher, owner.secret, owner.willRoot); }

  async close() { try { await this.bundle?.facade?.close?.(); } catch { /* best effort */ } }
}

export { describeErr, errorCode, randScalar };
