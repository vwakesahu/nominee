// SPDX-License-Identifier: Apache-2.0
// Custom(170) = Malformed(InvalidDustSpendProof).
//
// Proving takes seconds and the dust state advances while it runs, so by
// submission time the proof refers to a spend that is no longer current.
// Resubmitting the SAME finalised transaction therefore fails forever, the
// fix is to rebuild and re-prove from scratch on every attempt.
// Measured in validation/VALIDATION_FINAL.md §A0: the probe deploy succeeded
// on attempt 2 with exactly this loop.
import chalk from 'chalk';

export const LEDGER_ERRORS: Record<string, string> = {
  '117': 'Malformed(NotNormalized)',
  '126': 'Malformed(Unbalanced)',
  '138': 'Malformed(BalanceCheckOverspend)',
  '170': 'Malformed(InvalidDustSpendProof)',
  '189': 'Malformed(InputsNotSorted)',
  '190': 'Malformed(OutputsNotSorted)',
  '191': 'Malformed(DuplicateInputs)',
  '192': 'Malformed(InputsSignaturesLengthMismatch)',
  '214': 'Malformed(EffectsCheck.RealUnshieldedSpendsSubsetCheckFailure)',
  '227': 'Malformed(DisjointCheck.UnshieldedInputsDisjointFailure)',
  '231': 'Malformed(FeeCalculation.OutsideTimeToDismiss)',
};

/** The SDK swallows the RPC text, so capture the code from console noise too. */
let lastRpcCode: string | null = null;
for (const stream of ['log', 'error', 'warn'] as const) {
  const orig = (console as any)[stream].bind(console);
  (console as any)[stream] = (...a: any[]) => {
    const m = a.map(String).join(' ').match(/Custom error:\s*(\d+)/i);
    if (m) lastRpcCode = m[1];
    orig(...a);
  };
}

export function describe(e: any): string {
  const parts: string[] = [];
  let cur = e;
  for (let i = 0; i < 8 && cur; i++) {
    if (cur.message) parts.push(String(cur.message));
    cur = cur.cause;
  }
  return parts.join('  <-  ') || String(e);
}

export function errorCode(e: any): string | null {
  const m = describe(e).match(/Custom error:\s*(\d+)|Custom\((\d+)\)/i);
  return m ? (m[1] ?? m[2]) : lastRpcCode;
}

/** Rebuild-and-re-prove on 170. Never resubmits the same transaction. */
export async function withRetries<T>(
  label: string,
  build: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let last: any;
  for (let i = 1; i <= attempts; i++) {
    lastRpcCode = null;
    try {
      return await build();
    } catch (e: any) {
      last = e;
      if (errorCode(e) !== '170') throw e;
      console.log(
        chalk.yellow(
          `  ↻ ${label}: attempt ${i}/${attempts} hit Custom(170) InvalidDustSpendProof ` +
            ` dust state moved while proving, rebuilding and re-proving…`,
        ),
      );
      if (i === attempts) break;
      await new Promise((r) => setTimeout(r, 1500 + i * 800));
    }
  }
  throw last;
}
