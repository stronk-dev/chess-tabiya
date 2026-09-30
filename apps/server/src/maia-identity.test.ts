import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { describe, expect, it } from "vitest";
import { maiaContainerProbe, maiaNetworkSpec, parseMaiaContainerIdentity } from "./maia.js";
// @ts-expect-error release tools are JS; their renderer is exercised without a second TS replica.
import { renderDeployment } from "../../../tools/render-deployment.mjs";

const digest = (char: string): string => "sha256:" + char.repeat(64);
const configs = { "linux/amd64": digest("b"), "linux/arm64": digest("c") };

async function probeProfile(file: string, malformed = false): Promise<void> {
  const artifacts = renderDeployment({
    serverImage: "fixture.invalid/server@" + digest("a"), maiaImage: "fixture.invalid/maia@" + digest("a"),
    maiaManifestDigest: digest("a"), maiaConfigDigests: configs,
  }) as Record<string, string>;
  const text = artifacts[file]!;
  const imageId = /^\s+MAIA_IMAGE_ID: (.+)$/mu.exec(text)![1]!;
  const manifestDigest = /^\s+MAIA_MANIFEST_DIGEST: (.+)$/mu.exec(text)![1]!;
  const encoded = /^\s+MAIA_PLATFORM_CONFIG_DIGESTS: '(.+)'$/mu.exec(text)![1]!;
  const dir = mkdtempSync(join(tmpdir(), "tabiya-maia-identity-"));
  const child = spawn("python3", ["-B", "tools/release/fixtures/maia-identity-sidecar.py", join(dir, "ready")], {
    env: { ...process.env, MAIA_IMAGE_ID: imageId, MAIA_MANIFEST_DIGEST: manifestDigest,
      MAIA_PLATFORM_CONFIG_DIGESTS: malformed ? "{}" : encoded, MAIA_CONFIG_DIGEST: digest("b") },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const exited = once(child, "exit");
  let stderr = "";
  child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
  try {
    const port = await new Promise<number>((resolve, reject) => {
      let output = "";
      const timer = setTimeout(() => reject(new Error("sidecar readiness deadline: " + stderr)), 3_000);
      child.once("error", (error) => { clearTimeout(timer); reject(error); });
      child.once("exit", () => { clearTimeout(timer); reject(new Error("sidecar exited: " + stderr)); });
      child.stdout.on("data", (chunk: Buffer) => {
        output += chunk.toString();
        const match = /^PORT:(\d+)$/mu.exec(output);
        if (match) { clearTimeout(timer); resolve(Number(match[1])); }
      });
    });
    const capture = await maiaContainerProbe("127.0.0.1", port)(maiaNetworkSpec("127.0.0.1", port));
    if (malformed) expect(capture).toBeNull();
    else {
      const configDigest = process.arch === "arm64" ? configs["linux/arm64"] : configs["linux/amd64"];
      expect(capture).toEqual(parseMaiaContainerIdentity(JSON.stringify({ runtime: "oci", imageId, manifestDigest, configDigest })));
      expect(capture?.kind).toBe("container");
    }
  } finally {
    child.kill("SIGTERM");
    await exited;
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("release metadata → actual Python sidecar → production artifact probe (no inference)", () => {
  for (const file of ["compose.yaml", "compose.appliance.yaml", "compose.hosted.yaml"]) {
    it(file + " captures native identity over the real TCP sidecar protocol", () => probeProfile(file));
  }
  it("malformed release identity cannot borrow a valid legacy scalar", () => probeProfile("compose.appliance.yaml", true));
});
