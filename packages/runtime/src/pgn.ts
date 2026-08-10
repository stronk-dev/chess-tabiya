import {
  ChildNode,
  Node as PgnTreeNode,
  makePgn,
  type Game,
  type PgnNodeData,
} from "chessops/pgn";
import { makeSan } from "chessops/san";
import { isNormal } from "chessops/types";
import { parseUci } from "chessops/util";

import { branchPath, requireBranch } from "./branch-path.js";
import { canonicalFen, positionFromFen } from "./chess.js";
import type { Branch, DrillRun, Node } from "./types.js";

export class PgnExportError extends Error {
  readonly nodeId?: string;

  constructor(message: string, nodeId?: string) {
    super(message);
    this.name = "PgnExportError";
    if (nodeId !== undefined) this.nodeId = nodeId;
  }
}

function validatePath(path: readonly Node[]): void {
  const root = path[0];
  if (!root) throw new PgnExportError("Cannot export an empty branch path");
  const position = positionFromFen(root.fen);

  for (const node of path.slice(1)) {
    const move = node.moveUci === null ? undefined : parseUci(node.moveUci);
    if (!move || !isNormal(move) || !position.isLegal(move)) {
      throw new PgnExportError("Branch contains an illegal move", node.id);
    }
    const san = makeSan(position, move);
    if (node.moveSan !== san) {
      throw new PgnExportError("Stored SAN does not match the legal move", node.id);
    }
    position.play(move);
    if (canonicalFen(position) !== node.fen) {
      throw new PgnExportError("Stored FEN does not match the legal move result", node.id);
    }
  }
}

function selectedBranches(run: DrillRun, branchIds?: readonly string[]): readonly Branch[] {
  const ids = branchIds ?? run.branches.map((branch) => branch.id);
  if (ids.length === 0) throw new PgnExportError("At least one branch is required");
  const selected = new Set(ids);
  for (const branchId of selected) requireBranch(run, branchId);
  return run.branches.filter((branch) => selected.has(branch.id));
}

function pgnHeaders(run: DrillRun, root: Node): Map<string, string> {
  const date = run.events[0]?.at.slice(0, 10).replaceAll("-", ".") ?? "????.??.??";
  return new Map([
    ["Event", `Tabiya drill: ${run.packId}`],
    ["Site", "chess-tabiya"],
    ["Date", date],
    ["Round", "?"],
    ["White", "?"],
    ["Black", "?"],
    ["Result", "*"],
    ["SetUp", "1"],
    ["FEN", root.fen],
    ["TabiyaRun", run.id],
    ["TabiyaPack", run.packId],
  ]);
}

export function exportPgn(run: DrillRun, branchIds?: readonly string[]): string {
  const branches = selectedBranches(run, branchIds);
  const paths = branches.map((branch) => ({ branch, path: branchPath(run, branch.id) }));
  for (const { path } of paths) validatePath(path);

  const root = paths[0]!.path[0]!;
  const tree = new PgnTreeNode<PgnNodeData>();
  const pgnNodeByRunNode = new Map<string, PgnTreeNode<PgnNodeData>>([[root.id, tree]]);

  for (const { branch, path } of paths) {
    let parent = tree;
    for (const node of path.slice(1)) {
      let child = pgnNodeByRunNode.get(node.id);
      if (!child) {
        const isFirstBranchMove =
          node.parentId === branch.forkNodeId && branch.id !== run.branches[0]!.id;
        child = new ChildNode<PgnNodeData>({
          san: node.moveSan!,
          ...(isFirstBranchMove
            ? { startingComments: [`Tabiya branch: ${branch.label}`] }
            : {}),
        });
        parent.children.push(child as ChildNode<PgnNodeData>);
        pgnNodeByRunNode.set(node.id, child);
      }
      parent = child;
    }
  }

  const game: Game<PgnNodeData> = {
    headers: pgnHeaders(run, root),
    moves: tree,
  };
  return makePgn(game);
}
