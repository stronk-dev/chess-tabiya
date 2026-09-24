// rfc/verifiable-runtime-distribution.md §1/§8 — release manifest v1, Compose, SHA256SUMS and the
// acyclic artifact graph, with the negative fixtures the RFC names.
import assert from "node:assert/strict";
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { RELEASE_MANIFEST_SCHEMA, canonicalReleaseManifest, parseReleaseManifest, validateReleaseManifest } from "../../packages/schema/src/release-manifest/index.ts";
import { REPO_ROOT } from "./lib/common.mjs";
import {
  CHECKSUMS_NAME,
  DEPLOYMENT_FILES,
  RELEASE_GRAPH,
  RELEASE_MANIFEST_NAME,
  composeImages,
  withoutMaia,
  writeReleaseDeployment,
  generateReleaseManifest,
  renderChecksums,
  topologicalOrder,
  verifyReleaseSet,
} from "./lib/release-set.mjs";
import { projectedSchema } from "./release-manifest-schema.mjs";

const repository = "https://github.com/stronk-dev/chess-tabiya";
const revision = "c".repeat(40);
const digest = (char) => `sha256:${char.repeat(64)}`;
const server = `ghcr.io/stronk-dev/chess-tabiya-server@${digest("1")}`;
const maia = `ghcr.io/stronk-dev/chess-tabiya-maia-cpu@${digest("2")}`;

function fixture({ version = "1.0.0", withMaia = true, finalDischarge = true, receipts } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "tabiya-release-set-"));
  mkdirSync(join(dir, "sbom"));
  writeFileSync(join(dir, "LICENSE"), "AGPL\n");
  writeFileSync(join(dir, "NOTICE.txt"), "notices\n");
  writeFileSync(join(dir, `chess-tabiya-${version}-source.tar.gz`), "source\n");
  const images = { server: { subject: server, platforms: { "linux/amd64": digest("3"), "linux/arm64": digest("4") }, fossEligible: true } };
  if (withMaia) images["maia-cpu"] = { subject: maia, platforms: { "linux/amd64": digest("5"), "linux/arm64": digest("6") }, fossEligible: true };
  for (const [role, image] of Object.entries(images)) {
    for (const platform of Object.keys(image.platforms)) writeFileSync(join(dir, "sbom", `${role}-${platform.replace("/", "-")}.spdx.json`), `{"spdxVersion":"SPDX-2.3","role":"${role}"}\n`);
  }
  writeReleaseDeployment(dir, { serverSubject: server, maia: withMaia ? { subject: maia, manifestDigest: digest("2"), configDigest: digest("a") } : null });
  const coreReceipt = (platform) => ({ platform, tier: "core", imageDigests: [server], journeyId: "core.release_journey@1", productionProfileDigest: null, candidateWindow: null, steadyRssMiB: 80, peakRssMiB: 200, unpackedImageBytes: 500 * 1024 * 1024, coldReadyMs: 4_000 });
  const cpuReceipt = (platform) => ({ platform, tier: "cpu", imageDigests: [maia, server].sort(), journeyId: "bot.production_selection@1", productionProfileDigest: digest("7"), candidateWindow: { operation: "maia.policy_page@1", requested: 20, observed: 20, coverage: "bounded_top_k" }, steadyRssMiB: 1_000, peakRssMiB: 1_500, unpackedImageBytes: 1_900 * 1024 * 1024, coldReadyMs: 60_000 });
  const text = generateReleaseManifest({
    dir,
    version,
    sourceRevision: revision,
    createdAt: "2026-09-24T12:00:00.000Z",
    repository,
    images,
    resourceReceipts: receipts ?? (withMaia ? [coreReceipt("linux/amd64"), coreReceipt("linux/arm64"), cpuReceipt("linux/amd64"), cpuReceipt("linux/arm64")] : []),
    contentBundle: { producer: "tabiya-temporary-allow-list@1", digest: digest("8"), finalDischarge },
    fossPolicy: { version: 1, digest: digest("9") },
    sourceArchive: `chess-tabiya-${version}-source.tar.gz`,
  });
  writeFileSync(join(dir, RELEASE_MANIFEST_NAME), text);
  const files = ["LICENSE", "NOTICE.txt", RELEASE_MANIFEST_NAME, `chess-tabiya-${version}-source.tar.gz`, ...DEPLOYMENT_FILES,
    ...Object.entries(images).flatMap(([role, image]) => Object.keys(image.platforms).map((platform) => `sbom/${role}-${platform.replace("/", "-")}.spdx.json`))];
  writeFileSync(join(dir, CHECKSUMS_NAME), renderChecksums(dir, files));
  return { dir, manifest: JSON.parse(text), text };
}

