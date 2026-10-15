# RFC: Move-quality grades — the grade-family projection and its convention document

- **Status:** implementing — D3860's 2026-10-15 repair enforces §2 at the sealed factory before payload normalization and declares the two actual ordered occurrences in each same-source alternative. The earlier 2026-09-01 claim of paired declaration/source enforcement was too strong: the declaration still had one occurrence per member and the wrapper admitted mixed origins. Pure grading constants/arithmetic are unchanged. D1 discharged at `63902370` (2026-09-24): both current module consumers admit the grade. This scoped repair does not supply D3859's modern source/edge/context and complete-consumer migration. *(Accepted 2026-08-22 by claude after adversarial cross-review; prior line: draft.)*
- **Author:** claude, on the [[D879]] BUILD-IT verdict and the [[D899]] routing (learner-modules `## Discharges` D3)
- **Created:** 2026-08-22
- **Design refs:** `design/05-in-run-experience.md` §3 (grounding ladder, §3-forms honesty split), `design/research/assistance-surface-taxonomy.md` §2b (pinned Lichess constants), §2d-1 (two-ladder precedent), §4a (the explicit verdict); `design/research/classifier-coverage-and-noise.md` §4a layer 2 (as quoted by both)
- **Exploration gate:** opened by the 2026-08-12 owner ruling (logged in `planning/exploration/log.md`); this specific RFC commissioned by [[D879]] ("BUILD IT") via `rfc/learner-modules.md` §5 / Discharges D3
- **Depends on:** `learner-modules.md` (accepted — §5 rules grades a projection and names the only two consumers; its Appendix B carries the two ◇ declared-awaiting rows this RFC compiles); `rfc/archive/evidence-contract-manifest.md` (F1 §4.3 derived-projection vocabulary and compiler)
- **Parent / amends:** — (a new derived producer; amends no implemented behavior)
- **Supersedes / superseded by:** —
- **Planning:** `planning/evidence-foundation-ux/` (once implementing)

```tabiya-claims
semantic-conventions | members grade_convention_v2 | D1422 owner-ruled single 2.5/10/15 Win%-point ladder, with unchanged typed-mate and logistic rules
```

**Current amendment boundary, 2026-10-15:** §2a and §4a are unaccepted amendments to the
implemented predecessor described by the original Summary/§§1–9 below. §4a supersedes its
two-ladder/context-dependent payload and criteria2–4/9 for the proposed current grade@2;
it does not authorize a silent change to the landed projection@1 or convention@1. D1422 is
an answered owner ruling, not an outstanding product choice. Independent source/joint review
still precedes adoption. The semantic-conventions claim above is new; the original claim-free
scope statement below describes the predecessor, not this amendment.

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
The delta basis is **win-percentage drop** on Lichess's published logistic (re-pinned
from verbatim source at cross-review — the taxonomy's threshold gloss was off by the
[−1,+1]-scale factor of two for the report ladder; §1), not raw centipawns. Mate scores
get a **typed arm** (`mate_lost` / `mate_allowed`; `mate_delayed` is never graded),
pinned verbatim to Advice.scala's full three-tier mate table — never the ±1000 cp
coercion `story.ts` ships ([[D917]]). Two ladders serve three contexts (drill gets the
stricter practice ladder — 2×/1.67×/1.07× of the report rungs; review and imported
analysis share the report ladder), both versioned in one document. The word, the numbers, the threshold crossed and the convention
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

Lichess's judgment thresholds operate on this drop, **but its two ladders live on two
different normalizations, and the taxonomy's single gloss ("0.1 = 10 win-percentage
points") is refuted at the source for the report ladder** (verbatim fetch of both files
at cross-review, 2026-08-22; erratum proposed as a ledger row below):

- **Report** (`Advice.scala`): `delta = currentWinningChances − prevWinningChances`, a
  *raw* difference of `WinPercent.winningChances` values on **[−1,+1]**, thresholds
  0.10/0.20/0.30. Since Win% = 50 + 50·wc, a wc-drop of 0.10 is **5 Win%-points**, not
  10 — the report ladder is **5/10/15** in this RFC's unit.
- **Practice** (`practiceCtrl.ts`): `shift = −povDiff(...)`, and `povDiff` **divides the
  povChances difference by 2** (`ui/lib/src/ceval/winningChances.ts`), thresholds
  0.025/0.06/0.14. A shift of 0.025 is a wc-drop of 0.05 = **2.5 Win%-points** — the
  practice ladder is **2.5/6/14** in this RFC's unit, as the taxonomy stated.

The corrected ratios: practice is **2× stricter at inaccuracy, 1.67× at mistake, and
only 1.07× at blunder** — the taxonomy's "4×" compared threshold literals across the
two normalizations. The drill-context rationale (§4) survives: practice is stricter at
every rung; the near-agreement at blunder is Lichess's own shape, adopted as cited.
Sanity anchor: +1.00 → −1.00 is a wc-drop of 0.364 — a Lichess **Blunder** (≥ 0.30),
and 18.21 Win%-points ≥ 15 here; under the uncorrected 10/20/30 ladder the same move
would have graded "inaccuracy," misgrading every grade in the family by about one class.

**Why not raw centipawn deltas — the arithmetic:**

| move | cp before → after | cp lost | Win% before → after | drop | honest reading (report ladder, §4) |
|---|---|---|---|---|---|
| A | +500 → +300 | 200 | 86.31 → 75.11 | **11.19** | still winning; a mistake |
| B | +100 → −100 | 200 | 59.10 → 40.90 | **18.21** | the game changed hands; a blunder |
| C | +800 → +200 | 600 | 95.01 → 67.62 | **27.38** | still clearly better, and still a blunder |
| D | 0 → −300 | 300 | 50.00 → 24.89 | **25.11** | equal → probably lost; a blunder |

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
clamps to +1000 → +1000: drop 0, no grade (fixture F-CLAMP). **Clamp-before-conversion is
a declared cell, not a pinned one, and it can change a grade class** (found at
cross-review): Lichess's own two paths disagree — `WinPercent.fromCentiPawns` and the ui's
`cpWinningChances` clamp the *input* to ±1000, while `Advice.scala` feeds *unclamped* cp
into `winningChances` (the output clamp to [−1,+1] is mathematically inert). At
+3000 → +530 the clamped drop is 9.98 (inaccuracy) and the unclamped drop 12.44
(mistake). This RFC pins **clamp-the-input**, siding with `fromCentiPawns` and the
practice path, and fixture F-CLAMP-2 pins the +3000 → +530 case to **inaccuracy** so a
future "fix" toward unclamped Advice arithmetic is a visible convention change
(`grade-convention@2`), never a silent one.

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

