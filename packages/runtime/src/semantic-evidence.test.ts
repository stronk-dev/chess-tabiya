import { SEMANTIC_PLAYED_RANKING_MODES } from "./semantic-played-types.js";
import { SEMANTIC_INSPECTOR_EVENT_VALIDATION_ROOTS, mirrorSemanticFen, mirrorSemanticUci } from "./semantic-validation.js";
import { inspectorFixtureEdges } from "./testing/inspector-presentation-fixture.js";
import { RECORDED_SEQUENCE_POSITIVES } from "./testing/recorded-sequence-fixtures.js";
import { recordedSequenceWindowFixture } from "./testing/recorded-sequence-window-fixture.js";
import { recordedSemanticWindowSource } from "./recorded-semantic-window.js";
import { RECORDED_SEQUENCE_HORIZONS, type RecordedSequenceRoute } from "./recorded-sequence-window.js";
import { normalizeMove } from "chessops/chess";
import { INITIAL_FEN } from "chessops/fen";
import { parseUci } from "chessops/util";
import { afterAll, describe, expect, it, vi } from "vitest";
import * as candidateCompiler from "./candidate-population.js";
import * as valueRouteCalls from "./internal/evidence-value-routes.js";

import { canonicalFen, positionFromFen } from "./chess.js";
import { EVIDENCE_CONTRACT_DECLARATIONS, PRIMARY_EVIDENCE_MANIFEST, SEMANTIC_EVENT_DECLARATIONS, SEMANTIC_SELECTION_PROJECTION_REFS } from "./evidence-catalog.js";
import { compileEvidenceManifest, declareEvidence as declareWithAuthority, evidenceValueReceipt, type DeclaredEvidence, type EvidenceSelectionPolicyDeclaration } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import {
  CANDIDATE_EVENTS_SCOPE,
  CANDIDATE_READINGS_SCOPE,
  CANDIDATE_WIDE_SCOPE,
  assertCandidatePacketEvent,
  candidateAlternatives,
  candidatePlayedRow,
  compileCandidatePopulation,
  projectCandidatePopulationReceipt,
  type CandidatePopulationReceipt,
  type CandidateWideScope,
} from "./candidate-population.js";
import {
  assertEvidenceSelectionResult,
  assertSemanticEvidenceEvent,
  canonicalMoveUci,
  castlingSemanticEvents,
  compileSemanticEvidenceEvent,
  legalAlternativeEdges,
  localSemanticEvents,
  pawnIslandSemanticEvents,
  selectSemanticEvidence,
  selectLocalSemanticEvidence,
  structuralSemanticEvents,
  subjectOutcomeSemanticEvents,
  tacticalSemanticEvents,
  tradeCompletedSemanticEvent,
  transitionSemanticEvents,
  type SemanticEvidenceEvent,
} from "./semantic-evidence.js";

const ref = (id: string, version = 1) => ({ id, version } as const);

describe("foundation change signs at the shared event boundary", () => {
  it("preserves exact declared change signs without extending existing consumer eligibility", () => {
    const signs = ["membership_changed", "count_gained", "count_lost", "topology_changed"] as const;
    const route = "rules.structural.event.king_zone";
    // Compiler-only fixture: extending an event vocabulary cannot grant a consumer new signs.
    const manifest = compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS,
      producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map(producer => ({ ...producer, outputs: producer.outputs.map(output => output.id === route && output.version === 1 ? { ...output, signs: [...output.signs, ...signs] } : output) })),
      semanticEvents: EVIDENCE_CONTRACT_DECLARATIONS.semanticEvents!.map(declaration => declaration.projection.id === route && declaration.projection.version === 1 ? { ...declaration, allowedSigns: [...declaration.allowedSigns, ...signs] } : declaration),
    });
    const beforeFen = "7k/8/8/8/8/8/8/R6K w - - 0 1", moveUci = "a1a2", afterFen = after(beforeFen, moveUci);
    const evidence = declareEvidence(ref("rules.structural"), ref(route), { before_fen: beforeFen, move_uci: moveUci, after_fen: afterFen, family: "open_file", before: [], after: [] });
    for (const sign of signs) {
      const value = compileSemanticEvidenceEvent(manifest, { evidence, anchor: { beforeFen, moveUci, afterFen, side: "white" }, sign });
      expect(value.sign).toBe(sign);
      assertSemanticEvidenceEvent(manifest, value);
      expect(manifest.eligibility.filter(row => row.event.id === route).every(row => !row.allowedSigns.includes(sign))).toBe(true);
      expect(() => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence, anchor: value.anchor, sign })).toThrow(/sign/u);
    }
  });
});

/**
 * Test-only compiler fixture (value authority §1): exercises compile-path mechanics with synthetic
 * operands. Its receipt names the fixture's exact sealed sources, as every factory receipt must.
 */
function declareEvidence<T>(producer: { id: string; version: number }, projection: { id: string; version: number }, payload: T, sources: readonly DeclaredEvidence<unknown>[] = []): DeclaredEvidence<T> {
  return declareWithAuthority(producer, projection, payload, { factory: "test:semantic-evidence-fixture", inputDigest: "0".repeat(64), sourceDigests: sources.map((source) => evidenceValueReceipt(source).payloadDigest) });
}

/** Recorded-path run.record.move evidence for a contiguous played line from `fen`. */
function pathMoves(fen: string, moves: readonly string[]): readonly DeclaredEvidence<unknown>[] {
  let current = canonicalFen(positionFromFen(fen));
  const path = moves.map((moveUci, index) => {
    const afterFen = after(current, moveUci);
    const anchor = { beforeNodeId: `n${index}`, afterNodeId: `n${index + 1}`, beforeFen: current, moveUci: canonicalMoveUci(current, moveUci), afterFen };
    current = afterFen;
    return anchor;
  });
  return path.map((_, offset) => invokeEvidenceValueRoute("run.record.move@1", { path, offset }));
}

function after(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  const parsed = parseUci(uci)!;
  const move = normalizeMove(position, parsed);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return canonicalFen(position);
}

function event(fen: string, uci: string, projection = "rules.structural.event.king_zone", sign: "gained" | "lost" | "preserved" = "gained"): SemanticEvidenceEvent {
  const afterFen = after(fen, uci);
  const payload = Object.freeze({ before_fen: canonicalFen(positionFromFen(fen)), move_uci: canonicalMoveUci(fen, uci), after_fen: afterFen, family: projection.split(".").at(-1), before: [], after: ["fixture"] });
  const declared = declareEvidence(ref("rules.structural"), ref(projection), payload);
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declared, anchor: { beforeFen: fen, moveUci: uci, afterFen, side: positionFromFen(fen).turn }, sign });
}

function ruleEvent(fen: string, uci: string, family: "castled" | "promotion" | "checkmate" | "last_of_role"): SemanticEvidenceEvent {
  const afterFen = after(fen, uci);
  const canonical = canonicalMoveUci(fen, uci);
  const payload = Object.freeze({ before_fen: canonicalFen(positionFromFen(fen)), move_uci: canonical, after_fen: afterFen, mover: "fixture", from: canonical.slice(0, 2), to: canonical.slice(2, 4), detail: family });
  const declared = declareEvidence(ref("rules.transition"), ref(`rules.transition.event.${family}`), payload);
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declared, anchor: { beforeFen: fen, moveUci: uci, afterFen, side: positionFromFen(fen).turn }, sign: "state" });
}

