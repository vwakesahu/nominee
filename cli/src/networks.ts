// SPDX-License-Identifier: Apache-2.0
//
// Every Midnight network the CLI can talk to, and the endpoints each one needs.
//
// A network is three services plus a prover:
//   node     JSON-RPC / WebSocket, where transactions are submitted
//   indexer  GraphQL over HTTP and WS, where public contract state is read
//   prover   ALWAYS local. The prover sees owner secrets, heir secrets and
//            shares; a hosted proof server would see them too. See
//            docs/ARCHITECTURE.md "Proof-server rule: self-host. Always."
//
// Midnight shut its own Preprod (and Mainnet) indexer and RPC on 2026-10-09.
// Those networks are served by Blockfrost and need a per-network project id,
// passed as a `?project_id=` query parameter because the SDK cannot set
// headers (blockfrost.dev/start-building/midnight). The indexer path there is
// `/api/v0`, not `/api/v4/graphql`. Preview is still Midnight-hosted.
// Testnet-02 is retired and its endpoints no longer resolve.

export type NetworkName = 'undeployed' | 'preview' | 'preprod' | 'mainnet';

export interface NetworkSpec {
  /** Network id string, as `setNetworkId` and the address bech32 prefixes use it. */
  readonly name: NetworkName;
  /** GraphQL endpoint for public contract state. */
  readonly indexerHttpUrl: string;
  /** GraphQL subscription endpoint; contract state updates arrive here. */
  readonly indexerWsUrl: string;
  /** Node WebSocket, used as the wallet's relay for submitting transactions. */
  readonly node: string;
  /** Local proof server. Never remote. */
  readonly proofServer: string;
  /** Where to get test tokens, or null when there is no faucet. */
  readonly faucet: string | null;
  /** Where a judge can look the contract up. */
  readonly explorer: string | null;
  /** True when the whole stack runs in docker-compose on this machine. */
  readonly local: boolean;
  /** True when the endpoints need a Blockfrost project id (NOMINEE_BLOCKFROST). */
  readonly blockfrost: boolean;
}

export const NETWORKS: Record<NetworkName, NetworkSpec> = {
  undeployed: {
    name: 'undeployed',
    indexerHttpUrl: 'http://127.0.0.1:8088/api/v4/graphql',
    indexerWsUrl: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
    node: 'ws://127.0.0.1:9944',
    proofServer: 'http://127.0.0.1:6300',
    faucet: null, // genesis wallet is pre-funded
    explorer: null,
    local: true,
    blockfrost: false,
  },
  preview: {
    name: 'preview',
    indexerHttpUrl: 'https://indexer.preview.midnight.network/api/v4/graphql',
    indexerWsUrl: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
    node: 'wss://rpc.preview.midnight.network',
    proofServer: 'http://127.0.0.1:6300',
    faucet: 'https://midnight-tmnight-preview.nethermind.dev/',
    explorer: 'https://preview.midnightexplorer.com',
    local: false,
    blockfrost: false,
  },
  preprod: {
    name: 'preprod',
    indexerHttpUrl: 'https://midnight-preprod.blockfrost.io/api/v0',
    indexerWsUrl: 'wss://midnight-preprod.blockfrost.io/api/v0/ws',
    node: 'wss://rpc.midnight-preprod.blockfrost.io',
    // Preprod lists proof server 8.1.3; the devnet compose runs 8.1.0 on 6300.
    // run-preprod.sh starts an 8.1.3 container on 6301 and points here.
    proofServer: 'http://127.0.0.1:6301',
    faucet: 'https://midnight-tmnight-preprod.nethermind.dev/',
    explorer: 'https://preprod.midnightexplorer.com',
    local: false,
    blockfrost: true,
  },
  mainnet: {
    name: 'mainnet',
    indexerHttpUrl: 'https://midnight-mainnet.blockfrost.io/api/v0',
    indexerWsUrl: 'wss://midnight-mainnet.blockfrost.io/api/v0/ws',
    node: 'wss://rpc.midnight-mainnet.blockfrost.io',
    proofServer: 'http://127.0.0.1:6300',
    faucet: null, // real NIGHT, registered for DUST via the cNgD DApp
    explorer: 'https://midnightexplorer.com',
    local: false,
    blockfrost: true,
  },
};

export const NETWORK_NAMES = Object.keys(NETWORKS) as NetworkName[];

export function isNetworkName(v: string): v is NetworkName {
  return Object.prototype.hasOwnProperty.call(NETWORKS, v);
}

export function parseNetworkName(v: string): NetworkName {
  const k = v.trim().toLowerCase();
  if (isNetworkName(k)) return k;
  throw new Error(
    `unknown network "${v}". Choose one of: ${NETWORK_NAMES.join(', ')}.\n` +
      `  (testnet-02 is retired; "preprod" is the testnet.)`,
  );
}
