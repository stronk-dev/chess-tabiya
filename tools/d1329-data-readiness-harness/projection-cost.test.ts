// DISPOSABLE research harness — D1329 projection/cost arm. No model fitting or production policy.
import { createHash } from "node:crypto";
import { createReadStream, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";

import { Chess, normalizeMove } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import type { Move, Role } from "chessops/types";
import { makeUci, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { candidateFeatureVector } from "../../apps/server/src/candidate-evidence.js";
import { EngineSupervisor, type EngineSpec } from "../../apps/server/src/engine-supervisor.js";

const INPUT = process.env.TABIYA_D1329_PROJECTION_PGN;
const WRITE = process.env.TABIYA_D1329_PROJECTION_WRITE === "1";
const EXPECTED_INPUT = "sha256:89d444ea00e073ee17d6a02747a7c9da12fe49c949d5b407c9e0d0a60b7d81ea";
const RESULT = new URL("../../planning/platform-alignment/bot-policy/d1329-projection-cost-results.json", import.meta.url);
const REPORT = new URL("../../planning/platform-alignment/bot-policy/d1329-projection-cost-results.md", import.meta.url);
const SAMPLE_PER_CELL = 5;
const DEPTH = 2;
const CAPS = [8, 16, 32] as const;
const PROMOTIONS: readonly Role[] = ["queen", "rook", "bishop", "knight"];
const RATING_BANDS = ["1000-1399", "1400-1799", "1800-2199", "2200-2599"] as const;
const SPEEDS = ["bullet", "blitz", "rapid"] as const;
const WINDOWS = ["opening-8-16", "middlegame-17-40", "late-41-plus"] as const;

type RatingBand = (typeof RATING_BANDS)[number];
type Speed = (typeof SPEEDS)[number];
type Window = (typeof WINDOWS)[number];

interface SamplePosition {
  readonly selectionHash: string;
  readonly cell: string;
  readonly fen: string;
}

interface RootEntry {
  readonly moveUci: string;
  readonly cp: number | null;
  readonly mate: number | null;
}

interface ProjectionAggregate {
  emissions: number;
  payloadBytes: number;
  flattenedScalars: number;
  flattenedBytes: number;
  names: Set<string>;
  cappedScalars: Record<string, number>;
}

const SPEC: EngineSpec = Object.freeze({
  id: "stockfish-d1329-projection-census",
  kind: "judge",
  command: process.env.SF_CMD?.trim() || "/opt/homebrew/bin/stockfish",
  name: "Stockfish",
  options: Object.freeze({ Threads: 1, Hash: 16 }),
  transcriptCapacity: 4_096,
  handshakeTimeoutMs: 15_000,
});

function speedOf(event: string): Speed | undefined {
  if (/UltraBullet/iu.test(event)) return undefined;
  if (/Bullet/iu.test(event)) return "bullet";
  if (/Blitz/iu.test(event)) return "blitz";
  if (/Rapid/iu.test(event)) return "rapid";
  return undefined;
}

function bandOf(value: number): RatingBand | undefined {
  if (value >= 1000 && value <= 1399) return "1000-1399";
  if (value <= 1799) return value >= 1400 ? "1400-1799" : undefined;
  if (value <= 2199) return value >= 1800 ? "1800-2199" : undefined;
  if (value <= 2599) return value >= 2200 ? "2200-2599" : undefined;
  return undefined;
}

function windowOf(ply: number): Window | undefined {
  if (ply >= 8 && ply <= 16) return "opening-8-16";
  if (ply >= 17 && ply <= 40) return "middlegame-17-40";
  if (ply >= 41) return "late-41-plus";
  return undefined;
}

function targetCells(): readonly string[] {
  return RATING_BANDS.flatMap((band) => SPEEDS.flatMap((speed) => WINDOWS.map((window) => `${band}/${speed}/${window}/standard`)));
}

function retainSmallest(target: Map<string, SamplePosition[]>, row: SamplePosition): void {
  const rows = target.get(row.cell) ?? [];
  rows.push(row);
  rows.sort((left, right) => left.selectionHash.localeCompare(right.selectionHash));
  if (rows.length > SAMPLE_PER_CELL) rows.length = SAMPLE_PER_CELL;
  target.set(row.cell, rows);
}

function legalUci(position: Chess): readonly string[] {
  const result: string[] = [];
  for (const [from, dests] of position.allDests()) for (const to of dests) {
    const promotions: readonly (Role | undefined)[] = position.board.getRole(from) === "pawn" && (to < 8 || to >= 56)
      ? PROMOTIONS
      : [undefined];
    for (const promotion of promotions) {
      const move: Move = promotion === undefined ? { from, to } : { from, to, promotion };
      if (position.isLegal(move)) result.push(makeUci(move));
    }
  }
  return result.sort();
}

async function sha256File(path: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk as Buffer);
  return `sha256:${hash.digest("hex")}`;
}

async function selectSample(path: string): Promise<readonly SamplePosition[]> {
  const selected = new Map<string, SamplePosition[]>();
  const input = createInterface({ input: createReadStream(path, { encoding: "utf8" }), crlfDelay: Infinity });
  let lines: string[] = [];
  let consumedGames = 0;
  const consume = (): void => {
    if (lines.length === 0) return;
    consumedGames += 1;
    if (consumedGames % 50_000 === 0) process.stderr.write(`[sample ${String(consumedGames)} games]\n`);
    const block = lines.join("\n");
    let game;
    try { [game] = parsePgn(block); } catch { return; }
    if (game === undefined || game.headers.get("Result") === "*" || game.headers.get("Result") === undefined) return;
    const variant = game.headers.get("Variant") ?? "Standard";
    if (variant !== "Standard" && variant !== "From Position") return;
    if (game.headers.get("WhiteTitle") === "BOT" || game.headers.get("BlackTitle") === "BOT") return;
    const speed = speedOf(game.headers.get("Event") ?? "");
    const white = Number(game.headers.get("WhiteElo"));
    const black = Number(game.headers.get("BlackElo"));
    if (speed === undefined || !Number.isFinite(white) || !Number.isFinite(black)) return;
    let position: Chess;
    try { position = startingPosition(game.headers).unwrap() as Chess; } catch { return; }
    const gameHash = createHash("sha256").update(block);
    let ply = 0;
    for (const data of game.moves.mainline()) {
      const move = parseSan(position, data.san);
      if (move === undefined || !position.isLegal(move)) return;
      ply += 1;
      const window = windowOf(ply);
      const band = bandOf(position.turn === "white" ? white : black);
      if (window !== undefined && band !== undefined) {
        retainSmallest(selected, {
          selectionHash: gameHash.copy().update("\0").update(String(ply)).digest("hex"),
          cell: `${band}/${speed}/${window}/standard`,
          fen: makeFen(position.toSetup()),
        });
      }
      position.play(move);
    }
  };
  for await (const line of input) {
    if (line.startsWith("[Event ") && lines.length > 0) {
      consume();
      lines = [];
    }
    lines.push(line);
  }
  // The fixed prefix ends inside a PGN block; its final partial block is never sampled.
  const missing = targetCells().filter((cell) => (selected.get(cell)?.length ?? 0) !== SAMPLE_PER_CELL);
  if (missing.length > 0) throw new Error(`projection sample cells are incomplete: ${missing.join(",")}`);
  const rows = targetCells().flatMap((cell) => selected.get(cell)!);
  const fens = rows.map((row) => row.fen);
  if (new Set(fens).size !== fens.length) throw new Error("projection sample contains a duplicate FEN");
  return Object.freeze(rows.map((row) => Object.freeze(row)));
}

function parseRootEntries(lines: readonly string[], fen: string, legal: readonly string[]): readonly RootEntry[] {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const byIndex = new Map<number, RootEntry>();
  for (const line of lines) {
    if (!line.startsWith("info ") || line.includes("lowerbound") || line.includes("upperbound")) continue;
    const depth = /\bdepth (\d+)\b/u.exec(line);
    const index = /\bmultipv (\d+)\b/u.exec(line);
    const score = /\bscore (cp|mate) (-?\d+)\b/u.exec(line);
    const pv = /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)/u.exec(line);
    if (depth === null || index === null || score === null || pv === null || Number(depth[1]) < DEPTH) continue;
    const move = parseUci(pv[1]!);
    if (move === undefined) throw new Error("engine emitted invalid UCI");
    byIndex.set(Number(index[1]), {
      moveUci: makeUci(normalizeMove(position, move)),
      cp: score[1] === "cp" ? Number(score[2]) : null,
      mate: score[1] === "mate" ? Number(score[2]) : null,
    });
  }
  const entries = [...byIndex].sort((left, right) => left[0] - right[0]).map(([, row]) => row);
  if (new Set(entries.map((row) => row.moveUci)).size !== entries.length) throw new Error("duplicate_root");
  if (JSON.stringify([...entries.map((row) => row.moveUci)].sort()) !== JSON.stringify([...legal].sort())) throw new Error("incomplete_root");
  if (entries.some((row) => row.cp === null || row.mate !== null)) throw new Error("mate_score_unrepresentable");
  return entries;
}

