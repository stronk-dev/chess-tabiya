#!/usr/bin/env node
// rfc/verifiable-runtime-distribution.md §6 — workers/maia/NOTICE.txt is generated before the Maia
// image build from the pinned lock, materials and curated licence record, then embedded verbatim.
//   node tools/release/maia-notice.mjs --check   (default) fail when the committed notice drifted
//   node tools/release/maia-notice.mjs --write
import { readFileSync, writeFileSync } from "node:fs";

import { repoPath } from "./lib/common.mjs";
import { renderMaiaNotice } from "./lib/maia.mjs";

const path = repoPath("workers/maia/NOTICE.txt");
if (process.argv.includes("--write")) {
  writeFileSync(path, renderMaiaNotice());
  console.log("wrote workers/maia/NOTICE.txt");
} else if (readFileSync(path, "utf8") !== renderMaiaNotice()) {
  console.error("workers/maia/NOTICE.txt drifted from its inputs; run node tools/release/maia-notice.mjs --write");
  process.exit(1);
} else {
  console.log("workers/maia/NOTICE.txt matches the pinned Maia inputs");
}
