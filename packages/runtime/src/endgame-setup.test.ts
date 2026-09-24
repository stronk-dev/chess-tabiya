// Grounded Lucena/Philidor/Vančura setup and method-stage conventions ([[D2495]]/[[D2496]]).
// Evidence: design/research/endgame-setup-conventions.md; tablebase receipts are recorded in
// fixtures/endgame-setup-tablebase.json and planning/endgame-setup-conventions/validation.json by
// tools/endgame-setup-convention-validation/validate.ts (`make endgame-setup-convention-validation`).
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { ENDGAME_METHOD_CONVENTIONS } from "./endgame-method.js";
import { ENDGAME_CONVENTION_SOURCES, ENDGAME_SETUP_CONVENTIONS, endgameSetupMatch, endgameSetupMatches, krpkrPlacement, renderEndgameSetupMatch, type EndgameTechnique } from "./endgame-setup.js";
import { ENDGAME_SETUP_FIXTURES } from "./endgame-setup.fixtures.js";
import { branchPath } from "./branch-path.js";
import type { DeclaredEvidence } from "./evidence-contract.js";
import { identitySealedEvidenceWithoutValueReceipt } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { commitMove, createRun } from "./runtime.js";

const invoke = invokeEvidenceValueRoute as (route: string, input: unknown) => unknown;
const TABLEBASE = JSON.parse(readFileSync(new URL("fixtures/endgame-setup-tablebase.json", import.meta.url), "utf8")) as Record<string, string>;
const VALIDATION = JSON.parse(readFileSync(new URL("../../../planning/endgame-setup-conventions/validation.json", import.meta.url), "utf8")) as {
  populations: Record<string, { rows: { fen: string; rookCaptureAvailable: boolean; attackerOutcome: string }[] }>;
};
const CANONICAL_RESULT: Readonly<Record<EndgameTechnique, string>> = { lucena: "win", philidor: "draw", vancura: "draw" };
const FLIP: Readonly<Record<string, string>> = { win: "loss", loss: "win", draw: "draw" };

/** The recorded Syzygy category re-oriented to the pawn side (exact, perspective-safe). */
function attackerOutcome(fen: string): string {
  const canonical = canonicalFen(positionFromFen(fen));
  const category = TABLEBASE[canonical];
  if (category === undefined) throw new Error(`no recorded tablebase category for ${canonical}`);
  const placement = krpkrPlacement(positionFromFen(canonical))!;
  return positionFromFen(canonical).turn === placement.attacker ? category : FLIP[category]!;
}

describe("registered setup conventions", () => {
  it("cite a registered source with a verbatim quote for every operand, and pin every operand", () => {
    const sources = new Set(ENDGAME_CONVENTION_SOURCES.map((source) => source.id));
    expect(ENDGAME_SETUP_CONVENTIONS.map((convention) => `${convention.id}@${convention.version}`)).toEqual(["lucena-setup@1", "philidor-third-rank-setup@1", "vancura-setup@1"]);
    for (const convention of [...ENDGAME_SETUP_CONVENTIONS, ...ENDGAME_METHOD_CONVENTIONS]) {
      for (const source of convention.sources) expect(sources.has(source), source).toBe(true);
    }
    for (const convention of ENDGAME_SETUP_CONVENTIONS) {
      expect(new Set(convention.operands.map((operand) => operand.id)).size).toBe(convention.operands.length);
      for (const operand of convention.operands) {
        expect(operand.quotes.length, `${convention.id}/${operand.id}`).toBeGreaterThan(0);
        for (const quote of operand.quotes) {
          expect(sources.has(quote.source), quote.source).toBe(true);
          expect(quote.quote.trim().length).toBeGreaterThan(10);
        }
      }
      expect(Object.isFrozen(convention)).toBe(true);
    }
  });
});

