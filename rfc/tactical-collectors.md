# RFC: Tactical collectors

- **Status:** draft — amended 2026-08-22 after the D730 legal-exchange falsification pass;
  ready for independent buildability review, not accepted
- **Author:** claude (drafted on the D717 program routing, `planning/evidence-foundation-ux/plan.md` phases 2c/3)
- **Created:** 2026-08-22
- **Design refs:** `design/05-in-run-experience.md` §5 (*"detection is cheap, significance is not"* — every collector here ships detection with the significance judgement structurally refused), §3b (guided mode names patterns from a validated library, never recommends); `design/03-product-breadth.md` §Structural reading (the rung-0 layer this extends) and §Intelligence and explanation
- **Exploration gate:** opened by the owner ruling of 2026-08-12 (gate transition,
  `planning/exploration/log.md`); commissioned by the D717 program phase 2c with all four
  collector-audit questions ruled 2026-08-22 ([[D745]]). Specification basis:
  `planning/evidence-foundation-ux/phase2-collector-audit.md` (`7eb9210`), the D723 breadth
  result (`5a20b42`), and the predeclared D730 legal-exchange instrument
  (`tools/d730-see-harness/`).
- **Depends on:** nothing unlanded. Builds on the implemented `archive/evidence-contract-manifest.md` (F1) and `archive/semantic-evidence-selection.md` (F2). No file collision with any active draft (verified: `assistance-control-wiring` touches `packages/runtime/src/assistance.ts` and the run controller; `measurement-records` touches the shape-entry schema; neither touches the files named in §3).
- **Parent / amends:** additively extends the compiled evidence catalogue shipped by `archive/evidence-contract-manifest.md` and the semantic-event layer shipped by `archive/semantic-evidence-selection.md`. Redefines no shipped identity (§2.4).
- **Supersedes / superseded by:** —
- **Planning:** `planning/tactical-collectors/` (once implementing)

```tabiya-claims
none
```

**Why `none`, verified at HEAD rather than assumed.** Every deliverable of this RFC is an
additive declaration in `packages/runtime/src/evidence-catalog.ts` — new producers, new
`@1` projection identities, new catalog-local family consts — which is exactly the F2
precedent: the audit records that F2's *"new transition-rule/geometry event families are
additive projection ids in `evidence-catalog.ts` (new `@1` identities — no version bumps,
per the versioned-id design)"* (audit §6). The event-family consts
(`STRUCTURAL_EVENT_FAMILIES`, `TRANSITION_RULE_EVENT_FAMILIES`,
`evidence-catalog.ts:110-119`) are catalog-local and appear in no register. The path that
**would** need a lane — extending `STRUCTURAL_FEATURE_KINDS`
(`packages/schema/src/drill-pack/types.ts:372`), whose every member is duplicated as a
`$defs/structuralFeature` `oneOf` arm in `schemas/drill_pack.schema.json` (verified,
e.g. `:502-511`) and would therefore move `DRILL_PACK_SCHEMA_VERSION` — is **deliberately
not taken** (§2.2). No migration: semantic events are derived, never persisted (the
shape-library precedent: *"firings are derived projections, never events"*), and no table
is created. Register heads verified via `node tools/register-check.mjs` at drafting HEAD
`6526ccf`: pack 0.27 (0.28/0.29 live-claimed, next free 0.30), run 0.17, shape-entry 0.3,
principle-entry 0.1, migration 24, evidence-kinds 7 members — this RFC contests none of
them. `EvidenceGrounding` (`packages/runtime/src/evidence-contract.ts:3`) gains no member
(§2.5).

## Summary

This RFC specifies the **collector family**: the producers for the tactical and positional
primitives the Phase-2 audit found absent, lossy, or discarded at HEAD — the audit's
governing finding being that *"F1/F2 registered the authority mechanics over the
primitives that existed; they did not add the primitives"* (audit §2). It pins six
declared conventions (`legal-exchange@1`, `space@1`, `trapped@1`,
`back_rank_susceptible@1`, `threat@1`, `development@1`), specifies fifteen build items in
the audit's ranked order — legal local exchange first because it is the prerequisite for
tactical semantics and the bot blunder gate — and registers every collector through the existing F1 contract:
producer + typed projection + operands + grounding + abstention + fixtures, with
**research/inspector-only dispositions at landing**. The exchange predicate is the measured
legal-recapture convention rather than the audit's cheaper pseudo-attacker swap; this removes
pinned recapturers from downstream claims at about 0.04 ms per evaluated edge in the disposable
instrument. It deliberately ships **no
consumer**: production module eligibility arrives with the Phase-3 module RFC, which keeps
this RFC honest about not inventing consumers before the module contracts exist. Each
collector's acceptance includes the lift measurement over the corpus with the sign
question answered per collector ([[D545]]).

## Motivation

The owner's use-rejection ([[D717]], 2026-08-22) established that *"F1/F2 established
authority and mechanics; they did not establish completeness or a learner experience"*,
and routed a dependency audit rather than a reskin. Phase 1 measured the chain and found
**17 genuinely absent collectors** (gap class 1, `phase1-gap-matrix.md` §2f), **7
computed-and-thrown-away results** (class 2, §2d), and operand losses en route (class 3).
Phase 2 (`phase2-collector-audit.md`) re-verified every one of the ~20 required primitives
at the symbol at HEAD and produced the specification this RFC turns normative:

> **"Everything the owner calls the tactical/positional family — rows 1–6, the rights half
> of 7, 8–10, 13, 14 — has no producer."** (audit §2)

The concrete stakes, from the audit:

- No fork, pin, skewer, hanging-piece, island, space, or castling-rights producer exists;
  the FEN castling field is *"still entirely unread"* as evidence (audit §1).
- The owner-ruled R3 module `blunder_prevention` *"has no producer to consume"* (audit §2
  row 13).
- `capturedRole` retains the captured piece's identity only for `last_of_role`
  (`transition.ts:311-312`); the generic capture discards it.
- `undevelopedMinors` is *"registered but unrendered, count-only"*; `vacationReading` is
  *"exported, dead"* (`structure.ts:517`, sole export site `index.ts:106`).
- The D547 castling defect *"migrated from 'everywhere' to 'the reading plane only'"*: the
  event layer canonicalizes both UCI forms, but `irreversibility()` still tests `=== 2`
  (`transition.ts:351`) while `pgn-import.ts:54` emits `e1h1`-form via `makeUci` — so no
  imported game can ever fire the "White castled." reading or timeline marker.

**Scope boundary.** This RFC owns the producers and their registration only. It does
**not** own: module contracts, presets, selection policy beyond leaving the shipped R2
policy untouched, composition/layout, bot policy, or the per-candidate application adapter
— those are phases 3–6 of the program. It performs no content work and no corpus expansion
(Gate F). It repairs two lossy seams that are collector-shaped (the D547 reading plane;
the Maia per-candidate WDL projection) because the audit's build order places them inside
this family.

## Specification

Normative vocabulary below: *state* = a fact of one position; *transition* = a signed
identity-preserving before/after relation of one played edge (the F2 event shape —
`gained/lost/preserved`); *consequence* = a claim about unplayed continuations, requiring
bounded enumeration, engine, or tablebase, each with its grounding; *valence* = **never
emitted by any collector** — every new event declaration carries `valence: "none"` exactly
as the 33 shipped `SEMANTIC_EVENT_DECLARATIONS` do, and valence attaches only through
D571's authority chain. The F1 rule is binding verbatim: **"Derivation composes evidence;
it never composes judgement"** (`rfc/archive/evidence-contract-manifest.md` §4.3, the
law-8 corollary) — every derived projection here names `derivation.inputs` and composes
facts, never grades.

### §1 — Registration contract (shared by every collector)

Every collector in §3 registers by the same checklist. An implementer needing more than
this checklist plus the per-collector spec has found a spec bug, not a licence to invent.

