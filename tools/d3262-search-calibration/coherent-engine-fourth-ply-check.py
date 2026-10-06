"""Independent D3485 actual-rank/board/history replay; no inference or proof.

Reconstruct the entire frontier from hashed frozen source bytes using python-chess.
Source evaluations are literal provider observations, not independently inferred.
"""
import gzip
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

import chess

_spec = importlib.util.spec_from_file_location("source_check", Path(__file__).with_name("third-ply-stockfish-independent.py"))
_source_check = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_source_check)
verify_capture = _source_check.verify


def require(value, message):
    if not value:
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


def replay(root, history):
    board = chess.Board(root)
    for uci in history:
        move = chess.Move.from_uci(uci)
        require(terminal(board) is None and move in board.legal_moves, "Illegal independent engine history or terminal continuation")
        board.push(move)
    return board


FRAME = "d3262-coherent-third-ply-frame.json"
FINAL = "d3262-stockfish-third-ply-capture.json.gz"
SEMANTIC = "d3262-coherent-semantic-third-ply.json.gz"
SUPPLEMENT = "d3262-stockfish-semantic-third-ply-capture.json.gz"
OUTPUT = "d3262-coherent-engine-fourth-ply.json.gz"
ENGINE_ARMS = ["engine:%s:top%d" % (budget, width) for budget in ["depth8", "depth12", "movetime100"] for width in [2, 4, 8]]
SEMANTIC_ARMS = ["semantic:%s:top%d:%s" % (budget, width, source) for budget in ["depth8", "depth12", "movetime100"]
                 for width in [2, 4, 8] for source in ["top8", "all_legal"]]


