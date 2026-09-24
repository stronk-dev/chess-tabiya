import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  BOT_OPPONENT_PLY_RESULTS,
  BOT_OPPONENT_PLY_RESULT_KINDS,
  parseBotOpponentPlyRequest,
  parseBotOpponentPlyResultRow,
} from "./bot-opponent-ply.js";
import {
  BOT_FAMILY_LAYERS,
  BOT_LAYER_DECLARATIONS,
  BOT_MODEL_BANDS,
  BOT_PROFILE_CATALOG,
  BOT_PROFILE_FAMILIES,
  BotCompositionError,
  BotProfileError,
  assertBotLayerComposition,
  botProfileId,
  classifyPawnMoves,
  resolveBotProfileReference,
  type BotProfileId,
  type CandidateBotLayer,
} from "./bot-profile-catalog.js";
import { exactLegalMoves } from "./legal-moves.js";

/** bot-roster criterion 1: derive the expected set from the product, never from a count. */
function rosterCensus(ids: readonly string[]): { readonly ok: boolean; readonly missing: readonly string[]; readonly extra: readonly string[]; readonly duplicates: number } {
  const expected = new Set<string>(BOT_PROFILE_FAMILIES.flatMap((family) => BOT_MODEL_BANDS.map((band) => botProfileId(family, band))));
  const actual = new Set(ids);
  const missing = [...expected].filter((id) => !actual.has(id));
  const extra = [...actual].filter((id) => !expected.has(id));
  const duplicates = ids.length - actual.size;
  return { ok: missing.length === 0 && extra.length === 0 && duplicates === 0, missing, extra, duplicates };
}

describe("bot-profile-catalog@1 census (bot-roster criterion 1, bot-policy A1)", () => {
  it("is set-equal to FAMILIES x BANDS by (id, version)", () => {
    const census = rosterCensus(BOT_PROFILE_CATALOG.map((entry) => entry.reference.id));
    expect(census).toEqual({ ok: true, missing: [], extra: [], duplicates: 0 });
    expect(BOT_PROFILE_CATALOG.every((entry) => entry.reference.version === 1)).toBe(true);
    expect(BOT_PROFILE_CATALOG).toHaveLength(12); // drift tripwire only
  });

  it("fails the census for twelve ids with a duplicated band and a missing one", () => {
    const wrong = BOT_PROFILE_CATALOG.map((entry) => entry.reference.id).map((id) => id.replace(".2200@1", ".1800@1"));
    expect(wrong).toHaveLength(12);
    const census = rosterCensus(wrong);
    expect(census.ok).toBe(false);
    expect(census.missing).toEqual(["human-baseline.2200@1", "guarded-human.2200@1", "pawn-forward.2200@1"]);
    expect(census.duplicates).toBe(3);
  });

  it("pins the band set: 2400 and interpolated bands are not registered (criterion 9)", () => {
    const entry = BOT_PROFILE_CATALOG[0]!;
    for (const band of [2400, 1500, 1600]) {
      expect(() => resolveBotProfileReference({ ...entry.reference, id: `${entry.reference.family}.${band}@1`, band })).toThrow(BotProfileError);
    }
    expect([...BOT_MODEL_BANDS]).toEqual([1000, 1400, 1800, 2200]);
  });

  it("keeps band and family independent projections (criterion 2)", () => {
    for (const band of BOT_MODEL_BANDS) {
      const models = BOT_PROFILE_CATALOG.filter((entry) => entry.reference.band === band).map((entry) => JSON.stringify([entry.behavior.band, entry.behavior.model]));
      expect(new Set(models).size).toBe(1);
    }
    for (const family of BOT_PROFILE_FAMILIES) {
      const layers = BOT_PROFILE_CATALOG.filter((entry) => entry.reference.family === family).map((entry) => JSON.stringify(entry.behavior.layers));
      expect(new Set(layers).size).toBe(1);
    }
    const familyLayers = BOT_PROFILE_FAMILIES.map((family) => JSON.stringify(BOT_FAMILY_LAYERS[family]));
    expect(new Set(familyLayers).size).toBe(3);
    const digests = BOT_PROFILE_CATALOG.flatMap((entry) => [entry.reference.digest, entry.behaviorDigest]);
    expect(new Set(digests).size).toBe(24);
  });

  it("carries no pawn-forward profile without the guard (criterion 7)", () => {
    expect(BOT_FAMILY_LAYERS["pawn-forward"]).toEqual(["sampler.maia_reconstruction@1", "guard.severe_error@1", "trait.pawn_preference@1"]);
    expect(BOT_LAYER_DECLARATIONS["trait.pawn_preference@1"].dependsOn).toBe("guard.severe_error@1");
  });

  it("declares the depth-8 guard, not depth 12 or a node bound (criterion 8)", () => {
    expect(BOT_LAYER_DECLARATIONS["guard.severe_error@1"].parameters).toEqual({
      engine: "stockfish-guard@1",
      searchBound: { kind: "depth", value: 8 },
      thresholdCp: 250,
      deadlineMs: 500,
      reference: "best_all_legal_centipawn_row",
    });
  });
});

