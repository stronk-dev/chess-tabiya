# Chess Phase Drill Lab — corrected research, design and RFC package

**Research cut-off:** 2026-08-08  
**Status:** replacement for the earlier `chess-training-product-brief` package  
**Primary decision:** build a self-hosted research prototype focused on phase drilling, not a personal game-analysis coach.

## The correction

The earlier brief optimized around the wrong product identity: importing a player's history, discovering recurring weaknesses, and generating personalized exercises. That can be an optional content-selection layer later, but it is not the product.

This package instead defines a **chess rehearsal system** with four first-class modes:

1. **Opening drill:** learn theory together with its strategic purpose and continue into the characteristic middlegame.
2. **Middlegame drill:** play a strategic sequence, rewind to a critical checkpoint, take a different plan, and compare the consequences.
3. **Outcome drill:** repeatedly convert, hold, save, or resist realistic endgames.
4. **Trajectory drill:** connect an opening family to a characteristic middlegame and a plausible endgame on one causal spine.

The core interaction is not “show me the engine move.” It is:

> commit → play the consequence → rewind → branch → compare → replay under different resistance.

## Start here

- `00_CORRECTED_VERDICT.md` — build/no-build decision.
- `CHANGE_FROM_V1.md` — what the first package got wrong.
- `MASTER_BRIEF.md` — the complete brief in one file.
- `research/competitor_matrix.csv` — product comparison on the corrected axes.
- `implementation/vertical_slice_spec.md` — the first buildable slice.
- `handoff/CODEX_START_HERE.md` — implementation handoff.
- `handoff/CLAUDE_START_HERE.md` — research/content/design handoff.

## Decision in one paragraph

For a self-hosted or open-source tool, **yes, build it**. Paid SaaS products are useful benchmarks but are not a reason to abandon a local tool, and none of the reviewed products cleanly combines fast phase-specific drilling, persistent branches, whole-sequence replay, opening-to-structure continuation, and practical outcome training. The technical stack is straightforward. The difficult work is content design, opponent coherence over long branches, and feedback that explains tempo and structural consequences without degenerating into Stockfish labels plus generic prose.
