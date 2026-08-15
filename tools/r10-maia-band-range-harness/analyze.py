#!/usr/bin/env python3
"""DISPOSABLE research analyser — R10 (Maia's usable `Elo` range).

Reads the JSONL emitted by probe-sweep.ts / probe-malformed.ts and produces the
summary JSON quoted by design/research/maia-band-calibrated-range.md.

Metric. For a position p and requested band e let L(p,e) be the candidate list
Maia reported (hard-capped at 20 by the engine, R4) and pol(m) the emitted
`policy` scalar. Two distances, both total variation over the union of the two
candidate lists with an unlisted move scored 0:

  TV_raw(e1,e2)    = 0.5 * sum_{m in U} |pol_{e1}(m) - pol_{e2}(m)|
  TV_renorm(e1,e2) = same, after dividing each list by its own listed sum

TV_raw is the distance between the two truncated distributions as emitted;
TV_renorm is the distance between the objects the shipped consumer actually
computes on (opponent-selector.ts:641-643 divides concedingMass by measuredMass,
i.e. renormalises over the listed set). Reported side by side because the gap
between them IS the truncation effect.

Usage: analyze.py OUT.json FILE.jsonl [FILE.jsonl ...]
"""

from __future__ import annotations

import json
import math
import statistics
import sys
from collections import defaultdict

UNIFORM = [e for e in range(0, 5001, 100)]


def load(paths):
    identity = {}
    probes = defaultdict(dict)  # arm -> (fen, band) -> record
    malformed = []
    for path in paths:
        with open(path, encoding="utf8") as handle:
            for line in handle:
                row = json.loads(line)
                kind = row.get("kind")
                if kind == "identity":
                    identity[row.get("arm", "malformed")] = row
                elif kind == "probe":
                    probes[row["arm"]][(row["fen"], row["band"])] = row
                elif kind in {"reference", "sequence"}:
                    malformed.append(row)
    return identity, probes, malformed


def dist(record):
    """(raw dict, renormalised dict, listed sum)."""
    raw = {}
    for candidate in record.get("candidates", []):
        if candidate["policyRaw"] is None:
            continue
        raw[candidate["uci"]] = float(candidate["policyRaw"])
    total = sum(raw.values())
    renorm = {m: v / total for m, v in raw.items()} if total > 0 else {}
    return raw, renorm, total


def tv(a, b):
    keys = set(a) | set(b)
    return 0.5 * sum(abs(a.get(k, 0.0) - b.get(k, 0.0)) for k in keys)


def entropy(p):
    return -sum(v * math.log2(v) for v in p.values() if v > 0)


def argmax(p):
    return max(p.items(), key=lambda kv: (kv[1], kv[0]))[0] if p else None


def quart(values):
    values = sorted(values)
    if not values:
        return None
    return {
        "n": len(values),
        "min": values[0],
        "p25": statistics.quantiles(values, n=4)[0] if len(values) > 3 else values[0],
        "median": statistics.median(values),
        "p75": statistics.quantiles(values, n=4)[2] if len(values) > 3 else values[-1],
        "max": values[-1],
    }


def analyse_arm(records):
    """records: (fen, band) -> probe row."""
    fens = sorted({fen for fen, _ in records})
    bands = sorted({band for _, band in records})
    groups = defaultdict(set)
    for (fen, _band), row in records.items():
        if "phase" in row:
            groups[row["phase"]].add(fen)
            groups[f"stm:{fen.split(' ')[1]}"].add(fen)
            # The 20-candidate cap (R4) means listed mass can only fall short of
            # 1 where the position has more than 20 legal moves. Everything else
            # is trivially 1.0 and would dilute the aggregate.
            groups["legal>20" if row.get("legalCount", 0) > 20 else "legal<=20"].add(fen)
    cache = {}
    for key, row in records.items():
        if "error" in row:
            continue
        raw, renorm, total = dist(row)
        cache[key] = {
            "raw": raw,
            "renorm": renorm,
            "listedMass": total,
            "argmax": argmax(raw),
            "top1": max(renorm.values()) if renorm else None,
            "entropy": entropy(renorm) if renorm else None,
            "count": len(raw),
            "digest": row.get("infoDigest"),
            "latencyMs": row.get("latencyMs"),
        }
    return fens, bands, cache, {k: sorted(v) for k, v in groups.items()}


