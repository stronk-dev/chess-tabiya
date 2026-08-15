# RFC: Expression census — where does this expression fire?

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-15
- **Design refs:** `design/BACKLOG.md` rows **"No instrument answers 'where does this expression fire?'"** (7th attestation, 2026-08-15) and **"Census measured: 43 of 64 in-shape signatures fire zero times in-shape"** (the numbers §Motivation re-derives); the defect rows **D43** and **D44**; and **D49**, which is **withdrawn, not open** — see §8, which is the reason it was withdrawn. `design/04-content-architecture.md` §0a content-transfer test. *Rows and code sites are cited by title and by symbol name throughout. `apps/server/src/pack-validation.ts` is modified-uncommitted in the working tree this draft was written against and its line numbers moved during drafting (`authoredSpineFens` 170→171, `SHAPE_REFERENCE_NEVER_PRESENT` 457→459, `PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT` 478→480). **Locate by symbol first — every line number in this document is advisory.** Cross-review 2026-08-15 re-derived every figure and re-read every cited site; the `schemas/drill_pack.schema.json` line ranges the first draft carried had already gone stale and have been replaced by `$defs` names.*
- **Exploration gate:** owner ruling 2026-08-12 opened the RFC tier (`rfc/README.md` §Exploration gate). This RFC is opened by the 7th attestation of the ledger row above — the most-attested friction in the repo.
- **Depends on:** `rfc/archive/structural-reading.md` (the expression grammar and `matchesStructuralExpression`), `rfc/archive/predicate-wave-2.md` (`mirrored`, `quantified`), `rfc/archive/predicate-wave-3.md` (`plan_consequence`, `PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT`, `piece_count`, `king_zone`, `piece_distance`, shape-reference relations), `rfc/archive/shape-library.md` (shape entries, `pack.shapes`), `rfc/archive/authoring-frictions.md` §1 (the report-only repo instrument precedent — `make tablebase-walk`)
- **Parent / amends:** amends `shape-check` (`apps/server/src/shape-check.ts`) and `validateShapeEntry` (`apps/server/src/shape-validation.ts`). Introduces no new subsystem, no new persisted state, and no format change.
- **Supersedes / superseded by:** —
- **Planning:** `planning/expression-census/` (once implementing)


> **ROUTED HERE by claude (coordinator), 2026-08-15 — `transition-primitives` open question 8
> is this instrument's problem, not that RFC's.** Its cross-review asked: *a positive-polarity
> condition that is correct but deliberately uncovered by its own pack is still refused* — the
> outpost-shape case one wave later. Its two candidate remedies were a `witness` field (a new
> authoring surface) or downgrading the refusal to a warning (which returns the `timingWindow`
> answer to nothing).
>
> **Neither belongs in a vocabulary wave.** This RFC already specifies the witness protocol —
> a legal FEN plus a *played* SAN continuation, with anchored / evictable / undefended /
> reference roles and a bar of one positive plus one negative control — which is exactly the
> evidence an author would attach to say *"uncovered on purpose, and here is why it is
> satisfiable"*. §5's protocol should therefore state whether a witness can be **authored into
> a pack or entry** rather than only constructed by the tool, and if so, what an inertness
> refusal must do when one is present. That decision belongs with the instrument that defines
> what a witness *is*.
>
> **Answered in §5c** (added at cross-review, 2026-08-15, because a routed question left
> floating is a routed question dropped). The short form: **no, a witness is not a pack or
> entry field, and a witness does not suppress an inertness refusal.** One residual half is
> owner-facing and is filed as open question 8 below with the owner named.

## Register claim

**This RFC claims nothing versioned.** No pack schema version, no run schema
version, no migration number, no shape-entry schema version, no new event, no new
persisted field, no `$id` change. It is authoring tooling plus two validator
codes on existing severities.

This is stated loudly because it is the better outcome, and because the register
lane is contested today. **Lane state re-read at cross-review, 2026-08-15**, from
`rfc/README.md`'s version register: `opening-evidence-path` claims **0.20**
(status *implementing*), `deviation-classes` claims **0.21**,
`transition-primitives` claims **0.22** — the first draft of this RFC said 0.19,
which is stale: commit `d0075e6` rebased it because **0.19 is frozen shut**, the
shared constant being monotonic and 0.20 having landed over it. The working tree
carries `DRILL_PACK_SCHEMA_VERSION = "0.20"` (`packages/schema/src/index.ts`) and
`urn:chess-tabiya:schema:drill-pack:0.20` (`schemas/drill_pack.schema.json` `$id`)
with `opening-evidence-path` mid-landing, so the "landed 0.18" figure circulating
in coordination notes is stale twice over. **None of that matters to this RFC**:
it can land before, between or after any of those three in any order, and
rebasing it costs nothing. Shape-entry stays at `0.3`
(`SHAPE_ENTRY_SCHEMA_VERSION`); run stays at `0.14`; migration numbers are
untouched.

## Summary

Seven content waves have each rebuilt the same throwaway: a walker over authored
positions, a firing census, and an expression prober. The latest one
(`planning/content-era/log.md`, the signature authoring pass, 2026-08-15) spent
**70 of 345 minutes — 20% of the wave's clock** — rebuilding it in a scratchpad,
and that scratchpad is what caught four vacuously-true signatures, two over-loose
ones and five illegal witness lines before they shipped. This RFC specifies the
instrument as repo surface: `make expression-census`, report-only, never writing
content, on the `make tablebase-walk` precedent.

The design's spine is one distinction the seventh attestation forced and the
tooling must encode:

> **"Fires on zero corpus positions" is a coverage fact. "Is unsatisfiable" is a
> bug.** They are different measurements. Only the second justifies refusal.

The instrument therefore reports **two independent things** about every
expression — where it fires in the corpus, and whether it can be true at all —
and never lets one answer stand in for the other.

## Motivation

### The friction, and the cost of not having built it

The ledger row is at 7 attestations and every wave has paid for the same
instrument. What that instrument found once it existed, on shipped content:

