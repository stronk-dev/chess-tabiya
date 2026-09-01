import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";

import {
  canonicalizeJson,
  digestDrillPack,
  type DrillPackDefinition,
} from "@chess-tabiya/schema/drill-pack";

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
}

export interface TablebaseCensusCompilation {
  readonly ledger: EvidenceLedger;
  readonly manifest: SourceManifest;
  readonly parentPositions: number;
  readonly successorPositions: number;
  readonly queried: number;
  readonly reused: number;
}

export interface TablebaseCensusResult extends TablebaseCensusCompilation {
  readonly packId: string;
  readonly paths: CensusPaths;
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
  let reused = 0;

  for (const [fen, pointers] of [...parentPointers.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const existing = existingByFen.get(fen);
    if (existing !== undefined) {
      reused += 1;
      replacements.set(fen, Object.freeze({
        ...existing,
        supports: Object.freeze([...new Set([...existing.supports, ...pointers])].sort()),
      }));
      continue;
    }
    if (queried >= maxQueries) {
      throw new SourcingError(
        "WALK_QUERY_BUDGET_EXCEEDED",
        `tablebase census requires more than ${maxQueries} new successor queries`,
      );
    }
    const answer: TablebaseAnswer = await query(fen);
    queried += 1;
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
  const compiled = await compileTablebaseCensus(
    pack,
    JSON.parse(ledgerBytes) as EvidenceLedger,
    JSON.parse(manifestBytes) as SourceManifest,
    options,
  );
  assertSourcingArtifacts(pack, compiled.ledger.packDigest!, compiled.ledger, compiled.manifest, true);
  await writePair(paths, compiled.ledger, compiled.manifest, { ledger: ledgerBytes, manifest: manifestBytes });
  return Object.freeze({ ...compiled, packId: pack.id, paths });
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
    const file = values.get("file");
    if (file === undefined) throw new SourcingError("ARGUMENT_MISSING", "provide --file <pack.json>");
    const result = await tablebaseCensus(file, { maxQueries: Number(values.get("max-queries") ?? "400") });
    console.log(`Censused ${result.packId}: ${result.parentPositions} authored positions; ${result.successorPositions} unique successors; ${result.queried} queried; ${result.reused} reused`);
    return 0;
  } catch (error) {
    if (error instanceof SourcingError) console.error(`${error.code}: ${error.message}`);
    else console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (process.argv[1]?.endsWith("tablebase-census.js")) process.exitCode = await main();
