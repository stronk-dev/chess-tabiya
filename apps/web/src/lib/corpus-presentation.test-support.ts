import { PRIMARY_EVIDENCE_MANIFEST, corpusPageEvidence, evidenceForConsumer, presentEvidenceItems, serializePresentedEvidence, type CorpusResult } from "@chess-tabiya/runtime";
import type { CorpusPage } from "./api.js";
import { deriveExplorerInspectorPopulation, normalizeProviderRequest } from "@chess-tabiya/runtime";
import { FIXTURE_AT, explorerRequest, httpCapture } from "../../../../packages/runtime/src/provider-test-fixtures.js";

/** Test capture bytes only. Admission authority stays in the test files, never helper modules. */
export function modernCorpusCapture() {
  const since = "2024-01", until = "2026-08";
  const requested = normalizeProviderRequest("lichess_explorer.position_page@1", explorerRequest({ since, until, history: { kind: "requested" } }));
  return {
    operation: "lichess_explorer.position_page@1" as const, requestedIdentity: requested,
    capture: httpCapture("lichess_explorer.position_page@1", {
      white: 120, draws: 40, black: 80,
      moves: [{ uci: "e2e4", san: "PRIVATE_PROVIDER_SAN", white: 60, draws: 20, black: 40, averageRating: 1700 }, { uci: "a2a3", san: "a3", white: 4, draws: 0, black: 0, averageRating: 1700 }],
      history: [{ month: "2026-08", white: 120, draws: 40, black: 80 }], opening: null,
    }), requestedAt: FIXTURE_AT, retrievedAt: FIXTURE_AT,
  };
}

/** Modern wire fixture from a genuinely admitted source; nothing here constructs a source seal. */
export function modernCorpusPageFixture(source: Parameters<typeof deriveExplorerInspectorPopulation>[0], nodeId: string, committedMoveSan: string | null = null, consumerVersion: 1 | 2 = 2): CorpusPage {
  const request = source.payload.payload.request;
  if (request.since === null || request.until === null) throw new TypeError("Corpus test fixture requires the exact dated population");
  const population = deriveExplorerInspectorPopulation(source);
  return Object.freeze<CorpusPage>({
    nodeId, committedMoveSan,
    committedMoveListed: committedMoveSan === null ? null : population.payload.moves.some(row => row.san === committedMoveSan),
    population: { source: "lichess-explorer", ratings: request.ratingBuckets, speeds: request.speeds, since: request.since, until: request.until },
    status: { kind: "shown" },
    presentation: serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "inspector.corpus", version: consumerVersion }, [population]))),
  });
}

/** Test-only standalone server transport, using the actual registered renderer. */
export function corpusPageFixture(page: { readonly nodeId: string; readonly committedMoveSan: string | null; readonly result: CorpusResult }): CorpusPage {
  const { result } = page;
  const shown = result.kind === "stats" && result.total >= 100;
  const sparse = result.kind === "abstention" ? /^total (\d+) < 100$/u.exec(result.detail)?.[1] : undefined;
  return Object.freeze<CorpusPage>({
    nodeId: page.nodeId, committedMoveSan: page.committedMoveSan,
    committedMoveListed: shown && page.committedMoveSan !== null ? result.moves.some(row => row.san === page.committedMoveSan) : null,
    population: result.population,
    status: shown ? { kind: "shown" } : sparse !== undefined ? { kind: "below_floor", total: Number(sparse) } : { kind: "source_unavailable" },
    presentation: serializePresentedEvidence(shown ? presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "inspector.corpus", version: 1 }, [corpusPageEvidence(page)])) : []),
  });
}
