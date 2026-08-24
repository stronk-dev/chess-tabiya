import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { isNormal } from "chessops/types";
import { parseUci } from "chessops/util";

import type { DrillPackDefinition, SpineNode } from "@chess-tabiya/schema/drill-pack";

import { transposeKey } from "./chess.js";
import { evaluateObjectivePredicate, type FenPredicate } from "./objective.js";
import { historyFrom } from "./runtime.js";
import { exactMoveIdentity } from "./legal-moves.js";
import type { DrillRun, Node } from "./types.js";

export type LineVerdict = "on_line" | "classified_deviation" | "unknown";

export interface LineMembershipEntry {
  readonly nodeId: string;
  readonly ply: number;
  readonly moveUci: string;
  readonly verdict: LineVerdict;
  readonly spineNodeId?: string;
  readonly deviationClass?: string;
  readonly deviationMistakes?: readonly string[];
  readonly insideBoundary: boolean;
}

interface AuthoredPosition {
  readonly nodeId: string;
  readonly transposeKey: string;
  readonly depth: number;
  readonly order: number;
}

function authoredPositions(pack: DrillPackDefinition): readonly AuthoredPosition[] {
  const root = Chess.fromSetup(parseFen(pack.start.fen).unwrap()).unwrap();
  const result: AuthoredPosition[] = [];
  let order = 0;
  const visit = (nodes: readonly SpineNode[], position: Chess, depth: number): void => {
    for (const node of nodes) {
      const move = parseUci(node.moveUci);
      if (!move || !isNormal(move) || !position.isLegal(move)) continue;
      const next = position.clone();
      next.play(move);
      result.push({
        nodeId: node.id,
        transposeKey: transposeKey(makeFen(next.toSetup())),
        depth,
        order: order++,
      });
      visit(node.children, next, depth + 1);
    }
  };
  visit(pack.spine ?? [], root, 1);
  return result;
}

/** transposeKey of every authored position -> shallowest spine node id. */
export function spinePositionIndex(
  pack: DrillPackDefinition,
): ReadonlyMap<string, string> {
  const root = Chess.fromSetup(parseFen(pack.start.fen).unwrap()).unwrap();
  const candidates: Array<{ key: string; id: string; depth: number; order: number }> = [];
  let order = 0;
  const visit = (nodes: readonly SpineNode[], position: Chess, depth: number): void => {
    for (const node of nodes) {
      const move = parseUci(node.moveUci);
      if (!move || !isNormal(move) || !position.isLegal(move)) continue;
      const next = position.clone();
      next.play(move);
      candidates.push({
        key: transposeKey(makeFen(next.toSetup())),
        id: node.id,
        depth,
        order: order++,
      });
      visit(node.children, next, depth + 1);
    }
  };
  visit(pack.spine ?? [], root, 1);
  candidates.sort((left, right) => left.depth - right.depth || left.order - right.order);
  const result = new Map<string, string>();
  for (const candidate of candidates) {
    if (!result.has(candidate.key)) result.set(candidate.key, candidate.id);
  }
  return result;
}

export function spineNodeIdFor(
  index: ReadonlyMap<string, string>,
  node: Node,
): string | undefined {
  return index.get(node.transposeKey);
}

function runAt(run: DrillRun, node: Node): DrillRun {
  return {
    ...run,
    activeCursor: { branchId: node.branchId, nodeId: node.id },
  };
}

export function insideAuthoredBoundary(
  pack: DrillPackDefinition,
  run: DrillRun,
  node: Node,
): boolean {
  if (node.parentId === null) return true;
  const boundary = pack.authoredBoundary;
  if (boundary === undefined) return false;
  if (boundary.plyHorizon !== undefined && node.ply > boundary.plyHorizon) return false;
  const spineId = spineNodeIdFor(spinePositionIndex(pack), node);
  if (spineId !== undefined && boundary.spineNodeIds?.includes(spineId)) return true;
  return (boundary.fenPredicates ?? []).some((predicate) =>
    evaluateObjectivePredicate(runAt(run, node), {
      type: "fenPredicate",
      predicate: predicate as FenPredicate,
    }),
  );
}

/** Spine ids whose prose can be encountered before a declared reveal point. */
export function lineMembership(
  pack: DrillPackDefinition,
  run: DrillRun,
  nodeId: string,
): readonly LineMembershipEntry[] {
  const index = spinePositionIndex(pack);
  const anchors = new Map(
    authoredPositions(pack).map((entry) => [entry.nodeId, entry.transposeKey]),
  );
  return Object.freeze(
    historyFrom(run, nodeId).slice(1).map((node) => {
      const spineNodeId = spineNodeIdFor(index, node);
      const parent = run.nodes.find((candidate) => candidate.id === node.parentId);
      const deviation = (pack.deviations ?? []).find((candidate) => {
        if (parent === undefined) return false;
        const atAnchor = "fen" in candidate.at
          ? transposeKey(candidate.at.fen) === parent.transposeKey
          : "atStart" in candidate.at
            ? transposeKey(pack.start.fen) === parent.transposeKey
            : anchors.get(candidate.at.spineNodeId) === parent.transposeKey;
        return atAnchor && node.moveUci === exactMoveIdentity(parent.fen, candidate.moveUci);
      });
      const insideBoundary = insideAuthoredBoundary(pack, run, node);
      const verdict: LineVerdict =
        spineNodeId !== undefined && insideBoundary
          ? "on_line"
          : deviation !== undefined
            ? "classified_deviation"
            : "unknown";
      return Object.freeze({
        nodeId: node.id,
        ply: node.ply,
        moveUci: node.moveUci!,
        verdict,
        insideBoundary,
        ...(verdict === "on_line" && spineNodeId !== undefined ? { spineNodeId } : {}),
        ...(verdict === "classified_deviation"
          ? {
              deviationClass: deviation!.class,
              ...(deviation!.mistake === undefined
                ? {}
                : { deviationMistakes: deviation!.mistake }),
            }
          : {}),
      });
    }),
  );
}

export function deviationAnchors(
  pack: DrillPackDefinition,
): ReadonlyMap<string, string> {
  return new Map(authoredPositions(pack).map((entry) => [entry.nodeId, entry.transposeKey]));
}
