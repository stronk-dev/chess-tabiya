#!/usr/bin/env python3
"""DISPOSABLE research harness — D366. Not production code.

Arm B. In a decided-lost endgame every legal move preserves the loss, so
result-preservation is vacuous and the only measurable quality is how long the
loss is made to take. The metric is |DTZ| after the move — the same quantity the
shipped `perfect_tablebase` orders by (`opponent-selector.ts:635`), where a
losing side is ordered by LARGEST |DTZ|.

Reported per band, against the exact uniform-random-legal-move baseline:
  * mean percentile rank of Maia's move in the position's |DTZ| ordering
    (1.0 = the slowest available loss, 0.0 = the fastest);
  * the share of probes that walk into a move with the minimum available |DTZ|;
  * the share that pick the maximum.
Intervals are cluster bootstraps over positions.
"""
import json
import sys
from collections import defaultdict

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from analyze import cluster_bootstrap, load_jsonl  # noqa: E402


def main():
    set_path, probe_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
    positions = {
        p["key"]: p
        for p in json.load(open(set_path))["positions"]
        if p.get("arm") == "resistance"
    }
    rows = [r for r in load_jsonl(probe_path) if r.get("kind") == "probe" and r.get("error") is None]
    rows = [r for r in rows if r["key"] in positions]
    bands = sorted({r["band"] for r in rows})

    # Complete repeat rounds only.
    seen = defaultdict(set)
    for r in rows:
        seen[r["repeat"]].add((r["key"], r["band"]))
    full = {(k, b) for k in positions for b in bands}
    complete = {rep for rep, got in seen.items() if got >= full}
    rows = [r for r in rows if r["repeat"] in complete]

    report = {"positions": len(positions), "bands": bands, "completeRounds": len(complete), "byBand": {}}
    for band in bands:
        per_pos_pct = []
        per_pos_min = []
        per_pos_max = []
        base_pct = []
        base_min = []
        base_max = []
        for key, pos in positions.items():
            dtzs = {m["uci"]: abs(m["dtz"]) for m in pos["moves"] if m["dtz"] is not None}
            if not dtzs:
                continue
            values = sorted(dtzs.values())
            lo, hi = values[0], values[-1]
            got = [r for r in rows if r["key"] == key and r["band"] == band]
            n = 0
            acc = 0.0
            mins = 0
            maxs = 0
            for r in got:
                d = dtzs.get(r["bestmove"])
                if d is None:
                    continue
                n += 1
                # Percentile rank: share of legal moves at least as fast to lose.
                acc += sum(1 for v in values if v < d) / max(1, len(values) - 1)
                mins += 1 if d == lo else 0
                maxs += 1 if d == hi else 0
            if n:
                per_pos_pct.append((acc, n))
                per_pos_min.append((mins, n))
                per_pos_max.append((maxs, n))
                # Exact uniform baseline for this position at the same probe count.
                mean_pct = sum(
                    sum(1 for v in values if v < d) / max(1, len(values) - 1) for d in values
                ) / len(values)
                base_pct.append((mean_pct * n, n))
                base_min.append((values.count(lo) / len(values) * n, n))
                base_max.append((values.count(hi) / len(values) * n, n))
        report["byBand"][str(band)] = {
            "probes": sum(n for _, n in per_pos_pct),
            "maiaMeanDtzPercentile": cluster_bootstrap(per_pos_pct),
            "uniformMeanDtzPercentile": cluster_bootstrap(base_pct, seed=31),
            "maiaFastestLossShare": cluster_bootstrap(per_pos_min, seed=41),
            "uniformFastestLossShare": cluster_bootstrap(base_min, seed=51),
            "maiaSlowestLossShare": cluster_bootstrap(per_pos_max, seed=61),
            "uniformSlowestLossShare": cluster_bootstrap(base_max, seed=71),
        }
    with open(out_path, "w") as handle:
        json.dump(report, handle, indent=1)
    print(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
