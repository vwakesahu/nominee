// Client for the Nominee heir-claim API (server/). Mirrors server/src/view.ts
// and server/src/backend.ts; keep the shapes in sync by hand.

export const API_BASE =
  process.env.NEXT_PUBLIC_NOMINEE_API?.replace(/\/+$/, "") ?? "http://127.0.0.1:8787";

export interface EnvelopeEntry { sibling: string; goesLeft: boolean }

export interface Envelope {
  version: 2;
  network: "undeployed" | "preview" | "preprod";
  contractAddress: string;
  vaultTag: string;
  heirSecret: string;
  share: string;
  heirKey: string;
  merklePath: EnvelopeEntry[];
  indexerUrl?: string;
}

export type VaultStatus = "unknown" | "alive" | "grace-lapsed" | "challenge" | "resolved" | "empty";

export interface VaultView {
  tag: string;
  known: boolean;
  lastSeen: number | null;
  graceSeconds: number;
  challengeSeconds: number;
  deadline: number | null;
  challengeUntil: number | null;
  resolved: boolean;
  claimsSpent: number;
  remaining: string | null;
  willVersion: number | null;
  status: VaultStatus;
  now: number;
}

export interface Health { ok: boolean; network: string; contractAddress: string | null; mode: "simulator" | "live" }

export interface ClaimResult {
  txHash: string | null;
  block: number | null;
  received: string;
  remaining: string | null;
  nullifier: string;
  heirKey: string;
  simulated: boolean;
}

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, public readonly reason: string) {
    super(reason);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  } catch {
    throw new ApiError(0, "unreachable", `Could not reach the claim server at ${API_BASE}. Is it running? (bun run server)`);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? "error", body.reason ?? `HTTP ${res.status}`);
  return body as T;
}

export const api = {
  health: () => call<Health>("/api/health"),
  vault: (tag: string) => call<VaultView>(`/api/vault/${tag}`),
  demoEnvelope: (heir = 0) => call<Envelope>(`/api/demo-envelope?heir=${heir}`),
  claim: (envelope: Envelope) => call<ClaimResult>("/api/claim", { method: "POST", body: JSON.stringify({ envelope }) }),
};

/** Light client-side validation so the heir gets a precise message before any network call. */
export function parseEnvelopeText(text: string): Envelope {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error("That is not valid JSON. Paste the whole envelope, including the outer braces."); }
  if (!raw || typeof raw !== "object") throw new Error("The envelope must be a JSON object.");
  const e = raw as Record<string, unknown>;
  if (Number(e.version) !== 2) throw new Error(`This envelope is version ${String(e.version ?? "?")}; this page reads version 2.`);
  const hex32 = (k: string) => {
    const v = e[k];
    if (typeof v !== "string" || !/^(0x)?[0-9a-fA-F]{64}$/.test(v)) throw new Error(`The envelope's "${k}" should be 64 hex characters.`);
    return v.replace(/^0x/, "").toLowerCase();
  };
  const vaultTag = hex32("vaultTag"), heirSecret = hex32("heirSecret"), heirKey = hex32("heirKey");
  if (typeof e.share !== "string" || !/^\d+$/.test(e.share)) throw new Error('The envelope\'s "share" should be a decimal string.');
  if (!Array.isArray(e.merklePath) || e.merklePath.length !== 16) throw new Error('The envelope\'s "merklePath" should have 16 entries.');
  if (typeof e.contractAddress !== "string" || !e.contractAddress) throw new Error('The envelope is missing "contractAddress".');
  if (!["undeployed", "preview", "preprod"].includes(String(e.network))) throw new Error(`Unknown network "${String(e.network)}".`);
  return {
    version: 2,
    network: e.network as Envelope["network"],
    contractAddress: e.contractAddress,
    vaultTag, heirSecret, heirKey,
    share: e.share,
    merklePath: e.merklePath as EnvelopeEntry[],
    indexerUrl: typeof e.indexerUrl === "string" ? e.indexerUrl : undefined,
  };
}

export const shortHex = (h: string, n = 6) => (h.length > 2 * n + 2 ? `${h.slice(0, n)}…${h.slice(-n)}` : h);

export function formatAmount(dec: string | null): string {
  if (dec === null) return "0";
  return BigInt(dec).toLocaleString("en-US");
}

export const formatDate = (secs: number) =>
  new Date(secs * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export function minutesLeft(until: number, now: number): string {
  const s = Math.max(0, until - now);
  if (s < 60) return `${s} second${s === 1 ? "" : "s"}`;
  const m = Math.ceil(s / 60);
  if (m < 120) return `${m} minute${m === 1 ? "" : "s"}`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} hour${h === 1 ? "" : "s"}`;
  return `${Math.round(h / 24)} days`;
}

/** The one plain-English line about the vault (SPEC §2.2). */
export function describeVault(v: VaultView): { line: string; tone: "ready" | "wait" | "stop" } {
  switch (v.status) {
    case "resolved": {
      const opened = v.deadline !== null ? v.deadline + v.challengeSeconds : null;
      return { tone: "ready", line: opened ? `The vault opened on ${formatDate(opened)}. Your share is ready.` : "The vault is open. Your share is ready." };
    }
    case "challenge":
      return { tone: "wait", line: `Still in the challenge window, ${minutesLeft(v.challengeUntil!, v.now)} left. The owner or their guardians can still step in.` };
    case "grace-lapsed":
      return { tone: "wait", line: `The owner has been silent since ${formatDate(v.lastSeen!)}. The grace period has lapsed, but nobody has asked the chain to open the vault yet.` };
    case "alive":
      return { tone: "wait", line: `The owner last checked in on ${formatDate(v.lastSeen!)}. Nothing to claim; the grace period runs until ${formatDate(v.deadline!)}.` };
    case "empty":
      return { tone: "stop", line: "This vault has already been emptied. Every share was paid out." };
    default:
      return { tone: "stop", line: "This vault is not on the registry this page is connected to. Check the envelope's network and contract." };
  }
}
