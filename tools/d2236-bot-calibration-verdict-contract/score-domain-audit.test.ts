import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { digestEngineOptionImage, type EngineOptionImage } from "../../packages/runtime/src/index.js";
import { ProviderExchangeScheduler } from "../../apps/server/src/provider-exchange.js";
import { providerOperationDescriptors } from "../../apps/server/src/provider-operations.js";
import { FakeEngines, stockfishDepthLines } from "../../apps/server/src/provider-exchange.test-support.js";
import type { EngineExchangeRequest } from "../../apps/server/src/engine-supervisor.js";
import { digest, type HumanDecision } from "./population.js";
import { EvaluationWriter, freshSearchClient, makeHeader, makeRecord, rootRequest, OPERATION,
  type EvaluationHeader, type EvaluationRecord, type ResetWitness } from "./evaluation.js";
import { auditScoreDomains } from "./score-domain-audit.js";
import { assertHistoricalPricing } from "./score-domain-audit.js";
import manifest from "./manifest.json";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const populationDigest = digest("audit fixture population");
const executorDigest = digest("audit fixture original executor");
const image: EngineOptionImage = { advertisedUciOptionLines: ["option name Clear Hash type button"],
  appliedSetoptionCommands: ["setoption name Threads value 1", "setoption name Hash value 16"] };
class AuditEngines extends FakeEngines {
  constructor() { super(); this.version = "18"; }
  override health(id: string) { return { ...super.health(id), options: [{ name: "Clear Hash", type: "button" as const }] }; }
  async execute() { return ["readyok"]; }
  override async exchange(id: string, request: EngineExchangeRequest) {
    return { ...await super.exchange(id, request), optionImage: image, optionImageDigest: digestEngineOptionImage(image) };
  }
}

async function fixture(mode: "flat_cp" | "mixed" | "all_mate", playedIndex = 0) {
  const fake = new AuditEngines();
  fake.respond = (request) => stockfishDepthLines(request).map((line, index) => line.replace(/score cp -?\d+/u,
    mode === "flat_cp" ? "score cp 42" : mode === "all_mate" || index < 2
      ? index % 2 === 0 ? "score mate 2" : "score mate -3" : "score cp 42"));
  let reset: ResetWitness | undefined;
  const engines = freshSearchClient(fake, (value) => { reset = value; }, () => {});
  const scheduler = new ProviderExchangeScheduler({ descriptors: providerOperationDescriptors({ engines,
    tablebaseFetch: null, explorerFetch: null, explorerToken: null }),
    maxActive: 1, maxQueued: 1, maxRetainedEntries: 1, maxRetainedWeight: 256, retentionTtlMs: 1,
    monotonicNowMs: () => performance.now(), wallNow: () => new Date().toISOString() });
  const result = await scheduler.get({ operation: OPERATION, request: rootRequest(FEN) }, { id: "audit", budgetMs: 60_000 }, new AbortController().signal);
  if (result.kind !== "success" || !reset) throw new Error(`audit fixture refused: ${JSON.stringify(result)}`);
  const gameHash = digest("audit fixture game");
  const decision: HumanDecision = { gameHash, selectionHash: digest("audit fixture selection"),
    referenceHalf: Number.parseInt(gameHash.slice(7, 9), 16) % 2 as 0 | 1, band: "1400", window: "opening-8-16", ply: 8,
    fen: FEN, moveUci: result.delivery.payload.rows[playedIndex]!.moveUci };
  const header = makeHeader(populationDigest, executorDigest, result.delivery.acquisition.actualIdentity, image);
  return { decision, header, delivery: result.delivery, reset, record: makeRecord(header, 0, decision, result.delivery, reset) };
}
async function withJournal(run: (path: string) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), "tabiya-score-domain-audit-"));
  try { await run(join(directory, "journal.jsonl")); }
  finally { await rm(directory, { recursive: true, force: true }); }
}
async function journal(path: string, header: EvaluationHeader, records: readonly EvaluationRecord[]) {
  const writer = await EvaluationWriter.create(path, header);
  try { for (const record of records) await writer.append(record); }
  finally { await writer.close(); }
}
async function rechain(path: string, mutate: (envelopes: any[]) => void, terminated = true) {
  const envelopes = (await readFile(path, "utf8")).trimEnd().split("\n").map((line) => JSON.parse(line));
  mutate(envelopes);
  let chain = "";
  for (const envelope of envelopes) {
    envelope.previous = chain;
    envelope.digest = digest(JSON.stringify({ previous: chain, value: envelope.value }));
    chain = envelope.digest;
  }
  await writeFile(path, `${envelopes.map((value) => JSON.stringify(value)).join("\n")}${terminated ? "\n" : ""}`);
}

