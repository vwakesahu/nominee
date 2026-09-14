# Nominee — Build Plan

**Add a nominee to your crypto. Nobody learns who.** · nominee.world

**From:** empty repo. **To:** Preprod-deployed demo + frontend + tests + video.
**Estimates in engineer-days** (one competent full-stack engineer already familiar with TypeScript; not calendar days).
**Toolchain:** Compact 0.31.1, Midnight.js 4.1.1, wallet SDK 1.2.0, proof server 8.1.0, **Node 22**.

**Total: ~14.5 engineer-days** for the full scope. A credible Wave-2 submission is ~9 days (T0–T14 + T17–T19).

---

## Gate: T1 decides the architecture

**T1 must finish before T7 starts.** Everything else can proceed either way.

---

## Phase 0 — Foundations (1.5 d)

| # | Task | Est. | Depends | Notes |
|---|---|---:|---|---|
| T0 | Repo scaffold: npm workspaces `nominee-contract/`, `nominee-cli/`, `nominee-web/`, `test/`; root package `nominee`; CLI binary `nominee` (demo runs as `nominee demo`). Apache-2.0 LICENSE. **`midnightntwrk` GitHub topic** (rules gate). | 0.5 | — | Copy the workspace layout from `example-zkloan`. |
| T1 | **🔴 GATE — resolve the shielded exit path (A1b).** Get `sendShielded` working from a contract. Blocker: contract `ZswapChainState.firstFree = 0` → `invalid index into sparse merkle tree`. | 1.0 | T0 | Post D11 question 3 in Discord **on day 1**, in parallel. Harness already exists: `research/experiments/custody-probe/runner/src/release.ts`. |

### T1 outcome → branch

**Branch A — release works (expected).** Build the vault as specified. No plan change; continue to T2.

**Branch B — release does not work.** The contract becomes a **private authorisation registry**: everything below stays *except* `deposit`/`claim` stop moving value. `claim` drops `sendShielded` and emits a nullifier + proof of entitlement; assets sit in an M-of-N arrangement released against that proof. Effects:
- `claim` falls **32,623 → ~13,000 rows** (drop the ~19.5 k shielded-send cost).
- T7 shrinks by ~0.5 d; T8 (coin lifecycle) disappears, **−1.5 d**.
- Add **+1.0 d** for the off-chain release path.
- Net ≈ **−1 d**, and the demo loses "the vault pays out" — replace that beat with "the vault authorises payout."
- The privacy claim is unchanged, because it never depended on custody.

---

## Phase 1 — Contract (3.5 d)

| # | Task | Est. | Depends | Notes |
|---|---|---:|---|---|
| T2 | Port `nominee-contract/src/nominee.compact` into `nominee-contract/src`, vendor `schnorr.compact` from `example-zkloan`. | 0.25 | T0 | Already compiles: 10 circuits, max k=15, 97,628 rows, 40 MB keys, 19.2 s. |
| T3 | Owner registry: `register`, `heartbeat` with depth-16 membership. | 0.5 | T2 | Heartbeat is `H(sk, willRoot)` — prover never sees will contents. |
| T4 | `updateWill` + `resolve` + `graceSeconds` plumbing. **Seconds, not ms.** | 0.5 | T3 | A2: indexer reports ms; `blockTime*` takes seconds. |
| T5 | `guardianResolve` 2-of-3 and 3-of-5, strictly-increasing ids. | 0.5 | T3 | 3,356 / 4,876 rows. Cheapest real feature — ship it. |
| T6 | `openProbate` binding proof + `resolveUnderPin` duress decoy. | 0.5 | T3 | 11,270 / 7,290 rows. |
| T7 | `deposit` + `claim` with shielded custody. | 0.75 | **T1** | Branch B: no `sendShielded`. |
| T8 | Coin lifecycle: `Maybe` change-coin handling (**`is_some` branch on the final claim**), `mt_index` sourcing from the indexer. | 0.5 | T7 | The `none` case silently yields a zero default — this is the trap. |

---

## Phase 2 — Tests (2.5 d) — *15% of the rubric, and the cheapest marks available*

| # | Task | Est. | Depends | Notes |
|---|---|---:|---|---|
| T9 | Simulator harness + Merkle helper using the **contract's own hashers**. | 0.5 | T2 | **Reuse `research/experiments/multiheir/test/merkle.ts` and `research/experiments/multiheir/test/multiheir.test.ts` verbatim — already written and passing 7/7.** |
| T10 | Per-circuit happy paths: register, heartbeat, update, resolve, guardian, probate, duress. | 0.75 | T3–T6 | |
| T11 | Negative tests: early claim, double claim, wrong heir, wrong share, stale heartbeat, stale qualification, single-guardian, duplicate guardian, bad PIN. | 0.75 | T10 | 6 of these already pass in `a3`. |
| T12 | **Leak test** — `leaktest.py` against deployed serialized state, **high-entropy values + positive controls**. | 0.25 | T10 | B5: small ints (1, 3) collide with structural bytes. Blind or use 128-bit randoms. |
| T13 | **`leakcheck.py` in CI** — ZKIR private-var check on every circuit, every build. | 0.25 | T2 | Allowlist only `newVaultRoot`/`decoyRoot` with a written justification. |

