import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  applyChargedMutation,
  authorizeCampaignTheory,
  compileOfficialCurriculum,
  digest,
  parseCampaignEvent,
  type AssistanceSubject,
  type CampaignDocument,
  type CampaignEconomyState,
  type CampaignMutationCommand,
  type CurriculumRegistries,
} from "../d2620-campaign-fifth-author-repair/contract.js";

const campaignRfc = readFileSync("rfc/campaign-core.md", "utf8");
const rfcRegister = readFileSync("rfc/README.md", "utf8");

function initialState(balance = 2): CampaignEconomyState {
  return Object.freeze({ campaignRevision: 7, playRevision: 12, chargeBalance: balance, stored: new Map() });
}

function command(overrides: Partial<CampaignMutationCommand> = {}): CampaignMutationCommand {
  return Object.freeze({
    campaignRunId: "campaign-a",
    playRunId: "play-a",
    mutationCommandId: "command-a",
    expectedCampaignRevision: 7,
    operation: "group",
    operandsDigest: digest({ group: ["a", "b"] }),
    ...overrides,
  });
}

function event(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const payload = { equippedModuleIds: ["guided_hint"] };
  return {
    campaignRunId: "campaign-a",
    seq: 2,
    kind: "loadout_changed",
    commandId: "command-a",
    expectedRevision: 1,
    operandsDigest: digest("operands"),
    payload,
    result: {
      kind: "loadout_changed",
      campaignRevision: 2,
      digest: digest({ kind: "loadout_changed", campaignRevision: 2, payload }),
    },
    at: "now",
    ...overrides,
  };
}

function officialInputs(): {
  readonly document: CampaignDocument;
  readonly registries: CurriculumRegistries;
} {
  const document: CampaignDocument = {
    id: "campaign",
    version: 1,
    publication: { channel: "official" },
    targetLearnerId: "beginner",
    expectedMinutes: { min: 35, max: 55 },
    nodes: [
      { id: "opening", packId: "opening-pack", packDigest: digest("opening") },
      { id: "middle", packId: "middle-pack", packDigest: digest("middle") },
      { id: "end", packId: "end-pack", packDigest: digest("end") },
    ],
  };
  const packs = {
    "opening-pack": { digest: digest("opening"), phase: "opening" as const, form: "pack" as const, theoryPassageIds: ["passage"], evidenceRefs: ["evidence"], requirementIds: [] },
    "middle-pack": { digest: digest("middle"), phase: "middlegame" as const, form: "pack" as const, theoryPassageIds: [], evidenceRefs: ["evidence"], requirementIds: [] },
    "end-pack": { digest: digest("end"), phase: "endgame" as const, form: "pack" as const, theoryPassageIds: [], evidenceRefs: ["evidence"], requirementIds: [] },
  };
  return {
    document,
    registries: {
      targetLearners: ["beginner"],
      packs,
      passages: ["passage"],
      evidence: ["evidence"],
      dependencies: {},
      providerOperations: [],
    },
  };
}

describe("D2736-D2741 Campaign fifth fresh independent review", () => {
  it("D2736 loses terminal provider failure across process-state reconstruction", () => {
    let calls = 0;
    const failed = applyChargedMutation(initialState(), command(), () => {
      calls += 1;
      return "failed";
    });
    expect(failed.result.kind).toBe("provider_failed");

    const restarted: CampaignEconomyState = Object.freeze({
      campaignRevision: failed.state.campaignRevision,
      playRevision: failed.state.playRevision,
      chargeBalance: failed.state.chargeBalance,
      stored: new Map(),
    });
    applyChargedMutation(restarted, command(), () => {
      calls += 1;
      return "failed";
    });
    expect(calls).toBe(2);
    expect(campaignRfc).not.toMatch(/CREATE TABLE campaign_mutation_(?:commands|results)/u);
  });

  it("D2737 spends a state for unrelated aggregate identities without an expected play revision", () => {
    const result = applyChargedMutation(
      initialState(),
      command({ campaignRunId: "other-campaign", playRunId: "other-play" }),
      () => "ready",
    );
    expect(result.result).toMatchObject({ kind: "committed", playRevision: 13 });
    expect("expectedPlayRevision" in command()).toBe(false);
  });

  it("D2738 authorizes entirely caller-authored assistance and omits learner/document identity", () => {
    const subject: AssistanceSubject = {
      campaignRunId: "campaign",
      nodeId: "node",
      playRunId: "play",
      packDigest: digest("pack"),
      workflowContext: "campaign",
      disclosureCeiling: "theory_only",
      inventoryEventSeq: 4,
      nodeEnteredEventDigest: digest("entered"),
    };
    const gate = {
      passageId: "passage",
      authorizingModuleId: "guided_hint",
      sourceId: "invented-source",
      subject,
      applicability: { subject, passageId: "passage", applicable: true, sourceReceiptDigest: digest("invented-applicability") },
      disclosure: { subject, passageId: "passage", allowed: true, sourceReceiptDigest: digest("invented-disclosure") },
    };
    expect(authorizeCampaignTheory(subject, gate)).toBe("authorized");
    expect(subject).not.toHaveProperty("learnerId");
    expect(subject).not.toHaveProperty("campaignDocumentDigest");
    expect(subject).not.toHaveProperty("campaignRevision");
  });

  it("D2739 transplants a result digest across campaign and command envelopes", () => {
    const original = parseCampaignEvent(JSON.stringify(event()));
    const transplanted = parseCampaignEvent(JSON.stringify(event({
      campaignRunId: "other-campaign",
      commandId: "other-command",
      operandsDigest: digest("different-operands"),
    })));
    expect(transplanted.result.digest).toBe(original.result.digest);
    expect(transplanted.campaignRunId).not.toBe(original.campaignRunId);
    expect(parseCampaignEvent(JSON.stringify(event()).replace('"commandId":"command-a"', '"commandId":"ignored","commandId":"command-a"')).commandId).toBe("command-a");
  });

  it("D2740 compiles official metadata from unsealed partial inputs and an invalid review instant", () => {
    const { document, registries } = officialInputs();
    const compiled = compileOfficialCurriculum(document, registries, {
      authority: "owner_human_chess_review",
      documentDigest: digest(document),
      reviewedAt: "now",
    }) as unknown as Record<string, unknown>;
    expect(compiled.formCoverage).toBeUndefined();
    expect(compiled.targetLearner).toBeUndefined();
    expect(compiled.dependencyAvailability).toBeUndefined();
    expect((compiled.reviewReceipt as { reviewedAt: string }).reviewedAt).toBe("now");
  });

  it("D2741 advertises returned dependencies as accepted and implemented", () => {
    expect(campaignRfc).toMatch(/Depends on:[\s\S]*intent-presets\.md` \(accepted/u);
    expect(campaignRfc).toMatch(/accepted and implemented\s+`rfc\/pack-capability-contract\.md`/u);
    expect(campaignRfc).toMatch(/accepted and implemented\s+`rfc\/theory-drill-current-joins\.md`/u);
    expect(rfcRegister).toMatch(/`intent-presets\.md` \| \*\*draft/u);
    expect(rfcRegister).toMatch(/`pack-capability-contract\.md` \| \*\*draft/u);
    expect(rfcRegister).toMatch(/`theory-drill-current-joins\.md` \| \*\*draft/u);
  });
});
