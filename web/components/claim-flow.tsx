"use client";

import {
  ArrowLeft, Ban, Check, CircleCheck, Clock, EyeOff, Hourglass, KeyRound, Lock, ShieldCheck, TriangleAlert,
} from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  API_BASE, ApiError, api, describeVault, formatAmount, parseEnvelopeText, shortHex,
  type ClaimResult, type Envelope, type Health, type VaultView,
} from "@/lib/api";

type Step =
  | { kind: "paste" }
  | { kind: "status"; envelope: Envelope; vault: VaultView }
  | { kind: "done"; envelope: Envelope; vault: VaultView; result: ClaimResult };

export function ClaimFlow() {
  const [step, setStep] = React.useState<Step>({ kind: "paste" });
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState<null | "demo" | "check" | "claim">(null);
  const [error, setError] = React.useState<string | null>(null);
  const [health, setHealth] = React.useState<Health | null | "down">(null);

  React.useEffect(() => {
    let alive = true;
    api.health().then((h) => alive && setHealth(h)).catch(() => alive && setHealth("down"));
    return () => { alive = false; };
  }, []);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e));

  async function loadDemo() {
    setBusy("demo"); setError(null);
    try {
      const env = await api.demoEnvelope(0);
      setText(JSON.stringify(env, null, 2));
    } catch (e) { fail(e); } finally { setBusy(null); }
  }

  async function check() {
    setBusy("check"); setError(null);
    try {
      const envelope = parseEnvelopeText(text);
      const vault = await api.vault(envelope.vaultTag);
      setStep({ kind: "status", envelope, vault });
    } catch (e) { fail(e); } finally { setBusy(null); }
  }

  async function refresh(envelope: Envelope) {
    setBusy("check"); setError(null);
    try { setStep({ kind: "status", envelope, vault: await api.vault(envelope.vaultTag) }); }
    catch (e) { fail(e); } finally { setBusy(null); }
  }

  async function claim(envelope: Envelope, vault: VaultView) {
    setBusy("claim"); setError(null);
    try {
      const result = await api.claim(envelope);
      setStep({ kind: "done", envelope, vault, result });
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        // The circuit refused. Re-read the ledger so the status line is current.
        try { setStep({ kind: "status", envelope, vault: await api.vault(envelope.vaultTag) }); } catch { /* keep the old view */ }
      }
      fail(e);
    } finally { setBusy(null); }
  }

  function reset() { setStep({ kind: "paste" }); setError(null); }

  return (
    <div className="flex w-full flex-col gap-4">
      <ServerLine health={health} />

      {step.kind === "paste" && (
        <Card>
          <CardHeader>
            <CardTitle>Paste your envelope</CardTitle>
            <CardDescription>
              The owner gave you a small JSON file. Paste its contents here. It holds your claim secret, so treat it like a seed phrase.
            </CardDescription>
          </CardHeader>
          <CardPanel className="flex flex-col gap-3">
            <Textarea
              aria-label="Envelope JSON"
              className="font-mono text-xs"
              onChange={(e) => setText(e.target.value)}
              placeholder={'{\n  "version": 2,\n  "vaultTag": "…",\n  …\n}'}
              rows={10}
              spellCheck={false}
              value={text}
            />
            {error && <ErrorAlert message={error} />}
          </CardPanel>
          <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              className="w-full sm:w-auto"
              disabled={busy !== null || health === "down" || (health !== null && health.mode === "live")}
              onClick={loadDemo}
              variant="outline"
            >
              {busy === "demo" ? <Spinner /> : null}
              Load demo envelope
            </Button>
            <Button className="w-full sm:w-auto" disabled={busy !== null || !text.trim()} onClick={check} size="lg">
              {busy === "check" ? <Spinner /> : <ShieldCheck />}
              Check my vault
            </Button>
          </CardFooter>
        </Card>
      )}

      {step.kind === "status" && (
        <StatusCard
          busy={busy}
          envelope={step.envelope}
          error={error}
          onBack={reset}
          onClaim={() => claim(step.envelope, step.vault)}
          onRefresh={() => refresh(step.envelope)}
          vault={step.vault}
        />
      )}

      {step.kind === "done" && <ResultCard envelope={step.envelope} onReset={reset} result={step.result} />}

      <p className="px-1 text-center text-muted-foreground text-xs leading-relaxed">
        <Lock aria-hidden className="mr-1 inline size-3 align-[-2px]" />
        Proving uses this server&apos;s self-hosted proof server; your heir secret never leaves your browser except to that server, and it is the only
        secret involved, so no owner key is ever exposed.
      </p>
    </div>
  );
}

