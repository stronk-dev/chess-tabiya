// One actual machine consumer: genuine GAME context → a small typed per-cut result, no prose.
import { readBackReplay, transposeKey } from "@chess-tabiya/runtime";
import { positionFromFen } from "../../../packages/runtime/src/position-cache.js";
import { branchPath } from "../../../packages/runtime/src/branch-path.js";
import { preflightProfileGameFacts, collectProfileGameConfiguration, collectProfileGameRights } from "../../../packages/runtime/src/internal/profile-game-facts.js";
import { ownProfileGameFact } from "./profile-game-facts-authority.js";
import { normativeDecisions } from "./longitudinal-decisions.js";
import { readProfileGameSource, type ProfileGameSource } from "./profile-game-source.js";
import type { LongitudinalSourceImageV4 } from "./longitudinal-source.js";
import { parseLongitudinalGameFactRow, type LongitudinalGameFactRow, type GameNodeRef, type ProfileGame, type GameInitialRights } from "./profile-game-facts-contract.js";
import type { FoundationPathMember } from "../../../packages/runtime/src/recorded-foundation-source.js";
import type { FirstDecisionCastling } from "../../../packages/runtime/src/foundation-style-sources.js";
const STANDARD = transposeKey("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
const nodeRef = (member: FoundationPathMember): GameNodeRef => Object.freeze({ nodeId: member.nodeId, sourcePly: member.sourcePly, eventSeq: member.creation.seq });
/** Identity join only. The caller retains the genuine original factory value and its scope. */
export function joinProfileGameRights(rights: FirstDecisionCastling, before: GameNodeRef): GameInitialRights {
  return rights.firstDecisionNodeId !== before.nodeId || rights.sourcePly !== before.sourcePly
    ? { kind: "unavailable", reason: "source_subject_mismatch" }
    : { kind: "observed", before, ...rights.rights };
}
export function consumeProfileGameFacts(image: LongitudinalSourceImageV4, options: {
  readonly gameSource?: ProfileGameSource; readonly derivedRev: number; readonly checkpoint?: () => void;
}): LongitudinalGameFactRow {
  preflightProfileGameFacts();
  const source = options.gameSource === undefined ? undefined : readProfileGameSource(options.gameSource);
  if (source !== undefined && source.image !== image) throw new TypeError("Profile GAME source crosses its identical worker image");
  const run = source?.run ?? readBackReplay(image.runPrefix.events).run;
  const primary = run.branches[0]!;
  const line = branchPath(run, primary.id), ids = new Set(line.map(node => node.id));
  const decisions = normativeDecisions(image, run).filter(d => d.decisionClass === "played" && ids.has(d.ref.nodeId));
  const members = source?.path ?? line.map((node, sourcePly) => {
    const ordinal = run.events.findIndex(event => event.type === "run.started" ? event.data.rootNode.id === node.id : event.type === "move.committed" && event.data.node.id === node.id);
    const event = run.events[ordinal]!;
    if (event.type !== "run.started" && event.type !== "move.committed") throw new TypeError("GAME node has no original creation");
    return { nodeId: node.id, fen: node.fen, sourcePly, creation: { ordinal, seq: event.seq, type: event.type } };
  });
  let game: ProfileGame;
  if (transposeKey(run.start.fen) !== STANDARD) game = { kind: "ineligible", reason: "not_standard_start" };
  else if (decisions.length === 0) game = { kind: "ineligible", reason: "no_primary_played_decision" };
  else {
    const firstChild = line.find(node => node.id === decisions[0]!.ref.nodeId)!;
    const before = members.find(member => member.nodeId === firstChild.parentId);
    if (before === undefined) throw new TypeError("GAME first owner decision has no original BEFORE node");
    const firstOwnerDecision = nodeRef(before);
    const proved = new Set(decisions.map(d => `${d.ref.nodeId}\0${d.ref.eventSeq}`));
    const supported = image.structureAttribution === "single_player" && line.slice(1).every((child, index) =>
      positionFromFen(line[index]!.fen).turn !== run.start.side || proved.has(`${child.id}\0${members[index + 1]!.creation.seq}`));
    if (source === undefined || !supported) {
      const reason = source === undefined ? "worker_context_unavailable" as const : "role_unavailable" as const;
      game = { kind: "eligible", firstOwnerDecision, fianchetto: { kind: "unavailable", reason },
        knightScreen: { kind: "unavailable", reason }, castling: { kind: "unavailable", reason } };
    } else {
      let firstSetup: GameNodeRef | null = null, firstScreen: GameNodeRef | null = null;
      for (const member of members.slice(1)) {
        options.checkpoint?.(); readProfileGameSource(options.gameSource!);
        const values = collectProfileGameConfiguration(member.fen);
        if (firstSetup === null && values.setup.setups.some(row => row.color === run.start.side)) firstSetup = nodeRef(member);
        if (firstScreen === null && values.screen.screens.some(row => row.setup.color === run.start.side)) firstScreen = nodeRef(member);
        readProfileGameSource(options.gameSource!);
      }
      const rights = collectProfileGameRights(source.prefix);
      let castling: GameInitialRights;
      if (rights.kind === "unavailable") castling = { kind: "unavailable", reason: "source_unavailable" };
      else castling = joinProfileGameRights(rights.value.payload, firstOwnerDecision);
      readProfileGameSource(options.gameSource!);
      game = { kind: "eligible", firstOwnerDecision, fianchetto: { kind: "observed", first: firstSetup }, knightScreen: { kind: "observed", first: firstScreen }, castling };
    }
  }
  return ownProfileGameFact(parseLongitudinalGameFactRow({ learnerId: image.ownerLearnerId, runId: run.id, completedSeq: image.runPrefix.requestedSeq,
    derivedRev: options.derivedRev, observedAt: new Date(Date.parse(run.events[0]!.at)).toISOString(), primaryBranchId: primary.id, learnerSide: run.start.side, game }), image, options.gameSource);
}
