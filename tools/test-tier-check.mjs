#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CONTENT_CONTRACT_TESTS, PERFORMANCE_CONTRACT_TESTS } from "./test-tiers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_PATH = /content\/(?:drafts|packs|candidates)\//u;
const PERFORMANCE_FILE = /-performance\.test\.ts$/u;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return entry.name.endsWith(".test.ts") ? [absolute] : [];
  });
}
export function validateTestTiers(root = ROOT) {
  const errors = [];
  const declared = new Set(CONTENT_CONTRACT_TESTS);
  const performance = new Set(PERFORMANCE_CONTRACT_TESTS);
  for (const relative of declared) {
    if (!fs.existsSync(path.join(root, relative))) errors.push(`declared content test does not exist: ${relative}`);
  }
  for (const relative of PERFORMANCE_CONTRACT_TESTS) {
    if (!fs.existsSync(path.join(root, relative))) errors.push(`declared performance test does not exist: ${relative}`);
    if (declared.has(relative)) errors.push(`test cannot belong to content and performance tiers: ${relative}`);
  }
  for (const tier of ["apps", "packages"]) {
    for (const absolute of walk(path.join(root, tier))) {
      const relative = path.relative(root, absolute);
      const source = fs.readFileSync(absolute, "utf8");
      if (CONTENT_PATH.test(source) && !declared.has(relative)) {
        errors.push(`real-content test is not assigned to the content tier: ${relative}`);
      }
      if (PERFORMANCE_FILE.test(relative) && !performance.has(relative)) {
        errors.push(`performance test is not assigned to the performance tier: ${relative}`);
      }
    }
  }
  return errors;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const errors = validateTestTiers();
  if (errors.length > 0) {
    console.error(`test-tier-check failed:\n- ${errors.join("\n- ")}`);
    process.exitCode = 1;
  } else {
    console.log(`test-tier-check: ${CONTENT_CONTRACT_TESTS.length} real-content and ${PERFORMANCE_CONTRACT_TESTS.length} performance test files are isolated from generic software contracts`);
  }
}
