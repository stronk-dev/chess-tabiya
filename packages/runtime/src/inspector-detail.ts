import { EXCHANGE_DETAIL_KINDS, FOUNDATION_DETAIL_CONTEXTS, FOUNDATION_DETAIL_KINDS, FOUNDATION_DETAIL_MEMBER_PARSERS, exchangeDetailMembers, foundationDetailMembers, isFoundationDetailKind, isFoundationDetailMember, renderFoundationDetailMember, renderFoundationDetailContext, type ExchangeDetailMember, type FoundationDetailSources, type FoundationDetailKind } from "./foundation-snapshot-detail.js";
import { EXPOSURE_DETAIL_SCOPE, assertExposureDetailPage, hasExposureScope, exposureMemberMatches, parseExposureDetailContext, renderExposureDetailContext, type ExposureDetailScope } from "./defender-exposure-detail.js";
import type { AvailableDefenderExposureOperands } from "./internal/defender-exposure.js";
// Accepted module-registration §4.11a / evidence-presentation D3802. Pure bounded views over
// complete sources; no collector, chess judgement, generic JSON path, mint or process-local seal.
import type { Color, Piece, SquareName } from "chessops/types";
import type { RayClassificationReading, DefenderDutyReading } from "./tactics.js";
import type { SquareControlReading } from "./square-control.js";
import type { PieceDestinationsReading, PieceDestinationsEvent } from "./mobility.js";
import type { KingZoneReading } from "./king-state.js";
import { s, type Parser } from "./presentation-schema.js";
import { modulePolicy } from "./module-policy.js";

