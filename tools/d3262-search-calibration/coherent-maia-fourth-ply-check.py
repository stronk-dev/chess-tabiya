"""Independent legal/conditional-mass replay of D3481's four-ply frontier.

Read-only and model-free: validated captures provide literal policy masses.
Not observed human frequencies, universal proof, or root engine causality.
"""
import hashlib
import json
import copy
import sys
from pathlib import Path

import chess


def require(value, message):
    if not value:
        raise AssertionError(message)


def digest(value):
    return "sha256:" + hashlib.sha256(value).hexdigest()


def close(left, right, message):
    require(abs(left - right) <= 1e-10, message)


def identity(root, moves):
    return digest(json.dumps([root, *moves], separators=(",", ":")).encode())


def selected(policy, threshold):
    result = []
    mass = 0.0
    for row in policy[:8]:
        if mass >= threshold:
            break
        result.append(row)
        mass += row["mass"]
    return result, mass


def probability(policy, move):
    matches = [row["mass"] for row in policy if row["legalUci"] == move]
    require(len(matches) == 1, "Lost conditional source identity")
    return matches[0]


def verify(output, directory):
    require(output["profile"] == "d3262-coherent-maia-fourth-ply-v1", "Crossed independent profile")
    inputs = {}
    for name, expected in output["inputDigests"].items():
        raw = (directory / name).read_bytes()
        require(digest(raw) == expected, "Changed input " + name)
        inputs[name] = json.loads(raw)
    third = inputs["d3262-coherent-third-ply-frame.json"]
    source = inputs["d3262-maia-third-ply-capture.json"]
    require(output["inputDigests"]["d3262-coherent-third-ply-frame.json"]
            == "sha256:3059fb3a45eb10bdcd56b7a4190bbbcf7370b4bf58750934befabde62712dc07"
            and output["inputDigests"]["d3262-maia-third-ply-capture.json"]
            == "sha256:64652308c2196cd14b59414fa016506e84aa557fd3419e042437505a52b8c508", "Crossed frozen capture authorities")
    require(set(output["inputDigests"]) == set(third["inputDigests"]) | {
        "d3262-coherent-third-ply-frame.json", "d3262-maia-third-ply-capture.json"}, "Changed source input population")
    require(output["source"] == source["source"], "Crossed model source")
    require(len(output["rows"]) == len(third["rows"]) == 193, "Lost fixed candidate population")
    require(len(output["paths"]) == len(source["rows"]) == 1401, "Lost fixed model history population")
    arms = ["maia:prefix0.80", "maia:prefix0.90"]
    require(output["modelArms"] == arms, "Changed declared prefix arms")
    parents = {}
    for name in ["d3262-maia-history-replay.json", "d3262-maia-coherent-new-child.json"]:
        for row in inputs[name]["rows"]:
            key = (row["rootId"], row["candidateUci"])
            require(key not in parents, "Duplicate parent model policy")
            parents[key] = (name, row)
    union = inputs["d3262-coherent-deeper-source-union.json"]
    bindings = {(row["rootId"], row["candidateUci"], row["replyUci"]): row for row in union["bindings"]}
    finals = {row["id"]: (i, row) for i, row in enumerate(source["rows"])}
    third_paths = {row["id"]: row for row in third["paths"]}
    require(set(finals) == {row["id"] for row in output["paths"]}, "Missing or invented model path")
    expected_leaves = {}
    candidate_paths = {}
    absorbing = 0
    for path in output["paths"]:
        original = third_paths[path["id"]]
        require(path["historyUci"] == original["historyUci"] and path["rootFen"] == original["rootFen"],
                "Changed model history")
        require(identity(path["rootId"], path["historyUci"]) == path["id"], "Crossed path identity")
        candidate, reply, learner = path["historyUci"]
        key = (path["rootId"], candidate)
        parent_name, parent = parents[key]
        binding = bindings[(*key, reply)]["maia"]
        second = inputs[binding["source"]]["rows"][binding["row"]]
        source_index, final = finals[path["id"]]
        require(path["source"] == {"name": "d3262-maia-third-ply-capture.json", "row": source_index},
                "Crossed final source row")
        require(path["firstSource"] == {"name": parent_name, "historyUci": parent["historyUci"]}
                and path["secondSource"] == {"name": binding["source"], "row": binding["row"],
                                             "historyUci": second["historyUci"]}, "Crossed earlier source binding")
        p_reply = probability(parent["configuredSupport"], reply)
        p_learner = probability(second["configuredSupport"], learner)
        close(path["conditionalReplyMass"], p_reply, "Changed parent conditional mass")
        close(path["conditionalLearnerMass"], p_learner, "Changed learner conditional mass")
        board = chess.Board(path["rootFen"])
        for move in path["historyUci"]:
            require(chess.Move.from_uci(move) in board.legal_moves, "Illegal retained history")
            board.push_uci(move)
        require(board.fen() == path["fen"] == final["fen"] and board.legal_moves.count() == path["legalReplyCount"],
                "Changed final board or legal denominator")
        outcome = board.outcome(claim_draw=False)
        reason = None if outcome is None else outcome.termination.name
        require(path["terminalReason"] == reason, "Changed terminal board authority")
        absorbing += int(outcome is not None)
        expected_arms = []
        for arm in arms:
            threshold = float(arm.split("prefix")[1])
            first_moves, _ = selected(parent["configuredSupport"], threshold)
            second_moves, _ = selected(second["configuredSupport"], threshold)
            if reply in [row["legalUci"] for row in first_moves] and learner in [row["legalUci"] for row in second_moves]:
                expected_arms.append(arm)
        require([row["arm"] for row in path["arms"]] == expected_arms, "Crossed same-arm policy path")
        for arm_row in path["arms"]:
            threshold = float(arm_row["arm"].split("prefix")[1])
            last_moves, covered = ([], 1.0) if outcome is not None else selected(final["configuredSupport"], threshold)
            close(arm_row["pathMass"], p_reply * p_learner, "Changed joint predecessor mass")
            close(arm_row["coveredConditionalMass"], covered, "Changed final prefix mass")
            close(arm_row["coveredPathMass"], p_reply * p_learner * covered, "Changed three-layer joint mass")
            close(arm_row["omittedPathMass"], max(0, p_reply * p_learner * (1 - covered)), "Lost omitted path mass")
            require(len(arm_row["selected"]) == len(last_moves), "Changed selected leaf population")
            require(arm_row["omittedLegalReplies"] == (0 if outcome is not None else board.legal_moves.count() - len(last_moves))
                    and arm_row["unexpandedTerminalLegalMoves"] == (board.legal_moves.count() if outcome is not None else 0),
                    "Lost nonterminal versus terminal legal denominator")
            for actual, expected in zip(arm_row["selected"], last_moves):
                move = expected["legalUci"]
                require(actual["moveUci"] == move and chess.Move.from_uci(move) in board.legal_moves, "Changed fourth-ply edge")
                moves = [*path["historyUci"], move]
                leaf_id = identity(path["rootId"], moves)
                require(actual["leafId"] == leaf_id, "Crossed fourth-ply identity")
                close(actual["conditionalMass"], expected["mass"], "Changed leaf conditional mass")
                close(actual["jointMass"], p_reply * p_learner * expected["mass"], "Changed leaf joint mass")
                child = board.copy()
                child.push_uci(move)
                terminal = child.outcome(claim_draw=False)
                value = {"id": leaf_id, "rootId": path["rootId"], "rootFen": path["rootFen"], "historyUci": moves,
                         "fen": child.fen(), "legalNextCount": child.legal_moves.count(),
                         "terminalReason": None if terminal is None else terminal.termination.name, "selectedBy": []}
                if leaf_id not in expected_leaves:
                    expected_leaves[leaf_id] = value
                expected_leaves[leaf_id]["selectedBy"].append(arm_row["arm"])
        candidate_paths.setdefault(key, []).append(path)
    require(len(expected_leaves) == len(output["leaves"]), "Incomplete fourth-ply leaf union")
    require(set(expected_leaves) == {leaf["id"] for leaf in output["leaves"]}, "Duplicated or omitted fourth-ply leaf")
    for leaf in output["leaves"]:
        require(leaf == expected_leaves[leaf["id"]], "Changed independently reconstructed leaf")
    third_candidates = {(row["rootId"], row["candidateUci"]): row for row in third["rows"]}
    require(set(third_candidates) == {(row["rootId"], row["candidateUci"]) for row in output["rows"]}, "Changed candidates")
    for row in output["rows"]:
        key = (row["rootId"], row["candidateUci"])
        original = third_candidates[key]
        require(row["phase"] == original["phase"] and row["legalReplyCount"] == original["legalReplyCount"]
                and row["terminalAfterCandidate"] == original["terminalAfterCandidate"], "Changed phase or terminal stratum")
        require([arm["arm"] for arm in row["arms"]] == arms, "Lost complete candidate arm population")
        for arm in row["arms"]:
            prior = next(value for value in original["arms"] if value["arm"] == arm["arm"])
            paths = [(path, next(value for value in path["arms"] if value["arm"] == arm["arm"]))
                     for path in candidate_paths.get(key, []) if any(value["arm"] == arm["arm"] for value in path["arms"])]
            # Real frozen candidates have no early terminal. Do not silently
            # admit a changed terminal population into this independent receipt.
            require(not original["terminalAfterCandidate"] and prior["completedAtReply"] == 0, "Changed early-terminal population")
            covered = sum(value["coveredPathMass"] for _, value in paths)
            close(arm["twoLayerMass"], sum(value["pathMass"] for _, value in paths), "Changed candidate predecessor coverage")
            close(arm["twoLayerMass"], prior["frontierMass"], "Crossed frozen two-layer coverage")
            close(arm["frontierMass"], covered, "Changed candidate final coverage")
            close(arm["firstCoveredMass"], prior["firstCoveredMass"], "Changed first coverage")
            close(arm["omittedFirstLayerMass"], prior["omittedFirstLayerMass"], "Changed first omission")
            close(arm["omittedSecondLayerMass"], prior["omittedSecondLayerMass"], "Changed second omission")
            close(arm["omittedThirdLayerMass"], max(0, prior["frontierMass"] - covered), "Changed third omission")
            close(arm["residualMass"], max(0, 1 - covered), "Lost composed residual")
            close(arm["stoppedAtReplyMass"], 0, "Invented early absorbing mass")
            close(arm["stoppedAtThirdPlyMass"], sum(value["pathMass"] for path, value in paths if path["terminalReason"] is not None),
                  "Lost terminal absorbing mass")
            edges = [entry for _, value in paths for entry in value["selected"]]
            close(arm["stoppedAtFourthPlyMass"], sum(entry["jointMass"] for entry in edges
                                                    if expected_leaves[entry["leafId"]]["terminalReason"] is not None),
                  "Changed fourth-ply terminal mass")
            require(arm["selectedThirdPlyPaths"] == len(paths) and arm["selectedFourthPlyEdges"] == len(edges), "Changed candidate edge counts")
            require(arm["omittedLegalFourthRepliesWithinSelectedNonterminalPaths"] == sum(value["omittedLegalReplies"] for _, value in paths)
                    and arm["unexpandedTerminalLegalMoves"] == sum(value["unexpandedTerminalLegalMoves"] for _, value in paths),
                    "Changed aggregate legal denominator")
    return {"pythonChessVersion": chess.__version__,
            "independentlyReplayedThirdPlyPaths": len(output["paths"]), "independentlyReplayedFourthPlyLeaves": len(expected_leaves),
            "absorbingThirdPlyTerminals": absorbing, "candidatePolicyArms": len(output["rows"]) * len(arms),
            "authority": "legal_and_configured_model_mass_replay_not_human_frequency_or_search_proof"}


