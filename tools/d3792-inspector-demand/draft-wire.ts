// DISPOSABLE D3801 authoring controls. Not a production parser, seal, provider or API.
import assert from "node:assert/strict";
import { MODULE_CONSUMER_ACCEPTS, RECORDED_PATH_SUCCESSOR_REFS } from "../../packages/runtime/src/evidence-catalog.js";
import { compileAssistanceRequest, parseRequestedAssistanceV1, type RequestedAssistanceV1 } from "../../packages/runtime/src/assistance-exchange.js";
import { evidenceValueRouteRegistry } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { routeReads } from "../../packages/runtime/src/module-query-sources.js";
import type { ModuleDecisionStamp } from "../../packages/runtime/src/module-query.js";
import { presentationDigest, type PresentationReceipt } from "../../packages/runtime/src/presentation-contract.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import type { InspectorFamilyId } from "../../packages/runtime/src/module-contract.js";
import { EXPLORER_RATING_BUCKETS, EXPLORER_SPEEDS } from "../../packages/runtime/src/provider-types.js";

const key = (ref: { id: string; version: number }) => `${ref.id}@${ref.version}`;
const sources = new Set(MODULE_CONSUMER_ACCEPTS.full_inspector.map(key));
const windows = new Set(RECORDED_PATH_SUCCESSOR_REFS.map(key));
const arms = new Map(evidenceValueRouteRegistry().map(row => [row.route, row.arms]));
const factoryMetadata = new Map(evidenceValueRouteRegistry().map(row => [row.route, row]));
const edgeDependencies = new Set(["derived.tactic.discovered_executed@1", "derived.tactic.fork_survives_reply@1",
  "derived.tactic.overloaded_defender_response_conflict@1", "rules.tactic.consequence.forced_mate_after_move@1",
  "rules.tactic.consequence.forced_mate_after_move@2"]);
const mateSources = new Set(["rules.tactic.consequence.forced_mate_after_move@1", "rules.tactic.consequence.forced_mate_after_move@2"]);
export type DraftMateParameters = { kind: "forced_mate"; maxAttackerMoves: 1 | 2 | 3 | 4 };
export const DETAIL_VIEWS = new Map([
  ["rules.tactic.reading.ray_classification@1", "derived.inspector.detail.rays@1"],
  ["rules.square.reading.control@1", "derived.inspector.detail.square_control@1"],
  ["rules.mobility.reading.piece_destinations@1", "derived.inspector.detail.piece_destinations@1"],
  ["rules.mobility.event.piece_destinations@1", "derived.inspector.detail.destination_changes@1"],
  ["rules.king.reading.zone_state@1", "derived.inspector.detail.king_zone@1"],
  ["rules.tactic.reading.defender_duty_set@1", "derived.inspector.detail.defender_duties@1"],
] as const);
type DraftDetailRef = typeof DETAIL_VIEWS extends ReadonlyMap<string, infer Value> ? Value : never;

export type DraftSourceContext =
  | { kind: "position" } | { kind: "incoming_edge" } | { kind: "recorded_window" }
  | { kind: "branch"; throughNodeId: string }
  | { kind: "comparison"; otherBranchId: string; otherNodeId: string }
  | { kind: "recorded_review"; throughNodeId: string };
export type DraftDetailScope = { kind: "whole" } | {
  kind: "control_target"; color: "white" | "black"; mode: "geometric" | "legal"; target: string };
export type DraftView =
  | { kind: "inventory"; start: number }
  | { kind: "source"; projection: string; context: DraftSourceContext; start: number; collectionKey: string | null;
      parameters?: DraftMateParameters }
  | { kind: "detail"; projection: string; context: DraftSourceContext; sourceKey: string; scope: DraftDetailScope; start: number };
export interface DraftRequest {
  protocol: "inspector.query_page@1";
  assistance: RequestedAssistanceV1;
  query: { branchId: string; nodeId: string; decisionDigest: string; view: DraftView };
}
export interface DraftRange { start: number; count: number; total: number; next: number | null }
export type DraftContextFailure = "no_incoming_edge" | "no_recorded_window" | "no_second_attempt" | "no_recorded_review";
export type DraftUnavailableOutcome =
  | { kind: "unavailable"; reason: "source_absent" | "provider_unavailable" | "authored_source_absent" | "invalid_turn_clone" | "no_legal_recapture" | "recorded_measurement_unavailable" | "artifact_missing" }
  | { kind: "unavailable"; reason: "source_version_held"; dependency: string };
