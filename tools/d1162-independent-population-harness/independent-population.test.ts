// DISPOSABLE research harness — D1162. No production policy, engine, or network calls.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { Chess, normalizeMove } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { makeUci, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { candidateFeatureVector, type CandidateFeatureRow } from "../../apps/server/src/candidate-evidence.js";
import type { TransferPosition } from "./extract.js";

const INPUT = process.env.TABIYA_D1162_TRANSFER_INPUT;
const PROBE = process.env.TABIYA_D1162_TRANSFER_PROBE;
const WRITE = process.env.TABIYA_D1162_TRANSFER_WRITE === "1";
const RESULT = new URL("../../planning/platform-alignment/bot-policy/d1162-independent-population-results.json", import.meta.url);
const REPORT = new URL("../../planning/platform-alignment/bot-policy/d1162-independent-population-results.md", import.meta.url);
const LAMBDAS = [0.01, 0.1, 1, 10] as const;
const EXPECTED_PGN = "sha256:a10a233e8e51f6a0877f65cee417339080d2fd32cd22886f755f576c84fa58ec";
const EXPECTED_FIRST_SF = "sha256:890c60150f28c7f930a07553b2df4d80cf4fd903ebca33837e7aefe42219844e";

type Sparse = ReadonlyMap<string, number>;
type Arm = "uniform" | "engine" | "evidence" | "combined";
interface InputFile {
  readonly source: { readonly pgnSha256: string; readonly firstScreenSfSha256: string };
  readonly exclusions: Readonly<Record<string, number>>;
  readonly positions: readonly TransferPosition[];
}
interface ProbeEntry { readonly uci: string; readonly cp: number | null; readonly mate: number | null; readonly depth: number }
interface ProbeRow {
  readonly inputSha256: string;
  readonly engine: { readonly name: string; readonly version: string };
  readonly id: string;
  readonly gameId: string;
  readonly fen: string;
  readonly depth: number;
  readonly legalCount: number;
  readonly entries: readonly ProbeEntry[];
}
interface Candidate { readonly moveUci: string; readonly scoreCp: number; readonly raw: Sparse }
interface Position {
  readonly id: string;
  readonly gameId: string;
  readonly fold: number;
  readonly ratingBand: TransferPosition["ratingBand"];
  readonly speed: TransferPosition["speed"];
  readonly ply: number;
  readonly fen: string;
  readonly playedUci: string;
  readonly candidates: readonly Candidate[];
}
interface PreparedRow { readonly position: Position; readonly candidates: readonly Sparse[] }
interface Prepared { readonly rows: readonly PreparedRow[]; readonly names: readonly string[] }
interface DecisionMeasure {
  readonly id: string;
  readonly gameId: string;
  readonly ratingBand: string;
  readonly speed: string;
  readonly ply: number;
  readonly playedMass: number;
  readonly crossEntropy: number;
  readonly topAgreement: number;
  readonly expectedLossCp: number;
  readonly severe250: number;
}

