"""Independent D3486 board/identity/source-selection join, without inference.

The local SEE/quiet-availability predicate is shared; this is not independent
strategic truth. Actual selected execution and identities are independently replayed.
"""
import gzip
import hashlib
import json
import runpy
import sys
from pathlib import Path


DIRECTORY = Path("planning/semantic-consequence-search")
NAMES = ["d3262-coherent-target-comparison-frame.json", "d3262-coherent-root-frame.json",
         "d3262-coherent-bounded-targets.json", "d3262-coherent-engine-fourth-ply.json.gz"]
OUTPUT = "d3262-coherent-engine-target-outcome.json.gz"
observer = runpy.run_path(str(Path(__file__).with_name("coherent-maia-target-check.py")))["observe"]


def require(value, message):
    if not value:
        raise AssertionError(message)


def digest(raw):
    return "sha256:" + hashlib.sha256(raw).hexdigest()


def observation_id(target, root, history):
    return digest(json.dumps([target, root, *history], separators=(",", ":")).encode())


def expected_outcome(output, inputs):
    comparison, roots_frame, bounded, frontier = [inputs[name] for name in NAMES]
    require(len(comparison["comparisons"]) == len(bounded["rows"]) == 182 and len(comparison["definitions"]) == 64
            and len(comparison["controls"]) == 4 and len(roots_frame["roots"]) == 66
            and frontier["profile"] == "d3262-coherent-engine-fourth-ply-v1" and len(frontier["profiles"]) == 2
            and all(value["manifest"] == comparison["manifest"] for value in [roots_frame, bounded, frontier]), "Crossed independent target population")
    require(comparison["rootFrameDigest"] == output["inputDigests"][NAMES[1]]
            and bounded["inputDigests"][NAMES[0]] == output["inputDigests"][NAMES[0]]
            and bounded["inputDigests"][NAMES[1]] == output["inputDigests"][NAMES[1]], "Crossed independent exact baseline input")
    roots = {row["rootId"]: row for row in roots_frame["roots"]}
    definitions = {row["id"]: row for row in comparison["definitions"]}
    key = lambda row: (row["rootId"], row["targetId"], row["candidateUci"])
    baseline = {key(row): row for row in bounded["rows"]}
    paths = {row["id"]: row for profile in frontier["profiles"] for row in profile["paths"]}
    leaves = {row["id"]: row for row in frontier["leaves"]}
    observations = {row["id"]: row for row in output["observations"]}
    observation_indices = {row["id"]: i for i, row in enumerate(output["observations"])}
    require(len(observations) == len(output["observations"]), "Duplicated independent target observation")
    predecessor_count = leaf_count = 0
    for item in observations.values():
        path = paths.get(item["pathId"], leaves.get(item["pathId"]))
        target, root = definitions.get(item["targetId"]), roots.get(item["rootId"])
        require(path is not None and target is not None and root is not None and path["rootId"] == root["rootId"] == target["rootId"]
                and path["rootFen"] == root["fen"] and item["id"] == observation_id(target["id"], root["rootId"], path["historyUci"]),
                "Crossed independently named observation identity")
        observed = item["observation"]
        observer(root["fen"], path["historyUci"], target, observed)
        last = observed["snapshots"][-1]
        exact = baseline[(root["rootId"], target["id"], path["historyUci"][0])]
        require(last["fen"] == path["fen"] and last["terminalReason"] == path["terminalReason"]
                and observed["immediate"] == exact["immediate"]
                and (not observed["reintroducedAtThirdPly"] or exact["reintroducedWithin3Ply"]), "Observed target exceeds exact baseline/board")
        if len(path["historyUci"]) == 3:
            predecessor_count += 1
        else:
            require(len(path["historyUci"]) == 4, "Changed target observation horizon")
            leaf_count += 1
    consumed, profiles = set(), []
    for source in frontier["profiles"]:
        profile_key = (lambda row: (row["rootId"], row["candidateUci"])) if source["kind"] == "engine" else key
        candidates = {profile_key(row): row for row in source["rows"]}
        predecessors = {row["id"]: row for row in source["paths"]}
        rows = []
        for pair in comparison["comparisons"]:
            exact, target, candidate = baseline[key(pair)], definitions[pair["targetId"]], candidates[profile_key(pair)]
            arm_rows = []
            for arm in source["arms"]:
                selected = next(value for value in candidate["arms"] if value["arm"] == arm)
                require(selected["universalVerdict"] == "not_evaluated" and selected["negativeVerdict"] == "abstain_partial", "Invented independent source proof")
                chosen = []
                for path_id in selected["selectedPaths"]:
                    path = predecessors[path_id]
                    require(path["rootId"] == pair["rootId"] and path["historyUci"][0] == pair["candidateUci"], "Crossed selected target candidate")
                    path_arm = next(value for value in path["arms"] if value["arm"] == arm)
                    oid = observation_id(target["id"], pair["rootId"], path["historyUci"])
                    require(oid in observations and observations[oid]["pathId"] == path_id, "Missing independently selected predecessor observation")
                    consumed.add(oid)
                    selected_leaves = []
                    for entry in path_arm["selected"]:
                        leaf = leaves[entry["leafId"]]
                        require(leaf["historyUci"][:3] == path["historyUci"] and leaf["historyUci"][3] == entry["moveUci"], "Crossed independently selected leaf prefix")
                        lid = observation_id(target["id"], pair["rootId"], leaf["historyUci"])
                        require(lid in observations and observations[lid]["pathId"] == leaf["id"], "Missing independently selected execution observation")
                        consumed.add(lid)
                        selected_leaves.append({"leafId": leaf["id"], "observationId": lid})
                    chosen.append({"pathId": path_id, "observationId": oid, "leaves": selected_leaves})
                require(len({row["pathId"] for row in chosen}) == len(chosen), "Duplicated independent predecessor count")
                opportunity, reintroduced, executed, executed_reintroduced = [], [], [], []
                leaf_ids = set()
                for path in chosen:
                    observed = observations[path["observationId"]]["observation"]
                    if observed["opportunityAtThirdPly"]:
                        opportunity.append(path["pathId"])
                    if observed["reintroducedAtThirdPly"]:
                        reintroduced.append(path["pathId"])
                    for leaf in path["leaves"]:
                        require(leaf["leafId"] not in leaf_ids, "Duplicated independent leaf count")
                        leaf_ids.add(leaf["leafId"])
                        leaf_observed = observations[leaf["observationId"]]["observation"]
                        if leaf_observed["executedAtFourthPly"]:
                            require(observed["opportunityAtThirdPly"], "Actual target execution has no opportunity")
                            executed.append(leaf["leafId"])
                            if observed["reintroducedAtThirdPly"]:
                                executed_reintroduced.append(leaf["leafId"])
                arm_rows.append({"arm": arm, "selectedPredecessorPaths": len(chosen), "selectedFourthPlyLeaves": len(leaf_ids),
                                 "opportunityPaths": opportunity, "reintroducedPaths": reintroduced, "executedLeaves": executed,
                                 "executedReintroducedLeaves": executed_reintroduced,
                                 "weightAuthority": "unweighted_selected_paths_not_policy_mass_or_human_frequency",
                                 "negativeVerdict": "abstain_from_partial_frontier", "universalVerdict": "not_evaluated",
                                 "proofCeiling": "observed_provider_selected_lines_only",
                                 "paths": [{"predecessorObservation": observation_indices[path["observationId"]],
                                            "leafObservations": [observation_indices[leaf["observationId"]] for leaf in path["leaves"]]} for path in chosen],
                                 "omissions": {"firstReplies": selected["inputSelection"]["unvisitedReplies"],
                                               "learnerEdgesWithinSelectedReplies": selected["inputSelection"]["unvisitedLearnerEdgesWithinSelectedReplies"],
                                               "fourthRepliesWithinSelectedNonterminalPaths": selected["omittedLegalFourthRepliesWithinSelectedNonterminalPaths"]},
                                 "absorbingThirdPlyPaths": selected["absorbingThirdPlyPaths"]})
            rows.append({**pair, "family": target["family"], "phase": candidate["phase"], "immediate": exact["immediate"],
                         "exactBaseline": {"reintroducedWithin3Ply": exact["reintroducedWithin3Ply"], "preparationSurvivesEveryDefence": exact["preparationSurvivesEveryDefence"]}, "arms": arm_rows})
        profiles.append({"kind": source["kind"], "traversalRule": source["traversalRule"], "arms": source["arms"], "rows": rows,
                         "candidateCoverage": source["candidateCoverage"], "controls": source["controls"]})
    require(consumed == set(observations), "Orphan/missing independently consumed target observations")
    expected = {"version": 1, "profile": "d3262-coherent-engine-target-outcome-v1", "manifest": frontier["manifest"],
                "authority": "observed_named_target_opportunities_and_executions_under_partial_engine_paths_not_universal_proof_or_engine_cause",
                "referenceEncoding": "zero_based_global_observation_indices_with_literal_named_path_identity",
                "inputDigests": dict(output["inputDigests"]), "source": frontier["source"], "controls": comparison["controls"],
                "profiles": profiles,
                # All boards/identities/selections above are independently
                # replayed before this digest. Do not double the large nested
                # observation population just to retain its negative controls.
                "observations": digest(json.dumps(output["observations"], separators=(",", ":")).encode())}
    return expected, {"predecessorObservations": predecessor_count, "leafObservations": leaf_count}


