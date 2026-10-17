// SPDX-License-Identifier: Apache-2.0
//
// Live backend. Reads the public ledger through the indexer (no wallet) and
// runs claims through the CLI's LiveSession with the envelope's witnesses
// overriding the heir ones (SPEC §2.1).
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { ledger as readLedger, type Ledger } from '../../contract/out/contract/index.js';
import type { Backend, ClaimResult } from './backend.js';
import { ClaimError } from './backend.js';
import { CONTRACT_ADDRESS, cliDistUrl, type CliConfig } from './config.js';
import { makeHasher, nullifier, toHex } from './crypto.js';
import { decodeEnvelope, envelopeWitnesses, type Envelope } from './envelope.js';
import { circuitReason, claimBlocker, vaultView } from './view.js';

export class LiveBackend implements Backend {
  readonly mode = 'live' as const;
  readonly network: string;
  readonly hasher = makeHasher();
  private readonly indexer: any;
  private sessions = new Map<string, Promise<any>>();

  constructor(private readonly cfg: CliConfig) {
    this.network = cfg.NETWORK;
    this.indexer = indexerPublicDataProvider(cfg.networkConfig.indexerHttpUrl, cfg.networkConfig.indexerWsUrl);
  }

  contractAddress() { return CONTRACT_ADDRESS; }

  private resolveAddress(envelopeAddress?: string): string {
    const a = envelopeAddress || CONTRACT_ADDRESS;
    if (!a) throw new ClaimError('no contract address: set NOMINEE_CONTRACT or use an envelope that names one', 400);
    if (envelopeAddress && CONTRACT_ADDRESS && envelopeAddress.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase())
      throw new ClaimError('envelope is for a different contract than this server serves', 400);
    return a;
  }

  async ledger(address: string): Promise<Ledger> {
    const s = await this.indexer.queryContractState(address);
    if (!s) throw new ClaimError(`contract ${address} not found on ${this.network}`, 404);
    return readLedger(s.data);
  }

  async vault(tagHex: string) {
    const address = this.resolveAddress();
    const tag = new Uint8Array(Buffer.from(tagHex, 'hex'));
    return vaultView(await this.ledger(address), tag, tagHex);
  }

  /**
   * One wallet-backed session per contract address, connected lazily and
   * reused across claims (syncing the wallet is the slow part). The heir
   * witnesses are swapped per claim through `witnessOverrides`.
   */
  private session(address: string, overrides: Record<string, Function>): Promise<any> {
    // LiveSession.connect(null, { address, witnessOverrides }) attaches to the
    // deployed registry; a missing export means cli/dist is stale.
    const key = address.toLowerCase();
    let p = this.sessions.get(key);
    if (!p) {
      p = (async () => {
        const m: any = await import(cliDistUrl('session.js'));
        if (!m.LiveSession?.connect) throw new ClaimError('cli/dist/session.js has no LiveSession.connect; run `bun run build`', 503);
        const ref: { overrides: Record<string, Function> } = { overrides };
        // Late-bound overrides: every heir witness reads the CURRENT envelope.
        const bound: Record<string, Function> = {};
        for (const k of ['heirSecret', 'heirShare', 'heirPath'])
          bound[k] = (...args: any[]) => ref.overrides[k](...args);
        const session = await m.LiveSession.connect(undefined, { address, witnessOverrides: bound });
        return { session, ref };
      })();
      this.sessions.set(key, p);
      p.catch(() => this.sessions.delete(key));
    }
    return p.then((s) => { s.ref.overrides = overrides; return s.session; });
  }

  async claim(env: Envelope): Promise<ClaimResult> {
    const address = this.resolveAddress(env.contractAddress);
    const d = decodeEnvelope(env);
    const view = vaultView(await this.ledger(address), d.tag, env.vaultTag);
    const blocker = claimBlocker(view);
    if (blocker) throw new ClaimError(blocker);

    const overrides = await envelopeWitnesses(env, this.hasher);
    const session = await this.session(address, overrides);
    let r: { txHash: string | null; block: number | null };
    try {
      r = await session.call('claim', d.tag, { bytes: d.heirKey });
    } catch (e) {
      throw new ClaimError(circuitReason(e), 502);
    }
    const after = vaultView(await this.ledger(address), d.tag, env.vaultTag);
    return {
      txHash: r.txHash,
      block: r.block,
      received: d.share.toString(),
      remaining: after.remaining,
      nullifier: toHex(nullifier(this.hasher, d.heirSecret)),
      heirKey: env.heirKey,
      simulated: false,
    };
  }
}
