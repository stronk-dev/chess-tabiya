# Shared candidate packet — buildability and cache-envelope audit

**Date:** 2026-08-26
**Feeds:** [[D1071]], [[D1072]], [[D1385]]–[[D1387]], [[D1412]], [[D1413]],
[[D1570]]–[[D1576]], `rfc/shared-candidate-evidence-packet.md`, `rfc/hint-distance.md`

## Question and method

Can the drafted shared candidate packet be implemented without inventing manifest bytes, cache
semantics, provenance or deployment topology, and is an entry-count LRU a meaningful bound?

The code audit re-read every production symbol named by the RFC at HEAD `7dff5801`: the evidence
manifest compiler and catalogue, `SemanticSelectionInput`, both local-event enumerators,
`CandidateFeatureVector`, `OpponentSelector`, exact legal mobility and the server route surface.
The existing D1071 falsifier was re-run unchanged; all six tests pass and the middlegame fixture
still yields 33 alternatives, 3,561 sealed events and about 580 ms cold. `[V]`
`tools/d1071-candidate-packet-harness/population-integrity.test.ts`; command and output are recorded
by the harness README.

A new disposable arm enumerated every exact legal move at each of the fixed 64 D1061 roots, played
the child, and ran `localSemanticEvents` over the edge. It records legal moves, sealed event count,
compile time and the UTF-8 size of `JSON.stringify(events)` per root. The byte figure is explicitly
a reproducible **structural proxy**, not V8 heap usage. `[V]`
`tools/d1071-candidate-packet-harness/buildability-envelope.test.ts`;
`planning/evidence-foundation-ux/d1573-candidate-packet-envelope.json`.

## Findings

### 1. The original correctness defects still reproduce

The production selector still accepts a caller-supplied alternative callback, does not verify that
returned events are anchored to the requested edge, reports an empty evaluation as complete, and
uses the smaller eight-family inline closure instead of `localSemanticEvents`. The empty population
still strengthens the result by assigning played facts a zero same-family share. `[V]`
`packages/runtime/src/semantic-evidence.ts:123-129,997-1059` and the passing D1071 falsifier.

The server vector still accepts a strict legal subset and finite caller score bytes, copies each
collector result down to `{source,payload}`, and has no production caller. `[V]`
`apps/server/src/candidate-evidence.ts:67-70,125-179,187-220` and
`tools/d1071-candidate-packet-harness/candidate-packet.test.ts`.

### 2. One packet is already a multi-megabyte object on the fixed sample

Across 64 roots, the complete one-edge population contains 3,779 / 5,482 / 5,803 events at
p50 / p95 / max. Structural JSON is 5,132,694 / 7,435,492 / 7,882,857 bytes and compile time is
613.6 / 862.7 / 921.8 ms. The maximum is the `anti-sicilian-najdorf-english-attack` root: 48 moves,
5,803 events and 7.88 MB structural JSON. `[V]`
`planning/evidence-foundation-ux/d1573-candidate-packet-envelope.json`.

Therefore an entry-count LRU is not a memory bound. Sixty-four maximum-sample entries represent
about 504 MB of structural JSON before V8 object overhead; even eight represent about 63 MB. This
is arithmetic over the measured proxy, not a heap claim. `[V]` Same result artifact.

**Recommendation `[M]`:** the cache needs both `maxEntries` and a deterministic weight bound over
retained rows/events. A defensible first default from this sample is 8 entries and 48,000 retained
events (eight times the measured maximum is 46,424), configurable at the application composition
root. An implementation receipt must additionally measure process RSS/heap on Node 24 before this
becomes a release default; the JSON proxy cannot settle the production memory budget.

### 3. A position sweep cannot define the emitter vocabulary

The sample observes 41 of the catalogue's 67 semantic-event projections and no undeclared one.
Twenty-six declared projections are absent, including the basic one-edge `checkmate` and
`promotion` events as well as intentionally non-one-edge sequence and selection-derived avoidance
families. `[V]` Result artifact, `closure`.