---

## Phase 3 — Deploy and CLI (2 d)

| # | Task | Est. | Depends | Notes |
|---|---|---:|---|---|
| T14 | CLI: deploy + all circuit calls, **with the `Custom(170)` rebuild-and-re-prove retry loop**. | 1.0 | T7 | **Reuse `research/experiments/custody-probe/runner/src/{wallet,providers,keys,netid}.ts`** — proven working. Retry is non-optional. |
| T15 | Local devnet scripts (`standalone.yml` + funding), documented in the README. | 0.25 | T14 | Genesis seed `0x00…01`, funded, syncs in ~1 s. |
| T16 | **Preprod deployment**: faucet, DUST registration, full scenario, record contract address + tx hashes + block heights in `deployments/preprod.json`. | 0.75 | T14 | Faucet `midnight-tmnight-preprod.nethermind.dev`. Copy onepledge's deployment-record format — judges can verify it. |

---

## Phase 4 — Frontend (3 d)

| # | Task | Est. | Depends | Notes |
|---|---|---:|---|---|
| T17 | Wallet connect + private-state wiring. | 1.0 | T14 | **Reuse `example-zkloan/zkloan-credit-scorer-ui` (~50%)** — do not write private-state setup yourself (≥16-char password, no recovery). DApp Connector 4.0.1: `connect`, `getConfiguration`, `getShieldedAddresses`, `submitTransaction`. |
| T18 | Owner desk: register, heartbeat button + countdown, amend will, deposit. | 1.0 | T17 | |
| T19 | Heir claim flow (paste envelope → prove → claim) + probate view. | 0.75 | T17 | Envelope must carry **coinPublicKey *and* encryptionPublicKey** (A1b). |
| T20 | Live registry reader from the public indexer, no wallet needed. | 0.25 | T17 | **Reuse `onepledge/web` (~60–70%)** — closest existing pattern, updated for 0.31.1. |

---

## Phase 5 — Submission (2 d)

| # | Task | Est. | Depends | Notes |
|---|---|---:|---|---|
| T21 | README: architecture, setup, Midnight integration, how judges test it. | 0.5 | T16 | 40% of the score is Engineering & **README quality**. |
| T22 | Slide deck — lead with the **comparison slide** (C9) and the **probate** framing, not "privacy". | 0.5 | T21 | Rules require a deck. |
| T23 | Demo video: deposit → heartbeat → **`graceSeconds = 60`** → resolve → heir claims → probate opens. | 0.75 | T19 | **No block-time manipulation exists on the devnet** — compress the grace period instead. Works identically on Preprod. |
| T24 | Apache-2.0 headers, `midnightntwrk` topic, final rules check. | 0.25 | T21 | **Rules gate: net-new code only (D10).** |

---

## Wave split

| Wave | Deadline | Scope | New Midnight functionality a judge can diff |
|---|---|---|---|
| **Wave 1** | Sep 16 (2 days) | T0–T4, T9–T10. One compiling contract + witnessed private state + simulator tests. **No custody claims.** | Clears the technical gate honestly; claims nothing it cannot back |
| **Wave 2** | Sep 27 – Oct 17 | T5–T8, T11–T20. Shielded custody, Merkle beneficiaries, nullifiers, guardians, Preprod deploy, frontend | The substantial wave — where the 40% Engineering score is won |
| **Wave 3** | Oct 27 – Nov 16 | Probate, duress decoy, heartbeat mixing at scale, conditional bequests, successor-signer (C8) | Privacy depth + the DAO-continuity extension |

---

## Reuse summary

| Source | What to take | Saves |
|---|---|---|
| `research/experiments/multiheir/test/` | Merkle helper + 7 passing multi-heir tests | **~1 d** |
| `research/experiments/custody-probe/runner/src/` | wallet, providers, keys, netid, **170-retry loop** | **~1 d** |
| `example-zkloan` | `schnorr.compact` polyfill, UI wallet/private-state wiring | **~1 d** |
| `onepledge/web` | Indexer read/decode pattern, deployment-record format | **~0.5 d** |
| `nominee-contract/` | The contract itself + `leakcheck.py` | **~1.5 d** |

**~5 engineer-days of the 14.5 are already written and verified in this validation directory.**
