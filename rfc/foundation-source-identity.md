# RFC: Foundation source identity repair

- **Status:** implementing — repaired23-source/five-predicate-companion contract independently
  accepted 2026-11-04. Decision: `planning/learner-modules/compiler2-independent-review-2026-11-02.md`.
  Original-document input2, selected predicate2 leaves and the closed owned aggregate2 now have
  current authoring2/objective2 bindings and bounded independent reviews. The source-companion
  and Studio/direct-probe gates pass complete normal software verification. Current
  timing/transition/default/checkpoint and genuine issuer-backed async census/witness paths are
  verified locally. Read-only36-site migration reporting is also verified after independent review and full normal gates; author decisions/content changes and broader caller migration remain open. Current source counts and test receipts live in
  `planning/foundation-source-identity/plan.md`; this status is not a whole-product completion claim.
  All28 factory outputs are now locally verified, including original clock decision and its clock-specific imported occurrence. The actual clock historical consumer/API/strict readout now also passes independent reviews and final normal gates; native and other actor/caller duties remain open. Application operations, remaining actor occurrences, semantic qualification, content migration and downstream
  discharges remain open. Former draft/return history is
  retained in the research, append-only log and changelog.
- **Bounded independently accepted companion (2026-11-05):** `profile-game-facts.md` alone
  owns D4147/D4149 claimed GAME scope, fourth derived row family and three-ref existing-card
  adoption. Both source/ABI and meaning/consumer reviews accept; bounded implementation starts.
  Parent-wide implementation/completion is not implied.
- **Author:** codex, executing the D1736 shared-wave handoff
- **Created:** 2026-08-31
- **Design refs:** `design/03-product-breadth.md` evidence architecture;
  `design/04-content-architecture.md` authored predicates; `design/05-in-run-experience.md`
  assistance ceilings; law 8 in `AGENTS.md`
- **Exploration gate:** complete in the nine source handoffs listed in §1 and re-derived by
  `design/research/foundation-capability-closure-2026-08-31.md`
- **Depends on:** implemented F1/F2, exact legal mobility and breadth/tactical collectors;
  landed convention registry, resource reader/history and per-value receipt core in
  `semantic-convention-register.md` / `semantic-convention-provenance.md`. Their separate unfinished
  instance extraction, rendered disclosure and durable attestation work is not declared complete.
  Each new definition must be implemented and receipted before its source can mint;
  complete downstream disclosure/qualification still follows its own owner contracts.
- **Supplies:** exact source payloads to `evidence-value-authority`, then execution to
  `shared-candidate-evidence-packet` and `recorded-semantic-path`, validation to
  `semantic-validation-authority`, and final consumer migration to `module-registration`
- **Planning:** `planning/foundation-source-identity/`

```tabiya-claims
none
```

The whole definition scope is the twelve-member `futureConventionClaim` set in the existing
projection plan, promoted after checking the then52-member tree and live claims. The two
king/backward definitions, pawn-island-topology and eight further source definitions now have
their actual source factories, including the locally verified §3.8c recorded pair; the remaining
clock definition is the current claim above. A reservation alone installs no member. `make register-check` checks
present heads/collisions; the historical author
harness's seed-lineage check is not a substitute for that current-tree check. New source definitions
must carry honest authority and limitations through the existing sole mint. No source becomes
learner eligible merely because its member name is reserved.

## Summary

Tabiya already computes the requested chess vocabulary, but several current payloads erase the
subject or combine meanings that later consumers need to keep separate. A file-only backward pawn,
count-only pawn-island event, blocker-count slider event or prose-only named structure can be true
and still be unusable for precise Support, Review, bots, drills or longitudinal analysis.

This RFC repairs that shared source layer once. It defines 23 versioned source projections across
eight source families and seven literal style atoms, plus five explicitly enumerated authored-
predicate companion projections required to execute the new schema references safely. It does **not** activate a learner surface,
rank evidence, name a plan, grade a move, infer intention, create a personality, or migrate every
consumer. Source identity lands first; value factories, operations, validation and consumer
selection remain separate able-to-fail stages.

## 1. Scope and anti-drop inventory

The author contract is `planning/foundation-source-identity/projection-plan.json`. Its 23 rows are
the complete source scope. The nine research handoffs are:

1. king opposition (`king-opposition-author-repair-2026-08-26.md`);
2. backward pawn (`backward-pawn-author-repair-2026-08-26.md`);
3. square denial/outpost (`square-denial-outpost-author-repair-2026-08-26.md`);
4. pawn-file groups (`pawn-file-identity-author-repair-2026-08-26.md`);
5. line identity (`line-evidence-author-repair-2026-08-26.md`);
6. file state/access (`file-activity-author-repair-2026-08-26.md`);
7. pawn-island topology (`pawn-island-identity-author-repair-2026-08-26.md`);
8. legacy/source successor closure (`legacy-reading-successor-author-repair-2026-08-26.md`); and
9. literal style atoms (`style-foundation-atoms-author-repair-2026-08-26.md`).

The following remain outside this RFC and must not be reimplemented here:

- `named_structure@2` value identity: `evidence-value-authority`;
- subject-safe avoidance successors: the D1718/D1719 successor;
- promotion race: `semantic-collectors`;
- Stockfish/Maia/Syzygy/Explorer receipts: `provider-exchange-and-execution`;
- bounded target policies: `bounded-policy-targets` and its composition RFC;
- cited theory: `theory-knowledge-pipeline`;
- variant rules/setup identity: `variants`;
- learner eligibility/forms: `module-registration`; and
- validation admission: `semantic-validation-authority`.

An external-owner row is a checked exclusion, not an omitted feature. The author contract fails if
one disappears or if one of its projection ids enters this RFC's 23-row set.

## 2. Common source contract

Every projection in this RFC has one exact subject grain:

```ts
type FoundationSourceGrain =
  | { readonly kind: "position"; readonly fen: string }
  | { readonly kind: "edge"; readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string }
  | { readonly kind: "candidate"; readonly fen: string; readonly moveUci: string }
  | { readonly kind: "frozen_prefix"; readonly runId: string; readonly eventHead: string }
  | { readonly kind: "recorded_decision"; readonly runId: string; readonly eventHead: string;
      readonly eventId: string; readonly actorClass: "learner" | "opponent" | "imported" | "coach";
      readonly decisionClass: "played" | "game" | "predicted"; readonly decisionId: string };
```

The value constructor receives a sealed source receipt for that exact grain. It may not accept a
caller-written FEN, node id, ply, color, role, square list or convention ref beside the receipt and
silently trust both. Position and edge payloads retain literal FEN/move identity; candidate
payloads derive role/destination from the sealed exact legal move; frozen-prefix payloads derive
the actor and event range from the run; recorded-decision payloads authenticate one actor/decision
against that frozen prefix. They do not contain caller-written clock values: `recorded-clocks`
resolves the event to typed readings and declared control or returns unavailable.

Every successful result is immutable and includes:

- the exact projection id/version;
- its grain receipt;
- every operand named in §3;
- the compiled convention receipt when applicable; and
- typed `available | unavailable` construction, never `undefined` for missing prerequisites.

`unavailable` reasons are closed: `missing_recorded_clock`, `missing_time_control`,
`missing_first_decision`, `wrong_rules_capability`, `history_incomplete`, or
`source_dependency_unavailable`. An unavailable source emits no evidence and cannot be converted to
false, zero or an empty array by a consumer.

### 2.1 Exact direct convention closure (D4066)

`projection-plan.json`'s `rows[].conventions` is the exact **direct** convention set for each
of the23 source routes. Reading@3 must be checked against the actual current closure; it does
not inherit the already-resolved reading@2 closure automatically. No catalogue token, inherited
witness or unused alternative may add a contradictory convention. Actual sealed-input conventions
still enter the minted value transitively and are never removed by direct-closure replacement.

Extend the existing `DECLARED_CONVENTION_REPLACEMENTS` mechanism, not a new registry. These are
the only different-base predecessor replacements authorized by this RFC:

| Final route | inherited predecessor convention | direct replacement | exact installed source |
|---|---|---|---|
| rules.structural.event.king_opposition@2 | king-opposition-blocker-blind@1 | king-opposition-unobstructed@1 | rules.structural.reading.king_opposition@3 |
| rules.structural.event.backward_pawn@2 | backward-pawn-legacy@1 | backward-pawn@1 | rules.structural.reading.backward_pawn@3 |
| rules.structural.predicate.king_opposition@2 | king-opposition-blocker-blind@1 | king-opposition-unobstructed@1 | rules.structural.reading.king_opposition@3 |
| rules.structural.predicate.backward_pawn@2 | backward-pawn-legacy@1 | backward-pawn@1 | rules.structural.reading.backward_pawn@3 |
| rules.structural.predicate.outpost@2 | maximal_pawn_reach@1 | outpost-candidate@1 | derived.structural.reading.outpost_candidate@1 |

Both refs must be registered; the from-ref must be a witnessed convention of that route's actual
immediate predecessor. The to-ref declaration uses position_rules authority naming its actual implementation helper;
king opposition names foundation-position-sources.ts#readUnobstructedOpposition, backward pawn
names foundation-position-sources.ts#readBackwardPawns, and outpost names the actual installed
future-file candidate helper when that source lands. The exact installed/nonretired source
reading must match the table, and the final route declares that exact source dependency and
replacement meaning in its catalogue. A new meaning cannot use the migration-only landed_contract
authority or a fabricated future snapshot. New source disclosures use reviewed_text. Arbitrary/transitive source paths, reservations and fake future witnesses
cannot satisfy this check. Event factories consume exactly two genuine same-family source snapshots
(before/after in that order); leaf predicates consume their one genuine source snapshot. The mint
checks those actual sealed source values and their exact receipts; metadata-only source claims,
wrong/old-source substitution and missing/extra/swapped inputs fail. Actual input conventions are
never erased by direct replacement.

This permits immutable definitions to land with their actual position-rule implementation authority;
future event/predicate use does not append new authority witnesses or change a definition in place.
Duplicate/conflicting pairs, missing predecessors, inactive/unknown final/source routes and
unregistered refs refuse. Same-base grade replacement retains its existing next-version rule.
A different-base pair outside this exact five-route/source set refuses. Until its source definition
and actual factory exist, a route is unavailable, not grounded by a member reservation.

Permanent controls compare the actual derived table and minted value receipts for every final
source/predicate route against its declared direct refs plus its actual input refs. They retain
current grade behavior, original@1/@2 source receipts, unrelated conventions and derived-input
multiplicity. Removing a replacement, swapping its target, naming another successor or injecting
a predecessor value must fail. Fixed direct refs do not depend on the unfinished general instance
extractor work in the provenance RFC.

## 3. Exact projection image

The checked JSON plan is normative for ids, versions, family, grain, typed source dependencies,
convention set, execution owner, context requirement and new/successor state. A dependency is a
typed projection or RFC prerequisite; a convention is only an `id@version` from the shared
semantic register. Empty dependency or convention sets are explicit roots, never omitted fields.
This section is normative for payload operands and predicate boundaries.

### 3.0 Reading cardinality and empty authority (D4071)

The following are single sealed whole-position values, not one F1 value per positive item:

