import type { AnswerDistance, EvidenceForm, EvidenceRole, EvidenceTiming, VersionedEvidenceId } from "./evidence-contract.js";

export const MODULE_IDS = Object.freeze([
  "rules_floor", "sight_on_request", "blunder_prevention", "threat_radar",
  "postcommit_nudge", "structure_nudge", "theory_breadcrumb", "guided_hint",
  "compare_coach", "review_map", "full_inspector",
] as const);

export type ModuleId = (typeof MODULE_IDS)[number];
export type ModuleTiming = "pre_commit" | "at_commit" | "post_commit" | "checkpoint" | "review";
export type ModuleInitiative = "ambient" | "proactive" | "on_request" | "explicit_mode";
export type ModuleAnswerCeiling = "none" | "fact" | "pattern" | "threat" | "candidate_move" | "principal_variation";
export type ModuleSeatClass = "board_input" | "board_adjacent" | "rail" | "timeline" | "explicit_surface";
export type ModuleForm = "sentence" | "card" | "square" | "arrow" | "timeline_mark" | "panel" | "spoken_voice";

export interface ModuleAcceptanceDeclaration {
  readonly projection: VersionedEvidenceId;
  readonly timings?: readonly ModuleTiming[];
  readonly answerContent?: readonly AnswerDistance[];
  readonly denominatorRequired?: boolean;
}

export type ModuleEvidenceDeclaration =
  | { readonly kind: "none"; readonly awaiting: readonly VersionedEvidenceId[] }
  | { readonly kind: "manifest"; readonly projections: readonly ModuleAcceptanceDeclaration[]; readonly awaiting: readonly VersionedEvidenceId[] };

export interface ModuleTimingDeclaration {
  readonly timing: ModuleTiming;
  readonly initiative: ModuleInitiative;
}

export interface ModuleAnswerContract {
  readonly ceiling: ModuleAnswerCeiling;
  readonly stages?: readonly { readonly stage: 1 | 2 | 3; readonly ceiling: ModuleAnswerCeiling }[];
}

export interface ModuleCeilings {
  readonly disclosure: readonly EvidenceTiming[];
  readonly sessions: readonly string[];
  readonly roles: readonly EvidenceRole[];
  readonly visibleBoardParity: true;
}

export interface ModuleBudgets {
  readonly maxFacts: number;
  readonly maxWords: number;
  readonly maxMarks: number | null;
  readonly maxArrows: number;
}

export interface ModuleSelectionDeclaration {
  readonly policy: VersionedEvidenceId;
  readonly familyPrecedence: readonly VersionedEvidenceId[];
}

export type ModuleEmptyBehavior =
  | { readonly kind: "silent" }
  | { readonly kind: "stated_absence"; readonly sentence: string }
  | { readonly kind: "unavailable_source"; readonly sentence: string };

/** The thirteen-field learner-module contract. It selects no chess facts by itself. */
export interface ModuleDeclaration {
  readonly id: ModuleId;
  readonly intent: string;
  readonly learnerAction: string;
  readonly accepts: ModuleEvidenceDeclaration;
  readonly timings: readonly ModuleTimingDeclaration[];
  readonly answerCeiling: ModuleAnswerContract;
  readonly ceilings: ModuleCeilings;
  readonly budgets: ModuleBudgets;
  readonly selection: ModuleSelectionDeclaration;
  readonly emptyBehavior: ModuleEmptyBehavior;
  readonly seatClass: ModuleSeatClass;
  readonly forms: readonly ModuleForm[];
  readonly rendering: "deterministic";
}

export interface ModuleEvidenceClosure {
  readonly projections: readonly VersionedEvidenceId[];
  readonly consumers: readonly { readonly consumer: VersionedEvidenceId; readonly accepts: readonly VersionedEvidenceId[] }[];
}

export interface CompiledModuleRegistry {
  readonly modules: readonly ModuleDeclaration[];
  readonly byId: ReadonlyMap<ModuleId, ModuleDeclaration>;
}

export const MODULE_CONTRACT_ERROR_CODES = Object.freeze([
  "MODULE_REGISTRY_INCOMPLETE", "MODULE_DECLARATION_INCOMPLETE", "MODULE_ID_DUPLICATE",
  "MODULE_EVIDENCE_UNRESOLVED", "MODULE_CONSUMER_MISMATCH", "MODULE_CEILING_INVALID",
  "MODULE_FORM_UNMAPPED", "MODULE_ANSWER_WIDENS", "MODULE_AVOIDANCE_TIMING",
  "MODULE_BOARD_ADJACENT_COUNT", "MODULE_STAGE_INVALID",
] as const);
export type ModuleContractErrorCode = (typeof MODULE_CONTRACT_ERROR_CODES)[number];

