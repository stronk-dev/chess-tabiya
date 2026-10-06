"""Disposable D3488 independent legal graph and quantifier reconstruction.

python-chess, not chessops, enumerates every decision set and replays witnesses.
The previously checked local target predicate is shared, not independent chess
truth. No JS quantifier output is used to derive the expected outcomes.
"""
import gzip
import hashlib
import json
import runpy
import sys
from pathlib import Path

import chess

DIRECTORY = Path("planning/semantic-consequence-search")
NAMES = ["d3262-coherent-root-frame.json", "d3262-coherent-first-reply-frontier.json",
         "d3262-coherent-third-ply-frame.json", "d3262-coherent-semantic-third-ply.json.gz",
         "d3262-coherent-engine-target-outcome.json.gz", "d3262-coherent-maia-target-outcome.json",
         "d3262-coherent-bounded-targets.json"]
OUTPUT = "d3262-coherent-actual-proof.json.gz"
same_json = runpy.run_path(str(Path(__file__).with_name("coherent-actual-contrast-check.py")))["same_json"]
ENGINE = [f"engine:{budget}:top{width}" for budget in ["depth8", "depth12", "movetime100"] for width in [2, 4, 8]]
SEMANTIC = [f"semantic:{budget}:top{width}:{selection}" for budget in ["depth8", "depth12", "movetime100"]
            for width in [2, 4, 8] for selection in ["top8", "all_legal"]]
MODEL = ["maia:prefix0.80", "maia:prefix0.90"]


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def digest(raw):
    return "sha256:" + hashlib.sha256(raw).hexdigest()


def path_id(root, history):
    return digest(json.dumps([root, *history], separators=(",", ":")).encode())


def terminal(board):
    if not any(board.legal_moves):
        return "CHECKMATE" if board.is_check() else "STALEMATE"
    if board.is_insufficient_material():
        return "INSUFFICIENT_MATERIAL"
    return "SEVENTYFIVE_MOVES" if board.halfmove_clock >= 150 else None


def push(board, uci):
    move = chess.Move.from_uci(uci)
    require(move in board.legal_moves, "illegal independent move")
    copy = board.copy(); copy.push(move)
    return copy


def preparation_result(legal, reason, observed):
    require(len(legal) == len(set(legal)) and len(observed) == len({o["learnerUci"] for o in observed}), "duplicate defence")
    require(all(o["learnerUci"] in legal and type(o["opportunity"]) is bool
                and (o["opportunity"] or not o["executedLeaves"]) for o in observed), "untyped/illegal witness")
    if reason is not None or not legal:
        require(not observed, "terminal continuation")
        return dict(availability="ineligible_terminal", execution="ineligible_terminal", refutationPath=None,
                    unvisitedDefences=[], unexpandedTerminalLegalMoves=len(legal))
    missing = [uci for uci in legal if not any(o["learnerUci"] == uci for o in observed)]
    negatives = [o for o in observed if not o["opportunity"]]
    return dict(availability="refuted_by_visited_defence" if negatives else "unknown_partial_defences" if missing
                else "survives_complete_nonempty_defences",
                execution="refuted_by_visited_defence" if negatives else "executed_against_every_defence"
                if not missing and all(o["executedLeaves"] for o in observed) else "unknown_unexecuted_or_partial",
                refutationPath=negatives[0]["pathId"] if negatives else None, unvisitedDefences=missing,
                unexpandedTerminalLegalMoves=0)


def root_result(immediate, legal, selected):
    require(len(selected) == len({p["preparationUci"] for p in selected})
            and all(p["preparationUci"] in legal for p in selected), "illegal root selection")
    omitted = [uci for uci in legal if not any(p["preparationUci"] == uci for p in selected)]
    positives = [p for p in selected if p["availability"] == "survives_complete_nonempty_defences"]
    executed = [p for p in selected if p["execution"] == "executed_against_every_defence"]
    negative = bool(legal) and not omitted and all(p["availability"] in ["refuted_by_visited_defence", "ineligible_terminal"] for p in selected)
    skip = "not_applicable_immediate_preserved" if immediate == "preserved" else "not_applicable_identity_lost" if immediate == "identity_lost" else None
    require(immediate in ["preserved", "removed", "identity_lost"], "unknown immediate")
    return dict(availability=skip or ("exists_preparation_surviving_all_defences" if positives else
                "every_preparation_refuted_at_bound" if negative else "ineligible_terminal" if not legal else "unknown_partial_quantifiers"),
                execution=skip or ("exists_executed_strategy" if executed else "every_preparation_refuted_at_bound"
                                   if negative else "unknown_unexecuted_or_partial"),
                witnessPreparationUci=positives[0]["preparationUci"] if positives and not skip else None,
                executedPreparationUci=executed[0]["preparationUci"] if executed and not skip else None,
                omittedPreparations=omitted)


