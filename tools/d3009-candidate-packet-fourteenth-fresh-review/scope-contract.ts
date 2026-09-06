import {
  createCandidatePopulationService,
  type CandidatePopulationServiceLimits,
} from "../d2934-candidate-packet-thirteenth-author-repair/model.js";

declare const limits: CandidatePopulationServiceLimits;
const service = createCandidatePopulationService({ limits });
const result = service.get(
  {
    beforeFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    ruleset: "standard",
    scope: "events",
  },
  new AbortController().signal,
);

void result.then((value) => {
  if (value.kind !== "ready") return;
  // @ts-expect-error D3014: request scope is not correlated to the returned receipt.
  const exactScope: "events" = value.receipt.packet.scope;
  void exactScope;
});
