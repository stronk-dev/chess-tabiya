"""Independent D3262 event weighting/custody; not a new chess or timing oracle.

Reads immutable original captures and the already verified full model comparison.
No JS execution, provider query, model load, source rewrite or move judgement.
"""
import base64
import copy
import gzip
import hashlib
import json
import math
import runpy
import sys
from pathlib import Path

HERE = Path(__file__).parent
DIRECTORY = Path("planning/semantic-consequence-search")
PRIOR = "d3262-cost-live-maia-sensitivity-2026-10-07.json.gz"
PRIOR_DIGEST = "sha256:d59a30fa053308cd701f122b12385a64239a34eb52ed690af1850e56bf70761f"
TARGET = "d3262-coherent-maia-target-outcome.json"
read_archive = runpy.run_path(str(HERE / "cost-archive-parts-check.py"))["read_archive_bytes"]


def require(value, message):
    if not value:
        raise AssertionError("D3262_WEIGHTED_TARGET_INDEPENDENT: " + message)


def equal(a, b):
    """JSON value equality without Python's False == 0 / True == 1 alias."""
    if type(a) is bool or type(b) is bool:
        return type(a) is bool and type(b) is bool and a == b
    if type(a) in (int, float) or type(b) in (int, float):
        return type(a) in (int, float) and type(b) in (int, float) and math.isfinite(a) and math.isfinite(b) and a == b
    if type(a) is not type(b):
        return False
    if type(a) is dict:
        return set(a) == set(b) and all(equal(a[k], b[k]) for k in a)
    if type(a) is list:
        return len(a) == len(b) and all(equal(x, y) for x, y in zip(a, b))
    return a == b


def digest(raw):
    return "sha256:" + hashlib.sha256(raw).hexdigest()


def identity(row, fields):
    return tuple(row[field] for field in fields)


CASE = ("rootId", "candidateUci", "setting", "horizon", "regime")
CELL = ("rootId", "candidateUci", "targetId", "setting")
ARM = ("rootId", "candidateUci", "setting")
OLD = ("rootId", "candidateUci", "targetId")
EVENTS = ("opportunityPaths", "reintroducedPaths", "executedLeaves", "executedReintroducedLeaves")
MASSES = ("opportunityMass", "reintroducedOpportunityMass", "executionMass", "reintroducedExecutionMass")


def unique(rows, fields):
    result = {identity(row, fields): row for row in rows}
    require(len(result) == len(rows), "duplicate source identity")
    return result


def history_id(root, history):
    return digest(json.dumps([root, *history], ensure_ascii=False, separators=(",", ":")).encode())


def mass(value):
    return type(value) in (int, float) and math.isfinite(value) and 0 < value <= 1 + 1e-5


def literal_sum(values):
    # Python 3.12+ sum(float) may compensate/reassociate. The archive declares
    # ordered binary64 accumulation; changing that is not a changed source mass.
    total = 0.0
    for value in values:
        total = total + value
    return total


def contributions(immediate, predecessors, leaves):
    require(immediate in ("removed", "preserved", "identity_lost"), "foreign immediate")
    parents = {p["id"]: p for p in predecessors}
    require(len(parents) == len(predecessors) and len({l["id"] for l in leaves}) == len(leaves), "duplicate event")
    for p in predecessors:
        require(type(p["id"]) is str and mass(p["mass"]) and type(p["opportunity"]) is bool
                and type(p["reintroduced"]) is bool
                and p["reintroduced"] == (immediate == "removed" and p["opportunity"]), "invalid predecessor")
    for l in leaves:
        p = parents.get(l["predecessorId"])
        require(p is not None and type(l["executed"]) is bool and mass(l["mass"])
                and l["mass"] <= p["mass"] + 1e-5 and (not l["executed"] or p["opportunity"]), "invalid execution")
    total = lambda rows: literal_sum(r["mass"] for r in sorted(rows, key=lambda r: r["id"]))
    for p in predecessors:
        require(total([l for l in leaves if l["predecessorId"] == p["id"]]) <= p["mass"] + 1e-5, "siblings exceed parent")
    require(total(predecessors) <= 1 + 1e-5, "predecessors exceed policy mass")
    opportunity = [p for p in predecessors if p["opportunity"]]
    again = [p for p in predecessors if p["reintroduced"]]
    executed = [l for l in leaves if l["executed"]]
    executed_again = [l for l in executed if parents[l["predecessorId"]]["reintroduced"]]
    require(total(executed) <= total(opportunity) + 1e-5, "execution exceeds opportunity")
    rows = (opportunity, again, executed, executed_again)
    return {**{name: sorted(r["id"] for r in values) for name, values in zip(EVENTS, rows)},
            **{name: total(values) for name, values in zip(MASSES, rows)}}


