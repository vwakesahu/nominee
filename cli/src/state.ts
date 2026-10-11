// SPDX-License-Identifier: Apache-2.0
// deployments/<network>.json — the record a judge can check against the indexer.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { currentNetwork, deploymentsFile } from './config.js';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

/** Resolved per call — the target network is chosen after this module loads. */
export const deploymentsPath = (): string => resolve(ROOT, deploymentsFile());

export interface TxRecord {
  circuit: string;
  txHash: string | null;
  block: number | null;
  status: 'accepted' | 'rejected';
  error?: string;
}

export interface Deployment {
  network: string;
  toolchain: string;
  contractAddress: string | null;
  graceSeconds: number;
  transactions: TxRecord[];
  simulatorOnly: string[];
  timestamp: string;
}

export function emptyDeployment(): Deployment {
  return {
    network: currentNetwork(),
    toolchain: '0.31.1',
    contractAddress: null,
    graceSeconds: 60,
    transactions: [],
    simulatorOnly: [],
    timestamp: new Date().toISOString(),
  };
}

export function load(): Deployment {
  const path = deploymentsPath();
  if (!existsSync(path)) return emptyDeployment();
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch { return emptyDeployment(); }
}

export function save(d: Deployment) {
  const path = deploymentsPath();
  d.network = currentNetwork();
  d.timestamp = new Date().toISOString();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(d, null, 2) + '\n');
  return path;
}
