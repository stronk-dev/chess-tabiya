import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

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
  type CampaignEventInput,
  type CampaignMutationCommand,
  type CampaignMutationOperation,
  type CurriculumRegistries,
} from "../d2736-campaign-sixth-author-repair/contract.js";

const directories: string[] = [];

afterEach(() => {
  while (directories.length > 0) rmSync(directories.pop()!, { recursive: true, force: true });
});

function databasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-campaign-review-"));
  directories.push(directory);
  return join(directory, "campaign.sqlite");
}

function seed(path: string) {
  const database = createCampaignDatabase(path);
  seedCampaignState(database, { campaignRunId: "campaign-a", playRunId: "play-a",
    learnerId: "learner-a", documentDigest: digest("document-a"),
    campaignRevision: 7, playRevision: 12, chargeBalance: 2 });
  return database;
}

function command(operation: CampaignMutationOperation, id = `command-${operation}`): CampaignMutationCommand {
  return { campaignRunId: "campaign-a", playRunId: "play-a", mutationCommandId: id,
    expectedCampaignRevision: 7, expectedPlayRevision: 12, operation,
    operandsDigest: digest({ callerSays: operation }) };
}

const assistanceSubject: AssistanceSubject = {
  learnerId: "learner-a", campaignRunId: "campaign-a", campaignDocumentDigest: digest("document-a"),
  campaignRevision: 7, nodeId: "node-a", playRunId: "play-a", packDigest: digest("pack-a"),
  workflowContext: "campaign", disclosureCeiling: "theory_only", inventoryEventSeq: 4,
  nodeEnteredEventDigest: digest("entered-a"),
};

const node = (id: string, packId: string, overrides: Record<string, unknown> = {}) => ({
  id, encounter: { kind: "pack", packId }, suppress: [], reward: null, consumes: [], boss: false,
  ...overrides,
});

function documentImage(): Record<string, unknown> {
  return {
    id: "campaign", title: "Three consequences", version: 1, publication: { channel: "official" },
    targetLearnerId: "beginner", expectedMinutes: { min: 35, max: 55 },
    acts: [
      { id: "act1", layers: [{ choices: [node("o1", "opening")] }, { choices: [node("o2", "opening")] }, { choices: [node("o3", "opening")] }] },
      { id: "act2", layers: [{ choices: [node("m1", "middle")] }, { choices: [node("m2", "middle")] }, { choices: [node("m3", "middle")] }] },
      { id: "act3", layers: [{ choices: [node("e1", "end")] }, { choices: [node("e2", "end")] }, { choices: [node("e3", "end")] }] },
    ],
    economy: { startingCharges: 2, actGrants: { act1: 1, act2: 1, act3: 1 } },
    startingModules: [], durableRewards: [],
  };
}

function registries(evidenceRef = "ghost-evidence"): CurriculumRegistries {
  return {
    targetLearners: { beginner: { prerequisites: ["caller-prerequisite"] } },
    packs: {
      opening: { digest: digest("opening"), phase: "opening", form: "pack",
        theory: [{ passageId: "ghost-passage", evidenceRefs: [evidenceRef] }], requirementIds: ["engine"] },
      middle: { digest: digest("middle"), phase: "middlegame", form: "pack", theory: [], requirementIds: [] },
      end: { digest: digest("end"), phase: "endgame", form: "pack", theory: [], requirementIds: [] },
    },
    dependencies: { engine: { operation: "invented.engine", unavailableAction: "honest_degradation", sourceAvailable: true } },
    providerOperations: ["invented.engine"],
  };
}

