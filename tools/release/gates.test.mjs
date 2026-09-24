// rfc/verifiable-runtime-distribution.md §3 eligibility, D1, §6 SBOM reconciliation and §7 loader
// trace classification — the logic the Docker/CI proofs run, exercised without Docker.
import assert from "node:assert/strict";
import { test } from "node:test";

import { classifyTrace } from "./lib/boot.mjs";
import { parseReleaseTag, rightsGate, tagEligibility } from "./lib/eligibility.mjs";
import { maiaWeightResolved } from "./lib/maia.mjs";
import { architectureDrift, augmentSbom, licenceGate, reconcileSbom, sameLicence } from "./lib/sbom.mjs";
import { loadFossPolicy } from "./lib/spdx.mjs";

const SHA = "a".repeat(40);

test("§3: only v<semver> tags on a green main commit are eligible", async () => {
  assert.deepEqual(parseReleaseTag("v1.0.0"), { version: "1.0.0", prerelease: false });
  assert.deepEqual(parseReleaseTag("v0.9.0-preview.1"), { version: "0.9.0-preview.1", prerelease: true });
  assert.throws(() => parseReleaseTag("release-1"), /semver/u);
  const green = { workflow_runs: [{ head_sha: SHA, status: "completed", conclusion: "success" }] };
  assert.deepEqual(await tagEligibility({ sha: SHA, repository: "o/r", api: async () => green, onMain: async () => true }), []);
  assert.equal((await tagEligibility({ sha: SHA, repository: "o/r", api: async () => green, onMain: async () => false })).length, 1);
  const red = { workflow_runs: [{ head_sha: SHA, status: "completed", conclusion: "failure" }] };
  assert.equal((await tagEligibility({ sha: SHA, repository: "o/r", api: async () => red, onMain: async () => true })).length, 2);
});

test("criterion 6 / D1: publication of a 1.0-class release fails while the weight licence is unresolved", () => {
  assert.equal(maiaWeightResolved(), false);
  assert.throws(() => rightsGate({ prerelease: false, weightResolved: false }), /D1 unresolved/u);
  assert.deepEqual(rightsGate({ prerelease: true, weightResolved: false }), { maia: false });
  assert.deepEqual(rightsGate({ prerelease: false, weightResolved: true }), { maia: true });
});

const manifest = {
  files: [
    { path: "content/drafts/a.json", family: "pack" },
    { path: "content/drafts/a.evidence.json", family: "pack-sidecar" },
    { path: "content/shapes/s.json", family: "shape" },
  ],
};

test("criterion 9: the loader trace accepts allow-listed reads and sidecar probes, and flags anything else", () => {
  const trace = [
    "promises.readdir\t/app/content/drafts/",
    "promises.readFile\t/app/content/drafts/a.json",
    "promises.readFile\t/app/content/drafts/a.evidence.json",
    "promises.readFile\t/app/content/drafts/a.sources.json",
    "promises.readFile\t/app/content/shapes/s.json",
    "readFileSync\t/app/apps/server/dist/main.js",
    "readFileSync\t/etc/hosts",
  ].join("\n");
  assert.deepEqual(classifyTrace(trace, manifest), { violations: [], unexercisedFamilies: [], reads: 3 });
  const leaked = `${trace}\npromises.readFile\t/app/content/drafts/a.job.json\nreadFileSync\t/app/planning/exploration/log.md`;
  assert.deepEqual(classifyTrace(leaked, manifest).violations, ["/app/content/drafts/a.job.json", "/app/planning/exploration/log.md"]);
  assert.deepEqual(classifyTrace("promises.readFile\t/app/content/drafts/a.json", manifest).unexercisedFamilies, ["pack-sidecar", "shape"]);
});

