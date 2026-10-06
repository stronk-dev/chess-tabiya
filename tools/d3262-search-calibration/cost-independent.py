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
recursive = runpy.run_path(str(HERE / "coherent-recursive-semantic-check.py"))
policy = runpy.run_path(str(HERE / "coherent-horizon-policy-check.py"))
model_checker = None
model_engine = None
checked_model_receipts = set()


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
    if q["provider"] == "maia":
        require(model_checker is not None and model_engine is not None, "Unregistered model source")
        model_checker["check_receipt"](receipt, model_engine)
        return
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


def verify_model_population(row, raw, root, target_ids):
    if not row["setting"].startswith("maia:"):
        return
    require(row["setting"] in ["maia:prefix0.80", "maia:prefix0.90"], "Undeclared model profile")
    result, threshold = raw["result"], float(row["setting"].split("prefix")[1])
    layers = 1 if row["horizon"] == 2 else 3
    frontier = result["modelFrontier"]
    source_by_path = {}
    for source in raw["dependencies"]:
        q = source["operands"]
        require(q["provider"] == "maia" and q["rootFen"] == root and q["historyUci"][0] == row["candidateUci"], "Crossed model root/path")
        key = tuple(q["historyUci"])
        require(key not in source_by_path, "Repeated literal model query")
        source_by_path[key] = source
    if not target_ids:
        require(frontier == dict(nodes=[], edges=[], coverage=dict(status="not_requested_no_target"))
                and not source_by_path and not result["observations"], "No-target invented policy")
        return
    rule_name = "per_node_prefix_includes_overshoot_max8_not_joint_threshold_selector"
    if result["terminalReason"] is not None:
        expected = dict(nodes=[], edges=[], coverage=dict(complete=True, observedLayerMasses=[1]*layers,
            frontierMass=1, observedFrontierMass=1, stopRule=policy["stop"](threshold, 1, False, layers),
            policyMeaning="absorbing_candidate_no_further_model_decision", selectionRule=rule_name))
        require(frontier == expected and not source_by_path and not result["observations"], "Lost absorbing candidate mass")
        return
    nodes, edges, used_sources = [], [], []
    visited, exhausted, complete = 0, False, True
    def walk(history, parent_mass):
        nonlocal visited, exhausted, complete
        key = tuple(history)
        require(key in source_by_path, "Missing actual scheduled model query")
        source = source_by_path[key]
        used_sources.append(key)
        board = board_at(root, history)
        require(terminal(board) is None, "Model queried absorbing path")
        legal = sorted(m.uci() for m in board.legal_moves)
        node = dict(history=history, fen=board.fen(en_passant="legal"), parentJointMass=parent_mass,
                    legalUcis=legal, state=source["state"])
        if source["receipt"] is None:
            complete = False
            node.update(selected=None, coveredConditionalMass=None, residualConditionalMass=None,
                        omittedWithinSupport=None, legalOutsideSupport=None)
            nodes.append(node)
            return
        support = source["receipt"]["result"]["configuredSupport"]
        selected, mass = [], 0
        for item in support[:8]:
            if mass >= threshold:
                break
            selected.append(item)
            mass += item["mass"]
        node.update(selected=selected, coveredConditionalMass=mass, residualConditionalMass=max(0, 1-mass),
                    omittedWithinSupport=[x["legalUci"] for x in support if x not in selected],
                    legalOutsideSupport=[x for x in legal if x not in [s["legalUci"] for s in support]])
        nodes.append(node)
        for item in selected:
            visited += 1
            if visited > result["nodeCap"]:
                complete, exhausted = False, True
                break
            next_history = history + [item["legalUci"]]
            next_board = board_at(root, next_history)
            reason = terminal(next_board)
            joint = parent_mass * item["mass"]
            edges.append(dict(history=next_history, conditionalMass=item["mass"], jointMass=joint, terminalReason=reason))
            if len(next_history) < row["horizon"] and reason is None:
                walk(next_history, joint)
            if exhausted:
                break
    walk([row["candidateUci"]], 1)
    require(used_sources == list(source_by_path), "Unused/reordered model query")
    require(frontier["nodes"] == nodes and frontier["edges"] == edges, "Changed complete policy frontier, omissions or conditional products")
    require(result["visited"] == visited, "False model node budget count")
    # The declared JS frontier is an ordered left fold. Python 3.12+'s
    # compensated sum() is a different operation (one-ULP disagreements are
    # observable); preserve the declared arithmetic without loosening admission.
    masses = []
    for layer in range(layers):
        mass = 0.0
        for edge in edges:
            if len(edge["history"]) == layer+2 or len(edge["history"]) < layer+2 and edge["terminalReason"] is not None:
                mass += edge["jointMass"]
        masses.append(mass)
    stop = policy["stop"](threshold, masses[-1], False, layers) if complete else dict(status="partial_traversal_abstain",
        requiredJointMass=threshold, coveredJointMass=None, residualMass=None, authority="missing_source_or_budget_not_known_zero_coverage")
    expected = dict(complete=complete, observedLayerMasses=masses, frontierMass=masses[-1] if complete else None,
        observedFrontierMass=masses[-1], stopRule=stop,
        policyMeaning="both_sides_configured_model_not_human_frequency_or_arbitrary_learner", selectionRule=rule_name)
    require(frontier["coverage"] == expected, "False joint coverage, absorption, residual or stop status: "
            + json.dumps(dict(case=raw["cell"], actual=frontier["coverage"], expected=expected)))
    require([(x["targetId"], x["history"]) for x in result["observations"]]
            == [(tid, edge["history"]) for edge in edges for tid in target_ids], "Missing source-selected model observations")


