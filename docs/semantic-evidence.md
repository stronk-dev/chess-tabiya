# Semantic evidence

Semantic evidence is the typed bridge between Tabiya's raw detectors and later learner-facing
modules. It does not itself choose a hint, name a tactic, grade a move, or turn on assistance.

## Reading, event, eligibility, selection

A **reading** describes a position or a reduced transition count. Existing inspector surfaces keep
using these values. An **event** is an identity-preserving relation across one legal edge: exact
before/after FENs, canonical UCI, a declared sign, and the pieces, squares, rays, roles or counts
that make the relation true. F2 registered 22 direct event projections and eleven derived
counterfactual-absence projections.
The tactical foundation adds four direct research events: identity-retaining capture,
exchange-filtered double attack, complete one-reply breadth, and exact check. Module admission
comes from the exact consumer table: fork survival is also accepted by Post-commit Nudge and
Review Map, not exclusively Inspector/machine evidence.

Tactical identities follow physical piece destinations, not encoded UCI endpoints. Castling
retains its canonical king-to-rook move identity while resolving both the king's landing and
the rook's relocation, including stationary cases. Defender-duty events can retain either
relocated defender; loose-piece deltas follow the rook as well as other retained non-king
pieces. Double attacks belong to the primary mover, not a rook found at its encoded endpoint;
their attacker operand carries the post-move role so promotion captions name the actual piece.
Fork-survival checks the actual post-move occupant, including a promoted role, against every
legal reply; capture, movement of original targets and legal check parries still refute it.
Mate-in-one operands likewise separate the primary mover's landing from the actual checking
pieces. These are identity repairs, not move grades or new learner-module admissions.

Defender relocation also follows a legally promoted pawn into its new role. A lost-duty
event requires the same surviving target and an actually absent after-state defence;
promotion alone is not enough. Its existing Inspector binding remains unchanged, and
Post-commit Nudge does not admit this event.

Loose-piece readings retain en-passant captures against the occupied victim square, separately
from the empty capture landing. The existing legal capture/exchange authority supplies both;
pinned captures and expired rights are excluded. A legal equal exchange remains a capturer
without making the victim en prise. Double-push deltas and their Post-commit Nudge captions
use that same reading, not a renderer-side reconstruction.

The breadth foundation adds twelve event projections over exact control, mobility, pawn, material,
king, defender and open-file operands. Recorded two-/three-edge events preserve every node/FEN
boundary and piece identity; they report observed order only. They deliberately do not name
overload, deflection, removal, force, success, king exposure, activity, or a plan. Those names and
their able-to-fail consequence requirements belong to the semantic-collector successor.

Retained-piece mobility follows the physical castling rook as well as ordinary B/N/R/Q movers.
The rook's before/after squares and legal/local-non-losing destination changes survive factories,
candidate packets and Inspector serialization. A stationary castling rook remains `moved: false`;
changed destinations do not imply relocation. Existing saved histories rebuild through longitudinal
derivation revision 4 without changing recorded play, projection membership or learner permissions.

Castling rights-loss causes use the normalized castling side, not encoded king travel distance:
adjacent-rook and stationary-king Chess960 moves are `castled`, while ordinary king steps remain
`king_moved`. Stationary-king legality checks terminate at the actual landing square, including
attacks exposed when the rook moves away. Permanent controls reach candidate/saved reconstruction,
registered Review rendering and authenticated Inspector HTTP output; reading evidence does not
change saved play. Longitudinal membership uses projection/sign, not this cause operand.
The legality reading also retains rook-only transit/landing blockers using the rules authority's
combined clearance path. It preserves existing king-path ordering, excludes both castling pieces
and names shared blockers only once. Both-color geometry controls and authenticated Inspector
positive/nearby-negative cases cover orthodox queenside and Chess960 stationary/overlapping paths.
The same corrected operands reach the existing opponent candidate-vector consumer; bounded
score inputs are retained. This is collector fidelity, not a new personality or calibrated bot.

