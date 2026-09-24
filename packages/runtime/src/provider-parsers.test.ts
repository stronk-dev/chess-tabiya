import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { exactLegalMoves } from "./legal-moves.js";
import { digestProviderSourceBytes, providerUtf8 } from "./provider-digest.js";
import { PROVIDER_PARSER_IMPLEMENTATION } from "./provider-parser-implementation.generated.js";
import { PROVIDER_RESPONSE_PARSERS, ProviderResponseInvalid } from "./provider-parsers.js";
import { normalizeProviderRequest } from "./provider-requests.js";
import {
  START_FEN,
  allLegalRows,
  engineSpelling,
  evaluationCapture,
  evaluationRequest,
  explorerBody,
  explorerRequest,
  httpCapture,
  legalRootCapture,
  legalRootLines,
  legalRootRequest,
  maiaCapture,
  maiaRequest,
  syzygyBody,
  syzygyRequest,
  transcript,
  type RootLine,
} from "./provider-test-fixtures.js";

const legalRoot = (fen: string, rows: readonly RootLine[], depth = 8, extra: readonly string[] = []) => {
  const identity = normalizeProviderRequest("stockfish.legal_root_table@1", legalRootRequest(fen, depth));
  return () => PROVIDER_RESPONSE_PARSERS["stockfish.legal_root_table@1"].parse(legalRootCapture(identity, [...extra, ...legalRootLines(fen, rows, depth)]), identity);
};

describe("§5 Stockfish legal-root table parser", () => {
  const CASTLING = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
  const PROMOTION = "8/P7/8/8/8/8/8/k6K w - - 0 1";

  it("admits ordinary play, both castling identities and all four promotions as exact identities", () => {
    const ordinary = legalRoot(START_FEN, allLegalRows(START_FEN))();
    expect(ordinary.rows.map((row) => row.moveUci).sort()).toEqual(exactLegalMoves(START_FEN).map((move) => move.uci).sort());
    expect(ordinary.scoreFrame).toBe("root_side_to_move");
    const castling = legalRoot(CASTLING, allLegalRows(CASTLING))();
    const moves = castling.rows.map((row) => row.moveUci);
    expect(moves).toContain("e1h1");
    expect(moves).toContain("e1a1");
    expect(moves).not.toContain("e1g1");
    // The engine spoke standard UCI (king destination); the table carries king-takes-rook identity.
    expect(engineSpelling(CASTLING, "e1h1")).toBe("e1g1");
    const promotion = legalRoot(PROMOTION, allLegalRows(PROMOTION))();
    expect(promotion.rows.map((row) => row.moveUci).filter((move) => move.startsWith("a7a8")).sort()).toEqual(["a7a8b", "a7a8n", "a7a8q", "a7a8r"]);
  });

  it("interprets cp and mate once in the root side-to-move frame", () => {
    const fen = "8/8/8/8/8/8/k7/7K b - - 0 1";
    const legal = exactLegalMoves(fen).map((move) => move.uci);
    const table = legalRoot(fen, legal.map((move, index) => ({ move, score: index === 0 ? "mate 3" : index === 1 ? "mate -2" : "cp -40" })))();
    expect(table.rows[0]!.score).toEqual({ kind: "mate", outcome: "root_mates", distance: 3, unit: "moves" });
    expect(table.rows[1]!.score).toEqual({ kind: "mate", outcome: "root_is_mated", distance: 2, unit: "moves" });
    expect(table.rows[2]!.score).toEqual({ kind: "centipawns", value: -40 });
  });

  it("refuses missing, duplicate, extra, replaced, short-depth, bounded, score-less and PV-less tables", () => {
    const rows = allLegalRows(PROMOTION);
    expect(legalRoot(PROMOTION, rows.slice(1).map((row, index) => ({ ...row, index: index + 1 })))).toThrow(ProviderResponseInvalid);
    expect(legalRoot(PROMOTION, rows.map((row, index) => (index === 1 ? { ...row, move: rows[0]!.move } : row)))).toThrow(/duplicate root move/u);
    expect(legalRoot(PROMOTION, [...rows, { move: rows[0]!.move, score: "cp 1", index: rows.length + 1 }])).toThrow(/unknown MultiPV index/u);
    expect(legalRoot(PROMOTION, rows.map((row, index) => (index === 0 ? { ...row, pv: ["h1h3"] } : row)))).toThrow(/illegal PV move/u);
    expect(legalRoot(PROMOTION, rows.map((row, index) => (index === 0 ? { ...row, depth: 7 } : row)))).toThrow(/incomplete root table/u);
    expect(legalRoot(PROMOTION, rows.map((row, index) => (index === 0 ? { ...row, extra: "upperbound" } : row)))).toThrow(/incomplete root table/u);
    expect(legalRoot(PROMOTION, rows.map((row, index) => (index === 0 ? { ...row, score: "mate 0" } : row)))).toThrow(/zero-distance mate/u);
    const identity = normalizeProviderRequest("stockfish.legal_root_table@1", legalRootRequest(PROMOTION));
    const lines = [...legalRootLines(PROMOTION, rows, 8)];
    const scoreless = lines.map((line, index) => (index === 0 ? line.replace(/score cp -?\d+ /u, "") : line));
    expect(() => PROVIDER_RESPONSE_PARSERS["stockfish.legal_root_table@1"].parse(legalRootCapture(identity, scoreless), identity)).toThrow(/PV without a score/u);
    const pvless = lines.map((line, index) => (index === 0 ? line.replace(/ pv .*$/u, "") : line));
    expect(() => PROVIDER_RESPONSE_PARSERS["stockfish.legal_root_table@1"].parse(legalRootCapture(identity, pvless), identity)).toThrow(/score without a PV/u);
    // A bounded line followed by the exact line for the same index is the exact line.
    const recovered = legalRoot(PROMOTION, [{ ...rows[0]!, extra: "lowerbound", index: 1 }, ...rows.map((row, index) => ({ ...row, index: index + 1 }))])();
    expect(recovered.rows).toHaveLength(rows.length);
  });

  it("refuses a transcript whose commands are not the descriptor's image or that runs past bestmove", () => {
    const identity = normalizeProviderRequest("stockfish.legal_root_table@1", legalRootRequest(PROMOTION));
    const received = legalRootLines(PROMOTION, allLegalRows(PROMOTION), 8);
    const forged = { ...legalRootCapture(identity, received), responseBytes: transcript(["position fen x", "go depth 8"], received) };
    expect(() => PROVIDER_RESPONSE_PARSERS["stockfish.legal_root_table@1"].parse(forged, identity)).toThrow(/not the requested command image/u);
    const trailing = { ...legalRootCapture(identity, [...received, "info string late"]) };
    expect(() => PROVIDER_RESPONSE_PARSERS["stockfish.legal_root_table@1"].parse(trailing, identity)).toThrow(/output after bestmove/u);
  });
});

