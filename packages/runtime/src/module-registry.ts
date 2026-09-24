// rfc/module-registration.md §1–§2.1 — the production learner-module registry.
//
// MODULE_DECLARATIONS are assembled from the two authorities: the policy table (`module-policy.ts`,
// [[D3066]]) and the exact acceptance image (`MODULE_CONSUMER_ACCEPTS` in `evidence-catalog.ts`).
// The registry is compiled at import against the compiled evidence manifest, so an inconsistent
// registry fails the runtime package at load rather than at the first render (the `presets.ts`
// idiom). Nothing here selects or renders a chess fact.

import {
  EVIDENCE_MODULE_IDS,
  MODULE_CONSUMER_ACCEPTS,
  MODULE_CONSUMER_IDS,
  MODULE_CONSUMER_IMPLEMENTATION,
  PRIMARY_EVIDENCE_MANIFEST,
  RECORDED_PATH_SUCCESSOR_REFS,
  SEMANTIC_EVENT_PROJECTION_REFS,
  TACTICAL_COLLECTOR_PROJECTION_IDS,
  BREADTH_COLLECTOR_PROJECTION_IDS,
  WAVE_C_MODULE_PROJECTION_REFS,
  type EvidenceModuleId,
} from "./evidence-catalog.js";
import type { CompiledEvidenceManifest, EvidenceRole, VersionedEvidenceId } from "./evidence-contract.js";
import {
  MODULE_IDS,
  compileModuleRegistry,
  moduleEvidenceTimings,
  type CompiledModuleRegistry,
  type ModuleAcceptanceDeclaration,
  type ModuleDeclaration,
  type ModuleDependencyBlocker,
  type ModuleEvidenceClosure,
  type ModuleId,
  type ModuleTiming,
} from "./module-contract.js";
import { MODULE_POLICIES, moduleSessions, type ModulePolicy } from "./module-policy.js";
import { PRESET_DECLARATIONS, WORKFLOW_CONTEXT_POLICIES, type PresetDeclaration, type WorkflowContextPolicy } from "./presets.js";
import { presentationAdapter } from "./presentation-contract.js";

const ref = (id: string, version = 1): VersionedEvidenceId => Object.freeze({ id, version });
const refKey = (value: VersionedEvidenceId): string => `${value.id}@${value.version}`;

/** §1.3: `production.module_local@1` names the module-reducers ordering; it is not an F1 policy. */
export const MODULE_SELECTION_POLICY: VersionedEvidenceId = ref("production.module_local");

/**
 * Declared-awaiting refs: named in a module's contract, absent from the compiled catalogue, and
 * never fabricated. Each carries the owner whose landing compiles it.
 */
export const MODULE_AWAITING: Readonly<Partial<Record<ModuleId, readonly { readonly projection: VersionedEvidenceId; readonly owner: string }[]>>> = Object.freeze({
  theory_breadcrumb: Object.freeze([{ projection: ref("derived.explorer.population_summary"), owner: "provider-exchange-and-execution (§2.3(c) move-free Explorer summary)" }]),
  full_inspector: Object.freeze([{ projection: ref("pack.authored.classifier"), owner: "module-registration Discharge D2 (leak L12)" }]),
});

/** `guided_hint` imports only hint-distance's literal family×rung disclosure registry, which does not exist. */
export const GUIDED_HINT_BLOCKERS: readonly ModuleDependencyBlocker[] = Object.freeze([
  Object.freeze({ owner: "hint-distance", ledger: "D1639", reason: "HINT_DISCLOSURE_PROJECTION_IDS and HINT_HORIZON_PROJECTION_IDS are not published; a generic or raw-PV hint binding is forbidden ([[D1569]], [[D1455]])." }),
  Object.freeze({ owner: "module-registration", ledger: "D7", reason: "The sealed rung compiler that emits one derived.hint.disclosure.<family>.<rung>@1 item per request has not landed." }),
]);

function acceptance(projection: VersionedEvidenceId): ModuleAcceptanceDeclaration {
  // [[D745]]: an avoidance fact is admissible only with its complete-population denominator.
  return projection.id.startsWith("derived.semantic_avoidance.")
    ? Object.freeze({ projection, denominatorRequired: true })
    : Object.freeze({ projection });
}

