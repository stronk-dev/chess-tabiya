# Agent guide — chess-drills

A **chess phase rehearsal system**: drill openings, middlegames, and endgames by playing
the consequences, then rewind and try again. The core loop is
commit → play the consequence → rewind → branch → compare → replay under different resistance.

**This repo is in the exploratory phase. We are deciding IF and WHAT to build, not
building.** No product code exists or may be written. The current job is driving a
go/kill/reposition decision — see `planning/exploration/plan.md`.

## Repo structure

| Tier | Directory | Current state |
|---|---|---|
| Design | `design/` | 3 living docs + `BACKLOG.md` topic ledger + `research/` coverage matrix |
| RFC | `rfc/` | Process + template only. Active table **empty by rule** — drafting is gated on exploration (see `rfc/0000-rfc-process.md` §Exploration gate) |
| Planning | `planning/exploration/` | THE active job: question ledger (`plan.md`), tracked hypotheses/kill criteria (`gates.md`), append-only `log.md` |
| Docs | `docs/` | Does not exist — nothing has been built; created by the first implementing change |
| Archive | `archive/brief-v2/` | The frozen v2 brief (59 files, checksummed). Immutable. Evidence base and quarry |

## Your workflow

1. Pick a question from `planning/exploration/plan.md` (or the one you're assigned).
2. Do the research/analysis. Hands-on beats desk research — the archive's research is
   desk-only (`[P]`) and Phase 0 exists to upgrade or refute it.
3. Land the result as a dossier in `design/research/` with `[V]/[P]/[M]` provenance on
   every claim, and add/update its row in the coverage matrix (`design/research/README.md`).
4. Update `planning/exploration/gates.md` if the evidence touches a hypothesis, kill
   criterion, or continuation gate; update statuses in `design/BACKLOG.md`.
5. Append a dated entry to `planning/exploration/log.md`: what landed, what changed,
   what's blocked, what's next.

New idea mid-task? BACKLOG row first ("an idea missing from the ledger is a process
bug"), then continue.

## Reading order (minimum to be productive)

1. `planning/exploration/plan.md` — the questions and their status (5 min)
2. `design/00-thesis.md` — what the product is and the current verdict (5 min)
3. `planning/exploration/gates.md` — what would kill or confirm it (5 min)
4. `rfc/0000-rfc-process.md` — the tiers and the exploration gate (5 min)
5. Archive files cited by your question, as needed.

## Non-negotiable laws

1. **No implementation before an accepted RFC; no RFC before the exploration gate.**
   "No RFC from a GAP row" applies to open questions, not just missing research.
2. **`archive/` is immutable.** Supersede in living tiers; never edit, never cite
   `MASTER_BRIEF.md` (it's a concatenation — cite the numbered files).
3. **Every factual claim carries a URL or an explicit `[M]`** (model knowledge).
   Provenance axes per `design/research/README.md`.
4. **Every idea gets a ledger row** in `design/BACKLOG.md` the moment it's uttered.
5. **Kill-criterion evidence is logged and escalated, never rationalized away.** Finding
   evidence against the thesis is the job working, not a problem.
6. **Logs are append-only.** `planning/exploration/log.md` entries are never edited or
   deleted.
7. **No LLM-manufactured chess truth** (standing law from ADR-0005): LLMs may render
   validated evidence but may not create ungrounded strategic claims or grade moves.
   "Stockfish: +0.54 / Maia: 31% / LLM: 'Ne5 centralizes the knight'" is a dashboard,
   not a drill — the named anti-pattern this product must not become.

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
