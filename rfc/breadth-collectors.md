# RFC: Breadth collectors — exact middlegame operands after Wave A

- **Status:** draft 2026-08-22 — amended after the joint collector buildability review repaired
  D826; an independent acceptance review is still required
- **Author:** codex, on the owner-opened breadth/evidence-foundation program and D802 routing
- **Created:** 2026-08-22
- **Design refs:** `design/03-product-breadth.md` §Intelligence and explanation;
  `design/05-in-run-experience.md` §3/§5 (named modules, detection/significance split)
- **Exploration gate:** complete in `planning/evidence-foundation-ux/plan.md` Phase 2b. Evidence:
  `middlegame-evidence-and-style-taxonomy.md`, `wave-b-breadth-probe.md`,
  `legal-square-denial.md`, `identity-retaining-three-edge-consequences.md`,
  `pawn-conversion-events.md`, `pawn-lever-and-candidate-timing.md`,
  `decomposed-king-state.md`, `identity-retaining-mobility.md`, and
  `bounded-reply-semantics.md`.
- **Depends on:** `tactical-collectors.md` landing first (`legal-exchange@1` and compiled
  `reply_breadth@1`). Builds on implemented F1/F2 evidence manifest and semantic-event layers.
- **Parent / amends:** additively extends `archive/evidence-contract-manifest.md` and
  `archive/semantic-evidence-selection.md`; sibling successor to `tactical-collectors.md`, not an
  amendment of it
- **Supersedes / superseded by:** —
- **Planning:** `planning/evidence-foundation-ux/` Phase 2d (dedicated implementation plan created
  when accepted)

```tabiya-claims
none
```

**Why `none`.** All deliverables are derived runtime projections and research/inspector-only
events. No authorable pack enum, schema, migration, evidence-kind member, stored event or content
document changes. A later authorable-vocabulary RFC must make and register that separate decision.

## Summary

This RFC turns the completed Phase-2b research into a second, bounded collector wave. It adds the
exact operands the tactical Wave-A RFC deliberately does not own: square controllers, per-piece
legal/locally-non-losing destinations, pawn contacts/candidates/passage events, king zone/shelter/
escape state, material-role signatures, defender-exposure joins and identity-retaining observed
sequences.

It does **not** add a hint, rank evidence, grade a move or let an LLM infer a plan. Every projection
lands `inspector_only` or eligible solely for `research.semantic_selection@1`. Phase 3 modules decide
whether an exact event is significant enough to show and which independent authority—engine,
tablebase, theory, explorer, authored claim—may add value or plan language.

The split from `tactical-collectors.md` is architectural, not deferral-by-vagueness. Wave A supplies
the legal-exchange and one-reply prerequisites and the familiar tactic families. This RFC owns the
measured positional/multi-edge breadth. Its closed projection list is Appendix A; its refused
families are explicit in §4.

## Motivation

F1/F2 made evidence typed and selectable but did not create the missing chess operands. Wave A is
already a large tactical prerequisite job; folding all Phase-2b discoveries into it would violate
RFC-0000's bounded-scope rule and make the dependency order unreadable. Leaving the discoveries in
dossiers would recreate the opposite failure: researched capabilities with no implementation owner.
This RFC is the bounded bridge, and D802–D807 are its executable ledger scope.

## Specification

### 1. Shared collector contract

Every projection below follows the implemented evidence-manifest contract:

1. a registered producer, projection id, role, grounding, exactness, implementation path,
   availability and abstention declaration;
2. typed operands retaining exact piece/square identities and before/after sets—counts alone fail;
3. mirror fixtures, positive and hard-negative fixtures, and abstention fixtures where applicable;
4. canonical-fixture non-vacuity plus separate authored/imported measurements whose honest zeroes
   are retained rather than “fixed”;
5. no learner sentence beyond literal identity/count/set description;
6. no production module/workflow/preset consumer in this landing;
7. no content mutation or automatic relabelling.

New producer ids are `rules.square`, `rules.mobility`, `rules.pawn`, `rules.king`,
`derived.pawn`, `derived.material`, `derived.king` and `derived.activity`; `derived.tactic` is
supplied by the Wave-A dependency. They are added to the catalogue's closed producer-id inventory in
the same change. Observed sequences use manifest role `event` and `recorded_run` grounding;
“sequence” in an id describes the payload horizon, not a new `ProjectionRole` member (the shipped
union remains `predicate | reading | event | source_record`).

