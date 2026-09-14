# Nominee — Architecture

**Add a nominee to your crypto. Nobody learns who.** · nominee.world · built on Midnight

**Audience:** an engineer implementing this from scratch.
**Target:** Compact toolchain **0.31.1** (language 0.23.0, ledger-8.0.2, runtime 0.16.0) — the version Preview, Preprod and Mainnet run. Midnight.js **4.1.1**, wallet SDK **1.2.0**, proof server **8.1.0**, ledger-v8 **8.1.0**. Do **not** use 0.34.0: nothing here needs it and no live network accepts it.

Reference contract: `final/nominee.compact` (compiles clean, 10 circuits, max k=15, 97,628 rows, 40 MB keys, 19.2 s keygen).

---

## 1. The shape of the thing

The heartbeat-and-grace mechanism at the core of the product is referred to internally as the **Last Light vault**; everywhere else — identifiers, files, UI — the product is Nominee.

One **shared registry contract** serves many owners. This is deliberate: a contract per will turns every heartbeat into a per-person fingerprint. Here, a heartbeat proves membership in an owner set, so an observer sees *someone* checked in.

```
  ownerSet (Merkle root of registered owners)
        │
        ├── ownerTag ── lastSeen ── graceSeconds ──► resolve() ──► resolvedVault
        │       │                                        ▲
        │       ├── vaultRoot  (beneficiary Merkle root) │
        │       ├── heldCoin   (outstanding shielded coin)│
        │       └── willVersion                           │
        │                                      guardianResolve (M-of-N Schnorr)
        │
        └── heirs ── claim() ── nullifier ──► sendShielded ──► heir's wallet
```

---

## 2. State layout

### Public ledger (everyone sees this)

| Field | Type | Why it is public | What it leaks |
|---|---|---|---|
| `ownerSet` | `MerkleTreeDigest` | Heartbeats prove membership against it | The *size* of the anonymity set, not who is in it |
| `lastSeen` | `Map<Bytes<32>, Uint<64>>` | Resolution must be permissionlessly checkable | Per-tag heartbeat cadence. **The main metadata leak** — see §7 |
| `graceSeconds` | `Uint<64>` | Anyone must be able to compute the deadline | Policy only |
| `vaultRoot` | `Map<Bytes<32>, MerkleTreeDigest>` | Heirs prove membership against it | Nothing — a root is opaque |
| `resolvedVault` | `Set<Bytes<32>>` | Gates claims | That a vault resolved, and when |
| `spent` | `Set<Bytes<32>>` | Double-claim prevention | **How many** heirs have claimed. Not who |
| `guardians` | `Map<Uint<16>, JubjubPoint>` | Signature verification needs the keys | Guardian public keys and count |
| `heldCoin` | `Map<Bytes<32>, ShieldedCoinInfo>` | The next claimant reads the outstanding coin from here (§5) | **`value` — the remaining balance is public.** See §7 |
| `probateOpened` | `Map<Bytes<32>, Bytes<32>>` | Envelope commitment for the court | That probate was opened |
| `willVersion` | `Map<Bytes<32>, Uint<64>>` | Amendment audit trail | That the will changed, and when |

`ownerTag = persistentHash(["nominee:owner:v1", ownerSecret, willRoot])` — stable per owner, unlinkable to any wallet or to the owner's identity.

### Private state (never leaves the owner's / heir's device)

| Witness | Type | Held by |
|---|---|---|
| `ownerSecret()` | `Bytes<32>` | owner |
| `willRoot()` | `Bytes<32>` | owner — **a commitment to the will, never the contents** |
| `ownerPath(leaf)` | `MerkleTreePath<16, Bytes<32>>` | owner |
| `newWillRoot()`, `newVaultRoot()` | `Bytes<32>`, `MerkleTreeDigest` | owner |
| `heirSecret()`, `heirShare()` | `Bytes<32>`, `Uint<128>` | each heir |
| `heirPath(leaf)` | `MerkleTreePath<16, Bytes<32>>` | each heir |
| `spendCoin()` | `QualifiedShieldedCoinInfo` | claimant (see §5) |
| `gSig0/1/2()` | `SchnorrSignature` | guardians |
| `totalValue()`, `executorId()`, `probateBlind()`, `envelopeCipher()` | | executor |
| `pin()`, `decoyRoot()` | `Uint<16>`, `MerkleTreeDigest` | owner |

**Rule, enforced and verified:** every secret is a **witness**. No circuit argument carries a secret — circuit arguments are public. `final/leakcheck.py` verifies this against the ZKIR; run it in CI.

---

## 3. Circuits — inputs and disclosures

`pub` = public circuit argument; `wit` = private witness.