export class ModuleContractError extends TypeError {
  readonly code: ModuleContractErrorCode;
  constructor(code: ModuleContractErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = "ModuleContractError";
    this.code = code;
  }
}

const refKey = (value: VersionedEvidenceId): string => `${value.id}@${value.version}`;
const nonEmpty = (value: string): boolean => value.trim().length > 0;
const unique = <T>(values: readonly T[]): boolean => new Set(values).size === values.length;
const subset = <T>(values: readonly T[], ceiling: readonly T[]): boolean => values.every((value) => ceiling.includes(value));

export const MODULE_TIMING_IMAGE: Readonly<Record<ModuleTiming, readonly EvidenceTiming[]>> = Object.freeze({
  pre_commit: ["precommit"],
  at_commit: ["at_commit"],
  post_commit: ["postcommit"],
  checkpoint: ["checkpoint", "attempt_end"],
  review: ["review", "analysis"],
} satisfies Record<ModuleTiming, readonly EvidenceTiming[]>);

export const MODULE_FORM_IMAGE: Readonly<Record<ModuleForm, readonly EvidenceForm[]>> = Object.freeze({
  sentence: ["sentence"],
  card: ["panel", "list"],
  square: ["lit_squares", "piece_halo"],
  arrow: ["arrows"],
  timeline_mark: ["timeline_marker"],
  panel: ["panel"],
  spoken_voice: ["audio"],
} satisfies Record<ModuleForm, readonly EvidenceForm[]>);

export const MODULE_ANSWER_IMAGE: Readonly<Record<ModuleAnswerCeiling, readonly AnswerDistance[]>> = Object.freeze({
  none: [],
  fact: ["fact"],
  pattern: ["pattern"],
  threat: ["threat"],
  candidate_move: ["candidate_moves"],
  principal_variation: ["principal_variation"],
} satisfies Record<ModuleAnswerCeiling, readonly AnswerDistance[]>);

function fail(code: ModuleContractErrorCode, message: string): never {
  throw new ModuleContractError(code, message);
}

function assertDeclaration(module: ModuleDeclaration): void {
  if (!nonEmpty(module.intent) || !nonEmpty(module.learnerAction) || module.rendering !== "deterministic") fail("MODULE_DECLARATION_INCOMPLETE", `${module.id} lacks intent, learner action, or deterministic rendering`);
  if (module.timings.length === 0 || !unique(module.timings.map((value) => value.timing)) || module.forms.length === 0 || !unique(module.forms)) fail("MODULE_DECLARATION_INCOMPLETE", `${module.id} has an empty or duplicate timing/form declaration`);
  if (module.ceilings.disclosure.length === 0 || module.ceilings.sessions.length === 0 || module.ceilings.roles.length === 0 || !module.ceilings.visibleBoardParity) fail("MODULE_CEILING_INVALID", `${module.id} has an empty ceiling or does not inherit visible-board assistance`);
  if (![module.budgets.maxFacts, module.budgets.maxWords, module.budgets.maxArrows].every((value) => Number.isSafeInteger(value) && value >= 0) || module.budgets.maxMarks !== null && (!Number.isSafeInteger(module.budgets.maxMarks) || module.budgets.maxMarks < 0)) fail("MODULE_CEILING_INVALID", `${module.id} has an invalid backstop budget`);
  for (const form of module.forms) if (MODULE_FORM_IMAGE[form] === undefined) fail("MODULE_FORM_UNMAPPED", `${module.id} uses unmapped form ${form}`);
  const timingImage = module.timings.flatMap((value) => MODULE_TIMING_IMAGE[value.timing]);
  if (!subset(module.ceilings.disclosure, timingImage)) fail("MODULE_CEILING_INVALID", `${module.id} disclosure ceiling exceeds its module timing image`);
  const answerImage = MODULE_ANSWER_IMAGE[module.answerCeiling.ceiling];
  if (answerImage === undefined) fail("MODULE_ANSWER_WIDENS", `${module.id} has no answer-distance image`);
  const stages = module.answerCeiling.stages;
  if (stages !== undefined) {
    if (module.answerCeiling.ceiling !== "principal_variation" || stages.length !== 3 || stages.map((value) => `${value.stage}:${value.ceiling}`).join("|") !== "1:pattern|2:fact|3:principal_variation") fail("MODULE_STAGE_INVALID", `${module.id} has an invalid progressive stage ceiling`);
  } else if (module.id === "guided_hint") fail("MODULE_STAGE_INVALID", "guided_hint requires all three typed stage ceilings");
  if (module.id !== "guided_hint" && stages !== undefined) fail("MODULE_STAGE_INVALID", `${module.id} cannot declare guided-hint stages`);
  if (module.accepts.kind === "none") {
    if (module.id !== "rules_floor" || module.accepts.awaiting.length !== 0 || module.budgets.maxFacts !== 0 || module.answerCeiling.ceiling !== "none" || module.seatClass !== "board_input") fail("MODULE_DECLARATION_INCOMPLETE", "rules_floor is the sole registry-only affordance module");
  } else {
    if (module.id === "rules_floor" || module.accepts.projections.length === 0 || !unique(module.accepts.projections.map((value) => refKey(value.projection)))) fail("MODULE_DECLARATION_INCOMPLETE", `${module.id} has an invalid manifest acceptance list`);
    const precedence = module.selection.familyPrecedence.map(refKey);
    if (precedence.join("|") !== module.accepts.projections.map((value) => refKey(value.projection)).join("|")) fail("MODULE_DECLARATION_INCOMPLETE", `${module.id} family precedence must be its literal accepts order`);
    for (const accepted of module.accepts.projections) {
      if (accepted.timings !== undefined && !subset(accepted.timings, module.timings.map((value) => value.timing))) fail("MODULE_CEILING_INVALID", `${module.id} projection ${refKey(accepted.projection)} widens timing`);
      if (accepted.answerContent !== undefined && !subset(accepted.answerContent, answerImage)) fail("MODULE_ANSWER_WIDENS", `${module.id} projection ${refKey(accepted.projection)} widens answer content`);
      if (accepted.projection.id.startsWith("derived.semantic_avoidance.") && (!accepted.denominatorRequired || module.timings.some((value) => value.timing === "pre_commit" || value.timing === "at_commit"))) fail("MODULE_AVOIDANCE_TIMING", `${module.id} avoidance evidence lacks a denominator or reaches a pre-commit timing`);
    }
  }
  if (module.id === "blunder_prevention" ? module.seatClass !== "board_adjacent" : module.seatClass === "board_adjacent") fail("MODULE_BOARD_ADJACENT_COUNT", `${module.id} violates the one board-adjacent cue contract`);
  if (module.id === "blunder_prevention" && (module.emptyBehavior.kind !== "silent" || module.timings.length !== 1 || module.timings[0]?.timing !== "at_commit")) fail("MODULE_CEILING_INVALID", "blunder_prevention alone owns staged-move output and cannot emit an all-clear sentence");
}

