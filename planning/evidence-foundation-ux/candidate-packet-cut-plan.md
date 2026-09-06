# Candidate-packet cut plan — where the shadow implementation went

**Status:** the cut is executed. This note is the home for material removed from
`rfc/shared-candidate-evidence-packet.md` on 2026-09-06 under the changed unit of delivery
([[D3034]]'s precedent, second application): *bound the document to the blocking contract instead
of continuing to widen it.*

## What was measured before cutting

`planning/work-state.json` carries **92** items whose blocker is
`rfc:shared-candidate-evidence-packet.md`. Reading them is the whole diagnosis:

- **16** are the obligation. [[D1071]] (cold selection is slower than the engine request and needs
  shared candidate caching), [[D1072]] (the shipped `CandidateFeatureVector` cannot be the packet),
  the four shipped-selector defects [[D1385]]/[[D1386]]/[[D1387]]/[[D1412]] and the retracted
  [[D1388]], the constraints [[D1270]] (grounded only), [[D1373]] (no lifecycle on a position key),
  [[D1363]] (the hint family table), [[D1503]] (ledger numbering), and the packet-shape findings
  [[D1570]], [[D1572]], [[D1573]], [[D1579]], [[D1580]].
- **76** are review debt this document raised against **its own author models** across fourteen
  fresh-review rounds. None of them is a thing a consumer waits for. They are findings about a
  harness that is not production code: registry topology, memo dependency images, single-flight
  queue deadlines, retained-graph walkers, stats field counts, test fault factories.

That ratio is codex's *"enormous shadow implementation"* diagnosis measured on a second document.
The cut is not a size argument and not a landability argument: **58 of the 92 rows were routed by
this document alone**, so the document had become the only home for defects it manufactured.

## The successors, and what each one owns

| successor | owns | rows moved there |
|---|---|---|
| `rfc/candidate-population-service.md` | the runtime service and cache: construction seam, closed result/failure algebra, cancellation, cooperative yield, single-flight, queue/deadline/overload bounds, LRU admission and eviction, retained-graph accounting, stats snapshot | see that RFC's §1 |
| `rfc/candidate-collector-registry.md` | the executable collector topology: the thirteen adapters, dependency-closed scope plans, the per-collector memo, the generated projection dialect, abstention and failure identity, closure derivation | see that RFC's §1 |

Neither successor is authorised to implement anything. Each is a **draft stub with a scope
paragraph and its inherited rows**, exactly as [[D1230]] requires of a cut: a deferral without a
home is not a deferral, and a deferral without an owner is a wish.

## The fourteen review rounds, retained verbatim

The packet RFC carried 745 lines of its own review history inline. It is retained here because it
is evidence — the falsifiers are real and their `make` targets still run — and removed from the RFC
because a contract document is not a changelog of its own reviews. The exact per-round receipts
live beside this file in `planning/evidence-foundation-ux/`.

### Author-repair and return headers removed from the RFC preamble

## Thirteenth author repair — declared inputs and independently asserted packet authority

The compiler now imports the one collector-dependency declaration used by the planner. Before each
collector call it constructs a new image containing exactly those dependencies; a proxy refuses
every undeclared property read, including reads from collectors whose dependency set is empty.
Invocation exceptions retain collector identity only. A projection is named only when the exact
returned value carrying that projection fails its value assertion.

Single-flight admission and execution capacity are separate sets. Cancelling the final waiter
removes the job from join identity immediately, but the abandoned execution retains its concurrency
slot until it actually settles. A later equal request therefore receives a fresh job without
running above the configured ceiling. Request parsing now distinguishes unsupported rulesets,
invalid FEN, invalid scope and invalid closed shape.

The cache measures only the entry roots: packet, exact legal evidence and candidate inputs. The
primary manifest is measured separately once per service. Receipt assertion independently
rechecks the declared legal-map authority, exact flattened move references, unique UCI population,
candidate-row references and every recomputed child FEN. Test-only crossed receipts prove these
checks can fail.

Finally, the child-reading population is no longer a local twenty-string copy. It is derived from
the compiled primary manifest intersected with the admitted tactical/breadth collector catalogues,
excluding the two separately owned readings and Maia provider output; a live `reading.child`
witness must be set-equal to that independent population at module construction. The author target
extends the repository base TypeScript configuration and deletes optional timer fields rather than
assigning forbidden `undefined`.

Exact executable receipt:
`planning/evidence-foundation-ux/shared-candidate-packet-thirteenth-author-repair-2026-09-06.md`.

## Fourteenth fresh independent return — public/private and contract closure

The thirteenth repair's eight named fixes survive, but the composed model still differs materially
from the RFC it is supposed to make buildable. A readings-only receipt publicly exposes its hidden
event-dependency outcomes ([[D3009]]), while the product factory accepts the very manifest/digest/
collector extras it promises to refuse ([[D3010]]). Failure identity has three incompatible
normative, prose and model unions ([[D3011]]); receipt assertion does not rebuild outcome, retained
view or abstention bijections ([[D3012]]); and retained-graph accounting lacks the specified private
reference map, one-root descriptor and category census ([[D3013]]).

The public type also erases request-scope correlation ([[D3014]]), the test factory has no legal or
collector fault seam and therefore tests collector failure by throwing a prebuilt private error
([[D3015]]), and runtime stats expose eighteen fields against a normative sixteen-field snapshot
([[D3016]]). `make candidate-packet-fourteenth-fresh-review` retains the complete predecessor chain,
passes all eight fresh falsifiers and compiles the real scope diagnostic under the repository base
configuration. Keep the RFC in draft; complete one bounded repair across the normative interface,
model and able-to-fail fixtures before another fresh review. Exact receipt:
`planning/evidence-foundation-ux/shared-candidate-packet-fourteenth-fresh-independent-buildability-review-2026-09-06.md`.

### Review rounds one through three (2026-08-30)

## Fresh-return author repair (2026-08-30)

The exact return is
`planning/evidence-foundation-ux/shared-candidate-packet-fresh-independent-review-2026-08-30.md`.
The author repair now:

1. publishes one exported, constructible service whose request, ready receipt and wide/narrow
   projection results are correlated by literal scope ([[D2097]], [[D2099]]);
2. removes the premature provider handoff from the provider-free landing and leaves it behind the
   accepted shared provider types and use their exact two-argument delivery ([[D2098]]);
3. publishes one complete executable collector registry from which output closure, grouping,
   invocation cardinality, failures and exact unavailable results are derived ([[D2100]],
   [[D2104]]);
4. bounds unique in-flight work with queue/admission/shutdown semantics and closes scheduler failure
   plus collector failure identity inside the public result algebra ([[D2101]], [[D2102]]);
5. makes the standard-only ruleset an explicit admitted identity/refusal through request, packet,
   key, legal compiler and collectors ([[D2103]]); and
6. adds an eight-arm author contract. Fresh independent review and full repository verification
   still gate acceptance and implementation.

## Second fresh independent return and author repair (2026-08-30)

Exact return:
`planning/evidence-foundation-ux/shared-candidate-packet-second-fresh-independent-review-2026-08-30.md`.
The return found four seams, now repaired at the author-contract boundary:

1. [[D2198]] — the product and test factories now import one exact
   `PRIMARY_EVIDENCE_MANIFEST`; neither accepts a manifest/digest option, and the receipt map retains
   the exact manifest reference beside every value;
2. [[D2199]] — all available/unavailable/failed arms carry `projection`, result projections are
   set-equal to declaration outputs, and every non-empty value must agree with its result;
3. [[D2200]] — thirteen named `collectCandidate*` adapters accept one immutable typed context and
   populate an object-keyed executable registry whose rows individually `satisfies` their exact
   output/dependency declaration; and
4. [[D2201]] — the memo, service-stat and receipt-reference types now have closed shapes, typed
   dependency lookup, safe bounded counters and exact runtime-reference authority.

The third author contract must invert those four seams, preserve the existing 28 author/review
arms, and undergo another fresh independent review before acceptance.

### Review rounds four through thirteen (2026-08-31 → 2026-09-06)

## Fourth fresh independent return (2026-08-31)

The D2329/D2330 repair survives its independent checks: one literal versioned-key dialect owns
projection identity, and each request scope has a dependency-closed execution plan distinct from
retained output. [[D2389]] returns a different seam.

The public receipt requires `legalMovesInput: DeclaredEvidence<ExactLegalMoveMap>`, but §4.1 says
the packet's `legalMoves` is sourced from `exactLegalMoves(beforeFen)`, §6.0 fixes only that
function in the factory, and criteria 2/5 compare against it again. The only exact declaration
adapter accepts an `ExactLegalMoveMap` and verifies it through `exactLegalMoveMap`; the RFC never
binds the packet's flat rows by reference to that exact payload. An implementation must therefore
invent whether the list or the map is authoritative, and an equal re-enumeration can satisfy every
set-equality criterion while defeating the receipt's value-identity claim.

Repair with one value source: compile `exactLegalMoveMap(beforeFen)`, pass that exact object to
`declareExactLegalMovesEvidence`, retain the resulting declaration, and flatten
`legalMovesInput.payload.pieces[].moves` without copying move objects. Replace the independent
`exactLegalMoves` packet source and make a separately enumerated equal list fail an identity
fixture. Exact review and reproducer: `make candidate-packet-fourth-fresh-review`.

## Fifth author repair (2026-08-31)

[[D2389]] is repaired at the contract boundary rather than hidden behind another equality check.
The service compiles one `ExactLegalMoveMap`, seals that same object, and constructs the packet's
flat container solely from the sealed payload's move references. The product factory no longer
imports `exactLegalMoves`; receipt construction rejects equal rebuilt moves because the retained
object graph, not their spelling, is the authority.

Criterion 36 makes the source-call count, exact declaration input, flattened member references and
equal-rebuild refusal independently failable. `make candidate-packet-fifth-author-repair` is the
positive author contract. A fifth fresh independent review is still required; no production,
schema, content, API or UX implementation is authorized by this repair.

## Fifth fresh independent return (2026-08-31)

The D2389 value-identity repair survives: the declaration and flat packet retain one exact-map
object graph, and an equal second enumeration is refused. [[D2428]] returns the call-count boundary.

The compiler's specified `exactLegalMoveMap(beforeFen)` call is followed by
`declareExactLegalMovesEvidence(payload)`, whose production implementation validates that payload
by calling `exactLegalMoveMap(payload.fen)` again. Criterion 36 nevertheless requires exactly one
instrumented call, and §12 names no adapter change. The author harness substitutes a declaration
wrapper that does not perform the production validation, so its green result cannot prove the
criterion buildable.

Repair by making the authority mint a sealed result the adapter can admit without recomputation,
or by specifying and measuring the honest two-computation boundary while retaining the single
packet value graph. Renaming only the first call as the one that counts is refused. Exact review and
reproducer: `make candidate-packet-fifth-fresh-review`.

## Sixth author repair (2026-09-01)

[[D2428]] is repaired by removing caller-authored exact-map payloads from the source adapter. The
projection-specific `createRulesMobilityReadingLegalMovesV1Evidence(fen)` factory validates one
FEN, invokes the accepted `exactLegalMoveMap` authority once, and seals that exact return. The
packet compiler calls only this factory and flattens only its declared payload. There is no opaque brand a caller can
forge, no second equality oracle, and no payload-validation recomputation.

The 2026-09-01 promotion-pair third review caught [[D2468]] before implementation: the first sixth
repair had named that operation `declareExactLegalMovesEvidence(fen)`, contradicting
`evidence-value-authority`'s closed route table and explicit no-alias rule. This correction consumes
the exact registered route above and makes that draft an implementation dependency. It does not
change the measured current-production comparison, map semantics or one-object-graph criterion.

The choice is measured rather than aesthetic. On the current production symbols, six positions
(ordinary, castling, promotion, middlegame, pawn endgame and terminal), 20 warm-up rounds and 100
measured rounds produced median **0.029465 ms/position** for one authority computation and
**0.080278 ms/position** for the current compiler-plus-validating-adapter path: **2.724×**. This is
a local author measurement, not a release latency promise; its purpose is to show that the duplicate
trust path is measurable work even before candidate collectors run. Reproducer:
`make candidate-packet-d2428-measurement`.

Criterion 36 now binds one factory call to one internal authority call and the same declared object
graph. The acceptance model includes malformed/non-string/caller-map inputs, a mocked second
authority call, an equal map rebuild and a copied packet move. The sixth repair assigned the adapter
signature correction to §12; the seventh repair supersedes that file ownership after the dependency
order proved the adapter is deleted. `make candidate-packet-sixth-author-repair` is positive author
evidence only; another fresh independent review is required before implementation.

## Sixth fresh independent return (2026-09-04)

The D2428/D2468 source-authority repair survives: one registered FEN factory still owns one exact
map computation and one retained value graph. The fresh review returns three different seams.

1. [[D2625]] — required predecessor `evidence-value-authority` deletes
   `evidence-source-adapters.ts` and moves the sole mint boundary to `evidence-factories.ts`, while
   §12 still assigns the later factory correction to the deleted file.
2. [[D2626]] — every collector receives request `scope`, allowing direct narrow compilation and a
   wide-to-narrow projection to emit different factual values under the same target packet id;
   criterion 4 checks move equality but not value equivalence across those paths.
3. [[D2627]] — the weighted cache counts visible events/readings only, while the repaired receipt
   retains legal-map/move graphs, rows, abstentions and public/private collector outcomes. The cited
   Node-24 harness measured the older visible packet and cannot calibrate that graph.

Exact review and reproducer:
`planning/evidence-foundation-ux/shared-candidate-packet-sixth-fresh-independent-buildability-review-2026-09-04.md`;
`make candidate-packet-sixth-fresh-review`. A bounded seventh author repair must retain the sixth
author controls, consume rather than re-own the value factory, make collection scope-invariant and
re-measure a complete retained receipt graph before another fresh review.

## Seventh author repair (2026-09-04)

The three returns are repaired at their authority boundaries:

1. [[D2625]] — §12 no longer claims the deleted adapter or any byte in the predecessor-owned factory
   file. The packet imports the exact registered factory after `evidence-value-authority` lands, and
   criterion 36 rejects file recreation, wrapper aliases, co-ownership and lower legal-enumerator
   imports.
2. [[D2626]] — `CandidateCollectorContext` has no request scope. Scope chooses the execution plan and
   retention only; it cannot alter chess truth. Criterion 4 compares direct-narrow and projected-
   wide value/digest/outcome tuples for every shared family, plus reference identity when projection
   occurs inside one service.
3. [[D2627]] — the visible `events + 5×readings` coefficient and its inherited defaults are removed.
   A private complete-graph receipt traverses every strong reference kept alive by the cached
   `WeakMap`, deduplicates by object identity, and returns logical UTF-8 bytes, unique-object count
   and a closed category census. Both retained limits are explicit until the production Node-24
   graph is re-measured. Quiet, hidden-dependency, shared-reference and equal-clone controls make
   omissions and false deduplication fail.

`make candidate-packet-seventh-author-repair` retains the sixth author controls and demonstrates the
three inversions. The historical fresh-review target remains named evidence of the pre-repair
failure, not a gate expected to stay green after its predicates are inverted. This is positive author
evidence only. Another genuinely fresh independent review still gates acceptance and all production
implementation.

## Eighth fresh independent return (2026-09-04)

The seventh repair's direction survives, but its executable evidence stops before the claimed
operation. [[D2655]] finds that factory ownership is checked only against RFC prose: the author model
never imports or calls the predecessor factory. [[D2656]] finds that scope equivalence runs one toy
collector over an empty memo and aliases its result, exercising none of the three dependency-closed
plans, hidden outcomes or real candidate rows.

The retained-graph model is incomplete. [[D2657]] demonstrates that the private candidate-input
wrapper objects and their array containers—strongly retained by the declared WeakMap—are skipped;
a 100 KB strong reference added there costs zero. [[D2658]] demonstrates that non-enumerable
accessors and symbol-keyed values are silently ignored despite the RFC's fail-closed rule. [[D2659]]
shows the category check constructs both sides from one constant, so a new retained root is neither
categorized nor traversed and the check stays green. [[D2660]] closes the composition finding: no
cache consumes the new measure, and no byte/object limit, oversize result or eviction path exists in
the author model.

Exact review:
`planning/evidence-foundation-ux/shared-candidate-packet-eighth-fresh-independent-buildability-review-2026-09-04.md`;
`make candidate-packet-eighth-fresh-review` retains the prior 3/3 + 4/4 and passes 6/6 new
falsifiers. An eighth author repair must close all six before another genuinely fresh review. No
production packet, consumer or cache implementation is authorized.

## Eighth author repair (2026-09-04)

The repair composes the six returned seams into one operation rather than adding six prose checks.
[[D2655]] now imports and executes the predecessor author surface, observing one legal-authority
call and the exact map/move references. [[D2656]] runs the ten-row event, five-row dependency-closed
reading and thirteen-row wide plans over complete candidate rows; every invocation sees exactly its
declared memo keys, readings-only retains three outcomes while privately preserving five, and
direct/projected tuples agree with reference identity inside the wide projection.

[[D2657]]–[[D2659]] share one retained-root descriptor. Measurement begins at the exact private
aggregate after explicitly removing only the manifest singleton, visits its arrays and wrappers,
uses complete own-property descriptors, and fails on hidden/symbol/accessor/unsupported values or
an uncategorized new root. [[D2660]] feeds that receipt directly to cache admission and crosses
entry eviction, byte oversize and object oversize independently.

`make candidate-packet-eighth-author-repair` retains the earlier 3/3 + 4/4 and the 6/6 return,
then passes seven composed repair controls. This is positive author evidence only. Another
genuinely fresh independent review and dependency landing still gate production implementation.

## Ninth fresh independent return (2026-09-04)

The six bounded eighth-repair controls survive. The fresh review returns the composition on
[[D2678]], [[D2679]], [[D2680]], [[D2681]], [[D2682]], [[D2683]] and [[D2684]]. The compiler does
not parse the exact three-field request; packet identity is
the raw FEN/scope pair rather than the required seven-term digest; and a direct readings packet and
wide→readings projection share that id while retaining five versus thirteen private execution
outcomes. Cache admission then trusts a caller string, measures only `compiled.references` while
publishing an unchecked crossed outer wrapper, and never asserts one private receipt authority.

The graph is not immutable under its seal: the predecessor envelope is shallow-frozen and the
repair's recursive freezer stops at any already-frozen parent, so a nested legal move can mutate
after compilation. Finally, the thirteen-row registry is still local simulation—two placeholder
collectors behind thirteen names—not the exact registered semantic/F1 adapter graph criterion 32
requires.

Exact review and reproducer:
`planning/evidence-foundation-ux/shared-candidate-packet-ninth-fresh-independent-buildability-review-2026-09-04.md`;
`make candidate-packet-ninth-fresh-review`. One bounded author repair must close all seven before
another genuinely fresh review. No production packet, cache or consumer is authorized.

## Tenth author repair (2026-09-05)

The repair closes [[D2678]]–[[D2684]] as one production-backed contract operation rather than seven
independent predicates. `parseCandidatePopulationRequest` accepts exactly
`{ beforeFen, ruleset, scope }`; the compiler alone derives the canonical root, primary-manifest
digest, legal convention, move-identity convention, compiler version, standard ruleset and scope
that form the seven-term packet digest. Direct narrow compilation and wide-to-narrow projection
retain the same target plan's complete private dependency graph, so one packet id no longer names
two cache weights depending on request order.

The compiled wrapper is admitted to a private `WeakSet`; the cache accepts no caller key and derives
the key only after asserting wrapper, packet, reference and digest identity. Recursive sealing walks
below already-frozen ancestors. Entry, aggregate logical-byte and aggregate object limits remain
independent, with access refreshing LRU order.

Most importantly, the operation imports and executes the actual runtime semantic functions and F1
declaration adapters behind all thirteen collector names over the complete legal set. That contact
with production exposed [[D2841]] and [[D2842]]: real semantic/F1 values carry private symbol brands
that the prior walker rejected, while the predecessor harness's supposed legal declaration was an
unbranded lookalike. The walker now admits one asserted production brand slot and rejects arbitrary,
additional, hidden and accessor properties. The legal input comes from the real map plus registered
declaration adapter and must pass `assertDeclaredEvidence`; the future one-call factory remains an
explicit `evidence-value-authority` landing dependency.

`make candidate-packet-tenth-author-repair` retains the full sixth-through-ninth history and passes
9/9 new composed controls plus strict TypeScript. This is positive author evidence, not acceptance:
another genuinely fresh independent review and the named dependency still gate production work.

## Eleventh fresh independent return (2026-09-05)

The tenth repair's seven bounded fixes survive, but the composed checkpoint is not buildable. The
current model exports only a synchronous compiler plus insertion cache: it has no public service,
typed request result/failure algebra, single-flight, cancellation, queue/compile deadline, close or
stats authority, and admitting the same packet twice reports `miss` twice ([[D2860]]). Historical
predecessor tests do not compose those authorities into the implementation model.

The packet hashes seven factual terms but fails to retain its compiler version, legal convention,
move-identity convention or manifest digest fields ([[D2861]]). Collector outcomes have regressed to
`{collectorId, values}` with no move/projection/result arm; the generated abstention registry is not
imported and every row writes an unconditional empty abstention list ([[D2862]]). Finally, executed
checkmate and stalemate roots both produce zero-row packets with no terminal reason ([[D2863]]).

`make candidate-packet-eleventh-fresh-review` retains the predecessor chain and passes 4/4 fresh
falsifiers. Exact receipt:
`planning/evidence-foundation-ux/shared-candidate-packet-eleventh-fresh-independent-buildability-review-2026-09-05.md`.
A composed author repair plus another genuinely fresh review are required; the value-authority
factory dependency also remains. No production implementation is authorized.

## Eleventh author repair (2026-09-06)

One executable TypeScript checkpoint now composes rather than references the predecessor
authorities. `createCandidatePopulationService` owns one bounded LRU, same-key single-flight,
FIFO admission, queue and compile deadlines, waiter-local cancellation, idempotent close, frozen
stats and direct/projected/miss/oversize result arms. The production path compiles each candidate
in dependency order, slices its collector plan into `maxCollectorsPerGroup`, yields through a real
`MessageChannel` continuation after each group and checks the shared abort signal around every
boundary. A scheduler rejection returns `scheduler_failed` with the exact current collector id;
an over-deadline compiler is barred from late cache admission.

The packet now retains every term it hashes: canonical full FEN, standard ruleset, exact scope,
legal convention id/version, move-identity convention, manifest digest and compiler version.
Every declared collector projection receives a sealed move-addressed total result; an empty
successful projection stays `available` with `values: []`, while an unavailable loose-piece
projection produces the only registered `invalid_turn_clone` abstention from that same outcome.
Zero legal candidates require and retain either `terminal.reason: checkmate` or `stalemate`.

`make candidate-packet-eleventh-author-repair` retains the complete predecessor and return chain,
passes 8/8 new behavioral groups and strict TypeScript. The controls cover identity retention,
all declared projection outcomes, available-empty, both terminal states, cold/direct/projected
cache paths, single-flight, waiter cancellation, overload, queue/compile deadlines, late-result
non-publication, scheduler failure, close and exact yield accounting. This is positive author
evidence, not acceptance: another genuinely fresh independent review and the named
`evidence-value-authority` dependency still precede production implementation.

## Twelfth fresh independent return (2026-09-06)

The eleventh checkpoint composes its promised service and collector graph, but a fresh executable
review returns it on seven authority and lifecycle seams:

1. [[D2885]] — the service asserts only a compiled receipt's self-consistency, not equality to the
   active job request; a genuine `readings` receipt resolves an `events` caller and is cached under
   the crossed receipt id;
2. [[D2886]] — queue admission does not clear the queue timer, so that timer can finish an already
   active compile as `deadline_exceeded:queue` and the same compile can later finish again;
3. [[D2887]] — an exception from compilation or a collector maps to `invariant_failed:receipt`;
   nothing constructs the declared move/projection-addressed `collector_failed` arm;
4. [[D2888]] — `terminal()` labels every zero-candidate non-checkmate root as stalemate, making the
   subsequent `NON_TERMINAL_EMPTY` condition false by construction and unable to detect an
   incomplete legal population;
5. [[D2889]] — cache admission measures the private predecessor graph but retains the larger
   enriched receipt, under-reporting both logical bytes and unique objects behind supposedly hard
   bounds;
6. [[D2890]] — a direct hit refreshes Map insertion order while a projection hit does not, so the
   advertised LRU evicts a recently used wide packet under a two-entry control; and
7. [[D2891]] — `currentOutcomes` invokes `loosePieceEvents` a second time while iterating the
   predecessor execution record, so the claimed total outcome is reconstructed by another chess
   computation rather than preserved from the one registry invocation.

`make candidate-packet-twelfth-fresh-review` retains every predecessor review/repair, passes 7/7
new behavioral falsifiers and strict TypeScript. The RFC remains draft and implementation stays
unauthorized pending a bounded author repair, another genuinely fresh independent review and the
named `evidence-value-authority` dependency. Exact receipt:
`planning/evidence-foundation-ux/shared-candidate-packet-twelfth-fresh-independent-buildability-review-2026-09-06.md`.

## Twelfth author repair (2026-09-06)

The repair closes [[D2885]]–[[D2891]] at the composed contract boundary rather than asking each
consumer to defend the service independently:

1. the service joins the returned receipt's canonical FEN, ruleset, literal scope, selected member
   and complete seven-term packet id to the active job before cache admission or publication;
2. queue admission clears the queue timer before installing compile-deadline authority, and every
   job has one guarded terminal transition, so stale timers and late compiler results cannot finish
   it twice;
3. the collector registry invocation converts throws and invalid results into sealed
   move/projection-addressed failures, while unknown compiler/receipt exceptions remain
   `invariant_failed:receipt` rather than impersonating a collector;
4. checkmate and stalemate are tested independently; zero legal candidates in any other position
   produce the reachable `non_terminal_empty` failure, and a non-empty terminal population fails;
5. cache accounting walks the exact enriched receipt that the entry retains, including identity,
   result and abstention wrappers, and enforces both logical-byte and unique-object bounds on that
   measured root;
6. both direct and wide-to-narrow successful reads refresh the source cache entry under the stated
   LRU policy; and
7. every collector invocation returns its total result. In particular the loose-piece adapter calls
   `loosePieceSemanticEvents` once and retains either its exact values or its exact unavailable
   reason; no post-hoc detector call reconstructs status.

Criteria 37–43 are the corresponding able-to-fail controls: crossed genuine receipts fail before
cache mutation; an admitted job survives its former queue deadline and completes exactly once;
collector and unknown failures take distinct public arms; initial-position zero-population,
checkmate, stalemate and non-empty-terminal controls all differ; reported cache weight equals an
independent walk of the retained receipt; a projection hit protects the wide entry from the next
LRU eviction; and the execution record retains one total result per declared projection with no
`currentOutcomes`/second loose-piece computation path.

`make candidate-packet-twelfth-author-repair` retains every predecessor return and repair, passes
15/15 current positive groups and strict TypeScript. This is author evidence, not acceptance or
production implementation. Another genuinely fresh independent review and the named
`evidence-value-authority` dependency still gate both.

## Thirteenth fresh independent return (2026-09-06)

The twelfth checkpoint retains its repaired request, lifecycle, outcome, terminal, accounting and
LRU behavior, but a genuinely fresh executable review returns the current model on eight new
authority seams:

1. [[D2934]] — sync and cooperative execution give every collector the full prior memo instead of
   its declared dependency image, reopening hidden order dependencies;
2. [[D2935]] — a collector-wide exception is attributed to the first output projection of a
   multi-output collector, inventing precision the operation does not possess;
3. [[D2936]] — after the final waiter cancels an active job, an equal later request can join the
   already-aborted generation and receive `failed:service_closed` from an open service;
4. [[D2937]] — unknown scope and extra-key failures on a valid FEN are both typed as `invalid_fen`;
5. [[D2938]] — per-entry cache measurement walks the public receipt and charges the process-wide
   manifest singleton once for every entry despite the RFC's explicit exclusion;
6. [[D2939]] — receipt assertion checks only seals, digest and counts, not legal-map authority,
   flattened legal-move identity, candidate-row identity, UCI set equality or child FEN;
7. [[D2940]] — the twenty child-reading keys are copied locally and the positive control derives
   its expected set from that same copy; and
8. [[D2941]] — the author model passes a private strict config only because it omits the
   repository's `exactOptionalPropertyTypes`; the destination compiler rejects both optional timer
   assignments with TS2412.

`make candidate-packet-thirteenth-fresh-review` retains every predecessor review and repair and
passes 8/8 fresh counterexamples. Exact receipt:
`planning/evidence-foundation-ux/shared-candidate-packet-thirteenth-fresh-independent-buildability-review-2026-09-06.md`.
The RFC remains draft. A bounded author repair, another genuinely fresh independent review and the
named `evidence-value-authority` dependency still precede implementation.

## The Status line as it stood before the cut

Retained because it is the clearest single artifact of the pattern: a 61-line status field.

<details>
<summary>Status before the cut</summary>

- **Status:** **draft — fourteenth fresh independent review returned the thirteenth repair on [[D3009]]–[[D3016]]; bounded author repair required.**
  The thirteenth model's eight named repairs survive, but `make
  candidate-packet-fourteenth-fresh-review` proves that hidden dependency outcomes are public,
  authority-looking product options are accepted, failure and stats contracts disagree, receipt
  and retained-graph closure are incomplete, scope typing is erased, and the named collector fault
  seam does not exist. A bounded author repair, another genuinely fresh review and the
  value-authority dependency precede implementation. The maintained operation
  parses the closed request, derives the complete seven-term factual identity, gives direct and
  projected narrow receipts the same dependency-closed graph, derives cache identity internally,
  admits only one privately asserted whole receipt, seals below already-frozen ancestors and
  executes all thirteen adapters over real production semantic/F1 functions. Binding those real
  values exposed two defects the placeholder repair could not reveal: production evidence brands
  are private symbol slots that the old walker rejected, and the old predecessor legal-evidence
  model emits an unbranded lookalike. The repair admits exactly production-asserted brand slots,
  rejects arbitrary symbols, and exercises the real legal map/declaration path while retaining the
  one-call production factory as an unlanded dependency rather than claiming it exists.
  The D2198–D2201 author repair remains present: the product factory fixes the primary manifest authority; every collector
  result is projection-addressed; thirteen exact context adapters satisfy the executable registry;
  and memo, service-stat and receipt-reference protocols are closed. The historical return remains
  reproducible; `make candidate-packet-third-author-repair` is the prior positive author contract.
  The returned falsifier remains historical evidence. The repair replaces the widened/mixed
  projection ids with one generated literal `id@version` map checked against the compiled manifest,
  and separates a scope's dependency-closed execution plan from its retained packet outputs.
  `make candidate-packet-fourth-author-repair` remains the positive author contract for those two
  repairs. The fourth fresh review found that the packet's flat legal-move list and its sealed
  `ExactLegalMoveMap` receipt still had two different specified value sources; exact return:
  `planning/evidence-foundation-ux/shared-candidate-packet-fourth-fresh-independent-review-2026-08-31.md`.
  The author repair now compiles and seals one exact map, flattens its retained payload by reference,
  and refuses an equal second enumeration. `make candidate-packet-fifth-author-repair` is its
  positive contract. The fifth review found that criterion 36's one-call requirement could not hold
  against the production declaration adapter, which recomputed the exact map while validating the
  retained payload. Exact return:
  `planning/evidence-foundation-ux/shared-candidate-packet-fifth-fresh-independent-review-2026-08-31.md`.
  The sixth repair consumes the value-authority route
  `createRulesMobilityReadingLegalMovesV1Evidence`: that FEN-to-declared-evidence factory owns the
  sole `exactLegalMoveMap` call, accepts no caller payload, and returns the one object graph the
  packet flattens by reference. The measured current two-computation path costs 2.724× the single-
  authority floor across six positions. `make candidate-packet-sixth-author-repair` is the positive
  contract and remains green. The sixth fresh review preserves that repair but finds that its
  prerequisite deletes a file §12 still claims, request scope can alter collector truth while a
  projected and direct packet share identity, and the retained-weight formula omits repaired receipt
  categories. The seventh repair consumes the predecessor factory without owning its file, removes
  scope from collector truth inputs, and replaces the obsolete coefficient with complete retained-
  graph byte/object receipts and explicit injected limits. Exact return:
  `planning/evidence-foundation-ux/shared-candidate-packet-sixth-fresh-independent-buildability-review-2026-09-04.md`.
  `make candidate-packet-sixth-fresh-review` names the historical 3/3 return;
  `make candidate-packet-seventh-author-repair` inverts those seams and is the positive repair contract. Implementation
  remains unauthorized. `make candidate-packet-eighth-fresh-review` proves the seventh repair still
  checks factory ownership against prose, simulates no real scope plan, omits retained wrapper
  objects and forbidden property shapes from its graph, uses a tautological category guard and
  never connects its measurement to cache admission. `make candidate-packet-eighth-author-repair`
  retains that falsifier and passes seven repair controls over the executable predecessor factory,
  all three plans, the exact private graph and bounded cache admission.
  [[D1580]] remains separate numeric appliance-tier debt. *(Prior state: D1977–D1981
  author-repaired after D1958–D1961, D1900–D1903 and D1945–D1947.)*
- **Author:** claude (initial draft); codex (2026-08-29 operation-boundary author repair). Drafted
  from `design/research/shared-candidate-evidence-packet.md` and
  `tools/d1071-candidate-packet-harness/`; every carried claim re-verified at HEAD, with seven
  corrections recorded
- **Created:** 2026-08-23
- **Design refs:** `design/05-in-run-experience.md` §5 (*"detection is cheap, significance is not"* — the split this RFC executes in code: one factual population, separate opinionated derivations) and §3b-i (*"The LLM is the voice, never the source"*); `design/03-product-breadth.md` §Play (opponent selection) and §Intelligence and explanation
</details>

## What still has to happen

1. `planning/work-state.json` blockers for the moved rows are re-pointed at the successor RFCs in
   the same commit as this cut; the packet RFC's blocked set drops from 92 to 16.
2. The two successor stubs stay drafts until something concrete needs them. Anything in them that
   cannot be justified by a real consumer stays unbuilt, per [[D3034]].
3. No fifteenth fresh review of the packet RFC is commissioned. The next event on that document is
   owner acceptance or rejection of the bounded contract.
