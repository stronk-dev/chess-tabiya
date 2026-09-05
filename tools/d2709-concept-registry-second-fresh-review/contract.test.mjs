import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import * as model from "../d2661-concept-registry-author-repair/model.mjs";

function catalogue() {
  const value = new model.RevisionCatalogue();
  const first = value.publish(model.revisionBytes(null, [
    { id: "fork", label: "Fork", status: "active" },
    { id: "pin", label: "Pin", status: "active" },
  ]));
  return { value, first };
}

function occurrenceFor(pack) {
  const attempt = { runId: "run-1", branchId: "branch-1", packId: pack.id, packDigest: pack.digest };
  return model.recordHistoricalOccurrence(attempt, {
    id: attempt.runId,
    packId: attempt.packId,
    packDigest: attempt.packDigest,
    branchIds: [attempt.branchId],
  });
}

test("D2709 noncanonical, duplicate-key and extra-key revision bytes publish", () => {
  const duplicate = new model.RevisionCatalogue();
  const duplicateHead = duplicate.publish('{"schemaVersion":0,"schemaVersion":1,"previousDigest":null,"entries":[{"id":"fork","label":"Fork","status":"active"}]}');
  assert.match(duplicateHead.digest, /^sha256:/u);
  const extra = new model.RevisionCatalogue();
  assert.doesNotThrow(() => extra.publish('{ "entries" : [ {"status":"active","label":"Fork","id":"fork","advice":"invented"} ], "previousDigest":null, "schemaVersion":1, "extra":true }'));
});

test("D2710 entry byte limits and Unicode scalar validity are not enforced", () => {
  const value = new model.RevisionCatalogue();
  assert.doesNotThrow(() => value.publish(model.revisionBytes(null, [
    { id: "a".repeat(81), label: "é".repeat(101), status: "active" },
    { id: "broken", label: "\ud800", status: "active" },
  ])));
});

test("D2711 a resolved historical ref remains caller-mutable and unparsed", () => {
  const { value, first } = catalogue();
  const ref = { id: "fork", registrySchemaVersion: 1, registryDigest: first.digest };
  const resolved = value.resolve(ref);
  ref.id = "pin";
  ref.registryDigest = "not-a-digest";
  assert.equal(resolved.ref.id, "pin");
  assert.equal(resolved.ref.registryDigest, "not-a-digest");
  assert.equal(value.resolve({ id: "fork", registrySchemaVersion: 1, registryDigest: "not-a-digest", extra: true }).kind, "registry_revision_unavailable");
});

test("D2712 arbitrary caller pack bytes mint the historical artifact authority", () => {
  const invented = model.compileHistoricalPack(JSON.stringify({ id: "pack-a", concepts: ["fork"] }));
  assert.equal(invented.id, "pack-a");
  assert.match(invented.digest, /^sha256:/u);
});

test("D2713 plain caller attempt and run objects mint an occurrence authority", () => {
  const pack = model.compileHistoricalPack(JSON.stringify({ id: "pack-a", concepts: ["fork"] }));
  assert.deepEqual(occurrenceFor(pack), {
    runId: "run-1", branchId: "branch-1", packId: "pack-a", packDigest: pack.digest,
  });
});

test("D2714 malformed concept populations are accepted by the historical pack compiler", () => {
  const pack = model.compileHistoricalPack(JSON.stringify({
    id: "pack-a",
    concepts: ["fork", "fork", "NOT A CONCEPT"],
    injected: { claim: "caller supplied" },
  }));
  assert.deepEqual(pack.concepts, ["fork", "fork", "NOT A CONCEPT"]);
});

test("D2715 there is no atomic population migration or lossless partition receipt", () => {
  assert.equal(model.migrateLegacyConceptBatch, undefined);
  assert.equal(model.assertLegacyMigrationReceipt, undefined);
  const source = readFileSync("tools/d2661-concept-registry-author-repair/model.mjs", "utf8");
  assert.doesNotMatch(source, /transaction|rollback|registered.*quarantine.*set-equal/iu);
});

test("D2716 consumer closure trusts a deduplicated caller string list, not imports", () => {
  assert.doesNotThrow(() => model.assertConsumerClosure([
    ...model.LIVE_CONSUMERS,
    model.LIVE_CONSUMERS[0],
    model.LIVE_CONSUMERS[0],
  ]));
  assert.equal(model.assertConsumerClosure.length, 1);
});
