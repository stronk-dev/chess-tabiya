"""D3489 independent geometry/identity/rank/recursive-path reconstruction.

No engine inference or target-outcome inputs. python-chess establishes all
legal moves and geometric relations; missing provider jobs remain missing.
"""
import gzip
import hashlib
import json
import runpy
import sys
from pathlib import Path

import chess

HERE = Path(__file__).parent
helpers = runpy.run_path(str(HERE / "coherent-maia-target-check.py"))
terminal, advance, present = [helpers[f] for f in ["terminal", "advance", "present"]]
same_json = runpy.run_path(str(HERE / "coherent-actual-contrast-check.py"))["same_json"]
DIRECTORY = Path("planning/semantic-consequence-search")
OUTPUT = "d3262-coherent-recursive-semantic-frame.json.gz"
NAMES = ["d3262-recursive-semantic-preregistration.md", "d3262-coherent-target-comparison-frame.json",
         "d3262-coherent-root-frame.json", "d3262-coherent-semantic-third-ply.json.gz",
         "d3262-stockfish-horizon4-capture.json", "d3262-stockfish-coherent-deeper-supplement.json",
         "d3262-stockfish-coherent-semantic-supplement.json", "d3262-stockfish-third-ply-capture.json.gz",
         "d3262-stockfish-semantic-third-ply-capture.json.gz"]


def require(value, message):
    if not value:
        raise AssertionError(message)


def digest(raw):
    return "sha256:" + hashlib.sha256(raw).hexdigest()


def ident(values):
    return digest(json.dumps(values, separators=(",", ":")).encode())


def tracking(root, history, definition):
    board = chess.Board(root)
    original = definition["target"]
    piece = lambda p: {f: p[f] for f in ["color", "role", "square"]}
    target = dict(kind=definition["family"])
    if target["kind"] == "material":
        target.update(attacker=piece(original["attacker"]), target=piece(original["target"]))
        require(present(board, target["attacker"]) and present(board, target["target"]), "root identity")
    else:
        target.update(minor=piece(original["minor"]), controllingPawn=piece(original["controllingPawn"]), square=original["square"])
        require(present(board, target["minor"]), "root minor")
    for i, uci in enumerate(history):
        move = chess.Move.from_uci(uci)
        require(terminal(board) is None and move in board.legal_moves, "tracking legal/terminal")
        if target is not None:
            if i == 0 and target["kind"] == "destination":
                after = board.copy(); after.push(move)
                if not present(after, target["minor"]):
                    target = None
                elif not present(after, target["controllingPawn"]):
                    target["controllingPawn"] = None
            else:
                fields = ["attacker", "target"] if target["kind"] == "material" else ["minor", "controllingPawn"]
                for f in fields:
                    target[f] = advance(board, move, target[f])
                if target[fields[0]] is None or target["kind"] == "material" and target["target"] is None:
                    target = None
        board.push(move)
    return board, target


def signature(board, target, family):
    def reaches(piece, square):
        return piece is not None and present(board, piece) and chess.parse_square(square) in board.attacks(chess.parse_square(piece["square"]))
    if family == "material":
        return dict(identityAlive=target is not None, attackerRole=target["attacker"]["role"] if target else None,
                    targetRole=target["target"]["role"] if target else None,
                    actorAttacksTarget=target is not None and reaches(target["attacker"], target["target"]["square"]))
    occupant = board.piece_at(chess.parse_square(target["square"])) if target else None
    controller = target["controllingPawn"] if target else None
    return dict(identityAlive=target is not None, minorRole=target["minor"]["role"] if target else None,
                minorAttacksDestination=target is not None and reaches(target["minor"], target["square"]),
                destinationOccupant=dict(color=chess.COLOR_NAMES[occupant.color], role=chess.piece_name(occupant.piece_type)) if occupant else None,
                controllerAlive=controller is not None and present(board, controller), controllerRole=controller["role"] if controller else None,
                pawnControlsDestination=controller is not None and controller["role"] == "pawn" and reaches(controller, target["square"]))


