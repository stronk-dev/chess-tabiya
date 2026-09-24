/**
 * The closed HTTP and queued-gateway capability-operation census (rfc/evidence-job-durability.md
 * §1, criteria 20–21).
 *
 * Every supported method/action branch under `parseRunRoute`, every run-creation route, Pack Studio
 * registration and playtest, `/select-move`, both public-card branches and share revocation bind to
 * exactly one operation id and one capability source. The table is the production declaration; an
 * independent source census (`capability-operations.test.ts`) parses `rest.ts` and fails on any set
 * difference, so a new route or branch cannot land without a binding.
 *
 * Runtime requirement enforcement (`pack.requires` against the deployment projection) is the parent
 * contract's (`rfc/pack-capability-contract.md`) and is not wired here; the census fixes which
 * operations must pass it and with which consumer's provider-off behavior.
 */
import type { DrillRun, ProviderOffBehavior } from "@chess-tabiya/runtime";

import type { EvidenceOrigin, EvidenceJobConsumerId, QueuedProviderOperationId } from "./evidence-jobs.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type OperationalCapabilityConsumerId =
  | "runtime.session_create" | "runtime.rated_session_create" | "opponent.selection"
  | "runtime.branch_decidedness" | "inspector.human_split" | "inspector.corpus"
  | "guidance.voice" | "guidance.speech" | "guidance.reasoning_review";
export type CapabilityConsumerId = EvidenceJobConsumerId | OperationalCapabilityConsumerId;

export type OperationCapabilitySource =
  | { readonly kind: "session_create"; readonly sessionKind: "pack" | "position" | "imported" }
  | { readonly kind: "registered_pack"; readonly phase: "static_admission" }
  | { readonly kind: "run_session_operation" }
  | { readonly kind: "fixed_registry" }
  | { readonly kind: "none" };

/** Authoring accepts only the checked shape: `none` has no consumer, every other source has one. */
export type CheckedOperationCapabilityBinding =
  | { readonly operationId: string; readonly source: { readonly kind: "none" } }
  | { readonly operationId: string; readonly source: Exclude<OperationCapabilitySource, { readonly kind: "none" }>; readonly consumer: CapabilityConsumerId };

export type RouteDiscriminant =
  | { readonly path: "/session/kind"; readonly value: "pack" | "position" }
  | { readonly path: "/rescopeFrom"; readonly presence: "present" | "absent" }
  | { readonly path: "/op"; readonly value: "grant" | "revoke" }
  | { readonly path: "/selection"; readonly presence: "present" | "absent" }
  | { readonly path: "/source"; readonly value: "hand_picked" | "authored" | "human_replies" | "engine_top_n" }
  | { readonly loaded: "run.sessionKind"; readonly value: "pack" | "position" }
  | { readonly loaded: "publicToken.scope"; readonly value: "story_read" | "session_join" };

export interface CapabilityRouteBranch {
  readonly method: HttpMethod;
  readonly route: string;
  readonly action?: string;
  readonly discriminant?: RouteDiscriminant;
  readonly binding: CheckedOperationCapabilityBinding;
}

const none = (operationId: string): CheckedOperationCapabilityBinding => ({ operationId, source: { kind: "none" } });
const session = (operationId: string, consumer: CapabilityConsumerId): CheckedOperationCapabilityBinding => ({ operationId, source: { kind: "run_session_operation" }, consumer });
const create = (operationId: string, sessionKind: "pack" | "position" | "imported", consumer: CapabilityConsumerId = "runtime.session_create"): CheckedOperationCapabilityBinding => ({ operationId, source: { kind: "session_create", sessionKind }, consumer });

function run(method: HttpMethod, action: string, binding: CheckedOperationCapabilityBinding, discriminant?: RouteDiscriminant): CapabilityRouteBranch {
  return Object.freeze({ method, route: "/runs/:runId/:action", action, binding, ...(discriminant === undefined ? {} : { discriminant }) });
}

function external(method: HttpMethod, route: string, binding: CheckedOperationCapabilityBinding, discriminant?: RouteDiscriminant): CapabilityRouteBranch {
  return Object.freeze({ method, route, binding, ...(discriminant === undefined ? {} : { discriminant }) });
}

