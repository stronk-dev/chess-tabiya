#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CATALOGUE_PATH = "rfc/shared-resource-registers.json";

// One grammar for resource ids at every boundary: catalogue rows, claim lines, register markers and
// schema-digest markers. Schema `$id` slugs share it so a digit-bearing resource is expressible.
export const RESOURCE_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const RESOURCE_ID = "[a-z][a-z0-9-]*";
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const CLAIM_SOURCE_KINDS = Object.freeze({
  schema_lane: "json_schema",
  migration_position: "storage_migrations",
  members: "string_tuple",
});
const SOURCE_KEYS = Object.freeze({
  json_schema: ["kind", "schemaSlug", "versionExport"],
  storage_migrations: ["headExport", "kind", "path"],
  string_tuple: ["exportName", "kind", "path"],
});

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value)
  && Object.getPrototypeOf(value) === Object.prototype;
const sameKeys = (value, keys) => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
};
const deepFreeze = (value) => {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};

function admitSourcePath(root, relative, label) {
  if (typeof relative !== "string" || relative === "") throw new Error(`${label}: path must be a non-empty string`);
  if (path.isAbsolute(relative) || relative.split(/[\\/]/u).includes("..")) {
    throw new Error(`${label}: path ${relative} must be repository-relative without ..`);
  }
  const realRoot = fs.realpathSync(root);
  let real;
  try {
    real = fs.realpathSync(path.join(realRoot, relative));
  } catch {
    throw new Error(`${label}: path ${relative} does not exist`);
  }
  if (real !== realRoot && !real.startsWith(`${realRoot}${path.sep}`)) {
    throw new Error(`${label}: path ${relative} escapes the repository`);
  }
  if (!fs.statSync(real).isFile()) throw new Error(`${label}: path ${relative} is not a regular file`);
  return real;
}

// The sole resource inventory. Fails closed on any shape the RFC does not name and returns an
// owned, deeply frozen image so a caller mutating its parsed JSON cannot change a running audit.
export function parseResourceCatalogue(value, { root }) {
  if (typeof root !== "string" || root === "") throw new Error("catalogue: root is required");
  if (!isPlainObject(value) || !sameKeys(value, ["resources", "schemaVersion"])) {
    throw new Error("catalogue: envelope must have exactly schemaVersion and resources");
  }
  if (value.schemaVersion !== 1) throw new Error("catalogue: schemaVersion must be 1");
  if (!Array.isArray(value.resources) || value.resources.length === 0) throw new Error("catalogue: resources must be a non-empty array");
  const identities = new Map();
  const rows = value.resources.map((row, index) => {
    const label = `catalogue row ${index}`;
    if (!isPlainObject(row) || !sameKeys(row, ["claimKind", "id", "source"])) throw new Error(`${label}: keys must be exactly id, claimKind, source`);
    if (typeof row.id !== "string" || !RESOURCE_ID_PATTERN.test(row.id)) throw new Error(`${label}: malformed id ${JSON.stringify(row.id)}`);
    const expectedKind = CLAIM_SOURCE_KINDS[row.claimKind];
    if (!Object.hasOwn(CLAIM_SOURCE_KINDS, row.claimKind)) throw new Error(`${row.id}: unknown claimKind ${JSON.stringify(row.claimKind)}`);
    const source = row.source;
    if (!isPlainObject(source) || !Object.hasOwn(SOURCE_KEYS, source.kind)) throw new Error(`${row.id}: unknown source kind`);
    if (source.kind !== expectedKind) throw new Error(`${row.id}: claimKind ${row.claimKind} requires source ${expectedKind}, not ${source.kind}`);
    if (!sameKeys(source, SOURCE_KEYS[source.kind])) throw new Error(`${row.id}: ${source.kind} source keys must be exactly ${SOURCE_KEYS[source.kind].join(", ")}`);
    let identity;
    if (source.kind === "json_schema") {
      if (typeof source.schemaSlug !== "string" || !RESOURCE_ID_PATTERN.test(source.schemaSlug)) throw new Error(`${row.id}: malformed schemaSlug`);
      if (source.versionExport !== null && (typeof source.versionExport !== "string" || !IDENTIFIER.test(source.versionExport))) {
        throw new Error(`${row.id}: versionExport must be null or a JavaScript identifier`);
      }
      identity = `schema:${source.schemaSlug}`;
    } else {
      if (source.kind === "storage_migrations" && (source.path !== "apps/server/src/storage.ts" || source.headExport !== "STORAGE_VERSION")) {
        throw new Error(`${row.id}: storage_migrations must name apps/server/src/storage.ts and STORAGE_VERSION`);
      }
      const exportName = source.kind === "storage_migrations" ? source.headExport : source.exportName;
      if (typeof exportName !== "string" || !IDENTIFIER.test(exportName)) throw new Error(`${row.id}: export name must be a JavaScript identifier`);
      identity = `path:${admitSourcePath(root, source.path, row.id)}#${exportName}`;
    }
    const previous = identities.get(identity);
    if (previous) throw new Error(`${row.id}: source identity ${identity} is already claimed by ${previous}`);
    identities.set(identity, row.id);
    return { id: row.id, claimKind: row.claimKind, source: { ...source } };
  });
  for (let index = 1; index < rows.length; index += 1) {
    if (rows[index - 1].id === rows[index].id) throw new Error(`catalogue: duplicate id ${rows[index].id}`);
    if (rows[index - 1].id > rows[index].id) throw new Error(`catalogue: ids must be ASCII-sorted (${rows[index - 1].id} before ${rows[index].id})`);
  }
  return deepFreeze({ schemaVersion: 1, resources: rows });
}