describe("§5.1 fixed-bound position evaluation parser", () => {
  const parse = (fen: string, received: readonly string[], bound?: Parameters<typeof evaluationRequest>[1]) => {
    const identity = normalizeProviderRequest("stockfish.position_evaluation@1", evaluationRequest(fen, bound));
    return () => PROVIDER_RESPONSE_PARSERS["stockfish.position_evaluation@1"].parse(evaluationCapture(identity, received), identity);
  };
  const WHITE = START_FEN;
  const BLACK = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

  it("converts the score to the White frame and keeps the same line's raw side-to-move WDL", () => {
    const white = parse(WHITE, ["info depth 12 multipv 1 score cp 35 wdl 400 500 100 pv e2e4", "bestmove e2e4"])();
    expect(white.score).toEqual({ kind: "centipawns", value: 35 });
    expect(white.rawWdl).toEqual({ subject: "side_to_move", win: 400, draw: 500, loss: 100 });
    const black = parse(BLACK, ["info depth 12 score cp 35 wdl 400 500 100 pv e7e5", "bestmove e7e5"])();
    expect(black.score).toEqual({ kind: "centipawns", value: -35 });
    expect(black.rawWdl.win).toBe(400);
    expect(parse(BLACK, ["info depth 12 score mate 2 wdl 1000 0 0 pv e7e5", "bestmove e7e5"])().score).toEqual({ kind: "mate", side: "black", distance: 2, unit: "moves" });
    expect(parse(WHITE, ["info depth 12 score mate -2 wdl 0 0 1000 pv e2e4", "bestmove e2e4"])().score).toEqual({ kind: "mate", side: "black", distance: 2, unit: "moves" });
  });

  it("selects the last exact line at the requested depth and never assembles across iterations", () => {
    const result = parse(WHITE, [
      "info depth 11 score cp 90 wdl 700 200 100 pv e2e4",
      "info depth 12 score cp 20 upperbound wdl 300 600 100 pv e2e4",
      "info depth 12 score cp 30 wdl 350 550 100 pv e2e4",
      "info depth 13 score cp 50 pv e2e4",
      "bestmove e2e4",
    ])();
    expect(result.score).toEqual({ kind: "centipawns", value: 30 });
    expect(result.rawWdl).toEqual({ subject: "side_to_move", win: 350, draw: 550, loss: 100 });
    expect(result.bound).toEqual({ kind: "depth", requestedDepth: 12, reachedDepth: 12 });
    const nodes = parse(WHITE, ["info depth 9 score cp 10 wdl 300 600 100 pv e2e4", "info depth 11 score cp 12 wdl 310 590 100 pv e2e4", "info depth 11 score cp 14 wdl 320 580 100 pv e2e4", "bestmove e2e4"], { kind: "nodes", requestedNodes: 1000 })();
    expect(nodes.score).toEqual({ kind: "centipawns", value: 14 });
    expect(nodes.bound).toEqual({ kind: "nodes", requestedNodes: 1000, reachedDepth: 11 });
  });

  it("refuses short depth, missing/malformed/non-summing WDL, zero mate, other MultiPV, a prior task's line and output after bestmove", () => {
    expect(parse(WHITE, ["info depth 11 score cp 10 wdl 300 600 100 pv e2e4", "bestmove e2e4"])).toThrow(/no exact completed line/u);
    expect(parse(WHITE, ["info depth 12 score cp 10 pv e2e4", "bestmove e2e4"])).toThrow(/no exact completed line/u);
    expect(parse(WHITE, ["info depth 12 score cp 10 wdl 300 600 99 pv e2e4", "bestmove e2e4"])).toThrow(/summing to 1000/u);
    expect(parse(WHITE, ["info depth 12 score cp 10 wdl 300 x 100 pv e2e4", "bestmove e2e4"])).toThrow(/malformed WDL/u);
    expect(parse(WHITE, ["info depth 12 score mate 0 wdl 0 0 1000", "bestmove (none)"])).toThrow(/zero-distance mate/u);
    expect(parse(WHITE, ["info depth 12 multipv 2 score cp 10 wdl 300 600 100 pv d2d4", "bestmove e2e4"])).toThrow(/MultiPV 2/u);
    expect(parse(WHITE, ["info depth 12 score cp 10 wdl 300 600 100 pv e2e4", "bestmove e2e4", "info depth 12 score cp 99 wdl 300 600 100 pv e2e4"])).toThrow(/output after bestmove/u);
    // A line from the previous task (received before this task's commands) is ineligible.
    const identity = normalizeProviderRequest("stockfish.position_evaluation@1", evaluationRequest(WHITE));
    const bytes = providerUtf8(["< info depth 12 score cp 77 wdl 300 600 100 pv e2e4", ...identity.command.commands.map((command) => `> ${command}`), "< bestmove e2e4"].join("\n"));
    expect(() => PROVIDER_RESPONSE_PARSERS["stockfish.position_evaluation@1"].parse({ ...evaluationCapture(identity, []), responseBytes: bytes }, identity)).toThrow(/no exact completed line/u);
  });
});

