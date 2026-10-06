"""Independent D3495 scope/stratum/rank audit and python-chess hard controls.

Uses pinned provider readings; does not re-infer Stockfish, manufacture tactical
labels, or call this rendering, peak-memory or end-to-end latency measurement.
"""
import copy
import gzip
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path
import chess

DIRECTORY = Path("planning/semantic-consequence-search")
OUTPUT = "d3262-coherent-qualification.json"
SOURCES = {
    "d3262-coherent-root-frame.json": "dcf339d6042392e3a5d0cc355c3d6779ed751d5540a8a8094d50ce3d7e43df2b",
    "d3262-coherent-five-approach-comparison.json.gz": "c6660605e24c13b631f39f2003f1219406baadb02b03614eac9260c6a81c15bf",
    "d3262-coherent-horizon-policy.json.gz": "172bfccf3a8c84e12a985d27529bec4131a2e3e56b366bb410097f80e442ec8a",
    "d3262-coherent-first-reply-frontier.json": "1cb357c145d5b8c8ba15cd8b6bd752afb0e70d7b7e3758a0da4ebee022ff7438",
    "d3262-stockfish-root-coherent-all.json": "790049cff06992eae6c48f7057d0b794c4388e503f2d76a59dfe64ce8dbe7c49",
    "d3262-coherent-exact-replies.json": "3fcd3ef596886aee1e1427bc2502aaeef1baa39827c2e8d35b398e1fb478bb68",
    "d3262-fork-control-identity.json": "687c6fef6b77aebf55dcaf630945e510abb4020244be96ddb6cb2ee6977e44f9",
    "d3262-bishop-pressure-control.json": "09b6e8ea4e225c01b857f5ddef9ac249d65a9203c66f2dd41a07d7a5016a4a64",
}


def require(value, message):
    if not value:
        raise AssertionError(message)


def counts(rows, field):
    return dict(sorted(Counter("unknown" if r.get(field) is None else r[field] for r in rows).items()))


def sign(a, b):
    return "tie" if a == b else "source_precedes" if a < b else "alternative_precedes"


def rank_comparison(a, b):
    require(a["status"] == b["status"] == "retained" and a["budget"] == b["budget"], "crossed rank authority")
    require(all(type(r["rank"]) is int and r["rank"] > 0 and type(r["depth"]) is int and r["depth"] >= 0
                and r["score"]["kind"] in ("cp", "mate") and type(r["score"]["value"]) is int
                and type(r["score"]["bound"]) is bool for r in (a, b)), "untyped rank/score")
    comparable = all(r["score"]["kind"] == "cp" and r["score"]["bound"] is False for r in (a, b))
    return {"budget": a["budget"], "sourceRank": a["rank"], "alternativeRank": b["rank"],
            "sourceScore": a["score"], "alternativeScore": b["score"], "sourceDepth": a["depth"], "alternativeDepth": b["depth"],
            "rankOrder": sign(a["rank"], b["rank"]), "cpOrder": sign(-a["score"]["value"], -b["score"]["value"]) if comparable else "not_comparable_as_cp",
            "authority": "one_captured_provider_budget_not_merged_value_or_move_reason"}


def selected_verdict(replies, selected, provider_line=False):
    legal = {r["uci"]: r for r in replies}
    require(len(legal) == len(replies) > 0 and len(set(selected)) == len(selected) and set(selected) <= legal.keys(), "invalid control frontier")
    missing = [r["uci"] for r in replies if r["uci"] not in selected]
    refuted = [uci for uci in selected if not legal[uci]["retainsAny"]]
    return {"selected": selected, "omitted": missing, "refutations": refuted,
            "verdict": "named_geometric_relation_refuted_by_visited_reply" if refuted else
                "named_geometric_relation_retained_all_exact_replies" if not provider_line and not missing else "unknown_unvisited_or_provider_line_ceiling",
            "scope": "declared_piece_identity_and_geometry_not_winning_fork"}


def verify_graph_root(root):
    """Re-enumerate every control candidate's full replies, not selected rows only."""
    initial = chess.Board(root["fen"])
    for c in root["candidates"]:
        board = initial.copy()
        move = chess.Move.from_uci(c["candidateUci"])
        require(move in board.legal_moves, "illegal control root")
        board.push(move)
        # The frozen chessops position image retains an EP square only when
        # en passant is legal, not the raw FEN double-push convention.
        require(board.fen(en_passant="legal") == c["afterFen"], "crossed control child board")
        legal = {m.uci() for m in board.legal_moves}
        require(legal == {r["uci"] for r in c["replies"]} and len(legal) == c["replyCount"], "incomplete exact controls")
        for reply in c["replies"]:
            next_board = board.copy()
            next_board.push_uci(reply["uci"])
            require(next_board.fen(en_passant="legal") == reply["fen"], "crossed control reply board")