function identityValue(key: string, value: string): boolean {
  return /id$/iu.test(key) || /fen$/iu.test(key) || /(?:move)?uci$/iu.test(key) || /san$/iu.test(key) ||
    /square$/iu.test(key) || /^(?:from|to|orig|dest)$/iu.test(key) || value.split("/").length === 8 ||
    /^[a-h][1-8]$/u.test(value) || /^[a-h][1-8][a-h][1-8][qrbn]?$/u.test(value);
}

function flatten(value: unknown, path: string, output: Map<string, string | number | boolean>): void {
  if (typeof value === "number" && Number.isFinite(value)) { output.set(`num:${path}`, value); return; }
  if (typeof value === "boolean") { output.set(`bool:${path}`, value); return; }
  if (typeof value === "string") {
    const key = path.split(".").at(-1) ?? path;
    if (!identityValue(key, value)) output.set(`cat:${path}=${value}`, true);
    return;
  }
  if (Array.isArray(value)) {
    output.set(`num:${path}.length`, value.length);
    for (const item of value) flatten(item, `${path}[]`, output);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) flatten(child, path === "" ? key : `${path}.${key}`, output);
  }
}

function rounded(value: number): number {
  return Number(value.toFixed(6));
}

function markdown(result: Awaited<ReturnType<typeof measure>>): string {
  const estimates = result.estimates.map((row) => `| ${row.decisions.toLocaleString("en-US")} | ${row.engineHours} | ${row.projectionHours} | ${row.genericGiB} | ${row.cap16GiB} |`).join("\n");
  return `# D1329 projection/cost result\n\nVerdict: **${result.verdict}**. ${result.population.successfulPositions}/${result.population.sampledPositions} positions completed the shipped candidate-evidence adapter; ${result.population.successfulLegalCandidates}/${result.population.sampledLegalCandidates} sampled legal candidates therefore received its complete registered projection closure. No model was fitted and no identity, move, score or evidence payload is retained.\n\n- Stockfish: ${result.engine.name} ${result.engine.version}; depth ${DEPTH}; Threads 1; Hash 16; full legal root.\n- Candidate-weighted projection success: ${(result.population.successRate * 100).toFixed(3)}% (gate ≥99%). A whole-position failure counts every legal candidate at that position as failed.\n- Engine time across every sampled position: ${result.timing.engineMs} ms; evidence projection time across completed positions: ${result.timing.projectionMs} ms.\n- Generic flattened plane over completed positions: ${result.generic.distinctNames} names, ${result.generic.scalars} non-zero scalars, ${result.generic.bytes} encoded bytes.\n- Failure classes: ${Object.entries(result.errors).map(([kind, count]) => `${kind}=${String(count.positions)} positions/${String(count.legalCandidates)} candidates`).join(", ") || "none"}.\n\n| decisions | linear engine h | linear projection h | generic GiB | cap-16 GiB |\n|---:|---:|---:|---:|---:|\n${estimates}\n\nThe 8/16/32 compact columns are cardinality budgets, not selected features or a production schema. Linear estimates do not claim parallel scaling or training cost. Engine cost is normalized over all sampled positions; projection and storage cost are normalized over completed positions.\n`;
}