def per_band(fens, bands, cache):
    out = []
    for band in bands:
        rows = [cache[(f, band)] for f in fens if (f, band) in cache]
        if not rows:
            continue
        pairs = [
            (cache[(f, band)], cache[(f, 1500)])
            for f in fens
            if (f, band) in cache and (f, 1500) in cache
        ]
        argmax_same = (
            sum(1 for a, b in pairs if a["argmax"] == b["argmax"]) / len(pairs) if pairs else None
        )
        out.append(
            {
                "band": band,
                "positions": len(rows),
                "listedMassMedian": statistics.median(r["listedMass"] for r in rows),
                "listedMassMin": min(r["listedMass"] for r in rows),
                "listedMassP25": quart([r["listedMass"] for r in rows])["p25"],
                "candidateCountMedian": statistics.median(r["count"] for r in rows),
                "top1Median": statistics.median(r["top1"] for r in rows),
                "entropyBitsMedian": statistics.median(r["entropy"] for r in rows),
                "argmaxAgreesWith1500": argmax_same,
                "latencyMsMedian": statistics.median(r["latencyMs"] for r in rows),
            }
        )
    return out


def adjacent(fens, grid, cache):
    out = []
    for lo, hi in zip(grid, grid[1:]):
        raws, renorms, moved, changed = [], [], 0, 0
        n = 0
        for fen in fens:
            a, b = cache.get((fen, lo)), cache.get((fen, hi))
            if a is None or b is None:
                continue
            n += 1
            raws.append(tv(a["raw"], b["raw"]))
            renorms.append(tv(a["renorm"], b["renorm"]))
            if a["digest"] != b["digest"]:
                moved += 1
            if a["argmax"] != b["argmax"]:
                changed += 1
        if n == 0:
            continue
        out.append(
            {
                "from": lo,
                "to": hi,
                "positions": n,
                "tvRaw": quart(raws),
                "tvRenorm": quart(renorms),
                "fractionDistributionChanged": moved / n,
                "fractionArgmaxChanged": changed / n,
                "fractionTvRenormAbove001": sum(1 for v in renorms if v >= 0.01) / n,
                "fractionTvRenormAbove005": sum(1 for v in renorms if v >= 0.05) / n,
            }
        )
    return out


def separation(fens, grid, cache, anchors):
    """Does TV(anchor, e) grow with |e - anchor|? The monotonicity leg."""
    out = []
    for anchor in anchors:
        if anchor not in grid:
            continue
        for side, ladder in (
            ("up", [e for e in grid if e >= anchor]),
            ("down", [e for e in grid if e <= anchor][::-1]),
        ):
            if len(ladder) < 3:
                continue
            steps, viol, curves = 0, 0, []
            for fen in fens:
                base = cache.get((fen, anchor))
                if base is None:
                    continue
                series = []
                for e in ladder:
                    other = cache.get((fen, e))
                    if other is None:
                        series.append(None)
                        continue
                    series.append(tv(base["renorm"], other["renorm"]))
                clean = [v for v in series if v is not None]
                curves.append(clean)
                for prev, nxt in zip(clean, clean[1:]):
                    steps += 1
                    if nxt < prev - 1e-12:
                        viol += 1
            if steps == 0:
                continue
            out.append(
                {
                    "anchor": anchor,
                    "direction": side,
                    "steps": steps,
                    "nonDecreasingFraction": (steps - viol) / steps,
                    "violations": viol,
                    "maxTvMedian": statistics.median(max(c) for c in curves if c),
                }
            )
    return out


def anchor_curves(fens, grid, cache, anchors):
    """Median TV from a fixed anchor band to every grid band.

    The diagnostic that separates 'the output keeps moving' from 'the output
    keeps moving AWAY': if the high end is drifting back towards the low end's
    shape, TV(0, e) peaks strictly inside the range instead of at e = 5000.
    """
    out = {}
    for anchor in anchors:
        if anchor not in grid:
            continue
        series = []
        for e in grid:
            values = []
            for fen in fens:
                a, b = cache.get((fen, anchor)), cache.get((fen, e))
                if a is None or b is None:
                    continue
                values.append(tv(a["renorm"], b["renorm"]))
            if values:
                series.append({"band": e, "tvRenormMedian": statistics.median(values)})
        peak = max(series, key=lambda row: row["tvRenormMedian"]) if series else None
        out[str(anchor)] = {"curve": series, "peakBand": peak["band"] if peak else None}
    return out


