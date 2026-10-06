"""D3492 independent python-chess audit and local-exchange convention replay.

Computational independence checks the registered bounded material convention,
not its strategic usefulness, engine causality or arbitrary-depth chess truth.
"""
import gzip
import hashlib
import json
import runpy
import sys
from pathlib import Path

import chess

DIRECTORY = Path("planning/semantic-consequence-search")
HERE = Path(__file__).parent
old = runpy.run_path(str(HERE / "coherent-maia-target-check.py"))
terminal, present, advance = [old[n] for n in ["terminal", "present", "advance"]]
same_json = runpy.run_path(str(HERE / "coherent-actual-contrast-check.py"))["same_json"]
NAMES = ["d3262-coherent-target-comparison-frame.json", "d3262-coherent-root-frame.json",
         "d3262-coherent-bounded-targets.json", "d3262-coherent-actual-proof.json.gz",
         "d3262-coherent-maia-target-outcome.json", "d3262-coherent-engine-target-outcome.json.gz",
         "d3262-coherent-recursive-evaluation.json.gz"]
PINNED = ["229335224b1c175478537554ec52ee7341b983e7358222fe1c7d67c2af16cc6b",
          "dcf339d6042392e3a5d0cc355c3d6779ed751d5540a8a8094d50ce3d7e43df2b",
          "1d80b52dccb29ff3e6024c39156607a8cc93de7dee6c25e773823cef353b2ab8",
          "103f77ec585cc76fe27990567de2d334a3b98ccd42584087e370d1f317c4fdde",
          "0e414803680b73661ecbe5246c35cd858703490d6e4d05d5d73efb6c892e2646",
          "b156a18f683eb832a6d2a2dfa61751d82dfba1b4235ef1520c0bfd0d4939c8ef",
          "c692b1c16efce9491d560f9d6b7453200b925d1bf63810700c3e77d7f5fcd55a"]
OUTPUT = "d3262-target-opportunity-v2-audit.json.gz"
VALUES = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5, chess.QUEEN: 9, chess.KING: 100}


def require(value, message):
    if not value:
        raise AssertionError(message)


def digest(raw):
    return "sha256:" + hashlib.sha256(raw).hexdigest()


def compact(value):
    return json.dumps(value, separators=(",", ":")).encode()


def captured_square(board, move):
    if not board.is_capture(move):
        return None
    return move.to_square + (-8 if board.turn else 8) if board.is_en_passant(move) else move.to_square


def capture_delta(board, move):
    square = captured_square(board, move)
    require(square is not None and move in board.legal_moves, "nonlegal exchange capture")
    return VALUES[board.piece_type_at(square)] + (VALUES[move.promotion] - VALUES[chess.PAWN] if move.promotion else 0)


def tail(board, landing, perspective):
    # Registered convention: legal recaptures on one landing square, optional
    # stop at zero; not a full-game search or a forced check-evasion claim.
    candidates = [m for m in board.legal_moves if m.to_square == landing and board.is_capture(m)]
    values = [0]
    for move in candidates:
        delta = capture_delta(board, move) * (1 if board.turn == perspective else -1)
        after = board.copy(stack=False); after.push(move)
        values.append(delta + tail(after, landing, perspective))
    return max(values) if board.turn == perspective else min(values)


def exchange(board, move):
    first = capture_delta(board, move)
    after = board.copy(stack=False); after.push(move)
    return first + tail(after, move.to_square, board.turn)


