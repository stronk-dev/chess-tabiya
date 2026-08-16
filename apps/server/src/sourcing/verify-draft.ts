import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";

import { digestDrillPack, type DrillPackDefinition, type SpineNode } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

import { validatePackDocument } from "../pack-validation.js";
import { evidenceSemantics, evidenceSupports } from "./check.js";
import { assessmentGrounding, linkage, validateLedger, validateManifest } from "./ledger-validation.js";
import { emissionJobDigest, readJson, sha256, writeCanonicalJson } from "./canonical.js";
import { countFenPieces } from "./chess-facts.js";
import { liveTablebaseQuery, type TablebaseAnswer, type TablebasePayload, type TablebaseQuery } from "./syzygy.js";
import type { EvidenceAbstention, EvidenceLedger, EvidenceRecord, SourceEntry, SourceManifest, SourcingIssue } from "./types.js";
import { SourcingError } from "./types.js";
import { TABLEBASE_CATEGORIES, type TablebaseCategory } from "../tablebase.js";
import { CATEGORY_RANK, learnerCategory as categoryForLearner } from "./tablebase-category.js";
import { createPositionSeedEngineEvaluator, type PositionSeedEngineAnswer, type PositionSeedEngineEvaluator } from "./position-seeds.js";
import { stampDeviationCosts } from "./deviation-cost.js";

const AUTHOR_PACK_RATIONALE = "the author's own drill pack; its FENs and moves state facts about chess positions";
const OFFLINE_FIXTURES = resolve("apps/server/src/sourcing/fixtures/verify-draft.json");
const OFFLINE_ENGINE_FIXTURES = resolve("apps/server/src/sourcing/fixtures/verify-draft-engine.json");

interface EnumeratedPosition {
  readonly fen: string;
  readonly pointer: string;
  readonly mover?: "white" | "black";
  readonly parentFen?: string;
  readonly opponentMove?: boolean;
  readonly kind?: "spine" | "deviation";
}

export interface VerifyDraftOptions {
  readonly query?: TablebaseQuery;
  readonly engineEvaluator?: PositionSeedEngineEvaluator;
  readonly engineCommand?: string;
  readonly engineArgs?: readonly string[];
  readonly now?: () => Date;
  readonly offline?: boolean;
}

export interface VerifyDraftResult {
  readonly pack: DrillPackDefinition;
  readonly ledger: EvidenceLedger;
  readonly manifest: SourceManifest;
  readonly warnings: readonly string[];
  readonly paths: { readonly ledger: string; readonly manifest: string; readonly job: string };
}

function position(fen: string): Chess {
  try {
    return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  } catch {
    throw new SourcingError("DRAFT_PACK_INVALID", `invalid FEN: ${fen}`);
  }
}

function afterMove(fen: string, uci: string, label: string): { readonly fen: string; readonly mover: "white" | "black" } {
  const board = position(fen);
  const mover = board.turn === "white" ? "white" : "black";
  const move = parseUci(uci);
  if (move === undefined || !board.isLegal(move)) throw new SourcingError("DRAFT_PACK_INVALID", `${label} is illegal: ${uci}`);
  board.play(move);
  return { fen: makeFen(board.toSetup()), mover };
}

function enumerate(pack: DrillPackDefinition): readonly EnumeratedPosition[] {
  const values: EnumeratedPosition[] = [{ fen: pack.start.fen, pointer: "/start/fen" }];
  const byNode = new Map<string, string>();
  const walk = (nodes: readonly SpineNode[], parentFen: string, base: string): void => {
    nodes.forEach((node, index) => {
      const pointer = `${base}/${index}`;
      const played = afterMove(parentFen, node.moveUci, `${pointer}/moveUci`);
      byNode.set(node.id, played.fen);
      values.push({ fen: played.fen, pointer: `${pointer}/moveUci`, mover: played.mover, parentFen, opponentMove: played.mover !== pack.start.side, kind: "spine" });
      walk(node.children, played.fen, `${pointer}/children`);
    });
  };
  walk(pack.spine ?? [], pack.start.fen, "/spine");
  for (const [index, deviation] of (pack.deviations ?? []).entries()) {
    const anchor = "spineNodeId" in deviation.at ? byNode.get(deviation.at.spineNodeId) : "fen" in deviation.at ? deviation.at.fen : pack.start.fen;
    if (anchor === undefined) throw new SourcingError("DRAFT_PACK_INVALID", `/deviations/${index}/at references an unknown spine node`);
    const played = afterMove(anchor, deviation.moveUci, `/deviations/${index}/moveUci`);
    values.push({ fen: played.fen, pointer: `/deviations/${index}/moveUci`, mover: played.mover, parentFen: anchor, opponentMove: played.mover !== pack.start.side, kind: "deviation" });
  }
  return Object.freeze(values);
}

