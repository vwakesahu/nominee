// SPDX-License-Identifier: Apache-2.0
// Local Midnight devnet endpoints (docker-compose.yml at the repo root).
import { NetworkId } from '@midnight-ntwrk/wallet-sdk';

/**
 * Which network to talk to:  NOMINEE_NETWORK = undeployed | preview | preprod
 * Proving is always local, the proof server sees every witness, so it must
 * never be hosted by someone else.
 */
export type NetworkName = 'undeployed' | 'preview' | 'preprod';
export const NETWORK: NetworkName =
  (process.env.NOMINEE_NETWORK as NetworkName) ?? 'undeployed';

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
  preprod: {
    indexerHttpUrl: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWsUrl:   'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    node:           'wss://rpc.preprod.midnight.network',
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

export const DEPLOYMENTS_FILE = `deployments/${NETWORK}.json`;