| Projection | exact available payload cardinality/empty meaning | fixed sealed factory input (also literal derivation member for derived projections) |
|---|---|---|
| derived.structural.reading.pawn_file_group@1 | one complete snapshot with canonical fen and all nonempty color/file groups[]; zero pawns yields groups:[] | rules.structural.reading.pawn_connectivity@1 |
| derived.activity.reading.file_state@1 | one complete snapshot with canonical fen and exactly eight files, each retaining both colors' pawn sets and its literal state; zero pawns yields eight open files | rules.structural.reading.pawn_connectivity@1 |
| rules.structural.reading.king_opposition@3 | one snapshot with fen, both color-identified kings, and opposition:null or the sole holder/form reading | rules.mobility.reading.legal_moves@1 |
| rules.structural.reading.backward_pawn@3 | one snapshot with fen, complete pawnDomain and qualifying pawns[] (possibly empty) | rules.mobility.reading.legal_moves@1 |
| derived.square.reading.future_file_challenge@1 | one snapshot with fen, complete root-pawn domain and all (pawn,target,pushes) challenge rows (possibly empty) | rules.mobility.reading.legal_moves@1 |
| derived.square.reading.capture_migration_reach@1 | one snapshot with fen, complete root-pawn domain and all (pawn,target,captures,pushes) hypothetical reach rows (possibly empty) | rules.mobility.reading.legal_moves@1 |
| derived.structural.reading.outpost_candidate@1 | one snapshot with fen, basis:future_file and complete candidates[] for both colors/all64 squares (possibly empty) | rules.square.reading.control@1 plus derived.square.reading.future_file_challenge@1 |
| derived.structural.reading.occupied_outpost@1 | one snapshot with fen, basis:future_file and occupied[] with exact candidate/occupant (possibly empty) | derived.structural.reading.outpost_candidate@1 |
| rules.structural.reading.fianchetto_setup@1 | one complete snapshot with canonical fen and every exact reached configuration in setups[]; no matching configuration yields setups:[] | validated canonicalizable root FEN; no source projection dependency |
| rules.structural.reading.fianchetto_knight_screen@1 | one complete snapshot with canonical fen and every matching setup plus exact knight in screens[]; no matching screen yields screens:[] | rules.structural.reading.fianchetto_setup@1 |

The two fianchetto rows above are the bounded cardinality clarification independently accepted
in §3.8b; they add no source identities or consumer eligibility.

King/backward/challenge constructors take the exact sealed legal-position source, read its canonical FEN and
recompute all domain members/results themselves. These roots are pure computed rule readings;
the derived challenge snapshots declare the one literal legal-position input above. The candidate
constructor requires both listed whole-position inputs and identical canonical FENs; the occupied
constructor derives occupants from the exact FEN retained by its candidate input. No caller-written
empty list/domain/FEN beside those sources can supply an alternate authority.

The group/file constructors consume their genuine sealed connectivity value and derive their
canonical FEN and complete two-color/eight-file domain from it. No caller-written group array,
empty list, file state or alternate FEN is admitted. Groups contain every pawn in that color/file,
ordered front-to-rear from that color's perspective; adjacent occupied files and the containing
island's exact file list identify the group's connections. File state includes all eight files.
Group/file event constructors require genuine complete before/after snapshots, including empty
groups, plus a move whose actual legal result matches the after snapshot.

For challenge/outpost sources, the complete domain is every pawn on the input board, with
color/square identity, and all64 target squares by definition. Rows retain the source pawn identity. Factories evaluate that entire domain;
zero pawns or zero matching rows is an available sealed empty value. It is never reconstructed
from the lack of per-positive value emissions. Invalid/wrong-capability input is unavailable,
not a successful empty snapshot. Active items still retain every operand specified below.
Predicates/event constructors consume these snapshots even for false/absent→absent outcomes.
All fixed members and source dependencies are explicit in the plan; no population reduction or
new source id is needed for these eight one-value snapshots.

### 3.1 Unobstructed king opposition (reading v3, event v2)

**Current identity boundary (D4067):** reading@2 already belongs to the detailed original
blocker-blind observation used by Inspector. This successor is reading@3; event@2 remains
its separate next identity. The matching backward-pawn reading@2 is also occupied and becomes
reading@3 below. All23 proposed exact refs must be absent from both the current catalogue and
sole route registry before implementation. Existing values/factories keep their meanings.

`rules.structural.reading.king_opposition@3` retains `color`, both king squares, `sideToMove`,
`form` (`direct | distant_three | distant_five`), ordered `betweenSquares`, and
`betweenSquaresEmpty: true`. Kings must align orthogonally, the gap must match the form, every
between square must be empty, and the opponent of `color` must move.

`rules.structural.event.king_opposition@2` retains before/after readings and exact edge identity.
Its sole subject is the stable pair of color-identified kings, not their squares, current holder
color or form. There is at most one active reading inside the sealed snapshot for that pair per position
and at most one event per edge. Holder/form/square changes belong inside the before/after values. Its sign is
`gained | lost | membership_changed`. Absent→absent and equal present→present emit
nothing; absent→present is gained; present→absent is lost; unequal present→present is one
`membership_changed` event. Neither projection claims endgame, importance, force, win/draw status
or best play. Convention: `king-opposition-unobstructed@1`.
A feasible present→present fixture is `r7/8/8/8/8/4k3/8/4K3 b - - 0 1`, a8a7:
the unchanged unobstructed e1/e3 pair changes holder White→Black with the turn, yielding exactly
one membership_changed event. Joining by holder color and emitting two events fails this contract.
Equal present→present is a total algebra branch only, unreachable for a real legal opposition
edge because holder/sideToMove flips each ply. Test that algebra separately; never forge a
successful legal-edge source to populate it. Genuine source fixtures cover absent/present/changed.
Original reading@1/@2 and event@1 keep their current meanings. They cannot satisfy a
consumer requiring the new reading@3 or event@2.

### 3.2 Backward pawn (reading v3, event v2)

`rules.structural.reading.backward_pawn@3` retains one row per qualifying pawn inside its
complete snapshot (none for a non-qualifying pawn). Each qualifying row retains `color`, `pawn`,
`stop`, exact `controllers`, exact `supportPawns`, exact `aheadAdjacentPawns`, stop occupancy
(`empty | own | enemy` plus piece when occupied), `immediatePseudoCapture`, and
`halfOpenForColor`. It implements only the registered narrow convention: no same/not-ahead adjacent
support plus enemy pseudo-pawn control of the next square.
`immediatePseudoCapture` retains the exact enemy-pawn targets currently pseudo-attacked by
this pawn, not legal captures or attacks on arbitrary pieces. `halfOpenForColor` explicitly
retains the **opponent** color and whether that color has no pawn on the subject's file; the
subject's own pawn is present there. This is the half-open perspective measured by D1723,
not an implicit own-color flag. Both operands are informational, never eligibility filters.

`rules.structural.event.backward_pawn@2` retains exact before/after rows, including pawn move or
removal; `{color,file}` is never the identity. Unchanged `(color,pawn)` subjects match first. The
edge's exact pawn mover then matches its from-square row to its to-square row; all remaining before
rows are lost and remaining after rows are gained. A matched unequal row emits one
`membership_changed`; a matched equal row emits nothing. This makes absent/present and
truth-preserving subject changes total without pretending FEN contains persistent piece ids.
`derived.pawn.consequence.backward_pawn_legal_advance@1`
exists only for an empty stop that is the exact submitted legal pawn move. It retains the complete
legal opponent pawn-capture replies after that hypothetical push. Pseudo-control alone cannot
populate the reply set. Convention: `backward-pawn@1` plus `legal-exchange@1` for the consequence.

#### 3.2a Complete post-advance capture authority (independently accepted 2026-11-04)

The consequence's closed factory inputs are `source` (one genuine complete
`rules.structural.reading.backward_pawn@3` snapshot), `moveUci`, and `landing` (one genuine
`rules.exchange.reading.landing_captures@1` value). Its literal ordered derivation member is
`[backward_pawn@3, landing_captures@1]`; the complete latter source replaces the capture-only
`rules.exchange.predicate.legal_exchange@1` dependency. That predicate returns no value for a
quiet move and cannot establish a complete population by returning an empty per-move result.
The direct conventions remain `backward-pawn@1` and `legal-exchange@1`, with all actual input
conventions retained. No new source id, convention or caller-written reply population is added.

The factory authenticates the actual original invocations of both sealed inputs, including the
landing source's original canonical FEN/landing-square authority; a resealed same-symbol wrapper
or copied receipt cannot substitute for that invocation. Apply the exact submitted legal move
to the source's canonical before FEN. Its genuine resulting FEN must equal `landing.payload.fen`,
and its actual destination must equal `landing.payload.landingSquare`. These source/edge checks
precede an empty result. Missing, extra, swapped, old, copied, crossed-FEN or crossed-square inputs
refuse. Existing landing-capture arithmetic/meaning is unchanged; original invocation bookkeeping
may be retained at its sole factory to establish this boundary.

An available consequence exists only for the moving side's exact qualifying source pawn making
its single forward quiet move to that row's empty stop. A valid move that does not meet those
conditions has an available empty consequence population; unavailable source authority is never
converted to that absence. Each emitted consequence retains the exact original pawn row, move,
before/after FENs, advanced pawn identity and the complete original landing-capture source. Its
reply list contains **every legal capture by an opposing pawn of that exact advanced pawn**:
filter the complete source by opposing pawn capturer and the advanced pawn's exact color/role/
victim square. Retain each original `LegalExchangeResult`, including its capture UCI, identities,
branches, chosen line, stop decisions and convention units; do not filter by positive exchange,
invent a separate per-reply F1 value or include captures elsewhere/non-pawn capturers. Zero such
replies is represented by an empty list backed by that same complete sealed landing population,
including when a pseudo-controlling pawn is pinned. This is a legal reply/exchange fact, never a
claim that the advance is safe, strong, forced or a recommendation.

Controls must use genuine source factories and legal edges for both colors, multiple opposing
pawn replies, pseudo-controlled but legally empty replies, unrelated/non-pawn capture exclusion,
nonqualifying/occupied-stop absence, original input order/multiplicity, source/target mismatch and
resealed-source refusal. Preserve the existing capture-only predicate and complete landing-source
behavior. Independent acceptance: Codex reviewed the separate author’s concrete source/edge/empty-population contract on 2026-11-04. The complete landing reading supplies the missing negative authority; the capture-only predicate remains unchanged.

### 3.3 Exact pawn-file groups

`derived.structural.reading.pawn_file_group@1` derives from sealed
`rules.structural.reading.pawn_connectivity@1`. One row retains `color`, `file`, all pawn squares,
adjacent occupied files, island identity, color-relative front/rear ordering, and literal
`isolated`/`doubled` booleans. Group size is unbounded; a pair-shaped payload fails.

`derived.structural.event.pawn_file_group@1` retains before/after groups and signs
`gained | lost | membership_changed`. A truth-preserving group membership change emits
`membership_changed`; an unchanged group emits nothing. This source says neither weak nor bad.

### 3.4 Line blocker membership v2

`rules.transition.event.slider_ray@2` joins by exact original root piece plus one signed board
direction (df/dr), never by endpoint alone. Exact legal physical relocations map the original
piece through ordinary moves, both castling pieces and promotion; capture removes it, including
en passant's actual captured square. A promoted root pawn may gain its resulting slider rays.
The root identity retains original color/role/square; each before/after ray independently retains
current slider color/role/square, board-edge endpoint, ordered strict-interior squares and ordered
occupied blockers (square and actual piece). A non-slider or removed root piece has a null ray;
an existing ray with no blockers has an empty array, not a missing value. At most one event exists
per root-piece/direction. A role-incompatible direction or immediately offboard first step has no
ray; a one-step on-board ray has its adjacent edge endpoint and empty strict interior/blockers.
Missing→present is gained, present→missing lost; both missing and equal
blocker arrays emit nothing; unequal blocker arrays emit membership_changed, including equal
counts with changed members. Moving the same slider preserves its root/direction join even when
origin/endpoint change; a move with unchanged blocker arrays emits no blocker-change claim.
The board-edge endpoint is not a target. Pin/skewer/X-ray, latent discovery, played discovery,
target-capture clearance and quiet-square clearance remain distinct existing projections.
Convention: `line-blocker-membership@1`.

