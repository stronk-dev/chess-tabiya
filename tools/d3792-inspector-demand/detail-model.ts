// D3797 disposable author evidence. These are view models, NOT evidence/projections/receipts.
// Six closed source-specific constructors; no generic JSON viewer or production renderer.
import assert from "node:assert/strict";
import type { Color, SquareName } from "chessops/types";
import type { DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { assertDeclaredEvidence, evidenceValueReceipt, evidenceDigest } from "../../packages/runtime/src/evidence-contract.js";
import type { SquareControlReading } from "../../packages/runtime/src/square-control.js";
import type { PieceDestinations, PieceDestinationsReading, PieceDestinationsEvent } from "../../packages/runtime/src/mobility.js";
import type { KingZoneReading } from "../../packages/runtime/src/king-state.js";
import type { RayClassificationReading, DefenderDutyReading } from "../../packages/runtime/src/tactics.js";
import { moduleDeclaration } from "../../packages/runtime/src/module-registry.js";

export const DETAIL_REFS = Object.freeze([
  "rules.tactic.reading.ray_classification@1", "rules.square.reading.control@1",
  "rules.mobility.reading.piece_destinations@1", "rules.mobility.event.piece_destinations@1",
  "rules.king.reading.zone_state@1", "rules.tactic.reading.defender_duty_set@1",
]);
type Row = { readonly kind: string; readonly ordinal: number; readonly text: string;
  readonly sourceOrdinal: number; readonly squares: readonly string[]; readonly arrows: number; readonly value: unknown };
type Plan = { readonly source: DeclaredEvidence<unknown>; readonly digest: string;
  readonly rows: readonly Row[]; readonly coverage: readonly unknown[]; readonly sourceTotal: number;
  readonly scope: null | { readonly color: Color; readonly mode: "geometric" | "legal"; readonly target: SquareName } };
const admittedPlans = new WeakSet<Plan>();
function immutableCopy(value: unknown): unknown {
  const copy: unknown = structuredClone(value);
  const freeze = (node: unknown): void => {
    if (typeof node !== "object" || node === null) return;
    for (const child of Object.values(node)) freeze(child);
    Object.freeze(node);
  };
  freeze(copy);
  return copy;
}
const piece = (value: { color: string; role: string; promoted?: boolean }, square: string) => `${value.color} ${value.role} on ${square}${value.promoted === undefined ? "" : value.promoted ? " (marked promoted)" : " (not marked promoted)"}`;
const exactKeys = (value: object, allowed: readonly string[]) => assert.deepEqual(Object.keys(value).sort(), [...allowed].sort());

export function detailPlan(source: DeclaredEvidence<unknown>): Plan | undefined {
  assertDeclaredEvidence(source);
  const ref = `${source.projection.id}@${source.projection.version}`;
  if (!DETAIL_REFS.includes(ref)) return undefined;
  const rows: Row[] = [], coverage: unknown[] = [];
  const add = (kind: string, value: unknown, text: string, squares: readonly string[] = [], arrows = 0) => {
    rows.push(Object.freeze({ kind, ordinal: rows.length, sourceOrdinal: rows.length, value: immutableCopy(value), text,
      squares: Object.freeze([...new Set(squares)]), arrows }));
    coverage.push(value);
  };
  switch (ref) {
    case "rules.tactic.reading.ray_classification@1": {
      const value = source.payload as RayClassificationReading;
      exactKeys(value, ["fen", "rays"]);
      for (const ray of value.rays) add("ray", ray,
        `${ray.kind.replaceAll("_", " ")}: ${piece(ray.slider.piece, ray.slider.square)}, ${piece(ray.blocker.occupant, ray.blocker.square)}, ${piece(ray.target.occupant, ray.target.square)}. Ray squares: ${ray.raySquares.join(", ")}.${ray.comparison === undefined ? "" : ` Compared roles ${ray.comparison.frontRole}/${ray.comparison.backRole}, values ${ray.comparison.frontValue}/${ray.comparison.backValue}.`}`,
        [ray.slider.square, ray.blocker.square, ray.target.square], 2);
      assert.deepEqual(coverage, value.rays);
      break;
    }
    case "rules.tactic.reading.defender_duty_set@1": {
      const value = source.payload as DefenderDutyReading;
      exactKeys(value, ["fen", "duties"]);
      for (const duty of value.duties) add("defender_duty", duty,
        `${piece(duty.defender.piece, duty.defender.square)} geometrically defends ${piece(duty.target.piece, duty.target.square)}. Other defenders recorded: ${duty.coDefenders.map(other => piece(other.piece, other.square)).join(", ") || "none"}.`,
        [duty.defender.square, duty.target.square], 1);
      assert.deepEqual(coverage, value.duties);
      break;
    }
    case "rules.square.reading.control@1": {
      const value = source.payload as SquareControlReading;
      exactKeys(value, ["fen", "colors"]);
      for (const entry of value.colors) {
        exactKeys(entry, ["color", "pseudo", "legal"]);
        const states = [{ mode: "geometric", kind: "available", squares: entry.pseudo }, { mode: "legal", ...entry.legal }];
        for (const state of states) {
          if (state.kind === "unavailable") { add("control_unavailable", { color: entry.color, mode: state.mode, reason: "invalid_turn_clone" }, `${entry.color}: legal control is unavailable because this turn clone is invalid.`); continue; }
          for (const target of state.squares) {
            const label = state.mode === "legal" ? "legal turn-clone (en passant cleared)" : "geometric";
            if (target.controllers.length === 0) add("control_empty_target", { color: entry.color, mode: state.mode, target: target.target }, `${entry.color} has no ${label} controller recorded for ${target.target}.`, [target.target]);
            for (const controller of target.controllers) add("control_relation", { color: entry.color, mode: state.mode, target: target.target, controller }, `${piece(controller.piece, controller.square)} controls ${target.target} in the ${label} control set.`, [controller.square, target.target], 1);
          }
          // Reconstruct every original target/controller list, including its ordering and empties.
          const actual = rows.filter(row => row.kind.startsWith("control_") && (row.value as { color: string; mode: string }).color === entry.color && (row.value as { mode: string }).mode === state.mode);
          const rebuilt = state.squares.map(target => ({ target: target.target, controllers: actual.filter(row => row.kind === "control_relation" && (row.value as { target: string }).target === target.target).map(row => (row.value as { controller: unknown }).controller) }));
          assert.deepEqual(rebuilt, state.squares);
        }
      }
      break;
    }
    case "rules.mobility.reading.piece_destinations@1": {
      const value = source.payload as PieceDestinationsReading;
      exactKeys(value, ["fen", "conventionId", "colors"]);
      for (const entry of value.colors) {
        if (entry.kind === "unavailable") { add("destinations_unavailable", entry, `${entry.color}: destinations are unavailable because this turn clone is invalid.`); continue; }
        if (entry.pieces.length === 0) add("destinations_empty_color", entry, `${entry.color}: no pieces are recorded in this destination reading.`);
        for (const unit of entry.pieces) {
          exactKeys(unit, ["piece", "legal", "localNonLosing"]);
          const destinations = [...new Set([...unit.legal, ...unit.localNonLosing])];
          if (destinations.length === 0) add("destinations_empty_piece", { color: entry.color, piece: unit.piece }, `${piece(unit.piece.occupant, unit.piece.square)} has no destination recorded in either set.`, [unit.piece.square]);
          const selected: readonly { color: Color; piece: PieceDestinations["piece"]; target: SquareName; legal: boolean; localNonLosing: boolean }[] = destinations.map(target => ({ color: entry.color, piece: unit.piece, target, legal: unit.legal.includes(target), localNonLosing: unit.localNonLosing.includes(target) }));
          for (const member of selected) add("destination_membership", member, `${piece(unit.piece.occupant, unit.piece.square)} to ${member.target}: legal set ${member.legal ? "yes" : "no"}; local non-losing exchange set ${member.localNonLosing ? "yes" : "no"}.`, [unit.piece.square, member.target], member.legal ? 1 : 0);
          assert.deepEqual(selected.filter(member => member.legal).map(member => member.target), unit.legal);
          assert.deepEqual([...selected.filter(member => member.localNonLosing).map(member => member.target)].sort(), [...unit.localNonLosing].sort());
        }
      }
      break;
    }
    case "rules.mobility.event.piece_destinations@1": {
      const value = source.payload as PieceDestinationsEvent;
      exactKeys(value, ["beforeFen", "moveUci", "afterFen", "color", "piece", "legalBefore", "legalAfter", "legalGained", "legalLost", "safeBefore", "safeAfter", "safeGained", "safeLost", "moved", "zeroSafe"]);
      const fields = ["legalBefore", "legalAfter", "legalGained", "legalLost", "safeBefore", "safeAfter", "safeGained", "safeLost"] as const;
      const destinations = [...new Set(fields.flatMap(field => [...value[field]]))].sort();
      add("destination_event_context", { color: value.color, piece: value.piece, moved: value.moved, zeroSafe: value.zeroSafe }, `${value.color} ${value.piece.before.role}: ${value.piece.before.square} before, ${value.piece.after.square} after; moved ${value.moved ? "yes" : "no"}; lost its last local non-losing exchange destination ${value.zeroSafe ? "yes" : "no"}.`, [value.piece.before.square, value.piece.after.square]);
      const selected = destinations.map(target => ({ target, membership: Object.fromEntries(fields.map(field => [field, value[field].includes(target)])) }));
      for (const member of selected) add("destination_event_membership", member, `${value.color} ${value.piece.before.role} on ${value.piece.before.square} before, ${value.piece.after.role} on ${value.piece.after.square} after; ${member.target}: legal before/after ${member.membership.legalBefore ? "yes" : "no"}/${member.membership.legalAfter ? "yes" : "no"}; legal gained/lost ${member.membership.legalGained ? "yes" : "no"}/${member.membership.legalLost ? "yes" : "no"}; local exchange before/after ${member.membership.safeBefore ? "yes" : "no"}/${member.membership.safeAfter ? "yes" : "no"}; local exchange gained/lost ${member.membership.safeGained ? "yes" : "no"}/${member.membership.safeLost ? "yes" : "no"}.`, [value.piece.before.square, value.piece.after.square, member.target]);
      for (const field of fields) assert.deepEqual(selected.filter(member => member.membership[field]).map(member => member.target), [...value[field]].sort());
      break;
    }
    case "rules.king.reading.zone_state@1": {
      const value = source.payload as KingZoneReading;
      exactKeys(value, ["fen", "zoneConventionId", "shelterConventionId", "kings"]);
      for (const king of value.kings) {
        exactKeys(king, ["color", "king", "zone", "attackers", "defenders", "shelter", "escapes"]);
        for (const square of king.zone) add("king_zone_member", { king: king.king, square }, `${square} belongs to the recorded zone of ${piece(king.king.piece, king.king.square)}.`, [king.king.square, square]);
        for (const [kind, participants] of [["attacker", king.attackers], ["defender", king.defenders]] as const) {
          if (participants.length === 0) add("king_empty_group", { king: king.king, group: kind }, `${piece(king.king.piece, king.king.square)}: no ${kind} is recorded for this king zone.`);
          for (const participant of participants) {
            const members = participant.zoneSquares.map(square => ({ king: king.king, participant: { piece: participant.piece, square: participant.square }, square, group: kind }));
            for (const member of members) add("king_zone_relation", member, `${piece(participant.piece, participant.square)} is a recorded ${kind} of ${member.square} in this king zone.`, [king.king.square, participant.square, member.square], 1);
            assert.deepEqual(members.map(member => member.square), participant.zoneSquares);
          }
        }
        for (const shelter of king.shelter) add("king_shelter", { king: king.king, shelter }, `${piece(shelter.piece, shelter.square)} is in the recorded king-shelter set.`, [king.king.square, shelter.square]);
        if (king.shelter.length === 0) add("king_empty_group", { king: king.king, group: "shelter" }, `${piece(king.king.piece, king.king.square)}: the recorded king-shelter set is empty.`);
        if (king.escapes.kind === "unavailable") add("king_escapes_unavailable", { king: king.king, escapes: king.escapes }, `${piece(king.king.piece, king.king.square)}: adjacent legal turn-clone escapes are unavailable because this turn clone is invalid.`);
        else if (king.escapes.squares.length === 0) add("king_escapes_empty", { king: king.king, escapes: king.escapes }, `${piece(king.king.piece, king.king.square)}: no adjacent legal turn-clone escapes are recorded (en passant cleared), not a claim that every king move is unavailable.`);
        else for (const square of king.escapes.squares) add("king_escape", { king: king.king, square }, `${piece(king.king.piece, king.king.square)} has a recorded adjacent legal turn-clone escape to ${square} (en passant cleared).`, [king.king.square, square], 1);
      }
      break;
    }
  }
  const plan = Object.freeze({ source, digest: evidenceValueReceipt(source).payloadDigest, rows: Object.freeze(rows), coverage: Object.freeze(coverage), sourceTotal: rows.length, scope: null });
  admittedPlans.add(plan);
  return plan;
}

export function detailPage(plan: Plan, ordinal: number, expectedSourceDigest: string) {
  assert(admittedPlans.has(plan), "only the closed source constructors create a plan");
  // A proposed closed operation selects its own retained row, never caller-supplied text/operands.
  assert.equal(expectedSourceDigest, plan.digest, "source changed");
  assert(Number.isSafeInteger(ordinal) && ordinal >= 0 && ordinal < plan.rows.length, "invalid member ordinal");
  assert.equal(evidenceValueReceipt(plan.source).payloadDigest, plan.digest);
  const row = plan.rows[ordinal]!;
  const text = `Detail ${ordinal + 1} of ${plan.rows.length}${plan.scope === null ? "" : ` for ${plan.scope.color} ${plan.scope.mode} control at ${plan.scope.target}; full reading ${plan.sourceTotal} details`}. ${row.text}`;
  const words = text.normalize("NFKC").match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  const budget = { facts: 1, words, marks: row.squares.length, arrows: row.arrows };
  const limits = moduleDeclaration("full_inspector").budgets;
  assert(budget.facts <= limits.maxFacts && budget.words <= limits.maxWords && (limits.maxMarks === null || budget.marks <= limits.maxMarks) && budget.arrows <= limits.maxArrows, "detail does not fit");
  assert(!/\b(safe|best|recommended|winning|good move|bad move)\b/iu.test(text), "detail manufactured judgement");
  return { ordinal, sourceOrdinal: row.sourceOrdinal, total: plan.rows.length, sourceTotal: plan.sourceTotal, scope: plan.scope, sourceDigest: plan.digest, rowDigest: evidenceDigest(row.value), text, budget };
}

/** Explicit target, side and geometric/legal mode: never infer a "piece's moves" from controls. */
export function focusControl(plan: Plan, color: Color, mode: "geometric" | "legal", target: SquareName): Plan {
  assert(admittedPlans.has(plan) && plan.source.projection.id === "rules.square.reading.control" && plan.scope === null);
  assert(color === "white" || color === "black");
  assert(mode === "geometric" || mode === "legal");
  assert(/^[a-h][1-8]$/u.test(target));
  const kept = plan.rows.filter(row => {
    const value = row.value as { color: Color; mode: "geometric" | "legal"; target?: SquareName };
    return value.color === color && value.mode === mode && (value.target === target || row.kind === "control_unavailable");
  }).map((row, ordinal) => Object.freeze({ ...row, ordinal }));
  const source = plan.source.payload as SquareControlReading;
  const entry = source.colors.find(entry => entry.color === color)!;
  const set = mode === "geometric" ? { kind: "available", squares: entry.pseudo } : entry.legal;
  assert.deepEqual(kept.filter(row => row.kind === "control_relation").map(row => (row.value as { controller: unknown }).controller),
    set.kind === "unavailable" ? [] : set.squares.find(square => square.target === target)!.controllers);
  assert(kept.length > 0);
  const scoped = Object.freeze({ ...plan, rows: Object.freeze(kept), scope: Object.freeze({ color, mode, target }) });
  admittedPlans.add(scoped);
  return scoped;
}

/** Feasibility only: at most eight complete typed members, one source, no judgement ordering. */
export function detailBatch(plan: Plan, start: number, expectedSourceDigest: string) {
  detailPage(plan, start, expectedSourceDigest);
  const limits = moduleDeclaration("full_inspector").budgets;
  const selected: Row[] = [];
  let text = "", marks = new Set<string>(), arrows = 0, words = 0;
  for (const row of plan.rows.slice(start, start + 8)) {
    const nextText = `Details ${start + 1}–${row.ordinal + 1} of ${plan.rows.length}${plan.scope === null ? "" : ` for ${plan.scope.color} ${plan.scope.mode} control at ${plan.scope.target}; full reading ${plan.sourceTotal} details`}. ${[...selected, row].map(member => member.text).join(" ")}`;
    const nextMarks = new Set([...marks, ...row.squares]);
    const nextArrows = arrows + row.arrows;
    const nextWords = nextText.normalize("NFKC").match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
    if (nextWords > limits.maxWords || (limits.maxMarks !== null && nextMarks.size > limits.maxMarks) || nextArrows > limits.maxArrows) break;
    selected.push(row); text = nextText; marks = nextMarks; arrows = nextArrows; words = nextWords;
  }
  assert(selected.length > 0, "an individual detail does not fit");
  return { start, count: selected.length, total: plan.rows.length, next: start + selected.length === plan.rows.length ? null : start + selected.length,
    sourceDigest: plan.digest, sourceTotal: plan.sourceTotal, scope: plan.scope, ordinals: selected.map(row => row.ordinal), sourceOrdinals: selected.map(row => row.sourceOrdinal), rowDigests: selected.map(row => evidenceDigest(row.value)), text,
    budget: { facts: 1, words, marks: marks.size, arrows } };
}
