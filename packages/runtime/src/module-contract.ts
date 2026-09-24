import type { AnswerDistance, EvidenceForm, EvidenceRole, EvidenceTiming, VersionedEvidenceId } from "./evidence-contract.js";

export const MODULE_IDS = Object.freeze([
  "rules_floor", "sight_on_request", "blunder_prevention", "threat_radar",
  "postcommit_nudge", "structure_nudge", "theory_breadcrumb", "guided_hint",
  "compare_coach", "review_map", "full_inspector",
] as const);

export type ModuleId = (typeof MODULE_IDS)[number];
export type ModuleTiming = "pre_commit" | "at_commit" | "post_commit" | "checkpoint" | "review";
export type ModuleInitiative = "ambient" | "proactive" | "on_request" | "explicit_mode";
export type ModuleSeatClass = "board_input" | "board_adjacent" | "rail" | "timeline" | "explicit_surface";
export type ModuleForm = "sentence" | "card" | "square" | "arrow" | "timeline_mark" | "panel" | "spoken_voice";

/**
 * rfc/module-registration.md §2.3(a) ([[D1445]], [[D1859]]): answer distance is a branched capability
 * set, not a total ladder. Theory and evaluation are incomparable; `move` implies neither ranking,
 * theory nor evaluation. A module declares a non-empty literal union; compilation unions the images.
 */
export const MODULE_ANSWER_CAPABILITIES = Object.freeze([
  "observation", "pattern", "threat", "theory", "evaluation",
  "candidates", "ranked_candidates", "move", "principal_variation",
] as const);
export type ModuleAnswerCapability = (typeof MODULE_ANSWER_CAPABILITIES)[number];

export interface ModuleAcceptanceDeclaration {
  readonly projection: VersionedEvidenceId;
  readonly timings?: readonly ModuleTiming[];
  readonly answerContent?: readonly AnswerDistance[];
  readonly denominatorRequired?: boolean;
}

/** One named upstream dependency that keeps a module from executing. */
export interface ModuleDependencyBlocker {
  /** The owning RFC or lane, e.g. `hint-distance`. */
  readonly owner: string;
  /** The ledger or discharge row that records the dependency, e.g. `D1639`. */
  readonly ledger: string;
  readonly reason: string;
}

export type ModuleEvidenceDeclaration =
  | { readonly kind: "none"; readonly awaiting: readonly VersionedEvidenceId[] }
  | { readonly kind: "manifest"; readonly projections: readonly ModuleAcceptanceDeclaration[]; readonly awaiting: readonly VersionedEvidenceId[] }
  /**
   * The module's literal acceptance list cannot be written yet because an upstream registry it must
   * import does not exist. It registers no consumer and admits nothing; its blockers are explicit.
   */
  | { readonly kind: "blocked_dependencies"; readonly blockers: readonly ModuleDependencyBlocker[]; readonly awaiting: readonly VersionedEvidenceId[] };

export interface ModuleTimingDeclaration {
  readonly timing: ModuleTiming;
  readonly initiative: ModuleInitiative;
}

/**
 * `none` belongs to `rules_floor` alone and `guided_hint@1` to `guided_hint` alone: its exact
 * family×rung disclosure image is owned by `hint-distance`, never a broad fallback ([[D1569]]).
 */
export type ModuleAnswerContract =
  | { readonly kind: "none" }
  | { readonly kind: "capabilities"; readonly capabilities: readonly ModuleAnswerCapability[] }
  | { readonly kind: "guided_hint@1" };

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

/** rfc/module-registration.md §5.2: the eight evidence families Full Inspector states separately. */
export const INSPECTOR_FAMILY_IDS = Object.freeze([
  "local_rules", "authored_theory", "recorded_run", "stockfish", "syzygy", "maia", "explorer", "derived",
] as const);
export type InspectorFamilyId = (typeof INSPECTOR_FAMILY_IDS)[number];

