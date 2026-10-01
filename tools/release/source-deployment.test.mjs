import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { renderDeployment, renderSourceDeployment } from "../render-deployment.mjs";
import { localMaiaIdentity } from "./lib/local-maia-identity.mjs";
import { maiaSourceBuildArguments, parseSourceBuilder, requireSourceBuilder, renderSourceImages, SOURCE_BUILDER, SOURCE_BUILDKIT_IMAGE } from "../source-deployment.mjs";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const digest = (bytes) => "sha256:" + createHash("sha256").update(bytes).digest("hex");
const encode = (value) => Buffer.from(JSON.stringify(value));
const fixture = (architecture = "arm64") => {
  const config = encode({ architecture, os: "linux", rootfs: { type: "layers", diff_ids: [digest("layer")] } });
  const manifest = encode({ schemaVersion: 2, mediaType: "application/vnd.oci.image.manifest.v1+json", config: { mediaType: "application/vnd.oci.image.config.v1+json", digest: digest(config), size: config.length }, layers: [{ mediaType: "application/vnd.oci.image.layer.v1.tar+gzip", digest: digest("compressed-layer"), size: 16 }] });
  const descriptor = { mediaType: "application/vnd.oci.image.manifest.v1+json", digest: digest(manifest), size: manifest.length };
  return { layout: { imageLayoutVersion: "1.0.0" }, index: { schemaVersion: 2, manifests: [descriptor] }, image: { Id: digest(config), Architecture: architecture, Os: "linux", RootFS: { Type: "layers", Layers: [digest("layer")] } }, readBlob: (id) => ({ [digest(config)]: config, [digest(manifest)]: manifest })[id] };
};

test("source rendering does not mount or claim a verified release index", () => {
  const files = renderSourceDeployment({ serverImage: digest("server"), maiaImage: "chess-tabiya-maia:dev" });
  for (const file of ["compose.yaml", "compose.appliance.yaml", "compose.hosted.yaml"]) {
    assert.doesNotMatch(files[file], /TABIYA_RELEASE_MANIFEST|TABIYA_SERVER_IMAGE|release-manifest\.json/);
    assert.doesNotMatch(files[file], /MAIA_IMAGE_ID|MAIA_MANIFEST_DIGEST|MAIA_CONFIG_DIGEST/);
    assert.match(files[file], /mem_limit: 512m/);
  }
  for (const profile of ["appliance", "hosted"]) {
    assert.match(files[`compose.${profile}.yaml`], /proxy_edge:\n\s+internal: true/);
    assert.match(files[`Caddyfile.${profile}`], /enable_full_duplex/);
  }
});

test("release rendering keeps its index and both real platform configs mandatory", () => {
  const files = renderDeployment({ serverImage: "fixture.invalid/server@" + digest("server"), maiaImage: "fixture.invalid/maia@" + digest("maia"), maiaManifestDigest: digest("manifest"), maiaConfigDigests: { "linux/amd64": digest("amd64"), "linux/arm64": digest("arm64") } });
  for (const file of ["compose.yaml", "compose.appliance.yaml", "compose.hosted.yaml"]) {
    assert.match(files[file], /TABIYA_RELEASE_MANIFEST/);
    assert.match(files[file], /release-manifest\.json:ro/);
    assert.match(files[file], /MAIA_PLATFORM_CONFIG_DIGESTS/);
  }
  assert.throws(() => renderDeployment({ serverImage: digest("server"), maiaImage: digest("maia") }));
});

for (const architecture of ["amd64", "arm64"]) {
  test(`native ${architecture} source identity joins actual OCI bytes to the loaded Docker image`, () => {
    const input = fixture(architecture);
    const identity = localMaiaIdentity(input);
    assert.equal(identity.imageId, input.image.Id);
    assert.equal(identity.configDigest, input.image.Id);
    assert.equal(identity.manifestDigest, input.index.manifests[0].digest);
    assert.notEqual(identity.manifestDigest, identity.configDigest);
    const files = renderSourceDeployment({ serverImage: digest("server"), maiaImage: identity.imageId, maiaIdentity: identity });
    for (const file of ["compose.yaml", "compose.appliance.yaml", "compose.hosted.yaml"]) {
      assert.match(files[file], new RegExp("MAIA_CONFIG_DIGEST: " + identity.configDigest));
      assert.doesNotMatch(files[file], /MAIA_PLATFORM_CONFIG_DIGESTS/);
    }
  });
}

