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

**Rung 0 is underused — but "safest to show" is not "should be shown", and §3a
corrects that.** It is the only rung that cannot manufacture chess truth, it needs no engine, no corpus
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

## 3a. The default is silence, and recovery is the skill

Owner, 2026-08-13: *"maybe for most people they don't want the proactive
support… maybe they want the fuck up, then recover, and if recovery fails try to
grind out the draw, or go back to that pivotal point."*

This corrects a default §3 got wrong. The ladder describes what assistance *can*
be shown and how honest each rung is. It does not follow that more should be
shown, and rung 0 being safe is not an argument for it being **on**.

**Proactive assistance is in tension with the thesis.** *Do not just learn the
move — rehearse the game it creates* (`00-thesis.md`). A product that tells you
your knight has no outpost before you move is not letting you rehearse a
consequence; it is coaching you past the mistake that would have taught you.
Rung 0 is the *safest* thing to show, which is a different claim from being the
right thing to show, and §3 blurred them.

So the default posture is:

> **Play it. Live with it. Then decide whether to recover or to rewind.**

Assistance is *available* — the rail exists, the ladder is honest, the learner may
open it — but the default during committed play is **silence**, and everything the
product knows arrives after the commitment, which is what ADR-0006 always said.

### Recovery is a first-class skill and almost nothing teaches it

The sequence the owner describes — err, try to recover, and if recovery fails
grind for the draw — is most of real chess between 1400 and 2000, and it is the
part every trainer skips because they all optimise for *finding the best move*.
The vocabulary already exists: `01-training-model.md` §Outcome types names
**convert / hold / save / resist**, and **save** is exactly "rescue a worse
position". What has been missing is treating it as the *normal* path through a
run rather than a drill variant.

That produces a fourth thing a run can be about, alongside the three in `01`:
not *what should I have played*, but **what can I still do from here**.

### Retrospective detection: the same signal, the other job

`05` §5a excludes engine eval swing as a **live** pivotal detector, because it
finds where someone erred and cannot fire before the error. That reasoning holds
and is unchanged.

But *"go back to that pivotal point"* is a **backward-looking** request, and there
the same signal is exactly right: when a learner has played on, failed to recover,
and asks where it actually turned, eval swing answers precisely that question.
The rule is therefore not *"never use eval swing"* but:

| Direction | Question | Honest detector |
|---|---|---|
| Forward, during play | *is a real decision arriving?* | irreversibility, phase change, Maia divergence, option collapse |
| Backward, after the outcome | *where did it turn?* | eval swing, objective-state transitions, the last point the result was still available |

Both are legitimate; using the backward detector forward is the post-mortem
framing this product replaces, and using the forward detector backward is simply
weaker.

## 3b. Guided mode ("clippy") — naming patterns, never recommending moves

Owner, 2026-08-13: *"can we have a 'clippy' mode, where you just play the game
and it gives tips that are basically the early-game / midgame tactics, endgame
patterns or whatever?"*

Yes, and it is not an exception to §3a — it is the **shape library rendered
live** (`04-content-architecture.md` §0), which is what B9 + B10 + B11 produce
when assistance is turned up. §3a sets the *default*; this is a mode a learner
chooses.

**There is one line, and it is the whole design:**

| Permitted — naming a pattern | Forbidden — evaluating this position |
|---|---|
| "This is a Carlsbad structure. The standard plans are the minority attack, the central break, and kingside play." | "You should play the minority attack here." |
| "In an IQP position the attacker wants pieces on; the blockader wants trades." | "Trade queens, you're better." |
| "That knight has no retreat square." *(rung 0 fact)* | "That knight is trapped, win it with a4." |
| "This is a Lucena position; the technique is to build a bridge." | "Play Rf4." |

A tip may say what *kind* of position this is and what that kind is generally
about. It may not say what is good **here**. The first is shape content and is
true independent of the game in front of the learner; the second is an
evaluation, and delivering it during committed play is the ADR-0006 violation
§3a exists to prevent.

