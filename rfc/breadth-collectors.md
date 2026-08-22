# RFC: Breadth collectors — exact middlegame operands after Wave A

- **Status:** accepted — 2026-08-22, by claude as register owner on the buildability test, after the independent acceptance review (five convention repairs applied in place, [[D895]]); implementation follows `tactical-collectors` per the stated landing order. *(Previous line for history: draft 2026-08-22 — author amendment repairs D851–D859 after the Codex-side)*
  buildability return; the independent Claude acceptance review ran 2026-08-22, verified the
  D851–D859 repairs at the harness symbols and applied five blocker corrections in place
  (changelog); acceptance itself remains the owner/register action
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
| `candidate-majority@1` | A pawn is not passed and has no enemy pawn strictly ahead on its file. Supporting pawns are other same-color pawns on an adjacent file whose rank is the subject pawn's rank or any rank behind it from that color's perspective; enemy blockers are opposing pawns on adjacent files strictly ahead of the subject. At least one support is required and support count must be greater than or equal to blocker count. It is the disclosed D788 convention derived from historical Stockfish prior art and deliberately omits that source's backward-pawn classifier. |
| `king-zone@1` | Up to eight adjacent squares, excluding the king square. Attackers/defenders are distinct non-king pieces controlling at least one zone square. |
| `king-shelter@1` | Same-color pawns one or two forward ranks from the king on its file or adjacent files. |
| `material-role-signature@1` | Per color counts of P/N/B/R/Q. Asymmetry is the unordered role-count difference vector; its event-comparison magnitude is the D754 harness's sum of the five absolute per-role count differences — unweighted count arithmetic, which is what "increased asymmetry" means. King excluded and no piece-value scalar or verdict emitted. |
| `pressure-line@1` | A bishop/rook/queen slider and an enemy rook/queen target are collinear with exactly one occupied square between them, **and with that screen square removed the target lies in the slider's own chessops attack set from its square** — diagonals for a bishop, files/ranks for a rook, both for a queen; mere collinearity on a line the slider's role cannot travel (a bishop sharing a rank with the target, e.g. `4k3/8/8/8/1B1p3r/8/8/4K3 w - - 0 1`) never qualifies. That screen belongs to the target's color and has lower P1/N3/B3/R5/Q9 role value than the target; a king never qualifies as the screen. A retained relation across a slider move requires the same slider color/role moving from its old to new square plus the exact same screen square/color/role and target square/color/role; a replacement same-role slider does not satisfy it. The values state only the literal role relation. It does not claim the screen is pinned or the pressure matters. |

Each convention text and limitation ships verbatim in the manifest declaration.

Square control uses no hypothetical occupant. A **pseudo controller** is a piece whose chessops
attack set contains the target under current occupancy. A **legal controller** is that same source
piece only when the target also appears in its actual `allDests()` set after a valid clone makes
the piece's color the side to move and clears en passant. Thus a pawn's empty diagonal and a
friendly-occupied target are pseudo-only, an enemy non-king target is legal only when the capture
is legal, and an absolute pin can remove an edge from the legal set without removing it from the
pseudo set. An opposing king square is pseudo-only **by abstention, not by `allDests()`
exclusion**: a pseudo edge onto the enemy king's square is check, and chessops rejects any setup
whose side to move attacks the other king (`IllegalSetup.OppositeCheck`), so whenever a color
pseudo-attacks the enemy king that color's turn clone is invalid and its complete legal set
abstains — no valid legal set ever contains or omits a king square. If the per-color clone is
invalid for any reason, pseudo control remains available and that color's complete legal set
abstains `invalid_turn_clone`; individual squares never receive invented occupants.

Pawn-relation rules are literal: an opposing-pawn **contact** is a directed pawn-attack edge; a
**direct lock** is a White pawn immediately below a Black pawn on the same file; a passed pawn's
**blockers** are opposing pawns strictly ahead on its file or either adjacent file; **protection**
is a same-color pawn attack on the subject; and a **connected passed pair** is any two passed pawns
of one color on adjacent files, with rank distance deliberately unrestricted. Payloads retain both
square/color identities, and the unrestricted-rank limitation ships with the declaration.

### 3. Projections and measured dispositions

#### 3.1 Square control — exact topology for overlays

- `rules.square.reading.control@1`: for every square, pseudo-controller identities by color and
  legal-controller identities where a valid side-to-move clone can be constructed. Operands retain
  controller square/role/color, target, legal/pseudo status and abstention reason. En passant is
  cleared on turn clones. The exact pseudo/`allDests()` boundary is §2; grounding exact; legal clone
  invalidity abstains for that color's whole legal set while leaving its pseudo set intact.
