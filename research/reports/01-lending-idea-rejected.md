# Midnight Buildathon — Technical & Program Validation

**Project under evaluation:** collateral locked publicly on Cardano/Ethereum; loan terms, rate, repayment history and liquidation threshold private on Midnight; lender/auditor get scoped disclosure.

**Validated by:** direct toolchain installation, contract compilation, circuit measurement, live-network queries, and repo cloning. Nothing in the Findings tables is from memory.
**Date of validation:** 2026-09-14 · **Machine:** macOS 26.5.2, arm64 (M3-class), 11 cores, 18 GB RAM
**Working directory:** `/Users/viveksahu/Documents/hackathons/midnight/validation`

---

## ⚠️ Read this first — three findings that change the decision

1. **Wave 1 closes in ~2 days.** Submission deadline is `2026-09-16T15:00:00Z`. There are already **41 submissions**, and the $3,500 pool is split **proportionally by points**, not winner-take-all. Realistic expected value for a median entry is roughly **$85**.
2. **The cross-chain half of your idea cannot be deployed to any live Midnight network today.** `keccak256`, `secp256k1EcdsaVerify` and `secp256k1EthereumAddress` exist *only* in Compact toolchain **0.34.0** with `--feature-zkir-v3`. All three live networks (Preview, Preprod, Mainnet) run **0.31.1**, where those symbols are **unbound identifiers**. I proved this by compiling against both toolchains.
3. **The Cardano half cannot be built at all.** `blake2b` does not exist in *either* toolchain, and is absent from the standard-library source. The widely-reported "Keccak for Ethereum, Blake2b for Cardano" story is **half-shipped**: Keccak is real, Blake2b is not.

The Midnight-native half of the idea, by contrast, **compiles and is cheap** — a full private-lending contract cost me 1,340 rows and 3.2s to build on the live toolchain.

---

## Part A — The hackathon itself

### A1. The Akindo program page

The page at `app.akindo.io/wave-hacks/jaMZjqPOBsLXvjdG` is a client-rendered Next.js shell (`__NEXT_DATA__.props.pageProps` is `{}`). Plain fetch returns nothing useful. I recovered the real data by extracting the API base from the JS bundle (`pages/_app-c2d4ed58a89b8789.js`, hook `useFetchWaveHack`) and calling the public REST endpoint directly.

**Endpoint:** `GET https://api.akindo.io/public/wave-hacks/jaMZjqPOBsLXvjdG` → HTTP 200, 23,660 bytes. Saved to `research/evidence/wavehack.json`.
The `?tab=overview|products|rules` variants are **client-side only** — they change no server response; all tab content lives in the single JSON payload above.

| Claim | Verdict | Evidence | Confidence |
|---|---|---|---|
| Title is "Build Privacy-First Apps on Midnight" | **VERIFIED** | `wavehack.json` `.title` | High |
| Wave 1 submission deadline `2026-09-16T15:00:00.000Z` | **VERIFIED** | `.activeWave.submissionDeadline`; `/waves` endpoint agrees | High |
| 41 submissions already in Wave 1 | **VERIFIED** | `.activeWave.totalSubmissionCount` = 41; `.totalProducts` = 41 | High |
| Grants split **proportionally by points** | **VERIFIED** | `.activeWave.grantDistributionMode` = `"point"`; rules §8: "distributed among eligible submissions **in proportion to the points they receive**" | High |
| Prize is USDT on **Ethereum mainnet** | **VERIFIED** | `.grantDenomination` = USDT `0xdac17f958d2ee523a2206206994597c13d831ec7`, decimals 6; `.grantEvmChain` = chainId 1 | High |
| Platform takes a 10% fee | **VERIFIED** | `.feePer` = `0.100` | Medium (field name inferred) |

**Judging criteria (verbatim, with weights from `.criteria`):**

| Criterion | Weight | Description (verbatim) |
|---|---:|---|
| Engineering & Implementation | **40** | "Evaluates whether the Compact contract compiles, includes private state management, and demonstrates understanding of Midnight's dual-ledger model. The repository should be well-organized with a clear README. We encourage participants to tag their repos with relevant Midnight topics and include ecosystem attribution." |
| Quality Assurance & Reliability | **15** | "Evaluates the presence of simulation and test files, whether test cases pass, and overall product stability under basic use." |
| Product & Vision | **15** | "Evaluates the soundness of the idea, its connection to Midnight's core capabilities, and whether the scope and roadmap are realistic." |
| User Experience & Design | **15** | "Evaluates whether the frontend is intuitive, behaves as expected, and connects to the contract for a functional end-to-end experience." |
| Communication | **10** | "Evaluates the clarity and structure of the video presentation and slide deck." |
| Business Development & Viability | **5** | "Evaluates target audience awareness, market potential, and adoption path." |

**⚠️ Rubric discrepancy (flagged).** The rules link a "Midnight Buildathon Judging Rubric" Google Doc. I exported it (`research/evidence/rubric.txt`, 7,183 bytes) and it is a **different rubric**: Product Leadership 20 pts, Backend Engineering 20, Frontend & UX 15, Quality Assurance 15, (Education) 15, Business Development & Viability 15 — total 100, "each domain is scored independently by its expert judge." This does **not** match the 40/15/15/15/10/5 split on the page. **Verdict: VERIFIED discrepancy.** Confidence: High. Which one binds is unresolved — worth asking in Discord.

**Submission requirements (verbatim, rules §6):**
- "A link to a publicly accessible **GitHub repository**"
- "A clear **README** explaining the project, setup process, architecture, Midnight integration, and how judges can test or evaluate the submission."
- "A **slide deck** (pitch presentation)."
- "A **demo / video pitch**."
- "A description of the progress completed during the applicable Wave."
- "The repository must include the **`midnightntwrk` label on GitHub**."
- **Deployment to a network is NOT required.** The only hard technical gate is: "Each submission must include at least one Compact contract that compiles successfully. A submission that does not satisfy this requirement will be automatically disqualified."
- Team size: "up to **five (5) registered members**", each registering individually.
- License: "must be publicly available under the **Apache License 2.0**" — for "the Midnight-related code newly developed or materially extended for the Buildathon."

**Eligibility (verbatim, rules §2–3):**
- "Existing products, frameworks, libraries, and codebases **may be used**." But: "the Midnight-related functionality submitted for evaluation must be **newly developed or materially extended during the applicable Wave**."
- "Mere copies, superficial modifications, or submissions that do not demonstrate meaningful new Midnight-related functionality are not eligible."
- 18+; sanctions exclusions (Afghanistan, Belarus, Cuba, Iran, Iraq, North Korea, Russia, Syria, Venezuela, Yemen, Myanmar, Somalia, Sudan).
- Employees of Sponsor/Midnight Foundation "may participate but are **not eligible to win prizes**."

**"What we look for" (verbatim excerpt):** "Present a product, prototype, developer tool, infrastructure solution, or working concept related to the theme. / Explain how privacy meaningfully shapes the product or technical design. / … / Show what changed since the previous Wave when continuing with the same project."

No explicit "what we don't want" section exists beyond the anti-fork language.

**Official Rules PDF — PARTIALLY VERIFIED.** Downloaded from the Drive link: 8 pages, 238,097 bytes, `sha256 = 3400b47ae39d7701134af685e24a206059a1e68b811d0e8f84317aeec2e88d22` (`research/evidence/rules.pdf`). Text is in embedded subset fonts with custom encoding; my extraction attempts returned only font tables, not prose. **To verify:** open the PDF manually, or run `pdftotext` (poppler). The on-page rules explicitly self-describe as "a summary" and state "In case of any discrepancy, the Official Rules prevail" — so anything decision-critical (especially the prior-work rule) should be read from the PDF directly.

