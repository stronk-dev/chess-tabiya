// DISPOSABLE research harness — R9 (planning/exploration/plan.md).
// Not production code. Walks the committed pack corpus and records, for every
// decision position, the ply from the standard game start (derived from the FEN's
// own fullmove counter and side to move) plus the pack-relative spine depth.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { isNormal } from "chessops/types";
import { makeSan } from "chessops/san";
import { parseUci } from "chessops/util";

interface SpineNode {
  readonly id: string;
  readonly moveUci: string;
  readonly children?: readonly SpineNode[];
}
interface Deviation {
  readonly at: { readonly fen?: string; readonly spineNodeId?: string };
  readonly moveUci: string;
  readonly class?: string;
}
interface Pack {
  readonly id: string;
  readonly phase: string;
  readonly mode: string;
  readonly start: { readonly fen: string; readonly side?: string };
  readonly objective?: { readonly type?: string };
  readonly spine?: readonly SpineNode[];
  readonly deviations?: readonly Deviation[];
}

export interface ExtractedPosition {
  readonly packId: string;
  readonly phase: string;
  readonly origin: "spine" | "deviation";
  readonly fen: string;
  readonly pieceCount: number;
  readonly legalUci: readonly string[];
  /** Ply from the standard game start, derived from the FEN counters. */
  readonly ply: number;
  /** Plies below the pack's own root. */
  readonly spineDepth: number;
  /** Whether every node on the path to here was its parent's first child. */
  readonly mainLine: boolean;
  /** SAN of the authored continuation from this position, when there is one. */
  readonly nextSan: string | null;
  readonly nextUci: string | null;
  /** FEN after the authored continuation, for the transposition-inflow measurement. */
  readonly nextFen: string | null;
  readonly startFen: string;
  readonly spineNodeId: string | null;
}

function pieceCount(fen: string): number {
  return (fen.split(" ")[0] ?? "").replace(/[^a-zA-Z]/gu, "").length;
}

function plyFromFen(fen: string): number {
  const fields = fen.split(" ");
  const fullmove = Number(fields[5] ?? "1");
  return (fullmove - 1) * 2 + (fields[1] === "b" ? 1 : 0);
}

function legalMoves(fen: string): readonly string[] {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const out: string[] = [];
  for (const [from, targets] of position.allDests()) {
    for (const to of targets) {
      const isPawn = position.board.getRole(from) === "pawn";
      const rank = to >> 3;
      if (isPawn && (rank === 0 || rank === 7)) {
        for (const promotion of ["queen", "rook", "bishop", "knight"] as const) {
          out.push(`${String.fromCharCode(97 + (from & 7))}${(from >> 3) + 1}${String.fromCharCode(97 + (to & 7))}${(to >> 3) + 1}${{ queen: "q", rook: "r", bishop: "b", knight: "n" }[promotion]}`);
        }
      } else {
        out.push(`${String.fromCharCode(97 + (from & 7))}${(from >> 3) + 1}${String.fromCharCode(97 + (to & 7))}${(to >> 3) + 1}`);
      }
    }
  }
  return out.sort();
}

const nodeFens = new Map<string, string>();