def reconstruct(inputs, digests):
    root, first, third, semantic, engine, model, bounded = inputs
    require(len(root["roots"]) == 66 and len(first["rows"]) == len(third["rows"]) == 193
            and len(semantic["rows"]) == len(model["rows"]) == len(bounded["rows"]) == 182, "independent population")
    require(all(value["manifest"] == root["manifest"] for value in inputs), "independent manifest")
    for value, name in [(third, NAMES[1]), (semantic, NAMES[2]), (engine, NAMES[0]), (model, NAMES[0]),
                        (engine, NAMES[6]), (model, NAMES[6])]:
        require(value["inputDigests"][name] == digests[name], "independent source digest")
    k = lambda r: (r["rootId"], r["candidateUci"])
    ck = lambda r: (r["rootId"], r["targetId"], r["candidateUci"])
    first_index, third_index, semantic_index = [{key(r): r for r in frame["rows"]}
                                               for frame, key in [(first, k), (third, k), (semantic, ck)]]
    exact = {ck(r): r for r in bounded["rows"]}
    graph, paths, roots = [], {}, {r["rootId"]: r for r in root["roots"]}
    for r in root["roots"]:
        for candidate in r["candidates"]:
            after = push(chess.Board(r["fen"]), candidate["moveUci"])
            preparations = []
            for move in sorted(after.legal_moves, key=lambda m: m.uci()):
                pre = push(after, move.uci())
                preparations.append(dict(preparationUci=move.uci(), fen=pre.fen(en_passant="legal"),
                                         terminalReason=terminal(pre), legalDefences=sorted(m.uci() for m in pre.legal_moves)))
            graph.append(dict(rootId=r["rootId"], rootFen=r["fen"], candidateUci=candidate["moveUci"],
                              afterFen=after.fen(en_passant="legal"), terminalReason=terminal(after), preparations=preparations))
    graph_index = {k(r): r for r in graph}
    for p in third["paths"] + semantic["paths"]:
        require(p["id"] == path_id(p["rootId"], p["historyUci"]) and len(p["historyUci"]) == 3, "ordered path identity")
        if p["id"] in paths:
            require(all(paths[p["id"]][f] == p[f] for f in ["rootId", "historyUci", "fen"]), "shared path identity")
        paths[p["id"]] = p
    profiles = []
    for source in engine["profiles"] + [dict(kind="model", arms=model["modelArms"], rows=model["rows"])]:
        kind = source["kind"]
        require(source["arms"] == {"engine": ENGINE, "semantic_first_reply_reserve": SEMANTIC, "model": MODEL}[kind]
                and len(source["rows"]) == 182 and {ck(r) for r in source["rows"]} == set(exact), "source arms/cells")
        rows = []
        for cell in source["rows"]:
            arms, g = [], graph_index[k(cell)]
            baseline = exact[ck(cell)]
            require(baseline["kind"] == "result" and cell["immediate"] == baseline["immediate"]
                    and cell["sourceObserved"] == baseline["sourceObserved"] and cell["family"] == baseline["family"]
                    and same_json(cell["exactBaseline"], {f: baseline[f] for f in
                                  ["reintroducedWithin3Ply", "preparationSurvivesEveryDefence"]}), "baseline scope")
            for arm in cell["arms"]:
                name = arm["arm"]
                sem = next((a for a in semantic_index[ck(cell)]["arms"] if a["arm"] == name), None)
                chosen = sem["selectedReplyUcis"] if kind == "semantic_first_reply_reserve" else [r["uci"] for r in first_index[k(cell)]["replies"] if name in r["selectedBy"]]
                selected_paths = []
                if kind == "model":
                    for p in cell["paths"]:
                        for a in p["arms"]:
                            if a["arm"] == name:
                                selected_paths.append((p["id"], p["observation"], [(l["leafId"], l["observation"]) for l in a["leaves"]]))
                else:
                    def resolve(ordinal):
                        require(type(ordinal) is int and 0 <= ordinal < len(engine["observations"]), "independent compact ordinal")
                        o = engine["observations"][ordinal]
                        require((o["rootId"], o["targetId"]) == (cell["rootId"], cell["targetId"]), "crossed target")
                        return o
                    for p in arm["paths"]:
                        pre = resolve(p["predecessorObservation"])
                        leaves = [resolve(i) for i in p["leafObservations"]]
                        selected_paths.append((pre["pathId"], pre["observation"], [(l["pathId"], l["observation"]) for l in leaves]))
                expected_ids = sem["selectedLearnerPaths"] if kind == "semantic_first_reply_reserve" else [
                    path_id(cell["rootId"], [cell["candidateUci"], r["replyUci"], uci]) for r in third_index[k(cell)]["replies"]
                    for a in r["arms"] if a["arm"] == name for uci in a["selected"]]
                require(sorted(p[0] for p in selected_paths) == sorted(expected_ids), "actual selected set")
                observed = []
                for pid, observation, leaves in selected_paths:
                    p = paths[pid]
                    require(p["historyUci"][0] == cell["candidateUci"] and p["historyUci"][1] in chosen, "actual root/preparation")
                    board = chess.Board(roots[cell["rootId"]]["fen"])
                    for i, uci in enumerate(p["historyUci"]):
                        require(terminal(board) is None, "ancestor terminal")
                        board = push(board, uci)
                        snap = observation["snapshots"][i]
                        require(snap["ply"] == i + 1 and snap["fen"] == board.fen(en_passant="legal")
                                and snap["terminalReason"] == terminal(board), "independent snapshot")
                    executed = []
                    for lid, o in leaves:
                        if o["executedAtFourthPly"]:
                            w = o["executionWitness"]
                            require(w[:3] == p["historyUci"] and len(w) == 4 and lid == path_id(cell["rootId"], w)
                                    and same_json(o["snapshots"][:3], observation["snapshots"]), "execution prefix")
                            leaf = push(board, w[3]); last = o["snapshots"][3]
                            require(terminal(board) is None and last["fen"] == leaf.fen(en_passant="legal")
                                    and last["terminalReason"] == terminal(leaf), "independent executed leaf")
                            executed.append(lid)
                    observed.append(dict(pathId=pid, preparationUci=p["historyUci"][1], learnerUci=p["historyUci"][2],
                                         opportunity=observation["opportunityAtThirdPly"], executedLeaves=executed))
                preparations = []
                for uci in chosen:
                    pre = next(p for p in g["preparations"] if p["preparationUci"] == uci)
                    obs = [o for o in observed if o["preparationUci"] == uci]
                    preparations.append(dict(preparationUci=uci, observed=obs, **preparation_result(pre["legalDefences"], pre["terminalReason"], obs)))
                result = root_result(cell["immediate"], [p["preparationUci"] for p in g["preparations"]] if g["terminalReason"] is None else [], preparations)
                if result["availability"] == "exists_preparation_surviving_all_defences":
                    require(baseline["preparationSurvivesEveryDefence"] is True, "universal exceeds baseline")
                if result["availability"] == "every_preparation_refuted_at_bound":
                    require(baseline["preparationSurvivesEveryDefence"] is False, "refutation exceeds baseline")
                ceiling = "observed_configured_model_paths_only" if kind == "model" else "observed_provider_selected_lines_only"
                require(arm["universalVerdict"] == "not_evaluated" and arm["proofCeiling"] == ceiling, "source proof ceiling")
                arms.append(dict(arm=name, sourceProofCeiling=ceiling,
                                 productionDisposition="research_quantifier_receipt_not_production_authority", **result, preparations=preparations))
            rows.append({**{f: cell[f] for f in ["rootId", "targetId", "candidateUci", "sourceObserved", "phase", "family", "immediate", "exactBaseline"]}, "arms": arms})
        profiles.append(dict(kind=kind, arms=source["arms"], rows=rows))
    require(same_json(engine["controls"], model["controls"]) and len(model["controls"]) == 4, "controls")
    return dict(version=1, profile="d3262-coherent-actual-proof-v1", manifest=root["manifest"], inputDigests=digests,
                quantifier="exists_opponent_preparation_forall_legal_learner_defences_exists_named_target_available_at_ply4",
                bounds=dict(preparationPly=2, defencePly=3, targetActionPly=4),
                authority="disposable_actual_selected_paths_exact_legal_decision_sets_shared_local_target_predicate",
                controls=model["controls"], candidateGraph=graph, profiles=profiles)