### A2. RFS page — both ideas confirmed

| Claim | Verdict | Evidence | Confidence |
|---|---|---|---|
| "Private Overcollateralized Lending" appears on the RFS page | **VERIFIED** | midnight.network/request-for-start-ups | High |
| "Private RWA Collateral Vault" appears on the RFS page | **VERIFIED** | same | High |

Verbatim:
> **Private RWA Collateral Vault** — "Post real estate, art, or equity as collateral without revealing asset type. Asset details hidden, collateral ratios provable"

> **Private Overcollateralized Lending** — "Borrowers lock collateral privately, lender sees only ZK collateral ratio proof. Collateral hidden, ratios provable"

Adjacent entries that also bear on your design: **Confidential Derivatives Exchange** — "Futures/options with protected margin accounts and **hidden liquidation thresholds**. Positions and liquidation thresholds remain private but solvency is provable"; and **ZK Proof-of-Reserves Auditor**.

**Note the framing difference.** The RFS says collateral is locked *privately* and the lender sees a ratio proof. Your idea locks collateral **publicly on another chain**. That is a materially different — and much harder — problem, and it is the part that is blocked (Part C). Direct re-fetch of the RFS page returned HTTP 429 (rate-limited); the content above came through a rendering fetch. Confidence remains High since both strings were quoted back verbatim with surrounding context.

### A3. Other currently open Midnight programs

| Program | Host | Status | Prize |
|---|---|---|---|
| The Midnight Buildathon | Akindo | **Open** (Wave 1 ends Sep 16) | $12,500 total |
| Midnight Korea Hackathon 2026 | midnightkorea.org | **Open**, ends **Sep 28, 2026** | $6,000 |
| New Moon to Full: Monthly Moonshots | Rise In | **Open**, ongoing from Sep 1 | $8,000 |
| MLH Midnight Hackathon (May & Aug 2026) | MLH/Devpost | **Closed** | — |

**Dual submission — UNVERIFIABLE.** I found no clause in the Buildathon rules either permitting or forbidding submitting the same project elsewhere. The rules govern *originality relative to prior Waves*, not exclusivity across programs. **To verify:** read the Official Rules PDF §"Entry"/"General Conditions", and ask in Midnight Discord. My read is that dual submission is probably tolerated (the ecosystem actively cross-promotes these), but do not rely on that. Confidence: Low.

---

## Part B — Compact language capabilities (all compiled)

### Toolchain installed and exact versions

```
compact CLI installer       APP_VERSION="0.5.2"
  (curl https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh)
compact --version           compact 0.5.2        → /Users/viveksahu/.local/bin/compact

Toolchain 0.34.0 (latest):  compiler 0.34.0 | language 0.26.0 | ledger-9.1.0.0-rc.3 | runtime 0.19.0
Toolchain 0.31.1:           compiler 0.31.1 | language 0.23.0 | ledger-8.0.2       | runtime 0.16.0
```

`compact list` shows available: 0.34.0, 0.31.1, 0.31.0, 0.30.0, 0.29.0, 0.28.0, 0.26.0, 0.25.0, 0.24.0, 0.23.0, 0.22.0.

**Docs are stale — VERIFIED.** `docs.midnight.network/examples/getting-started/installation` instructs `compact update 0.31.1`, but 0.34.0 is the latest released. Confidence: High.

**🔴 The version trap — the single most important finding in this report.**

The official support matrix (`docs.midnight.network/relnotes/support-matrix`) lists **Compact toolchain 0.31.1** for **Preview, Preprod and Mainnet** — all three. Alongside: node 1.0.2, proof server 8.1.0, Midnight.js 4.1.1, DApp Connector 4.0.1, Wallet SDK 1.2.0, indexer 4.3.5 (Preview) / 4.3.3-hotfix (Preprod, Mainnet).

The 0.34.0 release notes shipped in the toolchain (`~/.compact/versions/0.34.0/aarch64-darwin/toolchain-0.34.0-rc.1.md`, dated 2026-08-18) say it plainly:

> "Ledger version 9 will be, but is not yet, deployed on Midnight Mainnet. If you are building contracts to be deployed to the current (as of Aug 18) Midnight Mainnet, you should continue to use Compact toolchain 0.31.x."

Corroborated independently: `docs.midnight.network/llms.txt` references `@midnight/ledger v8.0.3` throughout; the official `example-zkloan` README states "Compact toolchain **0.31.1**"; `example-counter` pins `@midnight-ntwrk/ledger-v8`; the `onepledge` project deployed to Preprod today and its README says "Compact toolchain **0.31.1** (language 0.23), **the version Preprod runs**."

### B4. Hash functions — measured

Method: compile a probe referencing each symbol; `unbound identifier` = absent, `invalid context for reference` = present. Return types obtained by forcing a deliberate type mismatch.

| Function | 0.31.1 (live nets) | 0.34.0 + zkir-v3 | Signature | Cost (rows/call) |
|---|---|---|---|---|
| `persistentHash<T>` | ✅ | ✅ | `(T) → Bytes<32>` | **1,883** |
| `transientHash<T>` | ✅ | ✅ | `(T) → Field` | **~20** |
| `persistentCommit<T>` | ✅ | ✅ | — | — |
| `transientCommit<T>` | ✅ | ✅ | — | — |
| `keccak256<T>` | ❌ **unbound** | ✅ | `(T) → Bytes<32>` | **4,215** per 136-byte block |
| `sha256` | ❌ unbound | ❌ **unbound** | — | — |
| `sha3` | ❌ unbound | ❌ **unbound** | — | — |
| `blake2b` / `blake2b256` | ❌ unbound | ❌ **unbound** | — | — |
| `poseidon` | ❌ unbound | ❌ unbound | (exposed only via `transientHash`) | — |

**Verdict: `sha256`, `sha3`, `blake2b` DO NOT EXIST in any released Compact toolchain. VERIFIED.** Confidence: **Very High** — proven twice: (a) compiler rejects them as unbound in both 0.31.1 and 0.34.0; (b) absent from the standard-library source at `github.com/LFDT-Minokawa/compact/blob/main/compiler/standard-library.compact` (`grep -i 'blake\|sha256\|sha3\|keccak'` → zero matches; keccak/persistentHash are compiler builtins, not stdlib-declared).

**Keccak input-size behaviour (measured — clean sponge structure, rate = 136 bytes):**

| `Bytes<N>` | 1 | 32 | 64 | 128 | **136** | 137 | 256 | 512 | 1024 |
|---|---|---|---|---|---|---|---|---|---|
| rows | 4,246 | 4,338 | 4,412 | 4,580 | **8,772** | 8,775 | 9,091 | 18,113 | 36,180 |

The jump at exactly 136 bytes confirms one Keccak-f permutation per 136-byte block at **~4,215 rows each**. This is the number that drives every Ethereum estimate below.

### B5. Elliptic curve & signature primitives

