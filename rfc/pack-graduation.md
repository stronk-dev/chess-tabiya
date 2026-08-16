# RFC: Pack graduation

- **Status:** draft
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-16
- **Design refs:** `design/02-product-shape.md` §Deployment axis (hosted multi-user, settled
  2026-08-12); `design/03-product-breadth.md` B6 (Create → validated fixture, publication
  channels); `design/04` §2d/§7 (the grounding obligations the blockers actually record)
- **Exploration gate:** the breadth gates are complete (`planning/exploration/gates.md`
  §Breadth gates — *"B1–B11 all green, content era open"*), and this RFC serves the content
  era's terminal step. Opened by the owner ruling on `design/BACKLOG.md` row **"A production
  deployment serves ONE pack — the schema example — and none of the 47 authored ones"**
  (D162, owner-gated): *fix the gate properly — do not curate a subset, and do not delete
  the gate.*
- **Depends on:** nothing unlanded. `rfc/claim-backing.md` is a **hard prerequisite for the
  packs it names** (§7) but not for this RFC's mechanics
- **Parent / amends:** amends `rfc/archive/pack-studio.md` (which shipped
  `GRADUATION_BLOCKERS_OUTSTANDING` and the `schema_example | draft | published` narrowing)
  and `rfc/archive/content-sourcing-foundation.md` (which shipped the empty-`content/packs/`
  registry split)
- **Supersedes / superseded by:** —
- **Planning:** `planning/pack-graduation/` (once implementing)

## Summary

`provenance.graduationBlockers` is a free-text `string[]` doing three incompatible jobs at
once — outstanding debt, resolved history deliberately kept, and permanent accepted
conditions — so the graduation gate it feeds is neither machine-readable nor meetable.
Measured at `1b89123`: **240 entries, 177 of them distinct, across 47 authored packs, and
0 of 47 has an empty list** `[V]`. This RFC gives each entry a **state**
(`blocking` / `resolved` / `accepted`), makes graduation *zero `blocking` entries*, specifies
the 240-entry migration and names its error mode, and rules what graduation mechanically
**is**: a file move from `content/drafts/` to `content/packs/` **and** a
`reviewStatus: "published"` flip **and** a ledger `packDigest` re-stamp, in one commit.
It then reports, measured, how many packs graduate now and after each in-flight work item —
and the honest answer is that a second gate, `sourcing-check` at published severity, is
stricter than the blocker gate and **40 of 47 packs fail it today** `[V]`.

## Motivation

### §0.1 The product-state fact

`PackRegistry.loadDefault` builds `productionPaths` as
`[schemas/drill_pack.example.json, ...jsonFiles(content/packs/)]`; `content/packs/` holds
only `.gitkeep`; `content/drafts/` is loaded only when `options.development === true`, and
`options.draftFile !== undefined && options.development !== true` throws a bare `TypeError`
(`apps/server/src/pack-registry.ts`, `loadDefault`) `[V]`. The enforcement is not in the
loader at all — `.dockerignore` line 8 excludes `content/drafts`, and
`tools/verify-packaging.mjs` asserts it does (*"Production image context must exclude
content/drafts"*) `[V]`. So the shipped image physically cannot contain an authored pack.
This is `design/BACKLOG.md` row **"A production deployment serves ONE pack — the schema
example — and none of the 47 authored ones"**, and `design/02-product-shape.md`'s
*"Deployment axis — SETTLED 2026-08-12 (owner ruling): hosted multi-user"* is what makes it
live rather than theoretical.

### §0.2 Why nothing graduates — the actual bug, measured

Re-measured at `1b89123` over the 47 authored packs in `content/drafts/` (the 53 `.json`
files that are not `.evidence.json` / `.job.json` / `.sources.json`, less the six
`*.browser.json` test fixtures) `[V]`:

| Measure | Value |
|---|---|
| Packs carrying `provenance.graduationBlockers` | **47 of 47** |
| Total entries | **240** |
| Distinct entry strings | **177** |
| Entries per pack | min **2**, max **7** |
| Packs with an empty list (i.e. graduable) | **0** |

The 240 entries decompose into three populations that the field cannot tell apart:

1. **A standing owner ruling — 37 entries, one per pack in 37 of 47 packs** `[V]`. The most
   common entry in the corpus is *"There is no pack review workflow in this system and there
   never will be one (owner ruling 2026-08-13)…"*, in **seven** wording variants (one covering
   25 packs, two covering 4 each, four singletons) differing in punctuation and in trailing
   clauses. **It can never clear.** A permanent accepted
   condition is sitting in a field for debts, and it alone blocks 37 packs forever.
2. **Resolved history, deliberately kept — 48 entries across 19 packs** `[V]`, carrying
   resolution prefixes: `RESOLVED in v0.2.0 (kept for the record)`, `SHAPE ENTRY AUTHORED
   2026-08-15 — this blocker is superseded and kept for the record`, `ENGINE EVIDENCE NOW
   RECORDED`, `REFUTED AND DELETED 2026-08-15`, `ENGINE-CHECKED`, `CORPUS-CHECKED`,
   `PROSE GROUNDING PASS`. The corpus keeps these on purpose and is right to.
3. **The genuine remainder — 155 entries** `[V]`. The head of the distribution: *"Prose
   explanations are authored consensus; categories are tablebase-grounded, reasons are not"*
   (7 packs), *"The Syzygy root assessment is declared but not ledger-verified; no sourcing
   sidecars were produced"* (4), *"Prose explanations are authored; categories are
   tablebase-grounded"* (4), *"No engine validation pass has been run on any position in this
   pack"* (2), and a long tail of 138 pack-specific singletons.

