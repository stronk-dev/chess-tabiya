// Review §4.5's storage boundary, below source collection and moment assembly. Package-internal:
// this is not the unfinished four-method RecordedReviewBoundaryAuthority public facade.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { sha256Hex } from "./assistance-exchange-digest.js";
import { branchPath } from "./branch-path.js";
import { importedMainlineBranchId } from "./branch-scale.js";
import { canonicalFen, positionFromFen } from "./chess.js";
import { recordedEdgePayload } from "./recorded-edge.js";
import { readBackReplay } from "./replay.js";
import { digestRunEventHead } from "./run-subject-digest.js";
import { presentationDigest } from "./presentation-contract.js";
import type { ReviewImportRecordImage, ReviewOutcomeReceipt, ReviewStorageAuthority } from "./review-evidence.js";
import type { DrillRun, MoveCommittedEvent, Node, RunStartedEvent } from "./types.js";

declare const recordedReviewBoundaryBrand: unique symbol;
export interface RecordedReviewBoundary { readonly [recordedReviewBoundaryBrand]: true }
interface BoundaryAddress { readonly runId: string; readonly branchId: string; readonly throughNodeId: string }
interface PathEntry {
  readonly node: Node;
  readonly creationEventOrdinal: number;
  readonly creationEvent: RunStartedEvent | MoveCommittedEvent;
}
interface BoundaryImage {
  readonly operation: "recorded-review-boundary@1";
  readonly request: BoundaryAddress;
  readonly eventHead: { readonly seq: number; readonly digest: string };
  /** The original storage image is never truncated to simulate an earlier event stream. */
  readonly run: DrillRun;
  readonly originalPath: readonly PathEntry[];
  readonly path: readonly PathEntry[];
  readonly learnerSide: "white" | "black";
  readonly importRecord: ReviewImportRecordImage | null;
  readonly importedMainlineEndNodeId: string | null;
  readonly outcome: ReviewOutcomeReceipt;
}
interface BoundaryData { readonly image: BoundaryImage; readonly assertCurrent: () => void }
const boundaries = new WeakMap<object, BoundaryData>();
const identityFields = ["id", "parentId", "fen", "transposeKey", "moveUci", "moveSan", "ply", "actor", "branchId", "createdAt"] as const;

function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
function exact(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && Reflect.ownKeys(value).length === keys.length
    && keys.every(key => Object.hasOwn(value, key) && Object.hasOwn(Object.getOwnPropertyDescriptor(value, key)!, "value"));
}
function address(value: unknown): BoundaryAddress {
  if (!exact(value, ["runId", "branchId", "throughNodeId"]) || ![value.runId, value.branchId, value.throughNodeId].every(entry => typeof entry === "string" && entry.length > 0)) {
    throw new TypeError("Recorded Review boundary requires exactly {runId,branchId,throughNodeId} nonempty identities");
  }
  return { runId: value.runId as string, branchId: value.branchId as string, throughNodeId: value.throughNodeId as string };
}
function importImage(value: unknown, run: DrillRun): ReviewImportRecordImage | null {
  if (value === undefined) {
    if (run.sessionKind === "imported") throw new TypeError("Imported Review run has no stored import record");
    return null;
  }
  if (run.sessionKind !== "imported" || !exact(value, ["runId", "result", "movetextDigest"])
    || value.runId !== run.id || !["*", "1-0", "0-1", "1/2-1/2"].includes(value.result as string)
    || typeof value.movetextDigest !== "string" || !/^sha256:[0-9a-f]{64}$/u.test(value.movetextDigest)) {
    throw new TypeError("Recorded Review import context is inconsistent or not the exact stored three-field image");
  }
  return { runId: value.runId as string, result: value.result as ReviewImportRecordImage["result"], movetextDigest: value.movetextDigest };
}