describe("§6 Maia policy page parser", () => {
  const HISTORY = { kind: "history_conditioned" as const, startFen: START_FEN, historyUci: ["e2e4", "e7e5"] };
  const EXACT = { kind: "exact_fen" as const, fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2" };
  const lines = ["info depth 1 multipv 1 policy 0.41 score cp 0 pv g1f3", "info depth 1 multipv 2 policy 0.22 score cp 0 pv b1c3", "info depth 1 multipv 3 policy 0.10 score cp 0 pv f1c4", "bestmove g1f3"];

  it("parses history-conditioned and exact-FEN pages with the literal command image and applied band", () => {
    for (const position of [HISTORY, EXACT]) {
      const identity = normalizeProviderRequest("maia.policy_page@1", maiaRequest(position));
      const page = PROVIDER_RESPONSE_PARSERS["maia.policy_page@1"].parse(maiaCapture(identity, lines), identity);
      expect(page.candidates).toEqual([{ moveUci: "g1f3", probability: 0.41 }, { moveUci: "b1c3", probability: 0.22 }, { moveUci: "f1c4", probability: 0.1 }]);
      expect(page).toMatchObject({ appliedBand: 1500, requestedWidth: 3, returnedWidth: 3, coverage: "bounded_top_k" });
      expect(page.returnedProbabilityMass).toBeCloseTo(0.73, 12);
    }
  });

  it("refuses missing mass, duplicate or illegal candidates and indices beyond the requested width", () => {
    const identity = normalizeProviderRequest("maia.policy_page@1", maiaRequest(EXACT));
    const run = (received: readonly string[]) => () => PROVIDER_RESPONSE_PARSERS["maia.policy_page@1"].parse(maiaCapture(identity, received), identity);
    expect(run(["info depth 1 multipv 1 score cp 0 pv g1f3", "bestmove g1f3"])).toThrow(/policy mass/u);
    expect(run(["info depth 1 multipv 1 policy 0.4 pv g1f3", "info depth 1 multipv 2 policy 0.3 pv g1f3", "bestmove g1f3"])).toThrow(/duplicate Maia candidate/u);
    expect(run(["info depth 1 multipv 1 policy 0.4 pv e1e3", "bestmove e1e3"])).toThrow(/illegal Maia candidate/u);
    expect(run(["info depth 1 multipv 4 policy 0.4 pv g1f3", "bestmove g1f3"])).toThrow(/unknown MultiPV index/u);
    expect(run(["info depth 1 multipv 1 policy 1.5 pv g1f3", "bestmove g1f3"])).toThrow(/invalid policy mass/u);
  });
});

describe("§7 Syzygy position parser", () => {
  const KQK = "8/8/8/8/8/8/3Q4/k1K5 w - - 0 1";
  it("admits a tablebase position only with every legal move identity present", () => {
    const identity = normalizeProviderRequest("syzygy.position@1", syzygyRequest(KQK));
    const result = PROVIDER_RESPONSE_PARSERS["syzygy.position@1"].parse(httpCapture("syzygy.position@1", syzygyBody(KQK)), identity);
    expect(result.fen).toBe(KQK);
    expect(result.position.moves.map((move) => move.uci).sort()).toEqual(exactLegalMoves(KQK).map((move) => move.uci).sort());
    const body = syzygyBody(KQK) as { moves: unknown[] };
    expect(() => PROVIDER_RESPONSE_PARSERS["syzygy.position@1"].parse(httpCapture("syzygy.position@1", { ...body, moves: body.moves.slice(1) }), identity)).toThrow(/set-equal/u);
    expect(() => PROVIDER_RESPONSE_PARSERS["syzygy.position@1"].parse(httpCapture("syzygy.position@1", { ...body, category: "winning" }), identity)).toThrow(/unknown tablebase category/u);
    expect(() => PROVIDER_RESPONSE_PARSERS["syzygy.position@1"].parse(httpCapture("syzygy.position@1", "not json"), identity)).toThrow(/not UTF-8 JSON/u);
  });
});

describe("§8 Explorer position page parser", () => {
  const run = (body: unknown, request = explorerRequest(), etag: string | null = "\"e1\"") => {
    const identity = normalizeProviderRequest("lichess_explorer.position_page@1", request);
    return () => PROVIDER_RESPONSE_PARSERS["lichess_explorer.position_page@1"].parse(httpCapture("lichess_explorer.position_page@1", body, etag), identity);
  };

  it("keeps provider and canonical SAN, listed/unlisted mass and capture-derived source metadata", () => {
    const page = run(explorerBody())();
    expect(page.source).toEqual({ status: 200, etag: "\"e1\"" });
    expect(page.result.kind).toBe("population");
    if (page.result.kind !== "population") throw new Error("unreachable");
    expect(page.result.totals).toEqual({ white: 20, draws: 7, black: 10, total: 37 });
    expect(page.result.listed).toBe(33);
    expect(page.result.unlisted).toBe(4);
    expect(page.result.moves[0]).toMatchObject({ canonicalUci: "e2e4", canonicalSan: "e4", providerSan: "e4", played: 20 });
    // A source/etag field in the JSON body is not the source metadata authority.
    expect(run({ ...explorerBody(), source: { status: 500, etag: "forged" } })().source).toEqual({ status: 200, etag: "\"e1\"" });
  });

  it("admits 0, 37 and 100 totals as successful source truth with no parser threshold", () => {
    expect(run({ white: 0, draws: 0, black: 0, moves: [], opening: null })().result.kind).toBe("zero_population");
    expect(run(explorerBody())().result.kind).toBe("population");
    expect(run(explorerBody({ white: 50, draws: 20, black: 30 }))().result.kind).toBe("population");
  });

  it("distinguishes disabled, requested-empty and requested-populated history", () => {
    expect(run(explorerBody())().result.history).toEqual({ kind: "not_requested" });
    const requested = explorerRequest({ history: { kind: "requested" } });
    expect(run(explorerBody({ history: [] }), requested)().result.history).toEqual({ kind: "reported", rows: [] });
    expect(run(explorerBody({ history: [{ month: "2025-01", white: 1, draws: 0, black: 2 }] }), requested)().result.history).toEqual({ kind: "reported", rows: [{ period: "2025-01", counts: { white: 1, draws: 0, black: 2 }, played: 3 }] });
    expect(run(explorerBody(), requested)).toThrow(/requested history is missing/u);
    expect(run(explorerBody({ history: [] }))).toThrow(/not requested/u);
  });

  it("refuses illegal, duplicate, non-integer and overflowing counts and listed mass above the total", () => {
    expect(run(explorerBody({ moves: [{ uci: "e2e5", san: "e5", white: 1, draws: 0, black: 0 }] }))).toThrow(/not legal/u);
    expect(run(explorerBody({ moves: [{ uci: "e2e4", san: "e4", white: 1, draws: 0, black: 0 }, { uci: "e2e4", san: "e4", white: 1, draws: 0, black: 0 }] }))).toThrow(/duplicate explorer move/u);
    expect(run(explorerBody({ white: 1.5 }))).toThrow(/non-negative safe integer/u);
    expect(run(explorerBody({ white: Number.MAX_SAFE_INTEGER, draws: 5 }))).toThrow(/overflows/u);
    expect(run(explorerBody({ white: 1, draws: 0, black: 0 }))).toThrow(/exceeds the position total/u);
  });
});

// ---------------------------------------------------------------------------------------------
// Parser implementation digest: the complete static local import closure of provider-parsers.ts
// ---------------------------------------------------------------------------------------------

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../..");

function closure(entry: string): readonly string[] {
  const seen = new Set<string>();
  const visit = (file: string): void => {
    if (seen.has(file)) return;
    seen.add(file);
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+"(\.{1,2}\/[^"]+)"/gu)) {
      visit(resolve(dirname(file), match[1]!.replace(/\.js$/u, ".ts")));
    }
  };
  visit(entry);
  return [...seen].map((file) => relative(REPO, file)).sort();
}

