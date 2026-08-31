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
const MILESTONE_STATES = new Set(["active", "implementing", "queued", "blocked_contract", "blocked_foundation", "complete"]);
const CHECKPOINT_IMPACTS = new Set(["advanced", "held", "regressed"]);

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
  if (registry.schemaVersion !== 2) errors.push("schemaVersion must be 2");
  if (registry.workItemRegistry !== "planning/work-items-1.0.json") {
    errors.push("workItemRegistry must name planning/work-items-1.0.json");
  }
  const capabilityIds = registry.capabilities.map((capability) => capability.id);
  const capabilitySet = new Set(capabilityIds);
  for (const id of duplicates(capabilityIds)) errors.push(`duplicate capability ${id}`);

  const milestones = registry.executionPlan?.milestones ?? [];
  const milestoneIds = milestones.map((milestone) => milestone.id);
  const milestoneSet = new Set(milestoneIds);
  for (const id of duplicates(milestoneIds)) errors.push(`duplicate execution milestone ${id}`);
  const executionCoverage = new Set();
  for (const milestone of milestones) {
    if (!Number.isInteger(milestone.wave) || milestone.wave < 0) errors.push(`${milestone.id}: invalid execution wave`);
    if (!MILESTONE_STATES.has(milestone.state)) errors.push(`${milestone.id}: invalid milestone state ${milestone.state}`);
    if (!milestone.nextAction?.trim() || !milestone.exit?.trim()) errors.push(`${milestone.id}: nextAction and exit are required`);
    const checkpoint = milestone.latestCheckpoint;
    if (!checkpoint || typeof checkpoint !== "object") {
      errors.push(`${milestone.id}: latestCheckpoint is required`);
    } else {
      const parsedCheckpointDate = new Date(`${checkpoint.at}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/u.test(checkpoint.at ?? "")
        || Number.isNaN(parsedCheckpointDate.valueOf())
        || parsedCheckpointDate.toISOString().slice(0, 10) !== checkpoint.at) {
        errors.push(`${milestone.id}: latestCheckpoint.at must be a real YYYY-MM-DD date`);
      }
      if (!checkpoint.summary?.trim()) errors.push(`${milestone.id}: latestCheckpoint.summary is required`);
      if (!CHECKPOINT_IMPACTS.has(checkpoint.impact)) errors.push(`${milestone.id}: invalid latestCheckpoint impact ${checkpoint.impact}`);
      if (!Array.isArray(checkpoint.evidence) || checkpoint.evidence.length === 0) {
        errors.push(`${milestone.id}: latestCheckpoint.evidence must be non-empty`);
      } else {
        for (const reference of checkpoint.evidence) {
          const file = typeof reference === "string" ? reference.split("#", 1)[0] : "";
          if (!file || path.isAbsolute(file) || file.split("/").includes("..")) {
            errors.push(`${milestone.id}: invalid checkpoint evidence ${JSON.stringify(reference)}`);
          } else if (context.evidenceExists && !context.evidenceExists(file)) {
            errors.push(`${milestone.id}: checkpoint evidence does not exist: ${file}`);
          }
        }
        for (const reference of duplicates(checkpoint.evidence)) errors.push(`${milestone.id}: duplicate checkpoint evidence ${reference}`);
      }
    }
    for (const capability of milestone.capabilities ?? []) {
      if (!capabilitySet.has(capability)) errors.push(`${milestone.id}: unknown capability ${capability}`);
      executionCoverage.add(capability);
    }
    for (const dependency of milestone.dependsOn ?? []) {
      if (!milestoneSet.has(dependency)) errors.push(`${milestone.id}: unknown dependency ${dependency}`);
      if (dependency === milestone.id) errors.push(`${milestone.id}: milestone cannot depend on itself`);
    }
  }
  for (const capability of capabilityIds) {
    if (!executionCoverage.has(capability)) errors.push(`${capability}: absent from execution plan`);
  }
  const visiting = new Set();
  const visited = new Set();
  const byMilestone = new Map(milestones.map((milestone) => [milestone.id, milestone]));
  function visit(id) {
    if (visiting.has(id)) {
      errors.push(`execution plan contains a dependency cycle at ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byMilestone.get(id)?.dependsOn ?? []) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of milestoneIds) visit(id);
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
  if (!sameSet(new Set(Object.keys(registry.uxItemPrefixes)), new Set(Object.keys(registry.uxItemSources ?? {})))) {
    errors.push("uxItemSources must cover exactly the declared UX item prefixes");
  }
  for (const [prefix, source] of Object.entries(registry.uxItemSources ?? {})) {
    if (!declaredUx.has(source)) errors.push(`${prefix}: unknown UX source ${source}`);
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
    evidenceExists: (relative) => fs.existsSync(path.join(root, relative)),
  });
  if (result.errors.length > 0) {
    console.error(`roadmap-check failed:\n- ${result.errors.join("\n- ")}`);
    process.exitCode = 1;
    return;
  }
  console.log(`roadmap-check: ${registry.capabilities.length} capabilities, ${registry.executionPlan.milestones.length} dependency milestones, ${result.activeProductRfcCount} active product RFCs, ${uxFiles.length} UX dossiers, ${result.uxItemCount} UX items, ${registry.appRoutes.length} app-route obligations, ${registry.apiFamilies.length} API families; R1-R10 green`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
