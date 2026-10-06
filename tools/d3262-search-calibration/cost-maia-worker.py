"""Disposable D3262 offline Maia source; NDJSON requests retain ordered history.

This is an evidence instrument, not a production opponent/search implementation.
Only the packaged local model is loaded. stdout is exclusively protocol bytes.
"""
import contextlib
import hashlib
import json
import platform
import sys
from pathlib import Path

import chess
import torch
from torch.amp import autocast
from maia3.dataset import get_legal_moves_mask
from maia3.uci import Maia3UCIEngine
from maia_capture_runtime import pinned_cfg


def sha(path):
    return "sha256:" + hashlib.sha256(Path(path).read_bytes()).hexdigest()


def require(value, message):
    if not value:
        raise AssertionError(message)


def emit(value):
    print(json.dumps(value, separators=(",", ":"), allow_nan=False), flush=True)


def capture(engine, cfg, operands):
    require(set(operands) == {"provider", "sourceDigest", "rootFen", "historyUci", "selfElo",
                             "opponentElo", "temperature", "topP"}, "Crossed query fields")
    require(operands["provider"] == "maia" and operands["selfElo"] == operands["opponentElo"] == 1400
            and operands["temperature"] == 0.8 and operands["topP"] == 0.92, "Crossed model configuration")
    board = chess.Board(operands["rootFen"])
    for uci in operands["historyUci"]:
        require(not board.is_game_over(claim_draw=False), "Continuation after absorbing terminal")
        move = chess.Move.from_uci(uci)
        require(move in board.legal_moves, "Illegal ordered history")
        board.push(move)
    require(not board.is_game_over(claim_draw=False), "Terminal must not query model")
    engine.cmd_position("position fen " + operands["rootFen"] +
                        (" moves " + " ".join(operands["historyUci"]) if operands["historyUci"] else ""))
    require(engine.board.fen() == board.fen() and len(engine.history) == len(operands["historyUci"]) + 1,
            "Model root/history replay differs")
    tokens = engine._tokens_from_history(engine.history).unsqueeze(0).to(cfg.device)
    self_elos = torch.tensor([1400], dtype=torch.long, device=cfg.device)
    oppo_elos = torch.tensor([1400], dtype=torch.long, device=cfg.device)
    with torch.no_grad(), autocast("cuda", enabled=cfg.use_amp and cfg.device.startswith("cuda")):
        logits_move, _value, _aux = engine.model(tokens, self_elos, oppo_elos)
    mask = get_legal_moves_mask(board, engine.all_moves_dict).to(cfg.device)
    require(bool(mask.any()), "Nonterminal model mask is empty")
    logits = logits_move[0].float().masked_fill(~mask, float("-inf"))
    raw = torch.softmax(logits, dim=-1)
    configured = torch.softmax(logits / engine.temperature, dim=-1)
    masses, indices = torch.sort(configured, descending=True)
    cumulative = torch.cumsum(masses, dim=-1)
    kept = cumulative <= engine.top_p
    kept[0] = True
    normalized = masses[kept] / masses[kept].sum()
    identities = {}
    full = []
    for index in torch.nonzero(mask, as_tuple=False).flatten().tolist():
        move = engine._move_from_index(index)
        require(move is not None and move in board.legal_moves, "Model legal-mask identity is invalid")
        identities[index] = move.uci()
        full.append(dict(legalUci=move.uci(), index=index, logit=float(logits[index].item()),
                         mass=float(raw[index].item())))
    require(len(identities) == len({x["legalUci"] for x in full}) == board.legal_moves.count(),
            "Model mask is not the complete unique legal population")
    order = [dict(legalUci=identities[index], index=index, mass=float(masses[rank].item()),
                  cumulativeMass=float(cumulative[rank].item()), kept=bool(kept[rank].item()))
             for rank, index in enumerate(indices.tolist()) if index in identities]
    support = [dict(legalUci=identities[index], mass=float(mass))
               for index, mass in zip(indices[kept].tolist(), normalized.tolist())]
    return dict(version=1, operands=operands, fen=board.fen(en_passant="legal"),
                historyFrames=len(engine.history), tokens=tokens[0].tolist(), vocabularySize=len(logits),
                rawFullLegal=sorted(full, key=lambda x: x["legalUci"]), samplerOrder=order,
                configuredSupport=support, authority="configured_model_policy_not_human_frequency_or_move_reason")


def main():
    # Model/UCI initialization may print; never admit that text as source protocol.
    with contextlib.redirect_stdout(sys.stderr):
        torch.set_num_threads(1)
        cfg = pinned_cfg()
        engine = Maia3UCIEngine(cfg)
        engine.ensure_model_loaded()
        engine.self_elo = engine.oppo_elo = 1400
        engine.temperature, engine.top_p = 0.8, 0.92
    emit(dict(kind="ready", protocol="d3262-cost-maia-v1",
              modelCheckpointSha256=sha(cfg.checkpoint_path),
              uciSourceSha256=sha(sys.modules["maia3.uci"].__file__),
              workerDigest=sha(__file__), runtimeDigest=sha(Path(__file__).with_name("maia_capture_runtime.py")),
              torchVersion=torch.__version__, pythonVersion=platform.python_version(),
              device=cfg.device, threads=torch.get_num_threads(), useUciHistory=cfg.use_uci_history))
    for line in sys.stdin:
        request = json.loads(line)
        if request.get("kind") == "quit":
            return
        try:
            require(request.get("kind") == "query" and isinstance(request.get("id"), int), "Invalid request")
            with contextlib.redirect_stdout(sys.stderr):
                value = capture(engine, cfg, request["operands"])
            emit(dict(kind="result", id=request["id"], payload=value))
        except Exception as error:
            emit(dict(kind="failure", id=request.get("id"), state="invalid", message=str(error)))


if __name__ == "__main__":
    main()
