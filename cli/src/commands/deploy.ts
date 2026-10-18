// SPDX-License-Identifier: Apache-2.0
//
// Deploy the Nominee contract to the selected network and record the address.
//
// Unlike `demo`, this leaves something behind: the cohort secrets (owner
// secrets, device keys, guardian keys) are derived from the wallet seed, so the
// same seed reconnects to the same contract and can still satisfy the
// owner-tree and guardian commitments the constructor made.
import chalk from 'chalk';
import { networkConfig, walletSeedHex, DEMO_GRACE_SECONDS, DEMO_CHALLENGE_SECONDS } from '../config.js';
import { seededSecrets } from '../secrets.js';
import { buildCast, makeHasher, LiveSession, describeErr } from '../session.js';
import { emptyDeployment, load, save, deploymentsPath, type TxRecord } from '../state.js';
import { runPreflight } from '../preflight.js';
import { ok, fail, note, warn, banner } from '../display.js';

export interface DeployOptions {
  grace?: string;
  challenge?: string;
  force?: boolean;
}

export async function deploy(opts: DeployOptions = {}) {
  banner();
  const net = networkConfig();
  console.log();
  note(`Target network: ${chalk.bold(net.name)}`);
  if (net.name === 'mainnet') {
    warn('This is MAINNET. Fees are paid in real NIGHT-derived DUST.');
    warn('The demo token (tNOM) is testnet-only; never deploy contract/token here.');
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
    fail('Preflight failed, nothing was submitted.');
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
  const challenge = opts.challenge ? BigInt(opts.challenge) : DEMO_CHALLENGE_SECONDS;
  const secrets = seededSecrets(walletSeedHex());
  const hasher = makeHasher();
  // The constructor commits to the owner tree and the guardian keys only. The
  // beneficiaries arrive later, through a device-signed updateWill.
  const cast = buildCast(hasher, ['Alice', 'Ben'], [], secrets);

  note(`Grace period: ${grace} seconds. Veto window: ${challenge} seconds.`);
  note('Cohort secrets and device keys derived from the wallet seed: same seed, same cohort.');
  note('Syncing the wallet; the first run on a public network scans the DUST history (checkpointed).');
  console.log();

  let live: LiveSession | null = null;
  try {
    live = await LiveSession.connect(cast, { grace, challenge });
  } catch (e) {
    console.log();
    fail('Deploy failed.');
    note(describeErr(e).slice(0, 400));
    if (!net.local && net.faucet) {
      note(`If this is a funding error, top the wallet up at ${net.faucet}`);
      note('and check the balance with:  nominee address');
    }
    process.exit(1);
  }

  const record = emptyDeployment();
  record.contractAddress = live.address;
  record.graceSeconds = Number(grace);
  record.challengeSeconds = Number(challenge);
  const tx: TxRecord = {
    circuit: 'deploy',
    txHash: live.deployTxHash,
    block: live.deployed?.deployTxData?.public?.blockHeight ?? null,
    status: 'accepted',
  };
  record.transactions = [tx, ...live.setupTxs.map((t) => ({ ...t, status: 'accepted' as const }))];
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
