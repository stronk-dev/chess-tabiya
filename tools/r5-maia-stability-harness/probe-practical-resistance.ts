// DISPOSABLE research harness — D490 (design/BACKLOG.md).
// Not production code. Re-runs the exact historical 40-root practical_resistance
// population against current production code while retaining every tablebase value.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { EngineSupervisor } from "../../apps/server/src/engine-supervisor.js";
import {
  DEFAULT_MAIA_IMAGE,
  MAIA3_MODEL_ID,
  MAIA3_SOURCE_COMMIT,
  maiaDockerSpec,
} from "../../apps/server/src/maia.js";
import { OpponentSelector } from "../../apps/server/src/opponent-selector.js";
import {
  LichessTablebaseSource,
  type TablebasePosition,
  type TablebaseSource,
} from "../../apps/server/src/tablebase.js";

interface HistoricalRoot {
  readonly fen: string;
}

interface HistoricalSummary {
  readonly wide: readonly HistoricalRoot[];
}

interface PackAttributionRow {
  readonly fen: string;
  readonly packId: string;
}

interface CachedTablebaseRow {
  readonly fen: string;
  readonly value: TablebasePosition;
}

interface SelectionResult {
  readonly kind: "selection";
  readonly moveUci: string;
  readonly candidates: readonly unknown[];
  readonly engine: unknown;
}

interface RefusalResult {
  readonly kind: "refusal";
  readonly code: string;
  readonly message: string;
}

type ProbeResult = SelectionResult | RefusalResult;

interface DockerImageInspection {
  readonly Id: string;
  readonly Config?: { readonly Labels?: Readonly<Record<string, string>> };
}

