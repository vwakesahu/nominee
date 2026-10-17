// SPDX-License-Identifier: Apache-2.0
//
// `nominee device`: a stand-in for the hardware possession factor.
//
// A real device is an ESP32 with a MAX30102 pulse sensor holding a Jubjub key
// in flash. It exposes the same two endpoints and signs ONLY while it reads a
// pulse. This process does the same with a flag standing in for the sensor.
//
//   GET  /pubkey        -> { x, y }                      the device's public key (decimal strings)
//   POST /sign { kind, now } -> { announcement: { x, y }, response }   Schnorr over [kind, now, 0, 0]
//                             kind 2 = heartbeat, kind 4 = updateWill; anything else -> 400
//                             -> 409 { error: "no pulse" }    when nobody is wearing the device
//
// The key lives in deployments/device.json (gitignored). The demo uses this
// signer when NOMINEE_DEVICE_URL is set and signs in-process otherwise.
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ok, note, warn } from '../display.js';
import { makeHasher } from '../session.js';
import { deviceKeypair, deviceMsg, schnorrSign, toPlainSignature, type DeviceKey, type DeviceKind } from '../crypto.js';

const ROOT = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
export const DEVICE_FILE = resolve(ROOT, 'deployments/device.json');

function loadOrCreateKey(hasher: any): DeviceKey {
  if (existsSync(DEVICE_FILE)) {
    const j = JSON.parse(readFileSync(DEVICE_FILE, 'utf8'));
    return { sk: BigInt(j.sk), x: BigInt(j.x), y: BigInt(j.y) };
  }
  const k = deviceKeypair(hasher);
  mkdirSync(dirname(DEVICE_FILE), { recursive: true });
  writeFileSync(DEVICE_FILE, JSON.stringify({ sk: k.sk.toString(), x: k.x.toString(), y: k.y.toString() }, null, 2) + '\n', { mode: 0o600 });
  note(`New device key written to ${DEVICE_FILE.replace(process.cwd() + '/', '')}`);
  return k;
}

export async function device(opts: { pulse?: boolean; port?: string } = {}) {
  const pulse = !!opts.pulse || process.env.NOMINEE_PULSE === '1';
  const port = Number(opts.port ?? 7777);
  const hasher = makeHasher();
  const key = loadOrCreateKey(hasher);

  const json = (res: any, code: number, body: unknown) => {
    res.writeHead(code, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  const server = createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/pubkey') {
      return json(res, 200, { x: key.x.toString(), y: key.y.toString() });
    }
    if (req.method === 'POST' && req.url === '/sign') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        if (!pulse) { warn('sign refused: no pulse'); return json(res, 409, { error: 'no pulse' }); }
        try {
          const req = JSON.parse(body || '{}');
          const kind = Number(req.kind ?? 2);
          if (kind !== 2 && kind !== 4) return json(res, 400, { error: `unknown message kind ${String(req.kind)} (2 = heartbeat, 4 = updateWill)` });
          const now = BigInt(req.now);
          const sig = toPlainSignature(schnorrSign(hasher, key, deviceMsg(now, kind as DeviceKind)));
          ok(`signed ${kind === 2 ? 'heartbeat' : 'updateWill'} for t=${now}`);
          json(res, 200, sig);
        } catch (e: any) { json(res, 400, { error: String(e?.message ?? e) }); }
      });
      return;
    }
    json(res, 404, { error: 'not found' });
  });

  await new Promise<void>((r) => server.listen(port, '127.0.0.1', r));
  console.log();
  ok(`nominee device listening on http://127.0.0.1:${port}  (pulse: ${pulse ? 'present' : 'ABSENT, signing refused'})`);
  note('GET /pubkey, POST /sign {kind, now} (2 = heartbeat, 4 = updateWill). An ESP32 + MAX30102 implements the same two endpoints.');
  note(`Run the demo with NOMINEE_DEVICE_URL=http://127.0.0.1:${port}`);
  console.log();
}
