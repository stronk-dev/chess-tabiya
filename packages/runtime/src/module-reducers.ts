import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { permutePostcommitSummaryFacts } from "./internal/postcommit-summary-order.js";
import { orderModuleFactsByBaseKeys, type ModuleLiftEntry } from "./internal/module-fact-comparison.js";
export { POSTCOMMIT_OBSERVED_WINDOW_REFS, type ModuleLiftEntry } from "./internal/module-fact-comparison.js";

import {
  assertConsumerEvidenceView,
  assertDeclaredEvidence,
  type CompiledEvidenceManifest,
  type ConsumerEvidenceView,
  type DeclaredEvidence,
  type ProjectionDeclaration,
} from "./evidence-contract.js";
import { moduleAnswerImage, POSTCOMMIT_OBSERVED_WINDOW_POLICY, STRUCTURE_RECOGNITION_POLICY, type ModuleDeclaration, type ModuleId, type ModuleTiming } from "./module-contract.js";

export const MODULE_REDUCER_VERSION = "module-reducers@1" as const;

export interface ModuleFact<T = unknown> {
  readonly evidence: DeclaredEvidence<T>;
  readonly projection: ProjectionDeclaration;
  readonly retainedOperands: Readonly<Record<string, unknown>>;
  readonly subjectSquare: string | null;
  readonly eventId: string | null;
}

// Public summaries cannot relabel evidence or alter its source risk for the recognition policy.
// The shared admission constructor owns these immutable facts; copying one loses that ownership.
const originalModuleFacts = new WeakSet<object>();

export interface FactEquivalenceClass {
  readonly id: string;
  readonly projections: readonly string[];
  readonly comparedFields: readonly string[];
}

export interface SubsumptionDeclaration {
  readonly specific: string;
  readonly general: string;
  readonly comparedFields: readonly string[];
  readonly groundIsRules: true;
}

export const FACT_EQUIVALENCE_CLASSES: readonly FactEquivalenceClass[] = Object.freeze([
  Object.freeze({
    id: "structural.isolated_pawn",
    projections: Object.freeze([
      "rules.structural.predicate.isolated_pawn",
      "rules.structural.reading.isolated_pawn",
    ]),
    comparedFields: Object.freeze(["color", "file"]),
  }),
]);

export const SUBSUMPTION: readonly SubsumptionDeclaration[] = Object.freeze([
  Object.freeze({
    specific: "rules.transition.event.checkmate",
    general: "rules.tactic.event.check",
    comparedFields: Object.freeze(["nodeId", "moverColor"]),
    groundIsRules: true,
  }),
]);

export interface ReductionQualityObservation {
  readonly kind: "reduction_quality@1";
  readonly moduleId: ModuleId;
  readonly admitted: number;
  readonly afterReducers: number;
  readonly backstop: number;
  readonly dropped: number;
  readonly reducerVersion: typeof MODULE_REDUCER_VERSION;
  readonly noveltyAbstained: boolean;
}

export interface ReductionQualityRecorder {
  record(observation: ReductionQualityObservation): void;
}

export const NULL_REDUCTION_QUALITY_RECORDER: ReductionQualityRecorder = Object.freeze({
  record(): void { /* Production intentionally records nothing until a durable owner exists. */ },
});

export class ArrayReductionQualityRecorder implements ReductionQualityRecorder {
  readonly observations: ReductionQualityObservation[] = [];
  record(observation: ReductionQualityObservation): void {
    this.observations.push(Object.freeze({ ...observation }));
  }
}

export interface ModuleReductionResult<T = unknown> {
  readonly facts: readonly ModuleFact<T>[];
  readonly admitted: number;
  readonly afterReducers: number;
  readonly noveltyAbstained: boolean;
}

export interface ModuleReductionOptions<T = unknown> {
  readonly timing: ModuleTiming;
  /** Nearest ancestor first. Undefined means the run history cannot be read. */
  readonly ancestorFacts?: readonly (readonly ModuleFact<T>[])[];
  readonly recorder?: ReductionQualityRecorder;
}

const projectionKey = (value: { readonly id: string; readonly version: number }): string => `${value.id}@${value.version}`;

function objectPayload(value: unknown): Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : Object.freeze({ value });
}

function operandValue(payload: Readonly<Record<string, unknown>>, path: string): unknown {
  let value: unknown = payload;
  for (const segment of path.split(".")) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
    value = (value as Readonly<Record<string, unknown>>)[segment];
  }
  return value;
}

function retainedOperands(projection: ProjectionDeclaration, payload: unknown): Readonly<Record<string, unknown>> {
  const source = objectPayload(payload);
  return Object.freeze(Object.fromEntries(projection.operands
    .map((operand) => [operand, operandValue(source, operand)] as const)
    .filter((entry) => entry[1] !== undefined)));
}

