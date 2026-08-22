// DISPOSABLE research harness — D772/Phase 2b. Not production code.
import { writeFileSync } from "node:fs";

import { attacks } from "chessops/attacks";
import { Chess } from "chessops/chess";
import type { Color, Role, Square } from "chessops/types";
import { opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
  captureAt,
  legalCaptureMovesTo,
  legalExchangeForMove,
  researchPosition,
} from "../research-chess/legal-exchange.js";
import {
  authoredTriples,
  importedPopulation,
  pathTriples,
  playedFen,
  type ResearchTriple,
} from "../research-chess/populations.js";

const OUTPUT = new URL("./output.md", import.meta.url).pathname;

interface DefenseEdge {
  readonly defender: Square;
  readonly defenderRole: Role;
  readonly target: Square;
  readonly targetRole: Role;
  readonly color: Color;
}

interface SequenceCounts {
  readonly triples: number;
  readonly edgeLost: number;
  readonly defenderCaptured: number;
  readonly defenderRelocated: number;
  readonly examples: readonly string[];
}

function edgeKey(edge: DefenseEdge): string {
  return `${edge.color}:${edge.defender}:${edge.defenderRole}:${edge.target}:${edge.targetRole}`;
}

function defenseEdges(pos: Chess, color: Color): ReadonlyMap<string, DefenseEdge> {
  const result = new Map<string, DefenseEdge>();
  for (const [defender, piece] of pos.board) {
    if (piece.color !== color) continue;
    for (const target of attacks(piece, defender, pos.board.occupied)) {
      const targetPiece = pos.board.get(target);
      if (targetPiece?.color !== color) continue;
      const edge = { defender, defenderRole: piece.role, target, targetRole: targetPiece.role, color };
      result.set(edgeKey(edge), edge);
    }
  }
  return result;
}

function samePiece(pos: Chess, square: Square, color: Color, role: Role): boolean {
  return pos.board.getColor(square) === color && pos.board.getRole(square) === role;
}

function positiveCapture(pos: Chess, square: Square, fromOnly?: Square): boolean {
  return legalCaptureMovesTo(pos, square, fromOnly)
    .some((move) => (legalExchangeForMove(pos, move) ?? 0) > 0);
}

function flipped(pos: Chess, turn: Color): Chess | undefined {
  const result = Chess.fromSetup({ ...pos.toSetup(), turn, epSquare: undefined });
  return result.isOk ? result.value : undefined;
}

function thirdMoveCapturesTarget(triple: ResearchTriple, edge: DefenseEdge): boolean {
  const before = researchPosition(triple[2].parentFen);
  const move = parseUci(triple[2].uci);
  if (move === undefined || !("from" in move) || move.to !== edge.target || !before.isLegal(move)) return false;
  const captured = captureAt(before, move);
  return captured?.color === edge.color && captured.role === edge.targetRole &&
    (legalExchangeForMove(before, move) ?? 0) > 0;
}

function firstMoveCapturedDefender(triple: ResearchTriple, edge: DefenseEdge): boolean {
  const before = researchPosition(triple[0].parentFen);
  const move = parseUci(triple[0].uci);
  if (move === undefined || !("from" in move) || move.to !== edge.defender) return false;
  const captured = captureAt(before, move);
  return captured?.color === edge.color && captured.role === edge.defenderRole;
}

function defenderHarassedThenRelocated(triple: ResearchTriple, edge: DefenseEdge): boolean {
  const beforeFirst = researchPosition(triple[0].parentFen);
  if (positiveCapture(beforeFirst, edge.defender)) return false;
  const afterFirst = researchPosition(triple[0].fen);
  const mover = beforeFirst.turn;
  const moverAgain = flipped(afterFirst, mover);
  if (moverAgain === undefined || !positiveCapture(moverAgain, edge.defender)) return false;

  const reply = parseUci(triple[1].uci);
  if (reply === undefined || !("from" in reply) || reply.from !== edge.defender) return false;
  const replyBefore = researchPosition(triple[1].parentFen);
  const defender = replyBefore.board.get(reply.from);
  if (defender?.color !== edge.color || defender.role !== edge.defenderRole) return false;
  const afterReply = researchPosition(triple[1].fen);
  if (!samePiece(afterReply, reply.to, edge.color, edge.defenderRole)) return false;
  return ![...defenseEdges(afterReply, edge.color).values()].some((next) =>
    next.defender === reply.to && next.defenderRole === edge.defenderRole &&
    next.target === edge.target && next.targetRole === edge.targetRole);
}