import { INSPECTOR_DETAIL_SOURCES, type InspectorDetailKind } from "./inspector-source-topics.js";
export { INSPECTOR_DETAIL_SOURCES, type InspectorDetailKind } from "./inspector-source-topics.js";
export interface InspectorDetailSources extends FoundationDetailSources {
  rays: RayClassificationReading;
  square_control: SquareControlReading;
  piece_destinations: PieceDestinationsReading;
  destination_changes: PieceDestinationsEvent;
  king_zone: KingZoneReading;
  defender_duties: DefenderDutyReading;
  defender_exposure: AvailableDefenderExposureOperands;
}
const piece = s.obj({ color: s.color, role: s.role }, { promoted: s.bool });
const placed = s.obj({ square: s.square, piece });
const occupied = s.obj({ square: s.square, occupant: piece });
const king: typeof placed = (value, label) => {
  const result = placed(value, label);
  if (result.piece.role !== "king") throw new TypeError(`${label} must retain its king`);
  return result;
};
const empty = s.arr(s.square, { max: 0 });
const nonnegative: Parser<number> = (value, label) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fail(`${label} must be a finite non-negative declared value`);
const beforeAfter = s.obj({ before: s.obj({ square: s.square, role: s.role }), after: s.obj({ square: s.square, role: s.role }) });
export const DESTINATION_DETAIL_SETS = Object.freeze(["legalBefore", "legalAfter", "legalGained", "legalLost", "safeBefore", "safeAfter", "safeGained", "safeLost"] as const);
const membership = s.obj({
  legalBefore: s.bool, legalAfter: s.bool, legalGained: s.bool, legalLost: s.bool,
  safeBefore: s.bool, safeAfter: s.bool, safeGained: s.bool, safeLost: s.bool,
});
const ray = s.obj({
  slider: placed, blocker: occupied, target: occupied, raySquares: s.arr(s.square),
  kind: s.lit("absolute_pin", "relative_pin", "skewer", "xray_attack", "xray_defense"),
}, { comparison: s.obj({ frontRole: s.role, backRole: s.role, frontValue: nonnegative, backValue: nonnegative }) });
const member = <K extends string, V>(kind: K, value: Parser<V>) => s.obj({ kind: s.lit(kind), value });
const MEMBER_PARSERS = Object.freeze({
  ...FOUNDATION_DETAIL_MEMBER_PARSERS,
  ray: member("ray", ray),
  defender_duty: member("defender_duty", s.obj({ conventionId: s.lit("defence-duty@1"), defender: placed, target: placed, coDefenders: s.arr(placed) })),
  control_relation: member("control_relation", s.obj({ color: s.color, mode: s.lit("geometric", "legal"), target: s.square, controller: placed })),
  control_empty_target: member("control_empty_target", s.obj({ color: s.color, mode: s.lit("geometric", "legal"), target: s.square })),
  control_unavailable: member("control_unavailable", s.obj({ color: s.color, mode: s.lit("legal"), reason: s.lit("invalid_turn_clone") })),
  destinations_unavailable: member("destinations_unavailable", s.obj({ kind: s.lit("unavailable"), color: s.color, reason: s.lit("invalid_turn_clone"), pieces: empty })),
  destinations_empty_color: member("destinations_empty_color", s.obj({ kind: s.lit("available"), color: s.color, pieces: empty })),
  destinations_empty_piece: member("destinations_empty_piece", s.obj({ color: s.color, piece: occupied })),
  destination_membership: member("destination_membership", s.obj({ color: s.color, piece: occupied, target: s.square, legal: s.bool, localNonLosing: s.bool })),
  destination_event_context: member("destination_event_context", s.obj({ color: s.color, piece: beforeAfter, moved: s.bool, zeroSafe: s.bool })),
  destination_event_membership: member("destination_event_membership", s.obj({ target: s.square, membership })),
  king_zone_member: member("king_zone_member", s.obj({ king, square: s.square })),
  king_zone_relation: member("king_zone_relation", s.obj({ king, participant: placed, square: s.square, group: s.lit("attacker", "defender") })),
  king_empty_group: member("king_empty_group", s.obj({ king, group: s.lit("attacker", "defender", "shelter") })),
  king_shelter: member("king_shelter", s.obj({ king, shelter: placed })),
  king_escape: member("king_escape", s.obj({ king, square: s.square })),
  king_escapes_empty: member("king_escapes_empty", s.obj({ king, escapes: s.obj({ kind: s.lit("available"), squares: empty }) })),
  king_escapes_unavailable: member("king_escapes_unavailable", s.obj({ king, escapes: s.obj({ kind: s.lit("unavailable"), reason: s.lit("invalid_turn_clone"), squares: empty }) })),
});
type MemberKind = keyof typeof MEMBER_PARSERS;
export type InspectorDetailMember = ReturnType<(typeof MEMBER_PARSERS)[MemberKind]>;
type MembersByDetail = {
  rays: "ray"; defender_duties: "defender_duty";
  square_control: "control_relation" | "control_empty_target" | "control_unavailable";
  piece_destinations: "destinations_unavailable" | "destinations_empty_color" | "destinations_empty_piece" | "destination_membership";
  destination_changes: "destination_event_context" | "destination_event_membership";
  king_zone: "king_zone_member" | "king_zone_relation" | "king_empty_group" | "king_shelter" | "king_escape" | "king_escapes_empty" | "king_escapes_unavailable";
  defender_exposure: typeof EXCHANGE_DETAIL_KINDS[number];
} & { [K in FoundationDetailKind]: (typeof FOUNDATION_DETAIL_KINDS)[K][number] };
const MEMBER_KINDS = Object.freeze({
  ...FOUNDATION_DETAIL_KINDS,
  defender_exposure: EXCHANGE_DETAIL_KINDS,
  rays: ["ray"], defender_duties: ["defender_duty"], square_control: ["control_relation", "control_empty_target", "control_unavailable"],
  piece_destinations: ["destinations_unavailable", "destinations_empty_color", "destinations_empty_piece", "destination_membership"],
  destination_changes: ["destination_event_context", "destination_event_membership"],
  king_zone: ["king_zone_member", "king_zone_relation", "king_empty_group", "king_shelter", "king_escape", "king_escapes_empty", "king_escapes_unavailable"],
} as const satisfies Record<InspectorDetailKind, readonly MemberKind[]>);
const WHOLE = s.obj({ kind: s.lit("whole") });
const CONTROL_SCOPE = s.union("kind", {
  whole: WHOLE,
  control_target: s.obj({ kind: s.lit("control_target"), color: s.color, mode: s.lit("geometric", "legal"), target: s.square }),
});
export type InspectorDetailScope = ReturnType<typeof CONTROL_SCOPE> | ExposureDetailScope;
const CONTEXTS = {
  ...FOUNDATION_DETAIL_CONTEXTS,
  defender_exposure: parseExposureDetailContext,
  rays: s.obj({ fen: s.str }), defender_duties: s.obj({ fen: s.str }), square_control: s.obj({ fen: s.str }),
  piece_destinations: s.obj({ fen: s.str, conventionId: s.lit("local-non-losing@1") }),
  destination_changes: s.obj({ beforeFen: s.str, moveUci: s.uci, afterFen: s.str, color: s.color, piece: beforeAfter, moved: s.bool, zeroSafe: s.bool }),
  king_zone: s.obj({ fen: s.str, zoneConventionId: s.lit("king-zone@1"), shelterConventionId: s.lit("king-shelter@1") }),
} as const;
const range = s.obj({ start: s.nat, count: s.nat, total: s.nat, next: s.nullable(s.nat) });
export type InspectorDetailOccurrence = InspectorDetailMember & { readonly ordinal: number; readonly sourceOrdinal: number };
interface InspectorDetailEnvelope {
  readonly sourceProjection: (typeof INSPECTOR_DETAIL_SOURCES)[InspectorDetailKind];
  readonly context: ReturnType<(typeof CONTEXTS)[InspectorDetailKind]>;
  readonly scope: InspectorDetailScope;
  readonly range: ReturnType<typeof range>;
  readonly fullSourceTotal: number;
  readonly members: readonly InspectorDetailOccurrence[];
}
export type InspectorDetailPayload<K extends InspectorDetailKind = InspectorDetailKind> = InspectorDetailEnvelope & {
  [P in K]: Readonly<{
    sourceProjection: (typeof INSPECTOR_DETAIL_SOURCES)[P];
    context: ReturnType<(typeof CONTEXTS)[P]>;
    scope: P extends "square_control" ? ReturnType<typeof CONTROL_SCOPE>
      : P extends "defender_exposure" ? ExposureDetailScope : ReturnType<typeof WHOLE>;
    range: ReturnType<typeof range>;
    fullSourceTotal: number;
    members: readonly (Extract<InspectorDetailMember, { kind: MembersByDetail[P] }> & { readonly ordinal: number; readonly sourceOrdinal: number })[];
  }>
}[K];
const fail = (message: string): never => { throw new TypeError(`Inspector detail: ${message}`); };

