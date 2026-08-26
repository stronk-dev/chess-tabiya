# Review evidence compiler — author buildability checkpoint

**Date:** 2026-08-26

**Role:** codex, the RFC author; this is not the required independent buildability review

**RFC:** `rfc/review-evidence-compiler.md`

**Verdict:** return before independent review or implementation

## What survives

The central architecture remains correct and necessary for 1.0 Review:

- one node-free fixed-bound Stockfish position evaluation shared by Review and candidate scoring;
- typed `centipawns | mate` values with no mate-to-cp sentinel or clamp;
- White-perspective engine evidence, with consumer-local perspective conversion where required;
- cp-only deltas and a separate mate-transition domain;
- partial per-family availability rather than an all-providers-ready gate;
- a sealed, process-local candidate packet feeding deterministic server-side consumers;
- Story as a compatibility projection, not the final Review selection policy.

The fixed C4 measurements—661 positions / 658 transitions and the WDL normalization figures—remain
research evidence. This checkpoint does not dispute them. It checks whether the drafted contract can
truthfully reach the production Story/Review path.

## Return reasons

1. **D1644 — White WDL repeats the node-bound source error.** `WhiteWdlPoint` is a read-time
   transformation of raw side-to-move WDL plus request FEN. Calling it a second live source and
   putting `nodeId` on it makes a run occurrence part of a reusable engine measurement. It must be
   a node-free derived normalization retaining its exact raw inputs, followed by a separate recorded
   position join.
2. **D1645 — the exact mate-proof link has no exact position anchor.** The proof's declared
   `candidate`/`attacker`/`proofDigest` values do not identify which recorded position produced it,
   and the edge does not carry the proof digest. Packet node identity cannot repair that missing
   edge. A versioned proof/occurrence projection must expose declared before/after position authority
   before Review can make the link.
3. **D1646 — criterion 12 repairs the wrong queue operation.** Production imports and Story reads
   enter `RunService.#ensureStoryEvidence`, which calls `EvidenceQueue.enqueue`, not
   `enqueueProducer`. The acceptance test can therefore go green without changing the live path.
4. **D1647 — engine identity is sampled outside the engine exchange.** Constructor state cannot
   prove which restarted/re-handshaken engine produced later bytes. Request identity belongs in the
   work key; actual identity must be returned by the same engine exchange and compared before
   attachment.
5. **D1648 — `last_level` omits learner-side conversion.** The new point is White-perspective, while
   the existing Story convention is learner-perspective. Black-side fixtures invert under the
   drafted rule.
6. **D1649 — the sealed packet has no production termination.** F1 seals are process-local and
   cannot cross JSON. The RFC names neither the server-local consumer/renderer nor a closed
   serializable Story/Review receipt and browser parser, so it can land unused or recreate D1582.
7. **D1650 — whole-game enrichment is unbounded.** “Eval and WDL for every node” can enqueue a very
   large import all at once. Queue concurrency limits execution, not retained jobs, retries or
   provider cost. Full Review needs progressive bounded scheduling and truthful scheduled/pending/
   not-yet-scheduled states, not truncation.
8. **D1651 — derived confidence widens its source.** A bounded-search measured/reported engine item
   remains measured/reported when joined to an exact run position. Eval point and every downstream
   comparison must inherit the weakest input and compile through the real F1 widening check.

## Required amendment order

1. Finish the shared candidate packet's D1636 score-frame repair and define the one reusable engine
   exchange receipt: requested identity/bound/FEN plus actual same-exchange identity and typed score.
2. Publish literal F1 declarations for the node-free eval source, White-WDL normalization, recorded
   node joins, cp delta and mate transition. All retain exact inputs and weakest confidence.
3. Version the forced-mate proof/occurrence authority with declared position endpoints; refuse the
   Review proof link until that projection is present.
4. Replace the two queue paths with one idempotent Review request identity, then define a progressive
   scheduler with a fixed outstanding bound, cursor, retry/backpressure and terminal semantics.
5. Name the server-local packet compiler/consumer and its exact service call. Emit one closed JSON
   receipt for Story/Review family states and selected compatibility items; the browser never claims
   an F1 seal.
6. Define the Story compatibility adapter, including White-to-learner conversion for `last_level`,
   typed mate ordering, and the existing cp-only tiebreak.
7. Re-run author buildability, then send the amended RFC through the independent review it already
   requires. Only after acceptance may implementation begin.

## Able-to-fail fixtures the amendment owes

- the same raw WDL and FEN joined to two run nodes yields one normalization and two occurrence joins;
- an otherwise identical forced-mate proof from the wrong position cannot link;
- repeat production `story()` calls at equal and unequal bounds exercise the actual service path;
- an engine restart between enqueue and execution cannot be stamped with the stale constructor id;
- sign-mirrored White/Black learner games produce the same learner-relative `last_level` result;
- JSON round-trip never reconstructs or asserts a process-local evidence seal;
- a long synthetic legal PGN never exceeds the declared outstanding-job and retained-work bounds,
  but eventually reaches complete requested-family coverage;
- changing any derived Review item to `confidence: exact` fails the real manifest compiler.

No owner ruling is required for these repairs. Final Review moment selection remains D928 and the
learner-facing `review-map` RFC. No production, schema, content or protected design byte changes in
this checkpoint.
