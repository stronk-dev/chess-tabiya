// DISPOSABLE D3802 closed member-schema and source-reconstruction controls.
// These parsed objects are NOT production evidence, factories, receipts or renderers.
import assert from "node:assert/strict";
import type { Color, SquareName } from "chessops/types";
import type { RayClassification, RayClassificationReading, DefenderDuty, DefenderDutyReading } from "../../packages/runtime/src/tactics.js";
import type { SquareController, SquareControlReading } from "../../packages/runtime/src/square-control.js";
import type { ColorPieceDestinations, PieceDestinations, PieceDestinationsReading, PieceDestinationsEvent } from "../../packages/runtime/src/mobility.js";
import type { KingZoneReading, KingZoneState } from "../../packages/runtime/src/king-state.js";
import { assertDeclaredEvidence, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";

type Membership = Pick<PieceDestinationsEvent, "legalBefore" | "legalAfter" | "legalGained" | "legalLost" | "safeBefore" | "safeAfter" | "safeGained" | "safeLost">;
const SETS = ["legalBefore", "legalAfter", "legalGained", "legalLost", "safeBefore", "safeAfter", "safeGained", "safeLost"] as const;
export interface DetailValues {
  ray: RayClassification;
  defender_duty: DefenderDuty;
  control_relation: { color: Color; mode: "geometric" | "legal"; target: SquareName; controller: SquareController };
  control_empty_target: { color: Color; mode: "geometric" | "legal"; target: SquareName };
  control_unavailable: { color: Color; mode: "legal"; reason: "invalid_turn_clone" };
  destinations_unavailable: Extract<ColorPieceDestinations, { kind: "unavailable" }>;
  destinations_empty_color: { kind: "available"; color: Color; pieces: readonly [] };
  destinations_empty_piece: { color: Color; piece: PieceDestinations["piece"] };
  destination_membership: { color: Color; piece: PieceDestinations["piece"]; target: SquareName; legal: boolean; localNonLosing: boolean };
  destination_event_context: Pick<PieceDestinationsEvent, "color" | "piece" | "moved" | "zeroSafe">;
  destination_event_membership: { target: SquareName; membership: { [Key in keyof Membership]: boolean } };
  king_zone_member: { king: KingZoneState["king"]; square: SquareName };
  king_zone_relation: { king: KingZoneState["king"]; participant: SquareController; square: SquareName; group: "attacker" | "defender" };
  king_empty_group: { king: KingZoneState["king"]; group: "attacker" | "defender" | "shelter" };
  king_shelter: { king: KingZoneState["king"]; shelter: SquareController };
  king_escapes_unavailable: { king: KingZoneState["king"]; escapes: Extract<KingZoneState["escapes"], { kind: "unavailable" }> };
  king_escapes_empty: { king: KingZoneState["king"]; escapes: { kind: "available"; squares: readonly [] } };
  king_escape: { king: KingZoneState["king"]; square: SquareName };
}
export type TypedMember<Kind extends keyof DetailValues = keyof DetailValues> = { [Key in Kind]: { kind: Key; value: DetailValues[Key] } }[Kind];
export interface DetailContexts {
  "rules.tactic.reading.ray_classification@1": Pick<RayClassificationReading, "fen">;
  "rules.tactic.reading.defender_duty_set@1": Pick<DefenderDutyReading, "fen">;
  "rules.square.reading.control@1": Pick<SquareControlReading, "fen">;
  "rules.mobility.reading.piece_destinations@1": Pick<PieceDestinationsReading, "fen" | "conventionId">;
  "rules.mobility.event.piece_destinations@1": Pick<PieceDestinationsEvent, "beforeFen" | "moveUci" | "afterFen" | "color" | "piece" | "moved" | "zeroSafe">;
  "rules.king.reading.zone_state@1": Pick<KingZoneReading, "fen" | "zoneConventionId" | "shelterConventionId">;
}
interface MembersBySource {
  "rules.tactic.reading.ray_classification@1": TypedMember<"ray">;
  "rules.tactic.reading.defender_duty_set@1": TypedMember<"defender_duty">;
  "rules.square.reading.control@1": TypedMember<"control_relation" | "control_empty_target" | "control_unavailable">;
  "rules.mobility.reading.piece_destinations@1": TypedMember<"destinations_unavailable" | "destinations_empty_color" | "destinations_empty_piece" | "destination_membership">;
  "rules.mobility.event.piece_destinations@1": TypedMember<"destination_event_context" | "destination_event_membership">;
  "rules.king.reading.zone_state@1": TypedMember<"king_zone_member" | "king_zone_relation" | "king_empty_group" | "king_shelter" | "king_escapes_unavailable" | "king_escapes_empty" | "king_escape">;
}
export type DraftDetailPayload = { [Source in keyof DetailContexts]: {
  sourceProjection: Source; context: DetailContexts[Source]; fullSourceTotal: number;
  scope: { kind: "whole" } | (Source extends "rules.square.reading.control@1" ? {
    kind: "control_target"; color: Color; mode: "geometric" | "legal"; target: SquareName } : never);
  range: { start: number; count: number; total: number; next: number | null };
  members: readonly (MembersBySource[Source] & { ordinal: number; sourceOrdinal: number })[];
} }[keyof DetailContexts];
export const MEMBER_SOURCE: Readonly<Record<keyof DetailValues, string>> = {
  ray: "rules.tactic.reading.ray_classification@1", defender_duty: "rules.tactic.reading.defender_duty_set@1",
  control_relation: "rules.square.reading.control@1", control_empty_target: "rules.square.reading.control@1", control_unavailable: "rules.square.reading.control@1",
  destinations_unavailable: "rules.mobility.reading.piece_destinations@1", destinations_empty_color: "rules.mobility.reading.piece_destinations@1",
  destinations_empty_piece: "rules.mobility.reading.piece_destinations@1", destination_membership: "rules.mobility.reading.piece_destinations@1",
  destination_event_context: "rules.mobility.event.piece_destinations@1", destination_event_membership: "rules.mobility.event.piece_destinations@1",
  king_zone_member: "rules.king.reading.zone_state@1", king_zone_relation: "rules.king.reading.zone_state@1", king_empty_group: "rules.king.reading.zone_state@1",
  king_shelter: "rules.king.reading.zone_state@1", king_escapes_unavailable: "rules.king.reading.zone_state@1", king_escapes_empty: "rules.king.reading.zone_state@1", king_escape: "rules.king.reading.zone_state@1",
};
function record(value: unknown): Record<string, unknown> { assert(typeof value === "object" && value !== null && !Array.isArray(value)); return value as Record<string, unknown>; }
function exact(value: unknown, required: readonly string[], optional: readonly string[] = []) {
  const row = record(value); assert(required.every(key => Object.hasOwn(row, key)));
  assert(Object.keys(row).every(key => required.includes(key) || optional.includes(key))); return row;
}
const oneOf = (value: unknown, choices: readonly unknown[]) => assert(choices.includes(value));
const square = (value: unknown) => assert(typeof value === "string" && /^[a-h][1-8]$/u.test(value));
const color = (value: unknown) => oneOf(value, ["white", "black"]);
const role = (value: unknown) => oneOf(value, ["pawn", "knight", "bishop", "rook", "queen", "king"]);
const bool = (value: unknown) => assert(typeof value === "boolean");
const list = (value: unknown, validate: (child: unknown) => void) => { assert(Array.isArray(value)); for (const child of value) validate(child); };
function piece(value: unknown) { const row = exact(value, ["color", "role"], ["promoted"]); color(row.color); role(row.role); if (Object.hasOwn(row, "promoted")) bool(row.promoted); }
function placed(value: unknown, field: "piece" | "occupant" = "piece") { const row = exact(value, ["square", field]); square(row.square); piece(row[field]); }
function king(value: unknown) { placed(value); assert.equal(record(record(value).piece).role, "king"); }
function empty(value: unknown) { assert(Array.isArray(value) && value.length === 0); }

export function parseDraftMember(projection: string, candidate: unknown): TypedMember {
  const member = exact(candidate, ["kind", "value"]);
  assert(typeof member.kind === "string" && Object.hasOwn(MEMBER_SOURCE, member.kind));
  assert.equal(MEMBER_SOURCE[member.kind as keyof DetailValues], projection, "cross-source detail member");
  const value = record(member.value);
  switch (member.kind) {
    case "ray": {
      exact(value, ["slider", "blocker", "target", "raySquares", "kind"], ["comparison"]);
      placed(value.slider); placed(value.blocker, "occupant"); placed(value.target, "occupant"); list(value.raySquares, square);
      oneOf(value.kind, ["absolute_pin", "relative_pin", "skewer", "xray_attack", "xray_defense"]);
      if (Object.hasOwn(value, "comparison")) {
        const comparison = exact(value.comparison, ["frontRole", "backRole", "frontValue", "backValue"]); role(comparison.frontRole); role(comparison.backRole);
        for (const field of ["frontValue", "backValue"]) assert(typeof comparison[field] === "number" && Number.isFinite(comparison[field]) && comparison[field] >= 0);
      }
      break;
    }
    case "defender_duty": exact(value, ["conventionId", "defender", "target", "coDefenders"]); assert.equal(value.conventionId, "defence-duty@1"); placed(value.defender); placed(value.target); list(value.coDefenders, child => placed(child)); break;
    case "control_relation": case "control_empty_target":
      exact(value, ["color", "mode", "target", ...(member.kind === "control_relation" ? ["controller"] : [])]); color(value.color); oneOf(value.mode, ["geometric", "legal"]); square(value.target);
      if (member.kind === "control_relation") { placed(value.controller); assert.equal(record(record(value.controller).piece).color, value.color); } break;
    case "control_unavailable": exact(value, ["color", "mode", "reason"]); color(value.color); assert.equal(value.mode, "legal"); assert.equal(value.reason, "invalid_turn_clone"); break;
    case "destinations_unavailable": case "destinations_empty_color":
      exact(value, ["kind", "color", "pieces", ...(member.kind === "destinations_unavailable" ? ["reason"] : [])]); color(value.color); empty(value.pieces);
      assert.equal(value.kind, member.kind === "destinations_unavailable" ? "unavailable" : "available");
      if (member.kind === "destinations_unavailable") assert.equal(value.reason, "invalid_turn_clone"); break;
    case "destinations_empty_piece": case "destination_membership":
      exact(value, ["color", "piece", ...(member.kind === "destination_membership" ? ["target", "legal", "localNonLosing"] : [])]); color(value.color); placed(value.piece, "occupant");
      assert.equal(record(record(value.piece).occupant).color, value.color);
      if (member.kind === "destination_membership") { square(value.target); bool(value.legal); bool(value.localNonLosing); assert(value.legal === true || value.localNonLosing === true); assert(value.localNonLosing !== true || value.legal === true); } break;
    case "destination_event_context": {
      exact(value, ["color", "piece", "moved", "zeroSafe"]); color(value.color); bool(value.moved); bool(value.zeroSafe);
      const unit = exact(value.piece, ["before", "after"]); for (const field of ["before", "after"]) { const side = exact(unit[field], ["square", "role"]); square(side.square); role(side.role); } break;
    }
    case "destination_event_membership": {
      exact(value, ["target", "membership"]); square(value.target); const membership = exact(value.membership, SETS);
      for (const field of SETS) bool(membership[field]);
      assert(SETS.some(field => membership[field] === true));
      assert.equal(membership.legalGained, membership.legalAfter === true && membership.legalBefore === false);
      assert.equal(membership.legalLost, membership.legalBefore === true && membership.legalAfter === false);
      assert.equal(membership.safeGained, membership.safeAfter === true && membership.safeBefore === false);
      assert.equal(membership.safeLost, membership.safeBefore === true && membership.safeAfter === false);
      assert(membership.safeBefore !== true || membership.legalBefore === true); assert(membership.safeAfter !== true || membership.legalAfter === true); break;
    }
    case "king_zone_member": case "king_escape": exact(value, ["king", "square"]); king(value.king); square(value.square); break;
    case "king_zone_relation": exact(value, ["king", "participant", "square", "group"]); king(value.king); placed(value.participant); square(value.square); oneOf(value.group, ["attacker", "defender"]); break;
    case "king_empty_group": exact(value, ["king", "group"]); king(value.king); oneOf(value.group, ["attacker", "defender", "shelter"]); break;
    case "king_shelter": exact(value, ["king", "shelter"]); king(value.king); placed(value.shelter); break;
    case "king_escapes_unavailable": case "king_escapes_empty": {
      exact(value, ["king", "escapes"]); king(value.king);
      const escapes = exact(value.escapes, ["kind", "squares", ...(member.kind === "king_escapes_unavailable" ? ["reason"] : [])]); empty(escapes.squares);
      assert.equal(escapes.kind, member.kind === "king_escapes_unavailable" ? "unavailable" : "available");
      if (member.kind === "king_escapes_unavailable") assert.equal(escapes.reason, "invalid_turn_clone"); break;
    }
    default: assert.fail("unknown member");
  }
  return structuredClone(candidate) as TypedMember;
}
type ModelRow = { kind: string; value: unknown };
/** Rebuild the complete operand image, not a schema that blesses any well-shaped caller row. */
export function verifyDraftMembers(source: DeclaredEvidence<unknown>, input: readonly ModelRow[]) {
  assertDeclaredEvidence(source);
  const projection = `${source.projection.id}@${source.projection.version}`;
  const rows = input.map(row => parseDraftMember(projection, { kind: row.kind, value: row.value }));
  const grouped: { [Kind in keyof DetailValues]: readonly DetailValues[Kind][] } = {
    ray: rows.filter(row => row.kind === "ray").map(row => row.value),
    defender_duty: rows.filter(row => row.kind === "defender_duty").map(row => row.value),
    control_relation: rows.filter(row => row.kind === "control_relation").map(row => row.value),
    control_empty_target: rows.filter(row => row.kind === "control_empty_target").map(row => row.value),
    control_unavailable: rows.filter(row => row.kind === "control_unavailable").map(row => row.value),
    destinations_unavailable: rows.filter(row => row.kind === "destinations_unavailable").map(row => row.value),
    destinations_empty_color: rows.filter(row => row.kind === "destinations_empty_color").map(row => row.value),
    destinations_empty_piece: rows.filter(row => row.kind === "destinations_empty_piece").map(row => row.value),
    destination_membership: rows.filter(row => row.kind === "destination_membership").map(row => row.value),
    destination_event_context: rows.filter(row => row.kind === "destination_event_context").map(row => row.value),
    destination_event_membership: rows.filter(row => row.kind === "destination_event_membership").map(row => row.value),
    king_zone_member: rows.filter(row => row.kind === "king_zone_member").map(row => row.value),
    king_zone_relation: rows.filter(row => row.kind === "king_zone_relation").map(row => row.value),
    king_empty_group: rows.filter(row => row.kind === "king_empty_group").map(row => row.value),
    king_shelter: rows.filter(row => row.kind === "king_shelter").map(row => row.value),
    king_escapes_unavailable: rows.filter(row => row.kind === "king_escapes_unavailable").map(row => row.value),
    king_escapes_empty: rows.filter(row => row.kind === "king_escapes_empty").map(row => row.value),
    king_escape: rows.filter(row => row.kind === "king_escape").map(row => row.value),
  };
  const take = <Kind extends keyof DetailValues>(kind: Kind): readonly DetailValues[Kind][] => grouped[kind];
  switch (projection) {
    case "rules.tactic.reading.ray_classification@1": assert.deepEqual(take("ray"), (source.payload as RayClassificationReading).rays); break;
    case "rules.tactic.reading.defender_duty_set@1": assert.deepEqual(take("defender_duty"), (source.payload as DefenderDutyReading).duties); break;
    case "rules.square.reading.control@1": {
      const reading = source.payload as SquareControlReading;
      let total = 0;
      for (const entry of reading.colors) for (const [mode, state] of [["geometric", { kind: "available" as const, squares: entry.pseudo }], ["legal", entry.legal]] as const) {
        const selected = rows.filter(row => row.kind.startsWith("control_") && "color" in row.value && "mode" in row.value && row.value.color === entry.color && row.value.mode === mode);
        if (state.kind === "unavailable") { assert.deepEqual(selected, [{ kind: "control_unavailable", value: { color: entry.color, mode: "legal", reason: state.reason } }]); total++; continue; }
        for (const target of state.squares) {
          const matched = selected.filter(row => "target" in row.value && row.value.target === target.target);
          assert.equal(matched.length, Math.max(1, target.controllers.length)); total += matched.length;
          if (target.controllers.length === 0) assert.deepEqual(matched, [{ kind: "control_empty_target", value: { color: entry.color, mode, target: target.target } }]);
          else assert.deepEqual(matched.map(row => (row.value as DetailValues["control_relation"]).controller), target.controllers);
        }
      }
      assert.equal(total, rows.length); break;
    }
    case "rules.mobility.reading.piece_destinations@1": {
      const reading = source.payload as PieceDestinationsReading;
      let total = 0;
      for (const entry of reading.colors) {
        if (entry.kind === "unavailable") { assert.deepEqual(take("destinations_unavailable").filter(row => row.color === entry.color), [entry]); total++; continue; }
        if (entry.pieces.length === 0) { assert.deepEqual(take("destinations_empty_color").filter(row => row.color === entry.color), [entry]); total++; }
        for (const unit of entry.pieces) {
          const matched: readonly DetailValues["destination_membership"][] = take("destination_membership").filter(row => row.color === entry.color && row.piece.square === unit.piece.square);
          if (unit.legal.length === 0 && unit.localNonLosing.length === 0) { assert.deepEqual(take("destinations_empty_piece").filter(row => row.color === entry.color && row.piece.square === unit.piece.square), [{ color: entry.color, piece: unit.piece }]); total++; }
          else { assert.equal(matched.length, new Set([...unit.legal, ...unit.localNonLosing]).size); assert(matched.every(row => { assert.deepEqual(row.piece, unit.piece); return true; })); total += matched.length; }
          assert.deepEqual(matched.filter(row => row.legal).map(row => row.target), unit.legal);
          assert.deepEqual(matched.filter(row => row.localNonLosing).map(row => row.target).sort(), [...unit.localNonLosing].sort());
        }
      }
      assert.equal(total, rows.length); break;
    }
    case "rules.mobility.event.piece_destinations@1": {
      const event = source.payload as PieceDestinationsEvent;
      assert.deepEqual(take("destination_event_context"), [{ color: event.color, piece: event.piece, moved: event.moved, zeroSafe: event.zeroSafe }]);
      assert.equal(event.zeroSafe, event.safeBefore.length > 0 && event.safeAfter.length === 0);
      const memberships = take("destination_event_membership");
      assert.equal(memberships.length, new Set(SETS.flatMap(field => [...event[field]])).size);
      for (const field of SETS) assert.deepEqual(memberships.filter(row => row.membership[field]).map(row => row.target).sort(), [...event[field]].sort());
      assert.equal(rows.length, memberships.length + 1); break;
    }
    case "rules.king.reading.zone_state@1": {
      const reading = source.payload as KingZoneReading;
      assert.equal(reading.zoneConventionId, "king-zone@1"); assert.equal(reading.shelterConventionId, "king-shelter@1");
      let total = 0;
      for (const state of reading.kings) {
        assert.equal(state.color, state.king.piece.color);
        const selected = rows.filter(row => "king" in row.value && row.value.king.square === state.king.square);
        for (const row of selected) { assert("king" in row.value); assert.deepEqual(row.value.king, state.king); } total += selected.length;
        assert.deepEqual(take("king_zone_member").filter(row => row.king.square === state.king.square).map(row => row.square), state.zone);
        for (const [group, participants] of [["attacker", state.attackers], ["defender", state.defenders]] as const) {
          const relations = take("king_zone_relation").filter(row => row.king.square === state.king.square && row.group === group);
          assert.equal(relations.length, participants.reduce((sum, participant) => sum + participant.zoneSquares.length, 0));
          const empties = take("king_empty_group").filter(row => row.king.square === state.king.square && row.group === group);
          assert.equal(empties.length, participants.length === 0 ? 1 : 0);
          for (const participant of participants) {
            const own = relations.filter(row => row.participant.square === participant.square);
            assert(own.every(row => { assert.deepEqual(row.participant, { piece: participant.piece, square: participant.square }); return true; }));
            assert.deepEqual(own.map(row => row.square), participant.zoneSquares);
          }
        }
        assert.deepEqual(take("king_shelter").filter(row => row.king.square === state.king.square).map(row => row.shelter), state.shelter);
        assert.equal(take("king_empty_group").filter(row => row.king.square === state.king.square && row.group === "shelter").length, state.shelter.length === 0 ? 1 : 0);
        const escapes = take("king_escape").filter(row => row.king.square === state.king.square).map(row => row.square);
        assert.deepEqual(escapes, state.escapes.kind === "available" ? state.escapes.squares : []);
        assert.equal(take("king_escapes_empty").filter(row => row.king.square === state.king.square).length, state.escapes.kind === "available" && state.escapes.squares.length === 0 ? 1 : 0);
        assert.deepEqual(take("king_escapes_unavailable").filter(row => row.king.square === state.king.square).map(row => row.escapes), state.escapes.kind === "unavailable" ? [state.escapes] : []);
      }
      assert.equal(total, rows.length); break;
    }
    default: assert.fail("unsupported source");
  }
  return rows;
}
