import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  LIVE_CONSUMERS,
  RevisionCatalogue,
  SUCCESSOR_CONSUMERS,
  assertConsumerClosure,
  compileHistoricalPack,
  migrateLegacyConcept,
  recordHistoricalOccurrence,
  revisionBytes,
} from "./model.mjs";

const rfc = readFileSync("rfc/concept-registry.md", "utf8");
const makefile = readFileSync("Makefile", "utf8");

function catalogue() {
  const value = new RevisionCatalogue();
  const first = value.publish(revisionBytes(null, [
    { id: "fork", label: "Fork", status: "active" },
    { id: "pin", label: "Pin", status: "active" },
  ]));
  return { value, first };
}

test("D2661 the maintained baseline follows the live migration position", () => {
  assert.match(rfc, /migration \| position behind evidence-job-durability/u);
  assert.doesNotMatch(rfc.slice(0, rfc.indexOf("Fresh independent review return")), /position behind longitudinal-store/u);
});

test("D2662 exact historical refs survive label rename and retirement", () => {
  const { value, first } = catalogue();
  const oldRef = { id: "fork", registrySchemaVersion: 1, registryDigest: first.digest };
  const second = value.publish(revisionBytes(first.digest, [
    { id: "fork", label: "Knight fork", status: "retired" },
    { id: "pin", label: "Pin", status: "active" },
  ]));
  assert.notEqual(first.digest, second.digest);
  assert.deepEqual(value.resolve(oldRef), { kind: "resolved", ref: oldRef, label: "Fork", status: "active" });
  assert.equal(value.resolve({ ...oldRef, registryDigest: second.digest }).label, "Knight fork");
  assert.throws(() => value.publish(revisionBytes(second.digest, [{ id: "pin", label: "Pin", status: "active" }])), /append-only/u);
});

test("D2663 only an exact historical pack occurrence becomes a registered concept", () => {
  const { value } = catalogue();
  const row = { runId: "run-1", branchId: "branch-1", packId: "pack-a", conceptKey: "pack:pack-a#fork", label: "fork" };
  const pack = compileHistoricalPack(JSON.stringify({ id: "pack-a", concepts: ["fork"] }));
  const attempt = { runId: "run-1", branchId: "branch-1", packId: "pack-a", packDigest: pack.digest };
  const occurrence = recordHistoricalOccurrence(attempt, { id: "run-1", packId: "pack-a", packDigest: pack.digest, branchIds: ["branch-1"] });
  assert.equal(migrateLegacyConcept(row, occurrence, pack, value).kind, "registered");
  assert.deepEqual(migrateLegacyConcept({ ...row, conceptKey: "pack:pack-a#pin" }, occurrence, pack, value), {
    kind: "legacy_unverified", reason: "concept_absent_from_exact_pack", runId: "run-1", branchId: "branch-1", packId: "pack-a", rawKey: "pack:pack-a#pin", storedLabel: "fork",
  });
  assert.equal(migrateLegacyConcept(row, occurrence, null, value).reason, "pack_artifact_unavailable");
  assert.throws(() => migrateLegacyConcept(row, { ...occurrence }, pack, value), /unasserted historical occurrence/u);
  assert.throws(() => migrateLegacyConcept(row, occurrence, { ...pack }, value), /unasserted historical pack artifact/u);
});

test("D2664 six landing consumers close independently of two successor discharges", () => {
  assert.equal(LIVE_CONSUMERS.length, 6);
  assert.deepEqual(SUCCESSOR_CONSUMERS, ["campaign.catalogue", "skills.credit"]);
  assert.deepEqual(assertConsumerClosure(LIVE_CONSUMERS).pendingSuccessors, SUCCESSOR_CONSUMERS);
  assert.throws(() => assertConsumerClosure([...LIVE_CONSUMERS, ...SUCCESSOR_CONSUMERS]), /not closed/u);
  assert.throws(() => assertConsumerClosure(LIVE_CONSUMERS.slice(1)), /not closed/u);
});

test("D2665 repaired author coverage stays in the opt-in draft-evidence tier", () => {
  const governance = /^verify-governance:.*$/mu.exec(makefile)?.[0] ?? "";
  const draftEvidence = /^verify-rfc-evidence:.*$/mu.exec(makefile)?.[0] ?? "";
  assert.doesNotMatch(governance, /concept-registry-author-repair/u);
  assert.match(draftEvidence, /concept-registry-author-repair/u);
  assert.match(makefile, /^concept-registry-author-repair: concept-registry-author-contract$/mu);
});

test("D2666 this RFC validates export but does not invent account restore", () => {
  assert.match(rfc, /Account\s+export writes typed concept refs/u);
  assert.match(rfc, /A future portable-account-import RFC/u);
  assert.doesNotMatch(rfc.slice(rfc.indexOf("## Acceptance criteria")), /Export\/delete\/restore/u);
});
