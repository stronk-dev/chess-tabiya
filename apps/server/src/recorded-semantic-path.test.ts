import { readdirSync, readFileSync } from "node:fs";

import { commitMove, createRun, SEMANTIC_EVENT_PROJECTION_REFS, type DrillRun } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import { ServerError } from "./errors.js";
import { recordedSemanticPathOperation } from "./recorded-semantic-path.js";
import { SQLiteRunStorage } from "./storage.js";
import { RECORDED_SEQUENCE_POSITIVES, RECORDED_SEQUENCE_HARD_NEGATIVES, RECORDED_ATTRACTION_FIVE, RECORDED_DEFLECTION_CHECK } from "../../../packages/runtime/src/testing/recorded-sequence-fixtures.js";

const at = "2026-09-24T00:00:00.000Z";
const ROOT = new URL("../../../", import.meta.url);
const owner = { learnerId: "learner-owner", handle: "owner" } as const;
const stranger = { learnerId: "learner-stranger", handle: "stranger" } as const;
const storages: SQLiteRunStorage[] = [];

afterEach(() => {
  for (const storage of storages.splice(0)) storage.close();
});

function fixture(fen = "1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", moves: readonly string[] = ["b8a7", "c6a7", "e1e7"]): { readonly storage: SQLiteRunStorage; readonly run: DrillRun } {
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {}, now: () => at });
  storages.push(storage);
  storage.createLearner({ id: owner.learnerId, handle: owner.handle, passwordHash: "!", createdAt: at });
  storage.createLearner({ id: stranger.learnerId, handle: stranger.handle, passwordHash: "!", createdAt: at });
  let run = createRun({ id: "recorded-path-run", packId: "fixture", packDigest: `sha256:${"d".repeat(64)}`, startFen: fen, seed: 1, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
  for (const move of moves) run = commitMove(run, move, { at }).run;
  storage.create(run, { writerId: "writer-owner", learnerId: owner.learnerId }, "Recorded path");
  return { storage, run };
}

describe("D3735 actual owned-source sequence population", () => {
  it("covers the complete declared family image without substituting consumer stand-ins", () => {
    const refs = SEMANTIC_EVENT_PROJECTION_REFS.filter(ref => ref.version === 2).map(ref => ref.id).sort();
    expect(RECORDED_SEQUENCE_POSITIVES.map(row => row.projection).sort()).toEqual(refs);
    expect(RECORDED_SEQUENCE_HARD_NEGATIVES.map(row => row.projection).sort()).toEqual(refs);
  });

  it.each([
    ...RECORDED_SEQUENCE_POSITIVES.map(value => ({ ...value, emits: true })),
    ...RECORDED_SEQUENCE_HARD_NEGATIVES.map(value => ({ ...value, emits: false })),
    { ...RECORDED_ATTRACTION_FIVE, projection: "derived.tactic.attraction_observed", emits: true },
    { ...RECORDED_DEFLECTION_CHECK, projection: "derived.tactic.deflection_observed", emits: true },
  ])("saved $projection emits=$emits through the actual authorized source operation", async value => {
    const { storage, run } = fixture(value.fen, value.moves);
    const saved = JSON.stringify(storage.read(run.id));
    const compile = recordedSemanticPathOperation(storage);
    const input = { principal: owner, runId: run.id, branchId: run.activeCursor.branchId };
    const result = await compile(input);
    expect(result.kind).toBe("available");
    if (result.kind !== "available") throw new Error("valid saved sequence was refused");
    const matched = result.events.filter(event => event.projection.id === value.projection && event.projection.version === 2);
    expect(matched.length > 0).toBe(value.emits);
    const windows = result.windows.filter(window => window.projection.id === value.projection && window.projection.version === 2);
    expect(windows.some(window => window.status === (value.emits ? "emitted" : "no_witness"))).toBe(true);
    if (!value.emits) expect(windows.some(window => window.status === "emitted")).toBe(false);
    expect(await compile(input)).toEqual(result);
    await expect(compile({ ...input, principal: stranger })).rejects.toMatchObject({ code: "RUN_NOT_FOUND" });
    expect(JSON.stringify(storage.read(run.id))).toBe(saved);
  });
});

describe("D3719 saved recapturer continuity", () => {
  it.each([
    { name: "replacement white", fen: "8/8/8/8/8/7n/5P2/1k3K1R b H - 0 1", moves: ["h3f2", "f1h1", "b1a2", "f1f2"], count: 0 },
    { name: "replacement black", fen: "1K3k1r/5p2/7N/8/8/8/8/8 w h - 0 1", moves: ["h6f7", "f8h8", "b8a7", "f8f7"], count: 0 },
    { name: "original white", fen: "1k6/8/8/8/8/7n/5P2/5K1R b - - 0 1", moves: ["h3f2", "h1h8", "b8a7", "f1f2"], count: 1 },
    { name: "original black", fen: "5k1r/5p2/7N/8/8/8/8/1K6 w - - 0 1", moves: ["h6f7", "h8h1", "b1a2", "f8f7"], count: 1 },
  ])("$name survives actual owned storage reconstruction without false attribution", async value => {
    const { storage, run } = fixture(value.fen, value.moves);
    const compile = recordedSemanticPathOperation(storage);
    const input = { principal: owner, runId: run.id, branchId: run.activeCursor.branchId };
    const saved = JSON.stringify(storage.read(run.id));
    const result = await compile(input);
    expect(result.kind).toBe("available");
    if (result.kind !== "available") throw new Error("valid saved four-edge path was refused");
    const events = result.events.filter(event => event.projection.id === "derived.tactic.check_zwischenzug_observed" && event.projection.version === 2);
    expect(events).toHaveLength(value.count);
    if (value.count > 0) expect(events[0]!.operands).toMatchObject({ retainedRecapture: { capturer: { role: "king" } } });
    expect(result.windows.find(window => window.projection.id === "derived.tactic.check_zwischenzug_observed" && window.projection.version === 2 && window.startNodeId === run.nodes[0]!.id))
      .toMatchObject({ horizon: 4, status: value.count === 0 ? "no_witness" : "emitted", endNodeId: run.nodes[4]!.id });
    expect(result.pathNodeIds).toEqual(run.nodes.map(node => node.id));
    expect(await compile(input)).toEqual(result);
    await expect(compile({ ...input, principal: stranger })).rejects.toMatchObject({ code: "RUN_NOT_FOUND" });
    expect(JSON.stringify(storage.read(run.id))).toBe(saved);
  });
});

function productionSources(directory: URL): readonly { readonly path: string; readonly text: string }[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name === "dist") return [];
    const child = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) return productionSources(child);
    return /\.(ts|svelte)$/u.test(entry.name) && !/\.test\.ts$/u.test(entry.name) ? [{ path: child.pathname, text: readFileSync(child, "utf8") }] : [];
  });
}

