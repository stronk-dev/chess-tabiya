# RFC: Move-quality grades — the grade-family projection and its convention document

- **Status:** draft
- **Author:** claude, on the [[D879]] BUILD-IT verdict and the [[D899]] routing (learner-modules `## Discharges` D3)
- **Created:** 2026-08-22
- **Design refs:** `design/05-in-run-experience.md` §3 (grounding ladder, §3-forms honesty split), `design/research/assistance-surface-taxonomy.md` §2b (pinned Lichess constants), §2d-1 (two-ladder precedent), §4a (the explicit verdict); `design/research/classifier-coverage-and-noise.md` §4a layer 2 (as quoted by both)
- **Exploration gate:** opened by the 2026-08-12 owner ruling (logged in `planning/exploration/log.md`); this specific RFC commissioned by [[D879]] ("BUILD IT") via `rfc/learner-modules.md` §5 / Discharges D3
- **Depends on:** `learner-modules.md` (accepted — §5 rules grades a projection and names the only two consumers; its Appendix B carries the two ◇ declared-awaiting rows this RFC compiles); `rfc/archive/evidence-contract-manifest.md` (F1 §4.3 derived-projection vocabulary and compiler)
- **Parent / amends:** — (a new derived producer; amends no implemented behavior)
- **Supersedes / superseded by:** —
- **Planning:** `planning/evidence-foundation-ux/` (once implementing)

```tabiya-claims
none
```

*Verified against all six registers at drafting: no pack/run/shape-entry/principle-entry schema
change, no `EVIDENCE_KINDS` member (that enum is the sourcing-artifact vocabulary in
`apps/server/src/sourcing/types.ts`; this RFC touches runtime evidence only), and **no
migration — a grade is never persisted** (§7.9). Evidence-catalogue projection ids are
catalogue-local, not a register (`tactical-collectors`, `learner-modules` precedent: "claims
nothing versioned").*

## Summary

One derived projection, **`derived.grade.move_quality@1`**, over the two shipped eval
projections (`recorded.engine.eval@1`, `live.stockfish.eval@1`), plus one versioned
convention document, **`grade-convention@1`**, compiled as a literal cited-constant table.
The delta basis is **win-percentage drop** on Lichess's published logistic (pinned from
source in the taxonomy), not raw centipawns. Mate scores get a **typed arm**
(`mate_lost` / `mate_allowed`; `mate_delayed` is never graded) — never the ±1000 cp
coercion `story.ts` ships ([[D917]]). Two ladders serve three contexts (drill gets the
4×-stricter practice ladder; review and imported analysis share the report ladder), both
versioned in one document. The word, the numbers, the threshold crossed and the convention
version are **co-rendered, always** — printing only the word launders a convention as a
fact. Praise classes are refused; rating is not an operand (R15); the projection cannot
carry a best move because the F1 derivation compiler forbids it (§5.3). Consumed by
`postcommit_nudge` and `review_map` only, at their timings — the two declared-awaiting ◇
rows in the module registry compile when this lands (learner-modules Discharges D3).

## Motivation

Move classification is the most universal surface in chess software and it is verified
absent at HEAD: no production symbol computes a blunder/mistake/inaccuracy label; the words
occur only in `BANNED_JUDGEMENTS` (`packages/runtime/src/voice.ts:93-97`), an
LLM-vocabulary ban, not an evidence adjudication (`assistance-surface-taxonomy.md` §4a
`[V]`). [[D879]] ruled: build it, as one derived projection plus a versioned per-context
convention, post-commit/review only, co-rendered, never rating-conditioned, praise-classes
refused. `learner-modules.md` §5 ruled the *shape* — a projection, not a module — and left
exactly two things to this RFC (its open question 3): the delta basis and the convention
document. This RFC decides both and specifies the mate arm the shipped tree gets wrong.

**Out of scope, deliberately:** accuracy%/game-level aggregates and the eval graph
([[D880]], and [[D928]]'s family-local whole-game selector owns cross-source Review
selection); the mate-in-N availability/"Miss" collector (taxonomy §4b-3 — the
avoided-positive twin, a separate producer); any consumer registration (learner-modules
owns the registry); any preset/activation surface (Phase 5); fixing [[D927]]/[[D917]]
(upstream — §8); persistence of grades anywhere (§7.9).