type DraftFailureOutcome = { kind: "failed"; reason: "source_contract_invalid" | "provider_failed" | "source_lookup_failed" | "artifact_invalid" | "digest_mismatch" };
interface DraftBelowFloorOutcome {
  kind: "below_floor"; sourceKey: string; total: number;
  population: { ratingBuckets: readonly number[]; speeds: readonly string[]; since: string | null; until: string | null };
}
export type DraftSourceOutcome =
  | { kind: "missing_context"; reason: DraftContextFailure }
  | DraftUnavailableOutcome
  | DraftFailureOutcome
  | DraftBelowFloorOutcome
  | { kind: "no_witness" }
  | { kind: "available"; collectionKey: string; range: DraftRange; collected: number; displayed: number; deferred: number;
      facts: readonly { sourceKey: string; disposition: "presented" | "deferred";
        exceeded: readonly ("facts" | "words" | "marks" | "arrows")[]; detail: DraftDetailRef | null }[];
      presentation: PresentationReceipt };
// @ts-expect-error D3843: a held source must retain its declared upstream dependency.
const missingHeldDependency: DraftSourceOutcome = { kind: "unavailable", reason: "source_version_held" };
void missingHeldDependency;
export type DraftDisclosureOutcome = Exclude<DraftSourceOutcome, { kind: "available" }> | { kind: "available" };
export interface DraftDisclosure {
  protocol: "inspector.disclosure_receipt@1";
  runId: string; branchId: string; nodeId: string; decisionDigest: string;
  requestedConfigDigest: string; effectiveConfigDigest: string;
  view: DraftView; range: DraftRange | null; collectionKey: string | null;
  sourceKeys: readonly string[]; sourceOrdinals: readonly number[];
  detailProjection: DraftDetailRef | null; componentDigests: readonly string[]; digest: string;
  sourceOutcome: DraftDisclosureOutcome | null;
  recordedCoverage: import("./ledger-source.js").DraftRecordedCoverage | null;
}
export type DraftResponse =
  | { protocol: "inspector.query_page@1"; kind: "refused";
      code: "invalid_request" | "not_found" | "withheld" | "stale" | "unsupported_version" }
  | { protocol: "inspector.query_page@1"; kind: "page"; runId: string; branchId: string; nodeId: string;
      decision: ModuleDecisionStamp; requestedConfigDigest: string; effectiveConfigDigest: string;
      disclosure: DraftDisclosure; body:
        | { kind: "inventory"; range: DraftRange; topics: readonly { projection: string; family: InspectorFamilyId; state: "not_requested" }[] }
        | { kind: "source"; projection: string; context: DraftSourceContext; parameters?: DraftMateParameters; outcome: DraftSourceOutcome;
            recordedCoverage: import("./ledger-source.js").DraftRecordedCoverage | null }
        | { kind: "detail"; projection: string; context: DraftSourceContext; sourceKey: string; scope: DraftDetailScope;
            range: DraftRange; fullSourceTotal: number; sourceOrdinals: readonly number[]; presentation: PresentationReceipt }
        | { kind: "detail_limited"; projection: string; context: DraftSourceContext; sourceKey: string; scope: DraftDetailScope;
            ordinal: number; sourceOrdinal: number; selectedTotal: number; fullSourceTotal: number;
            exceeded: readonly ("facts" | "words" | "marks" | "arrows")[] } };

