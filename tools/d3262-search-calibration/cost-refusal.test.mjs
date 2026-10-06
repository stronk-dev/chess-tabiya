import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";
import { sha } from "./cost-contract.mjs";
import { verifyRefusedCostValue, verifyProjectedCostEnvelope } from "./cost-refusal.mjs";
import { verifyPackedCostValue } from "./cost-pack.mjs";

const original = () => JSON.parse(gunzipSync(readFileSync("planning/semantic-consequence-search/d3262-cost-live-pv-initial-2026-10-06.json.gz")));
const message = "D3262_COST_CONTRACT: warm provider result without warm dependencies";
function fixture() {
  const pack = original();
  pack.authority = "lossless_refused_cost_capture_not_admitted_measurement";
  delete pack.summary;
  pack.refusal = message;
  const records = JSON.parse(gunzipSync(Buffer.from(pack.groups[0].base64, "base64")));
  const warm = records[1], source = warm.raw.dependencies[0], query = warm.row.providerQueries[0];
  source.state = query.state = "executed";
  source.receipt.started = warm.raw.clock.started;
  source.receipt.ended = warm.raw.clock.ended;
  query.receiptDigest = sha(JSON.stringify(source.receipt));
  warm.row.initialCacheEntries = warm.row.cacheHits = 0;
  const raw = JSON.stringify(warm.raw);
  warm.row.rawCaptureDigest = sha(raw); warm.row.retainedBytes = Buffer.byteLength(raw);
  const bytes = gzipSync(JSON.stringify(records));
  pack.groups[0].base64 = bytes.toString("base64"); pack.groups[0].digest = sha(bytes);
  return pack;
}
test("refused envelope preserves every declared case and exact contractual refusal", () => {
  assert.equal(verifyRefusedCostValue(fixture()).length, 6);
});
test("a refused capture cannot enter the normal admitted-cost reader", () => {
  assert.throws(() => verifyPackedCostValue(fixture()), /Foreign capture package/);
});
test("a valid capture cannot be labelled refused", () => {
  const pack = original();
  pack.authority = "lossless_refused_cost_capture_not_admitted_measurement"; pack.refusal = message;
  assert.throws(() => verifyRefusedCostValue(pack), /valid capture cannot be called refused/);
});
for (const mode of ["missing_case", "wrong_refusal", "source_snapshot", "literal_triplet", "metadata_range"])
  test(`refused capture reader rejects ${mode}`, () => {
    const pack = fixture();
    if (mode === "missing_case") pack.groups.pop();
    if (mode === "wrong_refusal") pack.refusal = "made up";
    if (mode === "source_snapshot") pack.sourceSnapshot["cost-stockfish.mjs"] = Buffer.from("changed").toString("base64");
    if (mode === "literal_triplet") pack.groups[0].digest = sha("changed");
    if (mode === "metadata_range") pack.metadata.limit = 3;
    assert.throws(() => verifyRefusedCostValue(pack), /D3262_COST_REFUSAL/);
  });
test("projection refuses a traversal parent before accessing any file", () => {
  assert.throws(() => verifyProjectedCostEnvelope({ metadata: { projection: { parentArchive: "../escape.json.gz" } } }), /foreign projection parent/);
});