**Why this is not the Clippy people hated.** That assistant failed for four
reasons, and each has an answer already ruled in this repo:

| Clippy's failure | The answer here |
|---|---|
| It was frequently **wrong** | Tips come from rung 0 or from an authored shape entry. Rung 0 cannot be wrong about chess; an authored entry carries its provenance |
| It was **generic** | Tips are keyed to a detected structure, so they fire because *this* position has an IQP, not because the learner is playing chess |
| It **interrupted** | The owner already ruled the delivery pattern for exactly this: a **passive marker the player may open**, never a modal. Recognition annotates; it does not seize |
| It could not be **turned off** | It is a mode, chosen, and silence is the default (§3a) |

**The real risk is different and worth stating: tips that never stop remove the
need to look.** Rung 0 exists to teach *seeing*; an assistant that names the
outpost every time does the seeing for you. So guided mode should be
band-shaped — the natural default for the 1000–1400 on-ramp
(`00-thesis.md` §Target player, where naming a concept the learner has never met
is a prerequisite to rehearsing it at all) and off by default above, with an
explicit intent that it **fades**: you cannot rehearse a concept you have never
heard of, and you cannot learn to find one that is always pointed out.

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

## 5. Strategic reading: detection is cheap, significance is not

Owner statement, 2026-08-13, and it reframes the assistance problem: *"sometimes
you move a pawn just so your opponent can no longer put their knight there…
identifying threats is such a tough classifier — where do we want or risk
outposts, what diagonals do we want open or protected, what pressure is
unbalanced, what tactics are both sides building toward."*

That is one hard problem only if you keep it as one. Split it and most of it
falls to **rung 0**:

| Question | Detection | Significance |
|---|---|---|
| After this pawn move, can an enemy knight ever occupy d5 again? | **rules arithmetic** — enumerate the pawns that could attack it | does denying d5 matter *here* |
| Is there an outpost on e5? | **structural** — a square in enemy territory, pawn-defended, unattackable by enemy pawns | is it worth a piece and a tempo |
| Is the long diagonal open, and what blocks it? | **rules arithmetic** — count and name the blockers | do we want it open |
| Is pressure on f7 balanced? | **counting** — attackers and defenders, with values | is the imbalance convertible |
| What tactic is each side building toward? | **not deterministic** — rung 2/3 territory | — |

**Four of five detections are free and cannot be wrong.** The product can say
"after a4, Black's knight can never use b5 again" as flatly as it says a move is
legal, because it is the same kind of statement. What it may not say for free is
whether that mattered.

This is the shape of the whole assistance problem: **the facts are rung 0 and the
judgement is rungs 2–5.** A surface that renders the facts and attributes the
judgement is honest at any level of the ladder; one that blurs them is the
dashboard `AGENTS.md` names as the anti-pattern.

**Prophylaxis is the case that proves it.** A denial move — a pawn played so the
opponent *cannot* do something — is invisible to every eval-first tool, because
nothing happened. It is exactly what rung 0 can see and an evaluation cannot
explain. It is also the natural partner of the already-ledgered opponent-intent
prompt: *what is the moved piece no longer doing* has a mirror in *what can the
opponent no longer do*.

### 5c. Authored and computed guidance are one layer, not two

Owner, 2026-08-13: *"this ALSO ties into the wider drilling — if you practice an
opening or explore variations, some advanced positions MAKE the outpost. It all
ties together. Whether you're drilling or just playing we need to give the proper
guidance, not from just the engine POV but the classifiers and patterns and
strategies and weak points."*

This is the unification, and it resolves something the repo has treated as two
problems. An authored plan class and a computed structural fact are **the same
claim at different levels of grounding**:

> *"Support the chain with c3"* (author: what to aim for)
> *"This position now has a protected outpost on e5"* (rung 0: what is true)

The author says what to want; the classifier says whether you got it. Neither is
complete alone — a classifier cannot know that an outpost was worth a tempo here,
and an author cannot check every position a learner reaches.

