import { afterEach, describe, expect, it } from "vitest";

import { EngineSupervisor } from "./engine-supervisor.js";
import { DEFAULT_MAIA_IMAGE, maiaDockerSpec } from "./maia.js";

if (process.env.INTEGRATION !== "maia") {
  throw new Error("Maia integration requires INTEGRATION=maia");
}

describe("Maia production sidecar integration", () => {
  const supervisors: EngineSupervisor[] = [];

  afterEach(async () => {
    await Promise.all(supervisors.splice(0).map((supervisor) => supervisor.shutdown()));
  });

  it("handshakes through the supervisor with pinned identity and history conditioning", async () => {
    const supervisor = new EngineSupervisor([
      maiaDockerSpec({
        image: process.env.MAIA_IMAGE ?? DEFAULT_MAIA_IMAGE,
        ...(process.env.MAIA_IMAGE_DIGEST === undefined
          ? {}
          : { containerDigest: process.env.MAIA_IMAGE_DIGEST }),
      }),
    ]);
    supervisors.push(supervisor);

    const identity = await supervisor.start("maia-5m");
    expect(identity).toMatchObject({
      name: "Maia3",
      modelId: expect.stringContaining("maia3-5m@"),
      seedHonored: false,
    });

    const position = "position fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 moves e2e4";
    const response = await supervisor.execute("maia-5m", {
      commands: [position, "go"],
      until: (line) => line.startsWith("bestmove "),
      timeoutMs: 60_000,
    });
    expect(response.at(-1)).toMatch(/^bestmove [a-h][1-8][a-h][1-8]/);
    const policyLines = response.filter((line) => line.startsWith("info "));
    expect(policyLines.length).toBeGreaterThan(0);
    for (const line of policyLines) {
      const match = /\bpolicy ([0-9]+(?:\.[0-9]+)?(?:e[+-]?[0-9]+)?)\b/i.exec(line);
      expect(match, line).not.toBeNull();
      expect(Number(match![1])).toBeGreaterThanOrEqual(0);
      expect(Number(match![1])).toBeLessThanOrEqual(1);
    }
    expect(supervisor.transcript("maia-5m")).toContainEqual(
      expect.objectContaining({ direction: "sent", line: position }),
    );
  });
});
