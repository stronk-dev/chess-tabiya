/**
 * Executable semantic-validation authority (rfc/semantic-validation-authority.md, Slice A).
 *
 * This module is the pure half of the authority: closed subject/profile/case/receipt types, their
 * strict parsers, the projection-derived root inventory, the four-way root/declaration/profile/
 * verdict equality, the registry subset joins, whole-collection fact constraints and the total
 * mirror comparator. It imports no production semantic operation, no case registry and no file
 * system, so the runtime barrel may export verdict lookup without carrying a fixture position.
 *
 * Execution lives in `semantic-validation-runner.ts` (never barrel-exported); generated verdicts
 * live in `semantic-validation-receipt.generated.ts`, written only by `make semantic-validation-update`.
 */
import { makeFen, parseFen } from "chessops/fen";
import { SquareSet } from "chessops/squareSet";
import type { Color, Role, Square } from "chessops/types";
import { makeSquare, parseSquare } from "chessops/util";

import { evidenceDigest, type CompiledEvidenceManifest, type ProjectionDeclaration, type VersionedEvidenceId } from "./evidence-contract.js";

// ---------------------------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------------------------

export type SemanticValidationErrorCode =
  | "SEMANTIC_VALIDATION_ROOT_MISMATCH"
  | "SEMANTIC_VALIDATION_DUPLICATE"
  | "SEMANTIC_VALIDATION_PROFILE_INVALID"
  | "SEMANTIC_VALIDATION_CASE_MISSING"
  | "SEMANTIC_VALIDATION_CASE_REF_STALE"
  | "SEMANTIC_VALIDATION_CASE_INVALID"
  | "SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID"
  | "SEMANTIC_VALIDATION_FIXTURE_INVALID"
  | "SEMANTIC_VALIDATION_POSITIVE_EMPTY"
  | "SEMANTIC_VALIDATION_NEGATIVE_EMITTED"
  | "SEMANTIC_VALIDATION_EXPECTATION_UNMET"
  | "SEMANTIC_VALIDATION_ORIENTATION_INCOMPLETE"
  | "SEMANTIC_VALIDATION_ORIENTATION_SCHEMA"
  | "SEMANTIC_VALIDATION_MIRROR_EMPTY"
  | "SEMANTIC_VALIDATION_MIRROR_MISMATCH"
  | "SEMANTIC_VALIDATION_MIRROR_AMBIGUOUS"
  | "SEMANTIC_VALIDATION_MIRROR_UNMATCHED"
  | "SEMANTIC_VALIDATION_POPULATION_STALE"
  | "SEMANTIC_VALIDATION_POPULATION_INCOMPLETE"
  | "SEMANTIC_VALIDATION_VALUE_AUTHORITY_MISSING"
  | "SEMANTIC_VALIDATION_AUTHORITY_INVALID"
  | "SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID"
  | "SEMANTIC_VALIDATION_FACT_CONSTRAINT_UNSATISFIED"
  | "SEMANTIC_VALIDATION_OWNER_STORE_INVALID"
  | "SEMANTIC_VALIDATION_OWNER_TRANSITION"
  | "SEMANTIC_VALIDATION_REACH_INVALID"
  | "SEMANTIC_VALIDATION_OPERATION_FORBIDDEN";

export class SemanticValidationError extends TypeError {
  readonly code: SemanticValidationErrorCode;
  constructor(code: SemanticValidationErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = "SemanticValidationError";
    this.code = code;
  }
}

const fail = (code: SemanticValidationErrorCode, message: string): never => {
  throw new SemanticValidationError(code, message);
};

// ---------------------------------------------------------------------------------------------
// Primitive parsers
// ---------------------------------------------------------------------------------------------

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => typeof value === "object" && value !== null && !Array.isArray(value);

function exactKeys(value: unknown, required: readonly string[], optional: readonly string[] = [], label = "value", code: SemanticValidationErrorCode = "SEMANTIC_VALIDATION_CASE_INVALID"): Readonly<Record<string, unknown>> {
  if (!isRecord(value)) return fail(code, `${label} must be an object`);
  const keys = Object.keys(value);
  const allowed = new Set([...required, ...optional]);
  const extra = keys.filter((key) => !allowed.has(key));
  const missing = required.filter((key) => !(key in value));
  if (extra.length > 0 || missing.length > 0) fail(code, `${label} keys are not exact${extra.length > 0 ? `; extra: ${extra.join(", ")}` : ""}${missing.length > 0 ? `; missing: ${missing.join(", ")}` : ""}`);
  return value;
}

/** Discriminant first: a ref of the wrong kind is a stale/crossed ref, not a malformed object. */
function refKind(value: unknown, expected: string, arm: string): void {
  if (!isRecord(value) || value.kind !== expected) fail("SEMANTIC_VALIDATION_CASE_REF_STALE", `the ${arm} cell accepts only ${expected} refs (got ${isRecord(value) ? String(value.kind) : typeof value})`);
}

const BASE_ID = /^[a-z0-9][a-z0-9._:/-]*$/u;
const VERSION_SUFFIX = /@\d+$/u;

/** A base id: no `@N` suffix, no generated-label template, printable identifier bytes. */
export function parseBaseId(value: unknown, label: string): string {
  if (typeof value !== "string" || !BASE_ID.test(value) || VERSION_SUFFIX.test(value)) {
    return fail("SEMANTIC_VALIDATION_CASE_REF_STALE", `${label} must be a base id without an @<version> suffix (got ${JSON.stringify(value)})`);
  }
  return value;
}

function parseVersionOne(value: unknown, label: string): 1 {
  if (value !== 1) return fail("SEMANTIC_VALIDATION_CASE_REF_STALE", `${label} version must be exactly 1 (got ${JSON.stringify(value)})`);
  return 1;
}

function parseText(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") return fail("SEMANTIC_VALIDATION_CASE_INVALID", `${label} must be a non-empty string`);
  return value;
}

const SHA256 = /^[0-9a-f]{64}$/u;
function parseSha(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) return fail("SEMANTIC_VALIDATION_CASE_INVALID", `${label} must be a lowercase SHA-256`);
  return value;
}

export function parseVersionedEvidenceId(value: unknown, label = "projection"): VersionedEvidenceId {
  const record = exactKeys(value, ["id", "version"], [], label);
  if (typeof record.id !== "string" || record.id === "" || VERSION_SUFFIX.test(record.id)) fail("SEMANTIC_VALIDATION_CASE_REF_STALE", `${label}.id must be a base projection id`);
  if (!Number.isSafeInteger(record.version) || (record.version as number) < 1) fail("SEMANTIC_VALIDATION_CASE_REF_STALE", `${label}.version must be a positive integer`);
  return Object.freeze({ id: record.id as string, version: record.version as number });
}

const refKey = (value: VersionedEvidenceId): string => `${value.id}@${value.version}`;

// ---------------------------------------------------------------------------------------------
// §R1 Subjects
// ---------------------------------------------------------------------------------------------

export type SemanticValidationSubjectKind = "event" | "reading";

export interface SemanticValidationSubject {
  readonly kind: SemanticValidationSubjectKind;
  readonly projection: VersionedEvidenceId;
}

export function parseSemanticValidationSubject(value: unknown): SemanticValidationSubject {
  const record = exactKeys(value, ["kind", "projection"], [], "subject");
  if (record.kind !== "event" && record.kind !== "reading") fail("SEMANTIC_VALIDATION_CASE_INVALID", `subject.kind must be event or reading`);
  return Object.freeze({ kind: record.kind as SemanticValidationSubjectKind, projection: parseVersionedEvidenceId(record.projection, "subject.projection") });
}

/** `kind:id@version` — the one join key every equal population uses (§R2). */
export function semanticValidationSubjectKey(subject: SemanticValidationSubject): string {
  return `${subject.kind}:${refKey(subject.projection)}`;
}

const sameSubject = (left: SemanticValidationSubject, right: SemanticValidationSubject): boolean => semanticValidationSubjectKey(left) === semanticValidationSubjectKey(right);

// ---------------------------------------------------------------------------------------------
// §3.1 Arms, cells and profiles
// ---------------------------------------------------------------------------------------------

export const SEMANTIC_VALIDATION_ARMS = Object.freeze(["positive", "semantic_negative", "orientation", "counterfactual", "imported_population", "external_label"] as const);
export type SemanticValidationArm = (typeof SEMANTIC_VALIDATION_ARMS)[number];
export type SemanticValidationCaseArm = Exclude<SemanticValidationArm, "imported_population" | "external_label">;
export const SEMANTIC_VALIDATION_CASE_ARMS: readonly SemanticValidationCaseArm[] = Object.freeze(["positive", "semantic_negative", "orientation", "counterfactual"]);

/** Profile JSON keys, in closed order, and the arm each carries. */
export const SEMANTIC_VALIDATION_PROFILE_CELLS = Object.freeze([
  ["positive", "positive"],
  ["semanticNegative", "semantic_negative"],
  ["orientation", "orientation"],
  ["counterfactual", "counterfactual"],
  ["importedPopulation", "imported_population"],
  ["externalLabel", "external_label"],
] as const);
export type SemanticValidationProfileCellKey = (typeof SEMANTIC_VALIDATION_PROFILE_CELLS)[number][0];

export interface SemanticValidationCaseRef<A extends SemanticValidationCaseArm = SemanticValidationCaseArm> {
  readonly kind: "case";
  readonly id: string;
  readonly version: 1;
  readonly subject: SemanticValidationSubject;
  readonly arm: A;
}

export interface SemanticPopulationReceiptRef {
  readonly kind: "population_receipt";
  readonly id: string;
  readonly version: 1;
  readonly subject: SemanticValidationSubject;
  readonly inputVersion: 1;
  readonly resultVersion: 1;
}

export interface SemanticExternalDisagreementReceiptRef {
  readonly kind: "external_disagreement_receipt";
  readonly id: string;
  readonly version: 1;
  readonly subject: SemanticValidationSubject;
  readonly datasetVersion: 1;
  readonly resultVersion: 1;
}

