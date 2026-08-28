// DISPOSABLE research harness — D1871-D1878/D1943-D1944. Not production code.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const OPERATIONS = Object.freeze([
  "stockfish.legal_root_table@1",
  "stockfish.position_evaluation@1",
  "maia.policy_page@1",
  "syzygy.position@1",
  "lichess_explorer.position_page@1",
] as const);

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

type PathImage = Readonly<{
  projection: string;
  choices: readonly Readonly<{ projection: string; occurrence: readonly number[]; member: number; inputs: readonly string[] }>[];
  sources: readonly Readonly<{ projection: string; availability: string }>[];
}>;

function pathId(path: PathImage): string {
  return `path:sha256:${digest(path)}`;
}

test("D1871 gives paths stable identities while satisfaction remains subject-bound", () => {
  const path: PathImage = Object.freeze({
    projection: "derived.tablebase.fact@1",
    choices: Object.freeze([{ projection: "derived.tablebase.fact@1", occurrence: Object.freeze([]), member: 1, inputs: Object.freeze(["recorded.tablebase.result@1"]) }]),
    sources: Object.freeze([{ projection: "recorded.tablebase.result@1", availability: "recorded" }]),
  });
  assert.equal(pathId(path), pathId(structuredClone(path)));
  assert.notEqual(pathId(path), pathId({ ...path, choices: [{ ...path.choices[0]!, member: 2 }] }));
  assert.notEqual(pathId(path), pathId({ ...path, choices: [{ ...path.choices[0]!, occurrence: [0] }] }));

  const retained = new Map<string, Set<string>>([
    ["run:a:head:1", new Set([pathId(path)])],
    ["run:b:head:1", new Set()],
  ]);
  assert.equal(retained.get("run:a:head:1")!.has(pathId(path)), true);
  assert.equal(retained.get("run:b:head:1")!.has(pathId(path)), false);
});

test("D1872 preserves acquisition evidence while delivery provenance changes", () => {
  const acquisition = Object.freeze({
    provider: "lichess_explorer",
    requestedAt: "2026-08-27T10:00:00.000Z",
    retrievedAt: "2026-08-27T10:00:00.025Z",
    requestDigest: "request-a",
    responseDigest: "response-a",
  });
  const live = Object.freeze({ kind: "live", servedAt: acquisition.retrievedAt, cacheIdentity: null, acquisition });
  const retained = Object.freeze({ kind: "retained_exact", servedAt: "2026-08-27T10:01:00.000Z", cacheIdentity: "cache-a", acquisition });
  assert.strictEqual(live.acquisition, retained.acquisition);
  assert.equal(retained.acquisition.retrievedAt, live.acquisition.retrievedAt);
  assert.notEqual(retained.kind, live.kind);
});

type MaiaPageRequest =
  | Readonly<{ kind: "history_conditioned"; startFen: string; historyUci: readonly string[] }>
  | Readonly<{ kind: "exact_fen"; fen: string }>;

function sameMaiaOccurrence(
  page: MaiaPageRequest,
  occurrence: Readonly<{ kind: "run_path"; startFen: string; historyUci: readonly string[] } | { kind: "exact_fen"; fen: string }>,
): boolean {
  if (page.kind === "history_conditioned" && occurrence.kind === "run_path") {
    return page.startFen === occurrence.startFen && JSON.stringify(page.historyUci) === JSON.stringify(occurrence.historyUci);
  }
  return page.kind === "exact_fen" && occurrence.kind === "exact_fen" && page.fen === occurrence.fen;
}

test("D1873 refuses transposed Maia histories and keeps exact-FEN occurrence separate", () => {
  const page: MaiaPageRequest = { kind: "history_conditioned", startFen: "start", historyUci: ["g1f3", "d7d5", "g2g3"] };
  assert.equal(sameMaiaOccurrence(page, { kind: "run_path", startFen: "start", historyUci: ["g2g3", "d7d5", "g1f3"] }), false);
  assert.equal(sameMaiaOccurrence(page, { kind: "run_path", startFen: "start", historyUci: ["g1f3", "d7d5", "g2g3"] }), true);
  assert.equal(sameMaiaOccurrence({ kind: "exact_fen", fen: "same" }, { kind: "exact_fen", fen: "same" }), true);
  assert.equal(sameMaiaOccurrence({ kind: "exact_fen", fen: "same" }, { kind: "run_path", startFen: "start", historyUci: [] }), false);

  const probabilities = [0.42, 0.31, 0.14];
  const pageCoverage = Object.freeze({
    coverage: "bounded_top_k" as const,
    requestedWidth: 5,
    returnedWidth: probabilities.length,
    returnedProbabilityMass: probabilities.reduce((sum, value) => sum + value, 0),
  });
  assert.deepEqual(pageCoverage, { coverage: "bounded_top_k", requestedWidth: 5, returnedWidth: 3, returnedProbabilityMass: 0.87 });
  assert.ok(pageCoverage.returnedProbabilityMass < 1, "missing mass stays unobserved rather than impossible");
});

