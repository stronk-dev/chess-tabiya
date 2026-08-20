// DISPOSABLE research harness — not production detector code.
import { readFileSync, writeFileSync } from "node:fs";

import { attacks, between } from "chessops/attacks";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import type { Color, Role, Square } from "chessops/types";
import { opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

const SOURCE = process.env.TABIYA_LICHESS_PUZZLES;
const OUT = new URL("./output.md", import.meta.url).pathname;
const LIMIT = Number.parseInt(process.env.TABIYA_PUZZLE_LIMIT ?? "50000", 10);
const VALUE: Readonly<Record<Role, number>> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 100,
};
const THEMES = ["fork", "pin", "discoveredAttack", "hangingPiece"] as const;
type Theme = (typeof THEMES)[number];

interface PuzzleRow {
  readonly id: string;
  readonly fen: string;
  readonly moves: readonly string[];
  readonly themes: ReadonlySet<string>;
}

function position(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

function rows(): readonly PuzzleRow[] {
  if (!SOURCE) throw new TypeError("Set TABIYA_LICHESS_PUZZLES to the official CSV path");
  const lines = readFileSync(SOURCE, "utf8").split("\n").slice(1, LIMIT + 1);
  return lines.filter(Boolean).map((line) => {
    // The export fields used here contain no commas. Abort rather than silently parse
    // a changed format as evidence.
    const fields = line.split(",");
    if (fields.length !== 11) throw new TypeError(`Unexpected CSV field count: ${fields.length}`);
    return {
      id: fields[0]!,
      fen: fields[1]!,
      moves: fields[2]!.split(" "),
      themes: new Set(fields[7]!.split(" ")),
    };
  });
}

function attackCount(pos: Chess, color: Color, target: Square): number {
  let count = 0;
  for (const [square, piece] of pos.board) {
    if (piece.color === color && attacks(piece, square, pos.board.occupied).has(target)) count += 1;
  }
  return count;
}

function cheapFork(pos: Chess, to: Square): boolean {
  const moved = pos.board.get(to);
  if (!moved || moved.role === "king") return false;
  let targets = 0;
  for (const target of attacks(moved, to, pos.board.occupied)) {
    const victim = pos.board.get(target);
    if (victim?.color === opposite(moved.color) && VALUE[victim.role] >= 3) targets += 1;
  }
  return targets >= 2;
}

function hasAbsolutePin(pos: Chess, pinnedColor: Color): boolean {
  const king = pos.board.kingOf(pinnedColor);
  if (king === undefined) return false;
  for (const [square, piece] of pos.board) {
    if (piece.color === pinnedColor || !["bishop", "rook", "queen"].includes(piece.role)) continue;
    const span = between(square, king);
    if (span.isEmpty()) continue;
    const blockers = [...span.intersect(pos.board.occupied)];
    if (blockers.length !== 1 || pos.board.getColor(blockers[0]!) !== pinnedColor) continue;
    if (attacks(piece, square, pos.board.occupied.without(blockers[0]!)).has(king)) return true;
  }
  return false;
}

function cheapHangingCapture(before: Chess, to: Square): boolean {
  const victim = before.board.get(to);
  if (!victim || victim.role === "pawn" || victim.role === "king") return false;
  return attackCount(before, opposite(victim.color), to) > 0 && attackCount(before, victim.color, to) === 0;
}

function sliderTargets(pos: Chess, color: Color): ReadonlySet<string> {
  const result = new Set<string>();
  for (const [square, piece] of pos.board) {
    if (piece.color !== color || !["bishop", "rook", "queen"].includes(piece.role)) continue;
    for (const target of attacks(piece, square, pos.board.occupied)) {
      const victim = pos.board.get(target);
      if (victim?.color === opposite(color)) result.add(`${square}:${target}`);
    }
  }
  return result;
}

function cheapDiscoveredAttack(before: Chess, after: Chess, from: Square, mover: Color): boolean {
  const beforeTargets = sliderTargets(before, mover);
  for (const target of sliderTargets(after, mover)) {
    if (beforeTargets.has(target)) continue;
    const [sliderText] = target.split(":");
    const slider = Number.parseInt(sliderText!, 10) as Square;
    if (between(slider, Number.parseInt(target.split(":")[1]!, 10) as Square).has(from)) return true;
  }
  return false;
}

function detectedByMove(pos: Chess, uci: string): ReadonlySet<Theme> {
  const found = new Set<Theme>();
  const parsed = parseUci(uci);
  if (!parsed || !("from" in parsed) || !pos.isLegal(parsed)) return found;
  const before = pos.clone();
  const mover = pos.turn;
  const pinBefore = hasAbsolutePin(pos, opposite(mover));
  const hanging = cheapHangingCapture(pos, parsed.to);
  pos.play(parsed);
  if (cheapFork(pos, parsed.to)) found.add("fork");
  if (!pinBefore && hasAbsolutePin(pos, opposite(mover))) found.add("pin");
  if (cheapDiscoveredAttack(before, pos, parsed.from, mover)) found.add("discoveredAttack");
  if (hanging) found.add("hangingPiece");
  return found;
}

function detectedThemes(row: PuzzleRow): ReadonlySet<Theme> {
  const found = new Set<Theme>();
  const pos = position(row.fen);
  for (let index = 0; index < row.moves.length; index += 1) {
    const uci = row.moves[index]!;
    const parsed = parseUci(uci);
    if (!parsed || !("from" in parsed) || !pos.isLegal(parsed)) break;
    if (index % 2 === 0) pos.play(parsed);
    else for (const theme of detectedByMove(pos, uci)) found.add(theme);
  }
  return found;
}

function fileMirrorFen(fen: string): string {
  const fields = fen.split(" ");
  const board = fields[0]!.split("/").map((rank) => {
    const expanded = [...rank].flatMap((token) => /\d/u.test(token) ? Array(Number(token)).fill("1") : [token]);
    const reversed = expanded.reverse();
    let compressed = "";
    let empty = 0;
    for (const token of reversed) {
      if (token === "1") empty += 1;
      else {
        if (empty) compressed += String(empty);
        empty = 0;
        compressed += token;
      }
    }
    return compressed + (empty ? String(empty) : "");
  }).join("/");
  const rights = fields[2] === "-" ? "-" : [...fields[2]!]
    .map((right) => ({ K: "Q", Q: "K", k: "q", q: "k" } as const)[right as "K" | "Q" | "k" | "q"])
    .sort((a, b) => "KQkq".indexOf(a) - "KQkq".indexOf(b)).join("");
  const ep = fields[3] === "-" ? "-" : `${String.fromCharCode(104 - (fields[3]!.charCodeAt(0) - 97))}${fields[3]![1]}`;
  return [board, fields[1], rights, ep, fields[4], fields[5]].join(" ");
}

function fileMirrorUci(uci: string): string {
  const mirrorSquare = (square: string) => `${String.fromCharCode(104 - (square.charCodeAt(0) - 97))}${square[1]}`;
  return `${mirrorSquare(uci.slice(0, 2))}${mirrorSquare(uci.slice(2, 4))}${uci.slice(4)}`;
}

function mirrored(row: PuzzleRow): PuzzleRow {
  return { ...row, fen: fileMirrorFen(row.fen), moves: row.moves.map(fileMirrorUci) };
}

describe("cheap detector agreement with Lichess themes", () => {
  it("measures positives, negatives, abstention and disagreement", { timeout: 30_000 }, () => {
    const puzzles = rows();
    const matrix = new Map<Theme, { tp: number; fp: number; fn: number; tn: number; fpIds: string[]; fnIds: string[]; alt: number; altN: number }>();
    for (const theme of THEMES) matrix.set(theme, { tp: 0, fp: 0, fn: 0, tn: 0, fpIds: [], fnIds: [], alt: 0, altN: 0 });

    for (const row of puzzles) {
      const detected = detectedThemes(row);
      for (const theme of THEMES) {
        const reference = row.themes.has(theme);
        const predicted = detected.has(theme);
        const cell = matrix.get(theme)!;
        if (reference && predicted) cell.tp += 1;
        else if (!reference && predicted) {
          cell.fp += 1;
          if (cell.fpIds.length < 5) cell.fpIds.push(row.id);
        } else if (reference) {
          cell.fn += 1;
          if (cell.fnIds.length < 5) cell.fnIds.push(row.id);
        }
        else cell.tn += 1;
      }

      const presented = position(row.fen);
      const setup = parseUci(row.moves[0]!);
      if (!setup || !("from" in setup) || !presented.isLegal(setup)) continue;
      presented.play(setup);
      const solution = row.moves[1];
      if (!solution) continue;
      for (const [from, destinations] of presented.allDests()) for (const to of destinations) {
        const prefix = `${String.fromCharCode(97 + from % 8)}${1 + Math.floor(from / 8)}${String.fromCharCode(97 + to % 8)}${1 + Math.floor(to / 8)}`;
        const promotions = presented.board.getRole(from) === "pawn" && (to < 8 || to >= 56)
          ? ["q", "r", "b", "n"] as const
          : [""] as const;
        for (const promotion of promotions) {
          const uci = `${prefix}${promotion}`;
          if (uci === solution) continue;
          const detected = detectedByMove(presented.clone(), uci);
          for (const theme of THEMES) if (row.themes.has(theme)) {
            const cell = matrix.get(theme)!;
            cell.altN += 1;
            if (detected.has(theme)) cell.alt += 1;
          }
        }
      }
    }

    const lines = [
      "# Detection-landscape output",
      "",
      `Population: first ${puzzles.length.toLocaleString("en-US")} complete rows from the bounded Lichess puzzle-export prefix.`,
      "",
      "| cheap detector | tagged positives | recall vs tag | precision vs tag | predicted rate | legal-alternative fire rate |",
      "|---|---:|---:|---:|---:|---:|",
    ];
    for (const theme of THEMES) {
      const { tp, fp, fn, alt, altN } = matrix.get(theme)!;
      const recall = tp / (tp + fn);
      const precision = tp / (tp + fp);
      const predicted = (tp + fp) / puzzles.length;
      lines.push(`| \`${theme}\` | ${(tp + fn).toLocaleString("en-US")} | ${(100 * recall).toFixed(1)}% | ${(100 * precision).toFixed(1)}% | ${(100 * predicted).toFixed(2)}% | ${(100 * alt / altN).toFixed(2)}% (${alt.toLocaleString("en-US")}/${altN.toLocaleString("en-US")}) |`);
    }
    lines.push("", "First disagreement IDs (for reproducible hard-negative inspection):", "");
    for (const theme of THEMES) {
      const { fpIds, fnIds } = matrix.get(theme)!;
      lines.push(`- \`${theme}\`: false-positive candidates ${fpIds.join(", ") || "none"}; false-negative candidates ${fnIds.join(", ") || "none"}.`);
    }
    lines.push(
      "",
      "Interpretation: this is agreement with an automatically generated, vote-refined reference, not manual ground truth. Low agreement can mean an over-broad cheap definition, a line-level semantic mismatch, or a missed event. It is evidence against promoting the cheap probe unchanged.",
      "",
    );
    writeFileSync(OUT, lines.join("\n"), "utf8");
    expect(puzzles.length).toBeGreaterThan(10_000);
  });

  it("is invariant under a file mirror", () => {
    for (const row of rows().slice(0, 250)) {
      expect([...detectedThemes(mirrored(row))].sort(), row.id).toEqual([...detectedThemes(row)].sort());
    }
  });
});