### 3.5 File state and access

`derived.activity.reading.file_state@1` derives from the exact pawn-file authority and retains
`file`, both colors' pawn sets and state `open | half_open_white | half_open_black | closed`.
Open is not half-open for either color.

`derived.activity.event.file_state@1` emits only when a file's four-way state enum changes.
Pawn-member or rank-only changes with the same enum emit nothing; their exact membership remains
available from the snapshots and pawn-file group source. Each event retains both complete file
rows and the exact move/capture identity, including en passant's captured square and promotion
when present. A genuine available empty event population is never a missing snapshot. `derived.activity.event.file_access_revealed@1` retains an unchanged rook
or queen whose file becomes open or color-relative half-open. It is mutually exclusive with the
existing moved-heavy `derived.activity.event.open_file_occupancy@1` for the same physical
piece and edge/cause. Do not suppress a stationary sibling because another piece moved on that
edge. Existing moved-heavy behavior compares its source file before with its destination file
after, including castling's rook; it does not require the destination was already eligible before.

The unchanged-piece access whitelist is exact: after=open and before is not open; or after is
that piece color's half-open state and before was neither open nor that same half-open state.
Thus own-half-open→open qualifies as a new open state, while open→own-half-open does not claim
new access. The piece must have the same color/role/square in both positions and must not be a
physically relocated piece of that edge. Retain its exact identity, both file states and original
file-state cause as the sole literal source. These are file-class transitions, not unblocked legal
rook/queen paths. Neither projection says active, improved, controls or should.

### 3.6 Pawn-island topology v2

`rules.structural.event.pawn_islands@2` retains, independently per color, exact before/after island
file partitions and member pawns. Signs are `count_gained | count_lost | topology_changed`.
Emission compares the exact ordered file partitions, not member-square or pawn-count changes
inside an unchanged partition. Equal-count changed partitions emit `topology_changed`; identical
file partitions emit nothing, including rank-only motion or capture of one pawn from a still
populated file. Every emitted before/after partition still retains its exact member pawns. A capture may therefore emit only an opponent-color event. Convention:
`pawn-island-topology@1`.

### 3.7 Square challenge and outpost identity

The following are separate projections:

- `derived.square.reading.future_file_challenge@1`: root pawn, current square, affected square and
  same-file future-push basis;
- `derived.square.reading.capture_migration_reach@1`: root pawn, current square, affected square and
  hypothetical capture/file-migration basis;
- `derived.structural.reading.outpost_candidate@1`: color, square, relative rank, exact support
  pawns and exact challenge basis; and
- `derived.structural.reading.occupied_outpost@1`: the candidate plus exact occupying piece/role.

The definitions are fixed, not an unspecified basis enum. For a root enemy pawn p and affected
square q, the standing rank is q's rank minus that pawn color's forward step. Same-file challenge
requires an adjacent file and a nonnegative number of forward pushes to that standing rank;
zero pushes includes current pawn control. It ignores blockers, turn, double-push timing and
king safety. Capture-migration reach requires at least one hypothetical diagonal capture to a
valid adjacent file and enough forward ranks for those captures, with optional remaining pushes;
it ignores available victims and legal paths. Retain the root pawn, affected square and exact
push/capture counts. Enumerate the complete root-pawn domain before declaring no challengers;
an empty positive-event list alone is not a complete population proof.

`outpost-candidate@1` chooses **future_file** as its one fixed challenge basis. Emit a candidate
for color/square iff its color-relative rank is4..6 inclusive, at least one exact own pawn
pseudo-controls it and no enemy pawn has the above same-file challenge (including zero pushes).
Retain all support pawn identities, the empty complete challenger population and that literal
basis. Occupancy is irrelevant to candidacy. Do not require hypothetical capture migration to be
absent; it remains a separately disclosed supporting source. Candidate construction uses the
sealed same-position square-control source and complete future-file source population; only
those actual sources enter its ancestry. Remove capture_migration_reach from this candidate's
source dependencies. The occupied projection additionally requires a same-color bishop, knight,
rook or queen on that exact candidate square and retains the occupant. It cannot infer arrival,
exchange survival, value or permanence. Existing maximal-reach outpost semantics stay unchanged.

Current legal/pseudo control continues to use the existing square-control authority.
`maximal_pawn_reach@1` remains the disclosed union and is not silently redefined. Candidate is not
occupation; overlap is not prevention, force, permanence, value or purpose. Conventions:
`future-file-challenge@1`, `capture-migration-reach@1`, and `outpost-candidate@1`.

### 3.8 Literal style atoms

These are neutral facts shared by Review, bots, drills and longitudinal analysis. They are not
style conclusions.

- `rules.structural.reading.fianchetto_setup@1`: color, bishop square, advanced b/g pawn square and
  wing for the exact b2/g2/b7/g7 configuration.
- `rules.structural.reading.fianchetto_knight_screen@1`: the setup plus the same-color knight on the
  bishop's first inward diagonal square, retaining all three pieces.
- `rules.mobility.reading.candidate_role@1`: sealed legal candidate plus source piece role; all
  promotion roles remain representable.
- `rules.mobility.reading.pawn_extended_center_destination@1`: exact pawn candidate whose
  destination is one of c4/d4/e4/f4/c5/d5/e5/f5.
- `rules.mobility.reading.early_queen_move@1`: exact queen candidate with source ply `< 16`; the
  15/16 boundary is part of `early-queen-ply@1`.
- `run.record.castling_eligibility@1`: learner color and exact castling sides retained at that
  color's first decision. It is neither current legality nor castling advice.
- `run.record.clock_decision@1`: actor, decision, phase, previous/current clock, base, increment and
  source event, all resolved through the `recorded_decision` receipt and `recorded-clocks` contract.
  Spend-share arithmetic is downstream. Missing clock/control, non-positive available time or
  current greater than available yields typed unavailable.

Conventions: `fianchetto-configuration@1`, `extended-center-destination@1`,
`early-queen-ply@1`, `castling-first-decision@1`, and `clock-spend-input@1`.

The seven source facts remain reusable and actor-neutral. Every plan row in `style_atoms` therefore
also declares `contextRequirement: "actor_decision"`. Before Review, bots, drills or longitudinal
storage may consume one, `recorded-semantic-path` seals a `ContextualFoundationOccurrence` carrying
`runId`, `eventHead`, `eventId`, `actorClass`, `decisionClass`, `decisionId`, the source projection
ref and source-receipt digest. An imported/opponent/coach occurrence cannot be re-labelled learner;
a bare source fact cannot satisfy an occurrence consumer. This envelope is operation context, not a
24th chess projection, and it creates no style conclusion.

### 3.8a Complete candidate-role domain (independently accepted 2026-11-04)

`rules.mobility.reading.candidate_role@1` takes exactly `position` (one genuine original
`rules.mobility.reading.legal_moves@1` value) and `moveUci`. Its sole literal source dependency
and sole ordered actual mint input are `[rules.mobility.reading.legal_moves@1]`, replacing the
plan's piece_destinations@1 dependency. It retains its rules-plane producer: declare `dependsOn`
and the genuine original input receipt, not `projection.derivation`, which the manifest reserves
for derived-plane projections. This does not change its source meaning or plane.
The replaced piece_destinations source intentionally covers only bishops/knights/rooks/queens and destination squares;
it cannot authenticate the promised pawn/king domain or distinguish promotion candidates.
No new source id, convention or second move enumeration is introduced.

Authenticate the complete legal-map factory's actual original invocation, not only its generic
seal, factory-name string or copied receipt. Select exactly one original move from its complete
piece/move population by literal canonical UCI membership. Unknown moves and alternate UCI
spellings that are not that exact member refuse; existing ingress conversion remains separate.
The retained original piece identity and source role must agree with that member. Source role
remains pawn for promotion, with queen/rook/bishop/knight promotion roles represented separately
by their distinct exact UCI candidates. Include ordinary pawn/king moves and castling; retain
the castle's actual king landing square from the member's semantic destination, independently
of canonical UCI's rook-origin target. Retain the exact source FEN/turn, move identity and
original source receipt/input conventions. Callers cannot supply a role, promotion, destination,
candidate list or alternate payload beside that source.

Controls require genuine pawn/king/minor/heavy candidates, all four promotion identities,
both-color ordinary and castling destinations, source/role consistency, missing/extra/unknown
or aliased moves, copied/resealed source refusal and literal one-source dependency/receipt. This is
an actor-neutral candidate fact; it supplies no recorded path ply, learner identity or decision
occurrence. The existing actor_decision context requirement and early-queen source-ply obligation
remain separate. Independent acceptance: Codex inspected the separate author’s repaired source/domain/receipt contract on 2026-11-04, including the rules-plane dependsOn distinction. No candidate-role implementation is asserted here.

### 3.8b Complete fianchetto snapshots and exact centre candidates (independently accepted 2026-11-04)

The exact configuration table is the existing R12 source definition in
tools/r12-player-style-harness/measure.test.ts, not any advanced pawn on a b/g file:

| color | wing | bishop | pawn | inward knight screen |
|---|---|---|---|---|
| white | queenside | b2 | b3 | c3 |
| white | kingside | g2 | g3 | f3 |
| black | queenside | b7 | b6 | c6 |
| black | kingside | g7 | g6 | f6 |

setup@1 is one complete sealed position snapshot with canonical fen and setups[]. Its closed
factory takes only a validated root FEN and recomputes all four configurations; sourceDependencies
remains the explicit empty set. Each matching row retains color, wing and the exact same-color
bishop/pawn square and role identities. No match is an available setups:[] snapshot, never a
missing source or proof inferred from absent positive F1 emissions. This asserts configuration,
not original-piece history, intent, quality, discovered attack or a plan.

screen@1 takes only one genuine original complete setup@1 invocation, retains its canonical FEN
and recomputes the same-color knight occupant at each corresponding table square. It returns one
complete sealed {fen,screens[]} snapshot, each row retaining the exact original setup plus knight
identity. Empty setup/screen populations remain available source values. Refuse caller FEN,
setup arrays, knight lists and resealed/copied same-symbol wrappers before an empty return.
It stays a rules-plane source: its exact dependsOn and ordered actual input receipt contain only
setup@1, without a projection.derivation. The actual candidate collector retains and passes that
same genuine setup instance, rather than recomputing an alternate source beside it.

pawn_extended_center_destination@1 takes only one genuine original candidate_role@1 invocation.
Return an available singleton exactly when its source role is pawn and its actual destination is
one of c4,d4,e4,f4,c5,d5,e5,f5; otherwise return an available empty population after authenticating
the source. Use the original pawn role, not its promotion target role. Retain the whole exact
candidate and its original source receipt/conventions; callers cannot provide a replacement role,
square, move or output list. This rules-plane projection declares only candidate_role@1 dependsOn
and actual ordered mint input, without projection.derivation. The existing extended-centre
convention identifies a fixed destination set, not control, space, quality or style.

