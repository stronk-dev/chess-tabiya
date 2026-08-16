# Agent guide — chess-tabiya

**Tabiya** — a chess phase rehearsal system: drill openings, middlegames, and endgames by playing
the consequences, then rewind and try again. The core loop is
commit → play the consequence → rewind → branch → compare → replay under different resistance.

**Phase: breadth architecture after foundation implementation** (since
2026-08-11). The branch runtime is
implemented and documented in `docs/branch-runtime.md`; drill-pack format v0.2 is
implemented and documented in `docs/drill-pack-format.md`; engine workers are
implemented and documented in `docs/engine-workers.md`. The drill client is
implemented and documented in `docs/drill-client.md`; its owner walkthrough
produced a qualified go-to-iterate verdict. The application shell is implemented
and documented in `docs/app-shell.md`. Grounded comparison explanations are
implemented and documented in `docs/explanation-grounds.md`; B4 remains unmet
until authored content supplies the vocabulary and timing cases.
Doctrine: TS core + Go workers, Svelte 5, AGPL-3.0, Maia as containerized UCI
sidecar. The exploration job continues alongside (E4 harness, gates) — see
`planning/exploration/plan.md`.

## Repo structure

| Tier | Directory | Current state |
|---|---|---|
| Design | `design/` | 6 living docs (including the breadth/IA and in-run-experience contracts) + `BACKLOG.md` topic ledger + `research/` coverage matrix |
| RFC | `rfc/` | No active product RFC; 23 implemented RFCs frozen in `rfc/archive/` |
| Planning | `planning/exploration/` | THE active job: question ledger (`plan.md`), exploration/continuation gates and kill criteria (`gates.md`), append-only `log.md` |
| Docs | `docs/` | Canonical description of what exists; development foundation now documented |
| Archive | `archive/brief-v2/` | The frozen v2 brief (59 files, checksummed). Immutable. Evidence base and quarry |

## Your workflow

1. Pick a question from `planning/exploration/plan.md` (or the one you're assigned).
2. Do the research/analysis. Hands-on beats desk research — the archive's research is
   desk-only (`[P]`) and Phase 0 exists to upgrade or refute it.
3. Land the result as a dossier in `design/research/` using the lightweight evidence
   labels and citation rules in `design/research/README.md`, and add/update its row in
   the coverage matrix.
4. Update `planning/exploration/gates.md` if the evidence touches a hypothesis, kill
   criterion, or continuation gate; update statuses in `design/BACKLOG.md`.
5. Append a dated entry to `planning/exploration/log.md`: what landed, what changed,
   what's blocked, what's next.

**`design/BACKLOG.md` is a shared ledger, not an intent doc** (clarified 2026-08-15 after a
verification pass found the completion protocol and law 5 contradicting each other for any
non-owner implementer). Law 5 protects the *intent* documents — `00`–`06` — which only the
owner or claude-on-an-owner-ruling may write. **The ledger is a register every tier writes
to**, exactly as `rfc/README.md` is, and an implementer flipping the rows its own commit ships
is the protocol working rather than a law-5 breach.

**RFC completion protocol includes the ledger AND the log.** Archiving an
implemented RFC flips the `design/BACKLOG.md` rows it ships (💡→✅ with a one-line
summary) **and appends its entry to `planning/exploration/log.md`** in the same
commit. **The log clause was added 2026-08-15 by claude on measured evidence and
is the owner's to veto:** the reconciliation gate found the 2026-08-14 ledger fix
worked — 10 of 11 waves flowed back — while the failure **moved one tier up**, with
none of the eleven named in `design/03-product-breadth.md` or
`planning/exploration/gates.md`. `engine-request-contract` was the single RFC that
flowed back to nothing, and it was **also the only one with no log entry** — the
absence predicted the failure exactly, which is what makes it a cheap guard rather
than more ceremony. The original ledger clause stands on its own evidence: the
2026-08-14 reverse-trace found flow-back died exactly where it was left to a later
pass, while the RFC registers, edited in-commit, stayed perfect.

**Content waves have the same closeout, and this clause exists because they did not.**
A content wave flips the `design/BACKLOG.md` rows it fixes and appends its entry to
`planning/content-era/log.md` **in the commit that ships the content**. **Added
2026-08-16 by claude on measured evidence and the owner's to veto:** cluster F ran on
2026-08-15 (`41afe00`) and `planning/work-register.md` still called it *"queued, never
launched"* a day later — a second wave was commissioned and re-did the verification
before discovering the first had shipped. The RFC lifecycle had both halves of a
closeout and content had neither, which made it **the only tier of work in this repo
that can complete invisibly**. The cost was one duplicated wave; the guard is one
commit's discipline. (The re-run was not wasted — it found nine entries carrying claims
pinned to a stale corpus, four of them materially false — but that was luck, not design.)

