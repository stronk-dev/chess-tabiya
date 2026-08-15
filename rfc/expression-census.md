# RFC: Expression census — where does this expression fire?

- **Status:** implementing
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


> **OWNER RULINGS 2026-08-15 (late) — open questions 4 and 8 are decided.**
> **Q8 — the severity stays ERROR.** The owner took this RFC's own recorded recommendation:
> keep `NEVER_PRESENT` at error and ship the §5c diagnosis. `transition-primitives` carries the
> matching ruling; the question is closed in both files rather than pointing at each other.
> **Q4 — NO CI job yet: the census ships as a command only.** The reasoning the RFC itself gave
> is the reasoning that decided it — *a non-blocking CI job with no owner becomes noise*. It runs
> at authoring and review time via `make expression-census`. Revisit once the numbers are
> demonstrably being acted on; a gate that fails on coverage is refused outright, since coverage
> is a fact rather than a defect and gating it would refuse correct-but-uncovered work at CI
> instead of at load.

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

**All six figures were independently re-derived at cross-review (2026-08-15)**
with a throwaway bundle over the shipped `matchesStructuralExpression` — the
eighth time this instrument has been rebuilt to check a number, which is itself
the argument — and every one reproduced exactly, including the two majority
signatures and the eight-entry zero-firing trigger list `[V]`.

#### Reconciling the denominator with the R3 dossier

`design/research/census-hint-false-positives.md` walks **37 packs / 634
transitions**; this section walks **43 packs / 694 positions**. They do not
conflict, and the difference is exactly two things — both measured, neither an
error `[V]`:

| | R3 dossier | This census |
|---|---|---|
| Pack files | 37 | 43 |
| Excluded by name | `.evidence` / `.job` / `.sources` **and `.browser`** (`tools/r1r2-primitives-harness/corpus.ts`, the `.browser` exclusion is in the same regex) | `.evidence` / `.job` / `.sources` only |
| Unit counted | spine **transitions** (edges) | spine **positions** (nodes, roots included) |
| Result | 634 | 694 = 651 transitions + 43 roots |

Run this census over the dossier's 37 non-`.browser` packs and it reports **634
transitions / 671 positions** — the dossier's number to the unit `[V]`. The six
`.browser` packs contribute 17 transitions and 23 positions.

**That raises a question this RFC must answer rather than inherit:
`content/drafts` mixes 37 authored packs with 6 browser test fixtures, and every
other measuring instrument in the repo excludes the fixtures by name.** This RFC
counts them, and the consequence is visible in its own marquee example: the
`packsWithoutSpine` pack, `trajectory-legs.browser.json`, **is** a browser
fixture, so under the dossier's convention the 42-of-43 trap has no live instance
at all today. The trap is still real — `authoredSpineFens` reading `pack.spine ??
[]` is what makes it not fire — but the fixture it is pinned to is a test asset,
and acceptance criterion 1 must not read as though a `.browser` pack were
authored content. Filed as open question 9; the census reports the split
regardless (`corpus.packs` alongside `corpus.fixturePacks`), so no consumer has
to guess which convention produced a number.

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

### The conflation is already in the shipped code — twice, not once

`apps/server/src/predicate-wave-3-validation.test.ts` uses the **same**
unsatisfiable expression, `piece_count(white, king, count) equal 0` — an
expression that cannot be true of any legal position, because a legal position
always has both kings — to exercise **both** shipped coverage refusals:

| Test (locate by name, not line) | Fixture | Asserted code |
|---|---|---|
| *"resolves the Carlsbad plan consequence and refuses every unresolved form"* | `impossibleShape.plans[0].success.signature` | `PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT` |
| *"normalizes shape reference relations and refuses duplicate or absent present references"* | `never.trigger` | `SHAPE_REFERENCE_NEVER_PRESENT` |

Both work, and both work only by accident: the leaf-local range check accepts
`equal 0` for a king (`structuralIssues` — `maximum` is 1 for a king and the
guard is `count >= 0 && count <= maximum`), so the bug is detected only because
the expression also happens to fire nowhere `[V]`. Change the corpus and the same
bug goes undetected in both places; author a *correct* signature or trigger that
happens to fire nowhere and the same code refuses it. §8 puts each half where it
belongs and criterion 12 re-points **both** tests, not one — the first draft of
this RFC found only the plan-consequence instance, which is the same
single-instance reading error the instrument exists to prevent.

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

**Which files are packs.** `content/drafts` holds **128 `.json` files and 43
packs** `[V]`; the rest are `.evidence.json` / `.job.json` / `.sources.json`
sidecars. The discriminator is the one already used repo-wide — exclude
`/\.(evidence|job|sources)\.json$/` — stated here because a census that silently
treated a sidecar as a pack, or crashed on one, would fail in exactly the mode
§2's whole trap paragraph is about. `.browser.json` files **are** packs and are
counted, but are reported separately as `corpus.fixturePacks` (6 today) because
the R3 harness excludes them and a number that does not say which convention
produced it is not diffable across waves. See §Motivation's reconciliation table
and open question 9.

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

Counts measured 2026-08-15 and re-derived at cross-review `[V]` across all 43
packs and 25 entries. Schema sites, **by `$defs` name only — the line ranges the
first draft carried had already gone stale by the time it was reviewed, which is
the argument for not writing them down**: `schemas/drill_pack.schema.json`
`$defs/successCondition` (the `kind: "structural_feature"` arm),
`$defs/fenPredicate` (the `type: "structuralFeature"` arm), `$defs/windowClosing`
(the `kind: "position"` arm), `$defs/reasoningKeyPoint` (`ground`'s
`kind: "structural"` arm); `schemas/shape_entry.schema.json` `/trigger` and
`$defs/plan` (`success.signature`, `oneOf` a `structuralExpression` or `null`).

All 17 `pack_fen_predicate` instances today sit at
`/checkpoints/{i}/trigger/fenPredicate` `[V]`; `authoredBoundary.fenPredicates`
is a live host in the schema with zero instances, and is enumerated for the same
reason the two zero-instance sites below are.

