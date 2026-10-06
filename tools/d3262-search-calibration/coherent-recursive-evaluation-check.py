"""D3491 independent actual identity/board/selection/contrast/quantifier joins.

The registered local SEE availability predicate remains shared, not independently
verified strategic truth. D3492's special-move limitation is explicit.
"""
import gzip
import json
import runpy
import sys
from pathlib import Path

import chess

HERE = Path(__file__).parent
target_helpers = runpy.run_path(str(HERE / "coherent-maia-target-check.py"))
observer, terminal = [target_helpers[n] for n in ["observe", "terminal"]]
proof_helpers = runpy.run_path(str(HERE / "coherent-actual-proof-check.py"))
preparation_result, root_result, push = [proof_helpers[n] for n in ["preparation_result", "root_result", "push"]]
contrast_helpers = runpy.run_path(str(HERE / "coherent-actual-contrast-check.py"))
same_json, direction, digest, require = [contrast_helpers[n] for n in ["same_json", "direction", "digest", "require"]]
NAMES = ["d3262-coherent-target-comparison-frame.json", "d3262-coherent-root-frame.json",
         "d3262-coherent-bounded-targets.json", "d3262-coherent-recursive-semantic-frame.json.gz",
         "d3262-coherent-recursive-fourth-ply.json.gz", "d3262-coherent-bounded-contrast.json",
         "d3262-coherent-actual-proof.json.gz"]
OUTPUT = "d3262-coherent-recursive-evaluation.json.gz"
DIRECTORY = Path("planning/semantic-consequence-search")
ARMS = [f"recursive:{b}:top{w}:{s}" for b in ["depth8", "depth12", "movetime100"] for w in [2, 4, 8] for s in ["top8", "all_legal"]]
LIMITATIONS = ["shared_local_see_not_independent_strategic_truth",
              "legacy_material_predicate_does_not_resolve_en_passant_or_promotion_captures_D3492"]


def ident(values):
    return digest(json.dumps(values, separators=(",", ":")).encode())


def ck(row, candidate=None):
    return row["rootId"], row["targetId"], candidate if candidate is not None else row["candidateUci"]


def target_summary(chosen):
    before = [p["before"] for p in chosen]
    leaves = [(p["before"], leaf) for p in chosen for leaf in p["leaves"]]
    return dict(selectedPredecessorPaths=len(before), selectedFourthPlyLeaves=len(leaves),
                opportunityPaths=[p["pathId"] for p in before if p["observation"]["opportunityAtThirdPly"]],
                reintroducedPaths=[p["pathId"] for p in before if p["observation"]["reintroducedAtThirdPly"]],
                executedLeaves=[leaf["pathId"] for _, leaf in leaves if leaf["observation"]["executedAtFourthPly"]],
                executedReintroducedLeaves=[leaf["pathId"] for pre, leaf in leaves if pre["observation"]["reintroducedAtThirdPly"] and leaf["observation"]["executedAtFourthPly"]],
                weightAuthority="unweighted_selected_paths_not_policy_mass_or_human_frequency",
                negativeVerdict="abstain_from_partial_frontier", universalVerdict="not_evaluated",
                proofCeiling="observed_provider_selected_lines_only")


def observed_arm(cell, arm):
    opportunity = cell["immediate"] == "preserved" or bool(arm["reintroducedPaths"])
    return dict(status="direct_witness" if cell["immediate"] == "preserved" else "visited_reintroduction_witness"
                if arm["reintroducedPaths"] else "unknown_partial_frontier", opportunity=opportunity,
                execution=bool(arm["executedLeaves"]), **{f: arm[f] for f in
                    ["selectedPredecessorPaths", "selectedFourthPlyLeaves", "opportunityPaths", "reintroducedPaths",
                     "executedLeaves", "executedReintroducedLeaves", "negativeVerdict", "universalVerdict", "proofCeiling",
                     "omissions", "absorbingThirdPlyPaths", "weightAuthority"]})


