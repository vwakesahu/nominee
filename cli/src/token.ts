// SPDX-License-Identifier: Apache-2.0
//
// tNOM, the testnet-only demo token (contract/token/src/demotoken.compact).
//
// On a public testnet the funded wallet holds unshielded NIGHT and no shielded
// native coins, and NIGHT cannot be shielded. Nominee's `deposit` and `claim`
// take a shielded coin of ANY colour, so the demo mints itself a shielded tNOM
// coin here and deposits that instead. The mint is permissionless: never
// deploy this contract on mainnet.
//
// Single wasm instance: the generated token contract imports
// '@midnight-ntwrk/compact-runtime', resolved through contract/node_modules to
// the same package as the Nominee contract, and nothing here imports the
// second copy that ships inside '@midnight-ntwrk/midnight-js-protocol'.
import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as Rx from 'rxjs';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { Contract as TokenContract, ledger as readTokenLedger, type Ledger as TokenLedger } from '../../contract/token/out/contract/index.js';
import { networkConfig, TOKEN_CONTRACT } from './config.js';
import { withRetries } from './retry.js';

/** The committed token build: contract/token/out (keys/ + zkir/). */
export const TOKEN_ZK_PATH =
  process.env.NOMINEE_TOKEN_ZK_PATH ?? fileURLToPath(new URL('../../contract/token/out', import.meta.url));

export const TOKEN_SYMBOL = 'tNOM';

export interface TokenTx { txHash: string | null; block: number | null }

export class DemoToken {
  constructor(
    readonly providers: any,
    readonly deployed: any,
    readonly address: string,
    /** The deploy transaction, or null when attached to an existing token (NOMINEE_TOKEN_CONTRACT). */
    readonly deployTx: TokenTx | null,
  ) {}

  /** Mint `amount` tNOM as a shielded coin to this wallet's own coin public key. */
  async mintToSelf(amount: bigint): Promise<TokenTx & { nonce: Uint8Array; to: Uint8Array }> {
    const hex = String(this.providers.walletProvider.getCoinPublicKey()).replace(/^0x/, '');
    const to = new Uint8Array(Buffer.from(hex, 'hex'));
    if (to.length !== 32) throw new Error(`coin public key is ${to.length} bytes, expected 32`);
    const nonce = new Uint8Array(randomBytes(32));
    const r: any = await withRetries('demotoken mint', () => this.deployed.callTx.mint(amount, nonce, { bytes: to }));
    return {
      txHash: r?.public?.txHash ?? r?.public?.txId ?? null,
      block: r?.public?.blockHeight ?? null,
      nonce, to,
    };
  }

  async ledger(): Promise<TokenLedger | null> {
    const s = await this.providers.publicDataProvider.queryContractState(this.address);
    return s ? readTokenLedger(s.data) : null;
  }

  /** The colour this token mints, read from its ledger (written by the first mint). */
  async color(): Promise<Uint8Array> {
    const l = await this.ledger();
    if (!l) throw new Error(`demotoken: no contract state at ${this.address}`);
    if (l.color.every((b) => b === 0)) throw new Error('demotoken: colour not set yet, mint first');
    return new Uint8Array(l.color);
  }
}

/**
 * Deploy a fresh demo token, or attach to NOMINEE_TOKEN_CONTRACT when set.
 * `providers` is the Nominee session's bundle; the token gets its own zk
 * config and proof provider, everything else (wallet, indexer, private state
 * store) is shared. The private state provider is re-scoped to the right
 * contract address by the SDK on every call, so sharing it is safe.
 */
export async function deployOrAttachToken(providers: any, address: string = TOKEN_CONTRACT): Promise<DemoToken> {
  const zkConfigProvider = new NodeZkConfigProvider(TOKEN_ZK_PATH);
  const tokenProviders = {
    ...providers,
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
  };
  const compiled = (CompiledContract.make('DemoToken', TokenContract) as any).pipe(
    (CompiledContract as any).withVacantWitnesses,
    (CompiledContract as any).withCompiledFileAssets(TOKEN_ZK_PATH),
  );

  if (address) {
    const found: any = await findDeployedContract(tokenProviders, {
      compiledContract: compiled, contractAddress: address,
    } as any);
    return new DemoToken(tokenProviders, found, address, null);
  }
  const d: any = await withRetries('demotoken deploy', () =>
    deployContract(tokenProviders, { compiledContract: compiled, args: [] } as any));
  const pub = d.deployTxData.public;
  return new DemoToken(tokenProviders, d, pub.contractAddress, {
    txHash: pub.txHash ?? pub.txId ?? null,
    block: pub.blockHeight ?? null,
  });
}

/** Available shielded balance of `color` in this wallet's state. */
export function shieldedBalanceOf(state: any, color: Uint8Array): bigint {
  const want = Buffer.from(color).toString('hex').toLowerCase();
  const balances: Record<string, bigint> = state?.shielded?.balances ?? {};
  for (const [k, v] of Object.entries(balances)) {
    if (String(k).replace(/^0x/, '').toLowerCase() === want) return BigInt(v as any);
  }
  return 0n;
}

/**
 * Wait until the shielded wallet reports at least `amount` of `color` as
 * available. The demo never blocks on the shielded wallet at start-up, so on a
 * public network this is also where its scan catches up to the mint.
 */
export async function waitForShieldedBalance(
  facade: any, color: Uint8Array, amount: bigint, timeoutMs = 20 * 60_000,
  onProgress?: (balance: bigint, progress: any) => void,
): Promise<bigint> {
  let last = 0n;
  try {
    const state: any = await Rx.firstValueFrom(
      facade.state().pipe(
        Rx.tap((s: any) => { last = shieldedBalanceOf(s, color); onProgress?.(last, s?.shielded?.progress); }),
        Rx.filter((s: any) => shieldedBalanceOf(s, color) >= amount),
        Rx.timeout({ first: timeoutMs }),
      ),
    );
    return shieldedBalanceOf(state, color);
  } catch (e: any) {
    if (e?.name === 'TimeoutError') {
      throw new Error(`shielded wallet still shows ${last} of ${amount} ${TOKEN_SYMBOL} after ${Math.round(timeoutMs / 1000)}s`);
    }
    throw e;
  }
}
