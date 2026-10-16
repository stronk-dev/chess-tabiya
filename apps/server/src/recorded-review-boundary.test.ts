// Real import/parser/SQLite ownership for the internal source, not a new HTTP/API completion.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { branchPath, commitMove, fork, rewind } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";
import { invokeEvidenceValueRoute } from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { createRecordedReviewBoundarySourceOwner, readRecordedReviewBoundary } from "../../../packages/runtime/src/recorded-review-boundary.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const stores: SQLiteRunStorage[] = [], directories: string[] = [];
afterEach(() => { for (const store of stores.splice(0)) store.close(); for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });
const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };
function ownerFor(storage: SQLiteRunStorage) {
  return createRecordedReviewBoundarySourceOwner({ loadRun: id => storage.read(id)?.run, loadImportRecord: id => {
    const record = storage.importedGame(id);
    return record === undefined ? undefined : { runId: record.runId, result: record.result, movetextDigest: record.movetextDigest };
  } });
}
function open(path: string) { const storage = new SQLiteRunStorage(path, { onMigration: () => {} }); stores.push(storage); return storage; }

describe("recorded Review source over actual parsed SQLite imports", () => {
  it.each(["white", "black"] as const)("retains every earlier endpoint across save/reload without acquiring providers: %s", async side => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-review-boundary-")); directories.push(directory);
    const path = join(directory, "runs.sqlite"), storage = open(path), service = new RunService(storage);
    const imported = await service.importGame({ id: `recorded-boundary-${side}`, side, opponentPolicy: { mode: "human_common" }, policyConfig, seed: 1,
      source: { kind: "pgn", pgn: '[Result "0-1"]\n\n1. e4 e5 2. Nf3 Nc6 0-1' } }, "writer");
    const run = storage.read(imported.run.id)!.run, branchId = run.branches[0]!.id, nodes = branchPath(run, branchId);
    const issuer = ownerFor(storage), request = { runId: run.id, branchId, throughNodeId: nodes[1]!.id };
    const boundary = issuer.resolve(request), image = readRecordedReviewBoundary(boundary);
    expect(image.importRecord).toEqual({ runId: run.id, result: "0-1", movetextDigest: imported.importRecord.movetextDigest });
    expect(image.outcome).toEqual({ kind: "unfinished" }); expect(image.run.events).toEqual(run.events);
    service.reveal(run.id, "writer");
    expect(() => issuer.assertCurrent(boundary)).toThrow(/no longer/u);
    storage.close(); stores.splice(stores.indexOf(storage), 1);
    const reloaded = open(path), newIssuer = ownerFor(reloaded), after = reloaded.read(run.id)!.run;
    for (const [index, node] of nodes.entries()) {
      const scoped = newIssuer.resolve({ ...request, throughNodeId: node.id }), source = readRecordedReviewBoundary(scoped);
      expect(source.run).toEqual(after); expect(source.learnerSide).toBe(side);
      expect(source.path.map(entry => entry.node.id)).toEqual(nodes.slice(0, index + 1).map(entry => entry.id));
      const result = invokeEvidenceValueRoute("run.record.imported_result@1", { recordedReview: scoped });
      expect(result).toHaveLength(index === nodes.length - 1 ? 1 : 0);
    }
    expect(() => newIssuer.assertCurrent(boundary)).toThrow(/foreign/u);
    // Both resolution and source minting leave the durable events exactly unchanged.
    expect(reloaded.read(run.id)!.run.events).toEqual(after.events);
    expect(imported.evidencePass.jobs).toBe(0);
  });

  it("distinguishes the original imported endpoint from persisted rehearsal branches", async () => {
    const storage = open(":memory:"), service = new RunService(storage);
    const imported = await service.importGame({ id: "recorded-retry", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 1,
      source: { kind: "pgn", pgn: '[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 1-0' } }, "writer");
    const main = imported.run.branches[0]!.id, nodes = branchPath(imported.run, main);
    const forked = fork(rewind(storage.read(imported.run.id)!.run, nodes[2]!.id).run, nodes[2]!.id).run;
    const run = commitMove(forked, "f1c4").run;
    storage.save(run, { writerId: "writer", learnerId: "__legacy" });
    const owner = ownerFor(storage);
    for (const node of branchPath(run, run.activeCursor.branchId)) {
      const boundary = owner.resolve({ runId: run.id, branchId: run.activeCursor.branchId, throughNodeId: node.id });
      expect(readRecordedReviewBoundary(boundary).outcome).toEqual({ kind: "unfinished" });
      expect(invokeEvidenceValueRoute("run.record.imported_result@1", { recordedReview: boundary })).toEqual([]);
    }
    const original = owner.resolve({ runId: run.id, branchId: main, throughNodeId: nodes.at(-1)!.id });
    expect(invokeEvidenceValueRoute("run.record.imported_result@1", { recordedReview: original })[0]!.evidence.payload).toEqual({ context: "story", result: "1-0" });
  });

  it("D3878 refuses an actual below-service mainline extension after SQLite save", async () => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-review-extension-")); directories.push(directory);
    const path = join(directory, "runs.sqlite"), storage = open(path), service = new RunService(storage);
    const imported = await service.importGame({ id: "extended-import", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 1,
      source: { kind: "pgn", pgn: '[Result "1-0"]\n\n1. e4 e5 1-0' } }, "writer");
    const owner = ownerFor(storage), run = storage.read(imported.run.id)!.run;
    const request = { runId: run.id, branchId: run.branches[0]!.id, throughNodeId: run.activeCursor.nodeId }, original = owner.resolve(request);
    expect(invokeEvidenceValueRoute("run.record.imported_result@1", { recordedReview: original })).toHaveLength(1);
    // This path deliberately bypasses the service guard, while retaining real event replay and
    // production storage parsing. Source admission must independently catch it.
    const extended = commitMove(run, "g1f3").run;
    storage.save(extended, { writerId: "writer", learnerId: "__legacy" });
    expect(() => owner.assertCurrent(original)).toThrow(/movetext/u);
    for (const node of branchPath(extended, request.branchId)) {
      expect(() => owner.resolve({ ...request, throughNodeId: node.id })).toThrow(/movetext/u);
    }
    expect(storage.importedGame(run.id)!.movetextDigest).toBe(imported.importRecord.movetextDigest);
    storage.close(); stores.splice(stores.indexOf(storage), 1);
    const reloaded = open(path), reloadedOwner = ownerFor(reloaded);
    for (const node of branchPath(reloaded.read(run.id)!.run, request.branchId)) {
      expect(() => reloadedOwner.resolve({ ...request, throughNodeId: node.id })).toThrow(/movetext/u);
    }
  });
});