function declarationFor(policy: ModulePolicy): ModuleDeclaration {
  const id = policy.id;
  const awaiting = Object.freeze((MODULE_AWAITING[id] ?? []).map((value) => value.projection));
  const accepted = id in MODULE_CONSUMER_ACCEPTS ? MODULE_CONSUMER_ACCEPTS[id as EvidenceModuleId] : undefined;
  const accepts: ModuleDeclaration["accepts"] = id === "rules_floor"
    ? Object.freeze({ kind: "none" as const, awaiting: Object.freeze([]) })
    : accepted === undefined
      ? Object.freeze({ kind: "blocked_dependencies" as const, blockers: id === "guided_hint" ? GUIDED_HINT_BLOCKERS : Object.freeze([]), awaiting })
      : Object.freeze({ kind: "manifest" as const, projections: Object.freeze(accepted.map(acceptance)), awaiting });
  return Object.freeze({
    id,
    intent: policy.intent,
    learnerAction: policy.learnerAction,
    accepts,
    timings: policy.timings,
    answerCeiling: policy.answer,
    ceilings: Object.freeze({
      disclosure: moduleEvidenceTimings(policy),
      sessions: moduleSessions(id),
      roles: policy.roles,
      visibleBoardParity: true as const,
    }),
    budgets: policy.budgets,
    selection: Object.freeze({ policy: MODULE_SELECTION_POLICY, familyPrecedence: Object.freeze(accepted === undefined ? [] : [...accepted]) }),
    emptyBehavior: policy.emptyBehavior,
    seatClass: policy.seatClass,
    forms: policy.forms,
    rendering: "deterministic" as const,
    noveltyWindow: policy.noveltyWindow,
  });
}

/** §1: the eleven literal declarations, in MODULE_IDS order. */
export const MODULE_DECLARATIONS: readonly ModuleDeclaration[] = Object.freeze(MODULE_POLICIES.map(declarationFor));

/** §2.1: the ten-or-fewer `module.*` consumers of the compiled manifest, with their answer content. */
export function moduleEvidenceClosure(manifest: CompiledEvidenceManifest): ModuleEvidenceClosure {
  return Object.freeze({
    projections: Object.freeze(manifest.projections.map((projection) => ref(projection.id, projection.version))),
    consumers: Object.freeze(manifest.consumers
      .filter((consumer) => consumer.id.startsWith("module."))
      .map((consumer) => Object.freeze({ consumer: ref(consumer.id, consumer.version), accepts: consumer.accepts }))),
    answerContent: Object.freeze(manifest.projections.map((projection) => Object.freeze({ projection: ref(projection.id, projection.version), answerContent: projection.answerContent }))),
  });
}

export type ModuleRegistryInvariantCode =
  | "MODULE_SESSIONS_DRIFT" | "MODULE_ROLE_FORBIDDEN" | "MODULE_PRESET_UNRESOLVED"
  | "MODULE_BINDING_DRIFT" | "MODULE_COVERAGE_OPEN";

export class ModuleRegistryInvariantError extends TypeError {
  readonly code: ModuleRegistryInvariantCode;
  constructor(code: ModuleRegistryInvariantCode, message: string) {
    super(`${code}: ${message}`);
    this.name = "ModuleRegistryInvariantError";
    this.code = code;
  }
}

/**
 * [[D3065]] cover-or-refuse closure: every projection an upstream collector RFC hands to the module
 * layer is either accepted by at least one module or refused here with its reason — never both,
 * never neither.
 */
export const MODULE_COVERAGE_REFUSALS: readonly { readonly projection: VersionedEvidenceId; readonly reason: string }[] = Object.freeze([
  Object.freeze({ projection: ref("rules.exchange.predicate.legal_exchange"), reason: "tactical-collectors D1: an internal machine_condition predicate; it stays a producer operand and advanced-inventory fact, never a rendered learner module fact." }),
]);

/** The literal discharge populations the module layer must close, per upstream RFC. */
export const MODULE_UPSTREAM_DISCHARGES: readonly { readonly owner: string; readonly projections: readonly VersionedEvidenceId[] }[] = Object.freeze([
  { owner: "tactical-collectors D1", projections: TACTICAL_COLLECTOR_PROJECTION_IDS.map((id) => ref(id)) },
  { owner: "breadth-collectors D1", projections: BREADTH_COLLECTOR_PROJECTION_IDS.map((id) => ref(id)) },
  { owner: "exact-legal-mobility D1", projections: [ref("rules.mobility.reading.legal_moves")] },
  { owner: "runtime-opening-identity D1", projections: ["theory.opening.current_endpoint", "theory.opening.catalogue_membership", "derived.opening.deepest_reached"].map((id) => ref(id)) },
  { owner: "learner-modules §4.12 (D921)", projections: WAVE_C_MODULE_PROJECTION_REFS },
  { owner: "recorded-semantic-path §3", projections: RECORDED_PATH_SUCCESSOR_REFS },
].map((row) => Object.freeze({ owner: row.owner, projections: Object.freeze(row.projections) })));