describe("complete-profile identity (bot-policy A1, [[D3025]])", () => {
  const entry = BOT_PROFILE_CATALOG.find((item) => item.reference.id === "guarded-human.1400@1")!;

  it("returns the catalog member for the exact reference, including a JSON round trip", () => {
    expect(resolveBotProfileReference(entry.reference)).toBe(entry);
    expect(resolveBotProfileReference(JSON.parse(JSON.stringify(entry.reference)))).toBe(entry);
  });

  it("refuses a genuine id/digest carrying substituted semantics", () => {
    const substitutions: readonly Record<string, unknown>[] = [
      { family: "pawn-forward" },
      { band: 1800 },
      { orderedLayers: ["sampler.maia_reconstruction@1"] },
      { orderedLayers: [...entry.reference.orderedLayers, "trait.pawn_preference@1"] },
      { sampler: { ...entry.reference.sampler, temperature: 1 } },
      { sampler: { ...entry.reference.sampler, topP: 1 } },
      { model: { ...entry.reference.model, version: "0000" } },
      { digest: BOT_PROFILE_CATALOG[0]!.reference.digest },
      { version: 2 },
    ];
    for (const change of substitutions) {
      expect(() => resolveBotProfileReference({ ...entry.reference, ...change })).toThrow(BotProfileError);
    }
  });

  it("refuses unknown ids, extra or missing keys and non-canonical digests", () => {
    expect(() => resolveBotProfileReference({ ...entry.reference, id: "guarded-human.1400@2" })).toThrow(BotProfileError);
    expect(() => resolveBotProfileReference({ ...entry.reference, targetElo: 1400 })).toThrow(BotProfileError);
    const { sampler: _sampler, ...missing } = entry.reference;
    expect(() => resolveBotProfileReference(missing)).toThrow(BotProfileError);
    expect(() => resolveBotProfileReference({ ...entry.reference, digest: entry.reference.digest.toUpperCase() })).toThrow(BotProfileError);
    expect(() => resolveBotProfileReference(null)).toThrow(BotProfileError);
  });
});

