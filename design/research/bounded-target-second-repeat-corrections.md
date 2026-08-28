# Bounded-target second repeat corrections

**Date:** 2026-08-28

**Question:** Did the D1904–D1909 author amendment make the local bounded-target layer buildable?

**Feeds:** [[D1962]]–[[D1968]], `rfc/bounded-policy-targets.md`, Support, Review, bots and
longitudinal opportunity accounting.

## Verdict

No. The underlying exact-target research remains useful, and the exhaustive census still passes,
but seven author-contract claims do not survive contact with the live authorities and JavaScript
execution model. `[V]` The full return is
`planning/bounded-policy-targets/second-repeat-independent-buildability-review-2026-08-28.md`; the
reproduction is `make bounded-target-repeat-review`.

## Authority corrections

`[V]` There is no reusable registered threat-pass transform. `threats()` privately changes
`position.turn` and clears `position.epSquare` in `packages/runtime/src/tactics.ts`, while the
author harness defines a separate `passFen()` in
`tools/d1652-bounded-target-repair-harness/contract-repair.test.ts`. The RFC's implementation table
does not amend `tactics.ts`. A sealed input does not prevent those two implementations from
drifting.

`[V]` The proposed initial promoted flag has no exact source. `ExchangePieceIdentity` in
`packages/runtime/src/exchange.ts` retains colour, role and square only. Standard FEN does not
encode promotion history: parsing an otherwise identical queen position produces
`promoted:false` regardless of whether a prior game reached it by promotion. The local layer may
track a promotion it observes inside its bounded line; it cannot infer the pre-line provenance of
an existing queen, rook, bishop or knight.

`[V]` `target_captured` is impossible in the immediate outcome algebra. `threat@1` passes the move
to the opponent, so its victim belongs to the original side to move. Every candidate belongs to
that same side and cannot capture its own victim. The D1023 research algorithm's
`ImmediateCause` union correctly omits the member; the author amendment added it without an
executable position.

## Operation corrections

`[V]` `Promise<...>` plus `AbortSignal` does not make synchronous enumeration background or
cancellable. A timer-scheduled abort cannot run until the current JavaScript turn returns. The RFC
names no worker, queue, injected yield or cooperative chunk boundary and explicitly claims no
worker/server implementation file. The measured tail therefore needs an actual execution
topology, not latency metadata.

`[V]` The 512 target×candidate ceiling is not enforceable through the published per-item request
union. No request owns a source position's complete target and candidate sets, so callers can fan
out arbitrarily many individually valid operations without any call seeing the multiplication.

`[V]` The request and result unions are uncorrelated. The literal signature type-checks an
implementation that returns bounded-return evidence for a named-target request and returns
exchange-mismatch for an immediate request. `wrong-pairing.typecheck.ts` is the positive witness.
The same payload shape admits universal survival with existential false, missing witnesses and
contradictory refutations; it needs a discriminated result algebra or a mandatory validating
constructor.

## Census rerun

`[V]` `make bounded-target-census` passed 11/11 again over the unchanged authored/imported
populations. The second run observed authored call p95/max 12.32/814.51 ms and whole-position
p95/max 361.85/1287.95 ms; imported call p95/max 10.14/157.23 ms and whole-position p95/max
342.02/997.73 ms. Counts and target×candidate maxima remained byte-identical at 111/333. These
figures confirm background classification; they do not clear the missing execution topology.

## Research consequence

The measured 4.10×/2.85× immediate discrimination and exact return counts are not retracted. They
remain facts about the D1023 research algorithm. What is retracted is the claim that a compiled F1
row plus a promise-shaped per-item function is already a buildable production operation. Content,
modules and bot policy should continue to depend on the local facts only after the corrected batch,
identity and scheduling boundaries land.