def bind(weights, predecessors, leaves):
    by_id = {w["pathId"]: w for w in weights}
    require(len(by_id) == len(weights), "duplicate policy weight")
    for events, ply in ((predecessors, 3), (leaves, 4)):
        require(sorted(e["id"] for e in events) == sorted(w["pathId"] for w in weights if w["plies"] == ply), "crossed event history")
        require(all(e["mass"] == by_id[e["id"]]["jointMass"] for e in events), "crossed event weight")


def frozen_mass(cell, setting, weights):
    predecessors, leaves = [], []
    for path in cell["paths"]:
        arms = [a for a in path["arms"] if a["arm"] == setting]
        require(len(arms) <= 1, "duplicate frozen arm")
        if not arms:
            continue
        arm, o = arms[0], path["observation"]
        require(o["immediate"] == cell["immediate"] and type(o["opportunityAtThirdPly"]) is bool
                and o["opportunityAtThirdPly"] == (o["snapshots"][2]["availableMoveUci"] is not None), "frozen opportunity")
        predecessors.append(dict(id=path["id"], mass=arm["pathMass"], opportunity=o["opportunityAtThirdPly"], reintroduced=o["reintroducedAtThirdPly"]))
        for leaf in arm["leaves"]:
            observation = leaf["observation"]
            require(observation["immediate"] == cell["immediate"]
                    and observation["opportunityAtThirdPly"] == o["opportunityAtThirdPly"]
                    and observation["reintroducedAtThirdPly"] == o["reintroducedAtThirdPly"], "frozen execution parent")
            leaves.append(dict(id=leaf["leafId"], predecessorId=path["id"], mass=leaf["jointMass"], executed=observation["executedAtFourthPly"]))
    bind(weights, predecessors, leaves)
    value = contributions(cell["immediate"], predecessors, leaves)
    reports = [a for a in cell["arms"] if a["arm"] == setting]
    require(len(reports) == 1, "missing frozen report")
    for field in EVENTS:
        require(sorted(reports[0][field]) == value[field], "changed frozen event mask")
    parents = {p["id"]: p for p in predecessors}
    sums = [literal_sum(p["mass"] for p in predecessors if p["opportunity"]),
            literal_sum(p["mass"] for p in predecessors if p["reintroduced"]),
            literal_sum(l["mass"] for l in leaves if l["executed"]),
            literal_sum(l["mass"] for l in leaves if l["executed"] and parents[l["predecessorId"]]["reintroduced"])]
    reported = dict(zip(MASSES, sums))
    require(all(reports[0][k] == reported[k] for k in MASSES), "changed frozen reported mass")
    return {**value, "reportedFrozenMasses": reported}


def live_mass(record, target, weights):
    row, result = record["row"], record["raw"]["result"]
    projections = [p for p in result["projections"] if p["targetId"] == target]
    require(len(projections) == 1 and projections[0]["convention"] == "d3262-target-opportunity@2", "live convention")
    projection = projections[0]
    observations = [o for o in result["observations"] if o["targetId"] == target]
    seen = {history_id(row["rootId"], o["history"]): o for o in observations}
    require(len(seen) == len(observations) and sorted(seen) == sorted(w["pathId"] for w in weights), "lost/crossed observations")
    by_id = {w["pathId"]: w for w in weights}
    predecessors, leaves = [], []
    for entry in observations:
        h, o = entry["history"], entry["observation"]
        require(h[0] == row["candidateUci"] and len(h) in (2, 3, 4)
                and o["convention"] == "d3262-target-opportunity@2" and o["immediate"] == projection["immediate"]
                and len(o["snapshots"]) == len(h), "crossed live target history")
        actions = o["snapshots"][2]["availableActions"] if len(h) >= 3 else []
        opportunity = bool(actions)
        executed = len(h) == 4 and any(a["uci"] == h[3] for a in actions)
        require(type(actions) is list and all(type(o[k]) is bool for k in
                ("opportunityAtThirdPly", "reintroducedAtThirdPly", "executedAtFourthPly")), "foreign Boolean event")
        require(o["opportunityAtThirdPly"] == opportunity
                and o["reintroducedAtThirdPly"] == (projection["immediate"] == "removed" and opportunity)
                and o["executedAtFourthPly"] == executed and o["executionWitness"] == (h if executed else None), "crossed action flag/witness")
        event_id = history_id(row["rootId"], h)
        require(by_id[event_id]["plies"] == len(h), "crossed weighted ply")
        joint = by_id[event_id]["jointMass"]
        if len(h) == 3:
            predecessors.append(dict(id=event_id, mass=joint, opportunity=opportunity, reintroduced=o["reintroducedAtThirdPly"]))
        elif len(h) == 4:
            parent_id = history_id(row["rootId"], h[:3])
            require(parent_id in seen and seen[parent_id]["observation"]["snapshots"][2]["availableActions"] == actions
                    and seen[parent_id]["observation"]["opportunityAtThirdPly"] == opportunity, "crossed actual parent")
            leaves.append(dict(id=event_id, predecessorId=parent_id, mass=joint, executed=executed))
    bind(weights, predecessors, leaves)
    return contributions(projection["immediate"], predecessors, leaves)


