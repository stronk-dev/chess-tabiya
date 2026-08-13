import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
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
  | "AUTHORED_PROSE_AFTER_LAST_CHECKPOINT"
  | "DUPLICATE_SPINE_NODE"
  | "ILLEGAL_SPINE_MOVE"
  | "INVALID_START_FEN"
  | "SPINE_SAN_MISMATCH"
  | "TOO_MANY_PREDICTIONS"
  | "UNKNOWN_SPINE_NODE"
  | "DEVIATION_WRONG_SIDE"
  | "ILLEGAL_DEVIATION_MOVE"
  | "DUPLICATE_DEVIATION"
  | "DEVIATION_SHADOWS_SPINE_MOVE"
  | "SPINE_TRANSPOSITION_COLLISION"
  | "BOUNDARY_NODE_BEYOND_HORIZON";

export interface PackLintIssue {
  readonly severity: "error" | "warning";
  readonly code: PackLintCode;
  readonly path: string;
  readonly message: string;
}

interface SpineLocation {
  readonly node: SpineNode;
  readonly parentId?: string;
  readonly path: string;
  readonly depth?: number;
  readonly position?: Chess;
}

export function reachableAuthoredSpineIds(
  pack: DrillPackDefinition,
): ReadonlySet<string> {
  const locations = new Map<string, SpineLocation>();
  indexSpine(pack.spine ?? [], "/spine", undefined, locations);
  const all = new Set(locations.keys());
  const starts: string[] = [];
  for (const checkpoint of pack.checkpoints) {
    const trigger = checkpoint.trigger;
    if ("atSpineNode" in trigger) starts.push(trigger.atSpineNode);
    else if ("atAuthoredBoundary" in trigger) {
      starts.push(...(pack.authoredBoundary?.spineNodeIds ?? []));
    } else return all;
  }
  const result = new Set<string>();
  for (const start of starts) {
    let id: string | undefined = start;
    while (id !== undefined && !result.has(id)) {
      result.add(id);
      id = locations.get(id)?.parentId;
    }
  }
  return result;
}

function indexSpine(
  nodes: readonly SpineNode[],
  path: string,
  parentId: string | undefined,
  result: Map<string, SpineLocation>,
): void {
  for (const [index, node] of nodes.entries()) {
    const nodePath = `${path}/${index}`;
    result.set(node.id, { node, ...(parentId === undefined ? {} : { parentId }), path: nodePath });
    indexSpine(node.children, `${nodePath}/children`, node.id, result);
  }
}

function lintUnreachableAuthoredProse(
  pack: DrillPackDefinition,
  issues: PackLintIssue[],
): void {
  const locations = new Map<string, SpineLocation>();
  indexSpine(pack.spine ?? [], "/spine", undefined, locations);
  const reachable = reachableAuthoredSpineIds(pack);

  const warning = (path: string, nodeId: string): void => {
    issues.push({
      severity: "warning",
      code: "AUTHORED_PROSE_AFTER_LAST_CHECKPOINT",
      path,
      message: `Authored prose at spine node ${nodeId} is not on a path to any atSpineNode checkpoint and cannot be revealed`,
    });
  };
  for (const [nodeId, location] of locations) {
    if (reachable.has(nodeId)) continue;
    for (const annotationIndex of (location.node.annotations ?? []).keys()) {
      warning(`${location.path}/annotations/${annotationIndex}`, nodeId);
    }
  }
  for (const [index, deviation] of (pack.deviations ?? []).entries()) {
    if (
      deviation.note !== undefined &&
      "spineNodeId" in deviation.at &&
      !reachable.has(deviation.at.spineNodeId)
    ) {
      warning(`/deviations/${index}/note`, deviation.at.spineNodeId);
    }
  }
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
  locations: Map<string, SpineLocation>,
  depth = 1,
  positionKeys = new Map<string, string>(),
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
    locations.set(node.id, {
      node,
      path: nodePath,
      depth,
      position: next,
    });
    const key = makeFen(next.toSetup()).split(" ", 4).join(" ");
    const previous = positionKeys.get(key);
    if (previous !== undefined) {
      issues.push({
        severity: "warning",
        code: "SPINE_TRANSPOSITION_COLLISION",
        path: `${nodePath}/id`,
        message: `Spine node ${node.id} reaches the same position as ${previous}`,
      });
    } else positionKeys.set(key, node.id);
    lintSpine(node.children, next, `${nodePath}/children`, ids, issues, locations, depth + 1, positionKeys);
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
  const spineLocations = new Map<string, SpineLocation>();

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
  lintSpine(pack.spine ?? [], position, "/spine", spineIds, issues, spineLocations);

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
    if ("spineNodeId" in deviation.at) {
      lintNodeReference(
        deviation.at.spineNodeId,
        `/deviations/${index}/at/spineNodeId`,
        spineIds,
        issues,
      );
    }
  }
  const deviationKeys = new Set<string>();
  for (const [index, deviation] of (pack.deviations ?? []).entries()) {
    const anchorPath = `/deviations/${index}`;
    const anchor = "spineNodeId" in deviation.at
      ? spineLocations.get(deviation.at.spineNodeId)?.position
      : (() => {
          try { return startPosition(deviation.at.fen); } catch { return undefined; }
        })();
    const anchorKey = "spineNodeId" in deviation.at
      ? `spine:${deviation.at.spineNodeId}`
      : `fen:${deviation.at.fen}`;
    const duplicateKey = `${anchorKey}\0${deviation.moveUci}`;
    if (deviationKeys.has(duplicateKey)) {
      issues.push({ severity: "error", code: "DUPLICATE_DEVIATION", path: anchorPath, message: "Deviation anchor and move are duplicated" });
    }
    deviationKeys.add(duplicateKey);
    if (anchor === undefined) continue;
    const move = parseUci(deviation.moveUci);
    if (move && isNormal(move) && anchor.board.getColor(move.from) !== undefined && anchor.board.getColor(move.from) !== anchor.turn) {
      issues.push({ severity: "error", code: "DEVIATION_WRONG_SIDE", path: `${anchorPath}/moveUci`, message: `Move ${deviation.moveUci} belongs to the wrong side at its anchor` });
    } else if (!move || !isNormal(move) || !anchor.isLegal(move)) {
      issues.push({ severity: "error", code: "ILLEGAL_DEVIATION_MOVE", path: `${anchorPath}/moveUci`, message: `Move ${deviation.moveUci} is illegal at its anchor` });
    }
    if (
      "spineNodeId" in deviation.at &&
      spineLocations.get(deviation.at.spineNodeId)?.node.children.some((child) => child.moveUci === deviation.moveUci)
    ) {
      issues.push({ severity: "warning", code: "DEVIATION_SHADOWS_SPINE_MOVE", path: `${anchorPath}/moveUci`, message: "Deviation move is also an authored spine move; on-line takes precedence" });
    }
  }
  const horizon = pack.authoredBoundary?.plyHorizon;
  if (horizon !== undefined) {
    for (const [index, id] of (pack.authoredBoundary?.spineNodeIds ?? []).entries()) {
      const depth = spineLocations.get(id)?.depth;
      if (depth !== undefined && depth > horizon) {
        issues.push({ severity: "warning", code: "BOUNDARY_NODE_BEYOND_HORIZON", path: `/authoredBoundary/spineNodeIds/${index}`, message: `Boundary node ${id} at ply ${depth} is beyond plyHorizon ${horizon}` });
      }
    }
  }
  lintPredictionDensity(pack.checkpoints, options, issues);
  lintUnreachableAuthoredProse(pack, issues);
  return Object.freeze(issues);
}
