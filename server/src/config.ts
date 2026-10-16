// SPDX-License-Identifier: Apache-2.0
//
// Server configuration. Network, endpoints and the wallet seed are read
// through the CLI's own config (cli/dist/config.js) so there is exactly one
// place that knows about NOMINEE_NETWORK / NOMINEE_SEED_HEX / NOMINEE_MNEMONIC.
// cli/dist is loaded dynamically: it is a build artefact that may be absent
// or mid-rebuild, and the simulator must keep working without it.

export const PORT = Number(process.env.NOMINEE_API_PORT ?? '8787');
export const HOST = process.env.NOMINEE_API_HOST ?? '127.0.0.1';

/** Live mode talks to a devnet/testnet; otherwise an in-memory simulator. */
export const LIVE = Boolean(process.env.NOMINEE_LIVE);

/** Contract address for live mode. The envelope carries one too; they must agree. */
export const CONTRACT_ADDRESS = process.env.NOMINEE_CONTRACT ?? '';

/** Origins allowed to call the API (the Next dev server by default). */
export const WEB_ORIGINS: string[] = (
  process.env.NOMINEE_WEB_ORIGIN ?? 'http://localhost:3000,http://127.0.0.1:3000'
).split(',').map((s) => s.trim()).filter(Boolean);

export type NetworkName = 'undeployed' | 'preview' | 'preprod';

export interface CliConfig {
  NETWORK: NetworkName;
  networkConfig: { indexerHttpUrl: string; indexerWsUrl: string; node: string; proofServer: string };
  DEMO_GRACE_SECONDS: bigint;
  DEMO_CHALLENGE_SECONDS: bigint;
  /** true when cli/dist/config.js was loaded, false when the env fallback was used */
  fromCli: boolean;
}

const CLI_DIST = new URL('../../cli/dist/', import.meta.url);
export const cliDistUrl = (file: string) => new URL(file, CLI_DIST).href;

const FALLBACK_INDEXER: Record<NetworkName, { http: string; ws: string; node: string }> = {
  undeployed: {
    http: 'http://127.0.0.1:8088/api/v4/graphql',
    ws: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
    node: 'ws://127.0.0.1:9944',
  },
  preview: {
    http: 'https://indexer.preview.midnight.network/api/v4/graphql',
    ws: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
    node: 'wss://rpc.preview.midnight.network',
  },
  preprod: {
    http: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    ws: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    node: 'wss://rpc.preprod.midnight.network',
  },
};

let cached: Promise<CliConfig> | undefined;

/** Load cli/dist/config.js, falling back to the same env variables it reads. */
export function loadConfig(): Promise<CliConfig> {
  cached ??= (async () => {
    try {
      const m: any = await import(cliDistUrl('config.js'));
      return {
        NETWORK: m.NETWORK,
        networkConfig: m.networkConfig,
        DEMO_GRACE_SECONDS: BigInt(m.DEMO_GRACE_SECONDS ?? process.env.NOMINEE_GRACE ?? '60'),
        // SPEC §1.9 adds DEMO_CHALLENGE_SECONDS to cli config; until it lands read the env.
        DEMO_CHALLENGE_SECONDS: BigInt(m.DEMO_CHALLENGE_SECONDS ?? process.env.NOMINEE_CHALLENGE ?? '30'),
        fromCli: true,
      };
    } catch (e: any) {
      const NETWORK = (process.env.NOMINEE_NETWORK as NetworkName) ?? 'undeployed';
      const f = FALLBACK_INDEXER[NETWORK] ?? FALLBACK_INDEXER.undeployed;
      if (LIVE) console.warn(`[nominee-server] cli/dist/config.js not loadable (${e?.message}); using env fallback`);
      return {
        NETWORK,
        networkConfig: {
          indexerHttpUrl: process.env.NOMINEE_INDEXER_HTTP ?? f.http,
          indexerWsUrl: process.env.NOMINEE_INDEXER_WS ?? f.ws,
          node: process.env.NOMINEE_NODE_WS ?? f.node,
          proofServer: process.env.NOMINEE_PROOF_SERVER ?? 'http://127.0.0.1:6300',
        },
        DEMO_GRACE_SECONDS: BigInt(process.env.NOMINEE_GRACE ?? '60'),
        DEMO_CHALLENGE_SECONDS: BigInt(process.env.NOMINEE_CHALLENGE ?? '30'),
        fromCli: false,
      };
    }
  })();
  return cached;
}
