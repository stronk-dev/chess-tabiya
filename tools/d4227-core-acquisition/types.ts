// DISPOSABLE raw research data. This is NOT a candidate receipt or evidence authority.
import type { CandidateFoundationPosition } from "../../packages/runtime/src/candidate-population.js";
import type { DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import type { ExactLegalMove, ExactLegalMoveMap } from "../../packages/runtime/src/legal-moves.js";
import type { ComputedSubjectOutcomes } from "../../packages/runtime/src/semantic-subject-outcomes.js";
import type { SubjectOutcomeFamily } from "../../packages/runtime/src/semantic-subject-types.js";

export interface RawCoreFrame {
  readonly legalMovesInput: DeclaredEvidence<ExactLegalMoveMap>;
  readonly root: CandidateFoundationPosition;
  readonly candidates: readonly {
    readonly move: ExactLegalMove;
    readonly row: Readonly<{ moveUci: string; afterFen: string }>;
    readonly position: CandidateFoundationPosition;
  }[];
}
export interface ResearchHooks {
  acquire(fen: string): RawCoreFrame;
  compute<F extends SubjectOutcomeFamily>(family: F, frame: RawCoreFrame, moveUci: string): ComputedSubjectOutcomes<F>;
}
export const HOOK_KEY = "__TABIYA_D4227_RAW_RESEARCH__";
