// Accepted §4.11a/F2: source-scoped Compare topics, not whole Compare compilation or permission.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { assertDeclaredEvidence } from "./evidence-contract.js";
import { collectComparisonStructuralPopulation, assertComparisonStructuralPopulationScope } from "./comparison-structural-population.js";
import { readComparisonReductionResult } from "./internal/comparison-reduction-authority.js";
import { invokeEvidenceValueRoute, readRecordedCompareEvalInvocation, type EvidenceValueRouteResults } from "./internal/evidence-value-routes.js";
import { createRecordedComparisonSource, recordedComparisonData, type RecordedComparisonColumn } from "./recorded-comparison.js";
import { recordedComparisonEvalTrail, type RecordedCompareEvalDeltaInput } from "./recorded-comparison-eval.js";
import { recordedInspectorPacketValue } from "./recorded-inspector.js";
import { resolveRunSubject, digestRunEvidenceItem } from "./run-subject.js";
import type { DrillRun } from "./types.js";
import type { RunEvidenceItem } from "./evidence-factories.js";

export type InspectorComparisonProjection = "derived.compare.structure_delta@2" | "derived.compare.eval_delta@2";
export function assertInspectorComparisonProjection(projection: unknown): asserts projection is InspectorComparisonProjection {
  if (projection !== "derived.compare.structure_delta@2" && projection !== "derived.compare.eval_delta@2") throw new TypeError("Unknown exact Inspector comparison topic");
}
type Comparison = ReturnType<typeof createRecordedComparisonSource>;
type StructuralResult = EvidenceValueRouteResults["derived.compare.structure_delta@2"];
interface EvalInvocation {
  readonly input: Readonly<RecordedCompareEvalDeltaInput>;
  readonly result: EvidenceValueRouteResults["derived.compare.eval_delta@2"];
  readonly proof: ReturnType<typeof readRecordedCompareEvalInvocation>;
}
type Outcome = Readonly<{ kind: "available"; collected: number }> | Readonly<{ kind: "no_witness" }>;
interface Common { readonly source: Comparison; readonly branchId: string; readonly outcome: Outcome }
export type InspectorComparisonCollection = Common & (
  Readonly<{ projection: "derived.compare.structure_delta@2"; population: ReturnType<typeof collectComparisonStructuralPopulation>;
    result: StructuralResult; proof: ReturnType<typeof readComparisonReductionResult> }>
  | Readonly<{ projection: "derived.compare.eval_delta@2"; trail: ReturnType<typeof recordedComparisonEvalTrail>;
    packets: readonly RecordedCompareEvalDeltaInput["before"][]; invocations: readonly EvalInvocation[];
    result: readonly RunEvidenceItem<EvidenceValueRouteResults["derived.compare.eval_delta@2"][number]["payload"]>[] }>
);
const COLLECTIONS = new WeakMap<object, ReturnType<typeof recordedComparisonData>>();
/** Server may inspect the original scope only after the complete runtime operation succeeds. */
export function readInspectorComparisonCollection(collection: InspectorComparisonCollection) {
  const data = collection !== null && typeof collection === "object" ? COLLECTIONS.get(collection) : undefined;
  if (data === undefined) throw new TypeError("Inspector comparison collection is not its original invocation");
  return data;
}

export function collectInspectorComparisonSource(run: DrillRun, columns: readonly [RecordedComparisonColumn, RecordedComparisonColumn],
  projection: InspectorComparisonProjection, signal: AbortSignal): InspectorComparisonCollection {
  if (!(signal instanceof AbortSignal)) throw new TypeError("Inspector comparison source requires an AbortSignal");
  signal.throwIfAborted(); assertInspectorComparisonProjection(projection);
  const source = createRecordedComparisonSource({ run, columns }), data = recordedComparisonData(source), branchId = data.authority.columns[0].branchId;
  if (canonicalizeJson(data.run) !== canonicalizeJson(run) || canonicalizeJson(data.authority.columns) !== canonicalizeJson(columns)) throw new TypeError("Inspector comparison crosses its complete original source/granted columns");
  signal.throwIfAborted();
  let collection: InspectorComparisonCollection;
  const outcome = (length: number): Outcome => length === 0 ? Object.freeze({ kind: "no_witness" }) : Object.freeze({ kind: "available", collected: length });
  if (projection === "derived.compare.structure_delta@2") {
    const population = collectComparisonStructuralPopulation({ comparison: source });
    assertComparisonStructuralPopulationScope(population, source); signal.throwIfAborted();
    const result = invokeEvidenceValueRoute(projection, { population, branchId });
    const proof = readComparisonReductionResult(result, population, branchId);
    collection = Object.freeze({ projection, source, branchId, population, result, proof, outcome: outcome(result.length) });
  } else {
    const trail = recordedComparisonEvalTrail(source, branchId);
    const packets = Object.freeze(trail.map(({ event, node }) => {
      signal.throwIfAborted();
      const resolved = resolveRunSubject(data.run, { kind: "run_node", runId: data.run.id, eventHeadDigest: data.authority.eventHeadDigest, branchId, nodeId: node.id });
      const itemDigest = digestRunEvidenceItem({ runId: data.run.id, eventHeadDigest: data.authority.eventHeadDigest, eventSeq: event.seq, event });
      const packet = invokeEvidenceValueRoute("recorded.inspector.eval_packet@1", { resolved, itemDigest });
      assertDeclaredEvidence(packet);
      if (packet.projection.id !== "recorded.inspector.eval_packet" || packet.projection.version !== 1
        || canonicalizeJson(packet.payload) !== canonicalizeJson(recordedInspectorPacketValue(resolved, itemDigest, "eval"))) throw new TypeError("Inspector comparison packet crosses its original recorded occurrence");
      return packet;
    }));
    const invocations = Object.freeze(packets.slice(1).map((after, index): EvalInvocation => {
      signal.throwIfAborted();
      const input = Object.freeze({ comparison: source, branchId, before: packets[index]!, after });
      const result = invokeEvidenceValueRoute(projection, input), proof = readRecordedCompareEvalInvocation(result, input);
      return Object.freeze({ input, result, proof });
    }));
    const result = Object.freeze(invocations.flatMap((invocation, index) => invocation.result.map(evidence => Object.freeze({
      evidence, nodeId: trail[index + 1]!.node.id, plyOffset: trail[index + 1]!.plyOffset,
    }))));
    collection = Object.freeze({ projection, source, branchId, trail, packets, invocations, result, outcome: outcome(result.length) });
  }
  signal.throwIfAborted(); COLLECTIONS.set(collection, data); return collection;
}
