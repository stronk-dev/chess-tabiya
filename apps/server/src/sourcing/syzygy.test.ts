import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { Chess } from "chessops/chess";
import { makeFen } from "chessops/fen";
import { makeUci } from "chessops/util";
import { describe, expect, it, vi } from "vitest";

import { StockfishEvidenceExecutor } from "../evidence-queue.js";
import { PackRegistry, projectPackDocument } from "../pack-registry.js";
import { checkSourcingDirectory } from "./check.js";
import { readJson, sha256, writeCanonicalJson } from "./canonical.js";
import {
  AUTHORING_PROFILE,
  countFenPieces,
  emitSyzygyCandidates,
  fixtureTablebaseQuery,
  validateAuthoringProfile,
  type TablebaseQuery,
} from "./syzygy.js";

const ROOK_4V3 = "3r2k1/5pp1/7p/8/4P3/8/5PPP/R5K1 w - - 0 1";
const SEVEN = "7k/pp6/8/8/8/8/PP4Q1/7K w - - 0 1";
const EIGHT = "7k/ppp5/8/8/8/8/PP4Q1/7K w - - 0 1";

async function fixtureFile(lines: string): Promise<{ path: string; root: string }> {
  const root = await mkdtemp(resolve(tmpdir(), "tabiya-syzygy-"));
  const path = resolve(root, "positions.fen");
  await writeFile(path, lines);
  return { path, root };
}

async function emit(fen = ROOK_4V3, side: "white" | "black" = "white", query?: TablebaseQuery, checkpointPlies = 16) {
  const fixture = await fixtureFile(`${fen}\tFixture ending\n`);
  const outputs = await emitSyzygyCandidates({ positions: fixture.path, learnerSide: side, opponent: "strong_engine", outputRoot: resolve(fixture.root, "candidates"), sourceRoot: resolve(fixture.root, "sources"), now: () => new Date("2026-08-12T12:00:00.000Z"), checkpointPlies, ...(query ? { query } : {}) });
  return { directory: outputs[0]!, ...fixture };
}