| Circuit | k | rows | Public args | Witnesses | What `disclose()` reveals, and why that's acceptable |
|---|---:|---:|---|---|---|
| `register` | 14 | 11,099 | — | ownerSecret, willRoot, ownerPath | The **owner tag** and the **owner-set root**. A tag is a domain-separated hash of two secrets — opaque. Registration reveals that *one more* owner exists |
| `heartbeat` | 14 | 11,170 | `now: Uint<64>` | ownerSecret, willRoot, ownerPath | The **tag** and the **timestamp**. The membership root is checked, not the identity. **38 private vars, zero leaks** |
| `deposit` | 14 | 10,971 | `coin: ShieldedCoinInfo` | ownerSecret, willRoot | The coin's `nonce`/`color`/`value`. **Note: a deposit's amount is public** because the coin struct is a public argument. See §7 |
| `updateWill` | 13 | 4,528 | — | ownerSecret, willRoot, newVaultRoot | The **new root** and a version bump. Old and new contents both stay private. Leaks *that* the will changed |
| `resolve` | 9 | 445 | `tag`, `deadline` | — | Nothing private. **Permissionless by design** — no caller identity, so nobody can censor resolution |
| `guardianResolve2of3` | 12 | 3,356 | `tag`, `g0`, `g1` | gSig0, gSig1 | **Which guardians** acted (their ids). Signatures verified, never published. Strictly-increasing ids stop one guardian signing twice |
| `guardianResolve3of5` | 13 | 4,876 | `tag`, `g0..g2` | gSig0..2 | as above |
| `claim` | **15** | **32,623** | `tag`, `heirKey` | heirSecret, heirShare, heirPath, spendCoin | The **nullifier** (opaque), the **recomputed root** (matches the public one), and the **coin transfer**. **The share amount is hidden inside the Zswap commitment** |
| `openProbate` | 14 | 11,270 | `tag`, `vaultCommit` | totalValue, executorId, probateBlind, envelopeCipher | The **envelope commitment**. Proves the executor's figures match what the vault committed to |
| `resolveUnderPin` | 13 | 7,290 | `tag`, `realCommit`, `decoyCommit` | ownerSecret, pin, willRoot, decoyRoot | Only the **OR** of the two commitment matches — the circuit never says *which*. Verified: one `assert`, two independent `test_eq` pairs |

**The two ZKIR-flagged variables are both Merkle roots** (`newVaultRoot`, `decoyRoot`), each consumed by exactly one `declare_pub_input`. Publishing them is required — heirs prove against a public root. Neither is a secret.

---

## 4. Merkle discipline

- `merkleTreePathRoot` returns **`MerkleTreeDigest`**, not `Bytes<32>`. Store roots as `MerkleTreeDigest` and compare `.field`.
- You **cannot assign a new root to a ledger `MerkleTree`**. Keep the root in a `MerkleTreeDigest` field and verify paths explicitly — that is what makes atomic root replacement possible in `updateWill`.
- Depth 16 costs ~31 rows/level over depth 8. Use 16 (65,536 heirs) and stop thinking about it.
- Build paths off-chain with the **contract's own hashing methods** (`_persistentHash_0`, `_merkleTreePathRoot_0`, `_degradeToTransient_0`, `_transientHash_0`) so roots match by construction. Reimplementing the hash chain is how you get a "not a beneficiary" you cannot debug. See `a3/test/merkle.ts`.
- Leaf binding: `leaf = persistentHash([heirSecret, persistentHash(share)])`. Binding the **share into the leaf** is what stops an heir claiming more than the will allotted — a different share is a different leaf, and it is not in the tree.

---

## 5. The coin lifecycle (the hard part)

**Proven:** a contract can receive and hold a shielded coin (A1, block 183).
**Unproven:** a contract can spend it (A1b, blocked).

```
deposit(coin)                          → receiveShielded, heldCoin[tag] = coin
claim #1: spendCoin() = qualification  → sendShielded(share) → heldCoin[tag] = res.change
claim #2: reads heldCoin[tag] from the public ledger for nonce/color/value
          …but must still source mt_index off-chain
```

`QualifiedShieldedCoinInfo = { nonce, color, value, mt_index }`. The contract can publish three of the four fields; **`mt_index` — the coin's position in the global Zswap commitment tree — is only knowable after the depositing transaction is mined**, so it comes from the indexer. The circuit then *enforces* consistency:

```compact
assert(disclose(q.nonce) == outstanding.nonce, "stale coin qualification");
assert(disclose(q.value) == outstanding.value, "stale coin value");
assert(disclose(share) <= outstanding.value, "share exceeds remaining");
```

Verified by test: a replayed pre-claim qualification is rejected.

**Two traps:**
1. `sendShielded(...).change` is `Maybe<ShieldedCoinInfo>`. On the final claim (exact remainder) it is `none`, and `.value` silently yields the default. **Branch on `is_some`** or the outstanding coin becomes a zero-value ghost.
2. `sendShielded` **encrypts the coin ciphertext to the recipient**, so a `ZswapCoinPublicKey` alone is not enough — the sender must be able to resolve the recipient's **encryption public key**. This is why the heir envelope carries both (§6).

