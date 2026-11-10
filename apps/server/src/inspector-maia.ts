import { assertConsumerEvidenceView, compileEvidenceConsumerExecution, deriveMaiaNodeDistribution, maiaNodeInputsFromSubject,
  evidenceForConsumer, presentEvidenceItems, serializePresentedEvidence,
  type ConsumerEvidenceView, type MaiaNodeDistribution, type HumanSplitPageV2 } from "@chess-tabiya/runtime";
import type { ResolvedRunSubject } from "@chess-tabiya/runtime/run-subject";
import { EVIDENCE_MANIFEST } from "./evidence-manifest.js";
import type { OpponentSelector, SelectMoveRequest } from "./opponent-selector.js";
import { ServerError } from "./errors.js";

const CONSUMER = Object.freeze({ id: "inspector.human_split", version: 2 });

export function consumeMaiaNodeDistribution(view: ConsumerEvidenceView<MaiaNodeDistribution>): MaiaNodeDistribution {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== CONSUMER.id || view.consumer.version !== CONSUMER.version || view.items.length !== 1
    || view.items[0]!.projection.id !== "derived.maia.node_distribution" || view.items[0]!.projection.version !== 1) throw new TypeError("Expected the exact requested-node model distribution");
  return view.items[0]!.payload;
}

/** Explicit modern route: shared final observation, no legacy fallback, no source ancestry on wire. */
export async function inspectorMaiaPage(selector: OpponentSelector, request: SelectMoveRequest, resolved: ResolvedRunSubject,
  options: { readonly signal: AbortSignal; readonly recheck: () => void }): Promise<HumanSplitPageV2> {
  options.signal.throwIfAborted(); options.recheck();
  const execution = compileEvidenceConsumerExecution(EVIDENCE_MANIFEST, CONSUMER), binding = execution.bindings[0];
  const sources = binding?.paths[0]?.sourceRequirements;
  if (execution.bindings.length !== 1 || binding?.binding.projection.id !== "derived.maia.node_distribution" || binding.binding.projection.version !== 1
    || binding.paths.length !== 1 || sources?.length !== 2
    || sources[0]!.projection.id !== "human.maia.inference_task" || sources[0]!.projection.version !== 1 || sources[0]!.providerOperation !== "maia.inference_task@1"
    || sources[1]!.projection.id !== "run.record.position" || sources[1]!.projection.version !== 1 || sources[1]!.providerOperation !== null) throw new TypeError("Inspector model distribution has a crossed complete source binding");
  if (!selector.hasMaiaTaskSource() || request.policy.mode !== "human_common") throw new TypeError("Modern Inspector requires its actual sampled-task source");
  const { maiaEvidence } = await selector.selectWithMaiaEvidence(request, { signal: options.signal });
  options.signal.throwIfAborted(); options.recheck();
  if (maiaEvidence === null) throw new ServerError("ENGINE_UNAVAILABLE", "The requested model observation is unavailable");
  const item = deriveMaiaNodeDistribution(maiaNodeInputsFromSubject(maiaEvidence, resolved));
  const view = evidenceForConsumer(EVIDENCE_MANIFEST, CONSUMER, [item]);
  const { nodeId, engine, requestedBand, appliedBand, coverage, candidates } = consumeMaiaNodeDistribution(view);
  const shown = candidates.length > 0;
  const presentation = serializePresentedEvidence(shown ? presentEvidenceItems(view) : []);
  options.signal.throwIfAborted(); options.recheck();
  return Object.freeze({ protocol: "inspector.human_split@2", nodeId, status: shown ? "shown" : "empty_population",
    engine, requestedBand, appliedBand, coverage, candidates, presentation });
}
