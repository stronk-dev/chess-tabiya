#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
scratch="$(mktemp -d "${TMPDIR:-/tmp}/tabiya-d2237.XXXXXX")"
cleanup() {
  local status="$?"
  if [[ "$status" -eq 0 ]]; then
    rm -rf "$scratch"
  else
    printf 'D2237 capture retained after failure: %s\n' "$scratch" >&2
  fi
}
trap cleanup EXIT

cd "$repo_root"

build_ts() {
  local source="$1"
  local output="$2"
  ./node_modules/.bin/esbuild "$source" --bundle --platform=node --format=esm --outfile="$output"
}

build_ts tools/r4-difficulty-harness/extract.ts "$scratch/extract.mjs"
build_ts tools/maia-wdl-agreement-harness/san-map.ts "$scratch/san-map.mjs"
build_ts tools/maia-wdl-agreement-harness/probe-maia-wdl.ts "$scratch/probe-maia.mjs"
build_ts tools/r4-difficulty-harness/probe-sf.ts "$scratch/probe-sf.mjs"

node "$scratch/extract.mjs" content/drafts "$scratch/positions.json"
python3 tools/maia-wdl-agreement-harness/build-probe-set.py \
  tools/r9-explorer-depth-harness/out/explorer-readings.csv \
  "$scratch/positions.json" "$scratch/probe-set.json"
node "$scratch/san-map.mjs" "$scratch/probe-set.json" "$scratch/san-map.json"
node tools/d2237-bot-trait-screen/select-sf-positions.mjs \
  "$scratch/positions.json" "$scratch/probe-set.json" "$scratch/sf-positions.json"

MAIA_IMAGE="${MAIA_IMAGE:-chess-tabiya-maia:dev}" \
  node "$scratch/probe-maia.mjs" "$scratch/probe-set.json" \
  "$scratch/armA-history.jsonl" 1400,1600,1800 history 0
"${SF_CMD:?SF_CMD must name Stockfish 18}" <<<'quit' >"$scratch/stockfish.identity.txt"
STOCKFISH_PATH="${SF_CMD:?SF_CMD must name Stockfish 18}" \
  node "$scratch/probe-sf.mjs" "$scratch/sf-positions.json" "$scratch/sf-d8.jsonl" 8 all 0 180000

TABIYA_D2237_INPUT_DIR="$scratch" TABIYA_D2237_WRITE=1 \
  ./node_modules/.bin/vitest run \
  --config tools/d2237-bot-trait-screen/vitest.config.ts --reporter=verbose