function policy(overrides: Partial<EvidenceSelectionPolicyDeclaration> = {}) {
  const declaration: EvidenceSelectionPolicyDeclaration = { id: "test.selection", version: 1, consumer: ref("research.semantic_selection", 3), disposition: "experimental", minimumAlternatives: 8, maximumSameFamilyShare: 0.2, minimumAlternativeOnlyShare: 0.3, maxFacts: 2, criticalEvents: [], ...overrides };
  return { declaration, manifest: compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS, selectionPolicies: [...EVIDENCE_CONTRACT_DECLARATIONS.selectionPolicies!, declaration] }) };
}

const CHECK_FEN = "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1";
const RECEIPTS = new Map<string, CandidatePopulationReceipt<CandidateWideScope>>();

function eventsReceipt(fen: string): CandidatePopulationReceipt<CandidateWideScope> {
  const cached = RECEIPTS.get(fen);
  if (cached !== undefined) return cached;
  const compiled = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
  if (compiled.kind !== "ready") throw new Error(`candidate packet did not compile: ${compiled.error.code}`);
  RECEIPTS.set(fen, compiled.receipt);
  return compiled.receipt;
}

function familyOf(event: SemanticEvidenceEvent): string {
  return `${event.projection.id}:${event.sign}`;
}

function eligibleFor(event: SemanticEvidenceEvent, consumer: { readonly id: string; readonly version: number }): boolean {
  return PRIMARY_EVIDENCE_MANIFEST.eligibility.some((row) => row.event.id === event.projection.id && row.consumer.id === consumer.id && row.consumer.version === consumer.version && row.disposition === "eligible" && row.allowedSigns.includes(event.sign));
}

/** Independent oracle over the packet rows: share of alternatives carrying each played family. */
function playedFamilyShares(receipt: CandidatePopulationReceipt, moveUci: string, consumer: { readonly id: string; readonly version: number }): Map<string, number> {
  const alternatives = candidateAlternatives(receipt, moveUci);
  const families = new Set(candidatePlayedRow(receipt, moveUci).events.filter((event) => eligibleFor(event, consumer) && SEMANTIC_PLAYED_RANKING_MODES[`${event.projection.id}@${event.projection.version}` as keyof typeof SEMANTIC_PLAYED_RANKING_MODES] === "projection_sign_prevalence").map(familyOf));
  return new Map([...families].map((family) => [family, alternatives.filter((row) => row.events.some((event) => eligibleFor(event, consumer) && familyOf(event) === family)).length / alternatives.length]));
}

