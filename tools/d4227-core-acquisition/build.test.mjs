import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CANDIDATE, ALGEBRA, appendResearch, functionSource, rawAlgebra } from "./build.mjs";

test("research access is append-only and cannot alter any production statement", () => {
  for (const path of [CANDIDATE, ALGEBRA]) {
    const source = readFileSync(path, "utf8"), appended = appendResearch(path, source);
    assert.equal(appended.slice(0, source.length), source);
    assert.throws(() => appendResearch(path, appended));
  }
  const source = readFileSync(CANDIDATE, "utf8");
  assert.throws(() => appendResearch(CANDIDATE, source.replace('function childFen', 'function removedChildFen')));
  assert.throws(() => appendResearch(CANDIDATE, source + '\nfunction childFen() {}'));
});
test("raw algebra differs only in explicitly unclaimed ownership/failure adapters", () => {
  const source = readFileSync(ALGEBRA, "utf8"), original = functionSource(ALGEBRA, source, "computeSubjectOutcomes");
  const restored = rawAlgebra(source)
    .replace("function __d4227RawOutcomes<F extends SubjectOutcomeFamily>(family: F, frame: import('../../../tools/d4227-core-acquisition/types.js').RawCoreFrame, moveUci: string)",
      "export function computeSubjectOutcomes<F extends SubjectOutcomeFamily>(family: F, receipt: CandidatePopulationReceipt<CandidateWideScope>, moveUci: string)")
    .replace("const played = frame.candidates.find(row => row.move.uci === moveUci)?.row;\n  if (played === undefined) throw new TypeError('Raw experiment requires an actual legal played member');",
      "const frame = readCandidateFoundationSources(receipt), played = candidatePlayedRow(receipt, moveUci);")
    .replace("/* D4227: unrelated collector failure image NOT acquired or authenticated. */", "readCandidateUnavailableSources(receipt);")
    .replaceAll("frame.legalMovesInput.payload.fen", "receipt.packet.beforeFen")
    .replaceAll("frame.legalMovesInput.payload.turn", "receipt.legalMovesInput.payload.turn");
  assert.equal(restored, original);
  for (const anchor of ["readCandidateUnavailableSources(receipt);", "const frame = readCandidateFoundationSources(receipt), played = candidatePlayedRow(receipt, moveUci);"])
    assert.throws(() => rawAlgebra(source.replace(anchor, "")));
  assert.throws(() => rawAlgebra(source.replace("const positions =", "receipt.newDependency; const positions =")));
});
