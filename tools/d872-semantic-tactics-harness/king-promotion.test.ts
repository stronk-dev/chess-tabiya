// DISPOSABLE research harness — D872/Wave C king/promotion arm. Not production detector code.
import { writeFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import type { Color, Square } from "chessops/types";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { captureAt, researchPosition } from "../research-chess/legal-exchange.js";
import {
  authoredRows,
  importedRows,
  legalOutcomes,
  playedFen,
  type ResearchRow,
} from "../research-chess/populations.js";

const OUTPUT = new URL("./king-promotion-output.md", import.meta.url).pathname;

function mateDelivered(fen: string): boolean {
  const pos = researchPosition(fen);
  return pos.isCheck() && legalOutcomes(fen).length === 0;
}

function hasMateInOne(fen: string): boolean {
  return legalOutcomes(fen).some((outcome) => mateDelivered(outcome.fen));
}

function mateOnNextOwnMoveAfterEveryReply(afterFen: string): boolean {
  const replies = legalOutcomes(afterFen);
  return replies.length > 0 && replies.every((reply) => hasMateInOne(reply.fen));
}

function squareText(square: Square): string {
  return `${String.fromCharCode(97 + square % 8)}${1 + Math.floor(square / 8)}`;
}

function promotionAvailable(fen: string, pawn: Square): boolean {
  const prefix = squareText(pawn);
  return legalOutcomes(fen).some((outcome) => outcome.uci.startsWith(prefix) && outcome.uci.length === 5);
}

function withTurn(fen: string, turn: Color): Chess | undefined {
  const pos = researchPosition(fen);
  const result = Chess.fromSetup({ ...pos.toSetup(), turn, epSquare: undefined });
  return result.isOk ? result.value : undefined;
}

function promotionAvailableUnderPass(afterFen: string, pawn: Square, mover: Color): boolean {
  const pass = withTurn(afterFen, mover);
  if (pass === undefined || pass.board.getColor(pawn) !== mover || pass.board.getRole(pawn) !== "pawn") return false;
  const prefix = squareText(pawn);
  for (const [from, dests] of pass.allDests()) {
    if (from !== pawn) continue;
    for (const to of dests) {
      if ((to < 8 || to >= 56) && `${prefix}${squareText(to)}`.length === 4) return true;
    }
  }
  return false;
}

function promotionAfterEveryReply(afterFen: string, pawn: Square, mover: Color): boolean {
  const replies = legalOutcomes(afterFen);
  return replies.length > 0 && replies.every((reply) => promotionAvailable(reply.fen, pawn) &&
    researchPosition(reply.fen).board.getColor(pawn) === mover);
}

function advancedPawns(afterFen: string, mover: Color): readonly Square[] {
  const pos = researchPosition(afterFen);
  const rank = mover === "white" ? 6 : 1;
  const result: Square[] = [];
  for (const [square, piece] of pos.board) {
    if (piece.color === mover && piece.role === "pawn" && Math.floor(square / 8) === rank) result.push(square);
  }
  return result;
}

function quiet(row: ResearchRow): boolean {
  const before = researchPosition(row.parentFen);
  const move = parseUci(row.uci);
  return move !== undefined && "from" in move && captureAt(before, move) === undefined && !researchPosition(row.fen).isCheck();
}

function measure(rows: readonly ResearchRow[]) {
  let mateNextEveryReply = 0;
  let advancedPawnRows = 0;
  let promotionUnderPassRows = 0;
  let promotionEveryReplyRows = 0;
  let quietPromotionUnderPassRows = 0;
  let quietPromotionEveryReplyRows = 0;
  const mateExamples: string[] = [];
  const promotionExamples: string[] = [];
  for (const row of rows) {
    const before = researchPosition(row.parentFen);
    if (mateOnNextOwnMoveAfterEveryReply(row.fen)) {
      mateNextEveryReply += 1;
      if (mateExamples.length < 6) mateExamples.push(`${row.id}:${row.uci}`);
    }
    const pawns = advancedPawns(row.fen, before.turn);
    if (pawns.length === 0) continue;
    advancedPawnRows += 1;
    const pass = pawns.some((pawn) => promotionAvailableUnderPass(row.fen, pawn, before.turn));
    const every = pawns.some((pawn) => promotionAfterEveryReply(row.fen, pawn, before.turn));
    if (pass) promotionUnderPassRows += 1;
    if (every) {
      promotionEveryReplyRows += 1;
      if (promotionExamples.length < 6) promotionExamples.push(`${row.id}:${row.uci}`);
    }
    if (quiet(row) && pass) quietPromotionUnderPassRows += 1;
    if (quiet(row) && every) quietPromotionEveryReplyRows += 1;
  }
  return { mateNextEveryReply, advancedPawnRows, promotionUnderPassRows, promotionEveryReplyRows,
    quietPromotionUnderPassRows, quietPromotionEveryReplyRows, mateExamples, promotionExamples };
}

function row(fen: string, uci: string): ResearchRow {
  return { id: "fixture", parentFen: fen, uci, fen: playedFen(fen, uci) };
}

describe("D872 exact king/promotion consequence boundary", () => {
  it("recognizes a published mate-in-two first move as mate on the next own move under every reply", () => {
    const candidate = row("4r3/1k6/pp3P2/1b5p/3R1p2/P1R2P2/1P4PP/6K1 b - - 0 35", "e8e1");
    expect(mateOnNextOwnMoveAfterEveryReply(candidate.fen)).toBe(true);
  });

  it("distinguishes a persistent promotion from a pawn the opponent can remove", () => {
    const stable = row("7k/8/P7/8/8/8/8/7K w - - 0 1", "a6a7");
    expect(promotionAvailableUnderPass(stable.fen, 48, "white")).toBe(true);
    expect(promotionAfterEveryReply(stable.fen, 48, "white")).toBe(true);
    const removable = row("7k/1r6/P7/8/8/8/8/7K w - - 0 1", "a6a7");
    expect(promotionAvailableUnderPass(removable.fen, 48, "white")).toBe(true);
    expect(promotionAfterEveryReply(removable.fen, 48, "white")).toBe(false);
  });

  it("measures exact next-own-move consequences on both fixed populations", () => {
    const lines = [
      "# D872 king/promotion consequence census",
      "",
      "Mate-next requires mate in one after every legal opponent reply. Promotion-under-pass is a disclosed null-move state; promotion-every-reply retains the same seventh-rank pawn and requires a legal promotion after every opponent reply. None implies best play, a general mating net, a won race, or whole-position value.",
      "",
      "| population | played rows | mate next under every reply | seventh-rank pawn | promotion under pass | promotion after every reply | quiet + pass | quiet + every reply |",
      "|---|---:|---:|---:|---:|---:|---:|---:|",
    ];
    for (const population of [
      { name: "authored played edges", rows: authoredRows() },
      { name: "sealed imported played edges", rows: importedRows() },
    ]) {
      const result = measure(population.rows);
      lines.push(`| ${population.name} | ${population.rows.length} | ${result.mateNextEveryReply} | ${result.advancedPawnRows} | ${result.promotionUnderPassRows} | ${result.promotionEveryReplyRows} | ${result.quietPromotionUnderPassRows} | ${result.quietPromotionEveryReplyRows} |`);
      lines.push("", `Mate examples: ${result.mateExamples.join(", ") || "none"}.`, `Persistent-promotion examples: ${result.promotionExamples.join(", ") || "none"}.`, "");
    }
    writeFileSync(OUTPUT, lines.join("\n"), "utf8");
  });
});
