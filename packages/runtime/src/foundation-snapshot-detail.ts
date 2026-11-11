// Accepted evidence-presentation §3.10e: literal, lossless source-member expansion. No collector.
import { evidenceDigest } from "./evidence-contract.js";
import type { LegalExchangeBranch, LegalExchangeResult } from "./exchange.js";
import { FOUNDATION_VALUE_SCHEMAS as shape } from "./foundation-edge-presentation.js";
import { FOUNDATION_SNAPSHOT_SCHEMAS as snapshot, assertFoundationAdvanceEdge } from "./foundation-snapshot-presentation.js";
import { pieceOn, s, side } from "./presentation-schema.js";

const context = s.obj({ fen: s.str }), based = s.obj({ fen: s.str, basis: s.lit("future_file") });
const rawAdvanceContext = s.obj({ beforeFen: s.str, moveUci: s.uci, afterFen: s.str, pawn: shape.backward,
  advancedPawn: s.obj({ color: s.color, role: s.lit("pawn"), square: s.square }), landingFen: s.str, landingSquare: s.square, captureCount: s.nat, replyCount: s.nat });
const advanceContext = (value: unknown, label: string) => {
  const parsed = rawAdvanceContext(value, label);
  assertFoundationAdvanceEdge(parsed);
  return parsed;
};
export const FOUNDATION_DETAIL_CONTEXTS = { backward_pawns: context, pawn_file_groups: context, file_states: context,
  future_file_challenges: context, capture_migration_reaches: context, outpost_candidates: based,
  occupied_outposts: based, backward_pawn_advance: advanceContext } as const;
export type FoundationDetailKind = keyof typeof FOUNDATION_DETAIL_CONTEXTS;
export type FoundationDetailSources = { readonly [K in FoundationDetailKind]: ReturnType<(typeof snapshot)[K]> };
// Use the same closed source element shapes; no generic field/path walker.
const challenge = s.obj({ pawn: shape.pawn, target: s.square, pushes: s.nat });
const reach = s.obj({ pawn: shape.pawn, target: s.square, captures: s.nat, pushes: s.nat });
const candidate = s.obj({ color: s.color, square: s.square, relativeRank: s.lit(4, 5, 6), supportPawns: s.arr(shape.pawn, { min: 1 }), challengers: s.arr(challenge, { max: 0 }) });
const occupied = s.obj({ candidate, occupant: s.obj({ color: s.color, role: s.lit("bishop", "knight", "rook", "queen"), square: s.square }) });
const placed = shape.placed;
const step = s.obj({ moveUci: s.uci, mover: placed, captured: placed, from: s.square, to: s.square, delta: s.int }, { promotion: s.lit("queen", "rook", "bishop", "knight") });
const member = <K extends string, T>(kind: K, parse: (v: unknown, l: string) => T) => s.obj({ kind: s.lit(kind), value: parse });
export const FOUNDATION_DETAIL_MEMBER_PARSERS = {
  foundation_pawn_domain: member("foundation_pawn_domain", shape.pawn),
  foundation_backward_pawn: member("foundation_backward_pawn", shape.backward),
  foundation_pawn_file_group: member("foundation_pawn_file_group", shape.group),
  foundation_file_state: member("foundation_file_state", shape.fileRow),
  foundation_future_challenge: member("foundation_future_challenge", challenge),
  foundation_migration_reach: member("foundation_migration_reach", reach),
  foundation_outpost_candidate: member("foundation_outpost_candidate", candidate),
  foundation_occupied_outpost: member("foundation_occupied_outpost", occupied),
  foundation_capture_header: member("foundation_capture_header", s.obj({ captureIndex: s.nat, beforeFen: s.str, captureUci: s.uci, landingSquare: s.square, capturer: placed, captured: placed,
    conventionId: s.lit("legal-exchange@1"), resultUnits: s.int, branchCount: s.nat, chosenLineCount: s.nat, stopDecisionCount: s.nat })),
  foundation_exchange_branch: member("foundation_exchange_branch", s.obj({ captureIndex: s.nat, path: s.arr(s.nat, { min: 1 }), step, resultUnits: s.int, chosen: s.bool, continuationCount: s.nat })),
  foundation_exchange_chosen: member("foundation_exchange_chosen", s.obj({ captureIndex: s.nat, lineIndex: s.nat, step })),
  foundation_exchange_stop: member("foundation_exchange_stop", s.obj({ captureIndex: s.nat, index: s.nat, ply: s.nat, color: s.color, stopped: s.bool })),
  foundation_pawn_reply: member("foundation_pawn_reply", s.obj({ replyIndex: s.nat, captureIndex: s.nat })),
} as const;
export type FoundationDetailMember = ReturnType<(typeof FOUNDATION_DETAIL_MEMBER_PARSERS)[keyof typeof FOUNDATION_DETAIL_MEMBER_PARSERS]>;
export const EXCHANGE_DETAIL_KINDS = ["foundation_capture_header", "foundation_exchange_branch", "foundation_exchange_chosen", "foundation_exchange_stop"] as const;
export type ExchangeDetailMember = Extract<FoundationDetailMember, { kind: typeof EXCHANGE_DETAIL_KINDS[number] }>;

