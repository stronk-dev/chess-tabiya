#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildRoadmapReceipt, SOURCE_PATHS } from "./roadmap-receipt.mjs";

const total = (record) => Object.values(record).reduce((sum, value) => sum + value, 0);

export function formatRoadmapProgress(receipt) {
  const lines = ["1.0 progress — source-derived checkpoint report", "", "Milestones"];
  for (const milestone of receipt.milestones) {
    lines.push(`- ${milestone.id}: ${milestone.state} — ${milestone.latestCheckpoint.at} ${milestone.latestCheckpoint.impact}: ${milestone.latestCheckpoint.summary}`);
  }
  lines.push(
    "",
    `Capability dimensions (${total(receipt.summary.dimensionStates)}): ${Object.entries(receipt.summary.dimensionStates).map(([state, count]) => `${state}=${count}`).join(", ")}`,
    `Active RFCs (${total(receipt.summary.activeRfcLifecycle)}): ${Object.entries(receipt.summary.activeRfcLifecycle).map(([state, count]) => `${state}=${count}`).join(", ")}`,
    `Ledger execution (${total(receipt.summary.workState)}): ${Object.entries(receipt.summary.workState).map(([state, count]) => `${state}=${count}`).join(", ")}`,
    `Persistent UX work (${total(receipt.summary.workItems)}): ${Object.entries(receipt.summary.workItems).map(([state, count]) => `${state}=${count}`).join(", ")}`,
    "",
    "Milestone and dimension states are strict 1.0 release gates. Latest checkpoints report incremental delivery and never promote a gate by implication.",
  );
  return `${lines.join("\n")}\n`;
}

export function main(root = process.cwd()) {
  const sources = Object.fromEntries(Object.entries(SOURCE_PATHS).map(([name, relative]) => [name, fs.readFileSync(path.join(root, relative), "utf8")]));
  process.stdout.write(formatRoadmapProgress(buildRoadmapReceipt(sources)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