function sha256(bytes: string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

class RetainedTablebaseSource implements TablebaseSource {
  readonly kind = "lichess" as const;
  readonly #live = new LichessTablebaseSource({ timeoutMs: 20_000 });
  readonly #cache = new Map<string, TablebasePosition>();
  #lastLiveProbeAt = 0;

  constructor(
    private readonly cachePath: string,
    private readonly delayMs: number,
  ) {
    if (!existsSync(cachePath)) return;
    const rows = JSON.parse(readFileSync(cachePath, "utf8")) as readonly CachedTablebaseRow[];
    for (const row of rows) this.#cache.set(row.fen, row.value);
  }

  get retainedCount(): number {
    return this.#cache.size;
  }

  async probe(fen: string): Promise<TablebasePosition> {
    const cached = this.#cache.get(fen);
    if (cached !== undefined) return cached;

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const waitMs = Math.max(0, this.delayMs - (Date.now() - this.#lastLiveProbeAt));
      if (waitMs > 0) await sleep(waitMs);
      this.#lastLiveProbeAt = Date.now();
      try {
        const value = await this.#live.probe(fen);
        this.#cache.set(fen, value);
        this.#write();
        return value;
      } catch (error) {
        if (attempt === 3) throw error;
        // The production source retains provider failures for 60 seconds. Waiting
        // less would only replay the cached error and would not be a retry.
        await sleep(65_000);
      }
    }
    throw new Error("unreachable tablebase retry state");
  }

  #write(): void {
    const rows = [...this.#cache.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([fen, value]) => Object.freeze({ fen, value }));
    writeFileSync(this.cachePath, `${JSON.stringify(rows, null, 1)}\n`);
  }
}

function resultKey(result: ProbeResult): string {
  return result.kind === "selection"
    ? `selection:${result.moveUci}`
    : `refusal:${result.code}`;
}

async function main(): Promise<void> {
  const historicalPath = process.argv[2]!;
  const attributionPath = process.argv[3]!;
  const tablebaseCachePath = process.argv[4]!;
  const outPath = process.argv[5]!;
  const repeats = Number(process.argv[6] ?? "3");
  const delayMs = Number(process.argv[7] ?? "1200");
  const historicalBytes = readFileSync(historicalPath, "utf8");
  const attributionBytes = readFileSync(attributionPath, "utf8");
  const historical = JSON.parse(historicalBytes) as HistoricalSummary;
  const roots = historical.wide.map((row) => row.fen);
  if (roots.length !== 40 || new Set(roots).size !== 40) {
    throw new Error(`D490 requires the exact 40 unique historical roots; received ${roots.length}/${new Set(roots).size}`);
  }
  const attribution = new Map<string, string>();
  for (const line of attributionBytes.split("\n")) {
    if (line.trim() === "") continue;
    const row = JSON.parse(line) as PackAttributionRow;
    attribution.set(row.fen, row.packId);
  }
  const unattributed = roots.filter((fen) => !attribution.has(fen));
  if (unattributed.length > 0) {
    throw new Error(`D490 pack attribution omitted ${unattributed.length} historical roots`);
  }

  const image = process.env.MAIA_IMAGE ?? DEFAULT_MAIA_IMAGE;
  const inspected = (JSON.parse(execFileSync("docker", ["image", "inspect", image], { encoding: "utf8" })) as readonly DockerImageInspection[])[0];
  if (inspected === undefined) throw new Error(`Maia image ${image} has no inspection record`);
  const labels = inspected.Config?.Labels ?? {};
  if (labels["org.chess-tabiya.maia3.commit"] !== MAIA3_SOURCE_COMMIT) {
    throw new Error(`Maia image ${image} does not carry source commit ${MAIA3_SOURCE_COMMIT}`);
  }
  if (labels["org.chess-tabiya.maia3.model"] !== MAIA3_MODEL_ID) {
    throw new Error(`Maia image ${image} does not carry model ${MAIA3_MODEL_ID}`);
  }
  const tablebase = new RetainedTablebaseSource(tablebaseCachePath, delayMs);
  const supervisor = new EngineSupervisor([
    maiaDockerSpec({ image, transcriptCapacity: 8_192 }),
  ]);
  await supervisor.start("maia-5m");
  const rows: { readonly fen: string; readonly packId: string; readonly rootCategory: string; readonly repeats: readonly ProbeResult[] }[] = [];
  try {
    for (const [index, fen] of roots.entries()) {
      const rootCategory = (await tablebase.probe(fen)).category;
      const results: ProbeResult[] = [];
      for (let repeat = 0; repeat < repeats; repeat += 1) {
        const selector = new OpponentSelector(supervisor, { tablebaseSource: tablebase });
        try {
          const selection = await selector.select({
            startFen: fen,
            historyUci: [],
            policy: {
              mode: "practical_resistance",
              policyConfigDigest: `sha256:${"5".repeat(64)}`,
              targetElo: 1500,
            },
            seed: 5,
          });
          results.push(Object.freeze({
            kind: "selection",
            moveUci: selection.moveUci,
            candidates: selection.candidates,
            engine: selection.engine,
          }));
        } catch (error) {
          results.push(Object.freeze({
            kind: "refusal",
            code: (error as { code?: string }).code ?? "UNEXPECTED_ERROR",
            message: error instanceof Error ? error.message : String(error),
          }));
        }
      }
      rows.push(Object.freeze({ fen, packId: attribution.get(fen)!, rootCategory, repeats: Object.freeze(results) }));
      process.stderr.write(`[${index + 1}/40] ${resultKey(results[0]!)} tablebase=${tablebase.retainedCount}\n`);
    }
  } finally {
    await supervisor.shutdown();
  }

  const rootsByOutcome: Record<string, number> = {};
  const outcomesByRootCategory: Record<string, Record<string, number>> = {};
  const outcomesByPack: Record<string, Record<string, number>> = {};
  let inconsistentRoots = 0;
  for (const row of rows) {
    const keys = new Set(row.repeats.map(resultKey));
    if (keys.size !== 1) inconsistentRoots += 1;
    const key = keys.size === 1 ? [...keys][0]! : "mixed";
    rootsByOutcome[key] = (rootsByOutcome[key] ?? 0) + 1;
    const category = outcomesByRootCategory[row.rootCategory] ?? {};
    const coarse = key.startsWith("selection:") ? "selection" : key;
    category[coarse] = (category[coarse] ?? 0) + 1;
    outcomesByRootCategory[row.rootCategory] = category;
    const pack = outcomesByPack[row.packId] ?? {};
    pack[coarse] = (pack[coarse] ?? 0) + 1;
    outcomesByPack[row.packId] = pack;
  }
  const tablebaseBytes = readFileSync(tablebaseCachePath, "utf8");
  const report = Object.freeze({
    schema: "tabiya.research.d490-practical-resistance.v1",
    historicalPopulation: Object.freeze({
      path: historicalPath,
      sha256: sha256(historicalBytes),
      roots: roots.length,
      historicalOutcomes: Object.freeze({
        floatToleranceFailure: 30,
        practicalResistanceUndecidable: 5,
        selection: 5,
      }),
    }),
    packAttribution: Object.freeze({
      path: attributionPath,
      sha256: sha256(attributionBytes),
      matchedRoots: roots.length,
    }),
    tablebaseSource: Object.freeze({
      path: tablebaseCachePath,
      sha256: sha256(tablebaseBytes),
      positions: tablebase.retainedCount,
    }),
    maia: Object.freeze({
      image,
      imageId: inspected.Id,
      sourceCommit: MAIA3_SOURCE_COMMIT,
      modelId: MAIA3_MODEL_ID,
      band: 1500,
    }),
    repeatsPerRoot: repeats,
    rootsByOutcome: Object.freeze(Object.fromEntries(Object.entries(rootsByOutcome).sort())),
    outcomesByRootCategory: Object.freeze(Object.fromEntries(
      Object.entries(outcomesByRootCategory)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([category, outcomes]) => [category, Object.fromEntries(Object.entries(outcomes).sort())]),
    )),
    outcomesByPack: Object.freeze(Object.fromEntries(
      Object.entries(outcomesByPack)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([pack, outcomes]) => [pack, Object.fromEntries(Object.entries(outcomes).sort())]),
    )),
    inconsistentRoots,
    rows: Object.freeze(rows),
  });
  writeFileSync(outPath, `${JSON.stringify(report, null, 1)}\n`);
  process.stdout.write(`${JSON.stringify({
    roots: roots.length,
    repeats,
    tablebasePositions: tablebase.retainedCount,
    rootsByOutcome: report.rootsByOutcome,
    outcomesByRootCategory: report.outcomesByRootCategory,
    outcomesByPack: report.outcomesByPack,
    inconsistentRoots,
  }, null, 2)}\n`);
}

void main();
