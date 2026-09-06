import {
  collectPromotionRaceTablebase,
  createPromotionRaceTablebaseRequest,
  type PromotionArtifactStore,
} from "../d2929-semantic-collectors-promotion-fifteenth-author-repair/model.js";

declare const store: PromotionArtifactStore;
declare const signal: AbortSignal;
declare const normativeGeometry: Readonly<{ kind: "completed" }>;
declare const normativeScope: Readonly<{ id: string; budgetMs: number }>;
declare const normativeDependencies: Readonly<{ recordedLookup: unknown; scheduler: unknown }>;

const currentRequest = createPromotionRaceTablebaseRequest(store, "8/8/8/8/8/8/8/K6k w - - 0 1", signal);

// The RFC requires geometry + provider scope; the current public constructor cannot accept it.
// @ts-expect-error normative geometry/provider-scope ABI is absent
createPromotionRaceTablebaseRequest(normativeGeometry, normativeScope, signal);

// The RFC requires the recorded/provider/legal dependency bundle; the current operation rejects it.
// @ts-expect-error normative dependency bundle is absent
void collectPromotionRaceTablebase(currentRequest, normativeDependencies);
