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
import math
import os
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
    position_key = " ".join(fen.split()[:5])
    return hashlib.sha256((position_key + "\0" + uci).encode()).hexdigest()


def dtz_metric(move):
    precise = move.get("preciseDtz")
    return abs(precise if precise is not None else (move.get("dtz") or 0))


def ordered_preserving(row):
    own = row["resultClass"]
    preserving = [move for move in row["moves"] if move["moverClass"] == own]
    winning = "win" in row["category"]
    losing = "loss" in row["category"]
    return sorted(
        preserving,
        key=lambda move: (
            dtz_metric(move) if winning else (-dtz_metric(move) if losing else 0),
            neutral_key(row["fen"], move["uci"]),
            move["uci"],
        ),
    )


def wilson(successes, total, z=1.959963984540054):
    if total == 0:
        return [None, None]
    proportion = successes / total
    denominator = 1 + z * z / total
    centre = (proportion + z * z / (2 * total)) / denominator
    radius = z * math.sqrt(proportion * (1 - proportion) / total + z * z / (4 * total * total)) / denominator
    return [centre - radius, centre + radius]


def poisson_binomial_upper_tail(probabilities, observed):
    distribution = [1.0]
    for probability in probabilities:
        updated = [0.0] * (len(distribution) + 1)
        for count, mass in enumerate(distribution):
            updated[count] += mass * (1 - probability)
            updated[count + 1] += mass * probability
        distribution = updated
    return sum(distribution[observed:])


def main():
    source_path = sys.argv[1]
    rows = load(source_path)
    out_path = sys.argv[2]
    for row in rows:
        for move in row["moves"]:
            if "preciseDtz" not in move:
                raise ValueError(f'{row["fen"]}: move {move.get("uci")} omitted preciseDtz')

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
    uniform_probabilities = {"win": [], "draw": [], "loss": []}
    primary_expected = {"win": Counter(), "draw": Counter(), "loss": Counter()}
    primary_probabilities = {"win": [], "draw": [], "loss": []}
    dtz_ties = {"win": 0, "draw": 0, "loss": 0}
    for row in rows:
        own = row["resultClass"]
        preserving = ordered_preserving(row)
        if not preserving:
            continue
        winning = "win" in row["category"]
        losing = "loss" in row["category"]
        primary = [
            dtz_metric(m) if winning else (-dtz_metric(m) if losing else 0)
            for m in preserving
        ]
        primary_pool = [move for move, value in zip(preserving, primary) if value == min(primary)]
        dtz_ties[own] += 1 if len(primary_pool) > 1 else 0
        pick = preserving[0]
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
        uniform_probabilities[own].append(
            sum(1 for m in preserving if is_capture(m["san"]) or is_pawn_move(m["san"])) / len(preserving)
        )
        primary_probability = sum(
            1 for m in primary_pool if is_capture(m["san"]) or is_pawn_move(m["san"])
        ) / len(primary_pool)
        primary_expected[own]["captureOrPawn"] += primary_probability
        primary_probabilities[own].append(primary_probability)

    with open(source_path, "rb") as source_handle:
        source_bytes = source_handle.read()
    rates = {}
    for own in ("win", "draw", "loss"):
        total = picks[own]["n"]
        selected = picks[own]["captureOrPawn"]
        expected_total = uniform_expected[own]["captureOrPawn"]
        primary_expected_total = primary_expected[own]["captureOrPawn"]
        selected_rate = selected / total if total else None
        expected_rate = expected_total / total if total else None
        rates[own] = {
            "positions": total,
            "selectedCaptureOrPawn": selected,
            "selectedRate": selected_rate,
            "selectedRateWilson95": wilson(selected, total),
            "uniformExpectedCount": expected_total,
            "uniformExpectedRate": expected_rate,
            "enrichment": selected_rate / expected_rate if expected_rate else None,
            "uniformUpperTailP": poisson_binomial_upper_tail(uniform_probabilities[own], selected),
            "dtzPrimaryExpectedCount": primary_expected_total,
            "dtzPrimaryExpectedRate": primary_expected_total / total if total else None,
            "enrichmentOverDtzPrimary": selected / primary_expected_total if primary_expected_total else None,
            "dtzPrimaryUpperTailP": poisson_binomial_upper_tail(primary_probabilities[own], selected),
        }
    report = {
        "schema": "tabiya.research.d457-dtz-census.v1",
        "source": {
            "path": source_path,
            "bytes": os.path.getsize(source_path),
            "sha256": hashlib.sha256(source_bytes).hexdigest(),
            "preciseDtzPresentOnEveryMove": True,
        },
        "selectorConvention": {
            "primary": "abs(preciseDtz ?? dtz ?? 0)",
            "winning": "ascending",
            "losing": "descending",
            "drawn": "neutral_sha256",
            "neutralFenFields": 5,
        },
        "corpusPositions": len(rows),
        "packs": dict(Counter(r["packId"] for r in rows)),
        "byResultClass": {k: dict(v) for k, v in census.items()},
        "byPack": {k: dict(v) for k, v in sorted(per_pack.items())},
        "bySideOfThePack": {k: dict(v) for k, v in side_split.items()},
        "perfectTablebasePick": {k: dict(v) for k, v in picks.items()},
        "preservingMovePool": {k: dict(v) for k, v in pools.items()},
        "uniformExpectedPick": {k: dict(v) for k, v in uniform_expected.items()},
        "dtzPrimaryExpectedPick": {k: dict(v) for k, v in primary_expected.items()},
        "perfectTablebaseRates": rates,
        "dtzTiedRoots": dtz_ties,
        "pieceCounts": dict(Counter(r["pieceCount"] for r in rows)),
    }
    with open(out_path, "w") as handle:
        json.dump(report, handle, indent=1)
    print(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
