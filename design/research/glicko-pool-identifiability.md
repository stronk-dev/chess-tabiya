# Glicko pool identifiability and calibration reach

**Question.** Does a learner need a non-zero fraction of direct games against a calibrated bot
before Tabiya may publish a Glicko-2 point estimate, and does a closed human pool necessarily
"drift together indefinitely"? This is the research discharge for [[D2323]] in the returned
`native-ratings` RFC.

**Verdict.** The RFC's proposed direct-game threshold is the wrong observable. A closed pool has
an unidentifiable additive origin: translating every initial rating by +200 while preserving every
result translated every final rating by exactly +200 in the committed simulation. Calibration is
also a graph property rather than a per-learner boolean: learners with zero direct anchor games
inherited calibration through a connected opponent component, while an equally active disconnected
component retained the full +200 ambiguity. `[V]` `make rating-pool-research`,
`tools/d2323-rating-pool-research/results.json`.

This does **not** select a publication threshold. It replaces an unsupported policy rationale with
measured facts that an author and owner can use: distinguish a local-pool rating from a rating
claimed to share the bot-calibrated scale, and measure calibration strength over the connected game
graph rather than suppressing points whenever one learner's direct-anchor fraction is zero.

## Method

The disposable research harness imports the shipped `glicko2Update` implementation directly from
`packages/runtime/src/rating.ts`; it does not reimplement the update. `[V]` Eight stationary
synthetic learners, with latent strengths from 1260 to 1740, play one deterministic human game per
rating period. All updates use the pre-period snapshots, matching Glickman's definition that games
within a rating period are treated as simultaneous. The official worked example defines rating,
rating deviation and volatility, gives the rating-period update procedure, and uses initial rating
1500/RD 350; its expected-score term depends on the difference between player and opponent ratings.
It does not specify a Tabiya publication rule. `[V]`
[Mark Glickman, *Example of the Glicko-2 system*](https://www.glicko.net/glicko/glicko2.pdf).
Glickman's official site identifies Glicko-2 as the successor system and publishes the technical
documents. `[V]` [The Glicko system](https://www.glicko.net/glicko.html).

The harness runs four able-to-fail arms:

1. the same 500-period closed pool from initial 1500 and from initial 1700;
2. 32 deterministic result seeds over 500 closed-pool periods;
3. every learner playing a rating-1500/RD-24.1 anchor every 100, 20 or 5 periods for 600 periods;
4. two disconnected four-player components for 1,000 periods, with only one learner in the first
   component playing the anchor every five periods.

The committed JSON receipt is re-derived byte-for-byte by the test. The translation, dose and graph
claims each have a separate falsifier in `simulation.test.ts`. `[V]`

## Findings

### 1. Location is unidentified in a closed pool

All eight translated runs ended exactly 200 points apart (min/median/max/mean all 200). `[V]` This is
the structural result the RFC needed: result likelihoods depend on rating differences, so closed-pool
outcomes cannot identify an absolute origin. Calling this merely "drift" hides the stronger and more
precise limitation.

The separate stochastic-centroid arm does **not** support "drift together indefinitely." Across 32
seeds after 500 periods, movement from the initial 1500 centroid ranged from -18.426 to +15.342,
with mean -1.733. `[V]` The instrument therefore distinguishes additive non-identifiability from
finite stochastic movement; it does not demonstrate monotone or unbounded drift.

### 2. Anchor evidence is a dose

When every learner played the calibrated anchor, direct-anchor shares of 0.99%, 4.76% and 16.67%
left mean translated-run separations of 98.428, 46.897 and 3.188 points respectively. `[V]` A
non-zero direct fraction is not a sufficient calibration claim: one sparse anchor game in roughly a
hundred games still left about half of the original 200-point location ambiguity in this model.

Nor is a zero direct fraction necessarily grounds for suppressing a point. In the graph arm, the
three learners connected to the directly anchored learner had zero direct anchor games and a mean
remaining separation of 48.174. The four learners in the disconnected component also had zero
direct anchor games and retained exactly 200. `[V]` Direct fraction cannot distinguish those cases;
component connectivity and the amount/recency/uncertainty of the anchor path can.

### 3. The RFC needs two truthful products, not one overloaded number

The arithmetic supports publishing a rating that is meaningful **within its identified pool**; it
does not by itself make that point comparable with the existing bot-calibrated scale. `[M]` A repair
can therefore name the claims separately—for example, local-pool rating versus band-scale-equivalent
rating—and attach an explicit calibration receipt to the latter. The exact receipt metric,
threshold, decay and learner wording remain RFC/owner decisions, not findings manufactured by this
research.

## Consequences

- [[D2323]] is researched, but the native-ratings RFC remains returned: its zero/non-zero direct
  anchor rule is refuted rather than confirmed.
- [[D2324]] records that calibration reach belongs to the connected game graph, not solely to the
  learner row.
- [[D2325]] reserves precise language: additive non-identifiability is established; indefinite
  collective drift is not.
- [[D2326]] is the remaining policy decision: define the local-pool and cross-pool publication
  claims and a component-level calibration criterion before acceptance.
- No exploration hypothesis, continuation gate or kill criterion changes state.

## Limits

This is a deterministic synthetic, stationary-strength instrument with fixed period structure and
connectivity. It does not model learner arrival/departure, skill change, inactivity, adversarial play,
collusion, color effects, matchmaking selection or empirical human score noise. `[V]` It establishes
the exact translation identity in the shipped update and falsifies the proposed direct-fraction
boundary; it does not estimate a production-safe threshold or validate learner comprehension.
