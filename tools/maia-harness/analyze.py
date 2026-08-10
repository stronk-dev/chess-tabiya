#!/usr/bin/env python3
"""E4 harness — automatic proxy metrics over records.jsonl (disposable).

Per condition: eval-swing flags (>150cp between consecutive own moves) and a
shuffle index (piece returning to a square it left within an 8-ply window).
These are screening proxies; the blinded human review is the real metric.
"""

import json
import sys
from collections import defaultdict
from pathlib import Path

import chess

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "out")


def games(records):
    grouped = defaultdict(list)
    for r in records:
        grouped[(r["condition"], r["position"], r["game"])].append(r)
    for key, moves in grouped.items():
        yield key, sorted(moves, key=lambda r: r["ply"])


def shuffle_index(moves):
    hits, windows = 0, 0
    for i in range(len(moves)):
        window = moves[i : i + 8]
        if len(window) < 4:
            break
        windows += 1
        seen = {}
        for r in window:
            move = chess.Move.from_uci(r["move"])
            if move.to_square in seen and seen[move.to_square] == move.from_square:
                hits += 1
            seen[move.from_square] = move.to_square
    return hits / windows if windows else 0.0


def main():
    stats = defaultdict(lambda: {"games": 0, "swingFlags": 0, "shuffleSum": 0.0})
    for path in OUT.glob("*/records.jsonl"):
        records = [json.loads(line) for line in path.read_text().splitlines()]
        for (cond, _pos, _game), moves in games(records):
            s = stats[cond]
            s["games"] += 1
            s["shuffleSum"] += shuffle_index(moves)
            evals = [m["evalCpWhite"] for m in moves if m["evalCpWhite"] is not None]
            s["swingFlags"] += sum(
                1 for a, b in zip(evals, evals[2:]) if abs(b - a) > 150
            )
    for cond, s in sorted(stats.items()):
        print(
            f"{cond}: games={s['games']} "
            f"avgShuffle={s['shuffleSum'] / max(s['games'], 1):.3f} "
            f"swingFlagsPerGame={s['swingFlags'] / max(s['games'], 1):.2f}"
        )


if __name__ == "__main__":
    main()
