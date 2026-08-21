# Phase 2 — required-collector audit (D717 program)

> **2026-08-22 prerequisite correction:** this audit's pseudo-SEE proposal is superseded by
> `design/research/legal-exchange-prerequisite.md`. The measured production contract is legal
> recapture-only minimax (`legal-exchange@1`), not the pinned-attacker-inclusive swap described
> below. `rfc/tactical-collectors.md` carries the amended normative form. Historical audit text is
> retained so the falsified assumption remains visible.

**Commissioned by the D717 program routing** (`planning/evidence-foundation-ux/plan.md`, phase 2).
Re-derived at HEAD `ccb378d`, 2026-08-22. Method: every state claim below was verified **at the
symbol at HEAD**, never trusted from a ledger row or dossier — the measured stale rate of this
repo's rows is 8–40%, and this pass found four of the seven assigned rows partially stale (§1).
Measured numbers quoted from `design/research/classifier-coverage-and-noise.md` (d542 harness,
`424374f`) are marked *(d542)*; they predate the F2 event plane but the corpus and detector
arithmetic are unchanged, so the lifts still bound the same definitions.

**Binding rules honored:** no intention inference; no LLM chess truth (law 8); geometry is not a
tactic without the material/functional test (D545: `fork_created` 0.72× on geometry alone; SEE is
the prerequisite, D673); no duplicate collector where an adapter is the gap; this document is the
basis for the Phase-3 RFC, not implementation. Ledger ids proposed here start at **D730**
(Phase 1 proposes from D718 and has already used D718; nothing here collides). Proposals are
written here only — the audit's landing commit flips no rows and writes no design docs.

---

## 1. Re-derivation of the seven assigned rows

