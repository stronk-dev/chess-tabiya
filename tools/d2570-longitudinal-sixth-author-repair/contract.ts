import { createHash } from "node:crypto";

import { canonicalizeJson } from "../../packages/schema/src/drill-pack/digest.js";

export const PHASES = Object.freeze(["opening", "middlegame", "endgame", "unclear"] as const);
export const DECISION_CLASSES = Object.freeze(["played", "game", "predicted"] as const);
export const SESSION_KINDS = Object.freeze(["pack", "position", "imported"] as const);
export const SEMANTIC_SIGNS = Object.freeze([
  "state", "gained", "lost", "preserved", "removed", "avoided", "enabled", "threatened",
] as const);

export type DetectedPhase = (typeof PHASES)[number];
export type DecisionClass = (typeof DECISION_CLASSES)[number];
export type SessionKind = (typeof SESSION_KINDS)[number];
export type SemanticSign = (typeof SEMANTIC_SIGNS)[number];

export type DecisionRef =
  | Readonly<{ kind: "move"; nodeId: string; eventSeq: number }>
  | Readonly<{ kind: "prediction"; nodeId: string; checkpointId: string; eventSeq: number }>;

export interface LongitudinalDenominatorRow {
  readonly learnerId: string;
  readonly runId: string;
  readonly phase: DetectedPhase;
  readonly decisionClass: DecisionClass;
  readonly decisions: number;
  readonly observedAt: string;
  readonly derivedRev: number;
}

export interface LongitudinalObservationRow extends LongitudinalDenominatorRow {
  readonly projectionId: string;
  readonly projectionVersion: number;
  readonly semanticSign: SemanticSign;
  readonly sourceSign: SemanticSign;
  readonly sessionKind: SessionKind;
  readonly packId: string | null;
  readonly opportunities: number;
  readonly occurred: number;
  readonly alternativeShareSum: number;
  readonly occurredRefs: readonly DecisionRef[];
  readonly opportunityRefs: readonly DecisionRef[];
}

export interface LongitudinalStructureStatRow {
  readonly learnerId: string;
  readonly runId: string;
  readonly rootKey: string;
  readonly rootNodeId: string;
  readonly sessionKind: SessionKind;
  readonly packId: string | null;
  readonly branchCount: number;
  readonly rewoundCount: number;
  readonly forkedCount: number;
  readonly groupCount: number;
  readonly outcomeCount: number;
  readonly observedAt: string;
  readonly derivedRev: number;
}

type RecordValue = Readonly<Record<string, unknown>>;

function record(value: unknown, code: string): RecordValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(code);
  return value as RecordValue;
}

function exactKeys(value: RecordValue, keys: readonly string[], code: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) throw new TypeError(code);
}

function string(value: unknown, code: string): string {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(code);
  return value;
}

function integer(value: unknown, minimum: number, code: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < minimum) throw new TypeError(code);
  return Number(value);
}

function member<const Values extends readonly string[]>(value: unknown, values: Values, code: string): Values[number] {
  if (typeof value !== "string" || !values.includes(value)) throw new TypeError(code);
  return value as Values[number];
}

function isoInstant(value: unknown, code: string): string {
  const parsed = string(value, code);
  const milliseconds = Date.parse(parsed);
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString() !== parsed) throw new TypeError(code);
  return parsed;
}

function parseDecisionRef(value: unknown): DecisionRef {
  const input = record(value, "LONGITUDINAL_REF_INVALID");
  if (input.kind === "move") {
    exactKeys(input, ["kind", "nodeId", "eventSeq"], "LONGITUDINAL_REF_INVALID");
    return Object.freeze({ kind: "move", nodeId: string(input.nodeId, "LONGITUDINAL_REF_INVALID"), eventSeq: integer(input.eventSeq, 1, "LONGITUDINAL_REF_INVALID") });
  }
  if (input.kind === "prediction") {
    exactKeys(input, ["kind", "nodeId", "checkpointId", "eventSeq"], "LONGITUDINAL_REF_INVALID");
    return Object.freeze({ kind: "prediction", nodeId: string(input.nodeId, "LONGITUDINAL_REF_INVALID"), checkpointId: string(input.checkpointId, "LONGITUDINAL_REF_INVALID"), eventSeq: integer(input.eventSeq, 1, "LONGITUDINAL_REF_INVALID") });
  }
  throw new TypeError("LONGITUDINAL_REF_INVALID");
}

function refKey(ref: DecisionRef): string {
  return `${String(ref.eventSeq).padStart(16, "0")}\0${ref.kind}\0${ref.nodeId}\0${ref.kind === "prediction" ? ref.checkpointId : ""}`;
}

