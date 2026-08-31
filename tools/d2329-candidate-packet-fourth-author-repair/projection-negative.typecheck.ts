// DISPOSABLE consumer of the proposed production type: arbitrary strings and crossed values fail.
import {
  type CandidateCollectorProjection,
  type CandidateCollectorResult,
} from "./projection-authority.typecheck.js";

const admitted: CandidateCollectorProjection = "rules.transition.event.capture@1";
void admitted;

// @ts-expect-error an unregistered string is not a candidate projection
const arbitrary: CandidateCollectorProjection = "not.a.registered.projection@1";
void arbitrary;

const crossed: CandidateCollectorResult<"rules.transition.event.capture@1"> = {
  projection: "rules.transition.event.capture@1",
  // @ts-expect-error a result value cannot use a different versioned projection key
  values: [{ projection: "rules.tactic.event.double_attack@1" }],
};
void crossed;
