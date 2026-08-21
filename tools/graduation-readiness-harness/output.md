# D642 graduation-clearance readiness — raw output

Register: accepted; pack lane: 0.28 held; implementation: absent at HEAD.
Current corpus: drafts 56 documents / 293 entries (220 blocking, 30 resolved, 43 accepted); candidates 36 pack documents / 143 blocking entries.
Known non-derived residue: 17 draft hand-table assignments + 2 unrecognised candidate entries + 1 removed-referent resolution.
Acceptance defect: criterion 13 still demands the withdrawn GRADUATION_CLEARANCE_SUBJECT_UNSUPPORTABLE code while criterion 17 and the normative lint table require GRADUATION_CLEARANCE_SUBJECT_UNGRAMMATICAL.

Decision: do not start schema 0.28 in the dirty Feedback Stage-1 worktree. First land/recover Stage 1. Then amend the stale criterion, implement a read-only planner and mechanism, and require an explicit owner budget decision before applying the 92-document content migration and archiving the RFC.

Mechanism surface (14 named files): schemas/drill_pack.schema.json, packages/schema/src/index.ts, packages/schema/src/drill-pack/types.ts, packages/schema/src/drill-pack.test.ts, apps/server/src/pack-validation.ts, apps/server/src/graduation-report.ts, apps/server/src/sourcing/graduation-clear.ts, apps/server/src/sourcing/graduation-templates.ts, apps/server/src/sourcing/openings.ts, apps/server/src/sourcing/position-seeds.ts, apps/server/src/sourcing/syzygy.ts, apps/server/src/distill.ts, apps/server/package.json, Makefile.
Apply roots: content/drafts/, content/candidates/.
