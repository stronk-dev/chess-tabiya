#!/usr/bin/env node
// rfc/verifiable-runtime-distribution.md §1: release/release-manifest.v1.schema.json is the exact
// projection of RELEASE_MANIFEST_SCHEMA in packages/schema/src/release-manifest/index.ts.
//   node tools/release/release-manifest-schema.mjs --check   (default) fail when the projection drifted
//   node tools/release/release-manifest-schema.mjs --write   rewrite the projection
import { readFileSync, writeFileSync } from "node:fs";

import { RELEASE_MANIFEST_SCHEMA } from "../../packages/schema/src/release-manifest/index.ts";
import { repoPath } from "./lib/common.mjs";

export const RELEASE_MANIFEST_SCHEMA_PATH = "release/release-manifest.v1.schema.json";
export const projectedSchema = () => `${JSON.stringify(RELEASE_MANIFEST_SCHEMA, null, 2)}\n`;

if (process.argv[1] && import.meta.filename === process.argv[1]) {
  const path = repoPath(RELEASE_MANIFEST_SCHEMA_PATH);
  if (process.argv.includes("--write")) {
    writeFileSync(path, projectedSchema());
    console.log(`wrote ${RELEASE_MANIFEST_SCHEMA_PATH}`);
  } else if (readFileSync(path, "utf8") !== projectedSchema()) {
    console.error(`${RELEASE_MANIFEST_SCHEMA_PATH} drifted from RELEASE_MANIFEST_SCHEMA; run with --write`);
    process.exit(1);
  } else {
    console.log(`${RELEASE_MANIFEST_SCHEMA_PATH}: exact projection of RELEASE_MANIFEST_SCHEMA`);
  }
}
