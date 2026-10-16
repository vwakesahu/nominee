// SPDX-License-Identifier: Apache-2.0
//
// Simulator backend. Runs the real compiled circuits through the Compact
// runtime with no proof server and no network (the way test/simulator does),
// seeded with one demo vault that is already registered, funded, resolved and
// finalized, so the heir web app can be exercised end to end offline.
import {
  createCircuitContext, createConstructorContext, sampleContractAddress,
} from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger as readLedger, type Ledger } from '../../contract/out/contract/index.js';
import type { Backend, ClaimResult } from './backend.js';
import { ClaimError } from './backend.js';
import type { CliConfig } from './config.js';
import {
  HEIR_DEPTH, OWNER_DEPTH, SparseTree, ZERO32, deviceKeypair, deviceMsg, guardianKeypair,
  heirLeaf, makeHasher, nullifier, ownerLeaf, ownerTag, rand32, schnorrReduction, schnorrSign,
  toHex, type SchnorrKey, WITNESS_NAMES,
} from './crypto.js';
import { decodeEnvelope, envelopeWitnesses, type Envelope } from './envelope.js';
import { circuitReason, claimBlocker, vaultView } from './view.js';

interface DemoHeir { name: string; secret: Uint8Array; share: bigint; key: Uint8Array }

const now = () => BigInt(Math.floor(Date.now() / 1000));

export class SimBackend implements Backend {
  readonly mode = 'simulator' as const;
  readonly network: string;
  readonly hasher = makeHasher();
  readonly address = sampleContractAddress();
  readonly heirs: DemoHeir[];
  readonly heirTree: SparseTree;
  readonly tag: Uint8Array;
  private ctx: any;
  private readonly base: Record<string, Function>;
  private heartbeatNow = 0n;

  constructor(private readonly cfg: CliConfig) {
    this.network = cfg.NETWORK;
    const h = this.hasher;

    // --- the demo cast: one owner with a device, three heirs with fixed payout keys
    const owner = { secret: rand32(), willRoot: rand32(), device: deviceKeypair(h) as SchnorrKey };
    this.heirs = [
      { name: 'Maya', secret: rand32(), share: 500n, key: rand32() },
      { name: 'Raj',  secret: rand32(), share: 300n, key: rand32() },
      { name: 'Sam',  secret: rand32(), share: 200n, key: rand32() },
    ];
    const guardians = [0, 1, 2].map(() => guardianKeypair(h));
    const ownerTree = new SparseTree(h, OWNER_DEPTH, [ownerLeaf(h, owner.secret, owner.willRoot, owner.device)]);
    this.heirTree = new SparseTree(h, HEIR_DEPTH, this.heirs.map((x) => heirLeaf(h, x.secret, x.share, x.key)));
    this.tag = ownerTag(h, owner.secret, owner.willRoot);

    // --- owner-side witnesses (only used while seeding; claims override the heir ones)
    const pass = (v: any) => (ctx: any) => [ctx.privateState, v];
    const base: Record<string, Function> = {
      getSchnorrReduction: (ctx: any, cFull: bigint) => [ctx.privateState, schnorrReduction(cFull)],
      ownerSecret: pass(owner.secret),
      willRoot: pass(owner.willRoot),
      ownerPath: (ctx: any, leaf: Uint8Array) => [ctx.privateState, { leaf, path: ownerTree.pathFor(0) }],
      newVaultRoot: pass(this.heirTree.digest()),
      devicePkX: pass(owner.device.x),
      devicePkY: pass(owner.device.y),
      deviceSig: (ctx: any) => [ctx.privateState, schnorrSign(h, owner.device, deviceMsg(this.heartbeatNow))],
      heirSecret: () => { throw new Error('no heir selected'); },
      heirShare: () => { throw new Error('no heir selected'); },
      heirPath: () => { throw new Error('no heir selected'); },
      gSig0: pass(schnorrSign(h, guardians[0], [0n, 0n, 0n, 0n])),
      gSig1: pass(schnorrSign(h, guardians[1], [0n, 0n, 0n, 0n])),
      gSig2: pass(schnorrSign(h, guardians[2], [0n, 0n, 0n, 0n])),
      totalValue: pass(1000n),
      executorId: pass(rand32()),
      probateBlind: pass(rand32()),
      envelopeCipher: pass(rand32()),
      pin: pass(1234n),
      decoyRoot: pass({ field: 0n }),
    };
    for (const k of WITNESS_NAMES) if (!(k in base)) throw new Error(`witness ${k} missing`);
    this.base = base;

    // --- deploy
    const contract = new Contract(base as any);
    const init = contract.initialState(
      createConstructorContext({}, sampleContractAddress()),
      ownerTree.digest(), cfg.DEMO_GRACE_SECONDS, cfg.DEMO_CHALLENGE_SECONDS,
      guardians[0].x, guardians[0].y, guardians[1].x, guardians[1].y, guardians[2].x, guardians[2].y,
    );
    this.ctx = createCircuitContext(this.address, init.currentZswapLocalState, init.currentContractState, {});

    // --- a life, in the past: register, heartbeat (device signs), deposit, updateWill
    const grace = cfg.DEMO_GRACE_SECONDS, challenge = cfg.DEMO_CHALLENGE_SECONDS;
    const lastSeen = now() - 86_400n - grace - challenge;      // "yesterday"
    this.setTime(lastSeen);
    this.run(base, 'register');
    this.heartbeatNow = lastSeen;
    this.run(base, 'heartbeat', lastSeen);
    this.run(base, 'deposit', { nonce: rand32(), color: ZERO32, value: 1000n });
    this.run(base, 'updateWill');

    // --- silence, then resolution: resolve opens the window, finalize closes it
    this.setTime(lastSeen + grace + 1n);
    this.run(base, 'resolve', this.tag, lastSeen + grace);
    this.setTime(now());
    this.run(base, 'finalize', this.tag, lastSeen + grace + challenge);
  }