| Finding | Measured |
|---|---|
| D43 — `knight-vs-bishop`'s passer fan | 0 of 440 knight-bearing positions; 9 of 615 corpus-wide, none containing a knight |
| D49 (**withdrawn**) — `opposite-castling-race` referenced by two packs | trigger fires on 0 of 668 corpus positions. *Ledgered as a defect, then withdrawn the same day: both references declare `relation: "prospective"`, so no refusal is owed. §8 is the argument. It is listed here because the **measurement** was real and only a census can produce it — not because a defect was found* |
| Orphan entries (D44) | eight of nine had triggers firing on zero corpus positions |
| Vacuously-true conditions | the `mate-two-bishops` defect reproduced **four** times in one pass |
| Over-loose conditions | `closed-centre-chain/white-hold-the-base`, too loose across **two successive drafts**; the first fired on 52 of 77 in-shape positions (`planning/content-era/log.md`). The ledger's summary phrasing "two over-loose ones" counts drafts, not signatures — one signature is the primary-source reading |
| `timingWindow` | fully shipped subsystem, **0 matches in all of `content/`** |

Every one of those was found by a hand-rolled instrument that was then thrown
away. **Note what the D49 row demonstrates and the others do not:** the census's
value is not that every number it prints is a defect. Four of these six rows are
defects; two are measurements that turned out to be correct content. Both
outcomes are the instrument working, and §1 exists so the tool cannot collapse
them.

### Re-measured today, with the shipped evaluator

The numbers above are drawn from corpora of 615 and 668 positions. The corpus has
moved again. Measured 2026-08-15 against `content/drafts` + `content/shapes`
using the shipped `matchesStructuralExpression` and `chessops`, bundled
unmodified `[V]`:

- **43 packs, 694 authored spine positions** (each pack's `start.fen` plus every
  legally-playable spine node, roots included).
- **25 shape entries, 117 plans, 96 non-null signatures, 21 null.**
- **8 of 25 shape triggers fire on 0 of 694 positions:** `doubled-c-pawns`,
  `hanging-pawns`, `iqp-black`, `knight-vs-bishop`, `maroczy-bind`,
  **`opposite-castling-race`**, `up-an-exchange`, `vancura`. Seven are orphans;
  `opposite-castling-race` is referenced by two packs — D49, reproduced today.
- **28 of the 96 non-null signatures fire on 0 of 694 positions.**
- Of the **64** signatures whose entry has a non-empty in-shape denominator,
  **43 fire zero times inside their own shape**, and **30 of those fire somewhere
  in the corpus but never inside their own shape** — D43's exact pattern, thirty
  instances.
- **2 signatures fire on more than half the corpus:**
  `carlsbad/black-central-counter` on 586 of 694, `lucena/white-build-the-bridge`
  on 436 of 694.

None of those five bullets is, by itself, a defect claim. They are the report
this RFC exists to produce.

### Why a tool that conflated the two measurements would have been worse than none

The signature pass proved the distinction is real by measuring both sides of one
expression. `knight-vs-bishop/black-anchor-the-knight` is an 18-arm enumeration
of every square where a Black knight can stand on a strict outpost. It fires on
**0 of 346** corpus positions containing a black knight (0 of 694 today) —
numerically identical to the shipped D43 defect. Yet across all 18 squares and
both defending-pawn configurations, **36 of 36 anchored constructed positions
fire true, 36 of 36 pawn-evictable positions fire false, and 36 of 36
undefended-knight positions fire false**, with all 36 anchored positions also
satisfying the entry's own trigger `[V]`.

It is correct and uncovered. D43's is wrong. **A tool that read "0 firings" as a
defect would have refused good work and, symmetrically, would have blessed
`carlsbad/black-central-counter` at 586 of 694 — a number that says nothing about
correctness either.**

### The conflation is already in the shipped code, once

`apps/server/src/predicate-wave-3-validation.test.ts:41` asserts that a signature
of `piece_count(white, king, count) equal 0` — an expression that cannot be true
of any legal position, because a legal position always has both kings — is caught
by **`PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT`**, a *coverage* refusal. It works,
but only by accident: the leaf-local range check accepts `equal 0` for a king
(`structuralIssues`, `pack-validation.ts:214-218` — `maximum` is 1 for a king and
the guard is `count >= 0 && count <= maximum`), so the bug is detected only
because the expression also happens to fire nowhere. Change the corpus and the
same bug goes undetected; author a *correct* signature that happens to fire
nowhere and the same code refuses it. §8 puts each half where it belongs.

### Scope boundary

**In scope:** measuring where an expression fires; deciding or probing whether it
can fire at all; a Makefile target; an opt-in `shape-check` consumer; one new
refusal and a family of warnings.

**Explicitly out of scope:** any judgement about whether an expression is
*chess-true* or strategically right (law 8 — see §9); any write to `content/`,
any pack or shape mutation, any sidecar emission; any new refusal in `pack-check`;
any change to how expressions are *evaluated* (`matchesStructuralExpression` is
reused verbatim, never reimplemented); authoring new signatures or clearing nulls;
engine or tablebase consultation of any kind — the census is offline, deterministic
and network-free.

## Specification

### §1. The two measurements

For any structural expression `E` the instrument produces two independent
results. They are computed separately, reported separately, and are never
substituted for one another.

**(a) Coverage** — a count over a corpus. *Where does `E` fire in the positions
we happen to have authored?* Coverage is a fact about the corpus, not about `E`.
Its only defect-bearing form is comparative: `E` firing outside its own shape but
never inside it (§3, `FIRES_ONLY_OUTSIDE_SHAPE`). Coverage **never** produces an
error, at any count, in any tool.

**(b) Satisfiability** — a three-valued verdict about `E` itself:

| Verdict | Meaning | Established by | Severity |
|---|---|---|---|
| `unsatisfiable` | no legal position satisfies `E` | a **sound refutation rule** fired (§4) | **error** |
| `satisfiable` | at least one legal position satisfies `E` | an exhibited position — a corpus hit or a witness hit (§5) | report |
| `unknown` | neither established | nothing fired, nothing witnessed | report, **never a refusal** |

Two asymmetries are normative and must be stated in the report itself:

1. **The corpus is a one-directional oracle.** One corpus hit proves
   `satisfiable`. Zero corpus hits prove *nothing* about satisfiability.
