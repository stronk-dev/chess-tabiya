import { createHash } from "node:crypto";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import type { DrillRun, Node, StoredClockDocument, ClockSampleIssue, RecordedClockSample } from "@chess-tabiya/runtime";
import { positionFromFen, canonicalFen } from "../../../packages/runtime/src/position-cache.js";
import { parseUci } from "chessops/util";
import { resolveBranchPath } from "../../../packages/runtime/src/branch-path.js";
import { IMPORT_PGN_MAX_BYTES, parseRecordedClockGame, PgnImportError, type ParsedRecordedClockGame } from "./pgn-import.js";

interface ClockRecord { readonly pgn: string; readonly movetextDigest: string }
class ClockImportIdentityError extends TypeError {}
export function recordedMovetextDigest(game: ParsedRecordedClockGame["game"]): string {
  return `sha256:${createHash("sha256").update(canonicalizeJson({ rootFen: game.rootFen, uci: game.moves.map(move => move.uci) })).digest("hex")}`;
}

/** Initial immutable import event prefix, never a same-looking later branch or numeric ply. */
export function originalImportNodes(run: DrillRun, parsed: ParsedRecordedClockGame): readonly Node[] {
  const first = run.events[0];
  if (run.sessionKind !== "imported" || first?.type !== "run.started" || first.data.sessionKind !== "imported"
    || first.data.rootNode.fen !== parsed.game.rootFen) throw new ClockImportIdentityError("Clock document has no exact original import root");
  const original = resolveBranchPath(run, first.data.branch.id);
  if (original.kind === "refused") throw new ClockImportIdentityError(`Clock original branch is unresolved: ${original.reason}`);
  const mainline = original.nodes;
  // The immutable session digest pins the complete ORIGINAL import. Later below-service
  // extension is a recorded-operation refusal, not corruption of its retained original facts.
  if (mainline.length < parsed.moves.length + 1) throw new ClockImportIdentityError("Clock original imported mainline is missing nodes");
  const sessionDigest = `sha256:${createHash("sha256").update(canonicalizeJson({ kind: "imported", start: first.data.start,
    movetextDigest: recordedMovetextDigest(parsed.game), feedbackPolicy: "attempt_end", opponentPolicy: first.data.opponentPolicy })).digest("hex")}`;
  if (run.sessionDigest !== sessionDigest || first.data.sessionDigest !== sessionDigest) throw new ClockImportIdentityError("Clock source differs from the original imported session");
  const nodes: Node[] = [first.data.rootNode];
  const identityFields = ["id", "parentId", "fen", "transposeKey", "moveUci", "moveSan", "ply", "actor", "branchId", "createdAt"] as const;
  const root = run.nodes.find(node => node.id === first.data.rootNode.id);
  if (root === undefined || identityFields.some(key => root[key] !== first.data.rootNode[key])) throw new ClockImportIdentityError("Clock original root identity differs");
  const position = positionFromFen(parsed.game.rootFen);
  for (const [index, move] of parsed.moves.entries()) {
    const event = run.events[index + 1];
    if (event?.type !== "move.committed") throw new ClockImportIdentityError("Clock document has no uninterrupted original import prefix");
    const node = event.data.node, predecessor = nodes.at(-1)!;
    const legal = parseUci(move.moveUci);
    if (move.side !== position.turn || legal === undefined || !position.isLegal(legal)) throw new ClockImportIdentityError("Clock original move is not legal");
    position.play(legal);
    const current = run.nodes.find(candidate => candidate.id === node.id);
    if (mainline[index + 1]?.id !== node.id || node.parentId !== predecessor.id || node.moveUci !== move.moveUci || node.fen !== canonicalFen(position)
      || current === undefined || identityFields.some(key => current[key] !== node[key])) {
      throw new ClockImportIdentityError("Clock document original event/node/move join differs");
    }
    nodes.push(node);
  }
  return Object.freeze(nodes);
}

function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).sort().join("\0") !== [...keys].sort().join("\0")) throw new TypeError("Invalid closed recorded clock document");
  return value as Record<string, unknown>;
}
function safe(value: unknown, minimum = 0): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) throw new TypeError("Invalid recorded clock integer");
  return value;
}
function list(value: unknown, bound: number): readonly unknown[] {
  if (!Array.isArray(value) || value.length > bound) throw new TypeError("Invalid bounded recorded clock list");
  return value;
}

