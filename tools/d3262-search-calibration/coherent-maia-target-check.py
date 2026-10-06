"""Independent D3482 board/identity, source-mass and execution replay.

Does not independently validate the retained local-SEE opportunity predicate.
Read-only; no model load, generated moves, or universal strategic conclusions.
"""
import copy
import hashlib
import json
import runpy
import sys
from pathlib import Path

import chess


def require(value, message):
    if not value:
        raise AssertionError(message)


def digest(raw):
    return "sha256:" + hashlib.sha256(raw).hexdigest()


def terminal(board):
    if not any(board.legal_moves):
        return "CHECKMATE" if board.is_check() else "STALEMATE"
    if board.is_insufficient_material():
        return "INSUFFICIENT_MATERIAL"
    return "SEVENTYFIVE_MOVES" if board.halfmove_clock >= 150 else None


def present(board, piece):
    found = board.piece_at(chess.parse_square(piece["square"]))
    return found is not None and chess.COLOR_NAMES[found.color] == piece["color"] and chess.piece_name(found.piece_type) == piece["role"]


def advance(board, move, piece):
    if piece is None:
        return None
    square = chess.parse_square(piece["square"])
    captured = move.to_square
    if board.is_en_passant(move):
        captured += -8 if board.turn else 8
    if board.is_capture(move) and captured == square:
        return None
    result = dict(piece)
    if board.is_castling(move):
        rank = 0 if board.turn else 7
        kingside = board.is_kingside_castling(move)
        if square == move.from_square:
            result["square"] = chess.square_name(chess.square(6 if kingside else 2, rank))
        elif square == chess.square(7 if kingside else 0, rank):
            result["square"] = chess.square_name(chess.square(5 if kingside else 3, rank))
    elif square == move.from_square:
        result["square"] = chess.square_name(move.to_square)
        if move.promotion:
            result["role"] = chess.piece_name(move.promotion)
    return result


def observe(root, history, definition, observation):
    board = chess.Board(root)
    # Match the explicitly registered identity operands, not unrelated source
    # annotations (e.g. baselineMoveUci / a source piece's promoted flag).
    piece = lambda value: {key: value[key] for key in ["color", "role", "square"]}
    original = definition["target"]
    target = {"kind": definition["family"]}
    if target["kind"] == "material":
        target.update({"attacker": piece(original["attacker"]), "target": piece(original["target"])})
    else:
        target.update({"minor": piece(original["minor"]), "controllingPawn": piece(original["controllingPawn"]), "square": original["square"]})
    require(len(observation["snapshots"]) == len(history), "Lost target snapshots")
    for i, (uci, snapshot) in enumerate(zip(history, observation["snapshots"])):
        move = chess.Move.from_uci(uci)
        require(terminal(board) is None and move in board.legal_moves, "Illegal target history")
        if target is not None:
            if i == 0 and target["kind"] == "destination":
                after = board.copy()
                after.push(move)
                if not present(after, target["minor"]):
                    target = None
                elif not present(after, target["controllingPawn"]):
                    target["controllingPawn"] = None
            else:
                fields = ["attacker", "target"] if target["kind"] == "material" else ["minor", "controllingPawn"]
                for field in fields:
                    target[field] = advance(board, move, target[field])
                if target[fields[0]] is None or target["kind"] == "material" and target["target"] is None:
                    target = None
        board.push(move)
        require(snapshot["ply"] == i + 1 and snapshot["fen"] == board.fen(en_passant="legal"), "Crossed target board")
        if snapshot["tracked"] != target:
            print(json.dumps({"history": history, "ply": i + 1, "expected": target,
                              "actual": snapshot["tracked"]}), file=sys.stderr, flush=True)
        require(snapshot["tracked"] == target, "Crossed tracked piece identity")
        require(snapshot["terminalReason"] == terminal(board), "Crossed target terminal")
        available = snapshot["availableMoveUci"]
        if available is not None:
            follow = chess.Move.from_uci(available)
            require(target is not None and terminal(board) is None and follow in board.legal_moves, "Illegal available target")
            piece = target["attacker"] if target["kind"] == "material" else target["minor"]
            destination = target["target"]["square"] if target["kind"] == "material" else target["square"]
            require(follow.from_square == chess.parse_square(piece["square"]) and follow.to_square == chess.parse_square(destination), "Crossed available target identity")
    opportunity = len(history) >= 3 and observation["snapshots"][2]["availableMoveUci"] is not None
    executed = len(history) == 4 and opportunity and history[3] == observation["snapshots"][2]["availableMoveUci"]
    require(observation["opportunityAtThirdPly"] == opportunity
            and observation["reintroducedAtThirdPly"] == (observation["immediate"] == "removed" and opportunity), "Changed target opportunity")
    require(observation["executedAtFourthPly"] == executed
            and observation["executionWitness"] == (history if executed else None), "Changed actual target execution")