function record(value: unknown): Record<string, unknown> {
  assert(typeof value === "object" && value !== null && !Array.isArray(value));
  return value as Record<string, unknown>;
}
function exact(value: unknown, keys: readonly string[]): Record<string, unknown> {
  const row = record(value); assert.deepEqual(Object.keys(row).sort(), [...keys].sort()); return row;
}
function text(value: unknown): asserts value is string { assert(typeof value === "string" && value.trim() !== ""); }
function ordinal(value: unknown): asserts value is number { assert(Number.isSafeInteger(value) && (value as number) >= 0); }
// Only the returned unavailable branch, NOT full response/source/access admission.
const installedOpeningTopics = new Set(["theory.opening.current_endpoint@1", "theory.opening.catalogue_membership@1", "derived.opening.deepest_reached@2"]);
export function parseDraftUnavailableOutcome(projection: string, value: unknown): DraftUnavailableOutcome {
  assert(sources.has(projection) || installedOpeningTopics.has(projection));
  const row = record(value);
  assert.equal(row.kind, "unavailable");
  if (row.reason === "source_version_held") {
    exact(row, ["kind", "reason", "dependency"]); text(row.dependency);
    const meta = factoryMetadata.get(projection)!;
    assert(meta, "a proposed successor has no current registered held-source metadata");
    assert.notEqual(meta.dependency, "none");
    assert.equal(row.dependency, meta.dependency, "held dependency must be the exact registered source owner");
    assert(meta.pending !== undefined && meta.pending.trim() !== "", "registration alone is not an unresolved source hold");
  } else {
    exact(row, ["kind", "reason"]);
    assert(["source_absent", "provider_unavailable", "authored_source_absent", "invalid_turn_clone", "no_legal_recapture", "recorded_measurement_unavailable", "artifact_missing"].includes(row.reason as string));
    if (row.reason === "no_legal_recapture") assert.equal(projection, "derived.tactic.overloaded_defender_response_conflict@1");
    if (row.reason === "recorded_measurement_unavailable") assert(projection === "recorded.engine.eval@1" || projection === "recorded.tablebase.result@1");
    if (row.reason === "artifact_missing") assert(installedOpeningTopics.has(projection));
  }
  return Object.freeze(structuredClone(row)) as DraftUnavailableOutcome;
}
// D3857 closed failed branch only; this grammar check is not an installed-source issuer.
export function parseDraftFailureOutcome(projection: string, value: unknown): DraftFailureOutcome {
  assert(sources.has(projection) || installedOpeningTopics.has(projection));
  const row = exact(value, ["kind", "reason"]);
  assert.equal(row.kind, "failed");
  assert(["source_contract_invalid", "provider_failed", "source_lookup_failed", "artifact_invalid", "digest_mismatch"].includes(row.reason as string));
  if (row.reason === "artifact_invalid" || row.reason === "digest_mismatch") assert(installedOpeningTopics.has(projection));
  return Object.freeze(structuredClone(row)) as DraftFailureOutcome;
}
// D3858 only: strict shape/request correlation, not genuine page/source occurrence admission.
export function parseDraftBelowFloorOutcome(projection: string, value: unknown, expectedPopulation: DraftBelowFloorOutcome["population"]): DraftBelowFloorOutcome {
  assert.equal(projection, "derived.explorer.inspector_population@1");
  const row = exact(value, ["kind", "sourceKey", "total", "population"]);
  assert.equal(row.kind, "below_floor"); text(row.sourceKey); ordinal(row.total); assert(row.total < 100);
  const population = exact(row.population, ["ratingBuckets", "speeds", "since", "until"]);
  const buckets: readonly unknown[] = EXPLORER_RATING_BUCKETS;
  const speeds: readonly unknown[] = EXPLORER_SPEEDS;
  assert(Array.isArray(population.ratingBuckets) && population.ratingBuckets.length > 0);
  assert(population.ratingBuckets.every((value, index, values) => buckets.includes(value) && (index === 0 || value > values[index - 1])));
  assert(Array.isArray(population.speeds) && population.speeds.length > 0);
  assert(population.speeds.every((value, index, values) => speeds.includes(value) && (index === 0 || speeds.indexOf(value) > speeds.indexOf(values[index - 1]))));
  for (const date of [population.since, population.until]) assert(date === null || typeof date === "string" && /^\d{4}-(0[1-9]|1[0-2])$/u.test(date));
  if (typeof population.since === "string" && typeof population.until === "string") assert(population.since <= population.until);
  assert.deepEqual(population, expectedPopulation);
  return Object.freeze({ kind: "below_floor", sourceKey: row.sourceKey, total: row.total,
    population: structuredClone(expectedPopulation) });
}
export function assertDraftUnavailableBinding(projection: string, outcome: unknown, disclosureOutcome: unknown): void {
  assert.deepEqual(parseDraftUnavailableOutcome(projection, outcome), parseDraftUnavailableOutcome(projection, disclosureOutcome));
}
function context(value: unknown): DraftSourceContext {
  const row = record(value);
  switch (row.kind) {
    case "position": case "incoming_edge": case "recorded_window": exact(row, ["kind"]); break;
    case "branch": case "recorded_review": exact(row, ["kind", "throughNodeId"]); text(row.throughNodeId); break;
    case "comparison": exact(row, ["kind", "otherBranchId", "otherNodeId"]); text(row.otherBranchId); text(row.otherNodeId); break;
    default: assert.fail("unknown context");
  }
  return structuredClone(row) as DraftSourceContext;
}
export function allowedContexts(projection: string): readonly DraftSourceContext["kind"][] {
  assert(sources.has(projection));
  if (projection === "derived.story.rank@2") return ["recorded_review"];
  if (projection.startsWith("derived.compare.")) return ["comparison"];
  if (projection.startsWith("derived.pivotal.") || projection === "derived.opening.deepest_reached@1") return ["branch"];
  if (projection === "theory.shapes.firing@1") return ["position", "branch"];
  if (windows.has(projection) || arms.get(projection)?.some(arm => "moves" in arm)) return ["recorded_window"];
  if (edgeDependencies.has(projection) || routeReads(projection, "afterFen|beforeFen|moveUci")) return ["incoming_edge"];
  assert(routeReads(projection, "fen") || arms.get(projection)?.some(arm => "packet" in arm || "page" in arm || "ledger" in arm), `unclassified source ${projection}`);
  return ["position"];
}
export function parseDraftRequest(value: unknown): DraftRequest {
  const body = exact(value, ["protocol", "assistance", "query"]);
  assert.equal(body.protocol, "inspector.query_page@1");
  parseRequestedAssistanceV1(body.assistance);
  const query = exact(body.query, ["branchId", "nodeId", "decisionDigest", "view"]);
  text(query.branchId); text(query.nodeId); text(query.decisionDigest);
  assert(/^sha256:[a-f0-9]{64}$/u.test(query.decisionDigest));
  const view = record(query.view);
  ordinal(view.start);
  if (view.kind === "inventory") exact(view, ["kind", "start"]);
  else {
    assert(view.kind === "source" || view.kind === "detail"); text(view.projection); assert(sources.has(view.projection));
    const scope = context(view.context); assert(allowedContexts(view.projection).includes(scope.kind));
    if (scope.kind === "comparison") assert.notEqual(scope.otherBranchId, query.branchId, "a branch cannot be its own second attempt");
    if (view.kind === "source") {
      exact(view, ["kind", "projection", "context", "start", "collectionKey", ...(mateSources.has(view.projection) ? ["parameters"] : [])]);
      if (mateSources.has(view.projection)) {
        const parameters = exact(view.parameters, ["kind", "maxAttackerMoves"]);
        assert.equal(parameters.kind, "forced_mate");
        assert(Number.isInteger(parameters.maxAttackerMoves) && [1, 2, 3, 4].includes(parameters.maxAttackerMoves as number));
      }
      if (view.start === 0) assert.equal(view.collectionKey, null); else text(view.collectionKey);
    } else {
      exact(view, ["kind", "projection", "context", "sourceKey", "scope", "start"]); text(view.sourceKey);
      assert([...DETAIL_VIEWS.keys()].some(ref => ref === view.projection), "source has no declared detail view");
      const detail = record(view.scope);
      if (detail.kind === "whole") exact(detail, ["kind"]);
      else {
        exact(detail, ["kind", "color", "mode", "target"]); assert.equal(detail.kind, "control_target");
        assert.equal(view.projection, "rules.square.reading.control@1");
        assert(detail.color === "white" || detail.color === "black"); assert(detail.mode === "geometric" || detail.mode === "legal");
        assert(typeof detail.target === "string" && /^[a-h][1-8]$/u.test(detail.target));
      }
    }
  }
  return structuredClone(value) as DraftRequest;
}
export function assertDraftRange(value: unknown): asserts value is DraftRange {
  const row = exact(value, ["start", "count", "total", "next"]);
  ordinal(row.start); ordinal(row.count); ordinal(row.total); assert(row.count <= 8);
  assert(row.start <= row.total && row.count <= row.total - row.start);
  assert(row.count > 0 || row.total === 0, "zero-progress page is not a limited-member result");
  assert.equal(row.next, row.start + row.count === row.total ? null : row.start + row.count);
}