def verify(output, expected):
    require(same_json(output, expected), "Independent actual quantifier reconstruction mismatch")


def main():
    raw = [(DIRECTORY / name).read_bytes() for name in NAMES]
    inputs = [json.loads(gzip.decompress(b) if name.endswith(".gz") else b) for name, b in zip(NAMES, raw)]
    expected = reconstruct(inputs, {name: digest(b) for name, b in zip(NAMES, raw)})
    output_bytes = (DIRECTORY / OUTPUT).read_bytes()
    output = json.loads(gzip.decompress(output_bytes))
    verify(output, expected)
    controls = 0
    if "--negative-controls" in sys.argv:
        arm = output["profiles"][0]["rows"][0]["arms"][0]
        pre = arm["preparations"][0]
        witness = pre["observed"][0]
        changes = [(output, "quantifier", "forall_preparations_exists_defence"),
                   (output, "candidateGraph", output["candidateGraph"][:-1]),
                   (output["candidateGraph"][0]["preparations"][0], "legalDefences", []),
                   (output["profiles"][0], "rows", output["profiles"][0]["rows"][:-1]),
                   (arm, "availability", "exists_preparation_surviving_all_defences"),
                   (arm, "productionDisposition", "proved"), (arm, "omittedPreparations", []),
                   (pre, "refutationPath", "fabricated"), (pre, "unvisitedDefences", []),
                   (witness, "opportunity", int(witness["opportunity"])),
                   (witness, "executedLeaves", ["unselected"])]
        for obj, field, changed in changes:
            old = obj[field]; obj[field] = changed
            try:
                try:
                    verify(output, expected)
                except AssertionError:
                    controls += 1
                else:
                    raise AssertionError(f"corruption accepted: {field}")
            finally:
                obj[field] = old
    print(json.dumps(dict(check="independent-python-chess-actual-quantifiers", digest=digest(output_bytes),
                          candidates=len(expected["candidateGraph"]), cells=182, settings=29,
                          corruptionRefusals=controls, result="passed")))


if __name__ == "__main__":
    main()
