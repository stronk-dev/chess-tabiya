# 01 — Training model

Living successor to `archive/brief-v2/03_TRAINING_MODEL.md` and
`product/drill_modes.md`. This doc IS the novelty claim under test: hypotheses H1–H4
(`planning/exploration/gates.md`) attach here.

## The learning unit is an episode, not a move

A puzzle asks "what is the best move now?" A phase drill asks "which plan will you
choose, can you execute it for several moves, and what position does it create?"

```text
orientation → commitment → uninterrupted play → consequence checkpoint
→ rewind → alternative attempt → comparison → varied retry
```

Four stages per episode:

1. **Orient** — show only what's necessary: side, objective, move budget, maybe a
   concept prompt. No live engine bar by default.
2. **Commit** — a real move; at curated decision points, optionally capture intent
   first (keep/open/close center, prepare break, trade into endgame, …).
3. **Play the consequence** — feedback withheld until a checkpoint or fixed horizon
   (ADR-0006), so the user plays the position, not the colored label. Middlegame
   branches run 8–20 plies; stop early on tactical resolution, irreversible structure
   change, completed break, target-endgame trade, or decided objective.
4. **Compare and replay** — the first attempt is never erased. Return to the checkpoint
   for: a different move, a different plan class, same plan vs another defense, same
   concept in a related position, or the opposite side.

## Vocabulary (added 2026-08-12 — these words were used for months without definition)

Three terms carry most of the product's design weight. Written plainly because
an owner review found them being used as undefined jargon.

- **Attempt** (previously "episode"): one pass through the four stages above —
  a start position, your commitment, the play-out, and the outcome it produced.
  It is not a metaphor: in the runtime an attempt **is a branch of a run**. When
  the product says "try that again", an attempt is the thing being re-tried.
- **Return loop:** the answer to "why would you open this on Tuesday?" It is the
  scheduling and progress layer that brings a learner back to material they have
  already attempted. The product currently has no answer here; nothing records
  what was attempted, so nothing can bring you back to it.
- **Concept:** a named idea — break timing, the minority attack, opposition —
  that appears across many packs and phases. Concepts are how the product can
  ever say "you keep mistiming the break" instead of "you lost that position".

## Repetition scheduling

**What is scheduled: attempts. What selects among them: concepts. What is never
a scheduling key: phase.** (Owner ruling 2026-08-12, in response to "a pack can
be limited to one phase but in the end it all interleaves".)

The three parts:

1. **Attempts are the schedulable unit** because they are the thing a learner
   can concretely face again and compare against a preserved earlier try — the
   product's central claim. They are expressible against shipped run/branch
   types with no new identity contract.
2. **Concepts are cross-cutting tags, not the scheduling key.** They are what
   makes a weakness statement possible across packs. This requires a contract
   that does not exist yet: concepts are currently unique *within a single
   pack*, so two packs both naming `break-timing` are unrelated strings. A
   concept registry — ids defined once, packs referencing them — is an authoring
   contract and belongs with the pack studio, not with the scheduler.
3. **Phase is a discovery filter, never a scheduling key.** Packs carry a phase
   label, but play crosses phases: an attempt that starts in a Caro-Kann Advance
   and ends in a 4v3 rook ending is one attempt, and it is tagged with
   everything it actually traversed. Scheduling by phase would contradict the
   trajectory claim the whole product rests on.

Both blocked (same root until the procedure stabilizes — theoretical endgames, move
orders, attacking races) and varied (change defense, placement, move order, side,
clock, material, objective — for transfer). Distinguish explicitly:

```text
same position, new defense · related position, same idea
same structure, opposite side · same outcome, different material details
```

## Outcome types

- **Win** — keep the position winning and finish the conversion.
- **Hold** — preserve a draw against strong or perfect resistance.
- **Save** — start objectively worse; exploit realistic inaccuracies to reach a draw or
  real counterplay.
- **Resist** — position may stay lost; maximize practical difficulty, reach resistance
  checkpoints.

Hold vs save is load-bearing: hold tests correct defence from a drawable position;
save tests practical resourcefulness from a worse one.

## The four modes (mode contracts: `archive/brief-v2/product/drill_modes.md`)

| Mode | Phase | Core loop | Graded on |
|---|---|---|---|
| Line Drill | opening | recall + idea checkpoints + realistic deviations + continue past book | structure reached, theory/idea score |
| Plan Drill | middlegame | 8–20-ply segment → rewind → alternative → compare | objective state, comparison evidence |
| Outcome Drill | endgame | play to result or triviality vs exact/human resistance | result preservation, not exact moves |
| Trajectory Drill | cross-phase | opening → characteristic middlegame → plausible endgame on one causal spine | per-phase, linked by provenance |

Position Arena (two humans, curated position, swap colors) previously sat
outside v0. The owner breadth ruling in `03-product-breadth.md` supersedes that
surface-level deferral: external-handoff Arena, Twitch/stream, academy, and
Just Play must fit the shared product and reach a minimal real workflow before
content depth. Native matchmaking remains later implementation depth.

## Entry contexts are not drill modes

The four mode contracts describe learning behavior, not the only ways to enter
the product. A user may select a curated pack, start from FEN/PGN/study, enter a
live or human session, or choose **Just Play** and branch/learn as the game
develops. Just Play requires phase/structure recognition, retrieved evidence,
and pack-optional objectives; it must not fake authored certainty when none is
available. All contexts reuse the episode, branch, evidence, and replay model.

## Target mistake classes

The product aims at the band between tactics and perfect play: knows the line but not
the purpose; right plan one move too slow; tension released too early or held too long;
luxury move during a race; wrong piece improved; center opened while behind in
development; king activated too late; rook placed passively; converts material but not
activity. Full lists: `archive/brief-v2/03_TRAINING_MODEL.md` §Target mistake classes.

## Why this can outperform random puzzles

Not because puzzle positions "never occurred" (they come from real games) — the
weakness is distribution and context: the learner knows a forcing solution exists, the
position starts after the strategic decisions that created it, there's rarely a second
plausible plan to compare, and conversion/resistance are omitted. This tool trains the
execution gap around tactics; it does not replace them.
