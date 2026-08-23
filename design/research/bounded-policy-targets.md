# Named-target removal and return under bounded policies

**Question.** Can Tabiya truthfully explain that a move stopped or preserved one exact opponent
continuation over the next three plies, without relabelling attack geometry as intent or calling a
low-breadth line forced?

**Verdict.** `[V]` Yes, but as several typed facts with different authorities—not one
“prophylaxis” detector. Rules can say that the same named material target is removed now and later
reappears within the declared three-ply horizon. Stockfish can add a depth-labelled principal-policy
result. Maia can add bounded, band-labelled selection/second-opportunity mass only where every
expanded node retains at least 90% of returned probability. Nothing measured establishes intent,
strategic purpose, objective quality or a universal human likelihood.

This closes D1023's collector research gate. The admitted operands belong in requested Support,
Review, bot-policy features and authored drill joins. They do not authorize a default stream of
sentences, a move grade, or a strategic label.

## 1. Exact rules arm: removal is broad; durable prevention is rare

The fixed population census tracks one exact pre-candidate positive capture by attacker identity,
target identity and squares. It distinguishes immediate removal, later reintroduction and survival
through every legal defence. All legal opponent moves and defender replies are enumerated under a
25,000-position cap; no measured candidate exhausted it. Eleven focused tests include positive,
hard-negative, identity, castling and terminal controls. `[V]`
(`tools/d1023-bounded-policy-harness/exact-target.test.ts`,
`tools/d1023-bounded-policy-harness/exact-census-output.md`)

| population | target identities | played removed now | alternatives removed now | removal lift | played reintroduced | survives every defence |
|---|---:|---:|---:|---:|---:|---:|
| authored pack spines | 147 | 120 (81.63%) | 969/4,870 (19.90%) | **4.10×** | 69/120 | 2/120 |
| sealed imported sample | 255 | 188 (73.73%) | 2,309/8,927 (25.87%) | **2.85×** | 130/188 | 0/188 |

`[V]` The immediate relation is both non-vacuous and discriminating in these populations. The
stronger story is usually false: 57.5% of authored and 69.1% of imported played removals restore the
same target within the horizon. Only two authored played targets and no imported played target
survive every defence. “Removed now” and “reintroduced within three plies” are therefore useful
exact facts; “unavoidable within the horizon” is an honest rare operand, not an everyday hint.

The pawn-created destination family produces a different conclusion. All 75/75 authored targets
and 50/52 imported targets become locally non-losing again, but 72 and 49 do so because the
controlling pawn moves or disappears. None survives every defence. `[V]`
(`exact-census-output.md`, **Pawn-created minor-destination targets**). This does not justify a
three-ply “prevented the square” claim. The existing one-edge fact—same legal destination newly
becomes locally losing to the moved pawn—is the truthful overlay operand; theory or a policy source
must supply any wider meaning (`design/research/legal-square-denial.md`).

## 2. Stockfish arm: stable when the depth remains visible

The sealed provider sample contains 16 material anchors per population, each paired with one
hash-selected legal alternative over the same source position, attacker and victim, plus 16
standalone destination probes. This corrects an earlier unpaired sample that could not support its
own candidate delta. `[V]` (`tools/d1023-bounded-policy-harness/provider-sample.json`, D1032)

Stockfish 18 agrees on its depth-8/depth-10 result category for **88/96 rows (91.67%)**, above the
predeclared 90% gate. All 308 legal-root tables are complete and every entry reaches the requested
depth. `[V]` (`tools/d1023-bounded-policy-harness/stockfish-output.json`)

For the paired material arm, the played candidate lowers immediate target selection relative to
the alternative in 9/16 authored and 5/16 imported anchors at both depths; it raises it in 1/16 for
each population. Second-opportunity availability is mixed. `[V]` These deliberately stratified
sets validate the exact comparison and direction per pair; they are not population-frequency
estimates. A production fact must retain engine identity, depth, typed cp-or-mate score, target,
candidate and alternative. Eight unstable rows abstain rather than inheriting either depth.