export interface ModuleRegistryInvariantInput {
  readonly declarations: readonly ModuleDeclaration[];
  readonly contexts?: readonly WorkflowContextPolicy[];
  readonly presets?: readonly PresetDeclaration[];
  readonly manifest?: CompiledEvidenceManifest;
  readonly refusals?: typeof MODULE_COVERAGE_REFUSALS;
}

/** §2.1: the cross-file invariants the module compiler cannot see. */
export function assertModuleRegistry(input: ModuleRegistryInvariantInput): void {
  const contexts = input.contexts ?? WORKFLOW_CONTEXT_POLICIES;
  const presets = input.presets ?? PRESET_DECLARATIONS;
  const manifest = input.manifest ?? PRIMARY_EVIDENCE_MANIFEST;
  const refusals = input.refusals ?? MODULE_COVERAGE_REFUSALS;
  const forbidden: readonly EvidenceRole[] = ["author", "operator"];
  for (const module of input.declarations) {
    // 1. Sessions are the workflow contexts whose shipped moduleCeiling contains the module.
    const expected = moduleSessions(module.id, contexts);
    if (expected.length !== module.ceilings.sessions.length || expected.some((value) => !module.ceilings.sessions.includes(value))) {
      throw new ModuleRegistryInvariantError("MODULE_SESSIONS_DRIFT", `${module.id} sessions ${module.ceilings.sessions.join(",")} ≠ moduleCeiling image ${expected.join(",")}`);
    }
    // 2. No learner module widens into an authoring or operator surface.
    if (module.ceilings.roles.some((role) => forbidden.includes(role))) throw new ModuleRegistryInvariantError("MODULE_ROLE_FORBIDDEN", `${module.id} declares an author/operator role`);
  }
  // 3. Every preset module resolves to a declaration.
  const declared = new Set(input.declarations.map((module) => module.id));
  for (const preset of presets) for (const id of preset.modules) {
    if (!declared.has(id)) throw new ModuleRegistryInvariantError("MODULE_PRESET_UNRESOLVED", `preset ${preset.id} names ${id}, which has no declaration`);
  }
  // 4. The compiled F1 module bindings are exactly the declared acceptance pairs (§2.2, A2).
  const declaredPairs = input.declarations.flatMap((module) => module.accepts.kind === "manifest" ? module.accepts.projections.map((value) => `module.${module.id}@1\u0000${refKey(value.projection)}`) : []).sort();
  const boundPairs = manifest.bindings.filter((binding) => binding.consumer.id.startsWith("module.")).map((binding) => `${refKey(binding.consumer)}\u0000${refKey(binding.projection)}`).sort();
  if (declaredPairs.join("|") !== boundPairs.join("|")) throw new ModuleRegistryInvariantError("MODULE_BINDING_DRIFT", `declared ${declaredPairs.length} module pairs, bound ${boundPairs.length}`);
  // 5. [[D3065]] cover-or-refuse closure over every upstream discharge population.
  const covered = new Set(input.declarations.flatMap((module) => module.accepts.kind === "manifest" ? module.accepts.projections.map((value) => refKey(value.projection)) : []));
  const refused = new Set(refusals.map((value) => refKey(value.projection)));
  for (const discharge of MODULE_UPSTREAM_DISCHARGES) for (const projection of discharge.projections) {
    const key = refKey(projection);
    if (covered.has(key) === refused.has(key)) {
      throw new ModuleRegistryInvariantError("MODULE_COVERAGE_OPEN", `${discharge.owner}: ${key} is ${covered.has(key) ? "both covered and refused" : "neither covered nor refused"}`);
    }
  }
}

