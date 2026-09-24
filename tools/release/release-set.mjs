#!/usr/bin/env node
// rfc/verifiable-runtime-distribution.md §1/§8 — post-image release-set commands.
//
//   compose   --out DIR --server SUBJECT [--maia SUBJECT --maia-manifest-digest D --maia-config-digest D]
//   manifest  --dir DIR --version V --revision SHA --created-at ISO --images FILE
//             --pre-image FILE --source-archive NAME [--receipts FILE] [--repository URL]
//   checksums --dir DIR
//   verify    --dir DIR
//   source-archive --out FILE --version V --revision SHA
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";

import { REPO_ROOT, readJson } from "./lib/common.mjs";
import { DEFAULT_REPOSITORY } from "./lib/pre-image.mjs";
import {
  CHECKSUMS_NAME,
  DEPLOYMENT_FILES,
  RELEASE_MANIFEST_NAME,
  generateReleaseManifest,
  renderChecksums,
  writeReleaseDeployment,
  verifyReleaseSet,
} from "./lib/release-set.mjs";

const [command, ...rest] = process.argv.slice(2);
const { values } = parseArgs({
  args: rest,
  options: {
    out: { type: "string" },
    dir: { type: "string" },
    version: { type: "string" },
    revision: { type: "string" },
    "created-at": { type: "string" },
    repository: { type: "string", default: DEFAULT_REPOSITORY },
    server: { type: "string" },
    maia: { type: "string" },
    "maia-manifest-digest": { type: "string" },
    "maia-config-digest": { type: "string" },
    images: { type: "string" },
    receipts: { type: "string" },
    "pre-image": { type: "string" },
    "source-archive": { type: "string" },
  },
});

function listFiles(dir, base = dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path, base) : [relative(base, path).split("\\").join("/")];
  });
}

switch (command) {
  case "compose": {
    const out = resolve(values.out);
    mkdirSync(out, { recursive: true });
    const maia = values.maia === undefined ? null : { subject: values.maia, manifestDigest: values["maia-manifest-digest"], configDigest: values["maia-config-digest"] };
    writeReleaseDeployment(out, { serverSubject: values.server, maia });
    console.log(`wrote ${DEPLOYMENT_FILES.length} deployment files to ${values.out}`);
    break;
  }
  case "manifest": {
    const dir = resolve(values.dir);
    const preImage = readJson(resolve(values["pre-image"]));
    const text = generateReleaseManifest({
      dir,
      version: values.version,
      sourceRevision: values.revision,
      createdAt: values["created-at"],
      repository: values.repository,
      images: readJson(resolve(values.images)),
      resourceReceipts: values.receipts === undefined ? [] : readJson(resolve(values.receipts)),
      contentBundle: preImage.runtimeContent,
      fossPolicy: { version: 1, digest: preImage.fossPolicy },
      sourceArchive: values["source-archive"],
    });
    writeFileSync(join(dir, RELEASE_MANIFEST_NAME), text);
    console.log(`wrote ${RELEASE_MANIFEST_NAME}`);
    break;
  }
  case "checksums": {
    const dir = resolve(values.dir);
    writeFileSync(join(dir, CHECKSUMS_NAME), renderChecksums(dir, listFiles(dir)));
    console.log(`wrote ${CHECKSUMS_NAME}`);
    break;
  }
  case "verify": {
    const manifest = verifyReleaseSet(resolve(values.dir));
    console.log(`release set verified: ${manifest.release.version} @ ${manifest.release.sourceRevision}; ${manifest.requiredArtifacts.map((item) => item.subject).join(", ")}`);
    break;
  }
  case "source-archive": {
    const out = resolve(values.out);
    const bytes = execFileSync("git", ["archive", "--format=tar.gz", `--prefix=chess-tabiya-${values.version}/`, values.revision], { cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 1024 });
    writeFileSync(out, bytes);
    console.log(`wrote ${relative(process.cwd(), out)} (${bytes.length} bytes)`);
    break;
  }
  default:
    console.error("usage: release-set.mjs compose|manifest|checksums|verify|source-archive …");
    process.exit(64);
}
