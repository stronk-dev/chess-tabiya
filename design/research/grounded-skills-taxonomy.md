# Grounded skills taxonomy — category breadth is not credit authority

**Question:** platform-alignment R20 / D549 / D842 / D562
**Date:** 2026-08-23
**Instrument:** `tools/r20-skills-taxonomy/`
**Status:** desk arm complete; longitudinal/reference-population measurement blocked on D973/D1011

## Verdict

The five familiar categories—Fundamentals, Openings, Tactics, Strategy and Endgames—are a usable
navigation vocabulary. They are not a credit mechanism. Closing every current semantic-event
projection produces **67 classified rows**: **47 habit-only**, **11 Review-only**, **4 refused as
skill inputs**, and **5 candidate credits**. **Zero candidate credits are production-ready**
because none has a longitudinal, cross-time-control sample floor or a versioned reference
distribution. `[V]` (`tools/r20-skills-taxonomy/output.md`)

That zero is the important result. A detector can precisely establish that a pawn structure
changed, a defender moved, or an observed deflection occurred without establishing that repeating
the event is good, difficult, or evidence of mastery. Converting neutral occurrence into a skill
badge would be an LLM-free violation of law 8: the manufactured judgement would live in the
aggregation rule instead of the prose. `[V]` (complete disposition table in the instrument;
`packages/runtime/src/evidence-catalog.ts` declares semantic-event `valence: "none"`)

The desk arm therefore permits an RFC to define the *measurement protocol and data shapes*. It
does not permit a progression surface, thresholds or “mastered” labels until the measurement arm
runs over durable observations.

## 1. Population and join

The producer population is set-equal to the current exported
`SEMANTIC_EVENT_PROJECTION_IDS`: **67 versioned event projections**, not a hand-picked subset. The
instrument imports the symbol and fails if any current member receives no category/disposition.
`[V]` (`tools/r20-skills-taxonomy/registry.ts`; `taxonomy.test.ts`)

The accepted learner-module document now declares **181 eligibility rows**, 179 intended to
compile at module landing and two grade rows awaiting. R20's queue still said 175 because it
predates the D924 six-row inspector amendment. The counts describe the accepted contract, not
current product wiring: production still contains the module contract compiler but not the full
registry. `[V]` (`rfc/learner-modules.md` Appendix B;
`packages/runtime/src/module-contract.ts`; D1016/D1017)

Only retrospective module declarations are eligible for a learner skill aggregate. The five
candidate credits map to nine declared module rows: four appear in both `postcommit_nudge` and
`review_map`; discovered execution appears in `full_inspector`. No pre-commit, threat-radar or
blunder-prevention consumer receives a learner profile. This is the assistance-separation rule in
executable form: prior performance may select later content, never widen live help or change what
is said about the current move. `[V]` (`tools/r20-skills-taxonomy/registry.ts`;
`rfc/learner-rating.md` §8/AC-11)

## 2. The five candidate credits

| category | candidate | exact opportunity / occurrence | why only a candidate |
|---|---|---|---|
| Fundamentals | loose-piece avoidance | at least one legal candidate creates the registered loose-piece relation and at least one avoids it / the played edge carries the registered avoidance event | no persistent floor or reference distribution |
| Tactics | double-attack conversion | at least one legal candidate creates the registered meaningful double attack, retaining reply breadth / the played edge is one such candidate | reply breadth is disclosed, never renamed “forced”; no floor |
| Tactics | mate conversion | at least one legal move checkmates / the played move checkmates | exact but naturally rare; no floor |
| Tactics | discovered execution | at least one legal candidate produces the identity-retaining registered event / the played move produces it | no measured opportunity incidence or floor |
| Endgames | promotion completion | at least one legal candidate promotes and at least one does not / the played edge promotes with role identity retained | says completion, not best play, outcome, or conversion quality |

Every numerator and denominator above is rules arithmetic over the complete legal-candidate set.
None says the move is best. The double-attack row retains the one-reply breadth so the product may
state what was checked without converting a local event into inevitability. Promotion completion
is intentionally narrower than “converted the endgame”; the latter needs Syzygy or a declared
engine/authored outcome join. `[V]` (`tools/r20-skills-taxonomy/registry.ts`;
`design/research/bounded-reply-semantics.md`;
`design/research/basic-semantic-tactics-stage-0.md` §8 and §promotion-race join)

## 3. Why the other 62 do not become credits

### Habit-only: 47

These facts can support private continuous habit cards once persisted: structure changes and
avoidance, castling/development choices, pawn dynamics, square control, mobility, king-zone state,
material-role asymmetry and open-file activity. Their sign is descriptive. “Creates an isolated
pawn” is not universally bad; “keeps castling rights” is not universally good; “increases king-zone
attackers” is not proof of a sound attack. Their lawful product form is *how often this literal
choice occurs when it is available*, not a skill tier. `[V]`
(`tools/r20-skills-taxonomy/output.md`; `design/research/decomposed-king-state.md`)

### Review-only: 11