function firstSquare(value: unknown): string | null {
  const squares: string[] = [];
  const visit = (candidate: unknown): void => {
    if (typeof candidate === "string" && /^[a-h][1-8]$/u.test(candidate)) squares.push(candidate);
    else if (Array.isArray(candidate)) candidate.forEach(visit);
    else if (typeof candidate === "object" && candidate !== null) Object.values(candidate).forEach(visit);
  };
  visit(value);
  return squares.sort((left, right) => left.localeCompare(right))[0] ?? null;
}

function eventIdentity(payload: Readonly<Record<string, unknown>>): string | null {
  for (const key of ["eventId", "id", "nodeId"] as const) {
    const value = payload[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

export function moduleFact<T>(manifest: CompiledEvidenceManifest, evidence: DeclaredEvidence<T>): ModuleFact<T> {
  assertDeclaredEvidence(evidence);
  const projection = manifest.projections.find((candidate) => projectionKey(candidate) === projectionKey(evidence.projection));
  if (projection === undefined || projectionKey(projection.producer) !== projectionKey(evidence.producer)) {
    throw new TypeError(`MODULE_FACT_UNDECLARED: ${projectionKey(evidence.projection)}`);
  }
  const operands = retainedOperands(projection, evidence.payload);
  const fact = Object.freeze({
    evidence,
    projection,
    retainedOperands: operands,
    subjectSquare: firstSquare(operands),
    eventId: eventIdentity(objectPayload(evidence.payload)),
  });
  originalModuleFacts.add(fact);
  return fact;
}

export function admitModuleFacts<T>(
  module: ModuleDeclaration,
  manifest: CompiledEvidenceManifest,
  view: ConsumerEvidenceView<T>,
  timing: ModuleTiming,
): readonly ModuleFact<T>[] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== module.consumer?.id || view.consumer.version !== module.consumer.version) throw new TypeError("MODULE_CONSUMER_MISMATCH: packet view does not belong to the module");
  if (!module.timings.some((candidate) => candidate.timing === timing)) return Object.freeze([]);
  if (module.accepts.kind !== "manifest") return Object.freeze([]);
  const allowed = new Map(module.accepts.projections.map((candidate) => [projectionKey(candidate.projection), candidate]));
  // rfc/module-registration.md §2.3(b): the module-level capability union is enforced at admission,
  // independently of any optional per-entry restriction, so no projection can widen the module.
  const image = moduleAnswerImage(module.answerCeiling);
  return Object.freeze(view.items.flatMap((evidence) => {
    const declaration = allowed.get(projectionKey(evidence.projection));
    if (declaration === undefined || declaration.timings !== undefined && !declaration.timings.includes(timing)) return [];
    const fact = moduleFact(manifest, evidence);
    if (fact.projection.answerContent.some((answer) => !image.includes(answer))) return [];
    if (declaration.answerContent !== undefined && fact.projection.answerContent.some((answer) => !declaration.answerContent!.includes(answer))) return [];
    if (declaration.denominatorRequired) {
      const payload = objectPayload(evidence.payload);
      // A complete-population avoidance declares its denominator as the literal `legalAlternatives`
      // operand (CounterfactualAbsenceOperands); a projection without it names `denominator`.
      const denominator = fact.projection.operands.includes("legalAlternatives") ? payload.legalAlternatives : payload.denominator;
      if (!Number.isSafeInteger(denominator) || Number(denominator) <= 0) return [];
    }
    return [fact];
  }));
}

export function orderAdmittedFacts<T>(
  module: ModuleDeclaration,
  facts: readonly ModuleFact<T>[],
  lifts: readonly ModuleLiftEntry[] = [],
): readonly ModuleFact<T>[] {
  const captured = [...facts];
  const observedWindowOrder = module.id === "postcommit_nudge" && module.consumer?.id === "module.postcommit_nudge" && module.consumer.version === 2
    && module.selection.policy.id === POSTCOMMIT_OBSERVED_WINDOW_POLICY.id && module.selection.policy.version === POSTCOMMIT_OBSERVED_WINDOW_POLICY.version;
  const recognitionOrder = module.id === "structure_nudge" && module.consumer?.id === "module.structure_nudge" && module.consumer.version === 2
    && projectionKey(module.selection.policy) === projectionKey(STRUCTURE_RECOGNITION_POLICY);
  if (recognitionOrder || observedWindowOrder) for (const fact of captured) {
    if (!originalModuleFacts.has(fact)) throw new TypeError("MODULE_FACT_UNOWNED: current selection requires the original admitted fact");
    assertDeclaredEvidence(fact.evidence);
    const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => projectionKey(row) === projectionKey(fact.evidence.projection));
    if (fact.projection !== declaration) throw new TypeError("MODULE_FACT_DECLARATION: current selection requires the original current catalogue declaration");
  }
  const ordered = orderModuleFactsByBaseKeys(module, captured, lifts);
  return observedWindowOrder ? permutePostcommitSummaryFacts(ordered) : ordered;
}

function equivalence(projectionId: string): FactEquivalenceClass | undefined {
  return FACT_EQUIVALENCE_CLASSES.find((candidate) => candidate.projections.includes(projectionId));
}