async function measure(path: string) {
  if (await sha256File(path) !== EXPECTED_INPUT) throw new Error("D1329 projection input digest changed");
  const sample = await selectSample(path);
  const supervisor = new EngineSupervisor([SPEC]);
  const engine = await supervisor.start(SPEC.id);
  const projection = new Map<string, ProjectionAggregate>();
  const errors = new Map<string, { positions: number; legalCandidates: number }>();
  const byCell = new Map<string, { sampledPositions: number; successfulPositions: number; sampledLegalCandidates: number; successfulLegalCandidates: number }>();
  let engineMs = 0;
  let projectionMs = 0;
  let sampledLegalCandidates = 0;
  let successfulLegalCandidates = 0;
  let successfulPositions = 0;
  let genericScalars = 0;
  let genericBytes = 0;
  const cappedScalars = Object.fromEntries(CAPS.map((cap) => [String(cap), 0])) as Record<string, number>;
  try {
    for (const [index, row] of sample.entries()) {
      const cell = byCell.get(row.cell) ?? { sampledPositions: 0, successfulPositions: 0, sampledLegalCandidates: 0, successfulLegalCandidates: 0 };
      cell.sampledPositions += 1;
      byCell.set(row.cell, cell);
      let positionLegalCandidates = 0;
      try {
        const position = Chess.fromSetup(parseFen(row.fen).unwrap()).unwrap();
        const legal = legalUci(position);
        positionLegalCandidates = legal.length;
        sampledLegalCandidates += legal.length;
        cell.sampledLegalCandidates += legal.length;
        const engineStarted = performance.now();
        await supervisor.execute(SPEC.id, {
          commands: ["ucinewgame", "setoption name Clear Hash", `setoption name MultiPV value ${String(legal.length)}`, "isready"],
          until: (line) => line === "readyok",
          timeoutMs: 30_000,
        });
        const lines = await supervisor.execute(SPEC.id, {
          commands: [`position fen ${row.fen}`, `go depth ${String(DEPTH)}`],
          until: (line) => line.startsWith("bestmove "),
          timeoutMs: 30_000,
        });
        engineMs += performance.now() - engineStarted;
        const entries = parseRootEntries(lines, row.fen, legal);
        const projectionStarted = performance.now();
        const vector = candidateFeatureVector({
          beforeFen: row.fen,
          engine: { id: engine.id, name: engine.name, version: engine.version, seedHonored: false, searchBound: { kind: "depth", value: DEPTH } },
          candidates: entries.map((entry) => ({ moveUci: entry.moveUci, scoreCp: entry.cp! })),
        });
        projectionMs += performance.now() - projectionStarted;
        for (const candidate of vector.candidates) for (const item of candidate.results) {
          const id = `${item.source.id}@${String(item.source.version)}`;
          const aggregate = projection.get(id) ?? { emissions: 0, payloadBytes: 0, flattenedScalars: 0, flattenedBytes: 0, names: new Set<string>(), cappedScalars: Object.fromEntries(CAPS.map((cap) => [String(cap), 0])) };
          const flat = new Map<string, string | number | boolean>();
          flatten(item.payload, id, flat);
          const encoded = Buffer.byteLength(JSON.stringify(Object.fromEntries(flat)));
          aggregate.emissions += 1;
          aggregate.payloadBytes += Buffer.byteLength(JSON.stringify(item.payload));
          aggregate.flattenedScalars += flat.size;
          aggregate.flattenedBytes += encoded;
          for (const name of flat.keys()) aggregate.names.add(name);
          for (const cap of CAPS) aggregate.cappedScalars[String(cap)]! += Math.min(flat.size, cap);
          projection.set(id, aggregate);
          genericScalars += flat.size;
          genericBytes += encoded;
          for (const cap of CAPS) cappedScalars[String(cap)]! += Math.min(flat.size, cap);
        }
        successfulPositions += 1;
        successfulLegalCandidates += vector.candidates.length;
        cell.successfulPositions += 1;
        cell.successfulLegalCandidates += vector.candidates.length;
      } catch (cause) {
        const key = cause instanceof Error ? cause.message.split(":", 1)[0]! : "unknown";
        const aggregate = errors.get(key) ?? { positions: 0, legalCandidates: 0 };
        aggregate.positions += 1;
        aggregate.legalCandidates += positionLegalCandidates;
        errors.set(key, aggregate);
      }
      process.stderr.write(`[${String(index + 1)}/${String(sample.length)}] ${row.cell}\n`);
    }
  } finally {
    await supervisor.shutdown();
  }
  const successRate = successfulLegalCandidates / sampledLegalCandidates;
  const averageScalarBytes = genericBytes / Math.max(1, genericScalars);
  const estimates = [10_000, 100_000, 1_000_000].map((decisions) => ({
    decisions,
    engineHours: rounded(engineMs / sample.length * decisions / 3_600_000),
    projectionHours: rounded(projectionMs / Math.max(1, successfulPositions) * decisions / 3_600_000),
    genericGiB: rounded(genericBytes / Math.max(1, successfulPositions) * decisions / 1_073_741_824),
    cap8GiB: rounded(cappedScalars["8"]! * averageScalarBytes / Math.max(1, successfulPositions) * decisions / 1_073_741_824),
    cap16GiB: rounded(cappedScalars["16"]! * averageScalarBytes / Math.max(1, successfulPositions) * decisions / 1_073_741_824),
    cap32GiB: rounded(cappedScalars["32"]! * averageScalarBytes / Math.max(1, successfulPositions) * decisions / 1_073_741_824),
  }));
  return {
    schema: "tabiya.research.d1329-projection-cost.v2" as const,
    measuredAt: new Date().toISOString(),
    source: { decompressedPrefixSha256: EXPECTED_INPUT, selection: "five-min-sha256-per-36-cells", samplePerCell: SAMPLE_PER_CELL },
    engine: { name: engine.name, version: engine.version, depth: DEPTH, threads: 1, hashMb: 16 },
    population: {
      sampledPositions: sample.length,
      successfulPositions,
      failedPositions: sample.length - successfulPositions,
      successRate: rounded(successRate),
      sampledLegalCandidates,
      successfulLegalCandidates,
      failedLegalCandidates: sampledLegalCandidates - successfulLegalCandidates,
      byCell: Object.fromEntries([...byCell].sort(([left], [right]) => left.localeCompare(right))),
    },
    timing: { engineMs: rounded(engineMs), projectionMs: rounded(projectionMs) },
    generic: { distinctNames: new Set([...projection.values()].flatMap((row) => [...row.names])).size, scalars: genericScalars, bytes: genericBytes },
    compactBudgets: { cappedScalars, averageScalarBytes: rounded(averageScalarBytes) },
    projections: Object.fromEntries([...projection].sort(([left], [right]) => left.localeCompare(right)).map(([id, row]) => [id, {
      emissions: row.emissions,
      payloadBytes: row.payloadBytes,
      distinctNames: row.names.size,
      flattenedScalars: row.flattenedScalars,
      flattenedBytes: row.flattenedBytes,
      cappedScalars: row.cappedScalars,
    }])),
    errors: Object.fromEntries([...errors].sort(([left], [right]) => left.localeCompare(right))),
    estimates,
    verdict: successRate >= 0.99 ? "projection_gate_pass_owner_budget_pending" : "projection_gate_fail" as const,
  };
}

