// Accepted module-registration §4.11a: exact recorded scope, never server access authority.
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertDeclaredEvidence, evidenceDigest, evidenceValueReceipt, type DeclaredEvidence, type VersionedEvidenceId } from "./evidence-contract.js";
import { EvidenceValueRouteLookupError, invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { moduleDecisionStamp } from "./module-decision.js";
import { RecordedEdgeError } from "./recorded-edge.js";
import { recordedPathConventionReceipt, type RecordedPathConventionReceipt, type RecordedPathRefusalReason, type RecordedPathWindowReceipt, type RecordedPathHorizon } from "./recorded-semantic-path.js";
import { prepareRecordedSemanticWindows, readRecordedSequenceWindow, recordedSequenceWindowInputs, recordedSequenceWindowValueAuthority, RecordedSequenceScopeError, RECORDED_SEQUENCE_HORIZONS, type RecordedSequenceWindow, type RecordedWindowRoute, type RecordedSequenceRoute } from "./recorded-sequence-window.js";
import { compileSemanticEvidenceEvent, type SemanticEvidenceEvent } from "./semantic-evidence.js";
import { positionFromFen } from "./chess.js";
import type { DrillRun } from "./types.js";

export interface RecordedSemanticWindowScope { readonly runId: string; readonly branchId: string; readonly throughNodeId: string; readonly projection: VersionedEvidenceId }
export type RecordedSemanticWindowResult =
  | Readonly<{ kind: "window_available"; scope: RecordedSemanticWindowScope; events: readonly SemanticEvidenceEvent[]; windows: readonly RecordedPathWindowReceipt[]; omittedHorizons: readonly number[]; conventionReceipt: RecordedPathConventionReceipt; identity: string }>
  | Readonly<{ kind: "window_missing"; scope: RecordedSemanticWindowScope; reason: "no_recorded_window"; requiredHorizons: readonly number[]; availablePrefixEdges: number }>
  | Readonly<{ kind: "window_refused"; reason: RecordedPathRefusalReason | "endpoint_not_on_branch" | "projection_unsupported" | "source_contract_invalid" | "source_lookup_failed" }>
  | Readonly<{ kind: "window_refused"; reason: "source_version_held"; dependency: string }>;

const refused = (reason: Exclude<Extract<RecordedSemanticWindowResult, { kind: "window_refused" }>["reason"], "source_version_held">): RecordedSemanticWindowResult => Object.freeze({ kind: "window_refused", reason });
function closed(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Reflect.ownKeys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

/** Actual event construction consumes the exact factory and its literal complete occurrence tuple. */
export function recordedSequenceWindowEvents(window: RecordedSequenceWindow, route: RecordedWindowRoute): readonly SemanticEvidenceEvent[] {
  const data = readRecordedSequenceWindow(window, route), last = data.edges.at(-1)!.payload;
  let values: readonly DeclaredEvidence<unknown>[], tuple: ((value: DeclaredEvidence<unknown>) => readonly DeclaredEvidence<unknown>[]);
  if (route === "derived.exchange.trade_completed@2") {
    const first = data.captures[0]?.[0], second = data.captures[1]?.[0];
    if (first === undefined || second === undefined) return Object.freeze([]);
    const inputs = [first, second, data.edges[0]!, data.edges[1]!] as const;
    values = invokeEvidenceValueRoute(route, { first, second, firstEdge: data.edges[0]!, secondEdge: data.edges[1]! });
    tuple = () => inputs;
  } else {
    values = invokeEvidenceValueRoute(route, { window });
    tuple = value => recordedSequenceWindowInputs(window, value.payload);
  }
  if (!Array.isArray(values)) throw new TypeError("Recorded window factory returned no population");
  return Object.freeze(values.map(value => {
    assertDeclaredEvidence(value);
    const expectedFactory = route === "derived.exchange.trade_completed@2" ? "createDerivedExchangeTradeCompletedV2Evidence"
      : `create${route.split("@")[0]!.split(/[._]/u).map(word => word[0]!.toUpperCase() + word.slice(1)).join("")}V3Evidence`;
    if (`${value.projection.id}@${value.projection.version}` !== route || evidenceValueReceipt(value).factory !== expectedFactory) throw new TypeError("Recorded window output came from another exact factory");
    const inputs = tuple(value), inputDigest = route === "derived.exchange.trade_completed@2"
      ? evidenceDigest(Object.fromEntries(["first", "second", "firstEdge", "secondEdge"].map((key, index) => [key, { sealed: evidenceValueReceipt(inputs[index]!).payloadDigest }])))
      : evidenceDigest(recordedSequenceWindowValueAuthority(window, value.payload, inputs));
    if (evidenceValueReceipt(value).inputDigest !== inputDigest) throw new TypeError("Recorded window output crosses the actual source head/grant/window");
    return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: value, derivationInputs: inputs, sign: "state", anchor: {
      beforeFen: last.beforeFen, moveUci: last.moveUci, afterFen: last.afterFen, side: positionFromFen(last.beforeFen).turn,
      runId: last.runId, branchId: last.edgeBranchId, nodeId: last.afterNodeId,
    } });
  }));
}