const mutate = (manifest, change) => {
  const copy = structuredClone(manifest);
  change(copy);
  return copy;
};

test("§1 a 1.0-class release set is generated once and verifies read-only", () => {
  const { dir, text } = fixture();
  assert.equal(canonicalReleaseManifest(parseReleaseManifest(text)), text);
  const manifest = verifyReleaseSet(dir);
  assert.deepEqual(manifest.requiredArtifacts.map((item) => item.role), ["maia-cpu", "server"]);
  assert.deepEqual(manifest.compose.map((item) => item.profile), ["appliance", "hosted", "local"]);
});

test("§1 the manifest refuses missing/extra fields, unknown versions, wrong digest algorithms and duplicate roles", () => {
  const { manifest } = fixture();
  const cases = {
    missing: mutate(manifest, (value) => delete value.fossPolicy),
    extra: mutate(manifest, (value) => { value.release.channel = "stable"; }),
    version: mutate(manifest, (value) => { value.formatVersion = 2; }),
    algorithm: mutate(manifest, (value) => { value.requiredArtifacts[1].platformManifests[0].digest = `sha512:${"a".repeat(128)}`; }),
    duplicate: mutate(manifest, (value) => { value.requiredArtifacts.push(structuredClone(value.requiredArtifacts[1])); }),
    notFoss: mutate(manifest, (value) => { value.requiredArtifacts[0].fossEligible = false; }),
    wrongTier: mutate(manifest, (value) => { value.requiredArtifacts[1].tier = "cpu"; }),
    missingSbom: mutate(manifest, (value) => { value.requiredArtifacts[1].platformManifests.pop(); }),
    tagOnlySubject: mutate(manifest, (value) => { value.requiredArtifacts[1].subject = "ghcr.io/stronk-dev/chess-tabiya-server:v1.0.0"; }),
    upperCaseDigest: mutate(manifest, (value) => { value.fossPolicy.digest = `sha256:${"A".repeat(64)}`; }),
    pathEscape: mutate(manifest, (value) => { value.files[0].path = "../LICENSE"; }),
  };
  for (const [name, value] of Object.entries(cases)) assert.notEqual(validateReleaseManifest(value).length, 0, name);
});

test("§5 resource receipts above a ceiling, on the wrong journey or with a narrow bot window are refused", () => {
  const { manifest } = fixture();
  const over = mutate(manifest, (value) => { value.resourceReceipts[0].peakRssMiB = 385; });
  assert.match(validateReleaseManifest(over).join("\n"), /peakRssMiB 385 exceeds the core ceiling 384/u);
  const narrow = mutate(manifest, (value) => { value.resourceReceipts[2].candidateWindow.requested = 10; value.resourceReceipts[2].candidateWindow.observed = 10; });
  assert.match(validateReleaseManifest(narrow).join("\n"), /width 20/u);
  const fixtureProfile = mutate(manifest, (value) => { value.resourceReceipts[2].productionProfileDigest = null; });
  assert.match(validateReleaseManifest(fixtureProfile).join("\n"), /production bot profile digest/u);
  const wrongJourney = mutate(manifest, (value) => { value.resourceReceipts[0].journeyId = "bot.production_selection@1"; });
  assert.notEqual(validateReleaseManifest(wrongJourney).length, 0);
});

test("§1/§7 a 1.0-class release needs both roles, both platforms, native receipts and the final content bundle (D2)", () => {
  assert.throws(() => fixture({ finalDischarge: false }), /final F3\/F4 content bundle/u);
  assert.throws(() => fixture({ withMaia: false, receipts: [] }), /requires maia-cpu/u);
  const preview = fixture({ version: "0.9.0-preview.1", withMaia: false, finalDischarge: false });
  assert.equal(verifyReleaseSet(preview.dir).release.version, "0.9.0-preview.1");
});

