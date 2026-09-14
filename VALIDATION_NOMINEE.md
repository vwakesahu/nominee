# Nominee — Validation Report

**Add a nominee to your crypto. Nobody learns who.** · nominee.world · built on Midnight

**Idea under test:** a private, self-executing will on Midnight. Shielded assets in a contract; will contents private on the owner's device; periodic ZK heartbeat; missed heartbeat → grace → heirs claim shares via Merkle membership + per-heir nullifiers; scoped probate disclosure; M-of-N guardians; conditional bequests; duress decoy.

**Method:** every capability claim below was compiled on **Compact toolchain 0.31.1** (language 0.23.0, ledger-8.0.2, runtime 0.16.0) — the version the support matrix lists for Preview, Preprod and Mainnet. Row counts come from `zkir mock-compile`. Leakage claims come from dataflow analysis of the generated ZKIR, not from reading docs. 0.34.0 was used only where noted for comparison.

**Date:** 2026-09-14 · **Machine:** macOS 26.5.2, arm64, 11 cores, 18 GB RAM
**Artifacts:** `nominee/` (contracts + measurements), `priorart/` (19 cloned repos), `raw/gh_all.txt` (all 439 Midnight-topic repos)

---

## Verdict up front

**Nominee is materially more buildable than the lending idea, and materially more novel.**

- The whole six-circuit contract **compiles on the live toolchain**, every circuit fits **k ≤ 15**, total **55,137 rows**, **27.7 s** to generate all proving keys, **23 MB** of keys. It is laptop-scale.
- **Nothing like it exists on Midnight.** I searched all 439 `midnightntwrk`-topic repos, both Devpost galleries, and `midnight-awesome-dapps`: **zero** inheritance, will, estate, dead-man's-switch, or succession projects.
- **A shielded send does not reveal the amount.** I proved this by tracing the ZKIR: no private input variable is ever declared public; the share flows only into the coin commitment.

**The one thing that could kill it** is unresolved and not resolvable without deploying: another Buildathon project (`privoice`) has a careful six-attempt experiment showing that a contract call performing **`receiveUnshielded`** is rejected by the node with `Custom(192)`. Their test is *unshielded only*. Nominee needs **shielded** custody, which is a different code path — but nobody has published a test of it, and I cannot run one without Docker.

---

## PART A — Prior art

### A1. Midnight ecosystem — nothing exists

I re-fetched the complete topic listing (my earlier file held only 266 of 439 rows) and searched the full set.

| Search | Verdict | Evidence | Confidence |
|---|---|---|---|
| Any inheritance/will/estate/succession project on Midnight | **NONE FOUND** | `grep -iE 'inherit\|\bwill\b\|estate\|legacy\|succession\|dead.?man\|testament\|heir\|probate\|bequest\|posthum'` over all 439 repos → only false positives (the word "will" in prose) | High |
| Any dead-man's-switch / heartbeat project | **NONE FOUND** | same grep, `heartbeat\|dead.?switch` → zero | High |
| Devpost Midnight Hackathon (2026, 24 projects) | **NONE** | Gallery reviewed project-by-project; flagged: none | High |
| Devpost Midnight August 2026 (24 projects) | **NONE** | Reviewed in prior report; no inheritance entries | High |
| `midnightntwrk/midnight-awesome-dapps` | **NONE** | `grep -icE 'inherit\|will\|estate\|dead.?man\|legacy\|succession\|heartbeat'` → **0** | High |

**Adjacent work that exists (useful, not competing):**

| Repo | What it actually is | Relevance |
|---|---|---|
| `kuiralabs/kuira-vault-android` | "M-of-N multisig confidential treasury on Midnight — deposit, propose, approve, execute" | Closest primitive overlap: M-of-N approval flow. **Not** inheritance — no dead-man trigger, no heirs, no time condition |
| `DpacJones/selkie-usdm-escrow` | "Whoever proves knowledge of the secret takes the funds" | Hash-lock claim pattern, single claimant, no beneficiary set |
| `sevryn-labs/midnight-escrow` | Privacy-preserving escrow | Generic escrow |
| `bochaco/dmarket` | Three-party escrow with asymmetric encryption + ZK | Closest to the **envelope** pattern (client-side asymmetric encryption) |
| `fairway-global/kaamos-otc` | HTLC escrow, `receiveUnshielded`/`sendUnshielded` | The custody pattern — see B4 |
| `tomiin/privoice` | Private invoices; **contains the contract-custody rejection experiment** | **The single most important prior art for this idea** — see B4 |

### A2. Outside Midnight — the privacy gap is real and specific

| Product | Mechanism | What is PUBLIC | What is PRIVATE | Trust assumption |
|---|---|---|---|---|
| **Sarcophagus** (Ethereum + Arweave) | Dead-man switch; encrypted payload on Arweave; "archaeologists" hold key shards and are paid to re-encrypt | **The sarcophagus exists, the recipient address, the resurrection time, the archaeologist set, every check-in** | Only the encrypted payload contents | Archaeologist quorum stays honest & online; economic bonding |
| **Inheriti** (Safe Haven) | Shamir secret sharing across hardware "SafeKey" devices; off-chain | Registration/plan existence | Shares individually reveal nothing | Physical custody of devices; company liveness |
| **Casa Covenant / Casa Inheritance** | Multisig with a key held by a trusted party + legal process; no KYC, recipient email only | Nothing distinctive on-chain (multisig config not visible) | Beneficiary identity (held by Casa) | **Casa as a company** — custodial-adjacent, legal process |
| **Bitcoin timelock / miniscript wills** (e.g. Nunchuk) | `OP_CHECKSEQUENCEVERIFY`/`CLTV` spending path to heir keys | At spend time: **the entire script policy, the timelock, and the heir's pubkey** | Policy hidden until spent (taproot helps) | Trustless, but disclosure at execution is total |
| **maxcomperatore/deadhand** | Shamir shares for Bitcoin inheritance, off-chain | — | Shares | Off-chain coordination |
| **Killswitch / Cipherwill** | Web2 check-in service, emails encrypted docs to recipients | Nothing on-chain | Everything (but held by the service) | **The service is fully trusted** and must survive you |

