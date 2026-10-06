"""Independent python-chess replay of the disposable D3262 three-ply job frame.

Use the existing pinned Maia image for python-chess, without loading the model
or requesting providers. Read-only input; no fixture or production file writes.
"""
import hashlib
import json
from pathlib import Path

import chess


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def digest(value):
    return "sha256:" + hashlib.sha256(value).hexdigest()


def main():
    # The retained chessops and Maia artifacts use legal-en-passant FENs,
    # not an unconditional double-push square. Do not erase a legal EP right.
    ep = chess.Board("4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1")
    ep.push_uci("e2e4")
    require(ep.fen().split()[3] == "e3", "Legal en-passant control was erased")
    no_ep = chess.Board()
    no_ep.push_uci("e2e4")
    require(no_ep.fen().split()[3] == "-", "Unavailable en-passant control changed")
    directory = Path("planning/semantic-consequence-search")
    data = (directory / "d3262-coherent-third-ply-frame.json").read_bytes()
    artifact = json.loads(data)
    require(artifact["profile"] == "d3262-coherent-third-ply-v1", "Crossed third-ply profile")
    for name, expected in artifact["inputDigests"].items():
        require(digest((directory / name).read_bytes()) == expected, "Changed input: " + name)
    roots = json.loads((directory / "d3262-coherent-root-frame.json").read_bytes())["roots"]
    roots = {root["rootId"]: root for root in roots}
    paths = {path["id"]: path for path in artifact["paths"]}
    require(len(paths) == len(artifact["paths"]), "Duplicated path identity")
    for path in paths.values():
        require(path["rootFen"] == roots[path["rootId"]]["fen"], "Crossed root FEN")
        require(len(path["historyUci"]) == 3, "Wrong retained history length")
        identity = json.dumps([path["rootId"], *path["historyUci"]], separators=(",", ":")).encode()
        require(path["id"] == digest(identity), "Crossed ordered path id")
        board = chess.Board(path["rootFen"])
        for uci in path["historyUci"]:
            move = chess.Move.from_uci(uci)
            require(move in board.legal_moves, "Illegal retained move " + path["id"] + "/" + uci)
            board.push(move)
        require(board.fen() == path["fen"], "Crossed continuation FEN " + path["id"])
        require(board.legal_moves.count() == path["legalReplyCount"], "Lost final-ply legal denominator")
    engine_paths = set()
    engine_fens = set()
    for job in artifact["engineJobs"]:
        require(job["id"] == digest(job["fen"].encode()), "Crossed engine job id")
        require(job["fen"] not in engine_fens, "Duplicate engine FEN job")
        engine_fens.add(job["fen"])
        expected_budgets = set()
        for identity in job["paths"]:
            path = paths[identity]
            require(path["fen"] == job["fen"] and path["legalReplyCount"] > 0, "Crossed engine path binding")
            require(any(arm.startswith("engine:") for arm in path["selectedBy"]), "Engine job outside its arm")
            require(identity not in engine_paths, "Duplicated engine path binding")
            engine_paths.add(identity)
            expected_budgets.update(arm.split(":")[1] for arm in path["selectedBy"] if arm.startswith("engine:"))
        require(job["budgets"] == sorted(expected_budgets), "Lost or invented engine budget job")
    expected_engine = {path["id"] for path in paths.values() if path["legalReplyCount"] > 0
                       and any(arm.startswith("engine:") for arm in path["selectedBy"])}
    require(engine_paths == expected_engine, "Missing or invented engine jobs")
    maia_ids = [job["id"] for job in artifact["maiaJobs"]]
    expected_maia = {path["id"] for path in paths.values() if path["legalReplyCount"] > 0
                     and any(arm.startswith("maia:") for arm in path["selectedBy"])}
    require(len(maia_ids) == len(set(maia_ids)) and set(maia_ids) == expected_maia, "Missing or collapsed Maia jobs")
    for job in artifact["maiaJobs"]:
        original = {key: value for key, value in paths[job["id"]].items() if key != "selectedBy"}
        require(job == original, "Crossed Maia history job")
    expected_paths = set()
    for row in artifact["rows"]:
        root = roots[row["rootId"]]
        board = chess.Board(root["fen"])
        board.push_uci(row["candidateUci"])
        require(board.legal_moves.count() == row["legalReplyCount"], "Lost initial legal denominator")
        for reply in row["replies"]:
            child = board.copy()
            child.push_uci(reply["replyUci"])
            require(child.legal_moves.count() == reply["legalLearnerCount"], "Lost learner legal denominator")
            for arm in reply["arms"]:
                for learner in arm["selected"]:
                    key = json.dumps([row["rootId"], row["candidateUci"], reply["replyUci"], learner], separators=(",", ":")).encode()
                    identity = digest(key)
                    require(identity in paths and arm["arm"] in paths[identity]["selectedBy"], "Lost arm/path binding")
                    expected_paths.add(identity)
    require(expected_paths == set(paths), "Unconsumed continuation paths")
    print(json.dumps({"artifactDigest": digest(data), "pythonChessVersion": chess.__version__,
                      "independentlyReplayedPaths": len(paths), "engineJobs": len(engine_fens),
                      "maiaHistoryJobs": len(maia_ids), "authority": "legal_replay_not_search_proof"}, indent=2))


if __name__ == "__main__":
    main()
