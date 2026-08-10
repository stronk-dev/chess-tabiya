# chess-tabiya

> The tabiya is where theory ends and chess begins.

**Tabiya** *(n., from Arabic)*: the known position where an opening's theory runs
out and the real game starts. This project trains everything after it.

Don't memorize the opening — rehearse the game it creates. Play past book against
human-like resistance, rewind, branch, compare every attempt, and finish what you
start.

An exploration of a **chess phase rehearsal system**: drill openings, middlegames, and
endgames by playing the consequences — commit to a plan, play it out against human-like
resistance, rewind to a critical checkpoint, branch, compare the attempts, and replay.
Closer to a flight simulator or a music practice loop than to an analysis dashboard.
Stockfish is the judge, not the actor; Maia-3 and a human-game corpus supply the
opposition; drill packs supply the concepts, checkpoints, and objectives.

## Status

**Foundation-specification phase (go verdict on novelty, 2026-08-12).** Exploration
verified the whitespace hands-on: no product preserves attempts, compares them, or
explains why an objective flipped. First RFCs (`rfc/drill-pack-format.md`,
`rfc/branch-runtime.md`) are in draft; no product code until they're accepted. Shape
if built: open source, free, self-hosted, browser-WASM engines. Remaining risks
tracked as gates: authoring cost, opponent long-horizon coherence, branch-UX
comprehension.

The whole state of that decision lives in **`planning/exploration/plan.md`** (the
question ledger) and **`planning/exploration/gates.md`** (hypotheses, kill criteria,
continuation gates).

## Project documentation

| Where | What |
|---|---|
| `planning/exploration/` | **Start here.** The go/kill job: questions, gates, append-only log |
| `design/` | Living design docs (`00-thesis`, `01-training-model`, `02-product-shape`) + `BACKLOG.md` topic ledger |
| `design/research/` | Research dossiers, coverage matrix, source index, competitor matrix |
| `rfc/` | RFC process + template. No active RFCs — drafting is gated on exploration |
| `archive/brief-v2/` | The frozen v2 brief that seeded this repo (59 files, checksummed, immutable) |

Agents: read `AGENTS.md`.

## Principles (short form)

- **Rehearsal over review** — the product dies if it becomes a Stockfish review screen with a rewind button.
- **A branch records an attempt**, not an engine line.
- **Stockfish judges; it does not play the human.**
- **Traceable research claims** — cited `[V]`/`[P]` evidence or explicit `[M]`; kill-criterion evidence gets escalated, never buried.
- **Explore before spec, spec before code.**