### §2a — Draft D3859/D3861 current source-owned grade — unaccepted

This is the current-source replacement required by module-registration's coordinated image,
not implementation permission inherited from this RFC's implementing status. D3860 repairs the
accepted predecessor's pair check; it does not supply this stronger source/occurrence contract.
D3851's pre-launch ruling removes compatibility-only predecessor APIs and dual pipelines once
actual callers migrate. No database erasure, manufactured provider history or weakened access.

**One current projection.** Proposed `derived.grade.move_quality@2`, sole factory
`createDerivedGradeMoveQualityV2Evidence`, producer derived.grade. It has exactly these ordered
literal members, not their union or a caller-selected mix:

| Source origin | Literal inputs, in receipt order |
|---|---|
| stored provider delivery | derived.review.eval_point@1, derived.review.eval_point@1, run.record.edge@1 |
| pinned pack engine ledger | recorded.engine.eval@1, recorded.engine.eval@1, run.record.edge@1 |

The actual arguments are `{recordedGrade: RecordedGradeSource}`. This is a source-owner-issued,
privately nominal, independently immutable source, not a new evidence projection or persisted
record. Proposed service operation `RunService.resolveGradeMoveSource(context,{nodeId,signal})`
constructs it; proposed private reader `readRecordedGradeSource` is shared by the sole factory
and Review's accuracy/graph calculation. It retains the authorized edge and both endpoint states,
not only a successful comparable pair. A caller cannot supply before/after readings, FEN, mover,
context, origin, attachment ordinal, a source-valid Boolean or a function that produces them.
Both literal members and all real source occurrences are retained exactly; no unused witness.

**Occurrence and workflow authority.** The context is issued by the actual current Nudge or
Review operation after complete consumer preflight and current read/role/session/answer-ceiling
admission. It retains the authorized original run/event head, granted branch, actual parent/
child edge, selected source occurrences and actual workflow context. Validate the original
graph and granted source path before narrowing; obtain the genuine run.record.edge@1 and actual
positions, including canonical full FENs, through their existing owners. The source validates
both point/readings against those exact positions and original occurrence identities, not just
equal FENs. Derive mover from the parent FEN. Nudge retains its actual learner-committed-edge
eligibility and actual drill workflow; Review supplies imported_analysis for the original
imported workflow, otherwise review. That context stays private source/permission metadata;
§4a uses one ladder and no public context field. Client preferences cannot choose a ladder.
Recheck current access/head/selected edge/disclosure/cancellation before publication. A copied,
crossed, stale or forged source fails; it is not missing_eval or a successful empty result.

D3863/F2 §2.3a shares only the private per-node engine endpoint resolver with Compare trajectory,
not this edge-shaped grade source or grading permission. The source owner factors fixed node
selection into resolveRecordedEngineEndpoint, returning the same closed endpoint state for
grade's two nodes and Compare's independently authorized node (including a root/fork with no
incoming edge). Full source context/grants still precede either lookup; no caller scores,
invented edge, extra grade consumer, public resolver or context/threshold change. Compare's
separate nominal source and sole point factory cannot authorize a grade.

**Provider origin already exists.** Reuse Review's actual private attached
values.providerDelivery via serialize/parsePersistedProviderDelivery and the registered
live.stockfish.position_eval@1 → derived.review.eval_point@1 factories. Persisted delivery
must re-derive, match the actual node's full FEN and retain the selected attachment's original
seq/ordinal and event-head identity. Source-owning lookup selects the latest valid modern
occurrence at each endpoint in original event order; a later legacy-only row does not replace
it. A corrupt or crossed modern occurrence is a source-contract failure, never a fallback to
an earlier valid delivery or scalar report. The current reviewDurableEngineStates map alone
cannot prove the selected ordinal or this stronger corruption rule; implement the exact owner
resolver rather than claim the map already satisfies it.

The separate queued Stockfish resolver is used only for an actual attached modern job reference
owned by that job store. Its consumed whole delivery and exact attachment/request joins must
validate under durable-stockfish-source §4; arbitrary job lookup is forbidden. A genuine private
Review attachment does not require that queued migration. Never query an engine in this grade
read, backfill missing transcripts or treat ordinary scalar packet fields as provider evidence.
Already retained valid sources work with the provider offline; declared provider execution paths
remain real source requirements, satisfied by the genuine retained delivery, not operation aliases.

**Ledger origin has its own authority.** Reuse the proposed registry-owned measurement source
in module-registration §4.11a, including actual pinned pack/digest, original sidecar read states,
whole manifest/ledger validation, exact record/source linkage and immutable original ordinals.
Require engine-origin SourceEntry for each selected engine_eval, with exact sourceId/retrievedAt,
full FEN, engine id/version, available engine name, profile and budget; a generic HTTP/local-file source cannot
attest an engine instrument. Mint the existing same-record ledger→reading chain for both
positions, retaining original source entries privately. The normalized reading's reached depth
does not replace the manifest's requested budget. Missing budget/profile/identity is unavailable
input_abstained, not an invented default. Conflicting artifacts fail source_contract_invalid.

At each actual node select the first individually admitted engine reading in original record
ordinal order, before inspecting its neighbor or testing pair comparability. Keep that selection
and the complete candidate/disposition image in the private source. Do not search a later record
to rescue a pair. An individually admitted reading has the required identity/profile/budget and
exact position/source joins; a malformed artifact fails before selection, not by being skipped.
Offline pairs require identical engine identity/version, Threads/Hash/MultiPV=1 and identical
requested depth or movetime budget. This is a fixed per-node source lookup rule, not
usefulness ranking; Inspector still retains all measurements. No live/ledger mixing and no
claim of provider generation/command/transcript proof for an offline report. Its comparability
is the reported instrument/profile/budget, not proof of every runtime option or search tree.

