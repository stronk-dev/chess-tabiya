import { afterEach, describe, expect, it, vi } from "vitest";
import { appendOpponentPly, branchPath, commitMove, compileAssistanceRequest, createRun, fork, moduleDecisionStamp, projectRun, revealFeedback, rewind, serverAvailabilityFromProviders, type DrillRun } from "@chess-tabiya/runtime";
import { InspectorContextError, type InspectorRecordedContext, type InspectorRecordedScope } from "./inspector-recorded-context.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-01T12:00:00.000Z";
const initial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const owner = { learnerId: "inspector-owner", handle: "inspector-owner" };
const reader = { learnerId: "inspector-reader", handle: "inspector-reader" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const request = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });

function fixture() {
  let run = createRun({ id: "inspector-current-context", session: { kind: "position", start: { fen: initial, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  const main = run.activeCursor.branchId;
  for (const move of ["e2e4", "e7e5", "g1f3", "b8c6", "d2d4", "e5d4"]) run = commitMove(run, move, { at }).run;
  const path = branchPath(run, main), selected = path[3]!, shared = path[2]!;
  run = fork(rewind(run, shared.id, at, undefined, main).run, shared.id, { at }).run;
  const peer = run.activeCursor.branchId;
  for (const move of ["f1c4", "g8f6"]) run = commitMove(run, move, { at }).run;
  const peerPath = branchPath(run, peer);
  run = fork(rewind(run, shared.id, at, undefined, main).run, shared.id, { at }).run;
  const newest = run.activeCursor.branchId;
  for (const move of ["d2d4", "e5d4"]) run = commitMove(run, move, { at }).run;
  run = revealFeedback(rewind(run, shared.id, at, undefined, main).run, at).run;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  for (const principal of [owner, reader]) storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  const lease = { writerId: "inspector-writer", learnerId: owner.learnerId };
  storage.create(run, lease);
  const service = new RunService(storage), controller = new AbortController();
  const selection = { branchId: main, nodeId: selected.id, decisionDigest: moduleDecisionStamp(run).digest, context: { kind: "position" as const } };
  const resolve = (patch: Partial<Omit<typeof selection, "context">> & { context?: InspectorRecordedScope } = {}, principal = owner, requested = request) =>
    service.resolveInspectorRecordedContext(run.id, principal, requested, availability, { ...selection, ...patch } as typeof selection, controller.signal);
  return { run, main, peer, newest, path, peerPath, selected, shared, storage, service, controller, selection, resolve, lease };
}

describe("current Inspector recorded context — actual RunService and SQLite", () => {
  it("retains the full current run while granting just the selected position, including inherited shared-prefix nodes", () => {
    const f = fixture(), original = JSON.stringify(f.storage.read(f.run.id)), token = f.resolve();
    const image = f.service.readInspectorRecordedContext(token);
    expect(image.run).toEqual(f.run); expect(image.run).not.toBe(f.run);
    expect(image.paths.map(path => path.nodes.map(node => node.id))).toEqual([[f.selected.id]]);
    expect(image.selected.fen).toBe(f.selected.fen);
    expect(image.decision.digest).toBe(moduleDecisionStamp(f.run).digest);
    expect(image.assistance.modules).toContain("full_inspector");
    expect(image.run.nodes.length).toBeGreaterThan(image.paths[0]!.nodes.length);
    const inherited = f.resolve({ branchId: f.peer, nodeId: f.shared.id });
    expect(f.service.readInspectorRecordedContext(inherited).paths[0]!.nodes[0]!.branchId).toBe(f.main);
    for (const value of [token, image, image.run, image.paths, image.paths[0], image.selected, image.assistance.config]) expect(Object.isFrozen(value)).toBe(true);
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(original);
  });

  it("grants exact incoming/window/branch/review paths and explicit comparison order, never the newest sibling", () => {
    const f = fixture();
    const scoped = (context: InspectorRecordedScope) => f.service.readInspectorRecordedContext(f.resolve({ context } as never));
    expect(scoped({ kind: "incoming_edge" }).paths[0]!.nodes.map(node => node.id)).toEqual(f.path.slice(2, 4).map(node => node.id));
    expect(scoped({ kind: "recorded_window" }).paths[0]!.nodes.map(node => node.id)).toEqual(f.path.slice(0, 4).map(node => node.id));
    for (const kind of ["branch", "recorded_review"] as const) expect(scoped({ kind, throughNodeId: f.selected.id }).paths[0]!.throughNodeId).toBe(f.selected.id);
    const compared = scoped({ kind: "comparison", otherBranchId: f.peer, otherNodeId: f.peerPath[3]!.id });
    expect(compared.paths.map(path => [path.branchId, path.throughNodeId])).toEqual([[f.main, f.selected.id], [f.peer, f.peerPath[3]!.id]]);
    expect(compared.paths[1]!.branchId).not.toBe(f.newest);
    expect(f.service.readInspectorRecordedContext(f.resolve({ nodeId: f.path[0]!.id, context: { kind: "incoming_edge" } } as never)).paths[0]!.nodes).toHaveLength(1);
  });

  it.each(["copy", "json", "prototype", "foreign", "data"])("refuses a %s context, not merely a matching digest", kind => {
    const f = fixture(), token = f.resolve();
    const fake = kind === "copy" ? { ...token } : kind === "json" ? JSON.parse(JSON.stringify(token))
      : kind === "prototype" ? Object.create(token) : kind === "data" ? f.service.readInspectorRecordedContext(token)
        : new RunService(f.storage).resolveInspectorRecordedContext(f.run.id, owner, request, availability, f.selection, f.controller.signal);
    expect(() => f.service.readInspectorRecordedContext(fake as InspectorRecordedContext)).toThrow(InspectorContextError);
  });

  it.each(["off-branch", "same-comparison", "unreached-fork", "earlier-boundary", "stale", "extra", "getter"])("refuses %s scope before retaining a context", kind => {
    const f = fixture(); const query: any = { ...f.selection }; const get = vi.fn(() => "position");
    if (kind === "off-branch") query.nodeId = f.peerPath.at(-1)!.id;
    if (kind === "same-comparison") query.context = { kind: "comparison", otherBranchId: f.main, otherNodeId: f.selected.id };
    if (kind === "unreached-fork") query.context = { kind: "comparison", otherBranchId: f.peer, otherNodeId: f.path[0]!.id };
    if (kind === "earlier-boundary") query.context = { kind: "branch", throughNodeId: f.shared.id };
    if (kind === "stale") query.decisionDigest = "foreign";
    if (kind === "extra") query.fen = initial;
    if (kind === "getter") Object.defineProperty(query.context, "kind", { enumerable: true, get });
    expect(() => f.service.resolveInspectorRecordedContext(f.run.id, owner, request, availability, query, f.controller.signal)).toThrow();
    expect(get).not.toHaveBeenCalled();
  });

  it.each(["suffix-fen", "suffix-parent", "duplicate", "event", "cycle"])("checks original %s beyond the requested endpoint before narrowing", kind => {
    const f = fixture(), stored = f.storage.read(f.run.id)!; const broken: DrillRun = structuredClone(f.run);
    const node = broken.nodes.find(node => node.id === f.path.at(-1)!.id)! as any;
    if (kind === "suffix-fen") node.fen = initial;
    if (kind === "suffix-parent") node.parentId = "absent";
    if (kind === "duplicate") (broken.nodes as any[]).push(structuredClone(node));
    if (kind === "event") (broken.events[1] as any).seq = 1;
    if (kind === "cycle") node.parentId = node.id;
    vi.spyOn(f.storage, "read").mockReturnValue({ ...stored, run: broken });
    expect(() => f.resolve()).toThrow();
  });

  it.each(["event-key", "data-key", "enum", "null-candidates"])("refuses coordinated schema-invalid %s even when replay equals the snapshot", kind => {
    const f = fixture(), stored = f.storage.read(f.run.id)!;
    let original = f.run;
    if (kind === "null-candidates") original = revealFeedback(appendOpponentPly(createRun({ id: f.run.id,
      session: { kind: "position", start: { fen: initial, side: "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: f.run.policyConfig, seed: 1, createdAt: at }),
      { moveUci: "e2e4", policyModeApplied: "human_common", engine: { id: "synthetic", name: "Synthetic fixture", version: "test", seedHonored: false }, candidates: [] }, { at }).run, at).run;
    const events: any = structuredClone(original.events);
    if (kind === "null-candidates") {
      vi.spyOn(f.storage, "read").mockReturnValue({ ...stored, run: original });
      const valid = { branchId: original.activeCursor.branchId, nodeId: original.activeCursor.nodeId, decisionDigest: moduleDecisionStamp(original).digest, context: { kind: "position" as const } };
      expect(() => f.service.resolveInspectorRecordedContext(original.id, owner, request, availability, valid, f.controller.signal)).not.toThrow();
    }
    if (kind === "event-key") events.at(-1).extra = true;
    if (kind === "data-key") events.at(-1).data.extra = true;
    if (kind === "enum") events[0].data.policyConfig.seedMode = "not-a-seed-mode";
    if (kind === "null-candidates") events.find((event: any) => event.type === "opponent.move_selected").data.selection.candidates = null;
    const broken = projectRun(events);
    vi.spyOn(f.storage, "read").mockReturnValue({ ...stored, run: broken });
    const query = { branchId: broken.activeCursor.branchId, nodeId: broken.activeCursor.nodeId, decisionDigest: moduleDecisionStamp(broken).digest, context: { kind: "position" as const } };
    expect(() => f.service.resolveInspectorRecordedContext(broken.id, owner, request, availability, query, f.controller.signal)).toThrow();
  });

  it("rechecks grant removal, cancellation, disclosure and the full current snapshot on every retained read", () => {
    const f = fixture();
    f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, at);
    // Spectators may be clamped by the actual workflow; do not manufacture an Inspector effect.
    const own = f.resolve();
    f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
    expect(() => f.resolve({}, reader)).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
    f.controller.abort(); expect(() => f.service.readInspectorRecordedContext(own)).toThrow();
    const g = fixture(), token = g.resolve();
    const changed = rewind(g.run, g.selected.id, at, undefined, g.main).run;
    g.storage.save(changed, g.lease);
    expect(() => g.service.readInspectorRecordedContext(token)).toThrow(expect.objectContaining({ reason: "stale" }));
    const h = fixture(), held = h.resolve();
    const moved = commitMove(rewind(h.run, h.path.at(-1)!.id, at, undefined, h.main).run, "f3d4", { at }).run;
    h.storage.save(moved, h.lease);
    expect(() => h.service.readInspectorRecordedContext(held)).toThrow(expect.objectContaining({ code: "ASSISTANCE_WITHHELD" }));
  });

  it("applies actual assistance choices and does not freeze mutable caller input", () => {
    const f = fixture(), quiet = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "quiet", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
    expect(() => f.resolve({}, owner, quiet)).toThrow();
    const query = structuredClone(f.selection), current = f.service.resolveInspectorRecordedContext(f.run.id, owner, request, availability, query, f.controller.signal);
    query.nodeId = "foreign";
    expect(f.service.readInspectorRecordedContext(current).selected.id).toBe(f.selected.id);
    expect(Object.isFrozen(query)).toBe(false);
  });

  it("detaches the nested scope and notices same-length valid event changes even when the decision stamp is equal", () => {
    const f = fixture(), query = { ...f.selection, context: { kind: "branch" as const, throughNodeId: f.selected.id } };
    const context = f.service.resolveInspectorRecordedContext(f.run.id, owner, request, availability, query, f.controller.signal);
    query.context.throughNodeId = f.path.at(-1)!.id;
    expect(f.service.readInspectorRecordedContext(context).paths[0]!.throughNodeId).toBe(f.selected.id);
    const stored = f.storage.read(f.run.id)!, events: any = structuredClone(f.run.events);
    events.at(-1).at = "2026-11-01T12:00:01.000Z";
    const changed = projectRun(events);
    expect(moduleDecisionStamp(changed)).toEqual(moduleDecisionStamp(f.run));
    vi.spyOn(f.storage, "read").mockReturnValue({ ...stored, run: changed });
    expect(() => f.service.readInspectorRecordedContext(context)).toThrow(expect.objectContaining({ reason: "stale" }));
  });

  it("uses the existing completed/imported branch disclosure instead of the active Play reveal", async () => {
    const f = fixture();
    const imported = await f.service.importGame({ id: "inspector-imported", side: "white", opponentPolicy: { mode: "human_common" },
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 3,
      source: { kind: "pgn", pgn: "[Result \"1-0\"]\n\n1. e4 e5 2. Nf3 Nc6 1-0" }, createdAt: at },
      { writerId: "import-writer", learnerId: owner.learnerId });
    const source = revealFeedback(imported.run, at).run, main = source.branches[0]!.id, path = branchPath(source, main);
    let retry = fork(rewind(source, path[2]!.id, at, undefined, main).run, path[2]!.id, { at }).run;
    retry = commitMove(retry, "f1c4", { at }).run;
    f.storage.save(retry, { writerId: "import-writer", learnerId: owner.learnerId });
    const intent = compileAssistanceRequest({ contextHint: "imported", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
    const query = { branchId: main, nodeId: path[2]!.id, decisionDigest: moduleDecisionStamp(retry).digest, context: { kind: "recorded_review" as const, throughNodeId: path[3]!.id } };
    const context = f.service.resolveInspectorRecordedContext(retry.id, owner, intent, availability, query, f.controller.signal);
    const image = f.service.readInspectorRecordedContext(context);
    expect(image.run).toEqual(retry);
    expect(image.paths[0]!.nodes.map(node => node.id)).toEqual(path.slice(0, 4).map(node => node.id));
    expect(image.selected.id).toBe(path[2]!.id);
    expect(() => f.service.resolveInspectorRecordedContext(retry.id, owner, intent, availability,
      { ...query, branchId: retry.activeCursor.branchId, nodeId: retry.activeCursor.nodeId, context: { kind: "position" } }, f.controller.signal))
      .toThrow(expect.objectContaining({ code: "ASSISTANCE_WITHHELD" }));
  });
});
