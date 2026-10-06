"""Disposable D3262/D3487 independent actual-source contrast reconstruction.

Rebuilds every pair from selected target observations, not JS contrast output.
Earlier source/frontier/target checkers own board replay and local SEE scope.
"""
import argparse
import gzip
import hashlib
import json
from pathlib import Path

DIRECTORY = Path("planning/semantic-consequence-search")
NAMES = ["d3262-coherent-bounded-contrast.json", "d3262-coherent-engine-target-outcome.json.gz",
         "d3262-coherent-maia-target-outcome.json"]
OUTPUT = "d3262-coherent-actual-contrast.json"
PROOF = {"model": "observed_configured_model_paths_only", "engine": "observed_provider_selected_lines_only",
         "semantic_first_reply_reserve": "observed_provider_selected_lines_only"}
ARRAYS = ["opportunityPaths", "reintroducedPaths", "executedLeaves", "executedReintroducedLeaves"]
MASS_FIELDS = ["opportunityMass", "reintroducedOpportunityMass", "executionMass", "reintroducedExecutionMass",
               "coveredPredecessorMass", "coveredFourthPlyMass", "residualMass"]


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def same_json(a, b):
    # Python True == 1 is not equality of typed JSON evidence.
    if isinstance(a, bool) or isinstance(b, bool):
        return type(a) is type(b) and a == b
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(same_json(a[field], b[field]) for field in a)
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(same_json(x, y) for x, y in zip(a, b))
    return a == b


def digest(raw):
    return "sha256:" + hashlib.sha256(raw).hexdigest()


def key(row, candidate=None):
    return row["rootId"], row["targetId"], row["candidateUci"] if candidate is None else candidate


def ordered_sum(values):
    # Python 3.12+ sum uses compensation; the source renderer uses JS's
    # left-to-right IEEE-754 reduce. Match that recorded arithmetic exactly.
    total = 0.0
    for value in values:
        total += value
    return total


def direction(a, b):
    require(type(a) is bool and type(b) is bool, "direction requires booleans")
    return "same" if a == b else "source_only_opponent_option" if a else "alternative_only_opponent_option"


def engine_summary(cell, arm, observations):
    def resolve(i):
        require(type(i) is int and 0 <= i < len(observations), "compact ordinal")
        item = observations[i]
        require((item["rootId"], item["targetId"]) == (cell["rootId"], cell["targetId"]), "named witness identity")
        require(item["observation"]["immediate"] == cell["immediate"], "witness immediate")
        return item

    before, leaves = [], []
    for path in arm["paths"]:
        require(set(path) == {"predecessorObservation", "leafObservations"}, "compact path shape")
        pre = resolve(path["predecessorObservation"])
        before.append(pre)
        for ordinal in path["leafObservations"]:
            leaf = resolve(ordinal)
            require(not leaf["observation"]["executedAtFourthPly"] or pre["observation"]["opportunityAtThirdPly"],
                    "execution without predecessor opportunity")
            leaves.append((pre, leaf))
    require(len({row["pathId"] for row in before}) == len(before), "duplicate predecessors")
    require(len({leaf["pathId"] for _, leaf in leaves}) == len(leaves), "duplicate leaves")
    return {"selectedPredecessorPaths": len(before), "selectedFourthPlyLeaves": len(leaves),
            "opportunityPaths": [row["pathId"] for row in before if row["observation"]["opportunityAtThirdPly"]],
            "reintroducedPaths": [row["pathId"] for row in before if row["observation"]["reintroducedAtThirdPly"]],
            "executedLeaves": [leaf["pathId"] for _, leaf in leaves if leaf["observation"]["executedAtFourthPly"]],
            "executedReintroducedLeaves": [leaf["pathId"] for pre, leaf in leaves
                                            if pre["observation"]["reintroducedAtThirdPly"] and leaf["observation"]["executedAtFourthPly"]]}


