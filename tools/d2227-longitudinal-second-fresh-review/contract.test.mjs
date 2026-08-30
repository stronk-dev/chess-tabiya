// DISPOSABLE second fresh independent review harness — D2227-D2232. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/longitudinal-store.md");
const folded = rfc.slice(
  rfc.indexOf("## Folded normative specification"),
  rfc.indexOf("## Fresh-return author obligations"),
);
const ddl = folded.slice(
  folded.indexOf("### C. Durable projection schedule"),
  folded.indexOf("### D. Revision identity and attribution"),
);

test("D2227: storage excludes the runtime classifier's unclear result", () => {
  const phase = read("packages/runtime/src/phase.ts");
  assert.match(phase, /type DetectedPhase = "opening" \| "middlegame" \| "endgame" \| "unclear"/u);
  assert.match(phase, /\? "unclear"/u);
  assert.match(ddl, /phase IN \('opening','middlegame','endgame'\)/u);
  assert.doesNotMatch(folded, /phase IN \('opening','middlegame','endgame','unclear'\)|"unclear" \[\]|"unclear"\)/u);
});

test("D2228: decision and structure derivation remain only in non-normative history", () => {
  const history = rfc.slice(rfc.indexOf("## Historical 2026-08-22 specification"));
  assert.match(rfc, /This is the one implementation contract/u);
  assert.match(rfc, /Historical 2026-08-22 specification \(non-normative\)/u);
  assert.match(history, /Decision class[\s\S]*`played`[\s\S]*`game`[\s\S]*`predicted`/u);
  assert.match(history, /group\.created\.sourceNodeId[\s\S]*outcome\.reached\.nodeId/u);
  assert.doesNotMatch(folded, /group\.created\.sourceNodeId|importedMainlinePlies|classifyPhase\(parent\.fen\)/u);
});

test("D2229: measured work exceeds the unrenewable default lease", () => {
  assert.match(folded, /47\.29 seconds/u);
  assert.match(folded, /workerLeaseMs: 30000/u);
  assert.doesNotMatch(folded, /renewLongitudinalClaim|extendLongitudinalLease|heartbeat.*lease|lease.*heartbeat/iu);
  const model = read("tools/d1612-longitudinal-contract-harness/longitudinal-contract.ts");
  assert.match(model, /workerLeaseMs: 30_000/u);
  assert.doesNotMatch(model, /renew|heartbeat/u);
});

test("D2230: all_complete enumerates jobs rather than eligible runs", () => {
  assert.match(folded, /`all_complete` selects the learner's profileable jobs/u);
  assert.doesNotMatch(folded, /all_complete[^.]{0,300}(?:eligible|profileable) runs[\s\S]{0,180}LEFT JOIN|left-join jobs/iu);
});

test("D2231: existing runs have no mandatory upgrade reconciliation", () => {
  assert.match(rfc, /migration body[\s\S]*No backfill/u);
  assert.match(rfc, /run once at landing \(and[\s\S]*after upgrading\)/u);
  assert.doesNotMatch(folded, /startup reconciliation|upgrade reconciliation|enqueueExisting|reconcileLongitudinalJobs/u);
});

test("D2232: valid learner and run identities are not relationally bound", () => {
  assert.match(ddl, /learner_id TEXT NOT NULL REFERENCES learners\(id\)/u);
  assert.match(ddl, /run_id TEXT NOT NULL REFERENCES drill_runs\(id\)/u);
  assert.doesNotMatch(ddl, /FOREIGN KEY \(run_id, ?learner_id\)|REFERENCES drill_runs\(id, ?owner_learner_id\)|owner_learner_id=:learner/u);
  assert.doesNotMatch(folded, /run-owner CAS|run owner still matches|learner\/run ownership/u);
});
