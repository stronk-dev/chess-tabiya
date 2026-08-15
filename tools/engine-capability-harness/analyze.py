#!/usr/bin/env python3
"""DISPOSABLE analyser for the engine-layer capability audit.

Pure: given the same JSONL it rewrites the committed summary byte for byte.

  analyze.py maia   <out.json> <maia-outputs.jsonl>
  analyze.py sf     <out.json> <sf-budget.jsonl>
"""
from __future__ import annotations

import json
import statistics
import sys
from collections import defaultdict


def read(path: str) -> list[dict]:
    with open(path, encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def q(values: list[float], fraction: float) -> float:
    if not values:
        return float("nan")
    ordered = sorted(values)
    index = min(len(ordered) - 1, int(round(fraction * (len(ordered) - 1))))
    return ordered[index]


def spearman(left: list[float], right: list[float]) -> float:
    def ranks(values: list[float]) -> list[float]:
        order = sorted(range(len(values)), key=lambda i: values[i])
        out = [0.0] * len(values)
        index = 0
        while index < len(order):
            stop = index
            while stop + 1 < len(order) and values[order[stop + 1]] == values[order[index]]:
                stop += 1
            average = (index + stop) / 2 + 1
            for position in range(index, stop + 1):
                out[order[position]] = average
            index = stop + 1
        return out

    if len(left) < 2:
        return float("nan")
    a, b = ranks(left), ranks(right)
    mean_a, mean_b = sum(a) / len(a), sum(b) / len(b)
    num = sum((x - mean_a) * (y - mean_b) for x, y in zip(a, b))
    den = (sum((x - mean_a) ** 2 for x in a) * sum((y - mean_b) ** 2 for y in b)) ** 0.5
    return num / den if den else float("nan")


def score(wdl: list[int]) -> float:
    """Expected score for the side to move, from a permille win/draw/loss triple."""
    total = sum(wdl)
    return (wdl[0] + wdl[1] / 2) / total if total else float("nan")


def maia(out_path: str, jsonl: str) -> None:
    rows = read(jsonl)
    candidates = sum(len(row["candidates"]) for row in rows)
    with_policy = sum(1 for row in rows for c in row["candidates"] if c["policy"] is not None)
    with_cp = sum(1 for row in rows for c in row["candidates"] if c["cp"] is not None)
    with_wdl = sum(1 for row in rows for c in row["candidates"] if c["wdl"] is not None)

    # Does the discarded WDL order moves differently from the consumed policy?
    disagree = 0
    comparable = 0
    rhos: list[float] = []
    spreads: list[float] = []
    by_phase: dict[str, list[float]] = defaultdict(list)
    top_policy_not_top_wdl: list[dict] = []
    for row in rows:
        usable = [c for c in row["candidates"] if c["policy"] is not None and c["wdl"] is not None]
        if len(usable) < 2:
            continue
        comparable += 1
        scores = [score(c["wdl"]) for c in usable]
        policies = [c["policy"] for c in usable]
        rhos.append(spearman(policies, scores))
        spread = max(scores) - min(scores)
        spreads.append(spread)
        by_phase[row["phase"]].append(spread)
        best_policy = max(usable, key=lambda c: c["policy"])
        best_wdl = max(usable, key=lambda c: score(c["wdl"]))
        if best_policy["uci"] != best_wdl["uci"]:
            disagree += 1
            if len(top_policy_not_top_wdl) < 5:
                top_policy_not_top_wdl.append({
                    "fen": row["fen"], "elo": row["elo"],
                    "policyArgmax": {"uci": best_policy["uci"], "policy": best_policy["policy"], "score": round(score(best_policy["wdl"]), 4)},
                    "wdlArgmax": {"uci": best_wdl["uci"], "policy": best_wdl["policy"], "score": round(score(best_wdl["wdl"]), 4)},
                })

    # Does the discarded WDL respond to the requested band?
    per_key: dict[tuple[str, str], dict[int, float]] = defaultdict(dict)
    for row in rows:
        for c in row["candidates"]:
            if c["wdl"] is not None:
                per_key[(row["fen"], c["uci"])][row["elo"]] = score(c["wdl"])
    bands = sorted({row["elo"] for row in rows})
    band_deltas: dict[str, list[float]] = defaultdict(list)
    if len(bands) >= 2:
        low, high = bands[0], bands[-1]
        for values in per_key.values():
            if low in values and high in values:
                band_deltas[f"{low}v{high}"].append(abs(values[high] - values[low]))
    changed = sum(1 for d in band_deltas[f"{bands[0]}v{bands[-1]}"] if d > 0) if len(bands) >= 2 else 0
    total_pairs = len(band_deltas[f"{bands[0]}v{bands[-1]}"]) if len(bands) >= 2 else 0

    latencies = [row["elapsedMs"] for row in rows]
    summary = {
        "arm": "maia-discarded-outputs",
        "probes": len(rows),
        "positions": len({row["fen"] for row in rows}),
        "bands": bands,
        "multiPvRequested": 20,
        "candidateRows": candidates,
        "fieldCoverage": {
            "policy": {"present": with_policy, "pct": round(100 * with_policy / candidates, 2) if candidates else None},
            "scoreCp": {"present": with_cp, "pct": round(100 * with_cp / candidates, 2) if candidates else None},
            "wdl": {"present": with_wdl, "pct": round(100 * with_wdl / candidates, 2) if candidates else None},
        },
        "wdlVersusPolicy": {
            "comparableProbes": comparable,
            "argmaxDisagreements": disagree,
            "argmaxDisagreementPct": round(100 * disagree / comparable, 2) if comparable else None,
            "spearmanPolicyVsWdlScore": {
                "median": round(statistics.median(rhos), 4) if rhos else None,
                "p10": round(q(rhos, 0.10), 4) if rhos else None,
                "p90": round(q(rhos, 0.90), 4) if rhos else None,
            },
            "wdlScoreSpreadWithinProbe": {
                "median": round(statistics.median(spreads), 4) if spreads else None,
                "min": round(min(spreads), 4) if spreads else None,
                "max": round(max(spreads), 4) if spreads else None,
            },
            "wdlScoreSpreadByPhase": {
                phase: {"n": len(values), "median": round(statistics.median(values), 4)}
                for phase, values in sorted(by_phase.items())
            },
            "examples": top_policy_not_top_wdl,
        },
        "wdlBandResponse": {
            "pairs": total_pairs,
            "changedAcrossBandExtremes": changed,
            "changedPct": round(100 * changed / total_pairs, 2) if total_pairs else None,
            "absDeltaScore": {
                "median": round(statistics.median(band_deltas[f"{bands[0]}v{bands[-1]}"]), 4) if total_pairs else None,
                "max": round(max(band_deltas[f"{bands[0]}v{bands[-1]}"]), 4) if total_pairs else None,
            },
        },
        "latencyMs": {
            "median": round(statistics.median(latencies), 1),
            "p95": round(q(latencies, 0.95), 1),
            "max": round(max(latencies), 1),
        },
    }
    with open(out_path, "w", encoding="utf-8") as handle:
        json.dump(summary, handle, indent=2, sort_keys=True)
        handle.write("\n")
    print(json.dumps(summary, indent=2, sort_keys=True))


def sf(out_path: str, jsonl: str) -> None:
    rows = read(jsonl)
    by_arm: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        by_arm[row["arm"]].append(row)

    arms = {}
    for arm, entries in by_arm.items():
        latencies = [entry["elapsedMs"] for entry in entries]
        # Reproducibility: do the repeats of the same position agree?
        by_fen: dict[str, list[dict]] = defaultdict(list)
        for entry in entries:
            by_fen[entry["fen"]].append(entry)
        agree_move = 0
        agree_score = 0
        compared = 0
        for group in by_fen.values():
            if len(group) < 2:
                continue
            compared += 1
            if len({entry["bestmove"] for entry in group}) == 1:
                agree_move += 1
            if len({(entry["cp"], entry["mate"]) for entry in group}) == 1:
                agree_score += 1
        depths = [entry["depth"] for entry in entries if entry["depth"] is not None]
        arms[arm] = {
            "probes": len(entries),
            "latencyMs": {
                "median": round(statistics.median(latencies), 1),
                "p95": round(q(latencies, 0.95), 1),
                "max": round(max(latencies), 1),
                "overBudget500": sum(1 for value in latencies if value > 500),
                "overBudget500Pct": round(100 * sum(1 for value in latencies if value > 500) / len(latencies), 2),
            },
            "achievedDepth": {
                "median": statistics.median(depths) if depths else None,
                "min": min(depths) if depths else None,
                "max": max(depths) if depths else None,
            },
            "repeatAgreement": {
                "positions": compared,
                "sameBestMove": agree_move,
                "sameBestMovePct": round(100 * agree_move / compared, 2) if compared else None,
                "sameScore": agree_score,
                "sameScorePct": round(100 * agree_score / compared, 2) if compared else None,
            },
        }

    # Cross-arm: does a fixed-depth arm reproduce the movetime arm's move choice?
    reference = "movetime:100"
    cross = {}
    if reference in by_arm:
        ref_by_fen = {entry["fen"]: entry for entry in by_arm[reference] if entry["repeat"] == 0}
        for arm, entries in by_arm.items():
            if arm == reference:
                continue
            same = 0
            total = 0
            for entry in entries:
                if entry["repeat"] != 0:
                    continue
                other = ref_by_fen.get(entry["fen"])
                if other is None:
                    continue
                total += 1
                if other["bestmove"] == entry["bestmove"]:
                    same += 1
            cross[arm] = {
                "positions": total,
                "sameMoveAsMovetime100": same,
                "pct": round(100 * same / total, 2) if total else None,
            }

    summary = {
        "arm": "strong-engine-search-bound",
        "probes": len(rows),
        "positions": len({row["fen"] for row in rows}),
        "budgetMsPerInstrumentCall": 500,
        "arms": dict(sorted(arms.items())),
        "moveAgreementWithMovetime100": dict(sorted(cross.items())),
    }
    with open(out_path, "w", encoding="utf-8") as handle:
        json.dump(summary, handle, indent=2, sort_keys=True)
        handle.write("\n")
    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":
    mode, out_path, jsonl = sys.argv[1], sys.argv[2], sys.argv[3]
    if mode == "maia":
        maia(out_path, jsonl)
    elif mode == "sf":
        sf(out_path, jsonl)
    else:
        raise SystemExit(f"unknown mode {mode}")
