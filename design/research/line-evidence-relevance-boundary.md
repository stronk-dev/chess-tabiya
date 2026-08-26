# Line evidence relevance and identity boundary

**Question.** Does 1.0 need another generic line detector for Support, Review, drills, bots and
style, or can the existing blocker, ray, discovered and clearance primitives form one truthful
family once their identities and consumer boundaries are repaired?

**Verdict.** Do not add a universal “relevant line” collector. The repository already computes
five different chess questions that happen to share line geometry. The live learner surface shows
the least meaningful one—board-edge blocker inventory—while every target-bearing source stops in
the manifest or research selector. Repair the count-only transition, bind the exact sources, and
make relevance a module question over a named slider/blocker/target or requested square. `[V]`

Instructional terminology supports keeping these relations separate. Pins, skewers and discovered
attacks are named tactical relations, not synonyms for “pieces exist somewhere along a board-edge
ray.” `[P]` ([pin](https://www.chess.com/terms/pin-chess),
[skewer](https://www.chess.com/terms/skewer-chess),
[discovered attack](https://www.chess.com/terms/discovered-attack-chess))

## Method

The disposable Node-24 harness in `tools/d1730-line-relevance-harness/` executes the shipped
readers and events over the fixed authored/imported populations. It measures unique before/after
positions, committed edges and complete three-edge windows. A separate exact board-edge scan tests
whether blocker membership can change while blocker count remains equal—the state the shipped
event explicitly ignores. `[V]`

The harness also compiles the current evidence manifest and pins every consumer join. Its
synthetic control shows that `line_blockers(a1,a8,count=0)` is emitted for an empty rook ray whose
endpoint `a8` has no occupant, while both target-bearing ray readers correctly emit nothing. `[V]`

## Five distinct questions

| source | question it answers | identity retained | truthful ceiling |
|---|---|---|---|
| `rules.structural.reading.line_blockers` | how many occupied squares lie between a slider and this board-edge endpoint? | slider square + empty/occupied edge endpoint + count | author predicate / Advanced inventory |
| `rules.tactic.reading.ray_classification` | do a slider and two occupied pieces form the declared pin/skewer/X-ray geometry? | slider, front blocker, rear target, full ray, comparison | requested sight, selected state pattern |
| `rules.tactic.reading.discovered_latency` | is one friendly non-king screen hiding check or a positive local capture? | screen, slider, enemy target, ray, capture/exchange | requested sight or selected pre-existing threat; never “move it” |
| `rules.transition.event.slider_ray` | did the number of blockers on a stationary slider→edge ray rise or fall? | slider, board edge, before/after blocker arrays | compatibility/research only until v2 |
| `derived.tactic.discovered_executed` | did the played screen move expose the exact retained latency target? | edge + screen + slider + target + gained ray | postcommit/Review fact |
| `derived.tactic.line_blocker_clearance_observed` | did a friendly sole blocker vacate and the same slider later capture the retained target positively? | three-edge path, blocker, slider, target, capture | postcommit/Review observed consequence |
| `derived.tactic.square_clearance_observed` | was a vacated square later used or crossed by a same-side slider? | three-edge path, square, vacating piece, later slider/move | postcommit/Review observed geometry |

The last two are deliberately not interchangeable: target-capture line clearance excludes the
quiet square-use case, while square clearance makes no target or value claim. `[V]`

## Population reach

| population | positions | structural facts | board-edge blocker rows | share | target rays | latency screens |
|---|---:|---:|---:|---:|---:|---:|
| authored | 643 | 41,115 | 11,556 | **28.11%** | 5,772 | 174 |
| imported | 1,152 | 93,323 | 29,075 | **31.16%** | 15,393 | 754 |

Raw board-edge rows are therefore nearly a third of the structural dump. Target-bearing ray
classification is narrower but still not a significance filter: 5,429/5,772 authored and
14,205/15,393 imported rows are X-ray attack/defence, while pins and skewers are the minority.
The collector truth is useful; dumping all of it is not a learner workflow. `[V]`

Across 754 authored and 579 imported committed decisions, the generic transition emits 751/746
gained and 371/422 lost count events. Only 5/9 edges execute the stricter discovered-latency join.
Across 622/6,775 complete three-edge windows, exact target-capture line clearance occurs 0/23 and
quiet square clearance 24/374 times. These are different reach profiles, not missing synonyms.
`[V]`

## D1731: count is not identity

`transitionSemanticFacts` compares only `left.blockers.length` and `right.blockers.length`. If the
sets differ at equal size, it emits no `slider_ray` event. The exact reconstruction finds **109
authored and 126 imported count-preserving membership changes**. Relative to all detected
blocker-set changes, v1 omits 8.85% authored and 9.74% imported. `[V]`

The repair is additive and explicit:

```text
rules.transition.event.slider_ray@2
  beforeFen + moveUci + afterFen
  slider { square, color, role }
  endpoint
  blockersBefore[] + blockersAfter[]
  sign: gained | lost | membership_changed
```

This remains a board-edge inventory event; versioning it does not manufacture a target. Target
meaning comes only from an exact join to `ray_classification`, `discovered_latency`, a retained
defence/attack relation, or an observed consequence.

## Consumer contract

- **Requested sight/hover:** query the selected piece or square, then show a bounded target-bearing
  relation with literal highlights. Never render every ray on the board.
- **Precommit Support:** may show an existing pin/screen/target relation within the workflow's
  answer ceiling. It may not name a move or claim a screen should vacate from geometry alone.
- **Postcommit/Review:** prefer exact gained/lost target relation, discovered execution, or observed
  clearance. A raw blocker-count change is not a review moment.
- **Drills:** retain current line-count predicates for authored compatibility; new guided content
  references the exact relation identity it teaches.
- **Bots:** exact state relations may become declared feature operands. Observed three-edge events
  are review labels, not candidate-time features.
- **Style/skills:** require opportunity denominators and stable longitudinal storage. A ray census
  or one observed clearance is not a player trait.
- **Advanced:** may expose the full raw board-edge inventory with provenance and source identity.

## Repair order

1. Version the target-free blocker-membership event and bind equality-change positives/negatives.
2. Preserve target-bearing ray and discovered payloads as their own authorities; do not merge them
   into one `line` union with optional operands.
3. Bind each real application operation through D1710 and independent semantic fixtures through
   D1711 before module activation.
4. Amend module-registration per D1726: ordinary modules select exact question-bound relations;
   legacy blocker rows remain compatibility/Advanced inputs.
5. Add typed reducers for selected-piece sight, postcommit relation delta and Review consequence.
   Selection is the relevance layer; it is not another chess-truth collector.

## Gate result

The source-research gate is open. Existing primitives cover static target geometry, latent
discovery, exact played execution and two observed clearance meanings. The only new source work is
the v2 blocker-membership event; the larger gap is production binding and module reduction. No
production, RFC, schema, pack, content or learner-UX byte changed. `[V]`
