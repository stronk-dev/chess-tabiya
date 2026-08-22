import { describe, expect, it } from "vitest";

import {
  BOT_POLICY_PROFILES,
  applyPolicyMultiplier,
  compileBotPolicyCatalog,
  compileBotProfile,
  drawPolicyMove,
  reconstructMaiaDistribution,
  type BotLayerDeclaration,
  type BotProfileDeclaration,
} from "./bot-policy-catalog.js";

const base: BotLayerDeclaration = {
  id: "model.maia3@1",
  kind: "human_policy_model",
  inputs: ["provider.maia.raw_policy"],
  effect: "base_distribution",
  parameters: { band: 1500 },
  parameterCitation: "design/research/maia-band-outcome-transfer.md",
  fallback: "unavailable",
  abstentions: ["provider_unavailable"],
  changesStrength: true,
  engineId: "maia-5m",
  modelId: "maia3-5m",
  band: 1500,
  historyCapability: "full_history",
};

const sampler: BotLayerDeclaration = {
  id: "sampler.maia_reconstruction@1",
  kind: "sampler",
  inputs: ["provider.maia.raw_policy"],
  effect: "sample",
  parameters: { temperature: 0.8, topP: 0.92, completenessThreshold: 0.97 },
  parameterCitation: "design/research/bot-policy.md",
  fallback: "base_model",
  abstentions: ["incomplete_vector"],
  changesStrength: true,
  requiresCompleteVector: true,
  degradedPath: "base_model",
  temperature: 0.8,
  topP: 0.92,
  completenessThreshold: 0.97,
};

const presentation: BotLayerDeclaration = {
  id: "presentation.human_baseline@1",
  kind: "presentation",
  inputs: [],
  effect: "presentation",
  parameters: {},
  parameterCitation: "planning/platform-alignment/bot-policy/o8-handoff.md",
  fallback: "deterministic_name",
  abstentions: [],
  changesStrength: false,
  name: "Human baseline",
  bio: "Samples the declared Maia policy band.",
};

function profile(layers: readonly BotLayerDeclaration[] = [base, sampler, presentation]): BotProfileDeclaration {
  return { id: "human-baseline-1500", version: 1, layers };
}

describe("compiled bot-policy catalog", () => {
  it("canonicalizes a profile independently of object-key insertion order", () => {
    const one = compileBotProfile(profile());
    const two = compileBotProfile({ version: 1, layers: [base, sampler, presentation], id: "human-baseline-1500" });
    expect(one.digest).toBe(two.digest);
    expect(one.controlledTraits).toEqual([]);
  });

  it("sorts profiles and refuses duplicate identities", () => {
    const a = profile();
    const b = { ...profile(), id: "another" };
    expect(compileBotPolicyCatalog([a, b]).map((entry) => entry.id)).toEqual(["another", "human-baseline-1500"]);
    expect(() => compileBotPolicyCatalog([a, a])).toThrow(/duplicate profile/u);
  });

  it.each([
    ["duplicate authority", [base, { ...base, id: "model.other@1" }, sampler, presentation]],
    ["incomplete without degraded path", [base, { ...sampler, degradedPath: undefined }, presentation]],
    ["zero temperature", [base, { ...sampler, temperature: 0, parameters: { temperature: 0 } }, presentation]],
    ["delay", [base, sampler, { ...presentation, effect: "delay" }, presentation]],
    ["memory instance", [base, sampler, presentation, { ...presentation, id: "memory.hidden@1", kind: "memory", effect: "memory" }]],
    ["learner input", [base, { ...sampler, inputs: ["evidence.learner.style@1"] }, presentation]],
  ] as const)("refuses %s", (_name, layers) => {
    expect(() => compileBotProfile(profile(layers as readonly BotLayerDeclaration[]))).toThrow(/compilation failed/u);
  });

  it("requires literal guard disclosure and passing trait measurements", () => {
    const guard: BotLayerDeclaration = {
      id: "guard.severe_error@1", kind: "error_guard", inputs: ["provider.stockfish.fixed_bound_loss"], effect: "mask",
      parameters: { thresholdCp: 250 }, parameterCitation: "design/research/bot-policy.md", fallback: "base_model",
      abstentions: ["provider_unavailable", "empty_after_mask"], changesStrength: true, disclosure: "Stockfish guard",
      engineId: "stockfish-play", searchBound: { kind: "nodes", value: 25000 }, thresholdCp: 250,
    };
    expect(() => compileBotProfile(profile([base, sampler, guard, presentation]))).toThrow(/disclosure omits/u);

    const trait: BotLayerDeclaration = {
      id: "trait.forcing@1", kind: "controlled_trait", inputs: [], effect: "weight", parameters: { multiplier: 3 },
      parameterCitation: "design/research/bot-policy.md", fallback: "identity", abstentions: [], changesStrength: true,
      classifier: "forcing", multiplier: 3,
      measurement: { dossier: "design/research/bot-policy.md", population: "R11", metric: "forcing_rate", traitDelta: 0.0302, expectedLossShiftCp: 0, severeMassRise: 0, explorerMatchRetention: 1 },
    };
    expect(() => compileBotProfile(profile([base, sampler, trait, presentation]))).toThrow(/controlled-trait gate/u);
  });

  it("ships no guessed roster while D970 is unresolved", () => {
    expect(BOT_POLICY_PROFILES).toEqual([]);
  });

  it("reconstructs the pinned top-p distribution and forces top-1", () => {
    const result = reconstructMaiaDistribution([
      { moveUci: "a2a3", mass: 0.4 },
      { moveUci: "b2b3", mass: 0.3 },
      { moveUci: "c2c3", mass: 0.2 },
    ], 1, 0.5);
    expect(result.completeness).toBeCloseTo(0.9);
    expect(result.rows.map((row) => [row.moveUci, row.finalMass])).toEqual([
      ["a2a3", 1], ["b2b3", 0], ["c2c3", 0],
    ]);
  });

  it("uses the supplied position-pure tiebreak at the top-p boundary", () => {
    const rows = [{ moveUci: "a2a3", mass: 0.5 }, { moveUci: "b2b3", mass: 0.5 }];
    const result = reconstructMaiaDistribution(rows, 1, 0.5, (left, right) => right.localeCompare(left));
    expect(result.rows.find((row) => row.finalMass > 0)?.moveUci).toBe("b2b3");
  });

  it("reweights only the selected trait and draws from final mass", () => {
    const reconstructed = reconstructMaiaDistribution([
      { moveUci: "g1f3", mass: 0.5 }, { moveUci: "e2e4", mass: 0.5 },
    ], 1, 1).rows;
    const weighted = applyPolicyMultiplier(reconstructed, (move) => move === "e2e4" ? 4 : 1);
    expect(weighted.find((row) => row.moveUci === "e2e4")?.finalMass).toBeCloseTo(0.8);
    expect(drawPolicyMove(weighted, 0.1)).toBe("g1f3");
    expect(drawPolicyMove(weighted, 0.3)).toBe("e2e4");
  });
});
