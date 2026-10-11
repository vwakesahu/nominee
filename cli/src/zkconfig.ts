// SPDX-License-Identifier: Apache-2.0
//
// Where the compiled contract lives. Deliberately its own module: `doctor` and
// the preflight checks need this path, and nothing else from the proving stack.
// Importing it from providers.ts would drag the whole wasm SDK in behind it and
// turn a filesystem check into a minute of module loading.
import { fileURLToPath } from 'node:url';

/** The committed contract build: contract/out (keys/ + zkir/). */
export const ZK_CONFIG_PATH =
  process.env.NOMINEE_ZK_PATH ?? fileURLToPath(new URL('../../contract/out', import.meta.url));
