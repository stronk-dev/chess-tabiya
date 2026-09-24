import { describe, expect, it } from "vitest";

import { parseCapabilities } from "./capability-response.js";
import { botRosterFixture } from "./bot-roster.test-support.js";

const capabilities = Object.freeze({
  engines: [{ id: "maia-5m", kind: "opponent", name: "Maia", version: "1", modelId: "maia-1500", seedHonored: true, eloHonored: true }],
  policyModes: ["human_common", "theory_strict"],
  unsupportedPolicyModes: [{ mode: "plan_defense", reason: "Not selectable yet." }],
  feedbackPolicies: ["delayed_checkpoint", "immediate_guard"],
  guardBasis: ["rules"],
  recordedReadingKinds: [{ kind: "engine_eval", disposition: "admitted", reason: "Recorded evidence." }],
  assessmentCategories: ["win", "loss", "draw", "cursed-win", "blessed-loss"],
  objectiveAssessmentSets: { win: ["win"], hold: ["draw", "cursed-win", "blessed-loss"], save: ["loss", "blessed-loss"], resist: ["loss", "blessed-loss"] },
  runSchemaVersion: "0.17",
  policyProfiles: {
    strong_engine: { movetimeMs: 100, threads: 1, hashMb: 16, multiPv: 1 },
    human_common: {
      elo: { min: 1100, max: 1900, default: 1500, source: "configured", advertised: { min: 0, max: 5000 } },
      resistance: {
        basis: "measured", metric: "dtz_percentile", scope: "fixed tablebase corpus",
        corpus: { dossier: "design/research/maia-endgame-fidelity.md#6", positions: 15, probes: 270, measuredAt: "2026-08-16" },
        bands: [1100, 1500, 1900], bandConditioned: false,
        dtzPercentile: { min: 0.719, max: 0.751, uniformBaseline: 0.38 },
        slowestLosingRate: { min: 0.611, max: 0.689, uniformBaseline: 0.227 },
        fastestLosingRate: { value: 0.033, uniformBaseline: 0.313 },
      },
      profiles: botRosterFixture(),
    },
  },
  providers: { opponent: "maia", judge: "none", llm: "none", corpus: "mock", tts: "none", tablebase: "mock" },
  surfaces: { play: "available", review: "available", learn: "available", live: "available", create: "available", justPlay: "available", fromPosition: "available" },
  evidenceManifest: {
    digest: "c".repeat(64),
    counts: { producers: 1, projections: 1, consumers: 1, bindings: 1, semanticEvents: 0, eligibility: 0, reasons: 0, selectionPolicies: 0 },
    availability: [{ producerId: "human.maia", version: 1, state: "available", reason: "Maia is ready." }],
    bindings: [{ consumerId: "opponent.selection", consumerVersion: 1, projectionId: "human.maia.policy", projectionVersion: 1, forms: ["machine_condition"], providerOff: "unavailable" }],
  },
});

describe("capability response authority", () => {
  it("accepts and deeply freezes the reduced public capability contract", () => {
    const parsed = parseCapabilities(capabilities);
    expect(parsed).toEqual(capabilities);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.evidenceManifest.bindings[0])).toBe(true);
  });

  it("admits two versions of one projection bound to the same consumer as distinct edges", () => {
    // rfc/recorded-semantic-path.md: an `@2` successor is bound beside its retained `@1` predecessor.
    const [binding] = capabilities.evidenceManifest.bindings;
    const value = { ...capabilities, evidenceManifest: { ...capabilities.evidenceManifest, bindings: [binding, { ...binding, projectionVersion: 2 }], counts: { ...capabilities.evidenceManifest.counts, bindings: 2 } } };
    expect(parseCapabilities(value).evidenceManifest.bindings).toHaveLength(2);
  });

  it.each([
    [{ ...capabilities, capabilityDispositions: [] }],
    [{ ...capabilities, providers: { ...capabilities.providers, opponent: "stockfish" } }],
    [{ ...capabilities, engines: [capabilities.engines[0], capabilities.engines[0]] }],
    [{ ...capabilities, policyProfiles: { ...capabilities.policyProfiles, human_common: { ...capabilities.policyProfiles.human_common, elo: { ...capabilities.policyProfiles.human_common.elo, min: 2000, max: 1000 } } } }],
    [{ ...capabilities, evidenceManifest: { ...capabilities.evidenceManifest, counts: { ...capabilities.evidenceManifest.counts, producers: 2 } } }],
    [{ ...capabilities, evidenceManifest: { ...capabilities.evidenceManifest, bindings: [capabilities.evidenceManifest.bindings[0], capabilities.evidenceManifest.bindings[0]], counts: { ...capabilities.evidenceManifest.counts, bindings: 2 } } }],
    [{ ...capabilities, surfaces: { ...capabilities.surfaces, campaign: "available" } }],
  ])("refuses internal, crossed, inconsistent, or unknown capability bytes", (value) => {
    expect(() => parseCapabilities(value)).toThrow(TypeError);
  });

  describe("bot-profile-catalog@1 roster (rfc/bot-policy.md §8)", () => {
    const withProfiles = (profiles: unknown) => ({ ...capabilities, policyProfiles: { ...capabilities.policyProfiles, human_common: { ...capabilities.policyProfiles.human_common, profiles } } });
    const rows = botRosterFixture();
    const first = rows[0]!;

    it("accepts the roster that is set-equal to the runtime catalog", () => {
      expect(parseCapabilities(withProfiles(rows)).policyProfiles.human_common.profiles.map((row) => row.reference.id)).toEqual(rows.map((row) => row.reference.id));
    });

    it.each([
      ["a missing profile", () => rows.slice(1)],
      ["a duplicated profile", () => [...rows.slice(1), rows[1]]],
      ["a substituted family on a genuine id", () => [{ ...first, reference: { ...first.reference, family: "pawn-forward" } }, ...rows.slice(1)]],
      ["a foreign behaviour digest", () => [{ ...first, behaviorDigest: rows[1]!.behaviorDigest }, ...rows.slice(1)]],
      ["a card for another profile", () => [{ ...first, card: rows[1]!.card }, ...rows.slice(1)]],
      ["an unregistered statement id", () => [{ ...first, card: { ...first.card, statements: [{ id: "card.persona", text: "Loves attacking chess.", sources: ["catalog.profile"] }] } }, ...rows.slice(1)]],
      ["a statement without a source", () => [{ ...first, card: { ...first.card, statements: [{ ...first.card.statements[0]!, sources: [] }] } }, ...rows.slice(1)]],
      ["decorative identity before owner assets exist", () => [{ ...first, card: { ...first.card, decorative: { name: "Pip" } } }, ...rows.slice(1)]],
      ["an unknown blocker", () => [{ ...first, startable: { kind: "not_startable", blockedBy: ["tuesday"] } }, ...rows.slice(1)]],
      ["a startable claim", () => [{ ...first, startable: { kind: "available", blockedBy: [] } }, ...rows.slice(1)]],
    ])("refuses %s", (_label, build) => {
      expect(() => parseCapabilities(withProfiles(build()))).toThrow(TypeError);
    });
  });
});
