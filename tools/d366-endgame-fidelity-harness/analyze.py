#!/usr/bin/env python3
"""DISPOSABLE research harness — D366. Not production code.

Scores the Maia probes against the tablebase ground truth carried in the probe
set. Every operationalisation used to answer "human-shaped or arbitrary" is
stated here in code before it is reported.

Baselines. The null hypothesis for "arbitrary" is a **uniform-random legal
move** over the same position. Because the tablebase gives the exact class of
every legal move, that baseline is computed exactly per position rather than
sampled: P(preserve) = |preserving| / |legal|, and likewise for every
conditional statistic below. Where a statistic conditions on "Maia erred", the
matched baseline conditions on "the random move erred", i.e. it is taken over
the dropping moves only.

Intervals. Probes within one position are not independent (16 repeats of the
same position share everything but the RNG), so every interval is a
**cluster bootstrap over positions** (2000 resamples, percentile method),
not a binomial interval over probes.
"""
import json
import math
import random
import sys
from collections import Counter, defaultdict

RANK = {"win": 2, "draw": 1, "loss": 0}
FILES = "abcdefgh"


def piece_at(fen, square):
    """Piece letter standing on an algebraic square in a FEN, or None.

    Board reading only — no move generation and no chess judgement."""
    board = fen.split(" ")[0]
    file_index = FILES.index(square[0])
    rank_index = int(square[1])
    row = board.split("/")[8 - rank_index]
    column = 0
    for ch in row:
        if ch.isdigit():
            column += int(ch)
        else:
            if column == file_index:
                return ch
            column += 1
    return None


def two_sided_sign_p(a, b):
    """Exact two-sided binomial sign test at p = 0.5 on a + b non-tied pairs."""
    n = a + b
    if n == 0:
        return None
    k = min(a, b)
    tail = sum(math.comb(n, i) for i in range(0, k + 1)) / (2 ** n)
    return min(1.0, 2 * tail)


def wilson(successes, total, z=1.96):
    if total == 0:
        return (0.0, 0.0, 0.0)
    p = successes / total
    denom = 1 + z * z / total
    centre = (p + z * z / (2 * total)) / denom
    half = z * math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / denom
    return (p, max(0.0, centre - half), min(1.0, centre + half))


def cluster_bootstrap(per_position, reps=2000, seed=20260816):
    """per_position: list of (numerator, denominator) pairs, one per position."""
    per_position = [pair for pair in per_position if pair[1] > 0]
    if not per_position:
        return (None, None, None)
    point = sum(n for n, _ in per_position) / sum(d for _, d in per_position)
    rng = random.Random(seed)
    draws = []
    size = len(per_position)
    for _ in range(reps):
        num = 0.0
        den = 0.0
        for _ in range(size):
            n, d = per_position[rng.randrange(size)]
            num += n
            den += d
        if den > 0:
            draws.append(num / den)
    draws.sort()
    lo = draws[int(0.025 * len(draws))]
    hi = draws[int(0.975 * len(draws)) - 1]
    return (point, lo, hi)


