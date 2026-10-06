"""Disposable D3262 independent python-chess source/observation/quantifier replay.

Checks literal receipts and monotonic interval consistency, NOT an independent
wall clock, browser rendering, engine causality or production profile selection.
"""
import copy
import base64
import gzip
import hashlib
import json
import math
import re
import runpy
import sys
from pathlib import Path
import chess

HERE = Path(__file__).parent
helpers = runpy.run_path(str(HERE / "coherent-five-approach-check.py"))
observe, terminal = helpers["pv_observation"], helpers["terminal"]
preparation_result, root_result = helpers["preparation_result"], helpers["root_result"]


def require(value, message):
    if not value:
        raise AssertionError(message)


def compact(value):
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False).encode()


def digest(raw):
    return "sha256:" + hashlib.sha256(raw).hexdigest()


def board_at(root, history):
    board = chess.Board(root)
    for uci in history:
        require(terminal(board) is None, "continuation after terminal")
        move = chess.Move.from_uci(uci)
        require(move in board.legal_moves, "illegal independent history")
        board.push(move)
    return board


def provider(receipt):
    q, lines = receipt["operands"], receipt["lines"]
    require(q["provider"] == "stockfish" and lines[-1].startswith("bestmove "), "missing source delimiter")
    legal = sorted(m.uci() for m in chess.Board(q["fen"]).legal_moves)
    count = min(q["multiPv"], len(legal))
    parsed = {}
    for line in lines[:-1]:
        require(not line.startswith("bestmove "), "duplicate delimiter")
        score = re.search(r"\bscore (cp|mate) (-?\d+)\b", line)
        pv = re.search(r"\bpv ((?:[a-h][1-8][a-h][1-8][qrbn]?(?:\s+|$))+)", line)
        if not line.startswith("info ") or not score or not pv:
            continue
        depth = int(re.search(r"\bdepth (\d+)\b", line).group(1))
        rank_match = re.search(r"\bmultipv (\d+)\b", line)
        rank = int(rank_match.group(1)) if rank_match else 1
        require(0 < rank <= count and depth > 0, "invalid rank/depth")
        path = pv.group(1).split()
        board_at(q["fen"], path)
        parsed.setdefault(depth, {})[rank] = dict(moveUci=path[0], rank=rank, depth=depth,
            score=dict(kind=score.group(1), value=int(score.group(2)), bound=bool(re.search(r"\b(?:lowerbound|upperbound)\b", line))),
            pv=path, rawPv=path)
    table = None
    for depth in sorted(parsed, reverse=True):
        entries = [parsed[depth].get(rank) for rank in range(1, count + 1)]
        if all(entries) and len({x["moveUci"] for x in entries}) == count:
            table = entries
            break
    require(table is not None and not any(x["score"]["bound"] for x in table), "incomplete/bound coherent table")
    if q["budget"].startswith("depth"):
        require(depth == int(q["budget"][5:]), "budget downgrade")
    best = lines[-1].split()[1]
    require(best in legal, "illegal bestmove")
    expected = dict(legal=legal, entries=table, coherentDepth=depth,
        trailingPartialDepth=max(parsed) if max(parsed) > depth else None, bestmove=best,
        scorePerspective="side_to_move", authority="provider_search_not_engine_causality")
    require(expected == receipt["result"], "source differs from literal independent table")