Controls cover all four configurations and wrong-square/color/role neighbors, multiple/empty
setups, exact same-position screens, genuine source-object sharing, copied/resealed source refusal
including empty inputs, both pawn colors, all eight centre destinations and neighboring negatives,
non-pawn candidates and promotion source-role preservation. These remain actor-neutral position/
candidate facts; the existing actor_decision occurrence requirement is unchanged. The two complete
snapshot cardinality entries and plan fields add no new projection/convention. Independent
acceptance: Codex re-read the separate author’s exact clause, plan and R12 CONFIGS on
2026-11-04; the four tuples, complete empty authority, actual setup input and rules-plane
receipt semantics are buildable without changing the existing source scope.

### 3.8c Original recorded decision and first-decision inputs (independently accepted 2026-11-04)

D4076 and D4103 resolve missing original input authority, not new chess projection scope.
Independent source/ABI and consumer/meaning reviews accept this repaired clause. Source review
required the explicit private authority/mint recipe and application-owned all-branch legality
check; both are included below. No factory, actor-occurrence consumer or source-inventory closure
is asserted by acceptance. The original §3.8 occurrence requirement remains unchanged.

#### Genuine recorded input

Add one finite package-internal source owner at the existing RunService/storage boundary. It
resolves {runId,branchId,throughNodeId} under the authenticated current principal's real run-read
permission and actual AbortSignal. Reuse RecordedReviewBoundary: full original event replay,
branch/legal graph and import-record checks precede the existing root-to-endpoint narrowing.
The boundary explicitly checks legal edges on the selected original branch and imported mainline;
it does not alone check every unrelated branch. The finite application source owner must additionally
validate every original stored branch's complete legal chain before narrowing, as the current
guided/Inspector owners do. Capture the original run image/event head, stored start.side, immutable
original path members,
unique creation events and exact selected endpoint. The source owner rechecks storage/import,
account/read grant and signal before and after capture and every source read/publication.

A frozen-prefix token and exact decision member token belong to that original issuer/context.
Runtime factories read those private owned tokens, never a raw run, copied boundary image, event
list, caller ply/color/role/rights, JSON receipt or permissive callback. Source readers are package
internal, absent from public barrels/wire; only the actual application source owner issues them.
The low-level RecordedReviewBoundary by itself is not an access grant. Do not borrow Full Inspector
or move-grade-specific permission to read these neutral sources. This source-only operation adds
no learner-facing API or automatic module/bot/style use. Any later consumer still needs complete
operation preflight, its own assistance ceiling and the separately required actor/decision envelope.

A selected decision is one exact node in the granted root-through-endpoint path, with the
zero-based index of that original node in the full rooted branch path. Include an endpoint whose
next choice is not yet recorded: this is an offered position, not evidence that anyone selected
any candidate. Never restart the index at a fork, crop, FEN repetition or request endpoint. Never
infer it from FEN fullmove counters, event-array ordinal or caller Node.ply. Creation-event identity
remains retained source context, not a fabricated move/learner action.

#### Exact private authority and mint receipt

The private prefix reader returns the immutable source-owned authority image:

    {operation:"foundation.recorded_prefix@1",runId,eventHead:{seq,digest},branchId,
     throughNodeId,learnerSide,path:[{nodeId,sourcePly,fen,
       creation:{ordinal,seq,type}}]}

path is the complete ordered granted root-through-endpoint population; each sourcePly is its
original rooted branch index. creation is the exact original unique creation event's zero-based
ordinal, stored seq and literal run.started/move.committed type. The original full eventHead
identifies the validated full event stream, not a rewritten cropped stream. The reader also retains
its original boundary/permission context privately; serialized equality is never issuer membership.
The decision reader returns {operation:"foundation.recorded_decision@1",prefix:<that original
prefix authority image>,selected:{nodeId,sourcePly,fen,creation:<same creation identity>}}, selecting
exactly one original granted path member. No caller constructs or supplies either authority image.

Add explicit authorityShape recognition for these owned tokens, reading the above immutable actual
images rather than enumerating the opaque token as {}. early_queen_move inputDigest is exactly

    evidenceDigest({decision:decisionAuthority,candidate:{sealed:candidateReceipt.payloadDigest}})

and its sole ordered sourceDigests vector is [candidateReceipt.payloadDigest], with the original
candidate value retained as the sole actual projection input. castling_eligibility inputDigest is
exactly evidenceDigest({prefix:prefixAuthority}) and sourceDigests is [], since this source has no
projection dependency. Neither private context is a DeclaredEvidence value; there is no invented
context source-receipt or second digest appended to either sourceDigests vector. Existing convention
receipts cover the separately registered definition. Factory/route admission and invocation readers
check original private issuer/context and genuine candidate invocation before and after mint; digest
or authority-image equality cannot admit a copied, foreign or stale token. Retain these exact input
images in negative receipt tests, including equal-looking nodes and permission changes.

#### Early queen source

rules.mobility.reading.early_queen_move@1 takes exactly {decision,candidate}. decision is the
original private selected decision above; candidate is a genuine original candidate_role@1 factory
invocation. Retain its sole literal projection dependency candidate_role@1 and exact ordered value
input. Its source FEN/turn must equal the decision's original canonical position. The legal candidate
may differ from the subsequently recorded move: it describes an alternative, not the actual choice.
Do not accept copied/resealed candidate values or caller role/ply/destination operands.

Emit one immutable result iff original source role is queen and original rooted decision index<16;
otherwise return genuine available empty. Payload retains the original candidate role/move/FEN,
exact run/branch/before-node address and zero-based sourcePly. Missing, stale, foreign, off-prefix or
aborted context refuses rather than becoming no match. Promotion-to-queen has source role pawn and
is not an early queen move. This is neither move quality nor a learner tendency. Any later
convention disclosure or caption must identify the rooted represented-line index; it cannot infer
early play in an unseen full game from a custom/truncated root. Land the already
claimed early_queen_ply_v1 definition with the actual factory, retaining boundary15/16.

#### Castling baseline source

run.record.castling_eligibility@1 takes exactly {prefix}, an original owned frozen-prefix token.
Color is the original stored run.start.side, not caller perspective or node actor. Select the first
node in the granted rooted path whose position.turn equals that stored color, including a pending
endpoint decision. This is the first represented decision in THIS stored run/prefix, not a claim
about unseen game history before a custom/truncated root. An inherited branch retains its root and
earlier first decision; a later rights loss cannot replace that baseline.

Read castlingRights at that exact original position. Retain the two literal side booleans, including
both false as one genuine available baseline; do not substitute legal castles (check/blockers do
not delete rights). Respect Chess960 rook-origin rights through the existing arithmetic. Payload
retains run/branch/granted-endpoint and firstDecisionNodeId, original rooted index, stored color and
exact rights. A prefix not yet containing that color's decision (e.g. Black at a White-only root)
is typed source-unavailable, not a fabricated all-false baseline. Malformed/stale/foreign/import or
access failures refuse independently. Land the already claimed castling_first_decision_v1 source
definition with its actual factory. No castling advice, historical action or actor inference follows.

#### Required controls and receipts

Use actual RunService/SQLite/current-account grant boundaries and real factory invocations.
Early queen: rooted15/16 disagreeing FEN counters; repeated identical FEN nodes at different indices;
root-only/custom/truncated/branch-inherited paths; both turns; genuine alternate queen candidate;
promotion-pawn source; same-FEN genuine candidate join versus copied/resealed candidate refusal;
foreign/copy/off-prefix/stale decision and grant/account/import/abort changes. Do not manufacture
actor context to get positives.

Castling: stored White/Black, custom Black-to-move root, Black-not-yet-decision absence, pending
first endpoint, no rights, retained blocked/checked rights, later rights loss, inherited fork,
Chess960, missing import/current grant. Distinguish available all-false from typed unavailable.
Both factories need exact source-input/dependency/immutable payload/negative cardinality receipts,
source-owned convention definitions/history, normal types/software/content/governance and separate
implementation review. Whole28-factory completion, semantic qualification, occurrence consumers,
content migration and release are not discharged by accepting this clarification.

### 3.8d Original recorded occurrences (D4140 — independently accepted 2026-11-05)

This companion specifies the first real recorded-context operation for the six non-clock atoms.
It adds no chess projection, source kind, schema, event, persistence table, automatic consumer or
style claim. Existing clock occurrence semantics remain unchanged. Both independent source/ABI
and meaning/consumer reviews accept this repaired bounded clause; actual implementation and
remaining actor/consumer discharges are still required.

#### Scope and non-claims

The operation admits an actual committed decision in an authenticated stored original prefix,
not a pending/offered endpoint, prediction or hypothetical search node. The six neutral factories
remain available on their original wider domains. Their returned values alone never establish
that a candidate was selected or a structure was reached. Pending/offered/predicted and unsupported
actor contexts remain explicit context-unavailable and owed before those consumers can use them;
this bounded operation cannot discharge every actor/decision consumer in §3.8.

Reuse RecordedFoundationSourceOwner and the current private prefix/decision authority. Resolve
one original BEFORE path member plus its unique next member inside that exact granted prefix.
Check its actual legal recordedEdgePayload, exact outgoing move.committed event/sequence and
original parent/child/branch inheritance. Root may be BEFORE only with a real next committed
member. No source can borrow a later sibling, repeated FEN, numeric node.ply or caller event/actor.
EventId is that outgoing event's existing runId/event/seq identity; decisionId identifies its
BEFORE decision using that same event. Preserve the complete eventHead and exact original full
source-receipt digest. Every capture and retained read rechecks existing run/account/grant/import/
all-branch legality/AbortSignal and the actual actor authority used, before and after publication.

#### Closed operation and runtime ABI

The callable internal application operation is
`RecordedFoundationSourceOwner.contextualize(value: DeclaredEvidence<unknown>, selection:
RecordedStyleSelection): RecordedStyleOccurrenceResult`.
The owner has already issued the selected prefix/decision using its existing authenticated
resolve/decision operations. The exact closed selection is one of:

~~~ts
type RecordedStyleSelection =
  | { readonly kind: "candidate"; readonly decision: FoundationRecordedDecision }
  | { readonly kind: "position"; readonly decision: FoundationRecordedDecision;
      readonly positionPhase: "before" | "after" }
  | { readonly kind: "baseline"; readonly prefix: FoundationRecordedPrefix };
type RecordedStyleUnavailableReason =
  | "pending_decision" | "first_decision_pending"
  | "historical_actor_unproved" | "unsupported_actor_context";
type RecordedStyleOccurrenceResult =
  | { readonly kind: "available"; readonly occurrence: ContextualFoundationOccurrence }
  | { readonly kind: "unavailable"; readonly reason: RecordedStyleUnavailableReason };
~~~

value is one genuine DeclaredEvidence invocation of exactly the six literal refs in the table;
unknown/older refs, extra selection fields, copied/foreign owner tokens and crossed selection kind
refuse. Source ref, candidate UCI, chosen flag, actor, event or matched fields are never caller
selectors. Candidate selection supports only candidate_role1/centre1/early_queen1; position only
setup1/screen1; baseline only castling1. PositionPhase is an explicit closed original-member
selector, not an asserted FEN or a new source. All immutable results are bounded to this operation.

Add one package-internal `FoundationRecordedOccurrenceContext` token, issued only by this actual
application owner after its source/actor checks. Its private reader rechecks that owner; it accepts
no raw actor/event object or caller validation callback. The sole finite runtime sealer is
`contextualizeRecordedStyleOccurrence(context, value): ContextualFoundationOccurrence`; the
read-only `readRecordedStyleOccurrence(occurrence)` returns the following original value/image.
Reuse the existing private occurrence store with explicit clock/style discrimination; the current
clock-specific reader/constructor keep their exact validated clock/imported/game shape and reject
style occurrences. Never widen a clock image with a type assertion.

