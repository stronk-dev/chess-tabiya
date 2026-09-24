import { normalizeMove } from "chessops/chess";
import { INITIAL_FEN } from "chessops/fen";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { EVIDENCE_CONTRACT_DECLARATIONS, PRIMARY_EVIDENCE_MANIFEST, SEMANTIC_EVENT_DECLARATIONS } from "./evidence-catalog.js";
import { compileEvidenceManifest, declareEvidence, type EvidenceSelectionPolicyDeclaration } from "./evidence-contract.js";
import { declareRunRecordEvidence } from "./evidence-source-adapters.js";
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
  tacticalSemanticEvents,
  tradeCompletedSemanticEvent,
  transitionSemanticEvents,
  type CounterfactualAbsenceOperands,
  type SemanticEvidenceEvent,
} from "./semantic-evidence.js";

const ref = (id: string) => ({ id, version: 1 } as const);

function after(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  const parsed = parseUci(uci)!;
  const move = normalizeMove(position, parsed);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return canonicalFen(position);
}

function event(fen: string, uci: string, projection = "rules.structural.event.open_file", sign: "gained" | "lost" | "preserved" = "gained"): SemanticEvidenceEvent {
  const afterFen = after(fen, uci);
  const payload = Object.freeze({ before_fen: canonicalFen(positionFromFen(fen)), move_uci: canonicalMoveUci(fen, uci), after_fen: afterFen, family: projection.split(".").at(-1), before: [], after: ["fixture"] });
  const declared = declareEvidence(ref("rules.structural"), ref(projection), payload);
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declared, anchor: { beforeFen: fen, moveUci: uci, afterFen, side: positionFromFen(fen).turn }, sign, operands: payload });
}

function ruleEvent(fen: string, uci: string, family: "castled" | "promotion" | "checkmate" | "last_of_role"): SemanticEvidenceEvent {
  const afterFen = after(fen, uci);
  const canonical = canonicalMoveUci(fen, uci);
  const payload = Object.freeze({ before_fen: canonicalFen(positionFromFen(fen)), move_uci: canonical, after_fen: afterFen, mover: "fixture", from: canonical.slice(0, 2), to: canonical.slice(2, 4), detail: family });
  const declared = declareEvidence(ref("rules.transition"), ref(`rules.transition.event.${family}`), payload);
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: declared, anchor: { beforeFen: fen, moveUci: uci, afterFen, side: positionFromFen(fen).turn }, sign: "state", operands: payload });
}

function policy(overrides: Partial<EvidenceSelectionPolicyDeclaration> = {}) {
  const declaration: EvidenceSelectionPolicyDeclaration = { id: "test.selection", version: 1, consumer: ref("research.semantic_selection"), disposition: "experimental", minimumAlternatives: 8, maximumSameFamilyShare: 0.2, minimumAlternativeOnlyShare: 0.3, maxFacts: 2, criticalEvents: [], ...overrides };
  return { declaration, manifest: compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS, selectionPolicies: [...EVIDENCE_CONTRACT_DECLARATIONS.selectionPolicies!, declaration] }) };
}

const CHECK_FEN = "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1";
const RECEIPTS = new Map<string, CandidatePopulationReceipt>();

function eventsReceipt(fen: string): CandidatePopulationReceipt {
  const cached = RECEIPTS.get(fen);
  if (cached !== undefined) return cached;
  const compiled = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
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
  const families = new Set(candidatePlayedRow(receipt, moveUci).events.filter((event) => eligibleFor(event, consumer)).map(familyOf));
  return new Map([...families].map((family) => [family, alternatives.filter((row) => row.events.some((event) => eligibleFor(event, consumer) && familyOf(event) === family)).length / alternatives.length]));
}

/** Independent oracle: structural/loose families present only among alternatives, with their share. */
function alternativeOnlyShares(receipt: CandidatePopulationReceipt, moveUci: string, consumer: { readonly id: string; readonly version: number }): Map<string, number> {
  const alternatives = candidateAlternatives(receipt, moveUci);
  const played = new Set(candidatePlayedRow(receipt, moveUci).events.filter((event) => eligibleFor(event, consumer)).map(familyOf));
  const families = new Set(alternatives.flatMap((row) => row.events.filter((event) => eligibleFor(event, consumer) && (event.projection.id.startsWith("rules.structural.event.") || event.projection.id === "rules.tactic.event.loose_piece")).map(familyOf)));
  const shares = new Map<string, number>();
  for (const family of families) if (!played.has(family)) {
    const share = alternatives.filter((row) => row.events.some((event) => eligibleFor(event, consumer) && familyOf(event) === family)).length / alternatives.length;
    const avoidance = `derived.semantic_avoidance.${family.split(":")[0]!.replace("rules.structural.event.", "").replace("rules.tactic.event.", "")}`;
    if (PRIMARY_EVIDENCE_MANIFEST.eligibility.some((row) => row.event.id === avoidance && row.consumer.id === consumer.id && row.disposition === "eligible")) shares.set(family, share);
  }
  return shares;
}