**Origin selection and absence are explicit.** For ordinary current reads, a recorded modern
attachment/reference or already-owned pending modern request at a node selects the provider
origin for that node. Otherwise the node may select its pinned pack's independent ledger origin;
non-pack runs cannot borrow a pack with the same position. Apply this once per node within the
authorized immutable source snapshot, independent of incoming/outgoing edge or neighbor data.
Require both selected endpoints from the same origin for a pair. Partial/missing/failed modern
input does not switch to ledger; mixed selected origins abstain unequal_instrument. Corrupt modern
data never selects a weaker report. This introduces
no learner-facing source setting or change to module activation/defaults. Preserve exact pending,
missing, invalid and instrument-mismatch states; no ungradeable move becomes “good”. Missing
grade input is local to that binding, not a whole Nudge/Review hold, and useful other facts remain.
The private resolver returns the owned RecordedGradeSource for a valid authorized edge even
when measurements are absent or incomparable. Its private reader returns before/after endpoint
states and a separate pair state, plus derived mover/context. Each endpoint is available with
its exact selected point/reading and occurrence, or unavailable with source_pending, missing_eval
or input_abstained. The pair is available with the ordered admitted operands, genuine edge and
instrument, or unavailable with source_pending, missing_eval, input_abstained or unequal_instrument.
Pair absence precedence is pending, missing, input-abstained, then instrument mismatch; retain
both individual endpoint states rather than losing the other point. Access/subject/stale and
storage/source-contract failures retain their existing typed refusal/failure channels; they are
not caught into these absence states. Pending comes from an actual owned pending request, not
the mere absence of a score. The source supplier maps the pair reason to the exact grade@2
ModuleSourceResult.unavailable row with fixed readable captions and no synthetic fact.
The sole factory retains EvidenceAvailability<readonly DeclaredEvidence<MoveQualityGradeV2>[]>
and its declared arithmetic abstentions; a valid below-threshold pair is available with [].
The grade-source captions are fixed registered operational text, not LLM output or facts:

| Exact grade-source reason | Caption |
|---|---|
| source_pending | Engine comparison is still being prepared. |
| missing_eval | No paired engine readings are recorded for this move. |
| input_abstained | The recorded engine readings cannot be used for this comparison. |
| unequal_instrument | These readings used different engine settings or search budgets. |
| mate_score_inconsistent | These mate readings do not form a consistent comparison. |

Render this only as the grade binding's state; it cannot replace useful structural/theory facts,
claim a successful engine comparison or dump the reason identifier into learner text. Existing
access/storage failures use their existing truthful refusal/error captions, not this table.

**Comparison and all supported budgets.** Provider points must pass existing
reviewPointComparability: actual engine id/version, generation, position-free command image and
typed requested bound. Do not compare reached depth under timed/node searches. Extend the pure
grade input/output search-limit representation to an explicit requestedNodes arm; never encode
nodes as depth or milliseconds. A normalized operand carries exactly one requested bound.
Depth, movetime and node-count pairs all run the same score/mate arithmetic and §4a's one ladder.
Offline origin has only the two actual SourceManifest budget arms; do not invent offline nodes.

**Payload and authority.** `MoveQualityGradeV2` retains the existing class/arm, both learner-POV
typed scores, unrounded drop, threshold and grade-convention@2, engine id and recorded
lane, plus the exact normalized requested bound and an instrument arm identifying provider
delivery versus offline engine report. Provider metadata retains actual version/generation;
offline metadata retains actual version/profile. Keep source occurrence/complete delivery/
original ledger entries in the owned source/input receipts, not raw public/LLM data. Provider
scores are already White POV; offline readings require explicit White POV. Normalize to the
derived mover exactly once. Typed mate never becomes centipawns, a prediction or an outcome claim.
Keep existing unavailable/below-threshold/no-praise distinctions. Only §4a changes the ladder;
source ownership does not change the logistic, clamp, mate rules or accuracy formula.

The closed payload addition is:

```ts
type GradeRequestedBound =
  | { readonly kind: "depth"; readonly requestedDepth: number }
  | { readonly kind: "movetime"; readonly requestedMs: number }
  | { readonly kind: "nodes"; readonly requestedNodes: number };
type GradeInstrumentV2 =
  | { readonly origin: "provider_delivery"; readonly engineVersion: string; readonly generation: number }
  | { readonly origin: "offline_engine"; readonly engineVersion: string;
      readonly profile: { readonly threads: number; readonly hashMb: number; readonly multiPv: 1 } };
type MoveQualityGradeV2 = Omit<MoveQualityGrade, "convention" | "depth" | "requestedMovetimeMs" | "requestedNodes"> & {
  readonly convention: { readonly id: "grade-convention"; readonly version: 2 };
  readonly bound: GradeRequestedBound;
  readonly instrument: GradeInstrumentV2;
};
```

Bound values/profile use their existing validated positive-integer domains; provider generation
uses the existing acquisition domain. Exactly one bound arm, no extra scalar depth/time/node
fields. The pure grading input/output gains requestedNodes without a new numerical conversion;
the new factory removes those optional scalar limit fields in favor of the closed bound above.
Existing provider/ledger score domains remain: do not invent a zero-distance mate reading that
the provider parser refuses, or coerce it into a different mate. A terminal rules/result fact
does not require a fabricated engine grade.

The new projection is declared_convention/convention/reported: its real position/edge and
eval-point inputs do not inherit the predecessor's bounded_search primary grounding. Its
answerContent is evaluation only; forms sentence/panel. Semantics names grade-convention@2
literally and retains its actual direct/child closure without relying on a retired@1 declaration.
§4a owns the new convention definition; no new provider operation. The registered renderer
`grade.move_quality@2` is pair-keyed to current Nudge/Review consumers only and co-renders the
class, operands/drop/threshold, actual instrument/budget/origin and cited convention. It cannot
say a historical reading is live analysis or expose a best move, PV, WDL or private source.

**One source for Review grades, accuracy and graph.** Remove current scalar-only grade/accuracy/
evaluation-sentence/graph reads from the new Review path. Shared readRecordedGradeSource returns
the fixed endpoint states and pair state described above. Grade and accuracy use the same admitted
pair and existing pure grading result. A comparable source pair whose arithmetic is unavailable
(including mate_score_inconsistent) remains unevaluated. An available below-threshold result []
does count. Only after arithmetic admission compute the nonnegative drop via moverWinPercent:
its existing cp logistic and typed-mate 0/100 behavior remain, not logistic application to mate
operands. Do not reconstruct operands from grade text. All actual mover decisions remain in the
accuracy denominator; only source-and-arithmetic-admitted pairs contribute nonnegative drops.
The existing full-coverage gate and rounding/formula remain. Evaluation graph/sentences consume
the fixed individually available endpoints, including when their pair is unavailable; graph
points never require a successful grade source pair. One shared node has the same selected origin,
record/delivery and score on both adjacent edges in the same snapshot. Draw no connecting
comparison segment across an unavailable pair; do not choose a second report to fill the gap.
For A=X-only, B=Y ordinal0/X ordinal1, C=Y-only, select B/Y once: A→B is incomparable,
B→C may compare, and the graph shows B/Y only. Such individual coverage never counts as evaluated
accuracy. Keep those coverage units explicit rather than reusing a scalar-read count. Apply the same module evaluation ceiling
to figures, graph and captions; no accuracy/graph bypass when grade evidence is withheld.

