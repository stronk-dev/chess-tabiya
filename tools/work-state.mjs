#!/usr/bin/env node

import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseActiveRfcRows } from "./register-check.mjs";
import { parseLedgerSourceRows } from "./work-index.mjs";

export const WORK_STATES = Object.freeze(["untriaged", "todo", "doing", "blocked", "done", "refused"]);
export const LEDGER_GLYPHS = Object.freeze(["🐞", "✅", "📊", "💡", "🛠", "⚖️", "🔬", "📝", "📜", "🔨", "⛔", "🏗", "⚠️"]);
const LIVE_STATES = new Set(["untriaged", "todo", "doing", "blocked"]);
const TERMINAL_STATES = new Set(["done", "refused"]);
const UX_LIVE_STATES = new Set(["queued", "blocked_owner", "blocked_rfc"]);
const STATE_FIELDS = new Set(["owner", "since", "blocker", "question", "evidence", "evidenceKind", "ruling", "rulingKind"]);

function digest(value) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

function idOrder(left, right) {
  const parse = (id) => /^D(\d+)([a-z]?)$/u.exec(id);
  const a = parse(left);
  const b = parse(right);
  return Number(a[1]) - Number(b[1]) || a[2].localeCompare(b[2]);
}

function references(value) {
  return [...String(value ?? "").matchAll(/\[\[(D\d+[a-z]?)\]\]/giu)].map((match) => match[1]);
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function markdownCells(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return undefined;
  return trimmed.slice(1, -1).split("|").map((cell) => cell.trim());
}

export function parseStagedDischarges(documents = []) {
  const declarations = [];
  const errors = [];
  for (const document of documents) {
    const name = document.name ?? "<unknown RFC>";
    const text = String(document.text ?? "");
    const lines = text.split("\n");
    const headings = lines.flatMap((line, index) => /^#{2,6}\s+Staged discharges\s*$/u.test(line) ? [index] : []);
    if (/staged[- ]discharge/iu.test(text) && headings.length === 0) {
      errors.push(`W10 ${name}: staged-discharge prose has no Staged discharges table`);
    }
    if (headings.length > 1) errors.push(`W10 ${name}: multiple Staged discharges sections`);
    for (const heading of headings) {
      let cursor = heading + 1;
      while (cursor < lines.length && lines[cursor].trim() === "") cursor += 1;
      if (lines[cursor]?.trim() !== "| item | foundation | owner | due |" ||
          lines[cursor + 1]?.trim() !== "|---|---|---|---|") {
        errors.push(`W10 ${name}: Staged discharges requires exact item/foundation/owner/due table`);
        continue;
      }
      cursor += 2;
      let rowCount = 0;
      while (cursor < lines.length && lines[cursor].trim().startsWith("|")) {
        rowCount += 1;
        const cells = markdownCells(lines[cursor]);
        const itemRefs = references(cells?.[0]);
        const foundationRefs = references(cells?.[1]);
        const owner = /^`([a-z][a-z0-9-]*)`$/u.exec(cells?.[2] ?? "")?.[1];
        const due = cells?.[3] ?? "";
        if (cells?.length !== 4 || itemRefs.length !== 1 || foundationRefs.length !== 1 || owner === undefined || !isIsoDate(due)) {
          errors.push(`W10 ${name}:${cursor + 1}: malformed staged-discharge row`);
        } else if (itemRefs[0] === foundationRefs[0]) {
          errors.push(`W10 ${name}:${cursor + 1}: discharge item cannot be its own foundation`);
        } else {
          declarations.push(Object.freeze({ item: itemRefs[0], foundation: foundationRefs[0], owner, due, rfc: name }));
        }
        cursor += 1;
      }
      if (rowCount === 0) errors.push(`W10 ${name}: Staged discharges table is empty`);
    }
  }
  const seen = new Set();
  for (const declaration of declarations) {
    if (seen.has(declaration.item)) errors.push(`W10 duplicate staged-discharge item ${declaration.item}`);
    seen.add(declaration.item);
  }
  return Object.freeze({ declarations: Object.freeze(declarations), errors: Object.freeze(errors) });
}

export function buildUxJoin(workItems) {
  const byLedger = new Map();
  for (const item of workItems.items ?? []) {
    for (const id of new Set([...references(item.summary), ...references(item.note)])) {
      const refs = byLedger.get(id) ?? [];
      refs.push(Object.freeze({ id: item.id, state: item.state, owner: item.owner }));
      byLedger.set(id, refs);
    }
  }
  for (const refs of byLedger.values()) refs.sort((left, right) => left.id.localeCompare(right.id));
  return byLedger;
}

function evidenceKind(sourceLine) {
  if (/\b[0-9a-f]{7,40}\b/iu.test(sourceLine)) return "commit";
  if (/`(?:apps|packages|planning|design|docs|rfc|tools|content|schemas)\/[^"]+?`/u.test(sourceLine)) return "path";
  return "closeout-prose";
}

function sourceFields(row, uxJoin) {
  return {
    sourceGlyph: row.sourceGlyph,
    sourceDigest: digest(row.sourceLine),
    uxItems: (uxJoin.get(row.id) ?? []).map((reference) => reference.id),
  };
}

export function buildInitialWorkState({ ledger, roadmap, workItems }) {
  const rows = parseLedgerSourceRows(ledger);
  const uxJoin = buildUxJoin(workItems);
  const items = rows.map((row) => {
    const common = { id: row.id, ...sourceFields(row, uxJoin) };
    if (row.sourceGlyph === "✅") {
      return Object.freeze({ ...common, state: "done", evidence: row.sourceLine, evidenceKind: evidenceKind(row.sourceLine) });
    }
    if (row.sourceGlyph === "⛔") {
      return Object.freeze({ ...common, state: "refused", ruling: `ledger:${row.id}`, rulingKind: "source-row" });
    }
    const owners = new Set((uxJoin.get(row.id) ?? [])
      .filter((reference) => UX_LIVE_STATES.has(reference.state))
      .map((reference) => reference.owner));
    if (owners.size === 1) return Object.freeze({ ...common, state: "todo", owner: [...owners][0] });
    return Object.freeze({ ...common, state: "untriaged", owner: "unowned" });
  }).sort((left, right) => idOrder(left.id, right.id));
  return Object.freeze({
    schemaVersion: 1,
    scope: "design/BACKLOG.md ledger rows",
    authority: "design/BACKLOG.md",
    ownerAuthority: "planning/roadmap-1.0.json",
    untriagedCeiling: items.filter((item) => item.state === "untriaged").length,
    items: Object.freeze(items),
  });
}

function sameArray(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function required(item, fields, errors) {
  for (const field of fields) if (typeof item[field] !== "string" || item[field].trim() === "") errors.push(`${item.id}: ${item.state} requires ${field}`);
}

function forbidden(item, allowed, errors) {
  for (const field of STATE_FIELDS) if (!allowed.has(field) && item[field] !== undefined) errors.push(`${item.id}: ${item.state} forbids ${field}`);
}

function previousCeiling(root) {
  try {
    return JSON.parse(execFileSync("git", ["show", "HEAD:planning/work-state.json"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })).untriagedCeiling;
  } catch {
    return undefined;
  }
}

export function validateWorkState({ registry, ledger, roadmap, workItems, activeRfcs = [], activeRfcDocuments = [], priorCeiling }) {
  const errors = [];
  const rows = parseLedgerSourceRows(ledger);
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const itemsById = new Map((registry.items ?? []).map((item) => [item.id, item]));
  const duplicates = (values) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))].sort(idOrder);
  for (const id of duplicates(rows.map((row) => row.id))) errors.push(`W1 duplicate ledger row ${id}`);
  for (const id of duplicates((registry.items ?? []).map((item) => item.id))) errors.push(`W1 duplicate work-state item ${id}`);
  const missing = [...rowsById.keys()].filter((id) => !itemsById.has(id)).sort(idOrder);
  const extra = [...itemsById.keys()].filter((id) => !rowsById.has(id)).sort(idOrder);
  if (missing.length || extra.length) errors.push(`W1 population mismatch: missing=[${missing.join(", ")}] extra=[${extra.join(", ")}]`);

  const glyphs = new Set(LEDGER_GLYPHS);
  for (const row of rows) if (!glyphs.has(row.sourceGlyph) || !/^D\d+[a-z]?\s+\S/u.test(row.sourceLine.slice(2).trim())) errors.push(`W2 malformed ledger row ${row.id}: glyph=${JSON.stringify(row.sourceGlyph)}`);

  const owners = new Set(roadmap.capabilities.map((capability) => capability.owner));
  owners.add("OWNER");
  owners.add("unowned");
  const active = new Set(activeRfcs);
  const staged = parseStagedDischarges(activeRfcDocuments);
  errors.push(...staged.errors);
  const uxJoin = buildUxJoin(workItems);
  let liveUxToTerminal = 0;
  for (const item of registry.items ?? []) {
    const row = rowsById.get(item.id);
    if (!WORK_STATES.includes(item.state)) errors.push(`W3 ${item.id}: unknown state ${item.state}`);
    if (item.owner !== undefined && !owners.has(item.owner)) errors.push(`W3 ${item.id}: unknown owner ${item.owner}`);
    if (item.blocker !== undefined && item.blocker !== "owner-ruling" && !/^rfc:[a-z0-9-]+\.md$/u.test(item.blocker) && !/^item:D\d+[a-z]?$/u.test(item.blocker)) errors.push(`W3 ${item.id}: invalid blocker ${item.blocker}`);
    if (row === undefined) continue;

    if (item.state === "untriaged") {
      required(item, ["owner"], errors);
      if (item.owner !== "unowned") errors.push(`W4 ${item.id}: untriaged owner must be unowned`);
      forbidden(item, new Set(["owner"]), errors);
    } else if (item.state === "todo") {
      required(item, ["owner"], errors);
      if (item.owner === "unowned") errors.push(`W4 ${item.id}: todo cannot be unowned`);
      forbidden(item, new Set(["owner"]), errors);
    } else if (item.state === "doing") {
      required(item, ["owner", "since"], errors);
      if (item.owner === "unowned") errors.push(`W4 ${item.id}: doing cannot be unowned`);
      if (typeof item.since === "string" && !/^\d{4}-\d{2}-\d{2}$/u.test(item.since)) errors.push(`W4 ${item.id}: since must be YYYY-MM-DD`);
      forbidden(item, new Set(["owner", "since"]), errors);
    } else if (item.state === "blocked") {
      required(item, ["owner", "blocker"], errors);
      if (item.owner === "unowned") errors.push(`W4 ${item.id}: blocked cannot be unowned`);
      forbidden(item, new Set(["owner", "blocker", "question"]), errors);
    } else if (item.state === "done") {
      required(item, ["evidence", "evidenceKind"], errors);
      if (!["commit", "path", "closeout-prose"].includes(item.evidenceKind)) errors.push(`W4 ${item.id}: invalid evidenceKind ${item.evidenceKind}`);
      forbidden(item, new Set(["evidence", "evidenceKind"]), errors);
    } else if (item.state === "refused") {
      required(item, ["ruling", "rulingKind"], errors);
      if (!["owner-ledger", "source-row"].includes(item.rulingKind)) errors.push(`W4 ${item.id}: invalid rulingKind ${item.rulingKind}`);
      if (item.rulingKind === "owner-ledger" && !/^ledger:D\d+[a-z]?$/u.test(item.ruling ?? "")) errors.push(`W4 ${item.id}: owner-ledger ruling must be ledger:D<n>`);
      forbidden(item, new Set(["ruling", "rulingKind"]), errors);
    }

    if (item.state === "blocked") {
      if (item.blocker === "owner-ruling") {
        if (item.owner !== "OWNER" || typeof item.question !== "string" || item.question.trim() === "") errors.push(`W5 ${item.id}: owner-ruling requires OWNER and question`);
      } else if (item.blocker?.startsWith("rfc:") && !active.has(item.blocker.slice(4))) {
        errors.push(`W5 ${item.id}: blocker ${item.blocker} is not an active RFC`);
      } else if (item.blocker?.startsWith("item:")) {
        const blocker = itemsById.get(item.blocker.slice(5));
        if (blocker === undefined || TERMINAL_STATES.has(blocker.state)) errors.push(`W5 ${item.id}: blocker ${item.blocker} is not live`);
      }
    }

    if (row.sourceGlyph === "✅" && item.state !== "done" || row.sourceGlyph !== "✅" && item.state === "done") errors.push(`W6 ${item.id}: ✅ and done disagree`);
    if (row.sourceGlyph === "⛔" && item.state !== "refused" || row.sourceGlyph !== "⛔" && item.state === "refused") errors.push(`W6 ${item.id}: ⛔ and refused disagree`);
    if (item.sourceGlyph !== row.sourceGlyph) errors.push(`W7 ${item.id}: stale sourceGlyph`);
    if (item.sourceDigest !== digest(row.sourceLine)) errors.push(`W7 ${item.id}: stale sourceDigest`);
    const expectedUx = (uxJoin.get(item.id) ?? []).map((reference) => reference.id);
    if (!sameArray(item.uxItems ?? [], expectedUx)) errors.push(`W8 ${item.id}: uxItems disagree; expected=[${expectedUx.join(", ")}]`);
    if (TERMINAL_STATES.has(item.state)) liveUxToTerminal += (uxJoin.get(item.id) ?? []).filter((reference) => UX_LIVE_STATES.has(reference.state)).length;
  }

  for (const declaration of staged.declarations) {
    const item = itemsById.get(declaration.item);
    const foundation = itemsById.get(declaration.foundation);
    if (item === undefined) {
      errors.push(`W10 ${declaration.rfc}: staged-discharge item ${declaration.item} is absent from work-state`);
      continue;
    }
    if (foundation === undefined || !LIVE_STATES.has(foundation.state)) {
      errors.push(`W10 ${declaration.rfc}: foundation ${declaration.foundation} is not live`);
    }
    if (item.state !== "blocked") errors.push(`W10 ${declaration.item}: staged discharge must be blocked`);
    if (item.owner !== declaration.owner) errors.push(`W10 ${declaration.item}: owner must be ${declaration.owner}`);
    if (item.blocker !== `item:${declaration.foundation}`) errors.push(`W10 ${declaration.item}: blocker must be item:${declaration.foundation}`);
  }

  const untriaged = (registry.items ?? []).filter((item) => item.state === "untriaged").length;
  if (untriaged > registry.untriagedCeiling) errors.push(`W9 untriaged ${untriaged} exceeds ceiling ${registry.untriagedCeiling}`);
  if (priorCeiling !== undefined && registry.untriagedCeiling > priorCeiling) errors.push(`W9 ceiling ${registry.untriagedCeiling} exceeds HEAD ceiling ${priorCeiling}`);
  const counts = Object.fromEntries(WORK_STATES.map((state) => [state, (registry.items ?? []).filter((item) => item.state === state).length]));
  const live = [...LIVE_STATES].reduce((sum, state) => sum + counts[state], 0);
  const ownerCounts = {};
  for (const item of registry.items ?? []) if (LIVE_STATES.has(item.state)) ownerCounts[item.owner] = (ownerCounts[item.owner] ?? 0) + 1;
  return {
    errors,
    census: {
      scope: registry.scope,
      population: rows.length,
      counts,
      live,
      ownerCounts,
      untriagedPercentage: live === 0 ? 0 : untriaged / live * 100,
      closeoutProse: (registry.items ?? []).filter((item) => item.state === "done" && item.evidenceKind === "closeout-prose").length,
      sourceRowRefusals: (registry.items ?? []).filter((item) => item.state === "refused" && item.rulingKind === "source-row").length,
      liveUxToTerminal,
    },
  };
}

