// Accepted F2 §2.3d: real factories, recorded boundaries and provider-exchange deliveries.
// This proves source completeness/membership, not engine accuracy or last-level selection.
import { createHash } from "node:crypto";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it, vi } from "vitest";
import { branchPath } from "./branch-path.js";
import { assertDeclaredEvidence, evidenceDigest, evidenceValueReceipt } from "./evidence-contract.js";
import { attachEvidence } from "./evidence.js";
import * as routes from "./internal/evidence-value-routes.js";
import { createRecordedReviewBoundarySourceOwner } from "./recorded-review-boundary.js";
import { collectRecordedLastLevelPopulation, readRecordedLastLevelPopulation, REVIEW_PACKET_SOURCE_ADAPTERS, type ReviewImportRecordImage, type ReviewProviderNodeState, type ReviewSourceContext } from "./review-evidence.js";
import { commitMove, fork, rewind } from "./runtime.js";
import { evaluationDelivery, importedRun, play, REVIEW_AT } from "./testing/review-evidence-fixture.js";
import type { DrillRun } from "./types.js";

const LINE = ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5a4", "g8f6"];
function fixture(side: "white" | "black" = "white", result: ReviewImportRecordImage["result"] = "0-1", id = "last-level-source", moves = LINE) {
  let run = play(importedRun(id, side), moves), stored = run;
  const path = branchPath(run, run.activeCursor.branchId);
  const record: ReviewImportRecordImage = { runId: run.id, result, movetextDigest: `sha256:${createHash("sha256").update(canonicalizeJson({ rootFen: path[0]!.fen, uci: path.slice(1).map(node => node.moveUci) })).digest("hex")}` };
  const owner = createRecordedReviewBoundarySourceOwner({ loadRun: () => stored, loadImportRecord: () => record });
  const boundary = (nodeId = run.activeCursor.nodeId, branchId = run.activeCursor.branchId) => owner.resolve({ runId: run.id, branchId, throughNodeId: nodeId });
  const engine = new Map<string, ReviewProviderNodeState>(), context = { engine, shapes: [] };
  return { run, path, record, owner, engine, context, boundary, setRun: (value: DrillRun) => { run = value; stored = value; } };
}
function delivery(fen: string, score = "cp 20") { return routes.invokeEvidenceValueRoute("live.stockfish.position_eval@1", { delivery: evaluationDelivery(fen, score) }); }
const collect = (value: ReturnType<typeof fixture>, boundary = value.boundary(), context: ReviewSourceContext = value.context) => collectRecordedLastLevelPopulation({ boundary, context });