| Primitive | 0.31.1 | 0.34.0 | Notes |
|---|---|---|---|
| `ecAdd`, `ecNeg`, `ecMul`, `ecMulGenerator` | ✅ | ✅ | overloaded: `(JubjubPoint, JubjubScalar)` and `(Secp256k1Point, Secp256k1Scalar)` |
| `hashToCurve<T>` | ✅ | ✅ | generic over type |
| `constructJubjubPoint`, `jubjubPointX/Y` | ✅ | ✅ | |
| `jubjubSchnorrVerify<#N>` | ❌ unbound | ✅ | |
| **`secp256k1EcdsaVerify`** | ❌ unbound | ✅ **zkir-v3 only** | `(Bytes<32>, Secp256k1EcdsaSignature{r: Secp256k1Scalar, s: Secp256k1Scalar}, Secp256k1Point) → Boolean` |
| **`secp256k1EthereumAddress`** | ❌ unbound | ✅ **zkir-v3 only** | `(Secp256k1Point) → Bytes<20>` |
| `secp256k1PointX/Y` | ❌ unbound | ✅ zkir-v3 only | |

**The secp256k1 family requires `--feature-zkir-v3` even on 0.34.0.** Without the flag they are unbound; with it they resolve. Verified by running the identical probe with and without the flag.

**Can an Ethereum signature be verified in-circuit at all? YES — but only on 0.34.0 + ZKIR v3, which no live network accepts.**

### B6. Ethereum address from public key — it compiles

This is the real test, and it passes:

```compact
pragma language_version >= 0.26;
import CompactStandardLibrary;

export ledger lastAddr: Bytes<20>;
witness ethPubKey(): Secp256k1Point;
witness ethSig(): Secp256k1EcdsaSignature;

export circuit proveEthControl(msgHash: Bytes<32>): [] {
  const pk  = ethPubKey();
  const sig = ethSig();
  assert(secp256k1EcdsaVerify(msgHash, sig, pk), "bad sig");
  const addr = secp256k1EthereumAddress(pk);
  lastAddr.write(disclose(addr));
}
```

```
$ compact compile --feature-zkir-v3 eth_verify.compact out/ethv_full
Compiling 1 circuits:
  24.24s user  0.74s system  153% cpu  16.272 total
$ zkir-v3 mock-compile out/ethv_full/zkir/proveEthControl.zkir
Mock compiling circuit (k=16, rows=60164)
$ ls -la out/ethv_full/keys/
111,161,448  proveEthControl.prover      ← 106 MiB
      2,601  proveEthControl.verifier
```

**Measured costs, isolated:**

| Circuit | rows | k |
|---|---:|---|
| `secp256k1EthereumAddress` alone | **31,663** | 15 |
| `secp256k1EcdsaVerify` alone | **28,911** | 15 |
| Both together (above) | **60,164** | 16 |
| Jubjub `ecMul` (native curve) | **355** | 9 |

**The 90× gap is the story.** secp256k1 is a *foreign* field emulated over BLS12-381, so every operation costs ~30k rows. Jubjub is embedded in BLS12-381 and costs 355. Anything you can express in Jubjub is essentially free; anything requiring Ethereum's curve is not. Confidence: Very High (direct measurement).

### B7. Witnesses, private state, disclose, ledger types — all confirmed

| Ledger type | Result |
|---|---|
| `Field`, `Boolean`, `Uint<64>`, `Bytes<32>` | ✅ |
| `Counter` | ✅ |
| `Map<K,V>`, `Set<T>`, `List<T>` | ✅ |
| `MerkleTree<n,T>`, `HistoricMerkleTree<n,T>` | ✅ |
| `Opaque<'string'>` | ✅ |
| **`Cell<Field>`** | ❌ **unbound identifier `Cell`** — a bare `export ledger v: Field;` *is* the cell; `Cell` is not a nameable type |

Structs, enums, `witness`, and `disclose()` all confirmed working (see the lending contract in Part D and the official zkloan contract).

**Merkle membership as a witness — works, and is cheap.** Pattern:

```compact
witness findPath(cm: Bytes<32>): MerkleTreePath<20, Bytes<32>>;
...
assert(commitments.checkRoot(disclose(merkleTreePathRoot<20, Bytes<32>>(path))), "not a member");
```

| Depth | 8 | 10 | 16 | 20 | 32 |
|---|---|---|---|---|---|
| rows | 6,045 | 6,095 | 6,245 | 6,345 | 6,645 |

**~25 rows per level.** Depth 32 costs 6,645 rows total. This uses the native transient hash, which is why it's ~170× cheaper per level than a Keccak path.

**The disclosure analysis is genuinely strong — and it is a real asset for your privacy claim.** Omitting `disclose()` produces a full taint path, not a vague error:

```
potential witness-value disclosure must be declared but is not:
  witness value potentially disclosed: the return value of witness findPath at line 7
  nature of the disclosure: ledger operation might disclose a hash of the witness value
  via this path through the program:
    the binding of path at line 13 char 9
    the argument to merkleTreePathRoot at line 15 char 32
    the argument to checkRoot at line 15 char 21
```

It tracks three distinct disclosure natures (hash of value, hash of boolean-ness, hash of a modulus of a hash) through the dataflow. It even flags a *public circuit parameter* fed to `blockTimeLt`. This is compiler-enforced privacy, and it is the strongest single argument for "why Midnight and not chain X."

### B8. Circuit limits — measured

`Bytes<N>` has **no practical compile-time ceiling** in the range tested. `Bytes<65537>` compiled successfully.

| `Bytes<N>` hashed with `persistentHash` | rows | k |
|---|---:|---|
| 2,048 | 66,968 | 17 |
| 4,096 | 132,032 | 18 |
| 8,192 | 262,161 | 19 |
| 65,536 | 2,083,992 | 21 |
| 65,537 | 2,083,994 | 21 |

≈ **32 rows per byte** for `persistentHash`. The real limit is not the compiler but the **proving key**: 60k rows (k=16) → 106 MiB. Each k step doubles it. k=18 ≈ 425 MiB, k=21 ≈ 3.4 GiB. **Practical ceiling: k=17–18 (~130k–260k rows)** before key size and memory make a laptop demo untenable.

**Hash-call budget before impracticality:**
- `transientHash` (~20 rows): tens of thousands. Effectively unlimited.
- `persistentHash` (1,883 rows): ~**60 calls** to reach k=17.
- `keccak256` (4,215 rows/block): ~**30 blocks** to reach k=17. This is the binding constraint for anything Ethereum-shaped.

### B9. Viewing keys / scoped disclosure — **must be built yourself**

| Claim | Verdict | Evidence | Confidence |
|---|---|---|---|
| Compact has a native contract-level "viewing key" primitive | **FALSE** | No such symbol in stdlib source or builtins; `grep` of `standard-library.compact` finds nothing | High |
| A "viewing key" exists at the **wallet/indexer** layer | **VERIFIED** | `docs.midnight.network/llms.txt` line 562: `connect` — "Connect the wallet with the given **viewing key** and return a session ID" | High |

These are different things. The indexer viewing key lets a wallet decrypt *its own* shielded activity; it is not a mechanism for granting a lender scoped read access to a loan's private fields. **Scoped disclosure must be built client-side**, exactly as MatchLock did — encrypt to the recipient off-chain, publish ciphertext, and (optionally) prove in-circuit that the ciphertext is well-formed.

What Compact *does* give you natively is **`disclose()` as a compiler-enforced boundary** — selective disclosure of *derived facts* (a band, a boolean, a commitment), not selective *readership*. That is a genuinely useful primitive, but it discloses to everyone or no one.

### B10. Reading Cardano/Ethereum state from a contract — **not possible**

