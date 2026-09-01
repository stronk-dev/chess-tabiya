interface ExactLegalMoveMap {
  readonly fen: string;
  readonly turn: "white" | "black";
  readonly pieces: readonly { readonly moves: readonly { readonly uci: string }[] }[];
}
interface DeclaredEvidence<T> { readonly payload: T }
declare function declareExactLegalMovesEvidence(fen: string): DeclaredEvidence<ExactLegalMoveMap>;

declare const fen: string;
const declared: DeclaredEvidence<ExactLegalMoveMap> = declareExactLegalMovesEvidence(fen);
void declared;

// @ts-expect-error callers cannot submit a map for validation or sealing
declareExactLegalMovesEvidence({ fen, turn: "white", pieces: [] });