1. **Producer + projections** are declared in
   `packages/runtime/src/evidence-catalog.ts` through the existing `producer()` /
   `projection()` helpers, at the implementation homes named in §3. New producer ids in
   this RFC: `rules.exchange`, `rules.tactic`, `rules.castling`, `derived.exchange`,
   `derived.tactic`; plus additive projections on the
   existing `rules.structural`, `rules.transition`, `rules.phase`, `human.maia`, and
   `derived.semantic_avoidance` producers. All projections are `@1` identities; the
   complete id enumeration is Appendix A.
2. **Operands are retained, not summarized.** Each spec lists required operands; the
   `SEMANTIC_EVENT_DECLARATIONS` mechanism already enforces `requiredOperands` per event
   family, and criterion A2 verifies the lists below verbatim.
3. **Grounding and exactness** follow the shipped closed unions
   (`evidence-contract.ts:3`,`:30`): pure rules arithmetic is
   `position_rules`/`exact`; anything conditioned on a §2 convention is
   `declared_convention`/`convention`. The manifest's derivation-widening check
   (`evidence-contract.ts:464-472`) is load-bearing here: a derived projection over mixed
   groundings **must** declare `declared_convention`, and one with any non-exact input
   must not declare `exact` — every legal-exchange-conditioned derived projection in §3 therefore
   declares `declared_convention`/`convention`.
4. **Abstention** is declared where the producer can abstain (`abstention: { possible:
   true, reasons: [...] }`); collectors that are total on their domain declare
   `possible: false` and say so in the spec.
5. **Dispositions at landing.** Event and avoidance projections follow F2's pattern:
   eligible **only** for `research.semantic_selection@1` (the existing
   `EVIDENCE_ELIGIBILITY_DECLARATIONS` generator extends to them unchanged). State
   readings declare `disposition: "inspector_only"`. Predicate-role projections (legal
   exchange) are
   machine-consumed only. **No production consumer, module id, workflow id, or preset is
   added by this RFC** — criterion A13 verifies the grep stays at zero.
6. **Fixtures** follow the four-part demand the audit states as this repo's D444/D451/D522
   discipline: **positives**; **hard negatives** (*"the geometry-without-consequence cases
   that must NOT fire"*); **abstention fixtures** where declared; and a **non-vacuity
   check** — the corpus census for each kind must be strictly between 0% and 100%
   (`GRADUATION_CLEARANCE_VACUOUS` generalized), and every acceptance criterion must be
   able to fail. Event fixtures use the existing id convention
   `semantic-event:<projection>:positive` / `:hard-negative`
   (`evidence-catalog.ts`, `SEMANTIC_EVENT_DECLARATIONS`).
7. **Mirror discipline.** Every new state family extends the mirror machinery
   (`structure.ts` `mirrorFeature`/`mirrorSquare` et al.) or its own equivalent, with
   mirror fixtures (audit §3.10's demand, applied to all).
8. **Measurement** (per collector, part of acceptance): per-kind lift over played vs legal
   alternatives — R11 §5's definition, *"P(fires on the played move) / P(fires on a legal
   alternative from the same positions)"* (`design/research/classifier-coverage-and-noise.md`
   §5, the d542 instrument) — reported **with sign** on both the authored spine and the
   sealed external population `r2-imported-sample@a10a233e…` (`evidence-catalog.ts:363`,
   `R2_EXTERNAL_POPULATION`), so the generous-population caveat is bounded. For each
   collector the D545 question — *is the negative reading primary?* — is answered
   explicitly in §3 with a predeclared direction, and the measured answer is recorded even
   when it contradicts the prediction (law 6). Instrument: a disposable harness
   `tools/tactical-collector-measurement-harness/` following the d542 pattern, labeled
   research tooling, tied to rows D730–D744 plus D749, logged per RFC-0000's exploration-tooling
   rule. Confidence is a deterministic paired bootstrap over source positions: each resample
   keeps a played result with that position's complete alternative population. Two thousand
   resamples report the 2.5th and 97.5th percentiles; `tools/d730-see-harness/` fixes this
   method before implementation.
9. **Cost classes** as the audit defines them: *free* = arithmetic over primitives already
   imported (`attacks`, `between`, `pawnAttacks`, FEN fields); *cheap* = free + one-ply
   enumeration or a small table; nothing in this RFC is engine- or corpus-priced.

#### §1.1 Normative production-code sites

This table is the closed production-code census for the implementation. Tests, docs and the
disposable measurement harness are additional; a production edit outside this table is a spec
change and must be explained in the RFC changelog before it lands.

| Site | Normative responsibility |
|---|---|
| `packages/runtime/src/exchange.ts` (new) | `legal-exchange@1`; capture-class derivation |
| `packages/runtime/src/tactics.ts` (new) | loose-piece, ray, threat, fork, rook-seventh, discovered, trapped, back-rank and mate-one collectors |
| `packages/runtime/src/castling.ts` (new) | castling rights, rights-loss cause and current-legality readings |
| `packages/runtime/src/structure.ts` | pawn connectivity, space and the existing vacation-ray source reused by discovered latency |
| `packages/runtime/src/phase.ts` | square-retaining development state |
| `packages/runtime/src/transition.ts` | capture/development events and the two-UCI-form castling repair |
| `packages/runtime/src/semantic-evidence.ts` | identity-preserving joins and declared tactical avoidance-family generalization |
| `packages/runtime/src/evidence-catalog.ts` | all producer/projection/event/eligibility declarations in Appendix A |
| `packages/runtime/src/evidence-source-adapters.ts` | brand-sealed adapters, including Maia candidate WDL |
| `packages/runtime/src/index.ts` | public runtime exports only |

The already-correct Maia parsing and HTTP transport in `apps/server/src/opponent-selector.ts`
and `apps/server/src/rest.ts` are fixture inputs, not edit sites. Runtime opening identity is
explicitly outside this RFC (§3.15).

### §2 — Structural decisions that bind every item

#### §2.1 Event mechanics generalize; the join semantics do not change

The F2 event machinery is reused at the mechanism level: identity-preserving subject join,
magnitude comparison for count-carrying families
(`semantic-evidence.ts`, the `structuralMagnitude` gained/lost/preserved compare in
`structuralSemanticEvents`), `compileSemanticEvidenceEvent`, and the complete-population
counterfactual-absence derivation. Two shipped seams generalize:

- The structural-event derivation currently joins only over `structuralReading`'s
  schema-kind observations; new state families supply their own reading functions and join
  through the same compare, keyed by the subject identity each §3 spec names.
- The avoidance derivation in `selectSemanticEvidence` currently filters candidates by the
  literal prefix `rules.structural.event.` (`semantic-evidence.ts`, the
  `minimumAlternativeOnlyShare` loop). That filter generalizes to a declared
  avoidance-eligible family list that includes the new tactical families — this is the
  audit's *"zero new avoidance code"* claim for §3.4 made honest: zero new *derivation*
  code, one declared list replacing one string prefix.

#### §2.2 No new authorable pack vocabulary — the deviation from the audit, stated

Audit §6 describes new structural kinds extending the closed `STRUCTURAL_FEATURE_KINDS`
const *"and every exhaustiveness switch over it"*. **This RFC does not take that path.**
Extending that const is a pack-schema change (each kind is duplicated as a
`$defs/structuralFeature` arm in `schemas/drill_pack.schema.json`) and therefore a
register lane behind two live claims (0.28 `graduation-clearance`, 0.29
`pack-population-provenance`) — and, more importantly, an **author-facing vocabulary
admission** that has no author demand yet and would contradict this RFC's
research/inspector-only landing. New families are catalog-local projection identities
only. The authorable-predicate admission (letting a pack author write
`{ kind: "hanging_piece", … }` in a success condition) is deferred to a named follow-up
(§Open questions Q2), which will claim its pack lane then. Consequence: no
`STRUCTURAL_FEATURE_KINDS` switch, no `structural-sentences.ts` arm, no
`expression-satisfiability.ts` or `pack-validation.ts` change, and **no
`content/witnesses/expression-witnesses.json` entries** — witness entries are the
authorable-vocabulary follow-up's fixture demand, not this RFC's. This RFC's fixture
demand is §1.6's, discharged in runtime test fixtures.

