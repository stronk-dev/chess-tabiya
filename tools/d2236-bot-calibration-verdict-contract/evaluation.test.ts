import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { digestEngineOptionImage, parsePersistedProviderDelivery, type EngineOptionImage } from "../../packages/runtime/src/index.js";
import { ProviderExchangeScheduler } from "../../apps/server/src/provider-exchange.js";
import { providerOperationDescriptors } from "../../apps/server/src/provider-operations.js";
import { FakeEngines, stockfishDepthLines } from "../../apps/server/src/provider-exchange.test-support.js";
import type { EngineExchangeRequest, EngineRequest } from "../../apps/server/src/engine-supervisor.js";
import { digest, type HumanDecision } from "./population.js";
import {
  OPERATION, RESET_COMMANDS, EvaluationWriter, assertRoot, assertOptionImage, freshSearchClient,
  inspectJournal, makeHeader, makeRecord, rootRequest, type EvaluationHeader, type EvaluationRecord, type ResetWitness,
} from "./evaluation.js";

const decision: HumanDecision = { gameHash: digest("game"), selectionHash: digest("selection"), referenceHalf: 0,
  band: "1400", window: "opening-8-16", ply: 8, moveUci: "e2e4",
  fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" };
const image: EngineOptionImage = { advertisedUciOptionLines: ["option name Clear Hash type button"],
  appliedSetoptionCommands: ["setoption name Threads value 1", "setoption name Hash value 16"] };
const populationDigest = digest("test population");
const executorDigest = digest("test executor");

class FreshFake extends FakeEngines {
  events: string[] = [];
  resetReplies = ["readyok"];
  resetChangesGeneration = false;
  searchChangesGeneration = false;
  optionImage = image;
  constructor() { super(); this.version = "18"; }
  override health(id: string) { return { ...super.health(id), options: [{ name: "Clear Hash", type: "button" as const }] }; }
  async execute(_id: string, request: EngineRequest) {
    this.events.push(...request.commands);
    if (this.resetChangesGeneration) this.generation += 1;
    return this.resetReplies;
  }
  override async exchange(id: string, request: EngineExchangeRequest) {
    this.events.push(...request.commands);
    if (this.searchChangesGeneration) this.generation += 1;
    const capture = await super.exchange(id, request);
    return { ...capture, optionImage: this.optionImage, optionImageDigest: digestEngineOptionImage(this.optionImage) };
  }
}
async function acquire(fake = new FreshFake()) {
  let reset: ResetWitness | undefined;
  let observedImage: EngineOptionImage | undefined;
  const engines = freshSearchClient(fake, (value) => { reset = value; }, (value) => { observedImage = value; });
  const scheduler = new ProviderExchangeScheduler({ descriptors: providerOperationDescriptors({ engines,
    tablebaseFetch: null, explorerFetch: null, explorerToken: null }),
    maxActive: 1, maxQueued: 1, maxRetainedEntries: 1, maxRetainedWeight: 256, retentionTtlMs: 1,
    monotonicNowMs: () => performance.now(), wallNow: () => new Date().toISOString() });
  const result = await scheduler.get({ operation: OPERATION, request: rootRequest(decision.fen) }, { id: "test", budgetMs: 60_000 }, new AbortController().signal);
  return { result, reset, observedImage, fake };
}
async function valid(fake = new FreshFake()) {
  const { result, reset, observedImage } = await acquire(fake);
  if (result.kind !== "success" || !reset || !observedImage) throw new Error(`fixture refused: ${JSON.stringify(result)}`);
  const header = makeHeader(populationDigest, executorDigest, result.delivery.acquisition.actualIdentity, observedImage);
  return { header, delivery: result.delivery, reset, record: makeRecord(header, 0, decision, result.delivery, reset) };
}
async function withJournal(run: (path: string, header: EvaluationHeader, record: EvaluationRecord) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), "tabiya-calibration-pricing-"));
  const path = join(directory, "journal.jsonl");
  try {
    const { header, record } = await valid();
    const writer = await EvaluationWriter.create(path, header);
    await writer.append(record); await writer.close();
    await run(path, header, record);
  } finally { await rm(directory, { recursive: true, force: true }); }
}

