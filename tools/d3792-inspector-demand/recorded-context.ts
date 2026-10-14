// DISPOSABLE D3813 author model: authenticated scope/receiver boundaries, NOT a production
// operation, evidence mint, provider supplier, completed-Review authority or API.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  createRun, canonicalRunStart, commitMove, rewind, fork, revealFeedback, branchPath,
  resolveBranchPath, moduleDecisionStamp, feedbackDeliveryOpen, compileAssistanceRequest,
  compileAuthoritativeAssistance, finalizeAssistanceEffects, MODULE_SOURCE_AUTHORITY,
  serverAvailabilityFromProviders, assertDeclaredEvidence,
  type DrillRun, type Node, type RequestedAssistanceV1,
} from "../../packages/runtime/src/index.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { evidenceValueReceipt } from "../../packages/runtime/src/evidence-contract.js";
import { SQLiteRunStorage } from "../../apps/server/src/storage.js";
import { IdentityService } from "../../apps/server/src/identity.js";
import { requireRead } from "../../apps/server/src/authorization.js";
import { RunService } from "../../apps/server/src/service.js";
import { loadConceptRegistry } from "../../apps/server/src/concept-registry-loader.js";
import type { DraftSourceContext } from "./draft-wire.js";

type Selection = Readonly<{ runId: string; branchId: string; nodeId: string; decisionDigest: string;
  context: DraftSourceContext }>;
type GrantedPath = Readonly<{ branchId: string; throughNodeId: string; nodes: readonly Node[] }>;
type Refusal = "invalid_graph" | "invalid_scope" | "stale" | "withheld" | "cancelled" |
  "access" | "no_incoming_edge" | "completed_review_not_modelled";
class ContextRefusal extends Error {
  constructor(readonly reason: Refusal) { super(reason); }
}
function refuse(reason: Refusal): never { throw new ContextRefusal(reason); }

// Validate the ORIGINAL branch before extracting a prefix. No synthetic/trimmed DrillRun.
function prefix(nodes: readonly Node[], branchId: string, throughNodeId: string): GrantedPath {
  const index = nodes.findIndex(node => node.id === throughNodeId);
  if (index < 0) refuse("invalid_scope");
  return Object.freeze({ branchId, throughNodeId, nodes: Object.freeze(nodes.slice(0, index + 1)) });
}
function grantedPaths(run: DrillRun, selection: Selection): readonly GrantedPath[] {
  if (selection.context.kind === "comparison" && selection.branchId === selection.context.otherBranchId) refuse("invalid_scope");
  const requestedBranches = selection.context.kind === "comparison"
    ? [selection.branchId, selection.context.otherBranchId] : [selection.branchId];
  const originals = new Map<string, readonly Node[]>();
  for (const branchId of requestedBranches) {
    const resolved = resolveBranchPath(run, branchId);
    if (resolved.kind !== "resolved") refuse("invalid_graph");
    originals.set(branchId, resolved.nodes);
  }
  // Every requested original branch is valid BEFORE any prefix is extracted.
  const scoped = (branchId: string, nodeId: string) => prefix(originals.get(branchId)!, branchId, nodeId);
  const primary = scoped(selection.branchId, selection.nodeId);
  const selected = primary.nodes.at(-1)!;
  switch (selection.context.kind) {
    case "position": return Object.freeze([Object.freeze({ ...primary, nodes: Object.freeze([selected]) })]);
    case "incoming_edge":
      if (primary.nodes.length === 1) refuse("no_incoming_edge");
      return Object.freeze([Object.freeze({ ...primary, nodes: Object.freeze(primary.nodes.slice(-2)) })]);
    case "recorded_window": return Object.freeze([primary]); // supplier still selects exact windows
    case "branch": {
      const path = scoped(selection.branchId, selection.context.throughNodeId);
      if (!path.nodes.some(node => node.id === selection.nodeId)) refuse("invalid_scope");
      return Object.freeze([path]);
    }
    case "comparison": {
      const peer = scoped(selection.context.otherBranchId, selection.context.otherNodeId);
      for (const path of [primary, peer]) {
        const branch = run.branches.find(value => value.id === path.branchId)!;
        if (!path.nodes.some(node => node.id === branch.forkNodeId)) refuse("invalid_scope");
      }
      // Each endpoint has reached its own fork; actual common-fork/Compare source work is separate.
      return Object.freeze([primary, peer]);
    }
    case "completed_review": return refuse("completed_review_not_modelled");
  }
}