export type ModuleEmptyBehavior =
  | { readonly kind: "silent" }
  | { readonly kind: "stated_absence"; readonly sentence: string }
  | { readonly kind: "unavailable_source"; readonly sentence: string }
  | { readonly kind: "family_partitioned"; readonly families: readonly InspectorFamilyId[] };

/** The fourteen-field learner-module contract. It selects no chess facts by itself. */
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
  readonly noveltyWindow: number;
}

export interface ModuleEvidenceClosure {
  readonly projections: readonly VersionedEvidenceId[];
  readonly consumers: readonly { readonly consumer: VersionedEvidenceId; readonly accepts: readonly VersionedEvidenceId[] }[];
  /**
   * Declared answer content of every compiled projection. When supplied, the compiler derives each
   * module's accepted answer union from it and refuses a union outside the declared capability image
   * or a declared capability with no accepted witness (§2.3(a), criterion A4).
   */
  readonly answerContent?: readonly { readonly projection: VersionedEvidenceId; readonly answerContent: readonly AnswerDistance[] }[];
}

export interface CompiledModuleRegistry {
  readonly modules: readonly ModuleDeclaration[];
  readonly byId: ReadonlyMap<ModuleId, ModuleDeclaration>;
  /** The compiled answer image (the union of the declared capability images) of each module. */
  readonly answerImages: ReadonlyMap<ModuleId, readonly AnswerDistance[]>;
}

