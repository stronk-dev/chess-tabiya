import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { checkCandidatePacketProjectionGroups, deriveCandidatePacketProjectionGroups, renderCandidatePacketProjections } from "../../../tools/candidate-packet-projections/derive.js";
import {
  CANDIDATE_EVENTS_SCOPE,
  CANDIDATE_PACKET_COMPILER_VERSION,
  CANDIDATE_READINGS_SCOPE,
  CANDIDATE_WIDE_SCOPE,
  CandidatePacketMoveError,
  LOCAL_CANDIDATE_EVENT_PROJECTION_KEYS,
  LOCAL_CANDIDATE_READING_PROJECTION_KEYS,
  assertCandidatePacketEvent,
  assertCandidatePacketProjection,
  assertCandidatePopulationReceipt,
  candidateAlternatives,
  candidateChildReadings,
  candidatePacketId,
  candidatePlayedRow,
  compileCandidatePopulation,
  compileCandidatePopulationForContract,
  projectCandidatePopulationReceipt,
  type CandidatePacketIdentity,
  type CandidatePacketScope,
  type CandidatePopulationReceipt,
} from "./candidate-population.js";
import { CANDIDATE_COLLECTOR_PROJECTION_KEYS } from "./candidate-population-projections.generated.js";
import { BREADTH_COLLECTOR_PROJECTION_IDS, PRIMARY_EVIDENCE_MANIFEST, TACTICAL_COLLECTOR_PROJECTION_IDS } from "./evidence-catalog.js";
import { evidenceDigest } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { MOVE_IDENTITY_CONVENTION, exactLegalMoves } from "./legal-moves.js";
import { assertSemanticEvidenceEvent, compileSemanticEvidenceEvent, legalAlternativeEdges, localSemanticEvents, selectLocalSemanticEvidence, selectSemanticEvidence } from "./semantic-evidence.js";

const ref = (id: string) => ({ id, version: 1 } as const);
const MIDDLEGAME = "r2q1rk1/pp2bppp/2n1bn2/2pp4/3P4/2N1PN2/PP2BPPP/R1BQ1RK1 w - - 0 10";
const CASTLING = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
const EN_PASSANT = "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1";
const PROMOTION = "4k3/P7/8/8/8/8/8/4K3 w - - 0 1";
const CHECK_EVASION = "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1";
const CHECKMATE = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";
const STALEMATE = "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1";
const KING_VERSUS_KING = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";
const FIFTY_MOVE = "4k3/8/8/8/8/8/8/4K2R w - - 100 80";
const FORK = "r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1";
const CAPTURE = "4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1";
const DEGENERATE_CASTLE = "4k3/8/8/8/8/8/8/6KR w K - 0 1";

const cache = new Map<string, CandidatePopulationReceipt>();
function compiled(fen: string, scope: CandidatePacketScope): CandidatePopulationReceipt {
  const key = `${fen}|${JSON.stringify(scope)}`;
  const existing = cache.get(key);
  if (existing !== undefined) return existing;
  const result = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope });
  if (result.kind !== "ready") throw new Error(`candidate packet did not compile: ${JSON.stringify(result.error)}`);
  cache.set(key, result.receipt);
  return result.receipt;
}

function failureOf(result: ReturnType<typeof compileCandidatePopulationForContract>) {
  if (result.kind !== "failed") throw new Error("expected a failed compile");
  return result.error;
}

const multiset = (values: readonly string[]) => [...values].sort();
const keyOf = (value: { readonly projection: { readonly id: string; readonly version: number } }) => `${value.projection.id}@${value.projection.version}`;