This falsifies criterion 9's proposed authority. A fixed sweep may measure prevalence and cost;
it cannot decide which families code is capable of emitting. The closed one-edge packet vocabulary
must be exported from the collector composition/manifest and set-equal to the compiler, with a
positive and hard-negative fixture for every member. Sequence and selection-derived families must
be excluded by declared source/shape, not because a sample happened not to contain them. `[V]`
`rfc/shared-candidate-evidence-packet.md` §5.3/A9 against the measured 41/67 split.

### 4. The manifest projection is not buildable as written

The RFC names `derived.candidate.event_population@1` but does not supply a complete
`ProjectionDeclaration`, producer output, source adapter, accepting internal consumer or
disposition. F1 requires literal payload type, semantics, operands, forms, answer content,
grounding, exactness, abstention, dependencies and derivation; every projection must then be bound
or disposed. “Operator-only” prose is not one of those edges. `[V]`
`packages/runtime/src/evidence-contract.ts:18-42,98-124,450-520` against
`rfc/shared-candidate-evidence-packet.md` §§3.1, 8–9, 12.

**Recommendation `[M]`:** keep the packet registered, because producer→consumer closure is the
foundation this work exists to provide. Bind it first to the two real internal operations that
land in this RFC—semantic selection and opponent candidate joining—using `machine_condition` and
operator-only roles. Hint and Review gain their own internal consumer bindings only when their
production operations land; learner modules must never accept the raw population.

### 5. The proposed engine-provenance repair has no payload capable of retaining provenance

§8.3 says `CandidateFeatureVector` consumes the packet plus one admitted fixed-bound engine item
per candidate. The only specified and shipped row still contains a number, an engine identity and
stripped collector results; `DeclaredEvidence` has no runtime derivation-input field that can make
the missing join reappear. `[V]` `apps/server/src/candidate-evidence.ts:72-94,187-220`;
`packages/runtime/src/evidence-contract.ts:205-210`; RFC §7.1/§8.3.

The repaired row must literally retain the sealed engine-evaluation item and the exact packet row
identity (packet id, move UCI and child FEN), and the vector must retain the packet evidence/id.
Otherwise an adapter can wrap the same caller score after the fact and criterion 17 proves only
that a wrapper was called, not that the score belongs to this candidate. `[M]`

The typed `live.stockfish.eval_point@1` proposed by `review-evidence-compiler.md` cannot be reused
unchanged because it requires a run `nodeId`, while a candidate child is hypothetical and has no
run node. `[V]` `rfc/review-evidence-compiler.md:132-158`. The shared primitive should instead be a
generic fixed-bound position evaluation keyed by exact FEN, typed cp/mate domain, White perspective,
engine identity and bound. Candidate scoring consumes it directly; Review's node point derives from
it plus `run.record.position`. This is [[D1576]], and avoids both a fake node id and two engine-score
authorities. `[M]`

### 6. “Shared once for three consumers” exceeds the declared process boundary

The live bot cache belongs to a long-lived server `OpponentSelector`. Guided Hint has no production
route or operation. Review evidence compilation is still a draft and its runtime/server execution
home is not fixed. Meanwhile the packet RFC refuses serialization. `[V]`
`apps/server/src/application.ts:329-341`; `apps/server/src/opponent-selector.ts:466-510`;
absence of a hint operation under `apps/server/src`; `rfc/review-evidence-compiler.md` Status;
packet RFC §6.5.

The RFC must either place the packet compiler/cache and all consuming joins behind a named server
service, or narrow the claim to per-process reuse and measure the separate process boundaries. A
runtime singleton is not an acceptable implicit owner: it complicates tests, has no tenant/lifetime
contract and still cannot cross browser/server processes. `[M]`

### 7. Three cache identities contradict their promised behavior

