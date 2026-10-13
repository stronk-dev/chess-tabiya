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

Open-file occupancy follows the physical moving heavy piece, including castling's secondary
rook and Chess960 swaps. A stationary rook does not fire. The source file must previously have
been neither open nor mover-half-open; the destination class comes from the exact admitted
structural reading. This says where the rook moved, not that it improved or controls the file.
The sole factory, complete candidate packet and authenticated Nudge acquisition retain this
identity. Selection and qualification are separate; Review's declared pair still lacks its
incoming-edge delivery (D3758), and Full Inspector does not accept this projection.

Occupied-target attack/defence events retain the target's color and role as well as its square.
A Chess960 castle that replaces a rook with its king does not report a new defence of the
departed rook. Both-color/wings controls cover factories, complete legal candidates, registered
rendering and authenticated Nudge acquisition, alongside gained/lost retained-bishop positives.
This corrects named target identity; the separate scalar square-count readings are unchanged.

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
derivation revision 5 without changing recorded play, projection membership or learner permissions.

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
complete candidate packets, saved-run reconstruction and current learner-history rebuilds.

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

Recorded v2 checking zwischenzug requires the original recapturer to remain at its
origin after the intervening checking move and reply. Matching an earlier legal UCI
origin is not sufficient: checking castling can replace that king with the secondary
rook on the same square. Both compiler enumeration and the sole evidence factory
apply the same occupancy check; historical v1 stays unchanged. Both-colour valid
king recaptures survive owned reconstruction and the actual authenticated Review
caption/square/path presentation without rewriting saved play.

Capture identity distinguishes the removed piece's square from the mover's landing. For en
passant, overload response conflicts and recorded overload/defender-consequence windows join the
removed pawn's prior duty; a recapture still lands on the attacking pawn's actual landing square.
The same distinction survives saved-window reconstruction and the registered Review caption and
square/path presentation. It does not assert intent, force or move quality.

An overload recapture follows the defender to its actual landing occupant, including promotion.
A rook/queen promotion that preserves every retained sole duty refutes the conflict, even when
the original defender was a pawn. A blocked line can still produce a genuine conflict; promotion
is not a blanket exemption. Both-colour legal controls cover all four promotion alternatives,
the sealed factory and registered Full Inspector wire presentation (`make semantic-tactics-check`).
This kernel repair does not add the response predicate to the shared candidate packet or discharge
the semantic-collector RFC's remaining consumer/use obligations.

The separate local bounded-target service retains an exact named material capture,
its immediate preservation/removal for every legal candidate, and existential versus
all-defences return within the declared horizon. `make bounded-target-contract-production`
includes fourteen independent finite-board controls over complete populations, published
witness/refutation identities, nonempty universal defence sets and visited counts. The
oracle uses whole-board material balances, not production exchange/target helpers.
This is regression coverage; the canonical validation authorities and application
consumer bindings remain incomplete, and these three projections stay inspector-only.

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
- **Retained targets.** Recorded v2 deflection and line-blocker clearance require the original
  target to survive both intervening boundaries. Capturing it, then capturing a different piece
  of the same colour/role on the same square, is a completed `no_witness`, not either motif.
  The compiler and sole factories use the same target-continuity check; the frozen v1 readers
  remain unchanged. Both-colour controls cover valid retained targets, same-role replacements,
  owned saved reconstruction and Review's phase arc (`make recorded-target-continuity-check`).
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
  fact's squares, retiring paint on navigation or replacement. D3735 tests actual saved-source
  and authenticated Review adoption for all eleven recorded families, eleven hard negatives and
  two extra horizons, preserving event identity and enforcing read authority/no-write behavior.
  `make recorded-consumer-adoption-check` also proves the source boundary is load-bearing.
  D2 and Review D5 are discharged; longitudinal D6 and downstream eligibility discharges stay
  open. The RFC remains `awaiting D3`, not helper-only or complete. Longitudinal cannot use
  occurrence-only sequence rates in place of complete opportunity denominators.

