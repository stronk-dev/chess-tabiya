import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ROOT = new URL("../../", import.meta.url);

const MIGRATED = Object.freeze([
  "apps/web/src/lib/board-input.ts",
  "apps/server/src/sourcing/legal-moves.ts",
  "apps/server/src/application.ts",
  "apps/server/src/opponent-selector.ts",
  "packages/runtime/src/mobility.ts",
  "packages/runtime/src/tempo.ts",
  "packages/runtime/src/pivotal.ts",
  "packages/runtime/src/semantic-evidence.ts",
] as const);

const LOCAL = Object.freeze([
  { path: "packages/runtime/src/pawn-dynamics.ts", kind: "bounded-search", reason: "promotion-only expansion; ordinary moves are deliberately excluded" },
  { path: "packages/runtime/src/mate-proof.ts", kind: "bounded-search", reason: "proof-tree move objects retain internal castling form and proof ordering" },
  { path: "packages/runtime/src/king-state.ts", kind: "turn-clone", reason: "opposite-color, en-passant-cleared king escape convention" },
  { path: "packages/runtime/src/exchange.ts", kind: "bounded-search", reason: "target-square capture filter with exchange operands" },
  { path: "packages/runtime/src/square-control.ts", kind: "turn-clone", reason: "opposite-color, en-passant-cleared legal-control convention" },
  { path: "packages/runtime/src/tactics.ts", kind: "bounded-search", reason: "reply and tactical proof move objects retain search-local ordering" },
] as const);

function files(url: URL): readonly string[] {
  return readdirSync(url, { withFileTypes: true }).flatMap((entry) => {
    const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, url);
    if (entry.isDirectory()) return files(child);
    if (!entry.isFile() || !/\.(?:ts|svelte)$/u.test(entry.name) || /\.test\.ts$/u.test(entry.name)) return [];
    return [decodeURIComponent(child.pathname).slice(decodeURIComponent(ROOT.pathname).length)];
  });
}

function allDestsCount(path: string): number {
  return [...readFileSync(new URL(path, ROOT), "utf8").matchAll(/\.allDests\(\)/gu)].length;
}

describe("production allDests census", () => {
  it("classifies all fourteen original sites into shared authority or semantic-local search", () => {
    expect(MIGRATED).toHaveLength(8);
    expect(LOCAL).toHaveLength(6);
    expect(new Set([...MIGRATED, ...LOCAL.map((row) => row.path)]).size).toBe(14);
    expect(LOCAL.every((row) => row.reason.length > 20)).toBe(true);
    expect(new Set(LOCAL.map((row) => row.kind))).toEqual(new Set(["bounded-search", "turn-clone"]));
  });

  it("keeps migrated roots free of independent enumeration", () => {
    for (const path of MIGRATED) expect(allDestsCount(path), path).toBe(0);
  });

  it("fails when a production loop is new or unclassified", () => {
    const actual = files(new URL("packages/runtime/src/", ROOT))
      .concat(files(new URL("apps/server/src/", ROOT)), files(new URL("apps/web/src/", ROOT)))
      .filter((path) => allDestsCount(path) > 0)
      .sort();
    const expected = ["packages/runtime/src/legal-moves.ts", ...LOCAL.map((row) => row.path)].sort();
    expect(actual).toEqual(expected);
    expect(allDestsCount("packages/runtime/src/legal-moves.ts")).toBe(1);
    for (const row of LOCAL) expect(allDestsCount(row.path), row.path).toBe(1);
  });
});
