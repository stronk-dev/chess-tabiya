// DISPOSABLE D3801 authoring controls. Not a production parser, seal, provider or API.
import assert from "node:assert/strict";
import { MODULE_CONSUMER_ACCEPTS, RECORDED_PATH_SUCCESSOR_REFS } from "../../packages/runtime/src/evidence-catalog.js";
import { compileAssistanceRequest, parseRequestedAssistanceV1, type RequestedAssistanceV1 } from "../../packages/runtime/src/assistance-exchange.js";
import { evidenceValueRouteRegistry } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { routeReads } from "../../packages/runtime/src/module-query-sources.js";
import type { ModuleDecisionStamp } from "../../packages/runtime/src/module-query.js";
import type { PresentationReceipt } from "../../packages/runtime/src/presentation-contract.js";
import type { InspectorFamilyId } from "../../packages/runtime/src/module-contract.js";

const key = (ref: { id: string; version: number }) => `${ref.id}@${ref.version}`;
const sources = new Set(MODULE_CONSUMER_ACCEPTS.full_inspector.map(key));
const windows = new Set(RECORDED_PATH_SUCCESSOR_REFS.map(key));
const arms = new Map(evidenceValueRouteRegistry().map(row => [row.route, row.arms]));
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
export type DraftSourceOutcome =
  | { kind: "missing_context"; reason: DraftContextFailure }
  | { kind: "unavailable"; reason: "source_absent" | "provider_unavailable" | "authored_source_absent" | "source_version_held" | "invalid_turn_clone" | "no_legal_recapture" }
  | { kind: "failed"; reason: "source_contract_invalid" | "provider_failed" | "source_lookup_failed" }
  | { kind: "no_witness" }
  | { kind: "available"; collectionKey: string; range: DraftRange; collected: number; displayed: number; deferred: number;
      facts: readonly { sourceKey: string; disposition: "presented" | "deferred";
        exceeded: readonly ("facts" | "words" | "marks" | "arrows")[]; detail: DraftDetailRef | null }[];
      presentation: PresentationReceipt };
export interface DraftDisclosure {
  protocol: "inspector.disclosure_receipt@1";
  runId: string; branchId: string; nodeId: string; decisionDigest: string;
  requestedConfigDigest: string; effectiveConfigDigest: string;
  view: DraftView; range: DraftRange | null; collectionKey: string | null;
  sourceKeys: readonly string[]; sourceOrdinals: readonly number[];
  detailProjection: DraftDetailRef | null; componentDigests: readonly string[]; digest: string;
}
export type DraftResponse =
  | { protocol: "inspector.query_page@1"; kind: "refused";
      code: "invalid_request" | "not_found" | "withheld" | "stale" | "unsupported_version" }
  | { protocol: "inspector.query_page@1"; kind: "page"; runId: string; branchId: string; nodeId: string;
      decision: ModuleDecisionStamp; requestedConfigDigest: string; effectiveConfigDigest: string;
      disclosure: DraftDisclosure; body:
        | { kind: "inventory"; range: DraftRange; topics: readonly { projection: string; family: InspectorFamilyId; state: "not_requested" }[] }
        | { kind: "source"; projection: string; context: DraftSourceContext; parameters?: DraftMateParameters; outcome: DraftSourceOutcome }
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
