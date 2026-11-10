// Accepted Review §4.5 / F2 §2.3g: complete captured Review source, not a Story/title crop.
import { assertRecordedReviewSourcePopulationInputs, collectRecordedReviewSourcePopulation, readRecordedReviewSourcePopulation, type ReviewSourceContext } from "./review-evidence.js";
import { readRecordedReviewBoundary, type RecordedReviewBoundary } from "./recorded-review-boundary.js";
import { collectRecordedReviewMoments, readRecordedReviewMoments } from "./recorded-review-moments.js";
import { invokeEvidenceValueRoute, type EvidenceValueRouteResults } from "./internal/evidence-value-routes.js";
import { readStoryRankReductionValue } from "./internal/story-rank-reduction-authority.js";

export interface InspectorStoryCollection {
  readonly projection: "derived.story.rank@3";
  readonly boundary: RecordedReviewBoundary;
  readonly population: ReturnType<typeof collectRecordedReviewSourcePopulation>;
  readonly recordedReview: ReturnType<typeof collectRecordedReviewMoments>;
  readonly result: EvidenceValueRouteResults["derived.story.rank@3"];
  readonly proof: ReturnType<typeof readStoryRankReductionValue>;
  // Even rank:[] is an actual singleton ordering, not absence of the Review source.
  readonly outcome: Readonly<{ kind: "available"; collected: 1 }>;
}
const COLLECTIONS = new WeakMap<object, ReturnType<typeof readRecordedReviewBoundary>>();
export function readInspectorStoryCollection(collection: InspectorStoryCollection) {
  const data = collection !== null && typeof collection === "object" ? COLLECTIONS.get(collection) : undefined;
  if (data === undefined || readRecordedReviewBoundary(collection.boundary) !== data) throw new TypeError("Inspector Story source is not its original complete invocation");
  const population = readRecordedReviewSourcePopulation(collection.population);
  if (population.boundary !== data || readRecordedReviewMoments(collection.recordedReview).population !== population) throw new TypeError("Inspector Story source lost its original population/moment joins");
  readStoryRankReductionValue(collection.result, collection.recordedReview); return data;
}

export function collectInspectorStorySource(boundary: RecordedReviewBoundary, context: ReviewSourceContext, signal: AbortSignal): InspectorStoryCollection {
  if (!(signal instanceof AbortSignal)) throw new TypeError("Inspector Story source requires an AbortSignal");
  signal.throwIfAborted(); const data = readRecordedReviewBoundary(boundary);
  const population = collectRecordedReviewSourcePopulation({ boundary, context }); signal.throwIfAborted();
  assertRecordedReviewSourcePopulationInputs(population, boundary, context);
  const original = readRecordedReviewSourcePopulation(population);
  if (original.boundary !== data) throw new TypeError("Inspector Story population crosses its original boundary");
  const recordedReview = collectRecordedReviewMoments({ population }); signal.throwIfAborted();
  if (readRecordedReviewMoments(recordedReview).population !== original) throw new TypeError("Inspector Story moments cross their original population");
  const result = invokeEvidenceValueRoute("derived.story.rank@3", { recordedReview });
  const proof = readStoryRankReductionValue(result, recordedReview); signal.throwIfAborted();
  const collection = Object.freeze({ projection: "derived.story.rank@3" as const, boundary, population, recordedReview, result, proof,
    outcome: Object.freeze({ kind: "available" as const, collected: 1 as const }) });
  COLLECTIONS.set(collection, data); readInspectorStoryCollection(collection); return collection;
}
