import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const rfc = read("rfc/pack-capability-contract.md");
const transition = JSON.parse(read("rfc/contracts/pack-capability-schema-transition-v1.json"));
const applicability = JSON.parse(read("rfc/contracts/pack-capability-applicability-v1.json"));

function legacyPopulation() {
  const rows = [];
  for (const name of readdirSync("content/drafts")) {
    if (!name.endsWith(".json") || name.endsWith(".sources.json") || name.endsWith(".evidence.json") || name.endsWith(".job.json")) continue;
    const path = `content/drafts/${name}`;
    rows.push({ path, sha256: sha256(readFileSync(path)) });
  }
  for (const directory of readdirSync("content/candidates")) {
    const path = `content/candidates/${directory}/pack.json`;
    if (existsSync(path)) rows.push({ path, sha256: sha256(readFileSync(path)) });
  }
  return rows.sort((left, right) => left.path.localeCompare(right.path));
}

test("D2334: the legacy authority is the exact independently recomputed 92-row image", () => {
  const rows = legacyPopulation();
  assert.equal(rows.length, 92);
  assert.deepEqual(transition.legacy.documents, rows);
  assert.equal(transition.legacy.catalogueDocuments, rows.length);
  assert.equal(transition.legacy.populationSha256, sha256(JSON.stringify(rows)));
  assert.match(rfc, /Editing,[\s\S]*?deleting,[\s\S]*?renaming[\s\S]*?93rd pack fails/);
});

test("D2335: software and corpus admission are sequential non-impersonating gates", () => {
  assert.match(rfc, /make pack-capability-software-check/);
  assert.match(rfc, /does \*\*not\*\* claim the current corpus has authored `requires` arrays/);
  assert.match(rfc, /make pack-capability-corpus-check/);
  assert.match(rfc, /sequential gates, never two simultaneous assertions/);
  assert.match(rfc, /Before D560,[\s\S]*?read-only projected `requires`[\s\S]*?After the authorized apply/);
});

test("D2336: every unconditional row is a structured versioned selector authority", () => {
  assert.equal(applicability.always.length, 14);
  for (const row of applicability.always) {
    assert.deepEqual(row.selector, { kind: "always" });
    assert.equal(typeof row.capability.id, "string");
    assert.deepEqual(row.capability.version, { kind: "integer", value: 1 });
  }
  assert.match(rfc, /generator refuses a bare string, a missing selector,[\s\S]*?stale version/);
});

test("D2337: declaration and history use one compiled structured identity", () => {
  const declaration = rfc.slice(rfc.indexOf("export interface CapabilityDeclaration"), rfc.indexOf("`CapabilityMeaningSource` is closed"));
  assert.match(declaration, /readonly subjectId: string/);
  assert.match(declaration, /readonly id: CapabilityId/);
  assert.doesNotMatch(declaration, /readonly version: CapabilityVersion/);
  assert.match(rfc, /there is no parallel top-level `version`\s+field/);
  assert.match(rfc, /`id\.id` must equal `subjectId`/);
});

test("D2338: packCapabilities has one closed server/web wire with safe fields", () => {
  assert.match(rfc, /interface PackCapabilityPublicRowV1/);
  assert.match(rfc, /semanticDisposition: PublicCapabilitySemanticDispositionV1/);
  assert.match(rfc, /reachability: PublicCapabilityReachabilityV1/);
  assert.match(rfc, /apps\/server\/src\/capabilities\.ts/);
  assert.match(rfc, /apps\/web\/src\/lib\/api\.ts/);
  assert.match(rfc, /rejects unknown\/missing fields,[\s\S]*?duplicates,[\s\S]*?non-canonical order/);
});

test("D2339: operation requirements are internally derived and exhaustive before write", () => {
  assert.match(rfc, /interface OperationCapabilityBinding/);
  assert.match(rfc, /CAPABILITY_OPERATION_BINDINGS/);
  assert.match(rfc, /Routes supply only `\{operationId, runId\/idempotencyKey when applicable\}`/);
  assert.doesNotMatch(rfc, /requireCapabilities\(operationId, requiredIds\)/);
  assert.match(rfc, /Adding a mutating route fails the census/);
  assert.match(rfc, /Before a first-flight provider operation[\s\S]*?mutates run state/);
  assert.match(rfc, /Idempotent replay first returns the stored terminal operation receipt/);
});