function tablebaseValues(fen: string, payload: TablebasePayload): Readonly<Record<string, unknown>> {
  return Object.freeze({ fen, pieceCount: countFenPieces(fen), category: payload.category, dtz: payload.dtz, precise_dtz: payload.precise_dtz, dtm: payload.dtm, checkmate: payload.checkmate, stalemate: payload.stalemate, insufficient_material: payload.insufficient_material });
}

function learnerCategory(fen: string, category: string, learner: "white" | "black"): string {
  return categoryForLearner(position(fen).turn, category as TablebaseCategory, learner);
}

function sidecars(file: string): VerifyDraftResult["paths"] {
  const directory = dirname(file), name = basename(file), stem = name.slice(0, -extname(name).length);
  return { ledger: resolve(directory, `${stem}.evidence.json`), manifest: resolve(directory, `${stem}.sources.json`), job: resolve(directory, `${stem}.job.json`) };
}

async function createOfflineQuery(retrievedAt: string): Promise<TablebaseQuery> {
  const bytes = new Uint8Array(await readFile(OFFLINE_FIXTURES));
  const raw = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, TablebasePayload>;
  const source: SourceEntry = {
    sourceId: "syzygy-offline-fixture",
    retrievedAt,
    origin: {
      kind: "local-file",
      path: OFFLINE_FIXTURES.replace(`${resolve(".")}/`, ""),
      sha256: sha256(bytes),
      bytes: bytes.byteLength,
    },
    licence: {
      basis: "no-rights-asserted",
      spdx: null,
      noticeText: null,
      rationale: "committed tablebase response fixture used for offline transformation tests; it is not evidence of a network query",
    },
  };
  return async (fen: string): Promise<TablebaseAnswer> => {
    const payload = raw[fen];
    if (payload === undefined) throw new SourcingError("TABLEBASE_SOURCE_UNAVAILABLE", `offline fixture missing FEN ${fen}`);
    return { payload, source };
  };
}

function assertArtifacts(
  pack: DrillPackDefinition,
  ledger: EvidenceLedger,
  manifest: SourceManifest,
  requireGrounding: boolean,
  costRecords: readonly EvidenceRecord[] = ledger.records,
): void {
  const issues: SourcingIssue[] = [];
  validateLedger(ledger, issues);
  validateManifest(manifest, issues);
  linkage(manifest, ledger, issues);
  evidenceSemantics(ledger, issues, manifest, pack);
  evidenceSupports(pack, ledger, manifest, issues, costRecords);
  if (issues.some((issue) => issue.severity === "error")) throw new SourcingError("DRAFT_PACK_INVALID", issues.map((issue) => `${issue.path} ${issue.code}: ${issue.message}`).join("; "));
  if (requireGrounding && assessmentGrounding({ document: pack, ledger, manifest }) !== "ledger_verified") throw new SourcingError("DRAFT_PACK_INVALID", "emitted sidecars did not earn ledger_verified admission");
}