**So `0 of 47` is not a statement about content readiness. It is a statement about a field
that mixes debts with facts**, and the honest half of the corpus — the half that records
what was checked and what was refuted — is what pins the gate shut.

### §0.3 Scope boundary

**In scope:** the entry shape, the gate predicate, the schema declaration, the migration of
240 entries, the mechanical definition of graduation, and the repo-wide consequences of
`content/packs/` becoming non-empty.

**Out of scope, explicitly:** (a) *doing* any of the grounding work the blockers record —
this RFC makes the debt legible and countable, it does not pay it; (b) curating a subset of
packs for promotion, which the owner refused by name; (c) any change to what
`reviewStatus: "published"` means for *severity* — `sourcing/check.ts` already escalates
`EVIDENCE_TYPE_UNBACKED` and `DEVIATION_COST_UNBACKED` from warning to error on published and
that stays exactly as it is; (d) community packs' registration path beyond a one-predicate
change (`PackStudio.register`); (e) reintroducing a pack review workflow, which is refused by
the 2026-08-13 owner ruling this RFC finally files in the right place.

## Specification

### §1 A blocker entry is an object with a state

`provenance.graduationBlockers` becomes an array of objects. Each entry states **exactly one
condition** and carries **exactly one state**.

```jsonc
{
  "id": "no-review-workflow",              // required, kebab-case, unique within the pack
  "state": "accepted",                     // required: "blocking" | "resolved" | "accepted"
  "statement": "There is no pack review workflow in this system and there never will be one.",
  // exactly one of the following two objects, keyed by state:
  "accepted": {
    "kind": "owner_ruling",                // "owner_ruling" | "permanent_property" | "out_of_scope"
    "ruling": "Owner ruling 2026-08-13: only a citable source or mechanical validation that bears on a claim can ground it; no second-party review workflow will exist."
  }
}
```

```jsonc
{
  "id": "engine-pass-absent",
  "state": "blocking",
  "statement": "No engine validation pass has been run on any position in this pack, so no deviation carries a measured cost.",
  "clearedBy": "make verify-draft over this pack's positions; rfc/engine-leverage.md §2.3 then derives cost"   // optional, free text
}
```

```jsonc
{
  "id": "shape-entry-absent",
  "state": "resolved",
  "statement": "No shape entry named the KID chain arrangement, so the chain teaching was inlined and non-reusable.",
  "resolved": {
    "at": "2026-08-15",                    // required, ISO date
    "by": "content/shapes/kid-chain-arrangement.json now exists and this pack references it from the classical-race plan class."
  }
}
```

#### §1.1 The three states, and why exactly three

| State | Meaning | Affects the gate | Required companion |
|---|---|---|---|
| `blocking` | Outstanding work. Someone can do it. | **Yes** | none (`clearedBy` optional) |
| `resolved` | Was blocking; the work was done. Kept for the record. | No | `resolved.at`, `resolved.by` |
| `accepted` | A permanent condition the product has decided to live with. | No | `accepted.kind`, `accepted.ruling` |

