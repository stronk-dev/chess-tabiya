// DISPOSABLE research harness — D1023. Not production code.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

import { advanceTargetPolicy, startTargetPolicy, targetPolicyFen, targetPolicyMoveUci, targetPolicyTerminal, type SamplePair, type TargetPolicyState } from "./stockfish-probe.mts";

const SAMPLE = new URL("./provider-sample.json", import.meta.url).pathname;
const OUTPUT = new URL("./maia-output.json", import.meta.url).pathname;
const BASE_URL = process.env.D1023_BASE_URL ?? "http://127.0.0.1:3000";
const SAMPLE_LIMIT = Number(process.env.D1023_SAMPLE_LIMIT ?? "0");
const BANDS = Object.freeze([1000, 1400, 1800, 2200] as const);
const DIGEST = `sha256:${"3".repeat(64)}`;
const PASSWORD = "d1023-disposable-local-probe";
const KEPT = 8;

interface Candidate { readonly moveUci: string; readonly rank: number; readonly mass?: number; readonly offWindow?: boolean }
interface Distribution {
  readonly fen: string;
  readonly band: number;
  readonly candidates: readonly Candidate[];
  readonly kept: readonly Candidate[];
  readonly returnedMass: number;
  readonly keptMass: number;
  readonly missingMass: number;
  readonly missingCandidateMasses: number;
  readonly elapsedMs: number;
  readonly engine: Readonly<Record<string, unknown>>;
}
interface SampleArtifact { readonly populations: readonly { readonly population: string; readonly rows: readonly SamplePair[] }[] }

let cookie = "";
async function api(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, { ...init, headers: { ...(init.body === undefined ? {} : { "content-type": "application/json" }), ...(cookie === "" ? {} : { cookie }), ...init.headers } });
}
async function authenticate(): Promise<void> {
  const response = await api("/auth/register", { method: "POST", body: JSON.stringify({ handle: `d1023-${Date.now().toString(36)}`, password: PASSWORD }) });
  if (!response.ok) throw new Error(`Authentication failed: HTTP ${response.status} ${await response.text()}`);
  cookie = response.headers.get("set-cookie")?.split(";", 1)[0] ?? "";
  if (cookie === "") throw new Error("Authentication returned no session cookie");
}
async function deleteProbeAccount(): Promise<void> {
  if (cookie === "") return;
  const preview = await api("/auth/deletion-preview", { method: "POST", body: "{}" });
  if (!preview.ok) throw new Error(`Deletion preview failed: HTTP ${preview.status}`);
  const value = await preview.json() as { digest: string };
  const removed = await api("/auth/delete", { method: "POST", body: JSON.stringify({ password: PASSWORD, previewDigest: value.digest }) });
  if (!removed.ok) throw new Error(`Account deletion failed: HTTP ${removed.status} ${await removed.text()}`);
  cookie = "";
}
function seed(fen: string, band: number): number {
  return Number.parseInt(createHash("sha256").update(`${fen}|${band}`).digest("hex").slice(0, 8), 16) & 0x7fff_ffff;
}

