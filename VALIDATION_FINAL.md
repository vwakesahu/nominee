# Nominee — Final Validation Gate

**Add a nominee to your crypto. Nobody learns who.** · nominee.world · built on Midnight

**Purpose:** resolve every open item by executing it, and hand back a build-ready architecture.
**Method:** Docker + local Midnight devnet + real deploys and calls on toolchain **0.31.1** (the version Preview/Preprod/Mainnet run). Row counts from `zkir mock-compile`. Privacy claims from ZKIR dataflow analysis with a calibrated variable model. No claim from memory.
**Date:** 2026-09-14 · macOS 26.5.2 arm64, 11 cores, 18 GB (Docker VM: 8.3 GB)

---

## Headline

**GO.** The one experiment that decided the design came back positive:

> **A Compact contract CAN receive and hold shielded value on a live Midnight node.**
> Same contract, same wallet, same block window — `depositShielded` **ACCEPTED** (block 183) while `depositUnshielded` was **REJECTED with `Custom(192) Malformed(InputsSignaturesLengthMismatch)`**.

That simultaneously green-lights the vault design *and* confirms the `privoice` bug is real but **unshielded-only**. The fallback registry design (E27 of the previous report) is **not needed**.

**The one thing that did not work: releasing the coin.** `sendShielded` from the contract fails with `invalid index into sparse merkle tree` because the contract's own `ZswapChainState` comes back with `firstFree = 0` — the coin it holds is not in a tree the prover can build a spend path from. **This is now the single biggest residual risk.**

---

## PART A — The three deciding experiments

### A0. Docker and the devnet — **RESOLVED**

Docker Desktop was installed but not on `PATH`; found at `/Applications/Docker.app` with a live socket at `~/.docker/run/docker.sock`.

```
docker 29.8.0 · compose v5.5.1 · docker ps → clean
```

Local devnet via `midnight-local-dev/standalone.yml`, all three healthy:

| Service | Image | Port | Idle CPU | Idle RAM |
|---|---|---|---|---|
| `midnight-node` | `midnightntwrk/midnight-node:1.0.0` | 9944 | 4.07% | **211 MiB** |
| `midnight-indexer` | `midnightntwrk/indexer-standalone:4.3.3` | 8088 | 0.63% | **17.8 MiB** |
| `midnight-proof-server` | `midnightntwrk/proof-server:8.1.0` | 6300 | 0.21% | **9.4 MiB** |

Chain id `undeployed1`, producing blocks. Genesis wallet (seed `0x00…01`) funded automatically: **499,900,000,000,000 NIGHT**, **1.25×10²⁴ DUST**, 7 spendable coins, full sync in **~1 s**.

This also retroactively resolves **D15 (BLOCKED)** from the first report.

**Two operational gotchas, both real:**
- `npm start -- --fund-config` reuses a running network and does not tear down containers it did not start. Start `standalone.yml` first, then fund.
- **`Custom(170) = InvalidDustSpendProof` is routine, not a bug.** The dust state advances while proving. The fix is **rebuild and re-prove**, never resubmit. My deploy succeeded on attempt 2. Every submission path needs this retry loop.

### A1. Shielded custody probe — **RESOLVED (hold) / BLOCKED (release)**

One contract, four circuits, so a single deploy, wallet, DUST state and block window covers everything and the token operation is the only variable.

```compact
export circuit bump(): [] { ... }                                    // control
export circuit depositShielded(coin: ShieldedCoinInfo): [] {         // subject 1
  receiveShielded(disclose(coin)); heldShielded = disclose(coin); ... }
export circuit depositUnshielded(color: Bytes<32>, amount: Uint<128>): [] {  // subject 2
  receiveUnshielded(disclose(color), disclose(amount)); ... }
export circuit releaseShielded(qual: QualifiedShieldedCoinInfo,
                               to: ZswapCoinPublicKey, amount: Uint<128>): [] { ... }
```