**Adoption and able-to-fail proof.** Coordinate F2 §2.3l and module-registration's one current
Nudge/Review image, pair-keyed renderer/voice and actual API/client admission. Source resolution
and both literal members must compile before lazy acquisition. Retire the old grade wrapper/
scalar readers/current@1 consumer bindings after real callers migrate; do not retain a parallel
compatibility implementation under D3851. No whole-image acceptance from this isolated proposal.
Permanent tests must exercise actual private source issuance/revalidation, both origins/colors/
three contexts, all three modern/two offline budgets, typed mates/thresholds and empty results;
wrong edge/head/ordinal/pack/source/clock/perspective/engine/version/generation/options/bound,
mixed origins, later legacy and corrupt modern, pending/missing sources and node budgets.
Include the shared-middle-node X/Y fixture, valid endpoint beside incomparable/missing endpoint,
and comparable mate_score_inconsistent versus available below-threshold accuracy controls.
Run actual authenticated Nudge/Review/accuracy/graph/LLM-off renderer journeys, not only factory
fixtures. Prove unchanged logistic/mate arithmetic, the ruled ladder and source-local absence beside useful other facts,
with no new provider request, stored write, copied seal, dropped family or authority upgrade.

### §3 — The mate arm: mate is not a centipawn

`story.ts:33/:104` maps every `mateIn` to ±`STORY_MATE_CP` (1000) and clips — which
destroys mate distance, mate appearance, and cp↔mate transitions ([[D917]]). The
corruption is not cosmetic; run fixture F-MATE-LOST through it: *learner has mate-in-2;
plays a move; engine now reads +800 cp.* Coerced, that is 97.54% → 95.01%, drop 2.54 —
**below every report threshold (§4: 5/10/15): a missed forced mate grades as nothing in
review** (and in drill it grazes the 2.5 practice rung as a borderline "inaccuracy" —
either way, never the mate-loss verdict). The coercion makes exactly the moves a grade
family exists for invisible or trivial. Lichess's report path does not grade mates
through its formula either — Advice.scala keeps a separate mate table — so a typed arm
*is* the report tradition. (Its *practice* path does coerce, via the mate-distance-aware
`(21 − min(10, N)) × 100` cp mapping in `winningChances.ts` — softer than `story.ts`'s
flat ±1000, refused here for the same reason: a mate is a forced outcome, not a scalar.
The flat ±1000 `WinPercent.fromMate` mapping serves accuracy%/graphs, which are
[[D880]]'s problem, not this projection's.)

**The arm, typed — and the whole arm is now `chess_tradition`, pinned verbatim from
Advice.scala at cross-review (2026-08-22).** The taxonomy had pinned only three cells of
Lichess's mate table; the source carries the *complete* three-tier table on both sides,
so the drafted floor/boundary generalizations are withdrawn — they contradicted cells
that turn out to be pinned (the drafted floor read #N → +800 as Inaccuracy; the source
says **Mistake**). With both scores learner-POV (`mate M > 0` = learner mates in M;
`M < 0` = learner is mated); mate-tier comparisons are on learner-POV cp, strict, as in
source, and clamp-invariant (cp moved by the ±1000 clamp never cross a ±700/±999 tier):

| transition (before → after) | class | severity (verbatim Advice.scala) |
|---|---|---|
| cp → cp | `eval_delta` | the §4 ladder on the Win% drop |
| mate M>0 → cp | **`mate_lost`** | after-cp > +999 → **inaccuracy**; > +700 → **mistake**; else → **blunder** (the `MateLost` tiers) |
| mate M>0 → mate N<0 | **`mate_lost`** | **blunder** — the cell the draft omitted: source matches this transition as `MateLost`, and with no after-cp its `povCpOrZero = 0` falls to the blunder tier |
| cp → mate M<0 | **`mate_allowed`** | before-cp < −999 → **inaccuracy**; < −700 → **mistake**; else → **blunder** (the `MateCreated` tiers — an allowed mate **always** grades, at least Inaccuracy; the drafted "usually nothing" fallback contradicted source and is withdrawn) |
| mate M>0 → mate N>0, N ≥ M | `mate_delayed` | **never graded — no emission** (pinned: positive→positive never matches a `MateSequence` in source; `MateDelayed` is never judged) |
| mate M>0 → mate N>0, N < M | — | no emission (optimal or better; the same unmatched cell in source) |
| mate M<0 → mate N<0, any N | — | no emission: every move of a position lost by force loses by force (source: unmatched, no advice) |
| mate M<0 → cp, or cp → mate M>0 improving | — | no emission (grades are loss classes; §7.2) — and `mate M<0 → cp` is additionally impossible under one instrument's coherent readings: abstain `mate_score_inconsistent` where Lichess silently emits nothing (a depth/horizon disagreement, not a learner improvement; same rendered outcome, ours declared) |

Win% glosses of the tier constants, for renderers: Win%(+999) = 97.54, Win%(±700) =
92.94 / 7.06, Win%(−999) = 2.46. The tier operands are the cp values themselves; the
delayed/lost boundary is pinned by the source's sequence matcher — `mate_lost` fires
exactly when a positive mate becomes cp or a negative mate, `mate_delayed`'s no-emission
covers positive → positive at any N.

The mate arm is **context-independent** (one table for all three §4 contexts): mate
classes state forced outcomes, not the loss tolerance a context chooses; the tiers are
fixed cp constants with no per-context variant in the report tradition, and
practice-mode's coerced-mate divergence is refused above. Only the `eval_delta` ladder
varies by context. (The draft's "the floor tightens automatically in drill" sentence
contradicted this declaration and is gone with the floor itself.)