#### §2.3 Selection policy is untouched

The R2 policy's `criticalEvents` set (`evidence-catalog.ts:409`:
`checkmate, promotion, castled, last_of_role`) changes only if a new family is promoted
to critical — the audit requires the RFC to decide explicitly, and the decision is:
**none of the new families are critical.** The sealed R2 fixtures re-run unchanged either
way (criterion A12).

#### §2.4 No redefinition of any shipped identity

Per audit §6: *"if a later pass redefines one (e.g. exchange-conditioning an existing
detector), that is a `@2` identity, not an edit."* Every shipped projection keeps its
declaration byte-for-byte except where a spec below names an exact repair
(`irreversibility`'s `=== 2`, which is a **defect fix in a producer body**, not a
declaration change — the `move_irreversibility.castled` reading's declared semantics
already promise what the body fails to deliver). The Maia WDL repair is a **sibling
projection**, not an operand added to the shipped `human.maia.policy@1` (§3.16).

#### §2.5 `chess_tradition` is a citation basis, not a grounding value

[[D745]] rules the space convention *"declared in the RFC and cited as
`chess_tradition`"*. `EvidenceGrounding` is a closed nine-value union that does not
contain `chess_tradition`, and this RFC does not widen it. Reconciliation: the projection
grounding is `declared_convention`; the convention **text** (§2.6) carries the
chess-tradition citation, exactly as the D530/D531 regrounding treats principle
citations. Widening the grounding union would be a shared-vocabulary move this RFC
refuses.

#### §2.6 The six conventions, pinned by exact values (pin the encoding, not the intent)

| Convention | Exact pinned content |
|---|---|
| `legal-exchange@1` | A specified **legal capture** begins a recapture-only minimax on its landing square. Each side may stop or make any legal recapture there and chooses the branch maximizing its own material balance under **P=1, N=3, B=3, R=5, Q=9**; promotion adds promoted-piece minus pawn value. Legal enumeration excludes pinned recapturers and illegal king captures; X-rays enter when the front piece leaves. Result is in convention units, **never centipawns**. It is local: zwischenzugs, replies elsewhere, position value and compensation are outside scope. |
| `space@1` | **As ruled ([[D745]]): classic zones + pawn control, cited as chess tradition.** Zones by file: queenside **a–c**, central **d–e**, kingside **f–h**. Control test: a square counts for a color iff it lies in the **enemy half** (ranks 5–8 for White, ranks 1–4 for Black) and is attacked by at least one of that color's **pawns**. Emitted per zone per color as a count, plus the per-zone differential. |
| `trapped@1` | A non-pawn, non-king piece is *locally trapped* iff **both** hold: the side to move has a positive `legal-exchange@1` capture of it on its current square, and every legal destination of that piece allows the opponent a positive `legal-exchange@1` capture on the destination. A destination with no such capture is an escape. Mobility-zero alone is not trapped. This is weaker than “the piece is lost,” which needs search. |
| `back_rank_susceptible@1` | King on its back rank; **every** non-back-rank escape square is blocked by an own piece or attacked; **at least one** enemy heavy piece (rook or queen) has an open or half-open path to that back rank. A **defended** entry square still counts — susceptibility is escape geometry; the defended-entry distinction belongs to the separate mate-in-1 projection (§3.7). |
| `threat@1` | Declared pass convention: when the side to move is **not in check**, clone the position, give the move to the opponent, clear en-passant availability, and enumerate moves that (a) begin a positive `legal-exchange@1` capture or (b) deliver mate in one. If the side to move is in check, abstain `pass_while_in_check`; a pass is not a legal chess move and the output says so. Nothing deeper is claimed. |
| `development@1` | Basis: **minor pieces + castling only**, matching the shipped phase classifier's basis (`phase.ts` `HOME` squares b1/g1/c1/f1 and mirrors). *Developed* = the moved minor stood on its home square before this move and leaves it; *development lost* = a minor returns to its home square; a minor **captured** on its home square is neither. Rook connection, queen sorties etc. are deferred. |

Each convention's text ships verbatim in the catalog declaration's `semantics`/
`limitations` so the convention is readable at the manifest, not only in this RFC.

### §3 — The collectors, in the audit's ranked build order

The order below **is** the audit's §5 ranked build order (*"unblocks-most × cheapest"*)
and is normative for implementation sequencing. Per-item, "sign question" states the
predeclared D545 answer the measurement must confirm or refute.

#### 3.1 Legal local exchange — the prerequisite (audit §3.0; row D730)

- **Home:** `packages/runtime/src/exchange.ts` (new). Producer `rules.exchange`,
  availability `local`.
- **Projection:** `rules.exchange.predicate.legal_exchange@1`, role `predicate`, grounding
  `declared_convention`, exactness `convention`. It evaluates one specified legal capture
  under `legal-exchange@1`; it is not a free-standing reading and has no sentence form.
- **Operands (retained):** before FEN; capture UCI; landing square; capturer and captured
  identities; every visited legal recapture branch as ordered `{mover, captured, from, to,
  promotion?, delta}` steps; chosen minimax line; stop decisions; convention id; result in
  convention units. A consumer can therefore inspect why a pinned recapturer was absent and
  which X-ray appeared instead of trusting one number.
- **Abstention/domain:** the predicate is total on **legal captures**, not occupied squares.
  A non-capture or illegal move is outside-domain and no declared evidence is constructed.
- **Fixtures:** free piece (+3); poisoned pawn (-4); X-ray sequence (+1); pinned geometric
  recapturer excluded (+1); promotion-capture; illegal king recapture hard negative. The
  geometry/exchange disagreement fixture remains mandatory.
- **Measured result before RFC acceptance:** `tools/d730-see-harness/` evaluates 39,038 legal
  played/alternative edges at 0.038–0.041 ms per edge in the disposable TypeScript
  implementation. `moved_piece_en_prise` is negative-primary at 0.36× (95% 0.28–0.45)
  authored and 0.57× (0.47–0.69) imported. Exchange-filtered fork rises above the geometry
  control: 1.72× (0.72–2.94) authored and 1.96× (1.32–2.71) imported. The authored interval
  crosses 1.0, so no universal positive-prior claim is permitted.
- **Sign question:** n/a for the predicate; downstream events carry their measured signs.

#### 3.2 Castling family + reading-plane repair (audit §3.7, §5 item 2; rows D731, retiring D547's residue / D719)

- **Home:** `packages/runtime/src/castling.ts` (new) for the state/transition family;
  the repair lands in `packages/runtime/src/transition.ts`. Producer `rules.castling`,
  availability `local`.
- **Projections — three exact, valence-free items, all pure FEN/rules arithmetic**
  (grounding `position_rules`, exactness `exact`):
  - `rules.castling.reading.rights@1` — *state*: per color `{kingside, queenside}` read
    from the FEN castles field (today *"still entirely unread"* as evidence, audit §1).
    Disposition `inspector_only`.
  - `rules.castling.event.rights_lost@1` — *transition*: diff of rights over the edge,
    signs `lost`/`preserved`, with the exact cause retained:
    `king_moved | rook_moved | rook_captured | castled`.
  - `rules.castling.reading.legality@1` — *state*: rights held but castling currently
    illegal, with the specific disqualifying squares retained (transit/landing attacked,
    blocked, in check). Disposition `inspector_only`.
  - **"Prevented" is served by rights-lost (permanent) and legality (transient) and by
    nothing else** — as ruled ([[D745]] (3)): the intent reading stays refused under
    law 8. No projection in this RFC may use the word "prevented" of an opponent's
    purpose.
