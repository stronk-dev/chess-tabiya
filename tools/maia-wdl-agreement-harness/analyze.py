#!/usr/bin/env python3
"""DISPOSABLE research harness — does Maia's per-move WDL agree with human outcomes?
Not production code. Nothing imports it.

Pure: given the same JSONL inputs it rewrites the committed summary byte for byte.

Inputs
  probe-set.json   R9's committed explorer readings joined to move history
  san-map.json     SAN -> UCI per FEN, via chessops
  arm JSONL(s)     Maia MultiPV-20 probes (history / bare / eloonly arms)
  sf.jsonl         Stockfish depth-12 full-MultiPV probes (r4 harness, unmodified)

Conventions inherited, not chosen (R9 §4, §6.3):
  usable move row      n >= 385   (the minimum n resolving 5 pp at 95%)
  human-decided pair   |dScore| >= 5 pp AND significant at 95%
  per-game variance    0.25, the conservative bound R9 used
"""
import json
import math
import statistics
import sys
from collections import defaultdict

Z = 1.959963984540054
VAR_PER_GAME = 0.25          # R9 §4's conservative bound, inherited
USABLE_N = 385               # R9 §4's derived minimum n for 5 pp
DECIDED_PP = 5.0             # R9 §6.3's separation floor
TIED_CP = 30                 # R9 §6.3's engine-tie band


def load_jsonl(path):
    with open(path) as handle:
        return [json.loads(line) for line in handle if line.strip()]


def side_to_move(fen):
    return fen.split(" ")[1]


def mover_score(row, stm):
    """Explorer W/D/B -> expected score for the side to move at the parent."""
    n = row["n"]
    wins = row["white"] if stm == "w" else row["black"]
    return (wins + row["draws"] / 2) / n


def se(n):
    return math.sqrt(VAR_PER_GAME / n)


def sign(value):
    return 0 if value == 0 else (1 if value > 0 else -1)


def wilson(successes, trials):
    if trials == 0:
        return (float("nan"), float("nan"))
    p = successes / trials
    denom = 1 + Z * Z / trials
    centre = (p + Z * Z / (2 * trials)) / denom
    half = Z * math.sqrt(p * (1 - p) / trials + Z * Z / (4 * trials * trials)) / denom
    return (centre - half, centre + half)


def binom_p_two_sided(successes, trials, p0=0.5):
    """Exact two-sided binomial p-value against p0 = 0.5 (symmetric case)."""
    if trials == 0:
        return float("nan")
    k = max(successes, trials - successes)
    log_p0 = math.log(p0)
    tail = 0.0
    for i in range(k, trials + 1):
        tail += math.exp(math.lgamma(trials + 1) - math.lgamma(i + 1)
                         - math.lgamma(trials - i + 1) + trials * log_p0)
    return min(1.0, 2 * tail)


def spearman(xs, ys):
    def ranks(values):
        order = sorted(range(len(values)), key=lambda i: values[i])
        out = [0.0] * len(values)
        i = 0
        while i < len(order):
            j = i
            while j + 1 < len(order) and values[order[j + 1]] == values[order[i]]:
                j += 1
            mean_rank = (i + j) / 2 + 1
            for k in range(i, j + 1):
                out[order[k]] = mean_rank
            i = j + 1
        return out

    if len(xs) < 3:
        return float("nan")
    return pearson(ranks(xs), ranks(ys))


def pearson(xs, ys):
    n = len(xs)
    if n < 3:
        return float("nan")
    mx, my = sum(xs) / n, sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    syy = sum((y - my) ** 2 for y in ys)
    if sxx == 0 or syy == 0:
        return float("nan")
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / math.sqrt(sxx * syy)