## Specification

### §1 — The delta basis: win-percentage drop, not raw centipawns

**Decision: the graded quantity is the drop in win percentage, learner's point of view,
computed by Lichess's published logistic over centipawns.** Pinned `[V]` from source in
`assistance-surface-taxonomy.md` §2b (scalachess `core/src/main/scala/eval.scala`,
master, fetched 2026-08-22):

```
Win% = 50 + 50 × (2 / (1 + e^(−0.00368208 · cp)) − 1)
     = 100 / (1 + e^(−0.00368208 · cp))          — the same curve, simplified
cp clamped to [−1000, +1000] before conversion
drop = Win%(before) − Win%(after)                — learner POV, unrounded floats
```

Lichess's judgment thresholds operate on this drop (Advice.scala's winning-chances
deltas on the [−1,+1] scale; 0.10 there = 10 win-percentage points here — the taxonomy's
own gloss, and the practice ladder's 0.025/0.06/0.14 = 2.5/6/14 points under the same
mapping, which is what makes "4× stricter" arithmetic rather than vibes).

**Why not raw centipawn deltas — the arithmetic:**

| move | cp before → after | cp lost | Win% before → after | drop | honest reading |
|---|---|---|---|---|---|
| A | +500 → +300 | 200 | 86.31 → 75.11 | **11.20** | still winning; an inaccuracy |
| B | +100 → −100 | 200 | 59.10 → 40.90 | **18.21** | the game changed hands |
| C | +800 → +200 | 600 | 95.01 → 67.62 | **27.39** | large, yet still clearly better |
| D | 0 → −300 | 300 | 50.00 → 24.94 | **25.06** | equal → probably lost |

A and B lose the identical 200 cp and are not the same mistake; C loses three times A's
centipawns and is not three times the error. The logistic says what the raw scale cannot:
eval is winning-chance-saturating, and +5→+3 is not +1→−1. The historical 300/200/100 cp
rule is gone from Lichess's own code path (taxonomy §2b `[V]`); adopting the dead
convention would fail the citation test its own author abandoned.

**Why not chess.com's expected-points bands:** the bands are published but the underlying
expected-points model is rating-conditioned and unpublished — unpinnable under the D368
discipline (§4), and rating-conditioning is the R15 refusal verbatim. **Why not
Stockfish's own WDL:** the stored WDL operand has no stable perspective at HEAD
([[D927]] — §8), and the WDL model is engine-version-conditioned where the Lichess
logistic is one fixed published constant. Revisit as `@2` material once D927's
normalization lands; it is not available honestly today.

The clamp is part of the tradition and is honest: beyond ±1000 cp the curve reads ≥97.5%,
and differences of saturated evals are not differences in winning chances. +2500 → +1200
clamps to +1000 → +1000: drop 0, no grade (fixture F-CLAMP).

### §2 — Pairing, perspective, and abstention

**Pairing.** The grade for the learner's committed move `m` from node A (learner to move)
to node B (opponent to move) pairs `eval(A)` with `eval(B)` — the position's best-play
estimate before the move against the estimate after it. This is deliberately **not**
`derived.compare.eval_delta@1` (which pairs across branch trails at `plyOffset` — a
different composition; reusing it would smuggle cross-branch semantics into a
within-trail fact).

**Both evals must come from one instrument.** Same lane (both `recorded.engine.eval@1`
or both `live.stockfish.eval@1` — never one of each), same `engineId`, and equal search
limit: equal `depth` where both carry it, else equal `requestedMovetimeMs`, else abstain.
A grade is a statement about one engine's reading at one precision; mixing lanes or
depths manufactures a delta no instrument reported.

**Perspective is pinned per lane, explicitly — the D927-family lesson.** The two lanes
disagree at HEAD and the projection must normalize, not assume:

- `recorded.engine.eval@1` payloads carry `EngineReadingValues.perspective: "white"`
  (`packages/runtime/src/voice.ts:12-21`) — White-POV by declaration, converted at the
  source by `whitePerspectiveScore` (`apps/server/src/evidence-queue.ts:81`).
- `live.stockfish.eval@1` payloads are side-to-move POV (UCI convention) — the shipped
  normalization precedent is `story.ts:106-107`, which flips by the node's side to move.

