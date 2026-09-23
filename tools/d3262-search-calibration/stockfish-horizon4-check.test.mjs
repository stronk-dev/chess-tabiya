import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import { Chess } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { legalMoves } from "./exact-reply-enumeration.mjs";
import { validateHorizon4Capture } from "./stockfish-horizon4-check.mjs";

const bytes = readFileSync("planning/semantic-consequence-search/d3262-horizon4-frontier.json");
const frontier = JSON.parse(bytes);
const reference = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-stockfish-child-capture.json", "utf8"));
const job = frontier.jobs[0];
const legal = legalMoves(Chess.fromSetup(parseFen(job.fen).unwrap()).unwrap()).map((row) => row.uci);
const entries = legal.slice(0, 8).map((moveUci, index) => ({ moveUci, rank: index + 1, depth: 8, score: { kind: "cp", value: 0, bound: false }, pv: [moveUci] }));
const capture = {
  version: 1, manifest: frontier.manifest, frontierDigest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
  start: 0, positions: 1, partial: true,
  source: { ...reference.source, multiPv: "top8_legal_moves_at_selected_reply" },
  rows: [{ jobId: job.id, fen: job.fen, probes: ["depth8", "depth12", "movetime100"].map((budget) => ({ budget, legal, entries, missingMoves: legal.slice(8), terminal: false, coherentDepth: 8, trailingPartialDepth: null, bestmove: entries[0].moveUci, elapsedMs: 1 })) }],
};

test("a top-eight interval retains exact legal denominator without becoming complete MultiPV", () => {
  assert.deepEqual(validateHorizon4Capture(frontier, bytes, capture, reference), { positions: 1, legalMoves: legal.length * 3, rankedMoves: entries.length * 3, trailingPartial: 0 });
});

test("crossed source, rank/depth mixing, illegal PV and false full label fail", () => {
  const crossed = structuredClone(capture);
  crossed.frontierDigest = "sha256:wrong";
  assert.throws(() => validateHorizon4Capture(frontier, bytes, crossed, reference), /Crossed frontier capture/u);
  const mixed = structuredClone(capture);
  mixed.rows[0].probes[0].entries[1].depth = 9;
  assert.throws(() => validateHorizon4Capture(frontier, bytes, mixed, reference), /Mixed Stockfish rank table/u);
  const illegal = structuredClone(capture);
  illegal.rows[0].probes[0].entries[0].pv = [illegal.rows[0].probes[0].entries[0].moveUci, "a1a1"];
  assert.throws(() => validateHorizon4Capture(frontier, bytes, illegal, reference), /Illegal Stockfish PV move/u);
  const falseFull = structuredClone(capture);
  falseFull.partial = false;
  assert.throws(() => validateHorizon4Capture(frontier, bytes, falseFull, reference), /Partial\/full capture mislabelled/u);
});
