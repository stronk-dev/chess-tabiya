import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { makeSan } from "chessops/san";
import { isNormal } from "chessops/types";
import { parseUci } from "chessops/util";

import type {
  CheckpointDefinition,
  CheckpointTrigger,
  DrillPackDefinition,
  SimpleTrigger,
  SpineNode,
} from "./types.js";

export type PackLintCode =
  | "DUPLICATE_SPINE_NODE"
  | "ILLEGAL_SPINE_MOVE"
  | "INVALID_START_FEN"
  | "SPINE_SAN_MISMATCH"
  | "TOO_MANY_PREDICTIONS"
  | "UNKNOWN_SPINE_NODE";

export interface PackLintIssue {
  readonly severity: "error" | "warning";
  readonly code: PackLintCode;
  readonly path: string;
  readonly message: string;
}

export interface PredictionSegment {
  readonly id: string;
  readonly checkpointIds: readonly string[];
}

export interface PackLintOptions {
  /**
   * Static packs do not encode segment ids. Authoring/runtime context may supply
   * a grouping; otherwise the whole pack is treated conservatively as one segment.
   */
  readonly predictionSegments?: readonly PredictionSegment[];
}

function startPosition(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

function triggerNodeRefs(trigger: CheckpointTrigger): readonly string[] {
  const simpleRefs = (simple: SimpleTrigger): readonly string[] =>
    "atSpineNode" in simple ? [simple.atSpineNode] : [];
  return "windowOpens" in trigger
    ? [...simpleRefs(trigger.windowOpens), ...simpleRefs(trigger.windowCloses)]
    : simpleRefs(trigger);
}

function lintSpine(
  nodes: readonly SpineNode[],
  position: Chess,
  path: string,
  ids: Set<string>,
  issues: PackLintIssue[],
): void {
  for (const [index, node] of nodes.entries()) {
    const nodePath = `${path}/${index}`;
    if (ids.has(node.id)) {
      issues.push({
        severity: "error",
        code: "DUPLICATE_SPINE_NODE",
        path: `${nodePath}/id`,
        message: `Spine node id is not pack-unique: ${node.id}`,
      });
    }
    ids.add(node.id);

    const move = parseUci(node.moveUci);
    if (!move || !isNormal(move) || !position.isLegal(move)) {
      issues.push({
        severity: "error",
        code: "ILLEGAL_SPINE_MOVE",
        path: `${nodePath}/moveUci`,
        message: `Move ${node.moveUci} is illegal on its authored path`,
      });
      continue;
    }
    const next = position.clone();
    const expectedSan = makeSan(position, move);
    if (node.moveSan !== expectedSan) {
      issues.push({
        severity: "error",
        code: "SPINE_SAN_MISMATCH",
        path: `${nodePath}/moveSan`,
        message: `Stored SAN ${node.moveSan} does not match legal move ${expectedSan}`,
      });
    }
    next.play(move);
    lintSpine(node.children, next, `${nodePath}/children`, ids, issues);
  }
}

function lintNodeReference(
  nodeId: string,
  path: string,
  spineIds: ReadonlySet<string>,
  issues: PackLintIssue[],
): void {
  if (!spineIds.has(nodeId)) {
    issues.push({
      severity: "error",
      code: "UNKNOWN_SPINE_NODE",
      path,
      message: `Unknown spine node reference: ${nodeId}`,
    });
  }
}

function lintPredictionDensity(
  checkpoints: readonly CheckpointDefinition[],
  options: PackLintOptions,
  issues: PackLintIssue[],
): void {
  const byId = new Map(checkpoints.map((checkpoint) => [checkpoint.id, checkpoint]));
  const segments = options.predictionSegments ?? [
    { id: "pack", checkpointIds: checkpoints.map((checkpoint) => checkpoint.id) },
  ];

  for (const segment of segments) {
    const predictionCount = segment.checkpointIds.filter(
      (id) => byId.get(id)?.interaction?.type === "prediction",
    ).length;
    if (predictionCount > 2) {
      issues.push({
        severity: "warning",
        code: "TOO_MANY_PREDICTIONS",
        path: "/checkpoints",
        message: `Segment ${segment.id} has ${predictionCount} prediction checkpoints (maximum 2)`,
      });
    }
  }
}

export function lintDrillPack(
  pack: DrillPackDefinition,
  options: PackLintOptions = {},
): readonly PackLintIssue[] {
  const issues: PackLintIssue[] = [];
  const spineIds = new Set<string>();

  let position: Chess;
  try {
    position = startPosition(pack.start.fen);
  } catch {
    issues.push({
      severity: "error",
      code: "INVALID_START_FEN",
      path: "/start/fen",
      message: "Pack start FEN is not a legal standard-chess position",
    });
    return Object.freeze(issues);
  }
  lintSpine(pack.spine ?? [], position, "/spine", spineIds, issues);

  for (const [index, checkpoint] of pack.checkpoints.entries()) {
    for (const nodeId of triggerNodeRefs(checkpoint.trigger)) {
      lintNodeReference(
        nodeId,
        `/checkpoints/${index}/trigger`,
        spineIds,
        issues,
      );
    }
  }
  for (const [index, nodeId] of (pack.authoredBoundary?.spineNodeIds ?? []).entries()) {
    lintNodeReference(
      nodeId,
      `/authoredBoundary/spineNodeIds/${index}`,
      spineIds,
      issues,
    );
  }
  for (const [index, deviation] of (pack.deviations ?? []).entries()) {
    if (deviation.at.spineNodeId !== undefined) {
      lintNodeReference(
        deviation.at.spineNodeId,
        `/deviations/${index}/at/spineNodeId`,
        spineIds,
        issues,
      );
    }
  }
  lintPredictionDensity(pack.checkpoints, options, issues);
  return Object.freeze(issues);
}
