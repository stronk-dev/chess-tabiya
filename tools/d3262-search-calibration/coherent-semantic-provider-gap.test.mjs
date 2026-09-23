import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

import { compileSemanticProviderGap } from "./coherent-semantic-provider-gap.mjs";

const directory = "planning/semantic-consequence-search";
const load = (name) => JSON.parse(readFileSync(`${directory}/${name}.json`, "utf8"));
const reserve = load("d3262-coherent-semantic-reserve");
const graph = load("d3262-coherent-exact-replies");
const union = load("d3262-coherent-deeper-source-union");
const stockfishOld = load("d3262-stockfish-horizon4-capture");
const stockfishNew = load("d3262-stockfish-coherent-deeper-supplement");
const maiaOld = load("d3262-maia-horizon4-path-capture");
const maiaNew = load("d3262-maia-coherent-deeper-supplement");
const result = load("d3262-coherent-semantic-provider-gap");
const inputs = [reserve, graph, union, stockfishOld, stockfishNew, maiaOld, maiaNew];

test("source-blind event paths retain exact legal identity and one missing provider pair", () => {
  assert.equal(result.paths.length, 152);
  assert.equal(result.paths.filter((row) => !row.priorUnion).length, 68);
  const missing = result.paths.filter((row) => row.needsStockfish || row.needsMaia);
  assert.equal(missing.length, 1);
  assert.deepEqual(missing.map(({ rootId, candidateUci, replyUci, needsStockfish, needsMaia }) =>
    ({ rootId, candidateUci, replyUci, needsStockfish, needsMaia })), [{
    rootId: "d1023:32dbd41ca364bdb7", candidateUci: "f7f5", replyUci: "c1f4",
    needsStockfish: true, needsMaia: true,
  }]);
  assert.deepEqual(compileSemanticProviderGap(...inputs).paths, result.paths);
});

test("an invented reserved reply cannot become a provider-capture job", () => {
  const wrongReserve = { ...reserve, rows: reserve.rows.map((row, index) => index === 0
    ? { ...row, eventSourceWidth: "all_legal", reservedUci: "a1a1" } : row) };
  assert.throws(() => compileSemanticProviderGap(wrongReserve, ...inputs.slice(1)),
    /not an exact legal reply/);
});

test("a crossed path-FEN and duplicated capture identity fail closed", () => {
  const selected = result.paths.find((row) => row.maia?.source === "d3262-maia-horizon4-path-capture.json");
  assert.ok(selected);
  const wrongMaia = { ...maiaOld, rows: maiaOld.rows.map((row, index) => index === selected.maia.row
    ? { ...row, fen: "8/8/8/8/8/8/8/8 w - - 0 1" } : row) };
  assert.throws(() => compileSemanticProviderGap(...inputs.slice(0, 5), wrongMaia, maiaNew),
    /Crossed Maia path/);
  const duplicateStockfish = { ...stockfishNew, rows: [...stockfishNew.rows, stockfishOld.rows[0]] };
  assert.throws(() => compileSemanticProviderGap(...inputs.slice(0, 4), duplicateStockfish, maiaOld, maiaNew),
    /Duplicate Stockfish source identity across captures/);
});
