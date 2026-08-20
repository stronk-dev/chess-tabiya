# Campaign & primitives — the research owed before design

**Status: research tier reconciled 2026-08-20.** The session-independent evidence already earned
`design/06-campaign.md`; that document is intent, not implementation authority. No campaign RFC may
be drafted until the narrowed R6–R8 experiential closure feeds platform R14/O10.

On 2026-08-15 the owner generated a large, coherent cluster of product ideas —
move primitives, "build your coach", campaign constraints, time controls, the
roguelike frame — and then said the right thing about them: *"we did a lot of
ideating and we need to do more research before we can turn that into design and
RFC."* This file is that research queue. Every row is a question that must be
answered with evidence before the cluster earns a design doc, per RFC-0000's
exploration gate and law 1 (*no RFC before the gate; "no RFC from a GAP row"
applies to open questions, not just missing research*).

Ledger rows for the ideas themselves live in `design/BACKLOG.md`. This file
holds only *what must be learned first*.

## Ordering principle

The standing sequencing ruling governs: **the campaign wraps the core loop**, so the three
remaining experiential residues wait on an interaction-correct owner session with real content.
The 2026-08-16 app audit did play, terminate, fork and compare a four-ply schema fixture; that proves
the mechanic can execute, not that a real loop holds attention. Questions independent of the
session are already answered below.

## Now — session-independent

| # | Question | What would settle it | Why it blocks design |
|---|---|---|---|
| R1 ✅ | **ANSWERED `[V]` 2026-08-15 — the whole census costs 29 µs/ply.** Cost is not an argument in either direction; ~70 of 290 lines are extraction of code already in the tree. Selectivity measured (overload sharpest at ≤6.7%) but **later shown not to predict usefulness** (R3). `design/research/move-primitive-computability.md` | Extract the arithmetic already trapped in `pivotal.ts:33-53`, `compare-strips.ts:40-50` and the dead `structuralDelta`/`vacationReading` (`structure.ts:425-447`); measure per-ply cost on real spines | The primitives taxonomy is currently a list of plausible ideas. Some are cheap censuses, some need search. Designing hints before knowing which is which repeats the `timingWindow` mistake |
| R2 ✅ | **ANSWERED `[V]` 2026-08-15 — NO, claude's hypothesis refuted.** Perfect recall (9/9), **98.7% false positives**, 0.0% precision under the sharpest filter. The target square set is the judgment; routing renders an authored destination and never detects intent. `design/research/move-primitive-computability.md` | Take the owner's own example — a knight retreating to arrive well in two — find real instances in the 35-pack corpus and check whether a distance delta identifies them without flagging noise | The claim "repositioning is graph distance, not intent" is mine and untested. If it produces false positives on every quiet move it is not a primitive |
| R3 ✅ | **ANSWERED `[V]` 2026-08-15 — 89.0% at the observation level.** Census hints are true by construction and mostly uninformative. Two results outlive the number: selectivity does NOT predict usefulness (ρ = −0.143), and any "is this informative" test must compare against the moves *not played*, or it prefers the wrong instruments. `transition-primitives` therefore shipped the census on request and took the pre-authorised no-live-marker fallback. `design/research/census-hint-false-positives.md` | Generate census-only hints over committed spines; count how many are true-but-useless ("this move attacks a defended pawn") | A hint that is honest and worthless is still a bad hint. This bounds how much of the assistance ladder census can actually carry |
| R4 ✅ | **ANSWERED `[V]` 2026-08-15 — NO.** Measurable only in *decided* positions; 10.2% of out-of-range positions qualify. Design consequence: the cluster's doc must carry a **difficulty-availability axis** (measured / authored / neither), not a difficulty scalar. | The experiment `resistance-spectrum` §7b already specifies: fixed-depth Stockfish with cleared hash, measured for per-ply cost **and for agreement with the tablebase classifier where both exist** | Every campaign idea assumes difficulty is a quantity. If it is only measurable in endgames, "boss encounters" are endgame-only and the design changes shape |
| R9 ✅ | **ANSWERED `[V]` 2026-08-15 — the oracle discriminates but does not reach.** Separates engine-level positions with force (r = −0.079); usable coverage ends ply ~20, zero by ply 27, and a 23× larger population buys only 2–4 plies. **Design consequence: the middlegame has no oracle of either kind — difficulty there must be AUTHORED, and the cluster's difficulty-availability axis now has a third value that is the common case.** | `design/research/human-outcome-coverage-depth.md` |
| R5 ✅ | **ANSWERED `[V]` 2026-08-15 — bit-identical.** 105/105 keys across 4,260 probes, three bands, two containers, two MultiPV widths; max drift 0.0. The instability is in the sampled `bestmove` (unseeded RNG, 34.3% stable), so by-record determinism does real work for `human_common` and none for `practical_resistance`. `design/research/maia-policy-scalar-stability.md` | The acceptance criterion in `resistance-spectrum` measures it rather than assuming | Both `practical_resistance` and any human-likeness claim rest on it. Ledgered separately as a standing question |

