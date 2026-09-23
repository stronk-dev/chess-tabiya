"""Disposable D3262 path-keyed Maia capture for the frozen D3286 profile.

Run only through its Make target in the pinned local Maia3 image. Every query
replays root + candidate + reply; no FEN-keyed policy cache is permitted.
"""

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

import chess
import torch
from torch.amp import autocast

from maia3.dataset import get_legal_moves_mask
from maia3.uci import Maia3UCIEngine, parse_args


ROOT = Path("planning/semantic-consequence-search")


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def digest(path):
    return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()


def distribution(engine, cfg):
    tokens = engine._tokens_from_history(engine.history).unsqueeze(0).to(cfg.device)
    self_elos = torch.tensor([engine.self_elo], dtype=torch.long, device=cfg.device)
    oppo_elos = torch.tensor([engine.oppo_elo], dtype=torch.long, device=cfg.device)
    with torch.no_grad(), autocast("cuda", enabled=cfg.use_amp and cfg.device.startswith("cuda")):
        logits_move, _logits_value, _ = engine.model(tokens, self_elos, oppo_elos)
    legal_mask = get_legal_moves_mask(engine.board, engine.all_moves_dict).to(cfg.device)
    require(bool(legal_mask.any()), "Nonterminal Maia path has no legal move")
    logits = logits_move[0].float().masked_fill(~legal_mask, float("-inf"))
    raw = torch.softmax(logits, dim=-1)
    raw_legal = {}
    for index in torch.nonzero(legal_mask, as_tuple=False).flatten().tolist():
        move = engine._move_from_index(index)
        require(move is not None, "Maia mask emitted an illegal path move")
        raw_legal[move.uci()] = float(raw[index].item())
    configured = torch.softmax(logits / engine.temperature, dim=-1)
    ordered_mass, ordered_index = torch.sort(configured, descending=True)
    kept = torch.cumsum(ordered_mass, dim=-1) <= engine.top_p
    kept[0] = True
    normalized = ordered_mass[kept] / ordered_mass[kept].sum()
    support = []
    for index, mass in zip(ordered_index[kept].tolist(), normalized.tolist()):
        move = engine._move_from_index(index)
        require(move is not None, "Maia sampler retained an illegal path move")
        support.append({"legalUci": move.uci(), "mass": mass})
    require(len(raw_legal) == int(legal_mask.sum().item()), "Maia path legal identity collision")
    return [{"legalUci": move, "mass": raw_legal[move]} for move in sorted(raw_legal)], support


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    parser.add_argument("--coherent-supplement", action="store_true")
    parser.add_argument("--semantic-supplement", action="store_true")
    args = parser.parse_args()
    require(not (args.coherent_supplement and args.semantic_supplement), "Select one Maia capture population")
    frame_path = ROOT / ("d3262-coherent-semantic-supplement-frame.json" if args.semantic_supplement
                         else "d3262-coherent-deeper-supplement-frame.json" if args.coherent_supplement
                         else "d3262-maia-horizon4-path-frame.json")
    direct_path = ROOT / "d3262-maia-direct-logits.json"
    child_path = ROOT / "d3262-maia-history-replay.json"
    frame = json.loads(frame_path.read_text())
    direct = json.loads(direct_path.read_text())
    child = json.loads(child_path.read_text())
    jobs = frame["maiaJobs"] if args.coherent_supplement or args.semantic_supplement else frame["jobs"]
    expected_authority = ("missing_semantic_event_provider_jobs_not_result_or_move_grade" if args.semantic_supplement
                          else "missing_deeper_provider_jobs_not_result_or_move_grade" if args.coherent_supplement
                          else "path_keyed_maia_horizon_four_capture_jobs_not_policy_result")
    expected_jobs = 1 if args.semantic_supplement else 250 if args.coherent_supplement else 2189
    require(frame["authority"] == expected_authority
            and frame["manifest"] == direct["manifest"] == child["manifest"]
            and len(jobs) == expected_jobs, "Crossed Maia path frame")

    cfg = parse_args(["--model", "5m", "--use-uci-history", "--local-files-only", "--device", "cpu"])
    engine = Maia3UCIEngine(cfg)
    engine.ensure_model_loaded()
    engine.self_elo = 1400
    engine.oppo_elo = 1400
    engine.temperature = 0.8
    engine.top_p = 0.92
    require(direct["source"]["modelCheckpointSha256"] == digest(Path(cfg.checkpoint_path)), "Maia model checkpoint drift")
    require(direct["source"]["uciSourceSha256"] == digest(Path(sys.modules["maia3.uci"].__file__)), "Maia UCI adapter drift")

    # Prove the execution reproduces the already checked root-plus-candidate
    # result before extending to a second move of history.
    control = child["rows"][0]
    engine.cmd_position(f"position fen {control['rootFen']} moves {control['candidateUci']}")
    require(engine.board.fen() == control["fen"] and len(engine.history) == 2, "Maia child control replay failed")
    control_raw, control_support = distribution(engine, cfg)
    require([item["legalUci"] for item in control_raw] == [item["legalUci"] for item in control["rawFullLegal"]], "Maia child control legal set changed")
    require(max(abs(actual["mass"] - previous["mass"]) for actual, previous in zip(control_raw, control["rawFullLegal"])) <= 0.000001, "Maia child control raw mass changed")
    require([item["legalUci"] for item in control_support] == [item["legalUci"] for item in control["configuredSupport"]], "Maia child control support changed")
    require(max(abs(actual["mass"] - previous["mass"]) for actual, previous in zip(control_support, control["configuredSupport"])) <= 0.000001, "Maia child control support mass changed")

    rows = []
    for index, job in enumerate(jobs):
        require(job["historyUci"] == [job["candidateUci"], job["replyUci"]], f"Maia path identity changed at {index}")
        engine.cmd_position(f"position fen {job['rootFen']} moves {' '.join(job['historyUci'])}")
        require(engine.board.fen() == job["fen"] and len(engine.history) == 3, f"Maia path replay failed at {index}")
        legal = sorted(move.uci() for move in engine.board.legal_moves)
        outcome = engine.board.outcome(claim_draw=False)
        terminal = outcome is not None
        raw, support = ([], []) if terminal else distribution(engine, cfg)
        require(terminal or legal == [item["legalUci"] for item in raw], f"Maia legal denominator differs at {index}")
        source_job = {field: job[field] for field in ("id", "rootId", "candidateUci", "replyUci", "rootFen", "historyUci", "fen")}
        rows.append({
            **source_job, "terminal": terminal,
            "terminalReason": outcome.termination.name if terminal else None,
            "legalUcis": legal, "rawFullLegal": raw, "configuredSupport": support,
        })
        if (index + 1) % 100 == 0:
            print(f"D3262 path-keyed Maia {index + 1}/{len(jobs)}", file=sys.stderr, flush=True)

    artifact = {
        "version": 1, "manifest": frame["manifest"],
        "authority": ("coherent_semantic_path_keyed_maia_not_human_frequency_or_proof" if args.semantic_supplement
                      else "coherent_deeper_path_keyed_maia_not_human_frequency_or_proof" if args.coherent_supplement
                      else "path_keyed_maia_horizon_four_full_legal_distribution_not_human_frequency_or_proof"),
        "inputDigests": {frame_path.name: digest(frame_path), direct_path.name: digest(direct_path), child_path.name: digest(child_path)},
        "source": {**direct["source"], "historyUci": "root_candidate_reply_path_per_row",
                   "preRootHistory": "unavailable_not_inferred"},
        "positions": len(rows), "rows": rows,
    }
    output = Path(args.out)
    require(not output.exists(), "Refusing to replace path-keyed Maia source")
    temporary = Path(f"{output}.partial-{os.getpid()}")
    with temporary.open("x", encoding="utf-8") as handle:
        json.dump(artifact, handle, indent=2)
        handle.write("\n")
    try:
        os.link(temporary, output)
    finally:
        temporary.unlink()
    print(json.dumps({"digest": digest(output), "positions": len(rows),
                      "terminal": sum(row["terminal"] for row in rows),
                      "legalMoves": sum(len(row["legalUcis"]) for row in rows),
                      "configuredSupport": sum(len(row["configuredSupport"]) for row in rows)}, indent=2))


if __name__ == "__main__":
    main()