2. **The refutation rules are sound and incomplete.** A fired rule proves
   unsatisfiability. Silence proves nothing, and must be reported as `unknown` —
   never as `satisfiable`.

### §2. The corpus it walks

Three position sets, each separately identified in the report.

**(a) Authored spine positions.** For every pack under the corpus roots (default
`content/drafts` and `content/packs`; `content/packs` is empty today and
`content/drafts` holds all 43 packs), the pack's `start.fen` plus every position
reached by legally playing each spine node depth-first.

This is **exactly** what `authoredSpineFens` already computes
(`apps/server/src/pack-validation.ts:171-186`). The census **must export and
reuse that function, not write a second walker.** The one-word change — adding
`export` — is the whole of this RFC's contact with `pack-validation.ts` beyond
§8.

> **The trap the signature pass hit, and why reuse is the fix.**
> `content/drafts/trajectory-legs.browser.json` has **`legs` and no `spine`**
> (verified: its top-level keys are `id, version, title, mode, phase, difficulty,
> start, objective, legs, checkpoints, opponentPolicy, feedbackPolicy,
> provenance`). A hand-rolled walker that requires `spine` skips the file
> silently and reports **42 of 43** packs while claiming to have walked the
> corpus. The shipped helper does not have this bug — it reads `pack.spine ?? []`
> at `:184` and seeds `result` with the root at `:173`, so the pack contributes
> its start position and the count is 43 of 43 (694 positions, of which 693 come
> from the 42 spine-bearing packs). **Reusing the shipped walker is not a style
> preference; it is the fix for the specific error the last wave made.** The
> report nonetheless names packs whose only contribution is a root, under
> `corpus.packsWithoutSpine`, so a thin denominator is visible rather than
> inferred.

Legs contribute no positions of their own — a leg carries `id` and `objective`
only — but they do host expressions (§3b), so leg objectives are censused
against the pack's spine positions and the report says so.

**(b) In-shape subsets.** For each shape entry, the subset of (a) on which the
entry's own `trigger` holds. This is the denominator that makes "fires nowhere"
mean something. It is computed once per entry and reused for all of that entry's
plan signatures.

**(c) Constructed witnesses.** A committed fixture of legal positions used only
for satisfiability (§5), never mixed into coverage counts. Coverage is a fact
about authored content; a witness is a fact about the expression. The report
keeps them in different objects.

### §3. The census

#### §3a. Subjects

Every expression the instrument can reach is a **subject** with a stable site
identifier: a file, a JSON pointer, and a typed subject kind.

| Subject kind | Host | Instances in `content/` today |
|---|---|---|
| `shape_trigger` | shape entry `/trigger` | 25 |
| `shape_plan_signature` | shape entry `/plans/N/success/signature` (non-null) | 96 |
| `pack_success_condition` | `successCondition` arm `kind: "structural_feature"` → `/feature` | 21 |
| `pack_fen_predicate` | `fenPredicate` arm `type: "structuralFeature"` → `/feature` (hosted by `simpleTrigger.fenPredicate` and `authoredBoundary.fenPredicates`) | 17 |
| `pack_window_closing` | `windowClosing` arm `kind: "position"` → `/feature` | **0** |
| `pack_key_point_ground` | `reasoningKeyPoint.ground` arm `kind: "structural"` → `/expression` | **0** |

Counts measured 2026-08-15 across all 43 packs and 25 entries `[V]`. Schema
sites: `schemas/drill_pack.schema.json` `$defs/successCondition` (`:352-359`),
`$defs/fenPredicate` (`:539-546`), `$defs/windowClosing` (`:667-672`),
`$defs/reasoningKeyPoint` (`:796-801`); `schemas/shape_entry.schema.json`
`/trigger` (`:12`) and `$defs/plan` (`:86`).

**Two of those six host sites are not linted at all today, and this RFC records
it rather than fixing it here.** `structuralIssuesInPack`
(`apps/server/src/pack-validation.ts:280-291`) recurses looking for
`object.kind === "structural_feature" || object.type === "structuralFeature"`.
The window-closing arm is `kind: "position"` and the key-point ground is
`kind: "structural"` with the expression under `expression`, not `feature` —
neither matches, so **neither is ever passed to `structuralIssues`**, and an
out-of-range count or an empty quantified domain in either would pass
`pack-check`. Both are evaluated at runtime (`packages/runtime/src/tempo.ts:214`
for window closings; `KEY_POINT_GROUND_FALSE_AT_CHECKPOINT`,
`pack-validation.ts:591`, for key-point grounds). Both have zero instances in
content today, so this is latent, not live. **It needs a `design/BACKLOG.md`
defect row from the ledger's single writer** — this RFC does not edit `design/`.
The census enumerates all six sites regardless, so the first authored instance is
measured on the day it lands.

The `timingWindow` observation from the ledger is confirmed and sharpened: **0 of
43 packs declare `timingWindows` at all** `[V]`, so the subsystem's expression
host has no instances and its lint gap has never been exercised.

#### §3b. Coverage record

For each subject, per corpus position that fires:

```json
{
  "site": {
    "file": "content/shapes/knight-vs-bishop.json",
    "pointer": "/plans/3/success/signature",
    "subject": { "kind": "shape_plan_signature", "shape": "knight-vs-bishop", "plan": "black-anchor-the-knight" }
  },
  "coverage": {
    "corpus": {
      "fires": 0,
      "of": 694,
      "packs": [],
      "plies": [],
      "samples": []
    },
    "inShape": {
      "basis": { "kind": "shape_trigger", "shape": "knight-vs-bishop" },
      "fires": 0,
      "of": 0
    }
  }
}
```

- `packs` — the distinct pack ids in which it fires, each with its own count.
- `plies` — the distinct plies (0 = the pack root) at which it fires, so an
  author can see "only at the tabiya" versus "throughout".
- `samples` — at most 3 firing FENs with their pack id and pointer, for
  eyeballing. Capped so a 586-of-694 report stays readable.
- `inShape` — present only for `shape_plan_signature` and `shape_trigger`
  subjects. `of: 0` means the denominator is empty and every in-shape statement
  about this subject is undefined, not zero.

For a `pack_*` subject the analogue of `inShape` is `inPack`: the same counts
restricted to the pack that hosts the expression. That restriction is the one
place a zero is already a refusal today — see §8.

