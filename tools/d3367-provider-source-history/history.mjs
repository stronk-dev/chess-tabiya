// D3817: fixed landing facts and present-day preservation are different comparisons.
// Read Git objects only; never extract a checkout, write content or hydrate research captures.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { assertCapabilityHistory, declarationRows } from "../capability-history.mjs";

export const SOURCE_HISTORY_BASE = "c0114e28";
export const SOURCE_HISTORY_LANDING = "039b7a44";
export const SOURCE_HISTORY_SUCCESSORS = Object.freeze([
  "engineCondition.engine_eval_swing", "engineCondition.engine_mate_appears",
  "engineCondition.tablebase_category_regression", "engineCondition.tablebase_dtz_regression",
  "fenPredicate.structuralFeature", "opponent.practical_slice", "opponent.selection",
].sort());
const declarations = "packages/runtime/src/capability/declarations.generated.ts";
const canonical = value => JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const omit = (value, fields) => Object.fromEntries(Object.entries(value).filter(([key]) => !fields.includes(key)));
export const isPackPath = path => path === "schemas/drill_pack.example.json"
  || path.startsWith("schemas/fixtures/drill-pack/")
  || /^content\/candidates\/[^/]+\/pack\.json$/u.test(path)
  || /^content\/drafts\/[^/]+\.json$/u.test(path) && !/\.(sources|evidence|job|graduation|priority)\.json$/u.test(path);

export function assertLandingDeclarations(before, landed, current) {
  const retained = assertCapabilityHistory(before, landed);
  const oldKeys = new Set(declarationRows(before).map(row => canonical(row.id)));
  const added = declarationRows(landed).filter(row => !oldKeys.has(canonical(row.id)));
  assert.deepEqual(added.map(row => row.subjectId).sort(), SOURCE_HISTORY_SUCCESSORS, "Original landing successor image changed");
  for (const row of added) assert.deepEqual(row.id.version, { kind: "integer", value: 7 }, "Original successor version changed");
  const present = assertCapabilityHistory(landed, current);
  return { predecessorDeclarations: retained.retained, landedDeclarations: retained.total,
    currentDeclarations: present.total, originalSuccessors: added.length };
}

export function assertLandingProfiles(before, after) {
  assert.equal(canonical(after), canonical(before), "Original landing factory outcomes changed");
  return Object.keys(before).length;
}

export function assertLandingValidation(before, after) {
  assert.deepEqual(Object.keys(after).sort(), Object.keys(before).sort(), "Original validation receipt shape changed");
  for (const key of Object.keys(before)) {
    const strip = (rows, field) => rows.map(row => omit(row, [field]));
    const previous = key === "operations" ? strip(before[key], "implementationDigest")
      : key === "populations" ? strip(before[key], "predicateImplementationDigest") : before[key];
    const current = key === "operations" ? strip(after[key], "implementationDigest")
      : key === "populations" ? strip(after[key], "predicateImplementationDigest") : after[key];
    assert.equal(canonical(current), canonical(previous), `Original validation observations changed: ${key}`);
  }
}

export function assertLandingPack(path, before, after) {
  assert.equal(canonical(omit(after, ["requires"])), canonical(omit(before, ["requires"])), `Original authored pack changed: ${path}`);
  return `sha256:${createHash("sha256").update(canonical(after)).digest("hex")}`;
}

export function assertLandingLedger(path, before, after, expectedDigest) {
  assert.equal(canonical(omit(after, ["packDigest"])), canonical(omit(before, ["packDigest"])), `Original ledger evidence changed: ${path}`);
  assert.equal(after.packDigest, expectedDigest, `Original ledger pack digest mismatch: ${path}`);
}

export function checkSourceHistory(root, currentDeclarations) {
  const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 16_000_000 });
  const image = (revision, path) => git(["show", `${revision}:${path}`]);
  git(["merge-base", "--is-ancestor", SOURCE_HISTORY_BASE, SOURCE_HISTORY_LANDING]);
  git(["merge-base", "--is-ancestor", SOURCE_HISTORY_LANDING, "HEAD"]);
  const counts = assertLandingDeclarations(image(SOURCE_HISTORY_BASE, declarations), image(SOURCE_HISTORY_LANDING, declarations), currentDeclarations);
  const profiles = "packages/runtime/src/fixtures/evidence-value-profiles.json";
  const factories = assertLandingProfiles(JSON.parse(image(SOURCE_HISTORY_BASE, profiles)), JSON.parse(image(SOURCE_HISTORY_LANDING, profiles)));
  const validation = "packages/runtime/src/semantic-validation-receipt.generated.json";
  assertLandingValidation(JSON.parse(image(SOURCE_HISTORY_BASE, validation)), JSON.parse(image(SOURCE_HISTORY_LANDING, validation)));
  for (const path of ["apps/server/src/guard.ts", "apps/server/src/guard-conditions.ts", "packages/runtime/src/objective.ts", "apps/server/src/opponent-selector.ts"])
    assert.equal(image(SOURCE_HISTORY_LANDING, path), image(SOURCE_HISTORY_BASE, path), `Original evaluator changed: ${path}`);

  const pathsAt = revision => git(["ls-tree", "-r", "--name-only", revision, "--", "content/drafts", "content/candidates", "content/shapes", "content/principles", "schemas/fixtures/drill-pack", "schemas/drill_pack.example.json"])
    .trim().split("\n").filter(path => path.endsWith(".json") && !path.endsWith(".graduation.json")).sort();
  const paths = pathsAt(SOURCE_HISTORY_LANDING);
  assert.deepEqual(paths, pathsAt(SOURCE_HISTORY_BASE), "Original content population changed");
  const ledgers = new Map();
  let packs = 0, otherSources = 0;
  for (const path of paths) {
    const before = JSON.parse(image(SOURCE_HISTORY_BASE, path)), after = JSON.parse(image(SOURCE_HISTORY_LANDING, path));
    if (isPackPath(path)) {
      packs++;
      const digest = assertLandingPack(path, before, after);
      const ledger = path.endsWith("/pack.json") ? path.replace(/pack\.json$/u, "evidence.json") : path.replace(/\.json$/u, ".evidence.json");
      if (paths.includes(ledger)) ledgers.set(ledger, digest);
    }
  }
  for (const path of paths) {
    const beforeText = image(SOURCE_HISTORY_BASE, path), afterText = image(SOURCE_HISTORY_LANDING, path);
    const after = JSON.parse(afterText);
    if (isPackPath(path)) continue;
    const expected = ledgers.get(path);
    if (expected !== undefined) assertLandingLedger(path, JSON.parse(beforeText), after, expected);
    else { otherSources++; assert.equal(afterText, beforeText, `Original source content changed: ${path}`); }
  }
  assert(packs > 0 && ledgers.size > 0 && otherSources > 0, "Historical content proof cannot have an empty population");
  return { scope: "fixed committed landing snapshots; not a current runtime replay or release qualification",
    baseline: SOURCE_HISTORY_BASE, landing: SOURCE_HISTORY_LANDING, ...counts, unchangedFactoryProfiles: factories,
    authoredPacks: packs, associatedLedgers: ledgers.size, unchangedOtherSources: otherSources };
}
