import {
  digestDrillPack,
  lintDrillPack,
  type DrillPackDefinition,
  type SpineNode,
} from "@chess-tabiya/schema/drill-pack";

import { branchPath } from "./branch-path.js";
import { canonicalFen, positionFromFen } from "./chess.js";
import { exportPgn } from "./pgn.js";
import { commitMove, createRun, fork } from "./runtime.js";
import type { Actor, DrillRun, Node } from "./types.js";

export type PackRunPgnErrorCode =
  | "INVALID_PACK"
  | "PACK_DIGEST_MISMATCH"
  | "PACK_ID_MISMATCH"
  | "START_FEN_MISMATCH";

export class PackRunPgnError extends Error {
  readonly code: PackRunPgnErrorCode;

  constructor(code: PackRunPgnErrorCode, message: string) {
    super(message);
    this.name = "PackRunPgnError";
    this.code = code;
  }
}

interface PathMove {
  readonly uci: string;
  readonly actor: Actor;
}

interface CombinedPath {
  readonly label: string;
  readonly intent: "authored-spine" | "played-run";
  readonly moves: readonly PathMove[];
}

function authoredPaths(
  nodes: readonly SpineNode[],
  prefix: readonly PathMove[] = [],
): readonly CombinedPath[] {
  return nodes.flatMap((node) => {
    const moves = [...prefix, { uci: node.moveUci, actor: "system" as const }];
    return node.children.length === 0
      ? [{ label: `authored:${node.id}`, intent: "authored-spine", moves }]
      : authoredPaths(node.children, moves);
  });
}

function playedPaths(
  run: DrillRun,
  branchIds?: readonly string[],
): readonly CombinedPath[] {
  const selected = branchIds === undefined ? undefined : new Set(branchIds);
  return run.branches.filter((branch) => selected?.has(branch.id) ?? true).map((branch) => ({
    label: `run:${branch.label}`,
    intent: "played-run",
    moves: branchPath(run, branch.id).slice(1).map((node) => {
      if (node.moveUci === null) {
        throw new TypeError(`Run branch contains a move node without UCI: ${node.id}`);
      }
      return {
        uci: node.moveUci,
        // The combined run is a serialization projection, not a replay log.
        // Opponent provenance remains in the source run; committing the move
        // as system avoids fabricating an opponent.move_selected event.
        actor: node.actor === "opponent" ? "system" : node.actor,
      };
    }),
  }));
}

function uniquePaths(paths: readonly CombinedPath[]): readonly CombinedPath[] {
  const byMoves = new Map<string, CombinedPath>();
  for (const path of paths) {
    const key = path.moves.map((move) => move.uci).join(" ");
    if (!byMoves.has(key)) byMoves.set(key, path);
  }
  return [...byMoves.values()];
}

function sharedPrefix(
  run: DrillRun,
  moves: readonly PathMove[],
): { readonly node: Node; readonly length: number } {
  let node = run.nodes[0]!;
  let length = 0;
  for (const move of moves) {
    const child = run.nodes.find(
      (candidate) => candidate.parentId === node.id && candidate.moveUci === move.uci,
    );
    if (!child) break;
    node = child;
    length += 1;
  }
  return { node, length };
}

function appendPath(run: DrillRun, path: CombinedPath, first: boolean): DrillRun {
  let next = run;
  let offset = 0;
  if (!first) {
    const prefix = sharedPrefix(next, path.moves);
    if (prefix.length === path.moves.length) return next;
    next = fork(next, prefix.node.id, {
      label: path.label,
      intent: path.intent,
    }).run;
    offset = prefix.length;
  }

  for (const move of path.moves.slice(offset)) {
    next = commitMove(next, move.uci, { actor: move.actor }).run;
  }
  return next;
}

function combinedRun(
  pack: DrillPackDefinition,
  source: DrillRun,
  branchIds?: readonly string[],
): DrillRun {
  const paths = uniquePaths([
    ...authoredPaths(pack.spine ?? []),
    ...playedPaths(source, branchIds),
  ]);
  const createdAt = source.events[0]?.at;
  let combined = createRun({
    id: `${source.id}:combined-pgn`,
    packId: source.packId,
    packDigest: source.packDigest,
    policyConfig: source.policyConfig,
    startFen: pack.start.fen,
    seed: source.branches[0]?.seed ?? 0,
    ...(createdAt === undefined ? {} : { createdAt }),
  });
  for (const [index, path] of paths.entries()) {
    combined = appendPath(combined, path, index === 0);
  }
  return combined;
}

/**
 * Merge every authored spine leaf and every played run branch into one legal PGN
 * variation tree. Pack validation comes from the schema package; final run-path
 * validation and PGN serialization remain owned by the runtime.
 */
export async function exportPackRunPgn(
  pack: DrillPackDefinition,
  run: DrillRun,
  branchIds?: readonly string[],
): Promise<string> {
  const lintErrors = lintDrillPack(pack).filter((issue) => issue.severity === "error");
  if (lintErrors.length > 0) {
    throw new PackRunPgnError(
      "INVALID_PACK",
      `Pack failed semantic lint: ${lintErrors.map((issue) => issue.code).join(", ")}`,
    );
  }
  if (pack.id !== run.packId) {
    throw new PackRunPgnError(
      "PACK_ID_MISMATCH",
      `Pack ${pack.id} does not match run pack ${run.packId}`,
    );
  }
  if ((await digestDrillPack(pack)) !== run.packDigest) {
    throw new PackRunPgnError(
      "PACK_DIGEST_MISMATCH",
      "Pack document does not match the digest recorded by the run",
    );
  }

  const root = run.nodes[0];
  const packStart = canonicalFen(positionFromFen(pack.start.fen));
  if (!root || root.parentId !== null || root.fen !== packStart) {
    throw new PackRunPgnError(
      "START_FEN_MISMATCH",
      "Pack start position does not match the run root",
    );
  }

  exportPgn(run, branchIds);
  return exportPgn(combinedRun(pack, run, branchIds));
}
