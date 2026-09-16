// SPDX-License-Identifier: Apache-2.0
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { NETWORK } from './config.js';
export function initializeNetwork() { setNetworkId(NETWORK as any); }