function selectedOperands(fact: ModuleFact, fields: readonly string[]): Readonly<Record<string, unknown>> {
  if (fields.length === 0) return fact.retainedOperands;
  return Object.freeze(Object.fromEntries(fields.map((field) => [field, operandValue(fact.retainedOperands, field)])));
}

export function factIdentity(fact: ModuleFact): string {
  const registered = equivalence(fact.projection.id);
  return `${registered?.id ?? fact.projection.id}:${canonicalizeJson(selectedOperands(fact, registered?.comparedFields ?? []))}`;
}

export function dedupeByFactIdentity<T>(facts: readonly ModuleFact<T>[]): readonly ModuleFact<T>[] {
  const seen = new Set<string>();
  return Object.freeze(facts.filter((fact) => {
    const identity = factIdentity(fact);
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  }));
}

function fieldsEqual(left: ModuleFact, right: ModuleFact, fields: readonly string[]): boolean {
  // 2026-09-24: an absent compared field is `undefined`, which RFC-8785 cannot encode; compare the
  // JSON image (absent ≡ omitted) instead of throwing mid-delivery (surfaced by the campaign kit).
  const image = (fact: ModuleFact) => JSON.parse(JSON.stringify(selectedOperands(fact, fields)) ?? "null") as unknown;
  return canonicalizeJson(image(left)) === canonicalizeJson(image(right));
}

export function applyDeclaredSubsumption<T>(facts: readonly ModuleFact<T>[]): readonly ModuleFact<T>[] {
  return Object.freeze(facts.filter((general) => !SUBSUMPTION.some((relation) =>
    general.projection.id === relation.general &&
    facts.some((specific) => specific.projection.id === relation.specific && fieldsEqual(specific, general, relation.comparedFields)))));
}

export function applyPositionNovelty<T>(
  module: ModuleDeclaration,
  facts: readonly ModuleFact<T>[],
  ancestorFacts: readonly (readonly ModuleFact<T>[])[] | undefined,
): { readonly facts: readonly ModuleFact<T>[]; readonly abstained: boolean } {
  if (module.noveltyWindow === 0) return Object.freeze({ facts: Object.freeze([...facts]), abstained: false });
  if (ancestorFacts === undefined) return Object.freeze({ facts: Object.freeze([...facts]), abstained: true });
  // The accepted RFC currently gives unregistered facts their full operand bytes as identity.
  // Event operands contain per-node anchors, so cross-node novelty would be unable to match them.
  // Until D1164 supplies stable compared fields, preserve the facts and report an abstention
  // instead of claiming that every anchored event is novel.
  if (facts.some((fact) => equivalence(fact.projection.id) === undefined)) {
    return Object.freeze({ facts: Object.freeze([...facts]), abstained: true });
  }
  const prior = new Set(ancestorFacts.slice(0, module.noveltyWindow).flatMap((packet) => packet.map(factIdentity)));
  return Object.freeze({ facts: Object.freeze(facts.filter((fact) => !prior.has(factIdentity(fact)))), abstained: false });
}

export function applyBackstop<T>(
  module: ModuleDeclaration,
  facts: readonly ModuleFact<T>[],
  admitted: number,
  noveltyAbstained: boolean,
  recorder: ReductionQualityRecorder = NULL_REDUCTION_QUALITY_RECORDER,
): readonly ModuleFact<T>[] {
  if (facts.length > module.budgets.maxFacts) {
    const observation: ReductionQualityObservation = Object.freeze({
      kind: "reduction_quality@1",
      moduleId: module.id,
      admitted,
      afterReducers: facts.length,
      backstop: module.budgets.maxFacts,
      dropped: facts.length - module.budgets.maxFacts,
      reducerVersion: MODULE_REDUCER_VERSION,
      noveltyAbstained,
    });
    try { recorder.record(observation); } catch { /* An instrument failure may never affect delivery. */ }
  }
  return Object.freeze(facts.slice(0, module.budgets.maxFacts));
}

export function reduceModulePacket<T>(
  module: ModuleDeclaration,
  manifest: CompiledEvidenceManifest,
  view: ConsumerEvidenceView<T>,
  options: ModuleReductionOptions<T>,
  lifts: readonly ModuleLiftEntry[] = [],
): ModuleReductionResult<T> {
  const admittedFacts = admitModuleFacts(module, manifest, view, options.timing);
  const ordered = orderAdmittedFacts(module, admittedFacts, lifts);
  const deduped = dedupeByFactIdentity(ordered);
  const subsumed = applyDeclaredSubsumption(deduped);
  const novelty = applyPositionNovelty(module, subsumed, options.ancestorFacts);
  return Object.freeze({
    facts: applyBackstop(module, novelty.facts, admittedFacts.length, novelty.abstained, options.recorder),
    admitted: admittedFacts.length,
    afterReducers: novelty.facts.length,
    noveltyAbstained: novelty.abstained,
  });
}