Local trapped-piece readings also include the rook's physical destination when the legal
command is castling. A safe landing is an escape; a landing admitting a positive local capture
remains locally losing. Having castling rights alone is not an exemption. Both-color/wing
controls reach the sealed factory, complete candidate packet, opponent consumer and authenticated
Inspector; nearby positions without the right remain trapped. The convention remains the bounded
`trapped@1` test, not a claim that the piece is lost under every possible defensive plan.

Pawn protection and connected-pair gains follow the exact moved pawn across its legal edge;
an advance does not create an existing property again. Pair identity is unordered, so a changed
enumeration order also cannot become a gain. Genuine newly protected passers remain gains and
passed-pawn advancement remains a separate fact. The same repair reaches sealed factories,
complete candidate packets, saved-run reconstruction and revision-4 learner-history rebuilds.

The current semantic-collector checkpoint adds the exact defender-duty reading, defender
removal/relocation events, the four-clause overload-response predicate, a bounded forced-mate proof,
and seven observed tactic events: deflection, attraction, line-blocker clearance, square clearance,
interference, checking zwischenzug, and overload exploitation. Alternative causal authorities are
closed manifest members rather than optional prose: attraction seals either its check consequence or
its retained heavy-piece capture, never their union. Deflection likewise seals its common
bait-capture member or its common-plus-check member; bait capture wins if both facts hold. One narrow
sealed check-event constructor is shared by the broad tactical collector and exact-source path, so
the latter does not compute reply breadth or double attack merely to retain check authority. The
observed events retain their complete recorded windows in the sealed payload even
though their manifest operands name only the motif-specific identities. They remain evidence facts,
not claims that a move was intended, forced, best, or good.

Capture identity distinguishes the removed piece's square from the mover's landing. For en
passant, overload response conflicts and recorded overload/defender-consequence windows join the
removed pawn's prior duty; a recapture still lands on the attacking pawn's actual landing square.
The same distinction survives saved-window reconstruction and the registered Review caption and
square/path presentation. It does not assert intent, force or move quality.

**Eligibility** is an exact event-to-consumer permission. It says that an event may reach that
consumer; it does not say the event is useful, visible or enabled. Every row names its validation
posture explicitly (`semanticValidation`): `required` compiles eligible only over a `passed`
generated verdict, while `research_only` is legal only for an author/operator analysis consumer
whose forms and answers exclude learner prose, board paint, hints, grades and moves. The current 78
rows target only `research.semantic_selection@1` and are `research_only`. Existing product
consumers receive no new evidence.

**Selection** compares the played edge with every other legal move from the same parent position.
The denominator includes alternatives that emit no event. The versioned research policy keeps at
most two locally distinctive facts and treats an empty result as normal output. It is a regression
profile, not a learner default.

## Candidate evidence packet

Since `rfc/shared-candidate-evidence-packet.md` (2026-09-24), selection no longer takes its
population from a caller callback. `selectSemanticEvidence(manifest, policy, { receipt, moveUci })`
accepts only a `CandidatePopulationReceipt` minted by `compileCandidatePopulation` in
`packages/runtime/src/candidate-population.ts`, and `selectLocalSemanticEvidence` compiles one.

- **The population is an output.** A request is exactly `{ beforeFen, ruleset: "standard", scope }`.
  The compiler calls `createRulesMobilityReadingLegalMovesV1Evidence` once, flattens that sealed
  exact map without copying move objects, and derives every child FEN, event and reading itself.
  Candidates are set-equal to the legal authority, promotions included. Checkmate and stalemate are
  the only empty packets. A non-terminal empty population is a typed `non_terminal_empty` failure.
- **One closure.** `localSemanticEventClosure` is the one-edge event composition that
  `localSemanticEvents`, the packet and local selection all read. The narrower eight-family inline
  closure is gone. The loose-piece collector's `invalid_turn_clone` becomes a typed row abstention
  instead of being dropped. The permitted projections are the generated literal `id@version` map in
  `candidate-population-projections.generated.ts`: 44 one-edge events plus the twenty
  `candidateChildReadings`, legal exchange and fork survival. The map is regenerated or checked with
  `node tools/generate-candidate-packet-projections.mjs [--check]`. `human.maia.candidate_wdl` is
  outside it.
