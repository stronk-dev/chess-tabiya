"""Independently replay and re-infer the frozen 1,401 final-ply model requests.

Read-only, offline. Does not use the capture's distribution function or load
policy from a FEN cache. This proves pinned model outputs, not human frequency.
"""
import hashlib
import json
import sys
from pathlib import Path

import chess
import torch
from maia3.dataset import get_legal_moves_mask
from maia3.uci import Maia3UCIEngine
from maia_capture_runtime import pinned_cfg


def require(value, message):
    if not value:
        raise AssertionError(message)


def digest(path):
    return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    root = Path("planning/semantic-consequence-search")
    source_path = root / "d3262-maia-third-ply-capture.json"
    source = json.loads(source_path.read_bytes())
    frame_path = root / "d3262-coherent-third-ply-frame.json"
    frame = json.loads(frame_path.read_bytes())
    require(digest(frame_path) == "sha256:3059fb3a45eb10bdcd56b7a4190bbbcf7370b4bf58750934befabde62712dc07",
            "Changed independent frozen request frame")
    require(source["version"] == 1 and source["partial"] is False
            and source["positions"] == len(source["rows"]) == len(frame["maiaJobs"]) == 1401,
            "Incomplete independent Maia population")
    require(source["source"] == frame["finalPlyQueries"]["maia"], "Crossed independent model configuration")
    for name, expected in source["inputDigests"].items():
        require(digest(root / name) == expected, "Crossed independent source input " + name)
    cfg = pinned_cfg()
    engine = Maia3UCIEngine(cfg)
    engine.ensure_model_loaded()
    engine.self_elo = engine.oppo_elo = 1400
    require(source["source"]["modelCheckpointSha256"] == digest(Path(cfg.checkpoint_path)), "Changed model weights")
    require(source["source"]["uciSourceSha256"] == digest(Path(sys.modules["maia3.uci"].__file__)), "Changed UCI adapter")
    maximum_raw_delta = maximum_policy_delta = 0.0
    terminal = recomputed = 0
    for index, (job, row) in enumerate(zip(frame["maiaJobs"], source["rows"])):
        require(job["id"] == row["id"] and job["historyUci"] == row["historyUci"], "Crossed exact model path")
        board = chess.Board(job["rootFen"])
        for uci in job["historyUci"]:
            board.push_uci(uci)
        require(board.fen() == row["fen"] == job["fen"], "Crossed independently replayed FEN")
        legal = sorted(move.uci() for move in board.legal_moves)
        require(legal == row["legalUcis"], "Lost independently replayed legal denominator")
        outcome = board.outcome(claim_draw=False)
        require(row["terminal"] == (outcome is not None), "False terminal source")
        if outcome is not None:
            require(row["terminalReason"] == outcome.termination.name and not row["rawFullLegal"]
                    and not row["configuredSupport"], "Manufactured terminal policy")
            terminal += 1
            continue
        engine.cmd_position(f"position fen {job['rootFen']} moves {' '.join(job['historyUci'])}")
        require(engine.board.fen() == board.fen() and len(engine.history) == 4, "Model lost ordered history")
        tokens = engine._tokens_from_history(engine.history).unsqueeze(0).to(cfg.device)
        band = torch.tensor([1400], dtype=torch.long, device=cfg.device)
        with torch.no_grad():
            model_logits, _, _ = engine.model(tokens, band, band)
        mask = get_legal_moves_mask(engine.board, engine.all_moves_dict).to(cfg.device)
        logits = model_logits[0].float().masked_fill(~mask, float("-inf"))
        raw = torch.softmax(logits, dim=-1)
        raw_table = {engine._move_from_index(i).uci(): float(raw[i].item())
                     for i in torch.nonzero(mask, as_tuple=False).flatten().tolist()}
        require(set(raw_table) == set(legal), "Re-inferred raw legal identity mismatch")
        for entry in row["rawFullLegal"]:
            delta = abs(raw_table[entry["legalUci"]] - entry["mass"])
            require(delta <= 0.000001, "Raw model output changed at " + str(index))
            maximum_raw_delta = max(maximum_raw_delta, delta)
        # Independently reconstruct the pinned sampler from logits. The
        # cumulative <= top-p rule is not an inclusive boundary-crossing prefix.
        policy = torch.softmax(logits / 0.8, dim=-1)
        masses, indices = torch.sort(policy, descending=True)
        admitted = torch.cumsum(masses, dim=-1) <= 0.92
        admitted[0] = True
        normalized = masses[admitted] / masses[admitted].sum()
        moves = [engine._move_from_index(i).uci() for i in indices[admitted].tolist()]
        require(moves == [entry["legalUci"] for entry in row["configuredSupport"]], "Re-inferred support mismatch")
        for probability, entry in zip(normalized.tolist(), row["configuredSupport"]):
            delta = abs(probability - entry["mass"])
            require(delta <= 0.000001, "Configured model output changed at " + str(index))
            maximum_policy_delta = max(maximum_policy_delta, delta)
        recomputed += 1
        if (index + 1) % 200 == 0:
            print(f"D3262 independent final-ply Maia {index + 1}/1401", file=sys.stderr, flush=True)
    print(json.dumps({"captureDigest": digest(source_path), "independentlyReplayed": 1401,
                      "recomputedPolicies": recomputed, "terminal": terminal,
                      "maximumRawDelta": maximum_raw_delta, "maximumPolicyDelta": maximum_policy_delta,
                      "authority": "pinned_model_output_not_human_frequency_or_search_proof"}, indent=2))


if __name__ == "__main__":
    main()
