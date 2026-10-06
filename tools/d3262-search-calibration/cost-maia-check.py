"""Independent D3262 literal Maia source control, not wallclock/model reasoning.

python-chess reconstructs ordered legality. The pinned tokenizer reconstructs
actual history tokens; independent float32 torch arithmetic reconstructs the
complete legal softmax, actual sorted top-p mask and normalized sampled policy.
No model inference, missing logits or human-frequency inference is invented.
"""
import copy
import hashlib
import json
import sys
from pathlib import Path

import chess
import torch
from maia3.uci import Maia3UCIEngine
from maia_capture_runtime import pinned_cfg

PINS = dict(modelCheckpointSha256="sha256:ba14208b2992d85502f5fb501934abf6aaaeb355e9f3fdf90e326911f562524f",
            uciSourceSha256="sha256:0f2905bb668f0cb8af6b175e698756d89472b200c36e3f3410ff98390e35474d")


def require(value, message):
    if not value:
        raise AssertionError(message)


def sha(raw):
    return "sha256:" + hashlib.sha256(raw).hexdigest()


def compact(value):
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False).encode()


def check_receipt(receipt, engine):
    q = receipt["operands"]
    require(q["provider"] == "maia" and q["selfElo"] == q["opponentElo"] == 1400
            and q["temperature"] == 0.8 and q["topP"] == 0.92, "Crossed model configuration")
    require(len(receipt["lines"]) == 1, "Missing literal model response")
    response = json.loads(receipt["lines"][0])
    require(response["kind"] == "result" and response["payload"] == receipt["result"], "Mutated literal model payload")
    value = response["payload"]
    require(value["operands"] == q and value["authority"] == "configured_model_policy_not_human_frequency_or_move_reason", "Crossed source operands/authority")
    board = chess.Board(q["rootFen"])
    for uci in q["historyUci"]:
        require(not board.is_game_over(claim_draw=False), "Continuation after absorbing terminal")
        move = chess.Move.from_uci(uci)
        require(move in board.legal_moves, "Illegal ordered history")
        board.push(move)
    require(not board.is_game_over(claim_draw=False) and board.fen(en_passant="legal") == value["fen"], "Crossed board result")
    engine.cmd_position("position fen " + q["rootFen"] + (" moves " + " ".join(q["historyUci"]) if q["historyUci"] else ""))
    require(value["historyFrames"] == len(q["historyUci"]) + 1 == len(engine.history), "Model history reset")
    require(engine._tokens_from_history(engine.history).tolist() == value["tokens"], "Literal tokens differ from ordered history")
    raw = value["rawFullLegal"]
    require([x["legalUci"] for x in raw] == sorted(m.uci() for m in board.legal_moves), "Missing legal model population")
    require(len({x["index"] for x in raw}) == len(raw), "Duplicate model mask index")
    logits = torch.full((value["vocabularySize"],), float("-inf"), dtype=torch.float32)
    for item in raw:
        require(0 <= item["index"] < len(logits) and torch.isfinite(torch.tensor(item["logit"])), "Invalid literal logit")
        # Independently bind tokenizer/move identity, not just arbitrary unique integers.
        require(engine._move_from_index(item["index"]) is not None
                and engine._move_from_index(item["index"]).uci() == item["legalUci"], "Crossed move-mask identity")
        logits[item["index"]] = item["logit"]
    masses = torch.softmax(logits, dim=-1)
    require(all(abs(float(masses[x["index"]]) - x["mass"]) <= 1e-6 for x in raw), "Raw mass differs from literal logits")
    probabilities = torch.softmax(logits / q["temperature"], dim=-1)
    ordered_mass, ordered_index = torch.sort(probabilities, descending=True)
    cumulative = torch.cumsum(ordered_mass, dim=-1)
    kept = cumulative <= q["topP"]
    kept[0] = True
    legal_indices = {x["index"]: x["legalUci"] for x in raw}
    order = [dict(legalUci=legal_indices[index], index=index, mass=float(ordered_mass[rank]),
                  cumulativeMass=float(cumulative[rank]), kept=bool(kept[rank]))
             for rank, index in enumerate(ordered_index.tolist()) if index in legal_indices]
    require(order == value["samplerOrder"], "Actual float32 sampler order/mask differs")
    normalized = ordered_mass[kept] / ordered_mass[kept].sum()
    support = [dict(legalUci=legal_indices[index], mass=float(mass))
               for index, mass in zip(ordered_index[kept].tolist(), normalized.tolist())]
    require(support == value["configuredSupport"], "Actual normalized configured policy differs")
    require(receipt["started"] <= receipt["ended"], "Invalid source clock interval")
    return len(raw)


