// SPDX-License-Identifier: Apache-2.0
// The two-panel printer. Left: what happened, in human terms.
// Right: what the chain actually saw, and, crucially, what it did NOT.
import chalk from 'chalk';

const W_LEFT = 34;
const W_RIGHT = 37;

/** 0x{first4}…{last4} */
export function short(v: Uint8Array | string | bigint | number | undefined | null): string {
  if (v === undefined || v === null) return ', ';
  let hex: string;
  if (typeof v === 'bigint' || typeof v === 'number') hex = BigInt(v).toString(16);
  else if (typeof v === 'string') hex = v.replace(/^0x/, '');
  else hex = Buffer.from(v).toString('hex');
  if (hex.length <= 12) return `0x${hex}`;
  return `0x${hex.slice(0, 4)}…${hex.slice(-4)}`;
}

/** Markers for values a naive observer might expect to find on chain. */
export const NOWHERE = '__NOWHERE__';
export const HIDDEN = '__HIDDEN__';
export const NEVER = '__NEVER__';
export const UNDISCLOSED = '__UNDISCLOSED__';

const MARKERS: Record<string, string> = {
  [NOWHERE]: 'NOWHERE',
  [HIDDEN]: 'HIDDEN IN COMMITMENT',
  [NEVER]: 'NEVER STORED',
  [UNDISCLOSED]: 'NOT DISCLOSED',
};

const ANSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');
const vlen = (s: string) => s.replace(ANSI, '').length;
const padEnd = (s: string, w: number) => s + ' '.repeat(Math.max(0, w - vlen(s)));

function wrap(text: string, width: number): string[] {
  const words = String(text).split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > width) { lines.push(cur); cur = w; }
    else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

type Row = [string, string];

/**
 * @param title  the action, e.g. "register"
 * @param left   plain-English narration
 * @param right  [label, value] pairs. Use NOWHERE / HIDDEN / NEVER / UNDISCLOSED
 *               for anything the chain deliberately does not hold.
 * @param tag    optional badge, e.g. "SIMULATOR"
 */
export function panel(title: string, left: string[], right: Row[], tag?: string) {
  const badge = tag ? ' ' + chalk.bgYellow.black(` ${tag} `) : '';
  const lh = ' What happened' + badge;
  const rh = ' What the chain saw ';

  const top =
    '┌─' + chalk.bold(lh) + '─'.repeat(Math.max(0, W_LEFT - vlen(lh))) +
    '┬─' + chalk.bold(rh) + '─'.repeat(Math.max(0, W_RIGHT - vlen(rh))) + '┐';

  const leftLines: string[] = [];
  for (const l of left) for (const w of wrap(l, W_LEFT - 1)) leftLines.push(w);

  const rightLines: string[] = [];
  for (const [k, v] of right) {
    const marker = MARKERS[v];
    if (marker) {
      for (const w of wrap(`${k}: ${marker}`, W_RIGHT - 1)) {
        rightLines.push(
          w.includes(marker) ? chalk.dim(w.replace(marker, '')) + chalk.cyanBright.bold(marker) : chalk.dim(w),
        );
      }
    } else {
      for (const w of wrap(`${k}: ${v}`, W_RIGHT - 1)) rightLines.push(chalk.dim(w));
    }
  }

  const n = Math.max(leftLines.length, rightLines.length);
  console.log('\n  ' + chalk.bold.white(title));
  console.log(top);
  for (let i = 0; i < n; i++) {
    console.log('│ ' + padEnd(leftLines[i] ?? '', W_LEFT) + '│ ' + padEnd(rightLines[i] ?? '', W_RIGHT) + '│');
  }
  console.log('└' + '─'.repeat(W_LEFT + 1) + '┴' + '─'.repeat(W_RIGHT + 1) + '┘');
}

export function chapter(n: number | string, title: string) {
  const head = `━━━ Chapter ${n}: ${title} `;
  console.log('\n' + chalk.bold.magenta(head + '━'.repeat(Math.max(0, 74 - head.length))) + '\n');
}

export function banner() {
  const line = (s: string) => '║' + padEnd(' ' + s, 70) + '║';
  console.log(chalk.bold.cyan('\n╔' + '═'.repeat(70) + '╗'));
  console.log(chalk.bold.cyan(line('NOMINEE, Demo')));
  console.log(chalk.cyan(line('"Your crypto knows who comes next. Nobody else does."')));
  console.log(chalk.bold.cyan('╚' + '═'.repeat(70) + '╝\n'));
  console.log('  $68.7 billion in Bitcoin is permanently lost. Much of it: people who died.');
  console.log('  Every solution today either reveals your nominees or trusts a company.');
  console.log(chalk.bold('  Nominee is the first system where neither is true.'));
}

export function note(s: string) { console.log(chalk.dim('  ' + s)); }
export function warn(s: string) { console.log(chalk.yellow('  ⚠ ' + s)); }
export function ok(s: string)   { console.log(chalk.green('  ✓ ' + s)); }
export function fail(s: string) { console.log(chalk.red('  ❌ ' + s)); }

/** Live countdown for the grace period. */
export async function countdown(seconds: number, label = 'Waiting for grace period') {
  for (let left = seconds; left > 0; left--) {
    process.stdout.write(
      `\r  ${chalk.yellow('⏳')} ${label}... ${chalk.bold(`[${left}s remaining]`)}   `,
    );
    await new Promise((r) => setTimeout(r, 1000));
  }
  process.stdout.write('\r' + ' '.repeat(72) + '\r');
  console.log(chalk.yellow('  ⏳ Grace period elapsed. No heartbeat.'));
}

export function summary(stats: {
  circuits: number; maxK: number; keysMB: number;
  tests: string; leak: string; txs: number; control: string;
}) {
  const W = 69;
  const row = (s = '') => console.log('│' + padEnd(' ' + s, W) + '│');
  console.log('\n' + chalk.bold.green('┌' + '─'.repeat(W) + '┐'));
  row(`Circuits: ${stats.circuits} compiled  │  Max k=${stats.maxK}  │  Keys: ${stats.keysMB} MB`);
  row(`Tests: ${stats.tests}  │  Leak check: ${stats.leak}`);
  row(`Devnet txs: ${stats.txs} accepted  │  Custom(192) control: ${stats.control}`);
  row();
  row('The chain never learned:');
  ['Who the owner is', 'Who the nominees are', 'How much each nominee received',
    'How many nominees exist', 'Why the heartbeat stopped']
    .forEach((s) => row(chalk.red('  ✗ ') + s));
  row();
  row('What the chain did learn:');
  ['A vault exists', 'A heartbeat stopped', '3 anonymous claims were made',
    'No double-claims succeeded']
    .forEach((s) => row(chalk.green('  ✓ ') + s));
  console.log(chalk.bold.green('└' + '─'.repeat(W) + '┘'));
}
