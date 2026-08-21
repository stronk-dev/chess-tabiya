#!/usr/bin/env bash
# DISPOSABLE research harness — D333. Not production code.
# Runs the whole arm plan. SP is a scratch dir; JSONL is regenerable and not committed.
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

# Controls first: if the null control is not ~0.500 and the positive control is not
# lopsided, nothing downstream is readable.
run_arm null-1500-1500      1500  1500          4
run_arm ctl-temp-1500       1500  1500:5.0:1.0  2
# Widest usable band gap first — the headline. If the dial moves the result anywhere,
# it moves it here.
run_arm wide-1000-2400      1000  2400          3
run_arm camp-1000-2000      1000  2000          3
run_arm step300-1500-1800   1500  1800          5
run_arm step100-1500-1600   1500  1600          10
run_arm step100-1900-2000   1900  2000          8

# Sensitivity: production conditioning is symmetric (`Elo` sets self AND oppo).
MAIA_ASYMMETRIC=1 run_arm asym-1000-2400 1000 2400 2

echo "ALL DONE $(date -u +%H:%M:%S)"