The closed `RecordedStyleOccurrenceImage` common fields are runId, eventHead:{seq,digest},
eventId, eventSeq, actorClass:imported|learner, actorSide:white|black,
decisionClass:game|played, decisionId, decisionNodeId, sourceProjection:{id,version} and
sourceReceiptDigest and subject:RecordedStyleSubject. All common/image/subject objects are closed.
SourceProjection must be the exact literal ref allowed by the chosen arm;
sourceReceiptDigest is exactly evidenceDigest(evidenceValueReceipt(value)). Event/decision ids
reuse the current clock runId:event:seq and runId:decision:seq conventions, and decisionNodeId
is the actual BEFORE node. Add exactly one arm:

~~~ts
type RecordedStyleSubject =
  | { readonly kind: "legal_candidate"; readonly candidateUci: string;
      readonly chosenUci: string; readonly disposition: "chosen" | "alternative" }
  | { readonly kind: "actual_position"; readonly positionPhase: "before" | "after";
      readonly positionNodeId: string }
  | { readonly kind: "first_decision_baseline"; readonly firstDecisionNodeId: string;
      readonly sourcePly: number; readonly side: "white" | "black" };
~~~

An alternative's decisionClass describes the underlying real committed decision; it never asserts
that candidate was played. The sealer derives every field from its genuine context and retained
factory inputs. The private reader returns `{value,image}` with the whole original source value,
never filtered/resealed per-color values. True context absence uses only the unavailable union;
malformed source/actor proof, stale authority, copy/forge and access/abort failures retain their
normal refusal/errors instead of becoming unavailable or successful empty evidence.

#### Actor authority

Current read access is not historical authorship. Resolve original imported moves FIRST from the
actual immutable initial import root, legal original uninterrupted move events, PGN root/UCI list
and original session identity. Reuse/factor the already implemented originalImportNodes join;
do not infer original import from session.kind, first-branch maximum ply, FEN counters or a later
rehearsal branch. This is a read-only original-game identity check and performs no clock backfill,
provider fetch or metadata write. Both original colors are actorClass imported, never the viewer.

For native learner-authored moves, reuse the existing store-sealed LongitudinalSourceImageV4,
its exact requested full prefix, closed journal/authorship matrix and normativeDecisions rules.
Require the original event/node/BEFORE/UCI to match a proved owner decision; actorClass learner
means that historical owner action, independent of the requester. Do not infer authorship from
Node.actor, run.start.side, today's lease or an unexpired read/write grant. Grant-only unknown,
ambiguous/shared/journal contradictions remain unavailable/refusal under their current rules.
Only the actual same-store storage getter and checker may establish the V4 authority. Capture
longitudinalSourceImageV4(runId, actualFullHeadSeq), call THAT storage owner's
longitudinalSourceDigestV4(image), and join its exact replayed runPrefix events/head/run/owner to
the already owned Foundation prefix before normativeDecisions. That pure algebra alone authenticates
no image. Match a proved owner MOVE ref's eventSeq/nodeId/beforeFen/moveUci and actual mover side.
On capture and every retained read, obtain a FRESH store image at the same complete current head,
repeat same-store/full-run joins, and require its actual owner/authorship/structure image/digest
to match capture before and after publication. Checking the old sealed image alone is insufficient;
a journal/board-holder change with unchanged run.events must retire the occurrence.

DecisionClass precedence is literal: validated ORIGINAL import member -> imported/game; otherwise
proved native OWNER move with the single_player admission below -> learner/played. The second arm explicitly includes proved owner
rehearsal forks and nonoriginal extensions in imported runs. Do not copy normativeDecisions' game
label or change that existing algebra; its primary-branch maximum-ply classification is not the
original import proof. A failed original-import identity check cannot fall through to a learner
interpretation. A current viewer or shared/coached request never changes either result. Existing Foundation
boundary refusals remain: valid rehearsal/fork extensions are distinct from a below-service
extension of the original imported mainline, which remains refused under D3878. This clause
authorizes no boundary weakening.

D4144 clarification (independently accepted 2026-11-05): proved owner authorship is necessary,
not sufficient to label learner role. The bounded native learner arm additionally requires the
same store-sealed source's monotone `structureAttribution === "single_player"` marker. A proved
owner teacher/academy/stream/shared-session action is unsupported_actor_context until actual
historical role attribution is supplied; never relabel that coach as learner. A null/unproved
historical author stays historical_actor_unproved. Legacy/shared and native Match role support
remain owed, not removed from1.0. Do not classify a historical shared host as coach from today's
classroom/grant; this arm abstains without manufacturing either class. Original import-first
classification is unchanged. A real active teacher→academy→board grant→owner commit must prove
normative owner authorship yet receive unsupported_actor_context. Separate source/ABI and meaning/consumer reviewers accept this narrow correction before its
role-admission behavior is implemented. Actual controls and implementation review remain owed.

The first bounded operation does not invent opponent or coach identity from someone else's
journal author id. Those classes require their own genuine persisted/operation attribution before
admission. Expose only closed context-unavailable reasons; never turn ambiguity into a positive
learner observation or no-chess-match result. Adding optional access to the existing two sealed
longitudinal source read/check operations on RunStorage adds no database migration or new image.

#### Exact six-source joins

Only the literal current refs below may enter this finite nonminting occurrence constructor.
Use actual retained original factory inputs/private readers, not payload/receipt equality as
issuer membership; add one narrow provenance-only bridge for the six existing factory records.
Do not add a constructor registry, arbitrary context callback or second source dispatcher.

| Source | Exact relation to the committed decision | Meaning retained |
|---|---|---|
| `rules.mobility.reading.candidate_role@1` | original complete legal-map invocation BEFORE FEN and canonical candidate; retain original candidate UCI separately from actual chosen UCI | chosen iff canonical identities equal, otherwise legal alternative at this actual decision |
| `rules.mobility.reading.pawn_extended_center_destination@1` | original centre invocation's exact genuine candidate_role input plus the same BEFORE/candidate join | source-role pawn and declared destination only; alternatives stay alternatives |
| `rules.mobility.reading.early_queen_move@1` | original invocation's identical private decision and genuine candidate input; original rooted index and BEFORE/candidate join | original <16 boundary; no full-game inference at custom roots |
| `rules.structural.reading.fianchetto_setup@1` | original local invocation FEN at explicitly selected original BEFORE or committed AFTER member of this decision | complete both-color position snapshot, not a fianchetto action |
| `rules.structural.reading.fianchetto_knight_screen@1` | exact original setup invocation/input, same selected actual BEFORE/AFTER member | same complete snapshot plus original screen; no discovered-attack assertion |
| `run.record.castling_eligibility@1` | original prefix invocation, same stored side and its FIRST represented decision, using that decision's actual outgoing event | first-decision rights baseline, including both false; never current legality/lost-rights action |

Complete setup/screen snapshots with empty member arrays still contextualize genuine observed
absence; they do not create positive habits. Position before means the exact selected original
parent; after means its exact actual committed child. Their source invocation FEN must match that
member. A neutral same-FEN reading is reusable at a separately proved actual member; that does
not assert that its original computation had a historical node. Once sealed, an occurrence cannot
be retargeted to another same-FEN node/event. An unrelated hypothetical child with a different
actual position cannot become reached merely because the source factory succeeded.

Castling uses the source invocation's identical original prefix token and locates its own first
side-to-move member and its next actual move even if the granted endpoint is later. A first node
with no next committed child returns first_decision_pending, not source-unavailable/allfalse.
Early queen requires its source invocation's IDENTICAL private decision token from this owner;
other four candidate/position neutral factories join their original FEN and retained exact input
ancestry to the selected original decision/member. Equal serialized prefix/decision images never
substitute issuer membership.

The closed occurrence image discriminates observed position, legal candidate and first-decision
baseline. Candidate context retains canonical chosenUci, candidateUci and chosen/alternative;
position context retains actual position node/BEFORE-or-AFTER phase; castling context retains its
firstDecisionNodeId/rooted index and original baseline side. Whole original source payloads stay
intact. ActorSide never assigns every member of a two-color snapshot to one player. A downstream
actor-specific consumer must explicitly select same-color members from that retained snapshot;
absence stays absence. A path-level reached-at-least-once derivation must deduplicate under its
own declared denominator, not count persistent snapshots as repeated decisions or scan boards
again. Alternative candidate facts cannot count as observed choices. A hypothetical child that is not an actual selected path position needs its own explicit
candidate-child context; source success alone cannot enter this actual-path arm.

#### Required verification and remaining delivery

Use actual SQLite/RunService original imports and native owner/journal decisions, genuine six
factories and registered complete source populations. Both colors, actual chosen vs other legal
candidate, all promotion source roles, boundary15/16 and custom roots, original first-decision
rights before later loss, first-side pending, complete both-color snapshots and persistent
configuration repeats, actual inherited branches and same-FEN different-node/event cases must
fail crossed attribution. Include hypothetical candidate child treated as reached, shared/coached
viewer vs actual owner, unknown historical author, post-import rehearsal branch, copied/resealed
factory input/context/envelope, substituted source receipt and actual account/grant/head/import/
authorship/cancel retirement, including a same-head actual journal mutation. No constructor may
accept caller-written actor/event/matched fields.

Full source/member/ref receipts, callable actual operation and independent implementation review
plus ordinary gates are required. Before any Review/bot/drill/longitudinal adoption, that consumer
still needs complete preflight, its assistance ceiling and occurrence-only ingress. The pending/
offered/predicted/opponent/coach arms, semantic qualification, actual player-style claims and
whole foundation remain open; a positive constructor for all six refs does not close them.

### 3.8e Actual profile-bot occurrences (D4140 — independently accepted 2026-11-05)

This extends only§3.8d's recorded actor arm, using the existing operation and occurrence store.
It adds no source projection, event, storage/schema, registry, provider work or consumer binding.
Research gate: player-style-metrics dated Actual bot-opponent attribution preflight; actual
runtime/server/durable-parser sources inspected independently. Full1.0 human-role and predicted
contexts remain owed, not replaced by this bounded arm.

**ABI.** Extend only the style/private recorded-context actor union to
`"imported" | "learner" | "opponent"`; opponent has decisionClass:"played" and the actual BEFORE
turn. Clock images/constructor/readers remain imported/game and reject style occurrences. No
public actor parameter or alternate payload is accepted. Candidate and actual BEFORE/AFTER
position subjects preserve§3.8d's complete original sources, chosen/alternative identities and
snapshot semantics. First-decision castling remains the stored learner side's own baseline; it
cannot be repurposed as bot baseline. The private issuer AND retained reader refuse
actorClass:opponent with baseline kind or BEFORE turn equal to prefix.learnerSide.

**Actual attribution, in this order.** Complete original source/member joins precede absence.
Original imported-map membership still takes precedence, even if its ordinary Node.actor tag says
opponent. Otherwise the actual outgoing child's preceding original event must be
opponent.move_selected. Verify contiguous original event ordinals/sequences and exact selection
BEFORE node, actual child branch, canonical chosen UCI and selection.moveUci against this same
move.committed. Require child.actor:"opponent" and BEFORE turn opposite run.start.side. No current
viewer/grant/owner identity supplies this role.

