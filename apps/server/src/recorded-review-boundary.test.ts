// Real import/parser/SQLite ownership for the internal source, not a new HTTP/API completion.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { branchPath, commitMove, fork, rewind, reviewDurableEngineStates } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";
import { invokeEvidenceValueRoute } from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { createRecordedReviewBoundarySourceOwner, readRecordedReviewBoundary } from "../../../packages/runtime/src/recorded-review-boundary.js";
import { collectRecordedLastLevelPopulation, readRecordedLastLevelPopulation, collectRecordedReviewSourcePopulation, readRecordedReviewSourcePopulation } from "../../../packages/runtime/src/review-evidence.js";
import { collectRecordedReviewMoments, readRecordedReviewMoments, readRecordedReviewMomentOperands, recordedReviewMomentSourceImage } from "../../../packages/runtime/src/recorded-review-moments.js";
import { readStoryRankReductionValue } from "../../../packages/runtime/src/internal/story-rank-reduction-authority.js";
import { evidenceDigest } from "../../../packages/runtime/src/evidence-contract.js";
import { rankStoryMoments } from "../../../packages/runtime/src/story.js";
import { collectRecordedEngineAttachments, readRecordedEngineAttachments } from "../../../packages/runtime/src/internal/recorded-engine-attachments.js";
import { recordedOpeningLookup, readRecordedOpeningLookup } from "../../../packages/runtime/src/internal/recorded-opening-lookup.js";
import { assertRecordedPositionInvocation } from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { attachDelivery, evaluationDelivery } from "../../../packages/runtime/src/testing/review-evidence-fixture.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { loadOpeningCatalogue } from "./opening-catalogue.js";

