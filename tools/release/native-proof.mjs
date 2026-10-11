#!/usr/bin/env node
// Release workflow job `native-proof` (CI only): runs on the native runner for one platform, pulls
// every image BY PLATFORM DIGEST from the registry and runs the same proof as
// `make release-verify-local`, with the licence gate and resource envelope enforced. QEMU is never
// used: the runner architecture must equal the platform.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

import { storageDrill } from "../appliance-drill.mjs";
import { canonicalJson, readJson, repoPath } from "./lib/common.mjs";
import { proveMaiaImage, proveServerImage } from "./lib/prove.mjs";
import { loadFossPolicy } from "./lib/spdx.mjs";

export async function nativeProof(args, {
  run = execFileSync,
  serverProof = proveServerImage,
  maiaProof = proveMaiaImage,
  recoveryProof = storageDrill,
} = {}) {
  const { values } = parseArgs({ args, options: { images: { type: "string" }, platform: { type: "string" }, "pre-image": { type: "string" }, out: { type: "string" }, "idle-seconds": { type: "string", default: "300" }, "licence-gate": { type: "string", default: "enforce" } } });
  const arch = run("uname", ["-m"], { encoding: "utf8" }).trim();
  const native = { x86_64: "linux/amd64", aarch64: "linux/arm64" }[arch];
  if (native !== values.platform) throw new Error(`native proof for ${values.platform} must run on that architecture (runner is ${arch}); emulation cannot produce the receipt`);
  const images = JSON.parse(values.images);
  const materials = readJson(repoPath("release/materials.v1.json"));
  const policy = loadFossPolicy();
  const pre = readJson(join(values["pre-image"], "pre-image.json"));
  const suffix = values.platform.replace("/", "-");
  const proofPath = join(values.out, `proof-${suffix}.json`);
  mkdirSync(join(values.out, "sbom"), { recursive: true });
  // A failed rerun must not leave an earlier success at this generated output path.
  rmSync(proofPath, { force: true });
  const findings = [];
  const pull = (role) => {
    const reference = `${images[role].subject.split("@")[0]}@${images[role].platforms[values.platform]}`;
    run("docker", ["pull", reference], { stdio: "inherit" });
    return reference;
  };
  const serverImage = pull("server");
  const server = await serverProof({ image: serverImage, subject: images.server.subject, platform: values.platform, preImage: values["pre-image"], out: join(values.out, "server"), materials, policy, version: pre.version, idleSeconds: Number(values["idle-seconds"]), licenceGateMode: values["licence-gate"], enforceEnvelope: true });
  findings.push(...server.findings);
  copyFileSync(server.sbomPath, join(values.out, "sbom", `server-${suffix}.spdx.json`));
  if (images["maia-cpu"] !== undefined) {
    const maia = await maiaProof({ image: pull("maia-cpu"), subject: images["maia-cpu"].subject, platform: values.platform, out: join(values.out, "maia"), materials, policy, licenceGateMode: values["licence-gate"] });
    findings.push(...maia.findings);
    copyFileSync(maia.sbomPath, join(values.out, "sbom", `maia-cpu-${suffix}.spdx.json`));
  }
  if (findings.length > 0) {
    writeFileSync(proofPath, canonicalJson({ platform: values.platform, runner: arch, server: server.receipt, findings }));
    throw new Error(`native proof failed on ${values.platform}:\n- ${findings.join("\n- ")}`);
  }
  // D3725 / storage-backup-recovery criteria 10/11/13: use this SAME pulled
  // platform-digest image, not a substitute development build. Failure propagates.
  await recoveryProof({ image: serverImage });
  writeFileSync(proofPath, canonicalJson({ platform: values.platform, runner: arch, server: server.receipt, findings }));
  console.log(`native proof passed on ${values.platform}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await nativeProof(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
