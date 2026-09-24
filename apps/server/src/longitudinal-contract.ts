// rfc/longitudinal-store.md §B/§C/§F — the closed consumer contract: decision references, the
// five-state job union, the three parsed row families, the branded read query and the per-cut
// result grain. Every value crossing the store boundary is constructed by a parser in this module.
import type { SemanticEventSign } from "@chess-tabiya/runtime";

import {
  LONGITUDINAL_ADMITTED_IDENTITIES,
  LONGITUDINAL_SEMANTIC_SIGNS,
  identityKey,
  isAdmittedIdentity,
  isAdmittedProjection,
} from "./longitudinal-registry.js";

export const LONGITUDINAL_PHASES = Object.freeze(["opening", "middlegame", "endgame", "unclear"] as const);
export const LONGITUDINAL_DECISION_CLASSES = Object.freeze(["played", "game", "predicted"] as const);
export const LONGITUDINAL_SESSION_KINDS = Object.freeze(["pack", "position", "imported"] as const);
export type LongitudinalPhase = (typeof LONGITUDINAL_PHASES)[number];
export type LongitudinalDecisionClass = (typeof LONGITUDINAL_DECISION_CLASSES)[number];
export type LongitudinalSessionKind = (typeof LONGITUDINAL_SESSION_KINDS)[number];

export const LONGITUDINAL_STRUCTURE_ATTRIBUTIONS = Object.freeze(["single_player", "unattributable_shared", "unattributable_legacy"] as const);
export type LongitudinalStructureAttribution = (typeof LONGITUDINAL_STRUCTURE_ATTRIBUTIONS)[number];
export const LONGITUDINAL_PROFILE_DISPOSITIONS = Object.freeze(["profileable", "account_deleted"] as const);
export type LongitudinalProfileDisposition = (typeof LONGITUDINAL_PROFILE_DISPOSITIONS)[number];

export class LongitudinalContractError extends TypeError {
  constructor(readonly code: string, message = code) {
    super(message.startsWith(code) ? message : `${code}: ${message}`);
    this.name = "LongitudinalContractError";
  }
}

function fail(code: string, detail?: string): never {
  throw new LongitudinalContractError(code, detail === undefined ? code : `${code}: ${detail}`);
}

function record(value: unknown, code: string): Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(code, "not an object");
  return value as Readonly<Record<string, unknown>>;
}

function exactKeys(value: Readonly<Record<string, unknown>>, required: readonly string[], optional: readonly string[], code: string): void {
  const keys = Object.keys(value);
  for (const key of keys) if (!required.includes(key) && !optional.includes(key)) fail(code, `unknown key ${key}`);
  for (const key of required) if (!(key in value)) fail(code, `missing key ${key}`);
}

function nonEmptyString(value: unknown, code: string): string {
  if (typeof value !== "string" || value.length === 0) fail(code, "expected a non-empty string");
  return value;
}

function integerAtLeast(value: unknown, minimum: number, code: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) fail(code, `expected an integer >= ${minimum}`);
  return value;
}

function member<T extends string>(value: unknown, values: readonly T[], code: string): T {
  if (typeof value !== "string" || !(values as readonly string[]).includes(value)) fail(code, `unknown value ${String(value)}`);
  return value as T;
}

/** Canonical instants are millisecond ISO-8601 UTC strings: `new Date(x).toISOString() === x`. */
export function canonicalInstant(value: unknown, code: string): string {
  if (typeof value !== "string") fail(code, "instant is not a string");
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) fail(code, "instant is not canonical");
  return value;
}

export function instantFromMillis(millis: number): string {
  return new Date(millis).toISOString();
}

