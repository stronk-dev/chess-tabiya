#!/usr/bin/env python3
"""DISPOSABLE research harness — D333. Not production code.

Pure: given the same per-game JSONL it rewrites the committed summary byte for byte.

Primary estimator is the PAIRED-OPENING score. Every (round, bookId) contributes
exactly two games — the same opening with the two band assignments swapped — so the
pair mean removes both the opening's own bias and the first-move advantage before
any variance is computed. The unpaired per-game estimator is reported beside it.

Never renders an infinite ratio: a zero cell is reported as its rule-of-three
one-sided 95% bound (D285).
"""

import json
import math
import sys
from collections import Counter, defaultdict

Z = 1.959963984540054  # two-sided 95%
Z80 = 0.8416212335729143  # 80% power


def elo_from_score(p):
    """Elo difference implied by an expected score. None at the boundary."""
    if p <= 0.0 or p >= 1.0:
        return None
    return -400.0 * math.log10(1.0 / p - 1.0)


def elo_str(p):
    e = elo_from_score(p)
    return "unbounded" if e is None else f"{e:.1f}"


def rule_of_three(n):
    """One-sided 95% upper bound on a rate whose observed count is zero."""
    return 3.0 / n if n > 0 else None


def mean_sd(xs):
    n = len(xs)
    if n == 0:
        return 0.0, 0.0
    m = sum(xs) / n
    if n < 2:
        return m, 0.0
    var = sum((x - m) ** 2 for x in xs) / (n - 1)
    return m, math.sqrt(var)


def score_for_a(rec, a_label):
    """Result from player A's perspective. 1 / 0.5 / 0.

    A's colour comes from the SCHEDULE, not from the label. play-games.ts builds
    `for round: for entry: push(A-white); push(B-white)`, so an even `gameIndex`
    is always the A-white game of its pair. Reading it off `whiteLabel` instead
    would silently degenerate to "score of White" whenever the two arms carry the
    same label — which is exactly the same-band control arm.
    """
    if rec["result"] == "1/2-1/2":
        return 0.5
    a_is_white = rec["gameIndex"] % 2 == 0
    if rec["result"] == "1-0":
        return 1.0 if a_is_white else 0.0
    return 0.0 if a_is_white else 1.0