def actions(snapshot):
    board = chess.Board(snapshot["fen"])
    require(terminal(board) == snapshot["terminalReason"], "changed target terminal")
    target = snapshot["tracked"]
    if target is None or snapshot["terminalReason"] is not None:
        return []
    actor = target["attacker"] if target["kind"] == "material" else target["minor"]
    require(present(board, actor), "absent target actor")
    if target["kind"] == "material":
        require(present(board, target["target"]), "absent target victim")
    if chess.COLOR_NAMES[board.turn] != actor["color"]:
        return []
    if target["kind"] == "destination":
        to = chess.parse_square(target["square"])
        move = chess.Move(chess.parse_square(actor["square"]), to)
        if board.piece_at(to) is not None or move not in board.legal_moves or board.is_capture(move):
            return []
        after = board.copy(stack=False); after.push(move)
        if any(exchange(after, capture) > 0 for capture in after.legal_moves if capture.to_square == to and after.is_capture(capture)):
            return []
        return [dict(uci=move.uci(), landingSquare=target["square"], capturedSquare=None, promotion=None, resultUnits=None)]
    result = []
    for move in sorted(board.legal_moves, key=lambda m: m.uci()):
        if move.from_square != chess.parse_square(actor["square"]) or captured_square(board, move) != chess.parse_square(target["target"]["square"]):
            continue
        value = exchange(board, move)
        if value > 0:
            result.append(dict(uci=move.uci(), landingSquare=chess.square_name(move.to_square),
                               capturedSquare=target["target"]["square"], promotion=chess.piece_name(move.promotion) if move.promotion else None,
                               resultUnits=value))
    return result


def tracked(root, history, definition):
    board = chess.Board(root)
    piece = lambda p: {k: p[k] for k in ["color", "role", "square"]}
    d = definition["target"]
    target = dict(kind=definition["family"])
    if target["kind"] == "material":
        target.update(attacker=piece(d["attacker"]), target=piece(d["target"]))
    else:
        target.update(minor=piece(d["minor"]), controllingPawn=piece(d["controllingPawn"]), square=d["square"])
    for i, uci in enumerate(history):
        move = chess.Move.from_uci(uci)
        require(terminal(board) is None and move in board.legal_moves, "illegal exact history")
        if target is not None:
            if i == 0 and target["kind"] == "destination":
                after = board.copy(stack=False); after.push(move)
                if not present(after, target["minor"]):
                    target = None
                elif not present(after, target["controllingPawn"]):
                    target["controllingPawn"] = None
            else:
                fields = ["attacker", "target"] if target["kind"] == "material" else ["minor", "controllingPawn"]
                for field in fields:
                    target[field] = advance(board, move, target[field])
                if target[fields[0]] is None or target["kind"] == "material" and target["target"] is None:
                    target = None
        board.push(move)
    snapshot = dict(ply=len(history), fen=board.fen(en_passant="legal"), tracked=target, terminalReason=terminal(board))
    # Historical single from->captured-square move has no promotion role.
    possible = actions(snapshot)
    original = next((a["uci"] for a in possible if a["promotion"] is None
                     and (a["capturedSquare"] is None or a["capturedSquare"] == a["landingSquare"])), None)
    return dict(**snapshot, availableMoveUci=original)


def load_inputs():
    values, digests = [], {}
    for name, pinned in zip(NAMES, PINNED):
        raw = (DIRECTORY / name).read_bytes()
        require(digest(raw) == "sha256:" + pinned, "changed immutable audit input")
        digests[name] = digest(raw)
        values.append(json.loads(gzip.decompress(raw) if name.endswith(".gz") else raw))
    sources = {n: digest((HERE / n).read_bytes()) for n in ["coherent-bounded-targets.ts", "target-opportunity-v2.ts"]}
    return values, digests, sources


