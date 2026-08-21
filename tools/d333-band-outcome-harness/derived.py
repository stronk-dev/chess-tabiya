#!/usr/bin/env python3
"""DISPOSABLE research harness — D333. Not production code.

The numbers the dossier's verdict quotes, all derived mechanically from the clustered
per-arm estimates so none of them is typed by hand:

  1. the ladder slope (one common reference, so no chaining) and its CI;
  2. the two pre-registered thresholds evaluated against it;
  3. the REALISED between-rung resolution, against the pre-registered 5-point target;
  4. the effect by phase and by piece count, because the book is not phase-uniform.
"""

import json
import math
import sys
from collections import defaultdict

Z = 1.959963984540054
Z80 = 0.8416212335729143


def elo(p):
    return None if p <= 0 or p >= 1 else -400.0 * math.log10(1.0 / p - 1.0)


def load(path):
    return [json.loads(line) for line in open(path)]


def score_a(r):
    if r["result"] == "1/2-1/2":
        return 0.5
    return 1.0 if (r["result"] == "1-0") == (r["gameIndex"] % 2 == 0) else 0.0


def paired_cluster(recs, keep=lambda r: True):
    pairs = defaultdict(list)
    for r in recs:
        if r["result"] == "void" or not keep(r):
            continue
        pairs[(r["round"], r["bookId"])].append((r["bookId"], score_a(r)))
    vals = [(v[0][0], (v[0][1] + v[1][1]) / 2.0) for v in pairs.values() if len(v) == 2]
    n = len(vals)
    if n < 2:
        return None
    xbar = sum(x for _, x in vals) / n
    by_book = defaultdict(float)
    for b, x in vals:
        by_book[b] += x - xbar
    g = len(by_book)
    se = math.sqrt(sum(v * v for v in by_book.values()) / (n * n) * (g / (g - 1))) if g > 1 else 0.0
    return {"pairs": n, "games": n * 2, "score": xbar, "se": se}


games = sys.argv[1]
arms = {}
for name in ["null-1500-1500", "ctl-temp-1500", "wide-1000-2400", "camp-1000-2000",
             "step300-1500-1800", "step100-1500-1600", "step100-1900-2000",
             "asym-1000-2400", "ladder-1000-v-1400", "ladder-1400-v-1400",
             "ladder-1800-v-1400", "ladder-2200-v-1400"]:
    arms[name] = (load(f"{games}/{name}.jsonl"), paired_cluster(load(f"{games}/{name}.jsonl")))

out = {}

# 1. Ladder slope, from the two extreme rungs of the shared-reference ladder.
lo, hi = arms["ladder-1000-v-1400"][1], arms["ladder-2200-v-1400"][1]
e_lo, e_hi = elo(lo["score"]), elo(hi["score"])
d_lo = 400.0 / (math.log(10) * lo["score"] * (1 - lo["score"])) * lo["se"]
d_hi = 400.0 / (math.log(10) * hi["score"] * (1 - hi["score"])) * hi["se"]
span_elo = e_hi - e_lo
span_se = math.hypot(d_lo, d_hi)
out["ladderSpan"] = {
    "bandFrom": 1000, "bandTo": 2200, "bandPoints": 1200,
    "eloGain": round(span_elo, 1),
    "eloGainCi95": [round(span_elo - Z * span_se, 1), round(span_elo + Z * span_se, 1)],
    "eloPer100Band": round(100 * span_elo / 1200, 2),
    "eloPer100BandCi95": [round(100 * (span_elo - Z * span_se) / 1200, 2),
                          round(100 * (span_elo + Z * span_se) / 1200, 2)],
    "transferRatio": round(span_elo / 1200, 4),
    "transferRatioCi95": [round((span_elo - Z * span_se) / 1200, 4),
                          round((span_elo + Z * span_se) / 1200, 4)],
}

# 2. Pre-registered thresholds (analyze.py's derivedThresholds), evaluated.
wide = arms["wide-1000-2400"][1]
e_wide = -elo(wide["score"])
d_wide = 400.0 / (math.log(10) * wide["score"] * (1 - wide["score"])) * wide["se"]
out["thresholds"] = {
    "coverage": {
        "needed": round(1000 / 1400, 4),
        "note": "D332's 1000->2000 journey (1000 Elo) over R10's usable band range (1400 band points)",
        "observedFullRangeElo": round(e_wide, 1),
        "observedFullRangeCi95": [round(e_wide - Z * d_wide, 1), round(e_wide + Z * d_wide, 1)],
        "observedRatio": round(e_wide / 1400, 4),
        "met": bool(e_wide / 1400 >= 1000 / 1400),
        "journeyFractionCovered": round(e_wide / 1000, 4),
    },
    "rung": {
        "neededEloPer100Band": 60.0,
        "note": "SE of a learner's own Elo over a 30-game session ~= 0.47/sqrt(30) in score ~= 60 Elo",
        "observed": {},
        "met": None,
        "resolvableBandStepPoints": round(60.0 / (span_elo / 1200)),
        "resolvableRungsInUsableRange": round(e_wide / 60.0, 2),
    },
}
for name, gap in (("step100-1500-1600", 100), ("step100-1900-2000", 100),
                  ("step300-1500-1800", 300)):
    s = arms[name][1]
    e = -elo(s["score"])
    d = 400.0 / (math.log(10) * s["score"] * (1 - s["score"])) * s["se"]
    out["thresholds"]["rung"]["observed"][name] = {
        "gap": gap, "elo": round(e, 1),
        "ci95": [round(e - Z * d, 1), round(e + Z * d, 1)],
        "eloPer100Band": round(100 * e / gap, 1),
        "ci95UpperBelow60": bool(100 * (e + Z * d) / gap < 60.0),
    }
