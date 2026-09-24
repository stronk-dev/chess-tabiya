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
  const accepts: ModuleDeclaration["accepts"] = id === "rules_floor"
    ? { kind: "none" as const, awaiting: Object.freeze([]) }
    : id === "guided_hint"
      ? { kind: "blocked_dependencies" as const, blockers: Object.freeze([{ owner: "hint-distance", ledger: "D1639", reason: "No disclosure registry." }]), awaiting: Object.freeze([]) }
      : { kind: "manifest" as const, projections: Object.freeze([{ projection: evidenceRef }]), awaiting: Object.freeze([]) };
  return Object.freeze({
    id,
    intent: `Intent for ${id}`,
    learnerAction: `Action for ${id}`,
    accepts,
    timings: Object.freeze([{ timing: moduleTiming, initiative: id === "rules_floor" ? "ambient" as const : id === "full_inspector" ? "explicit_mode" as const : "on_request" as const }]),
    answerCeiling: id === "rules_floor"
      ? Object.freeze({ kind: "none" as const })
      : id === "guided_hint"
        ? Object.freeze({ kind: "guided_hint@1" as const })
        : Object.freeze({ kind: "capabilities" as const, capabilities: Object.freeze(["observation" as const]) }),
    ceilings: Object.freeze({ disclosure: MODULE_TIMING_IMAGE[moduleTiming], sessions: Object.freeze(["pack"]), roles: Object.freeze(["learner" as const]), visibleBoardParity: true as const }),
    budgets: Object.freeze({ maxFacts: id === "rules_floor" ? 0 : 1, maxWords: id === "rules_floor" ? 0 : 20, maxMarks: id === "rules_floor" ? null : 1, maxArrows: 0 }),
    selection: Object.freeze({ policy: policyRef, familyPrecedence: id === "rules_floor" || id === "guided_hint" ? Object.freeze([]) : Object.freeze([evidenceRef]) }),
    emptyBehavior: id === "blunder_prevention" ? Object.freeze({ kind: "silent" as const }) : Object.freeze({ kind: "stated_absence" as const, sentence: "No admitted evidence." }),
    seatClass: id === "rules_floor" ? "board_input" as const : id === "blunder_prevention" ? "board_adjacent" as const : id === "review_map" ? "timeline" as const : id === "full_inspector" ? "explicit_surface" as const : "rail" as const,
    forms: Object.freeze([id === "rules_floor" ? "square" as const : "sentence" as const]),
    rendering: "deterministic" as const,
    noveltyWindow: id === "rules_floor" || id === "blunder_prevention" ? 0 : 3,
  });
}

function valid(): readonly ModuleDeclaration[] {
  return MODULE_IDS.map(declaration);
}