def reconstruct(inputs, digests, sources):
    comparison, frame, prior, proof, model, engine, recursive = inputs
    roots = {r["rootId"]: r for r in frame["roots"]}
    definitions = {r["id"]: r for r in comparison["definitions"]}
    old_rows = {(r["rootId"], r["targetId"], r["candidateUci"]): r for r in prior["rows"]}
    graphs = {(r["rootId"], r["candidateUci"]): r for r in proof["candidateGraph"]}
    nodes, cache, scopes, affected, observation_counts = [], {}, {}, [], {}

    def collect(s, scope, identity):
        identity = [s["fen"], s["tracked"], s["terminalReason"]]
        raw = compact(identity); key = raw.decode()
        if key not in cache:
            cache[key] = len(nodes)
            nodes.append(dict(id=digest(raw), fen=s["fen"], tracked=s["tracked"], terminalReason=s["terminalReason"], availableActions=actions(s)))
            if len(nodes) % 20000 == 0:
                print(json.dumps(dict(nodes=len(nodes), scope=scope)), flush=True)
        stats = scopes.setdefault(scope, dict(snapshotOccurrences=0, stages=[0, 0, 0, 0], changedAvailability=0, changedOutcomes=0))
        stats["snapshotOccurrences"] += 1; stats["stages"][s["ply"] - 1] += 1
        available = nodes[cache[key]]["availableActions"]
        if [a["uci"] for a in available] != ([] if s["availableMoveUci"] is None else [s["availableMoveUci"]]):
            stats["changedAvailability"] += 1
            affected.append(dict(scope=scope, identity=identity, ply=s["ply"], node=cache[key], prior=s["availableMoveUci"], next=available))
        return cache[key]

    baseline = []
    for cell in comparison["comparisons"]:
        root, definition = roots[cell["rootId"]], definitions[cell["targetId"]]
        graph = graphs[(cell["rootId"], cell["candidateUci"])]
        snap = lambda history: collect(tracked(root["fen"], history, definition), "complete_legal_baseline",
                                       [cell["targetId"], cell["rootId"], *history])
        first = snap([cell["candidateUci"]]); first_node = nodes[first]
        after = chess.Board(first_node["fen"])
        require(graph["afterFen"] == first_node["fen"] and graph["terminalReason"] == terminal(after), "changed exact candidate")
        require([p["preparationUci"] for p in graph["preparations"]] == sorted(m.uci() for m in after.legal_moves), "lost legal preparations")
        old_row = old_rows[(cell["rootId"], cell["targetId"], cell["candidateUci"])]
        immediate = old_row["immediate"] if first_node["tracked"] is None else "preserved" if first_node["availableActions"] else "removed"
        any_positive, universal, preparations = False, False, []
        if graph["terminalReason"] is None:
            for prep in graph["preparations"]:
                prefix = [cell["candidateUci"], prep["preparationUci"]]
                p = snap(prefix); node = nodes[p]; board = chess.Board(node["fen"])
                require(node["fen"] == prep["fen"] and node["terminalReason"] == prep["terminalReason"], "crossed exact preparation")
                require(prep["legalDefences"] == sorted(m.uci() for m in board.legal_moves), "lost legal defences")
                defences = []
                if node["terminalReason"] is None:
                    for defence in prep["legalDefences"]:
                        ordinal = snap(prefix + [defence])
                        any_positive |= bool(nodes[ordinal]["availableActions"])
                        defences.append(dict(learnerUci=defence, node=ordinal))
                survives = bool(defences) and all(nodes[d["node"]]["availableActions"] for d in defences)
                universal |= survives
                preparations.append(dict(preparationUci=prep["preparationUci"], node=p, defences=defences, survives=survives,
                                         unexpandedTerminalLegalMoves=0 if node["terminalReason"] is None else len(prep["legalDefences"])))
        next_row = dict(immediate=immediate, reintroducedWithin3Ply=immediate == "removed" and any_positive,
                        preparationSurvivesEveryDefence=immediate == "removed" and universal)
        old_values = {k: old_row[k] for k in next_row}
        if any(next_row[k] != old_values[k] for k in next_row):
            scopes["complete_legal_baseline"]["changedOutcomes"] += 1
        baseline.append(dict(**cell, family=definition["family"], phase=root["phase"], firstNode=first, prior=old_values,
                             next=next_row, changedFields=[k for k in next_row if next_row[k] != old_values[k]], preparations=preparations))

    def audit_observation(observation, scope, identity):
        refs = []
        for i, s in enumerate(observation["snapshots"]):
            require(s["ply"] == i + 1, "crossed snapshot stage")
            ordinal = collect(s, scope, identity); refs.append(ordinal)
        first, third = nodes[refs[0]], nodes[refs[2]] if len(refs) >= 3 else None
        immediate = observation["immediate"] if first["tracked"] is None else "preserved" if first["availableActions"] else "removed"
        opportunity = third is not None and bool(third["availableActions"])
        executed = False
        if len(refs) == 4 and third is not None:
            before = chess.Board(third["fen"])
            for a in third["availableActions"]:
                board = before.copy(stack=False); board.push_uci(a["uci"])
                executed |= board.fen(en_passant="legal") == nodes[refs[3]]["fen"]
        next_row = dict(immediate=immediate, opportunityAtThirdPly=opportunity,
                        reintroducedAtThirdPly=immediate == "removed" and opportunity, executedAtFourthPly=executed)
        if any(observation[k] != v for k, v in next_row.items()):
            scopes[scope]["changedOutcomes"] += 1
        observation_counts[scope] = observation_counts.get(scope, 0) + 1

    for cell in model["rows"]:
        for path in cell["paths"]:
            audit_observation(path["observation"], "actual_model", [cell["targetId"], path["id"]])
            for arm in path["arms"]:
                for leaf in arm["leaves"]:
                    audit_observation(leaf["observation"], "actual_model", [cell["targetId"], leaf["leafId"], arm["arm"]])
    for scope, source in [("actual_engine_and_first_reply_reserve", engine), ("actual_recursive", recursive)]:
        for row in source["observations"]:
            audit_observation(row["observation"], scope, [row["targetId"], row["pathId"]])
    return dict(version=1, profile="d3262-target-opportunity-v2-audit-v1", convention="d3262-target-opportunity@2",
                authority="disposable_all_stage_local_exchange_audit_not_production_or_independent_strategic_truth",
                manifest=comparison["manifest"], inputDigests=digests, sourceDigests=sources,
                population=dict(offeredCandidates=193, roots=66, cells=182, definitions=64, controls=comparison["controls"],
                                historicalOriginalPopulation="original_196_preserved_not_rebased_or_part_of_current_corrected_population"),
                quantifier="exists_opponent_preparation_forall_legal_learner_defences_exists_named_target_available_at_ply4",
                referenceEncoding="zero_based_node_pool_ordinal", nodes=nodes, baseline=baseline, scopes=scopes,
                observationCounts=observation_counts, affected=affected)


