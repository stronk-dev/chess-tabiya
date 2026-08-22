// DISPOSABLE research harness — D872/Wave C. Not production detector code.
import { readFileSync, writeFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const SOURCE = process.env.TABIYA_LICHESS_PUZZLES;
const OUTPUT = new URL("./output.md", import.meta.url).pathname;
const THEMES = [
  "capturingDefender",
  "deflection",
  "attraction",
  "interference",
  "clearance",
  "intermezzo",
  "overloading",
  "discoveredAttack",
  "trappedPiece",
  "backRankMate",
  "quietMove",
  "promotion",
] as const;
const PHASES = ["opening", "middlegame", "endgame"] as const;
type Theme = (typeof THEMES)[number];
type Phase = (typeof PHASES)[number];

interface Row {
  readonly id: string;
  readonly solutionPlies: number;
  readonly themes: ReadonlySet<string>;
}

interface ThemeStats {
  count: number;
  solutionPlies: number[];
  examples: string[];
  phases: Record<Phase, number>;
  semanticPeers: number;
}

function rows(): { readonly complete: readonly Row[]; readonly rejectedTail: number } {
  if (!SOURCE) throw new TypeError("Set TABIYA_LICHESS_PUZZLES to the official CSV path");
  const lines = readFileSync(SOURCE, "utf8").split("\n").slice(1).filter(Boolean);
  const complete: Row[] = [];
  let rejectedTail = 0;
  for (const [index, line] of lines.entries()) {
    const fields = line.split(",");
    if (fields.length !== 11) {
      if (index !== lines.length - 1) throw new TypeError(`Unexpected CSV field count before tail: ${fields.length}`);
      rejectedTail += 1;
      continue;
    }
    const moves = fields[2]!.split(" ");
    complete.push({
      id: fields[0]!,
      solutionPlies: moves.length - 1,
      themes: new Set(fields[7]!.split(" ")),
    });
  }
  return { complete, rejectedTail };
}

function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * p)]!;
}

function pct(part: number, whole: number): string {
  return whole === 0 ? "n/a" : `${(100 * part / whole).toFixed(1)}%`;
}

describe("D872 semantic-tactics external disagreement population", () => {
  it("records tag reach, horizons, phase mix and co-occurrence without treating tags as truth", () => {
    const parsed = rows();
    const population = parsed.complete;
    const stats = new Map<Theme, ThemeStats>();
    const pairs = new Map<string, number>();
    for (const theme of THEMES) stats.set(theme, {
      count: 0,
      solutionPlies: [],
      examples: [],
      phases: { opening: 0, middlegame: 0, endgame: 0 },
      semanticPeers: 0,
    });

    for (const row of population) {
      const present = THEMES.filter((theme) => row.themes.has(theme));
      for (const theme of present) {
        const value = stats.get(theme)!;
        value.count += 1;
        value.solutionPlies.push(row.solutionPlies);
        if (value.examples.length < 5) value.examples.push(row.id);
        for (const phase of PHASES) if (row.themes.has(phase)) value.phases[phase] += 1;
        if (present.length > 1) value.semanticPeers += 1;
      }
      for (let left = 0; left < present.length; left += 1) {
        for (let right = left + 1; right < present.length; right += 1) {
          const key = [present[left]!, present[right]!].sort().join(" + ");
          pairs.set(key, (pairs.get(key) ?? 0) + 1);
        }
      }
    }

    const lines = [
      "# D872 semantic-tactics population",
      "",
      `Population: ${population.length.toLocaleString("en-US")} complete records from the bounded official Lichess puzzle-export prefix; ${parsed.rejectedTail} truncated tail rejected.`,
      "",
      "Themes are automatically generated and vote-refined disagreement labels, not ground truth. Solution plies exclude the export's initial opponent setup move.",
      "",
      "| theme | records | population | solution plies min / median / p90 | phase opening / middle / end | co-tagged with another listed semantic family |",
      "|---|---:|---:|---:|---:|---:|",
    ];
    for (const theme of THEMES) {
      const value = stats.get(theme)!;
      lines.push(`| \`${theme}\` | ${value.count.toLocaleString("en-US")} | ${pct(value.count, population.length)} | ${value.count === 0 ? "n/a" : `${Math.min(...value.solutionPlies)} / ${percentile(value.solutionPlies, .5)} / ${percentile(value.solutionPlies, .9)}`} | ${value.phases.opening} / ${value.phases.middlegame} / ${value.phases.endgame} | ${value.semanticPeers.toLocaleString("en-US")} (${pct(value.semanticPeers, value.count)}) |`);
    }
    lines.push(
      "",
      "## Largest pair overlaps",
      "",
      "| pair | records |",
      "|---|---:|",
    );
    for (const [pair, count] of [...pairs].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
      lines.push(`| ${pair} | ${count.toLocaleString("en-US")} |`);
    }
    lines.push("", "## Reproducible examples", "");
    for (const theme of THEMES) lines.push(`- \`${theme}\`: ${stats.get(theme)!.examples.join(", ") || "none"}.`);
    lines.push(
      "",
      "Interpretation: reach and co-occurrence price validation and fixture needs. They do not establish detector precision, causality, force, value or intent.",
      "",
    );
    writeFileSync(OUTPUT, lines.join("\n"), "utf8");

    expect(population.length).toBeGreaterThan(200_000);
    expect(parsed.rejectedTail).toBe(1);
    expect(stats.get("overloading")!.count).toBe(0);
    for (const theme of ["capturingDefender", "deflection", "interference", "clearance", "intermezzo"] as const) {
      expect(stats.get(theme)!.count, theme).toBeGreaterThan(500);
    }
  });
});
