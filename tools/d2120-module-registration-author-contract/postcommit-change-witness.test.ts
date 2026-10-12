// DISPOSABLE D3715 author model. Not production selection or semantic qualification.
import { describe, expect, it } from "vitest";
import { isDeepStrictEqual } from "node:util";
import { parseUci } from "chessops/util";
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { MODULE_CONSUMER_ACCEPTS, STRUCTURAL_EVENT_PROJECTION_IDS } from "../../packages/runtime/src/evidence-catalog.js";
import type { DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { exactLegalMoves } from "../../packages/runtime/src/legal-moves.js";
import { hasKingZoneWitness } from "../../packages/runtime/src/postcommit-nudge.js";
import { localSemanticEventClosure, type StructuralSemanticEventOperands } from "../../packages/runtime/src/semantic-evidence.js";

const accepted = new Set(MODULE_CONSUMER_ACCEPTS.postcommit_nudge.map(ref => `${ref.id}@${ref.version}`));
const structural = new Set<string>(STRUCTURAL_EVENT_PROJECTION_IDS);
function proposedWitness(item: DeclaredEvidence<unknown>): boolean {
  if (item.projection.id === "rules.structural.event.pawn_islands" && item.projection.version === 1) {
    const value = item.payload as { before: number; after: number };
    return value.before !== value.after;
  }
  if (structural.has(item.projection.id) && item.projection.version === 1) {
    const value = item.payload as StructuralSemanticEventOperands;
    return !isDeepStrictEqual(value.before, value.after);
  }
  return hasKingZoneWitness(item);
}
function edge(fen: string, uci: string) {
  const move = exactLegalMoves(fen).find(candidate => candidate.uci === uci);
  expect(move, `real legal edge ${uci}`).toBeDefined();
  const position = positionFromFen(fen);
  position.play(parseUci(move!.uci)!);
  return { beforeFen: fen, moveUci: uci, afterFen: canonicalFen(position) };
}
const LOCKED = "7k/pppppppp/PPPPPPPP/8/8/8/3N4/K7 w - - 0 1";

describe("D3715 draft: complete source state versus a Nudge change witness", () => {
  it("preserves complete island sources but selects none of their unchanged counts", () => {
    for (const fen of [LOCKED,
      "7k/3n4/8/8/8/pppppppp/PPPPPPPP/K7 b - - 0 1",
      "7k/7n/8/8/3N4/8/8/K7 w - - 0 1",
      "7k/8/8/3n4/8/8/N7/K7 b - - 0 1"]) {
      const moves = exactLegalMoves(fen);
      expect(moves.length).toBeGreaterThan(0);
      for (const move of moves) {
        const states = invokeEvidenceValueRoute("rules.structural.event.pawn_islands@1", edge(fen, move.uci));
        expect(states.map(state => (state.payload as { color: string }).color)).toEqual(["white", "black"]);
        // Knight moves do not relocate/capture pawns in these four genuine populations.
        if (move.role === "knight") {
          expect(states.filter(hasKingZoneWitness)).toHaveLength(2); // Predecessor admits both unchanged states.
          expect(states.filter(proposedWitness)).toEqual([]);
        }
        expect(states).toHaveLength(2); // Selection must not alter the complete source.
      }
    }
  });

  it("removes unchanged structural states without calling d2–f3 wholly quiet", () => {
    const input = edge(LOCKED, "d2f3");
    const items = localSemanticEventClosure(input.beforeFen, input.moveUci, input.afterFen).events
      .map(event => event.evidence).filter(item => accepted.has(`${item.projection.id}@${item.projection.version}`));
    expect(items.length).toBeGreaterThan(0);
    const selected = items.filter(proposedWitness);
    expect(selected.filter(item => item.projection.id === "rules.structural.event.pawn_islands")).toEqual([]);
    expect(selected.filter(item => structural.has(item.projection.id))).toEqual([]);
    const king = selected.find(item => item.projection.id === "rules.king.event.zone_state");
    expect(king).toBeDefined();
    expect(king!.payload).toMatchObject({ color: "white", defenders: { lost: [{ square: "d2" }] } });
    // A true changed relation must not be hidden to manufacture an empty packet.
    // Preserved loose-piece relations remain a separate selection question.
  });

  it("retains actual island changes in both colours and gained/lost structural identities", () => {
    const input = edge("7k/p7/8/2p5/3PP3/8/8/K7 w - - 0 1", "d4c5");
    const islands = invokeEvidenceValueRoute("rules.structural.event.pawn_islands@1", input);
    expect(islands.map(item => (item.payload as { before: number; after: number }).before)).toEqual([1, 2]);
    expect(islands.map(item => (item.payload as { before: number; after: number }).after)).toEqual([2, 1]);
    expect(islands.filter(proposedWitness)).toHaveLength(2);
    const changed = localSemanticEventClosure(input.beforeFen, input.moveUci, input.afterFen).events
      .map(event => event.evidence).filter(item => accepted.has(`${item.projection.id}@${item.projection.version}`))
      .filter(item => structural.has(item.projection.id)).filter(proposedWitness);
    expect(changed.length).toBeGreaterThan(0);
    expect(changed.some(item => (item.payload as StructuralSemanticEventOperands).before === null ||
      (item.payload as StructuralSemanticEventOperands).after === null)).toBe(true);
  });

  it("does not equate equal structural magnitudes with equal observations", () => {
    const input = edge("7k/8/8/8/8/8/8/K7 w - - 0 1", "a1b1");
    const items = invokeEvidenceValueRoute("rules.structural.event.king_zone@1", input);
    const changed = items.filter(item => {
      const value = item.payload as StructuralSemanticEventOperands;
      return value.before !== null && value.after !== null &&
        (value.before.count ?? 1) === (value.after.count ?? 1) &&
        !isDeepStrictEqual(value.before, value.after);
    });
    expect(changed.length).toBeGreaterThan(0);
    expect(changed.every(proposedWitness)).toBe(true);
  });
});