| Row | Status col | Verdict at HEAD | What moved, at the symbol |
|---|---|---|---|
| **D544** | 🐞 open | **PARTIALLY STALE** | The core holds: the tactical family (hanging, fork, pin/skewer, islands, rook-7th, castling rights, space) is still absent from `packages/runtime/src/structure.ts` and the catalog. But **two of the three "computed and thrown away" atoms are no longer thrown away**: `capturedRole` now feeds the registered `rules.transition.event.{clock_reset,last_of_role}` semantic events (`transition.ts:310-312`), and `undevelopedMinors` is a registered operand of `rules.phase.reading@1` (`evidence-catalog.ts:200`) — though still count-only and never rendered (`phase.ts:55-59` prints only the band). The FEN castling field is **still unread** (verified: the only `castling*` reference outside tests is `castlingSide` for UCI canonicalization in `semantic-evidence.ts:133`). The runtime opening-identity refusal **holds verbatim** at `position-evidence.ts:25`. The row also now understates HEAD: F2 shipped 11 structural + 5 transition-geometry + 6 transition-rule **semantic event families** with retained identities (`evidence-catalog.ts:110-119`), which the row's "17 structural detectors" inventory predates. |
| **D545** | 💡 open | **PARTIALLY STALE** | "No measurement in this repo has ever been read for sign" is no longer true at the mechanism level: `derived.semantic_avoidance.*` implements the counterfactual-absence reading over all 11 structural event families, sign `avoided`, valence `none`, complete-population denominators retained (`semantic-evidence.ts:323-334`, `evidence-catalog.ts:185-195`), with D571's valence correction encoded ("never inferred intent, praise, or move quality"). Its only consumer is `research.semantic_selection` — research-only, correctly. The **fork caution holds unchanged**: no fork collector exists, geometry-only remains unshipped, SEE remains absent. |
| **D547** | 💡 open | **PARTIALLY STALE — fixed on the event plane, still broken on the reading plane** | The semantic event `castled` fires on both UCI forms: `transitionSemanticFacts` tests `\|Δfile\| >= 2` (`transition.ts:309`) and anchors are canonicalized by `canonicalMoveUci` (`semantic-evidence.ts:129-137`), which maps `e1h1`→`e1g1`. But `irreversibility()` still tests `=== 2` (`transition.ts:351`), and `pgn-import.ts:54` still builds UCIs with chessops `makeUci` (which emits `e1h1`-form) — so the **reading/pivotal plane** ("White castled." in the What-changed panel and the timeline marker) still cannot fire on any imported game. The defect migrated from "everywhere" to "the reading plane only". |
| **D548** | 💡 open | **PARTIALLY STALE — F1 dispositioned it; residue remains** | `rules.structural.reading.pawn_count` now carries an explicit `retired` disposition ("Zero emitted observations… matcher-only at F1", `evidence-catalog.ts:158`), is filtered out of reading consumers (`:291`) and compare witnesses (`:95`). Deliberately retained: the **predicate** role (`STRUCTURAL_FEATURE_KINDS`, `packages/schema/src/drill-pack/types.ts:375`) for authored expressions. Residue: the renderer sentence at `apps/web/src/lib/structural-sentences.ts:27` is now permanently dead code. |
| **D632** | 🐞 open | **HOLDS** | The `outpost → pawn_safe_square` dependency is now *declared* in the catalog (`dependsOn` at `evidence-catalog.ts:140`) with the convention limitation ("Enemy-pawn projection is a Tabiya convention, not legal-move safety", `:141`) — the F2 read-only report the row records. No repair of the D566 semantics has shipped; `outpost` reach in `content/` is now **77 occurrences** across pack/shape/witness JSON (grown from the row's 23-across-three-documents count). F3/Gate-F migration remains open, and any pawn_safe_square repair still changes the authored `outpost` truth set (§6). |
| **D686** | 📊 | **HOLDS** | `tools/r3-presentation-harness/{real-packet.ts,real-packets.json}` present; the module-contract table in `output.md` shows exactly the boundary the row states: per-module semantic allow-list + fact caps (0–3 for play-time modules, 20 for the inspector), with `sight_on_request`/`blunder_prevention` as owner-ruled candidates. Owner-use R3 still pending. This is the eligibility shape every collector below must declare into. |
| **D694** | 📊 | **HOLDS EXACTLY** | `tools/r8-theory-drill-harness/audit-output.md`: authored-draft opening-identity records **0 across 50 packs**; candidate-only **52 across 9**; "Review → opening identity: absent". Catalog marks `theory.opening_identity.record` "Authoring provenance only at F1" with sole consumer `authoring.claim_binding` (`evidence-catalog.ts:235,314`). |

**The three "computed-and-thrown-away" atoms, re-verified:** `capturedRole` — **no longer
discarded** (feeds two registered events, but the *generic* capture discards the captured piece's
identity, §3.9); `undevelopedMinors` — **registered but unrendered**, count-only (§3.8); the FEN
castling field — **still entirely unread** as evidence (§3.7).

---

## 2. Per-primitive state table at HEAD

State vocabulary: **absent** (no producer, at most a disposable probe) · **computed-but-discarded**
(computed in shipped code, result dropped) · **lossy** (produced/transported but identity, operand
or rendering is dropped en route) · **sourcing-only** (authoring/build-time record, zero runtime
reach) · **registered** (a compiled producer→projection→consumer chain in
`packages/runtime/src/evidence-catalog.ts`).

| # | Owner's required primitive | State at HEAD | Symbol evidence |
|---|---|---|---|
| 1 | Hanging / under-defended pieces | **absent** (probe-only) | no producer; atoms `direct_attack_count` (`structure.ts:484`), `occupied_defence` events; probe `hanging_piece_created` in `tools/d542-classifier-audit-harness/candidates.test.ts` |
| 2 | Materially meaningful forks / double attacks | **absent** (probe-only, blocked on SEE) | probe `fork_created` 0.72× geometry-only *(d542)*; SEE verified absent repo-wide this pass (grep; also `human-like-opponents.md` §6c) |
| 3 | Absolute pins / skewers / discovered attacks / X-rays | **absent** as classifications; ray atoms registered | `rules.transition.event.slider_ray` (blocker-delta identity) registered; `between()` imported (`structure.ts:1`); `vacationReading` (the unblock atom) **exported, dead** (`structure.ts:517`, only export site `index.ts:106`); pin probe 1.28× delta / 5.60% static *(d542)* |
| 4 | Trapped pieces / back-rank conditions | **absent** | adjacent atom `piece_escape` events registered (`transition.ts:292-298`); `safeDestinations` internal, geometric-only (`transition.ts:191`); no back-rank test anywhere |
| 5 | Pawn islands / connected pawns / chains | **absent** (probe-only) | probe `pawn_island_gained` 2.13× *(d542)*; pawn sets available; the `hanging-pawns` shape entry is named by **no pack** (r8 audit) |
| 6 | Rook on the seventh | **absent as a collector; expressible by hand** | an author *can* write it via the quantified square template `piece` feature (`structure.ts:27-32`); nothing emits it; probe 3.83×, 8.09% static *(d542)* |
| 7 | Castling performed / rights lost / prevented | **performed: registered (event plane), lossy (reading plane); rights: absent** | `rules.transition.event.castled` registered, both UCI forms (§1 D547); `irreversibility` reading still `===2`; FEN castles field unread as evidence anywhere |
| 8 | Development counts | **lossy** | `undevelopedMinors` registered operand of `rules.phase.reading@1`, transported, never rendered; count-only (squares discarded, `phase.ts:34-43`); no per-piece "developed" transition event |
| 9 | Captures and meaningful trades | **lossy** | `clock_reset` detail = `{pawnMove, capture: boolean}` — captured identity **discarded** (`transition.ts:311`) unless the capture is `last_of_role` (`:312`, identity retained + `queensOff` at `:354`); no SEE, so no winning/losing/balanced classification; no recapture/trade-sequence join |
| 10 | Central / kingside / queenside space, declared convention | **absent** | probe `central_space_gained` 1.09× as a delta *(d542)* — a level reading, not an event; no declared convention exists |
| 11 | Opening identity, transposition-aware applicability | **sourcing-only** | `theory.opening_identity.record` build_time, sole consumer `authoring.claim_binding`; refused as recorded reading (`position-evidence.ts:25`); keying is SAN-prefix at emission (`sourcing/openings.ts`); `transposeKey` **exists in runtime** (imported at `position-evidence.ts:2`) — the transposition join is unbuilt, not unbuildable |
| 12 | Promotion + promotion-square pressure | **promotion: registered; pressure: absent** | `rules.transition.event.promotion` registered and *critical* in the R2 selection policy (`evidence-catalog.ts:409`); no composite over `passed_pawn` + `direct_attack_count`(promotion square) + `line_blockers`(path) exists |
| 13 | Loose pieces / threats / bounded tactical consequences | **absent** | no LPDO state, no null-move threat producer, no bounded-consequence projection; the R3 `blunder_prevention` module (owner-ruled candidate) has **no producer to consume** |
| 14 | Latent configuration→consequence patterns (D553) | **absent; both atoms exist, one dead** | shape library expresses the static arrangement; `vacationReading` computes the unblock gains and is dead; the "discovered attack executed" *transition* is already derivable as an adapter over registered `slider_ray:gained` + mover-was-blocker — **no new collector needed for the executed case** |
| 15 | Stockfish deltas / consequence | **registered** | `live.stockfish.{eval,wdl,pv}`, `derived.compare.eval_delta`, `derived.story.eval_shift`, `recorded.engine.eval`; PV correctly Analyze-only ("never a guidance binding", `evidence-catalog.ts:218`); residue: no per-candidate multipv-spread (sharpness) projection — the bot lane's item (phase 6) |
| 16 | Maia policy + WDL | **policy: registered; per-candidate WDL: lossy** | `human.maia.{policy,event,uci_response}` registered; WDL parsed per candidate (`opponent-selector.ts:278,288`), transported through `rest.ts:200-220` inside `HumanSplitPage`, but **no projection names it** (policy operands are `nodeId, engine, targetElo, candidates` only) and no renderer reads it |
| 17 | Explorer population / outcome | **registered** | `human.explorer.{population,position_stats}` + `sourcing.ledger.explorer_position_census`; the recorded-reading refusals for explorer kinds are deliberate (live-only) and correct |
| 18 | Syzygy exact outcomes | **registered** | `recorded.tablebase.result`, `live.syzygy.{probe_result,result,category,distance}`, abstention `outside_tablebase_domain` declared |
| 19 | Cited theory / shape / principle evidence | **registered, with the B4 grounding residue** | `theory.shapes.firing` (authored_claim, no-uncited-consequence limitation), `pack.authored.{claim,claim_delivery}` (the D673-bug split is in); all 13 principles still declare `standsOn: "authors_practice"` — the D530 citation grounding is an open owner ruling, not a collector gap |
| 20 | Authored pack evidence | **registered** | `pack.authored.*` producer, `guidance.authored_claim` consumer, delivery-sheet vs normalized-claim projections separated |

**Already-registered set (no collector work):** 15, 17, 18, 19, 20, and the *performed* half of 7
and *promotion* half of 12. **Everything the owner calls the tactical/positional family — rows
1–6, the rights half of 7, 8–10, 13, 14 — has no producer.** F1/F2 registered the *authority
mechanics* over the primitives that existed; they did not add the primitives. That is D717's
governing sentence, confirmed at the collector tier.

---

## 3. Specifications for the missing collectors

Shared frame for every spec below. **Semantics separation** (per the brief): *state* = a fact of
one position; *transition* = a signed identity-preserving before/after relation of one played edge
(the F2 event shape — `gained/lost/preserved`); *consequence* = a claim about unplayed
continuations (needs bounded enumeration, engine, or tablebase, each with its grounding);
*valence* = never emitted by any collector — valence attaches only through D571's authority chain
(authored rule, disclosed convention, tablebase, or validated semantic event), and every new
projection declares `valence: none` exactly as the F2 families do. **Fixture demands** follow the
repo's D444/D451/D522 discipline: positives; **hard negatives** (the geometry-without-consequence
cases that must NOT fire); abstention fixtures where the producer can abstain; and a
**non-vacuity check** — the fixture predicate must be falsifiable against the committed corpus
(a criterion satisfied by the state it was written to describe is refused,
`GRADUATION_CLEARANCE_VACUOUS` generalized), and every acceptance criterion must be able to fail
(D451). **Measurement plan** = per-kind lift over played vs legal alternatives (R11 §5 definition,
the d542 instrument), reported **with sign** on both the authored spine and the sealed external
population (`r2-imported-sample@a10a233e…`, `evidence-catalog.ts:363`) so the generous-population
caveat is bounded; for each collector the *negative reading* question is answered explicitly.
**Cost classes**: free = arithmetic over primitives already imported (`attacks`, `between`,
`pawnAttacks`, FEN fields); cheap = free + one-ply enumeration or a small table; engine; corpus.

