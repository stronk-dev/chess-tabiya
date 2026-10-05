import {
  PRIMARY_EVIDENCE_MANIFEST,
  assertConsumerEvidenceView,
  humanSplitPageEvidence,
  evidenceForConsumer,
  type ConsumerEvidenceView,
  parsePresentationReceipt,
  CORPUS_POPULATION_SOURCE,
  type PresentedEvidenceItem,
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

export function humanSplitEvidence(page: HumanSplitPage): HumanSplitPage {
  const declared = humanSplitPageEvidence(page);
  return consumeHumanSplit(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    { id: "inspector.human_split", version: 1 },
    [declared],
  ));
}

export function corpusEvidence(page: CorpusPage): CorpusPage {
  corpusPresentation(page);
  return page;
}

/** Validate the complete server receipt before either compatibility prose or component rendering. */
export function corpusPresentation(page: CorpusPage): readonly PresentedEvidenceItem[] {
  const items = parsePresentationReceipt(page.presentation);
  if (items.some(item => {
    const { consumer, projection } = item.adapter;
    const allowedSource = consumer.version === 1
      ? projection.id === "derived.explorer.inspector_population" || projection.id === "human.explorer.population"
      : consumer.version === 2 && projection.id === "derived.explorer.inspector_population";
    return consumer.id !== "inspector.corpus" || projection.version !== 1 || !allowedSource;
  })) throw new TypeError("Corpus receipt belongs to another consumer/source");
  if (!["shown", "below_floor", "source_unavailable"].includes(page.status.kind)
    || items.length !== (page.status.kind === "shown" ? 1 : 0)) throw new TypeError("Corpus presentation does not match its availability");
  if (page.population.source !== CORPUS_POPULATION_SOURCE) throw new TypeError("Corpus presentation names another source");
  if (page.status.kind === "below_floor" && (!Number.isSafeInteger(page.status.total) || page.status.total < 0 || page.status.total >= 100)) throw new TypeError("Corpus abstention does not match its population floor");
  if ((page.status.kind !== "shown" || page.committedMoveSan === null) && page.committedMoveListed !== null) throw new TypeError("Corpus absence has no committed-move membership");
  for (const item of items) {
    if (item.component.id !== "fact_statement" || item.component.operand.rendererId !== "consumer.explorer_population@1") throw new TypeError("Corpus receipt uses another renderer");
    const value = item.component.operand.operands;
    if (value.total < 100) throw new TypeError("Corpus presentation is below its population floor");
    if (JSON.stringify([value.ratings, value.speeds, value.since, value.until]) !== JSON.stringify([page.population.ratings, page.population.speeds, page.population.since, page.population.until])) throw new TypeError("Corpus presentation population differs from its requested attribution");
    if (page.committedMoveSan !== null && page.committedMoveListed !== value.moves.some(row => row.san === page.committedMoveSan)) throw new TypeError("Corpus move membership differs from its admitted rows");
  }
  return items;
}
