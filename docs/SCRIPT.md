# Video script

Bracketed lines are for the editor.

---

**[1]**

Hi, I'm Vivek. I built Nominee. You add a nominee to your crypto and nobody
finds out who.

**[2]**

Sixty-eight billion dollars of Bitcoin is stuck in wallets nobody can open. A
lot of it belonged to people who died. My bank has a nominee field. My wallet
doesn't.

**[3]**

I deposit, name who gets what, and check in. If I stop, the contract pays my
nominees. The chain sees a vault, a heartbeat going quiet, and a few claims with
no names on them. Not my name, theirs, the amounts, or how many.

**[4]**

Last wave the payout ran in a simulator. This wave it runs on the node.

**[5, start the run]**

Let me show you.

**[chapter 1, speed up the proving waits]**

Alice registers and just a tag lands. She deposits a shielded coin. Her
check-ins take her secret plus a signature from a device she holds; the device
key never touches the chain. She rewrites her will and neither version shows up.

**[countdown, real speed]**

Then she stops.

**[resolve and the window]**

Grace runs out. Resolve doesn't open the vault, it opens a window. Alice, or her
guardians, could still object. Nobody does, and finalize goes through.

**[claims]**

The contract pays her nominees. A thousand, five hundred, two hundred, gone. You
can't tell who is who, or how many came.

**[attacks]**

Then I try to break it. Same nominee twice. A stranger. Too large a share. A
thief with the seed but not the device. A stolen envelope. A replayed guardian
signature. None get through.

**[faked death]**

Ben's device is hidden, so his vault gets resolved against him. His secret alone
closes the window. Later, when he really is gone, two of his guardians open it.

**[heir page]**

And his nominee needs no wallet. She pastes her envelope and she's paid.

**[close]**

The device makes faking a life expensive, not impossible. A circuit checks a
signature, not a pulse.

That's Nominee. nominee.world.

---

## Notes

- About 290 words, ninety seconds spoken at demo pace. The rest is demo footage.
- Cut the proving waits. Leave both countdowns at real speed.
- Don't read what's on screen.
- If a `Custom(170)` retry shows up, leave it in. It recovers on its own.
- Chapter order on screen: 1 A life, 2 Silence, 3 Resolution, 4 The nominees,
  5 Attacks fail, 6 Faked death, Summary. The heir page is a separate capture
  (`docs/screenshots/6-heir-claim.png` shows the end state).
