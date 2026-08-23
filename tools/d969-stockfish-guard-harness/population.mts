#!/usr/bin/env node

// Disposable D969 population instrument. It obtains production-shaped Maia
// candidate vectors from a running local Tabiya server, then probes those exact
// sets with Stockfish. It emits aggregates only.

import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { join } from "node:path";

type Phase = "opening" | "middlegame" | "endgame" | "cross_phase";
type Score = Readonly<{ kind: "cp" | "mate"; value: number }>;
type Candidate = Readonly<{ moveUci: string; rank: number; mass?: number }>;
type Pack = Readonly<{ id: string; phase: string; start: Readonly<{ fen: string }>; spine: readonly unknown[] }>;
type Limit = Readonly<{ id: string; kind: "nodes" | "depth"; value: number }>;

const root = new URL("../../", import.meta.url).pathname;
const baseUrl = process.env.TABIYA_D969_BASE_URL ?? "http://127.0.0.1:3000";
const stockfish = process.env.SF_CMD ?? "/opt/homebrew/bin/stockfish";
const perPhase = Number(process.env.TABIYA_D969_PER_PHASE ?? Number.MAX_SAFE_INTEGER);
const phases: readonly Phase[] = ["opening", "middlegame", "endgame", "cross_phase"];
const limits: readonly Limit[] = Object.freeze([
  { id: "nodes_25000", kind: "nodes", value: 25_000 },
  { id: "nodes_50000", kind: "nodes", value: 50_000 },
  { id: "depth_8", kind: "depth", value: 8 },
  { id: "depth_10", kind: "depth", value: 10 },
  { id: "depth_12", kind: "depth", value: 12 },
]);
const digest = `sha256:${"9".repeat(64)}`;
const password = "d969-disposable-local-probe";
let cookie = "";

function percentile(values: readonly number[], fraction: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return Number(sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)]!.toFixed(3));
}

function score(line: string): Score | undefined {
  const match = /\bscore (cp|mate) (-?\d+)\b/.exec(line);
  return match === null ? undefined : Object.freeze({ kind: match[1] as Score["kind"], value: Number(match[2]) });
}

class Stockfish {
  readonly process = spawn(stockfish, [], { stdio: ["pipe", "pipe", "inherit"] });
  readonly queue: string[] = [];
  readonly waiters: Array<(line: string) => void> = [];

  constructor() {
    createInterface({ input: this.process.stdout }).on("line", (line) => {
      const waiter = this.waiters.shift();
      if (waiter === undefined) this.queue.push(line); else waiter(line);
    });
  }

  send(command: string): void { this.process.stdin.write(`${command}\n`); }
  async next(): Promise<string> { return this.queue.shift() ?? new Promise((resolve) => this.waiters.push(resolve)); }
  async until(predicate: (line: string) => boolean): Promise<string[]> {
    const rows: string[] = [];
    while (true) { const line = await this.next(); rows.push(line); if (predicate(line)) return rows; }
  }
  async initialize(): Promise<void> {
    this.send("uci"); await this.until((line) => line === "uciok");
    this.send("setoption name Threads value 1");
    this.send("setoption name Hash value 16");
    this.send("setoption name MultiPV value 1");
    this.send("isready"); await this.until((line) => line === "readyok");
  }
  async probe(fen: string, moves: readonly string[], limit: Limit) {
    this.send("ucinewgame");
    this.send("setoption name Clear Hash");
    this.send(`setoption name MultiPV value ${moves.length}`);
    this.send("isready"); await this.until((line) => line === "readyok");
    this.send(`position fen ${fen}`);
    const startedAt = performance.now();
    this.send(`go ${limit.kind} ${limit.value} searchmoves ${moves.join(" ")}`);
    const rows = await this.until((line) => line.startsWith("bestmove "));
    const elapsedMs = performance.now() - startedAt;
    const finalByMove = new Map<string, string>();
    for (const line of rows) {
      if (!line.startsWith("info ") || score(line) === undefined) continue;
      const move = /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)\b/.exec(line)?.[1];
      if (move !== undefined && moves.includes(move)) finalByMove.set(move, line);
    }
    const returned = moves.map((move) => {
      const line = finalByMove.get(move);
      return Object.freeze({
        move,
        score: line === undefined ? undefined : score(line),
        bound: line === undefined ? "missing" : /\b(lowerbound|upperbound)\b/.exec(line)?.[1] ?? "exact",
      });
    });
    return Object.freeze({ elapsedMs, returned });
  }
  close(): void { this.send("quit"); }
}

