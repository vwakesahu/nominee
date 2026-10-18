# Nominee, Architecture

**Add a nominee to your crypto. Nobody learns who.** · nominee.world · built on Midnight

**Audience:** an engineer implementing this from scratch.
**Target:** Compact toolchain **0.31.1** (language 0.23.0, ledger-8.0.2, runtime 0.16.0), the version Preview, Preprod and Mainnet run. Midnight.js **4.1.1**, wallet SDK **1.2.0**, proof server **8.1.0**, ledger-v8 **8.1.0**. Do **not** use 0.34.0: nothing here needs it and no live network accepts it.

Reference contract: `contract/src/nominee.compact` (compiles clean, 13 circuits, max k=16, 151,714 rows, 75 MB keys). Build notes and the row table are in [`contract/README.md`](../contract/README.md).

---

## 1. The shape of the thing

The heartbeat-and-grace mechanism at the core of the product is referred to internally as the **Last Light vault**; everywhere else, identifiers, files, UI, the product is Nominee.

One **shared registry contract** serves many owners. This is deliberate: a contract per will turns every heartbeat into a per-person fingerprint. Here, a heartbeat proves membership in an owner set, so an observer sees *someone* checked in.

```
  ownerSet (Merkle root of registered owners; each leaf = H(secret, willRoot, deviceCommit))
        │
        ├── ownerTag ── lastSeen ── graceSeconds ──► resolve() ──► challengeUntil ──► finalize() ──► resolvedVault
        │       │                                                        │                               ▲
        │       │                     heartbeat (secret + device sig) ───┤ closes                        │
        │       │                     veto (secret only) ────────────────┤ closes                        │
        │       │                     guardianVeto2of3 ──────────────────┘ closes                        │
        │       │                                                                                        │
        │       ├── vaultRoot  (beneficiary Merkle root)                       guardianResolve (M-of-N) ─┘
        │       ├── heldCoin   (outstanding qualified shielded coin)
        │       └── willVersion
        │
        └── heirs ── claim() ── nullifier ──► sendShielded to the key bound in the heir leaf ──► heir's wallet
```

Death is never asserted, only absence. `resolve` opens a window; three different parties can close it; `finalize` succeeds only if none did.

---

## 2. State layout

### Public ledger (everyone sees this)

| Field | Type | Why it is public | What it leaks |
|---|---|---|---|
| `ownerSet` | `MerkleTreeDigest` | Heartbeats prove membership against it | The *size* of the anonymity set, not who is in it |
| `lastSeen` | `Map<Bytes<32>, Uint<64>>` | Resolution must be permissionlessly checkable | Per-tag heartbeat cadence. **The main metadata leak**, see §7 |
| `graceSeconds` | `Uint<64>` | Anyone must be able to compute the deadline | Policy only |
| `challengeSeconds` | `Uint<64>` | Anyone must be able to compute when a window closes | Policy only |
| `challengeUntil` | `Map<Bytes<32>, Uint<64>>` | `finalize` and the vetoes check it | That a window is open on this tag, and until when |
| `vaultRoot` | `Map<Bytes<32>, MerkleTreeDigest>` | Heirs prove membership against it | Nothing, a root is opaque |
| `resolvedVault` | `Set<Bytes<32>>` | Gates claims | That a vault resolved, and when |
| `spent` | `Set<Bytes<32>>` | Double-claim prevention | **How many** heirs have claimed across the registry. Not who, not which vault |
| `guardians` | `Map<Uint<16>, JubjubPoint>` | Signature verification needs the keys | Guardian public keys and count |
| `heldCoin` | `Map<Bytes<32>, QualifiedShieldedCoinInfo>` | The next claimant spends the outstanding coin from here (§5) | **`value`, the remaining balance is public.** See §7 |
| `probateOpened` | `Map<Bytes<32>, Bytes<32>>` | Envelope commitment for the court | That probate was opened |
| `willVersion` | `Map<Bytes<32>, Uint<64>>` | Amendment audit trail | That the will changed, and when |

`ownerTag = persistentHash(["nominee:owner:v1", ownerSecret, willRoot])`, stable per owner, unlinkable to any wallet or to the owner's identity.