export function synchronizeWorkState({ registry, ledger, workItems }) {
  const rows = parseLedgerSourceRows(ledger);
  const current = new Map(registry.items.map((item) => [item.id, item]));
  const uxJoin = buildUxJoin(workItems);
  const items = rows.map((row) => {
    const old = current.get(row.id);
    if (old === undefined) return Object.freeze({ id: row.id, state: "untriaged", owner: "unowned", ...sourceFields(row, uxJoin) });
    const sameClosure = old.sourceGlyph === row.sourceGlyph || ![old.sourceGlyph, row.sourceGlyph].some((glyph) => glyph === "✅" || glyph === "⛔");
    return Object.freeze({
      ...old,
      ...(sameClosure ? sourceFields(row, uxJoin) : { uxItems: sourceFields(row, uxJoin).uxItems }),
    });
  }).sort((left, right) => idOrder(left.id, right.id));
  return Object.freeze({ ...registry, items: Object.freeze(items) });
}

export function setWorkState({ registry, ledger, workItems, id, ids, state, values, ceilingEligibleIds }) {
  const rows = new Map(parseLedgerSourceRows(ledger).map((row) => [row.id, row]));
  const requested = new Set(ids ?? [id]);
  const unknown = [...requested].filter((requestedId) => !rows.has(requestedId));
  if (unknown.length) throw new Error(`unknown ledger row(s): ${unknown.join(", ")}`);
  const uxJoin = buildUxJoin(workItems);
  let lowered = 0;
  const items = registry.items.map((old) => {
    const row = rows.get(old.id);
    const selected = requested.has(old.id);
    const common = { id: old.id, state: selected ? state : old.state, ...sourceFields(row, uxJoin) };
    if (!selected) return Object.freeze({ ...old, ...common });
    if (old.state === "untriaged" && state !== "untriaged" && (ceilingEligibleIds === undefined || ceilingEligibleIds.has(old.id))) lowered += 1;
    return Object.freeze({ ...common, ...values });
  });
  return Object.freeze({ ...registry, untriagedCeiling: Math.max(0, registry.untriagedCeiling - lowered), items: Object.freeze(items) });
}

