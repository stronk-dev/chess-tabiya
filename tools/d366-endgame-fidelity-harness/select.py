#!/usr/bin/env python3
"""DISPOSABLE research harness — D366. Not production code.

Turns the tablebase-ground-truthed position corpus from build-set.ts into the
Maia probe set, and prints the criticality census of the whole corpus.

A position is CRITICAL when the tablebase says at least one legal move keeps the
mover's result class and at least one legal move drops it. Only critical
positions carry information about result preservation; on every other position
every legal move scores the same, so a preservation rate measured there is a
property of the position and not of the opponent.

Selection is deterministic: within each pack the critical positions are ordered
by sha256(fen) and the packs are then round-robined, so no position is chosen
for what Maia does in it.
"""
import hashlib
import json
import sys
from collections import Counter, defaultdict


def load(path):
    rows = []
    with open(path) as handle:
        for line in handle:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def classify(row):
    own = row["resultClass"]
    preserving = [m for m in row["moves"] if m["moverClass"] == own]
    dropping = [m for m in row["moves"] if m["moverClass"] != own]
    return preserving, dropping


def main():
    positions_path, out_path, target = sys.argv[1], sys.argv[2], int(sys.argv[3])
    resist_target = int(sys.argv[4]) if len(sys.argv) > 4 else 0
    rows = load(positions_path)

    census = Counter()
    by_pack = defaultdict(list)
    for row in rows:
        preserving, dropping = classify(row)
        critical = bool(preserving) and bool(dropping)
        census[(row["resultClass"], "critical" if critical else "free")] += 1
        if critical:
            by_pack[row["packId"]].append(row)

    print("corpus positions:", len(rows))
    print("packs represented:", len(Counter(r["packId"] for r in rows)))
    for key in sorted(census):
        print("  ", key, census[key])
    print("critical total:", sum(v for k, v in census.items() if k[1] == "critical"))

    for pack in by_pack:
        by_pack[pack].sort(key=lambda r: hashlib.sha256(r["fen"].encode()).hexdigest())

    chosen = []
    index = 0
    while len(chosen) < target:
        added = False
        for pack in sorted(by_pack):
            bucket = by_pack[pack]
            if index < len(bucket) and len(chosen) < target:
                chosen.append(bucket[index])
                added = True
        if not added:
            break
        index += 1

    # Arm B — RESISTANCE. In the 12 `human_common` endgame packs Maia is the side the
    # learner is not, and in a decided endgame that side is usually already lost, where
    # every legal move preserves "loss" and preservation is vacuous. What is measurable
    # there is how long the loss is made to take: |DTZ| after the move, the same metric
    # the shipped perfect_tablebase / practical_resistance order by
    # (opponent-selector.ts:635). Arm B takes lost positions on Maia's own side of the
    # pack, with at least four legal moves and a DTZ spread to resolve.
    resist = defaultdict(list)
    for row in rows:
        if row["resultClass"] != "loss":
            continue
        if row["sideToMove"] == row["learnerSide"]:
            continue
        dtzs = [abs(m["dtz"]) for m in row["moves"] if m["dtz"] is not None]
        if len(row["moves"]) < 4 or len(set(dtzs)) < 3:
            continue
        resist[row["packId"]].append(row)
    for pack in resist:
        resist[pack].sort(key=lambda r: hashlib.sha256(r["fen"].encode()).hexdigest())
    chosen_resist = []
    index = 0
    while len(chosen_resist) < resist_target:
        added = False
        for pack in sorted(resist):
            bucket = resist[pack]
            if index < len(bucket) and len(chosen_resist) < resist_target:
                chosen_resist.append(bucket[index])
                added = True
        if not added:
            break
        index += 1

    out = []
    for row in chosen + chosen_resist:
        preserving, dropping = classify(row)
        out.append(
            {
                "arm": "resistance" if row in chosen_resist else "preservation",
                "key": row["fen"],
                "fen": row["fen"],
                "packId": row["packId"],
                "startFen": row["startFen"],
                "historyUci": row["historyUci"],
                "legalCount": row["legalCount"],
                "resultClass": row["resultClass"],
                "category": row["category"],
                "dtz": row["dtz"],
                "pieceCount": row["pieceCount"],
                "sideToMove": row["sideToMove"],
                "learnerSide": row["learnerSide"],
                "origin": row["origin"],
                "preservingCount": len(preserving),
                "droppingCount": len(dropping),
                "moves": row["moves"],
            }
        )
    with open(out_path, "w") as handle:
        json.dump({"positions": out}, handle)
    print("selected:", len(out), Counter(p["packId"] for p in out))
    print("byArm:", Counter(p["arm"] for p in out))
    print("byClass:", Counter(p["resultClass"] for p in out))
    print("maiaSideInPack:", Counter(p["sideToMove"] != p["learnerSide"] for p in out))
    print(
        "criticalPositionsOnMaiaSideOfThePack:",
        sum(
            1
            for r in rows
            if r["sideToMove"] != r["learnerSide"] and all(classify(r))
        ),
        "of",
        sum(1 for r in rows if r["sideToMove"] != r["learnerSide"]),
        "Maia-side positions",
    )


if __name__ == "__main__":
    main()
