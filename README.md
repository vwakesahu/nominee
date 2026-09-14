# Nominee
### Add a nominee to your crypto. Nobody learns who.
nominee.world · built on Midnight

---

Your bank account has a nominee field. Your wallet does not. Every on-chain attempt to fix that either publishes who inherits, or hands the answer to a company.

Nominee is a private, self-executing nomination for on-chain assets. The owner deposits shielded value into a contract and keeps the nomination itself on their own device — only a commitment goes on chain. A periodic zero-knowledge heartbeat proves the owner is alive and the nomination unchanged, revealing nothing. If the heartbeat stops and a grace period lapses, the vault resolves and each nominee claims their share by proving membership in a private beneficiary set and spending a one-time nullifier. Nominees learn nothing about each other. A court or tax authority can be handed a scoped disclosure that opens only the total value and the executor's identity.

**What an observer sees: a vault exists, a heartbeat stopped, and N anonymous nullifiers were spent.** Not who, not how much, not on what terms.

## Why this needs Midnight

| | Reveals the beneficiary | Trusts a company |
|---|---|---|
| Sarcophagus | Yes — recipient address, resurrection time, every check-in | No |
| Bitcoin timelock / miniscript | Yes — at spend: script policy, timelock, heir pubkey | No |
| Casa Inheritance | No | **Yes** |
| Inheriti | No | **Yes** |
| Coinbase | Yes — to the company and the court | **Yes** |
| **Nominee** | **No** | **No** |

Every *trustless* option reveals the beneficiary. Every option that hides the beneficiary trusts a company. Nominee is the only design where the beneficiary set, the per-nominee shares and the conditions are never public while execution stays trustless and on-chain — and that is only possible because of Midnight's shielded pool plus compiler-enforced selective disclosure.

## Status

| | |
|---|---|
| Compact toolchain | **0.31.1** — the version Preview/Preprod/Mainnet run (not 0.34.0) |
| Contract | 10 circuits, **max k=15**, 97,628 rows, 40 MB proving keys, 19.2 s keygen |
| Shielded custody | **Verified on a live node** — `receiveShielded` accepted at block 183; `receiveUnshielded` rejected `Custom(192)` in the same block window |
| Privacy check | ZKIR dataflow: **8/10 circuits clean**; the 2 flagged variables are Merkle roots published by design |
| Tests | multi-nominee claim sequence **7/7 passing** |
| Open risk | **The exit path.** Deposit is proven; `sendShielded` from the contract is not yet working — see report 03 §A1b |

## Layout

```
nominee-contract/     Compact contracts + the ZKIR privacy check
docs/                 architecture, build plan, deck outline
research/             the validation trail: reports, experiments, evidence
```

| Path | What it is |
|---|---|
| [`nominee-contract/`](nominee-contract/) | `nominee.compact`, the Schnorr polyfill, `tools/leakcheck.py` |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | state layout, every circuit's inputs and disclosures, envelope format, threat model |
| [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) | ordered tasks to a deployed Preprod demo, in engineer-days |
| [`docs/DECK_OUTLINE.md`](docs/DECK_OUTLINE.md) | pitch structure |
| [`research/`](research/README.md) | three validation reports, five experiment harnesses, raw evidence |

Still to come, per the build plan: `nominee-cli/` (T14) and `nominee-web/` (T17).

## Build

```bash
# Compact toolchain 0.31.1
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
compact update 0.31.1

npm run compact      # compile the contract   (~19 s)
npm run leakcheck    # ZKIR privacy check
npm test             # multi-nominee simulator tests
```

Running the experiments needs Docker (node + indexer + proof server) — see [`research/experiments/README.md`](research/experiments/README.md).

## Honest limits

- **The proof server sees every witness. Self-host it, always.** This also rules out `getProvingProvider()` in the DApp Connector, which delegates proving to the wallet.
- **Deposit amounts and the remaining balance are public.** Identities and shares are not.
- **Lace has no plugin mechanism** — Nominee is its own DApp that wallets connect to, not a wallet feature.
- **Legally this is a transfer mechanism, not a testamentary document.** Lead with the probate-disclosure feature, not the privacy feature.

## Licence

Apache-2.0. Repository topic: `midnightntwrk`.