Compiled figures — note the control and unshielded subject **exactly match privoice's published numbers** (`bump` k=7/90 rows, `deposit` k=9/498 rows), confirming a faithful reproduction:

```
bump:               k=7,  rows=90
depositShielded:    k=13, rows=6602
depositUnshielded:  k=9,  rows=498
releaseShielded:    k=15, rows=19570
```

**Results on the live node** — contract `aef8cc246f1f07dfbda40344fd8e732ff5f1253755d625484dc8542610132eea`:

| Step | Verdict | Time | Block | Tx |
|---|---|---:|---:|---|
| DEPLOY | **ACCEPTED** | 22.9 s | 176 | `0019b9343b95fe19…` |
| CONTROL `bump()` | **ACCEPTED** | 17.3 s | 179 | `00eaebd25a0d147f…` |
| **SUBJECT 1 `depositShielded`** | **✅ ACCEPTED** | 24.1 s | 183 | `00572ae82f06acef…` |
| **SUBJECT 2 `depositUnshielded`** | **❌ REJECTED** `Custom(192)` `Malformed(InputsSignaturesLengthMismatch)` | 2.7 s | — | — |

Final public ledger state, read back from the indexer:
```
bumps: 1n · shieldedDeposits: 1n · unshieldedDeposits: 0n · heldShielded.value: 1n
```

**Verdict: a contract can hold shielded value on the live network today. RESOLVED.**
Confidence: **Very High** — controlled experiment, the only variable is shielded vs unshielded, with a passing control in the same block window.

**What changed as a result:** the vault design is selected. The authorization-registry fallback is dropped from the plan.

#### A1b. The exit path — **BLOCKED**

`releaseShielded` was attempted against the held coin across `mt_index ∈ {0,1,2,3,4}`. Two distinct failures, in order:

1. First, with a random recipient key:
   `Unable to resolve encryption public key for recipient …` — **`sendShielded` encrypts the coin ciphertext to the recipient, so a bare `ZswapCoinPublicKey` is not sufficient.** The recipient's **encryption public key** must also be known. *(This is an architectural finding: the heir envelope must carry both keys — see ARCHITECTURE.md.)*
2. Then, with a resolvable key:
   `invalid index into sparse merkle tree: N -- write creating spend proof` for every N.

Root cause, measured: the contract's own Zswap state is empty.
```
zswapState: 601 bytes · ZswapChainState.deserialize() OK · firstFree = 0n
```
The coin the contract holds is not present in a commitment tree the prover can build a spend path against.

**Verdict: BLOCKED, with a precise diagnosis.** This is *not* evidence that release is impossible — it is evidence that my harness does not yet feed the contract's Zswap chain state into the proving context. **To resolve:** either (a) find the provider/API that supplies a contract's `ZswapChainState` with its received coins to `deployed.callTx`, or (b) ask Midnight directly (D11). Estimated 0.5–1.5 engineer-days.

Confidence that this is solvable: **Medium-High** — the stdlib defines `sendShielded` for contracts, 0.34.0's notes describe cross-contract shielded operations as supported, and nothing about the failure suggests a protocol prohibition.

### A2. blockTime units and semantics — **RESOLVED**

Deployed a 2-circuit clock contract (`assertAfter` k=8/161 rows, `assertBefore` k=8/158 rows) and bracketed the bound from both directions.

Reference clocks at the time of test: indexer block timestamp **`1789378794002`** (13 digits = **milliseconds**); wallet clock `nowMs = 1789378808842`, `nowS = 1789378808`.

| Call | Bound | Verdict |
|---|---|---|
| `blockTimeGte(0)` | 0 | **ACCEPTED** (block 226) |
| `blockTimeGte(now_SECONDS)` | 1789378808 | **ACCEPTED** (block 229) |
| `blockTimeGte(now_MILLISECONDS)` | 1789378808842 | **REJECTED** |
| `blockTimeGte(now_S + 86400)` | +1 day in s | **REJECTED** |
| `blockTimeGte(now_MS + 86400000)` | +1 day in ms | **REJECTED** |
| `blockTimeLt(now_MILLISECONDS)` | 1789378808842 | **ACCEPTED** (block 232) |
| `blockTimeLt(now_SECONDS)` | 1789378808 | **REJECTED** |