Learner-POV normalization: recorded lane `learnerCp = learnerSide === "white" ? cp : −cp`;
live lane `learnerCp = sideToMove(node) === learnerSide ? cp : −cp`; identically for
`mateIn`. The learner side is an orientation parameter named in `semantics`, not a
derivation input (F1 §4.3's rule, as `derived.story.eval_shift@1` already declares).
Fixture F-PERSPECTIVE proves both lanes converge to the same learner-POV Win% for one
position pair.

**Abstention: an ungradeable move renders nothing, never a default grade.** There is no
"ok"/"good"/default member in the class union — below-threshold is *no emission*, and
un-computable is *abstention*. Declared reasons:

| reason | when |
|---|---|
| `input_abstained` | an input projection abstained (F1-mandated carry) |
| `missing_eval` | either node has no eval in an eligible lane |
| `unequal_instrument` | lane, `engineId`, or search limit differ between the pair |
| `mate_score_inconsistent` | a transition the instrument cannot legally report (§3, last row) |

### §3 — The mate arm: mate is not a centipawn

`story.ts:33/:104` maps every `mateIn` to ±`STORY_MATE_CP` (1000) and clips — which
destroys mate distance, mate appearance, and cp↔mate transitions ([[D917]]). The
corruption is not cosmetic; run fixture F-MATE-LOST through it: *learner has mate-in-2;
plays a move; engine now reads +800 cp.* Coerced, that is 97.55% → 95.01%, drop 2.54 —
**below every review threshold: a missed forced mate grades as nothing.** The coercion
makes exactly the moves a grade family exists for invisible. Lichess itself does not
grade mates through its formula either — Advice.scala keeps a separate mate table — so
a typed arm *is* the tradition, and the ±1000 mapping there serves accuracy%/graphs,
which are [[D880]]'s problem, not this projection's.

**The arm, typed.** With both scores learner-POV (`mate M > 0` = learner mates in M;
`M < 0` = learner is mated):

| transition (before → after) | class | severity |
|---|---|---|
| cp → cp | `eval_delta` | the §4 ladder on the Win% drop |
| mate M>0 → cp | **`mate_lost`** | `max(inaccuracy, ladder(100 − Win%(after)))` — the floor rule, derivation below |
| cp → mate M<0 | **`mate_allowed`** | **blunder** when Win%(before) ≥ 7.06 (= Win%(−700 cp) — the pinned Lichess constant); else `ladder(Win%(before))` |
| mate M>0 → mate N>0, N ≥ M | `mate_delayed` | **never graded — no emission** (pinned: Lichess's MateDelayed is never judged) |
| mate M>0 → mate N>0, N < M | — | no emission (optimal or better) |
| mate M<0 → mate N<0, any N | — | no emission: every move of a position lost by force loses by force; shortening it has no honest severity without a convention nobody has published |
| mate M<0 → cp, or cp → mate M>0 improving | — | no emission (grades are loss classes; §7.2) — and `mate M<0 → cp` is additionally impossible under one instrument's coherent readings: abstain `mate_score_inconsistent` (a depth/horizon disagreement, not a learner improvement) |

**The pinned cells and the declared cells, separated (D879's two options, both used):**
three cells are `chess_tradition`, cited to the taxonomy's source-pinned Advice.scala
constants — *allowed-mate from ≥ −700 pov-cp → Blunder*; *lost-mate while still > +999 →
only Inaccuracy*; *MateDelayed never judged*. Every other cell is **our declaration with
the derivation shown**: the `mate_lost` floor generalizes the pinned +999 cell downward
coherently (at the +1000 clamp the drop is 2.45 and the pinned verdict is still
Inaccuracy, so the floor `max(inaccuracy, ladder(drop))` reproduces the pinned cell
exactly and degrades continuously — at +800 it stays Inaccuracy by floor, at +200 the
drop 32.38 makes it a Blunder by ladder); `mate_allowed` below −700 falls back to the
ladder on Win%(before) < 7.06 — allowing mate in a position already lost by more than
seven win-points is graded by what was actually still on the table, usually nothing.

The mate arm is **context-independent** (one table for all three §4 contexts): mate
classes state forced outcomes, not the loss tolerance a context chooses. Only the
`eval_delta` ladder varies by context; the `ladder(...)` calls inside the mate rows use
the context's ladder, so the floor tightens automatically in drill.

Co-rendering for mate classes shows the mate operands, never a coerced scalar:
*"Inaccuracy — a forced mate (#2) was on the board; after this move the engine reads
+8.00 (95.0%). Mate-lost floor, grade-convention@1/review."*

### §4 — `grade-convention@1`: the versioned per-context convention document

Compiled as one literal constant table (`GRADE_CONVENTION`, `packages/runtime/src/grade.ts`),
frozen, with the **D368 discipline structural**: every constant is a record carrying
`{ value, source, pinnedAt }` — the citation is a field, not prose, so a missing or stale
citation is a lint failure rather than a re-measurement pass ([[D368]]'s exact complaint:
"if a measured claim carried {measuredAt, …} this entire class would be a lint rule").

**Two ladders** (thresholds in Win% points; a drop `≥ t_inaccuracy` grades, below it
nothing is emitted — "good" is the absence of a grade, §7.2):

| ladder | inaccuracy | mistake | blunder | source, pinned 2026-08-22 |
|---|---|---|---|---|
| `report` | ≥ 10 | ≥ 20 | ≥ 30 | Lichess `modules/tree/src/main/Advice.scala` (win-chances drop 0.10/0.20/0.30), via `assistance-surface-taxonomy.md` §2b `[V]` |
| `practice` | ≥ 2.5 | ≥ 6 | ≥ 14 | Lichess `ui/analyse/src/practice/practiceCtrl.ts` (0.025/0.06/0.14), same pin — the 4×-stricter in-drill ladder Lichess itself runs beside its report ladder (taxonomy §2d-1: two declared conventions in one product) |

Plus the two mate constants: `mate_allowed` blunder boundary **−700 cp**
(Win% 7.06) and the `mate_lost` **floor = inaccuracy** (§3; the +999 pinned cell is its
anchor). The cp clamp **±1000** and the logistic coefficient **0.00368208** are
constants of the same table, same citation discipline.

**Three contexts, and which shares what:**

| context | ladder | who consumes | rationale |
|---|---|---|---|
| `drill` | `practice` | `postcommit_nudge`, at its timings (post-commit cap-2, `attempt_end`/disclosed — learner-modules §4.5) | a consequence rehearsal is Lichess's practice-mode situation: the learner asked to be held to precision, and the whole product loop is *rewind and try again* — a 3-win-point slip is exactly what a drill exists to surface |
| `review` | `report` | `review_map` (review timing — learner-modules §4.10) | post-game reading of a finished run is the report situation the 10/20/30 constants were derived for |
| `imported_analysis` | `report` — **shared with `review`**, declared, not duplicated | `review_map` over `sessionKind: "imported"` runs | an imported real game is precisely what Lichess's report ladder reports on; sharing the tradition's constants keeps our verdicts comparable to the Lichess/chess.com reports the owner will hold them against |

The convention is cited as **`chess_tradition` in the convention text, never as a
grounding value** — `EvidenceGrounding` does not contain it and this RFC does not widen
the union (the `tactical-collectors` §2.5 reconciliation, followed exactly).

**Versioning:** any constant, class, or context-mapping change is `grade-convention@2` —
the version bump *is* the ceremony, and the rendered convention version is what makes an
old rendered sentence forever attributable to the rule that produced it. Re-pinning a
derivation input version is a projection `@2` (F1 §4.3).

### §5 — The projection, declared under F1 §4.3

New derived producer **`derived.grade`** (`plane: "derived"`, `availability: "local"`,
implementation `packages/runtime/src/grade.ts`), one projection:

```
id: derived.grade.move_quality@1
payloadType: MoveQualityGrade
derivation.inputs: [ recorded.engine.eval@1, live.stockfish.eval@1 ]
grounding: bounded_search        — inherited; both inputs share it, and the F1 compiler
                                   (evidence-contract.ts:465-467) refuses anything else
                                   for unmixed inputs. The grade IS an engine reading;
                                   the class boundary's convention status lives in exactness
exactness: convention            — never more exact than its inputs' depth/multipv, and
                                   the class boundary is a declared convention, not a measurement
confidence: reported
answerContent: ["evaluation"]    — the compiler-enforced best-move refusal, §5.3
operands: [klass, arm, before, after, dropWinPercent, thresholdCrossed,
           convention, engineId, lane, depthOrMovetime]
abstention: { possible: true, reasons: [input_abstained, missing_eval,
              unequal_instrument, mate_score_inconsistent] }
semantics: names grade-convention@1, the learner-side orientation parameter (§2),
           and the per-lane perspective normalization
disposition at landing: { kind: "experimental", reason: "Awaits module-registry
           compilation (learner-modules §5); the two declared-awaiting rows bind it." }
limitations: ["Single-line evals only: the drop measures the played move against the
           engine's one best-line estimate, at that depth, nothing deeper.",
           "Not a lesson: right about the position, possibly wrong about the reason
           (rung-2)."]
```

**§5.1 — The payload retains its operands** (the co-render property is checkable because
nothing is discarded):

```ts
interface MoveQualityGrade {
  readonly klass: "inaccuracy" | "mistake" | "blunder";          // closed; no praise member, no default member
  readonly arm: "eval_delta" | "mate_lost" | "mate_allowed";
  readonly before: GradeScore;   // { score: {kind:"cp",value}|{kind:"mate",movesTo}, winPercent, learner-POV }
  readonly after: GradeScore;
  readonly dropWinPercent: number;         // unrounded; renderers round to 0.1
  readonly thresholdCrossed: number | "mate_lost_floor" | "mate_allowed_boundary";
  readonly convention: { readonly id: "grade-convention"; readonly version: 1;
                         readonly context: "drill" | "review" | "imported_analysis" };
  readonly engineId: string;
  readonly lane: "recorded" | "live";
  readonly depth?: number; readonly requestedMovetimeMs?: number;
}
```

The typed cp|mate score union already exists at `packages/runtime/src/compare.ts:176-177`;
the implementation reuses it rather than minting a third eval-score shape.

**§5.2 — Timing is inherited, not owned.** The projection declares no timing; it is
admissible exactly where its two consumers' contracts already say (post-commit under the
disclosure model; review). Registry invariant carried into acceptance: the id appears in
no pre-commit or at-commit module's `accepts`/`awaiting` lists (checkable over
`MODULE_DECLARATIONS`, the same shape as the avoidance-row invariant).

**§5.3 — The best-move question: NO, and the compiler already said so.** A grade implies
"better existed"; chess.com and Lichess both co-locate "Nf3 was best." We refuse it *in
the projection*, and the refusal is structural, not editorial: F1 §4.3 requires
`answerContent ⊆ ∪ inputs' answerContent`, both inputs declare `["evaluation"]` only —
`recorded.engine.eval@1`'s limitation reads *"best move and principal variation are
absent"* and `live.stockfish.eval@1`'s adapter *"excludes bestMoveUci from fact-only
consumers"* — so a grade payload carrying a move raises `EVIDENCE_DERIVATION_WIDENS` at
compile. A derived projection over facts cannot disclose a move no input carries.
This is also the right disclosure economics: a grade **narrows** (a word plus numbers), a
best move **reveals** — different rows of the disclosure-cost axis, different budget. The
field's pairing is served on our side by composition, not by widening: the nudge's
"Explain" action opens the inspector, where `live.stockfish.pv` already renders under its
own contract and attribution. The learner who wants the answer takes one deliberate step
and gets it honestly; the learner who wants to try again was not handed it in the verdict.

### §6 — Co-rendering: word + number + threshold + convention version, always

§4a-layer-2, quoted and normative: *"printing the number is grounded; printing only the
word launders a convention as a fact."* The deterministic renderer for
`derived.grade.move_quality@1` emits **one sentence carrying all four elements** — the
class word; both evals (or the mate distance) with the drop; the threshold crossed; the
convention id/version/context:

> "Mistake — the recorded evaluation moved +1.00 (59.1%) → −1.00 (40.9%) across this
> move, a drop of 18.2 win-points against a threshold of 10 (grade-convention@1/review).
> Wait, that drop grades Inaccuracy — see fixture F-COR-2."

*(The example above is itself a negative fixture: a renderer whose word disagrees with
its own printed threshold arithmetic must be constructible in tests and must fail.)*

A word-only rendering is a red fixture forever (F-COR-1). The seam is F1's: sentences
exist only as the registered renderer's output over an admitted item's payload inside a
branded `RenderedEvidenceView`; a forged grade sentence fails
`EVIDENCE_GENERIC_BYPASS`.

**The voice layer needs zero changes, and that is verified mechanics, not hope**:
`voiceCheck`'s `absentWords` (voice.ts:107-110) bans a `BANNED_JUDGEMENTS` word only when
it is absent from the admitted packet's sentences. Once the deterministic co-rendered
sentence is in the packet, the LLM may re-voice "mistake"; it can never introduce a grade
word for an ungraded move, and it can never escalate — "blunder" over a packet that
graded "inaccuracy" is a `judgement:` violation and falls back to deterministic
rendering. The co-rendered sentence *is* the allow-list entry.

### §7 — What this projection refuses, stated

1. **Accuracy%, game ratings, eval graphs, per-game grade counts** — post-game
   aggregates are the Review lane's ([[D880]] standing; [[D928]]'s family-local selector
   owns whole-game selection and its refusal to coerce across families is this RFC's §3
   at one level up).
