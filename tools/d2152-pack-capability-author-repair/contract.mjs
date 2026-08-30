// Author contract for D2152-D2156. It publishes reviewed bytes; it does not implement lane 0.30.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const transitionPath = "rfc/contracts/pack-capability-schema-transition-v1.json";
const applicabilityPath = "rfc/contracts/pack-capability-applicability-v1.json";
const schemaPath = "schemas/drill_pack.schema.json";
const update = process.argv.includes("--update");
const read = (path) => readFileSync(path, "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

function pointerTokens(pointer) {
  return pointer.split("/").slice(1).map((token) => token.replaceAll("~1", "/").replaceAll("~0", "~"));
}

function applyPatch(source, operations) {
  const target = structuredClone(source);
  for (const operation of operations) {
    const tokens = pointerTokens(operation.path);
    const final = tokens.pop();
    assert.notEqual(final, undefined, `empty patch pointer ${operation.path}`);
    const parent = tokens.reduce((value, token) => value[token], target);
    if (operation.op === "replace") {
      assert.ok(Object.hasOwn(parent, final), `replace target absent: ${operation.path}`);
      parent[final] = structuredClone(operation.value);
    } else if (operation.op === "remove") {
      assert.ok(Object.hasOwn(parent, final), `remove target absent: ${operation.path}`);
      delete parent[final];
    } else if (operation.op === "add" && final === "-") {
      assert.ok(Array.isArray(parent), `append target is not an array: ${operation.path}`);
      parent.push(structuredClone(operation.value));
    } else if (operation.op === "add") {
      assert.equal(Object.hasOwn(parent, final), false, `add target already exists: ${operation.path}`);
      parent[final] = structuredClone(operation.value);
    } else throw new TypeError(`unsupported patch operation ${operation.op}`);
  }
  return target;
}

function sealedTransition(input) {
  const output = structuredClone(input);
  let image = JSON.parse(read(schemaPath));
  let sourceSha = sha256(read(schemaPath));
  assert.equal(sourceSha, output.legacy.schemaSha256);
  assert.deepEqual(output.stages.map((stage) => stage.lane), ["0.28", "0.29", "0.30"]);
  assert.deepEqual(output.stages.map((stage) => stage.owner), [
    "rfc/graduation-clearance.md",
    "rfc/pack-population-provenance.md",
    "rfc/pack-capability-contract.md",
  ]);
  for (const stage of output.stages) {
    stage.source.schemaSha256 = sourceSha;
    assert.equal(image.$id, stage.source.schemaId, `${stage.lane} source id`);
    image = applyPatch(image, stage.patch);
    const bytes = `${JSON.stringify(image, null, 2)}\n`;
    sourceSha = sha256(bytes);
    assert.equal(image.$id, stage.target.schemaId, `${stage.lane} target id`);
    stage.target.schemaSha256 = sourceSha;
    stage.target.canonicalBytes = Buffer.byteLength(bytes);
  }
  const clearance = image.$defs.graduationEntry.properties.clearance;
  assert.ok(clearance.properties.recordKind.enum.includes("citable_text"));
  assert.equal(image.$defs.timingWindow.properties.note.maxLength, 2000);
  assert.ok(image.$defs.feedbackClaim.properties.evidenceTypes.items.enum.includes("provenance_note"));
  assert.equal(image.$defs.provenance.properties.corpusEvidence.oneOf.length, 3);
  assert.ok(image.required.includes("requires"));
  output.target.schemaSha256 = sourceSha;
  output.target.canonicalBytes = output.stages.at(-1).target.canonicalBytes;
  return { output, image };
}

function closedVocabulary(schema, excludedPointers) {
  const rows = [];
  let enumNodes = 0;
  let enumMembers = 0;
  let unionNodes = 0;
  let unionMembers = 0;
  const escape = (token) => token.replaceAll("~", "~0").replaceAll("/", "~1");
  const excluded = (pointer) => excludedPointers.some((root) => pointer === root || pointer.startsWith(`${root}/`));
  const walk = (value, pointer = "") => {
    if (excluded(pointer)) return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${pointer}/${index}`));
      return;
    }
    if (value === null || typeof value !== "object") return;
    if (Array.isArray(value.enum)) {
      enumNodes += 1;
      enumMembers += value.enum.length;
      for (const member of value.enum) rows.push({ schemaPointer: pointer, member });
    }
    if (Array.isArray(value.oneOf)) {
      const branches = value.oneOf.map((branch) => Object.entries(branch?.properties ?? {}).flatMap(([name, memberSchema]) =>
        memberSchema !== null && typeof memberSchema === "object" && Object.hasOwn(memberSchema, "const")
          ? [[name, memberSchema.const]] : []));
      const discriminated = branches.length > 0 && branches.every((branch) => branch.length === 1)
        && new Set(branches.map((branch) => branch[0][0])).size === 1;
      if (discriminated) {
        unionNodes += 1;
        unionMembers += branches.length;
        for (const branch of branches) rows.push({ schemaPointer: pointer, member: branch[0][1] });
      }
    }
    for (const [key, child] of Object.entries(value)) walk(child, `${pointer}/${escape(key)}`);
  };
  walk(schema);
  rows.sort((left, right) => canonical(left).localeCompare(canonical(right)));
  return { rows, enumNodes, enumMembers, unionNodes, unionMembers };
}

function encodeToken(value) {
  const text = String(value);
  return /^[A-Za-z0-9_-]+$/u.test(text) ? text : `x${Buffer.from(text).toString("hex")}`;
}

function valueAt(root, tokens) {
  return tokens.reduce((value, token) => value?.[token], root);
}

function publicId(source, schema) {
  const raw = source.schemaPointer.split("/").filter(Boolean).map((token) => token.replaceAll("~1", "/").replaceAll("~0", "~"));
  const ownerAt = raw[0] === "$defs" || raw[0] === "properties" ? 1 : 0;
  const tokens = [encodeToken(raw[ownerAt] ?? "root")];
  for (let index = ownerAt + 1; index < raw.length; index += 1) {
    const token = raw[index];
    if (["$defs", "properties", "items"].includes(token)) continue;
    if (token === "oneOf" && /^\d+$/u.test(raw[index + 1] ?? "")) {
      const branchIndex = Number(raw[index + 1]);
      const parent = valueAt(schema, raw.slice(0, index));
      const branch = parent.oneOf[branchIndex];
      const constants = Object.entries(branch?.properties ?? {}).flatMap(([name, value]) =>
        value !== null && typeof value === "object" && Object.hasOwn(value, "const") ? [[name, value.const]] : []);
      let identity = constants.length === 1
        ? `${encodeToken(constants[0][0])}-${encodeToken(constants[0][1])}`
        : `shape-${sha256(canonical(branch)).slice(0, 12)}`;
      if (constants.length === 1 && parent.oneOf.filter((candidate) => candidate?.properties?.[constants[0][0]]?.const === constants[0][1]).length > 1) {
        const over = Array.isArray(branch?.properties?.over?.required) ? branch.properties.over.required.join("-") : sha256(canonical(branch)).slice(0, 12);
        identity += `.over-${encodeToken(over)}`;
      }
      tokens.push(identity);
      index += 1;
      continue;
    }
    if (!/^\d+$/u.test(token)) tokens.push(encodeToken(token));
  }
  return [...tokens, encodeToken(source.member)].join(".");
}

function symbolCount(site) {
  const match = /^(apps|packages)\/.+\.ts#([A-Za-z_$][A-Za-z0-9_$]*)$/u.exec(site);
  assert.ok(match, `site is not module#symbol: ${site}`);
  const [module, symbol] = site.split("#");
  const source = read(module);
  const declaration = new RegExp(`\\b(?:export\\s+)?(?:async\\s+)?(?:function|class|const|let|var|interface|type|enum)\\s+${symbol}\\b`, "gu");
  return [...source.matchAll(declaration)].length;
}

function assertLocalSites(applicability) {
  const rows = [...applicability.always, ...applicability.meaningAuthority.constantRoots];
  for (const row of rows) {
    for (const site of [...row.sites, ...(row.dependencies ?? [])]) {
      assert.equal(symbolCount(site), 1, `${site} must resolve exactly once`);
    }
  }
}

function assertChessopsSource(source) {
  assert.equal(source.package, "chessops");
  assert.equal(source.version, "0.15.1");
  assert.equal(source.integrity, "sha512-hQDwv90AFkrPEsRJBebh3ZE+xDga25TCCv4lavNT2plZmd33UKNFYaZsE+7rafMbnBRrDEWUVsSYFqY3qCIGZw==");
  const lock = read(source.lockfile);
  assert.ok(lock.includes(`${source.lockfileKey}:`));
  assert.ok(lock.includes(`resolution: {integrity: ${source.integrity}}`));
  for (const site of source.manifestSites) {
    const [path, pointer] = site.split("#");
    const manifest = JSON.parse(read(path));
    const value = pointer.split(".").reduce((part, key) => part?.[key], manifest);
    assert.equal(value, source.version, `${site} must pin the resolved semantic dependency`);
  }
  assert.ok(read("packages/runtime/src/structure.ts").includes('from "chessops/'));
}

function sealedApplicability(input, targetSchema, targetSha) {
  const output = structuredClone(input);
  output.schema.sha256 = sha256(read(schemaPath));
  output.schema.targetSha256 = targetSha;
  const inventory = closedVocabulary(targetSchema, output.metadataExclusions);
  output.closedVocabulary.enumNodes = inventory.enumNodes;
  output.closedVocabulary.enumMembers = inventory.enumMembers;
  output.closedVocabulary.discriminatedOneOfNodes = inventory.unionNodes;
  output.closedVocabulary.discriminatedOneOfMembers = inventory.unionMembers;
  output.closedVocabulary.mappedMembers = inventory.rows.length;
  output.closedVocabulary.excludedMembers = 0;
  output.closedVocabulary.sourceInventory = inventory.rows;
  output.closedVocabulary.inventorySha256 = sha256(canonical(inventory.rows));
  const mappings = inventory.rows.map((sourceIdentity) => ({
    sourceIdentity,
    capability: { id: publicId(sourceIdentity, targetSchema), version: { kind: "integer", value: 1 } },
  }));
  assert.equal(new Set(mappings.map((row) => row.capability.id)).size, mappings.length, "public capability ids must be collision-free");
  output.closedVocabulary.expandedMappingSha256 = sha256(canonical(mappings));
  const closedRows = mappings.map(({ sourceIdentity, capability }) => ({ selector: { kind: "schema_member", sourceIdentity }, capability }));
  output.expandedAuthoritySha256 = sha256(canonical({ closedVocabulary: closedRows, always: output.always, resolvedReferences: output.resolvedReferences }));
  assertLocalSites(output);
  assert.equal(output.meaningAuthority.externalSources.length, 1);
  assertChessopsSource(output.meaningAuthority.externalSources[0]);
  return output;
}

function followHistory(subjectId, start, declarations) {
  const seen = new Set();
  let cursor = start;
  while (true) {
    const key = canonical(cursor);
    assert.equal(seen.has(key), false, "CAPABILITY_SUCCESSOR_CYCLE");
    seen.add(key);
    const declaration = declarations.find((row) => canonical(row.id) === key);
    assert.ok(declaration, "CAPABILITY_SUCCESSOR_UNKNOWN");
    assert.equal(declaration.subjectId, subjectId, "CAPABILITY_SUCCESSOR_SUBJECT_MISMATCH");
    if (declaration.disposition.kind === "active") return declaration.id;
    if (declaration.disposition.kind === "withdrawn" && declaration.disposition.successor === null) {
      assert.ok(declaration.disposition.noSuccessor, "CAPABILITY_WITHDRAWAL_REFUSAL_MISSING");
      return declaration.disposition.noSuccessor;
    }
    cursor = declaration.disposition.successor;
  }
}

function assertWithdrawalContract() {
  const rfc = read("rfc/pack-capability-contract.md");
  assert.match(rfc, /readonly successor: CapabilityId/u);
  assert.match(rfc, /readonly successor: null; readonly noSuccessor: WithdrawalRefusal/u);
  assert.match(rfc, /migrationPlanForRequirement` follows either kind of edge/u);
  const id1 = { id: "example", version: { kind: "integer", value: 1 } };
  const id2 = { id: "example", version: { kind: "integer", value: 2 } };
  const successor = [
    { subjectId: "example", id: id1, disposition: { kind: "withdrawn", successor: id2 } },
    { subjectId: "example", id: id2, disposition: { kind: "active" } },
  ];
  assert.deepEqual(followHistory("example", id1, successor), id2);
  const refusal = { kind: "no_migration_exists", reason: "the old answer shape has no truthful projection" };
  assert.deepEqual(followHistory("example", id1, [
    { subjectId: "example", id: id1, disposition: { kind: "withdrawn", successor: null, noSuccessor: refusal } },
  ]), refusal);
  assert.throws(() => followHistory("example", id1, [
    { subjectId: "different", id: id1, disposition: { kind: "active" } },
  ]), /CAPABILITY_SUCCESSOR_SUBJECT_MISMATCH/u);
  assert.throws(() => followHistory("example", id1, [
    { subjectId: "example", id: id1, disposition: { kind: "withdrawn", successor: id2 } },
    { subjectId: "example", id: id2, disposition: { kind: "withdrawn", successor: id1 } },
  ]), /CAPABILITY_SUCCESSOR_CYCLE/u);
}

const transitionInput = JSON.parse(read(transitionPath));
const applicabilityInput = JSON.parse(read(applicabilityPath));
const { output: transition, image: targetSchema } = sealedTransition(transitionInput);
const applicability = sealedApplicability(applicabilityInput, targetSchema, transition.target.schemaSha256);
assertWithdrawalContract();

if (update) {
  writeFileSync(transitionPath, `${JSON.stringify(transition, null, 2)}\n`);
  writeFileSync(applicabilityPath, `${JSON.stringify(applicability, null, 2)}\n`);
} else {
  assert.deepEqual(transitionInput, transition, "schema transition authority is stale; run make pack-capability-author-repair-update");
  assert.deepEqual(applicabilityInput, applicability, "applicability authority is stale; run make pack-capability-author-repair-update");
}

// Able-to-fail controls: an external upgrade and a removed mapping must both be detected.
assert.throws(() => assertChessopsSource({ ...applicability.meaningAuthority.externalSources[0], version: "0.15.2" }));
const shortened = structuredClone(applicability);
shortened.closedVocabulary.sourceInventory.pop();
assert.notDeepEqual(shortened.closedVocabulary.sourceInventory, closedVocabulary(targetSchema, shortened.metadataExclusions).rows);

console.log(`pack capability author contract: ${transition.stages.length} cumulative stages; ${applicability.closedVocabulary.sourceInventory.length} checked mappings; ${applicability.always.length} unconditional roots; ${applicability.meaningAuthority.constantRoots.length} constant roots; chessops ${applicability.meaningAuthority.externalSources[0].version}`);