function assertClosure(modules: readonly ModuleDeclaration[], closure: ModuleEvidenceClosure): void {
  const projections = new Set(closure.projections.map(refKey));
  const consumers = new Map(closure.consumers.map((value) => [refKey(value.consumer), value.accepts.map(refKey)]));
  for (const module of modules) {
    if (module.accepts.kind === "none") {
      if (consumers.has(`module.${module.id}@1`)) fail("MODULE_CONSUMER_MISMATCH", "rules_floor must not register an evidence consumer");
      continue;
    }
    const accepted = module.accepts.projections.map((value) => refKey(value.projection));
    const awaiting = module.accepts.awaiting.map(refKey);
    if (accepted.some((value) => !projections.has(value)) || awaiting.some((value) => projections.has(value))) fail("MODULE_EVIDENCE_UNRESOLVED", `${module.id} compiled/awaiting projection partition is false`);
    const consumer = consumers.get(`module.${module.id}@1`);
    if (consumer === undefined || consumer.join("|") !== accepted.join("|")) fail("MODULE_CONSUMER_MISMATCH", `${module.id} consumer is absent or not order-equal to accepts`);
  }
}

export function compileModuleRegistry(declarations: readonly ModuleDeclaration[], closure?: ModuleEvidenceClosure): CompiledModuleRegistry {
  if (declarations.length !== MODULE_IDS.length || new Set(declarations.map((value) => value.id)).size !== MODULE_IDS.length || MODULE_IDS.some((id) => !declarations.some((value) => value.id === id))) fail("MODULE_REGISTRY_INCOMPLETE", `module registry must be set-equal to the ${MODULE_IDS.length} closed ids`);
  const byId = new Map<ModuleId, ModuleDeclaration>();
  for (const module of declarations) {
    if (byId.has(module.id)) fail("MODULE_ID_DUPLICATE", `duplicate module ${module.id}`);
    assertDeclaration(module);
    byId.set(module.id, module);
  }
  if ([...byId.values()].filter((value) => value.seatClass === "board_adjacent").length !== 1) fail("MODULE_BOARD_ADJACENT_COUNT", "exactly one module must occupy the board-adjacent seat");
  if (closure !== undefined) assertClosure([...byId.values()], closure);
  const modules = Object.freeze(MODULE_IDS.map((id) => byId.get(id)!));
  return Object.freeze({ modules, byId: byId as ReadonlyMap<ModuleId, ModuleDeclaration> });
}