export const MODULE_CONTRACT_ERROR_CODES = Object.freeze([
  "MODULE_REGISTRY_INCOMPLETE", "MODULE_DECLARATION_INCOMPLETE", "MODULE_ID_DUPLICATE",
  "MODULE_EVIDENCE_UNRESOLVED", "MODULE_CONSUMER_MISMATCH", "MODULE_CEILING_INVALID",
  "MODULE_FORM_UNMAPPED", "MODULE_ANSWER_WIDENS", "MODULE_AVOIDANCE_TIMING",
  "MODULE_BOARD_ADJACENT_COUNT", "MODULE_STAGE_INVALID", "MODULE_CAPABILITY_UNWITNESSED",
  "MODULE_DEPENDENCY_BLOCKED",
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

/** §2.3(a): the explicit branched image. Every branch carries the common `fact` member. */
export const MODULE_ANSWER_CAPABILITY_IMAGE: Readonly<Record<ModuleAnswerCapability, readonly AnswerDistance[]>> = Object.freeze({
  observation: ["fact"],
  pattern: ["fact", "pattern"],
  threat: ["fact", "threat"],
  theory: ["fact", "pattern", "theory", "principle", "plan"],
  evaluation: ["fact", "evaluation"],
  candidates: ["fact", "candidate_moves"],
  ranked_candidates: ["fact", "candidate_moves", "ranked_moves"],
  move: ["fact", "move"],
  principal_variation: ["fact", "candidate_moves", "ranked_moves", "move", "principal_variation"],
} satisfies Record<ModuleAnswerCapability, readonly AnswerDistance[]>);

/**
 * The compiled answer image of one contract. `guided_hint@1` has no image until `hint-distance`
 * publishes its sealed family×rung registry, so that module is blocked rather than widened.
 */
export function moduleAnswerImage(contract: ModuleAnswerContract): readonly AnswerDistance[] {
  if (contract.kind !== "capabilities") return Object.freeze([]);
  return Object.freeze([...new Set(contract.capabilities.flatMap((capability) => MODULE_ANSWER_CAPABILITY_IMAGE[capability] ?? []))]);
}

/** The literal evidence-timing image of a module's declared timings (`ceilings.disclosure`'s maximum). */
export function moduleEvidenceTimings(module: Pick<ModuleDeclaration, "timings">): readonly EvidenceTiming[] {
  return Object.freeze([...new Set(module.timings.flatMap((value) => MODULE_TIMING_IMAGE[value.timing]))]);
}

/** The literal evidence-form image of a module's declared forms. */
export function moduleEvidenceForms(module: Pick<ModuleDeclaration, "forms">): readonly EvidenceForm[] {
  return Object.freeze([...new Set(module.forms.flatMap((form) => MODULE_FORM_IMAGE[form]))]);
}

function fail(code: ModuleContractErrorCode, message: string): never {
  throw new ModuleContractError(code, message);
}

function assertDeclaration(module: ModuleDeclaration): void {
  if (!nonEmpty(module.intent) || !nonEmpty(module.learnerAction) || module.rendering !== "deterministic") fail("MODULE_DECLARATION_INCOMPLETE", `${module.id} lacks intent, learner action, or deterministic rendering`);
  if (module.timings.length === 0 || !unique(module.timings.map((value) => value.timing)) || module.forms.length === 0 || !unique(module.forms)) fail("MODULE_DECLARATION_INCOMPLETE", `${module.id} has an empty or duplicate timing/form declaration`);
  if (module.ceilings.disclosure.length === 0 || module.ceilings.sessions.length === 0 || module.ceilings.roles.length === 0 || !module.ceilings.visibleBoardParity) fail("MODULE_CEILING_INVALID", `${module.id} has an empty ceiling or does not inherit visible-board assistance`);
  if (![module.budgets.maxFacts, module.budgets.maxWords, module.budgets.maxArrows].every((value) => Number.isSafeInteger(value) && value >= 0) || module.budgets.maxMarks !== null && (!Number.isSafeInteger(module.budgets.maxMarks) || module.budgets.maxMarks < 0)) fail("MODULE_CEILING_INVALID", `${module.id} has an invalid backstop budget`);
  if (!Number.isSafeInteger(module.noveltyWindow) || module.noveltyWindow < 0) fail("MODULE_DECLARATION_INCOMPLETE", `${module.id} has an invalid novelty window`);
  for (const form of module.forms) if (MODULE_FORM_IMAGE[form] === undefined) fail("MODULE_FORM_UNMAPPED", `${module.id} uses unmapped form ${form}`);
  if (!subset(module.ceilings.disclosure, moduleEvidenceTimings(module))) fail("MODULE_CEILING_INVALID", `${module.id} disclosure ceiling exceeds its module timing image`);
  const contract = module.answerCeiling;
  if (contract === undefined || !["none", "capabilities", "guided_hint@1"].includes(contract.kind)) fail("MODULE_DECLARATION_INCOMPLETE", `${module.id} has no answer contract`);
  if (module.id === "rules_floor" ? contract.kind !== "none" : contract.kind === "none") fail("MODULE_DECLARATION_INCOMPLETE", `${module.id} ${module.id === "rules_floor" ? "must declare" : "may not declare"} the none answer contract`);
  if (module.id === "guided_hint" ? contract.kind !== "guided_hint@1" : contract.kind === "guided_hint@1") fail("MODULE_STAGE_INVALID", `${module.id} ${module.id === "guided_hint" ? "requires" : "cannot declare"} the guided_hint@1 disclosure contract`);
  if (contract.kind === "capabilities" && (contract.capabilities.length === 0 || !unique(contract.capabilities) || contract.capabilities.some((capability) => !MODULE_ANSWER_CAPABILITIES.includes(capability)))) fail("MODULE_ANSWER_WIDENS", `${module.id} needs a non-empty literal union of known answer capabilities`);
  if (contract.kind === "guided_hint@1" && module.accepts.kind !== "blocked_dependencies") fail("MODULE_DEPENDENCY_BLOCKED", "guided_hint@1 cannot admit evidence until hint-distance publishes HINT_DISCLOSURE_PROJECTION_IDS");
  const answerImage = moduleAnswerImage(contract);
  if (module.emptyBehavior.kind === "family_partitioned") {
    const families = module.emptyBehavior.families;
    if (module.id !== "full_inspector" || families.length !== INSPECTOR_FAMILY_IDS.length || !unique(families) || !subset(families, INSPECTOR_FAMILY_IDS)) fail("MODULE_DECLARATION_INCOMPLETE", `${module.id} may not declare a family-partitioned empty state other than Full Inspector's eight families`);
  }
  if (module.accepts.kind === "blocked_dependencies") {
    if (module.id === "rules_floor" || module.accepts.blockers.length === 0 || module.accepts.blockers.some((blocker) => !nonEmpty(blocker.owner) || !nonEmpty(blocker.ledger) || !nonEmpty(blocker.reason))) fail("MODULE_DEPENDENCY_BLOCKED", `${module.id} blocked dependencies must name an owner, a ledger row and a reason`);
    if (module.selection.familyPrecedence.length !== 0) fail("MODULE_DECLARATION_INCOMPLETE", `${module.id} is blocked and cannot declare a family precedence`);
  } else if (module.accepts.kind === "none") {
    if (module.id !== "rules_floor" || module.accepts.awaiting.length !== 0 || module.budgets.maxFacts !== 0 || module.seatClass !== "board_input") fail("MODULE_DECLARATION_INCOMPLETE", "rules_floor is the sole registry-only affordance module");
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
  const answers = closure.answerContent === undefined ? undefined : new Map(closure.answerContent.map((value) => [refKey(value.projection), value.answerContent]));
  for (const module of modules) {
    if (module.accepts.kind === "none") {
      if (consumers.has(`module.${module.id}@1`)) fail("MODULE_CONSUMER_MISMATCH", "rules_floor must not register an evidence consumer");
      continue;
    }
    const awaiting = module.accepts.awaiting.map(refKey);
    if (module.accepts.kind === "blocked_dependencies") {
      if (consumers.has(`module.${module.id}@1`)) fail("MODULE_CONSUMER_MISMATCH", `${module.id} is blocked and must not register an evidence consumer`);
      if (awaiting.some((value) => projections.has(value))) fail("MODULE_EVIDENCE_UNRESOLVED", `${module.id} awaits a projection that already compiles`);
      continue;
    }
    const accepted = module.accepts.projections.map((value) => refKey(value.projection));
    if (accepted.some((value) => !projections.has(value)) || awaiting.some((value) => projections.has(value))) fail("MODULE_EVIDENCE_UNRESOLVED", `${module.id} compiled/awaiting projection partition is false`);
    const consumer = consumers.get(`module.${module.id}@1`);
    if (consumer === undefined || consumer.join("|") !== accepted.join("|")) fail("MODULE_CONSUMER_MISMATCH", `${module.id} consumer is absent or not order-equal to accepts`);
    if (answers !== undefined) {
      const image = moduleAnswerImage(module.answerCeiling);
      const union = new Set<AnswerDistance>();
      for (const key of accepted) {
        const declared = answers.get(key);
        if (declared === undefined) fail("MODULE_EVIDENCE_UNRESOLVED", `${module.id} accepts ${key} with no declared answer content`);
        for (const answer of declared) union.add(answer);
      }
      const widened = [...union].filter((answer) => !image.includes(answer));
      if (widened.length > 0) fail("MODULE_ANSWER_WIDENS", `${module.id} accepts answer content outside its capabilities: ${widened.join(", ")}`);
      if (module.answerCeiling.kind === "capabilities") {
        for (const capability of module.answerCeiling.capabilities) {
          const branch = MODULE_ANSWER_CAPABILITY_IMAGE[capability];
          const witness = capability === "observation" ? branch : branch.filter((answer) => answer !== "fact");
          if (!witness.some((answer) => union.has(answer))) fail("MODULE_CAPABILITY_UNWITNESSED", `${module.id} declares ${capability} with no accepted witness`);
        }
      }
    }
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
  const answerImages = new Map(modules.map((module) => [module.id, moduleAnswerImage(module.answerCeiling)] as const));
  return Object.freeze({ modules, byId: byId as ReadonlyMap<ModuleId, ModuleDeclaration>, answerImages: answerImages as ReadonlyMap<ModuleId, readonly AnswerDistance[]> });
}
