import { describe, expect, it } from "vitest";

import type { CorpusPage, HumanSplitPage } from "./api.js";
import { consumeHumanSplit, corpusEvidence, humanSplitEvidence } from "./inspector-evidence.js";
import { presentationDigest, providerSourceEvidence, serializePresentedEvidence } from "@chess-tabiya/runtime";
import { modernCorpusCapture, modernCorpusPageFixture } from "./corpus-presentation.test-support.js";
import { PROVIDER_EXCHANGE_AUTHORITY } from "../../../../packages/runtime/src/provider-exchange.js";

function modernSource() {
  const acquisition = PROVIDER_EXCHANGE_AUTHORITY.makeProviderAcquisitionReceipt(modernCorpusCapture());
  const parsed = PROVIDER_EXCHANGE_AUTHORITY.makeProviderParsedPayload(acquisition);
  return providerSourceEvidence("lichess_explorer.position_page@1", PROVIDER_EXCHANGE_AUTHORITY.makeProviderDelivery({ kind: "live", acquisition, ...parsed, servedAt: acquisition.retrievedAt }));
}

const human = Object.freeze({ nodeId: "n1", engine: { id: "maia", version: "1" }, targetElo: 1500, candidates: [] }) as unknown as HumanSplitPage;
const corpus: CorpusPage = { nodeId: "n1", committedMoveSan: null, committedMoveListed: null, status: { kind: "source_unavailable" }, presentation: serializePresentedEvidence([]), population: { source: "lichess-explorer", ratings: [1400], speeds: ["rapid"], since: "2020-01", until: "2026-08" } };

describe("on-request inspector evidence", () => {
  it.each([null, "e4", "Nf3"])("admits the real modern receipt and exact move membership (%s)", move => {
    const page = modernCorpusPageFixture(modernSource(), "n1", move);
    expect(corpusEvidence(JSON.parse(JSON.stringify(page)))).toEqual(page);
  });
  it("rejects crossed population, source and committed-move attribution", () => {
    const page = modernCorpusPageFixture(modernSource(), "n1", "e4");
    for (const crossed of [
      { ...page, population: { ...page.population, ratings: [1000] } },
      { ...page, population: { ...page.population, speeds: ["bullet"] } },
      { ...page, population: { ...page.population, since: "2020-01" } },
      { ...page, population: { ...page.population, until: "2025-01" } },
      { ...page, population: { ...page.population, source: "another-source" } },
      { ...page, committedMoveListed: false },
      { ...page, committedMoveSan: null, committedMoveListed: true },
      { ...page, status: { kind: "source_unavailable" } },
    ]) expect(() => corpusEvidence(crossed as CorpusPage)).toThrow();
  });
  it("accepts the registered v1 derived tuple but refuses crossed tuples even with recomputed wire digests", () => {
    const page = modernCorpusPageFixture(modernSource(), "n1");
    const receipt = (consumer: { id: string; version: number }, projection = page.presentation.items[0]!.adapter.projection) => {
      const items = page.presentation.items.map(item => ({ ...item, adapter: { consumer, projection }, evidenceRef: { ...item.evidenceRef!, projection } }));
      return { protocol: "presentation.receipt@1" as const, items, digest: presentationDigest("presentation.receipt@1", items) };
    };
    expect(corpusEvidence(modernCorpusPageFixture(modernSource(), "n1", null, 1)).status.kind).toBe("shown");
    for (const presentation of [
      receipt({ id: "inspector.corpus", version: 3 }),
      receipt({ id: "inspector.human_split", version: 2 }),
      receipt({ id: "inspector.corpus", version: 2 }, { id: "human.explorer.population", version: 1 }),
      receipt({ id: "inspector.corpus", version: 2 }, { id: "derived.explorer.inspector_population", version: 2 }),
    ]) expect(() => corpusEvidence({ ...page, presentation })).toThrow();
    const items = [page.presentation.items[0]!, page.presentation.items[0]!];
    const doubled = { protocol: "presentation.receipt@1" as const, items, digest: presentationDigest("presentation.receipt@1", items) };
    expect(() => corpusEvidence({ ...page, presentation: doubled, status: { kind: "source_unavailable" } })).toThrow();
  });
  it("refuses contradictory abstention floors and absence memberships", () => {
    for (const total of [-1, 1.5, 100]) expect(() => corpusEvidence({ ...corpus, status: { kind: "below_floor", total } })).toThrow();
    expect(() => corpusEvidence({ ...corpus, committedMoveSan: "e4", committedMoveListed: false })).toThrow();
    expect(corpusEvidence({ ...corpus, status: { kind: "below_floor", total: 0 } }).status).toEqual({ kind: "below_floor", total: 0 });
  });
  it("admits human-model and corpus pages before rendering", () => {
    expect(humanSplitEvidence(human)).toBe(human);
    expect(corpusEvidence(corpus)).toBe(corpus);
    if (false) {
      // @ts-expect-error Human inspector rejects a bare provider page.
      consumeHumanSplit(human);
    }
  });
  it("does not turn raw response objects into Explorer evidence", () => {
    expect(() => corpusEvidence({ ...corpus, presentation: {} } as never)).toThrow();
    expect(() => corpusEvidence({ ...corpus, status: { kind: "shown" } })).toThrow();
  });
});
