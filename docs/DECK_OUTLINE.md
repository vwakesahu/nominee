# Nominee, deck outline

## Slide 1, Title

> # Nominee
> ### Add a nominee to your crypto. Nobody learns who.
> nominee.world · built on Midnight

## Slide 2, The problem
Your bank account has a nominee field. Your wallet does not. Every on-chain attempt to fix that either publishes who inherits, or hands the answer to a company.

## Slide 3, The comparison (the slide that wins the room)

| | Reveals the beneficiary | Trusts a company |
|---|---|---|
| Sarcophagus | Yes, recipient address, resurrection time, every check-in | No |
| Bitcoin timelock / miniscript | Yes, at spend: script policy, timelock, heir pubkey | No |
| Casa Inheritance | No | **Yes** |
| Inheriti | No | **Yes** |
| Coinbase | Yes, to the company and the court | **Yes** |
| **Nominee** | **No** | **No** |

## Slide 4, How it works
deposit → heartbeat (secret + device) → grace lapses → resolve opens a veto window → finalize → the contract pays each nominee → probate opens.
Owner keeps the nomination; the chain keeps one commitment.
The nominee pastes an envelope into a web page. No wallet to connect.

## Slide 5, What the chain sees
A vault exists. A heartbeat stopped. A window opened and nobody objected. N anonymous nullifiers were spent.
Not: who, how much, on what terms.

## Slide 6, Built and measured
13 circuits, max k=16, 151,714 rows, 75 MB keys, on the toolchain every live network runs.
Shielded custody verified on a live node; unshielded rejected with `Custom(192)` in the same block window.
The payout is live: three shielded claims paid by the contract in the recorded devnet run, `heldCoin` 1000 → 500 → 200 → removed.

## Slide 7, Probate, not evasion
A court gets total value and executor identity, and nothing else.
Lead with this. "Hides assets from probate" loses the room; "executes privately and hands the court its figures" wins it.

## Slide 8, Honest limits
The proof server sees every witness, self-host, always (strict for owners, relaxed for heirs).
Deposit amounts and the remaining balance are public.
The device raises the cost of faking liveness. It does not make it impossible.
Legal standing is a transfer mechanism, not a testamentary document.

## Slide 9, Close
> # Nominee
> ### Add a nominee to your crypto. Nobody learns who.
> nominee.world