const noProviders = serverAvailabilityFromProviders({ opponent: "none", judge: "none",
  llm: "none", corpus: "none", tts: "none", tablebase: "none" });

function contextModel(storage: SQLiteRunStorage, identity: IdentityService, service: RunService,
  current: () => Readonly<{ cookie: string | null; selection: Selection; requested: RequestedAssistanceV1 }>) {
  function resolveCurrent(signal: AbortSignal) {
    if (signal.aborted) refuse("cancelled");
    const input = current();
    const selection: Selection = Object.freeze({ ...input.selection,
      context: Object.freeze({ ...input.selection.context }) });
    let principal;
    try { principal = identity.authenticate(input.cookie); } catch { return refuse("access"); }
    let access;
    try { access = requireRead(storage, selection.runId, principal); } catch { return refuse("access"); }
    const run = access.stored.run; // full canonical stored image, current—not historical replay
    const decision = moduleDecisionStamp(run);
    if (decision.digest !== selection.decisionDigest) refuse("stale");
    const authority = service.assistanceAuthority(run.id, principal);
    const assistance = finalizeAssistanceEffects(compileAuthoritativeAssistance(input.requested,
      { ...authority, availability: noProviders }), { authority: MODULE_SOURCE_AUTHORITY, availability: noProviders });
    if (!feedbackDeliveryOpen(run) || !assistance.modules.includes("full_inspector") ||
        !assistance.effects.some(effect => effect.moduleId === "full_inspector" &&
          effect.timing === "review" && effect.subSurface === undefined)) refuse("withheld");
    const paths = grantedPaths(run, selection);
    return Object.freeze({ run, principal, role: access.role, decision, assistance, selection, paths });
  }
  return {
    resolve: resolveCurrent,
    async execute<T>(signal: AbortSignal, acquire: (paths: readonly GrantedPath[], signal: AbortSignal) => Promise<T>): Promise<T> {
      const admitted = resolveCurrent(signal);
      const result = await acquire(admitted.paths, signal);
      // Reread actual cookie, grant, assistance, complete current head and selection after await.
      // No retained node/FEN or successful supplier result waives this receiver check.
      const renewed = resolveCurrent(signal);
      if (renewed.principal.learnerId !== admitted.principal.learnerId || renewed.role !== admitted.role ||
          renewed.decision.digest !== admitted.decision.digest ||
          renewed.assistance.finalDigest !== admitted.assistance.finalDigest ||
          JSON.stringify(renewed.selection) !== JSON.stringify(admitted.selection) ||
          JSON.stringify(renewed.paths) !== JSON.stringify(admitted.paths)) refuse("stale");
      return result;
    },
  };
}

const at = "2026-10-14T00:00:00.000Z";
const initial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
let run = createRun({ id: "d3813-recorded-context", session: {
  kind: "position", start: canonicalRunStart({ fen: initial, side: "white" }),
  feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" },
}, sessionDigest: `sha256:${"d".repeat(64)}`, policyConfig: {
  seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] },
}, seed: 1, createdAt: at });
const main = run.activeCursor.branchId;
for (const uci of ["e2e4", "e7e5", "g1f3", "b8c6", "d2d4", "e5d4"]) run = commitMove(run, uci, { at }).run;
const mainPath = branchPath(run, main), shared = mainPath[2]!.id, endpoint = mainPath[3]!.id;
run = rewind(run, shared, at, undefined, main).run;
run = fork(run, shared, { at }).run;
const peer = run.activeCursor.branchId;
for (const uci of ["f1c4", "g8f6"]) run = commitMove(run, uci, { at }).run;
const peerPath = branchPath(run, peer), peerEndpoint = peerPath[3]!.id;
run = rewind(run, shared, at).run;
run = fork(run, shared, { at }).run;
const newest = run.activeCursor.branchId;
for (const uci of ["d2d4", "e5d4"]) run = commitMove(run, uci, { at }).run;
run = rewind(run, shared, at, undefined, main).run;
run = revealFeedback(run, at).run;