### 3.0 SEE — the prerequisite (cost: free arithmetic; not itself a learner fact)

- **Semantics.** Static exchange evaluation at a target square under a **declared value
  convention** (`see-convention@1`: P=1, N=3, B=3, R=5, Q=9, K=non-exchangeable — pin the exact
  numbers in the RFC per the pin-encoding rule), standard swap algorithm with X-ray reveals
  through the capture line. **Grounding `declared_convention`, exactness `convention`** — piece
  values are a convention, not chess truth. Declared limitation: pinned attackers/defenders are
  *not* excluded (document it; the exact-pin state collector of §3.3 exists to let a later
  version condition on it). Role in the tree: a **predicate-role projection** (like
  `rules.structural.predicate.*`), consumed as an eligibility input by §3.1/3.2/3.9/3.13 and by
  the bot lane's blunder gate — never rendered as a sentence on its own.
- **Operands retained:** target square, occupant `{color, role}`, ordered attacker and defender
  lists (square + role each, including X-ray members and their reveal order), convention id,
  resulting value in convention units (never call it centipawns).
- **Fixtures.** Positives: simple winning capture (undefended piece); attacker-ordering case
  (pawn takes first). Hard negatives: pawn-defended target attacked by a rook (the freechess
  carve-out); X-ray-backed defense where the naive attacker/defender count gets the sign wrong.
  Non-vacuity: the set MUST contain at least one position where geometric attack-count and SEE
  **disagree in sign** — that disagreement is the entire reason SEE exists (the 0.72× fork
  population). Abstention: none (total on occupied squares).
- **Measurement.** Not a firing detector; measured through its downstream gates — re-run the
  fork and hanging lifts with the SEE gate on, predeclared direction, interval must exclude 1.0
  and the criterion must be able to fail (D451).
- **Shared registry:** learner eligibility for every tactical kind AND the D669 selector's
  per-candidate material-safety feature — the strongest single shared-registry item
  (`human-like-opponents.md` §6c).

### 3.1 Hanging / under-defended / loose pieces

- **Semantics.** *State*, per occupied square: attacker list, defender list, SEE-if-captured for
  the cheapest capturer, side to move. Three exact predicates over it: **en prise** (cheapest
  capture has SEE > 0 for the capturer), **loose/LPDO** (no defenders at all, regardless of
  current attack), **under-defended** (attacked, and SEE > 0 — subsumes count-vs-value ordering).
  *Transition* via the standard F2 structural-event mechanism (family joined on the occupant
  identity; signs gained/lost/preserved): "the played move left/exposed/resolved a loose piece."
  No valence: "White's knight on e5 can be captured winning material under see-convention@1" is
  the ceiling of what may be said.
- **Operands:** square, occupant, cheapest winning capturer (square, role), SEE gain, whose turn;
  transition adds before/after observation identities; the avoidance form adds the complete
  denominators (`legalAlternatives`, `alternativesWithFamily`) exactly as
  `CounterfactualAbsenceOperands` already does.
- **Fixtures.** Positives: classic loose piece; attacked-twice-defended-once with value ordering
  making recapture losing. Hard negatives: attacked piece defended by a pawn; "hanging" piece
  whose capture loses to a zwischenzug is OUT OF SCOPE and must be documented as a limitation
  (SEE is local), not fixed by search. Non-vacuity: static prevalence measured 4.20% *(d542)* —
  the corpus census must show strictly between 0% and 100%.
