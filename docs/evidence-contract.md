# Evidence contract

Tabiya does not treat “evidence” as one bag of engine output. The production contract is compiled
from one static catalogue in `packages/runtime/src/evidence-catalog.ts` and one server availability
join in `apps/server/src/evidence-manifest.ts`.

The distinction is deliberate:

- A **producer** is an implementation that can emit or abstain: rules, Stockfish, Syzygy, Maia,
  Explorer, shapes, authored claims, or recorded sidecars.
- A **projection** is one versioned meaning retained from that producer. A structural predicate and
  a structural reading are different projections. Stockfish evaluation and principal variation are
  different projections.
- A **consumer** is an operation with a permission and output consequence: an authored condition,
  deterministic guidance, external voice, a board overlay, the evidence inspector, comparison,
  opponent selection, or explicit analysis.
- An **adapter/binding** is an exact producer/projection/consumer edge. It can narrow timing, role,
  session, form, answer content, latency, and budgets; it cannot widen any of them.

There are no wildcard or “latest” bindings. The compiled manifest is sorted, frozen, and identified
by a SHA-256 digest. `/capabilities` returns that digest, current producer availability, and a
consumer-safe binding summary. It never returns engine lines, authored prose, provider secrets, or
corpus rows.

The current compiled closure is 37 producers, 193 projections, 25 consumers and 210 bindings,
plus 67 semantic-event declarations, 67 eligibility rows, 15 refusal reasons and one selection
policy. The executable manifest and semantic-evidence checks own this tuple.

The additional inert projection is `derived.grade.move_quality@1`: it thresholds paired,
same-instrument engine readings under the cited `grade-convention@1`, retains typed mate scores,
and can carry evaluation only. It remains `experimental` until the post-commit and Review module
consumers compile; catalogue presence alone does not make it visible.

`rules.mobility.reading.legal_moves@1` is likewise additive and inspector-only. It is the complete
position-rules-exact legal move map for the FEN's actual side to move: every side-to-move piece has
a row, including pieces with no legal move. Move identity retains chessops' Chess960-safe
king-to-rook UCI while the separate destination operand names the king's landing square; display
remains SAN. Moves also retain role and all four promotion identities. It is not the older
`piece_destinations@1` convention, which intentionally analyzes both-color turn clones and joins
one-exchange local safety. Registration creates no learner binding; the requested-sight module owns
that later delivery decision.

## Honest homes and raw evidence

Every projection is either bound to a consumer or has one explicit disposition:
`inspector_only`, `author_only`, `operator_only`, `experimental`, or `retired`. Every consumer is
likewise bound or explicitly disposed. This is why the migrated `assistance.arrows` preference is
visible as `experimental` even though it has no producer or renderer; omission would hide the very
gap the manifest exists to expose.

Raw structural tables, exact exchange/tactical predicates, transition counts, human-model splits, corpus rows, engine lines, and
tablebase detail are **Evidence inspector** material. That label means “inspect the grounded input,”
not “Tabiya recommends this move.” Guidance modules remain a later selection/presentation layer.
Registering evidence does not make it learner-visible and does not create another setting.

## LLM boundary

The external voice renderer is a consumer, never a chess authority. Server guidance first wraps
source-specific values as `DeclaredEvidence`, admits the exact scope-specific consumer view, then
runs registered per-projection renderers. Both admitted and rendered views carry a private runtime
symbol plus constructor-owned `WeakSet` membership: object spread, JSON round-trips and casts cannot
copy admission. The provider and `voiceCheck` read the same sealed `{ evidence, sentences }` items; there is
no parallel packet sentence array that either side can widen. Maia candidates, Explorer rows,
transition counts, engine principal variations, and recorded engine/tablebase prose do not enter
merely because the catalogue knows they exist.

Compare and Story use declared `run.record` facts and deterministic `derived.*` projections rather
than trusting parallel prose arrays. Comparison trajectories, structure/timing strips, and recorded
piece routes pass their distinct admitted consumers. Story moments, prominence rank, title, public
share, and card prose are rendered from one admitted `review.story` view; raw Stockfish events are
derivation inputs, not story-delivery evidence. Derived projections enumerate either one non-empty
exact-version conjunction or a closed, non-empty `anyOf` set of alternative conjunctions. Every
alternative is validated independently; duplicate sources, duplicate members, empty members,
subsets, supersets and unions of alternatives are rejected, and the runtime event seal records the
one member actually used. A derived projection may not widen any member's grounding, exactness,
answer content, or abstention. Reasoning review is a
separate non-chess provider request over the learner transcript, key points, and detections; it is
not a voice scope and receives no chess-evidence items.

Provider output still passes the deterministic noun, square, move, judgement, and prescription
checks. Recorded engine/tablebase sentences are appended afterward from frozen renderers. If the
provider fails or is absent, deterministic guidance remains available byte-for-byte.

## Provider-off behavior

Provider availability is runtime state, separate from static capability:

