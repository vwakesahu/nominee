// SPDX-License-Identifier: Apache-2.0
import { Command } from 'commander';
import chalk from 'chalk';
import { demo } from './commands/demo.js';

// The Midnight SDK runs on Effect fibers; a failure inside one can surface as
// an unhandled rejection rather than at the await. Swallow the noise so a
// missing node degrades the demo instead of killing the process.
process.on('unhandledRejection', () => {});

const program = new Command();

program
  .name('nominee')
  .description('Add a nominee to your crypto. Nobody learns who.  https://nominee.world')
  .version('0.1.0');

program
  .command('demo')
  .description('the whole story: a life, silence, resolution, the nominees, attacks that fail')
  .action(async () => { await demo(); });

program
  .command('address')
  .description('print wallet addresses for the configured network (NOMINEE_NETWORK)')
  .action(async () => { const { address } = await import('./commands/address.js'); await address(); });

program
  .command('balance')
  .description('sync and show NIGHT / DUST balances for the configured network')
  .action(async () => { const { balance } = await import('./commands/balance.js'); await balance(); });

program
  .command('register-dust')
  .description('register NIGHT for DUST generation (required once on a testnet)')
  .action(async () => { const { registerDust } = await import('./commands/register-dust.js'); await registerDust(); });

program
  .command('doctor')
  .description('check the local devnet, proof server and contract build')
  .action(async () => { const { doctor } = await import('./commands/doctor.js'); await doctor(); });

program.parseAsync(process.argv).catch((e) => {
  console.error(chalk.red('\nfailed: ') + (e?.message ?? String(e)));
  process.exit(1);
});