def event_node(root, history, definition):
    board, target = tracking(root, history, definition)
    legal = sorted(m.uci() for m in board.legal_moves)
    before = signature(board, target, definition["family"])
    reason = terminal(board)
    status = "absorbing_terminal" if reason else "operand_absent" if target is None else "eligible"
    events = []
    if status == "eligible":
        for uci in legal:
            move = chess.Move.from_uci(uci)
            if len(history) == 3:
                captured = move.to_square + (-8 if board.turn else 8) if board.is_en_passant(move) else move.to_square
                actor = target["attacker"] if target["kind"] == "material" else target["minor"]
                event = move.from_square == chess.parse_square(actor["square"]) and (
                    board.is_capture(move) and captured == chess.parse_square(target["target"]["square"]) if target["kind"] == "material"
                    else move.to_square == chess.parse_square(target["square"]))
                if event:
                    events.append(dict(uci=uci, kind="named_attacker_captures_target" if target["kind"] == "material" else "named_minor_arrives_on_square"))
            else:
                after_board, after_target = tracking(root, history + [uci], definition)
                after = signature(after_board, after_target, definition["family"])
                changed = [f for f in before if not same_json(before[f], after[f])]
                if changed:
                    events.append(dict(uci=uci, kind="named_relation_signature_changed", changed=changed, afterSignature=after))
        status = "event_available" if events else "no_legal_event"
    return dict(historyUci=history, fen=board.fen(en_passant="legal"), tracked=target, terminalReason=reason,
                legal=legal, beforeSignature=before, status=status, events=events)


def reserve(legal, ranked, events, width):
    require(width in [2, 4, 8] and len(ranked) == min(8, len(legal))
            and all(len(a) == len(set(a)) for a in [legal, ranked, events])
            and all(m in legal for m in ranked + events), "reserve legality/cardinality")
    baseline = ranked[:width]
    ranked_events = [m for m in ranked if m in events]
    chosen = ranked_events[0] if ranked_events else sorted(events)[0] if events else None
    selected = baseline if chosen is None or chosen in baseline else baseline[:-1] + [chosen]
    return dict(baseline=baseline, reservedUci=chosen, reservedRank=ranked.index(chosen) + 1 if ranked_events else None,
                eventOrderAuthority="canonical_uci_unranked_tie_not_engine_rank" if chosen and not ranked_events else "retained_top8_engine_order",
                selected=selected, omittedLegal=len(legal) - len(selected), status="no_legal_event" if chosen is None else
                "event_already_in_baseline" if chosen in baseline else "event_reserved_outside_baseline")


