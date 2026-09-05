// DISPOSABLE D2736-D2741 Campaign sixth-author falsifier. Not production code.
import { mkdtempSync, rmSync } from "node:fs";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CampaignAssistanceStore,
  HumanCurriculumReviewAuthority,
  applyChargedMutation,
  authorizeCampaignTheory,
  campaignEventBytes,
  compileOfficialCurriculum,
  createCampaignDatabase,
  digest,
  parseCampaignDocument,
  parseCampaignEvent,
  sealCurriculumRegistries,
  seedCampaignAssistanceAuthority,
  seedCampaignState,
  stable,
  type AssistanceSubject,
  type CampaignDocument,
  type CampaignEventInput,
  type CampaignMutationCommand,
  type CurriculumRegistries,
} from "./contract.js";

const command = (overrides: Partial<CampaignMutationCommand> = {}): CampaignMutationCommand => ({
  campaignRunId: "campaign-a", playRunId: "play-a", mutationCommandId: "command-a",
  expectedCampaignRevision: 7, expectedPlayRevision: 12, operation: "group",
  operandsDigest: digest({ group: ["a", "b"] }), ...overrides,
});

const withDatabase = (run: (path: string) => void): void => {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-campaign-sixth-"));
  try { run(join(directory, "campaign.sqlite")); } finally { rmSync(directory, { recursive: true, force: true }); }
};

function seed(path: string) {
  const database = createCampaignDatabase(path);
  seedCampaignState(database, { campaignRunId: "campaign-a", playRunId: "play-a", learnerId: "learner-a",
    documentDigest: digest("document-a"), campaignRevision: 7, playRevision: 12, chargeBalance: 2 });
  return database;
}

const assistanceSubject = (overrides: Partial<AssistanceSubject> = {}): AssistanceSubject => ({
  learnerId: "learner-a", campaignRunId: "campaign-a", campaignDocumentDigest: digest("document-a"),
  campaignRevision: 7, nodeId: "node-a", playRunId: "play-a", packDigest: digest("pack-a"),
  workflowContext: "campaign", disclosureCeiling: "theory_only", inventoryEventSeq: 4,
  nodeEnteredEventDigest: digest("entered-a"), ...overrides,
});

const eventInput = (overrides: Partial<CampaignEventInput> = {}): CampaignEventInput => ({
  campaignRunId: "campaign-a", seq: 2, kind: "loadout_changed", commandId: "command-a",
  expectedRevision: 1, operandsDigest: digest("operands-a"), payload: { equippedModuleIds: ["guided_hint"] },
  resultKind: "loadout_changed", at: "2026-09-05T00:00:00.000Z", ...overrides,
});

const node = (id: string, packId: string, boss = false) => ({ id, encounter: { kind: "pack", packId },
  suppress: [], reward: null, consumes: [], boss });

function documentImage(): Record<string, unknown> {
  return {
    id: "campaign", title: "Three consequences", version: 1, publication: { channel: "official" },
    targetLearnerId: "beginner", expectedMinutes: { min: 35, max: 55 },
    acts: [
      { id: "act1", layers: [{ choices: [node("o1", "opening")] }, { choices: [node("o2", "opening")] }, { choices: [node("o3", "opening", true)] }] },
      { id: "act2", layers: [{ choices: [node("m1", "middle")] }, { choices: [node("m2", "middle")] }, { choices: [node("m3", "middle", true)] }] },
      { id: "act3", layers: [{ choices: [node("e1", "end")] }, { choices: [node("e2", "end")] }, { choices: [node("e3", "end", true)] }] },
    ],
    economy: { startingCharges: 2, actGrants: { act1: 1, act2: 1, act3: 1 } },
    startingModules: [], durableRewards: [],
  };
}

function registries(): CurriculumRegistries {
  return {
    targetLearners: { beginner: { prerequisites: ["legal_moves"] } },
    packs: {
      opening: { digest: digest("opening"), phase: "opening", form: "pack",
        theory: [{ passageId: "italian-pin", evidenceRefs: ["source-1"] }], requirementIds: ["engine"] },
      middle: { digest: digest("middle"), phase: "middlegame", form: "pack", theory: [], requirementIds: [] },
      end: { digest: digest("end"), phase: "endgame", form: "pack", theory: [], requirementIds: ["tablebase"] },
    },
    dependencies: {
      engine: { operation: "engine.evaluate", unavailableAction: "honest_degradation",
        fallbackOperation: "deterministic.render", sourceAvailable: true },
      tablebase: { operation: "tablebase.probe", unavailableAction: "refuse_start", sourceAvailable: true },
    },
    providerOperations: ["engine.evaluate", "deterministic.render", "tablebase.probe"],
  };
}

