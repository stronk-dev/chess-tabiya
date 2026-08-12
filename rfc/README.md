# RFC index

Process: `rfc/0000-rfc-process.md`. Template: `rfc/template.md`.

## Active

| RFC | Status | Parent | Implementation |
|---|---|---|---|
| `0000-rfc-process.md` | accepted | — | process |
| `authored-explanation-surface.md` | draft | amends `archive/authored-feedback-delivery.md` | program #2 / gate B4 / primitive F1 |


**Exploration gate opened by owner ruling 2026-08-12** (logged in
`planning/exploration/log.md`): E1 met, E2 advisory, E3/E4/E5 accepted as in-flight
risk with their experiments folded into implementation. Previously: The repo is in the exploratory phase.
The first experimental vertical-slice RFC may be drafted only after the
exploration-to-slice gate in `planning/exploration/gates.md` passes, or an owner ruling
(logged in `planning/exploration/log.md`) opens it early. Product RFCs remain closed until
the slice passes the later continuation gates. See the "Exploration gate" section of
`0000-rfc-process.md`.

**Breadth sequencing ruling, 2026-08-11:** the owner opened design and RFC
planning for the complete B1–B8 product surface in
`design/03-product-breadth.md`. This does not waive RFC review or authorize
unspecified implementation; it supersedes the assumption that the next work is
content for one narrow slice. Breadth RFCs must preserve the global shell and
name the B-gates they complete before code begins.

## Withdrawn

Kept for the record (RFC-0000: `withdrawn` = abandoned, not superseded). Their
findings are salvaged into content-era BACKLOG rows — read the withdrawal notes
before re-attempting this territory.

| RFC | Why |
|---|---|
| `withdrawn/authoring-contracts-v03.md` | Specified an authored vocabulary with no authored content to design against; three reviews, three variations of that fault |
| `withdrawn/evidence-composer.md` | Prerequisite withdrawn; the packet abstraction proved unnecessary for v1 |

## Archive

| RFC | Status | Canonical docs link |
|---|---|---|
| `archive/branch-runtime.md` | implemented | `docs/branch-runtime.md` |
| `archive/drill-pack-format.md` | implemented | `docs/drill-pack-format.md` |
| `archive/engine-workers.md` | implemented | `docs/engine-workers.md` |
| `archive/drill-client.md` | implemented | `docs/drill-client.md` |
| `archive/app-shell.md` | implemented | `docs/app-shell.md` |
| `archive/explanation-grounds.md` | implemented | `docs/explanation-grounds.md` |
| `archive/authored-feedback-delivery.md` | implemented | `docs/drill-client.md`, `docs/drill-pack-format.md` |

## The archive sketches are quarry, not RFCs

`archive/brief-v2/rfcs/RFC-0001..0008` and `archive/brief-v2/adrs/ADR-0001..0006` are
pre-validation decision sketches from the brief. They are design-tier material: future
real RFCs mine them for content and cite them, but nothing in `archive/` has RFC status.
Their topics are tracked as rows in `design/BACKLOG.md`; the ADR decisions are tracked
in that file's Provisional decisions table with revisit triggers.

## Deferred decisions register

Decisions deliberately punted, each with a named owner so defaults are not chosen
silently later.

| Deferred decision | Origin | Owner | Why it matters |
|---|---|---|---|
| Server language | ✅ resolved 2026-08-12: **TS core + Go workers** doctrine (chess-semantics code is TS/shared runtime; self-contained data-format workers are Go; Python only inside Maia sidecar containers) | — | `design/research/stack-selection.md` |
| Client framework | ✅ resolved 2026-08-12: **Svelte 5** + Vite | — | `design/research/stack-selection.md` |
| Client routing | ✅ resolved 2026-08-11: **hand-rolled history-API router** (~100 lines); no SvelteKit migration, no routing dependency | — | `rfc/archive/app-shell.md` AS-C5 |
| SQLite vs PostgreSQL for runs/branches | ✅ resolved 2026-08-12: **SQLite ratified**. PostgreSQL remains a bounded follow-up for multi-host deployment or demonstrated write contention. Ruling and proposal: `planning/archive/branch-runtime/log.md` | — | `docs/branch-runtime.md` |
| Source model, deployment, monetization, and content/data rights | exploration Q2 | Marco | Gates public release; GPL/AGPL obligations constrain combinations but do not prohibit charging |