For a positive bot context, the actual run has a catalogue profile and that exact selection has
its stored policy. Invoke the existing parseStoredBotEnvelope(run, originalSelectionEvent) and
retain its complete validated result as private attribution proof. It reconstructs the existing
root/legal/classifier/profile/provider authority; do not add a weaker actor-only envelope parser,
accept a copied event parameter from the caller, or call a provider. A malformed present bot
policy, crossed event/branch/UCI/side or invalid original pair is a refusal, never unavailable or
fallback to learner. The retained envelope is validated by the existing durable reconstruction
contract only. Its stored preCommitEventHeadDigest is not independently authenticated against the
event prefix by this arm; no stronger operation/provider-execution authenticity is claimed. The
original adjacent selection/move identity is checked separately using the actual child branch,
including inherited scope/auto-fork. Profile-present/policy-absent or policy-present/profile-absent is a refusal, not legacy absence.
Only a genuine legacy selection with BOTH profile and policy absent is unsupported_actor_context,
not learner; unsupported human actors keep§3.8d's historical/role abstentions. No new unavailable
reason or consumer-visible schema is needed. Native learner attribution still requires actual
same-store owner proof and single_player; a bot event must not enter that branch instead.

**Currentness.** Capture and every retained read recheck the original run/account/grant/import/
signal plus the actual retained profile selection and its existing durable parse. Retain the
complete original source receipt and exact bot envelope as context proof. Observed failed checks
permanently retire that context under§3.8d; exact storage restoration cannot revive it. Fresh
capture may independently succeed. Reuse the actual stored replay/parser; no new hash/cache/
freshness framework or saved actor decision. Provider outages after a valid original commit do
not erase retained historical proof or trigger reacquisition.

**Falsifiers and delivery.** Actual SQLite/RunService.botOpponentPly must commit both-color
profile moves through the genuine shared exchange and labelled mock provider; occurrence capture
and retained read cause zero further exchanges/writes. Exercise the five nonbaseline style refs
where their actual source preconditions hold, actual and alternative candidates, complete both-
color/empty BEFORE/AFTER snapshots, rooted early-queen negatives and canonical move identities.
Use the original operation's real chosen move, not a guessed move forced by the test.

Cross genuinely stored selections between moves/branches/runs; rebuild a replayable corrupted
pair where needed so the intended guard, rather than a snapshot mismatch, is reached. Cover
wrong actor/side/UCI, malformed present policy/delivery/profile, missing policy as genuine legacy
absence, import-first precedence, native learner and real academy-teacher preservation, clock
reader discrimination, account/grant/head/abort and observed failure/restoration retirement.
Each positive retains complete original sources; alternatives cannot become observed choices.
Existing bot restart/replay/parsers remain unchanged. Both independent contract and implementation
review plus focused/types/ordinary full gates are required before claiming this bounded delivery.
Broader bots/profile consumers, historical human roles, hypothetical/predicted/opportunity contexts,
qualification and whole foundation remain open.

Separate read-only source/ABI and meaning/consumer reviewers accept this bounded contract with
explicit profile/policy completeness, runtime opponent side/baseline guards and existing-parser
proof limits. Implementation and executed controls remain owed.

## 4. Authored predicate compatibility and schema migration

Both pack and shape-entry schemas duplicate structural-expression grammar. They gain the same
optional closed value:

```ts
interface StructuralConventionRef {
  readonly id: string;
  readonly version: number;
}
```

The compatibility table is closed to the following exact pairs; no other present ref is allowed:

| StructuralFeature kind | allowed conventionRef | new leaf predicate route | source meaning |
|---|---|---|---|
| king_opposition | king-opposition-unobstructed@1 | rules.structural.predicate.king_opposition@2 | reading@3; color matches, direct matches direct, distant matches distant_three or distant_five |
| backward_pawn | backward-pawn@1 | rules.structural.predicate.backward_pawn@2 | reading@3 contains at least one qualifying pawn of the requested color on the requested file; retain every matching subject |
| outpost | outpost-candidate@1 | rules.structural.predicate.outpost@2 | exact requested color/square is a future_file candidate; occupancy is not required |

Absence means the legacy v1 semantics already used by committed content. Unknown ids/versions,
wrong-kind pairs, aliases, extra fields and a ref on any other kind fail. The two schema copies,
TypeScript parser, Studio and pack/shape loaders derive from this one table. The same
compatibility rule applies to the matching file/square template forms; quantifier expansion
retains the selected ref on every expanded feature rather than dropping it. Source-only schema
validation must never silently execute a new ref with an old helper.

This RFC also owns five explicit companion projections, separately enumerated in the plan's
`authoredPredicateRoutes`: the three leaf@2 routes above, `authored.structural_condition.input@2`
and `derived.structural.predicate_result@2`. The source inventory remains23; the complete new
projection scope is28. The latter pair retains the authorized document source/id/pointer and
entire exact expression, same-position leaf values and ordered trace with mirror/path/multiplicity.
The new aggregate is derived from its exact authored input and actual sealed evaluated leaves;
no caller-written matched boolean or unused alternative source is accepted. The leaf payload
retains fen, exact feature including conventionRef, matched boolean and actual matching subjects.
Its factory recomputes from the source reading, not a supplied verdict.

`structural-evidence.ts` owns one current recursive dispatcher. A missing ref calls the unchanged
legacy predicate factory for that leaf; an explicit allowed ref calls only the corresponding
leaf@2 factory, under its exact source and convention. All current authoring, objective and shape
predicate operations use the new input/result pair and versioned consumer bindings, including
all/any/not/mirror and nested leaves. New requests do not run two parallel evaluator pipelines.
Old@1 factories/helpers keep their meaning and reject new-ref requests before minting; they cannot
produce a new-convention result. A missing new source/route produces typed source_dependency_unavailable
and blocks that authored evaluation, not false, fallback or a silently disabled condition.
The read-only migration report uses the same dispatcher in explicit legacy/successor comparisons.
No new ref is admitted to playable content until its full source, leaf and aggregate path is live.

Permanent controls cover all three pairs, absent/unknown/wrong-kind refs, matched/unmatched and
same-file multiple backward pawns, empty candidate vs occupied outpost, distant-three/five mapping,
missing source, mixed nested legacy/new leaves, repeated leaves and mirrors. Actual source-owned
pack, shape and objective executions must consume the new sealed aggregate. Complete old-authored
truth/digests remain unchanged before deliberate migration. No automatic migration is allowed.

### 4.1 Exact authored aggregate reduction and short-circuit evaluation (D4068)

The variable leaf population is **not** an `inputs`/`anyOf` declaration. Add exactly one binding
to the existing closed reduction mechanism:

- operation: `authoring.structural_predicate@1`;
- projection: `derived.structural.predicate_result@2`;
- factory: `createDerivedStructuralPredicateResultV2Evidence`;
- source owner: private `AuthoredPredicatePopulation`, captured_only;
- ordered element vocabulary: `authored.structural_condition.input@2`, then
  `rules.mobility.reading.legal_moves@1`, then the lexically ordered exact21 leaf refs listed
  by the plan's evaluated_sealed_leaves declaration (18 existing@1 kinds plus three new@2).

Extend the existing reduction contract, exact projection-declaration validator, execution
compiler, sole value route and owned reduction-proof seal/read whitelist for this one binding.
Do not introduce a generic registration API, arbitrary reduction callback or unused union of
all leaf values. Its derived reading is declared_convention/convention/not_applicable,
answerContent fact, operand observation, sign state, forms machine_condition/panel, and typed
abstention reasons source_dependency_unavailable/input_abstained. It reports the encoded
authored condition under declared rules; it does not upgrade authored content to chess truth. The exact
projection/operation/factory/source-owner/element order is fixed by that installed binding.

The private source owner captures the authenticated pack/shape authored input and exact sealed
legal-position reading. Their FEN/expression/source/id/pointer are immutable for the invocation.
It evaluates the actual AST itself; it accepts no caller-supplied matched flag, leaf list, path
list, trace, provider callback or alternative ancestry. Root FEN is read from the sealed position.
Feature leaves call the §4 dispatcher; pieceOnSquare uses the same sealed root board; supported
logical/quantifier/mirror nodes retain their exact evaluation paths and expanded operands.

Retain the existing left-to-right short-circuit behavior (quantified file/square ranges expand
in their existing deterministic order, preserving the selected ref): all stops at its first false child,
any at its first true child, not visits its one child, and mirrors/quantifiers follow their
existing ordered expansion. Validate the whole expression's syntax and kind/ref compatibility
before evaluation, including unvisited branches. Source acquisition/leaf receipts/actual input
closure include only visited leaves. An unvisited leaf has no fabricated boolean, source,
convention receipt or successful trace row; its enclosing trace may identify it as skipped.
A visited unavailable source produces source_dependency_unavailable for the whole evaluation.
An unvisited runtime-unavailable source is not acquired. Invalid/missing static declarations
still fail the compiler instead of being bypassed by short-circuiting.

The owned reduction proof binds exact authored input and root position, AST/expanded path,
visited order and path multiplicity, exact leaf refs/value identities/FENs, result and full trace.
Repeated identical leaves at two visited paths retain two occurrences even if memoized values
share identity. The factory and mint verify this exact captured population/proof with the existing
reduction mechanism; any missing/extra/unused leaf, duplicate path, swapped expression/FEN/source,
document/pointer or plan fails. Direct and transitive conventions equal the actual visited
input union; no convention or grounding is borrowed from an unvisited alternative. The closed
binding must also be inspectable through the existing reduction-binding checker.

Permanent positive/negative controls use genuine authored and sealed source values, including
all-false/all-true and mixed branches, a skipped unavailable leaf, a visited unavailable leaf,
no-feature pieceOnSquare expression, nested mirror/quantifier paths, repeated leaves, source/FEN
substitution, forged owner/proof, removed/extra occurrence and wrong binding. Current four
reduction operations and every ordinary exact-input derivation retain their existing checks.

The initial authored population is fixed by the research receipts:

- 8 king-opposition leaves in 2 documents;
- 5 backward-pawn leaves in 3 documents; and
- 23 outpost expressions in 3 shape documents.

Implementation first produces a read-only migration report with legacy/exact-successor truth traces and exact
file/pointer identities. No automatic migration is allowed: a human classifies each occurrence as
legacy or the explicit successor. Gate F remains active, so this RFC may land the schemas and
report without rewriting content. Any later content apply uses the content-wave closeout protocol.

Legacy author predicate truth and content digests remain byte-stable when the new ref is absent.
Source successor landing must not remove v1 readers needed for old runs/content; it only removes
v1 from new learner eligibility after downstream migration.

### 4.2 Authenticated authored origins and one owned visitor (D4077; independently accepted 2026-11-04)

**Separate author amendment independently accepted 2026-11-04 in the existing compiler2 review.** This subsection supplies the
finite source-construction seam required by §4.1. It adds no projection, convention, content
migration or product permission. The five companion routes and their exact21-leaf vocabulary
remain the plan's complete authored scope. The separate reviewer accepted the finite
origin/visitor contract; its actual issuer/dispatcher/consumer implementation remains owed.

#### 4.2.1 Four concrete document issuers, before semantic probes

`authored.structural_condition.input@2` takes one private `AuthoredStructuralConditionSource`,
not the v1 tuple of caller-written source/documentId/pointer/expression. Its only production
document issuers are the following existing owners, extended at these exact seams:

| issuer | captured authority | issuance point and meaning |
|---|---|---|
| `apps/server/src/pack-validation.ts#validatePackDocument` | complete captured draft pack | after the actual AJV schema pass and detached document clone, plus whole structural syntax/kind/ref validation, before lint/runtime/objective probes |
| `apps/server/src/shape-validation.ts#validateShapeEntry` | complete captured draft shape | after the actual AJV schema pass and detached document clone, plus whole structural syntax/kind/ref validation, before initial-position/probe/satisfiability checks |
| `apps/server/src/pack-registry.ts#PackRegistry` | actual admitted `PackRecord` | its own current record/document/digest, after admission; no caller-supplied replacement record or summary |
| `apps/server/src/shape-registry.ts#ShapeRegistry` | actual admitted `ShapeRecord` | its own current record/document/digest, after admission; no caller-supplied replacement record or summary |

