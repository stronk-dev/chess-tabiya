# RFC: Roadmap progress flow-back

- **Status:** implemented 2026-08-31 — the reconciled roadmap, typed checkpoints, derived report,
  receipt lifecycle counts and staged implementation flow-back guard ship together.
- **Author:** codex on the owner's ruling
- **Created:** 2026-08-31
- **Design refs:** none. This is repository process and changes no product behavior or chess claim.
- **Exploration gate:** passed by first-hand repository evidence [[D2375]]: implementation commit
  `24bda670` updated product code, browser/unit tests, docs, RFC body/register, ledger, plan, log and
  the source-sealed receipt while the roadmap still named the shipped stacked-layout replacement as
  future work. The receipt sealed stale semantics correctly because it had no checkpoint contract.
- **Depends on:** implemented roadmap/check/receipt machinery [[D1539]], [[D1543]] and the staged
  index process check.
- **Parent / amends:** `planning/roadmap-1.0.json`, `planning/roadmap-to-done.md`,
  `planning/roadmap-1.0.receipt.json`, `tools/roadmap-check.mjs`,
  `tools/roadmap-receipt.mjs`, `tools/staged-process-contracts.mjs`, and `Makefile`.
- **Supersedes / superseded by:** —
- **Planning:** `planning/roadmap-progress-flowback/`

```tabiya-claims
none
```

## Summary

Progress must flow back at the implementation checkpoint, not only when an entire capability or
milestone closes. This RFC adds a small typed checkpoint to the existing roadmap, derives a
human-readable report from the sealed sources, and makes the staged implementation shape that
escaped on 2026-08-31 fail before commit.

## 1. Contract

Every execution milestone carries one `latestCheckpoint` object:

```ts
type RoadmapCheckpoint = {
  at: `${number}-${number}-${number}`;
  summary: string;
  impact: "advanced" | "held" | "regressed";
  evidence: readonly string[];
};
```

`evidence` is non-empty and contains repository-relative files that exist. An optional `#anchor`
is descriptive; the file before it must exist. The checkpoint is current progress evidence, not
the milestone exit and not permission to promote a dimension.

The stable-board reconciliation is explicit: the board shell and structural companion queue are
shipped, while learner modules, presets and the emitter-dependent composition cells remain open.
`stable-board-and-presets` therefore becomes active, not complete. Support and Accessibility may
move from missing/stale wording to partial without weakening any release exit.

## 2. Receipt and report

The receipt includes every checkpoint and active RFC lifecycle counts derived from the same RFC
register parser as `status-parity`. `make roadmap-progress` prints, deterministically:

- milestone state plus latest checkpoint;
- capability-dimension state counts;
- active RFC lifecycle counts;
- persistent UX-work-item counts; and
- the strict warning that milestone/dimension states are release gates while checkpoints describe
  incremental delivery.

No hand-copied totals appear in the report implementation.

## 3. Staged flow-back

The staged process check examines the material Git index, never another worker's unstaged tree.
When one staged change contains both:

1. a non-test product byte under `apps/`, `packages/`, `schemas/`, `content/` or `deploy/`; and
2. one active RFC body under `rfc/*.md`,

the staged roadmap and receipt are mandatory. At least one milestone checkpoint must differ from
`HEAD`, and the changed checkpoints' evidence must name every staged active RFC body. This is the
exact shape `24bda670` would have failed.

Research, authoring-only RFC edits, tests without product bytes, docs-only corrections and another
worker's unstaged files do not trigger the rule. The receipt still catches any staged roadmap edit
without its regenerated derived bytes.

## 4. Acceptance criteria

1. `roadmap-check` rejects missing/malformed checkpoints, invalid dates/impact values, empty
   evidence and absent evidence files.
2. The receipt contains checkpoint bytes and exact lifecycle counts. Changing either source makes
   the ordinary check red; verification never rewrites the receipt.
3. `make roadmap-progress` reproduces the receipt's milestone, dimension, RFC and work-item totals.
4. A staged fixture shaped like `24bda670` fails when the roadmap is absent, fails when a changed
   checkpoint omits its RFC, and passes with the roadmap, receipt and matching checkpoint.
5. Unstaged concurrent product/RFC changes cannot affect the staged fixture.
6. Current prose no longer says the stable board replacement is future work; it names the shipped
   shell and the still-open module/preset work separately.
7. `make roadmap-check`, `make staged-process-contracts-test`, `make verify-governance` and the
   normal full verification target pass.
8. Closeout flips [[D2375]], appends the exploration log and documents the operator command.

## Discharges

none

## Open questions

none

## Changelog

- 2026-08-31: accepted first version on the owner's explicit priority ruling.