2. **Praise classes** — no Brilliant/Great/Best/Good/Excellent, and no "ok" member for
   below-threshold moves. A class whose threshold sits on the instrument's optimality
   boundary is a verdict, not a measurement (engine-condition clause 2, as carried by
   learner-modules §5.4); below-threshold is silence, which is also the product's default.
3. **Rating conditioning** — R15 byte-identity: rating is not an operand (§5.1 payload —
   structurally absent), and fixture F-R15 asserts byte-identical grades across rating
   contexts. The chess.com pattern where the same move earns different words for
   different players is the named counter-example.
4. **Pre-commit or at-commit timing** — inherited refusal: the only consumers are
   post-commit/review modules; §5.2's registry invariant makes a pre-commit consumer a
   red check, not a temptation.
5. **LLM involvement anywhere in the grade path** — law 8/ADR-0005: the grade is
   arithmetic + a cited constant; the LLM receives the sealed packet after selection and
   may re-voice under `voiceCheck` (§6), never compute, select, or adjust a grade.
6. **A best move or PV in the payload** — §5.3, compiler-enforced.
7. **A WDL basis** — until [[D927]] lands a stable perspective, WDL is not an honest
   operand (§8).
8. **Cross-lane or cross-depth deltas** — §2; abstention, never a "close enough" grade.
9. **Persistence** — a grade is never stored, in any table or event. It is recomputed
   from evals + the convention version on every read, so a convention bump can never
   strand stale grades ([[D368]]/[[D432]]'s class: a claim written once and never
   re-derived expires; a claim recomputed cannot). The longitudinal store's grain
   (opportunity/outcome pairs) is unaffected; if a future store row ever wants grade
   counts, that is a new claim negotiated there, not here.

