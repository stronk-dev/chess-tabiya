import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { Chess } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { legalMoves } from "./exact-reply-enumeration.mjs";
import { manifestIdentity, manifestRows } from "./manifest.mjs";
import { validateCoherentRecapture } from "./stockfish-coherent-recapture-check.mjs";

const source = { engineName: "Stockfish 19", executableDigest: "sha256:" + "a".repeat(64), threads: 1, hashMb: 16, scorePerspective: "raw_uci_uninterpreted", multiPv: "top8_legal_root_moves" };
const old = { source };
const job = { rootId: manifestRows[0].id, fen: manifestRows[0].fen };
const moves = legalMoves(Chess.fromSetup(parseFen(job.fen).unwrap()).unwrap()).map((row) => row.uci);
const probe = (budget) => ({
  budget, terminal: false, legal: moves,
  entries: moves.slice(0, 8).map((moveUci, rank) => ({ rank: rank + 1, depth: 4, moveUci, score: { kind: "cp", value: 0, bound: false }, pv: [moveUci] })),
  missingMoves: moves.slice(8), coherentDepth: 4, trailingPartialDepth: null, elapsedMs: 1,
});
const artifact = () => ({ version: 1, manifest: manifestIdentity.manifestDigest, partial: false, start: 0, positions: 1,
  source: { ...source }, rows: [{ ...job, probes: [probe("depth8"), probe("depth12"), probe("movetime100")] }] });
const copy = (value) => structuredClone(value);

test("coherent recapture checks a complete ranked legal table", () => {
  assert.deepEqual(validateCoherentRecapture(artifact(), [job], old, "root"),
    { positions: 1, legalInstances: moves.length * 3, rankedEntries: 24, trailingPartials: 0 });
});

test("mixed depth and omitted rank fail instead of becoming top-eight evidence", () => {
  const mixed = artifact(); mixed.rows[0].probes[2].entries[1].depth = 5;
  assert.throws(() => validateCoherentRecapture(mixed, [job], old, "root"), /Mixed or invalid coherent rank/);
  const omitted = artifact(); omitted.rows[0].probes[2].entries.pop();
  assert.throws(() => validateCoherentRecapture(omitted, [job], old, "root"), /Incomplete coherent rank table/);
});

test("source drift, illegal PV and shifted population fail", () => {
  const sourceDrift = artifact(); sourceDrift.source.executableDigest = "sha256:" + "b".repeat(64);
  assert.throws(() => validateCoherentRecapture(sourceDrift, [job], old, "root"), /source changed/);
  const illegal = artifact(); illegal.rows[0].probes[0].entries[0].pv = [illegal.rows[0].probes[0].entries[0].moveUci, "a1a8"];
  assert.throws(() => validateCoherentRecapture(illegal, [job], old, "root"), /Illegal PV move/);
  const shifted = artifact(); shifted.rows[0].rootId = "other";
  assert.throws(() => validateCoherentRecapture(shifted, [job], old, "root"), /Crossed coherent root position/);
});

test("child capture binds the exact-reply graph digest", () => {
  const graph = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-exact-replies.json"));
  const first = graph.roots[0].candidates[0];
  const childJob = { rootId: graph.roots[0].rootId, candidateUci: first.candidateUci, fen: first.afterFen, replies: first.replies.map((reply) => reply.uci) };
  const child = copy(artifact()); child.source.multiPv = "top8_legal_moves_at_candidate_child";
  child.rows = [{ ...childJob, probes: child.rows[0].probes }];
  child.exactReplyDigest = "sha256:" + "a".repeat(64);
  assert.throws(() => validateCoherentRecapture(child, [childJob], { source: child.source }, "child", "sha256:" + "b".repeat(64)), /graph changed/);
});

test("same-width all-legal capture refuses a top-eight substitute", () => {
  const all = artifact(); all.source.multiPv = "coherent_all_legal_root_moves";
  assert.throws(() => validateCoherentRecapture(all, [job], old, "root-all"), /Incomplete coherent rank table/);
});