function walk(
  pack: Pack,
  node: SpineNode,
  position: Chess,
  depth: number,
  onMainLine: boolean,
  sink: ExtractedPosition[],
): void {
  const fen = makeFen(position.toSetup());
  const move = parseUci(node.moveUci);
  if (move === undefined || !isNormal(move) || !position.isLegal(move)) {
    throw new Error(`${pack.id}: illegal spine move ${node.moveUci} at ${fen}`);
  }
  const next = position.clone();
  next.play(move);
  sink.push({
    packId: pack.id,
    phase: pack.phase,
    origin: "spine",
    fen,
    pieceCount: pieceCount(fen),
    legalUci: legalMoves(fen),
    ply: plyFromFen(fen),
    spineDepth: depth,
    mainLine: onMainLine,
    nextSan: makeSan(position, move),
    nextUci: node.moveUci,
    nextFen: makeFen(next.toSetup()),
    startFen: pack.start.fen,
    spineNodeId: node.id,
  });
  // A deviation anchored at a node is played FROM the position that node's move
  // reaches (verified against anti-scandinavian-white: `p4-qxd5` + `d2d4` is White's
  // third-move alternative, i.e. the position after ...Qxd5).
  nodeFens.set(`${pack.id}|${node.id}`, makeFen(next.toSetup()));
  const children = node.children ?? [];
  children.forEach((child, index) => walk(pack, child, next, depth + 1, onMainLine && index === 0, sink));
  if (children.length === 0 && !next.isEnd()) {
    const leafFen = makeFen(next.toSetup());
    sink.push({
      packId: pack.id,
      phase: pack.phase,
      origin: "spine",
      fen: leafFen,
      pieceCount: pieceCount(leafFen),
      legalUci: legalMoves(leafFen),
      ply: plyFromFen(leafFen),
      spineDepth: depth + 1,
      mainLine: onMainLine,
      nextSan: null,
      nextUci: null,
      nextFen: null,
      startFen: pack.start.fen,
      spineNodeId: null,
    });
  }
}

function main(): void {
  const dir = process.argv[2]!;
  const out = process.argv[3]!;
  const positions: ExtractedPosition[] = [];
  const deviations: { packId: string; anchorFen: string | null; moveUci: string; class: string }[] = [];
  const packs: { id: string; phase: string; rootPly: number; nodes: number }[] = [];
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith(".json")) continue;
    if (/\.(evidence|job|sources|browser)\.json$/u.test(file)) continue;
    const pack = JSON.parse(readFileSync(join(dir, file), "utf8")) as Pack;
    if (pack.start?.fen === undefined) continue;
    const before = positions.length;
    const root = Chess.fromSetup(parseFen(pack.start.fen).unwrap()).unwrap();
    (pack.spine ?? []).forEach((node, index) => walk(pack, node, root.clone(), 0, index === 0, positions));
    if ((pack.spine ?? []).length === 0) {
      const fen = pack.start.fen;
      positions.push({
        packId: pack.id, phase: pack.phase, origin: "spine", fen, pieceCount: pieceCount(fen),
        legalUci: legalMoves(fen), ply: plyFromFen(fen), spineDepth: 0, mainLine: true,
        nextSan: null, nextUci: null, nextFen: null, startFen: fen, spineNodeId: null,
      });
    }
    for (const deviation of pack.deviations ?? []) {
      deviations.push({
        packId: pack.id,
        anchorFen: deviation.at.fen ?? nodeFens.get(`${pack.id}|${deviation.at.spineNodeId ?? ""}`) ?? null,
        moveUci: deviation.moveUci,
        class: deviation.class ?? "n/a",
      });
      const fen = deviation.at.fen;
      if (fen === undefined) continue;
      positions.push({
        packId: pack.id, phase: pack.phase, origin: "deviation", fen, pieceCount: pieceCount(fen),
        legalUci: legalMoves(fen), ply: plyFromFen(fen), spineDepth: -1, mainLine: false,
        nextSan: null, nextUci: null, nextFen: null, startFen: pack.start.fen, spineNodeId: null,
      });
    }
    packs.push({ id: pack.id, phase: pack.phase, rootPly: plyFromFen(pack.start.fen), nodes: positions.length - before });
  }
  const seen = new Set<string>();
  const unique = positions.filter((entry) => {
    if (seen.has(entry.fen)) return false;
    seen.add(entry.fen);
    return true;
  });
  writeFileSync(out, JSON.stringify({ packs, positions: unique, deviations }, null, 1));
  const byPhase = new Map<string, number>();
  for (const entry of unique) byPhase.set(entry.phase, (byPhase.get(entry.phase) ?? 0) + 1);
  process.stdout.write(
    `packs=${packs.length} raw=${positions.length} unique=${unique.length} ` +
      `${[...byPhase].map(([k, v]) => `${k}=${v}`).join(" ")} ` +
      `outOfRange=${unique.filter((p) => p.pieceCount > 7).length} ` +
      `deviations=${deviations.length} withAnchor=${deviations.filter((d) => d.anchorFen !== null).length}\n`,
  );
}

main();
