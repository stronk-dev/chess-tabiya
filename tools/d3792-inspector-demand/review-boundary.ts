// DISPOSABLE D3824 source-boundary model. Not a production receipt, permission, Review packet,
// Inspector operation or source-qualification claim. No existing whole-tip contract is changed.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import {
  createRun, canonicalRunStart, commitMove, rewind, fork, revealFeedback, branchPath,
  resolveBranchPath, createReviewPrefixAuthority, assertReviewRecordedPrefixReceipt, attachEvidence,
  PRIMARY_EVIDENCE_MANIFEST, REVIEW_PACKET_SOURCE_ADAPTERS,
  type DrillRun, type Node, type ReviewOutcomeReceipt,
} from "../../packages/runtime/src/index.js";
import { presentationDigest } from "../../packages/runtime/src/presentation-contract.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { assertDeclaredEvidence, evidenceValueReceipt } from "../../packages/runtime/src/evidence-contract.js";
import { positionFromFen } from "../../packages/runtime/src/chess.js";
import { compileReviewPacketForSubject, reviewDurableEngineStates, reviewDeliveryEvidencePayload } from "../../packages/runtime/src/review-evidence.js";
import { reviewStoryMoments } from "../../packages/runtime/src/story.js";
import { evaluationDelivery } from "../../packages/runtime/src/testing/review-evidence-fixture.js";
import { SQLiteRunStorage, type ImportedGameRecord } from "../../apps/server/src/storage.js";
import { loadConceptRegistry } from "../../apps/server/src/concept-registry-loader.js";
import { IdentityService } from "../../apps/server/src/identity.js";
import { RunService } from "../../apps/server/src/service.js";

type Request = Readonly<{ runId: string; branchId: string; throughNodeId: string }>;
type Boundary = Readonly<{
  protocol: "research-recorded-review-boundary@1";
  request: Request;
  eventHead: Readonly<{ seq: number; digest: string }>;
  pathNodeIds: readonly string[];
  learnerSide: "white" | "black";
  importBoundary: Readonly<{ branchId: string; tipNodeId: string; recordDigest: string }> | null;
  outcome: ReviewOutcomeReceipt;
  digest: string;
}>;
type Storage = Readonly<{
  loadRun: (id: string) => DrillRun | undefined;
  loadImportRecord: (id: string) => ImportedGameRecord | undefined;
}>;
class BoundaryRefusal extends Error {}
function refuse(reason: string): never { throw new BoundaryRefusal(reason); }