function digest(text: string): string { return `sha256:${createHash("sha256").update(text).digest("hex")}`; }
function rounded(value: number): number { return Number(value.toFixed(6)); }
function lines<T>(text: string): readonly T[] { return text.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as T); }
function add(map: Map<string, number>, key: string, value: number): void { map.set(key, (map.get(key) ?? 0) + value); }
function identityValue(key: string, value: string): boolean {
  return /id$/iu.test(key) || /fen$/iu.test(key) || /(?:move)?uci$/iu.test(key) || /san$/iu.test(key) ||
    /square$/iu.test(key) || /^(?:from|to|orig|dest)$/iu.test(key) || value.split("/").length === 8 ||
    /^[a-h][1-8]$/u.test(value) || /^[a-h][1-8][a-h][1-8][qrbn]?$/u.test(value);
}
function flatten(value: unknown, path: string, map: Map<string, number>): void {
  if (typeof value === "number" && Number.isFinite(value)) { add(map, `num:${path}`, value); return; }
  if (typeof value === "boolean") { add(map, `bool:${path}`, value ? 1 : 0); return; }
  if (typeof value === "string") {
    const key = path.split(".").at(-1) ?? path;
    if (!identityValue(key, value)) add(map, `cat:${path}=${value}`, 1);
    return;
  }
  if (Array.isArray(value)) {
    add(map, `num:${path}.length`, value.length);
    for (const item of value) flatten(item, `${path}[]`, map);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) flatten(child, path ? `${path}.${key}` : key, map);
  }
}
function evidenceFeatures(row: CandidateFeatureRow): Sparse {
  const map = new Map<string, number>();
  for (const result of row.results) {
    const root = `${result.source.id}@${String(result.source.version)}`;
    add(map, `presence:${root}`, 1);
    flatten(result.payload, root, map);
  }
  return map;
}
function uniform(count: number): readonly number[] { return Array.from({ length: count }, () => 1 / count); }
function distribution(candidates: readonly Sparse[], weights: ReadonlyMap<string, number>): readonly number[] {
  const scores = candidates.map((candidate) => {
    let score = 0;
    for (const [name, value] of candidate) score += (weights.get(name) ?? 0) * value;
    return score;
  });
  const maximum = Math.max(...scores);
  const masses = scores.map((score) => Math.exp(score - maximum));
  const total = masses.reduce((sum, value) => sum + value, 0);
  return masses.map((mass) => mass / total);
}
function xorshift(seed: number): () => number {
  let state = seed >>> 0;
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 0x100000000; };
}
function interval(values: readonly number[]): readonly [number, number] {
  const random = xorshift(0x1162b);
  const means: number[] = [];
  for (let sample = 0; sample < 10_000; sample += 1) {
    let sum = 0;
    for (let index = 0; index < values.length; index += 1) sum += values[Math.floor(random() * values.length)]!;
    means.push(sum / values.length);
  }
  means.sort((left, right) => left - right);
  return [rounded(means[Math.floor(means.length * 0.025)]!), rounded(means[Math.floor(means.length * 0.975)]!)];
}
function groupMeans<T>(rows: readonly T[], group: (row: T) => string, value: (row: T) => number): readonly number[] {
  const values = new Map<string, number[]>();
  for (const row of rows) {
    const key = group(row);
    const found = values.get(key) ?? [];
    found.push(value(row));
    values.set(key, found);
  }
  return [...values.values()].map((items) => items.reduce((sum, item) => sum + item, 0) / items.length);
}
function assertLegalIdentity(position: TransferPosition, entries: readonly ProbeEntry[]): void {
  const actual = entries.map((entry) => entry.uci);
  if (new Set(actual).size !== actual.length) throw new Error(`duplicate engine move at ${position.id}`);
  if (JSON.stringify([...actual].sort()) !== JSON.stringify([...position.legalUci].sort())) throw new Error(`legal-set mismatch at ${position.id}`);
  if (!actual.includes(position.playedUci)) throw new Error(`played move missing at ${position.id}`);
}

