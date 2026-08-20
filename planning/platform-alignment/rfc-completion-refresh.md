# RFC completion truth — post-A0 refresh

**Run:** 2026-08-20

**Ledger:** D637/D638

**Instrument:** `tools/rfc-completion-harness/`

## Answer

No active product RFC is fully complete.

The repository now has **63 lifecycle-closed archive records**, after repairing a five-row
filesystem/register mismatch. That means each archive file:

- labels itself implemented;
- appears in the actual `rfc/README.md` Archive table;
- points to existing canonical documentation;
- contains acceptance criteria; and
- has either a dedicated archived planning log (59) or the A0 global closeout record (4).

It does **not** mean all 63 have been independently re-derived against current code, and it does
not mean the current 1.0 learner journeys are complete. Only four archives — `live-marker-quality`,
`dead-vocabulary`, `engine-leverage`, and `vocabulary-wiring` — have the named A0 current-tree,
per-RFC re-verification. A1/A3-A5 separately show that historical implementation can coexist with
an incomplete modern evidence, detector, workflow, or UX contract.

Use three completion claims, never one:

| Level | What it proves | Current result |
|---|---|---|
| Lifecycle-closed | Body/register/docs/planning closeout exists | **63** |
| Independently current-reverified | Historical criteria and current implementation were traced as one RFC | **4 named A0 archives** |
| Current 1.0 outcome-complete | A default learner journey works end to end under current gates | **2/21 A1 integrations**, the drill loop and native human match; neither number implies the whole product is 1.0-ready |

## Register defect found and repaired

Before this pass, `rfc/archive/` contained 63 files but the actual `## Archive` table contained 58
rows. `claim-backing`, `format-surface`, `structural-reading`, and `transition-primitives` appeared
only in the pack-schema history. `expression-census` was an archive-shaped row embedded inside the
pack-schema table. D638 records the incident; the five rows now live in the Archive table and the
harness asserts set equality.

The earlier A0 phrase *“the archive count is now 63”* was numerically true as a filesystem count
and too strong as a register-closeout claim until this repair.

## Active RFC truth

| RFC | Audited reality | What may happen next |
|---|---|---|
| `teacher-surface` | accepted, unbuilt | Wait for R15/O11 or amend first; do not equate it with a coherent Coach mode |
| `graduation-clearance` | accepted, unbuilt; holds pack 0.28 | Implement after worktree coordination; it is a Gate-F input, not Gate F itself |
| `feedback-delivery` | accepted; Stage 1 exists only in dirty work | Reconcile the corrected CR1 instrument and records; Stage 2 remains separate authored/content work |
| `assistance-controls` | draft; old control-shaped framing is superseded by O4/A5 | Return for an author round around modules, presets, workflow identity, per-kind ceilings and advanced configuration |
| `measurement-records` | returned; large uncommitted authoring revision, no implementation | Resolve its subject/sub-expression and pack-vs-shape questions before acceptance |
| `learner-rating` | draft and blocked | Hold behind bot/campaign evidence, owner decisions and the teacher migration order |
| `pack-population-provenance` | draft with stale prerequisites | Refresh after R4/R6; settle O5/O6 before it consumes a pack lane |
| `shared-resource-registers` | draft process RFC | Resolve Q1/Q2, refresh observations, then make it the derivation substrate for F1 |
| `rfc-lifecycle-completion` | draft process RFC | Resolve Q1-Q3 and add the D638 Active/Archive set-equality failure to its instrument |

## Dirty feedback-delivery boundary

The preserved worktree contains Stage-1 implementation code and both the original and diagnostic
CR1 harnesses. Its records currently disagree:

- `stage-1-measurement.md` and the append-only implementation log say the one-ply N=8 result was
  100% and reopened CR1;
- `cr1-diagnosis.md` shows that instrument made candidate/common intersection empty by construction
  and measures a properly shaped N=8 continuation at 27.6–35.7%; and
- the accepted RFC still requires Stage 2 before archival.

Therefore Stage 1 is neither lost nor complete. Its implementer must append the correction, update
the measurement without erasing the false start, run the accepted criteria, and commit only its
scoped files. The content hold still prevents treating Stage 2 as a general content wave.

## Queue consequence

1. Resolve and accept the two process RFCs before the alignment program creates more shared claims.
2. Coordinate and finish feedback-delivery Stage 1; never broad-add the shared worktree.
3. Implement `graduation-clearance` once its overlap is clear, then release pack 0.28.
4. Return `assistance-controls`, `teacher-surface`, and the provenance/measurement/rating drafts
   through their named research and owner gates instead of mechanically shipping stale UX intent.
5. Preserve the distinction between historical RFC completion and F1-F12 current capability work
   in every roadmap/status report.

