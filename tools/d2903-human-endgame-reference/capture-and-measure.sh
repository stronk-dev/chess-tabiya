#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
scratch="$(mktemp -d "${TMPDIR:-/tmp}/tabiya-d2903-providers.XXXXXX")"
cleanup() {
  local status="$?"
  if [[ "$status" -eq 0 ]]; then
    rm -rf "$scratch"
  else
    printf 'D2903 provider scratch retained after failure: %s\n' "$scratch" >&2
  fi
}
trap cleanup EXIT

cd "$repo_root"
if [[ ! -f planning/bot-roster/d2903-human-endgame-population.json ]]; then
  printf 'D2903 provider capture refused: run make bot-human-endgame-reference-population first\n' >&2
  exit 1
fi

./node_modules/.bin/esbuild tools/d2903-human-endgame-reference/prepare-provider-sets.ts \
  --bundle --platform=node --format=esm --outfile="$scratch/prepare-provider-sets.mjs"
./node_modules/.bin/esbuild tools/r4-difficulty-harness/probe-tb.ts \
  --bundle --platform=node --format=esm --outfile="$scratch/probe-tablebase.mjs"
./node_modules/.bin/esbuild tools/maia-wdl-agreement-harness/probe-maia-wdl.ts \
  --bundle --platform=node --format=esm --outfile="$scratch/probe-maia.mjs"

node "$scratch/prepare-provider-sets.mjs" \
  planning/bot-roster/d2903-human-endgame-population.json "$scratch"
tablebase_complete=0
for attempt in 1 2 3; do
  node "$scratch/probe-tablebase.mjs" "$scratch/tablebase-probe-set.json" "$scratch/tablebase.jsonl" 1000
  if node tools/d2903-human-endgame-reference/assert-tablebase-complete.mjs \
    "$scratch/tablebase-probe-set.json" "$scratch/tablebase.jsonl"; then
    tablebase_complete=1
    break
  fi
  printf 'D2903 tablebase retry %s/3 after typed provider failures\n' "$attempt" >&2
  sleep 5
done
if [[ "$tablebase_complete" -ne 1 ]]; then
  printf 'D2903 tablebase capture remained incomplete after three passes\n' >&2
  exit 1
fi

MAIA_IMAGE="${MAIA_IMAGE:-chess-tabiya-maia:dev}" \
  node "$scratch/probe-maia.mjs" "$scratch/maia-1400-probe-set.json" "$scratch/maia-1400.jsonl" 1400 bare 0
MAIA_IMAGE="${MAIA_IMAGE:-chess-tabiya-maia:dev}" \
  node "$scratch/probe-maia.mjs" "$scratch/maia-1800-probe-set.json" "$scratch/maia-1800.jsonl" 1800 bare 0

cmp "$scratch/maia-1400.jsonl.identity.json" "$scratch/maia-1800.jsonl.identity.json"
TABIYA_D2903_INPUT_DIR="$scratch" TABIYA_D2903_WRITE=1 \
  ./node_modules/.bin/vitest run \
  --config tools/d2903-human-endgame-reference/vitest.config.ts --reporter=verbose