Observed deflection, attraction, clearance, interference, zwischenzug, overload exploitation and
the other bounded sequences are excellent Review moments because they retain exact participants
and consequences. They do not yet define a complete opportunity population. Counting observed
instances would restate which positions occurred—the D345 exposure failure—rather than measure
what the learner converted. `[V]` (`tools/d872-semantic-tactics-harness/consumer-matrix-output.md`;
`design/research/basic-semantic-tactics-stage-0.md`)

### Refused as skill: 4

Generic piece/direct-attack counts and reply breadth are operands. Higher is neither better nor
worse. They may condition a candidate rule, board overlay, bot policy or Review explanation; they
cannot themselves earn progress. `[V]` (`tools/r20-skills-taxonomy/output.md`)

## 4. Category-specific honest empty states

- **Openings:** no skill credit is admitted. Opening surprisal and family entropy are strong
  measured habits at short-session floors 25 and 100 games (rho .974/.935), but neither has a
  production projection. Runtime opening identity establishes applicability, not accuracy or move
  quality. `[V]` (`design/research/player-style-metrics.md` §4;
  `rfc/runtime-opening-identity.md` §§2–3)
- **Strategy:** no skill credit is admitted. The substrate is broad, but every current structure,
  pawn, king and activity event is neutral until a separate objective/outcome or cited-theory rule
  supplies valence. Habit cards and Review remain available. `[V]` (complete disposition table)
- **Endgames:** promotion completion is the sole rules-only candidate. “Technique,” “conversion”
  and result preservation require tablebase/engine/authored consequence and an opportunity
  definition; the longitudinal store's landing ingest set intentionally excludes tablebase facts.
  `[V]` (`rfc/longitudinal-store.md` §3;
  `design/research/basic-semantic-tactics-stage-0.md` §8 and §promotion-race join)

An empty category is not filled from a weaker detector. The category remains visible only when a
workflow has honest content; no five-card dashboard is required merely because the taxonomy has
five names. `[M]`

## 5. Tier rule handed to measurement

The only admissible candidate is `reference_quantile_lower_bound@1`:

1. below the metric-specific floor: `insufficient_evidence`;
2. floor met: render the rate, opportunity count and 95% interval as `established` evidence;
3. lower interval bound above the pinned reference median: `above_reference`;
4. lower interval bound above the pinned reference 75th percentile: `distinctive`.

The labels are declared conventions and must render with the rate, interval, population, phase,
time-control scope and version. They are not absolute chess mastery. A later owner ruling may put a
ceremony over these states, but may not hide the arithmetic or rename insufficient evidence.
`[M]` (mechanism synthesized from D842 and R12's bootstrap protocol)

This explicitly refuses raw counts, streaks, one global floor and LLM-authored tiers. It also
refuses a category-wide score: five unrelated denominators do not become one number through
averaging. `[V]` (`design/research/player-analysis-and-skills.md` §§3.2–3.3)

## 6. Required measurement arm

Once the longitudinal store and its class split land, run the five candidate rules over durable
`played` decisions and a separate pinned reference population. For each candidate, measure game
floors at 25/50/100/200 and require:

1. the stability gate passes at the chosen floor and every larger measured floor;
2. at least 75% account coverage, rho ≥ .70, 75% same-side-of-reference agreement, two of three
   rating bands and no color reversal—R12's existing gate, unchanged;
3. early↔late and blitz↔rapid transfer do not invert the result;
4. opportunity incidence is reported, and an all-ones/all-zero result fires the D603 alarm;
5. the rate does not collapse to games played, repeated-root exposure or pack selection;
6. reference quantiles and bootstrap intervals are versioned and every aggregate reopens exact
   run/node contributors.

Failure removes that credit from 1.0 while leaving its evidence projection available for Review,
Support, bots, drills and private habit cards. A detector does not live or die with one consumer.
`[M]` (pre-registered continuation of R12 over the now-closed candidate set)

## 7. Consequences for 1.0 planning

1. The longitudinal-store open questions are not process trivia: until its decision-class grain,
   ingest scope and revision authority are reconciled, the measurement population is undefined.
2. The skill/progression RFC should not be drafted as a catalogue of badges. Its first phase is the
   observation-store reader plus this five-rule measurement; only passing rows enter progression.
3. Player types remain separate. Continuous habits can ship after their own stability gates;
   natural archetypes and “plays like a grandmaster” remain refused by R12's failed clustering.
4. Campaign knowledge-as-key may consume a passing tier, but campaign progression itself remains
   unlocked by playing under D1040. A failed or insufficient skill measure cannot block the core
   path.
5. Bots may use the same evidence vocabulary under their separate controlled-policy gate. A bot
   trait passing does not make the mirrored player skill pass, and vice versa.

The result preserves the user's integration vision: one evidence foundation can feed modules,
Review, bots, drills and longitudinal analysis, while each end-feature earns its own interpretation
instead of inheriting a raw evidence dump. `[M]`

## Limits

- This is a repo-synthesis/desk arm. No new learner corpus was collected.
- The five candidate rules are a closed measurement population, not production ids.
- R12's floors came from 200 blitz games per high-activity account over 59 hours and cannot be
  promoted into 1.0 defaults; only the two opening habits quote those measured floors.
- The learner-module count is contract state, not current runtime reach. Full registry wiring is a
  separate accepted implementation.
