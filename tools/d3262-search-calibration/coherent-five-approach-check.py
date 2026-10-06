"""D3493 independent common join; python-chess replays new PV observations.

Frozen frontier legality, decisions and v2 action audit have separate complete
independent receipts. This checker reconstructs their common quantifier/contrast
join, rather than rerunning Stockfish or relabelling partial misses as absence.
"""
import copy
import gzip
import hashlib
import json
import runpy
import sys
from pathlib import Path
import chess

HERE = Path(__file__).parent
DIRECTORY = Path("planning/semantic-consequence-search")
OUTPUT = "d3262-coherent-five-approach-comparison.json.gz"
SOURCES = {
    "d3262-coherent-root-frame.json": "dcf339d6042392e3a5d0cc355c3d6779ed751d5540a8a8094d50ce3d7e43df2b",
    "d3262-coherent-target-comparison-frame.json": "229335224b1c175478537554ec52ee7341b983e7358222fe1c7d67c2af16cc6b",
    "d3262-target-opportunity-v2-audit.json.gz": "95295ad43ef1e41ade4eb4405aaf9302490bf5533837b74148ecba5e065bd144",
    "d3262-coherent-exact-trigger-outcome.json": "d037609aaa2d9550ef8ff73b515946be1cb4a58e076f66c6c70325ef84d9a31c",
    "d3262-stockfish-root-coherent-all.json": "790049cff06992eae6c48f7057d0b794c4388e503f2d76a59dfe64ce8dbe7c49",
    "d3262-coherent-actual-proof.json.gz": "103f77ec585cc76fe27990567de2d334a3b98ccd42584087e370d1f317c4fdde",
    "d3262-coherent-engine-target-outcome.json.gz": "b156a18f683eb832a6d2a2dfa61751d82dfba1b4235ef1520c0bfd0d4939c8ef",
    "d3262-coherent-maia-target-outcome.json": "0e414803680b73661ecbe5246c35cd858703490d6e4d05d5d73efb6c892e2646",
    "d3262-coherent-recursive-evaluation.json.gz": "c692b1c16efce9491d560f9d6b7453200b925d1bf63810700c3e77d7f5fcd55a",
    "d3262-coherent-bounded-contrast.json": "1bbb39159e50cf203c7bcbea91a667da69cc27465d0c09be9d57d8ed87968e27",
    "d3262-fork-control-identity.json": "687c6fef6b77aebf55dcaf630945e510abb4020244be96ddb6cb2ee6977e44f9",
    "d3262-bishop-pressure-control.json": "09b6e8ea4e225c01b857f5ddef9ac249d65a9203c66f2dd41a07d7a5016a4a64",
}
helpers = runpy.run_path(str(HERE / "coherent-actual-proof-check.py"))
preparation_result, root_result, terminal = [helpers[n] for n in ["preparation_result", "root_result", "terminal"]]
v2 = runpy.run_path(str(HERE / "target-opportunity-audit-check.py"))
tracked, actions = [v2[n] for n in ["tracked", "actions"]]
same_json = helpers["same_json"]


def require(value, message):
    if not value:
        raise AssertionError(message)


def digest(raw):
    return "sha256:" + hashlib.sha256(raw).hexdigest()


def path_id(root, history):
    return digest(json.dumps([root, *history], separators=(",", ":")).encode())


def ck(row, candidate=None):
    return row["rootId"], row["targetId"], candidate if candidate is not None else row["candidateUci"]


def direction(source, alternative):
    require(type(source) is bool and type(alternative) is bool, "untyped direction")
    return "same" if source == alternative else "source_only_opponent_option" if source else "alternative_only_opponent_option"


def licensed(raw, family):
    return "withheld_provider_line_ceiling" if family == "provider_line" and raw in [
        "exists_preparation_surviving_all_defences", "every_preparation_refuted_at_bound"] else raw