Draft issuance proves the captured document and expression's syntax/source location, **not**
successful semantic validation, registered status, authorship rights or playable eligibility.
It is available to the validator's own probes while those probes decide whether admission will
succeed. It never calls registry capture or full `validatePackDocument`/`validateShapeEntry`
again to obtain itself. Registered issuance checks the actual existing admitted record and
does not recursively repeat semantic probes. In particular, the existing
`ShapeRegistry.#captureRegisteredRecords` → `validateShapeEntry` path cannot require a completed
registered-source capture from inside that validator. It uses a provisional draft authority
for validation and the checked actual record authority for subsequent registered execution.

Each issuer owns immutable complete document bytes and computes their exact canonical SHA-256
using the existing `canonicalizeJson` serialization. The result must byte-equal
`digestDrillPack`/`digestShapeEntry` for the same document, including version. Existing synchronous
validators need not become asynchronous: a synchronous hash of those identical canonical bytes
is permitted and tested against the existing digest functions. A registered capture additionally
requires that computed digest equals the actual record and summary digest/id/version. The source
image retains document kind, stage (`draft_validation` or `registered`), real document id/version,
document digest and exact JSON pointer. A draft is never relabelled as the published record with
the same id. Runtime factories accept neither a digest string nor a copied/resealed token in
place of original private issuance. Package-private issuer imports/call sites are finite and
checked; no public registration API or arbitrary validation/evaluation callback is introduced.

Studio validation and probes use their real existing `PackStudio`/`ShapeStudio` entry points,
which already call the two validators. Stored-draft and registration paths keep their existing
principal/owner checks; the pure validator's provisional authority grants no account access or
publication right. A pure internal probe over a supplied complete schema-valid document may
issue only `draft_validation` authority through that validator, never registered authority.
It cannot authenticate a free expression merely by giving it another document's id.

#### 4.2.2 Literal pointers and source-owned plan expansion

The owner selects expressions from its own complete document by a canonical, escaped JSON
pointer and verifies the selected node's exact bytes. It derives source kind/id from that
document; callers cannot supply an alternative expression beside the pointer. Supported sites
are the actual typed structural-expression fields in the pack/shape schemas: direct structural
features, boundary predicates, transition-embedded structural expressions, shape triggers and
shape-plan signatures. The schema-directed walk establishes these sites; arbitrary JSON objects
or recursive searches for a coincidentally equal expression are not expression addresses.

Extend `pack-orchestrator.ts#expandStructuralExpression` and its `ExpandedExpression` result to
retain a private source-origin image as well as the effective expression. Direct expressions
retain their exact pack pointer, such as the existing success-condition pointer plus `/feature`.
The `plan_signature` and `plan_consequence` cases retain the actual pack use-site pointer,
`planClasses/<index>/shapePlan` reference and referenced shape document's actual id/version/digest
and `/plans/<index>/success/signature` pointer. Preserve the distinction between the authored
use-site AST and expanded effective AST; the latter need not literally occupy the pack pointer.
The expansion trace binds each substitution to both original nodes and its expanded path.

The existing `planSignatureResolver`/`PlanSignatureResolver` expression-only callback cannot be
that authority. The current production resolver is extended to resolve from the captured pack
and the actual `ShapeRegistry` record authority, returning the exact captured shape-plan source;
it accepts no external resolver callback or caller-returned signature at the @2 source boundary.
Draft pack validation may use actual captured registered shape records from its existing shape
lookup; a provisional shape under its own validator can supply only its explicit draft source.
Plan id, relation/admission checks and `plan_signature` nesting refusals remain those of the
actual orchestrator/validators. The current schema-only unknown-shape placeholder in
`pack-validation.ts#runtimeIssues` is diagnostic scaffolding, never a genuine source, true
predicate or replacement signature. An unresolved required expansion reports the existing
validation/source-dependency failure instead of manufacturing a king-count expression.

`successPredicate`, boundary/timing/transition compilation and other objective-rule builders
propagate that private source through the compiled ephemeral predicate. `objective.ts` consumes
that exact source; it no longer invents `pointer: "runtime.objective_condition"` or authenticates
the expanded expression using only `run.packId ?? run.id`. No source handle is persisted in run
events or accepted over REST. The operation still obtains the run/node position through its
existing owner and mints the one exact genuine legal-position input itself. A caller cannot
substitute a FEN, document, pointer, expanded expression, shape plan or provenance path after
capture. Registered execution checks its original record/currentness; draft execution is scoped
to the original immutable validation invocation.

#### 4.2.3 Explicit visitation policies, with actual evaluated ancestry

There is one current source-owned recursive dispatcher/visitor for authored predicates. It
validates the whole original and expanded AST before evaluation, including skipped branches,
and executes feature leaves through the exact §4 leaf factories. Every expanded mirror/file/
square/named-structure path and repeated occurrence has its own trace address. The sealed root
board supplies `pieceOnSquare`; no-feature expressions therefore still retain authored input
and root position. Compatibility refs survive every mirror and quantifier expansion. New @2
leaf factories authenticate their actual source snapshot before either matched or unmatched
output; legacy leaves retain their original payload/truth/digests and acquire private invocation
membership if required by the reduction proof. Factory-name strings or copied source receipts
cannot substitute for original leaf membership.

The visitor has exactly two operation-selected policies, retained in the captured population,
observation and proof; neither is an arbitrary caller-supplied evaluator:

- `predicate`: `all` stops at its first false child, `any` at its first true child, `not` visits
  its child; quantified `every`/`some` expand in existing file-then-rank deterministic order and
  stop at the first false/true member respectively. Mirrors visit the transformed operand once.
- `witness`: preserve the existing `evaluateStructuralExpressionWithWitness` meaning: `all`
  stops on its first false child; `any` visits **all** children and unions squares from every
  matched child. Positive occupied `pieceOnSquare` leaves contribute their square; unmatched
  expressions, negations, empty-square leaves, file features and quantifiers contribute none.
  Quantifiers retain the existing eager member visitation in this policy. Witness squares stay
  deduplicated and sorted. Named-structure witnesses retain their existing registered
  `STRUCTURE_PREDICATES` definition and positive-square meaning.

This is an explicit @2 policy distinction, not a claim that legacy quantifiers short-circuit:
`structure.ts#matchesQuantified` currently maps the complete domain before `some`/`every`.
The owned visitor performs its own visible expansion and leaf calls; it must not call that
opaque mapper or evaluate once through a pure helper and again to manufacture a receipt trace.
When witness expansion uses the fixed named-structure definition, retain that exact catalogue
definition in the source/proof, the named leaf identity and every actual expanded evaluated
feature occurrence. No unvisited definition branch contributes an invented receipt. The named
leaf/source truth and expanded witness result must agree; disagreement refuses the operation.

The existing pure legacy witness/rules helpers keep their current truth, all-matching-any
witnesses and empty-quantifier witness behavior. They reject explicit new refs rather than
silently applying v1 meaning, and are not a second current authored evaluator. Current authored
shape/claim/pack probes, including the direct calls in `pack-validation.ts#runtimeIssues` and
`shape-firing.ts#shapeFirings`, use the owned visitor/source path. Probes requiring witnesses
select `witness` through their actual operation; boolean objective/trigger probes select
`predicate`. Built-in rules-only named-structure readings may retain their existing pure legacy
factory computation; a catalogue definition is not relabelled as an authored pack/shape input.

Each policy's aggregate reduction proof contains only its actual evaluated operands: authored
input, root position and exact ordered leaf occurrences, with full original-source/expansion/
policy trace. A witness `any` legitimately includes all visited children; a predicate short
circuit includes no skipped child's value or convention. Their matched truth is equal on the
same valid available inputs, while trace/ancestry may differ and must not be interchanged.
A visited unavailable source blocks that operation; a skipped runtime-unavailable source is
not acquired. Whole-AST/static-plan validation cannot be bypassed by either policy. Current
authoring/objective/shape consumer versions and actual operation bindings move together with
the five-companion cut; no raw boolean, pure witness or unregistered fallback bypasses @2.

Permanent controls cross all four actual issuers, real Studio/probe and objective paths, source
stage/id/version/digest/pointer/expression substitutions, copied tokens, changed registry records,
plan-signature/shape-plan origin substitutions and validator non-recursion. Include a skipped
invalid ref, mirrored/quantified ref retention, predicate short-circuit versus witness all-match
`any`, eager witness quantifiers, no-feature piece expressions, named-structure witness parity,
and exact repeated expanded-path multiplicity/convention ancestry. These prove the finite
authority and visitor contract without migrating any playable content or inventing chess truth.

## 5. Source, value, operation and consumer boundaries

This RFC deliberately stops at exact source identity:

1. **Source implementation:** functions, payload types, manifest declarations and source adapters
   for the 23 rows may land after acceptance.
2. **Value authority:** `evidence-value-authority` supplies the sole sealed factory/profile for
   each final projection. A shape-only adapter cannot activate it.
3. **Operation:** the JSON plan assigns one source owner to every row as a function of grain.
   Position/edge/candidate rows go through `shared-candidate-evidence-packet`; frozen-prefix rows go
   through `recorded-semantic-path`; recorded-decision rows wait on `recorded-clocks`. A style row's
   separate actor/decision occurrence envelope is sealed by `recorded-semantic-path` after source
   construction and before any occurrence consumer.
4. **Validation:** `semantic-validation-authority` owns independent positives, semantic negatives,
   mirror/orientation, counterfactual, imported and external-labelled witnesses.
5. **Consumers:** `module-registration`, Review, bot policy, drills and longitudinal storage each
   declare their own eligibility and significance. None receives automatic admission here.

Landing source helpers with zero product callers is an honest intermediate state, not completion.
The RFC remains implementing until its source rows and schema/report obligations land; its
downstream Discharges remain open and prevent any product capability from claiming closure.

## 6. Validation and non-vacuity fixtures

Production implementation must port, not merely cite, the research falsifiers:

1. king opposition: horizontal/vertical and both colors; direct/distant-three/distant-five;
   occupied-between, turn, gap, alignment and color negatives; reproduce the historical90 original /61 unobstructed /29
   blocked observations on its fixed research population;
2. backward pawn: mirrored positives; support/control negatives; empty/own/enemy stops; doubled-file
   subjects; legal-advance abstention; reproduce 403 file / 404 subject / 251 empty / 153 occupied;
3. pawn groups: doubled+isolated pair, synthetic tripled group, stationary adjacent-file change,
   membership-only event and both fixed-population truth sets;
4. slider rays: empty board-edge inventory without target, target-bearing ray controls,
   equal-count membership change and equal-array no-event;
5. file activity: full open/half-open state product, moved-heavy versus stationary reveal,
   removed-heavy/minor/same-class negatives;
6. pawn islands: unchanged rank motion, equal-count topology change, merge/split and opponent-only
   capture change;
7. square/outpost: pinned pawn current control and same-file future challenge; a supported
   rank4..6 square challenged only by hypothetical capture migration is admitted by the new
   future_file candidate while the original maximal-union predicate refuses, and the separate
   capture-migration source remains positive. Pin all three outcomes, empty/occupied distinction,
   rank/support negatives, h2h3/g4 and a2a3/b4 identities;
