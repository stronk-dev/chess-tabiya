#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseActiveRfcRows } from "./register-check.mjs";

export const REQUIRED_DIMENSIONS = Object.freeze([
  "evidence",
  "state",
  "api",
  "experience",
  "defaults",
  "content",
  "verification",
  "release",
]);

const DIMENSION_STATES = new Set(["proven", "partial", "blocked", "broken", "missing", "not_applicable"]);
const ROUTE_STATES = new Set(["live", "live_but_inadequate", "missing"]);
const API_STATES = new Set(["live", "live_direct", "implemented_but_unreachable", "missing"]);

const sameSet = (left, right) =>
  left.size === right.size && [...left].every((value) => right.has(value));

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated].sort();
}

function quotedValues(source) {
  return [...source.matchAll(/["']([^"']+)["']/g)].map((match) => match[1]);
}

export function parseClientRoutes(source) {
  const staticSection = source.match(/export type StaticRouteName\s*=([\s\S]*?);/)?.[1] ?? "";
  const appSection = source.match(/export type AppRoute\s*=([\s\S]*?)\btype Subscriber/)?.[1] ?? "";
  return new Set(
    [...quotedValues(staticSection), ...[...appSection.matchAll(/name:\s*["']([^"']+)["']/g)].map((match) => match[1])]
      .filter((name) => name !== "not-found"),
  );
}

export function parseUxItemIds(source) {
  return [...source.matchAll(/^\| ([A-Z][A-Z0-9]+-[a-z]\d+) \|/gm)].map((match) => match[1]);
}