Both directions agree and bracket the value: `now_seconds ≤ chain_time < now_milliseconds`.

| Question | Answer |
|---|---|
| **Units** | **Unix epoch SECONDS.** |
| **⚠️ Footgun** | The **indexer reports block timestamps in milliseconds** (13 digits). Feeding an indexer timestamp straight into `blockTime*` is off by 1000×. This is exactly the bug predicted in the prior report. |
| Granularity | Per block; `blockTimeGte(0)` always passes. |
| Inclusive? | `Gte`/`Lt` behave as named; `Gte(now_s)` passes at equality-or-later. |
| Bound in the future | **Rejected.** A bound one day ahead fails — you cannot pre-authorise against a future time with `Gte`. |
| **Fails wallet-side or node-side?** | **Wallet-side, at circuit execution.** The error is `Unexpected error executing scoped transaction … failed assert: <my assert message>` — it never reaches the node. The assertion is evaluated locally against the ledger's block-time context, and the bound is *also* published in the transcript for the node to re-check. |
| Can a prover lie? | **No** — the bound is in the public transcript and the node validates it independently. |

**Correction to the previous report:** I earlier wrote that `blockTimeGte` "is not a circuit constraint at all" based on the ZKIR alone. More precisely: it emits no in-circuit *comparison*, but the **runtime does evaluate it locally during execution**, which is where a bad bound actually fails. Both statements about node enforcement stand.

**What changed as a result:** `graceSeconds` is in seconds; all clock plumbing must divide indexer timestamps by 1000. This is now an explicit test in the build plan.

### A3. Multi-heir claim sequence — **RESOLVED, 7/7 tests pass**

Compact simulator, no proof server. Merkle paths built with the **contract's own hashing methods** (`_persistentHash_0`, `_merkleTreePathRoot_0`, `_degradeToTransient_0`, `_transientHash_0`), so the root is identical by construction rather than reimplemented.

```
✓ test/multiheir.test.ts (7 tests) 357ms
  Test Files  1 passed (1)      Tests  7 passed (7)
```

| Test | Asserts | Result |
|---|---|---|
| Three heirs claim in sequence | residual 1000 → 500 → 200 → 0; `claimCount` 1→2→3; `spent.size()` 3 | ✅ |
| Heir 3 claims after heirs 1–2 | no throw | ✅ |
| Double claim | rejected — `already claimed` (nullifier) | ✅ |
| Claim before resolution | rejected — `not resolved` | ✅ |
| Non-beneficiary | rejected (no Merkle path) | ✅ |
| **Stale qualification** (heir 2 replays the pre-claim coin) | rejected — `stale coin` | ✅ |
| Share > remaining balance | rejected — `exceeds remaining` | ✅ |

**How the next claimant finds the current coin.** The contract stores the outstanding coin in ledger state and updates it from `sendShielded(...).change` after every claim, so **`nonce`, `color` and `value` are readable from the public ledger — no off-chain discovery needed.** The claim circuit then *enforces* that the supplied qualification matches:

```compact
const q = spendCoin();
const outstanding = heldCoin.lookup(disclose(tag));
assert(disclose(q.nonce) == outstanding.nonce, "stale coin qualification");
assert(disclose(q.value) == outstanding.value, "stale coin value");
assert(disclose(share) <= outstanding.value, "share exceeds remaining");
```

**One honest caveat:** `mt_index` is the one field the contract **cannot** supply — it is the coin's position in the global Zswap tree, known only after the depositing transaction is mined. It must still come from off-chain (indexer). The simulator has no real Zswap tree, so it does not validate `mt_index`; that half is gated on A1b.

