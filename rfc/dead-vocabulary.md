# RFC: Dead vocabulary — the wave's rows are owned; its instrument is not

- **Status:** draft (awaiting cross-review)
- **Author:** claude
- **Created:** 2026-08-16
- **Design refs:** none authored. `design/05-in-run-experience.md` §3 (the assistance ladder)
  and `design/04-content-architecture.md` §4 (the convert/hold/save variants rule) are cited
  descriptively only; this RFC proposes no design-tier change and no design-tier reading.
- **Exploration gate:** none needed. Every row below is a ledgered defect with first-hand
  code evidence, not a GAP row (law 1, second clause). The one thing this RFC *claims* is an
  explicit hand-off from an **accepted** RFC: `rfc/format-surface.md` Open question 1, which
  names its successor and declines to be it — *"Recommended owner: a follow-up that extends
  the census tool."*
- **Depends on:** `rfc/format-surface.md` (**accepted 2026-08-16** — it owns all four of
  cluster E's open rows; this RFC cedes them and takes its Open question 1),
  `rfc/archive/expression-census.md` (the shipped instrument this extends, and the
  two-measurement discipline it must not break), `rfc/archive/defect-sweep.md` §2 (the
  declared-vs-executable law, applied and not amended),
  `rfc/archive/engine-request-contract.md` §3 (the *record* obligation, for D57's direction),
  `rfc/archive/predicate-wave-3.md` (the deprecation-warning-first retirement precedent),
  `rfc/archive/validator-integrity.md` §8a/§8b (the law's two most recent shipped uses)
- **Parent / amends:** **none.** This RFC amends nothing. Where it disagrees with a
  `design/BACKLOG.md` row it says so and proposes the correction rather than making it.
- **Supersedes / superseded by:** —
- **Planning:** `planning/dead-vocabulary/` (once implementing)

> **Locate by symbol, not by line.** Every symbol name below was verified first-hand against
> the working tree, and every count re-derived at **`acebb91`** after the tree moved twice
> during this draft's writing — `caa8afa` (`vocabulary-wiring`) and `acebb91`
> (`board-annotation`) both landed while it was being written, and both are accounted for
> below where they change a fact. Line numbers are advisory and are marked as such. Every
> count here was **re-derived**, not copied from a dossier or a sibling RFC — including the
> three that independently reproduce `format-surface`'s figures, which is stated because
> agreement between two measurements is evidence and agreement between a measurement and a
> quotation is not.
>
> **The mid-draft movement is itself a finding and is not smoothed over.** `board-annotation`
> landed legs (a) and (b) of the owner's three-way `arrows` split — learner-drawn and relayed
> marks — at `acebb91`, touching neither `packages/runtime/src/assistance.ts` nor
> `apps/web/src/lib/AssistanceSettings.svelte`, exactly as `format-surface` §3.1 scoped it.
> Leg (c) is untouched and every cluster-E finding below still holds at HEAD. §2 records the
> landing rather than the pending state it was drafted against.

## Summary

Cluster E was routed in `planning/work-register.md` §2 as *"the last undrafted RFC wave"*.
It is not undrafted. **All four of its open defects — D84, D85, D86, D57 — are owned,
disposed, cross-reviewed and owner-ruled by `rfc/format-surface.md`, accepted 2026-08-16**,
and its other three members (D39, D40, D59) closed in code on 2026-08-15. A second RFC over
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

- **A true positive found years of dossiers late.** `SIMULATE_BUDGET_EXCEEDED` is **1 of 63**
  members of the `ServerErrorCode` union with no producer anywhere in the tree. One line of
  mechanical enumeration separates it from the other 62; it took a campaign-effect research
  dossier to notice.
- **A false positive that a hand-read produced and shipped into the ledger.** The row
  *"`clock_zeroed` renders a shipped sentence the detector never emits"* (D360) is
  **refuted**: `clock_zeroed` fires **265 of 771** committed spine transitions at `acebb91`,
  making it the *most frequent* `move_irreversibility` observation in the corpus — more
  frequent than `pawn_break`, `castled` and `last_of_role` combined. The row measured
  `irreversibility()`, which is not that subkind's producer.

## Motivation

### 1. What cluster E turned out to be

The wave brief describes four open defects and asks which direction of the
declared-vs-executable law each violates. Both halves of that question are already answered
in an accepted document, and the answers were verified here rather than trusted.

**And the answer is not merely accepted — it is in flight.** `planning/format-surface/`
exists at `acebb91`, that RFC's header records a *"2026-08-16 implementation review"*, and
its D96 half has landed. Its dead-vocabulary half has **not**: at HEAD there is no
`packages/schema/src/drill-pack/dispositions.ts`, no `RETRY_VARIANTS_NOT_EXECUTABLE`, the
`SIMULATE_BUDGET_EXCEEDED` union member is still present with no producer, and the vacuity
conjunct in `OpponentSelector#practicalResistance` is unchanged. A second RFC over these
rows would therefore not merely duplicate a decision — it would land specifications on files
an implementer is editing this week.

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
*every value applied and the answer taken appear in the persisted record* — because the
selection that gets stamped `practical_resistance` was made by
`left.move.uci.localeCompare(right.move.uci)`. Verified first-hand in
`OpponentSelector#practicalResistance` (`apps/server/src/opponent-selector.ts`, advisory
`:712-719`): the vacuity refusal is guarded by `measured.length === scored.length`, so a
**single** unmeasured candidate disables it, and the surviving comparator's first term is
`0` for every pair when all ratios are zero. Filing D57 under declared-vs-executable would
have produced the wrong remedy — a refusal on the *mode*, when the mode is fine.

**D84's direction inverts once the owner ruling is applied.** As a pure code fact it is
excess: nine plumbed lines with zero readers. The owner ruled it is three things sharing one
field name — learner-drawn marks (outside the ladder), host-relayed marks (attribution), and
system-drawn marks (this axis) — and only the third is a format concern. Under that reading
the surviving axis is a **deficit**: `design/05` promises arrows-for-sight and the structural
reader has no directed primitive to draw one from, because `structuralReading` emits square
*sets*. That is why `format-surface` may not retire it, and why this RFC must not either.

### 2. The four rows, re-verified at HEAD

The wave brief asks for verification against the current tree because the tree has moved.
It has, and all four findings survive unchanged.

- **`arrows`.** `AssistanceConfig.arrows: "off" | "sight" | "evidence"`
  (`packages/runtime/src/assistance.ts`), defaulted in `SILENT_ASSISTANCE`, permissioned in
  `permittedAssistance` as `mayRequestSplit ? "evidence" : "sight"`, and carried across three
  localStorage upgrade arms in `apps/web/src/lib/assistance-preference.ts`. Its only
  non-plumbing occurrence remains the `<select>` in `AssistanceSettings.svelte`. The board
  overlay input `boardOverlays` in `DrillScreen.svelte` derives from `boardLighting` and
  emits `{orig, brush}` with no `dest`, and chessground draws an arrow only when `dest` is
  present. **Zero renderers.** Confirmed independently of `format-surface`'s count.
- **`SIMULATE_BUDGET_EXCEEDED`.** Declared in the `ServerErrorCode` union
  (`apps/server/src/errors.ts`) and mapped to HTTP 422 in `rest.ts`'s status ladder. The only
  refusal `Service.simulate` raises is `SIMULATE_TOO_LARGE` — a shape cap on
  `maxBranches`/`maxPlies`, not a budget. New here, and the measurement §4 turns into the
  instrument's motivating case: enumerating all **63** union members against the tree,
  `SIMULATE_BUDGET_EXCEEDED` is **the only one with no producer**. Three other codes look
  producerless to a naive grep — `VOICE_UNAVAILABLE`, `TTS_UNAVAILABLE`, `CORPUS_UNAVAILABLE`
  — and each is thrown inside `rest.ts` itself. That near-miss is not an aside; it is the
  reason the instrument must be specified rather than left to a grep.
- **`retryVariants`.** Declared at `schemas/drill_pack.schema.json` `properties.retryVariants`
  and on `DrillPackDocument` (`packages/schema/src/drill-pack/types.ts`), item shape
  `{kind, note?}` with a closed five-member `kind` enum and **no referent field**. Its
  consumers in the tree are `apps/server/src/pack-check.ts` (a *counter*, not a consumer —
  it increments a census tally), `packages/schema/src/drill-pack.test.ts` (enum shape), and
  `apps/server/src/vocabulary-wiring.test.ts` (a vocabulary list). **Zero runtime sites.**
  Re-derived here across all of `content/` plus `schemas/drill_pack.example.json`: **8
  documents, 11 entries**, distributed `different_material_details` 5,
  `related_position_same_idea` 2, `opposite_side` 2, `same_root_new_defense` 1,
  `alternate_plan_class` 1 — reproducing `format-surface` §3.3 exactly, by a second
  measurement.
- **`practical_resistance` vacuity.** Quoted above; unchanged at HEAD.

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

#### 4a. The false negative: 1 of 63

Enumerating the `ServerErrorCode` union and counting producer sites across `apps/` and
`packages/` (excluding `dist/`, tests and fixtures) gives 63 members, of which exactly one —
`SIMULATE_BUDGET_EXCEEDED` — is constructed nowhere. The distance between "declared" and
"declared and unproducible" is one enumeration. It was instead found by
`design/research/campaign-effect-vocabulary.md`, while that dossier was looking for something
else entirely, and it had been shipping to clients as a documented 422 the whole time.

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
| `transitionReading(...)` | committed corpus at `acebb91` | 771 | **265** | 60 | 20 | 22 |
| `irreversibility(...)` | committed corpus at `acebb91` | 771 | **0** | 60 | 20 | 22 |
| `transitionReading(...)` | the corpus D360 measured (`790a4de`, three fewer drafts) | 738 | **245** | 52 | 20 | 22 |
| `irreversibility(...)` | the corpus D360 measured (`790a4de`) | 738 | **0** | 52 | 20 | 22 |

The bottom row reproduces D360's numbers almost exactly — its `pawn_break` 52 and `castled`
20 land on the nose, `last_of_role` 22 against its 21 — which identifies what the row
measured: `irreversibility()`, whose `IrreversibilityDetail` union has three members and
structurally cannot return `clock_zeroed`. But `irreversibility()` is **not that subkind's
producer**. `transitionReading` emits `clock_zeroed` in its own branch immediately after the
`irreversibility()` call, and `matchesTransitionFeature` evaluates the subkind in its own
branch too — both in `packages/runtime/src/transition.ts`. The sentence at
`apps/web/src/lib/transition-sentences.ts` is reached through `renderTransitionObservation`,
imported by `DrillScreen.svelte` and rendered per observation in the template (advisory
`:864`) from the reading built at advisory `:337`. **The string is not dead code; it is the
most-shown irreversibility sentence in the product.**

The edge total is the cross-check: `make expression-census` independently reports
`corpus.transitions: 771` for the same tree, from its own walker. Two instruments walking the
same corpus by different routes agreeing on the denominator is what makes the numerator
trustworthy — and the 738-edge rows are the same measurement over the corpus as it stood
when D360 was written, which is how the misidentified function was isolated rather than
guessed at.

This is the repo's own rule biting the hand that wrote it. *"Fires nowhere" is a coverage
fact; "cannot fire" is a bug* — and D360 asserted the second about something that fires 245
times, because it read one plausible function and stopped. A row that says *"either delete
the subkind and its sentence, or emit it"* would, if actioned, have deleted a live renderer.

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
disposition over D84, D85, D86 or D57.** Their owner is `rfc/format-surface.md`. If that RFC
is withdrawn or its dispositions are reopened, the rows return to `planning/work-register.md`
§2 cluster E unowned, and this RFC does not inherit them.

Three consequences that an implementer must not read past:

1. **`arrows` is not retired here.** The `<select>` in `AssistanceSettings.svelte` stays, the
   `AssistanceConfig.arrows` field stays, and `assistance-preference.ts` gains no version-5
   arm from this RFC. Its `unmeasured` row and revisit obligation are `format-surface`'s.
2. **`SIMULATE_BUDGET_EXCEEDED` is not removed here.** §4a measures it; §3 makes it findable;
   `format-surface` §3.2 retires it.
3. **D57 is not implemented here**, and it is not a declared-vs-executable defect. §1's table
   states its direction for the record because the wave brief asked; the fix is
   `format-surface` §3.5's.

### 2. The residuals `format-surface` named and declined — routed, not taken

Three items sit inside cluster E's subject and outside that RFC's dispositions. Each already
has a destination; this section writes the destination down so the wave can close without
any of them becoming "a later wave", which `rfc/vocabulary-wiring.md` §5c correctly names as
a non-destination.

| Residual | Where it comes from | Destination | Why not here |
|---|---|---|---|
| **The eight unconditionally-free meterable operations** (the second half of D85's row) | `format-surface` §3.2, *"Explicitly not disposed"* | **Owner-gated**, campaign economy. It belongs beside `planning/work-register.md` §3's deck/loadout question | Nothing declares those operations budgeted, so there is no declaration to be in excess of. They are not a declared-vs-executable defect and this RFC has no pointer for them |
| **D86 stage two** — the `refused` → `retired` flip, needing a `variantOf` that is an array with relations for `different_material_details` and `related_position_same_idea` | `format-surface` Open question 4, *"unowned as of this draft"* | **`planning/work-register.md` §4a**, the authoring-expressiveness cluster, which already holds **D105** and whose row states the closure *"needs the `variantOf` array widening (that RFC's Open question 4)"* | §4a's entry condition is a measured count of authored uses per member. §2 of the Motivation supplies exactly that for this member — 2 adopters, 3 retained entries `variantOf` cannot express — so the cluster gains evidence, not another undated deferral |
| **D84's revisit obligation** — the `unmeasured` row expires when a directed structural primitive exists | `format-surface` §3.1 and Open question 2 | Legs (a) and (b) → **landed at `acebb91`** (`feat: add learner board annotation`), which touched neither `assistance.ts` nor `AssistanceSettings.svelte`. Leg (c)'s revisit → whichever RFC lands a directed structural primitive | Two thirds of the owner's split now ship and leg (c) is unchanged, which confirms `format-surface` §3.1's scoping empirically. Implementing leg (c) means inventing a directed structural primitive — a design-tier change (law 5) |

**The retirement precedent, and where it applies.** `rfc/archive/predicate-wave-3.md` retired
`pawn_count` and `piece_reach_count scope:"every"` as **deprecation warnings first, with
schema removal deferred a wave**, because `registered_shapes` rows are immutable. Tested
against each of the four:

- **D86 — applies, and `format-surface` already follows it**, citing
  `PIECE_REACH_SCOPE_EVERY_DEPRECATED` and `PAWN_COUNT_DEPRECATED` by name and emitting
  `RETRY_VARIANTS_NOT_EXECUTABLE` as a `runtimeWarning` rather than an error precisely so the
  seven authored packs do not go red. Stage two is §4a's, above.
- **D85 — does not apply.** The precedent protects *authored content that already declares
  the construct*. No pack, ledger or run record can contain a `ServerErrorCode`; the only
  consumer of the declaration is a client's 422 handling, and a refusal that cannot fire has
  no authored population to warn. Removal is not a corpus edit.
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

#### 3b. The two measurements, restated for declarations

`expression-census` keeps **coverage** and **satisfiability** apart and never lets one stand
in for the other. The declaration census keeps three columns apart, for the same reason:

| Column | Question | What zero means |
|---|---|---|
| **producers** | How many non-test, non-declaration sites can *emit or set* this value? | Zero is a **bug candidate** — the value cannot be produced. This is the "cannot fire" side |
| **consumers** | How many non-test sites *read or branch on* it? | Zero is a **bug candidate** in the other direction — the value is produced and nothing acts on it |
| **corpus firings** | For a value with a corpus population (schema enums, transition subkinds, assistance axes with authored uses), how many times does it occur or fire across `content/`? | Zero is a **coverage fact, never an error** — the `expression-census` rule, unchanged |

**Three constraints keep this honest, and they are the whole difference between an instrument
and a wishlist:**

1. **Zero producers is a *candidate*, not a verdict.** The report says
   `producers: 0`; it never emits `dead`, `unreachable` or `unsatisfiable` for a declaration.
   Static reachability is undecidable and `expression-census` §9 already forbids the
   instrument from claiming what it cannot prove. The verdict is
   `FORMAT_DISPOSITIONS`' to record and an RFC's to make.
2. **A site is classified by what it does, not by where it is.** §4a's near-miss is the
   fixture for this: `VOICE_UNAVAILABLE`, `TTS_UNAVAILABLE` and `CORPUS_UNAVAILABLE` are
   produced inside `rest.ts`, the same module that maps codes to statuses, so a classifier
   that excludes a module rather than a *construction* mislabels three codes at once. A
   producer is a construction or push of the value (`new ServerError("X"`,
   `runtimeIssue("X"`, `observations.push({... subkind: "X"`, an object literal assigning the
   value to the declared key); a consumer is a comparison, a switch arm, or a member test.
   Both are matched syntactically over the module's AST, not by grep, and a site that is both
   counts as both.
3. **Every count carries its denominator and its excluded set.** *"1 of 63, excluding tests,
   fixtures and `dist/`"* is a claim a reader can re-run; *"`SIMULATE_BUDGET_EXCEEDED` is
   dead"* is not. `expression-census`'s existing `EVALUATION_FAULT` isolation applies
   unchanged: a namespace whose enumeration throws is reported as faulted and excluded from
   counts, never reclassified as empty.

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
  corpusFirings: number | null,     // null when the namespace has no corpus population
  dispositionRow: string | null }   // the FORMAT_DISPOSITIONS (pointer, value) key, when one exists
```

`dispositionRow` is the join that makes the two instruments one system: it is `null` exactly
when a declaration has no row in `format-surface`'s register, which is the **sixth silent
state** that RFC names, reported rather than waited for. The census never writes the register
and never proposes a disposition — it reports which subjects have none.

A `totals.declarations` block carries, per namespace, the subject count and the counts of
`producers === 0`, `consumers === 0`, and `dispositionRow === null`.

#### 3d. Where it plugs in

- **`make expression-census`** grows one flag, `DECLARATIONS=1`, defaulting **off** so the
  shipped default output and its consumers do not change. The `Makefile` target already
  threads six optional flags in this exact form.
- **`make verify` — no.** Unchanged from `expression-census` §7d. Report-only.
- **`pack-check`, `shape-check` — nothing new.** No new severity, no new refusal. The
  declaration census refuses nothing; every remedy it enables is an RFC's.
- **`docs/expression-census.md`** gains the section describing the third measurement and the
  three constraints in §3b. That documentation edit is the implementer's, in the landing
  commit, per the completion protocol.

### 4. D360 — refuted, and the remedy is a ledger correction rather than code

The measurement is §4b. The dispositions that follow:

- **No code changes.** `clock_zeroed` is declared, produced (`transitionReading`), evaluated
  (`matchesTransitionFeature`), rendered (`renderTransitionObservation`), authorable in a
  transition predicate, and fires on **265 of 771** committed spine transitions. Neither
  branch of the row's *"either delete the subkind and its sentence, or emit it"* is correct,
  and the first would delete a live renderer.
- **The row is corrected, not deleted.** `design/BACKLOG.md` is a shared register every tier
  writes to (`AGENTS.md`), so the implementer of this RFC flips the D360 row in the landing
  commit with the measurement and the reason it was wrong. Law 7 governs
  `planning/exploration/log.md`, which is append-only and gets the entry rather than an edit.
  **This RFC does not make that edit** — an unaccepted draft that has already rewritten the
  ledger it argues from has removed the reviewer's ability to check it.
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
  consumer (`renderTransitionObservation`), and `corpusFirings: 245`. No hand-read is
  required to see it, and no hand-read produced it.

### 5. `structuralDelta` and `vacationReading` — measured, and deliberately left alone

The ledger row *"`structuralDelta` and `vacationReading` ship and are dead"* calls itself the
*"third member of the dead-vocabulary family"*, which makes it the one row that named this
wave before the wave existed. Verified: both are exported from
`packages/runtime/src/structure.ts` through `packages/runtime/src/index.ts`, and their only
call sites are `packages/runtime/src/structure.test.ts` and a negative import assertion in
`packages/runtime/src/transition.test.ts`.

**Direction: executable-but-not-declarable** — the mirror of D84/D85/D86, and the same
inversion `format-surface` §1b recognises for D96 via D29's precedent. The runtime computes
transition arithmetic that no format vocabulary can ask for.

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
| Pack schema version | **NONE.** 0.25 / 0.26 / 0.27 are held by `format-surface`, `claim-backing` and `pack-graduation`; **0.28 is the next free lane and this RFC leaves it free** |
| Run schema version | **NONE** |
| Migration number | **NONE.** `STORAGE_VERSION` reads **22** at `acebb91` (`apps/server/src/storage.ts`) — the wave brief's *"`STORAGE_VERSION` is 21"* is stale by one, `board-annotation` having landed 22. Recorded as a **position**, not an integer to copy: the next RFC that needs one takes `STORAGE_VERSION + 1` **at landing**, per `board-annotation`'s ratified form, because a draft carrying a shared monotonic integer in its body is `D250`'s subject |
| Shape-entry schema | **NONE** |
| `rfc/README.md` | **not edited by this draft.** Single-writer; claude registers it |
| Persisted shape of anything | **NONE.** The census is report-only and writes one JSON file to a path the caller names |

Nothing this RFC specifies touches a versioned resource, a persisted record, a committed pack
byte or a digest. That is not luck: **a discovery instrument that needed a schema lane would
be a schema change wearing an instrument's name.** The wave brief asked for this to be said
loudly if true, and it is true.

**This table deliberately quotes no lane number for itself**, and the reason is live rather
than theoretical: `DRILL_PACK_SCHEMA_VERSION` read `"0.24"` when this draft opened and
`"0.25"` at `acebb91` a few hours later. A draft that had written *"the predecessor is 0.24"*
into its body would already be wrong. Claiming nothing is what makes this RFC immune to that,
which is the second reason the outcome is the good one.

### 7. Cross-draft coordination

- **`rfc/format-surface.md` (accepted)** — the only RFC with real overlap, and it is
  resolved by cession rather than negotiation (§1). One thing this draft owes its author:
  its §3.3 measurement *"`variantOf` has zero users in `content/`"* is **stale at HEAD** —
  there are two (Motivation §3). The disposition it carries is **unaffected and slightly
  strengthened**; the figure is offered as a correction to be applied by that RFC's author
  or its implementer, not made here, since a second writer editing a third party's accepted
  text is how registers rot. There is no landing-order constraint in either direction:
  this RFC claims nothing that RFC claims and touches no file it touches.
- **`rfc/live-marker-quality.md` (implementing)** — §4's residual sits in its territory and
  proposes nothing. Its narrowing of live `irreversibility` to `last_of_role` is what makes
  `clock_zeroed`'s absence from the live surface a non-issue; that is a citation, not a
  dependency.
- **`rfc/vocabulary-wiring.md` (implementing)** — its §7 owns `variantOf`'s adoption. §2 hands
  it the two new adopters as evidence and claims nothing.
- **`planning/work-register.md` §4a** — receives D86 stage two with the measured count its
  entry condition requires (§2). The register edit is the implementer's, in the landing
  commit.
- **`rfc/engine-leverage.md`, `rfc/claim-backing.md`, `rfc/pack-graduation.md`,
  `rfc/teacher-surface.md`, `rfc/evidence-at-runtime.md`, `rfc/feedback-delivery.md`** — no
  shared resource, no shared file, no shared version lane. Checked, not assumed.

## Deviations from design

**None.** This RFC authors no design-tier reading, proposes no change to `design/00`–`06`,
and mints no law. §1's direction column applies `rfc/archive/defect-sweep.md` §2 and
`rfc/archive/engine-request-contract.md` §3 as written. Law 8 is untouched: the declaration
census counts producers, consumers and firings of vocabulary the repo already ships, and
never evaluates, grades or characterises a chess move.

## Acceptance criteria

1. **Cession is enforceable, not merely stated.** A reviewer can confirm that no file this
   RFC's implementation touches is named in `rfc/format-surface.md` §§3.1–3.5 or §4 as one it
   modifies, and that `AssistanceConfig`, `ServerErrorCode`, `schemas/drill_pack.schema.json`
   and `packages/schema/src/drill-pack/dispositions.ts` are read-only to this
   implementation.
2. **The `declarations` section exists and is populated from live sources.** Running
   `make expression-census DECLARATIONS=1 OUT=…` emits a `declarations` array and a
   `totals.declarations` block covering all four namespaces of §3a, with every subject
   carrying `declaredAt`.
3. **No hand-written subject list.** A test mutates each live source — adds an enum member to
   `schemas/drill_pack.schema.json`, a member to the `ServerErrorCode` union, a value to an
   `AssistanceConfig` axis union, a subkind to `IrreversibilityDetail` — and asserts the
   subject count rises by one in each namespace without any other file changing. A namespace
   that does not move fails.
4. **The 1-of-63 result reproduces.** Over the tree as landed, the `error:` namespace reports
   exactly one subject with `producers: 0`, and it is `SIMULATE_BUDGET_EXCEEDED`. The
   assertion is on the **property** — *the set of zero-producer codes* — not on the integer
   63, so that adding a code with a producer does not turn the test red. (`format-surface`'s
   own round-2 pass found criterion 9's exact counts reintroducing the staleness failure its
   criterion 1 had already been corrected for; this criterion is written against that.) If
   `format-surface` lands first and
   removes the code, the expected set is empty and the criterion still holds.
5. **The three near-miss codes are classified correctly.** `VOICE_UNAVAILABLE`,
   `TTS_UNAVAILABLE` and `CORPUS_UNAVAILABLE` each report `producers >= 1`. A classifier that
   excludes `rest.ts` wholesale fails this criterion, which is the point of it.
6. **D360's refutation reproduces mechanically.** The `runtime:` namespace reports
   `clock_zeroed` with `producers >= 2` and `corpusFirings > 0` over the committed corpus
   (**265 of 771** at `acebb91`),
   and `IrreversibilityDetail`'s three subkinds with their own non-zero firings. A test
   asserts `clock_zeroed`'s firing count is **greater than** `pawn_break`'s — the ordering,
   not the integers, since the corpus grows.
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
11. **The ledger and the log both move in the landing commit.** D360's row is flipped with
    the measurement and the misidentified-detector reason; `planning/work-register.md` §2
    cluster E is marked owned-by-`format-surface` with this RFC named for the residual;
    §4a gains D86 stage two with its measured count; and `planning/exploration/log.md` gains
    the entry. The completion protocol requires the ledger **and** the log in the archiving
    commit, and `engine-request-contract` is the recorded evidence for why the second clause
    exists.
12. **`docs/expression-census.md` describes the third measurement** and §3b's three
    constraints, in the same commit.

## Open questions

1. **Should the `runtime:` namespace be part of `FORMAT_DISPOSITIONS` or stay census-only?**
   `format-surface` §2 declares three namespaces — `schema:`, `assistance:` and `error:` —
   and its gate checks each against a live source. §3a's fourth namespace has no register
   rows and this RFC deliberately does not add one, because widening another RFC's accepted
   register from a draft is the coordination bug this document opens by refusing. The census
   reports `dispositionRow: null` for every `runtime:` subject, which makes the gap visible
   without deciding it. **Offered to `format-surface`'s author; not claimed.** Resolvable
   after that RFC is implemented and the register has real rows to widen.
2. **Should `producers: 0` with `consumers >= 1` be reported more loudly than the reverse?**
   The two zeros are not symmetric in cost: a declaration nothing produces but something
   consumes is a published capability that cannot fire (`SIMULATE_BUDGET_EXCEEDED`, and the
   client 422 handler that waits for it), whereas a declaration something produces and
   nothing consumes is usually an unfinished feature. §3c reports both columns flatly and
   ranks nothing. **Deferred to first use**: the honest input is what the first three
   readers of the report actually chase, and inventing a severity ordering before the report
   exists is exactly the free-parameter hazard `D53` names. Revisit when
   `totals.declarations` has been read against a real tree.

## Changelog

- 2026-08-16: created. Wave 3, cluster E. **Claims nothing versioned** — no pack lane (0.28
  is left free), no run schema, no migration (`STORAGE_VERSION` reads **22**, not the brief's
  21), no persisted shape. **Cedes D84, D85, D86 and D57 to `rfc/format-surface.md`**
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
  `transitionReading`. Corrects one stale figure in an accepted sibling and does not edit it:
  `variantOf` now has **two** committed adopters, not zero, and both retain `retryVariants`
  entries it cannot express. All counts re-derived at **`acebb91`** after `caa8afa` and
  `acebb91` landed mid-draft; `board-annotation` shipping legs (a)/(b) of the `arrows` split
  without touching `assistance.ts` confirms `format-surface` §3.1's scoping empirically, and
  leaves every cluster-E finding standing at HEAD.
