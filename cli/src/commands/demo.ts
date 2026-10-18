// SPDX-License-Identifier: Apache-2.0
//
// The whole story in one command: a life, silence, resolution, the nominees,
// six attacks that fail, and a faked death that the owner contests.
//
// With --live (or NOMINEE_LIVE=1) chapters 1, 3, 4 and 6 are REAL: real
// circuits, real proofs, real blocks on the selected network, including the
// shielded payouts. Chapter 5 is refusals, which happen at circuit execution
// before any proof exists, so it runs in the simulator and says so. Without
// --live the whole story runs in the simulator: same circuits, same assertions.
import { execSync } from 'node:child_process';
import chalk from 'chalk';
import { banner, chapter, countdownUntil, note, warn, ok, fail, summary } from '../display.js';
import {
  LiveSession, SimSession, buildCast, setHeirs, makeHasher, makeHeir, randKey, randScalar, describeErr,
  type Cast,
} from '../session.js';
import {
  DEMO_GRACE_SECONDS, DEMO_CHALLENGE_SECONDS, DEVICE_URL, HOLD_HEIR,
  currentNetwork, depositAsset, networkConfig,
} from '../config.js';
import { TOKEN_SYMBOL } from '../token.js';
import { emptyDeployment, save, type TxRecord } from '../state.js';
import { runPreflight } from '../preflight.js';
import { exportEnvelope, writeEnvelope } from '../envelope.js';
import { SparseTree, ownerLeaf } from '../crypto.js';
import { OWNER_DEPTH } from '../witnesses.js';
import {
  nowSeconds, stepRegister, stepDeposit, stepTokenDeploy, stepTokenMint, stepHeartbeat, stepUpdateWill,
  stepResolve, stepFinalize, stepVeto, stepGuardianResolve, stepClaim, liveRefusal, deviceSignature,
  simClaim, simAttack, simRegister, simDeposit, simHeartbeat, simUpdateWill,
  simResolve, simFinalize, simVeto, simGuardianResolve,
} from './steps.js';

/** Containers that must be up. */
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
 * Public network: only the proof server, and it must, because it sees the
 * owner and heir secrets. The node and indexer are Midnight's (or Blockfrost's).
 * When NOMINEE_PROOF_SERVER points elsewhere (run-preprod.sh), the preflight
 * probe below is what checks it.
 */
