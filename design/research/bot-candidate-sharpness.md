# Bot candidate sharpness — does engine-priced choice breadth predict where humans err?

**Question:** D816, with the already-captured evidence needed to settle D817. Does a
position-level MultiPV spread provide a useful, grounded input to an opponent policy, and does
querying Maia at several bands reveal where human skill changes move choice?

**Feeds:** F8, D810–D823, the candidate-evidence adapter, and the explicit refusal to let an
opponent-selection feature become a learner grade.

**Method:** disposable measurement under RFC-0000's exploration gate. The harness and committed
summary are `tools/d816-bot-candidate-harness/`. All claims below are direct readings of that
summary or of the earlier sealed Maia/explorer comparison named in §4, and are `[V]` unless marked
otherwise.

## 1. Verdict

**D816 survives, but as engine-priced choice breadth—not an “only move” label. D817 fails.**

Across the fixed R9/R11 population, the fraction of legal moves at least 250 cp behind the engine's
best has a stable rank relationship with the human mass placed on such moves: Spearman
**0.524 / 0.514 / 0.556** at explorer bands 1400 / 1600 / 1800. The inverse statistic—the fraction of legal
moves within 50 cp of best—has Spearman **−0.486 / −0.481 / −0.589**. The sign holds at every band,
so the result is not created by pooling three observations of each position. `[V]`

The seductive shortcut is weaker. Best-to-second gap correlates only **0.312 / 0.313 / 0.395**
with severe human error mass. F8 should therefore admit a bounded *distribution* (or sufficient
statistics over it), not turn one gap into a binary “only move” fact. `[V]`

The result does **not** establish middlegame breadth. The fixed explorer population yields 462
usable opening cells, 136 cross-phase cells, only 35 declared-middlegame cells and zero endgame
cells. The severe-fraction relationship is **0.574** in opening and **0.506** cross-phase, but only
**0.181** on those 35 middlegame cells. D816 is sufficient to specify and retain the projection for
opponent policy; it is not sufficient to claim that the projection models middlegame human error
until the population grows. `[V]`

Multi-band Maia disagreement does not survive. The earlier sealed comparison already ran D817's
proposed experiment on the same 279 positions and 1,171–1,283 shared move rows: correlation between
Maia's band-to-band policy movement and the human band's movement is **0.021–0.044**, with sign
agreement **47.2–52.0%**. The human movement has a measurable non-sampling component, so “nothing
moved” is not the explanation. Runtime queries to several Maia bands would multiply cost without a
validated human-difficulty signal. D817 should close as a measured refusal. `[V]`

## 2. Population and joins

The position population is the same authored-line snapshot already used to validate Maia WDL:
**279 positions × three explorer bands**. Stockfish 18 was probed at fixed depth 12 with MultiPV set
to the full legal-move count; all **279/279** probes reached depth 12. The human side is R9's
committed Lichess explorer snapshot rather than a fresh request, so counts cannot drift between the
two experiments (`design/research/maia-wdl-versus-human-outcome.md` §2). `[V]`

Explorer data is nonzero in **633/837** position-band cells. The other 204 are the already-measured
population-coverage wall, not missing engine output. Across usable cells, the explorer's listed
moves cover **91.30%–100%** of total games (median **99.66%**). The analyser reports severe mass in
two honest forms: a lower bound over the full explorer total and a conditional value over mapped
listed moves; it never assigns an engine score to the unlisted tail. Both forms produce the same
rank result to three decimals. `[V]`

All SAN rows resolve. Ninety-eight castling rows initially exposed the repo's two known UCI
encodings (`e1h1`/`e8h8` from chessops versus engine `e1g1`/`e8g8`); the harness canonicalizes that
declared equivalence before joining, matching D633's shipped semantic-event convention. This is an
instrument join, not a new chess inference. `[V]`

## 3. What “sharpness” means here

For each position, let `loss(m) = best engine score − engine score(m)`, mover-framed. The harness
records five raw statistics rather than naming a chess concept:

