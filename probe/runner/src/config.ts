// LOCAL devnet (undeployed) endpoints — midnight-local-dev standalone.yml
import { NetworkId } from '@midnight-ntwrk/wallet-sdk';
export const NETWORK_ID = NetworkId.NetworkId.Undeployed;
export const networkConfig = {
  indexerHttpUrl: process.env.INDEXER_HTTP ?? 'http://127.0.0.1:8088/api/v4/graphql',
  indexerWsUrl:   process.env.INDEXER_WS   ?? 'ws://127.0.0.1:8088/api/v4/graphql/ws',
  node:           process.env.NODE_WS      ?? 'ws://127.0.0.1:9944',
  proofServer:    process.env.PROOF_SERVER ?? 'http://localhost:6300',
};
export const MICRO_NIGHT = 1_000_000n;
export const DUST_SPECKS = 1_000_000_000_000_000n;
