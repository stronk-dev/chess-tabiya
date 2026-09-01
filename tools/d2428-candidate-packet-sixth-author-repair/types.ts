interface ExactLegalMoveMap {
  readonly fen: string;
  readonly turn: "white" | "black";
  readonly pieces: readonly { readonly moves: readonly { readonly uci: string }[] }[];
}
interface DeclaredEvidence<T> { readonly payload: T }
declare function createRulesMobilityReadingLegalMovesV1Evidence(fen: string): DeclaredEvidence<ExactLegalMoveMap>;

declare const fen: string;
const declared: DeclaredEvidence<ExactLegalMoveMap> = createRulesMobilityReadingLegalMovesV1Evidence(fen);
void declared;

// @ts-expect-error callers cannot submit a map for validation or sealing
createRulesMobilityReadingLegalMovesV1Evidence({ fen, turn: "white", pieces: [] });