def load_jsonl(path):
    rows = []
    with open(path) as handle:
        for line in handle:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def main():
    set_path, probe_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
    # Arm A only: the preservation arm. Arm B (lost positions, where every legal move
    # preserves the loss) is scored by analyze-resistance.py instead.
    all_positions = {p["key"]: p for p in json.load(open(set_path))["positions"]}
    positions = {k: p for k, p in all_positions.items() if p.get("arm", "preservation") == "preservation"}
    rows = load_jsonl(probe_path)
    identity = [r for r in rows if r.get("kind") == "identity"]
    probes = [r for r in rows if r.get("kind") == "probe"]
    errors = [r for r in probes if r.get("error") is not None]
    probes = [r for r in probes if r.get("error") is None]
    bands = sorted({r["band"] for r in probes})

    # Keep only complete repeat rounds so every band and position carries equal weight.
    rounds = defaultdict(set)
    for r in probes:
        rounds[r["repeat"]].add((r["key"], r["band"]))
    expected = {(k, b) for k in all_positions for b in bands}
    complete = sorted(rep for rep, seen in rounds.items() if seen >= expected)
    probes = [r for r in probes if r["repeat"] in complete and r["key"] in positions]

    report = {
        "identity": identity,
        "probeErrors": len(errors),
        "completeRepeatRounds": len(complete),
        "probesScored": len(probes),
        "positions": len(positions),
        "bands": bands,
    }

    # ---------------------------------------------------------------- band application
    digests = defaultdict(set)
    command_ok = 0
    order_ok = 0
    for r in probes:
        digests[(r["key"], r["band"])].add(r["policyDigest"])
        cmds = r["commands"]
        elo_index = next(i for i, c in enumerate(cmds) if c.startswith("setoption name Elo "))
        if cmds[elo_index] == f"setoption name Elo value {r['band']}":
            command_ok += 1
        self_index = [i for i, c in enumerate(cmds) if c.startswith("setoption name SelfElo ")]
        oppo_index = [i for i, c in enumerate(cmds) if c.startswith("setoption name OppoElo ")]
        if self_index and oppo_index and max(self_index + oppo_index) < elo_index:
            order_ok += 1
    within_band_stable = sum(1 for v in digests.values() if len(v) == 1)
    distinct_across_bands = 0
    collisions = []
    for key in positions:
        seen = {}
        for band in bands:
            got = digests.get((key, band))
            if got and len(got) == 1:
                seen[band] = next(iter(got))
        if len(bands) > 1 and len(seen) == len(bands):
            if len(set(seen.values())) == len(bands):
                distinct_across_bands += 1
            else:
                collisions.append({"key": key, "digests": seen})
    report["bandApplication"] = {
        "probesWithRequestedEloSent": command_ok,
        "probesWithSelfOppoBeforeElo": order_ok,
        "positionBandCellsPolicyStableAcrossRepeats": [within_band_stable, len(digests)],
        "positionsWithDistinctPolicyPerBand": [distinct_across_bands, len(positions)],
        "bandCollisions": collisions[:20],
    }

    # ---------------------------------------------------------------- per-probe scoring
    scored = []
    for r in probes:
        pos = positions[r["key"]]
        by_uci = {m["uci"]: m for m in pos["moves"]}
        move = by_uci.get(r["bestmove"])
        if move is None:
            scored.append({"probe": r, "pos": pos, "illegal": True})
            continue
        own = pos["resultClass"]
        got = move["moverClass"]
        scored.append(
            {
                "probe": r,
                "pos": pos,
                "illegal": False,
                "move": move,
                "preserved": got == own,
                "transition": f"{own}->{got}",
            }
        )
    report["illegalOrOffListBestmoves"] = sum(1 for s in scored if s["illegal"])
    scored = [s for s in scored if not s["illegal"]]

    # ------------------------------------------------------------------- preservation
    preservation = {}
    for band in bands:
        per_pos_maia = []
        per_pos_rand = []
        for key, pos in positions.items():
            rows_ = [s for s in scored if s["probe"]["key"] == key and s["probe"]["band"] == band]
            if not rows_:
                continue
            per_pos_maia.append((sum(1 for s in rows_ if s["preserved"]), len(rows_)))
            p = pos["preservingCount"] / (pos["preservingCount"] + pos["droppingCount"])
            per_pos_rand.append((p * len(rows_), len(rows_)))
        maia = cluster_bootstrap(per_pos_maia)
        rand = cluster_bootstrap(per_pos_rand, seed=777)
        # Paired position-level difference, bootstrapped on the same resample.
        paired = cluster_bootstrap(
            [(m[0] - r[0], m[1]) for m, r in zip(per_pos_maia, per_pos_rand)], seed=999
        )
        flat = [s for s in scored if s["probe"]["band"] == band]
        preservation[band] = {
            "probes": len(flat),
            "preserved": sum(1 for s in flat if s["preserved"]),
            "maiaRate": maia,
            "randomRate": rand,
            "pairedDelta": paired,
            "wilsonOverProbes": wilson(sum(1 for s in flat if s["preserved"]), len(flat)),
            "transitions": dict(Counter(s["transition"] for s in flat)),
        }
    report["preservation"] = preservation

    # Band response of the SAMPLED move, position by position, low band vs high band.
    if len(bands) >= 2:
        lo_band, hi_band = bands[0], bands[-1]
        better = worse = tied = 0
        for key in positions:
            lo_rows = [s for s in scored if s["probe"]["key"] == key and s["probe"]["band"] == lo_band]
            hi_rows = [s for s in scored if s["probe"]["key"] == key and s["probe"]["band"] == hi_band]
            if not lo_rows or not hi_rows:
                continue
            lo_rate = sum(1 for s in lo_rows if s["preserved"]) / len(lo_rows)
            hi_rate = sum(1 for s in hi_rows if s["preserved"]) / len(hi_rows)
            if hi_rate > lo_rate:
                better += 1
            elif hi_rate < lo_rate:
                worse += 1
            else:
                tied += 1
        report["sampledBandResponse"] = {
            "lowBand": lo_band,
            "highBand": hi_band,
            "positionsBetterAtHighBand": better,
            "positionsWorseAtHighBand": worse,
            "positionsTied": tied,
            "signTestTwoSidedP": two_sided_sign_p(better, worse),
        }

    # transitions for the random baseline (expected counts over dropping moves)
    rand_trans = Counter()
    for key, pos in positions.items():
        own = pos["resultClass"]
        n = len(pos["moves"])
        for m in pos["moves"]:
            rand_trans[f"{own}->{m['moverClass']}"] += 1 / n
    report["randomTransitionsPerPosition"] = {k: round(v, 3) for k, v in rand_trans.items()}

    # ------------- O1b: position by position, is Maia better or WORSE than the coin?
    # The aggregate can hide the interesting half. A uniform-random mover errs at a rate
    # fixed by the position; a human-shaped mover should beat it almost everywhere and
    # lose to it badly exactly on the technique boundaries, because the seductive move is
    # the one it plays. That pattern and "arbitrary" are different pictures.
    per_position = []
    for key, pos in positions.items():
        rows_ = [s for s in scored if s["probe"]["key"] == key]
        if not rows_:
            continue
        maia_err = sum(1 for s in rows_ if not s["preserved"]) / len(rows_)
        rand_err = pos["droppingCount"] / (pos["preservingCount"] + pos["droppingCount"])
        per_position.append(
            {
                "key": key,
                "pack": pos["packId"],
                "probes": len(rows_),
                "maiaErrorRate": round(maia_err, 4),
                "uniformErrorRate": round(rand_err, 4),
                "preserving": pos["preservingCount"],
                "dropping": pos["droppingCount"],
            }
        )
    per_position.sort(key=lambda x: x["uniformErrorRate"] - x["maiaErrorRate"])
    report["perPositionVersusUniform"] = {
        "positions": len(per_position),
        "maiaWorseThanUniform": sum(1 for x in per_position if x["maiaErrorRate"] > x["uniformErrorRate"]),
        "maiaBetterThanUniform": sum(1 for x in per_position if x["maiaErrorRate"] < x["uniformErrorRate"]),
        "equal": sum(1 for x in per_position if x["maiaErrorRate"] == x["uniformErrorRate"]),
        "worstTen": per_position[:10],
        "rows": per_position,
    }

    # -------------------------------------------------- O2: concentration of the errors
    concentration = {}
    for band in bands:
        modal_shares = []
        distinct_used = []
        for key, pos in positions.items():
            errs = [
                s
                for s in scored
                if s["probe"]["key"] == key and s["probe"]["band"] == band and not s["preserved"]
            ]
            if len(errs) < 2:
                continue
            counts = Counter(s["move"]["uci"] for s in errs)
            modal_shares.append((max(counts.values()) / len(errs), pos["droppingCount"], len(errs)))
            distinct_used.append((len(counts), pos["droppingCount"]))
        concentration[band] = {
            "positionsWith2plusErrors": len(modal_shares),
            "meanModalErrorShare": (
                sum(x[0] for x in modal_shares) / len(modal_shares) if modal_shares else None
            ),
            # Expected modal share if the erring move were uniform over the dropping moves.
            "meanUniformExpectedModalShare": (
                sum(expected_modal_share(x[1], x[2]) for x in modal_shares) / len(modal_shares)
                if modal_shares
                else None
            ),
            "meanDistinctErrorMoves": (
                sum(x[0] for x in distinct_used) / len(distinct_used) if distinct_used else None
            ),
            "meanAvailableDroppingMoves": (
                sum(x[1] for x in distinct_used) / len(distinct_used) if distinct_used else None
            ),
        }
    report["errorConcentration"] = concentration

    # ------------------------------------------------ O3: plan / piece conservation
    plan = {}
    for band in bands:
        same_piece = 0
        same_role = 0
        total = 0
        exp_same_piece = 0.0
        exp_same_role = 0.0
        for key, pos in positions.items():
            own = pos["resultClass"]
            preserving = [m for m in pos["moves"] if m["moverClass"] == own]
            dropping = [m for m in pos["moves"] if m["moverClass"] != own]
            if not dropping:
                continue
            pres_from = {m["uci"][:2] for m in preserving}
            pres_roles = {piece_at(pos["fen"], m["uci"][:2]) for m in preserving}
            errs = [
                s
                for s in scored
                if s["probe"]["key"] == key and s["probe"]["band"] == band and not s["preserved"]
            ]
            for s in errs:
                total += 1
                if s["move"]["uci"][:2] in pres_from:
                    same_piece += 1
                if piece_at(pos["fen"], s["move"]["uci"][:2]) in pres_roles:
                    same_role += 1
            if errs:
                exp_same_piece += len(errs) * sum(
                    1 for m in dropping if m["uci"][:2] in pres_from
                ) / len(dropping)
                exp_same_role += len(errs) * sum(
                    1 for m in dropping if piece_at(pos["fen"], m["uci"][:2]) in pres_roles
                ) / len(dropping)
        plan[band] = {
            "errors": total,
            "samePieceAsAPreservingMove": same_piece,
            "expectedUnderUniformOverDropping": round(exp_same_piece, 2),
            "sameRoleAsAPreservingMove": same_role,
            "expectedRoleUnderUniform": round(exp_same_role, 2),
        }
    report["planConservation"] = plan

    # ----------------------------------------------- O4: where the errors cluster
    by_pack = defaultdict(lambda: [0, 0])
    by_dtz = defaultdict(lambda: [0, 0])
    by_class = defaultdict(lambda: [0, 0])
    by_pieces = defaultdict(lambda: [0, 0])
    for s in scored:
        pos = s["pos"]
        for bucket, key in (
            (by_pack, pos["packId"]),
            (by_class, pos["resultClass"]),
            (by_pieces, pos["pieceCount"]),
            (
                by_dtz,
                "n/a"
                if pos["dtz"] is None
                else ("|dtz|<=10" if abs(pos["dtz"]) <= 10 else ("|dtz|11-30" if abs(pos["dtz"]) <= 30 else "|dtz|>30")),
            ),
        ):
            bucket[key][1] += 1
            if not s["preserved"]:
                bucket[key][0] += 1
    report["errorsByPack"] = {k: v for k, v in sorted(by_pack.items())}
    by_pack_band = defaultdict(lambda: [0, 0])
    for s in scored:
        cell = by_pack_band[f"{s['pos']['packId']}@{s['probe']['band']}"]
        cell[1] += 1
        if not s["preserved"]:
            cell[0] += 1
    report["errorsByPackAndBand"] = {
        k: v for k, v in sorted(by_pack_band.items()) if by_pack[k.split("@")[0]][0] > 0
    }
    report["errorsByDtzBucket"] = {k: v for k, v in sorted(by_dtz.items())}
    report["errorsByResultClass"] = {k: v for k, v in sorted(by_class.items())}
    report["errorsByPieceCount"] = {k: v for k, v in sorted(by_pieces.items())}

    # cursed-win / blessed-loss exposure: the 50-move horizon
    horizon = [0, 0]
    for s in scored:
        pos = s["pos"]
        touched = pos["category"] in ("cursed-win", "blessed-loss") or any(
            m["moverCategory"] in ("cursed-win", "blessed-loss") for m in pos["moves"]
        )
        if touched:
            horizon[1] += 1
            if not s["preserved"]:
                horizon[0] += 1
    report["fiftyMoveHorizonPositions"] = horizon

    # ------------------- O4b: belief or sampler? the policy head vs the sampled move
    # The policy vector is byte-stable per (position, band) (R5); the `bestmove` is a
    # temperature/top-p SAMPLE from it on an unseeded RNG. So an error can be the model's
    # top choice (a belief) or a tail draw (a sampler artifact), and those are different
    # products. Reported: the class of argmax(policy), which is temperature-invariant, and
    # the raw policy mass sitting on dropping moves. The engine's own temperature/top-p
    # transform is NOT reimplemented here, so the raw mass is not a predicted error rate.
    belief = {}
    for band in bands:
        argmax_preserved = 0
        argmax_total = 0
        mass_on_dropping = []
        top_dropping_share = []
        for key, pos in positions.items():
            own = pos["resultClass"]
            by_uci = {m["uci"]: m for m in pos["moves"]}
            rows_ = [r for r in probes if r["key"] == key and r["band"] == band]
            if not rows_:
                continue
            cands = rows_[0]["candidates"]
            usable = [
                (c["uci"], float(c["policyRaw"]))
                for c in cands
                if c["policyRaw"] is not None and c["uci"] in by_uci
            ]
            if not usable:
                continue
            total = sum(p for _, p in usable)
            if total <= 0:
                continue
            top = max(usable, key=lambda x: x[1])
            argmax_total += 1
            if by_uci[top[0]]["moverClass"] == own:
                argmax_preserved += 1
            dropping_mass = sum(p for u, p in usable if by_uci[u]["moverClass"] != own)
            mass_on_dropping.append(dropping_mass / total)
            drops = [(u, p) for u, p in usable if by_uci[u]["moverClass"] != own]
            if drops and dropping_mass > 0:
                # Matched null: if the mass were spread evenly over the dropping moves,
                # the top one would hold 1/|dropping| of it.
                top_dropping_share.append((max(p for _, p in drops) / dropping_mass, 1 / len(drops)))
        belief[band] = {
            "positionsWithPolicy": argmax_total,
            "argmaxOfPolicyPreserves": argmax_preserved,
            "meanRawPolicyMassOnDroppingMoves": (
                sum(mass_on_dropping) / len(mass_on_dropping) if mass_on_dropping else None
            ),
            "meanShareOfDroppingMassOnItsTopMove": (
                sum(x for x, _ in top_dropping_share) / len(top_dropping_share)
                if top_dropping_share
                else None
            ),
            "sameIfDroppingMassWereUniform": (
                sum(y for _, y in top_dropping_share) / len(top_dropping_share)
                if top_dropping_share
                else None
            ),
        }
    report["policyBeliefVersusSampler"] = belief

    # Band response of the (deterministic) policy head, position by position. The policy
    # vector is byte-stable per band, so this is a paired comparison with no sampling
    # noise at all: n = positions, one number each.
    per_pos_mass = defaultdict(dict)
    for band in bands:
        for key, pos in positions.items():
            own = pos["resultClass"]
            by_uci = {m["uci"]: m for m in pos["moves"]}
            rows_ = [r for r in probes if r["key"] == key and r["band"] == band]
            if not rows_:
                continue
            usable = [
                (c["uci"], float(c["policyRaw"]))
                for c in rows_[0]["candidates"]
                if c["policyRaw"] is not None and c["uci"] in by_uci
            ]
            total = sum(p for _, p in usable)
            if total > 0:
                per_pos_mass[key][band] = (
                    sum(p for u, p in usable if by_uci[u]["moverClass"] != own) / total
                )
    if len(bands) >= 2:
        lo_band, hi_band = bands[0], bands[-1]
        pairs = [
            (v[lo_band], v[hi_band]) for v in per_pos_mass.values() if lo_band in v and hi_band in v
        ]
        down = sum(1 for a, b in pairs if b < a)
        up = sum(1 for a, b in pairs if b > a)
        strictly_monotone = 0
        for v in per_pos_mass.values():
            if len(v) == len(bands):
                seq = [v[b] for b in bands]
                if all(seq[i] > seq[i + 1] for i in range(len(seq) - 1)):
                    strictly_monotone += 1
        report["policyBandResponse"] = {
            "pairs": len(pairs),
            f"droppingMassLowerAt{hi_band}ThanAt{lo_band}": down,
            "higher": up,
            "signTestTwoSidedP": two_sided_sign_p(down, up),
            "strictlyDecreasingAcrossAllThreeBands": strictly_monotone,
            "meanAbsoluteChange": (
                sum(abs(b - a) for a, b in pairs) / len(pairs) if pairs else None
            ),
        }

    # ------------------------------------- O5: does the same error recur across bands
    recur = []
    for key, pos in positions.items():
        per_band = {}
        for band in bands:
            errs = [
                s["move"]["uci"]
                for s in scored
                if s["probe"]["key"] == key and s["probe"]["band"] == band and not s["preserved"]
            ]
            per_band[band] = Counter(errs)
        union = set().union(*[set(c) for c in per_band.values()]) if per_band else set()
        if union:
            recur.append(
                {
                    "key": key,
                    "pack": pos["packId"],
                    "dropping": pos["droppingCount"],
                    "perBand": {str(b): dict(c) for b, c in per_band.items()},
                    "sharedByAllBandsThatErred": sorted(
                        set.intersection(*[set(c) for c in per_band.values() if c])
                    )
                    if any(per_band.values())
                    else [],
                }
            )
    report["errorRecurrence"] = recur

    # ------------------------------------- agreement with the shipped perfect_tablebase
    agree = defaultdict(lambda: [0, 0])
    for s in scored:
        pos = s["pos"]
        own = pos["resultClass"]
        preserving = [m for m in pos["moves"] if m["moverClass"] == own]
        if not preserving:
            continue
        winning = "win" in pos["category"]
        losing = "loss" in pos["category"]
        keyed = sorted(
            preserving,
            key=lambda m: (
                (abs(m["dtz"] or 0) if winning else (-abs(m["dtz"] or 0) if losing else 0)),
                m["uci"],
            ),
        )
        agree[s["probe"]["band"]][1] += 1
        if s["move"]["uci"] == keyed[0]["uci"]:
            agree[s["probe"]["band"]][0] += 1
    report["agreementWithPerfectTablebasePick"] = {str(k): v for k, v in sorted(agree.items())}

    with open(out_path, "w") as handle:
        json.dump(report, handle, indent=1)
    print(json.dumps({k: v for k, v in report.items() if k not in ("errorRecurrence", "identity")}, indent=1)[:6000])


def expected_modal_share(k, n):
    """Expected max-count share of n uniform draws over k categories, by enumeration
    for small k and by simulation otherwise."""
    if k <= 1:
        return 1.0
    rng = random.Random(4242 + k * 100 + n)
    total = 0.0
    reps = 400
    for _ in range(reps):
        counts = Counter(rng.randrange(k) for _ in range(n))
        total += max(counts.values()) / n
    return total / reps


if __name__ == "__main__":
    main()
