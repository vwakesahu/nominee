// SPDX-License-Identifier: Apache-2.0
// Pre-flight: is everything a judge needs actually present and reachable?
import { execSync } from 'node:child_process';
import chalk from 'chalk';
import { ok, fail, note, warn } from '../display.js';
import { networkConfig, walletConfigured } from '../config.js';
import { runPreflight } from '../preflight.js';

export async function doctor() {
  const net = networkConfig();
  console.log(`\n  nominee doctor, network ${chalk.bold(net.name)}\n`);

  // Docker only matters for what actually runs in it. On a public network that
  // is the proof server alone; the node and indexer are Midnight's.
  const dockerOk = (() => {
    try { execSync('docker ps', { stdio: 'ignore' }); return true; } catch { return false; }
  })();
  if (dockerOk) {
    ok('docker running');
  } else {
    warn('docker not running');
    note(net.local
      ? '  The whole devnet runs in docker:  docker compose up -d'
      : '  The proof server runs in docker:  ./run-preprod.sh starts one, or docker compose up -d proof-server');
  }

  for (const c of await runPreflight()) {
    c.ok ? ok(c.label) : (c.fatal ? fail(c.label) : warn(c.label));
    if (c.detail) note(`  ${c.detail}`);
  }

  if (!net.local) {
    note(`  faucet:   ${net.faucet ?? 'none, this network needs real NIGHT'}`);
    note(`  explorer: ${net.explorer ?? 'none'}`);
    if (!walletConfigured()) {
      warn('no wallet configured');
      note('  Set NOMINEE_MNEMONIC_FILE=<file>, NOMINEE_MNEMONIC="..." or NOMINEE_SEED_HEX=<64 hex>');
      note('  Then fund the address from:  nominee address');
    } else {
      ok('wallet configured');
    }
    if (net.blockfrost) {
      process.env.NOMINEE_BLOCKFROST
        ? ok('NOMINEE_BLOCKFROST is set')
        : warn(`NOMINEE_BLOCKFROST is not set; ${net.name} is served by Blockfrost and needs a project id`);
    }
  }
  console.log();
}