---

## 6. The heir envelope

Delivered **off-chain**; only a 32-byte commitment goes on-chain. On-chain ciphertext would leak the **heir count**, which is one of the privacy properties worth keeping.

```json
{
  "version": 1,
  "vaultTag":        "<32-byte ownerTag, hex>",
  "heirSecret":      "<32 bytes — the heir's claim key>",
  "share":           "<Uint<128> as decimal string>",
  "merklePath":      [{ "sibling": "<field>", "goesLeft": true }, … 16 entries],
  "coinPublicKey":   "<32 bytes — ZswapCoinPublicKey>",
  "encryptionPublicKey": "<required: sendShielded encrypts to this>",
  "contractAddress": "<hex>",
  "indexerUrl":      "https://indexer.preprod.midnight.network/api/v4/graphql"
}
```

Encrypt client-side to the heir's key. `openProbate` proves on-chain that the executor's disclosed figures match the vault commitment; it **cannot** prove the ciphertext decrypts correctly — the court closes that loop off-chain by decrypting and comparing against `vaultCommit`.

---

## 7. Threat model

| Party | Learns | Undermines "nobody knows who inherits"? |
|---|---|---|
| **Chain observer** | A registry exists; the owner-set size; per-tag heartbeat cadence; when a vault resolves; how many nullifiers were spent; **the remaining balance in `heldCoin.value`**; **each deposit's amount** (public circuit argument) | **Partly.** Identities and shares stay hidden. **Amounts do not.** If that matters, deposit through a mint step or pad deposits |
| **Heir** | Their own share; that other heirs exist (from `spent.size()`); the remaining balance | No — cannot learn another heir's share without their envelope |
| **Colluding heirs** | The sum of their own shares | Inherent to any split; acceptable |
| **Heir who is also a guardian** | Can help trigger early resolution | Require M ≥ 2 and strictly-increasing ids (done). Guardians disjoint from heirs is enforceable only off-chain — both sets are private |
| **Guardian** | That they attested; which co-guardians signed | Minor |
| **Indexer / RPC operator** | Every transaction, its timing and submitting address; **a periodic heartbeat is the strongest possible timing fingerprint**; IP-level metadata | **Yes, materially.** Mitigate: shared registry (done), jitter the heartbeat within the allowed window, route via Tor/relay |
| **Proof server** | **Every witness in the clear** | **Yes, catastrophically, if hosted.** See below |
| **Court / executor** | Total value and executor identity — exactly what `openProbate` discloses | No — that is the feature |

**Proof-server rule: self-host. Always.** The prover receives the owner secret, heir secrets and shares. There are now **two** ways to get this wrong: a hosted proof server, and `getProvingProvider()` in the DApp Connector, which delegates proving to the **wallet's** prover. Neither is acceptable for this application.

The heartbeat is deliberately structured as `H(ownerSecret, willRoot)` — **the prover never touches the will contents**, only a 32-byte root. That shrinks the blast radius of a compromised prover from "the entire will" to "control of this vault." It does not make hosted proving safe.

**Owner loses their device:** they can no longer heartbeat or amend — and **heirs can still claim**, because `claim` takes nothing owner-derived (witnesses are `heirSecret`, `heirShare`, `heirPath`, `spendCoin`). The design degrades in the right direction. The flip side must be said out loud: **a long hospital stay executes the will.** Guardians are a safety requirement, not a stretch goal.

---

## 8. Clock discipline

- `blockTimeGte` / `blockTimeLt` take **Unix epoch SECONDS**.
- **The indexer reports block timestamps in MILLISECONDS (13 digits).** Divide by 1000. Getting this wrong turns a 30-day grace into 30 seconds.
- A bound in the future is rejected; the assertion fails **wallet-side at circuit execution**, before submission. The bound is also published for the node to re-check, so a prover cannot lie.
- `graceSeconds` is in seconds. Demo with 60; ship with 90 days.

---

## 9. Operational notes that will cost you a day each

- **`Custom(170) InvalidDustSpendProof` is routine.** Dust state advances while proving. **Rebuild and re-prove — never resubmit.** Every submission path needs a retry loop; mine succeeded on attempt 2.
- Error codes worth mapping: `126 Unbalanced`, `138 BalanceCheckOverspend`, `170 InvalidDustSpendProof`, `192 InputsSignaturesLengthMismatch`, `231 FeeCalculation.OutsideTimeToDismiss`.
- **Use Node 22.** Node 23+ has a built-in WebSocket that drops Preprod RPC submissions with wallet SDK 1.2.0.
- `levelPrivateStateProvider` enforces a ≥16-char password with 3 character classes and **has no recovery**.
- The ZK config path must contain the circuits you are calling — a single `NodeZkConfigProvider` per contract.