def verify(output, directory):
    inputs = {}
    for name, expected in output["inputDigests"].items():
        raw = (directory / name).read_bytes()
        require(digest(raw) == expected, "Changed target source bytes")
        inputs[name] = json.loads(raw)
    model = inputs["d3262-coherent-maia-fourth-ply.json"]
    comparison = inputs["d3262-coherent-target-comparison-frame.json"]
    roots = {row["rootId"]: row for row in inputs["d3262-coherent-root-frame.json"]["roots"]}
    definitions = {row["id"]: row for row in comparison["definitions"]}
    paths = {row["id"]: row for row in model["paths"]}
    leaves = {row["id"]: row for row in model["leaves"]}
    candidates = {(row["rootId"], row["candidateUci"]): row for row in model["rows"]}
    key = lambda row: (row["rootId"], row["targetId"], row["candidateUci"])
    pairs = {key(row): row for row in comparison["comparisons"]}
    baseline = {key(row): row for row in inputs["d3262-coherent-bounded-targets.json"]["rows"]}
    require(output["profile"] == "d3262-coherent-maia-target-outcome-v1"
            and output["manifest"] == model["manifest"] and output["modelArms"] == model["modelArms"], "Crossed target profile")
    require(len(output["rows"]) == 182 and {key(row) for row in output["rows"]} == {key(row) for row in comparison["comparisons"]}, "Lost target population")
    require(output["modelSource"] == model["source"] and output["controls"] == comparison["controls"], "Crossed model authority")
    counts = {"cells": 182, "arms": 0, "predecessorObservations": 0, "leafObservations": 0}
    for row in output["rows"]:
        candidate_key = (row["rootId"], row["candidateUci"])
        definition = definitions[row["targetId"]]
        root = roots[row["rootId"]]["fen"]
        exact = baseline[key(row)]
        require(row["sourceObserved"] == pairs[key(row)]["sourceObserved"] and row["immediate"] == exact["immediate"]
                and row["exactBaseline"] == {"reintroducedWithin3Ply": exact["reintroducedWithin3Ply"],
                                             "preparationSurvivesEveryDefence": exact["preparationSurvivesEveryDefence"]}, "Crossed exact target baseline")
        require(row["family"] == definition["family"] and row["phase"] == candidates[candidate_key]["phase"], "Crossed target family/phase")
        expected_paths = {path["id"] for path in model["paths"] if (path["rootId"], path["historyUci"][0]) == candidate_key}
        require(len(row["paths"]) == len(expected_paths) and {path["id"] for path in row["paths"]} == expected_paths, "Lost target predecessor")
        for path in row["paths"]:
            original = paths[path["id"]]
            require(path["observation"]["immediate"] == row["immediate"], "Crossed immediate target")
            observe(root, original["historyUci"], definition, path["observation"])
            counts["predecessorObservations"] += 1
            require([arm["arm"] for arm in path["arms"]] == [arm["arm"] for arm in original["arms"]], "Lost target source arms")
            for arm, source in zip(path["arms"], original["arms"]):
                require(arm["pathMass"] == source["pathMass"], "Changed target predecessor mass")
                require([leaf["leafId"] for leaf in arm["leaves"]] == [leaf["leafId"] for leaf in source["selected"]], "Lost target selected leaf")
                for leaf, selected in zip(arm["leaves"], source["selected"]):
                    require(leaf["jointMass"] == selected["jointMass"], "Changed target leaf mass")
                    observe(root, leaves[leaf["leafId"]]["historyUci"], definition, leaf["observation"])
                    counts["leafObservations"] += 1
        require([arm["arm"] for arm in row["arms"]] == model["modelArms"], "Lost target aggregate arms")
        for aggregate, coverage in zip(row["arms"], candidates[candidate_key]["arms"]):
            entries = [(path, next(arm for arm in path["arms"] if arm["arm"] == aggregate["arm"])) for path in row["paths"] if any(arm["arm"] == aggregate["arm"] for arm in path["arms"])]
            all_leaves = [(path, leaf) for path, arm in entries for leaf in arm["leaves"]]
            for prefix, predicate in [("opportunity", "opportunityAtThirdPly"), ("reintroduced", "reintroducedAtThirdPly")]:
                selected = [(path, arm) for path, arm in entries if path["observation"][predicate]]
                require(aggregate[prefix + "Paths"] == [path["id"] for path, arm in selected], "Changed target opportunity set")
                mass_key = "opportunityMass" if prefix == "opportunity" else "reintroducedOpportunityMass"
                require(abs(aggregate[mass_key] - sum(arm["pathMass"] for path, arm in selected)) < 1e-10, "Changed target opportunity mass")
            for prefix, only_reintroduced in [("executed", False), ("executedReintroduced", True)]:
                selected = [(path, leaf) for path, leaf in all_leaves if leaf["observation"]["executedAtFourthPly"] and (not only_reintroduced or path["observation"]["reintroducedAtThirdPly"])]
                require(aggregate[prefix + "Leaves"] == [leaf["leafId"] for path, leaf in selected], "Changed target execution set")
                mass_key = "reintroducedExecutionMass" if only_reintroduced else "executionMass"
                require(abs(aggregate[mass_key] - sum(leaf["jointMass"] for path, leaf in selected)) < 1e-10, "Changed target execution mass")
            require(aggregate["coveredPredecessorMass"] == coverage["twoLayerMass"] and aggregate["coveredFourthPlyMass"] == coverage["frontierMass"] and aggregate["residualMass"] == coverage["residualMass"], "Crossed target coverage")
            require(aggregate["negativeVerdict"] == "abstain_from_partial_frontier" and aggregate["universalVerdict"] == "not_evaluated", "Forged target negative proof")
            counts["arms"] += 1
    return counts


