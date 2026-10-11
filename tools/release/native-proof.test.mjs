// Orchestration controls, not substitutes for actual image/storage/architecture proof.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { nativeProof } from "./native-proof.mjs";

function fixture(context, platform, { findings = [], recoveryError } = {}) {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-native-proof-test-"));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const pre = join(directory, "pre");
  mkdirSync(pre);
  writeFileSync(join(pre, "pre-image.json"), JSON.stringify({ version: "1.0.0" }));
  const sbom = join(directory, "sbom.json");
  writeFileSync(sbom, "{}");
  const repository = "ghcr.io/example/chess-tabiya-server";
  const digest = `sha256:${(platform === "linux/amd64" ? "a" : "b").repeat(64)}`;
  const reference = `${repository}@${digest}`;
  const images = { server: { subject: `${repository}@sha256:${"c".repeat(64)}`, platforms: { [platform]: digest } } };
  const out = join(directory, "proof");
  const calls = [];
  const args = ["--images", JSON.stringify(images), "--platform", platform, "--pre-image", pre, "--out", out];
  const dependencies = {
    run(command, args) {
      calls.push([command, ...args]);
      if (command === "uname") return platform === "linux/amd64" ? "x86_64\n" : "aarch64\n";
      assert.equal(command, "docker");
      assert.deepEqual(args, ["pull", reference]);
      return "";
    },
    async serverProof(options) {
      calls.push(["server", options.image]);
      assert.equal(options.subject, images.server.subject);
      assert.equal(options.platform, platform);
      assert.equal(options.enforceEnvelope, true);
      assert.equal(options.licenceGateMode, "enforce");
      return { findings, sbomPath: sbom, receipt: { image: reference } };
    },
    async maiaProof() { assert.fail("no Maia image was supplied"); },
    async recoveryProof(options) {
      calls.push(["recovery", options.image]);
      assert.deepEqual(options, { image: reference });
      // The fake only verifies orchestration. Real recovery is make storage-drill.
      assert.equal(existsSync(join(out, `proof-${platform.replace("/", "-")}.json`)), false);
      if (recoveryError) throw recoveryError;
    },
  };
  return { args, dependencies, calls, out, reference };
}

for (const platform of ["linux/amd64", "linux/arm64"]) {
  test(`native ${platform} proof earns recovery on the exact pulled server image before success`, async context => {
    const f = fixture(context, platform);
    await nativeProof(f.args, f.dependencies);
    assert.deepEqual(f.calls, [["uname", "-m"], ["docker", "pull", f.reference], ["server", f.reference], ["recovery", f.reference]]);
    const proof = JSON.parse(readFileSync(join(f.out, `proof-${platform.replace("/", "-")}.json`), "utf8"));
    assert.equal(proof.platform, platform);
    assert.equal(proof.server.image, f.reference);
    assert.deepEqual(proof.findings, []);
  });
}

test("recovery failure propagates and cannot emit a successful native proof", async context => {
  const failure = new Error("restore lost the saved branch");
  const f = fixture(context, "linux/arm64", { recoveryError: failure });
  await assert.rejects(nativeProof(f.args, f.dependencies), error => error === failure);
  assert.equal(existsSync(join(f.out, "proof-linux-arm64.json")), false);
  assert.deepEqual(f.calls.at(-1), ["recovery", f.reference]);
});

test("a failed rerun removes its previous successful proof instead of leaving stale success", async context => {
  const f = fixture(context, "linux/arm64", { recoveryError: new Error("recovery failed") });
  mkdirSync(f.out);
  const proof = join(f.out, "proof-linux-arm64.json");
  writeFileSync(proof, JSON.stringify({ platform: "linux/arm64", findings: [] }));
  await assert.rejects(nativeProof(f.args, f.dependencies), /recovery failed/);
  assert.equal(existsSync(proof), false);
});

test("failed image qualification cannot run storage or be hidden by a recovery pass", async context => {
  const f = fixture(context, "linux/amd64", { findings: ["image source mismatch"] });
  await assert.rejects(nativeProof(f.args, f.dependencies), /image source mismatch/);
  assert.equal(f.calls.some(([name]) => name === "recovery"), false);
  const proof = JSON.parse(readFileSync(join(f.out, "proof-linux-amd64.json"), "utf8"));
  assert.deepEqual(proof.findings, ["image source mismatch"]);
});

test("a foreign runner cannot pull or mint proof for another architecture", async context => {
  const f = fixture(context, "linux/arm64");
  f.dependencies.run = (command, args) => { f.calls.push([command, ...args]); return "x86_64\n"; };
  await assert.rejects(nativeProof(f.args, f.dependencies), /must run on that architecture/);
  assert.deepEqual(f.calls, [["uname", "-m"]]);
  assert.equal(existsSync(f.out), false);
});
