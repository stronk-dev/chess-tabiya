#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseActiveRfcRows } from "./register-check.mjs";

export const STATES = Object.freeze(["draft", "accepted", "implementing", "awaiting", "implemented", "superseded", "withdrawn"]);
const TERMINAL = new Set(["implemented", "superseded", "withdrawn"]);
const cells = (line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
const clean = (value) => value.trim().replace(/^[*_`\s]+/, "");

export function parseStatus(value) {
  const stripped = clean(value);
  const token = stripped.match(/^([a-z-]+)/)?.[1] ?? "";
  return { token, pointer: token === "awaiting" ? stripped.match(/\b(D\d+)\b/)?.[1] ?? null : null };
}

export function bodyStatus(markdown) {
  const value = markdown.match(/^- \*\*Status:\*\*\s*(.+)$/m)?.[1];
  return value ? parseStatus(value) : { token: "", pointer: null };
}

export function parseActiveRecords(readme) {
  const names = new Set(parseActiveRfcRows(readme));
  const section = readme.match(/^## Active\s*$([\s\S]*?)(?=^##\s)/m)?.[1] ?? "";
  return section.split("\n").filter((line) => /^\s*\|/.test(line)).map(cells)
    .filter((row) => names.has(row[0]?.replaceAll("`", "")))
    .map((row) => ({ rfc: row[0].replaceAll("`", ""), status: parseStatus(row[1]) }));
}

export function parseArchiveRows(readme) {
  const start = readme.search(/^## Archive\s*$/m);
  const section = start < 0 ? "" : readme.slice(start);
  return section.split("\n").filter((line) => /^\s*\|/.test(line)).map(cells)
    .map((row) => row[0]?.replaceAll("`", ""))
    .filter((name) => name?.startsWith("archive/") && name.endsWith(".md"));
}

export function parseDischarges(markdown, rfc) {
  const matches = [...markdown.matchAll(/^## Discharges\s*$/gm)];
  if (matches.length !== 1) return { error: `P4 ${rfc}: expected exactly one Discharges section, found ${matches.length}`, rows: [] };
  const start = matches[0].index + matches[0][0].length;
  const rest = markdown.slice(start);
  const next = rest.search(/^##\s/m);
  const section = next < 0 ? rest : rest.slice(0, next);
  const lines = section.split("\n").map((line) => line.trim()).filter(Boolean);
  const none = lines.findIndex((line) => line === "none");
  const header = lines.findIndex((line) => /^\|\s*id\s*\|\s*the obligation\s*\|\s*owner\s*\|\s*recorded when discharged\s*\|\s*discharged\s*\|$/i.test(line));
  if (none >= 0 && header >= 0) return { error: `P4 ${rfc}: Discharges contains both none and a table`, rows: [] };
  if (none >= 0) return { error: null, rows: [] };
  if (header < 0) return { error: `P4 ${rfc}: Discharges contains neither none nor a valid table`, rows: [] };
  const rows = lines.slice(header + 2).filter((line) => line.startsWith("|")).map(cells).map((row) => ({
    id: row[0]?.replaceAll("`", ""), obligation: row[1], owner: row[2], record: row[3], discharged: row[4] ?? "", rfc,
  }));
  if (rows.some((row) => !/^D\d+$/.test(row.id) || !row.obligation || !row.owner || !row.record)) {
    return { error: `P4 ${rfc}: malformed discharge row`, rows };
  }
  return { error: null, rows };
}

export function checkP1(records, bodies) {
  const errors = [];
  for (const record of records) {
    if (!STATES.includes(record.status.token)) errors.push(`P1 ${record.rfc}: invalid Active status ${record.status.token || "(missing)"}`);
    const body = bodyStatus(bodies[record.rfc] ?? "");
    if (!STATES.includes(body.token)) errors.push(`P1 ${record.rfc}: invalid body status ${body.token || "(missing)"}`);
  }
  return errors;
}

export function checkP2(records, bodies) {
  return records.flatMap((record) => {
    const body = bodyStatus(bodies[record.rfc] ?? "");
    return record.status.token === body.token ? [] : [`P2 ${record.rfc}: Active ${record.status.token} != body ${body.token}`];
  });
}

const sameSet = (a, b) => a.size === b.size && [...a].every((item) => b.has(item));
export function checkP3(activeRows, rootFiles, archiveRows, archiveFiles, archiveBodies) {
  const errors = [];
  if (!sameSet(new Set(activeRows), new Set(rootFiles))) errors.push(`P3 Active/root mismatch: rows=${activeRows.join(",")} files=${rootFiles.join(",")}`);
  if (!sameSet(new Set(archiveRows), new Set(archiveFiles))) errors.push(`P3 Archive/files mismatch: rows=${archiveRows.join(",")} files=${archiveFiles.join(",")}`);
  for (const file of archiveFiles) {
    const status = bodyStatus(archiveBodies[file] ?? "").token;
    if (!TERMINAL.has(status)) errors.push(`P3 ${file}: archived body has non-terminal status ${status || "(missing)"}`);
  }
  return errors;
}

export function checkP4(records, bodies) {
  const errors = [];
  const discharges = {};
  for (const record of records) {
    const parsed = parseDischarges(bodies[record.rfc] ?? "", record.rfc);
    if (parsed.error) errors.push(parsed.error);
    discharges[record.rfc] = parsed.rows;
    const body = bodyStatus(bodies[record.rfc] ?? "");
    if (record.status.token === "awaiting" || body.token === "awaiting") {
      const openIds = new Set(parsed.rows.filter((row) => !row.discharged).map((row) => row.id));
      if (openIds.size === 0) errors.push(`P4 ${record.rfc}: awaiting with no open discharge`);
      for (const [site, status] of [["Active", record.status], ["body", body]]) {
        if (status.token === "awaiting" && (!status.pointer || !openIds.has(status.pointer))) errors.push(`P4 ${record.rfc}: ${site} awaiting pointer is missing or discharged`);
      }
    }
  }
  return { errors, discharges };
}

export function checkP5(records, bodies, activeDischarges, archiveBodies) {
  const errors = [];
  for (const record of records) {
    if (activeDischarges[record.rfc]?.some((row) => !row.discharged) && bodyStatus(bodies[record.rfc]).token === "implemented") {
      errors.push(`P5 ${record.rfc}: implemented with an open discharge`);
    }
  }
  for (const [file, markdown] of Object.entries(archiveBodies)) {
    const parsed = parseDischarges(markdown, file);
    if (!parsed.error && parsed.rows.some((row) => !row.discharged)) errors.push(`P5 ${file}: archived with an open discharge`);
  }
  return errors;
}

export function checkP6(discharges, activeNames, exists = () => false) {
  const errors = [];
  const activeSlugs = new Set(activeNames.map((name) => name.replace(/\.md$/, "")));
  for (const rows of Object.values(discharges)) for (const row of rows.filter((item) => !item.discharged)) {
    const owner = clean(row.owner);
    if (/^(OWNER|claude|codex)(?:\b|,|\s|—|\()/.test(owner)) continue;
    const planning = owner.match(/^(planning\/[A-Za-z0-9_./-]+)/)?.[1];
    if (planning) {
      if (!exists(planning)) errors.push(`P6 ${row.rfc} ${row.id}: planning owner does not exist: ${planning}`);
      continue;
    }
    const slug = owner.match(/^([a-z0-9-]+)(?:\b|,|\s|—|\()/)?.[1];
    if (!slug || !activeSlugs.has(slug)) errors.push(`P6 ${row.rfc} ${row.id}: invalid or archived owner ${owner}`);
  }
  return errors;
}

const markdownFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".md")).map((entry) => entry.name).sort();

export function auditRepository(root) {
  const rfcRoot = path.join(root, "rfc");
  const readme = fs.readFileSync(path.join(rfcRoot, "README.md"), "utf8");
  const records = parseActiveRecords(readme);
  const bodies = Object.fromEntries(records.map(({ rfc }) => [rfc, fs.readFileSync(path.join(rfcRoot, rfc), "utf8")]));
  const archiveRows = parseArchiveRows(readme);
  const archiveFiles = markdownFiles(path.join(rfcRoot, "archive")).map((name) => `archive/${name}`);
  const archiveBodies = Object.fromEntries(archiveFiles.map((file) => [file, fs.readFileSync(path.join(rfcRoot, file), "utf8")]));
  const rootFiles = markdownFiles(rfcRoot).filter((name) => !["README.md", "template.md"].includes(name));
  const p4 = checkP4(records, bodies);
  const errors = [
    ...checkP1(records, bodies), ...checkP2(records, bodies),
    ...checkP3(records.map(({ rfc }) => rfc).sort(), rootFiles, archiveRows.sort(), archiveFiles, archiveBodies),
    ...p4.errors, ...checkP5(records, bodies, p4.discharges, archiveBodies),
    ...checkP6(p4.discharges, records.map(({ rfc }) => rfc), (relative) => fs.existsSync(path.join(root, relative))),
  ];
  return { records, archiveFiles, discharges: p4.discharges, errors };
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = auditRepository(root);
  if (result.errors.length) {
    for (const error of result.errors) console.error(error);
    process.exitCode = 1;
  } else {
    const open = Object.values(result.discharges).flat().filter((row) => !row.discharged).length;
    console.log(`status-parity: ${result.records.length} active, ${result.archiveFiles.length} archived, ${open} open discharges, P1-P6 green`);
  }
}
