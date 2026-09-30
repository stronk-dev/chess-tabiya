import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { connect } from "node:net";
import { describe, expect, it } from "vitest";
import { maiaContainerProbe, maiaNetworkSpec, parseMaiaContainerIdentity } from "./maia.js";
// @ts-expect-error release tools are JS; their renderer is exercised without a second TS replica.
import { renderDeployment } from "../../../tools/render-deployment.mjs";

const digest = (char: string): string => "sha256:" + char.repeat(64);
const configs = { "linux/amd64": digest("b"), "linux/arm64": digest("c") };

async function probeProfile(file: string, malformed = false, fragmented = false, abortedThenUci = false): Promise<void> {
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
    if (abortedThenUci) {
      await new Promise<void>((resolve, reject) => {
        const socket = connect({ host: "127.0.0.1", port });
        let output = "";
        const timer = setTimeout(() => finish(new Error("prefix consumption deadline")), 1_500);
        const finish = (error?: Error): void => {
          clearTimeout(timer);
          child.stdout.off("data", onRead);
          socket.destroy();
          if (error) reject(error); else resolve();
        };
        const onRead = (chunk: Buffer): void => {
          output += chunk.toString();
          if (output.includes("RECEIVED:")) finish();
        };
        child.stdout.on("data", onRead);
        socket.once("connect", () => socket.write("tabiya-"));
        socket.once("error", finish);
      });
      const reply = await new Promise<string>((resolve, reject) => {
        const socket = connect({ host: "127.0.0.1", port });
        let output = "";
        const timer = setTimeout(() => finish(new Error("UCI response deadline: " + output)), 1_500);
        const finish = (error?: Error): void => {
          clearTimeout(timer);
          socket.destroy();
          if (error) reject(error); else resolve(output);
        };
        socket.once("connect", () => socket.write("uci\nisready\n"));
        socket.setEncoding("utf8");
        socket.on("data", (chunk: string) => { output += chunk; if (output.includes("readyok\n")) finish(); });
        socket.once("error", finish);
      });
      expect(reply).toBe("uciok\nreadyok\n");
    }
    const capture = fragmented ? await new Promise<ReturnType<typeof parseMaiaContainerIdentity>>((resolve, reject) => {
      const socket = connect({ host: "127.0.0.1", port });
      let output = "", received = "", sentSuffix = false;
      const timer = setTimeout(() => finish(new Error("fragmented identity response deadline")), 1_500);
      const onRead = (chunk: Buffer): void => {
        received += chunk.toString();
        // The fixture observes the real sidecar receiving the prefix before the suffix is sent.
        // This establishes actual fragmentation without relying on an arbitrary sleep.
        if (!sentSuffix && received.includes("RECEIVED:")) {
          sentSuffix = true;
          socket.write("identity\n");
        }
      };
      const finish = (error?: Error): void => {
        clearTimeout(timer);
        child.stdout.off("data", onRead);
        socket.destroy();
        if (error) reject(error);
        else resolve(parseMaiaContainerIdentity(output.slice(0, output.indexOf("\n"))));
      };
      child.stdout.on("data", onRead);
      socket.once("connect", () => socket.write("tabiya-"));
      socket.setEncoding("utf8");
      socket.on("data", (chunk: string) => { output += chunk; if (output.includes("\n")) finish(); });
      socket.once("error", finish);
    }) : await maiaContainerProbe("127.0.0.1", port)(maiaNetworkSpec("127.0.0.1", port));
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
  it("an identity request split across actual TCP receives still captures the same artifact", () => probeProfile("compose.appliance.yaml", false, true));
  it("an aborted probe cannot contaminate the next coalesced UCI commands or identity", () => probeProfile("compose.appliance.yaml", false, false, true));
});