describe("D2736-D2741 Campaign sixth author repair", () => {
  it("D2736 persists a no-event provider result across process restart", () => withDatabase((path) => {
    let calls = 0;
    const first = seed(path);
    expect(applyChargedMutation(first, command(), () => { calls += 1; return "failed"; }))
      .toEqual({ kind: "provider_failed", code: "OPPONENT_PROVIDER_UNAVAILABLE" });
    first.close();
    const restarted = createCampaignDatabase(path);
    expect(applyChargedMutation(restarted, command(), () => { calls += 1; return "ready"; }))
      .toEqual({ kind: "provider_failed", code: "OPPONENT_PROVIDER_UNAVAILABLE" });
    expect(calls).toBe(1);
    expect(restarted.prepare("SELECT COUNT(*) AS count FROM campaign_mutation_commands").get()).toEqual({ count: 1 });
    expect(restarted.prepare("SELECT revision,charge_balance FROM campaign_runs").get())
      .toEqual({ revision: 7, charge_balance: 2 });
    restarted.close();
  }));

  it("D2737 locks the exact campaign/play relation and compares both revisions", () => withDatabase((path) => {
    const database = seed(path);
    expect(() => applyChargedMutation(database, command({ campaignRunId: "other" }), () => "ready"))
      .toThrow(/ACTIVE_RELATION/u);
    expect(() => applyChargedMutation(database, command({ playRunId: "other" }), () => "ready"))
      .toThrow(/ACTIVE_RELATION/u);
    expect(() => applyChargedMutation(database, command({ expectedPlayRevision: 11 }), () => "ready"))
      .toThrow(/PLAY_REVISION_STALE/u);
    const result = applyChargedMutation(database, command(), () => "ready");
    expect(result).toEqual({ kind: "committed", campaignRevision: 8, playRevision: 13, chargeBalance: 1 });
    expect(database.prepare("SELECT revision,charge_balance FROM campaign_runs").get())
      .toEqual({ revision: 8, charge_balance: 1 });
    expect(database.prepare("SELECT revision FROM drill_runs").get()).toEqual({ revision: 13 });
    database.close();
  }));

  it("D2738 consumes storage-derived sealed receipts over the complete assistance subject", () => withDatabase((path) => {
    const database = createCampaignDatabase(path);
    const subject = assistanceSubject();
    seedCampaignAssistanceAuthority(database, { subject, passageId: "passage-a", applicable: true,
      disclosable: true, sourceAvailable: true });
    const authority = new CampaignAssistanceStore(database).compile("campaign-a", "passage-a");
    expect(authorizeCampaignTheory(subject, authority)).toBe("authorized");
    const structuralForgery = JSON.parse(JSON.stringify(authority)) as typeof authority;
    expect(authorizeCampaignTheory(subject, structuralForgery)).toBe("invalid_receipt");
    for (const crossed of [
      assistanceSubject({ learnerId: "other" }), assistanceSubject({ campaignDocumentDigest: digest("other") }),
      assistanceSubject({ campaignRevision: 8 }), assistanceSubject({ nodeId: "other" }),
      assistanceSubject({ playRunId: "other" }), assistanceSubject({ packDigest: digest("other") }),
      assistanceSubject({ disclosureCeiling: "analysis" }), assistanceSubject({ inventoryEventSeq: 5 }),
      assistanceSubject({ nodeEnteredEventDigest: digest("other") }),
    ]) expect(authorizeCampaignTheory(crossed, authority)).toBe("subject_mismatch");
    database.close();
  }));

  it("D2739 canonical bytes and one whole-envelope digest refuse transplant and duplicate keys", () => {
    const bytes = campaignEventBytes(eventInput());
    expect(parseCampaignEvent(bytes).campaignRunId).toBe("campaign-a");
    const parsed = JSON.parse(bytes) as Record<string, unknown>;
    const transplanted = stable({ ...parsed, campaignRunId: "other-campaign", commandId: "other-command",
      operandsDigest: digest("different-operands") });
    expect(() => parseCampaignEvent(transplanted)).toThrow(/DIGEST_INVALID/u);
    const duplicate = bytes.replace('"commandId":"command-a"', '"commandId":"ignored","commandId":"command-a"');
    expect(() => parseCampaignEvent(duplicate)).toThrow(/NONCANONICAL/u);
  });

  it("D2740 compiles the complete official projection from sealed nested inputs", () => {
    const document = parseCampaignDocument(stable(documentImage()));
    const sealedRegistries = sealCurriculumRegistries(registries());
    const review = new HumanCurriculumReviewAuthority().issue(document, "2026-09-05T00:00:00.000Z");
    const compiled = compileOfficialCurriculum(document, sealedRegistries, review);
    expect(Object.keys(compiled).sort()).toEqual(["campaignDigest", "dependencyAvailability", "expectedEnvelope",
      "formCoverage", "phaseCoverage", "reviewReceipt", "targetLearner", "theoryProvenance"].sort());
    expect(compiled.targetLearner).toEqual({ bracketId: "beginner", prerequisites: ["legal_moves"] });
    expect(compiled.expectedEnvelope).toEqual({ minimumMinutes: 35, maximumMinutes: 55 });
    expect(compiled.formCoverage[0]?.nodeIds).toHaveLength(9);
    expect(compiled.phaseCoverage.opening).toEqual(["o1", "o2", "o3"]);
    expect(compiled.theoryProvenance).toHaveLength(3);
    expect(compiled.dependencyAvailability.find((row) => row.requirement === "engine")?.requiredAt)
      .toEqual(["o1", "o2", "o3"]);
    expect(() => compileOfficialCurriculum(JSON.parse(JSON.stringify(document)) as CampaignDocument,
      sealedRegistries, review)).toThrow(/AUTHORITY_INVALID/u);
    expect(() => compileOfficialCurriculum(document, registries(), review)).toThrow(/AUTHORITY_INVALID/u);
    expect(() => new HumanCurriculumReviewAuthority().issue(document, "now")).toThrow(/REVIEW_INVALID/u);
  });

  it("D2741 names all returned dependencies as draft gates", () => {
    const campaign = readFileSync("rfc/campaign-core.md", "utf8").split("\n## Changelog\n", 1)[0]!;
    const register = readFileSync("rfc/README.md", "utf8");
    for (const dependency of ["intent-presets", "pack-capability-contract", "theory-drill-current-joins"]) {
      expect(register).toContain(`| \`${dependency}.md\` | **draft`);
      expect(campaign).toContain(`\`rfc/${dependency}.md\` **(draft`);
    }
    expect(campaign).not.toMatch(/accepted and implemented\s+`rfc\/(?:pack-capability-contract|theory-drill-current-joins)\.md`/u);
  });
});
