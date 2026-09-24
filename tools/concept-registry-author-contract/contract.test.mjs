import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

// The draft contract this target retains was reviewed against the pre-landing tree. Its inputs are
// pinned to that exact commit (the D2898/D2922 rule): the 2026-09-24 implementation discharged the
// claims and rewrote the status, which must not erase the evidence of what the draft said.
const REVIEWED = "d5f11d706895603911bdca0c6d51eb8543a8bc55";
const reviewed = (file) => execFileSync("git", ["show", `${REVIEWED}:${file}`], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const rfc = reviewed("rfc/concept-registry.md");
const backlog = reviewed("design/BACKLOG.md");
const readme = reviewed("rfc/README.md");

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