Grounding rule: pure legal-board arithmetic is `position_rules`/`exact`; a projection consuming
`legal-exchange@1`, a declared value table or one of §2's named conventions is conservatively
`declared_convention`/`convention`. Derived projections inherit the weakest input and list every
input id. Observed sequences are facts about a recorded path, never claims that the first move
caused or forced the last.

#### 1.1 Closed production-site census

| Site | Responsibility |
|---|---|
| `packages/runtime/src/square-control.ts` (new) | exact pseudo/legal controller sets and deltas |
| `packages/runtime/src/mobility.ts` (new) | exact legal and locally-non-losing destination sets |
| `packages/runtime/src/pawn-dynamics.ts` (new) | contact, candidate, passage and retained pawn sequences |
| `packages/runtime/src/king-state.ts` (new) | zone, shelter and escape operands/events |
| `packages/runtime/src/material-state.ts` (new) | role signatures and asymmetry events |
| `packages/runtime/src/semantic-evidence.ts` | `derived.tactic`, `derived.king` and `derived.activity` joins plus recorded-path sequence compilation |
| `packages/runtime/src/evidence-catalog.ts` | Appendix-A declarations and dispositions |
| `packages/runtime/src/evidence-source-adapters.ts` | exact-key, brand-sealed adapters for every new reading/event payload |
| `packages/runtime/src/index.ts` | public runtime exports |
| `docs/semantic-evidence.md` | implemented projection semantics and refusal ceilings |
| `docs/evidence-contract.md` | producer/projection inventory only |

Any additional production site returns this RFC for an impact amendment before implementation.

### 2. Pinned conventions

| id | exact content |
|---|---|
| `local-non-losing@1` | For a legal capture destination, `legal-exchange@1 >= 0`. For a quiet destination, after the piece arrives the opponent has no legal capture of it with `legal-exchange@1 > 0`. This is one-exchange local safety, never engine safety or goodness. |
| `candidate-majority@1` | A pawn is not passed; has no enemy pawn ahead on its file; has at least one friendly pawn beside/behind on an adjacent file; and that support count is at least the enemy-pawn count ahead on adjacent files. It is the disclosed D788 convention derived from historical Stockfish prior art and deliberately omits that source's backward-pawn classifier. |
| `king-zone@1` | Up to eight adjacent squares, excluding the king square. Attackers/defenders are distinct non-king pieces controlling at least one zone square. |
| `king-shelter@1` | Same-color pawns one or two forward ranks from the king on its file or adjacent files. |
| `material-role-signature@1` | Per color counts of P/N/B/R/Q. Asymmetry is the unordered role-count difference vector; king excluded and no scalar piece-value verdict emitted. |
| `pressure-line@1` | A retained slider→screen→target ray with exactly one lower-value screen and a rook/queen target, using P1/N3/B3/R5/Q9 only to state the literal role relation. It does not claim the screen is pinned or the pressure matters. |

Each convention text and limitation ships verbatim in the manifest declaration.

### 3. Projections and measured dispositions

#### 3.1 Square control — exact topology for overlays

- `rules.square.reading.control@1`: for every square, pseudo-controller identities by color and
  legal-controller identities where a valid side-to-move clone can be constructed. Operands retain
  controller square/role/color, target, legal/pseudo status and abstention reason. En passant is
  cleared on turn clones. Grounding exact; legal clone invalidity abstains per color.
- `rules.square.event.control@1`: before/after gained/lost controller sets joined by exact identity.
  Research disposition only. D771's pawn-made-destination-unsafe join measures 1.00×/1.02× and D754
  future-square contest .96×/.95×, so neither earns default prominence. Their low lift does not
  justify deleting the topology needed by touch/hover, theory and bot features.
- Fixtures: absolute pin separates pseudo from legal control; pawn newly controls an empty minor
  destination; controller lost/gained mirror pair; invalid clone abstention.
- This is additive beside the shipped count-only `attacked_squares_changed` reading and
  occupied-target `occupied_attack` event: it retains **all-square controller identity**, which
  neither existing projection carries. It redefines neither id.

#### 3.2 Piece mobility — sets, never only counts

- `rules.mobility.reading.piece_destinations@1`: B/N/R/Q identity, legal destinations and
  `local-non-losing@1` subset. `declared_convention`/`convention`; invalid turn clone abstains.
