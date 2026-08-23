import { commitMove, createRun } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { serializeAccountBundle } from "./account-data.js";
import { projectAttempts } from "./progress.js";
import { SQLiteRunStorage } from "./storage.js";

const AT = "2026-08-23T00:00:00.000Z";

describe("R18 data-lifecycle regression arm", () => {
  it("exports then truly deletes a solo run without manufacturing a legacy grant", () => {
    const storage = new SQLiteRunStorage(":memory:", { now: () => AT, onMigration: () => {} });
    const learner = storage.createLearner({ id: "r18-learner", handle: "r18-learner", passwordHash: "never-export-this", createdAt: AT });
    const base = createRun({ id: "r18-solo-import", packId: "r18-pack", packDigest: `sha256:${"8".repeat(64)}`, startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", seed: 18, createdAt: AT, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    const run = commitMove(base, "e2e4", { at: AT }).run;
    const lease = { writerId: "r18-writer", learnerId: learner.id } as const;
    storage.createImportedRun!(run, lease, "R18 solo run", {
      runId: run.id, sourceKind: "pgn_paste", sourceUrl: null, movetextDigest: `sha256:${"7".repeat(64)}`,
      headers: { Event: "R18 destructive fixture", White: "R18", Black: "Fixture" }, result: "*",
      pgn: '[Event "R18 destructive fixture"]\n\n1. e4 *', licenceNote: "Learner-supplied PGN", importedAt: AT,
    });
    storage.replaceRunMarks({ runId: run.id, learnerId: learner.id, scope: "position", scopeKey: run.nodes[0]!.transposeKey, shapes: [{ brush: "green", orig: "e2", dest: "e4" }], relayed: false, at: AT });
    const attempts = projectAttempts({ run, learnerId: learner.id });
    storage.upsertAttempts(attempts.attempts, attempts.conceptTags);
    storage.createSchedule({ id: "r18-schedule", learnerId: learner.id, rootKey: "r18-root", sessionKind: "pack", packId: "r18-pack", rootTransposeKey: run.nodes[0]!.transposeKey, kind: "blocked", variant: null, origin: "learner", dueAt: AT, createdAt: AT, sourceRunId: run.id, sourceNodeId: run.nodes[0]!.id });
    storage.createPublicToken!({ id: "r18-token", tokenHash: "r18-token-hash", scope: "story_read", runId: run.id, branchId: run.branches[0]!.id, createdBy: learner.id, createdAt: AT, revokedAt: null });
    storage.createRepertoire!({ id: "r18-repertoire", ownerLearnerId: learner.id, name: "R18 repertoire", side: "white", rootFen: run.start.fen, targetElo: 1500, coverageDenominator: 100, sourceKind: "pgn_paste", sourceUrl: null, originalPgn: "1. e4", licenceNote: "Learner supplied", digest: `sha256:${"6".repeat(64)}`, createdAt: AT, updatedAt: AT }, [{ repertoireId: "r18-repertoire", positionKey: run.nodes[0]!.transposeKey, moveUci: "e2e4", moveSan: "e4", representativeFen: run.nodes[0]!.fen, rank: 0, origin: "imported", createdAt: AT }]);
    storage.createPackDraft({ id: "r18-pack-draft", packId: "r18-private-pack", ownerLearnerId: learner.id, document: { id: "r18-private-pack" }, digest: `sha256:${"5".repeat(64)}`, state: "draft", seedKind: "run", seedRef: run.id, createdAt: AT, updatedAt: AT });
    storage.storePlaytestDocument(`sha256:${"4".repeat(64)}`, "r18-pack-draft", { id: "r18-playtest" }, AT);
    storage.createShapeDraft({ id: "r18-shape-draft", shapeId: "r18-private-shape", ownerLearnerId: learner.id, document: { id: "r18-private-shape" }, digest: `sha256:${"3".repeat(64)}`, state: "draft", createdAt: AT, updatedAt: AT });
    const child = createRun({ id: "r18-private-child", packId: "r18-pack", packDigest: run.packDigest!, startFen: run.nodes[0]!.fen, seed: 19, createdAt: AT, policyConfig: run.policyConfig });
    storage.createDerivedRun!(child, { writerId: "r18-child-writer", learnerId: learner.id }, "R18 child", { derivedRunId: child.id, sourceRunId: run.id, sourceBranchId: run.branches[0]!.id, sourceNodeId: run.nodes[0]!.id, kind: "flip_sides", createdAt: AT });

    const exported = serializeAccountBundle(storage.accountBundle(learner.id));
    const exportText = new TextDecoder().decode(exported.bytes);
    expect(exportText).not.toContain("never-export-this");
    for (const witness of ["R18 destructive fixture", "r18-repertoire", "r18-pack-draft", "r18-shape-draft", "r18-private-child"]) expect(exportText).toContain(witness);
    const preview = storage.deletionPreview(learner.id, { kind: "account" }, AT);
    expect(preview.hardDelete.flatMap((effect) => effect.objectIds)).toContain(run.id);
    expect(preview.hardDelete.flatMap((effect) => effect.objectIds)).toContain(child.id);
    expect(preview.tombstone.flatMap((effect) => effect.objectIds)).not.toContain(run.id);

    storage.deleteLearner(learner.id, AT, preview.digest);
    expect(storage.read(run.id)).toBeUndefined();
    expect(storage.read(child.id)).toBeUndefined();
    expect(storage.grants(run.id)).toEqual([]);
    expect(storage.importedGame!(run.id)).toBeUndefined();
    expect(storage.publicTokenByHash!("r18-token-hash")).toBeUndefined();
    expect(storage.repertoire!("r18-repertoire")).toBeUndefined();
    expect(storage.packDraft("r18-pack-draft", learner.id)).toBeUndefined();
    expect(storage.shapeDraft("r18-shape-draft", learner.id)).toBeUndefined();
    expect(storage.learnerById(learner.id)).toBeUndefined();
    expect(storage.foreignKeyViolationCount()).toBe(0);
    storage.close();
  });
});
