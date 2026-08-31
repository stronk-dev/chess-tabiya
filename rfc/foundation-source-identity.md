# RFC: Foundation source identity repair

- **Status:** draft — **RETURNED BY AUTHOR AUDIT 2026-08-31 on [[D2390]]–[[D2394]].** The
  23-row scope remains useful, but convention/dependency authority, clock grain, position-operation
  routing, style attribution and truth-preserving event cardinality require repair before the
  fresh independent buildability review.
- **Author:** codex, executing the D1736 shared-wave handoff
- **Created:** 2026-08-31
- **Design refs:** `design/03-product-breadth.md` evidence architecture;
  `design/04-content-architecture.md` authored predicates; `design/05-in-run-experience.md`
  assistance ceilings; law 8 in `AGENTS.md`
- **Exploration gate:** complete in the nine source handoffs listed in §1 and re-derived by
  `design/research/foundation-capability-closure-2026-08-31.md`
- **Depends on:** implemented F1/F2, exact legal mobility and breadth/tactical collectors; draft
  `semantic-convention-register.md` and `semantic-convention-provenance.md` must land before this
  RFC implements convention-bearing projections
- **Supplies:** exact source payloads to `evidence-value-authority`, then execution to
  `shared-candidate-evidence-packet` and `recorded-semantic-path`, validation to
  `semantic-validation-authority`, and final consumer migration to `module-registration`
- **Planning:** `planning/foundation-source-identity/`

```tabiya-claims
pack-schema | lane 0.33 | optional closed structuralFeature.conventionRef plus conditional kind/convention compatibility; absence preserves legacy v1 semantics
shape-entry-schema | lane 0.5 | the same structuralFeature.conventionRef grammar and conditional compatibility as pack-schema 0.33
```

The future semantic-convention member claim is deliberately absent while its process register is
draft. Before acceptance, the register must land and this RFC must add the exact member claim for
the eight convention ids in §3. A private list in this RFC is not a second register.

## Summary

Tabiya already computes the requested chess vocabulary, but several current payloads erase the
subject or combine meanings that later consumers need to keep separate. A file-only backward pawn,
count-only pawn-island event, blocker-count slider event or prose-only named structure can be true
and still be unusable for precise Support, Review, bots, drills or longitudinal analysis.

This RFC repairs that shared source layer once. It defines 23 versioned source projections across
eight source families and seven literal style atoms. It does **not** activate a learner surface,
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
  | { readonly kind: "frozen_prefix"; readonly runId: string; readonly eventHead: string };