/** Resolve/check only: no semantic collectors, providers, access grants or fabricated packet. */
export function createRecordedReviewBoundarySourceOwner(storage: ReviewStorageAuthority): Readonly<{
  resolve(input: BoundaryAddress): RecordedReviewBoundary;
  assertCurrent(boundary: RecordedReviewBoundary): void;
}> {
  const loadRun = storage.loadRun, loadImportRecord = storage.loadImportRecord;
  if (typeof loadRun !== "function" || typeof loadImportRecord !== "function") throw new TypeError("Recorded Review requires its storage readers");
  const owned = new WeakSet<object>();
  const read = (request: BoundaryAddress): BoundaryImage => {
    const stored = loadRun(request.runId);
    if (stored === undefined || stored.id !== request.runId) throw new TypeError("Recorded Review run is not stored under the requested identity");
    // Clone before any freezing; neither storage-owned objects nor the caller request are backing
    // records. Full event parsing/replay and the original graph precede endpoint narrowing.
    const run = structuredClone(stored);
    const digest = digestRunEventHead({ runId: run.id, headSeq: run.events.length, events: run.events });
    if (canonicalizeJson(run) !== canonicalizeJson(readBackReplay(run.events).run)) throw new TypeError("Recorded Review snapshot disagrees with its complete event replay");
    const originalNodes = branchPath(run, request.branchId);
    const mainlineId = importedMainlineBranchId(run);
    const mainline = mainlineId === undefined ? null : branchPath(run, mainlineId);
    // Also validate the original imported path when the requested branch is a retry.
    for (const path of mainline === null ? [originalNodes] : [originalNodes, mainline]) for (const node of path) {
      if (canonicalFen(positionFromFen(node.fen)) !== node.fen) throw new TypeError(`Recorded Review node ${node.id} FEN is not canonical`);
    }
    const creations = new Map<string, PathEntry[]>();
    for (const [creationEventOrdinal, event] of run.events.entries()) {
      if (event.type !== "run.started" && event.type !== "move.committed") continue;
      const node = event.type === "run.started" ? event.data.rootNode : event.data.node;
      creations.set(node.id, [...(creations.get(node.id) ?? []), { node, creationEventOrdinal, creationEvent: event }]);
    }
    const validatePath = (nodes: readonly Node[]): readonly PathEntry[] => nodes.map((node, index) => {
      const matches = creations.get(node.id);
      if (matches?.length !== 1 || identityFields.some(key => matches[0]!.node[key] !== node[key])) throw new TypeError(`Recorded Review node ${node.id} has no unique exact creation event`);
      if (index > 0) recordedEdgePayload(run, nodes[index - 1]!, node);
      return { node, creationEventOrdinal: matches[0]!.creationEventOrdinal, creationEvent: matches[0]!.creationEvent };
    });
    const originalPath = validatePath(originalNodes);
    if (mainline !== null) validatePath(mainline);
    const record = importImage(structuredClone(loadImportRecord(run.id)), run);
    // The storage-owned import digest already identifies its immutable root+move sequence.
    // A lower-level runtime/storage writer can bypass RunService's no-extension guard; a legal
    // current mainline tip is not by itself the original imported endpoint (D3878).
    if (record !== null && mainline !== null && record.movetextDigest !== `sha256:${sha256Hex(canonicalizeJson({
      rootFen: mainline[0]!.fen, uci: mainline.slice(1).map(node => node.moveUci),
    }))}`) throw new TypeError("Recorded Review original imported mainline differs from its stored movetext digest");
    const endpoint = originalPath.findIndex(entry => entry.node.id === request.throughNodeId);
    if (endpoint < 0) throw new TypeError("Recorded Review endpoint is not on the original branch path");
    const path = originalPath.slice(0, endpoint + 1), ids = new Set(path.map(entry => entry.node.id));
    const terminal = [...run.events].reverse().find(event => event.type === "outcome.reached" && ids.has(event.data.nodeId));
    const importedMainlineEndNodeId = mainline?.at(-1)?.id ?? null;
    // A retry's inherited endpoint is legal scope, not permission to borrow the imported result.
    const eligible = record !== null && request.branchId === mainlineId && request.throughNodeId === importedMainlineEndNodeId && record.result !== "*";
    let outcome: ReviewOutcomeReceipt = { kind: "unfinished" };
    if (terminal?.type === "outcome.reached") {
      const result = record?.result;
      const importedOutcome = result === "1/2-1/2" ? "draw" : (result === "1-0") === (run.start.side === "white") ? "win" : "loss";
      if (eligible && importedOutcome !== terminal.data.outcome) throw new TypeError("Recorded Review imported result contradicts its on-prefix terminal");
      outcome = { kind: "board_terminal", eventSeq: terminal.seq, nodeId: terminal.data.nodeId, result: terminal.data.outcome };
    } else if (eligible) {
      outcome = { kind: "recorded_result", sourceDigest: presentationDigest("review.import-record@1", record), result: record.result };
    }
    return freeze({ operation: "recorded-review-boundary@1", request: { ...request }, eventHead: { seq: run.events.length, digest }, run,
      originalPath, path, learnerSide: run.start.side, importRecord: record, importedMainlineEndNodeId, outcome });
  };
  return Object.freeze({
    resolve(input: BoundaryAddress): RecordedReviewBoundary {
      const request = address(input), image = read(request);
      const boundary = Object.freeze({}) as RecordedReviewBoundary;
      boundaries.set(boundary, { image, assertCurrent: () => {
        if (canonicalizeJson(read(request)) !== canonicalizeJson(image)) throw new TypeError("Recorded Review boundary no longer matches its storage authority");
      } });
      owned.add(boundary);
      return boundary;
    },
    assertCurrent(boundary: RecordedReviewBoundary): void {
      if (!owned.has(boundary)) throw new TypeError("Recorded Review boundary belongs to a foreign issuer");
      readRecordedReviewBoundary(boundary);
    },
  });
}

export function isRecordedReviewBoundary(value: unknown): value is RecordedReviewBoundary {
  return typeof value === "object" && value !== null && boundaries.has(value);
}
/** Internal source/factory reader only; no barrel or wire export. Always checks live storage. */
export function readRecordedReviewBoundary(boundary: RecordedReviewBoundary): BoundaryImage {
  if (!isRecordedReviewBoundary(boundary)) throw new TypeError("Recorded Review boundary was not issued by its source owner");
  const data = boundaries.get(boundary)!;
  data.assertCurrent();
  return data.image;
}