Constructor: `(initialOwnerSet, grace, challenge, g0x, g0y, g1x, g1y, g2x, g2y)`. Guardian keys arrive as field coordinates, not `JubjubPoint` values: a `JubjubPoint` is a wasm-backed object and handing one to `deployContract` corrupts the deploy path. The point is rebuilt in-circuit.

### Private state (never leaves the owner's / heir's device)

| Witness | Type | Held by |
|---|---|---|
| `ownerSecret()` | `Bytes<32>` | owner |
| `willRoot()` | `Bytes<32>` | owner, **a commitment to the will, never the contents** |
| `ownerPath(leaf)` | `MerkleTreePath<16, Bytes<32>>` | owner |
| `devicePkX()`, `devicePkY()` | `Field` | owner, the device's public key; only its commitment is in the leaf |
| `deviceSig()` | `SchnorrSignature` | the device, over `[2, now, 0, 0]` for `heartbeat` and `[4, now, 0, 0]` for `updateWill` |
| `newVaultRoot()` | `MerkleTreeDigest` | owner |
| `heirSecret()`, `heirShare()` | `Bytes<32>`, `Uint<128>` | each heir |
| `heirPath(leaf)` | `MerkleTreePath<16, Bytes<32>>` | each heir |
| `gSig0/1/2()` | `SchnorrSignature` | guardians, over `[kind, degradeToTransient(tag), 0, 0]` |
| `totalValue()`, `executorId()`, `probateBlind()`, `envelopeCipher()` | | executor |
| `pin()`, `decoyRoot()` | `Uint<16>`, `MerkleTreeDigest` | owner |

**Rule, enforced and verified:** every secret is a **witness**. No circuit argument carries a secret, circuit arguments are public. `test/privacy/leakcheck.py` (`bun run leakcheck`) verifies this against the ZKIR; run it in CI.

### Leaves

```
deviceCommit = persistentHash<Vector<2, Field>>([x, y])
ownerLeaf    = persistentHash<Vector<3, Bytes<32>>>([ownerSecret, willRoot, deviceCommit])
heirLeaf     = persistentHash<Vector<3, Bytes<32>>>([heirSecret, persistentHash<Uint<128>>(share), heirKey.bytes])
nullifier    = persistentHash<Vector<2, Bytes<32>>>([pad32("nominee:nf:v1"), heirSecret])
```

The owner leaf binds **knowledge and possession**: a seed alone is not an owner. The heir leaf binds **the share and the payout key**: a different share or a different key is a different leaf, and it is not in the tree.

---

## 3. Circuits, inputs and disclosures

`pub` = public circuit argument; `wit` = private witness. Row counts from `zkir mock-compile` on 0.31.1.

