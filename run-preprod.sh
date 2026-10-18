#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
#
# Run the whole Nominee demo live on Midnight Preprod (served by Blockfrost).
#
# You need a funded, DUST-registered Preprod wallet and a Blockfrost project id
# for "Midnight Preprod". Secrets come from the environment or from local files
# that are gitignored; this script never prints them.
#
#   NOMINEE_BLOCKFROST        project id, or a file .env.blockfrost with
#                             NOMINEE_BLOCKFROST=<id>
#   NOMINEE_MNEMONIC          24 words, or NOMINEE_MNEMONIC_FILE=<path>
#                             ('#' lines in the file are ignored)
#   NOMINEE_HOLD_HEIR=sam     optional: leave one nominee unclaimed so the
#                             heir web page can claim afterwards
#   NOMINEE_DRY_RUN=1         optional: check the setup and print the wallet
#                             address, submit nothing
#
# The first run scans ~1.7M DUST events (about 30 minutes, keep the machine
# awake); it checkpoints to ~/.nominee so later runs start in seconds.
# A run writes deployments/preprod.json and deployments/envelopes/preprod/.
set -euo pipefail
cd "$(dirname "$0")"
export PATH="$HOME/.docker/bin:$HOME/.local/bin:$HOME/.bun/bin:$PATH"

if [ -z "${NOMINEE_BLOCKFROST:-}" ] && [ -f .env.blockfrost ]; then
  NOMINEE_BLOCKFROST="$(sed -nE 's/^NOMINEE_BLOCKFROST=//p' .env.blockfrost)"
fi
[ -n "${NOMINEE_BLOCKFROST:-}" ] || { echo "Set NOMINEE_BLOCKFROST (Blockfrost project id for Midnight Preprod)."; exit 1; }

if [ -z "${NOMINEE_MNEMONIC:-}" ] && [ -n "${NOMINEE_MNEMONIC_FILE:-}" ]; then
  NOMINEE_MNEMONIC="$(grep -v '^#' "$NOMINEE_MNEMONIC_FILE" | tr -s ' \n\t' ' ' | sed -E 's/^ +| +$//g')"
fi
[ -n "${NOMINEE_MNEMONIC:-}" ] || { echo "Set NOMINEE_MNEMONIC or NOMINEE_MNEMONIC_FILE (a funded, DUST-registered Preprod wallet)."; exit 1; }

# Node 22: Node 23+ drops Preprod submissions with wallet SDK 1.2.0.
if command -v fnm >/dev/null 2>&1; then
  fnm ls 2>/dev/null | grep -q "v22\." || fnm install 22
  NODE=(fnm exec --using=22 node)
else
  NODE=(node)
fi
major="$("${NODE[@]}" -p 'process.versions.node.split(".")[0]')"
[ "$major" = "22" ] || echo "warning: node $major, Node 22 is the tested version"

# Preprod lists proof server 8.1.3. The devnet compose runs 8.1.0 on 6300, so
# Preprod gets its own container. Proving stays local: the prover sees every witness.
PS_PORT="${NOMINEE_PREPROD_PROOF_PORT:-6301}"
if ! curl -sf "http://127.0.0.1:$PS_PORT/health" >/dev/null 2>&1; then
  echo "==> proof server 8.1.3 on 127.0.0.1:$PS_PORT"
  docker start midnight-proof-server-preprod >/dev/null 2>&1 || \
    docker run -d --name midnight-proof-server-preprod -p "127.0.0.1:$PS_PORT:6300" \
      midnightntwrk/proof-server:8.1.3 midnight-proof-server -v >/dev/null
  for _ in $(seq 1 60); do curl -sf "http://127.0.0.1:$PS_PORT/health" >/dev/null 2>&1 && break; sleep 2; done
fi
curl -sf "http://127.0.0.1:$PS_PORT/health" >/dev/null || { echo "proof server did not come up on $PS_PORT"; exit 1; }

echo "==> build"
[ -d node_modules ] || bun install --silent   # always from the repo root
bun run --cwd cli build >/dev/null

export NOMINEE_NETWORK=preprod NOMINEE_LIVE=1 NOMINEE_BLOCKFROST NOMINEE_MNEMONIC
export NOMINEE_PROOF_SERVER="http://127.0.0.1:$PS_PORT"

if [ "${NOMINEE_DRY_RUN:-}" = "1" ]; then
  echo "==> dry run: node $("${NODE[@]}" -v), proof server $(curl -s "http://127.0.0.1:$PS_PORT/version"), wallet words: $(wc -w <<<"$NOMINEE_MNEMONIC" | tr -d ' ')"
  "${NODE[@]}" cli/dist/index.js address
  exit 0
fi

echo "==> demo (live on Preprod)"
if command -v caffeinate >/dev/null 2>&1; then
  exec caffeinate -dimsu "${NODE[@]}" cli/dist/index.js demo
else
  exec "${NODE[@]}" cli/dist/index.js demo
fi