describe("semantic evidence runtime", () => {
  it("executes one named positive and hard-negative operand fixture for every declared event", () => {
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
      const evidence = declareEvidence(projection.producer, declaration.projection, operands);
      const derivationMember = declaration.derivationAnyOf?.[0] ?? declaration.derivationInputs ?? [];
      const derivationInputs = derivationMember.map((input) => {
        const source = PRIMARY_EVIDENCE_MANIFEST.projections.find((candidate) => candidate.id === input.id && candidate.version === input.version)!;
        return declareEvidence(source.producer, input, Object.freeze({ fixture: true }));
      });
      expect(() => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence, derivationInputs, anchor, sign: declaration.allowedSigns[0]!, operands })).not.toThrow();

      const missing = Object.freeze(Object.fromEntries(Object.entries(operands).slice(1)));
      const missingEvidence = declareEvidence(projection.producer, declaration.projection, missing);
      expect(() => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: missingEvidence, derivationInputs, anchor, sign: declaration.allowedSigns[0]!, operands: missing })).toThrowError(expect.objectContaining({ code: "EVIDENCE_EVENT_OPERAND_MISSING" }));

      // v1 fixture labels are byte-unchanged; recorded-path v2 successors carry their exact version.
      const label = declaration.projection.version === 1 ? declaration.projection.id : `${declaration.projection.id}@${declaration.projection.version}`;
      expectedFixtureIds.add(`semantic-event:${label}:positive`);
      expectedFixtureIds.add(`semantic-event:${label}:hard-negative`);
    }

    expect(new Set(SEMANTIC_EVENT_DECLARATIONS.flatMap((declaration) => [...declaration.validation.positives, ...declaration.validation.hardNegatives]))).toEqual(expectedFixtureIds);
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
    const fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
    const receipt = eventsReceipt(fen);
    const result = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate"), { receipt, moveUci: "e1h1" });
    const castled = result.selected.find((item) => item.event.projection.id === "rules.transition.event.castled");
    expect(castled?.kind).toBe("played_event");
    expect(castled?.event.valence).toBeUndefined();
    expect(result.population).toEqual({ legalAlternatives: receipt.packet.candidates.length - 1, evaluatedAlternatives: receipt.packet.candidates.length - 1 });
    for (const item of result.selected) if (item.kind === "played_event") expect(assertCandidatePacketEvent(receipt, item.event).moveUci).toBe("e1h1");
    expect(() => assertEvidenceSelectionResult(PRIMARY_EVIDENCE_MANIFEST, result)).not.toThrow();
    expect(() => assertEvidenceSelectionResult(PRIMARY_EVIDENCE_MANIFEST, { ...result })).toThrowError(expect.objectContaining({ code: "EVIDENCE_GENERIC_BYPASS" }));
    expect(() => assertEvidenceSelectionResult(PRIMARY_EVIDENCE_MANIFEST, { ...result, consumer: ref("inspector.position_structure") })).toThrowError(expect.objectContaining({ code: "EVIDENCE_GENERIC_BYPASS" }));
  });

  it("emits identity-preserving structural relations while leaving raw readings independent", () => {
    const afterFen = after(INITIAL_FEN, "e2e4");
    const values = structuralSemanticEvents(INITIAL_FEN, "e2e4", afterFen);
    expect(values.length).toBeGreaterThan(0);
    expect(values.every((value) => value.anchor.moveUci === "e2e4" && value.operands.before_fen === value.anchor.beforeFen && value.operands.after_fen === value.anchor.afterFen)).toBe(true);
    expect(values.filter((value) => value.operands.family === "piece_count")).toHaveLength(12);
    expect(values.some((value) => value.sign !== "preserved")).toBe(true);
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
    expect(islandEvents.find((value) => value.operands.color === "white")).toMatchObject({
      projection: { id: "rules.structural.event.pawn_islands" },
      operands: { before: 2, after: 2 },
      sign: "preserved",
    });

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
    const firstMove = declareRunRecordEvidence("move", { context: { nodeId: "n1" }, offset: 1, moveSan: "exd5" });
    const secondMove = declareRunRecordEvidence("move", { context: { nodeId: "n2" }, offset: 2, moveSan: "exd5" });
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
      const specialTrade = tradeCompletedSemanticEvent(openingCapture, recapture, firstMove, secondMove);
      expect(openingCapture.operands).toMatchObject({ family: "capture", enPassant: fixture.enPassant });
      expect(specialTrade).toMatchObject({ operands: { landingSquare: fixture.first.slice(2, 4), firstMoveUci: fixture.first, secondMoveUci: fixture.second } });
    }
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
    const result = selectLocalSemanticEvidence(ref("research.r2_candidate"), { beforeFen: INITIAL_FEN, moveUci: "e2e4", afterFen });
    expect(result.population.evaluatedAlternatives).toBe(result.population.legalAlternatives);
    expect(result.population.legalAlternatives).toBe(19);
    expect(result.selected.length).toBeLessThanOrEqual(2);
    expect(() => assertEvidenceSelectionResult(PRIMARY_EVIDENCE_MANIFEST, result)).not.toThrow();
  });

  it("applies played-family thresholds at the packet's measured share and orders deterministically", () => {
    const receipt = eventsReceipt(INITIAL_FEN);
    const research = ref("research.semantic_selection");
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
    const projected = projectCandidatePopulationReceipt(wide.receipt, CANDIDATE_EVENTS_SCOPE);
    if (projected.kind !== "ready") throw new Error("wide packet did not project");
    const again = selectSemanticEvidence(at.manifest, ref(at.declaration.id), { receipt: projected.receipt, moveUci: "e2e4" });
    expect(again.selected.map((item) => item.event.id)).toEqual(selectedAt.selected.map((item) => item.event.id));
    expect(again.rejected).toEqual(selectedAt.rejected);
  });

  it("keeps eligibility consumer-specific and refuses to turn a signed event into valence", () => {
    const configured = policy({ consumer: ref("inspector.position_structure"), criticalEvents: [] });
    const receipt = eventsReceipt(INITIAL_FEN);
    const result = selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { receipt, moveUci: "e2e4" });
    expect(result.selected).toEqual([]);
    expect(result.emptyReason?.id).toBe("no_eligible_events");
    expect(candidatePlayedRow(receipt, "e2e4").events.every((event) => event.valence === undefined)).toBe(true);
  });

  it("covers every threshold and cap in the declared selector sensitivity grid against the packet's own counts", () => {
    const receipt = eventsReceipt(INITIAL_FEN);
    const research = ref("research.semantic_selection");
    const played = playedFamilyShares(receipt, "e2e4", research);
    const alternativeOnly = alternativeOnlyShares(receipt, "e2e4", research);
    for (const maximumSameFamilyShare of [0.1, 0.2, 0.3]) {
      const configured = policy({ maximumSameFamilyShare, maxFacts: 50, minimumAlternativeOnlyShare: null });
      const result = selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { receipt, moveUci: "e2e4" });
      const expected = [...played].filter(([, share]) => share <= maximumSameFamilyShare).map(([family]) => family).sort();
      expect([...new Set(result.selected.filter((item) => item.kind === "played_event").map((item) => familyOf(item.event)))].sort()).toEqual(expected);
    }
    for (const minimumAlternativeOnlyShare of [null, 0.2, 0.3, 0.4] as const) {
      const configured = policy({ minimumAlternativeOnlyShare, maximumSameFamilyShare: 0, maxFacts: 50 });
      const result = selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { receipt, moveUci: "e2e4" });
      const expected = minimumAlternativeOnlyShare === null ? [] : [...alternativeOnly].filter(([, share]) => share >= minimumAlternativeOnlyShare).map(([family]) => family).sort();
      const absences = result.selected.flatMap((item) => item.kind === "counterfactual_absence" ? [`${item.event.operands.family.projection.id}:${item.event.operands.family.sign}`] : []);
      expect(absences.sort()).toEqual(expected);
    }
    expect(alternativeOnly.size).toBeGreaterThan(0);
    for (const maxFacts of [1, 2, 3]) {
      const configured = policy({ maxFacts, maximumSameFamilyShare: 1, minimumAlternativeOnlyShare: null });
      const result = selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { receipt, moveUci: "e2e4" });
      expect(result.selected).toHaveLength(maxFacts);
    }
  });

  it("constructs avoided only from the packet's complete retained numerator and denominator", () => {
    const receipt = eventsReceipt(INITIAL_FEN);
    const result = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate"), { receipt, moveUci: "e2e4" });
    const avoided = result.selected.find((item) => item.kind === "counterfactual_absence");
    expect(avoided?.kind).toBe("counterfactual_absence");
    if (avoided?.kind !== "counterfactual_absence") return;
    const operands = avoided.event.operands;
    const withFamily = candidateAlternatives(receipt, "e2e4").filter((row) => row.events.some((event) => familyOf(event) === `${operands.family.projection.id}:${operands.family.sign}`));
    expect(operands).toMatchObject({ relation: "avoided", legalAlternatives: 19, alternativesWithFamily: withFamily.length });
    expect(operands.alternativeEvents).toHaveLength(withFamily.length);
    for (const event of operands.alternativeEvents) expect(assertCandidatePacketEvent(receipt, event).moveUci).toBe(event.anchor.moveUci);
    expect(avoided.event.derivationInputs).toHaveLength(withFamily.length);
    expect(avoided.event.valence).toBeUndefined();
  });

  it("constructs loose-piece avoidance through the same complete-population path", () => {
    const fen = "r2q1rk1/pp2bppp/2n1bn2/2pp4/3P4/2N1PN2/PP2BPPP/R1BQ1RK1 w - - 0 10";
    const receipt = eventsReceipt(fen);
    const loose = candidateAlternatives(receipt, "a2a3").filter((row) => row.events.some((event) => event.projection.id === "rules.tactic.event.loose_piece" && event.sign === "gained"));
    expect(candidatePlayedRow(receipt, "a2a3").events.some((event) => event.projection.id === "rules.tactic.event.loose_piece" && event.sign === "gained")).toBe(false);
    expect(loose.length).toBeGreaterThan(0);
    const configured = policy({ minimumAlternativeOnlyShare: loose.length / 33, maxFacts: 50 });
    const result = selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { receipt, moveUci: "a2a3" });
    const avoided = result.selected.find((item) => item.kind === "counterfactual_absence" && item.event.projection.id === "derived.semantic_avoidance.loose_piece" && (item.event.operands as CounterfactualAbsenceOperands).family.sign === "gained");
    expect(avoided?.kind).toBe("counterfactual_absence");
    if (avoided?.kind === "counterfactual_absence") expect(avoided.event.operands).toMatchObject({ legalAlternatives: 33, alternativesWithFamily: loose.length, relation: "avoided" });
  });

  it("makes every selection reason reachable, including a non-empty critical budget exhaustion", () => {
    const receipt = eventsReceipt(INITIAL_FEN);
    const run = (configured: ReturnType<typeof policy>, target = receipt, moveUci = "e2e4") => selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { receipt: target, moveUci });
    expect(run(policy({ consumer: ref("inspector.position_structure"), criticalEvents: [] })).emptyReason?.id).toBe("no_eligible_events");
    expect(run(policy({ minimumAlternatives: 100 })).emptyReason?.id).toBe("insufficient_alternatives");
    expect(run(policy({ maximumSameFamilyShare: 0, minimumAlternativeOnlyShare: null })).emptyReason?.id).toBe("nothing_distinctive");
    expect(run(policy({ maxFacts: 0 })).emptyReason?.id).toBe("budget_zero");
    const check = eventsReceipt(CHECK_FEN);
    const incomplete = run(policy(), check, check.packet.candidates[0]!.moveUci);
    expect(incomplete.emptyReason?.id).toBe("counterfactual_population_incomplete");
    expect(incomplete.population).toEqual({ legalAlternatives: check.packet.candidates.length - 1, evaluatedAlternatives: 0 });
    const played = candidatePlayedRow(receipt, "e2e4").events.filter((event) => eligibleFor(event, ref("research.semantic_selection")));
    const critical = policy({ maxFacts: 1, criticalEvents: [...new Map(played.map((event) => [event.projection.id, ref(event.projection.id)])).values()] });
    const exhausted = run(critical);
    expect(exhausted.selected).toHaveLength(1);
    expect(exhausted.rejected.some((item) => item.reason.id === "critical_budget_exhausted")).toBe(true);
  });

  it("refuses a raw packet, a readings-only packet and a foreign-dialect played move at the selection boundary", () => {
    const receipt = eventsReceipt(INITIAL_FEN);
    expect(() => selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate"), { receipt: { ...receipt }, moveUci: "e2e4" })).toThrow(/not minted/u);
    const readings = compileCandidatePopulation({ beforeFen: INITIAL_FEN, ruleset: "standard", scope: CANDIDATE_READINGS_SCOPE });
    if (readings.kind !== "ready") throw new Error("readings packet did not compile");
    expect(() => selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate"), { receipt: readings.receipt, moveUci: "e2e4" })).toThrow(/retains events/u);
    const castle = eventsReceipt("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    expect(() => selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate"), { receipt: castle, moveUci: "e1g1" })).toThrowError(expect.objectContaining({ code: "move_not_in_packet", convention: "chessops-king-takes-rook@1" }));
  });
});