function boundaryModel(storage: Storage) {
  const owned = new WeakMap<Boundary, Readonly<{ run: DrillRun; path: readonly Node[] }>>();
  let prepared = 0;
  const read = (value: Request) => {
    if (value === null || typeof value !== "object" || Object.keys(value).sort().join("|") !== "branchId|runId|throughNodeId"
      || [value.runId, value.branchId, value.throughNodeId].some(id => typeof id !== "string" || id.length === 0)) refuse("invalid_request");
    const request = Object.freeze({ runId: value.runId, branchId: value.branchId, throughNodeId: value.throughNodeId });
    const run = storage.loadRun(request.runId) ?? refuse("missing_run");
    if (run.id !== request.runId || run.events.length === 0) refuse("invalid_run");
    for (let i = 1; i < run.events.length; i++) if (run.events[i]!.seq !== run.events[i - 1]!.seq + 1) refuse("invalid_event_sequence");
    const original = resolveBranchPath(run, request.branchId);
    if (original.kind !== "resolved") refuse(`invalid_graph:${original.reason}`);
    try { for (const node of original.nodes) positionFromFen(node.fen); }
    catch { refuse("invalid_original_fen"); }
    const endpoint = original.nodes.findIndex(node => node.id === request.throughNodeId);
    if (endpoint < 0) refuse("endpoint_not_on_branch");
    // Original graph validation precedes narrowing. The unchanged run is retained, never cropped.
    const path = Object.freeze(original.nodes.slice(0, endpoint + 1));
    const record = storage.loadImportRecord(run.id);
    if ((record === undefined) !== (run.sessionKind !== "imported")) refuse("import_record_presence");
    if (record !== undefined && (record.runId !== run.id || !["1-0", "0-1", "1/2-1/2", "*"].includes(record.result))) refuse("invalid_import_record");
    let importBoundary: Boundary["importBoundary"] = null;
    if (record !== undefined) {
      const imported = resolveBranchPath(run, run.branches[0]!.id);
      if (imported.kind !== "resolved") refuse(`invalid_import_graph:${imported.reason}`);
      importBoundary = Object.freeze({ branchId: run.branches[0]!.id, tipNodeId: imported.nodes.at(-1)!.id,
        recordDigest: presentationDigest("research.review-import@1", { runId: record.runId, result: record.result, movetextDigest: record.movetextDigest }) });
    }
    const ids = new Set(path.map(node => node.id));
    const terminal = [...run.events].reverse().find(event => event.type === "outcome.reached" && ids.has(event.data.nodeId));
    const recorded = record !== undefined && request.branchId === importBoundary!.branchId && request.throughNodeId === importBoundary!.tipNodeId && record.result !== "*" ? record : undefined;
    let outcome: ReviewOutcomeReceipt = Object.freeze({ kind: "unfinished" });
    if (terminal?.type === "outcome.reached") {
      const result = recorded?.result;
      const expected = result === undefined ? undefined : result === "1/2-1/2" ? "draw" : (result === "1-0") === (run.start.side === "white") ? "win" : "loss";
      if (expected !== undefined && expected !== terminal.data.outcome) refuse("import_terminal_disagreement");
      outcome = Object.freeze({ kind: "board_terminal", eventSeq: terminal.seq, nodeId: terminal.data.nodeId, result: terminal.data.outcome });
    } else if (recorded !== undefined && recorded.result !== "*") {
      outcome = Object.freeze({ kind: "recorded_result", sourceDigest: importBoundary!.recordDigest, result: recorded.result });
    }
    const head = run.events.at(-1)!;
    const eventHead = Object.freeze({ seq: head.seq, digest: presentationDigest("review.event-prefix@1", run.events) });
    const body = Object.freeze({ protocol: "research-recorded-review-boundary@1" as const, request, eventHead,
      pathNodeIds: Object.freeze(path.map(node => node.id)), learnerSide: run.start.side, importBoundary, outcome });
    const digest = presentationDigest("research.review-boundary@1", { ...body,
      path: path.map(node => ({ id: node.id, parentId: node.parentId, fen: node.fen, ply: node.ply, moveUci: node.moveUci })) });
    return { run, path, boundary: Object.freeze({ ...body, digest }) };
  };
  const assertCurrent = (boundary: Boundary) => {
    const snapshot = owned.get(boundary);
    if (snapshot === undefined || !Object.isFrozen(boundary)) refuse("foreign_boundary");
    if (read(boundary.request).boundary.digest !== boundary.digest) refuse("stale_boundary");
    return snapshot!;
  };
  return {
    issue(request: Request) { const source = read(request); owned.set(source.boundary, Object.freeze({ run: source.run, path: source.path })); return source.boundary; },
    assertCurrent,
    positions(boundary: Boundary) {
      const snapshot = assertCurrent(boundary);
      return snapshot.path.map(node => {
        prepared++;
        const item = invokeEvidenceValueRoute("run.record.position@1", { run: snapshot.run, nodeId: node.id });
        assertDeclaredEvidence(item);
        return item;
      });
    },
    edges(boundary: Boundary) {
      const snapshot = assertCurrent(boundary);
      return snapshot.path.slice(1).map((child, index) => {
        prepared++;
        const item = invokeEvidenceValueRoute("run.record.edge@1", { run: snapshot.run, parent: snapshot.path[index]!, child });
        assertDeclaredEvidence(item);
        return item;
      });
    },
    prepared: () => prepared,
  };
}