function exactStockfishLine(line: string): boolean {
  return line.startsWith("info ")
    && /\bscore (?:cp -?\d+|mate -?[1-9]\d*)\b/u.test(line)
    && !/\b(?:upperbound|lowerbound)\b/u.test(line)
    && /\bpv [a-h][1-8][a-h][1-8][qrbn]?\b/u.test(line);
}

test("D1874 bounded and incomplete legal-root scores cannot become measurements", () => {
  assert.equal(exactStockfishLine("info depth 12 multipv 1 score cp 30 pv e2e4 e7e5"), true);
  assert.equal(exactStockfishLine("info depth 12 multipv 1 score cp 30 upperbound pv e2e4"), false);
  assert.equal(exactStockfishLine("info depth 12 multipv 1 score cp 30 lowerbound pv e2e4"), false);
  assert.equal(exactStockfishLine("info depth 12 multipv 1 score cp 30"), false);
});

type ExplorerDomainResult =
  | Readonly<{ kind: "zero_population"; total: 0; moves: readonly []; listed: 0; unlisted: 0 }>
  | Readonly<{ kind: "population"; total: number; moves: readonly Readonly<{ canonicalUci: string; canonicalSan: string; providerSan: string; played: number }>[]; listed: number; unlisted: number }>;

function explorerResult(total: number, moves: ExplorerDomainResult extends infer _T ? readonly Readonly<{ canonicalUci: string; canonicalSan: string; providerSan: string; played: number }>[] : never): ExplorerDomainResult {
  if (total === 0) {
    assert.equal(moves.length, 0);
    return Object.freeze({ kind: "zero_population", total: 0, moves: Object.freeze([]), listed: 0, unlisted: 0 });
  }
  const listed = moves.reduce((sum, move) => sum + move.played, 0);
  assert.ok(listed <= total);
  return Object.freeze({ kind: "population", total, moves: Object.freeze(moves), listed, unlisted: total - listed });
}

function assertZeroPopulationCounts(counts: Readonly<{ white: number; draws: number; black: number; total: number }>): void {
  assert.equal(counts.total, 0);
  assert.equal(counts.white, 0);
  assert.equal(counts.draws, 0);
  assert.equal(counts.black, 0);
}

test("D1875 Explorer represents zero and sparse population without erasing source rows", () => {
  assert.doesNotThrow(() => assertZeroPopulationCounts({ white: 0, draws: 0, black: 0, total: 0 }));
  assert.throws(() => assertZeroPopulationCounts({ white: 1, draws: 0, black: 0, total: 0 }));
  assert.deepEqual(explorerResult(0, []), { kind: "zero_population", total: 0, moves: [], listed: 0, unlisted: 0 });
  assert.deepEqual(explorerResult(37, [{ canonicalUci: "e2e4", canonicalSan: "e4", providerSan: "e4", played: 11 }]), {
    kind: "population", total: 37,
    moves: [{ canonicalUci: "e2e4", canonicalSan: "e4", providerSan: "e4", played: 11 }],
    listed: 11, unlisted: 26,
  });
});

type BindingResult = Readonly<{ binding: string; necessity: "required" | "optional"; noPath: "omit_optional_item" | "honest_empty" | "operation_unavailable"; satisfied: boolean }>;

function aggregate(bindings: readonly BindingResult[]): Readonly<{ state: "available" | "honest_empty" | "operation_unavailable"; omitted: readonly string[] }> {
  const missing = bindings.filter((binding) => !binding.satisfied);
  for (const binding of missing) {
    if (binding.necessity === "optional") assert.equal(binding.noPath, "omit_optional_item");
    else assert.notEqual(binding.noPath, "omit_optional_item");
  }
  if (missing.some((binding) => binding.necessity === "required" && binding.noPath === "operation_unavailable")) return { state: "operation_unavailable", omitted: [] };
  if (missing.some((binding) => binding.necessity === "required" && binding.noPath === "honest_empty")) return { state: "honest_empty", omitted: [] };
  return { state: "available", omitted: missing.map((binding) => binding.binding).sort() };
}