8. style atoms: all four color/wing fianchetto mirrors, wrong-color/missing-pawn negatives, all
   eight extended-centre squares plus adjacent negative, ply 15/16 queen boundary, promotions,
   Chess960-safe castling sides, every clock abstention arm, and learner/opponent/imported/coach
   context swaps that must fail closed; and
9. a mutation control for every fixture family. Each control names the field/predicate it breaks;
   a fixture that reads its own expected output is rejected.

Population receipts bind input revision/digest, implementation digest, convention digest and
result digest. A copied count without those identities cannot satisfy validation.

## 7. Presentation and law-8 boundary

Deterministic renderers may name only retained operands and the registered factual label.
Ordinary modules select a bounded question-specific subset; Advanced Inspector may display full
topology, convention refs and compatibility sources. Prohibited from these sources alone:

- weak/strong, good/bad, active/passive, important, best, mistake or blunder;
- intention, plan, prophylaxis, prevention, force or inevitability;
- player type, habit, strength, weakness, mastery or recommendation; and
- causal story prose not present in a separately admitted source.

An optional LLM may paraphrase a later sealed module item. It cannot choose a projection, repair a missing operand,
supply a source convention, infer significance or turn a neutral occurrence into
advice.

## 8. Implementation order

1. verify the landed convention core, then implement this RFC's twelve claimed definitions with
   their source predicates and exact receipts;
2. implement the two schema lanes and read-only authored migration report;
3. land source payloads/helpers and research-only manifest declarations in bounded family slices;
4. add exact value factories/profiles through `evidence-value-authority`;
5. bind one-edge/candidate and recorded-path operations through their owners;
6. bind independent validation and keep failed/incomplete rows research-only;
7. regenerate module requirements against final successor ids and move raw inventories to
   Advanced; and
8. only then enable Review/bot/drill/longitudinal consumers and perform human-approved content
   migrations.

No slice may close a downstream row because its source helper exists. Every landing reports source,
value, operation, validation and consumer state separately.

## 9. Acceptance criteria

1. The checked projection plan contains exactly 23 unique `id@version` rows across the declared
   eight source families plus style atoms; every row has one grain, typed source-dependency set,
   convention set, execution owner, context requirement and new/successor state.
2. All nine handoffs are represented exactly once and all nine external owner boundaries remain
   excluded from the projection set.
3. The plan's exact 12-member future convention set is valid against landed lineage, with new base
   ids beginning at `@1`; the landed registry/history/value-receipt core precedes promotion of
   that exact set into the checked live claim; source-specific definitions/receipts must exist
   before the corresponding sources mint. A copied, divergent or private runtime list fails.
4. Pack 0.33 and shape-entry 0.4 carry byte-equivalent convention-ref grammar and generated
   kind/ref compatibility; absent refs preserve current content truth/digests.
5. Source payloads retain every operand in §3. Dropping, swapping, spreading/JSON-forging or
   crossing a grain fails the value factory at runtime.
6. All research fixtures in §6 port to permanent suites with mutation controls and revision-bound
   population receipts.
7. v1 and successor semantics coexist explicitly. No in-place meaning rewrite, fallback from an exact successor
   to an original-semantics source, or v1 satisfaction of a successor consumer compiles.
8. The 8/5/23 authored population produces a total read-only migration report; no automatic
   content edit occurs in source implementation.
9. Every plan row has exactly one later operation owner; this RFC adds no private packet, queue,
   recorded-path compiler, clock parser or consumer selector.
10. The compiled manifest, value-route receipt, execution census, semantic-validation matrix and
    module-requirement generator all recognize successor ids or explicitly report them pending;
    silent omission fails.
11. Ordinary renderers cannot emit the prohibited law-8 vocabulary from these sources alone;
    Advanced retains exact source/convention inspection.
12. `make foundation-source-author-contract`, source-focused tests, schema/type checks,
    `make foundation-closure-check`, `make verify-software`, `make verify-content` and
    `make verify-governance` pass before implementation closeout.
13. Implementation closeout flips only source/schema rows actually shipped, appends the exploration
    log, retains all operation/validation/module/content discharges, and updates the 1.0 roadmap.
14. Both event algebras define absent→absent, absent→present, present→absent and present→present.
    Genuine opposition fixtures cover available legal absent/present/holder-change cases; equal
    present→present is marked unreachable over a legal opposition edge and tested as pure algebra
    only. Backward-pawn fixtures additionally provide a genuine equal-row quiet-move/no-event
    case and a moved-pawn lineage change. Equality compares semantic row operands, not enclosing
    FEN/receipt/edge identity; unequal matched values emit exactly one membership_changed.
    No algebra-only case is labelled a legal source positive or used to qualify the collector.
15. All seven style atoms require a runtime-sealed actor/decision occurrence before history use;
    swapping actor, decision class/id, event head or source receipt fails rather than re-attributing.
16. All28 proposed exact projection refs (23 sources plus five authored-predicate companions)
    are collision-free against the actual current manifest and sole route registry, and have
    exact direct/input convention receipts. Existing detailed reading@2 sources remain unchanged.
17. The three exact kind/ref pairs dispatch only to the new sealed leaf predicates and aggregate;
    missing dependencies refuse. Real pack/shape/objective callers, nested/mirrored/repeated leaves
    and the read-only old/new migration report exercise the same dispatcher. Old@1 factories reject
    explicit new-ref inputs; a schema-only new-ref acceptance cannot satisfy this criterion.
18. Outpost positive/negative fixtures independently pin ranks3/4/6/7, support/no-support,
    current/future-file/capture-migration distinctions and empty/occupied/opponent-occupied squares.
    Removing an unused capture-migration input leaves future_file candidate bytes unchanged.
19. The legal opposition quiet-rook fixture yields exactly one holder-change event. Slider fixtures
    cover two rays, two sliders, moving/captured/castling/promoted root pieces and strict endpoints;
    a root-subject swap or lost/gained pair in place of an actual joined change fails.


## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | convention register/provenance supplies the 12 exact convention members and receipts | `semantic-convention-provenance` | accepted dependency + checked member claim | |
| D2 | every final projection has a sealed exact value factory/profile | `evidence-value-authority` | value-route receipt after implementation | |
| D3 | position/edge/candidate projections reach a real application operation | `shared-candidate-evidence-packet` | execution census after implementation | |
| D4 | frozen-prefix/path sources reach a real recorded operation | `recorded-semantic-path` | execution census after implementation | |
| D5 | clock source binds typed recorded clocks and control | `recorded-clocks` | operation/source fixture | |
| D6 | successor events pass the required independent validation profile | `semantic-validation-authority` | validation receipt | |
| D7 | subject-safe avoidance derives from exact successor subjects | `planning/routing-queue.md` D1718/D1719 successor | subject-denominator receipt | |
| D8 | ordinary modules migrate to exact sources and raw inventory remains Advanced | `module-registration` | regenerated requirements + live module witness | |
| D9 | 8/5/23 authored occurrences receive human-reviewed migration dispositions | `planning/content-wave-work-order.md` under Gate F | content commit + content log | |
| D10 | style atoms enter longitudinal storage only with exact opportunity denominators | `longitudinal-store` successor | store/reader fixtures | |

## Author-repair obligations

| ledger row | required repair before independent review |
|---|---|
| [[D2390]] | **repaired:** plan v2 separates typed dependency/convention sets and predeclares 12 valid `@1` members |
| [[D2391]] | **repaired:** `recorded_decision` authenticates the run event; clock operands resolve only through `recorded-clocks` |
| [[D2392]] | **repaired:** fianchetto position facts route through the shared packet; recorded occurrence is a separate envelope |
| [[D2393]] | **repaired:** all seven style rows require the sealed actor/decision occurrence before history use |
| [[D2394]] | **repaired:** both successor event families use a total five-case algebra with `membership_changed` |

## Open questions

No new owner ruling is required for the dependency refresh. [[D2390]]–[[D2394]] remain
historically author-repaired; `make foundation-source-author-repair` checks their stated contract,
not executable source correctness. Current registry/history and live member-claim checks pass before
fresh independent buildability review. That review must establish whether the exact remaining
provenance interfaces suffice for all23 sources; this refresh does not self-accept that conclusion. Consumer priorities, preset defaults, habit floors, bot trait strength, Review
ranking and content judgements remain with their existing owners.

## Changelog

- 2026-11-04: D4066–D4070 coherent author repair specifies exact convention replacement,
  collision-free reading@3 identities, stable event joins, fixed future-file outpost semantics,
  and executable authored kind/ref dispatch (23 sources plus5 explicit companion projections).
  This remains a draft requiring independent review; no runtime semantics changed.

- 2026-11-04: D4065 refreshes the stale convention dependency against the actual52-member core,
  claims the existing exact twelve-member set, and requests independent buildability review.
  No source, schema, content, factory, qualification or consumer implementation is asserted.

- 2026-08-31: author repair closes [[D2390]]–[[D2394]] in the draft and plan v2. Dependency and
  convention authority are separate; convention lineage is valid; clock and occurrence context
  are authenticating; operation routing agrees with grain; and identity-preserving event changes
  are total. `make foundation-source-author-repair` replaces the negative current-byte witnesses.
- 2026-08-31: author audit returned the first pass on [[D2390]]–[[D2394]].
  `planning/foundation-source-identity/author-audit-2026-08-31.md` and
  `make foundation-source-author-audit` pin the five contradictions. This is not the required
  independent review and authorizes no implementation.
- 2026-08-31: first author pass from the D1736 shared source-repair wave. The scope is 23 exact
  source projections plus two schema lanes, with nine external ownership boundaries kept explicit.
  No production, schema, content, manifest, runtime, API, UX or archive bytes changed.

- 2026-11-04: independently authored/accepted §3.2a replaces the new quiet-advance
  consequence’s capture-only dependency with genuine complete landing-capture authority. Exact
  child/physical destination and original-invocation joins precede absence; old landing semantics
  and canonical receipt identity stay unchanged. Six new source/value outputs implement physical
  slider membership, legal backward-pawn advance and four future-file/outpost snapshots. All eight
  complete new snapshots feed compiler5/29 child routes. Finite source controls pass; full gates
  remain pending. No operation/qualification/consumer/content or parent completion is asserted.

- 2026-11-04: independently authored/accepted §3.8a/3.8b complete the exact legal candidate
  domain and ten-snapshot configuration cardinality. Four new factories retain exact R12 setup/
  knight screen, candidate role and fixed pawn centre destinations with genuine original input
  guards. Compiler6 collects child setup/screen through the same object and parent candidate
  role/centre through the original legal map. Independent static review and1590focused checks
  pass; full gates pending. Twenty of28 source/value outputs exist; occurrence/qualification/
  consumers, authored predicates and the recorded/context sources remain separate.


## Independently accepted coordinated successor — 2026-11-09

`subject-safe-semantic-selection.md` owns the D1716/D1719 and D4167 canonical/candidate/avoidance
cutover. BOTH independent source/control and consumer/meaning reviews accept its repaired finite
source-first contract: original root/child graph, two private total reads, current42/compiler7,
thirteen source-owned@2 outcomes, fourteen current-event compact ordinary pairs and unchanged
historical case custody. Acceptance is recorded in the existing compiler2 review receipt; it
comes from that review, not this parent's implementing state. Production images, source
correctness/qualification and implementation gates remain owed. D4175 retains all26 ordinary
avoidance pairs/delivery/cost; D4167 keeps every reverse consumer and actual bot Stage-B/D3662.
No full adoption, content/native or release completion follows.
