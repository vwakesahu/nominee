// A1 exit path: can the contract RELEASE the shielded coin it holds?
import { Buffer } from "buffer";
import { randomBytes } from "node:crypto";
import * as Rx from "rxjs";
import * as ledgerApi from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { CompiledContract } from "@midnight-ntwrk/compact-js";
import { findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { initializeNetwork } from "./netid.js";
import { buildWallet, startAndSync } from "./wallet.js";
import { createProviders, ZK_CONFIG_PATH } from "./providers.js";
import { Contract, ledger as readLedger } from "../managed/contract/index.js";

const ADDR = process.env.CONTRACT_ADDR!;
function describe(e: any){const p=[];let c=e;for(let i=0;i<8&&c;i++){if(c.message)p.push(String(c.message));c=c.cause;}return p.join("  <-  ")||String(e);}

async function main() {
  initializeNetwork();
  const seed = Buffer.from("00".repeat(31) + "01", "hex");
  const bundle = await buildWallet(seed, { useCheckpoint: false });
  await startAndSync(bundle);
  const providers = await createProviders(bundle.facade, bundle.zswapSecretKeys, bundle.dustSecretKey, bundle.keystore);

  // 1. What does the contract hold, per its public ledger?
  const cs = await providers.publicDataProvider.queryContractState(ADDR);
  const L: any = readLedger(cs.data);
  console.log("ledger heldShielded:", {
    nonce: Buffer.from(L.heldShielded.nonce).toString("hex").slice(0,16)+"…",
    color: Buffer.from(L.heldShielded.color).toString("hex").slice(0,16)+"…",
    value: L.heldShielded.value,
  });

  // 2. The contract's own Zswap chain state -> where is that coin in the tree?
  const q = `{ contractAction(address:"${ADDR}"){ __typename address zswapState } }`;
  const r = await fetch("http://127.0.0.1:8088/api/v4/graphql", {
    method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({query:q}),
  }).then(r=>r.json());
  const zsHex = r?.data?.contractAction?.zswapState;
  console.log("zswapState hex length:", zsHex?.length, "bytes:", zsHex ? zsHex.length/2 : 0);
  if (!zsHex) { console.log("no zswapState — cannot qualify the coin"); return; }

  let chain: any = null;
  try {
    chain = (ledgerApi as any).ZswapChainState.deserialize(Uint8Array.from(Buffer.from(zsHex,"hex")));
    console.log("ZswapChainState deserialized. keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(chain)).join(", "));
    if (typeof chain.firstFree !== "undefined") console.log("firstFree:", chain.firstFree);
  } catch (e:any) { console.log("deserialize failed:", describe(e).slice(0,200)); }

  // 3. Try the release across candidate indices.
  const compiled = (CompiledContract.make("CustodyProbe", Contract) as any).pipe(
    (CompiledContract as any).withVacantWitnesses,
    (CompiledContract as any).withCompiledFileAssets(ZK_CONFIG_PATH));
  const deployed: any = await findDeployedContract(providers, {
    compiledContract: compiled, contractAddress: ADDR,
    privateStateId: "CustodyProbePrivateState", initialPrivateState: {},
  } as any);

  // The recipient must be a key the SDK can resolve an ENCRYPTION public key for,
  // because sendShielded encrypts the coin ciphertext to the recipient.
  // A bare random ZswapCoinPublicKey is not enough.
  const st: any = await Rx.firstValueFrom(bundle.facade.state());
  const ownCpk: string = st.shielded.coinPublicKey.toHexString();
  console.log("recipient = own shielded coinPublicKey:", ownCpk.slice(0,16)+"…");
  const to = { bytes: Uint8Array.from(Buffer.from(ownCpk.replace(/^0x/,""), "hex")) };
  const cands = (process.env.MT_INDICES ?? "0,1,2,3").split(",").map(s=>BigInt(s.trim()));
  for (const mt of cands) {
    const qual = { nonce: L.heldShielded.nonce, color: L.heldShielded.color, value: L.heldShielded.value, mt_index: mt };
    process.stdout.write(`\n--- releaseShielded with mt_index=${mt} ---\n`);
    try {
      const res = await deployed.callTx.releaseShielded(qual, to, 1n);
      console.log(`ACCEPTED  tx=${res?.public?.txId}  block=${res?.public?.blockHeight}`);
      return;
    } catch (e:any) {
      const msg = describe(e);
      const code = msg.match(/Custom error:\s*(\d+)|Custom\((\d+)\)/i);
      console.log(`REJECTED  code=${code? (code[1]??code[2]) : "n/a"}  ${msg.slice(0,220)}`);
    }
  }
}
main().catch(e=>{console.error("FATAL:",describe(e));process.exit(1);});
