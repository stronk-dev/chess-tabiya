import {
  BOT_PROFILE_CATALOG,
  BotProfileError,
  type BotProfileCatalogEntry,
  type BotProfileId,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { reconstructMaiaDistribution } from "./bot-policy-catalog.js";
import {
  BotPolicyAuthorityError,
  botPreProviderOperandDigest,
  compileBotClassifierView,
  compileBotLegalMoveMap,
  compileBotPolicyEventEnvelope,
  compileBotPolicyExecution,
  isSealedBotPolicyDecision,
  parseBotPolicyDecisionRecord,
  parseBotPolicyEventEnvelope,
  projectBotPolicyDecisionRecord,
  sealBotPolicyReplayAuthority,
  sealBotRootAuthority,
  type BotMaiaPolicyPage,
  type BotOperationRootAuthority,
  type BotPolicyDecisionRecord,
  type BotPolicyExecution,
  type BotProviderResult,
  type BotStockfishRootTable,
  type BotStockfishScore,
} from "./bot-policy-compiler.js";
import { canonicalSha256 } from "./bot-profile-digest.js";
import { neutralTiebreakKey } from "./opponent-selector.js";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const HEAD = `sha256:${"a".repeat(64)}`;
const profile = (id: BotProfileId): BotProfileCatalogEntry => BOT_PROFILE_CATALOG.find((entry) => entry.reference.id === id)!;

function rootAuthority(overrides: Partial<Parameters<typeof sealBotRootAuthority>[0]> = {}): BotOperationRootAuthority {
  return sealBotRootAuthority({ runId: "run-1", branchId: "branch-1", nodeId: "node-1", preCommitEventHeadDigest: HEAD, startFen: START, historyUci: [], seed: 42, ...overrides });
}

function views(root: BotOperationRootAuthority) {
  const legal = compileBotLegalMoveMap(root);
  return { root, legal, classifiers: compileBotClassifierView(root, legal) };
}

function maia(entry: BotProfileCatalogEntry, rows: readonly (readonly [string, number])[], request: Partial<BotMaiaPolicyPage["request"]> = {}): BotProviderResult<BotMaiaPolicyPage> {
  return {
    kind: "success",
    payload: {
      operation: "maia.policy_page@1",
      request: {
        startFen: START,
        historyUci: [],
        band: entry.reference.band,
        model: entry.reference.model,
        temperature: entry.reference.sampler.temperature,
        topP: entry.reference.sampler.topP,
        requestedWidth: entry.reference.sampler.requestedWidth,
        ...request,
      },
      actual: { modelId: entry.reference.model.id, version: entry.reference.model.version },
      coverage: "bounded_top_k",
      rows: rows.map(([moveUci, rawMass]) => ({ moveUci, rawMass })),
    },
  };
}

const START_MOVES = ["a2a3", "a2a4", "b1a3", "b1c3", "b2b3", "b2b4", "c2c3", "c2c4", "d2d3", "d2d4", "e2e3", "e2e4", "f2f3", "f2f4", "g1f3", "g1h3", "g2g3", "g2g4", "h2h3", "h2h4"];

function stockfish(scores: Readonly<Record<string, BotStockfishScore | number>> = {}, options: { readonly fen?: string; readonly depth?: number; readonly drop?: string; readonly duplicate?: string } = {}): BotProviderResult<BotStockfishRootTable> {
  const rows = START_MOVES.filter((move) => move !== options.drop).map((moveUci) => {
    const given = scores[moveUci];
    const score: BotStockfishScore = given === undefined ? { kind: "centipawns", value: 0 } : typeof given === "number" ? { kind: "centipawns", value: given } : given;
    return { moveUci, depth: options.depth ?? 8, score };
  });
  if (options.duplicate !== undefined) rows.push({ moveUci: options.duplicate, depth: 8, score: { kind: "centipawns", value: 999 } });
  return { kind: "success", payload: { operation: "stockfish.legal_root_table@1", request: { fen: options.fen ?? START, engine: "stockfish-guard@1", searchBound: { kind: "depth", value: 8 }, perspective: "root_side" }, rows } };
}

function execute(input: Omit<Parameters<typeof compileBotPolicyExecution>[0], "root" | "legal" | "classifiers"> & { readonly root?: BotOperationRootAuthority }): BotPolicyExecution {
  const result = compileBotPolicyExecution({ ...views(input.root ?? rootAuthority()), ...input });
  if (result.kind !== "executed") throw new Error(`expected execution, got ${result.kind}`);
  return result.execution;
}

function decide(input: Parameters<typeof execute>[0]): BotPolicyDecisionRecord {
  return projectBotPolicyDecisionRecord(execute(input));
}

const mass = (decision: BotPolicyDecisionRecord) => Object.fromEntries(decision.considered.map((row) => [row.moveUci, row.finalMass]));
const BASE_ROWS = [["e2e4", 0.4], ["d2d4", 0.3], ["g1f3", 0.15], ["c2c4", 0.1], ["g2g4", 0.05]] as const;
// b1c3 is the best legal move but sits outside Maia's window; g2g4 loses 330 cp against it.
const GUARD_SCORES = { b1c3: 60, e2e4: 40, d2d4: 35, g1f3: 30, c2c4: 20, g2g4: -270 } as const;

describe("sampler reconstruction (bot-policy §2.2, A7 second fixture)", () => {
  it("drops the third row of 0.5/0.3/0.2 and equals the registered production sampler vector", () => {
    const entry = profile("human-baseline.1400@1");
    const decision = decide({ profile: entry.reference, maia: maia(entry, [["e2e4", 0.5], ["d2d4", 0.3], ["g1f3", 0.2]]) });
    const compare = (left: string, right: string) => neutralTiebreakKey(START, left).localeCompare(neutralTiebreakKey(START, right));
    const production = reconstructMaiaDistribution([{ moveUci: "d2d4", mass: 0.3 }, { moveUci: "e2e4", mass: 0.5 }, { moveUci: "g1f3", mass: 0.2 }], 0.8, 0.92, compare);
    expect(decision.considered.map((row) => [row.moveUci, row.rawMass, row.reconstructedMass, row.finalMass]))
      .toEqual(production.rows.map((row) => [row.moveUci, row.rawMass, row.sampledMass, row.finalMass]));
    expect(mass(decision).g1f3).toBe(0);
    expect(mass(decision).e2e4).toBeCloseTo(0.6544, 3);
    expect(decision.layers).toEqual([{ id: "sampler.maia_reconstruction@1", action: "applied" }]);
    expect(decision.maiaCoverage).toBe("bounded_subset");
    expect(decision.returnedProbabilityMass).toBeCloseTo(1, 12);
    expect(decision.considered.find((row) => row.moveUci === decision.chosenMoveUci)!.finalMass).toBeGreaterThan(0);
  });

  it("runs the same seeded sampler below the returned-mass floor and records the degradation (A10)", () => {
    const entry = profile("human-baseline.1000@1");
    const decision = decide({ profile: entry.reference, maia: maia(entry, [["e2e4", 0.5], ["d2d4", 0.4]]) });
    expect(decision.layers).toEqual([{ id: "sampler.maia_reconstruction@1", action: "degraded", reason: "returned_mass_below_profile_floor" }]);
    expect(decision.returnedProbabilityMass).toBeCloseTo(0.9, 12);
    expect(["e2e4", "d2d4"]).toContain(decision.chosenMoveUci);
  });
});

describe("determinism (bot-policy A6)", () => {
  const entry = profile("pawn-forward.1800@1");
  const input = () => ({ profile: entry.reference, maia: maia(entry, BASE_ROWS), stockfish: stockfish(GUARD_SCORES) });

  it("reproduces a byte-identical derivation from the same root, seed, profile and payloads", () => {
    const first = decide(input());
    const second = decide(input());
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
    expect(first.derivationDigest).toBe(canonicalSha256((({ derivationDigest: _d, ...rest }) => rest)(first)));
  });

  it("does not depend on provider emission order", () => {
    const permuted = maia(entry, [...BASE_ROWS].reverse());
    const reversed = decide({ ...input(), maia: permuted });
    const ordered = decide(input());
    expect(reversed.chosenMoveUci).toBe(ordered.chosenMoveUci);
    expect(reversed.considered).toEqual(ordered.considered);
  });

  it("changes with the seed, the payload or the root, and draws only moves with positive mass", () => {
    const base = decide(input());
    const seeds = new Set<string>();
    for (let seed = 1; seed <= 40; seed += 1) {
      const decision = decide({ ...input(), root: rootAuthority({ seed }) });
      seeds.add(decision.chosenMoveUci);
      expect(mass(decision)[decision.chosenMoveUci]).toBeGreaterThan(0);
      expect(mass(decision).g2g4).toBe(0);
    }
    expect(seeds.size).toBeGreaterThan(1);
    const payloadChanged = decide({ ...input(), maia: maia(entry, [["e2e4", 0.41], ["d2d4", 0.29], ["g1f3", 0.15], ["c2c4", 0.1], ["g2g4", 0.05]]) });
    expect(payloadChanged.derivationDigest).not.toBe(base.derivationDigest);
    const otherNode = decide({ ...input(), root: rootAuthority({ nodeId: "node-2" }) });
    expect(otherNode.derivationDigest).not.toBe(base.derivationDigest);
  });
});

describe("guard authority (bot-policy §2.4, A3)", () => {
  const entry = profile("guarded-human.1400@1");
  const run = (stockfishResult?: BotProviderResult<BotStockfishRootTable>) => decide({
    profile: entry.reference,
    maia: maia(entry, BASE_ROWS),
    ...(stockfishResult === undefined ? {} : { stockfish: stockfishResult }),
  });
  const baselineMass = () => {
    const baseline = profile("human-baseline.1400@1");
    return mass(decide({ profile: baseline.reference, maia: maia(baseline, BASE_ROWS) }));
  };

  it("references the best legal move outside Maia's window and masks losses of 250 cp or more", () => {
    const decision = run(stockfish(GUARD_SCORES));
    expect(decision.guardReference).toEqual({ moveUci: "b1c3", cp: 60 });
    expect(decision.layers.map((layer) => [layer.id, layer.action])).toEqual([["sampler.maia_reconstruction@1", "applied"], ["guard.severe_error@1", "applied"]]);
    const g2g4 = decision.considered.find((row) => row.moveUci === "g2g4")!;
    expect(g2g4.guard).toEqual({ kind: "applied", sourceScore: { kind: "centipawns", value: -270 }, lossCp: 330, admitted: false });
    expect(g2g4.finalMass).toBe(0);
    expect(decision.considered.find((row) => row.moveUci === "e2e4")!.guard).toEqual({ kind: "applied", sourceScore: { kind: "centipawns", value: 40 }, lossCp: 20, admitted: true });
  });

  it("keeps the delivered Maia distribution byte-identical to baseline whenever the guard abstains", () => {
    const cases: readonly [string, BotProviderResult<BotStockfishRootTable> | undefined][] = [
      ["guard_unavailable", undefined],
      ["guard_unavailable", { kind: "failure", reason: "unavailable" }],
      ["guard_deadline", { kind: "failure", reason: "deadline" }],
      ["guard_source_failure", { kind: "failure", reason: "invalid_response" }],
      ["guard_mixed_domain", stockfish({ ...GUARD_SCORES, h2h4: { kind: "mate", value: -3 } })],
      ["guard_mate_domain", stockfish(Object.fromEntries(START_MOVES.map((move) => [move, { kind: "mate", value: 5 }])))],
      ["guard_candidate_mismatch", stockfish(GUARD_SCORES, { duplicate: "e2e4" })],
      ["guard_candidate_mismatch", stockfish(GUARD_SCORES, { drop: "h2h3" })],
      ["guard_candidate_mismatch", stockfish(GUARD_SCORES, { fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1" })],
      ["guard_source_failure", stockfish(GUARD_SCORES, { depth: 7 })],
      ["empty_after_mask", stockfish({ b1c3: 900 })],
    ];
    const expected = baselineMass();
    for (const [reason, result] of cases) {
      const decision = run(result);
      expect(decision.layers[1], reason).toEqual({ id: "guard.severe_error@1", action: "abstained", reason });
      expect(mass(decision), reason).toEqual(expected);
      expect(decision.guardReference).toBeUndefined();
      expect(decision.considered.every((row) => row.guard.kind === "abstained" && !("lossCp" in row.guard))).toBe(true);
    }
  });

  it("never lets a duplicate Stockfish row choose which score becomes guard truth ([[D3029]])", () => {
    const decision = run(stockfish({ ...GUARD_SCORES, g2g4: -270 }, { duplicate: "g2g4" }));
    expect(decision.layers[1]).toEqual({ id: "guard.severe_error@1", action: "abstained", reason: "guard_candidate_mismatch" });
  });

  it("baseline never requests or records the guard", () => {
    const baseline = profile("human-baseline.1400@1");
    const decision = decide({ profile: baseline.reference, maia: maia(baseline, BASE_ROWS), stockfish: { kind: "failure", reason: "unavailable" } });
    expect(decision.sources.stockfish).toBeUndefined();
    expect(decision.considered.every((row) => row.guard.kind === "not_requested")).toBe(true);
  });
});

describe("guard-dependent pawn trait (bot-policy §2.5, A4; bot-roster criterion 7)", () => {
  const pawn = profile("pawn-forward.1400@1");
  const guarded = profile("guarded-human.1400@1");

  it("applies pawn x4 only after an applied guard", () => {
    const withTrait = decide({ profile: pawn.reference, maia: maia(pawn, BASE_ROWS), stockfish: stockfish(GUARD_SCORES) });
    const withoutTrait = decide({ profile: guarded.reference, maia: maia(guarded, BASE_ROWS), stockfish: stockfish(GUARD_SCORES) });
    expect(withTrait.layers.map((layer) => layer.action)).toEqual(["applied", "applied", "applied"]);
    expect(mass(withTrait).e2e4).toBeGreaterThan(mass(withoutTrait).e2e4!);
    expect(mass(withTrait).g1f3).toBeLessThan(mass(withoutTrait).g1f3!);
    const pawnRows = withTrait.considered.filter((row) => row.classifiers.includes("pawn_move@1")).map((row) => row.moveUci);
    expect(pawnRows).toEqual(["c2c4", "d2d4", "e2e4", "g2g4"]);
  });

  it("abstains with the guard and returns mass byte-equal to the base distribution", () => {
    const abstained = decide({ profile: pawn.reference, maia: maia(pawn, BASE_ROWS), stockfish: { kind: "failure", reason: "deadline" } });
    const baseline = profile("human-baseline.1400@1");
    expect(abstained.layers).toEqual([
      { id: "sampler.maia_reconstruction@1", action: "applied" },
      { id: "guard.severe_error@1", action: "abstained", reason: "guard_deadline" },
      { id: "trait.pawn_preference@1", action: "abstained", reason: "guard_dependency_abstained" },
    ]);
    expect(mass(abstained)).toEqual(mass(decide({ profile: baseline.reference, maia: maia(baseline, BASE_ROWS) })));
  });
});

describe("source admission and no-move results (bot-policy §4.3, A10)", () => {
  const entry = profile("guarded-human.2200@1");
  const compile = (maiaResult: BotProviderResult<BotMaiaPolicyPage>) => compileBotPolicyExecution({ ...views(rootAuthority()), profile: entry.reference, maia: maiaResult, stockfish: stockfish(GUARD_SCORES) });

  it("commits no decision when Maia is unavailable or fails; there is no base fallback", () => {
    expect(compile({ kind: "failure", reason: "unavailable" })).toEqual({ kind: "base_provider_unavailable", reason: "unavailable", retryable: true });
    expect(compile({ kind: "failure", reason: "deadline" })).toEqual({ kind: "base_provider_unavailable", reason: "deadline", retryable: true });
    expect(compile({ kind: "failure", reason: "invalid_response" })).toEqual({ kind: "provider_failed", reason: "invalid_response", retryable: true });
  });

  it.each([
    ["maia_empty_page", () => maia(entry, [])],
    ["maia_duplicate_move", () => maia(entry, [["e2e4", 0.5], ["e2e4", 0.4]])],
    ["maia_move_outside_legal_map", () => maia(entry, [["e2e5", 0.9], ["d2d4", 0.1]])],
    ["maia_invalid_mass", () => maia(entry, [["e2e4", 1.4]])],
    ["maia_root_mismatch", () => maia(entry, BASE_ROWS, { historyUci: ["e2e4"] })],
    ["maia_profile_mismatch", () => maia(entry, BASE_ROWS, { band: 1800 })],
    ["maia_profile_mismatch", () => maia(entry, BASE_ROWS, { temperature: 1 })],
    ["maia_profile_mismatch", () => maia(entry, BASE_ROWS, { requestedWidth: 8 })],
  ] as const)("refuses a page with %s", (reason, page) => {
    expect(compile(page())).toEqual({ kind: "provider_failed", reason, retryable: true });
  });
});

describe("sealed authorities (bot-policy §3, [[D3025]])", () => {
  const entry = profile("human-baseline.1800@1");

  it("refuses plain-object roots, crossed views and substituted profiles", () => {
    const root = rootAuthority();
    const { legal, classifiers } = views(root);
    const forged = JSON.parse(JSON.stringify(root)) as BotOperationRootAuthority;
    expect(() => compileBotPolicyExecution({ root: forged, legal, classifiers, profile: entry.reference, maia: maia(entry, BASE_ROWS) })).toThrow(BotPolicyAuthorityError);
    const other = views(rootAuthority({ nodeId: "node-9" }));
    expect(() => compileBotPolicyExecution({ root, legal: other.legal, classifiers, profile: entry.reference, maia: maia(entry, BASE_ROWS) })).toThrow(BotPolicyAuthorityError);
    expect(() => compileBotPolicyExecution({ root, legal, classifiers, profile: { ...entry.reference, orderedLayers: ["sampler.maia_reconstruction@1", "guard.severe_error@1"] }, maia: maia(entry, BASE_ROWS) })).toThrow(BotProfileError);
  });

  it("derives the root FEN from start and history and refuses illegal or terminal roots", () => {
    const after = rootAuthority({ historyUci: ["e2e4", "e7e5"] });
    expect(after.beforeFen).toBe("rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2");
    expect(() => rootAuthority({ historyUci: ["e2e5"] })).toThrow(BotPolicyAuthorityError);
    expect(() => rootAuthority({ historyUci: ["f2f3", "e7e5", "g2g4", "d8h4"] })).toThrow(/terminal/u);
    expect(() => rootAuthority({ preCommitEventHeadDigest: "head" })).toThrow(BotPolicyAuthorityError);
    expect(() => rootAuthority({ nodeId: "" })).toThrow(BotPolicyAuthorityError);
  });

  it("refuses to project a forged execution", () => {
    const execution = execute({ profile: entry.reference, maia: maia(entry, BASE_ROWS) });
    expect(() => projectBotPolicyDecisionRecord({ ...execution })).toThrow(BotPolicyAuthorityError);
    expect(isSealedBotPolicyDecision(projectBotPolicyDecisionRecord(execution))).toBe(true);
    expect(isSealedBotPolicyDecision(JSON.parse(JSON.stringify(projectBotPolicyDecisionRecord(execution))))).toBe(false);
  });
});

describe("durable replay by reconstruction ([[D3026]], [[D3027]]; A6, A8)", () => {
  const entry = profile("pawn-forward.1400@1");
  const authority = (overrides: { readonly maia?: BotProviderResult<BotMaiaPolicyPage>; readonly seed?: number } = {}) => {
    const root = rootAuthority(overrides.seed === undefined ? {} : { seed: overrides.seed });
    return sealBotPolicyReplayAuthority({ ...views(root), profile: entry.reference, maia: overrides.maia ?? maia(entry, BASE_ROWS), stockfish: stockfish(GUARD_SCORES) });
  };
  const stored = () => JSON.parse(JSON.stringify(decide({ profile: entry.reference, maia: maia(entry, BASE_ROWS), stockfish: stockfish(GUARD_SCORES) }))) as Record<string, unknown>;

  it("accepts stored bytes only when they equal the independent reconstruction", () => {
    const parsed = parseBotPolicyDecisionRecord(stored(), authority());
    expect(isSealedBotPolicyDecision(parsed)).toBe(true);
    expect(JSON.parse(JSON.stringify(parsed))).toEqual(stored());
  });

  it("refuses a coordinated move/mass/digest rewrite whose private hashes agree", () => {
    const bytes = stored() as unknown as BotPolicyDecisionRecord;
    const rewritten = {
      ...bytes,
      chosenMoveUci: "g2g4",
      considered: bytes.considered.map((row) => row.moveUci === "g2g4" ? { ...row, finalMass: 1 } : { ...row, finalMass: 0 }),
    };
    const { derivationDigest: _old, ...derivation } = rewritten;
    const forged = { ...derivation, derivationDigest: canonicalSha256(derivation) };
    expect(() => parseBotPolicyDecisionRecord(forged, authority())).toThrow(/independent reconstruction/u);
  });

  it("refuses extra keys, non-canonical digests, a different seed and a different provider payload", () => {
    expect(() => parseBotPolicyDecisionRecord({ ...stored(), note: "x" }, authority())).toThrow(BotPolicyAuthorityError);
    expect(() => parseBotPolicyDecisionRecord({ ...stored(), derivationDigest: "sha256:abc" }, authority())).toThrow(BotPolicyAuthorityError);
    expect(() => parseBotPolicyDecisionRecord(stored(), authority({ seed: 43 }))).toThrow(BotPolicyAuthorityError);
    expect(() => parseBotPolicyDecisionRecord(stored(), authority({ maia: maia(entry, [["e2e4", 0.41], ["d2d4", 0.29], ["g1f3", 0.15], ["c2c4", 0.1], ["g2g4", 0.05]]) }))).toThrow(BotPolicyAuthorityError);
    expect(() => parseBotPolicyDecisionRecord(stored(), { ...authority() })).toThrow(/unsealed replay authority/u);
  });
});

describe("non-circular operation envelope (bot-policy §4.1, §6; A6)", () => {
  const entry = profile("guarded-human.1000@1");
  const decision = () => decide({ profile: entry.reference, maia: maia(entry, BASE_ROWS), stockfish: stockfish(GUARD_SCORES) });
  const lease = `sha256:${"c".repeat(64)}` as const;
  const envelope = (overrides: Partial<Parameters<typeof compileBotPolicyEventEnvelope>[0]> = {}) => compileBotPolicyEventEnvelope({
    decision: decision(), requestId: "botreq_0123456789abcdef", writerLeaseDigest: lease, committedEventSequence: 17, timingMs: { total: 210, maia: 150, guard: 50, composition: 10 }, ...overrides,
  });
  const replay = () => sealBotPolicyReplayAuthority({ ...views(rootAuthority()), profile: entry.reference, maia: maia(entry, BASE_ROWS), stockfish: stockfish(GUARD_SCORES) });

  it("keeps request, lease and timing out of the decision and timing out of operation identity", () => {
    const first = envelope();
    const slower = envelope({ timingMs: { total: 480, maia: 300, guard: 150, composition: 30 } });
    expect(slower.decision.derivationDigest).toBe(first.decision.derivationDigest);
    expect(slower.operation.operationDigest).toBe(first.operation.operationDigest);
    expect(Object.keys(first.decision)).not.toEqual(expect.arrayContaining(["requestId", "writerLeaseDigest", "timingMs"]));
    expect(first.operation).not.toHaveProperty("resultingEventHeadDigest");
  });

  it("distinguishes writer, request, root, profile and seed before any provider call", () => {
    const root = decision().root;
    const base = { requestId: "botreq_0123456789abcdef", root, writerLeaseDigest: lease, profileDigest: entry.reference.digest, seed: 42 };
    const digest = botPreProviderOperandDigest(base);
    expect(envelope().operation.preProviderOperandDigest).toBe(digest);
    for (const change of [{ writerLeaseDigest: `sha256:${"d".repeat(64)}` }, { requestId: "botreq_fedcba9876543210" }, { seed: 43 }, { profileDigest: BOT_PROFILE_CATALOG[0]!.reference.digest }, { root: { ...root, nodeId: "node-2" } }]) {
      expect(botPreProviderOperandDigest({ ...base, ...change })).not.toBe(digest);
    }
  });

  it("round-trips stored bytes and refuses a rewritten operation or decision", () => {
    const bytes = JSON.parse(JSON.stringify(envelope())) as { decision: Record<string, unknown>; operation: Record<string, unknown> };
    const parsed = parseBotPolicyEventEnvelope(bytes, replay());
    expect(JSON.parse(JSON.stringify(parsed))).toEqual(bytes);
    expect(() => parseBotPolicyEventEnvelope({ ...bytes, operation: { ...bytes.operation, committedEventSequence: 18 } }, replay())).toThrow(/re-derived/u);
    expect(() => parseBotPolicyEventEnvelope({ ...bytes, operation: { ...bytes.operation, chosenMoveUci: "g2g4" } }, replay())).toThrow(BotPolicyAuthorityError);
    expect(() => parseBotPolicyEventEnvelope({ ...bytes, operation: { ...bytes.operation, extra: 1 } }, replay())).toThrow(/invalid shape/u);
    expect(() => parseBotPolicyEventEnvelope({ ...bytes, previous: bytes }, replay())).toThrow(/invalid shape/u);
  });

  it("refuses an envelope around an unsealed decision", () => {
    expect(() => envelope({ decision: JSON.parse(JSON.stringify(decision())) as BotPolicyDecisionRecord })).toThrow(BotPolicyAuthorityError);
  });
});
