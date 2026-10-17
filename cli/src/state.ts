// SPDX-License-Identifier: Apache-2.0
// deployments/devnet.json, the record a judge can check against the indexer.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NETWORK } from './config.js';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
export const DEPLOYMENTS_PATH = resolve(ROOT, `deployments/${NETWORK === 'undeployed' ? 'devnet' : NETWORK}.json`);

export interface TxRecord {
  circuit: string;
  txHash: string | null;
  block: number | null;
  status: 'accepted' | 'rejected';
  error?: string;
  /** A refusal the story relies on (e.g. finalize after a veto). */
  expected?: boolean;
}

export interface Deployment {
  network: string;
  toolchain: string;
  contractAddress: string | null;
  /** The testnet demo token the deposit was minted from, when NOMINEE_DEPOSIT=token. */
  tokenContract?: string;
  /** What the vault was funded with; absent means a native shielded coin. */
  depositAsset?: string;
  graceSeconds: number;
  challengeSeconds: number;
  transactions: TxRecord[];
  simulatorOnly: string[];
  timestamp: string;
}

export function emptyDeployment(): Deployment {
  return {
    network: NETWORK === 'undeployed' ? 'local-devnet' : NETWORK,
    toolchain: '0.31.1',
    contractAddress: null,
    graceSeconds: 60,
    challengeSeconds: 30,
    transactions: [],
    simulatorOnly: [],
    timestamp: new Date().toISOString(),
  };
}

export function load(): Deployment {
  if (!existsSync(DEPLOYMENTS_PATH)) return emptyDeployment();
  try { return JSON.parse(readFileSync(DEPLOYMENTS_PATH, 'utf8')); }
  catch { return emptyDeployment(); }
}

export function save(d: Deployment) {
  d.timestamp = new Date().toISOString();
  mkdirSync(dirname(DEPLOYMENTS_PATH), { recursive: true });
  // Ledger values are bigints; never let one abort the record after a live run.
  const json = JSON.stringify(d, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2);
  writeFileSync(DEPLOYMENTS_PATH, json + '\n');
}