def analyse_arm(name, a_label, b_label, nominal_gap, records):
    voids = [r for r in records if r["result"] == "void"]
    games = [r for r in records if r["result"] != "void"]
    n = len(games)

    per_game = [score_for_a(r, a_label) for r in games]
    # Paired-opening estimator: key on (round, bookId); use only complete pairs.
    pairs = defaultdict(list)
    for r in games:
        pairs[(r["round"], r["bookId"])].append(score_for_a(r, a_label))
    complete = [sum(v) / 2.0 for v in pairs.values() if len(v) == 2]
    incomplete = sum(1 for v in pairs.values() if len(v) != 2)

    g_mean, g_sd = mean_sd(per_game)
    g_se = g_sd / math.sqrt(n) if n else 0.0
    p_mean, p_sd = mean_sd(complete)
    p_se_naive = p_sd / math.sqrt(len(complete)) if complete else 0.0

    # The naive SE treats every pair as independent, and they are not: the same
    # 170 openings are replayed every round, so pairs sharing a bookId share
    # whatever that opening does to the band's leverage. SE is therefore clustered
    # ON THE OPENING (CR0 with the C/(C-1) small-sample correction), and the
    # larger of naive/clustered is the one carried into the CI and the test.
    clusters = defaultdict(list)
    for (_round, book), v in pairs.items():
        if len(v) == 2:
            clusters[book].append(sum(v) / 2.0)
    n_pairs = len(complete)
    if n_pairs and len(clusters) > 1:
        acc = sum(sum(s - p_mean for s in v) ** 2 for v in clusters.values())
        c = len(clusters)
        p_se_cluster = math.sqrt(acc * (c / (c - 1))) / n_pairs
    else:
        p_se_cluster = p_se_naive
    p_se = max(p_se_naive, p_se_cluster)

    lo, hi = p_mean - Z * p_se, p_mean + Z * p_se
    z = (p_mean - 0.5) / p_se if p_se > 0 else 0.0
    pval = math.erfc(abs(z) / math.sqrt(2.0))

    # Minimum detectable effect at this n and this observed dispersion,
    # two-sided alpha=0.05, power=80%, on the paired estimator.
    mde_score = (Z + Z80) * p_se if p_se > 0 else None
    mde_elo = None if mde_score is None else 695.4 * mde_score  # d(Elo)/d(score) at 0.5

    # Effective-independence audit. Maia's sampler is SEEDED (uci.py:525, --seed
    # default 42), so a worker's move stream is a deterministic function of the
    # requests it receives. If two games are byte-identical they are one game, and
    # the nominal n overstates the evidence. Both are counted, never assumed.
    movelists = Counter(r["movesUci"] for r in games)
    pair_moves = defaultdict(list)
    for r in games:
        pair_moves[(r["round"], r["bookId"])].append(r["movesUci"])
    mirrored_pairs = [v for v in pair_moves.values() if len(v) == 2]
    mirrored_identical = sum(1 for v in mirrored_pairs if v[0] == v[1])

    wdl = Counter()
    for r in games:
        wdl[score_for_a(r, a_label)] += 1
    white_score = sum(
        1.0 if r["result"] == "1-0" else 0.5 if r["result"] == "1/2-1/2" else 0.0
        for r in games
    ) / n if n else 0.0

    by_phase = {}
    for phase in sorted({r["phase"] for r in games}):
        sub = [r for r in games if r["phase"] == phase]
        sp = defaultdict(list)
        for r in sub:
            sp[(r["round"], r["bookId"])].append(score_for_a(r, a_label))
        cp = [sum(v) / 2.0 for v in sp.values() if len(v) == 2]
        m, sd = mean_sd(cp)
        se = sd / math.sqrt(len(cp)) if cp else 0.0
        by_phase[phase] = {
            "games": len(sub),
            "pairs": len(cp),
            "scoreA": round(m, 5),
            "ci95": [round(m - Z * se, 5), round(m + Z * se, 5)],
            "eloA": elo_str(m),
        }

    elo = elo_from_score(p_mean)
    elo_lo, elo_hi = elo_from_score(lo), elo_from_score(hi)
    out = {
        "arm": name,
        "A": a_label,
        "B": b_label,
        "nominalBandGap": nominal_gap,
        "games": n,
        "voids": len(voids),
        "voidUpperBound95": None if voids else rule_of_three(len(records)),
        "pairsComplete": len(complete),
        "pairsIncomplete": incomplete,
        "distinctMovelists": len(movelists),
        "duplicateGameRate": round(1 - len(movelists) / n, 5) if n else None,
        "mirroredPairsIdentical": mirrored_identical,
        "mirroredPairs": len(mirrored_pairs),
        "winsA": wdl[1.0],
        "draws": wdl[0.5],
        "lossesA": wdl[0.0],
        "drawRate": round(wdl[0.5] / n, 5) if n else None,
        "whiteScoreOverall": round(white_score, 5),
        "scoreA_perGame": round(g_mean, 5),
        "se_perGame": round(g_se, 5),
        "scoreA_paired": round(p_mean, 5),
        "se_paired": round(p_se, 5),
        "se_paired_naive": round(p_se_naive, 5),
        "se_paired_clusteredByOpening": round(p_se_cluster, 5),
        "clusters": len(clusters),
        "ci95_paired": [round(lo, 5), round(hi, 5)],
        "z": round(z, 3),
        "p_two_sided": pval,
        "eloA": elo_str(p_mean),
        "eloCi95": ["unbounded" if elo_lo is None else round(elo_lo, 1),
                    "unbounded" if elo_hi is None else round(elo_hi, 1)],
        "mde_score_80pct": None if mde_score is None else round(mde_score, 5),
        "mde_elo_80pct": None if mde_elo is None else round(mde_elo, 1),
        "transferRatio": None if not nominal_gap or elo is None else round(elo / nominal_gap, 4),
        "transferRatioCi95": None if not nominal_gap or elo_lo is None or elo_hi is None
        else [round(elo_lo / nominal_gap, 4), round(elo_hi / nominal_gap, 4)],
        "terminations": dict(Counter(r["termination"] for r in games).most_common()),
        "plies": {
            "mean": round(sum(r["plies"] for r in games) / n, 1) if n else None,
            "max": max((r["plies"] for r in games), default=None),
        },
        "byPhase": by_phase,
    }
    return out


ARMS = [
    # name, A spec, B spec, nominal band gap (A minus B)
    ("null-1500-1500", "1500", "1500", 0),
    ("ctl-temp-1500", "1500", "1500:5.0:1.0", 0),
    ("wide-1000-2400", "1000", "2400", -1400),
    ("camp-1000-2000", "1000", "2000", -1000),
    ("step300-1500-1800", "1500", "1800", -300),
    ("step100-1500-1600", "1500", "1600", -100),
    ("step100-1900-2000", "1900", "2000", -100),
    ("asym-1000-2400", "1000", "2400", -1400),
    ("ladder-1000-v-1400", "1000", "1400", -400),
    ("ladder-1400-v-1400", "1400", "1400", 0),
    ("ladder-1800-v-1400", "1800", "1400", 400),
    ("ladder-2200-v-1400", "2200", "1400", 800),
]