const syftDocument = (packages) => ({
  spdxVersion: "SPDX-2.3",
  name: "/work/image.tar",
  documentNamespace: "https://anchore.com/syft/image/x",
  creationInfo: { creators: ["Tool: syft-1.33.0"] },
  packages: [{ SPDXID: "SPDXRef-DOCUMENT" }, ...packages],
  relationships: [{ spdxElementId: "SPDXRef-DOCUMENT", relationshipType: "DESCRIBES", relatedSpdxElement: "SPDXRef-image" }],
});
const deb = (name, version, licence = "MIT") => ({ SPDXID: `SPDXRef-${name}`, name, versionInfo: version, licenseDeclared: licence, externalRefs: [{ referenceType: "purl", referenceLocator: `pkg:deb/debian/${name}@${version}` }] });

test("criterion 7: the SBOM is set-equal to the installed packages; source-tree or extra packages fail", () => {
  const dpkg = [{ name: "libc6", version: "2.36" }, { name: "zlib1g", version: "1.2.13" }];
  const { sbom } = augmentSbom(syftDocument([deb("libc6", "2.36"), deb("zlib1g", "1.2.13")]), { role: "server", platform: "linux/arm64", subject: "ghcr.io/o/r@sha256:1", declared: [{ name: "chess-tabiya", version: "1.0.0", purl: "pkg:github/o/r@1", licence: "AGPL-3.0-only" }] });
  assert.deepEqual(reconcileSbom(sbom, { dpkg }), []);
  assert.equal(JSON.stringify(sbom).includes("/work/"), false, "scanner-local paths are scrubbed");
  const extraInImage = [...dpkg, { name: "curl", version: "7.88" }];
  assert.match(reconcileSbom(sbom, { dpkg: extraInImage }).join("\n"), /installed package absent from the SBOM: curl@7.88/u);
  const { sbom: withNpm } = augmentSbom(syftDocument([deb("libc6", "2.36"), deb("zlib1g", "1.2.13"), { SPDXID: "SPDXRef-npm", name: "npm", versionInfo: "11", licenseDeclared: "Artistic-2.0", externalRefs: [{ referenceType: "purl", referenceLocator: "pkg:npm/npm@11" }] }]), { role: "server", platform: "linux/arm64", subject: "x@sha256:1", declared: [] });
  assert.match(reconcileSbom(withNpm, { dpkg }).join("\n"), /undeclared component: pkg:npm\/npm@11/u);
  const leaky = structuredClone(sbom);
  leaky.packages[1].comment = "built in /Users/someone/src and /home/runner/work";
  assert.equal(reconcileSbom(leaky, { dpkg }).filter((finding) => /local or builder-only path/u.test(finding)).length >= 1, true);
});

test("criterion 7: curated records replace only NOASSERTION; the gate classifies OS vs application failures", () => {
  const policy = loadFossPolicy();
  const node = { SPDXID: "SPDXRef-node", name: "node", versionInfo: "24.21.0", licenseDeclared: "NOASSERTION", externalRefs: [{ referenceType: "purl", referenceLocator: "pkg:generic/node@24.21.0" }] };
  const { sbom, curation } = augmentSbom(syftDocument([deb("base-files", "12", "LicenseRef-GPL"), node]), { role: "server", platform: "linux/arm64", subject: "x@sha256:1", declared: [], curated: [{ match: (pkg) => pkg.name === "node", licence: "MIT", source: "materials" }] });
  const results = licenceGate(sbom, policy, { curation });
  assert.equal(results.find((result) => result.purl.startsWith("pkg:generic/node")).pass, true);
  const base = results.find((result) => result.purl.startsWith("pkg:deb/"));
  assert.equal(base.pass, false);
  assert.equal(base.class, "os-package");
  assert.equal(sameLicence("MIT AND ISC", "ISC AND MIT"), true);
  assert.equal(sameLicence("MIT OR ISC", "ISC OR MIT"), false);
});

test("criterion 7: amd64/arm64 package drift fails except for a declared architecture-specific package", () => {
  const a = syftDocument([deb("libc6", "2.36"), deb("stockfish", "18-x86")]);
  const b = syftDocument([deb("libc6", "2.37"), deb("stockfish", "18-src")]);
  assert.deepEqual(architectureDrift(a, b, { allowed: ["stockfish"] }), ["libc6: 2.36 vs 2.37"]);
});
