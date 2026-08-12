import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeSanAndPlay } from "chessops/san";
import { parseUci } from "chessops/util";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";
import { appendOpponentPly, commitMove, createRun } from "@chess-tabiya/runtime";
import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";

import { projectPackDocument } from "../pack-registry.js";
import { validatePackDocument } from "../pack-validation.js";
import { orchestratePackMove } from "../pack-orchestrator.js";
import { checkSourcingDirectory } from "./check.js";
import { readJson, writeCanonicalJson } from "./canonical.js";
import { emitPositionSeeds, fixturePuzzleRows, parsePuzzleRow, PUZZLE_HEADER, replayPuzzle } from "./position-seeds.js";

async function emitted(options: { minimumNbPlays?: number; rows?: string[]; plies?: number } = {}) {
  const root = await mkdtemp(resolve(tmpdir(), "tabiya-position-seeds-"));
  const rows = options.rows === undefined ? await fixturePuzzleRows() : (async function* () { yield PUZZLE_HEADER; yield* options.rows!; })();
  const outputs = await emitPositionSeeds({ ratingBand: [1000, 2000], count: 20, rows, outputRoot: resolve(root, "candidates"), sourceRoot: resolve(root, "sources"), minimumNbPlays: options.minimumNbPlays ?? 0, ...(options.plies === undefined ? {} : { plies: options.plies }) });
  return { root, outputs };
}

function independentReplay(row: ReturnType<typeof parsePuzzleRow>): { fen: string; san: string[] } {
  const position = Chess.fromSetup(parseFen(row.fen).unwrap()).unwrap();
  const san: string[] = [];
  for (const value of row.moves) {
    const move = parseUci(value)!;
    san.push(makeSanAndPlay(position, move));
  }
  return { fen: makeFen(position.toSetup()), san };
}