describe("theory.endgame.setup_match@1 fixtures", () => {
  it.each(ENDGAME_SETUP_FIXTURES.map((fixture) => [fixture.id, fixture] as const))("%s fires exactly its declared techniques", (_id, fixture) => {
    expect(endgameSetupMatches(fixture.fen).map((match) => match.technique)).toEqual(fixture.fires);
    if (fixture.fails !== undefined) {
      const technique = fixture.id.split("-")[0] as EndgameTechnique;
      const convention = ENDGAME_SETUP_CONVENTIONS.find((candidate) => candidate.technique === technique)!;
      const result = endgameSetupMatch(fixture.fen, convention);
      expect(result.kind).toBe("not_matched");
      expect(result.kind === "not_matched" && result.failedOperandIds).toContain(fixture.fails);
    }
  });

  it("names the browser inspector FEN as none of the three, with the failing operands", () => {
    const fen = "4k2r/8/8/8/8/8/RP6/4K3 w - - 0 1";
    expect(endgameSetupMatches(fen)).toEqual([]);
    const failed = Object.fromEntries(ENDGAME_SETUP_CONVENTIONS.map((convention) => {
      const result = endgameSetupMatch(fen, convention);
      return [convention.id, result.kind === "not_matched" ? result.failedOperandIds : result.kind];
    }));
    expect(failed).toEqual({
      "lucena-setup": ["pawn_on_seventh", "attacking_king_on_queening_square", "attacking_rook_cuts_off_defending_king"],
      "philidor-third-rank-setup": ["defending_king_on_or_adjacent_to_queening_square", "defending_rook_on_defender_third_rank"],
      "vancura-setup": ["rook_pawn", "attacking_rook_in_front_of_pawn", "defending_rook_attacks_pawn_from_side", "defending_king_beyond_its_rook", "defending_king_in_drawing_zone"],
    });
  });

  it("every positive fixture has the technique's canonical Syzygy result for the pawn side", () => {
    for (const fixture of ENDGAME_SETUP_FIXTURES.filter((candidate) => candidate.fires.length > 0)) {
      expect(attackerOutcome(fixture.fen), fixture.id).toBe(CANONICAL_RESULT[fixture.fires[0]!]);
    }
  });

  it("near-misses are able to fail: the one-operand changes include tablebase-different outcomes", () => {
    const nearMiss = ENDGAME_SETUP_FIXTURES.filter((fixture) => fixture.role === "near_miss");
    const departures = nearMiss.filter((fixture) => attackerOutcome(fixture.fen) !== CANONICAL_RESULT[fixture.id.split("-")[0] as EndgameTechnique]).map((fixture) => fixture.id);
    expect(departures).toEqual(["lucena-near-rook-pawn", "philidor-near-rook-second-rank", "philidor-near-king-far", "philidor-near-attacker-king-on-third", "vancura-near-rook-not-in-front", "vancura-near-king-out-of-zone", "vancura-near-knight-pawn"]);
  });

  it("reproduces the recorded uniform-sample tablebase agreement exactly (geometry is not outcome)", () => {
    const summary = Object.fromEntries(ENDGAME_SETUP_CONVENTIONS.map((convention) => {
      const rows = VALIDATION.populations[`${convention.id}@${convention.version}`]!.rows;
      for (const row of rows) expect(endgameSetupMatch(row.fen, convention).kind, row.fen).toBe("matched");
      for (const row of rows) expect(attackerOutcome(row.fen), row.fen).toBe(row.attackerOutcome);
      const canonical = CANONICAL_RESULT[convention.technique];
      const departs = rows.filter((row) => row.attackerOutcome !== canonical);
      return [convention.technique, { sampled: rows.length, departures: departs.length, departuresWithRookCapture: departs.filter((row) => row.rookCaptureAvailable).length }];
    }));
    // Lucena and Philidor depart only where the side to move can capture the opponent's rook;
    // Vančura departs 13 times without one (the attacking king's shelter is not a setup operand).
    expect(summary).toEqual({
      lucena: { sampled: 100, departures: 7, departuresWithRookCapture: 7 },
      philidor: { sampled: 100, departures: 23, departuresWithRookCapture: 23 },
      vancura: { sampled: 100, departures: 19, departuresWithRookCapture: 6 },
    });
  });

  it("renders the technique only together with its convention id and version", () => {
    const [match] = endgameSetupMatches("1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1");
    expect(renderEndgameSetupMatch(match!)).toBe("Matches the Lucena position setup under convention lucena-setup@1 (geometry only; not an outcome or advice).");
  });
});

describe("theory.endgame.setup_match@1 factory", () => {
  it("seals a positive, reports operand-level misses and refuses caller authority", () => {
    const lucena = invoke("theory.endgame.setup_match@1", { fen: "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1", convention: { id: "lucena-setup", version: 1 } }) as { kind: string; value: DeclaredEvidence<{ technique: string; convention: { id: string; version: number } }> };
    expect(lucena.kind).toBe("available");
    expect(lucena.value.payload).toMatchObject({ technique: "lucena", convention: { id: "lucena-setup", version: 1 } });
    expect(invoke("theory.endgame.setup_match@1", { fen: "4k2r/8/8/8/8/8/RP6/4K3 w - - 0 1", convention: { id: "lucena-setup", version: 1 } })).toEqual({ kind: "not_matched", convention: { id: "lucena-setup", version: 1 }, failedOperandIds: ["pawn_on_seventh", "attacking_king_on_queening_square", "attacking_rook_cuts_off_defending_king"] });
    expect(invoke("theory.endgame.setup_match@1", { fen: "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1", convention: { id: "lucena-setup", version: 2 } })).toMatchObject({ kind: "unavailable", reason: "setup_convention_unregistered:lucena-setup@2" });
    expect(() => invoke("theory.endgame.setup_match@1", { fen: "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1", convention: { id: "lucena-setup", version: 1 }, technique: "philidor" })).toThrow(/extra: technique/u);
  });
});

// ---------------------------------------------------------------------------------------------
// Method stages over exact recorded edges
// ---------------------------------------------------------------------------------------------

