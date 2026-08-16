# RFC: Dead vocabulary — the wave's rows are owned; its instrument is not

- **Status:** **accepted 2026-08-16**, after cross-review; corrections landed in the body.
  All three Open questions are explicitly non-blocking by their own text — 1 is *not claimed*
  and routed to whichever RFC next edits `dispositions.ts`, 2 is *deferred to first use* on
  [[D53]]'s free-parameter grounds, 3 is *routed* to whichever RFC next owns
  `pack-validation.ts`'s issue vocabulary (now ledgered as [[D428]]). None of them changes
  anything this RFC specifies, which is the same property §6 claims about the registers.
  The cession to `format-surface` was re-verified in the tree after that RFC landed and
  **holds, with no defect left ownerless**; the D360 refutation reproduced independently; the
  "claims nothing versioned" property survived three register facts moving underneath it. Four
  specification defects in the census design were found and fixed in place (§3a's join key,
  §3b's producer forms and the refusal-emitter column, §3b's excluded set). See the changelog.
- **Author:** claude
- **Created:** 2026-08-16
- **Design refs:** none authored. `design/05-in-run-experience.md` §3 (the assistance ladder)
  and `design/04-content-architecture.md` §4 (the convert/hold/save variants rule) are cited
  descriptively only; this RFC proposes no design-tier change and no design-tier reading.
- **Exploration gate:** none needed. Every row below is a ledgered defect with first-hand
  code evidence, not a GAP row (law 1, second clause). The one thing this RFC *claims* is an
  explicit hand-off from an **implemented** RFC: `rfc/archive/format-surface.md` Open question 1,
  which names its successor and declines to be it — *"Recommended owner: a follow-up that extends
  the census tool."*
