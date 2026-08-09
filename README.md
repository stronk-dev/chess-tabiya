# chess-drills

> Do not just learn the move. Rehearse the game it creates.

An exploration of a **chess phase rehearsal system**: drill openings, middlegames, and
endgames by playing the consequences — commit to a plan, play it out against human-like
resistance, rewind to a critical checkpoint, branch, compare the attempts, and replay.
Closer to a flight simulator or a music practice loop than to an analysis dashboard.
Stockfish is the judge, not the actor; Maia-3 and a human-game corpus supply the
opposition; drill packs supply the concepts, checkpoints, and objectives.

## Status

**Exploratory phase. No code.** We are deciding whether to build this at all — whether
the integrated rehearsal loop is actually novel and valuable, whether branching play
against a human model is feasible over 10–20 plies, whether semantic phase detection and
theory-to-middlegame bridging can work, and what shape (paid / OSS / self-hosted, web /
mobile) the product should take if it survives.

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
- **Evidence or `[M]`** on every claim; kill-criterion evidence gets escalated, never buried.
- **Explore before spec, spec before code.**
