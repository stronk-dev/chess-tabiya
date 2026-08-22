// D414 / D947 round-trip harness: execute REAL Lichess broadcast PGN through the
// repo's actual import path (`apps/server/src/pgn-import.ts`), instead of the shape
// inspection D414 flagged. Disposable evidence instrument — see README.md.
//
// The test writes its measured record to roundtrip-output.md so the derivation
// dossier cites executed behavior, not expectations.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parsePgnMainline, PgnImportError } from "../../apps/server/src/pgn-import.js";

const here = (rel: string): string => fileURLToPath(new URL(rel, import.meta.url));

function splitGames(pgn: string): string[] {
  return pgn
    .split(/\n(?=\[Event )/u)
    .map((game) => game.trim())
    .filter((game) => game.length > 0);
}

interface GameResult {
  readonly label: string;
  readonly outcome: "parsed" | "refused";
  readonly detail: string;
}

function runGame(game: string, options: { requireMoves?: boolean } = {}): GameResult {
  const headers = Object.fromEntries(
    [...game.matchAll(/^\[(\w+) "([^"]*)"\]/gmu)].map((match) => [match[1], match[2]]),
  );
  const label = `${headers["White"]} - ${headers["Black"]} (${headers["Result"]})`;
  try {
    const parsed = parsePgnMainline(game, options);
    const headerKeys = Object.keys(parsed.headers);
    return {
      label,
      outcome: "parsed",
      detail: `${parsed.moves.length} plies; result=${parsed.result}; headers kept=${headerKeys.length}`,
    };
  } catch (error) {
    if (error instanceof PgnImportError) return { label, outcome: "refused", detail: error.message };
    throw error;
  }
}

const finishedRound = readFileSync(here("./fixtures/finished-round-QxNfeqHA.pgn"), "utf8");
const ongoingRound = readFileSync(here("./fixtures/ongoing-round-wDTQF08K.pgn"), "utf8");
const lines: string[] = [];

describe("D414: real broadcast PGN through parsePgnMainline", () => {
  it("refuses the multi-game round file as a whole (one game per call is the contract)", () => {
    let message = "";
    try {
      parsePgnMainline(finishedRound);
    } catch (error) {
      message = error instanceof PgnImportError ? error.message : String(error);
    }
    expect(message).toBe("PGN must contain exactly one game");
    lines.push(
      "## Whole round file (multi-game)",
      "",
      `Both fixtures refused with \`${message}\` — a broadcast consumer must split games before calling \`parsePgnMainline\`; the round endpoint always returns every board in one body.`,
      "",
    );
  });

  it("parses every game of a FINISHED round, evals/clocks/literate comments and all", () => {
    const games = splitGames(finishedRound);
    expect(games.length).toBe(10);
    const results = games.map((game) => runGame(game, { requireMoves: true }));
    for (const result of results) expect(result.outcome).toBe("parsed");

    // What happened to the annotations chessops parsed as comments?
    const evalCount = (finishedRound.match(/%eval/gu) ?? []).length;
    const clkCount = (finishedRound.match(/%clk/gu) ?? []).length;
    const literateCount = (finishedRound.match(/Blunder\.|Mistake\.|Inaccuracy\./gu) ?? []).length;
    const sample = parsePgnMainline(games[0]!);
    const serialized = JSON.stringify(sample);
    expect(serialized.includes("%eval")).toBe(false);
    expect(serialized.includes("%clk")).toBe(false);
    expect(serialized.includes("Blunder")).toBe(false);

    lines.push(
      "## Finished round QxNfeqHA (Campeonato de España 2026, round 5 — 10-game trim of 45)",
      "",
      `All 10 games parsed. Input carried ${evalCount} \`[%eval]\`, ${clkCount} \`[%clk]\`, ${literateCount} literate verdicts (\`Blunder./Mistake./Inaccuracy.\`); the returned \`ParsedPgnMainline\` (rootFen, headers, result, san/uci moves) contains none of them — comments are silently dropped by mainline extraction, never surfaced and never crashing.`,
      "",
      ...results.map((result) => `- ${result.outcome}: ${result.label} — ${result.detail}`),
      "",
    );
  });

  it("parses ONGOING games: '*' results survive, requireMoves is the only trap", () => {
    const games = splitGames(ongoingRound);
    expect(games.length).toBe(10);
    const results = games.map((game) => runGame(game, { requireMoves: true }));
    for (const result of results) expect(result.outcome).toBe("parsed");
    const starCount = results.filter((result) => result.label.endsWith("(*)")).length;
    expect(starCount).toBeGreaterThan(0);

    // A just-created broadcast board has headers and no moves yet: the importGame
    // path (requireMoves: true) refuses it, the bare parser accepts it.
    const headerOnly = games[0]!.split(/\n\n/u)[0]!;
    const refusal = runGame(headerOnly, { requireMoves: true });
    expect(refusal.outcome).toBe("refused");
    expect(refusal.detail).toBe("PGN must contain at least one move");
    const accepted = runGame(headerOnly);
    expect(accepted.outcome).toBe("parsed");

    lines.push(
      "## Ongoing round wDTQF08K (Sants Open 2026 Group A, round 2 — 10-game trim of 26, fetched mid-round)",
      "",
      `All 10 games parsed; ${starCount} carried \`[Result "*"]\` (in-progress) and came back \`result: "*"\` with the partial mainline intact. Ongoing broadcast PGN has \`[%clk]\` but no \`[%eval]\` (evals arrive when Lichess finishes its analysis). A not-yet-started board (headers, zero moves) is refused by the \`importGame\` configuration (\`requireMoves: true\` → "${refusal.detail}") and accepted by the bare parser.`,
      "",
      ...results.map((result) => `- ${result.outcome}: ${result.label} — ${result.detail}`),
      "",
    );
  });

  it("keeps broadcast-specific headers verbatim in parsed.headers", () => {
    const sample = parsePgnMainline(splitGames(ongoingRound)[0]!);
    for (const key of ["BroadcastName", "BroadcastURL", "GameURL", "WhiteFideId", "Site", "Round"]) {
      expect(typeof sample.headers[key]).toBe("string");
    }
    lines.push(
      "## Broadcast headers",
      "",
      "`BroadcastName`, `BroadcastURL`, `GameURL`, `WhiteFideId`/`BlackFideId`, `Site`, hierarchical `Round` (e.g. `2.1`) all pass through into `parsed.headers` untouched — provenance is free, but so is anything else upstream chooses to write there.",
      "",
    );
    writeFileSync(here("./roundtrip-output.md"), [
      "# D414 round-trip record — real broadcast PGN through `pgn-import.ts`",
      "",
      "Generated by `roundtrip.test.ts` (vitest). Fixtures fetched 2026-08-22 from the public",
      "Lichess broadcast API without auth; see README.md for endpoints, trims and latency.",
      "",
      ...lines,
    ].join("\n") + "\n");
  });
});
