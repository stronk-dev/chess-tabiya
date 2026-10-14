import { describe, expect, it, vi } from "vitest";

import { fixtureProviderHealth } from "./provider-health.test-support.js";
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
  runSchemaVersion: "0.18",
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
  providerHealth: fixtureProviderHealth({ "maia-inference": "available", "stockfish-play": "available", "explorer-primary": "available", "tablebase-primary": "available" }, { "explorer-primary": "local_fixture", "tablebase-primary": "local_fixture" }),
  surfaces: { play: "available", review: "available", learn: "available", live: "available", create: "available", justPlay: "available", fromPosition: "available" },
  evidenceManifest: {
    digest: "c".repeat(64),
    counts: { producers: 1, projections: 1, consumers: 1, bindings: 1, semanticEvents: 0, eligibility: 0, reasons: 0, selectionPolicies: 0 },
    availability: [{ producerId: "human.maia", version: 1, state: "available", reason: "Maia is ready." }],
    bindings: [{ consumerId: "opponent.selection", consumerVersion: 1, projectionId: "human.maia.policy", projectionVersion: 1, forms: ["machine_condition"], providerOff: "unavailable" }],
  },
  packCapabilities: {
    protocol: "tabiya.pack-capabilities",
    protocolVersion: 1,
    rows: [
      { capability: { id: "live.stockfish.eval", version: { kind: "integer", value: 1 } }, semanticDisposition: { kind: "active" }, availability: "provider", reachability: { kind: "temporarily_unavailable", providerFamily: "analysis" } },
      { capability: { id: "structuralFeature.pawn_count", version: { kind: "integer", value: 1 } }, semanticDisposition: { kind: "deprecated", successor: { id: "structuralFeature.piece_count", version: { kind: "integer", value: 1 } }, reasonCode: "superseded" }, availability: "local", reachability: { kind: "supported" } },
      { capability: { id: "structuralFeature.piece_count", version: { kind: "integer", value: 1 } }, semanticDisposition: { kind: "active" }, availability: "local", reachability: { kind: "supported" } },
    ],
  },
});

