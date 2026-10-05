import {
  PRIMARY_EVIDENCE_MANIFEST,
  assertConsumerEvidenceView,
  humanSplitPageEvidence,
  evidenceForConsumer,
  type ConsumerEvidenceView,
  parsePresentationReceipt,
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
  const items = parsePresentationReceipt(page.presentation);
  if (items.some(item => item.adapter.consumer.id !== "inspector.corpus" || item.adapter.consumer.version !== 1 || item.adapter.projection.version !== 1 || !["derived.explorer.inspector_population", "human.explorer.population"].includes(item.adapter.projection.id))) throw new TypeError("Corpus receipt belongs to another consumer/source");
  if ((page.status.kind === "shown") !== (items.length === 1)) throw new TypeError("Corpus presentation does not match its availability");
  for (const item of items) {
    if (item.component.id !== "fact_statement" || item.component.operand.rendererId !== "consumer.explorer_population@1") throw new TypeError("Corpus receipt uses another renderer");
    const value = item.component.operand.operands;
    if (JSON.stringify([value.ratings, value.speeds, value.since, value.until]) !== JSON.stringify([page.population.ratings, page.population.speeds, page.population.since, page.population.until])) throw new TypeError("Corpus presentation population differs from its requested attribution");
    if (page.committedMoveSan !== null && page.committedMoveListed !== value.moves.some(row => row.san === page.committedMoveSan)) throw new TypeError("Corpus move membership differs from its admitted rows");
  }
  return page;
}
