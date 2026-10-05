// Disposable D3407/D2236 pricing instrument; not a bot-calibration or grading authority.
import { createReadStream } from "node:fs";
import { open, readFile, type FileHandle } from "node:fs/promises";
import { createInterface } from "node:readline";
import { isDeepStrictEqual } from "node:util";
import type { EngineSupervisor } from "../../apps/server/src/engine-supervisor.js";
import type { ProviderEngineClient } from "../../apps/server/src/provider-operations.js";
import {
  assertProviderDelivery, digestEngineOptionImage, exactLegalMoves,
  parsePersistedProviderDelivery, parserImplementationDigest, serializeProviderDelivery,
  type EngineOptionImage, type ProviderDelivery, type StockfishActualIdentity, type StockfishLegalRootTable,
} from "../../packages/runtime/src/index.js";
import manifest from "./manifest.json";
import { digest, type HumanDecision } from "./population.js";

export const OPERATION = "stockfish.legal_root_table@1" as const;
export const RESET_COMMANDS = ["ucinewgame", "setoption name Clear Hash", "isready"] as const;
export const TIMEOUT_MS = 60_000;
export type RootDelivery = ProviderDelivery<StockfishLegalRootTable, typeof OPERATION>;
export interface ResetWitness {
  readonly commands: readonly string[];
  readonly replies: readonly string[];
  readonly generation: number;
}
export interface EvaluationHeader {
  readonly schema: "tabiya.research.bot-human-reference-pricing.v1";
  readonly manifestDigest: string;
  readonly populationDigest: string;
  readonly instrumentDigest: string;
  readonly analysisAuthority: typeof manifest.analysisAuthority;
  readonly actualIdentity: StockfishActualIdentity;
  readonly optionImage: EngineOptionImage;
  readonly parserImplementationDigest: string;
}
export interface EvaluationRecord {
  readonly index: number;
  readonly decisionDigest: string;
  readonly reset: ResetWitness;
  readonly source: ReturnType<typeof serializeProviderDelivery<typeof OPERATION>>;
}

export function rootRequest(fen: string) {
  return {
    fen, bound: { kind: "depth" as const, value: manifest.analysisAuthority.bound.value },
    requestedWidth: "all_legal" as const, moveIdentity: "chessops-king-takes-rook@1" as const,
    requestedEngine: { id: "stockfish-analysis", version: "18" }, timeoutMs: TIMEOUT_MS,
  };
}

/** Bind the literal executor closure, not a hand-written instrument version label. */
export async function instrumentDigest(): Promise<string> {
  const files = [
    "tools/d2236-bot-calibration-verdict-contract/evaluation.ts",
    "tools/d2236-bot-calibration-verdict-contract/evaluate.ts",
    "tools/d2236-bot-calibration-verdict-contract/receipt.ts",
    "tools/d2236-bot-calibration-verdict-contract/population.ts",
    "apps/server/src/engine-supervisor.ts", "apps/server/src/provider-exchange.ts",
    "apps/server/src/provider-operations.ts",
  ];
  return digest(JSON.stringify(await Promise.all(files.map(async (file) => [file, digest(await readFile(file))]))));
}

export function assertOptionImage(image: EngineOptionImage): void {
  if (JSON.stringify(image.appliedSetoptionCommands) !== JSON.stringify([
    `setoption name Threads value ${manifest.analysisAuthority.threads}`,
    `setoption name Hash value ${manifest.analysisAuthority.hashMiB}`,
  ]) || !image.advertisedUciOptionLines.includes("option name Clear Hash type button")) {
    throw new TypeError("frozen calibration engine options/reset are not captured");
  }
}

