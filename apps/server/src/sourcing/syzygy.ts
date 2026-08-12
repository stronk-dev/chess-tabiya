import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { digestDrillPack, type DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";

import { validatePackDocument } from "../pack-validation.js";
import { emissionJobDigest, sha256, writeCanonicalJson } from "./canonical.js";
import { SourcingHttpClient } from "./http.js";
import { ingestLocalFile } from "./inputs.js";
import { withSourceLock } from "./lock.js";
import type { EvidenceLedger, SourceEntry, SourceManifest } from "./types.js";
import { SourcingError } from "./types.js";
export { countFenPieces } from "./chess-facts.js";
import { countFenPieces } from "./chess-facts.js";

export const TABLEBASE_RATIONALE = "Syzygy tablebase facts are free of copyright under Feist and Football Dataco; the API transports computed chess facts rather than a third-party work";
export const AUTHOR_POSITION_RATIONALE = "the author's own position list; a list of FENs states facts about chess positions";
export const AUTHORING_PROFILE = Object.freeze({ depth: 22, threads: 1, hashMb: 16, multiPv: 1, timeoutMs: 120_000 });

export interface TablebasePayload {
  readonly checkmate: boolean;
  readonly stalemate: boolean;
  readonly insufficient_material: boolean;
  readonly dtz: number | null;
  readonly precise_dtz: number | null;
  readonly dtm: number | null;
  readonly category: string;
}

export interface TablebaseAnswer {
  readonly payload: TablebasePayload;
  readonly source: SourceEntry;
}

export type TablebaseQuery = (fen: string) => Promise<TablebaseAnswer>;

export interface SyzygyEmitOptions {
  readonly positions: string;
  readonly learnerSide: "white" | "black";
  readonly opponent: "strong_engine" | "human_common";
  readonly checkpointPlies?: number;
  readonly targetElo?: number;
  readonly outputRoot?: string;
  readonly sourceRoot?: string;
  readonly now?: () => Date;
  readonly query?: TablebaseQuery;
}

interface PositionInput { readonly fen: string; readonly label: string }

function readPositions(text: string): PositionInput[] {
  return text.replaceAll("\r\n", "\n").split("\n").filter((line) => line.trim() !== "").map((line, index) => {
    const [fen, label] = line.split("\t", 2);
    if (!fen) throw new SourcingError("POSITION_LIST_INVALID", `missing FEN at line ${index + 1}`);
    try { Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
    catch { throw new SourcingError("POSITION_LIST_INVALID", `illegal FEN at line ${index + 1}`); }
    return { fen, label: label?.trim() || `Endgame: ${materialSignature(fen)}` };
  });
}

function materialSignature(fen: string): string {
  const placement = fen.split(" ")[0] ?? "";
  const order = ["K", "Q", "R", "B", "N", "P"];
  const white = order.flatMap((piece) => [...placement].filter((value) => value === piece));
  const black = order.flatMap((piece) => [...placement].filter((value) => value === piece.toLowerCase()).map(() => piece));
  return `${white.join("")} vs ${black.join("")}`;
}

function slug(value: string): string {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-+|-+$/g, "");
}

function turn(fen: string): "white" | "black" {
  return fen.split(" ")[1] === "b" ? "black" : "white";
}

function checkpointPly(base: number, fen: string, learnerSide: "white" | "black"): number {
  const learnerMovesOdd = turn(fen) === learnerSide;
  return (base % 2 === 1) === learnerMovesOdd ? base : base + 1;
}

export function validateAuthoringProfile(profile: { readonly multiPv: number }): void {
  if (profile.multiPv !== 1) throw new SourcingError("AUTHORING_MULTIPV_UNSUPPORTED", "authoring evidence requires MultiPV 1: the shipped lastInfo parser would otherwise select the highest-numbered line (evidence-queue.ts:265-275)");
}

export async function fixtureTablebaseQuery(fen: string): Promise<TablebaseAnswer> {
  const bytes = await readFile(resolve("apps/server/src/sourcing/fixtures/tablebase-response.json"));
  const payload = JSON.parse(bytes.toString("utf8")) as TablebasePayload;
  const retrievedAt = "2026-08-12T00:00:00.000Z";
  return {
    payload,
    source: {
      sourceId: "syzygy",
      retrievedAt,
      origin: { kind: "http", url: `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(fen)}`, status: 200, sha256: sha256(bytes), bytes: bytes.byteLength, etag: null },
      licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: TABLEBASE_RATIONALE },
    },
  };
}

