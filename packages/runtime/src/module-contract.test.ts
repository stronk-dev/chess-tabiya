import { describe, expect, it } from "vitest";

import {
  MODULE_IDS,
  MODULE_TIMING_IMAGE,
  ModuleContractError,
  compileModuleRegistry,
  type ModuleDeclaration,
  type ModuleId,
  type ModuleTiming,
} from "./module-contract.js";

const evidenceRef = Object.freeze({ id: "rules.phase.reading", version: 1 });
const policyRef = Object.freeze({ id: "production.module_local", version: 1 });

function timing(id: ModuleId): ModuleTiming {
  if (id === "blunder_prevention") return "at_commit";
  if (id === "guided_hint" || id === "compare_coach") return "checkpoint";
  if (id === "review_map" || id === "full_inspector") return "review";
  if (id === "rules_floor" || id === "sight_on_request" || id === "threat_radar") return "pre_commit";
  return "post_commit";
}

function declaration(id: ModuleId): ModuleDeclaration {
  const moduleTiming = timing(id);
  const accepts = id === "rules_floor"
    ? { kind: "none" as const, awaiting: Object.freeze([]) }
    : { kind: "manifest" as const, projections: Object.freeze([{ projection: evidenceRef }]), awaiting: Object.freeze([]) };
  return Object.freeze({
    id,
    intent: `Intent for ${id}`,
    learnerAction: `Action for ${id}`,
    accepts,
    timings: Object.freeze([{ timing: moduleTiming, initiative: id === "rules_floor" ? "ambient" as const : id === "full_inspector" ? "explicit_mode" as const : "on_request" as const }]),
    answerCeiling: id === "rules_floor"
      ? Object.freeze({ ceiling: "none" as const })
      : id === "guided_hint"
        ? Object.freeze({ ceiling: "principal_variation" as const, stages: Object.freeze([{ stage: 1 as const, ceiling: "pattern" as const }, { stage: 2 as const, ceiling: "fact" as const }, { stage: 3 as const, ceiling: "principal_variation" as const }]) })
        : Object.freeze({ ceiling: "fact" as const }),
    ceilings: Object.freeze({ disclosure: MODULE_TIMING_IMAGE[moduleTiming], sessions: Object.freeze(["pack"]), roles: Object.freeze(["learner" as const]), visibleBoardParity: true as const }),
    budgets: Object.freeze({ maxFacts: id === "rules_floor" ? 0 : 1, maxWords: id === "rules_floor" ? 0 : 20, maxMarks: id === "rules_floor" ? null : 1, maxArrows: 0 }),
    selection: Object.freeze({ policy: policyRef, familyPrecedence: id === "rules_floor" ? Object.freeze([]) : Object.freeze([evidenceRef]) }),
    emptyBehavior: id === "blunder_prevention" ? Object.freeze({ kind: "silent" as const }) : Object.freeze({ kind: "stated_absence" as const, sentence: "No admitted evidence." }),
    seatClass: id === "rules_floor" ? "board_input" as const : id === "blunder_prevention" ? "board_adjacent" as const : id === "review_map" ? "timeline" as const : id === "full_inspector" ? "explicit_surface" as const : "rail" as const,
    forms: Object.freeze([id === "rules_floor" ? "square" as const : "sentence" as const]),
    rendering: "deterministic" as const,
  });
}

function valid(): readonly ModuleDeclaration[] {
  return MODULE_IDS.map(declaration);
}

function closure() {
  return {
    projections: [evidenceRef],
    consumers: MODULE_IDS.filter((id) => id !== "rules_floor").map((id) => ({ consumer: { id: `module.${id}`, version: 1 }, accepts: [evidenceRef] })),
  } as const;
}

describe("learner module contract compiler", () => {
  it("compiles the closed eleven and pins at_commit as a distinct evidence timing", () => {
    const compiled = compileModuleRegistry(valid(), closure());
    expect(compiled.modules.map((module) => module.id)).toEqual(MODULE_IDS);
    expect(MODULE_TIMING_IMAGE.at_commit).toEqual(["at_commit"]);
    expect(compiled.modules.filter((module) => module.seatClass === "board_adjacent").map((module) => module.id)).toEqual(["blunder_prevention"]);
  });

  it("rejects incomplete registries and a second board-adjacent cue", () => {
    expect(() => compileModuleRegistry(valid().slice(1))).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_REGISTRY_INCOMPLETE" }));
    const changed = valid().map((module) => module.id === "threat_radar" ? { ...module, seatClass: "board_adjacent" as const } : module);
    expect(() => compileModuleRegistry(changed)).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_BOARD_ADJACENT_COUNT" }));
  });

  it("rejects avoidance without a denominator or at a pre-commit timing", () => {
    const changed = valid().map((module) => module.id === "sight_on_request" ? {
      ...module,
      accepts: { kind: "manifest" as const, projections: [{ projection: { id: "derived.semantic_avoidance.loose_piece", version: 1 } }], awaiting: [] },
      selection: { ...module.selection, familyPrecedence: [{ id: "derived.semantic_avoidance.loose_piece", version: 1 }] },
    } : module);
    expect(() => compileModuleRegistry(changed)).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_AVOIDANCE_TIMING" }));
  });

  it("rejects an awaiting projection that already exists and a mismatched consumer", () => {
    const awaiting = valid().map((module) => module.id === "threat_radar" && module.accepts.kind === "manifest" ? { ...module, accepts: { ...module.accepts, awaiting: [evidenceRef] } } : module);
    expect(() => compileModuleRegistry(awaiting, closure())).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_EVIDENCE_UNRESOLVED" }));
    const missing = { ...closure(), consumers: closure().consumers.filter((value) => value.consumer.id !== "module.threat_radar") };
    expect(() => compileModuleRegistry(valid(), missing)).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_CONSUMER_MISMATCH" }));
  });

  it("rejects a progressive stage that widens beyond the module ceiling", () => {
    const changed = valid().map((module) => module.id === "guided_hint" ? { ...module, answerCeiling: { ceiling: "fact" as const, stages: [{ stage: 1 as const, ceiling: "pattern" as const }, { stage: 2 as const, ceiling: "fact" as const }, { stage: 3 as const, ceiling: "principal_variation" as const }] } } : module);
    expect(() => compileModuleRegistry(changed)).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_STAGE_INVALID" }));
  });
});