def verify(actual, expected):
    require(same_json(actual, expected), "independent v2 audit mismatch")


def main():
    inputs, digests, sources = load_inputs()
    output = json.loads(gzip.decompress((DIRECTORY / OUTPUT).read_bytes()))
    expected = reconstruct(inputs, digests, sources)
    verify(output, expected)
    negatives = []
    if "--negative-controls" in sys.argv:
        positive = next(n for n in output["nodes"] if n["availableActions"])
        tests = [(output, "authority", "production_proof"), (output, "convention", "unversioned"),
                 (output, "quantifier", "exists_only"), (output["population"], "offeredCandidates", 196),
                 (output, "nodes", output["nodes"][:-1]), (output, "baseline", output["baseline"][:-1]),
                 (positive, "availableActions", []), (positive, "fen", "changed"),
                 (positive["availableActions"][0], "capturedSquare", "a1"),
                 (output["baseline"][0], "firstNode", True),
                 (output["baseline"][0]["next"], "preparationSurvivesEveryDefence", True),
                 (output["scopes"]["actual_recursive"], "stages", [0, 0, 0, 0])]
        for obj, field, changed in tests:
            prior = obj[field]; obj[field] = changed
            try:
                try:
                    verify(output, expected)
                except AssertionError:
                    negatives.append(field)
                else:
                    raise AssertionError("corruption admitted: " + field)
            finally:
                obj[field] = prior
    print(json.dumps(dict(nodes=len(expected["nodes"]), baselineCells=len(expected["baseline"]),
                          scopes=expected["scopes"], negatives=negatives)), flush=True)


if __name__ == "__main__":
    main()