def main():
    directory = Path("planning/semantic-consequence-search")
    raw = (directory / "d3262-coherent-maia-target-outcome.json").read_bytes()
    output = json.loads(raw)
    # This separate existing oracle independently reconstructs the original
    # model weights, selected histories and terminal populations first.
    model_checker = runpy.run_path(str(Path(__file__).with_name("coherent-maia-fourth-ply-check.py")))
    model_checker["verify"](json.loads((directory / "d3262-coherent-maia-fourth-ply.json").read_bytes()), directory)
    controls = []
    mutations = [
        ("missing-cell", lambda value: value["rows"].pop(), "Lost target population"),
        ("changed-board", lambda value: value["rows"][0]["paths"][0]["observation"]["snapshots"][0].__setitem__("fen", "changed"), "Crossed target board"),
        ("changed-piece", lambda value: value["rows"][0]["paths"][0]["observation"]["snapshots"][0]["tracked"]["minor"].__setitem__("square", "a1"), "Crossed tracked piece identity"),
        ("invented-execution", lambda value: value["rows"][0]["paths"][0]["observation"].__setitem__("executedAtFourthPly", True), "Changed actual target execution"),
        ("changed-path-mass", lambda value: value["rows"][0]["paths"][0]["arms"][0].__setitem__("pathMass", 0), "Changed target predecessor mass"),
        ("changed-aggregate", lambda value: value["rows"][0]["arms"][0].__setitem__("opportunityMass", -1), "Changed target opportunity mass"),
        ("invented-prevention", lambda value: value["rows"][0]["arms"][0].__setitem__("negativeVerdict", "prevented"), "Forged target negative proof"),
    ]
    if "--negative-controls" in sys.argv:
        for name, mutate, expected in mutations:
            changed = copy.deepcopy(output)
            mutate(changed)
            try:
                verify(changed, directory)
            except AssertionError as error:
                require(str(error) == expected, "Unrelated negative guard: " + name + ": " + str(error))
                controls.append(name)
                print("D3482 independent negative refused: " + name, file=sys.stderr, flush=True)
            else:
                raise AssertionError("Independent target checker admitted mutation: " + name)
    print(json.dumps({"digest": digest(raw), **verify(output, directory), "negativeControls": controls,
                      "localSeePredicate": "shared_registered_predicate_not_independent_chess_truth"}, indent=2))


if __name__ == "__main__":
    main()