export type SemanticValidationPresentRef<A extends SemanticValidationArm> =
  A extends "imported_population" ? SemanticPopulationReceiptRef
  : A extends "external_label" ? SemanticExternalDisagreementReceiptRef
  : A extends SemanticValidationCaseArm ? SemanticValidationCaseRef<A>
  : never;

export const SEMANTIC_VALIDATION_NOT_APPLICABLE_REASONS = Object.freeze([
  "literal_or_observed_event_makes_no_alternative_claim",
  "no_independent_external_taxonomy",
  "external_labels_are_not_truth_authority",
] as const);
export type SemanticValidationNotApplicableReason = (typeof SEMANTIC_VALIDATION_NOT_APPLICABLE_REASONS)[number];

export type SemanticValidationCell<A extends SemanticValidationArm> =
  | { readonly disposition: "present"; readonly refs: readonly SemanticValidationPresentRef<A>[] }
  | { readonly disposition: "required"; readonly owner: string; readonly discharge: string }
  | { readonly disposition: "not_applicable"; readonly reason: SemanticValidationNotApplicableReason };

export interface SemanticValidationProfile {
  readonly subject: SemanticValidationSubject;
  readonly positive: SemanticValidationCell<"positive">;
  readonly semanticNegative: SemanticValidationCell<"semantic_negative">;
  readonly orientation: SemanticValidationCell<"orientation">;
  readonly counterfactual: SemanticValidationCell<"counterfactual">;
  readonly importedPopulation: SemanticValidationCell<"imported_population">;
  readonly externalLabel: SemanticValidationCell<"external_label">;
}

export function parseSemanticValidationCaseRef<A extends SemanticValidationCaseArm>(value: unknown, arm: A, subject: SemanticValidationSubject): SemanticValidationCaseRef<A> {
  refKind(value, "case", arm);
  const record = exactKeys(value, ["kind", "id", "version", "subject", "arm"], [], "case ref", "SEMANTIC_VALIDATION_CASE_REF_STALE");
  const id = parseBaseId(record.id, "case ref id");
  parseVersionOne(record.version, `case ref ${id}`);
  const refSubject = parseSemanticValidationSubject(record.subject);
  if (!sameSubject(refSubject, subject)) fail("SEMANTIC_VALIDATION_CASE_REF_STALE", `case ref ${id} names ${semanticValidationSubjectKey(refSubject)}, not the profile subject ${semanticValidationSubjectKey(subject)}`);
  if (record.arm !== arm) fail("SEMANTIC_VALIDATION_CASE_REF_STALE", `case ref ${id} arm ${String(record.arm)} crosses into the ${arm} cell`);
  return Object.freeze({ kind: "case", id, version: 1, subject: refSubject, arm });
}

export function parseSemanticPopulationReceiptRef(value: unknown, subject: SemanticValidationSubject): SemanticPopulationReceiptRef {
  refKind(value, "population_receipt", "imported_population");
  const record = exactKeys(value, ["kind", "id", "version", "subject", "inputVersion", "resultVersion"], [], "population receipt ref", "SEMANTIC_VALIDATION_CASE_REF_STALE");
  const id = parseBaseId(record.id, "population receipt id");
  parseVersionOne(record.version, `population receipt ${id}`);
  if (record.inputVersion !== 1) fail("SEMANTIC_VALIDATION_POPULATION_STALE", `population receipt ${id} input version ${String(record.inputVersion)} is stale`);
  if (record.resultVersion !== 1) fail("SEMANTIC_VALIDATION_POPULATION_STALE", `population receipt ${id} result version ${String(record.resultVersion)} is stale`);
  const refSubject = parseSemanticValidationSubject(record.subject);
  if (!sameSubject(refSubject, subject)) fail("SEMANTIC_VALIDATION_CASE_REF_STALE", `population receipt ${id} names another subject`);
  return Object.freeze({ kind: "population_receipt", id, version: 1, subject: refSubject, inputVersion: 1, resultVersion: 1 });
}

export function parseSemanticExternalDisagreementReceiptRef(value: unknown, subject: SemanticValidationSubject): SemanticExternalDisagreementReceiptRef {
  refKind(value, "external_disagreement_receipt", "external_label");
  const record = exactKeys(value, ["kind", "id", "version", "subject", "datasetVersion", "resultVersion"], [], "external disagreement ref", "SEMANTIC_VALIDATION_CASE_REF_STALE");
  const id = parseBaseId(record.id, "external receipt id");
  parseVersionOne(record.version, `external receipt ${id}`);
  if (record.datasetVersion !== 1) fail("SEMANTIC_VALIDATION_POPULATION_STALE", `external receipt ${id} dataset version is stale`);
  if (record.resultVersion !== 1) fail("SEMANTIC_VALIDATION_POPULATION_STALE", `external receipt ${id} result version is stale`);
  const refSubject = parseSemanticValidationSubject(record.subject);
  if (!sameSubject(refSubject, subject)) fail("SEMANTIC_VALIDATION_CASE_REF_STALE", `external receipt ${id} names another subject`);
  return Object.freeze({ kind: "external_disagreement_receipt", id, version: 1, subject: refSubject, datasetVersion: 1, resultVersion: 1 });
}

function parseCell<A extends SemanticValidationArm>(value: unknown, arm: A, subject: SemanticValidationSubject): SemanticValidationCell<A> {
  if (!isRecord(value)) return fail("SEMANTIC_VALIDATION_PROFILE_INVALID", `${arm} cell must be an object`);
  switch (value.disposition) {
    case "present": {
      const record = exactKeys(value, ["disposition", "refs"], [], `${arm} cell`);
      if (!Array.isArray(record.refs) || record.refs.length === 0) return fail("SEMANTIC_VALIDATION_PROFILE_INVALID", `${arm} present cell needs a non-empty refs array`);
      const refs = record.refs.map((ref): SemanticValidationPresentRef<A> => {
        if (arm === "imported_population") return parseSemanticPopulationReceiptRef(ref, subject) as SemanticValidationPresentRef<A>;
        if (arm === "external_label") return parseSemanticExternalDisagreementReceiptRef(ref, subject) as SemanticValidationPresentRef<A>;
        return parseSemanticValidationCaseRef(ref, arm as SemanticValidationCaseArm, subject) as SemanticValidationPresentRef<A>;
      });
      return Object.freeze({ disposition: "present", refs: Object.freeze(refs) });
    }
    case "required": {
      const record = exactKeys(value, ["disposition", "owner", "discharge"], [], `${arm} cell`);
      return Object.freeze({ disposition: "required", owner: parseText(record.owner, `${arm}.owner`), discharge: parseText(record.discharge, `${arm}.discharge`) });
    }
    case "not_applicable": {
      const record = exactKeys(value, ["disposition", "reason"], [], `${arm} cell`);
      if (!(SEMANTIC_VALIDATION_NOT_APPLICABLE_REASONS as readonly unknown[]).includes(record.reason)) return fail("SEMANTIC_VALIDATION_PROFILE_INVALID", `${arm} not_applicable reason ${String(record.reason)} is not closed`);
      return Object.freeze({ disposition: "not_applicable", reason: record.reason as SemanticValidationNotApplicableReason });
    }
    default:
      return fail("SEMANTIC_VALIDATION_PROFILE_INVALID", `${arm} cell disposition ${String(value.disposition)} is unknown`);
  }
}

export function parseSemanticValidationProfile(value: unknown): SemanticValidationProfile {
  const record = exactKeys(value, ["subject", ...SEMANTIC_VALIDATION_PROFILE_CELLS.map(([key]) => key)], [], "profile");
  const subject = parseSemanticValidationSubject(record.subject);
  const cells = Object.fromEntries(SEMANTIC_VALIDATION_PROFILE_CELLS.map(([key, arm]) => [key, parseCell(record[key], arm, subject)]));
  return Object.freeze({ subject, ...cells }) as unknown as SemanticValidationProfile;
}

// ---------------------------------------------------------------------------------------------
// §4.1 Operations, inputs and cases
// ---------------------------------------------------------------------------------------------

export const SEMANTIC_VALIDATION_OPERATION_IDS = Object.freeze([
  "runtime.semantic.local_edge",
  "runtime.semantic.structural_edge",
  "runtime.semantic.transition_edge",
  "runtime.semantic.breadth_edge",
  "runtime.semantic.duty_edge",
  "runtime.semantic.recorded_path",
  "runtime.semantic.recorded_sequence",
  "runtime.semantic.complete_alternatives",
  "runtime.semantic.bounded_target_batch",
] as const);
export type SemanticValidationOperationId = (typeof SEMANTIC_VALIDATION_OPERATION_IDS)[number];

export interface SemanticValidationOperationRef<K extends SemanticValidationOperationId = SemanticValidationOperationId> {
  readonly id: K;
  readonly version: 1;
}

export function semanticValidationOperationRef<K extends SemanticValidationOperationId>(id: K): SemanticValidationOperationRef<K> {
  if (!(SEMANTIC_VALIDATION_OPERATION_IDS as readonly string[]).includes(id)) fail("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID", `unknown operation ${String(id)}`);
  return Object.freeze({ id, version: 1 });
}

export function parseSemanticValidationOperationRef(value: unknown): SemanticValidationOperationRef {
  const record = exactKeys(value, ["id", "version"], [], "operation ref");
  const id = parseBaseId(record.id, "operation id");
  parseVersionOne(record.version, `operation ${id}`);
  return semanticValidationOperationRef(id as SemanticValidationOperationId);
}

export interface SemanticEdgeInput {
  readonly kind: "edge";
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
}

export interface SemanticRecordedPathInput {
  readonly kind: "recorded_path";
  readonly pathReceipt: VersionedEvidenceId;
  readonly edges: readonly SemanticEdgeInput[];
  readonly pathDigest: string;
}

