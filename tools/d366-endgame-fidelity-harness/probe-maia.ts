// DISPOSABLE research harness — D366 (design/BACKLOG.md). Not production code.
//
// Reproduces `OpponentSelector.#maia` (apps/server/src/opponent-selector.ts:496-531)
// command for command against the repo's own EngineSupervisor and maiaDockerSpec:
// the SelfElo/OppoElo advertised defaults FIRST, then `Elo <band>` (the D91 order),
// then Temperature / TopP / MultiPV, then a history-conditioned position and a bare `go`.
// `human_common` returns Maia's sampled `bestmove` unchanged, so the `bestmove` recorded
// here is the move the shipped opponent would play.
//
// Every probe records the exact command array it sent and the raw policy token text of
// every candidate, so band application is verifiable per probe rather than assumed.
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

import { EngineSupervisor } from "../../apps/server/src/engine-supervisor.js";
import { DEFAULT_MAIA_IMAGE, maiaDockerSpec } from "../../apps/server/src/maia.js";

interface Position {
  readonly key: string;
  readonly fen: string;
  readonly packId: string;
  readonly startFen: string;
  readonly historyUci: readonly string[];
  readonly legalCount: number;
}

interface Candidate {
  readonly uci: string;
  readonly rank: number;
  readonly policyRaw: string | null;
}

// Production defaults (opponent-selector.ts:72-73).
const DEFAULT_TEMPERATURE = Number(process.env.MAIA_TEMPERATURE ?? "0.8");
const DEFAULT_TOP_P = Number(process.env.MAIA_TOPP ?? "0.92");

function parse(lines: readonly string[]): {
  readonly candidates: Candidate[];
  readonly infoLines: string[];
  readonly bestmove: string | null;
} {
  const byMove = new Map<string, Candidate>();
  const infoLines: string[] = [];
  let bestmove: string | null = null;
  for (const line of lines) {
    if (line.startsWith("bestmove ")) {
      bestmove = /^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)\b/.exec(line)?.[1] ?? null;
      continue;
    }
    if (!line.startsWith("info ")) continue;
    const rank = /\bmultipv (\d+)\b/.exec(line);
    const move = /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)\b/.exec(line);
    if (rank === null || move === null) continue;
    infoLines.push(line);
    const policy = /\bpolicy ([0-9]+(?:\.[0-9]+)?(?:e[+-]?\d+)?)\b/i.exec(line);
    byMove.set(move[1]!, { uci: move[1]!, rank: Number(rank[1]), policyRaw: policy?.[1] ?? null });
  }
  return { candidates: [...byMove.values()], infoLines, bestmove };
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

async function main(): Promise<void> {
  const setPath = process.argv[2]!;
  const outPath = process.argv[3]!;
  const bands = (process.argv[4] ?? "1100,1500,1900").split(",").map(Number);
  const repeats = Number(process.argv[5] ?? "16");

  const positions = (JSON.parse(readFileSync(setPath, "utf8")) as { positions: Position[] }).positions;

  const done = new Set<string>();
  if (existsSync(outPath)) {
    for (const line of readFileSync(outPath, "utf8").split("\n")) {
      if (line.trim() === "") continue;
      const parsed = JSON.parse(line) as { kind?: string; key?: string; band?: number; repeat?: number; error?: string };
      if (parsed.kind === "probe" && parsed.error === undefined) {
        done.add(`${parsed.key!}|${String(parsed.band)}|${String(parsed.repeat)}`);
      }
    }
    process.stderr.write(`resume: ${String(done.size)} probes already recorded\n`);
  } else {
    writeFileSync(outPath, "");
  }

  const supervisor = new EngineSupervisor([
    maiaDockerSpec({ image: process.env.MAIA_IMAGE ?? DEFAULT_MAIA_IMAGE, transcriptCapacity: 8_192 }),
  ]);
  const identity = await supervisor.start("maia-5m");
  const health = supervisor.health("maia-5m");
  appendFileSync(
    outPath,
    `${JSON.stringify({ kind: "identity", identity, options: health.options, bandRange: health.bandRange })}\n`,
  );

  // Shipped #maia: the advertised SelfElo/OppoElo defaults are sent BEFORE `Elo`
  // (opponent-selector.ts:506-514), which is the D91 fix. Mirror it, do not shortcut it.
  const optionDefault = (name: string): string | undefined =>
    health.options?.find((item) => item.name === name)?.default;
  const bandDefaults = ["SelfElo", "OppoElo"].flatMap((name) => {
    const value = optionDefault(name);
    return value === undefined ? [] : [`setoption name ${name} value ${value}`];
  });
  const multiPvMax = health.options?.find((item) => item.name === "MultiPV" && item.type === "spin")?.max;

  // Interleaved order: every repeat of a key is separated by every other key's request,
  // so any per-request state carried inside the process has a chance to show.
  const jobs: { position: Position; band: number; repeat: number }[] = [];
  for (let repeat = 0; repeat < repeats; repeat += 1) {
    for (const position of positions) for (const band of bands) jobs.push({ position, band, repeat });
  }

  let count = 0;
  for (const job of jobs) {
    const { position, band, repeat } = job;
    count += 1;
    if (done.has(`${position.key}|${String(band)}|${String(repeat)}`)) continue;
    // human_common's own width computation (opponent-selector.ts:536-539).
    const requested = Math.max(8, position.legalCount);
    const multiPv = multiPvMax === undefined ? requested : Math.min(requested, multiPvMax);
    const commands = [
      ...bandDefaults,
      `setoption name Elo value ${band}`,
      `setoption name Temperature value ${DEFAULT_TEMPERATURE}`,
      `setoption name TopP value ${DEFAULT_TOP_P}`,
      `setoption name MultiPV value ${multiPv}`,
      `position fen ${position.startFen}${position.historyUci.length === 0 ? "" : ` moves ${position.historyUci.join(" ")}`}`,
      "go",
    ];
    const startedAt = performance.now();
    try {
      const lines = await supervisor.execute("maia-5m", {
        commands,
        until: (line) => line.startsWith("bestmove "),
        timeoutMs: 120_000,
      });
      const parsed = parse(lines);
      appendFileSync(
        outPath,
        `${JSON.stringify({
          kind: "probe",
          key: position.key,
          fen: position.fen,
          packId: position.packId,
          band,
          repeat,
          multiPv,
          legalCount: position.legalCount,
          historyPlies: position.historyUci.length,
          commands,
          latencyMs: Number((performance.now() - startedAt).toFixed(1)),
          bestmove: parsed.bestmove,
          candidates: parsed.candidates,
          policyDigest: digest(
            parsed.candidates.map((c) => `${c.uci}:${c.policyRaw ?? "-"}`).sort().join("|"),
          ),
          infoDigest: digest(parsed.infoLines.join("\n")),
        })}\n`,
      );
    } catch (error) {
      appendFileSync(
        outPath,
        `${JSON.stringify({
          kind: "probe",
          key: position.key,
          fen: position.fen,
          band,
          repeat,
          error: error instanceof Error ? error.message : String(error),
        })}\n`,
      );
      process.stderr.write(`ERROR ${String(error)}\n`);
    }
    if (count % 100 === 0) process.stderr.write(`${String(count)}/${String(jobs.length)}\n`);
  }
  await supervisor.shutdown();
}

void main();
