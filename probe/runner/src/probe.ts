// A1 — can a Compact contract custody value on a live Midnight network?
// ONE contract, four circuits: bump (control), depositShielded (subject 1),
// depositUnshielded (subject 2 — reproduces privoice/servicedesk #117),
// releaseShielded (exit path).
import { Buffer } from "buffer";
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import * as Rx from "rxjs";
import { CompiledContract } from "@midnight-ntwrk/compact-js";
import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
import { initializeNetwork } from "./netid.js";
import { buildWallet, startAndSync } from "./wallet.js";
import { createProviders, ZK_CONFIG_PATH } from "./providers.js";
import { Contract, ledger as readLedger } from "../managed/contract/index.js";

const NATIVE = Buffer.alloc(32); // native token colour = 32 zero bytes
const AMOUNT = BigInt(process.env.PROBE_AMOUNT ?? "1");
const results: any[] = [];
let lastRpcCode: string | null = null;
for (const stream of ["log","error","warn"] as const) {
  const orig = (console as any)[stream].bind(console);
  (console as any)[stream] = (...a: any[]) => {
    const m = a.map(String).join(" ").match(/Custom error:\s*(\d+)/i);
    if (m) lastRpcCode = m[1];
    orig(...a);
  };
}
const NAMED: Record<string, string> = {
  "117":"Malformed(NotNormalized)", "126":"Malformed(Unbalanced)",
  "138":"Malformed(BalanceCheckOverspend)", "170":"Malformed(InvalidDustSpendProof)",
  "189":"Malformed(InputsNotSorted)", "190":"Malformed(OutputsNotSorted)",
  "191":"Malformed(DuplicateInputs)", "192":"Malformed(InputsSignaturesLengthMismatch)",
  "214":"Malformed(EffectsCheck.RealUnshieldedSpendsSubsetCheckFailure)",
  "227":"Malformed(DisjointCheck.UnshieldedInputsDisjointFailure)",
  "231":"Malformed(FeeCalculation.OutsideTimeToDismiss)",
};

function describe(e: any): string {
  const parts: string[] = []; let cur = e;
  for (let i = 0; i < 8 && cur; i++) { if (cur.message) parts.push(String(cur.message)); cur = cur.cause; }
  return parts.join("  <-  ") || String(e);
}
function errCode(msg: string): string | null {
  const m = msg.match(/Custom error:\s*(\d+)|Custom\((\d+)\)/i);
  return m ? (m[1] ?? m[2]) : null;
}

async function withRetries<T>(label: string, build: () => Promise<T>, attempts = 8): Promise<T> {
  let last: any;
  for (let i = 1; i <= attempts; i++) {
    lastRpcCode = null;
    try { return await build(); }
    catch (e: any) {
      last = e;
      const code = errCode(describe(e)) ?? lastRpcCode;
      // 170 = InvalidDustSpendProof: dust state moved while proving.
      // Rebuild and re-prove from scratch; never resubmit the same tx.
      if (code !== "170") throw e;
      console.log(`    ${label}: attempt ${i}/${attempts} hit 170 (stale dust), rebuilding…`);
      if (i === attempts) break;
      await new Promise((r) => setTimeout(r, 1500 + i * 800));
    }
  }
  throw last;
}

async function step(label: string, fn: () => Promise<any>) {
  process.stdout.write(`\n=== ${label} ===\n`);
  const t0 = Date.now();
  try {
    const r = await withRetries(label, fn);
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    const txId = r?.public?.txId ?? r?.txId ?? r?.public?.txHash ?? null;
    const blk  = r?.public?.blockHeight ?? r?.blockHeight ?? null;
    console.log(`ACCEPTED  (${secs}s)  tx=${txId}  block=${blk}`);
    results.push({ label, status: "ACCEPTED", seconds: secs, txId, block: blk });
    return r;
  } catch (e: any) {
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    const msg = describe(e);
    const code = errCode(msg) ?? lastRpcCode;
    console.log(`REJECTED  (${secs}s)  code=${code ?? "n/a"}  ${code ? (NAMED[code] ?? "UNMAPPED") : ""}`);
    console.log(`  ${msg.slice(0, 600)}`);
    results.push({ label, status: "REJECTED", seconds: secs, code, error: msg.slice(0, 900) });
    return null;
  }
}

async function main() {
  const proofUrl = process.env.PROOF_SERVER ?? "http://localhost:6300";
  const pr = await fetch(proofUrl).catch(() => null);
  if (!pr) { console.error(`No proof server at ${proofUrl}`); process.exit(4); }
  console.log(`Proof server ${proofUrl} -> ${pr.status}`);

  const seedHex = process.env.PROBE_SEED_HEX ?? "00".repeat(31) + "01"; // local genesis
  const seed = Buffer.from(seedHex, "hex");
  initializeNetwork();

  const bundle = await buildWallet(seed, { useCheckpoint: false });
  console.log("Syncing wallet…");
  await startAndSync(bundle);
  const st: any = await Rx.firstValueFrom(bundle.facade.state());
  console.log("shielded coinPublicKey:", st.shielded?.coinPublicKey?.toHexString?.());

  const providers = await createProviders(
    bundle.facade, bundle.zswapSecretKeys, bundle.dustSecretKey, bundle.keystore,
  );

  const compiledContract = (CompiledContract.make("CustodyProbe", Contract) as any).pipe(
    (CompiledContract as any).withVacantWitnesses,
    (CompiledContract as any).withCompiledFileAssets(ZK_CONFIG_PATH),
  );
  let deployed: any = null;

  await step("DEPLOY", async () => {
    deployed = await deployContract(providers, { compiledContract, privateStateId: "CustodyProbePrivateState", initialPrivateState: {} } as any);
    console.log("  contract address:", deployed.deployTxData.public.contractAddress);
    return deployed.deployTxData;
  });
  if (!deployed) { console.log("\nDeploy failed — nothing else is meaningful."); dump(); return; }

  const addr = deployed.deployTxData.public.contractAddress;

  // CONTROL
  await step("CONTROL  bump()", () => deployed.callTx.bump());

  // SUBJECT 1 — shielded custody
  await step("SUBJECT1 depositShielded(nativeCoin)", () =>
    deployed.callTx.depositShielded({
      nonce: randomBytes(32), color: NATIVE, value: AMOUNT,
    }));

  // SUBJECT 2 — unshielded custody (privoice / #117)
  await step("SUBJECT2 depositUnshielded(native, amount)", () =>
    deployed.callTx.depositUnshielded(NATIVE, AMOUNT));

  // Final ledger read
  try {
    const s = await providers.publicDataProvider.queryContractState(addr);
    const L: any = readLedger(s.data);
    console.log("\n=== final ledger state ===");
    console.log("  bumps              :", L.bumps);
    console.log("  shieldedDeposits   :", L.shieldedDeposits);
    console.log("  unshieldedDeposits :", L.unshieldedDeposits);
    console.log("  heldShielded.value :", L.heldShielded?.value);
  } catch (e: any) { console.log("ledger read failed:", describe(e).slice(0, 200)); }

  dump(addr);
}

function dump(addr?: string) {
  console.log("\n================ A1 RESULT ================");
  if (addr) console.log("contract:", addr);
  for (const r of results) console.log(`  ${r.status.padEnd(8)} ${r.label}  ${r.code ? "code=" + r.code : ""} ${r.seconds}s`);
  console.log("===========================================");
  writeFileSync("a1-results.json", JSON.stringify({ addr, results }, null, 2));
}

main().catch((e) => { console.error("FATAL:", describe(e)); dump(); process.exit(1); });
