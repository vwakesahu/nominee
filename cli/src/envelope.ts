// SPDX-License-Identifier: Apache-2.0
//
// The heir envelope (format v2, docs/SPEC.md §3). Delivered OFF-CHAIN by the
// owner; it carries the heir's claim secret, so treat it like a seed phrase.
// Only a 32-byte Merkle root ever reaches the chain.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Hasher, Entry } from './crypto.js';
import { heirLeaf } from './crypto.js';
import { ownerTag } from './crypto.js';
import { type NetworkName } from './config.js';
import { NETWORKS } from './networks.js';
import type { Cast } from './session.js';
import type { Owner } from './witnesses.js';

export interface Envelope {
  version: 2;
  network: NetworkName;
  contractAddress: string;
  vaultTag: string;
  heirSecret: string;
  share: string;
  heirKey: string;
  merklePath: { sibling: string; goesLeft: boolean }[];
  indexerUrl: string;
}

const hex = (b: Uint8Array) => Buffer.from(b).toString('hex');
const unhex = (s: string) => new Uint8Array(Buffer.from(s.replace(/^0x/, ''), 'hex'));

/**
 * Build heir `heirIndex`'s envelope for the vault of `owner` (default: the
 * first owner of the cast). The path is for depth 16 against the heir root the
 * owner publishes with `updateWill`.
 */
export function exportEnvelope(
  cast: Cast, heirIndex: number, address: string, network: NetworkName,
  owner: Owner = cast.owners[0],
): Envelope {
  const h = cast.heirs[heirIndex];
  if (!h) throw new Error(`exportEnvelope: no heir at index ${heirIndex}`);
  return {
    version: 2,
    network,
    contractAddress: address,
    vaultTag: hex(ownerTag(cast.hasher, owner.secret, owner.willRoot)),
    heirSecret: hex(h.secret),
    share: h.share.toString(),
    heirKey: hex(h.key),
    merklePath: cast.heirTree.pathFor(heirIndex).map((e) => ({
      sibling: e.sibling.field.toString(), goesLeft: e.goes_left,
    })),
    // The base URL only: a Blockfrost project id must never travel inside an envelope.
    indexerUrl: NETWORKS[network]?.indexerHttpUrl ?? '',
  };
}

/**
 * Witness overrides for a claim made from an envelope alone: the heir's
 * secret, share and path. Merge over `makeWitnesses` via
 * `LiveSession.connect(null, { address, witnessOverrides })`.
 */
export function envelopeWitnesses(env: Envelope, hasher: Hasher) {
  const secret = unhex(env.heirSecret);
  const share = BigInt(env.share);
  const key = unhex(env.heirKey);
  const path: Entry[] = env.merklePath.map((e) => ({ sibling: { field: BigInt(e.sibling) }, goes_left: e.goesLeft }));
  return {
    heirSecret: (ctx: any) => [ctx.privateState, secret],
    heirShare:  (ctx: any) => [ctx.privateState, share],
    heirPath:   (ctx: any, leaf: Uint8Array) => [ctx.privateState, { leaf, path }],
    /** Not a witness; handy for callers that want to sanity-check the envelope against a root. */
    _leaf: () => heirLeaf(hasher, secret, share, key),
  };
}

/** Public parts a claimant needs as circuit arguments. */
export const envelopeTag = (env: Envelope) => unhex(env.vaultTag);
export const envelopeKey = (env: Envelope) => unhex(env.heirKey);

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
export const ENVELOPES_DIR = resolve(ROOT, 'deployments/envelopes');

/**
 * deployments/envelopes/<heirname>.json (gitignored: it holds the heir's secret).
 *
 * The flat path is reserved for LIVE runs on the local devnet (SPEC §2 pastes
 * `deployments/envelopes/maya.json`). Other networks write under
 * `<network>/`, simulator runs under `simulator/`, so a concurrent Preprod or
 * simulator run cannot overwrite the devnet envelopes a judge is about to use.
 */
export function writeEnvelope(env: Envelope, heirName: string, opts: { live: boolean } = { live: true }): string {
  const sub = !opts.live ? 'simulator' : env.network === 'undeployed' ? '' : env.network;
  const dir = sub ? resolve(ENVELOPES_DIR, sub) : ENVELOPES_DIR;
  mkdirSync(dir, { recursive: true });
  const file = resolve(dir, `${heirName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`);
  writeFileSync(file, JSON.stringify(env, null, 2) + '\n', { mode: 0o600 });
  return file;
}
