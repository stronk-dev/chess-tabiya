import { describe, expect, it } from "vitest";

import { assistanceDigest, compileAssistanceRequest, compileAuthoritativeAssistance, finalizeAssistanceEffects, MODULE_SOURCE_AUTHORITY, parseFinalizedAssistanceV1, AssistanceExchangeError } from "./assistance-exchange.js";
import { campaignModuleShelf, type CampaignRunReward } from "./campaign-contract.js";
import { deriveCampaignParticipationWitness } from "./campaign-participation.js";
import { CampaignReceiptError, issueCampaignEncounterReceipt, verifyCampaignEncounterReceipt, type CampaignAssistanceSubject } from "./campaign-receipt.js";
import { createRun } from "./runtime.js";
import { commitMove, fork } from "./runtime.js";
import type { DrillRun } from "./types.js";

// rfc/campaign-core.md §5.1 / criteria 29 and 33, and rfc/intent-presets.md Discharge D6: the
// executable Campaign origin is an issued receipt; structural look-alikes and crossed subjects refuse.

const SUBJECT: CampaignAssistanceSubject = {
  learnerId: "learner-a",
  campaignRunId: "campaign-run-1",
  campaignDocumentDigest: `sha256:${"a".repeat(64)}`,
  campaignRevision: 4,
  nodeId: "a1-l3",
  playRunId: "play-run-1",
  packDigest: `sha256:${"b".repeat(64)}`,
  workflowContext: "campaign",
  disclosureCeiling: "campaign_context",
  inventoryEventSeq: 4,
  nodeEnteredEventDigest: `sha256:${"c".repeat(64)}`,
};

function receipt(overrides: { suppressed?: readonly ("guided_hint" | "postcommit_nudge")[]; equipped?: readonly ("guided_hint" | "postcommit_nudge" | "sight_on_request")[] } = {}) {
  return issueCampaignEncounterReceipt({
    subject: SUBJECT,
    phase: "active",
    owned: ["sight_on_request", "postcommit_nudge", "guided_hint"],
    equipped: overrides.equipped ?? ["sight_on_request", "postcommit_nudge", "guided_hint"],
    suppressed: overrides.suppressed ?? [],
    theoryOwned: [],
  });
}

const ACCESS = { deliveryOpen: true, role: "solo" as const, seatedInContest: false, reviewing: false };
const AVAILABLE = { llm: { state: "available" }, tts: { state: "available" }, stockfish: { state: "available" }, syzygy: { state: "available" }, maia: { state: "available" }, explorer: { state: "available" } } as const;

describe("campaign encounter receipt", () => {
  it("verifies issued receipts and refuses structural copies and post-issue edits", () => {
    const issued = receipt();
    expect(verifyCampaignEncounterReceipt(issued)).toBe(issued);
    expect(issued.modules.effective).toEqual(["rules_floor", "sight_on_request", "postcommit_nudge", "guided_hint"]);
    const copy = JSON.parse(JSON.stringify(issued)) as unknown;
    expect(() => verifyCampaignEncounterReceipt(copy)).toThrowError(expect.objectContaining<Partial<CampaignReceiptError>>({ code: "CAMPAIGN_RECEIPT_FORGED" }));
    expect(() => verifyCampaignEncounterReceipt({ ...issued })).toThrowError(expect.objectContaining<Partial<CampaignReceiptError>>({ code: "CAMPAIGN_RECEIPT_FORGED" }));
    expect(Object.isFrozen(issued.modules.effective)).toBe(true);
  });

  it("refuses every crossed subject field independently (criterion 33)", () => {
    const issued = receipt();
    for (const [key, value] of Object.entries({ learnerId: "learner-b", campaignRunId: "other", campaignDocumentDigest: `sha256:${"d".repeat(64)}`, campaignRevision: 5, nodeId: "a2-l1", playRunId: "play-2", packDigest: `sha256:${"e".repeat(64)}`, inventoryEventSeq: 9, nodeEnteredEventDigest: `sha256:${"f".repeat(64)}` })) {
      expect(() => verifyCampaignEncounterReceipt(issued, { [key]: value })).toThrowError(expect.objectContaining<Partial<CampaignReceiptError>>({ code: "subject_mismatch" }));
    }
    expect(verifyCampaignEncounterReceipt(issued, SUBJECT)).toBe(issued);
  });

  it("makes the Campaign context executable: the kit preset narrows to earned, equipped, unsuppressed tools", () => {
    const requested = compileAssistanceRequest({ contextHint: "campaign", preference: { kind: "unset" } });
    const compiled = compileAuthoritativeAssistance(requested, { origin: { kind: "campaign_encounter", receipt: receipt({ suppressed: ["guided_hint"], equipped: ["sight_on_request", "guided_hint"] }) }, access: ACCESS, availability: AVAILABLE });
    expect(compiled.context).toBe("campaign");
    expect(compiled.preset).toBe("campaign_kit");
    expect(compiled.modules).toEqual(["rules_floor", "sight_on_request"]);
    const reasons = Object.fromEntries(compiled.suppressed.filter((record) => record.kind === "module").map((record) => [record.kind === "module" ? record.moduleId : "", record.reason]));
    expect(reasons).toMatchObject({ postcommit_nudge: "campaign_not_equipped", guided_hint: "campaign_boss_suppressed", threat_radar: "campaign_not_earned", full_inspector: "campaign_not_earned" });
    // The kit cannot drive the raw inspector, so its fields narrow too.
    expect(compiled.config.humanSplit).toBe("off");
    expect(compiled.campaignReceipt?.inventoryEventSeq).toBe(4);
    const finalized = finalizeAssistanceEffects(compiled, { authority: MODULE_SOURCE_AUTHORITY, availability: AVAILABLE });
    expect(parseFinalizedAssistanceV1(JSON.parse(JSON.stringify(finalized))).context).toBe("campaign");
  });

  it("refuses a campaign hint on an ordinary run and a forged receipt", () => {
    const requested = compileAssistanceRequest({ contextHint: "campaign", preference: { kind: "unset" } });
    expect(() => compileAuthoritativeAssistance(requested, { origin: { kind: "run", sessionKind: "pack", feedbackPolicy: "attempt_end" }, access: ACCESS, availability: AVAILABLE }))
      .toThrowError(expect.objectContaining<Partial<AssistanceExchangeError>>({ code: "CONTEXT_MISMATCH" }));
    const forged = { ...receipt(), receiptDigest: assistanceDigest({}) };
    expect(() => compileAuthoritativeAssistance(requested, { origin: { kind: "campaign_encounter", receipt: forged }, access: ACCESS, availability: AVAILABLE }))
      .toThrowError(expect.objectContaining<Partial<AssistanceExchangeError>>({ code: "EXCHANGE_SHAPE_INVALID" }));
    const pack = compileAssistanceRequest({ contextHint: "pack", preference: { kind: "unset" } });
    expect(() => compileAuthoritativeAssistance(pack, { origin: { kind: "campaign_encounter", receipt: receipt() }, access: ACCESS, availability: AVAILABLE }))
      .toThrowError(expect.objectContaining<Partial<AssistanceExchangeError>>({ code: "CONTEXT_MISMATCH" }));
  });
});