def verify_reference(root, reference, kind):
    candidate = next(c for c in root["candidates"] if c["candidateUci"] == reference["candidateUci"])
    if kind == "fork":
        require(reference["attacker"] == {"square": "c7", "role": "knight", "color": "white"}, "false fork attacker")
        initial = chess.Board(candidate["afterFen"])
        for target in reference["targets"]:
            piece = chess.Piece.from_symbol({"rook": "r", "king": "k"}[target["role"]])
            require(initial.piece_at(chess.parse_square(target["square"])) == piece, "false fork target")
            require(chess.parse_square(target["square"]) in initial.attacks(chess.C7), "no declared fork attack")
        expected = []
        for reply in candidate["replies"]:
            board = chess.Board(reply["fen"])
            retained = [t["square"] for t in reference["targets"] if t["role"] != "king"
                        and board.piece_at(chess.C7) == chess.Piece(chess.KNIGHT, chess.WHITE)
                        and board.piece_at(chess.parse_square(t["square"])) == chess.Piece(chess.ROOK, chess.BLACK)
                        and chess.parse_square(t["square"]) in board.attacks(chess.C7)]
            expected.append({"uci": reply["uci"], "retainedTargets": retained, "retainsAny": bool(retained)})
        refutation = next((r["uci"] for r in expected if not r["retainsAny"]), None)
        require(expected == reference["replies"] and reference["replyCount"] == len(expected)
                and reference["firstRefutation"] == refutation and reference["allReplyRetained"] == (refutation is None), "false exact fork control")
    else:
        board = chess.Board(candidate["afterFen"])
        require(board.piece_at(chess.H3) == chess.Piece(chess.PAWN, chess.WHITE)
                and board.piece_at(chess.G4) == chess.Piece(chess.BISHOP, chess.BLACK) and chess.G4 in board.attacks(chess.H3), "false h3 harassment")
        require(reference["selectedReplyUci"] == "g4h5" and reference["opponentReplyCount"] == len(candidate["replies"]) > 1, "forced/false bishop retreat")
        board.push_uci("g4h5")
        require(board.piece_at(chess.H5) == chess.Piece(chess.BISHOP, chess.BLACK)
                and board.piece_at(chess.F3) == chess.Piece(chess.KNIGHT, chess.WHITE)
                and board.piece_at(chess.D1) == chess.Piece(chess.QUEEN, chess.WHITE), "lost bishop screen queen identity")
        require(chess.H5 not in board.attacks(chess.H3) and chess.F3 in board.attacks(chess.H5)
                and chess.D1 not in board.attacks(chess.H5), "false retained screen relation")
        legal, expose = [], []
        for m in board.legal_moves:
            if m.from_square != chess.F3:
                continue
            legal.append(m.uci())
            after = board.copy()
            after.push(m)
            if chess.D1 in after.attacks(chess.H5):
                expose.append(m.uci())
        require(sorted(legal) == reference["legalScreenMoves"] and sorted(expose) == reference["exposingScreenMoves"]
                and len(expose) == 6 and reference["bishopDirectlyAttacksQueenAfterRetreat"] is False
                and reference["geometricExposureOnly"] is True, "false latent queen exposure")


