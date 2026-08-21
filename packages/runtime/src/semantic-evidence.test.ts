import { normalizeMove } from "chessops/chess";
import { INITIAL_FEN } from "chessops/fen";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { EVIDENCE_CONTRACT_DECLARATIONS, PRIMARY_EVIDENCE_MANIFEST, SEMANTIC_EVENT_DECLARATIONS } from "./evidence-catalog.js";
import { compileEvidenceManifest, declareEvidence, type EvidenceSelectionPolicyDeclaration } from "./evidence-contract.js";
import {
  assertEvidenceSelectionResult,
  assertSemanticEvidenceEvent,
  canonicalMoveUci,
  compileSemanticEvidenceEvent,
  legalAlternativeEdges,
  selectSemanticEvidence,
  selectLocalSemanticEvidence,
  structuralSemanticEvents,
  transitionSemanticEvents,
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
      const derivationInputs = (declaration.derivationInputs ?? []).map((input) => {
        const source = PRIMARY_EVIDENCE_MANIFEST.projections.find((candidate) => candidate.id === input.id && candidate.version === input.version)!;
        return declareEvidence(source.producer, input, Object.freeze({ fixture: true }));
      });
      expect(() => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence, derivationInputs, anchor, sign: declaration.allowedSigns[0]!, operands })).not.toThrow();

      const missing = Object.freeze(Object.fromEntries(Object.entries(operands).slice(1)));
      const missingEvidence = declareEvidence(projection.producer, declaration.projection, missing);
      expect(() => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: missingEvidence, derivationInputs, anchor, sign: declaration.allowedSigns[0]!, operands: missing })).toThrowError(expect.objectContaining({ code: "EVIDENCE_EVENT_OPERAND_MISSING" }));

      expectedFixtureIds.add(`semantic-event:${declaration.projection.id}:positive`);
      expectedFixtureIds.add(`semantic-event:${declaration.projection.id}:hard-negative`);
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
    expect(canonicalMoveUci(fen, "e1h1")).toBe("e1g1");
    const standard = ruleEvent(fen, "e1g1", "castled");
    const imported = ruleEvent(fen, "e1h1", "castled");
    expect(imported.id).toBe(standard.id);
  });

  it("enumerates ordinary, en-passant, castling and all four promotion roles as replayable exact children", () => {
    const fixtures = [
      { fen: INITIAL_FEN, move: "e2e4", contains: "d2d4" },
      { fen: "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1", move: "e5d6", contains: "e5e6" },
      { fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", move: "e1g1", contains: "e1c1" },
      { fen: "4k3/P7/8/8/8/8/8/4K3 w - - 0 1", move: "a7a8q", contains: "a7a8n" },
    ];
    for (const fixture of fixtures) {
      const alternatives = legalAlternativeEdges(fixture.fen, fixture.move);
      expect(alternatives.some((edge) => edge.moveUci === fixture.contains)).toBe(true);
      for (const edge of alternatives) expect(after(edge.beforeFen, edge.moveUci)).toBe(edge.afterFen);
    }
    expect(legalAlternativeEdges(fixtures[3]!.fen, "e1e2").filter((edge) => edge.moveUci.startsWith("a7a8")).map((edge) => edge.moveUci)).toEqual(["a7a8b", "a7a8n", "a7a8q", "a7a8r"]);
  });

  it("selects a critical exact event without granting valence and seals the result", () => {
    const fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
    const played = ruleEvent(fen, "e1g1", "castled");
    const result = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, ref("research.r2_candidate"), { beforeFen: fen, moveUci: "e1g1", afterFen: after(fen, "e1g1"), playedEvents: [played], evaluateAlternative: () => [] });
    expect(result.selected).toHaveLength(1);
    expect(result.selected[0]?.kind).toBe("played_event");
    expect(result.selected[0]?.event.valence).toBeUndefined();
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

  it("applies played-family thresholds and deterministic order without operand-coordinate denominator tricks", () => {
    const configured = policy();
    const afterFen = after(INITIAL_FEN, "e2e4");
    const played = [event(INITIAL_FEN, "e2e4", "rules.structural.event.open_file"), event(INITIAL_FEN, "e2e4", "rules.structural.event.piece_count")];
    const supportingMoves = new Set(legalAlternativeEdges(INITIAL_FEN, "e2e4").slice(0, 3).map((edge) => edge.moveUci));
    const eventsFor = (edge: { readonly beforeFen: string; readonly moveUci: string }) => supportingMoves.has(edge.moveUci) ? [event(edge.beforeFen, edge.moveUci, "rules.structural.event.open_file"), event(edge.beforeFen, edge.moveUci, "rules.structural.event.piece_count")] : [];
    const first = selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { beforeFen: INITIAL_FEN, moveUci: "e2e4", afterFen, playedEvents: played, evaluateAlternative: eventsFor });
    const second = selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { beforeFen: INITIAL_FEN, moveUci: "e2e4", afterFen, playedEvents: [...played].reverse(), evaluateAlternative: (edge) => [...eventsFor(edge)].reverse() });
    expect(first.selected.map((item) => item.event.id)).toEqual(second.selected.map((item) => item.event.id));
    expect(first.rejected).toEqual(second.rejected);
    expect(first.selected.find((item) => item.event.projection.id.endsWith("open_file"))?.kind).toBe("played_event");
    expect((first.selected.find((item) => item.event.projection.id.endsWith("open_file")) as { sameFamilyShare: number }).sameFamilyShare).toBeCloseTo(3 / 19);
  });

  it("keeps eligibility consumer-specific and refuses to turn a signed event into valence", () => {
    const configured = policy({ consumer: ref("inspector.position_structure"), criticalEvents: [] });
    const played = event(INITIAL_FEN, "e2e4");
    const result = selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { beforeFen: INITIAL_FEN, moveUci: "e2e4", afterFen: after(INITIAL_FEN, "e2e4"), playedEvents: [played], evaluateAlternative: () => [] });
    expect(result.selected).toEqual([]);
    expect(result.emptyReason?.id).toBe("no_eligible_events");
    expect(played.valence).toBeUndefined();
  });

  it("covers every threshold and cap in the declared selector sensitivity grid", () => {
    const afterFen = after(INITIAL_FEN, "e2e4");
    const families = ["rules.structural.event.open_file", "rules.structural.event.piece_count", "rules.structural.event.half_open_file"] as const;
    for (const maximumSameFamilyShare of [0.1, 0.2, 0.3]) {
      const configured = policy({ maximumSameFamilyShare, maxFacts: 3 });
      const support = Math.floor(maximumSameFamilyShare * 19);
      let index = 0;
      const result = selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { beforeFen: INITIAL_FEN, moveUci: "e2e4", afterFen, playedEvents: [event(INITIAL_FEN, "e2e4")], evaluateAlternative: (edge) => index++ < support ? [event(edge.beforeFen, edge.moveUci)] : [] });
      expect(result.selected.some((item) => item.kind === "played_event")).toBe(true);
    }
    for (const minimumAlternativeOnlyShare of [null, 0.2, 0.3, 0.4] as const) {
      const configured = policy({ minimumAlternativeOnlyShare, maxFacts: 3 });
      let index = 0;
      const support = minimumAlternativeOnlyShare === null ? 19 : Math.ceil(minimumAlternativeOnlyShare * 19);
      const result = selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { beforeFen: INITIAL_FEN, moveUci: "e2e4", afterFen, playedEvents: [], evaluateAlternative: (edge) => index++ < support ? [event(edge.beforeFen, edge.moveUci)] : [] });
      expect(result.selected.some((item) => item.kind === "counterfactual_absence")).toBe(minimumAlternativeOnlyShare !== null);
    }
    for (const maxFacts of [1, 2, 3]) {
      const configured = policy({ maxFacts });
      const result = selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { beforeFen: INITIAL_FEN, moveUci: "e2e4", afterFen, playedEvents: families.map((family) => event(INITIAL_FEN, "e2e4", family)), evaluateAlternative: () => [] });
      expect(result.selected).toHaveLength(maxFacts);
    }
  });

  it("constructs avoided only from a complete retained numerator and denominator", () => {
    const configured = policy();
    const afterFen = after(INITIAL_FEN, "e2e4");
    let index = 0;
    const result = selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { beforeFen: INITIAL_FEN, moveUci: "e2e4", afterFen, playedEvents: [], evaluateAlternative: (edge) => index++ < 6 ? [event(edge.beforeFen, edge.moveUci, "rules.structural.event.open_file")] : [] });
    const avoided = result.selected.find((item) => item.kind === "counterfactual_absence");
    expect(avoided?.kind).toBe("counterfactual_absence");
    if (avoided?.kind !== "counterfactual_absence") return;
    expect(avoided.event.operands).toMatchObject({ relation: "avoided", legalAlternatives: 19, alternativesWithFamily: 6 });
    expect(avoided.event.operands.alternativeEvents).toHaveLength(6);
    expect(avoided.event.derivationInputs).toHaveLength(6);
    expect(avoided.event.valence).toBeUndefined();
  });

  it("makes every selection reason reachable, including a non-empty critical budget exhaustion", () => {
    const afterFen = after(INITIAL_FEN, "e2e4");
    const run = (configured: ReturnType<typeof policy>, playedEvents: readonly SemanticEvidenceEvent[], evaluateAlternative: Parameters<typeof selectSemanticEvidence>[2]["evaluateAlternative"]) => selectSemanticEvidence(configured.manifest, ref(configured.declaration.id), { beforeFen: INITIAL_FEN, moveUci: "e2e4", afterFen, playedEvents, evaluateAlternative });
    expect(run(policy(), [], () => []).emptyReason?.id).toBe("no_eligible_events");
    expect(run(policy({ minimumAlternatives: 100 }), [event(INITIAL_FEN, "e2e4")], () => []).emptyReason?.id).toBe("insufficient_alternatives");
    expect(run(policy(), [event(INITIAL_FEN, "e2e4")], (edge) => [event(edge.beforeFen, edge.moveUci)]).emptyReason?.id).toBe("nothing_distinctive");
    expect(run(policy({ maxFacts: 0 }), [event(INITIAL_FEN, "e2e4")], () => []).emptyReason?.id).toBe("budget_zero");
    expect(run(policy(), [event(INITIAL_FEN, "e2e4")], () => undefined).emptyReason?.id).toBe("counterfactual_population_incomplete");
    const critical = policy({ maxFacts: 2, criticalEvents: [ref("rules.structural.event.open_file"), ref("rules.structural.event.piece_count"), ref("rules.structural.event.half_open_file")] });
    const exhausted = run(critical, [event(INITIAL_FEN, "e2e4", "rules.structural.event.open_file"), event(INITIAL_FEN, "e2e4", "rules.structural.event.piece_count"), event(INITIAL_FEN, "e2e4", "rules.structural.event.half_open_file")], () => []);
    expect(exhausted.selected).toHaveLength(2);
    expect(exhausted.rejected.some((item) => item.reason.id === "critical_budget_exhausted")).toBe(true);
  });
});
