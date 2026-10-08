/** Build/test-only references, never imported by a collector or the runtime barrel. */
import type { SemanticEdgeInput, SemanticValidationCase, SemanticValidationPropositionRecord } from "./semantic-validation.js";

// Retained verbatim from python-chess 1.11.2, chess/__init__.py lines 3341–3346.
// Copyright Niklas Fiekas; GPL-3.0-or-later. Licence and full corresponding source:
// https://github.com/niklasf/python-chess/tree/3516d7c6c0879af724c2855fac5a304a4ef40949
// https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/LICENSE.txt
// The two legal fixtures below instantiate its king/rook-destination test and its
// ordinary one-file king-step negative. They do not assert strategic value.
const text = `    def is_castling(self, move: Move) -> bool:
        """Checks if the given pseudo-legal move is a castling move."""
        if self.kings & BB_SQUARES[move.from_square]:
            diff = square_file(move.from_square) - square_file(move.to_square)
            return abs(diff) > 1 or bool(self.rooks & self.occupied_co[self.turn] & BB_SQUARES[move.to_square])
        return False
`;

interface CitedCase {
  readonly arm: SemanticValidationCase["arm"];
  readonly input: SemanticEdgeInput;
  readonly proposition: Omit<SemanticValidationPropositionRecord, "factConstraintSha256">;
}

export const SEMANTIC_VALIDATION_CITED_SOURCES = Object.freeze([{
  sourceId: "python-chess.castling",
  sourceRevision: "3516d7c6c0879af724c2855fac5a304a4ef40949",
  licence: "GPL-3.0-or-later",
  url: "https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/chess/__init__.py#L3341-L3346",
  text,
  operation: { id: "runtime.semantic.transition_edge", version: 1 },
  cases: [
    {
      arm: "positive",
      input: {
        kind: "edge",
        beforeFen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
        moveUci: "e1h1",
        afterFen: "r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1",
      },
      proposition: {
        subject: { kind: "event", projection: { id: "rules.transition.event.castled", version: 1 } },
        case: { id: "cited.python-chess.king-to-rook.castled", version: 1 },
        factConstraint: [],
        expectation: { kind: "emits", minimum: 1 },
      },
    },
    {
      arm: "semantic_negative",
      input: {
        kind: "edge",
        beforeFen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
        moveUci: "e1e2",
        afterFen: "r3k2r/8/8/8/8/8/4K3/R6R b kq - 1 1",
      },
      proposition: {
        subject: { kind: "event", projection: { id: "rules.transition.event.castled", version: 1 } },
        case: { id: "cited.python-chess.king-step.no-castle", version: 1 },
        factConstraint: [],
        expectation: { kind: "omits" },
      },
    },
  ] satisfies readonly CitedCase[],
}] as const);
