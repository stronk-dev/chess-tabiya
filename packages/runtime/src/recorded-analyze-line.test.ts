import { afterEach, describe, expect, it, vi } from "vitest";
import { attachEvidence } from "./evidence.js";
import * as routes from "./internal/evidence-value-routes.js";
import * as providers from "./provider-exchange.js";
import { branchPath } from "./branch-path.js";
import { evidenceValueReceipt } from "./evidence-contract.js";
import { serializeProviderDelivery } from "./provider-exchange.js";
import { collectRecordedAnalyzeLine, readRecordedAnalyzeLineSource, selectRecordedAnalyzeMetadata } from "./recorded-analyze-line.js";
import { fork, rewind } from "./runtime.js";
import { attachDelivery, evaluationDelivery, importedRun, lineDelivery, mainPath, play, REVIEW_AT, START_FEN } from "./testing/review-evidence-fixture.js";
import type { DrillRun, EvidencePayload } from "./types.js";

const signal = () => new AbortController().signal;
afterEach(() => vi.restoreAllMocks());
function report(run: DrillRun, parent: string, kind: "bestline" | "eval", values: Readonly<Record<string, unknown>>) {
  return attachEvidence(run, parent, ["recorded:analyze-test"], { kind, source: "engine_validated", values } as EvidencePayload, REVIEW_AT).run;
}
function fixture(side: "white" | "black" = "white") {
  const rootFen = side === "white" ? START_FEN : "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
  const run = play(importedRun(`recorded-analyze-${side}`, side, rootFen), side === "white" ? ["e2e4", "e7e5", "g1f3"] : ["e7e5", "g1f3", "b8c6"]);
  const path = mainPath(run);
  return { run, path, branch: run.activeCursor.branchId, parent: path[0]!, child: path[1]!,
    pv: side === "white" ? ["d2d4", "d7d5", "c2c4"] : ["c7c5", "g1f3", "d7d6"] };
}
function collect(run: DrillRun, branch: string, node: string) {
  return readRecordedAnalyzeLineSource(collectRecordedAnalyzeLine(run, branch, node, signal()));
}

