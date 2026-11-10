import { describe, expect, it } from "vitest";
import { orderModuleFactsByBaseKeys } from "./internal/module-fact-comparison.js";

import {
  compileEvidenceManifest,
  declareEvidence as declareWithAuthority,
  evidenceForConsumer,
  identitySealedEvidenceWithoutValueReceipt,
  type CompiledEvidenceManifest,
  type ProjectionDeclaration,
} from "./evidence-contract.js";
import { MODULE_TIMING_IMAGE, POSTCOMMIT_OBSERVED_WINDOW_POLICY, STRUCTURE_RECOGNITION_POLICY, STRUCTURE_SELECTION_GROUPS, type ModuleDeclaration } from "./module-contract.js";
import { MODULE_REGISTRY } from "./module-registry.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";

// Test-only compiler fixture for the reducer's synthetic manifest (value authority §1).
const declareEvidence = <T>(producer: { id: string; version: number }, projection: { id: string; version: number }, payload: T) =>
  declareWithAuthority(producer, projection, payload, { factory: "test:module-reducers-fixture", inputDigest: "0".repeat(64), sourceDigests: [] });
import {
  ArrayReductionQualityRecorder,
  applyBackstop,
  applyDeclaredSubsumption,
  applyPositionNovelty,
  dedupeByFactIdentity,
  factIdentity,
  moduleFact,
  reduceModulePacket,
  orderAdmittedFacts,
  FACT_EQUIVALENCE_CLASSES,
  POSTCOMMIT_OBSERVED_WINDOW_REFS,
  type ModuleFact,
} from "./module-reducers.js";

const producer = Object.freeze({ id: "fixture.producer", version: 1 });
const consumer = Object.freeze({ id: "module.postcommit_nudge", version: 1 });

function projection(id: string, exactness: ProjectionDeclaration["exactness"] = "exact"): ProjectionDeclaration {
  return Object.freeze({
    id,
    version: 1,
    producer,
    role: id.includes("event") ? "event" : "reading",
    plane: "rules",
    payloadType: "FixturePayload",
    semantics: `${id} fixture`,
    operands: Object.freeze(["color", "file", "nodeId", "moverColor", "square", "denominator"]),
    signs: Object.freeze(["state"] as const),
    grounding: "position_rules",
    exactness,
    confidence: "exact",
    abstention: Object.freeze({ possible: false, reasons: Object.freeze([]) }),
    answerContent: Object.freeze(["fact"] as const),
    forms: Object.freeze(["sentence"] as const),
    dependsOn: Object.freeze([]),
    limitations: Object.freeze([]),
  });
}

function manifest(ids: readonly string[]): CompiledEvidenceManifest {
  const outputs = ids.map((id) => projection(id));
  const accepts = outputs.map((value) => ({ id: value.id, version: 1 }));
  return compileEvidenceManifest({
    producers: [{ id: producer.id, version: 1, plane: "rules", implementation: "fixture", availability: "local", latency: "sync", outputs }],
    consumers: [{ id: consumer.id, version: 1, implementation: "fixture", accepts, timing: ["postcommit"], roles: ["learner"], sessions: ["pack"], forms: ["sentence"], answerContent: ["fact"], latency: { mode: "sync", maxMs: 1 }, budget: { maxFacts: 20, maxForms: 20 }, providerOff: "available" }],
    adapters: accepts.map((accepted, index) => ({ id: `fixture.adapter.${index}`, version: 1, implementation: "fixture", producer, projection: accepted, consumer, timing: ["postcommit"], roles: ["learner"], sessions: ["pack"], forms: ["sentence"], answerContent: ["fact"], latency: { mode: "sync", maxMs: 1 }, budget: { maxFacts: 20, maxForms: 20 }, providerOff: "available" })),
  });
}