### §8 — Upstream dependencies, stated and not fixed here

- **[[D927]]** — stored Stockfish **WDL** has no stable perspective at the storage
  boundary. Upstream of this RFC: the projection reads only cp/mate values, whose
  perspectives are pinned per lane (§2). The WDL basis stays refused (§7.7) until D927's
  normalization lands; nothing here touches the WDL path.
- **[[D917]]** — `story.ts` destroys the mate operand type via `STORY_MATE_CP`. This RFC
  does not repair Story; it refuses the same coercion in its own path (§3) and its
  acceptance suite pins the refusal (F-MATE-NEG asserts the grade path has no
  `STORY_MATE_CP` import and documents the misgrade the coercion would produce). Until
  D917's typed-union repair lands, Review Story's eval-shift sentences and this
  projection's mate grades will visibly disagree about the same moment — that
  inconsistency is D917's bug surfacing, named here so nobody "fixes" it by weakening
  the grade.

### §9 — Implementation surface and landing order

- `packages/runtime/src/grade.ts` — new: `winPercentFromCp(cp)` (exported **once**; the
  accuracy/eval-graph family ([[D880]]) must reuse this symbol, never re-derive the
  constant), `GRADE_CONVENTION` (§4 table with citation records), pure
  `moveQualityGrade(before, after, context)` returning `MoveQualityGrade | Abstention`,
  and the deterministic renderer.
