// DISPOSABLE research harness — D1612–D1617. Not production code.
import { createHash } from "node:crypto";

import {
  AVOIDANCE_EVENT_PROJECTION_IDS,
  SEMANTIC_EVENT_DECLARATIONS,
  SEMANTIC_EVENT_PROJECTION_IDS,
  TACTICAL_AVOIDANCE_EVENT_PROJECTION_IDS,
} from "../../packages/runtime/src/evidence-catalog.js";
import {
  legalAlternativeEdges,
  localSemanticEvents,
  type SemanticEvidenceEvent,
} from "../../packages/runtime/src/semantic-evidence.js";
import type { SemanticEventSign } from "../../packages/runtime/src/evidence-contract.js";

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
  | { readonly projection: { readonly id: string; readonly version: 1 }; readonly signs: readonly SemanticEventSign[]; readonly kind: "edge"; readonly adapter: "local_semantic_event" }
  | { readonly projection: { readonly id: string; readonly version: 1 }; readonly signs: readonly ["avoided"]; readonly kind: "population"; readonly adapter: "complete_candidate_relation"; readonly baseProjection: { readonly id: string; readonly version: 1 }; readonly baseSigns: readonly SemanticEventSign[] }
  | { readonly projection: { readonly id: string; readonly version: 1 }; readonly signs: readonly SemanticEventSign[]; readonly kind: "path"; readonly adapter: "recorded_sequence"; readonly status: "deferred"; readonly reason: string };

const signsByProjection = new Map(SEMANTIC_EVENT_DECLARATIONS.map((row) => [row.projection.id, row.allowedSigns] as const));
function exactSigns(id: string): readonly SemanticEventSign[] {
  const signs = signsByProjection.get(id);
  if (signs === undefined || signs.length === 0) throw new TypeError("LONGITUDINAL_SIGN_SUBSET_MISSING");
  return signs;
}

export function expectedAvoidanceBase(id: string): string {
  const suffix = id.slice("derived.semantic_avoidance.".length);
  return suffix === "loose_piece" ? "rules.tactic.event.loose_piece" : `rules.structural.event.${suffix}`;
}

export const LONGITUDINAL_INGEST_REGISTRY: readonly LongitudinalConstructor[] = Object.freeze(
  SEMANTIC_EVENT_PROJECTION_IDS.map((id): LongitudinalConstructor => {
    const projection = Object.freeze({ id, version: 1 as const });
    const signs = Object.freeze([...exactSigns(id)]);
    if (PATH_IDS.includes(id)) return Object.freeze({ projection, signs, kind: "path", adapter: "recorded_sequence", status: "deferred", reason: "No complete counterfactual path population exists at revision 1." });
    if (POPULATION_IDS.includes(id as never)) {
      const baseProjection = Object.freeze({ id: expectedAvoidanceBase(id), version: 1 as const });
      return Object.freeze({ projection, signs: signs as readonly ["avoided"], kind: "population", adapter: "complete_candidate_relation", baseProjection, baseSigns: Object.freeze([...exactSigns(baseProjection.id)]) });
    }
    return Object.freeze({ projection, signs, kind: "edge", adapter: "local_semantic_event" });
  }),
);

export function validateIngestRegistry(rows: readonly LongitudinalConstructor[]): void {
  const expected = [...SEMANTIC_EVENT_PROJECTION_IDS].sort();
  const ids = rows.map((row) => row.projection.id);
  if (new Set(ids).size !== rows.length || [...ids].sort().join("\0") !== expected.join("\0")) throw new TypeError("LONGITUDINAL_REGISTRY_SET_MISMATCH");
  for (const row of rows) {
    if (row.projection.version !== 1) throw new TypeError("LONGITUDINAL_REGISTRY_VERSION_MISMATCH");
    if (row.signs.join("\0") !== exactSigns(row.projection.id).join("\0")) throw new TypeError("LONGITUDINAL_SIGN_SUBSET_MISMATCH");
    if (row.kind === "population" && row.baseProjection.id !== expectedAvoidanceBase(row.projection.id)) throw new TypeError("LONGITUDINAL_POPULATION_BASE_MISMATCH");
    if (row.kind === "population" && row.baseSigns.join("\0") !== exactSigns(row.baseProjection.id).join("\0")) throw new TypeError("LONGITUDINAL_BASE_SIGN_SUBSET_MISMATCH");
    if (row.kind === "path" && row.reason.trim() === "") throw new TypeError("LONGITUDINAL_PATH_REASON_MISSING");
  }
}