def verify(output, inputs, input_digests):
    comparison = inputs["d3262-coherent-target-comparison-frame.json"]
    root_frame = inputs["d3262-coherent-root-frame.json"]
    seed = inputs["d3262-coherent-semantic-third-ply.json.gz"]
    require(output["profile"] == "d3262-coherent-recursive-semantic-frame-v1" and output["providerOff"] is False
            and output["manifest"] == comparison["manifest"] and len(output["rows"]) == 182
            and len(output["candidateCoverage"]) == 193 and output["controls"] == comparison["controls"]
            and output["arms"] == [a.replace("semantic:", "recursive:", 1) for a in seed["arms"]], "population/authority")
    k = lambda r: (r["rootId"], r["targetId"], r["candidateUci"])
    roots = {r["rootId"]: r for r in root_frame["roots"]}
    definitions = {d["id"]: d for d in comparison["definitions"]}
    cells, prior_cells = [{k(r): r for r in frame["rows"]} for frame in [output, seed]]
    require(set(cells) == {k(r) for r in comparison["comparisons"]}, "target cells")
    expected_nodes, paths, rank_cache, expected_rows = {}, {}, {}, []
    def node(root, history, definition):
        node_id = ident([definition["id"], *history])
        if node_id not in expected_nodes:
            expected_nodes[node_id] = dict(id=node_id, rootId=definition["rootId"], targetId=definition["id"],
                                           **event_node(root, history, definition))
        return expected_nodes[node_id]
    def ranked(source, row, budget, fen):
        cache_key = (source, row, budget)
        if cache_key in rank_cache:
            return rank_cache[cache_key]
        capture = inputs[source]["rows"][row]
        require(capture["fen"] == fen, "source FEN")
        probes = [p for p in capture["probes"] if p["budget"] == budget]
        require(len(probes) == 1, "budget source")
        p = probes[0]; board = chess.Board(fen); legal = sorted(m.uci() for m in board.legal_moves)
        moves = [e["moveUci"] for e in p["entries"]]
        require(sorted(p["legal"]) == legal and len(moves) == min(8, len(legal)) and len(set(moves)) == len(moves)
                and sorted(p["missingMoves"]) == sorted(set(legal) - set(moves)), "rank legal denominator")
        for i, e in enumerate(p["entries"]):
            require(e["rank"] == i + 1 and e["depth"] == p["coherentDepth"] and e["pv"][0] == e["moveUci"], "coherent rank")
            replay = chess.Board(fen)
            for uci in e["pv"]:
                m = chess.Move.from_uci(uci); require(m in replay.legal_moves, "rank PV"); replay.push(m)
        rank_cache[cache_key] = moves
        return moves
    for pair in comparison["comparisons"]:
        cell, prior = cells[k(pair)], prior_cells[k(pair)]
        root, definition = roots[pair["rootId"]], definitions[pair["targetId"]]
        expected_arms = []
        require(all(cell[f] == pair[f] for f in pair) and cell["phase"] == root["phase"]
                and cell["family"] == definition["family"] and [a["arm"] for a in cell["arms"]] == output["arms"], "cell context")
        board = chess.Board(root["fen"]); board.push_uci(pair["candidateUci"]); reply_count = board.legal_moves.count()
        for arm, original in zip(cell["arms"], prior["arms"]):
            expected_replies = []
            require(arm["selectedReplyUcis"] == original["selectedReplyUcis"] and arm["seedArm"] == original["arm"]
                    and arm["omittedFirstReplies"] == reply_count - len(original["selectedReplyUcis"])
                    and arm["proofCeiling"] == "recursive_geometric_scheduling_actual_partial_provider_paths_not_profit_or_proof", "seed/ceiling")
            budget, width = arm["arm"].split(":")[1:3]; width = int(width[3:])
            require([r["replyUci"] for r in arm["replies"]] == original["selectedReplyUcis"], "selected replies")
            for reply in arm["replies"]:
                history = [pair["candidateUci"], reply["replyUci"]]; n = node(root["fen"], history, definition)
                require(reply["nodeId"] == n["id"], "learner event node")
                source = next(r for r in prior["replies"] if r["replyUci"] == reply["replyUci"])["sourceBinding"]
                if n["terminalReason"] is not None:
                    expected = dict(replyUci=reply["replyUci"], nodeId=n["id"], source=None, status="absorbing_terminal",
                                    selected=[], omittedLegal=0, unexpandedTerminalLegalMoves=len(n["legal"]))
                else:
                    selection = reserve(n["legal"], ranked(source["source"], source["row"], budget, n["fen"]), [e["uci"] for e in n["events"]], width)
                    selected = []
                    for learner in selection["selected"]:
                        h = history + [learner]; pid = ident([root["rootId"], *h]); desc = node(root["fen"], h, definition)
                        if pid not in paths:
                            paths[pid] = dict(id=pid, rootId=root["rootId"], rootFen=root["fen"], historyUci=h, fen=desc["fen"],
                                              terminalReason=desc["terminalReason"], legalReplyCount=len(desc["legal"]), subjects={})
                        paths[pid]["subjects"].setdefault(pair["targetId"], []).append(arm["arm"])
                        selected.append(dict(learnerUci=learner, pathId=pid))
                    expected = dict(replyUci=reply["replyUci"], nodeId=n["id"], source=dict(**source, budget=budget),
                                    **{f: v for f, v in selection.items() if f != "selected"}, selected=selected, unexpandedTerminalLegalMoves=0)
                require(same_json(reply, expected), "learner recursive selection")
                expected_replies.append(expected)
            expected_arms.append(dict(arm=original["arm"].replace("semantic:", "recursive:", 1), seedArm=original["arm"],
                                      selectedReplyUcis=original["selectedReplyUcis"], omittedFirstReplies=reply_count - len(original["selectedReplyUcis"]),
                                      replies=expected_replies, proofCeiling="recursive_geometric_scheduling_actual_partial_provider_paths_not_profit_or_proof"))
        expected_rows.append(dict(**pair, family=definition["family"], phase=root["phase"], arms=expected_arms))
    for p in paths.values():
        p["subjects"] = [dict(targetId=target, selectedBy=sorted(selected)) for target, selected in sorted(p["subjects"].items())]
    require(same_json(output["paths"], [paths[pid] for pid in sorted(paths)]), "recursive paths")
    final_names = ["d3262-stockfish-third-ply-capture.json.gz", "d3262-stockfish-semantic-third-ply-capture.json.gz"]
    final_index = [{r["fen"]: (i, r) for i, r in enumerate(inputs[name]["rows"])} for name in final_names]
    jobs = {}
    for p in sorted(paths.values(), key=lambda p: p["id"]):
        if p["terminalReason"] is not None:
            continue
        j = jobs.setdefault(p["fen"], dict(id=digest(p["fen"].encode()), fen=p["fen"], paths=[], budgets=set()))
        j["paths"].append(p["id"])
        j["budgets"].update(a.split(":")[1] for s in p["subjects"] for a in s["selectedBy"])
    for j in jobs.values():
        j["budgets"] = sorted(j["budgets"]); j["actualReuse"] = []; j["missingBudgets"] = []
        for budget in j["budgets"]:
            binding = next(((i, index[j["fen"]][0]) for i, index in enumerate(final_index) if j["fen"] in index
                            and any(p["budget"] == budget for p in index[j["fen"]][1]["probes"])), None)
            if binding is None:
                j["missingBudgets"].append(budget)
            else:
                i, row = binding; ranked(final_names[i], row, budget, j["fen"])
                j["actualReuse"].append(dict(source=final_names[i], row=row, budget=budget, sourceStatus="actual_checked_captured_query"))
    expected_jobs = sorted(jobs.values(), key=lambda j: j["id"])
    require(same_json(output["engineJobs"], expected_jobs), "reuse/missing source jobs")
    require(same_json(output["supplementJobs"], [dict(id=j["id"], fen=j["fen"], paths=j["paths"], budgets=j["missingBudgets"])
                                               for j in expected_jobs if j["missingBudgets"]]), "supplement query population")
    expected_final = []
    for p in sorted(paths.values(), key=lambda p: p["id"]):
        for s in p["subjects"]:
            n = node(p["rootFen"], p["historyUci"], definitions[s["targetId"]])
            for arm in s["selectedBy"]:
                budget, width = arm.split(":")[1:3]; width = int(width[3:])
                binding = next((r for r in jobs.get(p["fen"], {}).get("actualReuse", []) if r["budget"] == budget), None)
                common = dict(pathId=p["id"], targetId=s["targetId"], arm=arm, nodeId=n["id"])
                if n["terminalReason"] is not None or binding is None:
                    expected_final.append(dict(**common, source=None, status="absorbing_terminal" if n["terminalReason"] else "source_off",
                                               selected=[], omittedLegal=0 if n["terminalReason"] else len(n["legal"]),
                                               unexpandedTerminalLegalMoves=len(n["legal"]) if n["terminalReason"] else 0))
                else:
                    selection = reserve(n["legal"], ranked(binding["source"], binding["row"], budget, n["fen"]), [e["uci"] for e in n["events"]], width)
                    leaves = []
                    for uci in selection["selected"]:
                        board = chess.Board(p["fen"]); board.push_uci(uci)
                        leaves.append(dict(moveUci=uci, leafId=ident([p["rootId"], *p["historyUci"], uci]),
                                           fen=board.fen(en_passant="legal"), terminalReason=terminal(board)))
                    expected_final.append(dict(**common, source=binding, **{f: v for f, v in selection.items() if f != "selected"},
                                               selected=leaves, unexpandedTerminalLegalMoves=0))
    require(same_json(output["finalPlyNodes"], expected_final), "actual final-ply selection/terminal/source-off")
    require(same_json(output["eventNodes"], [expected_nodes[n] for n in sorted(expected_nodes)]), "typed geometric events")
    coverage = []
    for r in root_frame["roots"]:
        for c in r["candidates"]:
            targets = [p["targetId"] for p in comparison["comparisons"] if p["rootId"] == r["rootId"] and p["candidateUci"] == c["moveUci"]]
            control = next((c for c in comparison["controls"] if c["rootId"] == r["rootId"]), None)
            coverage.append(dict(rootId=r["rootId"], candidateUci=c["moveUci"], phase=r["phase"], targetIds=targets,
                                 status="named_target_recursive_frame" if targets else "declared_control_separate_not_evaluated"
                                 if control and control["status"] == "declared_relation_control" else "no_autonomous_semantic_target"))
    require(same_json(output["candidateCoverage"], coverage), "control/unsupported coverage")
    image = dict(version=1, profile="d3262-coherent-recursive-semantic-frame-v1", manifest=comparison["manifest"],
                 authority="disposable_recursive_geometry_scheduling_with_explicit_missing_sources_not_complete_arm5",
                 preregistrationDigest=input_digests[NAMES[0]], inputDigests=input_digests, providerOff=False,
                 finalPlyQueries=seed["finalPlyQueries"], controls=comparison["controls"], candidateCoverage=coverage,
                 arms=[a.replace("semantic:", "recursive:", 1) for a in seed["arms"]], rows=expected_rows,
                 paths=[paths[p] for p in sorted(paths)], eventNodes=[expected_nodes[n] for n in sorted(expected_nodes)],
                 finalPlyNodes=expected_final, engineJobs=expected_jobs,
                 supplementJobs=[dict(id=j["id"], fen=j["fen"], paths=j["paths"], budgets=j["missingBudgets"])
                                 for j in expected_jobs if j["missingBudgets"]])
    require(same_json(output, image), "complete independent recursive image")
    counts = dict(paths=len(paths), eventNodes=len(expected_nodes), finalPlyNodes=len(expected_final),
                  missingPositions=len(image["supplementJobs"]), missingQueries=sum(len(j["budgets"]) for j in image["supplementJobs"]))
    return counts, image


