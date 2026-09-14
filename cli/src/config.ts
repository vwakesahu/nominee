// SPDX-License-Identifier: Apache-2.0
// Local Midnight devnet endpoints (docker-compose.yml at the repo root).
import { NetworkId } from '@midnight-ntwrk/wallet-sdk';

export const NETWORK_ID = NetworkId.NetworkId.Undeployed;

export const networkConfig = {
  indexerHttpUrl: process.env.NOMINEE_INDEXER_HTTP ?? 'http://127.0.0.1:8088/api/v4/graphql',
  indexerWsUrl:   process.env.NOMINEE_INDEXER_WS   ?? 'ws://127.0.0.1:8088/api/v4/graphql/ws',
  node:           process.env.NOMINEE_NODE_WS      ?? 'ws://127.0.0.1:9944',
  proofServer:    process.env.NOMINEE_PROOF_SERVER ?? 'http://127.0.0.1:6300',
};

/** Local devnet genesis wallet — funded at chain start. Public, dev-only. */
export const GENESIS_SEED_HEX = process.env.NOMINEE_SEED_HEX ?? '00'.repeat(31) + '01';

/** Grace period for the demo, in SECONDS.
 *  blockTime* takes Unix SECONDS; the indexer reports MILLISECONDS. */
export const DEMO_GRACE_SECONDS = BigInt(process.env.NOMINEE_GRACE ?? '60');

export const DEPLOYMENTS_FILE = 'deployments/devnet.json';
