import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";

import { digestDrillPack, type DrillPackDefinition, type SpineNode } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

import { validatePackDocument } from "../pack-validation.js";
import { assessmentGrounding, linkage, validateLedger, validateManifest } from "./ledger-validation.js";
import { emissionJobDigest, sha256, writeCanonicalJson } from "./canonical.js";
import { countFenPieces } from "./chess-facts.js";
import { liveTablebaseQuery, TABLEBASE_RATIONALE, type TablebaseAnswer, type TablebasePayload, type TablebaseQuery } from "./syzygy.js";
import type { EvidenceAbstention, EvidenceLedger, EvidenceRecord, SourceEntry, SourceManifest, SourcingIssue } from "./types.js";
import { SourcingError } from "./types.js";

const AUTHOR_PACK_RATIONALE = "the author's own drill pack; its FENs and moves state facts about chess positions";
const OFFLINE_FIXTURES = resolve("apps/server/src/sourcing/fixtures/verify-draft.json");

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
    const anchor = "spineNodeId" in deviation.at ? byNode.get(deviation.at.spineNodeId) : deviation.at.fen;
    if (anchor === undefined) throw new SourcingError("DRAFT_PACK_INVALID", `/deviations/${index}/at references an unknown spine node`);
    const played = afterMove(anchor, deviation.moveUci, `/deviations/${index}/moveUci`);
    values.push({ fen: played.fen, pointer: `/deviations/${index}/moveUci`, mover: played.mover, parentFen: anchor, opponentMove: played.mover !== pack.start.side, kind: "deviation" });
  }
  return Object.freeze(values);
}

function tablebaseValues(fen: string, payload: TablebasePayload): Readonly<Record<string, unknown>> {
  return Object.freeze({ fen, pieceCount: countFenPieces(fen), category: payload.category, dtz: payload.dtz, precise_dtz: payload.precise_dtz, dtm: payload.dtm, checkmate: payload.checkmate, stalemate: payload.stalemate, insufficient_material: payload.insufficient_material });
}

function invert(category: string): string {
  const pairs: Readonly<Record<string, string>> = { win: "loss", loss: "win", draw: "draw", "cursed-win": "blessed-loss", "blessed-loss": "cursed-win", "maybe-win": "maybe-loss", "maybe-loss": "maybe-win", "syzygy-win": "syzygy-loss", "syzygy-loss": "syzygy-win" };
  return pairs[category] ?? category;
}

const CATEGORY_RANK: Readonly<Record<string, number>> = Object.freeze({ loss: 0, "syzygy-loss": 1, "maybe-loss": 2, "blessed-loss": 3, draw: 4, "cursed-win": 5, "maybe-win": 6, "syzygy-win": 7, win: 8 });

function learnerCategory(fen: string, category: string, learner: "white" | "black"): string {
  return position(fen).turn === learner ? category : invert(category);
}

function sidecars(file: string): VerifyDraftResult["paths"] {
  const directory = dirname(file), name = basename(file), stem = name.slice(0, -extname(name).length);
  return { ledger: resolve(directory, `${stem}.evidence.json`), manifest: resolve(directory, `${stem}.sources.json`), job: resolve(directory, `${stem}.job.json`) };
}

async function offlineQuery(fen: string): Promise<TablebaseAnswer> {
  const raw = JSON.parse(await readFile(OFFLINE_FIXTURES, "utf8")) as Record<string, TablebasePayload>;
  const payload = raw[fen];
  if (payload === undefined) throw new SourcingError("TABLEBASE_SOURCE_UNAVAILABLE", `offline fixture missing FEN ${fen}`);
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const offset = Number.parseInt(sha256(fen).slice(7, 15), 16) % 86_400_000;
  const retrievedAt = new Date(Date.UTC(2026, 7, 14) + offset).toISOString();
  return { payload, source: { sourceId: "syzygy", retrievedAt, origin: { kind: "http", url: `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(fen)}`, status: 200, sha256: sha256(bytes), bytes: bytes.byteLength, etag: null }, licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: TABLEBASE_RATIONALE } } };
}

function assertArtifacts(pack: DrillPackDefinition, ledger: EvidenceLedger, manifest: SourceManifest): void {
  const issues: SourcingIssue[] = [];
  validateLedger(ledger, issues);
  validateManifest(manifest, issues);
  linkage(manifest, ledger, issues);
  if (issues.some((issue) => issue.severity === "error")) throw new SourcingError("DRAFT_PACK_INVALID", issues.map((issue) => `${issue.path} ${issue.code}: ${issue.message}`).join("; "));
  if (assessmentGrounding({ document: pack, ledger, manifest }) !== "ledger_verified") throw new SourcingError("DRAFT_PACK_INVALID", "emitted sidecars did not earn ledger_verified admission");
}

