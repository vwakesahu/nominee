// SPDX-License-Identifier: Apache-2.0
//
// The checks that must pass before a transaction can be submitted, in the order
// they fail cheapest. Shared by `doctor` and `deploy`.
import { existsSync, readdirSync } from 'node:fs';
import { networkConfig } from './config.js';
import { ZK_CONFIG_PATH } from './zkconfig.js';

/** A health probe that cannot answer in 8s is down as far as this is concerned. */
const PROBE_TIMEOUT_MS = Number(process.env.NOMINEE_PROBE_TIMEOUT_MS ?? 8000);
const probe = (url: string, init: RequestInit = {}) =>
  fetch(url, { ...init, signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) }).catch(() => null);

export interface Check {
  label: string;
  ok: boolean;
  detail?: string;
  /** A failure that blocks submission, as opposed to a warning. */
  fatal: boolean;
}

/**
 * Node 23+ ships a built-in WebSocket that drops RPC submissions on the public
 * networks with wallet SDK 1.2.0 — the transaction is proved, sent, and simply
 * never lands. Recorded in validation/VALIDATION_REPORT.md §D16 and independently
 * by onepledge. On the local devnet it does not bite.
 */
export function checkNodeRuntime(): Check {
  const major = Number(process.versions.node.split('.')[0]);
  const local = networkConfig().local;
  if (major === 22) return { label: `node ${process.versions.node}`, ok: true, fatal: false };
  if (major < 22) {
    return {
      label: `node ${process.versions.node}`,
      ok: false,
      fatal: true,
      detail: 'Node 22 is required — the SDK needs APIs older releases do not have.',
    };
  }
  return {
    label: `node ${process.versions.node}`,
    ok: false,
    fatal: !local,
    detail:
      'Node 23+ uses a built-in WebSocket that silently drops public-network RPC ' +
      'submissions (wallet SDK 1.2.0). Run under Node 22:  npx -y node@22 ' +
      '$(command -v npm) run <script>   — or use nvm/fnm to select 22.',
  };
}

export function checkContractBuild(): Check {
  if (!existsSync(ZK_CONFIG_PATH)) {
    return {
      label: `contract build (${ZK_CONFIG_PATH})`,
      ok: false,
      fatal: true,
      detail: 'Missing. Build it with:  npm run compact',
    };
  }
  let keys: string[] = [];
  try { keys = readdirSync(`${ZK_CONFIG_PATH}/keys`).filter((f) => f.endsWith('.prover')); }
  catch { /* no keys dir */ }
  return {
    label: `contract build (${ZK_CONFIG_PATH})`,
    ok: keys.length === 10,
    fatal: true,
    detail: `${keys.length} proving keys (expected 10)`,
  };
}

/** The proof server is local on every network — never point this at a host you do not own. */
export async function checkProofServer(): Promise<Check> {
  const url = networkConfig().proofServer;
  const r = await probe(url);
  return {
    label: `proof server (${url})`,
    ok: !!r,
    fatal: true,
    detail: r ? undefined : 'Not reachable. Start it with:  docker compose up -d proof-server',
  };
}

export async function checkIndexer(): Promise<Check> {
  const url = networkConfig().indexerHttpUrl;
  // A trivial valid query — a 200 with `data` proves the schema is live, not
  // merely that something is listening.
  const r = await probe(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '{ __typename }' }),
  });
  if (!r) return { label: `indexer (${url})`, ok: false, fatal: true, detail: 'Not reachable.' };
  const j: any = await r.json().catch(() => null);
  return {
    label: `indexer (${url})`,
    ok: !!j?.data,
    fatal: true,
    detail: j?.data ? undefined : `HTTP ${r.status} — GraphQL did not answer.`,
  };
}

export async function checkNode(): Promise<Check> {
  const ws = networkConfig().node;
  const http = ws.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
  const r = await probe(http, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'system_chain', params: [] }),
  });
  if (!r) return { label: `node (${ws})`, ok: false, fatal: true, detail: 'Not reachable.' };
  const j: any = await r.json().catch(() => null);
  return {
    label: `node (${ws})`,
    ok: !!j?.result,
    fatal: true,
    detail: j?.result ? `chain: ${j.result}` : `HTTP ${r.status} — no RPC result.`,
  };
}

export async function runPreflight(): Promise<Check[]> {
  return [
    checkNodeRuntime(),
    checkContractBuild(),
    await checkProofServer(),
    await checkIndexer(),
    await checkNode(),
  ];
}