describe("pawn_move@1 legal-board classifier (bot-policy A4)", () => {
  const pawnMoves = (fen: string): readonly string[] => classifyPawnMoves(fen).filter((row) => row.classifiers.includes("pawn_move@1")).map((row) => row.moveUci);

  it("is set-equal to the exact legal move map", () => {
    const fen = "r3k2r/pppq1ppp/2npbn2/4p3/2B1P3/2NP1N2/PPPQ1PPP/R3K2R w KQkq - 0 1";
    expect(classifyPawnMoves(fen).map((row) => row.moveUci)).toEqual(exactLegalMoves(fen).map((move) => move.uci));
  });

  it("classifies every file for both colours, pushes and double pushes by board role", () => {
    const white = pawnMoves("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    const black = pawnMoves("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");
    for (const file of "abcdefgh") {
      expect(white).toEqual(expect.arrayContaining([`${file}2${file}3`, `${file}2${file}4`]));
      expect(black).toEqual(expect.arrayContaining([`${file}7${file}6`, `${file}7${file}5`]));
    }
    expect(white).not.toContain("g1f3");
    expect(black).not.toContain("b8c6");
  });

  it("counts captures, en passant and all four promotion identities; castling and pieces are negatives", () => {
    expect(pawnMoves("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2")).toEqual(expect.arrayContaining(["e5d6", "e5e6"]));
    expect(pawnMoves("4k3/8/8/8/8/8/3p4/2N4K b - - 0 1")).toEqual(expect.arrayContaining(["d2c1q", "d2c1r", "d2c1b", "d2c1n", "d2d1q"]));
    expect(pawnMoves("1r2k3/P7/8/8/8/8/8/4K3 w - - 0 1")).toEqual(expect.arrayContaining(["a7b8q", "a7b8r", "a7b8b", "a7b8n", "a7a8q"]));
    const castlingFen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
    const classified = classifyPawnMoves(castlingFen);
    const castles = classified.filter((row) => row.role === "king" && Math.abs(row.moveUci.charCodeAt(2) - row.moveUci.charCodeAt(0)) > 1);
    expect(castles.length).toBeGreaterThan(0);
    expect(classified.every((row) => row.classifiers.length === 0)).toBe(true);
  });
});

const artifact = JSON.parse(readFileSync(new URL("../../../planning/platform-alignment/bot-policy/d969-depth8-abstain-results.json", import.meta.url), "utf8")) as {
  readonly gates: { readonly traits: Record<string, { readonly traitDelta: number; readonly lossDeltaCp: number; readonly severeRise: number; readonly humanRetention: number }> };
};
const ARTIFACT = "planning/platform-alignment/bot-policy/d969-depth8-abstain-results.json";

function registeredLayers(family: keyof typeof BOT_FAMILY_LAYERS): CandidateBotLayer[] {
  return BOT_FAMILY_LAYERS[family].map((id) => {
    const layer = BOT_LAYER_DECLARATIONS[id];
    const trait = artifact.gates.traits.pawn_x4_guarded!;
    return {
      id: layer.id,
      kind: layer.kind,
      effect: layer.effect,
      inputs: layer.inputs,
      parameters: layer.parameters,
      parameterCitation: ARTIFACT,
      ...(layer.kind === "controlled_trait" ? {
        dependsOn: layer.dependsOn,
        measurement: { artifact: ARTIFACT, traitDeltaFraction: trait.traitDelta, expectedLossShiftCp: trait.lossDeltaCp, severeMassRise: trait.severeRise, explorerMatchRetention: trait.humanRetention },
      } : {}),
    };
  });
}

describe("composition refusals (bot-policy A5)", () => {
  it("admits every registered family composition", () => {
    for (const family of BOT_PROFILE_FAMILIES) expect(() => assertBotLayerComposition(registeredLayers(family))).not.toThrow();
  });

  const pawn = (): CandidateBotLayer[] => registeredLayers("pawn-forward");

  it.each([
    ["duplicate guard authority", () => [...pawn(), { ...pawn()[1]!, id: "guard.other@1" }]],
    ["delay effect", () => [...pawn(), { id: "timing.think@1", kind: "timing", effect: "delay", inputs: [] }]],
    ["memory instance", () => [...pawn(), { id: "memory.cross_game@1", kind: "memory", effect: "memory", inputs: [] }]],
    ["repertoire instance", () => [...pawn(), { id: "repertoire.book@1", kind: "repertoire", effect: "prior", inputs: [] }]],
    ["learner-derived input", () => [...pawn(), { id: "trait.style@1", kind: "controlled_trait", effect: "weight", inputs: ["learner.style_vector@1"] }]],
    ["learner-derived parameter provenance", () => [pawn()[0]!, { ...pawn()[1]!, parameterCitation: "computed from learner history" }, pawn()[2]!]],
    ["uncited parameters", () => [{ ...pawn()[0]!, parameterCitation: "" }]],
    ["unregistered classifier", () => [pawn()[0]!, pawn()[1]!, { ...pawn()[2]!, parameters: { classifier: "forcing_move@1", multiplier: 3 } }]],
    ["unmeasured trait", () => [pawn()[0]!, pawn()[1]!, (({ measurement: _m, ...rest }) => rest)(pawn()[2]!)]],
    ["unguarded trait", () => [pawn()[0]!, pawn()[2]!]],
    ["guard without the all-legal root table", () => [pawn()[0]!, { ...pawn()[1]!, inputs: ["provider.maia.policy_page@1"] }]],
    ["legal-set-equality transform over the bounded Maia page", () => [pawn()[0]!, { id: "trait.complete@1", kind: "controlled_trait", effect: "weight", inputs: ["provider.maia.policy_page@1"], requiresLegalSetEquality: true }]],
    ["zero temperature", () => [{ ...pawn()[0]!, parameters: { temperature: 0, topP: 0.92 } }]],
    ["top-p above one", () => [{ ...pawn()[0]!, parameters: { temperature: 0.8, topP: 1.2 } }]],
  ] as const)("refuses %s", (_label, build) => {
    expect(() => assertBotLayerComposition(build() as readonly CandidateBotLayer[])).toThrow(BotCompositionError);
  });

  it("keeps forcing x3 and quiet x3 as measured negative registrations", () => {
    for (const arm of ["forcing_x3_guarded", "quiet_x3_guarded"] as const) {
      const measured = artifact.gates.traits[arm]!;
      const layers = pawn();
      layers[2] = { ...layers[2]!, measurement: { artifact: ARTIFACT, traitDeltaFraction: measured.traitDelta, expectedLossShiftCp: measured.lossDeltaCp, severeMassRise: measured.severeRise, explorerMatchRetention: measured.humanRetention } };
      expect(() => assertBotLayerComposition(layers)).toThrow(/controlled-trait gate/u);
    }
  });
});

describe("opponent-ply request and result grammar (bot-policy §4.1, [[D3028]])", () => {
  const valid = {
    requestId: "botreq_0123456789abcdef",
    expectedNodeId: "node-12",
    expectedBranchId: "branch-main",
    expectedEventHeadDigest: `sha256:${"a".repeat(64)}`,
  };

  it("accepts exactly the four-field grammar", () => {
    expect(parseBotOpponentPlyRequest(valid)).toEqual(valid);
  });

  it.each([
    ["an extra FEN", { ...valid, fen: "8/8/8/8/8/8/8/8 w - - 0 1" }],
    ["a browser profile", { ...valid, profile: BOT_PROFILE_CATALOG[0]!.reference }],
    ["a seed", { ...valid, seed: 7 }],
    ["candidate bytes", { ...valid, candidates: [] }],
    ["an empty node id", { ...valid, expectedNodeId: "" }],
    ["an empty branch id", { ...valid, expectedBranchId: "" }],
    ["a non-digest head", { ...valid, expectedEventHeadDigest: "head-7" }],
    ["an uppercase digest", { ...valid, expectedEventHeadDigest: `sha256:${"A".repeat(64)}` }],
    ["a short request id", { ...valid, requestId: "botreq_short" }],
    ["a foreign request id", { ...valid, requestId: "req_0123456789abcdef" }],
  ] as const)("refuses %s", (_label, body) => {
    expect(() => parseBotOpponentPlyRequest(body)).toThrow(TypeError);
  });

  it("maps all eight outcomes to the closed table and refuses tampered rows", () => {
    expect(BOT_OPPONENT_PLY_RESULT_KINDS).toHaveLength(8);
    for (const kind of BOT_OPPONENT_PLY_RESULT_KINDS) {
      const row = BOT_OPPONENT_PLY_RESULTS[kind];
      expect(parseBotOpponentPlyResultRow(JSON.parse(JSON.stringify(row)))).toBe(row);
      expect(() => parseBotOpponentPlyResultRow({ ...row, retryable: !row.retryable })).toThrow(TypeError);
      expect(() => parseBotOpponentPlyResultRow({ ...row, status: 500 })).toThrow(TypeError);
    }
    expect(BOT_OPPONENT_PLY_RESULTS.stale_root).toEqual({ kind: "stale_root", status: 409, code: "OPPONENT_STALE_ROOT", retryable: false, action: "refresh_position" });
    expect(() => parseBotOpponentPlyResultRow({ ...BOT_OPPONENT_PLY_RESULTS.committed, message: "raw provider reason" })).toThrow(TypeError);
  });
});

const _typecheck: BotProfileId = "pawn-forward.2200@1";
void _typecheck;