| Circuit | k | rows | Public args | Witnesses | What `disclose()` reveals, and why that's acceptable |
|---|---:|---:|---|---|---|
| `register` | 14 | 15,678 | none | ownerSecret, willRoot, ownerPath, devicePkX/Y | The **owner tag** and the **owner-set root**. Registration reveals that *one more* owner exists. The device key is hashed into the leaf and never disclosed |
| `heartbeat` | 15 | 17,266 | `now` | + deviceSig | The **tag** and the **timestamp**. Membership is checked, not identity. The device signature is verified in-circuit against the key in the leaf; neither reaches the chain. Closes an open window |
| `veto` | 14 | 15,751 | `now` | ownerSecret, willRoot, ownerPath, devicePkX/Y | Tag and timestamp. No device signature: knowledge only. Requires an open window, closes it, refreshes `lastSeen` |
| `deposit` | 15 | 16,803 | `coin` | ownerSecret, willRoot | The coin's `nonce`/`color`/`value`. **A deposit's amount is public** because the coin struct is a public argument. See §7 |
| `updateWill` | 15 | 17,310 | `now` | ownerSecret, willRoot, ownerPath, devicePkX/Y, deviceSig, newVaultRoot | The **new root**, the timestamp and a version bump. Old and new contents both stay private. Needs the device signature over `[4, now, 0, 0]`, so a stolen seed cannot rewrite who the vault pays |
| `resolve` | 10 | 511 | `tag`, `deadline` | none | Nothing private. **Permissionless.** Checks `deadline == lastSeen + grace` and that it has passed, then writes `challengeUntil = deadline + challenge`. Does **not** unlock |
| `finalize` | 9 | 379 | `tag`, `until` | none | Nothing private. **Permissionless.** Requires an open window that has expired; removes it and inserts into `resolvedVault` |
| `guardianResolve2of3` | 12 | 3,356 | `tag`, `g0`, `g1` | gSig0, gSig1 | **Which guardians** acted (their ids). Message is `[1, tag, 0, 0]`. Strictly-increasing ids stop one guardian signing twice |
| `guardianResolve3of5` | 13 | 4,876 | `tag`, `g0..g2` | gSig0..2 | as above |
| `guardianVeto2of3` | 12 | 3,358 | `tag`, `g0`, `g1` | gSig0, gSig1 | as above with message kind 3, so a resolve signature cannot double as a veto. Requires and closes an open window |
| `claim` | **16** | **37,866** | `tag`, `heirKey` | heirSecret, heirShare, heirPath | The **nullifier** (opaque), the **recomputed root** (matches the public one), and the **coin transfer** to `heirKey`. **The share amount is hidden inside the Zswap commitment** |
| `openProbate` | 14 | 11,270 | `tag`, `vaultCommit` | totalValue, executorId, probateBlind, envelopeCipher | The **envelope commitment**. Proves the executor's figures match what the vault committed to |
| `resolveUnderPin` | 13 | 7,290 | `tag`, `realCommit`, `decoyCommit` | ownerSecret, pin, willRoot, decoyRoot | Only the **OR** of the two commitment matches, the circuit never says *which* |

Leak check: clean on all 13. The two allowlisted variables (`updateWill` var 142 = `newVaultRoot`, `resolveUnderPin` var 24 = `decoyRoot`) are Merkle roots, each consumed by exactly one `declare_pub_input`. Publishing them is required, heirs prove against a public root. Neither is a secret.

`openProbate` and `resolveUnderPin` are compiled, keyed, tested in the simulator and deployed (their verifier keys are on the devnet contract, §9). The CLI does not yet drive them; that is Wave 3.

---

## 4. Merkle discipline

- `merkleTreePathRoot` returns **`MerkleTreeDigest`**, not `Bytes<32>`. Store roots as `MerkleTreeDigest` and compare `.field`.
- You **cannot assign a new root to a ledger `MerkleTree`**. Keep the root in a `MerkleTreeDigest` field and verify paths explicitly, that is what makes atomic root replacement possible in `updateWill`.
- Depth 16 costs ~31 rows/level over depth 8. Use 16 (65,536 heirs) and stop thinking about it.
- Build paths off-chain with the **contract's own hashing methods** (`_persistentHash_N`, `_transientHash_N`, `_degradeToTransient_0`) so roots match by construction. The variant numbering is assigned by the compiler and **shifts when the contract changes**; read it off `contract/out/contract/index.js` every build. Reimplementing the hash chain is how you get a "not a beneficiary" you cannot debug.
- Leaf binding is in §2. Binding the **share into the heir leaf** stops an heir claiming more than allotted. Binding the **payout key into the heir leaf** stops a stolen envelope paying anyone but the named heir. Binding the **device commitment into the owner leaf** stops a stolen seed from heartbeating.

---

## 5. The coin lifecycle

A contract can hold a shielded coin, but it cannot spend one without the coin's position in the global Zswap commitment tree (`mt_index`), which only exists once the receiving transaction is in a block. Wave 1 tried to read it back from `queryZSwapAndContractState(...).firstFree` and got 0 every time, which is why the payout stayed in the simulator. Midnight confirmed in midnightntwrk/servicedesk#187 (reported by ekacin, closed 2026-09-22) that `firstFree` is 0 by construction for contract-owned coins, and that the supported pattern is `insertCoin`/`writeCoin` into a `QualifiedShieldedCoinInfo` ledger field in the receiving transaction itself.