export const SEMANTIC_SEQUENCE_FAMILIES = Object.freeze([
  "trade_completed", "pawn_contact_timing", "harassment_pressure", "defender_consequence", "deflection", "attraction",
  "line_clearance", "square_clearance", "interference", "checking_zwischenzug", "overload_exploitation",
] as const);
export type SemanticSequenceFamily = (typeof SEMANTIC_SEQUENCE_FAMILIES)[number];

export interface SemanticRecordedSequenceInput {
  readonly kind: "recorded_sequence";
  readonly path: SemanticRecordedPathInput;
  readonly family: SemanticSequenceFamily;
  readonly fromPly: number;
  readonly horizon: 2 | 3 | 4 | 5;
}

export interface SemanticCompleteAlternativesInput {
  readonly kind: "complete_alternatives";
  readonly rootFen: string;
  readonly played: SemanticEdgeInput;
  readonly alternatives: readonly SemanticEdgeInput[];
  readonly legalSetDigest: string;
}

/** The bounded-target batch operation's case input: one exact source FEN (rfc/bounded-policy-targets.md). */
export interface SemanticBoundedTargetInput {
  readonly kind: "bounded_target_source";
  readonly sourceFen: string;
}

export type SemanticValidationOperationInputMap = {
  readonly "runtime.semantic.local_edge": SemanticEdgeInput;
  readonly "runtime.semantic.structural_edge": SemanticEdgeInput;
  readonly "runtime.semantic.transition_edge": SemanticEdgeInput;
  readonly "runtime.semantic.breadth_edge": SemanticEdgeInput;
  readonly "runtime.semantic.duty_edge": SemanticEdgeInput;
  readonly "runtime.semantic.recorded_path": SemanticRecordedPathInput;
  readonly "runtime.semantic.recorded_sequence": SemanticRecordedSequenceInput;
  readonly "runtime.semantic.complete_alternatives": SemanticCompleteAlternativesInput;
  readonly "runtime.semantic.bounded_target_batch": SemanticBoundedTargetInput;
};
export type SemanticValidationOperationInput<K extends SemanticValidationOperationId> = SemanticValidationOperationInputMap[K];

const EDGE_OPERATIONS: readonly SemanticValidationOperationId[] = ["runtime.semantic.local_edge", "runtime.semantic.structural_edge", "runtime.semantic.transition_edge", "runtime.semantic.breadth_edge", "runtime.semantic.duty_edge"];

function parseEdgeInput(value: unknown, label = "edge"): SemanticEdgeInput {
  if (!isRecord(value) || value.kind !== "edge") fail("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID", `${label}.kind must be edge (got ${isRecord(value) ? String(value.kind) : typeof value})`);
  const record = exactKeys(value, ["kind", "beforeFen", "moveUci", "afterFen"], [], label, "SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID");
  return Object.freeze({ kind: "edge", beforeFen: parseText(record.beforeFen, `${label}.beforeFen`), moveUci: parseText(record.moveUci, `${label}.moveUci`), afterFen: parseText(record.afterFen, `${label}.afterFen`) });
}

function parsePathInput(value: unknown): SemanticRecordedPathInput {
  if (!isRecord(value) || value.kind !== "recorded_path") fail("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID", `recorded path input kind must be recorded_path (got ${isRecord(value) ? String(value.kind) : typeof value})`);
  const record = exactKeys(value, ["kind", "pathReceipt", "edges", "pathDigest"], [], "recorded path", "SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID");
  const receipt = parseVersionedEvidenceId(record.pathReceipt, "pathReceipt");
  if (receipt.id !== "run.record.edge" || receipt.version !== 1) fail("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID", "pathReceipt must be exactly run.record.edge@1");
  if (!Array.isArray(record.edges) || record.edges.length === 0) return fail("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID", "recorded path needs a non-empty edge list");
  const edges = Object.freeze(record.edges.map((edge, index) => parseEdgeInput(edge, `edges[${index}]`)));
  const pathDigest = parseSha(record.pathDigest, "pathDigest");
  if (semanticRecordedPathDigest(edges) !== pathDigest) fail("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID", "recorded path digest does not match its edges");
  return Object.freeze({ kind: "recorded_path", pathReceipt: receipt, edges, pathDigest });
}

export function semanticRecordedPathDigest(edges: readonly SemanticEdgeInput[]): string {
  return evidenceDigest({ domain: "tabiya:semantic-validation-recorded-path@1", edges: edges.map((edge) => [edge.beforeFen, edge.moveUci, edge.afterFen]) });
}

/**
 * The projected population input digest (§5.1): PGN + manifest + reader version + the exact
 * projected identity list. Deleting one sampled edge or recorded window while keeping the PGN
 * digest changes it, as does reusing the same PGN for another projection.
 */
export function semanticPopulationProjectionDigest(base: { readonly pgnSha256: string; readonly manifestSha256: string; readonly reader: number }, projection: string, identities: readonly (readonly (string | number)[])[]): string {
  return evidenceDigest({ domain: "tabiya:semantic-validation-population-input@1", ...base, projection, identities });
}

export function semanticLegalSetDigest(rootFen: string, moves: readonly string[]): string {
  return evidenceDigest({ domain: "tabiya:semantic-validation-legal-set@1", rootFen, moves: [...moves].sort() });
}

/** Strict operation-selected input parser: the operation id picks the arm before keys are checked. */
export function parseSemanticValidationOperationInput<K extends SemanticValidationOperationId>(operation: K, value: unknown): SemanticValidationOperationInput<K> {
  if (EDGE_OPERATIONS.includes(operation)) return parseEdgeInput(value) as SemanticValidationOperationInput<K>;
  switch (operation) {
    case "runtime.semantic.recorded_path": return parsePathInput(value) as SemanticValidationOperationInput<K>;
    case "runtime.semantic.recorded_sequence": {
      const record = exactKeys(value, ["kind", "path", "family", "fromPly", "horizon"], [], "recorded sequence", "SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID");
      if (record.kind !== "recorded_sequence") fail("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID", `recorded sequence input kind must be recorded_sequence (got ${String(record.kind)})`);
      if (!(SEMANTIC_SEQUENCE_FAMILIES as readonly unknown[]).includes(record.family)) fail("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID", `sequence family ${String(record.family)} is not closed`);
      if (![2, 3, 4, 5].includes(record.horizon as number)) fail("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID", `sequence horizon ${String(record.horizon)} is outside 2..5`);
      const path = parsePathInput(record.path);
      if (!Number.isSafeInteger(record.fromPly) || (record.fromPly as number) < 0 || (record.fromPly as number) + (record.horizon as number) > path.edges.length) fail("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID", "sequence window falls outside the recorded path");
      return Object.freeze({ kind: "recorded_sequence", path, family: record.family as SemanticSequenceFamily, fromPly: record.fromPly as number, horizon: record.horizon as 2 | 3 | 4 | 5 }) as SemanticValidationOperationInput<K>;
    }
    case "runtime.semantic.complete_alternatives": {
      const record = exactKeys(value, ["kind", "rootFen", "played", "alternatives", "legalSetDigest"], [], "complete alternatives", "SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID");
      if (record.kind !== "complete_alternatives") fail("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID", `complete alternatives kind must be complete_alternatives (got ${String(record.kind)})`);
      const rootFen = parseText(record.rootFen, "rootFen");
      const played = parseEdgeInput(record.played, "played");
      if (!Array.isArray(record.alternatives) || record.alternatives.length === 0) return fail("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID", "complete alternatives need the exact legal set");
      const alternatives = Object.freeze(record.alternatives.map((edge, index) => parseEdgeInput(edge, `alternatives[${index}]`)));
      const legalSetDigest = parseSha(record.legalSetDigest, "legalSetDigest");
      if (semanticLegalSetDigest(rootFen, alternatives.map((edge) => edge.moveUci)) !== legalSetDigest) fail("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID", "legal set digest does not match the alternatives");
      if (!alternatives.some((edge) => edge.moveUci === played.moveUci)) fail("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID", "complete alternatives must include the played move");
      return Object.freeze({ kind: "complete_alternatives", rootFen, played, alternatives, legalSetDigest }) as SemanticValidationOperationInput<K>;
    }
    case "runtime.semantic.bounded_target_batch": {
      const record = exactKeys(value, ["kind", "sourceFen"], [], "bounded target source", "SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID");
      if (record.kind !== "bounded_target_source") fail("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID", `bounded target input kind must be bounded_target_source (got ${String(record.kind)})`);
      return Object.freeze({ kind: "bounded_target_source", sourceFen: parseText(record.sourceFen, "sourceFen") }) as SemanticValidationOperationInput<K>;
    }
    default:
      return fail("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID", `operation ${operation} has no input arm`);
  }
}

// ---------------------------------------------------------------------------------------------
// §4.1 Expectations and mirror operand rules
// ---------------------------------------------------------------------------------------------

export type SemanticValidationUnavailableReason = "source_predicate_unavailable" | "recorded_path_incomplete" | "complete_alternative_population_unavailable";
const UNAVAILABLE_REASONS: readonly SemanticValidationUnavailableReason[] = ["source_predicate_unavailable", "recorded_path_incomplete", "complete_alternative_population_unavailable"];

export type SemanticMirrorGeometry = "vertical" | "horizontal" | "color_and_vertical";
export type SemanticMirrorValueRule = "identity" | "square" | "color" | "signed_file_delta" | "signed_rank_delta";
export type SemanticOperandPathSegment = string | "*";

export interface SemanticMirrorOperandRule {
  readonly sourcePath: readonly SemanticOperandPathSegment[];
  readonly partnerPath: readonly SemanticOperandPathSegment[];
  readonly value: SemanticMirrorValueRule;
  readonly collection: "scalar" | "ordered" | "canonical_set";
}