Recorded attraction's v2 follow-up resolves physical castling movement rather than treating the
king-to-rook UCI endpoint as an occupied destination. A relocated king or secondary rook must
actually attack the attracted piece's arrival square. A stationary piece is not a relocation;
castling alone is no witness. The same reader serves the recorded compiler and the sole sealed
v2 factory. Both the three-edge king-check and five-edge queen/rook-capture horizons retain
their existing definitions, exact end-node and complete recorded line. The frozen v1 reader
keeps its predecessor output. D3736's both-colour controls reach actual authenticated Review
and desktop/phone captions, highlights and paint retirement without modifying saved play.

Recorded square-clearance v2 likewise follows physical relocations at both ends of its existing
three-edge window. Either castling piece can vacate an exact square; a later quiet B/R/Q relocation
can arrive on or pass through it, including the secondary castling rook. Replaced or occupied
origins are not empty vacations and stationary pieces are not moves. Two vacated squares remain
two exact facts rather than losing one to a king-only move identity. Later captures and unrelated
castling remain excluded. The compiler and sole v2 factory share this reader; frozen v1 output,
saved play and the existing renderer/consumer contracts remain unchanged.

Recorded defender-consequence v2 also follows the reply's physical relocations. A secondary
castling rook can be the retained defender: it must become newly exposed to a positive legal
exchange after the first move, actually relocate and lose its exact target duty on the reply,
then that surviving target must be positively captured on the third edge. A stationary king
does not hide the rook's movement. Quiet continuations, non-positive captures and defenders
not newly exposed remain absent. The first-edge lost-duty/captured-defender arm is unchanged;
no pressure, force, intention or causal deflection is inferred. The compiler and sole v2 factory
share the reader, while frozen v1 output and saved play remain unchanged. Whole-board defense
populations remain demand-bound to the necessary final capture and retained duty.

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
   Each event observation also passes the existing semantic-event validator before its value
   receipt is admitted. A genuine sealed payload inside a copied or edited event wrapper does
   not validate the wrapper's identity, projection, anchor, operands, derivation or basis.
   Genuine one-edge and recorded-window events keep their existing identities and receipts.
   Before target filtering, observation kinds must match the existing event/reading root
   registries. Relabelling an emitted event as a reading cannot bypass its wrapper check or
   turn its emission into a passing omission; legitimate bounded-target readings remain valid.
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
capture class, removed defender and last-of-role: that checkpoint has 93 (57 positives,
36 negatives). D3666 adds ten both-colour legal isolated-pawn-advance negatives for
occupied attack/defence, slider ray, pawn contact and defended duty, bringing the total
to 103 (57 positives, 46 negatives). The complete operation must emit clock reset while
omitting each contact family; exact input/subject/operation/expectation borrowing refuses.
The source store retains separately labelled pawn and king branches of the same pinned
python-chess movement function, not a fabricated contiguous excerpt. Castling touches a
friendly rook but removes no piece; each completed
operation emits the real castling event and omits the capture-dependent subject.
D3667 adds sixteen both-colour gained/lost positives and eight populated negatives for
occupied attack/defence, slider ray and defended duty: that checkpoint has 127 (73 positives,
54 negatives). Exact actor/occupant addresses, ray endpoints, blocker sets and gained/lost
direction are asserted. Existing contact persists when a redundant defender moves; an
unchanged blocked rook ray is not a newly opened line; one newly attacked defended target
does not cross the existing two-duty threshold. Opponent pawn advances also create/release
the stationary defender's counted duties. These are geometric/count facts, never an overload,
strategic advantage or move grade. The new manifest retains the separately labelled rook branch
at the same pinned revision without changing any prior source or case.
D3676 adds twelve both-colour populated legal negatives for backward, isolated, doubled and
passed pawns and open/half-open files. One pawn per colour per file at ranks 2/7 gives adjacent
friendly support and an opposing pawn ahead; king steps preserve those literal operands.
The complete structural operation emits other events while omitting the exact subject.
That checkpoint totals 139 (73 positives, 66 negatives), retaining all 127 prior cases unchanged.
The independently retained piece-set excerpt establishes colour/pawn extraction only: the
case's arithmetic binds absence under the existing vocabulary, not strategic value, general
positive correctness or a new chess teaching claim.
D3685 adds 36 source-bound positives: both colours, gained/lost/preserved exact membership
for those six families. Five separately labelled Stockfish rule excerpts are checked verbatim
at commit `e6e324eb28fd49c1fc44b3b65784f85a773ec61c`; literal pawn sets, relative ranks,
empty stop squares and attack directions independently check the retained operands.
Opponent moves can change a stationary pawn's status. Open and half-open remain distinct;
these finite backward/doubled examples do not adopt the engine's broader evaluation heuristics.
The positive cells are now present; the 139 predecessor records remain byte-for-byte unchanged.
That checkpoint totals 175 (109 positives, 66 negatives), over 81 subjects. Orientation, the draft window
repair and other required arms remain open: zero subjects are fully qualified and no subject
becomes learner-eligible. No new collector, strategic value judgement or pack bytes are added.
D3688 adds sixteen source-bound material/mobility cases through the real local-edge operation:
six role-count positives, four populated material negatives, four exact destination-change
positives and two populated unchanged-bishop negatives. Capture can reduce the count-based
asymmetry; queen/knight promotion can change its vector without increasing its magnitude.
A pawn advance can remove one stationary knight's locally non-losing destination while
leaving its full legal destination set unchanged. Vacating a friendly rook-ray blocker
retains the exact new destinations. Neither finding means strategic advantage, a forced
move or general safety. Neutral role counts/geometry and actual legal capture continuations
independently check these finite cases. Four separately labelled primary-source excerpts
match python-chess's pinned revision. All 175 predecessor records remain unchanged.
The register now totals 191 (119 positives, 72 negatives), over the same 81 subjects.
Material/mobility negative arms are present; orientation and other required arms stay open,
with zero subjects fully qualified. The real quiet edges also retain both king-state payloads
with empty deltas: D3687's whole-event omission contract conflict remains an author blocker,
not an invented negative, source abstention or permission to silently filter v1.
D3691 adds 22 source-bound pawn-dynamics cases through the real local-edge operation:
ten both-colour positives for new locks, pawn harassment of knights/bishops, new
pawn-protected passers and new adjacent-file passed pairs; twelve populated negatives
for retained locks, diagonal contact instead of a lock, a passer whose pawn protector
changes, a physical pair whose display order changes, attacking a rook rather than
a minor, and bishop rather than pawn protection. Neutral rank/file/piece arithmetic
checks exact identities and gains independently of the pawn collector helpers.
Retained-property negatives still emit the separate actual passer-advance event.
Seven labelled Stockfish snippets match the fixed source revision used by D3685.
All 191 predecessor case records remain unchanged. The register totals 213 passing
cases (129 positives, 84 negatives), still 81 subjects and zero fully qualified.
Only this family's positive/negative cells become present; candidate-majority
conventions are not endorsed and orientation/other qualification debt remains.
No attack implies a forced retreat, a strategically good move or a promotion result.