**And that closes a hole that has been open since Pack B was written.** Its
author reported that *a plan drill cannot express its objective*: success is
relative to the committed intent, and `successConditions` only supports
intent-blind checkpoint arrival (`BACKLOG`, authoring-format friction). The
answer is structural: you committed to the minority attack, so grade whether the
**structural signature of a completed minority attack appeared** — a backward
pawn on a half-open file — rather than whether specific moves were played. That
is grading a plan by its consequence, which is what the product claims to do
everywhere else.

The machinery for this already ships and is authorable: `ObjectivePredicate`
carries a `pawnStructure` variant with `contains`/`exact` modes
(`packages/runtime/src/objective.ts:54-58`, evaluated at `:158-167`), reachable
from a pack through `fenPredicate`.

**What is missing is vocabulary, not machinery.** The shipped predicate matches
*literal pawn placement* — explicit square lists — so "a backward pawn on c6" is
expressible only by enumerating exact positions, which is brittle to the point of
uselessness across the variations a real drill produces. Feature-level predicates
— *backward pawn on file*, *outpost on square*, *half-open file*, *blocked
diagonal* — are exactly the deterministic-feature work already owned by
exploration **Q4b**, and they are rung 0.

So the sequence is: Q4b's features are what let an author say what a plan *is*
rather than where the pawns *are*; the same features are what let a pack-less
game be read at all; and both are the same rung-0 layer serving drilling and Just
Play identically. That is why `05` exists.

### 5a. Pivotal moments without an author

The owner's larger claim: *"the drilling is nice but the true gem is branching
play with autodetected checkpoints, playing a normal game against a human-like
opponent while truly applying an opening/middlegame/endgame strategy."*

A curated pack declares its checkpoints. Just Play has no author, so the moments
must be detected — and the honest detectors are ones that describe a fact rather
than assert importance:

- **Irreversibility** (rung 0): a pawn break, a trade that removes the last of a
  piece type, castling. The position just stopped being able to go back.
- **Phase change** (rung 0 + author-declared): the structure became a different
  kind of problem.
- **Human divergence** (rung 3): the Maia distribution at the learner's level
  splits several ways. *"Players at your level split three ways here"* is a fact
  about the distribution, not a claim about chess — and it is a strong signal
  that a decision is real rather than forced. This is the most product-native
  detector available and it uses a model already shipped.
- **Option collapse** (rung 0): the number of reasonable continuations drops
  sharply — forcing sequences announce themselves structurally.

Engine eval swing is deliberately *not* on that list as a primary detector: it
identifies where someone erred, which is the post-mortem framing the product
exists to replace, and it cannot fire before the error.

### 5b. Endgame guidance is named technique, not a move

Owner: *"we don't want a hint like play rook c8, we want 'this is endgame X, so
use the rook to push the enemy king into a small box while you promote'."*

This is the clearest statement in the repo of what guidance should sound like,
and the endgame is where it is most achievable: endgame *types* are recognizable
structurally, the techniques have names and are finite, and below eight pieces a
tablebase settles ground truth. So the chain is: recognize the type → name the
technique → let the learner execute it → grade the result, not the moves.

Note the asymmetry this creates and design around it rather than pretending it
away: **endgames are the most tractable phase for honest guidance and middlegames
the least.** Openings have theory and corpus frequency; endgames have structure
and tablebases; the middlegame has neither, which is precisely why authored plan
classes carry so much weight there.

## 6. Open questions

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

## 7. What this document is not

It does not specify a UI. Region names are not component names, and nothing here
fixes a layout — `03-product-breadth.md` owns the shell and its responsive
behaviour. It also does not decide what any individual mode does at a checkpoint;
that is `01-training-model.md` and the mode RFCs.

It exists so that the twelfth RFC to put a person at a board does not re-derive
the six invariants from scratch, and so that a new assistance idea can be placed
on a ladder instead of argued about from first principles.
