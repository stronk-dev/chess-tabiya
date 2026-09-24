#!/usr/bin/env node
// rfc/verifiable-runtime-distribution.md — the offline release-policy gate (no Docker, no network).
// Runs every committed-input check the release workflow and `make release-verify-local` rely on:
// workflow pins/permissions, Dockerfile pins, material digests, workspace licences, the Maia locks
// and notice, the manifest-schema projection, and a pre-image generation dry run whose licence
// gate must pass for every application component.
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { workflowFindings } from "./action-policy.mjs";
import { readJson, repoPath } from "./lib/common.mjs";
import { dockerfileFindings } from "./lib/dockerfile-policy.mjs";
import { workspaceLicenceFindings } from "./lib/js-inventory.mjs";
import { maiaInputFindings, renderMaiaNotice } from "./lib/maia.mjs";
import { generatePreImage } from "./lib/pre-image.mjs";
import { projectedSchema, RELEASE_MANIFEST_SCHEMA_PATH } from "./release-manifest-schema.mjs";

export const RELEASE_DOCKERFILES = Object.freeze(["apps/server/Dockerfile", "workers/maia/Dockerfile"]);

/** Every URL in the materials record must carry a SHA-256; a mutable download is refused. */
export function materialFindings(materials) {
  const findings = [];
  const visit = (value, path) => {
    if (Array.isArray(value)) return value.forEach((item, index) => visit(item, `${path}[${index}]`));
    if (value === null || typeof value !== "object") return;
    if (typeof value.url === "string" && !/^sha256:[0-9a-f]{64}$/u.test(value.sha256 ?? "")) findings.push(`materials ${path}: ${value.url} has no SHA-256`);
    for (const [key, child] of Object.entries(value)) visit(child, `${path}.${key}`);
  };
  visit(materials, "");
  for (const image of materials.baseImages) {
    for (const platform of ["linux/amd64", "linux/arm64"]) {
      if (!/^sha256:[0-9a-f]{64}$/u.test(image.platforms?.[platform] ?? "")) findings.push(`materials base image ${image.id} lacks a reviewed ${platform} manifest digest`);
    }
  }
  return findings;
}

export function releasePolicyFindings() {
  const materials = readJson(repoPath("release/materials.v1.json"));
  const findings = [
    ...workflowFindings(),
    ...RELEASE_DOCKERFILES.flatMap((file) => dockerfileFindings(readFileSync(repoPath(file), "utf8"), materials, file)),
    ...materialFindings(materials),
    ...workspaceLicenceFindings(),
    ...maiaInputFindings(),
  ];
  if (readFileSync(repoPath("workers/maia/NOTICE.txt"), "utf8") !== renderMaiaNotice()) findings.push("workers/maia/NOTICE.txt drifted; run node tools/release/maia-notice.mjs --write");
  if (readFileSync(repoPath(RELEASE_MANIFEST_SCHEMA_PATH), "utf8") !== projectedSchema()) findings.push(`${RELEASE_MANIFEST_SCHEMA_PATH} drifted; run node tools/release/release-manifest-schema.mjs --write`);
  const out = mkdtempSync(join(tmpdir(), "tabiya-pre-image-"));
  try {
    generatePreImage({ out, version: "0.0.0-policy", revision: "0".repeat(40) });
  } catch (error) {
    findings.push(error.message);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
  return findings;
}

if (process.argv[1] && import.meta.filename === process.argv[1]) {
  const findings = releasePolicyFindings();
  if (findings.length > 0) {
    console.error(`release policy failed:\n- ${findings.join("\n- ")}`);
    process.exit(1);
  }
  console.log("release policy: workflows, Dockerfiles, materials, workspace licences, Maia inputs, schema projection and pre-image licence gate pass");
}