export interface PopulationIdentity {
  readonly projectionId: string;
  readonly semanticSign: SemanticEventSign;
  readonly sourceSign: SemanticEventSign;
}
export type PopulationContribution =
  | { readonly kind: "available"; readonly identity: PopulationIdentity; readonly opportunity: boolean; readonly occurred: boolean; readonly alternativeShare: number; readonly exhibitingMoves: readonly string[]; readonly nonExhibitingMoves: readonly string[] }
  | { readonly kind: "unavailable"; readonly reason: "population_incomplete" | "forced_move" };
interface Edge { readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string }
interface PopulationDependencies {
  readonly alternatives: (beforeFen: string, committedMoveUci: string) => readonly Edge[];
  readonly events: (beforeFen: string, moveUci: string, afterFen: string) => readonly SemanticEvidenceEvent[] | undefined;
}

export function projectDecisionPopulation(
  input: Edge & { readonly constructor: Exclude<LongitudinalConstructor, { readonly kind: "path" }>; readonly semanticSign: SemanticEventSign; readonly sourceSign: SemanticEventSign },
  dependencies: PopulationDependencies = { alternatives: legalAlternativeEdges, events: localSemanticEvents },
): PopulationContribution {
  const row = input.constructor;
  if (!row.signs.includes(input.semanticSign)) throw new TypeError("LONGITUDINAL_PROJECTION_SIGN_IMPOSSIBLE");
  if (row.kind === "edge" && input.sourceSign !== input.semanticSign) throw new TypeError("LONGITUDINAL_SOURCE_SIGN_IMPOSSIBLE");
  if (row.kind === "population" && (input.semanticSign !== "avoided" || !row.baseSigns.includes(input.sourceSign))) throw new TypeError("LONGITUDINAL_SOURCE_SIGN_IMPOSSIBLE");
  const alternatives = dependencies.alternatives(input.beforeFen, input.moveUci);
  if (alternatives.length === 0) return Object.freeze({ kind: "unavailable", reason: "forced_move" });
  const edges = [Object.freeze({ beforeFen: input.beforeFen, moveUci: input.moveUci, afterFen: input.afterFen }), ...alternatives];
  const targetProjection = row.kind === "edge" ? row.projection.id : row.baseProjection.id;
  const targetSign = row.kind === "edge" ? input.semanticSign : input.sourceSign;
  const membership: { readonly edge: Edge; readonly exhibits: boolean }[] = [];
  for (const edge of edges) {
    const events = dependencies.events(edge.beforeFen, edge.moveUci, edge.afterFen);
    if (events === undefined) return Object.freeze({ kind: "unavailable", reason: "population_incomplete" });
    membership.push(Object.freeze({ edge, exhibits: events.some((event) => event.projection.id === targetProjection && event.projection.version === 1 && event.sign === targetSign) }));
  }
  const exhibitingMoves = membership.filter((value) => value.exhibits).map((value) => value.edge.moveUci).sort();
  const nonExhibitingMoves = membership.filter((value) => !value.exhibits).map((value) => value.edge.moveUci).sort();
  const opportunity = exhibitingMoves.length > 0 && nonExhibitingMoves.length > 0;
  const playedExhibits = membership[0]!.exhibits;
  const counterfactualExhibits = membership.slice(1).filter((value) => value.exhibits).length;
  return Object.freeze({
    kind: "available", identity: Object.freeze({ projectionId: row.projection.id, semanticSign: input.semanticSign, sourceSign: input.sourceSign }),
    opportunity, occurred: opportunity && (row.kind === "edge" ? playedExhibits : !playedExhibits),
    alternativeShare: counterfactualExhibits / alternatives.length,
    exhibitingMoves: Object.freeze(exhibitingMoves), nonExhibitingMoves: Object.freeze(nonExhibitingMoves),
  });
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
  readonly claimedRequestedSeq: number | null;
  readonly claimToken: string | null;
  readonly claimedBy: string | null;
  readonly leaseExpiresAt: number | null;
  readonly failureCode: LongitudinalFailureCode | null;
}