def compare_arms(source, alternative, exact):
    certified = "same" if source["opportunity"] and alternative["opportunity"] else None
    require(certified is None or certified == exact, "positive contrast exceeds exact baseline")
    observed = direction(source["opportunity"], alternative["opportunity"])
    return dict(source=source, alternative=alternative, observedOpportunity=observed,
                observedExecution=direction(source["execution"], alternative["execution"]),
                certifiedOpportunity=certified, abstains=certified is None, certifiedExecution=None,
                executionAbsenceVerdict="abstain_from_partial_frontier",
                apparentOnExactSame=exact == "same" and observed != "same", reasonDisposition="not_an_engine_reason")


def reconstruct(output, inputs, digests, oracle_digest):
    comparison, roots_frame, bounded, frozen, frontier, contrast, previous = inputs
    require(len(comparison["comparisons"]) == len(bounded["rows"]) == len(frontier["rows"]) == 182
            and len(roots_frame["roots"]) == 66 and len(comparison["definitions"]) == 64
            and frontier["arms"] == frozen["arms"] == ARMS and len(frontier["candidateCoverage"]) == 193
            and len(contrast["rows"]) == 116 and len(contrast["unpairedTargets"]) == 17, "independent population")
    require(frontier["frozenFrameDigest"] == digests[NAMES[3]] and same_json(frontier["rows"], frozen["rows"])
            and same_json(frontier["paths"], frozen["paths"]), "independent frozen selection")
    roots = {r["rootId"]: r for r in roots_frame["roots"]}
    definitions = {r["id"]: r for r in comparison["definitions"]}
    exact = {ck(r): r for r in bounded["rows"]}
    source_cells = {ck(r): r for r in frontier["rows"]}
    paths = {p["id"]: p for p in frontier["paths"]}
    final = {(n["pathId"], n["targetId"], n["arm"]): n for n in frontier["finalPlyNodes"]}
    graph = []
    for root in roots_frame["roots"]:
        for candidate in root["candidates"]:
            after = push(chess.Board(root["fen"]), candidate["moveUci"])
            preparations = []
            for move in sorted(after.legal_moves, key=lambda m: m.uci()):
                before = push(after, move.uci())
                preparations.append(dict(preparationUci=move.uci(), fen=before.fen(en_passant="legal"),
                                         terminalReason=terminal(before), legalDefences=sorted(m.uci() for m in before.legal_moves)))
            graph.append(dict(rootId=root["rootId"], rootFen=root["fen"], candidateUci=candidate["moveUci"],
                              afterFen=after.fen(en_passant="legal"), terminalReason=terminal(after), preparations=preparations))
    require(same_json(graph, previous["candidateGraph"]), "historical graph versus independent legal graph")
    graphs = {(g["rootId"], g["candidateUci"]): g for g in graph}
    observations = {o["id"]: o for o in output["observations"]}
    require(len(observations) == len(output["observations"]), "duplicate observations")
    consumed, ordinals = {}, {}

    def observe(root, target, path_id, history, fen, reason, baseline):
        oid = ident([target["id"], root["rootId"], *history])
        if oid not in consumed:
            item = observations.get(oid)
            require(item is not None and item["pathId"] == path_id == ident([root["rootId"], *history])
                    and item["rootId"] == root["rootId"] and item["targetId"] == target["id"], "named selected observation")
            o = item["observation"]
            require(all(type(o[f]) is bool for f in ["opportunityAtThirdPly", "reintroducedAtThirdPly", "executedAtFourthPly"])
                    and all(type(s["ply"]) is int for s in o["snapshots"]), "typed observation")
            observer(root["fen"], history, target, o)
            last = o["snapshots"][-1]
            require(last["fen"] == fen and last["terminalReason"] == reason and o["immediate"] == baseline["immediate"]
                    and (not o["reintroducedAtThirdPly"] or baseline["reintroducedWithin3Ply"]), "target baseline/selected board")
            ordinals[oid] = len(consumed)
            consumed[oid] = item
            if len(consumed) % 20000 == 0:
                print(json.dumps(dict(independentObservations=len(consumed))), flush=True)
        return consumed[oid]

    rows, proofs, projected = [], [], {}
    for pair in comparison["comparisons"]:
        root, target, baseline = roots[pair["rootId"]], definitions[pair["targetId"]], exact[ck(pair)]
        source, g = source_cells[ck(pair)], graphs[(pair["rootId"], pair["candidateUci"])]
        context = dict(pair, family=target["family"], phase=root["phase"], immediate=baseline["immediate"],
                       exactBaseline={f: baseline[f] for f in ["reintroducedWithin3Ply", "preparationSurvivesEveryDefence"]})
        arms, proof_arms = [], []
        for selected in source["arms"]:
            chosen = []
            for reply in selected["replies"]:
                for entry in reply["selected"]:
                    path = paths[entry["pathId"]]
                    require(path["historyUci"] == [pair["candidateUci"], reply["replyUci"], entry["learnerUci"]]
                            and path["rootId"] == pair["rootId"], "selected predecessor")
                    node = final[(path["id"], target["id"], selected["arm"])]
                    pre = observe(root, target, path["id"], path["historyUci"], path["fen"], path["terminalReason"], baseline)
                    leaves = [observe(root, target, leaf["leafId"], [*path["historyUci"], leaf["moveUci"]],
                                      leaf["fen"], leaf["terminalReason"], baseline) for leaf in node["selected"]]
                    chosen.append(dict(path=path, node=node, before=pre, leaves=leaves))
            summary = target_summary(chosen)
            visited = [dict(pathId=p["path"]["id"], preparationUci=p["path"]["historyUci"][1], learnerUci=p["path"]["historyUci"][2],
                            opportunity=p["before"]["observation"]["opportunityAtThirdPly"],
                            executedLeaves=[leaf["pathId"] for leaf in p["leaves"] if leaf["observation"]["executedAtFourthPly"]]) for p in chosen]
            preparations = []
            for uci in selected["selectedReplyUcis"]:
                prep = next(p for p in g["preparations"] if p["preparationUci"] == uci)
                observed = [p for p in visited if p["preparationUci"] == uci]
                preparations.append(dict(preparationUci=uci, observed=observed,
                                         **preparation_result(prep["legalDefences"], prep["terminalReason"], observed)))
            result = root_result(context["immediate"], [p["preparationUci"] for p in g["preparations"]] if g["terminalReason"] is None else [], preparations)
            require(result["availability"] != "exists_preparation_surviving_all_defences" or baseline["preparationSurvivesEveryDefence"], "universal exceeds baseline")
            require(result["availability"] != "every_preparation_refuted_at_bound" or not baseline["preparationSurvivesEveryDefence"], "refutation contradicts baseline")
            proof_arms.append(dict(arm=selected["arm"], sourceProofCeiling=summary["proofCeiling"],
                                   productionDisposition="research_quantifier_receipt_not_production_authority", **result, preparations=preparations))
            aggregate = dict(arm=selected["arm"], **summary,
                             paths=[dict(predecessorObservation=ordinals[p["before"]["id"]], leafObservations=[ordinals[leaf["id"]] for leaf in p["leaves"]]) for p in chosen],
                             omissions=dict(firstReplies=selected["omittedFirstReplies"],
                                 learnerEdgesWithinSelectedReplies=sum(r["omittedLegal"] for r in selected["replies"]),
                                 fourthRepliesWithinSelectedNonterminalPaths=sum(p["node"]["omittedLegal"] for p in chosen)),
                             absorbingThirdPlyPaths=[p["path"]["id"] for p in chosen if p["node"]["status"] == "absorbing_terminal"])
            arms.append(aggregate)
        row = dict(context, arms=arms); rows.append(row)
        proofs.append(dict(context, arms=proof_arms))
        projected[ck(pair)] = {a["arm"]: observed_arm(row, a) for a in arms}
    require(list(consumed) == [o["id"] for o in output["observations"]], "orphan/reordered observation population")
    contrasts = []
    contexts = {ck(row): row for row in rows}
    for pair in contrast["rows"]:
        source = contexts[ck(pair, pair["sourceCandidateUci"])]
        alternative = contexts[ck(pair, pair["alternativeCandidateUci"])]
        exact_direction = direction(pair["source"]["immediate"] == "preserved" or pair["source"]["reintroducedWithin3Ply"],
                                    pair["alternative"]["immediate"] == "preserved" or pair["alternative"]["reintroducedWithin3Ply"])
        contrasts.append(dict(rootId=pair["rootId"], targetId=pair["targetId"], family=pair["family"], phase=source["phase"],
                              sourceCandidateUci=pair["sourceCandidateUci"], alternativeCandidateUci=pair["alternativeCandidateUci"],
                              boundedScope=pair["boundedScope"], exact=exact_direction, rootRanks=pair["rootRanks"],
                              arms=[dict(arm=arm, **compare_arms(projected[ck(source)][arm], projected[ck(alternative)][arm], exact_direction)) for arm in ARMS]))
    return dict(version=1, profile="d3262-coherent-recursive-evaluation-v1", manifest=comparison["manifest"],
                authority="disposable_actual_recursive_paths_shared_local_predicate_exact_decision_sets_not_engine_cause_or_production_proof",
                oracleSourceDigest=oracle_digest, oracleLimitations=LIMITATIONS, inputDigests=digests, controls=comparison["controls"],
                referenceEncoding="zero_based_global_observation_indices_with_literal_named_path_identity",
                target=dict(kind="recursive_relation_reserve", arms=ARMS, rows=rows,
                            candidateCoverage=frontier["candidateCoverage"], controls=comparison["controls"]),
                observations=digest(json.dumps(output["observations"], separators=(",", ":")).encode()), candidateGraph=graph,
                proof=dict(quantifier="exists_opponent_preparation_forall_legal_learner_defences_exists_named_target_available_at_ply4",
                           bounds=dict(preparationPly=2, defencePly=3, targetActionPly=4), arms=ARMS, rows=proofs),
                contrast=dict(arms=ARMS, rows=contrasts, unpairedTargets=contrast["unpairedTargets"]))


