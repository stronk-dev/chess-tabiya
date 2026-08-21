#!/usr/bin/env bash
# DISPOSABLE research harness — D333. Not production code.
# The ledger's own PRE-REGISTERED D324 design: bands {1000, 1400, 1800, 2200}
# against a FIXED band-1400 reference (design/BACKLOG.md D324 🔬).
# Pass = monotone score across all four arms with non-overlapping 95% CIs.
set -euo pipefail

SP="${SP:-/tmp/d333}"
SHARDS="${SHARDS:-13}"  # ODD on purpose: with an even shard count, gameIndex%shards
                        # would put every A-white game in an even shard and every
                        # B-white game in an odd one, confounding worker with colour.
export MAIA_IMAGE="${MAIA_IMAGE:-chess-tabiya-maia:dev}"
export MAIA_THREADS="${MAIA_THREADS:-1}"
mkdir -p "$SP/games"

run_arm() {
  local name="$1" a="$2" b="$3" rounds="$4"
  echo "=== arm $name  A=$a  B=$b  rounds=$rounds  $(date -u +%H:%M:%S) ==="
  for i in $(seq 0 $((SHARDS - 1))); do
    MAIA_SEED=$((1000 + i)) node "$SP/play-games.mjs" "$SP/book.json" "$SP/games/$name.s$i.jsonl" \
      "$a" "$b" "$rounds" "$i" "$SHARDS" >"$SP/games/$name.s$i.log" 2>&1 &
  done
  wait
  cat "$SP/games/$name".s*.jsonl >"$SP/games/$name.jsonl"
  echo "--- $name games=$(wc -l <"$SP/games/$name.jsonl")"
}

run_arm ladder-1000-v-1400 1000 1400 3
run_arm ladder-1400-v-1400 1400 1400 3
run_arm ladder-1800-v-1400 1800 1400 3
run_arm ladder-2200-v-1400 2200 1400 3

echo "LADDER DONE $(date -u +%H:%M:%S)"