const at = "2026-10-15T00:00:00.000Z";
const initial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const directory = mkdtempSync(join(tmpdir(), "tabiya-d3824-review-boundary-"));
const storage = new SQLiteRunStorage(join(directory, "fixture.sqlite"), { concepts: { registry: loadConceptRegistry(resolve("content/concepts")) } });
let checks = 0, prefixes = 0, actualItems = 0, actualEdges = 0;
let rankChecks = 0, croppedLastLevelItems = 0, oldRankScopeCollisions = 0;
const checked = (callback: () => void) => { callback(); checks++; };
const writer = "d3824-storage-fixture";
try {
  const identity = new IdentityService(storage);
  const owner = await identity.register({ handle: "d3824-owner", password: "owned-boundary-fixture-password" });
  const lease = { writerId: writer, learnerId: owner.learner.id };
  const service = new RunService(storage);
  let overrideRun: DrillRun | undefined;
  let overrideRecord: ImportedGameRecord | undefined;
  let omitRecord = false;
  const source: Storage = { loadRun: id => overrideRun ?? storage.read(id)?.run,
    loadImportRecord: id => omitRecord ? undefined : overrideRecord ?? storage.importedGame(id) };
  const model = boundaryModel(source);
  const current = createReviewPrefixAuthority(source);
  for (const side of ["white", "black"] as const) for (const imported of [false, true]) for (const mate of [false, true]) {
    const id = `d3824-${side}-${imported}-${mate}`;
    const moves = mate ? ["f2f3", "e7e5", "g2g4", "d8h4"] : ["e2e4", "e7e5", "d2d4", "e5d4", "d1d4", "b8c6"];
    const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };
    let run: DrillRun;
    if (imported) {
      const result = mate ? "0-1" : "1-0";
      const movetext = mate ? "1. f3 e5 2. g4 Qh4#" : "1. e4 e5 2. d4 exd4 3. Qxd4 Nc6";
      run = (await service.importGame({ id, side, opponentPolicy: { mode: "human_common" }, policyConfig, seed: 1,
        createdAt: at, source: { kind: "pgn", pgn: `[Result "${result}"]\n\n${movetext} ${result}` } }, lease)).run;
    } else {
      run = createRun({ id, session: { kind: "position", start: canonicalRunStart({ fen: initial, side }),
        feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: `sha256:${"c".repeat(64)}`, policyConfig, seed: 1, createdAt: at });
      for (const uci of moves) run = commitMove(run, uci, { at }).run;
      storage.create(run, lease);
    }
    const main = run.branches[0]!.id;
    const original = storage.read(id)!.run;
    const saved = JSON.stringify(original);
    const path = branchPath(original, main);
    const whole = current({ runId: id, branchId: main });
    checked(() => assert.throws(() => Reflect.apply(current, undefined, [{ runId: id, branchId: main, throughNodeId: path[1]!.id }]), /exactly/u));
    for (let index = 0; index < path.length; index++) {
      const boundary = model.issue({ runId: id, branchId: main, throughNodeId: path[index]!.id });
      const fullTip = index === path.length - 1;
      checked(() => {
        assert.deepEqual(boundary.pathNodeIds, path.slice(0, index + 1).map(node => node.id));
        assert.equal(boundary.outcome.kind, fullTip && mate ? "board_terminal" : fullTip && imported ? "recorded_result" : "unfinished");
        if (fullTip && mate) assert.deepEqual(boundary.outcome, whole.outcome);
        if (fullTip && imported && !mate) assert.equal(boundary.outcome.kind === "recorded_result" && boundary.outcome.result, "1-0");
        assert.equal(boundary.learnerSide, side);
        assert.deepEqual(boundary.eventHead, whole.eventHead);
        assert.throws(() => assertReviewRecordedPrefixReceipt(boundary));
        const items = model.positions(boundary);
        assert.deepEqual(items.map(item => (item.payload as { nodeId: string }).nodeId), boundary.pathNodeIds);
        const edges = model.edges(boundary);
        assert.deepEqual(edges.map(item => (item.payload as { afterNodeId: string }).afterNodeId), boundary.pathNodeIds.slice(1));
        edges.forEach((item, index) => {
          const payload = item.payload as { beforeNodeId: string; beforeFen: string; afterFen: string; moveUci: string };
          assert.equal(payload.beforeNodeId, path[index]!.id);
          assert.equal(payload.beforeFen, path[index]!.fen);
          assert.equal(payload.afterFen, path[index + 1]!.fen);
          assert.equal(payload.moveUci, path[index + 1]!.moveUci);
        });
        actualEdges += edges.length;
        actualItems += items.length; prefixes++;
      });
      const before = model.prepared();
      checked(() => assert.throws(() => model.positions({ ...boundary }), /foreign_boundary/u));
      assert.equal(model.prepared(), before);
      checked(() => assert.throws(() => model.positions(JSON.parse(JSON.stringify(boundary))), /foreign_boundary/u));
    }
    const first = { runId: id, branchId: main, throughNodeId: path[1]!.id };
    const mutableRequest = { ...first };
    const captured = model.issue(mutableRequest);
    mutableRequest.throughNodeId = path.at(-1)!.id;
    checked(() => {
      model.assertCurrent(captured);
      assert.deepEqual(captured.pathNodeIds, path.slice(0, 2).map(node => node.id));
      assert.equal(captured.outcome.kind, "unfinished");
    });
    const rejected = (callback: () => void, message: RegExp) => {
      const before = model.prepared(); checked(() => assert.throws(callback, message)); assert.equal(model.prepared(), before);
    };
    rejected(() => Reflect.apply(model.issue, undefined, [{ ...first, outcome: { kind: "recorded_result", result: "1-0" } }]), /invalid_request/u);
    rejected(() => model.issue({ ...first, runId: "missing" }), /missing_run/u);
    rejected(() => model.issue({ ...first, branchId: "missing" }), /invalid_graph/u);
    rejected(() => model.issue({ ...first, throughNodeId: "missing" }), /endpoint_not_on_branch/u);
    const mutations: readonly DrillRun[] = [
      { ...original, nodes: [...original.nodes, path.at(-1)!] },
      { ...original, nodes: original.nodes.map(node => node.id === path.at(-1)!.id ? { ...node, parentId: node.id } : node) },
      { ...original, nodes: original.nodes.map(node => node.id === path.at(-1)!.id ? { ...node, parentId: "missing-later-parent" } : node) },
      { ...original, branches: [...original.branches, original.branches[0]!] },
    ];
    for (const malformed of mutations) {
      overrideRun = malformed; rejected(() => model.issue(first), /invalid_graph/u); overrideRun = undefined;
    }
    overrideRun = { ...original, nodes: original.nodes.map(node => node.id === path.at(-1)!.id ? { ...node, fen: "not-a-fen" } : node) };
    rejected(() => model.issue(first), /invalid_original_fen/u); overrideRun = undefined;
    overrideRun = { ...original, events: original.events.filter((_event, index) => index !== 1) };
    rejected(() => model.issue(first), /invalid_event_sequence/u); overrideRun = undefined;
    if (imported) {
      const originalRecord = storage.importedGame(id)!;
      const early = model.issue(first);
      overrideRecord = { ...originalRecord, result: "*" };
      rejected(() => model.positions(early), /stale_boundary/u); overrideRecord = undefined;
      overrideRecord = { ...originalRecord, runId: "foreign" };
      rejected(() => model.issue(first), /invalid_import_record/u); overrideRecord = undefined;
      omitRecord = true; rejected(() => model.issue(first), /import_record_presence/u); omitRecord = false;
    }
    // A genuine alternate branch retains inherited original nodes but borrows no PGN result.
    run = rewind(original, path[2]!.id, at, undefined, main).run;
    run = fork(run, path[2]!.id, { at }).run;
    run = commitMove(run, mate ? "b1c3" : "g1f3", { at }).run;
    run = revealFeedback(run, at).run;
    storage.save(run, lease);
    const retry = run.activeCursor.branchId;
    const scoped = model.issue({ runId: id, branchId: retry, throughNodeId: path[1]!.id });
    checked(() => { assert.equal(scoped.outcome.kind, "unfinished"); assert.deepEqual(scoped.pathNodeIds, path.slice(0, 2).map(node => node.id));
      assert.equal(model.edges(scoped).length, 1); });
    checked(() => assert.throws(() => model.issue({ runId: id, branchId: retry, throughNodeId: path.at(-1)!.id }), /endpoint_not_on_branch/u));
    checked(() => assert.throws(() => Reflect.apply(model.positions, undefined, [whole]), /foreign_boundary/u));
    const otherIssuer = boundaryModel(source).issue({ runId: id, branchId: main, throughNodeId: path[1]!.id });
    checked(() => assert.throws(() => model.positions(otherIssuer), /foreign_boundary/u));
    // Actual sibling write invalidates the scoped identity, even with its path/FEN unchanged.
    const beforeWrite = model.issue({ runId: id, branchId: main, throughNodeId: path[1]!.id });
    run = commitMove(run, "b8c6", { at }).run;
    storage.save(run, lease);
    checked(() => assert.throws(() => model.positions(beforeWrite), /stale_boundary/u));
    checked(() => assertReviewRecordedPrefixReceipt(current({ runId: id, branchId: main })));
    assert.equal(JSON.stringify(original), saved);
  }
  // D3832: derive the rank operation's adapter demand from existing declarations, not a new
  // source registry. Stop at an existing adapter; its own operation retains its dependencies.
  const declarations = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map(value => [`${value.id}@${value.version}`, value]));
  const adapters = new Map(REVIEW_PACKET_SOURCE_ADAPTERS.map(value => [`${value.projection.id}@${value.projection.version}`, value.id]));
  const requiredAdapters = new Set<string>();
  const visiting = new Set<string>();
  function demand(key: string): void {
    assert(!visiting.has(key), "Story source dependency cycle");
    const adapter = adapters.get(key);
    if (adapter !== undefined) { requiredAdapters.add(adapter); return; }
    const definition = declarations.get(key);
    assert(definition?.derivation?.inputs !== undefined && definition.derivation.inputs.length > 0,
      `Story source has no exact adapter or conjunctive derivation: ${key}`);
    visiting.add(key);
    for (const input of definition.derivation.inputs) demand(`${input.id}@${input.version}`);
    visiting.delete(key);
  }
  demand("derived.story.rank@2");
  const rankChecked = (callback: () => void) => { callback(); rankChecks++; };
  rankChecked(() => assert.deepEqual([...requiredAdapters].sort(), [
    "review.source.consequence@1", "review.source.endgame@1", "review.source.eval_delta@2",
    "review.source.eval_point@1", "review.source.imported_result@1", "review.source.mate_transition@2",
    "review.source.pivotal.human_divergence@1", "review.source.pivotal.irreversibility@1",
    "review.source.pivotal.option_collapse@1", "review.source.pivotal.phase_change@1", "review.source.shapes@1",
  ].sort()));

  for (const side of ["white", "black"] as const) {
    const id = `d3832-rank-${side}`;
    const result = side === "white" ? "0-1" : "1-0";
    let run = (await service.importGame({ id, side, opponentPolicy: { mode: "human_common" },
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 1, createdAt: at, source: { kind: "pgn", pgn: `[Result "${result}"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 ${result}` } }, lease)).run;
    const branchId = run.branches[0]!.id;
    const point = branchPath(run, branchId)[3]!;
    // Labelled synthetic engine capture, admitted and stored by the real production builder.
    // This tests source/occurrence plumbing, NOT Stockfish evaluation or chess usefulness.
    run = attachEvidence(run, point.id, ["fixture:d3832-eval"], reviewDeliveryEvidencePayload(evaluationDelivery(point.fen, "cp 0")), at).run;
    storage.save(run, lease);
    const saved = JSON.stringify(storage.read(id)!.run), path = branchPath(run, branchId);
    const subject = current({ runId: id, branchId });
    const packet = compileReviewPacketForSubject(subject, { engine: reviewDurableEngineStates(run, path), shapes: [] });
    const full = reviewStoryMoments(packet);
    rankChecked(() => assert.equal(subject.outcome.kind, "recorded_result"));
    rankChecked(() => assert(full.moments.some(moment => moment.nodeId === point.id && moment.kinds.includes("last_level")),
      "actual full-game Story must positively observe its outcome-dependent last-level fact"));
    const images: string[] = [];
    const scopes: string[] = [];
    for (const index of [3, 4]) {
      const boundary = model.issue({ runId: id, branchId, throughNodeId: path[index]!.id });
      rankChecked(() => assert.equal(boundary.outcome.kind, "unfinished"));
      const ids = new Set(boundary.pathNodeIds);
      const cropped = full.moments.filter(moment => ids.has(moment.nodeId));
      const leaked = cropped.filter(moment => moment.kinds.includes("last_level"));
      rankChecked(() => assert.equal(leaked.length, 1, "node-only cropping retains a fact depending on the ungranted final result"));
      croppedLastLevelItems += leaked.length;
      const rank = invokeEvidenceValueRoute("derived.story.rank@2", { moments: cropped });
      rankChecked(() => assert(rank.payload.rank.includes(point.id)));
      images.push(evidenceValueReceipt(rank).inputDigest);
      scopes.push(boundary.digest);
    }
    rankChecked(() => assert.notEqual(scopes[0], scopes[1]));
    rankChecked(() => assert.equal(images[0], images[1], "legacy moment-list input does not name the requested endpoint"));
    oldRankScopeCollisions++;
    rankChecked(() => assert.equal(JSON.stringify(storage.read(id)!.run), saved));
  }
  const empty = createRun({ id: "d3832-empty", session: { kind: "position", start: canonicalRunStart({ fen: initial, side: "white" }),
    feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: `sha256:${"c".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  storage.create(empty, lease);
  const emptyPacket = compileReviewPacketForSubject(current({ runId: empty.id, branchId: empty.activeCursor.branchId }), { engine: new Map(), shapes: [] });
  const emptyStory = reviewStoryMoments(emptyPacket);
  rankChecked(() => assert.deepEqual(emptyStory.moments, []));
  rankChecked(() => assert.deepEqual(invokeEvidenceValueRoute("derived.story.rank@2", { moments: emptyStory.moments }).payload.rank, []));
  console.log(JSON.stringify({ scope: "D3824/D3832 storage/source and rank-boundary model; NOT permission, scoped Review packet, complete source delivery or production",
    checks, prefixes, actualPositionItems: actualItems, actualEdgeItems: actualEdges, rankChecks, croppedLastLevelItems,
    oldRankScopeCollisions, requiredStoryAdapters: [...requiredAdapters].sort() }));
} finally {
  storage.close(); rmSync(directory, { recursive: true, force: true }); // only this owned fixture
}