async function verifySyzygyDraft(file: string, options: VerifyDraftOptions = {}): Promise<VerifyDraftResult> {
  const absolute = resolve(file);
  const bytes = new Uint8Array(await readFile(absolute));
  const raw = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  const validation = validatePackDocument(raw);
  if (!validation.valid) throw new SourcingError("DRAFT_PACK_INVALID", validation.issues.map((issue) => `${issue.path} ${issue.code}: ${issue.message}`).join("; "));
  const original = raw as DrillPackDefinition;
  const assessedBy = original.objective.grading?.assessedBy;
  if (assessedBy?.kind !== "syzygy") throw new SourcingError("VERIFY_ASSESSMENT_NOT_SYZYGY", "objective.grading.assessedBy.kind must be syzygy");
  const positions = enumerate(original);
  const query = options.query ?? (options.offline
    ? await createOfflineQuery((options.now?.() ?? new Date()).toISOString())
    : liveTablebaseQuery);
  const answers = new Map<string, TablebaseAnswer>();
  for (const item of positions) if (countFenPieces(item.fen) <= 7 && !answers.has(item.fen)) answers.set(item.fen, await query(item.fen));
  const root = answers.get(original.start.fen);
  if (root === undefined) throw new SourcingError("VERIFY_ASSESSMENT_CONTRADICTED", "root has no tablebase answer");
  if (["syzygy-win", "maybe-win", "maybe-loss", "syzygy-loss", "unknown"].includes(root.payload.category)) {
    throw new SourcingError("VERIFY_ASSESSMENT_INDETERMINATE", `queried root category ${root.payload.category} is not determinate enough for pack grading`);
  }
  if (!(TABLEBASE_CATEGORIES as readonly string[]).includes(root.payload.category)) throw new SourcingError("VERIFY_ASSESSMENT_INDETERMINATE", `queried root category ${root.payload.category} is unknown`);
  if (root.payload.category !== assessedBy.category || countFenPieces(original.start.fen) !== assessedBy.pieceCount) throw new SourcingError("VERIFY_ASSESSMENT_CONTRADICTED", `declared ${assessedBy.category}/${assessedBy.pieceCount} does not equal queried ${root.payload.category}/${countFenPieces(original.start.fen)}`);

  const warnings: string[] = [];
  for (const item of positions) {
    if (item.kind !== "spine" || item.parentFen === undefined || item.mover === undefined) continue;
    const parent = answers.get(item.parentFen), child = answers.get(item.fen);
    if (parent === undefined || child === undefined) continue;
    const before = learnerCategory(item.parentFen, parent.payload.category, original.start.side);
    const after = learnerCategory(item.fen, child.payload.category, original.start.side);
    if ((CATEGORY_RANK[after as keyof typeof CATEGORY_RANK] ?? -1) < (CATEGORY_RANK[before as keyof typeof CATEGORY_RANK] ?? -1)) {
      if (!item.opponentMove) throw new SourcingError("VERIFY_SPINE_CATEGORY_REGRESSION", `${item.pointer} changes learner category ${before} -> ${after}`);
      warnings.push(`${item.pointer}: opponent choice changes learner category ${before} -> ${after}`);
    }
  }

  const pack = structuredClone(original) as any;
  pack.objective.grading.assessedBy.sourceId = root.source.sourceId;
  pack.objective.grading.assessedBy.retrievedAt = root.source.retrievedAt;
  const authorRetrievedAt = (options.now?.() ?? new Date()).toISOString();
  const author: SourceEntry = { sourceId: "author-pack", retrievedAt: authorRetrievedAt, origin: { kind: "local-file", path: absolute.replace(`${resolve(".")}/`, ""), sha256: sha256(bytes), bytes: bytes.byteLength }, licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: AUTHOR_PACK_RATIONALE } };
  const records: EvidenceRecord[] = [{ kind: "position_legality", anchor: { fen: pack.start.fen }, sourceId: author.sourceId, retrievedAt: author.retrievedAt, grounds: "machine_validation", values: { fen: pack.start.fen, pieceCount: countFenPieces(pack.start.fen) }, supports: ["/start/fen"] }];
  const abstentions: EvidenceAbstention[] = [];
  for (const item of positions) {
    const answer = answers.get(item.fen);
    if (answer === undefined) {
      abstentions.push({ kind: "tablebase_result", anchor: { fen: item.fen }, sourceId: author.sourceId, retrievedAt: author.retrievedAt, reason: "out_of_range", detail: `${countFenPieces(item.fen)} pieces; Syzygy covers <=7` });
    } else {
      records.push({ kind: "tablebase_result", anchor: { fen: item.fen }, sourceId: answer.source.sourceId, retrievedAt: answer.source.retrievedAt, grounds: "machine_validation", values: tablebaseValues(item.fen, answer.payload), supports: [item.pointer] });
    }
  }
  stampDeviationCosts(pack as DrillPackDefinition, records, "tablebase");
  const digest = await digestDrillPack(pack as DrillPackDefinition);
  const entries = new Map<string, SourceEntry>();
  entries.set(`${author.sourceId}\0${author.retrievedAt}`, author);
  for (const answer of answers.values()) entries.set(`${answer.source.sourceId}\0${answer.source.retrievedAt}`, answer.source);
  const manifest: SourceManifest = { schema: "tabiya.sourcing.manifest.v1", entries: Object.freeze([...entries.values()]) };
  const sourcedAt = manifest.entries.map((entry) => entry.retrievedAt).sort().at(-1)!;
  const ledger: EvidenceLedger = { schema: "tabiya.sourcing.evidence.v1", packId: pack.id, packVersion: pack.version, packDigest: digest, sourcedAt, records: Object.freeze(records), abstentions: Object.freeze(abstentions) };
  assertArtifacts(pack, ledger, manifest, options.offline !== true, records);

  const paths = sidecars(absolute);
  const args = { file: absolute.replace(`${resolve(".")}/`, ""), offline: options.offline === true };
  await writeFile(absolute, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  await writeCanonicalJson(paths.ledger, ledger);
  await writeCanonicalJson(paths.manifest, manifest);
  await writeCanonicalJson(paths.job, { schema: "tabiya.sourcing.job.v1", pipeline: "verify-draft", args, sourceEtags: manifest.entries.map((entry) => entry.origin.kind === "http" ? entry.origin.etag : null), emissionJobDigest: emissionJobDigest("verify-draft", args, manifest.entries.map((entry) => entry.origin.kind === "http" ? entry.origin.etag : null)) });
  return { pack, ledger, manifest, warnings: Object.freeze(warnings), paths };
}