export type SemanticValidationExpectation =
  | {
      readonly kind: "emits";
      readonly minimum: 1;
      /** Changelog 2026-09-24: a moved signed assertion keeps its sign rather than weakening to "any". */
      readonly sign?: string;
      readonly operandMatch?: { readonly [key: string]: SemanticCanonicalValue };
    }
  | { readonly kind: "abstains"; readonly reason: SemanticValidationUnavailableReason }
  | { readonly kind: "omits" }
  | {
      readonly kind: "mirrors";
      readonly partnerCase: SemanticValidationCaseRef;
      readonly geometry: SemanticMirrorGeometry;
      readonly targetEvents: { readonly nonEmpty: true; readonly pairing: "canonical_subject_sign_operands" };
      readonly operandRules: readonly SemanticMirrorOperandRule[];
    };

function parsePath(value: unknown, label: string): readonly SemanticOperandPathSegment[] {
  if (!Array.isArray(value) || value.length === 0 || value.some((segment) => typeof segment !== "string" || segment === "")) return fail("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA", `${label} must be a non-empty string path`);
  return Object.freeze([...value] as string[]);
}

export function parseSemanticValidationExpectation(value: unknown, subject: SemanticValidationSubject): SemanticValidationExpectation {
  if (!isRecord(value)) return fail("SEMANTIC_VALIDATION_CASE_INVALID", "expectation must be an object");
  switch (value.kind) {
    case "emits": {
      const record = exactKeys(value, ["kind", "minimum"], ["sign", "operandMatch"], "emits expectation");
      if (record.minimum !== 1) fail("SEMANTIC_VALIDATION_CASE_INVALID", "emits.minimum must be exactly 1");
      if (record.sign !== undefined && !["state", "gained", "lost", "preserved", "removed", "avoided", "enabled", "threatened"].includes(record.sign as string)) fail("SEMANTIC_VALIDATION_CASE_INVALID", `emits.sign ${String(record.sign)} is not a declared sign`);
      if (record.operandMatch !== undefined && (!isRecord(record.operandMatch) || Object.keys(record.operandMatch).length === 0)) fail("SEMANTIC_VALIDATION_CASE_INVALID", "emits.operandMatch must be a non-empty object");
      return Object.freeze({ kind: "emits", minimum: 1, ...(record.sign === undefined ? {} : { sign: record.sign as string }), ...(record.operandMatch === undefined ? {} : { operandMatch: record.operandMatch as { readonly [key: string]: SemanticCanonicalValue } }) });
    }
    case "abstains": {
      const record = exactKeys(value, ["kind", "reason"], [], "abstains expectation");
      if (!UNAVAILABLE_REASONS.includes(record.reason as SemanticValidationUnavailableReason)) fail("SEMANTIC_VALIDATION_CASE_INVALID", `abstention reason ${String(record.reason)} is not closed`);
      return Object.freeze({ kind: "abstains", reason: record.reason as SemanticValidationUnavailableReason });
    }
    case "omits":
      exactKeys(value, ["kind"], [], "omits expectation");
      return Object.freeze({ kind: "omits" });
    case "mirrors": {
      const record = exactKeys(value, ["kind", "partnerCase", "geometry", "targetEvents", "operandRules"], [], "mirror expectation");
      const partner = parseSemanticValidationCaseRef(record.partnerCase, "orientation", subject);
      if (!["vertical", "horizontal", "color_and_vertical"].includes(record.geometry as string)) fail("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA", `geometry ${String(record.geometry)} is not closed`);
      const target = exactKeys(record.targetEvents, ["nonEmpty", "pairing"], [], "targetEvents");
      if (target.nonEmpty !== true || target.pairing !== "canonical_subject_sign_operands") fail("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA", "targetEvents must be { nonEmpty: true, pairing: canonical_subject_sign_operands }");
      if (!Array.isArray(record.operandRules) || record.operandRules.length === 0) return fail("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA", "a mirror needs a total operand rule list");
      const rules = record.operandRules.map((rule, index) => {
        const entry = exactKeys(rule, ["sourcePath", "partnerPath", "value", "collection"], [], `operandRules[${index}]`);
        if (!["identity", "square", "color", "signed_file_delta", "signed_rank_delta"].includes(entry.value as string)) fail("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA", `operand rule transform ${String(entry.value)} is not closed`);
        if (!["scalar", "ordered", "canonical_set"].includes(entry.collection as string)) fail("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA", `operand rule collection ${String(entry.collection)} is not closed`);
        return Object.freeze({ sourcePath: parsePath(entry.sourcePath, "sourcePath"), partnerPath: parsePath(entry.partnerPath, "partnerPath"), value: entry.value as SemanticMirrorValueRule, collection: entry.collection as SemanticMirrorOperandRule["collection"] });
      });
      return Object.freeze({ kind: "mirrors", partnerCase: partner, geometry: record.geometry as SemanticMirrorGeometry, targetEvents: Object.freeze({ nonEmpty: true, pairing: "canonical_subject_sign_operands" }), operandRules: Object.freeze(rules) });
    }
    default:
      return fail("SEMANTIC_VALIDATION_CASE_INVALID", `expectation kind ${String(value.kind)} is unknown`);
  }
}

// ---------------------------------------------------------------------------------------------
// §4.1/§R3 Fact constraints and authorities
// ---------------------------------------------------------------------------------------------

export type SemanticCanonicalScalar = string | number | boolean | null;
export type SemanticCanonicalValue = SemanticCanonicalScalar | readonly SemanticCanonicalValue[] | { readonly [key: string]: SemanticCanonicalValue };

export interface SemanticValidationFactConstraint {
  readonly path: readonly string[];
  readonly comparison: "scalar" | "ordered" | "canonical_multiset";
  readonly equals: SemanticCanonicalValue;
}

export function parseSemanticValidationFactConstraints(value: unknown): readonly SemanticValidationFactConstraint[] {
  if (!Array.isArray(value)) return fail("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID", "fact constraints must be an array");
  return Object.freeze(value.map((entry, index) => {
    const record = exactKeys(entry, ["path", "comparison", "equals"], [], `factConstraint[${index}]`);
    if (!Array.isArray(record.path) || record.path.length === 0 || record.path.some((segment) => typeof segment !== "string" || segment === "" || segment === "*")) fail("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID", "fact constraint paths contain object keys only; no wildcard exists");
    if (!["scalar", "ordered", "canonical_multiset"].includes(record.comparison as string)) fail("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID", `comparison ${String(record.comparison)} is not closed`);
    const scalar = record.equals === null || ["string", "number", "boolean"].includes(typeof record.equals);
    if (record.comparison === "scalar" ? !scalar : !Array.isArray(record.equals)) fail("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID", `equals has the wrong shape for ${String(record.comparison)} comparison`);
    return Object.freeze({ path: Object.freeze([...(record.path as string[])]), comparison: record.comparison as SemanticValidationFactConstraint["comparison"], equals: record.equals as SemanticCanonicalValue });
  }));
}

/** Canonical digest of the complete constraint list (§R3): the proposition binds these bytes. */
export function semanticFactConstraintSha256(constraints: readonly SemanticValidationFactConstraint[]): string {
  return evidenceDigest({ domain: "tabiya:semantic-validation-fact-constraints@1", constraints });
}

const canonicalBytes = (value: unknown): string => evidenceDigest({ value });

/**
 * Applies every closed equality constraint to a neutral oracle fact (§R3). `scalar` compares one
 * leaf; `ordered` compares every array member in order; `canonical_multiset` canonicalizes every
 * complete member, sorts and keeps multiplicity. No constraint selects a convenient member.
 */
export function evaluateSemanticFactConstraints(fact: unknown, constraints: readonly SemanticValidationFactConstraint[]): void {
  if (constraints.length === 0) fail("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID", "a rules-backed case needs at least one fact constraint");
  if (isRecord(fact) && "expectation" in fact) fail("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID", "an oracle fact may not carry an expectation");
  for (const constraint of constraints) {
    let cursor: unknown = fact;
    for (const segment of constraint.path) {
      if (!isRecord(cursor) || !(segment in cursor)) fail("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID", `fact path ${constraint.path.join(".")} does not resolve`);
      cursor = (cursor as Record<string, unknown>)[segment];
    }
    if (constraint.comparison === "scalar") {
      if (cursor !== null && typeof cursor === "object") fail("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID", `scalar comparison at ${constraint.path.join(".")} resolved a collection`);
      if (canonicalBytes(cursor) !== canonicalBytes(constraint.equals)) fail("SEMANTIC_VALIDATION_FACT_CONSTRAINT_UNSATISFIED", `${constraint.path.join(".")} is ${JSON.stringify(cursor)}, not ${JSON.stringify(constraint.equals)}`);
      continue;
    }
    if (!Array.isArray(cursor) || !Array.isArray(constraint.equals)) return fail("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID", `${constraint.comparison} comparison at ${constraint.path.join(".")} requires arrays`);
    const actual = cursor.map(canonicalBytes);
    const expected = (constraint.equals as readonly unknown[]).map(canonicalBytes);
    if (constraint.comparison === "canonical_multiset") {
      actual.sort();
      expected.sort();
    }
    if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) fail("SEMANTIC_VALIDATION_FACT_CONSTRAINT_UNSATISFIED", `${constraint.path.join(".")} does not equal the complete ${constraint.comparison} collection`);
  }
}

export interface SemanticValidationPropositionRecord {
  readonly subject: SemanticValidationSubject;
  readonly case: { readonly id: string; readonly version: 1 };
  readonly factConstraint: readonly SemanticValidationFactConstraint[];
  readonly factConstraintSha256: string;
  readonly expectation: SemanticValidationExpectation;
}

export interface SemanticValidationExistingAssertionAuthority {
  readonly kind: "existing_assertion";
  readonly matrixRow: string;
  readonly testSite: `${string}.test.ts#${string}`;
  readonly sourceSha256: string;
  readonly frozenExpectationSha256: string;
}

export interface SemanticValidationCitedPropositionAuthority {
  readonly kind: "cited_proposition";
  readonly sourceId: string;
  readonly sourceRevision: string;
  readonly licence: string;
  readonly span: { readonly start: number; readonly end: number; readonly textSha256: string };
  readonly propositionSha256: string;
}