describe("parser implementation digest", () => {
  it("binds every parser receipt to the exact bytes of the parser's local import closure", () => {
    const files = closure(join(HERE, "provider-parsers.ts"));
    expect(files).toContain("packages/runtime/src/provider-parsers.ts");
    expect(files).toContain("packages/runtime/src/legal-moves.ts");
    const encoder = new TextEncoder();
    const chunks = files.flatMap((file) => [encoder.encode(`${file}\u0000`), new Uint8Array(readFileSync(join(REPO, file))), encoder.encode("\u0000")]);
    const closureDigest = digestProviderSourceBytes(chunks);
    if (process.env.UPDATE_PROVIDER_PARSER_IMPLEMENTATION === "1") {
      writeFileSync(join(HERE, "provider-parser-implementation.generated.ts"), `// Generated by \`UPDATE_PROVIDER_PARSER_IMPLEMENTATION=1 make provider-exchange-check\`; checked by
// packages/runtime/src/provider-parsers.test.ts. The digest covers the complete static local
// import closure of provider-parsers.ts (rfc/provider-exchange-and-execution.md §4).
export const PROVIDER_PARSER_IMPLEMENTATION = Object.freeze({
  files: Object.freeze(${JSON.stringify(files, null, 2).replace(/\n/gu, "\n  ")} as readonly string[]),
  closureDigest: "${closureDigest}",
} as const);
`);
      return;
    }
    expect(PROVIDER_PARSER_IMPLEMENTATION.files).toEqual(files);
    expect(PROVIDER_PARSER_IMPLEMENTATION.closureDigest, "parser source changed: regenerate with UPDATE_PROVIDER_PARSER_IMPLEMENTATION=1 make provider-exchange-check").toBe(closureDigest);
  });
});
