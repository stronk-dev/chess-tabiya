# D1710 producer-execution closure — RFC author handoff

**Input:** `design/research/producer-execution-closure.md` and
`tools/d1710-producer-execution-harness/`.

**Purpose:** prevent Phase 3, Review, bots and longitudinal work from treating a compiled
projection or a consumer registry entry as a live evidence source.

## Measured facts the author must preserve

- 193 compiled projections = 93 current-consumer + 67 research-only + 33 unbound.
- `derived.opponent.candidate_feature_vector@1` is current-consumer admitted but its constructor
  has zero production callers.
- 67 semantic projections = 45 operator-selector-only + 11 unused-candidate-helper-only + 11
  isolated-sequence-helper-only; zero have a live application root.
- The research selector and `localSemanticEvents` enumerate different closures ([[D1386]]).
- The seven observed tactic families require recorded-run identities; an engine PV must not be
  relabelled as `run.record.move` ([[D1068]]).
- Exact bounded mate and overloaded-defender predicates also have zero production callers.

## Required RFC actions

### `shared-candidate-evidence-packet.md`

Fold this handoff into the existing [[D1631]]–[[D1636]] author amendment. Name the literal
application/service operation, injection site, cache owner and production-boundary fixture. The
operation must replace the unused `candidateFeatureVector`, preserve the complete legal set and
retain original sealed event/reading identities. Its one-edge closure must include breadth and
duty events, legal exchange and fork survival; it may not copy the smaller inline selector.

### Recorded semantic path compiler

[[D1067]] still has no RFC owner that can implement it. Either claim it in one existing active RFC
whose scope honestly includes recorded whole-run evidence, or draft a narrow successor after
registering the claim. The contract must:

- validate a single branch and consecutive FEN/node boundaries;
- construct one exact `run.record.move@1` item per edge;
- evaluate trade, pawn timing, harassment, defender consequence and all seven observed tactical
  families over their declared windows;
- return typed per-window abstentions instead of silent omission;
- expose one operation consumable by Review and longitudinal derivation;
- keep hypothetical Stockfish-PV events on distinct provider-derived projection ids.

### `module-registration.md`, Review, bots and longitudinal store

Do not bind directly to detector helpers. Each downstream RFC imports literal emitted projection
ids from the packet/path operations and names its narrowed consumer. An eligibility row is not an
activation proof. Add a release criterion requiring an emitted sealed item at the real application
boundary for each activated module/bot/Review/ingest family.

### Evidence-contract verification

Amend F1 or its successor with a generated execution-disposition receipt. It must join every
non-retired projection to one of:

- `live_application`
- `offline_authoring`
- `operator_research`
- `helper_awaiting_owner`
- `intentionally_unbound`

Only the first two may satisfy a 1.0 capability dependency. A source-file string, export, consumer
operation registry entry or test-only call is not a witness.

## Able-to-fail acceptance fixtures

1. Deleting the production packet call while leaving its manifest row and tests intact fails.
2. A breadth event present in `localSemanticEvents` but absent from the application packet fails.
3. A qualifying recorded deflection/clearance/zwischenzug window emits exactly one sealed event;
   breaking a FEN boundary produces a typed abstention.
4. Passing `live.stockfish.pv@1` as recorded move evidence fails.
5. Activating a learner module whose projection is helper-only fails registry compilation.
6. Bot selection proves the evidence packet influenced the registered policy receipt; merely
   constructing a packet beside a provider choice fails.
7. Review and longitudinal operations consume the same recorded-path event identity for the same
   run; recomputation under a different projection id fails.
8. The execution receipt is set-equal to the compiled manifest and rejects an unexplained new
   projection.

## Explicit non-goals

- no new chess motif or authored strategic judgement;
- no direct Svelte detector calls;
- no generic evidence wrapper;
- no claim that every conditional event fires in every position;
- no content migration until the producer operations and module contracts are stable.