def first_events(root, candidate, definition):
    board = chess.Board(root)
    target = definition["target"]
    actor = target["attacker"] if definition["family"] == "material" else target["minor"]
    other = target["target"] if definition["family"] == "material" else target["controllingPawn"]
    if definition["family"] == "destination" and not recursive["present"](board, other):
        origins = {s["candidateUci"][:2] for s in definition["sources"] if s["candidateUci"][2:4] == other["square"]}
        require(len(origins) == 1, "ambiguous declared first-layer pawn")
        other = dict(other, square=next(iter(origins)))
    require(recursive["present"](board, actor) and recursive["present"](board, other), "absent first-layer root operand")
    move = chess.Move.from_uci(candidate)
    actor, other = recursive["advance"](board, move, actor), recursive["advance"](board, move, other)
    board.push(move)
    events = []
    if actor is not None and other is not None:
        for move in sorted(board.legal_moves, key=lambda m: m.uci()):
            event = move.from_square == chess.parse_square(actor["square"]) and (
                helpers["v2"]["captured_square"](board, move) == chess.parse_square(other["square"]) if definition["family"] == "material"
                else move.to_square == chess.parse_square(target["square"]))
            if event:
                events.append(dict(uci=move.uci(), kind="named_attacker_captures_target" if definition["family"] == "material" else "named_minor_arrives_on_square"))
    return dict(rootId=definition["rootId"], targetId=definition["id"], candidateUci=candidate, family=definition["family"],
        status="operand_absent" if actor is None or other is None else "event_available" if events else "no_legal_event",
        legalReplies=len(list(board.legal_moves)), eventReplies=events)


