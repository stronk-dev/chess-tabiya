// DISPOSABLE D3825: actual pivotal payload source, NOT a scoped factory, permission or packet.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import {
  createRun, canonicalRunStart, commitMove, appendOpponentPly, rewind, fork, branchPath, exactLegalMoves,
  type DrillRun,
} from "../../packages/runtime/src/index.js";
import { pivotalMarkerPayloads, type PivotalMarker } from "../../packages/runtime/src/pivotal.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { SQLiteRunStorage } from "../../apps/server/src/storage.js";
import { loadConceptRegistry } from "../../apps/server/src/concept-registry-loader.js";
import { importedPopulation } from "../research-chess/populations.js";

const at = "2026-10-15T00:00:00.000Z";
const start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
function recorded(id: string, fen: string, moves: readonly string[]) {
  let run = createRun({ id, session: { kind: "position", start: canonicalRunStart({ fen, side: "white" }),
    feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: `sha256:${"d".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  for (const uci of moves) run = commitMove(run, uci, { at }).run;
  return run;
}
function scoped(run: DrillRun, branch: string, through: string): readonly PivotalMarker[] {
  // The extra argument is supported only by the guarded disposable bundle, not production.
  return Reflect.apply(pivotalMarkerPayloads, undefined, [run, branch, through]);
}
const simple = recorded("d3825-opening", start, ["e2e4", "e7e5", "g1f3", "b8c6", "d2d4", "e5d4"]);
if (process.argv[2] === "baseline") {
  assert.deepEqual(scoped(simple, simple.activeCursor.branchId, simple.nodes[0]!.id), [],
    "whole-tip pivotal source is not requested-prefix acquisition");
  throw new Error("baseline unexpectedly satisfies source scope");
}
assert.equal(process.argv[2], "candidate");
const runs: DrillRun[] = [simple,
  recorded("d3825-queen", "4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1", ["e2e7"]),
  recorded("d3825-phase", "r2qk2r/8/8/8/8/8/8/R2QK2R w - - 0 1", ["d1d8", "e8d8"]),
];

// Use existing legal CC0 game paths, not disconnected synthetic FEN nodes, for rare collapse.
let corpusPathsExamined = 0;
for (const rows of importedPopulation().paths) {
  corpusPathsExamined++;
  const fens = [rows[0]!.parentFen, ...rows.map(row => row.fen)];
  const counts = fens.map(fen => exactLegalMoves(fen).length);
  const first = counts.findIndex((count, i) => i >= 2 && i + 2 < counts.length
    && counts[i - 2]! >= 8 && count <= 3 && counts[i + 2]! <= 3);
  if (first < 0) continue;
  const run = recorded(`d3825-cc0-${corpusPathsExamined}`, fens[0]!, rows.slice(0, first + 2).map(row => row.uci));
  assert(pivotalMarkerPayloads(run, run.activeCursor.branchId).some(marker => marker.kind === "option_collapse"),
    "legal corpus control must emit its actual collapse");
  runs.push(run);
  if (runs.length === 5) break;
}
assert.equal(runs.length, 5, "two actual legal collapse paths are required; do not substitute synthetic nodes");

// Synthetic distribution metadata recorded through actual runtime commits; NOT live Maia data.
let distribution = recorded("d3825-distribution", start, ["e2e4"]);
distribution = appendOpponentPly(distribution, { moveUci: "e7e5", policyModeApplied: "human_common",
  candidates: ["e7e5", "c7c5", "e7e6", "c7c6", "d7d5"].map((moveUci, rank) => ({ moveUci, rank: rank + 1, mass: [.31, .24, .19, .16, .1][rank]! })),
  engine: { id: "d3825-synthetic-maia", name: "Synthetic distribution control", version: "research", seedHonored: false } }, { at }).run;
runs.push(distribution);
const strong = recorded("d3825-strong", start, ["e2e4"]);
runs.push(appendOpponentPly(strong, { moveUci: "e7e5", policyModeApplied: "strong_engine",
  candidates: ["e7e5", "c7c5", "e7e6", "c7c6", "d7d5"].map((moveUci, rank) => ({ moveUci, rank: rank + 1, mass: .2 })),
  engine: { id: "d3825-synthetic-strong", name: "Synthetic strong control", version: "research", seedHonored: false } }, { at }).run);

const directory = mkdtempSync(join(tmpdir(), "tabiya-d3825-pivotal-source-"));
const storage = new SQLiteRunStorage(join(directory, "fixture.sqlite"), { concepts: { registry: loadConceptRegistry(resolve("content/concepts")) } });
let controls = 0, prefixes = 0, futureCollapsesRefused = 0, fullMarkers = 0, crossedHumanInputs = 0;
const kinds = new Set<string>();
const checked = (action: () => void) => { action(); controls++; };
try {
  for (const source of runs) {
    storage.create(source, "d3825-disposable-source-writer"); // test storage overload, NOT access proof
    const run = storage.read(source.id)!.run, branch = run.activeCursor.branchId;
    const saved = JSON.stringify(run), path = branchPath(run, branch);
    const full = pivotalMarkerPayloads(run, branch);
    if (run.id === "d3825-strong") checked(() => assert(!full.some(marker => marker.kind === "human_divergence")));
    fullMarkers += full.length;
    for (const item of full) kinds.add(item.kind);
    for (let end = 0; end < path.length; end++) {
      const granted = path.slice(0, end + 1), ids = new Set(granted.map(node => node.id));
      const actual = scoped(run, branch, path[end]!.id);
      const expected = full.filter(marker => {
        if (!ids.has(marker.nodeId)) return false;
        if (marker.kind !== "option_collapse") return true;
        const sameSide = path.filter(node => node.fen.split(" ")[1] === (marker.detail as { color: string }).color[0]);
        const index = sameSide.findIndex(node => node.id === marker.nodeId);
        const later = sameSide[index + 1];
        if (later !== undefined && !ids.has(later.id)) { futureCollapsesRefused++; return false; }
        return true;
      });
      checked(() => assert.deepEqual(actual, expected, "complete ordered payload population must obey every witness, not marker position alone"));
      checked(() => assert.equal(JSON.stringify(run), saved));
      prefixes++;
    }
    checked(() => assert.deepEqual(scoped(run, branch, path.at(-1)!.id), full));
    checked(() => assert.throws(() => scoped(run, branch, "foreign"), /endpoint/u));
    for (const malformed of [
      { ...run, nodes: [...run.nodes, path.at(-1)!] },
      { ...run, nodes: run.nodes.map(node => node.id === path.at(-1)!.id ? { ...node, parentId: node.id } : node) },
      { ...run, nodes: run.nodes.map(node => node.id === path.at(-1)!.id ? { ...node, parentId: "missing" } : node) },
      { ...run, branches: [...run.branches, run.branches[0]!] },
    ]) checked(() => assert.throws(() => scoped(malformed, branch, path[0]!.id)));
    if (run.id === "d3825-opening") {
      let retry = rewind(run, path[2]!.id, at, undefined, branch).run;
      retry = fork(retry, path[2]!.id, { at }).run;
      retry = commitMove(retry, "f1c4", { at }).run;
      const alternate = retry.activeCursor.branchId;
      checked(() => assert.deepEqual(scoped(retry, alternate, path[1]!.id), scoped(run, branch, path[1]!.id)));
      checked(() => assert.throws(() => scoped(retry, alternate, path.at(-1)!.id), /endpoint/u));
      checked(() => assert.deepEqual(scoped(retry, branch, path[2]!.id), scoped(run, branch, path[2]!.id)));
    }
  }
  assert(futureCollapsesRefused > 0, "a later-witness negative must actually fire");
  assert(kinds.has("phase_change") && kinds.has("irreversibility") && kinds.has("option_collapse") && kinds.has("human_divergence"));
  // Actual shared-node retry, synthetic recorded distributions: each marker's declared
  // source must retain the exact selection that produced it, not the newest at that node.
  const originalDistribution = storage.read(distribution.id)!.run;
  const shared = branchPath(originalDistribution, originalDistribution.activeCursor.branchId)[1]!;
  let changed = rewind(originalDistribution, shared.id, at).run;
  changed = fork(changed, shared.id, { at }).run;
  changed = appendOpponentPly(changed, { moveUci: "c7c5", policyModeApplied: "human_common",
    candidates: ["c7c5", "e7e5", "e7e6", "c7c6", "d7d5"].map((moveUci, rank) => ({ moveUci, rank: rank + 1, mass: [.4, .25, .2, .1, .05][rank]! })),
    engine: { id: "d3826-synthetic-second", name: "Second synthetic distribution", version: "research", seedHonored: false } }, { at }).run;
  storage.save(changed, "d3825-disposable-source-writer");
  const branched = storage.read(changed.id)!.run;
  const sourceBytes = JSON.stringify(branched);
  for (const branchId of [branched.branches[0]!.id, branched.activeCursor.branchId]) {
    const emitted = invokeEvidenceValueRoute("derived.pivotal.human_divergence@1", { run: branched, branchId });
    checked(() => assert.equal(emitted.length, 2, "current source must reproduce both branch selections at the shared node"));
    const crossed = emitted.filter(item => {
      const page = item.inputs.find(input => input.projection.id === "human.maia.policy")!.payload as { engine: { id: string } };
      return (item.evidence.payload.detail as { engine: { id: string } }).engine.id !== page.engine.id;
    });
    checked(() => assert.equal(crossed.length, 0, "each marker must retain its own complete recorded source"));
    crossedHumanInputs += crossed.length;
  }
  checked(() => assert.equal(JSON.stringify(storage.read(changed.id)!.run), sourceBytes));
  console.log(JSON.stringify({ scope: "D3825 payload-owner model, NOT permission, scoped factory, full Review or production", controls, prefixes,
    fullMarkers, futureCollapsesRefused, corpusPathsExamined, kinds: [...kinds].sort(), crossedHumanInputs }));
} finally { storage.close(); rmSync(directory, { recursive: true, force: true }); }
