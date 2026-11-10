// One actual finite source consumer. Persistence and Profile adoption remain separate boundaries.
import { readBackReplay, transposeKey } from "@chess-tabiya/runtime";
import { branchPath } from "../../../packages/runtime/src/branch-path.js";
import { positionFromFen } from "../../../packages/runtime/src/position-cache.js";
import { preflightProfileChoiceFacts, collectProfileChoicePopulation } from "../../../packages/runtime/src/internal/profile-choice-facts.js";
import { normativeDecisions } from "./longitudinal-decisions.js";
import { ownProfileChoiceFact } from "./profile-choice-facts-authority.js";
import { parseLongitudinalChoiceFactRow, type LongitudinalChoiceFactRow, type ProfileChoiceCohort, type ChoiceDecision, type ChoiceResult } from "./profile-choice-facts-contract.js";
import { readProfileGameSource, selectProfileChoiceDecision, type ProfileGameSource } from "./profile-game-source.js";
import type { LongitudinalSourceImageV4 } from "./longitudinal-source.js";
const STANDARD = transposeKey("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");

export function consumeProfileChoiceFacts(image: LongitudinalSourceImageV4, options: {
  readonly gameSource?: ProfileGameSource; readonly derivedRev: number; readonly checkpoint?: () => void;
}): LongitudinalChoiceFactRow {
  preflightProfileChoiceFacts();
  const scope = options.gameSource === undefined ? undefined : readProfileGameSource(options.gameSource);
  if (scope !== undefined && (scope.image !== image || scope.identity.derivedRev !== options.derivedRev)) throw new TypeError("Choice consumer crosses its original image or revision");
  const run = scope?.run ?? readBackReplay(image.runPrefix.events).run;
  const primary = run.branches[0]!;
  const path = branchPath(run, primary.id);
  const byNode = new Map(normativeDecisions(image, run).filter(d => d.decisionClass === "played").map(d => [d.ref.nodeId, d]));
  const selected = path.slice(1).flatMap((after, index) => {
    const decision = byNode.get(after.id);
    return decision === undefined ? [] : [{ decision, before: path[index]!, after, sourcePly: index }];
  });
  let cohort: ProfileChoiceCohort;
  if (transposeKey(run.start.fen) !== STANDARD) cohort = { kind: "ineligible", reason: "not_standard_start" };
  else if (selected.length === 0) cohort = { kind: "ineligible", reason: "no_primary_played_decision" };
  else {
    const decisions: ChoiceDecision[] = selected.map(({ decision, before, after, sourcePly }) => {
      options.checkpoint?.();
      let result: ChoiceResult;
      if (options.gameSource === undefined) result = { kind: "unavailable", reason: "source_context_unavailable" };
      else {
        const source = selectProfileChoiceDecision(options.gameSource, decision.ref);
        result = source.kind === "unavailable" ? source : { kind: "available", ...collectProfileChoicePopulation(source.decision, options.checkpoint) };
      }
      return { ref: { nodeId: after.id, eventSeq: decision.ref.eventSeq, beforeNodeId: before.id, sourcePly },
        beforeFen: before.fen, moveUci: decision.moveUci, afterFen: after.fen,
        moverColor: positionFromFen(before.fen).turn, phase: decision.phase, result };
    });
    cohort = { kind: "eligible", decisions };
  }
  if (options.gameSource !== undefined) readProfileGameSource(options.gameSource);
  return ownProfileChoiceFact(parseLongitudinalChoiceFactRow({ learnerId: image.ownerLearnerId, runId: run.id,
    completedSeq: image.runPrefix.requestedSeq, derivedRev: options.derivedRev,
    observedAt: new Date(Date.parse(run.events[0]!.at)).toISOString(), primaryBranchId: primary.id, cohort }), image, options.gameSource);
}
