"""D3262 corrected-frame Maia source for only three newly selected children.

Run through the pinned local Maia image. Root-plus-candidate UCI history is
part of query identity; this is model policy, not human frequency or proof.
"""

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

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
    require(bool(legal_mask.any()), "New Maia child has no legal move")
    logits = logits_move[0].float().masked_fill(~legal_mask, float("-inf"))
    raw = torch.softmax(logits, dim=-1)
    raw_legal = {}
    for index in torch.nonzero(legal_mask, as_tuple=False).flatten().tolist():
        move = engine._move_from_index(index)
        require(move is not None, "Maia legal mask yielded an illegal move")
        raw_legal[move.uci()] = float(raw[index].item())
    configured = torch.softmax(logits / engine.temperature, dim=-1)
    ordered_mass, ordered_index = torch.sort(configured, descending=True)
    kept = torch.cumsum(ordered_mass, dim=-1) <= engine.top_p
    kept[0] = True
    normalized = ordered_mass[kept] / ordered_mass[kept].sum()
    support = []
    for index, mass in zip(ordered_index[kept].tolist(), normalized.tolist()):
        move = engine._move_from_index(index)
        require(move is not None, "Maia configured sampler retained an illegal move")
        support.append({"legalUci": move.uci(), "mass": mass})
    require(len(raw_legal) == int(legal_mask.sum().item()), "Maia legal identity collision")
    return ([{"legalUci": move, "mass": raw_legal[move]} for move in sorted(raw_legal)], support)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    graph_path = ROOT / "d3262-coherent-exact-replies.json"
    old_path = ROOT / "d3262-exact-replies.json"
    direct_path = ROOT / "d3262-maia-direct-logits.json"
    control_path = ROOT / "d3262-maia-history-replay.json"
    graph = json.loads(graph_path.read_text())
    old = json.loads(old_path.read_text())
    direct = json.loads(direct_path.read_text())
    control_source = json.loads(control_path.read_text())
    require(digest(graph_path) == "sha256:3fcd3ef596886aee1e1427bc2502aaeef1baa39827c2e8d35b398e1fb478bb68", "Corrected graph drifted")
    require(graph["profile"] == "d3262-coherent-root-v1" and graph["manifest"] == old["manifest"] == direct["manifest"] == control_source["manifest"], "Crossed Maia source population")
    jobs = []
    for root, previous in zip(graph["roots"], old["roots"]):
        require(root["rootId"] == previous["rootId"] and root["fen"] == previous["fen"], "Crossed Maia root")
        retained = {candidate["candidateUci"] for candidate in previous["candidates"]}
        jobs.extend((root, candidate) for candidate in root["candidates"] if candidate["candidateUci"] not in retained)
    require(len(jobs) == 3 and sum(candidate["replyCount"] for _, candidate in jobs) == 55, "New Maia child population changed")

    cfg = parse_args(["--model", "5m", "--use-uci-history", "--local-files-only", "--device", "cpu"])
    engine = Maia3UCIEngine(cfg)
    engine.ensure_model_loaded()
    engine.self_elo = 1400
    engine.oppo_elo = 1400
    engine.temperature = 0.8
    engine.top_p = 0.92
    require(direct["source"]["modelCheckpointSha256"] == digest(Path(cfg.checkpoint_path)), "Maia model checkpoint drift")
    require(direct["source"]["uciSourceSha256"] == digest(Path(sys.modules["maia3.uci"].__file__)), "Maia UCI adapter drift")

    control = control_source["rows"][0]
    engine.cmd_position(f"position fen {control['rootFen']} moves {control['candidateUci']}")
    require(engine.board.fen() == control["fen"] and len(engine.history) == 2, "Maia path control replay failed")
    control_raw, control_support = distribution(engine, cfg)
    for actual, prior in [(control_raw, control["rawFullLegal"]), (control_support, control["configuredSupport"])]:
        require([item["legalUci"] for item in actual] == [item["legalUci"] for item in prior]
                and max(abs(item["mass"] - previous["mass"]) for item, previous in zip(actual, prior)) <= 0.000001,
                "Maia path control distribution drifted")

    rows = []
    for root, candidate in jobs:
        uci = candidate["candidateUci"]
        engine.cmd_position(f"position fen {root['fen']} moves {uci}")
        require(engine.board.fen() == candidate["afterFen"] and len(engine.history) == 2, f"Maia new-child replay failed {root['rootId']}/{uci}")
        legal = sorted(move.uci() for move in engine.board.legal_moves)
        require(legal == [reply["uci"] for reply in candidate["replies"]], f"Maia legal reply set differs {root['rootId']}/{uci}")
        raw, support = distribution(engine, cfg)
        require(legal == [item["legalUci"] for item in raw], f"Maia raw legal set differs {root['rootId']}/{uci}")
        rows.append({"rootId": root["rootId"], "candidateUci": uci, "rootFen": root["fen"],
                     "fen": candidate["afterFen"], "historyUci": [uci], "legalUcis": legal,
                     "rawFullLegal": raw, "configuredSupport": support})

    artifact = {"version": 1, "manifest": graph["manifest"], "profile": graph["profile"],
                "authority": "coherent_root_new_child_maia_distribution_not_human_frequency_or_proof",
                "inputDigests": {path.name: digest(path) for path in [graph_path, old_path, direct_path, control_path]},
                "source": {**direct["source"], "historyUci": "root_candidate_path_per_row",
                           "preRootHistory": "unavailable_not_inferred"},
                "positions": len(rows), "rows": rows}
    output = Path(args.out)
    require(not output.exists(), "Refusing to replace the new-child Maia capture")
    temporary = Path(f"{output}.partial-{os.getpid()}")
    with temporary.open("x", encoding="utf-8") as handle:
        json.dump(artifact, handle, indent=2)
        handle.write("\n")
    try:
        os.link(temporary, output)
    finally:
        temporary.unlink()
    print(json.dumps({"digest": digest(output), "positions": len(rows),
                      "legalMoves": sum(len(row["legalUcis"]) for row in rows),
                      "configuredSupport": sum(len(row["configuredSupport"]) for row in rows)}, indent=2))


if __name__ == "__main__":
    main()