export function freshSearchClient(
  engines: Pick<EngineSupervisor, "start" | "health" | "execute" | "exchange" | "establishedGeneration">,
  onReset: (reset: ResetWitness) => void, onImage: (image: EngineOptionImage) => void,
): ProviderEngineClient {
  return {
    start: (id) => engines.start(id), health: (id) => engines.health(id),
    establishedGeneration: (id) => engines.establishedGeneration(id),
    async exchange(id, request) {
      const generation = engines.establishedGeneration(id);
      if (generation === null || !engines.health(id).options?.some((option) => option.name === "Clear Hash" && option.type === "button")) throw new TypeError("no established clearable analysis engine");
      const replies = await engines.execute(id, {
        commands: RESET_COMMANDS, until: (line) => line === "readyok", timeoutMs: request.timeoutMs,
        ...(request.signal === undefined ? {} : { signal: request.signal }),
      });
      if (replies.at(-1) !== "readyok" || engines.establishedGeneration(id) !== generation) throw new TypeError("fresh-search reset failed");
      onReset({ commands: RESET_COMMANDS, replies, generation });
      const capture = await engines.exchange(id, request);
      if (capture.generation !== generation) throw new TypeError("engine generation changed across reset/search");
      assertOptionImage(capture.optionImage);
      onImage(capture.optionImage);
      return capture;
    },
  };
}

export function makeHeader(populationDigest: string, executorDigest: string, actualIdentity: StockfishActualIdentity, optionImage: EngineOptionImage): EvaluationHeader {
  assertOptionImage(optionImage);
  if (actualIdentity.id !== "stockfish-analysis" || actualIdentity.name !== "Stockfish" || actualIdentity.version !== "18"
    || actualIdentity.uciOptionsDigest !== digestEngineOptionImage(optionImage)) throw new TypeError("wrong analysis engine identity");
  return {
    schema: "tabiya.research.bot-human-reference-pricing.v1", manifestDigest: digest(JSON.stringify(manifest)),
    populationDigest, instrumentDigest: executorDigest, analysisAuthority: manifest.analysisAuthority,
    actualIdentity, optionImage, parserImplementationDigest: parserImplementationDigest("parse.stockfish_legal_root_table@1"),
  };
}

export function assertHeader(value: EvaluationHeader, populationDigest: string, executorDigest: string): void {
  if (JSON.stringify(value) !== JSON.stringify(makeHeader(populationDigest, executorDigest, value.actualIdentity, value.optionImage))) {
    throw new TypeError("evaluation authority/header drift");
  }
}

export function assertRoot(header: EvaluationHeader, decision: HumanDecision, delivery: RootDelivery, reset: ResetWitness): void {
  assertProviderDelivery(OPERATION, delivery);
  if (delivery.kind !== "live" || !isDeepStrictEqual(delivery.payload.request, rootRequest(decision.fen))
    || !isDeepStrictEqual(delivery.acquisition.actualIdentity, header.actualIdentity)
    || delivery.payloadReceipt.parserImplementationDigest !== header.parserImplementationDigest
    || delivery.payload.scoreFrame !== "root_side_to_move") throw new TypeError("crossed calibration root/source identity");
  if (Object.keys(reset).sort().join(",") !== "commands,generation,replies"
    || JSON.stringify(reset.commands) !== JSON.stringify(RESET_COMMANDS) || reset.replies.at(-1) !== "readyok"
    || !Number.isSafeInteger(reset.generation) || reset.generation < 1
    || reset.generation !== delivery.acquisition.generation) throw new TypeError("missing same-generation fresh-search barrier");
  const legal = exactLegalMoves(decision.fen).map((move) => move.uci).sort();
  const rows = delivery.payload.rows;
  if (JSON.stringify(rows.map((row) => row.moveUci).sort()) !== JSON.stringify(legal)
    || !rows.some((row) => row.moveUci === decision.moveUci)
    || rows.some((row) => row.reachedDepth !== manifest.analysisAuthority.bound.value
      || (row.score.kind !== "centipawns" && row.score.kind !== "mate"))) {
    throw new TypeError("incomplete or reinterpreted legal candidate table");
  }
}

export function makeRecord(header: EvaluationHeader, index: number, decision: HumanDecision, delivery: RootDelivery, reset: ResetWitness): EvaluationRecord {
  assertRoot(header, decision, delivery, reset);
  return { index, decisionDigest: digest(JSON.stringify(decision)), reset, source: serializeProviderDelivery(OPERATION, delivery) };
}

