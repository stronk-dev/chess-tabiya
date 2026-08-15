#!/usr/bin/env python3
"""DISPOSABLE research harness — R5. Not production code.

Answers the third R5 question: what the measured policy variation does to
(a) humanConcessionMass and (b) the move the shipped selector actually plays.

Input 1: probe-selection.ts JSONL — repeated end-to-end practical_resistance
selections through the shipped OpponentSelector.
Input 2: analyze.py JSON — the per-key policy-variation report.
"""
from __future__ import annotations

import json
import statistics
import sys
from collections import Counter, defaultdict


def main() -> None:
    selection_path, analysis_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]

    rows = [json.loads(line) for line in open(selection_path, encoding="utf8")]
    analysis = json.load(open(analysis_path, encoding="utf8"))

    by_root: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        by_root[row["fen"]].append(row)

    roots = []
    for fen, group in sorted(by_root.items()):
        group = sorted(group, key=lambda r: r["repeat"])
        refusals = Counter(r["refusal"] for r in group if "refusal" in r)
        ok = [r for r in group if "refusal" not in r]
        moves = Counter(r["moveUci"] for r in ok)
        ratio_vectors = {
            tuple(
                (c["moveUci"], repr(c.get("concessionRatio")))
                for c in sorted(r["candidates"] or [], key=lambda c: c["rank"])
            )
            for r in ok
        }
        # Argmax margin: how far the winner's ratio sits above the runner-up's.
        margins = []
        for r in ok:
            ratios = sorted(
                (c.get("concessionRatio") for c in (r["candidates"] or [])
                 if c.get("concessionRatio") is not None),
                reverse=True,
            )
            if len(ratios) >= 2:
                margins.append(ratios[0] - ratios[1])
            elif len(ratios) == 1:
                margins.append(None)
        finite = [m for m in margins if m is not None]
        roots.append(
            {
                "fen": fen,
                "pieceCount": group[0]["pieceCount"],
                "repeats": len(group),
                "refusals": dict(refusals),
                "selections": len(ok),
                "distinctSelectedMoves": len(moves),
                "selectedMoveCounts": dict(moves.most_common()),
                "distinctRatioVectors": len(ratio_vectors),
                "candidateCount": len(ok[0]["candidates"] or []) if ok else 0,
                "argmaxMarginMin": min(finite) if finite else None,
                "argmaxMarginMedian": statistics.median(finite) if finite else None,
                "zeroMarginRepeats": sum(1 for m in finite if m == 0),
                "medianLatencyMs": statistics.median(r["latencyMs"] for r in group),
                "eloApplied": ok[0].get("eloApplied") if ok else None,
                "seedHonored": ok[0].get("seedHonored") if ok else None,
            }
        )

    decided = [r for r in roots if r["selections"] > 0]
    margins = [r["argmaxMarginMin"] for r in decided if r["argmaxMarginMin"] is not None]

    keys = analysis["keys"]
    summary = {
        "roots": len(roots),
        "rootsWithSelections": len(decided),
        "rootsAllRefused": len([r for r in roots if r["selections"] == 0]),
        "refusalKinds": dict(
            Counter(k for r in roots for k in r["refusals"]).most_common()
        ),
        "rootsWithOneSelectedMove": f"{sum(1 for r in decided if r['distinctSelectedMoves'] == 1)}/{len(decided)}",
        "rootsWithOneRatioVector": f"{sum(1 for r in decided if r['distinctRatioVectors'] == 1)}/{len(decided)}",
        "argmaxMarginMin": min(margins) if margins else None,
        "argmaxMarginMedian": statistics.median(margins) if margins else None,
        "argmaxMarginMax": max(margins) if margins else None,
        "medianSelectionLatencyMs": statistics.median(
            r["medianLatencyMs"] for r in roots
        ) if roots else None,
        # (b) the other consumer of a Maia call: human_common takes the engine's
        # own sampled bestmove, which analyze.py measured directly.
        "policyKeysMeasured": len(keys),
        "policyKeysByteIdentical": sum(1 for k in keys if k["distinctInfoDigests"] == 1),
        "bestmoveKeysStable": sum(1 for k in keys if k["distinctBestmoves"] == 1),
        "bestmoveKeysStableAmongMultiChoice": (
            f"{sum(1 for k in keys if k['distinctBestmoves'] == 1 and k['legalCount'] > 1)}"
            f"/{sum(1 for k in keys if k['legalCount'] > 1)}"
        ),
        "bestmoveDistinctMedian": statistics.median(
            [k["distinctBestmoves"] for k in keys if k["legalCount"] > 1] or [0]
        ),
        "bestmoveTopShareMedian": statistics.median(
            [k["bestmoveTopShare"] for k in keys if k["legalCount"] > 1] or [0]
        ),
    }

    json.dump({"summary": summary, "roots": roots}, open(out_path, "w", encoding="utf8"), indent=1)
    print(json.dumps(summary, indent=1))


if __name__ == "__main__":
    main()
