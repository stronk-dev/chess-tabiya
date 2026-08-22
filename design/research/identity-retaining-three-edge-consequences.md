# Identity-retaining defender consequences across three plies

**Question.** Can Tabiya move beyond one-edge “a defence relation disappeared” facts and detect
the literal tactical sequence that follows, without manufacturing removal, deflection, overload,
force or intent?

**Verdict.** **Yes for exact observed sequences; not yet for named causal tactics.** `[V]` In
6,775 consecutive three-ply windows from the sealed imported sample, 29 lose a defender→target
edge on ply one and positively capture the same retained target on ply three; 26 of those literally
capture the exact defender on ply one. A separate 13 windows newly expose the exact defender to a
positive local capture, observe it relocate on the reply and lose its former edge, then positively
capture the same target. The 622 authored branch triples contain **zero** examples of all three
forms.

This answers D772's census arm. It establishes the sequence vocabulary and a pack-fixture gap, not
played-vs-alternative selectivity or a forcing/counterfactual consequence.

## 1. Exact identities and boundaries

The disposable D772 instrument retains:

- defender color, role and square;
- target color, role and square;
- the exact before/after defender edge;
- all three committed UCI moves and intermediate positions;
- whether ply one captured the exact defender;
- whether ply one newly gave the mover a positive `legal-exchange@1` capture of the defender;
- whether the reply relocated that exact role from that exact square and lost its target edge;
- whether ply three captured the unchanged target with a positive `legal-exchange@1` result.

`[V]` Legal moves and piece state use chessops; capture value uses the independently tested D730
convention ([chessops source](https://github.com/niklasf/chessops);
`legal-exchange-prerequisite.md`). This is rules/convention arithmetic. It does not require an LLM,
engine evaluation or a tactical-theme classifier.

Three names describe only the recorded bytes:

1. `defense_edge_lost_then_target_captured@1`;
2. `defender_captured_then_target_captured@1`;
3. `defender_harassed_relocated_then_target_captured@1`.

The first and third are not mutually exclusive in a future wider horizon, but the current third
form requires the original edge to survive ply one and disappear on the reply. The captured form
is a subset of the first in the measured paths.

## 2. Falsifiers

`[V]` Four focused fixtures pass:

- exact defender captured, reply retained, same target positively captured;
- exact defender newly exposed to a pawn capture, relocated on reply, former target positively
  captured;
- target identity replaced before ply three—must not fire;
- exact defender removed but the later target capture is locally losing—must not fire.

The last two prevent a visually plausible move sequence from passing on square coincidence or raw
capture order alone. Fixtures and implementation are in
`tools/d772-three-edge-harness/three-edge.test.ts`.

## 3. Corpus census

| Population | Consecutive triples | Edge lost ply 1 → target captured ply 3 | Exact defender captured ply 1 | Newly harassed defender relocated on reply |
|---|---:|---:|---:|---:|
| authored branch paths | 622 | 0 | 0 | 0 |
| sealed imported games | 6,775 | 29 | 26 | 13 |

`[V]` Full witness identifiers and moves are committed in
`tools/d772-three-edge-harness/output.md`. The imported sample therefore contains 42 literal
captured-defender or harass/relocate candidates across 6,775 windows (0.62%). This is a prevalence
figure, not precision: the instrument has no oracle for whether the first move caused the reply or
whether the player intended the target capture.

The zero authored count is not evidence that the event is unimportant. It means current packs
cannot serve as non-vacuity fixtures or validate learner wording for this family. Production work
must add dedicated fixture packs or test fixtures only after an accepted collector RFC; existing
packs must not be bulk-relabelled from a corpus-wide detector.

## 4. What may and may not be said

Permitted deterministic forms include:

- “This defender was captured; after the reply, the same target was taken.”
- “This piece was newly attacked, moved away, and no longer defended this target; the target was
  taken next.”

The following remain refused without additional evidence:

- **removal of the defender / deflection** — standard tactical names imply functional causality;
- **forced** — requires enumerating the opponent's relevant replies;
- **overloaded** — requires at least two retained duties plus a proof that no reply preserves both;
- **wins material / good sequence** — local exchange on the final capture is not whole-position
  evaluation;
- **planned or intended** — no observed sequence establishes mental state.

An authored theory or pack claim may name a tactic over these exact operands. A bounded search may
establish reply coverage. An LLM may render only the admitted level; it may not supply the missing
causal adjective.

## 5. Product routing

- **Review/analysis:** high-value candidate moments because identity persists and a consequence is
  observed; show the three moves as one compact module, not three raw evidence strings.
- **Drills/packs:** exact sequence triggers can express “play the consequence” directly once the
  RFC and canonical fixtures land. Existing packs remain valid and opt in.
- **Live support:** the observed-sequence collector cannot predict the reply. A separate bounded
  threat/reply projection is required before showing a pre-commit warning.
- **Bots:** record which candidate policy created or allowed the exact sequence; do not claim the
  bot intended a named tactic unless the policy declared that feature.
- **Player habits:** count only eligible opportunities with a reply/capture denominator. Raw
  sequence counts are too rare and opportunity-dependent to define tactical style.

## 6. Remaining work

The next consequence questions are counterfactual: enumerate relevant replies, preserve stable
piece identity through captures/promotions, distinguish defender removal from incidental exchange,
and define overload/interference/clearance separately. This dossier supports an additive sequence
projection family; it does not authorize one catch-all `tactic` label.
