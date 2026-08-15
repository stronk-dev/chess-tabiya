#!/usr/bin/env python3
"""DISPOSABLE research harness — R9. Not production code.

Picks a ply-stratified sample of main-line positions for the instrument checks
(window width, speed set, band width). The point of these probes is to establish
whether the measured depth is a property of the position or of the pull.
"""
import json
import sys
from collections import defaultdict

explorer_path, positions_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
per_bucket = int(sys.argv[4]) if len(sys.argv) > 4 else 3

totals = {}
with open(explorer_path) as handle:
    for line in handle:
        if not line.strip():
            continue
        row = json.loads(line)
        if row["status"] == 200 and row["band"] == 1600:
            totals[row["fen"]] = row["total"]

source = json.load(open(positions_path))
buckets = defaultdict(list)
for p in source["positions"]:
    if p["phase"] == "endgame" or p["fen"] not in totals:
        continue
    buckets[min(p["ply"] // 5 * 5, 45)].append(p)

picked = []
for bucket in sorted(buckets):
    entries = sorted(buckets[bucket], key=lambda p: -totals[p["fen"]])
    stride = max(1, len(entries) // per_bucket)
    picked.extend(entries[:: stride][:per_bucket])

json.dump({"packs": source["packs"], "positions": picked}, open(out_path, "w"), indent=1)
print(f"picked {len(picked)} positions across {len(buckets)} ply buckets: "
      + ", ".join(f"ply{p['ply']}={totals[p['fen']]}" for p in picked))
