# Graduation-clearance readiness after the foundation hold

**Run:** 2026-08-20

**Ledger:** D642

**Instrument:** `tools/graduation-readiness-harness/`

## Decision

The clearance mechanism remains a valid accepted direction, but the RFC is not executable as one
indivisible landing in the current worktree.

First, Feedback Stage 1 is uncommitted across server, runtime and client pack consumers. Starting
pack schema 0.28 before that work is recovered would make its validation baseline move underneath
it and would force a mixed commit or a second adaptation pass.

Second, the RFC predates D560. Its completion criteria combine two materially different acts:

1. build the typed clearance object, lints, report, writer, emitter template registry, migration
   classifier and tests; and
2. apply that migration to every current draft and candidate pack, transition fixtures, restamp
   sidecars and archive the RFC.

The first is an already-accepted foundation repair. The second is a 92-document content rewrite
under the active hold and cannot be authorised merely by calling it mechanical. The RFC itself
records 17 hand-table assignments, two candidate entries outside all emitter templates and one
special removed-referent resolution. Those judgements are bounded and already written down, but
they are still the exact residue Gate F says a planner must expose rather than silently infer.

## Current population

The executable audit re-derives, at HEAD:

| root | pack documents | entries | blocking | resolved | accepted |
|---|---:|---:|---:|---:|---:|
| `content/drafts/` | 56 | 293 | 220 | 30 | 43 |
| `content/candidates/` | 36 | 143 | 143 | 0 | 0 |

Pack schema remains 0.27. `make graduation-clear`, the clearance schema and the named clearance
lint codes are absent. The accepted RFC still holds 0.28.

## One author correction is required before implementation

The normative lint table withdrew
`GRADUATION_CLEARANCE_SUBJECT_UNSUPPORTABLE` into
`GRADUATION_CLEARANCE_SUBJECT_UNGRAMMATICAL`. Acceptance criterion 17 uses the latter, but
criterion 13 still requires the withdrawn code. Both cannot be implemented literally. This is an
author correction to an accepted, unimplemented RFC, not a new product decision: criterion 13
should assert `..._SUBJECT_UNGRAMMATICAL` and keep its positive `claim_bound` control.

## Legal landing sequence

1. Recover, verify and land Feedback Stage 1 without claiming its authored Stage 2.
2. Apply the criterion-13 author correction and append the RFC change record.
3. Implement the 0.28 schema, types, document-only lints, checkout sweep, report verification,
   emitter template registry, classifier and `graduation-clear --check` as a read-only plan.
4. Run that plan over all drafts, candidate packs and sidecars. It must print separate mechanical,
   already-enumerated judgement and unsupported residue, with no default-to-`unreachable` path.
5. Ask the owner to accept or reject the measured apply/re-authoring budget under D560.
6. Only after acceptance, apply the corpus rewrite, run all 19 corrected criteria, update docs,
   release pack lane 0.28, flip shipped ledger rows and append the lifecycle log in the same commit.

This split does not weaken the accepted mechanism or lift Gate F. It makes the later content
decision observable and prevents an accepted pre-hold RFC from bypassing a newer owner ruling.
