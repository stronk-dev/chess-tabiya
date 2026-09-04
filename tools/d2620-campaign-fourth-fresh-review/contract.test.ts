// DISPOSABLE D2620-D2624 Campaign fresh-review falsifier. Not production code.
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

import {
  compileCampaignAssistance,
  digest,
  parseCampaignEventRow,
  projectCampaignCurriculum,
  validateCampaignCurriculum,
  type CampaignCurriculumNodeFact,
} from "../d2420-campaign-fourth-author-repair/model.js";

const rfc = readFileSync("rfc/campaign-core.md", "utf8");
const normative = rfc.split("\n## Changelog\n", 1)[0]!;
const sql = normative.match(/```sql\n([\s\S]*?)\n```/u)?.[1] ?? "";

const source = (path: string): string => readFileSync(path, "utf8");
const between = (value: string, start: string, end: string): string =>
  value.slice(value.indexOf(start), value.indexOf(end, value.indexOf(start)));

describe("D2620-D2624 Campaign fourth fresh independent review", () => {
  it("D2620 live charged mutations have no durable command or campaign-revision operand", () => {
    const rest = source("apps/server/src/rest.ts");
    const charged = [
      between(rest, 'if (route.action === "rewind")', 'if (route.action === "fork")'),
      between(rest, 'if (route.action === "fork")', 'if (route.action === "compare")'),
      between(rest, 'if (route.action === "group")', 'if (route.action === "group-reply")'),
      between(rest, 'if (route.action === "simulate-enter")', 'if (route.action === "prediction")'),
    ];
    expect(charged.every((block) => block.length > 0)).toBe(true);
    for (const block of charged) {
      expect(block).not.toMatch(/commandId|expectedCampaignRevision/u);
    }
    expect(normative).toMatch(/mutationCommandId/u);
    expect(normative).toMatch(/same\s+transaction as the mutation/u);
  });

  it("D2621 otherwise-valid applicability from another pack authorizes theory", () => {
    const inventory = {
      eventSeq: 4,
      ownedModules: ["guided_hint"],
      equippedModules: ["guided_hint"],
      ownedTheoryPassages: ["passage"],
    };
    const receipt = compileCampaignAssistance({
      currentRevision: 7,
      inventoryAtEncounter: inventory,
      currentInventory: inventory,
      suppressedModules: [],
      sourceAvailable: ["guided_hint", "theory-source"],
      requestedModules: ["guided_hint"],
      theory: [{
        passageId: "passage",
        authorizingModuleId: "guided_hint",
        sourceId: "theory-source",
        applicability: {
          passageId: "passage",
          packDigest: digest("a different pack"),
          applicable: true,
          digest: digest("crossed applicability"),
        },
        disclosure: {
          passageId: "passage",
          allowed: true,
          digest: digest("a more permissive context"),
        },
      }],
    });
    expect(receipt.theory).toEqual([{ passageId: "passage", state: "authorized" }]);
    expect(receipt).not.toHaveProperty("packDigest");
    expect(receipt).not.toHaveProperty("workflowContext");
  });

  it("D2622 SQL accepts crossed owner/campaign rows and a multiply-owned active play run", () => {
    const database = new DatabaseSync(":memory:");
    database.exec("PRAGMA foreign_keys=ON; CREATE TABLE learners (id TEXT PRIMARY KEY) STRICT; INSERT INTO learners VALUES ('alice'), ('bob');");
    database.exec(sql);
    const insertRun = database.prepare(`INSERT INTO campaign_runs
      (id, learner_id, campaign_id, campaign_version, campaign_document_digest, campaign_document, status, active_encounter_run_id, created_at)
      VALUES (?, ?, ?, 1, ?, '{}', 'active', ?, '2026-09-04')`);
    insertRun.run("bob-run", "bob", "campaign-b", digest("b"), "shared-play-run");
    insertRun.run("alice-run", "alice", "campaign-a", digest("a"), "shared-play-run");
    database.prepare(`INSERT INTO campaign_run_creations
      (learner_id, campaign_id, command_id, campaign_version, operands_digest, campaign_run_id, result_payload, created_at)
      VALUES ('alice', 'campaign-a', 'create', 9, ?, 'bob-run', '{}', '2026-09-04')`).run(digest("operands"));
    database.prepare(`INSERT INTO campaign_reward_awards
      (learner_id, campaign_id, campaign_version, campaign_run_id, durable_reward_id, reward_payload, awarded_at)
      VALUES ('alice', 'campaign-a', 9, 'bob-run', 'cosmetic:gold', '{}', '2026-09-04')`).run();
    expect(database.prepare("SELECT COUNT(*) AS count FROM campaign_runs WHERE active_encounter_run_id='shared-play-run'").get()).toMatchObject({ count: 2 });
    expect(database.prepare("SELECT learner_id, campaign_id, campaign_version, campaign_run_id FROM campaign_run_creations").get()).toEqual({
      learner_id: "alice", campaign_id: "campaign-a", campaign_version: 9, campaign_run_id: "bob-run",
    });
    expect(database.prepare("SELECT learner_id, campaign_run_id FROM campaign_reward_awards").get()).toEqual({
      learner_id: "alice", campaign_run_id: "bob-run",
    });
    database.close();
  });

  it("D2623 event parser accepts empty semantics and retains mutable nested payload bytes", () => {
    const nested = { reward: { kind: "resource_grant", amount: 1 } };
    const parsed = parseCampaignEventRow({
      campaignRunId: "run",
      seq: 2,
      kind: "node_committed",
      commandId: "submit",
      expectedRevision: 1,
      operandsDigest: digest("operands"),
      resultPayload: "{}",
      payload: nested,
      at: "2026-09-04",
    });
    expect(parseCampaignEventRow({
      campaignRunId: "run", seq: 2, kind: "node_committed", commandId: "empty",
      expectedRevision: 1, operandsDigest: digest("empty"), resultPayload: "{}", payload: {}, at: "2026-09-04",
    }).kind).toBe("node_committed");
    nested.reward.amount = 99;
    expect((parsed.payload.reward as { amount: number }).amount).toBe(99);
  });

  it("D2624 curriculum projection validates conflicting facts while omitting required authorities", () => {
    const facts: readonly CampaignCurriculumNodeFact[] = [
      { nodeId: "same", packId: "opening-pack", packDigest: digest("o"), phase: "opening", form: "pack", theoryPassageIds: [], requirementIds: [] },
      { nodeId: "same", packId: "ending-pack", packDigest: digest("e"), phase: "endgame", form: "pack", theoryPassageIds: [], requirementIds: [] },
      { nodeId: "middle", packId: "middle-pack", packDigest: digest("m"), phase: "middlegame", form: "pack", theoryPassageIds: [], requirementIds: [] },
    ];
    const metadata = projectCampaignCurriculum(facts);
    expect(validateCampaignCurriculum(metadata, facts)).toEqual([]);
    expect(metadata.phaseCoverage.opening).toContain("same");
    expect(metadata.phaseCoverage.endgame).toContain("same");
    expect(metadata).not.toHaveProperty("targetLearner");
    expect(metadata).not.toHaveProperty("expectedEnvelope");
    expect(metadata).not.toHaveProperty("reviewReceipt");
    expect(validateCampaignCurriculum.length).toBe(2);
  });
});