export function parseInspectorDetailScope(kind: InspectorDetailKind, value: unknown): InspectorDetailScope {
  if (kind === "defender_exposure") return EXPOSURE_DETAIL_SCOPE(value, "detail scope");
  return kind === "square_control" ? CONTROL_SCOPE(value, "detail scope") : WHOLE(value, "detail scope");
}
const parseMember = s.union("kind", MEMBER_PARSERS);
function checkedMember(kind: InspectorDetailKind, candidate: unknown): InspectorDetailMember {
  const result = parseMember(candidate, "detail member");
  if (!(MEMBER_KINDS[kind] as readonly string[]).includes(result.kind)) return fail("foreign member kind");
  if (result.kind === "ray" && result.value.comparison !== undefined
    && (result.value.comparison.frontRole !== result.value.blocker.occupant.role || result.value.comparison.backRole !== result.value.target.occupant.role)) fail("ray comparison roles differ");
  if (result.kind === "defender_duty") {
    const v = result.value;
    if (v.defender.piece.color !== v.target.piece.color || v.defender.square === v.target.square || v.target.piece.role === "king"
      || v.coDefenders.some(other => other.piece.color !== v.target.piece.color || other.square === v.defender.square)
      || new Set(v.coDefenders.map(other => other.square)).size !== v.coDefenders.length) fail("inconsistent defender duty");
  }
  if (result.kind === "control_relation" && result.value.color !== result.value.controller.piece.color) fail("controller color differs");
  if ((result.kind === "destination_membership" || result.kind === "destinations_empty_piece") && result.value.color !== result.value.piece.occupant.color) fail("piece color differs");
  if (result.kind === "destination_membership" && (!result.value.legal || result.value.localNonLosing && !result.value.legal)) fail("non-legal destination membership");
  if (result.kind === "destination_event_membership") {
    const m = result.value.membership;
    if (!DESTINATION_DETAIL_SETS.some(field => m[field]) || m.legalGained !== (m.legalAfter && !m.legalBefore) || m.legalLost !== (m.legalBefore && !m.legalAfter)
      || m.safeGained !== (m.safeAfter && !m.safeBefore) || m.safeLost !== (m.safeBefore && !m.safeAfter)
      || m.safeBefore && !m.legalBefore || m.safeAfter && !m.legalAfter) fail("inconsistent destination delta");
  }
  return result;
}

