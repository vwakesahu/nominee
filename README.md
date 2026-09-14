# Nominee
### Add a nominee to your crypto. Nobody learns who.
nominee.world · built on Midnight

---

A private, self-executing nomination for on-chain assets. You add a nominee the way you would on a bank account — except the chain never learns who they are, what they get, or on what terms.

The owner deposits shielded value into a contract and keeps the nomination itself on their own device; only a commitment goes on chain. A periodic zero-knowledge heartbeat proves the owner is alive and the nomination unchanged, revealing nothing. If the heartbeat stops and a grace period lapses, the vault resolves and each nominee claims their share by proving membership in a private beneficiary set, spending a one-time nullifier. Nominees learn nothing about each other. A court or tax authority can be handed a scoped disclosure that opens only the total value and the executor's identity.

## Why this needs Midnight

Every trustless inheritance design on a transparent chain reveals the beneficiary — at setup (Sarcophagus publishes the recipient address) or at execution (a Bitcoin timelock reveals the heir's key when spent). Every design that hides the beneficiary trusts a company (Casa, Inheriti, Coinbase). Nominee is the only one where the beneficiary set, the per-heir shares and the conditions are **never public**, while execution stays trustless and on-chain.

An observer sees exactly three things: a vault exists, a heartbeat stopped, and N anonymous nullifiers were spent.

## Status

| | |
|---|---|
| Compact toolchain | **0.31.1** (language 0.23.0, ledger-8.0.2) — the version Preview/Preprod/Mainnet run |
| Contract | 10 circuits, **max k=15**, 97,628 rows, 40 MB proving keys, 19.2 s keygen |
| Shielded custody | **Verified on a live node** — `receiveShielded` accepted (block 183) |
| Privacy check | ZKIR dataflow: **8/10 circuits clean**; the 2 flagged variables are Merkle roots published by design |
| Tests | multi-heir claim sequence **7/7 passing** |

## Layout

```
nominee-contract/   Compact source (nominee.compact, schnorr.compact) + simulator tests
nominee-cli/        deploy + circuit calls (with the Custom(170) rebuild-and-re-prove retry)
nominee-web/        owner desk, nominee claim flow, live registry reader
```

## Documents

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — state layout, circuits, disclosures, envelope format, threat model
- [`BUILD_PLAN.md`](BUILD_PLAN.md) — ordered tasks to a deployed Preprod demo
- [`VALIDATION_FINAL.md`](VALIDATION_FINAL.md) — the experiments that decided the design

## Licence

Apache-2.0. Repository topic: `midnightntwrk`.