#### §3c. Observations

The census attaches labels. **Exactly one is an error; every other is a report
label with no severity in the census itself, and at most a warning where a
consumer surfaces it (§7).**

| Label | Condition | Severity |
|---|---|---|
| `UNSATISFIABLE` | a §4 refutation rule fired | **error** |
| `NEVER_FIRES_IN_CORPUS` | `coverage.corpus.fires == 0` | report |
| `NEVER_FIRES_IN_SHAPE` | `inShape.of > 0 && inShape.fires == 0` | report |
| `FIRES_ONLY_OUTSIDE_SHAPE` | `inShape.of > 0 && inShape.fires == 0 && corpus.fires > 0` | report |
| `IN_SHAPE_DENOMINATOR_EMPTY` | `inShape.of == 0` | report |
| `FIRES_ON_MAJORITY` | `corpus.fires > corpus.of / 2` | report |
| `FIRES_ON_DEGENERATE` | fires on at least one degenerate board (§6) | report |
| `SATISFIABILITY_UNKNOWN` | verdict is `unknown` | report |

`FIRES_ONLY_OUTSIDE_SHAPE` is the D43 signal stated exactly: the entry's only
non-null signature fired 9 times corpus-wide and 0 times where its own shape
applied, and the 9 contained no knight. Thirty subjects carry it today.

`IN_SHAPE_DENOMINATOR_EMPTY` is the D49 signal: `opposite-castling-race`'s trigger
fires nowhere, so all four of its plan signatures have an undefined in-shape
result. Distinguishing this from `NEVER_FIRES_IN_SHAPE` is not pedantry — a zero
over an empty denominator carries no information at all, and reporting it as
`0/0` rather than as a failure is the whole difference between an honest and a
misleading report.

**`FIRES_ON_MAJORITY` is deliberately not called "too loose".** The census cannot
know whether firing on 586 of 694 positions is wrong; `carlsbad/black-central-counter`
may be a legitimately common condition. It is a number an author should look at,
and nothing more.

#### §3d. Report envelope

`tabiya.authoring.census.v1`, canonical JSON via `writeCanonicalJson`
(`apps/server/src/sourcing/canonical.ts`), the same emission discipline as
`tabiya.sourcing.walk.v1`:

```json
{
  "schema": "tabiya.authoring.census.v1",
  "corpus": {
    "roots": ["content/drafts", "content/packs"],
    "packs": 43,
    "positions": 694,
    "packsWithoutSpine": ["trajectory-legs-browser"],
    "shapeEntries": 25
  },
  "subjects": [ /* §3b + §3c + §4 + §5 + §6 records */ ],
  "totals": {
    "subjects": 159,
    "neverFiresInCorpus": 28,
    "firesOnlyOutsideShape": 30,
    "inShapeDenominatorEmpty": 8,
    "unsatisfiable": 0,
    "satisfiabilityUnknown": 0
  }
}
```

Determinism is required: subjects sorted by `(file, pointer)`, pack lists sorted
by id, ply lists ascending. Two runs over an unchanged tree must produce
byte-identical output so the report can be diffed across waves — the property
that turns a census into an attestation rather than an anecdote.

### §4. Satisfiability, part one: the sound-refutation arm

**What can be decided structurally, and what cannot.** Full satisfiability over
legal chess positions is not something this grammar can decide cheaply: the
features range over attack maps, pawn geometry, piece counts, king distance and
named structures, and legality (let alone reachability) is a global property of
the board. **This RFC therefore does not claim a decision procedure.** It
specifies a **sound, incomplete refutation procedure**: a set of rules that,
when one fires, *proves* no legal position can satisfy the expression. Silence
proves nothing and yields `unknown`.

The refutation arm is the **compositional extension of a leaf-local family that
already ships.** `structuralIssues` (`pack-validation.ts:188-278`) already refuses
`LINE_SPAN_EMPTY`, `OUTPOST_RANK_OUT_OF_RANGE`, `PIECE_COUNT_OUT_OF_RANGE`,
`PIECE_DISTANCE_OUT_OF_RANGE`, `PIECE_DISTANCE_SELF_TARGET`, `NEGATIVE_FEATURE_COUNT`,
`PAWN_COUNT_OUT_OF_RANGE` and `QUANTIFIED_DOMAIN_EMPTY` — every one of which is an
unsatisfiability proof about a single leaf. What is missing is contradiction
*across* the arms of an `all`, and three leaf cases the range checks let through.
The census adds a second visitor over the same tree; it does not duplicate the
first.

**R1 — delegate.** Run `structuralIssues` on the expression. Any error it returns
is an unsatisfiability proof; report it under its existing code and stop.

**R2 — kings exist.** `piece_count(c, "king", basis: "count")` with
`equal 0` or `atMost 0`, or its negation `not(piece_count(c, "king", "count") atLeast 1)`,
is unsatisfiable for either colour. *This is the exact case the shipped
`predicate-wave-3` test exercises and that the leaf range check lets through*
(`maximum` is 1 for a king, and 0 is within `0..1`).

**R3 — pawns are not on the back ranks.** `pieceOnSquare` naming a pawn of either
colour on rank 1 or rank 8; `passed_pawn(c, sq)` with `sq` on rank 1 or 8; and
`quantified{ quantifier: "some", feature: passed_pawn }` over a square region
whose rank range is contained in `{1, 8}`. Note the quantifier restriction:
`every` over such a region is **vacuously true**, not unsatisfiable — the exact
polarity error that produced the `mate-two-bishops` defect, and it must not be
reintroduced inside the refutation rules themselves.

**R4 — one square, one occupant.** Within an `all`, two `pieceOnSquare` nodes on
the same square with different `piece` values — including one `null` and one
non-null.

**R5 — syntactic complement.** Within an `all`, a child `X` and a child
`not(Y)` where `X` and `Y` are equal after canonicalization
(`canonicalizeJson`, `@chess-tabiya/schema/drill-pack`).