export async function verifyDraft(file: string, options: VerifyDraftOptions = {}): Promise<VerifyDraftResult> {
  const absolute = resolve(file);
  const bytes = new Uint8Array(await readFile(absolute));
  const raw = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  const validation = validatePackDocument(raw);
  if (!validation.valid) throw new SourcingError("DRAFT_PACK_INVALID", validation.issues.map((issue) => `${issue.path} ${issue.code}: ${issue.message}`).join("; "));
  const original = raw as DrillPackDefinition;
  const assessedBy = original.objective.grading?.assessedBy;
  if (assessedBy?.kind !== "syzygy") throw new SourcingError("VERIFY_ASSESSMENT_NOT_SYZYGY", "objective.grading.assessedBy.kind must be syzygy");
  const positions = enumerate(original);
  const query = options.query ?? (options.offline ? offlineQuery : liveTablebaseQuery);
  const answers = new Map<string, TablebaseAnswer>();
  for (const item of positions) if (countFenPieces(item.fen) <= 7 && !answers.has(item.fen)) answers.set(item.fen, await query(item.fen));
  const root = answers.get(original.start.fen);
  if (root === undefined) throw new SourcingError("VERIFY_ASSESSMENT_CONTRADICTED", "root has no tablebase answer");
  if (root.payload.category !== assessedBy.category || countFenPieces(original.start.fen) !== assessedBy.pieceCount) throw new SourcingError("VERIFY_ASSESSMENT_CONTRADICTED", `declared ${assessedBy.category}/${assessedBy.pieceCount} does not equal queried ${root.payload.category}/${countFenPieces(original.start.fen)}`);

  const warnings: string[] = [];
  for (const item of positions) {
    if (item.kind !== "spine" || item.parentFen === undefined || item.mover === undefined) continue;
    const parent = answers.get(item.parentFen), child = answers.get(item.fen);
    if (parent === undefined || child === undefined) continue;
    const before = learnerCategory(item.parentFen, parent.payload.category, original.start.side);
    const after = learnerCategory(item.fen, child.payload.category, original.start.side);
    if ((CATEGORY_RANK[after] ?? -1) < (CATEGORY_RANK[before] ?? -1)) {
      if (!item.opponentMove) throw new SourcingError("VERIFY_SPINE_CATEGORY_REGRESSION", `${item.pointer} changes learner category ${before} -> ${after}`);
      warnings.push(`${item.pointer}: opponent choice changes learner category ${before} -> ${after}`);
    }
  }

  const pack = structuredClone(original) as any;
  pack.objective.grading.assessedBy.sourceId = root.source.sourceId;
  pack.objective.grading.assessedBy.retrievedAt = root.source.retrievedAt;
  const digest = await digestDrillPack(pack as DrillPackDefinition);
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
  const entries = new Map<string, SourceEntry>();
  entries.set(`${author.sourceId}\0${author.retrievedAt}`, author);
  for (const answer of answers.values()) entries.set(`${answer.source.sourceId}\0${answer.source.retrievedAt}`, answer.source);
  const manifest: SourceManifest = { schema: "tabiya.sourcing.manifest.v1", entries: Object.freeze([...entries.values()]) };
  const sourcedAt = manifest.entries.map((entry) => entry.retrievedAt).sort().at(-1)!;
  const ledger: EvidenceLedger = { schema: "tabiya.sourcing.evidence.v1", packId: pack.id, packVersion: pack.version, packDigest: digest, sourcedAt, records: Object.freeze(records), abstentions: Object.freeze(abstentions) };
  assertArtifacts(pack, ledger, manifest);

  const paths = sidecars(absolute);
  const args = { file: absolute.replace(`${resolve(".")}/`, ""), offline: options.offline === true };
  await writeFile(absolute, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  await writeCanonicalJson(paths.ledger, ledger);
  await writeCanonicalJson(paths.manifest, manifest);
  await writeCanonicalJson(paths.job, { schema: "tabiya.sourcing.job.v1", pipeline: "verify-draft", args, sourceEtags: manifest.entries.map((entry) => entry.origin.kind === "http" ? entry.origin.etag : null), emissionJobDigest: emissionJobDigest("verify-draft", args, manifest.entries.map((entry) => entry.origin.kind === "http" ? entry.origin.etag : null)) });
  return { pack, ledger, manifest, warnings: Object.freeze(warnings), paths };
}

async function main(): Promise<number> {
  const file = process.argv[2];
  if (file === undefined) { console.error("Usage: make verify-draft FILE=<path-to-pack.json> [OFFLINE=1]"); return 2; }
  try {
    const result = await verifyDraft(file, { offline: process.env.OFFLINE === "1" });
    for (const warning of result.warnings) console.warn(`WARNING ${warning}`);
    console.log(`Verified ${result.pack.id}: ledger_verified`);
    return 0;
  } catch (error) {
    if (error instanceof SourcingError) { console.error(`ERROR [${error.code}] ${error.message}`); return 1; }
    throw error;
  }
}

if (process.argv[1]?.endsWith("verify-draft.js")) process.exitCode = await main();