const DIGEST = /^sha256:[0-9a-f]{64}$/u;
export function sourceDigestValue(value: unknown, code: string): `sha256:${string}` {
  if (typeof value !== "string" || !DIGEST.test(value)) fail(code, "digest is not sha256:<64 lower hex>");
  return value as `sha256:${string}`;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

// ---------------------------------------------------------------------------------------------
// §B decision references

export type DecisionRef =
  | { readonly kind: "move"; readonly nodeId: string; readonly eventSeq: number }
  | { readonly kind: "prediction"; readonly nodeId: string; readonly checkpointId: string; readonly eventSeq: number };

export function compareDecisionRefs(left: DecisionRef, right: DecisionRef): number {
  if (left.eventSeq !== right.eventSeq) return left.eventSeq - right.eventSeq;
  if (left.kind !== right.kind) return left.kind < right.kind ? -1 : 1;
  if (left.nodeId !== right.nodeId) return left.nodeId < right.nodeId ? -1 : 1;
  const leftCheckpoint = left.kind === "prediction" ? left.checkpointId : "";
  const rightCheckpoint = right.kind === "prediction" ? right.checkpointId : "";
  return leftCheckpoint === rightCheckpoint ? 0 : leftCheckpoint < rightCheckpoint ? -1 : 1;
}

export function parseDecisionRef(value: unknown): DecisionRef {
  const row = record(value, "LONGITUDINAL_DECISION_REF_INVALID");
  const kind = member(row.kind, ["move", "prediction"] as const, "LONGITUDINAL_DECISION_REF_INVALID");
  if (kind === "move") {
    exactKeys(row, ["kind", "nodeId", "eventSeq"], [], "LONGITUDINAL_DECISION_REF_INVALID");
    return Object.freeze({ kind, nodeId: nonEmptyString(row.nodeId, "LONGITUDINAL_DECISION_REF_INVALID"), eventSeq: integerAtLeast(row.eventSeq, 1, "LONGITUDINAL_DECISION_REF_INVALID") });
  }
  exactKeys(row, ["kind", "nodeId", "checkpointId", "eventSeq"], [], "LONGITUDINAL_DECISION_REF_INVALID");
  return Object.freeze({
    kind,
    nodeId: nonEmptyString(row.nodeId, "LONGITUDINAL_DECISION_REF_INVALID"),
    checkpointId: nonEmptyString(row.checkpointId, "LONGITUDINAL_DECISION_REF_INVALID"),
    eventSeq: integerAtLeast(row.eventSeq, 1, "LONGITUDINAL_DECISION_REF_INVALID"),
  });
}

/** A canonically sorted, duplicate-free `DecisionRef[]`; unsorted or duplicate input is refused. */
export function parseDecisionRefs(value: unknown): readonly DecisionRef[] {
  if (!Array.isArray(value)) fail("LONGITUDINAL_DECISION_REFS_INVALID", "not an array");
  const refs = value.map(parseDecisionRef);
  for (let index = 1; index < refs.length; index += 1) {
    if (compareDecisionRefs(refs[index - 1]!, refs[index]!) >= 0) fail("LONGITUDINAL_DECISION_REFS_INVALID", "refs are unsorted or duplicated");
  }
  return Object.freeze(refs);
}

// ---------------------------------------------------------------------------------------------
// §C job union

export const LONGITUDINAL_FAILURE_CODES = Object.freeze(["snapshot_invalid", "derivation_failed", "publication_conflict"] as const);
export type LongitudinalFailureCode = (typeof LONGITUDINAL_FAILURE_CODES)[number];

/** Total attempt budgets; the retry counter is shared across codes and never resets inside one source image. */
export const LONGITUDINAL_RETRY_LIMITS = Object.freeze({
  snapshot_invalid: 1,
  derivation_failed: 3,
  publication_conflict: 5,
} as const satisfies Readonly<Record<LongitudinalFailureCode, number>>);
export const LONGITUDINAL_MAX_ATTEMPTS = 5;

export function longitudinalRetryDelayMs(attempt: number): number {
  if (!Number.isSafeInteger(attempt) || attempt < 1) fail("LONGITUDINAL_RETRY_ATTEMPT_INVALID");
  return Math.min(300_000, 5_000 * (2 ** (attempt - 1)));
}

export const LONGITUDINAL_JOB_STATES = Object.freeze(["pending", "running", "complete", "retry_wait", "quarantined"] as const);
export type LongitudinalJobState = (typeof LONGITUDINAL_JOB_STATES)[number];

interface JobBase {
  readonly runId: string;
  readonly learnerId: string;
  readonly requestedSeq: number;
  readonly requestedSourceDigest: `sha256:${string}`;
  readonly derivedRev: number;
  readonly claimGeneration: number;
  readonly updatedAt: string;
}
export interface LongitudinalClaimTuple {
  readonly claimedRequestedSeq: number;
  readonly claimedSourceDigest: `sha256:${string}`;
  readonly claimToken: string;
  readonly claimedBy: string;
  readonly leaseExpiresAt: string;
}
export type LongitudinalJob =
  | (JobBase & { readonly state: "pending"; readonly completedSeq: 0; readonly retryCount: 0 })
  | (JobBase & { readonly state: "running"; readonly completedSeq: 0; readonly retryCount: number; readonly claim: LongitudinalClaimTuple })
  | (JobBase & { readonly state: "complete"; readonly completedSeq: number; readonly retryCount: 0 })
  | (JobBase & { readonly state: "retry_wait"; readonly completedSeq: 0; readonly retryCount: number; readonly failureCode: "derivation_failed" | "publication_conflict"; readonly nextAttemptAt: string })
  | (JobBase & { readonly state: "quarantined"; readonly completedSeq: 0; readonly retryCount: number; readonly failureCode: LongitudinalFailureCode });

export const LONGITUDINAL_JOB_COLUMNS = Object.freeze([
  "run_id", "learner_id", "requested_seq", "requested_source_digest", "completed_seq", "derived_rev", "state",
  "claim_generation", "claimed_requested_seq", "claimed_source_digest", "claim_token", "claimed_by",
  "lease_expires_at", "retry_count", "next_attempt_at", "failure_code", "updated_at",
] as const);

/**
 * The one exact job parser ([[D2997]]/[[D2998]]). It is the TypeScript mirror of the migration-26
 * CHECK set: every state fixes completed progress, retry budget, claim tuple and schedule fields.
 */
export function parseLongitudinalJobRow(value: unknown): LongitudinalJob {
  const code = "LONGITUDINAL_JOB_ROW_INVALID";
  const row = record(value, code);
  exactKeys(row, LONGITUDINAL_JOB_COLUMNS, [], code);
  const state = member(row.state, LONGITUDINAL_JOB_STATES, code);
  const requestedSeq = integerAtLeast(row.requested_seq, 1, code);
  const completedSeq = integerAtLeast(row.completed_seq, 0, code);
  const retryCount = integerAtLeast(row.retry_count, 0, code);
  const base: JobBase = {
    runId: nonEmptyString(row.run_id, code),
    learnerId: nonEmptyString(row.learner_id, code),
    requestedSeq,
    requestedSourceDigest: sourceDigestValue(row.requested_source_digest, code),
    derivedRev: integerAtLeast(row.derived_rev, 1, code),
    claimGeneration: integerAtLeast(row.claim_generation, 0, code),
    updatedAt: canonicalInstant(row.updated_at, code),
  };
  const claimFields = [row.claimed_requested_seq, row.claimed_source_digest, row.claim_token, row.claimed_by, row.lease_expires_at];
  const noClaim = claimFields.every((field) => field === null);
  const failureCode = row.failure_code === null ? null : member(row.failure_code, LONGITUDINAL_FAILURE_CODES, code);
  if (state === "running") {
    if (completedSeq !== 0 || row.next_attempt_at !== null || failureCode !== null || retryCount >= LONGITUDINAL_MAX_ATTEMPTS) fail(code, "running shape");
    const claim: LongitudinalClaimTuple = {
      claimedRequestedSeq: integerAtLeast(row.claimed_requested_seq, 1, code),
      claimedSourceDigest: sourceDigestValue(row.claimed_source_digest, code),
      claimToken: nonEmptyString(row.claim_token, code),
      claimedBy: nonEmptyString(row.claimed_by, code),
      leaseExpiresAt: canonicalInstant(row.lease_expires_at, code),
    };
    if (claim.claimedRequestedSeq !== requestedSeq || claim.claimedSourceDigest !== base.requestedSourceDigest) fail(code, "claim tuple is not the requested cut");
    return deepFreeze({ ...base, state, completedSeq: 0, retryCount, claim });
  }
  if (!noClaim) fail(code, "claim fields outside running");
  if (state === "pending") {
    if (completedSeq !== 0 || retryCount !== 0 || failureCode !== null || row.next_attempt_at !== null) fail(code, "pending shape");
    return deepFreeze({ ...base, state, completedSeq: 0, retryCount: 0 });
  }
  if (state === "complete") {
    if (completedSeq !== requestedSeq || retryCount !== 0 || failureCode !== null || row.next_attempt_at !== null) fail(code, "complete shape");
    return deepFreeze({ ...base, state, completedSeq, retryCount: 0 });
  }
  if (state === "retry_wait") {
    if (completedSeq !== 0 || (failureCode !== "derivation_failed" && failureCode !== "publication_conflict")
      || retryCount < 1 || retryCount >= LONGITUDINAL_RETRY_LIMITS[failureCode]) fail(code, "retry_wait shape");
    return deepFreeze({ ...base, state, completedSeq: 0, retryCount, failureCode, nextAttemptAt: canonicalInstant(row.next_attempt_at, code) });
  }
  if (completedSeq !== 0 || failureCode === null || row.next_attempt_at !== null || retryCount < LONGITUDINAL_RETRY_LIMITS[failureCode]) fail(code, "quarantined shape");
  return deepFreeze({ ...base, state, completedSeq: 0, retryCount, failureCode });
}

// ---------------------------------------------------------------------------------------------
// §C parsed row families ([[D2571]])

export interface LongitudinalDenominatorRow {
  readonly learnerId: string;
  readonly runId: string;
  readonly phase: LongitudinalPhase;
  readonly decisionClass: LongitudinalDecisionClass;
  readonly decisions: number;
  readonly observedAt: string;
  readonly derivedRev: number;
}
export interface LongitudinalObservationRow extends LongitudinalDenominatorRow {
  readonly projectionId: string;
  readonly projectionVersion: number;
  readonly semanticSign: SemanticEventSign;
  readonly sourceSign: SemanticEventSign;
  readonly sessionKind: LongitudinalSessionKind;
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
  readonly sessionKind: LongitudinalSessionKind;
  readonly packId: string | null;
  readonly branchCount: number;
  readonly rewoundCount: number;
  readonly forkedCount: number;
  readonly groupCount: number;
  readonly outcomeCount: number;
  readonly observedAt: string;
  readonly derivedRev: number;
}

const DENOMINATOR_KEYS = ["learnerId", "runId", "phase", "decisionClass", "decisions", "observedAt", "derivedRev"] as const;
const OBSERVATION_KEYS = [
  "learnerId", "runId", "phase", "decisionClass", "decisions", "observedAt", "derivedRev", "projectionId", "projectionVersion",
  "semanticSign", "sourceSign", "sessionKind", "packId", "opportunities", "occurred", "alternativeShareSum", "occurredRefs", "opportunityRefs",
] as const;
const STRUCTURE_KEYS = [
  "learnerId", "runId", "rootKey", "rootNodeId", "sessionKind", "packId", "branchCount", "rewoundCount", "forkedCount",
  "groupCount", "outcomeCount", "observedAt", "derivedRev",
] as const;

function packProvenance(sessionKind: LongitudinalSessionKind, packId: unknown, code: string): string | null {
  if (sessionKind === "pack") return nonEmptyString(packId, code);
  if (packId !== null) fail(code, "non-pack row carries a pack id");
  return null;
}

export function parseLongitudinalDenominatorRow(value: unknown): LongitudinalDenominatorRow {
  const code = "LONGITUDINAL_DENOMINATOR_ROW_INVALID";
  const row = record(value, code);
  exactKeys(row, DENOMINATOR_KEYS, [], code);
  return Object.freeze({
    learnerId: nonEmptyString(row.learnerId, code),
    runId: nonEmptyString(row.runId, code),
    phase: member(row.phase, LONGITUDINAL_PHASES, code),
    decisionClass: member(row.decisionClass, LONGITUDINAL_DECISION_CLASSES, code),
    decisions: integerAtLeast(row.decisions, 1, code),
    observedAt: canonicalInstant(row.observedAt, code),
    derivedRev: integerAtLeast(row.derivedRev, 1, code),
  });
}

export function parseLongitudinalObservationRow(value: unknown): LongitudinalObservationRow {
  const code = "LONGITUDINAL_OBSERVATION_ROW_INVALID";
  const row = record(value, code);
  exactKeys(row, OBSERVATION_KEYS, [], code);
  const denominator = parseLongitudinalDenominatorRow(Object.fromEntries(DENOMINATOR_KEYS.map((key) => [key, row[key]])));
  const projectionId = nonEmptyString(row.projectionId, code);
  const projectionVersion = integerAtLeast(row.projectionVersion, 1, code);
  const semanticSign = member(row.semanticSign, LONGITUDINAL_SEMANTIC_SIGNS, code);
  const sourceSign = member(row.sourceSign, LONGITUDINAL_SEMANTIC_SIGNS, code);
  if (!isAdmittedIdentity({ projectionId, projectionVersion, semanticSign, sourceSign })) fail(code, "identity is not in the compiled ingest registry");
  const sessionKind = member(row.sessionKind, LONGITUDINAL_SESSION_KINDS, code);
  const opportunities = integerAtLeast(row.opportunities, 1, code);
  const occurred = integerAtLeast(row.occurred, 0, code);
  if (opportunities > denominator.decisions || occurred > opportunities) fail(code, "crossed counts");
  const share = row.alternativeShareSum;
  if (typeof share !== "number" || !Number.isFinite(share) || share < 0 || share > opportunities) fail(code, "alternative share out of range");
  const occurredRefs = parseDecisionRefs(row.occurredRefs);
  const opportunityRefs = parseDecisionRefs(row.opportunityRefs);
  if (occurredRefs.length !== occurred || opportunityRefs.length !== opportunities) fail(code, "ref cardinality differs from counts");
  const opportunityKeys = new Set(opportunityRefs.map((ref) => JSON.stringify(ref)));
  if (occurredRefs.some((ref) => !opportunityKeys.has(JSON.stringify(ref)))) fail(code, "occurred ref is not an opportunity ref");
  return Object.freeze({
    ...denominator, projectionId, projectionVersion, semanticSign, sourceSign, sessionKind,
    packId: packProvenance(sessionKind, row.packId, code),
    opportunities, occurred, alternativeShareSum: share, occurredRefs, opportunityRefs,
  });
}

export function parseLongitudinalStructureStatRow(value: unknown): LongitudinalStructureStatRow {
  const code = "LONGITUDINAL_STRUCTURE_ROW_INVALID";
  const row = record(value, code);
  exactKeys(row, STRUCTURE_KEYS, [], code);
  const sessionKind = member(row.sessionKind, LONGITUDINAL_SESSION_KINDS, code);
  return Object.freeze({
    learnerId: nonEmptyString(row.learnerId, code),
    runId: nonEmptyString(row.runId, code),
    rootKey: nonEmptyString(row.rootKey, code),
    rootNodeId: nonEmptyString(row.rootNodeId, code),
    sessionKind,
    packId: packProvenance(sessionKind, row.packId, code),
    branchCount: integerAtLeast(row.branchCount, 1, code),
    rewoundCount: integerAtLeast(row.rewoundCount, 0, code),
    forkedCount: integerAtLeast(row.forkedCount, 0, code),
    groupCount: integerAtLeast(row.groupCount, 0, code),
    outcomeCount: integerAtLeast(row.outcomeCount, 0, code),
    observedAt: canonicalInstant(row.observedAt, code),
    derivedRev: integerAtLeast(row.derivedRev, 1, code),
  });
}

// ---------------------------------------------------------------------------------------------
// §C branded read query ([[D2573]]) and per-cut result grain ([[D2514]])

export interface LongitudinalProjectionFilter {
  readonly id: string;
  readonly version: number;
  readonly semanticSign?: SemanticEventSign;
  readonly sourceSign?: SemanticEventSign;
}
export interface LongitudinalReadFilter {
  readonly projections?: readonly LongitudinalProjectionFilter[];
  readonly phases?: readonly LongitudinalPhase[];
  readonly decisionClasses?: readonly LongitudinalDecisionClass[];
  readonly sessionKinds?: readonly LongitudinalSessionKind[];
  readonly packIds?: readonly string[];
}
export interface LongitudinalReadQuery {
  readonly learnerId: string;
  readonly derivationRev: number;
  readonly through:
    | { readonly kind: "all_complete" }
    | { readonly kind: "runs"; readonly cuts: readonly { readonly runId: string; readonly requestedSeq: number }[] };
  readonly filter: LongitudinalReadFilter;
}
declare const parsedQueryBrand: unique symbol;
export type ParsedLongitudinalReadQuery = LongitudinalReadQuery & { readonly [parsedQueryBrand]: true };
const PARSED_QUERIES = new WeakSet<object>();

function sortedUnique<T>(values: readonly T[], key: (value: T) => string, code: string): readonly T[] {
  if (values.length === 0) fail(code, "a present filter array must be non-empty");
  const keyed = values.map((value) => [key(value), value] as const);
  if (new Set(keyed.map(([identity]) => identity)).size !== keyed.length) fail(code, "duplicate filter member");
  return Object.freeze(keyed.sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0)).map(([, value]) => value));
}

