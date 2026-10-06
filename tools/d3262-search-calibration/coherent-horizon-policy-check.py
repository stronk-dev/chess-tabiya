"""D3494 independent two-ply execution and joint-policy stop reconstruction.

python-chess independently replays every selected prefix/identity/local action;
literal history-conditioned policy sources determine mass, never human frequency.
"""
import copy
import gzip
import hashlib
import json
import runpy
import sys
from pathlib import Path

HERE = Path(__file__).parent
DIRECTORY = Path("planning/semantic-consequence-search")
OUTPUT = "d3262-coherent-horizon-policy.json.gz"
SOURCES = {
    "d3262-coherent-five-approach-comparison.json.gz": "c6660605e24c13b631f39f2003f1219406baadb02b03614eac9260c6a81c15bf",
    "d3262-coherent-root-frame.json": "dcf339d6042392e3a5d0cc355c3d6779ed751d5540a8a8094d50ce3d7e43df2b",
    "d3262-coherent-target-comparison-frame.json": "229335224b1c175478537554ec52ee7341b983e7358222fe1c7d67c2af16cc6b",
    "d3262-coherent-actual-proof.json.gz": "103f77ec585cc76fe27990567de2d334a3b98ccd42584087e370d1f317c4fdde",
    "d3262-coherent-first-reply-frontier.json": "1cb357c145d5b8c8ba15cd8b6bd752afb0e70d7b7e3758a0da4ebee022ff7438",
    "d3262-coherent-third-ply-frame.json": "3059fb3a45eb10bdcd56b7a4190bbbcf7370b4bf58750934befabde62712dc07",
    "d3262-coherent-maia-fourth-ply.json": "ddeb2262fcfd98020b84eec65b4e5d8bb915a81ce5b50c6fbe250406a1ec9bfa",
    "d3262-maia-history-replay.json": "81b3d761395be080585af93127245e2116b12b175fac915c9892e1fce361adf4",
    "d3262-maia-coherent-new-child.json": "630bc61693da881024991475b64701e822c8b99a6e76122267b8f34cf30c86bd",
}
previous = runpy.run_path(str(HERE / "coherent-five-approach-check.py"))
pv_observation, same_json, direction = [previous[n] for n in ["pv_observation", "same_json", "direction"]]
model_helpers = runpy.run_path(str(HERE / "coherent-maia-fourth-ply-check.py"))


def require(value, message):
    if not value:
        raise AssertionError(message)


def digest(raw):
    return "sha256:" + hashlib.sha256(raw).hexdigest()


def close(a, b, message):
    require(type(a) in [float, int] and type(b) in [float, int] and abs(a-b) < 1e-10, message)


def key(row):
    return row["rootId"], row["candidateUci"]


def cell_key(row, candidate=None):
    return row["rootId"], row["targetId"], row["candidateUci"] if candidate is None else candidate


TOLERANCE = 1e-5


def stop(required, covered, off=False, layers=1):
    require(required in [0.8, 0.9] and type(off) is bool and layers in [1, 2, 3], "undeclared joint rule")
    tolerance = (1 + TOLERANCE) ** layers - 1
    if off:
        require(covered is None, "missing source cannot give known coverage")
        return dict(status="source_off_abstain", requiredJointMass=required, coveredJointMass=None,
                    residualMass=None, shortfall=None, coveredMassInterval=None, numericalTolerance=tolerance, authority="unavailable_not_exact_or_human_frequency")
    require(type(covered) in [float, int] and 0 <= covered <= 1 + tolerance, "invalid mass")
    lower, upper = max(0, covered-tolerance), min(1, covered+tolerance)
    return dict(status="joint_rule_satisfied" if lower >= required else "frozen_frontier_exhausted_below_joint_threshold" if upper < required else "numerical_boundary_abstain",
                requiredJointMass=required, coveredJointMass=covered, residualMass=max(0, 1-covered), shortfall=max(0, required-covered),
                coveredMassInterval=[lower, upper], numericalTolerance=tolerance,
                authority="both_sides_configured_model_not_exact_or_human_learner")