export const MODULE_REGISTRY: CompiledModuleRegistry = compileModuleRegistry(MODULE_DECLARATIONS, moduleEvidenceClosure(PRIMARY_EVIDENCE_MANIFEST));
assertModuleRegistry({ declarations: MODULE_REGISTRY.modules });
if (MODULE_REGISTRY.modules.filter((module) => module.accepts.kind === "manifest").map((module) => `module.${module.id}`).join("|") !== MODULE_CONSUMER_IDS.join("|")) {
  throw new ModuleRegistryInvariantError("MODULE_BINDING_DRIFT", "the evidence-bearing modules are not order-equal to MODULE_CONSUMER_IDS");
}
if (!PRIMARY_EVIDENCE_MANIFEST.consumers.filter((consumer) => consumer.id.startsWith("module.")).every((consumer) => consumer.implementation === MODULE_CONSUMER_IMPLEMENTATION)) {
  throw new ModuleRegistryInvariantError("MODULE_BINDING_DRIFT", `every module consumer must name the one ${MODULE_CONSUMER_IMPLEMENTATION} operation`);
}

export function moduleDeclaration(id: ModuleId): ModuleDeclaration {
  return MODULE_REGISTRY.byId.get(id)!;
}

// ---------------------------------------------------------------------------------------------
// Pair execution: what is executable today versus blocked, stated per pair rather than implied.
// ---------------------------------------------------------------------------------------------

/**
 * The v1 semantic events the one-edge closure (`localSemanticEventClosure`) can emit. Complete-
 * population avoidance needs the candidate population, and the sequence/observed families need a
 * recorded multi-edge window, so neither is a one-edge output.
 */
const SEQUENCE_EVENT_IDS = new Set([
  "derived.pawn.sequence.contact_timing", "derived.pawn.sequence.harassment_pressure", "derived.tactic.sequence.defender_consequence",
  "derived.tactic.deflection_observed", "derived.tactic.attraction_observed", "derived.tactic.line_blocker_clearance_observed",
  "derived.tactic.square_clearance_observed", "derived.tactic.interference_observed", "derived.tactic.check_zwischenzug_observed",
  "derived.tactic.overload_exploitation_observed",
]);
export const ONE_EDGE_EVENT_REFS: readonly VersionedEvidenceId[] = Object.freeze(SEMANTIC_EVENT_PROJECTION_REFS.filter((value) =>
  value.version === 1 && !value.id.startsWith("derived.semantic_avoidance.") && !SEQUENCE_EVENT_IDS.has(value.id)));

export interface ModuleOperation {
  readonly module: ModuleId;
  /** The production symbol that routes this evidence through `compileModulePacket`. */
  readonly operation: string;
  readonly timing: ModuleTiming;
  readonly projections: readonly VersionedEvidenceId[];
}

/** The production module operations that exist today. Every other compiled pair is blocked. */
export const MODULE_OPERATIONS: readonly ModuleOperation[] = Object.freeze([
  Object.freeze({
    module: "review_map" as const, operation: "reviewMapProjection", timing: "review" as const,
    // rfc/review-evidence-compiler.md: the typed packet projections the evidence panel admits.
    projections: Object.freeze([ref("derived.grade.move_quality"), ref("live.stockfish.eval"), ...RECORDED_PATH_SUCCESSOR_REFS, ...["derived.review.eval_point", "derived.review.eval_delta", "derived.review.mate_transition", "derived.review.wdl_point"].map((id) => ref(id))]),
  }),
  Object.freeze({
    module: "postcommit_nudge" as const, operation: "postcommitNudgePacket", timing: "post_commit" as const,
    projections: Object.freeze([ref("derived.grade.move_quality"), ...ONE_EDGE_EVENT_REFS.filter((value) => MODULE_CONSUMER_ACCEPTS.postcommit_nudge.some((accepted) => refKey(accepted) === refKey(value)))]),
  }),
]);

