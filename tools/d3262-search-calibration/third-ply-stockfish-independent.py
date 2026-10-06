"""Independent actual final-ply Stockfish source/board/PV replay, no inference.

The numeric evaluations remain literal provider observations, not independently
recomputed scores, semantic proofs or explanations of the root recommendation.
"""
import copy
import gzip
import hashlib
import json
import math
import sys
from pathlib import Path

import chess


def require(value, message):
    if not value:
        raise AssertionError(message)


def digest(raw):
    return "sha256:" + hashlib.sha256(raw).hexdigest()


def verify(frame, frame_bytes, capture, semantic, scope=None):
    expected_scope = scope if scope is not None else ("semantic_third_ply_missing_budgets_only" if semantic else None)
    require(expected_scope in ["semantic_third_ply_missing_budgets_only", "recursive_semantic_third_ply_missing_budgets_only"]
            if semantic else expected_scope is None, "Undeclared independent source scope")
    jobs = frame["supplementJobs"] if semantic else frame["engineJobs"]
    require(type(capture["version"]) is int and capture["version"] == 1 and capture["manifest"] == frame["manifest"]
            and capture["frontierDigest"] == digest(frame_bytes), "Crossed independent source frame")
    require(type(capture["start"]) is int and type(capture["positions"]) is int
            and capture["start"] == 0 and capture["positions"] == len(jobs)
            and len(capture["rows"]) == len(jobs) and capture["partial"] is False,
            "Incomplete independent capture population")
    require(capture.get("captureScope") == expected_scope,
            "Crossed independent capture scope")
    identity = frame["finalPlyQueries"]["stockfish"]
    require(capture["source"] == identity and all(type(capture["source"][key]) is type(value)
            for key, value in identity.items()), "Crossed independent query identity")
    query_count = ranked_count = replayed_moves = 0
    for job, row in zip(jobs, capture["rows"]):
        require(row["jobId"] == job["id"] == digest(job["fen"].encode())
                and row["fen"] == job["fen"], "Crossed independent job/board")
        require(row["budgets"] == job["budgets"] and len(row["probes"]) == len(job["budgets"]),
                "Lost independent budget query")
        board = chess.Board(job["fen"])
        legal = sorted(move.uci() for move in board.legal_moves)
        # Original D3476 provider jobs exclude no-legal-move boards, not every
        # game-outcome terminal. Preserve that source contract; the semantic
        # supplement separately excludes automatic material/75-move terminals.
        require(legal, "Invented legal-move source")
        if semantic:
            require(not board.is_insufficient_material() and board.halfmove_clock < 150,
                    "Invented nonterminal semantic source")
        for budget, probe in zip(job["budgets"], row["probes"]):
            require(probe["budget"] == budget and probe["terminal"] is False, "Crossed independent budget/terminal")
            require(probe["legal"] == legal, "Lost independent legal denominator")
            require(isinstance(probe["elapsedMs"], (float, int)) and not isinstance(probe["elapsedMs"], bool)
                    and math.isfinite(probe["elapsedMs"]) and probe["elapsedMs"] >= 0, "Invalid independent query timing")
            entries = probe["entries"]
            require(len(entries) == min(8, len(legal)) and len({entry["moveUci"] for entry in entries}) == len(entries),
                    "Incomplete independent coherent table")
            require(type(probe["coherentDepth"]) is int and probe["coherentDepth"] > 0
                    and (probe["trailingPartialDepth"] is None or type(probe["trailingPartialDepth"]) is int
                         and probe["trailingPartialDepth"] > probe["coherentDepth"]), "Invalid independent coherent depth")
            require(probe["missingMoves"] == [uci for uci in legal if uci not in {entry["moveUci"] for entry in entries}],
                    "Lost independent unranked tail")
            require(probe["bestmove"] in legal, "Illegal independent bestmove")
            for index, entry in enumerate(entries):
                require(type(entry["rank"]) is int and type(entry["depth"]) is int
                        and entry["rank"] == index + 1 and entry["depth"] == probe["coherentDepth"]
                        and entry["moveUci"] in legal and entry["pv"] and entry["pv"][0] == entry["moveUci"],
                        "Crossed independent rank/PV identity")
                score = entry["score"]
                require(score["kind"] in ["cp", "mate"] and type(score["value"]) is int
                        and type(score["bound"]) is bool, "Invalid independent raw score")
                branch = board.copy()
                for uci in entry["pv"]:
                    try:
                        move = chess.Move.from_uci(uci)
                    except ValueError as error:
                        raise AssertionError("Illegal independent provider PV") from error
                    require(move in branch.legal_moves, "Illegal independent provider PV")
                    branch.push(move)
                    replayed_moves += 1
            query_count += 1
            ranked_count += len(entries)
    chunks = capture["chunkDigests"]
    expected = [{"file": "chunk-%04d-%04d.json" % (start, min(start + 24, len(jobs) - 1)),
                 "positions": min(25, len(jobs) - start)} for start in range(0, len(jobs), 25)]
    require(len(chunks) == len(expected) and all(row["file"] == wanted["file"]
            and row["positions"] == wanted["positions"] and isinstance(row["sha256"], str)
            and row["sha256"].startswith("sha256:") and len(row["sha256"]) == 71
            for row, wanted in zip(chunks, expected)), "Crossed independent interval history")
    return {"positions": len(jobs), "budgetQueries": query_count, "rankedEntries": ranked_count,
            "independentlyReplayedPvMoves": replayed_moves, "intervals": len(chunks)}


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else None
    require(mode in ["semantic", "third-ply", "recursive"], "Pass one declared independent population")
    recursive = mode == "recursive"
    semantic = mode != "third-ply"
    scope = "recursive_semantic_third_ply_missing_budgets_only" if recursive else None
    directory = Path("planning/semantic-consequence-search")
    name = ("d3262-coherent-recursive-semantic-frame.json.gz" if recursive else
            "d3262-coherent-semantic-third-ply.json.gz" if semantic else "d3262-coherent-third-ply-frame.json")
    frame_bytes = (directory / name).read_bytes()
    expected = ("sha256:508c9e84515233e456ba12ed5cf787c8bb1eb14748314de010c5d76e5fa52232" if recursive else
                "sha256:191ca5935b501dc6164116cbc10ecaeb3ac1ae8e87e1ec6d3295b65f84508252" if semantic else
                "sha256:3059fb3a45eb10bdcd56b7a4190bbbcf7370b4bf58750934befabde62712dc07")
    require(digest(frame_bytes) == expected, "Changed independent frozen frame")
    frame = json.loads(gzip.decompress(frame_bytes) if semantic else frame_bytes)
    source_name = ("d3262-stockfish-recursive-third-ply-capture.json.gz" if recursive else
                   "d3262-stockfish-semantic-third-ply-capture.json.gz" if semantic else "d3262-stockfish-third-ply-capture.json.gz")
    capture_bytes = (directory / source_name).read_bytes()
    capture = json.loads(gzip.decompress(capture_bytes))
    refused = []
    if "--negative-controls" in sys.argv:
        mutations = [
            ("lost_position", lambda value: value["rows"].pop(), "population"),
            ("crossed_source", lambda value: value["source"].update({"executableDigest": "other"}), "identity"),
            ("lost_budget", lambda value: value["rows"][0]["probes"].pop(), "budget query"),
            ("lost_legal_move", lambda value: value["rows"][0]["probes"][0]["legal"].pop(), "denominator"),
            ("changed_depth", lambda value: value["rows"][0]["probes"][0]["entries"][0].update({"depth": -1}), "rank/PV"),
            ("illegal_pv", lambda value: value["rows"][0]["probes"][0]["entries"][0]["pv"].append("a1a1"), "provider PV"),
            ("forged_timing", lambda value: value["rows"][0]["probes"][0].update({"elapsedMs": -1}), "timing"),
            ("illegal_bestmove", lambda value: value["rows"][0]["probes"][0].update({"bestmove": "a1a1"}), "bestmove"),
        ]
        for label, mutate, guard in mutations:
            changed = copy.deepcopy(capture)
            mutate(changed)
            try:
                verify(frame, frame_bytes, changed, semantic, scope)
            except (AssertionError, ValueError) as error:
                require(guard in str(error), "Corruption failed at wrong guard: " + label)
                refused.append(label)
            else:
                raise AssertionError("Corruption accepted: " + label)
    summary = verify(frame, frame_bytes, capture, semantic, scope)
    verified_chunks = 0
    if "--with-chunks" in sys.argv:
        chunk_directory = directory / ("d3262-stockfish-recursive-third-ply-chunks" if recursive else
                                       "d3262-stockfish-semantic-third-ply-chunks" if semantic else "d3262-stockfish-third-ply-chunks")
        start = 0
        for record in capture["chunkDigests"]:
            raw = (chunk_directory / record["file"]).read_bytes()
            chunk = json.loads(raw)
            require(digest(raw) == record["sha256"] and chunk["start"] == start
                    and chunk["version"] == 1 and chunk["partial"] is
                    (start != 0 or record["positions"] != capture["positions"])
                    and chunk["positions"] == record["positions"] and chunk["frontierDigest"] == digest(frame_bytes)
                    and chunk["manifest"] == frame["manifest"] and chunk["source"] == capture["source"]
                    and chunk.get("captureScope") == capture.get("captureScope")
                    and chunk["rows"] == capture["rows"][start:start + record["positions"]],
                    "Changed independent original interval bytes")
            start += record["positions"]
            verified_chunks += 1
        require(start == capture["positions"], "Lost independent original interval population")
    print(json.dumps({"captureDigest": digest(capture_bytes), "frameDigest": digest(frame_bytes),
                      "pythonChessVersion": chess.__version__, **summary, "refusedCorruptions": refused,
                      "verifiedLocalIntervalBytes": verified_chunks,
                      "authority": "source_and_legal_PV_replay_not_independent_engine_scores_or_semantic_proof"}, indent=2))


if __name__ == "__main__":
    main()
