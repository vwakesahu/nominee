// SPDX-License-Identifier: Apache-2.0
// resolve (opens a veto window after grace), finalize (unlocks after the
// window), veto / heartbeat / guardianVeto (close the window), and
// guardianResolve (M-of-N, early).
import { describe, it, expect, beforeEach } from 'vitest';
import { Vault, makeOwner, makeHeir, withoutDevice, GRACE, CHALLENGE } from './harness.js';

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

  it('opens a veto window when the deadline is exactly lastSeen + graceSeconds', () => {
    v.resolve(tag, NOW + GRACE);
    expect(v.ledger.challengeUntil.member(tag)).toBe(true);
    expect(v.ledger.challengeUntil.lookup(tag)).toBe(NOW + GRACE + CHALLENGE);
    expect(v.ledger.resolvedVault.member(tag)).toBe(false);
  });

  it('rejects a deadline that is not lastSeen + graceSeconds', () => {
    expect(() => v.resolve(tag, NOW + GRACE - 1n)).toThrow(/bad deadline/);
    expect(() => v.resolve(tag, NOW + GRACE + 1n)).toThrow(/bad deadline/);
  });

  it('rejects an unknown owner tag', () => {
    const bogus = new Uint8Array(32).fill(7);
    expect(() => v.resolve(bogus, NOW + GRACE)).toThrow(/unknown owner/);
  });

  it('is idempotent, resolving twice leaves one window', () => {
    v.resolve(tag, NOW + GRACE);
    v.resolve(tag, NOW + GRACE);
    expect(v.ledger.challengeUntil.size()).toBe(1n);
  });

  it('a later heartbeat moves the deadline, invalidating the old one', () => {
    v.heartbeat(NOW + 100n);
    expect(() => v.resolve(tag, NOW + GRACE)).toThrow(/bad deadline/);
    v.resolve(tag, NOW + 100n + GRACE);
    expect(v.ledger.challengeUntil.member(tag)).toBe(true);
  });
});

describe('finalize', () => {
  let v: Vault;
  let tag: Uint8Array;

  beforeEach(() => {
    v = new Vault({ owners: [makeOwner('Alice')], heirs: [makeHeir('Maya', 100n)] });
    v.register();
    tag = v.tag();
    v.heartbeat(NOW);
  });

  it('fails before a window is open', () => {
    expect(() => v.finalize(tag, NOW + GRACE + CHALLENGE)).toThrow(/no open challenge/);
  });

  it('fails with the wrong window end', () => {
    v.resolve(tag, NOW + GRACE);
    expect(() => v.finalize(tag, NOW + GRACE + CHALLENGE - 1n)).toThrow(/bad challenge deadline/);
  });

  it('resolves the vault once the window has closed', () => {
    v.resolve(tag, NOW + GRACE);
    v.finalize(tag, NOW + GRACE + CHALLENGE);
    expect(v.ledger.resolvedVault.member(tag)).toBe(true);
    expect(v.ledger.challengeUntil.member(tag)).toBe(false);
  });
});

describe('contesting the window', () => {
  let v: Vault;
  let tag: Uint8Array;
  const owner = makeOwner('Alice');

  beforeEach(() => {
    v = new Vault({ owners: [owner], heirs: [makeHeir('Maya', 100n)] });
    v.register();
    tag = v.tag();
    v.heartbeat(NOW);
    v.resolve(tag, NOW + GRACE);
    expect(v.ledger.challengeUntil.member(tag)).toBe(true);
  });

  it('veto (secret only, no device signature) closes the window and refreshes lastSeen', () => {
    v.patch({ owner: withoutDevice(owner) });   // the device is not even consulted
    v.veto(NOW + GRACE + 5n);
    expect(v.ledger.challengeUntil.member(tag)).toBe(false);
    expect(v.ledger.lastSeen.lookup(tag)).toBe(NOW + GRACE + 5n);
    expect(() => v.finalize(tag, NOW + GRACE + CHALLENGE)).toThrow(/no open challenge/);
  });

  it('veto without an open window is refused', () => {
    v.veto(NOW + GRACE + 5n);
    expect(() => v.veto(NOW + GRACE + 6n)).toThrow(/no open challenge/);
  });

  it('a heartbeat closes the window', () => {
    v.heartbeat(NOW + GRACE + 5n);
    expect(v.ledger.challengeUntil.member(tag)).toBe(false);
    expect(() => v.finalize(tag, NOW + GRACE + CHALLENGE)).toThrow(/no open challenge/);
  });

  it('a heartbeat without the device key is refused', () => {
    v.patch({ owner: withoutDevice(owner) });
    expect(() => v.heartbeat(NOW + GRACE + 5n)).toThrow(/Invalid attestation signature/);
    expect(v.ledger.challengeUntil.member(tag)).toBe(true);   // the window stays open
  });

  it('2-of-3 guardians veto the window', () => {
    v.guardianVeto2of3(tag, 0n, 1n);
    expect(v.ledger.challengeUntil.member(tag)).toBe(false);
    expect(v.ledger.resolvedVault.member(tag)).toBe(false);
  });

  it('a guardian RESOLVE signature cannot be used as a veto', () => {
    v.patch({ attesting: [0, 1], guardianKind: 'resolve', guardianTag: tag });
    expect(() => v['call']('guardianVeto2of3', tag, 0n, 1n)).toThrow(/Invalid attestation signature/);
  });
});

describe('guardianResolve', () => {
  let v: Vault;
  let tag: Uint8Array;

  beforeEach(() => {
    v = new Vault({ owners: [makeOwner('Alice'), makeOwner('Ben')], heirs: [makeHeir('Maya', 100n)] });
    v.register();
    tag = v.tag();
  });

  it('2-of-3 guardians resolve the vault early', () => {
    v.guardianResolve2of3(tag, 0n, 1n);
    expect(v.ledger.resolvedVault.member(tag)).toBe(true);
  });

  it('accepts any two distinct guardians', () => {
    v.guardianResolve2of3(tag, 1n, 2n);
    expect(v.ledger.resolvedVault.member(tag)).toBe(true);
  });

  it('rejects the same guardian signing twice', () => {
    expect(() => v.guardianResolve2of3(tag, 1n, 1n)).toThrow(/strictly increase/);
  });

  it('rejects guardian ids out of order', () => {
    expect(() => v.guardianResolve2of3(tag, 1n, 0n)).toThrow(/strictly increase/);
  });

  it('rejects an unregistered guardian id', () => {
    expect(() => v.guardianResolve2of3(tag, 0n, 9n)).toThrow(/unknown guardian/);
  });

  it('rejects a signature from the wrong key', () => {
    // guardian 2 signs but claims to be guardian 1
    v.patch({ attesting: [0, 2], guardianKind: 'resolve', guardianTag: tag });
    expect(() => v['call']('guardianResolve2of3', tag, 0n, 1n)).toThrow(/Invalid attestation signature/);
  });

  it('rejects a signature replayed from another vault', () => {
    v.actAs(1); v.register();
    const benTag = v.tag();
    // signed for Ben's vault, presented against Alice's
    expect(() => v.guardianResolve2of3(tag, 0n, 1n, benTag)).toThrow(/Invalid attestation signature/);
    expect(v.ledger.resolvedVault.member(tag)).toBe(false);
  });

  it('3-of-5 shape resolves with three distinct guardians', () => {
    v.guardianResolve3of5(tag, 0n, 1n, 2n);
    expect(v.ledger.resolvedVault.member(tag)).toBe(true);
  });
});