export interface SemanticValidationOwnerAuthorityRef {
  readonly kind: "owner_authored";
  readonly id: string;
  readonly version: 1;
}

export type SemanticValidationPropositionAuthority =
  | SemanticValidationExistingAssertionAuthority
  | SemanticValidationCitedPropositionAuthority
  | SemanticValidationOwnerAuthorityRef;

export const SEMANTIC_VALIDATION_ORACLE_IDS = Object.freeze(["rules.legal_successor", "rules.attack_map", "rules.material_ledger", "rules.line_occupancy", "rules.complete_legal_set", "rules.tablebase_result"] as const);
export type SemanticValidationOracleId = (typeof SEMANTIC_VALIDATION_ORACLE_IDS)[number];

export interface SemanticValidationOracleRef<K extends SemanticValidationOracleId = SemanticValidationOracleId> {
  readonly id: K;
  readonly version: 1;
}

export interface SemanticValidationOracleWitnessRef {
  readonly id: string;
  readonly version: 1;
  readonly oracle: SemanticValidationOracleRef;
  readonly case: { readonly id: string; readonly version: 1 };
  readonly subject: SemanticValidationSubject;
}

export interface SemanticValidationRulesAuthority {
  readonly kind: "rules_and_proposition";
  readonly oracle: SemanticValidationOracleRef;
  readonly witness: SemanticValidationOracleWitnessRef;
  readonly proposition: SemanticValidationPropositionAuthority;
  readonly factConstraint: readonly SemanticValidationFactConstraint[];
}

export type SemanticValidationCaseAuthority =
  | SemanticValidationExistingAssertionAuthority
  | SemanticValidationRulesAuthority
  | SemanticValidationCitedPropositionAuthority
  | SemanticValidationOwnerAuthorityRef;

