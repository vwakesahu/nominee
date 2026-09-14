// A2: blockTime units, granularity, inclusivity, future tolerance.
import { Buffer } from "buffer";
import { CompiledContract } from "@midnight-ntwrk/compact-js";
import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
import { initializeNetwork } from "./netid.js";
import { buildWallet, startAndSync } from "./wallet.js";
import { createProviders } from "./providers.js";
import { fileURLToPath } from "node:url";
import { Contract } from "../managed-a2/contract/index.js";

const ZK = fileURLToPath(new URL("../managed-a2", import.meta.url));
function describe(e:any){const p=[];let c=e;for(let i=0;i<8&&c;i++){if(c.message)p.push(String(c.message));c=c.cause;}return p.join(" <- ")||String(e);}
let lastRpc: string|null = null;
for (const s of ["log","error","warn"] as const) { const o=(console as any)[s].bind(console);
  (console as any)[s]=(...a:any[])=>{const m=a.map(String).join(" ").match(/Custom error:\s*(\d+)/i); if(m) lastRpc=m[1]; o(...a);}; }

async function retry<T>(f:()=>Promise<T>,n=8):Promise<T>{let last:any;for(let i=1;i<=n;i++){lastRpc=null;
  try{return await f();}catch(e:any){last=e;const c=(describe(e).match(/Custom error:\s*(\d+)/i)?.[1])??lastRpc;
  if(c!=="170")throw e;await new Promise(r=>setTimeout(r,1500+i*800));}}throw last;}

async function main(){
  initializeNetwork();
  const bundle = await buildWallet(Buffer.from("00".repeat(31)+"01","hex"), { useCheckpoint:false });
  await startAndSync(bundle);
  const providers = await createProviders(bundle.facade,bundle.zswapSecretKeys,bundle.dustSecretKey,bundle.keystore);
  const compiled = (CompiledContract.make("Clock", Contract) as any).pipe(
    (CompiledContract as any).withVacantWitnesses,(CompiledContract as any).withCompiledFileAssets(ZK));
  const dep:any = await retry(()=>deployContract(providers,{compiledContract:compiled,privateStateId:"ClockPS",initialPrivateState:{}} as any));
  console.log("clock contract:", dep.deployTxData.public.contractAddress);

  // reference clock from the indexer's own block timestamp
  const q = await fetch("http://127.0.0.1:8088/api/v4/graphql",{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({query:"{ block { height timestamp } }"})}).then(r=>r.json());
  const blk = q.data.block;
  console.log("indexer block:", blk.height, "timestamp:", blk.timestamp, `(${String(blk.timestamp).length} digits)`);
  const nowMs = Date.now(), nowS = Math.floor(nowMs/1000);
  console.log("wallet clock  ms:", nowMs, " s:", nowS);

  const cases: [string,bigint,"After"|"Before"][] = [
    ["After t=0 (always true)",                    0n,                       "After"],
    ["After t=now_SECONDS",                        BigInt(nowS),             "After"],
    ["After t=now_MILLISECONDS",                   BigInt(nowMs),            "After"],
    ["After t=now_SECONDS + 86400 (1d ahead, s)",  BigInt(nowS+86400),       "After"],
    ["After t=now_MS + 86400000 (1d ahead, ms)",   BigInt(nowMs+86400000),   "After"],
    ["Before t=now_MILLISECONDS",                  BigInt(nowMs),            "Before"],
    ["Before t=now_SECONDS",                       BigInt(nowS),             "Before"],
  ];
  for (const [label,t,kind] of cases){
    process.stdout.write(`\n--- ${label}  t=${t} ---\n`);
    try{
      const r:any = await retry(()=> kind==="After" ? dep.callTx.assertAfter(t) : dep.callTx.assertBefore(t));
      console.log(`  ACCEPTED  block=${r?.public?.blockHeight}`);
    }catch(e:any){
      const m=describe(e); const c=(m.match(/Custom error:\s*(\d+)/i)?.[1])??lastRpc;
      console.log(`  REJECTED  code=${c??"n/a"}  ${m.slice(0,150)}`);
    }
  }
}
main().catch(e=>{console.error("FATAL:",describe(e));process.exit(1);});
