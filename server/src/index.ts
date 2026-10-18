// SPDX-License-Identifier: Apache-2.0
//
// Nominee heir-claim API. Plain Node http, no framework, run with `node`
// (never tsx: the wasm bindings must resolve to exactly one copy, see README).
//
//   GET  /api/health          -> { ok, network, contractAddress, mode }
//   GET  /api/vault/:tag      -> public ledger view for one owner tag
//   POST /api/claim           -> { txHash, block, received, remaining, ... } | { error, reason }
//   GET  /api/demo-envelope   -> simulator only, a valid envelope for the seeded vault
import './redact.js';   // first: masks the Blockfrost id in all output
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { Backend } from './backend.js';
import { ClaimError } from './backend.js';
import { HOST, LIVE, PORT, WEB_ORIGINS, loadConfig } from './config.js';
import { EnvelopeError, parseEnvelope } from './envelope.js';

const MAX_BODY = 1 << 20;

function cors(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers.origin;
  // Any loopback origin is fine in development (next dev picks another port
  // when 3000 is taken); anything else must be listed in NOMINEE_WEB_ORIGIN.
  const loopback = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin ?? '');
  if (origin && (loopback || WEB_ORIGINS.includes(origin) || WEB_ORIGINS.includes('*'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '600');
}

function json(res: ServerResponse, status: number, body: unknown) {
  const text = JSON.stringify(body, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(text);
}

const fail = (res: ServerResponse, status: number, error: string, reason: string) =>
  json(res, status, { error, reason });

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new ClaimError('request body too large', 413)); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handle(backend: Backend, req: IncomingMessage, res: ServerResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  try {
    if (req.method === 'GET' && path === '/api/health') {
      return json(res, 200, {
        ok: true, network: backend.network, contractAddress: backend.contractAddress() || null, mode: backend.mode,
      });
    }

    const vault = path.match(/^\/api\/vault\/([^/]+)$/);
    if (req.method === 'GET' && vault) {
      const tag = vault[1].replace(/^0x/, '').toLowerCase();
      if (!/^[0-9a-f]{64}$/.test(tag)) return fail(res, 400, 'bad_tag', 'vault tag must be 32 bytes of hex');
      return json(res, 200, await backend.vault(tag));
    }

    if (req.method === 'GET' && path === '/api/demo-envelope') {
      if (!backend.demoEnvelope) return fail(res, 404, 'no_demo', 'the demo envelope is only available in simulator mode (unset NOMINEE_LIVE)');
      const heir = Number(url.searchParams.get('heir') ?? '0');
      return json(res, 200, backend.demoEnvelope(Number.isInteger(heir) ? heir : 0));
    }

    if (req.method === 'POST' && path === '/api/claim') {
      let body: any;
      try { body = JSON.parse((await readBody(req)) || '{}'); }
      catch (e) { if (e instanceof ClaimError) throw e; return fail(res, 400, 'bad_json', 'request body is not valid JSON'); }
      const raw = body?.envelope ?? body;
      const envelope = parseEnvelope(raw);
      if (envelope.network !== backend.network)
        return fail(res, 400, 'wrong_network', `envelope is for "${envelope.network}" but this server is on "${backend.network}"`);
      const result = await backend.claim(envelope);
      return json(res, 200, result);
    }

    return fail(res, 404, 'not_found', `no route for ${req.method} ${path}`);
  } catch (e: any) {
    if (e instanceof EnvelopeError) return fail(res, 400, 'bad_envelope', e.reason);
    if (e instanceof ClaimError) return fail(res, e.status, 'claim_refused', e.reason);
    console.error(`[nominee-server] ${req.method} ${path}:`, e);
    return fail(res, 500, 'internal', e?.message ?? String(e));
  }
}

async function main() {
  const cfg = await loadConfig();
  let backend: Backend;
  if (LIVE) {
    const { LiveBackend } = await import('./live.js');
    backend = new LiveBackend(cfg);
  } else {
    const { SimBackend } = await import('./sim.js');
    backend = new SimBackend(cfg);
  }

  const server = createServer((req, res) => { void handle(backend, req, res); });
  server.listen(PORT, HOST, () => {
    console.log(`[nominee-server] ${backend.mode} mode on http://${HOST}:${PORT}  network=${backend.network}` +
      (backend.contractAddress() ? `  contract=${backend.contractAddress()}` : '') +
      (cfg.fromCli ? '' : '  (cli/dist/config.js not loaded; env fallback)'));
    if (backend.mode === 'simulator') {
      const b = backend as any;
      console.log(`[nominee-server] demo vault tag ${Buffer.from(b.tag).toString('hex')}; GET /api/demo-envelope?heir=0|1|2`);
    }
  });
  const stop = () => { server.close(); process.exit(0); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}

main().catch((e) => { console.error('[nominee-server] fatal:', e); process.exit(1); });
