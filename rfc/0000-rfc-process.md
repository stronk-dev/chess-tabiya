# RFC-0000: The RFC Process

- **Status:** accepted
- **Author:** Marco
- **Created:** 2026-08-09
- **Supersedes / superseded by:** —

## The four tiers of documentation

| Tier | Directory | What it is | Mutability |
|---|---|---|---|
| **Design** | `design/` | Intent and evidence: what the product is and why. Where ideas come from. | Amended rarely; never the implementation spec |
| **RFC** | `rfc/` | Active implementation specs. Every system that gets built is specified by one or more RFCs before implementation. | Living until implemented, then frozen and moved to `rfc/archive/` |
| **Planning** | `planning/` | Per-job working documents: the plan and a running log. The durable record of long-running jobs. | Living during the job; archived on completion |
| **Docs** | `docs/` | Canonical description of what actually exists. | Always current; updated as part of every implementing change. |

Plus one repo-specific tier: `archive/` — frozen inputs (the v2 brief). Immutable;
supersede in living tiers, never edit there.

**The flow:** design → active RFC (specification) → planning (how + log) → implementation →
canonical docs + RFC/planning archives. Once a feature ships, `docs/` is the only current
description of its behavior; archived RFCs explain why and how it arrived.

## The exploration gate

This repo is in the **exploratory phase**: we are deciding *whether and what* to build,
not building. Therefore:

- **Product RFC drafting is closed** until the vertical slice has passed the continuation
  gates in `planning/exploration/gates.md`, or an owner ruling (logged in
  `planning/exploration/log.md`) opens a specific RFC early.
- The first **experimental vertical-slice RFC** may be drafted when the earlier
  exploration-to-slice gate in `planning/exploration/gates.md` passes. That gate requires
  evidence for competitive whitespace, learner/problem value, author-declared phase
  transitions, opponent feasibility, and branch UX; it does not require a vertical slice
  that cannot yet exist.
- Disposable research harnesses and non-production UX prototypes do not require an RFC.
  They must be explicitly labeled research tooling, scoped to answering a ledger question,
  and recorded in `planning/exploration/log.md`; they do not become production foundations
  by accident.
- The sketches in `archive/brief-v2/rfcs/` and `archive/brief-v2/adrs/` are
  **design-tier idea sketches**, not RFCs: they predate all validation, and every one
  of them rests on an untested hypothesis (H1–H5). Real RFCs will mine them for
  material, cite them, and meet this template's bar (Specification, Acceptance
  criteria, Design refs).
- "No RFC from a GAP row" applies to exploration questions too: a system whose
  feasibility question in `planning/exploration/plan.md` is unresolved cannot be
  spec'd. Research first, spec second.

## RFC lifecycle

`draft` → `accepted` → `implementing` → (`awaiting` →) `implemented` → (`superseded` | `withdrawn`)

- **draft**: under discussion; anything may change.
- **accepted**: scope and approach agreed by Marco; implementation may be planned.
- **implementing**: at least one planning doc exists and work is underway.
- **awaiting**: the surface has landed, at least one obligation executed outside this RFC's
  implementation remains undischarged, and no outstanding code work remains. It stays active,
  does not flip its ledger rows, and names the holding discharge row in both status locations.
- **implemented**: shipped; canonical behavior has been distilled into `docs/`, every row of
  its `## Discharges` section is discharged, and the frozen RFC has moved to `rfc/archive/`.
- **superseded**: a later RFC replaces it (must link both ways). **withdrawn**: abandoned, kept for the record.

The state vocabulary is closed at `draft`, `accepted`, `implementing`, `awaiting`, `implemented`,
`superseded`, and `withdrawn`. Both the body Status line and the Active-table status cell begin
with one token after stripping Markdown emphasis and whitespace. Text from the first date, dash,
colon, comma, semicolon or parenthesis is prose. For `awaiting`, the first `D<n>` token after that
separator is the required pointer to an undischarged row; no other prose is machine-read.

## Rules

1. **Identity:** use a descriptive, stable filename such as `branch-runtime.md`. No
   global sequence numbers (RFC-0000 is the sole numbered exception). Follow-ups use a
   descriptive name and declare `Parent`/`Amends` metadata.
2. **Scope discipline:** an RFC should be implementable in bounded work. If scope grows,
   **split**: the new scope becomes a new RFC referencing the parent. Note the split in both.
3. **Amendments:** small clarifications to a not-yet-implemented RFC are edited in place
   with a changelog line. Anything that changes implemented behavior is a follow-up RFC
   linked to the archived parent, which remains immutable.
4. **Design linkage:** every RFC cites the `design/` sections it specifies. Deviations
   from design docs are called out explicitly in a "Deviations from design" section —
   the RFC wins once accepted, but the divergence must be visible.
5. **Agent rule:** coding agents implement **RFCs**, not design docs and not archive
   sketches. If needed spec is missing, that's a `DESIGN-GAP` → propose a draft RFC,
   don't improvise.
6. **The index** (`rfc/README.md`) lists active work and the archive; keep it updated in
   the same commit as any status or location change.
7. **Shared versioned resources are registered.** A *shared versioned resource* is anything
   satisfying all three of: (a) it carries a version identifier or is a closed vocabulary;
   (b) two documents drafted in parallel can move it independently and then cannot both land;
   (c) it is exported across a package boundary or embedded in a `schemas/*.json` document.
   Every such resource has a register section in `rfc/README.md`. A draft declares its claims
   on them in one machine-readable block (`rfc/archive/shared-resource-registers.md` §3) before writing
   a version into its body.
8. **Scripted edits assert.** Any scripted edit to a repo document asserts its anchor before
   replacing (`assert old in s`), or rewrites the file whole. Anchored patching is not used on a
   file another agent also edits. Before a commit message describes an edit, verify it with
   `git diff --stat`.

## Planning docs & the job log

For each RFC being implemented — and for standing jobs like `planning/exploration/` —
create `planning/<slug>/`:

- `plan.md` — the plan: task breakdown, sequencing, acceptance criteria, assignee.
- `log.md` — an **append-only running log**: dated entries for decisions made, problems
  hit, scope changes, review outcomes, handoffs. A new agent must be able to resume from
  `plan.md` + `log.md` alone.

On completion: distill outcomes into `docs/`, set the RFC to `implemented`, move the RFC
to `rfc/archive/` and its planning directory to `planning/archive/`. Never delete either.
Before archiving, clear the document's name from every other document's obligations: run
`git grep -ln '<slug>' rfc/ planning/ design/`, then mark each `## Discharges` row whose owner
names it discharged (with the SHA) or re-home it to an allowed owner. Name both in the archiving
commit body as `lifts: <path> — <what>` and `rehomes: <what> → <owner>`.

## Docs conventions

- `docs/` is organized by system, not by history. It is created by the first
  implementing change, not before.
- Every implementing change that alters behavior updates the relevant `docs/` page in
  the same change.
- When docs and code disagree, that is a bug in docs; fix it with the next change.

## Discharges

none

## Changelog

- 2026-08-09: created, adapted from cloud-clicker's RFC-0000 with the exploration gate
  added and `docs/` deferred until code exists.
- 2026-08-10: reconciled the exploration-to-slice gate with the post-slice continuation
  gates; explicitly allowed scoped, disposable research tooling.
- 2026-08-12: removed the pre-implementation note after the first implemented RFC
  established canonical system documentation.
