# Headless DUST bootstrapping on Preprod — blocked

**Ask:** how does a headless (CLI, no browser wallet) Midnight wallet obtain its
first DUST on Preprod, so it can pay the fee for any transaction at all?

## Environment
- Network: **preprod** (`wss://rpc.preprod.midnight.network`, indexer `api/v4/graphql`)
- Node.js **22.23.2** (not 23+, so the known built-in-WebSocket issue does not apply)
- `@midnight-ntwrk/wallet-sdk` **1.2.0**, `midnight-js-*` **4.1.1**, `ledger-v8` **8.1.0**
- Proof server **8.1.0**, local, healthy
- Compact toolchain **0.31.1**

## Wallet state
- Unshielded balance: **5,000,000,000 tNIGHT** (one UTxO, from the preprod faucet)
- DUST: **0**
- `availableCoins[0].meta.registeredForDustGeneration` = **false**
- Unshielded sync completes: `607633/607633`

## What fails

### 1. Deploy
`deployContract(...)` → `Insufficient Funds: could not balance dust`.
Expected, given DUST = 0.

### 2. `facade.estimateRegistration(nightUtxos)`
**Hangs indefinitely** (observed 45+ min at 80% CPU, RSS ~310 MB, no result).
Appears to require the DUST wallet's full generation-event history, which on
Preprod is a multi-hour cold scan. During it, the shielded and dust wallets
repeatedly emit:
```
Wallet.Sync: [object CloseEvent]   (wallet-sdk-shielded/dist/v1/Sync.js:126)
Wallet.Sync: [object ErrorEvent]   (wallet-sdk-dust-wallet/dist/v1/Sync.js:133)
```

### 3. `facade.registerNightUtxosForDustGeneration(...)` (skipping the estimate)
Builds a recipe and finalizes it fine, then submission fails, reproducibly:
```
SubmissionError: Transaction submission error
  [cause]: SubmissionError: Transaction submission failed
    [cause]: Error: disconnected from wss://rpc.preprod.midnight.network/: 1000:: Normal Closure
```

## What we ruled out
- **Proof server** — healthy (`{"status":"ok"}`), all Zswap keys fetched and verified,
  and its access log shows it received **zero** proving requests. Not involved.
- **RPC endpoint** — a standalone WebSocket to the same URL opens in ~500 ms, answers
  `system_chain` / `system_health` / `chain_getHeader`, reports 13 peers, `isSyncing:false`,
  and stays open indefinitely. Healthy.
- **Node 23+ WebSocket issue** — running Node 22.
- **UTxO shape** — `registerNightUtxosForDustGeneration` takes the unshielded wallet's
  nested `{ utxo, meta }` objects. (Note: the dust package's exported `UtxoWithMeta`
  type is declared as the *flat* intersection `Utxo & { ctime, registeredForDustGeneration }`,
  and passing that flat shape instead throws
  `Cannot read properties of undefined (reading 'ctime')`. Two different types share
  the name `UtxoWithMeta` across the unshielded and dust packages.)
- **Dropping the last `facade.state()` subscriber** — holding a live subscription across
  submission does not change the outcome.

## The bootstrapping question
DUST pays fees, and NIGHT only generates DUST once its UTxOs are registered — but the
registration is itself a transaction that needs a fee. `waitForGeneratedDust` is
documented to bridge this ("call before `registerNightUtxosForDustGeneration` so the
registration covers its own fee"), but it depends on the dust sync that does not
complete here.

**Is there a supported headless path?** Options that would each answer it:
- a way to start the DUST wallet from a recent index rather than genesis
  (`DustWallet.restore(serializedState)` exists — is a published checkpoint available?)
- a faucet that dispenses DUST directly
- confirmation that a browser wallet (Lace) is currently the only way to perform the
  initial registration

## Reproduction
`nominee register-dust --direct` in https://github.com/vwakesahu/nominee
