#!/usr/bin/env python3
"""DISPOSABLE research harness — R5. Not production code.

Reduces one or more probe-repeat.ts JSONL arms to the R5 variation report:
what is byte-identical, what varies, and by how much.
"""
from __future__ import annotations

import json
import statistics
import sys
from collections import Counter, defaultdict


def load(paths: list[str]) -> tuple[list[dict], list[dict]]:
    probes, identities = [], []
    for path in paths:
        with open(path, encoding="utf8") as handle:
            for line in handle:
                row = json.loads(line)
                if row.get("kind") == "identity":
                    identities.append(row)
                elif row.get("kind") == "probe":
                    probes.append(row)
    return probes, identities


def policy_map(row: dict) -> dict[str, str | None]:
    return {c["uci"]: c["policyRaw"] for c in row["candidates"]}


def main() -> None:
    out_path = sys.argv[1]
    probes, identities = load(sys.argv[2:])
    errors = [p for p in probes if "error" in p]
    probes = [p for p in probes if "error" not in p]

    groups: dict[tuple, list[dict]] = defaultdict(list)
    for row in probes:
        groups[(row["arm"], row["fen"], row["band"], row["multiPv"])].append(row)

    keys = []
    for key, rows in sorted(groups.items()):
        rows = sorted(rows, key=lambda r: r["repeat"])
        arm, fen, band, multipv = key
        digests = {r["infoDigest"] for r in rows}
        orders = {tuple(c["uci"] for c in r["candidates"]) for r in rows}
        sets_ = {frozenset(c["uci"] for c in r["candidates"]) for r in rows}
        ranks = {tuple((c["uci"], c["rank"]) for c in r["candidates"]) for r in rows}
        policies = {
            tuple(sorted((c["uci"], c["policyRaw"]) for c in r["candidates"])) for r in rows
        }
        bestmoves = Counter(r["bestmove"] for r in rows)

        # numeric drift per move across repeats
        by_move: dict[str, list[float]] = defaultdict(list)
        for r in rows:
            for c in r["candidates"]:
                if c["policyRaw"] is not None:
                    by_move[c["uci"]].append(float(c["policyRaw"]))
        max_abs = 0.0
        max_rel = 0.0
        for move, values in by_move.items():
            if len(values) < 2:
                continue
            spread = max(values) - min(values)
            max_abs = max(max_abs, spread)
            if max(values) > 0:
                max_rel = max(max_rel, spread / max(values))

        base = rows[0]
        pol = {c["uci"]: c["policyRaw"] for c in base["candidates"]}
        top_moves = set()
        sums = set()
        missing = 0
        for r in rows:
            entries = [(c["uci"], c["policyRaw"]) for c in r["candidates"]]
            missing += sum(1 for _, p in entries if p is None)
            scored = [(float(p), u) for u, p in entries if p is not None]
            if scored:
                top_moves.add(max(scored)[1])
                sums.add(round(sum(v for v, _ in scored), 12))

        top_policy = max(
            ((float(p), u) for u, p in pol.items() if p is not None), default=(0.0, None)
        )
        # The recorded candidate list is the evidence a replay shows. If the engine's
        # own sampled bestmove is not in it, the record omits the played move.
        offlist = sum(
            1 for r in rows if r["bestmove"] not in {c["uci"] for c in r["candidates"]}
        )
        keys.append(
            {
                "arm": arm,
                "fen": fen,
                "band": band,
                "multiPv": multipv,
                "repeats": len(rows),
                "cell": base.get("cell"),
                "pieceCount": base.get("pieceCount"),
                "legalCount": base.get("legalCount"),
                "historyPlies": base.get("historyPlies"),
                "candidateCount": len(base["candidates"]),
                "missingPolicyScalars": missing,
                "distinctInfoDigests": len(digests),
                "distinctCandidateOrders": len(orders),
                "distinctCandidateSets": len(sets_),
                "distinctRankVectors": len(ranks),
                "distinctPolicyVectors": len(policies),
                "distinctPolicySums": len(sums),
                "maxAbsPolicyDrift": max_abs,
                "maxRelPolicyDrift": max_rel,
                "distinctTopPolicyMoves": len(top_moves),
                "topPolicyMove": top_policy[1],
                "topPolicyMass": top_policy[0],
                "policySum": min(sums) if sums else None,
                "distinctBestmoves": len(bestmoves),
                "bestmoveCounts": dict(bestmoves.most_common()),
                "bestmoveTopShare": bestmoves.most_common(1)[0][1] / len(rows),
                "bestmoveIsTopPolicy": bestmoves.most_common(1)[0][0] == top_policy[1],
                "bestmoveOffCandidateList": offlist,
                "medianLatencyMs": statistics.median(r["latencyMs"] for r in rows),
            }
        )

    def rate(pred) -> str:
        hit = sum(1 for k in keys if pred(k))
        return f"{hit}/{len(keys)} ({100 * hit / max(1, len(keys)):.1f}%)"

    # band separation: for one fen, do the three bands differ?
    by_fen: dict[tuple, dict[int, str]] = defaultdict(dict)
    for k in keys:
        by_fen[(k["arm"], k["fen"])][k["band"]] = str(
            sorted((c, p) for c, p in [(k["topPolicyMove"], k["policySum"])])
        )
    band_digest: dict[tuple, dict[int, str]] = defaultdict(dict)
    for key, rows in groups.items():
        arm, fen, band, _ = key
        band_digest[(arm, fen)][band] = sorted(rows, key=lambda r: r["repeat"])[0]["infoDigest"]
    multi_band = {k: v for k, v in band_digest.items() if len(v) >= 2}
    band_separated = sum(1 for v in multi_band.values() if len(set(v.values())) == len(v))

    summary = {
        "identities": identities,
        "probes": len(probes),
        "errors": len(errors),
        "keys": len(keys),
        "repeatsPerKey": sorted({k["repeats"] for k in keys}),
        "byteIdenticalInfoBlock": rate(lambda k: k["distinctInfoDigests"] == 1),
        "identicalCandidateOrder": rate(lambda k: k["distinctCandidateOrders"] == 1),
        "identicalCandidateSet": rate(lambda k: k["distinctCandidateSets"] == 1),
        "identicalRankVector": rate(lambda k: k["distinctRankVectors"] == 1),
        "identicalPolicyVector": rate(lambda k: k["distinctPolicyVectors"] == 1),
        "identicalPolicySum": rate(lambda k: k["distinctPolicySums"] == 1),
        "identicalTopPolicyMove": rate(lambda k: k["distinctTopPolicyMoves"] == 1),
        "identicalBestmove": rate(lambda k: k["distinctBestmoves"] == 1),
        "maxAbsPolicyDriftOverAllKeys": max((k["maxAbsPolicyDrift"] for k in keys), default=0),
        "maxRelPolicyDriftOverAllKeys": max((k["maxRelPolicyDrift"] for k in keys), default=0),
        "keysWithMissingPolicyScalars": rate(lambda k: k["missingPolicyScalars"] > 0),
        "candidateCountDistribution": dict(
            Counter(k["candidateCount"] for k in keys).most_common()
        ),
        "distinctBestmoveDistribution": dict(
            Counter(k["distinctBestmoves"] for k in keys).most_common()
        ),
        "bestmoveTopShareMedian": statistics.median(k["bestmoveTopShare"] for k in keys),
        "bestmoveEqualsTopPolicy": rate(lambda k: k["bestmoveIsTopPolicy"]),
        "keysWithBestmoveOffCandidateList": rate(lambda k: k["bestmoveOffCandidateList"] > 0),
        "probesWithBestmoveOffCandidateList": sum(k["bestmoveOffCandidateList"] for k in keys),
        "medianLatencyMsOverKeys": statistics.median(k["medianLatencyMs"] for k in keys),
        "bandSeparation": f"{band_separated}/{len(multi_band)}",
        "policySumMin": min((k["policySum"] for k in keys if k["policySum"]), default=None),
        "policySumMedian": statistics.median(
            [k["policySum"] for k in keys if k["policySum"]] or [0]
        ),
    }

    with open(out_path, "w", encoding="utf8") as handle:
        json.dump({"summary": summary, "keys": keys}, handle, indent=1)
    print(json.dumps(summary, indent=1))


if __name__ == "__main__":
    main()