export function loadResourceCatalogue(root) {
  const bytes = fs.readFileSync(path.join(root, CATALOGUE_PATH), "utf8");
  return parseResourceCatalogue(JSON.parse(bytes), { root });
}

const resourceRow = (catalogue, id) => catalogue.resources.find((row) => row.id === id);
const claimKindOf = (catalogue, id) => resourceRow(catalogue, id)?.claimKind;
const schemaRowForSlug = (catalogue, slug) => catalogue.resources
  .find((row) => row.source.kind === "json_schema" && row.source.schemaSlug === slug);

const ID_PATTERN = /^urn:chess-tabiya:schema:([a-z][a-z0-9-]*):([0-9.]+)$/;

// A slug names at most one schema file; two files sharing one fail before any tree derivation.
export function readSchemaFiles(root) {
  const dir = path.join(root, "schemas");
  const files = fs.readdirSync(dir)
    .filter((name) => name.endsWith(".schema.json"))
    .sort()
    .map((filename) => {
      const bytes = fs.readFileSync(path.join(dir, filename));
      const parsed = JSON.parse(bytes.toString("utf8"));
      const id = typeof parsed.$id === "string" ? parsed.$id.match(ID_PATTERN) : null;
      const digest = crypto.createHash("sha256").update(bytes).digest("hex").slice(0, 12);
      return { filename, id: parsed.$id, slug: id?.[1] ?? null, version: id?.[2] ?? null, digest };
    });
  const seen = new Map();
  for (const file of files) {
    if (!file.slug) continue;
    if (seen.has(file.slug)) throw new Error(`schema slug ${file.slug} is carried by both ${seen.get(file.slug)} and ${file.filename}`);
    seen.set(file.slug, file.filename);
  }
  return files;
}

export function checkC7(files, catalogue) {
  const errors = [];
  for (const file of files) {
    if (!file.slug) {
      errors.push(`C7 ${file.filename}: $id ${JSON.stringify(file.id)} is not a versioned urn:chess-tabiya:schema id`);
      continue;
    }
    if (!schemaRowForSlug(catalogue, file.slug)) errors.push(`C7 ${file.filename}: schema slug ${file.slug} has no register resource`);
  }
  for (const row of catalogue.resources) {
    if (row.source.kind !== "json_schema") continue;
    if (!files.some((file) => file.slug === row.source.schemaSlug)) errors.push(`C7 ${row.id}: no schema on disk carries slug ${row.source.schemaSlug}`);
  }
  return errors;
}

// C8 — a schema cannot be edited without saying so on the register. The register records the
// bytes it was last reconciled against; an edit that matches no live claim is an undeclared
// change, which is the under-declaration the campaign register was opened for. A resource with a
// live claim is mid-flight and its digest is expected to differ until the lane lands.
export function checkC8(files, registers, claims, catalogue) {
  const errors = [];
  const byResource = new Map(registers.map((register) => [register.resource, register]));
  const claimed = new Set(claims.map((claim) => claim.resource));
  for (const file of files) {
    const row = file.slug ? schemaRowForSlug(catalogue, file.slug) : null;
    if (!row) continue;
    const resource = row.id;
    const register = byResource.get(resource);
    if (!register) continue;
    if (register.digest === null) {
      errors.push(`C8 ${resource}: register records no schema digest for ${file.filename}`);
      continue;
    }
    if (register.digest === file.digest) continue;
    if (claimed.has(resource)) continue;
    errors.push(`C8 ${resource}: ${file.filename} changed since the register was reconciled (register ${register.digest}, disk ${file.digest}) and no live claim declares it`);
  }
  return errors;
}

