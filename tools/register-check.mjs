#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const RESOURCE_NAMES = Object.freeze([
  "pack-schema",
  "run-schema",
  "shape-entry-schema",
  "principle-entry-schema",
  "campaign-schema",
  "migration",
  "evidence-kinds",
]);

// Keyed by the slug inside the schema's own $id, so the set of registered schemas is
// derived from schemas/ rather than restated here. A schema on disk whose slug is
// absent fails C7 instead of being skipped.
const SCHEMA_SLUGS = Object.freeze({
  "drill-pack": ["pack-schema", "DRILL_PACK_SCHEMA_VERSION"],
  "drill-run": ["run-schema", "DRILL_RUN_SCHEMA_VERSION"],
  "shape-entry": ["shape-entry-schema", "SHAPE_ENTRY_SCHEMA_VERSION"],
  "principle-entry": ["principle-entry-schema", "PRINCIPLE_ENTRY_SCHEMA_VERSION"],
  campaign: ["campaign-schema", null],
});

const ID_PATTERN = /^urn:chess-tabiya:schema:([a-z-]+):([0-9.]+)$/;

export function readSchemaFiles(root) {
  const dir = path.join(root, "schemas");
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(".schema.json"))
    .sort()
    .map((filename) => {
      const parsed = JSON.parse(fs.readFileSync(path.join(dir, filename), "utf8"));
      const id = typeof parsed.$id === "string" ? parsed.$id.match(ID_PATTERN) : null;
      return { filename, id: parsed.$id, slug: id?.[1] ?? null, version: id?.[2] ?? null };
    });
}

export function checkC7(files) {
  const errors = [];
  for (const file of files) {
    if (!file.slug) {
      errors.push(`C7 ${file.filename}: $id ${JSON.stringify(file.id)} is not a versioned urn:chess-tabiya:schema id`);
      continue;
    }
    const mapping = SCHEMA_SLUGS[file.slug];
    if (!mapping) errors.push(`C7 ${file.filename}: schema slug ${file.slug} has no register resource`);
    else if (!RESOURCE_NAMES.includes(mapping[0])) errors.push(`C7 ${file.filename}: resource ${mapping[0]} is not a register resource`);
  }
  for (const [slug, [resource]] of Object.entries(SCHEMA_SLUGS)) {
    if (!files.some((file) => file.slug === slug)) errors.push(`C7 ${resource}: no schema on disk carries slug ${slug}`);
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

export function parseClaimBlock(block, rfc) {
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
    if (!RESOURCE_NAMES.includes(resource)) throw new Error(`${rfc}: unknown resource ${resource}`);
    if (resource.endsWith("-schema") && !/^lane \d+(?:\.\d+)*$/.test(claim)) {
      throw new Error(`${rfc}: invalid schema claim ${claim}`);
    }
    if (resource === "migration" && !/^(position next|position behind [a-z0-9-]+|\d+)$/.test(claim)) {
      throw new Error(`${rfc}: invalid migration claim ${claim}`);
    }
    if (resource === "evidence-kinds" && !/^members [a-z][a-z0-9_]*(?:, [a-z][a-z0-9_]*)*$/.test(claim)) {
      throw new Error(`${rfc}: invalid evidence member claim ${claim}`);
    }
    const parsed = { rfc, resource, claim, changes };
    if (resource === "migration") {
      parsed.migrationIndex = migrationIndex;
      migrationIndex += 1;
    }
    return parsed;
  });
}

