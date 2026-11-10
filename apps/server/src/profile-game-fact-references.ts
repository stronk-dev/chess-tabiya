// Cheap row/source joins shared by publication and readback; no semantic collectors or projector.
import { branchPath } from "../../../packages/runtime/src/branch-path.js";
import { readBackReplay } from "../../../packages/runtime/src/replay.js";
import { positionFromFen } from "../../../packages/runtime/src/position-cache.js";
import { transposeKey } from "@chess-tabiya/runtime";
import { normativeDecisions } from "./longitudinal-decisions.js";
import type { LongitudinalSourceImageV4 } from "./longitudinal-source.js";
import type { GameNodeRef, LongitudinalGameFactRow } from "./profile-game-facts-contract.js";
const STANDARD = transposeKey("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
/** Built once alongside the existing completed RunFact; warm readers do not replay or collect. */
export function profileGameFactReferenceIndex(image: LongitudinalSourceImageV4, run = readBackReplay(image.runPrefix.events).run) {
  const primary = run.branches[0]!, path = branchPath(run, primary.id);
  const members = new Map(path.map((node, sourcePly) => {
    const creations = run.events.filter(e => e.type === "run.started" ? e.data.rootNode.id === node.id : e.type === "move.committed" && e.data.node.id === node.id);
    if (creations.length !== 1) throw new TypeError("LONGITUDINAL_GAME_SOURCE_JOIN_INVALID");
    return [node.id, Object.freeze({ sourcePly, eventSeq: creations[0]!.seq })] as const;
  }));
  const decisions = normativeDecisions(image, run).filter(d => d.decisionClass === "played" && members.has(d.ref.nodeId));
  const reason = transposeKey(run.start.fen) !== STANDARD ? "not_standard_start" : decisions.length === 0 ? "no_primary_played_decision" : null;
  const firstChild = path.find(node => node.id === decisions[0]?.ref.nodeId);
  const proved = new Set(decisions.map(d => `${d.ref.nodeId}\0${d.ref.eventSeq}`));
  const supported = image.structureAttribution === "single_player" && path.slice(1).every((node, index) =>
    positionFromFen(path[index]!.fen).turn !== run.start.side || proved.has(`${node.id}\0${members.get(node.id)!.eventSeq}`));
  return Object.freeze({ runId: run.id, learnerId: image.ownerLearnerId, completedSeq: image.runPrefix.requestedSeq,
    primaryBranchId: primary.id, learnerSide: run.start.side, observedAt: new Date(Date.parse(run.events[0]!.at)).toISOString(),
    reason, members, firstOwnerBeforeId: firstChild?.parentId, firstSideNodeId: path.find(node => positionFromFen(node.fen).turn === run.start.side)?.id, supported });
}
export function assertProfileGameFactReferenceIndex(row: LongitudinalGameFactRow, index: ReturnType<typeof profileGameFactReferenceIndex>): void {
  const fail = (): never => { throw new TypeError("LONGITUDINAL_GAME_SOURCE_JOIN_INVALID"); };
  for (const key of ["runId", "learnerId", "completedSeq", "primaryBranchId", "learnerSide", "observedAt"] as const) if (row[key] !== index[key]) return fail();
  if (index.reason !== null) { if (row.game.kind !== "ineligible" || row.game.reason !== index.reason) return fail(); return; }
  if (row.game.kind !== "eligible") return fail();
  const exactRef = (ref: GameNodeRef, nonroot = false): void => {
    const actual = index.members.get(ref.nodeId);
    if (actual === undefined || actual.sourcePly !== ref.sourcePly || actual.eventSeq !== ref.eventSeq || nonroot && ref.sourcePly === 0) return fail();
  };
  exactRef(row.game.firstOwnerDecision);
  if (row.game.firstOwnerDecision.nodeId !== index.firstOwnerBeforeId) return fail();
  for (const field of [row.game.fianchetto, row.game.knightScreen]) if (field.kind === "observed" && field.first !== null) exactRef(field.first, true);
  if (row.game.castling.kind === "observed") {
    exactRef(row.game.castling.before);
    if (JSON.stringify(row.game.castling.before) !== JSON.stringify(row.game.firstOwnerDecision) || index.firstSideNodeId !== row.game.castling.before.nodeId) return fail();
  }
  if (!index.supported && [row.game.fianchetto, row.game.knightScreen, row.game.castling].some(field => field.kind !== "unavailable" || field.reason !== "role_unavailable" && field.reason !== "worker_context_unavailable")) return fail();
  const screen = row.game.knightScreen, setup = row.game.fianchetto;
  if (screen.kind === "observed" && screen.first !== null && (setup.kind !== "observed" || setup.first === null || setup.first.sourcePly > screen.first.sourcePly)) return fail();
}
export function assertProfileGameFactReferences(row: LongitudinalGameFactRow, image: LongitudinalSourceImageV4): void {
  assertProfileGameFactReferenceIndex(row, profileGameFactReferenceIndex(image));
}