Co-rendering for mate classes shows the mate operands, never a coerced scalar:
*"Mistake — a forced mate (#2) was on the board; after this move the engine reads
+8.00 (95.0%), inside the +7.00..+9.99 mate-lost tier. grade-convention@1/review."*

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
| `report` | ≥ 5 | ≥ 10 | ≥ 15 | Lichess `modules/tree/src/main/Advice.scala`: raw winning-chances drops 0.10/0.20/0.30 on the **[−1,+1]** scale, ×50 to Win%-points (§1's normalization correction — the taxonomy's §2b gloss read these as 10/20/30 and is refuted at source; verbatim fetch 2026-08-22) |
| `practice` | ≥ 2.5 | ≥ 6 | ≥ 14 | Lichess `ui/analyse/src/practice/practiceCtrl.ts`: 0.025/0.06/0.14 over `povDiff`, which **halves** the [−1,+1] difference, so ×100 to Win%-points — the stricter in-drill ladder Lichess itself runs beside its report ladder (taxonomy §2d-1's two-conventions precedent stands; its "4×" was a cross-normalization artifact — true ratios 2×/1.67×/1.07×) |

Plus the four mate-tier constants (§3, verbatim Advice.scala): `mate_lost` after-cp tiers
**+999 / +700** and `mate_allowed` before-cp tiers **−999 / −700** (Win% glosses 97.54 /
92.94 / 7.06 / 2.46). The cp clamp **±1000** (a declared cell where Lichess's own two
paths disagree — §1) and the logistic coefficient **0.00368208** are constants of the
same table, same citation discipline.

**Three contexts, and which shares what:**

| context | ladder | who consumes | rationale |
|---|---|---|---|
| `drill` | `practice` | `postcommit_nudge`, at its timings (post-commit cap-2, `attempt_end`/disclosed — learner-modules §4.5) | a consequence rehearsal is Lichess's practice-mode situation: the learner asked to be held to precision, and the whole product loop is *rewind and try again* — a 3-win-point slip is exactly what a drill exists to surface |
| `review` | `report` | `review_map` (review timing — learner-modules §4.10) | post-game reading of a finished run is the report situation the 0.10/0.20/0.30 constants were derived for |
| `imported_analysis` | `report` — **shared with `review`**, declared, not duplicated | `review_map` over `sessionKind: "imported"` runs | an imported real game is precisely what Lichess's report ladder reports on; sharing the tradition's constants keeps our verdicts comparable to the Lichess/chess.com reports the owner will hold them against |

The convention is cited as **`chess_tradition` in the convention text, never as a
grounding value** — `EvidenceGrounding` does not contain it and this RFC does not widen
the union (the `tactical-collectors` §2.5 reconciliation, followed exactly).

**Versioning:** any constant, class, or context-mapping change is `grade-convention@2` —
the version bump *is* the ceremony, and the rendered convention version is what makes an
old rendered sentence forever attributable to the rule that produced it. Re-pinning a
derivation input version is a projection `@2` (F1 §4.3).

### §4a — Draft D1422 unified convention@2 — unaccepted

**Authority and exact change.** D1408 ruled one ladder everywhere; D1422 settled it on
2026-08-23: **2.5 / 10 / 15 Win%-points**, inclusive at each boundary. The constituent
values have the original 2026-08-22 source pins in §1/§4; their combination is Tabiya's
product rule, not a claim that Lichess uses this combined ladder or still uses these values
today. No new empirical chess claim or owner answer is needed. This amendment corrects the
unlanded ruling, not the earlier history. The provider-source proposal §2a adopts it together
with its new projection; source comparability alone does not select the numerical convention.

**One current table, no context switch.** Replace the live GRADE_CONVENTION table with
id grade-convention/version2 and exactly nine cited constant records:

| Key | Value | Existing source pin |
|---|---:|---|
| inaccuracy | 2.5 | practiceCtrl.ts, 2026-08-22 (§1) |
| mistake | 10 | Advice.scala, 2026-08-22 (§1) |
| blunder | 15 | Advice.scala, 2026-08-22 (§1) |
| mateLostInaccuracy | 999 | Advice.scala, 2026-08-22 (§3) |
| mateLostMistake | 700 | Advice.scala, 2026-08-22 (§3) |
| mateAllowedInaccuracy | -999 | Advice.scala, 2026-08-22 (§3) |
| mateAllowedMistake | -700 | Advice.scala, 2026-08-22 (§3) |
| centipawnClamp | 1000 | winningChances.ts, 2026-08-22 (§1) |
| logisticCoefficient | 0.00368208 | winningChances.ts, 2026-08-22 (§1) |

Each retains {value,source,pinnedAt} with the same full source URLs used by the current table.
There is no contexts map, report/practice prefix, rating operand or second active table.
The pure current grade function takes admitted before/after inputs and mover, not workflow
context. Remove the obsolete context-choosing overload/wrapper and migrate actual callers.
Source ownership still retains actual context for authorization, timings, receipts and access;
dropping context from the arithmetic must not make Drill and Review permission-equivalent.
All nine constants remain validated; a missing, extra, invalid or uncited record fails.

**Byte identity must be real, not a comparator that discards inconvenient fields.** The
current grade@2 payload uses §2a's closed convention {id:"grade-convention",version:2}, with
no public context discriminator. Its registered full deterministic sentence uses the same
context-independent convention label/definition and operands on both Nudge and Review. For
identical admitted operands, mover and instrument, serialize the *whole grade payload* and
compare the full deterministic grade sentence byte-for-byte across drill, review and
imported_analysis. Do not strip context just in the assertion or compare only the class.
Actual source/consumer receipts, selection, presentation seats and availability may differ
because permissions and workflows differ; they are not the bytes this criterion equates.
The source-owned context remains in the existing input receipt's canonical source image,
not in public grade prose. Never infer permission from equal numeric outputs.

**Registered meaning and delivery.** Add grade_convention_v2 exactly once to the semantic
member tuple and append its authored declaration/history without rewriting convention@1's
generated prefix or historical meaning. Its definition names the one 2.5/10/15 ladder,
clamp/logistic and unchanged typed-mate rules, as well as the engine-relative/non-lesson
limitations. Authority includes product_rule/rulingRef [[D1422]]; source citations explain
the borrowed values rather than laundering the combined rule as a published Lichess ladder.
Bind grade@2's direct convention closure to grade-convention@2. Keep existing historical@1
records attributable; no frozen executable grade@1 compatibility pipeline is required by D3851.
The new declaration's disclosure is exactly reviewed_text with:

- summary: "Move labels use Tabiya's single 2.5 / 10 / 15 win-percentage-point loss convention."
- detail: "All workflows use the same thresholds: inaccuracy at 2.5, mistake at 10 and blunder at 15 win-percentage points lost, with inclusive boundaries. Centipawns are clamped to -1000 through +1000 and converted with coefficient 0.00368208. Losing a positive mate grades by the remaining score: above +999 is inaccuracy, above +700 is mistake, otherwise blunder; allowing a negative mate grades by the earlier score: below -999 is inaccuracy, below -700 is mistake, otherwise blunder. A positive mate changing to a negative mate is a lost-mate blunder; delaying a mate is not graded. These are labels on paired readings from one engine and search budget, not an explanation of why the move works or a judgement of the player. The combined ladder is Tabiya's rule, using the cited historical Lichess values."

**Exact direct-convention replacement.** The current closure automatically carries a
predecessor's witnessed refs to the same-base successor. Merely mentioning convention@2 would
therefore retain both ladders. Amend that one owner, evidence-convention-closure, with a
package-private literal DECLARED_CONVENTION_REPLACEMENTS row:
`"derived.grade.move_quality@2": [{from:"grade-convention@1",to:"grade-convention@2"}]`.
Pass it as a defaulted fourth argument to deriveProjectionConventionTable, keeping the existing
three arguments unchanged. Validate it before deriving closure: exact active successor route
exists, from/to are registered versions of the same convention id advancing exactly one, the
immediate predecessor has that exact witnessed from ref, and the successor's catalogue semantics
literally names to but does not name from. Duplicate/conflicting pairs or unknown routes/refs
fail. When constructing this route's *automatic successor* origins, replace only that witnessed
from ref with to, retaining origin successor. Do not remove exact current witnessed refs,
catalogue refs or declared inheritance, edit the old convention's witness, suppress unrelated
conventions, or strip refs propagated from actual inputs. No caller-provided per-request override.
This row declares the changed grading meaning; it is not a generic exemption from grounding.
All unrelated routes preserve their old inheritance. Before grade@2 minting, its direct closure
must contain grade-convention@2 and not grade-convention@1; full actual-input closure remains
checked normally. Permanent negatives remove/swap/duplicate the row, remove the old witness,
name unknown/skipped/non-successor refs, retain old catalogue text or inject actual child@1
authority. The no-row predecessor control must expose the erroneous dual direct convention;
an actual child@1 authority cannot be erased to make the grade pass. Historical@1 declarations,
generated prefix and append-only history stay byte-identical. No production replacement row
is introduced until this amendment and its source/module joint migration are accepted.

Move the current payload parser, full registered renderer, module operand schema/renderer,
convention label lookup, voice bindings and actual Nudge/Review callers together. The shared
presentation-inspector-adapters filename does not authorize an Inspector grade consumer.
Reject wrong-version/context-bearing grade@2 payloads rather than silently coercing them.

**Acceptance replacements (current grade@2, not retroactive @1 assertions).**

- Criterion2 becomes nine records, with missing/invalid/extra-field and individual value mutation
  negatives. Criterion3 becomes six cp boundary fixtures in every context: 0→-27 no emission,
  0→-28 inaccuracy, 0→-110 inaccuracy, 0→-111 mistake, 0→-168 mistake, 0→-169 blunder;
  retain +3000→+530 as inaccuracy under input clamp. Also test the exact unrounded-drop classifier
  immediately below/at/above each of 2.5,10,15 so integer-cp examples cannot hide > versus >=.
- **Criterion4 is inverted:** actual authenticated drill/Nudge, Review and imported Review
  source issuance must reach the current factory/registered renderer for the same synthetic
  admitted score/instrument pair. Assert complete grade payload and full deterministic sentence
  byte identity, including threshold/convention and all operands. The predecessor must fail on
  0→-28 (silence in Review), 0→-66 (old drill mistake, current inaccuracy) and 0→-157
  (old drill blunder, current mistake). Missing/withheld/incomparable grades do not count as a
  positive fixture; selection/budgets remain separately tested, not relaxed to force delivery.
- Criterion9 retains mandatory full grounding and byte-exact allowed judgement spans under
  D1409, but uses convention@2 with no context suffix. A word-only, context-switched or
  wrong-version sentence fails. The LLM may quote an admitted deterministic grade span under
  the current voice contract; it may not freely re-voice or compute the label (§6's original
  free-paraphrase rationale was superseded by D1409/D1417).
- Re-run all typed mate, clamp, same-instrument/perspective, abstention, below-floor, no-praise,
  access/answer-ceiling and no-persistence regressions. Available below-floor still counts for
  source-admitted accuracy; changed class thresholds never change the accuracy formula.
  Existing grade-source node/time/depth coverage and exact occurrences remain requirements.

**Measurement boundary.** The disposable D1422 model attached to the existing grade-source
research may demonstrate the threshold arithmetic and predecessor disagreements, not genuine
current source issuance, grade@2 registration or cross-workflow delivery. Keep permanent actual
factory/HTTP/renderer positives pending until implementation; counts in a research model do not
discharge criterion4 or make this amendment accepted. Adopt only after independent source/joint
review with §2a/F2 §2.3l and the one complete current module image. No production change here.

### §5 — The projection, declared under F1 §4.3

New derived producer **`derived.grade`** (`plane: "derived"`, `availability: "local"`,
implementation `packages/runtime/src/grade.ts`), one projection:

```
id: derived.grade.move_quality@1
payloadType: MoveQualityGrade
derivation.anyOf: [ [recorded.engine.eval@1, recorded.engine.eval@1],
                    [live.stockfish.eval@1, live.stockfish.eval@1] ]
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
  readonly thresholdCrossed: number | "mate_lost_tier" | "mate_allowed_tier"; // eval_delta: the ladder value crossed; mate arms: the §3 tier, whose cp bounds sit in before/after
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

One sentence of F1 §4.3 prose must be named rather than stepped around: its law-8
corollary says derivation "may count, difference, rank or **threshold** [inputs]
deterministically; it cannot add grounding, **grade a move**, or introduce a strategic
claim no input carries." A move-quality grade is exactly a deterministic threshold, and
the clause's target is manufactured judgement, not cited convention — but the words
collide, and F1 is archived and immutable. The governing interpretation is the *later,
accepted* `learner-modules` §5 ruling (grades are a derived projection), which this RFC
implements with the two mechanisms that keep the clause's intent true: `exactness:
convention` (the class boundary never claims measurement status) and §6's mandatory
co-render (the word never travels without the numbers and the convention version). The
compiler-enforced surface of §4.3 — inputs, grounding, exactness, answerContent,
abstention — is satisfied without exception.

The refusal is also the right disclosure economics: a grade **narrows** (a word plus numbers), a
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
> Wait, an 18.2-point drop crosses the 15-point blunder rung — see fixture F-COR-2."

*(The example above is itself a negative fixture: a renderer whose word disagrees with
its own printed threshold arithmetic must be constructible in tests and must fail.)*

A word-only rendering is a red fixture forever (F-COR-1). The seam is F1's: sentences
exist only as the registered renderer's output over an admitted item's payload inside a
branded `RenderedEvidenceView`; a forged grade sentence fails
`EVIDENCE_GENERIC_BYPASS`.

**The voice layer needs one word, not zero — corrected at cross-review against the
shipped list**: `voiceCheck`'s `absentWords` (voice.ts:107, applied :116) bans a
`BANNED_JUDGEMENTS` word only when it is absent from the admitted packet's sentences,
and once the deterministic co-rendered sentence is in the packet the LLM may re-voice
"mistake" but never escalate — "blunder" over a packet that graded "inaccuracy" is a
`judgement:` violation and falls back to deterministic rendering. The co-rendered
sentence *is* the allow-list entry. **But the shipped list (voice.ts:93-97) contains
"mistake" and "blunder" and not "inaccuracy"** — and `\baccurate\b` does not match
inside "inaccurate" — so at HEAD the LLM *could* introduce "inaccuracy" over an
ungraded move with no violation. The implementation adds `"inaccuracy"` and
`"inaccurate"` to `BANNED_JUDGEMENTS` (one line, closing the gap for every consumer,
grade or not), and F-COR-2 gains the arm: LLM output saying "inaccuracy" over a packet
with no grade sentence yields a `judgement:inaccuracy` violation. The draft's
"zero voice-layer changes" claim was measured against the guard's mechanics and missed
the vocabulary; proposed ledger row below records the gap.

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

None from the intent tier. The load-bearing rulings — grades-are-a-projection
(learner-modules §5), co-rendering (§4a-layer-2), post-commit/review timing (disclosure
model), praise-class refusal, R15, law 8 — are implemented, not deviated from. The one
place this RFC chooses where design is silent is the drill-context ladder values (open
question 1). **One research dossier is knowingly contradicted:** this RFC's report-ladder
and mate-table constants diverge from `assistance-surface-taxonomy.md` §2b/§2d-1 because
the dossier's normalization gloss is refuted at the verbatim source (§1, §3); the erratum
is proposed as ledger row D939, and the divergence is deliberate, visible, and cited —
not silent.

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
2. **Convention table cited** (unit: constant record; total 12 — 6 ladder thresholds +
   the 4 mate-tier constants (±700, ±999) + the ±1000 clamp + the logistic coefficient):
   every record carries all three of `{ value, source, pinnedAt }` non-empty; this check
   is a **test to be built beside the table** (part of this RFC's implementation, not an
   existing linter), and it fails on a record missing any field (negative fixture: one
   uncited constant).
3. **Ladder boundary pairs** (unit: fixture; total 13 — 3 classes × 2 sides × 2 ladders,
   plus the clamp-class pair), each pinning Win% to two decimals. Report ladder
   (5/10/15), from cp 0 (50.00%): →−54 = drop 4.95, **no emission** / →−55 = 5.05,
   inaccuracy; →−110 = 9.99, inaccuracy / →−111 = 10.08, mistake; →−168 = 14.99,
   mistake / →−169 = 15.07, blunder. Practice ladder (2.5/6/14): →−27 = 2.48, nothing /
   →−28 = 2.58, inaccuracy; →−65 = 5.96, inaccuracy / →−66 = 6.05, mistake; →−156 =
   13.98, mistake / →−157 = 14.06, blunder. F-CLAMP-2 (§1): +3000 → +530 = clamped drop
   9.98, **inaccuracy** — an unclamped-input implementation reads 12.44 and misgrades it
   mistake. Failure mode: a wrong coefficient, clamp, normalization (×50 vs ×100 — the
   exact error this cross-review found in the draft), or comparison direction flips at
   least one pair.
4. **Single-convention fixture** (F-CTX; D1422/§4a amendment, unaccepted): identical admitted
   operands/mover/instrument yield byte-identical complete grade@2 payload and full registered
   deterministic grade sentence across drill, review and imported_analysis. Actual authenticated
   source/factory/renderer positives must include 0→−28, 0→−66 and 0→−157; predecessor behavior
   fails. Do not erase a context field only in the comparator, count missing/withheld grades as
   equal positives or equate workflow-specific permission/receipt/selection bytes. §4a specifies
   the current context-free payload and required tests; original convention@1 history is retained.
5. **Mate arm** (unit: fixture; total 9, one per §3 tier plus the negatives):
   `mate_lost` tiers — #2 → +1100 (clamps to +1000 > +999): **inaccuracy**; F-MATE-LOST
   (#2 → +800: **mistake**, sentence carries "#2", 95.01% and the +7.00..+9.99 tier);
   #3 → +200: **blunder**. F-MATE-LOST-M (#2 → opponent #4: **blunder** — the
   mate-to-countermate cell the draft omitted). `mate_allowed` tiers — F-MATE-ALLOWED
   (0 cp → opponent #3: **blunder**, before-cp ≥ −700 cited); −800 → opponent #2:
   **mistake**; −1200 → opponent #2: **inaccuracy** (an allowed mate always grades —
   the source property the drafted fallback would have violated). F-MATE-DELAYED
   (#2 → #5: **no emission**). F-MATE-NEG — the permanent hard negative: the grade path
   imports no `STORY_MATE_CP` and no mate→cp coercion (asserted structurally), and the
   fixture text documents the misgrade coercion would produce (97.54 → 95.01, drop
   2.54 — a missed forced mate graded as nothing in review and a borderline
   "inaccuracy" in drill).
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
   contexts produce byte-identical `MoveQualityGrade` payloads and sentences. **What
   varies, so the fixture can actually fail:** `moveQualityGrade`'s signature carries no
   rating, so a fixture calling only the pure function is vacuous by construction; F-R15
   instead drives the packet path (admission → selection → render) with a learner
   profile/rating present in scope, where a future "personalize the wording" change
   *could* reach the grade — that seam exists only once learner-modules' registry lands,
   so until then F-R15 runs over the pure path plus a structural assertion (no
   rating-typed import in `grade.ts`) and is recorded as **partially deferred, not
   passed** (criterion 11's own discipline). Failure mode: any rating operand reaching
   the computation or the sentence.
9. **Co-render** (unit: fixture; total 3): the deterministic sentence contains word +
   both numbers (or mate distance) + drop + threshold + `grade-convention@1/<context>`
   (F-COR-0); F-COR-1 — a word-only sentence fails the renderer contract, permanently
   red-by-design; F-COR-2 — the `voiceCheck` arms: LLM output saying "blunder" over a
   packet whose sentence graded "inaccuracy" yields a `judgement:blunder` violation
   while re-voicing "inaccuracy" passes, and — with §6's one-word `BANNED_JUDGEMENTS`
   addition in place — "inaccuracy" over a packet with no grade sentence yields
   `judgement:inaccuracy` (red at HEAD in both directions: the first arm for want of a
   grade path, the second for want of the vocabulary entry).
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
| D1 | Consumer-edge compilation: the two ◇ declared-awaiting rows (`module.postcommit_nudge`, `module.review_map`) bind `derived.grade.move_quality@1` and this projection's `experimental` disposition lifts — learner-modules' registry landing is the edge; until it lands the projection is manifest-registered with no production consumer and this RFC cannot archive around that | `learner-modules` | the learner-modules implementation commit that compiles the registry (the same commit flips learner-modules' own D3) | ✅ `63902370` (2026-09-24): `MODULE_REGISTRY` compiles at import; the grade is bound to exactly `module.postcommit_nudge@1` and `module.review_map@1`, its disposition deleted; `reviewMapProjection` and `postcommitNudgePacket` admit it through `compileModulePacket` |

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

## Ledger rows

**D932 and D933 are landed in `design/BACKLOG.md`** (verified at cross-review,
2026-08-22; ledger head **D937**). Two of D932's claims are corrected by this
cross-review and superseded by the rows below: the drafted report ladder ("10/20/30")
and the "zero voice-layer changes" clause. **Landed as D939/D940 at acceptance — whoever cites them
re-verifies the head first, per the taxonomy's own renumbering precedent; not written
to the ledger by this review:**

- **D939 (landed)** — **The taxonomy's §2b threshold gloss ("0.1 = 10
  win-percentage points") is refuted at source, and §2d-1's "4× stricter" with it.**
  Verbatim Advice.scala: `delta` is a *raw* difference of `WinPercent.winningChances`
  values on [−1,+1] (×50 to Win%-points → report = 5/10/15), while practiceCtrl.ts's
  `povDiff` *halves* the same difference (×100 → practice = 2.5/6/14): the gloss is
  right for one file and wrong by 2× for the other, so the true strictness ratios are
  2×/1.67×/1.07×, and Advice.scala's mate table is fully three-tiered on both sides
  (±700/±999) where the taxonomy pinned three cells. Advice also feeds *unclamped* cp
  into the logistic where `fromCentiPawns`/`cpWinningChances` clamp input — Lichess's
  two paths disagree and a convention must choose. `move-quality-grades.md` carries the
  corrected constants; the dossier needs the erratum (owner/dossier pass — law 5).
- **D940 (landed)** — **`BANNED_JUDGEMENTS` (voice.ts:93-97) lacks
  "inaccuracy"/"inaccurate"** — "mistake" and "blunder" are banned but the LLM can
  introduce "inaccuracy" over any packet with no violation (`\baccurate\b` does not
  match inside "inaccurate"). One-line vocabulary addition, owned by
  `move-quality-grades`' implementation (§6), guarding every consumer.

## Changelog

- 2026-10-15 — Unaccepted D3859/D3861 §2a authors the source-owned grade@2 replacement:
  exact provider-point/ledger-reading pairs plus actual edge, private occurrence/context authority,
  explicit origin/selection/absence, all three modern/two offline bounds, truthful convention
  grounding and shared Review accuracy/graph adoption. D3851 removes predecessor compatibility
  obligations.71 disposable source controls/two execution paths establish feasibility only;
  real source/factory/API/client implementation and independent source/joint review remain.
- 2026-09-24: D1 discharged by `63902370` (module-registration implementation): the `experimental` disposition is deleted and the grade binds to exactly its two module consumers.

- 2026-08-22: created. All cited symbols verified at drafting HEAD (`906498a`):
  `evidence-catalog.ts` projection declarations (`recorded.engine.eval` ~:361,
  `live.stockfish.eval` ~:365, `derived.compare.eval_delta` ~:399,
  `derived.story.eval_shift` ~:402), `story.ts:33/:104/:106-107`,
  `evidence-queue.ts:81`, `voice.ts:12-21/:93-97/:107-110`, `compare.ts:176-177`,
  `evidence-contract.ts:3/:455-472`.
- 2026-08-22 (adversarial cross-review, buildability): **report ladder corrected
  10/20/30 → 5/10/15 Win%-points** — the taxonomy's gloss applied one normalization to
  two differently-normalized Lichess files; verified against verbatim Advice.scala +
  winningChances.ts fetches (sanity anchor: +1.00 → −1.00 is wc-drop 0.364, a Lichess
  Blunder, and was an "inaccuracy" under the drafted ladder). **Mate arm replaced by
  Advice.scala's full three-tier tables** (the drafted floor/boundary generalizations
  contradicted pinned cells: #N → +800 is Mistake, not floored Inaccuracy; an allowed
  mate always grades ≥ Inaccuracy, never "usually nothing") **and the omitted
  mate-to-countermate cell added** (`MateLost` → blunder). Clamp-before-conversion
  declared as a cell where Lichess's own paths disagree, with the class-changing
  fixture F-CLAMP-2 (+3000 → +530: 9.98 clamped vs 12.44 unclamped). "Zero voice-layer
  changes" corrected to the one-word `BANNED_JUDGEMENTS` addition (§6). F1 §4.3's
  "cannot grade a move" prose named and resolved in §5.3. F-R15's vacuity boundary
  stated (criterion 8). Motivation-table decimals fixed (11.19/27.38/24.89/25.11;
  97.54). Ledger section updated: D932/D933 landed, head D937, D938/D939 proposed.
  All arithmetic recomputed independently to 4 decimals; all symbol cites re-verified
  at review HEAD (`e52bccf`); `register-check`/`status-parity`/`intent-parity` green
  with this draft's README row.
- 2026-08-22 (implementation checkpoint): `grade-convention@1`, the pure learner-POV
  grade projection, typed mate arms, deterministic co-renderer, and experimental F1
  declaration landed. The manifest compiles at 34/184/25/207; 19 focused grade/catalogue
  fixtures and runtime typecheck pass. D1 remains deliberately blank because no production
  module declaration consumes the projection yet.
- 2026-09-01 ([[D2473]] repair): corrected the projection derivation from the false
  recorded-plus-live conjunction to two same-lane alternatives. The production grade
  function already rejects unequal lane, engine id and search limit; the catalogue regression
  now proves the manifest cannot restore the cross-lane conjunction. The module requirement
  generator consumes the alternative declaration and retains two ordered before/after
  occurrences per selected lane. D1 remains open: this repair supplies the prerequisite but
  does not invent either learner consumer.
- 2026-10-15 ([[D3860]]): enforce the accepted same-source rule at the sealed factory before
  the common payload reader erases origin, including before successful below-threshold silence.
  Correct both manifest alternatives to two ordered actual occurrences and §5's stale conjunction.
  The26 new permanent controls fail on the predecessor. No new thresholds, grade words, provider
  attestation, source-owned occurrence authority or complete-module migration is implied.
- 2026-10-15 ([[D1422]], unaccepted amendment): claim grade_convention_v2 and specify the
  already-ruled single2.5/10/15 ladder in §4a, invert criterion4 and reconcile §2a/F2/module
  source proposals. Nine current cited records replace six context-split ladder records plus
  six unchanged other constants; context stays private source authority, not public grade@2
  payload/prose. Historical convention@1 is not rewritten; no compatibility runtime required.
  Disposable arithmetic controls and independent review are not production adoption.
