#!/usr/bin/env python3
"""DISPOSABLE research harness — R9. Not production code.

Reads the explorer JSONL produced by probe-explorer.ts (and, optionally, the
Stockfish MultiPV JSONL produced by tools/r4-difficulty-harness/probe-sf.ts) and
answers R9's four measurements: depth of coverage, usability thresholds,
engine-vs-human discrimination, and the honest limits.
"""
import json
import math
import statistics
import sys
from collections import defaultdict

Z = 1.959963985  # two-sided 95%


def load(path):
    rows = []
    with open(path) as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def score(white, draws, black):
    total = white + draws + black
    return None if total == 0 else (white + draws / 2) / total


def score_se(white, draws, black):
    """Standard error of the score statistic (values in {0, 0.5, 1})."""
    n = white + draws + black
    if n == 0:
        return None
    mean = (white + draws / 2) / n
    second = (white * 1.0 + draws * 0.25) / n
    var = max(second - mean * mean, 0.0)
    return math.sqrt(var / n)


def min_n_for(delta, var=0.25):
    """Smallest n whose 95% CI half-width on the score is < delta."""
    return math.ceil(Z * Z * var / (delta * delta))


def pct(part, whole):
    return 0.0 if whole == 0 else round(100 * part / whole, 1)


def quant(values, q):
    if not values:
        return None
    ordered = sorted(values)
    idx = min(len(ordered) - 1, max(0, int(round(q * (len(ordered) - 1)))))
    return ordered[idx]


