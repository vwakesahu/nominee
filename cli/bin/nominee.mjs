#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
//
// Runs the COMPILED CLI on plain node — never through a TS loader.
// tsx (and other transform-based loaders) resolve the wasm bindings under a
// second module URL, which puts two copies of ContractState in the process and
// makes every `instanceof` check across the boundary fail. Plain node keeps a
// single instance.
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const entry = resolve(here, '../dist/index.js');

if (!existsSync(entry)) {
  console.error('nominee: not built yet — run `npm run build` first.');
  process.exit(1);
}
spawn(process.execPath, [entry, ...process.argv.slice(2)], { stdio: 'inherit' })
  .on('exit', (c) => process.exit(c ?? 0));
