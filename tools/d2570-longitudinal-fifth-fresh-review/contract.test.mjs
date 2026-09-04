import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/longitudinal-store.md");
const storage = read("apps/server/src/storage.ts");
const retainedModel = read("tools/d1612-longitudinal-contract-harness/longitudinal-contract.ts");
const fifthModel = read("tools/d2514-longitudinal-fifth-author-repair/contract.ts");

function sliceBetween(source, start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `missing start token: ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing end token: ${end}`);
  return source.slice(from, to);
}

test("D2570: source-changing collaboration state is outside the scheduled writer closure", () => {
  const operations = sliceBetween(retainedModel, "export const RUN_WRITE_OPERATIONS", "] as const);");
  for (const runWriter of [
    "create", "createRatedRun", "createImportedRun", "createDerivedRun",
    "createRepertoireGapRun", "save", "saveArenaImport",
  ]) assert.ok(operations.includes(`"${runWriter}"`), `missing scheduled writer ${runWriter}`);

  for (const omittedMutation of ["createLiveSession", "grantRole", "claimLease", "seatMatchPlayer"]) {
    assert.ok(!operations.includes(`"${omittedMutation}"`), `unexpected scheduled mutation ${omittedMutation}`);
    assert.match(storage, new RegExp(`(?:^|\\n)  ${omittedMutation}\\(`, "u"));
  }

  const implementation = storage.slice(storage.indexOf("export class SQLiteRunStorage"));
  const liveCreate = sliceBetween(implementation, "  createLiveSession(input:", "  liveSession(sessionId:");
  assert.match(liveCreate, /INSERT INTO live_sessions/u);
  assert.match(liveCreate, /INSERT INTO match_states/u);
  assert.doesNotMatch(liveCreate, /learner_observation_jobs|longitudinalSource/u);
  assert.match(rfc, /structureAttribution: "single_player" \| "unattributable_shared"/u);
  assert.match(rfc, /An increased event head or changed source digest atomically moves/u);
});

test("D2571: the exact consumer boundary still returns undefined row types", () => {
  const readContract = sliceBetween(rfc, "interface LongitudinalReadQuery", "readLongitudinalSnapshot(");
  for (const name of ["DenominatorRow", "ObservationRow", "StructureStatRow"]) {
    assert.match(readContract, new RegExp(`${name}\\[\\]`, "u"));
    assert.doesNotMatch(rfc, new RegExp(`(?:interface|type) ${name}\\b`, "u"));
  }
  assert.match(retainedModel, /denominators: readonly unknown\[\]; readonly observations: readonly unknown\[\]; readonly structureStats: readonly unknown\[\]/u);
  assert.match(fifthModel, /readonly denominators: readonly unknown\[\]/u);
  assert.match(fifthModel, /readonly observations: readonly unknown\[\]/u);
  assert.match(fifthModel, /readonly structureStats: readonly unknown\[\]/u);
});

test("D2572: live acceptance requires import-subject state owned by a future contract", () => {
  const criterion = sliceBetween(rfc, "10. **Observed import boundary", "11. **Authoritative equality");
  for (const kind of ["learner_asserted", "observed_other", "unknown"]) assert.match(criterion, new RegExp(kind, "u"));
  assert.match(rfc, /future import-subject RFC; consumers enforce the revision-1 refusal meanwhile/u);
  const importedRecord = sliceBetween(storage, "export interface ImportedGameRecord", "export interface RunDerivation");
  assert.doesNotMatch(importedRecord, /learner_asserted|observed_other|assertedHandle|selectedSide|subject/u);
  assert.match(retainedModel, /export interface ImportSubject/u);
  assert.doesNotMatch(storage, /export interface ImportSubject/u);
});

test("D2573: filter values have no parser or deterministic empty/duplicate semantics", () => {
  const query = sliceBetween(rfc, "interface LongitudinalReadQuery", "type LongitudinalCompleteCut");
  for (const field of ["projections", "phases", "decisionClasses", "sessionKinds", "packIds"]) {
    assert.match(query, new RegExp(`${field}\\?`, "u"));
  }
  assert.doesNotMatch(rfc, /parseLongitudinalReadQuery|normalizeLongitudinalReadQuery|LONGITUDINAL_FILTER_(?:EMPTY|DUPLICATE|CONTRADICTION|UNKNOWN)/u);
  assert.doesNotMatch(retainedModel, /parseLongitudinalReadQuery|normalizeLongitudinalReadQuery|LONGITUDINAL_FILTER_(?:EMPTY|DUPLICATE|CONTRADICTION|UNKNOWN)/u);

  const rows = ["opening", "middlegame"];
  const emptyMeansAll = (filter) => filter.length === 0 ? rows : rows.filter((row) => filter.includes(row));
  const emptyMeansNone = (filter) => rows.filter((row) => filter.includes(row));
  assert.notDeepEqual(emptyMeansAll([]), emptyMeansNone([]));
});