describe("recorded semantic path server operation", () => {
  it.each([
    { projection: "derived.tactic.deflection_observed", fen: "1B5k/r1r5/8/8/8/8/8/R5K1 w - - 0 1", moves: ["b8a7", "c7a7", "a1a7"] },
    { projection: "derived.tactic.deflection_observed", fen: "r5k1/8/8/8/8/8/R1R5/1b5K b - - 0 1", moves: ["b1a2", "c2a2", "a8a2"] },
    { projection: "derived.tactic.line_blocker_clearance_observed", fen: "qq5k/8/8/8/Q7/8/8/R5K1 w - - 0 1", moves: ["a4a8", "b8a8", "a1a8"] },
    { projection: "derived.tactic.line_blocker_clearance_observed", fen: "r5k1/8/8/q7/8/8/8/QQ5K b - - 0 1", moves: ["a5a1", "b1a1", "a8a1"] },
  ])("D3718 owned saved play refuses a same-role target replacement ($moves)", async value => {
    const { storage, run } = fixture(value.fen, value.moves);
    const compile = recordedSemanticPathOperation(storage);
    const input = { principal: owner, runId: run.id, branchId: run.activeCursor.branchId };
    const saved = JSON.stringify(storage.read(run.id));
    const result = await compile(input);
    expect(result.kind).toBe("available");
    if (result.kind !== "available") throw new Error("valid saved target replacement was refused");
    expect(result.events.filter(event => event.projection.id === value.projection && event.projection.version === 2)).toEqual([]);
    expect(result.windows.find(window => window.projection.id === value.projection && window.projection.version === 2 && window.startNodeId === run.nodes[0]!.id))
      .toMatchObject({ horizon: 3, status: "no_witness", eventIds: [] });
    expect(result.events.some(event => event.projection.id === "derived.exchange.trade_completed")).toBe(true);
    expect(await compile(input)).toEqual(result);
    await expect(compile({ ...input, principal: stranger })).rejects.toMatchObject({ code: "RUN_NOT_FOUND" });
    expect(JSON.stringify(storage.read(run.id))).toBe(saved);
  });

  it.each([
    { fen: "7k/8/2Q5/3N4/2n1b3/8/3P4/K7 w - - 0 1", moves: ["d2d3", "e4f3"], before: "e4", after: "f3" },
    { fen: "k7/3p4/8/2N1B3/3n4/2q5/8/7K b - - 0 1", moves: ["d7d6", "e5f6"], before: "e5", after: "f6" },
  ])("D3631 reconstructs the actual bishop reply from owned saved play ($moves)", async value => {
    const { storage, run } = fixture(value.fen, value.moves);
    const compile = recordedSemanticPathOperation(storage);
    const input = { principal: owner, runId: run.id, branchId: run.activeCursor.branchId };
    const saved = JSON.stringify(storage.read(run.id));
    const result = await compile(input);
    expect(result.kind).toBe("available");
    if (result.kind !== "available") throw new Error("recorded harassment path refused");
    const events = result.events.filter(event => event.projection.id === "derived.pawn.sequence.harassment_pressure" && event.projection.version === 2);
    expect(events).toHaveLength(1);
    expect(events[0]!.evidence.payload).toMatchObject({ minor: { before: { square: value.before }, after: { square: value.after } } });
    expect(await compile(input)).toEqual(result);
    await expect(compile({ ...input, principal: stranger })).rejects.toMatchObject({ code: "RUN_NOT_FOUND" });
    expect(JSON.stringify(storage.read(run.id))).toBe(saved);
  });
  it("[criterion 12] enforces read authority and delegates unchanged to the runtime compiler", async () => {
    const { storage, run } = fixture();
    const compile = recordedSemanticPathOperation(storage);
    expect(compile.name).toBe("compileRecordedSemanticPath");
    const result = await compile({ principal: owner, runId: run.id, branchId: run.activeCursor.branchId });
    expect(result.kind).toBe("available");
    if (result.kind === "available") expect(result.events.map((event) => `${event.projection.id}@${event.projection.version}`)).toEqual(expect.arrayContaining(["derived.tactic.deflection_observed@2", "derived.tactic.overload_exploitation_observed@2"]));
    await expect(compile({ principal: stranger, runId: run.id, branchId: run.activeCursor.branchId })).rejects.toThrowError(expect.objectContaining<Partial<ServerError>>({ code: "RUN_NOT_FOUND" }));
    await expect(compile({ principal: owner, runId: "absent", branchId: run.activeCursor.branchId })).rejects.toThrowError(expect.objectContaining<Partial<ServerError>>({ code: "RUN_NOT_FOUND" }));
    const unknown = await compile({ principal: owner, runId: run.id, branchId: "absent" });
    expect(unknown).toMatchObject({ kind: "refused", reason: "unknown_branch" });
  });

  it("[criterion 12] exposes no public raw-evidence REST route", () => {
    const rest = readFileSync(new URL("apps/server/src/rest.ts", ROOT), "utf8");
    expect(rest).not.toMatch(/recorded-semantic-path|recordedSemanticPath|compileRecordedSemanticPath/u);
  });

  it("[criterion 13] keeps the RFC out of `implemented` until a production consumer call exists", () => {
    const defining = new Set([
      new URL("apps/server/src/recorded-semantic-path.ts", ROOT).pathname,
      new URL("packages/runtime/src/recorded-semantic-path.ts", ROOT).pathname,
      new URL("packages/runtime/src/index.ts", ROOT).pathname,
    ]);
    const callers = [new URL("apps/", ROOT), new URL("packages/", ROOT)]
      .flatMap(productionSources)
      .filter((source) => !defining.has(source.path) && /\b(?:recordedSemanticPathOperation|compileRecordedSemanticPath|recordedSemanticPath)\s*\(/u.test(source.text));
    const rfc = readFileSync(new URL("rfc/recorded-semantic-path.md", ROOT), "utf8");
    const status = rfc.match(/^- \*\*Status:\*\*\s*[*_`\s]*([a-z-]+)/mu)?.[1];
    expect(status).toBeDefined();
    if (callers.length === 0) expect(status).not.toBe("implemented");
    else expect(callers.map((source) => source.path)).not.toEqual([]);
  });
});
