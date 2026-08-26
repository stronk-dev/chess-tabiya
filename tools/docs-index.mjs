#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REQUIRED_ROOT_LINKS = Object.freeze([
  "CONTRIBUTING.md",
  "docs/README.md",
  "docs/architecture.md",
  "docs/extending.md",
  "docs/features.md",
]);

export function markdownTargets(source) {
  const targets = [];
  for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
    const withoutAnchor = match[1].split("#", 1)[0];
    if (withoutAnchor !== "") targets.push(withoutAnchor);
  }
  return targets;
}

export function validateDocsIndex({ docFiles, index, rootReadme }) {
  const errors = [];
  const indexed = markdownTargets(index)
    .filter((target) => !target.startsWith("../"))
    .filter((target) => target.endsWith(".md"));
  const counts = new Map();
  for (const target of indexed) counts.set(target, (counts.get(target) ?? 0) + 1);

  for (const file of docFiles) {
    const count = counts.get(file) ?? 0;
    if (count === 0) errors.push(`docs/README.md does not index docs/${file}`);
    if (count > 1) errors.push(`docs/README.md indexes docs/${file} ${count} times`);
  }
  for (const target of counts.keys()) {
    if (!docFiles.includes(target)) errors.push(`docs/README.md links unknown direct document docs/${target}`);
  }

  const rootTargets = new Set(markdownTargets(rootReadme));
  for (const required of REQUIRED_ROOT_LINKS) {
    if (!rootTargets.has(required)) errors.push(`README.md does not link ${required}`);
  }
  return errors;
}

export function validateRepository(root = ROOT) {
  const docsDirectory = path.join(root, "docs");
  const docFiles = fs.readdirSync(docsDirectory)
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .sort();
  return {
    docFiles,
    errors: validateDocsIndex({
      docFiles,
      index: fs.readFileSync(path.join(docsDirectory, "README.md"), "utf8"),
      rootReadme: fs.readFileSync(path.join(root, "README.md"), "utf8"),
    }),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const result = validateRepository();
  if (result.errors.length > 0) {
    console.error(`docs-index failed:\n- ${result.errors.join("\n- ")}`);
    process.exitCode = 1;
  } else {
    console.log(`docs-index: ${result.docFiles.length} implemented documents indexed; contributor entry points linked`);
  }
}