// Grammar controls only. No source acquisition, server access check, future adapter or seal.
// Independent D3799 worksheet expectation, NOT a producer registry. Do not use the parser's
// allowedContexts function to decide whether its own requests should pass.
const scopeFixture = new Map<string, readonly DraftSourceContext["kind"][]>();
function expectScopes(refs: readonly string[], kinds: readonly DraftSourceContext["kind"][]) {
  for (const ref of refs) { assert(!scopeFixture.has(ref)); scopeFixture.set(ref, kinds); }
}
expectScopes([
  "rules.tactic.reading.loose_piece@1", "rules.tactic.reading.ray_classification@1", "rules.tactic.reading.rook_on_seventh@1",
  "rules.tactic.reading.trapped_piece@1", "rules.tactic.reading.back_rank@1", "rules.tactic.reading.discovered_latency@1",
  "rules.tactic.consequence.threat@1", "rules.tactic.consequence.mate_in_one@1", "rules.structural.reading.space@1",
  "rules.structural.reading.pawn_connectivity@1", "rules.phase.development@1", "rules.castling.reading.rights@1",
  "rules.castling.reading.legality@1", "derived.tactic.promotion_pressure@1", "rules.square.reading.control@1",
  "rules.mobility.reading.piece_destinations@1", "rules.mobility.reading.legal_moves@1", "rules.pawn.reading.contacts@1",
  "rules.pawn.reading.candidate_majority@1", "derived.material.reading.role_signature@1", "rules.king.reading.zone_state@1",
  "live.stockfish.eval@1", "live.stockfish.wdl@1", "live.stockfish.pv@1", "human.maia.policy@1", "human.maia.candidate_wdl@1",
  "human.explorer.population@1", "live.syzygy.result@1", "live.syzygy.category@1", "live.syzygy.distance@1",
  "recorded.engine.eval@1", "recorded.tablebase.result@1", "rules.phase.reading@2", "theory.opening.catalogue_membership@1",
  "rules.tactic.reading.defender_duty_set@1",
], ["position"]);
expectScopes([
  "rules.tactic.consequence.reply_breadth@1", "derived.tactic.discovered_executed@1", "derived.tactic.fork_survives_reply@1",
  "rules.square.event.control@1", "rules.mobility.event.piece_destinations@1", "derived.material.event.role_asymmetry@1",
  "rules.tactic.event.defender_removed@1", "rules.tactic.event.defender_duty_relocated@1",
  "derived.tactic.overloaded_defender_response_conflict@1", "rules.tactic.consequence.forced_mate_after_move@1",
  "rules.tactic.consequence.forced_mate_after_move@2",
], ["incoming_edge"]);
expectScopes([
  "derived.pawn.sequence.contact_timing", "derived.pawn.sequence.harassment_pressure", "derived.tactic.sequence.defender_consequence",
  "derived.tactic.deflection_observed", "derived.tactic.attraction_observed", "derived.tactic.line_blocker_clearance_observed",
  "derived.tactic.square_clearance_observed", "derived.tactic.interference_observed", "derived.tactic.check_zwischenzug_observed",
  "derived.tactic.overload_exploitation_observed",
].flatMap(id => [`${id}@1`, `${id}@2`]), ["recorded_window"]);
expectScopes(["derived.pivotal.irreversibility@1", "derived.pivotal.phase_change@1", "derived.pivotal.human_divergence@1",
  "derived.pivotal.option_collapse@1", "derived.opening.deepest_reached@1"], ["branch"]);