const at = "2026-09-24T00:00:00.000Z";
function recordedEdges(id: string, fen: string, moves: readonly string[]): readonly DeclaredEvidence<unknown>[] {
  let run = createRun({ id, packId: "fixture", packDigest: `sha256:${"e".repeat(64)}`, startFen: fen, seed: 1, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
  for (const move of moves) run = commitMove(run, move, { at }).run;
  const path = branchPath(run, run.activeCursor.branchId);
  return path.slice(1).map((child, index) => invoke("run.record.edge@1", { run, parent: path[index], child }) as DeclaredEvidence<unknown>);
}
function setupEvidence(fen: string, id: string): DeclaredEvidence<unknown> {
  const result = invoke("theory.endgame.setup_match@1", { fen, convention: { id, version: 1 } }) as { kind: string; value: DeclaredEvidence<unknown> };
  if (result.kind !== "available") throw new Error(`${fen} is not a ${id} match`);
  return result.value;
}
function stages(fen: string, moves: readonly string[], setup: string, method: string): unknown {
  const result = invoke("theory.endgame.method_stage@1", { setup: setupEvidence(fen, setup), edges: recordedEdges(method, fen, moves), convention: { id: method, version: 1 } }) as { kind: string; value?: readonly DeclaredEvidence<{ stage: string; beneficiary: string; triggeringUci: string }>[] };
  return result.kind === "available" ? result.value!.map((item) => `${item.payload.stage}:${item.payload.triggeringUci}:${item.payload.beneficiary}`) : result.kind;
}

describe("theory.endgame.method_stage@1 (D2496 controls)", () => {
  it("replays the three Lucena bridge stages for the pawn side", () => {
    expect(stages("1K6/1P1k4/8/8/8/8/r7/2R5 w - - 0 1", ["c1d1", "d7e7", "d1d4", "a2a1", "b8c7", "a1c1", "c7b6", "c1b1", "b6c6", "b1c1", "c6b5", "c1b1", "d4b4"], "lucena-setup", "lucena-bridge-method"))
      .toEqual(["lucena_bridge_prepared:d1d4:white", "lucena_king_excursion_started:b8c7:white", "lucena_bridge_interposed:d4b4:white"]);
  });

  it("replays the three Philidor stages for the defender", () => {
    expect(stages("4k3/R7/7r/4K3/4P3/8/8/8 b - - 0 1", ["h6b6", "e5d5", "b6g6", "e4e5", "g6b6", "e5e6", "b6b1", "d5d6", "b1d1"], "philidor-third-rank-setup", "philidor-third-rank-method"))
      .toEqual(["philidor_pawn_entered_defender_third:e5e6:black", "philidor_rear_rank_switch:b6b1:black", "philidor_rear_check_delivered:b1d1:black"]);
  });

  it("replays the Vančura pair and does not credit the losing ...Rf7", () => {
    const canonical = "R7/6k1/P4r2/8/2K5/8/8/8 w - - 0 1";
    expect(stages(canonical, ["a6a7", "f6a6"], "vancura-setup", "vancura-method")).toEqual(["vancura_pawn_entered_seventh:a6a7:black", "vancura_rook_moved_behind:f6a6:black"]);
    expect(stages(canonical, ["a6a7", "f6f7"], "vancura-setup", "vancura-method")).toEqual(["vancura_pawn_entered_seventh:a6a7:black"]);
    expect(stages(canonical, ["c4b5"], "vancura-setup", "vancura-method")).toBe("no_stage");
  });

  it("refuses a setup that is not the exact window start, a mismatched convention and a forged setup", () => {
    const edges = recordedEdges("philidor-shift", "4k3/R7/7r/4K3/4P3/8/8/8 b - - 0 1", ["h6b6", "e5d5"]);
    const elsewhere = setupEvidence("8/8/8/8/4pk2/R7/7r/4K3 w - - 0 1", "philidor-third-rank-setup");
    expect(() => invoke("theory.endgame.method_stage@1", { setup: elsewhere, edges, convention: { id: "philidor-third-rank-method", version: 1 } })).toThrow(/exact start/u);
    const lucena = setupEvidence("1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1", "lucena-setup");
    expect(() => invoke("theory.endgame.method_stage@1", { setup: lucena, edges, convention: { id: "philidor-third-rank-method", version: 1 } })).toThrow(/requires a philidor-third-rank-setup@1/u);
    expect(invoke("theory.endgame.method_stage@1", { setup: lucena, edges, convention: { id: "philidor-third-rank-method", version: 2 } })).toMatchObject({ kind: "unavailable", reason: "method_convention_unregistered:philidor-third-rank-method@2" });
    const forged = identitySealedEvidenceWithoutValueReceipt({ id: "theory.endgame", version: 1 }, { id: "theory.endgame.setup_match", version: 1 }, { fen: "4k3/R7/7r/4K3/4P3/8/8/8 b - - 0 1", technique: "philidor" });
    expect(() => invoke("theory.endgame.method_stage@1", { setup: forged, edges, convention: { id: "philidor-third-rank-method", version: 1 } })).toThrow(/value-authority receipt/u);
    expect(() => invoke("theory.endgame.method_stage@1", { setup: setupEvidence("4k3/R7/7r/4K3/4P3/8/8/8 b - - 0 1", "philidor-third-rank-setup"), edges: [edges[1], edges[0]], convention: { id: "philidor-third-rank-method", version: 1 } })).toThrow();
  });
});