D3701 adds sixteen source-bound cases: eight direct-count positives, four populated
direct-count negatives and four loose-piece omissions, all in both colours. Independent
rank/file/ray arithmetic checks the complete non-pawn target/count population, including
one-to-two and two-to-one attacker changes, unchanged contacts, friendly ray blockers,
pawn-target exclusion and pinned geometric attackers. Independent legal destination sets
show that the loose-piece cases have no legal capture of any mover-colour non-king piece.
The pinned-capturer negatives retain a real geometric attack, not an empty board or an
unavailable source. They do not claim that defender count proves an exchange outcome.
The three retained python-chess functions match their pinned primary-source bytes exactly.
All 213 predecessor records remain unchanged; 229 cases pass (137 positive/92 negative).
Direct-count positive/negative and loose-piece negative cells are present. Orientation,
counterfactual/other required arms and the complete-state omission conflict remain;
zero subjects are fully qualified and learner eligibility is unchanged. This is qualification
work under existing collectors, not a new recommendation, strategy claim or content wave.

D3710 adds sixteen independent discovered-execution cases through the completed local
operation: rook, bishop and queen discovered checks in both colours, plus both-colour
direct-check, second-blocker, retained-screen, unrelated-move and moved-slider negatives.
Legal replay and separate integer ray geometry check exact screen, slider and king identities.
These controls exposed D3711: a king at a slider ray's board-edge endpoint was absent from
the interior blocker arrays, so the execution join discarded its true before-state latency.
The join now admits that exact retained endpoint without changing the ray's interior blocker
meaning. All 249 predecessor cases remain unchanged. That checkpoint's 265 cases pass (153 positive,
112 negative); discovered execution's negative cell becomes present. Orientation and all other
required qualification, source adoption and learner eligibility obligations remain open;
zero subjects are fully qualified. This repairs the accepted executed relation, not a claim
that the move is best, forcing or strategically useful.