**R6 — empty count interval.** Within an `all`, two `feature` children that are
identical except for `comparison` and `count`, whose implied intervals do not
intersect. `atLeast a` → `[a, ∞)`, `atMost b` → `(-∞, b]`, `equal n` → `[n, n]`.
Applies to `piece_count`, `pawn_count`, `direct_attack_count`, `piece_reach_count`,
`line_blockers` and `piece_distance` — every counted feature. Intersect with the
attainable range the leaf checks already know (`piece_count` maxima 1/8/9/10;
`piece_distance` maxima 7 king / 6 knight / 2 slider) and refute on an empty
result.

**R7 — propagation.** `all` is unsatisfiable if any child is. `any` is
unsatisfiable only if **every** child is. `not` is not propagated (the negation
of an unsatisfiable expression is a tautology, which is satisfiable).

**R8 — `mirrored`.** Recurse into the operand and apply R2–R7 there. This is
sound for R2–R7 specifically because every one of them is a statement about
piece placement and counts, and `mirrorExpression` is placement-preserving up to
the axis — proven in `packages/runtime/src/structure.test.ts:192-193`, which
asserts both `matches(fen, mirrored(E)) == matches(mirrorFen(fen), E)` and that
double mirroring is the identity. Rules that depended on castling rights, en
passant or side to move would **not** be sound under the mirror; none of R2–R7
does, and any future rule that does must be excluded from R8 explicitly.

**Completeness is not claimed and must be stated in the output.** Every
`unknown` verdict carries `"basis": "no refutation rule fired and no witness
exhibited"`. An author reading the report must never be able to mistake it for
"proved satisfiable".

### §5. Satisfiability, part two: the witness arm

When no rule refutes, the honest route to `satisfiable` is to exhibit a position.
Two sources, in order:

**(a) The corpus itself.** Any corpus firing is a witness: those positions are
legally reached by construction (`authoredSpineFens` plays each move through
`Chess.isLegal` and skips anything illegal, `pack-validation.ts:178`). If
`coverage.corpus.fires > 0`, the verdict is `satisfiable` with
`"basis": "corpus"` and the first sample FEN attached. This is free and covers
68 of the 96 non-null signatures today.

**(b) Constructed witnesses.** For the rest, the protocol the signature pass ran
114 assertions through with 114 passing `[V]`, and which refused five illegal
lines during drafting.

A witness is **not a FEN.** It is a legal starting FEN plus a SAN continuation:

```json
{
  "id": "knight-vs-bishop/black-anchor-the-knight/d5-anchored",
  "from": "4k3/8/8/8/8/8/8/4K3 w - - 0 1",
  "sans": ["Kd2", "Kd7", "..."],
  "role": "anchored",
  "expect": true
}
```

The position under test is the one **reached** by playing `sans` from `from`. The
harness plays them through `makeSan`/`parseSan` and `Chess.isLegal` and refuses
an illegal or ambiguous move with `WITNESS_LINE_ILLEGAL`, naming the offending
SAN. Rationale, from the pass: a hand-assembled FEN can be illegal or
unreachable and *looks* fine; the five refused lines were a king walking onto a
covered square, an ambiguous `Rxd1` with two rooks able to reach d1, a pinned
pawn push, a king stepping onto a pawn-attacked square, and a "trade pawns" line
that traded the wrong side's pawn. Positions that are *played into* cannot carry
those errors.

**Witness roles.** The pass's anchored / evictable / undefended triple
generalises: for each discriminating condition the expression claims, one
positive and one negative that differs in exactly that condition.

| Role | `expect` | Purpose |
|---|---|---|
| `anchored` | `true` | the expression's claim holds fully — a positive witness |
| `evictable` | `false` | one supporting condition removed (a pawn can chase the piece off) |
| `undefended` | `false` | a different supporting condition removed (the piece is not defended) |
| `reference` | `false` | a general negative control, related but not satisfying |
| `degenerate` | `false` | a §6 board, asserted not to fire |

**The bar for `satisfiable` by witness:** at least one `expect: true` witness
that fires, **and** at least one `expect: false` witness that does not. A
positive alone proves satisfiability but not discrimination, and a subject with
no negative control is reported with `"basis": "witness_positive_only"` so the
weaker attestation is visible.

**The bar for an enumerated expression** — an `any` over *k* arms, or a
`quantified` over a region of *k* squares — is per-arm: each arm gets its own
positive and its own negatives. This is what made the 18-arm outpost fan
defensible: 36 of 36 anchored fire true, 36 of 36 evictable fire false, 36 of 36
undefended fire false, and all 36 anchored also satisfy the entry's own trigger
`[V]`. The report records per-arm counts, not just an aggregate, because an
aggregate hides a dead arm.

**Where witnesses live.** `apps/server/src/fixtures/expression-witnesses.json`,
committed canonical JSON, keyed by subject site. An author drafting a new
signature may point the tool at a scratch file with
`WITNESSES=<path>` before committing anything. The census **never writes** this
file; witnesses are authored, like content.

**Witnesses are not content and never enter coverage.** A witness FEN is
excluded from `coverage.corpus` counts by construction. Blurring the two would
let an author manufacture coverage by writing witnesses, which is the same
failure as manufacturing evidence.

### §6. The degeneracy probe — the vacuity dual

The four defects the signature pass caught were not unsatisfiable and not
uncovered. They were **over-satisfiable**: true on boards where they should be
meaningless. `knight-vs-bishop/black-fix-one-wing` said "every pawn is on one
side" and fired on a board with no pawns; `rook-4v3-same-side/black-trade-pawns-not-rooks`
counted trading the *last* pawn as success; `carlsbad/black-piece-trades` was
satisfied by the c-pawn being **captured**, because `not(backward_pawn c)` is
true when there is no c-pawn; `up-an-exchange/white-activate-before-cashing`
fired on a pawnless board where every file is open for free. The shipped
ancestor is `mate-two-bishops`, whose original sole success condition was
`not(piece_reach_count … scope "every" … atLeast 0)` — `every` over an empty
piece set is vacuously true, so the negation was false exactly when the bishops
were gone, backwards (`planning/content-era/log.md`, wave entry; the condition
has since been rewritten to a `bishop_on_shade` pair and the `scope: "every"`
form now carries `PIECE_REACH_SCOPE_EVERY_DEPRECATED`).

The census evaluates every subject against a fixed, committed suite of legal
degenerate positions and reports which fire:

