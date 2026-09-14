# Experiments

Each directory is a self-contained harness. Numbers cited in the reports come from these.

| Directory | What it answers | Headline result |
|---|---|---|
| [`custody-probe/`](custody-probe/) | **Can a contract custody value on a live node?** One contract, four circuits, deployed to a local devnet. | **Shielded ACCEPTED** (block 183); **unshielded REJECTED `Custom(192)`** in the same block window. The control (`bump`) passed. |
| [`clock/`](clock/) | What units do `blockTimeGte`/`blockTimeLt` take? | **Unix SECONDS** — while the indexer reports block timestamps in **milliseconds**. Bracketed from both directions. |
| [`multiheir/`](multiheir/) | Does the multi-nominee claim sequence hold together? | **7/7 tests pass**, including stale-qualification and double-claim attacks. |
| [`capability-matrix/`](capability-matrix/) | What does Compact 0.31.1 actually provide? | Per-circuit row costs for hashes, Merkle proofs, guardians, probate, duress. |
| [`compact-limits/`](compact-limits/) | How big can a circuit get, and what do primitives cost? | keccak ≈ 4,215 rows per 136-byte block; secp256k1 ≈ 30k rows; native Jubjub `ecMul` = 355. |

## Running them

All of these need the local devnet and a proof server:

```bash
source ../tools/dockerenv.sh
cd <path-to>/midnight-local-dev
docker compose -f standalone.yml up -d     # node + indexer + proof server
npm start -- --fund-config ./accounts.json # fund the genesis wallet
```

Then, per experiment, see its own source. Two things will bite you:

- **`Custom(170) InvalidDustSpendProof` is routine.** The dust state advances while proving. **Rebuild and re-prove — never resubmit.** Every harness here has a retry loop.
- **Use Node 22.** Node 23+ has a built-in WebSocket that drops Preprod RPC submissions with wallet SDK 1.2.0.