Three states, not four. The obvious fourth — *deferred / blocked on unlanded work* — is
**deliberately refused**, and the refusal is the load-bearing decision in §1. Five packs
carry entries of exactly that shape today (*"The natural opponent for a mates pack is
`perfect_tablebase`; that mode is declared-unimplemented in v1, so `human_common` at 1200
stands in"*) `[V]`. A fourth state would let every such entry stop counting, and *"we are
waiting on someone else"* is the single most reusable sentence in software. **A blocker whose
fix lives in another RFC is `blocking`, with `clearedBy` naming that RFC.** It costs the
mates packs their graduation until tablebase opponent selection ships, which is the correct
and honest outcome: the pack really is drilling mating technique against an opponent it was
not verified against.

#### §1.2 `accepted` is expensive on purpose

`accepted` is the laundering channel — the one state that can graduate a pack that should not
graduate — so the schema makes it costly to reach:

- **`accepted.kind` is a closed three-value enum.** `owner_ruling` requires a dated ruling
  quoted in `accepted.ruling`. `permanent_property` requires a stated impossibility that is a
  property of the world, not of our backlog (the corpus already has two, both correct:
  *"This position holds eleven pieces. Syzygy tops out at seven, so no tablebase ground truth
  exists… this is a permanent property of the material, not a task nobody has done"*) `[V]`.
  `out_of_scope` requires the boundary to be named (the `rook-4v3-same-side` sibling
  explicitly *"deliberately is not smuggled in here"*) `[V]`.
- **A missing or empty `accepted.ruling` is a validation error**, not a warning (§3.2).
- **The accepted set is a single reviewable page.** §3.3 ships `make graduation-report`,
  which prints every `accepted` entry in the corpus with its `kind` and `ruling`. Today that
  page would be ~39 entries (37 owner-ruling + 2 permanent-property); it stays small enough
  that one person can read all of it in one sitting, which is the actual guard. A lint cannot
  tell a real acceptance from a shrug; a short, printed, corpus-wide list can.

#### §1.3 One entry states one condition

An entry states one condition. The corpus violates this heavily today (§4.2) and the
migration's main manual cost is splitting compound entries. **This rule is not machine-
enforceable** — no lint can tell that a sentence carries two conditions — and this RFC does
not pretend otherwise. It is enforced by the migration audit and by the `graduation-report`
page, and that limit is stated here rather than hidden.

#### §1.4 The field keeps its name

`graduationBlockers` now holds non-blocking entries, so the name is imprecise. It is kept
anyway. Renaming would touch five emitters (`distill.ts` `distillRun`,
`sourcing/openings.ts`, `sourcing/syzygy.ts`, `sourcing/position-seeds.ts`), two readers
(`PackRegistry.projectPackDocument`, `PackStudio.register`), one test assertion
(`sourcing/syzygy.test.ts`), and every archived RFC that cites the field — for a semantic
improvement that §1.1's `state` already delivers. The objection is recorded, not acted on.

#### §1.5 Legacy strings block

A plain `string` entry (the pre-migration shape) is **treated as `blocking`** by the gate
predicate and raises `GRADUATION_ENTRY_LEGACY_SHAPE` at warning. This exists for one reason:
`pack_drafts.document_json` and `registered_packs.document_json` (`apps/server/src/storage.ts`)
store whole pack documents as JSON blobs, so a learner's stored studio draft can hold the old
shape after this RFC lands. Reading a legacy string as `blocking` means such a draft refuses
to register rather than silently registering — the safe direction, and it is why this RFC
needs **no storage migration** (§8.2).

### §2 The gate

> **A pack graduates when `provenance.graduationBlockers` contains zero entries whose
> `state` is `"blocking"`** (legacy strings counting as `blocking` per §1.5).

Everything else about the field is record-keeping. This replaces the shipped predicate in
`PackStudio.register`, which is today `Array.isArray(blockers) && blockers.length > 0` →
`ServerError("GRADUATION_BLOCKERS_OUTSTANDING", "Clear declared graduation blockers before
registration")`. The error code and message survive unchanged; only the predicate changes,
to `blockers.filter(isBlocking).length > 0`. **The community-pack graduation gate therefore
already exists and already works** — it has simply been unmeetable, for the same reason the
official one is.

### §3 Schema and lints

#### §3.1 `$defs/provenance` is declared and closed

`provenance` is `{"type":"object","required":["reviewStatus"],"properties":{"reviewStatus":
…,"sources":…},"additionalProperties": true}` (`schemas/drill_pack.schema.json`). Three of
the five keys the corpus actually uses ride on that `additionalProperties: true` and are
undeclared: `licence`, `reviewers`, `graduationBlockers` `[V]`. A census of every
`provenance` object in `content/drafts/`, `schemas/` and `schemas/fixtures/drill-pack/`
returns **exactly five distinct keys corpus-wide** — `reviewStatus` (64 files), `sources`
(55), `graduationBlockers` (53), `reviewers` (41), `licence` (30) `[V]`. There is no sixth.

This RFC declares all five and sets `additionalProperties: false`. That closes the row
`rfc/archive/defect-batch-2.md` §6 proposed to the owner and never landed — *"`$defs/
provenance` and `$defs/feedbackClaim` are the last open objects in the pack schema;
provenance's openness is load-bearing (`licence`/`reviewers`/`graduationBlockers` are
undeclared) — declare the vocabulary, then close them"*. `$defs/feedbackClaim` stays open;
this RFC closes one of the two.

`graduationBlockers` is declared as an array of `$defs/graduationEntry`, a closed object with
`required: ["id","state","statement"]`, `state` a closed three-value enum, `accepted` and
`resolved` as closed sub-objects, and a `oneOf` binding `state` to its companion
(`state:"accepted"` requires `accepted` and forbids `resolved`, and symmetrically).

**Migration ordering constraint:** the schema tightening and the content migration must land
in the **same commit**, because closing `additionalProperties` and typing the array
invalidates all 47 committed packs the instant either half lands alone.

#### §3.2 New lint codes

Raised by `validatePackDocument` (`apps/server/src/pack-validation.ts`), which is the layer
that already carries the `reviewStatus === "published"` branch:

| Code | Condition | Severity |
|---|---|---|
| `GRADUATION_ENTRY_ID_DUPLICATE` | two entries share an `id` within one pack | error |
| `GRADUATION_ACCEPTED_WITHOUT_RULING` | `state: "accepted"` with missing/blank `accepted.ruling` | error |
| `GRADUATION_RESOLVED_WITHOUT_RESOLUTION` | `state: "resolved"` with missing `resolved.at` or blank `resolved.by` | error |
| `GRADUATION_ENTRY_LEGACY_SHAPE` | an entry is a bare string | warning (§1.5) |
| `GRADUATION_BLOCKING_ON_PUBLISHED` | `reviewStatus: "published"` with ≥1 `blocking` entry | **error** |

`GRADUATION_BLOCKING_ON_PUBLISHED` is the one that matters. It makes the gate hold at the
*document* layer as well as at the studio's registration path, so a pack cannot be hand-moved
into `content/packs/` with `published` set and outstanding debt. It is an error at every
review status because it is only reachable at `published`.

#### §3.3 `make graduation-report`

A new target over `apps/server/src/graduation-report.ts`, built the way `expression-census`
is (`esbuild` bundle → `node dist/…`). It walks both `content/drafts/` and `content/packs/`
and prints, deterministically:

- per pack: counts by state, and the `id` + `statement` of every `blocking` entry;
- corpus totals by state;
- **the full `accepted` page** — every `accepted` entry, grouped by `kind`, with its `ruling`;
- the graduable set: packs with zero `blocking` entries.

`design/BACKLOG.md` row **"`make expression-census` is blind to corpus grounding — identical
in all nine fields before and after eleven packs gained result-split evidence"** (D152) is the
argument for shipping this rather than leaving it to ad-hoc scripts: the repo's only
corpus-wide content instrument cannot see grounding, so a wave that clears blockers currently
has no headline instrument. This is that instrument for this axis.

### §4 The migration — a mechanical pass with a hand-audited residue

**Method: one mechanical rule, then 203 entries by hand, with `blocking` as the default.**

#### §4.1 Stage A — mechanical, one pattern, 37 entries

Exactly one pattern is trusted to auto-classify: the substring *"no pack review workflow in
this system and there never will be one"*, which matches **37 entries in 37 distinct packs**
`[V]` across **seven** wording variants (25 / 4 / 4 / 1 / 1 / 1 / 1). Each becomes one
canonical entry:

```jsonc
{ "id": "no-review-workflow", "state": "accepted", "statement": "…",
  "accepted": { "kind": "owner_ruling", "ruling": "Owner ruling 2026-08-13: …" } }
```

Every other entry — all 203 — is written as `state: "blocking"` with a generated `id` and the
original string as `statement`, verbatim. **The mechanical stage promotes nothing else.**

#### §4.2 Stage B — hand audit of 203 entries, with only two permitted moves

An auditor reads each of the 203 and may make exactly two moves out of `blocking`: to
`resolved` (with a dated resolution) or to `accepted` (with a ruling, and only for one of
§1.2's three kinds). **An entry the auditor cannot decide stays `blocking`.**

**Compound entries must be split.** This is where the work is, and the number is measured. Of
the 48 entries carrying a resolution-marker prefix, **42 also carry a residual clause that is
still open** `[V]` — *"it does not ground strategic prose, plan classes, annotations, or
deviation classifications, and it is not a proof"*; *"The 'hole on d6' assertion is a
structural claim no evaluation addresses and it stays ungrounded"*; *"That half of the blocker
is untouched"*; *"Strategic prose, plan-class descriptions and deviation classes remain
exactly as ungrounded as before"*. Each of the 42 becomes **one `resolved` entry plus one or
more `blocking` entries**.

So the migration's arithmetic is:

| | Entries |
|---|---|
| Today | 240 total, 0 `blocking`-typed (all untyped) |
| After Stage A | 37 `accepted`, 203 `blocking` |
| After Stage B | ~39 `accepted`, ~48 `resolved`, **~197 `blocking`** |

**The migration makes the corpus's blocking debt larger than the field's current entry count
for real work (155 → ~197), not smaller.** That is the correct outcome and it is the point:
the extra ~42 were always there, hidden inside sentences whose first word said "RESOLVED".

#### §4.3 Why not a mechanical classifier over the resolution prefixes

Because the corpus's own prose defeats it, measured two ways:

1. **42 of 48 prefix-matched entries are compound** (§4.2). A prefix classifier marks all 48
   `resolved` and **silently retires 42 live debts** — the exact failure this RFC exists to
   prevent.
2. **The prefixes are not reliable signals of state.** `opening-principles-black` carries
   *"CORPUS-CHECKED 2026-08-15 **and NOT ANSWERABLE from repo data**…"*, and
   `kid-mar-del-plata-white` carries *"**STILL UNTESTED** after the 2026-08-15 engine pass"* —
   an ALLCAPS status prefix that reads like a resolution marker and means the opposite `[V]`.

#### §4.4 The error mode of each stage, stated

- **Stage A's error mode is a false `accepted`** — the dangerous direction. It is bounded by
  making the stage trust exactly one pattern, and by checking it: all 37 matches were read
  against the canonical text, and the seven variants differ in punctuation and in trailing
  clauses (*"Nothing in this file has been checked by a second party"*; *"Every feedbackClaim
  needs a citable source…"*), none of which adds a debt that is not already stated as its own
  entry elsewhere in the same pack `[V]`. Acceptance criterion 4 re-runs that check and fails
  the migration on any match outside the seven attested variants — **seven is a large enough
  variant count that this is a real guard and not a formality**, and the residue is exactly
  where a debt could have been smuggled into the ruling sentence.
- **Stage B's error mode is a false `blocking`** — a pack fails to graduate that could have.
  This costs a re-audit and one commit. It does not put an ungrounded pack in front of a
  learner.

**That asymmetry is the whole reason the default is `blocking`.** Misclassifying a real debt
as `accepted` graduates a pack that should not graduate; misclassifying a cleared debt as
`blocking` delays a pack that should. The first is a product failure and the second is an
inconvenience, so the migration is built to make the second one common and the first one
structurally hard.

#### §4.5 Digest consequences of the migration itself

`digestDrillPack` canonicalizes the **whole document** including `provenance`
(`packages/schema/src/drill-pack/digest.ts`, `canonicalizeJson` → `digestCanonicalJson`), so
**restructuring `graduationBlockers` moves all 47 pack digests** `[V]`. All **32** evidence
ledgers in `content/drafts/` carry `packDigest`, and `sourcing/check.ts` raises
`EVIDENCE_DIGEST_STALE` (warning) on mismatch. Re-derived at `1b89123`: **27 of 32 ledgers
are currently fresh; 5 are already stale** (`mate-bishop-knight`, `mate-k-q-technique`,
`mate-k-r-technique`, `philidor-passive-rook-convert`, `trajectory-mate-bishop-knight`) `[V]`.

**The migration commit must re-stamp `packDigest` on all 32 ledgers.** Acceptance criterion 6
pins the outcome: 32 of 32 fresh after the migration, which also incidentally clears the 5
pre-existing stale warnings. Note this is *not* a rebase of the pack `$id`, which is free
(the register's own rule: *"pack digests are content digests and are unaffected by the
`$id`"*). It is the field change that moves them.

### §5 What graduation mechanically is

Today graduation is implied by a directory and by nothing else. This RFC rules that it is
**three simultaneous changes in one commit**, and each is required for a distinct, measured
reason.

| Step | Why it is required |
|---|---|
| **(a)** `git mv content/drafts/X.json content/packs/X.json`, with its `.evidence.json` / `.job.json` / `.sources.json` sidecars | The move is what the deployment actually reads. `.dockerignore` excludes `content/drafts`, so the shipped image contains `content/packs/` only. No field flip can put a pack in the image `[V]` |
| **(b)** `provenance.reviewStatus` `"draft"` → `"published"` | The field is what the *severity* rules read. `sourcing/check.ts` escalates `EVIDENCE_TYPE_UNBACKED` and `DEVIATION_COST_UNBACKED` from warning to error on `published`, and `pack-validation.ts` has a `published` branch. Moving a file without flipping the field would ship a pack whose unbacked claims are still only warnings — precisely what published severity exists to prevent `[V]` |
| **(c)** re-stamp `packDigest` in `X.evidence.json` | Step (b) is inside the document, so it moves the digest and staleness-warns the ledger (§4.5) |

**Digest arithmetic, answered explicitly as asked:**

- **Moving the file moves no digest.** The path is not part of the document; `digestDrillPack`
  sees only the parsed JSON `[V]`.
- **Setting `reviewStatus: "published"` DOES move the digest**, because `provenance` is inside
  the canonicalization `[V]`. This is why (c) is not optional.
- The pack `$id` / `DRILL_PACK_SCHEMA_VERSION` bump moves nothing, per the register's rule.

**Graduation is a MOVE, not a copy.** The draft leaves `content/drafts/`. §6 shows this is
not a stylistic preference: a pack present in both directories is double-counted by
`runExpressionCensus`, overrides itself in `pack-check`'s sibling lookup, and diverges between
the dev server and the shipped image via `PackRegistry.loadDefault`'s `replaceDuplicates`.

**The second gate, and it is the strict one.** Because (b) escalates severity, a pack
graduates only if `sourcing-check` also passes at published severity. Re-derived at
`1b89123` over the 47 packs, matching machine-checkable claim labels (`corpus_observed`,
`tablebase_exact`, `engine_validated`) against their ledgers' supporting records: **40 of 47
packs would fail, on 97 unbacked claims; 15 packs carry claims and no evidence ledger at
all; 7 packs are clean** `[V]` — `anti-caro-advance`, `conversion-up-a-piece`,
`opening-principles-black`, `opening-principles-white`, `opponent-intent-early-queen`,
`rook-4v3-same-side`, `trajectory-qgd-exchange-minority`. This RFC does not change that gate;
it records that the blocker gate is **not** the binding constraint for most of the corpus,
which is a finding the D162 row did not have.

### §6 The production-catalogue switch

Once `content/packs/` is non-empty, every gate that reasons about "the corpus" changes
meaning. Audited at `1b89123`; each row states the discovery mechanism and what this RFC does.

| Site (symbol) | Discovery | Consequence | This RFC |
|---|---|---|---|
| `apps/server/src/expression-census.test.ts` (`packFiles`) | pins `report.corpus.packs` to a **`content/drafts`-only** `readdirSync` while the census walks **both** roots | **`make verify` goes red on the first promoted pack** — the one hard breakage | Fix the test to count both roots |
| `apps/server/src/expression-census.ts` (`runExpressionCensus`, `filesUnder`, `packFiles`) | default roots are `["content/drafts","content/packs"]`; the document map is keyed by **absolute path, not pack id** | a pack in both directories is read twice and every spine FEN pushed twice, skewing `FIRES_ON_MAJORITY` and every coverage ratio | Add an **id-collision refusal** to the census — two files, one id → refuse, never silently double-count |
| `apps/server/src/pack-check.ts` (`siblingLookup`, `packJsonFiles`) | walks both roots; `result.set(value.id, …)` is **last-file-wins**, and `content/packs` is walked second | a stale promoted copy would silently override the draft in every `make pack-check` | Covered by the move-not-copy rule; no code change |
| `apps/server/src/shape-check.ts` (`checkShapeFile`, `main`) | `corpus:` is **opt-in**; `checkShapeFile` short-circuits when `options.corpus === undefined`, and the Makefile's unset `CORPUS` yields `[]` | unaffected unless a caller passes it — but `expression-census.test.ts` **does** pass both roots and asserts `SHAPE_TRIGGER_NEVER_FIRES_IN_CORPUS` for `knight-vs-bishop` | Re-derive that assertion when the first pack graduates |
| `apps/server/src/opening-evidence.test.ts`; `packages/schema/src/drill-pack.test.ts` | both sweep **`content/drafts` only** | **a graduated pack escapes the only two corpus-wide sweeps** — schema conformance and evidence sidecars. Graduation would mean leaving the gates | Widen both to walk `content/drafts` **and** `content/packs`. Non-negotiable |
| `apps/server/src/refusal-coverage.test.ts` (`testSources`, `productionSources`) | scans **source files**, not content; four pack inputs are **hardcoded `content/drafts/…` paths** (`trajectory-mate-bishop-knight.json`, `anti-caro-advance.json`, `rook-4v3-same-side.json`, `stated-reasoning.browser.json`) | unaffected by `content/packs/` filling; **breaks the moment one of those three packs is moved** — and `anti-caro-advance` and `rook-4v3-same-side` are both in §5's clean-at-published set | Add a root-agnostic `resolvePackPath(id)` helper and repoint all hardcoded draft paths that name a real pack |
| `packages/runtime/src/practical-difficulty.test.ts` + `fixtures/instrument-fed.fixture-register.json` (**"fixture-realism"**) | regex over **TypeScript source** (`@instrument-fed` JSDoc) plus a recursive `.ts` sweep | **no content involvement at all** | Nothing |
| `apps/server/src/pack-registry.ts` (`PackRegistry.fromDocuments`) | `records.has(document.id) && options.replaceDuplicates !== true` → `throw ServerError("PACK_INVALID", …)`; otherwise **overwrite, last write wins** | production (`replaceDuplicates: false`) **throws on boot** for an intra-`content/packs/` id collision; development (`true`) silently prefers the draft | Move-not-copy removes the divergence; the production throw is correct and stays |
| `tools/verify-scaffold.mjs`; `tools/verify-packaging.mjs`; `.dockerignore` | existence of both directories; `.dockerignore` must include `content/drafts` | unchanged — and `verify-packaging` is what makes (a) load-bearing | Nothing |
| `planning/pack-vocabulary-audit/audit.ts` (`allPackFiles`); `tools/r1r2-primitives-harness/corpus.ts` (`DRAFTS`) | drafts-only | disposable/planning instruments; a graduated pack drops out of them | Note in the planning dir; no change |
| `.github/workflows/` | **zero** references to either directory | nothing | Nothing |

**The one-line summary of §6:** the production-catalogue switch breaks `make verify`
immediately (via `expression-census.test.ts`), and its subtler cost is that graduation as
currently wired means **exiting** the schema-conformance and evidence sweeps. Both are fixed
here, and the second is the more important one — a gate you graduate *out of* is not a gate.

### §7 What graduates now, and after each in-flight item

The blocker population's real content, re-derived at `1b89123` by classifying the 155
non-ruling, non-history entries. **The classification below is this RFC's own hand audit,
not a shipped instrument**, and it is stated that way so nobody quotes it as a measurement of
something automatic:

| Class | Entries | What clears it |
|---|---|---|
| Corpus / band frequency unmeasured (*"unquantified below the family root"*, *"the explorer API could settle this cheaply"*) | 42 | Explorer query waves — **and** `claim-backing`'s `explorer_position_census`, without which the results are unbindable per the row **"No evidence record kind at HEAD can carry a result split, so every split this wave authored is unbound prose"** (D150) |
| Uncited prose / authored doctrine (*"is standard theory rendered from model knowledge with no named source"*) | 20 | A citation pass. `claim-backing` supplies the **mechanism** to bind prose; it does not supply the sources |
| No engine pass / unmeasurable cost | 22 | `make verify-draft` runs, then `rfc/engine-leverage.md` §2.3's derivation |
| Shape-entry prose ungrounded (*"Referencing them does not launder them"*) | 14 | Shape-library grounding; nothing in flight owns it |
| Timing-window thresholds authored | 7 | Blocked on a **game-level** corpus per the row **"The instrument the tempo layer needs is a game-level corpus, and calling it 'the explorer' is why four waves have re-derived that it does not exist"** (D155) |
| `perfect_tablebase` unavailable as an opponent | 5 | Tablebase opponent selection; unowned |
| Format / encoding gaps | 5 | `rfc/format-surface.md` in part |
| Human-play / practical difficulty (Maia) | 4 | No instrument; `design/04` §7's standing gap |
| Permanent properties | 2 | → `accepted` at migration |
| Pack-specific residue (fifty-move counter surfacing, ledger-unverified Syzygy roots, deviation-class/evaluation tension, objective-signature gaps) | 34 | Mixed; 4 of them are one `make verify-draft` run away |

**Packs that graduate at each stage** — computed as *packs whose entire `blocking` residue
falls inside the classes cleared so far*, which is an upper bound because §4.2's ~42 splits
add entries this classification cannot yet see:

| Stage | Packs graduating (blocker gate) | Packs also clean at published severity |
|---|---|---|
| Today | **0 of 47** | — |
| After the migration alone (§4) | **0 of 47** | — |
| + engine passes on the 27 packs with no engine evidence | **0 of 47** | — |
| + engine passes **and** an explorer band wave | **2 of 47** (`kid-classical-black`, `london-system-white`) | 0 |
| + the above **and** a citation pass | **10 of 47** | 1 (`anti-caro-advance`) |
| + everything except the Maia / human-play class | **43 of 47** | 7 |

**Three things this table says that must not be softened.**

1. **No in-flight RFC graduates a single pack on its own.** `claim-backing` claims no pack
   version, touches no `$defs`, and — verified — the strings `graduation`, `content/packs`,
   `reviewStatus` (except in the shipped `published ? "error" : "warning"` idiom) and
   `blocker` appear nowhere in it as a graduation statement. `engine-leverage` and
   `vocabulary-wiring` likewise. They supply *mechanisms*; **content waves clear blockers.**
   The RFC's payoff is that the count becomes knowable and the waves become countable.
2. **`claim-backing` is nevertheless a hard prerequisite for most of the corpus** — not
   through the blocker gate but through §5's published-severity gate. The row **"37 of the 61
   unbacked claims can NEVER earn admission"** (D97) means every `tablebase_exact` claim fails
   `EVIDENCE_OVERREACH` at error severity permanently until `claimBindings` lands. **37
   `tablebase_exact` claims across 12 packs** carry that shape at `1b89123` `[V]`. Those packs
   cannot be published, whatever their blocker list says.
3. **The explorer-grounding wave (`da77c56`, *"content: ground eleven packs on result splits —
   and fix a number I invented"*) added the evidence but not the binding.** 52
   `corpus_observed` labels now sit across 28 packs `[V]`, and D150 says the record kind that
   would back them does not exist at HEAD. So the wave moved the corpus/band class from
   *unmeasured* toward *measured-but-unbindable*, which is real progress and clears no
   blocker until `explorer_position_census` ships.

### §8 Register and version claims

#### §8.1 Pack schema — **claiming 0.27, loudly**

`DRILL_PACK_SCHEMA_VERSION` reads **`"0.23"`** at `1b89123` and
`schemas/drill_pack.schema.json`'s `$id` is `urn:chess-tabiya:schema:drill-pack:0.23` `[V]`;
codex is mid-implementation of `engine-leverage` on that lane. Claimed downstream: **0.24**
`vocabulary-wiring`, **0.25** `format-surface`. `rfc/README.md` records **0.26** as free —
*"`claim-backing` released it 2026-08-15 on the finding that its remedy is validator-and-
ledger only"*.

**This RFC claims 0.27 and does not take 0.26.** `claim-backing` round 2 is in flight and its
own cross-review has already found that it adds a pack-lint refusal in `pack-validation.ts`,
which is the kind of finding that reopens a released lane. Taking 0.26 would put this RFC in
a rebase race with the one RFC §7 names as a hard prerequisite. 0.27 collides with nothing.
If 0.26 is still free at acceptance, rebasing down is free by the register's own rule — the
`$id` is not part of any pack document, so **no digest moves on a version rebase**. That is a
different fact from §4.5, where the *field* change moves all 47 digests; the two must not be
conflated.

`rfc/README.md` is single-writer (claude's) and this RFC does not edit it. It **requests** a
row: `| 0.27 | pack-graduation.md | claimed 2026-08-16 — `$defs/graduationEntry`;
`$defs/provenance` declared and closed (`additionalProperties: false`). **Invalidates all 47
committed packs until the §4 migration lands in the same commit**; moves all 47 content
digests and requires a 32-ledger `packDigest` re-stamp |`.

#### §8.2 Everything else: nothing

- **Run schema: nothing.** `graduationBlockers` is never persisted in a run; no event, no
  occurrence, no policy.
- **Migration: nothing.** No table, no column, no `STORAGE_VERSION` bump. `pack_drafts` and
  `registered_packs` store documents as JSON blobs, and §1.5's legacy-string rule makes an
  old-shape stored draft refuse to register rather than requiring a rewrite. This is the one
  place the compatibility rule buys a whole migration number.
- **Shape-entry schema: nothing.**

## Deviations from design

None. `design/02-product-shape.md`'s hosted-multi-user ruling is what makes an empty
production catalogue a defect rather than a curiosity, and this RFC supplies the missing step
without touching the deployment axis. `design/03-product-breadth.md` B6 already names
publication channels as shipped; this RFC makes the *official* channel reachable, which B6
assumed and never specified. The 2026-08-13 no-review-workflow ruling is preserved exactly —
§1.1 gives it a home as an `accepted` condition and refuses to reintroduce review.

## Acceptance criteria

1. **Schema.** `$defs/provenance` declares all five attested keys and sets
   `additionalProperties: false`; `$defs/graduationEntry` exists with the closed `state` enum
   and the `oneOf` state/companion binding. All 47 authored packs, the 6 `*.browser.json`
   fixtures, `schemas/drill_pack.example.json` and every file under
   `schemas/fixtures/drill-pack/` validate — **in the same commit as criterion 3**.
2. **Gate.** `PackStudio.register` refuses on ≥1 `blocking` entry and **accepts** a pack whose
   entries are all `resolved`/`accepted`, with a positive test proving the second half (there
   is none today because the state was unreachable). `GRADUATION_BLOCKING_ON_PUBLISHED` fires
   at error on a `published` document with a `blocking` entry, at an exact JSON pointer.
3. **Migration completeness.** All 240 entries across 47 packs are typed; `make
   graduation-report` prints `0` legacy-shape entries corpus-wide.
4. **Stage A is bounded.** The migration script asserts that every entry matching the
   no-review-workflow substring is byte-identical to one of the **seven** attested variants,
   and **fails** otherwise. 37 of 37 must match. Each of the seven variants' trailing clauses
   is separately checked against the pack's other entries, and any clause stating a condition
   not otherwise recorded is split out as a `blocking` entry rather than absorbed into the
   `accepted` one.
5. **Stage B split count is reported, not asserted.** The migration commit's message records
   the realised `blocking` / `resolved` / `accepted` totals and the number of compound splits;
   §4.2's ~197 / ~48 / ~39 is a prediction and the shipped numbers are binding over it.
6. **Digests.** After the migration, `make sourcing-check DIR=content/drafts` reports **0**
   `EVIDENCE_DIGEST_STALE` — 32 of 32 ledgers re-stamped, which also clears the 5 already
   stale at `1b89123`.
7. **Corpus sweeps widened.** `opening-evidence.test.ts` and
   `packages/schema/src/drill-pack.test.ts` walk both roots; `expression-census.test.ts`
   counts both roots; `runExpressionCensus` refuses on a duplicate pack id across roots with a
   negative test. `make verify` is green **with a pack present in `content/packs/`** — proved
   by promoting one pack under a temporary fixture, not by argument.
8. **Move-not-copy is provable.** A test asserts no pack id resolves to a file in both
   `content/drafts/` and `content/packs/`.
9. **Root-agnostic pack paths.** `refusal-coverage.test.ts`'s hardcoded draft paths route
   through `resolvePackPath(id)`; the test passes with its packs in either root.
10. **The report is real.** `make graduation-report` runs from a clean checkout and its
    graduable-set line agrees with an independent re-derivation.
11. **Nothing else moved.** `DRILL_RUN_SCHEMA_VERSION` and `STORAGE_VERSION` are byte-
    identical to `1b89123`; no `$defs` outside `provenance` and the new
    `graduationEntry` changed.

## Open questions

1. **Does the first graduation happen in this RFC, or the next?** §7 measures that **0 of 47**
   packs graduate on the migration alone, so this RFC ships a working gate and an empty
   graduable set. That is honest but it means `content/packs/` stays empty and criterion 7's
   green `make verify` is proved against a temporary fixture. **Recommended: yes, ship it
   empty** — the alternative is curating a subset, which the owner refused. *Owner call; a
   law-5 question about whether an unmet gate may land.*
2. **Do the four `perfect_tablebase`-substitute mates packs get `accepted` after all?** §1.1
   refuses the fourth state and keeps them `blocking`. The counter-argument is that a mates
   pack drilled against `human_common` at 1200 is a *deliberate v1 product decision*, i.e.
   genuinely `out_of_scope`, not a debt. **Recommended: keep them `blocking`** — the
   substitution changes what the drill teaches, and §4.4's asymmetry says to err this way.
   *Owner call, because it is the exact judgment the ruling in §1.2 would license.*
3. **Does `sourcing-check` at published severity become a *gate* or stay a *check*?** §5
   states it as a fact of the shipped severity rules; it is not wired into any promotion
   script because there is no promotion script. Deferred to whichever RFC ships the first
   graduation, which is question 1's answer.
4. **Should `graduationBlockers` be renamed?** §1.4 says no, on cost. Recorded as deferred to
   any future RFC that already has reason to touch every emitter.
5. **Who audits Stage B?** The migration reads 203 entries and the auditor's judgment is the
   only thing between a real debt and an `accepted`. Recommended: one agent audits, a second
   independently re-audits the ~42 splits and the full `accepted` page, and the two are
   diffed. Not asserted as a criterion because a second pass cannot be tested for.

## Ledger rows

To be added to `design/BACKLOG.md` on acceptance (rows are the ledger's, edited in-commit per
the completion protocol). **Id block D173–D182.**

- **D173** 🐞 *`provenance.graduationBlockers` is three fields sharing one name, measured.* 240
  entries / 177 distinct across 47 packs; 37 are a permanent owner ruling, 48 are resolved
  history kept on purpose, 155 are real debt, and **0 of 47** packs has an empty list. The
  gate is unreadable by machine and unmeetable in practice for reasons that have nothing to do
  with content readiness. Sharpest single form: **the standing owner ruling that no pack
  review workflow will ever exist appears in 37 packs, in 7 wording variants, in a field whose
  contents block publication** — since 2026-08-13 the ruling has been functioning as the
  corpus's single largest and most permanent debt.
- **D174** 🐞 *42 of 48 resolution-marked blockers are compound.* A prefix classifier would
  retire 42 live debts. Two entries carry ALLCAPS status prefixes that read as resolutions and
  mean the opposite (`STILL UNTESTED…`, `CORPUS-CHECKED … and NOT ANSWERABLE`). The general
  rule: **a status recorded in prose cannot be migrated mechanically, and the corpus is the
  proof.**
- **D175** 🐞 *Graduation currently means exiting the corpus-wide gates.*
  `opening-evidence.test.ts` and `packages/schema/src/drill-pack.test.ts` sweep
  `content/drafts` only, so a promoted pack leaves schema conformance and evidence-sidecar
  checking. A gate you graduate **out of** is not a gate.
- **D176** 🐞 *`expression-census.test.ts` pins `corpus.packs` to the drafts count while the
  census walks both roots* — `make verify` goes red on the first promoted pack. Sibling:
  `runExpressionCensus` keys documents by absolute path with no id dedupe, so a pack in both
  roots is silently double-weighted in every ratio.
- **D177** 🐞 *40 of 47 packs fail `sourcing-check` at published severity, on 97 unbacked
  machine-labelled claims; 15 packs have claims and no ledger at all; 7 are clean.* The
  blocker gate is **not** the binding constraint for most of the corpus — publishing is.
  D162's row did not have this number.
- **D178** 💡 *`accepted` needs a printed page, not a lint.* No validator can distinguish a
  real permanent condition from a shrug. `make graduation-report`'s corpus-wide `accepted`
  page (~39 entries) is the guard, and it works only while it stays short enough to read.
- **D179** 🐞 *Setting `reviewStatus: "published"` moves the pack digest and staleness-warns
  its ledger.* `provenance` is inside `digestCanonicalJson`. 27 of 32 ledgers are fresh at
  `1b89123`, 5 already stale. Every future publish is a two-file commit, and nothing says so
  today.
- **D180** 💡 *`$defs/provenance` has exactly five keys corpus-wide and can be closed.*
  `reviewStatus` (64), `sources` (55), `graduationBlockers` (53), `reviewers` (41), `licence`
  (30). Closes the row `defect-batch-2` §6 proposed to the owner and never landed.
- **D181** 💡 *No in-flight RFC clears a graduation blocker.* `claim-backing`,
  `engine-leverage` and `vocabulary-wiring` supply mechanisms; content waves clear blockers.
  The standing confusion this row exists to stop: **an RFC that makes a debt payable is not an
  RFC that pays it**, and the ledger has repeatedly credited the first as the second.
- **D182** 🐞 *`refusal-coverage.test.ts` hardcodes four `content/drafts/…` paths, two of them
  packs that are clean at published severity.* Pack paths across the repo assume a pack never
  moves. The general form: **the drafts/packs split is a runtime concept that ~20 test files
  hardcode as a path constant.**

## Changelog

- 2026-08-16: created. All figures re-derived at `1b89123`; the corpus population is the 47
  authored packs in `content/drafts/`, excluding the six `*.browser.json` fixtures.
