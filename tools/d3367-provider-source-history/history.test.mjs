import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { assertLandingDeclarations, assertLandingProfiles, assertLandingValidation,
  assertLandingPack, assertLandingLedger, isPackPath, SOURCE_HISTORY_SUCCESSORS, checkSourceHistory } from "./history.mjs";

const row = (subjectId, version) => ({ subjectId, id: { id: subjectId, version: { kind: "integer", value: version } }, semanticsDigest: `test:${subjectId}:${version}` });
const image = rows => `export const GENERATED_CAPABILITY_DECLARATIONS: readonly GeneratedCapabilityDeclaration[] = Object.freeze(JSON.parse(String.raw\`${JSON.stringify(rows)}\`) as GeneratedCapabilityDeclaration[]);`;
const base = SOURCE_HISTORY_SUCCESSORS.map(id => row(id, 6));
const landed = [...base, ...SOURCE_HISTORY_SUCCESSORS.map(id => row(id, 7))];
const current = [...landed, row("derived.story.rank", 2), row(SOURCE_HISTORY_SUCCESSORS[0], 8)];

test("later subjects and versions do not become original landing successors", () => {
  assert.deepEqual(assertLandingDeclarations(image(base), image(landed), image(current)), {
    predecessorDeclarations: 7, landedDeclarations: 14, currentDeclarations: 16, originalSuccessors: 7,
  });
});
test("original landing still refuses missing, extra, duplicate and wrong-version successors", () => {
  const changed = structuredClone(landed); changed.at(-1).id.version.value = 8;
  for (const candidate of [landed.slice(0, -1), [...landed, row("new.subject", 1)], [...landed, landed.at(-1)], changed])
    assert.throws(() => assertLandingDeclarations(image(base), image(candidate), image(current)));
});
test("current preservation refuses deleting or rewriting any landed declaration", () => {
  const changed = structuredClone(current); changed[0].semanticsDigest = "rewritten";
  assert.throws(() => assertLandingDeclarations(image(base), image(landed), image(current.slice(1))), /REMOVED/u);
  assert.throws(() => assertLandingDeclarations(image(base), image(landed), image(changed)), /REWRITTEN/u);
});
test("factory output membership and payload changes remain failures", () => {
  const before = { source: { payloadDigests: ["old"], cardinality: 1 } };
  assert.equal(assertLandingProfiles(before, structuredClone(before)), 1);
  for (const after of [{}, { ...before, other: before.source }, { source: { payloadDigests: ["new"], cardinality: 1 } }])
    assert.throws(() => assertLandingProfiles(before, after), /factory outcomes/u);
});
test("only implementation pins may differ in the historical validation image", () => {
  const before = { operations: [{ id: "op", files: ["a.ts"], implementationDigest: "old" }],
    populations: [{ id: "population", observations: 2, predicateImplementationDigest: "old" }], cases: [{ id: "positive", status: "passed" }] };
  const after = structuredClone(before); after.operations[0].implementationDigest = "new"; after.populations[0].predicateImplementationDigest = "new";
  assertLandingValidation(before, after);
  for (const mutate of [value => value.operations[0].files.push("b.ts"), value => value.populations[0].observations++,
    value => value.cases[0].status = "failed", value => value.extra = true, value => value.operations.pop()]) {
    const changed = structuredClone(after); mutate(changed);
    assert.throws(() => assertLandingValidation(before, changed));
  }
});
test("all pack forms are counted by source location, not a line-only spine predicate", () => {
  for (const path of ["content/drafts/line.json", "content/drafts/outcome.json", "content/candidates/endgame/pack.json",
    "schemas/drill_pack.example.json", "schemas/fixtures/drill-pack/outcome.json"]) assert(isPackPath(path), path);
  for (const path of ["content/drafts/endgame.evidence.json", "content/drafts/endgame.sources.json", "content/drafts/endgame.job.json",
    "content/drafts/endgame.graduation.json", "content/drafts/endgame.priority.json", "content/candidates/endgame/evidence.json", "content/shapes/outcome.json"])
    assert(!isPackPath(path), path);
});
test("metadata-only pack/ledger comparison preserves all authored and evidence fields", () => {
  const before = { mode: "outcome", objective: { summary: "Recorded objective" }, requires: ["old"] };
  const after = { ...before, requires: ["new"] }, digest = assertLandingPack("outcome.json", before, after);
  const ledger = { packDigest: "old", records: [{ kind: "position_legality", supports: ["/start/fen"] }] };
  assertLandingLedger("evidence.json", ledger, { ...ledger, packDigest: digest }, digest);
  assert.throws(() => assertLandingPack("outcome.json", before, { ...after, objective: { summary: "New lesson" } }), /authored pack/u);
  assert.throws(() => assertLandingLedger("evidence.json", ledger, { packDigest: digest, records: [] }, digest), /ledger evidence/u);
  assert.throws(() => assertLandingLedger("evidence.json", ledger, ledger, digest), /digest mismatch/u);
});
test("the real fixed Git landing and all later declarations remain intact", () => {
  const result = checkSourceHistory(process.cwd(), readFileSync("packages/runtime/src/capability/declarations.generated.ts", "utf8"));
  assert.equal(result.predecessorDeclarations, 859);
  assert.equal(result.landedDeclarations, 866);
  assert.equal(result.originalSuccessors, 7);
  assert.equal(result.unchangedFactoryProfiles, 275);
  assert.equal(result.authoredPacks, 104);
  assert.equal(result.associatedLedgers, 68);
  assert.equal(result.unchangedOtherSources, 192);
  assert(result.currentDeclarations > result.landedDeclarations);
});