function printCensus(census) {
  console.log(`work-state scope: ${census.scope}; population: ${census.population}`);
  console.log(`work-state counts: ${WORK_STATES.map((state) => `${state}=${census.counts[state]}`).join("; ")}`);
  console.log(`work-state owners: ${Object.entries(census.ownerCounts).sort().map(([owner, count]) => `${owner}=${count}`).join("; ")}`);
  console.log(`work-state evidence: closeout-prose=${census.closeoutProse}; source-row-refusals=${census.sourceRowRefusals}; live-ux-to-terminal=${census.liveUxToTerminal}`);
  console.log(`work-state headline: ${census.counts.untriaged} untriaged of ${census.live} live (${census.untriagedPercentage.toFixed(1)}%)`);
}

function option(name) {
  return process.argv.find((argument) => argument.startsWith(`--${name}=`))?.slice(name.length + 3);
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function main(root = process.cwd()) {
  const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
  const ledger = read("design/BACKLOG.md");
  const roadmap = JSON.parse(read("planning/roadmap-1.0.json"));
  const workItems = JSON.parse(read("planning/work-items-1.0.json"));
  const registryPath = path.join(root, "planning/work-state.json");
  if (process.argv.includes("--bootstrap")) {
    if (fs.existsSync(registryPath)) throw new Error("planning/work-state.json already exists");
    const registry = buildInitialWorkState({ ledger, roadmap, workItems });
    writeJson(registryPath, registry);
    console.log(`work-state bootstrap: ${registry.items.length} rows; ceiling=${registry.untriagedCeiling}`);
    return;
  }
  let registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const ceilingEligibleIds = new Set(registry.items.map((item) => item.id));
  if (process.argv.includes("--sync")) {
    registry = synchronizeWorkState({ registry, ledger, workItems });
    writeJson(registryPath, registry);
  }
  const setId = option("set");
  if (setId !== undefined) {
    const state = option("state") ?? "";
    const values = Object.fromEntries([
      ["owner", option("owner")], ["since", option("since")], ["blocker", option("blocker")],
      ["question", option("question")], ["evidence", option("evidence")], ["evidenceKind", option("evidence-kind")],
      ["ruling", option("ruling")], ["rulingKind", option("ruling-kind")],
    ].filter(([, value]) => value !== undefined));
    registry = setWorkState({ registry, ledger, workItems, ids: setId.split(",").filter(Boolean), state, values, ceilingEligibleIds });
  }
  const readme = read("rfc/README.md");
  const activeRfcs = parseActiveRfcRows(readme);
  const activeRfcDocuments = activeRfcs
    .filter((name) => name !== "0000-rfc-process.md")
    .map((name) => ({ name, text: read(`rfc/${name}`) }));
  const result = validateWorkState({ registry, ledger, roadmap, workItems, activeRfcs, activeRfcDocuments, priorCeiling: previousCeiling(root) });
  if (process.argv.includes("--json")) console.log(JSON.stringify(result, null, 2));
  else printCensus(result.census);
  if (result.errors.length) {
    console.error(`work-state failed:\n- ${result.errors.join("\n- ")}`);
    process.exitCode = 1;
    return;
  }
  if (setId !== undefined || process.argv.includes("--sync")) writeJson(registryPath, registry);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