describe("D3430 complete-source score domains, not calibration", () => {
  it.each([
    ["flat_cp", 0, { cpOnlyRoots: 1, cpOnlyConstantTables: 1, playedCp: 1, cpCandidates: 20 }],
    ["mixed", 2, { mixedRoots: 1, playedCp: 1, cpPlayedInMixedRoot: 1, cpPlayedWithRootMatesAlternative: 1,
      cpPlayedWithRootIsMatedAlternative: 1, cpCandidates: 18, rootMatesCandidates: 1, rootIsMatedCandidates: 1 }],
    ["mixed", 0, { mixedRoots: 1, playedRootMates: 1 }],
    ["mixed", 1, { mixedRoots: 1, playedRootIsMated: 1 }],
    ["all_mate", 0, { mateOnlyRoots: 1, playedRootMates: 1, cpCandidates: 0, rootMatesCandidates: 10, rootIsMatedCandidates: 10 }],
    ["all_mate", 1, { mateOnlyRoots: 1, playedRootIsMated: 1, cpCandidates: 0 }],
  ] as const)("counts %s / played row %s without converting mate or judging the choice", async (mode, played, expected) => {
    const item = await fixture(mode, played);
    await withJournal(async (path) => {
      await journal(path, item.header, [item.record]);
      const result = await auditScoreDomains(path, [item.decision], populationDigest, executorDigest);
      expect(result.counts).toMatchObject({ decisions: 1, candidateRows: 20, ...expected });
      expect(result.cells).toHaveLength(24);
      expect(result.cells.filter((cell) => cell.decisions > 0)).toEqual([
        { cell: `1400/opening-8-16/${item.decision.referenceHalf}`, ...result.counts, distinctGames: 1 },
      ]);
      expect(result.claims).toEqual({ strength: "not_measured", distribution: "not_measured", bandIdentity: "not_measured", humanLikeLabelAllowed: false });
      expect(result.state).toBe("described_not_calibrated");
      expect(JSON.stringify(result)).not.toContain(item.decision.gameHash);
      expect(Object.keys(result.counts)).not.toContain("candidateLoss");
    });
  });
  it("retains shared-game clusters across windows and bands without counting three independent games", async () => {
    const item = await fixture("mixed", 2);
    const rows = [item.decision, { ...item.decision, band: "1000", window: "middlegame-17-40", ply: 17 },
      { ...item.decision, window: "late-41-plus", ply: 41 }];
    await withJournal(async (path) => {
      await journal(path, item.header, rows.map((row, index) => makeRecord(item.header, index, row, item.delivery, item.reset)));
      const result = await auditScoreDomains(path, rows, populationDigest, executorDigest);
      expect(result.clusters).toEqual({ distinctGames: 1, distinctGameWindows: 3, multiWindowGames: 1, multiBandGames: 1,
        multiplicities: [{ decisions: 3, games: 1 }], halves: [0, 1].map((half) => ({ half, games: half === item.decision.referenceHalf ? 1 : 0 })) });
      expect(result.cells.filter((cell) => cell.decisions > 0).map((cell) => cell.cell)).toEqual([
        `1000/middlegame-17-40/${item.decision.referenceHalf}`, `1400/opening-8-16/${item.decision.referenceHalf}`, `1400/late-41-plus/${item.decision.referenceHalf}`,
      ]);
    });
  });
  it.each(["chain", "executor", "parser", "binary", "aggregate", "cell", "missing-cell", "state"])("checks the immutable receipt's %s independently of newly recomputed journal checksums", async (mode) => {
    const item = await fixture("mixed", 2);
    await withJournal(async (path) => {
      await journal(path, item.header, [item.record]);
      const result = await auditScoreDomains(path, [item.decision], populationDigest, executorDigest);
      const counts = { decisions: 1, candidateRows: 20, centipawnRows: 18, mateRows: 2, playedCentipawn: 1, playedMate: 0 };
      const zero = { decisions: 0, candidateRows: 0, centipawnRows: 0, mateRows: 0, playedCentipawn: 0, playedMate: 0 };
      const receipt = { ...item.header, state: "priced_not_calibrated", journalDigest: result.journalDigest, ...counts,
        cells: manifest.humanReference.bands.flatMap((band) => manifest.humanReference.windows.map((window) => ({
          cell: `${band.id}/${window.id}`, ...(band.id === "1400" && window.id === "opening-8-16" ? counts : zero),
        }))) };
      expect(() => assertHistoricalPricing(result, receipt)).not.toThrow();
      if (mode === "chain") receipt.journalDigest = digest("replacement chain");
      if (mode === "executor") receipt.instrumentDigest = digest("replacement executor");
      if (mode === "parser") receipt.parserImplementationDigest = digest("replacement parser");
      if (mode === "binary") receipt.actualIdentity = { ...receipt.actualIdentity, binaryDigest: digest("replacement binary") as typeof receipt.actualIdentity.binaryDigest };
      if (mode === "aggregate") receipt.mateRows = 0;
      if (mode === "cell") receipt.cells.find((cell) => cell.cell === "1400/opening-8-16")!.mateRows = 0;
      if (mode === "missing-cell") receipt.cells.pop();
      if (mode === "state") receipt.state = "calibrated";
      expect(() => assertHistoricalPricing(result, receipt)).toThrow();
    });
  });
  it.each(["duplicate-window", "crossed-half", "unknown-cell"])("refuses %s even with valid source and recomputed decision identity", async (mode) => {
    const item = await fixture("mixed");
    const second = { ...item.decision, ...(mode === "crossed-half" ? { referenceHalf: 1 - item.decision.referenceHalf as 0 | 1 }
      : mode === "unknown-cell" ? { band: "900" } : {}) };
    await withJournal(async (path) => {
      await journal(path, item.header, [item.record, makeRecord(item.header, 1, second, item.delivery, item.reset)]);
      await expect(auditScoreDomains(path, [item.decision, second], populationDigest, executorDigest)).rejects.toThrow();
    });
  });
  it.each(["short", "extra", "unterminated", "chain", "order", "payload", "reset", "header", "envelope-field", "record-field"])("refuses %s and leaves the original journal untouched by the auditor", async (mode) => {
    const item = await fixture("mixed");
    await withJournal(async (path) => {
      await journal(path, item.header, [item.record]);
      await rechain(path, (values) => {
        if (mode === "short") values.pop();
        if (mode === "extra") values.push(JSON.parse(JSON.stringify(values[1])));
        if (mode === "order") values[1].value.index = 1;
        if (mode === "payload") values[1].value.source.response.bodyBase64 = Buffer.from("counterfeit detached source").toString("base64");
        if (mode === "reset") values[1].value.reset.generation += 1;
        if (mode === "header") values[0].value.instrumentDigest = digest("another executor");
        if (mode === "envelope-field") values[1].unexpected = true;
        if (mode === "record-field") values[1].value.unexpected = true;
      }, mode !== "unterminated");
      if (mode === "chain") await writeFile(path, (await readFile(path, "utf8")).replace(/"previous":"sha256:[a-f0-9]+"/u, '"previous":"wrong"'));
      const before = await readFile(path, "utf8");
      await expect(auditScoreDomains(path, [item.decision], populationDigest, executorDigest)).rejects.toThrow();
      expect(await readFile(path, "utf8")).toBe(before);
    });
  });
});