**Aleo / Aztec:** I searched specifically for ZK inheritance demos on Aleo or Aztec and **found none**. (Verdict: UNVERIFIABLE-negative — absence of search results is weak evidence. To verify: enumerate the Aleo program registry and Aztec's `noir` example repos directly.) Confidence: Low-Medium.

**The specific gap Nominee closes:** in *every* trustless on-chain design above, **the beneficiary is revealed** — either at setup (Sarcophagus publishes the recipient address) or at execution (a Bitcoin timelock reveals the heir's key when spent). In every design that hides the beneficiary (Casa, Killswitch, Inheriti), **a company is trusted** and the execution is not on-chain.

Nominee is the first design where the beneficiary set, the per-heir shares, and the conditions are **never public — not at setup, not at execution** — while execution remains trustless and on-chain. An observer sees only: a vault exists, a heartbeat stopped, and N anonymous nullifiers were spent. That is a genuine, defensible novelty claim.

### A3. Novelty verdict

| Claim | Verdict | Confidence |
|---|---|---|
| "Private self-executing will with selective probate disclosure" has been shipped on Midnight | **FALSE — nothing exists** | High (exhaustive search of 439 repos + 2 galleries + awesome list) |
| It has been shipped anywhere, trustlessly, with a hidden beneficiary set | **FALSE, as far as I can establish** | Medium-High (surveyed the six best-known products; all reveal the beneficiary or trust a company) |
| The *components* are novel | **FALSE** | High — dead-man switches, Merkle-set membership, nullifiers and shielded pools are all standard. The **combination** is what is new |

**Honest framing for a judge:** do not claim you invented the dead man's switch. Claim you are the first to make one where *nobody learns who inherits*.

---

## PART B — Core mechanics, compiled on 0.31.1

All row counts from `zkir mock-compile`. Sources are in `nominee/src/` and `nominee/nominee.compact`.

### B4. 🔴 Shielded custody — **it compiles**, but node acceptance is unproven

This was the load-bearing question. Answer: **a contract can receive a shielded coin, hold it in ledger state, and later send it to a different party's coin public key.** It compiles cleanly on 0.31.1.

```compact
export ledger held: ShieldedCoinInfo;
export ledger funded: Boolean;

export circuit deposit(coin: ShieldedCoinInfo): [] {
  receiveShielded(disclose(coin));
  held = disclose(coin);
  funded = true;
}

// Claimant supplies the qualification (Merkle index) discovered off-chain.
export circuit claim(qual: QualifiedShieldedCoinInfo, heirKey: ZswapCoinPublicKey, amount: Uint<128>): [] {
  assert(funded, "not funded");
  sendShielded(disclose(qual), left<ZswapCoinPublicKey, ContractAddress>(disclose(heirKey)), disclose(amount));
}
```
```
  claim                        k=15  rows=19572
  deposit                      k=13  rows=6536
```

**Type facts, read from `contract-info.json` (authoritative, compiler-generated):**

| Type | Fields |
|---|---|
| `ShieldedCoinInfo` | `nonce: Bytes<32>`, `color: Bytes<32>`, `value: Uint<128>` |
| `QualifiedShieldedCoinInfo` | the above **plus `mt_index: Uint<64>`** |

**The design consequence of `mt_index`.** A `QualifiedShieldedCoinInfo` *can* be stored in ledger state — I compiled it, **796 rows, k=10** — but **the `mt_index` is not knowable at deposit time**, because it is the coin commitment's position in the global Zswap tree, fixed only once the deposit transaction is mined. So the contract stores the *unqualified* `ShieldedCoinInfo` and the **claimant supplies the qualification at spend time**, discovered off-chain from the indexer. This is exactly how a Zswap contract wallet must work, and it is why `claim` costs 19.5k rows while `deposit` costs 6.5k.

**🔴 The unresolved risk — `Custom(192)`.**

| Claim | Verdict | Evidence | Confidence |
|---|---|---|---|
| A contract call doing `receiveUnshielded` is rejected on Preview | **VERIFIED (by a third party, carefully)** | `priorart/privoice/SERVICEDESK-192.md`: control circuit `bump()` (ledger write only, k=7, rows=90) **ACCEPTED**; `deposit()` (same contract, + `receiveUnshielded`, k=9, rows=498) **REJECTED, `Custom(192)`**, six independent rebuilt attempts. `192` = `Transaction(Malformed(InputsSignaturesLengthMismatch))` per `midnight-node/ledger/src/versions/common/types.rs`. Control contract `c755041b16edcde0…` | High |
| The same rejection applies to **shielded** custody | **UNVERIFIABLE** | privoice tested only unshielded. No published shielded test exists | — |

**Two reasons to think shielded may behave differently, and one reason to worry:**

- The error is `InputsSignaturesLengthMismatch`. privoice's own README states: *"Unshielded inputs each require a signature… Omitting that is one way to reach `Custom(192) InputsSignaturesLengthMismatch`."* **Shielded (Zswap) inputs are authorised by ZK proof and nullifier, not by per-input signatures** — so this specific error class may simply not arise. Their draft also notes it is "possibly related to servicedesk #117."
- Compact 0.34.0's release notes add "Shielded (Zswap) coin operations by cross-contract callees," which reads as shielded contract custody being a supported, actively-developed path.
- **The worry:** `kaamos-otc` builds an HTLC on `receiveUnshielded`/`sendUnshielded` and advertises a live preprod demo — yet its only recorded state file is `htlc-ft-cli/swap-state.**undeployed**.json`, and I found **no preprod transaction hashes** for an HTLC deposit in the repo. That is consistent with privoice: the custody path may never have executed on a public network.

**This is the single cheapest and most important experiment to run before committing** — see E25.

### B4a. Shield / unshield, and what a shielded send reveals

| Question | Answer | Evidence | Confidence |
|---|---|---|---|
| Is there a native **shield/unshield conversion** for NIGHT at ledger or wallet-SDK level on 0.31.1? | **No such operation found.** The SDK has *separate* `@midnight-ntwrk/wallet-sdk-shielded` (3.0.1) and `-unshielded-wallet` (3.1.0) packages and `shieldedToken()`/`unshieldedToken()` type helpers, but **no conversion primitive**. NIGHT is documented unshielded; DUST is shielded but **non-transferable and generated, not converted** | `npm view`; `raw/llms.txt` lines 398/469/475/531/548 | Medium-High (absence of evidence in the docs index) |
| Can a contract **mint its own shielded token**? | **YES — compiles, 10,154 rows, k=14.** `mintShieldedToken(domain_sep, value, nonce, recipient)`; color is deterministically `tokenType(domain_sep, contractAddress)` | `nominee/src/a4_mint.compact` | High (compile) |
| Is `nativeToken()` usable as a shielded coin color? | **Compiles (6,258 rows, k=13).** `nativeToken()` is `pad(32,"")` — 32 zero bytes | `nominee/src/a4_native.compact` | Medium — compiles, but whether a user can *acquire* native shielded coins on Preprod today is **unverified** |
| What is KAAMOS's "USDC on Midnight preprod"? | **UNSHIELDED, and self-minted.** Their `usdc.compact` header: *"USD Coin (USDC) — **native unshielded token** on Midnight. Mints native Zswap unshielded coins (via `mintUnshieldedToken`)."* It is their own test token, not bridged USDC | `priorart/kaamos-otc/contract/src/usdc.compact` | High |
| Does a shielded send **reveal the amount** on-chain? | **NO.** See below | ZKIR dataflow | High |
| Is the **token type (color)** hidden? | **Yes — the color is inside the commitment**, not declared public. `color` (private vars 6,7) feeds only `persistent_hash` (the nullifier and commitment), never `declare_pub_input` | ZKIR dataflow | Medium-High |

**Proof that the amount is hidden.** I compiled a claim where the share is a **witness**, then reconstructed the ZKIR variable numbering and cross-referenced private inputs against public declarations:

```
private_input vars      : [3, 4, 5, 6, 7, 8, 9]
declare_pub_input vars  : [2, 10, 11, 12, ... 65]
PRIVATE VARS DIRECTLY DECLARED PUBLIC: NONE

var 3 (the share, 128 bits): constrain_bits@4, persistent_hash@73   ← commitment only
var 8 (input coin value)   : constrain_bits@14, persistent_hash@38  ← nullifier only
```

The share is range-checked and hashed into the Zswap coin commitment. It never reaches the public transcript. This is corroborated by the stdlib source: `sendShielded` calls `createZswapOutput(output, recipient)` and publishes `coinCommitment(output, recipient)`.

**⚠️ But note the asymmetry:** circuit **arguments are public**. In my first version `amount` was an argument and *was* public. Moving it to a witness fixed it (19,572 → 19,509 rows). **Any value you want private must be a witness, never a circuit argument.** This is an easy and fatal mistake to make.

### B5. Heartbeat — 4,507 rows, leaks nothing

```compact
export circuit heartbeat(now: Uint<64>): [] {
  assert(willCommit == disclose(ownerCommit(ownerSecret(), willContents())), "not owner");
  assert(blockTimeGte(disclose(now)), "timestamp in future");
  lastSeen = disclose(now);
}
```
```
  heartbeat                    k=13  rows=4507
```
ZKIR dataflow check: **`LEAKED: NONE`** — the owner secret and will contents never reach the public transcript. Only the commitment equality and the timestamp are public.

**blockTime semantics — determined empirically, since the docs page lists the functions with no description.**

| Question | Answer | Evidence | Confidence |
|---|---|---|---|
| Is the comparison done **in-circuit**? | **No.** The `resolve` circuit using `blockTimeGte` compiles to **165 rows with zero comparison instructions** — only `declare_pub_input`/`pi_skip`. There is no `less_than` op | `out/b6_perm/zkir/resolve.zkir`, full instruction dump | High |
| Who enforces it? | **The ledger/node at transaction validation.** The bound is emitted into the public transcript for the node to check | same | High |
| **Can a prover lie about the time?** | **No.** Because it is not a circuit constraint at all — the node rejects the transaction if the bound does not hold against real block time | same | High |
| Who supplies the value? | **The caller**, as a public circuit argument. Generated TS: `resolve(context, deadline_0: bigint)` | `out/b6_perm/contract/index.d.ts` | High |
| Units — seconds or milliseconds? | **UNVERIFIED.** The type is `Uint<64>`. The Preprod indexer reports block `timestamp: 1789372404000` (13 digits = **milliseconds**), which suggests ms, but I did not confirm what `blockTime*` expects | indexer query | **Low — verify before building** |

That last row matters: getting the unit wrong turns a 30-day grace period into a 30-second one, or an unreachable one. **To verify:** deploy the 165-row `resolve` circuit locally and bisect the accepted bound.

### B6. Resolution — 165 rows, permissionless by default

```
  resolve                      k=8   rows=165
```
**Who can call it?** As written, **anyone** — and that is correct. The circuit asserts only `deadline == lastSeen + grace` and `blockTimeGte(deadline)`. There is no caller identity, so no one can censor resolution by refusing to act. Restricting it to heirs would cost a Merkle membership proof (~6 k rows, per the depth table in the prior report) and would introduce a liveness risk if every heir is unreachable. **Recommendation: keep it permissionless.** It reveals nothing that the grace-period expiry does not already reveal.

### B7. Heir claim — 32,271 rows, share stays private

```compact
export circuit claim(heirKey: ZswapCoinPublicKey): [] {
  assert(resolved, "vault not resolved");
  const sk    = heirSecret();
  const share = heirShare();
  const leaf  = persistentHash<Vector<2, Bytes<32>>>([sk, persistentHash<Uint<128>>(share)]);
  assert(beneficiaries.checkRoot(disclose(merkleTreePathRoot<16, Bytes<32>>(heirPath(leaf)))), "not a beneficiary");
  const nf = persistentHash<Vector<2, Bytes<32>>>([pad(32, "nominee:nf:v1"), sk]);
  assert(!spent.member(disclose(nf)), "already claimed");
  spent.insert(disclose(nf));
  sendShielded(disclose(spendCoin()), left<ZswapCoinPublicKey, ContractAddress>(disclose(heirKey)), disclose(share));
}
```

| Merkle depth | rows | k |
|---|---:|---:|
| 8 (256 heirs) | **32,023** | 15 |
| 16 (65,536 heirs) | **32,271** | 15 |

Depth is nearly free (~31 rows/level — consistent with the ~25 rows/level measured in the prior report). **Use depth 16 and never think about it again.**

Binding the share *into the leaf* (`leaf = H(sk, H(share))`) is what makes shares unforgeable: an heir cannot claim more than the will allotted, because a different share yields a different leaf which is not in the tree.

### B8. Update the will — 8,580 rows, leaks only "something changed"

```
  updateWill                   k=14  rows=8580
```
Old and new contents both stay private (both are witnesses; only commitments are written). **What does leak: that an update occurred, and when.** A `Counter` version bump makes this explicit.

**Is that acceptable?** Yes, and arguably desirable — "the will was amended on date X" is exactly what probate law wants to establish, and it is what a paper codicil also reveals. It does leak a behavioural signal (an owner who rewrites the will often), which a sophisticated observer could correlate with life events.

**⚠️ Implementation constraint discovered:** you **cannot assign a new root** to a `MerkleTree` ledger field. I had to use `beneficiaries.resetToDefault()` and re-insert. Keeping the root as a plain `Bytes<32>` field and verifying paths manually against it is the cleaner pattern if you need atomic root replacement. *(Confidence: Medium — established by compiler rejection during development, not by exhaustive API review.)*

### B9. Scoped probate disclosure — 10,715 rows for the provable part

**There is no in-circuit encryption on 0.31.1** (consistent with MatchLock's approach, confirmed in the prior report: no viewing-key primitive exists). So encryption to the court's public key happens **client-side**. What *is* provable in-circuit is the binding:

```compact
export circuit openProbate(): [] {
  const v = totalValue(); const ex = executorId(); const b = blinding();
  const c = persistentHash<Vector<3, Bytes<32>>>([persistentHash<Uint<128>>(v), ex, b]);
  assert(vaultCommit == disclose(c), "values do not match the vault commitment");
  const ec = persistentHash<Vector<2, Bytes<32>>>([ciphertext(), c]);
  envelopeCommit = disclose(ec);  probateOpened = true;
}
```
```
  openProbate                  k=14  rows=10715
```

| Property | Provable in-circuit? |
|---|---|
| The disclosed `(totalValue, executorId)` match what the vault committed to | **YES** — this is the 10,715 rows |
| The ciphertext is bound to those same values | **YES** (via `envelopeCommit`) |
| The ciphertext **actually decrypts** to them under the court's key | **NO — must be trusted / checked out-of-band by the court** |
| The court cannot decrypt anything else | **NO — a client-side property** |

Honest framing: the contract proves *the executor did not lie about the totals*. It does not prove the envelope is well-formed. A court that can decrypt and compare against `vaultCommit` closes the loop off-chain.

### B10. M-of-N guardians — cheap

Using the `example-zkloan` Schnorr polyfill (required: `jubjubSchnorrVerify` is unbound on 0.31.1).

| Threshold | rows | k |
|---|---:|---:|
| 2-of-3 | **3,078** | 12 |
| 3-of-5 | **4,598** | 13 |

≈ **1,520 rows per Schnorr verification.** Strictly-increasing guardian IDs prevent one guardian signing twice. This is the cheapest meaningful feature in the whole design — ship it.

### B11. ⚠️ Conditional bequest — **the private unlock date leaks**

```
  claimAfter                   k=14  rows=8707
```

The user asked specifically whether the `disclose()` analysis forces the date public. **It does.** ZKIR dataflow:

```
LEAKED (private var declared public): [3]
  var 3 bits=[64] uses=['constrain_bits@6', 'persistent_hash@7', 'declare_pub_input@114']
```

`blockTimeGte(disclose(d))` publishes `d` into the transcript, because the **ledger** enforces the bound (B5) and therefore must see it. **A private unlock date is not achievable by gating on `blockTime*` directly.**

**Workarounds, in order of preference:**
1. **Coarsen it.** Gate on a public epoch bucket (e.g. quarter) while the exact date stays in the private will. Leaks ~90 days of resolution instead of the exact day.
2. **Pre-commit the date in the leaf** (as I did) so it cannot be forged, and accept that claiming reveals it. Since the heir only claims *after* the date, revealing it at that moment leaks much less than revealing it at will-writing time.
3. Accept the leak. "This bequest unlocks on 2031-06-01" is arguably the least sensitive field in a will.

### B12. Duress / decoy will — works, does **not** leak which branch

```
  resolveUnderPin              k=13  rows=6715
```
ZKIR check: only **one** `assert` (on the OR result), with two independent `test_eq` pairs computed. The PIN, owner secret and will contents do **not** leak. The only leaked private inputs are vars 26,27 — the root being written, which is public by design.

```
[33] test_eq a=8 b=13   ← vs realCommit
[51] test_eq a=8 b=20   ← vs decoyCommit
[55] assert cond=25     ← the OR only
```

**Honest limit:** the circuit hides *which* will is active **at resolution time**. It does not hide it forever — once heirs claim, the payout pattern reveals whether the coercer got the decoy. Duress protection here buys you time and deniability at the moment of coercion, not permanent indistinguishability. Say that plainly rather than overclaiming.

### Realistic full contract — fits k ≤ 15 comfortably

`nominee/nominee.compact`, six circuits, compiled on 0.31.1:

| Circuit | rows | k | prover key |
|---|---:|---:|---:|
| `resolve` | 165 | 8 | 0.1 MB |
| `guardianResolve` (2-of-3) | 3,078 | 12 | 1.3 MB |
| `heartbeat` | 4,507 | 13 | 2.7 MB |
| `deposit` | 6,536 | 13 | 2.7 MB |
| `updateWill` | 8,580 | 14 | 5.0 MB |
| `claim` (depth 16) | 32,271 | **15** | 9.6 MB |
| **TOTAL** | **55,137** | **max k=15** | **23 MB** |

**Full keygen for all six circuits: 27.7 s wall.** For comparison, the prior report's single Ethereum-ECDSA circuit was 60,164 rows, k=16, 16.3 s, and **106 MB** for one circuit. Nominee's entire contract is a quarter the key size of that one circuit.

**Answer to "does it fit k ≤ 15": yes, with room.** k=15 is 32,768 rows; `claim` uses 32,271 — that is 98.5% full. Adding anything to `claim` pushes it to k=16 and doubles its key. If you need headroom, drop Merkle depth to 8 (32,023) or move the nullifier hash out.

---

## PART C — Threat model

### C13. Heartbeat linkability — the most serious privacy leak

| Party | Learns |
|---|---|
| Any chain observer | **A vault exists**; its deposit transaction; **a heartbeat every N days from this contract address**; when heartbeats stop; when resolution fires; how many nullifiers are spent |
| | **Roughly how big** — the deposit tx is linkable to the contract even if the amount is in a commitment; timing and fee patterns narrow it further |
| | **How diligent the owner is** — early vs last-minute heartbeats |

A per-contract heartbeat at fixed cadence is a **durable fingerprint**. It does not reveal *who* the owner is, but it reveals that *someone* has a vault, and stopping is a public death notice.

**Can heartbeats be mixed across users?** Yes — a **shared registry contract** where each owner proves Merkle membership in an owner set and writes a per-owner nullifier-style `lastSeen` slot, instead of one contract per will.

**Cost, measured:** a heartbeat with a depth-16 Merkle membership proof costs roughly `4,507 (current heartbeat) + ~6,245 (depth-16 membership, from the prior report's table) ≈ 10.8 k rows` — still k=14, still cheap. **This is a clear, affordable design win and I would build it this way from the start.** It converts "Alice's vault heartbeat" into "someone among N owners checked in."

Residual leak even when shared: the *count* of heartbeats per epoch, and the fact that a particular slot stopped.

### C14. Heir collusion

| Attack | Possible? | Mitigation |
|---|---|---|
| Heirs combine envelopes to learn the **total** | **YES** — if each envelope contains that heir's share and they pool them, they learn the sum of what they hold. They cannot learn shares of heirs who do not collude | Inherent to any split; acceptable |
| One heir learns **another's** share | **NO**, unless that heir shares their envelope. Leaves commit to `H(sk, H(share))` — opaque without `sk` | Sound |
| A single heir **claims before others** | **YES — and this is a real problem.** `claim` sends from a single `vaultCoin`; the first claimant gets `sendShielded` to run, and the change coin returns to the contract. If the contract's change-coin bookkeeping is wrong, a greedy heir could drain it | **Bind the share into the leaf** (done) so an heir cannot over-claim. Still requires careful change-coin handling — see below |
| An heir who is **also a guardian** triggers resolution early | **YES** — nothing prevents it | Require guardians to be disjoint from beneficiaries (enforceable only off-chain, since both sets are private), or require M ≥ 2 with strictly-increasing IDs (done), so a single heir-guardian cannot act alone |

**⚠️ The change-coin problem is the biggest unsolved mechanic.** `sendShielded` returns `ShieldedSendResult { change: Maybe<ShieldedCoinInfo>, sent: ShieldedCoinInfo }`. After heir 1 claims, the change coin has a **new nonce and a new `mt_index`** that the contract does not know. My `claim` circuit takes the spendable coin as a witness, which means **heir 2 must discover the current change coin off-chain**. That works, but it is fragile and it is where a real implementation will spend its time. *(Confidence: High that this is the hard part; I did not build the multi-claim sequence.)*

### C15. Owner loses their device — the design holds

| Claim | Verdict |
|---|---|
| The owner can no longer heartbeat or update the will | **TRUE** — their secret is gone |
| Heirs can **still** claim | **TRUE, and this is the point.** `claim` requires only `heirSecret`, `heirShare`, `heirPath`, and the coin qualification — **nothing from the owner's device** |
| Resolution still fires | **TRUE** — `resolve` is permissionless and depends only on `lastSeen + grace` vs block time |

**Confirmed by inspection of the circuit signatures:** `claim` witnesses are `heirSecret()`, `heirShare()`, `heirPath()`, `spendCoin()`. No owner-derived input. The design genuinely degrades in the right direction — losing the device *triggers* inheritance rather than destroying it.

The flip side, which must be said out loud: **a long hospital stay without a heartbeat executes the will.** The grace period and the guardian override are the only defences, and guardians are therefore not a stretch goal — they are a safety requirement.

### C16. Envelope delivery

| Option | Cost / risk |
|---|---|
| **On-chain in a `Map<Bytes<32>, Bytes<N>>` keyed by heir commitment** | Storage is cheap in rows but the ciphertext is **public forever**, so it must be encrypted to the heir's key and is then vulnerable to future cryptanalysis ("harvest now, decrypt later"). Also, **the number of heirs becomes public** — a real leak |
| **Off-chain (IPFS / email / handed over on paper)** | No on-chain leak, no heir count. **Liveness risk**: the heir must still have the envelope decades later. This is the same failure mode that kills real wills |
| **Hybrid — on-chain ciphertext, off-chain key** | Best of both: the blob survives, but is useless without a key the heir holds. Heir count still leaks |

**Recommendation: off-chain envelope, on-chain commitment.** Store `envelopeCommit` (32 bytes) so the heir can prove they received the correct envelope, but keep the ciphertext off-chain. This keeps the heir count private, which is one of the design's distinguishing privacy properties.

### C17. Proof server — restated, and it is worse here

**Self-hosting is mandatory.** The proof server receives every witness in the clear. For Nominee that means: the owner secret, the entire will contents, every heir's identity and share.

**Is there a heartbeat design where a hosted prover sees less?** **Partially, yes — and this is a genuinely nice property.** The heartbeat proves `willCommit == H(sk, willContents)`. If you restructure as `willCommit == H(sk, willRoot)` where `willRoot` is itself a commitment the owner computes once, then the heartbeat prover only needs `sk` and `willRoot` — **not the will contents**. A hosted prover would then learn "a 32-byte secret and a 32-byte root", not the beneficiaries.

That still leaks `sk`, which is fatal (it lets the holder forge heartbeats and updates). So: **hosted proving is acceptable for nothing in this design.** But the restructuring is worth doing anyway, because it shrinks the blast radius of a compromised prover from "the whole will" to "control of the vault."

### C18. Indexer / RPC metadata

Same class of leak as the prior report, but sharper because the cadence is the product:

- The indexer sees **every heartbeat transaction, its timing, and its submitting address**. Heartbeats are periodic by design — the strongest possible timing fingerprint.
- The RPC node additionally sees **network-level metadata** (IP, submission time). An owner who heartbeats from home every month is geolocated.
- `zswapLedgerEvents` is a first-class indexer field, so shielded activity is *counted* and *timed* even when amounts are hidden.

**Mitigations that actually work:** submit heartbeats through the shared-registry design (C13); vary the cadence within the allowed window rather than heartbeating on a fixed day; route submissions through Tor or a relay.

### C19. Legal reality check — not legal advice

A crypto-native "will" almost certainly has **no standing as a testamentary instrument** in any of the three jurisdictions, because all three impose formalities that a smart contract does not meet. In **India**, the Indian Succession Act, 1925 (s.63) requires a will to be signed by the testator and attested by two or more witnesses. In **England & Wales**, the Wills Act 1837 (s.9) requires writing, signature, and two witnesses present at the same time. In the **US**, requirements are state-by-state; a minority of states have adopted the Uniform Electronic Wills Act (2019), which permits electronic wills but still requires witnessing and, typically, notarisation — none of which a heartbeat satisfies. *(Confidence: Medium-High on the statutes; Low on how any court would actually treat a ZK vault — there is no case law I could find. Verify with counsel before making any legal claim in a pitch.)*

**What this means practically, and it is the interesting part:** Nominee should be positioned as a **transfer mechanism, not a testamentary document** — the crypto analogue of a joint bank account or a payable-on-death designation, which passes *outside* probate in many systems. The **scoped probate disclosure feature is what makes this palatable rather than evasive**: it lets an executor or tax authority establish the total value and the executor's identity without exposing beneficiaries. A judge who hears "this hides assets from probate" will be hostile; one who hears "this executes the transfer privately and hands the court exactly the figures it needs" will not. **Lead with the disclosure feature, not the privacy feature.**

---

## PART D — Demo and rubric fit

Rubric (page version): **Eng 40 / QA 15 / Product 15 / UX 15 / Comms 10 / BizDev 5.**

### D20. Minimal end-to-end demo

deposit → heartbeat → time passes → resolve → heir claims → probate opens.

**⚠️ The time problem, and how to solve it.** I searched `midnight-local-dev` for any block-time manipulation (`manual-seal`, `--sealing`, timestamp override): **none exists.** There is no way to fast-forward block time on the local devnet.

**So do not simulate time — compress it.** `graceSeconds` is a plain ledger `Uint<64>` set at deploy. Deploy the demo vault with **`graceSeconds = 60`**. The demo then runs in real time:

```
t+0s    deposit           (6,536 rows)
t+10s   heartbeat         (4,507 rows)   → lastSeen = now
t+70s   resolve           (165 rows)     → grace elapsed, resolved = true
t+80s   claim (heir 1)    (32,271 rows)  → shielded payout, nullifier spent
t+90s   claim (heir 1)    → REJECTED "already claimed"
t+100s  openProbate       (10,715 rows)  → court sees total + executor only
t+110s  guardianResolve   (3,078 rows)   → the short-circuit path, on a second vault
```

This works identically on the local devnet **and on Preprod** — on Preprod you simply wait the real 60 seconds. That is a significant advantage over the lending idea, where a meaningful demo needs price movement.

**Judge-facing framing:** a 60-second grace period is obviously a demo parameter; say so on the slide and show the same contract deployed with a 90-day grace.

### D21. Frontend reuse

| Stack | What it gives you | Reuse estimate |
|---|---|---|
| **`onepledge/web`** | React app with **live Preprod indexer reads** decoded via the compiled ledger reader, plus a walkthrough UI over real circuits. Most recent (2026-09-14), targets 0.31.1 | **Highest — ~60-70%.** The "read contract state from the public indexer and render it" path is exactly what the probate view and vault status need |
| **`example-zkloan/zkloan-credit-scorer-ui`** | Official Midnight UI, **Lace wallet integration**, private-state provider wiring with password-encrypted storage | **~50%** for wallet connect + private state. This is the piece you should not write yourself — private-state provider setup is fiddly (16-char password rules, no recovery) |
| **`moonray/ui`** | Simpler Vite/React | ~30%, useful as a lighter starting point |

**Recommendation:** take wallet-connect + private-state wiring from `example-zkloan`, take the indexer-read/decode pattern from `onepledge`. Realistically **~2 days** of frontend rather than a week.

### D22. Test plan

Simulator tests (no proof server needed — this is how you get QA marks cheaply):

| Test | Asserts |
|---|---|
| `deposit.test.ts` | coin recorded; ledger `vaultCoin` set |
| `heartbeat.test.ts` | valid secret accepted; **wrong secret rejected**; `lastSeen` advances |
| `updateWill.test.ts` | commitment changes; version counter increments; **non-owner rejected** |
| `resolve.test.ts` | **rejected before grace elapses**; accepted after; idempotent |
| `guardian.test.ts` | 2-of-3 accepted; **1 signature rejected**; **same guardian twice rejected** (strictly-increasing IDs) |
| `claim.test.ts` | valid heir accepted; **claim before `resolved` rejected**; **double claim rejected** (nullifier); **non-beneficiary rejected**; **wrong share rejected** (leaf mismatch) |
| `probate.test.ts` | matching values accepted; **mismatched total rejected** |
| `leak.test.ts` | **byte-scan of serialized ledger state** using `leaktest.py`'s method |

**Critical note on the leak test, carried over from the prior report:** my Part F25 work proved byte-scanning has a **false-positive floor** — small integers (1, 2, 3, 5000) appear by chance in structural bytes. So **use high-entropy test values**: set the share to something like `0x7f3a9c21…` rather than `5000`, and include **positive controls** (a value that *is* public, e.g. `graceSeconds`) to prove the scanner works. Reuse `leaktest.py` directly.

That is 8 test files with ~25 cases, several of them negative tests. QA is 15% of the rubric and this is the cheapest 15% available.

### D23. Honest Wave split

The rules require each Wave to show "meaningful new Midnight-related functionality," and Wave 2 opens **Sep 27**.

| Wave | Scope | New Midnight functionality (what a judge can diff) |
|---|---|---|
| **Wave 1** (by Sep 16 — 2 days) | `heartbeat` + `resolve` + commitment-only will. Simulator tests. No custody | One compiling Compact contract with **witnessed private state** and the dual-ledger split. Clears the technical gate honestly; makes no claim it cannot back |
| **Wave 2** (Sep 27 – Oct 17) | **Shielded custody** (`deposit`/`claim`), Merkle beneficiary set, nullifiers, guardians. Preprod deployment. Frontend | The substantial wave: Zswap coin custody, Merkle membership, per-heir nullifiers, M-of-N Schnorr. This is where the 40% Engineering score is won |
| **Wave 3** (Oct 27 – Nov 16) | Probate scoped disclosure, duress decoy, shared-registry heartbeat mixing (C13), conditional bequests | Privacy depth: selective disclosure, anti-coercion, and the anonymity-set upgrade. Strong "what changed" narrative |

This split is honest because each wave adds a genuinely different Midnight primitive, not a re-skin.

---

## PART E — Verdict

### E24. Ratings

| Dimension | Score | Justification |
|---|:---:|---|
| **Technically buildable end-to-end today** | **4 / 5** | Every circuit compiles on the **live** toolchain; whole contract 55,137 rows, max k=15, 23 MB keys, 27.7 s keygen. Nothing requires 0.34.0, ZKIR v3, keccak, or secp256k1. **Docked one point solely for the unresolved `Custom(192)` custody question** (B4) — if shielded custody is rejected like unshielded, the design needs rework (see E27) |
| **Genuinely uses Midnight-specific privacy** | **5 / 5** | Witnessed private state, compiler-enforced `disclose()`, native shielded coins hiding the payout amount, cheap native Merkle membership, nullifiers. **Proved empirically** that the share never reaches the public transcript. This is not a bolt-on — remove Midnight and the product ceases to exist |
| **Robust to "why not just do this on chain X"** | **5 / 5** | The strongest answer available. On Ethereum, Sarcophagus publishes the recipient. On Bitcoin, a timelock reveals the heir's key at spend. **No public chain can hide the beneficiary set while executing trustlessly** — the shielded pool plus nullifiers is exactly what makes it possible. Answer in one sentence: *"On any transparent chain, your heirs are public the moment you set it up or the moment they claim."* |
| **Uniqueness / duplication risk** | **5 / 5** (5 = unique) | **Zero** inheritance projects across 439 Midnight repos, both Devpost galleries, and awesome-dapps. No trustless product anywhere hides the beneficiary set. The closest primitive overlap (`kuira-vault-android`, M-of-N treasury) is not inheritance |

### E25. Three failure modes, cheapest experiment for each

**1. Shielded contract custody is rejected by the node, like unshielded was.** (Highest impact; genuinely unresolved.)
*Cheapest experiment — ~2 hours, and it is exactly privoice's harness:* install Docker, deploy **one** contract to Preprod with two circuits — a control (`bump()`, ledger write only) and a subject (`deposit(coin)` with `receiveShielded`). Submit both from the same wallet in the same block window. If the subject is accepted, the whole design is unblocked. **Do this before writing anything else.** You can literally copy `priorart/privoice/probe/`.

**2. The change-coin sequence breaks with more than one heir.** (C14 — the hardest mechanic.)
*Cheapest experiment — ~3 hours, no deployment needed:* write a **simulator test** with three heirs claiming in sequence against a single deposited coin, asserting each receives the right amount and the contract's residual is correct. The Compact simulator runs without a proof server, so this costs nothing but time and will surface the `mt_index` / change-nonce bookkeeping problem immediately.

**3. `blockTime*` units are milliseconds, not seconds** (B5 — unverified, and silently catastrophic).
*Cheapest experiment — ~20 minutes:* deploy the 165-row `resolve` circuit locally and bisect the accepted bound against a known block timestamp. A 30-day grace that is actually 30 seconds is a demo-destroying bug.

### E26. Head-to-head against the reshaped lending idea

| Dimension | Reshaped lending (HTLC + private terms) | **Nominee** |
|---|:---:|:---:|
| Buildable end-to-end today | 3 / 5 — core compiles, but the cross-chain leg depends on `receiveUnshielded`, which privoice measured as **rejected** | **4 / 5** — all-Midnight, no cross-chain leg, only the shielded-custody question open |
| Midnight-native privacy | 4 / 5 | **5 / 5** |
| Robust to "why not chain X" | 3 / 5 — invites "so use a ZK coprocessor on Ethereum" | **5 / 5** — no transparent chain can hide the beneficiary |
| Uniqueness | 2 / 5 — `example-zkloan` (official), `midnight-health-factor-proof`, kymider, freeboard, datum, amana, onepledge, ProofLend, Creva-ZK | **5 / 5** — nothing exists |
| Demo without external dependencies | Needs price movement, an oracle, and a second chain | **Self-contained; compress grace to 60 s** |
| **Total** | **12 / 20** | **19 / 20** |

**Recommendation: build Nominee.**

It wins on every dimension, and it wins for a structural reason rather than a marginal one. The lending idea's differentiator was cross-chain state verification, which I proved in the prior report is undeployable (Ethereum) or impossible (Cardano) — leaving a crowded field of eight-plus near-identical solvency projects. Nominee's differentiator is *hiding the beneficiary set*, which is (a) natively supported by primitives I compiled and measured today, (b) unoccupied across the entire ecosystem, and (c) impossible to replicate on a transparent chain — which is precisely the answer the "why not chain X" question demands.

It also has the better demo. Inheritance is legible to a non-technical judge in one sentence, and the grace-period compression makes it self-contained — no oracle, no second chain, no price feed.

### E27. Minimal reshaping, if needed

**Only if experiment E25.1 shows shielded custody is rejected.** In that case, keep everything and change one thing: **the contract stops custodying assets and becomes a private authorisation registry.**

- The will, beneficiary set, shares, heartbeat, resolution, guardians, probate disclosure, and duress decoy **all stay exactly as measured** — none of them touch coin custody.
- `claim` drops `sendShielded` and instead **emits a nullifier plus a proof of entitlement**. Assets sit in a 2-of-2 or M-of-N arrangement at the wallet layer (or on Cardano), released against that on-chain proof.
- Cost: `claim` falls from 32,271 rows to roughly **13,000** (Merkle membership + nullifier, minus the ~19.5 k shielded-send cost measured in B4).

You lose "the contract holds the money" and keep "the chain never learns who inherits" — which was always the actual novelty. This is the same lesson `privoice` drew for invoices and `kaamos` drew for swaps: **on Midnight today, prove at the contract layer and move value at the application layer.**

---

## Appendix — Reproduction

```
nominee/
├── nominee.compact          full 6-circuit contract (55,137 rows, max k=15)
├── schnorr.compact            polyfill, vendored from example-zkloan
├── measure.sh                 compile → mock-compile → rows
├── src/                       b4_store, b4_qual, b4_custody, b5_heartbeat, b6_perm,
│                              b7_privamt, b7_claim_d8, b7_claim_d16, b8_update,
│                              b9_probate, b10_m2n3, b10_m3n5, b11_cond, b12_duress,
│                              a4_mint, a4_native
└── out/                       ZKIR + proving keys per circuit
```

```bash
export PATH="$HOME/.local/bin:$PATH"
cd nominee && ./measure.sh name < contract.compact      # rows per circuit
compact compile +0.31.1 nominee.compact out/full        # 27.7s, 23MB keys
```

**The ZKIR leak-check method** (reusable — this is how every privacy claim above was verified):
```python
# reconstruct var numbering, then:
priv = [v for v,s in varsrc.items() if s.startswith('private_input')]
pub  = {x['var'] for x in ins if x['op']=='declare_pub_input'}
leaked = [v for v in priv if v in pub]     # must be empty
```

**What I could not verify, and what is needed:**

| Item | Blocker | To verify |
|---|---|---|
| Shielded custody accepted by the node | No Docker; needs a live submission | Deploy the two-circuit control/subject probe to Preprod (copy `priorart/privoice/probe/`) |
| `blockTime*` units (s vs ms) | Not documented; not a circuit constraint | Deploy `resolve` locally, bisect the bound |
| Native shielded coins obtainable on Preprod | Could not observe a shielded transfer | Scan Preprod blocks for non-empty `zswapLedgerEvents` |
| Multi-heir change-coin sequence | Not built | Simulator test with 3 sequential claims |
| Aleo/Aztec inheritance prior art | Search-engine negative only | Enumerate Aleo program registry + Aztec `noir` examples |
| Legal standing | Statutes cited, no case law found | Counsel in each jurisdiction |
