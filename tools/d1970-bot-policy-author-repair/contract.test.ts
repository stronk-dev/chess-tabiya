import { describe, expect, it } from "vitest";

import {
  admitCandidatePopulation,
  admitProviderDelivery,
  assertBotPolicyDecisionRecord,
  commitAfterProvider,
  deriveBotSourceView,
  deriveCandidateFeatureVector,
  projectBotPolicyDecisionRecord,
  selectFromBase,
  type BotRootIdentity,
} from "./contract.js";

const sha = (value: string): `sha256:${string}` => `sha256:${value.padEnd(64, "0").slice(0, 64)}`;
const root = (overrides: Partial<BotRootIdentity> = {}): BotRootIdentity => ({
  runId: "run-1", branchId: "main", nodeId: "n-4", eventHeadDigest: sha("head"),
  beforeFenDigest: sha("fen"), historyDigest: sha("history"), ...overrides,
});
const sources = (maiaMoves = ["a2a3", "a2a4"], legalMoves = ["a2a3", "a2a4", "b2b3"]) => {
  const identity = root();
  const maia = admitProviderDelivery({
    operation: "maia.policy_page@1" as const, root: identity, requestDigest: sha("maia-request"), payloadDigest: sha("maia-payload"),
    payload: { coverage: "bounded_top_k" as const, returnedProbabilityMass: 0.99, candidates: maiaMoves.map((moveUci, index) => ({ moveUci, mass: index === 0 ? 0.7 : 0.29 })) },
  });
  const stockfish = admitProviderDelivery({
    operation: "stockfish.legal_root_table@1" as const, root: identity, requestDigest: sha("sf-request"), payloadDigest: sha("sf-payload"),
    payload: { coverage: "all_legal" as const, rows: legalMoves.map((moveUci, index) => ({ moveUci, score: 40 - index * 30 })) },
  });
  return { identity, maia, stockfish };
};
const record = () => {
  const source = deriveBotSourceView(sources());
  return projectBotPolicyDecisionRecord({
    source, profileId: "guarded-human@1", profileDigest: sha("profile"), seed: 7, chosenMoveUci: "a2a3",
    layers: [{ id: "guard.severe_error@1", action: "applied" }, { id: "sampler.maia_reconstruction@1", action: "applied" }],
    classifiers: new Map([["a2a3", ["pawn_move@1"]], ["a2a4", ["pawn_move@1"]]]),
  });
};

describe("D1970-D1971 shared source join", () => {
  it("consumes sealed shared deliveries and keeps probability mass separate from legal-set coverage", () => {
    const partial = deriveBotSourceView(sources());
    expect(partial.returnedProbabilityMass).toBe(0.99);
    expect(partial.maiaCoverage).toBe("bounded_subset");
    const complete = deriveBotSourceView(sources(["a2a3", "a2a4", "b2b3"]));
    expect(complete.maiaCoverage).toBe("legal_set_equal");
    expect(() => deriveBotSourceView({ ...sources(), maia: { ...sources().maia } })).toThrow(/unadmitted/u);
  });
});

describe("D1972/D1974 closed durable decision", () => {
  it("projects one sealed record set-equal to admitted candidates and separates deterministic bytes", () => {
    const value = record();
    expect(value.considered.map((row) => row.moveUci).sort()).toEqual(["a2a3", "a2a4"]);
    expect(value.profileVersion).toBe(1);
    expect(value).not.toHaveProperty("requestId");
    expect(value).not.toHaveProperty("timingMs");
    expect(() => assertBotPolicyDecisionRecord({ ...value })).toThrow(/unsealed/u);
    const source = deriveBotSourceView(sources());
    expect(() => projectBotPolicyDecisionRecord({
      source: { ...source }, profileId: "guarded-human@1", profileDigest: sha("profile"), seed: 7,
      chosenMoveUci: "a2a3", layers: [{ id: "guard.severe_error@1", action: "applied" }],
      classifiers: new Map(),
    })).toThrow(/unsealed bot source/u);
    expect(() => projectBotPolicyDecisionRecord({
      source, profileId: "guarded-human@1", profileDigest: sha("profile"), seed: 7, chosenMoveUci: "a2a3",
      layers: [{ id: "guard.severe_error@1", action: "applied" }], classifiers: new Map(),
      features: [{ moveUci: "a2a3", features: [] }],
    })).toThrow(/set-equal/u);
  });
});

describe("D1973 post-provider atomicity", () => {
  it("rechecks branch, node and event head and returns an idempotent committed envelope", () => {
    const selected = record();
    const request = { requestId: "botreq_123" as const, expectedNodeId: "n-4", expectedBranchId: "main", expectedEventHeadDigest: sha("head") };
    const timingMs = { total: 120, maia: 40, guard: 70, composition: 10 };
    const committed = commitAfterProvider({ request, currentRoot: root(), record: selected, writerLeaseDigest: sha("lease"), timingMs });
    expect(committed.kind).toBe("committed");
    if (committed.kind !== "committed") throw new Error("expected commit");
    expect(commitAfterProvider({ request, currentRoot: root(), record: selected, writerLeaseDigest: sha("lease"), timingMs, previous: committed.receipt }).kind).toBe("replayed_idempotent");
    expect(commitAfterProvider({ request, currentRoot: root({ branchId: "fork" }), record: selected, writerLeaseDigest: sha("lease"), timingMs }).kind).toBe("stale_root");
    expect(commitAfterProvider({ request, currentRoot: root({ eventHeadDigest: sha("later") }), record: selected, writerLeaseDigest: sha("lease"), timingMs }).kind).toBe("stale_root");
  });
});

describe("D1975 honest base failure", () => {
  it("commits no move when Maia supplies no distribution", () => {
    expect(selectFromBase({ kind: "unavailable" })).toEqual({ kind: "base_provider_unavailable", reason: "unavailable", retryable: true });
    expect(selectFromBase({ kind: "failed" })).toEqual({ kind: "base_provider_unavailable", reason: "failed", retryable: true });
    expect(selectFromBase({ kind: "delivered", source: deriveBotSourceView(sources()), record: record() }).kind).toBe("selected");
  });
});

describe("D1976 one packet, zero child provider calls", () => {
  it("derives Stage-B features only from an admitted population receipt and one legal-root delivery", () => {
    const { identity, stockfish } = sources();
    const packet = admitCandidatePopulation({
      scope: "events_and_readings", root: identity, legalMoves: ["a2a3", "a2a4", "b2b3"],
      rows: ["a2a3", "a2a4", "b2b3"].map((moveUci) => ({ moveUci, features: [{ id: "rules.exchange.predicate.legal_exchange@1" as const, value: false }] })),
    });
    expect(deriveCandidateFeatureVector({ packet, stockfish })).toBe(packet.rows);
    expect(() => deriveCandidateFeatureVector({ packet: { ...packet }, stockfish })).toThrow(/unadmitted/u);
  });
});
