import { createRun } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { serializeAccountBundle } from "./account-data.js";
import { SQLiteRunStorage } from "./storage.js";

const AT = "2026-08-23T00:00:00.000Z";

describe("R18 data-lifecycle regression arm", () => {
  it("exports then truly deletes a solo run without manufacturing a legacy grant", () => {
    const storage = new SQLiteRunStorage(":memory:", { now: () => AT, onMigration: () => {} });
    const learner = storage.createLearner({ id: "r18-learner", handle: "r18-learner", passwordHash: "never-export-this", createdAt: AT });
    const run = createRun({ id: "r18-solo-import", packId: "r18-pack", packDigest: `sha256:${"8".repeat(64)}`, startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", seed: 18, createdAt: AT, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    storage.create(run, { writerId: "r18-writer", learnerId: learner.id }, "R18 solo run");

    const exported = serializeAccountBundle(storage.accountBundle(learner.id));
    expect(new TextDecoder().decode(exported.bytes)).not.toContain("never-export-this");
    const preview = storage.deletionPreview(learner.id, { kind: "account" }, AT);
    expect(preview.hardDelete.flatMap((effect) => effect.objectIds)).toContain(run.id);
    expect(preview.tombstone.flatMap((effect) => effect.objectIds)).not.toContain(run.id);

    storage.deleteLearner(learner.id, AT, preview.digest);
    expect(storage.read(run.id)).toBeUndefined();
    expect(storage.grants(run.id)).toEqual([]);
    expect(storage.learnerById(learner.id)).toBeUndefined();
    expect(storage.foreignKeyViolationCount()).toBe(0);
    storage.close();
  });
});
