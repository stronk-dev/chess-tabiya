# RFC: Semantic collectors — Wave-C basic tactics after Waves A/B

- **Status:** implementing 2026-08-22 — 12 of 14 registered projections compile. **The held
  promotion pair was returned by its third fresh independent review on 2026-09-01 for
  [[D2469]]–[[D2472]]; another author repair is required.** Geometry and recorded tablebase inputs
  from the prior repair still require their exact value-authority
  factory receipts; the available outcome returns one sealed derivation receipt retaining geometry,
  legal moves and the selected source; no-race is distinct from input failure; and the duplicate
  `promotionWithCheck` operand is removed in favour of the existing exact check producer joined by
  FEN/move identity. `make semantic-collectors-promotion-second-author-repair` is the positive
  author contract. The original 12 projections remain
  accepted/implemented; the amendment does not reopen or relabel their bytes. Accepted 2026-08-22
  by claude as register owner on the buildability test, after cross-review with corrections applied
  in place (seven blockers; all eight observed ids verified **checkable, not
  intention-inference**, after the causal-binding clauses were pinned from the measured bytes).
  *(Prior line for history: draft 2026-08-22 — executes the Wave-C foundation-closure handoff)*
  (`planning/evidence-foundation-ux/wave-c-foundation-closure.md`); ready for independent
  cross-review before acceptance