describe("Lichess puzzle consequence seeds", () => {
  it("applies all moves from the three verbatim rows and starts with the solver defending second", async () => {
    const fixture = (await readFile("apps/server/src/sourcing/fixtures/lichess-puzzles.csv", "utf8")).trim().split("\n");
    const rows = fixture.slice(1).map(parsePuzzleRow);
    const { outputs } = await emitted();
    expect(outputs).toHaveLength(3);
    for (const [index, output] of outputs.entries()) {
      const row = rows[index]!;
      const pack = await readJson(resolve(output, "pack.json")) as any;
      expect(pack.start.fen).toBe(independentReplay(row).fen);
      expect(pack.start.side).toBe(row.fen.split(" ")[1] === "b" ? "white" : "black");
      expect(pack.start.side).not.toBe(row.fen.split(" ")[1] === "b" ? "black" : "white");
      expect(pack.start.side).not.toBe(pack.start.fen.split(" ")[1] === "b" ? "black" : "white");
      expect(pack).not.toHaveProperty("spine");
      expect(pack.start).not.toHaveProperty("movesSan");
      expect(pack.mode).toBe("outcome");
      expect(pack.opponentPolicy).toMatchObject({ mode: "human_common", seedMode: "per_branch" });
      expect(validatePackDocument(pack).valid).toBe(true);
      expect((await checkSourcingDirectory(output)).valid).toBe(true);
    }
  });

  it("keeps the complete line only in the review sidecar and out of the browser projection", async () => {
    const fixture = (await readFile("apps/server/src/sourcing/fixtures/lichess-puzzles.csv", "utf8")).trim().split("\n");
    const rows = fixture.slice(1).map(parsePuzzleRow);
    const { outputs } = await emitted();
    for (const [index, output] of outputs.entries()) {
      const pack = await readJson(resolve(output, "pack.json")) as any;
      const evidence = await readJson(resolve(output, "evidence.json")) as any;
      const record = evidence.records.find((value: any) => value.kind === "puzzle_provenance");
      const expected = independentReplay(rows[index]!);
      expect(record.values.solutionUci).toEqual(rows[index]!.moves);
      expect(record.values.solutionSan).toEqual(expected.san);
      const delivered = JSON.stringify(projectPackDocument(pack)).toLowerCase();
      for (const move of [...rows[index]!.moves, ...expected.san]) expect(delivered).not.toContain(move.toLowerCase());
      expect(pack.provenance.sources).toHaveLength(1);
      expect(pack.provenance.sources[0]).toContain("lichess_db_puzzle.csv.zst");
      expect(pack.provenance.sources[0]).not.toContain(rows[index]!.gameUrl);
    }
  });

  it("plays the spine-less pack opponent-first and fires its checkpoint on the learner's eighth ply", async () => {
    const { outputs } = await emitted();
    const pack = await readJson(resolve(outputs[0]!, "pack.json")) as any;
    const digest = await digestDrillPack(pack);
    let run = createRun({ id: "seed-run", packId: pack.id, packDigest: digest, startFen: pack.start.fen, policyConfig: { seedMode: "per_branch", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 7, createdAt: "2026-08-12T00:00:00.000Z" });
    for (let ply = 1; ply <= 8; ply += 1) {
      const position = Chess.fromSetup(parseFen(run.nodes.find((node) => node.id === run.activeCursor.nodeId)!.fen).unwrap()).unwrap();
      const moves = [...position.allDests()].flatMap(([from, destinations]) => [...destinations].map((to) => ({ from, to }))).filter((move) => position.isLegal(move));
      const move = moves.find((candidate) => { const trial = position.clone(); trial.play(candidate); return !trial.isEnd(); }) ?? moves[0]!;
      const before = run;
      const at = `2026-08-12T00:00:${String(ply).padStart(2, "0")}.000Z`;
      const committed = ply % 2 === 1
        ? appendOpponentPly(run, { moveUci: makeUci(move), engine: { id: "fixture", name: "Fixture opponent", version: "1", seedHonored: true } }, { at })
        : commitMove(run, makeUci(move), { actor: "user", at });
      run = orchestratePackMove(pack, before, committed).run;
    }
    expect(run.nodes.find((node) => node.ply === 1)?.actor).toBe("opponent");
    expect(run.nodes.find((node) => node.ply === 8)?.actor).toBe("user");
    expect(run.events).toContainEqual(expect.objectContaining({ type: "checkpoint.reached", data: expect.objectContaining({ checkpointId: "consequence", nodeId: run.activeCursor.nodeId }) }));
    expect(run.nodes.find((node) => node.id === run.activeCursor.nodeId)?.objectiveState).toBe("achieved");
  });

  it("mechanically rejects a forged aftermath FEN", async () => {
    const { outputs } = await emitted();
    const output = outputs[0]!;
    const evidence = await readJson(resolve(output, "evidence.json")) as any;
    evidence.records.find((value: any) => value.kind === "puzzle_provenance").anchor.fen = "8/8/8/8/8/8/K7/7k w - - 0 1";
    await writeCanonicalJson(resolve(output, "evidence.json"), evidence);
    expect((await checkSourcingDirectory(output)).issues.map((value) => value.code)).toContain("EVIDENCE_VALUES_INVALID");
  });

  it("rejects terminal aftermaths positionally even without a mate theme", async () => {
    const mate = "mate01,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,f2f3 e7e5 g2g4 d8h4,1200,50,90,2000,short,https://lichess.org/mate01,,";
    const { outputs } = await emitted({ rows: [mate] });
    expect(outputs).toEqual([]);
    const row = parsePuzzleRow(mate);
    expect(replayPuzzle(row).terminal).toBe(true);
  });

  it("rejects odd solution parity and invalid checkpoint lengths loudly", async () => {
    const odd = "odd001,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4 e7e5 g1f3,1200,50,90,2000,short,https://lichess.org/odd001,,";
    await expect(emitted({ rows: [odd] })).rejects.toMatchObject({ code: "PUZZLE_MOVE_PARITY_INVALID" });
    await expect(emitted({ plies: 7 })).rejects.toMatchObject({ code: "CHECKPOINT_PLIES_INVALID" });
    await expect(emitted({ plies: 22 })).rejects.toMatchObject({ code: "CHECKPOINT_PLIES_INVALID" });
  });

  it("applies rating bounds, exact phase matching and case-fold collision suffixes", async () => {
    const base = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4 e7e5,1050,50,90,2000";
    const rows = [
      `AbC123,${base},endgame,https://lichess.org/a,,`,
      `abc123,${base},endgame middlegame,https://lichess.org/b,,`,
    ];
    const { outputs } = await emitted({ rows });
    expect(outputs.map((value) => value.split("/").at(-1))).toEqual(["onramp-abc123", "onramp-abc123-2"]);
    const candidates = await Promise.all(outputs.map(async (output) => ({ pack: await readJson(resolve(output, "pack.json")) as any, evidence: await readJson(resolve(output, "evidence.json")) as any })));
    for (const candidate of candidates) expect(candidate.pack.difficulty).toMatchObject({ minOnlineRapid: 1000, maxOnlineRapid: 1200 });
    const exact = candidates.find((candidate) => candidate.evidence.records[0].values.puzzleId === "AbC123")!;
    const ambiguous = candidates.find((candidate) => candidate.evidence.records[0].values.puzzleId === "abc123")!;
    expect(exact.pack.phase).toBe("endgame");
    expect(ambiguous.pack).not.toHaveProperty("phase");
  });

  it("never infers engine evidence from ambient availability", async () => {
    const { outputs } = await emitted();
    for (const output of outputs) {
      const evidence = await readJson(resolve(output, "evidence.json")) as any;
      expect(evidence.records.some((value: any) => value.kind === "engine_eval")).toBe(false);
    }
    const rows = await fixturePuzzleRows();
    await expect(emitPositionSeeds({ ratingBand: [1000, 2000], count: 1, rows, engineEval: true })).rejects.toMatchObject({ code: "ENGINE_EVAL_UNAVAILABLE" });
  });
});
