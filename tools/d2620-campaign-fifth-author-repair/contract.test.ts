// DISPOSABLE D2620-D2624 Campaign fifth-author falsifier. Not production code.
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { applyChargedMutation, authorizeCampaignTheory, compileOfficialCurriculum, digest, parseCampaignEvent,
  type AssistanceSubject, type CampaignDocument, type CampaignMutationCommand, type CurriculumRegistries } from "./contract.js";

const rfc = readFileSync("rfc/campaign-core.md", "utf8");
const normative = rfc.split("\n## Changelog\n", 1)[0]!;
const sql = normative.match(/```sql\n([\s\S]*?)\n```/u)?.[1] ?? "";

describe("D2620-D2624 Campaign fifth author repair", () => {
  it("D2620 replays one charged cross-aggregate command and stores provider failure without charging", () => {
    const initial = { campaignRevision: 7, playRevision: 12, chargeBalance: 2, stored: new Map() };
    const command: CampaignMutationCommand = { campaignRunId: "campaign", playRunId: "play", mutationCommandId: "cmd",
      expectedCampaignRevision: 7, operation: "group", operandsDigest: digest({ members: 3 }) };
    const failed = applyChargedMutation(initial, command, () => "failed");
    expect(failed.result.kind).toBe("provider_failed");
    expect(failed.state).toMatchObject({ campaignRevision: 7, playRevision: 12, chargeBalance: 2 });
    expect(applyChargedMutation(failed.state, command, () => "ready").result).toEqual(failed.result);
    expect(() => applyChargedMutation(failed.state, { ...command, operandsDigest: digest("changed") }, () => "ready")).toThrow(/COMMAND_REUSED/u);
    const committed = applyChargedMutation(initial, { ...command, operation: "rewind" }, () => "ready");
    expect(committed.state).toMatchObject({ campaignRevision: 8, playRevision: 13, chargeBalance: 1 });
    expect(applyChargedMutation(committed.state, { ...command, operation: "rewind" }, () => "ready").result).toEqual(committed.result);
    expect(() => applyChargedMutation(committed.state, { ...command, mutationCommandId: "stale" }, () => "ready")).toThrow(/REVISION_STALE/u);
    expect(normative).toMatch(/operation: "rewind" \| "fork" \| "group" \| "simulate_enter"/u);
  });

  it("D2621 rejects valid receipts bound to any other campaign-assistance subject", () => {
    const subject: AssistanceSubject = { campaignRunId: "campaign", nodeId: "node", playRunId: "play", packDigest: digest("pack"),
      workflowContext: "campaign", disclosureCeiling: "theory_only", inventoryEventSeq: 4, nodeEnteredEventDigest: digest("entered") };
    const gate = { passageId: "passage", authorizingModuleId: "guided_hint", sourceId: "bundle@1", subject,
      applicability: { subject, passageId: "passage", applicable: true, sourceReceiptDigest: digest("app") },
      disclosure: { subject, passageId: "passage", allowed: true, sourceReceiptDigest: digest("disclosure") } };
    expect(authorizeCampaignTheory(subject, gate)).toBe("authorized");
    for (const crossed of [
      { ...subject, packDigest: digest("other") }, { ...subject, nodeId: "other" }, { ...subject, playRunId: "other" },
      { ...subject, disclosureCeiling: "analysis" }, { ...subject, inventoryEventSeq: 5 }, { ...subject, nodeEnteredEventDigest: digest("other") },
    ]) expect(authorizeCampaignTheory(subject, { ...gate, applicability: { ...gate.applicability, subject: crossed } })).toBe("subject_mismatch");
  });

  it("D2622 makes run identity relational, encounter pointers unique/owned and awards derived", () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys=ON; CREATE TABLE learners(id TEXT PRIMARY KEY) STRICT; CREATE TABLE drill_runs(id TEXT PRIMARY KEY, owner_learner_id TEXT NOT NULL) STRICT; INSERT INTO learners VALUES ('alice'),('bob'); INSERT INTO drill_runs VALUES ('alice-play','alice'),('bob-play','bob');");
    db.exec(sql);
    const run = db.prepare(`INSERT INTO campaign_runs
      (id,learner_id,campaign_id,campaign_version,campaign_document_digest,campaign_document,status,active_encounter_run_id,created_at)
      VALUES (?,?,?,?,?,'{}','active',?,?)`);
    run.run("alice-run", "alice", "campaign", 1, digest("doc"), "alice-play", "now");
    expect(() => run.run("crossed", "alice", "campaign-2", 1, digest("doc"), "bob-play", "now")).toThrow();
    expect(() => run.run("duplicate", "alice", "campaign-3", 1, digest("doc"), "alice-play", "now")).toThrow();
    expect(() => db.prepare(`INSERT INTO campaign_run_creations
      (learner_id,campaign_id,command_id,campaign_version,operands_digest,campaign_run_id,result_payload,created_at)
      VALUES ('bob','campaign','create',1,?,'alice-run','{}','now')`).run(digest("create"))).toThrow();
    db.prepare("INSERT INTO campaign_reward_awards(campaign_run_id,durable_reward_id,reward_payload,awarded_at) VALUES ('alice-run','mark','{}','now')").run();
    expect(db.prepare(`SELECT r.learner_id,a.durable_reward_id FROM campaign_reward_awards a
      JOIN campaign_runs r ON r.id=a.campaign_run_id`).get()).toEqual({ learner_id: "alice", durable_reward_id: "mark" });
    db.close();
  });

  it("D2623 admits only exact semantic event/result members and recursively seals them", () => {
    const payload = { nodeId: "node", playRunId: "play", branchId: "branch", verdict: "failed",
      participation: { learnerMoveEventSeq: 3, consequenceTipNodeId: "tip", completion: "authored_boundary" },
      actIncome: { source: "act_seal", act: "act1", amount: 1 },
      reward: { kind: "resource_grant", resourceId: "campaign_rewind_charge", amount: 1 }, terminal: "continue" };
    const result = { kind: "node_committed", campaignRevision: 2, digest: digest({ kind: "node_committed", campaignRevision: 2, payload }) };
    const image = { campaignRunId: "campaign", seq: 2, kind: "node_committed", commandId: "submit", expectedRevision: 1,
      operandsDigest: digest("operands"), payload, result, at: "now" };
    const parsed = parseCampaignEvent(JSON.stringify(image));
    expect(Object.isFrozen(parsed.payload)).toBe(true);
    expect(Object.isFrozen(parsed.payload.reward)).toBe(true);
    expect(() => (parsed.payload.reward as { amount: number }).amount = 99).toThrow();
    expect(() => parseCampaignEvent(JSON.stringify({ ...image, payload: {} }))).toThrow(/PAYLOAD_FIELDS/u);
    expect(() => parseCampaignEvent(JSON.stringify({ ...image, payload: { ...payload, extra: true } }))).toThrow(/PAYLOAD_FIELDS/u);
    expect(() => parseCampaignEvent(JSON.stringify({ ...image, result: { ...result, kind: "encounter_started" } }))).toThrow(/RESULT_KIND/u);
    const unknownReward = { ...payload, reward: { kind: "mystery", id: "x" } };
    const unknownResult = { ...result, digest: digest({ kind: result.kind, campaignRevision: 2, payload: unknownReward }) };
    expect(() => parseCampaignEvent(JSON.stringify({ ...image, payload: unknownReward, result: unknownResult }))).toThrow(/REWARD_KIND/u);
    const controls = [
      { kind: "campaign_created", seq: 1, expectedRevision: null, payload: { campaignId: "c", campaignVersion: 1, documentDigest: digest("doc"), startingCharges: 2 }, resultKind: "campaign_created" },
      { kind: "node_entered", seq: 2, expectedRevision: 1, payload: { nodeId: "n", playRunId: "p", inventoryEventSeq: 1, packDigest: digest("pack") }, resultKind: "encounter_started" },
      { kind: "loadout_changed", seq: 2, expectedRevision: 1, payload: { equippedModuleIds: ["guided_hint"] }, resultKind: "loadout_changed" },
      { kind: "charge_spent", seq: 2, expectedRevision: 1, payload: { playRunId: "p", mutationCommandId: "m", operation: "fork", amount: 1 }, resultKind: "mutation_committed" },
      { kind: "campaign_abandoned", seq: 2, expectedRevision: 1, payload: { activeNodeId: null, activePlayRunId: null }, resultKind: "campaign_abandoned" },
    ] as const;
    for (const control of controls) {
      const eventResult = { kind: control.resultKind, campaignRevision: control.seq,
        digest: digest({ kind: control.resultKind, campaignRevision: control.seq, payload: control.payload }) };
      expect(parseCampaignEvent(JSON.stringify({ campaignRunId: "campaign", seq: control.seq, kind: control.kind,
        commandId: `cmd-${control.kind}`, expectedRevision: control.expectedRevision, operandsDigest: digest(control.kind),
        payload: control.payload, result: eventResult, at: "now" })).kind).toBe(control.kind);
    }
  });

  it("D2624 compiles the complete official projection from one pinned node set and sealed registries", () => {
    const document: CampaignDocument = { id: "campaign", version: 1, publication: { channel: "official" }, targetLearnerId: "beginner",
      expectedMinutes: { min: 35, max: 55 }, nodes: [
        { id: "o", packId: "open", packDigest: digest("o") },
        { id: "m", packId: "middle", packDigest: digest("m") },
        { id: "z", packId: "end", packDigest: digest("z") },
      ] };
    const registries: CurriculumRegistries = { targetLearners: ["beginner"], packs: {
      open: { digest: digest("o"), phase: "opening", form: "pack", theoryPassageIds: ["p"], evidenceRefs: ["e"], requirementIds: ["engine"] },
      middle: { digest: digest("m"), phase: "middlegame", form: "pack", theoryPassageIds: [], evidenceRefs: ["e"], requirementIds: [] },
      end: { digest: digest("z"), phase: "endgame", form: "pack", theoryPassageIds: [], evidenceRefs: ["e"], requirementIds: [] },
    }, passages: ["p"], evidence: ["e"], dependencies: { engine: { operation: "engine.evaluate", unavailableAction: "honest_degradation",
      fallbackOperation: "deterministic.render", sourceAvailable: true } }, providerOperations: ["engine.evaluate", "deterministic.render"] };
    const review = { authority: "owner_human_chess_review" as const, documentDigest: digest(document), reviewedAt: "2026-09-04" };
    const compiled = compileOfficialCurriculum(document, registries, review);
    expect(compiled.nodeFacts.map((fact) => fact.nodeId)).toEqual(document.nodes.map((node) => node.id));
    expect(compiled.reviewReceipt.documentDigest).toBe(compiled.campaignDigest);
    expect(() => compileOfficialCurriculum({ ...document, nodes: [...document.nodes, { ...document.nodes[0]! }] }, registries, review)).toThrow(/NODE_DUPLICATE/u);
    expect(() => compileOfficialCurriculum({ ...document, publication: { channel: "community" } }, registries, review)).toThrow(/NOT_OFFICIAL/u);
    expect(() => compileOfficialCurriculum({ ...document, expectedMinutes: { min: 55, max: 35 } }, registries, review)).toThrow(/ENVELOPE/u);
    expect(() => compileOfficialCurriculum(document, { ...registries, evidence: [] }, review)).toThrow(/EVIDENCE_UNKNOWN/u);
    expect(() => compileOfficialCurriculum(document, { ...registries, providerOperations: [] }, review)).toThrow(/OPERATION_UNKNOWN/u);
    expect(() => compileOfficialCurriculum(document, { ...registries, packs: { ...registries.packs,
      open: { ...registries.packs.open!, phase: "endgame" } } }, review)).toThrow(/PHASE_EMPTY/u);
    expect(() => compileOfficialCurriculum(document, registries, { ...review, documentDigest: digest("other") })).toThrow(/REVIEW_INVALID/u);
  });
});