```
deposit(coin)   → receiveShielded(coin)
                  heldCoin.insertCoin(tag, coin, self)        // the index is captured here
claim #1        → outstanding = heldCoin.lookup(tag)           // fully qualified, straight from the ledger
                  res = sendShielded(outstanding, heirKey, share)
                  res.change.is_some ? heldCoin.insertCoin(tag, res.change.value, self)
                                     : heldCoin.remove(tag)
claim #2, #3    → same, against the re-inserted change
```

No indexer lookup, no `spendCoin` witness, no stale-coin asserts: the ledger is the source of truth. The circuit still enforces `share <= outstanding.value`. The live run shows the sequence: `heldCoin` 1000 → 500 → 200 → entry removed over blocks 5470 and 5475 (CLI) and 5499 (the heir web page), contract `7de3ca92…fee440`.

**Two traps that remain:**
1. `sendShielded(...).change` is `Maybe<ShieldedCoinInfo>`. On the final claim (exact remainder) it is `none`, and `.value` silently yields the default. **Branch on `is_some`** or the outstanding coin becomes a zero-value ghost. Covered by the test "exact-remainder claim removes the `heldCoin` entry".
2. `sendShielded` **encrypts the coin ciphertext to the recipient**, so the wallet that owns `heirKey` must be able to resolve its own encryption key. In the demo all three nominees are bound to the demo wallet's coin public key for this reason.

---

## 6. The heir envelope (v2)

Delivered **off-chain**; only a 32-byte Merkle root reaches the chain. On-chain ciphertext would leak the **heir count**, which is one of the privacy properties worth keeping. The envelope holds the heir's claim secret: treat it like a seed phrase.

```json
{
  "version": 2,
  "network": "undeployed | preview | preprod",
  "contractAddress": "<hex>",
  "vaultTag": "<32-byte ownerTag, hex>",
  "heirSecret": "<32 bytes, hex>",
  "share": "<Uint<128> as decimal string>",
  "heirKey": "<32 bytes hex, the ZswapCoinPublicKey the owner bound into the leaf>",
  "merklePath": [{ "sibling": "<field as decimal string>", "goesLeft": true }, "... 16 entries"],
  "indexerUrl": "<http url>"
}
```

`heirLeaf = persistentHash_5([heirSecret, persistentHash_3(share), heirKey])`. The path is for depth 16 and was built by the owner against the vault root they published with `updateWill`. `cli/src/envelope.ts` writes one per heir to `deployments/envelopes/<name>.json` (gitignored) and turns one back into the three claim witnesses (`envelopeWitnesses`).

What changed from v1: `coinPublicKey` became `heirKey` and moved into the leaf, so the chain enforces it; `encryptionPublicKey` is gone, the recipient wallet resolves its own; `network` was added so a server refuses an envelope for the wrong chain.

### The heir web app

`server/` is a plain Node API on `127.0.0.1:8787`. It runs the compiled CLI in `cli/dist` (`bun run server` builds both):

| Route | Returns |
|---|---|
| `GET /api/health` | `{ ok, network, contractAddress, mode }` |
| `GET /api/vault/:tag` | public ledger view: `lastSeen`, `graceSeconds`, `challengeSeconds`, `deadline`, `challengeUntil`, `resolved`, `claimsSpent`, `remaining`, `willVersion`, a derived `status` (`alive`, `grace-lapsed`, `challenge`, `resolved`, `empty`, `unknown`) and the server clock. Read-only, from the indexer, no wallet |
| `POST /api/claim` `{ envelope }` | `{ txHash, block, received, remaining, nullifier, heirKey }`, or 409 with the circuit's reason (`vault not resolved`, `challenge window open until …`) |
| `GET /api/demo-envelope` | simulator mode only: a valid envelope for the seeded vault |

Live mode: `NOMINEE_LIVE=1 NOMINEE_NETWORK=<network> NOMINEE_CONTRACT=<address> bun run server`. It opens a `LiveSession` on the contract with the envelope's three witnesses merged over the defaults (`witnessOverrides`) and calls `claim(tag, heirKey)`. `web/` is one Next.js page: paste, status line, claim, then the two-panel "what the chain saw" list.