def main():
    games_dir, out_path = sys.argv[1], sys.argv[2]
    results = []
    for name, a, b, gap in ARMS:
        path = f"{games_dir}/{name}.jsonl"
        try:
            recs = [json.loads(line) for line in open(path)]
        except FileNotFoundError:
            continue
        results.append(analyse_arm(name, a, b, gap, recs))

    # The transfer ratio the campaign needs, DERIVED, not chosen:
    #  - coverage: D332's journey is 1000->2000 Elo and the usable band range is
    #    1000-2400 (R10), so the band range covers the journey only if the ratio
    #    is at least 1000/1400 = 0.714.
    #  - granularity: a learner's own Elo estimate over a 30-game session has a
    #    standard error of about 0.47/sqrt(30) = 0.086 in score, i.e. ~60 Elo. A
    #    100-band rung whose real effect is below ~60 Elo cannot be told apart
    #    from its neighbour by the learner's own results inside a session, so the
    #    rung threshold is a ratio of 0.60 on a 100-band step.
    # The ledger's own PRE-REGISTERED D324 criterion, evaluated mechanically:
    # "Pass = monotone score across all four arms with non-overlapping 95% CIs;
    #  fail = any adjacent pair inverting or overlapping."
    ladder_names = [
        "ladder-1000-v-1400",
        "ladder-1400-v-1400",
        "ladder-1800-v-1400",
        "ladder-2200-v-1400",
    ]
    by_name = {r["arm"]: r for r in results}
    rungs = [by_name[n] for n in ladder_names if n in by_name]
    d324 = None
    if len(rungs) == len(ladder_names):
        steps = []
        for lo_r, hi_r in zip(rungs, rungs[1:]):
            steps.append(
                {
                    "from": lo_r["arm"],
                    "to": hi_r["arm"],
                    "increasing": hi_r["scoreA_paired"] > lo_r["scoreA_paired"],
                    # Non-overlapping 95% CIs, as written.
                    "ciDisjoint": hi_r["ci95_paired"][0] > lo_r["ci95_paired"][1],
                    "deltaScore": round(hi_r["scoreA_paired"] - lo_r["scoreA_paired"], 5),
                }
            )
        d324 = {
            "criterion": "monotone score across all four arms with non-overlapping 95% CIs",
            "source": "design/BACKLOG.md D324 (mirrored in planning/exploration/gates.md H5)",
            "rungs": [
                {"arm": r["arm"], "score": r["scoreA_paired"], "ci95": r["ci95_paired"],
                 "elo": r["eloA"], "n": r["games"]}
                for r in rungs
            ],
            "steps": steps,
            "monotone": all(s["increasing"] for s in steps),
            "allCiDisjoint": all(s["ciDisjoint"] for s in steps),
            "verdict": "PASS" if all(s["increasing"] and s["ciDisjoint"] for s in steps)
            else "FAIL",
        }

    summary = {
        "d324PreRegistered": d324,
        "derivedThresholds": {
            "coverageRatio": round(1000 / 1400, 4),
            "rungElo": 60.0,
            "rungRatioOn100BandStep": 0.60,
            "note": "coverage = D332 journey / R10 usable band range; rung = SE of a "
                    "30-game learner Elo estimate",
        },
        "arms": results,
    }
    with open(out_path, "w") as fh:
        json.dump(summary, fh, indent=1, sort_keys=False)
        fh.write("\n")

    hdr = f"{'arm':<22}{'n':>6}{'scoreA':>9}{'95% CI':>18}{'EloA':>10}{'ratio':>8}{'draw%':>7}{'p':>10}"
    print(hdr)
    print("-" * len(hdr))
    for r in results:
        ci = f"[{r['ci95_paired'][0]:.3f},{r['ci95_paired'][1]:.3f}]"
        ratio = "-" if r["transferRatio"] is None else f"{r['transferRatio']:.2f}"
        print(
            f"{r['arm']:<22}{r['games']:>6}{r['scoreA_paired']:>9.4f}{ci:>18}"
            f"{r['eloA']:>10}{ratio:>8}{100 * (r['drawRate'] or 0):>7.1f}"
            f"{r['p_two_sided']:>10.2e}"
        )
        print(f"{'':<22}{'MDE(80%)':>6} {r['mde_score_80pct']} score / {r['mde_elo_80pct']} Elo"
              f"   voids={r['voids']}  pliesMean={r['plies']['mean']}")


main()