function engineScore(values: Readonly<Record<string, unknown>>): { readonly kind: "cp"; readonly centipawns: number } | { readonly kind: "mate"; readonly movesToMate: number } {
  if (Number.isInteger(values.centipawns)) return { kind: "cp", centipawns: Number(values.centipawns) };
  if (Number.isInteger(values.mateIn)) return { kind: "mate", movesToMate: Number(values.mateIn) };
  throw new SourcingError("VERIFY_ENGINE_UNAVAILABLE", "engine evaluation returned neither centipawns nor mateIn");
}

function scoreText(score: ReturnType<typeof engineScore>): string {
  return score.kind === "cp" ? `${score.centipawns}cp` : `mate ${score.movesToMate}`;
}

async function offlineEngineEvaluator(fen: string): Promise<PositionSeedEngineAnswer> {
  const fixture = await readJson(OFFLINE_ENGINE_FIXTURES) as Record<string, PositionSeedEngineAnswer>;
  const answer = fixture[fen];
  if (answer === undefined) throw new SourcingError("VERIFY_ENGINE_UNAVAILABLE", `offline fixture missing FEN ${fen}`);
  return answer;
}

async function existingArtifacts(paths: VerifyDraftResult["paths"]): Promise<{ readonly ledger?: EvidenceLedger; readonly manifest?: SourceManifest }> {
  try {
    return { ledger: await readJson(paths.ledger) as EvidenceLedger, manifest: await readJson(paths.manifest) as SourceManifest };
  } catch {
    return {};
  }
}