| Claim | Verdict | Evidence | Confidence |
|---|---|---|---|
| The SDK exposes an oracle/bridge module a contract can read | **FALSE** | Midnight API reference lists only: Wallet SDK, Compact Runtime, Midnight.js, DApp Connector, Indexer, Ledger, Onchain Runtime, ZSwap, Testkit.js. No oracle/bridge/cross-chain module. | High |
| All external data must enter as a witness | **VERIFIED** | No alternative ingress exists in the language; confirmed by every prior-art repo surveyed | High |
| Midnight *nodes* observe Cardano | **VERIFIED, but irrelevant to contracts** | Docs ship `nodes/cardano-node.md` and `nodes/cardano-db-sync.md`; indexer exposes `dustGenerationStatus`, `CardanoRewardAddress`, `PoolMetadata` | High |

The Cardano observation that exists is **protocol-level, for NIGHT/DUST generation only**. It is not surfaced to Compact contracts. MIP #20 ("Protocol-Level Bridge for Cardano to Midnight NIGHT Token Transfers") confirms the scope: unidirectional, **NIGHT tokens only**, observing only "the bridge's Plutus contract" with "strict Boundary Validation." Status: **closed/"Done" but not implemented**, no committed dates.

**Conclusion: every fact about Cardano or Ethereum must enter your circuit as a witness, i.e. as an unauthenticated prover claim, unless you verify a signature or a hash chain in-circuit.**

---

## Part C — Cross-chain state verification feasibility

### C11. The "Keccak + Blake2b" feature — half real

| Claim | Verdict | Evidence | Confidence |
|---|---|---|---|
| Keccak256 is in the **released** compiler | **VERIFIED** | Compiles in 0.34.0; measured 4,215 rows/block | Very High |
| Keccak256 is usable on **live networks** | **FALSE** | Unbound in 0.31.1, the version all three networks run | Very High |
| Blake2b is in the released compiler | **FALSE** | Unbound in 0.31.1 **and** 0.34.0; absent from stdlib source | Very High |
| Blake2b exists on a branch | **UNVERIFIABLE** | GitHub code search requires auth (HTTP 403 unauthenticated). Repo `LFDT-Minokawa/compact` last pushed 2026-09-11 | Low |

The public narrative (Sebastien Guillemot, covered by KuCoin/Bitget/U.Today) describes "Keccak (Ethereum-compatible) and Blake2b (used in Cardano)" as foundational prep for cross-chain verification. **That is an announcement, not a shipped capability.** The Keccak half landed in 0.34.0; the Blake2b half is not in any released artifact I can compile against.

**To verify the branch question:** authenticate to the GitHub API (`gh auth login`, then `gh search code blake2b --repo LFDT-Minokawa/compact`) and enumerate branches on `LFDT-Minokawa/compact`.

**Corroborating evidence that stdlib crypto lags:** the *official* `example-zkloan` ships a hand-written Schnorr implementation with this header:

> "Schnorr Signature Verification **Polyfill** for Jubjub Curve — **Temporary: will be replaced by `jubjubSchnorrVerify` from CompactStandardLibrary when it becomes available in a future Compact compiler release.** See: github.com/LFDT-Minokawa/compact/blob/25b22e3/compiler/standard-library.compact"

That is Midnight's own team working around a missing primitive, exactly as you would have to.

### C12. Constraint cost of cross-chain proofs

**(a) Cardano UTxO inclusion proof (Blake2b-256, ~20 levels) — NOT FEASIBLE.** Two independent blockers:

1. **No Blake2b primitive.** You would implement Blake2b-256 in Compact from scratch. Blake2b is 12 rounds × 8 G-functions, each G doing 4 additions mod 2⁶⁴, 4 XORs, and 4 rotations on 64-bit words. In a prime field there is no native 64-bit XOR or rotate — each requires bit decomposition (64 bits/word, 16 words). Extrapolating from Keccak-f's measured 4,215 rows, a Blake2b compression is plausibly **3,000–8,000 rows**; a 20-level path (each level hashing 64 bytes = one 128-byte block) ≈ **60,000–160,000 rows**, plus weeks of implementation and no test vectors in-language. *(Estimate — confidence Medium; the multiplier is extrapolated, not measured.)*
2. **Cardano does not expose UTxO inclusion proofs.** This is the deeper problem. Cardano block headers commit to the block *body*, not to a Merkleized UTxO set with light-client-friendly inclusion paths. There is no state root you can prove membership against the way Ethereum's MPT allows. A light-client proof of "this UTxO exists and is unspent" requires replaying ledger state, which is not a fixed-size circuit. **Confidence: High** on the architectural claim; **Medium** that no workaround exists (a Midnight-side Cardano observer could in principle attest, but that reintroduces trust and does not exist for arbitrary state — see B10/MIP #20).

**Verdict: NOT FEASIBLE.** Not "hard" — structurally unavailable.

**(b) Ethereum Merkle-Patricia storage proof (Keccak, RLP, ~8 nodes) — FEASIBLE WITH EFFORT, BUT UNDEPLOYABLE.**

I built the hashing skeleton and measured it: 8 witness nodes of `Bytes<532>` each, keccak'd.

```
eth_mpt8 [verifyStorageProof]: k=18, rows=173137
```

That is **173,137 rows for the hashing alone**. Not included, and all additive:
- RLP decoding of each node (list headers, length prefixes, byte-range extraction)
- Nibble-path traversal and prefix matching against the keccak'd storage slot key
- Branch-node child selection (17-way indexing per node)

Realistic total: **200,000–300,000 rows → k=18–19 → prover key 425 MiB–850 MiB**. Buildable by a competent team in perhaps 2–4 weeks. But it requires toolchain 0.34.0 + ZKIR v3, which **cannot be deployed to Preview, Preprod, or Mainnet.** A judge asking "can I run this?" gets "no."

**Verdict: feasible as an offline artifact; not feasible as a deployed demo in this Buildathon.**

### C13. Provable source state — Liqwid and Aave

| Claim | Verdict | Evidence | Confidence |
|---|---|---|---|
| Liqwid's core validator scripts / datum formats are public | **FALSE** | Enumerated all 49 public repos in `Liqwid-Labs` org. Present: `liqwid-libs` (Plutarch libraries), `liqwid-pyth-oracle`, `liqwid-liquidation-bot`, `agora` (governance), `lucid-evolution`. **Absent: core market validators, datum type definitions, `liqwid-markets.json`.** | High |
| Liqwid state could be proven from Cardano | **FALSE** (follows from C12a) | No UTxO inclusion proofs on Cardano | High |
| Aave V3 `getUserAccountData` is proof-friendly | **PARTIALLY — UNVERIFIABLE as specified** | See below | Medium |

On Aave: `getUserAccountData` is a **view function**, not storage. It aggregates across reserves at call time. You cannot prove a view function's return value with a storage proof — you must prove the *underlying* storage slots (`_users[user].configuration` bitmap, then per-reserve `scaledBalance` from each aToken/debtToken, plus each reserve's liquidity/borrow indices and the oracle price), then *recompute* the aggregation in-circuit. That is not one MPT proof; it is one proof **per reserve touched**, each ~173k rows by my measurement, plus fixed-point index math. For a user in 3 reserves you are looking at well over 500k rows. **To verify precisely:** pin an Aave V3 pool address, call `eth_getProof` for the specific slots, and count nodes. I did not do this because the deployment blocker (C11) makes it moot for this Buildathon.

### C14. Bridges and assets on Midnight

