import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateMaiaHistoryReplay } from "./maia-history-replay-check.mjs";

const directory = "planning/semantic-consequence-search";
const graphBytes = readFileSync(`${directory}/d3262-exact-replies.json`);
const directBytes = readFileSync(`${directory}/d3262-maia-direct-logits.json`);
const graph = JSON.parse(graphBytes), direct = JSON.parse(directBytes);
const replay = JSON.parse(readFileSync(`${directory}/d3262-maia-history-replay.json`));
const verify = (value) => validateMaiaHistoryReplay(graph, graphBytes, direct, directBytes, value);

test("root-replayed Maia policy remains a distinct source from the empty-FEN diagnostic", () => {
  const result = verify(replay);
  assert.equal(result.positions, 196);
  assert.equal(result.changedRaw, 195);
  assert.equal(result.changedPrefix80, 91);
  assert.equal(result.changedPrefix90, 100);
  assert.equal(result.changedTopMove, 32);
  assert.ok(result.maxConfiguredTotalVariation > 0.9);
});

test("history, FEN, source, legal denominator and measured delta cannot be relabelled", () => {
  const history = structuredClone(replay);
  history.rows[0].historyUci = [];
  assert.throws(() => verify(history), /path mismatch/u);

  const fen = structuredClone(replay);
  fen.rows[0].fen = fen.rows[1].fen;
  assert.throws(() => verify(fen), /path mismatch/u);

  const source = structuredClone(replay);
  source.source.historyUci = [];
  assert.throws(() => verify(source), /source or history differs/u);

  const legal = structuredClone(replay);
  legal.rows[0].rawFullLegal.pop();
  assert.throws(() => verify(legal), /does not normalize|Incomplete or unordered/u);

  const delta = structuredClone(replay);
  delta.rows[0].configuredTotalVariationFromEmpty = 0;
  assert.throws(() => verify(delta), /Configured total variation/u);

  const prefix = structuredClone(replay);
  prefix.rows[0].pathPrefix90 = [];
  assert.throws(() => verify(prefix), /pathPrefix90/u);
});
