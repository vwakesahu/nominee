// SPDX-License-Identifier: Apache-2.0
//
// Every Midnight network the CLI can talk to, and the endpoints each one needs.
//
// A network is three services plus a prover:
//   node     — JSON-RPC / WebSocket, where transactions are submitted
//   indexer  — GraphQL over HTTP and WS, where public contract state is read
//   prover   — ALWAYS local. The prover sees owner secrets, heir secrets and
//              shares; a hosted proof server would see them too. See
//              docs/ARCHITECTURE.md "Proof-server rule: self-host. Always."
//
// Endpoints are from docs.midnight.network/guides/networks-and-environments and
// were confirmed live against the Preprod indexer in validation/VALIDATION_REPORT.md §D16.
// Testnet-02 is retired and its endpoints no longer resolve — preprod is the testnet.

export type NetworkName = 'undeployed' | 'preview' | 'preprod' | 'mainnet';

export interface NetworkSpec {
  /** Network id string, as `setNetworkId` and the address bech32 prefixes use it. */
  readonly name: NetworkName;
  /** GraphQL endpoint for public contract state. */
  readonly indexerHttpUrl: string;
  /** GraphQL subscription endpoint — contract state updates arrive here. */
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
  },
  preprod: {
    name: 'preprod',
    indexerHttpUrl: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWsUrl: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    node: 'wss://rpc.preprod.midnight.network',
    proofServer: 'http://127.0.0.1:6300',
    faucet: 'https://midnight-tmnight-preprod.nethermind.dev/',
    explorer: 'https://preprod.midnightexplorer.com',
    local: false,
  },
  mainnet: {
    name: 'mainnet',
    indexerHttpUrl: 'https://indexer.mainnet.midnight.network/api/v4/graphql',
    indexerWsUrl: 'wss://indexer.mainnet.midnight.network/api/v4/graphql/ws',
    node: 'wss://rpc.mainnet.midnight.network',
    proofServer: 'http://127.0.0.1:6300',
    faucet: null, // real NIGHT, registered for DUST via the cNgD DApp
    explorer: 'https://midnightexplorer.com',
    local: false,
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
      `  (testnet-02 is retired — "preprod" is the testnet.)`,
  );
}