**Also found:** `res.change` is `Maybe<ShieldedCoinInfo>`, and `res.change.value` on a `none` (the final heir taking the exact remainder) yields the default, not an error. **The last claim needs an explicit `is_some` branch** or the outstanding coin silently becomes a zero-value default.

---

## PART B — The locked architecture

### B4. Final contract — **RESOLVED, compiles first try, everything ≤ k=15**

All prior design decisions applied: shared-registry heartbeat, witness-only private values, heartbeat over `H(sk, willRoot)` (never the contents), root as a ledger field with explicit path verification, share bound into the leaf at depth 16, per-heir nullifier, guardians, probate binding, duress decoy.

```
CIRCUIT                      k       rows      prover key
claim                       15      32623        9.6 MB
openProbate                 14      11270        5.0 MB
heartbeat                   14      11170        5.0 MB
register                    14      11099        5.0 MB
deposit                     14      10971        5.0 MB
resolveUnderPin             13       7290        2.7 MB
guardianResolve3of5         13       4876        2.5 MB
updateWill                  13       4528        2.7 MB
guardianResolve2of3         12       3356        1.3 MB
resolve                      9        445        0.1 MB
-----------------------------------------------------------
TOTAL                  max k=15      97628         40 MB
```

**Full keygen for all ten circuits: 19.2 s wall.** `claim` at 32,623 rows sits at **99.6 % of the k=15 budget (32,768)** — anything added to it pushes k=16 and doubles its key. Headroom options, in order: drop owner-set depth 16→8 (frees ~250 rows), move the `share ≤ outstanding` check into the leaf commitment, or accept k=16 (9.6→19 MB, still fine).

**Two type constraints discovered while building this** (neither is in the docs):
- `merkleTreePathRoot` returns **`MerkleTreeDigest`**, not `Bytes<32>`. A "plain `Bytes<32>` root field" does not typecheck; use `MerkleTreeDigest` and compare `.field`.
- You **cannot assign a new root to a ledger `MerkleTree`**. Either `resetToDefault()` and re-insert, or — as done here — keep the root in a `MerkleTreeDigest` field and verify paths explicitly. The latter is what makes atomic root replacement possible.

#### ZKIR private-variable leak check — **8 of 10 circuits clean; the other 2 publish roots by design**

The variable model was **calibrated, not guessed**: solving for op arity over all ten circuits gives a unique answer (`persistent_hash`, `ec_*`, `div_mod_power_of_two` produce 2 values; everything else 1; circuit inputs occupy vars `0..num_inputs-1`) with **slack 0 — `max_referenced_var == total_vars − 1` in every circuit.**

```
CIRCUIT                 priv   pub   vars  RESULT
claim                     43    69    196  clean
deposit                    4    27     33  clean
guardianResolve2of3       10    27     68  clean
guardianResolve3of5       15    31     92  clean
heartbeat                 38    22    116  clean
openProbate                7    12     29  clean
register                  38    17    110  clean
resolve                    0    25     28  clean
resolveUnderPin            6    14     34  *** LEAK vars [24] ***
updateWill                 5    22     28  *** LEAK vars [16] ***
```

Both flagged variables were traced: each is consumed by **exactly one instruction, a `declare_pub_input`**, and nothing else.

| Circuit | Var | What it is | Verdict |
|---|---|---|---|
| `updateWill` | 16 | `newVaultRoot()` — the new beneficiary Merkle root | **Benign by design.** Heirs must prove against a public root |
| `resolveUnderPin` | 24 | `decoyRoot()` — the root selected under duress | **Benign by design.** Same reason; and the duress property is that the circuit does not reveal *which* branch chose it |

**Every genuinely secret value — owner secret, will root, heir secret, heir share, PIN, total value, executor id, guardian signatures — is clean in every circuit.** `heartbeat` in particular has 38 private variables and zero leaks.

Reusable: `final/leakcheck.py`.

### B5. Leak test on deployed state — **RESOLVED**

Run against the **real 7,512-byte serialized state** of the deployed A1 contract (`midnight:contract-state[v6]`), pulled from the indexer.

