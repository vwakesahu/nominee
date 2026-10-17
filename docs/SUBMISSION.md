# Akindo submission copy

Paste-ready. Nothing here is committed.

---

## Tagline

**Add a nominee to your crypto. Nobody learns who.**

Backups if that one is taken or too long:

- Your crypto knows who comes next. Nobody else does.
- A nominee field for your wallet, with nobody watching.
- Inheritance for crypto that doesn't out your family.

---

## What it does

Nominee is a nominee field for your wallet.

Think about what happens at a bank. You open an account, somebody slides a form
across the desk and asks who should get this if anything happens to you, you
write a name down, and then you never think about it again. It's the most boring
piece of paperwork in your life and it quietly works for forty years.

Now think about your wallet. There's no form. There's a seed phrase somewhere in
a drawer and a vague intention to tell somebody about it one day.

Nominee is the form. You put money into a vault, write down who gets what, and
check in every so often. That check-in is the whole mechanism. While you keep
showing up, nothing happens. If you stop for longer than the grace period you
set, the vault opens and the people you named come and take what you left them.

What makes it worth building is what everybody else sees while all this is
going on, which is almost nothing. A vault exists. At some point a heartbeat
went quiet. Later, some claims happened. That's the entire public record. Not
your name, not theirs, not the amounts, not even how many people were on the
list. If you named three, nobody watching can tell it wasn't one, or seven.

And if waiting out a grace period is absurd because everyone already knows what
happened, two of the three guardians you picked can open it early.

Silence is not death, so the vault never treats it as death. When the grace
period lapses, anyone can ask the chain to open the vault, and what they get is
a window, not a payout. You close the window by checking in. If your device is
lost, your secret alone closes it. Your guardians can close it. Only if nobody
does, for the whole window, does the vault open. The check-in itself takes two
things: the secret you know and a signature from a device you hold, so a copied
seed phrase is not you.

The people you named need no wallet to claim. You fix each nominee's payout key
when you write the will, hand them a small envelope file, and when the time
comes they paste it into a web page. The chain pays that key and no other, so
even a stolen envelope pays the person you named.

## The problem it solves

There's about $68.7 billion of Bitcoin sitting in wallets nobody can open. Some
of that is lost drives and forgotten passwords. A lot of it belonged to people
who died, and their families found out the hard way that "not your keys, not
your coins" cuts both ways.

The odd thing is that this is a solved problem everywhere else. Banks solved it
with a form. Wills solved it a few centuries earlier. Crypto's answer is still
either "write your seed phrase on paper and hope" or "tell somebody you trust,
today, while you're alive and they might not be later."

I looked at what already exists and every option asks you to give something up.
Sarcophagus is properly trustless, but the recipient's address, the unlock time
and every single check-in are public, so you've announced your heir to anyone
who cares to look. Bitcoin timelocks leak the whole policy the moment anyone
spends, including the heir's pubkey. Casa and Inheriti keep it private by
holding it for you, which means a company now has a list of your family and can
be subpoenaed, breached, or simply go out of business. Exchanges know everything
and involve a court.

So the choice is trustless and public, or private and trusting somebody. I went
round that loop for a while before it clicked that the choice only exists
because chains are public by default. Midnight's isn't. It has a shielded pool
that hides value and a compiler that will statically prove a private value never
reaches public state, and with those two things together the choice just
disappears.

## Challenges I ran into

Most of my time went on a bug that had nothing to do with cryptography.

Every deploy failed with `expected instance of ContractMaintenanceAuthority`. I
went through the obvious suspects: duplicate wasm packages, import specifiers,
all nine dependency versions, the constructor arguments, the private state.
Nothing. Then two things landed at once. An old throwaway probe I'd written days
earlier still deployed perfectly, and my own code still failed when I ran it
from inside that probe's own `node_modules`. Same dependencies, same machine,
one works and one doesn't.

It was `tsx`. A transform-based TypeScript loader resolves the wasm bindings
under a second module URL, so the process quietly ends up holding two copies of
`ContractState`, and every `instanceof` check across that boundary returns
false. I measured it in the end: `cs instanceof ContractState` is `false` under
tsx and `true` under plain node, same object. The CLI now compiles with tsc and
spawns `node dist/index.js`, and it will never do anything else.

The rest were smaller but the same flavour. Guardian public keys are wasm-backed
JubjubPoints, and handing one to `deployContract` corrupts the deploy path
because the value gets consumed on transfer, so the constructor takes plain
field coordinates and rebuilds the point in-circuit. Midnight 0.31.1 has no
sha256, no sha3, no blake2b and no poseidon, so the Merkle tree and the Schnorr
challenge had to be built on the contract's own hashers, matching the exact
variant index the compiler generated, which you can only find by reading the
generated code. I used the Schnorr variant for a Merkle node and lost an evening.

Two questions I couldn't answer from docs I answered by experiment instead. Does
shielded custody actually work, or unshielded? I ran both against a live node in
the same block window: shielded accepted, unshielded rejected with `Custom(192)`.
That one result decided the architecture. And is `blockTime` seconds or
milliseconds, which changes every grace period in the contract? Seconds, proven
on chain rather than assumed.