def knowledge(immediate, preparations, omitted, family):
    if immediate == "preserved" or any(o["opportunity"] for p in preparations for o in p["observed"]):
        return True
    if family == "provider_line" or omitted or any(p["availability"] != "ineligible_terminal" and p["unvisitedDefences"] for p in preparations):
        return None
    return False


def project(immediate, graph, selected, family, extra):
    # Recalculate every preparation against literal exact legal decisions, not
    # the old receipt's labels. The selected observations remain source-bounded.
    legal_index = {p["preparationUci"]: p for p in graph["preparations"]}
    prepared = []
    for chosen in selected:
        legal = legal_index[chosen["preparationUci"]]
        prepared.append(dict(preparationUci=chosen["preparationUci"], observed=chosen["observed"],
                             **preparation_result(legal["legalDefences"], legal["terminalReason"], chosen["observed"])))
    raw = root_result(immediate, [p["preparationUci"] for p in graph["preparations"]] if graph["terminalReason"] is None else [], prepared)
    observed = [o for p in prepared for o in p["observed"]]
    return dict(family=family, **extra, rawQuantifier=raw, licensedAvailability=licensed(raw["availability"], family),
                reachKnowledge=knowledge(immediate, prepared, raw["omittedPreparations"], family),
                observedReach=immediate == "preserved" or any(o["opportunity"] for o in observed),
                observedExecution=any(o["executedLeaves"] for o in observed), preparations=prepared,
                authority="provider_line_only" if family == "provider_line" else "complete_four_ply_local_convention_only"
                if family == "bounded_oracle_diagnostic" else "actual_visited_paths_and_exact_decision_sets_only",
                moveReason="not_an_engine_reason", productionProfileSelected=False)