function build(inputText: string, probeText: string): {
  readonly positions: readonly Position[];
  readonly excludedMixedScore: number;
  readonly inputs: Readonly<Record<string, string>>;
  readonly engine: ProbeRow["engine"];
  readonly exclusions: Readonly<Record<string, number>>;
} {
  const input = JSON.parse(inputText) as InputFile;
  if (input.source.pgnSha256 !== EXPECTED_PGN || input.source.firstScreenSfSha256 !== EXPECTED_FIRST_SF) throw new Error("population source changed");
  if (new Set(input.positions.map((row) => row.fen)).size !== input.positions.length) throw new Error("duplicate FEN in admitted population");
  for (const row of input.positions) if (row.fold !== createHash("sha256").update(row.gameId).digest().readUInt32BE(0) % 5) throw new Error(`fold escaped game identity at ${row.id}`);
  const probes = lines<ProbeRow>(probeText);
  const probeByFen = new Map(probes.map((row) => [row.fen, row]));
  if (probes.length !== input.positions.length || probeByFen.size !== input.positions.length) throw new Error("probe does not cover every extracted position exactly once");
  const engine = probes[0]?.engine;
  if (engine === undefined || engine.name !== "Stockfish" || engine.version !== "18") throw new Error("engine identity changed");
  const inputSha = digest(inputText);
  const positions: Position[] = [];
  let excludedMixedScore = 0;
  for (const row of input.positions) {
    const probe = probeByFen.get(row.fen);
    if (probe === undefined || probe.id !== row.id || probe.gameId !== row.gameId || probe.inputSha256 !== inputSha || probe.depth !== 12 || probe.legalCount !== row.legalUci.length) throw new Error(`probe contract mismatch at ${row.id}`);
    assertLegalIdentity(row, probe.entries);
    if (probe.entries.some((entry) => entry.depth < 12)) throw new Error(`incomplete depth at ${row.id}`);
    if (probe.entries.some((entry) => entry.mate !== null) || probe.entries.some((entry) => entry.cp === null)) { excludedMixedScore += 1; continue; }
    const vector = candidateFeatureVector({
      beforeFen: row.fen,
      engine: { id: "stockfish-d1162-independent", name: engine.name, version: engine.version, seedHonored: false, searchBound: { kind: "depth", value: 12 } },
      candidates: probe.entries.map((entry) => ({ moveUci: entry.uci, scoreCp: entry.cp! })),
    });
    if (vector.candidates.length !== row.legalUci.length) throw new Error(`candidate adapter lost legal identities at ${row.id}`);
    positions.push({ ...row, candidates: vector.candidates.map((candidate) => ({ moveUci: candidate.moveUci, scoreCp: candidate.scoreCp, raw: evidenceFeatures(candidate) })) });
  }
  return { positions, excludedMixedScore, inputs: { positions: inputSha, probe: digest(probeText) }, engine, exclusions: input.exclusions };
}

function prepare(positions: readonly Position[], training: ReadonlySet<number>, arm: Exclude<Arm, "uniform">): Prepared {
  const train = positions.filter((position) => training.has(position.fold));
  const categoricalPositions = new Map<string, Set<string>>();
  const names = new Set<string>();
  for (const position of train) for (const candidate of position.candidates) for (const name of candidate.raw.keys()) {
    if (name.startsWith("cat:")) {
      const found = categoricalPositions.get(name) ?? new Set<string>();
      found.add(position.fen);
      categoricalPositions.set(name, found);
    } else names.add(name);
  }
  const minimum = Math.ceil(train.length * 0.05);
  for (const [name, fens] of categoricalPositions) if (fens.size >= minimum) names.add(name);
  if (arm !== "evidence") names.add("num:engine.loss_cp");
  if (arm === "engine") for (const name of [...names]) if (name !== "num:engine.loss_cp") names.delete(name);
  const ordered = [...names].sort();
  const means = new Map<string, number>();
  const deviations = new Map<string, number>();
  const rawValue = (position: Position, candidate: Candidate, name: string): number => name === "num:engine.loss_cp" ?
    Math.max(...position.candidates.map((item) => item.scoreCp)) - candidate.scoreCp : candidate.raw.get(name) ?? 0;
  const trainingCandidates = train.flatMap((position) => position.candidates.map((candidate) => ({ position, candidate })));
  for (const name of ordered.filter((item) => item.startsWith("num:"))) {
    const values = trainingCandidates.map(({ position, candidate }) => rawValue(position, candidate, name));
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, values.length - 1));
    means.set(name, mean);
    deviations.set(name, deviation || 1);
  }
  return {
    names: ordered,
    rows: positions.map((position) => ({
      position,
      candidates: position.candidates.map((candidate) => new Map(ordered.flatMap((name) => {
        let value = rawValue(position, candidate, name);
        if (name.startsWith("num:")) value = Math.max(-8, Math.min(8, (value - means.get(name)!) / deviations.get(name)!));
        return value === 0 ? [] : [[name, value] as const];
      }))),
    })),
  };
}