def main():
    probe_set = {p["fen"]: p for p in json.load(open(sys.argv[1]))["positions"]}
    san_map = json.load(open(sys.argv[2]))
    arms = {}
    for spec in sys.argv[3:-2]:
        name, path = spec.split("=", 1)
        arms[name] = load_jsonl(path)
    sf_rows = load_jsonl(sys.argv[-2])
    out_path = sys.argv[-1]

    summary = {}

    # ---------------------------------------------------------------- encoding
    enc = {"rows": 0, "sums": defaultdict(int), "cpEqualsWinMinusLoss": 0,
           "cpMismatch": [], "byArm": {}}
    for name, rows in arms.items():
        arm_rows = 0
        arm_sums = defaultdict(int)
        arm_cp_ok = 0
        for row in rows:
            for cand in row["candidates"]:
                w, d, loss = cand["wdl"]
                arm_rows += 1
                arm_sums[w + d + loss] += 1
                if cand["cp"] == w - loss:
                    arm_cp_ok += 1
                elif len(enc["cpMismatch"]) < 5:
                    enc["cpMismatch"].append({"fen": row["fen"], "uci": cand["uci"],
                                              "cp": cand["cp"], "wdl": cand["wdl"]})
        enc["byArm"][name] = {"candidateRows": arm_rows,
                              "sums": {str(k): v for k, v in sorted(arm_sums.items())},
                              "cpEqualsWinMinusLoss": arm_cp_ok}
        enc["rows"] += arm_rows
        enc["cpEqualsWinMinusLoss"] += arm_cp_ok
        for k, v in arm_sums.items():
            enc["sums"][k] += v
    enc["sums"] = {str(k): v for k, v in sorted(enc["sums"].items())}
    summary["encoding"] = enc

    # --------------------------------------------------------- stockfish index
    sf_cp = {}
    for row in sf_rows:
        if row.get("error") or not row["entries"]:
            continue
        table = {}
        for entry in row["entries"]:
            if entry["cp"] is not None:
                table[entry["uci"]] = entry["cp"]
            elif entry["mate"] is not None:
                table[entry["uci"]] = 10_000 if entry["mate"] > 0 else -10_000
        sf_cp[row["fen"]] = table
    summary["stockfish"] = {"positions": len(sf_cp),
                            "depth": sorted({r["depth"] for r in sf_rows}),
                            "medianReachedDepth": statistics.median(
                                [r["reachedDepth"] for r in sf_rows]) if sf_rows else None}

    # ------------------------------------------------------------ the join
    # per arm/band: fen -> {uci: {policy, cp, maiaScore, maiaDraw}}
    maia = defaultdict(dict)
    for name, rows in arms.items():
        for row in rows:
            table = {}
            for cand in row["candidates"]:
                w, d, loss = cand["wdl"]
                table[cand["uci"]] = {
                    "policy": cand["policy"], "cp": cand["cp"],
                    "score": (w + d / 2) / 1000.0, "draw": d / 1000.0,
                    "rank": cand["rank"],
                }
            maia[(name, row["elo"])][row["fen"]] = table

    # human per-move rows, mover-framed
    human = defaultdict(dict)
    for fen, entry in probe_set.items():
        stm = side_to_move(fen)
        for band, data in entry["bands"].items():
            table = {}
            for row in data["moves"]:
                uci = san_map[fen][row["san"]]
                table[uci] = {"n": row["n"], "score": mover_score(row, stm),
                              "draw": row["draws"] / row["n"], "san": row["san"]}
            human[int(band)][fen] = table

    # ---------------------------------------------------- population and pairs
    def build_pairs(band):
        """Every within-position pair of usable human move rows, at one band."""
        pairs = []
        for fen, table in human[band].items():
            usable = [(uci, row) for uci, row in table.items() if row["n"] >= USABLE_N]
            usable.sort(key=lambda item: -item[1]["n"])
            for i in range(len(usable)):
                for j in range(i + 1, len(usable)):
                    (ua, ra), (ub, rb) = usable[i], usable[j]
                    delta = (ra["score"] - rb["score"]) * 100
                    sed = math.sqrt(VAR_PER_GAME / ra["n"] + VAR_PER_GAME / rb["n"]) * 100
                    pairs.append({
                        "fen": fen, "ply": probe_set[fen]["ply"],
                        "phase": probe_set[fen]["phase"], "packId": probe_set[fen]["packId"],
                        "a": ua, "b": ub, "sanA": ra["san"], "sanB": rb["san"],
                        "nA": ra["n"], "nB": rb["n"],
                        "deltaPP": delta, "sePP": sed,
                        "significant": abs(delta) > Z * sed,
                        "decided": abs(delta) >= DECIDED_PP and abs(delta) > Z * sed,
                    })
        return pairs

    bands = sorted(human.keys())
    all_pairs = {band: build_pairs(band) for band in bands}

    pop = {}
    for band in bands:
        pairs = all_pairs[band]
        positions = {p["fen"] for p in pairs}
        decided = [p for p in pairs if p["decided"]]
        pop[str(band)] = {
            "positionsQueried": len(human[band]),
            "positionsWith2UsableMoves": len(positions),
            "pairs": len(pairs),
            "decidedPairs": len(decided),
            "decidedPositions": len({p["fen"] for p in decided}),
            "plyRangeDecided": [min((p["ply"] for p in decided), default=None),
                                max((p["ply"] for p in decided), default=None)],
            "medianPlyDecided": statistics.median([p["ply"] for p in decided]) if decided else None,
        }
    summary["population"] = pop

    # -------------------------------------------------- the agreement measures
    def agreement(pairs, arm, band, key, subset=None):
        """Sign agreement of an instrument with the human ordering, on decided pairs."""
        table = maia[(arm, band)]
        hits = miss = tie = absent = 0
        for pair in pairs:
            if subset is not None and not subset(pair):
                continue
            row = table.get(pair["fen"], {})
            a, b = row.get(pair["a"]), row.get(pair["b"])
            if a is None or b is None:
                absent += 1
                continue
            delta = a[key] - b[key]
            if delta == 0:
                tie += 1
                continue
            if sign(delta) == sign(pair["deltaPP"]):
                hits += 1
            else:
                miss += 1
        trials = hits + miss
        low, high = wilson(hits, trials)
        return {"agree": hits, "disagree": miss, "instrumentTie": tie,
                "notListed": absent, "trials": trials,
                "rate": hits / trials if trials else float("nan"),
                "ci95": [low, high],
                "pVsChance": binom_p_two_sided(hits, trials)}

    def popularity_agreement(pairs, band, subset=None):
        hits = miss = 0
        for pair in pairs:
            if subset is not None and not subset(pair):
                continue
            delta = pair["nA"] - pair["nB"]
            if delta == 0:
                continue
            if sign(delta) == sign(pair["deltaPP"]):
                hits += 1
            else:
                miss += 1
        trials = hits + miss
        low, high = wilson(hits, trials)
        return {"agree": hits, "disagree": miss, "trials": trials,
                "rate": hits / trials if trials else float("nan"), "ci95": [low, high],
                "pVsChance": binom_p_two_sided(hits, trials)}

    def sf_agreement(pairs, subset=None):
        hits = miss = tie = absent = 0
        for pair in pairs:
            if subset is not None and not subset(pair):
                continue
            table = sf_cp.get(pair["fen"])
            if table is None or pair["a"] not in table or pair["b"] not in table:
                absent += 1
                continue
            delta = table[pair["a"]] - table[pair["b"]]
            if delta == 0:
                tie += 1
                continue
            if sign(delta) == sign(pair["deltaPP"]):
                hits += 1
            else:
                miss += 1
        trials = hits + miss
        low, high = wilson(hits, trials)
        return {"agree": hits, "disagree": miss, "instrumentTie": tie, "notListed": absent,
                "trials": trials, "rate": hits / trials if trials else float("nan"),
                "ci95": [low, high], "pVsChance": binom_p_two_sided(hits, trials)}

    def cross_band_agreement(pairs, other_band, subset=None):
        """The measured CEILING: the ground truth's own reproducibility across bands."""
        hits = miss = absent = 0
        for pair in pairs:
            if subset is not None and not subset(pair):
                continue
            table = human[other_band].get(pair["fen"], {})
            a, b = table.get(pair["a"]), table.get(pair["b"])
            if a is None or b is None:
                absent += 1
                continue
            delta = a["score"] - b["score"]
            if sign(delta) == sign(pair["deltaPP"]):
                hits += 1
            else:
                miss += 1
        trials = hits + miss
        low, high = wilson(hits, trials)
        return {"agree": hits, "disagree": miss, "notListed": absent, "trials": trials,
                "rate": hits / trials if trials else float("nan"), "ci95": [low, high]}

    primary_arm = "history"
    verdict = {}
    for band in bands:
        decided = [p for p in all_pairs[band] if p["decided"]]
        row = {
            "maiaWdl": agreement(decided, primary_arm, band, "score"),
            "maiaPolicy": agreement(decided, primary_arm, band, "policy"),
            "explorerPopularity": popularity_agreement(decided, band),
            "stockfishDepth12": sf_agreement(decided),
            "ceiling_humanOtherBands": {
                str(other): cross_band_agreement(decided, other)
                for other in bands if other != band
            },
        }
        verdict[str(band)] = row
    summary["verdict"] = verdict

    # pooled over all three bands (each pair counted once per band it is decided at)
    pooled = {"maiaWdl": {"agree": 0, "disagree": 0, "trials": 0},
              "maiaPolicy": {"agree": 0, "disagree": 0, "trials": 0},
              "explorerPopularity": {"agree": 0, "disagree": 0, "trials": 0},
              "stockfishDepth12": {"agree": 0, "disagree": 0, "trials": 0}}
    for band in bands:
        for key in pooled:
            src = verdict[str(band)][key]
            for field in ("agree", "disagree", "trials"):
                pooled[key][field] += src[field]
    for key, value in pooled.items():
        value["rate"] = value["agree"] / value["trials"] if value["trials"] else float("nan")
        value["ci95"] = list(wilson(value["agree"], value["trials"]))
        value["pVsChance"] = binom_p_two_sided(value["agree"], value["trials"])
    summary["verdictPooled"] = pooled

    # ---- sensitivity: does the popularity baseline win only because n selects pairs?
    # A pair is easier to call "decided" when both n are large, and the larger-n move
    # is the one popularity picks. Restricting to comparable-popularity pairs removes
    # that path without changing anything else.
    balanced = {}
    for band in bands:
        def comparable(pair):
            ratio = pair["nA"] / pair["nB"]
            return 0.5 <= ratio <= 2.0
        decided = [p for p in all_pairs[band] if p["decided"]]
        balanced[str(band)] = {
            "pairs": sum(1 for p in decided if comparable(p)),
            "maiaWdl": agreement(decided, primary_arm, band, "score", subset=comparable),
            "maiaPolicy": agreement(decided, primary_arm, band, "policy", subset=comparable),
            "explorerPopularity": popularity_agreement(decided, band, subset=comparable),
            "stockfishDepth12": sf_agreement(decided, subset=comparable),
        }
    pooled_balanced = {"maiaWdl": [0, 0], "maiaPolicy": [0, 0],
                       "explorerPopularity": [0, 0], "stockfishDepth12": [0, 0]}
    for band in bands:
        for key in pooled_balanced:
            pooled_balanced[key][0] += balanced[str(band)][key]["agree"]
            pooled_balanced[key][1] += balanced[str(band)][key]["disagree"]
    balanced["pooled"] = {
        key: {"agree": v[0], "disagree": v[1], "trials": v[0] + v[1],
              "rate": v[0] / (v[0] + v[1]) if v[0] + v[1] else None,
              "ci95": list(wilson(v[0], v[0] + v[1])),
              "pVsChance": binom_p_two_sided(v[0], v[0] + v[1])}
        for key, v in pooled_balanced.items()
    }
    summary["comparablePopularityPairs"] = balanced

    # ------------------------------------- the R9 headline restricted: engine-tied
    tied = {}
    for band in bands:
        def is_tied(pair):
            table = sf_cp.get(pair["fen"])
            if table is None or pair["a"] not in table or pair["b"] not in table:
                return False
            return abs(table[pair["a"]] - table[pair["b"]]) < TIED_CP
        decided = [p for p in all_pairs[band] if p["decided"]]
        tied[str(band)] = {
            "decidedAndEngineTied": sum(1 for p in decided if is_tied(p)),
            "maiaWdl": agreement(decided, primary_arm, band, "score", subset=is_tied),
            "maiaPolicy": agreement(decided, primary_arm, band, "policy", subset=is_tied),
            "explorerPopularity": popularity_agreement(decided, band, subset=is_tied),
            "ceiling_humanOtherBands": {
                str(other): cross_band_agreement(decided, other, subset=is_tied)
                for other in bands if other != band
            },
        }
    pooled_tied = {"maiaWdl": [0, 0], "maiaPolicy": [0, 0], "explorerPopularity": [0, 0]}
    for band in bands:
        for key in pooled_tied:
            pooled_tied[key][0] += tied[str(band)][key]["agree"]
            pooled_tied[key][1] += tied[str(band)][key]["disagree"]
    tied["pooled"] = {
        key: {"agree": v[0], "disagree": v[1], "trials": v[0] + v[1],
              "rate": v[0] / (v[0] + v[1]) if v[0] + v[1] else None,
              "ci95": list(wilson(v[0], v[0] + v[1])),
              "pVsChance": binom_p_two_sided(v[0], v[0] + v[1])}
        for key, v in pooled_tied.items()
    }
    summary["engineTiedPairs"] = tied

    # ------------------------------------------- agreement by |maia cp| decile
    band = 1600
    decided = [p for p in all_pairs[band] if p["decided"]]
    table = maia[(primary_arm, band)]
    graded = []
    for pair in decided:
        row = table.get(pair["fen"], {})
        a, b = row.get(pair["a"]), row.get(pair["b"])
        if a is None or b is None:
            continue
        graded.append((abs(a["cp"] - b["cp"]), sign(a["score"] - b["score"]) == sign(pair["deltaPP"]),
                       abs(pair["deltaPP"])))
    graded.sort(key=lambda item: item[0])
    deciles = []
    if graded:
        size = max(1, len(graded) // 10)
        for start in range(0, len(graded), size):
            chunk = graded[start:start + size]
            if len(chunk) < size // 2:
                break
            deciles.append({
                "maiaCpGapRange": [chunk[0][0], chunk[-1][0]],
                "pairs": len(chunk),
                "agreement": sum(1 for item in chunk if item[1]) / len(chunk),
                "medianHumanGapPP": statistics.median([item[2] for item in chunk]),
            })
    summary["agreementByMaiaConfidence_band1600"] = deciles

    # Derived threshold: the smallest |Maia cp gap| at which the WDL ordering beats,
    # on the IDENTICAL pairs, (a) chance and (b) the free incumbent (explorer play
    # counts). Nothing is chosen — the crossing points are read off the curve, and a
    # gap threshold is off the instrument's own optimality boundary by construction
    # (gates.md, engine-condition rule clause 2).
    thresholds = []
    pooled_rows = []
    for band in bands:
        table = maia[(primary_arm, band)]
        for pair in [p for p in all_pairs[band] if p["decided"]]:
            row = table.get(pair["fen"], {})
            a, b = row.get(pair["a"]), row.get(pair["b"])
            if a is None or b is None:
                continue
            pooled_rows.append({
                "gap": abs(a["cp"] - b["cp"]),
                "wdlOk": sign(a["score"] - b["score"]) == sign(pair["deltaPP"]),
                "popOk": sign(pair["nA"] - pair["nB"]) == sign(pair["deltaPP"]),
                "policyOk": sign(a["policy"] - b["policy"]) == sign(pair["deltaPP"]),
            })
    for t in sorted({r["gap"] for r in pooled_rows}):
        subset = [r for r in pooled_rows if r["gap"] >= t]
        if len(subset) < 100:
            break
        wdl_ok = sum(1 for r in subset if r["wdlOk"])
        pop_ok = sum(1 for r in subset if r["popOk"])
        pol_ok = sum(1 for r in subset if r["policyOk"])
        thresholds.append({
            "minMaiaCpGap": t, "pairs": len(subset),
            "wdlRate": wdl_ok / len(subset), "wdlCi95": list(wilson(wdl_ok, len(subset))),
            "popularityRate": pop_ok / len(subset),
            "popularityCi95": list(wilson(pop_ok, len(subset))),
            "policyRate": pol_ok / len(subset),
            "coverageOfDecidedPairs": len(subset) / len(pooled_rows),
        })
    beats_chance = next((row for row in thresholds if row["wdlCi95"][0] > 0.5), None)
    beats_popularity = next(
        (row for row in thresholds if row["wdlCi95"][0] > row["popularityCi95"][1]), None)
    summary["derivedThreshold"] = {
        "pooledDecidedPairs": len(pooled_rows),
        "curve": thresholds[::5],
        "smallestGapBeatingChance": beats_chance,
        "smallestGapBeatingExplorerPopularity": beats_popularity,
    }

    # ----------------------------------------------------- agreement by ply
    by_ply = {}
    for band in bands:
        decided = [p for p in all_pairs[band] if p["decided"]]
        buckets = defaultdict(lambda: [0, 0])
        table = maia[(primary_arm, band)]
        for pair in decided:
            row = table.get(pair["fen"], {})
            a, b = row.get(pair["a"]), row.get(pair["b"])
            if a is None or b is None:
                continue
            bucket = f"{pair['ply'] // 4 * 4}-{pair['ply'] // 4 * 4 + 3}"
            ok = sign(a["score"] - b["score"]) == sign(pair["deltaPP"])
            buckets[bucket][0 if ok else 1] += 1
        by_ply[str(band)] = {
            key: {"agree": value[0], "disagree": value[1],
                  "rate": value[0] / (value[0] + value[1]) if value[0] + value[1] else None,
                  "ci95": list(wilson(value[0], value[0] + value[1]))}
            for key, value in sorted(buckets.items(), key=lambda kv: int(kv[0].split("-")[0]))
        }
    pooled_ply = defaultdict(lambda: [0, 0])
    for band in bands:
        for key, value in by_ply[str(band)].items():
            pooled_ply[key][0] += value["agree"]
            pooled_ply[key][1] += value["disagree"]
    by_ply["pooled"] = {
        key: {"agree": v[0], "disagree": v[1], "trials": v[0] + v[1],
              "rate": v[0] / (v[0] + v[1]) if v[0] + v[1] else None,
              "ci95": list(wilson(v[0], v[0] + v[1])),
              "pVsChance": binom_p_two_sided(v[0], v[0] + v[1])}
        for key, v in sorted(pooled_ply.items(), key=lambda kv: int(kv[0].split("-")[0]))
    }
    summary["agreementByPly"] = by_ply

    # The control the ply curve needs: if EVERY instrument decays with ply, the decay
    # is a property of the ground truth at depth, not of Maia.
    ply_controls = defaultdict(lambda: defaultdict(lambda: [0, 0]))
    for band in bands:
        table = maia[(primary_arm, band)]
        for pair in [p for p in all_pairs[band] if p["decided"]]:
            bucket = f"{pair['ply'] // 4 * 4}-{pair['ply'] // 4 * 4 + 3}"
            sft = sf_cp.get(pair["fen"], {})
            if pair["a"] in sft and pair["b"] in sft and sft[pair["a"]] != sft[pair["b"]]:
                ok = sign(sft[pair["a"]] - sft[pair["b"]]) == sign(pair["deltaPP"])
                ply_controls["stockfishDepth12"][bucket][0 if ok else 1] += 1
            if pair["nA"] != pair["nB"]:
                ok = sign(pair["nA"] - pair["nB"]) == sign(pair["deltaPP"])
                ply_controls["explorerPopularity"][bucket][0 if ok else 1] += 1
            row = table.get(pair["fen"], {})
            a, b = row.get(pair["a"]), row.get(pair["b"])
            if a is not None and b is not None and 0.5 <= pair["nA"] / pair["nB"] <= 2.0:
                ok = sign(a["score"] - b["score"]) == sign(pair["deltaPP"])
                ply_controls["maiaWdl_comparablePopularity"][bucket][0 if ok else 1] += 1
                ok = sign(a["policy"] - b["policy"]) == sign(pair["deltaPP"])
                ply_controls["maiaPolicy_comparablePopularity"][bucket][0 if ok else 1] += 1
    summary["agreementByPlyControls_pooled"] = {
        name: {key: {"agree": v[0], "disagree": v[1], "trials": v[0] + v[1],
                     "rate": v[0] / (v[0] + v[1]) if v[0] + v[1] else None,
                     "ci95": list(wilson(v[0], v[0] + v[1]))}
               for key, v in sorted(buckets.items(), key=lambda kv: int(kv[0].split("-")[0]))}
        for name, buckets in ply_controls.items()
    }

    # --------------------------------- calibration: spread, bias, draw rate
    calib = {}
    for band in bands:
        table = maia[(primary_arm, band)]
        pairs_h, pairs_m = [], []
        draw_h, draw_m = [], []
        spreads_h, spreads_m = [], []
        for fen, htable in human[band].items():
            mrow = table.get(fen)
            if mrow is None:
                continue
            usable = [(u, r) for u, r in htable.items() if r["n"] >= USABLE_N and u in mrow]
            for uci, hrow in usable:
                pairs_h.append(hrow["score"])
                pairs_m.append(mrow[uci]["score"])
                draw_h.append(hrow["draw"])
                draw_m.append(mrow[uci]["draw"])
            if len(usable) >= 2:
                hs = [r["score"] for _, r in usable]
                ms = [mrow[u]["score"] for u, _ in usable]
                spreads_h.append((max(hs) - min(hs)) * 100)
                spreads_m.append((max(ms) - min(ms)) * 100)
        calib[str(band)] = {
            "moveRows": len(pairs_h),
            "pearson_score": pearson(pairs_m, pairs_h),
            "spearman_score": spearman(pairs_m, pairs_h),
            "meanHumanScore": statistics.mean(pairs_h) if pairs_h else None,
            "meanMaiaScore": statistics.mean(pairs_m) if pairs_m else None,
            "sdHumanScore": statistics.pstdev(pairs_h) if len(pairs_h) > 1 else None,
            "sdMaiaScore": statistics.pstdev(pairs_m) if len(pairs_m) > 1 else None,
            "positionsWith2UsableMoves": len(spreads_h),
            "medianWithinPositionSpreadPP_human": statistics.median(spreads_h) if spreads_h else None,
            "medianWithinPositionSpreadPP_maia": statistics.median(spreads_m) if spreads_m else None,
            "meanHumanDrawRate": statistics.mean(draw_h) if draw_h else None,
            "meanMaiaDrawRate": statistics.mean(draw_m) if draw_m else None,
            "pearson_drawRate": pearson(draw_m, draw_h),
        }
    summary["calibration"] = calib

    # within-position rank correlation
    rank = {}
    for band in bands:
        table = maia[(primary_arm, band)]
        rhos_wdl, rhos_policy = [], []
        for fen, htable in human[band].items():
            mrow = table.get(fen)
            if mrow is None:
                continue
            usable = [(u, r) for u, r in htable.items() if r["n"] >= USABLE_N and u in mrow]
            if len(usable) < 3:
                continue
            hs = [r["score"] for _, r in usable]
            rhos_wdl.append(spearman([mrow[u]["score"] for u, _ in usable], hs))
            rhos_policy.append(spearman([mrow[u]["policy"] for u, _ in usable], hs))
        rhos_wdl = [r for r in rhos_wdl if not math.isnan(r)]
        rhos_policy = [r for r in rhos_policy if not math.isnan(r)]
        rank[str(band)] = {
            "positions": len(rhos_wdl),
            "medianSpearman_wdl": statistics.median(rhos_wdl) if rhos_wdl else None,
            "meanSpearman_wdl": statistics.mean(rhos_wdl) if rhos_wdl else None,
            "positivePct_wdl": 100 * sum(1 for r in rhos_wdl if r > 0) / len(rhos_wdl) if rhos_wdl else None,
            "medianSpearman_policy": statistics.median(rhos_policy) if rhos_policy else None,
            "positivePct_policy": 100 * sum(1 for r in rhos_policy if r > 0) / len(rhos_policy) if rhos_policy else None,
        }
    summary["withinPositionRank"] = rank

    # ------------------------------------------- band responsiveness (Maia vs human)
    responsiveness = {}
    for lo, hi in ((1400, 1800), (1400, 1600), (1600, 1800)):
        dm, dh, noise = [], [], []
        tlo, thi = maia[(primary_arm, lo)], maia[(primary_arm, hi)]
        for fen in human[lo]:
            if fen not in human[hi] or fen not in tlo or fen not in thi:
                continue
            for uci, hrow in human[lo][fen].items():
                other = human[hi][fen].get(uci)
                if other is None or hrow["n"] < USABLE_N or other["n"] < USABLE_N:
                    continue
                if uci not in tlo[fen] or uci not in thi[fen]:
                    continue
                dh.append((other["score"] - hrow["score"]) * 100)
                dm.append((thi[fen][uci]["score"] - tlo[fen][uci]["score"]) * 100)
                noise.append(VAR_PER_GAME / hrow["n"] + VAR_PER_GAME / other["n"])
        # How much of sd(human delta) is sampling noise? Without this the near-zero
        # correlation below is unreadable: an estimand of ~0 cannot be tracked.
        sampling_sd = math.sqrt(statistics.mean(noise)) * 100 if noise else None
        observed_sd = statistics.pstdev(dh) if len(dh) > 1 else None
        responsiveness[f"{lo}->{hi}"] = {
            "moveRows": len(dh),
            "samplingSdOfHumanDeltaPP": sampling_sd,
            "trueSdOfHumanDeltaPP_impliedByVarianceSubtraction":
                (math.sqrt(max(0.0, observed_sd ** 2 - sampling_sd ** 2))
                 if observed_sd is not None and sampling_sd is not None else None),
            "meanDeltaHumanPP": statistics.mean(dh) if dh else None,
            "meanDeltaMaiaPP": statistics.mean(dm) if dm else None,
            "sdDeltaHumanPP": statistics.pstdev(dh) if len(dh) > 1 else None,
            "sdDeltaMaiaPP": statistics.pstdev(dm) if len(dm) > 1 else None,
            "pearson": pearson(dm, dh),
            "signAgreement": sum(1 for a, b in zip(dm, dh) if sign(a) == sign(b)) / len(dh) if dh else None,
        }
    summary["bandResponsiveness"] = responsiveness

    # ------------------------------------------ availability past the ply-20 wall
    avail = {}
    for name, rows in arms.items():
        buckets = defaultdict(lambda: {"probes": 0, "candidateRows": 0, "wdlRows": 0,
                                       "spreads": [], "listedPolicyMass": []})
        for row in rows:
            bucket = ("0-9" if row["ply"] < 10 else "10-19" if row["ply"] < 20
                      else "20-29" if row["ply"] < 30 else "30-39" if row["ply"] < 40 else "40+")
            entry = buckets[bucket]
            entry["probes"] += 1
            entry["candidateRows"] += len(row["candidates"])
            entry["wdlRows"] += sum(1 for c in row["candidates"] if c["wdl"] is not None)
            scores = [(c["wdl"][0] + c["wdl"][1] / 2) / 10 for c in row["candidates"]]
            if len(scores) >= 2:
                entry["spreads"].append(max(scores) - min(scores))
            entry["listedPolicyMass"].append(sum(c["policy"] for c in row["candidates"]))
        avail[name] = {
            key: {"probes": v["probes"], "candidateRows": v["candidateRows"],
                  "wdlRows": v["wdlRows"],
                  "wdlPct": 100 * v["wdlRows"] / v["candidateRows"] if v["candidateRows"] else None,
                  "medianSpreadPP": statistics.median(v["spreads"]) if v["spreads"] else None,
                  "medianListedPolicyMass": statistics.median(v["listedPolicyMass"])}
            for key, v in sorted(buckets.items())
        }
    summary["availabilityByPly"] = avail

    # ------------------------------------------------------- instrument checks
    checks = {}
    if "bare" in {name for name, _ in maia} and ("bare", 1600) in maia:
        same = diff = 0
        deltas = []
        for fen, table in maia[("bare", 1600)].items():
            other = maia[(primary_arm, 1600)].get(fen)
            if other is None:
                continue
            for uci, row in table.items():
                if uci not in other:
                    continue
                delta = abs(row["cp"] - other[uci]["cp"])
                deltas.append(delta)
                if delta == 0:
                    same += 1
                else:
                    diff += 1
        checks["historyVsBare_band1600"] = {
            "sharedMoveRows": same + diff, "identicalCp": same, "differingCp": diff,
            "medianAbsCpDelta": statistics.median(deltas) if deltas else None,
            "p90AbsCpDelta": (sorted(deltas)[int(0.9 * (len(deltas) - 1))] if deltas else None),
            "maxAbsCpDelta": max(deltas) if deltas else None,
        }
        # does the arm change the verdict?
        agree_bare = {}
        for band in (1600,):
            decided = [p for p in all_pairs[band] if p["decided"]]
            agree_bare[str(band)] = agreement(decided, "bare", band, "score")
        checks["verdictUnderBareArm"] = agree_bare
    if ("eloonly", 1400) in maia and (primary_arm, 1400) in maia:
        same = diff = 0
        for fen, table in maia[("eloonly", 1400)].items():
            other = maia[(primary_arm, 1400)].get(fen)
            if other is None:
                continue
            for uci, row in table.items():
                if uci not in other:
                    continue
                if row["cp"] == other[uci]["cp"]:
                    same += 1
                else:
                    diff += 1
        checks["shippedOrderVsEloOnly_band1400"] = {"sharedMoveRows": same + diff,
                                                    "identicalCp": same, "differingCp": diff}
    summary["instrumentChecks"] = checks

    # ------------------------------------------- argmax agreement (the audit's 60%)
    argmax = {}
    for band in bands:
        table = maia[(primary_arm, band)]
        wdl_vs_policy_all = wdl_vs_policy_n = 0
        wdl_top = policy_top = pop_top = 0
        positions_scored = 0
        for fen, row in table.items():
            if row:
                wdl_vs_policy_n += 1
                best_wdl = max(row.items(), key=lambda kv: kv[1]["score"])[0]
                best_policy = max(row.items(), key=lambda kv: kv[1]["policy"])[0]
                if best_wdl != best_policy:
                    wdl_vs_policy_all += 1
            htable = human[band].get(fen, {})
            usable = {u: r for u, r in htable.items() if r["n"] >= USABLE_N and u in row}
            if len(usable) < 2:
                continue
            positions_scored += 1
            human_best = max(usable.items(), key=lambda kv: kv[1]["score"])[0]
            wdl_top += max(usable, key=lambda u: row[u]["score"]) == human_best
            policy_top += max(usable, key=lambda u: row[u]["policy"]) == human_best
            pop_top += max(usable, key=lambda u: usable[u]["n"]) == human_best
        argmax[str(band)] = {
            "probes": wdl_vs_policy_n,
            "wdlArgmaxDiffersFromPolicyArgmaxPct":
                100 * wdl_vs_policy_all / wdl_vs_policy_n if wdl_vs_policy_n else None,
            "positionsWith2UsableMoves": positions_scored,
            "topPickMatchesBestHumanMove": {
                "maiaWdl": wdl_top, "maiaPolicy": policy_top, "explorerPopularity": pop_top,
                "maiaWdlPct": 100 * wdl_top / positions_scored if positions_scored else None,
                "maiaPolicyPct": 100 * policy_top / positions_scored if positions_scored else None,
                "explorerPopularityPct": 100 * pop_top / positions_scored if positions_scored else None,
            },
        }
    summary["argmax"] = argmax

    # ---------------------------------------------------------------- exemplars
    band = 1600
    decided = sorted([p for p in all_pairs[band] if p["decided"]],
                     key=lambda p: -abs(p["deltaPP"]))
    table = maia[(primary_arm, band)]
    top = []
    for pair in decided[:40]:
        row = table.get(pair["fen"], {})
        a, b = row.get(pair["a"]), row.get(pair["b"])
        if a is None or b is None:
            continue
        sft = sf_cp.get(pair["fen"], {})
        top.append({
            "fen": pair["fen"], "ply": pair["ply"], "packId": pair["packId"],
            "a": pair["sanA"], "b": pair["sanB"], "nA": pair["nA"], "nB": pair["nB"],
            "humanGapPP": round(pair["deltaPP"], 2),
            "maiaGapPP": round((a["score"] - b["score"]) * 100, 2),
            "maiaCpA": a["cp"], "maiaCpB": b["cp"],
            "sfCpA": sft.get(pair["a"]), "sfCpB": sft.get(pair["b"]),
            "agrees": sign(a["score"] - b["score"]) == sign(pair["deltaPP"]),
        })
    summary["exemplars_band1600_largestHumanGaps"] = top[:10]

    # The product-relevant exemplars: pairs the engine cannot separate at depth 12
    # and the human population separates. R9 §6.3's object.
    tied_top = []
    for pair in decided:
        sft = sf_cp.get(pair["fen"], {})
        if pair["a"] not in sft or pair["b"] not in sft:
            continue
        if abs(sft[pair["a"]] - sft[pair["b"]]) >= TIED_CP:
            continue
        row = table.get(pair["fen"], {})
        a, b = row.get(pair["a"]), row.get(pair["b"])
        if a is None or b is None:
            continue
        tied_top.append({
            "fen": pair["fen"], "ply": pair["ply"], "packId": pair["packId"],
            "a": pair["sanA"], "b": pair["sanB"], "nA": pair["nA"], "nB": pair["nB"],
            "humanGapPP": round(pair["deltaPP"], 2),
            "maiaGapPP": round((a["score"] - b["score"]) * 100, 2),
            "sfCpGap": sft[pair["a"]] - sft[pair["b"]],
            "agrees": sign(a["score"] - b["score"]) == sign(pair["deltaPP"]),
        })
    tied_top.sort(key=lambda item: -abs(item["humanGapPP"]))
    summary["exemplars_band1600_engineTied"] = tied_top[:12]

    with open(out_path, "w") as handle:
        json.dump(summary, handle, indent=1, sort_keys=False)
        handle.write("\n")
    print(json.dumps({k: summary[k] for k in
                      ("encoding", "population", "verdictPooled")}, indent=1)[:4000])
    print(f"wrote {out_path}")


if __name__ == "__main__":
    main()