describe("shared candidate evidence packet (rfc/shared-candidate-evidence-packet.md)", () => {
  it("criterion 1/27: the caller supplies only beforeFen, a standard ruleset literal and a closed scope", () => {
    for (const extra of [{ candidates: [] }, { legalMoves: [] }, { afterFen: INITIAL_FEN }, { events: [] }, { readings: [] }, { seed: 1 }, { history: ["e2e4"] }]) {
      const result = compileCandidatePopulationForContract({ beforeFen: INITIAL_FEN, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE, ...extra }, {});
      expect(failureOf(result)).toEqual({ code: "invalid_request", reason: "shape" });
    }
    expect(failureOf(compileCandidatePopulationForContract({ beforeFen: INITIAL_FEN, ruleset: "standard", scope: { events: false, readings: false } }, {}))).toEqual({ code: "invalid_request", reason: "scope" });
    expect(failureOf(compileCandidatePopulationForContract({ beforeFen: INITIAL_FEN, ruleset: "standard", scope: { events: true } }, {}))).toEqual({ code: "invalid_request", reason: "scope" });
    expect(failureOf(compileCandidatePopulationForContract({ beforeFen: 42, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE }, {}))).toEqual({ code: "invalid_request", reason: "fen_type" });
    expect(failureOf(compileCandidatePopulationForContract({ beforeFen: "not a fen", ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE }, {})).code).toBe("invalid_fen");
    // Ruleset identity is admitted before any FEN parse: a malformed FEN still reports the ruleset.
    for (const [ruleset, received] of [[undefined, "undefined"], ["chess960", "chess960"], ["crazyhouse", "crazyhouse"]] as const) {
      const request = ruleset === undefined ? { beforeFen: "not a fen", scope: CANDIDATE_EVENTS_SCOPE } : { beforeFen: "not a fen", ruleset, scope: CANDIDATE_EVENTS_SCOPE };
      expect(failureOf(compileCandidatePopulationForContract(request, {}))).toEqual({ code: "unsupported_ruleset", received });
    }
    const receipt = compiled(INITIAL_FEN, CANDIDATE_READINGS_SCOPE);
    expect(receipt.packet.ruleset).toBe("standard");
  });

  it("criterion 2: completeness is reference ownership plus set equality against the sealed exact map", () => {
    for (const [fen, tripwire] of [[INITIAL_FEN, 20], [CHECK_EVASION, 3], [CASTLING, 26], [EN_PASSANT, 7], [PROMOTION, 9]] as const) {
      const receipt = compiled(fen, CANDIDATE_READINGS_SCOPE);
      const flat = receipt.legalMovesInput.payload.pieces.flatMap((piece) => piece.moves);
      expect(receipt.packet.legalMoves).toHaveLength(flat.length);
      receipt.packet.legalMoves.forEach((move, index) => expect(move).toBe(flat[index]));
      expect(new Set(receipt.packet.candidates.map((row) => row.moveUci))).toEqual(new Set(receipt.packet.legalMoves.map((move) => move.uci)));
      expect(receipt.packet.candidates).toHaveLength(receipt.packet.legalMoves.length);
      expect(new Set(receipt.packet.candidates.map((row) => row.moveUci))).toEqual(new Set(exactLegalMoves(fen).map((move) => move.uci)));
      expect(receipt.packet.candidates.length).toBe(tripwire); // drift tripwire only
    }
    expect(compiled(PROMOTION, CANDIDATE_READINGS_SCOPE).packet.candidates.filter((row) => row.moveUci.startsWith("a7a8")).map((row) => row.moveUci).sort()).toEqual(["a7a8b", "a7a8n", "a7a8q", "a7a8r"]);
    expect(compiled(EN_PASSANT, CANDIDATE_READINGS_SCOPE).packet.candidates.some((row) => row.moveUci === "e5d6")).toBe(true);

    const request = { beforeFen: INITIAL_FEN, ruleset: "standard", scope: CANDIDATE_READINGS_SCOPE };
    expect(failureOf(compileCandidatePopulationForContract(request, { rows: (rows) => rows.slice(1) }))).toEqual({ code: "invariant_failed", invariant: "legal_set" });
    expect(failureOf(compileCandidatePopulationForContract(request, { rows: (rows) => [rows[0]!, ...rows.slice(0, -1)] }))).toEqual({ code: "invariant_failed", invariant: "legal_set" });
    expect(failureOf(compileCandidatePopulationForContract(request, { rows: (rows) => [...rows, Object.freeze({ ...rows[0]!, moveUci: "e2e5" })] }))).toEqual({ code: "invariant_failed", invariant: "legal_set" });
    expect(failureOf(compileCandidatePopulationForContract(request, { rows: (rows) => [Object.freeze({ ...rows[0]!, afterFen: INITIAL_FEN }), ...rows.slice(1)] }))).toEqual({ code: "invariant_failed", invariant: "child_fen" });
    // A separately enumerated, field-equal legal list fails by identity, not by order, fields or count.
    expect(failureOf(compileCandidatePopulationForContract(request, { legalMoves: () => exactLegalMoves(INITIAL_FEN) }))).toEqual({ code: "invariant_failed", invariant: "receipt" });
    expect(failureOf(compileCandidatePopulationForContract({ ...request, beforeFen: PROMOTION }, { legalMoves: (flat) => Object.freeze(flat.map((move) => Object.freeze({ ...move }))) }))).toEqual({ code: "invariant_failed", invariant: "receipt" });
    // A row that re-wraps the compiler's values with an equal array is refused too.
    expect(failureOf(compileCandidatePopulationForContract(request, { rows: (rows) => [Object.freeze({ ...rows[0]!, readings: Object.freeze([...rows[0]!.readings]) }), ...rows.slice(1)] }))).toEqual({ code: "invariant_failed", invariant: "receipt" });
  });

  it("criterion 3: checkmate and stalemate are the only empty populations; adjudication is never stored", () => {
    const mate = compiled(CHECKMATE, CANDIDATE_EVENTS_SCOPE);
    expect(mate.packet.candidates).toEqual([]);
    expect(mate.packet.terminal).toEqual({ reason: "checkmate" });
    const stale = compiled(STALEMATE, CANDIDATE_EVENTS_SCOPE);
    expect(stale.packet.candidates).toEqual([]);
    expect(stale.packet.terminal).toEqual({ reason: "stalemate" });
    for (const fen of [KING_VERSUS_KING, FIFTY_MOVE]) {
      const receipt = compiled(fen, CANDIDATE_READINGS_SCOPE);
      expect(receipt.packet.candidates.length).toBeGreaterThan(0);
      expect("terminal" in receipt.packet).toBe(false);
      expect(Object.keys(receipt.packet)).not.toContain("adjudication");
    }
    // Two histories reaching the same full FEN (a repetition) share one packet: history is not an input.
    const first = compileCandidatePopulation({ beforeFen: KING_VERSUS_KING, ruleset: "standard", scope: CANDIDATE_READINGS_SCOPE });
    const second = compileCandidatePopulation({ beforeFen: KING_VERSUS_KING, ruleset: "standard", scope: CANDIDATE_READINGS_SCOPE });
    if (first.kind !== "ready" || second.kind !== "ready") throw new Error("expected packets");
    expect(first.receipt.packet.id).toBe(second.receipt.packet.id);
    expect(failureOf(compileCandidatePopulationForContract({ beforeFen: INITIAL_FEN, ruleset: "standard", scope: CANDIDATE_READINGS_SCOPE }, { rows: () => [] }))).toEqual({ code: "non_terminal_empty", beforeFen: INITIAL_FEN });
    const foreign = compiled(INITIAL_FEN, CANDIDATE_READINGS_SCOPE).packet.candidates[0]!;
    expect(failureOf(compileCandidatePopulationForContract({ beforeFen: CHECKMATE, ruleset: "standard", scope: CANDIDATE_READINGS_SCOPE }, { rows: () => [foreign] }))).toEqual({ code: "invariant_failed", invariant: "terminal" });
  });

  it("criterion 4: scope narrows retained evidence, never candidates, and projects wide→narrow without recomputation", () => {
    const wide = compiled(INITIAL_FEN, CANDIDATE_WIDE_SCOPE);
    const events = compiled(INITIAL_FEN, CANDIDATE_EVENTS_SCOPE);
    const readings = compiled(INITIAL_FEN, CANDIDATE_READINGS_SCOPE);
    const moves = (receipt: CandidatePopulationReceipt) => receipt.packet.candidates.map((row) => row.moveUci);
    expect(moves(events)).toEqual(moves(wide));
    expect(moves(readings)).toEqual(moves(wide));
    expect(events.packet.candidates.every((row) => row.readings.length === 0)).toBe(true);
    expect(readings.packet.candidates.every((row) => row.events.length === 0)).toBe(true);
    expect(new Set([wide.packet.id, events.packet.id, readings.packet.id]).size).toBe(3);
    // The same outputs executed under different plans carry the same payload bytes.
    readings.packet.candidates.forEach((row, index) => expect(row.readings.map((value) => evidenceDigest({ projection: value.projection, payload: value.payload }))).toEqual(wide.packet.candidates[index]!.readings.map((value) => evidenceDigest({ projection: value.projection, payload: value.payload }))));
    events.packet.candidates.forEach((row, index) => expect(row.events.map((value) => value.id)).toEqual(wide.packet.candidates[index]!.events.map((value) => value.id)));

    for (const [scope, direct] of [[CANDIDATE_EVENTS_SCOPE, events], [CANDIDATE_READINGS_SCOPE, readings], [CANDIDATE_WIDE_SCOPE, wide]] as const) {
      const projected = projectCandidatePopulationReceipt(wide, scope);
      if (projected.kind !== "ready") throw new Error("wide projection failed");
      expect(projected.receipt).not.toBe(wide);
      expect(projected.receipt.packet).not.toBe(wide.packet);
      expect(Object.isFrozen(projected.receipt.packet)).toBe(true);
      expect(projected.receipt.packet.scope).toEqual(scope);
      expect(projected.receipt.packet.id).toBe(direct.packet.id);
      expect(projected.receipt.packet.legalMoves).toBe(wide.packet.legalMoves);
      expect(projected.receipt.legalMovesInput).toBe(wide.legalMovesInput);
      projected.receipt.packet.candidates.forEach((row, index) => {
        const source = wide.packet.candidates[index]!;
        if (scope.events) expect(row.events).toBe(source.events); else expect(row.events).toEqual([]);
        if (scope.readings) expect(row.readings).toBe(source.readings); else expect(row.readings).toEqual([]);
      });
      expect(() => assertCandidatePopulationReceipt(projected.receipt)).not.toThrow();
    }
    const same = projectCandidatePopulationReceipt(events, CANDIDATE_EVENTS_SCOPE);
    if (same.kind !== "ready") throw new Error("same-scope projection failed");
    expect(same.receipt.packet.candidates[0]!.events).toBe(events.packet.candidates[0]!.events);
    const crossed = projectCandidatePopulationReceipt(events as CandidatePopulationReceipt<CandidatePacketScope>, CANDIDATE_READINGS_SCOPE as CandidatePacketScope);
    expect(crossed).toEqual({ kind: "failed", error: { code: "invalid_scope_projection", source: CANDIDATE_EVENTS_SCOPE, target: CANDIDATE_READINGS_SCOPE } });
    const reverse = projectCandidatePopulationReceipt(readings as CandidatePopulationReceipt<CandidatePacketScope>, CANDIDATE_WIDE_SCOPE as CandidatePacketScope);
    expect(reverse.kind).toBe("failed");
  });

  it("criterion 5: one packet serves the played row and the alternative denominator as (moveUci, afterFen) pairs", () => {
    for (const [fen, played] of [[INITIAL_FEN, "e2e4"], [CASTLING, "e1h1"], [PROMOTION, "a7a8q"]] as const) {
      const receipt = compiled(fen, CANDIDATE_READINGS_SCOPE);
      const playedRow = candidatePlayedRow(receipt, played);
      const alternatives = candidateAlternatives(receipt, played);
      expect(alternatives).toHaveLength(receipt.packet.candidates.length - 1);
      const packetPairs = new Set(receipt.packet.candidates.map((row) => `${row.moveUci} ${row.afterFen}`));
      const independent = new Set([...legalAlternativeEdges(fen, played).map((edge) => `${edge.moveUci} ${edge.afterFen}`), `${playedRow.moveUci} ${playedRow.afterFen}`]);
      expect(packetPairs).toEqual(independent);
      expect(new Set(alternatives.map((row) => `${row.moveUci} ${row.afterFen}`))).toEqual(new Set(legalAlternativeEdges(fen, played).map((edge) => `${edge.moveUci} ${edge.afterFen}`)));
    }
  });

  it("criterion 6: readers take only MOVE_IDENTITY_CONVENTION identities and never normalise on ingest", () => {
    const castling = compiled(CASTLING, CANDIDATE_READINGS_SCOPE);
    expect(candidatePlayedRow(castling, "e1h1").moveUci).toBe("e1h1");
    for (const read of [() => candidatePlayedRow(castling, "e1g1"), () => candidateAlternatives(castling, "e1g1")]) {
      expect(read).toThrowError(CandidatePacketMoveError);
      expect(read).toThrowError(expect.objectContaining({ code: "move_not_in_packet", convention: MOVE_IDENTITY_CONVENTION }));
      expect(read).toThrow(MOVE_IDENTITY_CONVENTION);
    }
    const degenerate = compiled(DEGENERATE_CASTLE, CANDIDATE_READINGS_SCOPE);
    const row = candidatePlayedRow(degenerate, "g1h1");
    expect(row.afterFen.startsWith("4k3/8/8/8/8/8/8/5RK1 ")).toBe(true);
  });

  it("criterion 7: retained events survive whole, as the original sealed values", () => {
    const receipt = compiled(CAPTURE, CANDIDATE_EVENTS_SCOPE);
    const row = candidatePlayedRow(receipt, "e4d5");
    expect(row.events.length).toBeGreaterThan(0);
    const independent = localSemanticEvents(receipt.packet.beforeFen, "e4d5", row.afterFen);
    expect(row.events.map((event) => event.id)).toEqual(independent.map((event) => event.id));
    for (const event of row.events) {
      expect(() => assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, event)).not.toThrow();
      for (const key of ["id", "projection", "evidence", "derivationInputs", "anchor", "sign", "operands", "basis"]) expect(event).toHaveProperty(key);
      expect(event.evidence.producer).toBeDefined();
      expect(assertCandidatePacketEvent(receipt, event)).toBe(row);
    }
    expect(receipt.candidateInputs.find((input) => input.moveUci === "e4d5")!.events).toBe(row.events);
  });

  it("criterion 8: a byte-identical, correctly sealed rebuild passes the seal and is refused by reference identity", () => {
    const receipt = compiled(INITIAL_FEN, CANDIDATE_EVENTS_SCOPE);
    const row = candidatePlayedRow(receipt, "e2e4");
    const original = row.events[0]!;
    const rebuilt = compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: original.evidence, derivationInputs: original.derivationInputs, anchor: original.anchor, sign: original.sign });
    expect(() => assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, rebuilt)).not.toThrow();
    expect(rebuilt.id).toBe(original.id);
    expect(evidenceDigest(rebuilt.basis)).toBe(evidenceDigest(original.basis));
    expect(rebuilt).not.toBe(original);
    expect(() => assertCandidatePacketEvent(receipt, rebuilt)).toThrow(/not a value this candidate packet compiled/u);
    expect(assertCandidatePacketEvent(receipt, original)).toBe(row);
    const forgedRow = Object.freeze({ ...row, events: Object.freeze([rebuilt, ...row.events.slice(1)]) });
    const forged = { ...receipt, packet: { ...receipt.packet, candidates: receipt.packet.candidates.map((candidate) => candidate === row ? forgedRow : candidate) } };
    expect(() => assertCandidatePopulationReceipt(forged)).toThrow();
    expect(failureOf(compileCandidatePopulationForContract({ beforeFen: INITIAL_FEN, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE }, { rows: (rows) => rows.map((candidate) => candidate.moveUci === "e2e4" ? Object.freeze({ ...candidate, events: Object.freeze([rebuilt, ...candidate.events.slice(1)]) }) : candidate) }))).toEqual({ code: "invariant_failed", invariant: "receipt" });
  });

  it("criterion 9: the closure is code-derived; a census only measures prevalence", () => {
    const { groups, abstentions } = deriveCandidatePacketProjectionGroups();
    expect(checkCandidatePacketProjectionGroups(groups, CANDIDATE_COLLECTOR_PROJECTION_KEYS)).toEqual([]);
    expect(renderCandidatePacketProjections()).toContain('"rules.tactic.event.loose_piece@1"');
    expect(abstentions).toEqual({ "rules.tactic.event.loose_piece@1": ["invalid_turn_clone"] });
    const mutate = (change: (value: Record<string, string[]>) => void) => {
      const copy = Object.fromEntries(Object.entries(CANDIDATE_COLLECTOR_PROJECTION_KEYS).map(([group, keys]) => [group, [...keys] as string[]]));
      change(copy);
      return checkCandidatePacketProjectionGroups(groups, copy);
    };
    expect(mutate((value) => value["event.structural"]!.pop())).toEqual(expect.arrayContaining([expect.stringMatching(/^missing key/u)]));
    expect(mutate((value) => { value["event.castling"] = ["rules.castling.event.rights_lost@2"]; })).toEqual(expect.arrayContaining([expect.stringMatching(/^stale version/u)]));
    expect(mutate((value) => value["event.duty"]!.push("rules.castling.event.rights_lost@1"))).toEqual(expect.arrayContaining([expect.stringMatching(/^duplicate key/u)]));
    expect(mutate((value) => value["reading.child"]!.push("human.maia.candidate_wdl@1"))).toEqual(expect.arrayContaining([expect.stringMatching(/^extra key/u)]));
    expect(mutate((value) => { (value["reading.child"] as unknown[]).push(7); })).toEqual(expect.arrayContaining([expect.stringMatching(/^non-literal/u)]));
    expect(mutate((value) => { value["event.extra"] = []; })).toEqual(expect.arrayContaining([expect.stringMatching(/^extra group/u)]));

    // Twenty child readings, observed by executing the moved authority, plus exchange and fork survival.
    const observedChild = new Set(candidateChildReadings("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1").map(keyOf));
    expect(observedChild).toEqual(new Set(CANDIDATE_COLLECTOR_PROJECTION_KEYS["reading.child"]));
    expect(observedChild.size).toBe(20);
    expect(new Set(LOCAL_CANDIDATE_READING_PROJECTION_KEYS)).toEqual(new Set([...observedChild, "rules.exchange.predicate.legal_exchange@1", "derived.tactic.fork_survives_reply@1"]));
    expect(LOCAL_CANDIDATE_READING_PROJECTION_KEYS).toHaveLength(22);

    // Prevalence is not schema: an observed sweep is a strict subset of the closure and may miss members.
    const observed = new Set<string>();
    for (const fen of [INITIAL_FEN, CAPTURE, FORK]) for (const row of compiled(fen, CANDIDATE_WIDE_SCOPE).packet.candidates) {
      for (const event of row.events) observed.add(keyOf(event));
      for (const reading of row.readings) observed.add(keyOf(reading));
    }
    const closure = new Set<string>([...LOCAL_CANDIDATE_EVENT_PROJECTION_KEYS, ...LOCAL_CANDIDATE_READING_PROJECTION_KEYS]);
    expect([...observed].filter((key) => !closure.has(key))).toEqual([]);
    expect(observed.size).toBeLessThan(closure.size);
    expect(closure.has("rules.transition.event.checkmate@1")).toBe(true);
  });

  it("criterion 9: projection-identity multisets are unchanged by the migration on ordinary, capture, double-attack and abstention fixtures", () => {
    for (const [fen, move] of [[INITIAL_FEN, "g1f3"], [CAPTURE, "e4d5"], [FORK, "b5c7"], [CHECK_EVASION, "e1e2"]] as const) {
      const receipt = compiled(fen, CANDIDATE_WIDE_SCOPE);
      const row = candidatePlayedRow(receipt, move);
      expect(multiset(row.events.map(keyOf))).toEqual(multiset(localSemanticEvents(receipt.packet.beforeFen, move, row.afterFen).map(keyOf)));
      const childKeys = candidateChildReadings(row.afterFen).map(keyOf);
      const readingKeys = row.readings.map(keyOf);
      expect(multiset(readingKeys.filter((key) => CANDIDATE_COLLECTOR_PROJECTION_KEYS["reading.child"].includes(key as never)))).toEqual(multiset(childKeys));
    }
    expect(candidatePlayedRow(compiled(FORK, CANDIDATE_WIDE_SCOPE), "b5c7").readings.map(keyOf)).toContain("derived.tactic.fork_survives_reply@1");
    expect(candidatePlayedRow(compiled(CAPTURE, CANDIDATE_WIDE_SCOPE), "e4d5").readings.map(keyOf)).toContain("rules.exchange.predicate.legal_exchange@1");
    // The abstention fixture: every row of an in-check root publishes the typed loose-piece abstention.
    const check = compiled(CHECK_EVASION, CANDIDATE_EVENTS_SCOPE);
    for (const [index, row] of check.packet.candidates.entries()) {
      expect(row.abstentions).toEqual([{ projection: "rules.tactic.event.loose_piece@1", reason: "invalid_turn_clone" }]);
      expect(check.candidateInputs[index]!.collectorOutcomes).toEqual([{ moveUci: row.moveUci, projection: "rules.tactic.event.loose_piece@1", result: { kind: "unavailable", reason: "invalid_turn_clone" } }]);
    }
    expect(compiled(CHECK_EVASION, CANDIDATE_READINGS_SCOPE).packet.candidates.every((row) => row.abstentions.length === 0)).toBe(true);
  });

  it("criterion 10: the two enumerators are one, and an unevaluated population reports zero evaluated alternatives", () => {
    const afterFen = "r2q1rk1/pp2bppp/2n1bn2/2Pp4/8/2N1PN2/PP2BPPP/R1BQ1RK1 b - - 0 10";
    const shipped = selectLocalSemanticEvidence(ref("research.r2_candidate"), { beforeFen: MIDDLEGAME, moveUci: "d4c5", afterFen });
    const wide = compiled(MIDDLEGAME, CANDIDATE_WIDE_SCOPE);
    const projected = projectCandidatePopulationReceipt(wide, CANDIDATE_EVENTS_SCOPE);
    if (projected.kind !== "ready") throw new Error("projection failed");
    const full = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate"), { receipt: projected.receipt, moveUci: "d4c5" });
    const families = (result: typeof shipped) => result.selected.map((item) => `${item.event.projection.id}:${item.event.sign}`);
    expect(families(shipped)).toEqual(families(full));
    expect(families(shipped)).toEqual(["derived.pawn.event.transitions:state", "rules.structural.event.backward_pawn:gained"]);
    // The narrow eight-family closure selected these before the repair (RFC §1.5, measured at HEAD).
    expect(families(shipped)).not.toEqual(["rules.structural.event.backward_pawn:gained", "rules.structural.event.half_open_file:lost"]);
    expect(shipped.population).toEqual({ legalAlternatives: 33, evaluatedAlternatives: 33 });
    const check = compiled(CHECK_EVASION, CANDIDATE_EVENTS_SCOPE);
    const unevaluated = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate"), { receipt: check, moveUci: "e1e2" });
    expect(unevaluated.population).toEqual({ legalAlternatives: check.packet.candidates.length - 1, evaluatedAlternatives: 0 });
    expect(unevaluated.emptyReason?.id).toBe("counterfactual_population_incomplete");
  });

  it("criteria 11/21b: the packet key is facts only, and every fact term moves it", () => {
    const base: CandidatePacketIdentity = {
      beforeFen: compiled(INITIAL_FEN, CANDIDATE_READINGS_SCOPE).packet.beforeFen,
      legalConvention: "rules.mobility.reading.legal_moves@1",
      moveIdentityConvention: MOVE_IDENTITY_CONVENTION,
      manifestDigest: PRIMARY_EVIDENCE_MANIFEST.digest,
      compilerVersion: CANDIDATE_PACKET_COMPILER_VERSION,
      ruleset: "standard",
      scope: "readings",
    };
    expect(candidatePacketId(base)).toBe(compiled(INITIAL_FEN, CANDIDATE_READINGS_SCOPE).packet.id);
    const variants: Partial<CandidatePacketIdentity>[] = [
      { beforeFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 1 1" },
      { beforeFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 2" },
      { legalConvention: "rules.mobility.reading.legal_moves@2" },
      { moveIdentityConvention: "standard-uci-king-destination@1" },
      { manifestDigest: "0".repeat(64) },
      { compilerVersion: 2 },
      { ruleset: "chess960" },
      { scope: "events" },
    ];
    const ids = variants.map((variant) => candidatePacketId({ ...base, ...variant }));
    expect(new Set([candidatePacketId(base), ...ids]).size).toBe(variants.length + 1);
    // Halfmove/fullmove bytes are facts: board-equal FENs with different clocks are different packets.
    const clocked = compiled("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 4 9", CANDIDATE_READINGS_SCOPE);
    expect(clocked.packet.id).not.toBe(compiled(INITIAL_FEN, CANDIDATE_READINGS_SCOPE).packet.id);
    // The earlier packet stays a recognised, unchanged value — invalidation is by key, never mutation.
    expect(() => assertCandidatePopulationReceipt(compiled(INITIAL_FEN, CANDIDATE_READINGS_SCOPE))).not.toThrow();
  });

  it("criterion 21: a compiled packet is frozen throughout and has no provider term to invalidate", () => {
    "use strict";
    const receipt = compiled(CAPTURE, CANDIDATE_WIDE_SCOPE);
    const packet = receipt.packet as unknown as Record<string, unknown>;
    const row = receipt.packet.candidates[0]! as unknown as Record<string, unknown>;
    expect(() => { packet.manifestDigest = "mutated"; }).toThrow(TypeError);
    expect(() => { (receipt.packet.candidates as unknown as unknown[]).push(row); }).toThrow(TypeError);
    expect(() => { (receipt.packet.legalMoves as unknown as unknown[])[0] = null; }).toThrow(TypeError);
    expect(() => { row.afterFen = "mutated"; }).toThrow(TypeError);
    expect(() => { (receipt.packet.candidates[0]!.events as unknown as unknown[]).pop(); }).toThrow(TypeError);
    expect(() => { (receipt.packet.candidates[0]!.readings[0] as unknown as Record<string, unknown>).payload = null; }).toThrow(TypeError);
    expect(() => { (receipt as unknown as Record<string, unknown>).selectedMember = "events"; }).toThrow(TypeError);
    const again = compileCandidatePopulation({ beforeFen: CAPTURE, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
    if (again.kind !== "ready") throw new Error("expected packet");
    expect(again.receipt.packet.id).toBe(receipt.packet.id);
    const serialized = JSON.stringify({ ...receipt.packet, candidates: [], legalMoves: [] });
    for (const term of ["score", "stockfish", "maia", "salience", "rank", "valence", "grade"]) expect(serialized.toLowerCase()).not.toContain(term);
  });

  it("criteria 22/24: the receipt authority refuses forgeries, crossed members, removed references and raw packets", () => {
    const receipt = compiled(INITIAL_FEN, CANDIDATE_WIDE_SCOPE);
    expect(() => assertCandidatePopulationReceipt(receipt)).not.toThrow();
    const rebuiltLegal = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: INITIAL_FEN });
    const forgeries: unknown[] = [
      { ...receipt },
      { ...receipt, selectedMember: "events" },
      { ...receipt, candidateInputs: receipt.candidateInputs.slice(1) },
      { ...receipt, legalMovesInput: rebuiltLegal },
      receipt.packet,
      JSON.parse(JSON.stringify({ packet: receipt.packet, selectedMember: receipt.selectedMember })),
    ];
    for (const forged of forgeries) expect(() => assertCandidatePopulationReceipt(forged)).toThrow(/not minted/u);
    for (const read of [
      () => candidatePlayedRow(receipt.packet as never, "e2e4"),
      () => candidateAlternatives({ ...receipt } as never, "e2e4"),
      () => assertCandidatePacketEvent(receipt.packet as never, receipt.packet.candidates[0]!.events[0]),
      () => projectCandidatePopulationReceipt({ ...receipt } as never, CANDIDATE_EVENTS_SCOPE),
    ]) expect(read).toThrow(/not minted/u);
    // A legal quiet root emits a strict subset of the possible vocabulary: the aggregate cannot be one F1 conjunction.
    const emitted = new Set(receipt.packet.candidates.flatMap((row) => row.events.map(keyOf)));
    expect(emitted.size).toBeLessThan(LOCAL_CANDIDATE_EVENT_PROJECTION_KEYS.length);
    expect(PRIMARY_EVIDENCE_MANIFEST.projections.some((projection) => projection.id === "derived.candidate.event_population")).toBe(false);
    expect(PRIMARY_EVIDENCE_MANIFEST.bindings.some((binding) => JSON.stringify(binding).includes("candidate.event_population"))).toBe(false);
  });

  it("criterion 16: the Maia leak is closed and the closure is the local declared set, not the collector id union", () => {
    const wdl = invokeEvidenceValueRoute("human.maia.candidate_wdl@1", { page: { nodeId: "n", engine: { id: "maia" }, targetElo: 1500, candidates: [{ moveUci: "e2e4", rank: 1, wdl: { win: 0.4, draw: 0.3, loss: 0.3 } }] } });
    if (wdl.kind !== "available") throw new Error("expected candidate WDL evidence");
    const maia = wdl.value;
    expect(() => assertCandidatePacketProjection(maia, "readings")).toThrow(/outside the local collector closure: human\.maia\.candidate_wdl@1/u);
    const closure = new Set<string>([...LOCAL_CANDIDATE_EVENT_PROJECTION_KEYS, ...LOCAL_CANDIDATE_READING_PROJECTION_KEYS]);
    expect(closure).toEqual(new Set(Object.values(CANDIDATE_COLLECTOR_PROJECTION_KEYS).flat()));
    expect(closure.has("human.maia.candidate_wdl@1")).toBe(false);
    const collectorIdUnion = new Set([...TACTICAL_COLLECTOR_PROJECTION_IDS, ...BREADTH_COLLECTOR_PROJECTION_IDS].map((id) => `${id}@1`));
    expect(closure).not.toEqual(collectorIdUnion);
    const reading = compiled(INITIAL_FEN, CANDIDATE_READINGS_SCOPE).packet.candidates[0]!.readings[0]!;
    expect(() => assertCandidatePacketProjection(reading, "events")).toThrow();
    expect(() => assertCandidatePacketProjection(reading, "readings")).not.toThrow();
  });
});
