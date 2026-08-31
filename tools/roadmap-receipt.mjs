#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseActiveRecords } from "./status-parity.mjs";

export const SOURCE_PATHS = Object.freeze({
  roadmap: "planning/roadmap-1.0.json",
  workItems: "planning/work-items-1.0.json",
  workState: "planning/work-state.json",
  rfcRegister: "rfc/README.md",
  uxIndex: "planning/ux-implementation-index.md",
  router: "apps/web/src/lib/router.ts",
  application: "apps/server/src/application.ts",
  rest: "apps/server/src/rest.ts",
});

export const RECEIPT_PATH = "planning/roadmap-1.0.receipt.json";

function digest(source) {
  return `sha256:${crypto.createHash("sha256").update(source).digest("hex")}`;
}

function counts(values, vocabulary) {
  return Object.fromEntries(vocabulary.map((value) => [value, values.filter((candidate) => candidate === value).length]));
}

export function buildRoadmapReceipt(sources) {
  const roadmap = JSON.parse(sources.roadmap);
  const workItems = JSON.parse(sources.workItems).items;
  const workState = JSON.parse(sources.workState).items;
  const workItemStates = ["queued", "blocked_owner", "blocked_rfc", "completed", "retired"];
  const ledgerStates = ["untriaged", "todo", "doing", "blocked", "done", "refused"];
  const dimensionStates = ["proven", "partial", "blocked", "broken", "missing", "not_applicable"];
  const routeStates = ["live", "live_but_inadequate", "missing"];
  const apiStates = ["live", "live_direct", "implemented_but_unreachable", "missing"];
  const assignedRfcs = new Set(roadmap.capabilities.flatMap((capability) => capability.rfcs));
  const activeRfcLifecycle = counts(
    parseActiveRecords(sources.rfcRegister)
      .filter((record) => assignedRfcs.has(record.rfc))
      .map((record) => record.status.token),
    ["draft", "accepted", "implementing", "awaiting", "implemented", "superseded", "withdrawn"],
  );

  const capabilities = roadmap.capabilities.map((capability) => {
    const ownedItems = workItems.filter((item) => item.capability === capability.id);
    const routes = roadmap.appRoutes.filter(([, owner]) => owner === capability.id);
    const apiFamilies = roadmap.apiFamilies.filter(([, owner]) => owner === capability.id);
    return {
      id: capability.id,
      name: capability.name,
      release: capability.release,
      owner: capability.owner,
      rfcCount: capability.rfcs.length,
      workItems: counts(ownedItems.map((item) => item.state), workItemStates),
      routes: counts(routes.map(([, , state]) => state), routeStates),
      apiFamilies: counts(apiFamilies.map(([, , state]) => state), apiStates),
      completion: Object.fromEntries(roadmap.definitionOfDone.map((dimension) => [dimension, capability.completion[dimension]])),
    };
  });

  return {
    schemaVersion: roadmap.schemaVersion,
    authority: roadmap.authority,
    sourceDigests: Object.fromEntries(Object.entries(SOURCE_PATHS).map(([name]) => [name, digest(sources[name])])),
    summary: {
      capabilities: roadmap.capabilities.length,
      releaseClasses: counts(roadmap.capabilities.map((capability) => capability.release), ["core", "breadth", "post_1_0"]),
      assignedRfcs: assignedRfcs.size,
      activeRfcLifecycle,
      workState: counts(workState.map((item) => item.state), ledgerStates),
      workItems: counts(workItems.map((item) => item.state), workItemStates),
      dimensionStates: counts(
        roadmap.capabilities.flatMap((capability) => roadmap.definitionOfDone.map((dimension) => capability.completion[dimension][0])),
        dimensionStates,
      ),
      appRoutes: counts(roadmap.appRoutes.map(([, , state]) => state), routeStates),
      apiFamilies: counts(roadmap.apiFamilies.map(([, , state]) => state), apiStates),
    },
    milestones: roadmap.executionPlan.milestones.map((milestone) => ({
      id: milestone.id,
      wave: milestone.wave,
      state: milestone.state,
      capabilities: milestone.capabilities,
      dependsOn: milestone.dependsOn,
      nextAction: milestone.nextAction,
      latestCheckpoint: milestone.latestCheckpoint,
      exit: milestone.exit,
    })),
    capabilities,
  };
}

export function receiptMismatch(actual, expected) {
  if (actual === undefined) return "receipt is missing";
  const actualDigests = actual.sourceDigests ?? {};
  const changed = Object.keys(expected.sourceDigests).filter((name) => actualDigests[name] !== expected.sourceDigests[name]);
  if (changed.length > 0) return `source digest changed: ${changed.join(", ")}`;
  return JSON.stringify(actual) === JSON.stringify(expected) ? undefined : "derived status differs from its sources";
}

export function main(root = process.cwd(), args = process.argv.slice(2)) {
  const sources = Object.fromEntries(Object.entries(SOURCE_PATHS).map(([name, relative]) => [name, fs.readFileSync(path.join(root, relative), "utf8")]));
  const expected = buildRoadmapReceipt(sources);
  const receiptPath = path.join(root, RECEIPT_PATH);
  if (args.includes("--write")) {
    fs.writeFileSync(receiptPath, `${JSON.stringify(expected, null, 2)}\n`);
    console.log(`roadmap-receipt: wrote ${RECEIPT_PATH}`);
    return;
  }
  let actual;
  try {
    actual = JSON.parse(fs.readFileSync(receiptPath, "utf8"));
  } catch {
    // The mismatch below supplies one stable operator-facing error for absent or invalid receipts.
  }
  const mismatch = receiptMismatch(actual, expected);
  if (mismatch !== undefined) {
    console.error(`roadmap-receipt-check failed: ${mismatch}; run make roadmap-receipt`);
    process.exitCode = 1;
    return;
  }
  console.log(`roadmap-receipt-check: ${expected.summary.capabilities} capabilities, ${expected.summary.assignedRfcs} RFC assignments and ${Object.values(expected.summary.workItems).reduce((sum, value) => sum + value, 0)} UX items sealed`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