/** Strict shared operand parser. Shape/coherence is not source authority or permission. */
export function parseInspectorDetailPayload<K extends InspectorDetailKind>(kind: K, value: unknown): InspectorDetailPayload<K> {
  const parse = s.obj({ sourceProjection: s.lit(INSPECTOR_DETAIL_SOURCES[kind]), context: CONTEXTS[kind],
    scope: (v, _label) => parseInspectorDetailScope(kind, v), range, fullSourceTotal: s.nat,
    members: s.arr(s.obj({ ordinal: s.nat, sourceOrdinal: s.nat, kind: s.str, value: (v) => v }), { max: 8 }) });
  const parsed = parse(value, "detail payload"), r = parsed.range;
  if (!Number.isSafeInteger(r.start + r.count) || r.start + r.count > r.total || r.count !== parsed.members.length
    || r.count === 0 && (r.total !== 0 || r.start !== 0) || r.count > 0 && r.start >= r.total
    || r.next !== (r.start + r.count === r.total ? null : r.start + r.count) || parsed.fullSourceTotal < r.total
    || parsed.scope.kind === "whole" && parsed.fullSourceTotal !== r.total
    || parsed.scope.kind === "control_target" && r.total === 0) fail("invalid range");
  let prior = -1;
  const members = parsed.members.map((raw, index) => {
    const member = checkedMember(kind, { kind: raw.kind, value: raw.value });
    if (raw.ordinal !== r.start + index || raw.sourceOrdinal <= prior || raw.sourceOrdinal >= parsed.fullSourceTotal) fail("invalid member ordinal");
    if (parsed.scope.kind === "whole" && raw.sourceOrdinal !== raw.ordinal) fail("whole-scope ordinal differs");
    prior = raw.sourceOrdinal;
    if (parsed.scope.kind === "control_target") {
      const scope = parsed.scope;
      if (member.kind !== "control_relation" && member.kind !== "control_empty_target" && member.kind !== "control_unavailable") fail("foreign focused member");
      if (!("color" in member.value) || member.value.color !== scope.color || !("mode" in member.value) || member.value.mode !== scope.mode
        || "target" in member.value && member.value.target !== scope.target) fail("focused member differs from scope");
    }
    if (member.kind === "destination_event_context" && JSON.stringify(member.value) !== JSON.stringify({
      color: (parsed.context as PieceDestinationsEvent).color, piece: (parsed.context as PieceDestinationsEvent).piece,
      moved: (parsed.context as PieceDestinationsEvent).moved, zeroSafe: (parsed.context as PieceDestinationsEvent).zeroSafe,
    })) fail("destination context differs");
    return Object.freeze({ ...member, ordinal: raw.ordinal, sourceOrdinal: raw.sourceOrdinal });
  });
  if (kind === "defender_exposure") assertExposureDetailPage(parsed.context as ReturnType<typeof parseExposureDetailContext>,
    parsed.scope as ExposureDetailScope, r, members as readonly (ExchangeDetailMember & { readonly ordinal: number })[]);
  return Object.freeze({ ...parsed, members: Object.freeze(members) }) as InspectorDetailPayload<K>;
}

