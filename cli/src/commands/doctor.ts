// SPDX-License-Identifier: Apache-2.0
// Pre-flight: is everything a judge needs actually present and reachable?
import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { ok, fail, note } from '../display.js';
import { networkConfig } from '../config.js';
import { ZK_CONFIG_PATH } from '../providers.js';

const probe = async (label: string, fn: () => Promise<boolean> | boolean) => {
  try { (await fn()) ? ok(label) : fail(label); }
  catch { fail(label); }
};

export async function doctor() {
  console.log('\n  nominee doctor\n');

  await probe(`contract build present (${ZK_CONFIG_PATH})`, () => {
    if (!existsSync(ZK_CONFIG_PATH)) return false;
    const keys = readdirSync(`${ZK_CONFIG_PATH}/keys`).filter((f) => f.endsWith('.prover'));
    note(`  ${keys.length} proving keys`);
    return keys.length === 10;
  });

  await probe('docker running', () => {
    execSync('docker ps', { stdio: 'ignore' });
    return true;
  });

  for (const [label, url] of [
    ['proof server', networkConfig.proofServer],
    ['indexer', networkConfig.indexerHttpUrl.replace('/api/v4/graphql', '')],
  ] as const) {
    await probe(`${label} reachable (${url})`, async () => {
      const r = await fetch(url).catch(() => null);
      return !!r;
    });
  }

  await probe('node responding', async () => {
    const http = networkConfig.node.replace(/^ws/, 'http');
    const r = await fetch(http, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'system_chain', params: [] }),
    }).catch(() => null);
    if (!r) return false;
    const j: any = await r.json().catch(() => null);
    if (j?.result) note(`  chain: ${j.result}`);
    return !!j?.result;
  });

  const major = Number(process.versions.node.split('.')[0]);
  major === 22 ? ok(`node ${process.versions.node}`)
               : note(`node ${process.versions.node} — 22 is the supported version`);
  console.log();
}