D3714 adds thirty-six independently checked structural king-zone cases: entry into all
four corners, corner-to-edge/interior exit, file-edge entry/exit/preservation, stationary
corner preservation and populated both-interior omissions, for both colours. Independent
square-name boundary sets and legal replay check the entire emitted edge/corner population,
including exact before/after king squares and gained/lost/preserved signs. The canonical
receipt executes 289 cases (173 positive/116 negative), retaining all 265 predecessors.
This fills the structural king-zone positive and negative cells, not the distinct broad
king-zone state projection's omission requirement. Orientation stays required and zero
subjects are fully qualified. No king safety, opposition, strategic value, learner admission,
source protocol or pack content changes.

D3717 adds thirty-six independently checked two-edge bishop-pressure cases (four positive,
fourteen negative), retaining every previous canonical case. Both colours include competing
attacked knights/bishops; unrelated replies, lost diagonals, missing/multiple/friendly screens
and excluded target/value roles reach completed legal paths without the exact retained relation.
Separate integer diagonal occupancy and legal replay check the pawn, moved bishop and unchanged
screen/target identities through the production recorded-path operation. Existing migrated case
references remain alongside the new source-bound cases. This records a pawn attack followed by
retained pressure, not forced retreat, intent or move quality. Orientation remains required,
zero whole subjects qualify, and learner eligibility and authored content are unchanged.
The canonical register now executes 307 cases (177 positive/130 negative).

2026-10-12: D3730 adds thirty-six source-bound cases for the three bounded material-target
projections. Both colours execute the complete registered batch. A loose knight establishes the
exact bishop/knight capture; capturing the original bishop establishes immediate removal and
that original identity's non-return. A defended equal-value capture and a blocked diagonal are
completed negative populations, not unavailable operations. Independent legal occupancy/capture
checks and D3720's complete-candidate oracle remain separate from the implementation.
Two additional populated boundaries retain two actual material targets and all four candidate
relations, each preserved, while correctly omitting bounded return. Thus the return negative is
not limited to an empty target population.
The restored-diagonal cases additionally record each non-return/existential/all-defences outcome.
The complete finite oracle enumerates every legal defence, requires a nonempty reply set and
rejects mate's zero replies as an all-defences or existential witness.
All 307 predecessor records remain unchanged; the current register executes 343 cases
(199 positive/144 negative), over 81 subjects and zero fully qualified. The six positive/negative
cells become present; orientation, imported-population obligations and inspector-only consumer
status remain unchanged. These finite cases do not establish whole-subject qualification,
select a useful hint, grade a move or admit a new learner consumer.

Run `make semantic-validation-bounded-check` for the finite cases and complete-batch oracle;
`make semantic-validation-cited-check` includes the new cases, and the ordinary software gate
executes the canonical register and checks its generated receipt.

D3690 widens the complete-state omission conflict to piece counts, pawn islands
and reply breadth. Actual white/black bare-king edges retain twelve role counts,
two zero island readings and one reply reading. A legal mate retains the terminal
zero-reply observation. These are not whole-event omissions. All four affected
negative arms remain required; the source-bound author handoff is
`planning/platform-alignment/semantic-state-negative-contract.md`. No frozen v1
filter, waived negative, collector mutation or consumer permission follows.

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
lookup, caller-provided source or protected owner-store bootstrap is involved. All 80 cited cases run
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