/** Complete source-order expansion. Never runs another collector or rewrites source values. */
export function inspectorDetailMembers<K extends InspectorDetailKind>(kind: K, source: InspectorDetailSources[K]): {
  readonly context: InspectorDetailPayload<K>["context"]; readonly members: readonly InspectorDetailMember[];
} {
  if (isFoundationDetailKind(kind)) {
    return foundationDetailMembers(kind, source as FoundationDetailSources[FoundationDetailKind]) as {
      readonly context: InspectorDetailPayload<K>["context"]; readonly members: readonly InspectorDetailMember[];
    };
  }
  const members: InspectorDetailMember[] = [];
  const add = (candidate: InspectorDetailMember) => { members.push(checkedMember(kind, candidate)); };
  let context: unknown;
  switch (kind) {
    case "defender_exposure": {
      const { kind: _kind, captures, ...originalContext } = source as AvailableDefenderExposureOperands;
      context = { ...originalContext, captureCount: captures.length };
      captures.forEach((capture, index) => members.push(...exchangeDetailMembers(capture, index)));
      break;
    }
    case "rays": { const value = source as RayClassificationReading; context = { fen: value.fen }; for (const ray of value.rays) add({ kind: "ray", value: ray }); break; }
    case "defender_duties": { const value = source as DefenderDutyReading; context = { fen: value.fen }; for (const duty of value.duties) add({ kind: "defender_duty", value: duty }); break; }
    case "square_control": {
      const value = source as SquareControlReading; context = { fen: value.fen };
      for (const entry of value.colors) for (const [mode, state] of [["geometric", { kind: "available" as const, squares: entry.pseudo }], ["legal", entry.legal]] as const) {
        if (state.kind === "unavailable") { add({ kind: "control_unavailable", value: { color: entry.color, mode: "legal", reason: state.reason } }); continue; }
        for (const target of state.squares) {
          if (target.controllers.length === 0) add({ kind: "control_empty_target", value: { color: entry.color, mode, target: target.target } });
          for (const controller of target.controllers) add({ kind: "control_relation", value: { color: entry.color, mode, target: target.target, controller } });
        }
      }
      break;
    }
    case "piece_destinations": {
      const value = source as PieceDestinationsReading; context = { fen: value.fen, conventionId: value.conventionId };
      for (const entry of value.colors) {
        if (entry.kind === "unavailable") { add({ kind: "destinations_unavailable", value: entry }); continue; }
        if (entry.pieces.length === 0) add({ kind: "destinations_empty_color", value: { kind: "available", color: entry.color, pieces: [] } });
        for (const piece of entry.pieces) {
          const targets = [...new Set([...piece.legal, ...piece.localNonLosing])];
          if (targets.length === 0) add({ kind: "destinations_empty_piece", value: { color: entry.color, piece: piece.piece } });
          for (const target of targets) add({ kind: "destination_membership", value: { color: entry.color, piece: piece.piece, target, legal: piece.legal.includes(target), localNonLosing: piece.localNonLosing.includes(target) } });
        }
      }
      break;
    }
    case "destination_changes": {
      const value = source as PieceDestinationsEvent;
      context = { beforeFen: value.beforeFen, moveUci: value.moveUci, afterFen: value.afterFen, color: value.color, piece: value.piece, moved: value.moved, zeroSafe: value.zeroSafe };
      add({ kind: "destination_event_context", value: { color: value.color, piece: value.piece, moved: value.moved, zeroSafe: value.zeroSafe } });
      for (const target of [...new Set(DESTINATION_DETAIL_SETS.flatMap(field => [...value[field]]))].sort()) {
        const membership = { legalBefore: value.legalBefore.includes(target), legalAfter: value.legalAfter.includes(target), legalGained: value.legalGained.includes(target),
          legalLost: value.legalLost.includes(target), safeBefore: value.safeBefore.includes(target), safeAfter: value.safeAfter.includes(target),
          safeGained: value.safeGained.includes(target), safeLost: value.safeLost.includes(target) };
        add({ kind: "destination_event_membership", value: { target, membership } });
      }
      break;
    }
    case "king_zone": {
      const value = source as KingZoneReading; context = { fen: value.fen, zoneConventionId: value.zoneConventionId, shelterConventionId: value.shelterConventionId };
      for (const state of value.kings) {
        for (const square of state.zone) add({ kind: "king_zone_member", value: { king: state.king, square } });
        for (const [group, participants] of [["attacker", state.attackers], ["defender", state.defenders]] as const) {
          if (participants.length === 0) add({ kind: "king_empty_group", value: { king: state.king, group } });
          for (const participant of participants) for (const square of participant.zoneSquares) add({ kind: "king_zone_relation", value: { king: state.king, group, participant: { square: participant.square, piece: participant.piece }, square } });
        }
        for (const shelter of state.shelter) add({ kind: "king_shelter", value: { king: state.king, shelter } });
        if (state.shelter.length === 0) add({ kind: "king_empty_group", value: { king: state.king, group: "shelter" } });
        if (state.escapes.kind === "unavailable") add({ kind: "king_escapes_unavailable", value: { king: state.king, escapes: state.escapes } });
        else if (state.escapes.squares.length === 0) add({ kind: "king_escapes_empty", value: { king: state.king, escapes: { kind: "available", squares: [] } } });
        else for (const square of state.escapes.squares) add({ kind: "king_escape", value: { king: state.king, square } });
      }
      break;
    }
    default: { const exhaustive: never = kind; throw new TypeError(String(exhaustive)); }
  }
  return { context: CONTEXTS[kind](context, "detail source context") as InspectorDetailPayload<K>["context"], members: Object.freeze(members) };
}