  private setTime(secs: bigint) {
    const q = this.ctx.currentQueryContext;
    q.block = { ...q.block, secondsSinceEpoch: secs };
  }

  private run(witnesses: Record<string, Function>, circuit: string, ...args: any[]): Ledger {
    const c = new Contract(witnesses as any);
    this.ctx = (c.impureCircuits as any)[circuit](this.ctx, ...args).context;
    return this.ledger;
  }

  get ledger(): Ledger { return readLedger(this.ctx.currentQueryContext.state); }

  contractAddress() { return String(this.address); }

  async vault(tagHex: string) {
    const tag = new Uint8Array(Buffer.from(tagHex, 'hex'));
    return vaultView(this.ledger, tag, tagHex);
  }

  demoEnvelope(heir = 0): Envelope {
    const x = this.heirs[heir];
    if (!x) throw new ClaimError(`demo vault has ${this.heirs.length} heirs`, 404);
    return {
      version: 2,
      network: this.network as Envelope['network'],
      contractAddress: this.contractAddress(),
      vaultTag: toHex(this.tag),
      heirSecret: toHex(x.secret),
      share: x.share.toString(),
      heirKey: toHex(x.key),
      merklePath: this.heirTree.pathFor(heir).map((p) => ({ sibling: p.sibling.field.toString(), goesLeft: p.goes_left })),
      indexerUrl: this.cfg.networkConfig.indexerHttpUrl,
    };
  }

  async claim(env: Envelope): Promise<ClaimResult> {
    const d = decodeEnvelope(env);
    const view = vaultView(this.ledger, d.tag, env.vaultTag);
    const blocker = claimBlocker(view);
    if (blocker) throw new ClaimError(blocker);

    const overrides = await envelopeWitnesses(env, this.hasher);
    const before = this.ctx;
    this.setTime(now());
    try {
      this.run({ ...this.base, ...overrides }, 'claim', d.tag, { bytes: d.heirKey });
    } catch (e) {
      this.ctx = before;                     // a refused circuit leaves no trace
      throw new ClaimError(circuitReason(e));
    }
    const after = vaultView(this.ledger, d.tag, env.vaultTag);
    return {
      txHash: null,
      block: null,
      received: d.share.toString(),
      remaining: after.remaining,
      nullifier: toHex(nullifier(this.hasher, d.heirSecret)),
      heirKey: env.heirKey,
      simulated: true,
    };
  }
}
