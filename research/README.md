# Research

The validation trail behind Nominee. Every claim in these reports was produced by
compiling, deploying or querying — not from memory. Where something could not be
verified, the report says so and names what would be needed.

## Reports, in the order they were produced

| # | Report | Question | Outcome |
|---|---|---|---|
| 01 | [Lending idea — rejected](reports/01-lending-idea-rejected.md) | Private overcollateralised lending with collateral on Cardano/Ethereum | **Rejected.** Cross-chain verification is undeployable on Ethereum (needs toolchain 0.34.0, which no live network accepts) and structurally impossible on Cardano (no `blake2b`, no UTxO inclusion proofs). Crowded field. |
| 02 | [Nominee idea — selected](reports/02-nominee-idea-selected.md) | A private, self-executing nomination | **Selected, 19/20 vs 12/20.** Nothing like it across 439 Midnight repos or either Devpost gallery. All primitives available on the live toolchain. |
| 03 | [Final validation gate](reports/03-final-validation-gate.md) | Resolve every open item by executing it | **GO.** Shielded custody verified on a live node. One residual risk: the exit path. |

## Experiments

See [`experiments/`](experiments/README.md) — each directory is a self-contained harness that produced numbers cited in the reports.

## Evidence

[`evidence/`](evidence/) holds the raw artifacts the reports cite: the AKINDO
programme JSON, the Official Rules PDF (`sha256 3400b47a…`) and its extracted
text, the Compact standard library source, the Midnight docs index, the list of
all 439 `midnightntwrk`-topic repositories, and a real serialized Preprod
contract state.

## Tools

- `tools/leaktest.py` — byte-scans serialized on-chain state for private values, with positive controls
- `tools/dockerenv.sh` — points the shell at Docker Desktop's socket
- `tools/compact-installer.sh` — the Compact CLI installer (v0.5.2) as fetched

## Not included

`priorart/` — 19 third-party repositories cloned for the prior-art review. They
are other people's code with their own licences and git history, so they are
gitignored. The lists of what to clone are in reports 02 and 03.