expectScopes(["derived.compare.structure_delta@1", "derived.compare.eval_delta@1"], ["comparison"]);
expectScopes(["derived.story.rank@2"], ["recorded_review"]);
expectScopes(["theory.shapes.firing@1"], ["position", "branch"]);
assert.deepEqual([...scopeFixture.keys()].sort(), [...sources].sort());
for (const [ref, kinds] of scopeFixture) assert.deepEqual(allowedContexts(ref), kinds, `scope assignment drift: ${ref}`);
const assistance = compileAssistanceRequest({ contextHint: "position", preference: { kind: "unset" } });
const request = (view: unknown) => ({ protocol: "inspector.query_page@1", assistance,
  query: { branchId: "main", nodeId: "n2", decisionDigest: `sha256:${"a".repeat(64)}`, view } });
let positives = 0, refusals = 0;
const pass = (value: unknown) => { assert.deepEqual(parseDraftRequest(JSON.parse(JSON.stringify(value))), value); positives++; };
const reject = (value: unknown) => { assert.throws(() => parseDraftRequest(value)); refusals++; };
const contexts: readonly DraftSourceContext[] = [{ kind: "position" }, { kind: "incoming_edge" }, { kind: "recorded_window" },
  { kind: "branch", throughNodeId: "n4" }, { kind: "comparison", otherBranchId: "other", otherNodeId: "n3" },
  { kind: "recorded_review", throughNodeId: "n9" }];