/** The complete run-route population: one row per supported method/action/body branch. */
export const RUN_ROUTE_OPERATIONS: readonly CapabilityRouteBranch[] = Object.freeze([
  run("POST", "moves", none("run.move.user"), { path: "/selection", presence: "absent" }),
  run("POST", "moves", none("run.move.opponent_received"), { path: "/selection", presence: "present" }),
  run("POST", "rewind", none("run.rewind")),
  run("POST", "fork", none("run.fork")),
  run("GET", "graph", none("run.graph")),
  run("POST", "compare", none("run.compare")),
  run("POST", "branch-decidedness", session("run.branch_decidedness", "runtime.branch_decidedness")),
  run("GET", "events", none("run.events")),
  run("GET", "evidence", none("run.evidence.read")),
  run("POST", "evidence", none("run.evidence.apply")),
  run("GET", "authored-feedback", none("run.authored_feedback")),
  run("GET", "pgn", none("run.pgn")),
  run("GET", "grants", none("run.grants.read")),
  run("POST", "grants", none("run.grant"), { path: "/op", value: "grant" }),
  run("POST", "grants", none("run.revoke"), { path: "/op", value: "revoke" }),
  run("POST", "lease", none("run.lease")),
  run("POST", "reveal", none("run.reveal")),
  run("POST", "duplicate", create("run.create.duplicate_pack", "pack"), { loaded: "run.sessionKind", value: "pack" }),
  run("POST", "duplicate", create("run.create.duplicate_position", "position"), { loaded: "run.sessionKind", value: "position" }),
  run("POST", "schedule", none("run.schedule")),
  run("POST", "simulate", none("run.simulate")),
  run("POST", "simulate-enter", none("run.simulate_enter")),
  run("POST", "prediction", session("run.prediction", "opponent.selection")),
  run("GET", "reasoning", none("run.reasoning.read")),
  run("POST", "reasoning", none("run.reasoning.record")),
  run("POST", "reasoning-review", session("run.reasoning_review", "guidance.reasoning_review")),
  run("POST", "assistance", none("run.assistance")),
  run("POST", "analysis", session("run.analysis", "runtime.analysis")),
  run("GET", "human-split", session("run.human_split", "inspector.human_split")),
  run("GET", "corpus", session("run.corpus", "inspector.corpus")),
  run("POST", "voice", session("run.voice", "guidance.voice")),
  run("POST", "speech", session("run.speech", "guidance.speech")),
  run("POST", "group", none("run.group.hand_picked"), { path: "/source", value: "hand_picked" }),
  run("POST", "group", none("run.group.authored"), { path: "/source", value: "authored" }),
  run("POST", "group", session("run.group.human_replies", "opponent.selection"), { path: "/source", value: "human_replies" }),
  run("POST", "group", session("run.group.engine_top_n", "opponent.selection"), { path: "/source", value: "engine_top_n" }),
  run("POST", "group-reply", session("run.group_reply", "opponent.selection")),
  run("GET", "import", none("run.import_record")),
  run("GET", "story", session("run.story", "review.story_evidence")),
  run("GET", "review", none("run.review")),
  run("GET", "review-analysis", none("run.review_analysis")),
  run("GET", "nudge", none("run.nudge")),
  run("GET", "share", none("run.share.list")),
  run("POST", "share", session("run.share.create", "review.story_evidence")),
  run("POST", "flip", create("run.create.flip", "position")),
  run("GET", "derivations", none("run.derivations")),
  run("POST", "distill", none("run.distill")),
  run("GET", "marks", none("run.marks.read")),
  run("PUT", "marks", none("run.marks.replace"), { path: "/rescopeFrom", presence: "absent" }),
  run("PUT", "marks", none("run.marks.rescope"), { path: "/rescopeFrom", presence: "present" }),
  run("POST", "deletion-preview", none("run.deletion_preview")),
  run("POST", "delete", none("run.delete")),
]);

/** Routes outside `parseRunRoute` that create runs, register packs, select moves or render Story. */
export const EXTERNAL_ROUTE_OPERATIONS: readonly CapabilityRouteBranch[] = Object.freeze([
  external("POST", "/packs/drafts/:draftId/register", { operationId: "pack.register", source: { kind: "registered_pack", phase: "static_admission" }, consumer: "runtime.session_create" }),
  external("POST", "/packs/drafts/:draftId/playtest", create("run.create.playtest", "pack")),
  external("POST", "/runs", create("run.create.pack", "pack"), { path: "/session/kind", value: "pack" }),
  external("POST", "/runs", create("run.create.position", "position"), { path: "/session/kind", value: "position" }),
  external("POST", "/runs/import", create("run.create.imported", "imported")),
  external("POST", "/rated-games", create("run.create.rated", "position", "runtime.rated_session_create")),
  external("POST", "/repertoires/:id/gaps/enter", create("run.create.repertoire_gap", "position")),
  external("POST", "/select-move", { operationId: "opponent.select", source: { kind: "fixed_registry" }, consumer: "opponent.selection" }),
  external("GET", "/api/shared/:token/story", session("story.public", "review.story_evidence")),
  external("GET", "/shared/:token", session("story.public", "review.story_evidence"), { loaded: "publicToken.scope", value: "story_read" }),
  external("GET", "/shared/:token", none("shared.join_page"), { loaded: "publicToken.scope", value: "session_join" }),
  external("DELETE", "/runs/:runId/share/:token", none("run.share.revoke")),
]);