const rowCells = (line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
const isTableData = (line) => /^\s*\|/.test(line) && !/^\s*\|\s*:?-+/.test(line);
const cleanRfc = (value) => value.replaceAll("`", "").replace(/^rfc\//, "");

export function parseActiveRfcRows(markdown) {
  const match = markdown.match(/^## Active\s*$([\s\S]*?)(?=^##\s)/m);
  if (!match) throw new Error("rfc/README.md has no ## Active section");
  return match[1]
    .split("\n")
    .filter(isTableData)
    .map(rowCells)
    .filter((cells) => cells[0]?.endsWith(".md") || cells[0]?.includes(".md`"))
    .map((cells) => cleanRfc(cells[0]));
}

export function locateClaimBlocks(markdown) {
  const lines = markdown.split("\n");
  const blocks = [];
  let fence = null;
  let claim = null;
  for (let index = 0; index < lines.length; index += 1) {
    const opening = lines[index].match(/^\s*(`{3,}|~{3,})([^`]*)$/);
    if (!fence && opening) {
      fence = { char: opening[1][0], length: opening[1].length };
      if (opening[2].trim() === "tabiya-claims") {
        claim = { start: index, lines: [] };
      }
      continue;
    }
    if (fence) {
      const closing = lines[index].match(/^\s*(`{3,}|~{3,})\s*$/);
      if (closing && closing[1][0] === fence.char && closing[1].length >= fence.length) {
        if (claim) blocks.push({ ...claim, end: index });
        fence = null;
        claim = null;
      } else if (claim) {
        claim.lines.push(lines[index]);
      }
    }
  }
  return blocks;
}

const LANE = /^lane (?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*))*$/;
const MEMBERS = /^members [a-z][a-z0-9_]*(?:, [a-z][a-z0-9_]*)*$/;

export function parseClaimBlock(block, rfc, catalogue) {
  const meaningful = block.lines.map((line) => line.trim()).filter((line) => line && !line.startsWith("#"));
  if (meaningful.length === 1 && meaningful[0] === "none") return [];
  if (meaningful.includes("none")) throw new Error(`${rfc}: none cannot accompany a claim`);
  let migrationIndex = 0;
  return meaningful.map((line) => {
    const cells = line.split("|").map((cell) => cell.trim());
    if (cells.length !== 3 || cells.some((cell) => !cell)) {
      throw new Error(`${rfc}: claim must have three non-empty fields: ${line}`);
    }
    const [resource, claim, changes] = cells;
    const claimKind = claimKindOf(catalogue, resource);
    if (!claimKind) throw new Error(`${rfc}: unknown resource ${resource}`);
    if (claimKind === "schema_lane" && !LANE.test(claim)) {
      throw new Error(`${rfc}: invalid schema claim ${claim}`);
    }
    if (claimKind === "migration_position" && !/^(position next|position behind [a-z0-9-]+|\d+)$/.test(claim)) {
      throw new Error(`${rfc}: invalid migration claim ${claim}`);
    }
    if (claimKind === "members") {
      if (!MEMBERS.test(claim)) throw new Error(`${rfc}: invalid member claim ${claim}`);
      const members = claim.slice(8).split(", ");
      if (new Set(members).size !== members.length) throw new Error(`${rfc}: duplicate member in claim ${claim}`);
    }
    const parsed = { rfc, resource, claim, changes };
    if (claimKind === "migration_position") {
      parsed.migrationIndex = migrationIndex;
      migrationIndex += 1;
    }
    return parsed;
  });
}

const sectionForSummary = (markdown) => markdown.search(/^## Summary\s*$/m);

export function checkC1(documents, catalogue) {
  const errors = [];
  const claims = [];
  for (const [rfc, markdown] of Object.entries(documents)) {
    const blocks = locateClaimBlocks(markdown);
    if (blocks.length !== 1) {
      errors.push(`C1 ${rfc}: expected exactly one top-level tabiya-claims block, found ${blocks.length}`);
      continue;
    }
    const lines = markdown.split("\n");
    const summary = sectionForSummary(markdown);
    const summaryLine = lines.findIndex((line) => /^## Summary\s*$/.test(line));
    const firstRule = lines.findIndex((line, index) => index < summaryLine && /^---\s*$/.test(line));
    const lineOffsets = markdown.split("\n").slice(0, blocks[0].start).join("\n").length;
    if (summary < 0 || lineOffsets > summary || (firstRule >= 0 && blocks[0].start > firstRule)) {
      errors.push(`C1 ${rfc}: tabiya-claims block is not in the metadata preamble before ## Summary`);
      continue;
    }
    try {
      claims.push(...parseClaimBlock(blocks[0], rfc, catalogue));
    } catch (error) {
      errors.push(`C1 ${error.message}`);
    }
  }
  return { errors, claims };
}

export const compareVersions = (left, right) => {
  const a = left.split(".").map(Number);
  const b = right.split(".").map(Number);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return Math.sign(difference);
  }
  return 0;
};

export function checkC2(claims, tree, catalogue) {
  const schemaClaims = claims.filter(({ resource }) => claimKindOf(catalogue, resource) === "schema_lane" && tree[resource]);
  const errors = schemaClaims
    .filter(({ resource, claim }) => compareVersions(claim.slice(5), tree[resource].head) <= 0)
    .map(({ rfc, resource, claim }) => `C2 ${rfc}: ${resource} ${claim} is not above tree head ${tree[resource].head}`);
  // A lane must be versioned to the same depth as the head it advances, or "lane 1"
  // reads as above 0.27 while naming a different axis entirely.
  for (const { rfc, resource, claim } of schemaClaims) {
    const parts = claim.slice(5).split(".").length;
    const headParts = String(tree[resource].head).split(".").length;
    if (parts !== headParts) errors.push(`C2 ${rfc}: ${resource} ${claim} has ${parts} version part(s); head ${tree[resource].head} has ${headParts}`);
  }
  return errors;
}

const claimKey = ({ rfc, resource, claim, changes }) => `${rfc}|${resource}|${claim}|${changes}`;

export function checkC3(claims, registers, catalogue) {
  const errors = [];
  const collisionKeys = new Map();
  for (const item of claims) {
    let keys = [`${item.resource}|${item.claim}`];
    const claimKind = claimKindOf(catalogue, item.resource);
    if (claimKind === "members") {
      keys = item.claim.slice(8).split(", ").map((member) => `${item.resource}|${member}`);
    } else if (claimKind === "migration_position" && item.claim === "position next" && item.migrationIndex > 0) keys = [];
    for (const key of keys) {
      const previous = collisionKeys.get(key);
      if (previous && previous.rfc !== item.rfc) {
        errors.push(`C3 collision: ${previous.rfc} and ${item.rfc} both claim ${key}`);
      } else collisionKeys.set(key, item);
    }
  }
  const declared = new Set(claims.map(claimKey));
  const registered = new Set(registers.flatMap(({ claims: rows }) => rows).map(claimKey));
  for (const key of declared) if (!registered.has(key)) errors.push(`C3 declaration has no register row: ${key}`);
  for (const key of registered) if (!declared.has(key)) errors.push(`C3 register row has no declaration: ${key}`);
  return errors;
}

export function checkC4(tree, registers, catalogue) {
  const errors = [];
  const byResource = new Map(registers.map((register) => [register.resource, register]));
  for (const { id: resource, claimKind } of catalogue.resources) {
    const register = byResource.get(resource);
    // A catalogue row whose source is absent from the tree is reported by C7, not dereferenced here.
    if (!register || !tree[resource]) continue;
    if (claimKind === "members") {
      const landed = new Set(register.landed.map((row) => row.key));
      for (const member of tree[resource].members) {
        if (!landed.has(member)) errors.push(`C4 ${resource}: tree member ${member} has no landed row`);
      }
    } else {
      const head = String(tree[resource].head);
      if (!register.landed.some((row) => row.key === head)) {
        errors.push(`C4 ${resource}: tree head ${head} has no landed row`);
      }
      for (const row of register.landed) {
        const atOrBelow = claimKind === "migration_position"
          ? Number(row.key) <= Number(head)
          : compareVersions(row.key, head) <= 0;
        if (atOrBelow && /\b(?:held|claimed)\b/i.test(row.text)) {
          errors.push(`C4 ${resource}: landed ${row.key} still advertises a held or claimed lane`);
        }
      }
    }
  }
  return errors;
}

export function checkC5(claims, catalogue) {
  return claims
    .filter(({ resource, claim }) => claimKindOf(catalogue, resource) === "migration_position" && /^\d+$/.test(claim))
    .map(({ rfc, claim }) => `C5 ${rfc}: migration claim is a bare integer: ${claim}`);
}

export function checkC6(tree, registers, catalogue) {
  const errors = [];
  const counts = new Map();
  for (const register of registers) {
    counts.set(register.resource, (counts.get(register.resource) ?? 0) + 1);
    if (register.headCount !== 1) errors.push(`C6 ${register.resource}: expected exactly one machine-readable head line, found ${register.headCount}`);
    const claimKind = claimKindOf(catalogue, register.resource);
    if (!claimKind) {
      errors.push(`C6 ${register.resource}: register section names a resource absent from the catalogue`);
      continue;
    }
    if (!tree[register.resource]) continue;
    const expected = claimKind === "members"
      ? String(tree[register.resource].members.length)
      : String(tree[register.resource].head);
    if (register.head !== expected) {
      errors.push(`C6 ${register.resource}: register head ${register.head} disagrees with tree ${expected}`);
    }
    const tableRows = register.body.split("\n").filter(isTableData).join("\n");
    if (/next[- ]free/i.test(tableRows)) errors.push(`C6 ${register.resource}: register contains a hand-written next-free row`);
  }
  for (const { id: resource } of catalogue.resources) {
    if (counts.get(resource) !== 1) errors.push(`C6 ${resource}: expected exactly one register section, found ${counts.get(resource) ?? 0}`);
  }
  return errors;
}

function parseRegisterSections(markdown) {
  const headings = [...markdown.matchAll(/^## (.+ register)\s*$/gm)];
  const registers = [];
  for (let index = 0; index < headings.length; index += 1) {
    const start = headings[index].index;
    const nextHeading = markdown.slice(start + headings[index][0].length).search(/^##\s/m);
    const end = nextHeading < 0 ? markdown.length : start + headings[index][0].length + nextHeading;
    const body = markdown.slice(start, end);
    const headMatches = [...body.matchAll(new RegExp(`<!-- register: (${RESOURCE_ID}) (?:head|members)=([^ ]+) -->`, "g"))];
    if (headMatches.length === 0) continue;
    const [, resource, head] = headMatches[0];
    const digestMatch = body.match(new RegExp(`<!-- schema-digest: (${RESOURCE_ID}) ([0-9a-f]{12}) -->`));
    const digest = digestMatch && digestMatch[1] === resource ? digestMatch[2] : null;
    const subsection = (heading) => {
      const marker = `### ${heading}`;
      const markerIndex = body.indexOf(marker);
      if (markerIndex < 0) return "";
      const contentStart = markerIndex + marker.length;
      const rest = body.slice(contentStart);
      const next = rest.search(/^###\s/m);
      return next < 0 ? rest : rest.slice(0, next);
    };
    const landedText = subsection("Landed");
    const claimsText = subsection("Live claims");
    const landed = landedText.split("\n").filter(isTableData).map(rowCells)
      .filter((cells) => !/^(version|member|migration)$/i.test(cells[0] ?? ""))
      .map((cells) => ({ key: cells[0], text: cells.join(" | ") }));
    const claims = claimsText.split("\n").filter(isTableData).map(rowCells)
      .filter((cells) => cells[0] !== "claim")
      .map((cells) => ({ claim: cells[0], rfc: cleanRfc(cells[1]), changes: cells[2], resource }));
    registers.push({ resource, head, body, landed, claims, digest, headCount: headMatches.length });
  }
  return registers;
}

const requireMatch = (text, regex, label) => {
  const match = text.match(regex);
  if (!match) throw new Error(`cannot derive ${label}`);
  return match[1];
};

function readStringTuple(text, exportName, label) {
  const escaped = exportName.replace(/[$]/g, "\\$");
  const match = text.match(new RegExp(`export const ${escaped}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`));
  if (!match) throw new Error(`${label}: cannot derive literal tuple ${exportName}`);
  const elements = match[1].split(",").map((element) => element.trim()).filter(Boolean);
  const members = elements.map((element) => {
    const literal = element.match(/^"([^"\\]*)"$/);
    if (!literal) throw new Error(`${label}: ${exportName} element ${element} is not a string literal`);
    return literal[1];
  });
  if (new Set(members).size !== members.length) throw new Error(`${label}: ${exportName} has duplicate members`);
  return members;
}

export function deriveTree(root, files = readSchemaFiles(root), catalogue = loadResourceCatalogue(root)) {
  const index = fs.readFileSync(path.join(root, "packages/schema/src/index.ts"), "utf8");
  const tree = {};
  for (const row of catalogue.resources) {
    const { source } = row;
    if (source.kind === "json_schema") {
      const file = files.find((candidate) => candidate.slug === source.schemaSlug);
      if (!file) continue;
      if (source.versionExport) {
        const constantHead = requireMatch(index, new RegExp(`${source.versionExport}\\s*=\\s*"([0-9.]+)"`), source.versionExport);
        if (constantHead !== file.version) throw new Error(`${source.versionExport} ${constantHead} disagrees with ${file.filename} ${file.version}`);
      }
      tree[row.id] = { head: file.version };
    } else if (source.kind === "storage_migrations") {
      const storage = fs.readFileSync(path.join(root, source.path), "utf8");
      const storageHead = Number(requireMatch(storage, new RegExp(`export const ${source.headExport}\\s*=\\s*(\\d+)`), source.headExport));
      const migrations = [...storage.matchAll(/\{\s*version:\s*(\d+),\s*name:/g)].map((match) => Number(match[1]));
      if (Math.max(...migrations) !== storageHead) throw new Error(`${source.headExport} ${storageHead} disagrees with migration head ${Math.max(...migrations)}`);
      tree[row.id] = { head: storageHead };
    } else {
      const text = fs.readFileSync(path.join(root, source.path), "utf8");
      tree[row.id] = { members: readStringTuple(text, source.exportName, row.id) };
    }
  }
  return tree;
}

export function auditRepository(root) {
  const readme = fs.readFileSync(path.join(root, "rfc/README.md"), "utf8");
  const active = parseActiveRfcRows(readme).filter((rfc) => rfc !== "0000-rfc-process.md");
  const documents = Object.fromEntries(active.map((rfc) => [rfc, fs.readFileSync(path.join(root, "rfc", rfc), "utf8")]));
  const catalogue = loadResourceCatalogue(root);
  const files = readSchemaFiles(root);
  const tree = deriveTree(root, files, catalogue);
  const registers = parseRegisterSections(readme);
  const c1 = checkC1(documents, catalogue);
  const errors = [
    ...c1.errors,
    ...checkC2(c1.claims, tree, catalogue),
    ...checkC3(c1.claims, registers, catalogue),
    ...checkC4(tree, registers, catalogue),
    ...checkC5(c1.claims, catalogue),
    ...checkC6(tree, registers, catalogue),
    ...checkC7(files, catalogue),
    ...checkC8(files, registers, c1.claims, catalogue),
  ];
  return { active, catalogue, claims: c1.claims, tree, registers, errors };
}

const increment = (version) => {
  const parts = version.split(".").map(Number);
  parts[parts.length - 1] += 1;
  return parts.join(".");
};

export function derivedOutput(result) {
  const lines = [];
  for (const { id: resource, claimKind } of result.catalogue.resources) {
    if (!result.tree[resource]) lines.push(`${resource}: absent from the tree`);
    else if (claimKind === "schema_lane") {
      const claimed = result.claims.filter((item) => item.resource === resource).map((item) => item.claim.slice(5));
      const highest = claimed.reduce((value, next) => compareVersions(next, value) > 0 ? next : value, result.tree[resource].head);
      lines.push(`${resource}: head ${result.tree[resource].head}; next free ${increment(highest)}`);
    } else if (claimKind === "migration_position") {
      const claims = result.claims.filter((item) => item.resource === resource);
      lines.push(`${resource}: head ${result.tree[resource].head}; next ${claims.map((item) => `${item.rfc} (${item.claim})`).join(" -> ") || "position next"}`);
    } else {
      const members = result.claims.filter((item) => item.resource === resource).flatMap((item) => item.claim.slice(8).split(", "));
      lines.push(`${resource}: ${result.tree[resource].members.length} members; next n/a; claimed ${members.join(", ") || "none"}`);
    }
  }
  return lines;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  try {
    const result = auditRepository(root);
    for (const line of derivedOutput(result)) console.log(line);
    if (result.errors.length) {
      for (const error of result.errors) console.error(error);
      process.exitCode = 1;
    } else console.log(`register-check: ${result.active.length} active RFCs, ${result.claims.length} live claims, C1-C8 green`);
  } catch (error) {
    console.error(`register-check: ${error.message}`);
    process.exitCode = 1;
  }
}
