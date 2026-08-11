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
| Design | `design/` | 4 living docs (including the breadth/IA contract) + `BACKLOG.md` topic ledger + `research/` coverage matrix |
| RFC | `rfc/` | No active product RFC; six implemented systems frozen in `rfc/archive/` |
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

New idea mid-task? BACKLOG row first ("an idea missing from the ledger is a process
bug"), then continue.

## Reading order (minimum to be productive)

1. `planning/exploration/plan.md` — the questions and their status (5 min)
2. `design/00-thesis.md` — what the product is and the current verdict (5 min)
3. `design/03-product-breadth.md` — complete surface map, IA, and B1–B8 gate
4. `planning/exploration/gates.md` — what would kill or confirm it (5 min)
5. `rfc/0000-rfc-process.md` — the tiers and the exploration gate (5 min)
6. Archive files cited by your question, as needed.

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