New idea mid-task? BACKLOG row first ("an idea missing from the ledger is a process
bug"), then continue.

## Reading order (minimum to be productive)

1. `planning/exploration/plan.md` — the questions and their status (5 min)
2. `design/00-thesis.md` — what the product is and the current verdict (5 min)
3. `design/03-product-breadth.md` — complete surface map, IA, and B1–B8 gate
4. `design/05-in-run-experience.md` — the generic board experience beneath every
   surface: six invariants, five regions, and the assistance ladder
5. `planning/exploration/gates.md` — what would kill or confirm it (5 min)
6. `rfc/0000-rfc-process.md` — the tiers and the exploration gate (5 min)
7. Archive files cited by your question, as needed.

## Non-negotiable laws

1. **No implementation before an accepted RFC; no RFC before the exploration gate.**
   "No RFC from a GAP row" applies to open questions, not just missing research.
2. **`archive/` is immutable.** Supersede in living tiers; never edit, never cite
   `MASTER_BRIEF.md` (it's a concatenation — cite the numbered files).
3. **Every factual claim in a research dossier is traceable.** Use an inline URL or
   living/archive source reference plus `[V]`/`[P]`, or mark unsupported model knowledge
   `[M]`. Living design synthesis may cite a source once for a clearly bounded paragraph
   or section. Rules: `design/research/README.md`.
4. **Every idea gets a ledger row** in `design/BACKLOG.md` the moment it's uttered.
5. **Design tier is intent tier.** `design/` docs are authored by the owner or
   by claude on the owner's ruling; implementing agents propose changes through
   an RFC or a BACKLOG row, never by writing design docs directly (RFC-0000
   agent rule). Gate definitions are mirrored into
   `planning/exploration/gates.md` so the gate surface is never split.
6. **Kill-criterion evidence is logged and escalated, never rationalized away.** Finding
   evidence against the thesis is the job working, not a problem.
7. **Logs are append-only.** `planning/exploration/log.md` entries are never edited or
   deleted.
8. **No LLM-manufactured chess truth** (standing law from ADR-0005): LLMs may render
   validated evidence but may not create ungrounded strategic claims or grade moves.
   "Stockfish: +0.54 / Maia: 31% / LLM: 'Ne5 centralizes the knight'" is a dashboard,
   not a drill — the named anti-pattern this product must not become.

Research harnesses and non-production UX prototypes are permitted before an RFC only
under `rfc/0000-rfc-process.md` §Exploration gate. Label them disposable, tie them to a
ledger question, and log them; they are evidence instruments, not implementation.

## Rejected — don't reintroduce

From `archive/brief-v2/CHANGE_FROM_V1.md` and `00_CORRECTED_VERDICT.md`:

- **The v1 identity**: personal game-analysis AI coach (mine games → detect weaknesses →
  generate episodes). Legitimate adjacent product; not this one. Personal history may
  later *select* packs; the product works without it.
- **Mandatory game import** as the entry point.
- **Bulk corpus ingestion first.** Stage 0 uses the Lichess explorer API + curated PGNs;
  billions of games are not a prerequisite ("compute is not the limiting factor" —
  neither is data).
- **LLM-generated strategic lessons** as content.
- **A tactics puzzle trainer or lesson content** (`design/00-thesis.md` §§70,
  93-94 — added here 2026-08-12 after an agent correctly found the prohibition
  was cited to this file but lived only in the thesis). The CC0 puzzle corpus is
  usable, but re-cut as *play-the-consequence*, never as find-the-tactic.
- **Weakened Stockfish as the default opponent** (samples weaker engine moves; does not
  model human choice).
- **"An engine review screen with a rewind button"** — the failure shape the whole
  product dies in.
- **"Paid products exist" as a kill signal** — the v1 brief's calibration error; the
  kill criteria in `gates.md` are the real ones.

## Command authority

- Read-only exploration (ls, grep, reading any file) — always fine.
- Writing/editing living-tier docs per the workflow above — fine.
- Touching `archive/` — never.
- Committing — fine on request or at natural checkpoints; never push, publish, deploy,
  or open a PR unless Marco explicitly asks.
