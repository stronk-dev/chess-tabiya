# Feedback-delivery Stage 1 — resolved return on criterion 20

**Returned by implementation audit:** 2026-08-20

**Ledger:** D643/D644

## Why implementation was returned

The current Stage-1 code is aggregate-green and the CR1 measurement has been repaired, but the
accepted text contains a criterion that cannot pass without violating another normative clause.

C8 requires the principle-bearing provenance forms to render the selected principle's authored
`statement` and `counterCase`. Criterion 20 then requires the complete rendered line—including
those two authored fields—to contain none of `BANNED_JUDGEMENTS` or `PRESCRIPTIVE_VERBS`.

The disposable literal-population audit runs the actual `claimProvenance` function over every
current `PackRecord.claimBackings` row:

- projected rows: **67**;
- rows with at least one forbidden word: **46**;
- affected packs: **26**;
- the sole validating Philidor row also fails (`should`).

Examples are not renderer inventions. They come from principles such as *count before conclusion*
(`better`, `should`, `move`), *material serves purpose* (`winning`, `play`) and *threat before
opportunity* (`should`, `play`, `take`). Removing or paraphrasing those strings would break C8's
provenance promise and cross law 8's authored-truth boundary.

## Narrow author correction

**Applied 2026-08-21.** The accepted criterion and its executable audit now use this boundary;
the measured result is 67 rows, 46 carrying authored prohibited vocabulary and zero carrying a
template-owned prohibited token. The negative fixture injects `best` outside the authored ranges
and is refused. C8 and all authored principle text remain unchanged.

Keep C8 and its three output forms unchanged. Replace criterion 20 with a provenance-boundary test:

1. the frozen template literals themselves contain no banned judgement or prescriptive chess word;
2. every such token in a complete rendered provenance line is traceable byte-for-byte to one of the
   projected authored inputs (`principle.name`, `statement`, `counterCase`) rather than introduced
   by the template;
3. the renderer preserves those authored values unchanged and continues labelling them as the
   author's judgement and counter-case;
4. the author's claim sentence remains outside this criterion, as the existing criterion already
   says; and
5. the negative fixture injects a prohibited word into template-owned text and must fail even when
   the same word appears in an authored input.

This preserves the intended safety property—deterministic rendering adds no chess judgement—while
making the test apply at the boundary the renderer actually owns. It is an author correction to an
accepted, unimplemented criterion, not a new product feature or a weakening of provenance.

## Other Stage-1 residue

`stage-1-criteria.md` maps all criteria 1–20a. The recovery worktree now encodes the group-seeding
exploit, registry fallbacks, real-corpus Q8 measurement, three-way reach split, CR3 degeneracies,
claim-text REST negative, pivotal non-interference, rebound-withholding consequence, voice/speech
identity and corpus-wide earned-label checks. Criterion 12's gate edit remains a landing-time
obligation. Two findings remain deliberately outside the narrow criterion-20 correction:

- CR1 passes its accepted no-threshold criterion, but the real 44-fork measurement still admits
  86.0% of candidate entries, emits 7.32 entries/ply on 97.3% of plies and reaches only 1.017x
  lift. This is a valid filter and a poor learner module; D78/F2/F5 retain the UX problem.
- D528's zero-ply comparison column makes the intersection empty and disables CR1 for the whole
  comparison. CR3 did not specify that case, so implementation does not invent whether to exclude
  the column, refuse the comparison or accept the no-op. This remains a separate author/design
  correction rather than a hidden Stage-1 behaviour change.
- D645 no longer requires a feedback-delivery disposition. `authored-consequence-lifecycle` repaired
  the objective/content contract and added recurrence guards; the unchanged C1 driver now reaches
  50/50 packs (19/19 single-line, 14/14 learner-branch, 17/17 opponent-branch). No anchor and no
  softer predicate were added.

The RFC remains accepted/implementing until criterion 12 closes in the Stage-1 landing and the
scoped verification/browser proof is green. Stage 2 remains separate content work under D560.