describe("D3407 exact legal-root pricing and durable resume", () => {
  it("sends literal fresh-search barrier before every complete registered root exchange", async () => {
    const fake = new FreshFake();
    await valid(fake); await valid(fake);
    const one = [...RESET_COMMANDS, "setoption name UCI_ShowWDL value false", "setoption name MultiPV value 20", `position fen ${decision.fen}`, "go depth 8"];
    expect(fake.events).toEqual([...one, ...one]);
    expect(fake.calls.every((request) => request.resetCommands.includes("setoption name MultiPV value 1"))).toBe(true);
  });
  it("preserves positive and negative mate scores as separate typed domains", async () => {
    const fake = new FreshFake();
    fake.respond = (request) => stockfishDepthLines(request).map((line, index) => index === 0 ? line.replace(/score cp -?\d+/u, "score mate 2") : index === 1 ? line.replace(/score cp -?\d+/u, "score mate -3") : line);
    const { header, record } = await valid(fake);
    const delivery = parsePersistedProviderDelivery(OPERATION, record.source);
    assertRoot(header, decision, delivery, record.reset);
    expect(delivery.payload.rows[0]!.score).toEqual({ kind: "mate", outcome: "root_mates", distance: 2, unit: "moves" });
    expect(delivery.payload.rows[1]!.score).toEqual({ kind: "mate", outcome: "root_is_mated", distance: 3, unit: "moves" });
  });
  it.each(["missing", "duplicate", "wrong-depth", "bounded", "illegal-pv"])("refuses %s candidate-table evidence", async (mode) => {
    const fake = new FreshFake();
    fake.respond = (request) => {
      const lines = [...stockfishDepthLines(request)];
      if (mode === "missing") lines.splice(0, 1);
      if (mode === "duplicate") lines[1] = lines[0]!.replace("multipv 1", "multipv 2");
      if (mode === "wrong-depth") lines[0] = lines[0]!.replace("depth 8", "depth 7");
      if (mode === "bounded") lines[0] = lines[0]!.replace(" pv ", " lowerbound pv ");
      if (mode === "illegal-pv") lines[0] = lines[0]!.replace(/ pv .+$/u, " pv a1a8");
      return lines;
    };
    expect((await acquire(fake)).result.kind).toBe("source_failure");
  });
  it.each(["no-ready", "reset-generation", "search-generation", "wrong-options", "wrong-version"])("refuses %s rather than saving a calibration row", async (mode) => {
    const fake = new FreshFake();
    if (mode === "no-ready") fake.resetReplies = [];
    if (mode === "reset-generation") fake.resetChangesGeneration = true;
    if (mode === "search-generation") fake.searchChangesGeneration = true;
    if (mode === "wrong-options") fake.optionImage = { ...image, appliedSetoptionCommands: ["setoption name Threads value 2", "setoption name Hash value 16"] };
    if (mode === "wrong-version") fake.version = "19";
    expect((await acquire(fake)).result.kind).toBe("source_failure");
  });
  it("refuses reset/image and position cross-wiring even with a genuinely sealed source", async () => {
    const { header, delivery, reset } = await valid();
    expect(() => assertRoot(header, { ...decision, fen: decision.fen.replace(" 0 1", " 1 1") }, delivery, reset)).toThrow();
    expect(() => assertRoot(header, decision, delivery, { ...reset, generation: 2 })).toThrow();
    expect(() => assertRoot(header, decision, delivery, { ...reset, commands: ["isready"] })).toThrow();
    expect(() => assertOptionImage({ ...image, advertisedUciOptionLines: [] })).toThrow();
  });
  it("reparses the whole durable provider source and resumes in exact decision order", async () => {
    await withJournal(async (path, header, record) => {
      const prefix = await inspectJournal(path, [decision, decision], populationDigest, executorDigest);
      expect(prefix.counts).toEqual({ decisions: 1, candidateRows: 20, centipawnRows: 20, mateRows: 0, playedCentipawn: 1, playedMate: 0 });
      const writer = await EvaluationWriter.resume(path, prefix.chain);
      await writer.append({ ...record, index: 1 }); await writer.close();
      const final = await inspectJournal(path, [decision, decision], populationDigest, executorDigest);
      expect(final.header).toEqual(header); expect(final.counts.decisions).toBe(2);
      expect(final.chain).not.toBe(prefix.chain);
      await expect(EvaluationWriter.create(path, header)).rejects.toThrow();
    });
  });
  it.each(["population", "instrument", "parser", "binary", "order", "response", "operation", "partial", "extra"])("refuses %s journal drift without overwriting it", async (mode) => {
    await withJournal(async (path) => {
      const original = await readFile(path, "utf8");
      const envelopes = original.trimEnd().split("\n").map((line) => JSON.parse(line));
      if (mode === "parser") envelopes[0].value.parserImplementationDigest = digest("wrong parser");
      if (mode === "binary") envelopes[1].value.source.acquisition.actualIdentity.binaryDigest = digest("other binary");
      if (mode === "order") envelopes[1].value.index = 1;
      if (mode === "response") envelopes[1].value.source.response.bodyBase64 = Buffer.from("fake source").toString("base64");
      if (mode === "operation") envelopes[1].value.source.operation = "stockfish.position_evaluation@1";
      if (mode === "extra") envelopes[1].value.extra = true;
      // Recompute the outer journal chain: durable-source validation, not this checksum, must refuse.
      let chain = "";
      for (const envelope of envelopes) { envelope.previous = chain; envelope.digest = digest(JSON.stringify({ previous: chain, value: envelope.value })); chain = envelope.digest; }
      const edited = `${envelopes.map((value) => JSON.stringify(value)).join("\n")}${mode === "partial" ? "" : "\n"}`;
      await writeFile(path, edited);
      await expect(inspectJournal(path, [decision], mode === "population" ? digest("wrong population") : populationDigest,
        mode === "instrument" ? digest("wrong instrument") : executorDigest)).rejects.toThrow();
      expect(await readFile(path, "utf8")).toBe(edited);
    });
  });
});
