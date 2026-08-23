# Longitudinal style feedback — twelve measured habits, zero production-ready cards

**Question:** platform-alignment R21 / D552 / D562 / D843
**Date:** 2026-08-23
**Instrument:** `tools/r21-style-feedback-contract/`
**Status:** desk contract complete; production/transfer measurement blocked on the longitudinal
store, runtime opening identity and the gaps below

## Verdict

R12's twelve retained habits support a closed, grounded aggregation contract. They do **not** yet
support a 1.0 player-profile surface. The executable join finds **zero production-ready metrics**:
two wait on a pinned opening reference/runtime identity, two have a denominator incompatible with
the accepted longitudinal-store projection, and eight need a collector/store extension. All twelve
also retain R12's explicit limit: their floors were measured on 200 blitz games per unusually
active account inside 59 hours, not across ordinary learner cadence or time controls. `[V]`
(`tools/r21-style-feedback-contract/output.md`; `player-style-metrics.md` §§2, 4, 8)

This is not a reason to weaken the player-analysis vision. It is the missing bottom-up map the
vision needs. The shared feature vocabulary can power literal habit cards, bot candidate traits,
post-game summaries and drill selection, but each consumer proves a different proposition. A
stable learner tendency does not make a bot trait controllable; a controllable bot trait does not
make repetition of that move a strength. `[V]` (`rfc/bot-policy.md` §8; D843)

## 1. The complete twelve-row population

The instrument reads `results.json` and is set-equal to every R12 metric whose
`persistentFloors` value is non-null. It fails on an omitted, added or re-floored metric. `[V]`
(`tools/r21-style-feedback-contract/style-contract.test.ts`)

| family | retained metrics | measured floor(s) | production state |
|---|---|---:|---|
| Opening population | surprisal; ECO-family entropy | 25; 100 games | opening reference + runtime identity absent |
| Configuration | fianchetto setup; fianchetto knight screen | 25; 200 | exact research predicates, no production projection/store row |
| Castling | kingside rate; queenside rate | 50; 50 | castling event exists; R12's per-game denominator does not |
| Clock allocation | opening; middlegame; endgame spend share | 100; 50; 25 | clock spend is outside the accepted store ingest set |
| Choice residual | pawn; extended-center pawn; early queen | 100; 200; 100 | legal arithmetic exists; these candidate predicates do not |

`[V]` (`planning/platform-alignment/player-style/results.json`;
`rfc/longitudinal-store.md` §§2–3; `packages/runtime/src/evidence-catalog.ts`
`SEMANTIC_EVENT_PROJECTION_IDS`)

The table corrects an assumption in the earlier design synthesis. `player-analysis-and-skills.md`
called several of these computable “today” once a longitudinal store existed. The accepted store
does not persist arbitrary move-role, clock or configuration observations: its landing ingest is
exactly the semantic-event registry, and it explicitly excludes clock spend and opening identity.
The R21 result is therefore **0 of 12**, not “twelve after the store.” `[V]`
(`rfc/longitudinal-store.md` §3; complete instrument table)

## 2. The three blocker classes

### 2.1 Opening reference and runtime identity: 2

`opening_surprisal` needs exact position/move identity plus a pinned population count through ply
eight. `opening_family_entropy` needs one resolved three-character ECO family per game. The local
CC0 opening artifact and runtime projections are specified by `runtime-opening-identity`, but that
RFC is currently returned for a corrected source pin; no production projection exists yet. `[V]`
(`rfc/runtime-opening-identity.md` status and §§2–3; D1052)

R12 selected the opening-surprisal reference by the decision player's rating band. This does not
silently license rating-shaped prose. R15 allows a rating to select a population but forbids it
from changing what the product says about a move. A production card must therefore expose the
versioned reference-population id and remain longitudinal/descriptive; the same value may not feed
move grades, voice, hints or verdict wording. A fixed all-learner reference is a separate metric
version and must be remeasured rather than substituted. `[V]` (`rfc/learner-rating.md` R15/AC-11;
`player-style-metrics.md` §3)

### 2.2 Denominator mismatch: 2

The event registry can establish that a move castled. The accepted longitudinal store defines an
opportunity per *decision* when at least one legal edge carries that event. R12 instead defines
each castling rate per *game*, with eligibility fixed by whether the learner retained a castling
right at their first move. These are different populations and can produce different numbers.
Reusing the store's generic opportunity count would silently change the measured metric. `[V]`
(`player-style-metrics.md` §3; `rfc/longitudinal-store.md` §§1–2;
`rules.transition.event.castled@1` in the evidence catalog)

The lawful choices for a future RFC are to add the exact game-level eligibility projection, or
define a new decision-level castling-opportunity metric and run R12's stability test again. It may
not relabel one denominator as the other. `[M]`

### 2.3 Collector and store extension: 8

- The two fianchetto configurations are exact board-history predicates in R12's harness, but no
  semantic-event projection names either configuration.
- The three clock metrics need adjacent typed clock readings, base/increment and phase. The store's
  landing ingest explicitly excludes clock spend.
- Pawn choice, extended-center pawn choice and early-queen choice are legal-move arithmetic over
  role/destination/ply. Exact legal candidates make them cheap, but none is a registered semantic
  event, so the accepted store cannot persist their numerator or alternative share.

`[V]` (`tools/r12-player-style-harness/measure.test.ts`;
`rfc/longitudinal-store.md` §3; complete `SEMANTIC_EVENT_PROJECTION_IDS` set)