- `rules.square.event.control@1`: before/after gained/lost controller sets joined by exact identity.
  Research disposition only. D771's pawn-made-destination-unsafe join measures 1.00×/1.02× and D754
  future-square contest .96×/.95×, so neither earns default prominence. Their low lift does not
  justify deleting the topology needed by touch/hover, theory and bot features.
- Fixtures: absolute pin separates pseudo from legal control; an empty pawn diagonal and a
  friendly-occupied defended square are pseudo-only; a legal enemy capture appears in both sets;
  a checking position (e.g. `4k3/8/8/8/8/8/8/4R1K1 b - - 0 1`) retains the checker's pseudo edge
  onto the king square while that color's complete legal set abstains `invalid_turn_clone` and
  every other pseudo byte survives — this one fixture pins both the §2 king rule and the
  abstention rule, because from a legal position a turn-flip clone can only be invalid through
  opposite check; pawn newly controls an empty minor destination; controller lost/gained mirror
  pair.
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
  `rules.pawn.reading.contacts@1` at the before position, the existing
  `rules.transition.event.capture@1` and `rules.structural.event.passed_pawn` authorities, plus exact
  move identity. `contact_executed` requires the before-state directed contact from the same moved
  pawn to the exact captured pawn; the existing `rules.transition.event.pawn_contact` remains the
  sole authority for contact **creation** and is not an input to execution. Contact creation is
  **not** emitted again.
- Measured dispositions are literal per kind: harassment 3.63×/3.18×; locked pair 3.89×/2.08×;
  contact creation 1.03×/.90×; contact execution 9.82×/15.07×; passage creation
  12.46×/13.45×/7.72× by horizon; capture-created passage 21.18×/14.45×/11.58×;
  candidate gain 2.80×/3.30× and horizon-shaped; protected-passer gain zero early played then
  2.11×/2.68× in the middle/late bands; connected-pair gain sparse early (one played event) then
  2.13×/2.73×; passer/candidate advancement phase-gated.
- No kind says break, favorable, dangerous, winning, minority attack, majority conversion or plan.
  Contact execution is a join over capture identity, not a duplicate capture detector.
- Fixtures: every kind positive plus geometry-neighbor negatives; direct-lock same-file/adjacent-rank
  positive and diagonal/non-adjacent negatives; protected passer versus non-pawn defender;
  connected passers at equal and unequal ranks plus same-file/non-passed negatives; blocked
  adjacent-file pawn for passed status; candidate same-rank/behind/ahead support and equality
  boundary pairs; early/late eligibility fixtures.

#### 3.4 Retained pawn sequences

- `derived.pawn.sequence.contact_timing@1`: observed recorded-path sequences with horizon-typed
  payloads. `created_survived_reply` carries exactly two consecutive move anchors and three ordered
  board nodes; `created_executed_next_own_move` carries exactly three consecutive anchors and four
  ordered nodes. Every anchor retains before/after node ids and FENs plus canonical UCI, adjacent
  anchors require byte-equal shared node/FEN, and the same moved pawn/contact square identities must
  survive every applicable edge. Counts: 11/125 and 1/45 authored/imported windows.
- `derived.pawn.sequence.harassment_pressure@1`: pawn newly attacks a named minor, that exact minor
  relocates on the immediately consecutive reply, and the same `pressure-line@1`
  slider/screen/target relation survives under §2's exact retention key — **the harassed minor is
  itself the relation's slider**, its relocation being the slider move the retention key is
  evaluated across, so a relocating knight can never satisfy this kind. It carries two anchors and
  three ordered nodes under the same continuity rule. Counts: 3/6 preserving cases after the
  measured relocation filter.
- Contact timing is `recorded_run`/`exact`; harassment pressure is
  `recorded_run`/`convention` because it consumes `pressure-line@1`. Both use manifest role `event`
  and research-only eligibility. Observed order does not establish intention, tempo, force, retreat
  quality or causality.
- Fixtures include the owner's `...Bg4 h3 ...Bh5` form, same geometry with a changed slider,
  screen or target, a replacement same-role slider, friendly screen/target, contact answered by
  another pawn, captured tracked piece, wrong horizon and path discontinuity.

#### 3.5 Defender identities and consequences

