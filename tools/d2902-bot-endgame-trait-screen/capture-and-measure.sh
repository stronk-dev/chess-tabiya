#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
scratch="$(mktemp -d "${TMPDIR:-/tmp}/tabiya-d2902.XXXXXX")"
cleanup() {
  local status="$?"
  if [[ "$status" -eq 0 ]]; then
    rm -rf "$scratch"
  else
    printf 'D2902 capture retained after failure: %s\n' "$scratch" >&2
  fi
}
trap cleanup EXIT

cd "$repo_root"
./node_modules/.bin/esbuild tools/maia-wdl-agreement-harness/probe-maia-wdl.ts \
  --bundle --platform=node --format=esm --outfile="$scratch/probe-maia.mjs"
node tools/d2902-bot-endgame-trait-screen/prepare-probe-set.mjs \
  tools/r4-difficulty-harness/out/tb.jsonl "$scratch/probe-set.json"
MAIA_IMAGE="${MAIA_IMAGE:-chess-tabiya-maia:dev}" \
  node "$scratch/probe-maia.mjs" "$scratch/probe-set.json" \
  "$scratch/maia-bare.jsonl" 1400,1600,1800 bare 0
TABIYA_D2902_INPUT_DIR="$scratch" TABIYA_D2902_WRITE=1 \
  ./node_modules/.bin/vitest run \
  --config tools/d2902-bot-endgame-trait-screen/vitest.config.ts --reporter=verbose
