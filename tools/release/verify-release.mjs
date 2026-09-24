#!/usr/bin/env node
// Release workflow job `verify-release` and the documented consumer check. From a directory holding
// only the downloaded release set: checksums, manifest schema/joins, then — with cosign and the gh
// CLI — the keyless signature and attestations bound to this repository, workflow and tag. A
// signature from another identity must fail (checked as a negative control). Offline bundles and
// the trusted root are written to --bundles for offline verification.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { verifyReleaseSet } from "./lib/release-set.mjs";

const { values } = parseArgs({ options: { dir: { type: "string" }, repository: { type: "string" }, tag: { type: "string" }, bundles: { type: "string" } } });
const manifest = verifyReleaseSet(values.dir);
const identity = `https://github.com/${values.repository}/.github/workflows/release.yml@refs/tags/${values.tag}`;
const issuer = "https://token.actions.githubusercontent.com";
const run = (command, args) => execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
if (values.bundles !== undefined) mkdirSync(values.bundles, { recursive: true });
for (const artifact of [...manifest.requiredArtifacts, ...manifest.optionalArtifacts]) {
  if (artifact.signatureIdentity !== identity) throw new Error(`${artifact.role}: manifest identity ${artifact.signatureIdentity} is not ${identity}`);
  run("cosign", ["verify", artifact.subject, "--certificate-identity", identity, "--certificate-oidc-issuer", issuer]);
  const foreign = spawnSync("cosign", ["verify", artifact.subject, "--certificate-identity", `https://github.com/example/other/.github/workflows/release.yml@refs/tags/${values.tag}`, "--certificate-oidc-issuer", issuer], { encoding: "utf8" });
  if (foreign.status === 0) throw new Error(`${artifact.role}: a foreign identity verified`);
  run("gh", ["attestation", "verify", `oci://${artifact.subject}`, "--repo", values.repository, "--signer-workflow", `${values.repository}/.github/workflows/release.yml`, "--source-ref", `refs/tags/${values.tag}`]);
  for (const platform of artifact.platformManifests) {
    const reference = `oci://${artifact.subject.split("@")[0]}@${platform.digest}`;
    run("gh", ["attestation", "verify", reference, "--repo", values.repository, "--predicate-type", artifact.sbomPredicate, "--signer-workflow", `${values.repository}/.github/workflows/release.yml`]);
  }
  if (values.bundles !== undefined) execFileSync("gh", ["attestation", "download", `oci://${artifact.subject}`, "--repo", values.repository], { cwd: values.bundles, stdio: "inherit" });
}
for (const file of ["SHA256SUMS", "release-manifest.json", manifest.release.sourceArchive.path, ...manifest.compose.map((item) => item.path), "NOTICE.txt"]) {
  run("gh", ["attestation", "verify", join(values.dir, file), "--repo", values.repository, "--signer-workflow", `${values.repository}/.github/workflows/release.yml`]);
}
if (values.bundles !== undefined) writeFileSync(join(values.bundles, "trusted_root.jsonl"), run("gh", ["attestation", "trusted-root"]));
console.log(`release ${manifest.release.version} verified: checksums, manifest, signatures (identity ${identity}) and attestations`);