| Claim | Verdict | Evidence | Confidence |
|---|---|---|---|
| A live Cardano↔Midnight **state** bridge exists | **FALSE** | MIP #20 closed-but-unimplemented; scope is NIGHT tokens only, unidirectional | High |
| A live Ethereum↔Midnight bridge exists | **FALSE / UNVERIFIABLE** | No official source found. Media coverage describes *intent* | Medium |
| Assets exist on Midnight beyond NIGHT and DUST | **VERIFIED** | KAAMOS runs "USDM on Cardano ⇄ **USDC on Midnight preprod**" with a live preprod demo; Compact stdlib has full shielded + unshielded token minting (`mintShieldedToken`, `mintUnshieldedToken`, `tokenType`) | High |

Note the asymmetry: **NIGHT is unshielded and transferable; DUST is shielded and non-transferable**, generated by registered NIGHT, and spent for fees. You do not buy DUST.

Official vs social: the Cardano observation capability is real but confined to the protocol's own NIGHT/DUST accounting (docs ship Cardano node + db-sync setup guides). The "Midnight bridges Ethereum and Cardano" headlines are extrapolations from a developer's roadmap comments.

---

## Part D — Network and deployment reality

### D15. Local devnet — **BLOCKED on this machine**

| Claim | Verdict | Evidence |
|---|---|---|
| Local devnet requires Docker | **VERIFIED** | `midnight-local-dev` README Prerequisites: "**Node.js** >= 22.0.0 / **Docker** and **Docker Compose** (v2)". Proof server is distributed only as `midnightntwrk/proof-server:8.1.0` Docker image |
| Docker is available here | **FALSE** | `which docker docker-compose podman colima` → all "not found"; no Homebrew either |
| A native (non-Docker) proof server exists | **FALSE** | `midnightntwrk/midnight-proof-server` releases API → "Not Found"; npm `@midnight-ntwrk/proof-server` → E404 |

**I could not stand up the devnet, and I am not going to claim otherwise.** **To verify:** install Docker Desktop (or `colima start`), then `npx @midnight-ntwrk/midnight-local-dev` per the README, and record `docker stats` for the node/indexer/proof-server trio. Expect the proof server to be the memory hog — it holds proving keys in RAM, and my k=16 key alone was 106 MiB.

### D16. Preprod — **network VERIFIED live; I did not deploy myself**

I verified Preprod is live and accepting contracts by querying it directly for a contract deployed by a third party **today**:

```
$ curl -X POST https://indexer.preprod.midnight.network/api/v4/graphql \
    -d '{"query":"query { contractAction(address:\"9eefef...eabd1\"){ __typename address state transaction { hash block { height timestamp } } } }"}'
HTTP 200
typename: ContractCall
address:  9eefef805cab2d064ebfe4c2f6b3599663860ba7dc1b69877e3a6b9c976eabd1
tx:       ca55d14f54937b067b39033bed20fd3d87e998e782b2302a083f9ca8cd71708b
block:    {height: 2543295, timestamp: 1789372404000}
state:    11,586 bytes  (header b'midnight:contract-state[v6')
```

That contract (`onepledge`) was deployed **2026-09-14T07:48:36Z** — hours before this validation — with deploy tx `003bcfcd0495…`, block 2543245, and five subsequent successful circuit calls. **Preprod works, today, for a real multi-circuit contract.**

**Endpoints confirmed reachable:**
- Indexer: `https://indexer.preprod.midnight.network/api/v4/graphql` (HTTP 200, validates queries) · WS: `wss://indexer.preprod.midnight.network/api/v4/graphql/ws`
- RPC: `wss://rpc.preprod.midnight.network`
- Faucet: `https://midnight-tmnight-preprod.nethermind.dev/` (HTTP 200)
- Explorer: `https://preprod.midnightexplorer.com` (HTTP 200)

**I did not deploy example-counter myself** — deployment requires a running proof server (Docker, unavailable). **Time-to-deploy, UNVERIFIED by me**, but the onepledge record gives a real reference: deploy at 07:48:36Z, first circuit call at 07:51:38Z, five calls complete by 07:53 — **~5 minutes end-to-end for deploy + 5 proven transactions.**

**Wallet / headless:** Lace is the browser wallet (`example-zkloan` README: "the Midnight Lace wallet browser extension" — required "for the remote testnet flow only"). **Headless/CLI deployment works** — both `onepledge` and `example-zkloan` ship CLI deploy paths (`npm run deploy --workspace cli`). One concrete gotcha recorded by onepledge, worth heeding: *"Node.js 22+ … The CLI scripts run on Node 22 via `npx node@22`: **Node 23+ uses a built-in WebSocket that drops Preprod RPC submissions** (observed with the Midnight wallet SDK 1.2.0)."* This machine has Node v24.20.0 — you will hit this.

### D17. Mainnet — open, but on ledger 8

| Claim | Verdict | Evidence | Confidence |
|---|---|---|---|
| Mainnet is live | **VERIFIED** | Launched 2026-03-31 with nine federated operators (Google Cloud, Blockdaemon, Worldpay, MoneyGram, Vodafone) | High |
| Mainnet accepts arbitrary contract deployment | **VERIFIED (with caveat)** | Support matrix lists Mainnet with a full toolchain row (0.31.1); Kukolu phase "allow[s] builders to deploy the first wave of privacy-centric DApps" | Medium-High |
| Deploying costs DUST; DUST is not purchasable | **VERIFIED** | DUST is "shielded", "non-transferable", "generated continuously by registered NIGHT"; "you spend DUST to use Midnight, but you do not buy it as a normal transferable token" | High |
| Mainnet supports 0.34.0 / ledger 9 | **FALSE** | Support matrix: 0.31.1. Release notes: "Ledger version 9 will be, but is not yet, deployed on Midnight Mainnet." | Very High |

Practical consequence: to deploy to Mainnet you must **hold and register NIGHT** to generate DUST. For a Buildathon demo, Preprod (free faucet) is the correct target — and deployment is not required by the rules anyway.

### D18. Proving time — **UNVERIFIABLE here; keygen measured as a proxy**

Real proving requires the proof server (Docker). I could not measure wall-clock proving time. What I *did* measure is proving-key generation, which scales with the same circuit size:

| Circuit | rows | k | keygen (wall) | prover key |
|---|---:|---:|---:|---:|
| Private lending contract, 3 circuits (0.31.1) | 373 / 1,071 / 1,340 | 9–11 | **3.19 s** | 1.3 MB total |
| **Mid-size: 10 hashes + Merkle-20** (the item-18 circuit) | **23,048** | **15** | **6.40 s** | **9.7 MB** |
| ECDSA verify + ETH address (0.34.0) | 60,164 | 16 | **16.27 s** | **106 MiB** |

The exact circuit you asked about — 10 `persistentHash` calls plus depth-20 Merkle membership — is **23,048 rows, k=15**, and took 6.4 s to generate keys on this laptop.

**To verify actual proving time:** install Docker, run `docker run -p 6300:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v`, and time a `submitCallTx` against the local network. My expectation from the k values: **sub-second to a few seconds for k≤15**, and **tens of seconds plus multi-GB RAM at k=18** — but that is extrapolation, not measurement, and you should not quote it as fact.

---

## Part E — Prior art (this is where the idea is most exposed)

### E19. The five repos you named

