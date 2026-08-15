# DISPOSABLE research harness — R4 (planning/campaign-research-queue.md).
# Agreement between the fixed-depth Stockfish concession classifier (rfc/resistance-spectrum
# §7b) and the exact tablebase classifier (§1c), on the positions where both exist.
import json, sys, collections, statistics

MATE = 100_000

WIN = {"win", "syzygy-win", "maybe-win"}
LOSS = {"loss", "syzygy-loss", "maybe-loss"}


def coarse50(cat):
    # Result honouring the fifty-move rule: cursed-win / blessed-loss are draws.
    if cat in WIN:
        return 1
    if cat in LOSS:
        return -1
    return 0


def coarse_dtm(cat):
    if cat in WIN or cat == "cursed-win":
        return 1
    if cat in LOSS or cat == "blessed-loss":
        return -1
    return 0


def score(entry):
    if entry["mate"] is not None:
        n = entry["mate"]
        return (MATE - 100 * abs(n)) * (1 if n > 0 else -1)
    return entry["cp"]


def kappa(tp, fp, fn, tn):
    n = tp + fp + fn + tn
    if n == 0:
        return float("nan")
    po = (tp + tn) / n
    pe = ((tp + fp) * (tp + fn) + (fn + tn) * (fp + tn)) / (n * n)
    if pe == 1:
        return float("nan")
    return (po - pe) / (1 - pe)


def load(path, key):
    out = collections.defaultdict(list)
    for line in open(path):
        line = line.strip()
        if not line:
            continue
        row = json.loads(line)
        if row.get("error"):
            continue
        out[row[key]].append(row)
    return out


def main():
    tb_path, sf_path = sys.argv[1], sys.argv[2]
    tb = {row["fen"]: row for rows in load(tb_path, "fen").values() for row in rows}
    sf_rows = [r for rows in load(sf_path, "fen").values() for r in rows]
    by_depth = collections.defaultdict(dict)
    for row in sf_rows:
        by_depth[row["depth"]][row["fen"]] = row

    report = {}
    for depth in sorted(by_depth):
        sf = by_depth[depth]
        shared = [f for f in sf if f in tb]
        multi = [f for f in shared if len(tb[f]["moves"]) >= 2]
        # move-coverage sanity
        mismatched = [
            f
            for f in multi
            if {m["uci"] for m in tb[f]["moves"]} != {e["uci"] for e in sf[f]["entries"]}
        ]
        depth_reached = [sf[f]["reachedDepth"] for f in multi]
        go_ms = [sf[f]["goMs"] for f in multi]

        refs = {
            "strict": lambda pos, mv: mv != pos,
            "coarse50": lambda pos, mv: coarse50(mv) != coarse50(pos),
            "coarseDtm": lambda pos, mv: coarse_dtm(mv) != coarse_dtm(pos),
        }
        classifiers = []
        for w in (25, 50, 100, 150, 200, 300, 500, 1000, 2000, 5000):
            classifiers.append((f"window{w}", ("window", w)))
        for t in (50, 100, 150, 200, 300, 500, 1000):
            classifiers.append((f"class{t}", ("class", t)))

        results = {}
        for ref_name, ref in refs.items():
            for clf_name, (kind, param) in classifiers:
                tp = fp = fn = tn = 0
                set_match = 0
                gate_safe = 0
                unsafe_admissions = 0
                gate_total_admitted = 0
                positions_counted = 0
                for f in multi:
                    if f in mismatched:
                        continue
                    positions_counted += 1
                    pos_cat = tb[f]["category"]
                    tb_conc = {
                        m["uci"]: ref(pos_cat, m["moverCategory"]) for m in tb[f]["moves"]
                    }
                    scores = {e["uci"]: score(e) for e in sf[f]["entries"]}
                    best = max(scores.values())
                    if kind == "window":
                        sf_conc = {u: (best - s) > param for u, s in scores.items()}
                    else:
                        cls = lambda s: 1 if s > param else (-1 if s < -param else 0)
                        sf_conc = {u: cls(s) != cls(best) for u, s in scores.items()}
                    for u in tb_conc:
                        a, b = tb_conc[u], sf_conc[u]
                        if a and b:
                            tp += 1
                        elif not a and b:
                            fp += 1
                        elif a and not b:
                            fn += 1
                        else:
                            tn += 1
                    if all(tb_conc[u] == sf_conc[u] for u in tb_conc):
                        set_match += 1
                    admitted = [u for u in tb_conc if not sf_conc[u]]
                    gate_total_admitted += len(admitted)
                    bad = [u for u in admitted if tb_conc[u]]
                    unsafe_admissions += len(bad)
                    if not bad:
                        gate_safe += 1
                n = tp + fp + fn + tn
                results[f"{ref_name}|{clf_name}"] = {
                    "positions": positions_counted,
                    "moves": n,
                    "accuracy": (tp + tn) / n if n else None,
                    "kappa": kappa(tp, fp, fn, tn),
                    "tbConcedeRate": (tp + fn) / n if n else None,
                    "sfConcedeRate": (tp + fp) / n if n else None,
                    "falsePositives": fp,
                    "falseNegatives": fn,
                    "precision": tp / (tp + fp) if tp + fp else None,
                    "recall": tp / (tp + fn) if tp + fn else None,
                    "setMatchRate": set_match / positions_counted if positions_counted else None,
                    "gateSafePositions": gate_safe / positions_counted if positions_counted else None,
                    "unsafeAdmissionRate": unsafe_admissions / gate_total_admitted
                    if gate_total_admitted
                    else None,
                }
        report[depth] = {
            "sharedPositions": len(shared),
            "positionsWith2PlusMoves": len(multi),
            "moveSetMismatches": len(mismatched),
            "meanGoMs": statistics.mean(go_ms) if go_ms else None,
            "medianGoMs": statistics.median(go_ms) if go_ms else None,
            "reachedRequestedDepth": sum(1 for d in depth_reached if d >= depth),
            "results": results,
        }

    json.dump(report, open(sys.argv[3], "w"), indent=1)

    for depth in sorted(report):
        r = report[depth]
        print(
            f"\n=== depth {depth}  positions={r['positionsWith2PlusMoves']} "
            f"mismatch={r['moveSetMismatches']} medianGo={r['medianGoMs']:.0f}ms ==="
        )
        for ref in ("strict", "coarse50", "coarseDtm"):
            def rank(k):
                value = r["results"][k]["kappa"]
                return value if value == value else -9

            best = max((k for k in r["results"] if k.startswith(ref + "|")), key=rank)
            v = r["results"][best]
            print(
                f"  {ref:9s} best-kappa {best.split('|')[1]:9s} "
                f"acc={v['accuracy']:.3f} kappa={v['kappa']:.3f} "
                f"tbRate={v['tbConcedeRate']:.3f} setMatch={v['setMatchRate']:.3f} "
                f"gateSafe={v['gateSafePositions']:.3f} unsafeAdmit={v['unsafeAdmissionRate']:.3f}"
            )


main()
