import { describe, expect, it, vi } from "vitest";
import { attachEvidence } from "./evidence.js";
import { collectRecordedEngineAttachments, collectRecordedEngineEdge, readRecordedEngineAttachments, beginRecordedEngineAttachmentCollection,
  advanceRecordedEngineAttachmentCollection, finishRecordedEngineAttachmentCollection, cancelRecordedEngineAttachmentCollection,
  recordedEngineAttachmentNode, readRecordedEngineAttachmentNode, sameRecordedEngineAttachmentSource, type RecordedEngineAttachments } from "./internal/recorded-engine-attachments.js";
import * as routes from "./internal/evidence-value-routes.js";
import * as contracts from "./evidence-contract.js";
import { readRecordedEngineNode } from "./internal/recorded-engine-node.js";
import { readReviewPointInvocation } from "./internal/evidence-value-routes.js";
import { recordedLastLevelFixture } from "./testing/recorded-last-level-fixture.js";
import { attachDelivery, evaluationDelivery, REVIEW_AT, lineDelivery } from "./testing/review-evidence-fixture.js";
import { serializeProviderDelivery } from "./provider-exchange.js";
import { REVIEW_PROVIDER_DELIVERY_KEY } from "./review-evidence.js";
import type { EvidencePayload } from "./types.js";
import type { StockfishPositionEvaluationRequest } from "./provider-types.js";

function fixture(side: "white" | "black" = "white", moves?: string[]) {
  const f = recordedLastLevelFixture(side, "*", "durable-engine-occurrences", moves); let run = f.run;
  const attach = (index: number, payload: EvidencePayload) => { run = attachEvidence(run, f.path[index]!.id, ["engine:actual-stored"], payload, REVIEW_AT).run; f.setRun(run); };
  return { ...f, attach, delivery: (index: number, score = "cp 20", bound?: StockfishPositionEvaluationRequest["bound"]) => {
    const delivery = evaluationDelivery(f.path[index]!.fen, score, bound === undefined ? {} : { bound }); run = attachDelivery(run, f.path[index]!.id, delivery); f.setRun(run); return delivery;
  }, collect: (index = f.path.length - 1) => collectRecordedEngineAttachments({ boundary: f.boundary(f.path[index]!.id) }), current: () => run };
}
const legacy = (centipawns = 999): EvidencePayload => ({ kind: "eval", source: "engine_validated", values: { centipawns, engineId: "legacy-score" } });
const modern = (value: unknown): EvidencePayload => ({ kind: "eval", source: "engine_validated", values: { centipawns: 999, [REVIEW_PROVIDER_DELIVERY_KEY]: value } });

