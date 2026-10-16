import { ClaimFlow } from "@/components/claim-flow";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-2">
        <p className="font-heading font-semibold text-muted-foreground text-sm tracking-wide">Nominee</p>
        <h1 className="font-heading font-semibold text-3xl leading-tight tracking-tight sm:text-4xl">Claim your share</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Someone named you as a nominee on their crypto. Paste the envelope they gave you to see whether the vault has opened, and collect your share.
          No wallet to connect, nothing to install.
        </p>
      </header>
      <ClaimFlow />
    </main>
  );
}
