import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
export function initializeNetwork() { setNetworkId((process.env.MN_NETWORK ?? "undeployed") as any); }