**Proof-server rule, split by role.** The prover sees every witness. For an owner the witnesses are the owner secret and the will root, so an owner must prove on their own machine, and `getProvingProvider()` (the wallet's prover) is out. For an heir the witnesses are only their own secret, share and path, nothing owner-derived, so an heir proving on the claim server's self-hosted prover exposes only what the heir already holds. The page says so. It is still not a hosted third party.

`openProbate` proves on-chain that the executor's disclosed figures match the vault commitment; it **cannot** prove the ciphertext decrypts correctly, the court closes that loop off-chain by decrypting and comparing against `vaultCommit`.

---

## 7. Threat model

| Party | Learns | Undermines "nobody knows who inherits"? |
|---|---|---|
| **Chain observer** | A registry exists; the owner-set size; per-tag heartbeat cadence; when a window opened and whether it was contested; when a vault resolves; how many nullifiers were spent; **the remaining balance in `heldCoin.value`**; **each deposit's amount** (public circuit argument) | **Partly.** Identities and shares stay hidden. **Amounts do not.** If that matters, deposit through a mint step or pad deposits |
| **Heir** | Their own share; that other heirs exist (from `spent.size()`); the remaining balance | No, cannot learn another heir's share without their envelope |
| **Colluding heirs** | The sum of their own shares | Inherent to any split; acceptable |
| **Seed thief (no device)** | Can call `veto` while a window is open, which delays inheritance by refreshing `lastSeen` | **No.** Cannot heartbeat and cannot `updateWill` (both need the device signature), cannot claim (heir leaves are the heirs' secrets, not the owner's). Can delay inheritance, never redirect it |
| **Device thief (no seed)** | Nothing: the device signs a timestamp, every circuit also needs the secret | No |
| **Envelope thief** | The heir's share and tag | **No.** The payout key is in the leaf; a claim to any other key fails `not a beneficiary`. The thief can trigger the payout to the heir early, which is a nuisance, not a loss |
| **Heir who is also a guardian** | Can help trigger early resolution | Require M ≥ 2 and strictly-increasing ids (done). Guardians disjoint from heirs is enforceable only off-chain, both sets are private |
| **Guardian** | That they attested; which co-guardians signed | Minor |
| **Guardian signature replay** | Wave 1 signed `[1, 0, 0, 0]`: a signature for one vault was valid for every vault. Now the message is `[kind, degradeToTransient(tag), 0, 0]`, kind 1 resolve, kind 3 veto | Fixed. Tested: Ben's signatures presented against Alice's tag fail `Invalid attestation signature` |
| **Indexer / RPC operator** | Every transaction, its timing and submitting address; **a periodic heartbeat is the strongest possible timing fingerprint**; IP-level metadata | **Yes, materially.** Mitigate: shared registry (done), jitter the heartbeat within the allowed window, route via Tor/relay |
| **Proof server** | **Every witness in the clear** | **Yes, catastrophically, if hosted for owners.** See §6 for the owner/heir split |
| **Court / executor** | Total value and executor identity, exactly what `openProbate` discloses | No, that is the feature |

**`heartbeat` and `updateWill` both need the device.** A stolen seed can neither keep the vault alive nor rewrite who it pays; the worst a seed thief can do is delay inheritance with `veto`, never redirect it. The trade-off: losing the device is survivable but not free. `veto` needs only the secret, so the owner can always stop a resolution, but the will is frozen until a new registry is deployed with a new device commitment, because the owner-set root is fixed at deploy.

**The device raises the cost of faking liveness. It does not make it impossible.** A circuit verifies a signature, never a pulse. A device built to sign only while it reads a pulse means a thief needs the seed, the device and a living body it will accept. That is a much higher bar than copying a seed. It is not proof of life.

**Owner loses their device:** they can no longer heartbeat or amend the will. They can still `veto` with the secret, so a window opened against them can be closed, and `veto` refreshes `lastSeen`, so they can keep the vault shut indefinitely by vetoing each window. Recovery is a new registry with a new device commitment. **Heirs can still claim**, because `claim` takes nothing owner-derived. The design degrades in the right direction. The flip side must be said out loud: **a long hospital stay still executes the will.** The window and the guardians lengthen the fuse. They do not remove it.

---

## 8. Clock discipline

- `blockTimeGte` / `blockTimeLt` take **Unix epoch SECONDS**.
- **The indexer reports block timestamps in MILLISECONDS (13 digits).** Divide by 1000. Getting this wrong turns a 30-day grace into 30 seconds.
- A bound in the future is rejected; the assertion fails **wallet-side at circuit execution**, before submission. The bound is also published for the node to re-check, so a prover cannot lie.
- `graceSeconds` and `challengeSeconds` are in seconds. The demo uses 60 and 30 (`NOMINEE_GRACE`, `NOMINEE_CHALLENGE`). Ship with 90 days and weeks.
- `resolve` takes the exact `deadline = lastSeen + grace` and `finalize` the exact `until = deadline + challenge` as public arguments and checks both against the ledger, so a caller cannot pick a convenient time.

---

## 9. Operational notes that will cost you a day each

- **A deploy carrying all 13 verifier keys does not fit in a block.** Node 1.0.0 refused it with `Transaction would exhaust the block limits`: 33,474 bytes written, 0.67 of the per-block write budget, before the rest of the transaction. The deploy therefore omits `openProbate` and `resolveUnderPin`, and the contract's maintenance authority inserts those two keys in two follow-up transactions (`insertVerifierKey`, about 0.06 of a block each). They are the second and third entries in `deployments/devnet.json`. Any contract with more than about eleven circuits of this size will need the same split.
- **`Custom(170) InvalidDustSpendProof` is routine.** Dust state advances while proving. **Rebuild and re-prove, never resubmit.** Every submission path needs a retry loop.
- Error codes worth mapping: `126 Unbalanced`, `138 BalanceCheckOverspend`, `170 InvalidDustSpendProof`, `192 InputsSignaturesLengthMismatch`, `231 FeeCalculation.OutsideTimeToDismiss`.
- **Use Node 22.** Node 23+ has a built-in WebSocket that drops Preprod RPC submissions with wallet SDK 1.2.0.
- **Preprod is on Blockfrost.** Midnight's own Preprod indexer and RPC shut on 2026-10-09 (HTTP 410). The CLI builds the Preprod URLs from `NOMINEE_BLOCKFROST`, passing the project id as a `?project_id=` query parameter, because the SDK cannot set headers. The indexer path is `/api/v0`, not `/api/v4/graphql`. Blockfrost closes the websocket every few minutes and the SDK resubscribes on its own.
- **The DUST wallet must be caught up before the first transaction.** Otherwise balancing fails with `Insufficient Funds: could not balance dust`. On Preprod a cold scan is about 1.7 million generation events, about 30 minutes awake. The CLI waits for it on public networks, batches sync updates, and checkpoints the DUST state to `~/.nominee/dust-<network>.json`. A sleeping laptop stalls the scan, so use `caffeinate`.
- **Hold one wallet state subscriber for the life of the process.** Dropping the last subscriber lets the wallet facade tear down its services, and the node client goes with them; the next submission dies after `disconnected from wss://...: 1000:: Normal Closure`. `startAndSync` keeps one subscriber alive (found by weshallsah).
- **`Failed to prove transaction` (Wallet.Proving) right after a sync is transient.** The wallet SDK raises it before contacting the proof server, and a rebuild clears it. The retry loop treats it like `Custom(170)`.
- **Preprod lists proof server 8.1.3.** The devnet runs 8.1.0 with node 1.0.0. The Preprod run used a second container on port 6301 (`NOMINEE_PROOF_SERVER`).
- `levelPrivateStateProvider` enforces a ≥16-char password with 3 character classes and **has no recovery**.
- The ZK config path must contain the circuits you are calling, a single `NodeZkConfigProvider` per contract.
- **Hash variant indices shift** whenever the contract gains or loses a hash call site. After every contract change, re-read `contract/out/contract/index.js` and update `cli/src/crypto.ts`; the simulator tests catch a mismatch as `not a beneficiary` or `not a registered owner`.
- **The device signer is a separate process.** `nominee device [--pulse]` on `127.0.0.1:7777`; `GET /pubkey` returns the key the demo commits into Alice's leaf, `POST /sign {kind, now}` (kind 2 heartbeat, kind 4 will update) returns `{announcement:{x,y}, response}` or 409 `no pulse`. The demo fetches the public key before building the owner tree, so the device must be up before the demo starts.