def turning_points(fens, grid, cache):
    """Per position, the band where policy entropy is lowest / listed mass highest."""
    ent, mass, peak_lo, peak_hi = [], [], [], []
    for fen in fens:
        rows = [(e, cache[(fen, e)]) for e in grid if (fen, e) in cache]
        if not rows:
            continue
        ent.append(min(rows, key=lambda kv: (kv[1]["entropy"], kv[0]))[0])
        mass.append(max(rows, key=lambda kv: (kv[1]["listedMass"], -kv[0]))[0])
        for anchor, sink in ((0, peak_lo), (5000, peak_hi)):
            base = cache.get((fen, anchor))
            if base is None:
                continue
            sink.append(max(rows, key=lambda kv: (tv(base["renorm"], kv[1]["renorm"]), kv[0]))[0])
    return {
        "entropyArgminBand": quart(ent),
        "listedMassArgmaxBand": quart(mass),
        "tvFrom0PeakBand": quart(peak_lo),
        "tvFrom5000PeakBand": quart(peak_hi),
        "entropyArgminHistogram": {str(b): ent.count(b) for b in sorted(set(ent))},
        "listedMassArgmaxHistogram": {str(b): mass.count(b) for b in sorted(set(mass))},
        "tvFrom0PeakHistogram": {str(b): peak_lo.count(b) for b in sorted(set(peak_lo))},
        "tvFrom5000PeakHistogram": {str(b): peak_hi.count(b) for b in sorted(set(peak_hi))},
    }


def tv_matrix(fens, grid, cache):
    """Median-over-positions TV between every ordered pair of grid bands."""
    matrix = {}
    for i, a in enumerate(grid):
        for b in grid[i + 1 :]:
            values = []
            for fen in fens:
                x, y = cache.get((fen, a)), cache.get((fen, b))
                if x is None or y is None:
                    continue
                values.append(tv(x["renorm"], y["renorm"]))
            if values:
                matrix[(a, b)] = statistics.median(values)
    return matrix


def ordered_interval(grid, matrix, eps):
    """Largest sub-interval of the grid on which the band -> policy map is
    well separated: from every band inside it, the median distance to another
    band inside it grows with the gap, in both directions. A range that fails
    this contains two different requests the model answers with nearly the
    same distribution — the definition of a band the model no longer resolves.
    """

    def get(a, b):
        return matrix[(a, b)] if a < b else matrix[(b, a)]

    def ok(lo_i, hi_i):
        window = grid[lo_i : hi_i + 1]
        for anchor in window:
            for side in (
                [e for e in window if e > anchor],
                [e for e in window if e < anchor][::-1],
            ):
                prev = 0.0
                for e in side:
                    value = get(anchor, e)
                    if value < prev - eps:
                        return False
                    prev = value
        return True

    best = None
    for lo_i in range(len(grid)):
        for hi_i in range(len(grid) - 1, lo_i, -1):
            if best is not None and grid[hi_i] - grid[lo_i] <= best[1] - best[0]:
                break
            if ok(lo_i, hi_i):
                best = (grid[lo_i], grid[hi_i])
                break
    # Also: the maximal interval that contains the engine's own default, 1500.
    containing = None
    if 1500 in grid:
        span = -1
        for lo_i in range(len(grid)):
            if grid[lo_i] > 1500:
                break
            for hi_i in range(len(grid) - 1, lo_i - 1, -1):
                if grid[hi_i] < 1500:
                    break
                if grid[hi_i] - grid[lo_i] <= span:
                    break
                if ok(lo_i, hi_i):
                    span = grid[hi_i] - grid[lo_i]
                    containing = (grid[lo_i], grid[hi_i])
                    break
    return {"eps": eps, "largest": best, "largestContaining1500": containing}


def spearman(a, b):
    """Rank correlation over the moves both bands listed. TV alone cannot tell
    'the two ends collapsed to the SAME diffuse shape' from 'both are diffuse,
    so no coordinate carries enough mass for TV to be large'. Rank agreement
    is scale-free and separates them."""
    shared = sorted(set(a) & set(b))
    n = len(shared)
    if n < 3:
        return None
    def ranks(dist):
        order = sorted(shared, key=lambda m: (-dist[m], m))
        return {m: i for i, m in enumerate(order)}
    ra, rb = ranks(a), ranks(b)
    d2 = sum((ra[m] - rb[m]) ** 2 for m in shared)
    return 1 - 6 * d2 / (n * (n * n - 1))