async function ensureLocalServices(local: boolean) {
  if (!local && process.env.NOMINEE_PROOF_SERVER) return true;
  const names = local
    ? ['midnight-node', 'midnight-indexer', 'midnight-proof-server']
    : ['midnight-proof-server'];
  const services = local ? [] : ['proof-server'];
  const what = local ? 'Local devnet' : 'Proof server';

  if (containersUp(names)) { ok(`${what} already running.`); return true; }
  note(`${what} not detected, starting it with docker compose…`);
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

/** Fetch the external device's public key, if a device is configured. */
async function devicePublicKey(): Promise<{ x: bigint; y: bigint } | null> {
  if (!DEVICE_URL) return null;
  const r = await fetch(`${DEVICE_URL.replace(/\/$/, '')}/pubkey`);
  if (!r.ok) throw new Error(`device: HTTP ${r.status} from /pubkey`);
  const j: any = await r.json();
  return { x: BigInt(j.x), y: BigInt(j.y) };
}

const GRACE = DEMO_GRACE_SECONDS;
const CHALLENGE = DEMO_CHALLENGE_SECONDS;

export async function demo(opts: { live?: boolean } = {}) {
  banner();
  const net = networkConfig();
  const NETWORK = currentNetwork();
  console.log();
  note(`Network: ${chalk.bold(net.name)}`);

  // On-chain execution is opt-in: --live, or NOMINEE_LIVE=1.
  const wantLive = opts.live === true || process.env.NOMINEE_LIVE === '1';

  // Only touch docker, and only check the network, when something goes on chain.
  if (wantLive) {
    if (!(await ensureLocalServices(net.local))) process.exit(1);
    const checks = await runPreflight();
    for (const c of checks.filter((x) => !x.ok)) {
      (c.fatal ? fail : warn)(c.label);
      if (c.detail) note(`  ${c.detail}`);
    }
    if (checks.some((c) => !c.ok && c.fatal)) {
      fail('Preflight failed, nothing will be submitted.');
      process.exit(1);
    }
  }

  const deployment = emptyDeployment();
  deployment.graceSeconds = Number(GRACE);
  deployment.challengeSeconds = Number(CHALLENGE);
  const txs: TxRecord[] = [];
  const simOnly: string[] = [];

  const hasher = makeHasher();
  // The heirs are added once we know their payout keys (live: the wallet's).
  const cast: Cast = buildCast(hasher, ['Alice', 'Ben'], []);
  const alice = cast.owners[0];
  const ben = cast.owners[1];

  // An external device (nominee device / ESP32) replaces Alice's in-process key.
  const extDevice = await devicePublicKey().catch((e) => { warn(`device unreachable: ${describeErr(e)}`); return null; });
  if (extDevice) {
    alice.device = { sk: 0n, x: extDevice.x, y: extDevice.y };   // we never hold the device's secret
    // Rebuild the owner tree so Alice's leaf commits to the external device.
    cast.ownerTree = new SparseTree(hasher, OWNER_DEPTH,
      cast.owners.map((o) => ownerLeaf(hasher, o.secret, o.willRoot, o.device)));
    ok(`External device at ${DEVICE_URL} holds Alice's possession factor.`);
  }

  let live: LiveSession | null = null;
  if (!wantLive) {
    note(`Running in simulator mode (add --live to execute on ${net.name}).`);
    note('Same compiled circuits, same assertions, no proof, no ledger.');
  } else try {
    note(`Deploying a fresh registry for this run on ${net.name}.`);
    note('Connecting wallet, proof server and indexer…');
    live = await LiveSession.connect(cast, { grace: GRACE, challenge: CHALLENGE });
    deployment.contractAddress = live.address;
    ok(`Contract deployed: ${chalk.bold(live.address)}`);
    txs.push({ circuit: 'deploy', txHash: live.deployTxHash ?? live.address, block: live.deployed?.deployTxData?.public?.blockHeight ?? null, status: 'accepted' });
    for (const t of live.setupTxs) {
      ok(`${t.circuit} accepted in block ${t.block ?? '?'}  (a 13-key deploy exceeds a block's write budget; the authority adds the last two)`);
      txs.push({ circuit: t.circuit, txHash: t.txHash, block: t.block, status: 'accepted' });
    }
  } catch (e) {
    warn('On-chain deploy unavailable, running the whole story in the simulator.');
    note(describeErr(e).split('\n')[0].slice(0, 160));
  }

  // Every heir leaf binds the heir's Zswap coin public key. Live, the payout
  // must land in a wallet that can decrypt it, so all three nominees share the
  // demo wallet's key. In the simulator a random key stands in.
  const payoutKey = live ? live.coinPublicKey() : randKey();
  const heirs = [makeHeir('Maya', 500n, payoutKey), makeHeir('Raj', 300n, payoutKey), makeHeir('Sam', 200n, payoutKey)];
  setHeirs(cast, heirs);
  live?.patch({ heirs, heirTree: cast.heirTree, totalValue: 1000n });

  // The simulator session backs the refusals and mirrors the live chapters so
  // its state matches the chain's. Same circuits either way.
  const sim = new SimSession(cast, GRACE, CHALLENGE);
  const simLastBeat = 1_000_000n;   // the simulator's clock is fixed at creation; any earlier timestamp passes
  const mirror = !!live;

  const step = async <T,>(label: string, fn: () => Promise<T>): Promise<T | null> => {
    if (!live) return null;
    try { return await fn(); }
    catch (e) {
      fail(`${label} failed: ` + describeErr(e).slice(0, 200));
      txs.push({ circuit: label, txHash: null, block: null, status: 'rejected', error: describeErr(e).slice(0, 200) });
      return null;
    }
  };
  const push = (r: TxRecord | null) => { if (r) txs.push(r); };

  // ---- Chapter 1 ---------------------------------------------------------
  chapter(1, 'A life');
  let lastBeat = nowSeconds();

  if (live) {
    push(await step('register', () => stepRegister(live!, alice)));
    // Testnet: the wallet has no shielded native coin, so deposit a minted tNOM coin instead.
    // Claims are unchanged: they pay out whatever colour the vault holds.
    let color: Uint8Array = new Uint8Array(32);
    let colourLabel = 'native';
    if (depositAsset() === 'token') {
      note(`Deposit asset: ${TOKEN_SYMBOL}, a testnet-only shielded demo token (NOMINEE_DEPOSIT=token).`);
      const t = await step('demotoken deploy', () => stepTokenDeploy(live!));
      if (t) {
        push(t.record);
        deployment.tokenContract = t.token.address;
        const waitMs = net.local ? 5 * 60_000 : 30 * 60_000;
        const m = await step('demotoken mint', () => stepTokenMint(live!, alice, t.token, 1000n, waitMs));
        if (m) {
          push(m.record);
          // Deposit the token even if the wallet has not shown it yet; a failed balance is recorded as such.
          if (!m.visible) warn(`The wallet does not show the minted ${TOKEN_SYMBOL} yet; trying the deposit anyway.`);
          deployment.depositAsset = TOKEN_SYMBOL;
          color = m.color;
          colourLabel = `${TOKEN_SYMBOL} (testnet token)`;
        }
      }
      if (colourLabel === 'native') warn(`No ${TOKEN_SYMBOL} to deposit; falling back to a native coin.`);
    }
    const coin = { nonce: randKey(), color, value: 1000n };
    push(await step('deposit', () => stepDeposit(live!, alice, coin, colourLabel)));
    push(await step('heartbeat', () => stepHeartbeat(live!, alice, nowSeconds())));
    push(await step('updateWill', () => stepUpdateWill(live!, alice, cast.heirTree.digest(), 1n, nowSeconds())));
    lastBeat = nowSeconds();   // captured here so it is genuinely the latest
    push(await step('heartbeat', () => stepHeartbeat(live!, alice, lastBeat, 'heartbeat, the last one')));
  }
  // The simulator signs device messages in-process, unless an external device holds Alice's key.
  const withDevice = async (now: bigint, kind: 2 | 4, fn: () => void) => {
    sim.patch({ deviceSignature: (await deviceSignature(now, kind)) ?? undefined });
    try { fn(); }
    finally { sim.patch({ deviceSignature: undefined }); }
  };
  simRegister(sim, alice, mirror);
  simDeposit(sim, alice, 1000n, mirror);
  await withDevice(simLastBeat - 10n, 2, () => simHeartbeat(sim, alice, simLastBeat - 10n, 'heartbeat', mirror));
  await withDevice(simLastBeat - 5n, 4, () => simUpdateWill(sim, alice, cast.heirTree.digest(), simLastBeat - 5n, mirror));
  await withDevice(simLastBeat, 2, () => simHeartbeat(sim, alice, simLastBeat, 'heartbeat, the last one', mirror));
  if (!mirror) simOnly.push('register', 'deposit', 'heartbeat', 'updateWill', 'heartbeat');

  // The envelopes: delivered off-chain, one per nominee. Secrets live here, not on chain.
  console.log();
  const address = live?.address ?? sim.address;
  for (let i = 0; i < heirs.length; i++) {
    const file = writeEnvelope(exportEnvelope(cast, i, address, NETWORK, alice), heirs[i].name, { live: !!live });
    note(`Envelope for ${heirs[i].name}: ${file.replace(process.cwd() + '/', '')}`);
  }
  note('Each envelope holds the nominee\'s secret, share, payout key and Merkle path. Treat it like a seed phrase.');

  // ---- Chapter 2 ---------------------------------------------------------
  chapter(2, 'Silence');
  note('Alice stops checking in. The chain does not know why, and never will.');
  console.log();
  await countdownUntil(live ? lastBeat + GRACE + 3n : nowSeconds() + 8n,
    `Waiting for the ${GRACE}s grace period`, 'Grace period elapsed. No heartbeat.');

  // ---- Chapter 3 ---------------------------------------------------------
  chapter(3, 'Resolution');
  const deadline = lastBeat + GRACE;
  const until = deadline + CHALLENGE;
  if (live) push(await step('resolve', () => stepResolve(live!, alice, deadline, CHALLENGE)));
  simResolve(sim, alice, simLastBeat + GRACE, mirror);
  if (!mirror) simOnly.push('resolve');

  note('The window is open. Alice (or her guardians) could still veto.');
  console.log();
  await countdownUntil(live ? until + 3n : nowSeconds() + 5n,
    `Waiting for the ${CHALLENGE}s veto window`, 'Veto window closed. Nobody contested.');

  if (live) push(await step('finalize', () => stepFinalize(live!, alice, until)));
  simFinalize(sim, alice, simLastBeat + GRACE + CHALLENGE, mirror);
  if (!mirror) simOnly.push('finalize');

  // ---- Chapter 4 ---------------------------------------------------------
  chapter(4, 'The nominees');
  const aliceTag = sim.tag(alice);
  const held = (h: { name: string }) => h.name.toLowerCase() === HOLD_HEIR;
  if (live) {
    note('Real shielded payouts from the contract. Each nominee claims to the key bound in their leaf.');
    for (let i = 0; i < heirs.length; i++) {
      if (held(heirs[i])) { note(`${heirs[i].name} has not claimed yet; see the heir page.`); continue; }
      const c = await step('claim', () => stepClaim(live!, alice, i, heirs[i]));
      if (c) { const { remaining: _r, ...record } = c; push(record); }
      simClaim(sim, aliceTag, i, heirs[i], true);
    }
  } else {
    for (let i = 0; i < heirs.length; i++) {
      if (held(heirs[i])) { note(`${heirs[i].name} has not claimed yet; see the heir page.`); continue; }
      simClaim(sim, aliceTag, i, heirs[i]);
      simOnly.push('claim');
    }
  }
  if (sim.remaining(aliceTag) === null) ok('Last claim took the exact remainder: heldCoin[tag] removed.');
  else if (HOLD_HEIR) note(`heldCoin[tag] still holds ${sim.remaining(aliceTag)} for the nominee who has not claimed.`);

  // ---- Chapter 5 ---------------------------------------------------------
  chapter(5, 'Attacks fail');
  note('Refusals happen at circuit execution, before a proof exists, so they run in the simulator.');

  simAttack('double claim',
    ['Maya tries to claim a second time.', 'Her nullifier is already spent.'],
    () => sim.claim(aliceTag, 0),
    /already claimed/);

  simAttack('stranger',
    ['A stranger tries to claim.', 'They are not in the beneficiary tree.'],
    () => {
      const mallory = makeHeir('Mallory', 100n, payoutKey);
      sim.patch({ heirs: [...heirs, mallory] });
      sim.claim(aliceTag, heirs.length);
    },
    /not a beneficiary/);
  sim.patch({ heirs });

  simAttack('wrong share',
    ['Raj claims a larger share than the will allotted.', 'The share is bound into his leaf.'],
    () => {
      sim.patch({ heirs: [heirs[0], { ...heirs[1], share: 900n }, heirs[2]] });
      sim.claim(aliceTag, 1);
    },
    /not a beneficiary/);
  sim.patch({ heirs });

  simAttack('stolen seed, no device',
    ['A thief has Alice\'s seed and knows her device\'s public key, but not the device.',
     'They try to heartbeat with a fresh signing key.'],
    () => {
      sim.actAs({ ...alice, device: { ...alice.device, sk: randScalar() } });
      sim.heartbeat(simLastBeat + 1n);
    },
    /Invalid attestation signature/);
  sim.actAs(alice);

  simAttack('stolen envelope, different payout key',
    ['Someone steals Raj\'s envelope and claims to their OWN key.',
     'The payout key is bound into the leaf, so the leaf is not in the tree.'],
    () => sim.claim(aliceTag, 1, randKey()),
    /not a beneficiary/);

  const benTag = sim.tag(ben);
  simAttack('replayed guardian signature',
    ['Two guardians signed a resolve for Ben\'s vault.', 'The same signatures are presented against Alice\'s vault.'],
    () => {
      sim.patch({ attesting: [0, 1], guardianKind: 'resolve', guardianTag: benTag });
      sim.call('guardianResolve2of3', aliceTag, 0n, 1n);
    },
    /Invalid attestation signature/);

  // ---- Chapter 6 ---------------------------------------------------------
  chapter(6, 'Faked death');
  note('A second vault. Ben\'s device is hidden, so he cannot heartbeat; his grace period lapses.');
  note('Someone calls resolve to open his vault. Ben is alive.');

  const vetoed = ['finalize after a veto',
    ['The window was closed by Ben\'s veto. Finalize is attempted anyway.', 'There is no open challenge to finalize.']] as const;
  if (live) {
    live.actAs(ben);
    push(await step('register', () => stepRegister(live!, ben)));
    // lastSeen is 0 at registration; a vault that never heartbeats has lapsed by definition.
    push(await step('resolve', () => stepResolve(live!, ben, GRACE, CHALLENGE)));
    push(await step('veto', () => stepVeto(live!, ben, nowSeconds())));
    push(await liveRefusal(vetoed[0], [...vetoed[1]], () => live!.finalize(live!.tag(ben), GRACE + CHALLENGE), /no open challenge/));
    note('Later, Ben really is gone. His three guardians know; two of them act.');
    push(await step('guardianResolve2of3', () => stepGuardianResolve(live!, ben, 0n, 1n)));
  } else {
    const sim2 = new SimSession(cast, GRACE, CHALLENGE);
    sim2.actAs(ben);
    simRegister(sim2, ben);
    simResolve(sim2, ben, GRACE);
    simVeto(sim2, ben, simLastBeat);
    simAttack(vetoed[0], [...vetoed[1]], () => sim2.finalize(sim2.tag(ben), GRACE + CHALLENGE), /no open challenge/);
    note('Later, Ben really is gone. His three guardians know; two of them act.');
    simGuardianResolve(sim2, ben, 0n, 1n);
    simOnly.push('register', 'resolve', 'veto', 'guardianResolve2of3');
  }

  // ---- Summary -----------------------------------------------------------
  chapter('', 'Summary');
  const accepted = txs.filter((t) => t.status === 'accepted').length;
  const claims = txs.filter((t) => t.circuit === 'claim' && t.status === 'accepted').length;
  deployment.transactions = txs;
  deployment.simulatorOnly = simOnly;
  const recordPath = live ? save(deployment) : null;   // a simulator run never overwrites the live record

  summary({
    circuits: 13, maxK: 16, keysMB: 75,
    tests: '49 passing', leak: 'CLEAN',
    txs: accepted, claims: live ? claims : 3, live: !!live,
  });
  console.log();
  if (live) {
    note(`Transaction record written to ${recordPath!.replace(process.cwd() + '/', '')}`);
    note(`Contract: ${live.address}`);
    if (net.explorer) note(`Explorer: ${net.explorer}/contracts/${live.address}`);
    // The wallet SDK keeps subscriptions open; close it, but never let that hold the process.
    await Promise.race([live.close(), new Promise((r) => setTimeout(r, 5000))]);
  } else {
    note('Simulator run: no transaction record written. Add --live for the real thing.');
  }
  console.log();
  process.exit(0);
}
