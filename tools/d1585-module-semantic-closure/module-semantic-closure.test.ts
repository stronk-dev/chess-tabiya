// DISPOSABLE research harness — D1585/D1586/D1587/D1589/D1591. Not production code.
import { describe, expect, it } from "vitest";

import { STRUCTURAL_FEATURE_KINDS } from "../../packages/schema/src/drill-pack/types.js";
import {
  PRIMARY_EVIDENCE_MANIFEST,
} from "../../packages/runtime/src/evidence-catalog.js";
import {
  assertConsumerEvidenceView,
  declareEvidence,
  evidenceForConsumer,
  renderEvidenceItems,
  type AnswerDistance,
  type EvidenceRendererRegistry,
} from "../../packages/runtime/src/evidence-contract.js";
import { CORPUS_GUARD } from "../../packages/runtime/src/population-guard.js";

import {
  ANSWER_CAPABILITY_IMAGE,
  RULES_FLOOR_ROLES,
  answerPolicy,
  answerPolicyAdmits,
  explorerPopulationSummary,
  moduleRoleAdmitted,
  type ExplorerPage,
} from "./module-semantic-closure.js";

const refKey = (value: { readonly id: string; readonly version: number }): string => `${value.id}@${value.version}`;

describe("D1585 explicit answer-content branches", () => {
  it("refuses the false theory/evaluation total order in both directions", () => {
    expect(answerPolicyAdmits(ANSWER_CAPABILITY_IMAGE.theory, ["evaluation"])).toBe(false);
    expect(answerPolicyAdmits(ANSWER_CAPABILITY_IMAGE.evaluation, ["theory"])).toBe(false);
    expect(answerPolicyAdmits(ANSWER_CAPABILITY_IMAGE.evaluation, ["principle"])).toBe(false);
    expect(answerPolicyAdmits(ANSWER_CAPABILITY_IMAGE.evaluation, ["plan"])).toBe(false);
  });

  it("requires a literal union when a surface intentionally combines branches", () => {
    const review = answerPolicy("pattern", "threat", "evaluation");
    expect(answerPolicyAdmits(review, ["fact", "pattern", "threat", "evaluation"])).toBe(true);
    expect(answerPolicyAdmits(review, ["candidate_moves"])).toBe(false);
    expect(answerPolicyAdmits(review, ["move"])).toBe(false);
  });

  it("keeps move-bearing capabilities progressive without making them imply theory or evaluation", () => {
    expect(answerPolicyAdmits(ANSWER_CAPABILITY_IMAGE.principal_variation, ["candidate_moves", "ranked_moves", "move", "principal_variation"])).toBe(true);
    expect(answerPolicyAdmits(ANSWER_CAPABILITY_IMAGE.principal_variation, ["theory"])).toBe(false);
    expect(answerPolicyAdmits(ANSWER_CAPABILITY_IMAGE.principal_variation, ["evaluation"])).toBe(false);
  });
});

describe("D1591 sight declaration derived from the literal accepted set", () => {
  it("derives fact+pattern from the actual 22 projections and names rook-on-seventh as the pattern witness", () => {
    const accepted = [
      ...STRUCTURAL_FEATURE_KINDS.filter((kind) => kind !== "pawn_count").map((kind) => `rules.structural.reading.${kind}`),
      "rules.castling.reading.rights",
      "rules.castling.reading.legality",
      "rules.tactic.reading.rook_on_seventh",
      "rules.square.reading.control",
      "rules.pawn.reading.contacts",
    ];
    expect(accepted).toHaveLength(22);
    const projections = accepted.map((id) => PRIMARY_EVIDENCE_MANIFEST.projections.find((projection) => projection.id === id));
    expect(projections.every((projection) => projection !== undefined)).toBe(true);
    const union = [...new Set(projections.flatMap((projection) => projection!.answerContent))].sort();
    expect(union).toEqual(["fact", "pattern"] satisfies AnswerDistance[]);
    expect(projections.filter((projection) => projection!.answerContent.includes("pattern")).map((projection) => projection!.id)).toEqual([
      "rules.tactic.reading.rook_on_seventh",
    ]);
    expect(accepted).not.toContain("rules.structural.reading.space");
    expect(accepted).not.toContain("rules.structural.reading.pawn_connectivity");
  });
});