function closure() {
  return {
    projections: [evidenceRef],
    consumers: MODULE_IDS.filter((id) => id !== "rules_floor" && id !== "guided_hint").map((id) => ({ consumer: { id: `module.${id}`, version: 1 }, accepts: [evidenceRef] })),
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
    const missingNovelty = valid().map((module) => module.id === "threat_radar" ? { ...module, noveltyWindow: undefined } : module) as unknown as readonly ModuleDeclaration[];
    expect(() => compileModuleRegistry(missingNovelty)).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_DECLARATION_INCOMPLETE" }));
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

  it("refuses a guided hint outside its own disclosure contract, and that contract anywhere else", () => {
    const widened = valid().map((module) => module.id === "guided_hint" ? { ...module, answerCeiling: { kind: "capabilities" as const, capabilities: ["principal_variation" as const] } } : module);
    expect(() => compileModuleRegistry(widened)).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_STAGE_INVALID" }));
    const stolen = valid().map((module) => module.id === "threat_radar" ? { ...module, answerCeiling: { kind: "guided_hint@1" as const } } : module);
    expect(() => compileModuleRegistry(stolen)).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_STAGE_INVALID" }));
    const unblocked = valid().map((module) => module.id === "guided_hint" ? { ...module, accepts: { kind: "manifest" as const, projections: [{ projection: evidenceRef }], awaiting: [] }, selection: { ...module.selection, familyPrecedence: [evidenceRef] } } : module);
    expect(() => compileModuleRegistry(unblocked)).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_DEPENDENCY_BLOCKED" }));
    const anonymous = valid().map((module) => module.id === "guided_hint" && module.accepts.kind === "blocked_dependencies" ? { ...module, accepts: { ...module.accepts, blockers: [] } } : module);
    expect(() => compileModuleRegistry(anonymous)).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_DEPENDENCY_BLOCKED" }));
    const registered = { ...closure(), consumers: [...closure().consumers, { consumer: { id: "module.guided_hint", version: 1 }, accepts: [] }] };
    expect(() => compileModuleRegistry(valid(), registered)).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_CONSUMER_MISMATCH" }));
  });

  it("keeps principal variations out of a module whose capabilities do not include one", () => {
    const changed = valid().map((module) => module.id === "compare_coach" && module.accepts.kind === "manifest" ? {
      ...module,
      accepts: { ...module.accepts, projections: [{ projection: evidenceRef, answerContent: ["principal_variation" as const] }] },
    } : module);
    expect(() => compileModuleRegistry(changed)).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_ANSWER_WIDENS" }));
  });

  it("[A4] derives each accepted answer union and refuses a widening or an unwitnessed capability", () => {
    type Answer = "fact" | "evaluation" | "theory" | "threat";
    const answers = (answerContent: readonly Answer[]) => ({ ...closure(), answerContent: [{ projection: evidenceRef, answerContent }] });
    const withCapabilities = (...capabilities: ("theory" | "evaluation" | "threat")[]) => valid().map((module) => module.answerCeiling.kind === "capabilities" ? { ...module, answerCeiling: { kind: "capabilities" as const, capabilities } } : module);
    expect(() => compileModuleRegistry(valid(), answers(["fact"]))).not.toThrow();
    // A grade (evaluation) offered to observation-only modules widens them.
    expect(() => compileModuleRegistry(valid(), answers(["evaluation"]))).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_ANSWER_WIDENS" }));
    // Theory and evaluation are incomparable branches.
    expect(() => compileModuleRegistry(withCapabilities("theory"), answers(["fact", "theory"]))).not.toThrow();
    expect(() => compileModuleRegistry(withCapabilities("theory"), answers(["fact", "evaluation"]))).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_ANSWER_WIDENS" }));
    expect(() => compileModuleRegistry(withCapabilities("evaluation"), answers(["theory"]))).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_ANSWER_WIDENS" }));
    // A declared capability that no accepted projection can exercise is an unfalsifiable permission.
    expect(() => compileModuleRegistry(withCapabilities("threat", "evaluation"), answers(["fact", "threat"]))).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_CAPABILITY_UNWITNESSED" }));
  });

  it("confines the family-partitioned empty state to Full Inspector's eight families", () => {
    const families = ["local_rules", "authored_theory", "recorded_run", "stockfish", "syzygy", "maia", "explorer", "derived"] as const;
    const partitioned = { kind: "family_partitioned" as const, families };
    expect(() => compileModuleRegistry(valid().map((module) => module.id === "full_inspector" ? { ...module, emptyBehavior: partitioned } : module))).not.toThrow();
    expect(() => compileModuleRegistry(valid().map((module) => module.id === "review_map" ? { ...module, emptyBehavior: partitioned } : module))).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_DECLARATION_INCOMPLETE" }));
    expect(() => compileModuleRegistry(valid().map((module) => module.id === "full_inspector" ? { ...module, emptyBehavior: { kind: "family_partitioned" as const, families: families.slice(1) } } : module))).toThrowError(expect.objectContaining<Partial<ModuleContractError>>({ code: "MODULE_DECLARATION_INCOMPLETE" }));
  });
});
