import { describe, expect, it } from "vitest";

import type { CorpusPage, HumanSplitPage } from "./api.js";
import { consumeCorpus, consumeHumanSplit, corpusEvidence, humanSplitEvidence } from "./inspector-evidence.js";

const human = Object.freeze({ nodeId: "n1", engine: { id: "maia", version: "1" }, targetElo: 1500, candidates: [] }) as unknown as HumanSplitPage;
const corpus = Object.freeze({ nodeId: "n1", committedMoveSan: null, result: { kind: "abstention", reason: "no_data_at_band", detail: "none", population: { source: "lichess-explorer", ratings: [], speeds: [], since: "2020-01", until: "2026-08" } } }) as CorpusPage;

describe("on-request inspector evidence", () => {
  it("admits human-model and corpus pages before rendering", () => {
    expect(humanSplitEvidence(human)).toBe(human);
    expect(corpusEvidence(corpus)).toBe(corpus);
    if (false) {
      // @ts-expect-error Human inspector rejects a bare provider page.
      consumeHumanSplit(human);
      // @ts-expect-error Corpus inspector rejects a bare provider page.
      consumeCorpus(corpus);
    }
  });
});