export interface EvaluationCounts {
  decisions: number; candidateRows: number; centipawnRows: number; mateRows: number;
  playedCentipawn: number; playedMate: number;
}
const emptyCounts = (): EvaluationCounts => ({ decisions: 0, candidateRows: 0, centipawnRows: 0, mateRows: 0, playedCentipawn: 0, playedMate: 0 });
export function countRoot(counts: EvaluationCounts, decision: HumanDecision, delivery: RootDelivery): void {
  counts.decisions += 1;
  for (const row of delivery.payload.rows) {
    counts.candidateRows += 1;
    if (row.score.kind === "centipawns") counts.centipawnRows += 1; else counts.mateRows += 1;
    if (row.moveUci === decision.moveUci) {
      if (row.score.kind === "centipawns") counts.playedCentipawn += 1; else counts.playedMate += 1;
    }
  }
}

/** Ordered append-only journal. Reload every whole sealed source; never trust a cached row count. */
export async function inspectJournal(path: string, rows: readonly HumanDecision[], populationDigest: string, executorDigest: string) {
  const counts = emptyCounts();
  const cells = new Map<string, EvaluationCounts>();
  let header: EvaluationHeader | undefined;
  let chain = "";
  const stream = createReadStream(path);
  let lastByte: number | undefined;
  stream.on("data", (chunk) => { lastByte = (typeof chunk === "string" ? Buffer.from(chunk) : chunk).at(-1); });
  try {
    for await (const line of createInterface({ input: stream, crlfDelay: Infinity })) {
      const envelope = JSON.parse(line) as { previous: string; value: EvaluationHeader | EvaluationRecord; digest: string };
      if (Object.keys(envelope).sort().join(",") !== "digest,previous,value" || envelope.previous !== chain
        || envelope.digest !== digest(JSON.stringify({ previous: chain, value: envelope.value }))) throw new TypeError("evaluation journal chain mismatch");
      if (header === undefined) {
        header = envelope.value as EvaluationHeader;
        assertHeader(header, populationDigest, executorDigest);
      } else {
        const record = envelope.value as EvaluationRecord;
        const decision = rows[counts.decisions];
        if (!decision || Object.keys(record).sort().join(",") !== "decisionDigest,index,reset,source"
          || record.index !== counts.decisions || record.decisionDigest !== digest(JSON.stringify(decision))) throw new TypeError("journal decision order/identity mismatch");
        const delivery = parsePersistedProviderDelivery(OPERATION, record.source);
        assertRoot(header, decision, delivery, record.reset);
        countRoot(counts, decision, delivery);
        const cell = `${decision.band}/${decision.window}`;
        const cellCounts = cells.get(cell) ?? emptyCounts();
        countRoot(cellCounts, decision, delivery);
        cells.set(cell, cellCounts);
      }
      chain = envelope.digest;
    }
  } finally { stream.destroy(); }
  if (!header || lastByte !== 10) throw new TypeError("empty or unterminated evaluation journal; preserve and investigate");
  return { header, chain, counts, cells: [...cells].map(([cell, values]) => ({ cell, ...values })) };
}

/** fsync each complete line before it becomes a resumable decision. A torn line is refused. */
export class EvaluationWriter {
  private constructor(private readonly handle: FileHandle, private chain: string) {}
  static async create(path: string, header: EvaluationHeader): Promise<EvaluationWriter> {
    const writer = new EvaluationWriter(await open(path, "wx"), "");
    try { await writer.append(header); return writer; } catch (error) { await writer.close(); throw error; }
  }
  static async resume(path: string, chain: string): Promise<EvaluationWriter> {
    return new EvaluationWriter(await open(path, "a"), chain);
  }
  async append(value: EvaluationHeader | EvaluationRecord): Promise<void> {
    const next = digest(JSON.stringify({ previous: this.chain, value }));
    await this.handle.appendFile(`${JSON.stringify({ previous: this.chain, value, digest: next })}\n`);
    await this.handle.sync();
    this.chain = next;
  }
  async close(): Promise<void> { await this.handle.close(); }
}
