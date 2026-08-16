import { attacks } from "chessops/attacks";
import type { Color, Role, Square } from "chessops/types";
import { opposite } from "chessops/util";

import {
  MATERIAL_VALUES,
  appendEvents,
  deviationAnchors,
  historyFrom,
  transposeKey,
  type DrillRun,
  type EvidenceAttachedEvent,
  type MutationResult,
  type Node,
} from "@chess-tabiya/runtime";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import type { EngineCondition } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";

import {
  baseGuardConditionSettings,
  overrideGuardConditionSettings,
} from "./guard-conditions.js";
import {
  CATEGORY_RANK,
  learnerCategory,
} from "./sourcing/tablebase-category.js";
import type { TablebaseCategory } from "./tablebase.js";

function position(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

function node(run: DrillRun, id: string | null): Node | undefined {
  return id === null ? undefined : run.nodes.find((candidate) => candidate.id === id);
}

function material(fen: string, color: Color): number {
  const board = position(fen).board;
  let score = 0;
  for (const [role, value] of Object.entries(MATERIAL_VALUES) as [Role, number][]) {
    score += board[role].intersect(board[color]).size() * value;
  }
  return score;
}

function balance(fen: string, learner: Color): number {
  return material(fen, learner) - material(fen, opposite(learner));
}

function directAttackCount(fen: string, color: Color, target: Square): number {
  const board = position(fen).board;
  let count = 0;
  for (const [square, piece] of board) {
    if (piece.color === color && attacks(piece, square, board.occupied).has(target)) count += 1;
  }
  return count;
}

function hasUndefendedMajorOrMinor(fen: string, learner: Color): boolean {
  const board = position(fen).board;
  for (const [square, piece] of board) {
    if (piece.color !== learner || piece.role === "pawn" || piece.role === "king") continue;
    if (
      directAttackCount(fen, opposite(learner), square) > 0 &&
      directAttackCount(fen, learner, square) === 0
    ) return true;
  }
  return false;
}

function decisionTriple(run: DrillRun, consequenceId: string):
  | { readonly previous: Node; readonly learnerMove: Node; readonly consequence: Node }
  | undefined {
  const consequence = node(run, consequenceId);
  const learnerMove = node(run, consequence?.parentId ?? null);
  const previous = node(run, learnerMove?.parentId ?? null);
  if (
    consequence?.actor !== "opponent" ||
    learnerMove?.actor !== "user" ||
    previous === undefined ||
    consequence.parentId !== learnerMove.id
  ) return undefined;
  return { previous, learnerMove, consequence };
}

function alreadyGenerated(run: DrillRun, nodeId: string): boolean {
  return run.events.some(
    (event) => event.type === "feedback.generated" && event.data.nodeId === nodeId,
  );
}

interface GuardSettings {
  readonly rulesTier: boolean;
  readonly conditions: readonly EngineCondition[];
}

function guardSettings(
  pack: DrillPackDefinition,
  run: DrillRun,
  previous: Node,
  learnerMoveUci: string,
): GuardSettings {
  const base = baseGuardConditionSettings(pack.guard);
  if ((pack.guard?.overrides?.length ?? 0) === 0) return base;
  const path = historyFrom(run, previous.id);
  const spineKeys = deviationAnchors(pack);
  const anchorKey = (at: import("@chess-tabiya/schema/drill-pack").DeviationLocation): string | undefined => {
    if ("atStart" in at) return transposeKey(pack.start.fen);
    if ("fen" in at) return transposeKey(at.fen);
    return spineKeys.get(at.spineNodeId);
  };
  type Override = NonNullable<NonNullable<DrillPackDefinition["guard"]>["overrides"]>[number];
  let selected: { readonly depth: number; readonly moveScoped: boolean; readonly index: number; readonly value: Override } | undefined;
  for (const [index, override] of (pack.guard?.overrides ?? []).entries()) {
    if (override.moveUci !== undefined && override.moveUci !== learnerMoveUci) continue;
    const key = anchorKey(override.at);
    if (key === undefined) continue;
    const depth = path.map((node) => node.transposeKey).lastIndexOf(key);
    const moveScoped = override.moveUci !== undefined;
    if (
      depth < 0 ||
      (selected !== undefined &&
        (depth < selected.depth ||
          (depth === selected.depth && Number(moveScoped) <= Number(selected.moveScoped))))
    ) continue;
    selected = { depth, moveScoped, index, value: override };
  }
  return overrideGuardConditionSettings(base, selected?.value);
}

function insideGuardWindow(pack: DrillPackDefinition, consequence: Node): boolean {
  const window = pack.guard?.window;
  return window === undefined || (consequence.ply >= window.fromPly && consequence.ply <= window.toPly);
}

function generate(
  run: DrillRun,
  nodeId: string,
  evidenceRefs: readonly [string, ...string[]],
  at: string,
): MutationResult {
  const next = appendEvents(run, [{ type: "feedback.generated", at, data: { nodeId, evidenceRefs } }]);
  return Object.freeze({ run: next, emitted: Object.freeze(next.events.slice(run.events.length)) });
}

export function applyRulesGuard(
  pack: DrillPackDefinition,
  run: DrillRun,
  consequenceId: string,
  at: string,
): MutationResult {
  if (run.feedbackPolicy !== "immediate_guard" || alreadyGenerated(run, consequenceId)) {
    return Object.freeze({ run, emitted: Object.freeze([]) });
  }
  const triple = decisionTriple(run, consequenceId);
  if (triple === undefined) return Object.freeze({ run, emitted: Object.freeze([]) });
  if (!insideGuardWindow(pack, triple.consequence) || !guardSettings(pack, run, triple.previous, triple.learnerMove.moveUci!).rulesTier) {
    return Object.freeze({ run, emitted: Object.freeze([]) });
  }
  const learner = run.start.side;
  if (balance(triple.consequence.fen, learner) - balance(triple.previous.fen, learner) <= -3) {
    return generate(run, consequenceId, ["rules:material"], at);
  }
  if (hasUndefendedMajorOrMinor(triple.consequence.fen, learner)) {
    return generate(run, consequenceId, ["rules:structure-direct-attack-count"], at);
  }
  return Object.freeze({ run, emitted: Object.freeze([]) });
}

function evalAt(run: DrillRun, nodeId: string): EvidenceAttachedEvent | undefined {
  return [...run.events].reverse().find(
    (event): event is EvidenceAttachedEvent =>
      event.type === "evidence.attached" &&
      event.data.nodeId === nodeId &&
      event.data.payload.kind === "eval" &&
      event.data.payload.source === "engine_validated",
  );
}

function tablebaseAt(run: DrillRun, nodeId: string): EvidenceAttachedEvent | undefined {
  return [...run.events].reverse().find(
    (event): event is EvidenceAttachedEvent => event.type === "evidence.attached" &&
      event.data.nodeId === nodeId && event.data.payload.kind === "tablebase" &&
      event.data.payload.source === "tablebase_exact",
  );
}

const CONDITION_CATEGORIES = new Set<TablebaseCategory>([
  "loss", "blessed-loss", "draw", "cursed-win", "win",
]);

function learnerTablebaseCategory(event: EvidenceAttachedEvent, learner: Color): TablebaseCategory | undefined {
  const values = event.data.payload.values;
  if (!Number.isSafeInteger(values.pieceCount) || Number(values.pieceCount) > 7) return undefined;
  if (typeof values.category !== "string" || !CONDITION_CATEGORIES.has(values.category as TablebaseCategory)) return undefined;
  const turn = typeof values.fen === "string" ? values.fen.split(/\s+/)[1] : undefined;
  if (turn !== "w" && turn !== "b") return undefined;
  return learnerCategory(turn === "w" ? "white" : "black", values.category as TablebaseCategory, learner);
}

function tablebaseCondition(
  condition: Extract<EngineCondition, { kind: "tablebase_category_regression" | "tablebase_dtz_regression" }>,
  previous: EvidenceAttachedEvent,
  consequence: EvidenceAttachedEvent,
  learner: Color,
): boolean {
  const beforeCategory = learnerTablebaseCategory(previous, learner);
  const afterCategory = learnerTablebaseCategory(consequence, learner);
  if (beforeCategory === undefined || afterCategory === undefined) return false;
  if (condition.kind === "tablebase_category_regression") {
    return CATEGORY_RANK[afterCategory as keyof typeof CATEGORY_RANK] < CATEGORY_RANK[beforeCategory as keyof typeof CATEGORY_RANK];
  }
  if (beforeCategory !== afterCategory) return false;
  const before = previous.data.payload.values.preciseDtz ?? previous.data.payload.values.dtz;
  const after = consequence.data.payload.values.preciseDtz ?? consequence.data.payload.values.dtz;
  return typeof before === "number" && typeof after === "number" &&
    Math.abs(after) - Math.abs(before) >= condition.byAtLeast;
}

function mateAgainstLearner(values: Readonly<Record<string, unknown>>, learner: Color): boolean {
  if (!Number.isSafeInteger(values.mateIn)) return false;
  const mateIn = values.mateIn as number;
  return learner === "white" ? mateIn < 0 : mateIn > 0;
}

function centipawnSwing(
  previous: EvidenceAttachedEvent,
  consequence: EvidenceAttachedEvent,
  learner: Color,
  threshold: number,
): boolean {
  const before = previous.data.payload.values;
  const after = consequence.data.payload.values;
  if (!Number.isSafeInteger(before.centipawns) || !Number.isSafeInteger(after.centipawns)) return false;
  const delta = (after.centipawns as number) - (before.centipawns as number);
  return learner === "white" ? delta <= -threshold : delta >= threshold;
}

export function applyRecordedEngineGuard(
  pack: DrillPackDefinition,
  run: DrillRun,
  appliedNodeId: string,
  appliedEvidenceRefs: readonly string[],
  at: string,
): MutationResult {
  if (run.feedbackPolicy !== "immediate_guard") {
    return Object.freeze({ run, emitted: Object.freeze([]) });
  }
  for (const consequence of run.nodes) {
    if (alreadyGenerated(run, consequence.id)) continue;
    const triple = decisionTriple(run, consequence.id);
    if (triple === undefined) continue;
    if (!insideGuardWindow(pack, triple.consequence)) continue;
    if (appliedNodeId !== triple.previous.id && appliedNodeId !== consequence.id) continue;
    const previousEval = evalAt(run, triple.previous.id);
    const consequenceEval = evalAt(run, consequence.id);
    const settings = guardSettings(pack, run, triple.previous, triple.learnerMove.moveUci!);
    const previousTablebase = tablebaseAt(run, triple.previous.id);
    const consequenceTablebase = tablebaseAt(run, consequence.id);
    const before = previousEval?.data.payload.values;
    const after = consequenceEval?.data.payload.values;
    const mate = before !== undefined && after !== undefined &&
      mateAgainstLearner(after, run.start.side) && !mateAgainstLearner(before, run.start.side);
    for (const condition of settings.conditions) {
      const engineMatched = previousEval !== undefined && consequenceEval !== undefined &&
        ((condition.kind === "engine_mate_appears" && mate) ||
          (condition.kind === "engine_eval_swing" && centipawnSwing(previousEval, consequenceEval, run.start.side, condition.cp)));
      const tablebaseMatched = previousTablebase !== undefined && consequenceTablebase !== undefined &&
        (condition.kind === "tablebase_category_regression" || condition.kind === "tablebase_dtz_regression") &&
        tablebaseCondition(condition, previousTablebase, consequenceTablebase, run.start.side);
      const namespace = engineMatched ? "engine:" : tablebaseMatched ? "tablebase:" : undefined;
      if (namespace !== undefined) {
        const reference = appliedEvidenceRefs.find((candidate) => candidate.startsWith(namespace));
        if (reference !== undefined) return generate(run, consequence.id, [reference], at);
      }
    }
  }
  return Object.freeze({ run, emitted: Object.freeze([]) });
}