def expected_frontier(inputs, raw_inputs):
    third, final, semantic, supplement = [inputs[name] for name in [FRAME, FINAL, SEMANTIC, SUPPLEMENT]]
    require(digest(raw_inputs[FRAME]) == "sha256:3059fb3a45eb10bdcd56b7a4190bbbcf7370b4bf58750934befabde62712dc07"
            and digest(raw_inputs[SEMANTIC]) == "sha256:191ca5935b501dc6164116cbc10ecaeb3ac1ae8e87e1ec6d3295b65f84508252",
            "Changed frozen independent traversal frames")
    verify_capture(third, raw_inputs[FRAME], final, False)
    verify_capture(semantic, raw_inputs[SEMANTIC], supplement, True)
    require(third["manifest"] == semantic["manifest"] and len(third["rows"]) == 193
            and len(semantic["rows"]) == 182 and semantic["arms"] == SEMANTIC_ARMS
            and semantic["inputDigests"][FRAME] == digest(raw_inputs[FRAME]), "Changed independent continuation population")
    original = {row["fen"]: (i, row) for i, row in enumerate(final["rows"])}
    extra = {row["fen"]: (i, row) for i, row in enumerate(supplement["rows"])}
    jobs = {row["fen"]: row for row in third["engineJobs"]}
    semantic_jobs = {row["fen"]: row for row in semantic["engineJobs"]}
    require(len(original) == len(final["rows"]) and len(extra) == len(supplement["rows"]), "Duplicated independent source FEN")
    reuse_count = supplement_count = 0
    for job in semantic["engineJobs"]:
        require(job["budgets"] == sorted([row["budget"] for row in job["plannedReuse"]] + job["missingBudgets"]), "Crossed independent budget partition")
        for reuse in job["plannedReuse"]:
            require(reuse["frame"] == FRAME and reuse["sourceStatus"] == "awaiting_complete_checked_capture"
                    and reuse["jobId"] == jobs[job["fen"]]["id"]
                    and any(probe["budget"] == reuse["budget"] for probe in original[job["fen"]][1]["probes"]), "Unresolved independent actual reuse")
            reuse_count += 1
        for budget in job["missingBudgets"]:
            require(any(probe["budget"] == budget for probe in extra[job["fen"]][1]["probes"])
                    and not any(probe["budget"] == budget for probe in original.get(job["fen"], (None, {"probes": []}))[1]["probes"]),
                    "Unresolved/conflicting independent supplement")
            supplement_count += 1
    require(supplement_count == sum(len(row["probes"]) for row in supplement["rows"]), "Unused independent supplement")
    profiles, leaves, used = [], {}, {FINAL: set(), SUPPLEMENT: set()}
    for kind, frame, arms in [("engine", third, ENGINE_ARMS), ("semantic_first_reply_reserve", semantic, SEMANTIC_ARMS)]:
        paths, candidates = [], {}
        for item in frame["paths"]:
            selected_by = [arm for arm in item["selectedBy"] if arm in ENGINE_ARMS] if kind == "engine" else list(dict.fromkeys(
                arm for subject in item["subjects"] for arm in subject["selectedBy"]))
            if not selected_by:
                continue
            require(item["id"] == path_id(item["rootId"], item["historyUci"]) and len(item["historyUci"]) == 3, "Crossed independent history identity")
            board = replay(item["rootFen"], item["historyUci"])
            fen, legal_count, reason = board.fen(en_passant="legal"), board.legal_moves.count(), terminal(board)
            require(fen == item["fen"] and legal_count == item["legalReplyCount"]
                    and (kind == "engine" or reason == item["terminalReason"]), "Crossed independent path board/terminal")
            arm_rows = []
            for arm in selected_by:
                require(arm in arms, "Undeclared independent arm")
                _, budget, width, *_ = arm.split(":")
                width = int(width[3:])
                source, selected = None, []
                if reason is None:
                    name = SUPPLEMENT if kind != "engine" and budget in semantic_jobs[fen]["missingBudgets"] else FINAL
                    row_index, row = (extra if name == SUPPLEMENT else original)[fen]
                    matches = [(i, probe) for i, probe in enumerate(row["probes"]) if probe["budget"] == budget]
                    require(len(matches) == 1, "Missing independent final budget")
                    probe_index, probe = matches[0]
                    source = {"source": name, "row": row_index, "budget": budget, "probe": probe_index}
                    used[name].add((fen, budget))
                    for entry in probe["entries"][:width]:
                        history = [*item["historyUci"], entry["moveUci"]]
                        leaf_id = path_id(item["rootId"], history)
                        if leaf_id not in leaves:
                            leaf_board = board.copy()
                            move = chess.Move.from_uci(entry["moveUci"])
                            require(move in leaf_board.legal_moves, "Illegal independent fourth move")
                            leaf_board.push(move)
                            leaves[leaf_id] = {"id": leaf_id, "rootId": item["rootId"], "rootFen": item["rootFen"], "historyUci": history,
                                               "fen": leaf_board.fen(en_passant="legal"), "terminalReason": terminal(leaf_board)}
                        selected.append({"moveUci": entry["moveUci"], "rank": entry["rank"], "leafId": leaf_id})
                arm_rows.append({"arm": arm, "source": source, "selected": selected,
                                 "omittedLegal": legal_count - len(selected) if reason is None else 0,
                                 "unexpandedTerminalLegalMoves": legal_count if reason is not None else 0})
            path = {**item, "terminalReason": reason, "arms": arm_rows}
            paths.append(path)
            candidates.setdefault((item["rootId"], item["historyUci"][0]), []).append(path)
        rows = []
        for item in frame["rows"]:
            arm_rows = []
            for arm in arms:
                earlier = next(value for value in item["arms"] if value["arm"] == arm)
                selected = [path for path in candidates.get((item["rootId"], item["candidateUci"]), [])
                            if any(value["arm"] == arm for value in path["arms"])
                            and (kind == "engine" or any(subject["targetId"] == item["targetId"] and arm in subject["selectedBy"] for subject in path["subjects"]))]
                if kind != "engine":
                    require(sorted(earlier["selectedLearnerPaths"]) == sorted(path["id"] for path in selected), "Lost independent semantic subject")
                chosen = [next(value for value in path["arms"] if value["arm"] == arm) for path in selected]
                arm_rows.append({"arm": arm, "inputSelection": earlier, "selectedPaths": [path["id"] for path in selected],
                                 "selectedFourthPlyEdges": sum(len(value["selected"]) for value in chosen),
                                 "omittedLegalFourthRepliesWithinSelectedNonterminalPaths": sum(value["omittedLegal"] for value in chosen),
                                 "absorbingThirdPlyPaths": [path["id"] for path in selected if path["terminalReason"] is not None],
                                 "universalVerdict": "not_evaluated", "negativeVerdict": "abstain_partial",
                                 "weightAuthority": "unweighted_selected_paths_not_policy_mass"})
            rows.append({**item, "arms": arm_rows})
        require(len({path["id"] for path in paths}) == len(paths), "Duplicated independently selected history")
        profiles.append({"kind": kind, "traversalRule": "same_engine_budget_and_width_at_each_selected_layer" if kind == "engine" else
                         "frozen_one_slot_first_reply_reserve_then_same_engine_budget_and_width_no_recursive_semantic_selector",
                         "arms": arms, "rows": rows, "paths": paths, "candidateCoverage": frame.get("candidateCoverage"), "controls": frame.get("controls")})
    unused = []
    for name, capture in [(FINAL, final), (SUPPLEMENT, supplement)]:
        for row in capture["rows"]:
            for probe in row["probes"]:
                if (row["fen"], probe["budget"]) in used[name]:
                    continue
                reason = terminal(chess.Board(row["fen"]))
                require(reason is not None, "Unused independent nonterminal query")
                unused.append({"source": name, "jobId": row["jobId"], "budget": probe["budget"], "reason": "absorbed_game_terminal", "terminalReason": reason})
    return {"version": 1, "profile": "d3262-coherent-engine-fourth-ply-v1", "manifest": third["manifest"],
            "authority": "actual_partial_provider_paths_not_recursive_semantic_proof_policy_mass_or_engine_reason",
            "inputDigests": {name: digest(raw_inputs[name]) for name in [FRAME, FINAL, SEMANTIC, SUPPLEMENT]},
            "source": third["finalPlyQueries"]["stockfish"], "resolvedReuseQueries": reuse_count, "resolvedSupplementQueries": supplement_count,
            "unusedQueries": unused, "profiles": profiles, "leaves": [leaves[key] for key in sorted(leaves)]}