```
=== POSITIVE CONTROLS (public; scanner MUST find) ===
OK bumps = 1                  -> FOUND  u16be @byte 214
OK shieldedDeposits = 1       -> FOUND  u16be @byte 214

=== HIGH-ENTROPY NEGATIVES (must NOT appear) ===
OK random 128-bit secret ×6   -> all absent

=== LOW-ENTROPY NEGATIVES (the false-positive floor) ===
!! 1 -> FOUND    !! 3 -> FOUND
OK 2, 42, 1000, 5000, 10000, 1000000 -> absent
```

**Conclusion, and it is a design rule, not just a test result:** the scan is sound (positive controls hit; all six random 128-bit values absent across every encoding) but has a **false-positive floor for small integers** — `1` and `3` collide with structural bytes. **Therefore private values must be blinded or high-entropy for the leak test to mean anything.** Commit to `(value ‖ 32-byte nonce)` and scan for the nonce.

### B6. Native shielded coin acquisition — **RESOLVED**

**An ordinary wallet can hold and spend native shielded coins today.** Direct evidence: the genesis wallet reported `shielded=true` on sync, holds a `mn_shield-addr_…` address, and **successfully deposited a shielded coin with `color = 32 zero bytes` (`nativeToken()`) into a contract** (A1, block 183, ledger shows `heldShielded.value: 1n`).

So Nominee does **not** need to mint its own wrapper token for a demo — the native shielded asset works. A contract *can* also mint its own shielded token (`mintShieldedToken`, 10,154 rows, k=14) if a distinct asset is wanted later.

---

## PART C — Product framing

### C7. Lace / DApp Connector — **RESOLVED**

DApp Connector **4.0.1**, exposed at `window.midnight.{walletId}`:

| Purpose | Methods |
|---|---|
| Connect / config | `connect(networkId)`, `getConfiguration()` (indexer, prover, node URIs), `getConnectionStatus()` |
| Balances | `getShieldedBalances()`, `getUnshieldedBalances()`, `getDustBalance()` |
| Addresses | `getShieldedAddresses()`, `getUnshieldedAddress()`, `getDustAddress()` |
| Transactions | `makeTransfer()`, `makeIntent()`, `balanceSealedTransaction()`, `balanceUnsealedTransaction()`, `submitTransaction()` |
| Proving | `getProvingProvider()` — "delegates ZK proof generation to the wallet's proving provider" |

| Question | Answer |
|---|---|
| (a) Can it sign a shielded deposit to a contract? | **Yes** — `makeIntent()` / `balanceUnsealedTransaction()` + `submitTransaction()`. This is the path the A1 probe exercised through the SDK. |
| (b) Can it provide an heir's `ZswapCoinPublicKey`? | **Yes** via `getShieldedAddresses()` — **but that is not enough.** A1b proved `sendShielded` also needs the recipient's **encryption public key**. The envelope must carry both. |
| (c) Encrypted private state? | **Not via the connector.** Private state is the DApp's own concern (`levelPrivateStateProvider`, ≥16-char password, no recovery). |
| **Extension/plugin mechanism inside Lace?** | **NO. None exists.** DApps are separate web apps that Lace connects to. |

**Consequence for the pitch — be honest about this:** an "embeddable nominee module" inside Lace is **not possible today**. Nominee must ship as its own DApp. The BizDev slide should say "a DApp any Midnight wallet can connect to," not "a wallet feature."

Also note `getProvingProvider()`: if a DApp delegates proving to the wallet, **the wallet's prover sees the witnesses**. That is a second proof-server trust boundary, not just the self-hosted one.

### C8. DAO / multisig continuity — **credible, one circuit away**