function parseRefs(value: unknown): readonly DecisionRef[] {
  if (!Array.isArray(value)) throw new TypeError("LONGITUDINAL_REFS_INVALID");
  const refs = value.map(parseDecisionRef);
  const keys = refs.map(refKey);
  if (new Set(keys).size !== keys.length || keys.some((key, index) => index > 0 && keys[index - 1]! >= key)) throw new TypeError("LONGITUDINAL_REFS_INVALID");
  return Object.freeze(refs);
}

const denominatorKeys = ["learnerId", "runId", "phase", "decisionClass", "decisions", "observedAt", "derivedRev"] as const;

export function parseLongitudinalDenominatorRow(value: unknown): LongitudinalDenominatorRow {
  const input = record(value, "LONGITUDINAL_DENOMINATOR_INVALID");
  exactKeys(input, denominatorKeys, "LONGITUDINAL_DENOMINATOR_INVALID");
  return Object.freeze({
    learnerId: string(input.learnerId, "LONGITUDINAL_DENOMINATOR_INVALID"),
    runId: string(input.runId, "LONGITUDINAL_DENOMINATOR_INVALID"),
    phase: member(input.phase, PHASES, "LONGITUDINAL_DENOMINATOR_INVALID"),
    decisionClass: member(input.decisionClass, DECISION_CLASSES, "LONGITUDINAL_DENOMINATOR_INVALID"),
    decisions: integer(input.decisions, 1, "LONGITUDINAL_DENOMINATOR_INVALID"),
    observedAt: isoInstant(input.observedAt, "LONGITUDINAL_DENOMINATOR_INVALID"),
    derivedRev: integer(input.derivedRev, 1, "LONGITUDINAL_DENOMINATOR_INVALID"),
  });
}

export interface ProjectionAdmission {
  readonly id: string;
  readonly version: number;
  readonly pairs: readonly Readonly<{ semanticSign: SemanticSign; sourceSign: SemanticSign }>[];
}

function admitted(admissions: readonly ProjectionAdmission[], id: string, version: number, semanticSign: SemanticSign, sourceSign: SemanticSign): boolean {
  return admissions.some((projection) => projection.id === id && projection.version === version && projection.pairs.some((pair) => pair.semanticSign === semanticSign && pair.sourceSign === sourceSign));
}

const observationKeys = [
  ...denominatorKeys, "projectionId", "projectionVersion", "semanticSign", "sourceSign",
  "sessionKind", "packId", "opportunities", "occurred", "alternativeShareSum",
  "occurredRefs", "opportunityRefs",
] as const;

export function parseLongitudinalObservationRow(value: unknown, admissions: readonly ProjectionAdmission[]): LongitudinalObservationRow {
  const input = record(value, "LONGITUDINAL_OBSERVATION_INVALID");
  exactKeys(input, observationKeys, "LONGITUDINAL_OBSERVATION_INVALID");
  const denominator = parseLongitudinalDenominatorRow(Object.fromEntries(denominatorKeys.map((key) => [key, input[key]])));
  const projectionId = string(input.projectionId, "LONGITUDINAL_OBSERVATION_INVALID");
  const projectionVersion = integer(input.projectionVersion, 1, "LONGITUDINAL_OBSERVATION_INVALID");
  const semanticSign = member(input.semanticSign, SEMANTIC_SIGNS, "LONGITUDINAL_OBSERVATION_INVALID");
  const sourceSign = member(input.sourceSign, SEMANTIC_SIGNS, "LONGITUDINAL_OBSERVATION_INVALID");
  if (!admitted(admissions, projectionId, projectionVersion, semanticSign, sourceSign)) throw new TypeError("LONGITUDINAL_PROJECTION_SIGN_UNKNOWN");
  const sessionKind = member(input.sessionKind, SESSION_KINDS, "LONGITUDINAL_OBSERVATION_INVALID");
  const packId = input.packId === null ? null : string(input.packId, "LONGITUDINAL_OBSERVATION_INVALID");
  if ((sessionKind === "pack") !== (packId !== null)) throw new TypeError("LONGITUDINAL_PACK_PROVENANCE_INVALID");
  const opportunities = integer(input.opportunities, 1, "LONGITUDINAL_OBSERVATION_INVALID");
  const occurred = integer(input.occurred, 0, "LONGITUDINAL_OBSERVATION_INVALID");
  if (occurred > opportunities || typeof input.alternativeShareSum !== "number" || !Number.isFinite(input.alternativeShareSum) || input.alternativeShareSum < 0 || input.alternativeShareSum > opportunities) throw new TypeError("LONGITUDINAL_COUNTS_INVALID");
  const occurredRefs = parseRefs(input.occurredRefs);
  const opportunityRefs = parseRefs(input.opportunityRefs);
  if (occurredRefs.length !== occurred || opportunityRefs.length !== opportunities) throw new TypeError("LONGITUDINAL_REF_COUNT_MISMATCH");
  const opportunityKeys = new Set(opportunityRefs.map(refKey));
  if (occurredRefs.some((ref) => !opportunityKeys.has(refKey(ref)))) throw new TypeError("LONGITUDINAL_OCCURRED_NOT_OPPORTUNITY");
  return Object.freeze({ ...denominator, projectionId, projectionVersion, semanticSign, sourceSign, sessionKind, packId, opportunities, occurred, alternativeShareSum: input.alternativeShareSum, occurredRefs, opportunityRefs });
}

