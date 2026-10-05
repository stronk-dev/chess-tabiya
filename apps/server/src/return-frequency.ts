import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { assertConsumerEvidenceView, assertProviderDelivery, compileProjectionExecution, corpusPositionEvidence, deriveExplorerPositionFrequency, evidenceForConsumer, type ConsumerEvidenceView, type ExplorerPositionFrequency } from "@chess-tabiya/runtime";
import { corpusSamplePolicy, type CorpusPopulation, type CorpusQuery, type CorpusRequestOptions, type CorpusResult, type CorpusSource } from "./corpus.js";
import { EVIDENCE_MANIFEST } from "./evidence-manifest.js";
import { corpusPageRequest } from "./provider-corpus.js";

export function consumeReturnFrequency<T extends CorpusResult | ExplorerPositionFrequency>(view: ConsumerEvidenceView<T>): T {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "runtime.return_frequency" || view.consumer.version !== 1 || view.items.length !== 1) throw new TypeError("Expected one runtime.return_frequency@1 evidence item");
  return view.items[0]!.payload;
}

/** Optional scheduling evidence. Modern source absence never opens the bare-statistics door. */
export async function returnFrequency(source: CorpusSource, query: CorpusQuery, options: CorpusRequestOptions = {}): Promise<{ readonly games: number; readonly population: CorpusPopulation } | undefined> {
  options.signal?.throwIfAborted();
  const captured = Object.freeze({ ...query, ratings: Object.freeze([...query.ratings]), speeds: Object.freeze([...query.speeds]) });
  if (source.page === undefined) {
    const result = await source.stats(captured, options);
    options.signal?.throwIfAborted();
    const admitted = consumeReturnFrequency(evidenceForConsumer(EVIDENCE_MANIFEST, { id: "runtime.return_frequency", version: 1 }, [corpusPositionEvidence(result)]));
    const sampled = corpusSamplePolicy(admitted, 100);
    return sampled.kind === "stats" ? Object.freeze({ games: sampled.total, population: sampled.population }) : undefined;
  }
  try {
    const execution = compileProjectionExecution(EVIDENCE_MANIFEST, { id: "derived.explorer.position_frequency", version: 1 });
    if (execution.paths.length !== 1 || execution.paths[0]!.sourceRequirements.length !== 1 || execution.paths[0]!.sourceRequirements[0]?.providerOperation !== "lichess_explorer.position_page@1") throw new TypeError("Return frequency has another source operation");
    const acquired = await source.page(captured, options);
    options.signal?.throwIfAborted();
    if (acquired.kind !== "page") return undefined;
    const frequency = consumeReturnFrequency(evidenceForConsumer(EVIDENCE_MANIFEST, { id: "runtime.return_frequency", version: 1 }, [deriveExplorerPositionFrequency(acquired.evidence)]));
    const delivery = frequency.page.payload;
    assertProviderDelivery("lichess_explorer.position_page@1", delivery);
    const expected = corpusPageRequest(captured, frequency.request.timeoutMs);
    if (canonicalizeJson(frequency.request) !== canonicalizeJson(expected) || canonicalizeJson(delivery.acquisition.requestedIdentity.request) !== canonicalizeJson(expected)) throw new TypeError("Return frequency does not match the requested root/population/window");
    // Preserve the queue's literal sample policy; sparse/zero pages remain source successes.
    if (frequency.total < 100) return undefined;
    const { fen: _fen, ...population } = captured;
    return Object.freeze({ games: frequency.total, population: Object.freeze(population) });
  } catch {
    options.signal?.throwIfAborted();
    return undefined;
  }
}
