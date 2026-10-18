#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
//
// Runs the CLI from source through tsx, so there is no build step for CLI users.
// This used to be impossible: tsx loaded the contract's ESM bindings as
// CommonJS and put two copies of compact-runtime in the process. The fix was
// `"type": "module"` in contract/package.json (see README). If tsx is not
// installed, fall back to the compiled build in dist/ (`bun run build`), which
// the claim server also uses.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
// Workspaces may hoist tsx to the repo root.
const tsx = [resolve(here, '../node_modules/.bin/tsx'), resolve(here, '../../node_modules/.bin/tsx')]
  .find(existsSync);
const dist = resolve(here, '../dist/index.js');

const [cmd, args] = tsx
  ? [tsx, [resolve(here, '../src/index.ts')]]
  : existsSync(dist)
    ? [process.execPath, [dist]]
    : [null, []];
if (!cmd) {
  console.error('nominee: neither tsx nor a build was found. Run `bun install` from the repo root.');
  process.exit(1);
}
spawn(cmd, [...args, ...process.argv.slice(2)], { stdio: 'inherit' })
  .on('exit', (c) => process.exit(c ?? 0));
