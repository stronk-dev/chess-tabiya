import type {
  MoveCondition,
  SimpleTrigger,
  TimingWindowDefinition,
} from "@chess-tabiya/schema/drill-pack";
import type { Color, Role, SquareName } from "chessops/types";
import { isNormal } from "chessops/types";
import { makeSquare, parseUci } from "chessops/util";

import { positionFromFen } from "./chess.js";
import { matchesStructuralExpression } from "./structure.js";
import type { DrillRun, Node } from "./types.js";

export const TEMPO_VERDICTS = Object.freeze([
  "unopened",
  "open",
  "in_time",
  "over_budget",
  "too_slow",
  "outpaced",
  "premature",
] as const);
export type TempoVerdict = (typeof TEMPO_VERDICTS)[number];

export const AUTHORABLE_TEMPO_VERDICTS = Object.freeze(
  TEMPO_VERDICTS.filter((verdict) => verdict !== "unopened"),
) as readonly Exclude<TempoVerdict, "unopened">[];

export const TEMPO_GRADEABLE_VERDICTS = Object.freeze([
  "in_time",
  "over_budget",
  "too_slow",
  "premature",
  "outpaced",
] as const);

export const DECLARED_UNGRADEABLE_VERDICTS = Object.freeze([
  {
    verdict: "open",
    reason: "open is a live timing-window state, not a completed result",
  },
  {
    verdict: "outpaced",
    reason:
      "outpaced defaults to ungraded in authored packs; set gradeOutpaced on the referenced timing window to opt in",
  },
] as const);

export const UNAUTHORED_TEMPO_DEFAULTS = Object.freeze({
  outpaced: "failed",
} as const);

export interface TempoMove {
  readonly nodeId: string;
  readonly moveUci: string;
  readonly mover: Color;
  readonly role: Role;
  readonly toSquare: SquareName;
  readonly beforeFen: string;
  readonly fen: string;
  readonly legalMoveCountBefore: number;
}

export type TriggerResolver = (
  trigger: SimpleTrigger,
  pathIndex: number,
) => boolean;

export interface TimingWindowState {
  readonly windowId: string;
  readonly verdict: TempoVerdict;
  readonly openedAtNodeId: string | null;
  readonly closedAtNodeId: string | null;
  readonly closedBy: "arrival" | "release" | "position" | "deadline" | null;
  readonly ready: boolean;
  readonly satisfied: number;
  readonly required: number;
  readonly learnerMoves: number;
  readonly spend: number;
  readonly budget: number;
}

function pathToNode(run: DrillRun, nodeId: string): readonly Node[] {
  const byId = new Map(run.nodes.map((node) => [node.id, node]));
  const reversed: Node[] = [];
  let cursor = byId.get(nodeId);
  while (cursor !== undefined) {
    reversed.push(cursor);
    cursor = cursor.parentId === null ? undefined : byId.get(cursor.parentId);
  }
  return reversed.reverse();
}

export function tempoMovesFromRun(
  run: DrillRun,
  nodeId = run.activeCursor.nodeId,
): readonly TempoMove[] {
  const nodes = pathToNode(run, nodeId);
  return Object.freeze(nodes.slice(1).map((node, index) => {
    const parent = nodes[index]!;
    const position = positionFromFen(parent.fen);
    const move = node.moveUci === null ? undefined : parseUci(node.moveUci);
    if (move === undefined || !isNormal(move)) {
      throw new TypeError(`Tempo path node ${node.id} has no normal move`);
    }
    const piece = position.board.get(move.from);
    if (piece === undefined) {
      throw new TypeError(`Tempo path move ${node.moveUci} has no piece on its from-square`);
    }
    return Object.freeze({
      nodeId: node.id,
      moveUci: node.moveUci!,
      mover: piece.color,
      role: piece.role,
      toSquare: makeSquare(move.to),
      beforeFen: parent.fen,
      fen: node.fen,
      legalMoveCountBefore: [...position.allDests().values()].reduce(
        (total, destinations) => total + destinations.size(),
        0,
      ),
    });
  }));
}

function moveMatches(move: TempoMove, condition: MoveCondition): boolean {
  if ("moveUci" in condition) return move.moveUci === condition.moveUci;
  return (
    move.mover === condition.piece.color &&
    move.role === condition.piece.role &&
    (condition.to === undefined || move.toSquare === condition.to)
  );
}