def model_summary(cell, arm):
    entries = [(path, selected) for path in cell["paths"] for selected in path["arms"] if selected["arm"] == arm["arm"]]
    leaves = [(path, leaf) for path, selected in entries for leaf in selected["leaves"]]
    require(len({path["id"] for path, _ in entries}) == len(entries), "duplicate model predecessor")
    require(len({leaf["leafId"] for _, leaf in leaves}) == len(leaves), "duplicate model leaf")
    selected = {"selectedPredecessorPaths": len(entries), "selectedFourthPlyLeaves": len(leaves),
                "opportunityPaths": [path["id"] for path, _ in entries if path["observation"]["opportunityAtThirdPly"]],
                "reintroducedPaths": [path["id"] for path, _ in entries if path["observation"]["reintroducedAtThirdPly"]],
                "executedLeaves": [leaf["leafId"] for _, leaf in leaves if leaf["observation"]["executedAtFourthPly"]],
                "executedReintroducedLeaves": [leaf["leafId"] for path, leaf in leaves
                                                if path["observation"]["reintroducedAtThirdPly"] and leaf["observation"]["executedAtFourthPly"]]}
    masses = {"opportunityMass": ordered_sum(part["pathMass"] for path, part in entries if path["observation"]["opportunityAtThirdPly"]),
              "reintroducedOpportunityMass": ordered_sum(part["pathMass"] for path, part in entries if path["observation"]["reintroducedAtThirdPly"]),
              "executionMass": ordered_sum(leaf["jointMass"] for _, leaf in leaves if leaf["observation"]["executedAtFourthPly"]),
              "reintroducedExecutionMass": ordered_sum(leaf["jointMass"] for path, leaf in leaves
                                                 if path["observation"]["reintroducedAtThirdPly"] and leaf["observation"]["executedAtFourthPly"])}
    require(all(arm[field] == value for field, value in masses.items()), "literal model witness mass")
    return selected


def project(cell, arm, kind, observations):
    require(arm["negativeVerdict"] == "abstain_from_partial_frontier" and arm["universalVerdict"] == "not_evaluated"
            and arm["proofCeiling"] == PROOF[kind], "partial proof authority")
    selected = model_summary(cell, arm) if kind == "model" else engine_summary(cell, arm, observations)
    require(all(same_json(arm[field], value) for field, value in selected.items()), "actual selected witness summary")
    require(not selected["reintroducedPaths"] or cell["exactBaseline"]["reintroducedWithin3Ply"], "witness exceeds baseline")
    opportunity = cell["immediate"] == "preserved" or bool(selected["reintroducedPaths"])
    status = "direct_witness" if cell["immediate"] == "preserved" else "visited_reintroduction_witness" if selected["reintroducedPaths"] else "unknown_partial_frontier"
    result = {"status": status, "opportunity": opportunity, "execution": bool(selected["executedLeaves"]), **selected,
              "negativeVerdict": arm["negativeVerdict"], "universalVerdict": arm["universalVerdict"], "proofCeiling": arm["proofCeiling"]}
    if kind == "model":
        require(abs(arm["coveredFourthPlyMass"] + arm["residualMass"] - 1) <= 1e-5, "model residual")
        result.update(modelMass={field: arm[field] for field in MASS_FIELDS}, weightAuthority="literal_configured_model_mass_not_human_frequency")
    else:
        require(arm["weightAuthority"] == "unweighted_selected_paths_not_policy_mass_or_human_frequency", "engine weight authority")
        result.update(omissions=arm["omissions"], absorbingThirdPlyPaths=arm["absorbingThirdPlyPaths"], weightAuthority=arm["weightAuthority"])
    return result


