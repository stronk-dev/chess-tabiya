"""Disposable D3262/D3276 direct-logit validation in the pinned Maia3 image.

Run with one JSON object on stdin containing `capture` and `reconstruction`.
The production verifier does not require Docker, model weights or this script.
"""

import json
import hashlib
import sys
from pathlib import Path

import chess
import torch
from torch.amp import autocast

from maia3.dataset import get_legal_moves_mask
from maia3.uci import Maia3UCIEngine, parse_args


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def main():
    data = json.load(sys.stdin)
    capture = data["capture"]
    reconstruction = data["reconstruction"]
    require(capture["positions"] == 196 and len(capture["rows"]) == 196, "Wrong Maia child capture")
    require(len(reconstruction["rows"]) == 196, "Wrong configured reconstruction")
    require(capture["manifest"] == reconstruction["manifest"], "Crossed capture and reconstruction")

    cfg = parse_args(["--model", "5m", "--use-uci-history", "--local-files-only", "--device", "cpu"])
    engine = Maia3UCIEngine(cfg)
    engine.ensure_model_loaded()
    engine.self_elo = 1400
    engine.oppo_elo = 1400
    engine.temperature = 0.8
    engine.top_p = 0.92
    engine.multipv = 20

    max_reported_raw_delta = 0.0
    support_matches = 0
    interval_matches = 0
    unresolved = []
    artifact_rows = []
    for index, (row, bounded) in enumerate(zip(capture["rows"], reconstruction["rows"])):
        require(row["rootId"] == bounded["rootId"] and row["candidateUci"] == bounded["candidateUci"], f"Crossed child {index}")
        engine.board = chess.Board(row["fen"])
        engine._reset_history()
        tokens = engine._tokens_from_history(engine.history).unsqueeze(0).to(cfg.device)
        self_elos = torch.tensor([engine.self_elo], dtype=torch.long, device=cfg.device)
        oppo_elos = torch.tensor([engine.oppo_elo], dtype=torch.long, device=cfg.device)
        with torch.no_grad(), autocast("cuda", enabled=cfg.use_amp and cfg.device.startswith("cuda")):
            logits_move, _logits_value, _ = engine.model(tokens, self_elos, oppo_elos)
        legal_mask = get_legal_moves_mask(engine.board, engine.all_moves_dict).to(cfg.device)
        logits = logits_move[0].float().masked_fill(~legal_mask, float("-inf"))
        raw = torch.softmax(logits, dim=-1)
        top_probs, top_idxs = torch.topk(raw, k=min(20, int(legal_mask.sum().item())))
        require(len(row["candidates"]) == len(top_idxs), f"Returned top-window size changed at {index}")
        for rank, (prob, top_idx) in enumerate(zip(top_probs.tolist(), top_idxs.tolist())):
            move = engine._move_from_index(top_idx)
            require(move is not None and move.uci() == row["candidates"][rank]["legalUci"], f"Raw top-window legal identity changed at {index}/{rank}")
            delta = abs(prob - row["candidates"][rank]["mass"])
            max_reported_raw_delta = max(max_reported_raw_delta, delta)
            require(delta <= 0.000001, f"Raw top-window mass changed at {index}/{rank}: {delta}")

        configured = torch.softmax(logits / engine.temperature, dim=-1)
        sorted_probs, sorted_idx = torch.sort(configured, descending=True)
        keep = torch.cumsum(sorted_probs, dim=-1) <= engine.top_p
        keep[0] = True
        kept_idx = sorted_idx[keep]
        kept_probs = sorted_probs[keep] / sorted_probs[keep].sum()
        actual = {}
        for selected_idx, probability in zip(kept_idx.tolist(), kept_probs.tolist()):
            move = engine._move_from_index(selected_idx)
            require(move is not None, f"Configured sampler selected an illegal move at {index}")
            actual[move.uci()] = probability
        full_raw = {}
        for legal_idx in torch.nonzero(legal_mask, as_tuple=False).flatten().tolist():
            move = engine._move_from_index(legal_idx)
            require(move is not None, f"Raw model mask produced an illegal move at {index}")
            full_raw[move.uci()] = float(raw[legal_idx].item())
        require(set(full_raw) == set(row["legalReplyUcis"]), f"Direct model legal population differs at {index}")
        artifact_rows.append({
            "rootId": row["rootId"],
            "candidateUci": row["candidateUci"],
            "fen": row["fen"],
            "rawFullLegal": [{"legalUci": move, "mass": full_raw[move]} for move in sorted(full_raw)],
            "configuredSupport": [{"legalUci": move, "mass": probability} for move, probability in actual.items()],
        })
        if bounded["status"] != "certified_returned_support":
            unresolved.append({"rootId": row["rootId"], "candidateUci": row["candidateUci"], "actualSupportCount": len(actual)})
            continue
        reported = {item["legalUci"]: item for item in bounded["support"]}
        require(set(actual) == set(reported), f"Configured support differs at {index}: actual={sorted(actual)}, bounded={sorted(reported)}")
        support_matches += 1
        for move, probability in actual.items():
            low, high = reported[move]["configuredMassInterval"]
            require(low <= probability <= high, f"Configured mass escaped interval at {index}/{move}: {low} <= {probability} <= {high}")
            interval_matches += 1

    checkpoint_sha = hashlib.sha256(Path(cfg.checkpoint_path).read_bytes()).hexdigest()
    source_sha = hashlib.sha256(Path(sys.modules["maia3.uci"].__file__).read_bytes()).hexdigest()
    if len(sys.argv) == 3 and sys.argv[1] == "--artifact-out":
        artifact = {
            "version": 1,
            "manifest": capture["manifest"],
            "captureDigest": "sha256:ebc4f712be54958ae382d8e4ebf4d69c8a3f56c767da146c1ff9ea9111def178",
            "reconstructionDigest": "sha256:6ea99adab69f85307a613a84f646341ae83d00e56868c6fa2de28c59ec56e4ac",
            "source": {
                "modelId": "maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe",
                "modelCheckpointSha256": f"sha256:{checkpoint_sha}",
                "uciSourceSha256": f"sha256:{source_sha}",
                "mode": "human_common",
                "band": 1400,
                "temperature": 0.8,
                "topP": 0.92,
                "useUciHistory": True,
                "historyUci": [],
                "device": "cpu",
                "rawMeaning": "direct_full_legal_softmax_logits",
                "configuredMeaning": "direct_sample_from_logits_support_and_normalized_mass",
            },
            "positions": len(artifact_rows),
            "rows": artifact_rows,
        }
        with open(sys.argv[2], "x", encoding="utf-8") as output:
            json.dump(artifact, output, indent=2)
            output.write("\n")
    else:
        require(len(sys.argv) == 1, "Use --artifact-out with one explicit path")

    print(json.dumps({
        "modelCheckpointSha256": f"sha256:{checkpoint_sha}",
        "uciSourceSha256": f"sha256:{source_sha}",
        "positions": len(capture["rows"]),
        "maxReportedRawDelta": max_reported_raw_delta,
        "stableSupportMatched": support_matches,
        "stableMassIntervalsMatched": interval_matches,
        "unresolved": unresolved,
    }, indent=2))


if __name__ == "__main__":
    main()
