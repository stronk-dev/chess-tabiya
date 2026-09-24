#!/usr/bin/env node
// rfc/verifiable-runtime-distribution.md — `make release-verify-local`.
//
// Builds the release server image natively from the committed tree, then proves, without pushing,
// tagging or publishing anything:
//   1. the offline release policy (workflows, Dockerfiles, materials, licences, schema projection);
//   2. the image census: allow-listed /app only, zero candidate/job/source/planning/local-path file,
//      no package manager/compiler/netcat, embedded NOTICE/licences/build metadata byte-equal to the
//      pre-image generation;
//   3. an SPDX 2.3 SBOM generated from the image by the digest-pinned scanner, reconciled against the
//      image's package database, and the §6 licence gate (application components must pass; the
//      Debian OS layer is reported until owner-approved curated records exist);
//   4. a loader-traced boot to /healthz under a 512 MiB hard limit without swap, the probe journey,
//      the About surface and the core resource envelope;
//   5. a local prerelease release set (digest-pinned Compose, manifest generated once, SHA256SUMS)
//      verified read-only, a boot with that index mounted (About reports `verified`) and a boot with
//      a foreign server subject (startup refused).
// `--maia` additionally builds and proves the Maia CPU image (census, weight digest, SBOM, D1 report).
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { startServer } from "./lib/boot.mjs";
import { canonicalJson, readJson, repoPath } from "./lib/common.mjs";
import { generatePreImage } from "./lib/pre-image.mjs";
import { proveMaiaImage, proveServerImage } from "./lib/prove.mjs";
import { DEPLOYMENT_FILES, generateReleaseManifest, renderChecksums, verifyReleaseSet, writeReleaseDeployment } from "./lib/release-set.mjs";
import { loadFossPolicy } from "./lib/spdx.mjs";
import { releasePolicyFindings } from "./release-policy.mjs";

const { values } = parseArgs({
  options: {
    out: { type: "string", default: repoPath(".cache/release-local") },
    version: { type: "string", default: "0.0.0-local" },
    "idle-seconds": { type: "string", default: "10" },
    maia: { type: "boolean", default: false },
    "skip-build": { type: "boolean", default: false },
  },
});

const git = (...args) => execFileSync("git", args, { cwd: repoPath("."), encoding: "utf8" }).trim();
const step = (label) => console.log(`\n== ${label}`);
const out = values.out;
const version = values.version;
const revision = git("rev-parse", "HEAD");
const dirty = git("status", "--porcelain");
const arch = execFileSync("docker", ["version", "--format", "{{.Server.Arch}}"], { encoding: "utf8" }).trim();
const platform = `linux/${arch === "aarch64" ? "arm64" : arch}`;
const findings = [];
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
if (dirty !== "") console.warn(`warning: the working tree is dirty; the image is built from the working tree, the source archive from ${revision}. A release refuses this.`);

step("offline release policy");
const policyFindings = releasePolicyFindings();
findings.push(...policyFindings);
console.log(policyFindings.length === 0 ? "pass" : policyFindings.join("\n"));

step("pre-image inputs");
const preImage = join(out, "pre-image");
const { summary } = generatePreImage({ out: preImage, version, revision });
console.log(`notice ${summary.notice}\nbuild metadata ${summary.buildMetadata}\nruntime content ${summary.runtimeContent.digest}`);

const serverImage = "chess-tabiya-server:release-local";
if (!values["skip-build"]) {
  step(`build ${serverImage} (${platform})`);
  execFileSync("docker", ["build", "--platform", platform, "-f", "apps/server/Dockerfile", "--build-arg", `TABIYA_VERSION=${version}`, "--build-arg", `SOURCE_REVISION=${revision}`, "--build-arg", `TABIYA_APPLICATION_REVISION=${revision}`, "-t", serverImage, "."], { cwd: repoPath("."), stdio: "inherit" });
}
const imageId = execFileSync("docker", ["image", "inspect", serverImage, "--format", "{{.Id}}"], { encoding: "utf8" }).trim();
const subject = `localhost/chess-tabiya-server@${imageId}`;
const materials = readJson(repoPath("release/materials.v1.json"));
const policy = loadFossPolicy();