describe("Syzygy sourcing", () => {
  it("mechanically abstains on the real 11-piece root without issuing a request", async () => {
    const query = vi.fn(async () => { throw new Error("network must not be called"); });
    const { directory } = await emit(ROOK_4V3, "white", query);
    const ledger = await readJson(resolve(directory, "evidence.json")) as any;
    const manifest = await readJson(resolve(directory, "sources.json")) as any;
    expect(countFenPieces(ROOK_4V3)).toBe(11);
    expect(query).not.toHaveBeenCalled();
    expect(ledger.records.filter((record: any) => record.kind === "tablebase_result")).toEqual([]);
    expect(ledger.abstentions).toContainEqual(expect.objectContaining({ reason: "out_of_range", detail: "11 pieces; Syzygy covers <=7", sourceId: "author-positions" }));
    expect(manifest.entries).toHaveLength(1);
    expect(manifest.entries[0].origin.kind).toBe("local-file");
    expect((await checkSourcingDirectory(directory)).valid).toBe(true);
  });

  it("queries exactly at seven pieces and abstains at eight", async () => {
    const query = vi.fn(fixtureTablebaseQuery);
    const seven = await emit(SEVEN, "white", query);
    const eight = await emit(EIGHT, "white", query);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(SEVEN);
    const result = await readJson(resolve(seven.directory, "evidence.json")) as any;
    const tablebase = result.records.find((record: any) => record.kind === "tablebase_result");
    expect(tablebase.values).toMatchObject({ pieceCount: 7, category: "win", dtz: 1, precise_dtz: 1, dtm: null });
    expect((await readJson(resolve(eight.directory, "evidence.json")) as any).abstentions[0].reason).toBe("out_of_range");
  });

  it("grants exact grounding only to a valid, manifest-linked ledger", async () => {
    const emitted = await emit(SEVEN, "white", fixtureTablebaseQuery);
    const pack = await readJson(resolve(emitted.directory, "pack.json")) as any;
    const ledger = await readJson(resolve(emitted.directory, "evidence.json"));
    const manifest = await readJson(resolve(emitted.directory, "sources.json"));
    const tablebase = (ledger as any).records.find((record: any) => record.kind === "tablebase_result");
    pack.mode = "outcome";
    pack.objective = {
      type: "win",
      summary: "Convert the exact root.",
      grading: {
        assessedBy: {
          kind: "syzygy",
          category: tablebase.values.category,
          pieceCount: tablebase.values.pieceCount,
          sourceId: tablebase.sourceId,
          retrievedAt: tablebase.retrievedAt,
        },
        resolveAt: { kind: "terminal" },
      },
      successConditions: [],
    };

    const verified = await PackRegistry.fromDocuments([
      { source: "pack.json", value: pack, ledger, manifest },
    ]);
    expect(verified.required(pack.id).assessmentGrounding).toBe("ledger_verified");
    expect(projectPackDocument(pack, "ledger_verified")).toMatchObject({
      objective: { grading: { grounding: "ledger_verified" } },
    });

    const forged = structuredClone(ledger) as any;
    forged.records.push({ kind: "tablebase_result" });
    const unverified = await PackRegistry.fromDocuments([
      { source: "pack.json", value: pack, ledger: forged, manifest },
    ]);
    expect(unverified.required(pack.id).assessmentGrounding).toBe("unverified");

    await writeCanonicalJson(resolve(emitted.directory, "pack.json"), pack);
    expect((await checkSourcingDirectory(emitted.directory, { strict: true })).issues)
      .not.toContainEqual(expect.objectContaining({ code: "SYZYGY_ASSESSMENT_UNGROUNDED" }));
    await writeCanonicalJson(resolve(emitted.directory, "evidence.json"), forged);
    const promotion = await checkSourcingDirectory(emitted.directory, { strict: true });
    expect(promotion.valid).toBe(false);
    expect(promotion.issues).toContainEqual(
      expect.objectContaining({ code: "SYZYGY_ASSESSMENT_UNGROUNDED", severity: "error" }),
    );
  });

  it("matches the chessops board census over 200 legal committed positions", () => {
    const position = Chess.default();
    for (let index = 0; index < 200; index += 1) {
      const fen = makeFen(position.toSetup());
      expect(countFenPieces(fen)).toBe(position.board.occupied.size());
      const moves = [...position.allDests()].flatMap(([from, destinations]) => [...destinations].map((to) => ({ from, to })));
      if (moves.length === 0) break;
      position.play(moves[index % moves.length]!);
    }
  });

  it("pins learner-ply checkpoint parity and emits widened in-schema difficulty", async () => {
    const white = await emit(ROOK_4V3, "white");
    const black = await emit(ROOK_4V3, "black");
    const long = await emit(ROOK_4V3, "white", undefined, 24);
    const whitePack = await readJson(resolve(white.directory, "pack.json")) as any;
    const blackPack = await readJson(resolve(black.directory, "pack.json")) as any;
    const longPack = await readJson(resolve(long.directory, "pack.json")) as any;
    expect(whitePack.checkpoints[0].trigger.atPly % 2).toBe(1);
    expect(blackPack.checkpoints[0].trigger.atPly % 2).toBe(0);
    expect(whitePack.opponentPolicy.mode).not.toBe("theory_strict");
    expect(longPack.difficulty).toEqual({ branchLengthTarget: 25 });
  });

  it("records the D8 graduation blocker on in-range roots", async () => {
    const { directory } = await emit(SEVEN, "white", fixtureTablebaseQuery);
    const pack = await readJson(resolve(directory, "pack.json")) as any;
    expect(pack.provenance.graduationBlockers).toContain("Exact tablebase grading is available for this root and perfect_tablebase is selectable where the provider is published; this draft still requests strong_engine, which can deviate from perfect play");
    expect(pack.provenance.licence).toBe("CC-BY-SA-4.0");
    expect(JSON.stringify(pack)).not.toContain("unlicensed-data");
  });

  it("enforces evidence-kind separation and authoring engine fields", async () => {
    const outOfRange = await emit(ROOK_4V3);
    const ledgerPath = resolve(outOfRange.directory, "evidence.json");
    const ledger = await readJson(ledgerPath) as any;
    ledger.records.push({ kind: "tablebase_result", anchor: { fen: ROOK_4V3 }, sourceId: "author-positions", retrievedAt: ledger.sourcedAt, grounds: "machine_validation", values: { fen: ROOK_4V3, pieceCount: 11 }, supports: ["/start/fen"] });
    await writeCanonicalJson(ledgerPath, ledger);
    expect((await checkSourcingDirectory(outOfRange.directory)).issues.map((value) => value.code)).toContain("EVIDENCE_KIND_MISMATCH");

    const inRange = await emit(SEVEN, "white", fixtureTablebaseQuery);
    const engineLedger = await readJson(resolve(inRange.directory, "evidence.json")) as any;
    const source = (await readJson(resolve(inRange.directory, "sources.json")) as any).entries[0];
    engineLedger.records.push({ kind: "engine_eval", anchor: { fen: SEVEN }, sourceId: source.sourceId, retrievedAt: source.retrievedAt, grounds: "machine_validation", values: { fen: SEVEN, depth: 22 }, supports: ["/start/fen"] });
    await writeCanonicalJson(resolve(inRange.directory, "evidence.json"), engineLedger);
    const codes = (await checkSourcingDirectory(inRange.directory)).issues.map((value) => value.code);
    expect(codes).toContain("EVIDENCE_VALUES_INVALID");
    expect(codes).toContain("EVIDENCE_KIND_MISMATCH");
  });

  it("refuses MultiPV above one and carries the explicit authoring timeout", async () => {
    expect(() => validateAuthoringProfile({ multiPv: 3 })).toThrow(/MultiPV 1/);
    expect(AUTHORING_PROFILE).toEqual({ depth: 22, threads: 1, hashMb: 16, multiPv: 1, timeoutMs: 120_000 });
    const requests: any[] = [];
    const executor = new StockfishEvidenceExecutor({
      async execute(_engineId, request) {
        requests.push(request);
        return ["info depth 22 multipv 1 score cp 12 pv e2e4", "bestmove e2e4"];
      },
    }, "stockfish-authoring", 1);
    await executor.execute({ id: "job", runId: "run", nodeId: "node", fen: ROOK_4V3, kind: "eval", depth: 22, timeoutMs: 120_000 }, new AbortController().signal);
    expect(requests[0].commands).toContain("go depth 22");
    expect(requests[0].timeoutMs).toBe(120_000);
    await executor.execute({ id: "job2", runId: "run", nodeId: "node", fen: ROOK_4V3, kind: "eval", depth: 22 }, new AbortController().signal);
    expect(requests[1].timeoutMs).toBe(5_000);
  });

  it("is byte-stable against the same local-file cache", async () => {
    const fixture = await fixtureFile(`${ROOK_4V3}\tFixture ending\n`);
    const options = { positions: fixture.path, learnerSide: "white" as const, opponent: "strong_engine" as const, sourceRoot: resolve(fixture.root, "sources"), now: () => new Date("2026-08-12T12:00:00Z") };
    const [first] = await emitSyzygyCandidates({ ...options, outputRoot: resolve(fixture.root, "first") });
    const [second] = await emitSyzygyCandidates({ ...options, outputRoot: resolve(fixture.root, "second"), now: () => new Date("2026-08-14T12:00:00Z") });
    for (const file of ["pack.json", "evidence.json", "sources.json"]) {
      expect(sha256(await readFile(resolve(first!, file)))).toBe(sha256(await readFile(resolve(second!, file))));
    }
  });
});