def verify(output, expected):
    require(type(output.get("version")) is int, "Invalid independent output version")
    require(output.keys() == expected.keys(), "Changed independent output fields")
    for key, value in expected.items():
        require(output[key] == value, "Independent frontier mismatch: " + key)


def negatives(output, expected):
    path = next(path for path in output["profiles"][0]["paths"] if path["terminalReason"] is None)
    arm = next(arm for arm in path["arms"] if arm["selected"] and arm["source"] is not None)
    edits = [(output["profiles"][0], "rows", output["profiles"][0]["rows"][:-1]),
             (output["profiles"][1], "candidateCoverage", output["profiles"][1]["candidateCoverage"][:-1]),
             (path, "historyUci", list(reversed(path["historyUci"]))),
             (arm, "selected", arm["selected"][:-1]),
             (arm["source"], "budget", "wrong"),
             (output["profiles"][1]["rows"][0]["arms"][0], "universalVerdict", "proven"),
             (output["leaves"][0], "fen", "crossed"),
             (output, "resolvedReuseQueries", output["resolvedReuseQueries"] - 1)]
    for target, key, changed in edits:
        original = target[key]
        target[key] = changed
        try:
            try:
                verify(output, expected)
            except AssertionError:
                continue
            raise RuntimeError("Independent actual corruption admitted")
        finally:
            target[key] = original
    return len(edits)


if __name__ == "__main__":
    directory = Path("planning/semantic-consequence-search")
    raw = (directory / OUTPUT).read_bytes()
    output = json.loads(gzip.decompress(raw))
    require(set(output["inputDigests"]) == {FRAME, FINAL, SEMANTIC, SUPPLEMENT}, "Crossed independent input set")
    raw_inputs = {name: (directory / name).read_bytes() for name in output["inputDigests"]}
    require(all(digest(value) == output["inputDigests"][name] for name, value in raw_inputs.items()), "Changed literal independent input bytes")
    inputs = {name: json.loads(gzip.decompress(value) if name.endswith(".gz") else value) for name, value in raw_inputs.items()}
    expected = expected_frontier(inputs, raw_inputs)
    verify(output, expected)
    result = {"digest": digest(raw), "profiles": [{"kind": profile["kind"], "cells": len(profile["rows"]), "paths": len(profile["paths"])}
              for profile in output["profiles"]], "leaves": len(output["leaves"]), "reuseQueries": output["resolvedReuseQueries"],
              "supplementQueries": output["resolvedSupplementQueries"], "terminalQueriesNotExpanded": len(output["unusedQueries"])}
    if "--negative-controls" in sys.argv:
        result["negativeControls"] = negatives(output, expected)
    print(json.dumps(result, indent=2))
