// Author contract for rfc/pack-capability-contract.md (D2152–D2156, re-based 2026-09-24).
//
// It publishes and checks the two reviewed authorities the implementation must expand to:
//   rfc/contracts/pack-capability-schema-transition-v1.json — the 0.30 stage, re-based on the shipped
//     0.29 schema, its post-conditions and the migration population the applier rewrote;
//   rfc/contracts/pack-capability-applicability-v1.json — the literal closed-vocabulary inventory of
//     the LIVE pack schema (closed-schema-members-v2), its stable public ids
//     (stable-schema-member-v3), the unconditional/constant/interpreter roots and external sources.
// `--update` rewrites the generated fields; `--seal-population` records the pre-migration population.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

import {
  canonicalJson,
  closedSchemaInventory,
  mapSchemaMembers,
  valueAtPointer,
} from "../../packages/schema/src/capability/schema-members.ts";

const transitionPath = "rfc/contracts/pack-capability-schema-transition-v1.json";
const applicabilityPath = "rfc/contracts/pack-capability-applicability-v1.json";
const schemaPath = "schemas/drill_pack.schema.json";
const update = process.argv.includes("--update");
const sealPopulation = process.argv.includes("--seal-population");
const read = (path) => readFileSync(path, "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

export function packPopulation() {
  const rows = [];
  for (const name of readdirSync("content/drafts")) {
    if (!name.endsWith(".json") || /\.(sources|evidence|job|graduation|priority)\.json$/u.test(name)) continue;
    const path = `content/drafts/${name}`;
    rows.push({ path, sha256: sha256(readFileSync(path)) });
  }
  for (const directory of readdirSync("content/candidates")) {
    const path = `content/candidates/${directory}/pack.json`;
    if (existsSync(path)) rows.push({ path, sha256: sha256(readFileSync(path)) });
  }
  return rows.sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
}

function checkTransition(input, schema) {
  const output = structuredClone(input);
  for (const condition of output.postConditions) {
    const value = valueAtPointer(schema, condition.pointer);
    if (condition.contains !== undefined) assert.ok(Array.isArray(value) && value.includes(condition.contains), `0.30 post-condition ${condition.pointer} lost ${condition.contains}`);
    else assert.equal(canonicalJson(value), canonicalJson(condition.equals), `0.30 post-condition ${condition.pointer} drifted`);
  }
  assert.ok(/^urn:chess-tabiya:schema:drill-pack:0\.(3\d)$/u.test(schema.$id), "the live schema is below lane 0.30");
  const population = packPopulation();
  if (sealPopulation) {
    output.migration.documents = population;
    output.migration.populationSha256 = sha256(JSON.stringify(population));
    output.migration.productionDocuments = population.filter((row) => !row.path.endsWith(".browser.json")).length;
    output.migration.browserFixtures = population.filter((row) => row.path.endsWith(".browser.json")).length;
  }
  const sealed = output.migration.documents.map((row) => row.path);
  assert.deepEqual(population.map((row) => row.path), sealed, "the pack population moved: a document was added, removed or renamed without a migration row");
  assert.equal(sha256(JSON.stringify(output.migration.documents)), output.migration.populationSha256, "migration population digest is stale");
  assert.equal(output.migration.productionDocuments + output.migration.browserFixtures, sealed.length);
  return output;
}

function symbolCount(site) {
  const match = /^(apps|packages)\/.+\.ts#([A-Za-z_$][A-Za-z0-9_$]*)$/u.exec(site);
  assert.ok(match, `site is not module#symbol: ${site}`);
  const [module, symbol] = site.split("#");
  const source = read(module);
  const declaration = new RegExp(`^(?:export\\s+)?(?:async\\s+)?(?:function|class|const|let|var|interface|type|enum)\\s+${symbol.replaceAll("$", "\\$")}\\b`, "gmu");
  return [...source.matchAll(declaration)].length;
}

function assertLocalSites(applicability) {
  const sites = [
    ...applicability.always.flatMap((row) => [...row.sites, ...(row.dependencies ?? [])]),
    ...applicability.meaningAuthority.constantRoots.flatMap((row) => row.sites),
    ...applicability.meaningAuthority.interpreterRoots.flatMap((row) => [...row.sites, ...row.admissionSites]),
    ...applicability.lifecycleSubjects.flatMap((row) => row.versions.flatMap((version) => version.sites)),
  ];
  for (const site of sites) assert.equal(symbolCount(site), 1, `${site} must resolve exactly once`);
}

export function assertExternalSource(source) {
  assert.equal(source.package, "chessops");
  const lock = read(source.lockfile);
  assert.ok(lock.includes(`${source.lockfileKey}:`), `${source.lockfileKey} is not a lockfile key`);
  assert.ok(lock.includes(`resolution: {integrity: ${source.integrity}}`), "chessops integrity is not the lockfile resolution");
  for (const site of source.manifestSites) {
    const [path, pointer] = site.split("#");
    const manifest = JSON.parse(read(path));
    const value = pointer.split(".").reduce((part, key) => part?.[key], manifest);
    assert.equal(value, source.version, `${site} must pin the resolved semantic dependency`);
  }
}

function sealApplicability(input, schema) {
  const output = structuredClone(input);
  output.schema.sha256 = sha256(read(schemaPath));
  output.schema.canonicalSha256 = sha256(canonicalJson(schema));
  const inventory = closedSchemaInventory(schema, output.metadataExclusions);
  const mappings = mapSchemaMembers(schema, inventory);
  output.closedVocabulary.counts = {
    enumNodes: inventory.enumNodes,
    enumMembers: inventory.enumMembers,
    valueUnionNodes: inventory.valueUnionNodes,
    valueUnionMembers: inventory.valueUnionMembers,
    keyUnionNodes: inventory.keyUnionNodes,
    keyUnionMembers: inventory.keyUnionMembers,
    mappedMembers: inventory.rows.length,
    excludedMembers: 0,
  };
  output.closedVocabulary.sourceInventory = inventory.rows.map((row) => ({ ...row }));
  output.closedVocabulary.inventorySha256 = sha256(canonicalJson(inventory.rows));
  output.closedVocabulary.expandedMappingSha256 = sha256(canonicalJson(mappings));
  for (const row of output.always) {
    assert.deepEqual(row.selector, { kind: "always" });
    assert.equal(typeof row.capability.id, "string");
    assert.deepEqual(row.capability.version, { kind: "integer", value: 1 });
  }
  const closedRows = mappings.map(({ sourceIdentity, id }) => ({ selector: { kind: "schema_member", sourceIdentity }, capability: { id, version: { kind: "integer", value: 1 } } }));
  output.expandedAuthoritySha256 = sha256(canonicalJson({ closedVocabulary: closedRows, always: output.always, resolvedReferences: output.resolvedReferences, memberDependencies: output.memberDependencies }));
  assertLocalSites(output);
  for (const source of output.meaningAuthority.externalSources) assertExternalSource(source);
  for (const exclusion of output.metadataExclusions) assert.ok(valueAtPointer(schema, exclusion) !== undefined, `metadata exclusion ${exclusion} names nothing in the schema`);
  return { output, mappings };
}

const schema = JSON.parse(read(schemaPath));
const transitionInput = JSON.parse(read(transitionPath));
const applicabilityInput = JSON.parse(read(applicabilityPath));
const transition = checkTransition(transitionInput, schema);
const { output: applicability, mappings } = sealApplicability(applicabilityInput, schema);

if (update || sealPopulation) {
  writeFileSync(transitionPath, `${JSON.stringify(transition, null, 2)}\n`);
  writeFileSync(applicabilityPath, `${JSON.stringify(applicability, null, 2)}\n`);
} else {
  assert.deepEqual(transitionInput, transition, "schema transition authority is stale; run make pack-capability-author-repair-update");
  assert.deepEqual(applicabilityInput, applicability, "applicability authority is stale; run make pack-capability-author-repair-update");
}

// Able-to-fail controls: an external upgrade, a removed mapping and an edited population row.
assert.throws(() => assertExternalSource({ ...applicability.meaningAuthority.externalSources[0], version: "0.15.2" }));
assert.throws(() => assertExternalSource({ ...applicability.meaningAuthority.externalSources[0], integrity: "sha512-0" }));
const shortened = structuredClone(applicability.closedVocabulary.sourceInventory);
shortened.pop();
assert.notEqual(sha256(canonicalJson(shortened)), applicability.closedVocabulary.inventorySha256);
if (transition.migration.documents.length > 0) {
  const edited = structuredClone(transition.migration.documents);
  edited[0].path = `${edited[0].path}.renamed`;
  assert.notEqual(sha256(JSON.stringify(edited)), transition.migration.populationSha256);
}

console.log(`pack capability author contract: lane ${schema.$id.split(":").at(-1)}; ${applicability.closedVocabulary.sourceInventory.length} closed members mapped to ${new Set(mappings.map((row) => row.id)).size} public ids; ${applicability.always.length} unconditional roots; ${applicability.meaningAuthority.constantRoots.length} constant roots; ${applicability.meaningAuthority.interpreterRoots.length} interpreter families; migration population ${transition.migration.documents.length} (${transition.migration.productionDocuments} production + ${transition.migration.browserFixtures} browser fixtures)`);
