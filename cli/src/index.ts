// SPDX-License-Identifier: Apache-2.0
import './redact.js';   // first: masks the Blockfrost id in all output
import { Command } from 'commander';
import chalk from 'chalk';
import { selectNetwork, currentNetwork } from './config.js';
import { NETWORK_NAMES } from './networks.js';

// The Midnight SDK runs on Effect fibers; a failure inside one can surface as
// an unhandled rejection rather than at the await. Swallow the noise so a
// missing node degrades the demo instead of killing the process.
process.on('unhandledRejection', () => {});

const program = new Command();

program
  .name('nominee')
  .description('Add a nominee to your crypto. Nobody learns who.  https://nominee.world')
  .version('0.1.0')
  // Parsed before any command runs, so `networkConfig()` is correct everywhere.
  .option(
    '-n, --network <name>',
    `target network (${NETWORK_NAMES.join(' | ')})`,
    process.env.NOMINEE_NETWORK ?? 'preprod',
  )
  .hook('preAction', (thisCommand) => {
    selectNetwork(thisCommand.opts().network);
  });

program
  .command('demo')
  .description('the whole story: a life, silence, resolution, the nominees, attacks that fail')
  .option('--live', 'execute on the selected network instead of the simulator')
  .action(async (opts) => {
    const { demo } = await import('./commands/demo.js');
    await demo(opts);
  });

program
  .command('deploy')
  .description('deploy the contract to the selected network and record the address')
  .option('--grace <seconds>', 'grace period before a vault can be resolved')
  .option('--challenge <seconds>', 'veto window after resolve, before finalize unlocks')
  .option('--force', 're-deploy even if this network already has a recorded deployment')
  .action(async (opts) => {
    const { deploy } = await import('./commands/deploy.js');
    await deploy(opts);
  });

program
  .command('address')
  .description('print the wallet address to fund from the faucet')
  .action(async () => {
    const { address } = await import('./commands/address.js');
    await address();
  });

program
  .command('balance')
  .description('sync the wallet and show NIGHT, DUST and shielded balances')
  .action(async () => {
    const { balance } = await import('./commands/balance.js');
    await balance();
  });

program
  .command('register-dust')
  .description('register NIGHT for DUST generation, required before any fee can be paid')
  .option('--timeout <ms>', 'how long to wait for projected DUST to cover the fee', '600000')
  .option('--direct', 'skip fee estimation and the DUST wait (avoids the multi-hour dust scan)')
  .action(async (opts) => {
    const { registerDust } = await import('./commands/registerDust.js');
    await registerDust(opts);
  });

program
  .command('device')
  .description('stand-in hardware signer: holds a device key, signs heartbeats only while a pulse is present')
  .option('--pulse', 'a pulse is present (or set NOMINEE_PULSE=1)')
  .option('--port <port>', 'listen port', '7777')
  .action(async (opts) => { const { device } = await import('./commands/device.js'); await device(opts); });

program
  .command('doctor')
  .description('check the network, proof server and contract build')
  .action(async () => {
    const { doctor } = await import('./commands/doctor.js');
    await doctor();
  });

program.parseAsync(process.argv).catch(async (e) => {
  // Print the whole cause chain, not just the outermost message. SDK errors
  // wrap the useful part, "Transaction submission error" on its own says
  // nothing, while its cause names the ledger code that actually rejected it.
  const { describe, errorCode, LEDGER_ERRORS } = await import('./retry.js');
  console.error(chalk.red('\nfailed: ') + describe(e));
  const code = errorCode(e);
  if (code) {
    console.error(chalk.red(`  ledger code: Custom(${code})`) +
      (LEDGER_ERRORS[code] ? `, ${LEDGER_ERRORS[code]}` : ''));
  }
  if (process.env.NOMINEE_TRACE === '1') {
    // Effect wraps the node's rejection in a Cause object that is not an Error,
    // so the plain `.cause` walk above cannot render it. Inspect it whole.
    const { inspect } = await import('node:util');
    console.error(chalk.dim(inspect(e, { depth: 8, colors: false, breakLength: 120 })));
  }
  console.error(chalk.dim(`  network: ${currentNetwork()}`));
  process.exit(1);
});