export function parseLongitudinalReadQuery(value: unknown): ParsedLongitudinalReadQuery {
  const code = "LONGITUDINAL_READ_QUERY_INVALID";
  const root = record(value, code);
  exactKeys(root, ["learnerId", "derivationRev", "through", "filter"], [], code);
  const through = record(root.through, code);
  let parsedThrough: LongitudinalReadQuery["through"];
  if (through.kind === "all_complete") {
    exactKeys(through, ["kind"], [], code);
    parsedThrough = Object.freeze({ kind: "all_complete" });
  } else if (through.kind === "runs") {
    exactKeys(through, ["kind", "cuts"], [], code);
    if (!Array.isArray(through.cuts) || through.cuts.length === 0) fail(code, "runs query needs at least one cut");
    const cuts = (through.cuts as readonly unknown[]).map((cut) => {
      const item = record(cut, code);
      exactKeys(item, ["runId", "requestedSeq"], [], code);
      return Object.freeze({ runId: nonEmptyString(item.runId, code), requestedSeq: integerAtLeast(item.requestedSeq, 1, code) });
    });
    parsedThrough = Object.freeze({ kind: "runs", cuts: sortedUnique(cuts, (cut) => cut.runId, code) });
  } else fail(code, "unknown through kind");
  const filter = record(root.filter, code);
  exactKeys(filter, [], ["projections", "phases", "decisionClasses", "sessionKinds", "packIds"], code);
  const out: { -readonly [K in keyof LongitudinalReadFilter]: LongitudinalReadFilter[K] } = {};
  if (filter.projections !== undefined) {
    if (!Array.isArray(filter.projections)) fail(code, "projections is not an array");
    const projections = (filter.projections as readonly unknown[]).map((entry): LongitudinalProjectionFilter => {
      const item = record(entry, code);
      exactKeys(item, ["id", "version"], ["semanticSign", "sourceSign"], code);
      const id = nonEmptyString(item.id, code);
      const version = integerAtLeast(item.version, 1, code);
      const semanticSign = item.semanticSign === undefined ? undefined : member(item.semanticSign, LONGITUDINAL_SEMANTIC_SIGNS, code);
      const sourceSign = item.sourceSign === undefined ? undefined : member(item.sourceSign, LONGITUDINAL_SEMANTIC_SIGNS, code);
      if (!isAdmittedProjection(id, version)) fail(code, `projection ${id}@${version} is not admitted at revision 1`);
      const matches = LONGITUDINAL_ADMITTED_IDENTITIES.some((identity) => identity.projectionId === id && identity.projectionVersion === version
        && (semanticSign === undefined || identity.semanticSign === semanticSign)
        && (sourceSign === undefined || identity.sourceSign === sourceSign));
      if (!matches) fail(code, `projection ${id}@${version} has no admitted sign pair for the requested signs`);
      return Object.freeze({ id, version, ...(semanticSign === undefined ? {} : { semanticSign }), ...(sourceSign === undefined ? {} : { sourceSign }) });
    });
    out.projections = sortedUnique(projections, (item) => `${item.id}\0${item.version}\0${item.semanticSign ?? ""}\0${item.sourceSign ?? ""}`, code);
  }
  const enumArray = <T extends string>(field: string, values: readonly T[]): readonly T[] | undefined => {
    const raw = filter[field];
    if (raw === undefined) return undefined;
    if (!Array.isArray(raw)) fail(code, `${field} is not an array`);
    return sortedUnique((raw as readonly unknown[]).map((item) => member(item, values, code)), (item) => item, code);
  };
  const phases = enumArray("phases", LONGITUDINAL_PHASES);
  const decisionClasses = enumArray("decisionClasses", LONGITUDINAL_DECISION_CLASSES);
  const sessionKinds = enumArray("sessionKinds", LONGITUDINAL_SESSION_KINDS);
  if (phases !== undefined) out.phases = phases;
  if (decisionClasses !== undefined) out.decisionClasses = decisionClasses;
  if (sessionKinds !== undefined) out.sessionKinds = sessionKinds;
  if (filter.packIds !== undefined) {
    if (!Array.isArray(filter.packIds)) fail(code, "packIds is not an array");
    out.packIds = sortedUnique((filter.packIds as readonly unknown[]).map((item) => nonEmptyString(item, code)), (item) => item, code);
    if (sessionKinds !== undefined && !sessionKinds.includes("pack")) fail(code, "packIds contradict a sessionKinds filter that excludes pack");
  }
  const parsed = Object.freeze({
    learnerId: nonEmptyString(root.learnerId, code),
    derivationRev: integerAtLeast(root.derivationRev, 1, code),
    through: parsedThrough,
    filter: Object.freeze(out),
  }) as ParsedLongitudinalReadQuery;
  PARSED_QUERIES.add(parsed);
  return parsed;
}

