# E4 — Maia long-horizon coherence: experiment protocol

- **Feeds:** Q5 → E4, H5, K5, C5; prerequisite for the engine-workers RFC.
- **Date:** 2026-08-12. **Status:** protocol ready; harness in `tools/maia-harness/`
  (disposable research instrument per AGENTS.md); no runs executed yet.
- **The question:** can a runnable human-like policy produce *believable,
  plan-coherent* resistance over 10–20 plies — or does it play plausible single
  moves that add up to nonsense (the acknowledged failure mode, brief `arch/08`)?

## Conditions

| # | Policy | Settings |
|---|---|---|
| M1 | Maia-3 5M | Elo 1600, temp 0.8, topP 0.92 (the pack-fixture defaults) |
| M2 | Maia-3 5M | Elo 1800, same sampling |
| M3 | Maia-3 5M | Elo 2000, same sampling |
| M4 | Maia-3 23M | Elo 1800 (does model size buy coherence?) |
| C1 | Weakened Stockfish | UCI_LimitStrength, Elo 1800 — **the control H5 compares against** |
| C2 | Stockfish full | 100 ms/move — sanity ceiling, not human-like |

ChessMimic joins as M5 only if reproducible from its release (unverified — R41).

## Positions (16 roots)

Selection criteria: quiet-to-semi-quiet, plan-rich, no immediate tactics, both
sides playable — the positions where incoherence *shows*. Four families × four
roots, drawn from standard tabiyas (exact FENs in `tools/maia-harness/positions.json`):

1. **Carlsbad** (minority-attack vs central-play race) — the brief's pack-B family.
2. **Caro-Kann Advance** (c5/f6 breaks vs space consolidation) — pack-A family.
3. **IQP middlegames** (attack-with-the-IQP vs blockade-and-trade).
4. **Rook endings, 4v3 / 3v2 with play** (technique + plan persistence).

## Runs

Per condition × position: **5 self-play continuations of 24 plies** (policy plays
both sides), `per_branch`-style seeds recorded, full UCI settings logged. Output:
PGN + JSONL (per-move: chosen move, policy top-k with probabilities where
exposed, Stockfish eval at depth 18, clock).

≈ 6 conditions × 16 positions × 5 games = 480 continuations. Cheap in compute
(minutes on the homeserver for M1–M3; C1/C2 trivial).

## Metrics

**Automatic proxies (computed by the harness):**
- **Eval trajectory sanity** — per-side eval drift; flag > ±150 cp swings without
  a tactical justification (SF top-move disagreement spike).
- **Shuffle index** — fraction of reversible piece re-moves (Nf3-g1-f3 patterns)
  within any 8-ply window; the classic incoherence smell.
- **Plan-vector persistence** — direction of pawn-break preparation (which break's
  prerequisite squares/pieces improved) sustained across windows; crude but
  computable from deterministic features.
- **Termination realism** — resignation-equivalent blunder rate per condition.

**Blinded human review (the real metric, per E4's wording):**
- Reviewer sees anonymized, shuffled continuations (condition labels stripped,
  including the SF control) and rates each 1–5 on: (a) *plan coherence* — "could
  you name the plan each side pursued?"; (b) *believability at stated level*;
  (c) *would this be useful resistance in a drill?*
- Reviewer: Marco first; a stronger reviewer later upgrades confidence (queue 9).
- 480 is too many to review — reviewer rates a random 6 per condition (36 total),
  automatic metrics cover the rest.

## Decision rules (preregistered)

- **E4 met:** any Maia condition averages ≥3.5/5 on believability AND ≥3/5 on
  plan coherence, and beats C1 (weakened SF) on believability — H5 supported.
- **E4 met with caveats:** Maia beats C1 but coherence <3 — opponent needs the
  policy-mixer (plan-compatibility guard); engine-workers RFC gains a section;
  cost noted, not killed.
- **K5 evidence:** no Maia condition beats weakened SF on believability, or
  shuffle index is pervasive at all Elos — escalate per the kill-criterion law;
  the opponent story needs redesign before the engine-workers RFC.

## Provenance

Everything in this protocol: `[M]` design reasoning + archive citations; runs
will produce `[V]` measurements. Harness runs on the owner's homeserver
(models + compute); the container pins maia3 + Stockfish versions in the run log.