describe("complete recorded Review point/state/result population", () => {
  it.each(["white", "black"] as const)("retains every row and original slot at every prefix, side=%s", side => {
    const f = fixture(side);
    for (const [last, endpoint] of f.path.entries()) {
      const data = readRecordedLastLevelPopulation(collect(f, f.boundary(endpoint.id)));
      expect(Object.keys(data).sort()).toEqual(["boundary", "learnerSide", "outcome", "result", "rows"]);
      expect(data.rows).toHaveLength(last + 1); expect(data.learnerSide).toBe(side);
      expect(data.boundary.run).toEqual(f.run);
      for (const [index, row] of data.rows.entries()) {
        expect(Object.keys(row).sort()).toEqual(["pathIndex", "points", "position", "provider", "slot", "state"]);
        expect(row.pathIndex).toBe(index); expect(row.provider).toBeNull(); expect(row.points).toEqual([]);
        expect(row.state).toEqual({ kind: "not_requested" });
        expect(row.position.payload).toEqual({ nodeId: f.path[index]!.id, ply: f.path[index]!.ply, fen: f.path[index]!.fen });
        expect(row.slot).toEqual({ invocationId: `review.source.eval_point@1#${f.path[index]!.id}`, adapterId: "review.source.eval_point@1", family: "engine_eval", grain: "node", nodeId: f.path[index]!.id, fromNodeId: null, window: index });
      }
      expect(Object.keys(data.result).sort()).toEqual(["items", "slot", "state"]);
      expect(data.result.slot).toEqual({ invocationId: `review.source.imported_result@1#${endpoint.id}`, adapterId: "review.source.imported_result@1", family: "recorded", grain: "node", nodeId: endpoint.id, fromNodeId: null, window: last });
      if (last < f.path.length - 1) {
        expect(data.outcome.kind).toBe("unfinished"); expect(data.result.state).toEqual({ kind: "honest_empty", reason: "no_observation" }); expect(data.result.items).toEqual([]);
      } else {
        expect(data.result.state).toEqual({ kind: "available", itemCount: 1 });
        expect(data.result.items[0]!.payload).toEqual({ context: "story", result: "0-1" });
      }
    }
  });

  it("retains all closed states, typed scores and rejected delivered inputs without loss", () => {
    const f = fixture(), ids = f.path.map(node => node.id);
    const wrongFen = delivery(f.path[0]!.fen);
    const inputs: ReviewProviderNodeState[] = [ { kind: "not_requested" }, { kind: "not_yet_scheduled" }, { kind: "pending", jobCount: 3, retrying: 2 },
      { kind: "unavailable", reason: "provider_failed" }, { kind: "honest_empty", reason: "outside_domain" }, { kind: "delivered", delivery: wrongFen },
      { kind: "delivered", delivery: delivery(f.path[7]!.fen, "mate -3") }, { kind: "delivered", delivery: delivery(f.path[8]!.fen, "cp 12345") } ];
    inputs.forEach((state, index) => f.engine.set(ids[index + 1]!, state));
    const data = readRecordedLastLevelPopulation(collect(f));
    expect(data.rows[0]!.provider).toBeNull();
    inputs.forEach((state, index) => expect(data.rows[index + 1]!.provider).toEqual(state));
    for (let index = 0; index < 5; index++) { expect(data.rows[index + 1]!.state).toEqual(inputs[index]); expect(data.rows[index + 1]!.points).toEqual([]); }
    const rejected = data.rows[6]!;
    expect(rejected.provider).toEqual({ kind: "delivered", delivery: wrongFen });
    expect(rejected.state).toEqual({ kind: "unavailable", reason: "input_abstained" }); expect(rejected.points).toEqual([]);
    expect(data.rows[7]!.points[0]!.payload.evaluation.payload.payload.score.kind).toBe("mate");
    expect(data.rows[8]!.points[0]!.payload.evaluation.payload.payload.score).toEqual({ kind: "centipawns", value: 12345 });
    for (const row of data.rows.slice(7)) {
      expect(row.state).toEqual({ kind: "available", itemCount: 1 });
      const point = row.points[0]!, source = routes.readReviewPointInvocation(point);
      expect(source.position).toBe(row.position); expect(point.payload.position).toBe(row.position);
      expect(row.provider?.kind).toBe("delivered");
      if (row.provider?.kind !== "delivered") throw new Error("fixture requires delivered provider");
      expect(source.evaluation).toBe(row.provider.delivery);
      expect(evidenceValueReceipt(point).sourceDigests).toEqual([evidenceValueReceipt(row.provider.delivery).payloadDigest, evidenceValueReceipt(row.position).payloadDigest]);
    }
  });

  it("executes the actual registered operations once per planned slot and does not re-mint on read", () => {
    const f = fixture(), evaluation = delivery(f.path[2]!.fen); f.engine.set(f.path[2]!.id, { kind: "delivered", delivery: evaluation });
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      const boundary = f.boundary(), population = collect(f, boundary), first = readRecordedLastLevelPopulation(population), count = invoke.mock.calls.length;
      expect(readRecordedLastLevelPopulation(population)).toBe(first); expect(invoke).toHaveBeenCalledTimes(count);
      expect(invoke.mock.calls.filter(([route]) => route === "run.record.position@1")).toHaveLength(f.path.length);
      expect(invoke.mock.calls.filter(([route]) => route === "derived.review.eval_point@1")).toHaveLength(1);
      expect(invoke.mock.calls.filter(([route]) => route === "run.record.imported_result@1").map(([, input]) => input)).toEqual([{ recordedReview: boundary }]);
      expect(new Set(invoke.mock.calls.map(([route]) => route))).toEqual(new Set(["run.record.position@1", "derived.review.eval_point@1", "run.record.imported_result@1"]));
      for (const row of first.rows) expect(REVIEW_PACKET_SOURCE_ADAPTERS.find(adapter => adapter.id === row.slot.adapterId)?.projection).toEqual({ id: "derived.review.eval_point", version: 1 });
    } finally { invoke.mockRestore(); }
  });

  it.each(["*", "1-0", "1/2-1/2"] as const)("validates complete source even when later last-level eligibility is absent: %s", result => {
    const f = fixture("white", result); f.engine.set(f.path[0]!.id, { kind: "pending", jobCount: 1, retrying: 0 });
    const data = readRecordedLastLevelPopulation(collect(f));
    expect(data.rows).toHaveLength(f.path.length); expect(data.rows[0]!.state).toEqual({ kind: "pending", jobCount: 1, retrying: 0 });
    expect(data.result.items).toHaveLength(result === "*" ? 0 : 1);
  });

  it("executes and retains a genuine empty imported-result invocation for board-terminal loss", () => {
    const f = fixture("white", "0-1", "terminal-source", ["f2f3", "e7e5", "g2g4", "d8h4"]);
    f.engine.set(f.path.at(-1)!.id, { kind: "honest_empty", reason: "outside_domain" });
    const original = routes.invokeEvidenceValueRoute, calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const data = readRecordedLastLevelPopulation(collect(f));
    expect(data.outcome.kind).toBe("board_terminal"); expect(data.result.items).toEqual([]);
    expect(data.result.state).toEqual({ kind: "honest_empty", reason: "no_observation" });
    expect(calls.mock.calls.filter(([route]) => route === "run.record.imported_result@1")).toHaveLength(1);
    calls.mockRestore(); expect(routes.invokeEvidenceValueRoute).toBe(original);
  });

  it("retains distinct captured absent/not_requested states even with identical folded output", () => {
    const f = fixture(), absent = readRecordedLastLevelPopulation(collect(f));
    f.engine.set(f.path[0]!.id, { kind: "not_requested" });
    const explicit = readRecordedLastLevelPopulation(collect(f));
    expect(absent.rows[0]!.state).toEqual(explicit.rows[0]!.state);
    expect(absent.rows[0]!.provider).toBeNull(); expect(explicit.rows[0]!.provider).toEqual({ kind: "not_requested" });
    expect(evidenceDigest(absent)).not.toBe(evidenceDigest(explicit));
  });

  it("captures caller maps/states before execution and does not freeze or follow mutable backing", () => {
    const f = fixture(), mutable = { kind: "pending" as const, jobCount: 2, retrying: 1 }; f.engine.set(f.path[0]!.id, mutable);
    const boundary = f.boundary(), original = routes.invokeEvidenceValueRoute;
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: unknown) => {
      f.engine.clear(); mutable.jobCount = 9;
      return original(ref as never, input as never);
    }) as typeof original);
    let population;
    try { population = collect(f, boundary); } finally { invoke.mockRestore(); }
    const data = readRecordedLastLevelPopulation(population);
    expect(data.rows[0]!.provider).toEqual({ kind: "pending", jobCount: 2, retrying: 1 });
    expect(data.rows[0]!.state).toEqual({ kind: "pending", jobCount: 2, retrying: 1 });
    expect(Object.isFrozen(mutable)).toBe(false); expect(Object.isFrozen(data.rows[0]!.provider)).toBe(true);
    expect(readRecordedLastLevelPopulation(collect(f, boundary)).rows[0]!.provider).toBeNull();
    expect(Reflect.set(data.rows[0]!, "pathIndex", 999)).toBe(false); expect(() => (data.rows as unknown[]).pop()).toThrow();
  });

  it("excludes unrelated context entries without letting them alter the image", () => {
    const f = fixture(), first = readRecordedLastLevelPopulation(collect(f));
    f.engine.set("outside-the-granted-path", { kind: "unavailable", reason: "provider_off" });
    const next = readRecordedLastLevelPopulation(collect(f));
    expect(evidenceDigest(next)).toBe(evidenceDigest(first));
  });

  it("rejects accessor-backed context/state fields without invoking caller getters", () => {
    const f = fixture(); let reads = 0;
    f.engine.set(f.path[0]!.id, { get kind() { reads++; return "not_requested" as const; } });
    expect(() => collect(f)).toThrow(); expect(reads).toBe(0);
    expect(() => collectRecordedLastLevelPopulation({ boundary: f.boundary(), context: { get engine() { reads++; return f.engine; }, shapes: [] } })).toThrow();
    expect(reads).toBe(0);
  });

  it.each(["provider_off", "provider_failed", "retry_exhausted", "legacy_provenance_missing", "attempt_history_capacity"] as const)("preserves captured unavailability reason %s", reason => {
    const f = fixture(), state = { kind: "unavailable" as const, reason }; f.engine.set(f.path[0]!.id, state);
    const row = readRecordedLastLevelPopulation(collect(f)).rows[0]!;
    expect(row.provider).toEqual(state); expect(row.state).toEqual(state); expect(row.points).toEqual([]);
  });

  it.each([undefined, null, { kind: "unknown" }, { kind: "available", itemCount: 1 }, { kind: "pending", jobCount: 0, retrying: 0 },
    { kind: "pending", jobCount: 1, retrying: 2 }, { kind: "not_requested", extra: true }, { kind: "unavailable", reason: "input_abstained" },
    { kind: "honest_empty", reason: "no_observation" }, { kind: "delivered", delivery: {} }])("refuses malformed present provider input before preparation: %j", value => {
    const f = fixture(); f.engine.set(f.path[0]!.id, value as never);
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try { expect(() => collect(f)).toThrow(); expect(invoke).not.toHaveBeenCalled(); } finally { invoke.mockRestore(); }
  });

  it("refuses copied/raw populations, caller point/result overrides and stale storage before work", () => {
    const f = fixture(), boundary = f.boundary(), population = collect(f, boundary), data = readRecordedLastLevelPopulation(population);
    for (const value of [{ ...population }, JSON.parse(JSON.stringify(population)), data, { ...data, rows: [] }, boundary, null]) expect(() => readRecordedLastLevelPopulation(value as never)).toThrow();
    for (const value of [{ boundary, context: f.context, points: [] }, { boundary, context: f.context, result: "0-1" }, { boundary: {}, context: f.context }, { boundary, context: { ...f.context, run: f.run } }]) expect(() => collectRecordedLastLevelPopulation(value as never)).toThrow();
    f.setRun(attachEvidence(f.run, f.path[0]!.id, ["synthetic:change"], { kind: "eval", source: "engine_validated", values: { centipawns: 11 } }, REVIEW_AT).run);
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try { expect(() => readRecordedLastLevelPopulation(population)).toThrow(); expect(() => collect(f, boundary)).toThrow(); expect(invoke).not.toHaveBeenCalled(); } finally { invoke.mockRestore(); }
  });

  it.each(["copied", "foreign", "empty"] as const)("refuses substituted genuine/copy result arrays before nonloss/empty shortcuts: %s", fault => {
    const f = fixture("white", "*"), boundary = f.boundary(), foreign = f.boundary();
    const result = routes.invokeEvidenceValueRoute("run.record.imported_result@1", { recordedReview: fault === "foreign" ? foreign : boundary });
    const replacement = fault === "foreign" ? result : fault === "copied" ? Object.freeze([...result]) : Object.freeze([]);
    const original = routes.invokeEvidenceValueRoute, invoke = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: unknown) => ref === "run.record.imported_result@1" ? replacement : original(ref as never, input as never)) as typeof original);
    try { expect(() => collect(f, boundary)).toThrow(/original boundary\/factory/u); } finally { invoke.mockRestore(); }
  });

  it("refuses genuine foreign-head positions and points even when labels/FENs/payloads agree", () => {
    const f = fixture(), node = f.path[1]!;
    const report = (cp: number) => attachEvidence(f.run, node.id, ["synthetic:same-head-count"], { kind: "eval", source: "engine_validated", values: { centipawns: cp } }, REVIEW_AT).run;
    const left = report(10), right = report(11); expect(left.events.length).toBe(right.events.length);
    f.setRun(left); const boundary = f.boundary(), evaluation = delivery(node.fen);
    f.engine.set(node.id, { kind: "delivered", delivery: evaluation });
    const position = routes.invokeEvidenceValueRoute("run.record.position@1", { run: right, nodeId: node.id });
    const point = routes.invokeEvidenceValueRoute("derived.review.eval_point@1", { evaluation, position });
    const original = routes.invokeEvidenceValueRoute;
    for (const fault of ["position", "point"] as const) {
      const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: { nodeId?: string }) => fault === "position" && ref === "run.record.position@1" && input.nodeId === node.id ? position
        : fault === "point" && ref === "derived.review.eval_point@1" ? point : original(ref as never, input as never)) as typeof original);
      try { expect(() => collect(f, boundary)).toThrow(); } finally { invoke.mockRestore(); }
    }
  });

  it("refuses forged/copy unavailable results rather than converting them to evidence absence", () => {
    const f = fixture("white", "1-0"), node = f.path[0]!; f.engine.set(node.id, { kind: "delivered", delivery: delivery(f.path[1]!.fen) });
    const position = routes.invokeEvidenceValueRoute("run.record.position@1", { run: f.run, nodeId: node.id });
    const genuine = routes.invokeEvidenceValueRoute("derived.review.eval_point@1", { position, evaluation: delivery(f.path[1]!.fen) });
    expect(genuine.kind).toBe("unavailable"); expect(() => routes.readReviewPointResultInvocation({ ...genuine })).toThrow();
    const original = routes.invokeEvidenceValueRoute, invoke = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: unknown) => ref === "derived.review.eval_point@1" ? { ...genuine } : original(ref as never, input as never)) as typeof original);
    try { expect(() => collect(f)).toThrow(/original factory/u); } finally { invoke.mockRestore(); }
  });

  it("rechecks storage after preparation and refuses a mid-execution head change", () => {
    const f = fixture(), boundary = f.boundary(), original = routes.invokeEvidenceValueRoute;
    let changed = false;
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: unknown) => {
      const result = original(ref as never, input as never);
      if (!changed) { changed = true; f.setRun(attachEvidence(f.run, f.path[0]!.id, ["synthetic:mid-work"], { kind: "eval", source: "engine_validated", values: { centipawns: 10 } }, REVIEW_AT).run); }
      return result;
    }) as typeof original);
    try { expect(() => collect(f, boundary)).toThrow(/no longer/u); } finally { invoke.mockRestore(); }
  });

  it("preserves equal-FEN original/retry occurrences without reusing another node's point", () => {
    const f = fixture(), main = f.run.activeCursor.branchId;
    let run = fork(rewind(f.run, f.path[2]!.id, REVIEW_AT).run, f.path[2]!.id, { at: REVIEW_AT }).run;
    run = commitMove(run, "g1f3", { at: REVIEW_AT }).run; f.setRun(run);
    const peer = run.activeCursor.branchId, node = branchPath(run, peer).at(-1)!, original = f.path[3]!;
    expect(node.fen).toBe(original.fen); expect(node.id).not.toBe(original.id);
    const evaluation = delivery(node.fen); f.engine.set(node.id, { kind: "delivered", delivery: evaluation }); f.engine.set(original.id, { kind: "delivered", delivery: evaluation });
    const left = readRecordedLastLevelPopulation(collect(f, f.boundary(original.id, main))), right = readRecordedLastLevelPopulation(collect(f, f.boundary(node.id, peer)));
    const a = left.rows.at(-1)!, b = right.rows.at(-1)!;
    expect(a.position.payload.fen).toBe(b.position.payload.fen); expect(a.position.payload.nodeId).not.toBe(b.position.payload.nodeId);
    expect(a.points[0]!.payload.position).toBe(a.position); expect(b.points[0]!.payload.position).toBe(b.position);
    assertDeclaredEvidence(a.points[0]); assertDeclaredEvidence(b.points[0]);
  });
});