const requestCache = new Map<string, Promise<Distribution>>();
function distribution(state: TargetPolicyState, band: number): Promise<Distribution> {
  const fen = targetPolicyFen(state), key = `${fen}|${band}`;
  const cached = requestCache.get(key);
  if (cached !== undefined) return cached;
  const requested = (async (): Promise<Distribution> => {
    const started = performance.now();
    const response = await api("/select-move", {
      method: "POST",
      body: JSON.stringify({ startFen: fen, historyUci: [], policy: { mode: "human_common", policyConfigDigest: DIGEST, targetElo: band, temperature: .8, topP: .92 }, seed: seed(fen, band) }),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`${fen} band ${band}: HTTP ${response.status} ${text}`);
    const body = JSON.parse(text) as { candidates?: readonly Candidate[]; engine?: Readonly<Record<string, unknown>> };
    if (!Array.isArray(body.candidates) || body.candidates.length === 0 || body.engine === undefined) throw new TypeError(`${fen} band ${band}: incomplete Maia response`);
    const candidates = body.candidates.toSorted((left, right) => left.rank - right.rank);
    const masses = candidates.flatMap((candidate) => candidate.mass === undefined ? [] : [candidate.mass]);
    if (masses.some((mass) => !Number.isFinite(mass) || mass < 0 || mass > 1)) throw new TypeError(`${fen} band ${band}: invalid mass`);
    const returnedMass = masses.reduce((sum, mass) => sum + mass, 0);
    if (returnedMass > 1.000_001) throw new TypeError(`${fen} band ${band}: returned mass ${returnedMass} exceeds one`);
    const kept = candidates.slice(0, KEPT), keptMass = kept.reduce((sum, candidate) => sum + (candidate.mass ?? 0), 0);
    return Object.freeze({ fen, band, candidates: Object.freeze(candidates), kept: Object.freeze(kept), returnedMass, keptMass, missingMass: Math.max(0, 1 - returnedMass), missingCandidateMasses: candidates.length - masses.length, elapsedMs: Number((performance.now() - started).toFixed(1)), engine: Object.freeze(body.engine) });
  })();
  requestCache.set(key, requested);
  return requested;
}

function bounds(lower: number, knownFailure: number): Readonly<{ lower: number; upper: number }> {
  return Object.freeze({ lower: Number(lower.toFixed(8)), upper: Number(Math.max(lower, 1 - knownFailure).toFixed(8)) });
}
async function evaluate(pair: SamplePair, band: number): Promise<Readonly<Record<string, unknown>>> {
  const rootState = startTargetPolicy(pair), root = await distribution(rootState, band);
  const targetUci = targetPolicyMoveUci(rootState);
  const targetCandidate = targetUci === undefined ? undefined : root.candidates.find((candidate) => candidate.moveUci === targetUci);
  const targetMassKnown = targetCandidate?.mass !== undefined;
  const nextExecution = targetMassKnown
    ? Object.freeze({ lower: targetCandidate.mass!, upper: targetCandidate.mass! })
    : Object.freeze({ lower: 0, upper: root.missingMass });
  let lower = 0, knownFailure = 0;
  let massGate = root.keptMass >= .9 && root.missingCandidateMasses === 0;
  let expandedSecondNodes = 0, minimumSecondKeptMass = 1;
  for (const first of root.kept) {
    const firstMass = first.mass;
    if (firstMass === undefined) { massGate = false; continue; }
    const afterFirst = advanceTargetPolicy(rootState, first.moveUci);
    if (afterFirst.target === undefined || targetPolicyTerminal(afterFirst)) { knownFailure += firstMass; continue; }
    const second = await distribution(afterFirst, band);
    expandedSecondNodes += 1;
    minimumSecondKeptMass = Math.min(minimumSecondKeptMass, second.keptMass);
    if (second.keptMass < .9 || second.missingCandidateMasses > 0) massGate = false;
    for (const reply of second.kept) {
      if (reply.mass === undefined) { massGate = false; continue; }
      const pathMass = firstMass * reply.mass;
      const atSecondOpportunity = advanceTargetPolicy(afterFirst, reply.moveUci);
      if (targetPolicyMoveUci(atSecondOpportunity) !== undefined) lower += pathMass;
      else knownFailure += pathMass;
    }
  }
  const secondOpportunity = bounds(lower, knownFailure);
  return Object.freeze({
    band,
    admitted: massGate,
    nextExecution,
    secondOpportunity,
    root: Object.freeze({ candidateCount: root.candidates.length, keptCount: root.kept.length, returnedMass: root.returnedMass, keptMass: root.keptMass, missingMass: root.missingMass, missingCandidateMasses: root.missingCandidateMasses, targetUci: targetUci ?? null, targetRank: targetCandidate?.rank ?? null, targetMass: targetCandidate?.mass ?? null }),
    expandedSecondNodes,
    minimumSecondKeptMass: expandedSecondNodes === 0 ? null : minimumSecondKeptMass,
    requestLatencyMs: root.elapsedMs,
    engine: root.engine,
  });
}

function direction(left: { lower: number; upper: number }, right: { lower: number; upper: number }): "positive" | "negative" | "unclear" {
  const low = left.lower - right.upper, high = left.upper - right.lower;
  return low > 0 ? "positive" : high < 0 ? "negative" : "unclear";
}
function percentile(values: readonly number[], fraction: number): number {
  const sorted = values.toSorted((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)] ?? 0;
}

export async function runMaiaProbe(): Promise<Readonly<{ rows: number; requests: number }>> {
  const sampleBytes = await readFile(SAMPLE), sample = JSON.parse(sampleBytes.toString("utf8")) as SampleArtifact;
  const selected = sample.populations.flatMap((population) => population.rows.map((pair) => ({ population: population.population, pair })));
  const jobs = SAMPLE_LIMIT > 0 ? selected.slice(0, SAMPLE_LIMIT) : selected;
  const rows: Array<Readonly<Record<string, unknown>>> = [];
  await authenticate();
  try {
    let done = 0;
    for (const job of jobs) {
      const byBand: Record<string, Readonly<Record<string, unknown>>> = {};
      for (const band of BANDS) byBand[String(band)] = await evaluate(job.pair, band);
      rows.push(Object.freeze({ population: job.population, pair: job.pair, byBand: Object.freeze(byBand) }));
      done += 1;
      if (done % 4 === 0 || done === jobs.length) process.stderr.write(`${done}/${jobs.length}; requests ${requestCache.size}\n`);
    }
  } finally { await deleteProbeAccount(); }

  const engineIdentities = [...new Set(rows.flatMap((row) => Object.values(row.byBand as Record<string, { engine: unknown }>).map((value) => JSON.stringify(value.engine))))];
  const byBandSummary = Object.fromEntries(BANDS.map((band) => {
    const results = rows.map((row) => (row.byBand as Record<string, { admitted: boolean; nextExecution: { lower: number; upper: number }; secondOpportunity: { lower: number; upper: number } }>)[String(band)]!);
    const pairedDirections = { nextExecution: { positive: 0, negative: 0, unclear: 0 }, secondOpportunity: { positive: 0, negative: 0, unclear: 0 } };
    let admittedPairs = 0;
    if (SAMPLE_LIMIT === 0) for (const population of sample.populations) {
      const populationRows = rows.filter((row) => row.population === population.population);
      for (let index = 0; index < 32; index += 2) {
        const played = (populationRows[index]!.byBand as Record<string, typeof results[number]>)[String(band)]!, alternative = (populationRows[index + 1]!.byBand as Record<string, typeof results[number]>)[String(band)]!;
        if (!played.admitted || !alternative.admitted) continue;
        admittedPairs += 1;
        pairedDirections.nextExecution[direction(played.nextExecution, alternative.nextExecution)] += 1;
        pairedDirections.secondOpportunity[direction(played.secondOpportunity, alternative.secondOpportunity)] += 1;
      }
    }
    const admitted = results.filter((value) => value.admitted);
    return [String(band), Object.freeze({
      admitted: admitted.length,
      refused: results.length - admitted.length,
      admittedNextExecutionPositiveLower: admitted.filter((value) => value.nextExecution.lower > 0).length,
      admittedSecondOpportunityPositiveLower: admitted.filter((value) => value.secondOpportunity.lower > 0).length,
      admittedPairs,
      pairedDirections,
    })];
  }));
  const latencies = [...requestCache.values()].map(async (value) => (await value).elapsedMs);
  const latencyValues = await Promise.all(latencies);
  await writeFile(OUTPUT, `${JSON.stringify({
    version: 1,
    source: Object.freeze({ bands: BANDS, temperature: .8, topP: .92, keptPerNode: KEPT, baseUrl: BASE_URL, engineIdentities: Object.freeze(engineIdentities), sampleLimit: SAMPLE_LIMIT > 0 ? SAMPLE_LIMIT : null }),
    sampleDigest: createHash("sha256").update(sampleBytes).digest("hex"),
    summary: Object.freeze({
      rows: rows.length,
      requests: requestCache.size,
      byBand: Object.freeze(byBandSummary),
      coldRequestLatencyMs: null,
      warmRequestLatencyMs: Object.freeze({ p50: percentile(latencyValues, .5), p90: percentile(latencyValues, .9), p99: percentile(latencyValues, .99), max: Math.max(...latencyValues) }),
    }),
    rows,
  }, null, 2)}\n`, "utf8");
  return Object.freeze({ rows: rows.length, requests: requestCache.size });
}