function openingIndex(
  window: TimingWindowDefinition,
  path: readonly TempoMove[],
  resolveTrigger?: TriggerResolver,
): { readonly index: number; readonly nodeId: string | null } | undefined {
  if ("fromStart" in window.opens) return { index: -1, nodeId: null };
  if ("onMove" in window.opens) {
    const conditions = window.opens.onMove;
    const index = path.findIndex((move) =>
      conditions.some((condition) => moveMatches(move, condition)),
    );
    return index < 0 ? undefined : { index, nodeId: path[index]!.nodeId };
  }
  const trigger = window.opens.onTrigger;
  if ("atStart" in trigger) return { index: -1, nodeId: null };
  const index = resolveTrigger === undefined
    ? -1
    : path.findIndex((_move, candidate) =>
        resolveTrigger(trigger, candidate),
      );
  return index < 0 ? undefined : { index, nodeId: path[index]!.nodeId };
}

function unresolved(window: TimingWindowDefinition): TimingWindowState {
  const required = window.readiness.mode === "all" ? window.readiness.of.length : 1;
  return Object.freeze({
    windowId: window.id,
    verdict: "unopened",
    openedAtNodeId: null,
    closedAtNodeId: null,
    closedBy: null,
    ready: false,
    satisfied: 0,
    required,
    learnerMoves: 0,
    spend: 0,
    budget: window.luxuryMoveBudget,
  });
}

function evaluateWindow(
  window: TimingWindowDefinition,
  path: readonly TempoMove[],
  learner: Color,
  resolveTrigger?: TriggerResolver,
): TimingWindowState {
  const opened = openingIndex(window, path, resolveTrigger);
  if (opened === undefined) return unresolved(window);

  const satisfied = new Set<number>();
  let learnerMoves = 0;
  let spend = 0;
  let closedAtNodeId: string | null = null;
  let closedBy: TimingWindowState["closedBy"] = null;
  let closingMoveWasForced = false;

  const isReady = (): boolean => window.readiness.mode === "all"
    ? satisfied.size === window.readiness.of.length
    : satisfied.size >= 1;

  for (const move of path.slice(opened.index + 1)) {
    const wasReady = isReady();
    let advancedReadiness = false;
    for (const [index, condition] of window.readiness.of.entries()) {
      if (!satisfied.has(index) && moveMatches(move, condition)) {
        satisfied.add(index);
        advancedReadiness = true;
        break;
      }
    }

    for (const close of window.closes) {
      if (close.kind === "deadline") continue;
      let matched: boolean;
      if (close.kind === "arrival") {
        matched = move.mover !== learner && moveMatches(move, close.move);
      } else if (close.kind === "release") {
        matched = move.mover === learner && moveMatches(move, close.move);
      } else {
        matched = matchesStructuralExpression(move.fen, close.feature);
      }
      if (matched) {
        closedBy = close.kind;
        closedAtNodeId = move.nodeId;
        closingMoveWasForced = move.legalMoveCountBefore === 1;
        break;
      }
    }

    if (move.mover === learner) {
      learnerMoves += 1;
      const tolerated = (window.tolerated ?? []).some((condition) =>
        moveMatches(move, condition),
      );
      if (
        !wasReady &&
        !advancedReadiness &&
        !tolerated &&
        closedBy === null &&
        move.legalMoveCountBefore > 1
      ) spend += 1;
    }

    if (closedBy === null) {
      const deadline = window.closes.find(
        (close) => close.kind === "deadline" && learnerMoves >= close.afterLearnerMoves,
      );
      if (deadline?.kind === "deadline") {
        closedBy = "deadline";
        closedAtNodeId = move.nodeId;
      }
    }
    if (closedBy !== null) break;
  }

  const ready = isReady();
  const required = window.readiness.mode === "all" ? window.readiness.of.length : 1;
  const verdict: TempoVerdict = closedBy === null
    ? "open"
    : closedBy === "release" && !ready && !closingMoveWasForced
      ? "premature"
      : !ready && learnerMoves < required
        ? "outpaced"
        : !ready
          ? "too_slow"
          : spend > window.luxuryMoveBudget
            ? "over_budget"
            : "in_time";
  return Object.freeze({
    windowId: window.id,
    verdict,
    openedAtNodeId: opened.nodeId,
    closedAtNodeId,
    closedBy,
    ready,
    satisfied: satisfied.size,
    required,
    learnerMoves,
    spend,
    budget: window.luxuryMoveBudget,
  });
}

export function windowStates(
  windows: readonly TimingWindowDefinition[],
  path: readonly TempoMove[],
  learner: Color,
  resolveTrigger?: TriggerResolver,
): readonly TimingWindowState[] {
  return Object.freeze(
    windows.map((window) => evaluateWindow(window, path, learner, resolveTrigger)),
  );
}

export function unauthoredTempoTransition(verdict: TempoVerdict): "failed" | null {
  return verdict === "outpaced" ? UNAUTHORED_TEMPO_DEFAULTS.outpaced : null;
}