const side = (color: Color) => color === "white" ? "White" : "Black";
const pieceText = (piece: Piece, square: string) => `${side(piece.color)}'s ${piece.role} on ${square}${piece.promoted === undefined ? "" : piece.promoted ? " (marked promoted)" : " (not marked promoted)"}`;
const placedText = (value: { readonly piece: Piece; readonly square: string }) => pieceText(value.piece, value.square);
const yes = (value: boolean) => value ? "yes" : "no";
const RAY_LABELS = { absolute_pin: "absolute pin", relative_pin: "relative pin", skewer: "skewer", xray_attack: "X-ray attack", xray_defense: "X-ray defence" } as const;

/** One deterministic sentence shared by the factory's page fitting and registered rendering. */
export function renderInspectorDetail(payload: InspectorDetailEnvelope): string {
  const scope = payload.scope.kind !== "control_target" ? "" : ` for ${side(payload.scope.color)}'s ${payload.scope.mode === "legal" ? "legal turn-clone" : "geometric"} control at ${payload.scope.target}`;
  const r = payload.range;
  const originalHeading = r.count === 0 ? `No members in this complete source view${scope} (full source: ${payload.fullSourceTotal}).`
    : `Details ${r.start + 1}–${r.start + r.count} of ${r.total}${scope} (full source: ${payload.fullSourceTotal}).`;
  const sentences = payload.members.map(member => {
    if (isFoundationDetailMember(member)) return renderFoundationDetailMember(member);
    switch (member.kind) {
      case "ray": { const v = member.value; return `${RAY_LABELS[v.kind]}: ${placedText(v.slider)}, ${pieceText(v.blocker.occupant, v.blocker.square)}, ${pieceText(v.target.occupant, v.target.square)}. Ray squares: ${v.raySquares.join(", ") || "none"}.${v.comparison === undefined ? "" : ` Declared material comparison: ${v.comparison.frontRole} ${v.comparison.frontValue}, ${v.comparison.backRole} ${v.comparison.backValue}; not engine evaluation.`}`; }
      case "defender_duty": { const v = member.value; return `${placedText(v.defender)} geometrically defends ${placedText(v.target)}; other recorded defenders: ${v.coDefenders.map(placedText).join(", ") || "none"}. This is not legal recapture advice.`; }
      case "control_relation": { const v = member.value; return `${placedText(v.controller)} controls ${v.target} in the ${v.mode === "geometric" ? "geometric" : "legal turn-clone, en passant cleared"} set.`; }
      case "control_empty_target": { const v = member.value; return `${side(v.color)} has no ${v.mode === "geometric" ? "geometric" : "legal turn-clone, en passant cleared"} controller at ${v.target}.`; }
      case "control_unavailable": return `${side(member.value.color)}'s legal control is unavailable because its turn clone is invalid.`;
      case "destinations_unavailable": return `${side(member.value.color)}'s destinations are unavailable because its turn clone is invalid.`;
      case "destinations_empty_color": return `No pieces are recorded in ${side(member.value.color)}'s destination reading.`;
      case "destinations_empty_piece": return `${pieceText(member.value.piece.occupant, member.value.piece.square)} has no recorded legal or local non-losing exchange destination.`;
      case "destination_membership": { const v = member.value; return `${pieceText(v.piece.occupant, v.piece.square)} to ${v.target}: legal set ${yes(v.legal)}, local non-losing exchange set ${yes(v.localNonLosing)}. Neither set recommends a move.`; }
      case "destination_event_context": { const v = member.value; return `${side(v.color)}'s ${v.piece.before.role} on ${v.piece.before.square} before, ${v.piece.after.role} on ${v.piece.after.square} after: moved ${yes(v.moved)}; lost its last local non-losing exchange destination ${yes(v.zeroSafe)}.`; }
      case "destination_event_membership": {
        const v = member.value, c = payload.context as Pick<PieceDestinationsEvent, "color" | "piece">, m = v.membership;
        return `${side(c.color)}'s ${c.piece.before.role} on ${c.piece.before.square} before, ${c.piece.after.role} on ${c.piece.after.square} after; ${v.target}: legal before/after ${yes(m.legalBefore)}/${yes(m.legalAfter)}, gained/lost ${yes(m.legalGained)}/${yes(m.legalLost)}; local non-losing exchange before/after ${yes(m.safeBefore)}/${yes(m.safeAfter)}, gained/lost ${yes(m.safeGained)}/${yes(m.safeLost)}. Neither set recommends a move.`;
      }
      case "king_zone_member": return `${member.value.square} belongs to the declared zone of ${placedText(member.value.king)}.`;
      case "king_zone_relation": { const v = member.value; return `${placedText(v.participant)} is a recorded ${v.group} of ${placedText(v.king)}'s zone at ${v.square}.`; }
      case "king_empty_group": return `${placedText(member.value.king)} has no recorded ${member.value.group} in this declared zone.`;
      case "king_shelter": return `${placedText(member.value.shelter)} is in the declared shelter of ${placedText(member.value.king)}.`;
      case "king_escape": return `${placedText(member.value.king)} has an adjacent legal turn-clone escape to ${member.value.square} (en passant cleared).`;
      case "king_escapes_empty": return `${placedText(member.value.king)} has no adjacent legal turn-clone escape (en passant cleared), not a claim about every legal king move.`;
      case "king_escapes_unavailable": return `${placedText(member.value.king)}'s adjacent legal escapes are unavailable because its turn clone is invalid (en passant cleared).`;
      default: { const exhaustive: never = member; throw new TypeError(String(exhaustive)); }
    }
  });
  const sourceKind = (Object.keys(INSPECTOR_DETAIL_SOURCES) as InspectorDetailKind[]).find(kind => INSPECTOR_DETAIL_SOURCES[kind] === payload.sourceProjection);
  const sourceContext = sourceKind === "defender_exposure" ? renderExposureDetailContext(payload.context as ReturnType<typeof parseExposureDetailContext>)
    : sourceKind !== undefined && isFoundationDetailKind(sourceKind) ? renderFoundationDetailContext(sourceKind, payload.context) : "";
  const heading = sourceKind !== undefined && isFoundationDetailKind(sourceKind)
    ? r.count === 0 ? "No expanded members in this complete source view."
      : `Expanded members ${r.start + 1}–${r.start + r.count} of ${r.total}; complete expanded source member total ${payload.fullSourceTotal}.`
    : originalHeading;
  return [heading, sourceContext, ...sentences].filter(Boolean).join(" ");
}