| Repo | Primitives used | Deployed? | Tests | Out of scope / notes |
|---|---|---|---|---|
| **harshkas4na/midnight-health-factor-proof** | `persistentHash`, witnesses, `Map`, `Counter`, `Set`, banded `disclose` | **Yes — Preview testnet**, recorded in-repo | **16** (incl. byte-level state assertions) | **This is an active Wave 1 Buildathon competitor.** Last commit 2026-09-07. No collateral custody, no lender side, no cross-chain. |
| **KaranSinghBisht/nightpool** | 2 contracts (`nightpool`, `nightauction`) | Hackathon result noted in README | 3 | Only 2 commits; last touched 2026-07-24. Dormant. |
| **CipherCollective/Latch** | `moat.compact` | — | **13** | 101 commits, the most mature of the five. Last active 2026-07-19. |
| **ThunderRoar/MatchLock** | `matchlock.compact`; **client-side encryption for scoped disclosure** | — | 1 | Confirms your premise: viewing-key behaviour is hand-rolled off-chain. |
| **kaleababayneh/moonray** | `slicer.compact` | — | 2 | Apache-2.0 added late (2026-07-19). |

**The closest match is `midnight-health-factor-proof`, and it is close enough to be a real problem.** Its own README describes: a borrower proving "where their lending position sits relative to **their own risk policy** — without disclosing the collateral, the debt, or **the policy threshold itself**." Its contract keeps `collateral`, `debt`, `policyBps`, `secretKey` in witnessed private state, discloses a 4-tier risk **band** plus a pseudonymous attestation, and enforces the private policy is at least as strict as a public floor. It even ships the byte-level leak test you asked me to design (Part F25).

That covers **the private-threshold, private-health-factor, scoped-disclosure core of your idea** — already built, already deployed, already tested, by a team in the same Wave.

### E20. Devpost and the wider ecosystem

**`midnightntwrk` GitHub topic: 439 repositories.** Direct competitors in the lending/collateral space:

| Repo | Tagline | Last updated |
|---|---|---|
| **midnightntwrk/example-zkloan** | **Official Midnight "ZK Loans" example DApp** | 2026-09-01 |
| `Sammy949/freeboard` | "Prove your DeFi position is solvent without revealing it: zero-knowledge solvency proofs on Midnight" | **2026-09-14** |
| `farouk-allani/amana` | "Portable private **repayment history** on Midnight. Prove a record earned at one lender to a lender who will never see it." | **2026-09-14** |
| `OoJae/onepledge` | "One pledge per receivable, across rival lenders, without any lender seeing another's book." | **2026-09-14** |
| `Turnless/kymider` | "Privacy-first **loan underwriting** on Midnight. Borrowers prove net worth and debt-to-income…" | 2026-09-11 |
| `seekdaseek/datum` | "Zero-knowledge solvency attestation: proves a **lending book** covers its debt at realisable exit prices" | 2026-09-03 |

Devpost (Midnight Hackathon August 2026) adds: **ProofLend** ("AI agent verifies loan eligibility checks"), **Creva-ZK** (collateralized card), **VeriSolv** ("Cross-chain attestation solvency engine").

**The official `example-zkloan` matters most.** It is Midnight's own reference implementation and it already has: private credit score / income / tenure via witnesses, Schnorr-attested oracle data from registered providers, loan status and authorized amounts on the public ledger, PIN-rotatable pseudonymous identity, an admin role, and blacklisting. A judge evaluating "Engineering & Implementation" (40% of the score) has this as their mental baseline.

**One critical security note from that official contract**, directly relevant to your threat model:

> "`ownPublicKey()` is never used: it returns a **prover-claimed value with no cryptographic binding to the transaction signer**, so any assertion that depends on it is bypassable."

### E21. KAAMOS — and the pattern worth copying

**KAAMOS did not bridge Cardano state. That is the finding.**

`fairway-global/kaamos-otc` ("Kaamos Midnight-Cardano OTC", live preprod demo at kaamos.fairway.global, 71 commits) implements **hash-time-locked contracts independently on each chain**, coordinated off-chain. The Midnight side (`htlc.compact`) is a pure escrow over native unshielded tokens:

> "Generic hash-time-lock contract (HTLC) for native Midnight unshielded tokens. Acts as a pure escrow — it pulls coins of an arbitrary `color` in via `receiveUnshielded`, holds them under a hash lock, and pushes them out via `sendUnshielded`…"

Cross-chain linkage is the **preimage reveal**, stored deliberately for the counterparty to read:

> `export ledger revealedPreimages: Map<Bytes<32>, Bytes<32>>;` — "Preimages revealed by a successful withdraw — lets the counterparty on another chain discover the preimage by reading contract state."

**Copyable? Yes — and it is the single most useful pattern in this report.** It achieves cross-chain atomicity *without any state proof, any Merkle verification, any Keccak, and any Blake2b.* It sidesteps everything that blocks Part C. It also ships an OpenZeppelin-style `FungibleToken.compact` vendored under `contract/src/vendor/openzeppelin/`.

Its limitation is honest: HTLCs give you **atomic swap**, not **continuous collateral observation**. You can prove "collateral was locked and I hold the preimage"; you cannot prove "collateral is *still* locked and worth $X right now." For a loan with ongoing liquidation risk, that gap is the whole problem.

KAAMOS also documents the same authentication gap: *"Authentication uses `ZswapCoinPublicKey` (`ownPublicKey().bytes`), separate from the `UserAddress` used for payout, because **Compact exposes no primitive to derive one from the other inside a circuit**."*

---

## Part F — The idea's hard mechanics

### F22. Two liquidation mechanisms with a hidden threshold

**Mechanism A — Borrower-submitted periodic health proofs with bonded default.**

Borrower posts a bond at origination and must submit a ZK health proof every epoch before a deadline. Proof shows `collateral × price ≥ principal × threshold` without revealing any term. Miss the deadline → anyone calls `flagDefault` → bond slashes, collateral claim opens.

I built and measured exactly this on the live toolchain (contract in `research/experiments/compact-limits/lending31.compact`): `openLoan` 1,071 rows, `proveHealthy` 1,340 rows, `flagDefault` 373 rows. Total keygen 3.2 s, 1.3 MB of keys. **This works today.**

- **Leaks:** proof *timing and existence* (an epoch-aligned heartbeat); the *fact* of a missed proof; anything you disclose to make the proof checkable (the price attestation timestamp, at minimum). Over many epochs, the pattern of "proved early vs. proved at the last second" is a side channel on how close to the threshold the borrower is.
- **Griefable:** the borrower can always prove healthy right up until they can't — there is no early warning, so the lender learns of distress only at default. A borrower near the edge can also strategically time proofs around favourable oracle ticks.
- **Offline borrower:** they default even if perfectly solvent. This is the mechanism's core defect. Mitigations (delegated prover, longer epochs) trade liveness against staleness, and a delegated prover must hold the private terms — which re-centralises the secret.

**Mechanism B — Keeper with a threshold-scoped capability.**

Borrower encrypts a *derived* predicate key to a keeper: enough to evaluate "is HF < T?" against an oracle price, not enough to recover T or the amounts. Keeper submits a liquidation proof when the predicate fires.

- **Leaks:** substantially more. A keeper that can evaluate the predicate at *any* price can binary-search T by querying at many prices offline. Unless the capability is bound to a *signed, current* oracle price, T falls in ~20 queries. Binding it to signed prices reduces but does not eliminate this (the keeper accumulates one bit per real price tick).
- **Griefable:** keeper censorship (declines to liquidate, colludes with borrower); or keeper front-runs a liquidation it alone can see.
- **Offline borrower:** handled well — this is Mechanism B's one clear advantage over A.