- `rules.mobility.event.piece_destinations@1`: exact gained/lost legal and safe sets for a retained
  piece; kinds include moved-piece gain, opponent loss and zero-safe transition. Count deltas are
  derived display operands, not the identity.
- Measured disposition: legal loss .71×/1.03×; safe loss 1.14×/1.35×; non-capture safe loss
  .93×/1.05×; moved gain 1.20×/1.29×; zero-safe 1.12× uncertain / 2.58×. All inspector/on-demand.
  Zero-safe is never rendered “trapped”; Wave A's separate attacked-piece predicate is required.
- Fixtures: legal pin restriction, legal-but-newly-unsafe destination, moved-piece gain, zero-safe
  positive and unattacked zero-mobility hard negative.

#### 3.3 Pawn state and transitions

- `rules.pawn.reading.contacts@1`: exact opposing-pawn contacts, directly locked pairs, passed-pawn
  blockers, protection and connected-passer pairs. `position_rules`/`exact`.
- `rules.pawn.reading.candidate_majority@1`: per-pawn support/blocker identities and counts under
  §2. `declared_convention`/`convention`.
- `rules.pawn.event.dynamics@1`: one typed rules event projection with kinds and required operands:
  `locked_pair_gained`, `minor_harassed`, `protected_passer_gained`,
  `connected_passer_pair_gained`, `candidate_majority_gained`, `candidate_majority_advanced`.
- `derived.pawn.event.transitions@1`: typed joins `contact_executed`,
  `moved_pawn_became_passed`, `capture_created_moved_passer`, and `passed_pawn_advanced`. It consumes
  the existing `rules.transition.event.pawn_contact`, `rules.transition.event.capture@1` and
  `rules.structural.event.passed_pawn` authorities plus exact move identity. Contact creation is
  already `pawn_contact` and is **not** emitted again.
- Measured dispositions are literal per kind: harassment 3.63×/3.18×; locked pair 3.89×/2.08×;
  contact creation 1.03×/.90×; contact execution 9.82×/15.07×; passage creation
  12.46×/13.45×/7.72× by horizon; capture-created passage 21.18×/14.45×/11.58×;
  candidate gain 2.80×/3.30× and horizon-shaped; passer/candidate advancement phase-gated.
- No kind says break, favorable, dangerous, winning, minority attack, majority conversion or plan.
  Contact execution is a join over capture identity, not a duplicate capture detector.
- Fixtures: every kind positive plus geometry-neighbor negatives; blocked adjacent-file pawn for
  passed status; candidate support/blocker boundary pair; early/late eligibility fixtures.

#### 3.4 Retained pawn sequences

- `derived.pawn.sequence.contact_timing@1`: observed recorded-path sequences
  `created_survived_reply` and `created_executed_next_own_move`, retaining the same pawn/contact and
  all three source nodes. Counts: 11/125 and 1/45 authored/imported windows.
- `derived.pawn.sequence.harassment_pressure@1`: pawn newly attacks a named minor, that exact minor
  relocates on the reply, and the same `pressure-line@1` slider/screen/target relation survives.
  Counts: 3/6 preserving cases after the measured relocation filter.
- Contact timing is `recorded_run`/`exact`; harassment pressure is
  `recorded_run`/`convention` because it consumes `pressure-line@1`. Both use manifest role `event`
  and research-only eligibility. Observed order does not establish intention, tempo, force, retreat
  quality or causality.
- Fixtures include the owner's `...Bg4 h3 ...Bh5` form, same geometry with a changed target, contact
  answered by another pawn, captured tracked piece and path discontinuity.

#### 3.5 Defender identities and consequences

- `derived.tactic.defender_exposure@1`: an existing exact occupied-defence edge is lost and the
  retained target gains a positive `legal-exchange@1` capture. Operands retain defender, target,
  attacker/capture line and source event ids. Measured 4.50×/6.52×.
- `derived.tactic.sequence.defender_consequence@1`: manifest-role `event`,
  `recorded_run`/`convention`, over recorded three-edge paths for (a) exact defender
  captured, edge lost, exact former target positively captured; (b) defender newly exposed,
  relocates, edge lost, exact target positively captured. Measured imported counts 29 and 13;
  authored 0/622, so canonical positive/disagreement fixtures are mandatory before landing.
- It never emits removal, deflection, overload, forced or tactic success. Reply-wide causality would
  require a deeper separately versioned consequence.

#### 3.6 Material-role state

