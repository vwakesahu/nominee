// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, beforeEach } from 'vitest';
import { Vault, makeOwner, makeHeir, randKey } from './harness.js';
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
    v.updateWill(NOW);
    v.unlock(tag, NOW);
  });

  const claimAs = (i: number, key?: Uint8Array) => {
    v.patch({ activeHeir: i });
    return v.claim(tag, key);
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

  it('the exact-remainder claim removes the heldCoin entry', () => {
    claimAs(0); claimAs(1);
    expect(v.remaining(tag)).toBe(200n);
    claimAs(2);
    expect(v.ledger.heldCoin.member(tag)).toBe(false);
    expect(v.remaining(tag)).toBeNull();
  });

  it('the coin read from the ledger carries its Merkle index', () => {
    const held = v.ledger.heldCoin.lookup(tag);
    expect(typeof held.mt_index).toBe('bigint');
    expect(held.value).toBe(1000n);
  });

  it('rejects a double claim via the nullifier', () => {
    claimAs(0);
    expect(() => claimAs(0)).toThrow(/already claimed/);
  });

  it('rejects a non-beneficiary', () => {
    const stranger = makeHeir('Mallory', 100n);
    v.patch({ heirs: [...heirs, stranger] });
    expect(() => claimAs(3)).toThrow(/not a beneficiary/);
  });

  it('rejects a nominee claiming the wrong share', () => {
    // same secret, inflated share -> different leaf -> not in the tree
    v.patch({ heirs: [{ ...heirs[0], share: 900n }, heirs[1], heirs[2]] });
    expect(() => claimAs(0)).toThrow(/not a beneficiary/);
  });

  it('rejects a claim to a payout key other than the one bound in the leaf', () => {
    // a stolen envelope: right secret, right share, thief's own key
    expect(() => claimAs(0, randKey())).toThrow(/not a beneficiary/);
    expect(v.ledger.spent.size()).toBe(0n);
    // the real nominee is unaffected
    expect(() => claimAs(0)).not.toThrow();
  });

  it('rejects a share larger than the remaining balance', () => {
    claimAs(0); claimAs(1);            // 200 left
    v.patch({ heirs: [heirs[0], heirs[1], { ...heirs[2], share: 900n }] });
    expect(() => claimAs(2)).toThrow();
  });
});

describe('claim before resolution', () => {
  const NOW = 1_000_000n;

  it('is rejected while the vault is unresolved', () => {
    const heirs = [makeHeir('Maya', 100n)];
    const v = new Vault({ owners: [makeOwner('Alice')], heirs });
    v.register();
    const tag = v.tag();
    v.fund(100n);
    v.patch({ newVaultRoot: v.heirTree.digest() });
    v.updateWill(NOW);
    expect(() => v.claim(tag)).toThrow(/not resolved/);
  });

  it('is rejected while the veto window is still open', () => {
    const heirs = [makeHeir('Maya', 100n)];
    const v = new Vault({ owners: [makeOwner('Alice')], heirs });
    v.register();
    const tag = v.tag();
    v.fund(100n);
    v.heartbeat(NOW);
    v.patch({ newVaultRoot: v.heirTree.digest() });
    v.updateWill(NOW);
    v.resolve(tag, NOW + 60n);
    expect(() => v.claim(tag)).toThrow(/not resolved/);
  });
});
