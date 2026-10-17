# demotoken (tNOM)

A **testnet-only** shielded token for the Nominee demo. Never deploy it on
mainnet: `mint` is permissionless, anyone can mint any amount to any key.

On a public testnet the funded wallet holds unshielded NIGHT and no shielded
native coins, and NIGHT cannot be shielded. Nominee's `deposit` and `claim`
accept a shielded coin of any colour, so the demo mints itself a shielded tNOM
coin and deposits that instead of a native coin. The vault, the claims and
their circuits are unchanged.

| circuit | k | rows | |
|---|---:|---:|---|
| `mint(amount, nonce, to)` | 14 | 10,391 | `mintShieldedToken` to a coin public key; stores the colour, bumps `minted` |

Colour = `tokenType(pad(32, "nominee:tnom:v1"), <contract address>)`, so every
deployment mints its own colour. The CLI reads it from the `color` ledger field
after the first mint.

## Build

`out/` is committed (like `contract/out/`), proving key included (5 MB), so the
CLI runs without the Compact toolchain. To rebuild, use absolute paths:

```bash
compact compile +0.31.1 "$PWD/contract/token/src/demotoken.compact" "$PWD/contract/token/out"
```

## Use

```bash
NOMINEE_DEPOSIT=token NOMINEE_LIVE=1 node cli/dist/index.js demo
```

`NOMINEE_DEPOSIT` defaults to `native` on the local devnet and `token`
elsewhere. Set `NOMINEE_TOKEN_CONTRACT=<address>` to mint from an existing
deployment instead of deploying a fresh one.
