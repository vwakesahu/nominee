// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, beforeEach } from 'vitest';
import { Vault, makeOwner, makeHeir, randKey, GRACE } from './harness.js';
import type { Heir } from '../../cli/src/witnesses.js';

describe('claim', () => {
  let v: Vault;
  let heirs: Heir[];
  let tag: Uint8Array;
  const NOW = 1_000_000n;

  beforeEach(() => {
    heirs = [makeHeir('Maya', 500n), makeHeir('Raj', 300n), makeHeir('Sam', 200n)];
    v = new Vault({ owners: [makeOwner('Alice')], heirs });
    v.register();
    tag = v.tag();
    v.fund(1000n);
    v.heartbeat(NOW);
    v.patch({ newVaultRoot: v.heirTree.digest() });
    v.updateWill();
    v.resolve(tag, NOW + GRACE);
  });

  const claimAs = (i: number) => {
    v.patch({ activeHeir: i });
    v.refreshCoin();
    return v.claim(tag, randKey());
  };

  it('three nominees claim in sequence and the residual falls to zero', () => {
    claimAs(0);
    expect(v.ledger.heldCoin.lookup(tag).value).toBe(500n);
    claimAs(1);
    expect(v.ledger.heldCoin.lookup(tag).value).toBe(200n);
    claimAs(2);
    expect(v.ledger.spent.size()).toBe(3n);
  });

  it('the third nominee can still claim after the first two', () => {
    claimAs(0); claimAs(1);
    expect(() => claimAs(2)).not.toThrow();
  });

  it('rejects a double claim via the nullifier', () => {
    claimAs(0);
    expect(() => claimAs(0)).toThrow(/already claimed/);
  });

  it('rejects a stale coin qualification', () => {
    v.patch({ activeHeir: 0 });
    v.refreshCoin();
    const stale = { ...v.ps.spendCoin! };
    claimAs(0);
    // second nominee replays the coin as it was before the first claim
    v.patch({ activeHeir: 1, spendCoin: stale });
    expect(() => v.claim(tag, randKey())).toThrow(/stale coin/);
  });

  it('rejects a non-beneficiary', () => {
    const stranger = makeHeir('Mallory', 100n);
    v.patch({ heirs: [...heirs, stranger] });
    expect(() => claimAs(3)).toThrow();
  });

  it('rejects a nominee claiming the wrong share', () => {
    // same secret, inflated share -> different leaf -> not in the tree
    v.patch({ heirs: [{ ...heirs[0], share: 900n }, heirs[1], heirs[2]] });
    expect(() => claimAs(0)).toThrow();
  });

  it('rejects a share larger than the remaining balance', () => {
    claimAs(0); claimAs(1);            // 200 left
    v.patch({ heirs: [heirs[0], heirs[1], { ...heirs[2], share: 900n }] });
    expect(() => claimAs(2)).toThrow();
  });
});

describe('claim before resolution', () => {
  it('is rejected while the vault is unresolved', () => {
    const heirs = [makeHeir('Maya', 100n)];
    const v = new Vault({ owners: [makeOwner('Alice')], heirs });
    v.register();
    const tag = v.tag();
    v.fund(100n);
    v.patch({ newVaultRoot: v.heirTree.digest() });
    v.updateWill();
    v.refreshCoin();
    expect(() => v.claim(tag, randKey())).toThrow(/not resolved/);
  });
});
