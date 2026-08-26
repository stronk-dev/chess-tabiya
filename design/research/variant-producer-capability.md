# Variant producer capability — computability, admission and absence

**Date:** 2026-08-26
**Question:** What closed capability authority can keep Standard, Chess960 and Tier-2
evidence-dark runs honest across the full evidence catalogue?
**Instrument:** `tools/d1679-rules-capability-harness/` (disposable research code)
**Feeds:** [[D1679]], [[D1687]], [[D1688]], `rfc/variants.md`, shared evidence foundation

## Verdict

**One availability flag cannot express the product contract. Capability has three independent
questions: can the producer compute for this exact subject; may a learner consumer receive the
projection; and does absence mean honest-empty or safety suppression?** `[V]`

The compiled catalogue currently contains **37 producers, 193 projections, 25 consumers and 210
bindings**, not F1's historical landing population of 19/93/23/142. The harness derives its
producer keys from `EVIDENCE_PRODUCER_IDS` and independently requires set equality with
`PRIMARY_EVIDENCE_MANIFEST.producers`; a new producer fails every subject row until classified.
`[V]` `packages/runtime/src/evidence-catalog.test.ts:43-53`;
`tools/d1679-rules-capability-harness/rules-capability.test.ts`.

The literal 37 × 3 matrix is in the harness. Its grouped result is:

| Producer family | Standard | Chess960 | Tier-2 evidence-dark |
|---|---|---|---|
| 12 `rules.*` producers | computable; projection-gated | rules/setup adapter required before invocation | wrong-domain; suppressed |
| authored/shape/pack | content-dependent; projection-gated | only explicitly 960-admitted content | suppressed |
| recorded engine/tablebase | exact subject receipt required | receipt must retain rules/setup and dialect | suppressed |
| live Stockfish/Syzygy | provider-dependent, honest-empty | rules/setup adapter and dialect receipt required | standard providers suppressed |
| Maia | provider-dependent, honest-empty | wrong-domain; suppressed | wrong-domain; suppressed |
| Explorer | provider-dependent, honest-empty | adapter required; shipped request says `variant=standard` | suppressed |
| opening identity/runtime | catalogue-dependent | standard-ECO domain; suppressed | suppressed |
| `run.record` | literal projections available | literal rules/setup-aware projections available | only literal board/move/branch/result projections survive |
| 12 `derived.*` producers | inherit every declared input | inherit exact rules/setup capability | learner delivery suppressed; no laundering |
| sourcing ledger | operator-only | operator-only | operator-only |

Every producer row remains only a default. The compiled projection's disposition and exact
consumer binding remain the final delivery authority. This matters inside `run.record`: recorded
moves and forks are literal learner facts, `run.record.position` is inspector-only, and
`run.record.evidence_ref_resolution` cannot make a suppressed referenced source valid. `[V]`
`packages/runtime/src/evidence-catalog.ts:795-804`.

## The two separations the production contract needs

### Source computability is not learner admission

Tier-2 play needs a rules-capable opponent, but the evidence manifest contains no
`live.fairy_stockfish` producer. That is correct at the current boundary: an opponent operation may
consume a legal move from Fairy-Stockfish while the learner-facing engine/evaluation producers stay
dark. Adding the sidecar to a generic `availableProducers` set and using that set for both selection
and guidance would silently widen what Support, Review and Story may say. `[V]`
`packages/runtime/src/evidence-catalog.ts:80-86`; `rfc/variants.md:568-616`.

The compiled authority therefore needs at least `computation × learnerUse`, joined to the exact
`rules + setupFamily` receipt. Opponent consumers may admit a provider operation without creating
a learner projection; learner modules still intersect projection disposition, consumer binding,
workflow ceiling and assistance distance. `[M]`

### Honest-empty is not suppression

A Standard Maia outage means the requested observation is temporarily unavailable; rendering an
honest empty state is truthful. Sending a Chess960 or Crazyhouse position to the same model is a
wrong-domain request; the resulting number is not missing evidence and must be suppressed before
the provider call. The same distinction holds between an unavailable Standard Explorer response
and the shipped source's hard-coded `variant=standard` request for a 960 subject. `[V]`
`apps/server/src/sourcing/explorer.ts:68`; `packages/runtime/src/evidence-catalog.ts:780-788`;
`rfc/variants.md:168-195`.

Consequently `unavailable`, `empty` and `suppressed` cannot be synonyms in the run API or client.
Provider-off UX is downstream of a capability decision; it cannot repair a wrong-domain request.
`[M]`

## Derived evidence and exact subject identity

Twelve current producers begin `derived.`. Their output is not independently available: it inherits
the weakest capability of every declared literal input. A Story title depending on a Stockfish
delta does not become valid in Tier 2 merely because title composition itself is local; a compare
piece route over recorded moves can survive only through its literal run-record inputs and its own
consumer binding. `[V]` `packages/runtime/src/evidence-catalog.ts:805-839`; harness
`prevents derivation from laundering a dark source` arm.

The subject key cannot be FEN alone. The same FEN can represent Standard or Chess960 admission and
requires different Maia, Stockfish and Explorer dispositions; `variant-setup-identity.md` measures
the minimum durable identity as `rules + setupFamily`. `[V]`
`design/research/variant-setup-identity.md`.

## Required contract shape

The returned variants RFC and the shared evidence-capability register should specify:

1. a closed capability receipt keyed by exact `rules + setupFamily`, not inferred from FEN;
2. separate closed fields for computation, learner use and absence semantics;
3. exhaustive producer defaults derived set-equal from the compiled catalogue;
4. retained per-projection dispositions and consumer bindings, including mixed producers such as
   `run.record`;
5. derived capability compiled from declared inputs, never caller-selected;
6. operation receipts at all fifteen measured run request sites, before provider or collector
   invocation;
7. an explicit opponent-operation lane so a Fairy engine can play without becoming evidence;
8. negative fixtures for wrong-domain provider calls, derivation laundering, unclassified new
   producers and projection-level widening.

This pass does not validate Fairy-Stockfish packaging, Chess960 detector semantics, variant
tablebase reach, campaign completion, provider caching, or ordinary learner UX. It authorizes no
production implementation before the returned RFC is amended and accepted. `[V]`