const structureKeys = [
  "learnerId", "runId", "rootKey", "rootNodeId", "sessionKind", "packId", "branchCount",
  "rewoundCount", "forkedCount", "groupCount", "outcomeCount", "observedAt", "derivedRev",
] as const;

export function parseLongitudinalStructureStatRow(value: unknown): LongitudinalStructureStatRow {
  const input = record(value, "LONGITUDINAL_STRUCTURE_INVALID");
  exactKeys(input, structureKeys, "LONGITUDINAL_STRUCTURE_INVALID");
  const sessionKind = member(input.sessionKind, SESSION_KINDS, "LONGITUDINAL_STRUCTURE_INVALID");
  const packId = input.packId === null ? null : string(input.packId, "LONGITUDINAL_STRUCTURE_INVALID");
  if ((sessionKind === "pack") !== (packId !== null)) throw new TypeError("LONGITUDINAL_PACK_PROVENANCE_INVALID");
  return Object.freeze({
    learnerId: string(input.learnerId, "LONGITUDINAL_STRUCTURE_INVALID"), runId: string(input.runId, "LONGITUDINAL_STRUCTURE_INVALID"),
    rootKey: string(input.rootKey, "LONGITUDINAL_STRUCTURE_INVALID"), rootNodeId: string(input.rootNodeId, "LONGITUDINAL_STRUCTURE_INVALID"),
    sessionKind, packId, branchCount: integer(input.branchCount, 1, "LONGITUDINAL_STRUCTURE_INVALID"),
    rewoundCount: integer(input.rewoundCount, 0, "LONGITUDINAL_STRUCTURE_INVALID"), forkedCount: integer(input.forkedCount, 0, "LONGITUDINAL_STRUCTURE_INVALID"),
    groupCount: integer(input.groupCount, 0, "LONGITUDINAL_STRUCTURE_INVALID"), outcomeCount: integer(input.outcomeCount, 0, "LONGITUDINAL_STRUCTURE_INVALID"),
    observedAt: isoInstant(input.observedAt, "LONGITUDINAL_STRUCTURE_INVALID"), derivedRev: integer(input.derivedRev, 1, "LONGITUDINAL_STRUCTURE_INVALID"),
  });
}

export type StructureAttributionV2 = "single_player" | "unattributable_shared" | "unattributable_legacy";

export interface LongitudinalSourceImageV2 {
  readonly version: 2;
  readonly runPrefix: unknown;
  readonly ownerLearnerId: string;
  readonly moveAuthorship: readonly Readonly<{ eventSeq: number; nodeId: string; learnerId: string | null }>[];
  readonly importedMainlinePlies: number | null;
  readonly structureAttribution: StructureAttributionV2;
}

export const LONGITUDINAL_SOURCE_MUTATION_OPERATIONS = Object.freeze([
  "create", "createRatedRun", "createImportedRun", "createDerivedRun", "createRepertoireGapRun",
  "save", "saveArenaImport", "createLiveSession", "grantRole", "deleteOwnedRun", "deleteLearner",
  "startupLegacyClassification",
] as const);

export function sourceDigestV2(image: LongitudinalSourceImageV2): `sha256:${string}` {
  return `sha256:${createHash("sha256").update("tabiya.longitudinal-source.v2\0", "utf8").update(canonicalizeJson(image), "utf8").digest("hex")}`;
}

export interface ModeledJob {
  readonly requestedSeq: number;
  readonly requestedSourceDigest: `sha256:${string}`;
  readonly completedSeq: number;
  readonly state: "pending" | "complete";
  readonly claimGeneration: number;
}