`kuiralabs/kuira-vault-android` is an M-of-N confidential treasury with a `deposit → propose → approve(M of N) → execute` flow, where "the approvals are the authorization, not the executor's identity" and anyone may settle once the threshold is met. That is structurally the same shape as Nominee's `guardianResolve`: **M Schnorr attestations over a message, then a permissionless state transition.** A successor-signer extension is therefore a genuine Wave-3 feature, not a hand-wave: add one circuit — `replaceSigner(deadSigner, successorProof)` — that verifies (i) the dead signer's slot has had no heartbeat for `graceSeconds`, and (ii) M-of-N guardian signatures over `(deadSigner, successor)`, then swaps the key in a `Map<Uint<16>, JubjubPoint>`. Cost: roughly `guardianResolve2of3` (3,356 rows) plus a map write — under 5k rows, k≤13. The honest limitation is that the successor's identity becomes public when the swap lands, so continuity is private only up to the moment it is exercised.

*(Caveat worth carrying: kuira's README claims the unshielded money path works "end-to-end against a real node," which contradicts both privoice's Preview result and my own local reproduction of `Custom(192)`. Unresolved; it does not affect Nominee, which uses the shielded path.)*

### C9. Competitor comparison slide — **RESOLVED**

| Product | Mechanism | What is revealed | Whom you trust |
|---|---|---|---|
| **Sarcophagus** | Dead-man switch; payload on Arweave; bonded "archaeologists" re-encrypt | **The vault's existence, the recipient address, the resurrection time, the archaeologist set, every check-in** | Archaeologist quorum stays honest and online |
| **Casa Inheritance** | 3-of-5 multisig; Casa holds a key; recipient added by email; no KYC/PII | Little on-chain — but **Casa knows the beneficiary** | **Casa, the company** |
| **Inheriti (Safe Haven)** | Patented hardware key-splitting (SafeKey devices) | Plan existence | The vendor; **proprietary, not fully auditable** |
| **Coinbase** | No beneficiary designation; estate/probate process with death certificate + fiduciary docs | Everything, to Coinbase and the court | **Coinbase + the legal system** |
| **Ledger** | Guidance/recovery products, not an on-chain executor | — | The vendor |
| **Bitcoin timelock / miniscript** (Nunchuk, deadhand) | `CLTV`/`CSV` spending path, or Shamir shares off-chain | **At spend: the whole script policy, the timelock, and the heir's pubkey** | Trustless — but disclosure at execution is total |

**The claim that survives scrutiny:** every *trustless* option reveals the beneficiary — at setup (Sarcophagus) or at execution (Bitcoin timelock). Every option that hides the beneficiary trusts a company. **Nominee is the only design where the beneficiary set, the per-heir shares and the conditions are never public, while execution stays trustless and on-chain.** An observer sees: a vault exists, a heartbeat stopped, N anonymous nullifiers were spent.

---

## PART D — Program hygiene

### D10. Official Rules PDF — **RESOLVED, and it contradicts the page**

Extracted with `pypdf` (8 pages, `sha256 3400b47a…`; `pdftotext` unavailable, no Homebrew). Full text: `raw/rules_clean.txt`.

**🔴 The finding that matters — verbatim:**

> "All projects must be **net-new as of August 05** — **no pre-existing code or projects are eligible.**"

The AKINDO page summary says the opposite: *"Existing products, frameworks, libraries, and codebases may be used."* The page itself states the Official Rules prevail in any discrepancy. **Treat "net-new as of August 5" as binding.** Nominee is new work, so this is fine — but it **invalidates any plan to reuse a pre-existing codebase**, and it raises a question for anyone resubmitting an earlier project.

**Prior-work / license (verbatim):**
> "The Midnight-related code newly developed or materially extended for the Contest, including the submitted Compact contract and the code reasonably necessary to evaluate its functionality, must be publicly available under the **Apache License 2.0**. Pre-existing or independently developed code may remain subject to its existing license."

**Rubric — RESOLVED.** The PDF carries the **same rubric as the page**: "Engineering & Implementation (40%) … Business Development & Viability (5%)". **The page rubric binds; the linked Google Doc (Product Leadership 20 / Backend 20 / …) is a stale generic artifact.** Ignore it.