These are foundation gaps, not eight UI TODOs. They should be added as literal feature atoms once,
then consumed by longitudinal aggregation and bot-policy candidates under separate gates. `[M]`

## 3. One feature vocabulary, two proof obligations

The contract assigns a shared literal feature id to each metric. Clock phase rows share one
`time.spend_share@1` atom; castling sides share `move.castle_side@1`. Sharing means only that the
predicate has one definition. It does not share learner data, thresholds, or conclusions. `[V]`
(`tools/r21-style-feedback-contract/registry.ts`)

| consumer | reads | must prove | must never read/claim |
|---|---|---|---|
| learner style | learner-owned historical feature observations | R12 stability, longitudinal and time-control transfer, privacy/lifecycle | bot weights; archetype from failed clustering; skill/mastery from neutral occurrence |
| bot persona | feature values for the current legal-candidate population | bot-policy controlled-trait gate and strength/error preservation | learner history, rating, habit cards, style vector |
| Review/summary | admitted per-game facts and already-passed aggregates | exact source closure and declared selection | diagnosis, causal story or advice not present in evidence |
| drill/campaign selection | a passing habit/skill id and exact applicable content join | applicability plus the owning progression rule | changing live assistance or claiming a move was good |

`[V]` (`rfc/bot-policy.md` §8; `rfc/longitudinal-store.md` §5;
`grounded-coaching-aggregation.md` §§2–4)

The bot side is also honestly empty today. `BOT_POLICY_PROFILES` is empty and the controlled-trait
compiler accepts a free-form classifier only after its own measurement. R21's feature ids are
research vocabulary, not a back door around that gate. The three clock rows are refused to bot
policy until a real timing model exists; the two opening rows belong to a future repertoire layer;
the remaining seven are candidate controlled traits, not validated personalities. `[V]`
(`apps/server/src/bot-policy-catalog.ts`; `rfc/bot-policy.md` §§2.7, 8)

## 4. What a learner card may say

Every card carries metric id/version, literal value, 95% game-bootstrap interval, game and decision
counts, metric-specific floor, window, phase/time-control scope, reference id/version where used,
exact contributing game/ply references and an abstention reason. A truncated drill-down says how
many examples are hidden. `[V]` (`grounded-coaching-aggregation.md` §2; R13 candidate-card
contract; executable R21 presentation contract)

The deterministic renderer is authoritative. An optional LLM may paraphrase **one sealed admitted
card**. It may not choose the card, compare against an undeclared population, diagnose, advise,
grade, create an archetype or recommend a move. This answers the earlier “LLM implementation”
question at the right layer: retrieval may enrich a separately validated theory/applicability join;
it does not turn history into chess judgement. `[V]` (law 8; R13 renderer closure;
`rfc/longitudinal-store.md` §5.3)

Permitted:

> Across 63 measured rapid games, you reached the declared fianchetto setup in 18 of 63 games
> (95% interval …). This card's floor is 25 games.

Not permitted from the same bytes:

> You are a solid positional fianchetto player and should seek sharper kingside attacks.

The second sentence adds a type, valence and prescription. None is an operand. `[M]`

## 5. Refused composites remain refused

R12's continuous vector re-identifies 35/36 accounts, but k=4–12 clustering reaches median ARI
0.251–0.417 against the preregistered 0.70 gate. Therefore natural “player types,” GM twins and
labels such as aggressive/solid/theoretical/creative do not follow from measured play. A fun,
clearly labelled preference quiz remains a different product object because it reports answers the
learner deliberately supplied rather than pretending a natural type was discovered. `[V]`
(`player-style-metrics.md` §§6–7)

Nor may a summary say “your middlegame is too simple” merely because it has a pawn or reply-breadth
residual. Four candidate metrics, including reply breadth, failed R12's persistence gate; the words
“simple,” “positional,” “not enough tactics,” “strength,” “weakness” and “needs work” require a
separately validated aggregation rule and baseline. The LLM is not that rule. `[V]`
(`planning/platform-alignment/player-style/results.json`; `player-analysis-and-skills.md` §5)

## 6. Required measurement and implementation order

1. Resolve and land the accepted longitudinal-store open questions; land runtime opening identity.
2. Add the eight missing literal atoms and the castling game-eligibility projection through their
   owning collector/store RFCs. No style prose lands in those RFCs.
3. Recompute all twelve on ordinary learner histories split early/late over at least eight weeks,
   with blitz↔rapid transfer and each metric's 25/50/100/200-game floor.
4. Re-run rating separation and the R12 stability gate whenever a feature/reference version
   changes. A failing row abstains; it does not inherit another row's floor.
5. Only passing rows enter the D552 surface RFC. That RFC owns calm module composition, privacy,
   explicit sharing, exact drill-down and optional sealed LLM paraphrase.
6. Bot personas independently run controlled-trait experiments over the same literal atoms. There
   is no “style-aware bot” join in 1.0.

This order keeps the content foundation stable: packs, Review, bots and longitudinal feedback all
consume the same exact atoms, while authored packs never need retroactive prose edits merely
because a new aggregate or UI module arrives. `[M]`

## Limits

- This is a repository synthesis and executable contract, not a new human-population measurement.
- The proposed feature ids are research vocabulary; an accepted collector/bot/style RFC must own
  production registration and versioning.
- R12's raw trace artifact remains outside the repository, so this pass verifies the committed
  aggregate and code contract, not every source game.
- No result here authorizes a progression tier, public profile, cross-learner comparison or advice.