```

The value constructor receives a sealed source receipt for that exact grain. It may not accept a
caller-written FEN, node id, ply, color, role, square list or convention ref beside the receipt and
silently trust both. Position and edge payloads retain literal FEN/move identity; candidate
payloads derive role/destination from the sealed exact legal move; frozen-prefix payloads derive
the learner actor and event range from the run.

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

## 3. Exact projection image

The checked JSON plan is normative for ids, versions, family, grain, convention authority,
execution owner and new/successor state. This section is normative for payload operands and
predicate boundaries.

### 3.1 Unobstructed king opposition v2

`rules.structural.reading.king_opposition@2` retains `color`, both king squares, `sideToMove`,
`form` (`direct | distant_three | distant_five`), ordered `betweenSquares`, and
`betweenSquaresEmpty: true`. Kings must align orthogonally, the gap must match the form, every
between square must be empty, and the opponent of `color` must move.

`rules.structural.event.king_opposition@2` retains before/after readings and exact edge identity;
its sign is `gained | lost`. Equal exact readings emit no event. Neither projection claims endgame,
importance, force, win/draw status or best play. Convention: `king-opposition-unobstructed@2`.
The v1 reading/event remain historical/research-only and cannot satisfy a v2 consumer.

### 3.2 Backward pawn v2

`rules.structural.reading.backward_pawn@2` emits one row per pawn and retains `color`, `pawn`,
`stop`, exact `controllers`, exact `supportPawns`, exact `aheadAdjacentPawns`, stop occupancy
(`empty | own | enemy` plus piece when occupied), `immediatePseudoCapture`, and
`halfOpenForColor`. It implements only the registered narrow convention: no same/not-ahead adjacent
support plus enemy pseudo-pawn control of the next square.

`rules.structural.event.backward_pawn@2` retains exact before/after rows, including pawn move or
removal; `{color,file}` is never the identity. `derived.pawn.consequence.backward_pawn_legal_advance@1`
exists only for an empty stop that is the exact submitted legal pawn move. It retains the complete
legal opponent pawn-capture replies after that hypothetical push. Pseudo-control alone cannot
populate the reply set. Convention: `backward-pawn@2` plus `legal-exchange@1` for the consequence.

### 3.3 Exact pawn-file groups

`derived.structural.reading.pawn_file_group@1` derives from sealed
`rules.structural.reading.pawn_connectivity@1`. One row retains `color`, `file`, all pawn squares,
adjacent occupied files, island identity, color-relative front/rear ordering, and literal
`isolated`/`doubled` booleans. Group size is unbounded; a pair-shaped payload fails.

`derived.structural.event.pawn_file_group@1` retains before/after groups and signs
`gained | lost | membership_changed`. A truth-preserving group membership change emits
`membership_changed`; an unchanged group emits nothing. This source says neither weak nor bad.

### 3.4 Line blocker membership v2

`rules.transition.event.slider_ray@2` retains the slider, board-edge endpoint, ordered ray,
`blockersBefore`, `blockersAfter` and exact edge. Signs are `gained | lost | membership_changed`;
equal blocker counts with different sets are `membership_changed`, and equal arrays emit nothing.
The board-edge endpoint is not a target. Pin/skewer/X-ray, latent discovery, played discovery,
target-capture clearance and quiet-square clearance remain distinct existing projections.
Convention: `line-blocker-membership@1`.

### 3.5 File state and access

`derived.activity.reading.file_state@1` derives from the exact pawn-file authority and retains
`file`, both colors' pawn sets and state `open | half_open_white | half_open_black | closed`.
Open is not half-open for either color.

`derived.activity.event.file_state@1` retains before/after state and the pawn/capture identity that
changed it when present. `derived.activity.event.file_access_revealed@1` retains an unchanged rook
or queen whose file becomes open or color-relative half-open. It is mutually exclusive with the
existing moved-heavy `derived.activity.event.open_file_occupancy@1` for the same cause. Neither
projection says active, improved, controls or should.

### 3.6 Pawn-island topology v2

`rules.structural.event.pawn_islands@2` retains, independently per color, exact before/after island
file partitions and member pawns. Signs are `count_gained | count_lost | topology_changed`.
Equal-count changed partitions emit `topology_changed`; rank-only motion with the same partition
emits nothing. A capture may therefore emit only an opponent-color event. Convention:
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
  source event. Spend-share arithmetic is downstream. Missing clock/control, non-positive available
  time or current greater than available yields typed unavailable.

Conventions: `fianchetto-configuration@1`, `extended-center-destination@1`,
`early-queen-ply@1`, `castling-first-decision@1`, and `clock-spend-input@1`.

## 4. Authored predicate compatibility and schema migration

Both pack and shape-entry schemas duplicate structural-expression grammar. They gain the same
optional closed value:

```ts
interface StructuralConventionRef {
  readonly id: string;
  readonly version: number;
}
```

The validator applies a generated kind→allowed-convention table. Absence means the legacy v1
semantics already used by committed content. Presence selects exactly one registered convention;
unknown ids, unsafe versions, wrong-kind pairs and a convention on a non-convention-bearing kind
fail. The two schema copies, TypeScript parser and authoring UI use one generated image.

The initial authored population is fixed by the research receipts:

- 8 king-opposition leaves in 2 documents;
- 5 backward-pawn leaves in 3 documents; and
- 23 outpost expressions in 3 shape documents.

Implementation first produces a read-only migration report with current/v2 truth traces and exact
file/pointer identities. No automatic migration is allowed: a human classifies each occurrence as
legacy or the explicit successor. Gate F remains active, so this RFC may land the schemas and
report without rewriting content. Any later content apply uses the content-wave closeout protocol.

Legacy author predicate truth and content digests remain byte-stable when the new ref is absent.
Source successor landing must not remove v1 readers needed for old runs/content; it only removes
v1 from new learner eligibility after downstream migration.

## 5. Source, value, operation and consumer boundaries

This RFC deliberately stops at exact source identity:

1. **Source implementation:** functions, payload types, manifest declarations and source adapters
   for the 23 rows may land after acceptance.
2. **Value authority:** `evidence-value-authority` supplies the sole sealed factory/profile for
   each final projection. A shape-only adapter cannot activate it.
3. **Operation:** the JSON plan assigns one owner to every row. One-edge/position/candidate rows go
   through `shared-candidate-evidence-packet`; path/frozen-prefix rows go through
   `recorded-semantic-path`; clocks wait on `recorded-clocks`.
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
   occupied-between, turn, gap, alignment and color negatives; reproduce 90 current / 61 v2 / 29
   blocked over the fixed population;
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
7. square/outpost: pinned pawn current control, future challenge, capture-migration-only refusal,
   empty/occupied distinction, rank/support negatives, h2h3/g4 and a2a3/b4 identity fixtures;
8. style atoms: all four color/wing fianchetto mirrors, wrong-color/missing-pawn negatives, all
   eight extended-centre squares plus adjacent negative, ply 15/16 queen boundary, promotions,
   Chess960-safe castling sides and every clock abstention arm; and
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

1. land/review the semantic convention register and provenance dependencies;
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
   eight source families plus style atoms; every row has one grain, authority, execution owner and
   new/successor state.
2. All nine handoffs are represented exactly once and all nine external owner boundaries remain
   excluded from the projection set.
3. The convention register precedes acceptance and this RFC's exact eight-member claim is added;
   a copied/private convention list fails.
4. Pack 0.33 and shape-entry 0.5 carry byte-equivalent convention-ref grammar and generated
   kind/ref compatibility; absent refs preserve current content truth/digests.
5. Source payloads retain every operand in §3. Dropping, swapping, spreading/JSON-forging or
   crossing a grain fails the value factory at runtime.
6. All research fixtures in §6 port to permanent suites with mutation controls and revision-bound
   population receipts.
7. v1 and successor semantics coexist explicitly. No in-place meaning rewrite, fallback from v2
   to v1, or v1 satisfaction of a successor consumer compiles.
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

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | convention register/provenance supplies the eight exact convention members and receipts | `semantic-convention-provenance` | accepted dependency + checked member claim | |
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
| [[D2390]] | replace scalar `authority` with typed source-dependency and convention sets; publish a valid exact convention claim |
| [[D2391]] | give recorded clock decisions an authenticating run-event/prefix grain and accepted recorded-clock source |
| [[D2392]] | reconcile every checked operation owner with its grain and separate reusable position facts from recorded occurrences |
| [[D2393]] | preserve actor and decision class through an exact contextual receipt before style/history use |
| [[D2394]] | define and fixture total event cardinality for truth-preserving subject-identity changes |

## Open questions

No owner ruling is required. The author must resolve [[D2390]]–[[D2394]] literally before the
fresh independent review: split source dependencies from conventions, use valid convention
lineage, give clocks an authenticating recorded-event grain, make operation routing agree with
grain, preserve actor/decision attribution and totalize successor event cardinality. Consumer
priorities, preset defaults, habit floors, bot trait strength, Review ranking and content
judgements remain with their existing owners.

## Changelog

- 2026-08-31: author audit returned the first pass on [[D2390]]–[[D2394]].
  `planning/foundation-source-identity/author-audit-2026-08-31.md` and
  `make foundation-source-author-audit` pin the five contradictions. This is not the required
  independent review and authorizes no implementation.
- 2026-08-31: first author pass from the D1736 shared source-repair wave. The scope is 23 exact
  source projections plus two schema lanes, with nine external ownership boundaries kept explicit.
  No production, schema, content, manifest, runtime, API, UX or archive bytes changed.