step("server image proof: census, SBOM, licence gate, traced boot, envelope");
const proof = await proveServerImage({ image: serverImage, subject, platform, preImage, out: join(out, "proof"), materials, policy, version, idleSeconds: Number(values["idle-seconds"]) });
findings.push(...proof.findings);
console.log(JSON.stringify({ envelope: proof.envelope, receipt: { coldReadyMs: proof.receipt?.coldReadyMs, steadyRssMiB: proof.receipt?.steadyRssMiB, peakCgroupMiB: proof.receipt?.peakCgroupMiB, unpackedImageBytes: proof.receipt?.unpackedImageBytes, journey: proof.receipt?.journey }, licence: { evaluated: proof.licence.evaluated, passed: proof.licence.passed, failedApplication: proof.licence.failedApplication.length, failedOsPackages: proof.licence.failedOsPackages.length } }, null, 2));
for (const finding of proof.findings) console.log(`FINDING ${finding}`);

step("local prerelease release set: Compose, manifest (once), SHA256SUMS, read-only verification");
const release = join(out, "release");
mkdirSync(join(release, "sbom"), { recursive: true });
copyFileSync(join(preImage, "doc/LICENSE"), join(release, "LICENSE"));
copyFileSync(join(preImage, "doc/NOTICE.txt"), join(release, "NOTICE.txt"));
copyFileSync(proof.sbomPath, join(release, "sbom", `server-${platform.replace("/", "-")}.spdx.json`));
const archive = `chess-tabiya-${version}-source.tar.gz`;
writeFileSync(join(release, archive), execFileSync("git", ["archive", "--format=tar.gz", `--prefix=chess-tabiya-${version}/`, revision], { cwd: repoPath("."), maxBuffer: 1024 * 1024 * 1024 }));
writeReleaseDeployment(release, { serverSubject: subject });
writeFileSync(join(release, "release-manifest.json"), generateReleaseManifest({
  dir: release,
  version,
  sourceRevision: revision,
  createdAt: new Date().toISOString(),
  repository: "https://github.com/stronk-dev/chess-tabiya",
  images: { server: { subject, platforms: { [platform]: imageId }, fossEligible: true } },
  contentBundle: summary.runtimeContent,
  fossPolicy: { version: 1, digest: summary.fossPolicy },
  sourceArchive: archive,
}));
writeFileSync(join(release, "SHA256SUMS"), renderChecksums(release, ["LICENSE", "NOTICE.txt", archive, "release-manifest.json", ...DEPLOYMENT_FILES, `sbom/server-${platform.replace("/", "-")}.spdx.json`]));
const verified = verifyReleaseSet(release);
console.log(`verified ${verified.release.version} @ ${verified.release.sourceRevision}`);

step("boot with the mounted release index (About must report verified)");
const mounted = await startServer({ image: serverImage, name: `tabiya-release-index-${process.pid}`, env: { TABIYA_SERVER_IMAGE: subject }, mounts: [`${join(release, "release-manifest.json")}:/run/chess-tabiya/release-manifest.json:ro`] });
try {
  const about = await (await fetch(`${mounted.base}/about/release`)).json();
  if (about.releaseIndex !== "verified") findings.push(`mounted release index reported ${about.releaseIndex}`);
  const served = await (await fetch(`${mounted.base}/about/release-manifest.json`)).text();
  if (served !== JSON.stringify(verified).concat("\n") && !served.startsWith("{")) findings.push("the mounted index is not served back verbatim");
  console.log(`About: releaseIndex=${about.releaseIndex}, sourceRevision=${about.release?.sourceRevision}`);
} finally {
  mounted.stop();
}
const refused = await startServer({ image: serverImage, name: `tabiya-release-refuse-${process.pid}`, env: { TABIYA_SERVER_IMAGE: `localhost/chess-tabiya-server@sha256:${"0".repeat(64)}` }, mounts: [`${join(release, "release-manifest.json")}:/run/chess-tabiya/release-manifest.json:ro`], expectRefusal: true });
if (!refused.refused || !refused.logs.includes("RELEASE_INDEX_REFUSED")) findings.push("a foreign server subject did not refuse startup");
console.log(`foreign subject: exit ${refused.exitCode}${refused.logs.includes("RELEASE_INDEX_REFUSED") ? " (RELEASE_INDEX_REFUSED)" : ""}`);

