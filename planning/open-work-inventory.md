# Open-work inventory — 2026-08-15

**Why this file exists.** On 2026-08-15 claude told the owner: *"Of the ~50 open
ledger rows, very few are RFC-shaped… the frictions wave is the genuine
remaining RFC work."* The owner challenged it as unverified. It was. This file
is the row-by-row check that should have been done first, classified by the
**status glyph in the status column** — not by text-matching row bodies, which
is what produced the bad count.

**The correction, plainly:** roughly **16 rows are genuine, RFC-shaped, and
unscheduled** — not "very few". Several are the owner's own recent ideas, which
is precisely why the claim mattered: it buried them.

## What the ledger actually holds

83 rows carry `💡` or `📐`. That number is itself misleading in the *opposite*
direction from what the owner feared:

| Bucket | Count | Real state |
|---|---|---|
| `📐` Core systems (rows 1–23) | 23 | **Mostly SHIPPED with stale glyphs.** The section header still reads "awaiting exploration → RFCs"; several row bodies say "implemented 2026-08-12" while the glyph says designed. Needs an evidence-based sweep against `docs/` |
| In the frictions wave (drafting) | ~7 | The four friction batches + cursed wins + the blunder-guard knob |
| Gamification | 3 | Encounter unlocks, Spire map, satirical ceremony — **post-session by owner ruling** |
| Exploration-owned open questions | 8 | Need research, not RFCs |
| Parked by choice | ~4 | Events layer, time-pressure, pricing datapoints, personal-model opponent (watch row) |
| Design-tier law promotions | 2 | Declared-vs-executable law; graduation-gate statement. Owner-tier text, not RFCs |
| **Genuine unscheduled RFC-shaped work** | **~16** | Listed below |

## The ~16 that are real, unscheduled feature work

Ordered by how directly they trace to something the owner asked for.

1. **Game story — a finished game as ~8 pivotal slides.** Owner, 2026-08-14,
   from the taketaketake teardown. Pivotal detection already ships; this is the
   presentation over it.
2. **Own-game review — import one game into the rehearsal loop.** Owner,
   2026-08-14: *"we said it's not a game review, but we have all the pieces."*
   The v1 identity is rejected; this is the rewind/classifier framing of it.
3. **Discovered-threat visualisation.** Owner's ChessUp conversation. The ledger
   itself calls it *"the strongest of the three, and cheapest"* of the
   assistance batch.
4. **Multi-branch view shapes** (tree / carousel / stack / grid / fractal).
   Owner, 2026-08-13: the view follows the shape being examined, and there are
   three shapes.
5. **Branch ranking for pruning.** Owner, 2026-08-13: *"we need good UX on
   ranking all the branches."*
6. **LLM as the guided-mode voice.** Owner, 2026-08-13. Guided mode itself is
   design-homed in `05` §3b; the voice is not.
7. **Checkpoint/compare explanation sidebar** with selectable evidence layers.
   Owner walkthrough, 2026-08-11.
8. **Comparison column ceiling** — `n-way-comparison.md` caps a set at 8
   branches. Row is flagged **"owner ruling wanted"** and has been sitting.
9. **`concept_violation` does two jobs** — a timing error and a plan error share
   one classification. Surfaced, never fixed; the mechanism that would have
   caught it was struck.
10. **Prediction distribution delivery** — the withholding barrier truncates the
    event stream at the first engine-feedback event.
11. **Predicate vocabulary wave 2** — collected from the endgame shape wave; the
    format-gap reports are the predicate roadmap.
12. **What-if both-sides steering** as an honest-actor branch.
13. **Last-played recency in explorer evidence** — 365chess adoption candidate.
14. **Position-scan import** (chessvision.ai shape) for Create.
15. **Resistance spectrum completion** — `annoying` / `fallible` policies; three
    of five promised policies ship, `perfect_tablebase` landed 2026-08-14.
16. **Pack A opponent-policy discrepancy** — `anti-caro-advance.json` ships
    `theory_strict` against a Line Drill expectation. Defect-shaped, small.

## Known ledger-hygiene debt (found while doing this)

- **Core-systems glyph sweep owed.** ~20 rows read `📐 designed / awaiting RFC`
  for systems that shipped months of work ago. Fix must be evidence-based —
  flip only rows with a canonical `docs/` file — not a blanket pass.
- **Text-matching is not a classification method.** Excluding rows whose *body*
  mentions anything shipped silently dropped genuinely open rows, including the
  Spire map. Classify by the status cell.
- Three glyph corrections already applied 2026-08-15 (8 adoption rows shipped
  but marked candidate; 4 rows design-homed in `05` but marked candidate).

## The honest summary

The product's *risk* is not missing features — it is a ledger that cannot be
trusted to answer "what is left", in both directions at once: shipped work
reading as open, and open work being summarized away. The reconciliation gate
catches the first. This file exists because nothing was catching the second.
