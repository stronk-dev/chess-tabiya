#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import { assertKnownPlan, buildGraduationPlan } from "./graduation-clearance-plan.mjs";
import { canonicalizeJson } from "../packages/schema/src/drill-pack/digest.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const serverRequire = createRequire(resolve(ROOT, "apps/server/package.json"));
const Ajv2020 = serverRequire("ajv/dist/2020").default;
const addFormats = serverRequire("ajv-formats").default;
const STAGE_C = Object.freeze({
  "content/drafts/immediate-guard.browser.json": 463,
  "content/drafts/outcome-hold.browser.json": 464,
  "content/drafts/outcome-resist.browser.json": 465,
  "content/drafts/stated-reasoning.browser.json": 466,
  "content/drafts/trajectory-legs.browser.json": 467,
});

function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }
function digest(value) { return `sha256:${createHash("sha256").update(canonicalizeJson(value)).digest("hex")}`; }

function setPath(target, path, value) {
  const tokens = path.split(".");
  let cursor = target;
  for (const token of tokens.slice(0, -1)) {
    if (cursor[token] === undefined) cursor[token] = {};
    cursor = cursor[token];
  }
  cursor[tokens.at(-1)] = structuredClone(value);
}

function migrate() {
  const plan = assertKnownPlan(buildGraduationPlan());
  if (plan.migration.statuses.ready !== plan.migration.entries || plan.migration.statuses.requires_author !== 0 || plan.migration.statuses.blocked_contract !== 0) {
    throw new Error(`migration plan is not total: ${JSON.stringify(plan.migration.statuses)}`);
  }
  const documents = new Map();
  for (const row of plan.migration.rows) {
    if (!documents.has(row.file)) documents.set(row.file, readJson(resolve(ROOT, row.file)));
    const document = documents.get(row.file);
    const index = Number(row.key.match(/\/graduationBlockers\/(\d+)$/u)?.[1]);
    const entry = document.provenance.graduationBlockers[index];
    if (entry?.id !== row.entryId || entry?.state !== row.currentState) throw new Error(`migration identity drifted: ${row.key}`);
    delete entry.clearedBy;
    if (entry.state === "blocking") delete entry.clearance;
    if (entry.state === "resolved") delete entry.resolved.clearance;
    for (const [path, field] of Object.entries(row.fields)) {
      if (field.status !== "derived" && field.status !== "author_decision") throw new Error(`unresolved field ${row.key}:${path}`);
      setPath(entry, path, field.value);
    }
  }

  for (const [file, line] of Object.entries(STAGE_C)) {
    const document = documents.get(file);
    if (document === undefined) throw new Error(`Stage C document is absent: ${file}`);
    const entries = document.provenance.graduationBlockers;
    if (entries.length !== 1) throw new Error(`Stage C population changed: ${file}`);
    if (entries[0].state === "accepted" && entries[0].accepted?.kind === "out_of_scope") continue;
    if (entries[0].state !== "blocking") throw new Error(`Stage C population changed: ${file}`);
    const source = entries[0];
    document.provenance.graduationBlockers = [{
      id: source.id,
      state: "accepted",
      statement: source.statement,
      accepted: {
        kind: "out_of_scope",
        ruling: "The graduation-clearance owner ruling classifies this browser-only mechanical fixture as outside publishable chess content.",
        rulingRef: `rfc/graduation-clearance.md#L${line}`,
        unreachableBecause: source.statement,
      },
    }];
  }

  for (const document of documents.values()) {
    for (const entry of document.provenance.graduationBlockers) {
      if (entry.state !== "accepted") continue;
      if (typeof entry.accepted.unreachableBecause !== "string") entry.accepted.unreachableBecause = entry.accepted.ruling;
      if (entry.accepted.kind === "permanent_property" && !entry.accepted.rulingRef.includes("#L")) {
        entry.accepted.rulingRef = entry.accepted.ruling.includes("provider is configured")
          ? "docs/tablebase-grounding.md#L75"
          : "docs/tablebase-grounding.md#L89";
      }
    }
  }

  const schema = readJson(resolve(ROOT, "schemas/drill_pack.schema.json"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  for (const [file, document] of documents) {
    if (!validate(document)) throw new Error(`${file} does not validate after migration: ${ajv.errorsText(validate.errors, { separator: "; " })}`);
  }

  const writes = [];
  for (const [file, document] of documents) {
    const absolute = resolve(ROOT, file);
    writes.push({ path: absolute, value: document, pretty: true });
    const evidence = file.includes("/candidates/") ? resolve(dirname(absolute), "evidence.json") : absolute.replace(/\.json$/u, ".evidence.json");
    if (existsSync(evidence)) {
      const ledger = readJson(evidence);
      ledger.packDigest = digest(document);
      writes.push({ path: evidence, value: ledger, pretty: false });
    }
  }

  const originals = new Map(writes.map(({ path }) => [path, readFileSync(path, "utf8")]));
  const temporary = writes.map(({ path }) => `${path}.migration-${process.pid}`);
  try {
    for (const [index, write] of writes.entries()) {
      writeFileSync(temporary[index], write.pretty ? `${JSON.stringify(write.value, null, 2)}\n` : `${canonicalizeJson(write.value)}\n`, "utf8");
    }
    for (const [index, write] of writes.entries()) renameSync(temporary[index], write.path);
  } catch (error) {
    for (const [path, bytes] of originals) writeFileSync(path, bytes, "utf8");
    throw error;
  } finally {
    for (const path of temporary) rmSync(path, { force: true });
  }
  process.stdout.write(`migrated ${documents.size} pack documents and re-stamped ${writes.length - documents.size} evidence ledgers\n`);
}

migrate();