- **Author:** claude, on codex's Wave-C order (item 2) and the D872 program
- **Created:** 2026-08-22
- **Design refs:** `design/05-in-run-experience.md` §5 (*"detection is cheap, significance is
  not"* — every collector ships detection with the significance judgement structurally refused)
  and §3b (patterns named from a validated library, never recommended);
  `design/03-product-breadth.md` §Intelligence and explanation
- **Exploration gate:** the D872 research program (opened 2026-08-22, no implementation
  authority of its own), closed to the drafting gate by
  `wave-c-foundation-closure.md` §6.7 (*"Draft only admitted RFCs"*) and the Phase-2e state in
  `planning/evidence-foundation-ux/plan.md` (*"collector RFC drafting can begin for the admitted
  rules/source projections"*). Evidence: `design/research/basic-semantic-tactics-stage-0.md`
  (D902, D908, D909, D916, D919, D920), `design/research/runtime-opening-identity.md` (D894),
  and the executable producer→consumer matrix
  `tools/d872-semantic-tactics-harness/consumer-matrix.test.ts` (D920)
- **Depends on:** `tactical-collectors.md` landing first (`legal-exchange@1`, compiled
  `reply_breadth@1`, the capture event, `mate_in_one@1`, and the amended
  `promotion_pressure@1` per D922), then `breadth-collectors.md`
  (the `derived.pawn` producer and `pawn-dynamics.ts` site, the recorded-path sequence
  compilation in `semantic-evidence.ts`, the §3.4 two/three-edge continuity rule, and the
  disclosed D754 pass device with its `invalid_turn_clone` abstention). Draft
  `evidence-value-authority.md` must be accepted and implemented with the exact pawn-contact,
  legal-map and recorded-tablebase factory receipts consumed by §3.7; the live outcome also waits
  on accepted/implemented `provider-exchange-and-execution.md`. Landing order is therefore
  **2c → 2d → evidence-value/provider dependencies → 2e** and is normative
- **Parent / amends:** additively extends `archive/evidence-contract-manifest.md` (F1) and
  `archive/semantic-evidence-selection.md` (F2); sibling successor to `tactical-collectors.md`
  and `breadth-collectors.md`, an amendment of neither. Redefines no shipped identity
- **Supersedes / superseded by:** —
- **Planning:** `planning/evidence-foundation-ux/` Phase 2e (dedicated implementation plan
  created when accepted)

```tabiya-claims
none
```

**Why `none`, verified at HEAD rather than assumed.** Every deliverable is an additive `@1`
projection identity declared in `packages/runtime/src/evidence-catalog.ts` through the existing
`producer()`/`projection()` helpers — the F2 precedent both sibling collector RFCs already used.
No member is added to the closed `EVIDENCE_PRODUCER_IDS` inventory (`evidence-catalog.ts:75-81`):
the fourteen registered projections ride the existing `rules.tactic` (`:339`) and `derived.tactic`
(`:408`) producers plus `breadth-collectors.md`'s `derived.pawn` producer, which that accepted RFC
adds. No pack/run/shape/principle schema, migration, `EVIDENCE_KINDS` member, `EvidenceGrounding`
member, `EvidenceTiming` member (`at_commit` is `learner-modules.md`'s declared claim — not
double-claimed here), or `content/` byte moves. Register heads verified with
`node tools/register-check.mjs` at drafting HEAD `7181834`: pack 0.27 (next free 0.30), run 0.17,
shape-entry 0.3, principle-entry 0.1, migration 24, evidence-kinds 7 members with `citable_text`
claimed by `pack-population-provenance` — this RFC contests none of them. Semantic events remain
derived, never persisted; no table is created.

## Summary

This RFC turns the completed Wave-C research into the third, final bounded collector wave of the
1.0 foundation: the **basic semantic tactics** — defender removal, deflection, attraction,
interference, clearance, zwischenzug, overload, bounded mating nets and promotion races — that
`wave-c-foundation-closure.md` rules are *"basic product capabilities"*, not optional depth. The
concepts are plain 1.0 chess semantics even where the bounded proof machinery beneath them
(complete-reply enumeration, a 250,000-node legal-tree mate solver, a Syzygy outcome join) is
deeper than Wave A's one-ply arithmetic.

It adjudicates all **20** candidate identities of the executable producer→consumer matrix
(`tools/d872-semantic-tactics-harness/consumer-matrix.test.ts`, the D920 instrument — this RFC's
Appendix source): **14 are registered here** (Appendix A); **1** — per-pawn promotion geometry —
is **bound to the already-amended sibling id** `derived.tactic.promotion_pressure@1` (the D922
amendment) rather than duplicated; **3** opening/theory rows are **assigned to the runtime
opening-identity RFC** (C3/F4/F7); **2** engine-Review rows are **assigned to the Review
successor** (codex's order items 3–4, D917/D918). The closure's §6.7 rule — *"Do not combine
source adapters, engine Review and tactical semantics merely because they all produce evidence"*
— is why the last five are assigned, not absorbed.

The compiled candidate reach of the full 20-row matrix is **Support 16, Review 20, bots 13,
theory 3, inspector 20, authoring 17 — and habit classification 0**, with pre-commit rows
rules-grounded and exposing no move, line, or evaluation. Every projection lands
**research/inspector-only**; production eligibility is `learner-modules.md`'s to grant through
its literal-id amendment (Discharge D1). Key semantic decisions are pinned as measured, not
reopened: **overload separated three ways** (§3.5, the `9f7112c` rejection), **mate-next exact at
its bounded horizon** (§3.6, D908), and **promotion geometry never grades a race** (§3.7, D909).

## Motivation

The closure verdict: *"A credible chess product still needs the basic semantic tactics that
players expect… The extra proof depth does not make the capability optional or post-1.0"*, and
its closure rule — *"A foundation capability is complete when its versioned producer, exact
operands, proof horizon, abstention and consumer eligibility are explicit. The platform may
refuse a concept it cannot establish; it may not silently replace it with geometry or LLM
prose."* Waves A and B supply exact operands (duties, exchanges, rays, reply sets, king and pawn
state); without this wave, the names learners actually use — *deflection*, *overload*, *mating
net* — either stay unsayable or get manufactured by geometry renaming or an LLM, the two named
failure modes (law 8; the closure's layer table).

The research is done and falsified its own first drafts: the broad overload rule fired on
52/754 authored and 515/6,991 imported moves and was rejected as noise (`9f7112c`); the
any-piece attraction rule reached 100% tag sensitivity while firing on 19.0% of negative
controls and was cut to the heavy-piece form (D902); all-reply survival as an admission floor
would have suppressed every authored initiation (stage-0 §7); the geometric race verdict got
the outcome backwards on two of ten recorded races (D909); Lichess has **no overload oracle at
all** — its `overloading()` returns `False` unconditionally (stage-0 §3).

**Scope boundary.** This RFC owns the semantic producers and their registration only. It does
**not** own: module contracts or presets (Phase 3/5), the literal-id module amendment (D921 —
`learner-modules.md`'s), the Story mate-type repair or the multi-source post-game Review
compiler (D917/D918 — the Review successor's, codex's items 3–4; **cited, not absorbed**), the
runtime opening-identity adapter (C3 → its own RFC, exactly as `tactical-collectors.md` §3.15
split it), bot policy (F8), habit aggregation (F9 — deliberately zero rows, §5.1), content work,
or corpus expansion (Gate F).

## Specification

Normative vocabulary is Wave A's: *state* / *transition* / *consequence*; *valence* is never
emitted — every declaration carries `valence`-free signs and the F1 rule **"Derivation composes
evidence; it never composes judgement"** binds verbatim. An implementer needing more than §1
plus the per-collector spec has found a spec bug, not a licence to invent.

### §1 — Registration contract (shared by every collector)

1. **Producer + projections.** All fourteen ids are declared in
   `packages/runtime/src/evidence-catalog.ts` as additive `@1` identities on the producers
   named in Appendix A. No new producer id; no shipped declaration changes byte-for-byte.
2. **Operands are retained, not summarized.** Each §3 spec lists required operands; event
   families enforce them through the existing `requiredOperands` mechanism
   (`SEMANTIC_EVENT_DECLARATIONS`, `evidence-catalog.ts:516-529`).
3. **Grounding and exactness obey the shipped checker, in the conservative direction.** The
   F1 derivation-widening check (`evidence-contract.ts:456-474`) is load-bearing: a derived
   projection over **mixed** input groundings **must** declare `declared_convention`; one with
   any non-`exact` input must not declare `exact`; its `answerContent` must be a subset of its
   inputs' union; and **if any input can abstain, the derived projection declares
   `abstention.possible: true` with `input_abstained` among its reasons** — the mechanics the
   sibling RFCs used implicitly, stated here because every §3.2–§3.7 derived row trips them.
   The matrix's research grounding vocabulary maps accordingly (§1.2); the mapping never
   widens authority — a tablebase category keeps its `tablebase_exact` authority at its
   source id, cited by derivation input, never recomputed.
4. **The disclosed pass device, wherever a turn is flipped** (the D751 hazard, now
   thrice-found: `threat@1`, `trapped@1`, breadth's `defender_exposure@1`). Every predicate
   clause that evaluates capturability for the side **not** to move uses D754's disclosed
   device verbatim — turn returned to that side, en passant cleared — and abstains
   `invalid_turn_clone` when the clone is not legally constructible, with an in-check
   abstention fixture. The decision leaves the eligible denominator, never counts as a
   negative. **Verified at the harness bytes (cross-review 2026-08-22): no registered §3
   clause in this wave flips a turn.** Every observed-sequence clause evaluates only real
   recorded turns (`semantic-splits.ts`, `sequence.test.ts:138-189`,
   `counterfactual.test.ts:70-124`); the conflict, mate and race predicates enumerate
   real-turn legal moves (overload recaptures, mate replies, race alternation) and say so.
   The device enters this wave only through **consumed sibling inputs** — 2c's amended
   `promotion_pressure@1` flags and 2d's `defender_exposure@1`, whose abstentions surface
   here as `input_abstained` — and in the harness's internal relocation falsifier
   (`sequence.test.ts:95`), which is 2d's `defender_consequence@1` kind (b) reproduced as a
   cross-check, not a projection of this RFC. A future clause that does flip a turn adopts
   this item verbatim; none exists in the registered set.
5. **Dispositions at landing.** Reading projections declare `disposition: "inspector_only"`.
   Event projections are eligible **only** for `research.semantic_selection@1`
   (`evidence-catalog.ts:470`) through the existing eligibility generator. The
   proof/conflict predicates are machine-consumed only. **No production module, workflow,
   preset or sentence renderer consumes anything here** — criterion C4 greps it to zero.
6. **Four-part fixtures** (the D444/D451/D522 discipline): positives (cited canonical
   sources — official Lichess puzzle ids from the bounded prefix, the pinned imported
   witnesses in the harness outputs, and the sequence fixtures already passing in
   `tools/d872-semantic-tactics-harness/`); hard negatives (**each measured rejection
   becomes a permanent hard negative**: the broad overload rule, the any-piece attraction
   form, relocation-without-consequence, the adjacent-depth mate controls, the geometric
   race verdict on a Syzygy-reversed FEN); abstention fixtures for every declared reason;
   and strict-interior non-vacuity on the canonical fixture corpus. Authored and imported
   population censuses are reported separately; **an honest zero is retained, creates or
   retains a content-coverage row, and never permits weakening a predicate** (stage-0
   predeclares authored zeroes for §3.2–§3.5's sequences).
7. **Mirror discipline.** Every family carries color/file mirror fixtures plus
   capture/promotion identity checks (the C1 instrument requirements).
8. **Measurement is census-shaped, labeled honestly.** These are rare multi-edge events;
   played-vs-alternative lift is the wrong instrument for most rows and **no lift claim is
   scored where the spec says census** (Wave A's capture-event precedent — an unfalsifiable
   lift criterion is ceremony). Where a measured prior exists, §3 quotes it with its
   predeclared direction and criterion C6 requires reproduction; where none exists, the
   probe is labeled measurement-not-hope: the direction is a question the harness answers,
   both possible answers recorded (law 6). Populations: the authored spine and the sealed
   `r2-imported-sample@a10a233e…` (`evidence-catalog.ts:515`), plus the bounded 250,587-row
   Lichess CC0 prefix for the external-agreement rows (a **disagreement corpus, never an
   oracle** — stage-0 §1).
9. **Cost classes.** §3.1–§3.5 are free/cheap (arithmetic plus bounded enumeration over
   recorded edges). §3.6 is the wave's one deliberate exception: **bounded-tree-priced**, a
   declared 250,000-node cap, still exact rules enumeration — never engine-priced. §3.7's
   outcome half is provider-priced through the existing `live.syzygy`/`recorded.tablebase`
   producers.

#### §1.1 Normative production-code sites

Closed production census for the implementation; unit: **file**; total: **7**. Tests, docs
fixtures, and the disposable harness are additional; a production edit outside this table is a
spec change with a changelog line before it lands.

| Site | Normative responsibility |
|---|---|
| `packages/runtime/src/tactics.ts` (+ an internal mate-proof module under the same producer home, the Wave-A §3.4 file-split allowance) | duty reading, defender transition events, bounded mate proof |
| `packages/runtime/src/semantic-evidence.ts` | observed-sequence joins over the 2d recorded-path compilation |
| `packages/runtime/src/pawn-dynamics.ts` (created by 2d) | promotion race geometry and the tablebase outcome join |
| `packages/runtime/src/evidence-catalog.ts` | all declarations, dispositions, eligibility |
| `packages/runtime/src/evidence-source-adapters.ts` | brand-sealed payload adapters |
| `packages/runtime/src/index.ts` | public runtime exports only |
| `docs/semantic-evidence.md`; `docs/evidence-contract.md` | docs tuple, same change |

`exchange.ts`, `transition.ts`, `structure.ts`, `apps/server/src/tablebase.ts` and the shipped
Syzygy/engine adapters are **consumed by id, never edited**. `story.ts` is explicitly not a site
(D917 is the Review successor's).

#### §1.2 Vocabulary mapping, stated once (the D523 grammar rule)

The matrix's research vocabulary maps onto the shipped closed unions; **no union is widened**:

- timing `precommit_requested → precommit` (requested-sight policy is the module tier's),
  `postcommit → postcommit`, `review → review`, `analysis → analysis`, `offline` → the
  producer's `LatencyMode`, not a timing member;
- answer distance `square`/`relation → fact`, `concept → pattern` (plus `theory` where a
  cited source is joined), `candidate → candidate_moves`, `move → move`,
  `line → principal_variation`, `evaluation → evaluation`;
- grounding per §1.3's checker: single-grounding derived rows keep the input grounding;
  mixed rows declare `declared_convention`.

Timing rows in the matrix are **candidate module eligibility**, bound later by F5 — this RFC
edits no consumer timing.

### §2 — Pinned conventions (exact values; each ships verbatim in its declaration)

| Convention | Exact pinned content |
|---|---|
| `defence-duty@1` | A **duty** is a directed pseudo defence edge: piece D's chessops attack set, under current occupancy, contains the square of a same-color piece T. Any piece including the king may hold a duty; **T is never a king** (the harness `duties()` byte — a king is not a defended target under this convention). **Sole defender** = D holds the only such edge onto T. Duties are occupancy-current pseudo edges and deliberately not legality-filtered — an absolutely pinned defender still holds its duty; whether a recapture is *legal* is decided only where a predicate enumerates legal moves. Declared limitation: a pseudo duty may be legally unexecutable; multiple duties are a state, never by themselves exploitable overload. |
| `overload-conflict@1` | The `9f7112c` four-clause candidate-time relation, verbatim from the measured repair: (1) one named defender is the **sole** defender (`defence-duty@1`) of the captured target **and** of at least one other surviving named target; (2) the candidate captures the first target and the same defender has at least one **legal** recapture on that square; (3) no such recapture preserves every retained sole duty; (4) after **every** such recapture, at least one retained named target is positively capturable under `legal-exchange@1` (the recapturing turn is real — no clone). Abstention `no_legal_recapture`. The broad lost-duty-edge rule (52/754 authored, 515/6,991 imported) is **rejected and pinned as the permanent hard negative**. |
| `mate-proof@1` | The D908 bounded solver: the declared candidate move is fixed; later attacker moves are existential; **every** defender reply is enumerated; promotions fully enumerated; horizon = **1–4 attacker moves, the candidate counting as attacker move one** (the harness's `2·N−2` remaining-edge accounting: horizon H proves mate delivered on or before the attacker's Hth move, and **H = 1 means the candidate itself mates** — layered beside 2c's `rules.tactic.consequence.mate_in_one@1`, which stays the position-level enumeration authority; this predicate proves one declared candidate and never re-enumerates all mating moves). Node cap **250,000**, with the accounting pinned because the cap verdict is order-dependent (the boundary probe's 250,001 witnesses): **one node per visited position including transposition revisits, incremented before the cap test and every terminal test**, so a capped run reports cap+1; a transposition memo keyed by (four-field FEN, remaining edges, attacker) is consulted after the terminal tests. **Enumeration order is part of the convention**: attacker moves sorted check-giving first, then ascending canonical UCI; defender replies in ascending canonical UCI (the harness's attacker ordering made normative for both sides — its incidental defender order is chessops-internal and not reproducible; the measured node statistics are therefore reference figures under the harness order, and C6 binds the proved/refuted/abstained counts while node statistics are reported with any ordering-driven divergence named). Result is exactly one of `proved` (retained horizon and proof-tree digest/node count), `refuted` (at least one legal escaping root reply retained, or the terminal non-mate state when the candidate ends the game without mate), or `budget_exhausted` (abstention — never false, never an engine-derived guess). **The proof-tree digest is re-derivable from the retained tree; its serialization and hash are pinned in the declaration's semantics at implementation with a changelog line (pin-the-encoding: no digest algorithm is invented here), and the cross-authority join key is candidate + position + horizon — never the digest** (D2's `mate_transition` joins on exactly that key). Five-plus attacker moves is outside this convention: a separately declared offline budget or a typed engine mate authority may serve it later, and the external `mateIn5` tag is a five-**or-more** bucket, never exact evidence. "Mating net" is presentation vocabulary over a proved tree; king-zone counts, reduced escapes and check sequences remain operands that **cannot emit the name**. |
| `race-arrival@1` | The D909/D1699 descriptive ordering: two or more exact `passed: true` pawn rows of opposite colors from one sealed `rules.pawn.reading.contacts@1` item, each with a clear forward path under current occupancy. Side to move and the initial double push are respected; arrival order is strict turn alternation with no arbitrary-piece captures, checks or activity modeled. Output is ordering and per-pawn arrival distance, **explicitly descriptive**: winning/losing/drawing are structurally absent (measured 7/10 agreement with Syzygy, including two loss→win inversions). Fewer than two opposing declared participants with clear paths abstains `no_opposing_passed_clear_paths`; missing declared input abstains `input_abstained`. |
| `observed-window@1` | Recorded-path windows adopt `breadth-collectors.md` §3.4's continuity rule by reference: N consecutive move anchors, N+1 ordered board nodes, byte-equal shared node/FEN at every join, canonical UCI per anchor, and the named subject identities surviving every applicable edge or transforming only through an explicitly recorded capture/relocation edge. Horizons are per-projection (§3) and part of the identity. Observed order never establishes intent, force, best play or causality. |

The observed split contracts (§3.2–§3.4) are conventions too; their exact clauses are pinned in
their sections because each carries its own measured agreement/control figures.

### §3 — The collectors

Every projection below: research/inspector disposition per §1.5; four-part fixtures per §1.6;
mirror fixtures per §1.7. "Measured" figures come from
`tools/d872-semantic-tactics-harness/` outputs and are the reproduction targets of C6.

#### 3.1 Defender duty family — the exact anchor

- `rules.tactic.reading.defender_duty_set@1` — *state reading*, `position_rules`/`exact`,
  total (abstention `possible: false`): per defender, its `defence-duty@1` duties with
  defender/target squares and roles and the **co-defender list per target** (the operand that
  keeps multi-duty from being misread as overload). Operands: `defender`, `defenderRole`,
  `targets`, `targetRoles`, `coDefenders`. Inspector-only. Measurement: census
  (multi-duty prevalence, both populations) — measurement-not-hope, no prior.
- `rules.tactic.event.defender_removed@1` — *transition event* over one played edge,
  `position_rules`/`exact`: the captured piece held at least one duty to a target that
  survives the edge with the same color/role; joins the shipped
  `rules.transition.event.capture@1` identity (**no second capture detector** — the B4
  discipline) and the before-state duty reading. Operands: `move`, `defender`,
  `defenderRole`, `target`, `targetRole`, `lostDuty`. Whether the exposed target *then*
  becomes positively capturable is §3.2's derived business, not this exact event's.
  Measured prior: initiations authored 46 rows / 66 witnesses, imported 87 / 138; external
  tag agreement **99.8%** sensitivity, 2.3% tag-negative controls — the ready anchor
  (D902). Predeclared: present in both populations (non-vacuity satisfiable without
  content work).
- `rules.tactic.event.defender_duty_relocated@1` — *transition event*,
  `position_rules`/`exact`: the same defender relocates on the played edge and loses a
  named duty; the target survives. Operands: `move`, `defenderBefore`, `defenderAfter`,
  `target`, `lostDuty`. **Never emitted as deflection or attraction** — the alias is
  measured-refuted (4.5% / 0.5% sensitivity against those tags; D902; instrument note:
  those figures were measured with the harness's *bounded three-edge* relocation falsifier,
  and the broader one-edge form can only alias worse — the any-piece-attraction lesson).
  **This one-edge event has no measured census** (cross-review correction: the previously
  quoted 0/13 is the bounded three-edge count owned by 2d's
  `derived.tactic.sequence.defender_consequence@1` kind (b) — D772's 13, reproduced by this
  wave's harness at `sequence.test.ts:79-111` as a cross-check, never this event's prior).
  Measurement-not-hope per §1.8: census both populations at landing; predeclared direction —
  strictly more frequent than the bounded 13, present in both populations; both answers
  recorded.

#### 3.2 Observed defender manipulation — the split contracts

Both are `derived.tactic` observed-sequence events over `observed-window@1`, grounding
`declared_convention`, exactness `convention` (mixed input groundings per §1.3 — the recorded
path plus the exact/convention inputs each names), abstention `["continuation_too_short",
"input_abstained"]`. **Neither clause set flips a turn** (§1.4, verified at the harness
bytes): every clause evaluates a real recorded turn, so `invalid_turn_clone` is not declared
here — it would be an unreachable reason with an unconstructible fixture. Horizons are part
of each identity, pinned below from the measured predicates
(`semantic-splits.ts:16-61`, the 93.0%/99.9% instruments).

- `derived.tactic.deflection_observed@1` — **three-edge window** (three anchors / four
  nodes); exact clauses, pinned from `defenderDutyDisplacedSequence` (measured **93.0%**
  tag sensitivity, 3.1% controls — 371/11,989): (1) the defender held a `defence-duty@1`
  duty onto a non-king target in the pre-window position; (2) the displacement is causally
  bound — **the defender's edge-2 relocation is itself the capture of the bait piece on the
  bait move's destination square** (bait = an edge-1 mover's piece), **or the edge-1 bait
  move gave check** (so every legal reply answers it); (3) the relocated defender (same
  color/role) no longer holds the duty; (4) the target survived edge 1 by square/color/role
  and is captured on edge 3 by a **positive `legal-exchange@1`** capture. Operands:
  `baitMove`, `defenderBefore`, `defenderAfter`, `lostDuty`, `targetCapture`. Hard
  negative: relocation without the later positive target capture. Not forced, not intent —
  the ceiling names the observed line only.
- `derived.tactic.attraction_observed@1` — **two declared horizons, both part of the
  identity**, pinned from `attractedPieceSequence` (measured **99.9%** sensitivity, 0.05%
  controls — 6/12,094): a **king, queen or rook** captures the bait — an opponent piece on
  the edge-1 move's destination square — onto that square on edge 2; **on edge 3 the
  opponent moves a piece that attacks the arrival square**; then either the attracted king
  stands in check after edge 3 (**three-edge window** closes) or the same-role/color
  queen/rook is captured on that square **on edge 5** (**five-edge window**). No
  `legal-exchange@1` positivity is required — the check or the capture of the attracted
  heavy piece is itself the consequence. Operands: `baitMove`, `heavyPiece`,
  `arrivalSquare`, `checkOrCaptureConsequence`. **The heavy-piece restriction is
  load-bearing and pinned**: the any-piece form reached 100% sensitivity while firing on
  **19.0%** of negative controls and is the permanent hard negative (the recall-only-gate
  lesson, stage-0 §9; the discriminating minor-piece fixture is wired in
  `semantic-splits.test.ts`, labeled from this review).

#### 3.3 Observed line tactics

All three are `derived.tactic` observed events over `observed-window@1` three-edge windows
(three anchors / four nodes), abstention `["continuation_too_short", "input_abstained"]`.
**No clause clones a turn** (§1.4): `invalid_turn_clone` is not declared on any §3.3 id.
The first and third ride mixed input groundings and declare
`declared_convention`/`convention` per §1.3; **square clearance is the exception** — its
inputs are the recorded path alone, so §1.3's checker *forbids* `declared_convention` for
it and it declares `recorded_run`/`exact` (breadth's `contact_timing@1` precedent: the
window horizon is identity, not a grounding downgrade).

- `derived.tactic.line_blocker_clearance_observed@1` — clauses pinned from
  `clearanceSequence` (`sequence.test.ts:138-158`): (1) on edge 1 a **friendly** blocker —
  same color as the slider — vacates the **sole occupied square strictly between** a named
  same-side slider (B/R/Q) and an **enemy non-king** target; (2) the slider attacks the
  target after edge 1; (3) on edge 3 **the same slider, from its unchanged square**,
  captures the retained target (same square/color/role) with a **positive
  `legal-exchange@1`** result. Operands: `blocker`, `slider`, `ray`, `target`,
  `targetCapture`. Hard negative: vacation opens a ray with no retained target
  consequence (*"opened geometry without an affected target is only an operand"*).
  Measured: initiations authored 24/26, imported 42/42; observed sequences 23 imported /
  0 authored.
- `derived.tactic.square_clearance_observed@1` — the upstream-shaped split, clauses pinned
  from `squareVacatedForSliderSequence` (measured **98.3%** sensitivity, 2.7% controls —
  331/12,365): an exact square is vacated on edge 1; on edge 3 a same-side slider (B/R/Q),
  **from a source square other than the vacated one**, makes a **quiet (non-capture)** move
  **to or through** that square. The quiet clause is load-bearing: the capture-consequence
  ray form is `line_blocker_clearance_observed@1`'s domain, and the split is what keeps the
  two ids from double-counting one line. Operands: `vacatedSquare`, `vacatingPiece`,
  `laterSlider`, `laterMove`. Registered **alongside, not instead of**, the ray-vacating
  form above — the measured ray form matches the upstream `clearance` family at only 1.1%
  and must not monopolize the name (D902's anti-alias ruling, applied in both directions).
- `derived.tactic.interference_observed@1` — clauses pinned from `interferenceSequence`
  (`sequence.test.ts:160-175`): (1) on edge 1 a piece of the attacking side interposes on
  the exact between-set of a `defence-duty@1` duty held by an **enemy slider (B/R/Q)** over
  its own non-king piece; (2) after edge 1 the duty no longer holds while the target
  survives by square/color/role; (3) on edge 3 the retained target is captured with a
  **positive `legal-exchange@1`** result. Operands: `interposingMove`, `slider`,
  `betweenSquare`, `target`, `brokenDuty`, `targetCapture`. Declared **conservative
  subset** (37.2% sensitivity, **0.1%** controls): its low tag reach is expected and is
  not a licence to broaden the detector. Measured: 0 authored / 3 imported. Hard negative:
  blocker appears on an unrelated ray.

#### 3.4 Check zwischenzug

- `derived.tactic.check_zwischenzug_observed@1` — `observed-window@1` **four-edge**
  window (four anchors / five nodes): an exact legal recapture existed on the capture
  square; the mover instead gave check; the opponent answered; the same recapturer then
  made a positive `legal-exchange@1` capture on the retained square. Grounding
  `declared_convention`/`convention`; abstention `["continuation_too_short",
  "input_abstained"]`. Operands: `expectedRecapture`, `intermediateCheck`, `reply`,
  `retainedRecapture`. Declared subset: check-intermezzo only (68.5% sensitivity, 0.6%
  controls); quiet zwischenzugs are a later, separately versioned contract. Hard
  negative: a merely delayed quiet recapture. Measured: **7**/6,667 imported four-edge
  windows; the authored quad population was **not censused** by the instrument (imported
  only, `sequence.test.ts:281-283`) — the authored zero is predeclared (stage-0/D926), and
  C6 requires the landing census to measure it rather than assume it. No claim that the
  recapture was expected or best.

#### 3.5 Overload — three facts, never one loose classifier (D919; pinned at `9f7112c`)

The separation is a measured result this RFC pins rather than reopens: multi-duty **state**
(§3.1's `defender_duty_set@1`), exact response **conflict**, observed **exploitation**.

- `derived.tactic.overloaded_defender_response_conflict@1` — *candidate-time predicate*
  under `overload-conflict@1` (§2, the four clauses). Grounding
  `declared_convention`/`convention` (legal-exchange-conditioned); abstention
  `["no_legal_recapture", "input_abstained"]`; role `predicate`, machine-consumed.
  Operands: `candidate`, `soleDefender`, `capturedTarget`, `retainedTargets`,
  `legalRecaptures`, `positiveCaptures`. Measured: **0/754 authored, 12/6,991 imported**;
  the broad rule's 52/515 is the permanent hard negative. Predeclared: rare-positive;
  the authored zero is content debt (D926), never predicate slack.
- `derived.tactic.overload_exploitation_observed@1` — *observed three-edge sequence*:
  a multi-duty defender's first target is captured; that defender recaptures on the
  square; a different retained target is then positively captured. Grounding
  `declared_convention`/`convention`; abstention `["continuation_too_short",
  "input_abstained"]`. Operands: `firstCapture`, `defenderRecapture`,
  `secondTargetCapture`, `dutySet`. Measured: **5** imported / 0 authored (622 triples).
  Hard negative: a one-duty defender. Explicit non-claim: the recapture was not proved
  forced — an all-opponent-reply or winning claim is a **stronger, separate** future
  projection, never this one's admission floor.

There is **no external oracle for overload** (upstream `overloading()` is unconditionally
`False`); agreement with Lichess is structurally unavailable as an acceptance instrument for
these two rows, and the cited canonical fixtures plus constructed controls are the authority
(stage-0 §3 — pinned so a later pass cannot "improve recall" against a tag that does not
exist).

#### 3.6 Bounded mating nets (D908) — exact through four, honest at the boundary

- `rules.tactic.consequence.forced_mate_after_move@1` — *predicate* on `rules.tactic`
  under `mate-proof@1` (§2), homed at the internal mate-proof module. Grounding
  `position_rules`, exactness `exact`; abstention `["budget_exhausted",
  "horizon_above_four"]`. Operands: `candidate`, `attacker`, `maxAttackerMoves`,
  `proofStatus`, `proofDigest`, `rootReplies`, `nodes`; a refutation retains at least one
  legal escaping root reply (or the terminal non-mate state — §2's stalemate case); the
  proof horizon and tree digest are part of the payload. The root reply population is
  consumed from the compiled `reply_breadth@1` object via `dependsOn` — **not**
  `derivation.inputs`, which F1 rejects outside the derived plane (the D827 return; the
  same rule binds §3.1's rules-plane events) — and no second root enumerator exists
  (Wave A's A18 discipline extends here); interior tree nodes are necessarily the solver's
  own enumeration under §2's pinned order. At horizon 1 the predicate is the singleton case
  of 2c's `mate_in_one@1` for the declared candidate and defers the position-level
  enumeration to that id (C8's seam, stated).
- Measured priors (C6's targets): mate-in-2 **240/240** proved, mate-in-3 **240/240**,
  mate-in-4 **120/120**; adjacent-depth controls **0/600** prove early; **zero**
  cap abstentions through four; nodes median/p90/max 635/4,716/87,255 at depth four
  (reference figures under the harness enumeration order — §2's pinned-order rule governs
  their reproduction). At
  the declared boundary, 24 `mateIn5`-bucket rows: 19 proved, 2 refuted (genuinely longer
  lines), 3 cap abstentions — the boundary behaves as declared, and the two refutations
  plus three abstentions are **fixtures**, not defects. Played-edge census: mate-next
  after every reply 4/754 authored, 0/579 imported.
- **The horizon rule, pinned:** deeper "mating nets" require a later versioned proof tree
  (offline budget or typed engine mate authority joined by candidate/position identity —
  the Review successor's typed `mate_transition` lane); they are **never** inferred from
  king-zone attacker counts, escape deltas or check sequences, and no consumer may
  render the phrase over anything but a `proved` result. The engine-agreement evidence
  (72/72 winner and exact distance at 100 ms on already-proved rows) is **agreement
  between two authorities, not permission to merge them** — the exact proof and any
  engine reading remain separately cited forever.

#### 3.7 Promotion races (D909/D963/D1699/D1700) — declared participants, exact source join, verdict refused

Both rows ride 2d's `derived.pawn` producer at `pawn-dynamics.ts`.

- **Per-pawn promotion geometry is not re-registered.** Matrix row
  `rules.pawn.reading.promotion_geometry@1` is **bound to the amended sibling id**
  `derived.tactic.promotion_pressure@1` (`tactical-collectors.md` §3.14 as amended
  2026-08-22 under D922): named pawn, distance, forward path/blockers, control balance,
  and the two exact typed-availability fields serving `promotionAvailableNext` /
  `promotionUnstoppable` (13/754 and 1/579 measured). The geometry row remains total; an invalid
  mover-turn clone makes `passAvailability` unavailable with reason `invalid_turn_clone` rather
  than false, while `replyPersistence` is computed over the real opponent-reply population.
  Registering a second per-pawn geometry producer
  would be the duplicate-collector failure; the operand mapping
  (`passAvailability.value → promotionAvailableNext`, `replyPersistence.value →
  promotionUnstoppable`; the matrix row's `sideToMove` rides the reading's position
  anchor rather than a named operand — the amended §3.14 list carries no `sideToMove`
  member, verified against the amendment text) is recorded in the declaration's semantics
  so the matrix row is traceable to its serving id. **D931 is discharged:** the tactical sibling
  landed its total-row/typed-field contract and permanent fixtures; unavailable never counts as
  refuted. The remaining promotion hold is the D1699/D1700 amendment and shared provider dependency
  stated below, not the repaired `promotion_pressure@1` seam.
- `derived.pawn.promotion_race_geometry@1` — *derived reading* under `race-arrival@1`
  (§2), with the one literal derivation input
  `rules.pawn.reading.contacts@1`. The constructor accepts an exact-factory contacts item,
  never a caller-supplied FEN. It parses that item's canonical full FEN only to calculate the
  convention, and every emitted participant must join an exact `passed: true` row by
  color/square/pawn role. The population is opposing passed pawns with clear forward paths; it
  retains `fen`, `pawns`, `arrivalConvention`, `ordering` and `sideToMove`. Grounding/exactness/
  confidence are `position_rules` / `convention` / `not_applicable`; answer content is `fact`;
  abstention is `["no_opposing_passed_clear_paths", "input_abstained"]`. The old
  `blocked_or_capturable_path_outside_convention` reason is withdrawn: this convention knows enemy
  pawn passage, not arbitrary-piece capturability. **Hard negatives, measured:** a2 versus b7 in
  `4k3/1p6/8/8/8/8/P7/4K3 w - - 0 1` is not a race because both contact rows are `passed: false`;
  and a recorded geometric-ordering inversion against Syzygy keeps all outcome words structurally
  absent. The established a2/h7 positive retains arrival plies 9/10.
- Once accepted and implemented, the `evidence-value-authority` dependency supplies the literal
  `createRulesPawnReadingContactsV1Evidence(fen)` factory route and exported specialized
  `assertPawnContactsEvidence(value)` assertion. The assertion requires the central value receipt's
  exact factory symbol, canonical FEN input digest and payload digest; the generic declared-evidence
  WeakSet is necessary but never sufficient. `derivePromotionRaceGeometry(contacts)` begins with
  that specialized assertion. It does not call `pawnContactsReading`, accept a payload/FEN or try to
  prove adapter identity from producer/id/version strings. Its closed result is:

  ```ts
  type PawnContactsEvidence = DeclaredEvidence<PawnContactsReading>;
  type PromotionRaceGeometryEvidence = DeclaredEvidence<PromotionRaceGeometry>;

  type PromotionRaceGeometryResult =
    | Readonly<{
        kind: "evidence";
        input: PawnContactsEvidence;
        output: PromotionRaceGeometryEvidence;
      }>
    | Readonly<{
        kind: "unavailable";
        reason: "no_opposing_passed_clear_paths";
        input: PawnContactsEvidence;
      }>
    | Readonly<{
        kind: "unavailable";
        reason: "input_abstained";
        missing: readonly ["contacts"];
      }>;
  ```

  The evidence arm retains the exact contacts object and its output's central derivation receipt
  retains that same input reference/digest. A valid position with no opposing passed clear-path
  population returns `no_opposing_passed_clear_paths` and mints no geometry value. Only missing,
  invalid or unavailable upstream evidence returns `input_abstained`. A generic `declareEvidence`
  wrapper carrying correct ids and false contacts, a value minted by another factory, an equal
  rebuilt input, unsealed lookalike, wrong producer/id/version, and mutations of `passed`, blocker,
  pawn identity or FEN all fail before geometry calculation.
- `derived.pawn.promotion_race_tablebase@1` — *derived event* with exactly three literal
  `derivation.anyOf` members, in this order:

  1. geometry + `rules.mobility.reading.legal_moves@1` +
     `recorded.tablebase.result@1`;
  2. geometry + `rules.mobility.reading.legal_moves@1` +
     `live.syzygy.position_result@1`;
  3. geometry + `rules.endgame.tablebase_domain@1`.

  Geometry, the legal map and the tablebase delivery must carry byte-equal canonical full FEN;
  another position with the same piece count is an invalid join, not absence. Exact legal moves
  are a required input because `immediatePromotion` cannot be sourced from geometry or tablebase
  category. The value-authority dependency supplies specialized
  `assertExactLegalMovesEvidence` and `assertRecordedTablebaseEvidence` assertions. The former
  requires the exact `createRulesMobilityReadingLegalMovesV1Evidence(fen)` receipt. The latter
  requires the exact `createRecordedTablebaseResultV1Evidence(recordEvidence)` route whose input is
  the already validated, same-record evidence minted by
  `createSourcingLedgerTablebaseResultV1Evidence`; no caller-written reading can earn it.
  The live projection is the receipt-bearing in-domain result from
  `provider-exchange-and-execution` §7. Its separate local
  `rules.endgame.tablebase_domain@1` fact is accepted only by member 3 and grounds an unavailable
  result; it is never an outcome substitute. The event
  retains `category`, `dtz`, `preciseDtz`, `immediatePromotion` and `promotionFirst`; its sealed
  derivation receipt retains `geometry`, the exact legal map and the selected whole source.
  `promotionWithCheck` is deliberately absent. The existing
  `rules.tactic.event.check@1` exact factory remains the sole check authority; candidate-packet or
  consumer composition joins its exact before-FEN/triggering-move identity to an immediate
  promotion UCI. This preserves the full primitive without duplicating check computation or using
  missing check evidence as proof of a negative. Grounding/exactness/confidence are
  `declared_convention` / `convention` / `not_applicable`; answer content is `fact + evaluation`;
  abstention is `["no_opposing_passed_clear_paths", "outside_tablebase_domain",
  "provider_unavailable", "input_abstained"]`.
  Only the tablebase input supplies outcome. Source absence never becomes refuted, empty or draw;
  geometry remains independently usable. The recorded population remains 288 unique FENs / 157
  pawn-bearing, with 23 side-to-move seventh-rank positions split 11 win / 1 draw / 11 loss.

The exact retained types and total operation result are:

```ts
type RecordedTablebaseReading = Extract<RecordedReading, { readonly kind: "tablebase_result" }>;
type PawnContactsEvidence = DeclaredEvidence<PawnContactsReading>;
type PromotionRaceGeometryEvidence = DeclaredEvidence<PromotionRaceGeometry>;
type ExactLegalMovesEvidence = DeclaredEvidence<ExactLegalMoveMap>;
type RecordedTablebaseEvidence = DeclaredEvidence<RecordedTablebaseReading>;

declare function assertPawnContactsEvidence(value: unknown): asserts value is PawnContactsEvidence;
declare function assertExactLegalMovesEvidence(value: unknown): asserts value is ExactLegalMovesEvidence;
declare function assertRecordedTablebaseEvidence(value: unknown): asserts value is RecordedTablebaseEvidence;

type PromotionRaceTablebaseSource =
  | Readonly<{
      kind: "recorded";
      evidence: RecordedTablebaseEvidence;
    }>
  | Readonly<{
      kind: "live";
      evidence: DeclaredEvidence<
        ProviderEvidenceDelivery<LiveSyzygyPosition, "syzygy.position@1">
      >;
    }>;

interface PromotionRaceTablebaseValue {
  readonly category: TablebaseCategory;
  readonly dtz: number | null;
  readonly preciseDtz: number | null;
  readonly immediatePromotion: readonly CanonicalUci[];
  readonly promotionFirst: "white" | "black" | "same_ply";
}

type PromotionRaceTablebaseEvidence = DeclaredEvidence<PromotionRaceTablebaseValue>;

interface PromotionRaceTablebaseDerivationReceipt {
  readonly geometry: PromotionRaceGeometryEvidence;
  readonly legalMoves: ExactLegalMovesEvidence;
  readonly source: PromotionRaceTablebaseSource;
  readonly output: PromotionRaceTablebaseEvidence;
}

declare const PROMOTION_RACE_TABLEBASE_RECEIPTS: WeakSet<PromotionRaceTablebaseDerivationReceipt>;
declare function assertPromotionRaceTablebaseDerivation(
  value: unknown,
): asserts value is PromotionRaceTablebaseDerivationReceipt;

type PromotionRaceTablebaseResult =
  | Readonly<{
      kind: "evidence";
      item: PromotionRaceTablebaseEvidence;
      derivation: PromotionRaceTablebaseDerivationReceipt;
    }>
  | Readonly<{
      kind: "unavailable";
      reason: "outside_tablebase_domain";
      geometry: PromotionRaceGeometryEvidence;
      source: DeclaredEvidence<ProviderLocalDomainResult<"syzygy.position@1">>;
    }>
  | Readonly<{
      kind: "unavailable";
      reason: "provider_unavailable";
      geometry: PromotionRaceGeometryEvidence;
      operation: "syzygy.position@1";
      requestDigest: ProviderRequestDigest;
      providerReason: ProviderSourceFailure<"syzygy.position@1">["reason"];
    }>
  | Readonly<{
      kind: "unavailable";
      reason: "no_opposing_passed_clear_paths";
      input: PawnContactsEvidence;
    }>
  | Readonly<{
      kind: "unavailable";
      reason: "input_abstained";
      missing: readonly ("geometry" | "legal_moves")[];
    }>;
```

Recorded normalization calls `assertRecordedTablebaseEvidence`, whose value receipt names
`createRecordedTablebaseResultV1Evidence`, the canonical FEN input and the exact validated
`sourcing.ledger.tablebase_result@1` source digest. It then projects category/DTZ only from
`evidence.payload.values`. Same-FEN changes to category, DTZ, precise DTZ or piece count, a generic
same-id declaration and a reading minted from no/different ledger record fail the specialized
assertion. Live normalization asserts the declared-evidence seal and exact
`live.syzygy@1/live.syzygy.position_result@1` identity, calls
`assertProviderDelivery("syzygy.position@1", evidence.payload)`, then projects category/DTZ only
from `evidence.payload.payload.position` while retaining the exact delivery-bearing item. Neither
arm synthesizes `sourceId`, retrieval time, occurrence or acquisition fields; those remain in the
original sealed item. Crossed source kind, producer, occurrence, retrieval, acquisition,
category or DTZ substitutions fail.

`collectPromotionRaceTablebase` owns the invocation algebra. A geometry result carrying
`no_opposing_passed_clear_paths` returns that exact no-race arm and makes no tablebase request;
missing/invalid/unavailable upstream evidence or an absent exact legal map returns
`input_abstained`. It calls `assertExactLegalMovesEvidence` before reading a move. A recorded item
takes member 1. Otherwise the operation calls the provider scheduler itself for the exact geometry FEN:
a sealed success delivery takes member 2, the scheduler-sealed local-domain result is first wrapped
by `declareSyzygyTablebaseDomainEvidence` and takes member 3, and a scheduler failure returns
`provider_unavailable` with operation/request digest and the exact provider failure reason but
emits no declared chess evidence. For member 3 the operation recomputes the normalized Syzygy
request from the geometry FEN and requires its branded digest to equal the local-domain envelope;
the domain item therefore cannot be crossed from another FEN even though its inner fact contains
only piece count. Callers
cannot pass a structural `ProviderSourceFailure` into the collector. A success is minted only by
`createDerivedPawnPromotionRaceTablebaseV1Evidence({geometry, legalMoves, source})`; the central value receipt and
the sealed returned `PromotionRaceTablebaseDerivationReceipt` retain the same exact three input
objects. The result assertion requires `derivation.output === item`, receipt-set membership and
reference identity for every input. Replacing the legal map or source after construction, even with
an equal separately sealed value, fails. All arms require byte-equal
canonical full FEN; precedence is `no_opposing_passed_clear_paths`, then `input_abstained`, then
source resolution, local domain and provider failure. Substituting provider failure for domain evidence, a bare domain payload for
its sealed item, or a live success for a recorded member fails.

The geometry declaration may land after this amendment passes fresh review. The outcome declaration
also requires the provider RFC's occurrence-preserving compiled execution paths and shared Syzygy
operation to land; no pawn-specific provider adapter or hand-authored execution row is permitted.

### §4 — Adjudication of the 20 matrix identities

Unit: matrix row; total: **20** (the closed list of
`consumer-matrix.test.ts`; candidate consumer sets quoted verbatim; compiled reach
Support 16, Review 20, bot 13, theory 3, inspector 20, authoring 17, **habit 0**).

| matrix id | candidate consumers (n) | adjudication |
|---|---|---|
| `rules.tactic.reading.defender_duty_set@1` | support, review, bot, inspector, authoring (5) | **registered** §3.1 |
| `rules.tactic.event.defender_removed@1` | support, review, bot, inspector, authoring (5) | **registered** §3.1 |
| `rules.tactic.event.defender_duty_relocated@1` | support, review, bot, inspector, authoring (5) | **registered** §3.1 |
| `derived.tactic.deflection_observed@1` | support, review, inspector, authoring (4) | **registered** §3.2 |
| `derived.tactic.attraction_observed@1` | support, review, inspector, authoring (4) | **registered** §3.2 |
| `derived.tactic.line_blocker_clearance_observed@1` | support, review, bot, inspector, authoring (5) | **registered** §3.3 |
| `derived.tactic.square_clearance_observed@1` | support, review, inspector, authoring (4) | **registered** §3.3 |
| `derived.tactic.interference_observed@1` | support, review, bot, inspector, authoring (5) | **registered** §3.3 |
| `derived.tactic.check_zwischenzug_observed@1` | support, review, inspector, authoring (4) | **registered** §3.4 |
| `derived.tactic.overloaded_defender_response_conflict@1` | support, review, bot, inspector, authoring (5) | **registered** §3.5 |
| `derived.tactic.overload_exploitation_observed@1` | support, review, inspector, authoring (4) | **registered** §3.5 |
| `rules.tactic.consequence.forced_mate_after_move@1` | support, review, bot, inspector, authoring (5) | **registered** §3.6 |
| `rules.pawn.reading.promotion_geometry@1` | support, review, bot, inspector, authoring (5) | **bound** to the D922-amended `derived.tactic.promotion_pressure@1` (§3.7) — not re-registered |
| `derived.pawn.promotion_race_geometry@1` | support, review, bot, inspector, authoring (5) | **registered** §3.7 |
| `derived.pawn.promotion_race_tablebase@1` | support, review, bot, inspector, authoring (5) | **registered** §3.7 |
| `theory.opening.current_endpoint@1` | support, review, theory, bot, inspector, authoring (6) | **assigned** to the runtime opening-identity RFC (C3/F4/F7; D894/D902 evidence) — Discharge D3 |
| `theory.opening.catalogue_membership@1` | review, theory, bot, inspector, authoring (5) | assigned with the above — D3 |
| `derived.opening.deepest_reached@1` | review, theory, bot, inspector (4) | assigned with the above — D3 |
| `derived.review.eval_delta@1` | review, inspector (2) | **assigned** to the Review successor (typed C4 contract; D916/D917/D918) — Discharge D2 |
| `derived.review.mate_transition@1` | review, inspector (2) | assigned with the above — D2; joins §3.6's proof by node/candidate identity when it lands |

The five assigned rows are the closure §6.7 rule executed: opening identity is a versioned
source adapter behind its own gate (exactly the `tactical-collectors.md` §3.15 precedent — a
collector RFC must not carry an item forbidden to start), and the engine-Review lane is
consumer-side typed-operand work already carrying its own defect rows. Assignment is recorded
here so no row of the matrix is silently dropped; their contracts stay pinned in the matrix
source and stage-0 §§12, 14 until their owners quote them.

### §5 — Pinned refusals

1. **Habit classification receives zero rows** — stated as a refusal, not an omission,
   cited to the matrix instrument: *"Habit rows: 0 (intentionally held until opportunity
   denominators, sample floors and the longitudinal store exist)"*
   (`consumer-matrix.test.ts`, third invariant: any row naming a `habit` consumer fails
   the suite). Raw motif counts measure exposure, not habits; F9 derives habit
   projections later from these versioned events or not at all.
2. **No pre-commit move/line/evaluation leak** — the matrix's executable invariant
   (every `precommit_requested` row is rules-grounded; `bounded_search`/`tablebase_exact`
   rows carry no pre-commit timing) becomes criterion C5.
3. **All-reply survival is a strength modifier, not the admission floor** (stage-0 §7):
   the exact event grounds factual language; a reply-qualified consequence earns
   *persistent/unavoidable* at its horizon and is rare (measured 0–1 witnesses per
   population). No missing survival result can suppress a correctly phrased observed
   event, and no observed event may borrow the stronger words.
4. **No geometric outcome, no king-zone mating net, no broad overload, no aliases** —
   §§3.5–3.7's rejected forms are permanent hard negatives; `defender_duty_relocated` is
   never rendered as deflection/attraction; the ray-vacating form never monopolizes
   "clearance".
5. **Seams held, not double-claimed:** the `EvidenceTiming`/`at_commit` union extension
   is `learner-modules.md`'s declared deliverable; the exact-mobility split is D904's own
   row and **no Wave-C id touches `piece_destinations` or its convention**; breadth's
   `defender_exposure@1`/`defender_consequence@1` remain the edge-level attack-edge
   authorities — §3.1's events join duties over the shipped capture identity and
   recompute neither (criterion C8).

## Deviations from design

None from `design/` — the detection/significance split and never-recommend rule are the
constraints this RFC implements. Four from the planning-tier matrix, each conservative and
named: (1) research timing/answer vocabulary mapped onto the shipped closed unions with no
member added (§1.2); (2) matrix row 13 bound to the amended sibling id instead of
re-registered (§3.7 — the no-duplicate-collector rule); (3) five rows assigned to their
owning RFCs instead of absorbed (§4 — the closure §6.7 rule); (4) mixed-grounding derived
rows declare `declared_convention` even where the matrix's research vocabulary said
`recorded_run`/`tablebase_exact`, because the shipped derivation-widening checker
(`evidence-contract.ts:456-474`) forces the conservative direction — the source authority
stays cited at its input id.

## Acceptance criteria

Every criterion can fail (D451). Where a criterion quotes a measured number, the number is
the predeclared direction; a contrary measurement is recorded and escalated per law 6, never
shipped around — no criterion here carries a pre-authorized fallback.

1. **C1 — Registration completeness.** Every Appendix A id (unit: projection id; total:
   **14**, the table's caption) exists in the compiled catalogue;
   `make evidence-manifest-check semantic-evidence-check` passes; the §1.1 docs tuple moves
   in the same change. C1 counts the same unit as Appendix A.
2. **C2 — Operand fidelity.** Declared `operands` match §3 verbatim; event families enforce
   them through `requiredOperands`; sequence payloads carry their §2 `observed-window@1`
   anchor/node counts and byte-equal boundaries, and swapping any anchor, FEN, defender,
   slider, target or square makes the positive fixture fail (breadth B8 extended). For the
   promotion pair specifically, geometry has exactly one declared contacts input; outcome has the
   two ordered three-input success alternatives plus the ordered geometry/domain-fact alternative
   in §3.7. Those success members require exact value receipts for contacts, legal moves and the
   recorded source; no-race is a separate no-output arm. A missing legal map, generic-sealed contacts item,
   cross-FEN source, crossed recorded/live source kind or piece-count-only match fails before an
   event is emitted.
3. **C3 — Convention pinning.** The §2 convention texts (values included: the four
   overload clauses, 250,000 nodes, 1–4 attacker moves, the heavy-piece set K/Q/R, the
   race-arrival clauses) appear verbatim in the declarations' semantics/limitations.
4. **C4 — Dispositions and surface silence.** Readings `inspector_only`; events eligible
   only for `research.semantic_selection@1`; predicates machine-consumed; grep over
   `apps/ packages/` (tests/tools excluded) for module/workflow/preset consumption of any
   new id returns 0 production hits.
5. **C5 — No pre-commit leak.** The matrix invariants re-run against the *registered*
   declarations: no pre-commit-timed candidate row grounded outside position rules; no
   `move`/`principal_variation`/`evaluation` answer content on any §3.1–§3.5 projection;
   §3.6's answer content stops at `candidate_moves` under its stage ceiling; §3.7's
   geometry payload and renderer contain zero outcome words, and outcome words exist only in the
   same-FEN tablebase join. `promotionWithCheck` is absent from this projection; exact check
   composition requires `rules.tactic.event.check@1` with equal before-FEN and triggering UCI.
6. **C6 — Measured reproduction.** The permanent implementation reproduces, on the
   identical fixed populations, within 10% of eligible denominators or with a named
   deliberate domain correction: sequence witnesses 5/23/3 (overload exploitation,
   line-blocker clearance, interference) and the 7 zwischenzug windows; defender-removal
   initiations 46/66 authored and 87/138 imported; conflict 12/6,991 and 0/754; mate
   600/600 proved positives, 600/600 rejected adjacent-depth controls, 0 cap abstentions
   through four; race ordering 7/10 with both inversions; external agreement
   93.0%/99.9%/98.3%/99.8%/37.2%/68.5% with their control rates. **The harness's 26 and 13
   three-edge counts are NOT this RFC's targets** — they are 2d's
   `defender_consequence@1` kinds (a-subset/b), reproduced by this wave's instrument as
   cross-checks; scoring them here would demand a duplicate authority (C8). The
   one-edge `defender_duty_relocated@1` census and the authored zwischenzug-quad census
   are measured at landing with predeclared directions (§3.1, §3.4), both answers
   recorded. Authored zeroes are reported as zeroes.
7. **C7 — Fixtures that start red, verified at HEAD.** Every §3 fixture family is
   committed before its producer and verified failing at pre-implementation HEAD. All are
   **red by producer absence**, verified at the symbol at drafting HEAD `7181834` and
   re-verified at review HEAD `530bb4a`: none of the fourteen ids exists in the compiled
   catalogue (grep over `packages/ apps/`: zero hits per id), and the only occurrences of
   this wave's vocabulary in production code are five refusal/limitation occurrences
   (`evidence-catalog.ts:206,217,247,260,330`) — verified by reading the file, so their
   evidentiary force is post-landing, stated plainly (the Wave-A A6 lesson). The one
   genuinely-misbehaving-shipped-symbol fixture the Wave-C evidence found —
   `story.ts:33/:104` coercing every `mateIn` to ±1000 cp before the 150-cp pivot — is
   **D917's regression pair and rides the Review successor**; it is cited here and is
   never scored as this RFC's evidence.
8. **C8 — No duplicate authorities.** Capture, check, reply-breadth, legal-exchange,
   passed-pawn/blocker, tablebase and recorded-move facts are consumed by id, never
   recomputed under a second meaning; §3.1's events name their derivation/dependsOn
   inputs; breadth's `defender_exposure@1` remains untouched and unreimplemented. Promotion
   geometry receives the exact-factory `rules.pawn@1/rules.pawn.reading.contacts@1` item, retains it
   by identity in its derivation receipt and does not call `pawnContactsReading`; the outcome
   receives exact-receipt legal moves and tablebase/domain items and does not call a private Syzygy
   client, recompute legal moves or recompute check. The check subset remains a separate exact
   producer join, never a duplicated output operand.
9. **C9 — F1 mechanics clean.** Every derived projection declares literal
   `derivation.inputs`; rules-plane events (§3.1, §3.6) use `dependsOn`, never
   `derivation` (the D827 rule); no declaration widens exactness, grounding, answer
   content or abstention past its inputs (the `EVIDENCE_DERIVATION_WIDENS` check passes
   with `input_abstained` present wherever an input abstains — and the same check *forbids*
   `declared_convention` on a single-grounding derived row, which is why
   `square_clearance_observed@1` declares `recorded_run`); the promotion outcome's compiled source
   graph is set-equal to §3.7's three alternatives and preserves recorded/live/domain source identity,
   effective latency and occurrence; no registered clause clones a
   turn (§1.4), so no `invalid_turn_clone` reason is declared anywhere in this wave and a
   declaration carrying one is a C9 failure.
10. **C10 — Non-vacuity, honestly split.** Canonical fixture censuses strict-interior for
    every family; authored/imported population censuses reported separately; each authored
    zero creates or retains the D926 content-coverage row and changes no predicate.
11. **C11 — Register silence.** `node tools/register-check.mjs` and
    `node tools/status-parity.mjs` pass with this RFC's row present; the claims block stays
    `none`; schemas, migrations, `EvidenceGrounding`, `EvidenceTiming`, producer inventory
    and `content/` are byte-identical.
12. **C12 — Production-site closure.** The implementation diff's production files are a
    subset of §1.1's seven sites; any additional site returns the RFC for an amendment
    naming its responsibility before that edit lands.
13. **C13 — Mirror coverage.** Every family carries color/file mirror fixtures plus
    capture/promotion identity checks and survives them.
14. **C14 — Landing-order seam.** The landing commit demonstrates 2c and 2d landed first
   (their acceptance suites green at the merge base); the `derived.pawn` producer and
   sequence compilation are consumed, not created here. Geometry additionally requires this
   amendment's fresh independent acceptance and accepted/implemented `evidence-value-authority`
   routes for contacts, legal moves, recorded tablebase and the derived outcome. Outcome additionally
   requires the accepted and implemented `provider-exchange-and-execution` contract; a private
   interim Syzygy projection, generic value seal or producer-wide latency override fails C14.
15. **C15 — Closeout protocol.** The landing commit flips this RFC's recorded ledger rows
    (D925 — the Wave-C implementation-wave 💡 row, disambiguated per §Ledger's collision
   note — and the rows §Ledger names as shipped), leaves the assigned rows open with
   their owners, and appends the `planning/exploration/log.md` entry — in the same commit
   (the CLAUDE.md ledger-and-log clause). C15 cannot close while the D925 collision
   stands unrepaired.
16. **C16 — Promotion contract falsifiers.** The six D1699/D1700 disposable arms graduate to
    permanent tests: contacts-based a2/b7 refusal; a2/h7 9/10 positive plus typed input abstention;
    current piece-count-only false-positive reproduction followed by repaired cross-FEN refusal;
    recorded and live same-position positives; provider absence distinct from outside-domain and
    geometry absence; and compiled execution paths `[sync, interactive]` without changing the
    `derived.pawn` producer's own `sync` operation. The production suite adds an unsealed
    declared-item forge, sealed-false contacts mutations for passed/blocker/pawn/FEN, wrong
    producer/id/version, no-race versus missing-input separation, missing/substituted legal-map,
    same-FEN recorded category/DTZ/piece-count mutations, crossed recorded/live
    source/occurrence/acquisition, bare and crossed domain facts, provider-failure-for-domain
    substitution, absence of `promotionWithCheck`, exact external check composition, and reproduces
    D909's geometric inversion.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Production-module eligibility for every §3 projection: this RFC lands research/inspector-only by design, and the accepted 175-row module RFC predates every Wave-C id (D921) — the literal-id amendment binding these shipped ids into Support/Review eligibility is codex's order item 5 and must quote landed ids, never placeholder strings | `learner-modules` | the learner-modules amendment commit | |
| D2 | The engine-Review lane: matrix rows `derived.review.eval_delta@1` / `derived.review.mate_transition@1` (typed C4 contract, stage-0 §12.2), the Story mate-type repair (D917, `story.ts:33/:104`) and the multi-source post-game compiler (D918) — codex's order items 3–4, cited here and absorbed by nothing in this RFC; `mate_transition` joins §3.6's proof by node/candidate identity when it lands | `planning/evidence-foundation-ux/plan.md` | the Review-successor RFC's drafting/landing commits | |
| D3 | The runtime opening-identity trio: matrix rows `theory.opening.current_endpoint@1`, `theory.opening.catalogue_membership@1`, `derived.opening.deepest_reached@1` (D894/D902 evidence; the C3/F4/F7 handoff) — assigned to the runtime opening RFC exactly as `tactical-collectors.md` §3.15 split the same lane | `planning/evidence-foundation-ux/plan.md` | `44637013` — runtime opening compiler, artifact, projections, API and image boundary | ✅ 2026-08-24 |
| D4 | Authored-corpus semantic-tactic witnesses: the authored spine holds zero observed-sequence witnesses for every §3.2–§3.5 family and zero overload conflicts — the learner copy of these families cannot be validated until a content wave authors or imports cited canonical lines (a content wave carrying the content-era closeout) | `planning/evidence-foundation-ux/plan.md` | the content wave's shipping commit | |
| D5 | Promotion outcome provider execution: `live.syzygy.position_result@1`, exact occurrence/source identity, same-exchange receipt and projection-effective latency come from one shared provider operation; this RFC must not create a pawn-local source or flatten recorded/live alternatives | `provider-exchange-and-execution` | accepted provider implementation commit + provider F1 census | |
| D6 | Exact promotion input/value authority: pawn contacts, exact legal moves, recorded tablebase values and the derived promotion outcome require their named central factory receipts; generic declared-evidence sealing never satisfies them | `evidence-value-authority` | accepted implementation plus set-equal route/profile fixture | |

## Open questions

1. **None blocking acceptance.** The measured decisions are pinned (§§3.5–3.7); no owner
   ruling is outstanding for the registered set.
2. **Deeper mate horizons** (five-plus attacker moves): a separately declared offline
   budget or the typed engine mate authority — the D2 lane decides; `mate-proof@1` stays
   1–4 either way.
3. **Quiet zwischenzugs** beyond the check subset, and all-reply-qualified consequence
   variants of §3.2–§3.5: stronger, separately versioned future contracts; nothing here
   may be loosened toward them.
4. **Authorable pack vocabulary** for these families: deferred exactly as Wave A §2.2
   deferred it; a follow-up claims the pack lane if authors ever need to write these
   kinds in conditions.

## Ledger rows

Recorded rows this RFC encodes (none flipped by drafting): **D872** (the program), **D902**
(split contracts), **D908** (bounded mate), **D909** (promotion/Syzygy separation), **D916**
(typed engine operands — D2's evidence), **D919** (overload three-way), **D920** (the
matrix), **D921** (module-amendment order — D1), **D922** (the sibling amendment §3.7
binds to). Open defect rows cited, owned elsewhere: **D917**, **D918** (D2); **D904**,
**D905** (seams, untouched). **D931** is closed by the tactical implementation; §3.7 now waits on
the separate D1699/D1700 amendment and provider dependency.

Registered rows — **written by the drafting commit `530bb4a`** (the draft's "head D922"
was already stale when it landed: D923/D924 had been taken by the play-composition review
in flight, and the commit renumbered accordingly):

- **D925** — the 14-id semantic collector implementation wave (this RFC's shipping row;
  flipped by the landing commit per C15).
- **D926** — authored-corpus witness debt for the observed semantic-tactic families (the
  D4 obligation's ledger anchor; content tier).

**Ledger collision, found by the cross-review 2026-08-22:** the drafting commit also
recorded the independently found Stockfish-WDL-perspective defect as a second **D925** 🐞
row, so `design/BACKLOG.md` at commit `530bb4a` holds two D925 rows (verified committed
head **D926**). The review proposed renumbering the WDL row to **D927** per the D906/D908
precedent — and found the concurrent C4/Review session's in-flight working tree already
carries exactly that repair (the WDL row as D927 plus **D928**, the Review whole-game selector);
that collision repair landed at `097581e`. **D931**, below, is the later promotion-binding return.
Every D925 reference in this document means the Wave-C implementation-wave 💡
row. **D931 ✅ (`tactical-collectors / semantic-collectors` seam):** the sibling RFC, executable
matrix and permanent helper now share one total geometry row whose reply-dependent fields carry
typed availability; `invalid_turn_clone` is unavailable, never false. This binding is implemented.
It is not the authority for the two-runner race population, which is why the D1699/D1700 amendment
derives that population from complete `rules.pawn.reading.contacts@1` instead.

**Held promotion-amendment return, author-repaired here:** [[D2141]] now requires the constructor's
exact factory receipt plus input/output receipt; [[D2142]] has the discriminated
recorded/live whole-item source union and total normalization; [[D2143]] has a third literal
geometry/domain-fact member and total invocation algebra. The second fresh review returned that
repair on [[D2179]]–[[D2183]]; only projections 13–14 remain blocked.

## Promotion amendment returns

The held pair remains owned here. The D2179–D2183 repair preserved exact factory receipts, sealed
success inputs and the existing check authority, but the 2026-09-01 third fresh review returned the
invocation/result boundary on [[D2469]]–[[D2472]]. The next author repair must publish a closed
request and operation signature, resolve outside-domain before requiring success-only legal moves,
fail invalid authority rather than calling it absence, and represent a valid no-witness result as
completed/no-output. Exact review:
`planning/evidence-foundation-ux/semantic-collectors-promotion-third-fresh-independent-buildability-review-2026-09-01.md`.
Provider and value-authority acceptance/implementation remain separate landing dependencies.

| row | live repair owner in this RFC |
|---|---|
| [[D2141]] | require the exact pawn-contact value receipt and reject generic, rebuilt or value-mutated contact evidence |
| [[D2142]] | preserve the prior recorded/live whole-item normalization while repairing its recorded value authority |
| [[D2143]] | preserve the third literal tablebase-domain member and total outside-domain result algebra |
| [[D2179]] | author-repaired: `assertPawnContactsEvidence` requires the exact factory/input/payload receipt; generic same-id values fail |
| [[D2180]] | author-repaired: recorded tablebase assertion requires a validated same-record ledger source receipt and rejects value mutation |
| [[D2181]] | author-repaired: one sealed available derivation receipt retains geometry, legal map, selected whole source and output by reference |
| [[D2182]] | author-repaired: no-race/no-witness is a typed no-output arm distinct from `input_abstained` |
| [[D2183]] | author-repaired: `promotionWithCheck` is removed; the existing exact check event composes by before-FEN and move UCI |
| [[D2469]] | returned: outside-domain member cannot require an undeclared legal map before domain resolution |
| [[D2470]] | returned: publish one closed request/source-selection algebra and collector signature |
| [[D2471]] | returned: invalid authority is an invariant failure; only typed missing/unavailable inputs abstain |
| [[D2472]] | returned: valid no-race is completed/no-output, not unavailable |

## Appendix A — registered projection ids

Unit: **projection id**; total: **14**. The closed list C1 counts; adding or dropping an id
is a spec change with a changelog line.

| # | projection id | §3 item | producer | role |
|---:|---|---|---|---|
| 1 | `rules.tactic.reading.defender_duty_set@1` | 3.1 | `rules.tactic` | reading |
| 2 | `rules.tactic.event.defender_removed@1` | 3.1 | `rules.tactic` | event |
| 3 | `rules.tactic.event.defender_duty_relocated@1` | 3.1 | `rules.tactic` | event |
| 4 | `derived.tactic.deflection_observed@1` | 3.2 | `derived.tactic` | event |
| 5 | `derived.tactic.attraction_observed@1` | 3.2 | `derived.tactic` | event |
| 6 | `derived.tactic.line_blocker_clearance_observed@1` | 3.3 | `derived.tactic` | event |
| 7 | `derived.tactic.square_clearance_observed@1` | 3.3 | `derived.tactic` | event |
| 8 | `derived.tactic.interference_observed@1` | 3.3 | `derived.tactic` | event |
| 9 | `derived.tactic.check_zwischenzug_observed@1` | 3.4 | `derived.tactic` | event |
| 10 | `derived.tactic.overloaded_defender_response_conflict@1` | 3.5 | `derived.tactic` | predicate |
| 11 | `derived.tactic.overload_exploitation_observed@1` | 3.5 | `derived.tactic` | event |
| 12 | `rules.tactic.consequence.forced_mate_after_move@1` | 3.6 | `rules.tactic` | predicate |
| 13 | `derived.pawn.promotion_race_geometry@1` | 3.7 | `derived.pawn` (2d) | reading |
| 14 | `derived.pawn.promotion_race_tablebase@1` | 3.7 | `derived.pawn` (2d) | event |

## Changelog

- 2026-09-01: third fresh review returned the held promotion pair on [[D2469]]–[[D2472]] and
  corrected the candidate packet's conflicting exact-legal factory alias on [[D2468]]. Original
  projections 1–12 remain accepted and unchanged.
- 2026-08-30: author-repaired the held promotion pair on [[D2179]]–[[D2183]]. Exact
  value-authority receipts now gate contacts, legal moves and recorded tablebase inputs; successful
  outcomes return one sealed derivation receipt retaining every input; no-race is a typed no-output
  state rather than input failure; and the redundant `promotionWithCheck` operand is removed so
  `rules.tactic.event.check@1` remains the sole composable check authority. The 12 implemented
  projections remain untouched. Third fresh independent review still gates the held pair.
- 2026-08-30: second fresh independent review returned the held promotion pair on [[D2179]]–
  [[D2183]]. The global declared-evidence seal cannot prove the exact pawn adapter ran; the recorded
  tablebase adapter validates keys rather than outcome values; the available result omits the legal
  map grounding its promotion arrays; valid no-race geometry is relabelled input failure; and
  `promotionWithCheck` has no declared check source. The 12 implemented projections remain
  untouched. `make semantic-collectors-promotion-second-fresh-review` passes 5/5.
- 2026-08-30: author-repaired the held promotion pair on [[D2141]]–[[D2143]]. The geometry
  constructor asserts the exact declared pawn-contact item and retains one input/output derivation
  receipt. The outcome retains whole recorded/live declared items through one discriminated source
  union and total normalization. A third literal geometry/domain-fact member plus a closed
  invocation/result algebra grounds outside-domain, provider and input absence without turning any
  into a chess outcome. Fresh independent review is still required; projections 13–14 remain held.
- 2026-08-30: fresh independent review returned only the held promotion amendment on
  [[D2141]], [[D2142]] and [[D2143]]. The D1699/D1700 counterexamples and source split remain valid, but the proposed
  boundary is not executable yet: shape-only pawn-contact sealing does not establish the chess
  facts geometry relies on; `source` has no exact output type/mapping across recorded and live
  inputs; and `rules.endgame.tablebase_domain@1` is absent from the graph that promises a grounded
  outside-domain abstention. The original twelve implemented projections remain untouched.

- 2026-08-29: author-repaired the held promotion pair from
  `design/research/promotion-race-contract-closure.md` and its six executable D1699/D1700 arms.
  Geometry now consumes one sealed complete pawn-contact reading and refuses the measured a2/b7
  false race; its old arbitrary-capturability abstention name is withdrawn. Outcome now consumes
  exact legal moves and one same-FEN recorded/live Syzygy delivery through two literal derivation
  alternatives; piece-count-only and cross-FEN joins fail, and provider absence remains distinct
  from local outside-domain and input absence. C2/C5/C8/C9/C14/C16 make the repaired contract
  failable. The original twelve implemented projections remain untouched. Fresh independent review
  gates geometry; provider-exchange acceptance and implementation additionally gate outcome.

- 2026-08-22: adversarial buildability cross-review (independent). Chess/mechanics repairs,
  each verified at the harness symbol that produced the quoted measurement: **(1)** the §1.4
  pass-device clause census was wrong — no registered §3 clause flips a turn (the
  `sequence.test.ts:95` clone belongs to the harness's relocation falsifier, which is 2d's
  `defender_consequence@1` kind (b) cross-check, not a projection here); `invalid_turn_clone`
  removed from §3.2/§3.3 declarations, where it was an unreachable reason with an
  unconstructible fixture, and C9 now fails a declaration that carries it. **(2)** §3.2/§3.3
  clause texts pinned to the measured predicate bytes the sensitivity figures came from:
  deflection's displacement is causally bound (the defender's relocation captures the bait,
  or the bait gave check) and its target capture must be a **positive** `legal-exchange@1`;
  attraction's two horizons pinned (three-edge check arm; five-edge capture arm with the
  edge-3 re-attack clause) with no positivity requirement; line-blocker clearance requires
  the **same slider from its unchanged square** capturing positively; square clearance
  requires a **quiet** later slider move from a non-vacated source — and declares
  `recorded_run`/`exact`, because the shipped widening checker *forbids*
  `declared_convention` on its single-grounding inputs; interference requires the positive
  target capture. **(3)** `mate-proof@1` made deterministic at the cap boundary: the
  candidate counts as attacker move one (H=1 = the candidate mates — layered beside 2c's
  `mate_in_one@1`, seam stated), node accounting and enumeration order pinned, the
  stalemate refutation case named, and the digest deferred to a pinned-at-implementation
  encoding with the cross-authority join key fixed as candidate+position+horizon. **(4)**
  `defender_duty_relocated@1`'s measured prior was mis-attributed — the 0/13 is 2d's
  bounded three-edge count; the one-edge census is measurement-not-hope at landing, and C6
  drops 26/13 from this RFC's reproduction targets (scoring them here would demand a C8
  duplicate authority). **(5)** `defence-duty@1` pins the non-king-target byte; the
  zwischenzug authored-quad census is named unmeasured rather than zero; C7's refusal-string
  count corrected to five occurrences and re-verified at review HEAD. **(6)** the §Ledger
  section records reality: rows D925/D926 were written by drafting commit `530bb4a`, which
  also created a **D925 collision** with the WDL-perspective defect row — committed head is
  D926; the concurrent C4 session's in-flight tree already carries the proposed D927
  renumbering plus rows D928/D931, and D931's promotion-pressure absence-semantics seam is
  now a named hold on the §3.7 binding; C15 cannot close while the collision stands
  uncommitted. **(7)** two labeled fixtures added to the disposable harness:
  the broad-overload rule firing where the strict predicate refuses
  (`overload-response.test.ts`), and the any-piece attraction discriminator
  (`semantic-splits.test.ts`) — the two permanent hard negatives now execute instead of
  being sentences. D922-amendment binding re-verified against the amended §3.14 text
  (`sideToMove` mapping gap recorded); consumer counts, §4 adjudication and every §3
  measured figure re-derived against the matrix and stage-0.
- 2026-08-22: created from `wave-c-foundation-closure.md` and
  `basic-semantic-tactics-stage-0.md` with every cited symbol re-verified at drafting HEAD
  `7181834`; the 20 matrix identities adjudicated 14 registered / 1 bound / 5 assigned; the
  `9f7112c` overload separation, D908 mate horizon and D909 outcome refusal pinned; no
  register claims.
- 2026-08-22: D931 sibling-binding amendment proposed. Promotion geometry remains a total row;
  `passAvailability`/`replyPersistence` carry typed available/unavailable values, and the research
  helper's former invalid-clone→false collapse is removed. The binding remains held until an
  independent review accepts the tactical sibling amendment.