export function parseSemanticValidationExistingAssertionAuthority(value: unknown): SemanticValidationExistingAssertionAuthority {
  const record = exactKeys(value, ["kind", "matrixRow", "testSite", "sourceSha256", "frozenExpectationSha256"], [], "existing assertion authority");
  if (record.kind !== "existing_assertion") fail("SEMANTIC_VALIDATION_AUTHORITY_INVALID", "existing assertion kind mismatch");
  const testSite = parseText(record.testSite, "testSite");
  if (!/^[^#]+\.test\.ts#.+$/u.test(testSite)) fail("SEMANTIC_VALIDATION_AUTHORITY_INVALID", `testSite ${testSite} must be <file>.test.ts#<test title>`);
  return Object.freeze({ kind: "existing_assertion", matrixRow: parseText(record.matrixRow, "matrixRow"), testSite: testSite as SemanticValidationExistingAssertionAuthority["testSite"], sourceSha256: parseSha(record.sourceSha256, "sourceSha256"), frozenExpectationSha256: parseSha(record.frozenExpectationSha256, "frozenExpectationSha256") });
}

export function parseSemanticValidationCitedPropositionAuthority(value: unknown): SemanticValidationCitedPropositionAuthority {
  const record = exactKeys(value, ["kind", "sourceId", "sourceRevision", "licence", "span", "propositionSha256"], [], "cited proposition authority");
  if (record.kind !== "cited_proposition") fail("SEMANTIC_VALIDATION_AUTHORITY_INVALID", "cited proposition kind mismatch");
  const span = exactKeys(record.span, ["start", "end", "textSha256"], [], "span");
  if (!Number.isSafeInteger(span.start) || !Number.isSafeInteger(span.end) || (span.start as number) < 0 || (span.end as number) <= (span.start as number)) fail("SEMANTIC_VALIDATION_AUTHORITY_INVALID", "span must be a non-empty integer range");
  return Object.freeze({ kind: "cited_proposition", sourceId: parseBaseId(record.sourceId, "sourceId"), sourceRevision: parseText(record.sourceRevision, "sourceRevision"), licence: parseText(record.licence, "licence"), span: Object.freeze({ start: span.start as number, end: span.end as number, textSha256: parseSha(span.textSha256, "span.textSha256") }), propositionSha256: parseSha(record.propositionSha256, "propositionSha256") });
}

export function parseSemanticValidationOwnerAuthorityRef(value: unknown): SemanticValidationOwnerAuthorityRef {
  const record = exactKeys(value, ["kind", "id", "version"], [], "owner authority ref");
  if (record.kind !== "owner_authored") fail("SEMANTIC_VALIDATION_AUTHORITY_INVALID", "owner authority kind mismatch");
  return Object.freeze({ kind: "owner_authored", id: parseBaseId(record.id, "owner authority id"), version: parseVersionOne(record.version, "owner authority") });
}

function parsePropositionAuthority(value: unknown): SemanticValidationPropositionAuthority {
  if (!isRecord(value)) return fail("SEMANTIC_VALIDATION_AUTHORITY_INVALID", "proposition authority must be an object");
  if (value.kind === "existing_assertion") return parseSemanticValidationExistingAssertionAuthority(value);
  if (value.kind === "cited_proposition") return parseSemanticValidationCitedPropositionAuthority(value);
  if (value.kind === "owner_authored") return parseSemanticValidationOwnerAuthorityRef(value);
  return fail("SEMANTIC_VALIDATION_AUTHORITY_INVALID", `proposition authority kind ${String(value.kind)} is unknown`);
}

export function parseSemanticValidationOracleRef(value: unknown): SemanticValidationOracleRef {
  const record = exactKeys(value, ["id", "version"], [], "oracle ref");
  const id = parseBaseId(record.id, "oracle id");
  if (!(SEMANTIC_VALIDATION_ORACLE_IDS as readonly string[]).includes(id)) fail("SEMANTIC_VALIDATION_AUTHORITY_INVALID", `oracle ${id} is not registered`);
  return Object.freeze({ id: id as SemanticValidationOracleId, version: parseVersionOne(record.version, "oracle") });
}

export function parseSemanticValidationCaseAuthority(value: unknown, subject: SemanticValidationSubject, caseId: string): SemanticValidationCaseAuthority {
  if (!isRecord(value)) return fail("SEMANTIC_VALIDATION_AUTHORITY_INVALID", "case authority must be an object");
  if (value.kind === "rules_and_proposition") {
    const record = exactKeys(value, ["kind", "oracle", "witness", "proposition", "factConstraint"], [], "rules authority");
    const oracle = parseSemanticValidationOracleRef(record.oracle);
    const witness = exactKeys(record.witness, ["id", "version", "oracle", "case", "subject"], [], "witness ref");
    const witnessOracle = parseSemanticValidationOracleRef(witness.oracle);
    const witnessCase = exactKeys(witness.case, ["id", "version"], [], "witness case");
    const witnessSubject = parseSemanticValidationSubject(witness.subject);
    if (witnessOracle.id !== oracle.id || parseBaseId(witnessCase.id, "witness case id") !== caseId || !sameSubject(witnessSubject, subject)) fail("SEMANTIC_VALIDATION_AUTHORITY_INVALID", "oracle witness names another oracle, case or subject");
    const factConstraint = parseSemanticValidationFactConstraints(record.factConstraint);
    if (factConstraint.length === 0) fail("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID", "a rules-backed case needs a non-empty fact constraint list");
    return Object.freeze({
      kind: "rules_and_proposition",
      oracle,
      witness: Object.freeze({ id: parseBaseId(witness.id, "witness id"), version: parseVersionOne(witness.version, "witness"), oracle: witnessOracle, case: Object.freeze({ id: caseId, version: parseVersionOne(witnessCase.version, "witness case") }), subject: witnessSubject }),
      proposition: parsePropositionAuthority(record.proposition),
      factConstraint,
    });
  }
  return parsePropositionAuthority(value);
}

// ---------------------------------------------------------------------------------------------
// §4.1 Cases
// ---------------------------------------------------------------------------------------------

export type SemanticValidationCaseFor<K extends SemanticValidationOperationId> = {
  readonly id: string;
  readonly version: 1;
  readonly subject: SemanticValidationSubject;
  readonly arm: SemanticValidationCaseArm;
  readonly operation: SemanticValidationOperationRef<K>;
  readonly input: SemanticValidationOperationInput<K>;
  readonly authority: SemanticValidationCaseAuthority;
  readonly expectation: SemanticValidationExpectation;
};

export type SemanticValidationCase = { readonly [K in SemanticValidationOperationId]: SemanticValidationCaseFor<K> }[SemanticValidationOperationId];

export function semanticValidationCaseRef(value: SemanticValidationCase): SemanticValidationCaseRef {
  return Object.freeze({ kind: "case", id: value.id, version: 1, subject: value.subject, arm: value.arm });
}

/** A case id that is (or embeds) its subject id is a generated label, never an independent case id. */
function assertIndependentCaseId(id: string, subject: SemanticValidationSubject): void {
  const projectionId = subject.projection.id;
  if (id === projectionId || id.includes(projectionId) || id.startsWith("semantic-event:")) fail("SEMANTIC_VALIDATION_CASE_INVALID", `case id ${id} is generated from its subject id`);
}

/** The strict case parser (§4.1): exact keys, operation-selected input arm, no callback or evidence member. */
export function parseSemanticValidationCase(value: unknown): SemanticValidationCase {
  const record = exactKeys(value, ["id", "version", "subject", "arm", "operation", "input", "authority", "expectation"], [], "case");
  const id = parseBaseId(record.id, "case id");
  parseVersionOne(record.version, `case ${id}`);
  const subject = parseSemanticValidationSubject(record.subject);
  assertIndependentCaseId(id, subject);
  if (!(SEMANTIC_VALIDATION_CASE_ARMS as readonly unknown[]).includes(record.arm)) fail("SEMANTIC_VALIDATION_CASE_INVALID", `case ${id} arm ${String(record.arm)} is not a case arm`);
  const operation = parseSemanticValidationOperationRef(record.operation);
  const input = parseSemanticValidationOperationInput(operation.id, record.input);
  const expectation = parseSemanticValidationExpectation(record.expectation, subject);
  const arm = record.arm as SemanticValidationCaseArm;
  if (arm === "orientation" && expectation.kind !== "mirrors") fail("SEMANTIC_VALIDATION_ORIENTATION_INCOMPLETE", `orientation case ${id} needs a mirrors expectation`);
  if (arm !== "orientation" && expectation.kind === "mirrors") fail("SEMANTIC_VALIDATION_CASE_INVALID", `only an orientation case may mirror`);
  if (arm === "positive" && expectation.kind !== "emits") fail("SEMANTIC_VALIDATION_CASE_INVALID", `positive case ${id} must expect emits`);
  if (arm === "semantic_negative" && expectation.kind !== "omits" && expectation.kind !== "abstains") fail("SEMANTIC_VALIDATION_CASE_INVALID", `negative case ${id} must expect omits or abstains`);
  const authority = parseSemanticValidationCaseAuthority(record.authority, subject, id);
  return Object.freeze({ id, version: 1, subject, arm, operation, input, authority, expectation }) as SemanticValidationCase;
}

// ---------------------------------------------------------------------------------------------
// §2 Root inventory and §R2 exact equalities
// ---------------------------------------------------------------------------------------------

/**
 * Explicit reading roots (§2). A reading is admitted only when active, `reading`, carries
 * `machine_condition` and has a sole value-authority factory; its owning RFC opted in.
 * `bounded-policy-targets` owns the two below; they enter the live root set only while active.
 */
export const SEMANTIC_READING_VALIDATION_ROOTS: readonly VersionedEvidenceId[] = Object.freeze([
  Object.freeze({ id: "derived.bounded_target.named_material_target", version: 1 }),
  Object.freeze({ id: "derived.bounded_target.bounded_return", version: 1 }),
]);

/**
 * Explicit event roots (changelog 2026-09-24). §2's event predicate admits only disposition-free
 * events, yet `bounded-policy-targets` lands `derived.bounded_target.immediate@1` inspector-only
 * and requires it to enter validation. An inspector-only event opts in here exactly like a
 * reading root; it has no `SemanticEventDeclaration` (the F1 compiler refuses a disposed event).
 */
export const SEMANTIC_EXPLICIT_EVENT_VALIDATION_ROOTS: readonly VersionedEvidenceId[] = Object.freeze([
  Object.freeze({ id: "derived.bounded_target.immediate", version: 1 }),
]);

/** §R1: the literal explicit-root declaration register (profile reference only). */
export interface SemanticReadingValidationDeclaration {
  readonly subject: SemanticValidationSubject;
}

export const SEMANTIC_READING_VALIDATION_DECLARATIONS: readonly SemanticReadingValidationDeclaration[] = Object.freeze([
  ...SEMANTIC_READING_VALIDATION_ROOTS.map((projection) => Object.freeze({ subject: Object.freeze({ kind: "reading" as const, projection }) })),
  ...SEMANTIC_EXPLICIT_EVENT_VALIDATION_ROOTS.map((projection) => Object.freeze({ subject: Object.freeze({ kind: "event" as const, projection }) })),
]);

function activeMachineCondition(projection: ProjectionDeclaration): boolean {
  return projection.disposition === undefined || projection.disposition.kind !== "retired";
}

/**
 * The live validation roots (§2 + changelog 2026-09-24): every active event projection with
 * `machine_condition` whose producer is not provider-availability, plus every admissible
 * explicit reading root. Provider-reported event readings (`live.*`) are source reports, not
 * semantic predicates this repository computes, and have no semantic-event declaration.
 */
export function semanticValidationRoots(manifest: CompiledEvidenceManifest, readingRoots: readonly VersionedEvidenceId[] = SEMANTIC_READING_VALIDATION_ROOTS, soleFactory: (projection: VersionedEvidenceId) => boolean = () => true): readonly SemanticValidationSubject[] {
  const providers = new Set(manifest.producers.filter((producer) => producer.availability === "provider").map((producer) => refKey(producer)));
  const events = manifest.projections.filter((projection) => projection.role === "event" && projection.disposition === undefined && projection.forms.includes("machine_condition") && !providers.has(refKey(projection.producer)));
  const readings: SemanticValidationSubject[] = [];
  for (const root of readingRoots) {
    const projection = manifest.projections.find((candidate) => refKey(candidate) === refKey(root));
    if (projection === undefined) continue; // unlanded: joins only once the projection is active (§R1)
    if (projection.role !== "reading" || !projection.forms.includes("machine_condition") || !activeMachineCondition(projection) || !soleFactory(root)) {
      fail("SEMANTIC_VALIDATION_ROOT_MISMATCH", `reading root ${refKey(root)} is not an active machine-condition reading with a sole value factory`);
    }
    readings.push(Object.freeze({ kind: "reading", projection: Object.freeze({ id: root.id, version: root.version }) }));
  }
  for (const root of SEMANTIC_EXPLICIT_EVENT_VALIDATION_ROOTS) {
    const projection = manifest.projections.find((candidate) => refKey(candidate) === refKey(root));
    if (projection === undefined || projection.disposition === undefined) continue; // unlanded, or already an ordinary root
    if (projection.role !== "event" || !projection.forms.includes("machine_condition") || projection.disposition.kind !== "inspector_only" || !soleFactory(root)) {
      fail("SEMANTIC_VALIDATION_ROOT_MISMATCH", `explicit event root ${refKey(root)} is not an inspector-only machine-condition event with a sole value factory`);
    }
    readings.push(Object.freeze({ kind: "event", projection: Object.freeze({ id: root.id, version: root.version }) }));
  }
  return Object.freeze([
    ...events.map((projection) => Object.freeze({ kind: "event" as const, projection: Object.freeze({ id: projection.id, version: projection.version }) })),
    ...readings,
  ].sort((left, right) => semanticValidationSubjectKey(left).localeCompare(semanticValidationSubjectKey(right))));
}

/** One uniqueness pass per population before any set is built (§R2, [[D2448]]). */
export function assertUniqueSubjects(label: string, subjects: readonly SemanticValidationSubject[]): ReadonlySet<string> {
  const seen = new Map<string, number>();
  subjects.forEach((subject, index) => {
    const key = semanticValidationSubjectKey(subject);
    if (seen.has(key)) fail("SEMANTIC_VALIDATION_DUPLICATE", `${label} contains ${key} twice (rows ${seen.get(key)} and ${index})`);
    seen.set(key, index);
  });
  return new Set(seen.keys());
}

function setDifference(left: ReadonlySet<string>, right: ReadonlySet<string>): readonly string[] {
  return [...left].filter((key) => !right.has(key)).sort();
}

/** Four-way root/declaration/profile/verdict equality, each proved unique first (§R2 criterion 1). */
export function assertSemanticValidationFourWayEquality(populations: Readonly<Record<"roots" | "declarations" | "profiles" | "verdicts", readonly SemanticValidationSubject[]>>): void {
  const sets = Object.fromEntries(Object.entries(populations).map(([label, subjects]) => [label, assertUniqueSubjects(label, subjects)])) as Record<string, ReadonlySet<string>>;
  const roots = sets.roots!;
  for (const label of ["declarations", "profiles", "verdicts"]) {
    const missing = setDifference(roots, sets[label]!);
    const extra = setDifference(sets[label]!, roots);
    if (missing.length > 0 || extra.length > 0) fail("SEMANTIC_VALIDATION_ROOT_MISMATCH", `${label} ≠ live roots${missing.length > 0 ? `; missing ${missing.join(", ")}` : ""}${extra.length > 0 ? `; extra ${extra.join(", ")}` : ""}`);
  }
}

export interface SemanticValidationRegistryRow {
  readonly kind: "case" | "population_receipt" | "external_disagreement_receipt";
  readonly id: string;
  readonly subject: SemanticValidationSubject;
  readonly arm: SemanticValidationArm;
}

/**
 * The three subset/bijection joins (§R2 criterion 14): every registry row's subject is a root,
 * every row is referenced exactly once by a same-kind/subject/arm present cell, and every present
 * ref resolves exactly one row. `required`/`not_applicable` cells reference nothing.
 */
export function assertSemanticValidationRegistryJoins(roots: readonly SemanticValidationSubject[], profiles: readonly SemanticValidationProfile[], rows: readonly SemanticValidationRegistryRow[]): void {
  const rootKeys = new Set(roots.map(semanticValidationSubjectKey));
  const rowKey = (kind: string, id: string): string => `${kind}:${id}`;
  const byKey = new Map<string, SemanticValidationRegistryRow>();
  for (const row of rows) {
    const key = rowKey(row.kind, row.id);
    if (byKey.has(key)) fail("SEMANTIC_VALIDATION_DUPLICATE", `registry row ${key} is duplicated`);
    if (!rootKeys.has(semanticValidationSubjectKey(row.subject))) fail("SEMANTIC_VALIDATION_ROOT_MISMATCH", `registry row ${key} names ${semanticValidationSubjectKey(row.subject)}, outside the live roots`);
    byKey.set(key, row);
  }
  const referenced = new Set<string>();
  for (const profile of profiles) for (const [cellKey, arm] of SEMANTIC_VALIDATION_PROFILE_CELLS) {
    const cell = profile[cellKey] as SemanticValidationCell<SemanticValidationArm>;
    if (cell.disposition !== "present") continue;
    for (const ref of cell.refs) {
      const key = rowKey(ref.kind, ref.id);
      const row = byKey.get(key);
      if (row === undefined) fail("SEMANTIC_VALIDATION_CASE_MISSING", `${semanticValidationSubjectKey(profile.subject)} ${arm} cell names ${key}, which has no registry row`);
      if (!sameSubject(row!.subject, profile.subject) || row!.arm !== arm) fail("SEMANTIC_VALIDATION_CASE_REF_STALE", `${key} is registered for another subject or arm`);
      if (referenced.has(key)) fail("SEMANTIC_VALIDATION_DUPLICATE", `${key} is referenced by more than one present cell`);
      referenced.add(key);
    }
  }
  const dead = [...byKey.keys()].filter((key) => !referenced.has(key));
  if (dead.length > 0) fail("SEMANTIC_VALIDATION_CASE_REF_STALE", `registry rows are referenced by no present cell: ${dead.join(", ")}`);
}

// ---------------------------------------------------------------------------------------------
// §4.1 Geometry: total mirror transforms and the closed operand walk
// ---------------------------------------------------------------------------------------------

function mirrorSquare(square: string, geometry: SemanticMirrorGeometry): string {
  const parsed = parseSquare(square as never);
  if (parsed === undefined) return fail("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA", `operand ${square} is not a square`);
  const file = parsed % 8;
  const rank = Math.floor(parsed / 8);
  const next = geometry === "horizontal" ? rank * 8 + (7 - file) : (7 - rank) * 8 + file;
  return makeSquare(next as Square);
}

const swapColor = (color: string): string => color === "white" ? "black" : color === "black" ? "white" : fail("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA", `operand ${color} is not a colour`);

/** The canonical transformed FEN of a mirror partner (§4.1); an unrepresentable result is invalid. */
export function mirrorSemanticFen(fen: string, geometry: SemanticMirrorGeometry): string {
  const setup = parseFen(fen);
  if (setup.isErr) return fail("SEMANTIC_VALIDATION_FIXTURE_INVALID", `mirror source FEN is invalid: ${fen}`);
  const source = setup.value;
  const board = source.board.clone();
  board.clear();
  for (const [square, piece] of source.board) {
    const target = parseSquare(mirrorSquare(makeSquare(square), geometry) as never)!;
    board.set(target, geometry === "color_and_vertical" ? { ...piece, color: swapColor(piece.color) as Color } : piece);
  }
  let mapped = SquareSet.empty();
  for (const square of source.castlingRights) mapped = mapped.with(parseSquare(mirrorSquare(makeSquare(square), geometry) as never)!);
  const epSquare = source.epSquare === undefined ? undefined : parseSquare(mirrorSquare(makeSquare(source.epSquare), geometry) as never);
  return makeFen({
    ...source,
    board,
    castlingRights: mapped,
    epSquare,
    turn: geometry === "color_and_vertical" ? (swapColor(source.turn) as Color) : source.turn,
  });
}

export function mirrorSemanticUci(uci: string, geometry: SemanticMirrorGeometry): string {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/u.test(uci)) return fail("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA", `move ${uci} is not a UCI`);
  return `${mirrorSquare(uci.slice(0, 2), geometry)}${mirrorSquare(uci.slice(2, 4), geometry)}${uci.slice(4)}`;
}

type Leaf = { readonly path: string; readonly value: unknown };

/** Every scalar leaf of an operand record, addressed by its concrete path (arrays by index). */
function operandLeaves(value: unknown, prefix: readonly string[] = []): readonly Leaf[] {
  if (value === null || typeof value !== "object") return [{ path: prefix.join("."), value }];
  if (Array.isArray(value)) return value.flatMap((entry, index) => operandLeaves(entry, [...prefix, String(index)]));
  return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => operandLeaves(entry, [...prefix, key]));
}

