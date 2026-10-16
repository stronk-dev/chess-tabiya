import { describe, expect, it, vi } from "vitest";
import { attachEvidence } from "./evidence.js";
import { collectRecordedEngineAttachments, readRecordedEngineAttachments } from "./internal/recorded-engine-attachments.js";
import * as routes from "./internal/evidence-value-routes.js";
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