- **Retention is by reference.** Rows hold the original sealed events and readings. A private
  `WeakMap` receipt authority recognises only receipts the compiler minted, and
  `assertCandidatePacketEvent` admits an event only if it `===` a retained value. A byte-identical
  rebuild passes the event seal but is refused here.
- **Scope narrows evidence, never candidates.** The three closed scopes are events-only, readings-only
  and both. Scope is part of the facts-only `packetId`, together with the full FEN, the legal and
  move-identity conventions, the manifest digest, `CANDIDATE_PACKET_COMPILER_VERSION` and the ruleset.
  `projectCandidatePopulationReceipt` narrows a wide receipt without chess work. It never widens or
  crosses scopes.
- **Counts are measured.** `evaluatedAlternatives` counts alternatives whose event closure did not
  abstain. For an in-check root it is 0, and the result is `counterfactual_population_incomplete`.
- **Readers never normalise.** `candidatePlayedRow` and `candidateAlternatives` accept only
  `MOVE_IDENTITY_CONVENTION` identities. `e1g1` fails with `CandidatePacketMoveError`, so conversion
  happens at the engine or pack boundary.

The packet is process-local and operator-only. It is never persisted and has no product consumer:
`make semantic-evidence-check` is a contract instrument. It carries no score, rank, salience or
valence. The bounded service and cache are `rfc/candidate-population-service.md`'s work, and the
collector registry and full outcome algebra are `rfc/candidate-collector-registry.md`'s.

## Sign is not valence

`gained`, `lost`, `preserved` and selector-derived `avoided` describe relations. None means good,
bad, accurate, important or intended. F2 emits no valence. A future valenced event must declare and
carry a separately admitted authority; rarity, global lift, Maia mass and Explorer frequency are
not such authority.

`avoided` is constructed only after complete legal-alternative evaluation. It retains every
supporting alternative event plus the numerator and full denominator. A direct producer cannot
emit it.

## Sealed construction

Declared evidence, semantic events and selected results carry runtime construction identity in
addition to TypeScript types. Object spread and double casts do not preserve authority. Since
`rfc/evidence-value-authority.md` (2026-09-24) there are no source adapters: every value is minted by
its one factory in `evidence-factories.ts`, reached only through the package-internal
`invokeEvidenceValueRoute`, and carries a private value receipt (see `docs/evidence-contract.md`
§Value authority). Structural and transition events are computed by their factories from the FEN or
validated edge; avoidance is computed from the edge plus the complete sealed alternative events.

`compileSemanticEvidenceEvent` no longer accepts `operands`. The event's operands **are** the sealed
evidence payload, and its `derivationInputs` digests must equal exactly the source digests named by
that evidence's factory receipt, so a caller cannot pair a sealed value with a different ancestry.
Registered Compare and Story renderers receive structured operands and derive prose themselves;
callers cannot smuggle a pre-rendered sentence under a structured projection.

## Compiled closure and provider behavior

The primary manifest contains 47 producers, 285 projections, 42 consumers and 556 bindings, plus
78 semantic events, 78 eligibility rows, 16 reasons and one selection policy. These are registered
declarations, not proof of complete production consumption or a useful learner workflow. All collections
contribute to one canonical digest. `/capabilities` reports this tuple and the same digest used at
startup and by `make semantic-evidence-check`.

The exact semantic-event authority is `SEMANTIC_EVENT_PROJECTION_REFS` (`id@version`). The former
base-id string inventory was removed because v1 and the recorded-path v2 successors coexist under
equal ids; `SEMANTIC_EVENT_FAMILY_IDS` is the explicitly lossy family view for analysis and display
only and never polices manifest or consumer closure.

## Recorded semantic paths

`recordedSemanticPath(run, branchId)` (`packages/runtime/src/recorded-semantic-path.ts`,
`rfc/recorded-semantic-path.md`) is the only producer of the eleven multi-edge sequence projections
over a real run. It accepts a `DrillRun` and a branch id only — never nodes, anchors, PGN arrays or an
engine principal variation.

- **Path authority.** `branchPath`/`branchPaths` delegate to `resolveBranchPath`, a total graph
  resolver: unique branch and node ids, exactly one parentless root declared by exactly one
  `run.started`, a present fork, every same-branch node reaching that fork through present parents
  without a cycle, and exactly one graph tip. Node-array order is never trusted and a broken chain is
  refused, not truncated (`BranchQueryError` `INVALID_BRANCH_GRAPH` with its `reason`).
