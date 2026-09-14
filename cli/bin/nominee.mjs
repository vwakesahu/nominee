#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const entry = resolve(here, '../src/index.ts');
const tsx = resolve(here, '../node_modules/.bin/tsx');
spawn(tsx, [entry, ...process.argv.slice(2)], { stdio: 'inherit' })
  .on('exit', (c) => process.exit(c ?? 0));
