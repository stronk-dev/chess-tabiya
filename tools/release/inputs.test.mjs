// rfc/verifiable-runtime-distribution.md §2/§4/§7 — immutable inputs, image definitions and the
// temporary runtime-content allow-list, with the RFC's falsifiers as negative fixtures.
import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { REPO_ROOT, readJson, repoPath } from "./lib/common.mjs";
import { dockerfileFindings } from "./lib/dockerfile-policy.mjs";
import { FORBIDDEN_LIBRARY, maiaInputFindings, parsePythonLock } from "./lib/maia.mjs";
import { generatePreImage } from "./lib/pre-image.mjs";
import { planRuntimeContent, verifyRuntimeContentTree } from "./lib/runtime-content.mjs";
import { RELEASE_DOCKERFILES, materialFindings, releasePolicyFindings } from "./release-policy.mjs";

const materials = readJson(repoPath("release/materials.v1.json"));
const serverDockerfile = readFileSync(repoPath("apps/server/Dockerfile"), "utf8");

test("criterion 4: the committed release inputs pass the offline release policy", () => {
  assert.deepEqual(releasePolicyFindings(), []);
});

test("criterion 4 falsifier: FROM node:24… by tag, a mutable ADD, live apt, git clone or pip ranges fail", () => {
  for (const file of RELEASE_DOCKERFILES) assert.deepEqual(dockerfileFindings(readFileSync(repoPath(file), "utf8"), materials, file), [], file);
  const cases = {
    tagOnly: serverDockerfile.replace(/FROM docker\.io\/library\/node:24\.21\.0-bookworm-slim@sha256:[0-9a-f]{64} AS build/u, "FROM node:24.21.0-bookworm-slim AS build"),
    staleDigest: serverDockerfile.replace("0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6 AS build", `${"a".repeat(64)} AS build`),
    unpinnedFrontend: serverDockerfile.replace(/^# syntax=.*$/mu, "# syntax=docker/dockerfile:1"),
    mutableAdd: serverDockerfile.replace(/ADD --checksum=sha256:29c3[0-9a-f]+ \\/u, "ADD \\"),
    liveApt: `${serverDockerfile}\nRUN apt-get update && apt-get install -y curl\n`,
    unversionedSnapshotApt: serverDockerfile.replace("g++=4:12.2.0-3", "g++"),
    gitClone: serverDockerfile.replace("RUN pnpm build", "RUN git clone https://example.invalid/x && pnpm build"),
    netcat: `${serverDockerfile}\nRUN apt-get install -y netcat-openbsd\n`,
    contentTree: `${serverDockerfile}\nCOPY content content\n`,
    planningTree: `${serverDockerfile}\nCOPY planning/exploration/log.md planning/exploration/log.md\n`,
    embeddedIndex: `${serverDockerfile}\nCOPY release-manifest.json /app/release-manifest.json\n`,
    pipRanges: readFileSync(repoPath("workers/maia/Dockerfile"), "utf8").replace("--require-hashes --no-deps --only-binary=:all: --no-binary=chess", "--only-binary=:all:"),
  };
  for (const [name, text] of Object.entries(cases)) assert.notEqual(dockerfileFindings(text, materials, name).length, 0, name);
});

test("criterion 4: the rendered Caddy edge is the reviewed digest recorded in the materials", async () => {
  const { CADDY_IMAGE } = await import("../render-deployment.mjs");
  const caddy = materials.baseImages.find((image) => image.id === "proxy-edge");
  assert.equal(CADDY_IMAGE, `${caddy.repository}:${caddy.tag}@${caddy.index}`);
});

test("criterion 4: every material URL is digest-locked; a URL without a digest fails", () => {
  assert.deepEqual(materialFindings(materials), []);
  const mutable = structuredClone(materials);
  delete mutable.maia.weight.sha256;
  assert.equal(materialFindings(mutable).length, 1);
});

test("criterion 5: the Maia locks are exact, hashed, arch-equal and CPU-only; a CUDA distribution or library fails", () => {
  assert.deepEqual(maiaInputFindings(), []);
  const root = mkdtempSync(join(tmpdir(), "tabiya-maia-"));
  cpSync(join(REPO_ROOT, "release"), join(root, "release"), { recursive: true });
  cpSync(join(REPO_ROOT, "workers"), join(root, "workers"), { recursive: true });
  const lock = join(root, "workers/maia/requirements-cpu-linux-arm64.txt");
  writeFileSync(lock, `${readFileSync(lock, "utf8")}nvidia-cublas==13.1.1.3 \\\n    --hash=sha256:${"a".repeat(64)}\n`);
  assert.throws(() => maiaInputFindings({ root }), /does not match its material digest/u);
  assert.throws(() => parsePythonLock("torch>=2\n"), /exact hashed pin/u);
  for (const library of ["libcudart.so.13", "libcudnn_ops.so.9", "libnccl.so.2", "libnvinfer.so.10", "libtorch_cuda.so", "libcublasLt.so.13"]) assert.match(library, FORBIDDEN_LIBRARY, library);
  assert.doesNotMatch("libtorch_cpu.so", FORBIDDEN_LIBRARY);
});

function contentFixture() {
  const root = mkdtempSync(join(tmpdir(), "tabiya-content-"));
  for (const path of ["release", "schemas", "content/shapes", "content/principles", "content/concepts", "content/valence", "apps/server/artifacts"]) {
    cpSync(join(REPO_ROOT, path), join(root, path), { recursive: true });
  }
  mkdirSync(join(root, "content/drafts"), { recursive: true });
  mkdirSync(join(root, "planning/exploration"), { recursive: true });
  mkdirSync(join(root, "docs"), { recursive: true });
  cpSync(join(REPO_ROOT, "planning/exploration/log.md"), join(root, "planning/exploration/log.md"));
  cpSync(join(REPO_ROOT, "docs/tablebase-grounding.md"), join(root, "docs/tablebase-grounding.md"));
  cpSync(join(REPO_ROOT, "content/drafts/anti-caro-advance.json"), join(root, "content/drafts/anti-caro-advance.json"));
  return root;
}

test("criterion 9: the allow-list admits only served families and compiles the prose facts the loader needs", () => {
  const plan = planRuntimeContent();
  const families = new Set(plan.manifest.files.map((file) => file.family));
  for (const family of ["pack", "pack-sidecar", "shape", "principle", "concept-registry", "valence-register", "schema", "opening-catalogue"]) assert.ok(families.has(family), family);
  for (const file of plan.manifest.files) {
    assert.doesNotMatch(file.path, /^(?:content\/candidates|planning|docs|rfc|tools|vendor)\//u, file.path);
    assert.doesNotMatch(file.path, /\.(?:job|priority|graduation|browser)\.json$|\.md$/u, file.path);
  }
  assert.ok(Object.keys(plan.facts.rulingLines).some((ref) => ref.startsWith("planning/exploration/log.md#L")));
  assert.ok(plan.excluded.some((entry) => entry.reason === "authoring-sidecar"));
  assert.equal(plan.manifest.finalDischarge, false, "the temporary allow-list cannot claim D2");
});

test("criterion 9 negative fixture: a valid-looking job file, candidate and browser fixture cannot enter; a local path fails the build", () => {
  const root = contentFixture();
  writeFileSync(join(root, "content/drafts/anti-caro-advance.job.json"), "{}");
  writeFileSync(join(root, "content/drafts/anti-caro-advance.priority.json"), "{}");
  writeFileSync(join(root, "content/drafts/fixture.browser.json"), readFileSync(join(root, "content/drafts/anti-caro-advance.json")));
  mkdirSync(join(root, "content/candidates/x"), { recursive: true });
  writeFileSync(join(root, "content/candidates/x/pack.json"), readFileSync(join(root, "content/drafts/anti-caro-advance.json")));
  const plan = planRuntimeContent({ root });
  const paths = plan.manifest.files.map((file) => file.path);
  assert.ok(paths.includes("content/drafts/anti-caro-advance.json"));
  for (const excluded of ["content/drafts/anti-caro-advance.job.json", "content/drafts/anti-caro-advance.priority.json", "content/drafts/fixture.browser.json", "content/candidates/x/pack.json"]) {
    assert.equal(paths.includes(excluded), false, excluded);
  }
  const pack = JSON.parse(readFileSync(join(root, "content/drafts/anti-caro-advance.json"), "utf8"));
  pack.provenance.sources = [...(pack.provenance.sources ?? []), "/private/tmp/workstation/evidence.json"];
  writeFileSync(join(root, "content/drafts/anti-caro-advance.json"), JSON.stringify(pack));
  assert.throws(() => planRuntimeContent({ root }), /workstation-local path/u);
});

test("criterion 9: a staged bundle verifies byte-for-byte; a changed or missing file fails", () => {
  const out = mkdtempSync(join(tmpdir(), "tabiya-staged-"));
  try {
    const { bundle } = generatePreImage({ out, version: "0.0.0-test", revision: "0".repeat(40) });
    const app = join(out, "app");
    assert.deepEqual(verifyRuntimeContentTree(app, bundle.manifest), []);
    writeFileSync(join(app, "content/valence/register.json"), "{}\n");
    rmSync(join(app, "schemas/drill_pack.schema.json"));
    const errors = verifyRuntimeContentTree(app, bundle.manifest);
    assert.ok(errors.some((error) => error.includes("changed: content/valence/register.json")));
    assert.ok(errors.some((error) => error.includes("missing: schemas/drill_pack.schema.json")));
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("§4/§8: pre-image generation is deterministic and embeds no post-image digest", () => {
  const first = mkdtempSync(join(tmpdir(), "tabiya-pre-a-"));
  const second = mkdtempSync(join(tmpdir(), "tabiya-pre-b-"));
  try {
    const a = generatePreImage({ out: first, version: "1.2.3", revision: "f".repeat(40) });
    const b = generatePreImage({ out: second, version: "1.2.3", revision: "f".repeat(40) });
    assert.deepEqual(a.summary, b.summary);
    assert.equal(readFileSync(join(first, "doc/NOTICE.txt"), "utf8"), readFileSync(join(second, "doc/NOTICE.txt"), "utf8"));
    const metadata = readFileSync(join(first, "doc/build-metadata.json"), "utf8");
    assert.doesNotMatch(metadata, /release-manifest|SHA256SUMS|ghcr\.io|spdx/iu);
    assert.match(readFileSync(join(first, "doc/NOTICE.txt"), "utf8"), /ABSOLUTELY NO WARRANTY/u);
    assert.throws(() => generatePreImage({ out: first, version: "v1.2.3", revision: "f".repeat(40) }), /semver/u);
  } finally {
    rmSync(first, { recursive: true, force: true });
    rmSync(second, { recursive: true, force: true });
  }
});