- **The D547 reading-plane repair:** `irreversibility()` (`transition.ts:351`) adopts the
  `>= 2` file-delta test already used by the event layer (`transition.ts:309`), so
  `e1h1`-form UCIs from `pgn-import.ts:54` (`makeUci`) fire the
  `move_irreversibility.castled` reading and the pivotal timeline marker. This is a
  producer-body defect fix, not a declaration change (§2.4). `pgn-import.ts` is left
  unmodified — canonicalizing at read is the smaller, replay-safe change.
- **Operands:** color; side(s); cause; for legality, the disqualifying squares.
- **Fixtures:** the **D547 regression pair** — `e1g1`-form and `e1h1`-form imports must
  both fire *performed* on the reading plane (**starts red at HEAD**); rook captured on h8
  removes kingside rights only; a-rook move removes queenside only (non-vacuity: the other
  side's right must survive in the fixture); rights-held-but-illegal positive with the
  attacked transit square named.
- **Measurement + sign:** `castling_right_lost` measured **0.65× as a gained-delta**
  *(d542)* — predeclared: *"the state reading is the useful form ('Black can no longer
  castle' is a position fact), and the avoidance form is the honest event rendering.
  Declare exactly that at registration"* (audit §3.7).

#### 3.3 Capture identity + trades (audit §3.9; row D732)

- **(a) Generic `capture` rule event.** Family `capture` added to
  `TRANSITION_RULE_EVENT_FAMILIES` (`evidence-catalog.ts:115`), emitted from
  `transitionSemanticFacts` (`transition.ts`), retaining
  `{mover, from, to, captured: {color, role}, enPassant}`. This is **pure retention**:
  `capturedRole` already computes the identity including en passant
  (`transition.ts:326-337`); today it is kept only when the capture is `last_of_role`
  (`transition.ts:312`) and reduced to `capture: boolean` otherwise (`:311`). Grounding
  `position_rules`, exactness `exact`.
- **(b) Local-exchange classification of the capture:** `derived.exchange.capture_class@1` (producer
  `derived.exchange`, home `exchange.ts`), `derivation.inputs` = the capture event + the
  exact `rules.exchange.predicate.legal_exchange@1` result for that capture; classes
  `positive | negative | equal` in convention units. These are arithmetic signs, not
  move grades. Grounding `declared_convention`, exactness `convention` (§1.3 forces this).
- **(c) Trade-completed:** `derived.exchange.trade_completed@1` — capture followed by
  recapture on the same square within the recorded continuation; `derivation.inputs`
  names both capture event(s) and `run.record.move`, retaining the two piece identities
  and landing square. *"An adapter over existing
  records, not a new detector"* (audit §3.9). `queensOff` stays where it lives
  (`transition.ts:354`).
- **Fixtures:** en-passant identity positive (**starts red at HEAD** — the ep branch of
  `capturedRole` is exercised nowhere learner-visible); promotion-capture; non-capture
  hard negative; a capture with no recapture (trade must not fire).
- **Measurement + sign:** capture is near-unconditional on capture moves — **no lift claim
  is made or scored** (a lift criterion here would be unfalsifiable ceremony); the
  informative measurements are (b)'s class distribution and (c)'s corpus rate, both
  reported.

#### 3.4 Hanging / loose / under-defended (audit §3.1; row D733)

- **Home:** `packages/runtime/src/tactics.ts` (new). Producer `rules.tactic`,
  availability `local`. (Internal file split under the same producer is free;
  the producer home names both `tactics.ts` and any split module.)
- **State projection** `rules.tactic.reading.loose_piece@1` (disposition
  `inspector_only`), per occupied square belonging to the non-moving side: legal capturer
  list, defender list, `legal-exchange@1` result per capture, side to move. Three predicates
  over it, each an operand flag, none a separate projection: **en prise** (at least one
  legal capture has a positive result for the capturer); **loose/LPDO** (no defenders at
  all); **under-defended** (has at least one defender, yet at least one legal capture has
  a positive local-exchange result — the defended subset of en prise, subsuming naive
  count-vs-value ordering). Grounding `declared_convention` (exchange-conditioned),
  exactness `convention`.
- **Event family** `loose_piece` joined on the occupant identity, signs
  `gained/lost/preserved` (*"the played move left/exposed/resolved a loose piece"*), plus
  the avoidance form via §2.1's generalized derivation with complete denominators
  (`legalAlternatives`, `alternativesWithFamily`) exactly as
  `CounterfactualAbsenceOperands` already carries.
- **Ceiling sentence** (declared limitation, law 8): *"White's knight on e5 can be
  captured by a legal move whose `legal-exchange@1` result is +3 convention units"* is
  the maximum statement; no move grade, recommendation or whole-position claim.
- **Fixtures:** classic loose piece; attacked-twice-defended-once with value ordering
  making the local exchange negative for the capturer. Hard negative: attacked piece
  defended by a pawn with no positive legal capture. **Declared
  limitation, not fixed by search:** a "hanging" piece whose capture loses to a
  zwischenzug is out of scope (legal exchange is local). Non-vacuity: static prevalence measured
  4.20% *(d542)* — corpus census strictly interior.
- **Measurement + sign — the D745 headline case.** The D730 legal-exchange probe measures
  `moved_piece_en_prise` at **0.36× (95% 0.28–0.45) authored** and **0.57×
  (0.47–0.69) imported** — robustly negative-primary in both populations. The earlier
  geometry-only probe was **0.26× played / 15.7% of alternatives**; the legal filter
  narrows but does not reverse it. **The negative reading is primary and is declared at registration**
  (audit: *"the primary learner-facing form is the avoidance event ('15.7% of your legal
  moves would have left a piece loose; yours did not')"*), which [[D745]] (2) now admits
  to learners post-commit/review with the denominator shown (wiring is Phase 3's; this RFC
  lands the producer and the declaration).

#### 3.5 Ray family: pins, skewers, X-rays (audit §3.3; row D734) — state only at landing

- **Home:** `tactics.ts`, reusing the existing ray enumeration (audit: it *"already exists
  twice: `rayDetails`, `transition.ts:248`, and the `line_blockers` walk"*).
- **State projection** `rules.tactic.reading.ray_classification@1` (disposition
  `inspector_only`) over slider rays with exactly one blocker, kinds: **absolute pin**
  (target = own king; pure geometry + rules — chessops legality already enforces the
  movement restriction; grounding `position_rules`, exactness `exact`); **relative pin**
  (target's declared P/N/B/R/Q value is strictly greater than the blocker's); **skewer**
  (front piece's declared value is strictly greater than the back piece's); **X-ray
  attack/defense** (attack through one intervening
  piece, either color). Value-conditioned kinds ground `declared_convention`. Since one
  projection carries both exact and convention kinds, the projection declares
  `declared_convention`/`convention` overall with the absolute-pin exactness noted in
  semantics (the conservative direction; never the widening one).
- **Transitions fall out of the state** via the F2 before/after join
  (created/released/preserved) — **no separate delta detector is built, and no ray event
  family is registered at landing**: the state projection is the deliverable, deltas are
  measured by the harness as a probe. Read as **state, not event**: the measured lesson
  *(d542 §7d)* is 5.60% static prevalence vs 1.28× as a delta.
- **Operands:** slider (square, role, color); blocker (square, occupant); target (square,
  occupant); full ray squares; classification kind; exact compared roles and convention
  values where value-conditioned.
- **Fixtures:** absolute pin positive; skewer with the value order reversed relative to
  the pin fixture (*"same geometry, different classification — this pair is the
  non-vacuity core"*). Hard negatives: two blockers on the ray (X-ray at most, not pin);
  "pin" against an equal-valued back piece (relative pin must not fire). **Regression
  fixture:** the d542 probe's own recorded bug — lifting the
  slider instead of the blocker → 0.00% everywhere — becomes a permanent fixture.
- **Measurement + sign:** static prevalence per kind; lift reported both as state-presence
  and created-delta; predeclared: state dominates.

#### 3.6 Threats + salience (audit §3.13; row D741 — `blunder_prevention`'s producer)

- **Home:** `tactics.ts`. **Consequence** projection
  `rules.tactic.consequence.threat@1` under `threat@1` (§2.6): grounding
  `declared_convention`, exactness `convention`; cost cheap (one-ply + legal exchange);
  abstention `possible: true`, reasons `["pass_while_in_check"]`. Outside that case the
  enumeration is total and "no threat" is an empty result, not an abstention.
- **The salience join**, in the same projection's operands (the bot literature's demand,
  D670): `createdByLastMove: boolean` (was this threat absent before the opponent's last
  move) and `attackerJustMoved: boolean` — a join of the threat stream against
  `run.record.move`, pure arithmetic, *"the operand that makes the explainable-miss
  differentiator possible"*. Law 8 per the audit: *"naming a threat that exists is
  arithmetic; it grades nobody."*
- **Operands:** threatening piece; target; local-exchange result or mate flag; the
  threatened move itself; `createdByLastMove`; `attackerJustMoved`; pass convention id.
- **Why it exists:** the R3 module table (`tools/r3-presentation-harness/output.md:24`)
  carries `blunder_prevention` as an owner-ruled candidate with **no producer to consume**
  (audit §2 row 13). This projection is that producer; the module itself remains Phase 3's.
- **Fixtures:** mate-threat positive; material-threat positive. Hard negative: a "threat"
  whose local exchange is negative (must not fire). Abstention: side to move is in check
  yields `pass_while_in_check`; en-passant is cleared before the hypothetical opponent
  move. **Salience fixture:** a pre-existing
  threat after an unrelated move — `createdByLastMove` must be `false`. Non-vacuity.
- **Measurement + sign:** new probe; threat-presence lift reported both signs, direction
  predeclared as negative-primary on the avoidance analogy (a played move rarely leaves a
  new positive local-exchange threat against oneself); the D674 salience-hierarchy experiment is the
  designated downstream instrument, not this RFC's gate.

#### 3.7 Fork (audit §3.2; build-order item 7 — **the one collector the audit's D730–D744 set reserves no row for**; see §Ledger rows)

- **Home:** `tactics.ts`. **Two projections, never conflated** (hard rule from D545:
  *"never emit 'fork' on geometry alone"*):
  - `rules.tactic.event.double_attack@1` — *transition event*, mover-anchored: after the
    move, the moved piece attacks ≥ 2 enemy targets, each either (a) has a positive
    `legal-exchange@1` capture by the mover or (b) is the king (check). Grounding
    `declared_convention`, exactness
    `convention`.
  - `rules.tactic.consequence.fork_survives_reply@1` — the stronger but still local claim:
    over all legal replies, no single reply makes every target locally exchange-non-positive
    or parries the check;
    one-ply enumeration over the existing `legalAlternativeEdges` enumerator
    (`semantic-evidence.ts:257`). `derivation.inputs` names the state event. **Retains
    the refuting move when one exists** — *"retention of the defusing move is what makes
    the negative fixture checkable."* Abstains (`refutation_exists`) rather than firing
    when a defense holds.
- **Operands:** mover (square before/after, role); target list (square, occupant,
  per-target legal capture + exchange result); consequence adds the refutation move or
  its declared absence.
- **Measured sign and the pre-authorized fallback, as ruled ([[D745]] (4)):** D730's
  exact `double_attack` probe measures **1.72× (95% 0.72–2.94) authored** and **1.96×
  (1.32–2.71) imported**, versus geometry-only **0.72×/1.00×**. The ruled fallback says
  *"if post-SEE lift
  still reads below 1.0, the shipped form becomes opponent-relative
  `fork_allowed`/`fork_avoided` — the measurement decides the direction, no second
  round-trip."* The measured point estimates are not below 1.0, so the fallback does not
  trigger; the authored interval still crosses 1.0, so no universal positive-primary
  disposition is permitted. The exact event registers research/inspector-only. If the
  permanent implementation changes either population's point estimate below 1.0, the
  registered primary reading flips to the opponent-relative family
  (`fork_allowed` event + avoidance form) **and that outcome is recorded, not
  rationalized** (law 6).
- **Fixtures:** knight fork of king+rook positive. **Hard negative: geometric "fork" of
  two defended pawns — the 0.72× population — MUST NOT fire.** Consequence hard negative:
  double attack parryable by one defending move (state fires; consequence abstains). The
  fixture corpus must include geometric-only forks (non-vacuity).

#### 3.8 Pawn islands / connected pawns / chains (audit §3.6; row D735)

- **Home:** `packages/runtime/src/structure.ts` (extension — a new exported reading
  function under the existing `rules.structural` producer; **not** a new
  `STRUCTURAL_FEATURE_KINDS` member, §2.2).
- **State projection** `rules.structural.reading.pawn_connectivity@1` (disposition
  `inspector_only`), per color: island count (connected components over files containing
  own pawns — doubled pawns on one file are one island, a fixture); connected-pawn pairs
  (adjacent files, support stated as mutual or one-way); chains (maximal diagonal support
  runs) with the **base** identified (the attackable member). Grounding
  `position_rules`, exactness `exact`.
- **Event family** `pawn_islands` on the island-count magnitude via §2.1's compare
  (gained/lost/preserved), plus the avoidance form.
- **Operands:** per-color island count and file-set per island; pair squares; chain
  squares + base square; before/after counts on the event.
- **Fixtures:** 3-island positive; chain with base named. Hard negatives: doubled pawns
  single island; all-pawns-one-wing (one island despite open files elsewhere).
  Non-vacuity: static >2-islands prevalence measured 4.67% *(d542)*.
- **Measurement + sign:** `pawn_island_gained` already measured **2.13×** — **positive
  reading viable as an event; ship state + event** (the one family in this RFC whose
  played-move reading is predeclared positive-primary). Side effect the audit names for
  the record: the orphaned `hanging-pawns` shape entry — *"named by no pack"* (r8 audit) —
  finally has a detector; no content is touched here.

#### 3.9 Development (audit §3.8; row D737)

- **Home:** `packages/runtime/src/phase.ts` (state) + `transition.ts` (event).
- **State:** `rules.phase.development@1` on the existing `rules.phase` producer — the
  per-color undeveloped-minor list **with squares retained**, upgrading the count-only
  `undevelopedMinors` (computed on every `classifyPhase` call, registered operand of
  `rules.phase.reading@1`, *"rendered by nothing"*). One producer, one computation, a
  richer projection; the phase classifier keeps consuming the count. Grounding
  `declared_convention` (the `development@1` basis is a convention), exactness
  `convention`. Disposition `inspector_only`.
- **Event:** family `developed` added to `TRANSITION_RULE_EVENT_FAMILIES` — signs per
  §2.6's `development@1`: developed / development lost; capture-on-home-square is neither.
- **Fixtures:** Ng1–f3 positive; Nf3–g1 lost-sign; capture-on-home-square hard negative;
  non-vacuity over the corpus (openings fire, endgames do not).
- **Measurement + sign:** unmeasured as an event; free probe rides the harness; direction
  predeclared positive (played opening moves develop more often than random legal
  alternatives) — able to fail.

#### 3.10 Rook on the seventh (audit §2 row 6, §5 item 10; row D736)

- **Home:** `tactics.ts` under `rules.tactic` (homed with the attack-map plumbing).
  **State** `rules.tactic.reading.rook_on_seventh@1`, disposition `inspector_only`:
  rook (or doubled rooks — count retained) on the seventh rank relative to its color,
  with the **meaningfulness operands retained and eligibility deferred**: enemy king on
  its back rank or cut off (which), enemy pawns on the seventh (squares). Grounding
  `position_rules`, exactness `exact` — the operands are facts; *which* of them makes the
  rook meaningful is a Phase-3 eligibility decision, not a detector claim.
- **Fixtures:** classic seventh-rank rook positive; hard negative: rook on the seventh
  with no enemy king constraint and no seventh-rank pawns (state fires with empty
  meaningfulness operands — the fixture verifies the operands, not a suppression);
  mirror fixture.
- **Measurement + sign:** measured **3.83×, 8.09% static** *(d542)* — positive reading
  predeclared primary.

#### 3.11 Space (audit §3.10; row D738)

- **Home:** `structure.ts` under `rules.structural`. **Level reading**
  `rules.structural.reading.space@1` under `space@1` exactly as ruled (§2.6): per-zone
  per-color counts + differentials, emitted as a count-carrying state. **The delta is
  demoted concretely: no space event family is registered at landing** — the gain-delta
  measured 1.09× *(d542)*, *"weak as an event; register as a level
  reading"* (the §7d lesson). Disposition `inspector_only`. Grounding
  `declared_convention`, exactness `convention`, the chess-tradition citation in the
  convention text (§2.5).
- **Fixtures:** positive per zone (three); **the honesty fixture, as ruled:** a pawn
  *advance* that **loses** space under the declared test (advances can concede control
  squares — [[D745]] (1) names this fixture explicitly); mirror fixtures extending the
  `structure.ts` mirror machinery to the new kind.
- **Measurement + sign:** level-reading prevalence and delta lift both reported; the delta
  is predeclared weak (≈1.0) and the criterion scores the *level* reading's census, so the
  criterion can fail on a broken producer without pretending the delta is a signal.

#### 3.12 Discovered latency (audit §3.14; row D740)

- **Home:** `structure.ts`/`tactics.ts` — this is **`vacationReading` resurrected plus a
  filter, not new detection**: `vacationReading` (`structure.ts:517`; exported, dead —
  only export site `index.ts:106`) filtered to enemy-occupied gains with a positive
  legal-exchange/king
  condition. **State** `rules.tactic.reading.discovered_latency@1`, disposition
  `inspector_only`: own piece P screens a friendly slider S from an enemy target T on a
  one-blocker ray, so moving P creates a discovered attack (discovered check when
  T = king). Grounding `declared_convention` (exchange-conditioned; discovered-check arm is
  exact and noted in semantics), exactness `convention`.
- **The executed case is an adapter, not a collector** (no-duplicate-collector rule):
  derivable today over registered `rules.transition.event.slider_ray:gained` where the
  subject blocker was the mover. The adapter is declared with `derivation.inputs`; no new
  chess code. The D553 shape join (fianchetto + screening knight as an authored trigger
  joined by eligibility to this latency state) is **F5's eligibility work, not a third
  producer** — named out of scope.
- **Operands:** screen piece; slider; target; ray squares; discovered-check flag;
  per-target legal capture and exchange result.
- **Fixtures:** fianchetto battery with screening knight and an enemy piece on the long
  diagonal; discovered-check positive. Hard negatives: two blockers; **blocker is an
  enemy piece** (that is *their* discovered attack — the sign/ownership fixture).
  Non-vacuity.
- **Measurement + sign:** new probe; predeclared state-shaped (prevalence, not delta
  lift). The bot-side salience reading is D670's *measured candidate, not an assumed
  truth* — downstream, not this gate.

#### 3.13 Trapped piece + back-rank (audit §3.4/§3.5; row D739)

- **Home:** `tactics.ts`. Two states under §2.6's conventions:
  - `rules.tactic.reading.trapped_piece@1` (`trapped@1`): operands — piece; square;
    legal attackers on the current square; every legal destination; and, per destination,
    every opponent legal capture of the moved piece with its `legal-exchange@1` result.
    The geometric half exists today as `safeDestinations` (`transition.ts:191`,
    internal, geometric-only) and is upgraded by the legal-exchange filter. Grounding
    `declared_convention`, exactness `convention`.
  - `rules.tactic.reading.back_rank@1` (`back_rank_susceptible@1`): operands — king
    square; blocked/attacked escape squares (which and why); accessing enemy heavy pieces
    and their files/paths. Susceptibility, not mate. **Mate-in-1 through the back rank is
    a separate exact rules projection** `rules.tactic.consequence.mate_in_one@1`
    (one-ply, free, grounding `position_rules`, exactness `exact`) — emitted distinctly so
    the convention state never borrows the exact claim's authority.
- **Fixtures:** bishop trapped on a7 by b6 positive; hard negatives — zero-mobility piece
  that is not attacked; attacked piece with one exchange-neutral escape. Back-rank: classic
  no-luft open-file rook positive; hard negatives — luft exists; no heavy pieces; and the
  defended-entry case fires *susceptibility* but not *mate_in_one* (the pair fixture that
  keeps the two projections honest). Non-vacuity: corpus prevalence strictly interior for
  both.
- **Measurement + sign:** both unmeasured — new probes ride the harness; trapped
  predeclared rare and state-shaped; back-rank predeclared negative/avoidance-leaning
  (*"your move made luft; N% of alternatives left the back rank closed"*) — declared as
  the question, measured, both signs reported.

#### 3.14 Promotion-square pressure (audit §3.12; row D742)

- **Home:** `exchange.ts` or `tactics.ts` under a derived projection —
  `derived.tactic.promotion_pressure@1`: **a derived producer that computes nothing new,
  it joins** — `derivation.inputs` naming the existing `passed_pawn` predicate,
  `direct_attack_count` (both colors at the queening square), and `line_blockers`
  (pawn→promotion square), plus the rule-of-the-square exact arithmetic
  (kings-and-pawns-only, declared scope). Grounding `position_rules` where all inputs are
  exact; exactness `exact`; **declared limitation: pressure description only — outcome
  words are deferred to the tablebase projection** (Syzygy owns the exact outcome ≤ 7
  men).
- **Operands:** pawn square; distance to promotion; promotion-square control balance;
  path blockers; rule-of-the-square verdict with its scope flag.
- **Fixtures:** Lucena-adjacent positives (the endgame catalogue has the positions);
  blockaded passer hard negative (operands show the blocker); rule-of-the-square
  boundary pair — king exactly in / exactly out of the square (the D451 able-to-fail
  pair).
- **Measurement + sign:** census over endgame-phase positions, not lift (it is a join
  over existing exact projections); non-vacuity strict-interior.

#### 3.15 Opening identity at runtime — deferred to D743/R8/F7, not scoped here

The audit correctly identified this missing producer, but also bound it to an exploration
lane that has not opened. It is therefore **not** an implementation item, projection, acceptance
criterion or discharge in this RFC. D743 retains the intended shape—position-keyed lookup over
the existing CC0 table, deepest-match precedence, transposition identity and honest out-of-book
abstention—and the later R8/F7 RFC must re-verify those requirements when its gate opens. This
split prevents a collector RFC from being called accepted while one of its normative items is
explicitly forbidden to start.

#### 3.16 Maia per-candidate WDL repair (audit §3.15; row D744)

- **State at HEAD:** lossy — WDL parsed per candidate
  (`apps/server/src/opponent-selector.ts:278,288`), transported through
  `rest.ts:200-220` inside `HumanSplitPage`, and **no projection names it**.
- **Fix:** sibling projection `human.maia.candidate_wdl@1` on the existing `human.maia`
  producer (a sibling, not an operand edit to the shipped `human.maia.policy@1` — §2.4),
  grounding `human_model`, exactness `measured`, disposition `inspector_only`. Renderer
  admission is F5's decision; whether it may face learners is governed by
  `design/research/maia-wdl-versus-human-outcome.md`. No new chess computation.
- **Fixtures:** a captured UCI line with `wdl` round-trips to the projection (**starts
  red at HEAD**); a line without it yields declared absence.
- **Sequencing:** *"small, rides any catalog-touching commit"* (audit §5 item 16).

### §4 — The rulings this RFC carries (D745, quoted)

All four rulings are encoded above; quoted here so the encoding is checkable against the
ruling:

1. **Space:** *"classic zones (files a–c / d–e / f–h) + pawn-controlled squares in the
   enemy half — the textbook convention, declared in the RFC and cited as
   `chess_tradition`; the honesty fixture is a pawn advance that loses space under the
   test."* → §2.6 `space@1`, §3.11, §2.5.
2. **Negative reading:** *"The negative reading FACES LEARNERS in post-commit and review
   modules — 'you avoided leaving a piece loose; N% of your legal moves would not have' —
   denominator always shown, never on the pre-commit path… a detector with lift below 1.0
   is a detector pointing the other way, and now it may say so to the person who earned
   it."* → §3.4's primary-reading declaration; the module wiring is Phase 3's.
3. **Castling prevented:** *"discharges as the two mechanical forms
   (rights-lost-with-cause; legality-state-with-reason); the intent reading stays refused
   under law 8."* → §3.2.
4. **Fork fallback:** *"PRE-AUTHORIZED: if post-SEE lift still reads below 1.0, the
   shipped form becomes opponent-relative `fork_allowed`/`fork_avoided` — the measurement
   decides the direction, no second round-trip."* → §3.7, criterion A9 states both
   branches.

### §5 — Consolidated pack and schema impact (report only — nothing touched)

Per the audit's §6, consolidated; this RFC performs none of it:

- **No pack re-authoring, no content edits, no witness entries** — because §2.2 defers the
  authorable-vocabulary admission, all 50 authored drafts remain valid *and untouched by
  construction*, not merely by additivity.
- **The one genuine migration hazard is inherited, not created, and does not ride here:**
  any repair of `pawn_safe_square` semantics (D566) changes the truth set of `outpost`,
  which authored content now references **77 times** — that is D632's F3/Gate-F migration
  and *"must not ride this RFC"* (audit §6).
- **Selection policy:** unchanged; no new family is critical (§2.3); sealed R2 fixtures
  re-run as a criterion.
- **Non-collector residues named by the audit and NOT fixed here** (audit §7, for the
  record): the dead `pawn_count` sentence arm (`structural-sentences.ts:27`, D548/D720
  residue); `structuralDelta` remains exported-dead pending the phase-6 candidate-salience
  lane; `concessionRatio` and the `/capabilities` disposition fields (class 5) belong to
  later phases.
- **Ledger-row impact:** §Ledger rows below; rows flip only per the completion protocol at
  landing.

## Deviations from design

1. **From the audit (planning tier, §6), not from `design/`:** new families do **not**
   extend `STRUCTURAL_FEATURE_KINDS`; the authorable pack vocabulary is deferred (§2.2).
   Rationale: register discipline (a pack lane behind two live claims for a vocabulary no
   author has asked to write), and scope honesty for a research/inspector-only landing.
   The audit's fixture demand transfers to runtime fixtures; the witness demand transfers
   to the follow-up.
2. **`chess_tradition` as citation basis, not grounding member** (§2.5) — a reconciliation
   of [[D745]]'s wording with the shipped closed union, in the non-widening direction.
3. **Opening identity split out** (§3.15) — the audit correctly gated it on R8/F7, so it
   cannot also be a required item in an otherwise implementable collector RFC.
4. Otherwise **none**: `design/05` §5's detection/significance split and §3b's
   never-recommend rule are load-bearing constraints this RFC implements rather than
   deviates from.

## Acceptance criteria

Every criterion below can fail (D451); A-numbers are the audit trail for the landing
report. Where a criterion quotes a measured number, the number is the *predeclared
direction*, and recording a contrary measurement is the criterion **passing as
instrumentation** while the named fallback branch executes (only A9 has a pre-authorized
fallback; every other contrary measurement is escalated per law 6, not shipped around).

1. **A1 — Registration completeness.** Every projection id in Appendix A (unit:
   projection id; total: **28**, stated in that table's caption) exists in the compiled
   catalogue; `make evidence-manifest-check semantic-evidence-check` passes; the docs
   tuple in `docs/semantic-evidence.md` and `docs/evidence-contract.md` is updated in the
   same change. A1 counts the same unit as the Appendix A table.
2. **A2 — Operand fidelity.** For each projection, the declared `operands` match §3's
   list verbatim; event families enforce them through `requiredOperands`.
3. **A3 — Convention pinning.** The six §2.6 conventions appear verbatim (values and
   text) in the catalog declarations; legal-capture enumeration excludes pinned
   recapturers and illegal king captures, retains X-ray branches, and the space
   chess-tradition citation is present as declared semantics.
4. **A4 — Dispositions.** Every new state reading carries `inspector_only`; every new
   event/avoidance projection is eligible only for `research.semantic_selection@1`; grep
   over `apps/ packages/` (tests/tools excluded) for the nine R3 module ids and six
   workflow ids still returns **0 production hits**.
5. **A5 — Four-part fixtures.** Every §3 item has its named positives, hard negatives,
   abstention fixtures where declared, and a strict-interior corpus census; the suite can
   express negatives (a `lacks()`-style assertion exists where used).
6. **A6 — Fixtures that start red.** The following are committed before their fixes and
   verified failing at pre-implementation HEAD, then green at landing: the D547
   `e1h1`-form reading-plane pair (§3.2); the en-passant capture-identity fixture (§3.3);
   the Maia WDL round-trip (§3.16); the legal-exchange sign-disagreement fixture (§3.1, red because
   no producer exists); the fork geometric hard-negative (§3.7). The d542 pin-probe
   slider/blocker bug fixture is committed as a regression guard **and is labeled a guard
   that cannot fail at landing** if implementation is correct first-try — stated plainly
   so it is never scored as evidence (the D444/D451 lesson).
7. **A7 — Legal-exchange downstream reproduction.** The permanent collector reproduces
   D730's directional result without changing either population's eligible-row or
   alternative count by more than 10% unless the landing report identifies a deliberate
   domain correction: `moved_piece_en_prise` remains below 1.0 with both bootstrap upper
   bounds below 1.0; `double_attack` remains above 1.0 by point estimate in both
   populations, with the imported interval excluding 1.0 and the authored interval
   recorded as uncertain rather than promoted to a universal prior.
8. **A8 — Per-collector measurement.** Every scoped §3 build item's measurement (lift with sign, or
   census/coverage where the spec says lift is not the instrument) is run on both the
   authored spine and `r2-imported-sample@a10a233e…` and recorded in the harness output;
   the capture event carries **no** lift claim (A8 fails if one is scored).
9. **A9 — Fork branch, both ways (pre-authorized).** D730 does not trigger the fallback:
   `double_attack` ships as exact research/inspector evidence with **no global
   positive-primary disposition**, because only the imported interval excludes 1.0. If
   the permanent implementation moves either population's point estimate below 1.0, the
   registered primary reading flips to opponent-relative (`fork_allowed` + avoidance),
   the flip is recorded in the landing log entry, and no third option exists.
10. **A10 — Reading-plane repair.** `irreversibility()` fires `castled` on both UCI
    forms; an imported PGN game containing castling shows the reading and pivotal marker
    (the D547/D719 residue retires).
11. **A11 — Refusals intact.** `RECORDED_READING_DISPOSITIONS` at
    `position-evidence.ts` still refuses all four recorded kinds verbatim; no projection
    or sentence in the diff contains valence words (good/bad/best/blunder/mistake) or
    opponent-intent phrasing ("prevented" of a purpose); the loose-piece ceiling sentence
    is the registered maximum.
12. **A12 — Sealed surfaces unmoved.** The R2 selection-policy fixtures re-run unchanged;
    `criticalEvents` is byte-identical; no shipped projection declaration changed
    (manifest diff shows additions only, plus the two named producer-body fixes).
13. **A13 — Register silence.** `node tools/register-check.mjs` passes with this RFC
    declaring `none`; `DRILL_PACK_SCHEMA_VERSION`, the run schema, migrations, and
    `EvidenceGrounding` are untouched; no `content/` byte changes.
14. **A14 — Mirror coverage.** Every new state family has mirror fixtures and survives
    the mirror machinery (extended where §3 says so).
15. **A15 — Avoidance generalization.** The avoidance derivation produces
    counterfactual-absence events for the new tactical families with complete denominators,
    and the declared family list exactly replaces the `rules.structural.event.` prefix
    filter (a fixture proves a structural family still produces avoidance identically —
    the no-regression half).
16. **A16 — Closeout protocol.** The landing commit flips the already-recorded rows this
    RFC ships (D730–D742, D744 and D749) per the completion protocol, leaves deferred
    D743 open, and appends the
    `planning/exploration/log.md` entry — in the same commit (the CLAUDE.md
    ledger-and-log clause).
17. **A17 — Production-site closure.** The implementation diff's production files are a
    subset of §1.1's ten sites. Any additional production site returns the RFC for an
    amendment naming its responsibility and collision impact before that edit lands.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Production-module eligibility for every §3 collector — this RFC lands research/inspector-only by design; without promotion these projections join the class-9 wall the gap matrix measured | `planning/evidence-foundation-ux/plan.md` | the Phase-3 RFC's landing commit | |
| D2 | Learner-facing wiring of the D745 negative reading — ruled admissible post-commit/review; the *wiring* into modules is Phase-3 work over these producers | `planning/evidence-foundation-ux/plan.md` | the Phase-3 RFC's landing commit | |

The prose rationale for each row lives in the owning §3 section and §Open questions; the table is
the machine-read record per the lifecycle contract's grammar.
## Open questions

1. **None blocking acceptance from the D745 set** — all four collector-audit questions
   are ruled and encoded (§4). Question 5 of the audit (principle citations, D530/D531)
   is a standing dependency of a *different* row (§2 #19 of the audit) and no collector
   here can close it.
2. **The authorable-vocabulary follow-up** (§2.2): when authors need to write the new
   kinds in pack conditions, a follow-up RFC claims the pack lane, extends
   `STRUCTURAL_FEATURE_KINDS` + the schema arms + witnesses, and inherits the audit §6
   impact analysis. Deferred, named, not silently chosen.
3. **Wave B breadth** (D723–D729 and D746–D748: square denial/restriction, pawn dynamics beyond
   connectivity, activity/coordination, king/imbalance composites, multi-edge
   persistence): out of this RFC by the audit's own boundary — *"a prioritized
   foundation, not a complete middlegame ontology"* (D723). The first eleven one-edge
   probes and the first consecutive-edge census have now landed (`5a20b42`): pawn
   harassment, locked pairs and defence-edge loss are promising; generic pawn contact and
   slider alignment are not learner semantics; the preserved-pressure sequence is exact
   but rare. Exchange/search-dependent Wave-B semantics remain research, not hidden scope here.
4. **Also deliberately out** (audit §5): the per-candidate application adapter (phase 6,
   D669 lane); time-usage modelling (*"expensive, deferred per `human-like-opponents.md`
   §6d"*); plan labels (D530 citation grounding — an owner ruling, not a collector).

## Ledger rows (already recorded; flipped by the implementation landing pass)

The audit reserved **D730–D744** and the ruling commit recorded them in
`design/BACKLOG.md` from audit §9 (summarized): **D730** legal local exchange
(`legal-exchange@1`, §3.1, amended by D730 measurement) · **D731** castling family + reading-plane unification (§3.2)
· **D732** capture identity + exchange-classified captures + trade join (§3.3) · **D733**
hanging/loose with the avoidance form as primary reading (§3.4) · **D734** ray
classification family (§3.5) · **D735** pawn connectivity (§3.8) · **D736** rook-on-7th
with meaningfulness operands (§3.10) · **D737** development (§3.9) · **D738** space under
`space@1` (§3.11) · **D739** trapped + back-rank (§3.13) · **D740** discovered latency +
executed-discovered adapter (§3.12) · **D741** threats under `threat@1`,
`blunder_prevention`'s producer (§3.6) · **D742** promotion pressure (§3.14) · **D743**
runtime opening identity (deferred §3.15) · **D744** Maia WDL repair (§3.16).

**Fork had no reserved row** — the audit's §9 set skipped its own §3.2. D749 now records
the dedicated exact-event work and D730's measured sign. D750–D753 record the four spec
defects found by the prerequisite pass: pseudo-SEE legality, pass-state abstention,
undefined trapped-destination semantics, and the gated opening item mixed into an
implementable RFC.

## Appendix A — projection id enumeration

Unit: **projection id**; total: **28**. This is the closed list A1 counts; adding or
dropping an id is a spec change with a changelog line, never a silent drift.

| # | projection id | §3 item | role |
|---:|---|---|---|
| 1 | `rules.exchange.predicate.legal_exchange@1` | 3.1 | predicate |
| 2 | `rules.castling.reading.rights@1` | 3.2 | state reading |
| 3 | `rules.castling.event.rights_lost@1` | 3.2 | transition event |
| 4 | `rules.castling.reading.legality@1` | 3.2 | state reading |
| 5 | `rules.transition.event.capture@1` | 3.3 | transition rule event |
| 6 | `derived.exchange.capture_class@1` | 3.3 | derived |
| 7 | `derived.exchange.trade_completed@1` | 3.3 | derived join |
| 8 | `rules.tactic.reading.loose_piece@1` | 3.4 | state reading |
| 9 | `rules.tactic.event.loose_piece@1` | 3.4 | structural-style event |
| 10 | `derived.semantic_avoidance.loose_piece@1` | 3.4 | avoidance event |
| 11 | `rules.tactic.reading.ray_classification@1` | 3.5 | state reading |
| 12 | `rules.tactic.consequence.threat@1` | 3.6 | consequence |
| 13 | `rules.tactic.event.double_attack@1` | 3.7 | transition event |
| 14 | `rules.tactic.consequence.fork_survives_reply@1` | 3.7 | consequence |
| 15 | `rules.structural.reading.pawn_connectivity@1` | 3.8 | state reading |
| 16 | `rules.structural.event.pawn_islands@1` | 3.8 | structural event |
| 17 | `derived.semantic_avoidance.pawn_islands@1` | 3.8 | avoidance event |
| 18 | `rules.phase.development@1` | 3.9 | state reading |
| 19 | `rules.transition.event.developed@1` | 3.9 | transition rule event |
| 20 | `rules.tactic.reading.rook_on_seventh@1` | 3.10 | state reading |
| 21 | `rules.structural.reading.space@1` | 3.11 | level reading |
| 22 | `rules.tactic.reading.discovered_latency@1` | 3.12 | state reading |
| 23 | `derived.tactic.discovered_executed@1` | 3.12 | derived adapter |
| 24 | `rules.tactic.reading.trapped_piece@1` | 3.13 | state reading |
| 25 | `rules.tactic.reading.back_rank@1` | 3.13 | state reading |
| 26 | `rules.tactic.consequence.mate_in_one@1` | 3.13 | consequence (exact) |
| 27 | `derived.tactic.promotion_pressure@1` | 3.14 | derived join |
| 28 | `human.maia.candidate_wdl@1` | 3.16 | source projection |

If the A9 fallback branch executes, ids 13–14 are replaced by
`rules.tactic.event.fork_allowed@1` + `derived.semantic_avoidance.fork_allowed@1` — the
total stays 28 and the swap is recorded in the changelog and the landing log entry.

## Changelog

- 2026-08-22: created from `planning/evidence-foundation-ux/phase2-collector-audit.md`
  (HEAD `7eb9210`) with all symbols re-verified at drafting HEAD `6526ccf`; D745 rulings
  encoded; no register claims.
- 2026-08-22: amended after the predeclared D730 legal-exchange instrument. Replaced the
  pseudo-attacker swap with legal recapture-only minimax; recorded paired-bootstrap
  results and uncertainty; fixed pass-in-check abstention and trapped-destination
  semantics; added the production-site census; split gated opening identity back to
  D743/R8/F7; corrected the closed projection count from 29 to 28.
