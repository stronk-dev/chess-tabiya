"""Independent D3490 actual recursive selection/board/source completion.

Uses the independently reconstructed frozen frame, never its completion output
as an expected image. No engine score re-inference or strategic truth claim.
"""
import copy
import gzip
import json
import runpy
import sys
from pathlib import Path

import chess

HERE = Path(__file__).parent
helpers = runpy.run_path(str(HERE / "coherent-recursive-semantic-check.py"))
require, digest, ident, same_json, reserve, terminal = [helpers[n] for n in
    ["require", "digest", "ident", "same_json", "reserve", "terminal"]]
source_verify = runpy.run_path(str(HERE / "third-ply-stockfish-independent.py"))["verify"]
DIRECTORY = Path("planning/semantic-consequence-search")
NAMES = ["d3262-coherent-recursive-semantic-frame.json.gz", "d3262-stockfish-third-ply-capture.json.gz",
         "d3262-stockfish-semantic-third-ply-capture.json.gz", "d3262-stockfish-recursive-third-ply-capture.json.gz"]
OUTPUT = "d3262-coherent-recursive-fourth-ply.json.gz"
FRAME_DIGEST = "sha256:508c9e84515233e456ba12ed5cf787c8bb1eb14748314de010c5d76e5fa52232"


def selected_leaf(fen, root_id, history, uci):
    board = chess.Board(fen); move = chess.Move.from_uci(uci)
    require(move in board.legal_moves, "selected legal move"); board.push(move)
    return dict(moveUci=uci, leafId=ident([root_id, *history, uci]),
                fen=board.fen(en_passant="legal"), terminalReason=terminal(board))


def reconstruct(frame, frame_bytes, sources, digests):
    require(digest(frame_bytes) == FRAME_DIGEST and frame["providerOff"] is False, "frozen frame identity")
    for name in NAMES[1:3]:
        require(frame["inputDigests"][name] == digests[name], "reused source identity")
    for capture in sources.values():
        require(capture["partial"] is False and same_json(capture["source"], frame["finalPlyQueries"]["stockfish"]), "query identity")
    source_verify(frame, frame_bytes, sources[NAMES[3]], True, "recursive_semantic_third_ply_missing_budgets_only")
    added = {row["fen"]: i for i, row in enumerate(sources[NAMES[3]]["rows"])}
    paths = {p["id"]: p for p in frame["paths"]}
    nodes = {n["id"]: n for n in frame["eventNodes"]}
    jobs = []
    for old in frame["engineJobs"]:
        bindings = old["actualReuse"] + [dict(source=NAMES[3], row=added[old["fen"]], budget=budget,
                    sourceStatus="actual_checked_captured_query") for budget in old["missingBudgets"]]
        jobs.append(dict(old, missingBudgets=[], actualReuse=bindings))
    by_fen = {job["fen"]: job for job in jobs}
    rank_cache, leaves, final = {}, {}, []
    for prior in frame["finalPlyNodes"]:
        if prior["status"] == "absorbing_terminal":
            final.append(prior)
            continue
        path, node = paths[prior["pathId"]], nodes[prior["nodeId"]]
        _, budget, width, _ = prior["arm"].split(":")
        binding = next(r for r in by_fen[path["fen"]]["actualReuse"] if r["budget"] == budget)
        key = (binding["source"], binding["row"], budget)
        if key not in rank_cache:
            row = sources[binding["source"]]["rows"][binding["row"]]
            require(row["fen"] == path["fen"], "source FEN")
            probes = [p for p in row["probes"] if p["budget"] == budget]
            require(len(probes) == 1, "source budget")
            probe, board = probes[0], chess.Board(path["fen"])
            legal = sorted(m.uci() for m in board.legal_moves)
            entries = probe["entries"]; ranked = [e["moveUci"] for e in entries]
            require(probe["legal"] == legal and len(ranked) == min(8, len(legal)) and len(set(ranked)) == len(ranked)
                    and probe["missingMoves"] == [m for m in legal if m not in ranked], "rank legal denominator")
            for i, entry in enumerate(entries):
                require(type(entry["rank"]) is int and entry["rank"] == i + 1 and type(entry["depth"]) is int
                        and entry["depth"] == probe["coherentDepth"] and entry["pv"][0] == entry["moveUci"], "coherent rank")
                replay = board.copy()
                for uci in entry["pv"]:
                    move = chess.Move.from_uci(uci); require(move in replay.legal_moves, "provider PV"); replay.push(move)
            rank_cache[key] = ranked
        selection = reserve(node["legal"], rank_cache[key], [e["uci"] for e in node["events"]], int(width[3:]))
        selected = []
        for uci in selection["selected"]:
            leaf_id = ident([path["rootId"], *path["historyUci"], uci])
            if leaf_id not in leaves:
                leaves[leaf_id] = selected_leaf(path["fen"], path["rootId"], path["historyUci"], uci)
            selected.append(leaves[leaf_id])
        result = dict(pathId=prior["pathId"], targetId=prior["targetId"], arm=prior["arm"], nodeId=prior["nodeId"],
                      source=binding, **dict(selection, selected=selected), unexpandedTerminalLegalMoves=0)
        if prior["status"] != "source_off":
            require(same_json(result, prior), "changed existing selection")
        final.append(result)
    expected = dict(frame, profile="d3262-coherent-recursive-fourth-ply-v1",
                    authority="disposable_actual_recursive_geometry_selected_paths_not_profit_proof_or_complete_arm5",
                    frozenFrameDigest=FRAME_DIGEST, inputDigests=digests, finalPlyNodes=final, engineJobs=jobs, supplementJobs=[])
    return expected, dict(finalPlyNodes=len(final), independentlyReplayedLeaves=len(leaves), actualQueries=len(rank_cache),
                          sourceOff=sum(n["status"] == "source_off" for n in final))