function ServerLine({ health }: { health: Health | null | "down" }) {
  if (health === null) return <p className="text-muted-foreground text-xs">Connecting to {API_BASE}…</p>;
  if (health === "down") {
    return (
      <Alert variant="warning">
        <TriangleAlert />
        <AlertTitle>Claim server not reachable</AlertTitle>
        <AlertDescription>
          Nothing is answering at <code className="font-mono">{API_BASE}</code>. Start it with <code className="font-mono">bun run server</code>.
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
      <Badge variant={health.mode === "live" ? "success" : "info"}>{health.mode === "live" ? "Live" : "Simulator"}</Badge>
      <span>network <span className="font-mono">{health.network}</span></span>
      {health.contractAddress && <span className="font-mono">{shortHex(health.contractAddress, 8)}</span>}
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="error">
      <Ban />
      <AlertTitle>Not this time</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function Row({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className={mono ? "flex flex-col gap-1 py-2" : "flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"}>
      <dt className="shrink-0 text-muted-foreground text-sm">{label}</dt>
      <dd className={mono ? "break-all font-mono text-sm" : "text-sm sm:text-right"}>{children}</dd>
    </div>
  );
}

function StatusCard(props: {
  envelope: Envelope; vault: VaultView; busy: string | null; error: string | null;
  onBack: () => void; onClaim: () => void; onRefresh: () => void;
}) {
  const { envelope, vault, busy, error } = props;
  const d = describeVault(vault);
  const Icon = d.tone === "ready" ? CircleCheck : d.tone === "wait" ? Hourglass : Ban;
  const toneClass = d.tone === "ready" ? "text-success" : d.tone === "wait" ? "text-warning" : "text-destructive";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your vault</CardTitle>
        <CardDescription className="font-mono text-xs">{shortHex(vault.tag, 10)}</CardDescription>
      </CardHeader>
      <CardPanel className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-xl bg-muted p-4">
          <Icon aria-hidden className={`mt-0.5 size-5 shrink-0 ${toneClass}`} />
          <p className="font-medium text-base leading-snug">{d.line}</p>
        </div>

        <dl className="divide-y divide-border">
          <Row label="Your share">{formatAmount(envelope.share)}</Row>
          <Row label="Still in the vault">{vault.remaining === null ? "nothing" : formatAmount(vault.remaining)}</Row>
          <Row label="Shares already paid">{vault.claimsSpent}</Row>
          <Row label="Grace / challenge">{vault.graceSeconds}s / {vault.challengeSeconds}s</Row>
          <Row label="Payout key" mono>{shortHex(envelope.heirKey, 10)}</Row>
        </dl>

        <p className="text-muted-foreground text-xs leading-relaxed">
          <KeyRound aria-hidden className="mr-1 inline size-3 align-[-2px]" />
          The payout key was fixed by the owner when they named you. The chain will only pay that key, so no wallet connection is needed here, and a stolen
          envelope still pays you, never the thief.
        </p>

        {error && <ErrorAlert message={error} />}
      </CardPanel>
      <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <div className="flex gap-2">
          <Button disabled={busy !== null} onClick={props.onBack} variant="ghost"><ArrowLeft />Different envelope</Button>
          {d.tone === "wait" && (
            <Button disabled={busy !== null} onClick={props.onRefresh} variant="outline">
              {busy === "check" ? <Spinner /> : <Clock />}Check again
            </Button>
          )}
        </div>
        <Button className="w-full sm:w-auto" disabled={busy !== null || d.tone !== "ready"} onClick={props.onClaim} size="lg">
          {busy === "claim" ? <Spinner /> : <Check />}
          {busy === "claim" ? "Proving and submitting…" : "Claim my share"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function ResultCard({ envelope, result, onReset }: { envelope: Envelope; result: ClaimResult; onReset: () => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CircleCheck aria-hidden className="size-6 text-success" />
          <CardTitle>Paid</CardTitle>
        </div>
        <CardDescription>
          {formatAmount(result.received)} went to the payout key the owner named for you.
          {result.remaining === null ? " The vault is now empty." : ` ${formatAmount(result.remaining)} stays in the vault for the other nominees.`}
        </CardDescription>
      </CardHeader>
      <CardPanel className="flex flex-col gap-4">
        <dl className="divide-y divide-border">
          <Row label="Transaction" mono>
            {result.txHash ?? <span className="font-sans text-muted-foreground">simulated run, nothing was broadcast</span>}
          </Row>
          {result.block !== null && <Row label="Block">{result.block}</Row>}
          <Row label="Paid to" mono>{envelope.heirKey}</Row>
          <Row label="Received">{formatAmount(result.received)}</Row>
        </dl>

        <Separator />

        <div>
          <h3 className="mb-2 font-heading font-semibold text-sm">What the chain saw</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <ul className="flex flex-col gap-2 rounded-xl border p-3 text-sm">
              <li className="flex items-start gap-2">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                <span>
                  <span className="font-medium">Nullifier</span> <Badge size="sm" variant="success">SPENT</Badge>
                  <span className="mt-1 block break-all font-mono text-muted-foreground text-xs">{result.nullifier}</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                <span><span className="font-medium">Vault tag</span> <Badge size="sm" variant="outline">PUBLIC</Badge>
                  <span className="mt-1 block break-all font-mono text-muted-foreground text-xs">{envelope.vaultTag}</span></span>
              </li>
              <li className="flex items-start gap-2">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                <span><span className="font-medium">Remaining balance</span> <Badge size="sm" variant="outline">PUBLIC</Badge>
                  <span className="mt-1 block text-muted-foreground text-xs">{result.remaining === null ? "0, entry removed" : formatAmount(result.remaining)}</span></span>
              </li>
            </ul>
            <ul className="flex flex-col gap-2 rounded-xl border border-dashed p-3 text-sm">
              <li className="flex items-start gap-2">
                <EyeOff aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span><span className="font-medium">Your identity</span> <Badge size="sm" variant="secondary">NOWHERE</Badge>
                  <span className="mt-1 block text-muted-foreground text-xs">No name, no wallet, no link to the owner. One of up to 65,536 leaves proved membership.</span></span>
              </li>
              <li className="flex items-start gap-2">
                <EyeOff aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span><span className="font-medium">Your share</span> <Badge size="sm" variant="secondary">HIDDEN</Badge>
                  <span className="mt-1 block text-muted-foreground text-xs">The amount was a private witness; the coin itself is shielded.</span></span>
              </li>
              <li className="flex items-start gap-2">
                <EyeOff aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span><span className="font-medium">Heir secret and path</span> <Badge size="sm" variant="secondary">HIDDEN</Badge>
                  <span className="mt-1 block text-muted-foreground text-xs">Only a zero-knowledge proof that they fit the owner&apos;s published root.</span></span>
              </li>
            </ul>
          </div>
        </div>
      </CardPanel>
      <CardFooter>
        <Button onClick={onReset} variant="outline"><ArrowLeft />Claim with another envelope</Button>
      </CardFooter>
    </Card>
  );
}