describe("semantic evidence runtime", () => {
  it("checks every declared event mechanically and refuses manufactured current foundation values", () => {
    const fen = INITIAL_FEN;
    const moveUci = "e2e4";
    const afterFen = after(fen, moveUci);
    const anchor = { beforeFen: fen, moveUci, afterFen, side: positionFromFen(fen).turn } as const;
    const expectedFixtureIds = new Set<string>();

    for (const declaration of SEMANTIC_EVENT_DECLARATIONS) {
      const projection = PRIMARY_EVIDENCE_MANIFEST.projections.find((candidate) => candidate.id === declaration.projection.id && candidate.version === declaration.projection.version)!;
      const operands = Object.freeze(Object.fromEntries(declaration.requiredOperands.map((operand) => [operand,
        operand === "before_fen" ? canonicalFen(positionFromFen(fen))
          : operand === "move_uci" ? moveUci
            : operand === "after_fen" ? afterFen
              : operand === "before" || operand === "after" ? null
                : operand === "alternativeEvents" ? Object.freeze([])
                  : operand === "legalAlternatives" || operand === "alternativesWithFamily" ? 0
                    : operand === "family" ? declaration.projection.id.split(".").at(-1)
                      : "fixture",
      ])));
      const derivationMember = declaration.derivationAnyOf?.[0] ?? declaration.derivationInputs ?? [];
      const derivationInputs = derivationMember.map((input) => {
        const source = PRIMARY_EVIDENCE_MANIFEST.projections.find((candidate) => candidate.id === input.id && candidate.version === input.version)!;
        return declareEvidence(source.producer, input, Object.freeze({ fixture: true, input: `${input.id}@${input.version}` }));
      });
      const evidence = declareEvidence(projection.producer, declaration.projection, operands, derivationInputs);
      const compileFixture = () => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence, derivationInputs, anchor, sign: declaration.allowedSigns[0]! });
      if ((declaration.projection.id.startsWith("derived.semantic_avoidance.") && declaration.projection.version === 2) || SEMANTIC_INSPECTOR_EVENT_VALIDATION_ROOTS.some(root => root.id === declaration.projection.id && root.version === declaration.projection.version)) {
        // Genuine positives are covered in foundation-semantic-event.test.ts. The compiler's
        // generic fixture mint cannot supply original source-factory membership for these seven.
        expect(compileFixture).toThrowError(expect.objectContaining({ code: "EVIDENCE_GENERIC_BYPASS" }));
      } else expect(compileFixture).not.toThrow();

      const missing = Object.freeze(Object.fromEntries(Object.entries(operands).slice(1)));
      const missingEvidence = declareEvidence(projection.producer, declaration.projection, missing, derivationInputs);
      expect(() => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: missingEvidence, derivationInputs, anchor, sign: declaration.allowedSigns[0]! })).toThrowError(expect.objectContaining({ code: "EVIDENCE_EVENT_OPERAND_MISSING" }));

      // rfc/semantic-validation-authority.md §2: validation is a profile reference, never a label.
      expect(declaration.validation).toEqual({ profile: { kind: "event", projection: declaration.projection } });
      expectedFixtureIds.add(`${declaration.projection.id}@${declaration.projection.version}`);
    }

    expect(expectedFixtureIds.size).toBe(SEMANTIC_EVENT_DECLARATIONS.length);
    expect(JSON.stringify(SEMANTIC_EVENT_DECLARATIONS)).not.toMatch(/semantic-event:|positives|hardNegatives|externalPopulation/u);
  });

  it("seals event bytes and rejects structural forgeries", () => {
    const value = event(INITIAL_FEN, "e2e4");
    expect(() => assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, value)).not.toThrow();
    expect(() => assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { ...value })).toThrowError(expect.objectContaining({ code: "EVIDENCE_GENERIC_BYPASS" }));
  });

  it("canonicalizes both castling encodings to one resulting-king-square event identity", () => {
    const fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
    expect(canonicalMoveUci(fen, "e1g1")).toBe("e1h1");
    const standard = ruleEvent(fen, "e1g1", "castled");
    const imported = ruleEvent(fen, "e1h1", "castled");
    expect(imported.id).toBe(standard.id);
    const emitted = transitionSemanticEvents(fen, "e1g1", after(fen, "e1g1")).find((event) => event.operands.family === "castled");
    expect(emitted?.operands).toMatchObject({ move_uci: "e1h1", to: "g1", detail: { resultingKingSquare: "g1" } });
  });

  it("emits permanent castling-right loss separately from transient legality", () => {
    const fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
    const afterFen = after(fen, "h1h2");
    const events = castlingSemanticEvents(fen, "h1h2", afterFen);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ projection: { id: "rules.castling.event.rights_lost", version: 1 }, sign: "lost", operands: { color: "white", wing: "kingside", cause: "rook_moved" } });
  });

  it("enumerates ordinary, en-passant, castling and all four promotion roles as replayable exact children", () => {
    const fixtures = [
      { fen: INITIAL_FEN, move: "e2e4", contains: "d2d4" },
      { fen: "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1", move: "e5d6", contains: "e5e6" },
      { fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", move: "e1g1", contains: "e1a1" },
      { fen: "4k3/P7/8/8/8/8/8/4K3 w - - 0 1", move: "a7a8q", contains: "a7a8n" },
    ];
    for (const fixture of fixtures) {
      const alternatives = legalAlternativeEdges(fixture.fen, fixture.move);
      expect(alternatives.some((edge) => edge.moveUci === fixture.contains)).toBe(true);
      for (const edge of alternatives) expect(after(edge.beforeFen, edge.moveUci)).toBe(edge.afterFen);
    }
    expect(legalAlternativeEdges(fixtures[3]!.fen, "e1e2").filter((edge) => edge.moveUci.startsWith("a7a8")).map((edge) => edge.moveUci)).toEqual(["a7a8b", "a7a8n", "a7a8q", "a7a8r"]);
  });

  it("selects a critical exact event from a compiled packet without granting valence and seals the result", () => {
    // The black bishops prevent checking rook alternatives. Unlike the original fixture below,
    // this is genuinely a complete current defender-exposure population, not an omitted source.
    const fen = "3bkb2/8/8/8/8/8/8/R3K2R w KQ - 0 1";
    const receipt = eventsReceipt(fen);
    const result = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate", 3), { receipt, moveUci: "e1h1" });
    const castled = result.selected.find((item) => item.event.projection.id === "rules.transition.event.castled");
    expect(castled?.kind, JSON.stringify({ emptyReason: result.emptyReason, population: result.population,
      abstentions: receipt.packet.candidates.filter(row => row.abstentions.length > 0).map(row => ({ moveUci: row.moveUci, abstentions: row.abstentions })) })).toBe("played_event");
    expect(castled?.event.valence).toBeUndefined();
    expect(result.population).toEqual({ legalAlternatives: receipt.packet.candidates.length - 1 });
    expect(result.coverage.unavailable).toEqual([]);
    for (const item of result.selected) if (item.kind === "played_event") expect(assertCandidatePacketEvent(receipt, item.event).moveUci).toBe("e1h1");
    expect(() => assertEvidenceSelectionResult(PRIMARY_EVIDENCE_MANIFEST, result)).not.toThrow();
    expect(() => assertEvidenceSelectionResult(PRIMARY_EVIDENCE_MANIFEST, { ...result })).toThrowError(expect.objectContaining({ code: "EVIDENCE_GENERIC_BYPASS" }));
    expect(() => assertEvidenceSelectionResult(PRIMARY_EVIDENCE_MANIFEST, { ...result, consumer: { id: "inspector.position_structure", version: 2 } })).toThrowError(expect.objectContaining({ code: "EVIDENCE_GENERIC_BYPASS" }));
  });

  it("retains the original castling fixture's critical fact with explicit unrelated coverage gaps", () => {
    const receipt = eventsReceipt("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    const result = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate", 3), { receipt, moveUci: "e1h1" });
    expect(receipt.packet.candidates.filter(row => row.abstentions.length > 0).map(row => ({ moveUci: row.moveUci, abstentions: row.abstentions })))
      .toEqual(["a1a8", "h1h8"].map(moveUci => ({ moveUci, abstentions: [{ projection: "derived.tactic.defender_exposure@2", reason: "invalid_turn_clone" }] })));
    expect(result.population).toEqual({ legalAlternatives: 25 });
    expect(result.coverage.unavailable).toEqual([{ projection: ref("derived.tactic.defender_exposure", 2),
      cause: { kind: "candidate_collector", projection: ref("derived.tactic.defender_exposure", 2) }, reason: "invalid_turn_clone",
      members: ["a1a8", "h1h8"].map(moveUci => ({ kind: "child", moveUci })) }]);
    expect(result.emptyReason).toBeUndefined();
    expect(result.selected.some(fact => fact.event.projection.id === "rules.transition.event.castled")).toBe(true);
    expect(() => assertEvidenceSelectionResult(PRIMARY_EVIDENCE_MANIFEST, result)).not.toThrow();
  });

  it("retains twelve original piece-count relations on the initial pawn advance", () => {
    const afterFen = after(INITIAL_FEN, "e2e4");
    const values = structuralSemanticEvents(INITIAL_FEN, "e2e4", afterFen);
    const counts = values.filter(value => value.operands.family === "piece_count");
    expect(counts).toHaveLength(12);
    expect(counts.every(value => value.anchor.moveUci === "e2e4" && value.operands.before_fen === value.anchor.beforeFen && value.operands.after_fen === value.anchor.afterFen)).toBe(true);
    expect(counts.every(value => value.sign === "preserved")).toBe(true);
  });

  it("joins the original moved queen to its gained loose-piece event", () => {
    const fen = "4r1k1/8/8/8/8/8/3Q4/6K1 w - - 0 1";
    const value = localSemanticEvents(fen, "d2e2", after(fen, "d2e2")).find(event => event.projection.id === "rules.tactic.event.loose_piece");
    expect(value).toMatchObject({ sign: "gained", operands: { mover: { before: { square: "d2" }, after: { square: "e2" } } } });
    expect(() => assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, value)).not.toThrow();
  });

  it("emits identity-preserving structural relations while leaving raw readings independent", () => {
    const afterFen = after(INITIAL_FEN, "e2e4");
    const values = structuralSemanticEvents(INITIAL_FEN, "e2e4", afterFen);
    expect(values.length).toBeGreaterThan(0);
    expect(values.every((value) => value.anchor.moveUci === "e2e4" && value.operands.before_fen === value.anchor.beforeFen && value.operands.after_fen === value.anchor.afterFen)).toBe(true);
    expect(values.filter((value) => value.operands.family === "piece_count")).toHaveLength(12);
    expect(values.every((value) => value.sign === "preserved")).toBe(true);
    expect(localSemanticEvents(INITIAL_FEN, "e2e4", after(INITIAL_FEN, "e2e4")).some(value => value.sign !== "preserved")).toBe(true);
  });

  it("emits independent transition properties without priority suppression", () => {
    const fen = "4k3/8/5p2/4q3/3P4/8/8/4K3 w - - 0 1";
    const values = transitionSemanticEvents(fen, "d4e5", after(fen, "d4e5"));
    const families = new Set(values.map((value) => value.operands.family));
    expect(families.has("clock_reset")).toBe(true);
    expect(families.has("last_of_role")).toBe(true);
    expect(families.has("pawn_contact")).toBe(true);
    expect(values.every((value) => value.projection.id === `rules.transition.event.${value.operands.family}`)).toBe(true);
  });

  it("seals capture class as a derivation of the exact capture and exchange evidence", () => {
    const fen = "r3k3/p7/8/8/8/8/8/R3K3 w - - 0 1";
    const values = localSemanticEvents(fen, "a1a7", after(fen, "a1a7"));
    const event = values.find((value) => value.projection.id === "derived.exchange.capture_class");
    expect(event?.operands).toMatchObject({ class: "negative", exchange: { resultUnits: -4 } });
    expect(event?.derivationInputs.map((input) => input.projection.id).sort()).toEqual(["rules.exchange.predicate.legal_exchange", "rules.transition.event.capture"]);
  });

  it("emits pawn-island and mover-relative loose-piece events through the compiled path", () => {
    const pawnFen = "4k3/8/8/8/8/8/PP1P4/4K3 w - - 0 1";
    const pawnAfter = after(pawnFen, "b2b4");
    const islandEvents = pawnIslandSemanticEvents(pawnFen, "b2b4", pawnAfter);
    expect(islandEvents).toEqual([]); // A rank-only pawn move preserves the complete partition; topology2 is silent.

    const looseFen = "4r1k1/8/8/8/8/8/3Q4/6K1 w - - 0 1";
    const loose = localSemanticEvents(looseFen, "d2e2", after(looseFen, "d2e2")).find((value) => value.projection.id === "rules.tactic.event.loose_piece");
    expect(loose).toMatchObject({ sign: "gained", operands: { mover: { before: { square: "d2" }, after: { square: "e2" } } } });
    expect(() => assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, loose)).not.toThrow();
  });

  it("seals an immediate capture-recapture trade over both capture and recorded-move anchors", () => {
    const start = "4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1";
    const boundary = after(start, "e4d5");
    const end = after(boundary, "e6d5");
    const first = transitionSemanticEvents(start, "e4d5", boundary).find((value) => value.operands.family === "capture")!;
    const second = transitionSemanticEvents(boundary, "e6d5", end).find((value) => value.operands.family === "capture")!;
    const [firstMove, secondMove] = pathMoves(start, ["e4d5", "e6d5"]) as [DeclaredEvidence<unknown>, DeclaredEvidence<unknown>];
    const trade = tradeCompletedSemanticEvent(first, second, firstMove, secondMove);
    expect(trade).toMatchObject({
      projection: { id: "derived.exchange.trade_completed" },
      operands: { startFen: first.anchor.beforeFen, boundaryFen: first.anchor.afterFen, endFen: second.anchor.afterFen, landingSquare: "d5" },
    });
    expect(trade?.derivationInputs.map((value) => value.projection.id)).toEqual([
      "rules.transition.event.capture", "rules.transition.event.capture", "run.record.move", "run.record.move",
    ]);

    const delayOne = after(boundary, "e8f7");
    const delayTwo = after(delayOne, "e1f2");
    const lateEnd = after(delayTwo, "e6d5");
    const lateCapture = transitionSemanticEvents(delayTwo, "e6d5", lateEnd).find((value) => value.operands.family === "capture")!;
    expect(tradeCompletedSemanticEvent(first, lateCapture, firstMove, secondMove)).toBeUndefined();

    const specialCaptures = [
      { start: "4k3/2p5/8/3pP3/8/8/8/4K3 w - d6 0 1", first: "e5d6", second: "c7d6", enPassant: true },
      { start: "6kr/6P1/8/8/8/8/8/K7 w - - 0 1", first: "g7h8n", second: "g8h8", enPassant: false },
    ] as const;
    for (const fixture of specialCaptures) {
      const middle = after(fixture.start, fixture.first);
      const finish = after(middle, fixture.second);
      const openingCapture = transitionSemanticEvents(fixture.start, fixture.first, middle).find((value) => value.operands.family === "capture")!;
      const recapture = transitionSemanticEvents(middle, fixture.second, finish).find((value) => value.operands.family === "capture")!;
      const [specialFirst, specialSecond] = pathMoves(fixture.start, [fixture.first, fixture.second]) as [DeclaredEvidence<unknown>, DeclaredEvidence<unknown>];
      const specialTrade = tradeCompletedSemanticEvent(openingCapture, recapture, specialFirst, specialSecond);
      // Recorded moves of a different line are a crossed ancestry, never a trade anchor.
      expect(() => tradeCompletedSemanticEvent(openingCapture, recapture, firstMove, secondMove)).toThrow(/anchors are not the two capture edges/u);
      expect(openingCapture.operands).toMatchObject({ family: "capture", enPassant: fixture.enPassant });
      expect(specialTrade).toMatchObject({ operands: { landingSquare: fixture.first.slice(2, 4), firstMoveUci: fixture.first, secondMoveUci: fixture.second } });
    }
  });

  it("D3865 retains every ordered trade occurrence and rejects crossed or incomplete witnesses", () => {
    const start = "4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1";
    const boundary = after(start, "e4d5");
    const end = after(boundary, "e6d5");
    const first = transitionSemanticEvents(start, "e4d5", boundary).find(value => value.operands.family === "capture")!;
    const second = transitionSemanticEvents(boundary, "e6d5", end).find(value => value.operands.family === "capture")!;
    const [firstMove, secondMove] = pathMoves(start, ["e4d5", "e6d5"]) as [DeclaredEvidence<unknown>, DeclaredEvidence<unknown>];
    const trade = tradeCompletedSemanticEvent(first, second, firstMove, secondMove)!;
    const declared = PRIMARY_EVIDENCE_MANIFEST.projections.find(value => value.id === trade.projection.id && value.version === trade.projection.version)!;
    expect(declared.derivation?.inputs).toEqual(trade.derivationInputs.map(value => value.projection));
    expect(evidenceValueReceipt(trade.evidence).sourceDigests).toEqual(trade.derivationInputs.map(value => evidenceValueReceipt(value).payloadDigest));
    for (const inputs of [
      [second.evidence, first.evidence, firstMove, secondMove],
      [first.evidence, second.evidence, secondMove, firstMove],
      [first.evidence, first.evidence, firstMove, secondMove],
      [first.evidence, second.evidence, firstMove],
    ]) expect(() => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, {
      evidence: trade.evidence, derivationInputs: inputs, anchor: trade.anchor, sign: trade.sign,
    })).toThrow(/EVIDENCE_EVENT_DERIVATION_MISMATCH/u);
  });

  it("emits discovered execution only when the exact before-state relation and gained ray agree", () => {
    const before = "7k/8/8/8/4r3/5N2/6B1/7K w - - 0 1";
    const afterFen = after(before, "f3h4");
    const values = localSemanticEvents(before, "f3h4", afterFen);
    const executed = values.find((value) => value.projection.id === "derived.tactic.discovered_executed");
    expect(executed).toMatchObject({ operands: { screen: { square: "f3" }, slider: { square: "g2" }, target: { square: "e4" } }, sign: "gained" });
    expect(executed?.derivationInputs.map((value) => value.projection.id)).toEqual([
      "rules.tactic.reading.discovered_latency", "rules.transition.event.slider_ray",
    ]);
  });

  it("emits exact reply/check and exchange-filtered double-attack events from their real producers", () => {
    const forkFen = "8/2k5/3r4/8/3N4/8/8/4K3 w - - 0 1";
    const forkAfter = after(forkFen, "d4b5");
    const forkEvents = tacticalSemanticEvents(forkFen, "d4b5", forkAfter);
    expect(forkEvents.map((value) => value.projection.id)).toEqual([
      "rules.tactic.consequence.reply_breadth",
      "rules.tactic.event.check",
      "rules.tactic.event.double_attack",
    ]);
    expect(forkEvents.find((value) => value.projection.id.endsWith("reply_breadth"))?.operands).toMatchObject({ count: expect.any(Number), horizon: "1 reply" });
    expect(forkEvents.find((value) => value.projection.id.endsWith("double_attack"))?.operands).toMatchObject({ targets: expect.arrayContaining([expect.objectContaining({ square: "c7", king: true }), expect.objectContaining({ square: "d6", king: false })]) });

    const negativeFen = "4k3/2p3p1/3b3b/8/3N4/8/8/4K3 w - - 0 1";
    const negativeEvents = tacticalSemanticEvents(negativeFen, "d4f5", after(negativeFen, "d4f5"));
    expect(negativeEvents.some((value) => value.projection.id.endsWith("double_attack"))).toBe(false);
  });

  it("emits castling, promotion and checkmate exact positives", () => {
    const cases = [
      { fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", move: "e1g1", family: "castled" },
      { fen: "4k3/P7/8/8/8/8/8/4K3 w - - 0 1", move: "a7a8q", family: "promotion" },
      { fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1", move: "g6g7", family: "checkmate" },
    ] as const;
    for (const fixture of cases) {
      const emitted = transitionSemanticEvents(fixture.fen, fixture.move, after(fixture.fen, fixture.move));
      expect(emitted.some((value) => value.operands.family === fixture.family)).toBe(true);
      expect(emitted.every((value) => value.valence === undefined)).toBe(true);
    }
    const nearMisses = [
      { fen: cases[0].fen, move: "e1e2", family: "castled" },
      { fen: "4k3/8/P7/8/8/8/8/4K3 w - - 0 1", move: "a6a7", family: "promotion" },
      { fen: cases[2].fen, move: "g6g5", family: "checkmate" },
    ] as const;
    for (const fixture of nearMisses) expect(transitionSemanticEvents(fixture.fen, fixture.move, after(fixture.fen, fixture.move)).some((value) => value.operands.family === fixture.family)).toBe(false);
  });

  it("runs the compiled research policy over the complete local legal population", () => {
    const afterFen = after(INITIAL_FEN, "e2e4");
    const result = selectLocalSemanticEvidence(ref("research.r2_candidate", 3), { beforeFen: INITIAL_FEN, moveUci: "e2e4", afterFen });
    expect(result.coverage.unavailable).toEqual([]);
    expect(result.population.legalAlternatives).toBe(19);
    expect(result.selected.length).toBeLessThanOrEqual(2);
    expect(() => assertEvidenceSelectionResult(PRIMARY_EVIDENCE_MANIFEST, result)).not.toThrow();
  });

  it("applies played-family thresholds at the packet's measured share and orders deterministically", () => {
    const receipt = eventsReceipt(INITIAL_FEN);
    const research = ref("research.semantic_selection", 3);
    const shares = playedFamilyShares(receipt, "e2e4", research);
    const [family, share] = [...shares].find(([, value]) => value > 0 && value < 1)!;
    const at = policy({ maximumSameFamilyShare: share, maxFacts: 50, minimumAlternativeOnlyShare: null });
    const below = policy({ maximumSameFamilyShare: share - 1e-9, maxFacts: 50, minimumAlternativeOnlyShare: null });
    const selectedAt = selectSemanticEvidence(at.manifest, ref(at.declaration.id), { receipt, moveUci: "e2e4" });
    const selectedBelow = selectSemanticEvidence(below.manifest, ref(below.declaration.id), { receipt, moveUci: "e2e4" });
    const fact = selectedAt.selected.find((item) => familyOf(item.event) === family);
    expect(fact?.kind).toBe("played_event");
    expect((fact as { sameFamilyShare: number }).sameFamilyShare).toBeCloseTo(share);
    expect(selectedBelow.selected.some((item) => familyOf(item.event) === family)).toBe(false);
    expect(selectedBelow.rejected.some((item) => item.candidate.id === fact!.event.id && item.reason.id === "nothing_distinctive")).toBe(true);
    const wide = compileCandidatePopulation({ beforeFen: INITIAL_FEN, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
    if (wide.kind !== "ready") throw new Error("wide packet did not compile");
    const projected = projectCandidatePopulationReceipt(wide.receipt, CANDIDATE_WIDE_SCOPE);
    if (projected.kind !== "ready") throw new Error("wide packet did not project");
    const again = selectSemanticEvidence(at.manifest, ref(at.declaration.id), { receipt: projected.receipt, moveUci: "e2e4" });
    expect(again.selected.map((item) => item.event.id)).toEqual(selectedAt.selected.map((item) => item.event.id));
    expect(again.rejected).toEqual(selectedAt.rejected);
  });

  it("keeps eligibility consumer-specific and refuses to turn a signed event into valence", () => {
    const configured = policy({ consumer: { id: "inspector.position_structure", version: 2 }, criticalEvents: [] });
    const receipt = eventsReceipt(INITIAL_FEN);
    expect(() => selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { receipt, moveUci: "e2e4" })).toThrow(/exact current/u);
    expect(candidatePlayedRow(receipt, "e2e4").events.every((event) => event.valence === undefined)).toBe(true);
  });

  it("covers every threshold and cap in the declared selector sensitivity grid against the packet's own counts", () => {
    const receipt = eventsReceipt(INITIAL_FEN);
    const research = ref("research.semantic_selection", 3);
    const played = playedFamilyShares(receipt, "e2e4", research);
    for (const maximumSameFamilyShare of [0.1, 0.2, 0.3]) {
      const configured = policy({ maximumSameFamilyShare, maxFacts: 50, minimumAlternativeOnlyShare: null });
      const result = selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { receipt, moveUci: "e2e4" });
      const expected = [...played].filter(([, share]) => share <= maximumSameFamilyShare).map(([family]) => family).sort();
      expect([...new Set(result.selected.filter((item) => item.kind === "played_event" && played.has(familyOf(item.event))).map((item) => familyOf(item.event)))].sort()).toEqual(expected);
    }
    // Source-outcome threshold boundaries use the same original source family. The literal
    // subject/state truth is tested independently in semantic-subject-outcomes.test.ts.
    const source = eventsReceipt("7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1");
    const original = subjectOutcomeSemanticEvents(PRIMARY_EVIDENCE_MANIFEST, "piece_count", source, "h1g1");
    if (original.kind !== "available") throw Error("Complete literal source fixture unavailable");
    const loss = original.events.find(value => value.operands.family === "piece_count" && value.operands.subject.color === "black" && value.operands.subject.role === "pawn" && value.operands.alternativeRelation === "decrease")!;
    expect(loss.operands.supportingMoves).toEqual(["c4d5"]);
    const boundary = 1 / (source.packet.candidates.length - 1);
    for (const minimumAlternativeOnlyShare of [null, boundary, boundary + 1e-9] as const) {
      const configured = policy({ minimumAlternativeOnlyShare, maximumSameFamilyShare: 0, maxFacts: 1000, minimumAlternatives: 0 });
      const result = selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { receipt: source, moveUci: "h1g1" });
      expect(result.selected.some(item => item.event.id === loss.id)).toBe(minimumAlternativeOnlyShare === boundary);
    }
    for (const maxFacts of [1, 2, 3]) {
      const configured = policy({ maxFacts, maximumSameFamilyShare: 1, minimumAlternativeOnlyShare: null });
      const result = selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { receipt, moveUci: "e2e4" });
      expect(result.selected).toHaveLength(maxFacts);
    }
  });

  it("retains complete exact subject outcomes and the original root/child vector in selected absence", () => {
    const receipt = eventsReceipt("7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1");
    const configured = policy({ minimumAlternatives: 0, minimumAlternativeOnlyShare: 0, maxFacts: 1000 });
    const result = selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { receipt, moveUci: "h1g1" });
    const avoided = result.selected.find(item => item.kind === "counterfactual_absence" && item.event.operands.family === "piece_count" && item.event.operands.subject.color === "black" && item.event.operands.subject.role === "pawn" && item.event.operands.alternativeRelation === "decrease");
    expect(avoided?.kind).toBe("counterfactual_absence");
    if (avoided?.kind !== "counterfactual_absence") throw Error("Required original pawn-count outcome missing");
    expect(avoided.event.operands).toMatchObject({ family: "piece_count", root: { kind: "present", value: 1 }, played: { kind: "present", value: 1 }, alternativesWithOutcome: 1, supportingMoves: ["c4d5"] });
    expect(avoided.event.operands.alternatives).toHaveLength(receipt.packet.candidates.length - 1);
    const original = subjectOutcomeSemanticEvents(PRIMARY_EVIDENCE_MANIFEST, "piece_count", receipt, "h1g1");
    if (original.kind !== "available") throw Error("Required source unavailable");
    const same = original.events.find(event => event.id === avoided.event.id)!;
    expect(same).toBeDefined(); same.derivationInputs.forEach((input, index) => expect(avoided.event.derivationInputs[index]).toBe(input));
    expect(avoided.event.valence).toBeUndefined();
  });

  it("constructs loose-piece outcomes for the exact original pawn rather than a projection/sign family", () => {
    const receipt = eventsReceipt("7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1");
    const configured = policy({ minimumAlternatives: 0, minimumAlternativeOnlyShare: 0, maxFacts: 1000 });
    const result = selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { receipt, moveUci: "c4d5" });
    const avoided = result.selected.find(item => item.kind === "counterfactual_absence" && item.event.operands.family === "loose_piece" && item.event.operands.subject.root.square === "c4");
    expect(avoided?.event.operands).toMatchObject({ family: "loose_piece", subject: { kind: "loose_piece", root: { color: "white", role: "pawn", square: "c4" } }, root: { value: true }, played: { value: false }, alternativeRelation: "true_to_true" });
  });

  it("makes every selection reason reachable, including a non-empty critical budget exhaustion", () => {
    const receipt = eventsReceipt(INITIAL_FEN);
    const run = (configured: ReturnType<typeof policy>, target = receipt, moveUci = "e2e4") => selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { receipt: target, moveUci });
    expect(() => run(policy({ consumer: { id: "inspector.position_structure", version: 2 }, criticalEvents: [] }))).toThrow(/exact current/u);
    expect(run(policy({ minimumAlternatives: 100 })).emptyReason?.id).toBe("insufficient_alternatives");
    expect(run(policy({ minimumAlternatives: 0, maximumSameFamilyShare: 0, minimumAlternativeOnlyShare: null }), eventsReceipt("7k/8/8/8/3K4/8/8/8 w - - 0 1"), "d4e4").emptyReason?.id).toBe("nothing_distinctive");
    expect(run(policy({ maxFacts: 0 })).emptyReason?.id).toBe("budget_zero");
    const check = eventsReceipt(CHECK_FEN);
    const incomplete = run(policy(), check, check.packet.candidates[0]!.moveUci);
    expect(incomplete.emptyReason?.id).toBe("counterfactual_population_incomplete");
    expect(incomplete.population).toEqual({ legalAlternatives: check.packet.candidates.length - 1 });
    expect(incomplete.coverage.unavailable.length).toBeGreaterThan(0);
    const played = candidatePlayedRow(receipt, "e2e4").events.filter((event) => eligibleFor(event, ref("research.semantic_selection", 3)));
    const critical = policy({ maxFacts: 1, criticalEvents: [...new Map(played.map((event) => [`${event.projection.id}@${event.projection.version}`, event.projection])).values()] });
    const exhausted = run(critical);
    expect(exhausted.selected).toHaveLength(1);
    expect(exhausted.rejected.some((item) => item.reason.id === "critical_budget_exhausted")).toBe(true);
  });

  it("refuses a raw packet, a readings-only packet and a foreign-dialect played move at the selection boundary", () => {
    const receipt = eventsReceipt(INITIAL_FEN);
    expect(() => selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate", 3), { receipt: { ...receipt }, moveUci: "e2e4" })).toThrow(/not minted/u);
    const readings = compileCandidatePopulation({ beforeFen: INITIAL_FEN, ruleset: "standard", scope: CANDIDATE_READINGS_SCOPE });
    if (readings.kind !== "ready") throw new Error("readings packet did not compile");
    // @ts-expect-error Deliberate narrow-scope runtime refusal.
    expect(() => selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate", 3), { receipt: readings.receipt, moveUci: "e2e4" })).toThrow(/wide|scope|original/u);
    const castle = eventsReceipt("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    expect(() => selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate", 3), { receipt: castle, moveUci: "e1g1" })).toThrowError(expect.objectContaining({ code: "move_not_in_packet", convention: "chessops-king-takes-rook@1" }));
  });
});


