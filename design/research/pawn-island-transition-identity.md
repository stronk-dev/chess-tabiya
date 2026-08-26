# Pawn-island transition identity

**Question.** Can the count-only `pawn_islands` event safely power Review, Support, drills, bot
features and longitudinal habits, or must it retain exact island topology?

**Verdict.** Version it. The exact state already ships in `pawnConnectivityReading`, but v1 emits
two rows on every move and labels both true no-op and count-preserving partition change
`preserved`. Ordinary consumers need only actual topology changes with exact before/after islands;
unchanged state remains available from the reading. Island count and topology carry no value or
weakness judgement. `[V]`

## Method

The disposable Node-24 harness in `tools/d1734-pawn-island-identity-harness/` derives each color's
ordered occupied-file partition from the shipped exact island reading. It compares that partition
across all 754 authored and 579 imported committed edges, then joins the result to the shipped
count-only events and the moving side. Rank-only pawn motion is a hard unchanged control. A legal
`b2c3` capture changing `[ab]|[d]` to `[a]|[cd]` is the count-preserving topology control. `[V]`

## Result

| population | current rows | current `preserved` | truly unchanged | count changed | topology changed, same count |
|---|---:|---:|---:|---:|---:|
| authored | 1,508 | 1,472 | 1,445 | 36 | **27** |
| imported | 1,158 | 1,092 | 1,057 | 66 | **35** |

V1's `preserved` bucket is therefore two meanings. It is 97.61% of authored and 94.30% of imported
event volume, even though only 63/101 color-edge relations actually change island topology. A
semantic event stream carrying two no-op rows per move recreates the raw-census problem after the
selector boundary. `[V]`

Changes are not mover-relative: 39 authored / 47 imported affect the moving side, while 24 / 54
affect the opponent. Captures can split, merge or shift the opponent's occupied-file partition.
Attributing an island change only to the moved pawn's color would discard nearly all imported
opponent-side changes. `[V]`

## Successor

```text
rules.structural.event.pawn_islands@2
  beforeFen + moveUci + afterFen
  color
  beforeIslands[] { files[], pawns[] }
  afterIslands[]  { files[], pawns[] }
  changedBefore[] + changedAfter[]
  sign: count_gained | count_lost | topology_changed
```

The event emits only when the occupied-file partition changes. Exact pawn squares come from the
same D1728/pawn-connectivity authority; no second scan is permitted. `topology_changed` is the
missing equal-count state. Rank-only motion, doubled-pawn membership change on the same occupied
files and every genuine no-op remain absent here and available through their proper file-group or
state readings.

## Consumer boundary

- **Requested sight:** exact current islands, files and pawns from the state reading.
- **Postcommit/Review:** only actual topology changes, highlighting every affected island on either
  side; do not emit “preserved.”
- **Drills:** existing count conditions remain compatible; exact topology conditions require an
  explicit future authoring version rather than changing old truth.
- **Bots/style/skills:** consume exact changes with opportunity denominators and phase. Count gain
  is not intrinsically bad and count loss is not intrinsically good.
- **Theory:** may join exact state/change to cited structure material; the collector supplies no
  plan.
- **Advanced:** may show full current connectivity state, including unchanged relations.

## Repair order

1. Reuse exact pawn/file identities from D1728 and the shipped connectivity reader.
2. Version the event and add count-gain, count-loss, equal-count topology and true-no-op fixtures.
3. Retire v1 from semantic selection/avoidance; retain it only where historical compatibility
   requires the bytes.
4. Bind D1710 execution, D1711 independent validation and D1718 subject-first denominators.
5. Amend module-registration per D1726: state on request, changes postcommit/Review, raw inventory
   Advanced only.

## Gate result

The exploration gate is open. Exact source identity exists, both failure classes are measured on
fixed populations, cross-side attribution is bounded, and all successor signs have able-to-fail
controls. No production, RFC, schema, pack, content or learner-UX byte changed. `[V]`