def verify_output(value, expected):
    require(same_json(value, expected), "recursive fourth-ply independent image differs")


def main():
    raws = {name: (DIRECTORY / name).read_bytes() for name in NAMES}
    values = {name: json.loads(gzip.decompress(raw)) for name, raw in raws.items()}
    expected, summary = reconstruct(values[NAMES[0]], raws[NAMES[0]], {name: values[name] for name in NAMES[1:]},
                                    {name: digest(raw) for name, raw in raws.items()})
    raw = (DIRECTORY / OUTPUT).read_bytes(); actual = json.loads(gzip.decompress(raw))
    verify_output(actual, expected)
    refused = []
    if "--negative-controls" in sys.argv:
        mutations = [
            ("lost_candidate", lambda v: v["candidateCoverage"].pop()),
            ("lost_path", lambda v: v["paths"].pop()),
            ("forged_proof", lambda v: v.update(authority="complete_strategic_proof")),
            ("changed_learner_selection", lambda v: v["rows"][0]["arms"][0]["replies"].pop()),
            ("lost_final_node", lambda v: v["finalPlyNodes"].pop()),
            ("illegal_selected_move", lambda v: v["finalPlyNodes"][0]["selected"][0].update(moveUci="a1a1")),
            ("false_leaf_fen", lambda v: v["finalPlyNodes"][0]["selected"][0].update(fen=chess.STARTING_FEN)),
            ("erased_omission", lambda v: v["finalPlyNodes"][0].update(omittedLegal=-1)),
            ("crossed_source", lambda v: v["finalPlyNodes"][0]["source"].update(row=-1)),
            ("invented_new_missing_job", lambda v: v["supplementJobs"].append({})),
        ]
        for label, mutate in mutations:
            changed = copy.deepcopy(actual); mutate(changed)
            try:
                verify_output(changed, expected)
            except AssertionError:
                refused.append(label)
            else:
                raise AssertionError("Accepted corruption: " + label)
    print(json.dumps(dict(check="independent-python-chess-recursive-fourth-ply", digest=digest(raw),
                         **summary, corruptionRefusals=len(refused), result="passed")))


if __name__ == "__main__":
    main()
