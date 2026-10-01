/** Read-only D3330 / pack-capability §6 release evidence. This never authorizes or applies a migration. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { canonicalJson, capabilityKey } from "../../packages/schema/src/index.js";
import { canonicalizeJson } from "../../packages/schema/src/drill-pack/index.js";
import { GENERATED_CAPABILITY_DECLARATIONS } from "../../packages/runtime/src/capability/declarations.generated.js";
import type { CapabilitySiteRef, GeneratedCapabilityDeclaration } from "../../packages/runtime/src/capability/registry.js";
import { CapabilitySourceIndex } from "../../apps/server/src/capability/source-image.js";
import { withDerivedRequires } from "../../apps/server/src/capability/pack-capabilities.js";
import { walkPopulation } from "../../apps/server/src/capability/migration.js";
import { ShapeRegistry } from "../../apps/server/src/shape-registry.js";
import { PrincipleRegistry } from "../../apps/server/src/principle-registry.js";

// The last verified shared-acquisition checkpoint; not HEAD, so this proof cannot bless itself.
export const BASELINE = "76faf52c";
// The independently verified appliance checkpoint immediately preceding this integration.
// Registry retention still compares BASELINE; source comparison excludes already-landed repairs.
export const SOURCE_BASELINE = "80815d3e";
export const SUCCESSORS = Object.freeze([
  "engineCondition.engine_eval_swing", "engineCondition.engine_mate_appears",
  "engineCondition.tablebase_category_regression", "engineCondition.tablebase_dtz_regression",
  "fenPredicate.structuralFeature", "opponent.practical_slice", "opponent.selection",
]);
const read = (root: string, path: string) => readFileSync(resolve(root, path), "utf8");
const baseline = (root: string, path: string) => execFileSync("git", ["show", `${BASELINE}:${path}`], { cwd: root, encoding: "utf8", maxBuffer: 16_000_000 });
const sourceBaseline = (root: string, path: string) => execFileSync("git", ["show", `${SOURCE_BASELINE}:${path}`], { cwd: root, encoding: "utf8", maxBuffer: 16_000_000 });
const declarationRows = (text: string): readonly GeneratedCapabilityDeclaration[] => JSON.parse(text.slice(text.indexOf("String.raw`[") + "String.raw`".length, text.lastIndexOf("]`)") + 1));
const withoutRequires = (document: Record<string, unknown>) => Object.fromEntries(Object.entries(document).filter(([key]) => key !== "requires"));
const packDigest = (document: unknown) => `sha256:${createHash("sha256").update(canonicalizeJson(document as never)).digest("hex")}`;

export function assertRootImagesUnchanged(images: readonly { readonly site: string; readonly before: string; readonly after: string }[]): void {
  for (const image of images) assert.equal(image.after, image.before, `Evaluator root changed: ${image.site}`);
}

export function assertAuthoredContentUnchanged(path: string, before: Record<string, unknown>, after: Record<string, unknown>): void {
  assert.equal(canonicalJson(withoutRequires(after)), canonicalJson(withoutRequires(before)), `Authored content changed: ${path}`);
}

export function assertLedgerMetadataUnchanged(path: string, before: Record<string, unknown>, after: Record<string, unknown>, expectedDigest: string): void {
  const withoutDigest = (document: Record<string, unknown>) => Object.fromEntries(Object.entries(document).filter(([key]) => key !== "packDigest"));
  assert.equal(canonicalJson(withoutDigest(after)), canonicalJson(withoutDigest(before)), `Evidence ledger content changed: ${path}`);
  assert.equal(after.packDigest, expectedDigest, `Evidence ledger digest mismatch: ${path}`);
}

/** Read-only edits for the approved release. Application stays outside the proof instrument. */
export async function metadataEdits(root: string) {
  await migrationProof(root, false);
  const shapes = await ShapeRegistry.loadDefault(resolve(root, "content/shapes"));
  const principles = await PrincipleRegistry.loadDefault(resolve(root, "content/principles"));
  const population = walkPopulation(root);
  const paths = [...population.roots.draftPacks, ...population.roots.candidatePacks, "schemas/drill_pack.example.json",
    ...readdirSync(resolve(root, "schemas/fixtures/drill-pack")).filter((path) => path.endsWith(".json")).map((path) => `schemas/fixtures/drill-pack/${path}`)];
  const edits: { path: string; before: string; after: string }[] = [];
  for (const path of paths) {
    const before = read(root, path);
    const document = JSON.parse(before) as Record<string, unknown>;
    const stamped = withDerivedRequires(document, { shapes, principles });
    assertAuthoredContentUnchanged(path, document, stamped);
    if (canonicalJson(document.requires) === canonicalJson(stamped.requires)) continue;
    // Preserve authored formatting; requires is the trailing key installed by pack-stamp.
    const start = before.lastIndexOf(',\n  "requires": [\n');
    assert.ok(start >= 0 && before.endsWith("\n  ]\n}\n"), `Unexpected stamp layout: ${path}`);
    const compact = before.slice(start).includes('    { "id":');
    const rows = compact ? stamped.requires.map((row) => `    ${JSON.stringify(row).replaceAll(":", ": ").replaceAll(",", ", ").replaceAll("{", "{ ").replaceAll("}", " }")}`).join(",\n")
      : JSON.stringify(stamped.requires, null, 2).split("\n").slice(1, -1).map((line) => `  ${line}`).join("\n");
    const after = `${before.slice(0, start)},\n  "requires": [\n${rows}\n  ]\n}\n`;
    assert.equal(canonicalJson(JSON.parse(after)), canonicalJson(stamped));
    edits.push({ path, before, after });
    const ledger = path.endsWith("/pack.json") ? path.replace(/pack\.json$/u, "evidence.json") : path.replace(/\.json$/u, ".evidence.json");
    if (existsSync(resolve(root, ledger))) {
      const ledgerBefore = read(root, ledger);
      const ledgerAfter = ledgerBefore.replace(/("packDigest"\s*:\s*")[^"]*(")/u, `$1${packDigest(stamped)}$2`);
      assertLedgerMetadataUnchanged(ledger, JSON.parse(ledgerBefore), JSON.parse(ledgerAfter), packDigest(stamped));
      edits.push({ path: ledger, before: ledgerBefore, after: ledgerAfter });
    }
  }
  return edits;
}

export async function migrationProof(root: string, applied = true) {
  const previous = declarationRows(baseline(root, "packages/runtime/src/capability/declarations.generated.ts"));
  const current = new Map(GENERATED_CAPABILITY_DECLARATIONS.map((row) => [capabilityKey(row.id), row]));
  assert.equal(previous.length, 819);
  for (const row of previous) assert.equal(canonicalJson(current.get(capabilityKey(row.id))), canonicalJson(row), `Committed history changed: ${capabilityKey(row.id)}`);
  const previousKeys = new Set(previous.map((row) => capabilityKey(row.id)));
  const appended = GENERATED_CAPABILITY_DECLARATIONS.filter((row) => !previousKeys.has(capabilityKey(row.id)));
  assert.deepEqual(appended.map((row) => row.subjectId).sort(), [...SUCCESSORS, "derived.explorer.population_summary"].sort());

  const changedTs = execFileSync("git", ["diff", "--name-only", "--diff-filter=M", SOURCE_BASELINE, "--", "apps/server/src", "packages/runtime/src", "packages/schema/src"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter((path) => path.endsWith(".ts") && !path.endsWith(".test.ts") && !path.endsWith("declarations.generated.ts") && !path.endsWith("applicability.generated.ts"));
  const overrides = Object.fromEntries(changedTs.map((path) => [path, sourceBaseline(root, path)]));
  const beforeIndex = new CapabilitySourceIndex({ root, overrides });
  const afterIndex = new CapabilitySourceIndex({ root });
  const evaluatorRoots = new Map<string, CapabilitySiteRef>();
  for (const subject of SUCCESSORS) {
    const old = previous.find((row) => row.subjectId === subject && row.id.version.kind === "integer" && row.id.version.value === 1)!;
    const successor = GENERATED_CAPABILITY_DECLARATIONS.find((row) => row.subjectId === subject && row.id.version.kind === "integer" && row.id.version.value === 2)!;
    assert.equal(canonicalJson(successor.sources), canonicalJson(old.sources), `Source identities changed: ${subject}`);
    assert.equal(canonicalJson(successor.dependsOn), canonicalJson(old.dependsOn), `Dependencies changed: ${subject}`);
    assert.notEqual(successor.semanticsDigest, old.semanticsDigest);
    for (const source of old.sources) if (source.kind === "ast") evaluatorRoots.set(canonicalJson(source.site), source.site);
  }
  const images = [...evaluatorRoots.values()].map((site) => ({ site: canonicalJson(site), before: beforeIndex.siteImage(site), after: afterIndex.siteImage(site) }));
  assertRootImagesUnchanged(images);
  const changedClosureSites = new Set<string>();
  const newClosureSites = new Set<string>();
  for (const site of evaluatorRoots.values()) {
    const before = new Set(beforeIndex.closure(site).sites);
    for (const key of afterIndex.closure(site).sites) {
      if (!before.has(key)) { newClosureSites.add(key); continue; }
      const [module, symbol] = key.split("#");
      const member = { kind: "symbol" as const, module: module!, symbol: symbol! };
      if (beforeIndex.siteImage(member) !== afterIndex.siteImage(member)) changedClosureSites.add(key);
    }
  }

  const shapes = await ShapeRegistry.loadDefault(resolve(root, "content/shapes"));
  const principles = await PrincipleRegistry.loadDefault(resolve(root, "content/principles"));
  const population = walkPopulation(root);
  const paths = [...population.roots.draftPacks, ...population.roots.candidatePacks];
  assert.equal(paths.length, 92);
  const projected = paths.map((path) => {
    const document = JSON.parse(read(root, path));
    const original = JSON.parse(baseline(root, path));
    assertAuthoredContentUnchanged(path, original, document);
    const stamped = withDerivedRequires(document, { shapes, principles });
    if (applied) assert.equal(canonicalJson(document.requires), canonicalJson(stamped.requires), `Pack not migrated: ${path}`);
    const ledger = path.endsWith("/pack.json") ? path.replace(/pack\.json$/u, "evidence.json") : path.replace(/\.json$/u, ".evidence.json");
    return { document: path, from: packDigest(original), to: packDigest(stamped), ledger: existsSync(resolve(root, ledger)) ? ledger : null };
  });
  const ledgers = new Map(projected.filter((row) => row.ledger !== null).map((row) => [row.ledger!, row.to]));
  for (const path of [...population.roots.draftSidecars, ...population.roots.candidateSourcing, ...population.roots.shapes, ...population.roots.principles]) {
    if (applied && ledgers.has(path)) assertLedgerMetadataUnchanged(path, JSON.parse(baseline(root, path)), JSON.parse(read(root, path)), ledgers.get(path)!);
    else assert.equal(read(root, path), baseline(root, path), `Source content changed: ${path}`);
  }
  const oldProfiles = JSON.parse(baseline(root, "packages/runtime/src/fixtures/evidence-value-profiles.json"));
  const profiles = JSON.parse(read(root, "packages/runtime/src/fixtures/evidence-value-profiles.json"));
  for (const [key, value] of Object.entries(oldProfiles)) assert.equal(canonicalJson(profiles[key]), canonicalJson(value), `Existing evidence profile changed: ${key}`);
  return { baseline: BASELINE, sourceBaseline: SOURCE_BASELINE, mode: "read_only", authorization: "measurement_only_not_authorization", applied, retainedDeclarations: previous.length, successors: SUCCESSORS, unchangedEvaluatorRoots: images.length, unchangedExistingValueProfiles: Object.keys(oldProfiles).length, changedClosureSites: [...changedClosureSites].sort(), newClosureSites: [...newClosureSites].sort(), unchangedAuthoredPacks: paths.length, unchangedSidecarsShapesPrinciplesExceptPackDigest: population.roots.draftSidecars.length + population.roots.candidateSourcing.length + population.roots.shapes.length + population.roots.principles.length, projectedPackDigestChanges: projected.filter((row) => row.from !== row.to), projectedLedgerRestamps: projected.filter((row) => row.from !== row.to && row.ledger !== null).length };
}

if (process.argv[1]?.endsWith("explorer-summary-migration-proof.js")) {
  const proof = await migrationProof(process.cwd(), !process.argv.includes("--before"));
  const { projectedPackDigestChanges, ...summary } = proof;
  console.log(JSON.stringify(process.argv.includes("--json") ? proof : { ...summary, projectedPackDigestChangeCount: projectedPackDigestChanges.length }, null, 2));
}
