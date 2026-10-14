// DISPOSABLE D3814: observe the actual bundled query's supplier branch, not a copied selector.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRun, canonicalRunStart, commitMove, rewind, fork, revealFeedback, branchPath,
  compileAssistanceRequest, compileAuthoritativeAssistance, finalizeAssistanceEffects,
  serverAvailabilityFromProviders, MODULE_SOURCE_AUTHORITY } from "../../packages/runtime/src/index.js";
import * as candidateQuery from "../../packages/runtime/src/module-query.js";
import { SQLiteRunStorage } from "../../apps/server/src/storage.js";
import { loadConceptRegistry } from "../../apps/server/src/concept-registry-loader.js";

const at = "2026-10-14T00:00:00.000Z";
let run = createRun({ id: "d3814-child-source", session: { kind: "position",
  start: canonicalRunStart({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "white" }),
  feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" },
}, sessionDigest: `sha256:${"b".repeat(64)}`, policyConfig: { seedMode: "fixed",
  locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
const main = run.activeCursor.branchId;
for (const uci of ["e2e4", "e7e5", "g1f3", "b8c6", "d2d4", "e5d4"]) run = commitMove(run, uci, { at }).run;
const mainPath = branchPath(run, main), shared = mainPath[2]!.id;
run = rewind(run, shared, at, undefined, main).run;
run = fork(run, shared, { at }).run;
const child = run.activeCursor.branchId;
for (const uci of ["f1c4", "g8f6"]) run = commitMove(run, uci, { at }).run;
run = revealFeedback(run, at).run;
const directory = mkdtempSync(join(tmpdir(), "tabiya-d3814-branch-"));
let close = () => {};
try {
  const storage = new SQLiteRunStorage(join(directory, "fixture.sqlite"), {
    concepts: { registry: loadConceptRegistry(resolve("content/concepts")) }, onMigration: () => {},
  }); close = () => storage.close();
  storage.create(run, "d3814-writer"); // storage source probe only; no authentication claim
  const stored = storage.read(run.id)!.run, saved = JSON.stringify(stored);
  const requested = compileAssistanceRequest({ contextHint: "position", preference: {
    kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] },
  } });
  const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
  const assistance = finalizeAssistanceEffects(compileAuthoritativeAssistance(requested, {
    origin: { kind: "run", sessionKind: "position", feedbackPolicy: "attempt_end" },
    access: { deliveryOpen: true, role: "solo", seatedInContest: false, reviewing: false }, availability,
  }), { authority: MODULE_SOURCE_AUTHORITY, availability });
  const observed: unknown = Reflect.get(candidateQuery, "__D3814_BRANCH_OBSERVER");
  assert(Array.isArray(observed), "only the opt-in observer bundle may run this probe");
  let queries = 0;
  for (const [nodeId, expectedBranch] of [
    [stored.activeCursor.nodeId, child], [shared, child], [mainPath[0]!.id, child], [mainPath[3]!.id, main],
  ]) {
    const before: number = observed.length;
    candidateQuery.queryModules({ run: stored, assistance, role: "learner", session: "position",
      request: { timing: "review", nodeId: nodeId!, requested: ["full_inspector"] } });
    assert.equal(observed.length, before + 1);
    assert.equal(observed.at(-1), expectedBranch, `selected ${nodeId} supplied the creating branch rather than current path`);
    assert.equal(JSON.stringify(storage.read(run.id)!.run), saved);
    queries++;
  }
  console.log(JSON.stringify({ scope: "D3814 actual disposable query supplier selection; NOT explicit endpoint or production delivery",
    queries, childOwnAndInheritedNodes: true, offPathCreatingBranchFallback: true, storedBytesUnchanged: true }));
} finally {
  try { close(); } finally { rmSync(directory, { recursive: true, force: true }); }
}