test("foreign loaded image, architecture, rootfs and malformed OCI descriptors are refused", () => {
  const input = fixture();
  for (const image of [{ ...input.image, Id: digest("foreign") }, { ...input.image, Architecture: "amd64" }, { ...input.image, Os: "windows" }, { ...input.image, RootFS: { Layers: [digest("foreign-layer")] } }]) {
    assert.throws(() => localMaiaIdentity({ ...input, image }));
  }
  for (const index of [{ schemaVersion: 1, manifests: input.index.manifests }, { schemaVersion: 2, manifests: [] }, { schemaVersion: 2, manifests: [...input.index.manifests, ...input.index.manifests] }, { schemaVersion: 2, manifests: [{ ...input.index.manifests[0], size: 1 }] }, { schemaVersion: 2, manifests: [{ ...input.index.manifests[0], digest: "../../escape" }] }]) {
    assert.throws(() => localMaiaIdentity({ ...input, index }));
  }
  assert.throws(() => localMaiaIdentity({ ...input, layout: { imageLayoutVersion: "2.0" } }));
  assert.throws(() => localMaiaIdentity({ ...input, readBlob: () => encode({}) }));
});

test("a source identity cannot be applied to another tagged or immutable image", () => {
  const identity = localMaiaIdentity(fixture());
  assert.throws(() => renderSourceDeployment({ serverImage: digest("server"), maiaImage: "chess-tabiya-maia:dev", maiaIdentity: identity }));
  assert.throws(() => renderSourceDeployment({ serverImage: digest("server"), maiaImage: digest("foreign"), maiaIdentity: identity }));
});

test("CPU build exports and loads one native build, never pushes or selects a global builder", () => {
  const args = maiaSourceBuildArguments({ platform: "linux/arm64", image: "chess-tabiya-maia:dev", layout: "/tmp/owned-oci" });
  assert.ok(args.includes("type=docker,oci-mediatypes=true"));
  assert.ok(args.includes("type=oci,tar=false,oci-mediatypes=true,dest=/tmp/owned-oci"));
  assert.ok(args.includes("--provenance=false") && args.includes("--sbom=false"));
  assert.ok(!args.includes("--push") && !args.includes("--use") && !args.includes("--load"));
  assert.throws(() => maiaSourceBuildArguments({ platform: "linux/386", image: "chess-tabiya-maia:dev", layout: "/tmp/owned" }));
  assert.throws(() => maiaSourceBuildArguments({ platform: "linux/arm64", image: "chess-tabiya-maia@" + digest("x"), layout: "/tmp/owned" }));
});

test("a foreign builder or mutable BuildKit cannot be repurposed by the source command", () => {
  const builder = { Name: SOURCE_BUILDER, Driver: "docker-container", Nodes: [{ Endpoint: "desktop-linux", DriverOpts: { image: SOURCE_BUILDKIT_IMAGE } }] };
  assert.doesNotThrow(() => requireSourceBuilder(builder, "desktop-linux"));
  for (const bad of [{ ...builder, Name: "foreign" }, { ...builder, Driver: "docker" }, { ...builder, Nodes: [] }, { ...builder, Nodes: [{ Endpoint: "remote", DriverOpts: { image: SOURCE_BUILDKIT_IMAGE } }] }, { ...builder, Nodes: [{ Endpoint: "desktop-linux", DriverOpts: { image: "moby/buildkit:latest" } }] }]) {
    assert.throws(() => requireSourceBuilder(bad, "desktop-linux"));
  }
});

test("the actual Buildx text protocol is parsed without unsupported --format flags", () => {
  const output = `Name:          ${SOURCE_BUILDER}\nDriver:        docker-container\nLast Activity: 2026-09-30\n\nNodes:\nName:                  ${SOURCE_BUILDER}0\nEndpoint:              desktop-linux\nDriver Options:        image="${SOURCE_BUILDKIT_IMAGE}"\nStatus:                inactive\n`;
  assert.doesNotThrow(() => requireSourceBuilder(parseSourceBuilder(output), "desktop-linux"));
  for (const bad of [output.replace("Nodes:", ""), output + "Endpoint: remote\n", output + "Name: another-node\n", output.replace("Driver Options:", "Options:"), output.replace(`image="${SOURCE_BUILDKIT_IMAGE}"`, "image=moby/buildkit:latest")]) assert.throws(() => parseSourceBuilder(bad));
});