pass(request({ kind: "inventory", start: 0 }));
for (const projection of sources) for (const candidate of contexts) {
  const value = request({ kind: "source", projection, context: candidate, start: 0, collectionKey: null,
    ...(mateSources.has(projection) ? { parameters: { kind: "forced_mate", maxAttackerMoves: 4 } } : {}) });
  if (scopeFixture.get(projection)!.includes(candidate.kind)) pass(value); else reject(value);
}
for (const projection of mateSources) {
  const base = { kind: "source", projection, context: { kind: "incoming_edge" }, start: 0, collectionKey: null };
  for (const maxAttackerMoves of [1, 2, 3, 4]) pass(request({ ...base, parameters: { kind: "forced_mate", maxAttackerMoves } }));
  reject(request(base));
  for (const maxAttackerMoves of [0, -1, 5, 1.5, "4", null])
    reject(request({ ...base, parameters: { kind: "forced_mate", maxAttackerMoves } }));
  reject(request({ ...base, parameters: { kind: "forced_mate", maxAttackerMoves: 4, nodeCap: 1 } }));
  reject(request({ ...base, parameters: { kind: "other", maxAttackerMoves: 4 } }));
}
for (const projection of sources) if (!mateSources.has(projection)) {
  const context = contexts.find(candidate => scopeFixture.get(projection)!.includes(candidate.kind))!;
  reject(request({ kind: "source", projection, context, start: 0, collectionKey: null,
    parameters: { kind: "forced_mate", maxAttackerMoves: 4 } }));
}
const source = { kind: "source", projection: "rules.square.reading.control@1", context: { kind: "position" }, start: 8, collectionKey: "retained-collection" };
pass(request(source));
const detail = { kind: "detail", projection: source.projection, context: source.context, sourceKey: "retained-fact", scope: { kind: "control_target", color: "white", mode: "legal", target: "d6" }, start: 0 };
pass(request(detail));
for (const projection of DETAIL_VIEWS.keys()) pass(request({ ...detail, projection, context: { kind: allowedContexts(projection)[0] }, scope: { kind: "whole" } }));
reject(request({ ...detail, projection: "rules.mobility.reading.legal_moves@1", scope: { kind: "whole" } }));
for (const start of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, "0"]) reject(request({ ...detail, start }));
for (const mutation of [{ target: "i4" }, { color: "red" }, { mode: "all_moves" }, { field: "rays" }]) reject(request({ ...detail, scope: { ...detail.scope, ...mutation } }));
reject(request({ ...detail, projection: "rules.tactic.reading.ray_classification@1" }));
reject(request({ ...detail, parameters: { kind: "forced_mate", maxAttackerMoves: 4 } }));
reject(request({ ...source, collectionKey: null })); reject(request({ ...source, start: 0 }));
reject(request({ ...source, context: { kind: "position", fen: "caller supplied" } }));
reject(request({ kind: "source", projection: "derived.story.rank@2", context: { kind: "position" }, start: 0, collectionKey: null }));
reject({ ...request({ kind: "inventory", start: 0 }), protocol: "module.query_page@1" });
reject({ ...request({ kind: "inventory", start: 0 }), assistance: { ...assistance, stage: "authoritative" } });
const malformedStamp = request({ kind: "inventory", start: 0 });
reject({ ...malformedStamp, query: { ...malformedStamp.query, decisionDigest: "not-a-decision-stamp" } });
reject(request({ ...detail, projection: "unregistered@1" })); reject(request({ ...detail, sentences: ["invented chess truth"] }));
reject(request({ ...source, projection: "derived.compare.eval_delta@1", context: { kind: "comparison", otherBranchId: "main", otherNodeId: "n3" } }));
for (const range of [{ start: 0, count: 0, total: 0, next: null }, { start: 0, count: 8, total: 9, next: 8 }, { start: 8, count: 1, total: 9, next: null }]) { assertDraftRange(range); positives++; }
for (const range of [{ start: 0, count: 0, total: 1, next: null }, { start: 0, count: 9, total: 9, next: null },
  { start: 8, count: 2, total: 9, next: null }, { start: 0, count: 8, total: 9, next: 7 }, { start: 0, count: 1, total: 2, next: null }]) {
  assert.throws(() => assertDraftRange(range)); refusals++;
}
console.log(JSON.stringify({ scope: "D3801 disposable request/context and page-range grammar only; NOT response admission, source execution, access or production", sources: sources.size, positives, refusals }));

