import { describe, expect, it } from "vitest";

import type { CorpusPage, HumanSplitPage } from "./api.js";
import { consumeHumanSplit, corpusEvidence, humanSplitEvidence } from "./inspector-evidence.js";
import { serializePresentedEvidence } from "@chess-tabiya/runtime";

const human = Object.freeze({ nodeId: "n1", engine: { id: "maia", version: "1" }, targetElo: 1500, candidates: [] }) as unknown as HumanSplitPage;
const corpus: CorpusPage = { nodeId: "n1", committedMoveSan: null, committedMoveListed: null, status: { kind: "source_unavailable" }, presentation: serializePresentedEvidence([]), population: { source: "lichess-explorer", ratings: [1400], speeds: ["rapid"], since: "2020-01", until: "2026-08" } };

describe("on-request inspector evidence", () => {
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