function fit(prepared: Prepared, folds: ReadonlySet<number>, lambda: number): ReadonlyMap<string, number> {
  const deltas = new Map<string, number>();
  const counts = new Map<string, number>();
  const sums = new Map<string, number>();
  const squares = new Map<string, number>();
  const candidateCounts = new Map<string, number>();
  for (const row of prepared.rows.filter((item) => folds.has(item.position.fold))) {
    const playedIndex = row.position.candidates.findIndex((candidate) => candidate.moveUci === row.position.playedUci);
    if (playedIndex < 0) throw new Error(`played move absent during fit at ${row.position.id}`);
    for (const name of prepared.names) {
      let uniformMean = 0;
      for (const candidate of row.candidates) {
        const value = candidate.get(name) ?? 0;
        uniformMean += value / row.candidates.length;
        add(sums, name, value);
        add(squares, name, value * value);
        add(candidateCounts, name, 1);
      }
      add(deltas, name, (row.candidates[playedIndex]!.get(name) ?? 0) - uniformMean);
      add(counts, name, 1);
    }
  }
  return new Map(prepared.names.map((name) => {
    const meanDelta = (deltas.get(name) ?? 0) / Math.max(1, counts.get(name) ?? 0);
    const count = Math.max(1, candidateCounts.get(name) ?? 0);
    const mean = (sums.get(name) ?? 0) / count;
    const variance = Math.max(0, (squares.get(name) ?? 0) / count - mean * mean);
    return [name, meanDelta / (variance + lambda)] as const;
  }));
}

