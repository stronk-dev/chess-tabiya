// Cheap original-cut/decision joins, built alongside existing cached RunFact metadata. No collectors.
import { readBackReplay } from "../../../packages/runtime/src/replay.js";
import { branchPath } from "../../../packages/runtime/src/branch-path.js";
import { positionFromFen } from "../../../packages/runtime/src/position-cache.js";
import { profileGameFactReferenceIndex } from "./profile-game-fact-references.js";
import { normativeDecisions } from "./longitudinal-decisions.js";
import type { LongitudinalSourceImageV4 } from "./longitudinal-source.js";
import type { LongitudinalChoiceFactRow } from "./profile-choice-facts-contract.js";

export function profileChoiceFactReferenceIndex(image: LongitudinalSourceImageV4, run = readBackReplay(image.runPrefix.events).run) {
  const game = profileGameFactReferenceIndex(image, run), path = branchPath(run, run.branches[0]!.id);
  const byNode = new Map(normativeDecisions(image, run).filter(d => d.decisionClass === "played").map(d => [d.ref.nodeId, d]));
  const decisions = path.slice(1).flatMap((after, sourcePly) => {
    const actual = byNode.get(after.id), before = path[sourcePly]!;
    return actual === undefined ? [] : [Object.freeze({ ref: Object.freeze({ nodeId: after.id, eventSeq: actual.ref.eventSeq, beforeNodeId: before.id, sourcePly }),
      beforeFen: before.fen, afterFen: after.fen, moveUci: actual.moveUci, moverColor: positionFromFen(before.fen).turn, phase: actual.phase })];
  });
  return Object.freeze({ learnerId: game.learnerId, runId: game.runId, completedSeq: game.completedSeq,
    observedAt: game.observedAt, primaryBranchId: game.primaryBranchId, reason: game.reason,
    roleSupported: image.structureAttribution === "single_player", decisions: Object.freeze(decisions) });
}
export function assertProfileChoiceFactReferenceIndex(row: LongitudinalChoiceFactRow, index: ReturnType<typeof profileChoiceFactReferenceIndex>): void {
  const fail = (): never => { throw new TypeError("LONGITUDINAL_CHOICE_SOURCE_JOIN_INVALID"); };
  for (const key of ["learnerId", "runId", "completedSeq", "observedAt", "primaryBranchId"] as const) if (row[key] !== index[key]) return fail();
  if (index.reason !== null) { if (row.cohort.kind !== "ineligible" || row.cohort.reason !== index.reason) return fail(); return; }
  if (row.cohort.kind !== "eligible" || row.cohort.decisions.length !== index.decisions.length) return fail();
  for (const [i, actual] of index.decisions.entries()) {
    const supplied = row.cohort.decisions[i]!;
    for (const key of ["beforeFen", "afterFen", "moveUci", "moverColor", "phase"] as const) if (supplied[key] !== actual[key]) return fail();
    for (const key of ["nodeId", "beforeNodeId", "sourcePly", "eventSeq"] as const) if (supplied.ref[key] !== actual.ref[key]) return fail();
    if (!index.roleSupported && supplied.result.kind === "available"
      || index.roleSupported && supplied.result.kind === "unavailable" && supplied.result.reason === "role_unavailable") return fail();
  }
}
export function assertProfileChoiceFactReferences(row: LongitudinalChoiceFactRow, image: LongitudinalSourceImageV4): void {
  assertProfileChoiceFactReferenceIndex(row, profileChoiceFactReferenceIndex(image));
}