def verify_record(record, roots, definitions, cells, source_digest):
    row, raw = record["row"], record["raw"]
    require(digest(compact(raw)) == row["rawCaptureDigest"], "raw digest changed")
    require(len(compact(raw)) == row["retainedBytes"], "retained bytes changed")
    require(raw["cell"] == {k: row[k] for k in ["rootId", "candidateUci", "setting", "horizon", "regime"]}, "crossed case")
    elapsed = raw["clock"]["ended"] - raw["clock"]["started"]
    require(elapsed == row["timing"]["elapsedMs"] and math.isfinite(elapsed) and elapsed >= 0, "crossed clock")
    require(all(math.isfinite(x) and 0 <= x <= elapsed for x in row["timing"].values()), "invalid phase interval")
    result = raw["result"]
    root = roots[row["rootId"]]["fen"]
    require(result["rootFen"] == root and result["kind"] == row["kind"] and result["horizon"] == row["horizon"], "crossed result")
    candidate = board_at(root, [row["candidateUci"]])
    expected_preps = [] if terminal(candidate) is not None else sorted(m.uci() for m in candidate.legal_moves)
    require(result["legalPreparationUcis"] == expected_preps and result["terminalReason"] == terminal(candidate), "changed exact preparation denominator")
    require(len(raw["dependencies"]) == len(row["providerQueries"]), "missing raw source")
    for source, ledger in zip(raw["dependencies"], row["providerQueries"]):
        require(source["operands"] == ledger["operands"] and source["state"] == ledger["state"], "crossed source ledger")
        require(source["operands"]["sourceDigest"] == source_digest, "crossed source binary/config")
        receipt = source["receipt"]
        if receipt is not None:
            require(source["operands"] == receipt["operands"] and digest(compact(receipt)) == ledger["receiptDigest"], "changed receipt")
            provider(receipt)
            require(receipt["started"] <= receipt["ended"], "crossed source clock")
            if source["state"] == "executed":
                require(raw["clock"]["started"] <= receipt["started"] <= receipt["ended"] <= raw["clock"]["ended"], "source outside operation")
        else:
            require(ledger["receiptDigest"] is None and ledger["state"] not in ["executed", "cached"], "unobserved admitted source")
        if row["regime"] == "provider_offline":
            require(ledger["state"] == "unavailable" and receipt is None, "offline borrowed/executed provider")
    target_ids = cells[(row["rootId"], row["candidateUci"])]
    require([x["targetId"] for x in result["projections"]] == target_ids, "lost target projection")
    for item in result["observations"]:
        require(item["targetId"] in target_ids and 1 <= len(item["history"]) <= row["horizon"], "foreign target/horizon")
        history, expected = observe(root, row["candidateUci"], item["history"], definitions[item["targetId"]])
        require(history == item["history"] and expected == item["observation"], "observation differs from independent target replay")
    for projection in result["projections"]:
        tid = projection["targetId"]
        _, immediate = observe(root, row["candidateUci"], [row["candidateUci"]], definitions[tid])
        require(projection["immediate"] == immediate["immediate"], "crossed immediate")
        observations = [x for x in result["observations"] if x["targetId"] == tid]
        selected = [uci for uci in expected_preps if any(x["history"][1] == uci for x in observations if len(x["history"]) >= 2)]
        require([p["preparationUci"] for p in projection["preparations"]] == selected, "invented/omitted preparation projection")
        for prep in projection["preparations"]:
            board = board_at(root, [row["candidateUci"], prep["preparationUci"]])
            eligible = [x for x in observations if len(x["history"]) >= 3 and x["history"][1] == prep["preparationUci"]
                        and (row["setting"].startswith("pv:") or len(x["history"]) == 3)]
            projected = []
            for item in eligible:
                history = item["history"][:3]
                leaves = [x for x in observations if len(x["history"]) == 4 and x["history"][:3] == history
                          and x["observation"]["executedAtFourthPly"]]
                projected.append(dict(learnerUci=history[2], pathId=digest(compact([row["rootId"], *history])),
                    opportunity=item["observation"]["opportunityAtThirdPly"],
                    executedLeaves=[digest(compact([row["rootId"], *leaf["history"]])) for leaf in leaves]))
            require(prep["observed"] == projected, "projection detached from independently replayed observation")
            expected = preparation_result(sorted(m.uci() for m in board.legal_moves), terminal(board), prep["observed"])
            require(all(prep[k] == v for k, v in expected.items()), "changed preparation quantifier")
        quantifier = root_result(immediate["immediate"], expected_preps, projection["preparations"])
        require(projection["rawQuantifier"] == quantifier, "changed root quantifier")
        licensed = "withheld_provider_line_ceiling" if row["setting"].startswith("pv:") and quantifier["availability"] in [
            "exists_preparation_surviving_all_defences", "every_preparation_refuted_at_bound"] else quantifier["availability"]
        require(projection["licensedAvailability"] == licensed, "provider ceiling laundering")
        require(projection["opportunityObserved"] == any(x["observation"]["opportunityAtThirdPly"] for x in observations)
                and projection["executionObserved"] == any(x["observation"]["executedAtFourthPly"] for x in observations), "invented observation aggregate")
    if row["setting"].startswith("pv:") and result["providerPv"] is not None:
        source = next(x["receipt"] for x in raw["dependencies"] if x["receipt"] is not None)
        entry = next(x for x in source["result"]["entries"] if x["moveUci"] == row["candidateUci"])
        require(result["providerPv"] == entry, "PV detached from literal provider entry")
        require(len(result["observations"]) == len(target_ids)
                and all(x["history"] == entry["pv"][:row["horizon"]] for x in result["observations"]), "wrong source-selected PV population")
    return len(result["observations"])


