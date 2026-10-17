// SPDX-License-Identifier: Apache-2.0
// Local Midnight devnet endpoints (docker-compose.yml at the repo root).
import * as os from 'node:os';
import * as path from 'node:path';
import { NetworkId } from '@midnight-ntwrk/wallet-sdk';

/**
 * Which network to talk to:  NOMINEE_NETWORK = undeployed | preview | preprod
 * Proving is always local, the proof server sees every witness, so it must
 * never be hosted by someone else.
 */
export type NetworkName = 'undeployed' | 'preview' | 'preprod';
export const NETWORK: NetworkName =
  (process.env.NOMINEE_NETWORK as NetworkName) ?? 'undeployed';

/** Blockfrost project id for Preprod (prefix `nightpreprod`). NOMINEE_BLOCKFROST=<id>. */
export const BLOCKFROST_PROJECT_ID = process.env.NOMINEE_BLOCKFROST ?? '';
const withBlockfrost = (url: string) =>
  BLOCKFROST_PROJECT_ID ? `${url}?project_id=${BLOCKFROST_PROJECT_ID}` : url;

const PRESETS: Record<NetworkName, { indexerHttpUrl: string; indexerWsUrl: string; node: string }> = {
  undeployed: {
    indexerHttpUrl: 'http://127.0.0.1:8088/api/v4/graphql',
    indexerWsUrl:   'ws://127.0.0.1:8088/api/v4/graphql/ws',
    node:           'ws://127.0.0.1:9944',
  },
  preview: {
    indexerHttpUrl: 'https://indexer.preview.midnight.network/api/v4/graphql',
    indexerWsUrl:   'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
    node:           'wss://rpc.preview.midnight.network',
  },
  // Midnight shut its public Preprod indexer and RPC on 2026-10-09; Preprod is
  // served by Blockfrost and needs a per-network project id, passed as a query
  // parameter because the SDK cannot set headers (blockfrost.dev/start-building/midnight).
  preprod: {
    indexerHttpUrl: withBlockfrost('https://midnight-preprod.blockfrost.io/api/v0'),
    indexerWsUrl:   withBlockfrost('wss://midnight-preprod.blockfrost.io/api/v0/ws'),
    node:           withBlockfrost('wss://rpc.midnight-preprod.blockfrost.io'),
  },
};

export const NETWORK_ID =
  NETWORK === 'preview'  ? NetworkId.NetworkId.Preview  :
  NETWORK === 'preprod'  ? NetworkId.NetworkId.PreProd  :
                           NetworkId.NetworkId.Undeployed;

const preset = PRESETS[NETWORK];
export const networkConfig = {
  indexerHttpUrl: process.env.NOMINEE_INDEXER_HTTP ?? preset.indexerHttpUrl,
  indexerWsUrl:   process.env.NOMINEE_INDEXER_WS   ?? preset.indexerWsUrl,
  node:           process.env.NOMINEE_NODE_WS      ?? preset.node,
  proofServer:    process.env.NOMINEE_PROOF_SERVER ?? 'http://127.0.0.1:6300',
};

/**
 * Wallet seed. On the local devnet this defaults to the well-known genesis
 * seed, which is funded at chain start and is public by design. On a public
 * testnet you MUST supply your own funded seed:
 *   NOMINEE_SEED_HEX=<64 hex chars>
 */
export const GENESIS_SEED_HEX =
  process.env.NOMINEE_SEED_HEX ?? (NETWORK === 'undeployed' ? '00'.repeat(31) + '01' : '');

/**
 * A BIP-39 mnemonic, as an alternative to NOMINEE_SEED_HEX.
 *
 * This is the practical route on a public testnet: DUST cannot be bought and
 * registering NIGHT for DUST generation itself costs DUST, so a brand-new
 * wallet cannot bootstrap itself from the SDK alone. Lace's "Generate tDUST"
 * flow does the registration, so the workable path is to import a mnemonic
 * into Lace, fund and register there, then hand the CLI the same mnemonic.
 */
export const MNEMONIC = process.env.NOMINEE_MNEMONIC ?? '';

/** Grace period for the demo, in SECONDS.
 *  blockTime* takes Unix SECONDS; the indexer reports MILLISECONDS. */
export const DEMO_GRACE_SECONDS = BigInt(process.env.NOMINEE_GRACE ?? '60');

/** Veto window opened by `resolve`, in SECONDS. `finalize` unlocks once it has closed. */
export const DEMO_CHALLENGE_SECONDS = BigInt(process.env.NOMINEE_CHALLENGE ?? '30');

/**
 * A stand-in hardware signer (`nominee device`, or an ESP32 with a MAX30102
 * speaking the same two endpoints). Unset: the demo signs heartbeats in-process.
 */
export const DEVICE_URL = process.env.NOMINEE_DEVICE_URL ?? '';

/**
 * Name of an heir whose claim the demo SKIPS (e.g. `sam`), so the heir web
 * page can claim it afterwards from the envelope. Unset: all nominees claim.
 */
export const HOLD_HEIR = (process.env.NOMINEE_HOLD_HEIR ?? '').trim().toLowerCase();

export const DEPLOYMENTS_FILE = `deployments/${NETWORK}.json`;

/**
 * Where the DUST wallet snapshot is persisted between runs, OUTSIDE the repo.
 * On a public network the DUST wallet replays every generation event since
 * genesis (1.67M on Preprod, Oct 2026; about 30 min even with large batches),
 * so wallet.ts restores from this file and refreshes it while syncing.
 * NOMINEE_DUST_CHECKPOINT=<file> relocates it, `off` forces a cold scan.
 * Never used on the local devnet, whose chain is reset too often.
 */
export const DUST_CHECKPOINT_FILE =
  process.env.NOMINEE_DUST_CHECKPOINT ?? path.join(os.homedir(), '.nominee', `dust-${NETWORK}.json`);

/**
 * What the demo deposits into the vault:  NOMINEE_DEPOSIT = native | token
 *   native  a shielded native coin (colour = 32 zero bytes). Only the local
 *           devnet's genesis wallet holds those.
 *   token   tNOM, minted by the testnet-only demo token (contract/token) to
 *           this wallet first. The default on public testnets, where the
 *           funded wallet holds unshielded NIGHT only and NIGHT cannot be
 *           shielded. Nominee's deposit and claim accept any colour.
 */
export const DEPOSIT_ASSET = process.env.NOMINEE_DEPOSIT ?? (NETWORK === 'undeployed' ? 'native' : 'token');

/** Address of an already deployed demo token to attach to. Unset: the demo deploys a fresh one. */
export const TOKEN_CONTRACT = process.env.NOMINEE_TOKEN_CONTRACT ?? '';