const sectionForSummary = (markdown) => markdown.search(/^## Summary\s*$/m);

export function checkC1(documents) {
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
      claims.push(...parseClaimBlock(blocks[0], rfc));
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

export function checkC2(claims, tree) {
  const schemaClaims = claims.filter(({ resource }) => resource.endsWith("-schema"));
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

export function checkC3(claims, registers) {
  const errors = [];
  const collisionKeys = new Map();
  for (const item of claims) {
    let keys = [`${item.resource}|${item.claim}`];
    if (item.resource === "evidence-kinds") {
      keys = item.claim.slice(8).split(", ").map((member) => `${item.resource}|${member}`);
    } else if (item.resource === "migration" && item.claim === "position next" && item.migrationIndex > 0) keys = [];
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

export function checkC4(tree, registers) {
  const errors = [];
  const byResource = new Map(registers.map((register) => [register.resource, register]));
  for (const resource of RESOURCE_NAMES) {
    const register = byResource.get(resource);
    if (!register) continue;
    if (resource === "evidence-kinds") {
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
        const atOrBelow = resource === "migration"
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

export function checkC5(claims) {
  return claims
    .filter(({ resource, claim }) => resource === "migration" && /^\d+$/.test(claim))
    .map(({ rfc, claim }) => `C5 ${rfc}: migration claim is a bare integer: ${claim}`);
}

export function checkC6(tree, registers) {
  const errors = [];
  const counts = new Map();
  for (const register of registers) {
    counts.set(register.resource, (counts.get(register.resource) ?? 0) + 1);
    if (register.headCount !== 1) errors.push(`C6 ${register.resource}: expected exactly one machine-readable head line, found ${register.headCount}`);
    const expected = register.resource === "evidence-kinds"
      ? String(tree[register.resource].members.length)
      : String(tree[register.resource].head);
    if (register.head !== expected) {
      errors.push(`C6 ${register.resource}: register head ${register.head} disagrees with tree ${expected}`);
    }
    const tableRows = register.body.split("\n").filter(isTableData).join("\n");
    if (/next[- ]free/i.test(tableRows)) errors.push(`C6 ${register.resource}: register contains a hand-written next-free row`);
  }
  for (const resource of RESOURCE_NAMES) {
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
    const headMatches = [...body.matchAll(/<!-- register: ([a-z-]+) (?:head|members)=([^ ]+) -->/g)];
    if (headMatches.length === 0) continue;
    const [, resource, head] = headMatches[0];
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
    registers.push({ resource, head, body, landed, claims, headCount: headMatches.length });
  }
  return registers;
}

const requireMatch = (text, regex, label) => {
  const match = text.match(regex);
  if (!match) throw new Error(`cannot derive ${label}`);
  return match[1];
};

export function deriveTree(root, files = readSchemaFiles(root)) {
  const index = fs.readFileSync(path.join(root, "packages/schema/src/index.ts"), "utf8");
  const tree = {};
  for (const file of files) {
    const mapping = file.slug ? SCHEMA_SLUGS[file.slug] : null;
    if (!mapping) continue;
    const [resource, constant] = mapping;
    if (constant) {
      const constantHead = requireMatch(index, new RegExp(`${constant}\\s*=\\s*"([0-9.]+)"`), constant);
      if (constantHead !== file.version) throw new Error(`${constant} ${constantHead} disagrees with ${file.filename} ${file.version}`);
    }
    tree[resource] = { head: file.version };
  }
  const storage = fs.readFileSync(path.join(root, "apps/server/src/storage.ts"), "utf8");
  const storageHead = Number(requireMatch(storage, /export const STORAGE_VERSION\s*=\s*(\d+)/, "STORAGE_VERSION"));
  const migrations = [...storage.matchAll(/\{\s*version:\s*(\d+),\s*name:/g)].map((match) => Number(match[1]));
  if (Math.max(...migrations) !== storageHead) throw new Error(`STORAGE_VERSION ${storageHead} disagrees with migration head ${Math.max(...migrations)}`);
  tree.migration = { head: storageHead };
  const sourcing = fs.readFileSync(path.join(root, "apps/server/src/sourcing/types.ts"), "utf8");
  const membersBody = requireMatch(sourcing, /export const EVIDENCE_KINDS\s*=\s*\[([\s\S]*?)\]\s*as const/, "EVIDENCE_KINDS");
  tree["evidence-kinds"] = { members: [...membersBody.matchAll(/"([a-z0-9_]+)"/g)].map((match) => match[1]) };
  return tree;
}

export function auditRepository(root) {
  const readme = fs.readFileSync(path.join(root, "rfc/README.md"), "utf8");
  const active = parseActiveRfcRows(readme).filter((rfc) => rfc !== "0000-rfc-process.md");
  const documents = Object.fromEntries(active.map((rfc) => [rfc, fs.readFileSync(path.join(root, "rfc", rfc), "utf8")]));
  const files = readSchemaFiles(root);
  const tree = deriveTree(root, files);
  const registers = parseRegisterSections(readme);
  const c1 = checkC1(documents);
  const errors = [
    ...c1.errors,
    ...checkC2(c1.claims, tree),
    ...checkC3(c1.claims, registers),
    ...checkC4(tree, registers),
    ...checkC5(c1.claims),
    ...checkC6(tree, registers),
    ...checkC7(files),
  ];
  return { active, claims: c1.claims, tree, registers, errors };
}

const increment = (version) => {
  const parts = version.split(".").map(Number);
  parts[parts.length - 1] += 1;
  return parts.join(".");
};

export function derivedOutput(result) {
  const lines = [];
  for (const resource of RESOURCE_NAMES) {
    if (resource.endsWith("-schema")) {
      const claimed = result.claims.filter((item) => item.resource === resource).map((item) => item.claim.slice(5));
      const highest = claimed.reduce((value, next) => compareVersions(next, value) > 0 ? next : value, result.tree[resource].head);
      lines.push(`${resource}: head ${result.tree[resource].head}; next free ${increment(highest)}`);
    } else if (resource === "migration") {
      const claims = result.claims.filter((item) => item.resource === resource);
      lines.push(`migration: head ${result.tree.migration.head}; next ${claims.map((item) => `${item.rfc} (${item.claim})`).join(" -> ") || "position next"}`);
    } else {
      const members = result.claims.filter((item) => item.resource === resource).flatMap((item) => item.claim.slice(8).split(", "));
      lines.push(`evidence-kinds: ${result.tree[resource].members.length} members; next n/a; claimed ${members.join(", ") || "none"}`);
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
    } else console.log(`register-check: ${result.active.length} active RFCs, ${result.claims.length} live claims, C1-C7 green`);
  } catch (error) {
    console.error(`register-check: ${error.message}`);
    process.exitCode = 1;
  }
}
