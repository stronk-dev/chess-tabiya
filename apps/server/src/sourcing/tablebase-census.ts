import { mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";

import {
  canonicalizeJson,
  digestDrillPack,
  type DrillPackDefinition,
} from "@chess-tabiya/schema/drill-pack";
import { transposeKey } from "@chess-tabiya/runtime";

import { validatePackDocument } from "../pack-validation.js";
import { countFenPieces } from "./chess-facts.js";
import { legalSuccessors } from "./legal-moves.js";
import { liveTablebaseQuery, type TablebaseAnswer, type TablebasePayload, type TablebaseQuery } from "./syzygy.js";
import { packPositions } from "./tablebase-walk.js";
import type { EvidenceLedger, EvidenceRecord, SourceEntry, SourceManifest } from "./types.js";
import { SourcingError } from "./types.js";
import { assertSourcingArtifacts } from "./verify-draft.js";

interface CensusPaths {
  readonly ledger: string;
  readonly manifest: string;
}

export interface TablebaseCensusOptions {
  readonly query?: TablebaseQuery;
  readonly maxQueries?: number;
  readonly cacheRoot?: string | null;
  readonly onProgress?: (progress: TablebaseCensusProgress) => void;
  readonly queryMeter?: TablebaseQueryMeter;
}

export interface TablebaseCensusProgress {
  readonly completed: number;
  readonly total: number;
  readonly queried: number;
  readonly cached: number;
  readonly reused: number;
}

export interface TablebaseQueryMeter {
  readonly sourceQueries: number;
  readonly cacheHits: number;
  beforeSource(): void;
  cacheHit(): void;
}

export interface TablebaseCensusCompilation {
  readonly ledger: EvidenceLedger;
  readonly manifest: SourceManifest;
  readonly parentPositions: number;
  readonly successorPositions: number;
  readonly queried: number;
  readonly cached: number;
  readonly reused: number;
}

export interface TablebaseCensusResult extends TablebaseCensusCompilation {
  readonly packId: string;
  readonly paths: CensusPaths;
}

export interface TablebaseCensusStatus {
  readonly packId: string;
  readonly file: string;
  readonly parentPositions: number;
  readonly choiceBearingParents: number;
  readonly fullyCensusedParents: number;
  readonly fullyCensusedChoiceBearingParents: number;
  readonly successorPositions: number;
  readonly coveredSuccessors: number;
}

export interface TablebaseCensusReport {
  readonly schema: "tabiya.sourcing.tablebase-census-report.v1";
  readonly root: string;
  readonly packs: readonly TablebaseCensusStatus[];
  readonly totals: Omit<TablebaseCensusStatus, "packId" | "file"> & { readonly packs: number };
}

function sidecars(file: string): CensusPaths {
  const directory = dirname(file);
  const name = basename(file);
  const stem = name.slice(0, -extname(name).length);
  return {
    ledger: resolve(directory, `${stem}.evidence.json`),
    manifest: resolve(directory, `${stem}.sources.json`),
  };
}

function sourceKey(value: Pick<SourceEntry, "sourceId" | "retrievedAt">): string {
  return `${value.sourceId}\0${value.retrievedAt}`;
}

function recordFen(record: EvidenceRecord): string | undefined {
  if (typeof record.values.fen === "string") return record.values.fen;
  return typeof record.anchor.fen === "string" ? record.anchor.fen : undefined;
}

function tablebaseValues(fen: string, payload: TablebasePayload): Readonly<Record<string, unknown>> {
  return Object.freeze({
    fen,
    pieceCount: countFenPieces(fen),
    category: payload.category,
    dtz: payload.dtz,
    precise_dtz: payload.precise_dtz,
    dtm: payload.dtm,
    checkmate: payload.checkmate,
    stalemate: payload.stalemate,
    insufficient_material: payload.insufficient_material,
  });
}

interface CachedTablebaseAnswer {
  readonly schema: "tabiya.sourcing.tablebase-answer-cache.v1";
  readonly fen: string;
  readonly answer: TablebaseAnswer;
}

function answerCachePath(root: string, fen: string): string {
  const halfmoves = fen.split(" ")[4] ?? "0";
  return resolve(root, `${encodeURIComponent(transposeKey(fen))}-${halfmoves}.answer.json`);
}

function assertCachedAnswer(value: unknown, fen: string): asserts value is CachedTablebaseAnswer {
  const cached = value as Partial<CachedTablebaseAnswer> | null;
  const expectedUrl = `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(fen)}`;
  if (
    cached?.schema !== "tabiya.sourcing.tablebase-answer-cache.v1"
    || cached.fen !== fen
    || typeof cached.answer !== "object"
    || cached.answer === null
    || typeof cached.answer.payload !== "object"
    || cached.answer.payload === null
    || typeof cached.answer.source !== "object"
    || cached.answer.source === null
    || cached.answer.source.origin.kind !== "http"
    || cached.answer.source.origin.url !== expectedUrl
  ) {
    throw new SourcingError("VERIFY_LEDGER_MERGE_CONFLICT", `cached tablebase answer does not match requested FEN ${fen}`);
  }
}

async function readCachedAnswer(root: string, fen: string): Promise<CachedTablebaseAnswer | undefined> {
  try {
    const cached = JSON.parse(await readFile(answerCachePath(root, fen), "utf8")) as unknown;
    assertCachedAnswer(cached, fen);
    return cached;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  }
}

async function storeCachedAnswer(root: string, fen: string, answer: TablebaseAnswer): Promise<void> {
  const existing = await readCachedAnswer(root, fen);
  if (existing !== undefined) {
    if (canonicalizeJson(existing.answer.payload) !== canonicalizeJson(answer.payload)) {
      throw new SourcingError("VERIFY_LEDGER_MERGE_CONFLICT", `cached tablebase payload conflicts for ${fen}`);
    }
    return;
  }
  const path = answerCachePath(root, fen);
  const cached: CachedTablebaseAnswer = Object.freeze({
    schema: "tabiya.sourcing.tablebase-answer-cache.v1",
    fen,
    answer,
  });
  await mkdir(root, { recursive: true });
  const temporary = `${path}.${process.pid}-${Date.now()}.tmp`;
  try {
    await writeFile(temporary, `${canonicalizeJson(cached)}\n`, { encoding: "utf8", flag: "wx" });
    await rename(temporary, path);
  } finally {
    try { await unlink(temporary); } catch { /* already renamed or never created */ }
  }
}

export function createTablebaseQueryMeter(maxQueries: number): TablebaseQueryMeter {
  if (!Number.isSafeInteger(maxQueries) || maxQueries < 0) {
    throw new SourcingError("ARGUMENT_INVALID", `maxQueries must be a non-negative integer; received ${maxQueries}`);
  }
  let sourceQueries = 0;
  let cacheHits = 0;
  return {
    get sourceQueries() { return sourceQueries; },
    get cacheHits() { return cacheHits; },
    beforeSource() {
      if (sourceQueries >= maxQueries) {
        throw new SourcingError("WALK_QUERY_BUDGET_EXCEEDED", `tablebase census requires more than ${maxQueries} new successor queries`);
      }
      sourceQueries += 1;
    },
    cacheHit() { cacheHits += 1; },
  };
}

export function cachedTablebaseQuery(
  root: string,
  query: TablebaseQuery = liveTablebaseQuery,
  meter?: TablebaseQueryMeter,
): TablebaseQuery {
  return async (fen) => {
    const existing = await readCachedAnswer(root, fen);
    if (existing !== undefined) {
      meter?.cacheHit();
      return existing.answer;
    }
    meter?.beforeSource();
    const answer = await query(fen);
    await storeCachedAnswer(root, fen, answer);
    return answer;
  };
}

function payloadFromRecord(record: EvidenceRecord): TablebasePayload {
  const values = record.values;
  if (
    typeof values.checkmate !== "boolean"
    || typeof values.stalemate !== "boolean"
    || typeof values.insufficient_material !== "boolean"
    || !(typeof values.dtz === "number" || values.dtz === null)
    || !(typeof values.precise_dtz === "number" || values.precise_dtz === null)
    || !(typeof values.dtm === "number" || values.dtm === null)
    || typeof values.category !== "string"
  ) {
    throw new SourcingError("VERIFY_LEDGER_MERGE_CONFLICT", "validated tablebase record cannot hydrate an answer cache");
  }
  return Object.freeze({
    checkmate: values.checkmate,
    stalemate: values.stalemate,
    insufficient_material: values.insufficient_material,
    dtz: values.dtz,
    precise_dtz: values.precise_dtz,
    dtm: values.dtm,
    category: values.category,
  });
}

export async function hydrateTablebaseAnswerCache(root: string, ledger: EvidenceLedger, manifest: SourceManifest): Promise<number> {
  const sources = new Map(manifest.entries.map((entry) => [sourceKey(entry), entry]));
  let hydrated = 0;
  for (const record of ledger.records) {
    if (record.kind !== "tablebase_result") continue;
    const fen = recordFen(record);
    if (fen === undefined) continue;
    const source = sources.get(sourceKey(record));
    if (source?.origin.kind !== "http") continue;
    await storeCachedAnswer(root, fen, { payload: payloadFromRecord(record), source });
    hydrated += 1;
  }
  return hydrated;
}

function sameSource(left: SourceEntry, right: SourceEntry): boolean {
  return canonicalizeJson(left) === canonicalizeJson(right);
}

function insertSource(entries: Map<string, SourceEntry>, entry: SourceEntry): void {
  const key = sourceKey(entry);
  const prior = entries.get(key);
  if (prior !== undefined && !sameSource(prior, entry)) {
    throw new SourcingError(
      "VERIFY_LEDGER_MERGE_CONFLICT",
      `source identity ${entry.sourceId} ${entry.retrievedAt} resolves to different bytes`,
    );
  }
  entries.set(key, entry);
}

/**
 * Compile one complete exact-legal-successor census without touching the filesystem.
 * Every source position is an authored start/spine position in Syzygy range. Existing unique
 * records are reused; missing successor facts are queried under a hard per-pack budget.
 */
export async function compileTablebaseCensus(
  pack: DrillPackDefinition,
  ledger: EvidenceLedger,
  manifest: SourceManifest,
  options: TablebaseCensusOptions = {},
): Promise<TablebaseCensusCompilation> {
  if (ledger.packId !== pack.id) {
    throw new SourcingError("VERIFY_LEDGER_MERGE_CONFLICT", `ledger pack ${String(ledger.packId)} does not match ${pack.id}`);
  }

  const parentPointers = new Map<string, Set<string>>();
  let parentPositions = 0;
  for (const item of packPositions(pack)) {
    if (countFenPieces(item.fen) > 7) continue;
    const successors = legalSuccessors(item.fen);
    if (successors.length === 0) continue;
    parentPositions += 1;
    for (const successor of successors) {
      const pointers = parentPointers.get(successor.fen) ?? new Set<string>();
      pointers.add(item.pointer);
      parentPointers.set(successor.fen, pointers);
    }
  }

  const existingByFen = new Map<string, EvidenceRecord>();
  for (const record of ledger.records) {
    if (record.kind !== "tablebase_result") continue;
    const fen = recordFen(record);
    if (fen === undefined) continue;
    if (existingByFen.has(fen)) {
      throw new SourcingError("VERIFY_LEDGER_MERGE_CONFLICT", `multiple tablebase_result records already exist for ${fen}`);
    }
    existingByFen.set(fen, record);
  }

  const maxQueries = options.maxQueries ?? 400;
  if (!Number.isSafeInteger(maxQueries) || maxQueries < 0) {
    throw new SourcingError("ARGUMENT_INVALID", `maxQueries must be a non-negative integer; received ${maxQueries}`);
  }
  const query = options.query ?? liveTablebaseQuery;
  const replacements = new Map<string, EvidenceRecord>();
  const newSources: SourceEntry[] = [];
  let queried = 0;
  let cached = 0;
  let reused = 0;
  let completed = 0;
  const report = (): void => options.onProgress?.(Object.freeze({ completed, total: parentPointers.size, queried, cached, reused }));
  report();

  for (const [fen, pointers] of [...parentPointers.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const existing = existingByFen.get(fen);
    if (existing !== undefined) {
      reused += 1;
      replacements.set(fen, Object.freeze({
        ...existing,
        supports: Object.freeze([...new Set([...existing.supports, ...pointers])].sort()),
      }));
      completed += 1;
      report();
      continue;
    }
    if (options.queryMeter === undefined && queried >= maxQueries) {
      throw new SourcingError("WALK_QUERY_BUDGET_EXCEEDED", `tablebase census requires more than ${maxQueries} new successor queries`);
    }
    const answer: TablebaseAnswer = await query(fen);
    if (options.queryMeter === undefined) queried += 1;
    else {
      queried = options.queryMeter.sourceQueries;
      cached = options.queryMeter.cacheHits;
    }
    newSources.push(answer.source);
    replacements.set(fen, Object.freeze({
      kind: "tablebase_result",
      anchor: Object.freeze({ fen }),
      sourceId: answer.source.sourceId,
      retrievedAt: answer.source.retrievedAt,
      grounds: "machine_validation",
      values: tablebaseValues(fen, answer.payload),
      supports: Object.freeze([...pointers].sort()),
    }));
    completed += 1;
    report();
  }

  const records = [
    ...ledger.records.filter((record) => record.kind !== "tablebase_result" || !replacements.has(recordFen(record) ?? "")),
    ...replacements.values(),
  ];
  const entries = new Map<string, SourceEntry>();
  for (const entry of manifest.entries) insertSource(entries, entry);
  for (const entry of newSources) insertSource(entries, entry);
  const usedSources = new Set([
    ...records.map(sourceKey),
    ...ledger.abstentions.map(sourceKey),
  ]);
  const retainedEntries = [...entries.values()]
    .filter((entry) => usedSources.has(sourceKey(entry)))
    .sort((left, right) => sourceKey(left).localeCompare(sourceKey(right)));
  const sourcedAt = retainedEntries.map((entry) => entry.retrievedAt).sort().at(-1) ?? ledger.sourcedAt;
  const nextLedger: EvidenceLedger = Object.freeze({
    ...ledger,
    packVersion: pack.version,
    packDigest: await digestDrillPack(pack),
    sourcedAt,
    records: Object.freeze(records),
    abstentions: Object.freeze([...ledger.abstentions]),
  });
  const nextManifest: SourceManifest = Object.freeze({
    schema: "tabiya.sourcing.manifest.v1",
    entries: Object.freeze(retainedEntries),
  });

  return Object.freeze({
    ledger: nextLedger,
    manifest: nextManifest,
    parentPositions,
    successorPositions: parentPointers.size,
    queried,
    cached,
    reused,
  });
}

async function writePair(
  paths: CensusPaths,
  ledger: EvidenceLedger,
  manifest: SourceManifest,
  originals: Readonly<Record<"ledger" | "manifest", string>>,
): Promise<void> {
  const nonce = `${process.pid}-${Date.now()}`;
  const pending = [
    { key: "ledger" as const, path: paths.ledger, temp: `${paths.ledger}.${nonce}.tmp`, bytes: `${canonicalizeJson(ledger)}\n` },
    { key: "manifest" as const, path: paths.manifest, temp: `${paths.manifest}.${nonce}.tmp`, bytes: `${canonicalizeJson(manifest)}\n` },
  ];
  let committed = 0;
  try {
    await Promise.all(pending.map((item) => writeFile(item.temp, item.bytes, { encoding: "utf8", flag: "wx" })));
    // Both validated images exist before either authoritative path moves. If an ordinary
    // rename fails after the first commit, restore every path already replaced.
    for (const item of pending) {
      await rename(item.temp, item.path);
      committed += 1;
    }
  } catch (error) {
    const rollbackErrors: unknown[] = [];
    for (const item of pending.slice(0, committed)) {
      const rollback = `${item.path}.${nonce}.rollback`;
      try {
        await writeFile(rollback, originals[item.key], { encoding: "utf8", flag: "wx" });
        await rename(rollback, item.path);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
        try { await unlink(rollback); } catch { /* never created or already renamed */ }
      }
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError([error, ...rollbackErrors], "tablebase census replacement and rollback both failed");
    }
    throw error;
  } finally {
    await Promise.all(pending.map(async (item) => {
      try { await unlink(item.temp); } catch { /* already renamed or never created */ }
    }));
  }
}

export async function tablebaseCensus(file: string, options: TablebaseCensusOptions = {}): Promise<TablebaseCensusResult> {
  const absolute = resolve(file);
  const paths = sidecars(absolute);
  const [packBytes, ledgerBytes, manifestBytes] = await Promise.all([
    readFile(absolute, "utf8"),
    readFile(paths.ledger, "utf8"),
    readFile(paths.manifest, "utf8"),
  ]);
  const raw = JSON.parse(packBytes) as unknown;
  const validation = validatePackDocument(raw);
  if (!validation.valid) {
    throw new SourcingError("DRAFT_PACK_INVALID", validation.issues.map((issue) => `${issue.path} ${issue.code}: ${issue.message}`).join("; "));
  }
  const pack = raw as DrillPackDefinition;
  const cacheRoot = options.cacheRoot === null || (options.query !== undefined && options.cacheRoot === undefined)
    ? null
    : options.cacheRoot ?? resolve("content/sources/syzygy");
  const underlyingQuery = options.query ?? liveTablebaseQuery;
  const queryMeter = cacheRoot === null ? undefined : createTablebaseQueryMeter(options.maxQueries ?? 400);
  const query = cacheRoot === null ? underlyingQuery : cachedTablebaseQuery(cacheRoot, underlyingQuery, queryMeter);
  const compiled = await compileTablebaseCensus(
    pack,
    JSON.parse(ledgerBytes) as EvidenceLedger,
    JSON.parse(manifestBytes) as SourceManifest,
    { ...options, query, ...(queryMeter === undefined ? {} : { queryMeter }) },
  );
  assertSourcingArtifacts(pack, compiled.ledger.packDigest!, compiled.ledger, compiled.manifest, true);
  if (cacheRoot !== null) await hydrateTablebaseAnswerCache(cacheRoot, compiled.ledger, compiled.manifest);
  await writePair(paths, compiled.ledger, compiled.manifest, { ledger: ledgerBytes, manifest: manifestBytes });
  return Object.freeze({ ...compiled, packId: pack.id, paths });
}

export function tablebaseCensusStatus(
  file: string,
  pack: DrillPackDefinition,
  ledger: EvidenceLedger,
): TablebaseCensusStatus {
  const recorded = new Set(
    ledger.records
      .filter((record) => record.kind === "tablebase_result")
      .map(recordFen)
      .filter((fen): fen is string => fen !== undefined),
  );
  const successors = new Set<string>();
  let parentPositions = 0;
  let choiceBearingParents = 0;
  let fullyCensusedParents = 0;
  let fullyCensusedChoiceBearingParents = 0;
  for (const item of packPositions(pack)) {
    if (countFenPieces(item.fen) > 7) continue;
    const legal = legalSuccessors(item.fen);
    if (legal.length === 0) continue;
    parentPositions += 1;
    if (legal.length > 1) choiceBearingParents += 1;
    const complete = legal.every((successor) => recorded.has(successor.fen));
    if (complete) {
      fullyCensusedParents += 1;
      if (legal.length > 1) fullyCensusedChoiceBearingParents += 1;
    }
    for (const successor of legal) successors.add(successor.fen);
  }
  return Object.freeze({
    packId: pack.id,
    file,
    parentPositions,
    choiceBearingParents,
    fullyCensusedParents,
    fullyCensusedChoiceBearingParents,
    successorPositions: successors.size,
    coveredSuccessors: [...successors].filter((fen) => recorded.has(fen)).length,
  });
}

export async function tablebaseCensusReport(root: string): Promise<TablebaseCensusReport> {
  const absolute = resolve(root);
  const packs: TablebaseCensusStatus[] = [];
  for (const name of (await readdir(absolute)).sort()) {
    if (!name.endsWith(".json") || /\.(?:evidence|sources|job|priority|browser)\.json$/u.test(name)) continue;
    const file = join(absolute, name);
    const raw = JSON.parse(await readFile(file, "utf8")) as unknown;
    if ((raw as { objective?: { grading?: { assessedBy?: { kind?: unknown } } } }).objective?.grading?.assessedBy?.kind !== "syzygy") continue;
    const validation = validatePackDocument(raw);
    if (!validation.valid) {
      throw new SourcingError("DRAFT_PACK_INVALID", validation.issues.map((issue) => `${issue.path} ${issue.code}: ${issue.message}`).join("; "));
    }
    const pack = raw as DrillPackDefinition;
    const ledger = JSON.parse(await readFile(sidecars(file).ledger, "utf8")) as EvidenceLedger;
    packs.push(tablebaseCensusStatus(name, pack, ledger));
  }
  const totals = packs.reduce((sum, status) => ({
    packs: sum.packs + 1,
    parentPositions: sum.parentPositions + status.parentPositions,
    choiceBearingParents: sum.choiceBearingParents + status.choiceBearingParents,
    fullyCensusedParents: sum.fullyCensusedParents + status.fullyCensusedParents,
    fullyCensusedChoiceBearingParents: sum.fullyCensusedChoiceBearingParents + status.fullyCensusedChoiceBearingParents,
    successorPositions: sum.successorPositions + status.successorPositions,
    coveredSuccessors: sum.coveredSuccessors + status.coveredSuccessors,
  }), { packs: 0, parentPositions: 0, choiceBearingParents: 0, fullyCensusedParents: 0, fullyCensusedChoiceBearingParents: 0, successorPositions: 0, coveredSuccessors: 0 });
  return Object.freeze({ schema: "tabiya.sourcing.tablebase-census-report.v1", root: absolute, packs: Object.freeze(packs), totals: Object.freeze(totals) });
}

function args(values: readonly string[]): Map<string, string> {
  const result = new Map<string, string>();
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith("--") || value === undefined) continue;
    result.set(key.slice(2), value);
    index += 1;
  }
  return result;
}

