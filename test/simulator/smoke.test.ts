// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect } from 'vitest';
import { Vault, makeOwner, makeHeir, GRACE, CHALLENGE } from './harness.js';

describe('smoke, the whole stack end to end', () => {
  it('register -> deposit -> heartbeat -> update -> resolve -> finalize -> claim', () => {
    const owners = [makeOwner('Alice'), makeOwner('Bob')];
    const heirs = [makeHeir('Maya', 500n), makeHeir('Raj', 300n), makeHeir('Sam', 200n)];
    const v = new Vault({ owners, heirs });

    // constructor wired the cohort root and the grace period
    expect(v.ledger.graceSeconds).toBe(GRACE);
    expect(v.ledger.challengeSeconds).toBe(CHALLENGE);
    expect(v.ledger.guardians.size()).toBe(3n);

    v.register();
    const tag = v.tag();
    expect(v.ledger.lastSeen.member(tag)).toBe(true);

    v.fund(1000n);
    expect(v.ledger.heldCoin.lookup(tag).value).toBe(1000n);

    const now = 1_000_000n;
    v.heartbeat(now);
    expect(v.ledger.lastSeen.lookup(tag)).toBe(now);

    // amend the will: a fresh beneficiary root, contents never revealed
    v.patch({ newVaultRoot: v.heirTree.digest() });
    v.updateWill();
    expect(v.ledger.willVersion.lookup(tag)).toBe(1n);

    // resolve once the grace period has elapsed: opens the veto window
    v.resolve(tag, now + GRACE);
    expect(v.ledger.resolvedVault.member(tag)).toBe(false);
    // nobody contests; finalize unlocks
    v.finalize(tag, now + GRACE + CHALLENGE);
    expect(v.ledger.resolvedVault.member(tag)).toBe(true);

    // the three nominees claim in sequence, each to the key bound in their leaf
    for (let i = 0; i < 3; i++) {
      v.patch({ activeHeir: i });
      v.claim(tag);
    }
    expect(v.ledger.spent.size()).toBe(3n);
    expect(v.ledger.heldCoin.member(tag)).toBe(false);
  });

  it('guardians can resolve early, 2 of 3', () => {
    const owners = [makeOwner('Alice')];
    const heirs = [makeHeir('Maya', 100n)];
    const v = new Vault({ owners, heirs });
    v.register();
    const tag = v.tag();
    v.guardianResolve2of3(tag, 0n, 1n);
    expect(v.ledger.resolvedVault.member(tag)).toBe(true);
  });
});
