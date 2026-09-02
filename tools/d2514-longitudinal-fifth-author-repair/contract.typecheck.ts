import { assembleLongitudinalRead, type LongitudinalCutOutcome } from "./contract.js";

declare const cuts: readonly LongitudinalCutOutcome[];
const result = assembleLongitudinalRead(cuts, { denominators: [], observations: [], structureStats: [] });

if (result.kind === "incomplete") {
  for (const cut of result.cuts) {
    if (cut.kind === "failed") cut.failureCode satisfies "snapshot_invalid" | "derivation_failed" | "publication_conflict";
    if (cut.kind === "pending") cut.retryAt satisfies string | undefined;
    if (cut.kind === "unavailable") cut.reason satisfies "not_requested" | "revision_mismatch" | "profile_suppressed" | "cut_superseded";
  }
  // @ts-expect-error mixed-cut failure truth cannot be lifted to the aggregate result
  result.failureCode;
  // @ts-expect-error incomplete results never expose derived rows
  result.observations;
} else {
  result.observations satisfies readonly unknown[];
  result.cuts satisfies readonly { readonly kind: "complete" }[];
}
