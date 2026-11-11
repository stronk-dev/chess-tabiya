// DISPOSABLE append-only private-core access and a guarded raw-algebra clone. No production edits.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { build } from "esbuild";

export const KEY = "__TABIYA_D4227_RAW_RESEARCH__";
export const CANDIDATE = "packages/runtime/src/candidate-population.ts";
export const ALGEBRA = "packages/runtime/src/semantic-subject-outcomes.ts";
function once(source, from, to) {
  assert.equal(source.split(from).length, 2, `Expected one original anchor: ${from}`);
  return source.replace(from, to);
}
export function functionSource(path, source, name) {
  const tree = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const functions = tree.statements.filter(node => ts.isFunctionDeclaration(node) && node.name?.text === name && node.body);
  assert.equal(functions.length, 1, `Expected one original function ${name}`);
  return functions[0].getText(tree);
}
export function rawAlgebra(source) {
  let clone = functionSource(ALGEBRA, source, "computeSubjectOutcomes");
  clone = once(clone,
    "export function computeSubjectOutcomes<F extends SubjectOutcomeFamily>(family: F, receipt: CandidatePopulationReceipt<CandidateWideScope>, moveUci: string)",
    "function __d4227RawOutcomes<F extends SubjectOutcomeFamily>(family: F, frame: import('../../../tools/d4227-core-acquisition/types.js').RawCoreFrame, moveUci: string)");
  clone = once(clone, "const frame = readCandidateFoundationSources(receipt), played = candidatePlayedRow(receipt, moveUci);",
    "const played = frame.candidates.find(row => row.move.uci === moveUci)?.row;\n  if (played === undefined) throw new TypeError('Raw experiment requires an actual legal played member');");
  // This obligation is deliberately UNMEASURED here: no collector failure image was acquired.
  // Never use this clone as a factory, admission path or claimed whole-source equivalence.
  clone = once(clone, "readCandidateUnavailableSources(receipt);", "/* D4227: unrelated collector failure image NOT acquired or authenticated. */");
  assert.equal(clone.split("receipt.packet.beforeFen").length, 3);
  clone = clone.replaceAll("receipt.packet.beforeFen", "frame.legalMovesInput.payload.fen");
  assert.equal(clone.split("receipt.legalMovesInput.payload.turn").length, 3);
  clone = clone.replaceAll("receipt.legalMovesInput.payload.turn", "frame.legalMovesInput.payload.turn");
  assert(!/\breceipt\b/u.test(clone), "Unexpected receipt dependency in raw clone");
  return clone;
}
export function appendResearch(path, source) {
  assert(!source.includes(KEY), "Research hook already appended");
  if (path === CANDIDATE) {
    for (const name of ["compileLegalPopulation", "childFen", "candidateFoundationPosition", "assertCandidateFoundationPosition"])
      functionSource(path, source, name);
    assert(source.includes('import { foundationPositionCells'));
    return source + `
// DISPOSABLE D4227. Plain raw data; no compileCandidatePopulationReceipt/owner-map registration.
function __d4227AcquireCore(fen: string) {
  const legal = compileLegalPopulation(fen), beforeFen = legal.legalMovesInput.payload.fen;
  const root = candidateFoundationPosition(foundationPositionCells(beforeFen, legal.legalMovesInput), legal.legalMovesInput, null);
  assertCandidateFoundationPosition(root, legal.legalMovesInput, beforeFen, null);
  const candidates = Object.freeze(legal.legalMoves.map(move => {
    const afterFen = childFen(beforeFen, move);
    const position = candidateFoundationPosition(foundationPositionCells(afterFen), legal.legalMovesInput, move.uci);
    assertCandidateFoundationPosition(position, legal.legalMovesInput, afterFen, move.uci);
    return Object.freeze({ move, row: Object.freeze({ moveUci: move.uci, afterFen }), position });
  }));
  return Object.freeze({ legalMovesInput: legal.legalMovesInput, root, candidates });
}
Object.assign((globalThis as any)[${JSON.stringify(KEY)}] ??= {}, { acquire: __d4227AcquireCore });
`;
  }
  assert.equal(path, ALGEBRA);
  return source + "\n// DISPOSABLE unadmitted algebra; collector-failure coverage is explicitly unclaimed.\n"
    + rawAlgebra(source) + `\nObject.assign((globalThis as any)[${JSON.stringify(KEY)}] ??= {}, { compute: __d4227RawOutcomes });\n`;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const loaded = new Set();
  await build({ entryPoints: ["tools/d4227-core-acquisition/run.ts"], bundle: true, platform: "node", format: "esm",
    external: ["typescript"], logLevel: "warning", outfile: ".cache/d4227-core-acquisition/probe.mjs",
    plugins: [{ name: "D4227-append-only-raw-core", setup(build) {
      build.onLoad({ filter: /\.ts$/ }, args => {
        const path = [CANDIDATE, ALGEBRA].find(path => resolve(path) === args.path); if (!path) return;
        assert(!loaded.has(path)); loaded.add(path);
        return { contents: appendResearch(path, readFileSync(path, "utf8")), loader: "ts" };
      });
    } }] });
  assert.deepEqual([...loaded].sort(), [CANDIDATE, ALGEBRA].sort());
}