def check_reference_indices(output):
    size = len(output["observations"])
    for profile in output["profiles"]:
        for row in profile["rows"]:
            for arm in row["arms"]:
                for path in arm["paths"]:
                    require(set(path) == {"predecessorObservation", "leafObservations"}
                            and type(path["predecessorObservation"]) is int and 0 <= path["predecessorObservation"] < size
                            and all(type(index) is int and 0 <= index < size for index in path["leafObservations"]),
                            "Invalid independent compact observation reference")


def verify(output, expected):
    require(type(output.get("version")) is int, "Invalid independent target version")
    check_reference_indices(output)
    require(output.keys() == expected.keys(), "Changed independently declared target fields")
    for key, value in expected.items():
        actual = digest(json.dumps(output[key], separators=(",", ":")).encode()) if key == "observations" else output[key]
        require(actual == value, "Independent target mismatch: " + key)


def negatives(output, expected):
    # Mutate one owned field at a time, restoring it after the named refusal;
    # no deep clone of the large whole-population fixture per negative control.
    selected = next(arm for row in output["profiles"][0]["rows"] for arm in row["arms"] if arm["paths"])
    edits = [(output["profiles"][0], "rows", output["profiles"][0]["rows"][:-1]),
             (output["profiles"][1], "candidateCoverage", output["profiles"][1]["candidateCoverage"][:-1]),
             (output["profiles"][0]["rows"][0]["arms"][0], "universalVerdict", "proven"),
             (selected, "paths", []),
             (output["observations"][0], "pathId", "crossed"),
             (output["observations"][0]["observation"], "opportunityAtThirdPly", not output["observations"][0]["observation"]["opportunityAtThirdPly"]),
             (output["observations"][0]["observation"]["snapshots"][0], "fen", "crossed"),
             (output["observations"][0]["observation"], "executedAtFourthPly", not output["observations"][0]["observation"]["executedAtFourthPly"]),
             (selected["paths"][0], "predecessorObservation", True)]
    for target, key, changed in edits:
        original = target[key]
        target[key] = changed
        try:
            try:
                verify(output, expected)
            except AssertionError:
                continue
            raise RuntimeError("Independent actual target corruption admitted")
        finally:
            target[key] = original
    return len(edits)


if __name__ == "__main__":
    raw = (DIRECTORY / OUTPUT).read_bytes()
    output = json.loads(gzip.decompress(raw))
    require(set(output["inputDigests"]) == set(NAMES), "Crossed independently declared target input set")
    raw_inputs = {name: (DIRECTORY / name).read_bytes() for name in NAMES}
    require(all(digest(value) == output["inputDigests"][name] for name, value in raw_inputs.items()), "Changed actual target input bytes")
    inputs = {name: json.loads(gzip.decompress(value) if name.endswith(".gz") else value) for name, value in raw_inputs.items()}
    expected, counts = expected_outcome(output, inputs)
    verify(output, expected)
    result = {"digest": digest(raw), "cellsPerProfile": [len(profile["rows"]) for profile in output["profiles"]], **counts,
              "sourceAuthority": "independent_board_identity_selection_not_independent_local_SEE_or_strategic_truth"}
    if "--negative-controls" in sys.argv:
        result["negativeControls"] = negatives(output, expected)
    print(json.dumps(result, indent=2))
