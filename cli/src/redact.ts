// SPDX-License-Identifier: Apache-2.0
//
// Keep the Blockfrost project id off the terminal. It rides in every Preprod
// URL as ?project_id=..., and both the CLI and the SDK's RPC logger print those
// URLs. Import this module FIRST in an entry point: it wraps stdout and stderr
// so every write, from any library, has the id replaced.
const id = process.env.NOMINEE_BLOCKFROST ?? '';
const MASK = '<blockfrost-id>';

if (id.length >= 8) {
  for (const stream of [process.stdout, process.stderr]) {
    const orig = stream.write.bind(stream) as (...a: any[]) => boolean;
    (stream as any).write = (chunk: any, ...rest: any[]) => {
      if (typeof chunk === 'string') {
        if (chunk.includes(id)) chunk = chunk.split(id).join(MASK);
      } else if (chunk instanceof Uint8Array) {
        const text = Buffer.from(chunk).toString('utf8');
        if (text.includes(id)) chunk = text.split(id).join(MASK);
      }
      return orig(chunk, ...rest);
    };
  }
}

export const redacted = (s: string) => (id.length >= 8 ? s.split(id).join(MASK) : s);