out["thresholds"]["rung"]["met"] = all(
    not v["ci95UpperBelow60"] for v in out["thresholds"]["rung"]["observed"].values()
)

# 3. Realised between-rung resolution vs the pre-registered 5-point target.
rungs = ["ladder-1000-v-1400", "ladder-1400-v-1400", "ladder-1800-v-1400", "ladder-2200-v-1400"]
steps = []
for a, b in zip(rungs, rungs[1:]):
    sa, sb = arms[a][1], arms[b][1]
    sed = math.hypot(sa["se"], sb["se"])
    steps.append({
        "from": a, "to": b,
        "deltaScorePoints": round(100 * (sb["score"] - sa["score"]), 2),
        "seDiff": round(sed, 5),
        "mdePoints80": round(100 * (Z + Z80) * sed, 2),
        "deltaOverMde": round((sb["score"] - sa["score"]) / ((Z + Z80) * sed), 2),
        "ciDisjointClustered": bool(sb["score"] - Z * sb["se"] > sa["score"] + Z * sa["se"]),
    })
out["betweenRungResolution"] = {
    "targetPoints": 5.0,
    "gamesPerRung": arms["ladder-1000-v-1400"][1]["games"],
    "preRegisteredGamesNeededUnpaired": 1192,
    "steps": steps,
    "worstMdePoints": round(max(s["mdePoints80"] for s in steps), 2),
    "targetMet": bool(max(s["mdePoints80"] for s in steps) <= 5.0),
    "allCiDisjointClustered": all(s["ciDisjointClustered"] for s in steps),
}

# 4. The book is not phase-uniform, so the pooled number is a weighted average.
out["byPhaseAndMaterial"] = {}
for name in ["ladder-2200-v-1400", "wide-1000-2400", "step300-1500-1800"]:
    recs = arms[name][0]
    d = {}
    for phase in sorted({r["phase"] for r in recs}):
        s = paired_cluster(recs, lambda r, p=phase: r["phase"] == p)
        if s:
            e = elo(s["score"])
            d[phase] = {"games": s["games"], "score": round(s["score"], 4),
                        "elo": None if e is None else round(e, 1)}
    for lab, keep in (("pieces<=10", lambda r: r["pieceCount"] <= 10),
                      ("pieces11-20", lambda r: 11 <= r["pieceCount"] <= 20),
                      ("pieces>=21", lambda r: r["pieceCount"] >= 21)):
        s = paired_cluster(recs, keep)
        if s:
            e = elo(s["score"])
            d[lab] = {"games": s["games"], "score": round(s["score"], 4),
                      "elo": None if e is None else round(e, 1)}
    out["byPhaseAndMaterial"][name] = d

# 5. D324's own ladder re-run over FULL-MATERIAL positions only. §7 shows the attenuation
# tracks material rather than the pack's declared phase, so this is the ladder the band is
# actually a lever on, and its span is the honest best-case transfer ratio.
full = {}
for name in rungs:
    s = paired_cluster(arms[name][0], lambda r: r["pieceCount"] >= 21)
    e = elo(s["score"])
    d = 400.0 / (math.log(10) * s["score"] * (1 - s["score"])) * s["se"]
    full[name] = {"games": s["games"], "score": round(s["score"], 4),
                  "ci95": [round(s["score"] - Z * s["se"], 4), round(s["score"] + Z * s["se"], 4)],
                  "elo": round(e, 1), "eloSe": round(d, 1)}
lo_f, hi_f = full[rungs[0]], full[rungs[-1]]
span_f = hi_f["elo"] - lo_f["elo"]
se_f = math.hypot(lo_f["eloSe"], hi_f["eloSe"])
out["fullMaterialLadder"] = {
    "filter": "pieceCount >= 21",
    "rungs": full,
    "monotone": all(full[a]["score"] < full[b]["score"] for a, b in zip(rungs, rungs[1:])),
    "allCiDisjoint": all(full[b]["ci95"][0] > full[a]["ci95"][1] for a, b in zip(rungs, rungs[1:])),
    "spanElo": round(span_f, 1),
    "spanEloHalfWidth95": round(Z * se_f, 1),
    "eloPer100Band": round(100 * span_f / 1200, 2),
    "transferRatio": round(span_f / 1200, 4),
    "transferRatioCi95": [round((span_f - Z * se_f) / 1200, 4),
                          round((span_f + Z * se_f) / 1200, 4)],
    "coverageThreshold": round(1000 / 1400, 4),
    "fractionOfCoverageThreshold": round((span_f / 1200) / (1000 / 1400), 4),
}

json.dump(out, open(sys.argv[2], "w"), indent=1)
print(json.dumps(out, indent=1))
