#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# One-shot: bring up the local Midnight devnet and run the full Nominee demo
# on-chain (real proofs, real blocks). Safe to re-run.
set -euo pipefail
cd "$(dirname "$0")"

# Docker Desktop is not always on PATH.
export PATH="$HOME/.docker/bin:$HOME/.local/bin:$HOME/.bun/bin:$PATH"
export DOCKER_HOST="${DOCKER_HOST:-unix://$HOME/.docker/run/docker.sock}"

if ! docker ps >/dev/null 2>&1; then
  echo "Docker is not running — starting Docker Desktop…"
  open -a Docker || { echo "Could not start Docker Desktop."; exit 1; }
  for _ in $(seq 1 40); do docker ps >/dev/null 2>&1 && break; sleep 5; done
  docker ps >/dev/null 2>&1 || { echo "Docker did not come up."; exit 1; }
fi

echo "==> devnet"
docker compose up -d >/dev/null
for _ in $(seq 1 40); do
  [ "$(docker ps --filter health=healthy --format '{{.Names}}' | grep -c midnight)" -ge 3 ] && break
  sleep 5
done
docker ps --format '  {{.Names}}: {{.Status}}' | grep midnight

echo "==> build"
[ -d contract/node_modules ] || bun install --silent   # always from the repo root
bun run --cwd cli build >/dev/null

echo "==> demo (live on devnet)"
NOMINEE_LIVE=1 node cli/dist/index.js demo