- **Exact edge source.** The `run.record.edge@1` factory (`{ run, parent, child }`, reached through
  `recordedEdgeEvidence` or the invoker) is the only constructor of
  `run.record.edge@1` (inspector-only, no sentence renderer). It replays the move and refuses any
  parent, ply, canonical UCI, canonical SAN or FEN disagreement. Its payload carries the child's
  actual recorded branch, so a shared ancestral edge has one identity for every descendant path.
- **v2 successors.** The eleven sequence projections have `@2` successors that keep the v1 operands,
  signs, conventions and limitations and replace `run.record.move@1` with `run.record.edge@1`. Their
  constructors bind every edge value-for-value to the operand anchors and refuse edges not minted
  from an actual run (the edge's value receipt names `createRunRecordEdgeV1Evidence`). v1 declarations
  and factories remain and have no production caller.
- **Harassment pressure.** The consecutive recorded reply identifies the harassed bishop from
  the complete newly attacked minor population, including competing knights or bishops. Only
  relocation preserving the exact slider/screen/target relation emits; a knight reply or a broken
  pressure line remains a completed negative. This describes the sequence, not intent or quality.
- **Receipts.** Every edge start receives exactly one receipt per evaluator row (eleven projections,
  thirteen rows): `emitted`, `no_witness` (an evaluated negative) or `insufficient_continuation`
  (not a negative). Any path or edge corruption refuses the whole path before any detector runs.
- **Execution shape.** One `transitionSemanticEvents` compile and one `checkSemanticEvent` probe per
  edge; defender duty is memoised per window-start FEN within one call; full `localSemanticEvents`
  fan-out is never used except by the eager byte-parity oracle.
- **Identity.** Events order by end ply, start ply, projection and id. The digest covers the manifest
  digest, the compiled convention-registry digest, the ordered exact edges and each event's input
  value digests and sealed convention-receipt digest, run, branch, origin, path, event ids and
  receipts. The result's `conventionReceipt` (`status: "registered"`) names the registry digest, the
  union of the emitted events' convention refs and each event's receipt digest in emission order.
- **Server.** `apps/server/src/recorded-semantic-path.ts` exposes the injected, read-authorised
  `compileRecordedSemanticPath`; there is no public raw-evidence route. Review consumes the same
  runtime authority through its `compilePhaseArc` path and storage-authorised Review prefix.
  Registered event compositions retain their own end-node identity through the row's presentation
  receipt, including caption-owned squares and recorded moves. Review paints only the focused
  fact's squares, retiring paint on navigation or replacement. Longitudinal and remaining execution/
  eligibility discharges stay open; the RFC remains `awaiting D2`, not helper-only or complete.

`make recorded-semantic-path-check` runs the fixtures, the imported-sample census, eager parity and
the 20/40/80-ply timing arms; the pinned performance tier enforces total p95 ≤ 500 ms.

Provider absence remains explicit through the F1 binding contract. F2's initial events are local
rules/convention facts, so the complete-population selector never treats missing provider output as
absence of an event.

Wave-C is not closed. Twelve of fourteen projections are registered. D963 now holds only the two
promotion-race projections: geometry needs its final exact declared input set and the outcome join
needs live-or-recorded tablebase authority. Deflection, attraction and bounded mate are compiled;
the manifest does not advertise the remaining two until their authorities pass the independent
promotion-seam review.

## Declared, validated, research-only and learner-eligible

`rfc/semantic-validation-authority.md` replaces the old self-generated `semantic-event:<id>` labels
with four independent authorities:

1. **Declared** — the projection compiles in the F1 manifest and its values carry a sole-factory
   value receipt. That says what an event *is*, not that the chess predicate is right.
2. **Validated** — the subject's literal profile in `semantic-validation-profiles.json` carries all
   six arms (positive, semantic negative, orientation, counterfactual, imported population,
   external label) and every non-`not_applicable` arm passed. Positives and negatives are data
   cases in `semantic-validation-cases.json` executed by `semantic-validation-runner.ts` through
   the registered production operation (`semantic-validation-operations.ts`); each case resolves
   an independent authority (a moved D1713 assertion whose test body and expectation bytes are
   digest-frozen, a rules oracle plus proposition, an immutable cited source, or an owner row in
   the protected `design/research/semantic-validation-owner-authorities.json`). The imported-
   population arm executes the current operation over the R2 sample (579 sampled edges, 108
   recorded paths). `make semantic-validation-update` is the only writer of
   `semantic-validation-receipt.generated.{json,ts}`; `make semantic-validation-check` (part of
   `verify-software`) recomputes it and fails on any byte difference — so a change to an
   operation's source closure, a case, a profile or a population result must be regenerated.
3. **Research-only** — operator analysis may read an unvalidated event; the compiler refuses the
   same posture for a learner, host, participant or spectator consumer.
4. **Learner-eligible** — `admitValidatedSemanticInstance` admits one exact instance only when its
   subject verdict is `passed` *and* the instance carries the sole-factory value receipt with a
   reproduced payload digest. A missing, alternate or swapped receipt is `event_value_unverified`.

The current register has 81 subjects. The 38 migrated cases remain, D3563 adds the independent
standard castling positive/nearby negative, and D3616 adds adjacent-rook and stationary-king
positives. D3628 adds twelve legal nearby negatives and nine v2 recorded-path positives,
giving 63 cases (41 positives, 22 negatives). D3639 adds 24 source-bound literal-rule cases
for capture, clock reset, check and castling-rights loss, bringing that checkpoint to 87
(57 positives, 30 negatives). D3663 adds six source-bound legal castling negatives for
capture class, removed defender and last-of-role: the current total is 93 (57 positives,
36 negatives). Castling touches a friendly rook but removes no piece; each completed
operation emits the real castling event and omits the capture-dependent subject.
All prior cases remain. Both colors have completed legal hard
negatives, exact operands and pre-invocation forged-authority rejection. Each sequence fixture also checks its completed
production window; canonical qualification invokes the complete recorded application path,
not the broken sequence-to-parent reach adapter tracked as D3629. The original 42 cases
remain, one missing-capture-operand predicate is not promoted to a legal chess negative,
and orientation/eligibility rules are unchanged. The build-only cited-source store retains the
original six-line castling excerpt and four small literal-rule excerpts from python-chess 1.11.2
at a fixed commit, with attribution and licence; the four additions were compared byte-for-byte
with that pinned upstream source. Resolution checks the
exact source, revision, licence, excerpt and proposition, then binds its case, subject,
expectation, legal input, production operation and arm. Unknown references fail before production invocation; no network
lookup, caller-provided source or protected owner-store bootstrap is involved. All 34 cited cases run
through actual registered production operations. This is not independent strategic judgement or a new
learner permission. The source store is excluded from the production runtime import closure.

53 subjects carry an executed population receipt and 8 carry D872 external-disagreement
receipts — and **zero** subjects are fully validated, because required arms remain missing,
including emitter-level orientation authority. The
avoidance family (D1716) and king opposition (D1717) abstain on every arm until their successors
land; the eleven v1 multi-edge window events have no production operation (their v2 successors
do). Validation never transfers from inputs to a derived event, and a new projection version
starts with no verdict.

The real-payload orientation check has a measured contract gap (D3564): thirteen kinds
within thirty migrated positive edge cases retain FEN/UCI operands that none of the five
closed mirror rules can compare. Exact-input-binding rules are a research proposal awaiting
author/cross-review, not shipping behavior. The suspected fullmove-counter input defect is
refuted by legal castling, en-passant and promotion controls. D3566 separately implements
the already-required missing/crossed-partner preflight before either collector invocation;
valid pairs still reach the total operand comparison. See
`design/research/semantic-validation-closure.md` for the bounded experiment and handoff.

## Adding a product module

F5 must add a named consumer, literal eligibility rows, exact bindings, a versioned production
policy and workflow defaults together. Raw producer toggles are not a product configuration
surface. Presets decide which module is appropriate in Just Play, drills, campaign or review while
the advanced inspector may expose the underlying inventory.
