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
const REVIEW_TRANSITIONS = process.argv.includes("--review-transitions");
const BRANCH_DECIDEDNESS = process.argv.includes("--branch-decidedness");
const QUEUED_TABLEBASE = process.argv.includes("--queued-tablebase");
const HEALTH_TABLEBASE = process.argv.includes("--health-tablebase");
const REPERTOIRE_FRONTIER = process.argv.includes("--repertoire-frontier");
const RETURN_FREQUENCY = process.argv.includes("--return-frequency");
const INSPECTOR_POPULATION = process.argv.includes("--inspector-population");
const OPPONENT_CANCELLATION = process.argv.includes("--opponent-cancellation");
const REVIEW_SUCCESSORS = ["derived.review.eval_delta", "derived.review.mate_transition", "derived.story.rank", "derived.story.title"];
const BASELINE = OPPONENT_CANCELLATION ? "2e02329a" : INSPECTOR_POPULATION ? "c7b03e02" : RETURN_FREQUENCY ? "58fd826c" : REPERTOIRE_FRONTIER ? "dd5b5194" : HEALTH_TABLEBASE ? "53e449e7" : QUEUED_TABLEBASE ? "ca2770f5" : BRANCH_DECIDEDNESS ? "e20c4898" : REVIEW_TRANSITIONS ? "f55c1fe3" : BINDING_ABSENCE ? "efe67940" : "c0114e28";
const SUCCESSORS = HEALTH_TABLEBASE || OPPONENT_CANCELLATION ? ["opponent.practical_slice", "opponent.selection"] : [
  "engineCondition.engine_eval_swing", "engineCondition.engine_mate_appears",
  "engineCondition.tablebase_category_regression", "engineCondition.tablebase_dtz_regression",
  "fenPredicate.structuralFeature", "opponent.practical_slice", "opponent.selection",
  ...(BINDING_ABSENCE ? ["selection.semantic_policy"] : []),
  ...(REVIEW_TRANSITIONS ? REVIEW_SUCCESSORS : []),
  ...(REPERTOIRE_FRONTIER ? ["derived.explorer.repertoire_frontier"] : []),
  ...(RETURN_FREQUENCY ? ["derived.explorer.position_frequency"] : []),
  ...(INSPECTOR_POPULATION ? ["derived.explorer.inspector_population"] : []),
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
    const precedingVersions = previous.filter(oldRow => oldRow.subjectId === row.subjectId).map(oldRow => Number(oldRow.id.version.value));
    assert.equal(row.id.version.value, OPPONENT_CANCELLATION ? 16 : REPERTOIRE_FRONTIER || RETURN_FREQUENCY || INSPECTOR_POPULATION ? precedingVersions.length === 0 ? 1 : Math.max(...precedingVersions) + 1 : HEALTH_TABLEBASE ? 12 : QUEUED_TABLEBASE ? 11 : BRANCH_DECIDEDNESS ? 10 : REVIEW_TRANSITIONS ? REVIEW_SUCCESSORS.includes(row.subjectId) ? 2 : 9 : BINDING_ABSENCE ? row.subjectId === "selection.semantic_policy" ? 3 : 8 : 7);
  }
  const oldProfiles = JSON.parse(old("packages/runtime/src/fixtures/evidence-value-profiles.json"));
  const profiles = JSON.parse(read("packages/runtime/src/fixtures/evidence-value-profiles.json"));
  const successors = REVIEW_TRANSITIONS ? new Map(REVIEW_SUCCESSORS.map(id => [`${id}@1`, `${id}@2`])) : new Map<string, string>();
  for (const [key, value] of Object.entries(oldProfiles)) {
    const successor = successors.get(key);
    if (successor === undefined) assert.equal(canonicalJson(profiles[key]), canonicalJson(value), `Factory outcome changed: ${key}`);
    else {
      assert.equal(Object.hasOwn(profiles, key), false, `Superseded factory is still current: ${key}`);
      const { payloadDigests: _oldDigest, ...oldOutcome } = value as Record<string, unknown>;
      const { payloadDigests: _newDigest, ...newOutcome } = profiles[successor];
      assert.equal(canonicalJson(newOutcome), canonicalJson(oldOutcome), `Successor changed availability/cardinality: ${key}`);
      if (key.startsWith("derived.story.")) assert.equal(canonicalJson(profiles[successor]), canonicalJson(value), `Story output changed: ${key}`);
    }
  }
  const newProfiles = [...successors.values(), ...(REPERTOIRE_FRONTIER ? ["derived.explorer.repertoire_frontier@1"] : []), ...(RETURN_FREQUENCY ? ["derived.explorer.position_frequency@1"] : []), ...(INSPECTOR_POPULATION ? ["derived.explorer.inspector_population@1"] : [])].sort();
  assert.deepEqual(Object.keys(profiles).filter(key => !Object.hasOwn(oldProfiles, key)).sort(), newProfiles);
  const previousReceipt = JSON.parse(old("packages/runtime/src/semantic-validation-receipt.generated.json"));
  const currentReceipt = JSON.parse(read("packages/runtime/src/semantic-validation-receipt.generated.json"));
  for (const key of Object.keys(previousReceipt).filter(key => key !== "operations" && key !== "populations")) assert.equal(canonicalJson(currentReceipt[key]), canonicalJson(previousReceipt[key]), `Semantic validation outcome changed: ${key}`);
  const withoutDigest = (rows: readonly Record<string, unknown>[], field: string) => rows.map(({ [field]: _digest, ...retained }) => retained);
  const currentOperations = withoutDigest(currentReceipt.operations, "implementationDigest");
  if (REPERTOIRE_FRONTIER) {
    // The shared runtime closure gains exactly the new type module, not new observations,
    // operation identities, reach rules or an arbitrary replacement file population.
    for (const operation of currentOperations) {
      const prior = previousReceipt.operations.find((row: { id: string }) => row.id === operation.id);
      assert.ok(prior, `New validation operation: ${operation.id}`);
      const files = operation.files as string[];
      assert.deepEqual(files.filter(path => path !== "packages/runtime/src/explorer-frontier.ts"), prior.files, `Unexpected closure files: ${operation.id}`);
      operation.files = files.filter(path => path !== "packages/runtime/src/explorer-frontier.ts");
    }
  }
  assert.equal(canonicalJson(currentOperations), canonicalJson(withoutDigest(previousReceipt.operations, "implementationDigest")), "Validation operations changed beyond implementation digests and the named frontier type");
  assert.equal(canonicalJson(withoutDigest(currentReceipt.populations, "predicateImplementationDigest")), canonicalJson(withoutDigest(previousReceipt.populations, "predicateImplementationDigest")), "Validation population observations changed");
  // Cancellation changes selector orchestration, not guard/objective computations or factories.
  for (const path of ["apps/server/src/guard.ts", "apps/server/src/guard-conditions.ts", "packages/runtime/src/objective.ts", ...(HEALTH_TABLEBASE || OPPONENT_CANCELLATION ? [] : ["apps/server/src/opponent-selector.ts"])]) assert.equal(read(path), old(path), `Evaluator changed: ${path}`);
  if (HEALTH_TABLEBASE) {
    const path = "apps/server/src/opponent-selector.ts", current = read(path);
    const startMarker = "\n    try {\n      const evidence = await source.probeEvidence";
    const catchMarker = '\n    } catch (error) {\n      if (error instanceof TypeError) throw new ServerError("TABLEBASE_UNAVAILABLE", "Tablebase source evidence failed admission", { details: { retryAfterMs: 0 } });\n      throw error;\n    }';
    assert.equal(current.split(startMarker).length, 2, "Expected one admission wrapper");
    assert.equal(current.split(catchMarker).length, 2, "Expected the exact typed-unavailable catch");
    const start = current.indexOf(startMarker), bodyStart = start + "\n    try {".length, end = current.indexOf(catchMarker, bodyStart);
    assert.ok(end > bodyStart);
    const withoutCatch = current.slice(0, start) + current.slice(bodyStart, end).replace(/^  /gmu, "") + current.slice(end + catchMarker.length);
    assert.equal(withoutCatch, old(path), "Selection source changed beyond the exact error wrapper");
  }
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
    retainedFactoryOutcomes: Object.keys(oldProfiles).length - successors.size, newFactoryProfiles: newProfiles,
    retainedSourceExecution: { projection: "live.syzygy.position_result@1", state: "registered", operation: "syzygy.position@1" },
    scope: OPPONENT_CANCELLATION ? "Caller cancellation and asynchronous Inspector access checks; historical declarations, factory outcomes, authored content and guard/objective computations unchanged. Selector cancellation behavior is verified by the separate permanent tests, not this metadata instrument" : INSPECTOR_POPULATION ? "Inspector whole-source admission and narrow registered presentation; authored content, existing factory outcomes, guard/objective computations and opponent selection unchanged" : RETURN_FREQUENCY ? "return-frequency whole-source admission; authored content, existing factory outcomes, guard/objective computations and opponent selection unchanged" : REPERTOIRE_FRONTIER ? "repertoire whole-source frontier admission; authored content, existing factory outcomes, guard/objective computations and opponent selection unchanged" : HEALTH_TABLEBASE ? "health-wrapped source authority and typed admission failure; authored content, guard/objective computations and successful selection code unchanged" : QUEUED_TABLEBASE ? "queued tablebase whole-source admission before the existing durable packet; authored content, guard computations and opponent selection unchanged" : BRANCH_DECIDEDNESS ? "comparison decidedness whole-source admission and explicit absence policy; authored content, guard computations and opponent selection unchanged" : REVIEW_TRANSITIONS ? "Review two-endpoint declaration and exact consumer successor migration; chess computations and authored content unchanged" : BINDING_ABSENCE ? "binding source-absence compiler metadata; current consumer policies, acquisition and authored content unchanged" : "explicit retained whole-source execution; current acquisition and authored content unchanged",
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