def pv_observation(root, candidate, pv, definition):
    require(pv and pv[0] == candidate, "missing independent candidate PV")
    board, history = chess.Board(root), []
    for uci in pv[:4]:
        if terminal(board) is not None:
            break
        move = chess.Move.from_uci(uci)
        if move not in board.legal_moves and board.piece_type_at(move.from_square) == chess.KING:
            # Accommodate internal rook-square castling without changing source.
            rook = board.piece_at(move.to_square)
            if rook and rook.piece_type == chess.ROOK and rook.color == board.turn:
                move = chess.Move(move.from_square, (move.from_square // 8) * 8 + (6 if move.to_square > move.from_square else 2))
        require(move in board.legal_moves, "illegal independent PV")
        history.append(move.uci()); board.push(move)
    snapshots = []
    for i in range(len(history)):
        snapshot = tracked(root, history[:i+1], definition)
        snapshot.pop("availableMoveUci")
        snapshots.append(dict(**snapshot, availableActions=actions(snapshot)))
    first = snapshots[0]
    if first["tracked"] is None:
        initial = chess.Board(root)
        captured = v2["captured_square"](initial, chess.Move.from_uci(history[0]))
        # Capturing the named attacker REMOVES the option; disappearance of an
        # unrelated required identity is the different identity_lost status.
        immediate = "identity_lost" if definition["family"] == "material" and captured != chess.parse_square(definition["target"]["attacker"]["square"]) else "removed"
    else:
        immediate = "preserved" if first["availableActions"] else "removed"
    opportunity = len(snapshots) >= 3 and bool(snapshots[2]["availableActions"])
    executed = len(history) == 4 and any(a["uci"] == history[3] for a in snapshots[2]["availableActions"])
    return history, dict(convention="d3262-target-opportunity@2", immediate=immediate,
                         opportunityAtThirdPly=opportunity, reintroducedAtThirdPly=immediate == "removed" and opportunity,
                         executedAtFourthPly=executed, executionWitness=history if executed else None, snapshots=snapshots)


def load():
    values, digests = [], {}
    for name, pinned in SOURCES.items():
        raw = (DIRECTORY / name).read_bytes()
        require(digest(raw) == "sha256:" + pinned, "changed independent immutable source")
        digests[name] = digest(raw)
        values.append(json.loads(gzip.decompress(raw) if name.endswith(".gz") else raw))
    return values, digests


def reconstruct(values, digests):
    root, frame, audit, forcing, provider, proof, engine, model, recursive, pairs, fork, bishop = values
    require(len(root["roots"]) == 66 and len(frame["comparisons"]) == 182 and len(frame["definitions"]) == 64
            and len(proof["candidateGraph"]) == 193 and len(pairs["rows"]) == 116 and len(pairs["unpairedTargets"]) == 17,
            "independent common population")
    require(audit["convention"] == "d3262-target-opportunity@2" and all(not s["changedAvailability"] and not s["changedOutcomes"]
            for s in audit["scopes"].values()), "changed independent v2 audit")
    roots = {r["rootId"]: r for r in root["roots"]}
    definitions, baseline = {d["id"]: d for d in frame["definitions"]}, {ck(r): r for r in audit["baseline"]}
    graphs = {(r["rootId"], r["candidateUci"]): r for r in proof["candidateGraph"]}
    triggers, pv_roots = {ck(r): r for r in forcing["rows"]}, {r["rootId"]: r for r in provider["rows"]}
    budgets, widths = ["depth8", "depth12", "movetime100"], [2, 4, 8]
    arm_sets = {
        "engine": [f"engine:{b}:top{w}" for b in budgets for w in widths],
        "semantic_first_reply_reserve": [f"semantic:{b}:top{w}:{s}" for b in budgets for w in widths for s in ["top8", "all_legal"]],
        "model": ["maia:prefix0.80", "maia:prefix0.90"],
        "recursive": [f"recursive:{b}:top{w}:{s}" for b in budgets for w in widths for s in ["top8", "all_legal"]],
    }
    families = dict(engine="engine_beam", semantic_first_reply_reserve="first_reply_reserve_diagnostic",
                    model="configured_model", recursive="recursive_semantic")
    settings = [dict(id=f"pv:{b}", family="provider_line", budget=b, diagnostic=False) for b in budgets]
    settings += [dict(id=f"forcing:{t}", family="exact_reply_forcing", trigger=t, diagnostic=False) for t in ["square_control", "enemy_piece"]]
    settings += [dict(id=arm, family=families[kind], kind=kind, diagnostic=kind == "semantic_first_reply_reserve")
                 for kind, arms in arm_sets.items() for arm in arms]
    settings += [dict(id="complete:four-ply", family="bounded_oracle_diagnostic", diagnostic=True)]
    proof_profiles = proof["profiles"] + [dict(kind="recursive", rows=recursive["proof"]["rows"])]
    target_profiles = engine["profiles"] + [dict(kind="model", rows=model["rows"]), dict(kind="recursive", rows=recursive["target"]["rows"])]
    pi = {p["kind"]: {ck(r): r for r in p["rows"]} for p in proof_profiles}
    ti = {p["kind"]: {ck(r): r for r in p["rows"]} for p in target_profiles}
    rows = []
    for cell in frame["comparisons"]:
        r, d, exact, graph = roots[cell["rootId"]], definitions[cell["targetId"]], baseline[ck(cell)], graphs[(cell["rootId"], cell["candidateUci"])]
        immediate, arms = exact["next"]["immediate"], []
        actor = d["target"]["attacker" if d["family"] == "material" else "minor"]["color"]
        mover = "white" if chess.Board(r["fen"]).turn else "black"
        require(actor != mover, "wrong target perspective")
        for setting in settings:
            family, extra, selected = setting["family"], {}, []
            if family == "provider_line":
                entry = next(e for p in pv_roots[r["rootId"]]["probes"] if p["budget"] == setting["budget"]
                             for e in p["entries"] if e["moveUci"] == cell["candidateUci"])
                history, observation = pv_observation(r["fen"], cell["candidateUci"], entry["pv"], d)
                require(observation["immediate"] == immediate, "independent PV target scope")
                if len(history) >= 2:
                    visited = []
                    if len(history) >= 3:
                        visited = [dict(pathId=path_id(r["rootId"], history[:3]), preparationUci=history[1], learnerUci=history[2],
                                        opportunity=observation["opportunityAtThirdPly"], executedLeaves=[path_id(r["rootId"], history)]
                                        if observation["executedAtFourthPly"] else [])]
                    selected = [dict(preparationUci=history[1], observed=visited)]
                extra = dict(history=history, rawProviderPv=entry["pv"], rawScore=entry["score"], depth=entry["depth"], rank=entry["rank"],
                             observation=observation, weightAuthority="unweighted_provider_line_not_policy_mass_or_human_frequency")
            elif family in ["exact_reply_forcing", "bounded_oracle_diagnostic"]:
                trigger = setting.get("trigger")
                trigger_set = triggers[ck(cell)]["variants"][trigger]["triggerUcis"] if trigger else None
                for prep in exact["preparations"]:
                    visited = [dict(pathId=path_id(r["rootId"], [cell["candidateUci"], prep["preparationUci"], defence["learnerUci"]]),
                                    preparationUci=prep["preparationUci"], learnerUci=defence["learnerUci"],
                                    opportunity=bool(audit["nodes"][defence["node"]]["availableActions"]), executedLeaves=[])
                               for defence in prep["defences"]] if trigger_set is None or prep["preparationUci"] in trigger_set else []
                    selected.append(dict(preparationUci=prep["preparationUci"], observed=visited))
                extra = dict(triggerInterpretation=trigger, executionAuthority="availability_witnesses_not_played_fourth_moves",
                             weightAuthority="unweighted_legal_enumeration_not_policy_mass_or_human_frequency")
            else:
                kind = setting["kind"]
                raw = next(a for a in pi[kind][ck(cell)]["arms"] if a["arm"] == setting["id"])
                target = next(a for a in ti[kind][ck(cell)]["arms"] if a["arm"] == setting["id"])
                selected = raw["preparations"]
                extra = dict(priorSourceProofCeiling=raw["sourceProofCeiling"], weightAuthority=target.get("weightAuthority", "literal_configured_model_mass_not_human_frequency"),
                             selectedPredecessorPaths=target["selectedPredecessorPaths"], selectedFourthPlyLeaves=target["selectedFourthPlyLeaves"])
                if kind == "model":
                    extra["modelMass"] = {f: target[f] for f in ["opportunityMass", "reintroducedOpportunityMass", "executionMass", "reintroducedExecutionMass",
                                                              "coveredPredecessorMass", "coveredFourthPlyMass", "residualMass"]}
                else:
                    extra["frontierOmissions"] = target["omissions"]
            arms.append(dict(setting=setting["id"], **project(immediate, graph, selected, family, extra)))
        rows.append(dict(**cell, family=d["family"], phase=r["phase"], focus=r["focus"], targetActor=actor,
                         rootMover=mover, immediate=immediate, exactBaseline=exact["next"], arms=arms))
    cells = {ck(r): r for r in rows}
    contrasts = []
    for pair in pairs["rows"]:
        source, alternative = cells[ck(pair, pair["sourceCandidateUci"])], cells[ck(pair, pair["alternativeCandidateUci"])]
        require(source["sourceObserved"] and not alternative["sourceObserved"], "independent pair polarity")
        arms = []
        for setting, a, b in zip(settings, source["arms"], alternative["arms"]):
            arms.append(dict(setting=setting["id"], observedReach=direction(a["observedReach"], b["observedReach"]),
                             observedExecution=direction(a["observedExecution"], b["observedExecution"]),
                             certifiedReach=None if a["reachKnowledge"] is None or b["reachKnowledge"] is None else direction(a["reachKnowledge"], b["reachKnowledge"]),
                             certifiedExecution=None, absenceOfExecution="not_certified", moveReason="not_an_engine_reason"))
        contrasts.append(dict(**{f: pair[f] for f in ["rootId", "targetId", "sourceCandidateUci", "alternativeCandidateUci", "family", "rootRanks"]},
                              phase=source["phase"], focus=source["focus"], exactReach=pair["reachWithinBound"], arms=arms))
    coverage = [dict(rootId=r["rootId"], candidateUci=c["moveUci"], phase=r["phase"], focus=r["focus"], origins=c["origins"],
                     namedCells=sum(row["rootId"] == r["rootId"] and row["candidateUci"] == c["moveUci"] for row in rows),
                     evaluationScope="named_target_cells_not_all_chess_consequences", settings=[s["id"] for s in settings])
                for r in root["roots"] for c in r["candidates"]]
    return dict(version=1, profile="d3262-coherent-five-approach-comparison-v1", convention="d3262-target-opportunity@2", manifest=root["manifest"],
                inputDigests=digests, authority="disposable_common_four_ply_join_not_production_profile_or_engine_causality",
                historicalOriginalPopulation="original_196_preserved_separately_never_pooled", bounds=dict(plies=4, horizon2="not_yet_common_compared"),
                productionProfileSelected=False, endToEndCost="not_measured_by_this_compiler", settings=settings, controls=frame["controls"],
                controlEvidence=dict(fork=fork, bishop=bishop, scope="declared_identity_geometry_only_not_forced_reply_or_autonomous_quiet_plan"),
                candidateCoverage=coverage, rows=rows, contrasts=contrasts, unpairedTargets=pairs["unpairedTargets"])


def check(output, expected):
    require(same_json(output, expected), "common receipt differs from independent reconstruction")


def negative_controls(output, expected):
    # Mutate actual rows, not mocks or the checker. Reuse the independently
    # reconstructed expectation; corruption cannot redefine the source truth.
    controls = [
        ("population", lambda v: v["candidateCoverage"].pop()),
        ("polarity", lambda v: v["rows"][0].update(sourceObserved=not v["rows"][0]["sourceObserved"])),
        ("perspective", lambda v: v["rows"][0].update(targetActor=v["rows"][0]["rootMover"])),
        ("PV universal", lambda v: v["rows"][0]["arms"][0].update(licensedAvailability="exists_preparation_surviving_all_defences")),
        ("partial absence", lambda v: next(a for r in v["rows"] for a in r["arms"] if a["reachKnowledge"] is None).update(reachKnowledge=False)),
        ("omissions", lambda v: next(a for r in v["rows"] for a in r["arms"] if a["rawQuantifier"]["omittedPreparations"]).update(rawQuantifier={})),
        ("unvisited universal", lambda v: v["rows"][0]["arms"][0]["rawQuantifier"].update(availability="exists_preparation_surviving_all_defences")),
        ("model mass", lambda v: next(a for a in v["rows"][0]["arms"] if "modelMass" in a)["modelMass"].update(residualMass=-1)),
        ("execution", lambda v: v["contrasts"][0]["arms"][0].update(certifiedExecution="same")),
        ("forced bishop", lambda v: v["controlEvidence"].update(scope="forced_bishop_retreat")),
        ("profile promotion", lambda v: v.update(productionProfileSelected=True)),
        ("latency promotion", lambda v: v.update(endToEndCost="passes_interactive_budget")),
    ]
    for label, mutate in controls:
        corrupted = copy.deepcopy(output); mutate(corrupted)
        try:
            check(corrupted, expected)
        except AssertionError:
            continue
        raise AssertionError("negative control admitted: " + label)
    return len(controls)


def main():
    values, digests = load()
    expected = reconstruct(values, digests)
    output = json.loads(gzip.decompress((DIRECTORY / OUTPUT).read_bytes()))
    check(output, expected)
    negatives = negative_controls(output, expected) if "--negative-controls" in sys.argv else 0
    print(json.dumps(dict(cells=len(output["rows"]), settings=len(output["settings"]), pairs=len(output["contrasts"]),
                          candidates=len(output["candidateCoverage"]), negativeControls=negatives, independent="python_chess_PV_and_common_quantifier_contrast_join")), flush=True)


if __name__ == "__main__":
    main()
