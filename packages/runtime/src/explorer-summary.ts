/** Provider-exchange §8: move-free population facts, never a suitability or quality verdict. */
import { assertDeclaredEvidence, assertRenderedEvidenceView, type DeclaredEvidence, type RenderedEvidenceView } from "./evidence-contract.js";
import { CORPUS_GUARD } from "./population-guard.js";
import type { ExplorerPositionPage, ExplorerReportedHistory, ExplorerReportedOpening, ExplorerSpeed, ExplorerWdlCounts, ProviderEvidenceDelivery } from "./provider-types.js";

export interface ExplorerPopulationSummary {
  readonly page: DeclaredEvidence<ProviderEvidenceDelivery<ExplorerPositionPage, "lichess_explorer.position_page@1">>;
  readonly position: {
    readonly positionFen4: string;
    readonly requestFen6: string;
    readonly population: { readonly ratingBuckets: readonly number[]; readonly speeds: readonly ExplorerSpeed[]; readonly since: string | null; readonly until: string | null };
  };
  readonly totals: ExplorerWdlCounts & { readonly total: number };
  readonly listed: number;
  readonly unlisted: number;
  readonly averageRating: number | null;
  readonly opening: ExplorerReportedOpening;
  readonly history: ExplorerReportedHistory;
  readonly disclosure: { readonly guard: "CORPUS_GUARD"; readonly statement: typeof CORPUS_GUARD };
}

export type ExplorerPopulationSummaryWire = Readonly<Omit<ExplorerPopulationSummary, "page">> & {
  readonly source: { readonly provider: "lichess_explorer"; readonly normalizedRequestDigest: string; readonly responseDigest: string; readonly delivery: "live" | "retained_exact" };
};

/** Only this exact adapter transports the summary; the internal page is provenance, not wire. */
export function explorerPopulationSummaryWire(summary: DeclaredEvidence<ExplorerPopulationSummary>): ExplorerPopulationSummaryWire {
  assertDeclaredEvidence(summary);
  if (summary.projection.id !== "derived.explorer.population_summary" || summary.projection.version !== 1) throw new TypeError("Expected derived.explorer.population_summary@1");
  const value = summary.payload;
  const delivery = value.page.payload;
  return Object.freeze({
    position: value.position, totals: value.totals, listed: value.listed, unlisted: value.unlisted,
    averageRating: value.averageRating, opening: value.opening, history: value.history, disclosure: value.disclosure,
    source: Object.freeze({ provider: "lichess_explorer", normalizedRequestDigest: delivery.acquisition.normalizedRequestDigest, responseDigest: delivery.acquisition.responseDigest, delivery: delivery.kind }),
  });
}

/** The external voice door transports the narrow image, not a derived item's internal inputs. */
export function renderedProviderItems(view: RenderedEvidenceView): readonly { readonly evidence: object; readonly sentences: readonly string[] }[] {
  assertRenderedEvidenceView(view);
  return Object.freeze(view.items.map((item) => Object.freeze({
    evidence: item.evidence.projection.id === "derived.explorer.population_summary" && item.evidence.projection.version === 1
      ? Object.freeze({ producer: item.evidence.producer, projection: item.evidence.projection, payload: explorerPopulationSummaryWire(item.evidence as DeclaredEvidence<ExplorerPopulationSummary>) })
      : item.evidence,
    sentences: item.sentences,
  })));
}