function declaration(overrides: Partial<ModuleDeclaration> = {}): ModuleDeclaration {
  const acceptedIds = [
    "rules.structural.predicate.isolated_pawn",
    "rules.structural.reading.isolated_pawn",
    "rules.structural.event.isolated_pawn",
    "derived.semantic_avoidance.isolated_pawn",
    "rules.transition.event.checkmate",
    "rules.tactic.event.check",
    "rules.structural.event.passed_pawn",
  ];
  const projections = acceptedIds.map((id) => ({ projection: { id, version: 1 } }));
  const base: ModuleDeclaration = {
    id: "postcommit_nudge",
    consumer,
    intent: "Name grounded consequences.",
    learnerAction: "Branch from this move.",
    accepts: { kind: "manifest" as const, projections, awaiting: [] },
    timings: [{ timing: "post_commit", initiative: "proactive" }],
    answerCeiling: { kind: "capabilities", capabilities: ["observation"] },
    ceilings: { disclosure: MODULE_TIMING_IMAGE.post_commit, sessions: ["pack"], roles: ["learner"], visibleBoardParity: true },
    budgets: { maxFacts: 2, maxWords: 50, maxMarks: 2, maxArrows: 1 },
    selection: { policy: { id: "production.module_local", version: 1 }, familyPrecedence: projections.map((value) => value.projection) },
    emptyBehavior: { kind: "silent" },
    seatClass: "rail",
    forms: ["sentence", "card"],
    rendering: "deterministic",
    noveltyWindow: 3,
  };
  return Object.freeze({ ...base, ...overrides }) as ModuleDeclaration;
}

function fact(id: string, operands: Readonly<Record<string, unknown>>, exactness: ProjectionDeclaration["exactness"] = "exact"): ModuleFact {
  const projectionValue = projection(id, exactness);
  return {
    evidence: {} as ModuleFact["evidence"],
    projection: projectionValue,
    retainedOperands: operands,
    subjectSquare: typeof operands.square === "string" ? operands.square : null,
    eventId: typeof operands.nodeId === "string" ? operands.nodeId : null,
  };
}

describe("D4095 Structure recognition policy (comparator controls, not chess qualification)", () => {
  const current = MODULE_REGISTRY.byId.get("structure_nudge")!;
  const owned = (id: string, version = 1, exactness: ProjectionDeclaration["exactness"] = "exact", operands: Record<string, unknown> = {}) => {
    const current = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === id && row.version === version);
    if (current !== undefined) return moduleFact(PRIMARY_EVIDENCE_MANIFEST, declareEvidence(current.producer, { id, version }, operands));
    const original = { ...projection(id, exactness), version };
    return moduleFact({ ...manifest([id]), projections: [original] }, declareEvidence(producer, { id, version }, operands));
  };
  const generic = owned("rules.structural.reading.pawn_connectivity");
  const authored = owned("theory.shapes.firing", 3, "authored", { square: "c3" });
  const oldPolicy = { ...current, selection: { ...current.selection, policy: { id: "production.module_local", version: 1 } } };
  it("pins exact policy and all three recognition/four generic refs", () => {
    expect(current.consumer).toEqual({ id: "module.structure_nudge", version: 2 });
    expect(current.selection.policy).toEqual(STRUCTURE_RECOGNITION_POLICY);
    expect(STRUCTURE_SELECTION_GROUPS.recognition).toEqual(["rules.structural.reading.named_structure@2", "theory.endgame.setup_match@1", "theory.shapes.firing@3"]);
    expect(STRUCTURE_SELECTION_GROUPS.generic).toEqual(["rules.structural.reading.space@1", "rules.structural.reading.pawn_connectivity@1", "rules.phase.reading@2", "rules.endgame.classification@1"]);
  });
  it("prefers genuine recognition without promoting source risk or changing critical precedence", () => {
    expect(orderAdmittedFacts(oldPolicy, [authored, generic])).toEqual([generic, authored]);
    expect(orderAdmittedFacts(current, [generic, authored])).toEqual([authored, generic]);
    expect(authored.projection.exactness).toBe("authored");
    for (const kind of ["checkmate", "promotion", "castled", "last_of_role"]) {
      const critical = owned(`rules.transition.event.${kind}`);
      expect(orderAdmittedFacts(current, [authored, critical, generic])[0]).toBe(critical);
    }
  });
  it("keeps within-group exactness, measured lift and deterministic ties", () => {
    const named = owned("rules.structural.reading.named_structure", 2, "convention", { square: "e4" });
    const setup = owned("theory.endgame.setup_match", 1, "convention", { square: "b7" });
    const phase = owned("rules.phase.reading", 2, "convention");
    for (const values of [[authored, setup, named], [phase, generic]]) {
      expect(orderAdmittedFacts(current, values)).toEqual(orderAdmittedFacts(oldPolicy, values));
      const lifts = [{ projectionId: values[1]!.projection.id, lift: 9, source: "Comparator fixture only", measuredAt: "2026-11-05", corpus: "synthetic" }];
      expect(orderAdmittedFacts(current, values, lifts)).toEqual(orderAdmittedFacts(oldPolicy, values, lifts));
    }
  });
  it("refuses copied summaries, relabelled projections and forged source exactness", () => {
    for (const copied of [
      { ...generic },
      { ...generic, projection: authored.projection },
      { ...authored, projection: { ...authored.projection, exactness: "exact" as const } },
      { ...generic, retainedOperands: { id: "lucena", type: "recognition" } },
    ]) expect(() => orderAdmittedFacts(current, [copied, authored])).toThrow(/MODULE_FACT_UNOWNED/u);
  });
  it("keeps old ref versions, other modules and crossed consumer/policy guards unboosted", () => {
    for (const old of [owned("theory.shapes.firing", 2, "authored"), owned("rules.structural.reading.named_structure", 1, "convention"), owned("theory.endgame.setup_match", 2, "convention")]) {
      const declared = PRIMARY_EVIDENCE_MANIFEST.projections.includes(old.projection);
      if (declared) expect(orderAdmittedFacts(current, [old, generic])).toEqual([generic, old]);
      else expect(() => orderAdmittedFacts(current, [old, generic])).toThrow(/MODULE_FACT_DECLARATION/u);
    }
    for (const declaration of [oldPolicy,
      { ...current, consumer: { id: "module.structure_nudge", version: 1 } },
      { ...current, consumer: { id: "module.theory_breadcrumb", version: 2 } },
      { ...current, selection: { ...current.selection, policy: { ...STRUCTURE_RECOGNITION_POLICY, version: 2 } } },
      { ...current, selection: { ...current.selection, policy: { id: "production.structure_recognition_copy", version: 1 } } },
      ...MODULE_REGISTRY.modules.filter(m => m.id !== "structure_nudge").map(m => ({ ...m, selection: { ...m.selection, policy: STRUCTURE_RECOGNITION_POLICY } })),
    ]) expect(orderAdmittedFacts(declaration, [authored, generic])).toEqual([generic, authored]);
  });
});