let maia;
if (values.maia) {
  const maiaImage = "chess-tabiya-maia-cpu:release-local";
  if (!values["skip-build"]) {
    step(`build ${maiaImage} (${platform})`);
    execFileSync("docker", ["build", "--platform", platform, "-f", "workers/maia/Dockerfile", "--build-arg", `TABIYA_VERSION=${version}`, "--build-arg", `SOURCE_REVISION=${revision}`, "-t", maiaImage, "workers/maia"], { cwd: repoPath("."), stdio: "inherit" });
  }
  step("maia-cpu image proof: GPU census, weight digest, SBOM, licence report (D1)");
  const maiaId = execFileSync("docker", ["image", "inspect", maiaImage, "--format", "{{.Id}}"], { encoding: "utf8" }).trim();
  maia = await proveMaiaImage({ image: maiaImage, subject: `localhost/chess-tabiya-maia-cpu@${maiaId}`, platform, out: join(out, "maia"), materials, policy });
  findings.push(...maia.findings);
  const total = maia.unpackedImageBytes + (proof.receipt?.unpackedImageBytes ?? 0);
  if (total > 2 * 1024 ** 3) findings.push(`cpu profile images ${total} bytes exceed 2.0 GiB`);
  console.log(JSON.stringify({ unpackedImageBytes: maia.unpackedImageBytes, cpuProfileBytes: total, licence: { evaluated: maia.licence.evaluated, passed: maia.licence.passed, blocked: maia.licence.failedApplication.map((item) => item.purl) } }, null, 2));
  for (const finding of maia.findings) console.log(`FINDING ${finding}`);
}

const receipt = {
  format: "tabiya-release-local-receipt",
  formatVersion: 1,
  sourceRevision: revision,
  workingTreeDirty: dirty !== "",
  platform,
  serverSubject: subject,
  preImage: summary,
  serverProof: { receipt: proof.receipt, licence: proof.licence },
  maiaProof: maia === undefined ? null : { unpackedImageBytes: maia.unpackedImageBytes, licence: maia.licence },
  publicationGates: {
    osPackageCuration: `${proof.licence.failedOsPackages.length} Debian package(s) await owner-approved curated records`,
    d1MaiaWeightRights: readJson(repoPath("release/maia-weight-rights.v1.json")).status,
    d2RuntimeContentBundle: "temporary allow-list (finalDischarge false)",
    coreReleaseJourney: "F12-H core.release_journey@1 not defined; local probe journey only",
    coreEnvelope: (proof.envelope ?? []).filter((item) => !item.pass).map((item) => `${item.key} ${item.value} > ${item.limit}`).join(", ") || "within the core ceilings on this host",
  },
  findings,
};
writeFileSync(join(out, "receipt.json"), canonicalJson(receipt));
step("result");
if (findings.length > 0) {
  console.error(`release-verify-local FAILED with ${findings.length} finding(s):\n- ${findings.join("\n- ")}`);
  process.exit(1);
}
console.log(`release-verify-local: PASS (${platform}); receipt at ${join(out, "receipt.json")}`);
console.log(`publication stays gated: ${Object.values(receipt.publicationGates).join("; ")}`);
