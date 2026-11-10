// Accepted longitudinal-store A.2: one closed data-only machine source image, no collectors.
import { NATIVE_SUBJECT_SOURCE_REFS } from "./semantic-native-subject-types.js";
import { SEMANTIC_PLAYED_RANKING_MODES } from "./semantic-played-types.js";
import { SUBJECT_OUTCOME_FAMILIES } from "./semantic-subject-types.js";
export const PROFILE_PREVALENCE_SOURCE_REFS = Object.freeze(Object.entries(SEMANTIC_PLAYED_RANKING_MODES)
  .filter(([ref, mode]) => mode === "projection_sign_prevalence" && ref !== "derived.exchange.trade_completed@1").map(([ref]) => ref));
export const PROFILE_SUBJECT_SOURCE_REFS = Object.freeze([
  ...NATIVE_SUBJECT_SOURCE_REFS,
  ...PROFILE_PREVALENCE_SOURCE_REFS,
  ...SUBJECT_OUTCOME_FAMILIES.map(f => `derived.semantic_avoidance.${f}@2` as const),
]);
export const PROFILE_SUBJECT_PROJECTIONS = Object.freeze(PROFILE_SUBJECT_SOURCE_REFS.map(ref => {
  const at = ref.lastIndexOf("@");
  return Object.freeze({ id: ref.slice(0, at), version: Number(ref.slice(at + 1)) });
}));