The payout was the one I could not settle in Wave 1. A contract can hold a
shielded coin but cannot spend it without the coin's position in the Zswap
commitment tree, and the documented way to read that position back came up 0
every time. The answer was in midnightntwrk/servicedesk#187, where ekacin had
reported the same thing and Midnight confirmed it is 0 by construction for
contract-owned coins; the supported pattern is to capture the index with
`insertCoin` in the transaction that receives the coin. The ledger field became
a `QualifiedShieldedCoinInfo` map, `deposit` and `claim` write into it, and the
payout went live.

Then the deploy stopped fitting in a block. Thirteen verifier keys in one
transaction exceed node 1.0.0's per-block write budget (`Transaction would
exhaust the block limits`, 33,474 bytes written). The deploy now omits two keys
and the maintenance authority inserts them in two follow-up transactions.

## Technologies I used

Compact 0.31.1 for the circuits, against ledger-8.0.2 and runtime 0.16.0,
because that's what every live Midnight network actually runs, not the newest
version.

A TypeScript CLI on plain Node, talking to a self-hosted proof server, a local
Midnight node and an indexer through docker compose. The Merkle trees and
Schnorr signatures are hand-built in TypeScript on top of the contract's own
hashers, so the off-chain side and the in-circuit side agree byte for byte.

Vitest for the simulator suite, a Python pass over the ZKIR for the privacy
scan, Bun as the package manager, Next.js and shadcn for the landing page.

## How we built it

I validated everything before writing any of it. That's three reports in
`validation/`, five experiment harnesses, and every claim marked verified, false
or unverifiable with the command output sitting next to it. It's where the
shielded-versus-unshielded question got settled and where `blockTime` got pinned
down. A few things I'd assumed were possible turned out not to be, and finding
that out in week one instead of week three is the only reason there's a working
demo at all.

The design decision I'm happiest with is boring. It's one shared registry
contract serving every owner, rather than one contract per will. A contract per
will would turn each heartbeat into a per-person fingerprint and quietly undo
the whole point, and I'd never have noticed if I hadn't already sat down and
worked out what an observer could correlate.

Thirteen circuits, 151,714 rows, max k=16, 75 MB of proving keys. Claim is the
expensive one at 37,866 rows, because the share stays inside a Zswap commitment
and the circuit now spends the ledger's own qualified coin.

Then the demo. It runs the whole story with two panels side by side: what
actually happened on the left, what the chain got out of it on the right. That's
the entire pitch in one screen. You don't have to believe me about what stays
private, you just read the right-hand column and see what isn't there.

49 simulator tests. A privacy scan that walks the ZKIR and checks no private
variable ever reaches the public transcript, clean across all 13 circuits. And
a recorded live run of 17 accepted transactions on a real node, deploy through
`guardianResolve2of3`, with three shielded payouts from the contract in the
middle.

## What we learned

Privacy is an architecture decision, not a feature you add later. The
one-contract choice did more for the privacy story than any circuit I wrote.

Being upfront about the limits costs less than being caught. The README says
the proof server sees every witness, deposit amounts are public, the remaining
balance is observable, and heartbeat cadence is a timing fingerprint. All of
that is true and all of it is findable by anyone who looks, so it's better
coming from me.

And the hard parts weren't the cryptography. They were module identity, package
managers, wasm ownership and undocumented units.

## What's next for Nominee

Preprod. The contract runs end to end on the local devnet, and the deployment
to Preprod is the next step; when it lands, `deployments/preprod.json` carries
the address and every transaction hash.

Then the hardware. The device factor is real in the contract and the CLI ships
a stand-in signer with the two HTTP calls a device needs. An ESP32 with a pulse
sensor that signs only while it reads a pulse is the obvious next build, and it
should be said plainly: that raises the cost of faking liveness, it does not
make it impossible. A circuit verifies a signature, never a pulse.

After that there are two circuits already compiled, keyed and deployed but not
yet driven by the CLI. Probate disclosure lets an executor open exactly what a
court needs and nothing more. And a duress decoy proves one of two commitments
matched without revealing which, so a PIN handed over under coercion opens a
different vault entirely.

Honestly the legal framing matters more here than the cryptography. This is a
transfer mechanism, not a will, and probate disclosure is the thing that makes
it usable by people who have lawyers.

---

## Build with

```
Midnight
```

## Product Category (max 3)

```
Wallet Infrastructure
Privacy
Inheritance & Estate Planning
```

## Tags (max 10)

```
Compact
Zero-Knowledge Proofs
TypeScript
Zswap
Merkle Trees
Schnorr Signatures
Node.js
Next.js
Vitest
Docker
```

---

## Updates in this Wave

This is Wave 2. Wave 1 shipped the contract, the CLI demo and the validation
trail, with the payout running in the simulator. Wave 2 made the payout live
and answered the judge's questions in the contract itself.

**Links**

- Repo: https://github.com/vwakesahu/nominee
- Demo video: https://youtu.be/Fb69qNrujFU
- Deck: `docs/nominee-deck.pdf` in the repo
- Landing page: https://nominee.world
- Live run: `deployments/devnet.json` (17 accepted transactions, contract
  `5da98e56…e5cc67`)
- Preprod: pending. The record will be `deployments/preprod.json`.

### The payout is live

Wave 1's one unfinished piece. A contract could hold a shielded coin but not
spend it, because the coin's Merkle index was unreadable after the fact.
Midnight confirmed in midnightntwrk/servicedesk#187 (reported by ekacin, closed
2026-09-22) that the documented read is 0 by construction for contract-owned
coins and that the supported pattern is `insertCoin` in the receiving
transaction. `heldCoin` is now a `Map<Bytes<32>, QualifiedShieldedCoinInfo>`,
`deposit` and `claim` write into it, and the three nominees are paid by the
contract on a real node: blocks 659 and 663 from the CLI, and block 681 from
the heir web page, `heldCoin` going 1000 → 500 → 200 → removed. No simulator
anywhere on that path.

### The judge's questions, answered in the contract

The Wave 1 feedback asked how a heart rate could be proven to be the owner's,
whether proof of life comes from hardware, how identity theft and faked death
are prevented, and whether heirs needing a wallet would break adoption. Each
got a change to the circuits rather than a paragraph.

- **Two-factor heartbeat.** The owner leaf is now
  `H(secret, willRoot, deviceCommit)`. A heartbeat needs the secret and a
  Schnorr signature from the device over the timestamp, and so does
  `updateWill`. The device key never reaches the chain. A stolen seed can
  neither heartbeat nor rewrite who the vault pays. The CLI ships
  `nominee device`, a stand-in signer that refuses to sign without a pulse flag
  and exposes the same two HTTP calls an ESP32 with a pulse sensor would.
  Stated plainly: a circuit verifies a signature, never a pulse. This raises
  the cost of faking liveness; it does not make it impossible.
- **Veto window.** `resolve` no longer unlocks the vault. It opens a window of
  `challengeSeconds` (30 s in the demo, weeks when shipped). A heartbeat, a
  `veto` with the secret alone, or two of three guardians close it. `finalize`
  unlocks only after it passes unopposed. Death is never asserted, only
  absence, and absence can be contested. On the devnet: Ben's device is hidden,
  his vault is resolved against him, he vetoes with his secret, and the
  follow-up `finalize` is refused with `no open challenge`.
- **Payout key in the heir leaf.** `H(heirSecret, H(share), heirKey)`. A stolen
  envelope pays the nominee the owner named, never the thief.
- **Guardian signatures bound to the vault.** Wave 1's guardian message was the
  same for every vault, so one signature was replayable against all of them.
  It is now `[kind, tag, 0, 0]`; the demo replays Ben's signatures against
  Alice's vault and watches them fail.
- **No wallet to claim.** `bun run server` and `bun run web`: the nominee pastes
  the envelope into a page, sees the vault's state in one sentence, and claims.
  The owner fixed the payout key when writing the will. Proving runs on the
  server's self-hosted prover, which is acceptable here because a nominee's
  witnesses are only their own secret, share and path, never anything of the
  owner's.

### Numbers

13 circuits (was 10), max k=16, 151,714 rows, 75 MB of proving keys. 49
simulator tests (was 33), including veto closes a window, finalize before the
window fails, heartbeat without the device fails, claim with the wrong payout
key fails, guardian replay across tags fails, and the exact-remainder claim
removes the `heldCoin` entry. Leak check clean on all 13. 17 accepted
transactions in the recorded run, plus one deliberately refused `finalize`.

### Found along the way

A deploy carrying all 13 verifier keys exceeds node 1.0.0's per-block write
budget (`Transaction would exhaust the block limits`, 33,474 bytes written,
0.67 of the budget). The deploy omits two keys and the maintenance authority
inserts them in two follow-up transactions, 0.06 of a block each. Written up in
`docs/ARCHITECTURE.md` §9 for the next person.

### Still true

The proof server sees every witness and owners must self-host it. Deposit
amounts and the remaining balance are public. Heartbeat cadence is a timing
fingerprint. A long hospital stay still executes the will; the window and the
guardians lengthen the fuse, they do not remove it. And losing the device
freezes the will: `veto` still works with the secret alone, so resolution can
always be stopped, but amending the will means a new registry with a new device
commitment. The README and the threat model say so.

---

## 2nd Wave (this wave)

- Live shielded payout: claim lands on chain, three times in the recorded run
- Two-factor heartbeat with a device key; `nominee device` stand-in signer
- Veto window: resolve opens, heartbeat/veto/guardians close, finalize unlocks
- Guardian messages bound to the vault tag; payout key bound into the heir leaf
- Heir web app: paste an envelope, no wallet, no CLI
- Deploy to Preprod: pending

## 3rd Wave

- Probate disclosure: an executor opens what a court needs, nothing else
- Duress decoy: a PIN given under coercion opens a different vault
- Hardware device: ESP32 with a pulse sensor speaking the two signer calls
- DAO successor-signer
- Multi-asset vaults