- **Measurement + sign.** Pre-SEE the probe measured **0.26× played / 15.7% of alternatives** —
  **the negative reading is the useful one** and must be declared at registration: the primary
  learner-facing form is the avoidance event ("15.7% of your legal moves would have left a piece
  loose; yours did not"), which the `derived.semantic_avoidance` machinery already produces the
  moment the structural family exists — **zero new avoidance code**. Post-SEE, both signs re-measured.
- **Cost:** free (attack maps exist) + SEE. **Consumers:** learner (postcommit_nudge,
  blunder_prevention, review_map) and bot (candidate safety feature; a low-band persona that
  sometimes fails this test *by declared policy* is D671's honest twist persona).

### 3.2 Fork / double attack, materially meaningful

- **Semantics.** *Transition event*, mover-anchored: after the move, the moved piece attacks ≥ 2
  enemy targets, each of which is either (a) SEE-positive to capture, or (b) the king (check —
  unanswerable by defense of the target). That is the **state of double attack**; the stronger
  claim "wins material" is a separate *consequence* projection requiring the one-ply defensibility
  enumeration (over all legal replies, does any single reply make every target SEE-non-positive or
  parry the check?) — still rules arithmetic under the SEE convention, exactness `convention`,
  but strictly a second projection with `derivation.inputs` naming the state event. Never conflate
  them; never emit "fork" on geometry alone (hard rule from D545).
- **Operands:** mover (square before/after, role), target list (square, occupant, per-target SEE),
  and for the consequence projection the refutation move if one exists (retention of the
  *defusing* move is what makes the negative fixture checkable).
- **Fixtures.** Positive: knight fork king+rook. Hard negative: geometric "fork" of two defended
  pawns (the 0.72× population — MUST NOT fire). Consequence-projection hard negative: double
  attack parryable by one defending move (state fires, consequence abstains/does not fire).
  Non-vacuity: the fixture corpus must include geometric-only forks.
- **Measurement + sign.** Post-SEE lift is **unmeasured — measuring it is an acceptance
  criterion, with the predeclared expectation that the SEE gate moves it above 1.0**; if it stays
  below, the honest shipped reading is the opponent-relative one (`fork_allowed` /
  avoided-allowing), and that outcome must be recorded, not rationalized (law 6).
- **Cost:** free + SEE; consequence adds one-ply enumeration (cheap — the
  `legalAlternativeEdges` enumerator already exists, `semantic-evidence.ts:257`). **Consumers:**
  learner (review_map, guided_hint grounds) and bot ("it missed your fork because…" — the D669
  explainable-miss differentiator; salience join in §3.13).

### 3.3 Pins, skewers, X-rays (ray classifications)

- **Semantics.** *State* family over slider rays with exactly one blocker (the ray enumeration
  already exists twice: `rayDetails`, `transition.ts:248`, and the line_blockers walk): **absolute
  pin** (blocker is friendly-to-target-king; target = king — exact from rules, and chessops move
  legality already enforces it, so the classification is pure geometry + rules), **relative pin**
  (target more valuable than blocker under the SEE convention), **skewer** (front piece more
  valuable than back), **X-ray attack/defense** (attack through one intervening piece, either
  color). *Transitions* fall out of the state via the F2 before/after join (created / released /
  preserved) — do not build a separate delta detector. Read as **state, not event**: the measured
  lesson *(d542 §7d)* is 5.60% static prevalence vs 1.28× as a delta.
- **Operands:** slider (square, role, color), blocker (square, occupant), target (square,
  occupant), full ray squares, classification kind, SEE values where the kind is value-conditioned.
- **Fixtures.** Positives: absolute pin; skewer with the value order reversed relative to the pin
  fixture (same geometry, different classification — this pair is the non-vacuity core). Hard
  negatives: two blockers on the ray (X-ray at most, not pin); "pin" against an equal-value
  defended piece (relative pin must not fire without the SEE condition). The d542 probe's own
  recorded bug (lifting the slider instead of the blocker → 0.00% everywhere) becomes a
  regression fixture.
- **Measurement:** static prevalence per kind; lift reported both as state-presence and
  created-delta; expect state to dominate.
- **Cost:** free (+SEE for the relative kinds). **Consumers:** learner (sight_on_request: "why
  can't this knight move" is the absolute-pin state; theory_breadcrumb) and bot (pinned-piece
  candidates as salience features; SEE-with-pins upgrade path).

### 3.4 Trapped piece

- **Semantics.** *State*, per non-pawn piece, under a **declared convention** (`trapped@1`): the
  piece is attacked with SEE > 0 on its current square, and has **no destination** with SEE ≥ 0.
  Both halves must hold — mobility-zero alone is not trapped (an undeveloped a1-rook is not
  trapped). This is deliberately weaker than "is lost": that would be a consequence claim needing
  search, refused at this tier. Atoms: `safeDestinations` (`transition.ts:191`) computes the
  geometric half today and is upgraded by the SEE filter.
- **Operands:** piece, square, attacker set, the (empty or SEE-negative) destination census with
  per-destination SEE.
- **Fixtures.** Positive: bishop trapped on a7 by b6. Hard negatives: zero-mobility piece that is
  not attacked (must not fire); attacked piece with one SEE-neutral escape (must not fire).
  Non-vacuity: corpus prevalence strictly interior.
- **Measurement:** unmeasured — new probe rides the d542 harness pattern; expect rare and
  state-shaped; report both signs. **Cost:** free + SEE. **Consumers:** learner (review_map
  moment) and bot (persona feature: material-grabbing bots walk into traps by declared policy).

### 3.5 Back-rank condition

- **Semantics.** *State*, declared convention (`back_rank_susceptible@1`): king on its back rank;
  every non-back-rank escape square blocked by own pieces or attacked (the luft test); at least
  one enemy heavy piece with an open or half-open path to that back rank. Susceptibility, not
  mate — mate-in-1 through it is a separate exact rules fact (one-ply, free) emitted as a
  distinct consequence projection if wanted.
- **Operands:** king square, blocked/attacked escape squares (which and why), accessing enemy
  pieces and their files/paths.
- **Fixtures.** Positive: classic no-luft, open-file rook. Hard negatives: luft exists; no heavy
  pieces; back-rank king with a defended entry square only — the convention must state whether a
  *defended* entry square counts (it should: susceptibility is about the escape geometry, and the
  defended-entry hard negative belongs to the mate projection instead). Non-vacuity as always.
- **Measurement:** new probe; the negative/avoidance reading is likely the valuable one ("your
  move made luft; N% of alternatives left the back rank closed") — declare the question, measure
  the sign. **Cost:** free. **Consumers:** learner + bot salience (back-rank blindness is a
  classic band-dependent miss).

### 3.6 Pawn islands, connected pawns, chains

- **Semantics.** *State*, per color: island count (connected components over files containing own
  pawns — doubled pawns on one file are one island, a fixture), connected-pawn pairs (adjacent
  files, mutual or one-way support — state the definition), chains (maximal diagonal support runs)
  with the **base** identified (the attackable member — the operand theory reaches for). Deltas
  via the standard structural-event join on the count magnitude — the machinery at
  `semantic-evidence.ts:192` (magnitude-compared gained/lost/preserved) applies unchanged.
- **Operands:** per-color island count and file-set per island; pair squares; chain squares +
  base square. Denominators: before/after counts.
- **Fixtures.** Positives: 3-island position; chain with base named. Hard negatives: doubled
  pawns single island; all-pawns-one-wing (one island despite open files elsewhere). Non-vacuity:
  static >2-islands prevalence measured 4.67% *(d542)*.
- **Measurement:** `pawn_island_gained` already measured **2.13×** — positive reading viable as an
  event; ship state + event. **Cost:** free. **Consumers:** learner (the vocabulary the shape
  library "keeps reaching for" — and the orphaned `hanging-pawns` shape entry finally gets its
  detector) and bot (solidity personas weight structure preservation, D671).

### 3.7 Castling: rights state, rights-lost transition, legality state

- **Semantics.** Three exact, valence-free items, all pure FEN/rules arithmetic:
  (a) **rights state** per color `{kingside, queenside}` — read the FEN castles field, today
  unread anywhere; (b) **rights-lost transition** — diff of (a) over the edge, with the exact
  cause retained: `king_moved | rook_moved | rook_captured | castled`; (c) **castling-legality
  state** — rights held but castling currently illegal (transit/landing square attacked, blocked,
  in check), exact from the rules. The owner's word "prevented" is served by (b) (permanent) and
  (c) (transient) and by **nothing else** — "prevented" as opponent intent is refused (no
  intention inference).
- **Operands:** color, side(s), cause, and for (c) the specific disqualifying squares.
- **Fixtures.** The D547 regression pair — `e1g1`-form and `e1h1`-form imports must both fire
  *performed* (and the reading-plane unification in §5 is acceptance-tested by the same pair);
  rook captured on h8 removes kingside rights only; a-rook move removes queenside only
  (non-vacuity: the *other* side's right must survive in the fixture); rights-held-but-illegal
  positive for (c) with the attacked transit square named.
- **Measurement:** `castling_right_lost` measured **0.65× as a gained-delta** *(d542)* — the
  state reading is the useful form ("Black can no longer castle" is a position fact), and the
  avoidance form is the honest event rendering. Declare exactly that at registration.
- **Cost:** free (the field is already in every stored FEN). **Consumers:** learner (Review,
  imported-game story) and bot (king-safety persona feature).

### 3.8 Development

- **Semantics.** *State*: per-color list of undeveloped minors **with squares retained**
  (upgrading the count-only `undevelopedMinors`; the phase classifier keeps consuming the count —
  no duplicate computation, one producer with a richer projection). *Transition event*:
  `developed` — the moved minor stood on its home square before and leaves it this move; the
  reverse (`development lost` — returning home) is the lost sign of the same family; a minor
  *captured* on its home square is neither (hard negative). Convention: minors + castling only
  (`development@1`), matching `phase.ts`'s existing basis; rook-connection etc. deferred.
- **Fixtures.** Ng1–f3 positive; Nf3–g1 lost-sign; capture-on-home-square hard negative;
  non-vacuity over the corpus (openings fire, endgames do not).
- **Measurement:** unmeasured as an event; free probe. **Cost:** free — already computed per
  phase call. **Consumers:** learner ("develops a piece" — the owner's own item) and bot
  (opening-persona candidate weighting).

### 3.9 Captures and meaningful trades

- **Semantics.** (a) A generic **`capture` rule event** retaining the captured identity —
  `{mover, from, to, captured: {color, role}, enPassant}` — fixing the identity loss at
  `transition.ts:311` (today only `last_of_role` keeps identity; `capturedRole` already computes
  it including en passant, `transition.ts:326-337` — this is pure retention, zero new chess
  code). (b) A **SEE classification of the capture** under the convention: winning / losing /
  balanced — convention-grounded state of the capture, never the words good/bad. (c) A
  **trade-completed** *derived* projection: capture followed by recapture on the same square
  within the recorded continuation — a join over `run.record.move`, `derivation.inputs` declared;
  an adapter over existing records, **not** a new detector.
- **Fixtures.** En-passant identity positive (the `capturedRole` ep branch is currently
  exercised nowhere learner-visible); promotion-capture; non-capture hard negative; for (c) a
  capture with no recapture (must not fire trade).
- **Measurement:** capture itself is near-unconditional on capture moves (no lift claim); the
  informative measurements are (b)'s class distribution and (c)'s corpus rate. **Cost:** free
  (+SEE for (b)). **Consumers:** learner ("meaningful trades", queens-off — `queensOff` already
  exists at `transition.ts:354`) and bot (material-grabber persona; trade-avoidance styles).

### 3.10 Space under a declared convention

- **Semantics.** *State*, `space@1` convention to be pinned in the RFC: three declared zones
  (central/kingside/queenside file ranges), a control test (the d542 probe used
  own-pawn-controlled squares in the enemy half — adopt or amend, but **declare**), a per-zone
  per-color count and the differential. Emitted as a count-carrying structural kind so the
  existing magnitude-delta event machinery yields gained/lost/preserved for free. Precedent for a
  claude-declared convention exists (`outpost`, `backward_pawn` carry `declared_convention`
  grounding today), but the zone/test choice is owner-visible — logged as an owner question (§8).
- **Fixtures.** Positive per zone; a hard negative where a pawn *advance* loses space under the
  declared test (advances can concede control squares — the fixture that keeps the convention
  honest); mirror fixtures (the mirror machinery in `structure.ts` must extend to the new kind).
- **Measurement:** 1.09× as a gain-delta *(d542)* — weak as an event; register as a **level
  reading** with the delta demoted, exactly the §7d lesson. **Cost:** free. **Consumers:**
  learner (the owner's named vocabulary) and bot (space-grabbing persona metric; D552 style
  mapping).

### 3.11 Opening identity at runtime, transposition-aware

- **Semantics.** *Theory-plane lookup state*: position-keyed (EPD via the existing `transposeKey`)
  join against the already-fetched `lichess-org/chess-openings` table; deepest match wins;
  **honest absence** (`no_catalogue_match` abstention is already declared on the sourcing
  projection — the runtime projection declares the same). This is a **new runtime
  producer/adapter**, not an admission of the refused record kind: the
  `RECORDED_READING_DISPOSITIONS` refusal ("position naming, not a recorded measurement") stays
  exactly as is. Serves D694's R8/F7 demand and D552's per-opening feedback.
- **Operands:** ECO, name, matched depth/ply, match basis (`transposition` vs `move-order`),
  table version/source id.
- **Fixtures.** Transposition positive (same position via two move orders must name the same
  opening); out-of-book abstention (must abstain, never fall back to the last match — the
  non-vacuity core); deepest-match precedence.
- **Measurement:** coverage rate over the imported-game population (share of games with an
  identity at ply N), not lift — it is a lookup, not a detector. **Cost:** cheap (table of 3,627
  rows already fetched and stored). **Consumers:** learner (Review header, theory links, opening
  drills) and bot (repertoire/book priors — Chessiverse's documented layer, D551/D591).

### 3.12 Promotion-square pressure

- **Semantics.** *Derived state* per passed pawn (the `passed_pawn` predicate exists): distance
  to promotion; promotion-square control balance (`direct_attack_count` both colors at the
  queening square — existing predicate); path blockers (`line_blockers` pawn→promotion square —
  existing); king-race rule-of-the-square (exact arithmetic, kings-and-pawns only, declared
  scope). A **derived producer with `derivation.inputs` naming the existing projections** — the
  no-duplicate-collector rule applied: this collector computes nothing new, it joins.
  Syzygy already owns the exact outcome ≤ 7 men; this projection must declare that it is
  *pressure description*, and defer outcome words to the tablebase projection.
- **Fixtures.** Lucena-adjacent positives (the endgame catalogue has the positions); blockaded
  passer hard negative (pressure operands show the blocker); rule-of-the-square boundary fixture
  (king exactly in/out of the square — D451-style able-to-fail pair).
- **Cost:** free. **Consumers:** learner (endgame modules) and bot (passer-pushing personas;
  endgame-strength personas per D670's engine-floor note).

### 3.13 Threats and bounded tactical consequences

- **Semantics.** *Consequence*, under a **declared null-move convention** (`threat@1`): "if the
  side to move passed, the opponent has a move that (a) wins material by SEE, or (b) mates in 1
  (exact)." One-ply enumeration + SEE; null-move is a convention and says so in the provenance.
  Additionally the **recency/salience join** the bot literature demands (D670,
  `human-like-opponents.md` §6a): was this threat created by the opponent's last move; did the
  threatening piece itself just move — a join of the threat stream against `run.record.move`,
  pure arithmetic, and **the operand that makes the explainable-miss differentiator possible**.
  Law 8: naming a threat that exists is arithmetic; it grades nobody.
- **Operands:** threatening piece, target, SEE gain or mate flag, the threatened move itself,
  `createdByLastMove: boolean`, `attackerJustMoved: boolean`.
- **Fixtures.** Positive (mate threat; material threat); hard negative: a "threat" whose
  execution loses by SEE (must not fire); a pre-existing threat after an unrelated move
  (`createdByLastMove` must be false — the salience join's own fixture); non-vacuity.
- **Measurement:** new probe; the D674 salience-hierarchy experiment (folklore → measured) is the
  designated instrument; report threat-presence lift both signs. **Cost:** cheap (one-ply + SEE).
  **Consumers:** learner (`blunder_prevention` — the owner-ruled R3 module that currently has no
  producer; postcommit consequence naming) and bot (the salience feature family — the core of
  structured human-like error).

### 3.14 Latent configuration→consequence (D553)

- **Semantics.** *State*: **discovered-attack latency** — own piece P screens a friendly slider S
  from an enemy target T on a one-blocker ray, so moving P creates a discovered attack (or
  discovered check when T = king). This is `vacationReading` (`structure.ts:517`, exported and
  dead) filtered to enemy-occupied gains with an SEE/king condition — resurrection plus a filter,
  not new detection. The **executed** discovered attack is already derivable today as an adapter
  over registered `slider_ray:gained` events where the subject blocker was the mover — **adapter,
  not collector**. The D553 pattern (fianchetto + screening knight) then = an authored shape
  trigger (static arrangement — the shape library already expresses it) **joined by eligibility**
  to this latency state; the join is authoring/eligibility work in F5's vocabulary, not a third
  producer.
- **Operands:** screen piece, slider, target, ray squares, discovered-check flag, per-target SEE.
- **Fixtures.** Positive: fianchetto battery with screening knight, enemy piece on the long
  diagonal; discovered-check positive; hard negatives: two blockers; blocker is an enemy piece
  (that is *their* discovered attack, sign/ownership fixture); non-vacuity.
- **Measurement:** new probe; expect state-shaped; the bot-side reading (candidate moves of P
  carry the latent consequence) is the salience feature "discovered geometry" — D670 marks the
  specific hierarchy folklore, so it enters as a measured candidate, not an assumed truth.
- **Cost:** free. **Consumers:** learner (the owner's named case; style/habit indexing D553) and
  bot (candidate featuring; personas that "see" or "miss" discovered geometry by declared policy).

### 3.15 Maia per-candidate WDL (repair, not a new collector)

- **State:** lossy — parsed and transported (§2 row 16) but not projected. **Fix:** add the WDL
  operand to `human.maia.policy`'s declaration (or a sibling projection) so the byte that already
  crosses REST is contract-visible; renderer admission is F5's decision;
  `maia-wdl-versus-human-outcome.md` governs whether it may face learners. Fixture: a captured
  UCI line with `wdl` must round-trip to the projection; a line without it must yield declared
  absence. No new chess computation.

---

## 4. The shared-registry test (D551/D669)

D669's architectural claim — the bot consumes DECLARED evidence so its miss is explainable — and
`human-like-opponents.md` §6's synthesis (the missing thing is a **candidate-evidence producer
class**, i.e. the same declared vocabulary applied per candidate move) give the test: *a collector
passes if the identical projection serves a learner module and the selector's candidate featuring,
with only the anchor differing (played edge vs candidate edge).* The candidate-application
adapter itself is phase-6 work; nothing below needs a second implementation for the bot.

| Collector | Learner module(s) it feeds | Bot consumption | Both? |
|---|---|---|---|
| SEE (3.0) | eligibility input for every tactical fact | blunder gate; candidate material safety | **YES — strongest** |
| Hanging/loose (3.1) | postcommit_nudge, blunder_prevention, review_map, avoidance form | candidate safety feature; twist personas | **YES** |
| Fork (3.2) | review_map, guided_hint grounds | the explainable-miss case verbatim | **YES** |
| Pins/skewers/X-ray (3.3) | sight_on_request, theory_breadcrumb | pinned-candidate salience | **YES** |
| Threats + salience join (3.13) | blunder_prevention (currently producer-less) | the structured-error core (D670) | **YES** |
| Discovered latency (3.14) | D553 habit indexing, theory join | discovered-geometry salience candidate | **YES** |
| Castling rights (3.7) | Review facts, imported-game story | king-safety persona feature | **YES** |
| Islands/chains (3.6) | structure vocabulary, shape join | solidity persona weights | **YES** |
| Development (3.8) | "develops a piece", opening feedback (D552) | opening persona | **YES** |
| Space (3.10) | owner vocabulary, style mapping | space-grabbing persona metric | **YES** |
| Rook on 7th (3.5→§3 table) | review_map moment | style weight | yes (weaker) |
| Trapped/back-rank (3.4/3.5) | review moments, susceptibility facts | trap/back-rank salience | yes |
| Trades (3.9) | "meaningful trades", queens-off | material-grabber persona | **YES** |
| Opening identity (3.11) | Review header, theory drills, D552 | book/repertoire prior (D551 layer) | **YES** |
| Promotion pressure (3.12) | endgame modules | passer persona | yes |
| Maia WDL (3.15) | inspector (if admitted) | candidate outcome prior | yes |

Every proposed collector passes; none requires forking the registry — which is the D551/D669
requirement, honored by construction because each is specified as one producer with
learner-consumer and (future) `opponent.selection`-consumer adapters.

---

## 5. Ranked build order (unblocks-most × cheapest)

1. **SEE** (3.0) — free; hard prerequisite of 3.1, 3.2, relative 3.3, 3.4, 3.9b, 3.13, and the
   bot blunder gate. Nothing tactical is honest without it (D545/D673). Build first.
2. **Castling rights + reading-plane castling unification** (3.7 + the D547 residue: route
   `irreversibility`/`pgn-import` through `canonicalMoveUci` or the `>= 2` test) — trivial,
   exact, repairs a shipped defect and adds the cheapest new exact family in one commit's scope.
3. **Capture identity retention** (3.9a) — pure retention of an already-computed value; unlocks
   trade vocabulary and honest capture facts everywhere.
4. **Hanging/loose** (3.1) — SEE's first consumer; the top competitor-class motif; the avoidance
   machinery gives its best form for free.
5. **Pins/skewers/X-ray** (3.3) — ray enumeration exists twice already; state-read.
6. **Threats + salience join** (3.13) — gives the producer-less owner-ruled module
   (`blunder_prevention`) its producer AND opens the bot lane's core feature family.
7. **Fork** (3.2) — after SEE, with the post-SEE lift measurement as its acceptance gate.
8. **Pawn islands/connected/chains** (3.6) — measured 2.13×, free, shape-library demand.
9. **Development events** (3.8) — free, owner-named, already half-computed.
10. **Rook on the 7th** — measured 3.83×, one rank test plus the meaningfulness operands.
11. **Space convention** (3.10) — free but carries the owner-visible convention declaration.
12. **Discovered latency** (3.14) — resurrect `vacationReading` + filter; D553.
13. **Trapped piece / back-rank** (3.4/3.5) — conventions to declare, probes to run.
14. **Promotion-square pressure** (3.12) — pure join over existing projections.
15. **Opening identity runtime** (3.11) — cheap but a separate lane (R8/F7 owns the Review
    surface decision); build when that lane opens, not before.
16. **Maia WDL projection repair** (3.15) — small, rides any catalog-touching commit.

**Specified-and-ready set (semantics + fixtures complete above; RFC can quote them):**
SEE, castling rights/legality, capture identity + SEE-classified capture, hanging/loose,
pins/skewers/X-ray, pawn islands/chains, development, rook-on-7th, promotion pressure,
Maia-WDL repair. **Specified with a declared-convention or measurement gate still inside the
RFC's own acceptance:** fork (post-SEE lift must be measured, direction predeclared), space
(zone/test convention — owner-visible), trapped + back-rank (convention text), threats
(null-move convention text), discovered latency (probe first). **Deliberately out of this RFC:**
the per-candidate application adapter (phase 6, D669 lane), time-usage modelling (expensive,
deferred per `human-like-opponents.md` §6d), plan labels (D530 citation grounding — owner ruling,
not a collector).

---

## 6. Pack and schema impact (report only — nothing touched)

- **New structural kinds** extend the closed `STRUCTURAL_FEATURE_KINDS` const
  (`packages/schema/src/drill-pack/types.ts:372-375`) and every exhaustiveness switch over it
  (`structure.ts` matcher/mirror, `structural-sentences.ts`, `expression-satisfiability.ts`,
  `pack-validation.ts`, lint). This is a **schema change but strictly additive**: all 50 authored
  drafts remain valid and **no pack needs re-authoring**. `content/witnesses/expression-witnesses.json`
  needs witness entries for each new kind (that is the fixture demand of §3, not content work).
- **New transition-rule/geometry event families** are additive projection ids in
  `evidence-catalog.ts` (new `@1` identities — no version bumps, per the versioned-id design).
  The R2 selection policy's `criticalEvents` set (`:409`) changes only if a new family is
  promoted to critical — the RFC must decide explicitly (default: none of the new ones are), and
  the sealed R2 fixtures re-run either way.
- **Conventions** (`see-convention@1`, `space@1`, `trapped@1`, `back_rank_susceptible@1`,
  `threat@1`, `development@1`) are pinned by exact text/values in the RFC — pin the encoding,
  not the intent.
- **One genuine migration hazard, inherited not created:** any repair of `pawn_safe_square`
  semantics (D566) changes the truth set of `outpost`, which authored content now references 77
  times — that is D632's F3/Gate-F migration and must not ride this RFC.
- **No redefinition of any shipped kind** is proposed here; if a later pass redefines one (e.g.
  SEE-conditioning an existing detector), that is a `@2` identity, not an edit.

---

## 7. Non-collector residues found (named for the record, not fixed here)

1. `irreversibility` reading-plane castling `=== 2` + `pgn-import.ts:54` raw `makeUci` — imported
   games still miss the "White castled." reading/marker (rides build item 2).
2. `structural-sentences.ts:27` `pawn_count` sentence — dead code behind the F1 retirement.
3. `vacationReading` and `structuralDelta` remain exported-dead (`index.ts:103,106`);
   `structuralDelta` is also the candidate-salience atom the bot lane will want — resurrection
   belongs to items 12 and phase 6 respectively, not to deletion.
4. `SelectionCandidate.wdl` transported but unprojected (§3.15).
5. The `hanging-pawns` shape entry is named by no pack — its detector (3.6) removes the excuse.

---

## 8. Owner questions (for the plan.md accumulator — nothing silently chosen)

1. **Space convention** (3.10): which zone boundaries and which control test become `space@1`?
   Precedent allows a claude-declared convention (outpost), but this one is owner vocabulary.
2. **Negative-reading admission**: the avoidance form is registered research-only; whether "what
   you avoided; N% of alternatives would not have" may face learners — and in which modules — is
   the design/05 sign-rule ruling the d542 dossier already requested and D571 sharpened.
3. **"Castling prevented"**: confirm the two exact forms (rights-lost with cause; legality state)
   fully discharge the brief's word, with the intent reading refused.
4. **Fork failure branch**: if the post-SEE fork lift still reads below 1.0, the shipped form
   becomes opponent-relative (`fork_allowed`/avoidance) — pre-authorize or re-rule.
5. **Principle citations** (D530/B4): the theory-evidence collector row (§2 #19) stays "registered
   with residue" until the citation grounding ruling lands; no collector work can close it.

---

## 9. Proposed ledger rows (from D730 — proposed here, to be written to `design/BACKLOG.md` by the landing pass, not by this audit)

- **D730** — SEE as a declared-convention predicate producer (`see-convention@1`); the tactical
  family's prerequisite; spec §3.0. Implements the collector D673 found absent.
- **D731** — Castling family: rights state, rights-lost transition with cause, legality state;
  plus reading-plane castling unification retiring D547's residue. Spec §3.7.
- **D732** — Generic `capture` event retaining captured identity (+ en passant), SEE-classified
  captures, and the derived trade-completed join. Spec §3.9.
- **D733** — Hanging/loose/under-defended state + event + avoidance form as the primary reading.
  Spec §3.1.
- **D734** — Ray classification family: absolute/relative pin, skewer, X-ray, as states. Spec §3.3.
- **D735** — Pawn connectivity family: islands, connected pawns, chains with base. Spec §3.6.
- **D736** — Rook-on-seventh state with meaningfulness operands (enemy king/pawn facts retained,
  eligibility decides). §3 table row 6.
- **D737** — Development: square-retaining undeveloped state + developed/lost transition events;
  renders what `undevelopedMinors` already computes. Spec §3.8.
- **D738** — Space level reading under `space@1` (owner question 1 gates the convention text).
  Spec §3.10.
- **D739** — Trapped-piece and back-rank susceptibility states under declared conventions.
  Specs §3.4/§3.5.
- **D740** — Discovered-attack latency state (resurrected `vacationReading` + SEE/king filter);
  executed-discovered as an adapter over `slider_ray`; the D553 shape join as eligibility work.
  Spec §3.14.
- **D741** — Threats under `threat@1` (null-move + SEE + mate-in-1) with the recency/salience
  join operands; gives `blunder_prevention` its producer. Spec §3.13.
- **D742** — Promotion-square pressure as a derived join over existing projections. Spec §3.12.
- **D743** — Runtime transposition-keyed opening identity with honest absence (R8/F7 lane;
  discharges D694's demand when that lane opens). Spec §3.11.
- **D744** — Maia per-candidate WDL projection repair (lossy → declared). Spec §3.15.

---

## 10. Limits

1. All lifts quoted are the d542 pass's, measured at `424374f` on the authored spine (the
   generous population) — ceilings, not floors; the sealed external population re-measurement is
   built into every spec's acceptance rather than assumed.
2. The D686/D694 verifications read the committed harness outputs; the harnesses were not re-run
   this pass (their inputs — corpus and catalog identities — are unchanged at HEAD for the claims
   relied on).
3. chessops' acceptance of both castling UCI forms through `isPlayedEdge` is inferred from the
   corpus evidence (20 `e1g1`-form firings) plus `canonicalMoveUci`'s normalization path; the §3.7
   fixture pair exists to make it a tested fact rather than an inference.
4. No new probe was run; where a spec says "unmeasured — new probe", the measurement is part of
   the RFC's acceptance, with directions predeclared so the criteria can fail (D451).
