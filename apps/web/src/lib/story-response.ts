import { PRIMARY_EVIDENCE_MANIFEST, renderSerializedReviewStoryEvidence } from "@chess-tabiya/runtime";
import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";

import type { CreatedStoryShare, GameStory, RevokedStoryShare, StoryShare } from "./api.js";

const STORY_KINDS = new Set([
  "human_divergence", "option_collapse", "irreversibility", "phase_change", "eval_pivot",
  "last_level", "endgame_entry", "shape_span", "outcome",
]);
const PHASES = new Set(["opening", "middlegame", "endgame", "unclear"]);
const PGN_RESULTS = new Set(["1-0", "0-1", "1/2-1/2", "*"]);
const RUN_RESULTS = new Set(["win", "loss", "draw"]);
const projectionKeys = new Set(PRIMARY_EVIDENCE_MANIFEST.projections.map((item) => `${item.id}@${item.version}`));
const producerKeys = new Set(PRIMARY_EVIDENCE_MANIFEST.producers.map((item) => `${item.id}@${item.version}`));

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function closed(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const keys = new Set(allowed);
  return Object.keys(value).every((key) => keys.has(key));
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function natural(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function instant(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function stringRecord(value: unknown): value is Readonly<Record<string, string>> {
  const item = record(value);
  return item !== undefined && Object.values(item).every((entry) => typeof entry === "string");
}

function validFen(value: unknown): value is string {
  if (!text(value)) return false;
  try {
    Chess.fromSetup(parseFen(value).unwrap()).unwrap();
    return true;
  } catch {
    return false;
  }
}

function versionedId(value: unknown, catalogue: ReadonlySet<string>): boolean {
  const item = record(value);
  return item !== undefined
    && closed(item, ["id", "version"])
    && text(item.id)
    && Number.isSafeInteger(item.version)
    && (item.version as number) > 0
    && catalogue.has(`${item.id}@${item.version}`);
}

function evidence(value: unknown): boolean {
  const item = record(value);
  return item !== undefined
    && closed(item, ["producer", "projection", "payload"])
    && versionedId(item.producer, producerKeys)
    && versionedId(item.projection, projectionKeys)
    && item.payload !== undefined;
}

function evaluation(value: unknown): boolean {
  const item = record(value);
  return item !== undefined
    && closed(item, ["centipawns", "engineId", "requestedMovetimeMs"])
    && Number.isSafeInteger(item.centipawns)
    && text(item.engineId)
    && (item.requestedMovetimeMs === undefined
      || (Number.isSafeInteger(item.requestedMovetimeMs) && (item.requestedMovetimeMs as number) > 0));
}

function endgame(value: unknown): boolean {
  const item = record(value);
  if (item === undefined || !closed(item, ["type", "techniques", "provenanceNote"]) || !text(item.provenanceNote) || !Array.isArray(item.techniques)) return false;
  if (item.type !== null) {
    const type = record(item.type);
    if (type === undefined
      || !closed(type, ["id", "label"])
      || !new Set(["pawn", "rook-and-pawn-vs-rook", "rook", "queen", "minor"]).has(String(type.id))
      || !text(type.label)) return false;
  }
  return item.techniques.every((value) => {
    const technique = record(value);
    const provenance = record(technique?.provenance);
    return technique !== undefined
      && closed(technique, ["id", "name", "forSide", "provenance", "shapeEntryId"])
      && new Set(["lucena", "philidor", "vancura"]).has(String(technique.id))
      && text(technique.name)
      && (technique.forSide === "attacker" || technique.forSide === "defender")
      && provenance !== undefined
      && closed(provenance, ["note"])
      && text(provenance.note)
      && text(technique.shapeEntryId);
  });
}

function moment(value: unknown): value is GameStory["moments"][number] {
  const item = record(value);
  if (item === undefined
    || !closed(item, ["nodeId", "entryNodeId", "ply", "san", "fen", "kinds", "sentences", "evidence", "evalBefore", "evalAfter", "phase", "endgame"])
    || !text(item.nodeId)
    || !text(item.entryNodeId)
    || !natural(item.ply)
    || !(item.san === null || text(item.san))
    || !validFen(item.fen)
    || !Array.isArray(item.kinds)
    || item.kinds.length === 0
    || item.kinds.some((kind) => typeof kind !== "string" || !STORY_KINDS.has(kind))
    || new Set(item.kinds).size !== item.kinds.length
    || !Array.isArray(item.sentences)
    || item.sentences.some((sentence) => !text(sentence))
    || new Set(item.sentences).size !== item.sentences.length
    || !Array.isArray(item.evidence)
    || !item.evidence.every(evidence)
    || !PHASES.has(String(item.phase))
    || (item.endgame !== undefined && !endgame(item.endgame))) return false;
  const hasBefore = item.evalBefore !== undefined;
  const hasAfter = item.evalAfter !== undefined;
  if (hasBefore !== hasAfter || (hasBefore && (!evaluation(item.evalBefore) || !evaluation(item.evalAfter)))) return false;
  try {
    const rendered = renderSerializedReviewStoryEvidence(item.evidence);
    const sentences = item.sentences as string[];
    return rendered.length === sentences.length && rendered.every((sentence, index) => sentence === sentences[index]);
  } catch {
    return false;
  }
}

function source(value: unknown): value is GameStory["source"] {
  const item = record(value);
  if (item === undefined || !text(item.kind)) return false;
  if (item.kind === "native") return closed(item, ["kind"]);
  if (item.kind !== "pgn_paste" && item.kind !== "lichess_url") return false;
  if (!closed(item, ["kind", "url", "headers", "result", "importedAt"])
    || !stringRecord(item.headers)
    || !PGN_RESULTS.has(String(item.result))
    || !instant(item.importedAt)) return false;
  if (item.kind === "pgn_paste") return item.url === undefined;
  if (!text(item.url)) return false;
  try {
    const parsed = new URL(item.url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function outcome(value: unknown, storySource: GameStory["source"]): value is GameStory["outcome"] {
  const item = record(value);
  if (item === undefined || !text(item.kind)) return false;
  if (item.kind === "unfinished") return closed(item, ["kind"]);
  if (item.kind === "board_terminal") {
    return closed(item, ["kind", "result"]) && RUN_RESULTS.has(String(item.result));
  }
  return item.kind === "recorded_result"
    && storySource.kind !== "native"
    && closed(item, ["kind", "result"])
    && item.result !== "*"
    && PGN_RESULTS.has(String(item.result));
}

export function assertGameStoryResponse(
  value: unknown,
  request: { readonly runId: string; readonly branchId?: string },
): asserts value is GameStory {
  const item = record(value);
  if (item === undefined
    || !closed(item, ["runId", "ready", "pendingEvidence", "branchId", "side", "source", "outcome", "moments", "rank", "evidence"])
    || item.runId !== request.runId
    || !text(item.branchId)
    || (request.branchId !== undefined && item.branchId !== request.branchId)
    || (item.side !== "white" && item.side !== "black")
    || typeof item.ready !== "boolean"
    || !natural(item.pendingEvidence)
    || item.ready !== (item.pendingEvidence === 0)
    || !source(item.source)
    || !outcome(item.outcome, item.source)
    || !Array.isArray(item.moments)
    || !item.moments.every(moment)
    || !Array.isArray(item.rank)
    || item.rank.some((nodeId) => !text(nodeId))
    || (item.evidence !== undefined && (!Array.isArray(item.evidence) || !item.evidence.every(evidence)))) {
    throw new TypeError("Invalid game story response");
  }
  const momentIds = item.moments.map((entry) => entry.nodeId);
  if (new Set(momentIds).size !== momentIds.length
    || new Set(item.rank).size !== item.rank.length
    || item.rank.length !== momentIds.length
    || item.rank.some((nodeId) => !momentIds.includes(nodeId))) throw new TypeError("Invalid game story response");
  for (let index = 1; index < item.moments.length; index += 1) {
    const previous = item.moments[index - 1]!;
    const current = item.moments[index]!;
    if (current.ply < previous.ply || (current.ply === previous.ply && current.nodeId.localeCompare(previous.nodeId) < 0)) {
      throw new TypeError("Invalid game story response");
    }
  }
}

function storyShare(value: unknown, runId: string): value is StoryShare {
  const item = record(value);
  return item !== undefined
    && closed(item, ["id", "scope", "runId", "branchId", "createdAt", "revokedAt"])
    && text(item.id)
    && item.scope === "story_read"
    && item.runId === runId
    && text(item.branchId)
    && instant(item.createdAt)
    && (item.revokedAt === null || (instant(item.revokedAt) && Date.parse(item.revokedAt) >= Date.parse(item.createdAt)));
}

export function assertStoryShares(value: unknown, runId: string): asserts value is readonly StoryShare[] {
  if (!Array.isArray(value) || !value.every((item) => storyShare(item, runId))) throw new TypeError("Invalid story share response");
  if (new Set(value.map((item) => item.id)).size !== value.length) throw new TypeError("Invalid story share response");
}

export function assertCreatedStoryShare(
  value: unknown,
  request: { readonly runId: string; readonly branchId: string },
): asserts value is CreatedStoryShare {
  const item = record(value);
  if (item === undefined
    || !closed(item, ["id", "token", "url", "scope", "runId", "branchId", "createdAt", "revokedAt"])
    || !text(item.id)
    || !text(item.token)
    || item.url !== `/shared/${item.token}`
    || item.scope !== "story_read"
    || item.runId !== request.runId
    || item.branchId !== request.branchId
    || !instant(item.createdAt)
    || item.revokedAt !== null) throw new TypeError("Invalid created story share response");
}

export function assertRevokedStoryShare(
  value: unknown,
  request: { readonly runId: string; readonly tokenId: string },
): asserts value is RevokedStoryShare {
  const item = record(value);
  if (item === undefined
    || !closed(item, ["revoked", "runId", "tokenId", "revokedAt"])
    || item.revoked !== true
    || item.runId !== request.runId
    || item.tokenId !== request.tokenId
    || !instant(item.revokedAt)) throw new TypeError("Invalid revoked story share response");
}
