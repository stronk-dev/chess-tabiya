import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";

import {
  assertConsumerEvidenceView,
  assertDeclaredEvidence,
  type CompiledEvidenceManifest,
  type ConsumerEvidenceView,
  type DeclaredEvidence,
  type ProjectionDeclaration,
} from "./evidence-contract.js";
import type { ModuleDeclaration, ModuleId, ModuleTiming } from "./module-contract.js";

export const MODULE_REDUCER_VERSION = "module-reducers@1" as const;

export interface ModuleFact<T = unknown> {
  readonly evidence: DeclaredEvidence<T>;
  readonly projection: ProjectionDeclaration;
  readonly retainedOperands: Readonly<Record<string, unknown>>;
  readonly subjectSquare: string | null;
  readonly eventId: string | null;
}

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
  return Object.freeze({
    evidence,
    projection,
    retainedOperands: operands,
    subjectSquare: firstSquare(operands),
    eventId: eventIdentity(objectPayload(evidence.payload)),
  });
}

export function admitModuleFacts<T>(
  module: ModuleDeclaration,
  manifest: CompiledEvidenceManifest,
  view: ConsumerEvidenceView<T>,
  timing: ModuleTiming,
): readonly ModuleFact<T>[] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== `module.${module.id}` || view.consumer.version !== 1) throw new TypeError("MODULE_CONSUMER_MISMATCH: packet view does not belong to the module");
  if (!module.timings.some((candidate) => candidate.timing === timing)) return Object.freeze([]);
  if (module.accepts.kind === "none") return Object.freeze([]);
  const allowed = new Map(module.accepts.projections.map((candidate) => [projectionKey(candidate.projection), candidate]));
  return Object.freeze(view.items.flatMap((evidence) => {
    const declaration = allowed.get(projectionKey(evidence.projection));
    if (declaration === undefined || declaration.timings !== undefined && !declaration.timings.includes(timing)) return [];
    const fact = moduleFact(manifest, evidence);
    if (declaration.answerContent !== undefined && fact.projection.answerContent.some((answer) => !declaration.answerContent!.includes(answer))) return [];
    if (declaration.denominatorRequired) {
      const payload = objectPayload(evidence.payload);
      const denominator = payload.denominator;
      if (!Number.isSafeInteger(denominator) || Number(denominator) <= 0) return [];
    }
    return [fact];
  }));
}

const exactnessOrder: Readonly<Record<ProjectionDeclaration["exactness"], number>> = Object.freeze({
  exact: 0,
  convention: 1,
  measured: 2,
  authored: 3,
});

const criticalProjectionIds = new Set([
  "rules.transition.event.checkmate",
  "rules.transition.event.promotion",
  "rules.transition.event.castled",
  "rules.transition.event.last_of_role",
]);

export interface ModuleLiftEntry {
  readonly projectionId: string;
  readonly lift: number;
  readonly source: string;
  readonly measuredAt: string;
  readonly corpus: string;
}

export function orderAdmittedFacts<T>(
  module: ModuleDeclaration,
  facts: readonly ModuleFact<T>[],
  lifts: readonly ModuleLiftEntry[] = [],
): readonly ModuleFact<T>[] {
  const familyOrder = new Map(module.selection.familyPrecedence.map((projection, index) => [projectionKey(projection), index]));
  const lift = new Map(lifts.map((entry) => [entry.projectionId, entry]));
  for (const entry of lifts) {
    if (!Number.isFinite(entry.lift) || entry.lift < 0 || entry.source.trim() === "" || entry.measuredAt.trim() === "" || entry.corpus.trim() === "") {
      throw new TypeError(`MODULE_LIFT_INVALID: ${entry.projectionId}`);
    }
  }
  return Object.freeze([...facts].sort((left, right) => {
    const critical = Number(criticalProjectionIds.has(right.projection.id)) - Number(criticalProjectionIds.has(left.projection.id));
    if (critical !== 0) return critical;
    const exactness = exactnessOrder[left.projection.exactness] - exactnessOrder[right.projection.exactness];
    if (exactness !== 0) return exactness;
    const leftLift = lift.get(left.projection.id)?.lift;
    const rightLift = lift.get(right.projection.id)?.lift;
    if (leftLift !== undefined || rightLift !== undefined) {
      if (leftLift === undefined) return 1;
      if (rightLift === undefined) return -1;
      if (leftLift !== rightLift) return rightLift - leftLift;
    }
    const precedence = (familyOrder.get(projectionKey(left.projection)) ?? Number.MAX_SAFE_INTEGER) - (familyOrder.get(projectionKey(right.projection)) ?? Number.MAX_SAFE_INTEGER);
    if (precedence !== 0) return precedence;
    const square = (left.subjectSquare ?? "z9").localeCompare(right.subjectSquare ?? "z9");
    if (square !== 0) return square;
    const event = (left.eventId ?? "").localeCompare(right.eventId ?? "");
    if (event !== 0) return event;
    return canonicalizeJson(left.retainedOperands).localeCompare(canonicalizeJson(right.retainedOperands));
  }));
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
  return canonicalizeJson(selectedOperands(left, fields)) === canonicalizeJson(selectedOperands(right, fields));
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