async function packs(): Promise<readonly Pack[]> {
  const directory = join(root, "content/drafts");
  const found: Pack[] = [];
  for (const name of (await readdir(directory)).filter((value) =>
    value.endsWith(".json") &&
    !value.endsWith(".browser.json") &&
    !/\.(?:evidence|job|sources)\.json$/u.test(value)
  ).sort()) {
    try {
      const value = JSON.parse(await readFile(join(directory, name), "utf8")) as Partial<Pack>;
      if (typeof value.id === "string" && typeof value.phase === "string" && typeof value.start?.fen === "string" && Array.isArray(value.spine)) found.push(value as Pack);
    } catch { /* Malformed draft documents do not enter this population. */ }
  }
  return Object.freeze(phases.flatMap((phase) => found.filter((pack) => pack.phase === phase).slice(0, perPhase)));
}

async function api(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { ...(init.body === undefined ? {} : { "content-type": "application/json" }), ...(cookie === "" ? {} : { cookie }), ...init.headers },
  });
}

async function authenticate(): Promise<void> {
  const response = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({ handle: `d969-${Date.now().toString(36)}`, password }),
  });
  if (!response.ok) throw new Error(`Authentication setup failed: HTTP ${response.status} ${await response.text()}`);
  cookie = response.headers.get("set-cookie")?.split(";", 1)[0] ?? "";
  if (cookie === "") throw new Error("Authentication setup returned no session cookie");
}

async function deleteProbeAccount(): Promise<void> {
  if (cookie === "") return;
  const preview = await api("/auth/deletion-preview", { method: "POST", body: JSON.stringify({}) });
  if (!preview.ok) throw new Error(`Deletion preview failed: HTTP ${preview.status}`);
  const value = await preview.json() as { digest: string };
  const removed = await api("/auth/delete", {
    method: "POST",
    body: JSON.stringify({ password, previewDigest: value.digest }),
  });
  if (!removed.ok) throw new Error(`Probe-account deletion failed: HTTP ${removed.status} ${await removed.text()}`);
  cookie = "";
}