def expected_output():
    values, input_digests, sizes = [], {}, []
    for name, pinned in SOURCES.items():
        raw = (DIRECTORY / name).read_bytes()
        require(hashlib.sha256(raw).hexdigest() == pinned, "changed pinned source " + name)
        decoded = gzip.decompress(raw) if name.endswith(".gz") else raw
        values.append(json.loads(decoded))
        input_digests[name] = "sha256:" + pinned
        sizes.append({"name": name, "physical": len(raw), "decoded": len(decoded), "scope": "retained_research_input_not_production_request_or_peak_memory"})
    frame, common, horizon, first, engine, graph, fork, bishop = values
    roots = {r["rootId"]: r for r in frame["roots"]}
    cell_counts = Counter((r["rootId"], r["candidateUci"]) for r in common["rows"])
    population = [{"rootId": r["rootId"], "candidateUci": c["moveUci"], "phase": r["phase"], "focus": r["focus"],
                   "namedCells": cell_counts[(r["rootId"], c["moveUci"])]} for r in frame["roots"] for c in r["candidates"]]
    require(len(population) == 193 and len(common["rows"]) == 182 and len(common["settings"]) == 53, "changed qualification denominator")
    root_agreement = []
    for root in frame["roots"]:
        source = next(r for r in engine["rows"] if r["rootId"] == root["rootId"])
        for candidate in root["candidates"]:
            for reading in candidate["stockfish"]:
                probe = next(p for p in source["probes"] if p["budget"] == reading["budget"])
                entry = next(e for e in probe["entries"] if e["moveUci"] == candidate["moveUci"])
                require(reading["status"] == "retained" and all(reading[k] == entry[k] for k in ("rank", "depth", "score")), "crossed copied root score/rank")
        bests = [{"budget": p["budget"], "uci": next(e["moveUci"] for e in p["entries"] if e["rank"] == 1)} for p in source["probes"]]
        root_agreement.append({"rootId": root["rootId"], "phase": root["phase"], "focus": root["focus"], "bests": bests,
                               "sameBestAllBudgets": len({b["uci"] for b in bests}) == 1})
    pair_agreement = []
    for pair in common["contrasts"]:
        root = roots[pair["rootId"]]
        a, b = [next(c for c in root["candidates"] if c["moveUci"] == pair[k]) for k in ("sourceCandidateUci", "alternativeCandidateUci")]
        readings = [rank_comparison(s, t) for s, t in zip(a["stockfish"], b["stockfish"])]
        cp_orders = {r["cpOrder"] for r in readings}
        pair_agreement.append({"rootId": pair["rootId"], "targetId": pair["targetId"], "sourceCandidateUci": a["moveUci"], "alternativeCandidateUci": b["moveUci"],
                               "phase": root["phase"], "focus": root["focus"], "readings": readings,
                               "sameRankOrderAllBudgets": len({r["rankOrder"] for r in readings}) == 1,
                               "cpAgreement": "not_comparable_as_cp" if "not_comparable_as_cp" in cp_orders else "same" if len(cp_orders) == 1 else "different",
                               "moveReason": "not_an_engine_reason"})
    controls = []
    for control in common["controls"]:
        root = roots[control["rootId"]]
        exact = next(r for r in graph["roots"] if r["rootId"] == root["rootId"])
        verify_graph_root(exact)
        kind = "fork" if root["rootId"].startswith("tactical:") else "bishop" if root["rootId"].startswith("pressure:") else "quiet"
        candidate_uci = "e6c7" if kind == "fork" else "h2h3" if kind == "bishop" else "d7f8"
        require(root["focus"] == {"fork": "tactical", "bishop": "retained_pressure", "quiet": "quiet_plan"}[kind], "control focus drift")
        candidate = next(c for c in exact["candidates"] if c["candidateUci"] == candidate_uci)
        reference = next(r for r in fork["controls"] if r["rootId"] == root["rootId"]) if kind == "fork" else bishop["result"] if kind == "bishop" else None
        if reference is not None:
            verify_reference(exact, reference, kind)
        arms = []
        for setting in common["settings"]:
            family = setting["family"]
            if family == "provider_line":
                eroot = next(r for r in engine["rows"] if r["rootId"] == root["rootId"])
                probe = next(p for p in eroot["probes"] if p["budget"] == setting["budget"])
                pv = next(e["pv"] for e in probe["entries"] if e["moveUci"] == candidate_uci)
                selected = pv[1:2]
            elif family in ("exact_reply_forcing", "bounded_oracle_diagnostic"):
                selected = [r["uci"] for r in candidate["replies"]]
            elif family in ("engine_beam", "configured_model"):
                row = next(r for r in first["rows"] if r["rootId"] == root["rootId"] and r["candidateUci"] == candidate_uci)
                selected = [r["uci"] for r in row["replies"] if setting["id"] in r["selectedBy"]]
            else:
                selected = None
            if kind == "quiet":
                arm = {"selectedReplies": selected, "verdict": "no_autonomous_quiet_plan_claim", "authoredRouteIsNotDetectedPlan": True}
            elif selected is None:
                arm = {"selectedReplies": None, "verdict": "no_registered_target_for_this_named_relation_selector"}
            elif kind == "fork":
                arm = selected_verdict(reference["replies"], selected, family == "provider_line")
            else:
                visited = reference["selectedReplyUci"] in selected
                arm = {"selectedReplies": selected, "retainedPressureWitnessVisited": visited,
                       "omittedReplies": [r["uci"] for r in candidate["replies"] if r["uci"] not in selected],
                       "verdict": "named_retreat_retains_geometric_pressure" if visited else "declared_retreat_not_visited",
                       "retreatForced": False, "directlyAttacksQueen": False, "rootBenefit": "not_established"}
            arms.append({"setting": setting["id"], **arm})
        controls.append({"rootId": root["rootId"], "candidateUci": candidate_uci, "phase": root["phase"], "focus": root["focus"],
                         "candidatesOffered": len(root["candidates"]), "reference": reference,
                         "authoredRouteSource": "content/drafts/carlsbad-minority-attack.json#nf8-regroup" if kind == "quiet" else None, "arms": arms})
    phase_mix = []
    for phase in sorted({r["phase"] for r in frame["roots"]}):
        cells = [r for r in common["rows"] if r["phase"] == phase]
        direct = [r for r in horizon["rows"] if r["phase"] == phase]
        arms = []
        for i, setting in enumerate(common["settings"]):
            arms.append({"setting": setting["id"], "diagnostic": setting["diagnostic"],
                         "availableNow": sum(r["arms"][i]["directOpportunity"] for r in direct),
                         "selectedTwoPlyExecution": sum(r["arms"][i]["observedExecution"] for r in direct),
                         "removedReintroductionsObserved": sum(r["immediate"] == "removed" and r["arms"][i]["observedReach"] for r in cells),
                         "licensedAvailability": counts([r["arms"][i] for r in cells], "licensedAvailability"),
                         "reachKnowledge": counts([{"reach": json.dumps(r["arms"][i]["reachKnowledge"])} for r in cells], "reach")})
        phase_mix.append({"phase": phase, "roots": sum(r["phase"] == phase for r in frame["roots"]),
                          "candidates": sum(r["phase"] == phase for r in population), "cells": len(cells),
                          "focus": counts(cells, "focus"), "families": counts(cells, "family"), "arms": arms})
    return {"version": 1, "profile": "d3262-coherent-qualification-v1", "manifest": frame["manifest"],
            "inputDigests": input_digests, "authority": "scope_and_source_agreement_not_consumer_usefulness_or_engine_causality",
            "productionProfileSelected": False, "original196": "preserved_separately_not_pooled", "population": population,
            "focus": {"roots": counts(frame["roots"], "focus"), "candidates": counts(population, "focus"), "namedCells": counts(common["rows"], "focus"),
                      "inference": "missing_focus_is_unknown_not_material_equals_tactics_or_destination_equals_plan"},
            "phaseMix": phase_mix, "controls": controls, "rootAgreement": root_agreement, "pairAgreement": pair_agreement, "retainedBytes": sizes,
            "qualification": {"scopedOperandEvidence": "checked_at_declared_bounds", "signedRootBenefit": "not_established", "engineCausality": "not_established",
                              "tacticalQuietGeneralization": "controls_only_no_labelled_main_population", "consumerComprehensionAndUsefulness": "not_measured",
                              "coldWarmProviderOfflineEndToEndCost": "not_measured", "completeProductionCandidate": False},
            "nextAction": "measure_actual_end_to_end_cost_and_complete_declared_consumer_scope_before_profile_selection"}