export function assertParsedLongitudinalReadQuery(value: unknown): asserts value is ParsedLongitudinalReadQuery {
  if (value === null || typeof value !== "object" || !PARSED_QUERIES.has(value)) fail("LONGITUDINAL_READ_QUERY_UNPARSED");
}

export type LongitudinalCompleteCut = {
  readonly kind: "complete"; readonly runId: string; readonly requestedSeq: number; readonly completedSeq: number; readonly derivedRev: number;
};
export type LongitudinalCutOutcome =
  | LongitudinalCompleteCut
  | { readonly kind: "pending"; readonly runId: string; readonly requestedSeq: number; readonly completedSeq: number; readonly derivedRev: number; readonly retryAt?: string }
  | { readonly kind: "failed"; readonly runId: string; readonly requestedSeq: number; readonly completedSeq: number; readonly derivedRev: number; readonly failureCode: LongitudinalFailureCode; readonly attempts: number }
  | { readonly kind: "unavailable"; readonly runId: string; readonly requestedSeq: number; readonly reason: "not_requested" | "revision_mismatch" | "profile_suppressed" | "cut_superseded" };
export type LongitudinalReadResult =
  | {
    readonly kind: "complete"; readonly cuts: readonly LongitudinalCompleteCut[];
    readonly denominators: readonly LongitudinalDenominatorRow[];
    readonly observations: readonly LongitudinalObservationRow[];
    readonly structureStats: readonly LongitudinalStructureStatRow[];
  }
  | { readonly kind: "incomplete"; readonly cuts: readonly LongitudinalCutOutcome[] };

export function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/** Stable bytewise order `(runId, projectionId, version, semanticSign, sourceSign, phase, decisionClass)`. */
export function observationSortKey(row: LongitudinalObservationRow): string {
  return `${row.runId}\0${row.projectionId}\0${String(row.projectionVersion).padStart(6, "0")}\0${row.semanticSign}\0${row.sourceSign}\0${row.phase}\0${row.decisionClass}`;
}

export function observationRowKey(row: Pick<LongitudinalObservationRow, "runId" | "projectionId" | "projectionVersion" | "semanticSign" | "sourceSign" | "phase" | "decisionClass">): string {
  return `${row.runId}\0${identityKey(row)}\0${row.phase}\0${row.decisionClass}`;
}