/** Concrete paths matched by one pattern with `*` over array indices. */
function matchPattern(pattern: readonly SemanticOperandPathSegment[], concrete: string): boolean {
  const parts = concrete.split(".");
  if (parts.length < pattern.length) return false;
  for (let index = 0; index < pattern.length; index += 1) {
    const segment = pattern[index]!;
    if (segment === "*") { if (!/^\d+$/u.test(parts[index]!)) return false; continue; }
    if (segment !== parts[index]) return false;
  }
  return parts.length === pattern.length;
}

function transformLeaf(value: unknown, rule: SemanticMirrorValueRule, geometry: SemanticMirrorGeometry): unknown {
  switch (rule) {
    case "identity": return value;
    case "square": return typeof value === "string" ? mirrorSquare(value, geometry) : fail("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA", `square rule over ${JSON.stringify(value)}`);
    case "color": return geometry === "color_and_vertical" ? swapColor(String(value)) : value;
    case "signed_file_delta": return typeof value === "number" ? (geometry === "horizontal" ? -value : value) : fail("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA", "file delta must be numeric");
    case "signed_rank_delta": return typeof value === "number" ? (geometry === "horizontal" ? value : -value) : fail("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA", "rank delta must be numeric");
  }
}

export interface SemanticMirrorObservation {
  readonly projection: VersionedEvidenceId;
  readonly sign: string;
  readonly operands: unknown;
}

/** Values of one rule's matched leaves, in leaf order, shaped by its collection kind. */
function ruleValues(leaves: readonly Leaf[], path: readonly SemanticOperandPathSegment[], rule: SemanticMirrorOperandRule, transform: (value: unknown) => unknown): unknown {
  const values = leaves.filter((leaf) => matchPattern(path, leaf.path)).map((leaf) => transform(leaf.value));
  if (rule.collection === "scalar") {
    if (values.length !== 1) fail("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA", `scalar rule ${path.join(".")} resolved ${values.length} leaves`);
    return values[0];
  }
  return rule.collection === "canonical_set" ? [...values].sort((left, right) => canonicalBytes(left).localeCompare(canonicalBytes(right))) : values;
}

function assertTotalCoverage(leaves: readonly Leaf[], side: "sourcePath" | "partnerPath", rules: readonly SemanticMirrorOperandRule[]): void {
  for (const leaf of leaves) {
    const covering = rules.filter((rule) => matchPattern(rule[side], leaf.path)).length;
    if (covering !== 1) fail("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA", `operand leaf ${leaf.path} is covered by ${covering} rules`);
  }
}

/**
 * The one closed operand walk (§4.1): every scalar leaf of each target observation is covered by
 * exactly one rule on its side, the transformed source multiset equals the partner multiset, and
 * pairing uses canonical `{projection, sign, operands}` keys — never an implementer-picked subset.
 * Empty, unequal, duplicate and unmatched populations fail before any pair is accepted.
 */
export function compareSemanticMirror(source: readonly SemanticMirrorObservation[], partner: readonly SemanticMirrorObservation[], geometry: SemanticMirrorGeometry, rules: readonly SemanticMirrorOperandRule[]): void {
  if (source.length === 0 && partner.length === 0) fail("SEMANTIC_VALIDATION_MIRROR_EMPTY", "neither mirror side emitted a target observation");
  if (source.length !== partner.length) fail("SEMANTIC_VALIDATION_MIRROR_MISMATCH", `mirror cardinality ${source.length} ≠ ${partner.length}`);
  const key = (observation: SemanticMirrorObservation, side: "sourcePath" | "partnerPath"): string => {
    const leaves = operandLeaves(observation.operands);
    assertTotalCoverage(leaves, side, rules);
    const values = rules.map((rule) => ruleValues(leaves, rule[side], rule, side === "sourcePath" ? (value) => transformLeaf(value, rule.value, geometry) : (value) => value));
    return evidenceDigest({ projection: observation.projection, sign: observation.sign, values });
  };
  const count = (keys: readonly string[]): Map<string, number> => keys.reduce((map, value) => map.set(value, (map.get(value) ?? 0) + 1), new Map<string, number>());
  const sourceCounts = count(source.map((observation) => key(observation, "sourcePath")));
  const partnerCounts = count(partner.map((observation) => key(observation, "partnerPath")));
  if ([...sourceCounts.values(), ...partnerCounts.values()].some((value) => value > 1)) fail("SEMANTIC_VALIDATION_MIRROR_AMBIGUOUS", "a canonical mirror key pairs more than one observation");
  for (const value of sourceCounts.keys()) if (!partnerCounts.has(value)) fail("SEMANTIC_VALIDATION_MIRROR_UNMATCHED", "a transformed source observation has no partner");
}

// ---------------------------------------------------------------------------------------------
// §6 Generated receipt and §7 verdicts
// ---------------------------------------------------------------------------------------------

export type SemanticValidationCellOutcome =
  | { readonly arm: SemanticValidationArm; readonly status: "passed"; readonly refs: readonly string[] }
  | { readonly arm: SemanticValidationArm; readonly status: "not_applicable"; readonly reason: SemanticValidationNotApplicableReason }
  | { readonly arm: SemanticValidationArm; readonly status: "required"; readonly owner: string; readonly discharge: string }
  | { readonly arm: SemanticValidationArm; readonly status: "failed"; readonly refs: readonly string[]; readonly failures: readonly string[] };

export interface SemanticValidationSubjectVerdict {
  readonly subject: SemanticValidationSubject;
  readonly verdict: "passed" | "unvalidated";
  readonly cells: readonly SemanticValidationCellOutcome[];
  /** Open arms by name: required debt plus failed executions. Empty only when passed. */
  readonly open: readonly SemanticValidationArm[];
}

/** The compact verdict row the runtime imports (the full per-cell receipt stays out of bundles). */
export interface SemanticValidationVerdictSummary {
  readonly subject: SemanticValidationSubject;
  readonly verdict: "passed" | "unvalidated";
  readonly open: readonly SemanticValidationArm[];
}

export interface SemanticValidationVerdictTable {
  readonly schemaVersion: 1;
  /** SHA-256 of the full generated receipt JSON these verdicts were compiled with. */
  readonly receiptSha256: string;
  readonly verdicts: readonly SemanticValidationVerdictSummary[];
}