const opening = await loadOpeningCatalogue(new URL("../artifacts/runtime-opening-catalogue.json", import.meta.url).pathname);
if (opening.kind !== "available") throw new TypeError(`Actual installed opening fixture refused: ${opening.reason}`);

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
  it.each((["white", "black"] as const).flatMap(side => [0, 1, 2, 3, 4].map(last => ({ side, last }))))("collects genuine durable point/state/result inputs after file reload: $side prefix $last", async ({ side, last: prefix }) => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-review-population-")); directories.push(directory);
    const path = join(directory, "runs.sqlite"), storage = open(path), service = new RunService(storage);
    const imported = await service.importGame({ id: `recorded-population-${side}`, side, opponentPolicy: { mode: "human_common" }, policyConfig, seed: 1,
      source: { kind: "pgn", pgn: '[Result "0-1"]\n\n1. e4 e5 2. Nf3 Nc6 0-1' } }, "writer");
    let run = imported.run;
    const branchId = run.branches[0]!.id, nodes = branchPath(run, branchId);
    expect(nodes[prefix], "the parameterized saved-import prefix must exist").toBeDefined();
    for (const index of [0, 1, 3]) run = attachDelivery(run, nodes[index]!.id, evaluationDelivery(nodes[index]!.fen, index === 1 ? "mate -2" : "cp 75"));
    storage.save(run, { writerId: "writer", learnerId: "__legacy" });
    storage.close(); stores.splice(stores.indexOf(storage), 1);
    const reloaded = open(path), parsed = reloaded.read(run.id)!.run, before = JSON.stringify(parsed.events), owner = ownerFor(reloaded);
    const context = { engine: reviewDurableEngineStates(parsed, nodes), shapes: [{ id: "import-f3", trigger: { kind: "pieceOnSquare" as const, square: "f3" as const, piece: { color: "white" as const, role: "knight" as const } } }] };
    for (const [last, endpoint] of [...nodes.entries()].filter(([index]) => index === prefix)) {
      const boundary = owner.resolve({ runId: run.id, branchId, throughNodeId: endpoint.id });
      const attachments = readRecordedEngineAttachments(collectRecordedEngineAttachments({ boundary }));
      expect(attachments.rows).toHaveLength(last + 1);
      for (const [index, row] of attachments.rows.entries()) {
        // Reuse the original position issued over the actual parsed/reloaded prefix. This is
        // the lookup prerequisite, not a complete recorded-opening history or learner delivery.
        const lookup = recordedOpeningLookup({ source: opening.source, position: row.position });
        const recorded = readRecordedOpeningLookup(lookup, opening.source, row.position);
        assertRecordedPositionInvocation(recorded.position, attachments.boundary.run, nodes[index]!.id);
        expect(recorded.position).toBe(row.position);
        expect(recorded.lookup.catalogue).toBe(opening.catalogue);
        expect(recorded.lookup.result.currentEndpoint).toEqual(opening.catalogue.currentEndpoint(nodes[index]!.fen, nodes[index]!.ply));
        expect(recorded.lookup.result.catalogueMembership).toEqual(opening.catalogue.catalogueMembership(nodes[index]!.fen, nodes[index]!.ply));
        if (index === 1) expect(recorded.lookup.result.currentEndpoint).toMatchObject({ kind: "matched", eco: "B00", name: "King's Pawn Game" });
        expect(row.selected !== null).toBe([0, 1, 3].includes(index));
        if (row.selected !== null) {
          expect(row.selected.occurrence.event).toBe(attachments.boundary.run.events[row.selected.occurrence.eventOrdinal]);
          expect(row.selected.point.payload.position).toBe(row.position);
          expect(row.selected.occurrence.evaluation.payload.payload.fen).toBe(nodes[index]!.fen);
        }
      }
      const population = collectRecordedLastLevelPopulation({ boundary, context }), data = readRecordedLastLevelPopulation(population);
      expect(data.rows).toHaveLength(last + 1); expect(data.boundary.run).toEqual(parsed);
      for (const [index, row] of data.rows.entries()) {
        expect(row.position.payload.nodeId).toBe(nodes[index]!.id);
        if ([0, 1, 3].includes(index)) {
          expect(row.state).toEqual({ kind: "available", itemCount: 1 });
          expect(row.points[0]!.payload.position).toBe(row.position);
          expect(row.points[0]!.payload.evaluation.payload.payload.fen).toBe(nodes[index]!.fen);
          expect(row.points[0]!.payload.evaluation.payload.payload.score.kind).toBe(index === 1 ? "mate" : "centipawns");
        } else { expect(row.state.kind).toBe("not_requested"); expect(row.points).toEqual([]); }
      }
      expect(data.result.items).toHaveLength(last === nodes.length - 1 ? 1 : 0);
      const completeSource = collectRecordedReviewSourcePopulation({ boundary, context }), complete = readRecordedReviewSourcePopulation(completeSource);
      expect(complete.plan).toHaveLength(12 * (last + 1) - 2);
      const retained = readRecordedLastLevelPopulation(complete.lastLevelPopulation);
      expect(retained.rows.map(row => row.state)).toEqual(data.rows.map(row => row.state));
      for (const row of retained.rows) {
        const original = complete.results.find(result => result.slot.adapterId === "review.source.eval_point@1" && result.slot.nodeId === row.position.payload.nodeId)!;
        expect(row.slot).toBe(original.slot); expect(row.points).toBe(original.items);
      }
      const firings = complete.results.filter(result => result.slot.adapterId === "review.source.shapes@1").flatMap(result => result.items);
      expect(firings.map(item => item.payload)).toEqual(last < 3 ? [] : [{ entryId: "import-f3", firstNodeId: nodes[3]!.id, lastNodeId: endpoint.id, openEnded: true }]);
      const momentSource = collectRecordedReviewMoments({ population: completeSource }), moments = readRecordedReviewMoments(momentSource);
      expect(moments.population).toBe(complete);
      expect(moments.groups.every(group => nodes.slice(1, last + 1).some(node => node.id === group.evidenceNodeId && node.parentId === group.decisionNodeId))).toBe(true);
      expect(moments.lastLevelReduction.receipt.operation).toEqual({ id: "story.last_level", version: 1 });
      const rank = invokeEvidenceValueRoute("derived.story.rank@3", { recordedReview: momentSource });
      expect(rank.payload.rank).toEqual(rankStoryMoments(moments.groups));
      const rankProof = readStoryRankReductionValue(rank, momentSource);
      expect(rankProof.reduction.sourceImageDigest).toBe(evidenceDigest(recordedReviewMomentSourceImage(momentSource)));
      expect(readRecordedReviewMomentOperands(momentSource).flat().map(item => item.value)).toEqual(moments.groups.flatMap(group => group.evidence));
      if (last < nodes.length - 1 || side === "black") expect(moments.lastLevelReduction.items).toEqual([]);
    }
    expect(JSON.stringify(reloaded.read(run.id)!.run.events)).toBe(before); expect(imported.evidencePass.jobs).toBe(0);
    const boundary = owner.resolve({ runId: run.id, branchId, throughNodeId: nodes.at(-1)!.id });
    const population = collectRecordedLastLevelPopulation({ boundary, context });
    const complete = collectRecordedReviewSourcePopulation({ boundary, context });
    const moments = collectRecordedReviewMoments({ population: complete });
    new RunService(reloaded).reveal(run.id, "writer");
    expect(() => readRecordedLastLevelPopulation(population)).toThrow(/no longer/u);
    expect(() => readRecordedReviewSourcePopulation(complete)).toThrow(/no longer/u);
    expect(() => readRecordedReviewMoments(moments)).toThrow(/no longer/u);
  });

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