def verify_semantic_population(row, raw, root, definitions, target_ids):
    result = raw["result"]
    if not row["setting"].startswith(("semantic:", "recursive:")):
        return
    require(result["schedulingAuthority"] == "source_blind_named_geometry_not_profit_or_proof", "changed scheduling authority")
    family, budget, width_text, event_width = row["setting"].split(":")
    width = int(width_text[3:])
    sources = {(s["operands"]["fen"], s["operands"]["multiPv"]): s["receipt"]["result"]
               for s in raw["dependencies"] if s["receipt"] is not None}
    require(all(s["operands"]["budget"] == budget for s in raw["dependencies"]), "crossed semantic budget")
    selections = result["selections"]
    selected = {}
    for item in selections:
        tid, history = item["targetId"], item["history"]
        require(tid in target_ids and history[0] == row["candidateUci"], "foreign semantic target/path")
        key = (tid, tuple(history))
        require(key not in selected, "duplicate semantic decision")
        selected[key] = item
        board = board_at(root, history)
        legal = sorted(m.uci() for m in board.legal_moves)
        fen = board.fen(en_passant="legal")
        top = sources[(fen, 8)]
        ranked = [x["moveUci"] for x in top["entries"]]
        if len(history) == 1:
            events = first_events(root, history[0], definitions[tid])
            source = sources[(fen, len(legal))] if event_width == "all_legal" else top
            event_ranked = [x["moveUci"] for x in source["entries"]]
            event_ucis = [x["uci"] for x in events["eventReplies"]]
            chosen = next((uci for uci in event_ranked if uci in event_ucis), None)
            baseline = ranked[:width]
            expected = dict(baseline=baseline, reservedUci=chosen, reservedRank=event_ranked.index(chosen) + 1 if chosen else None,
                selected=baseline if chosen is None or chosen in baseline else baseline[:-1] + [chosen],
                eventOrderAuthority="declared_first_reply_source_width_not_profit_or_proof",
                status="event_outside_source_width" if chosen is None and event_ucis else "no_legal_event" if chosen is None
                    else "event_already_in_baseline" if chosen in baseline else "event_reserved_outside_baseline")
        else:
            require(family == "recursive" and len(history) in [2, 3], "shallow reserve masquerades as recursive")
            events = recursive["event_node"](root, history, definitions[tid])
            expected = recursive["reserve"](legal, ranked, [x["uci"] for x in events["events"]], width)
        require(item["events"] == events and all(item[k] == v for k, v in expected.items()), "changed geometry/rank/one-slot selection")
    # Failures/exhaustion stay partial; an available traversal must retain EVERY
    # actually source-selected edge, not merely legal examples from that frontier.
    if row["kind"] != "available":
        return
    expected_paths, expected_selections = [], set()
    def choice(tid, history):
        key = (tid, tuple(history))
        if len(history) == 1 or family == "recursive":
            require(key in selected, "missing source-selected semantic decision")
            expected_selections.add(key)
            return selected[key]["selected"]
        board = board_at(root, history)
        return [x["moveUci"] for x in sources[(board.fen(en_passant="legal"), 8)]["entries"][:width]]
    for tid in target_ids:
        history = [row["candidateUci"]]
        first = choice(tid, history)
        for preparation in result["legalPreparationUcis"]:
            if preparation not in first:
                continue
            second = history + [preparation]
            expected_paths.append((tid, second))
            if row["horizon"] == 2 or terminal(board_at(root, second)) is not None:
                continue
            for defence in choice(tid, second):
                third = second + [defence]
                expected_paths.append((tid, third))
                if terminal(board_at(root, third)) is not None:
                    continue
                for leaf in choice(tid, third):
                    expected_paths.append((tid, third + [leaf]))
    require(expected_selections == set(selected), "foreign/unvisited semantic decision")
    require([(x["targetId"], x["history"]) for x in result["observations"]] == expected_paths, "incomplete source-selected semantic population")


def verify_record(record, roots, definitions, cells, source_digest):
    row, raw = record["row"], record["raw"]
    model = row["setting"].startswith("maia:")
    if model:
        require(isinstance(record.get("rawLiteral"), str) and json.loads(record["rawLiteral"]) == raw, "Missing/crossed original float hash input")
        require(len(record.get("receiptLiterals", [])) == len(raw["dependencies"]), "Missing original source hash inputs")
    literal = record["rawLiteral"].encode() if model else compact(raw)
    require(digest(literal) == row["rawCaptureDigest"], "raw digest changed")
    require(len(literal) == row["retainedBytes"], "retained bytes changed")
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
    for index, (source, ledger) in enumerate(zip(raw["dependencies"], row["providerQueries"])):
        require(source["operands"] == ledger["operands"] and source["state"] == ledger["state"], "crossed source ledger")
        require(source["operands"]["sourceDigest"] == source_digest, "crossed source binary/config")
        receipt = source["receipt"]
        if receipt is not None:
            receipt_literal = record["receiptLiterals"][index] if model else None
            if model:
                require(isinstance(receipt_literal, str) and json.loads(receipt_literal) == receipt, "Crossed literal model receipt")
            require(source["operands"] == receipt["operands"] and digest(receipt_literal.encode() if model else compact(receipt)) == ledger["receiptDigest"], "changed receipt")
            if not model or ledger["receiptDigest"] not in checked_model_receipts:
                provider(receipt)
                if model:
                    checked_model_receipts.add(ledger["receiptDigest"])
            require(receipt["started"] <= receipt["ended"], "crossed source clock")
            if source["state"] == "executed":
                require(raw["clock"]["started"] <= receipt["started"] <= receipt["ended"] <= raw["clock"]["ended"], "source outside operation")
        else:
            require(ledger["receiptDigest"] is None and ledger["state"] not in ["executed", "cached"], "unobserved admitted source")
            if model:
                require(record["receiptLiterals"][index] is None, "Absent model carried literal receipt")
        if row["regime"] == "provider_offline":
            require(ledger["state"] == "unavailable" and receipt is None, "offline borrowed/executed provider")
    target_ids = cells[(row["rootId"], row["candidateUci"])]
    failure = next((x for x in row["providerQueries"] if x["state"] not in ["executed", "cached"]), None)
    kind = "no_target" if not target_ids else "absorbing_terminal" if terminal(candidate) is not None else (
        dict(unavailable="source_unavailable", invalid="invalid_source", timed_out="budget_exhausted")[failure["state"]] if failure else
        "budget_exhausted" if result["visited"] > result["nodeCap"] else "available")
    require(row["kind"] == kind, "Available/empty laundering of failed source or budget")
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
    verify_semantic_population(row, raw, root, definitions, target_ids)
    verify_model_population(row, raw, root, target_ids)
    return len(result["observations"])


