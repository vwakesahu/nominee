// SPDX-License-Identifier: Apache-2.0
// The ledger's address codec is network-scoped: a contract address serialised
// under 'undeployed' will not parse under 'preprod'. This has to run before any
// address is built or read.
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { networkId } from './config.js';

export function initializeNetwork() {
  setNetworkId(networkId());
}