describe("accepted original recorded Analyze source, before API/presentation cutover", () => {
  it.each(["white", "black"] as const)("selects exact original metadata without a single evidence factory or capture parser: %s", side => {
    const f = fixture(side);
    let run = report(f.run, f.parent.id, "eval", { bestMoveUci: f.pv[0] });
    run = report(run, f.parent.id, "bestline", { movesUci: f.pv });
    run = report(run, f.parent.id, "eval", { providerLineDelivery: null });
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute"), parse = vi.spyOn(providers, "parsePersistedProviderDelivery");
    const original = JSON.stringify(run), selected = selectRecordedAnalyzeMetadata(run, f.branch, f.child.id, signal());
    expect(selected.sourceArm).toBe("typed_pv"); expect(selected.ordinal).toBe(run.events.length - 1);
    expect(selected.event).toBe(selected.run.events[selected.ordinal!]);
    expect(selected.parent.id).toBe(f.parent.id); expect(selected.reviewed.id).toBe(f.child.id);
    expect(dispatch).not.toHaveBeenCalled(); expect(parse).not.toHaveBeenCalled();
    expect(JSON.stringify(run)).toBe(original);
    const data = collect(run, f.branch, f.child.id);
    expect(data.sourceArm).toBe("typed_pv"); expect(data.outcome.kind).toBe("failed");
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it("metadata absence performs no factory work and a later collection independently reselects current original events", () => {
    const f = fixture(), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute"), parse = vi.spyOn(providers, "parsePersistedProviderDelivery");
    expect(selectRecordedAnalyzeMetadata(f.run, f.branch, f.child.id, signal())).toMatchObject({ sourceArm: null, ordinal: null, event: null });
    expect(dispatch).not.toHaveBeenCalled(); expect(parse).not.toHaveBeenCalled();
    const historical = report(f.run, f.parent.id, "bestline", { movesUci: f.pv, engineId: "saved", requestedDepth: 10 });
    expect(selectRecordedAnalyzeMetadata(historical, f.branch, f.child.id, signal()).sourceArm).toBe("recorded_bestline");
    const changed = report(historical, f.parent.id, "eval", { providerLineDelivery: null });
    const data = collect(changed, f.branch, f.child.id);
    expect(data.sourceArm).toBe("typed_pv"); expect(data.ordinal).toBe(changed.events.length - 1);
    expect(data.outcome.kind).toBe("failed");
  });
  it.each(["white", "black"] as const)("retains a genuine typed-only original eval occurrence and whole bounded line: %s", side => {
    const f = fixture(side), before = JSON.stringify(f.run);
    const run = attachDelivery(f.run, f.parent.id, evaluationDelivery(f.parent.fen, "cp 20"), lineDelivery(f.parent.fen, f.pv, { maxPlies: 2 }));
    const original = JSON.stringify(run), data = collect(run, f.branch, f.child.id);
    expect(data.outcome).toEqual({ kind: "available", collected: 1 });
    expect(data.sourceArm).toBe("typed_pv"); expect(data.event?.data.payload.kind).toBe("eval");
    expect(data.ordinal).toBe(run.events.length - 1); expect(data.event).toBe(data.run.events[data.ordinal!]);
    expect(data.inputs).toEqual([data.edge, data.packet, data.typed]);
    expect(data.inputs.map(value => `${value.projection.id}@${value.projection.version}`))
      .toEqual(["run.record.edge@1", "recorded.inspector.eval_packet@1", "live.stockfish.principal_variation@1"]);
    expect(data.typed!.payload.payload.fen).toBe(f.parent.fen);
    expect(data.operands).toMatchObject({ kind: "line", sourceArm: "typed_pv", reviewedMove: { fullmove: 1, side },
      engine: { id: "stockfish-analysis" }, bound: { kind: "movetime", requestedMs: 100 },
      lineScope: { kind: "typed_request", maxPlies: 2, truncated: true } });
    if (data.operands?.kind !== "line") throw new Error("Expected recorded line");
    expect(data.operands.line).toHaveLength(2);
    expect(data.operands.line.map(move => move.san)).toEqual(side === "white" ? ["d4", "d5"] : ["c5", "Nf3"]);
    expect(data.operands.line.map(move => [move.fullmove, move.side])).toEqual(side === "white" ? [[1, "white"], [1, "black"]] : [[1, "black"], [2, "white"]]);
    expect(evidenceValueReceipt(data.typed!).factory).toBe("createLiveStockfishPrincipalVariationV1Evidence");
    expect(JSON.stringify(run)).toBe(original); expect(JSON.stringify(f.run)).toBe(before);
  });

  it.each(["white", "black"] as const)("keeps original historical bestline and first-move sources distinct: %s", side => {
    const f = fixture(side);
    const firstRun = report(f.run, f.parent.id, "eval", { bestMoveUci: f.pv[0], engineId: "saved-engine", requestedDepth: 12 });
    const first = collect(firstRun, f.branch, f.child.id);
    expect(first.operands).toMatchObject({ kind: "line", sourceArm: "recorded_search_first", engine: { id: "saved-engine", name: null, version: null }, bound: { kind: "depth", requestedDepth: 12 }, lineScope: { kind: "recorded_report" } });
    if (first.operands?.kind !== "line") throw new Error("Expected saved search first move");
    expect(first.operands.line).toHaveLength(1);
    const run = report(firstRun, f.parent.id, "bestline", { movesUci: f.pv, engineId: "saved-pv", requestedNodes: 300 });
    const best = collect(run, f.branch, f.child.id);
    expect(best.operands).toMatchObject({ kind: "line", sourceArm: "recorded_bestline", engine: { id: "saved-pv", name: null, version: null }, bound: { kind: "nodes", requestedNodes: 300 } });
    expect(best.inputs.map(value => `${value.projection.id}@${value.projection.version}`)).toEqual(["run.record.edge@1", "recorded.inspector.pv_packet@1"]);
    if (best.operands?.kind !== "line") throw new Error("Expected original bestline");
    expect(best.operands.line).toHaveLength(3);
  });

  it.each([null, {}, "corrupt"])("never falls back from a present invalid typed capture: %j", invalid => {
    const f = fixture();
    let run = report(f.run, f.parent.id, "bestline", { movesUci: f.pv, engineId: "older-bestline", requestedDepth: 10 });
    run = attachDelivery(run, f.parent.id, evaluationDelivery(f.parent.fen, "cp 20"), lineDelivery(f.parent.fen, f.pv));
    run = report(run, f.parent.id, "eval", { providerLineDelivery: invalid, bestMoveUci: "d2d4", engineId: "weaker-first", requestedDepth: 9 });
    const data = collect(run, f.branch, f.child.id);
    expect(data.sourceArm).toBe("typed_pv"); expect(data.ordinal).toBe(run.events.length - 1);
    expect(data.outcome).toEqual({ kind: "failed", reason: "source_contract_invalid" });
    expect(data.operands).toBeNull(); expect(data.typed).toBeNull(); expect(data.packet).not.toBeNull();
  });

  it("rejects a genuine typed capture from a different parent without using an older line", () => {
    const f = fixture();
    let run = report(f.run, f.parent.id, "bestline", { movesUci: f.pv, engineId: "older", requestedDepth: 10 });
    run = report(run, f.parent.id, "eval", { providerLineDelivery: serializeProviderDelivery("stockfish.principal_variation@1", lineDelivery(f.path[1]!.fen, ["c7c5", "g1f3"])) });
    const data = collect(run, f.branch, f.child.id);
    expect(data.outcome.kind).toBe("failed"); expect(data.operands).toBeNull();
  });

  it.each(["bad-suffix", "missing-array", "bad-first"])("fails the selected malformed original historical occurrence without a prefix or fallback: %s", kind => {
    const f = fixture();
    let run = report(f.run, f.parent.id, "eval", { bestMoveUci: "d2d4", engineId: "older-first", requestedDepth: 10 });
    run = report(run, f.parent.id, "bestline", { movesUci: f.pv, engineId: "older-pv", requestedDepth: 10 });
    if (kind === "bad-first") {
      // No bestline arm in this population: test an actual selected malformed eval-first token.
      run = report(f.run, f.parent.id, "eval", { bestMoveUci: "not-a-move", engineId: "saved", requestedDepth: 10 });
    } else run = report(run, f.parent.id, "bestline", { ...(kind === "bad-suffix" ? { movesUci: ["d2d4", "d7d5", "a1a8"] } : {}), engineId: "bad-pv", requestedDepth: 10 });
    const data = collect(run, f.branch, f.child.id);
    expect(data.outcome.kind).toBe("failed"); expect(data.operands).toBeNull();
  });

  it("distinguishes genuine historical completed-empty from absence and never falls back", () => {
    const f = fixture(), absent = collect(f.run, f.branch, f.child.id);
    expect(absent.outcome).toEqual({ kind: "unavailable", reason: "source_absent" }); expect(absent.ordinal).toBeNull();
    let run = report(f.run, f.parent.id, "bestline", { movesUci: f.pv, engineId: "older", requestedDepth: 10 });
    run = report(run, f.parent.id, "bestline", { movesUci: [] });
    const empty = collect(run, f.branch, f.child.id);
    expect(empty.outcome).toEqual({ kind: "no_witness" }); expect(empty.packet).not.toBeNull();
    expect(empty.event?.data.payload.values.movesUci).toEqual([]); expect(empty.operands).toBeNull();
  });

  it.each([
    [{ requestedDepth: 12 }, "engine_unusable"],
    [{ engineId: "saved" }, "bound_unusable"],
    [{}, "engine_and_bound_unusable"],
  ] as const)("retains truthful attribution abstention with no public move operands: %j", (values, reason) => {
    const f = fixture(), run = report(f.run, f.parent.id, "bestline", { ...values, movesUci: f.pv });
    const data = collect(run, f.branch, f.child.id);
    expect(data.outcome.kind).toBe("available");
    expect(data.operands).toEqual({ kind: "unattributed", sourceArm: "recorded_bestline", reviewedMove: { fullmove: 1, side: "white", san: "e4" }, reason });
  });

  it.each([
    [{ requestedMovetimeMs: 100, requestedDepth: 12, requestedNodes: 30 }, { kind: "movetime", requestedMs: 100 }],
    [{ requestedMovetimeMs: "bad", requestedDepth: 12, requestedNodes: 30 }, { kind: "depth", requestedDepth: 12 }],
    [{ requestedMovetimeMs: 0, requestedDepth: -1, requestedNodes: 30 }, { kind: "nodes", requestedNodes: 30 }],
  ])("selects the first usable positive safe bound without manufacturing attribution: %j", (values, expected) => {
    const f = fixture(), run = report(f.run, f.parent.id, "bestline", { ...values, movesUci: f.pv, engineId: "saved" });
    expect(collect(run, f.branch, f.child.id).operands).toMatchObject({ kind: "line", bound: expected });
  });

  it("refuses copied/JSON/prototype/data wrappers instead of accepting equal source values", () => {
    const f = fixture(), source = collectRecordedAnalyzeLine(f.run, f.branch, f.child.id, signal());
    for (const fake of [{ ...source }, JSON.parse(JSON.stringify(source)), Object.create(source), readRecordedAnalyzeLineSource(source), null]) {
      expect(() => readRecordedAnalyzeLineSource(fake)).toThrow("original recorded source invocation");
    }
  });

  it("rejects wrong/root nodes, cancelled requests and a broken original suffix", () => {
    const f = fixture();
    for (const node of [f.parent.id, "absent"]) expect(() => collect(f.run, f.branch, node)).toThrow();
    const controller = new AbortController(), reason = new Error("retired"); controller.abort(reason);
    expect(() => collectRecordedAnalyzeLine(f.run, f.branch, f.child.id, controller.signal)).toThrow(reason);
    const broken = structuredClone(f.run); (broken.nodes.at(-1)! as { fen: string }).fen = START_FEN;
    expect(() => collect(broken, f.branch, f.child.id)).toThrow("FEN disagrees with legal replay");
  });

  it("retains an inherited original parent while withholding only the exact open retry entry", () => {
    const f = fixture();
    let run = report(f.run, f.parent.id, "bestline", { movesUci: f.pv, engineId: "saved", requestedDepth: 10 });
    run = fork(rewind(run, f.child.id, REVIEW_AT, undefined, f.branch).run, f.child.id, { at: REVIEW_AT, label: "story-reentry" }).run;
    const retry = run.activeCursor.branchId;
    run = play(run, ["c7c5", "g1f3"]);
    expect(() => collect(run, f.branch, f.path[2]!.id)).toThrow("open retry entry");
    expect(collect(run, retry, f.child.id).parent.id).toBe(f.parent.id);
    expect(collect(run, f.branch, f.child.id).parent.id).toBe(f.parent.id);
  });

  it("retains the last original equal-valued attachment occurrence, not a deduplicated payload", () => {
    const f = fixture(), values = { movesUci: f.pv, engineId: "saved", requestedDepth: 12 };
    const firstRun = report(f.run, f.parent.id, "bestline", values);
    const first = collect(firstRun, f.branch, f.child.id);
    const run = report(firstRun, f.parent.id, "bestline", values), latest = collect(run, f.branch, f.child.id);
    expect(latest.ordinal).toBe(run.events.length - 1);
    expect(latest.event).toBe(latest.run.events[latest.ordinal!]);
    expect(latest.packet!.payload.event).toBe(latest.event);
    expect(latest.event!.seq).not.toBe(first.event!.seq);
    expect(latest.packet!.payload.itemDigest).not.toBe(first.packet!.payload.itemDigest);
    expect(latest.operands).toEqual(first.operands);
    expect(latest.inputs).toEqual([latest.edge, latest.packet]);
  });

  it("does not borrow another branch's genuine report at an equal-FEN parent", () => {
    const f = fixture();
    let run = report(f.run, f.path[1]!.id, "bestline", { movesUci: ["c7c5", "g1f3"], engineId: "saved", requestedDepth: 12 });
    run = fork(rewind(run, f.parent.id, REVIEW_AT, undefined, f.branch).run, f.parent.id, { at: REVIEW_AT, label: "same-position-other-occurrence" }).run;
    const sibling = run.activeCursor.branchId;
    run = play(run, ["e2e4", "e7e5"]);
    const path = branchPath(run, sibling);
    expect(path[1]!.fen).toBe(f.path[1]!.fen);
    expect(path[1]!.id).not.toBe(f.path[1]!.id);
    expect(collect(run, f.branch, f.path[2]!.id).outcome.kind).toBe("available");
    const foreign = collect(run, sibling, path[2]!.id);
    expect(foreign.outcome).toEqual({ kind: "unavailable", reason: "source_absent" });
    expect(foreign.packet).toBeNull(); expect(foreign.ordinal).toBeNull();
  });

  it("validates the legal edge on an unrelated branch even when snapshot and event agree", () => {
    const f = fixture();
    let run = fork(rewind(f.run, f.parent.id, REVIEW_AT, undefined, f.branch).run, f.parent.id, { at: REVIEW_AT, label: "unrelated-original" }).run;
    const sibling = run.activeCursor.branchId;
    run = play(run, ["d2d4", "d7d5"]);
    const last = branchPath(run, sibling).at(-1)!, broken = structuredClone(run);
    (broken.nodes.find(node => node.id === last.id)! as { moveSan: string }).moveSan = "e5";
    const event = broken.events.find(event => event.type === "move.committed" && event.data.node.id === last.id)!;
    if (event.type !== "move.committed") throw new Error("Expected original move event");
    (event.data.node as { moveSan: string }).moveSan = "e5";
    expect(() => collect(broken, f.branch, f.child.id)).toThrow("Recorded SAN e5 is not canonical d5");
  });

  it("owns a deeply frozen snapshot without granting access or live currentness to its caller", () => {
    const f = fixture(), run = structuredClone(report(f.run, f.parent.id, "bestline", { movesUci: f.pv, engineId: "saved", requestedDepth: 12 }));
    const originalEvent = run.events.at(-1)!;
    if (originalEvent.type !== "evidence.attached") throw new Error("Expected saved report");
    expect(Object.isFrozen(originalEvent.data.payload.values)).toBe(false);
    const source = collectRecordedAnalyzeLine(run, f.branch, f.child.id, signal()), data = readRecordedAnalyzeLineSource(source);
    const before = JSON.stringify(data), original = JSON.stringify(run);
    expect(Object.isFrozen(data)).toBe(true); expect(Object.isFrozen(data.run)).toBe(true);
    expect(Object.isFrozen(data.event!.data.payload.values)).toBe(true);
    expect(() => { (data.operands as { kind: string }).kind = "forged"; }).toThrow();
    expect(JSON.stringify(run)).toBe(original); // Collection itself writes nothing.
    expect(Object.isFrozen(originalEvent.data.payload.values)).toBe(false);
    const event = run.events.at(-1)!;
    if (event.type !== "evidence.attached") throw new Error("Expected saved report");
    (event.data.payload.values as Record<string, unknown>).movesUci = ["a1a8"];
    expect(JSON.stringify(readRecordedAnalyzeLineSource(source))).toBe(before);
    // This is retained-source isolation only; the future server owner must reject stale storage.
  });

  it.each([
    { name: "white castle", fen: "4k3/8/8/8/8/8/8/4K2R w K - 0 38", side: "white" as const, move: "e1h1", san: "O-O" },
    { name: "black castle", fen: "4k2r/8/8/8/8/8/8/4K3 b k - 0 38", side: "black" as const, move: "e8h8", san: "O-O" },
    { name: "white promotion", fen: "7k/P7/8/8/8/8/8/7K w - - 0 38", side: "white" as const, move: "a7a8n", san: "a8=N" },
    { name: "black promotion", fen: "7k/8/8/8/8/8/p7/7K b - - 0 38", side: "black" as const, move: "a2a1n", san: "a1=N" },
    { name: "white en passant", fen: "7k/8/8/3pP3/8/8/8/K7 w - d6 0 38", side: "white" as const, move: "e5d6", san: "exd6" },
    { name: "black en passant", fen: "k7/8/8/8/3Pp3/8/8/7K b - d3 0 38", side: "black" as const, move: "e4d3", san: "exd3" },
  ])("walks the complete original $name with actual move number and side", value => {
    let run = play(importedRun(`analyze-special-${value.name}`, value.side, value.fen), [value.move]);
    const path = mainPath(run);
    run = report(run, path[0]!.id, "bestline", { movesUci: [value.move], engineId: "saved", requestedDepth: 12 });
    const data = collect(run, run.activeCursor.branchId, path[1]!.id);
    expect(data.operands).toMatchObject({ kind: "line", reviewedMove: { fullmove: 38, side: value.side, san: value.san },
      line: [{ fullmove: 38, side: value.side, san: value.san }] });
  });
});
