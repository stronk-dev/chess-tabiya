// DISPOSABLE research harness — R5 (planning/campaign-research-queue.md).
// Not production code. Asks whether the Maia path has a state-carryover exposure
// equivalent to D35 (strong_engine sends no ucinewgame / Clear Hash).
//
// The candidate: OpponentSelector #maia (opponent-selector.ts:477-488) emits
// `setoption name Elo` only when policy.targetElo is defined AND the engine
// advertises Elo. Temperature, TopP and MultiPV are sent unconditionally by both
// call sites; Elo is not. A UCI option persists in the process until overwritten,
// and EngineSupervisor keeps one long-lived process per engine, so a request with
// no targetElo inherits whatever band the previous request left behind.
import { createHash } from "node:crypto";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";

import { EngineSupervisor } from "../../apps/server/src/engine-supervisor.js";
import { DEFAULT_MAIA_IMAGE, maiaDockerSpec } from "../../apps/server/src/maia.js";

interface Position {
  readonly fen: string;
  readonly legalUci: readonly string[];
  readonly startFen: string;
  readonly historyUci: readonly string[];
}

function positionCommand(position: Position): string {
  return `position fen ${position.startFen}${
    position.historyUci.length === 0 ? "" : ` moves ${position.historyUci.join(" ")}`
  }`;
}

function infoDigest(lines: readonly string[]): string {
  const info = lines.filter(
    (line) => line.startsWith("info ") && / multipv \d+/u.test(line) && / pv /u.test(line),
  );
  return createHash("sha256").update(info.join("\n")).digest("hex").slice(0, 16);
}

async function probe(
  supervisor: EngineSupervisor,
  position: Position,
  elo: number | null,
): Promise<{ digest: string; bestmove: string | null; lines: readonly string[] }> {
  const multiPv = Math.max(8, position.legalUci.length);
  const lines = await supervisor.execute("maia-5m", {
    commands: [
      ...(elo === null ? [] : [`setoption name Elo value ${elo}`]),
      "setoption name Temperature value 0.8",
      "setoption name TopP value 0.92",
      `setoption name MultiPV value ${multiPv}`,
      positionCommand(position),
      "go",
    ],
    until: (line) => line.startsWith("bestmove "),
    timeoutMs: 120_000,
  });
  return {
    digest: infoDigest(lines),
    bestmove: /^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)\b/.exec(
      lines.find((line) => line.startsWith("bestmove ")) ?? "",
    )?.[1] ?? null,
    lines,
  };
}

async function main(): Promise<void> {
  const probeSetPath = process.argv[2]!;
  const outPath = process.argv[3]!;
  const testCount = Number(process.argv[4] ?? "6");

  const all = (
    JSON.parse(readFileSync(probeSetPath, "utf8")) as { positions: Position[] }
  ).positions.filter((entry) => entry.legalUci.length > 4);
  const stride = all.length / Math.min(testCount, all.length);
  const targets = Array.from(
    { length: Math.min(testCount, all.length) },
    (_, index) => all[Math.floor(index * stride)]!,
  );
  const setter = all.at(-1)!;

  writeFileSync(outPath, "");

  for (const target of targets) {
    if (target.fen === setter.fen) continue;
    // A fresh process per target: the "no Elo ever sent" reading must be the
    // engine's own default, not a leftover from an earlier target.
    const supervisor = new EngineSupervisor([
      maiaDockerSpec({ image: process.env.MAIA_IMAGE ?? DEFAULT_MAIA_IMAGE, transcriptCapacity: 8_192 }),
    ]);
    await supervisor.start("maia-5m");
    try {
      const pristine = await probe(supervisor, target, null);
      const bands: Record<string, string> = {};
      for (const band of [1100, 1500, 1900]) {
        bands[String(band)] = (await probe(supervisor, target, band)).digest;
      }
      const after: Record<string, string> = {};
      for (const band of [1100, 1900]) {
        await probe(supervisor, setter, band); // a different position, at this band
        after[String(band)] = (await probe(supervisor, target, null)).digest;
      }
      // Control: after setting a band on the setter, ask the target WITH its band.
      await probe(supervisor, setter, 1100);
      const guarded1900 = (await probe(supervisor, target, 1900)).digest;

      appendFileSync(
        outPath,
        `${JSON.stringify({
          kind: "carryover",
          fen: target.fen,
          setterFen: setter.fen,
          pristineNoElo: pristine.digest,
          bands,
          afterSetterBand: after,
          guardedTargetAt1900AfterSetter1100: guarded1900,
        })}\n`,
      );
      process.stderr.write(`carryover done ${target.fen}\n`);
    } finally {
      await supervisor.shutdown();
    }
  }
}

void main();
