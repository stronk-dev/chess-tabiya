// rfc/pack-capability-contract.md §5 — every capability whose lifecycle is not "active at version 1".
//
// A version transition is authored HERE: when `make capability-check` reports that a stored digest
// no longer matches the tree, either revert the meaning change or add the next version to its
// subject's row (the obsolete row `deprecated`/`withdrawn` with a same-subject successor) and run
// `make capability-declarations`. The obsolete declaration keeps its frozen digest; every pack or
// shape that required it then appears in `make migration-plan`'s judgement debt.
//
// Only a subject's CURRENT row may name another subject as its successor (a replacement: the whole
// subject is superseded). Obsolete rows advance within their own subject.

import { capabilityId, type CapabilityVersion } from "@chess-tabiya/schema";

import type { CapabilityLifecycleRow } from "./registry.js";

const v = (value: number): CapabilityVersion => ({ kind: "integer", value });

export const CAPABILITY_LIFECYCLE: readonly CapabilityLifecycleRow[] = Object.freeze([
  // §5 "the three prose-only deprecations get typed successors" — two have a truthful successor.
  {
    subjectId: "successCondition.plan_consequence",
    versions: [{ version: v(1), disposition: { kind: "deprecated", successor: capabilityId("successCondition.structural_feature"), reasonCode: "superseded", reason: "plan_consequence is deprecated; use structural_feature with a plan_signature leaf (lint PLAN_CONSEQUENCE_DEPRECATED)" } }],
  },
  {
    subjectId: "structuralFeature.pawn_count",
    versions: [{ version: v(1), disposition: { kind: "deprecated", successor: capabilityId("structuralFeature.piece_count"), reasonCode: "superseded", reason: "pawn_count is deprecated; use piece_count with role pawn (PAWN_COUNT_DEPRECATED)" } }],
  },
  // `retryVariants` is not flattened (§5, D1327): the catalogue relation advances to `variantOf`,
  // while the scheduler read (`retryVariants.scheduler`) stays active.
  {
    subjectId: "catalogue.variant_relation",
    versions: [
      { version: v(1), disposition: { kind: "deprecated", successor: capabilityId("catalogue.variant_relation", 2), reasonCode: "superseded", reason: "retryVariants is a catalogue relation, not a run modifier; variantOf is its successor" } },
      { version: v(2), disposition: { kind: "active" } },
    ],
  },
  // §5a: the two declared-but-unimplemented opponent modes.
  { subjectId: "opponentPolicy.mode.plan_defense", versions: [{ version: v(1), disposition: { kind: "unimplemented", implementationRef: "apps/server/src/capabilities.ts#DECLARED_UNIMPLEMENTED_POLICY_MODES" } }] },
  { subjectId: "opponentPolicy.mode.human_external", versions: [{ version: v(1), disposition: { kind: "unimplemented", implementationRef: "apps/server/src/capabilities.ts#DECLARED_UNIMPLEMENTED_POLICY_MODES" } }] },
  // The format register's assistance and error rows keep their real subject kinds (§4.2).
  { subjectId: "assistance.arrows", versions: [{ version: v(1), disposition: { kind: "unmeasured", experiment: "Measure and define a directed structural primitive before enabling system-drawn sight arrows" } }] },
  {
    subjectId: "error.SIMULATE_BUDGET_EXCEEDED",
    versions: [{ version: v(1), disposition: { kind: "withdrawn", reason: "No simulation economy or budget exists; reintroduce a refusal with the economy that needs it", removedAt: "0.25", successor: null, noSuccessor: { kind: "no_migration_exists", reason: "the refusal named a budget that never existed" } } }],
  },
]);
