// SPDX-License-Identifier: Apache-2.0
//
// Envelope v2 (SPEC §3): parsing, validation and the witness overrides that
// let a session claim with nothing but the envelope's own secret, share and
// Merkle path.
import { cliDistUrl } from './config.js';
import { fromHex, type Entry, type Hasher } from './crypto.js';

export interface EnvelopeEntry { sibling: string; goesLeft: boolean }

export interface Envelope {
  version: 2;
  network: 'undeployed' | 'preview' | 'preprod';
  contractAddress: string;
  vaultTag: string;
  heirSecret: string;
  share: string;
  heirKey: string;
  merklePath: EnvelopeEntry[];
  indexerUrl?: string;
}

/** The envelope decoded into circuit-ready values. */
export interface DecodedEnvelope {
  tag: Uint8Array;
  heirSecret: Uint8Array;
  share: bigint;
  heirKey: Uint8Array;
  path: Entry[];
}

export class EnvelopeError extends Error {
  constructor(public readonly reason: string) { super(reason); }
}

const UINT128_MAX = (1n << 128n) - 1n;
const FIELD_MAX = 52435875175126190479447740508185965837690552500527637822603658699938581184512n;

/** Validate an untrusted JSON value as an Envelope. Throws EnvelopeError. */
export function parseEnvelope(raw: unknown): Envelope {
  if (!raw || typeof raw !== 'object') throw new EnvelopeError('envelope must be a JSON object');
  const e = raw as Record<string, unknown>;
  if (Number(e.version) !== 2) throw new EnvelopeError(`unsupported envelope version ${String(e.version)} (expected 2)`);
  const str = (k: string) => {
    if (typeof e[k] !== 'string' || !(e[k] as string).length) throw new EnvelopeError(`envelope.${k} is missing`);
    return e[k] as string;
  };
  const hex = (k: string, bytes: number) => {
    const v = str(k);
    try { fromHex(v, bytes); } catch (err: any) { throw new EnvelopeError(`envelope.${k}: ${err.message}`); }
    return v;
  };
  const network = str('network');
  if (!['undeployed', 'preview', 'preprod'].includes(network)) throw new EnvelopeError(`envelope.network "${network}" is not a known network`);
  const contractAddress = str('contractAddress');
  const vaultTag = hex('vaultTag', 32);
  const heirSecret = hex('heirSecret', 32);
  const heirKey = hex('heirKey', 32);
  const share = str('share');
  if (!/^\d+$/.test(share) || BigInt(share) > UINT128_MAX) throw new EnvelopeError('envelope.share must be a decimal Uint<128>');
  if (!Array.isArray(e.merklePath) || e.merklePath.length !== 16) throw new EnvelopeError('envelope.merklePath must have 16 entries');
  const merklePath = (e.merklePath as unknown[]).map((p, i) => {
    const q = p as Record<string, unknown>;
    if (!q || typeof q.sibling !== 'string' || !/^\d+$/.test(q.sibling) || BigInt(q.sibling) >= FIELD_MAX)
      throw new EnvelopeError(`envelope.merklePath[${i}].sibling must be a decimal field element`);
    if (typeof q.goesLeft !== 'boolean') throw new EnvelopeError(`envelope.merklePath[${i}].goesLeft must be a boolean`);
    return { sibling: q.sibling, goesLeft: q.goesLeft };
  });
  const indexerUrl = typeof e.indexerUrl === 'string' ? e.indexerUrl : undefined;
  return { version: 2, network: network as Envelope['network'], contractAddress, vaultTag, heirSecret, share, heirKey, merklePath, indexerUrl };
}

export function decodeEnvelope(env: Envelope): DecodedEnvelope {
  return {
    tag: fromHex(env.vaultTag, 32),
    heirSecret: fromHex(env.heirSecret, 32),
    share: BigInt(env.share),
    heirKey: fromHex(env.heirKey, 32),
    path: env.merklePath.map((p) => ({ sibling: { field: BigInt(p.sibling) }, goes_left: p.goesLeft })),
  };
}

/** Local implementation of the heir witness overrides (SPEC §0 / §1.4). */
export function localEnvelopeWitnesses(env: Envelope, _hasher: Hasher): Record<string, Function> {
  const d = decodeEnvelope(env);
  return {
    heirSecret: (ctx: any) => [ctx.privateState, d.heirSecret],
    heirShare:  (ctx: any) => [ctx.privateState, d.share],
    // The circuit computes the leaf (with the public heirKey) and hands it to
    // us; we return it with the owner-built path from the envelope.
    heirPath:   (ctx: any, leaf: Uint8Array) => [ctx.privateState, { leaf, path: d.path }],
  };
}

/**
 * Prefer the CLI's own `envelopeWitnesses(envelope, hasher)` from
 * cli/dist/envelope.js (SPEC §1.4) when it exists; fall back to the local copy.
 * TODO(cli-live): drop the fallback once cli/dist/envelope.js is in the build.
 */
export async function envelopeWitnesses(env: Envelope, hasher: Hasher): Promise<Record<string, Function>> {
  try {
    const m: any = await import(cliDistUrl('envelope.js'));
    if (typeof m.envelopeWitnesses === 'function') {
      const w = m.envelopeWitnesses(env, hasher);
      if (w && ['heirSecret', 'heirShare', 'heirPath'].every((k) => typeof w[k] === 'function')) return w;
    }
  } catch { /* not built yet */ }
  return localEnvelopeWitnesses(env, hasher);
}