/** Each compiled consumer's provider-off effect; `honest_empty` is never collapsed into 503. */
export const CONSUMER_PROVIDER_OFF: Readonly<Record<CapabilityConsumerId, ProviderOffBehavior>> = Object.freeze({
  "runtime.analysis": "unavailable",
  "review.story_evidence": "honest_empty",
  "runtime.background_evidence": "honest_empty",
  "runtime.session_create": "unavailable",
  "runtime.rated_session_create": "unavailable",
  "opponent.selection": "unavailable",
  "runtime.branch_decidedness": "honest_empty",
  "inspector.human_split": "unavailable",
  "inspector.corpus": "honest_empty",
  "guidance.voice": "available",
  "guidance.speech": "unavailable",
  "guidance.reasoning_review": "honest_empty",
});

/** The closed queued provider population: exactly two gateways, kinds total and disjoint. */
export const QUEUED_PROVIDER_GATEWAYS: readonly { readonly operation: QueuedProviderOperationId; readonly gateway: string; readonly call: string; readonly kinds: readonly string[] }[] = Object.freeze([
  Object.freeze({ operation: "evidence.stockfish_analysis", gateway: "EvidenceJobQueue.#execute", call: "this.#executor.execute", kinds: Object.freeze(["bestline", "eval", "wdl"]) }),
  Object.freeze({ operation: "evidence.tablebase_probe", gateway: "EvidenceJobQueue.#tablebasePayload", call: "this.#tablebase.probe", kinds: Object.freeze(["tablebase"]) }),
]);

/** The three sealed enqueue origins and their production owners. */
export const EVIDENCE_ENQUEUE_ORIGINS: readonly { readonly origin: EvidenceOrigin; readonly owner: string; readonly consumer: EvidenceJobConsumerId; readonly providerOff: ProviderOffBehavior }[] = Object.freeze([
  Object.freeze({ origin: "explicit_analysis", owner: "RunService.enqueueEvidence", consumer: "runtime.analysis", providerOff: "unavailable" }),
  Object.freeze({ origin: "story_completion", owner: "RunService.#ensureStoryEvidence", consumer: "review.story_evidence", providerOff: "honest_empty" }),
  Object.freeze({ origin: "run_enrichment", owner: "RunService.#enqueueMoveEvidence→#commitWithEnrichment", consumer: "runtime.background_evidence", providerOff: "honest_empty" }),
]);

function discriminantMatches(discriminant: RouteDiscriminant, body: Readonly<Record<string, unknown>>, loaded: Readonly<Record<string, unknown>>): boolean {
  if ("loaded" in discriminant) return loaded[discriminant.loaded] === discriminant.value;
  const key = discriminant.path.slice(1);
  const value = key === "session/kind" ? (body.session as { readonly kind?: unknown } | undefined)?.kind : body[key];
  return "presence" in discriminant ? (value !== undefined) === (discriminant.presence === "present") : value === discriminant.value;
}

/**
 * The closed route-branch resolver: exactly one declared branch must match, else the request is
 * outside the census (a gap) or ambiguous (an overlap). Routes never supply an operation id.
 */
export function resolveRouteOperation(
  method: HttpMethod,
  route: string,
  action: string | undefined,
  body: Readonly<Record<string, unknown>> = {},
  loaded: Readonly<Record<string, unknown>> = {},
): CheckedOperationCapabilityBinding {
  const population = route === "/runs/:runId/:action" ? RUN_ROUTE_OPERATIONS : EXTERNAL_ROUTE_OPERATIONS;
  const matches = population.filter((branch) => branch.method === method && branch.route === route && branch.action === action
    && (branch.discriminant === undefined || discriminantMatches(branch.discriminant, body, loaded)));
  if (matches.length !== 1) throw new TypeError(`${matches.length === 0 ? "CAPABILITY_OPERATION_GAP" : "CAPABILITY_OPERATION_OVERLAP"}: ${method} ${route}${action === undefined ? "" : ` ${action}`}`);
  return matches[0]!.binding;
}

/** The session-derived capability source of one authenticated run ([[D2429]], [[D2513]]). */
export type RunSessionCapabilitySource =
  | { readonly kind: "pack"; readonly packId: string; readonly packDigest: string }
  | { readonly kind: "position" | "imported"; readonly opponentMode: string };

export function runSessionCapabilitySource(run: Pick<DrillRun, "sessionKind" | "packId" | "packDigest" | "opponentPolicy">): RunSessionCapabilitySource {
  if (run.sessionKind === "pack") {
    if (run.packId === null || run.packDigest === null) throw new TypeError("a pack session carries its registered pack identity");
    return Object.freeze({ kind: "pack", packId: run.packId, packDigest: run.packDigest });
  }
  return Object.freeze({ kind: run.sessionKind, opponentMode: run.opponentPolicy.mode });
}
