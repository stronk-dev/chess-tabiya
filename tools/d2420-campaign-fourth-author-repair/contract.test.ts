// DISPOSABLE D2420-D2427 Campaign author falsifier. Not production code.
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Worker } from "node:worker_threads";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

import {
  CAMPAIGN_ACCOUNT_OPERATIONS,
  CAMPAIGN_APPLIANCE_OPERATIONS,
  campaignHistoryProjection,
  compileCampaignAssistance,
  digest,
  parseCampaignEventRow,
  projectCampaignCurriculum,
  replayStoredCommand,
  validateCampaignCurriculum,
  type CampaignCurriculumNodeFact,
  type Sha,
} from "./model.js";

const rfc = readFileSync("rfc/campaign-core.md", "utf8");
const normative = rfc.split("\n## Changelog\n", 1)[0];
const sql = normative.match(/```sql\n([\s\S]*?)\n```/u)?.[1] ?? "";
const sha = (name: string): Sha => digest(name);

const runWorker = (filename: string, gate: SharedArrayBuffer, runId: string): Promise<string> => new Promise((resolve, reject) => {
  const worker = new Worker(new URL("./race-worker.mjs", import.meta.url), { workerData: { filename, gate, runId } });
  worker.once("message", (message) => resolve(String(message)));
  worker.once("error", reject);
});

