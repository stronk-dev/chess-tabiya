#!/usr/bin/env python3
"""E4 Maia coherence harness — DISPOSABLE research instrument (Q5/E4).

Self-plays continuations from curated roots under each policy condition,
recording PGN + per-move JSONL (move, engine eval). Not product code; lives
inside the research container only. See README.md and
design/research/e4-maia-coherence-protocol.md.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import chess
import chess.engine
import chess.pgn

HERE = Path(__file__).parent
OUT = Path(os.environ.get("HARNESS_OUT", HERE / "out"))
PLIES = int(os.environ.get("HARNESS_PLIES", "24"))
GAMES = int(os.environ.get("HARNESS_GAMES", "5"))
EVAL_MS = int(os.environ.get("HARNESS_EVAL_MS", "150"))

MAIA_CMD = os.environ.get("MAIA_CMD", "maia3").split()
SF_CMD = os.environ.get("SF_CMD", "stockfish").split()

CONDITIONS = [
    # id, engine, uci options
    ("m1-maia5m-1600", "maia", {"Elo": 1600, "Temperature": 0.8, "TopP": 0.92}),
    ("m2-maia5m-1800", "maia", {"Elo": 1800, "Temperature": 0.8, "TopP": 0.92}),
    ("m3-maia5m-2000", "maia", {"Elo": 2000, "Temperature": 0.8, "TopP": 0.92}),
    ("c1-weak-sf-1800", "stockfish", {"UCI_LimitStrength": True, "UCI_Elo": 1800}),
    ("c2-full-sf", "stockfish", {}),
]
# m4 (23M model) is selected via MAIA_CMD pointing at the larger model; run
# separately with HARNESS_CONDITION=m4-maia23m-1800.

ONLY = os.environ.get("HARNESS_CONDITION")


def load_positions():
    data = json.loads((HERE / "positions.json").read_text())
    for entry in data["positions"]:
        board = chess.Board()
        if "fen" in entry:
            board = chess.Board(entry["fen"])
        else:
            for san in entry["moves"]:
                board.push_san(san)  # raises loudly on an illegal root — by design
        yield entry["id"], entry["family"], board


def apply_options(engine, options):
    for name, value in options.items():
        if name in engine.options:
            engine.configure({name: value})
        else:
            print(f"  ! option {name} not exposed by engine; recorded as skipped")


def play_condition(cond_id, engine_kind, options, evaluator):
    cmd = MAIA_CMD if engine_kind == "maia" else SF_CMD
    limit = (
        chess.engine.Limit(time=0.1)
        if engine_kind == "stockfish"
        else chess.engine.Limit(nodes=1)
    )
    cond_dir = OUT / cond_id
    cond_dir.mkdir(parents=True, exist_ok=True)
    records = open(cond_dir / "records.jsonl", "a", encoding="utf-8")

    with chess.engine.SimpleEngine.popen_uci(cmd) as engine:
        apply_options(engine, options)
        for pos_id, family, root in load_positions():
            for game_index in range(GAMES):
                board = root.copy()
                game = chess.pgn.Game()
                game.headers.update(
                    Event=f"e4-harness/{cond_id}",
                    Site=pos_id,
                    Round=str(game_index + 1),
                    FEN=root.fen(),
                    SetUp="1",
                )
                node = game
                for ply in range(PLIES):
                    if board.is_game_over():
                        break
                    result = engine.play(board, limit)
                    move = result.move
                    info = evaluator.analyse(
                        board, chess.engine.Limit(time=EVAL_MS / 1000)
                    )
                    score = info["score"].white().score(mate_score=10000)
                    records.write(
                        json.dumps(
                            {
                                "condition": cond_id,
                                "position": pos_id,
                                "family": family,
                                "game": game_index,
                                "ply": ply,
                                "fen": board.fen(),
                                "move": move.uci(),
                                "evalCpWhite": score,
                            }
                        )
                        + "\n"
                    )
                    board.push(move)
                    node = node.add_variation(move)
                out = cond_dir / f"{pos_id}-g{game_index + 1}.pgn"
                out.write_text(str(game) + "\n", encoding="utf-8")
            print(f"  {cond_id} / {pos_id}: {GAMES} games done")
    records.close()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {
        "startedAt": datetime.now(timezone.utc).isoformat(),
        "plies": PLIES,
        "games": GAMES,
        "maiaCmd": MAIA_CMD,
        "sfCmd": SF_CMD,
    }
    (OUT / "run-meta.json").write_text(json.dumps(meta, indent=2))
    with chess.engine.SimpleEngine.popen_uci(SF_CMD) as evaluator:
        for cond_id, kind, options in CONDITIONS:
            if ONLY and cond_id != ONLY:
                continue
            print(f"condition {cond_id} ({kind})")
            play_condition(cond_id, kind, options, evaluator)
    print("done — analyze with analyze.py, review PGNs blinded per protocol")


if __name__ == "__main__":
    sys.exit(main())