async function verifyEngineDraft(file: string, options: VerifyDraftOptions): Promise<VerifyDraftResult> {
  const absolute = resolve(file);
  const bytes = new Uint8Array(await readFile(absolute));
  const raw = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  const validation = validatePackDocument(raw);
  if (!validation.valid) throw new SourcingError("DRAFT_PACK_INVALID", validation.issues.map((issue) => `${issue.path} ${issue.code}: ${issue.message}`).join("; "));
  const original = raw as DrillPackDefinition;
  const assessedBy = original.objective.grading?.assessedBy;
  if (assessedBy?.kind !== "engine") throw new SourcingError("VERIFY_ASSESSMENT_NOT_GROUNDABLE", "objective assessment has no supported verification instrument");

  const positions = enumerate(original);
  let owned: Awaited<ReturnType<typeof createPositionSeedEngineEvaluator>> | undefined;
  const evaluate = options.engineEvaluator ?? (options.offline
    ? offlineEngineEvaluator
    : (owned = await createPositionSeedEngineEvaluator(options.engineCommand ?? "stockfish", options.engineArgs)).evaluate);
  const answers = new Map<string, PositionSeedEngineAnswer>();
  try {
    for (const item of positions) {
      if (answers.has(item.fen)) continue;
      try { answers.set(item.fen, await evaluate(item.fen)); }
      catch (error) {
        if (error instanceof SourcingError) throw error;
        throw new SourcingError("VERIFY_ENGINE_UNAVAILABLE", error instanceof Error ? error.message : String(error));
      }
    }
  } finally {
    await owned?.close();
  }
  const root = answers.get(original.start.fen);
  if (root === undefined) throw new SourcingError("VERIFY_ENGINE_UNAVAILABLE", "root has no engine answer");
  const measured = engineScore(root.values);
  const declared = assessedBy.score;
  const agrees = measured.kind === declared.kind && (measured.kind === "cp" ? measured.centipawns === (declared as { centipawns: number }).centipawns : measured.movesToMate === (declared as { movesToMate: number }).movesToMate);
  if (!agrees || root.values.engineId !== assessedBy.engineId || root.values.engineVersion !== assessedBy.engineVersion || root.values.depth !== assessedBy.depth) {
    throw new SourcingError("VERIFY_ASSESSMENT_CONTRADICTED", `declared ${scoreText(declared)} at depth ${assessedBy.depth} by ${assessedBy.engineId} ${assessedBy.engineVersion}; this run measured ${scoreText(measured)} — re-declare, or re-check the engine build`);
  }

  const warnings: string[] = [];
  for (const item of positions) {
    if (item.kind !== "spine" || item.opponentMove || item.parentFen === undefined) continue;
    const parent = answers.get(item.parentFen), child = answers.get(item.fen);
    if (parent === undefined || child === undefined) continue;
    const before = engineScore(parent.values), after = engineScore(child.values);
    if (before.kind === "cp" && after.kind === "cp") warnings.push(`${item.pointer}: learner move measured ${after.centipawns}cp; parent measured ${before.centipawns}cp (${before.centipawns - after.centipawns}cp difference)`);
  }

  const pack = structuredClone(original) as DrillPackDefinition;
  if (pack.objective.grading?.assessedBy.kind !== "engine") throw new SourcingError("VERIFY_ASSESSMENT_NOT_GROUNDABLE", "engine assessment disappeared during verification");
  (pack.objective.grading.assessedBy as { sourceId: string; retrievedAt: string }).sourceId = root.source.sourceId;
  (pack.objective.grading.assessedBy as { sourceId: string; retrievedAt: string }).retrievedAt = root.source.retrievedAt;
  const authorRetrievedAt = (options.now?.() ?? new Date()).toISOString();
  const author: SourceEntry = { sourceId: "author-pack", retrievedAt: authorRetrievedAt, origin: { kind: "local-file", path: absolute.replace(`${resolve(".")}/`, ""), sha256: sha256(bytes), bytes: bytes.byteLength }, licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: AUTHOR_PACK_RATIONALE } };
  const produced: EvidenceRecord[] = [{ kind: "position_legality", anchor: { fen: pack.start.fen }, sourceId: author.sourceId, retrievedAt: author.retrievedAt, grounds: "machine_validation", values: { fen: pack.start.fen, pieceCount: countFenPieces(pack.start.fen) }, supports: ["/start/fen"] }];
  for (const item of positions) {
    const answer = answers.get(item.fen)!;
    produced.push({ kind: "engine_eval", anchor: { fen: item.fen }, sourceId: answer.source.sourceId, retrievedAt: answer.source.retrievedAt, grounds: "machine_validation", values: answer.values, supports: [item.pointer] });
  }
  stampDeviationCosts(pack, produced, "engine");
  const digest = await digestDrillPack(pack);
  const paths = sidecars(absolute);
  const existing = await existingArtifacts(paths);
  const preservedRecords = (existing.ledger?.records ?? []).filter((record) => record.kind !== "engine_eval" && record.kind !== "position_legality");
  const records = [...preservedRecords, ...produced];
  const used = new Set(records.map((record) => `${record.sourceId}\0${record.retrievedAt}`));
  const entries = new Map<string, SourceEntry>();
  for (const entry of existing.manifest?.entries ?? []) if (used.has(`${entry.sourceId}\0${entry.retrievedAt}`)) entries.set(`${entry.sourceId}\0${entry.retrievedAt}`, entry);
  entries.set(`${author.sourceId}\0${author.retrievedAt}`, author);
  for (const answer of answers.values()) entries.set(`${answer.source.sourceId}\0${answer.source.retrievedAt}`, answer.source);
  for (const record of preservedRecords) if (!entries.has(`${record.sourceId}\0${record.retrievedAt}`)) throw new SourcingError("VERIFY_LEDGER_MERGE_CONFLICT", `preserved record has no manifest entry: ${record.sourceId} ${record.retrievedAt}`);
  const manifest: SourceManifest = { schema: "tabiya.sourcing.manifest.v1", entries: Object.freeze([...entries.values()]) };
  const sourcedAt = manifest.entries.map((entry) => entry.retrievedAt).sort().at(-1)!;
  const ledger: EvidenceLedger = { schema: "tabiya.sourcing.evidence.v1", packId: pack.id, packVersion: pack.version, packDigest: digest, sourcedAt, records: Object.freeze(records), abstentions: Object.freeze((existing.ledger?.abstentions ?? []).filter((value) => value.kind !== "engine_eval")) };
  assertArtifacts(pack, ledger, manifest, true, produced);
  const args = { file: absolute.replace(`${resolve(".")}/`, ""), offline: options.offline === true };
  await writeFile(absolute, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  await writeCanonicalJson(paths.ledger, ledger);
  await writeCanonicalJson(paths.manifest, manifest);
  await writeCanonicalJson(paths.job, { schema: "tabiya.sourcing.job.v1", pipeline: "verify-draft", args, sourceEtags: manifest.entries.map((entry) => entry.origin.kind === "http" ? entry.origin.etag : null), emissionJobDigest: emissionJobDigest("verify-draft", args, manifest.entries.map((entry) => entry.origin.kind === "http" ? entry.origin.etag : null)) });
  return { pack, ledger, manifest, warnings: Object.freeze(warnings), paths };
}

