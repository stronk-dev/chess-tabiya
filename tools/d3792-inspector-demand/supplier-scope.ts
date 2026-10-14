// DISPOSABLE D3805 supplier-boundary research. Actual runtime + SQLite, no new source mint/API.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  createRun, canonicalRunStart, commitMove, rewind, fork, revealFeedback, projectRun,
  branchPath, compareBranches, moduleComparisonForSubject, moduleDecisionStamp, feedbackDeliveryOpen,
  createReviewPrefixAuthority, assertReviewRecordedPrefixReceipt, recordedSemanticPath,
  pivotalMarkerEvidenceItems, resolveBranchPath,
} from "../../packages/runtime/src/index.js";
import { SQLiteRunStorage } from "../../apps/server/src/storage.js";
import { loadConceptRegistry } from "../../apps/server/src/concept-registry-loader.js";

const at = "2026-10-14T00:00:00.000Z";
const initial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
let run = createRun({ id: "d3805-scoped-supplier", session: {
  kind: "position", start: canonicalRunStart({ fen: initial, side: "white" }),
  feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" },
}, sessionDigest: `sha256:${"c".repeat(64)}`, policyConfig: {
  seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] },
}, seed: 1, createdAt: at });
const main = run.activeCursor.branchId;
for (const uci of ["e2e4", "e7e5", "g1f3", "b8c6", "d2d4", "e5d4"]) run = commitMove(run, uci, { at }).run;
const mainPath = branchPath(run, main);
const shared = mainPath[2]!.id, mainEnd = mainPath[3]!.id;
run = rewind(run, shared, at, undefined, main).run;
run = fork(run, shared, { at }).run;
const chosen = run.activeCursor.branchId;
for (const uci of ["f1c4", "g8f6"]) run = commitMove(run, uci, { at }).run;
const chosenPath = branchPath(run, chosen), chosenEnd = chosenPath[3]!.id;
run = rewind(run, shared, at).run;
run = fork(run, shared, { at }).run;
const newest = run.activeCursor.branchId;
for (const uci of ["d2d4", "e5d4"]) run = commitMove(run, uci, { at }).run;
run = rewind(run, shared, at, undefined, main).run;
run = revealFeedback(run, at).run;
assert(feedbackDeliveryOpen(run));
const directory = mkdtempSync(join(tmpdir(), "tabiya-d3805-supplier-"));
let closeStorage = () => {};
try {
  const storage = new SQLiteRunStorage(join(directory, "fixture.sqlite"), {
    concepts: { registry: loadConceptRegistry(resolve("content/concepts")) },
  });
  closeStorage = () => storage.close();
  const writer = "d3805-tool-writer"; // accepted test-only storage overload, NOT authentication proof
  storage.create(run, writer);
  const stored = storage.read(run.id)!.run;
  const saved = JSON.stringify(stored), currentDecision = moduleDecisionStamp(stored);
  assert.deepEqual(stored.events, run.events);

  // Current point selection does not bound any of these actual whole-branch suppliers.
  const automatic = moduleComparisonForSubject(stored, mainEnd)!;
  assert.equal(automatic.columns[0]!.branchId, main);
  assert.equal(automatic.columns[1]!.branchId, newest);
  assert.notEqual(automatic.columns[1]!.branchId, chosen);
  assert(branchPath(stored, chosen).some(node => node.id === shared && node.branchId !== chosen), "inherited-prefix control did not meet a shared node");
  const explicit = compareBranches(stored, [main, chosen]);
  assert.deepEqual(explicit.columns.map(column => column.branchId), [main, chosen]);
  assert.notEqual(explicit.columns[0]!.leafNodeId, mainEnd);
  assert.notEqual(explicit.columns[1]!.leafNodeId, chosenEnd);
  assert.equal(explicit.columns[0]!.leafNodeId, mainPath.at(-1)!.id);
  assert.equal(explicit.columns[1]!.leafNodeId, chosenPath.at(-1)!.id);
  const semantic = recordedSemanticPath(stored, main);
  assert.equal(semantic.kind, "available");
  if (semantic.kind !== "available") assert.fail("genuine stored path refused");
  assert.equal(semantic.pathNodeIds.length, mainPath.length);
  assert.notEqual(semantic.pathNodeIds.at(-1), mainEnd);
  const permittedIds = new Set(mainPath.slice(0, 4).map(node => node.id));
  const markerItems = pivotalMarkerEvidenceItems(stored, main);
  assert(markerItems.some(item => !permittedIds.has(item.payload.nodeId)), "future-marker control did not emit");

  // Existing sole storage-authorised Review constructor is explicitly whole branch, not endpoints.
  let reads = 0;
  const authorize = createReviewPrefixAuthority({ loadRun: id => { reads++; return storage.read(id)?.run; }, loadImportRecord: () => undefined });
  const subject = authorize({ runId: run.id, branchId: main });
  assert.equal(subject.tipNodeId, mainPath.at(-1)!.id);
  assertReviewRecordedPrefixReceipt(subject);
  const beforeInvalid = reads;
  assert.throws(() => Reflect.apply(authorize, undefined, [{ runId: run.id, branchId: main, throughNodeId: mainEnd }]), /exactly/u);
  assert.equal(reads, beforeInvalid, "unsupported scope read storage before refusal");

  // A genuine chronological replay loses later current disclosure and both saved alternatives.
  const endpointEvent = stored.events.find(event => event.type === "move.committed" && event.data.node.id === mainEnd)!;
  const chronological = projectRun(stored.events.filter(event => event.seq <= endpointEvent.seq));
  assert.equal(branchPath(chronological, main).at(-1)!.id, mainEnd);
  assert.equal(feedbackDeliveryOpen(chronological), false);
  assert.equal(chronological.branches.length, 1);
  assert.throws(() => compareBranches(chronological, [main, chosen]));
  assert.notEqual(moduleDecisionStamp(chronological).digest, currentDecision.digest);
  assert.equal(JSON.stringify(storage.read(run.id)!.run), saved);

  // Scope boundaries cannot hide an invalid canonical graph, nor repair its duplicate ids.
  const malformed = { ...stored, nodes: [...stored.nodes, stored.nodes.at(-1)!] };
  const invalid = resolveBranchPath(malformed, main);
  assert.equal(invalid.kind, "refused");
  if (invalid.kind === "refused") assert.equal(invalid.reason, "duplicate_node_id");

  // A real sibling write invalidates current authority even while the main path stays identical.
  const newestEnd = branchPath(stored, newest).at(-1)!.id;
  let changed = rewind(stored, newestEnd, at, undefined, newest).run;
  changed = commitMove(changed, "f1c4", { at }).run;
  storage.save(changed, writer);
  assert.deepEqual(branchPath(storage.read(run.id)!.run, main), mainPath);
  assert.equal(feedbackDeliveryOpen(storage.read(run.id)!.run), false);
  assert.throws(() => assertReviewRecordedPrefixReceipt(subject), error => error instanceof Error && "code" in error && error.code === "REVIEW_PREFIX_REFUSED");
  const renewed = authorize({ runId: run.id, branchId: main });
  assertReviewRecordedPrefixReceipt(renewed);
  assert.notEqual(renewed.subjectDigest, subject.subjectDigest);
  console.log(JSON.stringify({ scope: "D3805 actual runtime/SQLite supplier boundaries; NOT authentication, source-scope mint or production endpoint",
    branches: stored.branches.length, mainPathNodes: mainPath.length, requestedMainNodes: permittedIds.size,
    automaticPeerIsRequested: automatic.columns[1]!.branchId === chosen,
    explicitComparisonUsesWholeTips: true, semanticUsesWholeTip: true, reviewUsesWholeTip: true,
    historicalReplayLosesCurrentReveal: true, historicalReplayLosesLaterAlternatives: true,
    markersBeyondRequestedEndpoint: markerItems.filter(item => !permittedIds.has(item.payload.nodeId)).length,
    originalStoredBytesPreserved: true, malformedWholeGraphRefuses: true, actualStorageAdvanceRetiresSubject: true }));
} finally {
  try { closeStorage(); } finally { rmSync(directory, { recursive: true, force: true }); } // only this owned temporary fixture
}