/** Closed private source result. It neither selects usefulness nor grants disclosure/publication. */
export function recordedSemanticWindowSource(input: Readonly<{ run: DrillRun; branchId: string; throughNodeId: string; projection: VersionedEvidenceId }>): RecordedSemanticWindowResult {
  if (!closed(input, ["run", "branchId", "throughNodeId", "projection"]) || !closed(input.projection, ["id", "version"])) return refused("projection_unsupported");
  const { branchId, throughNodeId } = input, projection = Object.freeze({ id: input.projection.id, version: input.projection.version });
  if (typeof projection.id !== "string" || typeof projection.version !== "number") return refused("projection_unsupported");
  const route = `${projection.id}@${projection.version}`;
  if (route !== "derived.exchange.trade_completed@2" && !Object.hasOwn(RECORDED_SEQUENCE_HORIZONS, route)) return refused("projection_unsupported");
  if (typeof branchId !== "string" || !branchId || typeof throughNodeId !== "string" || !throughNodeId) return refused("endpoint_not_on_branch");
  let sourcePrepared = false;
  try {
    const prepared = prepareRecordedSemanticWindows({ run: input.run, branchId, throughNodeId, route: route as RecordedWindowRoute });
    sourcePrepared = true;
    const scope = Object.freeze({ runId: prepared.run.id, branchId, throughNodeId, projection });
    const requiredHorizons = Object.freeze(route === "derived.exchange.trade_completed@2" ? [2] : [...RECORDED_SEQUENCE_HORIZONS[route as RecordedSequenceRoute]]);
    if (prepared.windows.length === 0) return Object.freeze({ kind: "window_missing", scope, reason: "no_recorded_window", requiredHorizons, availablePrefixEdges: prepared.availableEdges });
    const events: SemanticEvidenceEvent[] = [], windows: RecordedPathWindowReceipt[] = [];
    for (const window of prepared.windows) {
      const data = readRecordedSequenceWindow(window, route as RecordedWindowRoute), emitted = recordedSequenceWindowEvents(window, route as RecordedWindowRoute);
      events.push(...emitted);
      windows.push(Object.freeze({ projection, startNodeId: data.edges[0]!.payload.beforeNodeId, endNodeId: throughNodeId,
        horizon: data.authority.horizon as RecordedPathHorizon, status: emitted.length ? "emitted" : "no_witness", eventIds: Object.freeze(emitted.map(value => value.id)) }));
    }
    const conventionReceipt = recordedPathConventionReceipt(events);
    const identity = evidenceDigest({ operation: "recorded-semantic-window@1", manifestDigest: PRIMARY_EVIDENCE_MANIFEST.digest,
      scope, eventHeadDigest: prepared.eventHeadDigest, decision: moduleDecisionStamp(prepared.run), windows, omittedHorizons: prepared.omittedHorizons,
      conventionReceipt, events: events.map(value => ({ id: value.id, receipt: evidenceValueReceipt(value.evidence), inputs: value.derivationInputs.map(evidenceValueReceipt) })) });
    return Object.freeze({ kind: "window_available", scope, events: Object.freeze(events), windows: Object.freeze(windows), omittedHorizons: prepared.omittedHorizons, conventionReceipt, identity });
  } catch (error) {
    if (!sourcePrepared && (error instanceof RecordedSequenceScopeError || error instanceof RecordedEdgeError)) return refused(error.reason);
    if (error instanceof EvidenceValueRouteLookupError) return refused("source_lookup_failed");
    // The eleven currently implemented sources return populations, not version holds. Pending
    // metadata or a nested/forged availability cannot manufacture a genuine held-source outcome.
    return refused("source_contract_invalid");
  }
}
