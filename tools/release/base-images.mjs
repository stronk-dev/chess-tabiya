#!/usr/bin/env node
// rfc/verifiable-runtime-distribution.md §2 platform fixture: every reviewed OCI index digest in
// release/materials.v1.json must resolve to exactly the recorded linux/amd64 and linux/arm64
// manifest digests before a build. Read-only registry access; nothing is pulled or pushed.
//
//   node tools/release/base-images.mjs            verify every recorded image (network)
//   node tools/release/base-images.mjs --print REF print the index/platform digests for a new pin
import { execFileSync } from "node:child_process";

import { readJson, repoPath } from "./lib/common.mjs";

function inspect(reference) {
  const raw = execFileSync("docker", ["buildx", "imagetools", "inspect", "--raw", reference], { encoding: "utf8" });
  const index = JSON.parse(raw);
  const platforms = {};
  for (const manifest of index.manifests ?? []) {
    const platform = manifest.platform ?? {};
    if (platform.os !== "linux" || !["amd64", "arm64"].includes(platform.architecture)) continue;
    if (platform.architecture === "arm64" && platform.variant !== undefined && platform.variant !== "v8") continue;
    platforms[`linux/${platform.architecture}`] ??= manifest.digest;
  }
  return platforms;
}

const args = process.argv.slice(2);
if (args[0] === "--print") {
  const reference = args[1];
  const index = execFileSync("docker", ["buildx", "imagetools", "inspect", reference, "--format", "{{json .Manifest}}"], { encoding: "utf8" });
  console.log(JSON.stringify({ reference, index: JSON.parse(index).digest, platforms: inspect(reference) }, null, 2));
} else {
  const materials = readJson(repoPath("release/materials.v1.json"));
  const failures = [];
  for (const image of materials.baseImages) {
    const platforms = inspect(`${image.repository}@${image.index}`);
    for (const [platform, digest] of Object.entries(image.platforms)) {
      if (platforms[platform] !== digest) failures.push(`${image.id}: ${platform} resolves to ${platforms[platform]} not ${digest}`);
    }
  }
  if (failures.length > 0) {
    console.error(`base-image platform fixture failed:\n- ${failures.join("\n- ")}`);
    process.exit(1);
  }
  console.log(`base-image platform fixture: ${materials.baseImages.length} reviewed indexes resolve to their recorded amd64/arm64 manifests`);
}