export async function liveTablebaseQuery(fen: string, sourceRoot = resolve("content/sources")): Promise<TablebaseAnswer> {
  return withSourceLock(sourceRoot, async (lock) => {
    const url = `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(fen)}`;
    const response = await new SourcingHttpClient(lock).request(url);
    const payload = JSON.parse(new TextDecoder().decode(response.body)) as TablebasePayload;
    const retrievedAt = new Date().toISOString();
    return {
      payload,
      source: {
        sourceId: "syzygy",
        retrievedAt,
        origin: { kind: "http", url, status: response.status, sha256: sha256(response.body), bytes: response.body.byteLength, etag: response.headers.get("etag") },
        licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: TABLEBASE_RATIONALE },
      },
    };
  });
}

export async function emitSyzygyCandidates(options: SyzygyEmitOptions): Promise<readonly string[]> {
  validateAuthoringProfile(AUTHORING_PROFILE);
  const ingested = await ingestLocalFile(options.positions, {
    sourceId: "author-positions",
    licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: AUTHOR_POSITION_RATIONALE },
    ...(options.sourceRoot === undefined ? {} : { sourceRoot: options.sourceRoot }),
    ...(options.now === undefined ? {} : { now: options.now }),
  });
  const inputs = readPositions(new TextDecoder().decode(ingested.bytes));
  const collisions = new Map<string, number>();
  const outputs: string[] = [];
  for (const input of inputs) {
    const baseId = `endgame-${slug(input.label)}`;
    const occurrence = (collisions.get(baseId) ?? 0) + 1;
    collisions.set(baseId, occurrence);
    const id = occurrence === 1 ? baseId : `${baseId}-${occurrence}`;
    const pieces = countFenPieces(input.fen);
    const atPly = checkpointPly(options.checkpointPlies ?? 16, input.fen, options.learnerSide);
    const localSourceText = `author-positions (${ingested.entry.origin.kind === "local-file" ? `${ingested.entry.origin.path} ${ingested.entry.origin.sha256}` : "local input"}) — ${AUTHOR_POSITION_RATIONALE}`;
    const sourceEntries: SourceEntry[] = [ingested.entry];
    const provenanceSources = [localSourceText];
    const positionRecord = {
      kind: "position_legality" as const,
      anchor: { fen: input.fen },
      sourceId: ingested.entry.sourceId,
      retrievedAt: ingested.entry.retrievedAt,
      grounds: "machine_validation" as const,
      values: { fen: input.fen, pieceCount: pieces },
      supports: ["/start/fen"],
    };
    let records: any[] = [positionRecord];
    let abstentions: any[] = [];
    if (pieces <= 7) {
      if (!options.query) throw new SourcingError("TABLEBASE_SOURCE_UNAVAILABLE", "an in-range position requires a tablebase query or offline fixture");
      const answer = await options.query(input.fen);
      sourceEntries.push(answer.source);
      provenanceSources.push(`syzygy (${answer.source.origin.kind === "http" ? answer.source.origin.url : "tablebase"}) — ${TABLEBASE_RATIONALE}`);
      records.push({
        kind: "tablebase_result",
        anchor: { fen: input.fen },
        sourceId: answer.source.sourceId,
        retrievedAt: answer.source.retrievedAt,
        grounds: "machine_validation",
        values: { fen: input.fen, pieceCount: pieces, category: answer.payload.category, dtz: answer.payload.dtz, precise_dtz: answer.payload.precise_dtz, dtm: answer.payload.dtm, checkmate: answer.payload.checkmate, stalemate: answer.payload.stalemate, insufficient_material: answer.payload.insufficient_material },
        supports: ["/start/fen"],
      });
    } else {
      abstentions = [{ kind: "tablebase_result", anchor: { fen: input.fen }, sourceId: ingested.entry.sourceId, retrievedAt: ingested.entry.retrievedAt, reason: "out_of_range", detail: `${pieces} pieces; Syzygy covers <=7` }];
    }
    const blockers = [
      "objective.summary is the emitter's mechanical placeholder; an author must replace it with this pack's actual teaching objective before reviewStatus leaves draft",
      `opponent mode ${options.opponent} is an authoring choice that must be reviewed for this convert/hold/save drill`,
      ...(pieces <= 7 ? [`Exact tablebase grading is available for this root but perfect_tablebase is not selectable (defect D8); the opponent is ${options.opponent} and can deviate from best play`] : []),
    ];
    const pack = {
      id,
      version: "0.1.0",
      title: input.label,
      mode: "outcome",
      phase: "endgame",
      ...(atPly <= 20 ? { difficulty: { branchLengthTarget: atPly } } : {}),
      start: { fen: input.fen, side: options.learnerSide },
      objective: { type: "play_until_checkpoint", summary: `Play this endgame out for ${atPly} plies from this position.`, successConditions: [{ kind: "reach_checkpoint", checkpointId: "endgame-played-out" }] },
      checkpoints: [{ id: "endgame-played-out", trigger: { atPly }, actions: [] }],
      opponentPolicy: options.opponent === "strong_engine" ? { mode: "strong_engine" } : { mode: "human_common", targetElo: options.targetElo ?? 1800, seedMode: "per_branch" },
      feedbackPolicy: "delayed_checkpoint",
      provenance: { reviewStatus: "draft", sources: provenanceSources, reviewers: [], licence: "CC-BY-SA-4.0", graduationBlockers: blockers },
    } satisfies DrillPackDefinition;
    const validation = validatePackDocument(pack);
    if (!validation.valid) throw new SourcingError("EMITTED_PACK_INVALID", validation.issues.map((value) => `${value.path} ${value.code}: ${value.message}`).join("; "));
    const manifest: SourceManifest = { schema: "tabiya.sourcing.manifest.v1", entries: sourceEntries };
    const digest = await digestDrillPack(pack);
    const sourcedAt = sourceEntries.map((entry) => entry.retrievedAt).sort().at(-1)!;
    const ledger: EvidenceLedger = { schema: "tabiya.sourcing.evidence.v1", packId: pack.id, packVersion: pack.version, packDigest: digest, sourcedAt, records, abstentions };
    const args = { positions: ingested.entry.origin.kind === "local-file" ? ingested.entry.origin.path : options.positions, learnerSide: options.learnerSide, opponent: options.opponent, checkpointPlies: options.checkpointPlies ?? 16, ...(options.targetElo === undefined ? {} : { targetElo: options.targetElo }) };
    const output = resolve(options.outputRoot ?? "content/candidates", id);
    await writeCanonicalJson(resolve(output, "pack.json"), pack);
    await writeCanonicalJson(resolve(output, "evidence.json"), ledger);
    await writeCanonicalJson(resolve(output, "sources.json"), manifest);
    await writeCanonicalJson(resolve(output, "job.json"), { schema: "tabiya.sourcing.job.v1", pipeline: "syzygy", args, sourceEtags: sourceEntries.map((entry) => entry.origin.kind === "http" ? entry.origin.etag : null), emissionJobDigest: emissionJobDigest("syzygy", args, sourceEntries.map((entry) => entry.origin.kind === "http" ? entry.origin.etag : null)) });
    outputs.push(output);
  }
  return Object.freeze(outputs);
}
