// DISPOSABLE research harness — D1612–D1617. Not production code.
import { createHash } from "node:crypto";

import {
  AVOIDANCE_EVENT_PROJECTION_IDS,
  SEMANTIC_EVENT_PROJECTION_IDS,
  TACTICAL_AVOIDANCE_EVENT_PROJECTION_IDS,
} from "../../packages/runtime/src/evidence-catalog.js";

const PATH_IDS = Object.freeze([
  "derived.exchange.trade_completed",
  "derived.tactic.deflection_observed",
  "derived.tactic.attraction_observed",
  "derived.tactic.line_blocker_clearance_observed",
  "derived.tactic.square_clearance_observed",
  "derived.tactic.interference_observed",
  "derived.tactic.check_zwischenzug_observed",
  "derived.tactic.overload_exploitation_observed",
]);
const POPULATION_IDS = Object.freeze([...AVOIDANCE_EVENT_PROJECTION_IDS, ...TACTICAL_AVOIDANCE_EVENT_PROJECTION_IDS]);

export type LongitudinalConstructor =
  | { readonly projection: { readonly id: string; readonly version: 1 }; readonly kind: "edge"; readonly adapter: "local_semantic_event" }
  | { readonly projection: { readonly id: string; readonly version: 1 }; readonly kind: "population"; readonly adapter: "complete_candidate_relation"; readonly baseProjection: { readonly id: string; readonly version: 1 } }
  | { readonly projection: { readonly id: string; readonly version: 1 }; readonly kind: "path"; readonly adapter: "recorded_sequence"; readonly status: "deferred"; readonly reason: string };

export function expectedAvoidanceBase(id: string): string {
  const suffix = id.slice("derived.semantic_avoidance.".length);
  return suffix === "loose_piece" ? "rules.tactic.event.loose_piece" : `rules.structural.event.${suffix}`;
}

export const LONGITUDINAL_INGEST_REGISTRY: readonly LongitudinalConstructor[] = Object.freeze(
  SEMANTIC_EVENT_PROJECTION_IDS.map((id): LongitudinalConstructor => {
    const projection = Object.freeze({ id, version: 1 as const });
    if (PATH_IDS.includes(id)) return Object.freeze({ projection, kind: "path", adapter: "recorded_sequence", status: "deferred", reason: "No complete counterfactual path population exists at revision 1." });
    if (POPULATION_IDS.includes(id as never)) return Object.freeze({ projection, kind: "population", adapter: "complete_candidate_relation", baseProjection: Object.freeze({ id: expectedAvoidanceBase(id), version: 1 }) });
    return Object.freeze({ projection, kind: "edge", adapter: "local_semantic_event" });
  }),
);

export function validateIngestRegistry(rows: readonly LongitudinalConstructor[]): void {
  const expected = [...SEMANTIC_EVENT_PROJECTION_IDS].sort();
  const ids = rows.map((row) => row.projection.id);
  if (new Set(ids).size !== rows.length || [...ids].sort().join("\0") !== expected.join("\0")) throw new TypeError("LONGITUDINAL_REGISTRY_SET_MISMATCH");
  for (const row of rows) {
    if (row.projection.version !== 1) throw new TypeError("LONGITUDINAL_REGISTRY_VERSION_MISMATCH");
    if (row.kind === "population" && row.baseProjection.id !== expectedAvoidanceBase(row.projection.id)) throw new TypeError("LONGITUDINAL_POPULATION_BASE_MISMATCH");
    if (row.kind === "path" && row.reason.trim() === "") throw new TypeError("LONGITUDINAL_PATH_REASON_MISSING");
  }
}

export function ingestRegistryDigest(rows: readonly LongitudinalConstructor[]): string {
  validateIngestRegistry(rows);
  return `sha256:${createHash("sha256").update(JSON.stringify(rows)).digest("hex")}`;
}

export const LONGITUDINAL_FAILURE_CODES = Object.freeze([
  "snapshot_invalid", "derivation_failed", "publication_conflict",
] as const);
export type LongitudinalFailureCode = (typeof LONGITUDINAL_FAILURE_CODES)[number];

export interface ObservationJob {
  readonly runId: string;
  readonly requestedSeq: number;
  readonly completedSeq: number;
  readonly derivedRev: number;
  readonly state: "pending" | "running" | "complete" | "failed";
  readonly claimGeneration: number;
  readonly claimToken: string | null;
  readonly claimedBy: string | null;
  readonly leaseExpiresAt: number | null;
  readonly failureCode: LongitudinalFailureCode | null;
}

export interface JobClaim {
  readonly runId: string;
  readonly requestedSeq: number;
  readonly derivedRev: number;
  readonly generation: number;
  readonly token: string;
  readonly workerId: string;
  readonly leaseExpiresAt: number;
}

