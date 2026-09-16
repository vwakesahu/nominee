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

Ten circuits, 97,628 rows, max k=15, 40MB of proving keys, nineteen seconds to
build. Claim is the expensive one at 32,623 rows, because the share stays inside
a Zswap commitment.

Then the demo. It runs the whole story with two panels side by side: what
actually happened on the left, what the chain got out of it on the right. That's
the entire pitch in one screen. You don't have to believe me about what stays
private, you just read the right-hand column and see what isn't there.

33 simulator tests. A privacy scan that walks the ZKIR and checks no private
variable ever reaches the public transcript, clean across all ten circuits. And
a recorded live run of 9 accepted transactions on a real node, deploy through
`guardianResolve2of3`.

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

The payout is the one piece that isn't live yet. Sending a shielded coin back
out from inside a contract isn't something Midnight can do today, so that step
runs in the simulator against the same circuit and the same checks, and the
precise diagnosis is written up in `validation/VALIDATION_FINAL.md`.

So: that payout path, then Preprod, then a frontend so this stops being a CLI.

After that there are two circuits already compiled and sitting there unwired.
Probate disclosure lets an executor open exactly what a court needs and nothing
more. And a duress decoy proves one of two commitments matched without revealing
which, so a PIN handed over under coercion opens a different vault entirely.

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

This is Wave 1, so everything below was built from nothing during it.

**Links**

- Repo: https://github.com/vwakesahu/nominee
- Demo video: https://youtu.be/Fb69qNrujFU
- Deck: `docs/nominee-deck.pdf` in the repo
- Landing page: https://nominee.world (placeholder for now, the product is a CLI
  this wave)

### I validated the idea before building it

Before writing a line of the product I spent the first stretch trying to kill
the idea. That work is in `validation/`: three reports, five experiment
harnesses, and the raw output behind them. Every claim is marked VERIFIED, FALSE
or UNVERIFIABLE with the command output next to it.

Two results changed the architecture:

- **Shielded custody works, unshielded does not.** I ran both deposit paths
  against a live node in the same block window. Shielded was accepted;
  unshielded came back `Custom(192)`. That is a controlled result, not a
  reading of the docs.
- **`blockTime` is seconds, not milliseconds.** Nobody could tell me, and it
  changes every grace period in the contract. Resolved on chain.

A few things I had assumed were possible turned out not to be, including the
shielded payout, which is why it is scoped honestly below instead of quietly
missing.

### The contract

`contract/src/nominee.compact`, ten circuits, compiled on Compact 0.31.1 against
ledger-8.0.2 and runtime 0.16.0, which is what every live Midnight network
actually runs.

| circuit | k | rows |
|---|---:|---:|
| register | 14 | 11,099 |
| heartbeat | 14 | 11,170 |
| deposit | 14 | 10,971 |
| updateWill | 13 | 4,528 |
| resolve | 9 | 445 |
| guardianResolve2of3 | 12 | 3,356 |
| guardianResolve3of5 | 13 | 4,876 |
| claim | 15 | 32,623 |
| openProbate | 14 | 11,270 |
| resolveUnderPin | 13 | 7,290 |
| **total** | **max k=15** | **97,628** |

40MB of proving keys, nineteen seconds to build. `contract/out/` is committed so
nobody needs the Compact toolchain to run this.

The structural decision is that it is **one shared registry serving every
owner**, not a contract per will. A contract per will would turn each heartbeat
into a per-person fingerprint and undo the whole point.

### The CLI and the demo

A TypeScript CLI that talks to a self-hosted proof server, a local Midnight node
and an indexer. Merkle trees and Schnorr signatures are hand-built on top of the
contract's own `persistentHash` and `transientHash`, because Midnight 0.31.1 has
no sha256, sha3, blake2b or poseidon, so the off-chain and in-circuit sides have
to agree byte for byte.

`./run-devnet.sh` brings up the devnet and runs the whole story in seven
chapters. Every step prints two panels: what actually happened on the left, what
the chain got out of it on the right. That is the demo. You do not have to take
my word for what stays private, you read the right-hand column and see what is
not there.

The chapters are: a life (register, deposit, heartbeat, update-will, heartbeat),
silence, resolution, the nominees claiming, three attacks failing, the guardian
path, and a summary.

### What is actually running on chain

A recorded live run is in `deployments/devnet.json`: **nine accepted
transactions** on a real node, deploy through `guardianResolve2of3`. Real
proofs, real blocks, a contract that genuinely holds a shielded coin.

Three attacks are run against it and all three are refused: a nominee claiming
twice (nullifier already spent), a stranger claiming (not in the beneficiary
tree), and a nominee claiming more than they were left (the share is bound into
their leaf).

### Tests and the privacy check

- **33 simulator tests**, all passing, across registry, claim, resolution and an
  end-to-end smoke test.
- **A ZKIR privacy scan** (`test/privacy/leakcheck.py`) that walks the compiled
  circuit and checks no private variable reaches the public transcript. It comes
  back clean on all ten circuits. Two circuits have disclosures that are there
  by design and are listed explicitly rather than suppressed.

### Written down honestly

The README names the limits before a judge finds them: the proof server sees
every witness so it must be self-hosted, deposit amounts are public because
circuit arguments are public, the outstanding balance is observable, heartbeat
cadence is a timing fingerprint that the shared registry blunts but does not
erase, a long hospital stay executes the will, and legally this is a transfer
mechanism rather than a will.

### The one thing not finished

The payout. Sending a shielded coin back out from inside a contract is not
something Midnight can do today. That step runs in the simulator against the
same circuit and the same checks, it is marked as simulator everywhere it
appears including in the deck and the demo output, and the precise diagnosis is
in `validation/VALIDATION_FINAL.md` §A1b.

### Next wave

The live payout path, deployment to Preprod, and a frontend so this stops being
a CLI. After that, two circuits that are already compiled but not wired up:
probate disclosure, and a duress decoy that proves one of two commitments
matched without revealing which.

---

## 2nd Wave

- Live shielded payout, so claim lands on chain instead of the simulator
- Deploy to Preprod
- Web frontend, connects to Lace, no CLI

## 3rd Wave

- Probate disclosure: an executor opens what a court needs, nothing else
- Duress decoy: a PIN given under coercion opens a different vault
- Multi-asset vaults