export async function verifyDraft(file: string, options: VerifyDraftOptions = {}): Promise<VerifyDraftResult> {
  const raw = JSON.parse(await readFile(resolve(file), "utf8")) as DrillPackDefinition;
  const kind = raw.objective?.grading?.assessedBy?.kind;
  if (kind === "syzygy") return verifySyzygyDraft(file, options);
  if (kind === "engine") return verifyEngineDraft(file, options);
  throw new SourcingError("VERIFY_ASSESSMENT_NOT_GROUNDABLE", "objective assessment has no supported verification instrument");
}

async function main(): Promise<number> {
  const file = process.argv[2];
  if (file === undefined) { console.error("Usage: make verify-draft FILE=<path-to-pack.json> [OFFLINE=1]"); return 2; }
  try {
    const result = await verifyDraft(file, { offline: process.env.OFFLINE === "1" });
    for (const warning of result.warnings) console.warn(`WARNING ${warning}`);
    const grounding = assessmentGrounding({ document: result.pack, ledger: result.ledger, manifest: result.manifest });
    console.log(`Verified ${result.pack.id}: ${grounding}${process.env.OFFLINE === "1" ? " (offline fixture; not promotion evidence)" : ""}`);
    return 0;
  } catch (error) {
    if (error instanceof SourcingError) { console.error(`ERROR [${error.code}] ${error.message}`); return 1; }
    throw error;
  }
}

if (process.argv[1]?.endsWith("verify-draft.js")) process.exitCode = await main();
