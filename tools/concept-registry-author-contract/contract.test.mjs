import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/concept-registry.md", "utf8");
const backlog = readFileSync("design/BACKLOG.md", "utf8");
const readme = readFileSync("rfc/README.md", "utf8");

const has = (...values) => values.forEach((value) => assert.ok(rfc.includes(value), `missing ${value}`));

test("identity is shared and narrower than skill or campaign meaning", () => {
  has("Identity is the shared primitive", "does not create Skills or Campaign progression", "A concept sighting is not a skill credit");
});

test("schema first claim remains gated on the absent-root process", () => {
  has("concept-registry-schema | first lane 1", "not a live claim yet", "absent root exists before this RFC declares");
  assert.match(backlog, /D2370/);
});

test("one compiler owns six landing consumers plus two successor discharges", () => {
  has("compileConceptRegistry(headBytes, revisionFiles)", "checked landing-consumer set is exactly six", "Two successor discharges", "no second ID/label map");
});

test("pack references have an exact identity-only evidence projection", () => {
  has("pack.authored.concept_reference@1", "identity only", "never that the concept occurs on a board");
});

test("legacy migration is total, atomic and cross-pack", () => {
  has("position behind evidence-job-durability", "parses only the exact legacy", "same_concept_in_pack");
});

test("lifecycle and account behavior preserve historical identity", () => {
  has("never deleted, re-used or", "export writes typed concept refs", "future portable-account-import RFC");
});

test("active register and roadmap own the draft", () => {
  assert.match(readme, /`concept-registry\.md`/);
  assert.match(readme, /position behind evidence-job-durability[^\n]*`concept-registry\.md`/);
});