def collisions(fens, cache, pairs):
    out = []
    for lo, hi in pairs:
        tvs, rhos, same, shared = [], [], 0, []
        for fen in fens:
            a, b = cache.get((fen, lo)), cache.get((fen, hi))
            if a is None or b is None:
                continue
            tvs.append(tv(a["renorm"], b["renorm"]))
            rho = spearman(a["renorm"], b["renorm"])
            if rho is not None:
                rhos.append(rho)
            shared.append(len(set(a["raw"]) & set(b["raw"])))
            if a["argmax"] == b["argmax"]:
                same += 1
        if not tvs:
            continue
        out.append(
            {
                "bands": [lo, hi],
                "positions": len(tvs),
                "tvRenormMedian": statistics.median(tvs),
                "spearmanMedian": statistics.median(rhos) if rhos else None,
                "argmaxAgreement": same / len(tvs),
                "sharedCandidatesMedian": statistics.median(shared),
            }
        )
    return out


def recommendation(grid, matrix, mass_window, eps=0.0):
    """The widest interval that satisfies BOTH published legs at once:
    inside `mass_window` (the candidate window still carries the distribution)
    AND well separated (`ordered_interval`'s test). This is the derivation
    behind the number the dossier recommends; it is a deployment bound on the
    request, not a claim about how the model plays anywhere inside it."""

    def get(a, b):
        return matrix[(a, b)] if a < b else matrix[(b, a)]

    def ok(lo, hi):
        window = [e for e in grid if lo <= e <= hi]
        for anchor in window:
            for side in (
                [e for e in window if e > anchor],
                [e for e in window if e < anchor][::-1],
            ):
                prev = 0.0
                for e in side:
                    value = get(anchor, e)
                    if value < prev - eps:
                        return False
                    prev = value
        return True

    lo_bound, hi_bound = mass_window
    ranked = []
    for lo in grid:
        if lo_bound is None or lo < lo_bound:
            continue
        for hi in grid:
            if hi_bound is None or hi > hi_bound or hi <= lo:
                continue
            if ok(lo, hi):
                ranked.append({"width": hi - lo, "min": lo, "max": hi})
    ranked.sort(key=lambda row: (-row["width"], row["min"]))
    return {"eps": eps, "massWindow": list(mass_window), "top": ranked[:5]}


def crossings(per_band_rows, key, threshold):
    """Lowest and highest band whose aggregate stays at/above a threshold."""
    rows = sorted((r for r in per_band_rows if 0 <= r["band"] <= 5000), key=lambda r: r["band"])
    inside = [row["band"] for row in rows if row[key] >= threshold]
    outside_between = [
        row["band"]
        for row in rows
        if inside and min(inside) < row["band"] < max(inside) and row[key] < threshold
    ]
    return {
        "threshold": threshold,
        "lowest": min(inside) if inside else None,
        "highest": max(inside) if inside else None,
        "contiguous": not outside_between,
        "holes": outside_between,
    }


def clamp(fens, cache, bands):
    """Are out-of-range bands byte-identical to the clamped endpoint?"""
    out = []
    for band in bands:
        target = 0 if band < 0 else 5000 if band > 5000 else None
        if target is None:
            continue
        same = tot = 0
        tvs = []
        for fen in fens:
            a, b = cache.get((fen, band)), cache.get((fen, target))
            if a is None or b is None:
                continue
            tot += 1
            if a["digest"] == b["digest"]:
                same += 1
            tvs.append(tv(a["raw"], b["raw"]))
        if tot:
            out.append(
                {
                    "band": band,
                    "clampedTo": target,
                    "positions": tot,
                    "byteIdenticalToEndpoint": same,
                    "maxTvRaw": max(tvs),
                }
            )
    return out


def cross_arm(cache_a, cache_b):
    shared = set(cache_a) & set(cache_b)
    same = sum(1 for k in shared if cache_a[k]["digest"] == cache_b[k]["digest"])
    tvs = [tv(cache_a[k]["raw"], cache_b[k]["raw"]) for k in shared]
    return {
        "sharedKeys": len(shared),
        "byteIdentical": same,
        "maxTvRaw": max(tvs) if tvs else None,
    }


