import { isNormal } from "chessops/types";
import { makeUci, parseUci } from "chessops/util";

import { canonicalFen, positionFromFen } from "./chess.js";
import { BREADTH_COLLECTOR_PROJECTION_IDS, TACTICAL_COLLECTOR_PROJECTION_IDS } from "./evidence-catalog.js";
import type { DeclaredEvidence, VersionedEvidenceId } from "./evidence-contract.js";
import type { CandidateCollectorFactories } from "./evidence-factories.js";
import { localSemanticEvents } from "./semantic-evidence.js";
import type { DoubleAttackEvent } from "./tactics.js";
import type { SelectionEngineIdentity } from "./types.js";

export interface CandidateFeatureInput {
  readonly moveUci: string;
  /** Fixed-bound Stockfish score from the root mover's frame. */
  readonly scoreCp: number;
}

export interface CandidateCollectorResult {
  readonly source: VersionedEvidenceId;
  readonly payload: unknown;
}

export interface CandidateFeatureRow {
  readonly moveUci: string;
  readonly afterFen: string;
  readonly scoreCp: number;
  readonly results: readonly CandidateCollectorResult[];
}

export interface CandidateFeatureVector {
  readonly beforeFen: string;
  readonly scoreFrame: "root_side";
  readonly engine: SelectionEngineIdentity;
  readonly candidates: readonly CandidateFeatureRow[];
}

const CANDIDATE_COLLECTOR_IDS = new Set<string>([
  ...TACTICAL_COLLECTOR_PROJECTION_IDS,
  ...BREADTH_COLLECTOR_PROJECTION_IDS,
]);

function fixedBoundEngine(engine: SelectionEngineIdentity): SelectionEngineIdentity {
  if (engine.id.trim() === "" || engine.name.trim() === "" || engine.version.trim() === "") {
    throw new TypeError("Candidate evidence engine identity is incomplete");
  }
  if (engine.searchBound === undefined || !Number.isFinite(engine.searchBound.value) || engine.searchBound.value <= 0) {
    throw new TypeError("Candidate evidence requires a positive fixed engine search bound");
  }
  return Object.freeze({ ...engine, searchBound: Object.freeze({ ...engine.searchBound }) });
}

/**
 * Re-runs the registered tactical/breadth collectors on hypothetical legal children through their
 * factories. Adds no chess detector and emits no prose, grade, salience or trait claim. Returns the
 * vector plus every sealed collector item it was built from (the receipt's source digests).
 */
export function candidateCollectorResults(
  input: { readonly beforeFen: string; readonly engine: SelectionEngineIdentity; readonly candidates: readonly CandidateFeatureInput[] },
  factories: CandidateCollectorFactories,
): { readonly vector: CandidateFeatureVector; readonly sources: readonly DeclaredEvidence<unknown>[] } {
  let root;
  try {
    root = positionFromFen(input.beforeFen);
  } catch (cause) {
    throw new TypeError("Candidate evidence requires a legal standard-chess FEN", { cause });
  }
  const beforeFen = canonicalFen(root);
  const engine = fixedBoundEngine(input.engine);
  if (input.candidates.length === 0) throw new TypeError("Candidate evidence requires at least one candidate");
  const seen = new Set<string>();
  const sources: DeclaredEvidence<unknown>[] = [];
  const candidates = input.candidates.map((candidate) => {
    if (!Number.isFinite(candidate.scoreCp)) throw new TypeError(`Candidate evidence score is not finite: ${candidate.moveUci}`);
    const move = parseUci(candidate.moveUci);
    if (move === undefined || !isNormal(move) || !root.isLegal(move)) throw new TypeError(`Candidate evidence move is illegal: ${candidate.moveUci}`);
    const child = root.clone();
    child.play(move);
    const moveUci = makeUci(move);
    const afterFen = canonicalFen(child);
    if (seen.has(moveUci)) throw new TypeError(`Candidate evidence move is duplicated: ${moveUci}`);
    seen.add(moveUci);
    const events = localSemanticEvents(beforeFen, moveUci, afterFen);
    const declared: DeclaredEvidence<unknown>[] = [
      ...factories.childReadings(afterFen),
      ...events.filter((event) => CANDIDATE_COLLECTOR_IDS.has(event.projection.id)).map((event) => event.evidence),
      ...factories.exchange(beforeFen, moveUci),
    ];
    const doubleAttack = events.find((event) => event.projection.id === "rules.tactic.event.double_attack");
    if (doubleAttack !== undefined) declared.push(factories.forkSurvival(doubleAttack.evidence as DeclaredEvidence<DoubleAttackEvent>, { beforeFen, moveUci, afterFen }));
    const results = declared.map((evidence) => {
      if (!CANDIDATE_COLLECTOR_IDS.has(evidence.projection.id)) {
        throw new TypeError(`Candidate evidence escaped the tactical/breadth collector closure: ${evidence.projection.id}@${evidence.projection.version}`);
      }
      sources.push(evidence);
      return Object.freeze({ source: evidence.projection, payload: evidence.payload });
    });
    return Object.freeze({ moveUci, afterFen, scoreCp: candidate.scoreCp, results: Object.freeze(results) });
  });
  const vector: CandidateFeatureVector = Object.freeze({ beforeFen, scoreFrame: "root_side", engine, candidates: Object.freeze(candidates) });
  return Object.freeze({ vector, sources: Object.freeze(sources) });
}