export function exchangeDetailMembers(capture: LegalExchangeResult, captureIndex: number): readonly ExchangeDetailMember[] {
  const { branches, chosenLine, stopDecisions, ...head } = capture;
  const members: ExchangeDetailMember[] = [{ kind: "foundation_capture_header", value: {
    captureIndex, ...head, branchCount: branches.length, chosenLineCount: chosenLine.length, stopDecisionCount: stopDecisions.length,
  } }];
  const walk = (rows: readonly LegalExchangeBranch[], parent: readonly number[]) => rows.forEach((row, index) => {
    const path = [...parent, index];
    members.push({ kind: "foundation_exchange_branch", value: { captureIndex, path, step: step(row.step, "original branch step"), resultUnits: row.resultUnits, chosen: row.chosen, continuationCount: row.continuation.length } });
    walk(row.continuation, path);
  });
  walk(branches, []);
  chosenLine.forEach((value, lineIndex) => members.push({ kind: "foundation_exchange_chosen", value: { captureIndex, lineIndex, step: step(value, "original chosen step") } }));
  stopDecisions.forEach((decision, index) => members.push({ kind: "foundation_exchange_stop", value: { captureIndex, index, ...decision } }));
  return members;
}
export const FOUNDATION_DETAIL_KINDS = {
  backward_pawns: ["foundation_pawn_domain", "foundation_backward_pawn"], pawn_file_groups: ["foundation_pawn_file_group"], file_states: ["foundation_file_state"],
  future_file_challenges: ["foundation_pawn_domain", "foundation_future_challenge"], capture_migration_reaches: ["foundation_pawn_domain", "foundation_migration_reach"],
  outpost_candidates: ["foundation_outpost_candidate"], occupied_outposts: ["foundation_occupied_outpost"],
  backward_pawn_advance: [...EXCHANGE_DETAIL_KINDS, "foundation_pawn_reply"],
} as const;
export const FOUNDATION_DETAIL_CAPTIONS = { backward_pawns: "backward-pawn@1", pawn_file_groups: "pawn-file-membership@1", file_states: "piece-geometry@1",
  future_file_challenges: "future-file-challenge@1", capture_migration_reaches: "capture-migration-reach@1", outpost_candidates: "outpost-candidate@1", occupied_outposts: "outpost-candidate@1", backward_pawn_advance: "legal-exchange@1" } as const;