def compose(first, paths, absorbed=0, terminal=False):
    require(0 <= first <= 1+TOLERANCE and 0 <= absorbed <= first+TOLERANCE and type(terminal) is bool, "invalid absorption")
    if terminal:
        require(not paths, "terminal continuation")
        return [1, 1, 1]
    three, four = absorbed, absorbed
    for path in paths:
        require(path["terminalReason"] is None or path["coveredConditionalMass"] == 1, "lost absorbing mass")
        require(0 < path["pathMass"] <= 1+2*TOLERANCE and 0 <= path["coveredConditionalMass"] <= 1+TOLERANCE, "invalid conditional mass")
        three += path["pathMass"]
        four += path["pathMass"] * path["coveredConditionalMass"]
    require(four <= three + 3*TOLERANCE and three <= first + 2*TOLERANCE, "overlapping coverage")
    return [first, three, four]


def load():
    values, digests = [], {}
    for name, pinned in SOURCES.items():
        raw = (DIRECTORY / name).read_bytes()
        require(digest(raw) == "sha256:"+pinned, "changed independent horizon input")
        values.append(json.loads(gzip.decompress(raw) if name.endswith(".gz") else raw))
        digests[name] = digest(raw)
    return values, digests


def reconstruct(values, digests):
    common, root_frame, target_frame, proof, first, third, fourth, old_model, new_model = values
    require(len(common["rows"]) == 182 and len(common["settings"]) == 53 and len(common["contrasts"]) == 116
            and len(common["candidateCoverage"]) == 193 and len(root_frame["roots"]) == 66 and len(target_frame["definitions"]) == 64,
            "independent horizon population")
    # Complete prerequisite: reconstruct all 1,401 policies / 4,127 selected
    # leaves and products from retained actual model sources, not just summaries.
    model_helpers["verify"](fourth, DIRECTORY)
    roots, definitions = {r["rootId"]: r for r in root_frame["roots"]}, {d["id"]: d for d in target_frame["definitions"]}
    graphs = {key(r): r for r in proof["candidateGraph"]}
    first_index, fourth_index = [{key(r): r for r in value["rows"]} for value in [first, fourth]]
    policies = {key(r): (name, r) for name, value in [(list(SOURCES)[7], old_model), (list(SOURCES)[8], new_model)] for r in value["rows"]}
    nodes, node_map = [], {}

    def observe(root, history, definition):
        identity = digest(json.dumps([root["rootId"], definition["id"], *history], separators=(",", ":")).encode())
        if identity not in node_map:
            _, observation = pv_observation(root["fen"], history[0], history, definition)
            node_map[identity] = len(nodes)
            nodes.append(dict(id=identity, rootId=root["rootId"], targetId=definition["id"], history=history, observation=observation))
        return node_map[identity]

    rows = []
    for cell in common["rows"]:
        root, definition, graph = roots[cell["rootId"]], definitions[cell["targetId"]], graphs[key(cell)]
        require(root["fen"] == graph["rootFen"] and definition["rootId"] == cell["rootId"], "crossed horizon identity")
        initial = observe(root, [cell["candidateUci"]], definition)
        require(nodes[initial]["observation"]["immediate"] == cell["immediate"], "crossed direct opportunity")
        available = [a["uci"] for a in nodes[initial]["observation"]["snapshots"][0]["availableActions"]]
        arms = []
        for setting, prior in zip(common["settings"], cell["arms"]):
            require(setting["id"] == prior["setting"], "crossed horizon settings")
            chosen = [p["preparationUci"] for p in prior["preparations"]]
            require(len(chosen) == len(set(chosen)) and all(u in [p["preparationUci"] for p in graph["preparations"]] for u in chosen), "illegal first reply")
            if setting["family"] in ["engine_beam", "configured_model"]:
                frozen = [r["uci"] for r in first_index[key(cell)]["replies"] if setting["id"] in r["selectedBy"]]
                require(sorted(chosen) == sorted(frozen), "changed first reply selector")
            replies = [dict(replyUci=u, node=observe(root, [cell["candidateUci"], u], definition), executesNamedAction=u in available) for u in chosen]
            omitted = [p["preparationUci"] for p in graph["preparations"] if p["preparationUci"] not in chosen] if graph["terminalReason"] is None else []
            arm = dict(setting=setting["id"], family=setting["family"], directOpportunity=bool(available), observedExecution=any(r["executesNamedAction"] for r in replies),
                       replies=replies, omittedReplies=omitted, unexpandedTerminalLegalMoves=len(graph["preparations"]) if graph["terminalReason"] else 0,
                       futureReintroduction="not_observed_beyond_two_ply_horizon", universalPreparation="not_evaluated_beyond_two_ply_horizon", moveReason="not_an_engine_reason")
            if setting["family"] == "configured_model":
                name, policy = policies[key(cell)]
                prefix, covered = model_helpers["selected"](policy["configuredSupport"], float(setting["id"].split("prefix")[1]))
                require(sorted(p["legalUci"] for p in prefix) == sorted(chosen), "crossed two-ply policy prefix")
                executed = sum(p["mass"] for p in prefix if p["legalUci"] in available)
                rule = stop(float(setting["id"].split("prefix")[1]), covered)
                arm["policy"] = dict(firstSource=name, historyUci=policy["historyUci"], **rule, literalExecutedMass=executed,
                                     executedMassLower=max(0, executed-rule["numericalTolerance"]) if available else 0,
                                     executedMassUpper=min(1, executed+rule["residualMass"]+rule["numericalTolerance"]) if available else 0,
                                     massPopulation="literal_configured_policy_conditioned_on_candidate_not_human_frequency")
            arms.append(arm)
        rows.append(dict(**{f: cell[f] for f in ["rootId", "targetId", "candidateUci", "sourceObserved", "phase", "focus", "targetActor", "rootMover", "immediate"]},
                         initial=initial, availableActionUcis=available, arms=arms))
    cells, contrasts = {cell_key(r): r for r in rows}, []
    for pair in common["contrasts"]:
        source, alternative = cells[cell_key(pair, pair["sourceCandidateUci"])], cells[cell_key(pair, pair["alternativeCandidateUci"])]
        require(source["sourceObserved"] and not alternative["sourceObserved"], "crossed horizon pair polarity")
        contrasts.append(dict(**{f: pair[f] for f in ["rootId", "targetId", "sourceCandidateUci", "alternativeCandidateUci", "phase", "focus"]},
                              directOpponentOptionDifference=direction(bool(source["availableActionUcis"]), bool(alternative["availableActionUcis"])),
                              authority="exact_current_named_action_only_not_later_prevention_or_engine_reason",
                              arms=[dict(setting=s["id"], observedExecutionDifference=direction(a["observedExecution"], b["observedExecution"]),
                                         certifiedExecutionDifference=None, futureDifference="outside_two_ply_horizon")
                                    for s, a, b in zip(common["settings"], source["arms"], alternative["arms"])]))
    policy_stops = []
    for candidate in third["rows"]:
        root, (name, policy), captured = roots[candidate["rootId"]], policies[key(candidate)], fourth_index[key(candidate)]
        paths = [p for p in fourth["paths"] if p["rootId"] == candidate["rootId"] and p["historyUci"][0] == candidate["candidateUci"]]
        arms = []
        for arm in fourth["modelArms"]:
            required = float(arm.split("prefix")[1])
            prefix, mass = model_helpers["selected"](policy["configuredSupport"], required)
            first_mass = 1 if candidate["terminalAfterCandidate"] else mass
            full = next(a for a in captured["arms"] if a["arm"] == arm)
            selected_paths = []
            for path in paths:
                chosen = next((a for a in path["arms"] if a["arm"] == arm), None)
                if chosen:
                    literal = path["conditionalReplyMass"] * path["conditionalLearnerMass"]
                    conditional = 1 if path["terminalReason"] else sum(e["conditionalMass"] for e in chosen["selected"])
                    selected_paths.append(dict(pathId=path["id"], pathMass=literal, coveredConditionalMass=conditional, terminalReason=path["terminalReason"]))
            coverage = compose(first_mass, selected_paths, full["stoppedAtReplyMass"], candidate["terminalAfterCandidate"])
            for actual, expected in zip([full["firstCoveredMass"], full["twoLayerMass"], full["frontierMass"]], coverage):
                close(actual, expected, "crossed independent product")
            residuals = [max(0, 1-coverage[0]), max(0, coverage[0]-coverage[1]), max(0, coverage[1]-coverage[2])]
            balance_error = sum(residuals) + coverage[2] - 1
            require(abs(balance_error) <= 3*TOLERANCE, "lost mass conservation")
            arms.append(dict(arm=arm, prefixCap=8, firstSource=name, historyUci=policy["historyUci"], firstSelectedReplyUcis=[p["legalUci"] for p in prefix],
                             layerResiduals=residuals, massBalanceError=balance_error, absorbingReplyMass=full["stoppedAtReplyMass"],
                             absorbingThirdPlyMass=sum(p["pathMass"] for p in selected_paths if p["terminalReason"]), paths=selected_paths,
                             horizons=[dict(plies=i+2, **stop(required, covered, False, i+1)) for i, covered in enumerate(coverage)],
                             authority="audit_frozen_frontier_no_new_selection_or_production_stopping_profile"))
        policy_stops.append(dict(rootId=candidate["rootId"], candidateUci=candidate["candidateUci"], phase=root["phase"], focus=root["focus"],
                                 absorbingCandidate=candidate["terminalAfterCandidate"], arms=arms))
    return dict(version=1, profile="d3262-coherent-horizon-policy-v1", convention="d3262-target-opportunity@2", manifest=common["manifest"], inputDigests=digests,
                authority="disposable_two_ply_projection_and_joint_policy_stop_audit_not_production_profile",
                bounds=dict(targetPlies=2, policyPlies=[2, 3, 4], fourPlyComparison=list(SOURCES)[0], truncation="common_first_reply_projection_not_new_forcing_or_PV_selector"),
                sourceMassTolerance=TOLERANCE, productionProfileSelected=False, endToEndCost="not_measured_by_this_audit", settings=common["settings"], controls=common["controls"],
                controlEvidence=common["controlEvidence"], candidateCoverage=common["candidateCoverage"], unpairedTargets=common["unpairedTargets"],
                nodes=nodes, rows=rows, contrasts=contrasts, policyStops=policy_stops, modelSource=old_model["source"])


