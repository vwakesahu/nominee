// SPDX-License-Identifier: Apache-2.0
// register / heartbeat / update-will, the owner's side of the vault.
import { describe, it, expect, beforeEach } from 'vitest';
import { Vault, makeOwner, makeHeir, withoutDevice } from './harness.js';
import type { Owner } from '../../cli/src/witnesses.js';

describe('register', () => {
  let owners: Owner[];
  let v: Vault;

  beforeEach(() => {
    owners = [makeOwner('Alice'), makeOwner('Bob'), makeOwner('Carol')];
    v = new Vault({ owners, heirs: [makeHeir('Maya', 100n)] });
  });

  it('registers an owner who is in the deployed cohort', () => {
    v.register();
    expect(v.ledger.lastSeen.member(v.tag())).toBe(true);
    expect(v.ledger.willVersion.lookup(v.tag())).toBe(0n);
  });

  it('registers every member of the cohort under a distinct tag', () => {
    const tags: string[] = [];
    for (let i = 0; i < owners.length; i++) {
      v.actAs(i);
      v.register();
      tags.push(Buffer.from(v.tag()).toString('hex'));
    }
    expect(new Set(tags).size).toBe(owners.length);
  });

  it('rejects someone who is not in the cohort', () => {
    v.patch({ owner: makeOwner('Mallory') });
    expect(() => v.register()).toThrow();
  });

  it('re-registering the same owner is idempotent on the tag', () => {
    v.register();
    const before = v.ledger.lastSeen.member(v.tag());
    v.register();
    expect(v.ledger.lastSeen.member(v.tag())).toBe(before);
  });
});

describe('heartbeat', () => {
  let v: Vault;
  beforeEach(() => {
    v = new Vault({ owners: [makeOwner('Alice'), makeOwner('Bob')], heirs: [makeHeir('Maya', 100n)] });
    v.register();
  });

  it('records the timestamp under the owner tag', () => {
    v.heartbeat(1_000_000n);
    expect(v.ledger.lastSeen.lookup(v.tag())).toBe(1_000_000n);
  });

  it('a later heartbeat moves lastSeen forward', () => {
    v.heartbeat(1_000_000n);
    v.heartbeat(1_000_060n);
    expect(v.ledger.lastSeen.lookup(v.tag())).toBe(1_000_060n);
  });

  it('rejects a heartbeat from someone outside the cohort', () => {
    v.patch({ owner: makeOwner('Mallory') });
    expect(() => v.heartbeat(1_000_000n)).toThrow();
  });

  it('one owner cannot heartbeat for another, the tag differs', () => {
    v.heartbeat(1_000_000n);
    const aliceTag = v.tag();
    v.actAs(1);
    v.register();
    v.heartbeat(2_000_000n);
    expect(v.ledger.lastSeen.lookup(aliceTag)).toBe(1_000_000n);
    expect(v.ledger.lastSeen.lookup(v.tag())).toBe(2_000_000n);
  });
});

describe('updateWill', () => {
  const alice = makeOwner('Alice');
  const NOW = 1_000_000n;
  let v: Vault;
  beforeEach(() => {
    v = new Vault({ owners: [alice], heirs: [makeHeir('Maya', 100n)] });
    v.register();
    v.patch({ newVaultRoot: v.heirTree.digest() });
  });

  it('replaces the beneficiary root and bumps the version (secret AND device)', () => {
    v.updateWill(NOW);
    expect(v.ledger.willVersion.lookup(v.tag())).toBe(1n);
    expect(v.ledger.vaultRoot.lookup(v.tag()).field).toBe(v.heirTree.root());
  });

  it('increments the version on every amendment', () => {
    v.updateWill(NOW); v.updateWill(NOW + 1n); v.updateWill(NOW + 2n);
    expect(v.ledger.willVersion.lookup(v.tag())).toBe(3n);
  });

  it('rejects an unregistered owner', () => {
    const other = new Vault({ owners: [makeOwner('Alice')], heirs: [makeHeir('Maya', 100n)] });
    other.patch({ newVaultRoot: other.heirTree.digest() });
    expect(() => other.updateWill(NOW)).toThrow(/unknown owner/);
  });

  it('is refused without the device key (a stolen seed cannot rewrite the will)', () => {
    v.patch({ owner: withoutDevice(alice) });
    expect(() => v.updateWill(NOW)).toThrow(/Invalid attestation signature/);
    expect(v.ledger.willVersion.lookup(v.tag())).toBe(0n);
  });

  it('refuses a heartbeat device signature replayed into updateWill (different message kind)', () => {
    // the device signed [2, now, 0, 0]; updateWill verifies [4, now, 0, 0]
    v.patch({ heartbeatNow: NOW, deviceKind: 2 });
    expect(() => v.rawCall('updateWill', NOW)).toThrow(/Invalid attestation signature/);
    expect(v.ledger.willVersion.lookup(v.tag())).toBe(0n);
  });

  it('refuses a timestamp in the future', () => {
    expect(() => v.updateWill(BigInt(Math.floor(Date.now() / 1000)) + 3600n)).toThrow(/timestamp in the future/);
  });
});