def main():
    raw_output = (DIRECTORY / OUTPUT).read_bytes(); output = json.loads(gzip.decompress(raw_output))
    inputs, input_digests = {}, {}
    require(set(output["inputDigests"]) == set(NAMES), "input population")
    for name in NAMES:
        raw = (DIRECTORY / name).read_bytes(); input_digests[name] = digest(raw)
        require(input_digests[name] == output["inputDigests"][name], "input digest")
        inputs[name] = raw.decode() if name.endswith(".md") else json.loads(gzip.decompress(raw) if name.endswith(".gz") else raw)
    require(output["preregistrationDigest"] == output["inputDigests"]["d3262-recursive-semantic-preregistration.md"], "preregistration digest")
    counts, expected = verify(output, inputs, input_digests)
    # Reuse the independently derived image, not a copy of the output being
    # checked. Every mutation must differ from that second implementation.
    controls = 0
    if "--negative-controls" in sys.argv:
        leaf = next(n for n in output["finalPlyNodes"] if n["source"] is not None)
        changed = [(output, "candidateCoverage", output["candidateCoverage"][:-1]),
                   (output, "paths", output["paths"][:-1]), (output, "supplementJobs", output["supplementJobs"][:-1]),
                   (output["rows"][0]["arms"][0], "proofCeiling", "proved"),
                   (leaf, "reservedUci", "unplayed"), (leaf, "omittedLegal", 0),
                   (leaf["selected"][0], "fen", "false board"),
                   (output["eventNodes"][0], "events", [dict(uci="illegal", kind="named_relation_signature_changed")]),
                   (output["eventNodes"][0]["beforeSignature"], "identityAlive", int(output["eventNodes"][0]["beforeSignature"]["identityAlive"]))]
        for obj, field, value in changed:
            old = obj[field]; obj[field] = value
            try:
                require(not same_json(output, expected), f"corruption survived: {field}"); controls += 1
            finally:
                obj[field] = old
    print(json.dumps(dict(check="independent-python-chess-recursive-semantic-frame", digest=digest(raw_output),
                          **counts, corruptionRefusals=controls, result="passed")))


if __name__ == "__main__":
    main()