export function taintStructureAttribution(current: StructureAttributionV2): StructureAttributionV2 {
  return current === "unattributable_legacy" ? current : "unattributable_shared";
}

export function invalidateForSourceImage(job: ModeledJob, prior: LongitudinalSourceImageV2, next: LongitudinalSourceImageV2): ModeledJob {
  const priorDigest = sourceDigestV2(prior);
  if (job.requestedSourceDigest !== priorDigest) throw new TypeError("LONGITUDINAL_PRIOR_DIGEST_MISMATCH");
  const nextDigest = sourceDigestV2(next);
  if (nextDigest === priorDigest) return job;
  return Object.freeze({ requestedSeq: job.requestedSeq, requestedSourceDigest: nextDigest, completedSeq: 0, state: "pending", claimGeneration: job.claimGeneration + 1 });
}

export const REVISION_ONE_IMPORTED_MAINLINE_DISPOSITION = "observed_only" as const;

export function revisionOnePersonalPlayAdmitted(decisionClass: DecisionClass): boolean {
  return decisionClass === "played";
}

export interface LongitudinalReadFilter {
  readonly projections?: readonly Readonly<{ id: string; version: number; semanticSign?: SemanticSign; sourceSign?: SemanticSign }>[];
  readonly phases?: readonly DetectedPhase[];
  readonly decisionClasses?: readonly DecisionClass[];
  readonly sessionKinds?: readonly SessionKind[];
  readonly packIds?: readonly string[];
}

export interface LongitudinalReadQuery {
  readonly learnerId: string;
  readonly derivationRev: number;
  readonly through: Readonly<{ kind: "all_complete" }> | Readonly<{ kind: "runs"; cuts: readonly Readonly<{ runId: string; requestedSeq: number }>[] }>;
  readonly filter: LongitudinalReadFilter;
}

declare const queryBrand: unique symbol;
export type ParsedLongitudinalReadQuery = LongitudinalReadQuery & Readonly<{ [queryBrand]: true }>;
const parsedQueries = new WeakSet<object>();

export function assertParsedLongitudinalReadQuery(value: unknown): asserts value is ParsedLongitudinalReadQuery {
  if (value === null || typeof value !== "object" || !parsedQueries.has(value)) throw new TypeError("LONGITUDINAL_QUERY_UNPARSED");
}

function nonEmptyUniqueMembers<const Values extends readonly string[]>(value: unknown, values: Values, code: string): readonly Values[number][] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length === 0) throw new TypeError(code);
  const parsed = value.map((item) => member(item, values, code));
  if (new Set(parsed).size !== parsed.length) throw new TypeError(code);
  return Object.freeze(parsed.sort());
}

function nonEmptyUniqueStrings(value: unknown, code: string): readonly string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length === 0) throw new TypeError(code);
  const parsed = value.map((item) => string(item, code));
  if (new Set(parsed).size !== parsed.length) throw new TypeError(code);
  return Object.freeze(parsed.sort());
}

