import {
  PRIMARY_EVIDENCE_MANIFEST,
  assertConsumerEvidenceView,
  declareEvidence,
  evidenceForConsumer,
  type ConsumerEvidenceView,
} from "@chess-tabiya/runtime";

import type { CorpusPage, HumanSplitPage } from "./api.js";

export function consumeHumanSplit(
  view: ConsumerEvidenceView<HumanSplitPage>,
): HumanSplitPage {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "inspector.human_split" || view.consumer.version !== 1 || view.items.length !== 1) {
    throw new TypeError("Expected one inspector.human_split@1 evidence item");
  }
  return view.items[0]!.payload;
}

export function consumeCorpus(
  view: ConsumerEvidenceView<CorpusPage>,
): CorpusPage {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "inspector.corpus" || view.consumer.version !== 1 || view.items.length !== 1) {
    throw new TypeError("Expected one inspector.corpus@1 evidence item");
  }
  return view.items[0]!.payload;
}

export function humanSplitEvidence(page: HumanSplitPage): HumanSplitPage {
  const declared = declareEvidence({ id: "human.maia", version: 1 }, { id: "human.maia.policy", version: 1 }, page);
  return consumeHumanSplit(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    { id: "inspector.human_split", version: 1 },
    [declared],
  ));
}

export function corpusEvidence(page: CorpusPage): CorpusPage {
  const declared = declareEvidence({ id: "human.explorer", version: 1 }, { id: "human.explorer.population", version: 1 }, page);
  return consumeCorpus(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    { id: "inspector.corpus", version: 1 },
    [declared],
  ));
}