describe("D1586 explorer population summary", () => {
  const population = Object.freeze({ source: "lichess-explorer" as const, ratings: [1600], speeds: ["rapid"], since: "2020-01", until: "2026-08" });

  it("retains population context but structurally excludes SAN, UCI and committed move identity", () => {
    const page: ExplorerPage = Object.freeze({
      nodeId: "node-1",
      committedMoveSan: "SENTINEL_COMMITTED_SAN",
      result: Object.freeze({
        kind: "stats" as const,
        total: 240,
        white: 120,
        draws: 40,
        black: 80,
        moves: Object.freeze([{ san: "SENTINEL_SAN", uci: "a2a4", playedCount: 12, sharePct: 5, white: 6, draws: 2, black: 4 }]),
        recency: Object.freeze({ kind: "month" as const, lastPlayedMonth: "2026-08" }),
        population,
      }),
    });
    const summary = explorerPopulationSummary(page);
    const bytes = JSON.stringify(summary);
    expect(summary).toMatchObject({ nodeId: "node-1", kind: "stats", total: 240, population });
    expect(bytes).not.toContain("moves");
    expect(bytes).not.toContain("SENTINEL_SAN");
    expect(bytes).not.toContain("a2a4");
    expect(bytes).not.toContain("SENTINEL_COMMITTED_SAN");
    expect(CORPUS_GUARD).toContain("not what is good");
  });

  it("preserves honest abstention without inventing population facts", () => {
    const summary = explorerPopulationSummary(Object.freeze({
      nodeId: "node-2",
      committedMoveSan: null,
      result: Object.freeze({ kind: "abstention" as const, reason: "source_unavailable" as const, detail: "HTTP 429", population }),
    }));
    expect(summary).toEqual({ nodeId: "node-2", kind: "abstention", reason: "source_unavailable", detail: "HTTP 429", population });
  });
});

describe("D1587 authority-preserving reduction bridge", () => {
  it("reseals only retained evidence and excludes a dropped sentinel from render/provider/checker bytes", () => {
    const grouped = PRIMARY_EVIDENCE_MANIFEST.consumers.map((consumer) => ({
      consumer,
      bindings: PRIMARY_EVIDENCE_MANIFEST.bindings.filter((binding) => refKey(binding.consumer) === refKey(consumer)),
    }));
    const target = grouped.find((entry) => new Set(entry.bindings.map((binding) => refKey(binding.projection))).size >= 2)!;
    const [keptBinding, droppedBinding] = [...new Map(target.bindings.map((binding) => [refKey(binding.projection), binding])).values()];
    const kept = declareEvidence(keptBinding!.producer, keptBinding!.projection, Object.freeze({ marker: "KEPT" }));
    const dropped = declareEvidence(droppedBinding!.producer, droppedBinding!.projection, Object.freeze({ marker: "SENTINEL_DROPPED" }));
    const admitted = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, target.consumer, [kept, dropped]);
    expect(admitted.items).toHaveLength(2);

    const narrowed = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, target.consumer, [kept]);
    const renderers: EvidenceRendererRegistry<{ readonly marker: string }> = Object.freeze({
      [refKey(kept.projection)]: (evidence) => Object.freeze([evidence.payload.marker]),
    });
    const rendered = renderEvidenceItems(narrowed, renderers);
    const deterministic = rendered.items.flatMap((item) => item.sentences);
    const providerInput = [...deterministic];
    const voiceAllowList = new Set(deterministic);
    expect(deterministic).toEqual(["KEPT"]);
    expect(providerInput).not.toContain("SENTINEL_DROPPED");
    expect(voiceAllowList.has("SENTINEL_DROPPED")).toBe(false);

    const forged = { ...admitted, items: [kept] };
    expect(() => assertConsumerEvidenceView(forged)).toThrow(/EVIDENCE_GENERIC_BYPASS/u);
  });
});

describe("D1589 match rules floor", () => {
  it("admits the seated participant while excluding spectator and non-floor guidance by construction", () => {
    expect(moduleRoleAdmitted(RULES_FLOOR_ROLES, "learner")).toBe(true);
    expect(moduleRoleAdmitted(RULES_FLOOR_ROLES, "host")).toBe(true);
    expect(moduleRoleAdmitted(RULES_FLOOR_ROLES, "participant")).toBe(true);
    expect(moduleRoleAdmitted(RULES_FLOOR_ROLES, "spectator")).toBe(false);
    expect(moduleRoleAdmitted(["learner", "host"], "participant")).toBe(false);
  });
});
