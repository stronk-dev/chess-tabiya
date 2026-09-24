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
exchange-filtered double attack, complete one-reply breadth, and exact check. Its threat and fork-survival projections remain
inspector/machine evidence rather than learner modules.

The breadth foundation adds twelve event projections over exact control, mobility, pawn, material,
king, defender and open-file operands. Recorded two-/three-edge events preserve every node/FEN
boundary and piece identity; they report observed order only. They deliberately do not name
overload, deflection, removal, force, success, king exposure, activity, or a plan. Those names and
their able-to-fail consequence requirements belong to the semantic-collector successor.

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

**Eligibility** is an exact event-to-consumer permission. It says that a validated event may reach
that consumer; it does not say the event is useful, visible or enabled. The current 67 rows target
only `research.semantic_selection@1`. Existing product consumers receive no new evidence.

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
addition to TypeScript types. Object spread and double casts do not preserve authority. Production
callers use named source adapters; the generic constructor is not exported by the runtime package.
Each object adapter checks that its required keys are set-equal to the projection operands in the
manifest and rejects malformed bytes. Registered Compare and Story renderers receive structured
operands and derive prose themselves; callers cannot smuggle a pre-rendered sentence under a
structured projection. The exact 14-file migration census is executable in
`evidence-adapter-closure.test.ts`.

## Compiled closure and provider behavior

The primary manifest contains 37 producers, 206 projections, 25 consumers and 222 bindings, plus
78 semantic events, 78 eligibility rows, 15 reasons and one selection policy. All collections
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
- **Exact edge source.** `declareRecordedEdgeEvidence(run, parent, child)` is the only constructor of
  `run.record.edge@1` (inspector-only, no sentence renderer). It replays the move and refuses any
  parent, ply, canonical UCI, canonical SAN or FEN disagreement. Its payload carries the child's
  actual recorded branch, so a shared ancestral edge has one identity for every descendant path.
- **v2 successors.** The eleven sequence projections have `@2` successors that keep the v1 operands,
  signs, conventions and limitations and replace `run.record.move@1` with `run.record.edge@1`. Their
  constructors bind every edge value-for-value to the operand anchors and refuse edges not minted
  from an actual run. v1 declarations and constructors are unchanged and have no production caller.
- **Receipts.** Every edge start receives exactly one receipt per evaluator row (eleven projections,
  thirteen rows): `emitted`, `no_witness` (an evaluated negative) or `insufficient_continuation`
  (not a negative). Any path or edge corruption refuses the whole path before any detector runs.
- **Execution shape.** One `transitionSemanticEvents` compile and one `checkSemanticEvent` probe per
  edge; defender duty is memoised per window-start FEN within one call; full `localSemanticEvents`
  fan-out is never used except by the eager byte-parity oracle.
- **Identity.** Events order by end ply, start ply, projection and id. The digest covers the manifest
  digest, the convention digest, the ordered exact edges and each event's input value digests, run,
  branch, origin, path, event ids and receipts. The semantic-convention provenance predecessor has
  not landed, so the result carries `conventionReceipt.status: "predecessor_unlanded"` and digests
  the in-catalogue convention text rather than claiming a registry head.
- **Server.** `apps/server/src/recorded-semantic-path.ts` exposes the injected, read-authorised
  `compileRecordedSemanticPath`; there is no public raw-evidence route. No Review, module or
  longitudinal application operation consumes it yet, so the RFC stays `awaiting` (criterion 13).

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

## Adding a product module

F5 must add a named consumer, literal eligibility rows, exact adapters, a versioned production
policy and workflow defaults together. Raw producer toggles are not a product configuration
surface. Presets decide which module is appropriate in Just Play, drills, campaign or review while
the advanced inspector may expose the underlying inventory.