def reconstruct(contrast, engine, model, digests):
    require(len(contrast["rows"]) == 116 and len(contrast["unpairedTargets"]) == 17 and len(engine["observations"]) == 166835,
            "actual source population")
    require(len(model["rows"]) == 182 and len(engine["profiles"]) == 2, "target source population")
    require(contrast["manifest"] == engine["manifest"] == model["manifest"], "source manifest")
    for name in ["d3262-coherent-root-frame.json", "d3262-coherent-target-comparison-frame.json", "d3262-coherent-bounded-targets.json"]:
        require(contrast["inputDigests"][name] == engine["inputDigests"][name] == model["inputDigests"][name], "source digest")
    require(engine["controls"] == model["controls"] and len(engine["controls"]) == 4, "source controls")
    profiles = []
    for profile in [*engine["profiles"], {"kind": "model", "arms": model["modelArms"], "rows": model["rows"]}]:
        kind, arms = profile["kind"], profile["arms"]
        require(len(arms) == {"engine": 9, "semantic_first_reply_reserve": 18, "model": 2}[kind] and len(set(arms)) == len(arms), "source arms")
        cells = {key(cell): cell for cell in profile["rows"]}
        require(len(cells) == len(profile["rows"]) == 182, "source cells")
        if kind == "semantic_first_reply_reserve":
            require(len(profile["candidateCoverage"]) == 193 and len(profile["controls"]) == 4, "offered controls")
        projected = {key(cell): {arm["arm"]: project(cell, arm, kind, engine["observations"]) for arm in cell["arms"]}
                     for cell in profile["rows"]}
        rows = []
        for pair in contrast["rows"]:
            source_key, alternative_key = key(pair, pair["sourceCandidateUci"]), key(pair, pair["alternativeCandidateUci"])
            source, alternative = cells[source_key], cells[alternative_key]
            require(source["sourceObserved"] is True and alternative["sourceObserved"] is False, "paired source identity")
            for side, cell in [("source", source), ("alternative", alternative)]:
                require(cell["family"] == pair["family"] and cell["immediate"] == pair[side]["immediate"]
                        and cell["exactBaseline"] == {field: pair[side][field] for field in ["reintroducedWithin3Ply", "preparationSurvivesEveryDefence"]}, "paired baseline")
            exact = direction(pair["source"]["immediate"] == "preserved" or pair["source"]["reintroducedWithin3Ply"],
                              pair["alternative"]["immediate"] == "preserved" or pair["alternative"]["reintroducedWithin3Ply"])
            require(exact == pair["reachWithinBound"], "exact direction")
            chosen = []
            for name in arms:
                a, b = projected[source_key][name], projected[alternative_key][name]
                observed = direction(a["opportunity"], b["opportunity"])
                certified = "same" if a["opportunity"] and b["opportunity"] else None
                require(certified is None or certified == exact, "positive contrast baseline")
                chosen.append({"arm": name, "source": a, "alternative": b, "observedOpportunity": observed,
                               "observedExecution": direction(a["execution"], b["execution"]), "certifiedOpportunity": certified,
                               "abstains": certified is None, "certifiedExecution": None,
                               "executionAbsenceVerdict": "abstain_from_partial_frontier",
                               "apparentOnExactSame": exact == "same" and observed != "same", "reasonDisposition": "not_an_engine_reason"})
            rows.append({**{field: pair[field] for field in ["rootId", "targetId", "family", "sourceCandidateUci", "alternativeCandidateUci", "boundedScope", "rootRanks"]},
                         "phase": source["phase"], "exact": exact, "arms": chosen})
        profiles.append({"kind": kind, "arms": arms, "rows": rows, "candidateCoverage": profile.get("candidateCoverage"), "controls": profile.get("controls")})
    return {"version": 1, "profile": "d3262-coherent-actual-contrast-v1", "manifest": contrast["manifest"], "inputDigests": digests,
            "authority": "same_named_target_actual_partial_paths_with_abstention_not_prevention_or_engine_causality",
            "unpairedTargets": contrast["unpairedTargets"], "controls": engine["controls"], "profiles": profiles}


def verify(expected, actual):
    require(same_json(expected, actual), "actual contrast differs from independently reconstructed source/target/selection/proof")


def negative_controls(expected, actual):
    arm = actual["profiles"][0]["rows"][0]["arms"][0]
    controls = [
        (actual, "unpairedTargets", actual["unpairedTargets"][:-1], "lost unpaired target"),
        (actual["profiles"][0], "rows", actual["profiles"][0]["rows"][:-1], "lost pair"),
        (actual["profiles"][1], "candidateCoverage", actual["profiles"][1]["candidateCoverage"][:-1], "lost offered control"),
        (arm, "certifiedOpportunity", "source_only_opponent_option", "forged direction"),
        (arm, "certifiedExecution", "same", "forged executed contrast"),
        (arm["source"], "omissions", {"firstReplies": 0}, "lost omissions"),
        (arm["source"], "executedLeaves", ["unplayed-capture"], "invented target execution"),
        (actual["profiles"][2]["rows"][0]["arms"][0]["source"]["modelMass"], "residualMass", -1, "forged model coverage"),
        (actual["inputDigests"], NAMES[1], "changed", "crossed provider digest"),
        (arm["source"], "opportunity", int(arm["source"]["opportunity"]), "boolean witness forged as number"),
    ]
    for item, field, value, label in controls:
        previous = item[field]
        require(not same_json(previous, value), "vacuous corruption: " + label)
        item[field] = value
        try:
            try:
                verify(expected, actual)
            except AssertionError:
                continue
            raise AssertionError("accepted corruption: " + label)
        finally:
            item[field] = previous
    return [label for _, _, _, label in controls]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--negative-controls", action="store_true")
    args = parser.parse_args()
    raw = [(DIRECTORY / name).read_bytes() for name in NAMES]
    inputs = [json.loads(gzip.decompress(data) if name.endswith(".gz") else data) for name, data in zip(NAMES, raw)]
    expected = reconstruct(*inputs, {name: digest(data) for name, data in zip(NAMES, raw)})
    actual = json.loads((DIRECTORY / OUTPUT).read_bytes())
    verify(expected, actual)
    refused = negative_controls(expected, actual) if args.negative_controls else []
    verify(expected, actual)
    print(json.dumps({"profiles": len(actual["profiles"]), "pairsPerProfile": 116, "arms": 29, "pairedArms": 3364,
                      "unpairedTargets": 17, "negativeControls": refused, "scope": "independent_contrast_algebra_over_checked_actual_target_sources_not_new_board_or_strategic_truth"}))
