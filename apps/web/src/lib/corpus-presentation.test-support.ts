import { PRIMARY_EVIDENCE_MANIFEST, corpusPageEvidence, evidenceForConsumer, presentEvidenceItems, serializePresentedEvidence, type CorpusResult } from "@chess-tabiya/runtime";
import type { CorpusPage } from "./api.js";

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