def main():
    global model_checker, model_engine
    out = Path(sys.argv[1])
    pack = json.loads(gzip.decompress(out.read_bytes())) if out.is_file() else None
    metadata = pack["metadata"] if pack is not None else json.loads((out / "metadata.json").read_bytes())
    if metadata["provider"].get("imageId"):
        model_checker = runpy.run_path(str(HERE / "cost-maia-check.py"))
        ready = metadata["provider"]["ready"]
        require(json.loads(metadata["provider"]["readyLiteral"]) == ready
                and all(ready[k] == v for k, v in model_checker["PINS"].items()), "Unpinned model readiness")
        cfg = model_checker["pinned_cfg"]()
        require(digest(Path(cfg.checkpoint_path).read_bytes()) == ready["modelCheckpointSha256"]
                and digest(Path(sys.modules["maia3.uci"].__file__).read_bytes()) == ready["uciSourceSha256"], "Independent model/runtime drift")
        require(ready["workerDigest"] == metadata["instrumentDigests"]["cost-maia-worker.py"]
                and ready["runtimeDigest"] == metadata["instrumentDigests"]["maia_capture_runtime.py"], "Crossed model instrument source")
        require(ready["device"] == "cpu" and ready["threads"] == 1 and ready["useUciHistory"] is True
                and ready["torchVersion"] == model_checker["torch"].__version__, "Crossed configured sampler runtime")
        require(metadata["provider"]["sourceDigest"] == digest(compact(dict(imageId=metadata["provider"]["imageId"], ready=ready,
            selfElo=1400, opponentElo=1400, temperature=0.8, topP=0.92, preRootHistory="unavailable_not_invented"))), "Crossed model composite identity")
        model_engine = model_checker["Maia3UCIEngine"](cfg)
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
    corruption_count = 0
    if "--negative-controls" in sys.argv:
        positive = next(r for r in records if r["raw"]["dependencies"] and r["raw"]["dependencies"][0]["receipt"] is not None)
        for field, value in [("retainedBytes", -1), ("rawCaptureDigest", "sha256:wrong"), ("kind", "honest_empty")]:
            changed = copy.deepcopy(positive); changed["row"][field] = value
            try:
                verify_record(changed, roots, definitions, cells, metadata["provider"]["sourceDigest"])
            except AssertionError:
                corruption_count += 1
                continue
            raise AssertionError("negative control admitted: " + field)
        def reseal(record):
            literal = compact(record["raw"])
            if record["row"]["setting"].startswith("maia:"):
                record["rawLiteral"] = literal.decode()
                record["receiptLiterals"] = [compact(x["receipt"]).decode() if x["receipt"] is not None else None for x in record["raw"]["dependencies"]]
                for source, ledger in zip(record["raw"]["dependencies"], record["row"]["providerQueries"]):
                    if source["receipt"] is not None:
                        ledger["receiptDigest"] = digest(compact(source["receipt"]))
                literal = compact(record["raw"])
                record["rawLiteral"] = literal.decode()
            record["row"]["rawCaptureDigest"] = digest(literal)
            record["row"]["retainedBytes"] = len(literal)
        corruptions = []
        changed = copy.deepcopy(positive)
        changed["raw"]["result"]["projections"][0]["rawQuantifier"]["availability"] = "exists_preparation_surviving_all_defences"
        corruptions.append(changed)
        changed = copy.deepcopy(positive)
        changed["raw"]["result"]["observations"][0]["history"] = [changed["row"]["candidateUci"], "a1a8"]
        corruptions.append(changed)
        changed = copy.deepcopy(positive)
        result = changed["raw"]["dependencies"][0]["receipt"]["result"]
        if changed["row"]["setting"].startswith("maia:"):
            result["rawFullLegal"][0]["mass"] += 0.01
        else:
            result["entries"][0]["score"]["value"] += 1
        changed["row"]["providerQueries"][0]["receiptDigest"] = digest(compact(changed["raw"]["dependencies"][0]["receipt"]))
        corruptions.append(changed)
        for changed in corruptions:
            reseal(changed)
            try:
                verify_record(changed, roots, definitions, cells, metadata["provider"]["sourceDigest"])
            except AssertionError:
                corruption_count += 1
                continue
            raise AssertionError("resealed semantic negative control admitted")
        if positive["raw"]["result"].get("selections"):
            for mode in ["false_selection", "false_event_geometry", "lost_decision", "lost_observation"]:
                changed = copy.deepcopy(positive)
                if mode == "false_selection":
                    changed["raw"]["result"]["selections"][0]["selected"][0] = "a1a8"
                elif mode == "false_event_geometry":
                    changed["raw"]["result"]["selections"][0]["events"]["status"] = "forged_event"
                elif mode == "lost_decision":
                    changed["raw"]["result"]["selections"].pop()
                else:
                    changed["raw"]["result"]["observations"].pop()
                reseal(changed)
                try:
                    verify_record(changed, roots, definitions, cells, metadata["provider"]["sourceDigest"])
                except AssertionError:
                    corruption_count += 1
                    continue
                raise AssertionError("semantic frontier corruption admitted: " + mode)
        if positive["raw"]["result"].get("modelFrontier"):
            # Exercise products and layer omissions on an actual multi-layer
            # positive, not only on the first (two-ply) record in a batch.
            positive = next((r for r in records if r["row"]["horizon"] == 4
                             and r["row"]["kind"] == "available"
                             and len(r["raw"]["result"]["modelFrontier"]["nodes"]) > 1), positive)
            for mode in ["false_prefix", "false_product", "false_joint_mass", "missing_node", "missing_observation", "false_coverage_complete", "false_source_history"]:
                changed = copy.deepcopy(positive)
                frontier = changed["raw"]["result"]["modelFrontier"]
                if mode == "false_prefix": frontier["nodes"][0]["selected"].pop()
                elif mode == "false_product": frontier["edges"][0]["jointMass"] += 0.1
                elif mode == "false_joint_mass": frontier["coverage"]["frontierMass"] += 0.1
                elif mode == "missing_node": frontier["nodes"].pop()
                elif mode == "missing_observation": changed["raw"]["result"]["observations"].pop()
                elif mode == "false_coverage_complete": frontier["coverage"]["stopRule"]["status"] = "joint_rule_satisfied" if frontier["coverage"]["stopRule"]["status"] != "joint_rule_satisfied" else "numerical_boundary_abstain"
                else:
                    receipt = changed["raw"]["dependencies"][0]["receipt"]
                    receipt["operands"]["historyUci"] = []
                    response = json.loads(receipt["lines"][0]); response["payload"]["operands"]["historyUci"] = []
                    receipt["lines"] = [compact(response).decode()]
                    receipt["result"]["operands"]["historyUci"] = []
                reseal(changed)
                try:
                    verify_record(changed, roots, definitions, cells, metadata["provider"]["sourceDigest"])
                except AssertionError:
                    corruption_count += 1
                    continue
                raise AssertionError("model frontier corruption admitted: " + mode)
    print(json.dumps(dict(rows=len(records), observations=observations,
        rejectedCorruptions=corruption_count,
        validation="independent_python_chess_receipt_replay", clock="interval_consistency_not_independent_wall_clock",
        interactiveGate="not_measured", productionProfileSelected=False)))


if __name__ == "__main__":
    main()