export class DurableJobProtocol {
  #job: ObservationJob;
  #publishedCut = 0;
  constructor(runId: string, requestedSeq: number, derivedRev: number) {
    this.#job = Object.freeze({ runId, requestedSeq, completedSeq: 0, derivedRev, state: "pending", claimGeneration: 0, claimToken: null, claimedBy: null, leaseExpiresAt: null, failureCode: null });
  }
  get job(): ObservationJob { return this.#job; }
  get publishedCut(): number { return this.#publishedCut; }
  request(seq: number): void {
    if (!Number.isSafeInteger(seq) || seq < this.#job.requestedSeq) throw new TypeError("LONGITUDINAL_REQUEST_REGRESSION");
    this.#job = Object.freeze({ ...this.#job, requestedSeq: seq, state: this.#job.state === "complete" && seq > this.#job.completedSeq ? "pending" : this.#job.state });
  }
  claim(workerId: string, now: number, leaseMs: number): JobClaim | null {
    const reclaimable = this.#job.state === "running" && this.#job.leaseExpiresAt !== null && this.#job.leaseExpiresAt <= now;
    if (this.#job.state !== "pending" && this.#job.state !== "failed" && !reclaimable) return null;
    const generation = this.#job.claimGeneration + 1;
    const token = `${this.#job.runId}:${generation}:${workerId}`;
    const leaseExpiresAt = now + leaseMs;
    this.#job = Object.freeze({ ...this.#job, state: "running", claimGeneration: generation, claimToken: token, claimedBy: workerId, leaseExpiresAt, failureCode: null });
    return Object.freeze({ runId: this.#job.runId, requestedSeq: this.#job.requestedSeq, derivedRev: this.#job.derivedRev, generation, token, workerId, leaseExpiresAt });
  }
  #owns(claim: JobClaim, now: number): boolean {
    return this.#job.state === "running" && this.#job.claimGeneration === claim.generation && this.#job.claimToken === claim.token && this.#job.claimedBy === claim.workerId && this.#job.leaseExpiresAt !== null && this.#job.leaseExpiresAt > now;
  }
  publish(claim: JobClaim, snapshotSeq: number, now: number): boolean {
    if (!this.#owns(claim, now) || snapshotSeq !== claim.requestedSeq || claim.derivedRev !== this.#job.derivedRev) return false;
    this.#publishedCut = snapshotSeq;
    const newerRequest = this.#job.requestedSeq > snapshotSeq;
    this.#job = Object.freeze({ ...this.#job, completedSeq: snapshotSeq, state: newerRequest ? "pending" : "complete", claimToken: null, claimedBy: null, leaseExpiresAt: null, failureCode: null });
    return true;
  }
  fail(claim: JobClaim, code: LongitudinalFailureCode, now: number): boolean {
    if (!LONGITUDINAL_FAILURE_CODES.includes(code) || !this.#owns(claim, now)) return false;
    this.#job = Object.freeze({ ...this.#job, state: "failed", claimToken: null, claimedBy: null, leaseExpiresAt: null, failureCode: code });
    return true;
  }
}

export interface SequencedEvent { readonly seq: number; readonly value: string }
export function snapshotPrefix(events: readonly SequencedEvent[], cut: number): readonly SequencedEvent[] {
  const prefix = events.filter((event) => event.seq <= cut).sort((left, right) => left.seq - right.seq);
  if (prefix.length !== cut || prefix.some((event, index) => event.seq !== index + 1)) throw new TypeError("LONGITUDINAL_SNAPSHOT_CUT_INVALID");
  return Object.freeze(prefix);
}

export interface DecisionContribution {
  readonly id: string;
  readonly phase: "opening" | "middlegame" | "endgame";
  readonly decisionClass: "move" | "prediction";
  readonly families: readonly { readonly projectionId: string; readonly opportunity: boolean; readonly occurred: boolean }[];
}

interface FamilyAggregate { opportunities: number; occurred: number }
export class IntervalAggregate {
  readonly #seen = new Set<string>();
  readonly #decisions = new Map<string, number>();
  readonly #families = new Map<string, FamilyAggregate>();
  apply(intervalId: string, decisions: readonly DecisionContribution[]): void {
    if (this.#seen.has(intervalId)) return;
    this.#seen.add(intervalId);
    for (const decision of decisions) {
      const denominatorKey = `${decision.phase}:${decision.decisionClass}`;
      this.#decisions.set(denominatorKey, (this.#decisions.get(denominatorKey) ?? 0) + 1);
      for (const family of decision.families) {
        if (!family.opportunity) continue;
        const key = `${denominatorKey}:${family.projectionId}`;
        const row = this.#families.get(key) ?? { opportunities: 0, occurred: 0 };
        row.opportunities += 1;
        row.occurred += Number(family.occurred);
        this.#families.set(key, row);
      }
    }
  }
  rows(): readonly { readonly key: string; readonly decisions: number; readonly opportunities: number; readonly occurred: number }[] {
    return Object.freeze([...this.#families.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => {
      const [phase, decisionClass] = key.split(":");
      return Object.freeze({ key, decisions: this.#decisions.get(`${phase}:${decisionClass}`) ?? 0, opportunities: value.opportunities, occurred: value.occurred });
    }));
  }
}

export const RUN_WRITE_OPERATIONS = Object.freeze([
  "create", "createRatedRun", "createImportedRun", "createDerivedRun",
  "createRepertoireGapRun", "save", "saveArenaImport",
] as const);

export function assertRunWriteOperationClosure(actual: readonly string[]): void {
  if (new Set(actual).size !== RUN_WRITE_OPERATIONS.length || [...actual].sort().join("\0") !== [...RUN_WRITE_OPERATIONS].sort().join("\0")) throw new TypeError("LONGITUDINAL_RUN_WRITE_OPERATION_MISMATCH");
}

export type ImportSubjectKind = "learner_asserted" | "observed_other" | "unknown";
export interface ImportSubject { readonly kind: ImportSubjectKind; readonly selectedSide: "white" | "black"; readonly assertedHandle: string | null }

export function personalPlayAdmitted(subject: ImportSubject): boolean {
  return subject.kind === "learner_asserted" && subject.assertedHandle !== null && subject.assertedHandle.trim() !== "";
}