The 308 fresh Stockfish probes measured 72.0/337.0/630.8/735.1 ms at p50/p90/p99/max. A warm pass
was not measured. `[V]` (`stockfish-output.json`) This is a workflow cost input, not permission to
put engine search on every gesture.

## 3. Maia arm: useful bounded evidence with explicit availability

The same 96 rows were evaluated separately at model bands 1000, 1400, 1800 and 2200, temperature
0.8 and top-p 0.92. The tree retains at most eight moves per node and admits a row only if the root
and every expanded second node retain at least 90% probability mass with no missing candidate
masses. Missing/tail mass stays in the upper bound and is never renormalized. `[V]`
(`tools/d1023-bounded-policy-harness/maia-probe.mts`, `maia-output.json`)

| model band | admitted / 96 | admitted material pairs / 32 | next-execution direction played−alternative (up / down / unclear) | second-opportunity direction (up / down / unclear) |
|---:|---:|---:|---:|---:|
| 1000 | 52 | 18 | 2 / 13 / 3 | 4 / 5 / 9 |
| 1400 | 66 | 25 | 3 / 17 / 5 | 6 / 7 / 12 |
| 1800 | 77 | 27 | 5 / 17 / 5 | 8 / 8 / 11 |
| 2200 | 85 | 28 | 4 / 19 / 5 | 8 / 9 / 11 |

`[V]` Lower bands lose more rows because their probability distributions are wider: at band 1000,
12 roots and 40 rows' expanded second nodes fall below the mass gate; at band 2200 those counts are
4 and 8. Refused rows are excluded from positive counts and a pair is compared only when both sides
are admitted. This is availability semantics, not evidence that lower-rated play is invalid.

The immediate candidate comparison is directionally coherent with the Stockfish arm—played moves
more often reduce than raise the exact target's next-selection mass—but the second-opportunity
comparison remains mixed. The four bands must remain separate. “Human players are unlikely to play
this” and a cross-band average are not supported.

The first full HTTP pass measured 91.0/161.7/279.2/1,185.0 ms at p50/p90/p99/max, with up to 36
requests possibly warmed by the preceding smoke. An immediate cache replay measured
0.4/0.7/1.0/2.7 ms; a true cold-container distribution is unmeasured. `[V]`
(`tools/d1023-bounded-policy-harness/maia-timing-output.md`) The output preserves the Maia model id,
version, applied band and the fact that the request seed is not honored.

## 4. Product boundary and RFC handoff

The collector RFC may now define versioned, identity-retaining projections for:

- exact `removed now`, `preserved now`, `reintroduced within three plies`, and the rare
  `survives every legal defence within three plies` result;
- a Stockfish depth-labelled target-policy result that abstains on depth disagreement;
- Maia band-labelled lower/upper bounds for next execution and second-opportunity availability,
  with a typed refusal when the retained-mass gate fails.

The projections must keep target family, exact pieces/squares, candidate, counterfactual, horizon,
authority and witness/refutation line. They must not emit `prophylaxis`, `plan`, `intent`, `forced`,
`best`, `mistake`, `good` or `bad`. Strategic interpretation remains a join to cited theory or
authored content; an LLM may render only the admitted payload.

Consumer posture follows the measured shape:

- **Support/touch:** exact current-square or named-target explanations on request; no provider call
  merely because a piece was hovered.
- **Review:** select a removal/reintroduction moment when another admitted significance source
  makes it review-worthy; show the target and counterfactual visually.
- **Bots:** use the Maia/Stockfish quantities as declared policy features, never as a move grade or
  a claim that Maia alone is human.
- **Drills/theory:** authored/cited claims may name the strategic idea while these projections prove
  the concrete line and its bounded exceptions.
- **Style/longitudinal:** retain opportunity denominators and source availability before inferring a
  habit; this research authorizes no player-type label.

The evidence foundation is therefore closed for this named-target question. Presentation,
selection, presets, longitudinal storage and bot personalities remain downstream contracts; they
must consume these typed facts rather than recreate chess truth in UI prose.