- `derived.material.reading.role_signature@1`: exact per-color P/N/B/R/Q counts and §2 asymmetry
  vector, derived from the shipped `rules.structural.reading.piece_count` family rather than reading
  the board a second time. `position_rules`/`exact`, inspector-only.
- `derived.material.event.role_asymmetry@1`: before/after vector joined to the existing
  `rules.structural.event.piece_count`, capture and promotion authorities with exact identities.
  Increased asymmetry measured 2.47×/4.35×. The broader signature-change event is more selective but
  too generic for a hint; both remain operands for capture/phase/theory modules.
- No scalar material advantage, imbalance quality or trade recommendation is emitted.

#### 3.7 King state

- `rules.king.reading.zone_state@1`: exact king square; `king-zone@1` squares; distinct attacker and
  defender identities; legal adjacent escapes; `king-shelter@1` pawns. It consumes
  `rules.square.reading.control@1`'s pseudo-controller set for zone attacker/defender identities
  rather than computing a second attack map; the separate legal-controller set remains available
  for square-entry questions. Convention grounding.
- `rules.king.event.zone_state@1`: typed exact changes—escape set, attacker/defender set, shelter
  pawn set and king relocation—with before/after identities. Because the reading consumes
  `king-zone@1` and `king-shelter@1`, the event is conservatively
  `declared_convention`/`convention`; “exact changes” describes set fidelity, not a widened
  exactness declaration.
- `derived.king.captured_zone_defender@1`: generic capture identity joined to the captured piece's
  prior zone-defender role. This is the admitted form of the 6.07×/5.12×/3.94× headline; its
  non-capture counterpart is 0/.07×/.38× and no generic “weakened king” event exists.
- Castling-to-more-shelter is a later derived/module join over Wave A's immutable castling event and
  this RFC's before/after shelter set (measured 10.08×/8.19×/5.31×), not an operand added to the
  prerequisite projection and not a duplicate producer. Escape reduction and zone-attacker gain are phase-aware inspector operands. Direct
  check uses the existing check event. No unsafe/exposed/attack/mating-net claim.

#### 3.8 Open-file occupancy

- `derived.activity.event.open_file_occupancy@1`: a moved rook/queen newly occupies a file whose
  class comes from the shipped `open_file`/`half_open_file` readings, retaining piece and class.
  Exact pawn identities may be attached from the same admitted position payload, but the join must
  not recompute or override the source reading's file class. Exact derived join; measured
  1.47×/1.24×, so on-demand only.
- It does not say active, controls the file, belongs there or improved. Those require mobility,
  target, theory or engine inputs in a module.

### 4. Refused and deferred

This RFC deliberately does not create:

- global “restriction,” “activity,” “weak square,” “outpost,” “pawn break,” “king attack” or
  “initiative” events—the exact operands above are the reusable layer;
- generic slider coordination, connected-rook or pawn-contact prominence: measured near background
  or population-reversing, though their exact existing operands remain inspectable;
- a longer-than-three-edge tactic search, forced win, sacrifice or mating-net classifier;
- engine eval/WDL, Maia policy, explorer frequency, opening identity, theory or authored claims;
  those remain separate producers and join only in modules;
- player types, habit verdicts or bot personalities. F8/F9 consume these events with their own
  opportunity/phase/policy contracts;
- authorable pack vocabulary or content relabelling.

## Deviations from design

None. This RFC implements the intent-tier detection/significance split and generic evidence pool.
Its split from tactical Wave A is an RFC process decision, not a product-intent change.

## Acceptance criteria

1. **B1 — Closed registration.** All 18 Appendix-A projection ids exist exactly once; manifest and
   semantic-evidence checks pass; no undeclared sibling id appears.
2. **B2 — Operand fidelity.** Runtime types preserve every named identity/set. A fixture fails any
   implementation that keeps only counts for control, mobility, king or pawn relations.
3. **B3 — Convention fidelity.** All six §2 texts/limitations appear in the manifest; mirror and
   boundary fixtures pin orientation, equality and support/blocker cases.
4. **B4 — No duplicate authorities.** Capture, pawn-contact, passed-pawn, piece-count,
   open/half-open-file, castling, check, occupied-defence and legal-exchange facts are consumed by
   id, not recomputed under a second meaning. Wave A's castling declaration remains byte-identical;
   this RFC does not attach shelter operands to it.