def analyse_malformed(rows):
    refs = defaultdict(dict)
    seqs = []
    for row in rows:
        if row["kind"] == "reference":
            refs[row["fen"]][row["band"]] = row["digest"]
        else:
            seqs.append(row)
    grouped = defaultdict(lambda: defaultdict(int))
    for row in seqs:
        table = refs.get(row["fen"], {})
        match = next((band for band, digest in table.items() if digest == row["digest"]), "none-of-the-references")
        grouped[(row["prime"], row["candidate"])][match] += 1
    return [
        {"prime": prime, "candidate": candidate, "matchedReference": dict(counts)}
        for (prime, candidate), counts in sorted(grouped.items())
    ]


def main() -> None:
    out_path = sys.argv[1]
    identity, probes, malformed = load(sys.argv[2:])

    result = {"identity": identity, "arms": {}}

    caches = {}
    for arm, records in probes.items():
        fens, bands, cache, groups = analyse_arm(records)
        caches[arm] = cache
        errors = sum(1 for row in records.values() if "error" in row)
        grid = [b for b in bands if b in UNIFORM]
        entry = {
            "positions": len(fens),
            "bands": bands,
            "probes": len(records),
            "errors": errors,
            "perBand": per_band(fens, bands, cache),
            "adjacent": adjacent(fens, grid, cache),
        }
        if arm.startswith("sweep"):
            entry["separation"] = separation(fens, grid, cache, [0, 1000, 1500, 2500, 4000, 5000])
            entry["anchorCurves"] = anchor_curves(fens, grid, cache, [0, 1500, 3000, 5000])
            entry["turningPoints"] = turning_points(fens, grid, cache)
            entry["clamp"] = clamp(fens, cache, bands)
            entry["massCrossings"] = {
                statistic: [crossings(entry["perBand"], statistic, t) for t in (0.999, 0.99, 0.98, 0.95)]
                for statistic in ("listedMassMedian", "listedMassP25", "listedMassMin")
            }
            entry["collisions"] = collisions(
                fens,
                cache,
                [
                    (0, 5000), (0, 2500), (2500, 5000), (0, 1500), (1500, 5000),
                    (500, 4500), (1000, 4000), (1500, 3500), (1000, 3000), (800, 2200),
                    (1100, 1900), (1400, 1600),
                ],
            )
            matrix = tv_matrix(fens, grid, cache)
            entry["orderedInterval"] = [ordered_interval(grid, matrix, eps) for eps in (0.0, 0.002, 0.005)]
            entry["tvMatrixCoarse"] = {
                f"{a}-{b}": round(v, 4) for (a, b), v in matrix.items() if a % 500 == 0 and b % 500 == 0
            }
            truncated = sorted(groups.get("legal>20", []))
            mass_window = crossings(per_band(truncated, bands, cache), "listedMassMedian", 0.99)
            entry["recommendation"] = [
                recommendation(grid, matrix, (mass_window["lowest"], mass_window["highest"]), eps)
                for eps in (0.0, 0.005, 0.01)
            ]
            entry["byGroup"] = {
                name: {
                    "positions": len(members),
                    # The per-band detail is only interesting where the 20-cap
                    # actually bites; elsewhere listed mass is trivially 1.0.
                    **({"perBand": per_band(members, bands, cache)} if name == "legal>20" else {}),
                    "massCrossings": [
                        crossings(per_band(members, bands, cache), statistic, t)
                        for statistic in ("listedMassMedian", "listedMassP25")
                        for t in (0.999, 0.99)
                    ],
                    "turningPoints": turning_points(members, grid, cache),
                }
                for name, members in sorted(groups.items())
                if len(members) >= 3
            }
        result["arms"][arm] = entry

    if "sweep-asc" in caches and "control-desc" in caches:
        result["orderControl"] = cross_arm(caches["sweep-asc"], caches["control-desc"])
    if malformed:
        result["malformed"] = analyse_malformed(malformed)

    def trim(value):
        if isinstance(value, float):
            return round(value, 6)
        if isinstance(value, dict):
            return {k: trim(v) for k, v in value.items()}
        if isinstance(value, list):
            return [trim(v) for v in value]
        return value

    with open(out_path, "w", encoding="utf8") as handle:
        json.dump(trim(result), handle, indent=1, sort_keys=False)
    print(f"wrote {out_path}")


if __name__ == "__main__":
    main()