export interface JobClaim {
  readonly runId: string;
  readonly claimedRequestedSeq: number;
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
    this.#job = Object.freeze({ runId, requestedSeq, completedSeq: 0, derivedRev, state: "pending", claimGeneration: 0, claimedRequestedSeq: null, claimToken: null, claimedBy: null, leaseExpiresAt: null, failureCode: null });
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
    const claimedRequestedSeq = this.#job.requestedSeq;
    this.#job = Object.freeze({ ...this.#job, state: "running", claimGeneration: generation, claimedRequestedSeq, claimToken: token, claimedBy: workerId, leaseExpiresAt, failureCode: null });
    return Object.freeze({ runId: this.#job.runId, claimedRequestedSeq, derivedRev: this.#job.derivedRev, generation, token, workerId, leaseExpiresAt });
  }
  #owns(claim: JobClaim, now: number): boolean {
    return this.#job.state === "running" && this.#job.claimGeneration === claim.generation && this.#job.claimedRequestedSeq === claim.claimedRequestedSeq && this.#job.requestedSeq >= claim.claimedRequestedSeq && this.#job.claimToken === claim.token && this.#job.claimedBy === claim.workerId && this.#job.leaseExpiresAt !== null && this.#job.leaseExpiresAt > now;
  }
  publish(claim: JobClaim, snapshotSeq: number, now: number): boolean {
    if (!this.#owns(claim, now) || snapshotSeq !== claim.claimedRequestedSeq || claim.derivedRev !== this.#job.derivedRev) return false;
    this.#publishedCut = snapshotSeq;
    const newerRequest = this.#job.requestedSeq > snapshotSeq;
    this.#job = Object.freeze({ ...this.#job, completedSeq: snapshotSeq, state: newerRequest ? "pending" : "complete", claimedRequestedSeq: null, claimToken: null, claimedBy: null, leaseExpiresAt: null, failureCode: null });
    return true;
  }
  fail(claim: JobClaim, code: LongitudinalFailureCode, now: number): boolean {
    if (!LONGITUDINAL_FAILURE_CODES.includes(code) || !this.#owns(claim, now)) return false;
    this.#job = Object.freeze({ ...this.#job, state: "failed", claimedRequestedSeq: null, claimToken: null, claimedBy: null, leaseExpiresAt: null, failureCode: code });
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

export const LONGITUDINAL_MIGRATION_SQL = `
ALTER TABLE drill_runs ADD COLUMN longitudinal_profile_disposition TEXT NOT NULL DEFAULT 'profileable'
  CHECK (longitudinal_profile_disposition IN ('profileable','account_deleted'));
CREATE TABLE learner_observation_denominators (
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('opening','middlegame','endgame')),
  decision_class TEXT NOT NULL CHECK (decision_class IN ('played','game','predicted')),
  decisions INTEGER NOT NULL CHECK (decisions > 0), observed_at TEXT NOT NULL,
  derived_rev INTEGER NOT NULL CHECK (derived_rev > 0),
  PRIMARY KEY (learner_id,run_id,phase,decision_class)
) STRICT;
CREATE TABLE learner_observations (
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
  projection_id TEXT NOT NULL, projection_version INTEGER NOT NULL CHECK (projection_version > 0),
  semantic_sign TEXT NOT NULL CHECK (semantic_sign IN ('state','gained','lost','preserved','removed','avoided','enabled','threatened')),
  source_sign TEXT NOT NULL CHECK (source_sign IN ('state','gained','lost','preserved','removed','avoided','enabled','threatened')),
  phase TEXT NOT NULL CHECK (phase IN ('opening','middlegame','endgame')),
  decision_class TEXT NOT NULL CHECK (decision_class IN ('played','game','predicted')),
  session_kind TEXT NOT NULL CHECK (session_kind IN ('pack','position','imported')), pack_id TEXT,
  opportunities INTEGER NOT NULL CHECK (opportunities > 0),
  occurred INTEGER NOT NULL CHECK (occurred >= 0 AND occurred <= opportunities),
  alternative_share_sum REAL NOT NULL CHECK (alternative_share_sum >= 0.0 AND alternative_share_sum <= opportunities),
  occurred_refs TEXT NOT NULL CHECK (json_valid(occurred_refs)),
  opportunity_refs TEXT NOT NULL CHECK (json_valid(opportunity_refs)),
  observed_at TEXT NOT NULL, derived_rev INTEGER NOT NULL CHECK (derived_rev > 0),
  CHECK ((session_kind='pack' AND pack_id IS NOT NULL) OR (session_kind<>'pack' AND pack_id IS NULL)),
  PRIMARY KEY (learner_id,run_id,projection_id,projection_version,semantic_sign,source_sign,phase,decision_class),
  FOREIGN KEY (learner_id,run_id,phase,decision_class)
    REFERENCES learner_observation_denominators(learner_id,run_id,phase,decision_class) ON DELETE CASCADE
) STRICT;
CREATE TABLE learner_structure_stats (
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
  root_key TEXT NOT NULL, root_node_id TEXT NOT NULL,
  session_kind TEXT NOT NULL CHECK (session_kind IN ('pack','position','imported')), pack_id TEXT,
  branch_count INTEGER NOT NULL CHECK (branch_count >= 1),
  rewound_count INTEGER NOT NULL CHECK (rewound_count >= 0),
  forked_count INTEGER NOT NULL CHECK (forked_count >= 0),
  group_count INTEGER NOT NULL CHECK (group_count >= 0),
  outcome_count INTEGER NOT NULL CHECK (outcome_count >= 0),
  observed_at TEXT NOT NULL, derived_rev INTEGER NOT NULL CHECK (derived_rev > 0),
  CHECK ((session_kind='pack' AND pack_id IS NOT NULL) OR (session_kind<>'pack' AND pack_id IS NULL)),
  PRIMARY KEY (learner_id,run_id,root_key)
) STRICT;
CREATE TABLE learner_observation_jobs (
  run_id TEXT PRIMARY KEY REFERENCES drill_runs(id) ON DELETE CASCADE,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  requested_seq INTEGER NOT NULL CHECK (requested_seq > 0),
  completed_seq INTEGER NOT NULL DEFAULT 0 CHECK (completed_seq >= 0),
  derived_rev INTEGER NOT NULL CHECK (derived_rev > 0),
  state TEXT NOT NULL CHECK (state IN ('pending','running','complete','failed')),
  claim_generation INTEGER NOT NULL DEFAULT 0 CHECK (claim_generation >= 0),
  claimed_requested_seq INTEGER CHECK (claimed_requested_seq > 0),
  claim_token TEXT, claimed_by TEXT, lease_expires_at TEXT,
  failure_code TEXT CHECK (failure_code IS NULL OR failure_code IN ('snapshot_invalid','derivation_failed','publication_conflict')),
  updated_at TEXT NOT NULL,
  CHECK (completed_seq <= requested_seq),
  CHECK (claimed_requested_seq IS NULL OR requested_seq >= claimed_requested_seq),
  CHECK ((state='failed') = (failure_code IS NOT NULL)),
  CHECK ((state='running') = (claimed_requested_seq IS NOT NULL AND claim_token IS NOT NULL AND claimed_by IS NOT NULL AND lease_expires_at IS NOT NULL)),
  CHECK (state='running' OR (claimed_requested_seq IS NULL AND claim_token IS NULL AND claimed_by IS NULL AND lease_expires_at IS NULL)),
  CHECK (state<>'complete' OR completed_seq=requested_seq)
) STRICT;
CREATE INDEX learner_observation_denominators_by_learner ON learner_observation_denominators(learner_id,observed_at,run_id);
CREATE INDEX learner_observations_by_family ON learner_observations(learner_id,projection_id,projection_version,semantic_sign,source_sign,phase,decision_class,run_id);
CREATE INDEX learner_observations_by_run ON learner_observations(run_id,derived_rev);
CREATE INDEX learner_structure_stats_by_learner ON learner_structure_stats(learner_id,observed_at,run_id);
CREATE INDEX learner_observation_jobs_work ON learner_observation_jobs(state,lease_expires_at,updated_at,run_id);
`;

export type LongitudinalProfileDisposition = "profileable" | "account_deleted";
export interface ProfileRun { readonly id: string; readonly ownerLearnerId: string; readonly shared: boolean; readonly disposition: LongitudinalProfileDisposition }
export function deleteLearnerProfile(run: ProfileRun, learnerId: string): ProfileRun | null {
  if (run.ownerLearnerId !== learnerId) return run;
  if (!run.shared) return null;
  return Object.freeze({ ...run, ownerLearnerId: "__legacy", disposition: "account_deleted" });
}
export function rebuildProfileOwner(run: ProfileRun): string | null {
  return run.disposition === "profileable" ? run.ownerLearnerId : null;
}

export interface LongitudinalReadFilter {
  readonly projections?: readonly { readonly id: string; readonly version: number; readonly semanticSign?: SemanticEventSign; readonly sourceSign?: SemanticEventSign }[];
  readonly phases?: readonly ("opening" | "middlegame" | "endgame")[];
  readonly decisionClasses?: readonly ("played" | "game" | "predicted")[];
  readonly sessionKinds?: readonly ("pack" | "position" | "imported")[];
  readonly packIds?: readonly string[];
}
export interface LongitudinalReadQuery {
  readonly learnerId: string;
  readonly derivationRev: number;
  readonly through: { readonly kind: "all_complete" } | { readonly kind: "runs"; readonly cuts: readonly { readonly runId: string; readonly requestedSeq: number }[] };
  readonly filter: LongitudinalReadFilter;
}
interface LongitudinalCut { readonly runId: string; readonly requestedSeq: number; readonly completedSeq: number; readonly derivedRev: number }
export type LongitudinalReadResult =
  | { readonly kind: "complete"; readonly cuts: readonly LongitudinalCut[]; readonly denominators: readonly unknown[]; readonly observations: readonly unknown[]; readonly structureStats: readonly unknown[] }
  | { readonly kind: "pending"; readonly cuts: readonly LongitudinalCut[] }
  | { readonly kind: "failed"; readonly cuts: readonly LongitudinalCut[]; readonly failureCode: LongitudinalFailureCode }
  | { readonly kind: "unavailable"; readonly reason: "not_requested" | "revision_mismatch" | "profile_suppressed" };
export interface LongitudinalReadStore {
  readLongitudinalSnapshot(actorLearnerId: string, query: LongitudinalReadQuery): LongitudinalReadResult;
  claimLongitudinalBatch(workerId: string, now: number, limit: number): readonly JobClaim[];
  publishLongitudinalProjection(claim: JobClaim, rows: unknown, now: number): boolean;
}

export const LONGITUDINAL_WORKER_DEFAULTS = Object.freeze({ workerBatchSize: 4, workerPollMs: 1_000, workerLeaseMs: 30_000 });
export const LONGITUDINAL_WORKER_ONCE_ENTRY = "apps/server/src/longitudinal-worker-once.ts";
export class LongitudinalProjectionWorker {
  #state: "idle" | "running" | "stopping" | "stopped" = "idle";
  #inFlight = 0;
  constructor(readonly options = LONGITUDINAL_WORKER_DEFAULTS) {
    if (!Number.isInteger(options.workerBatchSize) || options.workerBatchSize < 1 || options.workerBatchSize > 32 || options.workerPollMs < 100 || options.workerPollMs > 5_000 || options.workerLeaseMs < 5_000) throw new TypeError("LONGITUDINAL_WORKER_OPTIONS_INVALID");
  }
  start(): void { if (this.#state !== "idle") throw new TypeError("LONGITUDINAL_WORKER_LIFECYCLE"); this.#state = "running"; }
  beginBatch(requested: number): number { if (this.#state !== "running") return 0; const claimed = Math.min(requested, this.options.workerBatchSize); this.#inFlight += claimed; return claimed; }
  finishOne(): void { if (this.#inFlight < 1) throw new TypeError("LONGITUDINAL_WORKER_LIFECYCLE"); this.#inFlight -= 1; if (this.#state === "stopping" && this.#inFlight === 0) this.#state = "stopped"; }
  stop(): "stopping" | "stopped" { if (this.#state !== "running" && this.#state !== "stopping") throw new TypeError("LONGITUDINAL_WORKER_LIFECYCLE"); this.#state = this.#inFlight === 0 ? "stopped" : "stopping"; return this.#state; }
  get state(): string { return this.#state; }
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
