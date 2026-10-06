"""Independent D3483 source-rank/legal-path/job replay, no engine or model load.

The first-reply reserve stays frozen. No recursive semantic selection/proof claim.
"""
import copy
import gzip
import hashlib
import json
import sys
from pathlib import Path

import chess


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
        require(terminal(board) is None and move in board.legal_moves, "Illegal independently selected semantic path")
        board.push(move)
    return board


def load(output, directory):
    inputs = {}
    for name, expected in output["inputDigests"].items():
        raw = (directory / name).read_bytes()
        require(digest(raw) == expected, "Changed independent semantic input")
        inputs[name] = json.loads(raw)
    require(output["inputDigests"]["d3262-coherent-third-ply-frame.json"]
            == "sha256:3059fb3a45eb10bdcd56b7a4190bbbcf7370b4bf58750934befabde62712dc07", "Changed frozen running frame")
    return inputs


def verify(output, inputs):
    comparison = inputs["d3262-coherent-target-comparison-frame.json"]
    frame = inputs["d3262-coherent-root-frame.json"]
    reserve = inputs["d3262-coherent-semantic-reserve.json"]
    prior = inputs["d3262-coherent-third-ply-frame.json"]
    roots = {row["rootId"]: row for row in frame["roots"]}
    key = lambda row: (row["rootId"], row["targetId"], row["candidateUci"])
    rows = {key(row): row for row in output["rows"]}
    require(len(output["rows"]) == len(rows) == 182 and set(rows) == {key(row) for row in comparison["comparisons"]}, "Lost semantic cell population")
    require(output["profile"] == "d3262-coherent-semantic-third-ply-v1"
            and output["manifest"] == frame["manifest"] and output["controls"] == comparison["controls"], "Crossed independent semantic profile/controls")
    selected = {(key(row), "semantic:%s:top%d:%s" % (row["budget"], row["width"], row["eventSourceWidth"])): row for row in reserve["rows"]}
    bindings = {}
    for name in ["d3262-coherent-deeper-source-union.json", "d3262-coherent-semantic-source-union.json"]:
        for row in inputs[name]["bindings"]:
            bindings.setdefault((row["rootId"], row["candidateUci"], row["replyUci"]), (name, row))
    expected_paths, candidate_coverage = {}, []
    board_cache = {}
    for root in frame["roots"]:
        for candidate in root["candidates"]:
            target_ids = [row["targetId"] for row in comparison["comparisons"] if row["rootId"] == root["rootId"] and row["candidateUci"] == candidate["moveUci"]]
            control = next((row for row in comparison["controls"] if row["rootId"] == root["rootId"]), None)
            status = "named_target_paths_declared" if target_ids else "declared_control_separate_not_evaluated" if control and control["status"] == "declared_relation_control" else "no_autonomous_semantic_target"
            candidate_coverage.append({"rootId": root["rootId"], "candidateUci": candidate["moveUci"], "phase": root["phase"], "targetIds": target_ids, "status": status})
    require(output["candidateCoverage"] == candidate_coverage and len(candidate_coverage) == 193, "Lost semantic offered candidate/control")
    for pair in comparison["comparisons"]:
        row = rows[key(pair)]
        root = roots[pair["rootId"]]
        require(row["phase"] == root["phase"] and row["sourceObserved"] == pair["sourceObserved"], "Crossed semantic phase/source")
        child = replay(root["fen"], [pair["candidateUci"]])
        require(row["legalReplyCount"] == len(list(child.legal_moves)) and [arm["arm"] for arm in row["arms"]] == output["arms"], "Crossed semantic legal/arm population")
        replies = {reply["replyUci"]: reply for reply in row["replies"]}
        used_replies = set()
        for arm in row["arms"]:
            original = selected[(key(pair), arm["arm"])]
            require(arm["selectedReplyUcis"] == original["selected"], "Changed frozen semantic reserve")
            expected_ids, absorbed, legal_edges = [], [], 0
            for reply in original["selected"]:
                used_replies.add(reply)
                source_key = (pair["rootId"], pair["candidateUci"], reply)
                if source_key not in board_cache:
                    board_cache[source_key] = replay(root["fen"], [pair["candidateUci"], reply])
                board = board_cache[source_key]
                reason = terminal(board)
                register, binding = bindings[source_key]
                capture = inputs[binding["stockfish"]["source"]]["rows"][binding["stockfish"]["row"]]
                recorded = replies[reply]
                require(recorded["fen"] == capture["fen"] == board.fen(en_passant="legal") and recorded["terminalReason"] == reason, "Crossed semantic reply board/source")
                require(recorded["sourceBinding"] == {"register": register, **binding["stockfish"]}, "Crossed semantic provider binding")
                legal_count = len(list(board.legal_moves))
                require(recorded["legalLearnerCount"] == legal_count, "Crossed semantic learner denominator")
                legal_edges += legal_count
                probe = next(probe for probe in capture["probes"] if probe["budget"] == original["budget"])
                moves = [entry["moveUci"] for entry in probe["entries"][:original["width"]]] if reason is None else []
                recorded_arm = next(entry for entry in recorded["arms"] if entry["arm"] == arm["arm"])
                require([entry["learnerUci"] for entry in recorded_arm["selected"]] == moves
                        and recorded_arm["unvisitedLegal"] == legal_count - len(moves), "Changed actual semantic learner selection")
                if reason is not None:
                    absorbed.append(reply)
                for move in moves:
                    history = [pair["candidateUci"], reply, move]
                    identity = path_id(pair["rootId"], history)
                    expected_ids.append(identity)
                    if identity not in expected_paths:
                        after = replay(root["fen"], history)
                        expected_paths[identity] = {"id": identity, "rootId": pair["rootId"], "rootFen": root["fen"], "historyUci": history,
                            "fen": after.fen(en_passant="legal"), "legalReplyCount": len(list(after.legal_moves)), "terminalReason": terminal(after), "subjects": {}}
                    expected_paths[identity]["subjects"].setdefault(pair["targetId"], set()).add(arm["arm"])
                require([entry["pathId"] for entry in recorded_arm["selected"]] == expected_ids[-len(moves):] if moves else not recorded_arm["selected"], "Crossed semantic learner path ids")
            require(arm["selectedLearnerPaths"] == expected_ids, "Changed semantic selected path population")
            require(arm["selectedReplies"] == len(original["selected"]) and arm["unvisitedReplies"] == row["legalReplyCount"] - len(original["selected"])
                    and arm["unvisitedLearnerEdgesWithinSelectedReplies"] == legal_edges - len(expected_ids)
                    and arm["absorbingReplyUcis"] == absorbed, "Lost semantic omissions/terminal")
            require(arm["universalVerdict"] == "not_evaluated", "Forged semantic universal proof")
        require(set(replies) == used_replies and len(row["replies"]) == len(used_replies), "Lost or invented semantic first reply")
    paths = sorted(expected_paths.values(), key=lambda row: row["id"])
    for path in paths:
        path["subjects"] = [{"targetId": target, "selectedBy": sorted(arms)} for target, arms in sorted(path["subjects"].items())]
    require(output["paths"] == paths, "Changed independently reconstructed semantic path")
    jobs = {}
    for path in paths:
        if path["terminalReason"] is not None:
            continue
        job = jobs.setdefault(path["fen"], {"id": digest(path["fen"].encode()), "fen": path["fen"], "paths": [], "budgets": set()})
        job["paths"].append(path["id"])
        job["budgets"].update(arm.split(":")[1] for subject in path["subjects"] for arm in subject["selectedBy"])
    prior_jobs = {job["fen"]: job for job in prior["engineJobs"]}
    expected_jobs = sorted(jobs.values(), key=lambda row: row["id"])
    for job in expected_jobs:
        job["budgets"] = sorted(job["budgets"])
        existing = prior_jobs.get(job["fen"])
        job["plannedReuse"] = [{"frame": "d3262-coherent-third-ply-frame.json", "jobId": existing["id"], "budget": budget,
                                "sourceStatus": "awaiting_complete_checked_capture"} for budget in job["budgets"] if existing and budget in existing["budgets"]]
        job["missingBudgets"] = [budget for budget in job["budgets"] if not existing or budget not in existing["budgets"]]
    require(output["engineJobs"] == expected_jobs, "Changed semantic source jobs/planned reuse")
    supplement = [{"id": job["id"], "fen": job["fen"], "paths": job["paths"], "budgets": job["missingBudgets"]} for job in expected_jobs if job["missingBudgets"]]
    require(output["supplementJobs"] == supplement, "Lost semantic supplemental query budget")
    return {"cells": 182, "arms": 3276, "candidates": 193, "paths": len(paths), "engineJobs": len(expected_jobs), "supplementJobs": len(supplement)}


