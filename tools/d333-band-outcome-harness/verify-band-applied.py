#!/usr/bin/env python3
"""DISPOSABLE research harness — D333. Not production code.

BAND-APPLICATION AUDIT, run against the recorded games themselves.

The single most likely way this measurement is silently wrong is D58/D91: an
Elo-less request inherits the previous request's band, and `SelfElo`/`OppoElo`
overwrite `Elo` if sent after it. Reading the source and the command array proves
the harness *intends* to apply the band. This proves the band *arrived*, from the
run's own output and nothing else.

Test: for every book position, the first ply is played by A in even-gameIndex
games and by B in odd-gameIndex games (play-games.ts schedule invariant). If the
two arms carry different bands and the band reaches the model, the two first-move
distributions from the SAME FEN are drawn from different populations. If the band
never arrived, they are one population and the test must not fire.

Reported as a pooled chi-square over bookIds (Monte-Carlo permutation p-value, so
no asymptotic assumption on sparse tables) plus the mean total-variation distance.
The same-band arms are the negative controls: they must NOT fire.
"""

import json
import random
import sys
from collections import Counter, defaultdict


def first_moves(path):
    """bookId -> (Counter of A's first move, Counter of B's first move)."""
    by_book = defaultdict(lambda: (Counter(), Counter()))
    for line in open(path):
        rec = json.loads(line)
        if rec["result"] == "void" or not rec["movesUci"]:
            continue
        mv = rec["movesUci"].split(" ")[0]
        side = 0 if rec["gameIndex"] % 2 == 0 else 1
        by_book[rec["bookId"]][side][mv] += 1
    return by_book


def chi2(a, b):
    keys = sorted(set(a) | set(b))
    na, nb = sum(a.values()), sum(b.values())
    if na == 0 or nb == 0 or len(keys) < 2:
        return 0.0, 0
    stat = 0.0
    n = na + nb
    for k in keys:
        row = a[k] + b[k]
        for obs, col in ((a[k], na), (b[k], nb)):
            exp = row * col / n
            if exp > 0:
                stat += (obs - exp) ** 2 / exp
    return stat, len(keys) - 1


def tvd(a, b):
    keys = set(a) | set(b)
    na, nb = sum(a.values()), sum(b.values())
    if na == 0 or nb == 0:
        return None
    return 0.5 * sum(abs(a[k] / na - b[k] / nb) for k in keys)


def permuted_stat(a, b, rng):
    pool = list(a.elements()) + list(b.elements())
    rng.shuffle(pool)
    na = sum(a.values())
    return chi2(Counter(pool[:na]), Counter(pool[na:]))[0]


def analyse(path, label, iters=2000):
    by_book = first_moves(path)
    rng = random.Random(20260816)
    observed = 0.0
    tvds = []
    books = 0
    for a, b in by_book.values():
        s, df = chi2(a, b)
        if df == 0:
            continue
        observed += s
        books += 1
        t = tvd(a, b)
        if t is not None:
            tvds.append(t)
    # Permutation null: reshuffle the two first-move samples within each book.
    ge = 0
    for _ in range(iters):
        total = 0.0
        for a, b in by_book.values():
            if chi2(a, b)[1] == 0:
                continue
            total += permuted_stat(a, b, rng)
        if total >= observed:
            ge += 1
    return {
        "arm": label,
        "booksTested": books,
        "pooledChi2": round(observed, 2),
        "permutationP": (ge + 1) / (iters + 1),
        "meanTVD": round(sum(tvds) / len(tvds), 4) if tvds else None,
        "maxTVD": round(max(tvds), 4) if tvds else None,
    }


if __name__ == "__main__":
    out = []
    for path in sys.argv[1:]:
        label = path.rsplit("/", 1)[-1].replace(".jsonl", "")
        out.append(analyse(path, label))
        print(json.dumps(out[-1]), flush=True)
    print(json.dumps({"bandApplicationAudit": out}, indent=1))