def main():
    out = Path(sys.argv[1])
    pack = json.loads(gzip.decompress(out.read_bytes())) if out.is_file() else None
    metadata = pack["metadata"] if pack is not None else json.loads((out / "metadata.json").read_bytes())
    if pack is not None:
        require(pack["version"] == 1 and pack["authority"] == "lossless_partial_cost_capture_not_full_profile", "foreign package")
        for name, expected in metadata["instrumentDigests"].items():
            require(digest(base64.b64decode(pack["sourceSnapshot"][name])) == expected, "changed retained instrument source")
    directory = Path("planning/semantic-consequence-search")
    plan_bytes = (directory / "d3262-cost-plan-v1.json").read_bytes()
    require(digest(plan_bytes) == metadata["planDigest"] == "sha256:fd3a33df05e2bc46208c998318c3b5dd83465277cc265aed2188d8de4b734972", "crossed plan")
    plan = json.loads(plan_bytes)
    expected_cases = [dict(rootId=c["rootId"], candidateUci=c["candidateUci"], setting=s["id"], horizon=h, regime=r)
                      for s in plan["settings"] for c in plan["candidates"] for h in plan["horizons"] for r in plan["regimes"]]
    require(metadata["cases"] == expected_cases[metadata["start"]:metadata["start"] + metadata["limit"]], "filtered full-plan batch")
    inputs = {}
    for name, expected in metadata["inputs"].items():
        require(expected == "sha256:" + helpers["SOURCES"][name], "unregistered input pin")
        raw = (directory / name).read_bytes()
        require(digest(raw) == expected, "crossed frozen input")
        inputs[name] = json.loads(raw)
    roots = {r["rootId"]: r for r in inputs["d3262-coherent-root-frame.json"]["roots"]}
    frame = inputs["d3262-coherent-target-comparison-frame.json"]
    definitions = {d["id"]: d for d in frame["definitions"]}
    cells = {(r["rootId"], c["moveUci"]): [] for r in roots.values() for c in r["candidates"]}
    for c in frame["comparisons"]:
        cells[(c["rootId"], c["candidateUci"])].append(c["targetId"])
    records, observations = [], 0
    raw_groups = [base64.b64decode(x["base64"]) for x in pack["groups"]] if pack is not None else [p.read_bytes() for p in sorted(out.glob("triplet-*.json.gz"))]
    if pack is not None:
        require([dict(name=x["name"], digest=digest(raw)) for x, raw in zip(pack["groups"], raw_groups)] == pack["summary"]["groups"], "changed literal triplet package")
    for raw_group in raw_groups:
        group = json.loads(gzip.decompress(raw_group))
        require(len(group) == 3 and [x["row"]["regime"] for x in group] == ["cold", "warm", "provider_offline"], "lost regime triplet")
        for record in group:
            observations += verify_record(record, roots, definitions, cells, metadata["provider"]["sourceDigest"])
        cold_receipts = {compact(q["operands"]): q["receiptDigest"] for q in group[0]["row"]["providerQueries"] if q["state"] == "executed"}
        for q in group[1]["row"]["providerQueries"]:
            if q["state"] == "cached":
                require(cold_receipts.get(compact(q["operands"])) == q["receiptDigest"], "unpaired warm receipt")
        records.extend(group)
    require([x["raw"]["cell"] for x in records] == metadata["cases"], "filtered/reordered declared batch")
    if "--negative-controls" in sys.argv:
        positive = next(r for r in records if r["raw"]["dependencies"] and r["raw"]["dependencies"][0]["receipt"] is not None)
        for field, value in [("retainedBytes", -1), ("rawCaptureDigest", "sha256:wrong"), ("kind", "honest_empty")]:
            changed = copy.deepcopy(positive); changed["row"][field] = value
            try:
                verify_record(changed, roots, definitions, cells, metadata["provider"]["sourceDigest"])
            except AssertionError:
                continue
            raise AssertionError("negative control admitted: " + field)
        def reseal(record):
            record["row"]["rawCaptureDigest"] = digest(compact(record["raw"]))
            record["row"]["retainedBytes"] = len(compact(record["raw"]))
        corruptions = []
        changed = copy.deepcopy(positive)
        changed["raw"]["result"]["projections"][0]["rawQuantifier"]["availability"] = "exists_preparation_surviving_all_defences"
        corruptions.append(changed)
        changed = copy.deepcopy(positive)
        changed["raw"]["result"]["observations"][0]["history"] = [changed["row"]["candidateUci"], "a1a8"]
        corruptions.append(changed)
        changed = copy.deepcopy(positive)
        changed["raw"]["dependencies"][0]["receipt"]["result"]["entries"][0]["score"]["value"] += 1
        changed["row"]["providerQueries"][0]["receiptDigest"] = digest(compact(changed["raw"]["dependencies"][0]["receipt"]))
        corruptions.append(changed)
        for changed in corruptions:
            reseal(changed)
            try:
                verify_record(changed, roots, definitions, cells, metadata["provider"]["sourceDigest"])
            except AssertionError:
                continue
            raise AssertionError("resealed semantic negative control admitted")
    print(json.dumps(dict(rows=len(records), observations=observations,
        validation="independent_python_chess_receipt_replay", clock="interval_consistency_not_independent_wall_clock",
        interactiveGate="not_measured", productionProfileSelected=False)))


if __name__ == "__main__":
    main()
