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
| `register` | 14 | 15,678 | join the shared owner registry; the leaf binds secret, will root and device key |
| `heartbeat` | 15 | 17,266 | proof of life, two factors: membership plus a device signature over the timestamp; closes an open veto window |
| `veto` | 14 | 15,751 | knowledge-only emergency path: closes an open veto window, refreshes lastSeen |
| `deposit` | 15 | 16,803 | fund the vault; `insertCoin` records the coin's Merkle index in the same transaction |
| `updateWill` | 13 | 4,528 | replace the beneficiary root |
| `resolve` | 10 | 511 | permissionless after the grace period; opens a veto window, does not unlock |
| `finalize` | 9 | 379 | permissionless after the veto window; unlocks the vault |
| `guardianResolve2of3` | 12 | 3,356 | M-of-N Schnorr short-circuit, message bound to the vault tag |
| `guardianResolve3of5` | 13 | 4,876 | " |
| `guardianVeto2of3` | 12 | 3,358 | guardians contest an open window |
| `claim` | **16** | **37,866** | nominee claims a private share; payout key bound into the leaf; spends the ledger's qualified coin |
| `openProbate` | 14 | 11,270 | scoped disclosure to a court |
| `resolveUnderPin` | 13 | 7,290 | duress decoy |
| **total** | **max k=16** | **138,332** | 66 MB proving keys |

Row counts from `zkir mock-compile` on 0.31.1. `claim` moved from k=15 to k=16
when it started spending the ledger's own `QualifiedShieldedCoinInfo`; the key
is 19 MB and still fine.

### Why `insertCoin`

A contract can hold a shielded coin but cannot spend it without the coin's
position in the global Zswap commitment tree (`mt_index`). The documented read,
`queryZSwapAndContractState(...).firstFree`, is 0 by construction for
contract-owned coins (midnightntwrk/servicedesk#187, confirmed by Midnight on
2026-09-22). The supported pattern is to capture the index in the transaction
that receives the coin: the ledger field is a `Map<Bytes<32>,
QualifiedShieldedCoinInfo>` and `deposit` calls `insertCoin`. `claim` then reads
the qualified coin straight from the ledger and re-inserts the change the same
way, or removes the entry on an exact remainder. No indexer lookup, no
`spendCoin` witness, no stale-coin asserts.

### Why two factors on the heartbeat

A circuit can verify a signature, never a pulse. The honest design is to make
liveness require something you know (the owner secret) and something you hold
(a device key whose commitment sits in the owner leaf). A stolen seed cannot
heartbeat. Losing the device is survivable: `veto` needs only the secret, so the
worst a seed thief can do is delay inheritance, never redirect it. The device is
anything that can sign a Jubjub Schnorr message; the CLI ships a stand-in
(`nominee device`) and an ESP32 with a pulse sensor implements the same two
calls.

## Privacy check

`tools/leakcheck.py` reads the compiled ZKIR and asserts that no `private_input`
variable is ever `declare_pub_input`. Expected result: **11 circuits clean, 2
allowlisted** (`updateWill` var 16 = `newVaultRoot`, `resolveUnderPin` var 24 =
`decoyRoot`), both are Merkle roots published by design, each consumed by
exactly one instruction. Run it in CI.

## Files

- `src/nominee.compact`, the contract
- `src/schnorr.compact`, Jubjub Schnorr polyfill, vendored from `midnightntwrk/example-zkloan` (`jubjubSchnorrVerify` does not exist in 0.31.1). Used for guardians and for the owner's device.
- `tools/leakcheck.py`, ZKIR private-variable check

See [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) for the state layout, per-circuit disclosures and threat model.
