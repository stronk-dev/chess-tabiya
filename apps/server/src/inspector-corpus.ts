import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { assertConsumerEvidenceView, assertProviderDelivery, compileProjectionExecution, corpusPageEvidence, deriveExplorerInspectorPopulation, evidenceForConsumer, presentEvidenceItems, serializePresentedEvidence, type ConsumerEvidenceView, type CorpusResult, type ExplorerInspectorPopulation, type CorpusInspectorPage } from "@chess-tabiya/runtime";
import type { CorpusQuery, CorpusSource, CorpusRequestOptions, CorpusPopulation } from "./corpus.js";
import { corpusPageRequest } from "./provider-corpus.js";
import { EVIDENCE_MANIFEST } from "./evidence-manifest.js";

type LegacyPage = { readonly nodeId: string; readonly result: CorpusResult; readonly committedMoveSan: string | null };
export type InspectorCorpusPage = CorpusInspectorPage<CorpusPopulation>;
type InspectorCorpusStatus = InspectorCorpusPage["status"];

/** The real server consumer, not a client constructor over arbitrary response bytes. */
export function consumeCorpus<T extends LegacyPage | ExplorerInspectorPopulation>(view: ConsumerEvidenceView<T>): T {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "inspector.corpus" || view.consumer.version !== 1 || view.items.length !== 1) throw new TypeError("Expected one inspector.corpus@1 evidence item");
  return view.items[0]!.payload;
}

export async function inspectorCorpus(source: CorpusSource, query: CorpusQuery, subject: { readonly nodeId: string; readonly committedMoveSan: string | null }, options: CorpusRequestOptions = {}): Promise<InspectorCorpusPage> {
  options.signal?.throwIfAborted();
  const captured = Object.freeze({ ...query, ratings: Object.freeze([...query.ratings]), speeds: Object.freeze([...query.speeds]) });
  const { fen: _fen, ...population } = captured;
  const absence = (status: InspectorCorpusStatus): InspectorCorpusPage => Object.freeze({ ...subject, population: Object.freeze(population), status, presentation: serializePresentedEvidence([]), committedMoveListed: null });
  try {
    if (source.page === undefined) {
      // Explicit standalone compatibility. A failed modern page never enters this arm.
      const result = await source.stats(captured, options);
      options.signal?.throwIfAborted();
      const view = evidenceForConsumer(EVIDENCE_MANIFEST, { id: "inspector.corpus", version: 1 }, [corpusPageEvidence({ ...subject, result })]);
      const admitted = consumeCorpus(view).result;
      if (canonicalizeJson(admitted.population) !== canonicalizeJson(population)) return absence({ kind: "source_unavailable" });
      if (admitted.kind === "abstention") {
        const total = /^total (\d+) < 100$/u.exec(admitted.detail)?.[1];
        return absence(admitted.reason === "no_data_at_band" && total !== undefined && Number(total) < 100 ? { kind: "below_floor", total: Number(total) } : { kind: "source_unavailable" });
      }
      if (admitted.total < 100) return absence({ kind: "below_floor", total: admitted.total });
      return Object.freeze({ ...subject, population: Object.freeze(population), status: { kind: "shown" as const }, presentation: serializePresentedEvidence(presentEvidenceItems(view)), committedMoveListed: subject.committedMoveSan === null ? null : admitted.moves.some(row => row.san === subject.committedMoveSan) });
    }
    const execution = compileProjectionExecution(EVIDENCE_MANIFEST, { id: "derived.explorer.inspector_population", version: 1 });
    if (execution.paths.length !== 1 || execution.paths[0]?.sourceRequirements.length !== 1 || execution.paths[0]?.sourceRequirements[0]?.providerOperation !== "lichess_explorer.position_page@1") throw new TypeError("Inspector has another source operation");
    const acquired = await source.page(captured, options);
    options.signal?.throwIfAborted();
    if (acquired.kind !== "page") return absence({ kind: "source_unavailable" });
    const view = evidenceForConsumer(EVIDENCE_MANIFEST, { id: "inspector.corpus", version: 1 }, [deriveExplorerInspectorPopulation(acquired.evidence)]);
    const admitted = consumeCorpus(view);
    const delivery = admitted.page.payload;
    assertProviderDelivery("lichess_explorer.position_page@1", delivery);
    const page = delivery.payload;
    const expected = corpusPageRequest(captured, page.request.timeoutMs);
    if (canonicalizeJson(page.request) !== canonicalizeJson(expected) || canonicalizeJson(delivery.acquisition.requestedIdentity.request) !== canonicalizeJson(expected)) throw new TypeError("Inspector source does not match its exact position/population/window");
    if (page.result.totals.total < 100) return absence({ kind: "below_floor", total: page.result.totals.total });
    return Object.freeze({ ...subject, population: Object.freeze(population), status: { kind: "shown" as const }, presentation: serializePresentedEvidence(presentEvidenceItems(view)), committedMoveListed: subject.committedMoveSan === null ? null : page.result.moves.some(row => row.canonicalSan === subject.committedMoveSan) });
  } catch {
    options.signal?.throwIfAborted();
    // The learner receives typed absence, never source diagnostics or unadmitted fallback.
    return absence({ kind: "source_unavailable" });
  }
}