/** Closed numeric storage grammar; run joins are checked when a replayable run is available. */
export function parseStoredClockDocument(value: unknown, record: ClockRecord, run?: DrillRun): StoredClockDocument {
  const candidate = object(value, (value as { status?: unknown } | null)?.status === "ready"
    ? ["version", "status", "retention", "movetextDigest", "originalNodeIds", "samples", "issues"]
    : ["version", "status", "retention", "movetextDigest", "reason"]);
  if (candidate.version !== 1 || candidate.movetextDigest !== record.movetextDigest || !/^sha256:[a-f0-9]{64}$/u.test(record.movetextDigest)) throw new TypeError("Clock document version/import digest differs");
  if (candidate.status === "unavailable") {
    if (candidate.retention !== "legacy_stored_pgn" || typeof candidate.reason !== "string" || !["invalid_stored_pgn", "original_import_identity_unresolved", "source_too_large"].includes(candidate.reason)) throw new TypeError("Invalid unavailable clock document");
    return Object.freeze({ version: 1, status: "unavailable", retention: "legacy_stored_pgn", movetextDigest: record.movetextDigest, reason: candidate.reason as Extract<StoredClockDocument, { status: "unavailable" }>["reason"] });
  }
  if (candidate.status !== "ready" || typeof candidate.retention !== "string" || !["extracted_before_strip", "legacy_stored_pgn"].includes(candidate.retention)) throw new TypeError("Invalid ready clock retention");
  // Bound every list before parsing/iterating its members, including hostile restore input.
  const ids = list(candidate.originalNodeIds, 301), sampleRows = list(candidate.samples, 300), issueRows = list(candidate.issues, 301);
  const parsed = parseRecordedClockGame(record.pgn, { requireMoves: true });
  if (recordedMovetextDigest(parsed.game) !== record.movetextDigest || ids.length !== parsed.moves.length + 1
    || ids.some(id => typeof id !== "string" || id.length === 0) || new Set(ids).size !== ids.length) throw new TypeError("Clock document original move mapping differs");
  const originalNodeIds = Object.freeze(ids as readonly string[]);
  if (run !== undefined && canonicalizeJson(originalImportNodes(run, parsed).map(node => node.id)) !== canonicalizeJson(originalNodeIds)) throw new TypeError("Clock document original node mapping differs");
  let last = 0;
  const samples = Object.freeze(sampleRows.map(row => {
    const sample = object(row, ["sourcePly", "side", "moveUci", "remainingMs"]), sourcePly = safe(sample.sourcePly, 1);
    const move = parsed.moves[sourcePly - 1];
    if (sourcePly <= last || move === undefined || sample.side !== move.side || sample.moveUci !== move.moveUci) throw new TypeError("Clock sample move identity/order differs");
    last = sourcePly;
    return Object.freeze({ ...move, remainingMs: safe(sample.remainingMs) }) satisfies RecordedClockSample;
  }));
  last = -1;
  const issues = Object.freeze(issueRows.map(row => {
    const issue = object(row, ["sourcePly", "reason"]), sourcePly = safe(issue.sourcePly);
    if (sourcePly <= last || sourcePly > parsed.moves.length || samples.some(sample => sample.sourcePly === sourcePly)
      || typeof issue.reason !== "string" || !(sourcePly === 0 ? issue.reason === "unassigned_root_clock" : ["invalid_clock", "duplicate_clock", "unsupported_precision", "unsafe_operand"].includes(issue.reason))) throw new TypeError("Clock issue location/reason/order differs");
    last = sourcePly;
    return Object.freeze({ sourcePly, reason: issue.reason as ClockSampleIssue["reason"] });
  }));
  return Object.freeze({ version: 1, status: "ready", retention: candidate.retention as "extracted_before_strip" | "legacy_stored_pgn", movetextDigest: record.movetextDigest, originalNodeIds, samples, issues });
}

export function createStoredClockDocument(parsed: ParsedRecordedClockGame, run: DrillRun, originalNodeIds: readonly string[], movetextDigest: string, retention: "extracted_before_strip" | "legacy_stored_pgn"): StoredClockDocument {
  // The actual original extraction is numeric and immutable; no annotation bytes are retained.
  const document = { version: 1, status: "ready", retention, movetextDigest, originalNodeIds, samples: parsed.samples, issues: parsed.issues };
  if (recordedMovetextDigest(parsed.game) !== movetextDigest || canonicalizeJson(originalImportNodes(run, parsed).map(node => node.id)) !== canonicalizeJson(originalNodeIds)) throw new TypeError("Clock extraction original import join differs");
  return Object.freeze({ ...document, version: 1, status: "ready", originalNodeIds: Object.freeze([...originalNodeIds]) });
}

/** Terminal source failures are recorded; unexpected internal failures propagate and leave null. */
export function legacyStoredClockDocument(record: ClockRecord, run: DrillRun): StoredClockDocument {
  const unavailable = (reason: Extract<StoredClockDocument, { status: "unavailable" }>["reason"]): StoredClockDocument => Object.freeze({ version: 1, status: "unavailable", retention: "legacy_stored_pgn", movetextDigest: record.movetextDigest, reason });
  if (new TextEncoder().encode(record.pgn).byteLength > IMPORT_PGN_MAX_BYTES) return unavailable("source_too_large");
  let parsed;
  try { parsed = parseRecordedClockGame(record.pgn, { requireMoves: true }); }
  catch (error) { if (error instanceof PgnImportError) return unavailable("invalid_stored_pgn"); throw error; }
  let nodes;
  try { nodes = originalImportNodes(run, parsed); }
  catch (error) { if (error instanceof ClockImportIdentityError) return unavailable("original_import_identity_unresolved"); throw error; }
  if (recordedMovetextDigest(parsed.game) !== record.movetextDigest) return unavailable("original_import_identity_unresolved");
  return createStoredClockDocument(parsed, run, nodes.map(node => node.id), record.movetextDigest, "legacy_stored_pgn");
}