**Honest assessment:** A is buildable today and I proved it. B leaks the threshold to a determined keeper and I would not claim otherwise on stage. A hybrid — A as the normal path, B as a liveness fallback with a *coarsened* threshold (keeper learns only a band, as `midnight-health-factor-proof` does) — is the defensible design, and it is what I would build.

**Time-locked forced reveal** (third option, mentioned for completeness): on default, a commitment to the terms opens publicly after a delay. `blockTimeGte`/`blockTimeLt` are available on the live toolchain (verified), so this is cheap. It leaks everything on default, which may actually be acceptable — default is when privacy matters least and auditability matters most.

### F23. Price feeds — what actually exists

**There is no oracle on Midnight.** Verified in B10: no oracle module in the SDK, no contract-readable external state. Your options, all of which I can support with what I measured:

1. **Signed price attestation as a witness, verified in-circuit.** An oracle signs `(price, timestamp, asset)`; the borrower passes signature + pubkey as witnesses; the circuit verifies. **This is what the official `example-zkloan` does** — registered providers' `JubjubPoint` keys in a ledger `Map`, Schnorr-verified inside `evaluateApplicant`. On 0.31.1 you must vendor their Schnorr polyfill (`jubjubSchnorrVerify` is unbound there); on 0.34.0 it is a stdlib call. **The oracle learns nothing about the position** — it signs a public price, broadcast to everyone. This cleanly solves the question you asked.
2. **On-ledger price posted by a permissioned updater.** Simplest, fully public price, zero oracle privacy issue. Weakest trust story.
3. **secp256k1 ECDSA-signed prices** (Chainlink-compatible, reusing existing Ethereum oracle signatures): possible — I compiled it — but **0.34.0-only, ~28,911 rows**, undeployable.

**Recommendation: option 1.** The oracle signs a public price and never sees the position, so the privacy question dissolves. Cost is ~355 rows per Jubjub `ecMul`, i.e. negligible.

### F24. Lender privacy and capital — **Midnight has real shielded tokens**

| Claim | Verdict | Evidence | Confidence |
|---|---|---|---|
| Midnight has a native shielded fungible token standard | **VERIFIED** | Compact stdlib exposes `mintShieldedToken`, `sendShielded`, `receiveShielded`, `sendImmediateShielded`, `mergeCoin`, `mergeCoinImmediate`, `coinCommitment`, `coinNullifier`, `evolveNonce`, `tokenType`, `nativeToken`, `shieldedBurnAddress`, types `ShieldedCoinInfo` / `QualifiedShieldedCoinInfo` / `ZswapCoinPublicKey`. **All present on 0.31.1** (verified by probe) | High |
| Unshielded tokens also available | **VERIFIED** | `mintUnshieldedToken`, `sendUnshielded`, `receiveUnshielded`, `unshieldedBalance{,Lt,Gte,Gt,Lte}` — all on 0.31.1 | High |
| Third-party assets exist on Midnight | **VERIFIED** | KAAMOS runs USDC on Midnight preprod | High |

**This is the strongest technical fact in favour of the project.** Lender capital can be a Zswap shielded token: the lender's identity and amount are hidden by the shielded pool itself (commitment/nullifier), not by anything you have to invent. Repayment is `sendShielded` to a coin public key the lender provided at origination. A `FungibleToken.compact` implementation already exists, vendored in KAAMOS.