describe("D2986-D2992 Campaign seventh fresh independent review", () => {
  it("D2986 reports every charged operation committed without an event or operation-specific state", () => {
    for (const operation of ["rewind", "fork", "group", "simulate_enter"] as const) {
      const database = seed(databasePath());
      expect(applyChargedMutation(database, command(operation), () => "ready"))
        .toEqual({ kind: "committed", campaignRevision: 8, playRevision: 13, chargeBalance: 1 });
      const tables = database.prepare("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name").all()
        .map((row) => (row as { name: string }).name);
      expect(tables).not.toContain("campaign_events");
      expect(database.prepare("SELECT revision FROM drill_runs").get()).toEqual({ revision: 13 });
      database.close();
    }
  });

  it("D2987 persists caller-authored provider success and failure as terminal authority", () => {
    const failed = seed(databasePath());
    expect(applyChargedMutation(failed, command("rewind"), () => "failed"))
      .toEqual({ kind: "provider_failed", code: "OPPONENT_PROVIDER_UNAVAILABLE" });
    expect(failed.prepare("SELECT result_payload FROM campaign_mutation_commands").get())
      .toEqual({ result_payload: '{"code":"OPPONENT_PROVIDER_UNAVAILABLE","kind":"provider_failed"}' });
    failed.close();

    const ready = seed(databasePath());
    expect(applyChargedMutation(ready, command("rewind"), () => "ready")).toMatchObject({ kind: "committed" });
    ready.close();
  });

  it("D2988 authorizes assistance from the public fixture issuer with no campaign, play, pack or passage rows", () => {
    const database = createCampaignDatabase(databasePath());
    seedCampaignAssistanceAuthority(database, { subject: assistanceSubject, passageId: "missing-passage",
      applicable: true, disclosable: true, sourceAvailable: true });
    const authority = new CampaignAssistanceStore(database).compile("campaign-a", "missing-passage");
    expect(authorizeCampaignTheory(assistanceSubject, authority)).toBe("authorized");
    expect(database.prepare("SELECT count(*) AS n FROM campaign_runs").get()).toEqual({ n: 0 });
    expect(database.prepare("SELECT count(*) AS n FROM drill_runs").get()).toEqual({ n: 0 });
    database.close();
  });

  it("D2989 accepts an arbitrary payload, crossed result kind and invalid timestamp", () => {
    const input: CampaignEventInput = { campaignRunId: "campaign-a", seq: 2,
      kind: "loadout_changed", commandId: "command-a", expectedRevision: 1,
      operandsDigest: digest("operands"), payload: { arbitrary: { nested: true } },
      resultKind: "campaign_created", at: "not-a-time" };
    expect(parseCampaignEvent(campaignEventBytes(input))).toMatchObject({
      kind: "loadout_changed", payload: input.payload,
      result: { kind: "campaign_created" }, at: "not-a-time",
    });
  });

  it("D2990 accepts malformed economy, rewards, modules, identity and boss topology", () => {
    const malformed = documentImage();
    malformed.id = "";
    malformed.title = "";
    malformed.version = -1;
    malformed.economy = { startingCharges: -50, actGrants: { arbitrary: -2 } };
    malformed.startingModules = [42];
    malformed.durableRewards = [{ unknownReward: true }];
    const first = (((malformed.acts as Array<{ layers: Array<{ choices: Array<Record<string, unknown>> }> }>)[0]!).layers[0]!).choices[0]!;
    first.reward = { arbitrary: true };
    first.consumes = [42];
    first.suppress = [{ unknown: true }];
    const parsed = parseCampaignDocument(stable(malformed));
    expect(parsed).toMatchObject({ id: "", title: "", version: -1,
      economy: { startingCharges: -50 }, startingModules: [42], durableRewards: [{ unknownReward: true }] });
    expect(parsed.acts.flatMap((act) => act.layers).flatMap((layer) => layer.choices).every((choice) => !choice.boss)).toBe(true);
  });

  it("D2991 lets an unauthenticated caller instantiate and issue owner-human review", () => {
    const document = parseCampaignDocument(stable(documentImage()));
    expect(new HumanCurriculumReviewAuthority().issue(document, "2026-09-06T00:00:00.000Z"))
      .toMatchObject({ authority: "owner_human_chess_review", documentDigest: digest(document) });
  });

  it("D2992 compiles caller-invented pack, theory, evidence and provider facts as official metadata", () => {
    const document = parseCampaignDocument(stable(documentImage()));
    const registry = sealCurriculumRegistries(registries());
    const review = new HumanCurriculumReviewAuthority().issue(document, "2026-09-06T00:00:00.000Z");
    const compiled = compileOfficialCurriculum(document, registry, review);
    expect(compiled).toMatchObject({
      targetLearner: { prerequisites: ["caller-prerequisite"] },
      dependencyAvailability: [{ requirement: "engine", operation: "invented.engine", sourceAvailable: true }],
    });
    expect(compiled.theoryProvenance).toHaveLength(3);
    expect(compiled.theoryProvenance.every((row) => row.passageId === "ghost-passage"
      && row.evidenceRefs.join() === "ghost-evidence")).toBe(true);
  });
});
