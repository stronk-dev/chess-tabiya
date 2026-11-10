// Installed-opening §3a. Captured ancestry only; the service owns access/publication permission.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { branchPaths } from "./branch-path.js";
import { canonicalFen, positionFromFen } from "./chess.js";
import type { DeclaredEvidence } from "./evidence-contract.js";
import { isInstalledOpeningCatalogue, type InstalledOpeningCatalogue } from "./opening-catalogue.js";
import { recordedEdgePayload } from "./recorded-edge.js";
import { readBackReplay } from "./replay.js";
import { digestRunEventHead } from "./run-subject-digest.js";
import type { RecordedPosition } from "./review-points.js";
import type { DrillRun, Node } from "./types.js";
import { assertRecordedPositionInvocation, invokeEvidenceValueRoute, readRecordedOpeningPointResult } from "./internal/evidence-value-routes.js";
import { readRecordedOpeningLookup } from "./internal/recorded-opening-lookup.js";

declare const historyBrand: unique symbol;
export interface RecordedOpeningHistorySource { readonly [historyBrand]: true }
interface HistoryInput {
  readonly source: InstalledOpeningCatalogue;
  readonly run: DrillRun;
  readonly branchId: string;
  readonly throughNodeId: string;
}
type PointResult = Extract<ReturnType<typeof invokeEvidenceValueRoute<"theory.opening.current_endpoint@1">>, { kind: "available" }>["value"];
interface HistoryRow {
  readonly pathIndex: number;
  readonly node: Node;
  readonly edge: ReturnType<typeof recordedEdgePayload> | null;
  readonly position: DeclaredEvidence<RecordedPosition>;
  readonly endpoints: PointResult;
  readonly memberships: PointResult;
  readonly invocation: ReturnType<typeof readRecordedOpeningPointResult>["invocation"];
  readonly lookup: ReturnType<typeof readRecordedOpeningLookup>["lookup"];
}
interface HistoryData {
  readonly source: InstalledOpeningCatalogue;
  readonly run: DrillRun;
  readonly authority: Readonly<{
    operation: "recorded-opening-history@1";
    runId: string;
    eventHead: ReturnType<typeof digestRunEventHead>;
    branchId: string;
    throughNodeId: string;
    catalogue: InstalledOpeningCatalogue["ref"];
    path: readonly Readonly<{ node: Node; edge: HistoryRow["edge"] }>[];
  }>;
  readonly rows: readonly HistoryRow[];
}
const histories = new WeakMap<object, HistoryData>();
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Full original graph validation precedes endpoint selection and every lookup/point call. */
export function collectRecordedOpeningHistory(input: HistoryInput): RecordedOpeningHistorySource {
  const keys = ["source", "run", "branchId", "throughNodeId"];
  if (input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype
    || Reflect.ownKeys(input).length !== keys.length || !keys.every(key => {
      const field = Object.getOwnPropertyDescriptor(input, key);
      return field !== undefined && field.enumerable && "value" in field;
    })) throw new TypeError("Recorded opening history requires exactly {source,run,branchId,throughNodeId}");
  const { source, branchId, throughNodeId } = input;
  if (!isInstalledOpeningCatalogue(source)) throw new TypeError("Opening history requires the original admitted installed source");
  if (typeof branchId !== "string" || branchId.length === 0 || typeof throughNodeId !== "string" || throughNodeId.length === 0) throw new TypeError("Opening history requires exact branch/through-node identities");
  const run = structuredClone(input.run);
  const eventHead = digestRunEventHead({ runId: run.id, headSeq: run.events.length, events: run.events });
  if (canonicalizeJson(run) !== canonicalizeJson(readBackReplay(run.events).run)) throw new TypeError("Opening history snapshot disagrees with its canonical event replay");
  const paths = branchPaths(run), branchIds = new Set(run.branches.map(branch => branch.id));
  const nodes = new Map(run.nodes.map(node => [node.id, node])), edges = new Map<string, ReturnType<typeof recordedEdgePayload>>();
  const creations = new Map<string, Node[]>();
  for (const event of run.events) if (event.type === "run.started" || event.type === "move.committed") {
    const node = event.type === "run.started" ? event.data.rootNode : event.data.node;
    creations.set(node.id, [...(creations.get(node.id) ?? []), node]);
  }
  for (const node of run.nodes) {
    if (!branchIds.has(node.branchId) || !paths.get(node.branchId)?.some(value => value === node)) throw new TypeError("Opening history node is outside its registered branch graph");
    if (canonicalFen(positionFromFen(node.fen)) !== node.fen) throw new TypeError("Opening history node FEN is not canonical");
    const created = creations.get(node.id);
    // Evidence/checkpoint/objective fields are projections of later validated events. The full
    // snapshot/replay equality above still checks them; creation joins only immutable identity.
    const identity = ["id", "parentId", "fen", "transposeKey", "moveUci", "moveSan", "ply", "actor", "branchId", "createdAt"] as const;
    if (created?.length !== 1 || identity.some(key => created[0]![key] !== node[key])) throw new TypeError("Opening history node has no unique exact creation event");
    if (node.parentId !== null) {
      const parent = nodes.get(node.parentId);
      if (parent === undefined) throw new TypeError("Opening history edge has no original parent");
      edges.set(node.id, recordedEdgePayload(run, parent, node));
    }
  }
  if (creations.size !== nodes.size) throw new TypeError("Opening history event graph has an unrecorded node");
  const path = paths.get(branchId), throughIndex = path?.findIndex(node => node.id === throughNodeId) ?? -1;
  if (path === undefined || throughIndex < 0) throw new TypeError("Opening history endpoint is unknown or off the selected branch");
  const prefix = path.slice(0, throughIndex + 1);
  freeze(run);
  const rows = prefix.map((node, pathIndex): HistoryRow => {
    const position = invokeEvidenceValueRoute("run.record.position@1", { run, nodeId: node.id });
    assertRecordedPositionInvocation(position, run, node.id);
    const pointInput = { source, position };
    const endpointResult = invokeEvidenceValueRoute("theory.opening.current_endpoint@1", pointInput);
    const membershipResult = invokeEvidenceValueRoute("theory.opening.catalogue_membership@1", pointInput);
    if (endpointResult.kind !== "available" || membershipResult.kind !== "available") throw new TypeError("Admitted opening history lookup did not execute successfully");
    const endpoint = readRecordedOpeningPointResult(endpointResult.value, pointInput, "theory.opening.current_endpoint@1");
    const membership = readRecordedOpeningPointResult(membershipResult.value, pointInput, "theory.opening.catalogue_membership@1");
    if (endpoint.invocation !== membership.invocation) throw new TypeError("Opening history point arrays cross paired invocations");
    return freeze({ pathIndex, node, edge: edges.get(node.id) ?? null, position, endpoints: endpointResult.value, memberships: membershipResult.value,
      invocation: endpoint.invocation, lookup: endpoint.lookup });
  });
  const history = Object.freeze({}) as RecordedOpeningHistorySource;
  histories.set(history, freeze({ source, run, authority: { operation: "recorded-opening-history@1", runId: run.id, eventHead,
    branchId, throughNodeId, catalogue: source.ref, path: rows.map(row => ({ node: row.node, edge: row.edge })) }, rows }));
  readRecordedOpeningHistory(history);
  return history;
}
export function isRecordedOpeningHistorySource(value: unknown): value is RecordedOpeningHistorySource {
  return value !== null && typeof value === "object" && histories.has(value);
}
/** Private reader; never exported through a barrel or serialized as a grant. */
export function readRecordedOpeningHistory(history: RecordedOpeningHistorySource): HistoryData {
  const data = isRecordedOpeningHistorySource(history) ? histories.get(history)! : undefined;
  if (data === undefined) throw new TypeError("Recorded opening history is not its original privately issued source");
  for (const row of data.rows) {
    const input = { source: data.source, position: row.position };
    const endpoint = readRecordedOpeningPointResult(row.endpoints, input, "theory.opening.current_endpoint@1");
    const membership = readRecordedOpeningPointResult(row.memberships, input, "theory.opening.catalogue_membership@1");
    if (endpoint.invocation !== row.invocation || membership.invocation !== row.invocation
      || readRecordedOpeningLookup(row.invocation, data.source, row.position).lookup !== row.lookup) throw new TypeError("Opening history lost its original row lookup authority");
  }
  return data;
}