| R11 ✅ | **ANSWERED `[V]` 2026-08-16 — REFUTED.** *"Does a conjunction of two independent primitives beat either alone on R3's T/C/D gate?"* — **no, it is worse on all three axes.** Best conjunction **35.7%** precision / **2.73×** discrimination vs **69.4%** / **12.64×** for the best *single* primitive; only 7 of 55 pairs measurable, median lift **0.66×**, **0 of 7** beat their own two components. The premise fails first: the **false positives multiply at the same rate the specificity does**, and no triple of transition primitives reaches 10 witnesses in 721 transitions. Also analytic: **a lens read before the move cannot discriminate**, only select. `design/research/conjunction-hypothesis.md` | Re-run the R3 harness over every pair of the six leaves, plus every leaf × shipped structural lens, on the current corpus — precision, discrimination against the moves not played, and the independence premise | The campaign's whole deck/synergy argument rested on it (`campaign-effect-vocabulary.md` §4, `[M]`). **Registered here 2026-08-16 — it was born inside a dossier and had never been queued, which is [[D286]]** |

**All six session-independent questions are answered.** Four of the six refuted or
inverted the assumption they were testing. What remains is the post-session set below.

## Experiential closure — the loop must be felt on real content

| # | Question | Why it waits |
|---|---|---|
| R6 | **NARROWED:** does a *count* budget on retries preserve or destroy punishment-free experimentation? Rewind location and “play the consequence before rewind” are already resolved; the latter is the core rule. | It touches a thesis-level property and an in-run invariant (`05` §1). The session must test only the remaining count/scarcity question rather than reopening the settled location/play-out rules. |
| R7 | **NARROWED:** when the preset/session ceiling withholds a module the learner wants, is the absence legible and interesting or merely frustrating? | D619/R3 now settle the architecture: presets cannot raise a ceiling, Theory only/empty are first-class, rarity cannot price value. The session tests scarcity tuning and payoff, not whether the primitive/configuration split exists. |
| R8 | Is the drill loop itself worth wrapping? | A fixture run executed on 2026-08-16 (`planning/research-queue.md` Q-01; `app-reality-check.md` §6), correcting the stale “nobody played” claim. What remains is the owner playing real content to termination, with a real engine and invariant review, after D537/D573 restore exact interaction. If that loop does not hold attention, the campaign is scaffolding around a void. |

## Explicitly not research — already decided

- **Honesty policy vs inventory are separate axes.** Deck-building operates on
  *availability*; it never touches what may honestly be shown or when
  (`05` §3/§3a). This is a design constraint, not an open question.
- **ADR-0007 holds by construction.** Progression is unlocked by playing, never
  purchased. The satirical ceremony parodies the ritual; it may not become one.
- **Law 8 applies inside the campaign.** An unlocked "hint" is a grounded
  primitive the learner has access to, never an LLM opinion they bought.

## What the answers feed

R1–R5/R9/R11 earned **one design doc** — `design/06-campaign.md` — rather than six ledger
rows reassembled from memory. R6–R8 now feed platform R14/O10: they either support shipping that
wrapper in 1.0, narrow it, or defer it. Only an O10 “ship” ruling may open F10; the old thematic
queue is not RFC authority.
