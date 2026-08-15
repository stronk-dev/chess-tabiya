# Campaign & primitives — the research owed before design

**Status: research tier. Nothing here may become an RFC yet.**

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

The standing sequencing ruling governs: **the campaign wraps the core loop**, so
questions whose answers change with the owner's first play session are ordered
*after* it. Questions independent of the session can run now.

## Now — session-independent

| # | Question | What would settle it | Why it blocks design |
|---|---|---|---|
| R1 | Which move primitives are genuinely computable, and at what cost per position? | Extract the arithmetic already trapped in `pivotal.ts:33-53`, `compare-strips.ts:40-50` and the dead `structuralDelta`/`vacationReading` (`structure.ts:425-447`); measure per-ply cost on real spines | The primitives taxonomy is currently a list of plausible ideas. Some are cheap censuses, some need search. Designing hints before knowing which is which repeats the `timingWindow` mistake |
| R2 | Does routing (distance-to-target-square) actually capture the reposition case? | Take the owner's own example — a knight retreating to arrive well in two — find real instances in the 35-pack corpus and check whether a distance delta identifies them without flagging noise | The claim "repositioning is graph distance, not intent" is mine and untested. If it produces false positives on every quiet move it is not a primitive |
| R3 ✅ | **ANSWERED `[V]` 2026-08-15 — 89.0% at the observation level.** Census hints are true by construction and mostly uninformative. Two results outlive the number: selectivity does NOT predict usefulness (ρ = −0.143), and any "is this informative" test must compare against the moves *not played*, or it prefers the wrong instruments. `design/research/census-hint-false-positives.md` | Generate census-only hints over committed spines; count how many are true-but-useless ("this move attacks a defended pawn") | A hint that is honest and worthless is still a bad hint. This bounds how much of the assistance ladder census can actually carry |
| R4 ✅ | **ANSWERED `[V]` 2026-08-15 — NO.** Measurable only in *decided* positions; 10.2% of out-of-range positions qualify. Design consequence: the cluster's doc must carry a **difficulty-availability axis** (measured / authored / neither), not a difficulty scalar. | The experiment `resistance-spectrum` §7b already specifies: fixed-depth Stockfish with cleared hash, measured for per-ply cost **and for agreement with the tablebase classifier where both exist** | Every campaign idea assumes difficulty is a quantity. If it is only measurable in endgames, "boss encounters" are endgame-only and the design changes shape |
| R9 ✅ | **ANSWERED `[V]` 2026-08-15 — the oracle discriminates but does not reach.** Separates engine-level positions with force (r = −0.079); usable coverage ends ply ~20, zero by ply 27, and a 23× larger population buys only 2–4 plies. **Design consequence: the middlegame has no oracle of either kind — difficulty there must be AUTHORED, and the cluster's difficulty-availability axis now has a third value that is the common case.** | `design/research/human-outcome-coverage-depth.md` |
| R5 | Is Maia's policy scalar stable enough to build on? | The acceptance criterion in `resistance-spectrum` measures it rather than assuming | Both `practical_resistance` and any human-likeness claim rest on it. Ledgered separately as a standing question |

## After the session — the loop must be felt first

| # | Question | Why it waits |
|---|---|---|
| R6 | Does a rewind budget preserve or destroy punishment-free experimentation? | It touches a thesis-level property and an in-run invariant (`05` §1). The invariant review attached to the first session is the instrument that answers it; guessing beforehand risks designing against a feeling nobody has had yet |
| R7 | What does assistance-as-inventory feel like when you *lack* a rung you need? | The whole synergy claim ("a noob beats an IM boss with the right coach") depends on scarcity being interesting rather than frustrating. Unknowable from a document |
| R8 | Is the drill loop itself worth wrapping? | Bluntly: if the core loop does not hold attention for one session, the campaign is scaffolding around a void. **Nobody has played a run since 2026-08-12** |

## Explicitly not research — already decided

- **Honesty policy vs inventory are separate axes.** Deck-building operates on
  *availability*; it never touches what may honestly be shown or when
  (`05` §3/§3a). This is a design constraint, not an open question.
- **ADR-0007 holds by construction.** Progression is unlocked by playing, never
  purchased. The satirical ceremony parodies the ritual; it may not become one.
- **Law 8 applies inside the campaign.** An unlocked "hint" is a grounded
  primitive the learner has access to, never an LLM opinion they bought.

## What the answers feed

When R1–R5 land, the cluster earns **one design doc** — not six ledger rows
reassembled from memory — covering: the map, encounters, inventory, constraints,
resources, and bosses as a single architecture. R6–R8 then either confirm it or
rewrite it, which is exactly why they come after the session and not before.