export function inspectorDetailSquares(payload: InspectorDetailEnvelope): readonly SquareName[] {
  const squares = payload.members.flatMap(member => {
    switch (member.kind) {
      case "ray": return [member.value.slider.square, member.value.blocker.square, member.value.target.square];
      case "defender_duty": return [member.value.defender.square, member.value.target.square];
      case "control_relation": return [member.value.controller.square, member.value.target];
      case "control_empty_target": return [member.value.target];
      case "destination_membership": return [member.value.piece.square, member.value.target];
      case "destinations_empty_piece": return [member.value.piece.square];
      case "destination_event_context": return [member.value.piece.before.square, member.value.piece.after.square];
      case "destination_event_membership": { const c = payload.context as Pick<PieceDestinationsEvent, "piece">; return [c.piece.before.square, c.piece.after.square, member.value.target]; }
      case "king_zone_member": case "king_escape": return [member.value.king.square, member.value.square];
      case "king_zone_relation": return [member.value.king.square, member.value.participant.square, member.value.square];
      case "king_shelter": return [member.value.king.square, member.value.shelter.square];
      default: return [];
    }
  });
  return Object.freeze([...new Set(squares)]);
}

export class InspectorDetailLimitError extends TypeError {
  constructor(readonly sourceOrdinal: number, readonly exceeded: readonly ("facts" | "words" | "marks" | "arrows")[],
    readonly ordinal: number, readonly selectedTotal: number, readonly fullSourceTotal: number) {
    super("Inspector detail member exceeds the unchanged module budget");
  }
}
export class InspectorDetailSelectionError extends TypeError {}

