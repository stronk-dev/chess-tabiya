#!/usr/bin/env node
// rfc/verifiable-runtime-distribution.md §8 step 1. Generates the pre-image inputs the image build
// embeds (NOTICE.txt, licence texts, build-metadata.json, runtime-content bundle) from committed
// sources. Used identically inside the Dockerfile build stage and outside it, so the post-push
// check can prove the image carries exactly these bytes.
//
//   node tools/release/pre-image.mjs --out DIR --version 1.0.0 --revision <40 hex> [--repository URL]
import { resolve } from "node:path";
import { parseArgs } from "node:util";

import { DEFAULT_REPOSITORY, generatePreImage } from "./lib/pre-image.mjs";

const { values } = parseArgs({
  options: {
    out: { type: "string" },
    version: { type: "string" },
    revision: { type: "string" },
    repository: { type: "string", default: DEFAULT_REPOSITORY },
  },
});
if (values.out === undefined) throw new TypeError("--out is required");
const { summary } = generatePreImage({ out: resolve(values.out), version: values.version, revision: values.revision, repository: values.repository });
console.log(`pre-image inputs: notice ${summary.notice}, build metadata ${summary.buildMetadata}, runtime content ${summary.runtimeContent.digest}`);