describe("D4058 finite Nudge observed-window product ordering (comparator fixtures, not chess qualification)", () => {
  const current = MODULE_REGISTRY.byId.get("postcommit_nudge")!;
  const sequence = (ref: string): ModuleFact => {
    const [id, version] = ref.split("@");
    const value = fact(id!, { square: "c3" }, "convention");
    return { ...value, projection: { ...value.projection, version: Number(version) } };
  };
  const transition = fact("rules.transition.event.slider_ray", { square: "c3" });
  const keys = (facts: readonly ModuleFact[]) => facts.map(value => `${value.projection.id}@${value.projection.version}`);
  it("declares exactly eight current pairs with no registered duplicate-class overlap", () => {
    expect(current.consumer).toEqual({ id: "module.postcommit_nudge", version: 2 });
    expect(current.selection.policy).toEqual(POSTCOMMIT_OBSERVED_WINDOW_POLICY);
    expect(POSTCOMMIT_OBSERVED_WINDOW_REFS).toEqual([
      "derived.pawn.sequence.harassment_pressure@3", "derived.tactic.deflection_observed@3",
      "derived.tactic.attraction_observed@3", "derived.tactic.line_blocker_clearance_observed@3",
      "derived.tactic.square_clearance_observed@3", "derived.tactic.interference_observed@3",
      "derived.tactic.check_zwischenzug_observed@3", "derived.tactic.overload_exploitation_observed@3",
    ]);
    const equivalenceIds = FACT_EQUIVALENCE_CLASSES.flatMap(row => row.projections);
    expect(POSTCOMMIT_OBSERVED_WINDOW_REFS.some(ref => equivalenceIds.includes(ref.split("@")[0]!))).toBe(false);
  });
  for (const ref of POSTCOMMIT_OBSERVED_WINDOW_REFS) {
    it(`prefers a complete ${ref} to an isolated exact transition without changing its source class`, () => {
      const observed = sequence(ref), original = JSON.stringify(observed);
      expect(keys(orderModuleFactsByBaseKeys(current, [transition, observed]))).toEqual([ref, "rules.transition.event.slider_ray@1"]);
      expect(JSON.stringify(observed)).toBe(original);
      for (const id of ["checkmate", "promotion", "castled", "last_of_role"]) {
        const critical = fact(`rules.transition.event.${id}`, {});
        expect(orderModuleFactsByBaseKeys(current, [observed, critical])[0]).toBe(critical);
      }
    });
    it(`does not promote a predecessor version of ${ref}`, () => {
      const old = sequence(ref.replace("@3", "@2"));
      expect(orderModuleFactsByBaseKeys(current, [old, transition])).toEqual([transition, old]);
    });
  }
  it("does not promote other window families, unknown policy/version or wrong consumer/version", () => {
    for (const ref of ["derived.exchange.trade_completed@2", "derived.pawn.sequence.contact_timing@3", "derived.tactic.sequence.defender_consequence@3"]) {
      const other = sequence(ref);
      expect(orderModuleFactsByBaseKeys(current, [other, transition])).toEqual([transition, other]);
    }
    const observed = sequence(POSTCOMMIT_OBSERVED_WINDOW_REFS[0]!);
    for (const module of [
      { ...current, selection: { ...current.selection, policy: { ...POSTCOMMIT_OBSERVED_WINDOW_POLICY, version: 1 } } },
      { ...current, selection: { ...current.selection, policy: { id: "production.module_local", version: 1 } } },
      { ...current, consumer: { id: "module.postcommit_nudge", version: 1 } },
      { ...current, consumer: { id: "module.review_map", version: 2 } },
    ]) expect(orderModuleFactsByBaseKeys(module, [observed, transition])).toEqual([transition, observed]);
  });
  it("leaves every other actual module's old order unchanged even if given the Nudge policy", () => {
    const observed = sequence(POSTCOMMIT_OBSERVED_WINDOW_REFS[0]!);
    for (const module of MODULE_REGISTRY.byId.values()) {
      if (module.id === "postcommit_nudge") continue;
      expect(module.selection.policy).toEqual(module.id === "structure_nudge" ? STRUCTURE_RECOGNITION_POLICY : { id: "production.module_local", version: 1 });
      expect(orderModuleFactsByBaseKeys({ ...module, selection: { ...module.selection, policy: POSTCOMMIT_OBSERVED_WINDOW_POLICY } }, [observed, transition]))
        .toEqual([transition, observed]);
    }
  });
  it("keeps the exact registered duplicate representative under the new Nudge convention", () => {
    const measured = fact("rules.structural.predicate.isolated_pawn", { color: "white", file: "c" }, "measured");
    const exact = fact("rules.structural.reading.isolated_pawn", { color: "white", file: "c" }, "exact");
    expect(dedupeByFactIdentity(orderModuleFactsByBaseKeys(current, [measured, exact]))).toEqual([exact]);
  });
  it("D3767 orders only the current grade after critical/window facts and before routine changes", () => {
    const grade = sequence("derived.grade.move_quality@2"), oldGrade = sequence("derived.grade.move_quality@1");
    const critical = fact("rules.transition.event.castled", {}), window = sequence(POSTCOMMIT_OBSERVED_WINDOW_REFS[0]!);
    const trade = sequence("derived.exchange.trade_completed@2");
    expect(orderModuleFactsByBaseKeys(current, [transition, trade, grade, window, critical]).slice(0, 3)).toEqual([critical, window, grade]);
    expect(orderModuleFactsByBaseKeys(current, [oldGrade, transition])).toEqual([transition, oldGrade]);
    expect(orderModuleFactsByBaseKeys(current, [transition, grade]).slice(0, 1)).toEqual([grade]);
    expect(applyBackstop(current, [critical, window, grade], 3, false)).toEqual([critical, window]);
  });
  it("uses a transitive overload-first key within observed windows without inventing subsumption", () => {
    const values = POSTCOMMIT_OBSERVED_WINDOW_REFS.map(sequence);
    const ordered = orderModuleFactsByBaseKeys(current, values);
    expect(ordered[0]!.projection.id).toBe("derived.tactic.overload_exploitation_observed");
    expect(applyDeclaredSubsumption(ordered)).toEqual(ordered);
    for (const left of values) for (const middle of values) for (const right of values) {
      const first = orderModuleFactsByBaseKeys(current, [left, middle, right]);
      expect(keys(orderModuleFactsByBaseKeys(current, [...first].reverse()))).toEqual(keys(first));
    }
  });
});