**Disqualification (verbatim):**
> "**Technical Gate**: If the submitted Compact contract does not compile, the project is automatically disqualified." … "Code cannot be a fork, or copy of an existing project unless it extends existing functionality." … "The project's open-source repository must include the **midnightntwrk label** on GitHub." … "Participants must provide a Github repo, slide deck presentation, and a video demo/pitch."

**Submission scope (verbatim):**
> "(a) Each project may only be submitted to one (1) track — projects cannot be submitted to multiple tracks; (b) Teams may submit multiple different projects across different tracks …; (c) Each team is only eligible to win one (1) track prize."
(There is currently **1 track**.)

**Grants (verbatim):** "distributed among eligible submissions **in proportion to the points they receive**."

**IP assignment — RESOLVED as absent.** There is **no** "Intellectual Property" section and **no assignment or licence grant of your code to the Sponsor**. The only rights you grant are a standard **publicity release** over "name, city/territory of residence, biographical information, photographs or other likenesses … worldwide and in perpetuity" for advertising and promotion. Apache-2.0 on the code is the only licensing obligation.

**Dual submission to other programs — DEFERRED (genuinely unaddressed).** The rules restrict submission *across tracks within this contest* and say nothing about Korea Hackathon or Rise In. No prohibition found; no permission either. Ask (D11).

### D11. Questions for Midnight Discord #buildathon — **one message, ready to post**

> Hi — five short questions from building on 0.31.1:
> 1. Which judging rubric binds — the 40/15/15/15/10/5 on the AKINDO page, or the different one in the linked Google Doc?
> 2. Is a contract holding **shielded** coins expected to work on Preprod/Mainnet today? (Unshielded `receiveUnshielded` returns `Custom(192) InputsSignaturesLengthMismatch`; shielded `receiveShielded` is accepted — repro on local devnet, node 1.0.0.)
> 3. How does a contract **spend** a shielded coin it holds? `sendShielded` needs a `QualifiedShieldedCoinInfo`, but the contract's `ZswapChainState` comes back with `firstFree=0`, so building the spend proof fails with `invalid index into sparse merkle tree`.
> 4. Are `blockTimeGte`/`blockTimeLt` bounds in **seconds**? (Measured: yes — while the indexer reports block timestamps in ms.) Worth a docs note.
> 5. Is submitting the same project to the Korea Hackathon or Rise In's Moonshots permitted alongside the Buildathon?

---

## PART E — Verdict

### E14. GO / NO-GO — **GO**

The gate experiment passed: a Compact contract can receive and hold shielded value on a live node, proven by a controlled three-way test where the unshielded arm failed with the exact error a prior project reported. That removes the one uncertainty that would have forced a redesign, and it does so on the toolchain every live network actually runs — no 0.34.0, no ZKIR v3, no keccak, no secp256k1. The full ten-circuit architecture compiles first try, every circuit fits k≤15, all ten proving keys build in 19 seconds and total 40 MB, the multi-heir claim sequence passes 7/7 including the stale-qualification and double-claim attacks, and a calibrated ZKIR dataflow check shows every genuinely secret value clean in every circuit. Novelty also survived a second, deeper sweep: nothing resembling this exists across 439 Midnight repos or either Devpost gallery, and no trustless product anywhere hides the beneficiary set. The remaining work is ordinary engineering, not research.

**The single biggest residual risk: the exit path (A1b).** I proved the vault can take money in; I did not prove it can pay money out. The blocker is precisely characterised — the contract's `ZswapChainState` returns `firstFree=0`, so no spend proof can be built — and it is far more likely a gap in my provider wiring than a protocol limitation, but **it is unproven, and a will that cannot pay out is not a product.** Resolve it in the first two days (question 3 in D11 is already drafted), and treat it as a hard gate before building the frontend.

**Deliverables:** `ARCHITECTURE.md` (state layout, per-circuit inputs, disclosure justifications, envelope format, flows, threat model) and `BUILD_PLAN.md` (ordered tasks, engineer-days, reuse sources, both A1b branches).