- `derived.tactic.defender_exposure@1`: an existing exact occupied-defence edge of the
  **non-moving side** — an opponent piece's pseudo edge onto an opponent-occupied square — is lost
  over the played edge, and the retained target (same color and role at the same square) gains a
  positive `legal-exchange@1` capture. The exposure test is D754's disclosed device verbatim: the
  after position with the turn returned to the mover and en passant cleared; when that clone is
  invalid the projection abstains `invalid_turn_clone` and the decision leaves the eligible
  denominator (675/717 authored and 545/577 imported decisions were eligible). Operands retain
  defender, target, attacker/capture line, pass-convention id and source event ids. The lost edge
  consumes `rules.square.event.control@1`'s exact **pseudo-controller** delta, not the shipped
  aggregate `occupied_defence` event, so one defender can disappear while another remains. This
  reproduces D754/D772's directed attack-edge domain. Measured 4.50×/6.52×.
- `derived.tactic.sequence.defender_consequence@1`: manifest-role `event`,
  `recorded_run`/`convention`, over recorded three-edge paths for (a) an existing defence edge
  lost on the first edge and the exact former target positively captured on the third, with a
  retained operand recording whether the first move captured the exact defender; (b) defender
  newly exposed to a positive `legal-exchange@1` capture under the mover-turn clone of §3.5's
  pass device (abstaining if invalid), relocating on the reply and losing its former edge, then
  the exact target positively captured. Measured imported counts: 29 for (a), of which 26 capture
  the exact defender on the first edge, and 13 for (b) — the D772 harness's three column counts,
  not two; authored 0/622, so canonical positive/disagreement fixtures are mandatory before
  landing. Its
  payload carries exactly three consecutive anchors and four ordered board nodes under §3.4's
  continuity rule; defender/target keys must survive or transform only through the explicitly
  recorded capture/relocation edge.
- It never emits removal, deflection, overload, forced or tactic success. Reply-wide causality would
  require a deeper separately versioned consequence.

#### 3.6 Material-role state

- `derived.material.reading.role_signature@1`: exact per-color P/N/B/R/Q counts and §2 asymmetry
  vector, derived from the shipped `rules.structural.reading.piece_count` family rather than reading
  the board a second time. `position_rules`/`exact`, inspector-only.
- `derived.material.event.role_asymmetry@1`: before/after vector joined to the existing
  `rules.structural.event.piece_count`, capture and promotion authorities with exact identities.
  Increased asymmetry — §2's sum-of-absolute-differences magnitude strictly rising — measured
  2.47×/4.35×. The broader signature-change event is more selective but
  too generic for a hint; both remain operands for capture/phase/theory modules.
- No scalar material advantage, imbalance quality or trade recommendation is emitted.

#### 3.7 King state

- `rules.king.reading.zone_state@1`: exact king square; `king-zone@1` squares; distinct attacker and
  defender identities; legal adjacent escapes — computed on the §2 per-color turn clone with en
  passant cleared, the escape set abstaining `invalid_turn_clone` when that clone is invalid, the
  D778 device that produced the eligibility denominators; `king-shelter@1` pawns. It consumes
  `rules.square.reading.control@1`'s pseudo-controller set for zone attacker/defender identities
  rather than computing a second attack map; the separate legal-controller set remains available
  for square-entry questions. Convention grounding.
- `rules.king.event.zone_state@1`: typed exact changes—escape set, attacker/defender set, shelter
  pawn set and king relocation—with before/after identities. Because the reading consumes
  `king-zone@1` and `king-shelter@1`, the event is conservatively
  `declared_convention`/`convention`; “exact changes” describes set fidelity, not a widened
  exactness declaration.
- `derived.king.captured_zone_defender@1`: generic capture identity joined to the captured piece's
  prior zone-defender role. Captured-square identity is `capture.to` for an ordinary capture and,
  for en passant, the square on `capture.to`'s file and `capture.from`'s rank; the derived event
  retains that arithmetic and requires the before-state defender at the exact resulting square.
  No second capture detector is permitted. This is the admitted form of the
  6.07×/5.12×/3.94× headline; its non-capture counterpart is 0/.07×/.38× and no generic
  “weakened king” event exists.
- Castling-to-more-shelter is a later derived/module join over Wave A's immutable castling event and
  this RFC's before/after shelter set (measured 10.08×/8.19×/5.31×), not an operand added to the
  prerequisite projection and not a duplicate producer. Escape reduction and zone-attacker gain are phase-aware inspector operands. Direct
  check uses the existing check event. No unsafe/exposed/attack/mating-net claim.

#### 3.8 Open-file occupancy