def actual_policy_weights(record, expected):
    row, frontier = record["row"], record["raw"]["result"]["modelFrontier"]
    require(frontier["coverage"]["complete"] is True, "partial policy called complete")
    nodes = {tuple(n["history"]): n for n in frontier["nodes"]}
    edges = {tuple(e["history"]): e for e in frontier["edges"]}
    require(len(nodes) == len(frontier["nodes"]) and len(edges) == len(frontier["edges"]), "duplicate actual policy history")
    for h, node in nodes.items():
        require(h[0] == row["candidateUci"] and len(h) in (1, 2, 3)
                and node["state"] in ("executed", "cached") and mass(node["parentJointMass"]), "foreign actual policy node")
        parent = 1 if len(h) == 1 else edges[h]["jointMass"]
        require(node["parentJointMass"] == parent, "crossed actual parent weight")
        selected = {e["legalUci"]: e["mass"] for e in node["selected"]}
        require(len(selected) == len(node["selected"]), "duplicate conditional choice")
        for move, conditional in selected.items():
            edge = edges.get((*h, move))
            require(mass(conditional) and edge is not None and edge["conditionalMass"] == conditional
                    and edge["jointMass"] == parent * conditional, "crossed actual conditional product")
    values = []
    for h, edge in edges.items():
        parent = nodes.get(h[:-1])
        require(h[0] == row["candidateUci"] and len(h) in (2, 3, 4) and parent is not None
                and any(e["legalUci"] == h[-1] for e in parent["selected"]), "orphan actual policy edge")
        values.append(dict(pathId=history_id(row["rootId"], h), plies=len(h),
                           conditionalMass=edge["conditionalMass"], jointMass=edge["jointMass"]))
    require(equal(sorted(values, key=lambda e: e["pathId"]), expected), "actual weights differ from preceding model comparison")