def main():
    value = json.loads(Path(sys.argv[1]).read_bytes())
    require(value["version"] == 1 and value["question"] == "D3262"
            and value["authority"] == "disposable_source_control_not_cost_population_or_human_frequency"
            and not value["actualTraversalMeasured"] and not value["productionProfileSelected"], "False source-control scope")
    ready = json.loads(value["readyLiteral"])
    require(ready == value["ready"] and all(ready[k] == v for k, v in PINS.items()), "Unpinned literal ready source")
    cfg = pinned_cfg()
    require(sha(Path(cfg.checkpoint_path).read_bytes()) == PINS["modelCheckpointSha256"]
            and sha(Path(sys.modules["maia3.uci"].__file__).read_bytes()) == PINS["uciSourceSha256"], "Independent source drift")
    require(ready["device"] == "cpu" and ready["threads"] == 1 and ready["useUciHistory"] is True
            and ready["torchVersion"] == torch.__version__, "Crossed sampler runtime")
    require(value["sourceDigest"] == sha(compact(dict(imageId=value["imageId"], ready=ready,
        selfElo=1400, opponentElo=1400, temperature=0.8, topP=0.92, preRootHistory="unavailable_not_invented"))), "Crossed composite source digest")
    reference = Path(value["controlSource"]["name"]).read_bytes()
    require(sha(reference) == value["controlSource"]["digest"], "Crossed frozen history control")
    engine = Maia3UCIEngine(cfg)  # Tokenizer/history only: no ensure_model_loaded/inference.
    receipts = value["receipts"]
    require(len(receipts) == 3 and all(r["operands"]["sourceDigest"] == value["sourceDigest"] for r in receipts), "Missing/crossed source controls")
    moves = sum(check_receipt(r, engine) for r in receipts)
    control = json.loads(reference)["rows"][0]
    require(receipts[0]["operands"]["rootFen"] == control["rootFen"]
            and receipts[0]["operands"]["historyUci"] == [control["candidateUci"]], "Wrong frozen child control")
    for field in ["rawFullLegal", "configuredSupport"]:
        actual = receipts[0]["result"][field]
        require([x["legalUci"] for x in actual] == [x["legalUci"] for x in control[field]]
                and all(abs(a["mass"] - b["mass"]) <= 1e-6 for a, b in zip(actual, control[field])), "Frozen model distribution drift")
    require(receipts[1]["result"]["fen"] == receipts[2]["result"]["fen"]
            and receipts[1]["result"]["tokens"] != receipts[2]["result"]["tokens"], "Transposition history collapsed")
    require(value["cold"][0]["state"] == "executed" and value["warm"][0]["state"] == "cached"
            and value["cold"][0]["receiptDigest"] == value["warm"][0]["receiptDigest"]
            and value["cold"][0]["operands"] == value["warm"][0]["operands"] == receipts[0]["operands"]
            and value["offline"][0]["state"] == "unavailable" and value["offline"][0]["receiptDigest"] is None,
            "False cold/warm/offline source identity")
    corruptions = 0
    if "--negative-controls" in sys.argv:
        for mode in ["history", "frames", "tokens", "logit", "mass", "sampler", "support", "index", "legal"]:
            changed = copy.deepcopy(receipts[0])
            payload = changed["result"]
            if mode == "history":
                changed["operands"]["historyUci"] = []; payload["operands"] = changed["operands"]
            elif mode == "frames": payload["historyFrames"] = 1
            elif mode == "tokens": payload["tokens"][0][0] += 1
            elif mode == "logit": payload["rawFullLegal"][0]["logit"] += 1
            elif mode == "mass": payload["rawFullLegal"][0]["mass"] += 0.01
            elif mode == "sampler": payload["samplerOrder"][0]["kept"] = False
            elif mode == "support": payload["configuredSupport"][0]["mass"] += 0.01
            elif mode == "index": payload["rawFullLegal"][0]["index"] = payload["rawFullLegal"][1]["index"]
            elif mode == "legal": payload["rawFullLegal"].pop()
            # Re-seal the literal payload too; superficial object mismatch cannot satisfy the control.
            response = json.loads(changed["lines"][0]); response["payload"] = payload
            changed["lines"] = [compact(response).decode()]
            try:
                check_receipt(changed, engine)
            except AssertionError:
                corruptions += 1
                continue
            raise AssertionError("Independent model corruption admitted: " + mode)
    print(json.dumps(dict(receipts=len(receipts), legalMoves=moves, corruptionRefusals=corruptions,
                         actualTraversalMeasured=False, clock="interval_consistency_not_independent_wall_clock")))


if __name__ == "__main__":
    main()