const PRESENTATION_BLOCKER: ModuleDependencyBlocker = Object.freeze({ owner: "evidence-presentation", ledger: "module-registration A5", reason: "Pair-keyed presentation adapters and the sealed relation_overlay are draft; no seat may render this pair yet." });
const QUERY_BLOCKER: ModuleDependencyBlocker = Object.freeze({ owner: "module-registration", ledger: "D8", reason: "RunService.queryModules and compileModuleExactOperationResolution have not landed; no production operation acquires this pair's sealed source." });
const RECEIPT_BLOCKER: ModuleDependencyBlocker = Object.freeze({ owner: "intent-presets", ledger: "D1866", reason: "Pre-/at-commit output requires the server-created ephemeral ModuleDisclosureReceipt (§2.5, A16)." });
const CANDIDATE_BLOCKER: ModuleDependencyBlocker = Object.freeze({ owner: "shared-candidate-evidence-packet", ledger: "D745", reason: "Avoidance needs the complete legal-alternative population at the committed edge; the post-commit operation reads one edge." });
const WINDOW_BLOCKER: ModuleDependencyBlocker = Object.freeze({ owner: "recorded-semantic-path", ledger: "D1870", reason: "This v1 sequence/observed event derives from a multi-edge window; the recorded-path compiler emits only its v2 successor, and only over a Review branch." });
const REVIEW_OPERATION_BLOCKER: ModuleDependencyBlocker = Object.freeze({ owner: "review-map", ledger: "review-evidence-compiler D1", reason: "No Review Map production operation acquires this pair's sealed source yet; the final Review Map source-local admission policy (D928) decides which packet families it requests." });

export type ModulePairExecution =
  | { readonly module: ModuleId; readonly projection: VersionedEvidenceId; readonly status: "executable"; readonly operation: string; readonly timing: ModuleTiming }
  | { readonly module: ModuleId; readonly projection: VersionedEvidenceId; readonly status: "blocked_dependencies"; readonly blockers: readonly ModuleDependencyBlocker[] };

function pairBlockers(module: ModuleDeclaration, projection: VersionedEvidenceId): readonly ModuleDependencyBlocker[] {
  if (module.id === "postcommit_nudge") {
    if (projection.id.startsWith("derived.semantic_avoidance.")) return [CANDIDATE_BLOCKER, PRESENTATION_BLOCKER];
    if (SEQUENCE_EVENT_IDS.has(projection.id)) return [WINDOW_BLOCKER, PRESENTATION_BLOCKER];
  }
  // evidence-presentation Checkpoint A: a pair with a registered pair-keyed adapter is no longer
  // blocked on presentation; only its missing production operation remains.
  const presentable = presentationAdapter({ id: `module.${module.id}`, version: 1 }, projection) !== undefined;
  if (module.id === "review_map") return presentable ? [REVIEW_OPERATION_BLOCKER] : [REVIEW_OPERATION_BLOCKER, PRESENTATION_BLOCKER];
  const live = module.timings.some((value) => value.timing === "pre_commit" || value.timing === "at_commit");
  return live ? [RECEIPT_BLOCKER, QUERY_BLOCKER, PRESENTATION_BLOCKER] : [QUERY_BLOCKER, PRESENTATION_BLOCKER];
}

/** Every compiled module pair, each either executable through a named operation or blocked by name. */
export const MODULE_PAIR_EXECUTION: readonly ModulePairExecution[] = Object.freeze(MODULE_REGISTRY.modules.flatMap((module) => {
  if (module.accepts.kind !== "manifest") return [];
  const operation = MODULE_OPERATIONS.find((value) => value.module === module.id);
  return module.accepts.projections.map(({ projection }): ModulePairExecution => {
    const executable = operation?.projections.some((value) => refKey(value) === refKey(projection)) === true;
    return Object.freeze(executable
      ? { module: module.id, projection, status: "executable" as const, operation: operation!.operation, timing: operation!.timing }
      : { module: module.id, projection, status: "blocked_dependencies" as const, blockers: Object.freeze(pairBlockers(module, projection)) });
  });
}));

for (const operation of MODULE_OPERATIONS) {
  const accepted = new Set(MODULE_CONSUMER_ACCEPTS[operation.module as EvidenceModuleId].map(refKey));
  const outside = operation.projections.filter((value) => !accepted.has(refKey(value)));
  if (outside.length > 0) throw new ModuleRegistryInvariantError("MODULE_BINDING_DRIFT", `${operation.operation} routes ${outside.map(refKey).join(", ")} outside module.${operation.module}`);
}

/** The modules (and their reasons) that admit nothing at all today. */
export function blockedModules(): readonly { readonly module: ModuleId; readonly blockers: readonly ModuleDependencyBlocker[] }[] {
  return Object.freeze(MODULE_IDS.flatMap((id) => {
    const module = moduleDeclaration(id);
    return module.accepts.kind === "blocked_dependencies" ? [Object.freeze({ module: id, blockers: module.accepts.blockers })] : [];
  }));
}

export { EVIDENCE_MODULE_IDS, MODULE_CONSUMER_ACCEPTS, MODULE_CONSUMER_IDS };
