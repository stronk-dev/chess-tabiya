# DISPOSABLE research harness — R4 (planning/campaign-research-queue.md).
# Out-of-range behaviour of the two candidate concession classifiers: how often the
# position is "decided" at all, what fraction of moves each classifier calls conceding,
# and whether the concession set is stable across search depth (no ground truth exists
# out of range, so self-consistency is the only checkable property).
import json, sys, collections, statistics

MATE = 100_000


def score(entry):
    if entry["mate"] is not None:
        n = entry["mate"]
        return (MATE - 100 * abs(n)) * (1 if n > 0 else -1)
    return entry["cp"]


def load(path):
    by_depth = collections.defaultdict(dict)
    for line in open(path):
        line = line.strip()
        if not line:
            continue
        row = json.loads(line)
        if row.get("error"):
            continue
        by_depth[row["depth"]][row["fen"]] = row
    return by_depth


def concessions(entries, kind, param):
    scores = {e["uci"]: score(e) for e in entries}
    best = max(scores.values())
    if kind == "window":
        return {u: (best - s) > param for u, s in scores.items()}, best
    cls = lambda s: 1 if s > param else (-1 if s < -param else 0)
    return {u: cls(s) != cls(best) for u, s in scores.items()}, best


def main():
    path, out = sys.argv[1], sys.argv[2]
    by_depth = load(path)
    report = {}
    for depth in sorted(by_depth):
        rows = [r for r in by_depth[depth].values() if len(r["entries"]) >= 2]
        go = [r["goMs"] for r in rows]
        reset = [r["resetMs"] for r in rows]
        legal = [r["legalCount"] for r in rows]
        entry = {
            "positions": len(rows),
            "meanLegalMoves": statistics.mean(legal),
            "goMs": {
                "min": min(go),
                "median": statistics.median(go),
                "mean": statistics.mean(go),
                "p95": sorted(go)[int(0.95 * (len(go) - 1))],
                "max": max(go),
            },
            "resetMs": {"median": statistics.median(reset), "max": max(reset)},
            "reachedRequestedDepth": sum(1 for r in rows if r["reachedDepth"] >= depth),
            "classifiers": {},
        }
        best_abs = sorted(abs(max(score(e) for e in r["entries"])) for r in rows)
        entry["absBestCp"] = {
            "median": statistics.median(best_abs),
            "p90": best_abs[int(0.90 * (len(best_abs) - 1))],
            "max": best_abs[-1],
            "over100": sum(1 for v in best_abs if v > 100) / len(best_abs),
            "over200": sum(1 for v in best_abs if v > 200) / len(best_abs),
            "over500": sum(1 for v in best_abs if v > 500) / len(best_abs),
        }
        for name, kind, param in [
            ("window50", "window", 50),
            ("window100", "window", 100),
            ("window200", "window", 200),
            ("class100", "class", 100),
            ("class150", "class", 150),
            ("class300", "class", 300),
        ]:
            rates, decided, all_none, all_all = [], 0, 0, 0
            for row in rows:
                conc, best = concessions(row["entries"], kind, param)
                rates.append(sum(conc.values()) / len(conc))
                if kind == "class":
                    threshold = param
                    if abs(best) > threshold:
                        decided += 1
                if all(not v for v in conc.values()):
                    all_none += 1
                if all(conc.values()) or sum(conc.values()) == len(conc) - 1:
                    all_all += 1
            entry["classifiers"][name] = {
                "meanConcedeRate": statistics.mean(rates),
                "medianConcedeRate": statistics.median(rates),
                "positionsWithZeroConcessions": all_none / len(rows),
                "positionsWhereOnlyBestSurvives": all_all / len(rows),
                **({"decidedPositions": decided / len(rows)} if kind == "class" else {}),
            }
        report[depth] = entry

    depths = sorted(by_depth)
    stability = {}
    for i in range(len(depths) - 1):
        a, b = depths[i], depths[i + 1]
        shared = [f for f in by_depth[a] if f in by_depth[b] and len(by_depth[a][f]["entries"]) >= 2]
        for name, kind, param in [
            ("window100", "window", 100),
            ("class100", "class", 100),
            ("class150", "class", 150),
        ]:
            agree_moves = total_moves = same_set = 0
            for f in shared:
                ca, _ = concessions(by_depth[a][f]["entries"], kind, param)
                cb, _ = concessions(by_depth[b][f]["entries"], kind, param)
                keys = set(ca) & set(cb)
                agree_moves += sum(1 for k in keys if ca[k] == cb[k])
                total_moves += len(keys)
                if all(ca[k] == cb[k] for k in keys):
                    same_set += 1
            stability[f"d{a}->d{b}|{name}"] = {
                "positions": len(shared),
                "moveAgreement": agree_moves / total_moves if total_moves else None,
                "setMatchRate": same_set / len(shared) if shared else None,
            }
    report["crossDepthStability"] = stability

    json.dump(report, open(out, "w"), indent=1)
    for depth in depths:
        e = report[depth]
        print(
            f"\n=== depth {depth} n={e['positions']} meanLegal={e['meanLegalMoves']:.1f} "
            f"go median={e['goMs']['median']:.0f}ms mean={e['goMs']['mean']:.0f}ms "
            f"p95={e['goMs']['p95']:.0f}ms max={e['goMs']['max']:.0f}ms reset={e['resetMs']['median']:.0f}ms ==="
        )
        a = e["absBestCp"]
        print(
            f"  |bestEval| median={a['median']:.0f}cp p90={a['p90']:.0f}cp max={a['max']:.0f}cp "
            f">100cp={a['over100']:.3f} >200cp={a['over200']:.3f} >500cp={a['over500']:.3f}"
        )
        for name, v in e["classifiers"].items():
            print(
                f"  {name:10s} meanConcede={v['meanConcedeRate']:.3f} "
                f"zeroConcessionPositions={v['positionsWithZeroConcessions']:.3f} "
                f"onlyBestSurvives={v['positionsWhereOnlyBestSurvives']:.3f}"
                + (f" decided={v['decidedPositions']:.3f}" if "decidedPositions" in v else "")
            )
    print("\n=== cross-depth stability ===")
    for k, v in stability.items():
        print(f"  {k:24s} n={v['positions']:4d} moveAgreement={v['moveAgreement']:.3f} setMatch={v['setMatchRate']:.3f}")


main()
