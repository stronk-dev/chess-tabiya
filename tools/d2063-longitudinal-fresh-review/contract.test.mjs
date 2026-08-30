// DISPOSABLE fresh independent review harness — D2063-D2069. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/longitudinal-store.md");

function section(start, end) {
  const from = rfc.indexOf(start);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return rfc.slice(from, to);
}

const folded = section("## Folded normative specification", "## Motivation");

test("D2063: the durable identity drops semantic sign", () => {
  const ddl = section("### C. Durable projection schedule", "### D. Revision identity and attribution");
  assert.match(ddl, /projection_id TEXT NOT NULL/u);
  assert.doesNotMatch(ddl, /event_sign|semantic_sign|sign TEXT/u);
  const runtime = read("packages/runtime/src/semantic-evidence.ts");
  for (const sign of ["gained", "lost", "preserved", "state", "avoided"]) {
    assert.match(runtime, new RegExp(`sign: [^\\n]*[\"']${sign}[\"']|[\"']${sign}[\"']`, "u"));
  }
  assert.match(runtime, /familyKey\(event[\s\S]*projection[\s\S]*event\.sign/u);
});

test("D2064: publication requires and violates requested-sequence equality", () => {
  const schedule = section("### C. Durable projection schedule", "### D. Revision identity and attribution");
  assert.match(schedule, /pins `\(run_id, requested_seq=N, derived_rev, generation, token, worker\)`/u);
  assert.match(schedule, /only if the whole claim tuple still matches/u);
  assert.match(schedule, /If `requested_seq` advanced to M while\s+N was running, N may publish/u);
  assert.doesNotMatch(schedule, /claimed_seq|claim_requested_seq|requested_seq >= N|requested_seq is excluded from the ownership CAS/u);
  const authorModel = read("tools/d1612-longitudinal-contract-harness/longitudinal-contract.ts");
  const owns = authorModel.slice(authorModel.indexOf("#owns("), authorModel.indexOf("publish(", authorModel.indexOf("#owns(")));
  assert.doesNotMatch(owns, /requestedSeq/u);
});

test("D2065: rebuild can resurrect deleted behavioral rows under the legacy owner", () => {
  assert.match(folded, /All four classes join account export\/deletion coverage/u);
  assert.match(rfc, /derive `projectObservations` over every run in `drill_runs`/u);
  assert.match(rfc, /`__legacy` reassignment[\s\S]*deliberately not used/u);
  const storage = read("apps/server/src/storage.ts");
  assert.match(storage, /UPDATE drill_runs SET owner_learner_id=\?,active_writer_learner_id=\?/u);
  assert.match(storage, /LEGACY_ID/u);
  assert.doesNotMatch(folded, /deleted_owner|tombstoned_owner|exclude(?:s|d)? (?:legacy|tombstoned|reassigned) runs|rebuild suppression/u);
});

test("D2066: edge opportunity and share algebra is absent from the normative fold", () => {
  const constructors = section("### A. Closed constructor registry", "### B. Exact decision references");
  assert.match(constructors, /For base family `F`, a\s+decision is an opportunity only when/u);
  assert.doesNotMatch(constructors, /For (?:an |each )?edge (?:family|projection)|forced move|alternative_share_sum/u);
  assert.doesNotMatch(folded, /sameFamilyShare|exhibiting alternatives \/ legal alternatives/u);
  const authorModel = read("tools/d1612-longitudinal-contract-harness/longitudinal-contract.ts");
  assert.match(authorModel, /opportunity: boolean/u);
  assert.doesNotMatch(authorModel, /localSemanticEvents|legalAlternativeEdges|alternativeShare/u);
});

test("D2067: the promised typed read contract has no type or operation", () => {
  assert.match(folded, /typed read contract returns `\{ state, rows \}`/u);
  assert.doesNotMatch(folded, /interface Longitudinal(?:Read|Rows|Store)|type Longitudinal(?:Read|Rows|Store)|readLongitudinal|observationState\(/u);
  assert.doesNotMatch(folded, /readonly denominators:|readonly observations:|readonly structureStats:/u);
  assert.match(rfc, /observations\(learnerId: string/u);
  assert.match(rfc, /derived_at lower bound/u);
  assert.match(rfc, /Historical 2026-08-22 specification \(non-normative\)/u);
});

test("D2068: the normative migration promises unnamed indexes and weak fact constraints", () => {
  const schedule = section("### C. Durable projection schedule", "### D. Revision identity and attribution");
  assert.doesNotMatch(schedule, /CREATE INDEX/u);
  assert.match(folded, /exactly the four folded tables and their indexes/u);
  assert.match(schedule, /occurred INTEGER NOT NULL CHECK \(occurred <= opportunities\)/u);
  assert.doesNotMatch(schedule, /occurred >= 0/u);
  assert.doesNotMatch(schedule, /alternative_share_sum >= 0|alternative_share_sum <= opportunities/u);
  assert.doesNotMatch(schedule, /CHECK \(\(session_kind = 'pack'/u);
  assert.match(rfc, /`STORAGE_VERSION` is \*\*24\*\*/u);
  assert.match(read("apps/server/src/storage.ts"), /export const STORAGE_VERSION = 25/u);
});

test("D2069: background projection has no production worker lifecycle or bounded door", () => {
  assert.match(folded, /background-only at revision 1/u);
  assert.match(folded, /A worker claims bounded batches/u);
  assert.doesNotMatch(folded, /LongitudinalWorker|startLongitudinal|stopLongitudinal|longitudinal-worker\.ts|make longitudinal-worker|workerBatchSize|workerPoll/u);
  assert.doesNotMatch(read("apps/server/src/application.ts"), /LongitudinalWorker|longitudinalWorker/u);
  assert.doesNotMatch(read("Makefile"), /^longitudinal-worker:/mu);
});
