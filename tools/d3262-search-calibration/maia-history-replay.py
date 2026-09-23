"""Disposable D3262/D3286 comparison of empty-FEN and root-replayed Maia policy.

The frozen child source was evaluated at each child FEN with empty UCI history.
This capture replays the actual root candidate through the same pinned model.
It neither estimates human choice nor changes the preregistered search profile.
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


def model_distribution(engine, cfg):
    tokens = engine._tokens_from_history(engine.history).unsqueeze(0).to(cfg.device)
    self_elos = torch.tensor([engine.self_elo], dtype=torch.long, device=cfg.device)
    oppo_elos = torch.tensor([engine.oppo_elo], dtype=torch.long, device=cfg.device)
    with torch.no_grad(), autocast("cuda", enabled=cfg.use_amp and cfg.device.startswith("cuda")):
        logits_move, _logits_value, _ = engine.model(tokens, self_elos, oppo_elos)
    legal_mask = get_legal_moves_mask(engine.board, engine.all_moves_dict).to(cfg.device)
    require(bool(legal_mask.any()), "Selected child has no legal Maia move")
    logits = logits_move[0].float().masked_fill(~legal_mask, float("-inf"))
    raw = torch.softmax(logits, dim=-1)
    raw_legal = {}
    for index in torch.nonzero(legal_mask, as_tuple=False).flatten().tolist():
        move = engine._move_from_index(index)
        require(move is not None, "Maia legal mask produced an illegal move")
        raw_legal[move.uci()] = float(raw[index].item())
    configured = torch.softmax(logits / engine.temperature, dim=-1)
    ordered_mass, ordered_index = torch.sort(configured, descending=True)
    kept = torch.cumsum(ordered_mass, dim=-1) <= engine.top_p
    kept[0] = True
    normalized = ordered_mass[kept] / ordered_mass[kept].sum()
    support = []
    for index, mass in zip(ordered_index[kept].tolist(), normalized.tolist()):
        move = engine._move_from_index(index)
        require(move is not None, "Maia sampler retained an illegal move")
        support.append({"legalUci": move.uci(), "mass": mass})
    require(len(raw_legal) == int(legal_mask.sum().item()), "Maia legal identity collision")
    return [{"legalUci": move, "mass": raw_legal[move]} for move in sorted(raw_legal)], support


def prefix(support, threshold):
    selected = []
    covered = 0.0
    for item in support[:8]:
        if covered >= threshold:
            break
        selected.append(item["legalUci"])
        covered += item["mass"]
    return selected


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    direct_path = ROOT / "d3262-maia-direct-logits.json"
    graph_path = ROOT / "d3262-exact-replies.json"
    direct = json.loads(direct_path.read_text())
    graph = json.loads(graph_path.read_text())
    require(direct["manifest"] == graph["manifest"] and len(direct["rows"]) == 196, "Crossed Maia child population")
    require(direct["source"]["useUciHistory"] is True and direct["source"]["historyUci"] == [], "Child baseline is not empty-history Maia")
    candidates = {(root["rootId"], child["candidateUci"]): (root["fen"], child["afterFen"])
                  for root in graph["roots"] for child in root["candidates"]}
    require(len(candidates) == 196, "Duplicate exact-reply child")

    cfg = parse_args(["--model", "5m", "--use-uci-history", "--local-files-only", "--device", "cpu"])
    engine = Maia3UCIEngine(cfg)
    engine.ensure_model_loaded()
    engine.self_elo = 1400
    engine.oppo_elo = 1400
    engine.temperature = 0.8
    engine.top_p = 0.92
    engine.multipv = 20
    require(direct["source"]["modelCheckpointSha256"] == digest(Path(cfg.checkpoint_path)), "Maia checkpoint drift")
    require(direct["source"]["uciSourceSha256"] == digest(Path(sys.modules["maia3.uci"].__file__)), "Maia UCI source drift")

    rows = []
    for index, baseline in enumerate(direct["rows"]):
        key = (baseline["rootId"], baseline["candidateUci"])
        require(key in candidates, f"Unknown child path {key}")
        root_fen, child_fen = candidates[key]
        require(baseline["fen"] == child_fen, f"Crossed child FEN {key}")

        # First prove that this execution reproduces the stored empty-history
        # model source; otherwise a path delta would be a model/source drift.
        engine.cmd_position(f"position fen {child_fen}")
        require(engine.board.fen() == child_fen and len(engine.history) == 1, f"Empty-history input drift {key}")
        raw_empty, support_empty = model_distribution(engine, cfg)
        previous_raw = {item["legalUci"]: item["mass"] for item in baseline["rawFullLegal"]}
        previous_support = {item["legalUci"]: item["mass"] for item in baseline["configuredSupport"]}
        require(set(previous_raw) == {item["legalUci"] for item in raw_empty}, f"Empty legal set drift {key}")
        require(max(abs(item["mass"] - previous_raw[item["legalUci"]]) for item in raw_empty) <= 0.000001,
                f"Empty raw logits drift {key}")
        require(set(previous_support) == {item["legalUci"] for item in support_empty}, f"Empty sampler support drift {key}")
        require(max(abs(item["mass"] - previous_support[item["legalUci"]]) for item in support_empty) <= 0.000001,
                f"Empty sampler mass drift {key}")

        engine.cmd_position(f"position fen {root_fen} moves {baseline['candidateUci']}")
        require(engine.board.fen() == child_fen and len(engine.history) == 2, f"Path replay drift {key}")
        raw_path, support_path = model_distribution(engine, cfg)
        empty_raw = {item["legalUci"]: item["mass"] for item in raw_empty}
        empty_configured = {item["legalUci"]: item["mass"] for item in support_empty}
        path_configured = {item["legalUci"]: item["mass"] for item in support_path}
        require(set(empty_raw) == {item["legalUci"] for item in raw_path}, f"Path legal set drift {key}")
        raw_tv = sum(abs(item["mass"] - empty_raw[item["legalUci"]]) for item in raw_path) / 2
        configured_tv = sum(abs(empty_configured.get(move, 0) - path_configured.get(move, 0))
                            for move in empty_raw) / 2
        rows.append({
            "rootId": key[0], "candidateUci": key[1], "rootFen": root_fen, "fen": child_fen,
            "historyUci": [key[1]], "rawFullLegal": raw_path, "configuredSupport": support_path,
            "rawTotalVariationFromEmpty": raw_tv,
            "configuredTotalVariationFromEmpty": configured_tv,
            "emptyTopMove": max(raw_empty, key=lambda item: item["mass"])["legalUci"],
            "pathTopMove": max(raw_path, key=lambda item: item["mass"])["legalUci"],
            "emptyPrefix80": prefix(support_empty, 0.8),
            "pathPrefix80": prefix(support_path, 0.8),
            "emptyPrefix90": prefix(support_empty, 0.9),
            "pathPrefix90": prefix(support_path, 0.9),
        })
        if (index + 1) % 25 == 0:
            print(f"D3286 Maia path replay {index + 1}/{len(direct['rows'])}", file=sys.stderr, flush=True)

    require(len(rows) == len(candidates), "Incomplete Maia path replay")
    artifact = {
        "version": 1, "manifest": direct["manifest"],
        "authority": "root_replayed_maia_child_distribution_not_human_frequency_or_search_result",
        "inputDigests": {direct_path.name: digest(direct_path), graph_path.name: digest(graph_path)},
        "source": {**direct["source"], "historyUci": "root_candidate_path_per_row",
                   "preRootHistory": "unavailable_not_inferred"},
        "positions": len(rows), "rows": rows,
    }
    output = Path(args.out)
    require(not output.exists(), "Refusing to replace existing path-replay artifact")
    temporary = Path(f"{output}.partial-{os.getpid()}")
    with temporary.open("x", encoding="utf-8") as handle:
        json.dump(artifact, handle, indent=2)
        handle.write("\n")
    try:
        os.link(temporary, output)
    finally:
        temporary.unlink()
    print(json.dumps({
        "digest": digest(output), "positions": len(rows),
        "changedRaw": sum(row["rawTotalVariationFromEmpty"] > 0.000001 for row in rows),
        "changedConfiguredSupport": sum(row["emptyPrefix90"] != row["pathPrefix90"] for row in rows),
        "changedTopMove": sum(row["emptyTopMove"] != row["pathTopMove"] for row in rows),
        "maxRawTotalVariation": max(row["rawTotalVariationFromEmpty"] for row in rows),
        "maxConfiguredTotalVariation": max(row["configuredTotalVariationFromEmpty"] for row in rows),
    }, indent=2))


if __name__ == "__main__":
    main()