describe("original durable modern engine attachment source primitive", () => {
  it.each(["white", "black"] as const)("acquires only the next original %s node and publishes the unchanged complete aggregate", async side => {
    const f = fixture(side); for (let i = 0; i < f.path.length; i++) f.delivery(i);
    f.attach(1, legacy()); f.delivery(1); f.attach(1, legacy());
    const boundary = f.boundary(), expected = readRecordedEngineAttachments(collectRecordedEngineAttachments({ boundary }));
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      const work = beginRecordedEngineAttachmentCollection({ boundary });
      expect(dispatch).not.toHaveBeenCalled();
      expect(() => readRecordedEngineAttachments(work as never)).toThrow(/not issued/u);
      expect(() => recordedEngineAttachmentNode(work, f.path[0]!.id)).toThrow(/not been acquired/u);
      expect(() => finishRecordedEngineAttachmentCollection(work)).toThrow(/incomplete/u);
      for (const [index, node] of f.path.entries()) {
        const previous = dispatch.mock.calls.length;
        expect(advanceRecordedEngineAttachmentCollection(work)).toEqual({ nodeId: node.id, completedSubjects: index + 1,
          totalSubjects: f.path.length, complete: index === f.path.length - 1 });
        const issued = dispatch.mock.calls.slice(previous);
        expect(issued.filter(([route]) => route === "run.record.position@1").map(([, input]) => (input as { nodeId: string }).nodeId)).toEqual([node.id]);
        expect(issued.filter(([route]) => route === "live.stockfish.position_eval@1")).toHaveLength(index === 1 ? 2 : 1);
        const source = recordedEngineAttachmentNode(work, node.id), actual = readRecordedEngineAttachmentNode(source, node.id);
        expect(actual.boundary).toBe(expected.boundary); expect(actual.row).toEqual(expected.rows[index]);
        expect(recordedEngineAttachmentNode(work, node.id)).toBe(source);
        expect(() => readRecordedEngineAttachments(source as never)).toThrow(/not issued/u);
        expect(() => readRecordedEngineAttachmentNode(work as never, node.id)).toThrow(/not issued/u);
        expect(() => readRecordedEngineAttachmentNode(source, "not-this-node")).toThrow(/original occurrence/u);
        if (index < f.path.length - 1) {
          expect(() => recordedEngineAttachmentNode(work, f.path[index + 1]!.id)).toThrow(/not been acquired/u);
          expect(() => finishRecordedEngineAttachmentCollection(work)).toThrow(/incomplete/u);
        }
        await new Promise<void>(resolve => setImmediate(resolve));
      }
      const calls = dispatch.mock.calls.length, aggregate = finishRecordedEngineAttachmentCollection(work);
      expect(readRecordedEngineAttachments(aggregate)).toEqual(expected);
      expect(dispatch).toHaveBeenCalledTimes(calls);
      expect(cancelRecordedEngineAttachmentCollection(work)).toBe(false);
      expect(() => advanceRecordedEngineAttachmentCollection(work)).toThrow(/retired/u);
    } finally { dispatch.mockRestore(); }
  });

  it("keeps completed node sources in their own original capture even when full boundary/FENs are identical", () => {
    const f = fixture(), boundary = f.boundary(), a = beginRecordedEngineAttachmentCollection({ boundary }), b = beginRecordedEngineAttachmentCollection({ boundary });
    advanceRecordedEngineAttachmentCollection(a); advanceRecordedEngineAttachmentCollection(a);
    advanceRecordedEngineAttachmentCollection(b); advanceRecordedEngineAttachmentCollection(b);
    const first = recordedEngineAttachmentNode(a, f.path[0]!.id), second = recordedEngineAttachmentNode(a, f.path[1]!.id);
    const foreign = recordedEngineAttachmentNode(b, f.path[1]!.id);
    expect(sameRecordedEngineAttachmentSource(first, f.path[0]!.id, second, f.path[1]!.id)).toBe(true);
    expect(sameRecordedEngineAttachmentSource(first, f.path[0]!.id, foreign, f.path[1]!.id)).toBe(false);
    expect(() => readRecordedEngineAttachmentNode({ ...first } as never, f.path[0]!.id)).toThrow();
    expect(() => readRecordedEngineAttachments(first as never)).toThrow();
    expect(collectRecordedEngineEdge(second, f.path[1]!.id).payload.beforeNodeId).toBe(f.path[0]!.id);
    expect(() => collectRecordedEngineEdge(first, f.path[1]!.id)).toThrow(/original occurrence/u);
    cancelRecordedEngineAttachmentCollection(a); cancelRecordedEngineAttachmentCollection(b);
  });

  it("does not inspect a later corrupt modern report before its original subject is acquired", () => {
    const f = fixture(); f.delivery(0); f.attach(1, modern(null)); f.delivery(1);
    const work = beginRecordedEngineAttachmentCollection({ boundary: f.boundary() });
    expect(advanceRecordedEngineAttachmentCollection(work).nodeId).toBe(f.path[0]!.id);
    const root = recordedEngineAttachmentNode(work, f.path[0]!.id);
    expect(readRecordedEngineAttachmentNode(root, f.path[0]!.id).row.selected).not.toBeNull();
    expect(() => advanceRecordedEngineAttachmentCollection(work)).toThrow();
    expect(cancelRecordedEngineAttachmentCollection(work)).toBe(false);
    expect(() => finishRecordedEngineAttachmentCollection(work)).toThrow(/retired/u);
  });

  it("retires stale, failed, cancelled or forged work without acquiring another original node", () => {
    const f = fixture(), work = beginRecordedEngineAttachmentCollection({ boundary: f.boundary() });
    advanceRecordedEngineAttachmentCollection(work);
    const source = recordedEngineAttachmentNode(work, f.path[0]!.id), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      f.attach(0, legacy());
      expect(() => advanceRecordedEngineAttachmentCollection(work)).toThrow(/no longer/u);
      expect(() => readRecordedEngineAttachmentNode(source, f.path[0]!.id)).toThrow(/no longer/u);
      expect(dispatch).not.toHaveBeenCalled(); expect(cancelRecordedEngineAttachmentCollection(work)).toBe(false);
      const cancelled = beginRecordedEngineAttachmentCollection({ boundary: f.boundary() });
      expect(cancelRecordedEngineAttachmentCollection(cancelled)).toBe(true);
      for (const invalid of [cancelled, { ...cancelled }]) expect(() => advanceRecordedEngineAttachmentCollection(invalid as never)).toThrow(/foreign or retired/u);
    } finally { dispatch.mockRestore(); }
  });

  it("checks actual storage after a staged factory and refuses publication of that node", () => {
    const f = fixture(), work = beginRecordedEngineAttachmentCollection({ boundary: f.boundary() }), original = routes.invokeEvidenceValueRoute;
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((...args: Parameters<typeof original>) => {
      const result = original(...args); f.attach(0, legacy()); return result;
    }) as typeof original);
    try {
      expect(() => advanceRecordedEngineAttachmentCollection(work)).toThrow(/no longer/u);
      expect(() => recordedEngineAttachmentNode(work, f.path[0]!.id)).toThrow(/retired/u);
    } finally { dispatch.mockRestore(); }
  });
  it("D3935 preserves every position/head check without rehashing the same immutable event stream", () => {
    const f = fixture(), source = f.collect(), image = readRecordedEngineAttachments(source);
    const digests = vi.spyOn(contracts, "evidenceDigest");
    try {
      for (const row of image.rows) routes.assertRecordedPositionInvocation(row.position, image.boundary.run, row.position.payload.nodeId);
      expect(digests.mock.calls.filter(([value]) => value === image.boundary.run.events)).toHaveLength(0);
    } finally { digests.mockRestore(); }
  });

  it("D3935 rehashes mutable events even beneath a frozen run envelope", () => {
    const f = fixture(), run = Object.freeze(structuredClone(f.current())), node = run.nodes[0]!;
    const position = routes.invokeEvidenceValueRoute("run.record.position@1", { run, nodeId: node.id });
    routes.assertRecordedPositionInvocation(position, run, node.id);
    Object.assign(run.events[0]!, { at: "2026-11-02T00:00:00.000Z" });
    expect(() => routes.assertRecordedPositionInvocation(position, run, node.id)).toThrow(/original/u);
  });

  it("D3935 shares the original position factory's immutable event identity without rehashing each node", () => {
    const f = fixture(), attachments = f.collect(), image = readRecordedEngineAttachments(attachments);
    const digests = vi.spyOn(contracts, "evidenceDigest");
    try {
      for (const row of image.rows) readRecordedEngineNode({ attachments, nodeId: row.position.payload.nodeId, offline: null, pending: null });
      expect(digests.mock.calls.filter(([value]) => value === image.boundary.run.events)).toHaveLength(0);
      f.attach(0, legacy());
      expect(() => readRecordedEngineNode({ attachments, nodeId: image.rows[0]!.position.payload.nodeId, offline: null, pending: null })).toThrow(/no longer/u);
    } finally { digests.mockRestore(); }
  });

  it("validates immutable original attachment membership once but still checks changed live storage", () => {
    const f = fixture(); f.delivery(1);
    const source = f.collect(), memberships = vi.spyOn(routes, "assertRecordedPositionInvocation");
    try {
      const first = readRecordedEngineAttachments(source);
      expect(readRecordedEngineAttachments(source)).toBe(first);
      expect(memberships).not.toHaveBeenCalled();
      f.attach(0, legacy());
      expect(() => readRecordedEngineAttachments(source)).toThrow(/no longer/u);
    } finally { memberships.mockRestore(); }
  });
  for (const side of ["white", "black"] as const) it(`acquires only the actual incoming ${side} edge through the registered dispatcher`, () => {
    const f = fixture(side), source = f.collect(1), image = readRecordedEngineAttachments(source);
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      const edge = collectRecordedEngineEdge(source, f.path[1]!.id);
      expect(invoke).toHaveBeenCalledExactlyOnceWith("run.record.edge@1", { run: image.boundary.run,
        parent: image.boundary.path[0]!.node, child: image.boundary.path[1]!.node });
      expect(edge.projection).toEqual({ id: "run.record.edge", version: 1 });
      expect(edge.payload).toMatchObject({ beforeNodeId: f.path[0]!.id, afterNodeId: f.path[1]!.id,
        beforeFen: f.path[0]!.fen, afterFen: f.path[1]!.fen, moveUci: f.path[1]!.moveUci });
    } finally { invoke.mockRestore(); }
  });

  it("refuses root, suffix, foreign and stale edge sources before dispatch, even with no readings", () => {
    const f = fixture(), source = f.collect(1), invoke = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      expect(() => collectRecordedEngineEdge(source, f.path[0]!.id)).toThrow();
      expect(() => collectRecordedEngineEdge(source, f.path[2]!.id)).toThrow();
      expect(() => collectRecordedEngineEdge({ ...source } as RecordedEngineAttachments, f.path[1]!.id)).toThrow();
      f.attach(0, legacy()); expect(() => collectRecordedEngineEdge(source, f.path[1]!.id)).toThrow();
      expect(invoke).not.toHaveBeenCalled();
    } finally { invoke.mockRestore(); }
  });

  it("revalidates the original storage after edge dispatch and before publishing its value", () => {
    const f = fixture(), source = f.collect(1), original = routes.invokeEvidenceValueRoute;
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: unknown) => {
      const value = original(route as never, input as never); f.attach(0, legacy()); return value;
    }) as typeof original);
    try { expect(() => collectRecordedEngineEdge(source, f.path[1]!.id)).toThrow(/no longer/u); }
    finally { invoke.mockRestore(); }
  });

  for (const side of ["white", "black"] as const) for (const bound of [{ kind: "depth", requestedDepth: 12 }, { kind: "movetime", requestedMs: 100 }, { kind: "nodes", requestedNodes: 2048 }] as const) {
    it(`retains exact White-POV delivery, requested ${bound.kind} and actual event occurrence for ${side}`, () => {
      const f = fixture(side); f.delivery(0, "cp 20", bound); f.delivery(1, "mate -3", bound);
      const source = f.collect(), data = readRecordedEngineAttachments(source);
      expect(data.rows).toHaveLength(f.path.length);
      for (const [index, row] of data.rows.entries()) {
        expect(row.position.payload).toEqual({ nodeId: f.path[index]!.id, ply: f.path[index]!.ply, fen: f.path[index]!.fen });
        if (index > 1) { expect(row.selected).toBeNull(); expect(row.occurrences).toEqual([]); continue; }
        const selected = row.selected!; expect(selected.occurrence).toBe(row.occurrences[0]);
        expect(data.boundary.run.events[selected.occurrence.eventOrdinal]).toBe(selected.occurrence.event);
        expect(selected.occurrence.event.seq).toBe(selected.occurrence.eventOrdinal + 1);
        expect(selected.point.payload.position).toBe(row.position); expect(selected.point.payload.evaluation).toBe(selected.occurrence.evaluation);
        const input = readReviewPointInvocation(selected.point); expect(input.position).toBe(row.position); expect(input.evaluation).toBe(selected.occurrence.evaluation);
        const delivery = selected.occurrence.evaluation.payload;
        expect(delivery.payload.bound).toMatchObject(bound); expect(delivery.acquisition.generation).toBe(1);
        expect(delivery.acquisition.actualIdentity.version).toBe("19"); expect(delivery.payload.perspective).toBe("white");
        expect(delivery.payload.score).toEqual(index === 0 ? { kind: "centipawns", value: 20 } : { kind: "mate", side: "white", distance: 3, unit: "moves" });
      }
      expect(readRecordedEngineAttachments(source)).toBe(data); expect(Object.isFrozen(data.rows[0]!.occurrences)).toBe(true);
    });
  }

  it("keeps all equal-valued original attachments and selects the latest modern, not later scalars", () => {
    const f = fixture(); f.attach(1, legacy(1)); const delivery = f.delivery(1); f.attach(1, legacy(999));
    f.attach(1, modern(serializeProviderDelivery("stockfish.position_evaluation@1", delivery))); f.attach(1, legacy(-999));
    const data = readRecordedEngineAttachments(f.collect()), row = data.rows[1]!;
    expect(row.occurrences.map(item => item.kind)).toEqual(["legacy", "modern", "legacy", "modern", "legacy"]);
    expect(row.selected!.occurrence).toBe(row.occurrences[3]); expect(row.selected!.point.payload.evaluation.payload.payload.score).toEqual({ kind: "centipawns", value: -20 });
    const a = row.occurrences[1]!, b = row.occurrences[3]!;
    if (a.kind !== "modern" || b.kind !== "modern") throw Error("two modern occurrences");
    expect(a.evaluation.payload).toEqual(b.evaluation.payload); expect(a.evaluation).not.toBe(b.evaluation);
    expect(a.event.seq).not.toBe(b.event.seq); expect(row.occurrences[4]!.eventOrdinal).toBeGreaterThan(b.eventOrdinal);
  });

  it("keeps legacy-only and wholly absent nodes distinct without inventing pending/offline evidence", () => {
    const f = fixture(); f.attach(1, legacy()); const spy = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      const data = readRecordedEngineAttachments(f.collect()); expect(data.rows[0]!.occurrences).toEqual([]); expect(data.rows[1]!.occurrences).toHaveLength(1);
      expect(data.rows.every(row => row.selected === null)).toBe(true);
      expect(spy.mock.calls.every(call => call[0] === "run.record.position@1")).toBe(true);
    } finally { spy.mockRestore(); }
  });

  it.each([null, {}, "bad", false])("refuses explicitly malformed modern input instead of older valid or later scalar fallback: %j", bad => {
    const f = fixture(); f.delivery(1); f.attach(1, modern(bad)); f.attach(1, legacy()); expect(() => f.collect()).toThrow();
  });

  it("does not silently rescue an earlier corrupt modern occurrence using a later valid one", () => {
    const f = fixture(); f.attach(1, modern(null)); f.delivery(1); expect(() => f.collect()).toThrow();
  });

  it("refuses the wrong provider operation at the actual attachment", () => {
    const f = fixture(), node = f.path[0]!; f.attach(0, modern(serializeProviderDelivery("stockfish.principal_variation@1", lineDelivery(node.fen, ["e2e4"]))));
    expect(() => f.collect()).toThrow(/not stockfish.position_evaluation/u);
  });

  it.each(["payload", "response", "engine", "generation", "request", "parser"] as const)("re-derives the whole persisted chain and refuses altered %s", fault => {
    const f = fixture(), stored = structuredClone(serializeProviderDelivery("stockfish.position_evaluation@1", evaluationDelivery(f.path[1]!.fen, "cp 20")));
    if (fault === "payload") (stored.payloadReceipt as Record<string, unknown>).payloadDigest = `sha256:${"0".repeat(64)}`;
    else if (fault === "response") (stored.response as { bodyBase64: string }).bodyBase64 = "Y29ycnVwdA==";
    else if (fault === "engine") (stored.acquisition.actualIdentity as { version: string }).version = "foreign";
    else if (fault === "generation") (stored.acquisition as Record<string, unknown>).generation = 0;
    else if (fault === "request") ((stored.acquisition.requestedIdentity as { request: { bound: unknown } }).request).bound = { kind: "nodes", requestedNodes: 9999 };
    else (stored.payloadReceipt as Record<string, unknown>).parser = { id: "foreign", version: 1 };
    f.delivery(1); f.attach(1, modern(stored)); expect(() => f.collect()).toThrow();
  });

  it.each(["source", "kind"] as const)("a present modern key cannot be hidden under the wrong %s", fault => {
    const f = fixture(), payload = modern(serializeProviderDelivery("stockfish.position_evaluation@1", evaluationDelivery(f.path[1]!.fen, "cp 20")));
    f.attach(1, { ...payload, ...(fault === "source" ? { source: "human_model_predicted" as const } : { kind: "bestline" as const }) });
    expect(() => f.collect()).toThrow(/invalid kind\/source/u);
  });

  it("requires the exact full FEN, not just a matching position or transposition key", () => {
    const f = fixture(), fen = f.path[0]!.fen.replace(" 0 1", " 1 1");
    f.attach(0, modern(serializeProviderDelivery("stockfish.position_evaluation@1", evaluationDelivery(fen, "cp 20"))));
    expect(() => f.collect()).toThrow(/exact full FEN/u);
  });

  it("cannot borrow a same-node-id or equal-FEN occurrence from a different source", () => {
    const f = fixture(), g = fixture(); f.delivery(1); g.delivery(1);
    const foreign = readRecordedEngineAttachments(g.collect()).rows[1]!.selected!, original = routes.invokeEvidenceValueRoute;
    const spy = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: unknown) => route === "derived.review.eval_point@1" ? { kind: "available", value: foreign.point } : original(route as never, input as never)) as typeof original);
    try { expect(() => f.collect()).toThrow(/original factory invocation/u); } finally { spy.mockRestore(); }
  });

  it("refuses a genuine foreign provider source even when all delivery bytes and FEN match", () => {
    const f = fixture(), g = fixture(); f.delivery(1); g.delivery(1);
    const foreign = readRecordedEngineAttachments(g.collect()).rows[1]!.selected!.occurrence.evaluation, original = routes.invokeEvidenceValueRoute;
    const spy = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: unknown) => route === "live.stockfish.position_eval@1" ? foreign : original(route as never, input as never)) as typeof original);
    try { expect(() => f.collect()).toThrow(/original parsed delivery/u); } finally { spy.mockRestore(); }
  });

  it("retains a valid point independently of missing or differently instrumented adjacent nodes", () => {
    const f = fixture(); f.delivery(1, "cp 20", { kind: "depth", requestedDepth: 12 }); f.delivery(2, "cp 30", { kind: "nodes", requestedNodes: 300 });
    const rows = readRecordedEngineAttachments(f.collect()).rows;
    expect(rows.map(row => row.selected !== null)).toEqual([false, true, true, false, false]);
    expect(rows[1]!.selected!.occurrence.evaluation.payload.payload.bound.kind).toBe("depth"); expect(rows[2]!.selected!.occurrence.evaluation.payload.payload.bound.kind).toBe("nodes");
    expect(rows[1]!.selected!.point.payload.position).toBe(rows[1]!.position);
  });

  it("restricts acquisition to the genuine earlier grant while retaining the complete original head", () => {
    const f = fixture(); f.delivery(1); f.attach(4, modern(null)); const source = f.collect(1), data = readRecordedEngineAttachments(source);
    expect(data.rows).toHaveLength(2); expect(data.boundary.run.events).toEqual(f.current().events); expect(data.rows[1]!.selected).not.toBeNull();
    expect(() => f.collect(4)).toThrow();
  });

  it("keeps root-only and no-result prefixes genuine, and refuses copied handles/overrides", () => {
    const f = fixture("white", []), boundary = f.boundary(), source = collectRecordedEngineAttachments({ boundary });
    expect(readRecordedEngineAttachments(source).rows).toHaveLength(1); expect(readRecordedEngineAttachments(source).rows[0]!.selected).toBeNull();
    for (const bad of [{ ...source }, readRecordedEngineAttachments(source), {}]) expect(() => readRecordedEngineAttachments(bad as never)).toThrow(/not issued/u);
    for (const input of [{ boundary: { ...boundary } }, { boundary, readings: [] }, { boundary, nodeId: "chosen" }]) expect(() => collectRecordedEngineAttachments(input as never)).toThrow();
  });

  it("retains a valid different generation instead of pretending this primitive compares pairs", () => {
    const f = fixture(), delivery = evaluationDelivery(f.path[1]!.fen, "cp 20", { generation: 100 });
    f.attach(1, modern(serializeProviderDelivery("stockfish.position_evaluation@1", delivery)));
    expect(readRecordedEngineAttachments(f.collect()).rows[1]!.selected!.occurrence.evaluation.payload.acquisition.generation).toBe(100);
  });

  it("does not invent an engine point for a legally reached terminal endpoint", () => {
    const f = recordedLastLevelFixture("white", "*", "terminal-no-engine", ["f2f3", "e7e5", "g2g4", "d8h4"]), spy = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      const data = readRecordedEngineAttachments(collectRecordedEngineAttachments({ boundary: f.boundary() }));
      expect(data.rows).toHaveLength(5); expect(data.rows[4]!.selected).toBeNull(); expect(spy.mock.calls.map(call => call[0])).toEqual(Array(5).fill("run.record.position@1"));
    } finally { spy.mockRestore(); }
  });

  it("captures the original boundary handle rather than re-reading the caller wrapper", () => {
    const f = fixture(), boundary = f.boundary(), replacement = f.boundary(), input = { boundary }, original = routes.invokeEvidenceValueRoute;
    const spy = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, args: unknown) => { input.boundary = replacement; return original(route as never, args as never); }) as typeof original);
    try {
      const data = readRecordedEngineAttachments(collectRecordedEngineAttachments(input));
      expect(input.boundary).toBe(replacement); expect(data.boundary).toBe(readRecordedEngineAttachments(collectRecordedEngineAttachments({ boundary })).boundary);
      expect(data.boundary).not.toBe(readRecordedEngineAttachments(collectRecordedEngineAttachments({ boundary: replacement })).boundary);
    } finally { spy.mockRestore(); }
  });

  it("refuses an invalid complete original snapshot before source dispatch", () => {
    const f = fixture(), run = structuredClone(f.current()); (run.nodes.at(-1)! as { fen: string }).fen = "corrupt original suffix"; f.setRun(run);
    const spy = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try { expect(() => f.collect(0)).toThrow(); expect(spy).not.toHaveBeenCalled(); } finally { spy.mockRestore(); }
  });

  it.each(["symbol", "hidden", "getter"] as const)("refuses non-data or extra constructor fields before work: %s", kind => {
    const f = fixture(), boundary = f.boundary(), input = { boundary }, get = vi.fn(() => boundary), spy = vi.spyOn(routes, "invokeEvidenceValueRoute");
    if (kind === "symbol") Object.defineProperty(input, Symbol("override"), { value: [] });
    else if (kind === "hidden") Object.defineProperty(input, "readings", { value: [] });
    else Object.defineProperty(input, "boundary", { enumerable: true, get });
    try { expect(() => collectRecordedEngineAttachments(input)).toThrow(/exactly/u); expect(get).not.toHaveBeenCalled(); expect(spy).not.toHaveBeenCalled(); } finally { spy.mockRestore(); }
  });

  it("rechecks current storage at publication and after cached/original readback without new dispatch", () => {
    const f = fixture(); f.delivery(1); const source = f.collect(), spy = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try { readRecordedEngineAttachments(source); expect(spy).not.toHaveBeenCalled(); f.attach(0, legacy()); expect(() => readRecordedEngineAttachments(source)).toThrow(/no longer/u); } finally { spy.mockRestore(); }
    const g = fixture(), original = routes.invokeEvidenceValueRoute;
    const mutate = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: unknown) => { const result = original(route as never, input as never); g.attach(0, legacy()); return result; }) as typeof original);
    try { expect(() => g.collect()).toThrow(/no longer/u); } finally { mutate.mockRestore(); }
  });
});