const directory = mkdtempSync(join(tmpdir(), "tabiya-d3813-context-"));
let close = () => {};
let checks = 0, acquisitions = 0;
const checked = (predicate: () => void) => { predicate(); checks++; };
const reason = (expected: Refusal) => (error: unknown) => error instanceof ContextRefusal && error.reason === expected;
try {
  const storage = new SQLiteRunStorage(join(directory, "fixture.sqlite"), {
    concepts: { registry: loadConceptRegistry(resolve("content/concepts")) },
  });
  close = () => storage.close();
  const identity = new IdentityService(storage); // real scrypt, random sessions and stored authentication
  const owner = await identity.register({ handle: "d3813-owner", password: "owned-fixture-password" });
  const reader = await identity.register({ handle: "d3813-reader", password: "owned-fixture-password" });
  const stranger = await identity.register({ handle: "d3813-stranger", password: "owned-fixture-password" });
  const ownerPrincipal = identity.authenticate(owner.cookie);
  const lease = { writerId: "d3813-writer", learnerId: ownerPrincipal.learnerId };
  storage.create(run, lease); // actual owner; no __legacy/test-only overload
  const service = new RunService(storage);
  service.updateGrant(run.id, ownerPrincipal, lease.writerId, { op: "grant", handle: reader.learner.handle, role: "spectator" }, at);
  const saved = JSON.stringify(storage.read(run.id)!.run);
  const base: Selection = Object.freeze({ runId: run.id, branchId: main, nodeId: endpoint,
    decisionDigest: moduleDecisionStamp(storage.read(run.id)!.run).digest, context: { kind: "recorded_window" as const } });
  let selection = base, cookie: string | null = owner.cookie;
  let requested = compileAssistanceRequest({ contextHint: "position", preference: {
    kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] },
  } });
  const originalRequested = requested;
  const model = contextModel(storage, identity, service, () => ({ cookie, selection, requested }));
  const signal = new AbortController().signal;
  const selected = (patch: Partial<Selection>) => { selection = Object.freeze({ ...base, ...patch }); };
  const acquire = async (paths: readonly GrantedPath[]) => { acquisitions++; return paths.map(path => path.nodes.map(node => node.id)); };

  checked(() => {
    const admitted = model.resolve(signal);
    assert.equal(JSON.stringify(admitted.run), saved);
    assert.equal(admitted.run.nodes.length, run.nodes.length);
    assert.equal(admitted.paths[0]!.nodes.length, 4);
    assert.equal(admitted.paths[0]!.nodes.at(-1)!.id, endpoint);
    assert.equal(admitted.decision.digest, moduleDecisionStamp(run).digest);
    assert(feedbackDeliveryOpen(admitted.run));
  });
  selected({ context: { kind: "comparison", otherBranchId: peer, otherNodeId: peerEndpoint } });
  checked(() => assert.deepEqual(model.resolve(signal).paths.map(path => [path.branchId, path.throughNodeId]), [[main, endpoint], [peer, peerEndpoint]]));
  checked(() => assert.notEqual(model.resolve(signal).paths[1]!.branchId, newest));
  selected({ context: { kind: "comparison", otherBranchId: peer, otherNodeId: shared } });
  checked(() => assert.equal(model.resolve(signal).paths[1]!.nodes.at(-1)!.id, shared));
  selected({ branchId: peer, nodeId: shared, context: { kind: "position" } });
  checked(() => { const context = model.resolve(signal); assert.equal(context.paths[0]!.nodes[0]!.id, shared); assert.notEqual(context.paths[0]!.nodes[0]!.branchId, peer); });
  selected({ context: { kind: "incoming_edge" } });
  checked(() => assert.deepEqual(model.resolve(signal).paths[0]!.nodes.map(node => node.id), mainPath.slice(2, 4).map(node => node.id)));
  // Existing sole edge factory receives precisely the admitted committed edge; no whole-tip
  // operation, filtered source receipt or synthetic run is needed for this local source family.
  const localEvents = await model.execute(signal, async (paths, sourceSignal) => {
    assert.equal(sourceSignal, signal);
    const [before, after] = paths[0]!.nodes;
    assert(before && after && after.moveUci);
    acquisitions++;
    return invokeEvidenceValueRoute("rules.mobility.event.piece_destinations@1", {
      beforeFen: before.fen, moveUci: after.moveUci, afterFen: after.fen,
    });
  });
  checked(() => {
    assert(localEvents.length > 0, "positive control did not acquire real mobility events");
    const expected = invokeEvidenceValueRoute("rules.mobility.event.piece_destinations@1", {
      beforeFen: mainPath[2]!.fen, moveUci: mainPath[3]!.moveUci!, afterFen: mainPath[3]!.fen,
    });
    assert.deepEqual(localEvents, expected);
    for (const event of localEvents) { assertDeclaredEvidence(event); assert(evidenceValueReceipt(event)); }
  });
  selected({ nodeId: mainPath[0]!.id, context: { kind: "incoming_edge" } });
  checked(() => assert.throws(() => model.resolve(signal), reason("no_incoming_edge")));
  selected({ context: { kind: "branch", throughNodeId: mainPath[2]!.id } });
  checked(() => assert.throws(() => model.resolve(signal), reason("invalid_scope")));
  selected({ nodeId: peerEndpoint });
  checked(() => assert.throws(() => model.resolve(signal), reason("invalid_scope")));
  selected({ context: { kind: "comparison", otherBranchId: main, otherNodeId: endpoint } });
  checked(() => assert.throws(() => model.resolve(signal), reason("invalid_scope")));
  selected({ context: { kind: "comparison", otherBranchId: peer, otherNodeId: mainPath[1]!.id } });
  checked(() => assert.throws(() => model.resolve(signal), reason("invalid_scope")));
  selected({ context: { kind: "completed_review", throughNodeId: endpoint } });
  checked(() => assert.throws(() => model.resolve(signal), reason("completed_review_not_modelled")));
  selected({});
  checked(() => assert.throws(() => grantedPaths({ ...run, nodes: [...run.nodes, run.nodes.at(-1)!] }, base), reason("invalid_graph")));
  checked(() => assert.throws(() => grantedPaths({ ...run, nodes: run.nodes.map(node => node.id === mainPath.at(-1)!.id ? { ...node, parentId: "missing" } : node) }, base), reason("invalid_graph")));
  checked(() => assert.throws(() => grantedPaths({ ...run, nodes: run.nodes.map(node => node.id === mainPath.at(-1)!.id ? { ...node, parentId: node.id } : node) }, base), reason("invalid_graph")));
  checked(() => assert.throws(() => grantedPaths({ ...run, branches: [...run.branches, run.branches[0]!] }, base), reason("invalid_graph")));
  checked(() => assert.deepEqual(grantedPaths({ ...run, nodes: [...run.nodes].reverse() }, base), grantedPaths(run, base)));

  // Real authentication/access refusal before invoking even the disposable acquisition callback.
  for (const deniedCookie of [null, "__Host-tabiya_session=invalid", stranger.cookie]) {
    cookie = deniedCookie;
    const before = acquisitions;
    await assert.rejects(model.execute(signal, acquire), reason("access")); checks++;
    checked(() => assert.equal(acquisitions, before));
  }
  cookie = reader.cookie;
  checked(() => assert.equal(model.resolve(signal).principal.learnerId, reader.learner.id));
  cookie = owner.cookie;
  checked(() => assert.equal(JSON.stringify(storage.read(run.id)!.run), saved));

  // Actually suspend and resume acquisition; mutation occurs while the callback is pending.
  async function late(expected: Refusal, mutate: () => void) {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    let started = false;
    const pending = model.execute(signal, async paths => { acquisitions++; started = true; await gate; return paths; });
    assert(started);
    mutate(); release();
    await assert.rejects(pending, reason(expected)); checks++;
  }
  await late("stale", () => selected({ nodeId: mainPath[2]!.id })); selected({});
  // Same path, changed source context: capture bytes, not a retained mutable request object.
  const mutableContext = { kind: "branch" as const, throughNodeId: endpoint };
  selected({ context: mutableContext });
  await late("stale", () => {
    Reflect.set(mutableContext, "kind", "recorded_window");
    Reflect.deleteProperty(mutableContext, "throughNodeId");
  }); selected({});
  await late("withheld", () => { requested = compileAssistanceRequest({ contextHint: "position", preference: {
    kind: "explicit", preset: "quiet", overrides: {}, moduleOverrides: { include: [], exclude: [] },
  } }); }); requested = originalRequested;
  await late("stale", () => { requested = compileAssistanceRequest({ contextHint: "position", preference: {
    kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: ["theory_breadcrumb"] },
  } }); }); requested = originalRequested;
  cookie = reader.cookie;
  await late("stale", () => service.updateGrant(run.id, ownerPrincipal, lease.writerId, { op: "grant", handle: reader.learner.handle, role: "participant" }, at));
  service.updateGrant(run.id, ownerPrincipal, lease.writerId, { op: "grant", handle: reader.learner.handle, role: "spectator" }, at);
  await late("access", () => service.updateGrant(run.id, ownerPrincipal, lease.writerId, { op: "revoke", handle: reader.learner.handle }));
  service.updateGrant(run.id, ownerPrincipal, lease.writerId, { op: "grant", handle: reader.learner.handle, role: "spectator" }, at);
  await late("stale", () => { cookie = owner.cookie; });
  await late("access", () => { identity.logout(cookie); });
  cookie = (await identity.login(owner.learner.handle, "owned-fixture-password")).cookie;
  const cancellation = new AbortController();
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const cancelled = model.execute(cancellation.signal, async paths => { acquisitions++; await gate; return paths; });
  cancellation.abort(); release();
  await assert.rejects(cancelled, reason("cancelled")); checks++;
  const beforeCancelled = acquisitions;
  await assert.rejects(model.execute(cancellation.signal, acquire), reason("cancelled")); checks++;
  checked(() => assert.equal(acquisitions, beforeCancelled));
  checked(() => assert.equal(JSON.stringify(storage.read(run.id)!.run), saved));

  // A genuine sibling write retires the request even though its requested main prefix is unchanged.
  await late("stale", () => {
    let changed = rewind(storage.read(run.id)!.run, branchPath(run, newest).at(-1)!.id, at, undefined, newest).run;
    changed = commitMove(changed, "f1c4", { at }).run;
    storage.save(changed, lease);
  });
  checked(() => assert.deepEqual(branchPath(storage.read(run.id)!.run, main), mainPath));
  const now = storage.read(run.id)!.run;
  selected({ decisionDigest: moduleDecisionStamp(now).digest });
  const beforeWithheld = acquisitions;
  await assert.rejects(model.execute(signal, acquire), reason("withheld")); checks++;
  checked(() => assert.equal(acquisitions, beforeWithheld));
  const reopened = revealFeedback(now, at).run; storage.save(reopened, lease);
  selected({ decisionDigest: moduleDecisionStamp(reopened).digest });
  const beforeFinal = JSON.stringify(storage.read(run.id)!.run);
  assert.deepEqual(await model.execute(signal, acquire), [mainPath.slice(0, 4).map(node => node.id)]); checks++;
  checked(() => assert.equal(JSON.stringify(storage.read(run.id)!.run), beforeFinal));
  console.log(JSON.stringify({ scope: "D3813 disposable context/receiver author model; NOT source execution or HTTP/native proof",
    checks, accounts: 3, actualSessionsAndGrants: true, originalFullRunRetained: true,
    mainWholeNodes: mainPath.length, grantedMainNodes: 4, requestedPeerNotNewest: true,
    lateSelectionPreferenceGrantIdentityLogoutHeadAndCancellationRefuse: true,
    realLocalMobilityEvents: localEvents.length, completedReviewNotModelled: true,
    providersConfigured: 0, storedBytesUnchangedByReads: true }));
} finally {
  try { close(); } finally { rmSync(directory, { recursive: true, force: true }); }
}