def verify(output, expected):
    require(set(output) == set(expected), "declared output fields")
    for field, wanted in expected.items():
        actual = digest(json.dumps(output[field], separators=(",", ":")).encode()) if field == "observations" else output[field]
        require(same_json(actual, wanted), "independent recursive evaluation mismatch: " + field)


def main():
    raws = [(DIRECTORY / name).read_bytes() for name in NAMES]
    inputs = [json.loads(gzip.decompress(raw) if name.endswith(".gz") else raw) for name, raw in zip(NAMES, raws)]
    require(digest(raws[4]) == "sha256:e393b10383db546f05ae40957f9bf8c72f53b4c28bb220ba6514e08edab21472", "changed independently replayed traversal")
    raw = (DIRECTORY / OUTPUT).read_bytes(); output = json.loads(gzip.decompress(raw))
    expected = reconstruct(output, inputs, dict(zip(NAMES, map(digest, raws))), digest((HERE / "coherent-bounded-targets.ts").read_bytes()))
    verify(output, expected)
    edits = [(output["target"], "rows", output["target"]["rows"][:-1]),
             (output["target"], "candidateCoverage", output["target"]["candidateCoverage"][:-1]),
             (output, "oracleLimitations", []), (output, "authority", "production_proof"),
             (output["observations"][0], "pathId", "not_selected"),
             (output["observations"][0]["observation"], "opportunityAtThirdPly", not output["observations"][0]["observation"]["opportunityAtThirdPly"]),
             (output["observations"][0]["observation"]["snapshots"][0], "fen", "crossed"),
             (output["target"]["rows"][0]["arms"][0]["paths"][0], "predecessorObservation", True),
             (output["proof"], "quantifier", "exists_one_observation"),
             (output["proof"]["rows"][0]["arms"][0], "availability", "exists_preparation_surviving_all_defences"),
             (output["proof"]["rows"][0]["arms"][0], "omittedPreparations", ["forged"]),
             (output["contrast"]["rows"][0]["arms"][0], "certifiedOpportunity", "source_only_opponent_option"),
             (output["contrast"], "unpairedTargets", [])]
    refused = 0
    if "--negative-controls" in sys.argv:
        for obj, field, changed in edits:
            original = obj[field]; obj[field] = changed
            try:
                try:
                    verify(output, expected)
                except AssertionError:
                    refused += 1
                else:
                    raise RuntimeError("Accepted recursive evaluation corruption: " + field)
            finally:
                obj[field] = original
    print(json.dumps(dict(check="independent-recursive-target-contrast-quantifiers", digest=digest(raw),
                         observations=len(output["observations"]), cells=len(output["target"]["rows"]),
                         arms=len(ARMS), pairs=len(output["contrast"]["rows"]), corruptionRefusals=refused, result="passed")))


if __name__ == "__main__":
    main()
