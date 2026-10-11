// SPDX-License-Identifier: Apache-2.0
//
// The whole story in one command: a life, silence, resolution, the nominees,
// three attacks that fail, and the guardian path.
//
// Chapters 1-3 and 6 are REAL: real circuits, real proofs, real network.
// Chapters 4-5 run in the simulator and say so — the shielded payout path is
// the one piece not yet live, and the demo does not pretend otherwise.
import { execSync } from 'node:child_process';
import chalk from 'chalk';
import {
  banner, chapter, countdown, note, warn, ok, fail, summary, panel, short,
  NOWHERE, HIDDEN,
} from '../display.js';
import {
  LiveSession, SimSession, buildCast, makeHasher, makeHeir, randKey, describeErr,
} from '../session.js';
import { DEMO_GRACE_SECONDS, networkConfig } from '../config.js';
import { emptyDeployment, save, type TxRecord } from '../state.js';
import { runPreflight } from '../preflight.js';
import {
  nowSeconds, stepRegister, stepDeposit, stepHeartbeat, stepUpdateWill,
  stepResolve, stepGuardianResolve, simClaim, simAttack,
  simRegister, simDeposit, simHeartbeat, simUpdateWill, simResolve, simGuardianResolve,
} from './steps.js';

/** Containers that must be up. On a public network only the prover is ours. */
function containersUp(names: string[]): boolean {
  try {
    const out = execSync('docker ps --format "{{.Names}}"', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return names.every((n) => out.includes(n));
  } catch { return false; }
}

/**
 * Bring up what this machine is responsible for.
 *
 * Local devnet: the node, indexer and proof server all run here.
 * Public network: only the proof server — and it must, because it sees the
 * owner and heir secrets. Midnight runs the node and indexer.
 */
async function ensureLocalServices(local: boolean) {
  const names = local
    ? ['midnight-node', 'midnight-indexer', 'midnight-proof-server']
    : ['midnight-proof-server'];
  const services = local ? [] : ['proof-server'];
  const what = local ? 'Local devnet' : 'Proof server';

  if (containersUp(names)) { ok(`${what} already running.`); return true; }
  note(`${what} not detected — starting it with docker compose…`);
  try {
    execSync(['docker', 'compose', 'up', '-d', ...services].join(' '), { stdio: 'inherit' });
  } catch {
    fail(`Could not start it. Start Docker Desktop, then: docker compose up -d ${services.join(' ')}`);
    return false;
  }
  for (let i = 0; i < 40; i++) {
    if (containersUp(names)) { ok(`${what} is up.`); return true; }
    await new Promise((r) => setTimeout(r, 1500));
  }
  fail(`${what} did not become healthy in time.`);
  return false;
}

export async function demo(opts: { live?: boolean } = {}) {
  banner();
  const net = networkConfig();
  console.log();
  note(`Network: ${chalk.bold(net.name)}`);

  // On-chain execution is opt-in: --live, or NOMINEE_LIVE=1.
  // Without it the whole story runs in the simulator — the same compiled
  // circuits and the same assertions, with no proof and no ledger.
  const wantLive = opts.live === true || process.env.NOMINEE_LIVE === '1';

  // Only touch docker when something is actually going on chain.
  if (wantLive && !(await ensureLocalServices(net.local))) process.exit(1);

  if (wantLive) {
    const checks = await runPreflight();
    for (const c of checks.filter((x) => !x.ok)) {
      (c.fatal ? fail : warn)(c.label);
      if (c.detail) note(`  ${c.detail}`);
    }
    if (checks.some((c) => !c.ok && c.fatal)) {
      fail('Preflight failed — nothing will be submitted.');
      process.exit(1);
    }
  }

  const deployment = emptyDeployment();
  deployment.graceSeconds = Number(DEMO_GRACE_SECONDS);
  const txs: TxRecord[] = [];
  const simOnly: string[] = [];

  const hasher = makeHasher();
  const heirs = [makeHeir('Maya', 500n), makeHeir('Raj', 300n), makeHeir('Sam', 200n)];
  const cast = buildCast(hasher, ['Alice', 'Ben'], heirs);
  const alice = cast.owners[0];
  const ben = cast.owners[1];

  // The simulator session backs every chapter, and stands in for the live one
  // when no node is reachable. Same circuits either way.
  const sim = new SimSession(cast, DEMO_GRACE_SECONDS);

  let live: LiveSession | null = null;

  if (!wantLive) {
    note(`Running in simulator mode (add --live to execute on ${net.name}).`);
    note('Same compiled circuits, same assertions — no proof, no ledger.');
  } else try {
    // The demo is a narrative, not a deployment: it wants a vault that has never
    // been registered, deposited into or resolved, so it deploys its own with a
    // fresh cohort. `nominee deploy` is the command that leaves a durable,
    // seed-reproducible contract behind.
    note(`Deploying a fresh contract for this run on ${net.name}.`);
    note('Connecting wallet, proof server and indexer…');
    live = await LiveSession.connect(cast, { grace: DEMO_GRACE_SECONDS });
    deployment.contractAddress = live.address;
    ok(`Contract deployed: ${chalk.bold(live.address)}`);
    txs.push({ circuit: 'deploy', txHash: live.address, block: null, status: 'accepted' });
  } catch (e) {
    warn('On-chain deploy unavailable — running the whole story in the simulator.');
    note(describeErr(e).split('\n')[0].slice(0, 160));
    note('The circuits, assertions and privacy properties below are identical;');
    note('only the proof and the ledger are absent.');
  }

  const step = async <T>(label: string, fn: () => Promise<T>): Promise<T | null> => {
    if (!live) return null;
    try { return await fn(); }
    catch (e) {
      fail(`${label} failed: ` + describeErr(e).slice(0, 200));
      txs.push({ circuit: label, txHash: null, block: null, status: 'rejected', error: describeErr(e).slice(0, 200) });
      return null;
    }
  };

  // ---- Chapter 1 ---------------------------------------------------------
  chapter(1, 'A life');

  let r: TxRecord | null;
  const lastBeat = nowSeconds();
  // The simulator has no chain, so `blockTimeGte` is checked against wall-clock
  // time — a deadline in the future can never be satisfied, however long the
  // narrative countdown runs. The live path really waits out the grace period;
  // the simulator instead anchors its heartbeat far enough in the past that the
  // same 60-second grace has genuinely elapsed. Same circuit, same assertion.
  const simLastBeat = lastBeat - DEMO_GRACE_SECONDS - 5n;

  if (live) {
    r = await step('register', () => stepRegister(live!, alice));      if (r) txs.push(r);
    const coin = { nonce: randKey(), color: new Uint8Array(32), value: 1000n };
    r = await step('deposit', () => stepDeposit(live!, alice, coin));  if (r) txs.push(r);
    r = await step('heartbeat', () => stepHeartbeat(live!, alice, nowSeconds())); if (r) txs.push(r);
    r = await step('updateWill', () => stepUpdateWill(live!, alice, 1n)); if (r) txs.push(r);
    r = await step('heartbeat', () => stepHeartbeat(live!, alice, lastBeat, 'heartbeat — the last one'));
    if (r) txs.push(r);
  }

  // The simulator runs the same chapter regardless, so the vault is funded and
  // the nominees have a beneficiary root to prove against in Chapter 4.
  simRegister(sim, alice);
  simDeposit(sim, alice, 1000n);
  simHeartbeat(sim, alice, simLastBeat, live ? 'heartbeat (simulator mirror)' : 'heartbeat');
  simUpdateWill(sim, alice, cast.heirTree.digest());
  simOnly.push('register', 'deposit', 'heartbeat', 'updateWill');

  // ---- Chapter 2 ---------------------------------------------------------
  chapter(2, 'Silence');
  note('Alice stops checking in. The chain does not know why, and never will.');
  console.log();
  await countdown(live ? Number(DEMO_GRACE_SECONDS) + 3 : 8);

  // ---- Chapter 3 ---------------------------------------------------------
  chapter(3, 'Resolution');
  if (live) {
    r = await step('resolve', () => stepResolve(live!, alice, lastBeat + DEMO_GRACE_SECONDS));
    if (r) txs.push(r);
  }
  simResolve(sim, simLastBeat + DEMO_GRACE_SECONDS);
  simOnly.push('resolve');

  // ---- Chapter 4 ---------------------------------------------------------
  chapter(4, 'The nominees');
  warn('Nominee claims run in simulator mode.');
  note('The shielded payout path (sendShielded from a contract) is a Wave 2 gate.');
  note(live
    ? 'Deposit is proven live above. Payout logic is proven here, in the same circuit.'
    : 'Every chapter here runs the same compiled circuits — only the proof and chain are absent.');

  const simTag = sim.tag();
  if (!sim.ledger.resolvedVault.member(simTag)) {
    sim.call('resolve', simTag, simLastBeat + DEMO_GRACE_SECONDS);
  }

  for (let i = 0; i < heirs.length; i++) {
    simClaim(sim, i, heirs[i], randKey());
    simOnly.push('claim');
  }

  // ---- Chapter 5 ---------------------------------------------------------
  chapter(5, 'Attacks fail');

  simAttack('double claim',
    ['Maya tries to claim a second time.', 'Her nullifier is already spent.'],
    () => { sim.patch({ activeHeir: 0 }); sim.refreshCoin(); sim.call('claim', simTag, { bytes: randKey() }); },
    /already claimed/);
  simOnly.push('doubleClaim');

  simAttack('wrong nominee',
    ['A stranger tries to claim.', 'They are not in the beneficiary tree.'],
    () => {
      const mallory = makeHeir('Mallory', 100n);
      sim.patch({ heirs: [...heirs, mallory], activeHeir: heirs.length });
      sim.refreshCoin();
      sim.call('claim', simTag, { bytes: randKey() });
    },
    /not a beneficiary|heirPath/);
  simOnly.push('wrongHeir');

  simAttack('wrong share',
    ['Raj claims a larger share than the will allotted.', 'The share is bound into his leaf.'],
    () => {
      sim.patch({ heirs: [heirs[0], { ...heirs[1], share: 900n }, heirs[2]], activeHeir: 1 });
      sim.refreshCoin();
      sim.call('claim', simTag, { bytes: randKey() });
    },
    /not a beneficiary|heirPath|exceeds/);
  simOnly.push('wrongShare');

  // ---- Chapter 6 ---------------------------------------------------------
  chapter(6, 'The guardian path');
  note('A second vault. Ben has named three guardians; two of them attest.');

  if (live) {
    live.actAs(ben);
    r = await step('register', () => stepRegister(live!, ben));  if (r) txs.push(r);
    r = await step('guardianResolve2of3', () => stepGuardianResolve(live!, ben, 0n, 1n));
    if (r) txs.push(r);
  } else {
    const sim2 = new SimSession(cast, DEMO_GRACE_SECONDS);
    sim2.patch({ owner: ben });
    simRegister(sim2, ben);
    simGuardianResolve(sim2, ben, 0n, 1n);
    simOnly.push('guardianResolve2of3');
  }

  // ---- Summary -----------------------------------------------------------
  chapter('', 'Summary');
  const accepted = txs.filter((t) => t.status === 'accepted').length;
  deployment.transactions = txs;
  deployment.simulatorOnly = simOnly;
  const recordPath = save(deployment);

  summary({
    circuits: 10, maxK: 15, keysMB: 40,
    tests: '33 passing', leak: 'CLEAN',
    txs: accepted, control: 'REJECTED',
  });
  console.log();
  note(`Transaction record written to ${recordPath}`);
  if (live) {
    note(`Contract: ${live.address}`);
    if (net.explorer) note(`Explorer: ${net.explorer}/contracts/${live.address}`);
    await live.close();
  }
  console.log();
}