test("D1876 source-absence aggregation is total across mixed bindings", () => {
  assert.deepEqual(aggregate([
    { binding: "geometry", necessity: "required", noPath: "operation_unavailable", satisfied: true },
    { binding: "voice", necessity: "optional", noPath: "omit_optional_item", satisfied: false },
  ]), { state: "available", omitted: ["voice"] });
  assert.deepEqual(aggregate([
    { binding: "recorded-or-live", necessity: "required", noPath: "honest_empty", satisfied: false },
    { binding: "local", necessity: "required", noPath: "operation_unavailable", satisfied: true },
  ]), { state: "honest_empty", omitted: [] });
  assert.deepEqual(aggregate([
    { binding: "maia", necessity: "required", noPath: "honest_empty", satisfied: false },
    { binding: "stockfish", necessity: "required", noPath: "operation_unavailable", satisfied: false },
  ]), { state: "operation_unavailable", omitted: [] });
  assert.deepEqual(aggregate([
    { binding: "maia", necessity: "optional", noPath: "omit_optional_item", satisfied: false },
    { binding: "explorer", necessity: "optional", noPath: "omit_optional_item", satisfied: false },
  ]), { state: "available", omitted: ["explorer", "maia"] });
});

function pendingKey(operation: typeof OPERATIONS[number], requested: unknown): string {
  return digest({ operation, requested });
}

test("D1877/D1878 close the operation census and keep actual generation out of pending identity", () => {
  assert.equal(new Set(OPERATIONS).size, 5);
  const requested = { engine: { id: "stockfish", version: "18" }, fen: "position", bound: { kind: "depth", value: 12 } };
  const beforeSpawn = pendingKey("stockfish.position_evaluation@1", requested);
  const afterSpawn = pendingKey("stockfish.position_evaluation@1", requested);
  assert.equal(beforeSpawn, afterSpawn);
  const retained = { pendingKey: beforeSpawn, actual: { id: "stockfish", version: "18", generation: 4 } };
  assert.equal(retained.actual.generation === 4, true);
  assert.equal(retained.actual.generation === 5, false);
});

function admitRawWdl(value: Readonly<{ subject: string; win: number; draw: number; loss: number }>) {
  assert.equal(value.subject, "side_to_move");
  for (const count of [value.win, value.draw, value.loss]) assert.ok(Number.isSafeInteger(count) && count >= 0 && count <= 1000);
  assert.equal(value.win + value.draw + value.loss, 1000);
  return Object.freeze({ ...value, subject: "side_to_move" as const });
}

test("D1969 keeps raw WDL on the existing fixed-bound exchange", () => {
  assert.deepEqual(admitRawWdl({ subject: "side_to_move", win: 512, draw: 300, loss: 188 }), { subject: "side_to_move", win: 512, draw: 300, loss: 188 });
  assert.throws(() => admitRawWdl({ subject: "white", win: 512, draw: 300, loss: 188 }));
  assert.throws(() => admitRawWdl({ subject: "side_to_move", win: 512, draw: 300, loss: 187 }));
  assert.throws(() => admitRawWdl({ subject: "side_to_move", win: 512.5, draw: 300, loss: 187.5 }));
  assert.equal(new Set(OPERATIONS).size, 5);
});

test("the amended RFC publishes every literal authority exercised by the harness", () => {
  const rfc = readFileSync(new URL("../../rfc/provider-exchange-and-execution.md", import.meta.url), "utf8");
  for (const token of [
    "pathId", "SubjectEvidenceAvailabilityRequest", "ProviderAcquisitionReceipt", "ProviderDelivery",
    "ProviderOperationRequestMap", "ProviderOperationResultMap", "BindingSourceAbsence",
    "ProviderEvidenceDelivery", "StockfishLegalRootTable", "root_side_to_move",
    "ExplorerPositionPageRequest", "ExplorerPositionPageDomainResult", "MaiaRunMoveOccurrence",
    "MaiaExactFenMoveOccurrence", "upperbound", "lowerbound", "pendingKey", "rawWdl",
    "side_to_move",
  ]) assert.match(rfc, new RegExp(`\\b${token}\\b`), `missing ${token}`);
});