export function isFoundationDetailKind(kind: string): kind is FoundationDetailKind { return Object.hasOwn(FOUNDATION_DETAIL_CONTEXTS, kind); }
export function isFoundationDetailMember(value: { readonly kind: string }): value is FoundationDetailMember { return Object.hasOwn(FOUNDATION_DETAIL_MEMBER_PARSERS, value.kind); }
export function foundationDetailMembers(kind: FoundationDetailKind, source: FoundationDetailSources[FoundationDetailKind]): {
  readonly context: ReturnType<(typeof FOUNDATION_DETAIL_CONTEXTS)[FoundationDetailKind]>; readonly members: readonly FoundationDetailMember[];
} {
  const members: FoundationDetailMember[] = [];
  let context: unknown;
  switch (kind) {
    case "backward_pawns": { const v = snapshot.backward_pawns(source, "complete source"); context = { fen: v.fen };
      v.pawnDomain.forEach(value => members.push({ kind: "foundation_pawn_domain", value })); v.pawns.forEach(value => members.push({ kind: "foundation_backward_pawn", value })); break; }
    case "pawn_file_groups": { const v = snapshot.pawn_file_groups(source, "complete source"); context = { fen: v.fen }; v.groups.forEach(value => members.push({ kind: "foundation_pawn_file_group", value })); break; }
    case "file_states": { const v = snapshot.file_states(source, "complete source"); context = { fen: v.fen }; v.files.forEach(value => members.push({ kind: "foundation_file_state", value })); break; }
    case "future_file_challenges": { const v = snapshot.future_file_challenges(source, "complete source"); context = { fen: v.fen };
      v.pawnDomain.forEach(value => members.push({ kind: "foundation_pawn_domain", value })); v.challenges.forEach(value => members.push({ kind: "foundation_future_challenge", value })); break; }
    case "capture_migration_reaches": { const v = snapshot.capture_migration_reaches(source, "complete source"); context = { fen: v.fen };
      v.pawnDomain.forEach(value => members.push({ kind: "foundation_pawn_domain", value })); v.reaches.forEach(value => members.push({ kind: "foundation_migration_reach", value })); break; }
    case "outpost_candidates": { const v = snapshot.outpost_candidates(source, "complete source"); context = { fen: v.fen, basis: v.basis }; v.candidates.forEach(value => members.push({ kind: "foundation_outpost_candidate", value })); break; }
    case "occupied_outposts": { const v = snapshot.occupied_outposts(source, "complete source"); context = { fen: v.fen, basis: v.basis }; v.occupied.forEach(value => members.push({ kind: "foundation_occupied_outpost", value })); break; }
    case "backward_pawn_advance": {
      const v = snapshot.backward_pawn_advance(source, "complete source");
      context = { beforeFen: v.beforeFen, moveUci: v.moveUci, afterFen: v.afterFen, pawn: v.pawn, advancedPawn: v.advancedPawn,
        landingFen: v.landing.fen, landingSquare: v.landing.landingSquare, captureCount: v.landing.captures.length, replyCount: v.replies.length };
      v.landing.captures.forEach((capture, captureIndex) => members.push(...exchangeDetailMembers(capture, captureIndex)));
      const digests = v.landing.captures.map(capture => evidenceDigest(capture));
      v.replies.forEach((reply, replyIndex) => {
        const digest = evidenceDigest(reply), captureIndex = digests.indexOf(digest);
        if (captureIndex < 0 || digests.lastIndexOf(digest) !== captureIndex) throw new TypeError("Reply does not identify one complete original landing capture");
        members.push({ kind: "foundation_pawn_reply", value: { replyIndex, captureIndex } });
      });
      break;
    }
    default: throw new TypeError("Unsupported exact foundation detail");
  }
  return { context: FOUNDATION_DETAIL_CONTEXTS[kind](context, "foundation detail context") as ReturnType<(typeof FOUNDATION_DETAIL_CONTEXTS)[FoundationDetailKind]>, members: Object.freeze(members) };
}
const list = (xs: readonly string[]) => xs.join(", ") || "none";
const pawns = (xs: readonly ReturnType<typeof shape.pawn>[]) => list(xs.map(p => `${side(p.color)} ${p.square}`));
const yes = (v: boolean) => v ? "yes" : "no";
const placedText = (p: ReturnType<typeof placed>) => pieceOn(p, p.square);
function backwardText(v: ReturnType<typeof shape.backward>): string {
  return `${side(v.color)} pawn ${v.pawn}, stop ${v.stop}; controllers ${pawns(v.controllers)}; supports ${pawns(v.supportPawns)}; ahead-adjacent pawns ${pawns(v.aheadAdjacentPawns)}; stop ${v.stopOccupancy.kind === "empty" ? "empty" : `${v.stopOccupancy.kind === "own" ? "own" : "enemy"} ${v.stopOccupancy.piece.role}`}; pseudo-capturable enemy pawns ${pawns(v.immediatePseudoCapture)}; half-open for ${side(v.halfOpenForColor.color)}: ${yes(v.halfOpenForColor.value)}.`;
}
const classes = { open: "open", half_open_white: "half-open for White", half_open_black: "half-open for Black", closed: "closed" };
const candidateText = (v: ReturnType<typeof candidate>) => `${side(v.color)} ${v.square}, relative rank ${v.relativeRank}; supporting pawns ${pawns(v.supportPawns)}; opposing same-file challengers ${v.challengers.length === 0 ? "none" : "unavailable"}.`;
const stepText = (v: ReturnType<typeof step>) => `${placedText(v.mover)} from ${v.from} to ${v.to}, captures ${placedText(v.captured)}; promotion ${v.promotion ?? "none"}; declared exchange delta ${v.delta} units.`;
export function renderFoundationDetailMember(member: FoundationDetailMember): string {
  switch (member.kind) {
    case "foundation_pawn_domain": return `Root pawn: ${side(member.value.color)} ${member.value.square}.`;
    case "foundation_backward_pawn": return backwardText(member.value);
    case "foundation_pawn_file_group": { const v = member.value; return `${side(v.color)} ${v.file}-file pawns front to rear: ${list(v.pawns)}; adjacent occupied files ${list(v.adjacentOccupiedFiles)}; island files ${list(v.islandFiles)}; isolated ${yes(v.isolated)}, doubled ${yes(v.doubled)}.`; }
    case "foundation_file_state": { const v = member.value; return `${v.file}-file ${classes[v.state]}; White pawns ${list(v.whitePawns)}; Black pawns ${list(v.blackPawns)}.`; }
    case "foundation_future_challenge": { const v = member.value; return `Root pawn ${side(v.pawn.color)} ${v.pawn.square}, target ${v.target}, ${v.pushes} single-rank geometric pushes. Hypothetical same-file geometry; occupancy, turn and king safety ignored.`; }
    case "foundation_migration_reach": { const v = member.value; return `Root pawn ${side(v.pawn.color)} ${v.pawn.square}, target ${v.target}, ${v.captures} hypothetical captures and ${v.pushes} pushes. Victims and legal paths are not established.`; }
    case "foundation_outpost_candidate": return candidateText(member.value);
    case "foundation_occupied_outpost": return `${candidateText(member.value.candidate)} Actual occupant: ${placedText(member.value.occupant)}; no arrival or permanence claim.`;
    case "foundation_capture_header": { const v = member.value; return `Landing capture ${v.captureIndex + 1}: ${placedText(v.capturer)} captures ${placedText(v.captured)}, landing ${v.landingSquare}; declared exchange result ${v.resultUnits} units; branches ${v.branchCount}, chosen-line steps ${v.chosenLineCount}, stop decisions ${v.stopDecisionCount}.`; }
    case "foundation_exchange_branch": { const v = member.value; return `Capture ${v.captureIndex + 1}, branch ${v.path.map(i => i + 1).join(".")}: ${stepText(v.step)} Result ${v.resultUnits} declared exchange units; chosen ${yes(v.chosen)}; continuation branches ${v.continuationCount}.`; }
    case "foundation_exchange_chosen": { const v = member.value; return `Capture ${v.captureIndex + 1}, chosen-line step ${v.lineIndex + 1}: ${stepText(v.step)}`; }
    case "foundation_exchange_stop": { const v = member.value; return `Capture ${v.captureIndex + 1}, stop decision ${v.index + 1}, ply ${v.ply}: ${side(v.color)} stopped ${yes(v.stopped)}.`; }
    case "foundation_pawn_reply": return `Pawn reply ${member.value.replyIndex + 1} is original landing capture ${member.value.captureIndex + 1}, a calculated legal option, not an observed reply.`;
  }
}
export function renderFoundationDetailContext(kind: FoundationDetailKind, value: unknown): string {
  if (kind === "backward_pawn_advance") {
    const v = advanceContext(value, "advance detail context");
    return `Played advance ${v.pawn.pawn} to ${v.advancedPawn.square}; ${backwardText(v.pawn)} Advanced pawn ${placedText(v.advancedPawn)}; landing ${v.landingSquare}, complete captures ${v.captureCount}, calculated opposing-pawn replies ${v.replyCount}. Not observed replies or forced play.`;
  }
  return kind === "outpost_candidates" || kind === "occupied_outposts" ? "Same-file future-challenge definition; candidacy is not safety or permanence." : "";
}