def main():
    directory = Path("planning/semantic-consequence-search")
    raw = (directory / "d3262-coherent-semantic-third-ply.json.gz").read_bytes()
    logical = gzip.decompress(raw)
    output = json.loads(logical)
    inputs = load(output, directory)
    controls = []
    mutations = [
        ("missing-cell", lambda value: value["rows"].pop(), "Lost semantic cell population"),
        ("missing-offered-candidate", lambda value: value["candidateCoverage"].pop(), "Lost semantic offered candidate/control"),
        ("changed-selected-history", lambda value: value["paths"][0]["historyUci"].reverse(), "Changed independently reconstructed semantic path"),
        ("changed-board", lambda value: value["paths"][0].__setitem__("fen", "changed"), "Changed independently reconstructed semantic path"),
        ("invented-universal-proof", lambda value: value["rows"][0]["arms"][0].__setitem__("universalVerdict", "proved"), "Forged semantic universal proof"),
        ("planned-source-as-captured", lambda value: next(job for job in value["engineJobs"] if job["plannedReuse"])["plannedReuse"][0].__setitem__("sourceStatus", "captured"), "Changed semantic source jobs/planned reuse"),
        ("lost-supplement-budget", lambda value: value["supplementJobs"][0]["budgets"].pop(), "Lost semantic supplemental query budget"),
    ]
    if "--negative-controls" in sys.argv:
        for name, mutate, expected in mutations:
            changed = copy.deepcopy(output)
            mutate(changed)
            try:
                verify(changed, inputs)
            except AssertionError as error:
                require(str(error) == expected, "Unrelated negative guard: " + name + ": " + str(error))
                controls.append(name)
                print("D3483 independent negative refused: " + name, file=sys.stderr, flush=True)
            else:
                raise AssertionError("Independent semantic checker admitted mutation: " + name)
    print(json.dumps({"digest": digest(raw), "logicalDigest": digest(logical), **verify(output, inputs), "negativeControls": controls}, indent=2))


if __name__ == "__main__":
    main()