// D3843: exact unavailable outcome and disclosure binding, not an invented provider response.
const opening = "theory.opening.catalogue_membership@1";
const actualOpening = invokeEvidenceValueRoute(opening, { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" });
assert.equal(actualOpening.kind, "unavailable");
assert("dependency" in actualOpening && actualOpening.dependency === "runtime-opening-identity");
const held: DraftUnavailableOutcome = { kind: "unavailable", reason: "source_version_held", dependency: actualOpening.dependency };
const admittedHeld = parseDraftUnavailableOutcome(opening, JSON.parse(JSON.stringify(held)));
assertDraftUnavailableBinding(opening, held, admittedHeld);
let absenceChecks = 3;
const rejectAbsence = (projection: string, value: unknown) => {
  assert.throws(() => parseDraftUnavailableOutcome(projection, value)); absenceChecks++;
};
for (const value of [missingHeldDependency, { ...held, dependency: "provider-exchange-and-execution" },
  { ...held, dependency: "none" }, { ...held, dependency: "" }, { ...held, dependency: null },
  { ...held, diagnostic: "private provider error" }, { kind: "unavailable", reason: "provider_unavailable", dependency: held.dependency }]) rejectAbsence(opening, value);
rejectAbsence("rules.mobility.reading.legal_moves@1", held);
rejectAbsence("not_registered@1", held);
rejectAbsence(opening, { kind: "unavailable", reason: "no_legal_recapture" });
assert.throws(() => assertDraftUnavailableBinding(opening, held, { kind: "unavailable", reason: "provider_unavailable" })); absenceChecks++;
const disclosureBody: Omit<DraftDisclosure, "digest"> = {
  protocol: "inspector.disclosure_receipt@1", runId: "run", branchId: "main", nodeId: "n2",
  decisionDigest: `sha256:${"a".repeat(64)}`, requestedConfigDigest: `sha256:${"b".repeat(64)}`,
  effectiveConfigDigest: `sha256:${"c".repeat(64)}`,
  view: { kind: "source", projection: opening, context: { kind: "position" }, start: 0, collectionKey: null },
  range: null, collectionKey: null, sourceKeys: [], sourceOrdinals: [], detailProjection: null,
  componentDigests: [], sourceOutcome: admittedHeld, recordedCoverage: null,
};
const bound = presentationDigest("inspector.disclosure_receipt@1", disclosureBody);
assert.equal(presentationDigest("inspector.disclosure_receipt@1", JSON.parse(JSON.stringify(disclosureBody))), bound); absenceChecks++;
for (const sourceOutcome of [null, { kind: "unavailable", reason: "provider_unavailable" },
  { ...held, dependency: "provider-exchange-and-execution" }]) {
  assert.notEqual(presentationDigest("inspector.disclosure_receipt@1", { ...disclosureBody, sourceOutcome }), bound); absenceChecks++;
}
console.log(JSON.stringify({ scope: "D3843 disposable unavailable-branch/receipt metadata controls only; NOT full response, source authority or API",
  absenceChecks, actualOpeningDependencyRetained: true, nonHeldHasNoDependencyField: true }));

for (const projection of ["recorded.engine.eval@1", "recorded.tablebase.result@1"]) {
  assert.deepEqual(parseDraftUnavailableOutcome(projection, { kind: "unavailable", reason: "recorded_measurement_unavailable" }),
    { kind: "unavailable", reason: "recorded_measurement_unavailable" });
}
assert.throws(() => parseDraftUnavailableOutcome("rules.phase.reading@2", { kind: "unavailable", reason: "recorded_measurement_unavailable" }));

let openingOutcomeControls = 0;
for (const projection of installedOpeningTopics) {
  const missing = { kind: "unavailable", reason: "artifact_missing" };
  assert.deepEqual(parseDraftUnavailableOutcome(projection, missing), missing); openingOutcomeControls++;
  assert.throws(() => parseDraftUnavailableOutcome(projection, { ...missing, dependency: "runtime-opening-identity" })); openingOutcomeControls++;
  for (const reason of ["artifact_invalid", "digest_mismatch"] as const) {
    const failure = { kind: "failed", reason };
    assert.deepEqual(parseDraftFailureOutcome(projection, failure), failure); openingOutcomeControls++;
    const source = { ...disclosureBody, view: { kind: "source", projection, context: projection.startsWith("derived.opening")
      ? { kind: "branch", throughNodeId: "through" } : { kind: "position" }, start: 0, collectionKey: null }, sourceOutcome: failure };
    const digest = presentationDigest("inspector.disclosure_receipt@1", source);
    for (const sourceOutcome of [missing, { kind: "failed", reason: "source_lookup_failed" }, { kind: "no_witness" }]) {
      assert.notEqual(presentationDigest("inspector.disclosure_receipt@1", { ...source, sourceOutcome }), digest); openingOutcomeControls++;
    }
  }
}
for (const projection of ["rules.phase.reading@2", "recorded.engine.eval@1", "derived.opening.deepest_reached@1"]) {
  assert.throws(() => parseDraftUnavailableOutcome(projection, { kind: "unavailable", reason: "artifact_missing" })); openingOutcomeControls++;
  for (const reason of ["artifact_invalid", "digest_mismatch"]) {
    assert.throws(() => parseDraftFailureOutcome(projection, { kind: "failed", reason })); openingOutcomeControls++;
  }
}
assert.throws(() => parseDraftFailureOutcome("theory.opening.current_endpoint@1", { kind: "failed", reason: "artifact_invalid", detail: "private path" })); openingOutcomeControls++;
console.log(JSON.stringify({ scope: "D3857 proposed installed-opening outcome/receipt grammar only, NOT source/response/adoption proof",
  openingOutcomeControls, installedOpeningTopics: [...installedOpeningTopics], oldHistoryRetained: true, productionChanges: 0 }));

let sparseControls = 0;
const population = { ratingBuckets: [1600], speeds: ["blitz", "rapid", "classical"], since: "2026-01", until: "2026-09" };
const sparse = { kind: "below_floor", sourceKey: "synthetic-key-not-source-issuance", total: 99, population };
for (const total of [0, 1, 99]) {
  assert.deepEqual(parseDraftBelowFloorOutcome("derived.explorer.inspector_population@1", { ...sparse, total }, population), { ...sparse, total }); sparseControls++;
}
const unbounded = { ...population, since: null, until: null };
assert.deepEqual(parseDraftBelowFloorOutcome("derived.explorer.inspector_population@1", { ...sparse, population: unbounded }, unbounded).population, unbounded); sparseControls++;
for (const total of [-1, 0.5, 100, Number.MAX_SAFE_INTEGER + 1, "99", null]) {
  assert.throws(() => parseDraftBelowFloorOutcome("derived.explorer.inspector_population@1", { ...sparse, total }, population)); sparseControls++;
}
for (const projection of ["recorded.engine.eval@1", "human.explorer.population@1", "theory.opening.current_endpoint@1"]) {
  assert.throws(() => parseDraftBelowFloorOutcome(projection, sparse, population)); sparseControls++;
}
for (const changed of [{ ...sparse, sourceKey: "" }, { ...sparse, facts: [] }, { ...sparse, reason: "no_data_at_band" },
  { ...sparse, population: { ...population, ratingBuckets: [1600, 1600] } },
  { ...sparse, population: { ...population, speeds: ["rapid", "blitz"] } },
  { ...sparse, population: { ...population, since: "2027-01" } },
  { ...sparse, population: { ...population, until: "2026-13" } },
  { ...sparse, population: { ...population, since: undefined } },
  { ...sparse, population: { ...population, rawPage: {} } },
  { ...sparse, population: { ...population, ratingBuckets: [1400] } },
  { ...sparse, population: { ...population, until: "2026-08" } }]) {
  assert.throws(() => parseDraftBelowFloorOutcome("derived.explorer.inspector_population@1", changed, population)); sparseControls++;
}
const sparseDisclosure = { ...disclosureBody, view: { kind: "source", projection: "derived.explorer.inspector_population@1", context: { kind: "position" }, start: 0, collectionKey: null }, sourceOutcome: sparse };
const sparseDigest = presentationDigest("inspector.disclosure_receipt@1", sparseDisclosure);
for (const sourceOutcome of [null, { kind: "no_witness" }, { ...sparse, total: 0 }, { ...sparse, sourceKey: "foreign" },
  { ...sparse, population: { ...population, ratingBuckets: [1400] } }, { ...sparse, population: { ...population, until: "2026-08" } }]) {
  assert.notEqual(presentationDigest("inspector.disclosure_receipt@1", { ...sparseDisclosure, sourceOutcome }), sparseDigest); sparseControls++;
}
console.log(JSON.stringify({ scope: "D3858 sparse Explorer shape/population/receipt controls, NOT page admission/API/native proof", sparseControls, productionChanges: 0 }));
