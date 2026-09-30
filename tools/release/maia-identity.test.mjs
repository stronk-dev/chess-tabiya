import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { renderDeployment } from "../render-deployment.mjs";
import { readPlatformConfigDigests } from "./lib/platform-configs.mjs";

test("publisher reads distinct configs from both immutable platform manifests", () => {
  const subjects = [];
  const platforms = { "linux/amd64": digest("d"), "linux/arm64": digest("e") };
  assert.deepEqual(readPlatformConfigDigests("fixture.invalid/maia", platforms, (subject) => {
    subjects.push(subject);
    return JSON.stringify({ schemaVersion: 2, config: { mediaType: "application/vnd.oci.image.config.v1+json", digest: subject.endsWith(digest("d")) ? configs["linux/amd64"] : configs["linux/arm64"] }, layers: [] });
  }), configs);
  assert.deepEqual(subjects, Object.values(platforms).map((value) => "fixture.invalid/maia@" + value));
  for (const bad of [{}, { schemaVersion: 2, manifests: [] }, { schemaVersion: 2, config: { mediaType: "application/vnd.oci.image.config.v1+json", digest: "wrong" }, layers: [] }]) {
    assert.throws(() => readPlatformConfigDigests("fixture.invalid/maia", platforms, () => JSON.stringify(bad)));
  }
});

const digest = (c) => "sha256:" + c.repeat(64);
const configs = { "linux/amd64": digest("b"), "linux/arm64": digest("c") };
const input = { serverImage: "fixture.invalid/server@" + digest("a"), maiaImage: "fixture.invalid/maia@" + digest("a"), maiaManifestDigest: digest("a"), maiaConfigDigests: configs };

test("all release profiles carry both native Maia configs and identical identity", () => {
  const artifacts = renderDeployment(input);
  for (const file of ["compose.yaml", "compose.appliance.yaml", "compose.hosted.yaml"]) {
    assert.ok(artifacts[file].includes("MAIA_IMAGE_ID: " + input.maiaImage), file);
    assert.ok(artifacts[file].includes("MAIA_MANIFEST_DIGEST: " + input.maiaManifestDigest), file);
    assert.ok(artifacts[file].includes("MAIA_PLATFORM_CONFIG_DIGESTS: '" + JSON.stringify(configs) + "'"), file);
    assert.ok(!artifacts[file].includes("MAIA_CONFIG_DIGEST:"), file);
  }
});

test("render refuses missing, extra, scalar and malformed platform configs", () => {
  for (const value of [undefined, digest("b"), {}, { "linux/amd64": digest("b") }, { ...configs, "linux/386": digest("d") }, { ...configs, "linux/arm64": "not-a-digest" }]) {
    assert.throws(() => renderDeployment({ ...input, maiaConfigDigests: value }), /platform|config/i);
  }
});

test("the actual Python sidecar chooses native config and refuses malformed maps", () => {
  const script = [
    "import importlib.util, json, os",
    "from unittest.mock import patch",
    "spec = importlib.util.spec_from_file_location('sidecar', 'workers/maia/sidecar.py')",
    "m = importlib.util.module_from_spec(spec)",
    "spec.loader.exec_module(m)",
    "env = json.loads(" + JSON.stringify(JSON.stringify({ MAIA_IMAGE_ID: input.maiaImage, MAIA_MANIFEST_DIGEST: input.maiaManifestDigest, MAIA_PLATFORM_CONFIG_DIGESTS: JSON.stringify(configs) })) + ")",
    "with patch.dict(os.environ, env, clear=True):",
    "    for machine, expected in [('x86_64', '" + digest("b") + "'), ('aarch64', '" + digest("c") + "'), ('arm64', '" + digest("c") + "')]:",
    "        with patch('platform.machine', return_value=machine):",
    "            assert json.loads(m.container_identity())['configDigest'] == expected",
    "    with patch('platform.machine', return_value='mips'):",
    "        assert 'unavailable' in json.loads(m.container_identity())",
    "    for bad in " + JSON.stringify(["{", "{}", JSON.stringify({ "linux/amd64": "bad" }), JSON.stringify({ ...configs, "linux/386": digest("d") })]) + ":",
    "        os.environ['MAIA_PLATFORM_CONFIG_DIGESTS'] = bad",
    "        os.environ['MAIA_CONFIG_DIGEST'] = '" + digest("b") + "'",
    "        assert 'unavailable' in json.loads(m.container_identity())",
  ].join("\n");
  const result = spawnSync("python3", ["-B", "-c", script], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || String(result.error));
});