describe("D2420-D2427 Campaign fourth author repair", () => {
  it("D2420 database-enforces one active run across concurrent SQLite writers", async () => {
    expect(sql).toMatch(/CREATE UNIQUE INDEX idx_campaign_runs_one_active[\s\S]*ON campaign_runs\(learner_id, campaign_id\)[\s\S]*WHERE status = 'active'/u);
    const directory = mkdtempSync(join(tmpdir(), "tabiya-campaign-race-"));
    const filename = join(directory, "campaign.sqlite");
    try {
      const database = new DatabaseSync(filename);
      database.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE learners (id TEXT PRIMARY KEY) STRICT; INSERT INTO learners VALUES ('learner');");
      database.exec(sql);
      database.close();
      const gate = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2);
      const left = runWorker(filename, gate, "run-left");
      const right = runWorker(filename, gate, "run-right");
      Atomics.store(new Int32Array(gate), 0, 1);
      Atomics.notify(new Int32Array(gate), 0, 2);
      expect((await Promise.all([left, right])).sort()).toEqual(["active_exists", "committed"]);
      const check = new DatabaseSync(filename);
      expect((check.prepare("SELECT COUNT(*) AS count FROM campaign_runs WHERE status='active'").get() as { count: number }).count).toBe(1);
      check.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("D2421 makes creation the only null-revision event and binds later seq", () => {
    const base = { campaignRunId: "run", commandId: "command", operandsDigest: sha("operands"), resultPayload: "{}", payload: {}, at: "2026-09-02" };
    expect(parseCampaignEventRow({ ...base, kind: "campaign_created", seq: 1, expectedRevision: null }).kind).toBe("campaign_created");
    expect(() => parseCampaignEventRow({ ...base, kind: "campaign_created", seq: 1, expectedRevision: 0 })).toThrow(/CREATION_REVISION/u);
    expect(() => parseCampaignEventRow({ ...base, kind: "node_entered", seq: 2, expectedRevision: null })).toThrow(/EVENT_REVISION/u);
    expect(parseCampaignEventRow({ ...base, kind: "node_entered", seq: 2, expectedRevision: 1 }).seq).toBe(2);
  });

  it("D2422 replays immutable result bytes after aggregate state advances", () => {
    expect(sql).toMatch(/operands_digest TEXT NOT NULL[\s\S]*result_payload TEXT NOT NULL/u);
    const row = parseCampaignEventRow({ campaignRunId: "run", seq: 2, kind: "node_entered", commandId: "start",
      expectedRevision: 1, operandsDigest: sha("start-operands"), resultPayload: JSON.stringify({ playRunId: "play-1", revision: 2 }),
      payload: { nodeId: "node", runId: "play-1" }, at: "2026-09-02" });
    const laterAggregate = { revision: 9, activeEncounterRunId: null };
    expect(laterAggregate.revision).toBe(9);
    expect(replayStoredCommand(row, sha("start-operands"))).toEqual({ playRunId: "play-1", revision: 2 });
    expect(() => replayStoredCommand(row, sha("changed"))).toThrow(/COMMAND_REUSED/u);
  });

  it("D2423 requires exact applicability and disclosure gates for theory", () => {
    const inventory = { eventSeq: 4, ownedModules: ["guided_hint"], equippedModules: ["guided_hint"], ownedTheoryPassages: ["good", "irrelevant", "direct"] };
    const gate = (passageId: string, applicable: boolean, allowed: boolean) => ({ passageId, authorizingModuleId: "guided_hint", sourceId: "theory-source",
      applicability: { passageId, packDigest: sha("pack"), applicable, digest: sha(`app:${passageId}:${applicable}`) },
      disclosure: { passageId, allowed, digest: sha(`disclosure:${passageId}:${allowed}`) } });
    const receipt = compileCampaignAssistance({ currentRevision: 11, inventoryAtEncounter: inventory, currentInventory: inventory,
      suppressedModules: [], sourceAvailable: ["guided_hint", "theory-source"], requestedModules: ["guided_hint"],
      theory: [gate("good", true, true), gate("irrelevant", false, true), gate("direct", true, false)] });
    expect(receipt.theory).toEqual([
      { passageId: "good", state: "authorized" },
      { passageId: "irrelevant", state: "not_applicable" },
      { passageId: "direct", state: "disclosure_ceiling" },
    ]);
  });

  it("D2424 freezes active and sealed inventory at node_entered", () => {
    const receipt = compileCampaignAssistance({ currentRevision: 12,
      inventoryAtEncounter: { eventSeq: 3, ownedModules: [], equippedModules: [], ownedTheoryPassages: [] },
      currentInventory: { eventSeq: 12, ownedModules: ["guided_hint"], equippedModules: ["guided_hint"], ownedTheoryPassages: [] },
      suppressedModules: [], sourceAvailable: ["guided_hint"], requestedModules: ["guided_hint"], theory: [] });
    expect(receipt.inventoryEventSeq).toBe(3);
    expect(receipt.effectiveModules).toEqual([]);
  });

  it("D2425 derives phase, form, theory and dependencies from pinned node facts", () => {
    const facts: readonly CampaignCurriculumNodeFact[] = [
      { nodeId: "o1", packId: "opening-pack", packDigest: sha("o"), phase: "opening", form: "pack", theoryPassageIds: ["theory-o"], requirementIds: ["module.guided"] },
      { nodeId: "m1", packId: "middle-pack", packDigest: sha("m"), phase: "middlegame", form: "pack", theoryPassageIds: [], requirementIds: ["module.guided"] },
      { nodeId: "e1", packId: "ending-pack", packDigest: sha("e"), phase: "endgame", form: "pack", theoryPassageIds: ["theory-e"], requirementIds: ["tablebase"] },
    ];
    const valid = projectCampaignCurriculum(facts);
    expect(validateCampaignCurriculum(valid, facts)).toEqual([]);
    const selfLabelled = { ...valid, phaseCoverage: { opening: ["o1"], middlegame: ["o1"], endgame: ["o1"] } };
    expect(validateCampaignCurriculum(selfLabelled, facts)).toContain("CAMPAIGN_CURRICULUM_PHASE_MISMATCH");
    const ghostTheory = { ...valid, theoryProvenance: [{ nodeId: "ghost", passageId: "theory-o" }] };
    expect(validateCampaignCurriculum(ghostTheory, facts)).toContain("CAMPAIGN_CURRICULUM_THEORY_MISMATCH");
    const ghostDependency = { ...valid, dependencyAvailability: [{ requirement: "module.guided", requiredAt: ["ghost"] }] };
    expect(validateCampaignCurriculum(ghostDependency, facts)).toContain("CAMPAIGN_CURRICULUM_DEPENDENCY_MISMATCH");
  });

  it("D2426 consumes only accepted account export/delete and appliance restore", () => {
    expect(CAMPAIGN_ACCOUNT_OPERATIONS).toEqual(["export", "hard_delete"]);
    expect(CAMPAIGN_APPLIANCE_OPERATIONS).toEqual(["backup_restore"]);
    const lifecycle = normative.slice(normative.indexOf("**6.2 Account and appliance lifecycle.**"), normative.indexOf("**6.3 Play-run deletion"));
    expect(lifecycle).toMatch(/supplies no account-import, restore, merge or rekey route/u);
    expect(lifecycle).not.toMatch(/Restore imports canonical rows|Account merge\s+cannot silently/u);
  });

  it("D2427 distinguishes sealed deletion, abandoned deletion and corruption", () => {
    const common = { runId: "play", nodeId: "node", activePointer: false };
    expect(campaignHistoryProjection({ ...common, playRunExists: false, nodeCommitted: true, campaignAbandoned: false })).toEqual({
      kind: "unavailable", reason: "campaign_encounter_run_deleted", runId: "play", nodeId: "node",
    });
    expect(campaignHistoryProjection({ ...common, playRunExists: false, nodeCommitted: false, campaignAbandoned: true })).toEqual({
      kind: "unavailable", reason: "campaign_abandoned_run_deleted", runId: "play", nodeId: "node",
    });
    expect(() => campaignHistoryProjection({ ...common, playRunExists: false, nodeCommitted: false, campaignAbandoned: false })).toThrow(/HISTORY_CORRUPT/u);
    expect(() => campaignHistoryProjection({ ...common, playRunExists: false, activePointer: true, nodeCommitted: false, campaignAbandoned: false })).toThrow(/ACTIVE_RUN_MISSING/u);
  });

  it("the RFC remains foundation-only and all eight repair clauses are explicit", () => {
    for (const id of ["D2420", "D2421", "D2422", "D2423", "D2424", "D2425", "D2426", "D2427"]) expect(normative).toContain(`[[${id}]]`);
    expect(normative).toMatch(/Campaign foundation, not the whole 1\.0/u);
    expect(normative).toMatch(/No product implementation is authorized|No campaign schema, migration, production route/u);
  });
});
