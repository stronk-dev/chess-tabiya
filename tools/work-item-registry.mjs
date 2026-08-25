#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const WORK_ITEM_STATES = Object.freeze({
  a: "queued",
  b: "blocked_owner",
  c: "blocked_rfc",
  d: "completed",
  e: "retired",
});

const LIVE_STATES = new Set(["queued", "blocked_owner", "blocked_rfc"]);
const CLOSED_STATES = new Set(["completed", "retired"]);
const ALL_STATES = new Set([...LIVE_STATES, ...CLOSED_STATES]);

function hash(value) {
  return `sha256:${crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

function sameSet(left, right) {
  return left.size === right.size && [...left].every((value) => right.has(value));
}

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated].sort();
}

export function parseUxWorkItems(source, roadmap) {
  const capabilityByPrefix = roadmap.uxItemPrefixes ?? {};
  const sourceByPrefix = roadmap.uxItemSources ?? {};
  const ownerByCapability = new Map(roadmap.capabilities.map((capability) => [capability.id, capability.owner]));
  const items = [];
  let group;
  let heading = "";

  for (const line of source.split(/\r?\n/u)) {
    const groupMatch = /^## \(([a-e])\)/u.exec(line);
    if (groupMatch !== null) {
      group = groupMatch[1];
      heading = "";
      continue;
    }
    if (line.startsWith("### ")) {
      heading = line.slice(4).trim();
      continue;
    }
    const idMatch = /^\| ([A-Z][A-Z0-9]*-[a-e]\d+) \|/u.exec(line);
    if (idMatch === null || group === undefined) continue;

    const cells = line.slice(1, -1).split("|").map((cell) => cell.trim());
    const [id, section, summary] = cells;
    const prefix = id.split("-")[0];
    const capability = capabilityByPrefix[prefix];
    const owner = ownerByCapability.get(capability);
    const state = WORK_ITEM_STATES[group];
    const legacyRoute = group === "a" || group === "b" || group === "c" ? cells[3] : undefined;
    const note = group === "a" ? cells[4] : group === "d" || group === "e" ? cells[3] : undefined;
    const tournamentReady = cells.at(-1) === "🏆";
    const sourceDocument = sourceByPrefix[prefix];
    const sourceIdentity = { section, summary, heading, legacyRoute, note, tournamentReady };
    items.push(Object.freeze({
      id,
      sourceState: state,
      state,
      capability,
      owner,
      assignment: LIVE_STATES.has(state) ? `capability:${capability}` : "closed",
      sourceDocument,
      sourceSection: section,
      sourceHeading: heading,
      summary,
      ...(legacyRoute === undefined ? {} : { legacyRoute }),
      ...(note === undefined || note === "" ? {} : { note }),
      ...(tournamentReady ? { tournamentReady: true } : {}),
      sourceDigest: hash(sourceIdentity),
    }));
  }
  return Object.freeze(items.sort((left, right) => left.id.localeCompare(right.id)));
}

export function validateWorkItemRegistry(registry, expected, roadmap) {
  const errors = [];
  const expectedById = new Map(expected.map((item) => [item.id, item]));
  const actualById = new Map(registry.items.map((item) => [item.id, item]));
  const capabilityById = new Map(roadmap.capabilities.map((capability) => [capability.id, capability]));
  for (const id of duplicates(registry.items.map((item) => item.id))) errors.push(`duplicate work item ${id}`);
  if (!sameSet(new Set(expectedById.keys()), new Set(actualById.keys()))) {
    errors.push(`work-item coverage mismatch: missing=[${[...expectedById.keys()].filter((id) => !actualById.has(id)).sort()}] extra=[${[...actualById.keys()].filter((id) => !expectedById.has(id)).sort()}]`);
  }
  for (const [id, expectedItem] of expectedById) {
    const item = actualById.get(id);
    if (item === undefined) continue;
    for (const field of ["capability", "sourceDocument", "sourceSection", "sourceHeading", "summary", "sourceDigest", "sourceState"]) {
      if (item[field] !== expectedItem[field]) errors.push(`${id}: stale ${field}`);
    }
    const capability = capabilityById.get(item.capability);
    if (capability === undefined) errors.push(`${id}: unknown capability ${item.capability}`);
    else if (item.owner !== capability.owner) errors.push(`${id}: owner ${item.owner} disagrees with capability owner ${capability.owner}`);
    if (!ALL_STATES.has(item.state)) errors.push(`${id}: unknown execution state ${item.state}`);
    if (CLOSED_STATES.has(expectedItem.sourceState) && item.state !== expectedItem.sourceState) {
      errors.push(`${id}: execution state ${item.state} reopens source-closed ${expectedItem.sourceState}`);
    }
    if (LIVE_STATES.has(item.state)) {
      if (typeof item.assignment !== "string" || item.assignment === "" || item.assignment === "unassigned") errors.push(`${id}: live item is unassigned`);
      if (item.assignment !== `capability:${item.capability}`) errors.push(`${id}: assignment ${item.assignment} does not name its capability queue`);
    } else if (CLOSED_STATES.has(item.state)) {
      if (item.assignment !== "closed") errors.push(`${id}: closed item retains live assignment ${item.assignment}`);
      if (LIVE_STATES.has(item.sourceState)) {
        if (typeof item.completion?.completedOn !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(item.completion.completedOn)) errors.push(`${id}: completed live item lacks completedOn`);
        if (typeof item.completion?.evidence !== "string" || item.completion.evidence.trim() === "") errors.push(`${id}: completed live item lacks evidence`);
      }
    }
  }
  const counts = Object.fromEntries(Object.values(WORK_ITEM_STATES).map((state) => [state, registry.items.filter((item) => item.state === state).length]));
  return { errors, counts, live: registry.items.filter((item) => LIVE_STATES.has(item.state)).length };
}

export function buildInitialRegistry(indexSource, roadmap) {
  return Object.freeze({
    schemaVersion: 2,
    authority: "planning/ux-implementation-index.md",
    assignmentModel: "Every live item belongs to exactly one capability queue whose owner is declared in planning/roadmap-1.0.json.",
    items: parseUxWorkItems(indexSource, roadmap),
  });
}

export function synchronizeRegistry(indexSource, roadmap, current) {
  const initial = buildInitialRegistry(indexSource, roadmap);
  if (current === undefined) return initial;
  const previous = new Map(current.items.map((item) => [item.id, item]));
  return Object.freeze({
    ...initial,
    items: Object.freeze(initial.items.map((item) => {
      const old = previous.get(item.id);
      if (old === undefined || !ALL_STATES.has(old.state)) return item;
      if (CLOSED_STATES.has(item.sourceState) && old.state !== item.sourceState) return item;
      return Object.freeze({
        ...item,
        state: old.state,
        assignment: LIVE_STATES.has(old.state) ? `capability:${item.capability}` : "closed",
        ...(old.completion === undefined ? {} : { completion: old.completion }),
      });
    })),
  });
}

export function completeRegistryItems(registry, ids, completedOn, evidence) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(completedOn)) throw new Error("--completed-on must be YYYY-MM-DD");
  if (evidence.trim() === "") throw new Error("--evidence must name the landing proof");
  const requested = new Set(ids);
  const known = new Set(registry.items.map((item) => item.id));
  const unknown = [...requested].filter((id) => !known.has(id));
  if (unknown.length > 0) throw new Error(`unknown work item(s): ${unknown.join(", ")}`);
  return Object.freeze({
    ...registry,
    items: Object.freeze(registry.items.map((item) => requested.has(item.id)
      ? Object.freeze({ ...item, state: "completed", assignment: "closed", completion: Object.freeze({ completedOn, evidence }) })
      : item)),
  });
}

export function main(root = process.cwd()) {
  const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
  const roadmap = JSON.parse(read("planning/roadmap-1.0.json"));
  const expected = parseUxWorkItems(read("planning/ux-implementation-index.md"), roadmap);
  const registryPath = path.join(root, roadmap.workItemRegistry);
  if (process.argv.includes("--bootstrap")) {
    if (fs.existsSync(registryPath)) throw new Error(`${roadmap.workItemRegistry} already exists`);
    fs.writeFileSync(registryPath, `${JSON.stringify(buildInitialRegistry(read("planning/ux-implementation-index.md"), roadmap), null, 2)}\n`);
    return;
  }
  if (process.argv.includes("--sync")) {
    const current = fs.existsSync(registryPath) ? JSON.parse(fs.readFileSync(registryPath, "utf8")) : undefined;
    fs.writeFileSync(registryPath, `${JSON.stringify(synchronizeRegistry(read("planning/ux-implementation-index.md"), roadmap, current), null, 2)}\n`);
    console.log(`work-item-sync: reconciled ${expected.length} items from planning/ux-implementation-index.md`);
    return;
  }
  const completeArg = process.argv.find((argument) => argument.startsWith("--complete="));
  if (completeArg !== undefined) {
    const completedOn = process.argv.find((argument) => argument.startsWith("--completed-on="))?.slice("--completed-on=".length) ?? "";
    const evidence = process.argv.find((argument) => argument.startsWith("--evidence="))?.slice("--evidence=".length) ?? "";
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    const completed = completeRegistryItems(registry, completeArg.slice("--complete=".length).split(",").filter(Boolean), completedOn, evidence);
    const result = validateWorkItemRegistry(completed, expected, roadmap);
    if (result.errors.length > 0) throw new Error(result.errors.join("\n"));
    fs.writeFileSync(registryPath, `${JSON.stringify(completed, null, 2)}\n`);
    console.log(`work-item-complete: ${completeArg.slice("--complete=".length)} -> ${evidence}`);
    return;
  }
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const result = validateWorkItemRegistry(registry, expected, roadmap);
  if (result.errors.length > 0) {
    console.error(`work-item-check failed:\n- ${result.errors.join("\n- ")}`);
    process.exitCode = 1;
    return;
  }
  console.log(`work-item-check: ${registry.items.length} items; ${result.live} live; ${result.counts.queued} queued; ${result.counts.blocked_owner} owner-blocked; ${result.counts.blocked_rfc} RFC-blocked; ${result.counts.completed} complete; ${result.counts.retired} retired; zero unassigned`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