/** The generated receipt document (§6). Only `make semantic-validation-update` writes it. */
export interface SemanticValidationReceiptDocument {
  readonly schemaVersion: 1;
  readonly writer: "make semantic-validation-update";
  readonly rootDigest: string;
  readonly profileDigest: string;
  readonly caseDigest: string;
  readonly externalDigest: string;
  readonly operations: readonly { readonly id: string; readonly version: 1; readonly implementationDigest: string; readonly files: readonly string[]; readonly reach: string }[];
  readonly population: {
    readonly id: string;
    readonly version: 1;
    readonly pgnSha256: string;
    readonly manifestSha256: string;
    readonly games: number;
    readonly sampledEdges: number;
    readonly recordedPaths: number;
    readonly recordedPathEdges: number;
    readonly projections: Readonly<Record<string, string>>;
  } | null;
  readonly cases: readonly Readonly<Record<string, unknown>>[];
  readonly populations: readonly Readonly<Record<string, unknown>>[];
  readonly externals: readonly Readonly<Record<string, unknown>>[];
  readonly verdicts: readonly SemanticValidationSubjectVerdict[];
}

/** Compiles one subject's verdict from its cell outcomes: passed only when no arm is open. */
export function compileSemanticValidationVerdict(subject: SemanticValidationSubject, cells: readonly SemanticValidationCellOutcome[]): SemanticValidationSubjectVerdict {
  if (cells.length !== SEMANTIC_VALIDATION_ARMS.length || SEMANTIC_VALIDATION_ARMS.some((arm, index) => cells[index]?.arm !== arm)) fail("SEMANTIC_VALIDATION_PROFILE_INVALID", `${semanticValidationSubjectKey(subject)} verdict does not carry all six arms in order`);
  const open = cells.filter((cell) => cell.status === "required" || cell.status === "failed").map((cell) => cell.arm);
  return Object.freeze({ subject, verdict: open.length === 0 ? "passed" : "unvalidated", cells: Object.freeze([...cells]), open: Object.freeze(open) });
}

/** Lookup over the generated table: exact subject; a missing subject is never passed. */
export function semanticValidationVerdictFor(table: SemanticValidationVerdictTable, subject: SemanticValidationSubject): SemanticValidationVerdictSummary | undefined {
  const key = semanticValidationSubjectKey(subject);
  return table.verdicts.find((row) => semanticValidationSubjectKey(row.subject) === key);
}

// ---------------------------------------------------------------------------------------------
// §R4 Owner authority store and the repository-derived transition guard
// ---------------------------------------------------------------------------------------------

export const SEMANTIC_VALIDATION_OWNER_STORE_PATH = "design/research/semantic-validation-owner-authorities.json";
export const SEMANTIC_VALIDATION_CASES_PATH = "packages/runtime/src/semantic-validation-cases.json";
export const SEMANTIC_VALIDATION_PROFILES_PATH = "packages/runtime/src/semantic-validation-profiles.json";

export interface SemanticValidationOwnerAuthorityRow {
  readonly id: string;
  readonly version: 1;
  readonly subject: SemanticValidationSubject;
  readonly case: { readonly id: string; readonly version: 1 };
  readonly expectation: SemanticValidationExpectation;
  readonly factConstraint: readonly SemanticValidationFactConstraint[];
  readonly ruling: `ledger:D${number}`;
  readonly authoredBy: "OWNER";
  readonly authoredAt: `${number}-${number}-${number}`;
}

export interface SemanticValidationOwnerAuthorityStore {
  readonly schemaVersion: 1;
  readonly authorities: readonly SemanticValidationOwnerAuthorityRow[];
}

/** Strict owner-store parser: sorted, unique, suffix-free, owner-authored and ruling-cited rows. */
export function parseSemanticValidationOwnerAuthorityStore(value: unknown): SemanticValidationOwnerAuthorityStore {
  const fault = (message: string): never => fail("SEMANTIC_VALIDATION_OWNER_STORE_INVALID", message);
  if (!isRecord(value) || Object.keys(value).sort().join(",") !== "authorities,schemaVersion") return fault("store keys must be exactly schemaVersion and authorities");
  if (value.schemaVersion !== 1) return fault("store schemaVersion must be 1");
  if (!Array.isArray(value.authorities)) return fault("authorities must be an array");
  const rows = value.authorities.map((row, index) => {
    if (!isRecord(row) || Object.keys(row).sort().join(",") !== "authoredAt,authoredBy,case,expectation,factConstraint,id,ruling,subject,version") return fault(`authority ${index} keys are not exact`);
    const subject = parseSemanticValidationSubject(row.subject);
    if (row.authoredBy !== "OWNER") return fault(`authority ${index} is not owner-authored`);
    if (typeof row.ruling !== "string" || !/^ledger:D\d+$/u.test(row.ruling)) return fault(`authority ${index} cites no ledger ruling`);
    if (typeof row.authoredAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(row.authoredAt)) return fault(`authority ${index} authoredAt is not a date`);
    const caseRecord = exactKeys(row.case, ["id", "version"], [], "owner case");
    return Object.freeze({
      id: parseBaseId(row.id, "owner authority id"),
      version: parseVersionOne(row.version, "owner authority"),
      subject,
      case: Object.freeze({ id: parseBaseId(caseRecord.id, "owner case id"), version: parseVersionOne(caseRecord.version, "owner case") }),
      expectation: parseSemanticValidationExpectation(row.expectation, subject),
      factConstraint: parseSemanticValidationFactConstraints(row.factConstraint),
      ruling: row.ruling as `ledger:D${number}`,
      authoredBy: "OWNER" as const,
      authoredAt: row.authoredAt as `${number}-${number}-${number}`,
    });
  });
  const keys = rows.map((row) => `${row.id}@${row.version}`);
  if (new Set(keys).size !== keys.length) return fault("owner authorities are not unique");
  if (keys.join("\0") !== [...keys].sort().join("\0")) return fault("owner authorities are not sorted by id/version");
  return Object.freeze({ schemaVersion: 1, authorities: Object.freeze(rows) });
}

/** A read-only view of one repository tree (base or candidate): path → bytes, or undefined if absent. */
export type SemanticValidationTreeReader = (path: string) => string | undefined;

/** Owner-ledger rulings present in a work-state document (`planning/work-state.json`). */
export type SemanticValidationRulingReader = (tree: SemanticValidationTreeReader) => ReadonlySet<string>;

function ownerKeysReachableFromPresent(tree: SemanticValidationTreeReader): ReadonlySet<string> {
  const profilesText = tree(SEMANTIC_VALIDATION_PROFILES_PATH);
  const casesText = tree(SEMANTIC_VALIDATION_CASES_PATH);
  if (profilesText === undefined || casesText === undefined) return new Set();
  const profiles = (JSON.parse(profilesText) as { readonly profiles: readonly unknown[] }).profiles.map(parseSemanticValidationProfile);
  const cases = (JSON.parse(casesText) as { readonly cases: readonly unknown[] }).cases.map(parseSemanticValidationCase);
  const present = new Set<string>();
  for (const profile of profiles) for (const [key] of SEMANTIC_VALIDATION_PROFILE_CELLS) {
    const cell = profile[key] as SemanticValidationCell<SemanticValidationArm>;
    if (cell.disposition === "present") for (const ref of cell.refs) if (ref.kind === "case") present.add(ref.id);
  }
  const owners = new Set<string>();
  for (const value of cases) {
    if (!present.has(value.id)) continue;
    const authority = value.authority;
    const owner = authority.kind === "owner_authored" ? authority : authority.kind === "rules_and_proposition" && authority.proposition.kind === "owner_authored" ? authority.proposition : undefined;
    if (owner !== undefined) owners.add(`${owner.id}@${owner.version}`);
  }
  return owners;
}

/**
 * The staged owner-authority transition guard (§R4, [[D2447]]). It reads base and candidate trees
 * itself — never an admitted-ref list, row list or ruling list from its caller — and rejects owner
 * row mutation/removal, uncited rows, same-change row+case admission and any newly present case
 * whose owner row did not already exist in the base tree.
 */
export function assertSemanticValidationOwnerTransition(base: SemanticValidationTreeReader, candidate: SemanticValidationTreeReader, rulings: SemanticValidationRulingReader): void {
  const storeOf = (tree: SemanticValidationTreeReader): SemanticValidationOwnerAuthorityStore | undefined => {
    const text = tree(SEMANTIC_VALIDATION_OWNER_STORE_PATH);
    return text === undefined ? undefined : parseSemanticValidationOwnerAuthorityStore(JSON.parse(text));
  };
  const baseStore = storeOf(base);
  const candidateStore = storeOf(candidate);
  const baseRows = new Map((baseStore?.authorities ?? []).map((row) => [`${row.id}@${row.version}`, evidenceDigest(row)]));
  const candidateRows = new Map((candidateStore?.authorities ?? []).map((row) => [`${row.id}@${row.version}`, { digest: evidenceDigest(row), row }]));
  for (const [key, digest] of baseRows) {
    const next = candidateRows.get(key);
    if (next === undefined) fail("SEMANTIC_VALIDATION_OWNER_TRANSITION", `owner authority ${key} was removed`);
    if (next!.digest !== digest) fail("SEMANTIC_VALIDATION_OWNER_TRANSITION", `owner authority ${key} was mutated`);
  }
  const candidateRulings = rulings(candidate);
  for (const [key, { row }] of candidateRows) if (!candidateRulings.has(row.ruling.slice("ledger:".length))) fail("SEMANTIC_VALIDATION_OWNER_TRANSITION", `owner authority ${key} cites ${row.ruling}, which is not an owner-ledger ruling`);
  const introduced = new Set([...candidateRows.keys()].filter((key) => !baseRows.has(key)));
  const reachable = ownerKeysReachableFromPresent(candidate);
  for (const key of reachable) {
    if (introduced.has(key)) fail("SEMANTIC_VALIDATION_OWNER_TRANSITION", `owner authority ${key} and the case admitting it arrive in the same change`);
    if (!baseRows.has(key)) fail("SEMANTIC_VALIDATION_OWNER_TRANSITION", `a present case names owner authority ${key}, absent from the base tree`);
  }
}

/** A sealed-digest helper shared by build and tests for receipt/profile/case digests. */
export function semanticValidationDigest(domain: string, value: unknown): string {
  return evidenceDigest({ domain: `tabiya:semantic-validation-${domain}@1`, value });
}

export type { Role };