def verify(report, prior, frozen, records):
    require(set(report) == {"inputs", "frozenInputs", "question", "authority", "frozenTargetConvention",
            "liveTargetConvention", "rows", "retainedCandidates", "retainedCases", "cachePairs",
            "cacheNodeTransitions", "comparedHorizon", "shorterHorizon", "noTargetPolicies", "groups", "cells",
            "aggregationOrder", "newInference", "newCapturedSettings", "productionProfileSelected"}, "foreign report fields")
    require(report["question"] == "D3262" and report["authority"] == "observed_configured_model_target_mass_not_human_frequency_or_proof"
            and report["newInference"] is False and type(report["newCapturedSettings"]) is int and report["newCapturedSettings"] == 0
            and report["productionProfileSelected"] is False and report["comparedHorizon"] == 4
            and report["liveTargetConvention"] == "d3262-target-opportunity@2"
            and report["frozenTargetConvention"] == "d3262-coherent-maia-target-outcome-v1_legacy_observer_not_rewritten"
            and report["aggregationOrder"] == "ascending_literal_path_id_original_reported_mass_also_retained_no_normalization",
            "foreign report authority")
    require(report["rows"] == len(records) == prior["rows"] == 2316 and report["retainedCandidates"] == prior["retainedCandidates"] == 193
            and equal(report["retainedCases"], prior["retainedCases"]) and equal(report["cachePairs"], prior["cachePairs"])
            and equal(report["cacheNodeTransitions"], prior["cacheNodeTransitions"])
            and report["shorterHorizon"] == "retained_not_assigned_four_ply_target_mass", "changed complete case/cache scope")
    cases = {identity(r["row"], CASE): r for r in records}
    require(len(cases) == len(records) and all(cases[identity(r, CASE)]["row"]["kind"] == r["kind"] for r in prior["retainedCases"]), "lost/crossed source cases")
    old = unique(frozen["rows"], OLD)
    policies = unique(prior["policies"], ARM)
    cells = unique(report["cells"], CELL)
    require(len(cells) == len(prior["cells"]) == 364 and all(identity(c, CELL) in cells for c in prior["cells"]), "lost/crossed target cells")
    no_target = [{**{k: p[k] for k in ("rootId", "candidateUci", "setting", "phase", "focus")},
                  "targetMasses": None, "meaning": "policy_not_requested_not_known_zero"}
                 for p in prior["policies"] if p["status"] == "no_target"]
    require(equal(report["noTargetPolicies"], no_target) and len(no_target) == 28, "no-target coerced to zero")
    groups = {}
    for previous in prior["cells"]:
        cell = cells[identity(previous, CELL)]
        metadata = {k: previous[k] for k in (*CELL, "phase", "focus")}
        require(all(cell[k] == value for k, value in metadata.items()) and cell["status"] == previous["status"], "crossed cell identity/status")
        group_id = identity(previous, ("setting", "phase", "focus"))
        group = groups.setdefault(group_id, {**{k: previous[k] for k in ("setting", "phase", "focus")},
                                           "cells": 0, "compared": 0, "unpaired": 0, "changedEventMasks": 0,
                                           "changedWeightedMasses": 0, "frozenAggregateOrderingDifferences": 0})
        group["cells"] += 1
        if previous["status"] != "compared":
            group["unpaired"] += 1
            expected = {**metadata, "status": previous["status"],
                        "comparison": "unpaired_unknown_complete_mass_not_target_absence", "completeTargetMasses": None,
                        "retainedObservations": previous["retainedObservations"], "retainedPartialOutcome": previous["retainedPartialOutcome"]}
            require(equal(cell, expected) and cell["completeTargetMasses"] is None, "partial source coerced to known complete mass")
            continue
        policy = policies[identity(previous, ARM)]
        record = cases[(*identity(previous, ARM), 4, "cold")]
        require(policy["status"] == "compared" and record["row"]["kind"] == "available", "unpaired source compared")
        actual_policy_weights(record, policy["after"]["weights"])
        before = frozen_mass(old[identity(previous, OLD)], previous["setting"], policy["before"]["weights"])
        after = live_mass(record, previous["targetId"], policy["after"]["weights"])
        changed = dict(eventMasks=any(before[k] != after[k] for k in EVENTS),
                       weightedMasses=any(before[k] != after[k] for k in MASSES),
                       frozenAggregateOrdering=any(before[k] != before["reportedFrozenMasses"][k] for k in MASSES))
        require(equal(cell["before"], before) and equal(cell["after"], after) and equal(cell["changed"], changed)
                and all(type(v) is bool for v in cell["changed"].values()), "changed target event weighting")
        require(set(cell) == {*metadata, "status", "before", "after", "changed", "policyLayerMasses", "retainedOmissions", "proofCeiling"}
                and equal(cell["policyLayerMasses"], {"before": policy["before"]["layerMasses"], "after": policy["after"]["layerMasses"]})
                and equal(cell["retainedOmissions"], {"before": previous["before"]["coverage"], "after": previous["after"]["coverage"]})
                and cell["proofCeiling"] == "observed_configured_model_target_paths_not_all_defences_or_engine_cause", "changed omissions/coverage/authority")
        group["compared"] += 1
        group["changedEventMasks"] += changed["eventMasks"]
        group["changedWeightedMasses"] += changed["weightedMasses"]
        group["frozenAggregateOrderingDifferences"] += changed["frozenAggregateOrdering"]
    require(equal(report["groups"], list(groups.values())), "changed full group counts")
    return {"cases": len(records), "targetCells": len(cells), "noTargetPolicies": len(no_target),
            "authority": "independent_event_mass_and_original_source_custody_not_new_chess_or_clock_oracle"}


def load(path):
    raw = Path(path).read_bytes()
    return json.loads(gzip.decompress(raw) if str(path).endswith(".gz") else raw)


