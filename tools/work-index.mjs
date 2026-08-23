#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseActiveRfcRows } from "./register-check.mjs";

const CLOSED = new Set(["✅", "⛔"]);
const ROUTE_BASENAME = /(?:queue|plan|work-order|handoff|roadmap|triage|brief)\.md$/u;
const ROUTE_EXACT = new Set([
  "planning/app-reality-check.md",
  "planning/content-wave-work-order.md",
  "planning/open-work-inventory.md",
]);
const EXCLUDED = new Set([
  "planning/WORK.md",
  "planning/work-register.md",
  "planning/platform-alignment/never-started-lanes.md",
  "planning/platform-alignment/residue-reconciliation.md",
  "planning/platform-alignment/unrouted-defect-refresh.md",
]);

function posix(value) { return value.split(path.sep).join("/"); }

export function parseLedgerRows(markdown) {
  return [...markdown.matchAll(/^\|\s*(D\d+[a-z]?)(?=\s|\|)\s*([^|]*)\|/gimu)].map((match) => {
    const state = (match[2] ?? "").trim();
    return Object.freeze({ id: match[1], state, open: ![...CLOSED].some((glyph) => state.includes(glyph)) });
  });
}

function markdownFiles(root, relative) {
  const directory = path.join(root, relative);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) return entry.name === "archive" ? [] : markdownFiles(root, child);
    return entry.isFile() && entry.name.endsWith(".md") ? [posix(child)] : [];
  });
}

export function routeDocumentPaths(root) {
  const readme = fs.readFileSync(path.join(root, "rfc/README.md"), "utf8");
  const activeRfcs = parseActiveRfcRows(readme).map((name) => `rfc/${name}`);
  const planning = markdownFiles(root, "planning").filter((relative) => {
    if (EXCLUDED.has(relative) || relative.endsWith("/log.md")) return false;
    return ROUTE_EXACT.has(relative) || ROUTE_BASENAME.test(path.basename(relative));
  });
  return Object.freeze([...new Set([...activeRfcs, ...planning])].sort());
}

function mention(text, id) { return new RegExp(`\\b${id}\\b`, "u").test(text); }

function headingDepth(line) {
  return line.match(/^(#{1,6})\s+/u)?.[1].length ?? 0;
}

function withoutProposedLedgerSections(markdown) {
  const lines = markdown.split("\n");
  const kept = [];
  let skippedDepth = 0;
  for (const line of lines) {
    const depth = headingDepth(line);
    if (skippedDepth && depth && depth <= skippedDepth) skippedDepth = 0;
    if (!skippedDepth && depth && /ledger rows?/iu.test(line) && /propos|not written|renumber/iu.test(line)) {
      skippedDepth = depth;
    }
    if (!skippedDepth) kept.push(line);
  }
  return kept.join("\n");
}

function durableRfcText(markdown) {
  const lines = withoutProposedLedgerSections(markdown).split("\n");
  const kept = [];
  let durable = false;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      const heading = line.slice(3).trim();
      durable = !/^(?:summary|motivation|open questions?|deviations from design|ledger rows?|changelog)\b/iu.test(heading);
    }
    if (durable) kept.push(line);
  }
  return kept.join("\n");
}

function durableRouteText(relative, markdown) {
  if (relative.startsWith("rfc/")) return durableRfcText(markdown);
  return withoutProposedLedgerSections(markdown);
}

function durableMention(relative, text, id) {
  return mention(durableRouteText(relative, text), id);
}

function routePriority(relative) {
  if (relative.startsWith("rfc/")) return 0;
  if (/(?:queue|work-order|triage)\.md$/u.test(relative)) return 1;
  if (/(?:plan|roadmap)\.md$/u.test(relative)) return 2;
  if (/handoff\.md$/u.test(relative)) return 3;
  return 4;
}

export function buildWorkIndex({ ledger, documents }) {
  const rows = parseLedgerRows(ledger);
  const duplicateIds = [...new Set(rows.map((row) => row.id).filter((id, index, all) => all.indexOf(id) !== index))].sort();
  const openRows = rows.filter((row) => row.open);
  const routes = openRows.map((row) => {
    const destinations = Object.entries(documents).filter(([relative, text]) => durableMention(relative, text, row.id)).map(([relative]) => relative)
      .sort((left, right) => routePriority(left) - routePriority(right) || left.localeCompare(right));
    return Object.freeze({ ...row, primary: destinations[0] ?? null, destinations: Object.freeze(destinations) });
  });
  return Object.freeze({
    rows: Object.freeze(rows),
    openRows: Object.freeze(openRows),
    routes: Object.freeze(routes),
    duplicateIds: Object.freeze(duplicateIds),
    unrouted: Object.freeze(routes.filter((route) => route.primary === null).map((route) => route.id)),
  });
}

export function auditRepository(root) {
  const documentPaths = routeDocumentPaths(root);
  const documents = Object.fromEntries(documentPaths.map((relative) => [relative, fs.readFileSync(path.join(root, relative), "utf8")]));
  return { ...buildWorkIndex({ ledger: fs.readFileSync(path.join(root, "design/BACKLOG.md"), "utf8"), documents }), documentPaths };
}

function print(result, json = false) {
  if (json) {
    process.stdout.write(`${JSON.stringify({
      totals: { ledger: result.rows.length, open: result.openRows.length, routed: result.openRows.length - result.unrouted.length, unrouted: result.unrouted.length },
      duplicateIds: result.duplicateIds,
      routes: result.routes,
    }, null, 2)}\n`);
    return;
  }
  console.log(`work-index: ${result.rows.length} ledger rows; ${result.openRows.length} open; ${result.openRows.length - result.unrouted.length} routed; ${result.unrouted.length} unrouted`);
  if (result.duplicateIds.length) console.error(`duplicate ledger ids: ${result.duplicateIds.join(", ")}`);
  if (result.unrouted.length) console.error(`unrouted open rows: ${result.unrouted.join(", ")}`);
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = auditRepository(root);
  print(result, process.argv.includes("--json"));
  if (result.duplicateIds.length || result.unrouted.length) process.exitCode = 1;
}
