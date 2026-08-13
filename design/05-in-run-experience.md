# 05 — The in-run experience

Written 2026-08-13 on the owner's instruction to work out the generic game
design, independent of drill pack or Just Play.

## Why this document exists

`01-training-model.md` says what a rehearsal *is*. `03-product-breadth.md` maps
every surface the product has. Neither describes the thing they both terminate
in: **a person at a board.**

Every entry in the surface map — a curated pack, a position from a FEN, an
imported game, a streamed session, a trajectory leg — eventually puts someone in
front of a position with a decision to make. That experience is one thing, and it
has been specified eleven times in fragments across eleven RFCs. This document is
the layer underneath all of them.

The test of a claim belonging here: **it is true whether or not a pack is
loaded.** Anything that depends on authored content belongs in `01` or `04`.

## 1. The invariants

These hold in every run, in every mode, with or without a pack. An RFC may
extend them; none may quietly except itself from one.

| Invariant | Why it is absolute |
|---|---|
| **You commit before you learn anything** | ADR-0006. The moment a learner can see an evaluation before deciding, they are reading a label instead of playing a position, and the product becomes the engine-review screen it exists to replace |
| **An attempt is never destroyed** | Rewind forks; it does not erase. The comparison of two preserved attempts by the same player is the product's one original claim (`00-thesis.md`), and it is only true if the first attempt survives |
| **Rewind is an experiment, not an undo** | An undo says the move did not happen. A fork says it happened and here is another world. The difference is the entire pedagogy |
| **Nothing here invents chess truth** | ADR-0005. Every statement is rendered from something validated — rules, a tablebase, an engine, a corpus, or an author. Wording may be generated; claims may not |
| **Absence is stated, never simulated** | If the product does not know, it says so. A confident wrong verdict costs more than a visible gap, and the gap is recoverable |
| **The run is the record** | Everything that happened is in the event log, replayable. A surface that shows something the run cannot reconstruct is showing something that did not happen |

## 2. The regions

`03-product-breadth.md` names five stable regions inside a run. What each one
*is*, generically:

1. **Board and objective.** The position, whose move it is, and — if anything is
   claimed about this position — what you are trying to do. With no pack there
   is no objective, and the region says that rather than inventing one.
2. **Timeline.** What has happened, with the moments that mattered marked on it:
   checkpoints, phase changes, the point the book ran out. It is the run's
   memory, and it is how a learner locates the decision they want to revisit.
3. **Branch rail.** The attempts. Every fork you made, enterable, comparable,
   exportable. This is where "try it the other way" lives.
4. **Assistance and evidence rail.** Everything the product can tell you about
   this position, at the times it is permitted to tell you. §3 is entirely about
   this region, because it is where the product is most tempted to lie.
5. **Session and role controls.** Solo, host, participant, spectator. Who holds
   the board, who may take it, and who is watching.

## 3. The assistance ladder

The rail in region 4 is not one feature. It is a ladder of sources ordered by
**what each one can get wrong**, and that ordering should drive both defaults and
how loudly each is presented.

| Rung | Source | What it can get wrong | Cost |
|---|---|---|---|
| 0 | **Rules-derived sight** — legality, attack and defence maps, discovered consequence, structure descriptions | *Nothing.* It is arithmetic over the position. It cannot be wrong about chess because it makes no chess judgement | free, local |
| 1 | **Tablebase** (≤7 pieces) | Nothing, within range. Outside range it must abstain, and abstention is the whole contract | lookup |
| 2 | **Engine evaluation** | It is right about the position and can still be wrong about the *lesson* — "+0.54" answers a question the learner did not ask | ms, server |
| 3 | **Human model (Maia)** | Predicts what a human at a level plays. Correct as a distribution, misleading as advice, and it must never be dressed as best play | ms, sidecar |
| 4 | **Corpus frequency** | Says what happened, not what is good. The classic error is reading popularity as quality | index |
| 5 | **Authored claims** | An author's judgement. Can simply be wrong, and with no review workflow (owner ruling 2026-08-13) provenance is the only safeguard | human hours |
| 6 | **LLM rendering** | May only word rungs 0–5. Given latitude it fabricates fluently, which is why ADR-0005 exists | provider |

Two consequences follow, and they are the useful part of the ladder:

**Rung 0 is underused and should be the default assistance everywhere.** It is
the only rung that cannot manufacture chess truth, it needs no engine, no corpus
and no network, and it teaches *seeing* rather than *being told* — which is the
distinction between this product and every eval-bar trainer. The
discovered-threat idea (`BACKLOG`, 2026-08-13) is rung 0. So is structural
description: naming that a bishop's long diagonal is blocked by exactly one pawn
is a fact about the position, not an opinion about the game.

**Anti-contamination applies by rung, not uniformly.** ADR-0006 exists because an
evaluation tells you the answer. Rung 0 does not: showing which squares a knight
covers reveals nothing a careful player could not see, and hiding it teaches
nothing except that the interface is coy. Where the line falls between rungs 0
and 2 during committed play is an open question (§5), but it is a line, not a
switch.

## 4. What varies by context

The regions and the ladder are constant. Four things vary, and every surface in
`03` is some combination of them:

- **Is there authored content?** With a pack: an objective, a spine, checkpoints,
  claims, a boundary. Without: the run still records, forks, compares and
  exports, and the assistance rail says honestly that nothing was written about
  this position.
- **What kind of position is this?** Opening, middlegame, endgame — which decides
  what evidence even applies. A tablebase is decisive at rung 1 and silent at
  eleven pieces; corpus frequency is rich in the opening and empty by move 40.
  This is why a live phase classifier (`BACKLOG`, 2026-08-13) is not a navigation
  nicety: **it is what makes the assistance rail selectable.**
- **What assistance is permitted here?** A curated drill withholds by design. Just
  Play is the learner's own game and they may want everything. A streamed session
  has an audience with different needs from the player, and the owner has already
  ruled that a streamer may cheat on themselves. Assistance configuration per
  session context is currently implicit everywhere and should be explicit
  (`BACKLOG`, 2026-08-13).
- **Who else is here?** Nobody, a coach, a class, a chat. This changes who holds
  the board and what a viewer may see — never what is *true*, only who is told.

## 5. Open questions

Genuine forks, not gaps to be filled by whoever writes the next RFC:

1. **Where the anti-contamination line falls between rungs 0 and 2 during
   committed play.** Rung 0 reveals no answer, so withholding it is theatre; rung
   2 reveals the answer, so showing it is contamination. Somewhere in between —
   probably at rung 1 or 3 — the line sits, and it may move by mode.
2. **How deep discovered consequence goes before it becomes noise.** One ply of
   "this move unblocks that piece" is clearly useful; three is a diagram nobody
   reads.
3. **Whether a phase classifier may be wrong out loud.** It must abstain rather
   than guess, but abstention has a cost: a rail that frequently says "unclear"
   trains people to ignore it.
4. **Whether Just Play's assistance defaults are the learner's choice or the
   product's opinion.** A product with a view is more useful and more
   presumptuous; both are defensible.

## 6. What this document is not

It does not specify a UI. Region names are not component names, and nothing here
fixes a layout — `03-product-breadth.md` owns the shell and its responsive
behaviour. It also does not decide what any individual mode does at a checkpoint;
that is `01-training-model.md` and the mode RFCs.

It exists so that the twelfth RFC to put a person at a board does not re-derive
the six invariants from scratch, and so that a new assistance idea can be placed
on a ladder instead of argued about from first principles.