def main():
    directory = Path("planning/semantic-consequence-search")
    output_bytes = (directory / "d3262-coherent-maia-fourth-ply.json").read_bytes()
    output = json.loads(output_bytes)
    controls = []
    if "--negative-controls" in sys.argv:
        def duplicate_leaf(value):
            value["leaves"][0] = copy.deepcopy(value["leaves"][1])

        def forged_terminal(value):
            next(row for row in value["paths"] if row["terminalReason"] is not None)["terminalReason"] = None

        mutations = [
            ("missing-path", lambda value: value["paths"].pop(), "Lost fixed model history population"),
            ("crossed-history", lambda value: value["paths"][0]["historyUci"].reverse(), "Changed model history"),
            ("changed-conditional-mass", lambda value: value["paths"][0].__setitem__("conditionalReplyMass", 0), "Changed parent conditional mass"),
            ("forged-terminal", forged_terminal, "Changed terminal board authority"),
            ("duplicate-leaf", duplicate_leaf, "Duplicated or omitted fourth-ply leaf"),
            ("changed-leaf-fen", lambda value: value["leaves"][0].__setitem__("fen", "changed"), "Changed independently reconstructed leaf"),
            ("changed-joint-mass", lambda value: value["rows"][0]["arms"][0].__setitem__("frontierMass", 0), "Changed candidate final coverage"),
            ("lost-residual", lambda value: value["rows"][0]["arms"][0].__setitem__("residualMass", 0), "Lost composed residual"),
        ]
        for name, mutate, expected in mutations:
            changed = copy.deepcopy(output)
            mutate(changed)
            try:
                verify(changed, directory)
            except AssertionError as error:
                require(str(error) == expected, "Negative control failed at an unrelated guard: " + name + ": " + str(error))
                controls.append(name)
                print("D3481 independent negative refused: " + name, file=sys.stderr, flush=True)
            else:
                raise AssertionError("Independent checker admitted mutation: " + name)
    result = verify(output, directory)
    print(json.dumps({"artifactDigest": digest(output_bytes), **result, "negativeControls": controls}, indent=2))


if __name__ == "__main__":
    main()
