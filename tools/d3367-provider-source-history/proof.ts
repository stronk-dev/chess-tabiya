// Checkpoint instrument for D3367: read-only by default, optional canonical metadata-only rewrite.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { canonicalJson, capabilityKey } from "../../packages/schema/src/index.js";
import { canonicalizeJson } from "../../packages/schema/src/drill-pack/index.js";
import { GENERATED_CAPABILITY_DECLARATIONS } from "../../packages/runtime/src/capability/declarations.generated.js";
import { PRIMARY_EVIDENCE_MANIFEST, compileProjectionExecution } from "../../packages/runtime/src/index.js";
import { withDerivedRequires } from "../../apps/server/src/capability/pack-capabilities.js";
import { walkPopulation } from "../../apps/server/src/capability/migration.js";
import { ShapeRegistry } from "../../apps/server/src/shape-registry.js";
import { PrincipleRegistry } from "../../apps/server/src/principle-registry.js";
import { assertAuthoredContentUnchanged, assertLedgerMetadataUnchanged } from "../explorer-summary-migration-proof/proof.js";

// Reuse the same preservation checks for D3369; each mode names its committed predecessor.
const BINDING_ABSENCE = process.argv.includes("--binding-absence");
const BASELINE = BINDING_ABSENCE ? "efe67940" : "c0114e28";
const SUCCESSORS = [
  "engineCondition.engine_eval_swing", "engineCondition.engine_mate_appears",
  "engineCondition.tablebase_category_regression", "engineCondition.tablebase_dtz_regression",
  "fenPredicate.structuralFeature", "opponent.practical_slice", "opponent.selection",
  ...(BINDING_ABSENCE ? ["selection.semantic_policy"] : []),
].sort();
const read = (path: string) => readFileSync(resolve(path), "utf8");
const old = (path: string) => execFileSync("git", ["show", `${BASELINE}:${path}`], { encoding: "utf8", maxBuffer: 16_000_000 });
const rows = (text: string) => JSON.parse(text.slice(text.indexOf("String.raw`[") + "String.raw`".length, text.lastIndexOf("]`)") + 1)) as typeof GENERATED_CAPABILITY_DECLARATIONS;
const digest = (document: unknown) => `sha256:${createHash("sha256").update(canonicalizeJson(document as never)).digest("hex")}`;