| Case | Why |
|---|---|
| `bare_kings` | every piece-set quantifier is empty |
| `king_and_one_white_pawn` / `king_and_one_black_pawn` | one-sided pawn sets |
| `pawnless` | pawn-geometry features over an empty pawn set; every file "open" |
| `bishops_same_shade` | `bishop_on_shade` complements |
| `rooks_only` / `queens_only` | minor-piece sets empty |

`FIRES_ON_DEGENERATE` is a **warning, never an error**, and this is deliberate:
"no pawns remain" is a legitimate success claim, and several authored signatures
say exactly that on purpose. What the label buys is that the author is made to
look, which is all four of those defects would have needed. The report names the
case, so `fires on: pawnless` reads differently from `fires on: bare_kings`.

### §7. Where it plugs in

#### §7a. The Makefile target — the floor

```
make expression-census                                   [OUT=<report.json>]
make expression-census FILE=<shape.json|pack.json>       [OUT=<report.json>]
make expression-census EXPR=<expression.json>            [OUT=<report.json>]
        [CORPUS=content/drafts,content/packs] [WITNESSES=<path>] [DEGENERATE=0]
```

Bundled with esbuild and run under node, exactly as `pack-check`, `shape-check`
and `tablebase-walk` are (`Makefile:23-31`, `:66-69`). No arguments censuses
everything. `FILE=` restricts to one document's subjects, `EXPR=` takes a bare
expression for the author drafting one right now — the case that no shipped tool
answers today.

Its contract is the `tablebase-walk` contract, and the table is written the same
way on purpose:

| | `pack-check` / `shape-check` (shipped) | `expression-census` (this RFC) |
|---|---|---|
| Input | one document that must be well-formed | a document, a bare expression, or the whole library |
| Reads | the document | the document **plus every authored spine position** |
| Writes | nothing | a report to stdout or `--out`; **never** a pack, a shape entry, or a sidecar |
| Network | none | none — offline and deterministic |
| Exits non-zero on | any error-severity issue | a proven `UNSATISFIABLE`, a `WITNESS_LINE_ILLEGAL`, or a read/parse failure. **Never on a coverage number.** |

The "never writes" line is the `make tablebase-walk` precedent held exactly:
that RFC's acceptance criterion (d) was that *no `.evidence.json`,
`.sources.json` or `.job.json` file is written next to the draft*, and this one
inherits it verbatim.

#### §7b. `shape-check` — opt-in, warnings only, plus one refusal

`shape-check` today takes one file and validates it in isolation
(`checkShapeFile`, `apps/server/src/shape-check.ts:8-17`). Two changes:

1. **`validateShapeEntry` gains the refutation arm.** It already calls
   `structuralIssues` on the trigger (`shape-validation.ts:50`) and on each
   non-null signature (`:52`). It additionally runs §4 and pushes
   `STRUCTURAL_EXPRESSION_UNSATISFIABLE` at error severity, at the offending
   pointer, naming the rule that fired. **This is the only new refusal in this
   RFC**, and it is justified because a proven-unsatisfiable expression cannot be
   correct under any corpus.
2. **`shape-check` gains `CORPUS=` and prints coverage as warnings.** With
   `CORPUS=` set (opt-in; absent, behaviour is unchanged), it runs the census
   restricted to the file's subjects and emits `SHAPE_TRIGGER_NEVER_FIRES_IN_CORPUS`,
   `PLAN_SIGNATURE_NEVER_FIRES_IN_SHAPE`, `PLAN_SIGNATURE_FIRES_ONLY_OUTSIDE_SHAPE`
   and `EXPRESSION_FIRES_ON_DEGENERATE` at **warning** severity. The severity is
   already supported end to end: `runtimeWarning` exists
   (`pack-validation.ts:120-122`), `valid` is computed from
   `issues.some(severity === "error")` (`shape-validation.ts:75`), and
   `pack-check` already routes warnings to `console.warn` without failing
   (`pack-check.ts:121-125`). `shape-check`'s `main` currently sends every issue
   to `console.error` (`shape-check.ts:23`) and is corrected to split by
   severity, which is a bug fix the warnings make visible.

Two adjacent frictions are closed by the same edit, at fourth attestation each:
**`shape-check` never passes the `probeFen` the library already accepts**
(`validateShapeEntry`'s options bag, `shape-validation.ts:46`, returning
`probeMatches` at `:78`, exposed on the HTTP lint route at
`apps/server/src/rest.ts:735` and used by the web client at
`apps/web/src/lib/api.ts:844`) — the CLI gains `PROBE=<fen>`, one argument. And
**`shape-check` takes one file per invocation and re-bundles per call** — `FILE=`
accepts a comma-separated list or a glob, so validating all 25 entries is one
bundle.

#### §7c. `pack-check` — nothing new, and that is the point

`pack-check` gains **no new refusal and no new warning**. Its two existing
never-present refusals are already the right instrument at the right scope (§8),
and widening them corpus-wide is exactly the error this RFC exists to prevent.
An author who wants corpus numbers for a pack runs `make expression-census
FILE=<pack.json>`.

#### §7d. The gate — no

`make expression-census` is **not** added to `make verify`
(`Makefile:21`, `pnpm verify` in `package.json`). Coverage is a property of the content corpus, so
gating on it would make an unrelated pack's authoring break an unrelated
implementer's `verify` — the D47 failure mode the ledger already recorded, where
a runtime test asserting a content literal broke concurrent work.

What **is** gated is the part that is a bug by construction: the §4 refutation
arm, which runs inside `validateShapeEntry` and therefore inside every existing
`shape-check` and `ShapeRegistry.loadDefault` call (`shape-registry.ts:51-62`,
which throws `PACK_INVALID` on an invalid entry and is called by `checkPackFile`
at `pack-check.ts:104`). That path is already in `make verify` via the test
suite. So: **satisfiability is gated, coverage is not.** The whole design in one
sentence.

A CI report job that runs the census and publishes the artifact — visible,
diffable, non-blocking — is listed in Open questions rather than specified here.

### §8. Relation to the two shipped "never present" refusals

Two shipped refusals are special cases of this instrument, and neither is
duplicated or widened.