describe("learner module semantic reducers", () => {
  it("deduplicates only registered cross-projection identities and preserves polarity", () => {
    const predicate = fact("rules.structural.predicate.isolated_pawn", { color: "white", file: "d" });
    const reading = fact("rules.structural.reading.isolated_pawn", { color: "white", file: "d" });
    expect(factIdentity(predicate)).toBe(factIdentity(reading));
    expect(dedupeByFactIdentity([predicate, reading])).toEqual([predicate]);

    const created = fact("rules.structural.event.isolated_pawn", { color: "white", file: "d", nodeId: "n1" });
    const avoided = fact("derived.semantic_avoidance.isolated_pawn", { color: "white", file: "d", nodeId: "n1", denominator: 12 });
    expect(factIdentity(created)).not.toBe(factIdentity(avoided));
    expect(dedupeByFactIdentity([created, avoided])).toEqual([created, avoided]);
  });

  it("applies directed rules subsumption without inventing strategic entailment", () => {
    const checkmate = fact("rules.transition.event.checkmate", { nodeId: "n4", moverColor: "white" });
    const check = fact("rules.tactic.event.check", { nodeId: "n4", moverColor: "white" });
    expect(applyDeclaredSubsumption([check, checkmate])).toEqual([checkmate]);
    expect(applyDeclaredSubsumption([check])).toEqual([check]);

    const passer = fact("rules.structural.event.passed_pawn", { color: "white", file: "d", nodeId: "n4" });
    const isolated = fact("rules.structural.event.isolated_pawn", { color: "white", file: "d", nodeId: "n4" });
    expect(applyDeclaredSubsumption([passer, isolated])).toEqual([passer, isolated]);
  });

  it("treats unavailable history as an abstention and pins the novelty boundary", () => {
    const anchored = fact("rules.structural.event.passed_pawn", { color: "white", file: "d", nodeId: "now" });
    const priorAnchor = fact("rules.structural.event.passed_pawn", { color: "white", file: "d", nodeId: "before" });
    const current = fact("rules.structural.reading.isolated_pawn", { color: "white", file: "d", nodeId: "now" });
    const same = fact("rules.structural.predicate.isolated_pawn", { color: "white", file: "d", nodeId: "before" });
    const module = declaration({ noveltyWindow: 3 });

    expect(applyPositionNovelty(module, [current], undefined)).toEqual({ facts: [current], abstained: true });
    expect(applyPositionNovelty(module, [current], [[], [], [same]])).toEqual({ facts: [], abstained: false });
    expect(applyPositionNovelty(module, [current], [[], [], [], [same]])).toEqual({ facts: [current], abstained: false });
    expect(applyPositionNovelty(module, [anchored], [[priorAnchor]])).toEqual({ facts: [anchored], abstained: true });
  });

  it("emits overflow after reducers and swallows recorder failure without changing bytes", () => {
    const values = [
      fact("rules.structural.event.passed_pawn", { file: "a" }),
      fact("rules.structural.event.passed_pawn", { file: "b" }),
      fact("rules.structural.event.passed_pawn", { file: "c" }),
    ];
    const module = declaration({ budgets: { maxFacts: 2, maxWords: 50, maxMarks: 2, maxArrows: 1 } });
    const recorder = new ArrayReductionQualityRecorder();
    const delivered = applyBackstop(module, values, 4, true, recorder);
    expect(delivered).toEqual(values.slice(0, 2));
    expect(recorder.observations).toEqual([{ kind: "reduction_quality@1", moduleId: "postcommit_nudge", admitted: 4, afterReducers: 3, backstop: 2, dropped: 1, reducerVersion: "module-reducers@1", noveltyAbstained: true }]);
    expect(applyBackstop(module, values, 4, true, { record(): void { throw new Error("sink unavailable"); } })).toEqual(delivered);
  });

  it("runs admission through the sealed consumer view and refuses missing avoidance denominators", () => {
    const ids = ["rules.structural.event.passed_pawn", "derived.semantic_avoidance.isolated_pawn"];
    const compiled = manifest(ids);
    const declared = ids.map((id) => declareEvidence(producer, { id, version: 1 }, id.startsWith("derived.")
      ? { color: "white", file: "d", nodeId: "n1" }
      : { color: "white", file: "e", nodeId: "n1" }));
    const view = evidenceForConsumer(compiled, consumer, declared);
    // Identity-sealed but value-unverified wrappers never reach a reducer.
    expect(() => evidenceForConsumer(compiled, consumer, [identitySealedEvidenceWithoutValueReceipt(producer, { id: ids[0]!, version: 1 }, { color: "white", file: "e", nodeId: "n1" })])).toThrow(/value-authority receipt/u);
    const module = declaration({
      accepts: { kind: "manifest", projections: [
        { projection: { id: ids[0]!, version: 1 } },
        { projection: { id: ids[1]!, version: 1 }, denominatorRequired: true },
      ], awaiting: [] },
      selection: { policy: { id: "production.module_local", version: 1 }, familyPrecedence: ids.map((id) => ({ id, version: 1 })) },
      budgets: { maxFacts: 3, maxWords: 50, maxMarks: 2, maxArrows: 1 },
      noveltyWindow: 0,
    });
    const result = reduceModulePacket(module, compiled, view, { timing: "post_commit", ancestorFacts: [] });
    expect(result.admitted).toBe(1);
    expect(result.facts.map((value) => value.projection.id)).toEqual(["rules.structural.event.passed_pawn"]);
  });

  it("[§2.3(b)] enforces the module capability union at admission without any per-entry restriction", () => {
    const ids = ["rules.structural.event.passed_pawn", "derived.grade.fixture_grade"];
    const base = manifest(ids);
    // The grade-shaped projection declares evaluation; nothing per-entry narrows the module.
    const compiled = { ...base, projections: base.projections.map((value) => value.id === ids[1] ? { ...value, answerContent: Object.freeze(["evaluation"] as const) } : value) } as CompiledEvidenceManifest;
    const declared = ids.map((id) => declareEvidence(producer, { id, version: 1 }, { color: "white", file: "e", nodeId: "n1" }));
    const view = evidenceForConsumer(compiled, consumer, declared);
    const accepts = { kind: "manifest" as const, projections: ids.map((id) => ({ projection: { id, version: 1 } })), awaiting: [] };
    const selection = { policy: { id: "production.module_local", version: 1 }, familyPrecedence: ids.map((id) => ({ id, version: 1 })) };
    const observation = declaration({ accepts, selection, noveltyWindow: 0 });
    expect(reduceModulePacket(observation, compiled, view, { timing: "post_commit" }).facts.map((value) => value.projection.id)).toEqual([ids[0]]);
    const evaluation = declaration({ accepts, selection, noveltyWindow: 0, answerCeiling: { kind: "capabilities", capabilities: ["threat", "evaluation"] } });
    expect(reduceModulePacket(evaluation, compiled, view, { timing: "post_commit" }).facts.map((value) => value.projection.id).sort()).toEqual([...ids].sort());
    const theory = declaration({ accepts, selection, noveltyWindow: 0, answerCeiling: { kind: "capabilities", capabilities: ["theory"] } });
    expect(reduceModulePacket(theory, compiled, view, { timing: "post_commit" }).facts.map((value) => value.projection.id)).toEqual([ids[0]]);
  });

  it("reads a complete-population avoidance denominator from its declared legalAlternatives operand", () => {
    const id = "derived.semantic_avoidance.isolated_pawn";
    const base = manifest([id]);
    const compiled = { ...base, projections: base.projections.map((value) => ({ ...value, operands: Object.freeze(["relation", "family", "legalAlternatives", "alternativesWithFamily", "alternativeEvents"]) })) } as CompiledEvidenceManifest;
    const module = declaration({
      accepts: { kind: "manifest", projections: [{ projection: { id, version: 1 }, denominatorRequired: true }], awaiting: [] },
      selection: { policy: { id: "production.module_local", version: 1 }, familyPrecedence: [{ id, version: 1 }] },
      noveltyWindow: 0,
    });
    const offered = (legalAlternatives: number) => evidenceForConsumer(compiled, consumer, [declareEvidence(producer, { id, version: 1 }, { relation: "avoided", family: {}, legalAlternatives, alternativesWithFamily: 0, alternativeEvents: [] })]);
    expect(reduceModulePacket(module, compiled, offered(12), { timing: "post_commit" }).admitted).toBe(1);
    expect(reduceModulePacket(module, compiled, offered(0), { timing: "post_commit" }).admitted).toBe(0);
  });

});