async function proof(editsOnly: boolean) {
  const root = process.cwd();
  // Explicit historical registration preserves identity; default acquisition stays v2.
  assert.equal(compileProjectionExecution(PRIMARY_EVIDENCE_MANIFEST, { id: "live.syzygy.position_result", version: 1 }).own.providerOperation, "syzygy.position@1");
  assert.throws(() => compileProjectionExecution(PRIMARY_EVIDENCE_MANIFEST, { id: "live.stockfish.eval", version: 1 }), /EXECUTION_SOURCE_UNREGISTERED/u);
  assert.equal(compileProjectionExecution(PRIMARY_EVIDENCE_MANIFEST, { id: "live.syzygy.position_result", version: 2 }).own.providerOperation, "syzygy.position@1");
  const previous = rows(old("packages/runtime/src/capability/declarations.generated.ts"));
  const current = new Map(GENERATED_CAPABILITY_DECLARATIONS.map(row => [capabilityKey(row.id), row]));
  for (const row of previous) assert.equal(canonicalJson(current.get(capabilityKey(row.id))), canonicalJson(row), `Historical declaration changed: ${capabilityKey(row.id)}`);
  const oldKeys = new Set(previous.map(row => capabilityKey(row.id)));
  const appended = GENERATED_CAPABILITY_DECLARATIONS.filter(row => !oldKeys.has(capabilityKey(row.id)));
  assert.deepEqual(appended.map(row => row.subjectId).sort(), SUCCESSORS);
  for (const row of appended) {
    assert.equal(row.id.version.kind, "integer");
    assert.equal(row.id.version.value, BINDING_ABSENCE ? row.subjectId === "selection.semantic_policy" ? 3 : 8 : 7);
  }
  const oldProfiles = JSON.parse(old("packages/runtime/src/fixtures/evidence-value-profiles.json"));
  const profiles = JSON.parse(read("packages/runtime/src/fixtures/evidence-value-profiles.json"));
  for (const [key, value] of Object.entries(oldProfiles)) assert.equal(canonicalJson(profiles[key]), canonicalJson(value), `Factory outcome changed: ${key}`);
  assert.deepEqual(Object.keys(profiles).filter(key => !Object.hasOwn(oldProfiles, key)), []);
  const previousReceipt = JSON.parse(old("packages/runtime/src/semantic-validation-receipt.generated.json"));
  const currentReceipt = JSON.parse(read("packages/runtime/src/semantic-validation-receipt.generated.json"));
  for (const key of Object.keys(previousReceipt).filter(key => key !== "operations" && key !== "populations")) assert.equal(canonicalJson(currentReceipt[key]), canonicalJson(previousReceipt[key]), `Semantic validation outcome changed: ${key}`);
  const withoutDigest = (rows: readonly Record<string, unknown>[], field: string) => rows.map(({ [field]: _digest, ...retained }) => retained);
  assert.equal(canonicalJson(withoutDigest(currentReceipt.operations, "implementationDigest")), canonicalJson(withoutDigest(previousReceipt.operations, "implementationDigest")), "Validation operations changed beyond implementation digests");
  assert.equal(canonicalJson(withoutDigest(currentReceipt.populations, "predicateImplementationDigest")), canonicalJson(withoutDigest(previousReceipt.populations, "predicateImplementationDigest")), "Validation population observations changed");
  // These evaluators and the opponent selector are unchanged at this checkpoint.
  for (const path of ["apps/server/src/guard.ts", "apps/server/src/guard-conditions.ts", "packages/runtime/src/objective.ts", "apps/server/src/opponent-selector.ts"]) assert.equal(read(path), old(path), `Evaluator changed: ${path}`);
  const shapes = await ShapeRegistry.loadDefault(resolve(root, "content/shapes"));
  const principles = await PrincipleRegistry.loadDefault(resolve(root, "content/principles"));
  const population = walkPopulation(root);
  const paths = [...population.roots.draftPacks, ...population.roots.candidatePacks, "schemas/drill_pack.example.json",
    ...readdirSync(resolve(root, "schemas/fixtures/drill-pack")).filter(path => path.endsWith(".json")).map(path => `schemas/fixtures/drill-pack/${path}`)];
  const edits: { path: string; before: string; after: string }[] = [];
  const ledgerDigests = new Map<string, string>();
  let changedPacks = 0;
  for (const path of paths) {
    const before = read(path);
    const document = JSON.parse(before);
    const stamped = withDerivedRequires(document, { shapes, principles });
    assertAuthoredContentUnchanged(path, JSON.parse(old(path)), document);
    assertAuthoredContentUnchanged(path, document, stamped);
    if (digest(stamped) !== digest(JSON.parse(old(path)))) changedPacks++;
    if (!editsOnly) assert.equal(canonicalJson(document.requires), canonicalJson(stamped.requires), `Noncanonical requirements: ${path}`);
    if (canonicalJson(document.requires) !== canonicalJson(stamped.requires)) {
      const start = before.lastIndexOf(',\n  "requires": [\n');
      assert.ok(start >= 0 && before.endsWith("\n  ]\n}\n"), `Unexpected stamp layout: ${path}`);
      const compact = before.slice(start).includes('    { "id":');
      const rendered = compact ? stamped.requires.map(row => `    ${JSON.stringify(row).replaceAll(":", ": ").replaceAll(",", ", ").replaceAll("{", "{ ").replaceAll("}", " }")}`).join(",\n")
        : JSON.stringify(stamped.requires, null, 2).split("\n").slice(1, -1).map(line => `  ${line}`).join("\n");
      const after = `${before.slice(0, start)},\n  "requires": [\n${rendered}\n  ]\n}\n`;
      assert.equal(canonicalJson(JSON.parse(after)), canonicalJson(stamped));
      edits.push({ path, before, after });
    }
    const ledger = path.endsWith("/pack.json") ? path.replace(/pack\.json$/u, "evidence.json") : path.replace(/\.json$/u, ".evidence.json");
    if (existsSync(resolve(root, ledger))) {
      const expected = digest(stamped);
      ledgerDigests.set(ledger, expected);
      const before = read(ledger);
      const after = before.replace(/("packDigest"\s*:\s*")[^"]*(")/u, `$1${expected}$2`);
      assertLedgerMetadataUnchanged(ledger, JSON.parse(old(ledger)), JSON.parse(after), expected);
      if (!editsOnly) assertLedgerMetadataUnchanged(ledger, JSON.parse(old(ledger)), JSON.parse(before), expected);
      if (before !== after) edits.push({ path: ledger, before, after });
    }
  }
  const unchangedSources = [...population.roots.draftSidecars, ...population.roots.candidateSourcing, ...population.roots.shapes, ...population.roots.principles].filter(path => !ledgerDigests.has(path));
  for (const path of unchangedSources) assert.equal(read(path), old(path), `Source content changed: ${path}`);
  const changedLedgers = [...ledgerDigests].filter(([path, expected]) => JSON.parse(old(path)).packDigest !== expected).length;
  return editsOnly ? edits : {
    baseline: BASELINE, retainedDeclarations: previous.length, candidateDeclarations: current.size,
    successors: appended.map(row => ({ subject: row.subjectId, version: row.id.version.value })),
    unchangedAuthoredDocuments: paths.length, requirementStampChanges: changedPacks,
    ledgerDigestChanges: changedLedgers, unchangedOtherSourceDocuments: unchangedSources.length,
    retainedFactoryOutcomes: Object.keys(oldProfiles).length, newFactoryProfiles: [],
    retainedSourceExecution: { projection: "live.syzygy.position_result@1", state: "registered", operation: "syzygy.position@1" },
    scope: BINDING_ABSENCE ? "binding source-absence compiler metadata; current consumer policies, acquisition and authored content unchanged" : "explicit retained whole-source execution; current acquisition and authored content unchanged",
  };
}

if (process.argv.includes("--apply-metadata")) {
  const edits = await proof(true) as { path: string; before: string; after: string }[];
  // Bulk mechanical rewrite after the complete invariant pass; never an authored-field migration.
  for (const edit of edits) assert.equal(read(edit.path), edit.before, `Concurrent edit: ${edit.path}`);
  for (const edit of edits) writeFileSync(resolve(edit.path), edit.after);
  console.log(`Canonical metadata-only updates: ${edits.length}`);
  console.log(JSON.stringify(await proof(false), null, 2));
} else console.log(JSON.stringify(await proof(process.argv.includes("--edits")), null, 2));