describe("capability response authority", () => {
  it.each([
    ["missing verdicts", { verdicts: undefined }],
    ["unknown strength verdict", { verdicts: { strength: "excellent", distribution: "insufficient", bandIdentity: "insufficient" } }],
    ["unknown distribution", { verdicts: { strength: "calibrated_relative", distribution: "looks_human", bandIdentity: "supported" } }],
    ["unknown band identity", { verdicts: { strength: "calibrated_relative", distribution: "human_reference_equivalent", bandIdentity: "confident" } }],
    ["extra field", { bio: "A human-like player" }],
    ["non-finite strength", { relativeElo: NaN }],
    ["null measured strength", { relativeElo: null }],
    ["null measured interval", { ci95: null }],
    ["reversed interval", { ci95: [20, -20] }],
    ["non-finite interval", { ci95: [-20, Infinity] }],
    ["sparse interval", { ci95: new Array<number>(2) }],
    ["missing reference", { reference: undefined }],
    ["missing harness", { harness: undefined }],
    ["missing date", { measuredAt: undefined }],
    ["zero games", { games: 0 }],
    ["missing time control", { timeControl: undefined }],
    ["missing human-reference scope", { humanReferenceScope: undefined }],
    ["inconsistent human-like permission", { humanLikeLabelAllowed: true }],
    ["figure on failed strength", { verdicts: { strength: "invalid", distribution: "insufficient", bandIdentity: "insufficient" } }],
  ])("D3823 rejects %s in the full capabilities decoder", (_name, changes) => {
    const input = structuredClone(capabilities);
    Object.assign(input.policyProfiles.human_common.profiles[0]!.card, { strength: {
      kind: "calibrated", verdicts: { strength: "calibrated_relative", distribution: "insufficient", bandIdentity: "insufficient" },
      relativeElo: 0, ci95: [0, 0], reference: "raw Maia band 1400", harness: "synthetic calibration control",
      measuredAt: "2026-10-15", games: 800, timeControl: "fixture only", humanReferenceScope: "fixture only", humanLikeLabelAllowed: false,
      ...changes,
    } });
    expect(() => parseCapabilities(input)).toThrow(TypeError);
  });
  it("D3759 copies the raw response only outside the independently parsed pack projection", () => {
    const clone = vi.spyOn(globalThis, "structuredClone");
    try {
      expect(parseCapabilities(capabilities)).toEqual(capabilities);
      expect(clone).toHaveBeenCalledOnce();
      expect(clone.mock.calls[0]![0]).not.toHaveProperty("packCapabilities");
      expect(Object.keys(clone.mock.calls[0]![0] as object)).toEqual(Object.keys(capabilities).filter((key) => key !== "packCapabilities"));
    } finally { clone.mockRestore(); }
  });

  it("D3759 keeps complete output isolated from mutable input and rereads changing availability", () => {
    const input = structuredClone(capabilities);
    const expected = structuredClone(input);
    const parsed = parseCapabilities(input);
    Object.assign(input.packCapabilities.rows[0]!.reachability, { kind: "supported" });
    input.evidenceManifest.availability[0]!.reason = "changed after admission";
    Object.assign(input.policyProfiles.human_common, { profiles: [] });
    expect(parsed).toEqual(expected);
    expect(parsed.packCapabilities).not.toBe(input.packCapabilities);
    expect(parsed.packCapabilities.rows[0]!.capability).not.toBe(input.packCapabilities.rows[0]!.capability);
    expect(Object.isFrozen(parsed.packCapabilities.rows[0]!.capability.version)).toBe(true);
    expect(Object.isFrozen(parsed.evidenceManifest.availability[0])).toBe(true);
    const changed = structuredClone(capabilities);
    Object.assign(changed.packCapabilities.rows[0]!, { reachability: { kind: "supported" } });
    expect(parseCapabilities(changed).packCapabilities.rows[0]!.reachability).toEqual({ kind: "supported" });
    expect(parsed.packCapabilities.rows[0]!.reachability.kind).toBe("temporarily_unavailable");
    expect(() => parseCapabilities(input)).toThrow(TypeError);
  });

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
    [{ ...capabilities, providerHealth: { ...capabilities.providerHealth, providers: capabilities.providerHealth.providers.slice(1) } }],
    [{ ...capabilities, engines: [capabilities.engines[0], capabilities.engines[0]] }],
    [{ ...capabilities, policyProfiles: { ...capabilities.policyProfiles, human_common: { ...capabilities.policyProfiles.human_common, elo: { ...capabilities.policyProfiles.human_common.elo, min: 2000, max: 1000 } } } }],
    [{ ...capabilities, evidenceManifest: { ...capabilities.evidenceManifest, counts: { ...capabilities.evidenceManifest.counts, producers: 2 } } }],
    [{ ...capabilities, evidenceManifest: { ...capabilities.evidenceManifest, bindings: [capabilities.evidenceManifest.bindings[0], capabilities.evidenceManifest.bindings[0]], counts: { ...capabilities.evidenceManifest.counts, bindings: 2 } } }],
    [{ ...capabilities, surfaces: { ...capabilities.surfaces, campaign: "available" } }],
    // rfc/pack-capability-contract.md criterion 8 — the shared parser, not a web lookalike.
    [{ ...capabilities, packCapabilities: undefined }],
    [{ ...capabilities, packCapabilities: { ...capabilities.packCapabilities, rows: [{ ...capabilities.packCapabilities.rows[0], availability: "local" }, ...capabilities.packCapabilities.rows.slice(1)] } }],
    [{ ...capabilities, packCapabilities: { ...capabilities.packCapabilities, rows: [...capabilities.packCapabilities.rows].reverse() } }],
    [{ ...capabilities, packCapabilities: { ...capabilities.packCapabilities, rows: [capabilities.packCapabilities.rows[0], capabilities.packCapabilities.rows[0]] } }],
    [{ ...capabilities, packCapabilities: { ...capabilities.packCapabilities, rows: capabilities.packCapabilities.rows.slice(0, 2) } }],
    [{ ...capabilities, packCapabilities: { ...capabilities.packCapabilities, rows: [{ ...capabilities.packCapabilities.rows[0], providerId: "stockfish-analysis" }, ...capabilities.packCapabilities.rows.slice(1)] } }],
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
      { kind: "available" },
      { kind: "conditional", conditions: ["maia_unverified", "guard_release_receipt_absent"] },
      { kind: "unavailable", blockedBy: ["maia_unavailable"] },
    ] as const)("accepts the closed availability arm %j", (startable) => {
      expect(() => parseCapabilities(withProfiles(botRosterFixture(startable)))).not.toThrow();
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
      ["an unknown blocker", () => [{ ...first, startable: { kind: "unavailable", blockedBy: ["tuesday"] } }, ...rows.slice(1)]],
      ["an unavailable row with no blocker", () => [{ ...first, startable: { kind: "unavailable", blockedBy: [] } }, ...rows.slice(1)]],
      ["an available row carrying reasons", () => [{ ...first, startable: { kind: "available", blockedBy: [] } }, ...rows.slice(1)]],
      ["a conditional row with no condition", () => [{ ...first, startable: { kind: "conditional", conditions: [] } }, ...rows.slice(1)]],
      ["an unknown condition", () => [{ ...first, startable: { kind: "conditional", conditions: ["config_flag"] } }, ...rows.slice(1)]],
      ["the retired dependency blockers", () => [{ ...first, startable: { kind: "not_startable", blockedBy: ["run-schema-0.18"] } }, ...rows.slice(1)]],
    ])("refuses %s", (_label, build) => {
      expect(() => parseCapabilities(withProfiles(build()))).toThrow(TypeError);
    });
  });
});
