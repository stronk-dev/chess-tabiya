import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer, type AddressInfo } from "node:net";

import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAIA_IMAGE,
  MAIA_TCP_BRIDGE_SCRIPT,
  MAIA3_BAND_RANGE,
  MAIA3_MODEL_ID,
  MAIA3_SOURCE_COMMIT,
  maiaDockerSpec,
  maiaNetworkSpec,
} from "./maia.js";

const dockerfile = readFileSync(
  new URL("../../../workers/maia/Dockerfile", import.meta.url),
  "utf8",
);
const policyPatch = readFileSync(
  new URL(
    "../../../workers/maia/patches/maia3-uci-policy-mass.patch",
    import.meta.url,
  ),
  "utf8",
);

describe("Maia production sidecar definition", () => {
  it("pins source/model and makes history conditioning non-optional", () => {
    expect(dockerfile).toContain(`ARG MAIA3_COMMIT=${MAIA3_SOURCE_COMMIT}`);
    expect(dockerfile).toContain(MAIA3_MODEL_ID.split("@")[1]);
    expect(dockerfile).toContain(
      'ENTRYPOINT ["maia3-uci", "--model", "5m", "--checkpoint-path", "/opt/maia3-models/maia3-5m.pt", "--use-uci-history"]',
    );
    expect(dockerfile).toContain("ENV HF_HUB_OFFLINE=1");
    // rfc/verifiable-runtime-distribution.md §2: a checksum-locked archive and a digest-verified
    // patch replace the live `git clone`; the dry run still refuses a patch that does not apply.
    expect(dockerfile).not.toContain("git clone");
    expect(dockerfile).toContain(
      "patch -d /opt/maia3 -p1 --dry-run < /inputs/maia3-uci-policy-mass.patch",
    );
    expect(policyPatch).toContain("policy {float(item['policy']):.12g}");
    expect(policyPatch).not.toContain("policy {cp}");
  });

  it("configures Docker supervision and records first-contact seed absence", () => {
    const digest = `sha256:${"a".repeat(64)}`;
    const spec = maiaDockerSpec({ containerDigest: digest });

    expect(spec).toMatchObject({
      id: "maia-5m",
      kind: "opponent",
      command: "docker",
      args: ["run", "--rm", "-i", DEFAULT_MAIA_IMAGE],
      name: "Maia3",
      version: MAIA3_SOURCE_COMMIT,
      modelId: MAIA3_MODEL_ID,
      bandRange: MAIA3_BAND_RANGE,
      containerDigest: digest,
    });
    expect(spec.seedOption).toBeUndefined();
    expect(spec.bandOption).toBe("Elo");
    expect(spec.bandRange).toEqual({ min: 1000, max: 2400 });
    expect(maiaNetworkSpec("maia", 7000)).toMatchObject({
      command: process.execPath,
      args: ["-e", MAIA_TCP_BRIDGE_SCRIPT, "maia", "7000"],
      bandOption: "Elo",
      bandRange: { min: 1000, max: 2400 },
    });
  });

  it("bridges UCI lines over TCP with the server's own Node runtime, not an OS netcat package", async () => {
    const server = createServer((socket) => {
      socket.setEncoding("utf8");
      socket.on("data", (chunk: string) => {
        for (const line of chunk.split("\n").filter(Boolean)) socket.write(`echo ${line}\n`);
        if (chunk.includes("quit")) socket.end();
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    const spec = maiaNetworkSpec("127.0.0.1", port);
    const child = spawn(spec.command, [...(spec.args ?? [])], { stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => { output += chunk; });
    child.stdin.write("uci\n");
    child.stdin.write("quit\n");
    const code = await new Promise<number | null>((resolve) => child.once("exit", resolve));
    server.close();
    expect(code).toBe(0);
    expect(output).toBe("echo uci\necho quit\n");
  });
});
