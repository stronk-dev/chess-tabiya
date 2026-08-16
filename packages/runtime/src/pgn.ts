import {
  ChildNode,
  Node as PgnTreeNode,
  makeComment,
  makePgn,
  type Game,
  type PgnNodeData,
} from "chessops/pgn";
import { makeSan } from "chessops/san";
import { isNormal } from "chessops/types";
import { parseSquare, parseUci } from "chessops/util";

import { branchPath, requireBranch } from "./branch-path.js";
import { canonicalFen, positionFromFen } from "./chess.js";
import type { Branch, DrillRun, Node, RunMark } from "./types.js";

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

function pgnHeaders(run: DrillRun, root: Node, overrides: Readonly<Record<string, string>> = {}, markCount = 0): Map<string, string> {
  const date = run.events[0]?.at.slice(0, 10).replaceAll("-", ".") ?? "????.??.??";
  const headers = new Map<string, string>([
    ["Event", run.packId === null ? "Tabiya session: position" : `Tabiya drill: ${run.packId}`],
    ["Site", "chess-tabiya"],
    ["Date", date],
    ["Round", "?"],
    ["White", "?"],
    ["Black", "?"],
    ["Result", "*"],
    ["SetUp", "1"],
    ["FEN", root.fen],
    ["TabiyaRun", run.id],
    ["TabiyaSession", run.sessionDigest],
  ]);
  if (run.packId !== null) headers.set("TabiyaPack", run.packId);
  for (const [name, value] of Object.entries(overrides)) headers.set(name, value);
  headers.set("Site", "chess-tabiya");
  headers.set("TabiyaRun", run.id);
  headers.set("TabiyaSession", run.sessionDigest);
  headers.set("TabiyaMarks", `own (${markCount}); other authors' marks are not exported`);
  return headers;
}

function commentForMarks(marks: readonly RunMark[]): string | undefined {
  const seen = new Set<string>();
  const shapes = marks.flatMap((mark) => {
    const from = parseSquare(mark.orig), to = parseSquare(mark.dest ?? mark.orig);
    if (from === undefined || to === undefined) return [];
    const key = `${mark.brush}:${from}:${to}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ color: mark.brush, from, to }];
  });
  return shapes.length === 0 ? undefined : makeComment({ shapes });
}

export function exportPgn(
  run: DrillRun,
  branchIds?: readonly string[],
  headerOverrides: Readonly<Record<string, string>> = {},
  marks: readonly RunMark[] = [],
): string {
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
            ? { startingComments: [`Tabiya branch${branch.origin === "simulated" ? " (simulated)" : ""}: ${branch.label}`] }
            : {}),
        });
        parent.children.push(child as ChildNode<PgnNodeData>);
        pgnNodeByRunNode.set(node.id, child);
      }
      parent = child;
    }
  }

  const selectedBranchIds = new Set(branches.map((branch) => branch.id));
  const marksFor = (node: Node): readonly RunMark[] => marks.filter((mark) =>
    mark.scope === "position"
      ? mark.scopeKey === node.transposeKey
      : run.branches.some((branch) => selectedBranchIds.has(branch.id) && mark.scopeKey === `${branch.id}:${node.id}`));
  for (const node of run.nodes) {
    const target = pgnNodeByRunNode.get(node.id);
    if (target === undefined) continue;
    const comment = commentForMarks(marksFor(node));
    if (comment !== undefined && target instanceof ChildNode) target.data.comments = [comment];
  }
  const rootComment = commentForMarks(marksFor(root));

  const game: Game<PgnNodeData> = {
    headers: pgnHeaders(run, root, headerOverrides, marks.length),
    moves: tree,
    ...(rootComment === undefined ? {} : { comments: [rootComment] }),
  };
  return makePgn(game);
}
