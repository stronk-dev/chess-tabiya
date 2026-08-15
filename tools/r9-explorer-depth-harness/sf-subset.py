#!/usr/bin/env python3
"""DISPOSABLE research harness — R9. Not production code.

Emits a positions.json subset (the shape tools/r4-difficulty-harness/probe-sf.ts
consumes) containing every position that cleared a game-count threshold at any
probed band, so the Stockfish pass runs only where a human oracle exists.
"""
import json
import sys

explorer_path, positions_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
threshold = int(sys.argv[4]) if len(sys.argv) > 4 else 400

keep = set()
with open(explorer_path) as handle:
    for line in handle:
        if not line.strip():
            continue
        row = json.loads(line)
        if row["status"] == 200 and row["total"] is not None and row["total"] >= threshold:
            keep.add(row["fen"])

source = json.load(open(positions_path))
subset = [p for p in source["positions"] if p["fen"] in keep]
json.dump({"packs": source["packs"], "positions": subset}, open(out_path, "w"), indent=1)
print(f"kept {len(subset)} of {len(source['positions'])} positions (>= {threshold} games at some band)")