def check(output, expected):
    require(same_json(output, expected), "horizon/policy differs from independent reconstruction")


def negative_controls(output, expected):
    mutations = [
        lambda v: v["rows"].pop(),
        lambda v: v["bounds"].update(targetPlies=4),
        lambda v: v["rows"][0]["arms"][0].update(futureReintroduction="proved_absent"),
        lambda v: v["nodes"][0]["history"].append("a1a1"),
        lambda v: next(a for r in v["rows"] for a in r["arms"] if not a["observedExecution"]).update(observedExecution=True),
        lambda v: next(a for r in v["rows"] for a in r["arms"] if a["omittedReplies"]).update(omittedReplies=[]),
        lambda v: v["contrasts"][0].update(directOpponentOptionDifference="root_benefit"),
        lambda v: next(h for r in v["policyStops"] for a in r["arms"] for h in a["horizons"] if h["status"] != "joint_rule_satisfied").update(status="joint_rule_satisfied"),
        lambda v: v["policyStops"][0]["arms"][0]["horizons"][2].update(coveredJointMass=1, residualMass=0),
        lambda v: v["policyStops"][0]["arms"][0].update(layerResiduals=[0, 0, 0]),
        lambda v: next(a for r in v["policyStops"] for a in r["arms"] if a["absorbingThirdPlyMass"] > 0).update(absorbingThirdPlyMass=0),
        lambda v: next(a for r in v["rows"] for a in r["arms"] if "policy" in a)["policy"].update(executedMassLower=-1),
        lambda v: v["policyStops"][0]["arms"][0]["horizons"][2].update(numericalTolerance=0),
        lambda v: next(a for r in v["policyStops"] for a in r["arms"] if a["massBalanceError"] != 0).update(massBalanceError=0),
        lambda v: v.update(productionProfileSelected=True, endToEndCost="passes_UI_latency"),
    ]
    for mutate in mutations:
        bad = copy.deepcopy(output); mutate(bad)
        try:
            check(bad, expected)
        except AssertionError:
            continue
        raise AssertionError("horizon/policy corruption admitted")
    return len(mutations)


def main():
    values, digests = load()
    expected = reconstruct(values, digests)
    output = json.loads(gzip.decompress((DIRECTORY / OUTPUT).read_bytes()))
    check(output, expected)
    negatives = negative_controls(output, expected) if "--negative-controls" in sys.argv else 0
    print(json.dumps(dict(cells=len(output["rows"]), nodes=len(output["nodes"]), settings=len(output["settings"]),
                          candidates=len(output["policyStops"]), policyHorizonReceipts=len(output["policyStops"])*2*3,
                          negativeControls=negatives, independent="python_chess_prefix_and_history_conditioned_joint_policy")), flush=True)


if __name__ == "__main__":
    main()
