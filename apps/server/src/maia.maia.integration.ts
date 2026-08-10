import { readFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { isNormal } from "chessops/types";
import { parseUci } from "chessops/util";
import { afterEach, describe, expect, it } from "vitest";

import { EngineSupervisor } from "./engine-supervisor.js";
import { DEFAULT_MAIA_IMAGE, maiaDockerSpec } from "./maia.js";
import { OpponentSelector } from "./opponent-selector.js";

if (process.env.INTEGRATION !== "maia") {
  throw new Error("Maia integration requires INTEGRATION=maia");
}

describe("Maia production sidecar integration", () => {
  const supervisors: EngineSupervisor[] = [];

  afterEach(async () => {
    await Promise.all(supervisors.splice(0).map((supervisor) => supervisor.shutdown()));
  });

  it("plays an uncached 20-ply human-common continuation with full history every request", async () => {
    const fixture = JSON.parse(
      readFileSync(
        new URL("../../../schemas/drill_pack.example.json", import.meta.url),
        "utf8",
      ),
    ) as {
      start: { fen: string };
      spine: readonly { moveUci: string }[];
    };
    const supervisor = new EngineSupervisor([
      maiaDockerSpec({
        image: process.env.MAIA_IMAGE ?? DEFAULT_MAIA_IMAGE,
        ...(process.env.MAIA_IMAGE_DIGEST === undefined
          ? {}
          : { containerDigest: process.env.MAIA_IMAGE_DIGEST }),
        transcriptCapacity: 4_096,
      }),
    ]);
    supervisors.push(supervisor);

    const identity = await supervisor.start("maia-5m");
    expect(identity).toMatchObject({
      name: "Maia3",
      modelId: expect.stringContaining("maia3-5m@"),
      seedHonored: false,
    });

    const selector = new OpponentSelector(supervisor);
    const firstSpineMove = fixture.spine[0]!.moveUci;
    const position = Chess.fromSetup(parseFen(fixture.start.fen).unwrap()).unwrap();
    const authored = parseUci(firstSpineMove);
    if (!authored || !isNormal(authored) || !position.isLegal(authored)) {
      throw new Error("Amended fixture's first spine move is not legal");
    }
    position.play(authored);
    const historyUci = [firstSpineMove];
    const expectedPositionCommands: string[] = [];
    const latenciesMs: number[] = [];

    for (let ply = 0; ply < 20; ply += 1) {
      expectedPositionCommands.push(
        `position fen ${fixture.start.fen} moves ${historyUci.join(" ")}`,
      );
      const startedAt = performance.now();
      const selection = await selector.select({
        startFen: fixture.start.fen,
        historyUci: [...historyUci],
        policy: {
          mode: "human_common",
          policyConfigDigest: `sha256:${"c".repeat(64)}`,
          targetElo: 1800,
        },
        seed: 91,
      });
      latenciesMs.push(performance.now() - startedAt);
      const move = parseUci(selection.moveUci);
      expect(move && isNormal(move) && position.isLegal(move)).toBe(true);
      position.play(move!);
      historyUci.push(selection.moveUci);
    }

    const sentPositions = supervisor
      .transcript("maia-5m")
      .filter(
        (entry) => entry.direction === "sent" && entry.line.startsWith("position "),
      )
      .map((entry) => entry.line);
    expect(sentPositions).toEqual(expectedPositionCommands);
    expect(selector.cacheSize()).toBe(20);

    const sorted = [...latenciesMs].sort((left, right) => left - right);
    const percentile = (fraction: number): number =>
      sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)]!;
    process.stdout.write(
      `MAIA_UNCACHED_LATENCY ${JSON.stringify({
        samples: latenciesMs.length,
        medianMs: Number(percentile(0.5).toFixed(1)),
        p95Ms: Number(percentile(0.95).toFixed(1)),
        maxMs: Number(sorted.at(-1)!.toFixed(1)),
      })}\n`,
    );
  });
});
