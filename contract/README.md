# nominee-contract

The Compact contracts for Nominee. Target toolchain **0.31.1** (language 0.23.0, ledger-8.0.2), the version Preview, Preprod and Mainnet run. Do not build with 0.34.0; nothing here needs it and no live network accepts it.

## Build

```bash
compact compile +0.31.1 src/nominee.compact managed   # ~19 s, writes managed/
python3 tools/leakcheck.py                            # ZKIR privacy check
```

## Circuits

| Circuit | k | rows | Purpose |
|---|---:|---:|---|
| `register` | 14 | 11,099 | join the shared owner registry |
| `heartbeat` | 14 | 11,170 | proof of life; prover never sees will contents |
| `deposit` | 14 | 10,971 | fund the vault with a shielded coin |
| `updateWill` | 13 | 4,528 | replace the beneficiary root |
| `resolve` | 9 | 445 | permissionless, after the grace period |
| `guardianResolve2of3` | 12 | 3,356 | M-of-N Schnorr short-circuit |
| `guardianResolve3of5` | 13 | 4,876 | " |
| `claim` | **15** | **32,623** | nominee claims a private share |
| `openProbate` | 14 | 11,270 | scoped disclosure to a court |
| `resolveUnderPin` | 13 | 7,290 | duress decoy |
| **total** | **max k=15** | **97,628** | 40 MB proving keys |

`claim` sits at 99.6 % of the k=15 budget, anything added to it pushes k=16.

## Privacy check

`tools/leakcheck.py` reads the compiled ZKIR and asserts that no `private_input`
variable is ever `declare_pub_input`. Expected result: **8 circuits clean, 2
allowlisted** (`updateWill` var 16 = `newVaultRoot`, `resolveUnderPin` var 24 =
`decoyRoot`), both are Merkle roots published by design, each consumed by
exactly one instruction. Run it in CI.

## Files

- `src/nominee.compact`, the contract
- `src/schnorr.compact`, Jubjub Schnorr polyfill, vendored from `midnightntwrk/example-zkloan` (`jubjubSchnorrVerify` does not exist in 0.31.1)
- `tools/leakcheck.py`, ZKIR private-variable check

See [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) for the state layout, per-circuit disclosures and threat model.
