// SPDX-License-Identifier: Apache-2.0
// resolve (permissionless, after grace) and guardianResolve (M-of-N, early).
import { describe, it, expect, beforeEach } from 'vitest';
import { Vault, makeOwner, makeHeir, GRACE } from './harness.js';

const NOW = 1_000_000n;

describe('resolve', () => {
  let v: Vault;
  let tag: Uint8Array;

  beforeEach(() => {
    v = new Vault({ owners: [makeOwner('Alice')], heirs: [makeHeir('Maya', 100n)] });
    v.register();
    tag = v.tag();
    v.heartbeat(NOW);
  });

  it('resolves when the deadline is exactly lastSeen + graceSeconds', () => {
    v.resolve(tag, NOW + GRACE);
    expect(v.ledger.resolvedVault.member(tag)).toBe(true);
  });

  it('rejects a deadline that is not lastSeen + graceSeconds', () => {
    expect(() => v.resolve(tag, NOW + GRACE - 1n)).toThrow(/bad deadline/);
    expect(() => v.resolve(tag, NOW + GRACE + 1n)).toThrow(/bad deadline/);
  });

  it('rejects an unknown owner tag', () => {
    const bogus = new Uint8Array(32).fill(7);
    expect(() => v.resolve(bogus, NOW + GRACE)).toThrow(/unknown owner/);
  });

  it('is idempotent — resolving twice leaves one entry', () => {
    v.resolve(tag, NOW + GRACE);
    v.resolve(tag, NOW + GRACE);
    expect(v.ledger.resolvedVault.size()).toBe(1n);
  });

  it('a later heartbeat moves the deadline, invalidating the old one', () => {
    v.heartbeat(NOW + 100n);
    expect(() => v.resolve(tag, NOW + GRACE)).toThrow(/bad deadline/);
    v.resolve(tag, NOW + 100n + GRACE);
    expect(v.ledger.resolvedVault.member(tag)).toBe(true);
  });
});

describe('guardianResolve', () => {
  let v: Vault;
  let tag: Uint8Array;

  beforeEach(() => {
    v = new Vault({ owners: [makeOwner('Alice')], heirs: [makeHeir('Maya', 100n)] });
    v.register();
    tag = v.tag();
  });

  it('2-of-3 guardians resolve the vault early', () => {
    v.patch({ attesting: [0, 1] });
    v.guardianResolve2of3(tag, 0n, 1n);
    expect(v.ledger.resolvedVault.member(tag)).toBe(true);
  });

  it('accepts any two distinct guardians', () => {
    v.patch({ attesting: [1, 2] });
    v.guardianResolve2of3(tag, 1n, 2n);
    expect(v.ledger.resolvedVault.member(tag)).toBe(true);
  });

  it('rejects the same guardian signing twice', () => {
    v.patch({ attesting: [1, 1] });
    expect(() => v.guardianResolve2of3(tag, 1n, 1n)).toThrow(/strictly increase/);
  });

  it('rejects guardian ids out of order', () => {
    v.patch({ attesting: [1, 0] });
    expect(() => v.guardianResolve2of3(tag, 1n, 0n)).toThrow(/strictly increase/);
  });

  it('rejects an unregistered guardian id', () => {
    v.patch({ attesting: [0, 1] });
    expect(() => v.guardianResolve2of3(tag, 0n, 9n)).toThrow(/unknown guardian/);
  });

  it('rejects a signature from the wrong key', () => {
    // guardian 2 signs but claims to be guardian 1
    v.patch({ attesting: [0, 2] });
    expect(() => v.guardianResolve2of3(tag, 0n, 1n)).toThrow(/Invalid attestation signature/);
  });

  it('3-of-5 shape resolves with three distinct guardians', () => {
    v.patch({ attesting: [0, 1, 2] });
    v.guardianResolve3of5(tag, 0n, 1n, 2n);
    expect(v.ledger.resolvedVault.member(tag)).toBe(true);
  });
});