export function parseLongitudinalReadQuery(value: unknown, admissions: readonly ProjectionAdmission[]): ParsedLongitudinalReadQuery {
  const input = record(value, "LONGITUDINAL_QUERY_INVALID");
  exactKeys(input, ["learnerId", "derivationRev", "through", "filter"], "LONGITUDINAL_QUERY_INVALID");
  const throughInput = record(input.through, "LONGITUDINAL_QUERY_INVALID");
  let through: LongitudinalReadQuery["through"];
  if (throughInput.kind === "all_complete") {
    exactKeys(throughInput, ["kind"], "LONGITUDINAL_QUERY_INVALID");
    through = Object.freeze({ kind: "all_complete" });
  } else if (throughInput.kind === "runs") {
    exactKeys(throughInput, ["kind", "cuts"], "LONGITUDINAL_QUERY_INVALID");
    if (!Array.isArray(throughInput.cuts) || throughInput.cuts.length === 0) throw new TypeError("LONGITUDINAL_CUTS_INVALID");
    const cuts = throughInput.cuts.map((cut) => {
      const parsed = record(cut, "LONGITUDINAL_CUTS_INVALID");
      exactKeys(parsed, ["runId", "requestedSeq"], "LONGITUDINAL_CUTS_INVALID");
      return Object.freeze({ runId: string(parsed.runId, "LONGITUDINAL_CUTS_INVALID"), requestedSeq: integer(parsed.requestedSeq, 1, "LONGITUDINAL_CUTS_INVALID") });
    }).sort((left, right) => left.runId < right.runId ? -1 : left.runId > right.runId ? 1 : 0);
    if (new Set(cuts.map((cut) => cut.runId)).size !== cuts.length) throw new TypeError("LONGITUDINAL_CUTS_INVALID");
    through = Object.freeze({ kind: "runs", cuts: Object.freeze(cuts) });
  } else throw new TypeError("LONGITUDINAL_QUERY_INVALID");

  const filterInput = record(input.filter, "LONGITUDINAL_FILTER_INVALID");
  const filterKeys = Object.keys(filterInput);
  if (filterKeys.some((key) => !["projections", "phases", "decisionClasses", "sessionKinds", "packIds"].includes(key))) throw new TypeError("LONGITUDINAL_FILTER_INVALID");
  let projections: LongitudinalReadFilter["projections"];
  if (filterInput.projections !== undefined) {
    if (!Array.isArray(filterInput.projections) || filterInput.projections.length === 0) throw new TypeError("LONGITUDINAL_FILTER_EMPTY");
    const parsed = filterInput.projections.map((item) => {
      const projection = record(item, "LONGITUDINAL_FILTER_PROJECTION_INVALID");
      const allowed = ["id", "version", "semanticSign", "sourceSign"];
      if (Object.keys(projection).some((key) => !allowed.includes(key))) throw new TypeError("LONGITUDINAL_FILTER_PROJECTION_INVALID");
      for (const required of ["id", "version"]) if (!(required in projection)) throw new TypeError("LONGITUDINAL_FILTER_PROJECTION_INVALID");
      const id = string(projection.id, "LONGITUDINAL_FILTER_PROJECTION_INVALID");
      const version = integer(projection.version, 1, "LONGITUDINAL_FILTER_PROJECTION_INVALID");
      const semanticSign = projection.semanticSign === undefined ? undefined : member(projection.semanticSign, SEMANTIC_SIGNS, "LONGITUDINAL_FILTER_PROJECTION_INVALID");
      const sourceSign = projection.sourceSign === undefined ? undefined : member(projection.sourceSign, SEMANTIC_SIGNS, "LONGITUDINAL_FILTER_PROJECTION_INVALID");
      const declaration = admissions.find((candidate) => candidate.id === id && candidate.version === version);
      if (declaration === undefined || !declaration.pairs.some((pair) => (semanticSign === undefined || pair.semanticSign === semanticSign) && (sourceSign === undefined || pair.sourceSign === sourceSign))) throw new TypeError("LONGITUDINAL_FILTER_PROJECTION_UNKNOWN");
      return Object.freeze({ id, version, ...(semanticSign === undefined ? {} : { semanticSign }), ...(sourceSign === undefined ? {} : { sourceSign }) });
    }).sort((left, right) => {
      const leftKey = canonicalizeJson(left);
      const rightKey = canonicalizeJson(right);
      return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
    });
    const keys = parsed.map(canonicalizeJson);
    if (new Set(keys).size !== keys.length) throw new TypeError("LONGITUDINAL_FILTER_DUPLICATE");
    projections = Object.freeze(parsed);
  }
  const phases = nonEmptyUniqueMembers(filterInput.phases, PHASES, "LONGITUDINAL_FILTER_PHASE_INVALID");
  const decisionClasses = nonEmptyUniqueMembers(filterInput.decisionClasses, DECISION_CLASSES, "LONGITUDINAL_FILTER_CLASS_INVALID");
  const sessionKinds = nonEmptyUniqueMembers(filterInput.sessionKinds, SESSION_KINDS, "LONGITUDINAL_FILTER_SESSION_INVALID");
  const packIds = nonEmptyUniqueStrings(filterInput.packIds, "LONGITUDINAL_FILTER_PACK_INVALID");
  if (packIds !== undefined && sessionKinds !== undefined && !sessionKinds.includes("pack")) throw new TypeError("LONGITUDINAL_FILTER_CONTRADICTORY");
  const filter = Object.freeze({ ...(projections === undefined ? {} : { projections }), ...(phases === undefined ? {} : { phases }), ...(decisionClasses === undefined ? {} : { decisionClasses }), ...(sessionKinds === undefined ? {} : { sessionKinds }), ...(packIds === undefined ? {} : { packIds }) });
  const parsed = Object.freeze({ learnerId: string(input.learnerId, "LONGITUDINAL_QUERY_INVALID"), derivationRev: integer(input.derivationRev, 1, "LONGITUDINAL_QUERY_INVALID"), through, filter }) as ParsedLongitudinalReadQuery;
  parsedQueries.add(parsed);
  return parsed;
}