- **Depends on:** `rfc/archive/format-surface.md` (**accepted 2026-08-16, implemented and
  archived the same day** — it owns all four of cluster E's open rows; this RFC cedes them and
  takes its Open question 1),
  `rfc/archive/expression-census.md` (the shipped instrument this extends, and the
  two-measurement discipline it must not break), `rfc/archive/defect-sweep.md` §2 (the
  declared-vs-executable law, applied and not amended),
  `rfc/archive/engine-request-contract.md` §3 (the *record* obligation, for D57's direction),
  `rfc/archive/predicate-wave-3.md` (the deprecation-warning-first retirement precedent),
  `rfc/archive/validator-integrity.md` §8a/§8b (the law's two most recent shipped uses — and
  the RFC that closed cluster E's D39 and D40 on 2026-08-15)
- **Parent / amends:** **none.** This RFC amends nothing. Where it disagrees with a
  `design/BACKLOG.md` row it says so and proposes the correction rather than making it.
- **Supersedes / superseded by:** —
- **Planning:** `planning/dead-vocabulary/` (once implementing)

> **Locate by symbol, not by line.** Every symbol name below was verified first-hand against
> the working tree, and every fact re-checked at cross-review was checked against **committed
> `532c7e2`** rather than the checkout, because the checkout carries `opponent-contracts`
> mid-implementation and one register fact differs between them (§6, migration row). Line
> numbers are advisory and are marked as such. Every count here was
> **re-derived**, not copied from a dossier or a sibling RFC — including the three that
> independently reproduce `format-surface`'s figures, which is stated because agreement
> between two measurements is evidence and agreement between a measurement and a quotation is
> not.
>
> **Two measurement epochs, and they are kept apart deliberately.** The draft was written
> against `acebb91` (`board-annotation`), after `caa8afa` (`vocabulary-wiring`) landed
> mid-writing. **Cross-review re-derived every count at `532c7e2`**, by which point
> `format-surface` had been implemented and archived. Where a figure moved, both epochs are
> given and labelled; where a figure is stated bare it holds at `532c7e2`. A count whose
> commit is not named is a count that expires silently, which is [[D250]]'s subject —
> *"A draft that writes a shared monotonic integer into its body has written a claim with an
> expiry date"* — applied to measurements rather than to version constants.
>
> **The mid-draft movement is itself a finding and is not smoothed over.** `board-annotation`
> landed legs (a) and (b) of the owner's three-way `arrows` split — learner-drawn and relayed
> marks — at `acebb91`, touching neither `packages/runtime/src/assistance.ts` nor
> `apps/web/src/lib/AssistanceSettings.svelte`, exactly as `format-surface` §3.1 scoped it.
> Leg (c) is untouched at `532c7e2`. §2 records the landing rather than the pending state it
> was drafted against.

## Summary

Cluster E was routed in `planning/work-register.md` §2 as *"the last undrafted RFC wave"*.
It is not undrafted. **All four of its open defects — D84, D85, D86, D57 — are owned,
disposed, cross-reviewed and owner-ruled by `rfc/archive/format-surface.md`, accepted
2026-08-16 and implemented the same day**, and its other three members (D39, D40, D59) closed
in code on 2026-08-15 (D39/D40 by `validator-integrity` §8a/§8b, D59 at `43c6c4a` under
`engine-request-contract`; all three verified `✅` in the ledger). A second RFC over
those rows would be the coordination bug the wave brief itself warns against, so this RFC
**claims none of them** and **claims nothing versioned**: no pack-schema lane, no run-schema
version, no migration, no storage position. §6 states that loudly, because it is the better
outcome and not an accident.

What this RFC takes is the one part of cluster E's subject that `format-surface` named and
explicitly declined. That RFC installs `FORMAT_DISPOSITIONS`, a register with a gate that
keeps the rows **honest**; its own §2 clause 5 concedes the gate cannot make them
**complete**, and its Open question 1 concedes that completeness is therefore *"exactly as
good as the last hand-audit"*. This RFC specifies the successor it recommends: extending
`make expression-census` from *"where does this expression fire?"* to *"which declaration
has no consumer?"* — report-only, no gate, on the same two-measurement discipline that
instrument already ships.

Two first-hand measurements motivate it, one in each direction that a hand-audit fails:

- **A true positive found years of dossiers late.** `SIMULATE_BUDGET_EXCEEDED` was **1 of 63**
  members of the `ServerErrorCode` union with no producer anywhere in the tree (measured at
  `acebb91`; `format-surface` has since retired it, and at `532c7e2` the union is 63 again with
  **no** zero-producer member). One line of mechanical enumeration separated it from the other
  62; it took a campaign-effect research dossier to notice.
- **A false positive that a hand-read produced and shipped into the ledger.** The row
  *"`clock_zeroed` renders a shipped sentence the detector never emits"* (D360) is
  **refuted**: `clock_zeroed` fires **265 of 771** committed spine transitions — unchanged
  between `acebb91` and `532c7e2` — making it the *most frequent* `move_irreversibility`
  observation in the corpus, more frequent than `pawn_break` (60), `castled` (20) and
  `last_of_role` (22) combined. The row measured `irreversibility()`, which is not that
  subkind's producer.

## Motivation

### 1. What cluster E turned out to be

The wave brief describes four open defects and asks which direction of the
declared-vs-executable law each violates. Both halves of that question are already answered
in an accepted document, and the answers were verified here rather than trusted — twice, at
two commits, by two readers.

**And the answer is no longer merely accepted — it has landed, and the cession was
re-verified against the tree rather than against that RFC's text.** When this draft was
written, `format-surface`'s dead-vocabulary half was still pending: at `acebb91` there was no
`packages/schema/src/drill-pack/dispositions.ts`, no `RETRY_VARIANTS_NOT_EXECUTABLE`, the
`SIMULATE_BUDGET_EXCEEDED` union member was still present with no producer, and the vacuity
conjunct in `OpponentSelector#practicalResistance` was unchanged. **All four have since
shipped.** Cross-review checked each disposition in code, not in prose, because a cession to a
disposition that was specified and then dropped in implementation leaves the defect
*ownerless* — which is exactly [[D400]], *"Three landed RFCs left ~19 defects in an unknown
state"*, and is the one way this RFC's central move could fail silently:

| Row | Disposition ceded to `format-surface` | Verified in the tree at `532c7e2` |
|---|---|---|
| **D84** | `unmeasured`, field survives | `dispositions.ts` row `assistance:arrows`, `disposition: "unmeasured"`, with the directed-primitive experiment named. `AssistanceConfig.arrows` and the `<select>` both still present |
| **D85** | `retire` | `dispositions.ts` row `error:SIMULATE_BUDGET_EXCEEDED`, `retired`, `removedAt: "0.25"`; the union member is **gone** from `apps/server/src/errors.ts` |
| **D86** | `refused` via a warning | `dispositions.ts` row `/retryVariants`, `refused`, `successor: "variantOf"`; the warning is emitted at `apps/server/src/pack-validation.ts` (advisory `:1015-1021` in committed `532c7e2`) |
| **D57** | `implement` | The conjunct is gone. `measured` now *filters*, `PRACTICAL_RESISTANCE_UNMEASURED` (a new union member) covers total abstention, `PRACTICAL_RESISTANCE_UNDECIDABLE` covers all-zero, and `localeCompare` survives only as the equal-ratio tiebreak |

**The cession therefore holds and leaves nothing ownerless.** All four ledger rows read `✅
closed 2026-08-16 by format-surface` except D84, which correctly stays `💡 open` because
`unmeasured` is not a closure. That is the register working, not a gap.

| Row (ledger title, abbreviated) | Direction of the law | Owner | That RFC's disposition |
|---|---|---|---|
| **D84** *"`arrows` is a fully-plumbed no-op"* | **declared-but-not-executed** — with an owner-ruled deficit underneath it | `format-surface` §3.1 | **`unmeasured`, NOT retired.** The field survives, the `<select>` stays, the disposition records the gap and carries a revisit obligation |
| **D85** *"`SIMULATE_BUDGET_EXCEEDED` is declared and never thrown"* | **declared-but-not-executed**, running backwards — the declaration *is* a refusal, so the law's remedy clause is vacuous and only its principle applies | `format-surface` §3.2 | **retire** |
| **D86** *"`retryVariants` has no runtime effect"* | **declared-but-not-executed** | `format-surface` §3.3 | **`refused`** now via a `RETRY_VARIANTS_NOT_EXECUTABLE` warning, **`retired`** when `variantOf` becomes a superset |
| **D57** *"The vacuity gate can be skipped…"* | **neither** — it is not a declared-vs-executable case at all. The mode is published, selectable and executed; the defect is in the *record* | `format-surface` §3.5 | **implement** |

Two things in that table are worth stating rather than assuming, because the wave brief
frames all four as instances of one law and one of them is not.

**D57 is not a member of the family.** `practical_resistance` is declared, published, and
genuinely executed. What fails is `engine-request-contract` §3's *record* obligation —
*every value **actually applied** and the answer **actually taken** appear in the persisted
record* — because the selection that got stamped `practical_resistance` was made by
`left.move.uci.localeCompare(right.move.uci)`. Verified first-hand at `acebb91` in
`OpponentSelector#practicalResistance` (`apps/server/src/opponent-selector.ts`, advisory
`:712-719`): the vacuity refusal was guarded by `measured.length === scored.length`, so a
**single** unmeasured candidate disabled it, and the surviving comparator's first term was
`0` for every pair when all ratios were zero. Filing D57 under declared-vs-executable would
have produced the wrong remedy — a refusal on the *mode*, when the mode is fine. **Fixed at
`532c7e2`** by `format-surface` §3.5, exactly as the direction column predicted: the remedy
landed in the record, not on the mode.

**D84's direction inverts once the owner ruling is applied.** As a pure code fact it is
excess: nine plumbed lines with zero readers. The owner ruled it is three things sharing one
field name — learner-drawn marks (outside the ladder), host-relayed marks (attribution), and
system-drawn marks (this axis) — and only the third is a format concern. Under that reading
the surviving axis is a **deficit**: `design/05` promises arrows-for-sight and the structural
reader has no directed primitive to draw one from, because `structuralReading` emits square
*sets*. That is why `format-surface` may not retire it, and why this RFC must not either.

### 2. The four rows, as this draft measured them and as they stand now

The wave brief asks for verification against the current tree because the tree has moved. It
has — twice, and the second time it moved *through* these rows. Each finding below is stated
as it was measured at `acebb91` and then as it stands at `532c7e2`. **Every finding was
correct when made; three of the four have since been discharged by the RFC that owns them,**
which is what a cession is supposed to look like.

- **`arrows`.** `AssistanceConfig.arrows: "off" | "sight" | "evidence"`
  (`packages/runtime/src/assistance.ts`), defaulted in `SILENT_ASSISTANCE`, permissioned in
  `permittedAssistance` as `mayRequestSplit ? "evidence" : "sight"`, and carried across three
  localStorage upgrade arms in `apps/web/src/lib/assistance-preference.ts`. Its only
  non-plumbing occurrence remains the `<select>` in `AssistanceSettings.svelte`. The board
  overlay input `boardOverlays` in `DrillScreen.svelte` (advisory `:346`) derives from
  `boardLighting` and emits `{orig, brush}` with no `dest`, and chessground draws an arrow
  only when `dest` is present. **Zero renderers, at both epochs.** Confirmed independently of
  `format-surface`'s count. This is the one row of the four that is still open.
- **`SIMULATE_BUDGET_EXCEEDED`.** At `acebb91`: declared in the `ServerErrorCode` union
  (`apps/server/src/errors.ts`) and mapped to HTTP 422 in `rest.ts`'s status ladder, while the
  only refusal `Service.simulate` raises is `SIMULATE_TOO_LARGE` — a shape cap on
  `maxBranches`/`maxPlies`, not a budget. New here, and the measurement §4 turns into the
  instrument's motivating case: enumerating all **63** union members against the tree,
  `SIMULATE_BUDGET_EXCEEDED` was **the only one with no producer**. **At `532c7e2` the member
  is removed** and the union is 63 again — `PRACTICAL_RESISTANCE_UNMEASURED` took the vacated
  slot as part of the D57 fix, which is a coincidence of arithmetic and is named so no reader
  mistakes the unchanged total for an unchanged union.
- **`retryVariants`.** Declared at `schemas/drill_pack.schema.json` `properties.retryVariants`
  and on `DrillPackDocument` (`packages/schema/src/drill-pack/types.ts`), item shape
  `{kind, note?}` with a closed five-member `kind` enum and **no referent field**. At
  `acebb91` its only sites were `apps/server/src/pack-check.ts` (a *counter*, not a consumer —
  it increments a census tally), `packages/schema/src/drill-pack.test.ts` (enum shape), and
  `apps/server/src/vocabulary-wiring.test.ts` (a vocabulary list): **zero runtime sites**.
  Corpus re-derived here across all of `content/` plus `schemas/drill_pack.example.json`: **8
  documents, 11 entries**, distributed `different_material_details` 5,
  `related_position_same_idea` 2, `opposite_side` 2, `same_root_new_defense` 1,
  `alternate_plan_class` 1 — reproducing `format-surface` §3.3 exactly, by a second
  measurement, and **unchanged at `532c7e2`**.

  **At `532c7e2` it has exactly one runtime site, and it is a refusal** —
  `pack-validation.ts` (advisory `:1015-1021` in committed `532c7e2`) emitting `RETRY_VARIANTS_NOT_EXECUTABLE` per
  entry. **That is a design input for §3b, not a footnote.** A consumer count that treats a
  refusal emitter as a consumer would now read `retryVariants` as *healthy* — one producer
  (the author), one consumer (the validator) — purely because it was refused. Every `refused`
  row in `FORMAT_DISPOSITIONS` will acquire the same self-healing shape as its warning lands.
  §3b constraint 4 exists to stop that.
- **`practical_resistance` vacuity.** Quoted above; the conjunct was present at `acebb91` and
  is **gone at `532c7e2`**.

### 3. One measurement that has moved since `format-surface` was cross-reviewed

That RFC's §3.3 records *"`variantOf` has **zero** users in `content/`"*. **It now has two**,
and both are the packs that make the point sharpest:

| Pack | `variantOf` | `retryVariants` kinds it still carries |
|---|---|---|
| `content/drafts/philidor-passive-rook-convert.json` | `{packId: "philidor-third-rank-hold", relation: {kind: "root_after_move", moveUci: "h6h8"}}` | `opposite_side` |
| `content/drafts/trajectory-mate-bishop-knight.json` | `{packId: "mate-bishop-knight", relation: {kind: "same_root_other_objective"}}` | `different_material_details`, `related_position_same_idea` |

Both files are committed. This **strengthens** `format-surface`'s disposition rather than
disturbing it, and it replaces an argument with an authored fact: the two packs that adopted
the executable successor **kept** `retryVariants` anyway, and one of them keeps **two**
entries beside a `variantOf` that is a single object. The array gap is no longer inferred
from note-parsing; it is demonstrated by a pack that had every reason to migrate and could
not. §2 routes this to the RFC that owns the widening; it does not act on it.

### 4. Why the deliverable is an instrument, and the two measurements that prove it

`format-surface` §2's gate is deliberately, correctly incomplete. Its clause 5 reads:

> Does **not** attempt to prove reachedness by static analysis; that is undecidable in
> general and a test that pretends otherwise is worse than none. The register is
> author-maintained; the test keeps it *honest*, not *complete*.

That is the right call for a gate. It leaves **discovery** unowned, and its Open question 1
says so and names the successor. Discovery is currently a human reading two files in the
same hour, and the wave brief's own framing — *"every one has been found by a different
sweep"* — is that failure stated as a schedule. Below are two first-hand demonstrations that
the hand method fails in **both** directions, which is what makes this an instrument problem
rather than a diligence problem.

#### 4a. The false negative: 1 of 63 — and six ways to get it wrong

Enumerating the `ServerErrorCode` union and counting producer sites across `apps/` and
`packages/` (excluding `dist/`, tests and fixtures) gave, at `acebb91`, 63 members of which
exactly one — `SIMULATE_BUDGET_EXCEEDED` — is constructed nowhere. The distance between
"declared" and "declared and unproducible" is one enumeration. It was instead found by
`design/research/campaign-effect-vocabulary.md`, while that dossier was looking for something
else entirely, and it had been shipping to clients as a documented 422 the whole time.

**The enumeration is only as good as its notion of "producer", and cross-review proved that
by getting it wrong on purpose.** A deliberately naive classifier — one that matches a string
literal in the *first argument position* of a `ServerError` construction — was run over
`532c7e2` and reported **three** zero-producer codes. All three are false positives, and they
fail for **two distinct reasons**, neither of which is the one this draft originally named:

| Code | Naive verdict | Actual producer | Why the classifier missed it |
|---|---|---|---|
| `PERFECT_TABLEBASE_OUT_OF_RANGE` | producerless | `pack-validation.ts` (advisory `:1002`, committed) | Produced by `runtimeIssue(...)`, not by a `ServerError` construction — a **different constructor** |
| `PRACTICAL_RESISTANCE_OUT_OF_RANGE` | producerless | `pack-validation.ts` (advisory `:1005`, committed) | Same |
| `REPERTOIRE_IMPORT_LIMIT` | producerless | `repertoire.ts` (advisory `:69`) | `new ServerError(error.kind === "invalid" ? "IMPORT_INVALID_PGN" : "REPERTOIRE_IMPORT_LIMIT", …)` — the literal is in argument position but **inside a conditional expression**, so it is not the argument node |

Add the three codes this draft already named — `VOICE_UNAVAILABLE`, `TTS_UNAVAILABLE` and
`CORPUS_UNAVAILABLE`, each thrown inside `rest.ts` (advisory `:1110`, `:1162`, `:1187`,
`:1212`, committed), the same module that maps codes to HTTP statuses at advisory `:521` — and a naive
census has **six** ways to be wrong on one namespace of 63. Three fail on *where* the site is,
three on *what shape* it is. That distribution is the whole argument for specifying the
classifier in §3b rather than leaving it to a grep, and it is why criterion 5 tests the
misclassifications rather than the headline.

#### 4b. The false positive: a refuted ledger row

The ledger row *"`clock_zeroed` renders a shipped sentence the detector never emits — the
only clock-named renderable string in the product is dead code"* (D360, found 2026-08-16)
carries a `[V]` label and a measurement: *"Measured over **721 spine transitions**:
`pawn_break` 52, `castled` 20, `last_of_role` 21, **`clock_zeroed` 0**."*

**It is wrong, and the reason is instructive.** Replaying every authored spine tree in
`content/drafts` and `content/packs` from each document's `start.fen` through chessops and
evaluating both functions over every played edge:

| Function | Population | edges | `clock_zeroed` | `pawn_break` | `castled` | `last_of_role` |
|---|---|---|---|---|---|---|
| `transitionReading(...)` | committed corpus at `acebb91` **and re-run at `532c7e2`** | 771 | **265** | 60 | 20 | 22 |
| `irreversibility(...)` | committed corpus at `acebb91` **and re-run at `532c7e2`** | 771 | **0** | 60 | 20 | 22 |
| `transitionReading(...)` | the corpus D360 measured (`790a4de`, three fewer drafts) | 738 | **245** | 52 | 20 | 22 |
| `irreversibility(...)` | the corpus D360 measured (`790a4de`) | 738 | **0** | 52 | 20 | 22 |

The top two rows were **independently re-derived at cross-review** by a second harness walking
`content/` from each document's `start.fen`, and returned the same four integers over the same
771 edges (56 spine-bearing documents). Two harnesses, two authors, one result.

The bottom row reproduces D360's numbers almost exactly — its `pawn_break` 52 and `castled`
20 land on the nose, `last_of_role` 22 against its 21 — which identifies what the row
measured: `irreversibility()`, whose `IrreversibilityDetail` union has three members and
structurally cannot return `clock_zeroed`. But `irreversibility()` is **not that subkind's
producer**. `transitionReading` emits `clock_zeroed` in its own branch immediately after the
`irreversibility()` call (advisory `:360`), and `matchesTransitionFeature` evaluates the
subkind in its own branch too (advisory `:309`) — both in
`packages/runtime/src/transition.ts`. The sentence at
`apps/web/src/lib/transition-sentences.ts` is reached through `renderTransitionObservation`,
imported by `DrillScreen.svelte` and rendered per observation in the template (advisory
`:868`) from the reading built at advisory `:338`. **The string is not dead code; it is the
most-shown irreversibility sentence in the product.**

The edge total is the cross-check: `make expression-census` independently reports
`corpus.transitions: 771` for the same tree, from its own walker. Two instruments walking the
same corpus by different routes agreeing on the denominator is what makes the numerator
trustworthy — and the 738-edge rows are the same measurement over the corpus as it stood
when D360 was written, which is how the misidentified function was isolated rather than
guessed at.

This is the repo's own rule biting the hand that wrote it — *"fires nowhere" is a **coverage
fact**, "cannot fire" is a **bug***, the distinction `docs/expression-census.md` states as
*"Coverage: where the expression fires in the current corpus. Zero is a fact, never an
error"*. **Only the second justifies a refusal, and D360 asserted the second about something
that fires 245 times over the corpus it measured**, because it read one plausible function and
stopped. A row that says *"either delete the subkind and its sentence, or emit it"* would, if
actioned, have deleted a live renderer. That asymmetry is load-bearing for §3b: a census that
reports the two as one number would license exactly the remedy that would have done the
damage.

### 5. Scope boundary — what this RFC is not

- **Not a second pass over D84/D85/D86/D57.** §1 cedes them. This RFC proposes no change to
  any of `format-surface`'s dispositions and no change to `FORMAT_DISPOSITIONS`' shape, gate
  or publication site.
- **Not a gate.** The census is report-only and stays out of `make verify`, exactly as
  `expression-census` §7d ruled for its predecessor. A discovery instrument that can fail CI
  turns every unfinished construct into a build break and the next author into someone who
  deletes vocabulary to go green.
- **Not a budget, a renderer, or a `variantOf` widening.** Each of those is a product or
  format decision with a named owner (§2). Inventing product from a defect row is the
  failure `format-surface` §3.2 refused by name, and it is refused here too.
- **Not static reachability analysis.** The instrument reports **producers and consumers by
  enumeration over declarations it can name**, plus corpus firing where the vocabulary has a
  corpus. It never claims a declaration is unreachable; §3b is the constraint that keeps it
  honest.

## Specification

### 1. What this RFC cedes, and to whom

Normative, so that no later reader re-derives it: **`rfc/dead-vocabulary.md` claims no
disposition over D84, D85, D86 or D57.** Their owner is `rfc/archive/format-surface.md`, and
**all four dispositions are shipped and verified in the tree** (Motivation §1's table). The
cession therefore transfers nothing that has not already been discharged; there is no
ownerless residue.

**The one contingency this section exists for is now moot, and is kept because a reader will
ask.** As drafted, the clause read: if `format-surface` is withdrawn or its dispositions are
reopened, the rows return to `planning/work-register.md` §2 cluster E unowned and this RFC
does not inherit them. That RFC is archived and, under `rfc/0000-rfc-process.md`, archived
RFCs are immutable — so the withdrawal branch cannot be taken. **A reopening of any of the
four is a new RFC against the shipped code, not a claim on this one.**

Three consequences that an implementer must not read past:

1. **`arrows` is not retired here.** The `<select>` in `AssistanceSettings.svelte` stays, the
   `AssistanceConfig.arrows` field stays, and `assistance-preference.ts` gains no version-5
   arm from this RFC. Its `unmeasured` row and revisit obligation are `format-surface`'s.
   This is the only one of the four still `💡 open` in the ledger, and correctly so.
2. **`SIMULATE_BUDGET_EXCEEDED` is not removed here** — `format-surface` §3.2 removed it, at
   `removedAt: "0.25"`. §4a measures the state that motivated the retirement; §3 makes the
   next one findable without a dossier.
3. **D57 is not implemented here**, and it is not a declared-vs-executable defect. Motivation
   §1's table states its direction for the record because the wave brief asked; the fix is
   `format-surface` §3.5's and has landed.

### 2. The residuals `format-surface` named and declined — routed, not taken

Three items sit inside cluster E's subject and outside that RFC's dispositions. Each already
has a destination; this section writes the destination down so the wave can close without
any of them becoming "a later wave", which `rfc/vocabulary-wiring.md`'s Open question 9
correctly names as a non-destination — *"'a later wave' is not a destination. **Needs either a
work-register cluster or an owner-gated row**"* — enforcing there the warning its own §5c makes
about items lost between waves.

| Residual | Where it comes from | Destination | Why not here |
|---|---|---|---|
| **The eight unconditionally-free meterable operations** (the second half of D85's row) | `format-surface` §3.2, *"Explicitly not disposed"* | **Owner-gated**, campaign economy. It belongs beside `planning/work-register.md` §3's deck/loadout question | Nothing declares those operations budgeted, so there is no declaration to be in excess of. They are not a declared-vs-executable defect and this RFC has no pointer for them |
| **D86 stage two** — the `refused` → `retired` flip, needing a `variantOf` that is an array with relations for `different_material_details` and `related_position_same_idea` | `format-surface` Open question 4, *"unowned as of this draft"* | **`planning/work-register.md` §4a**, the authoring-expressiveness cluster, which already holds **D105** and whose row states the closure *"needs the `variantOf` array widening (that RFC's Open question 4)"* | §4a's entry condition is a measured count of authored uses per member. §2 of the Motivation supplies exactly that for this member — 2 adopters, 3 retained entries `variantOf` cannot express — so the cluster gains evidence, not another undated deferral |
| **D84's revisit obligation** — the `unmeasured` row expires when a directed structural primitive exists | `format-surface` §3.1 and Open question 2 | Legs (a) and (b) → **landed at `acebb91`** (`feat: add learner board annotation`), which touched neither `assistance.ts` nor `AssistanceSettings.svelte`. Leg (c)'s revisit → whichever RFC lands a directed structural primitive | Two thirds of the owner's split now ship and leg (c) is unchanged, which confirms `format-surface` §3.1's scoping empirically. Implementing leg (c) means inventing a directed structural primitive — a design-tier change (law 5) |

**The retirement precedent, and where it applies.** `rfc/archive/predicate-wave-3.md` retired
`pawn_count` and `piece_reach_count scope:"every"` as **deprecation warnings first, with
schema removal deferred a wave**, because `registered_shapes` rows are immutable. Tested
against each of the four:

- **D86 — applies, and `format-surface` followed it**, citing
  `PIECE_REACH_SCOPE_EVERY_DEPRECATED` and `PAWN_COUNT_DEPRECATED` by name and emitting
  `RETRY_VARIANTS_NOT_EXECUTABLE` as a `runtimeWarning` rather than an error precisely so the
  seven authored packs do not go red (7 packs / 9 entries in `content/`; 8 documents / 11
  entries once `schemas/drill_pack.example.json` is counted). **Verified shipped** at
  `pack-validation.ts`
  (advisory `:1015-1021` in committed `532c7e2`) with `severity: "warning"`. Stage two is §4a's, above.
- **D85 — does not apply, and the removal it authorised has since executed.** The precedent
  protects *authored content that already declares the construct*. No pack, ledger or run
  record can contain a `ServerErrorCode`; the only consumer of the declaration was a client's
  422 handling, and a refusal that cannot fire has no authored population to warn. Removal is
  not a corpus edit — and at `532c7e2` the union member and its HTTP arm are gone with no
  deprecation wave, which is the precedent's boundary demonstrated rather than argued.
- **D84 — does not apply, because nothing is being removed.** `unmeasured` is not a
  retirement path.
- **D57 — does not apply.** Nothing is declared in excess; the record is wrong.

### 3. The declaration census

An extension of the shipped `make expression-census`
(`apps/server/src/expression-census.ts`, `docs/expression-census.md`), not a new tool. It
answers `format-surface` Open question 1's question — *"which schema pointers have no
consumer?"* — generalised past schema pointers to every declaration namespace
`FORMAT_DISPOSITIONS` can address.

#### 3a. Subjects — the declaration namespaces

The census enumerates declarations from **live sources only**; no namespace may be defined by
a hand-written list, because a hand-written list of what exists is the thing being replaced.
The four namespaces are exactly the three `FORMAT_DISPOSITIONS` addresses plus the one whose
absence produced D360:

| Namespace | Enumerated from | Subject identity |
|---|---|---|
| `schema:` | `schemas/drill_pack.schema.json`, walked for every leaf property pointer and every closed-`enum` member — the same walk `format-surface` §2's gate clause 1 specifies, reused rather than reimplemented | `(pointer, value?)` |
| `error:` | the `ServerErrorCode` union in `apps/server/src/errors.ts` | the code |
| `assistance:` | the key set of `AssistanceConfig` in `packages/runtime/src/assistance.ts`, and each axis's declared value union | `(axis, value?)` |
| `runtime:` | the exported symbols of `packages/runtime/src/index.ts` that name a *reading* or *observation* producer, and the closed subkind unions those producers can emit (`IrreversibilityDetail`, `TransitionObservation`, and the `TRANSITION_FEATURE_KINDS` constant) | `(symbol, subkind?)` |

The `runtime:` namespace is the one `FORMAT_DISPOSITIONS` does not address and the one D360
lives in. It is included because the defect the wave is named for — a declared value with no
producer — occurs in the runtime's own observation vocabulary exactly as it occurs in the
pack schema, and because §4b shows the hand method is *least* reliable there: a subkind may
have two producers in one file and a reader who finds one of them concludes it has none.

> **`schema:` is a census-local label and does NOT appear in `FORMAT_DISPOSITIONS`' keys.**
> Verified in `packages/schema/src/drill-pack/dispositions.ts`: schema rows are keyed by a
> **bare** JSON Pointer (`/retryVariants`, `/opponentPolicy/mode`, `/legs/*/shapes`), and only
> the `assistance:` and `error:` namespaces carry a string prefix — a correction
> `format-surface` made at its own cross-review, when gate clause 3 was found to reject
> `assistance:arrows` outright. The census therefore joins §3c's `dispositionRow` by
> `(namespace, subject) → pointer` where the `schema:` namespace maps to the **unprefixed**
> subject and the other two map to `"<namespace><subject>"`. **An implementer that keys the
> join on `` `${namespace}${subject}` `` uniformly will silently match nothing for every schema
> declaration and report `dispositionRow: null` across the board** — a false "no register row"
> for the one namespace the register actually covers, which is the failure mode §3c exists to
> prevent, inverted.

#### 3b. The two measurements, restated for declarations

`expression-census` keeps **coverage** and **satisfiability** apart and never lets one stand
in for the other. The declaration census keeps three columns apart, for the same reason:

| Column | Question | What zero means |
|---|---|---|
| **producers** | How many non-test, non-declaration sites can *emit or set* this value? | Zero is a **bug candidate** — the value cannot be produced. This is the "cannot fire" side |
| **consumers** | How many non-test sites *read or branch on* it? | Zero is a **bug candidate** in the other direction — the value is produced and nothing acts on it |
| **corpus firings** | For a value with a corpus population (schema enums, transition subkinds, assistance axes with authored uses), how many times does it occur or fire across `content/`? | Zero is a **coverage fact, never an error** — the `expression-census` rule, unchanged |

**Four constraints keep this honest, and they are the whole difference between an instrument
and a wishlist:**

1. **Zero producers is a *candidate*, not a verdict.** The report says
   `producers: 0`; it never emits `dead`, `unreachable` or `unsatisfiable` for a declaration.
   Static reachability is undecidable and `expression-census` §9 already forbids the
   instrument from claiming what it cannot prove. The verdict is
   `FORMAT_DISPOSITIONS`' to record and an RFC's to make.
2. **A site is classified by what it does, not by where it is, and not by its argument
   index.** §4a's six near-misses are the fixture, and they split two ways:
   - **Where.** `VOICE_UNAVAILABLE`, `TTS_UNAVAILABLE` and `CORPUS_UNAVAILABLE` are produced
     inside `rest.ts`, the same module that maps codes to statuses, so a classifier that
     excludes a *module* rather than a *construction* mislabels three codes at once.
   - **Shape.** `PERFECT_TABLEBASE_OUT_OF_RANGE` and `PRACTICAL_RESISTANCE_OUT_OF_RANGE` are
     produced by `runtimeIssue(...)`, a **different constructor** from `ServerError`; and
     `REPERTOIRE_IMPORT_LIMIT` is produced by a literal nested inside a **conditional
     expression** in argument position, not by the argument node itself. A classifier keyed on
     "string literal in argument 0 of a known constructor" reports all three as producerless.

   A producer is therefore **any construction, throw, or push in which the value appears as a
   string literal anywhere within the constructing expression's argument subtree** —
   `new ServerError("X"`, `new ServerError(cond ? "X" : "Y"`, `runtimeIssue("X"`,
   `runtimeWarning("X"`, `observations.push({… subkind: "X"`, or an object literal assigning
   the value to the declared key. The constructor set is **enumerated from the tree**, not
   hard-coded: any function whose parameter is typed `ServerErrorCode` (or the namespace's
   declared type) is a constructor for that namespace. A consumer is a comparison, a switch
   arm, or a member test. Both are matched syntactically over the module's AST, not by grep,
   and a site that is both counts as both.

   **`runtimeIssue`/`runtimeWarning` take a bare `string`, not `ServerErrorCode`** (verified,
   `apps/server/src/pack-validation.ts`), so the type-driven half of that rule does not reach
   them and they must be named. §3e records why that matters beyond this constraint.
3. **A refusal emitter is not a consumer.** The site that emits
   `RETRY_VARIANTS_NOT_EXECUTABLE` reads `pack.retryVariants` and is, syntactically, a perfect
   consumer — yet it exists precisely *because* nothing executes the declaration. Counting it
   would make every `refused` row in `FORMAT_DISPOSITIONS` report as healthy the moment its
   warning ships, and the report would then say the opposite of the register standing beside
   it. **A site whose only effect on the value is to raise an issue naming it is classified
   `refusalSites`, a fourth column, and never `consumers`.** Motivation §2 is the fixture: at
   `acebb91` `retryVariants` had zero consumers, at `532c7e2` it has one refusal site and
   still zero consumers, and the census must report that as *unchanged*.
4. **Every count carries its denominator and its excluded set.** *"1 of 63, excluding tests,
   fixtures, `dist/` and `tools/`"* is a claim a reader can re-run; *"`SIMULATE_BUDGET_EXCEEDED`
   is dead"* is not. The excluded set is **`node_modules/`, `dist/`, any `*.test.ts` /
   `*.spec.ts`, `content/`, and `tools/`** — and `tools/` is named explicitly because it is
   where the disposable research harnesses live and it is *not* obvious that they should be
   excluded. §5 is the case that settles it: `vacationReading`'s only call site anywhere is
   `tools/r1r2-primitives-harness/r1.test.ts`, so a census that counted `tools/` would report
   a symbol as consumed on the strength of a harness that RFC-0000 §Exploration gate labels
   disposable. **A disposable instrument is not a consumer**, and the report says so by
   carrying `excludedSet` in `totals.declarations` rather than by leaving it to a reader.
   `expression-census`'s existing `EVALUATION_FAULT` isolation applies unchanged: a namespace
   whose enumeration throws is reported as faulted and excluded from counts, never
   reclassified as empty.

#### 3c. Report shape

The declaration census is a **new top-level section of the existing envelope**, not a new
document kind: `tabiya.authoring.census.v1` gains `declarations` beside its shipped `corpus`,
`evidence`, `schema`, `subjects` and `totals` keys. Rationale: a reader already asking *"where
does this fire?"* and a reader asking *"what has no consumer?"* are the same reader on the
same corpus walk, and a second output file is a second thing to forget to run.

Each entry:

```
{ namespace, subject, declaredAt: {module, symbol},
  producers: [{module, symbol}], consumers: [{module, symbol}],
  refusalSites: [{module, symbol, code}],   // §3b constraint 3; never folded into consumers
  corpusFirings: number | null,     // null when the namespace has no corpus population
  dispositionRow: string | null }   // the FORMAT_DISPOSITIONS (pointer, value) key, when one exists
```

`dispositionRow` is the join that makes the two instruments one system: it is `null` exactly
when a declaration has no row in `format-surface`'s register, which is the **sixth silent
state** that RFC names — *"`engine-leverage` §6.2 calls this the fourth silent state for
instrument capabilities; for format declarations it is the sixth, and it is the same state"* —
reported rather than waited for. The join is keyed per §3a's note: unprefixed for `schema:`,
prefixed for `assistance:` and `error:`, and always `null` for `runtime:` (Open question 1).
The census never writes the register and never proposes a disposition — it reports which
subjects have none.

A `totals.declarations` block carries, per namespace, the subject count, the `excludedSet`
(§3b constraint 4), and the counts of `producers === 0`, `consumers === 0`, and
`dispositionRow === null`.

#### 3d. Where it plugs in

- **`make expression-census`** grows one flag, `DECLARATIONS=1`, defaulting **off** so the
  shipped default output and its consumers do not change. The `Makefile` target already
  threads six optional flags in this exact form.
- **`make verify` — no.** Unchanged from `expression-census` §7d. Report-only.
- **`pack-check`, `shape-check` — nothing new.** No new severity, no new refusal. The
  declaration census refuses nothing; every remedy it enables is an RFC's.
- **`docs/expression-census.md`** gains the section describing the third measurement and the
  four constraints in §3b. That documentation edit is the implementer's, in the landing
  commit, per the completion protocol.

**Both halves of the shipped rule survive, and they are quoted together because quoting one is
how a sibling draft got this wrong.** `docs/expression-census.md` states: *"The census never
writes content **and is deliberately absent from `make verify`**."* The declaration census
honours both — it is absent from `make verify` (above, and criterion 9), and it **writes no
content**: its sole output is the census JSON, to stdout by default or to the `OUT=` path the
caller names, and it opens no file under `content/` for writing. Criterion 13 asserts the
second half, which nothing in the draft previously tested.

#### 3e. What the census cannot see, stated before anyone assumes otherwise

Two ledger rows filed after this draft was written bear directly on the instrument, and
neither is a clean win for it. Recording that honestly is the same discipline §4b applies to
D360.

- **[[D426]]** — *"Two lint codes `pack-graduation` §6 specifies are absent from the tree, and
  its template registry does not exist"* — is the sharpest available statement of this RFC's
  motivation. Its closing clause, *"an RFC's §6 is a claim about intent, not about the tree"*,
  is the general form of what §4b found in a ledger row and §1 found in a wave brief, and it
  is the third instance in three days. **It strengthens the case for an instrument and it is
  cited here for that.**

  **But the census as specified would not have caught it, and the reason is a real bound on
  the design.** `GRADUATION_RESOLVED_WITHOUT_RESOLUTION` and `GRADUATION_ACCEPTED_WITHOUT_RULING`
  appear nowhere in code — verified at `532c7e2` — so there is no declaration for a census over
  **live sources** to enumerate. The census answers *"which declaration has no consumer?"*; D426
  asks *"which specified thing was never declared?"*, which is a question about an RFC's text
  and is `format-surface`'s `FORMAT_DISPOSITIONS` gate direction, not this one's. Worse, the
  authoring-issue code space is **not enumerable at all**: `runtimeIssue` and `runtimeWarning`
  take a bare `string` (`apps/server/src/pack-validation.ts`), so there is no closed union to
  walk, which is why §3a lists four namespaces and not five. **The reach of this instrument is
  exactly the set of vocabularies this repo declares as closed sets.** That is a boundary, it
  is stated rather than papered over, and Open question 3 asks whether to move it.
- **[[D421]]** — *"`BANNED_JUDGEMENTS` is enforced only over LLM output, so every authored
  surface routes around it"* — is the limitation in the other direction. `BANNED_JUDGEMENTS`
  has a consumer (`voiceCheck`), so it reads healthy under §3b: `producers >= 1`,
  `consumers >= 1`. **The census counts consumer *sites*, never consumer *coverage*.** A
  declaration guarded on one surface out of five is indistinguishable, in this report, from one
  guarded everywhere. Nothing here proposes to fix that — measuring the fraction of a surface a
  guard covers is a different instrument — but a reader who takes `consumers >= 1` as "wired
  up" will read D421's subject as fine, and this paragraph exists so that reader is warned in
  the specification rather than in a later dossier.

### 4. D360 — refuted, and the remedy was a ledger correction rather than code

The measurement is §4b. The dispositions that follow:

- **No code changes.** `clock_zeroed` is declared, produced (`transitionReading`), evaluated
  (`matchesTransitionFeature`), rendered (`renderTransitionObservation`), authorable in a
  transition predicate, and fires on **265 of 771** committed spine transitions. Neither
  branch of the row's *"either delete the subkind and its sentence, or emit it"* is correct,
  and the first would delete a live renderer.
- **The row is corrected, not deleted — and it already has been.** As drafted, this bullet
  assigned the flip to this RFC's implementer and declined to make it, on the grounds that an
  unaccepted draft which has already rewritten the ledger it argues from has removed the
  reviewer's ability to check it. **That reasoning stands and the flip has since happened
  independently:** `design/BACKLOG.md`'s D360 now reads *"REFUTED 2026-08-16 — and its stated
  remedy would have deleted a live renderer"*, status `✅ refuted 2026-08-16, remedy
  withdrawn`, carrying the 265-of-771 measurement, the misidentified-detector reason, and the
  generalisation *"A ledger row is a claim about code and inherits the fallibility of whatever
  measured it"*. **Nothing is left for this RFC's landing commit to do to D360**, and criterion
  11 is corrected accordingly. The ledger is a shared register every tier writes to
  (`AGENTS.md`), so a flip landing ahead of the draft that produced the measurement is the
  protocol working. Law 7 still governs `planning/exploration/log.md`, which is append-only
  and gets an entry rather than an edit.
- **The true residual, stated so it is not lost.** `irreversibility()` cannot return
  `clock_zeroed`, so the subkind can never become a **live pivotal marker**, only a
  transition observation. That asymmetry is real and is **not a defect**:
  `rfc/live-marker-quality.md` is narrowing live `irreversibility` to `last_of_role`, which
  removes `pawn_break` and `castled` from the live surface too. A subkind absent from a
  surface that is being narrowed to one member is not dead vocabulary. **No row, no
  disposition, no work** — recorded here because "we checked and there is nothing" is a
  result, and an unrecorded one gets re-found.
- **The instrument would have prevented it.** Under §3a, `clock_zeroed` is a `runtime:`
  subject with **two producers** (`transitionReading`, `matchesTransitionFeature`), one
  consumer (`renderTransitionObservation`), zero refusal sites, and `corpusFirings: 265` over
  the corpus at `532c7e2` (**245** over the corpus D360 was written against — the figure that
  appears in §4b's third table row, and the two are not interchangeable). No hand-read is
  required to see any of it, and no hand-read produced it.

### 5. `structuralDelta` and `vacationReading` — measured, and deliberately left alone

The ledger row *"`structuralDelta` and `vacationReading` ship and are dead"* calls itself the
*"third member of the dead-vocabulary family"*, which makes it the one row that named this
wave before the wave existed. Both are exported from `packages/runtime/src/structure.ts`
through `packages/runtime/src/index.ts`. **Their call sites, re-enumerated at `532c7e2`, are
not what this draft first wrote, and the correction matters:**

| Symbol | Non-test production call sites | Test call sites | Other |
|---|---|---|---|
| `structuralDelta` | **none** | `packages/runtime/src/structure.test.ts` (advisory `:102`, `:124`); a negative import assertion in `transition.test.ts` (advisory `:59-60`) | `tools/r1r2-primitives-harness/r1.test.ts` |
| `vacationReading` | **none** | **none** — it is not called by `structure.test.ts` at all | `tools/r1r2-primitives-harness/r1.test.ts` (advisory `:97`, `:175`); documented in `docs/structural-reading.md` (advisory `:57`) |

The draft's original claim — that both are called from `structure.test.ts` — was **wrong for
`vacationReading`**, which has no call site in `packages/` outside its own definition. It is
*more* dead than the row says, not less. And the only thing that calls it anywhere is a
disposable exploration harness under `tools/`, which is precisely the case §3b constraint 4
was written against: had `tools/` been inside the census's scan set, `vacationReading` would
report `consumers >= 1` and this section's finding would invert. **A review that re-enumerated
one symbol's call sites changed a specification constraint** — which is the argument for the
instrument, made on this RFC rather than by it.

There is also a consumer the census will never see: `docs/structural-reading.md` describes
`vacationReading(fen, square)` to authors. **A documented capability with no caller is a
sharper defect than an undocumented one**, and no producer/consumer count over `apps/` and
`packages/` can surface it.

**Direction: executable-but-not-declarable** — the mirror of D84/D85/D86, and the same
inversion `format-surface` §1b recognises for [[D96]] (*"Per-leg trajectory expressiveness"*)
via [[D29]]'s precedent (*"`rules_fact` cannot express `draw` although the runtime executes
it"*, closed 2026-08-15). The runtime computes transition arithmetic that no format vocabulary
can ask for.

**Disposition: none, and that is the finding.** Retirement is refused on the row's own
grounds — it is *"the exact machinery the owner's move-primitives question needs"* — and
implementation means minting a format construct to reach it, which is a design-tier question
this RFC may not open (law 5). Under §3b's columns the pair reads
`consumers: 0, corpusFirings: null, dispositionRow: null` — exported producers that nothing
in the tree consumes — and *"a shipped
capability with no declaration that can reach it"* is precisely what the census exists to
surface for whoever takes the move-primitives question. Naming the direction is this RFC's
whole contribution to the row.

### 6. Register claims — nothing, and that is the good outcome

| Resource | Claim |
|---|---|
| Pack schema version | **NONE.** `DRILL_PACK_SCHEMA_VERSION` reads **`"0.27"`** at `532c7e2` (`packages/schema/src/index.ts`); 0.25 / 0.26 / 0.27 are held by `format-surface`, `claim-backing` and `pack-graduation`, all three now archived. **0.28 is no longer free — it is claimed and kept by `rfc/graduation-clearance.md`**, which is what this row said was next when the draft opened. Nothing changes for this RFC: it claimed no lane then and claims none now, which is the property being demonstrated |
| Run schema version | **NONE.** Run **0.17** is held by `rfc/opponent-contracts.md` |
| Migration number | **NONE**, and the reason this row must not carry an integer is now demonstrable in one line. `STORAGE_VERSION` reads **22** in committed `532c7e2` and **23** in the working tree, where `rfc/opponent-contracts.md` is mid-implementation against migration 23; it read **22** at `acebb91` and the wave brief this draft was written from said **21**. **Four readings in three days for one constant, two of them simultaneously true depending on whether you read the commit or the checkout** — which is the whole of [[D250]], *"A draft that writes a shared monotonic integer into its body has written a claim with an expiry date"*. Recorded as a **position**: the next RFC that needs one takes `STORAGE_VERSION + 1` **at landing**, per `board-annotation`'s ratified form |
| Shape-entry schema | **NONE.** Shape-entry **0.4** is claimed by `rfc/measurement-records.md` |
| `rfc/README.md` | **not edited by this draft.** Single-writer; claude registers it |
| Persisted shape of anything | **NONE.** The census is report-only: it writes the census JSON to stdout, or to the `OUT=` path the caller names, and writes no content (§3d) |

Nothing this RFC specifies touches a versioned resource, a persisted record, a committed pack
byte or a digest. That is not luck: **a discovery instrument that needed a schema lane would
be a schema change wearing an instrument's name.** The wave brief asked for this to be said
loudly if true, and it is true.

**This table deliberately quotes no lane number for itself**, and the reason is live rather
than theoretical: `DRILL_PACK_SCHEMA_VERSION` read `"0.24"` when this draft opened, `"0.25"`
at `acebb91` a few hours later, and `"0.27"` at cross-review. A draft that had written *"the
predecessor is 0.24"* into its body would have been wrong twice over in two days. Claiming
nothing is what makes this RFC immune to that, which is the second reason the outcome is the
good one — **and cross-review confirmed the property holds**: the register facts in this table
all moved, and not one of them changed anything this RFC specifies.

### 7. Cross-draft coordination

- **`rfc/archive/format-surface.md` (implemented, archived 2026-08-16)** — the only RFC with
  real overlap, resolved by cession rather than negotiation (§1), and the cession re-verified
  in code at cross-review (Motivation §1). There is no landing-order constraint in either
  direction: this RFC claims nothing that RFC claims and touches no file it modified.

  **One correction it owes, and the destination has changed.** That RFC's §3.3 records
  *"`variantOf` has **zero users** in `content/`"* (advisory `:535`). **There are two**
  (Motivation §3), and the disposition built on it is unaffected and slightly strengthened.
  As drafted, this bullet offered the figure to *"that RFC's author or its implementer"*.
  **That destination no longer exists:** the RFC is archived, and `rfc/0000-rfc-process.md`
  makes an archived RFC immutable — an archived RFC explains why and how a decision arrived,
  and is not a live description of the tree. **Re-routed:** the corrected figure belongs in
  `design/BACKLOG.md` ([[D105]], *"A `retryVariants` note names a pack that does not exist, and
  nothing can see it"*, already carries the 11-entry measurement and is the natural
  host) and in `rfc/vocabulary-wiring.md` §7, which owns `variantOf`'s adoption and is still
  implementing. Reported for claude to land; not made here.
- **`rfc/live-marker-quality.md` (implementing)** — §4's residual sits in its territory and
  proposes nothing. Its narrowing of live `irreversibility` to `last_of_role` is what makes
  `clock_zeroed`'s absence from the live surface a non-issue; that is a citation, not a
  dependency.
- **`rfc/vocabulary-wiring.md` (implementing)** — its §7 owns `variantOf`'s adoption. §2 hands
  it the two new adopters as evidence, plus the correction above, and claims nothing.
- **`rfc/graduation-clearance.md` (cross-reviewed, keeps pack 0.28)** — checked after it took
  the lane §6 recorded as free. **No overlap**: it claims a pack schema version and five
  `$defs`-level changes; this RFC claims none. Its subject (D426's clearance grammar) is cited
  by §3e as motivation and is explicitly outside the census's reach.
- **`planning/work-register.md` §4a** — receives D86 stage two with the measured count its
  entry condition requires (§2). §4a's entry condition, verified: *"it must arrive with a
  measured count of authored uses per member … **Measure before drafting**."* The register
  edit is the implementer's, in the landing commit.
- **`rfc/engine-leverage.md`, `rfc/teacher-surface.md`, `rfc/feedback-delivery.md`,
  `rfc/measurement-records.md`, `rfc/learner-rating.md`, `rfc/opponent-contracts.md`** — no
  shared resource, no shared file, no shared version lane. Checked, not assumed.
  `claim-backing`, `pack-graduation` and `evidence-at-runtime` were listed here as active
  drafts; **all three are archived**, and the check holds unchanged for their archived form.

## Deviations from design

**None.** This RFC authors no design-tier reading, proposes no change to `design/00`–`06`,
and mints no law. §1's direction column applies `rfc/archive/defect-sweep.md` §2 and
`rfc/archive/engine-request-contract.md` §3 as written. Law 8 is untouched: the declaration
census counts producers, consumers and firings of vocabulary the repo already ships, and
never evaluates, grades or characterises a chess move.

## Acceptance criteria

1. **Cession is enforceable, not merely stated.** A reviewer can confirm that no file this
   RFC's implementation touches is named in `rfc/archive/format-surface.md` §§3.1–3.5 or §4 as
   one it modifies, and that `AssistanceConfig`, `ServerErrorCode`,
   `schemas/drill_pack.schema.json`, `apps/server/src/opponent-selector.ts` and
   `packages/schema/src/drill-pack/dispositions.ts` are read-only to this implementation.
2. **The `declarations` section exists and is populated from live sources.** Running
   `make expression-census DECLARATIONS=1 OUT=…` emits a `declarations` array and a
   `totals.declarations` block covering all four namespaces of §3a, with every subject
   carrying `declaredAt`.
3. **No hand-written subject list.** A test mutates each live source — adds an enum member to
   `schemas/drill_pack.schema.json`, a member to the `ServerErrorCode` union, a value to an
   `AssistanceConfig` axis union, a subkind to `IrreversibilityDetail` — and asserts the
   subject count rises by one in each namespace without any other file changing. A namespace
   that does not move fails.
4. **The zero-producer set is asserted as a set, and it is now empty.** The assertion is on
   the **property** — *the set of `error:` subjects with `producers: 0`* — never on the
   integer 63, so that adding a code with a producer does not turn the test red.
   (`format-surface`'s own round-2 pass found criterion 9's exact counts reintroducing the
   staleness failure its criterion 1 had already been corrected for; this criterion is written
   against that, and the correction has already paid: **`format-surface` did land first and
   did remove `SIMULATE_BUDGET_EXCEEDED`**, so at `532c7e2` the expected set is `∅` and the
   criterion holds unchanged.) The test seeds a producerless code in a fixture tree and asserts
   it appears, so an empty expectation over the real tree cannot pass vacuously.
5. **The six near-miss codes are classified correctly, and this is the criterion that has
   teeth.** All six report `producers >= 1`:
   - `VOICE_UNAVAILABLE`, `TTS_UNAVAILABLE`, `CORPUS_UNAVAILABLE` — a classifier that excludes
     `rest.ts` wholesale fails.
   - `PERFECT_TABLEBASE_OUT_OF_RANGE`, `PRACTICAL_RESISTANCE_OUT_OF_RANGE` — a classifier that
     recognises only `ServerError` constructions and not `runtimeIssue` fails.
   - `REPERTOIRE_IMPORT_LIMIT` — a classifier that inspects only the argument node, rather than
     its subtree, fails on the conditional expression at `repertoire.ts`.

   All six were produced by an actual naive classifier at cross-review (§4a), so this criterion
   tests a failure that has been observed rather than one that was imagined.
6. **D360's refutation reproduces mechanically.** The `runtime:` namespace reports
   `clock_zeroed` with `producers >= 2` and `corpusFirings > 0` over the committed corpus
   (**265 of 771** at both `acebb91` and `532c7e2`), and `IrreversibilityDetail`'s three
   subkinds with their own non-zero firings. A test asserts `clock_zeroed`'s firing count is
   **greater than the sum** of `pawn_break`'s, `castled`'s and `last_of_role`'s — the ordering,
   not the integers, since the corpus grows. (265 against 102 at both epochs; the margin is
   wide enough that the ordering is a stable assertion, which is why the stronger form is used.)
7. **The denominator agrees with the shipped instrument.** The declaration census's corpus
   walk reports the same `corpus.transitions` value as the existing census section on the
   same tree. Two numbers from one walk that disagree would mean the extension forked the
   walker.
8. **Zero is never a verdict.** A test asserts the report contains no `dead`, `unreachable`,
   `unsatisfiable` or `unused` field or string value anywhere in the `declarations` section,
   and that a subject with `producers: 0` carries no severity, no issue code and no
   suggestion.
9. **`make verify` is unchanged**, and `pack-check`/`shape-check` gain no severity, no
   refusal and no new output key. Asserted by running `make verify` on a tree where a
   deliberately producerless declaration has been added.
10. **The default output is byte-identical without the flag.** `make expression-census`
    without `DECLARATIONS=1` produces the same JSON as before the change, over the same
    corpus. A discovery flag that alters the shipped report is a silent change to every
    consumer of it.
11. **The ledger and the log both move in the landing commit.** `planning/work-register.md` §2
    cluster E is marked owned-by-`format-surface` with this RFC named for the residual; §4a
    gains D86 stage two with its measured count; and `planning/exploration/log.md` gains the
    entry. **D360's row is already flipped** (§4) and needs nothing further — a criterion that
    demanded a flip already made would be unsatisfiable, which is the failure this criterion
    was written to avoid in the first place. The completion protocol requires the ledger **and**
    the log in the archiving commit, and `engine-request-contract` is the recorded evidence for
    why the second clause exists.
12. **`docs/expression-census.md` describes the third measurement** and §3b's four
    constraints, in the same commit.
13. **The instrument writes no content.** A test runs `make expression-census DECLARATIONS=1`
    against a scratch `OUT=` path and asserts that no file under `content/`, `schemas/` or
    `packages/` differs afterwards. This is the half of `docs/expression-census.md`'s rule that
    the draft honoured in prose and never asserted; a sibling RFC was returned for quoting only
    the other half.
14. **`refusalSites` is separated from `consumers`.** `/retryVariants` reports
    `consumers: 0` with `refusalSites: [{module: "apps/server/src/pack-validation.ts", code:
    "RETRY_VARIANTS_NOT_EXECUTABLE"}]`. A classifier that folds the warning emitter into
    `consumers` reports a `refused` declaration as consumed and fails this criterion —
    the self-healing failure §3b constraint 3 names.

## Open questions

1. **Should the `runtime:` namespace be part of `FORMAT_DISPOSITIONS` or stay census-only?**
   `format-surface` §2 declares three namespaces — the pack-schema pointers plus `assistance:`
   and `error:` — and its gate checks each against a live source. §3a's fourth namespace has no
   register rows and this RFC deliberately does not add one, because widening another RFC's
   register from a draft is the coordination bug this document opens by refusing. The census
   reports `dispositionRow: null` for every `runtime:` subject, which makes the gap visible
   without deciding it. **Now sharper, and the destination has changed:** that RFC is archived
   and immutable, so this is no longer *"offered to its author"* — it is a decision for
   whichever RFC next edits `packages/schema/src/drill-pack/dispositions.ts`, which is a live
   file even though the RFC that created it is frozen — `opponent-contracts` is adding four
   `/opponentPolicy/mode` rows to it in the working tree right now, which is the proof that a
   frozen RFC does not freeze its register. **Not claimed here.** The register has **eight**
   rows in committed `532c7e2`, so the question is answerable rather than premature.
2. **Should `producers: 0` with `consumers >= 1` be reported more loudly than the reverse?**
   The two zeros are not symmetric in cost: a declaration nothing produces but something
   consumes is a published capability that cannot fire (`SIMULATE_BUDGET_EXCEEDED`, and the
   client 422 handler that waited for it), whereas a declaration something produces and
   nothing consumes is usually an unfinished feature. §3c reports both columns flatly and
   ranks nothing. **Deferred to first use**: the honest input is what the first three
   readers of the report actually chase, and inventing a severity ordering before the report
   exists is exactly the free-parameter hazard [[D53]] names — *"`option_collapse`'s thresholds
   are detector-chosen free parameters"*. Revisit when `totals.declarations` has been read
   against a real tree.
3. **Should the authoring-issue code space become a fifth namespace, and can it?** §3e shows
   [[D426]] — two lint codes an RFC specifies and the tree does not contain — is **outside**
   this instrument's reach, because `runtimeIssue`/`runtimeWarning` take a bare `string` and
   there is no closed union to enumerate. Two options, and this RFC picks neither:
   (a) declare a `PackIssueCode` union and gain a fifth namespace for free, which is a real
   refactor of `pack-validation.ts` and is not an instrument change; or (b) accept that the
   census covers exactly the vocabularies this repo declares as closed sets, and let D426's
   class stay a hand-audit problem. **(a) is the better answer and is not this RFC's to
   take** — it changes production code in a package this RFC is otherwise read-only to, which
   would break §5's own scope boundary. Raised so the boundary is a decision rather than an
   oversight, and routed to whichever RFC next owns `pack-validation.ts`'s issue vocabulary.

## Changelog

- 2026-08-16 (cross-review, adversarial, by a reviewer who did not write the draft).
  **Verdict: the central refusal is sound and the cession still holds — re-verified in the
  tree, not in the RFC's text.** All four ceded dispositions are shipped at `532c7e2`
  (`dispositions.ts` rows for `assistance:arrows`, `error:SIMULATE_BUDGET_EXCEEDED`,
  `/retryVariants`; the D57 vacuity conjunct removed and `PRACTICAL_RESISTANCE_UNMEASURED`
  added), so the cession leaves **nothing ownerless** — the [[D400]] failure mode was checked
  for and is absent. **The D360 refutation is confirmed independently**: a second harness
  reproduced 265/771 exactly, `transition.ts:360` emits and `:309` evaluates, and
  `make expression-census` corroborates the 771 denominator. **Claims nothing versioned —
  confirmed, and the property earned its keep**: every register fact in §6 moved during review
  (`STORAGE_VERSION` 22→23, pack `0.25`→`0.27`, lane 0.28 claimed by `graduation-clearance`)
  and not one changed anything specified. Corrections landed in the body: §1's *"in flight,
  not landed"* paragraph replaced with a per-row tree verification; every `rfc/format-surface.md`
  path moved to `rfc/archive/`; the `variantOf` correction **re-routed** because an archived
  RFC is immutable and its author is no longer a destination; §5's call-site claim corrected
  (`vacationReading` is called nowhere in `packages/`, only by a disposable `tools/` harness);
  the `engine-request-contract` §3 quotation restored to its exact wording; D360's ledger flip
  recorded as **already made**, and criterion 11 corrected so it is not unsatisfiable.
  **Four specification defects found and fixed**: (1) §3a's `schema:` label does not exist in
  `FORMAT_DISPOSITIONS`' keys — schema rows are bare pointers, so a uniform join silently
  matches nothing; (2) §3b's producer definition missed two real syntactic forms — a naive
  classifier run at review reported **three** false zero-producer codes
  (`PERFECT_TABLEBASE_OUT_OF_RANGE`, `PRACTICAL_RESISTANCE_OUT_OF_RANGE` via `runtimeIssue`,
  `REPERTOIRE_IMPORT_LIMIT` via a conditional expression), doubling the near-miss fixture from
  three to six; (3) a **refusal emitter is not a consumer** — `/retryVariants` gained one at
  `532c7e2` and would now self-report as healthy, so `refusalSites` is a fourth column
  (constraint 3, criterion 14); (4) `tools/` was never named in the excluded set, and §5 is the
  case that proves it must be. Folded in: **[[D426]]** cited as motivation *and* stated to be
  **outside the census's reach** (no closed lint-code union to enumerate) rather than claimed
  as a catch, with Open question 3 raised for it; **[[D421]]** recorded as the consumer-*sites*
  versus consumer-*coverage* limitation. Criterion 13 added for the *"never writes content"*
  half of the shipped rule, which the draft honoured and never asserted. `rfc/README.md` not
  edited; `design/BACKLOG.md` not edited — rows reported for claude to land.
- 2026-08-16: created. Wave 3, cluster E. **Claims nothing versioned** — no pack lane (0.28
  was free at drafting), no run schema, no migration (`STORAGE_VERSION` read **22** at
  `acebb91`, not the brief's 21), no persisted shape. **Cedes D84, D85, D86 and D57 to
  `rfc/format-surface.md`**
  (accepted 2026-08-16), which disposes all four with owner rulings applied, and states each
  one's direction of the declared-vs-executable law for the record: D84
  declared-but-not-executed with an owner-ruled deficit beneath it, D85 the same direction
  with the law's remedy clause vacuous, D86 the same direction, **D57 neither** — an
  engine-request-contract *record* failure. Routes the three residuals that RFC named and
  declined (D85's eight free operations → owner-gated; D86 stage two → work-register §4a with
  the measured count its entry condition requires; D84's revisit → `board-annotation` plus a
  future directed primitive). Takes `format-surface` Open question 1: a **declaration census**
  extending `make expression-census`, report-only, no gate. Two first-hand measurements:
  `SIMULATE_BUDGET_EXCEEDED` is **1 of 63** `ServerErrorCode` members with no producer, and
  three codes that look producerless to a grep are not; **D360 is refuted** — `clock_zeroed`
  fires **265 of 771** committed spine transitions, the most frequent `move_irreversibility`
  observation in the corpus, because the row measured `irreversibility()` rather than
  `transitionReading`. Corrects one stale figure in a sibling and does not edit it:
  `variantOf` now has **two** committed adopters, not zero, and both retain `retryVariants`
  entries it cannot express. All counts re-derived at **`acebb91`** after `caa8afa` and
  `acebb91` landed mid-draft; `board-annotation` shipping legs (a)/(b) of the `arrows` split
  without touching `assistance.ts` confirms `format-surface` §3.1's scoping empirically.
