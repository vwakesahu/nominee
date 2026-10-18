// SPDX-License-Identifier: Apache-2.0
//
// Where the cohort's secrets come from.
//
// The demo can use fresh randomness, it deploys and calls in one process, so
// nothing needs to outlive it. A real deployment cannot: the constructor commits
// to the owner-tree root and the guardian public keys, so if the matching
// secrets are only in memory, the contract is un-callable the moment the process
// exits. Deriving them from the wallet seed makes a deployment reproducible from
// the one thing the operator already has to keep, and keeps them off disk.
//
// Derivation is sha256(seed || domain || label), one-way, so a leaked cohort
// secret says nothing about the wallet seed.
import { createHash, randomBytes } from 'node:crypto';
import { JUBJUB_ORDER } from './crypto.js';

export interface SecretSource {
  /** 32 bytes for `label`. Deterministic sources return the same bytes forever. */
  bytes32(label: string): Uint8Array;
  /** A non-zero Jubjub scalar for `label`. */
  scalar(label: string): bigint;
  /** True when this source reproduces across runs. */
  readonly deterministic: boolean;
}

const DOMAIN = 'nominee:cast:v1';

/** Fresh randomness, different on every call. For the simulator and the demo. */
export function randomSecrets(): SecretSource {
  return {
    deterministic: false,
    bytes32: () => new Uint8Array(randomBytes(32)),
    scalar: () => {
      const v = BigInt('0x' + randomBytes(32).toString('hex')) % JUBJUB_ORDER;
      return v === 0n ? 1n : v;
    },
  };
}

/** Reproducible secrets bound to a wallet seed. For anything that outlives the process. */
export function seededSecrets(seedHex: string, domain = DOMAIN): SecretSource {
  const seed = Buffer.from(seedHex, 'hex');
  const derive = (label: string) =>
    new Uint8Array(
      createHash('sha256').update(seed).update(Buffer.from(`${domain}|${label}`, 'utf8')).digest(),
    );
  return {
    deterministic: true,
    bytes32: derive,
    scalar: (label) => {
      // Reduce rather than reject, and step the label on the (vanishing) zero
      // case so the derivation stays a pure function of the label.
      const v = BigInt('0x' + Buffer.from(derive(`scalar|${label}`)).toString('hex')) % JUBJUB_ORDER;
      return v === 0n ? BigInt('0x' + Buffer.from(derive(`scalar|${label}|1`)).toString('hex')) % JUBJUB_ORDER || 1n : v;
    },
  };
}