async function maiaCandidates(pack: Pack, seed: number): Promise<{ candidates: readonly Candidate[]; elapsedMs: number }> {
  const startedAt = performance.now();
  const response = await api("/select-move", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      startFen: pack.start.fen,
      historyUci: [],
      policy: { mode: "human_common", policyConfigDigest: digest, targetElo: 1800, temperature: 0.8, topP: 0.92 },
      seed,
    }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${pack.id}: HTTP ${response.status} ${text}`);
  const parsed = JSON.parse(text) as { candidates?: readonly Candidate[] };
  if (!Array.isArray(parsed.candidates) || parsed.candidates.length === 0) throw new Error(`${pack.id}: Maia returned no candidates`);
  return Object.freeze({ candidates: parsed.candidates, elapsedMs: performance.now() - startedAt });
}

const population = await packs();
const engine = new Stockfish();
await engine.initialize();
const rows: Array<{
  packId: string;
  phase: Phase;
  candidateCount: number;
  maiaMs: number;
  probes: Record<string, Awaited<ReturnType<Stockfish["probe"]>>>;
}> = [];
try {
  await authenticate();
  for (const [index, pack] of population.entries()) {
    const maia = await maiaCandidates(pack, index + 1);
    const moves = maia.candidates.map((candidate) => candidate.moveUci);
    const probes: Record<string, Awaited<ReturnType<Stockfish["probe"]>>> = {};
    for (const limit of limits) probes[limit.id] = await engine.probe(pack.start.fen, moves, limit);
    rows.push({ packId: pack.id, phase: pack.phase as Phase, candidateCount: moves.length, maiaMs: maia.elapsedMs, probes });
  }
} finally {
  engine.close();
  await deleteProbeAccount();
}

function severeMask(probe: Awaited<ReturnType<Stockfish["probe"]>>): ReadonlySet<string> | undefined {
  if (probe.returned.some((row) => row.bound !== "exact" || row.score?.kind !== "cp")) return undefined;
  const best = Math.max(...probe.returned.map((row) => row.score!.value));
  return new Set(probe.returned.filter((row) => best - row.score!.value >= 250).map((row) => row.move));
}

function sameSet(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  return left.size === right.size && [...left].every((move) => right.has(move));
}

const summaries = Object.fromEntries(limits.map((limit) => {
  const probes = rows.map((row) => row.probes[limit.id]!);
  const bounded = probes.flatMap((probe) => probe.returned).filter((row) => row.bound === "lowerbound" || row.bound === "upperbound").length;
  const missing = probes.flatMap((probe) => probe.returned).filter((row) => row.bound === "missing").length;
  const exactPositions = probes.filter((probe) => probe.returned.every((row) => row.bound === "exact")).length;
  const matePositions = probes.filter((probe) => probe.returned.some((row) => row.score?.kind === "mate")).length;
  const mixedScorePositions = probes.filter((probe) => {
    const kinds = new Set(probe.returned.flatMap((row) => row.score === undefined ? [] : [row.score.kind]));
    return kinds.size > 1;
  }).length;
  const elapsed = probes.map((probe) => probe.elapsedMs);
  const endToEnd = rows.map((row) => row.maiaMs + row.probes[limit.id]!.elapsedMs);
  let referenceComparablePositions = 0;
  let severeMaskSetMatches = 0;
  let candidateClassifications = 0;
  let candidateClassificationMatches = 0;
  let falseSevere = 0;
  let missedSevere = 0;
  for (const row of rows) {
    const candidateMask = severeMask(row.probes[limit.id]!);
    const referenceMask = severeMask(row.probes.depth_12!);
    if (candidateMask === undefined || referenceMask === undefined) continue;
    referenceComparablePositions += 1;
    if (sameSet(candidateMask, referenceMask)) severeMaskSetMatches += 1;
    for (const returned of row.probes[limit.id]!.returned) {
      const candidateSevere = candidateMask.has(returned.move);
      const referenceSevere = referenceMask.has(returned.move);
      candidateClassifications += 1;
      if (candidateSevere === referenceSevere) candidateClassificationMatches += 1;
      else if (candidateSevere) falseSevere += 1;
      else missedSevere += 1;
    }
  }
  const byPhase = Object.fromEntries(phases.map((phase) => {
    const phaseRows = rows.filter((row) => row.phase === phase);
    const phaseProbes = phaseRows.map((row) => row.probes[limit.id]!);
    const phaseExact = phaseProbes.filter((probe) => probe.returned.every((row) => row.bound === "exact")).length;
    const phaseElapsed = phaseProbes.map((probe) => probe.elapsedMs);
    return [phase, Object.freeze({
      positions: phaseRows.length,
      exactPositions: phaseExact,
      exactRate: phaseRows.length === 0 ? null : Number((phaseExact / phaseRows.length).toFixed(4)),
      boundedRows: phaseProbes.flatMap((probe) => probe.returned).filter((row) => row.bound === "lowerbound" || row.bound === "upperbound").length,
      latencyMs: Object.freeze({ p50: percentile(phaseElapsed, 0.5), p95: percentile(phaseElapsed, 0.95), max: percentile(phaseElapsed, 1) }),
    })];
  }));
  return [limit.id, Object.freeze({
    positions: probes.length,
    exactPositions,
    exactRate: Number((exactPositions / probes.length).toFixed(4)),
    requestedCandidates: rows.reduce((sum, row) => sum + row.candidateCount, 0),
    boundedRows: bounded,
    missingRows: missing,
    matePositions,
    mixedScorePositions,
    latencyMs: Object.freeze({ p50: percentile(elapsed, 0.5), p90: percentile(elapsed, 0.9), p95: percentile(elapsed, 0.95), max: percentile(elapsed, 1) }),
    endToEndLatencyMs: Object.freeze({ p50: percentile(endToEnd, 0.5), p90: percentile(endToEnd, 0.9), p95: percentile(endToEnd, 0.95), max: percentile(endToEnd, 1) }),
    versusDepth12: Object.freeze({
      comparablePositions: referenceComparablePositions,
      severeMaskSetMatches,
      severeMaskSetMatchRate: referenceComparablePositions === 0 ? null : Number((severeMaskSetMatches / referenceComparablePositions).toFixed(4)),
      candidateClassifications,
      candidateClassificationMatches,
      candidateClassificationMatchRate: candidateClassifications === 0 ? null : Number((candidateClassificationMatches / candidateClassifications).toFixed(4)),
      falseSevere,
      missedSevere,
    }),
    byPhase,
  })];
}));

const widths = rows.map((row) => row.candidateCount);
const maiaElapsed = rows.map((row) => row.maiaMs);
process.stdout.write(`${JSON.stringify(Object.freeze({
  measuredAt: new Date().toISOString(),
  population: Object.freeze({
    positions: rows.length,
    byPhase: Object.fromEntries(phases.map((phase) => [phase, rows.filter((row) => row.phase === phase).length])),
    candidateWidth: Object.freeze({ min: Math.min(...widths), p50: percentile(widths, 0.5), p90: percentile(widths, 0.9), max: Math.max(...widths) }),
    maiaLatencyMs: Object.freeze({ p50: percentile(maiaElapsed, 0.5), p90: percentile(maiaElapsed, 0.9), max: percentile(maiaElapsed, 1) }),
  }),
  engine: Object.freeze({ stockfish: "18", threads: 1, hashMb: 16, clearHash: true }),
  summaries,
}), null, 2)}\n`);
