# chess-tabiya

> The tabiya is where theory ends and chess begins.

**Tabiya** *(n., from Arabic)*: the known position where an opening's theory runs
out and the real game starts. This project trains everything after it.

Don't memorize the opening — rehearse the game it creates: play past book against
human-like opposition, keep and compare every attempt, and convert your positions.

An exploration of a **chess phase rehearsal system**: drill openings, middlegames, and
endgames by playing the consequences — commit to a plan, play it out against human-like
resistance, rewind to a critical checkpoint, branch, compare the attempts, and replay.
Closer to a flight simulator or a music practice loop than to an analysis dashboard.
Stockfish is the judge, not the actor; Maia-3 and a human-game corpus supply the
opposition; drill packs supply the concepts, checkpoints, and objectives.

## Status

**Playable vertical-slice phase (since 2026-08-12).** Exploration verified the
whitespace hands-on: no reviewed product preserves attempts, compares them, or explains
why an objective flipped. The branch runtime, drill-pack format, engine-worker, and
drill-client RFCs are implemented. The drill client has its server orchestration, Svelte
episode screens, mock-backed browser acceptance, and Dockerized Maia/Stockfish packaging;
the owner's real-engine walkthrough found the fork/rewind core promising and exposed the
missing instructional layer plus concrete comparison/layout friction. The accepted app-shell
RFC begins the breadth-first rewrite. Product risks still include content authoring cost
and branch-UX comprehension in human use.

The whole state of that decision lives in **`planning/exploration/plan.md`** (the
question ledger) and **`planning/exploration/gates.md`** (hypotheses, kill criteria,
continuation gates).

## Project documentation

| Where | What |
|---|---|
| `planning/exploration/` | **Start here.** The go/kill job: questions, gates, append-only log |
| `design/` | Living thesis, training model, product shape, and full-spectrum breadth/IA docs + `BACKLOG.md` topic ledger |
| `design/research/` | Research dossiers, coverage matrix, source index, competitor matrix |
| `rfc/` | Active accepted implementation contracts and RFC lifecycle |
| `docs/` | Canonical description of the implemented development foundation |
| `archive/brief-v2/` | The frozen v2 brief that seeded this repo (59 files, checksummed, immutable) |

Agents: read `AGENTS.md`.

## Principles (short form)

- **Rehearsal over review** — the product dies if it becomes a Stockfish review screen with a rewind button.
- **A branch records an attempt**, not an engine line.
- **Stockfish judges; it does not play the human.**
- **Traceable research claims** — cited `[V]`/`[P]` evidence or explicit `[M]`; kill-criterion evidence gets escalated, never buried.
- **Explore before spec, spec before code.**
