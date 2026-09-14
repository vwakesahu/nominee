// SPDX-License-Identifier: Apache-2.0
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
export function initializeNetwork() {
  setNetworkId((process.env.NOMINEE_NETWORK ?? 'undeployed') as any);
}