describe("module shelf reasons (§3.2, criterion 16)", () => {
  it("renders exactly one precedence-ordered reason per owned module", () => {
    const shelf = campaignModuleShelf({ owned: ["sight_on_request", "postcommit_nudge", "guided_hint", "threat_radar"], equipped: ["sight_on_request", "guided_hint", "threat_radar"], suppressed: ["guided_hint"], unavailable: ["threat_radar"] });
    expect(shelf.map((row) => [row.moduleId, row.reason])).toEqual([["sight_on_request", null], ["threat_radar", "source_unavailable"], ["postcommit_nudge", "not_equipped"], ["guided_hint", "boss_suppressed"]]);
    const reward: CampaignRunReward = { kind: "resource_grant", resourceId: "campaign_rewind_charge", amount: 1 };
    expect(reward.kind).toBe("resource_grant");
  });
});

describe("participation witness (§4.1, criterion 8)", () => {
  function started(): DrillRun {
    return createRun({ id: "witness-run", packId: "p", packDigest: `sha256:${"a".repeat(64)}`, startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", seed: 1, createdAt: "2026-09-24T12:00:00.000Z", policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
  }

  it("refuses the untouched root and a system-only line, and witnesses a played line at the authored boundary", () => {
    const run = started();
    expect(deriveCampaignParticipationWitness(run, run.branches[0]!.id, { authoredBoundary: { plyHorizon: 2 } })).toMatchObject({ kind: "refused", reason: "untouched_root" });
    const systemOnly = commitMove(run, "e2e4", { actor: "system" }).run;
    expect(deriveCampaignParticipationWitness(systemOnly, run.branches[0]!.id, { authoredBoundary: { plyHorizon: 1 } })).toMatchObject({ kind: "refused", reason: "no_learner_move" });
    const one = commitMove(run, "e2e4", { actor: "user" }).run;
    expect(deriveCampaignParticipationWitness(one, run.branches[0]!.id, { authoredBoundary: { plyHorizon: 2 } })).toMatchObject({ kind: "refused", reason: "before_completion_boundary" });
    expect(deriveCampaignParticipationWitness(one, run.branches[0]!.id, {})).toMatchObject({ kind: "refused", reason: "before_completion_boundary" });
    const witnessed = deriveCampaignParticipationWitness(one, run.branches[0]!.id, { authoredBoundary: { plyHorizon: 1 } });
    expect(witnessed).toMatchObject({ kind: "witnessed", verdict: "open", witness: { completion: "authored_boundary", learnerMoveEventSeq: one.events.find((event) => event.type === "move.committed")!.seq } });
  });

  it("refuses a learner move that lives on another fork than the submitted branch", () => {
    const run = started();
    const rootBranch = run.branches[0]!.id;
    const played = commitMove(run, "e2e4", { actor: "user" }).run;
    const forked = fork(played, played.nodes[0]!.id, { label: "other" }).run;
    const otherBranch = forked.branches.find((branch) => branch.id !== rootBranch)!.id;
    expect(deriveCampaignParticipationWitness(forked, otherBranch, { authoredBoundary: { plyHorizon: 0 } })).toMatchObject({ kind: "refused" });
  });
});
