// DISPOSABLE research harness — D872/Wave C bounded mating-net arm. Not production code.
import { readFileSync, writeFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import type { Color, Move, Role } from "chessops/types";
import { makeUci, opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

const SOURCE = process.env.TABIYA_LICHESS_PUZZLES;
const OUTPUT = new URL("./bounded-mate-output.md", import.meta.url).pathname;
const SAMPLE = 240;
const NODE_CAP = 250_000;
const PROMOTIONS: readonly Role[] = ["queen", "rook", "bishop", "knight"];

interface Puzzle {
  readonly id: string;
  readonly fen: string;
  readonly moves: readonly string[];
  readonly tag: "mateIn2" | "mateIn3" | "mateIn4" | "mateIn5";
}

interface ProofResult {
  readonly kind: "proved" | "refuted" | "abstained";
  readonly nodes: number;
  readonly rootReplies: number;
  readonly rootCheck: boolean;
}

function stableHash(value: string): number {
  let hash = 2_166_136_261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16_777_619) >>> 0;
  return hash;
}

function samples(): ReadonlyMap<Puzzle["tag"], readonly Puzzle[]> {
  if (!SOURCE) throw new TypeError("Set TABIYA_LICHESS_PUZZLES to the official CSV path");
  const values = new Map<Puzzle["tag"], Puzzle[]>([["mateIn2", []], ["mateIn3", []], ["mateIn4", []], ["mateIn5", []]]);
  for (const line of readFileSync(SOURCE, "utf8").split("\n").slice(1)) {
    const fields = line.split(",");
    if (fields.length !== 11) continue;
    const themes = new Set(fields[7]!.split(" "));
    const tag = (["mateIn2", "mateIn3", "mateIn4", "mateIn5"] as const).find((value) => themes.has(value));
    if (tag !== undefined) values.get(tag)!.push({ id: fields[0]!, fen: fields[1]!, moves: fields[2]!.split(" "), tag });
  }
  return new Map([...values].map(([tag, rows]) => [tag, rows.sort((a, b) => stableHash(a.id) - stableHash(b.id) || a.id.localeCompare(b.id)).slice(0, SAMPLE)]));
}

function legalMoves(pos: Chess): readonly Move[] {
  const result: Move[] = [];
  for (const [from, dests] of pos.allDests()) for (const to of dests) {
    const roles: readonly (Role | undefined)[] = pos.board.getRole(from) === "pawn" && (to < 8 || to >= 56)
      ? PROMOTIONS
      : [undefined];
    for (const promotion of roles) {
      const move: Move = promotion === undefined ? { from, to } : { from, to, promotion };
      if (pos.isLegal(move)) result.push(move);
    }
  }
  return result;
}

function play(pos: Chess, uci: string): void {
  const move = parseUci(uci);
  if (move === undefined || !pos.isLegal(move)) throw new TypeError(`Illegal ${uci} from ${makeFen(pos.toSetup())}`);
  pos.play(move);
}

function proof(puzzle: Puzzle, movesToMate: 2 | 3 | 4 | 5): ProofResult {
  const pos = Chess.fromSetup(parseFen(puzzle.fen).unwrap()).unwrap();
  play(pos, puzzle.moves[0]!); // exported opponent setup edge
  const attacker = pos.turn;
  play(pos, puzzle.moves[1]!); // candidate first move under test
  const rootCheck = pos.isCheck();
  const rootReplies = legalMoves(pos).length;
  let nodes = 0;
  let capped = false;
  const memo = new Map<string, boolean>();
  const visit = (current: Chess, edges: number): boolean => {
    nodes += 1;
    if (nodes > NODE_CAP) { capped = true; return false; }
    if (current.isCheckmate()) return opposite(current.turn) === attacker;
    if (current.isEnd() || edges === 0) return false;
    const key = `${makeFen(current.toSetup()).split(" ", 4).join(" ")}|${edges}|${attacker}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;
    let candidates = legalMoves(current);
    if (current.turn === attacker) {
      candidates = [...candidates].sort((left, right) => {
        const a = current.clone(); a.play(left);
        const b = current.clone(); b.play(right);
        return Number(b.isCheck()) - Number(a.isCheck()) || makeUci(left).localeCompare(makeUci(right));
      });
      for (const move of candidates) {
        const next = current.clone(); next.play(move);
        if (visit(next, edges - 1)) { memo.set(key, true); return true; }
        if (capped) return false;
      }
      memo.set(key, false);
      return false;
    }
    if (candidates.length === 0) { memo.set(key, false); return false; }
    for (const move of candidates) {
      const next = current.clone(); next.play(move);
      if (!visit(next, edges - 1)) { memo.set(key, false); return false; }
      if (capped) return false;
    }
    memo.set(key, true);
    return true;
  };
  const proved = visit(pos, 2 * movesToMate - 2);
  return { kind: capped ? "abstained" : proved ? "proved" : "refuted", nodes, rootReplies, rootCheck };
}

function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * p)]!;
}

describe("D872 bounded exact mating-net proof", () => {
  it("separates mate-in-two and mate-in-three proofs from the next-depth control", () => {
    const population = samples();
    const arms = [
      { name: "mateIn2 positives", rows: population.get("mateIn2")!, depth: 2 as const },
      { name: "mateIn3 as depth-2 controls", rows: population.get("mateIn3")!, depth: 2 as const },
      { name: "mateIn3 positives", rows: population.get("mateIn3")!, depth: 3 as const },
      { name: "mateIn4 as depth-3 controls", rows: population.get("mateIn4")!, depth: 3 as const },
      { name: "mateIn4 positives", rows: population.get("mateIn4")!.slice(0, 120), depth: 4 as const },
      { name: "mateIn5 as depth-4 controls", rows: population.get("mateIn5")!.slice(0, 120), depth: 4 as const },
      { name: "mateIn5 positives (boundary probe)", rows: population.get("mateIn5")!.slice(0, 24), depth: 5 as const },
    ];
    const lines = [
      "# D872 bounded mating-net output",
      "",
      `Deterministic hash sample: ${SAMPLE} rows per source tag; node cap ${NODE_CAP.toLocaleString("en-US")} per proof. The exported first solution move is fixed, future attacker moves are existential, and every defender reply is enumerated.`,
      "",
      "| arm | proved | refuted | abstained at cap | root gives check | root replies median / p90 | proof nodes median / p90 / max |",
      "|---|---:|---:|---:|---:|---:|---:|",
    ];
    const results = new Map<string, readonly ProofResult[]>();
    for (const arm of arms) {
      const values = arm.rows.map((row) => proof(row, arm.depth));
      results.set(arm.name, values);
      const proved = values.filter((value) => value.kind === "proved").length;
      const refuted = values.filter((value) => value.kind === "refuted").length;
      const abstained = values.filter((value) => value.kind === "abstained").length;
      const checks = values.filter((value) => value.rootCheck).length;
      const replies = values.map((value) => value.rootReplies);
      const nodes = values.map((value) => value.nodes);
      lines.push(`| ${arm.name} | ${proved}/${values.length} | ${refuted} | ${abstained} | ${checks}/${values.length} | ${percentile(replies, .5)} / ${percentile(replies, .9)} | ${percentile(nodes, .5)} / ${percentile(nodes, .9)} / ${Math.max(...nodes)} |`);
    }
    lines.push("", "## Boundary witnesses", "");
    for (const arm of arms) {
      const values = results.get(arm.name)!;
      const witnesses = values.flatMap((value, index) => value.kind === "proved" ? [] : [`${arm.rows[index]!.id}:${value.kind}:${value.nodes}`]);
      if (witnesses.length > 0) lines.push(`- ${arm.name}: ${witnesses.slice(0, 16).join(", ")}.`);
    }
    lines.push(
      "",
      "Interpretation: a proved row grounds only `forced_mate_within@N` for the declared candidate and complete bounded tree. A refuted row has a legal defender branch or no attacker continuation inside the horizon. A capped row abstains. `mating net` is presentation vocabulary over this proof, never over king-zone or escape-count deltas.",
      "",
    );
    writeFileSync(OUTPUT, lines.join("\n"), "utf8");

    expect(results.get("mateIn2 positives")!.filter((value) => value.kind === "proved").length).toBeGreaterThan(220);
    expect(results.get("mateIn3 positives")!.filter((value) => value.kind === "proved").length).toBeGreaterThan(200);
    expect(results.get("mateIn3 as depth-2 controls")!.filter((value) => value.kind === "proved").length).toBeLessThan(20);
    expect(results.get("mateIn4 as depth-3 controls")!.filter((value) => value.kind === "proved").length).toBeLessThan(20);
    expect(results.get("mateIn4 positives")!.filter((value) => value.kind === "proved").length).toBeGreaterThan(100);
    expect(results.get("mateIn5 as depth-4 controls")!.filter((value) => value.kind === "proved").length).toBeLessThan(10);
  }, 3_600_000);
});