function classify(triple: ResearchTriple): { edgeLost: boolean; captured: boolean; relocated: boolean } {
  const before = researchPosition(triple[0].parentFen);
  const enemy = opposite(before.turn);
  const afterFirst = researchPosition(triple[0].fen);
  const afterReply = researchPosition(triple[1].fen);
  const nextEdges = defenseEdges(afterFirst, enemy);
  let edgeLost = false;
  let captured = false;
  let relocated = false;
  for (const edge of defenseEdges(before, enemy).values()) {
    if (!samePiece(afterFirst, edge.target, enemy, edge.targetRole) ||
      !samePiece(afterReply, edge.target, enemy, edge.targetRole) ||
      !thirdMoveCapturesTarget(triple, edge)) continue;
    if (!nextEdges.has(edgeKey(edge))) edgeLost = true;
    if (firstMoveCapturedDefender(triple, edge)) captured = true;
    if (defenderHarassedThenRelocated(triple, edge)) relocated = true;
  }
  return { edgeLost, captured, relocated };
}

function census(triples: readonly ResearchTriple[]): SequenceCounts {
  let edgeLost = 0; let defenderCaptured = 0; let defenderRelocated = 0;
  const examples: string[] = [];
  for (const triple of triples) {
    const value = classify(triple);
    if (value.edgeLost) edgeLost += 1;
    if (value.captured) defenderCaptured += 1;
    if (value.relocated) defenderRelocated += 1;
    if ((value.edgeLost || value.captured || value.relocated) && examples.length < 12) {
      examples.push(`${triple[0].id} ${triple.map((row) => row.uci).join(" ")} [${value.edgeLost ? "edge-lost" : ""}${value.captured ? ",captured" : ""}${value.relocated ? ",relocated" : ""}]`);
    }
  }
  return { triples: triples.length, edgeLost, defenderCaptured, defenderRelocated, examples };
}

function tripleFromMoves(fen: string, moves: readonly string[]): ResearchTriple {
  const rows = [];
  let current = fen;
  for (let index = 0; index < moves.length; index += 1) {
    const uci = moves[index]!;
    const next = playedFen(current, uci);
    rows.push({ id: `fixture#${index + 1}`, parentFen: current, fen: next, uci });
    current = next;
  }
  return rows as unknown as ResearchTriple;
}

describe("D772 three-edge identity retention", () => {
  it("recognizes captured-defender then target-capture without claiming force", () => {
    const triple = tripleFromMoves("r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", ["c5b6", "e8d7", "a1a8"]);
    expect(classify(triple)).toEqual({ edgeLost: true, captured: true, relocated: false });
  });

  it("recognizes newly harassed defender relocation then target-capture", () => {
    const triple = tripleFromMoves("r3k3/8/1n6/8/2P5/8/8/R3K3 w - - 0 1", ["c4c5", "b6d7", "a1a8"]);
    expect(classify(triple)).toEqual({ edgeLost: false, captured: false, relocated: true });
  });

  it("rejects target replacement and a locally losing third capture", () => {
    const replaced = tripleFromMoves("r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", ["c5b6", "a8a7", "a1a7"]);
    expect(classify(replaced)).toEqual({ edgeLost: false, captured: false, relocated: false });

    const poisoned = tripleFromMoves("k2r4/8/4p3/3p1B2/8/8/8/K2Q4 w - - 0 1", ["f5e6", "a8a7", "d1d5"]);
    expect(classify(poisoned)).toEqual({ edgeLost: false, captured: false, relocated: false });
  });

  it("censuses authored and imported observed continuations", () => {
    const imported = importedPopulation();
    const populations = [
      { name: "authored branch paths", triples: authoredTriples() },
      { name: "sealed imported games", triples: pathTriples(imported.paths) },
    ];
    const lines = ["# D772 output", "", "Observed three-ply paths establish prevalence only; they do not establish force, causality, quality, or played-vs-alternative lift.", "",
      "| population | consecutive triples | edge lost after first, target captured third | exact defender captured first | newly harassed defender relocated on reply |",
      "|---|---:|---:|---:|---:|"];
    for (const population of populations) {
      const result = census(population.triples);
      lines.push(`| ${population.name} | ${result.triples} | ${result.edgeLost} | ${result.defenderCaptured} | ${result.defenderRelocated} |`);
      if (result.examples.length > 0) lines.push("", `${population.name} examples: ${result.examples.map((item) => `\`${item}\``).join(", ")}.`, "");
    }
    writeFileSync(OUTPUT, `${lines.join("\n")}\n`, "utf8");
    expect(populations[0]!.triples.length).toBeGreaterThan(500);
    expect(populations[1]!.triples.length).toBeGreaterThan(6_000);
  });
});