**Two of those six host sites are not linted at all today, and this RFC records
it rather than fixing it here.** `structuralIssuesInPack`
(`apps/server/src/pack-validation.ts`) recurses looking for
`object.kind === "structural_feature" || object.type === "structuralFeature"`.
The window-closing arm is `kind: "position"` and the key-point ground is
`kind: "structural"` with the expression under `expression`, not `feature` —
neither matches, so **neither is ever passed to `structuralIssues`**, and an
out-of-range count or an empty quantified domain in either would pass
`pack-check`. **Verified by instrumentation, not by reading:** a recursive walk
over all 43 packs counting the exact predicate `structuralIssuesInPack` uses
returns **38 = 21 + 17**, and the two latent arms return **0 and 0** `[V]`, so
the reachable set is precisely the two linted kinds. Both latent arms are
evaluated at runtime (`packages/runtime/src/tempo.ts` for window closings;
`KEY_POINT_GROUND_FALSE_AT_CHECKPOINT` in `pack-validation.ts` for key-point
grounds). Both have zero instances in content today, so this is latent, not live.
**It needs a `design/BACKLOG.md` defect row from the ledger's single writer** —
this RFC does not edit `design/`. The census enumerates all six sites regardless,
so the first authored instance is measured on the day it lands.

**This RFC does not widen `structuralIssuesInPack` to reach them**, and that is
deliberate rather than an omission. Widening it would make `pack-check` refuse
content it accepts today the moment anyone authors the first
`windowClosing.position` or `reasoningKeyPoint.ground.kind: "structural"` — a new
refusal on a surface this RFC has promised (§7c) to leave alone, and one that
would land as a surprise on whichever RFC first authors those arms. The census
measures them from day one; the lint gap closes in whichever RFC gives those arms
their first instance, which is where the fixture to test it against will exist.

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
| `EVALUATION_FAULT` | the shipped evaluator threw on at least one position (§3d) | report |

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
    "fixturePacks": ["immediate-guard-browser", "line-boundary-browser", "outcome-hold-browser", "outcome-resist-browser", "stated-reasoning-browser", "trajectory-legs-browser"],
    "positions": 694,
    "transitions": 651,
    "packsWithoutSpine": ["trajectory-legs-browser"],
    "shapeEntries": 25
  },
  "subjects": [ /* §3b + §3c + §4 + §5 + §6 records */ ],
  "totals": {
    "subjects": 159,
    "neverFiresInCorpus": 36,
    "firesOnlyOutsideShape": 30,
    "inShapeDenominatorEmpty": 40,
    "unsatisfiable": 0,
    "satisfiabilityUnknown": 36
  }
}
```

**Those totals are the measured ones, and three of them were wrong in the first
draft — in the direction that matters, so they are worth stating explicitly.**
`totals` counts **subjects**, not signatures, and the first draft filled it with
signature-only numbers `[V]`:

| Total | First draft | Measured | Why |
|---|---|---|---|
| `subjects` | 159 | **159** | 25 triggers + 96 signatures + 21 success conditions + 17 fen predicates ✓ |
| `neverFiresInCorpus` | 28 | **36** | 28 signatures **plus the 8 triggers**; 0 of the 38 pack subjects fire nowhere |
| `firesOnlyOutsideShape` | 30 | **30** | ✓ — shape-signature subjects only, by construction |
| `inShapeDenominatorEmpty` | 8 | **40** | 8 triggers **plus the 32 signatures living under them** (96 − 64). The first draft counted *entries*, and §3c's own label is per-subject — criterion 4 already implies 5 for `opposite-castling-race` alone |
| `satisfiabilityUnknown` | 0 | **36** | see below |

**`satisfiabilityUnknown: 0` was the worst of the three, because it contradicts
§1.** On day one the witness fixture is empty, so every one of the 36
zero-firing subjects is `unknown` — that is the *honest* report, and an example
envelope printing zero would teach a reader that the tool resolves
satisfiability for everything, which is precisely the over-claim §1's second
asymmetry forbids. The number falls as witnesses are authored and is never
expected to reach zero.

Determinism is required: subjects sorted by `(file, pointer)`, pack lists sorted
by id, ply lists ascending. Two runs over an unchanged tree must produce
byte-identical output so the report can be diffed across waves — the property
that turns a census into an attestation rather than an anecdote.

**Evaluator faults are a report value, never a crash and never a verdict.**
`matchesStructuralExpression` can throw: `named_structure` under `mirrored`
throws `TypeError` from `mirrorFeature` `[V]`, and `positionFromFen` throws on an
unparseable FEN. A subject whose evaluation throws on some position records
`coverage.corpus.faults` with the count and the first message, is excluded from
every count it could contaminate, and is labelled `EVALUATION_FAULT` at **report**
severity. It must not be reported as `fires: 0` — a fault is not a coverage
observation — and it must never be promoted to `unsatisfiable`, because a
throwing expression is malformed, not refuted.

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
already ships.** `structuralIssues` (`pack-validation.ts`) already refuses
`LINE_SPAN_EMPTY`, `OUTPOST_RANK_OUT_OF_RANGE`, `PIECE_COUNT_OUT_OF_RANGE`,
`PIECE_DISTANCE_OUT_OF_RANGE`, `PIECE_DISTANCE_SELF_TARGET`, `NEGATIVE_FEATURE_COUNT`,
`PAWN_COUNT_OUT_OF_RANGE` and `QUANTIFIED_DOMAIN_EMPTY`. The nearest shipped
relative is `MATERIAL_EQUALITY_UNSATISFIABLE` (`pack-validation.ts`, from
`rfc/archive/validator-integrity.md` §8a) — the precedent that an
**unsatisfiability proof already earns error severity in this repo**, and the
naming this RFC's `STRUCTURAL_EXPRESSION_UNSATISFIABLE` follows. What is missing
is contradiction *across* the arms of an `all`, and three leaf cases the range
checks let through. The census adds a second visitor over the same tree; it does
not duplicate the first.

> **The first draft's framing sentence was false, and its R1 was unsound.**
> It read *"every one of which is an unsatisfiability proof about a single
> leaf"*. That is not true of the shipped family, and cross-review produced
> **seven executed counterexamples** — each an expression that `structuralIssues`
> returns an **error** for and that the shipped evaluator nonetheless scores
> **true** on the standard initial position `[V]`:
>
> | Expression | `structuralIssues` | `matchesStructuralExpression` |
> |---|---|---|
> | `any[ piece_count(w,knight,count) atLeast 1, piece_count(w,king,count) equal 2 ]` | `PIECE_COUNT_OUT_OF_RANGE` | **true** |
> | `not(feature outpost{white, a2})` | `OUTPOST_RANK_OUT_OF_RANGE` | **true** |
> | `line_blockers{a1→a2} atMost 0` | `LINE_SPAN_EMPTY` | **true** |
> | `piece_distance{white king → white king} equal 0` | `PIECE_DISTANCE_SELF_TARGET` | **true** |
> | `piece_count(w,knight,count) atMost 12` | `PIECE_COUNT_OUT_OF_RANGE` | **true** |
> | `piece_distance{white rook → a1} atMost 5` | `PIECE_DISTANCE_OUT_OF_RANGE` | **true** |
> | `pawn_count(white,count) atMost 9` | `PAWN_COUNT_OUT_OF_RANGE` | **true** |
>
> Three independent causes, and each has to be closed separately:
>
> 1. **`structuralIssues` has no polarity or propagation awareness.** It recurses
>    through `not` and through `any` exactly as it does through `all`. Delegating
>    the *whole expression* to it therefore short-circuits R7 — which states the
>    correct propagation two rules later, in the same section.
> 2. **Range codes are not direction-aware.** The guard is
>    `count >= 0 && count <= maximum` regardless of `comparison`. `atMost n` with
>    `n` **above** the attainable maximum is a *tautology*, not a contradiction,
>    and it trips the same code as `equal n` above the maximum, which is a
>    contradiction. The same is true of `PAWN_COUNT_OUT_OF_RANGE` and
>    `PIECE_DISTANCE_OUT_OF_RANGE`.
> 3. **Some codes are malformedness or policy, not impossibility.**
>    `LINE_SPAN_EMPTY` on an `atMost` comparison is *vacuously true* (an empty
>    span has 0 blockers); `PIECE_DISTANCE_SELF_TARGET` measures a piece against
>    itself and yields distance 0; `STRUCTURAL_EXPRESSION_TOO_DEEP` is a nesting
>    budget; `MIRRORED_NAMED_STRUCTURE` makes the evaluator **throw**, which is
>    §3d's `EVALUATION_FAULT`, not a refutation.
>
> **An unsound R1 is the single worst defect this instrument could ship** — it
> refuses correct authored work under an error code that says the author is
> wrong, which is the exact failure §Motivation says a naive tool would have
> committed against the outpost fan. R1 is restated below.

**R1 — leaf-local delegation, direction-aware, allow-listed.** Not "run
`structuralIssues` on the expression". Instead:

1. Walk the expression yourself and apply `structuralIssues` to **one leaf at a
   time** (`kind: "feature"`, `kind: "pieceOnSquare"`, `kind: "quantified"`),
   never to a composite node.
2. A leaf error is a proof that **that leaf** is unsatisfiable only if its code
   is on this allow-list, with the stated direction condition:

   Write `[lo, hi]` for the leaf's attainable range **on its own basis** — the
   guard's own arithmetic, `[0, maximum]` on `basis: "count"` and
   `[-maximum, maximum]` on the difference basis.

   | Code | Refutes the leaf when |
   |---|---|
   | `PIECE_COUNT_OUT_OF_RANGE`, `PAWN_COUNT_OUT_OF_RANGE`, `PIECE_DISTANCE_OUT_OF_RANGE` | `equal n` with `n ∉ [lo, hi]`; `atLeast n` with `n > hi`; `atMost n` with `n < lo`. **Never for `atMost n` with `n > hi` or `atLeast n` with `n < lo` — those are tautologies** |
   | `NEGATIVE_FEATURE_COUNT` | `equal`/`atMost` with a negative count (an `atLeast` negative count is a tautology) |
   | `OUTPOST_RANK_OUT_OF_RANGE` | always — the evaluator hard-returns false outside relative ranks 4–6, in both the leaf and quantified-region forms |
   | `PIECE_DISTANCE_ROLE_UNSUPPORTED` | always — `emptyBoardDistance` is undefined for a pawn, so the feature is false everywhere |
   | `QUANTIFIED_DOMAIN_EMPTY` | never by itself; the evaluator **throws** on such a region, so this is `EVALUATION_FAULT` |

   Every other code `structuralIssues` can emit — `LINE_SPAN_EMPTY`,
   `PIECE_DISTANCE_SELF_TARGET`, `STRUCTURAL_EXPRESSION_TOO_DEEP`,
   `MIRRORED_NAMED_STRUCTURE`, `STRUCTURAL_KIND_UNRECOGNISED` — is **excluded by
   name** and never contributes to a refutation. It is still surfaced, under its
   own existing code and severity, exactly as it is today.
3. **No leaf-local refutation applies to `piece_reach_count` with
   `scope: "every"`, under any code.** `values.every(...)` over an empty piece set
   is *true* whatever the comparison says, so no constraint on the count can make
   the leaf false. This is the same carve-out R6 needs, stated once at the leaf so
   it cannot be forgotten in either place; it is the `mate-two-bishops` shape and
   §6 is where such a leaf is surfaced instead.
4. Combine leaf verdicts through **R7 and only R7**. A leaf refutation refutes
   the whole expression only where R7 says it propagates.

The allow-list is normative and closed: **a code that is not on it may not be
used to refute, and adding one requires the criterion-7 property test.**

**R2 — kings exist.** `piece_count(c, "king", basis: "count")` with
`equal 0` or `atMost 0`, or its negation `not(piece_count(c, "king", "count") atLeast 1)`,
is unsatisfiable for either colour. *This is the exact case the shipped
`predicate-wave-3` test exercises **twice** and that the leaf range check lets
through* (`maximum` is 1 for a king, and 0 is within `0..1`).

`basis: "count"` is load-bearing and must be checked, not assumed. The evaluator
computes `basis === "count" ? own : own - other` `[V]`, so on the difference
basis the king count is identically 0 and `equal 0` is a **tautology** — the
mirror image of the refusal. R2 fires only on the `count` basis; the difference
basis is deliberately left to `unknown`.

**R3 — pawns are not on the back ranks.** `pieceOnSquare` naming a pawn of either
colour on rank 1 or rank 8; `passed_pawn(c, sq)` with `sq` on rank 1 or 8; and
`quantified{ feature: passed_pawn }` over a square region whose rank range is
contained in `{1}` or `{8}` — **under either quantifier.**

> **Cross-review correction.** The first draft restricted this to
> `quantifier: "some"` and justified it by saying `every` over such a region is
> *"vacuously true, not unsatisfiable — the exact polarity error that produced
> the `mate-two-bishops` defect"*. **That reasoning is wrong**, and it is wrong
> in a way worth stating because it misplaces the vacuity trap. Vacuity requires
> an **empty domain**. A `quantified.over.squares` domain is *never* empty: the
> evaluator builds it as files × ranks and `squares()` **throws** if the region
> is unordered (which `QUANTIFIED_DOMAIN_EMPTY` guards). A rank-1 region has
> eight squares, `every` evaluates eight false results, and the expression is
> **false on every legal position** — genuinely unsatisfiable. Measured: `some`
> and `every` over `a1–h1 / passed_pawn(white)` both return `false` on the
> initial position and on bare kings `[V]`.
>
> The real vacuity trap lives on features scoped over a **piece set**, which can
> be empty — `piece_reach_count` with `scope: "every"` over a side with no such
> piece is the `mate-two-bishops` defect exactly, and §6 is where that is caught.
> Keeping the two straight matters for R6 below, where conflating them is not
> merely conservative but unsound.

**R4 — one square, one occupant.** Within an `all`, two **direct-child**
`pieceOnSquare` nodes on the same square with different `piece` values —
including one `null` and one non-null. Sound because the evaluator's
`pieceOnSquare` is a total, exact test — `piece === null ? square is empty :
occupant.color === piece.color && occupant.role === piece.role` `[V]` — with no
partial-match form, so two distinct `piece` values on one square are mutually
exclusive. "Direct child" is normative: a `pieceOnSquare` wrapped in `not` is a
`not` node and is R7's business, not R4's.

**R5 — syntactic complement.** Within an `all`, a **direct child** `X` and a
direct child `not(Y)` where `X` and `Y` are equal after canonicalization
(`canonicalizeJson`, `@chess-tabiya/schema/drill-pack`). Sound for the trivial
reason: `matchesStructuralExpression` is a pure function of `(fen, expression)`,
so `X ∧ ¬X` is false at every position. Canonical equality is a *sufficient*
condition for identity, never a necessary one — R5 misses semantic complements
and that is incompleteness, which §4 permits.

**R6 — empty count interval.** Within an `all`, two `feature` children that are
identical except for `comparison` and `count`, whose implied intervals do not
intersect. `atLeast a` → `[a, ∞)`, `atMost b` → `(-∞, b]`, `equal n` → `[n, n]`.
Intersect with the attainable range the leaf checks already know (`piece_count`
maxima 1/8/9/10; `piece_distance` maxima 7 king / 6 knight / 2 slider) and refute
on an empty result.

**R6 applies to `piece_count`, `pawn_count`, `direct_attack_count`,
`line_blockers` and `piece_distance` — and to `piece_reach_count` it does NOT.**

> **Cross-review found R6 unsound as first drafted, with two executed
> counterexamples.** The rule's hidden premise is that both children constrain
> *the same single number*. That premise holds for five of the six features and
> **fails for `piece_reach_count`**, whose comparison is quantified over a piece
> set rather than applied to a scalar (`values.some(...)` for `scope: "any"`,
> `values.every(...)` for `scope: "every"`):
>
> - **`scope: "any"`.** On `7k/8/8/8/3R4/8/6PP/6KR w - - 0 1` the two rooks reach
>   very different numbers of squares, so `piece_reach_count(white, rook, any)
>   atLeast 10` is **true** and `… atMost 3` is **true**, and their conjunction
>   is **true** `[V]`. First-draft R6 computes `[10,∞) ∩ (-∞,3] = ∅` and calls a
>   satisfiable expression unsatisfiable.
> - **`scope: "every"`.** On bare kings the white bishop set is empty, so
>   `values.every(...)` is vacuously true for *both* comparisons and the
>   conjunction is **true** `[V]` — the `mate-two-bishops` vacuity, reappearing
>   inside the rule written to catch impossibility.
>
> This is the failure mode open question 5 names as the bar for any new rule, and
> it was already present in the founding set. Verified separately: **no shipped
> shape expression contains a `piece_reach_count` R6 pair today** — one candidate
> site exists in all of `content/shapes`,
> `rook-4v3-same-side/black-trade-pawns-not-rooks`'s
> `piece_count(black, pawn) atLeast 1 ∧ atMost 2`, whose interval `[1,2]` is
> non-empty `[V]`. So the unsoundness is latent, not live — which is exactly how
> a rule that refuses correct future work gets shipped unnoticed.
>
> The general form of the exclusion, which any wave-4 rule must apply: **R6 is
> sound only for a feature whose value is a single scalar function of the
> position.** A feature that existentially or universally quantifies over a piece
> set is excluded, and a feature that can be vacuously true over an empty set is
> excluded twice over.

**R7 — propagation.** `all` is unsatisfiable if any child is. `any` is
unsatisfiable only if **every** child is. `not` is not propagated (the negation
of an unsatisfiable expression is a tautology, which is satisfiable).
`quantified` propagates from the templated leaf only under `quantifier: "some"`;
under `every` the leaf verdict does not lift, because a universally quantified
false leaf is still false — which is a *stronger* claim R3 makes directly, not
one R7 may infer. **R7 is the only combinator in this section**, and every other
rule states its verdict about a single node so that R7 can do the lifting.
Sound: it is the standard bottom-up propagation for `∧`/`∨` and it declines the
one case (`¬`) where propagation reverses.

**R8 — `mirrored`.** Recurse into the operand and apply R2–R7 there. This is
sound for R2–R7 specifically because every one of them is a statement about
piece placement and counts, and `mirrorExpression` is placement-preserving up to
the axis — proven in `packages/runtime/src/structure.test.ts` (the fast-check
property in *"mirrors expressions and positions consistently"*), which asserts
both `matches(fen, mirrored(E)) == matches(mirrorFen(fen), E)` and that double
mirroring is the identity `[V]`. Rules that depended on castling rights, en
passant or side to move would **not** be sound under the mirror; none of R2–R7
does, and any future rule that does must be excluded from R8 explicitly.

Stated precisely, because the property test alone does not give it: R8 needs
*"E unsatisfiable over legal positions ⟹ mirrored(E) unsatisfiable over legal
positions"*, which via the property is *"mirrorFen maps legal positions to legal
positions"*. R2–R4 do not need that lemma at all — they refute on board-placement
impossibilities (a missing king, a pawn on rank 1, two occupants of one square)
that no axis of the mirror can create or destroy — and R5–R7 are purely logical
and hold over any position set. **`named_structure` is the one operand that must
not be recursed into**: `mirrorFeature` throws on it (`MIRRORED_NAMED_STRUCTURE`
is the shipped lint), and a throw is §3d's `EVALUATION_FAULT`, never a
refutation.

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

**"Played, not assembled" is enforceable, not advisory,** and the enforcement is
structural rather than a check. The schema has no `fen` field for the position
under test — a witness carries `from` and `sans`, and the tested position is
*computed* by playing the line. There is no way to express an assembled position,
so there is nothing for a linter to catch and nothing for an author to bypass.
That is why the five illegal lines of the signature pass were refused rather than
merely warned about: a king walking onto a covered square, an ambiguous `Rxd1`
with two rooks able to reach d1, a pinned pawn push, a king stepping onto a
pawn-attacked square, and a "trade pawns" line that traded White's pawn instead
of Black's `[V]` (`planning/content-era/log.md`). `WITNESS_LINE_ILLEGAL` names the
offending SAN. **The advisory form — a `fen` plus a note saying "reached by
1…Nf6" — is prohibited by name**, because it reintroduces exactly the class the
protocol exists to eliminate.

#### §5c. Can a witness be authored into a pack or entry? — `transition-primitives` open question 8

Routed here by the coordinator (see the note at the head of this RFC). The
question has two halves and this RFC answers both.

**(a) A witness is not a pack or entry field. It stays in the fixture, keyed by
subject site.** Three reasons, in ascending order of force:

1. **It would break the register claim.** A `witness: { before, moveUci }` field
   on a `successCondition`, or a `witness` on a shape plan, is a pack- or
   shape-entry schema addition. This RFC claims nothing versioned; the routing
   note's own argument is that the remedy does not belong in a vocabulary wave,
   and it does not belong in a tooling RFC by becoming a format change either.
2. **The keying is wrong at the pack.** A witness is evidence about an
   *expression*. The same shape plan signature is referenced by every pack that
   references the shape, so a per-condition field duplicates the same evidence
   once per referencing pack and invites the copies to drift. Keyed by subject
   site, one witness serves every reference and the census can report per-arm
   counts against it (§5(b)).
3. **It would put manufactured evidence inside content.** §5's closing rule —
   *witnesses are not content and never enter coverage* — is only enforceable
   while the two live in different files. A `witness` field inside a pack makes
   "authored content" and "evidence that the authored content is satisfiable"
   the same artifact, and the discipline that keeps a coverage number honest
   dies with the separation.

**(b) An inertness refusal is not suppressed by a witness. It fires unchanged.**
This is the half most likely to be got wrong, so it is stated as a rule:

> **A witness may raise a satisfiability verdict from `unknown` to `satisfiable`.
> It may never lower a coverage observation, and it may never suppress
> `PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT`, `SHAPE_REFERENCE_NEVER_PRESENT`, or
> any successor scoped to a pack's own spine.**

§8's argument is why. Those refusals are defensible *because their corpus is the
pack's own assertion* — the pack has declared this consequence gradable on the
line it authored. A witness constructed elsewhere says nothing about that
assertion; it establishes that the expression is satisfiable **somewhere**, which
was never the disputed proposition. Letting a witness silence the refusal would
convert a self-contradiction check into an "I promise it is fine" field, which is
the shape of every authoring-surface escape hatch that has to be removed later.

What a witness *does* change is the **diagnosis**, and that is the real value of
answering this question here rather than in a vocabulary wave. Today one message
covers two situations. After this RFC the author sees which one they are in:

| Verdict | Coverage in this pack | What the author is told, and what they do |
|---|---|---|
| `unsatisfiable` | 0 | Refused upstream at the shape entry by `STRUCTURAL_EXPRESSION_UNSATISFIABLE` with the rule named. **Fix the expression.** |
| `satisfiable` (witness) | 0 | `NEVER_PRESENT` still fires. **Author a line that reaches it, or drop the claim** — the expression is fine, the pack's claim is not. |
| `unknown` | 0 | `NEVER_PRESENT` still fires, and the report says satisfiability is unestablished. **Write a witness first**, then you are in the row above. |

The residual half is genuinely owner-facing and is **not** decided here: whether
`transition-primitives`' polarity-scoped `NEVER_PRESENT` should be downgraded to
a warning for positive-polarity conditions. That is a question about what that
RFC's headline claim is worth, it changes a shipped severity, and this RFC has no
standing to decide it. Filed as open question 8 with the owner named.

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
   `structuralIssues` on the trigger and on each non-null signature. It
   additionally runs §4 and pushes `STRUCTURAL_EXPRESSION_UNSATISFIABLE` at error
   severity, at the offending pointer, naming the rule that fired. **This is the
   only new refusal in this RFC**, and it is justified because a
   proven-unsatisfiable expression cannot be correct under any corpus.

   **Where in the function it runs is normative**, because `validateShapeEntry`
   already has an ordering dependency the first draft did not account for. It
   computes `expressionValid = !issues.some(severity === "error")` after the
   `structuralIssues` block, and uses that flag to gate two things: the
   `SHAPE_TRIGGER_TRUE_AT_INITIAL` check, and whether `probeMatches` is returned
   at all `[V]`. The refutation arm runs **after** `expressionValid` is computed
   and does **not** feed it. Reason: `probeMatches` is consumed over HTTP
   (`apps/server/src/rest.ts`, the lint route) and by the web client
   (`apps/web/src/lib/api.ts`), so folding a new error into `expressionValid`
   would silently strip a field from a shipped API response for entries carrying
   the new code — an API change smuggled in under an authoring refusal. The entry
   is still `valid: false`; the probe still answers. Pinned by criterion 13.
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

**The honest cost of that line, stated rather than buried.** "No new refusal in
`pack-check`" is the right rule for *coverage*; applied blanketly it also
withholds *satisfiability*, and those are the two things §1 exists to keep apart.
The consequence is an asymmetry: a proven-unsatisfiable expression in a **shape
entry** is refused and gated (§7d), while the same expression in a pack's
`successCondition` or `fenPredicate` — 38 live host sites `[V]` — is reported by
`make expression-census` and by nothing else. §7d's one-sentence summary is
therefore true of shape entries and not yet true of packs.

This RFC takes the conservative side deliberately: adding
`STRUCTURAL_EXPRESSION_UNSATISFIABLE` to `structuralIssuesInPack` would make
`pack-check` refuse content it accepts today, on a surface three other in-flight
RFCs are editing, on the strength of a rule family this very cross-review found
unsound in two places. The measurement comes first; the refusal follows once the
census has run over a wave of authored content and criterion 7's property test
has held. Filed as open question 10 rather than left as an unexplained gap.

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
(`predicate-wave-3-validation.test.ts`, the *"resolves the Carlsbad plan
consequence"* case). After §7b, that expression is refused upstream by
`STRUCTURAL_EXPRESSION_UNSATISFIABLE` in `validateShapeEntry`, at the shape
entry, with the rule named — where the bug actually is. The coverage refusal
keeps firing for the genuine case: a satisfiable signature that this pack never
reaches. The test is updated to assert both, on two different fixtures.

**`SHAPE_REFERENCE_NEVER_PRESENT`** (`pack-validation.ts`) is the trigger
analogue, and it carries a detail that turns out to explain D49. It is guarded by
`reference.relation === "present"`.

**Its shipped test carries the identical conflation**, which the first draft
missed: the *"normalizes shape reference relations"* case sets
`never.trigger = piece_count(white, king, count) equal 0` — the same unsatisfiable
expression — and asserts `SHAPE_REFERENCE_NEVER_PRESENT` `[V]`. The same
correction applies for the same reason. Note the mechanical detail that makes
this one non-obvious: the fixture reaches the validator as a shape document
passed through `validatePackDocument`'s `shapes` lookup, **not** through
`validateShapeEntry`, so §7b's new refusal does not fire on that path and the
test would keep passing while continuing to teach the conflation. Criterion 12
re-points it explicitly rather than relying on the new code to break it.

**Both packs that reference
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
and becomes visible only as a report. **It is also why the ledger row is marked
withdrawn rather than open** — the same reading that vindicates the design
retired the defect, on the same day, and this section is the argument the
withdrawal cites. Any future reader who finds "D49" in this RFC's motivation
table should read it as *a measurement the census produces*, never as an
outstanding bug.

**The prohibition on widening, stated as a rule so it survives paraphrase:**

> Neither `PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT` nor
> `SHAPE_REFERENCE_NEVER_PRESENT` may have its corpus widened beyond the single
> pack that hosts the assertion. No successor refusal may be introduced that
> takes a corpus-wide or library-wide zero as an error. A zero over someone
> else's packs is a coverage fact and §1 gives it no error form.

Both halves are load-bearing and neither implies the other: the first says the
existing refusals stay narrow, the second says no new one may be born wide.

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
behaviour, no learner-facing surface, and no format. Four notes for the record:

1. `design/BACKLOG.md`'s census row states the coverage/satisfiability
   distinction as the requirement; §1 encodes it. No divergence.
2. The row's suggested surface was `make shape-firing FILE=<entry>
   CORPUS=content/drafts`. This RFC names the target **`expression-census`** and
   widens the subject set from shape entries to all six expression host sites,
   because the same wave that asked for `shape-firing` also needed the census for
   pack success conditions and for a bare expression under authoring. The
   narrower name would have shipped a tool that could not answer the question it
   was named after.
3. `design/BACKLOG.md` rows this RFC's findings require, to be added by the
   ledger's single writer — this RFC does not edit `design/`:
   - the unlinted `windowClosing.position` / `reasoningKeyPoint.ground` host
     sites (§3a), verified as 0-and-0 reachable through
     `structuralIssuesInPack` `[V]`;
   - the `predicate-wave-3` test's reliance on a coverage refusal to catch an
     unsatisfiable expression (§8) — **two instances, not one**;
   - `refusal-coverage.test.ts`'s emitter list covers only two files, so every
     code emitted from `shape-validation.ts` is outside the repo's own
     refusal-coverage gate today (criterion 14).
4. **The ledger's census-numbers row is cited by title, and this RFC's
   re-derivation confirms it unchanged.** No correction is owed to
   `design/BACKLOG.md` on the numbers — the three corrections in §3d are to *this
   RFC's* example envelope, which restated per-subject totals with signature-only
   figures. The row's own claims (43 packs / 694 positions; 8 of 25; 28 of 96; 43
   of 64 with 30 firing elsewhere) all reproduce exactly `[V]`.

## Acceptance criteria

Each is a test that fails today because the code does not exist.

1. **Corpus completeness.** `expression-census` over the default roots reports
   `corpus.packs` equal to the pack-file count **derived from the roots at run
   time** (never a literal — D47's rule), where "pack file" means a `.json` file
   that is not an `.evidence` / `.job` / `.sources` sidecar — the test derives
   both numbers from the directory and asserts the sidecars are excluded, since
   `content/drafts` holds 128 `.json` files and 43 packs. It lists
   `trajectory-legs.browser.json`'s pack id in `packsWithoutSpine`, reports a
   non-zero total position count, and reports `corpus.fixturePacks` containing
   exactly the `.browser.json` pack ids.

   The 42-of-43 trap is pinned **on a fixture of the census's own, not on the
   content corpus**: a fixture pack with `legs` and no `spine` must appear in
   `corpus.packs` and contribute its root position. Pinning it to
   `trajectory-legs.browser.json` alone would make the criterion depend on a
   browser test asset that open question 9 may remove from the corpus, and on a
   content literal that D47's rule forbids.
2. **Reuse, not reimplementation.** A source-and-import test asserts
   `expression-census.ts` imports `authoredSpineFens` from `pack-validation.js`
   and `matchesStructuralExpression` from `@chess-tabiya/runtime`. The negative
   half must be stated as something a test can actually see, because "defines no
   local walker" is not a module-graph property: the assertion is that
   `expression-census.ts` **imports nothing from `chessops/util` or
   `chessops/chess`** (so it cannot replay a spine) and **never references
   `.spine`, `moveUci` or `parseUci`**. That is the shape
   `transition-primitives` uses for its own exclusion — *"imports from
   `./structure.js` exactly one value binding … never imports X, Y or Z under any
   alias"* — a named-import assertion, not a semantic one.
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
5. **Degeneracy.** Re-inserting the vacuously true inner condition from
   `mate-two-bishops`'s original degradation expression
   (`piece_reach_count … scope "every" … atLeast 0`) into a fixture produces
   `FIRES_ON_DEGENERATE` naming `bare_kings`, at **warning** severity, and the
   run still exits zero. The surrounding `not` is false on bare kings; an earlier
   draft incorrectly attributed the inner condition's vacuity to the whole negation.
6. **Witness legality.** A witness whose SAN line contains an illegal or
   ambiguous move is refused with `WITNESS_LINE_ILLEGAL` naming the SAN, and the
   subject's verdict is not upgraded to `satisfiable`.
7. **Refutation soundness.** A property test over generated expressions asserts
   that **every** expression the refutation arm calls `unsatisfiable` fires on
   none of the corpus positions, none of the degenerate boards and none of the
   witnesses. (One-directional by design: `unknown` expressions are unconstrained.)

   **Plus a fixed table of the nine counterexamples this cross-review executed**,
   each asserted `verdict != "unsatisfiable"` — a generator is unlikely to
   rediscover them and every one refuted a rule as first drafted:

   | # | Expression | Must not be refuted because |
   |---|---|---|
   | 1 | `any[ piece_count(w,knight) atLeast 1, piece_count(w,king) equal 2 ]` | one bad arm of an `any` (R1 vs R7) |
   | 2 | `not(feature outpost{white, a2})` | negation of a false leaf is a tautology |
   | 3 | `line_blockers{a1→a2} atMost 0` | an empty span has 0 blockers — vacuously true |
   | 4 | `piece_distance{white king → white king} equal 0` | a piece is at distance 0 from itself |
   | 5 | `piece_count(w,knight,count) atMost 12` | `atMost` above the maximum is a tautology |
   | 6 | `piece_distance{white rook → a1} atMost 5` | same, for distance |
   | 7 | `pawn_count(white,count) atMost 9` | same, for pawns |
   | 8 | `all[ piece_reach_count(w,rook,any) atLeast 10, … atMost 3 ]` | two rooks satisfy both — R6's scalar premise fails |
   | 9 | `all[ piece_reach_count(w,bishop,every) atLeast 10, … atMost 3 ]` | vacuously true over an empty piece set |

   Cases 1–7 fire true on the standard initial position; 8 fires true on
   `7k/8/8/8/3R4/8/6PP/6KR w - - 0 1`; 9 fires true on bare kings. All nine
   verified against the shipped evaluator `[V]`.
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
    exactly the same issue codes and severities before and after this RFC. Also:
    no shipped shape entry acquires `STRUCTURAL_EXPRESSION_UNSATISFIABLE`, so
    `ShapeRegistry.loadDefault` keeps loading all 25 entries. (Pre-verified:
    exactly one R6 candidate site exists in `content/shapes` today,
    `rook-4v3-same-side/black-trade-pawns-not-rooks`'s `piece_count(black,pawn)
    atLeast 1 ∧ atMost 2`, interval `[1,2]` — non-empty `[V]`.)
12. **Both shipped tests are re-pointed, not one.**
    `predicate-wave-3-validation.test.ts` asserts
    `STRUCTURAL_EXPRESSION_UNSATISFIABLE` on the `piece_count(king) equal 0`
    fixture in the *"resolves the Carlsbad plan consequence"* case, and keeps
    `PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT` on a *satisfiable* signature that
    the pack's own spine never reaches. The *"normalizes shape reference
    relations"* case likewise moves `SHAPE_REFERENCE_NEVER_PRESENT` onto a
    *satisfiable* trigger the pack's spine never reaches. Three fixtures, two
    codes, one distinction — and a test asserting the census reports
    `verdict == "unsatisfiable"` for the king expression that both cases used to
    borrow.
13. **`probeMatches` survives the new refusal.** `validateShapeEntry` on an entry
    whose trigger is refuted by §4 returns `valid: false` **and still returns
    `probeMatches`** when `probeFen` is supplied, and still evaluates
    `SHAPE_TRIGGER_TRUE_AT_INITIAL`. Pins §7b's ordering rule and the HTTP lint
    route's response shape against an accidental API narrowing.
14. **The new codes are inside the repo's own refusal-coverage gate.**
    `apps/server/src/refusal-coverage.test.ts`'s *"requires every fixed authoring
    refusal to have a direct test disposition"* scans exactly two emitter files —
    `pack-validation.ts` and `packages/schema/src/drill-pack/lint.ts` `[V]` — so
    a code emitted from `shape-validation.ts` or `expression-satisfiability.ts`
    escapes it silently. Both files are added to the emitter list, and the
    resulting `missing` set is empty. This closes a pre-existing hole (today's
    `shape-validation.ts` codes are outside the gate too) rather than merely
    avoiding widening it, and it is the reason `STRUCTURAL_EXPRESSION_UNSATISFIABLE`
    cannot land untested.

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
5. **How far should the refutation arm grow?** R1–R8 are the rules with
   soundness proofs — and cross-review found **two of the original eight
   unsound**, R1 comprehensively and R6 for one feature, so "obvious" was the
   wrong word and the bar below is not theoretical. Richer rules exist —
   pawn-structure impossibility, attack-count bounds given a piece census,
   `named_structure` conjunctions — each needing its own proof, and an unsound
   rule refuses correct authored work. The bar proposed: **no rule lands without a
   property test showing it never refutes an expression that any corpus position,
   witness or degenerate board satisfies, and without an explicit statement of the
   rule's hidden premise** — R6's was "both children constrain the same scalar",
   which is what failed. Whether that bar is enough is an owner question.
6. **Ledger rows.** Findings above need `design/BACKLOG.md` rows written by the
   ledger's single writer (see §Deviations note 3). This RFC cannot be `accepted`
   until they exist, per the "an idea missing from the ledger is a process bug"
   rule.
7. **Landing order.** This RFC touches `pack-validation.ts` (one `export`) and
   `shape-validation.ts`, both of which `transition-primitives` and
   `deviation-classes` also edit. Since it claims no shared versioned resource,
   the collision is textual, not semantic, and it should land **last** of the
   in-flight set to absorb the rebase rather than impose it. Confirm in
   `rfc/README.md`'s claim-order note — which this draft does not edit.
8. **Should `transition-primitives`' positive-polarity `NEVER_PRESENT` be
   downgraded to a warning?** §5c answers the half that is this instrument's to
   answer — a witness lives in the fixture, not in a pack or entry, and never
   suppresses an inertness refusal. The remaining half changes a severity in
   another RFC and changes what that RFC's §4.4 headline claim is worth, so it is
   not this RFC's call. **Owner: Marco.** Recommendation on the record: keep the
   refusal at error and take the improved diagnosis (§5c's three-row table), since
   the refusal's corpus is the pack's own assertion and a witness does not
   contradict it. Routed from `rfc/transition-primitives.md` open question 8 —
   **this question is answered or owned, not floating.**
9. **Do `.browser.json` test fixtures belong in the census corpus?** They are 6
   of 43 packs and 23 of 694 positions `[V]`, `tools/r1r2-primitives-harness/
   corpus.ts` excludes them by name, and the only pack in `packsWithoutSpine`
   today is one of them. Excluding them would make this census's numbers
   directly comparable with the R3 dossier's; including them measures every
   expression the repo actually holds. This RFC includes them **and reports the
   split** (`corpus.fixturePacks`), which is reversible either way. Decide after
   one wave of use, or on the first cross-instrument number that disagrees.
10. **When does `STRUCTURAL_EXPRESSION_UNSATISFIABLE` reach pack-hosted
    expressions?** §7c withholds it from `pack-check`, so satisfiability is gated
    for shape entries and not for the 38 pack host sites. That is a deliberate
    conservatism, not a principle — the principle (§1) says an unsatisfiable
    expression is a bug wherever it lives. Proposed trigger for revisiting: the
    census has run over one authoring wave, criterion 7's property test has held,
    and no in-flight RFC is editing `structuralIssuesInPack`. Needs an owner
    decision because it would add a refusal to a shipped gate.

## Changelog

- 2026-08-15: created. Register claim: nothing versioned. All corpus figures
  measured against the working tree on this date with the shipped evaluator; the
  numbers will drift with the corpus and are dated for that reason.
- 2026-08-15: **adversarial cross-review, applied in place.** Register claim
  unchanged and re-verified. Headline census figures independently re-derived and
  all reproduced exactly. **Two refutation rules were unsound and are rewritten:**
  R1 (delegating the whole expression to `structuralIssues` — seven executed
  counterexamples, three independent causes) and R6 (for `piece_reach_count` —
  two executed counterexamples, one of them the `mate-two-bishops` vacuity
  reappearing inside the rule meant to catch impossibility). R3's `every`
  exclusion was justified by a wrong reason and is corrected. The
  coverage/satisfiability conflation is in the shipped tree **twice**, not once.
  D49 restated as withdrawn. `transition-primitives` is 0.22, not 0.19. Three of
  six report totals were wrong (`neverFiresInCorpus` 28→36,
  `inShapeDenominatorEmpty` 8→40, `satisfiabilityUnknown` 0→36). Denominator
  reconciled against the R3 dossier exactly (37 non-`.browser` packs = 634
  transitions). Routed `transition-primitives` open question 8 answered in §5c
  with its residual owned. Added: an evaluator-fault contract, a `probeMatches`
  ordering rule, a refusal-coverage-gate obligation, and criteria 13–14 and
  open questions 8–10.
