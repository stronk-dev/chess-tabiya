/** D3730: finite rule propositions, build/test only. Never a strategic or forced-line claim.
 * The independent capture/occupancy excerpts are supplied by the retained python-chess
 * manifest. threat@1 and legal-exchange@1 supply the explicitly declared product conventions.
 * A captured original bishop cannot reappear: a later bishop of the same role is not its identity.
 */
import { Board } from "chessops/board";
import { makeFen, parseFen } from "chessops/fen";
import type { Square } from "chessops/types";
import { opposite } from "chessops/util";
import type { SemanticBoundedTargetInput, SemanticCanonicalValue, SemanticValidationPropositionRecord } from "./semantic-validation.js";

const reflect = (fen: string) => {
  const setup = parseFen(fen).unwrap(), board = Board.empty();
  for (const [square, piece] of setup.board) board.set((square ^ 56) as Square, { ...piece, color: opposite(piece.color) });
  return makeFen({ ...setup, board, turn: opposite(setup.turn) });
};

export const BOUNDED_VALIDATION_FIXTURES = [
  { id: "loose-knight", fen: "8/4n3/n1p4r/7k/1B6/8/8/4K3 b - - 0 1", emits: true },
  // Rh7 can recapture Bxe7: the declared 3-for-3 exchange is zero, not a material target.
  { id: "equal-exchange", fen: "8/4n2r/n1p5/7k/1B6/8/8/4K3 b - - 0 1", emits: false },
  // The c5 pawn blocks the only bishop-to-knight diagonal.
  { id: "blocked-ray", fen: "8/4n3/n6r/2p4k/1B6/8/8/4K3 b - - 0 1", emits: false },
  // Nh7 cannot move off the rook's pin. Both king moves preserve Bxh7/Rxh7;
  // the bishop/rook protect each other's capture, so neither exchange is neutralized.
  { id: "all-candidates-preserve", fen: "7k/7n/8/5B2/8/8/8/K6R b - - 0 1", emits: true },
  // After ...c5, Bxc5+ restores the diagonal and every actual legal defence retains the target.
  { id: "checked-restoration", fen: "8/4n3/2p5/8/1B6/8/8/K5k1 b - - 0 1", emits: true },
  // Bxc5 is mate, so that zero-reply preparation is excluded. Other nonterminal preparations
  // admit and refute the target: existential reintroduction, not vacuous all-defences.
  { id: "terminal-restoration", fen: "8/4n3/2p5/8/1B5R/3B1K2/8/6k1 b - - 0 1", emits: true },
].flatMap(row => [{ ...row, id: `${row.id}.black`, reflected: false },
  { ...row, id: `${row.id}.white`, fen: reflect(row.fen), reflected: true }]);

export function boundedValidationSource(capture: { sourceRevision: string; licence: string; url: string; text: string }, mobility: { text: string }) {
  return {
    ...capture, sourceId: "python-chess.bounded-target", url: capture.url.split("#")[0]!,
    text: `${capture.text}\n${mobility.text}`,
    operation: { id: "runtime.semantic.bounded_target_batch", version: 1 } as const,
    cases: BOUNDED_VALIDATION_FIXTURES.flatMap(fixture => {
      const color = fixture.reflected ? "black" : "white", victimColor = opposite(color);
      const preserved = fixture.id.startsWith("all-candidates-preserve");
      const restored = fixture.id.includes("restoration");
      const attacker = preserved ? fixture.reflected ? "f4" : "f5" : fixture.reflected ? "b5" : "b4";
      const victim = preserved ? fixture.reflected ? "h2" : "h7" : fixture.reflected ? "e2" : "e7";
      const candidate = preserved ? fixture.reflected ? "h1g1" : "h8g8" : restored ? fixture.reflected ? "c3c4" : "c6c5" : fixture.reflected ? "a3b5" : "a6b4";
      const input: SemanticBoundedTargetInput = { kind: "bounded_target_source", sourceFen: fixture.fen };
      return ([
        ["named_material_target", "reading", {
          attacker: { square: attacker, color, role: "bishop" },
          victim: { square: victim, color: victimColor, role: "knight" }, captureUci: `${attacker}${victim}`,
        }],
        ["immediate", "event", { candidateUci: candidate, target: { payload: { captureUci: `${attacker}${victim}` } }, outcome: preserved
          ? { result: "preserved", cause: "preserved", postCandidateExchange: { convention: "legal-exchange-for-move@1", captureUci: `${attacker}${victim}`, resultUnits: 3, result: "positive" } }
          : { result: "removed", cause: restored ? "capture_illegal" : "attacker_captured", postCandidateExchange: null } }],
        ["bounded_return", "reading", { horizonPlies: 3, immediate: { payload: { candidateUci: candidate } },
          outcome: { kind: fixture.id.startsWith("checked-restoration") ? "survives_every_defence"
            : fixture.id.startsWith("terminal-restoration") ? "reintroduced" : "not_reintroduced" } }],
      ] satisfies readonly (readonly [string, "event" | "reading", Readonly<Record<string, SemanticCanonicalValue>>])[]).map(([projection, kind, operands]) => ({
        arm: fixture.emits && !(preserved && projection === "bounded_return") ? "positive" as const : "semantic_negative" as const,
        input,
        proposition: {
          subject: { kind, projection: { id: `derived.bounded_target.${projection}`, version: 1 } },
          case: { id: `cited.python-chess.bounded-target.${projection}.${fixture.id}`, version: 1 },
          factConstraint: [],
          expectation: fixture.emits && !(preserved && projection === "bounded_return") ? { kind: "emits", minimum: 1, operandMatch: operands } : { kind: "omits" },
        } satisfies Omit<SemanticValidationPropositionRecord, "factConstraintSha256">,
      }));
    }),
  };
}