def verify(output, expected):
    require(output == expected, "qualification differs from independent scope/rank/board reconstruction")


def negative_controls(output, expected):
    mutations = [lambda r: r["population"].pop(),
                 lambda r: r["focus"]["namedCells"].update({"tactical": 182}),
                 lambda r: r["controls"][0]["arms"][0].update({"retreatForced": True}),
                 lambda r: r["controls"][1]["arms"][0].update({"verdict": "autonomous_plan_detected"}),
                 lambda r: r["controls"][2]["arms"][0].update({"verdict": "named_geometric_relation_retained_all_exact_replies"}),
                 lambda r: r["controls"][2]["reference"].update({"allReplyRetained": True}),
                 lambda r: r["controls"][3]["arms"].pop(),
                 lambda r: r["rootAgreement"][0]["bests"][0].update({"uci": "a1a8"}),
                 lambda r: r["pairAgreement"][0]["readings"][0].update({"cpOrder": "root_move_is_good"}),
                 lambda r: r["phaseMix"][0].update({"cells": 0}),
                 lambda r: r["retainedBytes"][0].update({"scope": "peak_memory_and_ui_latency"}),
                 lambda r: r["qualification"].update({"engineCausality": "proved"}),
                 lambda r: r.update({"productionProfileSelected": True}),
                 lambda r: r["qualification"].update({"consumerComprehensionAndUsefulness": "passed"})]
    for mutate in mutations:
        altered = copy.deepcopy(output)
        mutate(altered)
        try:
            verify(altered, expected)
        except AssertionError:
            continue
        raise AssertionError("actual qualification corruption survived")
    return len(mutations)


if __name__ == "__main__":
    expected = expected_output()
    output = json.loads((DIRECTORY / OUTPUT).read_bytes())
    verify(output, expected)
    refused = negative_controls(output, expected) if "--negative-controls" in sys.argv else 0
    print(json.dumps({"independent": "python_chess_control_boards_and_complete_scope_budget_reconstruction", "candidates": len(output["population"]),
                      "cells": sum(p["cells"] for p in output["phaseMix"]), "controlArms": sum(len(c["arms"]) for c in output["controls"]),
                      "rankPairs": len(output["pairAgreement"]), "corruptionsRefused": refused}))