5. **B5 — Fixtures/non-vacuity.** Every kind has positive and hard-negative canonical fixtures;
   declared abstentions have fixtures. Canonical sets are strict-interior. Population zeroes remain
   visible, specifically the authored defender sequences.
6. **B6 — Measured reproduction.** Permanent projections reproduce each quoted point estimate's
   direction and eligible denominators within 10%, or the landing report names a deliberate domain
   correction and returns the RFC if the product disposition would change.
7. **B7 — Sign/phase honesty.** Low/mixed kinds stay inspector/on-demand; horizon-gated kinds carry
   the declared phase eligibility operand. No global rank is derived from authored pack lift.
8. **B8 — Sequence identity.** All three nodes and exact subjects survive compilation; swapping the
   defender, pawn, minor or target between nodes makes the positive fixture fail.
9. **B9 — Refusal vocabulary.** New manifest semantics/sentence ceilings contain none of:
   `good`, `bad`, `best`, `blunder`, `mistake`, `forced`, `winning`, `weak`, `dominates`, `plan`,
   `intends`, `break now`, `unsafe`, `exposed`, except inside explicit limitation/refusal text.
10. **B10 — Surface silence.** No production module, workflow, preset or sentence renderer consumes
    these projections; all reading projections are inspector-only and events—including observed
    sequences—are eligible only for research semantic selection.
11. **B11 — No schema/content impact.** Shared-resource checks pass; schemas, migrations,
    `EvidenceGrounding`, `content/` and authored vocabulary are byte-identical.
12. **B12 — Production-site closure.** Production edits are a subset of §1.1; an additional site
    requires a pre-landing amendment.
13. **B13 — Focused verification.** New unit/manifest/measurement suites pass, existing F1/F2 and
    tactical-collector suites remain green, and the landing report records focused commands.
14. **B14 — Closeout.** The implementation commit flips D802–D807,
    appends the exploration log entry and archives this RFC per the lifecycle protocol.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Production-module eligibility for the admitted breadth projections; this RFC deliberately lands them inspector/research-only so significance and workflow policy cannot leak into collectors | `planning/evidence-foundation-ux/plan.md` Phase 3 | the Phase-3 module RFC's landing commit | |

## Open questions

None require an owner ruling. Module prominence, prose, presets, authorable vocabulary, bot-policy
weights and habit/type interpretation are explicitly later contracts rather than hidden choices.
An independent buildability review may return this draft for operand/fixture/site defects before
acceptance.

## Appendix A — closed projection list

Unit: projection id; total **18**.

| # | projection id | section | role |
|---:|---|---|---|
| 1 | `rules.square.reading.control@1` | 3.1 | reading |
| 2 | `rules.square.event.control@1` | 3.1 | event |
| 3 | `rules.mobility.reading.piece_destinations@1` | 3.2 | reading |
| 4 | `rules.mobility.event.piece_destinations@1` | 3.2 | event |
| 5 | `rules.pawn.reading.contacts@1` | 3.3 | reading |
| 6 | `rules.pawn.reading.candidate_majority@1` | 3.3 | reading |
| 7 | `rules.pawn.event.dynamics@1` | 3.3 | event |
| 8 | `derived.pawn.event.transitions@1` | 3.3 | event |
| 9 | `derived.pawn.sequence.contact_timing@1` | 3.4 | event |
| 10 | `derived.pawn.sequence.harassment_pressure@1` | 3.4 | event |
| 11 | `derived.tactic.defender_exposure@1` | 3.5 | event |
| 12 | `derived.tactic.sequence.defender_consequence@1` | 3.5 | event |
| 13 | `derived.material.reading.role_signature@1` | 3.6 | reading |
| 14 | `derived.material.event.role_asymmetry@1` | 3.6 | event |
| 15 | `rules.king.reading.zone_state@1` | 3.7 | reading |
| 16 | `rules.king.event.zone_state@1` | 3.7 | event |
| 17 | `derived.king.captured_zone_defender@1` | 3.7 | event |
| 18 | `derived.activity.event.open_file_occupancy@1` | 3.8 | event |

## Changelog

- 2026-08-22: drafted from completed Phase 2b under D802. Claims no shared lane; production code
  remains blocked on acceptance and on `tactical-collectors` landing first.
- 2026-08-22: joint collector buildability review repaired D826. Castling-to-more-shelter remains
  a later derived/module join instead of mutating Wave A's closed castling event; king-state event
  grounding is explicitly convention-level while its retained set deltas remain exact.