// Accepted value-authority §2.2a. Receipt order is separate from declaration-family semantics.
describe("D4170 actual factory input receipt order", () => {
  const checked = { local: 0, recorded: 0, multiple: 0 };
  const verify = (event: SemanticEvidenceEvent) => {
    const saved = JSON.stringify(event);
    expect(evidenceValueReceipt(event.evidence).sourceDigests).toEqual(event.derivationInputs.map(value => evidenceValueReceipt(value).payloadDigest));
    const rebuilt = compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: event.evidence, derivationInputs: event.derivationInputs, anchor: event.anchor, sign: event.sign });
    expect(rebuilt.id).toBe(event.id); expect(rebuilt.operands).toEqual(event.operands);
    assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, event);
    expect(JSON.stringify(event)).toBe(saved);
    if (event.derivationInputs.length > 1) checked.multiple++;
  };
  const wrap = (event: SemanticEvidenceEvent, inputs: readonly DeclaredEvidence<unknown>[]) => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST,
    { evidence: event.evidence, derivationInputs: inputs, anchor: event.anchor, sign: event.sign });
  it.each([
    ["white", "r3k3/p7/8/8/8/8/8/R3K3 w - - 0 1", "a1a7"],
    ["black", "r3k3/8/8/8/8/8/P7/R3K3 b - - 0 1", "a8a2"],
  ])("%s retains the genuine capture/exchange vector and refuses changed order or members", (_side, fen, uci) => {
    const event = localSemanticEvents(fen!, uci!, after(fen!, uci!)).find(value => value.projection.id === "derived.exchange.capture_class")!;
    expect(event).toBeDefined(); expect(event.derivationInputs.map(value => value.projection.id)).toEqual(["rules.transition.event.capture", "rules.exchange.predicate.legal_exchange"]);
    verify(event);
    const foreignFen = fen!.replace("0 1", "0 2"), foreign = localSemanticEvents(foreignFen, uci!, after(foreignFen, uci!)).find(value => value.projection.id === event.projection.id)!;
    // An independent genuine invocation can have the same digest at each ordinal.
    // The foreign edge above retires the direct factory's single-edge reuse, so this
    // exercises different genuine instances. Receipt matching is not object authentication.
    const equivalent = localSemanticEvents(fen!, uci!, after(fen!, uci!)).find(value => value.projection.id === event.projection.id)!;
    expect(equivalent.evidence).not.toBe(event.evidence);
    equivalent.derivationInputs.forEach((value, i) => {
      expect(value).not.toBe(event.derivationInputs[i]);
      expect(evidenceValueReceipt(value).payloadDigest).toBe(evidenceValueReceipt(event.derivationInputs[i]!).payloadDigest);
    });
    expect(wrap(event, equivalent.derivationInputs).id).toBe(event.id);
    for (const inputs of [[...event.derivationInputs].reverse(), event.derivationInputs.slice(0, 1), [...event.derivationInputs, event.derivationInputs[0]!],
      [event.derivationInputs[0]!, event.derivationInputs[0]!], [foreign.derivationInputs[0]!, event.derivationInputs[1]!], [event.evidence, event.derivationInputs[1]!]]) {
      expect(() => wrap(event, inputs)).toThrowError(expect.objectContaining({ code: "EVIDENCE_EVENT_DERIVATION_MISMATCH" }));
    }
    verify(event);
  });
  it("preserves genuine repeated refs without swapping their different original payloads", () => {
    const fen = "4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1", middle = after(fen, "e4d5"), end = after(middle, "e6d5");
    const first = transitionSemanticEvents(fen, "e4d5", middle).find(value => value.operands.family === "capture")!;
    const second = transitionSemanticEvents(middle, "e6d5", end).find(value => value.operands.family === "capture")!;
    const moves = pathMoves(fen, ["e4d5", "e6d5"]), event = tradeCompletedSemanticEvent(first, second, moves[0]!, moves[1]!)!;
    expect(event).toBeDefined(); expect(event.derivationInputs).toHaveLength(4);
    verify(event);
    const [a, b, c, d] = event.derivationInputs;
    expect(a!.projection).toEqual(b!.projection); expect(c!.projection).toEqual(d!.projection);
    for (const inputs of [[b!, a!, c!, d!], [a!, b!, d!, c!], [a!, b!, c!], [a!, b!, c!, d!, d!]]) expect(() => wrap(event, inputs)).toThrow();
  });
  it("retains every original occurrence of an actual variable source-family population", () => {
    const receipt = eventsReceipt("7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1"), source = subjectOutcomeSemanticEvents(PRIMARY_EVIDENCE_MANIFEST, "piece_count", receipt, "h1g1");
    if (source.kind !== "available") throw Error("Complete literal source unavailable");
    const event = source.events[0];
    expect(event).toBeDefined(); if (event === undefined) throw Error("Actual variable-population producer witness is required");
    expect(event.derivationInputs.length).toBeGreaterThan(1);
    expect(new Set(event.derivationInputs.map(value => evidenceValueReceipt(value).payloadDigest)).size).toBeGreaterThan(1);
    const declaration = PRIMARY_EVIDENCE_MANIFEST.semanticEvents.find(row => row.projection.id === event.projection.id)!;
    expect(declaration.derivationInputs).toHaveLength(2); // Original legal and family sources, each with its complete repeated vector.
    verify(event);
    expect(() => wrap(event, [...event.derivationInputs].reverse())).toThrowError(expect.objectContaining({ code: "EVIDENCE_EVENT_DERIVATION_MISMATCH" }));
    expect(() => wrap(event, event.derivationInputs.slice(1))).toThrow();
    expect(() => wrap(event, [...event.derivationInputs, event.derivationInputs[0]!])).toThrow();
  });
  it.each(inspectorFixtureEdges())("rebuilds the complete actual local edge $moveUci without changing its events", edge => {
    const events = localSemanticEvents(edge.beforeFen, edge.moveUci, edge.afterFen);
    expect(events.length).toBeGreaterThan(0);
    events.forEach(verify); checked.local += events.length;
  });
  const recordedCases = Object.keys(RECORDED_SEQUENCE_HORIZONS).map(route => {
    const positive = RECORDED_SEQUENCE_POSITIVES.find(row => `${row.projection}@3` === route);
    if (positive === undefined) throw Error(`Missing genuine recorded source ${route}`);
    return { route: route as RecordedSequenceRoute, positive };
  });
  it.each(recordedCases)("rebuilds actual recorded $route events through the same strict join", ({ route, positive }) => {
    const run = recordedSequenceWindowFixture(positive), [id, version] = route.split("@");
    const source = recordedSemanticWindowSource({ run, branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId, projection: { id: id!, version: Number(version) } });
    expect(source.kind).toBe("window_available");
    if (source.kind !== "window_available") throw Error("Original recorded producer did not execute");
    expect(source.events.length).toBeGreaterThan(0);
    source.events.forEach(verify); checked.recorded += source.events.length;
  });
  afterAll(() => {
    expect(checked.local).toBeGreaterThan(0); expect(checked.recorded).toBeGreaterThan(0); expect(checked.multiple).toBeGreaterThan(0);
  });
});

