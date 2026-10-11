// SPDX-License-Identifier: Apache-2.0
//
// Deploy the Nominee contract to the selected network and record the address.
//
// Unlike `demo`, this leaves something behind: the cohort secrets are derived
// from the wallet seed, so the same seed reconnects to the same contract and can
// still satisfy the owner-tree and guardian commitments the constructor made.
import chalk from 'chalk';
import { networkConfig, walletSeedHex, DEMO_GRACE_SECONDS } from '../config.js';
import { seededSecrets } from '../secrets.js';
import { buildCast, makeHasher, makeHeir, LiveSession, describeErr } from '../session.js';
import { emptyDeployment, load, save, deploymentsPath, type TxRecord } from '../state.js';
import { runPreflight } from '../preflight.js';
import { ok, fail, note, warn, banner } from '../display.js';

export interface DeployOptions {
  grace?: string;
  force?: boolean;
}

export async function deploy(opts: DeployOptions = {}) {
  banner();
  const net = networkConfig();
  console.log();
  note(`Target network: ${chalk.bold(net.name)}`);
  if (net.name === 'mainnet') {
    warn('This is MAINNET. Fees are paid in real NIGHT-derived DUST.');
  }
  console.log();

  // ---- preflight ---------------------------------------------------------
  const checks = await runPreflight();
  for (const c of checks) {
    c.ok ? ok(c.label) : (c.fatal ? fail(c.label) : warn(c.label));
    if (c.detail) note(`  ${c.detail}`);
  }
  if (checks.some((c) => !c.ok && c.fatal)) {
    console.log();
    fail('Preflight failed — nothing was submitted.');
    process.exit(1);
  }
  console.log();

  // ---- don't clobber an existing deployment ------------------------------
  const existing = load();
  if (existing.contractAddress && !opts.force) {
    warn(`${net.name} already has a deployment recorded:`);
    note(`  ${existing.contractAddress}`);
    note(`  in ${deploymentsPath()}`);
    note('Re-deploy with --force, or keep this one.');
    console.log();
    process.exit(1);
  }

  // ---- the cohort, derived from the seed ---------------------------------
  const grace = opts.grace ? BigInt(opts.grace) : DEMO_GRACE_SECONDS;
  const secrets = seededSecrets(walletSeedHex());
  const hasher = makeHasher();
  const heirs = [
    makeHeir('Maya', 500n, secrets),
    makeHeir('Raj', 300n, secrets),
    makeHeir('Sam', 200n, secrets),
  ];
  const cast = buildCast(hasher, ['Alice', 'Ben'], heirs, secrets);

  note(`Grace period: ${grace} seconds.`);
  note('Cohort secrets derived from the wallet seed — same seed, same cohort.');
  note('Syncing the wallet; the first run on a public network takes a while…');
  console.log();

  let live: LiveSession | null = null;
  try {
    live = await LiveSession.connect(cast, { grace });
  } catch (e) {
    console.log();
    fail('Deploy failed.');
    note(describeErr(e).slice(0, 400));
    const seedSet = !!process.env.NOMINEE_SEED_HEX;
    if (!net.local && seedSet && net.faucet) {
      note(`If this is a funding error, top the wallet up at ${net.faucet}`);
      note('and check the balance with:  nominee address');
    }
    process.exit(1);
  }

  const record = emptyDeployment();
  record.contractAddress = live.address;
  record.graceSeconds = Number(grace);
  const tx: TxRecord = {
    circuit: 'deploy',
    txHash: live.deployTxHash,
    block: null,
    status: 'accepted',
  };
  record.transactions = [tx];
  const path = save(record);

  console.log();
  ok(`Deployed to ${chalk.bold(net.name)}`);
  console.log(`\n  contract  ${chalk.bold(live.address)}`);
  if (live.deployTxHash) console.log(`  deploy tx ${live.deployTxHash}`);
  if (net.explorer) console.log(`  explorer  ${chalk.cyan(`${net.explorer}/contracts/${live.address}`)}`);
  console.log(`  record    ${path}\n`);
  note('Run the story against it with:  nominee demo --live');

  await live.close();
  console.log();
}
