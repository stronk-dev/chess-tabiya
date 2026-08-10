# RFC index

Process: `rfc/0000-rfc-process.md`. Template: `rfc/template.md`.

## Active

| RFC | Status | Parent |
|---|---|---|
| `0000-rfc-process.md` | accepted | — |

**The Active table is otherwise empty by design.** The repo is in the exploratory phase.
The first experimental vertical-slice RFC may be drafted only after the
exploration-to-slice gate in `planning/exploration/gates.md` passes, or an owner ruling
(logged in `planning/exploration/log.md`) opens it early. Product RFCs remain closed until
the slice passes the later continuation gates. See the "Exploration gate" section of
`0000-rfc-process.md`.

## Archive

| RFC | Status | Canonical docs link |
|---|---|---|
| — | | |

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
| Server language (Python/FastAPI vs Go/Rust vs hybrid) | `archive/brief-v2/12_SYSTEM_ARCHITECTURE.md` ("avoid optimizing language choice before the drill runtime is validated") | first runtime RFC | Locks the engine-orchestration stack |
| Web framework (Vite vs Next.js) | `archive/brief-v2/12_SYSTEM_ARCHITECTURE.md` | first client RFC | Minor; decide at scaffold time |
| SQLite vs PostgreSQL for runs/branches | `archive/brief-v2/12_SYSTEM_ARCHITECTURE.md` | first runtime RFC | Single-user self-hosted may not need Postgres |
| Source model, deployment, monetization, and content/data rights | exploration Q2 | Marco | Gates public release; GPL/AGPL obligations constrain combinations but do not prohibit charging |
