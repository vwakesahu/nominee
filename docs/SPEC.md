# Nominee, Wave 2 build spec

**Date:** 2026-10-16. **Toolchain:** Compact 0.31.1, Midnight.js 4.1.1, wallet SDK 1.2.0, proof server 8.1.0.
**Status of the contract:** final. `contract/src/nominee.compact` compiles, 13 circuits, ZKIR leak check clean. Everything below builds on it. Nobody edits the contract without re-running `bun run leakcheck` and the row table.

This document is the contract between the people (and agents) building the CLI, the tests, the heir web app, the Preprod deployment and the docs. Each section states inputs, outputs and the acceptance test.

---

## 0. What changed in the contract, and why

| Change | Why | Judge question it answers |
|---|---|---|
| `heldCoin` is `Map<Bytes<32>, QualifiedShieldedCoinInfo>`; `deposit` and `claim` use `insertCoin` | `firstFree` is 0 by construction for contract-owned coins (midnightntwrk/servicedesk#187). Capturing the Merkle index in the receiving transaction is the supported pattern. The payout path now runs live. `spendCoin` witness removed; the two stale-coin asserts removed (the ledger is the source of truth). | "The payout runs in the simulator" |
| Owner leaf = `H(secret, willRoot, deviceCommit)`; `heartbeat` verifies a Schnorr signature from the device over `[2, now, 0, 0]` | Two factors: knowledge and possession. A stolen seed cannot heartbeat. The device key never reaches the chain (commitment in the leaf, signature as a witness). | "Does proof of life come from hardware?" |
| `veto(now)`: knowledge only, closes an open challenge | The emergency path when the device is lost or hidden. Someone with only the seed can delay inheritance, never redirect it. | "How do you prevent faking death?" |
| `resolve` opens a window of `challengeSeconds`; `finalize(tag, until)` unlocks after it; `heartbeat`/`veto`/`guardianVeto2of3` close it | Death is never asserted, only absence, and absence can be contested. | "How do you prevent faking death?" |
| Guardian messages are `[kind, degradeToTransient(tag), 0, 0]` (kind 1 = resolve, 3 = veto) | A guardian signature for one vault was replayable against every vault. Now bound to the tag. | Robustness |
| Heir leaf = `H(heirSecret, H(share), heirKey.bytes)` | A stolen envelope pays the heir the owner named, never the thief. | "How do you prevent identity theft?" |
| Constructor gains `challenge: Uint<64>` after `grace` | | |

### Circuit table (zkir mock-compile, 0.31.1)

| circuit | k | rows | public args | witnesses |
|---|---:|---:|---|---|
| register | 14 | 15,678 | none | ownerSecret, willRoot, ownerPath, devicePkX, devicePkY |
| heartbeat | 15 | 17,266 | now | + deviceSig |
| veto | 14 | 15,751 | now | ownerSecret, willRoot, ownerPath, devicePkX, devicePkY |
| deposit | 15 | 16,803 | coin | ownerSecret, willRoot |
| updateWill | 13 | 4,528 | none | ownerSecret, willRoot, newVaultRoot |
| resolve | 10 | 511 | tag, deadline | none |
| finalize | 9 | 379 | tag, until | none |
| guardianResolve2of3 | 12 | 3,356 | tag, g0, g1 | gSig0, gSig1 |
| guardianResolve3of5 | 13 | 4,876 | tag, g0, g1, g2 | gSig0..2 |
| guardianVeto2of3 | 12 | 3,358 | tag, g0, g1 | gSig0, gSig1 |
| claim | 16 | 37,866 | tag, heirKey | heirSecret, heirShare, heirPath |
| openProbate | 14 | 11,270 | tag, vaultCommit | totalValue, executorId, probateBlind, envelopeCipher |
| resolveUnderPin | 13 | 7,290 | tag, realCommit, decoyCommit | ownerSecret, pin, willRoot, decoyRoot |

Leak check: all 13 clean (`updateWill` var 16 and `resolveUnderPin` var 24 are Merkle roots, public by design, as before).

### Generated TypeScript surface (read off `contract/out/contract/index.js`)

The hash variant numbering SHIFTED. `cli/src/crypto.ts` must be updated to:

| method | hashes | used for |
|---|---|---|
| `_persistentHash_0` | `Vector<2, Field>` | device commitment |
| `_persistentHash_1` | `CoinPreimage` (stdlib) | not used off-chain |
| `_persistentHash_2` | `LeafPreimage{domain_sep: Bytes<6>, data: Bytes<32>}` | Merkle leaf digest |
| `_persistentHash_3` | `Uint<128>` | share |
| `_persistentHash_4` | `Vector<2, Bytes<32>>` | nullifier |
| `_persistentHash_5` | `Vector<3, Bytes<32>>` | owner tag, owner leaf, heir leaf |
| `_persistentHash_6` | `Uint<16>` | PIN |
| `_transientHash_0` | `SchnorrHashInput` | Schnorr challenge |
| `_transientHash_1` | `Vector<2, Field>` | Merkle node |
| `_degradeToTransient_0` | `Bytes<32> -> Field` | leaf digest, guardian message |
| `_ownerTag_0(sk, wr)` | | owner tag (unchanged) |
| `_deviceCommit_0(x, y)` | | device commitment |
| `_guardianMsg_0(kind, tag)` | | guardian message |

Witness names the generated `Contract` requires (all must be present):
`getSchnorrReduction, ownerSecret, willRoot, ownerPath, newVaultRoot, heirSecret, heirShare, heirPath, devicePkX, devicePkY, deviceSig, gSig0, gSig1, gSig2, totalValue, executorId, probateBlind, envelopeCipher, pin, decoyRoot`.

Constructor: `initialState(ctx, ownerSetDigest, grace, challenge, g0x, g0y, g1x, g1y, g2x, g2y)`.

Off-chain formulas (must match the circuit byte for byte):

```
deviceCommit = persistentHash_0([x, y])
ownerLeaf    = persistentHash_5([ownerSecret, willRoot, deviceCommit])
heirLeaf     = persistentHash_5([heirSecret, persistentHash_3(share), heirKeyBytes32])
nullifier    = persistentHash_4([pad32("nominee:nf:v1"), heirSecret])
DEVICE_MSG(now)        = [2n, now, 0n, 0n]
GUARDIAN_MSG(tag)      = [1n, degradeToTransient(tag), 0n, 0n]
GUARDIAN_VETO_MSG(tag) = [3n, degradeToTransient(tag), 0n, 0n]
```

---

## 1. CLI and tests (owner: cli-live)

**Inputs:** the contract above, `contract/out` (regenerated build with 13 proving keys), the existing `cli/src` and `test/`.

**Outputs:**

1. `cli/src/crypto.ts`: new variant indices; `deviceKeypair` (same shape as `GuardianKey`); `deviceCommit`; `ownerLeaf(c, sk, wr, device)`; `heirLeaf(c, sk, share, heirKey)`; `deviceMsg(now)`, `guardianMsg(tag)`, `guardianVetoMsg(tag)`.
2. `cli/src/witnesses.ts`: `Owner` gains `device: DeviceKey`; `Heir` gains `key: Uint8Array` (32 bytes, the heir's Zswap coin public key). Witnesses `devicePkX/Y`, `deviceSig` (signs `deviceMsg(now)` with the acting owner's device key; `now` must be passed in via private state field `heartbeatNow: bigint` set before each heartbeat). Guardian signatures sign `guardianMsg(tag)` or `guardianVetoMsg(tag)` depending on a private state field `guardianKind: 'resolve' | 'veto'` and `guardianTag: Uint8Array`. Remove `spendCoin`.
3. `cli/src/session.ts`: constructor passes `challenge`; remove `refreshCoin`; `SimSession`/`LiveSession` expose `finalize`, `veto`, `guardianVeto2of3`. `LiveSession.connect` accepts `witnessOverrides?: Record<string, Function>` merged over `makeWitnesses` (the web server uses this).
4. `cli/src/envelope.ts`: `exportEnvelope(cast, heirIndex, address, network): Envelope` and `envelopeWitnesses(envelope, hasher)` returning the overrides for `heirSecret`, `heirShare`, `heirPath`. Envelope format in §3.
5. `cli/src/commands/demo.ts` and `steps.ts`: the story becomes
   - Ch1 A life: register, deposit, heartbeat (device signs), updateWill, heartbeat. Write `deployments/envelopes/<heir>.json` for each heir (gitignored).
   - Ch2 Silence: countdown `grace`.
   - Ch3 Resolution: `resolve` opens the window. Countdown `challenge`. `finalize`.
   - Ch4 The nominees: three LIVE claims, each to the demo wallet's own coin public key (`walletProvider.getCoinPublicKey()`), so the wallet can resolve the encryption key. Print the tx hash and block per claim, and `heldCoin` after each. No SIMULATOR badge.
   - Ch5 Attacks fail (simulator is fine here, they are refusals): double claim; stranger; wrong share; **stolen seed, no device** (heartbeat with a fresh device key fails `Invalid attestation signature`); **stolen envelope, different payout key** (claim with a different `heirKey` fails `not a beneficiary`); **replayed guardian signature** (signature for Ben's tag presented for Alice's tag fails).
   - Ch6 Faked death (LIVE): Ben's device is "hidden". Grace lapses, `resolve` opens the window, Ben calls `veto` with his secret only. `finalize` then fails `no open challenge`. Then the guardian path: 2-of-3 `guardianResolve2of3` on Ben's vault.
   - Summary: update counts (13 circuits, max k=16), list what the chain learned.
6. `nominee device` subcommand (`cli/src/commands/device.ts`): a stand-in hardware signer. Holds a device key in `deployments/device.json` (gitignored), listens on `http://127.0.0.1:7777`, `POST /sign {kind, now}` (kind 2 heartbeat, kind 4 will update) returns `{announcement:{x,y}, response}` only when a "pulse" is present (flag `--pulse` or env `NOMINEE_PULSE=1`); otherwise 409. The demo's heartbeat step uses it when `NOMINEE_DEVICE_URL` is set, and signs in-process otherwise. Document that an ESP32 with a MAX30102 implements the same two endpoints.
7. `test/simulator/*`: update harness to the new constructor, leaves and witnesses. Keep the 33 passing tests (drop "stale coin qualification", it no longer exists). Add: veto closes a window; finalize before the window fails; finalize after the window resolves; heartbeat closes the window; heartbeat without the device key fails; claim with the wrong payout key fails; guardian signature replay across tags fails; guardianVeto closes the window; exact-remainder claim removes the `heldCoin` entry.
8. `deployments/devnet.json`: a fresh live run with every circuit except `openProbate`/`resolveUnderPin` accepted, including three `claim` transactions.
9. Default `NOMINEE_CHALLENGE=30` seconds for the demo (`config.ts`), alongside `NOMINEE_GRACE=60`.

**Acceptance:** `bun run test` green; `bun run leakcheck` green; `NOMINEE_LIVE=1 node cli/dist/index.js demo` completes on the local devnet with `claim` accepted three times and `deployments/devnet.json` updated; `node cli/dist/index.js demo` (simulator) completes.

---

## 2. Heir claim web app (owner: web-claim)

**Goal:** a non-technical heir pastes the envelope they were given and gets paid, without a CLI. Proving stays on a self-hosted proof server, but the heir's witnesses are only their own secret, share and path, so this is the one place where proving on someone else's machine is acceptable. Say so on the page.

**Inputs:** `cli/dist/*` (built CLI), `contract/out`, the envelope format in §3, the local devnet.

**Outputs:**

1. `server/` workspace, plain Node (never tsx, never bundled, for the wasm single-instance reason in the README). `node server/dist/index.js` serves on `http://127.0.0.1:8787`:
   - `GET /api/health` -> `{ ok, network, contractAddress }`
   - `GET /api/vault/:tag` -> public ledger view: `lastSeen`, `graceSeconds`, `challengeUntil` (or null), `resolved`, `claimsSpent`, `remaining` (`heldCoin.value` or null). This is read-only from the indexer; no wallet.
   - `POST /api/claim` body `{ envelope: Envelope }` -> `{ txHash, block, received, remaining }` or `{ error }`. Uses `LiveSession.connect(cast?, { address, witnessOverrides: envelopeWitnesses(envelope) })` and calls `claim(tag, { bytes: heirKey })`. Before the window closes, returns the structured reason (`vault not resolved`, `challenge window open until <t>`).
   - Simulator fallback when `NOMINEE_LIVE` is unset, so the UI can be developed before the devnet run.
2. `web/` (Next.js, already scaffolded with shadcn-style components under `web/components/ui`): one page with three states. Paste envelope -> shows vault status (from `/api/vault/:tag`) with a plain-English line ("The vault opened on <date>. Your share is ready." or "Still in the challenge window, <n> minutes left.") -> Claim button -> result with tx hash and the two-panel "what the chain saw" list (nullifier spent, identity NOWHERE, share HIDDEN). Mobile first. No wallet connection needed to claim; show the payout key from the envelope and explain it was fixed by the owner.
3. Root scripts: `bun run server`, `bun run web`. README section "Claim as an heir".

**Acceptance:** with the devnet up and a vault resolved by the CLI demo, pasting `deployments/envelopes/maya.json` into the page produces an accepted `claim` transaction and the page shows its hash.

---

## 3. Envelope format (v2)

Delivered off-chain. Contains the heir's secrets; treat like a seed phrase.

```json
{
  "version": 2,
  "network": "undeployed | preview | preprod",
  "contractAddress": "<hex>",
  "vaultTag": "<32-byte ownerTag, hex>",
  "heirSecret": "<32 bytes, hex>",
  "share": "<Uint<128> as decimal string>",
  "heirKey": "<32 bytes hex, the ZswapCoinPublicKey the owner bound into the leaf>",
  "merklePath": [{ "sibling": "<field as decimal string>", "goesLeft": true }, "... 16 entries"],
  "indexerUrl": "<http url>"
}
```

`heirLeaf = persistentHash_5([heirSecret, persistentHash_3(share), heirKey])`. The path is for depth 16 and was built by the owner against the vault root they published with `updateWill`.

---

## 4. Preprod (owner: preprod)

**Phase 1, reconnaissance, read-only, no transactions.** Inputs: the local env files (`.env`, `.env.*`, `.testnet-*`), `cli/src/config.ts`, the Preprod indexer and RPC. Outputs: a report naming (by file name only, never by content) which wallet has NIGHT and DUST on Preprod and is DUST-registered, whether Node 22 is installable here (`fnm`), whether the Preprod RPC accepts a websocket from this machine, and the exact command line to deploy. Go/no-go.

**Phase 2, deployment**, only after §1 is accepted and Phase 1 says go: `NOMINEE_NETWORK=preprod NOMINEE_LIVE=1 NOMINEE_MNEMONIC=... node cli/dist/index.js demo` with `NOMINEE_GRACE=60 NOMINEE_CHALLENGE=30`. Output: `deployments/preprod.json` with the contract address and every tx hash, and an explorer link per tx in the README.

---

## 5. Docs (owner: docs, runs last)

Inputs: the final numbers from §1 and §4. Outputs: `README.md` (run instructions for CLI, server and web; the new circuit table; a section "The judge's four questions", each answered in two or three sentences with the limit stated), `docs/ARCHITECTURE.md` (state layout, circuits, envelope v2, threat model rows for device, veto window, replay), `docs/SUBMISSION.md` ("Updates in this Wave"), `docs/SCRIPT.md` (new chapters). Remove every statement that the payout is simulator-only. Keep the "Honest limits" list and add: the device raises the cost of faking liveness, it does not make it impossible; the proof-server rule is strict for owners and relaxed for heirs.

---

## 6. Secrets

`.env`, `.env.*`, `.testnet-*`, `deployments/envelopes/`, `deployments/device.json` are gitignored. No agent prints a mnemonic, seed, Blockfrost id or heir secret into a report, a log that is committed, or a doc.
