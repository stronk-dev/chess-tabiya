import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/concept-registry.md", "utf8");
const readme = readFileSync("rfc/README.md", "utf8");
const authorContract = readFileSync("tools/concept-registry-author-contract/contract.test.mjs", "utf8");
const makefile = readFileSync("Makefile", "utf8");
const workflow = readFileSync(".github/workflows/verify.yml", "utf8");
const portable = readFileSync("rfc/archive/portable-account-data.md", "utf8");
const lifecycle = readFileSync("docs/account-data-lifecycle.md", "utf8");
const storage = readFileSync("apps/server/src/storage.ts", "utf8");

test("D2661 the advertised author contract is red on the live migration order", () => {
  assert.match(authorContract, /position behind longitudinal-store/u);
  assert.match(rfc, /position behind pack-capability-contract/u);
  assert.match(readme, /position behind pack-capability-contract[^\n]*`concept-registry\.md`/u);
  assert.doesNotMatch(readme, /concept-registry-author-contract` passes 7\/7/u);
});

test("D2662 mutable labels change the exact digest while no historical registry revision exists", () => {
  const digest = (label) => `sha256:${createHash("sha256").update(JSON.stringify({ schemaVersion: 1, entries: [{ id: "fork", label, status: "active" }]})).digest("hex")}`;
  assert.notEqual(digest("Fork"), digest("Fork attack"));
  assert.match(rfc, /registryVersion: 1/u);
  assert.match(rfc, /registryDigest/u);
  assert.match(rfc, /Renaming a label does not change identity/u);
  assert.doesNotMatch(rfc, /registryRevision|historical registry (?:artifact|bundle)|revision lookup/u);
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
  assert.match(rfc, /Campaign catalogue projection/u);
  assert.match(rfc, /Skills taxonomy\/credit join/u);
  assert.match(readme, /`campaign-catalogue-progression\.md` \| \*\*draft/u);
  assert.match(readme, /`skills\.md` \| \*\*draft/u);
  assert.match(rfc, /proves exactly one compiler and the eight declared consumer families/u);
});

test("D2665 criterion 12 names CI integration that neither maintained gate invokes", () => {
  const verifySoftware = /^verify-software:.*$/mu.exec(makefile)?.[0] ?? "";
  assert.doesNotMatch(verifySoftware, /concept-registry-author-contract/u);
  assert.doesNotMatch(workflow, /concept-registry-author-contract/u);
  assert.match(rfc, /focused author\/implementation contract runs in local and GitHub software\s+gates/u);
});

test("D2666 restore is required through a dependency that explicitly excludes account import", () => {
  assert.match(rfc, /portable account data/u);
  assert.match(rfc, /Export\/delete\/restore round trips exact refs/u);
  assert.match(portable, /importing an account bundle into this or another installation/u);
  assert.match(portable, /No account-import route, parser or UI is added/u);
  assert.match(lifecycle, /There is no account-import endpoint/u);
});
