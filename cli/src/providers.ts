// SPDX-License-Identifier: Apache-2.0
// The six-provider bundle deployContract / findDeployedContract need.
// Adapted from the validated custody probe (validation/experiments/custody-probe).
import * as ledger from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import * as Rx from 'rxjs';
import { fileURLToPath } from 'node:url';
import { networkConfig } from './config.js';

/** The committed contract build: contract/out (keys/ + zkir/). */
export const ZK_CONFIG_PATH =
  process.env.NOMINEE_ZK_PATH ?? fileURLToPath(new URL('../../contract/out', import.meta.url));

async function createWalletProvider(
  facade: any,
  zswapSecretKeys: ledger.ZswapSecretKeys,
  dustSecretKey: ledger.DustSecretKey,
) {
  const state: any = await Rx.firstValueFrom(facade.state());
  return {
    getCoinPublicKey: () => state.shielded.coinPublicKey.toHexString(),
    getEncryptionPublicKey: () => state.shielded.encryptionPublicKey.toHexString(),
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await facade.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: zswapSecretKeys, dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return facade.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => facade.submitTransaction(tx),
  };
}

export async function createProviders(
  facade: any,
  zswapSecretKeys: ledger.ZswapSecretKeys,
  dustSecretKey: ledger.DustSecretKey,
  keystore: any,
) {
  const walletProvider = await createWalletProvider(facade, zswapSecretKeys, dustSecretKey);
  const zkConfigProvider = new NodeZkConfigProvider(ZK_CONFIG_PATH);
  const accountId =
    typeof keystore.getBech32Address === 'function'
      ? keystore.getBech32Address().toString()
      : 'nominee-cli-account';

  return {
    // >= 16 chars, 3 character classes, enforced by the provider, no recovery.
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'nominee-cli',
      privateStoragePasswordProvider: () =>
        process.env.NOMINEE_STORAGE_PASSWORD ?? 'Nominee-Devnet-2026!',
      accountId,
    }),
    publicDataProvider: indexerPublicDataProvider(
      networkConfig.indexerHttpUrl,
      networkConfig.indexerWsUrl,
    ),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  } as any;
}