/** Source and factory own all members; caller selects only a closed scope and start. */
export function buildInspectorDetailPayload<K extends InspectorDetailKind>(kind: K, source: InspectorDetailSources[K], scopeValue: unknown, startValue: unknown): InspectorDetailPayload<K> {
  const scope = parseInspectorDetailScope(kind, scopeValue), start = s.nat(startValue, "detail start");
  if (kind === "defender_exposure" && !hasExposureScope(source as AvailableDefenderExposureOperands, scope as ExposureDetailScope)) {
    throw new InspectorDetailSelectionError("Inspector detail scope is outside the original exchange");
  }
  const complete = inspectorDetailMembers(kind, source), fullSourceTotal = complete.members.length;
  const selected = complete.members.map((member, sourceOrdinal) => ({ ...member, sourceOrdinal })).filter(member => {
    if (scope.kind === "whole") return true;
    if (scope.kind !== "control_target") return isFoundationDetailMember(member) && exposureMemberMatches(member, scope);
    return (member.kind === "control_relation" || member.kind === "control_empty_target" || member.kind === "control_unavailable")
      && member.value.color === scope.color && member.value.mode === scope.mode && (!("target" in member.value) || member.value.target === scope.target);
  });
  if (start >= selected.length && (start !== 0 || selected.length !== 0)) throw new InspectorDetailSelectionError("Inspector detail start is outside the selected source");
  const envelope = (count: number) => parseInspectorDetailPayload(kind, { sourceProjection: INSPECTOR_DETAIL_SOURCES[kind], context: complete.context,
    scope, fullSourceTotal, range: { start, count, total: selected.length, next: start + count === selected.length ? null : start + count },
    members: selected.slice(start, start + count).map((member, index) => ({ ...member, ordinal: start + index })) });
  if (selected.length === 0) return envelope(0);
  const limits = modulePolicy("full_inspector").budgets;
  let result: InspectorDetailPayload<K> | undefined;
  for (let count = 1; count <= Math.min(8, selected.length - start); count++) {
    const payload = envelope(count), words = renderInspectorDetail(payload).normalize("NFKC").match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
    const marks = inspectorDetailSquares(payload).length;
    const exceeded = [...(words > limits.maxWords ? ["words" as const] : []), ...(limits.maxMarks !== null && marks > limits.maxMarks ? ["marks" as const] : []), ...(limits.maxFacts < 1 ? ["facts" as const] : [])];
    if (exceeded.length > 0) {
      if (result === undefined) throw new InspectorDetailLimitError(selected[start]!.sourceOrdinal, Object.freeze(exceeded), start, selected.length, fullSourceTotal);
      break;
    }
    result = payload;
  }
  return result!;
}