**`PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT`** (`pack-validation.ts:480`) fires
when a pack's `plan_consequence` success condition points at a shape plan whose
signature matches **none of that pack's own `authoredSpineFens`**. In census
terms it is exactly:

> subject = the referenced plan's signature; corpus = **this one pack's** spine
> positions; observation = `NEVER_FIRES_IN_CORPUS`; severity = **error**.

**Why is that an error when the same zero corpus-wide is only a report?**
Because the denominator is different, and the denominator is the argument. The
pack has *declared* that this plan's consequence is gradable on its own authored
line — that is what writing the success condition means. Zero firings across the
positions the pack itself authored contradicts the pack's own claim, and a
self-contradiction is a bug regardless of satisfiability. Zero firings across
*other people's* packs contradicts nothing at all. **The refusal is defensible
precisely because its corpus is the author's own assertion, and it must not be
widened past it.** This RFC forbids that widening by name.

The one thing this RFC does change about it is diagnosis, not severity: today
the message is `never matches an authored spine position`, and the shipped test
uses it to catch `piece_count(king) equal 0`, an *unsatisfiable* expression
(`predicate-wave-3-validation.test.ts:41`). After §7b, that expression is refused
upstream by `STRUCTURAL_EXPRESSION_UNSATISFIABLE` in `validateShapeEntry`, at the
shape entry, with the rule named — where the bug actually is. The coverage
refusal keeps firing for the genuine case: a satisfiable signature that this pack
never reaches. The test is updated to assert both, on two different fixtures.

**`SHAPE_REFERENCE_NEVER_PRESENT`** (`pack-validation.ts:459`) is the trigger
analogue, and it carries a detail that turns out to explain D49. It is guarded by
`reference.relation === "present"`. **Both packs that reference
`opposite-castling-race` declare `relation: "prospective"`** `[V]` — so
`pack-check` correctly declines to refuse, because "prospective" means precisely
*this shape may arise later, not on the authored spine*. D49 is therefore **not a
hole in the refusal**; it is a case the refusal is right to pass, and the reason
nothing in the repo has ever reported it. It needs a census, not a stricter
validator: a prospective reference to an entry whose trigger fires on **0 of 694
corpus positions** is a coverage fact worth an author's attention and never a
refusal, because the shape genuinely might arise in play beyond any authored
spine.

That is the sharpest single vindication of the design in this RFC: the most
alarming finding in the ledger is invisible to every refusal we have, correctly,
and becomes visible only as a report.

### §9. What the instrument may not do

Law 8 (ADR-0005) and its content-door corollary from the signature pass:

- The census **reports where expressions fire**. It never states whether a claim
  is chess-true, never grades a move, never ranks plans, never suggests a
  signature, never proposes a threshold, and never edits an expression.
- A coverage number is **not** a verdict on an expression's correctness in either
  direction. Neither 0 of 694 nor 586 of 694 is evidence about chess.
- The instrument may **not** author, rewrite or "repair" a signature, a null
  reason, or a shape trigger. It measures; humans author. This is the same line
  the signature pass held when `piece_distance` landed: a new measurement can
  retire a *reason* for a null without retiring the null, because writing
  "distance ≥ 4 means the defence holds" would be manufacturing a verdict under a
  census label.
- The instrument may **not** write to `content/`, ever, under any flag.

One evaluation-order fact must be carried in the report's own prose, because
several authored signatures only make sense under it: **a success signature is
read at the end of a run, when the entry's own trigger may no longer hold.**
`lucena/white-run-out-the-checks` is true when a queen exists, which the Lucena
trigger forbids — correct, because the pawn promoted. The in-shape subset is
therefore a **diagnostic denominator, never a normative one**: an in-shape count
of zero can be right by construction, and the census must not imply otherwise.
`lucena/white-build-the-bridge` firing 436 of 694 corpus-wide and 0 of 14
in-shape is the live instance of this today.

### §10. Files

New:

- `apps/server/src/expression-census.ts` — subject enumeration, corpus walk,
  coverage records, report envelope, CLI `main`.
- `apps/server/src/expression-satisfiability.ts` — R1–R8, the witness runner, the
  degeneracy suite.
- `apps/server/src/fixtures/expression-witnesses.json` — committed witnesses.
- `apps/server/src/expression-census.test.ts`,
  `apps/server/src/expression-satisfiability.test.ts`.

Modified:

- `apps/server/src/pack-validation.ts` — `export` on `authoredSpineFens`. Nothing
  else.
- `apps/server/src/shape-validation.ts` — call the refutation arm; emit
  `STRUCTURAL_EXPRESSION_UNSATISFIABLE`.
- `apps/server/src/shape-check.ts` — `CORPUS=`, `PROBE=`, multi-file `FILE=`,
  severity-split output.
- `Makefile` — `expression-census` target and `.PHONY`.
- `docs/shape-library.md`, `docs/content-sourcing.md`, `docs/development.md` —
  document the target alongside `make tablebase-walk`, at implementation time.

Untouched: `schemas/`, `packages/schema/`, `packages/runtime/`, `content/`,
`archive/`, every persisted format, every migration.

## Deviations from design

**None.** This RFC specifies an authoring instrument; it changes no product
behaviour, no learner-facing surface, and no format. Three notes for the record:

1. `design/BACKLOG.md`'s census row states the coverage/satisfiability
   distinction as the requirement; §1 encodes it. No divergence.