describe("D1329 projection and cost census", () => {
  it("keeps identity leaves out of the generic model plane and applies only cardinality budgets", () => {
    const flat = new Map<string, string | number | boolean>();
    flatten({ fen: "8/8/8/8/8/8/8/8", square: "e4", role: "knight", count: 2, flags: [true, false] }, "p", flat);
    expect([...flat.keys()]).not.toContain("cat:p.fen=8/8/8/8/8/8/8/8");
    expect([...flat.keys()]).not.toContain("cat:p.square=e4");
    expect(flat.get("cat:p.role=knight")).toBe(true);
    expect(flat.get("num:p.count")).toBe(2);
    expect(Math.min(flat.size, 2)).toBe(2);
  });

  it.skipIf(INPUT === undefined)("runs the frozen 36-cell projection arm", async () => {
    const result = await measure(INPUT!);
    if (WRITE) {
      writeFileSync(RESULT, `${JSON.stringify(result, null, 2)}\n`);
      writeFileSync(REPORT, markdown(result));
    }
    expect(result.population.sampledPositions).toBe(180);
    expect(Object.keys(result.population.byCell)).toHaveLength(36);
    expect(result.verdict).toBe(result.population.successRate >= 0.99
      ? "projection_gate_pass_owner_budget_pending"
      : "projection_gate_fail");
    expect(result.generic.distinctNames).toBeGreaterThan(0);
  }, 3_600_000);
});
