// Recorded scope only: the server still owns current access and publication permission.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { branchPath } from "./branch-path.js";
import { canonicalFen, positionFromFen } from "./chess.js";
import { assertDeclaredEvidence, evidenceDigest, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { moduleDecisionStamp, type ModuleDecisionStamp } from "./module-decision.js";
import { recordedEdgePayload } from "./recorded-edge.js";
import { readBackReplay } from "./replay.js";
import { digestRunEventHead } from "./run-subject-digest.js";
import type { DrillRun, MoveCommittedEvent, Node, RunStartedEvent } from "./types.js";

declare const recordedComparisonBrand: unique symbol;
export interface RecordedComparisonSource { readonly [recordedComparisonBrand]: true }
export interface RecordedComparisonColumn { readonly branchId: string; readonly throughNodeId: string }
export interface RecordedComparisonPathEntry {
  readonly node: Node;
  readonly creationEventOrdinal: number;
  readonly creationEvent: RunStartedEvent | MoveCommittedEvent;
}
export interface RecordedComparisonPath {
  readonly runId: string;
  readonly headSeq: number;
  readonly branchId: string;
  readonly forkNodeId: string;
  readonly throughNodeId: string;
  readonly nodes: readonly RecordedComparisonPathEntry[];
}
interface ComparisonAuthority {
  readonly operation: "recorded-comparison-source@1";
  readonly runId: string;
  readonly eventHeadDigest: string;
  readonly decision: ModuleDecisionStamp;
  readonly columns: readonly [RecordedComparisonColumn, RecordedComparisonColumn];
  readonly paths: readonly [readonly RecordedComparisonPathEntry[], readonly RecordedComparisonPathEntry[]];
  readonly forkNodeId: string;
}
interface ComparisonData {
  readonly run: DrillRun;
  readonly authority: ComparisonAuthority;
}
const sources = new WeakMap<object, ComparisonData>();
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
    && Reflect.ownKeys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
function column(value: unknown): RecordedComparisonColumn {
  if (!exact(value, ["branchId", "throughNodeId"])) throw new TypeError("Comparison column must be exactly {branchId,throughNodeId}");
  const { branchId, throughNodeId } = value;
  if (typeof branchId !== "string" || branchId.length === 0 || typeof throughNodeId !== "string" || throughNodeId.length === 0) throw new TypeError("Comparison column identities must be nonempty strings");
  return { branchId, throughNodeId };
}

/** Validate both complete original paths before locating either endpoint or computing facts. */
export function createRecordedComparisonSource(input: Readonly<{
  run: DrillRun;
  columns: readonly [RecordedComparisonColumn, RecordedComparisonColumn];
}>): RecordedComparisonSource {
  if (!exact(input, ["run", "columns"])) throw new TypeError("Recorded comparison requires exactly {run,columns}");
  const rawColumns = input.columns;
  if (!Array.isArray(rawColumns) || rawColumns.length !== 2) throw new TypeError("Recorded comparison requires exactly two columns");
  const columns: [RecordedComparisonColumn, RecordedComparisonColumn] = [column(rawColumns[0]), column(rawColumns[1])];
  if (columns[0].branchId === columns[1].branchId) throw new TypeError("Recorded comparison branches must be distinct");
  const run = structuredClone(input.run);
  // Canonical event parsing and actual replay must agree with the entire original stored image.
  const eventHeadDigest = digestRunEventHead({ runId: run.id, headSeq: run.events.length, events: run.events });
  const replay = readBackReplay(run.events).run;
  if (canonicalizeJson(run) !== canonicalizeJson(replay)) throw new TypeError("Recorded comparison snapshot disagrees with its event replay");
  const originalPaths = columns.map(value => branchPath(run, value.branchId));
  for (const path of originalPaths) for (const node of path) {
    if (canonicalFen(positionFromFen(node.fen)) !== node.fen) throw new TypeError(`Recorded comparison node ${node.id} FEN is not canonical`);
  }
  const creations = new Map<string, RecordedComparisonPathEntry[]>();
  for (const [creationEventOrdinal, event] of run.events.entries()) {
    if (event.type !== "run.started" && event.type !== "move.committed") continue;
    const node = event.type === "run.started" ? event.data.rootNode : event.data.node;
    const entry = { node, creationEventOrdinal, creationEvent: event };
    creations.set(node.id, [...(creations.get(node.id) ?? []), entry]);
  }
  const paths = originalPaths.map(path => path.map((node, index): RecordedComparisonPathEntry => {
    const matches = creations.get(node.id);
    if (matches?.length !== 1 || identityFields.some(key => matches[0]!.node[key] !== node[key])) throw new TypeError(`Recorded comparison node ${node.id} has no unique exact creation event`);
    if (index > 0) recordedEdgePayload(run, path[index - 1]!, node);
    return { node, creationEventOrdinal: matches[0]!.creationEventOrdinal, creationEvent: matches[0]!.creationEvent };
  }));
  // Every original graph, FEN, edge and creation join above is checked before either narrowing.
  const granted = columns.map((value, index) => {
    const path = paths[index]!, endpoint = path.findIndex(entry => entry.node.id === value.throughNodeId);
    const branch = run.branches.find(entry => entry.id === value.branchId)!;
    const ownFork = path.findIndex(entry => entry.node.id === branch.forkNodeId);
    if (endpoint < ownFork || endpoint < 0) throw new TypeError("Comparison endpoint is absent or precedes its attempt's fork");
    return path.slice(0, endpoint + 1);
  });
  let forkNodeId: string | undefined;
  for (let index = 0; index < Math.min(granted[0]!.length, granted[1]!.length); index++) {
    if (granted[0]![index]!.node.id !== granted[1]![index]!.node.id) break;
    forkNodeId = granted[0]![index]!.node.id;
  }
  if (forkNodeId === undefined) throw new TypeError("Recorded comparison paths have no common fork");
  const authority: ComparisonAuthority = { operation: "recorded-comparison-source@1", runId: run.id, eventHeadDigest,
    decision: moduleDecisionStamp(run), columns, paths: [granted[0]!, granted[1]!], forkNodeId };
  const source = Object.freeze({}) as RecordedComparisonSource;
  sources.set(source, freeze({ run, authority }));
  return source;
}

export function isRecordedComparisonSource(value: unknown): value is RecordedComparisonSource {
  return value !== null && typeof value === "object" && sources.has(value);
}
/** Package-internal reader; absent from the public barrel and every wire representation. */
export function recordedComparisonData(source: RecordedComparisonSource): ComparisonData {
  if (!isRecordedComparisonSource(source)) throw new TypeError("Recorded comparison source was not issued by its owner");
  return sources.get(source)!;
}
export function recordedComparisonColumn(source: RecordedComparisonSource, branchId: string) {
  const data = recordedComparisonData(source), index = data.authority.columns.findIndex(value => value.branchId === branchId);
  if (index < 0) throw new TypeError("Branch is not a granted comparison column");
  return { ...data, column: data.authority.columns[index]!, path: data.authority.paths[index]! };
}
export function recordedComparisonPathValue(source: RecordedComparisonSource, branchId: string): RecordedComparisonPath {
  const { authority, column, path } = recordedComparisonColumn(source, branchId);
  return { runId: authority.runId, headSeq: authority.decision.eventHeadSeq, branchId,
    forkNodeId: authority.forkNodeId, throughNodeId: column.throughNodeId,
    nodes: path.slice(path.findIndex(entry => entry.node.id === authority.forkNodeId)) };
}
export function assertRecordedComparisonPath(source: RecordedComparisonSource, branchId: string, path: DeclaredEvidence<RecordedComparisonPath>): void {
  const { authority } = recordedComparisonColumn(source, branchId);
  assertDeclaredEvidence(path);
  const receipt = evidenceValueReceipt(path);
  if (path.projection.id !== "run.record.comparison_path" || path.projection.version !== 1 || receipt.factory !== "createRunRecordComparisonPathV1Evidence"
    || receipt.inputDigest !== evidenceDigest({ comparison: authority, branchId })
    || evidenceDigest(path.payload) !== evidenceDigest(recordedComparisonPathValue(source, branchId))) throw new TypeError("Comparison path is not the exact owned column/head/endpoint source");
}