def main():
    require(len(sys.argv) in (2, 3) and (len(sys.argv) == 2 or sys.argv[2] == "--negative-controls"), "explicit artifact required")
    report = load(sys.argv[1])
    raw_prior = (DIRECTORY / PRIOR).read_bytes()
    require(digest(raw_prior) == PRIOR_DIGEST, "changed prior model comparison")
    prior = json.loads(gzip.decompress(raw_prior))
    require(report["inputs"] == prior["inputs"]
            and report["frozenInputs"] == {**prior["frozenContinuationInputs"], PRIOR: PRIOR_DIGEST}, "changed input lineage")
    raw_target = (DIRECTORY / TARGET).read_bytes()
    require(digest(raw_target) == prior["frozenContinuationInputs"][TARGET], "changed frozen target source")
    frozen, records = json.loads(raw_target), []
    for name, expected in report["inputs"].items():
        raw = read_archive(DIRECTORY / name)
        require(digest(raw) == expected, "changed original capture")
        pack = json.loads(gzip.decompress(raw))
        for group in pack["groups"]:
            entries = json.loads(gzip.decompress(base64.b64decode(group["base64"])))
            for r in entries:
                require(json.loads(r["rawLiteral"]) == r["raw"] and digest(r["rawLiteral"].encode()) == r["row"]["rawCaptureDigest"], "changed literal receipt")
            records.extend(entries)
    result = verify(report, prior, frozen, records)
    if len(sys.argv) == 3:
        mutations = [
            lambda r: r["cells"].pop(),
            lambda r: r["cells"].append(r["cells"][0]),
            lambda r: r["retainedCases"].pop(),
            lambda r: r["noTargetPolicies"][0].update(targetMasses=0),
            lambda r: r["cells"][0]["after"].update(opportunityMass=r["cells"][0]["after"]["opportunityMass"] + .01),
            lambda r: r["cells"][0]["after"].update(executionMass=r["cells"][0]["after"]["executionMass"] + .01),
            lambda r: r["cells"][0]["after"]["executedLeaves"].append("foreign_history"),
            lambda r: r["cells"][0]["before"]["reportedFrozenMasses"].update(opportunityMass=-1),
            lambda r: r["cells"][0]["changed"].update(eventMasks=0),
            lambda r: r["cells"][0].update(proofCeiling="all_defences_proved"),
            lambda r: r["cells"][0]["retainedOmissions"]["after"]["omittedPreparations"].append("foreign_preparation"),
            lambda r: r["groups"][0].update(compared=r["groups"][0]["compared"] + 1),
            lambda r: r.update(productionProfileSelected=0),
            lambda r: r.update(unverifiedGrade="good"),
            lambda r: r["noTargetPolicies"][0].update(targetMasses=False),
        ]
        rejected = 0
        for mutate in mutations:
            bad = copy.deepcopy(report)
            mutate(bad)
            try:
                verify(bad, prior, frozen, records)
            except (AssertionError, KeyError, TypeError, IndexError):
                rejected += 1
            else:
                raise AssertionError("Output corruption was admitted")
        result["rejectedOutputCorruptions"] = rejected
        chosen = next(i for i, r in enumerate(records) if r["row"]["horizon"] == 4
                      and r["row"]["regime"] == "cold" and r["row"]["kind"] == "available")
        source_mutations = [
            lambda rs: rs[chosen]["raw"]["result"]["observations"].pop(),
            lambda rs: rs[chosen]["raw"]["result"]["observations"][0]["observation"].update(opportunityAtThirdPly=0),
            lambda rs: rs[chosen]["raw"]["result"]["modelFrontier"]["edges"][0].update(jointMass=.001),
            lambda rs: rs[chosen]["raw"]["result"]["modelFrontier"]["edges"][0].update(conditionalMass=.001),
            lambda rs: rs[chosen]["raw"]["result"]["modelFrontier"]["edges"][0]["history"].__setitem__(0, "foreign"),
            lambda rs: rs[chosen]["row"].update(kind="source_unavailable"),
            lambda rs: rs.append(rs[0]),
        ]
        rejected_source = 0
        for mutate in source_mutations:
            bad = copy.deepcopy(records)
            mutate(bad)
            try:
                verify(report, prior, frozen, bad)
            except (AssertionError, KeyError, TypeError, IndexError):
                rejected_source += 1
            else:
                raise AssertionError("Source corruption was admitted")
        result["rejectedSourceCorruptions"] = rejected_source
    print(json.dumps(result))


if __name__ == "__main__":
    main()