Caveat, and it is a real one: `ownPublicKey()` is **not** an authenticated identity (per Midnight's own warning in E20). Lender authorisation must be a **secret-derived key** proven in-circuit — the `deriveUserPublicKey(sk, pin)` pattern from `example-zkloan` — not `ownPublicKey()`.

### F25. The leak test — implemented and run against real deployed state

I implemented it (`leaktest.py`) and ran it against **11,586 bytes of genuine Preprod contract state** pulled live from the indexer (see D16). It scans for every plausible encoding — u8/u16/u32/u64/u128/u256 in both endiannesses, minimal-width BE/LE, and decimal ASCII — with **positive controls for values known to be public**.

```
state: 11586 bytes   header=b'midnight:contract-state[v6'

=== POSITIVE CONTROLS (public; scanner MUST find them) ===
OK windowStart (public param)    value=20635   -> FOUND  u16be @byte 9668: 509b
OK windowEnd   (public param)    value=20819   -> FOUND  u16le @byte  289: 5351
OK tagAuthority.x (public key)   value=4881...101 -> FOUND u256le @byte 193
OK tagAuthority.y (public key)   value=2621...475 -> FOUND u256le @byte 227

=== NEGATIVE CONTROLS (private-by-design; must NOT appear) ===
!! value=1     -> FOUND (u16be @727, u16le @186, u32be @2699)
!! value=2     -> FOUND
!! value=3     -> FOUND
OK value=42        -> absent
OK value=1000      -> absent
!! value=5000  -> FOUND (u16be @2975: 1388)
OK value=10000     -> absent
OK value=12345     -> absent
OK value=100000    -> absent
OK value=250000    -> absent
OK value=1000000   -> absent
```

**Two conclusions, and the second is the important one.**

1. The scanner is sound — all four positive controls were found at plausible offsets, including both 256-bit public key coordinates.
2. **The method has a false-positive floor.** Small integers (1, 2, 3, 5000) appear by chance in structural bytes — lengths, map sizes, counters, type tags. A byte-scan can therefore only prove absence for **high-entropy** values.

**The design consequence for your contract:** if `principal = 5000`, a byte-scan cannot tell you whether it leaked. So the leak test must run against **blinded** values — commit to `(value ‖ 32-byte random nonce)` and scan for the nonce and the commitment — or against deliberately high-entropy test values. `midnight-health-factor-proof` uses exactly this style of test (its `candidateEncodings` helper covers BE/LE and zero-padded forms); my addition is the positive control and the explicit false-positive floor.

Run it yourself: `python3 leaktest.py` from the validation directory.

### F26. Threat model

| Party | Learns | Undermines "the loan is private"? |
|---|---|---|
| **Borrower** | Everything (holds all witnesses) | No — by construction |
| **Lender** | Whatever you disclose to them; with shielded coins, their own position only | No, if scoped disclosure is client-side encryption |
| **Keeper** | Under Mechanism B, can binary-search the threshold across price queries | **YES — this is the sharpest leak.** Mitigate by binding capabilities to signed current prices and disclosing only a band |
| **Oracle** | Nothing about any position — it signs a public price broadcast to all | No. This is a genuine strength |
| **Indexer operator** | Full public ledger state, **plus transaction timing, ordering, and IP-level correlation** of who submitted which proof and when | **YES, partially.** Contract state is private, but the *metadata* — this address proved health at this block, every epoch — is fully visible. Linkability over time is real |
| **RPC node** | Same as indexer, plus submission-time network metadata | **YES, partially** — same class of leak |
| **Proof server** | **If self-hosted: nothing leaves your machine. If shared/hosted: it sees every witness in the clear** | **YES, catastrophically, if hosted.** The proof server receives private inputs to build the proof |
| **Any chain observer** | Public ledger: commitments, nullifiers, counters, bands, proof cadence | Bounded — but cadence and band histograms are a real side channel |

**Three things that genuinely undermine the privacy claim, stated plainly:**

1. **The proof server sees all witnesses.** Every demo must self-host it. Any hosted-prover convenience silently destroys the privacy story. This deserves a slide.
2. **`ownPublicKey()` is not authenticated** — Midnight's own example says assertions on it are "bypassable." Identity must be secret-derived and proven.
3. **Timing and linkability survive ZK.** A per-epoch heartbeat from a stable pseudonym is a durable fingerprint. `midnight-health-factor-proof` addresses this with PIN-rotatable pseudonyms; `example-zkloan` ships `changePin` with loan migration. You would need the same.

---

## Part G — Verdict

### G27. Ratings

| Dimension | Score | Justification |
|---|:---:|---|
| **Technically buildable end-to-end today** | **2 / 5** | The Midnight half is a 4–5 (I compiled it: 1,340 rows, 3.2 s, all on the live toolchain). The **cross-chain half is a 1** — Ethereum verification is undeployable on every live network; Cardano verification is structurally impossible. As specified, end-to-end does not exist. |
| **Genuinely uses Midnight-specific privacy** | **4 / 5** | Strong. Witnessed private state, compiler-enforced `disclose()` with taint tracking, native shielded tokens, cheap native Merkle membership. A hidden liquidation threshold is a real ZK use case, not a bolt-on. Docked one point because the RFS-listed version is well-trodden and the *differentiating* part is the blocked part. |
| **Robustness to "why not just do this on chain X"** | **3 / 5** | Good answer available: no other chain gives you a *compiler* that statically proves your threshold never reaches public state, plus shielded value transfer in the same contract. Weakened because your headline — public collateral on Cardano/Ethereum — invites exactly "so why not do the loan on Ethereum with a ZK coprocessor?", and today you cannot demo the Midnight-side verification that would answer it. |
| **Risk of duplicating existing work** | **2 / 5** (2 = quite duplicative) | `midnight-health-factor-proof` (same Wave, deployed, 16 tests) covers the private-threshold health-proof core. `midnightntwrk/example-zkloan` is the *official* ZK-loan reference. Plus kymider, freeboard, datum, amana, onepledge, ProofLend, Creva-ZK, VeriSolv. The unique slice is cross-chain — which is blocked. |

### G28. Three ways this fails, and the cheapest experiment for each

**1. You build the cross-chain proof and cannot deploy or demo it.** (Most likely, highest impact.)
*Cheapest de-risking experiment — 30 minutes, and it is already done:* the symbol matrix in B5. `secp256k1EcdsaVerify` is unbound on 0.31.1. **This failure mode is already confirmed, not hypothetical.** The only remaining check is whether Preprod will accept a ledger-9 contract before Nov 27 — ask directly in Midnight Discord (#buildathon) and get it in writing.

**2. A judge scores you against `example-zkloan` and `midnight-health-factor-proof` and finds nothing new.** Engineering & Implementation is 40% of the score.
*Cheapest experiment — 1 hour:* clone both (already done, in `priorart/`), write down the three circuits you would ship that neither has, and show them to someone in Discord. If you cannot name three, reshape before writing code.

**3. The privacy claim does not survive scrutiny — hosted proof server, `ownPublicKey()` auth, or timing correlation.**
*Cheapest experiment — 2 hours:* run `leaktest.py` against your own deployed state with **high-entropy** test values (not 5000 — see F25), and add one slide naming the proof-server trust boundary. This converts your weakest point into a credibility win, which is exactly what a skeptical judge rewards.

### G29. The minimal reshaping I would actually recommend

**Keep:** private loan terms, private liquidation threshold, banded health proofs, scoped disclosure to lender/auditor, shielded lender capital.
**Drop:** in-circuit verification of Cardano or Ethereum state. It is blocked in one direction and impossible in the other, and it is the only part that cannot be demoed.
**Replace it with the KAAMOS pattern:** collateral is locked on the external chain under an **HTLC**, and what enters the Midnight circuit is the **preimage/receipt**, not a state proof. You keep a genuine cross-chain story ("collateral is locked on Cardano, terms are private on Midnight"), you keep atomicity, and you need no Keccak, no Blake2b, no MPT, no ZKIR v3 — it runs on 0.31.1 on Preprod today. KAAMOS proved the pattern works on preprod with real assets.

Be explicit in the README about what the receipt does and does not prove: it proves collateral *was* locked, not that it is *still* locked at current value. Name that limitation before a judge does — and note that the honest fix (protocol-level Cardano observation) is on Midnight's own roadmap via MIP #20.

**On timing.** Wave 1 ends in ~2 days against 41 existing submissions with proportional payout. Wave 2 (Sep 27 – Oct 17, $4,000) is the rational target: full 20-day build window, a larger pool, and the rules explicitly reward projects that "demonstrate meaningful new progress" across Waves. If you want something in Wave 1, submit the smallest honest thing that compiles — the rules' only hard gate is one compiling Compact contract — and treat it as the baseline you visibly improve on in Waves 2 and 3, which is precisely what this program is designed to reward.

---

## Appendix — Reproduction

```
validation/
├── VALIDATION_REPORT.md      this file
├── leaktest.py               Part F25 leak scanner (runnable)
├── compact-installer.sh      compact CLI 0.5.2 installer
├── raw/
│   ├── wavehack.json         full Akindo program data (23,660 B)
│   ├── products.json         Wave 1 submission list
│   ├── rules.pdf             Official Rules, 8pp, sha256 3400b47a…
│   ├── rubric.txt            judging rubric (differs from page!)
│   ├── stdlib.compact        Compact standard library source
│   ├── llms.txt              Midnight docs index
│   ├── gh_topics.txt         439 repos tagged midnightntwrk
│   └── preprod_contract_state.hex   11,586 B live Preprod state
├── btests/                   all compile tests + measurements
│   ├── eth_verify.compact    Ethereum ECDSA + address (0.34 only)
│   ├── lending31.compact     private lending, runs on LIVE toolchain
│   ├── midsize.compact       item-18 circuit (23,048 rows)
│   ├── measure.sh            compile → mock-compile → row count
│   └── cal/, sym/, sh/       calibration + symbol probes
└── priorart/                 14 cloned repos
```

Key commands:
```bash
export PATH="$HOME/.local/bin:$PATH"
compact compile --feature-zkir-v3 --skip-zk eth_verify.compact out/
~/.compact/versions/0.34.0/aarch64-darwin/zkir-v3 mock-compile out/zkir/X.zkir
# → "Mock compiling circuit (k=16, rows=60164)"   ← the measurement tool
```

**What I could not verify, and exactly what is needed:**

| Item | Blocker | To verify |
|---|---|---|
| D15 local devnet | No Docker on this machine | Install Docker/colima; `npx @midnight-ntwrk/midnight-local-dev`; record `docker stats` |
| D16 my own deploy | Needs proof server (Docker) + funded wallet | Same, plus faucet at midnight-tmnight-preprod.nethermind.dev. **Use Node 22, not 24** |
| D18 real proving time | Needs proof server | `docker run -p 6300:6300 midnightntwrk/proof-server:8.1.0`; time a `submitCallTx` |
| A1 Official Rules text | PDF uses subset fonts | `pdftotext raw/rules.pdf -` (poppler), or open manually |
| A3 dual-submission legality | Not stated anywhere public | Read rules PDF; ask in Midnight Discord |
| C11 blake2b on a branch | GitHub code search needs auth | `gh auth login && gh search code blake2b --repo LFDT-Minokawa/compact` |
| C13 Aave slot layout | Not attempted (moot given C11) | `eth_getProof` against a pinned Aave V3 pool; count MPT nodes |