describe("selector3 source-local coverage", () => {
  it("rejects changing receipt/move accessors before reading either genuine source", () => {
    const fen = "k7/8/8/8/8/1p6/PP6/R6K w - - 0 1", move = "a2b3";
    const a = eventsReceipt(fen), b = eventsReceipt(mirrorSemanticFen(fen, "horizontal"));
    let receiptReads = 0, moveReads = 0;
    expect(() => selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate", 3), {
      get receipt() { return ++receiptReads === 1 ? a : b; }, moveUci: mirrorSemanticUci(move, "horizontal"),
    })).toThrow(/own-data/);
    expect(receiptReads).toBe(0);
    expect(() => selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate", 3), {
      receipt: a, get moveUci() { moveReads++; return move; },
    })).toThrow(/own-data/);
    expect(moveReads).toBe(0);
  });

  it.each(["latency", "missing", "duplicate"] as const)("preflights actual %s binding failure before any family factory runs", fault => {
    const receipt = eventsReceipt(INITIAL_FEN);
    const target = PRIMARY_EVIDENCE_MANIFEST.bindings.find(binding => binding.consumer.id === "research.semantic_selection")!;
    const bindings = fault === "missing" ? PRIMARY_EVIDENCE_MANIFEST.bindings.filter(binding => binding !== target)
      : fault === "duplicate" ? [...PRIMARY_EVIDENCE_MANIFEST.bindings, target]
      : PRIMARY_EVIDENCE_MANIFEST.bindings.map(binding => binding.consumer.id === "research.semantic_selection"
      ? { ...binding, latency: { mode: "invalid" as never, maxMs: null } } : binding);
    const source = vi.spyOn(valueRouteCalls, "invokeEvidenceValueRoute");
    try {
      expect(() => selectSemanticEvidence({ ...PRIMARY_EVIDENCE_MANIFEST, bindings }, ref("research.r2_candidate", 3), { receipt, moveUci: "e2e4" })).toThrow(/BINDING_EXECUTION/);
      expect(source).not.toHaveBeenCalled();
    } finally { source.mockRestore(); }
  });

  it("excludes an actually emitted but incompletely evaluated source even under critical override", () => {
    const receipt = eventsReceipt("r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1"), moveUci = "c5b6";
    const projection = ref("derived.tactic.defender_exposure", 2);
    expect(candidatePlayedRow(receipt, moveUci).events.some(event => event.projection.id === projection.id)).toBe(true);
    const { declaration, manifest } = policy({ minimumAlternatives: 0, maximumSameFamilyShare: 1,
      minimumAlternativeOnlyShare: null, maxFacts: 100, criticalEvents: [projection] });
    const selected = selectSemanticEvidence(manifest, declaration, { receipt, moveUci });
    expect(selected.coverage.unavailable.some(value => value.projection.id === projection.id)).toBe(true);
    expect(selected.selected.some(fact => fact.event.projection.id === projection.id)).toBe(false);
    expect(selected.population.legalAlternatives).toBe(receipt.packet.candidates.length - 1);
  });

  it("rejects the retired policy before local population acquisition", () => {
    const afterFen = after(INITIAL_FEN, "e2e4"), source = vi.spyOn(candidateCompiler, "compileCandidatePopulation");
    try {
      expect(() => selectLocalSemanticEvidence(ref("research.r2_candidate", 2), { beforeFen: INITIAL_FEN, moveUci: "e2e4", afterFen })).toThrow();
      expect(source).not.toHaveBeenCalled();
    } finally { source.mockRestore(); }
  });

  it.each([false, true])("keeps complete selected facts alongside an exact unrelated failure (mirrored=%s)", mirrored => {
    const fen = "k7/8/8/8/8/1p6/PP6/R6K w - - 0 1", move = "a2b3";
    const receipt = eventsReceipt(mirrored ? mirrorSemanticFen(fen, "color_and_vertical") : fen);
    const moveUci = mirrored ? mirrorSemanticUci(move, "color_and_vertical") : move;
    const result = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate", 3), { receipt, moveUci });
    expect(result.population).toEqual({ legalAlternatives: 11 });
    expect(result.coverage.sources).toEqual(SEMANTIC_SELECTION_PROJECTION_REFS);
    expect(result.coverage.sources).toHaveLength(55);
    expect(result.coverage.unavailable).toEqual([{
      projection: ref("derived.tactic.defender_exposure", 2),
      cause: { kind: "candidate_collector", projection: ref("derived.tactic.defender_exposure", 2) },
      reason: "invalid_turn_clone", members: [{ kind: "child", moveUci }],
    }]);
    expect(result.selected.length).toBeGreaterThan(0);
    expect(result.selected.length).toBeLessThanOrEqual(2);
    expect(result.emptyReason).toBeUndefined();
    expect(result.selected.every(fact => fact.event.projection.id !== "derived.tactic.defender_exposure")).toBe(true);
    expect(Object.isFrozen(result.coverage.unavailable[0]!.members)).toBe(true);
    expect(() => assertEvidenceSelectionResult(PRIMARY_EVIDENCE_MANIFEST, { ...result, coverage: { ...result.coverage, unavailable: [] } })).toThrow();
  });

  it.each([false, true])("retains required root-risk unknowns below the selection threshold (mirrored=%s)", mirrored => {
    const fen = "7k/8/8/8/8/8/8/r6K w - - 0 1";
    const receipt = eventsReceipt(mirrored ? mirrorSemanticFen(fen, "color_and_vertical") : fen);
    const moveUci = mirrored ? mirrorSemanticUci("h1h2", "color_and_vertical") : "h1h2";
    const result = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate", 3), { receipt, moveUci });
    expect(result.population).toEqual({ legalAlternatives: 1 });
    expect(result.coverage.sources).toEqual(SEMANTIC_SELECTION_PROJECTION_REFS);
    expect(result.coverage.unavailable).toEqual([
      { projection: ref("derived.semantic_avoidance.loose_piece", 2),
        cause: { kind: "required_total", projection: ref("rules.tactic.reading.mover_piece_risk") },
        reason: "invalid_turn_clone", members: [{ kind: "root" }] },
      { projection: ref("rules.tactic.event.loose_piece"),
        cause: { kind: "candidate_collector", projection: ref("rules.tactic.event.loose_piece") },
        reason: "invalid_turn_clone", members: receipt.packet.candidates.map(row => ({ kind: "child", moveUci: row.moveUci })) },
    ]);
    expect(result.selected).toEqual([]);
    expect(result.emptyReason).toEqual(ref("counterfactual_population_incomplete"));
  });

  it("retains partial coverage even with a zero fact budget", () => {
    const { declaration, manifest } = policy({ consumer: ref("research.semantic_selection", 3), maxFacts: 0 });
    const receipt = eventsReceipt("k7/8/8/8/8/1p6/PP6/R6K w - - 0 1");
    const result = selectSemanticEvidence(manifest, declaration, { receipt, moveUci: "a2b3" });
    expect(result.selected).toEqual([]);
    expect(result.emptyReason).toEqual(ref("budget_zero"));
    expect(result.coverage.sources).toHaveLength(55);
    expect(result.coverage.unavailable).toHaveLength(1);
  });

  it("retires the former callable selector and consumer instead of aliasing them", () => {
    expect(PRIMARY_EVIDENCE_MANIFEST.consumers.some(consumer => consumer.id === "research.semantic_selection" && consumer.version === 2)).toBe(false);
    expect(() => selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate", 2), { receipt: eventsReceipt(INITIAL_FEN), moveUci: "e2e4" })).toThrow();
  });
});