export function validateRegistry(registry, context) {
  const errors = [];
  const capabilityIds = registry.capabilities.map((capability) => capability.id);
  const capabilitySet = new Set(capabilityIds);
  for (const id of duplicates(capabilityIds)) errors.push(`duplicate capability ${id}`);
  if (!sameSet(new Set(registry.definitionOfDone), new Set(REQUIRED_DIMENSIONS))) {
    errors.push("definitionOfDone must be set-equal to the eight required completion dimensions");
  }

  const mappedRfcs = [];
  for (const capability of registry.capabilities) {
    if (!capability.owner?.trim()) errors.push(`${capability.id}: owner is empty`);
    if (!new Set(["core", "breadth", "post_1_0"]).has(capability.release)) {
      errors.push(`${capability.id}: invalid release class ${capability.release}`);
    }
    for (const dimension of REQUIRED_DIMENSIONS) {
      const value = capability.completion?.[dimension];
      if (!Array.isArray(value) || value.length !== 2 || !DIMENSION_STATES.has(value[0]) || !value[1]?.trim()) {
        errors.push(`${capability.id}: ${dimension} must be [valid state, non-empty done condition]`);
      }
    }
    for (const rfc of capability.rfcs) mappedRfcs.push(rfc);
    if (!context.roadmap.includes(`<!-- roadmap-capability: ${capability.id} -->`)) {
      errors.push(`${capability.id}: missing roadmap capability marker`);
    }
  }

  for (const rfc of duplicates(mappedRfcs)) errors.push(`active RFC assigned more than once: ${rfc}`);
  const activeProductRfcs = new Set(context.activeRfcs.filter((rfc) => rfc !== "0000-rfc-process.md"));
  const mappedRfcSet = new Set(mappedRfcs);
  if (!sameSet(activeProductRfcs, mappedRfcSet)) {
    errors.push(`active RFC coverage mismatch: missing=[${[...activeProductRfcs].filter((rfc) => !mappedRfcSet.has(rfc)).sort()}] extra=[${[...mappedRfcSet].filter((rfc) => !activeProductRfcs.has(rfc)).sort()}]`);
  }

  const declaredUx = new Set(Object.keys(registry.uxSources));
  if (!sameSet(declaredUx, new Set(context.uxFiles))) {
    errors.push(`UX dossier coverage mismatch: missing=[${context.uxFiles.filter((file) => !declaredUx.has(file))}] extra=[${[...declaredUx].filter((file) => !context.uxFiles.includes(file))}]`);
  }
  for (const [source, capability] of Object.entries(registry.uxSources)) {
    if (!capabilitySet.has(capability)) errors.push(`${source}: unknown capability ${capability}`);
  }

  const uxItemIds = parseUxItemIds(context.uxIndex);
  if (duplicates(uxItemIds).length > 0) errors.push(`duplicate UX item ids: ${duplicates(uxItemIds)}`);
  for (const id of uxItemIds) {
    const prefix = id.split("-")[0];
    const capability = registry.uxItemPrefixes[prefix];
    if (!capabilitySet.has(capability)) errors.push(`${id}: no valid capability assignment`);
  }
  for (const prefix of Object.keys(registry.uxItemPrefixes)) {
    if (!uxItemIds.some((id) => id.startsWith(`${prefix}-`))) errors.push(`unused UX prefix assignment ${prefix}`);
  }

  const declaredRouteNames = registry.appRoutes.map(([name]) => name);
  for (const name of duplicates(declaredRouteNames)) errors.push(`duplicate app route ${name}`);
  for (const [name, capability, state] of registry.appRoutes) {
    if (!capabilitySet.has(capability)) errors.push(`${name}: unknown route capability ${capability}`);
    if (!ROUTE_STATES.has(state)) errors.push(`${name}: invalid route state ${state}`);
  }
  const expectedLiveRoutes = new Set(registry.appRoutes.filter(([, , state]) => state !== "missing").map(([name]) => name));
  if (!sameSet(expectedLiveRoutes, context.clientRoutes)) {
    errors.push(`client route coverage mismatch: unassigned=[${[...context.clientRoutes].filter((name) => !expectedLiveRoutes.has(name))}] falsely-live=[${[...expectedLiveRoutes].filter((name) => !context.clientRoutes.has(name))}]`);
  }

  const apiNames = registry.apiFamilies.map(([name]) => name);
  for (const name of duplicates(apiNames)) errors.push(`duplicate API family ${name}`);
  const apiAllowBody = context.application.match(/function isApiPath\(pathname: string\): boolean \{([\s\S]*?)\n\}/)?.[1] ?? "";
  for (const [family, capability, state] of registry.apiFamilies) {
    if (!capabilitySet.has(capability)) errors.push(`${family}: unknown API capability ${capability}`);
    if (!API_STATES.has(state)) errors.push(`${family}: invalid API state ${state}`);
    const restHasFamily = context.rest.includes(family) || context.application.includes(family);
    const allowHasFamily = apiAllowBody.includes(`"${family}`) || apiAllowBody.includes(`'${family}`);
    if ((state === "live" || state === "implemented_but_unreachable" || state === "live_direct") && !restHasFamily) {
      errors.push(`${family}: declared ${state} but no route anchor exists`);
    }
    if (state === "live" && !allowHasFamily) errors.push(`${family}: declared live but absent from isApiPath`);
    if (state === "implemented_but_unreachable" && allowHasFamily) errors.push(`${family}: reachability defect is stale; isApiPath now admits it`);
    if (state === "missing" && restHasFamily) errors.push(`${family}: declared missing but a route anchor now exists`);
  }

  return { errors, uxItemCount: uxItemIds.length, activeProductRfcCount: activeProductRfcs.size };
}

export function main(root = process.cwd()) {
  const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
  const registry = JSON.parse(read("planning/roadmap-1.0.json"));
  const uxFiles = fs.readdirSync(path.join(root, "design/research"))
    .filter((file) => file.startsWith("ux-") && file.endsWith(".md"))
    .sort();
  const result = validateRegistry(registry, {
    activeRfcs: parseActiveRfcRows(read("rfc/README.md")),
    roadmap: read("planning/roadmap-to-done.md"),
    uxFiles,
    uxIndex: read("planning/ux-implementation-index.md"),
    clientRoutes: parseClientRoutes(read("apps/web/src/lib/router.ts")),
    application: read("apps/server/src/application.ts"),
    rest: read("apps/server/src/rest.ts"),
  });
  if (result.errors.length > 0) {
    console.error(`roadmap-check failed:\n- ${result.errors.join("\n- ")}`);
    process.exitCode = 1;
    return;
  }
  console.log(`roadmap-check: ${registry.capabilities.length} capabilities, ${result.activeProductRfcCount} active product RFCs, ${uxFiles.length} UX dossiers, ${result.uxItemCount} UX items, ${registry.appRoutes.length} app-route obligations, ${registry.apiFamilies.length} API families; R1-R8 green`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