- `packages/runtime/src/evidence-catalog.ts` — the `derived.grade` producer + projection
  declaration (§5). The manifest digest moves; the docs tuple in
  `docs/evidence-contract.md` moves in the same change (F1's law).
- Tests beside them; no server, client, schema, or storage change of any kind.

**Landing order:** independent of learner-modules' implementation. If this lands first,
the projection compiles with its `experimental` disposition and no consumer — honest and
inert. When learner-modules' registry lands (after 2c/2d, its §7 sequencing), the two ◇
rows move from `awaiting` to `accepts`, the disposition lifts in that change, and
learner-modules D3 records this RFC's landing commit. Either order builds at every
intermediate commit.

## Deviations from design

None. The load-bearing rulings — grades-are-a-projection (learner-modules §5),
co-rendering (§4a-layer-2), post-commit/review timing (disclosure model), praise-class
refusal, R15, law 8 — are implemented, not deviated from. The one place this RFC chooses
where design is silent is the drill-context ladder values (open question 1).

## Acceptance criteria

Every criterion can fail and names its negative arm ([[D444]]/[[D451]]/[[D522]]). Counts
state unit and total. **At HEAD every fixture below starts red** — no grade path exists
(verified: the class words occur only in `BANNED_JUDGEMENTS`) — except criterion 10,
which is **vacuously green at HEAD** and is labeled a regression guard so it is never
scored as evidence.

1. **Projection compiles as declared** (§5): producer, inputs, grounding
   `bounded_search`, exactness `convention`, answerContent `["evaluation"]`, all four
   abstention reasons, disposition. Negative arms: a test variant adding `"move"` to
   `answerContent` raises `EVIDENCE_DERIVATION_WIDENS` (the §5.3 refusal, executable);
   a variant with empty `derivation.inputs` raises `EVIDENCE_PROJECTION_INCOMPLETE`.
2. **Convention table cited** (unit: constant record; total 9 — 6 ladder thresholds + the
   −700 boundary + the ±1000 clamp + the logistic coefficient): every record carries
   non-empty `{ value, source, pinnedAt }`; the lint fails on a record missing either
   field (negative fixture: one uncited constant).
3. **Ladder boundary pairs** (unit: fixture; total 12 — 3 classes × 2 sides × 2 ladders),
   each pinning Win% to two decimals. Report ladder, from cp 0 (50.00%): →−110 = drop
   9.99, **no emission** / →−111 = 10.08, inaccuracy; →−230 = 19.99, inaccuracy / →−231 =
   20.07, mistake; →−376 = 29.97, mistake / →−377 = 30.03, blunder. Practice ladder:
   →−27 = 2.48, nothing / →−28 = 2.58, inaccuracy; →−65 = 5.96, inaccuracy / →−66 = 6.05,
   mistake; →−156 = 13.98, mistake / →−157 = 14.06, blunder. Failure mode: a wrong
   coefficient, clamp, or comparison direction flips at least one pair.
4. **Two-conventions fixture** (F-CTX): the identical 0→−28 pair grades **inaccuracy**
   under `drill` and **nothing** under `review`; byte-identical inputs, different
   convention context, different (word vs silence) result — the Lichess two-ladder
   precedent, executable.
5. **Mate arm** (unit: fixture; total 5): F-MATE-LOST (learner #2 → +800: `mate_lost`,
   floored **inaccuracy**, sentence carries "#2" and 95.01%); mate-lost by ladder
   (#3 → +200: drop 32.38 → **blunder**); F-MATE-ALLOWED (0 cp → opponent #3:
   **blunder**, drop 50.00, boundary cited); F-MATE-DELAYED (#2 → #5: **no emission**);
   F-MATE-NEG — the permanent hard negative: the grade path imports no `STORY_MATE_CP`
   and no ±1000 mate coercion (asserted structurally), and the fixture text documents
   the misgrade coercion would produce (97.55 → 95.01, drop 2.54 — a missed forced mate
   graded as nothing).
6. **Abstention renders nothing** (unit: fixture; total 4): missing after-eval;
   recorded-vs-live cross-lane pair; depth 18 vs depth 12; mate-against → cp
   (`mate_score_inconsistent`). Each yields abstention, zero sentences, and no default
   class — the type has no member to default to (negative arm: a hypothetical `"ok"`
   member fails the closed-union test).
7. **Perspective** (F-PERSPECTIVE): one position pair evaluated through both lanes
   (recorded White-POV values; live side-to-move values), learner playing Black,
   converges to identical learner-POV Win% to two decimals; failure mode: skipping
   either lane's §2 normalization flips the sign.
8. **R15 byte-identity** (F-R15): identical run bytes under two different learner-rating
   contexts produce byte-identical `MoveQualityGrade` payloads and sentences. Failure
   mode: any rating operand reaching the computation.
9. **Co-render** (unit: fixture; total 3): the deterministic sentence contains word +
   both numbers (or mate distance) + drop + threshold + `grade-convention@1/<context>`
   (F-COR-0); F-COR-1 — a word-only sentence fails the renderer contract, permanently
   red-by-design; F-COR-2 — a `voiceCheck` arm: LLM output saying "blunder" over a
   packet whose sentence graded "inaccuracy" yields a `judgement:blunder` violation,
   while re-voicing "inaccuracy" passes — proving §6's zero-voice-change claim.
10. **No persistence** — no table, event, or snapshot stores a grade class (grep + test
    over storage writes). **Vacuously green at HEAD; regression guard, not evidence.**
11. **Registry hygiene at the consumer edge**: the id appears in no pre-commit/at-commit
    module's `accepts`/`awaiting` (over `MODULE_DECLARATIONS` once learner-modules
    lands; until then the check runs over this RFC's declaration alone and the criterion
    is recorded as partially deferred, not passed). Manifest digest and the
    `docs/evidence-contract.md` tuple move in the same commit.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Consumer-edge compilation: the two ◇ declared-awaiting rows (`module.postcommit_nudge`, `module.review_map`) bind `derived.grade.move_quality@1` and this projection's `experimental` disposition lifts — learner-modules' registry landing is the edge; until it lands the projection is manifest-registered with no production consumer and this RFC cannot archive around that | `learner-modules` | the learner-modules implementation commit that compiles the registry (the same commit flips learner-modules' own D3) | |

## Open questions

1. **The drill ladder's values** (2.5/6/14) are the cited Lichess practice constants, but
   whether that strictness fits *our* consequence loop is a validation-by-use question —
   the owner's play session, not a review, answers it. The **mechanism** (two ladders,
   three contexts, versioned, cited) is closed by this RFC; re-valuing is
   `grade-convention@2` material and needs no structural change.
2. **May a grade *fire* Review-moment selection?** If it ever does, all four
   engine-condition clauses bind (learner-modules §5.4). Deferred to [[D928]]'s
   family-local selector RFC, which owns whole-game selection; this projection ships as
   renderable evidence only.
3. **Inspector exposure.** §5 names `postcommit_nudge` and `review_map` only; whether
   `full_inspector` should also list the grade (it accepts all rungs, attributed) is an
   owner call at learner-modules' implementation, not taken silently here.

## Ledger rows (proposed from D932 — head verified **D931** at drafting and moving in
flight this hour; whoever lands them re-verifies the head first, per the taxonomy's own
renumbering precedent)