Request scope is part of `packetId`, but the RFC also requires a wide packet to serve a narrow
request without defining the narrow projected id or whether projection is a cache hit. Full
six-field FEN is also part of the id, so two board-equivalent transpositions with different
halfmove/fullmove counters and event anchors are different packets; the claim that history-shaped
keys become transposition-shared is too broad. Finally, the RFC requires a declared default LRU
maximum without naming a value or a weight. `[V]` Packet RFC §§3.4, 6.1–6.3, A4/A11/A13.

**Recommendation `[M]`:** use exact-scope ids. A wide cached packet may be projected without chess
recomputation into a separately frozen narrow packet with the narrow id; it is not the same value.
Retain full FEN because event ids and anchors contain those bytes, and narrow the cache claim to
identical canonical full FEN rather than board-equivalent transpositions. Apply the measured dual
bound from finding 2.

### 8. The implementation surface misses a required layer migration

The RFC locates the packet compiler in `packages/runtime`, but the promised 20 child readings are
assembled by the private `childReadings` function in `apps/server`. Runtime cannot import server,
and copying the list would immediately recreate the two-closure drift this packet exists to remove.
`childReadings` must move into the runtime packet/compiler layer and the server vector must consume
that one authority. `[V]` `apps/server/src/candidate-evidence.ts:125-179`; RFC §3.4/§12.

The implementation surface must also name the real cache-owner injection point and the actual
semantic-selection/opponent join functions. File counts remain derived receipts, not a six-file
target that pressures the implementation to hide required production changes. `[M]`

## Verdict

The lower primitive remains the correct architecture and the original research is sound on the
need for it. At this audit point the RFC was **not buildable**; the 2026-08-26 amendment subsequently
specified [[D1570]]–[[D1576]]. Cross-review still owes the exact manifest tuple, packet/vector
payloads, cache topology and dual bound before acceptance. The measured packet is large enough that
“add an LRU” is not a safe implementation instruction.

## Node-24 continuation — the equal-item weight fails

The follow-up receipt runs the amended exact event-only and event+reading scopes under Node
24.19.0 in fresh Vitest workers with forced GC. One 50-legal-move root compiles cold in 972.32 ms
and reads warm in 0.011 ms; both runs carry packet id
`b924f39b…fc8ed6dbd5`. The earlier D1071 strict-subset artifact and the Node-26 64-root structural
sweep remain explicitly separate measurements. `[V]`
`tools/d1071-candidate-packet-harness/node24-memory-envelope.test.ts`;
`planning/evidence-foundation-ux/d1579-candidate-packet-node24-envelope.json`.

The first full-scope negative control exposes a defect in the amended bound. Eight event-only
packets retain 37,804 events and add 52.28 MB heap. With the RFC's equal-item formula, eight mixed
packets retain 37,804 events + 6,629 readings and add 91.78 MB heap. Those readings add 39.50 MB:
4.31 times the event heap cost per item. Their independently measured structural JSON cost is
2.00 times per item. `events + readings` is therefore not a memory-homogeneous unit even though it
stays below 56,000. `[V]` [[D1579]].

A conservative executable repair trial rounds the heap ratio up and uses
`events + 5 × readings`. Under the same 56,000 bound it retains six stress roots, 28,000 events,
4,995 readings, 52,975 weighted units, 51.22 MB structural JSON and 67.17 MB heap. The event-only
arm remains eight roots / 52.28 MB heap. This supports a typed weighted unit and keeps the
equal-item arm as its able-to-fail control; it does not establish a final release threshold. `[V]`

That last distinction matters because the RFC's criterion says the defaults change if the release
memory envelope is exceeded, while the ruled `core`/`cpu`/`accelerated` tiers declare no numeric
heap or RSS ceiling. The fresh-process RSS deltas are 224.41 MB event-only and 259.95 MB corrected
mixed, including allocator pages touched during compilation. The receipt can compare mechanisms;
without a numeric tier budget it cannot honestly call either number a release pass. [[D1580]]
routes that missing predicate to the packet/F12 boundary rather than manufacturing one here.