- `derived.activity.event.open_file_occupancy@1`: a moved rook/queen newly occupies a file whose
  class comes from the shipped `open_file`/`half_open_file` readings, retaining piece and class.
  For `half_open_file`, the consumed reading's color must equal the moved heavy piece's color.
  “Newly occupies” reproduces the D723 probe exactly: the after-position destination file is open or
  half-open for the mover, while the before-position source file was neither for that mover. It is
  a moved-piece event; a class change beneath a stationary rook/queen does not fire. Exact pawn
  identities may be attached from the same admitted position payload, but the join must not
  recompute or override the source reading's file class. Exact derived join; measured
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
3. **B3 — Convention fidelity.** All six named §2 convention texts/limitations and the exact
   square-control/pawn-relation rules beneath the table appear in the manifest; mirror and boundary
   fixtures pin occupancy, king, orientation, equality, rank and support/blocker cases.
4. **B4 — No duplicate authorities.** Capture, pawn-contact, passed-pawn, piece-count,
   open/half-open-file, castling, check, occupied-defence and legal-exchange facts are consumed by
   id, not recomputed under a second meaning. The one deliberate edge-level distinction is explicit:
   `defender_exposure@1` consumes this RFC's all-controller pseudo-edge delta because shipped
   `occupied_defence` is only a zero↔nonzero aggregate and cannot carry the research predicate.
   Wave A's castling declaration remains byte-identical; this RFC does not attach shelter operands
   to it.
5. **B5 — Fixtures/non-vacuity.** Every kind has positive and hard-negative canonical fixtures;
   declared abstentions have fixtures. Canonical sets are strict-interior. Population zeroes remain
   visible, specifically the authored defender sequences.
6. **B6 — Measured reproduction.** Permanent projections reproduce each quoted point estimate's
   direction and eligible denominators within 10%, or the landing report names a deliberate domain
   correction and returns the RFC if the product disposition would change.
7. **B7 — Sign/phase honesty.** Low/mixed kinds stay inspector/on-demand; horizon-gated kinds carry
   the declared phase eligibility operand. No global rank is derived from authored pack lift.
8. **B8 — Sequence identity.** Each kind carries its declared two- or three-edge horizon, respectively
   three or four ordered nodes, with byte-equal shared boundaries. Swapping an anchor, FEN,
   defender, pawn, minor, slider, screen or target makes the positive fixture fail.
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
- 2026-08-22: Codex author-side buildability return repaired D851–D859 in place: actual legal
  destinations define legal control; exact controller deltas replace aggregate defence for the
  defender join; pre-move contact state grounds execution; two-/three-edge payload horizons retain
  three/four nodes; pressure and pawn predicates copy their harness bytes; en-passant captured
  square and mover-relative half-open-file joins are pinned. Independent Claude review remains.
- 2026-08-22: independent Claude acceptance review verified the D851–D859 repairs against the
  harness sources and corrected five defects the amendment left: (1) the opposing-king-square rule
  in §2 claimed an `allDests()` exclusion, but chessops `IllegalSetup.OppositeCheck` makes the
  checking color's turn clone invalid, so king-square control is pseudo-only **by whole-set
  abstention** — the §3.1 fixture now pins the check position `4k3/8/8/8/8/8/8/4R1K1 b - - 0 1`
  and no longer demands an unsatisfiable non-check invalid clone; (2) `pressure-line@1` omitted
  the harness's slider-ray compatibility clause, admitting a bishop merely collinear with a
  screened rook along a rank (`4k3/8/8/8/1B1p3r/8/8/4K3 w - - 0 1`) — the convention now requires
  the target inside the slider's own attack set with the screen removed, and excludes king
  screens; (3) `defender_exposure@1` lacked D754's disclosed pass state and its
  `invalid_turn_clone` abstention, without which the 4.50×/6.52× eligible denominators
  (675/717, 545/577) are unreproducible; (4) `defender_consequence@1` paired the imported count
  29 with the captured-defender kind that measured 26 — the counts are now the harness's three
  (29 edge-lost, 26 captured subset, 13 relocated); (5) "increased asymmetry" had no ordering
  over the §2 vector — the D754 sum-of-absolute-per-role-differences magnitude is now the pinned
  comparison. Also pinned: the harassed minor is itself the surviving pressure relation's slider
  (§3.4); protected-passer and connected-pair measured priors are quoted in §3.3; the escape-set
  clone abstention is declared in §3.7. Two labeled boundary fixtures were added to
  `tools/d723-breadth-harness/breadth.test.ts` (ray compatibility) and
  `tools/d754-wave-b-harness/wave-b.test.ts` (pass-state opposite-check abstention); both pass.