test("source image receipt is explicit and CPU rendering refuses an unbound or foreign image", () => {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-source-render-"));
  try {
    const input = fixture();
    const server = { Id: digest("server"), Os: "linux", Architecture: "arm64" };
    renderSourceImages({ out: directory, tier: "core", server });
    assert.deepEqual(JSON.parse(readFileSync(join(directory, "source-images.json"))), { distribution: "source-build", tier: "core", platform: "linux/arm64", serverImage: server.Id, maia: null });
    assert.throws(() => renderSourceImages({ out: directory, tier: "cpu", server }));
    assert.throws(() => renderSourceImages({ out: directory, tier: "cpu", server: { ...server, Architecture: "amd64" }, maia: input.image, layout: input, readBlob: input.readBlob }));
    renderSourceImages({ out: directory, tier: "cpu", server, maia: input.image, layout: input, readBlob: input.readBlob });
    const receipt = JSON.parse(readFileSync(join(directory, "source-images.json")));
    assert.equal(receipt.tier, "cpu");
    assert.equal(receipt.maia.manifestDigest, input.index.manifests[0].digest);
    assert.equal(receipt.maia.configDigest, input.image.Id);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("the actual CPU image fixes model permissions and validates readiness as its runtime uid", () => {
  const dockerfile = readFileSync(new URL("../../workers/maia/Dockerfile", import.meta.url), "utf8");
  assert.match(dockerfile, /ADD --checksum=sha256:ba14208b2992d85502f5fb501934abf6aaaeb355e9f3fdf90e326911f562524f --chmod=0444/);
  assert.match(dockerfile, /chmod 0755 \/opt\/maia3-models/);
  assert.match(dockerfile, /chmod 0444 \/opt\/maia3-models\/maia3-5m\.pt/);
  const runtime = dockerfile.slice(dockerfile.indexOf("USER maia\n"));
  assert.match(runtime, /RUN --network=none test -r \/opt\/maia3-models\/maia3-5m\.pt/);
  assert.match(runtime, /maia3-uci --model 5m --checkpoint-path \/opt\/maia3-models\/maia3-5m\.pt --use-uci-history/);
  assert.doesNotMatch(runtime, /USER root/);
});

test("actual model policy regression runs offline after USER; source arithmetic is precise without changing sampling", () => {
  const dockerfile = readFileSync("workers/maia/Dockerfile", "utf8");
  const patch = readFileSync("workers/maia/patches/maia3-uci-policy-mass.patch", "utf8");
  assert.match(dockerfile.slice(dockerfile.indexOf("USER maia\n")), /python \/opt\/chess-tabiya\/check-policy-mass\.py/);
  assert.match(patch, /torch\.softmax\(logits\.double\(\), dim=-1\)/);
  assert.match(patch, /:\.17g/);
  assert.doesNotMatch(patch, /^[+-].*sample_from_logits\(/mu);
  const check = readFileSync("workers/maia/check-policy-mass.py", "utf8");
  assert.match(check, /position startpos moves e2e4/);
  assert.match(check, /position startpos moves d2d4/);
  assert.match(check, /len\(rows\) != 20/);
  assert.match(check, /mass <= 1 \+ 1e-9/);
});

test("policy build validator refuses the actual float32 negative and malformed pages", () => {
  execFileSync("python3", ["-B", "-c", `
import json, runpy
validate = runpy.run_path("workers/maia/check-policy-mass.py")["validate_pages"]
page = [f"info depth 1 multipv {i+1} policy 0.05 pv e2e4" for i in range(20)] + ["bestmove e2e4"]
assert len(validate(page + page)) == 2
old = json.load(open("planning/provider-exchange-and-execution/maia-policy-float32-negative-2026-10-01.json"))
actual = [line for p in old["pages"] for line in p["rows"] + [p["bestmove"]]]
for bad in [actual, page, page[:-2] + ["bestmove e2e4"] + page,
            [line.replace("policy 0.05", "policy NaN") for line in page] + page,
            [line.replace("policy 0.05", "policy 0.06") for line in page] + page]:
    try:
        validate(bad)
    except ValueError:
        continue
    raise AssertionError("invalid source page was admitted")
`], { stdio: "pipe" });
});
