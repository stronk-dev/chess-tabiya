import { describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { branchPath } from "./branch-path.js";
import { attachEvidence } from "./evidence.js";
import { evidenceDigest, evidenceValueReceipt } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { createRecordedReviewBoundarySourceOwner, isRecordedReviewBoundary, readRecordedReviewBoundary, type RecordedReviewBoundary } from "./recorded-review-boundary.js";
import { readBackReplay } from "./replay.js";
import { createReviewPrefixAuthority, type ReviewImportRecordImage } from "./review-evidence.js";
import { commitMove, fork, rewind } from "./runtime.js";
import * as semanticPath from "./recorded-semantic-path.js";
import * as structure from "./structure.js";
import { importedRun, play, REVIEW_AT, START_FEN } from "./testing/review-evidence-fixture.js";
import { recordedComparisonFixture } from "./testing/recorded-comparison-fixture.js";
import type { DrillRun } from "./types.js";

const RESULT = "run.record.imported_result@1", CONSEQUENCE = "run.record.consequence@1";
// Independently reproduce the existing server import recipe, not the source's implementation.
function importRecord(run: DrillRun, result: ReviewImportRecordImage["result"]): ReviewImportRecordImage {
  const path = branchPath(run, run.branches[0]!.id);
  return { runId: run.id, result, movetextDigest: `sha256:${createHash("sha256").update(canonicalizeJson({ rootFen: path[0]!.fen, uci: path.slice(1).map(node => node.moveUci) })).digest("hex")}` };
}
function stored(initial: DrillRun, initialRecord?: ReviewImportRecordImage) {
  let run: DrillRun | undefined = initial, record = initialRecord;
  const storage = { loadRun: (id: string) => id === initial.id ? run : undefined, loadImportRecord: () => record };
  return { storage, owner: createRecordedReviewBoundarySourceOwner(storage),
    setRun: (value: DrillRun | undefined) => { run = value; }, setRecord: (value: ReviewImportRecordImage | undefined) => { record = value; } };
}
function request(run: DrillRun, nodeId = run.activeCursor.nodeId, branchId = run.activeCursor.branchId) {
  return { runId: run.id, branchId, throughNodeId: nodeId };
}
function results(boundary: RecordedReviewBoundary) { return invokeEvidenceValueRoute(RESULT, { recordedReview: boundary }); }
function consequences(boundary: RecordedReviewBoundary) { return invokeEvidenceValueRoute(CONSEQUENCE, { recordedReview: boundary }); }

describe("recorded Review boundary source (Review §4.5)", () => {
  it.each(["white", "black"] as const)("keeps every original prefix, absolute occurrence and only the original endpoint result: %s", side => {
    const run = play(importedRun(`prefix-${side}`, side), ["e2e4", "e7e5", "g1f3", "b8c6"]), record = importRecord(run, "0-1");
    const source = stored(run, record), path = branchPath(run, run.activeCursor.branchId), before = JSON.stringify(run), frozen = Object.isFrozen(run);
    for (const [index, node] of path.entries()) {
      const boundary = source.owner.resolve(request(run, node.id)), image = readRecordedReviewBoundary(boundary);
      source.owner.assertCurrent(boundary);
      expect(image.path.map(entry => entry.node.id)).toEqual(path.slice(0, index + 1).map(entry => entry.id));
      expect(image.originalPath.map(entry => entry.node.id)).toEqual(path.map(entry => entry.id));
      expect(image.run).toEqual(run); expect(image.run.events).toHaveLength(run.events.length);
      expect(image.learnerSide).toBe(side); expect(image.eventHead.seq).toBe(run.events.length);
      expect(image.importedMainlineEndNodeId).toBe(path.at(-1)!.id);
      for (const entry of image.path) {
        expect(entry.creationEvent).toEqual(run.events[entry.creationEventOrdinal]);
        expect(entry.creationEvent.seq).toBe(entry.creationEventOrdinal + 1);
      }
      expect(consequences(boundary)).toEqual([]);
      const output = results(boundary);
      if (index === path.length - 1) {
        expect(image.outcome.kind).toBe("recorded_result"); expect(output).toHaveLength(1);
        expect(output[0]).toMatchObject({ nodeId: node.id, plyOffset: node.ply, evidence: { payload: { context: "story", result: "0-1" } } });
        expect(evidenceValueReceipt(output[0]!.evidence).inputDigest).toBe(evidenceDigest({ recordedReview: image }));
        const old = invokeEvidenceValueRoute(RESULT, { run, branchId: run.activeCursor.branchId, recordedResult: "0-1" });
        expect(output.map(item => item.evidence.payload)).toEqual(old.map(item => item.evidence.payload));
      } else {
        expect(image.outcome).toEqual({ kind: "unfinished" }); expect(output).toEqual([]);
      }
    }
    expect(JSON.stringify(run)).toBe(before); expect(Object.isFrozen(run)).toBe(frozen);
  });

  it.each(["white", "black"] as const)("requires the actual on-prefix terminal and learner-relative result: %s", side => {
    const run = play(importedRun(`mate-${side}`, side), ["f2f3", "e7e5", "g2g4", "d8h4"]), source = stored(run, importRecord(run, "0-1"));
    const path = branchPath(run, run.activeCursor.branchId);
    for (const [index, node] of path.entries()) {
      const boundary = source.owner.resolve(request(run, node.id)), image = readRecordedReviewBoundary(boundary);
      expect(results(boundary)).toEqual([]);
      if (index !== path.length - 1) { expect(image.outcome).toEqual({ kind: "unfinished" }); expect(consequences(boundary)).toEqual([]); continue; }
      expect(image.outcome).toMatchObject({ kind: "board_terminal", nodeId: node.id, result: side === "white" ? "loss" : "win" });
      const output = consequences(boundary), old = invokeEvidenceValueRoute(CONSEQUENCE, { run, branchId: run.activeCursor.branchId });
      expect(output).toHaveLength(1); expect(output[0]).toMatchObject({ nodeId: node.id, plyOffset: node.ply });
      expect(output.map(item => item.evidence.payload)).toEqual(old.map(item => item.evidence.payload));
      expect(evidenceValueReceipt(output[0]!.evidence).inputDigest).toBe(evidenceDigest({ recordedReview: image }));
    }
    source.setRecord(importRecord(run, "1-0"));
    expect(() => source.owner.resolve(request(run))).toThrow(/contradicts/u);
    // A contradictory final PGN result is not yet eligible at an earlier prefix.
    expect(readRecordedReviewBoundary(source.owner.resolve(request(run, path[1]!.id))).outcome.kind).toBe("unfinished");
  });

  it("retains actual drawn terminals and successful unfinished results", () => {
    const drawn = play(importedRun("stalemate", "white", "7k/5K2/8/6Q1/8/8/8/8 w - - 0 1"), ["g5g6"]), source = stored(drawn, importRecord(drawn, "1/2-1/2"));
    const boundary = source.owner.resolve(request(drawn));
    expect(readRecordedReviewBoundary(boundary).outcome).toMatchObject({ kind: "board_terminal", result: "draw" });
    expect(consequences(boundary)[0]!.evidence.payload).toEqual({ context: "story", terminal: true, outcome: "draw" });
    expect(results(boundary)).toEqual([]);
    const unfinished = play(importedRun("unfinished"), ["e2e4"]), other = stored(unfinished, importRecord(unfinished, "*"));
    expect(readRecordedReviewBoundary(other.owner.resolve(request(unfinished))).outcome).toEqual({ kind: "unfinished" });
    expect(results(other.owner.resolve(request(unfinished)))).toEqual([]);
  });

  it("permits inherited retry endpoints but never borrows the imported mainline result", () => {
    let run = play(importedRun("retry"), ["e2e4", "e7e5", "g1f3", "b8c6"]);
    const main = run.activeCursor.branchId, path = branchPath(run, main);
    run = fork(rewind(run, path[2]!.id, REVIEW_AT).run, path[2]!.id, { at: REVIEW_AT }).run;
    const peer = run.activeCursor.branchId;
    run = play(run, ["f1c4", "g8f6"]);
    const source = stored(run, importRecord(run, "1-0"));
    for (const node of branchPath(run, peer)) {
      const boundary = source.owner.resolve(request(run, node.id, peer));
      expect(readRecordedReviewBoundary(boundary).outcome).toEqual({ kind: "unfinished" }); expect(results(boundary)).toEqual([]);
    }
    expect(results(source.owner.resolve(request(run, path.at(-1)!.id, main)))).toHaveLength(1);
    expect(() => source.owner.resolve(request(run, path.at(-1)!.id, peer))).toThrow(/not on/u);
  });

  it("does not collect semantic evidence on resolution or repeated currentness checks", () => {
    const run = play(importedRun("no-collection"), ["e2e4", "e7e5"]), source = stored(run, importRecord(run, "1-0"));
    const semantic = vi.spyOn(semanticPath, "recordedSemanticPath"), structural = vi.spyOn(structure, "structuralReading");
    try {
      const boundary = source.owner.resolve(request(run));
      for (let index = 0; index < 3; index++) { source.owner.assertCurrent(boundary); readRecordedReviewBoundary(boundary); }
      expect(semantic).not.toHaveBeenCalled(); expect(structural).not.toHaveBeenCalled();
    } finally { semantic.mockRestore(); structural.mockRestore(); }
  });

  it("rejects copied/raw/serialized/whole-tip handles and cross-issuer reception", () => {
    const run = play(importedRun("issuer"), ["e2e4"]), source = stored(run, importRecord(run, "1-0"));
    const boundary = source.owner.resolve(request(run)), foreign = createRecordedReviewBoundarySourceOwner(source.storage);
    expect(() => foreign.assertCurrent(boundary)).toThrow(/foreign issuer/u);
    expect(() => source.owner.assertCurrent(foreign.resolve(request(run)))).toThrow(/foreign issuer/u);
    const wholeTip = createReviewPrefixAuthority(source.storage)({ runId: run.id, branchId: run.activeCursor.branchId });
    for (const value of [{ ...boundary }, JSON.parse(JSON.stringify(boundary)), run, readRecordedReviewBoundary(boundary), wholeTip]) {
      expect(isRecordedReviewBoundary(value)).toBe(false);
      expect(() => source.owner.assertCurrent(value as never)).toThrow();
      expect(() => readRecordedReviewBoundary(value as never)).toThrow();
      expect(() => results(value as never)).toThrow(); expect(() => consequences(value as never)).toThrow();
    }
  });

  it("captures immutable independent request/run/record images without freezing storage", () => {
    const run = structuredClone(play(importedRun("capture"), ["e2e4", "e7e5"])), record = { ...importRecord(run, "1-0") }, source = stored(run, record);
    const input = request(run, run.nodes[1]!.id), boundary = source.owner.resolve(input), image = readRecordedReviewBoundary(boundary);
    input.throughNodeId = run.activeCursor.nodeId;
    expect(readRecordedReviewBoundary(boundary).request.throughNodeId).toBe(run.nodes[1]!.id);
    expect(Object.isFrozen(run)).toBe(false); expect(Object.isFrozen(run.nodes[0])).toBe(false); expect(Object.isFrozen(record)).toBe(false);
    expect(Object.isFrozen(image.path[0]!.node)).toBe(true); expect(Object.isFrozen(image.originalPath.at(-1)!.creationEvent)).toBe(true);
    record.result = "0-1";
    expect(image.importRecord!.result).toBe("1-0"); expect(() => readRecordedReviewBoundary(boundary)).toThrow(/no longer/u);
    record.result = "1-0";
    (run.nodes.at(-1)! as { fen: string }).fen = "corrupt";
    expect(image.run.nodes.at(-1)!.fen).not.toBe("corrupt"); expect(() => source.owner.assertCurrent(boundary)).toThrow();
  });

  it.each(["result", "movetextDigest", "missing"] as const)("rereads relevant import authority before even an empty result: %s", change => {
    const run = play(importedRun(`change-${change}`), ["e2e4"]), record = importRecord(run, "1-0"), source = stored(run, record);
    const boundary = source.owner.resolve(request(run, run.nodes[0]!.id));
    expect(results(boundary)).toEqual([]);
    source.setRecord(change === "missing" ? undefined : { ...record, [change]: change === "result" ? "0-1" : `sha256:${"e".repeat(64)}` });
    expect(() => source.owner.assertCurrent(boundary)).toThrow(); expect(() => results(boundary)).toThrow(); expect(() => consequences(boundary)).toThrow();
  });

  it("distinguishes same-count event heads even when the selected positions/outcome stay equal", () => {
    const base = play(importedRun("head"), ["e2e4"]);
    const report = (cp: number) => attachEvidence(base, base.activeCursor.nodeId, ["synthetic:head"], { kind: "eval", source: "engine_validated", values: { centipawns: cp } }, REVIEW_AT).run;
    const first = report(10), second = report(11), source = stored(first, importRecord(first, "1-0"));
    const boundary = source.owner.resolve(request(first)), original = results(boundary)[0]!.evidence;
    expect(first.events.length).toBe(second.events.length);
    source.setRun(second);
    expect(() => results(boundary)).toThrow(/no longer/u);
    const next = results(source.owner.resolve(request(second)))[0]!.evidence;
    expect(next.payload).toEqual(original.payload); expect(evidenceValueReceipt(next).inputDigest).not.toBe(evidenceValueReceipt(original).inputDigest);
  });

  it("D3878 refuses legal original-mainline extension rather than moving result eligibility", () => {
    const run = play(importedRun("extended-import"), ["e2e4", "e7e5"]), record = importRecord(run, "1-0"), source = stored(run, record);
    const original = source.owner.resolve(request(run));
    const extended = commitMove(run, "g1f3", { at: REVIEW_AT }).run;
    source.setRun(extended);
    expect(() => source.owner.assertCurrent(original)).toThrow(/movetext/u);
    for (const node of branchPath(extended, extended.activeCursor.branchId)) {
      expect(() => source.owner.resolve(request(extended, node.id))).toThrow(/movetext/u);
    }
  });

  it("refuses missing storage, changed side and changed live graph/path", () => {
    const fixture = recordedComparisonFixture(), source = stored(fixture.run), input = request(fixture.run, fixture.shared.id, fixture.main);
    const boundary = source.owner.resolve(input);
    source.setRun(undefined); expect(() => source.owner.assertCurrent(boundary)).toThrow();
    const changed = fixture.run.events.map(event => event.type === "run.started" ? { ...event, data: { ...event.data, start: { ...event.data.start, side: "black" as const } } } : event);
    source.setRun(readBackReplay(changed).run); expect(() => source.owner.assertCurrent(boundary)).toThrow();
    source.setRun({ ...fixture.run, nodes: [...fixture.run.nodes, fixture.run.nodes[0]!] }); expect(() => source.owner.assertCurrent(boundary)).toThrow();
  });

  it("refuses invalid original later FENs, illegal edges and noncanonical roots before narrowing", () => {
    const fixture = recordedComparisonFixture(), later = fixture.mainPath.at(-1)!.id;
    for (const fen of ["not-a-fen", "8/8/8/8/8/8/8/8 w - - 0 1", START_FEN]) {
      const events = fixture.run.events.map(event => event.type === "move.committed" && event.data.node.id === later ? { ...event, data: { ...event.data, node: { ...event.data.node, fen } } } : event);
      const run = readBackReplay(events).run, source = stored(run);
      expect(() => source.owner.resolve(request(run, fixture.shared.id, fixture.main))).toThrow();
    }
    const root = importedRun("noncanonical");
    const events = root.events.map(event => event.type === "run.started" ? { ...event, data: { ...event.data, start: { ...event.data.start, fen: START_FEN.replace("KQkq", "HAha") }, rootNode: { ...event.data.rootNode, fen: START_FEN.replace("KQkq", "HAha") } } } : event);
    const run = readBackReplay(events).run;
    expect(() => stored(run, importRecord(run, "*")).owner.resolve(request(run))).toThrow(/not canonical/u);
  });

  it("validates the entire original imported mainline even for a valid earlier retry endpoint", () => {
    let run = play(importedRun("mainline-invalid"), ["e2e4", "e7e5", "g1f3"]);
    const main = run.activeCursor.branchId, path = branchPath(run, main);
    run = fork(rewind(run, path[1]!.id, REVIEW_AT).run, path[1]!.id, { at: REVIEW_AT }).run;
    const events = run.events.map(event => event.type === "move.committed" && event.data.node.id === path.at(-1)!.id ? { ...event, data: { ...event.data, node: { ...event.data.node, fen: "invalid-original-import" } } } : event);
    const invalid = readBackReplay(events).run;
    expect(() => stored(invalid, importRecord(invalid, "1-0")).owner.resolve(request(invalid, path[0]!.id))).toThrow();
  });

  it("requires contiguous actual events and exact snapshot replay before prefix selection", () => {
    const run = play(importedRun("invalid-events"), ["e2e4", "e7e5"]);
    const variants = [ { ...run, events: run.events.slice(1) }, { ...run, events: [...run.events, run.events[1]!] },
      { ...run, events: [run.events[1]!, run.events[0]!, ...run.events.slice(2)] },
      { ...run, activeCursor: { ...run.activeCursor, nodeId: run.nodes[0]!.id } } ];
    for (const invalid of variants) expect(() => stored(invalid, importRecord(invalid, "*")).owner.resolve(request(run, run.nodes[0]!.id))).toThrow();
  });

  it("rejects missing/crossed/non-import/invalid stored import context", () => {
    const run = play(importedRun("bad-import"), ["e2e4"]), record = importRecord(run, "*");
    for (const value of [undefined, { ...record, runId: "foreign" }, { ...record, result: "won" }, { ...record, movetextDigest: "bad" }, { ...record, extra: "not-the-three-field-image" }]) {
      expect(() => stored(run, value as never).owner.resolve(request(run))).toThrow(/import/u);
    }
    const native = recordedComparisonFixture().run;
    expect(() => stored(native, { ...record, runId: native.id }).owner.resolve(request(native))).toThrow(/import/u);
  });

  it("rejects nonclosed/missing/unknown/off-path requests and output/token overrides", () => {
    const fixture = recordedComparisonFixture(), source = stored(fixture.run), input = request(fixture.run, fixture.shared.id, fixture.main);
    const invalid = [ { ...input, recordedResult: "1-0" }, { ...input, outcome: { kind: "unfinished" } }, { ...input, fen: START_FEN },
      { ...input, runId: "missing" }, { ...input, branchId: "unknown" }, { ...input, throughNodeId: "unknown" },
      { ...input, throughNodeId: fixture.peerPath.at(-1)!.id }, { ...input, branchId: "" },
      { runId: input.runId, branchId: input.branchId }, { ...input, [Symbol("extra")]: true }, null ];
    for (const value of invalid) expect(() => source.owner.resolve(value as never)).toThrow();
    const boundary = source.owner.resolve(input);
    expect(() => invokeEvidenceValueRoute(RESULT, { recordedReview: boundary, recordedResult: "1-0" } as never)).toThrow();
    expect(() => invokeEvidenceValueRoute(CONSEQUENCE, { recordedReview: boundary, run: fixture.run } as never)).toThrow();
    let reads = 0;
    expect(() => source.owner.resolve({ ...input, get throughNodeId() { reads++; return input.throughNodeId; } })).toThrow();
    expect(reads).toBe(0);
  });
});