def main():
    explorer_path = sys.argv[1]
    sf_path = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != "-" else None
    out_path = sys.argv[3] if len(sys.argv) > 3 else None

    rows = [r for r in load(explorer_path) if r["status"] == 200]
    bands = sorted({r["band"] for r in rows})
    report = {}

    # ---------------------------------------------------------------- thresholds
    report["thresholds"] = {
        "statistic": "score S = (white + draws/2) / total, per position",
        "conservativeVariancePerGame": 0.25,
        "minN_for_10pp": min_n_for(0.10),
        "minN_for_5pp": min_n_for(0.05),
        "minN_for_3pp": min_n_for(0.03),
        "shippedFloor": 100,
        "shippedFloorSource": "apps/server/src/sourcing/explorer.ts:91 and apps/server/src/corpus.ts (total < 100 -> no_data_at_band)",
    }
    T = {"any": 1, "floor100": 100, "usable400": min_n_for(0.05), "strong1000": min_n_for(0.03)}
    report["thresholdValues"] = T

    # ------------------------------------------------------------ baseline score
    base = {}
    for r in rows:
        if r["ply"] == 0 and r["raw"]:
            base[r["band"]] = {
                "total": r["total"],
                "score": round(score(r["raw"]["white"], r["raw"]["draws"], r["raw"]["black"]), 4),
                "drawPct": round(100 * r["raw"]["draws"] / r["total"], 2),
            }
    report["startPositionBaseline"] = base

    # --------------------------------------------------- coverage depth by ply
    by_band_ply = defaultdict(lambda: defaultdict(list))
    for r in rows:
        by_band_ply[r["band"]][r["ply"]].append(r["total"])
    depth_table = {}
    for band in bands:
        rowsb = []
        for ply in sorted(by_band_ply[band]):
            totals = by_band_ply[band][ply]
            rowsb.append({
                "ply": ply,
                "n": len(totals),
                "medianTotal": int(statistics.median(totals)),
                "pctGE100": pct(sum(1 for t in totals if t >= T["floor100"]), len(totals)),
                "pctGE400": pct(sum(1 for t in totals if t >= T["usable400"]), len(totals)),
                "pctGE1000": pct(sum(1 for t in totals if t >= T["strong1000"]), len(totals)),
                "pctZero": pct(sum(1 for t in totals if t == 0), len(totals)),
            })
        depth_table[band] = rowsb
    report["coverageByPly"] = depth_table

    # -------------------------------------------- per-pack main-line falloff ply
    # Deepest ply on a pack's first-child main line whose total still clears T.
    falloff = {}
    for band in bands:
        per_pack = defaultdict(list)
        for r in rows:
            if r["band"] == band and r["mainLine"] and r["spineDepth"] >= 0:
                per_pack[r["packId"]].append(r)
        packs = {}
        for pack, entries in per_pack.items():
            entries.sort(key=lambda e: e["ply"])
            out = {"rootPly": entries[0]["ply"], "deepestPly": entries[-1]["ply"], "phase": entries[0]["phase"]}
            for name, threshold in T.items():
                last = None
                for e in entries:  # last ply before the first sustained drop below T
                    if e["total"] >= threshold:
                        last = e["ply"]
                    else:
                        break
                out[name] = last
            packs[pack] = out
        falloff[band] = packs
    report["mainLineFalloff"] = falloff

    summary = {}
    for band in bands:
        for name in T:
            vals = [v[name] for v in falloff[band].values() if v[name] is not None and v["phase"] != "endgame"]
            summary.setdefault(band, {})[name] = {
                "packsWithAnyCoverage": len(vals),
                "packsTotal": len(falloff[band]),
                "median": quant(vals, 0.5),
                "min": min(vals) if vals else None,
                "max": max(vals) if vals else None,
                "q25": quant(vals, 0.25),
                "q75": quant(vals, 0.75),
            }
    report["mainLineFalloffSummary"] = summary

    # --------------------------------------------------------- per-move coverage
    movecov = {}
    for band in bands:
        entries = [r for r in rows if r["band"] == band and r["raw"]]
        buckets = defaultdict(lambda: {"positions": 0, "ge100": 0, "ge400": 0, "movesGE100": 0, "movesGE400": 0, "legal": 0})
        for r in entries:
            b = buckets[min(r["ply"] // 4 * 4, 40)]
            b["positions"] += 1
            b["legal"] += r["legalCount"]
            counts = [m["white"] + m["draws"] + m["black"] for m in r["raw"]["moves"]]
            b["movesGE100"] += sum(1 for c in counts if c >= 100)
            b["movesGE400"] += sum(1 for c in counts if c >= T["usable400"])
            if any(c >= 100 for c in counts):
                b["ge100"] += 1
            if any(c >= T["usable400"] for c in counts):
                b["ge400"] += 1
        movecov[band] = {str(k): {**v, "meanMovesGE100": round(v["movesGE100"] / v["positions"], 2),
                                  "meanMovesGE400": round(v["movesGE400"] / v["positions"], 2),
                                  "meanLegal": round(v["legal"] / v["positions"], 1)}
                         for k, v in sorted(buckets.items())}
    report["movesCoverageByPlyBucket"] = movecov

    # ------------- the authored move's own sample, and the authored deviations' moves
    # A position-level count says nothing about the move the learner actually plays.
    # These two blocks measure the move-level oracle: the spine's own continuation, and
    # every authored deviation (the alternatives packs expect learners to choose).
    positions_doc = json.load(open(sys.argv[4])) if len(sys.argv) > 4 else {"deviations": []}
    origin = {}
    for band in bands:
        covered = {"positions": 0, "withMoveRow": 0, "moveGE100": 0, "moveGE400": 0}
        for r in rows:
            if r["band"] != band or not r["raw"] or r["nextUci"] is None:
                continue
            covered["positions"] += 1
            m = next((m for m in r["raw"]["moves"] if m["uci"] == r["nextUci"]), None)
            if m is None:
                continue
            n = m["white"] + m["draws"] + m["black"]
            covered["withMoveRow"] += 1
            covered["moveGE100"] += 1 if n >= T["floor100"] else 0
            covered["moveGE400"] += 1 if n >= T["usable400"] else 0
        by_fen = {r["fen"]: r for r in rows if r["band"] == band}
        dev = {"deviations": 0, "anchorQueried": 0, "anchorGE400": 0, "withMoveRow": 0, "moveGE100": 0, "moveGE400": 0}
        dev_by_class = defaultdict(lambda: {"n": 0, "moveGE400": 0})
        for d in positions_doc.get("deviations", []):
            dev["deviations"] += 1
            r = by_fen.get(d["anchorFen"])
            if r is None or not r["raw"]:
                continue
            dev["anchorQueried"] += 1
            dev["anchorGE400"] += 1 if r["total"] >= T["usable400"] else 0
            dev_by_class[d["class"]]["n"] += 1
            m = next((m for m in r["raw"]["moves"] if m["uci"] == d["moveUci"]), None)
            if m is None:
                continue
            n = m["white"] + m["draws"] + m["black"]
            dev["withMoveRow"] += 1
            dev["moveGE100"] += 1 if n >= T["floor100"] else 0
            dev["moveGE400"] += 1 if n >= T["usable400"] else 0
            dev_by_class[d["class"]]["moveGE400"] += 1 if n >= T["usable400"] else 0
        origin[band] = {"authoredSpineMove": covered, "authoredDeviations": dev,
                        "deviationsByClass": dict(dev_by_class)}
    report["moveLevelCoverage"] = origin

    # -------------------------------------------------------- transposition flow
    # nextFen comes from the extractor; join parent -> child at the same band and
    # compare the child's own total against the parent's count for that same move.
    positions_path = sys.argv[4] if len(sys.argv) > 4 else None
    if positions_path:
        next_fen = {p["fen"]: p.get("nextFen") for p in json.load(open(positions_path))["positions"]}
        by_fen_band = {(r["fen"], r["band"]): r for r in rows}
        flow = []
        for r in rows:
            if not r["raw"] or r["nextUci"] is None:
                continue
            child_fen = next_fen.get(r["fen"])
            child = by_fen_band.get((child_fen, r["band"])) if child_fen else None
            move = next((m for m in r["raw"]["moves"] if m["uci"] == r["nextUci"]), None)
            if child is None or move is None or not child["raw"]:
                continue
            through = move["white"] + move["draws"] + move["black"]
            flow.append({"fen": r["fen"], "band": r["band"], "ply": r["ply"], "uci": r["nextUci"],
                         "throughThisParent": through, "childTotal": child["total"],
                         "inflow": child["total"] - through,
                         "inflowShare": None if child["total"] == 0 else (child["total"] - through) / child["total"]})
        if flow:
            shares = [f["inflowShare"] for f in flow if f["childTotal"] >= T["floor100"]]
            report["transpositionInflow"] = {
                "edges": len(flow),
                "edgesAtOrAboveFloor": len(shares),
                "medianInflowSharePct": round(100 * statistics.median(shares), 2) if shares else None,
                "meanInflowSharePct": round(100 * statistics.fmean(shares), 2) if shares else None,
                "p90InflowSharePct": round(100 * quant(shares, 0.9), 2) if shares else None,
                "maxInflowSharePct": round(100 * max(shares), 2) if shares else None,
                "edgesWithNegativeInflow": sum(1 for s in shares if s < 0),
                "top": sorted([f for f in flow if f["childTotal"] >= T["floor100"]], key=lambda f: -f["inflowShare"])[:8],
            }

    # --------------------------------- per-move engine/human comparison at one depth
    # Joins the explorer's per-move counts to the depth-12 MultiPV entries for the same
    # position and asks whether pairs of moves the engine cannot separate are separated
    # by the human result. Both readings are instrument outputs; neither is adjudicated.
    if sf_path:
        sf_moves = {}
        for probe in load(sf_path):
            if probe.get("entries") and probe["depth"] == 12:
                sf_moves[probe["fen"]] = {e["uci"]: e for e in probe["entries"]}
        pairs_report = {}
        for band in bands:
            pairs, per_position = [], []
            for r in rows:
                if r["band"] != band or not r["raw"] or r["total"] < T["usable400"]:
                    continue
                entries = sf_moves.get(r["fen"])
                if entries is None:
                    continue
                white_to_move = r["queryFen"].split(" ")[1] == "w"
                usable = []
                for m in r["raw"]["moves"]:
                    n = m["white"] + m["draws"] + m["black"]
                    engine = entries.get(m["uci"])
                    if n < T["usable400"] or engine is None or engine["cp"] is None:
                        continue
                    s = score(m["white"], m["draws"], m["black"])
                    usable.append({"uci": m["uci"], "san": m["san"], "n": n, "cp": engine["cp"],
                                   "moverScore": s if white_to_move else 1 - s,
                                   "se": score_se(m["white"], m["draws"], m["black"])})
                if len(usable) < 2:
                    continue
                per_position.append({"fen": r["fen"], "ply": r["ply"], "moves": len(usable)})
                for i in range(len(usable)):
                    for j in range(i + 1, len(usable)):
                        a, b = usable[i], usable[j]
                        gap = a["moverScore"] - b["moverScore"]
                        se = math.sqrt(a["se"] ** 2 + b["se"] ** 2)
                        pairs.append({"fen": r["fen"], "ply": r["ply"], "packId": r["packId"],
                                      "a": a["san"], "b": b["san"], "cpGap": abs(a["cp"] - b["cp"]),
                                      "scoreGapPP": 100 * gap, "significant": abs(gap) > Z * se,
                                      "nA": a["n"], "nB": b["n"]})
            tied = [p for p in pairs if p["cpGap"] < 30]
            sep = [p for p in tied if p["significant"] and abs(p["scoreGapPP"]) >= 5]
            pairs_report[band] = {
                "positions": len(per_position),
                "movePairs": len(pairs),
                "engineTiedPairs_cpGap_lt_30": len(tied),
                "ofThoseHumanSeparated_ge5pp_and_significant": len(sep),
                "separatedPct": pct(len(sep), len(tied)),
                "medianScoreGapPP_amongTied": round(statistics.median([abs(p["scoreGapPP"]) for p in tied]), 2) if tied else None,
                "p90ScoreGapPP_amongTied": round(quant([abs(p["scoreGapPP"]) for p in tied], 0.9), 2) if tied else None,
                "maxScoreGapPP_amongTied": round(max([abs(p["scoreGapPP"]) for p in tied]), 2) if tied else None,
                "top": sorted(tied, key=lambda p: -abs(p["scoreGapPP"]))[:12],
            }
        report["engineTiedHumanSeparated"] = pairs_report

    # ------------------------------------------- per-move discrimination (mover POV)
    # For every position with data, look at the moves that individually clear the
    # usable threshold and measure the spread of their outcome scores.
    permove = {}
    for band in bands:
        entries = []
        for r in rows:
            if r["band"] != band or not r["raw"] or r["total"] < T["usable400"]:
                continue
            white_to_move = r["queryFen"].split(" ")[1] == "w"
            moves = []
            for m in r["raw"]["moves"]:
                n = m["white"] + m["draws"] + m["black"]
                if n < T["usable400"]:
                    continue
                s = score(m["white"], m["draws"], m["black"])
                moves.append({"san": m["san"], "n": n,
                              "moverScore": s if white_to_move else 1 - s,
                              "se": score_se(m["white"], m["draws"], m["black"])})
            if len(moves) < 2:
                entries.append({"fen": r["fen"], "ply": r["ply"], "usableMoves": len(moves), "spreadPP": None})
                continue
            best = max(moves, key=lambda m: m["moverScore"])
            worst = min(moves, key=lambda m: m["moverScore"])
            gap = best["moverScore"] - worst["moverScore"]
            se = math.sqrt(best["se"] ** 2 + worst["se"] ** 2)
            entries.append({
                "fen": r["fen"], "packId": r["packId"], "ply": r["ply"], "total": r["total"],
                "legalCount": r["legalCount"], "usableMoves": len(moves), "spreadPP": round(100 * gap, 2),
                "significant": gap > Z * se, "gapCiPP": round(100 * Z * se, 2),
                "best": best["san"], "worst": worst["san"],
                "bestScore": round(best["moverScore"], 4), "worstScore": round(worst["moverScore"], 4),
            })
        with_spread = [e for e in entries if e["spreadPP"] is not None]
        permove[band] = {
            "positionsAtOrAboveUsable": len(entries),
            "positionsWith2PlusUsableMoves": len(with_spread),
            "meanUsableMoves": round(statistics.fmean([e["usableMoves"] for e in entries]), 2) if entries else None,
            "medianSpreadPP": round(statistics.median([e["spreadPP"] for e in with_spread]), 2) if with_spread else None,
            "p90SpreadPP": round(quant([e["spreadPP"] for e in with_spread], 0.9), 2) if with_spread else None,
            "maxSpreadPP": round(max([e["spreadPP"] for e in with_spread]), 2) if with_spread else None,
            "significantSpread": sum(1 for e in with_spread if e["significant"]),
            "significantSpreadPct": pct(sum(1 for e in with_spread if e["significant"]), len(with_spread)),
            "spreadGE10pp": sum(1 for e in with_spread if e["spreadPP"] >= 10),
            "top": sorted(with_spread, key=lambda e: -e["spreadPP"])[:12],
        }
    report["perMoveDiscrimination"] = permove

    # --------------------------------------------- band agreement on the score
    per_fen = defaultdict(dict)
    for r in rows:
        if r["raw"]:
            per_fen[r["fen"]][r["band"]] = r
    cross = []
    for fen, per_band in per_fen.items():
        if not all(b in per_band and per_band[b]["total"] >= T["usable400"] for b in bands):
            continue
        entry = {"fen": fen, "ply": per_band[bands[0]]["ply"], "packId": per_band[bands[0]]["packId"]}
        for b in bands:
            raw = per_band[b]["raw"]
            entry[f"s{b}"] = score(raw["white"], raw["draws"], raw["black"])
            entry[f"n{b}"] = per_band[b]["total"]
        cross.append(entry)
    if len(cross) >= 3:
        def corr(xs, ys):
            mx, my = statistics.fmean(xs), statistics.fmean(ys)
            num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
            den = math.sqrt(sum((x - mx) ** 2 for x in xs) * sum((y - my) ** 2 for y in ys))
            return None if den == 0 else num / den
        pairs = [(bands[i], bands[j]) for i in range(len(bands)) for j in range(i + 1, len(bands))]
        report["bandAgreement"] = {
            "positions": len(cross),
            "pairs": {f"{a}-{b}": {
                "pearson": round(corr([c[f"s{a}"] for c in cross], [c[f"s{b}"] for c in cross]), 4),
                "meanAbsDeltaPP": round(100 * statistics.fmean([abs(c[f"s{a}"] - c[f"s{b}"]) for c in cross]), 2),
                "p90AbsDeltaPP": round(100 * quant([abs(c[f"s{a}"] - c[f"s{b}"]) for c in cross], 0.9), 2),
                "maxAbsDeltaPP": round(100 * max(abs(c[f"s{a}"] - c[f"s{b}"]) for c in cross), 2),
                "sideFlips": sum(1 for c in cross if (c[f"s{a}"] - 0.5) * (c[f"s{b}"] - 0.5) < 0),
            } for a, b in pairs},
        }
        report["crossBandPositions"] = cross

    # ---------------------------------------------------- temporal hidden variance
    temporal = []
    for r in rows:
        if not r["raw"] or r["total"] < T["strong1000"]:
            continue
        hist = [h for h in r["raw"]["history"] if h["white"] + h["draws"] + h["black"] > 0]
        if len(hist) < 8:
            continue
        half = len(hist) // 2
        a, b = hist[:half], hist[half:]
        sa = score(sum(h["white"] for h in a), sum(h["draws"] for h in a), sum(h["black"] for h in a))
        sb = score(sum(h["white"] for h in b), sum(h["draws"] for h in b), sum(h["black"] for h in b))
        if sa is None or sb is None:
            continue
        temporal.append({"fen": r["fen"], "band": r["band"], "total": r["total"], "early": sa, "late": sb, "delta": sb - sa})
    if temporal:
        deltas = [abs(t["delta"]) for t in temporal]
        report["temporalSplit"] = {
            "positions": len(temporal),
            "meanAbsDeltaPP": round(100 * statistics.fmean(deltas), 2),
            "medianAbsDeltaPP": round(100 * statistics.median(deltas), 2),
            "p90AbsDeltaPP": round(100 * quant(deltas, 0.9), 2),
            "maxAbsDeltaPP": round(100 * max(deltas), 2),
        }

    # ------------------------------------------------------------- discrimination
    if sf_path:
        sf = {}
        for probe in load(sf_path):
            if probe.get("entries"):
                best = probe["entries"][0]
                cp = best["cp"] if best["cp"] is not None else (10000 if best["mate"] and best["mate"] > 0 else -10000)
                sf[(probe["fen"], probe["depth"])] = cp
        depths = sorted({d for (_, d) in sf})
        disc = {}
        for band in bands:
            for depth in depths:
                pool = []
                for r in rows:
                    if r["band"] != band or not r["raw"]:
                        continue
                    cp = sf.get((r["fen"], depth))
                    if cp is None or r["total"] < T["usable400"]:
                        continue
                    # Stockfish reports from the side to move; the human score is
                    # white-relative, so orient the engine reading to white too.
                    cp_white = cp if r["queryFen"].split(" ")[1] == "w" else -cp
                    s = score(r["raw"]["white"], r["raw"]["draws"], r["raw"]["black"])
                    se = score_se(r["raw"]["white"], r["raw"]["draws"], r["raw"]["black"])
                    pool.append({"fen": r["fen"], "packId": r["packId"], "ply": r["ply"], "cp": cp, "cpWhite": cp_white,
                                 "total": r["total"], "score": s, "se": se, "phase": r["phase"]})
                if not pool:
                    continue
                baseline = base.get(band, {}).get("score")
                level = [p for p in pool if abs(p["cp"]) < 50]
                decided = [p for p in pool if abs(p["cp"]) >= 100]
                def pearson(xs, ys):
                    if len(xs) < 3:
                        return None
                    mx, my = statistics.fmean(xs), statistics.fmean(ys)
                    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
                    den = math.sqrt(sum((x - mx) ** 2 for x in xs) * sum((y - my) ** 2 for y in ys))
                    return None if den == 0 else round(num / den, 4)

                def block(group):
                    if not group:
                        return None
                    scores = [p["score"] for p in group]
                    devs = [abs(p["score"] - baseline) for p in group] if baseline else None
                    sig = [p for p in group if baseline and abs(p["score"] - baseline) > Z * p["se"]]
                    big = [p for p in group if baseline and abs(p["score"] - baseline) >= 0.10]
                    mid = [p for p in group if baseline and abs(p["score"] - baseline) >= 0.05 and abs(p["score"] - baseline) > Z * p["se"]]
                    return {
                        "positions": len(group),
                        "medianTotal": int(statistics.median([p["total"] for p in group])),
                        "meanScore": round(statistics.fmean(scores), 4),
                        "sdScore": round(statistics.pstdev(scores), 4) if len(scores) > 1 else 0.0,
                        "minScore": round(min(scores), 4),
                        "maxScore": round(max(scores), 4),
                        "spreadPP": round(100 * (max(scores) - min(scores)), 1),
                        "meanAbsDevFromBaselinePP": round(100 * statistics.fmean(devs), 2) if devs else None,
                        "p90AbsDevFromBaselinePP": round(100 * quant(devs, 0.9), 2) if devs else None,
                        "significantlyOffBaseline": len(sig),
                        "significantlyOffBaselinePct": pct(len(sig), len(group)),
                        "atLeast5ppOffBaselineAndSignificant": len(mid),
                        "atLeast5ppOffBaselineAndSignificantPct": pct(len(mid), len(group)),
                        "atLeast10ppOffBaseline": len(big),
                        "atLeast10ppOffBaselinePct": pct(len(big), len(group)),
                        "pearson_cpWhite_vs_score": pearson([p["cpWhite"] for p in group], [p["score"] for p in group]),
                        "pearson_ply_vs_absDev": pearson([p["ply"] for p in group], [abs(p["score"] - (baseline or 0.5)) for p in group]),
                        "examples": sorted(
                            [{"fen": p["fen"], "packId": p["packId"], "ply": p["ply"], "cp": p["cp"],
                              "total": p["total"], "score": round(p["score"], 4),
                              "ciPP": round(100 * Z * p["se"], 2)} for p in group],
                            key=lambda e: -abs(e["score"] - (baseline or 0.5)))[:12],
                    }
                disc[f"band{band}_depth{depth}"] = {
                    "baselineScore": baseline,
                    "allWithData": block(pool),
                    "engineLevel_abs_lt_50cp": block(level),
                    "engineDecided_abs_ge_100cp": block(decided),
                }
        report["discrimination"] = disc

    text = json.dumps(report, indent=1)
    if out_path:
        with open(out_path, "w") as handle:
            handle.write(text + "\n")
    print(text)


main()
