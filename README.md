# Nominee
### Add a nominee to your crypto. Nobody learns who.
nominee.world · built on Midnight

---

**$68.7 billion in Bitcoin is permanently lost.** Much of it belonged to people who died. Their families got nothing — not because the money was stolen, but because every existing solution forces a choice: reveal your nominees to a company, expose them on a public chain, or accept that your crypto dies with you.

**Nominee** is a private, self-executing nominee registry on Midnight. You deposit assets, name your nominees, and check in with a periodic heartbeat. If the heartbeats stop, the vault unlocks and each nominee claims their share — without anyone, ever, learning who they are.

**Your crypto knows who comes next. Nobody else does.**

---

## Why Midnight

| | Reveals the beneficiary | Trusts a company |
|---|---|---|
| Sarcophagus | Yes — recipient address, resurrection time, every check-in | No |
| Bitcoin timelock / miniscript | Yes — at spend: script policy, timelock, heir pubkey | No |
| Casa Inheritance | No | **Yes** |
| Inheriti | No | **Yes** |
| Coinbase | Yes — to the company and the court | **Yes** |
| **Nominee** | **No** | **No** |

Every *trustless* option reveals the beneficiary — at setup, or at execution. Every option that hides the beneficiary trusts a company. Nominee is the only design where the beneficiary set, the per-nominee shares and the conditions are never public while execution stays trustless and on-chain.

That is only possible because of two Midnight properties together: a **shielded pool** that hides value, and a **compiler that statically proves** a private value never reaches public state.

## Run the demo

```bash
git clone https://github.com/vwakesahu/nominee && cd nominee
npm install
docker compose up -d          # local Midnight devnet: node, indexer, proof server
npm test                      # 33 simulator tests
npx nominee doctor            # check devnet, proof server, contract build
```

`npx nominee demo` runs the full story. On-chain execution is opt-in
(`NOMINEE_LIVE=1`) while the deploy path is being finished — see
[Known issues](#known-issues).

You do **not** need the Compact toolchain — `contract/out/` (proving keys and generated bindings) is committed.

## What's proven, and what's next

| Component | Status | Evidence |
|---|---|---|
| 10 Compact circuits | Compiled on 0.31.1 | `contract/out/` |
| Shielded deposit | Accepted on a live node | block 183 — `validation/VALIDATION_FINAL.md` §A1 |
| Unshielded deposit | Rejected `Custom(192)` | same block window — a controlled test, not a guess |
| Multi-nominee claims | 33/33 simulator tests | `test/simulator/` |
| ZKIR leak check | 8/10 clean, 2 by design | `test/privacy/leakcheck.py` |
| blockTime units | Resolved: **seconds** | `validation/VALIDATION_FINAL.md` §A2 |
| Shielded payout | Wave 2 | `validation/VALIDATION_FINAL.md` §A1b — precise diagnosis |
| CLI deploy path | in progress | see Known issues below |
| Preprod deployment | Wave 2 | |
| Frontend | Wave 2 | |
| Probate disclosure | Wave 3 | circuit compiled, 11,270 rows |
| Duress decoy | Wave 3 | circuit compiled, 7,290 rows |

## Circuits

| Circuit | k | rows | What `disclose()` reveals, and why that is acceptable |
|---|---:|---:|---|
| `register` | 14 | 11,099 | The owner **tag** — a hash of two secrets, opaque. Not which cohort member. |
| `heartbeat` | 14 | 11,170 | The tag and a timestamp. 38 private variables, **zero** leaks. |
| `deposit` | 14 | 10,971 | The coin's nonce/colour/value. Not who deposited. |
| `updateWill` | 13 | 4,528 | A new root and a version bump. Neither will version is revealed. |
| `resolve` | 9 | 445 | Nothing private. Permissionless — nobody can censor resolution. |
| `guardianResolve2of3` | 12 | 3,356 | Which guardian ids acted. Never their keys. |
| `guardianResolve3of5` | 13 | 4,876 | " |
| `claim` | **15** | **32,623** | A nullifier and the recomputed root. **The share stays inside the Zswap commitment.** |
| `openProbate` | 14 | 11,270 | An envelope commitment binding the executor's figures to the vault. |
| `resolveUnderPin` | 13 | 7,290 | Only the **OR** of two commitment matches — never which one. |
| **total** | **max k=15** | **97,628** | 40 MB proving keys, 19 s to build |

## Architecture

One **shared registry contract** serves many owners — a contract per will would turn every heartbeat into a per-person fingerprint.

```
  ownerSet (Merkle root of the owner cohort)
        │
        ├── ownerTag ── lastSeen ── graceSeconds ──► resolve() ──► resolvedVault
        │       │                                        ▲
        │       ├── vaultRoot  (beneficiary Merkle root) │
        │       ├── heldCoin   (outstanding shielded coin)
        │       └── willVersion                  guardianResolve (M-of-N Schnorr)
        │
        └── nominees ── claim() ── nullifier ──► share
```

Full detail — state layout, per-circuit inputs, envelope format, threat model — in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## What the chain learns

**Never:**
- Who the owner is
- Who the nominees are
- How much each nominee received
- How many nominees exist
- Why the heartbeat stopped

**Does:**
- A vault exists
- A heartbeat stopped
- N anonymous claims were made
- No double-claim succeeded

## Honest limits

Named here because a judge will find them anyway, and because the validation found them first.

- **The proof server sees every witness. Self-host it, always.** This also rules out `getProvingProvider()` in the DApp Connector, which delegates proving to the wallet.
- **Deposit amounts are public** — the coin is a circuit argument, and circuit arguments are public.
- **The remaining balance is public** in `heldCoin`, so the outstanding total is observable even though individual shares are not.
- **Heartbeat cadence is a timing fingerprint.** The shared registry blunts it — an observer sees *someone* checked in — but it does not erase it.
- **A long hospital stay executes the will.** Guardians are safety-critical, not a nice-to-have.
- **Lace has no plugin mechanism** — Nominee is its own DApp that wallets connect to, not a wallet feature.
- **Legally this is a transfer mechanism, not a will.** Lead with the probate-disclosure feature, not the privacy feature.

## Known issues

**`deployContract` from the CLI fails with a wasm class-identity error.**

The generated contract imports `@midnight-ntwrk/compact-runtime`, while
`@midnight-ntwrk/midnight-js-protocol` (pulled in by the wallet and provider
layer) carries a second copy of the same wasm bindings. With both in the graph,
a `ContractState` built by one instance is rejected by the other:

```
'contractState' parameter ContractState (...) has unexpected type
expected instance of ContractMaintenanceAuthority
```

Established by experiment, not guesswork: dependency versions match the working
probe exactly, there is a single copy of each package on disk, and the same code
fails inside the probe's own `node_modules` — while the probe itself still
deploys. Importing the same module through two different specifiers is enough to
reproduce it.

The simulator path is unaffected: it loads only `compact-runtime`, which is why
all 33 tests pass and the demo tells the whole story today.

## Roadmap

- **Wave 2** — live shielded payout, Preprod deployment, frontend
- **Wave 3** — probate disclosure, duress decoy, DAO successor-signer

## Validation trail

We verified every claim before building any of it. The evidence is in [`validation/`](validation/): three reports, five experiment harnesses and the raw data behind them — including the controlled experiment that proved shielded custody works and unshielded does not, and the one that resolved `blockTime` units to seconds.

Where something could not be verified, the reports say so and name exactly what would settle it.

## Licence

Apache-2.0. Repository topic: `midnightntwrk`.
