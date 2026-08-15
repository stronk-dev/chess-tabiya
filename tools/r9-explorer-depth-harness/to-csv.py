#!/usr/bin/env python3
"""DISPOSABLE research harness — R9. Not production code.

Flattens the explorer JSONL into the committed evidence CSV: one row per
position x band, plus the per-move counts that clear the 100-game floor. The raw
JSONL (3+ MB, with full monthly history) stays out of the tree; this is the record
of what the explorer returned on the measurement date, since its counts drift.
"""
import csv
import json
import sys

out = csv.writer(open(sys.argv[-1], "w", newline=""))
out.writerow(["source", "packId", "phase", "ply", "spineDepth", "mainLine", "pieceCount",
              "legalCount", "band", "since", "until", "speeds", "total", "white", "draws",
              "black", "movesGE100", "movesGE400", "topMoves", "fen"])
for path in sys.argv[1:-1]:
    name = path.split("/")[-1].replace(".jsonl", "")
    with open(path) as handle:
        for line in handle:
            if not line.strip():
                continue
            r = json.loads(line)
            if r["status"] != 200 or r["raw"] is None:
                continue
            counts = [(m["san"], m["white"] + m["draws"] + m["black"], m["white"], m["draws"], m["black"])
                      for m in r["raw"]["moves"]]
            out.writerow([
                name, r["packId"], r["phase"], r["ply"], r["spineDepth"], r["mainLine"],
                r["pieceCount"], r["legalCount"],
                "+".join(str(b) for b in ([r["band"]] if isinstance(r["band"], int) else r["band"])),
                r["since"], r["until"], "+".join(r["speeds"]), r["total"],
                r["raw"]["white"], r["raw"]["draws"], r["raw"]["black"],
                sum(1 for c in counts if c[1] >= 100), sum(1 for c in counts if c[1] >= 385),
                ";".join(f"{s}:{n}:{w}/{d}/{b}" for s, n, w, d, b in counts), r["fen"],
            ])
print(f"wrote {sys.argv[-1]}")
