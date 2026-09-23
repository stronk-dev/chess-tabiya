# D3262 bounded same-target contrast on the corrected frame

**Measured 2026-09-23.** Disposable research projection, not an explanation
module or production search profile. Run
`make semantic-search-coherent-bounded-contrast-check`. The checked artifact is
`d3262-coherent-bounded-contrast.json`, SHA-256
`1bbb39159e50cf203c7bcbea91a667da69cc27465d0c09be9d57d8ed87968e27`.
It joins 116 selected source-versus-natural-alternative pairs across the same
declared target and exact root, retaining 17 targets with no selected natural
alternative as unpaired. All input profiles and manifest identities are checked;
the test refuses a crossed target, a missing/budget-exhausted target result, a
missing root rank, or a target on the learner's rather than opponent's side.
`[V]`

The question is whether a named **opponent option**—a positive capture by the
registered attacker, or a locally non-losing arrival by the registered
minor—is available on either candidate. This is a conditional option, not a
claim that the opponent selects it, the engine values it, or the candidate is
good. Root Stockfish rank is joined only as a separate concordance observation
at each of the three coherent all-legal budgets. The 116 pair rows share roots,
targets and candidates; they are not independent games or a statistical sample.
`[V]`

| Relation between the two candidates | Same | Source only | Alternative only |
|---|---:|---:|---:|
| Opponent option immediately available | 32 | 18 | 66 |
| Opponent option available immediately **or** reintroduced within four plies | 103 | 5 | 8 |
| Reintroduction, **only when both options were initially removed** | 4 | 3 | 4 |
| One preparation survives every immediate defence, same restricted scope | 11 | 0 | 0 |

The scope restriction matters more than the percentages. Of 116 pairs, 84
compare an immediately removed target with one already available. A raw
`reintroducedWithin3Ply: false` on the latter means **no reintroduction was
needed**, not that the option is absent. Another 21 pairs have both options
available immediately. Only 11 pairs have both removed and support a
like-for-like bounded reintroduction/all-defence comparison. Without that
scope check, the 16 apparent source-only all-defence cases would be a false
contrast: all 16 compare against an alternative whose opponent option was
already available immediately. The permanent fixture requires the bounded
axes to be `null` and their rank comparison `incomparable_scope` in such
mixed cases. `[V]`

The inclusive within-bound reach differs in only 13/116 selected pairs: 5
source-only and 8 alternative-only. Of those 13 directional pairs, the
relation's learner-favouring polarity agrees with the separate Stockfish
root ordering in 4/13 at depth 8, 7/13 at depth 12 and 6/13 at 100 ms.
This is not a rate of correct explanations: target selection is inherited
from source positions, pairs overlap, rank widths and search depths are
separate provider configurations, and no counterfactual value proof or
product latency was established. A claim that the relation is *why* the
engine recommends a move would fail the tested attribution boundary. `[V]`

The result advances only the exact bounded/contrast axis of [[D3262]]. The
five-arm proof/abstention/cost comparison, configured-policy continuation,
semantic-reserve continuation, source-budget sensitivity and end-to-end
latency remain open. Until then a product may show a bounded fact with its
witness/refutation and scope, or abstain; it must not elevate the fact into
an engine-causality story. `[M]`