function measure(row: PreparedRow, predicted: readonly number[]): DecisionMeasure {
  const played = row.position.candidates.findIndex((candidate) => candidate.moveUci === row.position.playedUci);
  if (played < 0) throw new Error(`played move absent during measurement at ${row.position.id}`);
  const best = Math.max(...row.position.candidates.map((candidate) => candidate.scoreCp));
  let expectedLossCp = 0;
  let severe250 = 0;
  for (let index = 0; index < predicted.length; index += 1) {
    const loss = best - row.position.candidates[index]!.scoreCp;
    expectedLossCp += predicted[index]! * loss;
    if (loss > 250) severe250 += predicted[index]!;
  }
  return {
    id: row.position.id,
    gameId: row.position.gameId,
    ratingBand: row.position.ratingBand,
    speed: row.position.speed,
    ply: row.position.ply,
    playedMass: predicted[played]!,
    crossEntropy: -Math.log(Math.max(1e-12, predicted[played]!)),
    topAgreement: predicted.indexOf(Math.max(...predicted)) === played ? 1 : 0,
    expectedLossCp,
    severe250,
  };
}
function gameAverage(rows: readonly DecisionMeasure[], key: keyof Pick<DecisionMeasure, "playedMass" | "crossEntropy" | "topAgreement" | "expectedLossCp" | "severe250">): number {
  const values = groupMeans(rows, (row) => row.gameId, (row) => row[key]);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function summarize(rows: readonly DecisionMeasure[]): Readonly<Record<string, number>> {
  return {
    games: new Set(rows.map((row) => row.gameId)).size,
    decisions: rows.length,
    playedMass: rounded(gameAverage(rows, "playedMass")),
    crossEntropy: rounded(gameAverage(rows, "crossEntropy")),
    topAgreement: rounded(gameAverage(rows, "topAgreement")),
    expectedLossCp: rounded(gameAverage(rows, "expectedLossCp")),
    severe250: rounded(gameAverage(rows, "severe250")),
  };
}
function contrast(left: readonly DecisionMeasure[], right: readonly DecisionMeasure[], filter: (row: DecisionMeasure) => boolean = () => true) {
  const rightById = new Map(right.map((row) => [row.id, row]));
  const decisions = left.filter(filter).map((row) => ({ ...row, difference: row.playedMass - rightById.get(row.id)!.playedMass }));
  const values = groupMeans(decisions, (row) => row.gameId, (row) => row.difference);
  return { games: values.length, decisions: decisions.length, mean: rounded(values.reduce((sum, value) => sum + value, 0) / values.length), ci95: interval(values) };
}
function validationLoss(prepared: Prepared, weights: ReadonlyMap<string, number>, fold: number): number {
  const rows = prepared.rows.filter((row) => row.position.fold === fold).map((row) => measure(row, distribution(row.candidates, weights)));
  return gameAverage(rows, "crossEntropy");
}

function run(inputText: string, probeText: string) {
  const built = build(inputText, probeText);
  const measures: Record<Arm, DecisionMeasure[]> = { uniform: [], engine: [], evidence: [], combined: [] };
  const choices: Record<string, number> = {};
  for (const arm of ["engine", "evidence", "combined"] as const) for (const outer of [0, 1, 2, 3, 4]) {
    const allTrain = new Set([0, 1, 2, 3, 4].filter((fold) => fold !== outer));
    const inner = (outer + 1) % 5;
    const innerTrain = new Set([...allTrain].filter((fold) => fold !== inner));
    const prepared = prepare(built.positions, allTrain, arm);
    const ranked = LAMBDAS.map((lambda) => ({ lambda, loss: validationLoss(prepared, fit(prepared, innerTrain, lambda), inner) }))
      .sort((left, right) => left.loss - right.loss || right.lambda - left.lambda);
    const chosen = ranked[0]!.lambda;
    choices[`${arm}:${String(outer)}`] = chosen;
    const weights = fit(prepared, allTrain, chosen);
    for (const row of prepared.rows.filter((item) => item.position.fold === outer)) {
      measures[arm].push(measure(row, distribution(row.candidates, weights)));
      if (arm === "engine") measures.uniform.push(measure(row, uniform(row.candidates.length)));
    }
  }
  for (const rows of Object.values(measures)) rows.sort((left, right) => left.id.localeCompare(right.id));
  const bands = ["1000-1399", "1400-1799", "1800-2199"];
  const speeds = ["bullet", "blitz", "rapid"];
  const plies = [8, 16, 24, 32, 40, 48];
  const evidenceVsUniform = contrast(measures.evidence, measures.uniform);
  const combinedVsEngine = contrast(measures.combined, measures.engine);
  const byBand = Object.fromEntries(bands.map((band) => [band, {
    evidenceVsUniform: contrast(measures.evidence, measures.uniform, (row) => row.ratingBand === band),
    combinedVsEngine: contrast(measures.combined, measures.engine, (row) => row.ratingBand === band),
  }]));
  const primary = { evidenceVsUniform, combinedVsEngine, byBand };
  const pass = evidenceVsUniform.ci95[0] > 0 && combinedVsEngine.ci95[0] > 0 &&
    Object.values(byBand).every((row) => row.evidenceVsUniform.mean >= 0 && row.combinedVsEngine.mean >= 0);
  const refuted = evidenceVsUniform.mean <= 0 || combinedVsEngine.mean <= 0 ||
    Object.values(byBand).some((row) => row.evidenceVsUniform.mean < 0 || row.combinedVsEngine.mean < 0);
  return {
    measuredAt: new Date().toISOString(),
    inputs: built.inputs,
    sourceExclusions: built.exclusions,
    engine: built.engine,
    population: {
      positions: built.positions.length,
      games: new Set(built.positions.map((row) => row.gameId)).size,
      legalCandidates: built.positions.reduce((sum, row) => sum + row.candidates.length, 0),
      excludedMixedScore: built.excludedMixedScore,
      legalSetCoverage: 1,
      folds: Object.fromEntries([0, 1, 2, 3, 4].map((fold) => [fold, { games: new Set(built.positions.filter((row) => row.fold === fold).map((row) => row.gameId)).size, decisions: built.positions.filter((row) => row.fold === fold).length }])),
    },
    parameters: { lambdas: LAMBDAS, categoricalFloor: 0.05, bootstrapSamples: 10_000, bootstrapSeed: "0x1162b", bootstrapUnit: "game" },
    choices,
    summary: Object.fromEntries((Object.keys(measures) as Arm[]).map((arm) => [arm, summarize(measures[arm])])),
    slices: {
      ratingBand: Object.fromEntries(bands.map((band) => [band, Object.fromEntries((Object.keys(measures) as Arm[]).map((arm) => [arm, summarize(measures[arm].filter((row) => row.ratingBand === band))]))])),
      speed: Object.fromEntries(speeds.map((speed) => [speed, Object.fromEntries((Object.keys(measures) as Arm[]).map((arm) => [arm, summarize(measures[arm].filter((row) => row.speed === speed))]))])),
      ply: Object.fromEntries(plies.map((ply) => [ply, Object.fromEntries((Object.keys(measures) as Arm[]).map((arm) => [arm, summarize(measures[arm].filter((row) => row.ply === ply))]))])),
    },
    primary,
    verdict: pass ? "pass" : refuted ? "refuted" : "inconclusive",
  };
}

function markdown(result: ReturnType<typeof run>): string {
  return `# D1162 independent-population result\n\nVerdict: **${result.verdict}**. ${String(result.population.positions)} decisions from ${String(result.population.games)} games; ${String(result.population.legalCandidates)} legal candidates; ${(result.population.legalSetCoverage * 100).toFixed(0)}% legal-set identity.\n\n| contrast | mean game-level played-move probability delta | game-bootstrap 95% CI |\n|---|---:|---:|\n| evidence-only − uniform | ${result.primary.evidenceVsUniform.mean.toFixed(6)} | [${result.primary.evidenceVsUniform.ci95.join(", ")}] |\n| evidence + engine − engine-only | ${result.primary.combinedVsEngine.mean.toFixed(6)} | [${result.primary.combinedVsEngine.ci95.join(", ")}] |\n\nCross entropy, top agreement and engine-loss safety readings are retained in the JSON result. This is a second held-out representation screen, not a human-like, personality, Elo, skill or production claim.\n`;
}

describe("D1162 independent-population screen", () => {
  it("pins game-level independence, variance, bootstrap and legal identity controls", () => {
    expect(new Set(["g#8", "g#16"].map(() => createHash("sha256").update("g").digest().readUInt32BE(0) % 5)).size).toBe(1);
    expect(uniform(2)).toEqual([0.5, 0.5]);
    expect(groupMeans([{ game: "long", x: 1 }, { game: "long", x: 1 }, { game: "long", x: 1 }, { game: "short", x: 0 }], (row) => row.game, (row) => row.x)).toEqual([1, 0]);
    expect(interval([1, 1, 1])).toEqual([1, 1]);
    const position = { id: "variance", gameId: "g", fold: 0, ratingBand: "1400-1799", speed: "blitz", ply: 8, fen: "", playedUci: "a", candidates: [{ moveUci: "a", scoreCp: 0, raw: new Map() }, { moveUci: "b", scoreCp: 0, raw: new Map() }] } as Position;
    expect(fit({ names: ["bool:x"], rows: [{ position, candidates: [new Map([["bool:x", 1]]), new Map()] }] }, new Set([0]), 0).get("bool:x")).toBe(2);
    const castle = Chess.fromSetup(parseFen("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1").unwrap()).unwrap();
    expect(makeUci(normalizeMove(castle, parseUci("e1g1")!))).toBe("e1h1");
    const legalFixture = { id: "legal", legalUci: ["e1h1", "e1a1"], playedUci: "e1h1" } as TransferPosition;
    expect(() => assertLegalIdentity(legalFixture, [{ uci: "e1h1", cp: 0, mate: null, depth: 12 }])).toThrow("legal-set mismatch");
    expect(() => assertLegalIdentity({ ...legalFixture, playedUci: "e1e2" }, [{ uci: "e1h1", cp: 0, mate: null, depth: 12 }, { uci: "e1a1", cp: 0, mate: null, depth: 12 }])).toThrow("played move missing");
  });

  it.skipIf(INPUT === undefined || PROBE === undefined)("runs the preregistered independent population", () => {
    const result = run(readFileSync(INPUT!, "utf8"), readFileSync(PROBE!, "utf8"));
    expect(result.population).toMatchObject({ games: 108, legalSetCoverage: 1 });
    expect(result.population.positions).toBeGreaterThan(500);
    expect(["pass", "refuted", "inconclusive"]).toContain(result.verdict);
    if (WRITE) {
      writeFileSync(RESULT, `${JSON.stringify(result, null, 2)}\n`);
      writeFileSync(REPORT, markdown(result));
    }
  });
});