- Stockfish and Maia report `unavailable` when absent.
- Syzygy and Explorer report `honest_empty` where absence or domain limits are a valid empty result.
- Local rules, authored evidence, and recorded sidecars remain available without external services.
- External voice being absent does not make evidence or deterministic guidance absent.

Startup compiles the same aggregate as `make evidence-manifest-check`; an invalid declaration fails
before traffic is served.

## Adding or changing evidence

1. Start with the product operation that needs the information. Do not start with a raw toggle.
2. Add or version the producer projection with its literal semantics, operands, grounding,
   exactness, abstention, answer content, forms, dependencies, and limitations.
3. Add an exact consumer acceptance and adapter whose constraints only narrow both endpoints.
4. Add a producer-off test when any endpoint depends on a provider.
5. Add the production symbol to the operation closure (or deliberately extend that census) and
   run `make evidence-manifest-check` plus `make verify`.
6. If no honest consumer exists, record one explicit disposition. Do not add a wildcard, legacy
   bypass, generic packet renderer, or user-facing primitive switch.

F1's bind stage covers twenty-three production operations. Each package registers the actual
exported callable for every operation with `evidenceConsumerOperation`; the catalogue's
`implementation` value is that callable's exact export name. `make evidence-manifest-check`
combines the runtime, server, and web registries and requires exact ID-set equality, version 1,
one registration per ID, a manifest declaration, and exact declaration-to-function-name equality.
It does not infer consumption from file paths or search source text for a matching string.
Removing or renaming a registered consumer therefore breaks the compiled contract at the
operation boundary; behavioral tests remain responsible for what the callable does.

Producer computation and provider acquisition are deliberately outside that consumer census;
authored structural AST inputs and
computed results, evidence-reference resolution, normalized versus delivery claims, Explorer page
versus frontier results, recorded comparison points, sourcing-ledger records, and raw opponent
provider results all retain distinct payload identities. Every registered operation is anchored at
an exported sealed-view consumer rather than at copy or a DOM attribute.

F1 answers eligibility and traceability only. Relevance/lift selection, semantic event valence,
presets, workflows, theory retrieval, and content migration belong to their later RFCs.

## Learner-module contract foundation

The runtime exports a closed eleven-id learner-module vocabulary and a compiler for the complete
thirteen-field contract: intent/action, evidence acceptance, timing/initiative, answer contract,
disclosure/session/role ceilings, overflow budgets, policy/precedence, honest-empty behavior,
seat, forms, and deterministic rendering. It also types `at_commit` as distinct from pre- and
post-commit, pins the module-to-evidence timing/form/answer images, enforces the three progressive
hint stages, preserves visible-board assistance parity, permits exactly one board-adjacent module,
and refuses pre-commit avoidance evidence or an avoidance fact without its denominator.

No production module declarations or consumers compile yet. D965–D968 hold four contract holes in
the accepted RFC: an incomplete Appendix-B enumeration with a nonexistent projection, undefined
reducer identity/window/scope, absent literal role/session/disclosure ceilings, and an ambiguous
“maximum” answer-distance image. The compiler can advance independently; filling those policy
values in code would invent learner-facing access and selection behavior.

## Breadth collector inventory

The second collector wave adds eight producers and eighteen closed projections without adding a
learner surface: exact all-square pseudo/legal controllers; B/N/R/Q legal and one-exchange-local
destination sets; pawn contacts, locks, passage/candidate relations and retained sequences;
material-role vectors; king zone/shelter/escape sets; defender-exposure/consequence joins; captured
zone-defender identity; and moved heavy-piece open-file occupancy. All events are eligible only for
`research.semantic_selection@1`; all five readings are `inspector_only`.

Six named conventions are literal manifest bytes (`local-non-losing@1`,
`candidate-majority@1`, `king-zone@1`, `king-shelter@1`,
`material-role-signature@1`, and `pressure-line@1`). They expose their operands and ceilings; none
is an engine grade, inferred plan, safety verdict, or recommendation. The permanent
`breadth-collector-measurement` instrument evaluates authored and sealed-imported populations
separately and retains zeroes.

One typed-contract limitation remains open as D956: the current derivation declaration supports
only a conjunction, while open-file occupancy consumes an `open_file | half_open_file` source.
Exact open-file events compile today; half-open payloads remain uncompiled rather than receiving a
forged source. Breadth closeout waits for the accepted RFC/evidence contract to gain a closed
disjunctive derivation form.

The same limitation is now exercised by Wave-C (D963): deflection, attraction, and the tablebase
race each have honest alternative source paths. They remain absent from the compiled catalogue
until a closed disjunction can validate the exact branch actually supplied. The bounded-mate
projection is likewise held until its promised re-derivable proof digest has an explicit retained
certificate contract. Nine independently buildable Wave-C projections are registered meanwhile;
seven events remain research-only and add no learner surface, preset, renderer, or raw setting.
