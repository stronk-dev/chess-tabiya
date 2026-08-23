import { describe, expect, it } from "vitest";

import {
  compileEvidenceManifest,
  declareEvidence,
  evidenceForConsumer,
  type CompiledEvidenceManifest,
  type ProjectionDeclaration,
} from "./evidence-contract.js";
import { MODULE_TIMING_IMAGE, type ModuleDeclaration } from "./module-contract.js";
import {
  ArrayReductionQualityRecorder,
  applyBackstop,
  applyDeclaredSubsumption,
  applyPositionNovelty,
  dedupeByFactIdentity,
  factIdentity,
  moduleFact,
  reduceModulePacket,
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
    intent: "Name grounded consequences.",
    learnerAction: "Branch from this move.",
    accepts: { kind: "manifest" as const, projections, awaiting: [] },
    timings: [{ timing: "post_commit", initiative: "proactive" }],
    answerCeiling: { ceiling: "fact" },
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

});