| statistic | population median | middle 50% |
|---|---:|---:|
| best-to-second gap | 9 cp | 3–21.5 cp |
| legal moves at least 250 cp behind | 24.0% | 14.3–34.3% |
| legal moves within 50 cp | 24.3% | 9.1–42.9% |
| median legal-move loss | 91 cp | 59–167 cp |
| 90th-percentile legal-move loss | 471.8 cp | 357.2–576.2 cp |

The 250 cp severe threshold is inherited from R11's guarded-policy experiment
(`design/research/bot-policy.md`); this pass did not optimize it after seeing the outcome. The 50 cp
window is a descriptive companion, not a proposed product threshold. `[V]`

The quartile contrast makes the rank result concrete while also showing why it must not become
alarmist UI. In the lowest quartile of legal severe-move availability, the median position has
**8.3%** severe legal choices and median observed severe human mass **0%**. In the highest quartile,
those figures are **44.9%** and **0.195%**. Conversely, the lowest near-best-choice quartile has
median severe human mass **0.169%**, while the highest has **0%**. The ordering is real; the absolute
observed mass on these popular authored opening lines is small. `[V]`

## 4. Why D817 is already answered

`design/research/maia-wdl-versus-human-outcome.md` §9.5 and
`tools/maia-wdl-agreement-harness/out/summary.json#bandResponsiveness` compare the exact object D817
names: per-move policy-mass change when Maia's band changes, against per-move population-frequency
change for humans over the same band pair. `[V]`

| band change | shared move rows | Pearson | sign agreement |
|---|---:|---:|---:|
| 1400→1600 | 1,239 | 0.021 | 52.0% |
| 1600→1800 | 1,283 | 0.044 | 47.2% |
| 1400→1800 | 1,171 | 0.034 | 49.3% |

The earlier dossier used this result to refuse Maia WDL as a campaign difficulty oracle. D817 had
mistakenly left the identical policy-movement experiment open under the bot lane. Re-running the
sidecars would be duplicated research, not stronger evidence.

This does not say Maia bands are identical: D333 separately measures a real but attenuated playing
strength effect. It says the *local disagreement vector* has not tracked where human move choice
changes with band, so that vector has no evidence-backed role as a selector or guidance feature.

## 5. Product boundary

F8 may consume the full candidate-loss distribution or named sufficient statistics under an
`opponent.selection`-only binding. It must preserve:

- engine identity, depth/budget, legal-set completeness and score frame;
- the raw threshold/window parameters rather than a prose label;
- abstention when the candidate vector is capped or incomplete; and
- the existing refusal at `apps/server/src/capabilities.ts` to treat MultiPV rank as a learner
  verdict.

The projection tells a bot policy how many costly alternatives exist. It does not say a person
“should calculate,” call a move a blunder, or explain why any candidate is difficult. Those claims
need separate human/time evidence and, for a learner-facing module, a declared renderer.

D815 remains genuinely unmeasured. Its proposed “threat just created / attacker just moved” test
requires the exact threat and identity-retention semantics currently specified in the tactical
collector draft. Current `structuralDelta` only diffs observation identities and cannot establish
the counterfactual threat relation the experiment claims to condition on. Approximating that join
now would test a different feature. D815 therefore moves *behind tactical collector landing* and is
excluded from the first F8 stack unless and until its own measurement passes.

## 6. Consequences

1. **D816:** research-settled go for a typed, opponent-only distribution projection; retain the
   middlegame/endgame coverage caveat.
2. **D817:** settled refusal; remove multi-band runtime queries from the F8 dependency map.
3. **D815:** not a blocker for the measured 1.0 roster; measure after exact tactical identities
   exist, before any salience weight ships.
4. **F8:** no further generic bot survey is needed. Its remaining gates are the O8 owner ruling and
   the collector RFC acceptance/landing path already named in the dependency map.

No `DESIGN-GAP:` is opened. The result narrows a proposed bot feature and preserves the standing
learner-grading refusal.