async function main(): Promise<number> {
  try {
    const values = args(process.argv.slice(2));
    const checkRoot = values.get("check-root");
    if (checkRoot !== undefined) {
      const report = await tablebaseCensusReport(checkRoot);
      const output = `${JSON.stringify(report, null, 2)}\n`;
      const out = values.get("out");
      if (out === undefined) process.stdout.write(output);
      else await writeFile(resolve(out), output, "utf8");
      console.error(`Tablebase census check: ${report.totals.packs} packs; ${report.totals.fullyCensusedChoiceBearingParents}/${report.totals.choiceBearingParents} choice-bearing parents; ${report.totals.coveredSuccessors}/${report.totals.successorPositions} successors`);
      return report.totals.fullyCensusedParents === report.totals.parentPositions
        && report.totals.coveredSuccessors === report.totals.successorPositions ? 0 : 1;
    }
    const file = values.get("file");
    if (file === undefined) throw new SourcingError("ARGUMENT_MISSING", "provide --file <pack.json>");
    let lastPrinted = -25;
    const result = await tablebaseCensus(file, {
      maxQueries: Number(values.get("max-queries") ?? "400"),
      onProgress: (progress) => {
        if (progress.completed !== progress.total && progress.completed - lastPrinted < 25) return;
        lastPrinted = progress.completed;
        console.log(`Tablebase census: ${progress.completed}/${progress.total} successors; ${progress.queried} queried; ${progress.cached} cached; ${progress.reused} ledger-reused`);
      },
    });
    console.log(`Censused ${result.packId}: ${result.parentPositions} authored positions; ${result.successorPositions} unique successors; ${result.queried} queried; ${result.cached} cached; ${result.reused} ledger-reused`);
    return 0;
  } catch (error) {
    if (error instanceof SourcingError) console.error(`${error.code}: ${error.message}`);
    else console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (process.argv[1]?.endsWith("tablebase-census.js")) process.exitCode = await main();
