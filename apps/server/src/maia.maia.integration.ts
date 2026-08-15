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
      expect(selection.candidates?.some((candidate) => candidate.mass !== undefined)).toBe(true);
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

  it("reports policy-vector stability across twenty identical requests", async () => {
    const supervisor = new EngineSupervisor([
      maiaDockerSpec({
        image: process.env.MAIA_IMAGE ?? DEFAULT_MAIA_IMAGE,
        ...(process.env.MAIA_IMAGE_DIGEST === undefined
          ? {}
          : { containerDigest: process.env.MAIA_IMAGE_DIGEST }),
      }),
    ]);
    supervisors.push(supervisor);
    await supervisor.start("maia-5m");

    const vectors: string[][] = [];
    for (let sample = 0; sample < 20; sample += 1) {
      const lines = await supervisor.execute("maia-5m", {
        commands: [
          "setoption name Elo value 1800",
          "setoption name MultiPV value 8",
          "position fen rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
          "go",
        ],
        until: (line) => line.startsWith("bestmove "),
        timeoutMs: 60_000,
      });
      vectors.push(lines.filter((line) => line.startsWith("info ") && line.includes(" policy ")));
    }
    expect(vectors.every((vector) => vector.length > 0)).toBe(true);
    const stable = vectors.slice(1).every((vector) => JSON.stringify(vector) === JSON.stringify(vectors[0]));
    process.stdout.write(`MAIA_POLICY_STABILITY ${JSON.stringify({ samples: vectors.length, byteIdentical: stable })}\n`);
  });

  it("drives distinct requested bands through the production selector command path", async () => {
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
    await supervisor.start("maia-5m");
    const selector = new OpponentSelector(supervisor);
    const position = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";

    const vectorAt = async (targetElo: 1000 | 2400, digestDigit: string) => {
      const selection = await selector.select({
        startFen: position,
        historyUci: [],
        policy: {
          mode: "human_common",
          policyConfigDigest: `sha256:${digestDigit.repeat(64)}`,
          targetElo,
        },
        seed: 91,
      });
      expect(selection.engine.eloApplied).toBe(targetElo);
      expect(selection.candidates?.every((candidate) => candidate.scoreCp !== undefined && candidate.wdl !== undefined)).toBe(true);
      process.stdout.write(`MAIA_CANDIDATE_WDL ${JSON.stringify({
        targetElo,
        rows: selection.candidates?.length ?? 0,
        sums: selection.candidates?.map((candidate) => candidate.wdl!.win + candidate.wdl!.draw + candidate.wdl!.loss) ?? [],
      })}\n`);
      return selection.candidates?.map(({ moveUci, mass }) => [moveUci, mass] as const) ?? [];
    };

    const low = await vectorAt(1000, "1");
    const high = await vectorAt(2400, "2");
    expect(low.length).toBeGreaterThan(0);
    expect(high.length).toBeGreaterThan(0);
    expect(high).not.toEqual(low);

    const sent = supervisor
      .transcript("maia-5m")
      .filter((entry) => entry.direction === "sent")
      .map((entry) => entry.line);
    for (const targetElo of [1000, 2400] as const) {
      const eloIndex = sent.indexOf(`setoption name Elo value ${targetElo}`);
      expect(eloIndex).toBeGreaterThanOrEqual(2);
      expect(sent.slice(eloIndex - 2, eloIndex)).toEqual([
        "setoption name SelfElo value 1500",
        "setoption name OppoElo value 1500",
      ]);
    }
  });
});