- **D932** — Grade-family projection RFC drafted (this file): win%-drop basis on the
  pinned Lichess logistic (raw-cp refuted by arithmetic), typed mate arm refusing the
  ±1000 coercion with the misgrade quantified (a missed mate-in-2 for +8 reads drop 2.54
  — invisible — under coercion), two ladders × three contexts in cited-constant
  `grade-convention@1`, best-move refusal compiler-enforced via `answerContent`, grades
  never persisted, zero voice-layer changes needed (the co-rendered sentence is the
  allow-list entry).
- **D933** — Pin: `winPercentFromCp` is one exported symbol; the accuracy/eval-graph
  family ([[D880]]) and any future win%-based reading must consume it, never re-derive
  the 0.00368208 constant — the frozen-literal/duplicate-constant hazard, closed at the
  first symbol.

## Changelog

- 2026-08-22: created. All cited symbols verified at drafting HEAD (`906498a`):
  `evidence-catalog.ts` projection declarations (`recorded.engine.eval` ~:361,
  `live.stockfish.eval` ~:365, `derived.compare.eval_delta` ~:399,
  `derived.story.eval_shift` ~:402), `story.ts:33/:104/:106-107`,
  `evidence-queue.ts:81`, `voice.ts:12-21/:93-97/:107-110`, `compare.ts:176-177`,
  `evidence-contract.ts:3/:455-472`.