test("§1 the JSON Schema projection is exact and agrees with the TypeScript validator (ajv 2020)", () => {
  assert.equal(readFileSync(join(REPO_ROOT, "release/release-manifest.v1.schema.json"), "utf8"), projectedSchema());
  const require = createRequire(join(REPO_ROOT, "packages/schema/package.json"));
  const Ajv2020 = require("ajv/dist/2020.js").default;
  const validate = new Ajv2020({ strict: false, allErrors: true }).compile(RELEASE_MANIFEST_SCHEMA);
  const { manifest } = fixture();
  assert.equal(validate(manifest), true, JSON.stringify(validate.errors));
  for (const change of [
    (value) => delete value.fossPolicy,
    (value) => { value.release.channel = "x"; },
    (value) => { value.formatVersion = 2; },
    (value) => { value.requiredArtifacts[0].platforms = ["linux/s390x"]; },
    (value) => { value.contentBundle.digest = "md5:abc"; },
  ]) {
    const value = mutate(manifest, change);
    assert.equal(validate(value), false);
    assert.notEqual(validateReleaseManifest(value).length, 0);
  }
});

test("§8 changing one byte of any release file fails before install; SHA256SUMS never hashes itself", () => {
  for (const path of ["NOTICE.txt", "compose.appliance.yaml", "Caddyfile.hosted", RELEASE_MANIFEST_NAME, "sbom/server-linux-arm64.spdx.json"]) {
    const { dir } = fixture();
    appendFileSync(join(dir, path), " ");
    assert.throws(() => verifyReleaseSet(dir), /release set verification failed/u, path);
  }
  const { dir } = fixture();
  assert.equal(readFileSync(join(dir, CHECKSUMS_NAME), "utf8").includes(CHECKSUMS_NAME), false);
  assert.equal(renderChecksums(dir, [CHECKSUMS_NAME, "LICENSE"]).includes(CHECKSUMS_NAME), false);
});

test("§1 the six rendered deployment files are covered; Compose records only Tabiya artifacts and never a tag-only image", () => {
  const { dir, manifest } = fixture();
  assert.deepEqual(manifest.compose.map((item) => [item.profile, item.path]), [["appliance", "compose.appliance.yaml"], ["hosted", "compose.hosted.yaml"], ["local", "compose.yaml"]]);
  for (const path of ["Caddyfile.appliance", "Caddyfile.hosted", "compose.maintenance.yaml"]) assert.ok(manifest.files.some((file) => file.path === path), path);
  const appliance = readFileSync(join(dir, "compose.appliance.yaml"), "utf8");
  assert.ok(composeImages(appliance).subjects.some((subject) => subject.includes("caddy")), "the pinned Caddy edge is present");
  assert.deepEqual(manifest.compose[0].imageDigests, [maia, server].sort(), "third-party pins stay outside the artifact join");
  assert.match(appliance, /mem_limit: 512m\n\s+memswap_limit: 512m/u);
  assert.match(appliance, /\.\/release-manifest\.json:\/run\/chess-tabiya\/release-manifest\.json:ro/u);
  assert.deepEqual(composeImages("services:\n  a:\n    image: nginx:latest\n").tagOnly, ["nginx:latest"]);
  const core = withoutMaia(appliance);
  assert.equal(core.includes(maia) || /^ {2}maia:/mu.test(core) || /MAIA_HOST/u.test(core), false, "a withheld Maia leaves no reference");
});

test("§8 the release graph is acyclic; embedding the index, regenerating the notice or self-hashing is a cycle", () => {
  const order = topologicalOrder();
  assert.ok(order.indexOf("platform-image") < order.indexOf("release-manifest"));
  assert.ok(order.indexOf("release-manifest") < order.indexOf("checksums"));
  assert.ok(order.indexOf("notice") < order.indexOf("platform-image"));
  assert.throws(() => topologicalOrder([...RELEASE_GRAPH, ["release-manifest", "platform-image"]]), /cycle/u);
  assert.throws(() => topologicalOrder([...RELEASE_GRAPH, ["sbom", "notice"]]), /cycle/u);
  assert.throws(() => topologicalOrder([...RELEASE_GRAPH, ["checksums", "checksums"]]), /cycle/u);
});
