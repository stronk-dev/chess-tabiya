// DISPOSABLE research harness — D1674. Not production code.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { makeFen, parseFen } from "chessops/fen";
import { isDrop } from "chessops/types";
import { parseUci } from "chessops/util";
import { setupPosition } from "chessops/variant";
import ts from "typescript";
import { describe, expect, it } from "vitest";

import { commitMove, createRun } from "../../packages/runtime/src/index.js";

const at = "2026-08-26T12:00:00.000Z";
const digest = `sha256:${"a".repeat(64)}`;
const crazyhousePocketFen = "4k3/8/8/8/8/8/8/4K3[P] w - - 0 1";
const authoritySymbols = new Set(["positionFromFen", "exactLegalMoves", "terminalOutcome"]);
const expectedAuthorityCalls = {
  "apps/server/src/application.ts": { exactLegalMoves: 1 },
  "apps/server/src/candidate-evidence.ts": { positionFromFen: 1 },
  "apps/server/src/opponent-selector.ts": { exactLegalMoves: 1, positionFromFen: 2 },
  "apps/server/src/sourcing/legal-moves.ts": { exactLegalMoves: 2 },
  "apps/server/src/sourcing/tablebase-walk.ts": { exactLegalMoves: 1 },
  "apps/web/src/lib/board-input.ts": { positionFromFen: 6 },
  "packages/runtime/src/castling.ts": { positionFromFen: 4 },
  "packages/runtime/src/chess.ts": { positionFromFen: 1 },
  "packages/runtime/src/compare-strips.ts": { exactLegalMoves: 1, positionFromFen: 1 },
  "packages/runtime/src/endgame.ts": { positionFromFen: 1 },
  "packages/runtime/src/events.ts": { positionFromFen: 1, terminalOutcome: 1 },
  "packages/runtime/src/exchange.ts": { positionFromFen: 3 },
  "packages/runtime/src/king-state.ts": { positionFromFen: 3 },
  "packages/runtime/src/legal-moves.ts": { exactLegalMoves: 1, positionFromFen: 3 },
  "packages/runtime/src/mate-proof.ts": { positionFromFen: 2 },
  "packages/runtime/src/material-state.ts": { positionFromFen: 2 },
  "packages/runtime/src/mobility.ts": { exactLegalMoves: 1, positionFromFen: 3 },
  "packages/runtime/src/objective.ts": { positionFromFen: 5 },
  "packages/runtime/src/pack-pgn.ts": { positionFromFen: 1 },
  "packages/runtime/src/pawn-dynamics.ts": { positionFromFen: 16 },
  "packages/runtime/src/pgn.ts": { positionFromFen: 1 },
  "packages/runtime/src/phase.ts": { positionFromFen: 2 },
  "packages/runtime/src/pivotal.ts": { exactLegalMoves: 1, positionFromFen: 1 },
  "packages/runtime/src/reasoning.ts": { positionFromFen: 1 },
  "packages/runtime/src/runtime.ts": { positionFromFen: 2, terminalOutcome: 1 },
  "packages/runtime/src/semantic-evidence.ts": { exactLegalMoves: 1, positionFromFen: 39 },
  "packages/runtime/src/session.ts": { positionFromFen: 1 },
  "packages/runtime/src/square-control.ts": { positionFromFen: 4 },
  "packages/runtime/src/structure.ts": { positionFromFen: 10 },
  "packages/runtime/src/tactics.ts": { positionFromFen: 21 },
  "packages/runtime/src/tempo.ts": { exactLegalMoves: 1, positionFromFen: 1 },
  "packages/runtime/src/transition.ts": { positionFromFen: 8 },
} as const;

const rulesAwareFiles = new Set([
  "apps/server/src/application.ts",
  "apps/server/src/opponent-selector.ts",
  "apps/web/src/lib/board-input.ts",
  "packages/runtime/src/chess.ts",
  "packages/runtime/src/events.ts",
  "packages/runtime/src/legal-moves.ts",
  "packages/runtime/src/pgn.ts",
  "packages/runtime/src/runtime.ts",
  "packages/runtime/src/session.ts",
]);

function rulesAware(fen: string, rules: Parameters<typeof setupPosition>[0]) {
  return setupPosition(rules, parseFen(fen).unwrap()).unwrap();
}

function productionTypeScriptFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    const absolute = join(root, entry);
    if (statSync(absolute).isDirectory()) files.push(...productionTypeScriptFiles(absolute));
    else if (entry.endsWith(".ts") && !entry.endsWith(".test.ts") && !entry.endsWith(".spec.ts")) files.push(absolute);
  }
  return files;
}

function authorityCallCensus(): Record<string, Record<string, number>> {
  const root = process.cwd();
  const result: Record<string, Record<string, number>> = {};
  for (const directory of ["packages/runtime/src", "apps/server/src", "apps/web/src"]) {
    for (const absolute of productionTypeScriptFiles(join(root, directory))) {
      const relative = absolute.slice(root.length + 1);
      const source = ts.createSourceFile(relative, readFileSync(absolute, "utf8"), ts.ScriptTarget.Latest, true);
      const counts: Record<string, number> = {};
      const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && authoritySymbols.has(node.expression.text)) {
          counts[node.expression.text] = (counts[node.expression.text] ?? 0) + 1;
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
      if (Object.keys(counts).length > 0) result[relative] = counts;
    }
  }
  return result;
}

describe("D1674 rules-aware runtime boundary", () => {
  it("proves chessops accepts and serializes a legal Crazyhouse drop", () => {
    const position = rulesAware(crazyhousePocketFen, "crazyhouse");
    const drop = parseUci("P@e4");
    expect(drop).toBeDefined();
    expect(isDrop(drop!)).toBe(true);
    expect(position.isLegal(drop!)).toBe(true);

    position.play(drop!);
    expect(makeFen(position.toSetup())).toBe("4k3/8/8/8/4P3/8/8/4K3[] b - - 0 1");
  });

  it("proves the shipped run authority refuses the same rules-valid start or drop", () => {
    expect(() => createRun({
      id: "crazyhouse-runtime-negative",
      packId: "research-only",
      packDigest: digest,
      startFen: crazyhousePocketFen,
      policyConfig: {
        seedMode: "fixed",
        locus: { executedAt: "server", engineIds: [], modelIds: [] },
      },
      seed: 1,
      createdAt: at,
    })).toThrow();

    const ordinary = createRun({
      id: "ordinary-runtime-negative",
      packId: "research-only",
      packDigest: digest,
      startFen: "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1",
      policyConfig: {
        seedMode: "fixed",
        locus: { executedAt: "server", engineIds: [], modelIds: [] },
      },
      seed: 1,
      createdAt: at,
    });
    expect(() => commitMove(ordinary, "P@e4", { at })).toThrow(/malformed-UCI/);
  });

  it("proves a rules-distinct terminal cannot be reduced to standard checkmate", () => {
    const fen = "7k/8/8/8/4K3/8/8/8 w - - 0 1";
    const hill = rulesAware(fen, "kingofthehill");
    const standard = rulesAware(fen, "chess");

    expect(hill.isVariantEnd()).toBe(true);
    expect(hill.outcome()).toEqual({ winner: "white" });
    expect(standard.outcome()).toEqual({ winner: undefined });
  });

  it("pins the minimum production seam: rules must reach position, move, FEN and outcome", () => {
    const runtime = readFileSync(join(process.cwd(), "packages/runtime/src/runtime.ts"), "utf8");
    const events = readFileSync(join(process.cwd(), "packages/runtime/src/events.ts"), "utf8");
    const chess = readFileSync(join(process.cwd(), "packages/runtime/src/chess.ts"), "utf8");
    const outcome = readFileSync(join(process.cwd(), "packages/runtime/src/outcome.ts"), "utf8");

    expect(chess).not.toContain("setupPosition");
    expect(runtime).toContain("if (!inputMove || !isNormal(inputMove))");
    expect(runtime).toContain("position.play(move)");
    expect(events).toContain("terminalOutcome(positionFromFen(node.fen)");
    expect(outcome).toContain("if (!position.isCheckmate()) return \"draw\"");
  });

  it("censuses every production call to the three standard-only authorities", () => {
    const census = authorityCallCensus();
    expect(census).toEqual(expectedAuthorityCalls);
    const totals = Object.values(census).reduce((sum, counts) => {
      for (const count of Object.values(counts)) sum += count;
      return sum;
    }, 0);
    expect(totals).toBe(159);
    expect(Object.keys(census).filter((file) => rulesAwareFiles.has(file))).toHaveLength(9);
    expect(Object.keys(census).filter((file) => !rulesAwareFiles.has(file))).toHaveLength(23);
  });
});
