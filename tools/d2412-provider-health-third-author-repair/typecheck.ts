import type {
  ProviderAcquisitionReceipt,
  ProviderOperationStageRoute,
  ProviderReceiptBase,
} from "./model.js";

type StockfishPlayRoute = Extract<
  ProviderOperationStageRoute,
  { operationId: "opponent.stockfish_play"; stageId: "select" }
>;

const valid: ProviderReceiptBase<StockfishPlayRoute> = {
  operationId: "opponent.stockfish_play",
  stageId: "select",
  instanceId: "stockfish-play",
  implementation: "uci_sidecar",
  generation: "g1",
  requestDigest: "request-a",
};

const crossedInstance: ProviderReceiptBase<StockfishPlayRoute> = {
  ...valid,
  // @ts-expect-error stockfish analysis is not the declared play-stage instance
  instanceId: "stockfish-analysis",
};

const crossedImplementation: ProviderReceiptBase<StockfishPlayRoute> = {
  ...valid,
  // @ts-expect-error an HTTP implementation is not a member of the play instance
  implementation: "external_http",
};

const validOrigin: ProviderAcquisitionReceipt<StockfishPlayRoute> = {
  ...valid,
  source: "provider_live",
};

void crossedInstance;
void crossedImplementation;
void validOrigin;
