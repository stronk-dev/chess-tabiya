#!/usr/bin/env python3
"""DISPOSABLE research harness — D366. Not production code.

Two Maia-free measurements over the whole tablebase-ground-truthed corpus:

1. **The criticality census.** How often an endgame position on this corpus has a
   live decision at all (some legal move keeps the result class, some drops it),
   split by result class and by which side of the pack is to move. This is what
   makes a preservation rate meaningful, and it is also the measurement that says
   whether Maia is ever AT such a decision in the packs as authored.

2. **What `perfect_tablebase` actually picks.** The shipped mode orders
   category-preserving moves by SMALLEST |DTZ| when winning
   (`apps/server/src/opponent-selector.ts:635-637`). DTZ is distance to zeroing —
   the next capture or pawn move — so the claim "it beelines toward
   simplification" is testable as a rate: how often is its pick a capture or a
   pawn move, against the share of captures and pawn moves among all the
   preserving moves it chose from? Move type is read off the SAN the tablebase
   itself returned; nothing here grades a move.
"""
import json
import hashlib
import sys
from collections import Counter, defaultdict


def load(path):
    out = []
    with open(path) as handle:
        for line in handle:
            line = line.strip()
            if line:
                out.append(json.loads(line))
    return out


def is_capture(san):
    return "x" in san


def is_pawn_move(san):
    return san[0] in "abcdefgh"


def neutral_key(fen, uci):
    return hashlib.sha256((fen + "\0" + uci).encode()).hexdigest()


def main():
    rows = load(sys.argv[1])
    out_path = sys.argv[2]

    census = defaultdict(lambda: {"positions": 0, "critical": 0})
    per_pack = defaultdict(lambda: {"positions": 0, "critical": 0})
    side_split = defaultdict(lambda: {"positions": 0, "critical": 0})
    for row in rows:
        own = row["resultClass"]
        preserving = [m for m in row["moves"] if m["moverClass"] == own]
        dropping = [m for m in row["moves"] if m["moverClass"] != own]
        critical = bool(preserving) and bool(dropping)
        for bucket, key in (
            (census, own),
            (per_pack, row["packId"]),
            (side_split, "maia-side" if row["sideToMove"] != row["learnerSide"] else "learner-side"),
        ):
            bucket[key]["positions"] += 1
            bucket[key]["critical"] += 1 if critical else 0

    # perfect_tablebase's pick, reproduced from the shipped ordering.
    picks = {"win": Counter(), "draw": Counter(), "loss": Counter()}
    pools = {"win": Counter(), "draw": Counter(), "loss": Counter()}
    uniform_expected = {"win": Counter(), "draw": Counter(), "loss": Counter()}
    dtz_ties = {"win": 0, "draw": 0, "loss": 0}
    for row in rows:
        own = row["resultClass"]
        preserving = [m for m in row["moves"] if m["moverClass"] == own]
        if not preserving:
            continue
        winning = "win" in row["category"]
        losing = "loss" in row["category"]
        primary = [
            abs(m["dtz"] or 0) if winning else (-abs(m["dtz"] or 0) if losing else 0)
            for m in preserving
        ]
        dtz_ties[own] += 1 if sum(value == min(primary) for value in primary) > 1 else 0
        ordered = sorted(
            preserving,
            key=lambda m: (
                abs(m["dtz"] or 0) if winning else (-abs(m["dtz"] or 0) if losing else 0),
                neutral_key(row["fen"], m["uci"]),
                m["uci"],
            ),
        )
        pick = ordered[0]
        picks[own]["n"] += 1
        picks[own]["capture"] += 1 if is_capture(pick["san"]) else 0
        picks[own]["pawn"] += 1 if is_pawn_move(pick["san"]) else 0
        picks[own]["captureOrPawn"] += 1 if (is_capture(pick["san"]) or is_pawn_move(pick["san"])) else 0
        pools[own]["n"] += len(preserving)
        pools[own]["capture"] += sum(1 for m in preserving if is_capture(m["san"]))
        pools[own]["pawn"] += sum(1 for m in preserving if is_pawn_move(m["san"]))
        pools[own]["captureOrPawn"] += sum(
            1 for m in preserving if is_capture(m["san"]) or is_pawn_move(m["san"])
        )
        uniform_expected[own]["capture"] += sum(1 for m in preserving if is_capture(m["san"])) / len(preserving)
        uniform_expected[own]["pawn"] += sum(1 for m in preserving if is_pawn_move(m["san"])) / len(preserving)
        uniform_expected[own]["captureOrPawn"] += sum(
            1 for m in preserving if is_capture(m["san"]) or is_pawn_move(m["san"])
        ) / len(preserving)

    report = {
        "corpusPositions": len(rows),
        "packs": dict(Counter(r["packId"] for r in rows)),
        "byResultClass": {k: dict(v) for k, v in census.items()},
        "byPack": {k: dict(v) for k, v in sorted(per_pack.items())},
        "bySideOfThePack": {k: dict(v) for k, v in side_split.items()},
        "perfectTablebasePick": {k: dict(v) for k, v in picks.items()},
        "preservingMovePool": {k: dict(v) for k, v in pools.items()},
        "uniformExpectedPick": {k: dict(v) for k, v in uniform_expected.items()},
        "dtzTiedRoots": dtz_ties,
        "pieceCounts": dict(Counter(r["pieceCount"] for r in rows)),
    }
    with open(out_path, "w") as handle:
        json.dump(report, handle, indent=1)
    print(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
