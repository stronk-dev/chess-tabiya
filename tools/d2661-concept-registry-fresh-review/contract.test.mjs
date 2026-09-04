import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import { REVIEWED_CONTRACT } from "./reviewed-contract.mjs";

const portable = readFileSync("rfc/archive/portable-account-data.md", "utf8");
const lifecycle = readFileSync("docs/account-data-lifecycle.md", "utf8");
const storage = readFileSync("apps/server/src/storage.ts", "utf8");

test("D2661 the advertised author contract is red on the live migration order", () => {
  assert.notEqual(REVIEWED_CONTRACT.authorMigrationPosition, REVIEWED_CONTRACT.liveMigrationPosition);
  assert.equal(REVIEWED_CONTRACT.readmeAdvertisedAuthorResult, "passes 7/7");
});

test("D2662 mutable labels change the exact digest while no historical registry revision exists", () => {
  const digest = (label) => `sha256:${createHash("sha256").update(JSON.stringify({ schemaVersion: 1, entries: [{ id: "fork", label, status: "active" }]})).digest("hex")}`;
  assert.notEqual(digest("Fork"), digest("Fork attack"));
  assert.equal(REVIEWED_CONTRACT.registrySchemaVersion, 1);
  assert.equal(REVIEWED_CONTRACT.conceptRefCarriesDigest, true);
  assert.equal(REVIEWED_CONTRACT.labelRenameAllowedWithoutRevisionHistory, true);
});

test("D2663 the legacy migration operands cannot prove historical pack occurrence", () => {
  const migrateAsSpecified = (row, registryIds) => {
    const match = /^pack:([^#]+)#(.+)$/u.exec(row.conceptKey);
    if (match === null || match[1] !== row.packId || !registryIds.has(match[2])) return null;
    return `concept:${match[2]}@1`;
  };
  const registry = new Set(["fork", "pin"]);
  const authentic = { packId: "pack-a", conceptKey: "pack:pack-a#fork" };
  const forged = { packId: "pack-a", conceptKey: "pack:pack-a#pin" };
  assert.equal(migrateAsSpecified(authentic, registry), "concept:fork@1");
  assert.equal(migrateAsSpecified(forged, registry), "concept:pin@1");
  const table = storage.slice(storage.indexOf("CREATE TABLE IF NOT EXISTS attempt_concepts"), storage.indexOf("CREATE TABLE IF NOT EXISTS schedules"));
  assert.doesNotMatch(table, /pack_digest|pack_version|concept_snapshot/u);
});

test("D2664 eight-consumer closure conflates this foundation with unimplemented successors", () => {
  assert.equal(REVIEWED_CONTRACT.consumerCount, 8);
  assert.equal(REVIEWED_CONTRACT.campaignStatus, "draft");
  assert.equal(REVIEWED_CONTRACT.skillsStatus, "draft");
});

test("D2665 criterion 12 names CI integration that neither maintained gate invokes", () => {
  assert.equal(REVIEWED_CONTRACT.authorTargetInVerifySoftware, false);
  assert.equal(REVIEWED_CONTRACT.authorTargetInWorkflow, false);
});

test("D2666 restore is required through a dependency that explicitly excludes account import", () => {
  assert.equal(REVIEWED_CONTRACT.requiresAccountRestore, true);
  assert.match(portable, /importing an account bundle into this or another installation/u);
  assert.match(portable, /No account-import route, parser or UI is added/u);
  assert.match(lifecycle, /There is no account-import endpoint/u);
});