2. The row's suggested surface was `make shape-firing FILE=<entry>
   CORPUS=content/drafts`. This RFC names the target **`expression-census`** and
   widens the subject set from shape entries to all six expression host sites,
   because the same wave that asked for `shape-firing` also needed the census for
   pack success conditions and for a bare expression under authoring. The
   narrower name would have shipped a tool that could not answer the question it
   was named after.
3. Two `design/BACKLOG.md` rows this RFC's findings require — the unlinted
   `windowClosing.position` / `reasoningKeyPoint.ground` host sites (§3a), and the
   `predicate-wave-3` test's reliance on a coverage refusal to catch an
   unsatisfiable expression (§8) — must be added by the ledger's single writer.
   This RFC does not edit `design/`.

## Acceptance criteria

Each is a test that fails today because the code does not exist.

1. **Corpus completeness.** `expression-census` over the default roots reports
   `corpus.packs` equal to the pack-file count **derived from the roots at run
   time** (never a literal — D47's rule), lists `trajectory-legs.browser.json`'s
   pack id in `packsWithoutSpine`, and reports a non-zero total position count. A
   test asserts that removing `spine` from a fixture pack does **not** drop it
   from `corpus.packs` — the 42-of-43 trap, pinned.
2. **Reuse, not reimplementation.** A module-graph test asserts
   `expression-census.ts` imports `authoredSpineFens` from `pack-validation.js`
   and `matchesStructuralExpression` from `@chess-tabiya/runtime`, and defines no
   local spine walker and no local expression evaluator. (Precedent:
   `transition-primitives` enforces its exclusion the same way.)
3. **The two measurements are separable.** Against `content/shapes/knight-vs-bishop.json`,
   the census reports `black-anchor-the-knight` with `coverage.corpus.fires == 0`
   **and** `satisfiability.verdict == "satisfiable"` (by witness), carrying
   `NEVER_FIRES_IN_CORPUS` and **no** error. Against a fixture signature of
   `piece_count(white, king, count) equal 0`, it reports
   `verdict == "unsatisfiable"`, rule `R2`, at error severity. **The two cases
   differ in severity while agreeing on the coverage number** — this is the RFC's
   central criterion.
4. **In-shape denominators.** The census reports `IN_SHAPE_DENOMINATOR_EMPTY` for
   all four `opposite-castling-race` plan signatures and its trigger, and
   `FIRES_ONLY_OUTSIDE_SHAPE` for at least `carlsbad/black-central-counter` and
   `lucena/white-build-the-bridge`. A regression test pins the count of subjects
   carrying each label as *derived from the artifacts at run time*, never as a
   literal — D47's rule.
5. **Degeneracy.** Re-inserting `mate-two-bishops`'s original condition
   (`not(piece_reach_count … scope "every" … atLeast 0)`) into a fixture produces
   `FIRES_ON_DEGENERATE` naming `bare_kings`, at **warning** severity, and the
   run still exits zero.
6. **Witness legality.** A witness whose SAN line contains an illegal or
   ambiguous move is refused with `WITNESS_LINE_ILLEGAL` naming the SAN, and the
   subject's verdict is not upgraded to `satisfiable`.
7. **Refutation soundness.** A property test over generated expressions asserts
   that **every** expression the refutation arm calls `unsatisfiable` fires on
   none of the corpus positions, none of the degenerate boards and none of the
   witnesses. (One-directional by design: `unknown` expressions are unconstrained.)
8. **Report-only.** After a full census run with `OUT=` set, a test asserts no
   file under `content/` changed — mtime and content digest — and that no
   `.evidence.json` / `.sources.json` / `.job.json` was created anywhere.
9. **Determinism.** Two consecutive runs over an unchanged tree produce
   byte-identical `OUT=` files.
10. **No new gate.** `make verify` is unchanged; a test asserts
    `expression-census` is not among the targets `verify` depends on. Meanwhile
    `validateShapeEntry` refuses a proven-unsatisfiable trigger, so
    `ShapeRegistry.loadDefault` — and therefore `pack-check` — would fail on one.
11. **`pack-check` unchanged in severity.** The full existing pack corpus emits
    exactly the same issue codes and severities before and after this RFC.
12. **The shipped test is re-pointed.** `predicate-wave-3-validation.test.ts`
    asserts `STRUCTURAL_EXPRESSION_UNSATISFIABLE` on the `piece_count(king) equal 0`
    fixture and keeps `PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT` on a *satisfiable*
    signature that the pack's own spine never reaches — the two halves separated.

## Open questions

1. **Does `FIRES_ON_DEGENERATE` ever earn error severity?** It is a warning here
   because "no pawns remain" is a legitimate claim, but the defect it catches has
   now shipped once and been reproduced four times in a single pass. An
   alternative is per-expression opt-out: an author who means it declares
   `degenerate: "intended"` and silence becomes an error. That needs a schema
   field, which would break this RFC's "claims nothing versioned" property.
   Deferred; owner ruling wanted before any wave-4 predicate work.
2. **Should `FIRES_ON_MAJORITY`'s threshold be 50%?** It is a round number, not a
   measured one. Only 2 of 96 subjects exceed it today, and both look
   investigable — but n=2 is not a calibration. Revisit after one wave of use.
3. **Does the corpus include `content/candidates/`?** Candidate directories hold
   sourcing artifacts, not packs, and are excluded here. If candidate-stage
   position seeds become a useful denominator for pre-authoring probes, that is
   an additive `CORPUS=` root, not a redesign.
4. **A CI report job.** Publishing a diffable census artifact per commit would
   turn "eight triggers fire nowhere" from a thing someone notices into a thing
   that visibly changes. It is deliberately not specified here because a
   non-blocking CI job with no owner becomes noise. Needs an owner decision on
   who reads it.
5. **How far should the refutation arm grow?** R1–R8 are the rules with obvious
   soundness proofs. Richer ones exist — pawn-structure impossibility, attack-count
   bounds given a piece census, `named_structure` conjunctions — each needing its
   own proof, and an unsound rule refuses correct authored work. The bar proposed:
   **no rule lands without a property test showing it never refutes an expression
   that any corpus position, witness or degenerate board satisfies** (criterion 7).
   Whether that bar is enough is an owner question.
6. **Ledger rows.** Two findings above need `design/BACKLOG.md` rows written by
   the ledger's single writer (see §Deviations note 3). This RFC cannot be
   `accepted` until they exist, per the "an idea missing from the ledger is a
   process bug" rule.
7. **Landing order.** This RFC touches `pack-validation.ts` (one `export`) and
   `shape-validation.ts`, both of which `transition-primitives` and
   `deviation-classes` also edit. Since it claims no shared versioned resource,
   the collision is textual, not semantic, and it should land **last** of the
   in-flight set to absorb the rebase rather than impose it. Confirm in
   `rfc/README.md`'s claim-order note — which this draft does not edit.

## Changelog

- 2026-08-15: created. Register claim: nothing versioned. All corpus figures
  measured against the working tree on this date with the shipped evaluator; the
  numbers will drift with the corpus and are dated for that reason.
