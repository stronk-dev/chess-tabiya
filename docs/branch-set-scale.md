# Branch-set scale

Large branch sets are managed without ranking attempts or recommending a winner.

## Automatic collapse

The rail derives a unary decidedness fact for every branch. Rules outcomes and terminal objective states are free grounds. A learner-requested tablebase classification is also admissible after disclosure and at seven pieces or fewer. Tablebase categories are converted from the side-to-move perspective into the learner's perspective before classification.

Automatic collapse requires a settled **shortfall against the run's objective**. It never treats a merely non-admitted result as a shortfall: wins under a hold objective remain visible, and tablebase results never auto-collapse save or resist attempts. Unknown, unavailable, withheld, out-of-range, and indeterminate leaves stay visible.

Collapse begins only above the shared eight-branch readability floor. The active branch, compare-selected branches, and branches the learner explicitly expanded stay visible.

## Manual fold

Hide is a browser-local view preference stored per run. It emits no event, cancels no evidence, changes no compare selection, and changes no PGN or graph bytes. The rail separates “Settled outcomes” from “Hidden by you” because only the first carries a grounded explanation.

## Bounded work

Opening, folding, expanding, and comparing the rail enqueue no engine work. The runtime constructs every branch path from one shared node index instead of rebuilding a full map per branch. The optional “Classify remaining” action accepts at most eight ids and probes the single-flight tablebase source sequentially, avoiding self-exhaustion.

The comparison cap is exported once as `MAX_COMPARISON_BRANCHES`; the collapse floor aliases it. When “Compare all forked here” sees more candidates, it selects at most eight and states the truncation.
