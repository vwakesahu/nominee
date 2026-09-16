// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect } from 'vitest';
import { Vault, makeOwner, makeHeir, randKey, GRACE } from './harness.js';

describe('smoke, the whole stack end to end', () => {
  it('register -> deposit -> heartbeat -> update -> resolve -> claim', () => {
    const owners = [makeOwner('Alice'), makeOwner('Bob')];
    const heirs = [makeHeir('Maya', 500n), makeHeir('Raj', 300n), makeHeir('Sam', 200n)];
    const v = new Vault({ owners, heirs });

    // constructor wired the cohort root and the grace period
    expect(v.ledger.graceSeconds).toBe(GRACE);
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

    // resolve once the grace period has elapsed
    v.resolve(tag, now + GRACE);
    expect(v.ledger.resolvedVault.member(tag)).toBe(true);

    // the three nominees claim in sequence
    for (let i = 0; i < 3; i++) {
      v.patch({ activeHeir: i });
      v.refreshCoin();
      v.claim(tag, randKey());
    }
    expect(v.ledger.spent.size()).toBe(3n);
  });

  it('guardians can resolve early, 2 of 3', () => {
    const owners = [makeOwner('Alice')];
    const heirs = [makeHeir('Maya', 100n)];
    const v = new Vault({ owners, heirs });
    v.register();
    const tag = v.tag();
    v.patch({ attesting: [0, 1] });
    v.guardianResolve2of3(tag, 0n, 1n);
    expect(v.ledger.resolvedVault.member(tag)).toBe(true);
  });
});
