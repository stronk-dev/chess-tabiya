# RFC: Pack graduation

- **Status:** **accepted 2026-08-16** — returned once by cross-review, all four returns
  ratified in the author round with three amendments. Two owner-facing open questions remain
  and neither blocks implementation. — **author return round complete 2026-08-16, ready to accept.** The
  cross-review returned the draft for four things it did not count; all four are ratified, three
  of them with the author's own amendment, and none is declined. The measurements behind them
  were re-run rather than re-read (§5's checker sweep, the candidate census, the digest
  freshness pass, the ruling-citation population) and all reproduce at HEAD `0241a98`. **Two
  author rulings the reviewer left open are made in the body:** `content/candidates/` is in
  scope for the schema and the typing and is **not** a graduation subject (§0.3, open question
  6), and the never-wired published-severity check is **partly this RFC's** — a strict gate over
  `content/packs/` here, a ratchet over `content/drafts/` here, and a named owner for the flip
  (§5.1, criterion 14, open question 3).
  *(`rfc/README.md` is single-writer and neither this cross-review nor this author round edits
  it; the status cell there is requested to read the same.)*
- **Author:** claude (agent), for Marco — return round 2026-08-16, ledger block **D237–D246**
- **Cross-review:** claude (agent), 2026-08-16 — ledger block **D203–D212**, all figures
  re-derived at `a7e700d` and re-verified at `9df06c6`
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
  packs it names** (§7) but not for this RFC's mechanics — **[cross-review] except for a
  landing-order obligation**: `claim-backing` round 2 re-claimed pack 0.26 and moves 35 pack
  digests / 29 ledgers, overlapping this RFC's 47 / 32, so whichever lands second re-stamps
  (§4.5, criterion 6)
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
Measured at `1b89123` and re-measured at HEAD `a7e700d`: **240 entries, 177 of them distinct,
across 47 authored packs, and 0 of 47 has an empty list** `[V]`. This RFC gives each entry a
**state** (`blocking` / `resolved` / `accepted`), makes graduation *zero `blocking` entries*,
specifies the migration and names its error mode, and rules what graduation mechanically
**is**: a file move from `content/drafts/` to `content/packs/` **and** a
`reviewStatus: "published"` flip **and** a ledger `packDigest` re-stamp, in one commit.
It then reports, measured, how many packs graduate now and after each in-flight work item —
and the honest answer is that a second gate, `sourcing-check` at published severity, is
stricter than the blocker gate and most of the corpus fails it today.

**[cross-review] Three corrections that change the shape of this summary, each landed in the
section that owns it — not here.** (1) The migration is **383 entries across 83 pack
documents**, because `content/candidates/`'s 36 packs sit inside the same closed schema policy
and were never counted (§3.1a, §4.0). (2) `accepted` **is** reachable by assertion as drafted,
and now requires a resolving `accepted.rulingRef` plus a committed `accepted` page (§1.2). (3)
The second gate is worse than reported: running the checker rather than re-deriving it gives
**43 of 47 failing at published severity, 4 clean not 7, and 15 of 47 failing at draft severity
today** (§5) — and `sourcing-check` is not part of `make verify` at all, so after a pack moves,
the check that escalated it stops seeing it (§5, §6, criterion 14).

**[author round] All four returns are ratified and the fourth one reorders this summary.** The
headline was *"graduation exits the gates"*, and §6 fixed that for the two `readdir` sweeps.
The cross-review found the same disease at a third gate and worse — **the published-severity
sourcing check was never wired to anything at all**, so §5's *"a pack graduates only if
`sourcing-check` also passes"* described a command a human types, aimed at the directory a
published pack has just left. That is not a footnote to the mechanism; it is the mechanism's
load-bearing half missing. **The corrected headline is: two of the three gates graduation
escapes are `readdir` sweeps that can be widened, and the third was never a gate.** §5.1 rules
what this RFC does about it, and the ruling is deliberately partial rather than deferred,
because a full wiring would redden `make verify` for a debt §0.3 refuses to pay here.

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
**383 entries across 83 pack documents** (**[cross-review]** — the draft scoped this to the 240
in `content/drafts/` and missed `content/candidates/`, §3.1a), **the four emitters that write
the field** (§1.6), the mechanical definition of graduation, and the repo-wide consequences of
`content/packs/` becoming non-empty.

**[author round] `content/candidates/` is in scope for the schema and the typing, and is not a
graduation subject. Both halves are rulings, and the second is the one the cross-review left
open.** The reviewer's §3.1a is ratified as measured — re-derived independently at HEAD:
**36 `content/candidates/*/pack.json` documents, 143 bare-string entries, 7 distinct texts,
min 1 / max 6 per pack, none empty, zero matching Stage A's substring, and exactly the same
five provenance keys with no sixth** `[V]`. `packages/schema/src/drill-pack.test.ts`'s
*"validates every committed pack document under the closed policy"* enumerates them and asserts
`validate(value)` is `true`, so the schema change reaches them whether this RFC mentions them
or not.

**The exclusion the return invited was considered and is declined, on this RFC's own argument.**
Excluding candidates from the closed-schema policy means narrowing `drill-pack.test.ts` to stop
sweeping a directory of documents that the same emitters produce and the same validator
accepts — that is *"a gate you graduate out of is not a gate"* (§6) applied in advance, and
paying for a cheap schema change by deleting a check is the exact move this RFC exists to
refuse. There is no second schema to move them to that does not immediately drift from the
first. So they migrate, mechanically, via §4.0.

**What is ruled *out* is the other reading — that a candidate is a thing that graduates.** A
candidate is pre-draft emitter output; the graduation gate (§2) and the three-step mechanical
definition (§5) apply to `content/drafts/` → `content/packs/` and to nothing else. A candidate's
`blocking` entries are what the candidate→draft promotion path must read, and this RFC does not
own that path. The consequence is a reporting rule, not a mechanism: **`graduation-report`
prints no corpus-wide `blocking` total at all** — every total is per root (§3.3, criterion 3) —
because a single number of ~340 merges 143 emitter placeholders with 197 authored debts and
would be read as a content measurement. This answers open question 6 rather than deferring it.

**Out of scope, explicitly:** (a) *doing* any of the grounding work the blockers record —
this RFC makes the debt legible and countable, it does not pay it; (b) curating a subset of
packs for promotion, which the owner refused by name; (c) any change to what
`reviewStatus: "published"` means for *severity* — `sourcing/check.ts` already escalates
`EVIDENCE_TYPE_UNBACKED` and `DEVIATION_COST_UNBACKED` from warning to error on published and
that stays exactly as it is; (d) community packs' registration path beyond a one-predicate
change (`PackStudio.register`); (e) reintroducing a pack review workflow, which is refused by
the 2026-08-13 owner ruling this RFC finally files in the right place; **(f) [author round] the
candidate→draft promotion path, and any reading of a candidate's blockers as content debt.**

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
**deliberately refused**, and the refusal is the load-bearing decision in §1.

**[cross-review] The `perfect_tablebase` population is 3 + 2, not 5, and the draft
contradicted itself on it.** §1.1 and §7 said *five*; open question 2 said *the four*. Grepped
at HEAD over all 240 entries, `perfect_tablebase` appears in **exactly 5 entries in 5 packs**,
and they are **two different conditions** `[V]`:

- **3 substitution entries** — `mate-k-q-technique`, `mate-k-r-technique`, `mate-two-bishops`:
  *"The natural opponent for a mates pack is `perfect_tablebase`; that mode is
  declared-unimplemented in v1, so `human_common` at 1200 stands in"* (1700 in
  `mate-two-bishops`). **These are the deferred-on-unlanded-work shape** and the ones the
  refusal is about.
- **2 provider-availability entries** — `mate-bishop-knight`, `trajectory-mate-bishop-knight`:
  *"`perfect_tablebase` is published only where a tablebase provider is configured; a
  deployment without one will not offer the opponent this content was verified against."*
  That is **not** blocked on unlanded work — the mode exists and is declared; it is a property
  of a deployment's configuration. It is a `permanent_property` candidate, and Stage B must not
  file it with the other three by keyword.

**[author round] Ratified — 5 entries in 5 packs, and the 3 + 2 split is visible in the strings
themselves, not inferred.** Re-grepped at HEAD: the three substitution entries all read *"that
mode is declared-unimplemented in v1, so `human_common` at 1200/1700 stands in"*, and the two
provider entries read *"published only where a tablebase provider is configured"* `[V]`. The
draft's *five*-versus-*four* self-contradiction (§1.1/§7 against open question 2) was a
symptom of exactly this: **two populations under one keyword count as one number until someone
reads the sentences.** §7's class-table row and open question 2 are corrected accordingly.

A fourth state would let every substitution entry stop counting, and *"we are waiting on
someone else"* is the single most reusable sentence in software. **A blocker whose fix lives in
another RFC is `blocking`, with `clearedBy` naming that RFC.** It costs the three substitution
packs their graduation until tablebase opponent selection ships, which is the correct and
honest outcome: the pack really is drilling mating technique against an opponent it was not
verified against.

**[cross-review] `clearedBy` is never resolved and never printed, so it cannot be audited
either way.** It is free text (§1), it does not touch the gate predicate (§2), and §3.3's
report prints only `id` + `statement` for blocking entries — so a `clearedBy` naming an RFC
that does not exist, or one whose named section landed months ago, is invisible. The refusal of
the fourth state survives this (a stale pointer still cannot make the entry stop counting), but
the pointer earns nothing today. Two cheap changes make it earn something: §3.3 prints
`clearedBy` beside every blocking entry, and §3.2 raises `GRADUATION_CLEAREDBY_UNRESOLVED` at
**warning** when a `clearedBy` contains a repo-path-shaped token (`rfc/…`, `docs/…`,
`content/…`, `packages/…`, `apps/…`) that does not exist on disk. Checked at HEAD: the §1
example's `rfc/engine-leverage.md` §2.3 does resolve — `rfc/engine-leverage.md:385` is
`### 2.3 The arithmetic` `[V]` — so the example survives its own new lint.

#### §1.2 `accepted` is expensive on purpose

`accepted` is the laundering channel — the one state that can graduate a pack that should not
graduate — so the schema makes it costly to reach:

- **`accepted.kind` is a closed three-value enum.** `owner_ruling` requires a dated ruling
  quoted in `accepted.ruling`. `permanent_property` requires a stated impossibility that is a
  property of the world, not of our backlog. `out_of_scope` requires the boundary to be named.
- **A missing or empty `accepted.ruling` is a validation error**, not a warning (§3.2).
- **[cross-review] `accepted.rulingRef` is required and must resolve** — see the two
  corrections below.
- **The accepted set is a single reviewable page.** §3.3 ships `make graduation-report`,
  which prints every `accepted` entry in the corpus with its `kind` and `ruling`. Today that
  page would be **~38** entries (37 owner-ruling + **1** permanent-property — corrected below);
  it stays small enough that one person can read all of it in one sitting. A lint cannot
  tell a real acceptance from a shrug; a short, printed, corpus-wide list can.

**[cross-review] Correction 1 — the two worked examples in this section were both wrong, and
the errors ran in the direction that makes `accepted` look better attested than it is.**
Re-derived at HEAD over all 240 entries:

| Draft claim | Measured |
|---|---|
| *"the corpus already has two [permanent properties]"* | **one** — `rook-4v3-same-side` entry 1 (*"This position holds eleven pieces. Syzygy tops out at seven… a permanent property of the material, not a task nobody has run yet"*). A regex over every entry for `permanent` / `never be` / `cannot be obtained` / `impossib` / `tops out` returns that entry and nothing else `[V]` |
| *"the `rook-4v3-same-side` sibling explicitly 'deliberately is not smuggled in here'"* | **that sentence is not in `rook-4v3-same-side`.** It is in `content/drafts/pawn-breakthrough-convert.json:389`, and its subject is *"The famous 3v3 sibling root (a5b5c5 vs a7b7c7)"* — a pack that does not exist, not a boundary on this pack's debt `[V]`. `rook-4v3-same-side`'s seven entries contain no `out_of_scope`-shaped clause at all |

So the corpus supplies **one** attested `permanent_property` and **zero** attested
`out_of_scope`. Two of the three `kind` values ship with no corpus precedent, and §3.3's page
shrinks to ~38. Both numbers are downstream of the same error: the section was written from
memory of the corpus rather than from a grep of it, which is the failure mode a `kind` enum
whose values are pure prose invites.

**[cross-review] Correction 2 — `accepted` IS reachable by assertion as drafted, and the
draft's own guard is weaker than it states.** Three measured defects:

1. **`kind` buys nothing mechanically.** §3.2's only acceptance lint is
   `GRADUATION_ACCEPTED_WITHOUT_RULING` — *missing or blank `accepted.ruling`*. Nothing
   distinguishes the three kinds: `permanent_property`'s *"stated impossibility"* and
   `out_of_scope`'s *"named boundary"* have **no required field the other kinds lack**. All
   three collapse to *one non-blank string*. `{"kind":"out_of_scope","ruling":"Out of scope."}`
   validates, clears the entry, and graduates the pack.
2. **The quoted ruling is checked against nothing.** `ruling` is free text with no target, so
   an author writes *"Owner ruling 2026-08-16: this is fine"* and no gate in the repo disagrees.
   The draft concedes this (*"a lint cannot tell a real acceptance from a shrug"*) and then
   rests the entire guard on a printed page that **no criterion requires anyone to read** —
   criterion 10 asserts only that the report *runs* and that its graduable-set line reproduces.
3. **The concession is unnecessary, and the corpus proves it.** Owner rulings in this
   repository are written down and dated. `grep -o "owner ruling 20..-..-.."` over `design/`
   returns **21 dated mentions across ~~8~~ 6 distinct dates** (**[author round]** — the 21
   reproduces exactly; the dates are 2026-08-10, -11, -12, -13, -15, -16, which is six, and the
   reviewer's *eight* was a case-folding artefact) `[V]`, and this RFC's own canonical
   ruling — the 2026-08-13 no-review-workflow one — is recorded in **five** living-tier
   locations: `planning/exploration/log.md:1231`, `planning/exploration/gates.md:98`,
   `design/BACKLOG.md:528`, `design/research/README.md:120`,
   `design/05-in-run-experience.md:76` `[V]`. A ruling that cannot be pointed at is not a ruling
   this project made.

**The fix, and it is law 3 applied to a field that was exempting itself from it.** Every
`accepted` entry carries `accepted.rulingRef`: a repo-relative path, optionally
`path#anchor-or-line`. `GRADUATION_RULING_UNCITED` (§3.2, **error**) fires when `rulingRef` is
absent, when the path does not exist, or — for `kind: "owner_ruling"` — when the referenced
file does not contain the date `accepted.ruling` quotes. This is exactly the citation standard
`design/research/README.md` already imposes on every dossier sentence, and the migration pays
it once: Stage A's 37 canonical entries all take the 2026-08-13 owner-rulings entry in
`planning/exploration/log.md`, and the single `permanent_property` takes the Syzygy 7-piece
bound. **`accepted` then costs a real citation rather than a sentence**, and the printed page
becomes a *second* guard rather than the only one.

**[author round] Ratified, and the citation is satisfiable for all 37 — verified rather than
assumed, because a required citation that cannot be paid blocks the migration it exists to
enable.** The target resolves: `planning/exploration/log.md` line **1231** is
`## 2026-08-13 (owner rulings) — no review workflow; predictions show numbers, not verdicts`,
and the file contains the string `2026-08-13` `[V]`, which is the whole of what
`GRADUATION_RULING_UNCITED` checks. All 37 entries quote the **same** ruling in seven wording
variants (§4.1), so they take the **same** `rulingRef` and the citation cost of Stage A is one
reference, not 37 — the lint is a floor on honesty, not a research task.

**Two amendments to the reviewer's fix, both about the form of the reference.**

1. **The anchor the reviewer wrote does not resolve, and the schema must not invite it.**
   `planning/exploration/log.md#2026-08-13-owner-rulings` is not the slug of that heading — the
   GitHub-style slug carries the whole title through *"…not-verdicts"*. **`rulingRef` takes
   `path` or `path#L<line>`, and nothing else.** A slug form would need an anchor resolver the
   lint does not have and would fail open on every typo, which is how a citation lint becomes
   decoration. Stage A's canonical reference is therefore
   **`planning/exploration/log.md#L1231`**.
2. **A line reference into `log.md` is stable, and that is not a coincidence.** Law 7 makes
   `planning/exploration/log.md` append-only, so line 1231 can never move; the one living-tier
   file that is a safe line-citation target is the one the rule protects. Where a future
   `accepted` entry cites a *mutable* file, `rulingRef` must be the bare path and
   `accepted.ruling` must quote the dated sentence, which is what the date check already
   enforces. This is recorded as a rule rather than a preference: **`#L<line>` is permitted only
   into append-only files.**

**And the page must be a committed artifact, not a command.** `make graduation-report`
writes its `accepted` section to a checked-in file (`content/accepted-conditions.md`), and a
test asserts the file is byte-identical to a fresh run — the same shape as
`tools/verify-scaffold.mjs`. A new acceptance then arrives as a **diff line in a review**
rather than as output nobody ran. A page whose only reader is the person who wrote the entry is
not a guard; a diff is.

#### §1.3 One entry states one condition

An entry states one condition. The corpus violates this heavily today (§4.2) and the
migration's main manual cost is splitting compound entries. **This rule is not machine-
enforceable** — no lint can tell that a sentence carries two conditions — and this RFC does
not pretend otherwise. It is enforced by the migration audit and by the `graduation-report`
page, and that limit is stated here rather than hidden.

#### §1.4 The field keeps its name

`graduationBlockers` now holds non-blocking entries, so the name is imprecise. It is kept
anyway. Renaming would touch **four** emitters (`distill.ts` `distillRun`,
`sourcing/openings.ts`, `sourcing/syzygy.ts`, `sourcing/position-seeds.ts` — the draft said
*five* and listed four; grepped at HEAD there are exactly four writers `[V]`
**[cross-review]**), two readers (`PackRegistry.projectPackDocument`, `PackStudio.register`),
one test assertion (`sourcing/syzygy.test.ts`), and every archived RFC that cites the field —
for a semantic improvement that §1.1's `state` already delivers. The objection is recorded, not
acted on.

#### §1.6 **[cross-review]** The four emitters must be retyped in the migration commit — the draft left them writing the legacy shape

This is the sharpest single break found in the draft, because it makes the RFC as written
**unlandable in one green commit**. The four writers above are named only in §1.4's
*rename-cost* paragraph, which concludes *"the objection is recorded, not acted on"* — but the
change §3.1 actually makes is not a rename. Typing the array retypes what those four
functions must emit, and all four emit `string[]` at HEAD `[V]`:

| Site | Line | What it writes |
|---|---|---|
| `apps/server/src/distill.ts` | 82 | `graduationBlockers: blockers` where `blockers` is `string[]` |
| `apps/server/src/sourcing/openings.ts` | 116 | a literal `["objective.summary is the emitter's mechanical placeholder…"]` |
| `apps/server/src/sourcing/position-seeds.ts` | 249 | `graduationBlockers: blockers` (`string[]`) |
| `apps/server/src/sourcing/syzygy.ts` | 187 | `graduationBlockers: blockers` (`string[]`) |

`validatePackDocument` compiles `schemas/drill_pack.schema.json` with Ajv
(`apps/server/src/pack-validation.ts:86–88`, `ajv.compile(schema)`) `[V]`, so a typed array is
enforced against emitted documents and not only against committed ones. Two shipped tests then
go red the moment §3.1 lands without §1.6:

- `apps/server/src/distill.test.ts:11` asserts `validatePackDocument(first.document).issues`
  `toEqual([])` and `.valid` `toBe(true)` over a `distillRun` output — that output would carry
  four bare strings `[V]`.
- `apps/server/src/sourcing/syzygy.test.ts:143` asserts
  `pack.provenance.graduationBlockers` `toContain("Exact tablebase grading is available…")` —
  a bare-string membership test that cannot pass against objects `[V]`.

§1.5's legacy-string rule does **not** cover this. That rule exists for *stored learner drafts*
(§8.2) and downgrades them to `blocking` at **warning**; it says nothing about a first-party
emitter that produces a document the schema now refuses. **All four emitters emit typed entries
with stable `id`s, and both test assertions move to the typed shape, in the migration commit.**
Acceptance criterion 12.

**[author round] Ratified without reservation — this is the return's sharpest finding and the
draft's §1.4 conclusion (*"the objection is recorded, not acted on"*) was simply wrong about
what it was declining.** §1.4 declined a *rename*; §3.1 performs a *retype*, and a retype is not
optional for a producer whose output is validated. Re-verified at HEAD: four writers, all
`string[]`, at `distill.ts:82`, `sourcing/openings.ts:116`, `sourcing/position-seeds.ts:249`,
`sourcing/syzygy.ts:187`; two readers; `validatePackDocument` compiling the JSON schema through
Ajv (`pack-validation.ts`, `validator()` → `ajv.compile(schema)`); and both named test
assertions present in the legacy shape `[V]`. And the break is harder than the two red tests
say: **three of the four emitters validate their own output and throw.**
`openings.ts:120`, `position-seeds.ts:252` and `syzygy.ts:190` each run `validatePackDocument`
on the document they just built and raise `SourcingError("EMITTED_PACK_INVALID")` when it fails
`[V]`, and `valid` is `!issues.some(severity === "error")` with schema violations at error
(`pack-validation.ts`) `[V]`. So without §1.6 those three emitters do not emit an invalid
document — **they stop emitting at all**, at run time, for every future sourcing wave. Only
`distill.ts` lacks the self-check, and it is the one whose test carries the assertion instead.

**One amendment the reviewer's fix needs to be implementable: *stable* `id`s cannot be derived
from the emitted text, because two of the seven texts are templated.** `sourcing/syzygy.ts`
emits `` `opponent mode ${options.opponent} is an authoring choice…` `` and
`` `…this draft still requests ${options.opponent}, which can deviate from perfect play` ``, so
a text-derived id changes with the caller's options `[V]`. **The `id` is a property of the
emitter's blocker *template*, not of its rendered statement.** Each emitter declares a named,
checked-in template list — id plus template — and emits `{id, state: "blocking", statement}`
where `statement` is the rendered text; §4.0's Stage 0 reads the same list to assign ids to the
already-emitted candidates. That is what makes *"Stage 0 and §1.6 must agree on those `id`s"*
(§4.0) a mechanical check rather than a convention: **the agreement is a shared constant, and
criterion 12 asserts the migrated `content/candidates/` ids are exactly the ids a fresh
emission produces.** The four texts unique to `position-seeds.ts` and the shared
`objective.summary` placeholder cover 5 of the candidate corpus's 7 texts; the remaining two
(the `immediate_blunder_guard` defect note ×2, the rendered `strong_engine` choice ×1) are
authored or interpolated residue and take Stage 0's generated ids.

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

**[cross-review] The five-key census reproduces exactly — and it survives a widening the draft
did not run.** Re-derived at HEAD over the draft's own scope: 64 files carry a `provenance`
object, with `reviewStatus` 64 / `sources` 55 / `graduationBlockers` 53 / `reviewers` 41 /
`licence` 30, and no sixth key `[V]`. Widened to every `.json` in the repo outside
`node_modules` and `archive/`, a sixth key does appear — **`attribution`, in 25 files** — but
all 25 are `content/shapes/*.json`, which validate against `schemas/shape_entry.schema.json`,
whose **own** `$defs/provenance` is already `"additionalProperties": false` with
`required: ["licence","sources","attribution"]` (`schemas/shape_entry.schema.json:88`) `[V]`.
Two independent provenance vocabularies, no `$ref` between them, no collision. The claim holds.

This RFC declares all five and sets `additionalProperties: false`. That closes the row
`rfc/archive/defect-batch-2.md` §6 proposed to the owner and never landed — *"`$defs/
provenance` and `$defs/feedbackClaim` are the last open objects in the pack schema;
provenance's openness is load-bearing (`licence`/`reviewers`/`graduationBlockers` are
undeclared) — declare the vocabulary, then close them"*. **[cross-review] The draft then said
*"`$defs/feedbackClaim` stays open; this RFC closes one of the two"* — that is stale at HEAD.**
`rfc/claim-backing.md` round 2 (`aebe1a5`) re-claimed pack **0.26** and its §5.1 flips
`$defs/feedbackClaim` to `additionalProperties: false`, *"closing D112 at zero cost — all 182
of 182 claims have the key set exactly `{id, text, evidenceTypes}`"* (`rfc/README.md` pack-version register, row **0.26**) `[V]`.
So `defect-batch-2` §6's row is closed by **two** RFCs, one object each, and this RFC closes
the second of the two rather than one of two open ones. No lane collision (§8.1) — but the
sentence claiming feedbackClaim stays open is withdrawn.

**[author round] Ratified, with the tense made exact.** At HEAD both objects are still open in
the shipped schema: `$defs/feedbackClaim.additionalProperties` is `true` and
`$defs/provenance.additionalProperties` is `true` with only `reviewStatus` and `sources`
declared `[V]` — `claim-backing` has not landed. So the correct statement is **forward-looking**:
this RFC no longer *can* claim to be closing one of two remaining open objects, because the
other one is claimed. Whichever of the two lands first closes one and leaves the other open for
exactly as long as the second takes. The withdrawal is right; the `defect-batch-2` §6 row is
closed by two RFCs jointly and by neither alone.

`graduationBlockers` is declared as an array of `$defs/graduationEntry`, a closed object with
`required: ["id","state","statement"]`, `state` a closed three-value enum, `accepted` and
`resolved` as closed sub-objects, and a `oneOf` binding `state` to its companion
(`state:"accepted"` requires `accepted` and forbids `resolved`, and symmetrically).

#### §3.1a **[cross-review]** The invalidated population is **83 pack documents, not 47** — `content/candidates/` was never counted

**The draft's migration scope misses an entire population that a shipped test validates against
the same schema.** `packages/schema/src/drill-pack.test.ts:209–227` — *"validates every
committed pack document under the closed policy"* — builds its document list as
`schemas/drill_pack.example.json` + `schemas/fixtures/drill-pack/terminal-outcome.browser.json`
+ **every `content/drafts/*.json`** + **every `content/candidates/*/pack.json` that exists**,
and asserts `validate(value)` is `true` for each `[V]`. Measured at HEAD:

| Population | Documents | `graduationBlockers` entries | Entry shape |
|---|---|---|---|
| `content/drafts/` authored packs | 47 | 240 | bare strings |
| **`content/candidates/*/pack.json`** | **36** | **143** | **bare strings** |
| **Total inside the closed policy** | **83** | **383** | |

The 36 candidate packs carry the same five provenance keys and no sixth `[V]`, so §3.1's
closure is safe for them — but **typing the array is not**. Their 143 entries collapse to just
**7 distinct strings** (36 × *"objective.summary is the emitter's mechanical placeholder…"*,
26 × four more emitter placeholders, 2 × the `immediate_blunder_guard` defect note, 1 ×
a `strong_engine` authoring choice) `[V]`, min 1 / max 6 per pack, none empty, and **zero** of
them match Stage A's no-review-workflow substring `[V]`.

Three consequences the draft does not carry:

1. **`make verify` goes red on landing**, from `drill-pack.test.ts`, not only from
   `expression-census.test.ts` (§6). There are **two** hard breakages, not one.
2. **§4's arithmetic is 60% short.** The migration types 383 entries across 83 documents.
3. **§3.3's report is blind to the population that breaks the build** — it walks
   `content/drafts/` and `content/packs/` only, so criterion 3's *"`0` legacy-shape entries
   corpus-wide"* would print `0` while 143 legacy entries sit in `content/candidates/`.

Fixes, all landed below: §4.0 adds the mechanical candidate stage; §3.3 walks
`content/candidates/*/pack.json`; criteria 1 and 3 name the population.

**[author round] Every figure in this section reproduces at HEAD, independently counted, and the
scope growth is accepted** — 36 documents, 143 entries, 7 distinct texts, min 1 / max 6, none
empty, zero Stage-A matches, five provenance keys and no sixth `[V]`; and the closed-policy
test's document list is unchanged at HEAD from the version the reviewer read `[V]`. §0.3 rules
what *kind* of scope this is: schema and typing, not graduation. **The third consequence above
is upgraded from a report fix to a rule** — §3.3 prints no merged corpus total at all, rather
than printing one alongside the per-root breakdown, because the merged number has no honest
reading (§0.3).

**Migration ordering constraint:** the schema tightening and the content migration must land
in the **same commit**, because closing `additionalProperties` and typing the array
invalidates all **83** committed pack documents the instant either half lands alone.

#### §3.2 New lint codes

Raised by `validatePackDocument` (`apps/server/src/pack-validation.ts`), which is the layer
that already carries the `reviewStatus === "published"` branch:

| Code | Condition | Severity |
|---|---|---|
| `GRADUATION_ENTRY_ID_DUPLICATE` | two entries share an `id` within one pack | error |
| `GRADUATION_ACCEPTED_WITHOUT_RULING` | `state: "accepted"` with missing/blank `accepted.ruling` | error |
| **`GRADUATION_RULING_UNCITED`** **[cross-review]** | `state: "accepted"` with missing `accepted.rulingRef`, a `rulingRef` path that does not exist, or — for `kind: "owner_ruling"` — a referenced file not containing the date `accepted.ruling` quotes (§1.2 correction 2) | **error** |
| **`GRADUATION_CLEAREDBY_UNRESOLVED`** **[cross-review]** | `clearedBy` contains a repo-path-shaped token (`rfc/`, `docs/`, `content/`, `packages/`, `apps/`, `planning/`) that does not exist on disk (§1.1) | warning |
| `GRADUATION_RESOLVED_WITHOUT_RESOLUTION` | `state: "resolved"` with missing `resolved.at` or blank `resolved.by` | error |
| `GRADUATION_ENTRY_LEGACY_SHAPE` | an entry is a bare string | warning (§1.5) |
| `GRADUATION_BLOCKING_ON_PUBLISHED` | `reviewStatus: "published"` with ≥1 `blocking` entry | **error** |

`GRADUATION_BLOCKING_ON_PUBLISHED` is the one that matters. It makes the gate hold at the
*document* layer as well as at the studio's registration path, so a pack cannot be hand-moved
into `content/packs/` with `published` set and outstanding debt. It is an error at every
review status because it is only reachable at `published`.

#### §3.3 `make graduation-report`

A new target over `apps/server/src/graduation-report.ts`, built the way `expression-census`
is (`esbuild` bundle → `node dist/…`). It walks `content/drafts/`, `content/packs/` **and
`content/candidates/*/pack.json` (§3.1a — 36 documents, 143 entries, all of them inside the
same closed schema policy; a report that cannot see them reports `0` legacy entries while the
build is red)** **[cross-review]** and prints, deterministically:

- per pack: counts by state, and the `id` + `statement` **+ `clearedBy`** of every `blocking`
  entry (**[cross-review]** §1.1 — an unprinted pointer cannot be audited);
- totals by state **per root, and only per root** — so `content/candidates/`'s legacy residue
  cannot hide inside a corpus-wide zero, and (**[author round]**, §0.3) so no merged
  `blocking` total is ever printed: ~340 across three roots adds 143 emitter placeholders to
  197 authored debts and would be quoted as a content measurement;
- **the full `accepted` page** — every `accepted` entry, grouped by `kind`, with its `ruling`
  **and its `rulingRef`**;
- the graduable set: packs with zero `blocking` entries.

**[cross-review] The `accepted` page is written to `content/accepted-conditions.md` and
committed**, with a test asserting byte-identity against a fresh run (§1.2 correction 2). The
draft rested the whole `accepted` guard on a page no criterion required anyone to read; a
committed file makes each new acceptance a diff line in a review instead.

`design/BACKLOG.md` row **"`make expression-census` is blind to corpus grounding — identical
in all nine fields before and after eleven packs gained result-split evidence"** (D152) is the
argument for shipping this rather than leaving it to ad-hoc scripts: the repo's only
corpus-wide content instrument cannot see grounding, so a wave that clears blockers currently
has no headline instrument. This is that instrument for this axis.

### §4 The migration — a mechanical pass with a hand-audited residue

**Method: two mechanical rules, then 203 entries by hand, with `blocking` as the default.**

#### §4.0 **[cross-review]** Stage 0 — `content/candidates/`, mechanical, 143 entries, no judgment

§3.1a's missing population is migrated first and mechanically, because nothing in it needs a
judgment. All 143 entries across the 36 `content/candidates/*/pack.json` documents are bare
strings, collapse to **7 distinct texts**, and **none** matches Stage A's substring `[V]`. Each
becomes `state: "blocking"` with a generated `id` and the original string as `statement`,
verbatim — the same rule §4.1 applies to its residue, with no `resolved` and no `accepted`
reachable from this stage at all. Five of the seven are emitter placeholders, which is the same
text §1.6's `sourcing/openings.ts:116` and `sourcing/position-seeds.ts:249` will now emit in
typed form, so Stage 0 and §1.6 must agree on those `id`s.

There is no hand audit here and no error mode worth naming: the stage can only produce
`blocking`, which is §4.4's safe direction by construction.

**[author round] The stage is ratified, and *"generated `id`"* is pinned so that the agreement
with §1.6 is mechanical rather than aspirational.** Ids come from the emitter template registry
§1.6 introduces, keyed on the **template**, not on the rendered statement — two of the seven
candidate texts are interpolated (`syzygy.ts` renders `options.opponent` into both), so a
text-derived id is not stable across callers `[V]`. The two texts with no emitter template (the
`immediate_blunder_guard` defect note in 2 packs, the rendered `strong_engine` choice in 1) take
a slug of their first clause. Criterion 12 asserts a fresh emission produces the ids Stage 0
wrote, which is the only check that catches the two stages drifting apart later.

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

So the migration's arithmetic is — **[cross-review] restated over 383 entries across 83
documents, not 240 across 47 (§3.1a), and with the `accepted` total corrected from ~39 to ~38
(§1.2 correction 1)**:

| | `content/drafts/` (47 packs) | `content/candidates/` (36 packs) | Total |
|---|---|---|---|
| Today | 240, all untyped | 143, all untyped | **383 untyped** |
| After Stage 0 | — | 143 `blocking` | |
| After Stage A | 37 `accepted`, 203 `blocking` | 143 `blocking` | 37 / 0 / 346 |
| After Stage B | ~38 `accepted`, ~48 `resolved`, **~197 `blocking`** | 143 `blocking` | **~38 / ~48 / ~340** |

**The migration makes the corpus's blocking debt larger than the field's current entry count
for real work (155 → ~197 in `content/drafts/`, and ~340 corpus-wide), not smaller.** That is
the correct outcome and it is the point: the extra ~42 were always there, hidden inside
sentences whose first word said "RESOLVED", and the extra 143 were always there in a directory
no graduation instrument looked at.

#### §4.3 Why not a mechanical classifier over the resolution prefixes

Because the corpus's own prose defeats it, measured two ways:

1. **42 of 48 prefix-matched entries are compound** (§4.2). A prefix classifier marks all 48
   `resolved` and **silently retires 42 live debts** — the exact failure this RFC exists to
   prevent. **[cross-review]** 48-across-19-packs reproduces exactly at HEAD `[V]`; the *42* is
   a **hand count**, and a deliberately loose mechanical proxy (any of *does not / remains /
   still / untouched / not a proof / stays / cannot / left as authored / says nothing*) returns
   **47 of 48** `[V]`. So 42 is a **floor**, not a measurement, and the `[V]` label on it is
   downgraded to what it is: a judgment, bounded below by a reproducible 47.
   **[author round] 48-across-19 reproduces exactly; the proxy returns 45, not 47, and the
   difference is the point.** Re-run at HEAD with the same nine tokens, the proxy hits **45 of
   48** `[V]`; the reviewer's 47 is reachable only with a looser tokenization. Neither number is
   the answer — **a proxy whose result moves by two on a word-boundary choice is exactly the
   instrument §4.3 exists to refuse**, and quoting it to three significant figures repeats the
   draft's original error in the other direction. The claim that survives: **42 is a hand-counted
   floor, and no mechanical proxy tried so far scores below it.** That is what Stage B is for.
2. **The prefixes are not reliable signals of state, and the draft found two of the
   inversions** — *"CORPUS-CHECKED … and NOT ANSWERABLE"* and *"STILL UNTESTED after the
   2026-08-15 engine pass"*. **[cross-review] The second was attributed to the wrong pack:
   `STILL UNTESTED` appears once in the corpus, in `anti-italian-center-attack-black`, and zero
   times in `kid-mar-del-plata-white`** `[V]`. That is the **third** misattributed pack name in
   this RFC (with §1.2's two), and the general form is worth stating: *this draft's numbers
   reproduce and its pack-name citations do not*, because the counts were scripted and the
   names were recalled. **There are more inversions, and they run in both directions.** Grepped
   at HEAD over all 240 entries for ALLCAPS tokens:
   - **`CORPUS-CHECKED … and NOT ANSWERABLE from repo data` is in three packs, not one** —
     `opening-principles-black`, `opening-principles-white`, `opponent-intent-early-queen`,
     byte-identical `[V]`. The draft named only the first. **All three are in §5's
     published-severity clean set**, so this inversion sits on the packs closest to graduating.
   - **`ENGINE-CHECKED` prefixes a refutation twice more.**
     `anti-sicilian-najdorf-english-attack`: *"ENGINE-CHECKED 2026-08-15 and the 8.Qd2 claim is
     REFUTED… the class was left as authored"*. `italian-center-attack-white`:
     *"ENGINE-CHECKED 2026-08-15 and REFUTED at three points inside the sequence, which is three
     more than the blocker's own stated bar of one"* `[V]`.
   - **The worst case is `anti-caro-advance`**, whose `ENGINE-CHECKED 2026-08-15` entry ends:
     *"The pass did surface **a new and worse problem the blocker did not anticipate**: the
     spine's model answer is the third-ranked of its own four candidates, and the deviation
     classed as a conceptual error is the first"* `[V]`. A resolution prefix on an entry that
     **opens** a defect — in the one pack that is clean at published severity (§5) and therefore
     the single most likely first graduation in the corpus. A prefix classifier retires it; a
     careless Stage B retires it; and the pack graduates carrying a named, unresolved defect.
   - **The inversion runs the other way too**, which no classifier survives:
     `maroczy-bind-white-squeeze` records a **completed** engine pass in lowercase with no
     marker at all (*"An engine pass has been run… the deviation costs are now measured rather
     than declared unmeasurable"*), while **four** entries use ALLCAPS `UNGROUNDED` to mark
     *debt* rather than resolution (`french-advance-chain-white`, `kid-mar-del-plata-white`,
     `nimzo-doubled-c-pawns`, `open-centre-ruy-exchange` — each *"carries its own UNGROUNDED
     provenance… Referencing them does not launder them"*) `[V]`.

   Tally: of the 18 distinct ALLCAPS tokens in the corpus, **at least 10 entries** carry a
   token whose case says "status" and whose meaning is the opposite of, or orthogonal to, its
   apparent direction. That is the measurement that closes this question — not two examples.

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

**[cross-review] Every digest claim in this section reproduces at HEAD, independently
re-derived.** `digestDrillPack` is a one-line delegation to `digestCanonicalJson` over the
**whole parsed document** (`packages/schema/src/drill-pack/digest.ts:69`), with no field
exclusion anywhere in `canonicalize` `[V]`. Recomputing RFC 8785 canonical SHA-256 over all 47
packs and comparing to their ledgers: **32 ledgers exist, 32 of 32 carry `packDigest`, 27
fresh, 5 stale — `mate-bishop-knight`, `mate-k-q-technique`, `mate-k-r-technique`,
`philidor-passive-rook-convert`, `trajectory-mate-bishop-knight`** `[V]`. Same count, same
names. The remaining 15 packs have no ledger at all (§5).

**The migration commit must re-stamp `packDigest` on all 32 ledgers.** Acceptance criterion 6
pins the outcome: 32 of 32 fresh after the migration, which also incidentally clears the 5
pre-existing stale warnings. Note this is *not* a rebase of the pack `$id`, which is free
(the register's own rule: *"pack digests are content digests and are unaffected by the
`$id`"*). It is the field change that moves them.

**[cross-review] Criterion 6 is only true if this RFC lands last, and nothing says so.**
`rfc/claim-backing.md` round 2 also moves digests: its §3.10 and §5.1 price *"the 35-pack,
29-ledger digest movement"* and explicitly withdraw the draft's *"no committed pack byte
changes, no content digest moves"* (`rfc/claim-backing.md` §3.10/§5.1; `rfc/README.md` register row **0.26**)
`[V]`. The two packs sets overlap — this RFC moves all 47, that one moves 35 of the same
files — so **whichever lands second re-stales up to 29 of the 32 ledgers the first one just
freshened**, and each RFC's own acceptance criterion asserts a state the other one breaks. This
is not a lane collision (§8.1 handles that) and not a merge conflict; it is a *criterion*
collision, and it is the kind that passes review twice and fails in the tree. **Ruling: the
digest re-stamp is a landing-order obligation, not a one-time act — whichever of the two lands
second re-stamps every ledger its own change moved, and criterion 6 is restated as `0`
`EVIDENCE_DIGEST_STALE` **at the end of the landing commit**, not as a permanent property.**

**[author round] The race is real and the restatement holds — both halves re-verified.** The
digest arithmetic reproduces independently at HEAD: recomputing `digestDrillPack` over all 47
packs against their ledgers gives **32 ledgers, 32 of 32 carrying `packDigest`, 27 fresh, 5
stale** — `mate-bishop-knight`, `mate-k-q-technique`, `mate-k-r-technique`,
`philidor-passive-rook-convert`, `trajectory-mate-bishop-knight` `[V]`. And `claim-backing`'s
side is quoted correctly: its §3.10 prices *"the 35-pack, 29-ledger digest movement"* and states
**"Of the 35 packs, 29 have a ledger and 6 do not"**, explicitly withdrawing its own
*"no committed pack byte changes, no content digest moves"* `[V]`. **End-of-commit is the only
form of criterion 6 that both RFCs can hold simultaneously**, and it costs this RFC nothing:
re-stamping 32 ledgers is already in the migration commit, so the change is to what the
criterion *asserts*, not to what the commit *does*. The obligation it creates — *whichever lands
second re-stamps* — is symmetric and belongs in both RFCs; this one carries its half, and the
other half is a request against a sibling RFC this round may not edit.

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
graduates only if `sourcing-check` also passes at published severity. The draft re-derived this
by hand — *matching machine-checkable claim labels (`corpus_observed`, `tablebase_exact`,
`engine_validated`) against their ledgers' supporting records* — and reported **40 of 47 fail
on 97 unbacked claims; 15 packs carry claims and no ledger; 7 packs are clean**.

**[cross-review] The hand derivation reproduces exactly, and the tool disagrees with it. The
clean set is 4, not 7.** Rather than re-deriving the label-matching by hand a second time, the
shipped checker was **run**: `checkSourcingFile` (`apps/server/src/sourcing/check.ts:407`,
`strict` defaulting to `true`) over each of the 47 packs twice — once as committed, once against
a temp copy with `provenance.reviewStatus` flipped to `"published"` and its sidecars copied
alongside `[V]`. Result:

| Measure | Draft | Measured by running the checker |
|---|---|---|
| Packs failing at published severity | 40 of 47 | **43 of 47** |
| Packs clean at published severity | 7 | **4** — `anti-caro-advance`, `opening-principles-black`, `opening-principles-white`, `opponent-intent-early-queen` |
| Packs already failing **at draft severity, today** | not stated | **15 of 47** |
| `EVIDENCE_TYPE_UNBACKED` errors the tool actually raises | 97 | **66, across 28 packs** |

Three corrections, and the direction matters — every one of them makes the corpus look *less*
ready, which is the direction §4.4's asymmetry says to prefer:

1. **Three of the draft's seven "clean" packs are not clean; they are unmeasured.**
   `conversion-up-a-piece`, `rook-4v3-same-side` and `trajectory-qgd-exchange-minority` have
   **no `.evidence.json` and no `.sources.json` at all**, so `checkSourcingFile` raises
   `EVIDENCE_READ_ERROR` and `MANIFEST_READ_ERROR` — both at the default severity, which
   `issue()` defines as **`"error"`** (`apps/server/src/sourcing/ledger-validation.ts:38`)
   `[V]`. They fail the check **today, at draft severity**, before any escalation. The hand
   derivation scored them clean because a pack with no ledger has no unbacked *label* — the
   absence of evidence read as the absence of a problem.
2. **The same absence hides 31 of the 97.** Reconciled exactly: **66** unbacked labels sit in
   packs that have a ledger and are reported as `EVIDENCE_TYPE_UNBACKED`; **31** sit in the 12
   ledger-less packs that carry machine-checkable labels and are **never reached**, because the
   checker fails on the missing sidecar first. 66 + 31 = 97 `[V]`. The draft's 97 is a correct
   count of *unbacked machine-checkable labels*; it is not what the gate reports, and §5 read
   it as if it were.
3. **15 of 47 packs fail `sourcing-check` right now, unescalated**, and no section of this RFC
   records it. That is a sharper statement of D177 than the one the draft made: it is not only
   that publishing binds harder than blockers — **a third of the corpus does not pass the
   evidence check at its current review status.**

The *shape* of the draft's finding survives all three corrections and gets stronger: the
blocker gate is **not** the binding constraint for most of the corpus, which is a finding the
D162 row did not have. **[cross-review] But 15 packs carry claims and no evidence ledger** is
verified as written — all 15 ledger-less packs carry between 3 and 7 `feedbackClaims` `[V]`;
only **12** of them carry a *machine-checkable* label, which is the subset relevant to
severity escalation.

**[cross-review] And the second gate is not wired to anything.** `make verify` is
`typecheck test schema-check` (`Makefile:20`); `sourcing-check` is a separate target requiring
an explicit `DIR=` or `FILE=` (`Makefile:60–63`) `[V]`. Every caller of
`checkSourcingDirectory` / `checkSourcingFile` in the repo is either an emitter's internal
re-check or a unit test over a temp directory — **no test runs it over `content/drafts/` or
`content/packs/`** `[V]`. So §5's *"a pack graduates only if `sourcing-check` also passes at
published severity"* is a statement about what the tool **would** say, not about any gate that
runs. Worse for graduation specifically: the command is invoked as `DIR=content/drafts`, so
after step (a) moves the file, **the published-severity check stops seeing the pack it was
escalated for**. Open question 3 raises this as *gate-or-check*; it belongs in the body as a
fact, because the sentence above reads as mechanical and is not. Criterion 14 pins the minimum
fix: whatever runs it must take both roots.

**[author round] Every number in §5 was re-measured by running the checker a second time, and
all of them reproduce at HEAD `0241a98`.** The draft's derivation was re-derived once and
believed; the reviewer's was run once; a number that is load-bearing enough to reverse a
section deserves the second run. `checkSourcingFile` over all 47 packs, each as committed and
again against a temp copy with `reviewStatus: "published"` and its sidecars alongside:
**4 clean at published** (`anti-caro-advance`, `opening-principles-black`,
`opening-principles-white`, `opponent-intent-early-queen`), **43 failing**, **15 failing at
draft severity today**, and **66 `EVIDENCE_TYPE_UNBACKED` across 28 packs** `[V]`. The 15 that
fail at draft severity are **exactly** the 15 with no `.evidence.json` and no `.sources.json` —
the two sets are identical, not merely the same size `[V]`. And the 97 reconciles arithmetically
rather than by inspection: 97 machine-checkable labels corpus-wide, **31** of them in the **12**
ledger-less packs that carry one, **66** in packs the checker reaches `[V]`. This matters
because `apps/server/src/sourcing/check.ts` and `pack-validation.ts` both moved between the
reviewer's commit and HEAD; the numbers survived the move, and now that is known rather than
assumed.

#### §5.1 **[author round]** The second gate was never wired — what this RFC does about it, and what it does not

**Ruling: partly this RFC's, and the split is drawn where cost changes, not where convenience
does.** The finding — the ledger row **"`make verify` never runs `sourcing-check`, and after a
pack graduates it would run on the wrong root"**, and it outranks the mechanism — is that §5's
escalation is enforced by a command a human types at `DIR=content/drafts`, the one root a
published pack has just left.
This RFC's own headline is that graduation must not mean exiting the gates; declaring the third
gate someone else's problem while widening the two easy ones would make §6's argument
self-serving. But wiring it whole is not free, and the measurement says so: **15 of 47 drafts
fail `sourcing-check` today, at draft severity**, for debt §0.3(a) explicitly refuses to pay
here. A criterion that reddens `make verify` for content debt this RFC declines to touch is a
criterion that gets waived, and a waived gate is worse than an unwired one because it looks
enforced.

So the check is split into three, by what each part costs today:

| Part | What lands here | Cost at HEAD |
|---|---|---|
| **(i) `content/packs/` — a strict gate, in `make verify`** | a test runs `checkSourcingDirectory` over `content/packs/` at strict severity and fails on any error | **zero** — the directory holds only `.gitkeep`, and open question 1 ships the graduable set empty. It cannot be red until someone graduates a pack that should not have graduated, which is precisely the event it exists to catch |
| **(ii) `content/drafts/` — a ratchet, in `make verify`** | a test asserts **at most 15 of 47** drafts fail `checkSourcingFile` at their committed status, with the failing set printed | **zero, and it goes green today.** Paying debt never reddens it; incurring new debt does. It makes the debt countable, which is this RFC's entire thesis applied to the axis §5 measures |
| **(iii) the flip to strict over `content/drafts/`** | **not this RFC's** | would be red on 15 packs on the day it lands |

**(iii) has a named owner and a mechanical trigger, because *"a later wave"* is not a
destination and §7 says so about other people's RFCs.** The owner is **whichever content wave
first drives the ratchet in (ii) to `0`** — at that moment the ratchet's bound and a strict gate
are the same assertion, and flipping it is a one-line change in the same commit, with no
judgment left to make. The ledger row *"`make verify` never runs `sourcing-check`, and after
graduation it would run on the wrong root"* (D208) stays open until that flip, and the ratchet
number is its progress measure: **15 today, 0 at close.** That is a destination with a number on
it, which is the standard §7 holds other RFCs to.

**Why (i) is non-negotiable rather than deferred to the first graduation.** The first graduation
is exactly the commit that cannot also be trusted to invent its own gate: it is the commit whose
author most wants the pack to pass. `content/packs/` being empty is what makes the gate free
*now* and impossible to introduce cheaply *later* — after the first pack lands, adding a strict
sweep means either the pack passes (in which case the gate cost nothing and should have been
there) or it does not (in which case the gate is under pressure to be weakened on its first
use). **The cheapest moment to build a gate is while the thing it guards does not exist yet**,
and that moment is this RFC.

This answers open question 3: **gate for `content/packs/`, ratchet for `content/drafts/`,
strict flip owned and triggered.** Criterion 14 is restated to all three parts.

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
| **[cross-review] `refusal-coverage.test.ts` is 1 of **16** files that hardcode a real `content/drafts/<pack>.json` path** — the other 15 are `authored-feedback.test.ts:31`, `line-drill.test.ts:14`, `sourcing/verify-draft.test.ts:29,38`, `apps/web/src/lib/session-controller.test.ts:49`, `outcome-grading.test.ts:147`, `validator-integrity.test.ts:19,214,237`, `pack-authoring.test.ts:312,398`, `predicate-wave-3-validation.test.ts:10`, `shape-validation.test.ts:50`, `structural-reading.test.ts:10`, `sourcing/deviation-cost.test.ts:15`, `sourcing/tablebase-walk.test.ts:12`, `packages/runtime/src/adaptive-guidance.test.ts:183`, `packages/runtime/src/shape-firing.test.ts:31`, `expression-census.test.ts:44` | `grep -rl "content/drafts/[a-z0-9-]*\.json"` over `apps/` + `packages/` returns **16 files** `[V]` | **`anti-caro-advance` is the single most graduation-ready pack in the corpus** — the only one of §5's four published-clean packs that also carries engine evidence — and it is hardcoded in **5** of the 16 (`authored-feedback`, `line-drill`, `verify-draft`, `session-controller`, `refusal-coverage`) `[V]`. So the *first real graduation* reddens four files the draft records as unaffected. `rook-4v3-same-side` (`outcome-grading`) and `trajectory-qgd-exchange-minority` (`validator-integrity`) add two more | `resolvePackPath(id)` is the right fix; the row above scoped it to one file. **Repoint every hardcoded pack path in all 16 files**, and prove it by promoting `anti-caro-advance` itself — a real pack, not the temporary fixture criterion 7 allows |
| `packages/runtime/src/practical-difficulty.test.ts` + `fixtures/instrument-fed.fixture-register.json` (**"fixture-realism"**) | regex over **TypeScript source** (`@instrument-fed` JSDoc) plus a recursive `.ts` sweep | **no content involvement at all** | Nothing |
| `apps/server/src/pack-registry.ts` (`PackRegistry.fromDocuments`) | `records.has(document.id) && options.replaceDuplicates !== true` → `throw ServerError("PACK_INVALID", …)`; otherwise **overwrite, last write wins** | production (`replaceDuplicates: false`) **throws on boot** for an intra-`content/packs/` id collision; development (`true`) silently prefers the draft | Move-not-copy removes the divergence; the production throw is correct and stays |
| `tools/verify-scaffold.mjs`; `tools/verify-packaging.mjs`; `.dockerignore` | existence of both directories; `.dockerignore` must include `content/drafts` | unchanged — and `verify-packaging` is what makes (a) load-bearing | Nothing |
| `planning/pack-vocabulary-audit/audit.ts` (`allPackFiles`); `tools/r1r2-primitives-harness/corpus.ts` (`DRAFTS`) | drafts-only | disposable/planning instruments; a graduated pack drops out of them | Note in the planning dir; no change |
| `.github/workflows/` | **zero** references to either directory | nothing | Nothing |

**The one-line summary of §6:** the production-catalogue switch breaks `make verify`
immediately (via `expression-census.test.ts`), and its subtler cost is that graduation as
currently wired means **exiting** the schema-conformance and evidence sweeps. Both are fixed
here, and the second is the more important one — a gate you graduate *out of* is not a gate.

**[cross-review] Three amendments to that summary.**

1. **The draft's central finding survives its own attack, and this is worth saying plainly**
   because it is the finding that outranks the mechanism. Verified at HEAD:
   `opening-evidence.test.ts:17,31,35` resolves and walks `content/drafts` only, and
   `packages/schema/src/drill-pack.test.ts:210–212` reads `content/drafts` + `content/candidates`
   and never `content/packs` `[V]`. A promoted pack does leave both. **And the RFC does fix
   it** — the §6 row rules the widening *non-negotiable* and criterion 7 requires it. Ruling
   graduation a **move** fixes the duplicate-id family (census double-counting, `pack-check`
   last-file-wins, registry divergence); it is criterion 7, not the move rule, that closes the
   validation gap. The two are independent and the draft's table keeps them apart correctly.
2. **The sweep that is *not* widened is the sourcing one**, because it is not a sweep — nothing
   runs `checkSourcingDirectory` over either root (§5). Widening the two `readdir` sweeps
   leaves the published-severity check running on `DIR=content/drafts` and therefore on
   everything **except** the packs that were escalated to published severity. That is the one
   place where the maturity gate still points backwards after this RFC, and criterion 14 is the
   floor. **[author round] It is no longer the floor: §5.1 turns it into a ceiling for
   `content/packs/` (a strict gate inside `make verify`, free because the directory is empty)
   and a ratchet for `content/drafts/` (≤15 of 47, green today), with the strict flip owned by
   the wave that drives the ratchet to 0.** After this RFC the maturity gate points *forward*
   for the root that matters and is *counted* for the root that does not yet.
3. **`make verify` has two hard breakages, not one.** `drill-pack.test.ts` reddens on the
   schema tightening because of `content/candidates/` (§3.1a), independently of whether any
   pack ever moves.

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
| Format / encoding gaps | 5 | `rfc/archive/format-surface.md` in part |
| Human-play / practical difficulty (Maia) | 4 | No instrument; `design/04` §7's standing gap |
| Permanent properties | 2 (**[cross-review]** only **1** states permanence explicitly — §1.2 correction 1; the second is unnamed here and Stage B must either name it or leave it `blocking`) | → `accepted` at migration |
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
| + everything except the Maia / human-play class | **43 of 47** | **4** ~~7~~ **[cross-review]** |

**[cross-review] The right-hand column is corrected from §5's measurement, and the left-hand
column's inputs check out.** The `27` (packs whose ledger holds no `engine_eval` record) is
independently reproduced at HEAD `[V]`, and the class table above sums to exactly 155
(42+20+22+14+7+5+5+4+2+34) `[V]`, which reconciles with 240 = 37 + 48 + 155. The right-hand
column's `7` does not survive running the checker: it is **4** (§5), because
`conversion-up-a-piece`, `rook-4v3-same-side` and `trajectory-qgd-exchange-minority` have no
evidence sidecars at all and fail at draft severity today. The `1 (anti-caro-advance)` row is
unaffected. The left-hand column is this RFC's own hand audit and is left as the draft states
it, labelled as such — but note that the two columns are now measured to different standards,
which is exactly why the draft's own caveat below matters more than it did.

**[author round] The right-hand column's `4` is confirmed by a second independent run of the
shipped checker at HEAD, and the asymmetry between the columns is now stated as a rule.** The
left column is a hand audit of prose; the right column is a tool's output. **Where the two
disagree, the tool wins and the hand audit is relabelled, never the reverse** — that is what the
draft got backwards when it derived §5 by hand and reported the derivation as the gate. The
three packs the correction removes (`conversion-up-a-piece`, `rook-4v3-same-side`,
`trajectory-qgd-exchange-minority`) are all in the 15 that carry no sidecars at all `[V]`, so
they were never clean in any sense — they were unmeasured, and unmeasured scored as clean.

**[cross-review] The `perfect_tablebase` row of the class table above reads `5`.** Per §1.1 it
is 3 substitution entries + 2 provider-availability entries, which are cleared by different
things — the row's *"Tablebase opponent selection; unowned"* is correct for the 3 only.

**Three things this table says that must not be softened.**

1. **No in-flight RFC graduates a single pack on its own.** — verified: the string
   `graduation` appears **0 times** in `rfc/claim-backing.md` at HEAD `[V]`, and the same holds
   for `engine-leverage` and `vocabulary-wiring`. They supply *mechanisms*; **content waves
   clear blockers.** The RFC's payoff is that the count becomes knowable and the waves become
   countable. **[cross-review] The clause *"`claim-backing` claims no pack version, touches no
   `$defs`"* is stale and is struck**: round 2 (`aebe1a5`) re-claimed pack **0.26** and adds
   `$defs/feedbackClaim.principles` plus that `$def`'s `additionalProperties: false`
   (`rfc/README.md` pack-version register, row **0.26**) `[V]`. The *conclusion* is unchanged — a schema claim is still not a
   graduation — but the evidence offered for it no longer holds, and §4.5 now prices the digest
   consequence the reclaim carries.
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

**[cross-review] The request has already been granted, and its wording needs two amendments.**
`rfc/README.md`'s pack-version register carries a **0.27** row naming `pack-graduation.md`, and
the row below it records **0.28** as the next free pack lane `[V]` — so §8.1's *"requests a row"* is stale and the lane
is secured. The register row's *"invalidates all 47 committed packs"* is however **83** per
§3.1a (47 drafts + 36 candidates), and its digest clause should say *"re-stamp every ledger the
change moves, ordered against `claim-backing`'s 35-pack / 29-ledger wave"* per §4.5. Those are
two edits to a single-writer file this RFC may not make; they are recorded here as the request.
The lane-collision reasoning itself is verified sound: `DRILL_PACK_SCHEMA_VERSION` reads
`"0.23"` (`packages/schema/src/index.ts:2`) and the schema `$id` is
`urn:chess-tabiya:schema:drill-pack:0.23` `[V]`, 0.24/0.25 are held by `vocabulary-wiring` and
`format-surface`, and `claim-backing` **did** re-take 0.26 — so the draft's stated reason for
skipping 0.26 (*"taking 0.26 would put this RFC in a rebase race"*) was not caution, it was
correct, and the race it predicted has since happened.

**[author round] The 0.27 claim stands, its register row exists, and two lane facts moved
again.** Re-checked at HEAD `0241a98`: `rfc/README.md`'s pack-version register carries the
**0.27** row naming `pack-graduation.md` and records **0.28** as the next free lane `[V]`;
`DRILL_PACK_SCHEMA_VERSION` reads **`"0.23"`** and the schema `$id` is
`urn:chess-tabiya:schema:drill-pack:0.23` `[V]` — `engine-leverage` landed its 0.23 in
`18d2832`, so 0.23 is now *consumed* rather than *implementing*, which is one lane further along
than §8.1's prose says. **And 0.24 is being written into the working tree as this round is
authored** — an uncommitted `vocabulary-wiring` implementation has
`DRILL_PACK_SCHEMA_VERSION = "0.24"` and `$id … :0.24` on disk at HEAD+dirty `[V]`. Neither
touches 0.27. The register's *"invalidates all 47 committed packs"* wording is still **83** per
§3.1a and its digest clause still needs §4.5's ordering language; both remain requests against a
single-writer file this RFC may not edit.

**[author round] The register rule that changed under this RFC does not touch it, confirmed
rather than assumed.** `rfc/README.md` instituted **"MIGRATION NUMBERS ARE ASSIGNED AT LANDING,
NOT AT CLAIM"** on 2026-08-16, on the measured hazard that `storage.ts` migrates with
`if (migration.version <= version) continue`, so a claimed-but-unlanded number is a hole the
next landing seals shut `[V]`. The rule is scoped to **storage migration numbers**; pack-schema
lanes are still claimed by number, which is why the 0.27 row exists at all. §8.2 rules this RFC
takes **no migration, no table, no column and no `STORAGE_VERSION` bump**, so it holds no
migration claim that could become a hole — it is not in the rule's population. Recorded here
because *"the rule does not apply to us"* is a sentence worth having a citation behind.

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
   `additionalProperties: false`; `$defs/graduationEntry` exists with the closed `state` enum,
   the `oneOf` state/companion binding, and **[cross-review]** `accepted.rulingRef` required
   alongside `accepted.ruling`. All 47 authored packs, the 6 `*.browser.json` fixtures,
   **all 36 `content/candidates/*/pack.json` documents (§3.1a)**,
   `schemas/drill_pack.example.json` and every file under `schemas/fixtures/drill-pack/`
   validate — **in the same commit as criterion 3**. The proof is
   `packages/schema/src/drill-pack.test.ts`'s *"validates every committed pack document under
   the closed policy"* going green unmodified, since it already enumerates exactly this
   population.
2. **Gate.** `PackStudio.register` refuses on ≥1 `blocking` entry and **accepts** a pack whose
   entries are all `resolved`/`accepted`, with a positive test proving the second half (there
   is none today because the state was unreachable). `GRADUATION_BLOCKING_ON_PUBLISHED` fires
   at error on a `published` document with a `blocking` entry, at an exact JSON pointer.
3. **Migration completeness.** **[cross-review]** All **383** entries across **83** pack
   documents are typed — 240 in `content/drafts/` and 143 in `content/candidates/` (§3.1a);
   `make graduation-report` prints `0` legacy-shape entries **per root**, so a root the report
   does not walk cannot contribute a silent zero. **[author round] The report prints no merged
   corpus-wide `blocking` total at all** (§0.3, §3.3) — a single ~340 that adds 143 emitter
   placeholders to 197 authored debts has no honest reading, and a number with no honest reading
   is a number someone will quote.
4. **Stage A is bounded.** The migration script asserts that every entry matching the
   no-review-workflow substring is byte-identical to one of the **seven** attested variants,
   and **fails** otherwise. 37 of 37 must match. Each of the seven variants' trailing clauses
   is separately checked against the pack's other entries, and any clause stating a condition
   not otherwise recorded is split out as a `blocking` entry rather than absorbed into the
   `accepted` one.
5. **Stage B split count is reported, not asserted.** The migration commit's message records
   the realised `blocking` / `resolved` / `accepted` totals and the number of compound splits;
   §4.2's ~197 / ~48 / ~~~39~~ **~38** (**[author round]** — the criterion still carried the
   pre-correction `accepted` total that §1.2 correction 1 and §4.2 both fixed) is a prediction
   and the shipped numbers are binding over it. **The totals are reported per root**, since
   `content/candidates/`'s 143 are `blocking` by construction and adding them to the drafts
   figure produces the merged number criterion 3 forbids printing.
6. **Digests.** At the **end of the landing commit** (**[cross-review]** §4.5 — not as a
   permanent property, because `claim-backing`'s 35-pack / 29-ledger wave moves an overlapping
   set), `make sourcing-check DIR=content/drafts` reports **0** `EVIDENCE_DIGEST_STALE` — 32 of
   32 ledgers re-stamped, which also clears the 5 already stale at `1b89123` and at HEAD.
   Whichever of the two RFCs lands second re-stamps every ledger its own change moved.
7. **Corpus sweeps widened.** `opening-evidence.test.ts` and
   `packages/schema/src/drill-pack.test.ts` walk both roots; `expression-census.test.ts`
   counts both roots; `runExpressionCensus` refuses on a duplicate pack id across roots with a
   negative test. `make verify` is green **with a pack present in `content/packs/`** — proved
   by promoting one pack under a temporary fixture, not by argument.
8. **Move-not-copy is provable.** A test asserts no pack id resolves to a file in both
   `content/drafts/` and `content/packs/`.
9. **Root-agnostic pack paths.** **[cross-review]** Every hardcoded `content/drafts/<pack>.json`
    path in all **16** files that carry one (§6) routes through `resolvePackPath(id)`; each
    test passes with its packs in either root. Proved by temporarily promoting
    **`anti-caro-advance`** — the corpus's most graduation-ready pack, hardcoded in 5 of the
    16 — not by a synthetic fixture.
10. **The report is real.** `make graduation-report` runs from a clean checkout and its
    graduable-set line agrees with an independent re-derivation.
11. **Nothing else moved.** `DRILL_RUN_SCHEMA_VERSION` and `STORAGE_VERSION` are byte-
    identical to `1b89123`; no `$defs` outside `provenance` and the new
    `graduationEntry` changed.
12. **[cross-review] The emitters emit the typed shape** (§1.6). `distill.ts`,
    `sourcing/openings.ts`, `sourcing/position-seeds.ts` and `sourcing/syzygy.ts` write
    `graduationEntry` objects with stable `id`s; `distill.test.ts`'s
    `validatePackDocument(...).issues` `toEqual([])` and `syzygy.test.ts`'s bare-string
    `toContain` are moved to the typed shape and both pass. A negative test asserts a freshly
    emitted document validates against the closed schema.
13. **[cross-review] `accepted` costs a citation, not a sentence** (§1.2 correction 2).
    `GRADUATION_RULING_UNCITED` fires at error on an `accepted` entry whose `rulingRef` is
    absent or unresolvable, and — for `kind: "owner_ruling"` — on one whose target file does not
    contain the quoted ruling's date. All 37 Stage-A entries and the single
    `permanent_property` carry a resolving `rulingRef`. `content/accepted-conditions.md` is
    committed and a test asserts it is byte-identical to a fresh `make graduation-report` run.
14. **[author round, superseding the cross-review's floor] The published-severity check is
    wired, in three parts** (§5.1). (a) A test inside `make verify` runs
    `checkSourcingDirectory` over **`content/packs/`** at strict severity and fails on any
    error — green today because the directory is empty, and red the first time a pack is
    graduated that should not have been. (b) A test inside `make verify` asserts **at most 15 of
    47** `content/drafts/` packs fail `checkSourcingFile` at their committed status, printing the
    failing set — a ratchet, green today, that paying debt can only improve. (c) The flip of (b)
    to strict is **not** in this RFC; it is owned by the content wave that drives the ratchet to
    `0` and lands in that wave's commit. The ledger row *"`make verify` never runs
    `sourcing-check`, and after graduation it would run on the wrong root"* stays open until (c).
    **No invocation of either checker over the corpus may name only one root.**

## Open questions

1. **Does the first graduation happen in this RFC, or the next?** §7 measures that **0 of 47**
   packs graduate on the migration alone, so this RFC ships a working gate and an empty
   graduable set. That is honest but it means `content/packs/` stays empty and criterion 7's
   green `make verify` is proved against a temporary fixture. **Recommended: yes, ship it
   empty** — the alternative is curating a subset, which the owner refused. *Owner call; a
   law-5 question about whether an unmet gate may land.*
2. **Do the `perfect_tablebase`-substitute mates packs get `accepted` after all?**
   **[cross-review] The draft asked this about *four* packs while §1.1 and §7 said *five*; the
   measured answer is that there are two different populations** (§1.1): **3** substitution
   entries (`mate-k-q-technique`, `mate-k-r-technique`, `mate-two-bishops`) and **2**
   provider-availability entries (`mate-bishop-knight`, `trajectory-mate-bishop-knight`), which
   are not the same question. §1.1 refuses the fourth state and keeps the **3** `blocking`. The
   counter-argument is that a mates pack drilled against `human_common` at 1200 is a
   *deliberate v1 product decision*, i.e. genuinely `out_of_scope`, not a debt. **Recommended:
   keep the 3 `blocking`** — the substitution changes what the drill teaches, and §4.4's
   asymmetry says to err this way. **The 2 provider-availability entries are a separate ruling**
   and read as `permanent_property` (a deployment either configures a tablebase provider or it
   does not; no work in this repo changes that). *Owner call on both, because it is the exact
   judgment the ruling in §1.2 would license — and note §1.2 correction 1 found the corpus has
   only **one** attested `permanent_property` and **zero** attested `out_of_scope`, so
   whichever way this goes it sets the precedent for a kind that has none.*
3. ~~**Does `sourcing-check` at published severity become a *gate* or stay a *check*?**~~
   **[author round] ANSWERED in §5.1, and the answer is both, split by root.** It becomes a
   **strict gate** over `content/packs/` inside `make verify` — free today because the directory
   is empty, and impossible to add cheaply once it is not. It becomes a **ratchet** over
   `content/drafts/` — at most 15 of 47 failing, green today, tightening as debt is paid. The
   flip of the ratchet to strict is **not** deferred to *"whichever RFC ships the first
   graduation"*, which was a non-answer; it is owned by the content wave that drives the ratchet
   to `0`, and the ratchet number is that wave's progress measure. Not an owner call —
   the reason this was ever a question was that the draft priced the check as a fact instead of
   as a gate, and §5.1 prices it.
4. **Should `graduationBlockers` be renamed?** §1.4 says no, on cost. Recorded as deferred to
   any future RFC that already has reason to touch every emitter.
5. **Who audits Stage B?** The migration reads 203 entries and the auditor's judgment is the
   only thing between a real debt and an `accepted`. Recommended: one agent audits, a second
   independently re-audits the ~42 splits and the full `accepted` page, and the two are
   diffed. Not asserted as a criterion because a second pass cannot be tested for.
   **[cross-review]** §1.2 correction 2 lowers the stakes here without removing them: with
   `rulingRef` required and the `accepted` page committed, a Stage B slip into `accepted` now
   costs a resolving citation **and** shows up as a diff line, so the un-testable second pass
   guards a narrower gap than the draft's version did.
6. **[cross-review] Does `content/candidates/` graduate, ever?** §3.1a folds its 36 packs into
   the schema and the migration because a shipped test already validates them, but the RFC has
   no position on whether a candidate is a graduation *subject* or merely a document that must
   stay schema-valid. All 143 of its entries are emitter placeholders that no wave is scheduled
   to clear, so leaving them `blocking` forever is harmless — until someone reads a corpus-wide
   `blocking` total of ~340 as a content measurement. ~~**Recommended: `graduation-report`
   segregates candidates from packs in every total (criterion 3), and the question of whether a
   candidate can graduate is deferred to whichever RFC owns the candidate→draft promotion path.**~~
   **[author round] RULED in §0.3, not deferred. No: a candidate is not a graduation subject.**
   The gate (§2) and the three-step definition (§5) apply to `content/drafts/` → `content/packs/`
   and to nothing else; a candidate's `blocking` entries are input to the candidate→draft
   promotion path, which this RFC does not own and now names as out of scope (§0.3(f)). The
   segregation is strengthened past the reviewer's recommendation: **the report prints no merged
   total at all**, rather than printing one beside the per-root breakdown — segregating a number
   that still gets printed only slows down its misreading. The considered alternative was
   excluding candidates from the closed-schema policy entirely, and it is declined in §0.3 on
   this RFC's own argument: buying a cheap schema change by narrowing a sweep is the failure
   shape §6 is named after. *Not an owner call — this is a scope ruling with a measured cost on
   both sides, and it is the author's to make.*

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
- **D177** 🐞 *~~40~~ **43** of 47 packs fail `sourcing-check` at published severity; 15 packs
  have claims and no ledger at all; ~~7~~ **4** are clean.* **[cross-review]** Corrected by
  running the checker rather than re-deriving it: the three packs dropped from the clean set
  fail **at draft severity today**, and 15 of 47 do. The blocker gate is **not** the binding
  constraint for most of the corpus — publishing is, and D162's row did not have this number.
  See **D206**, **D207**, **D208**.
- **D178** 💡 *`accepted` needs a printed page, not a lint.* No validator can distinguish a
  real permanent condition from a shrug. `make graduation-report`'s corpus-wide `accepted`
  page (**~38** entries — **[cross-review]** 37 owner-ruling + **1** permanent-property, not 2)
  is the guard, and it works only while it stays short enough to read. **Insufficient on its
  own** — see **D205**: the page must be committed so a new acceptance is a diff, and
  `accepted.rulingRef` must resolve.
- **D179** 🐞 *Setting `reviewStatus: "published"` moves the pack digest and staleness-warns
  its ledger.* `provenance` is inside `digestCanonicalJson`. 27 of 32 ledgers are fresh at
  `1b89123`, 5 already stale. Every future publish is a two-file commit, and nothing says so
  today.
- **D180** 💡 *`$defs/provenance` has exactly five keys corpus-wide and can be closed.*
  `reviewStatus` (64), `sources` (55), `graduationBlockers` (53), `reviewers` (41), `licence`
  (30). Closes the row `defect-batch-2` §6 proposed to the owner and never landed.
  **[cross-review]** Reproduced at HEAD, and it survives a widening: the only sixth key
  anywhere (`attribution`, 25 files) is in `content/shapes/*.json`, which validate against
  `shape_entry.schema.json`'s own already-closed `$defs/provenance`. The 36
  `content/candidates/*/pack.json` documents also carry exactly these five (**D203**). Note
  `defect-batch-2` §6's *other* half is closed by `claim-backing` 0.26, not left open.
- **D181** 💡 *No in-flight RFC clears a graduation blocker.* `claim-backing`,
  `engine-leverage` and `vocabulary-wiring` supply mechanisms; content waves clear blockers.
  The standing confusion this row exists to stop: **an RFC that makes a debt payable is not an
  RFC that pays it**, and the ledger has repeatedly credited the first as the second.
- **D182** 🐞 *`refusal-coverage.test.ts` hardcodes four `content/drafts/…` paths, two of them
  packs that are clean at published severity.* Pack paths across the repo assume a pack never
  moves. The general form: **the drafts/packs split is a runtime concept that ~20 test files
  hardcode as a path constant.** **[cross-review]** Measured exactly: **16 files** hardcode at
  least one real `content/drafts/<pack>.json` path, and **5 of them name `anti-caro-advance`**,
  the corpus's most graduation-ready pack.

### Ledger rows — cross-review block **D203–D212**

Opened by the adversarial cross-review of this RFC, 2026-08-16. Each is named at the point in
the body where the measurement that found it sits. No id outside this block was minted.

- **D203** 🐞 *`content/candidates/`'s 36 pack documents are inside the closed schema policy and
  outside every graduation instrument.* `packages/schema/src/drill-pack.test.ts` validates them
  against `drill_pack.schema.json`, and they carry **143 bare-string `graduationBlockers`
  entries in 7 distinct texts**. Any schema tightening of that field reddens `make verify` from
  a directory no graduation section, report or criterion mentions. The general form: **a
  "corpus-wide" count is only as wide as the `readdir` that produced it, and this repo has four
  different ones.** (§3.1a)
- **D204** 🐞 *Four emitters still write `string[]` into a field this RFC types.* `distill.ts:82`,
  `sourcing/openings.ts:116`, `sourcing/position-seeds.ts:249`, `sourcing/syzygy.ts:187`, with
  `validatePackDocument` compiling the JSON schema through Ajv — so the migration types the
  corpus and leaves the producers emitting documents the schema now refuses.
  `distill.test.ts:11` and `syzygy.test.ts:143` assert the legacy shape today. **A format change
  that migrates content without migrating its emitters lands green and breaks on the next
  emission.** (§1.6)
- **D205** 🐞 *`accepted` is reachable by assertion: `kind` has no per-kind required field and
  `ruling` is checked against nothing.* All three kinds collapse to one non-blank string, and
  the sole guard — a printed page — has no criterion requiring anyone to read it. The repo can
  afford better: **21 dated owner rulings are greppable in `design/` and the 2026-08-13 ruling
  is recorded in five living-tier files.** The fix is law 3 applied to a field that exempted
  itself: `rulingRef` must resolve. (§1.2)
- **D206** 🐞 *Three of the seven packs recorded as clean at published severity fail
  `sourcing-check` today, at draft severity.* `conversion-up-a-piece`, `rook-4v3-same-side`,
  `trajectory-qgd-exchange-minority` have no `.evidence.json` and no `.sources.json`, so the
  checker raises `EVIDENCE_READ_ERROR` + `MANIFEST_READ_ERROR` at error before any escalation.
  Measured by **running** the checker over all 47 packs at both statuses: **4 clean, 43 fail,
  and 15 of 47 fail at draft severity now.** The general rule this cost: **the absence of
  evidence scores as clean in any derivation that counts unbacked labels rather than running
  the check.** (§5)
- **D207** 🐞 *97 unbacked claims is 66 reported + 31 masked.* The 31 sit in the 12 ledger-less
  packs the checker never reaches, because it fails on the missing sidecar first. The number is
  right and it is not what the gate says. (§5)
- **D208** 🐞 *`make verify` never runs `sourcing-check`, and after graduation it would run on
  the wrong root.* `verify` is `typecheck test schema-check`; every caller of
  `checkSourcingDirectory` is an emitter's internal re-check or a unit test over a temp
  directory. The published-severity escalation this RFC makes load-bearing is enforced by a
  command someone has to remember to type, aimed at `DIR=content/drafts` — **the one directory
  a published pack has just left.** (§5, §6)
- **D209** 🐞 *Two in-flight RFCs each assert a digest-freshness criterion the other breaks.*
  `pack-graduation` moves 47 pack digests and re-stamps 32 ledgers; `claim-backing` round 2
  moves 35 and re-stamps 29, over an overlapping set. Neither names the other. **A criterion
  that asserts a repo-wide state rather than an end-of-commit state is a criterion two RFCs can
  both pass and jointly violate.** (§4.5)
- **D210** 🐞 *At least 10 blocker entries carry an ALLCAPS token whose case says "status" and
  whose meaning inverts it — and the inversion runs both ways.* `CORPUS-CHECKED … NOT
  ANSWERABLE` in three packs (not one); two `ENGINE-CHECKED … REFUTED` entries; an
  `ENGINE-CHECKED` entry in `anti-caro-advance` that **opens** a new defect in the corpus's most
  graduation-ready pack; four entries using ALLCAPS `UNGROUNDED` to mark debt; and one completed
  engine pass recorded in lowercase with no marker at all. (§4.3)
- **D211** 🐞 *Sixteen files hardcode a real `content/drafts/<pack>.json` path, five of them
  `anti-caro-advance`.* The first genuine graduation reddens four test files this RFC's §6 audit
  records as unaffected. The fix (`resolvePackPath(id)`) was right and scoped to one file. (§6)
- **D212** 🐞 *This RFC's scripted counts all reproduce and three of its pack-name citations do
  not.* `STILL UNTESTED` is in `anti-italian-center-attack-black`, not `kid-mar-del-plata-white`;
  the *"deliberately is not smuggled in here"* boundary is in `pawn-breakthrough-convert`, not
  a `rook-4v3-same-side` sibling; and the corpus has one `permanent_property` entry, not two.
  The general form: **a number derived by script and a name recalled from reading are not the
  same evidence class, and `[V]` on both hides which is which.** (§1.2, §4.3)

### Ledger rows — author return-round block **D237–D246**

Opened by the author's return round on the cross-review, 2026-08-16. Each is named at the point
in the body where the measurement or the ruling that found it sits. No id outside this block was
minted.

- **D237** 💡 *The cheapest moment to build a gate is while the thing it guards does not exist.*
  `content/packs/` holds only `.gitkeep`, so a strict `sourcing-check` sweep over it costs zero
  today and can never be red without someone having graduated a pack that should not have. After
  the first pack lands, the same gate is either redundant or under pressure to be weakened on its
  first use, by the author who most wants that pack to pass. The general form: **a gate added
  before its first subject is free and uncontested; the same gate added after is a negotiation.**
  (§5.1)
- **D238** 💡 *A ratchet is the honest form of a gate you cannot afford to close.* 15 of 47 drafts
  fail `sourcing-check` today at draft severity, and `pack-graduation` refuses to pay content
  debt — so it asserts **≤15**, prints the failing set, and names the wave that drives it to 0 as
  the owner of the strict flip. **A criterion that reddens the build for debt the RFC declines to
  pay is a criterion that gets waived, and a waived gate reads as enforced.** The number is the
  destination that *"a later wave"* was standing in for. (§5.1, criterion 14)
- **D239** 🐞 *Three of the four `graduationBlockers` emitters validate their own output and
  throw.* `openings.ts:120`, `position-seeds.ts:252` and `syzygy.ts:190` each call
  `validatePackDocument` on the document they just built and raise
  `SourcingError("EMITTED_PACK_INVALID")` when it fails, and schema violations are error-severity
  — so typing the array without retyping the emitters does not produce invalid documents, it
  **stops three emitters from emitting at all**. Sharpens the row *"Four emitters write
  `string[]` into a field an in-flight RFC types"* (**D204**): the two red tests were the
  visible half of the break. (§1.6)
- **D240** 🐞 *A blocker `id` derived from the emitted statement is not stable, because two
  emitter blockers are templated.* `syzygy.ts` interpolates `options.opponent` into two of its
  three blocker texts, so the same blocker renders differently per caller. Ids must key on the
  **template**, in a checked-in registry both the emitter and the migration read. The general
  form: **an identity derived from rendered output is an identity that moves when the caller
  changes.** (§1.6, §4.0)
- **D241** 🐞 *`rulingRef`'s worked example does not resolve, and a citation lint that fails open
  on anchors is decoration.* `planning/exploration/log.md#2026-08-13-owner-rulings` is not the
  slug of that heading. The fix is a narrower grammar — `path` or `path#L<line>`, nothing else —
  and the observation that makes it safe: **law 7 makes `planning/exploration/log.md`
  append-only, so it is the one living-tier file whose line numbers are a stable citation
  target.** `#L<line>` is permitted only into append-only files. (§1.2)
- **D242** 💡 *The ruling citation `accepted` now costs is payable once for all 37 entries.* The
  37 no-review-workflow entries quote one ruling in seven wordings, so they take one `rulingRef`
  — `planning/exploration/log.md#L1231` — and `GRADUATION_RULING_UNCITED` checks path existence
  plus date containment, both of which hold. **A citation requirement is only a real guard when
  the honest case can pay it cheaply and the dishonest case cannot pay it at all**; verified
  before the requirement was ratified, because a lint that blocks its own migration is worse than
  no lint. (§1.2)
- **D243** 🐞 *A merged corpus-wide `blocking` total has no honest reading, so the report must not
  print one.* ~340 across three roots adds 143 emitter placeholders no wave is scheduled to clear
  to ~197 authored debts. Segregating a number that still gets printed only slows its misreading
  down. Strengthens the reporting fix in the row *"`content/candidates/`'s 36 pack documents are
  inside the closed schema policy and outside every graduation instrument"* (**D203**) from
  *"per root as well"* to *"per root only"*.
  (§0.3, §3.3, criterion 3)
- **D244** 💡 *`content/candidates/` is inside the schema and outside graduation, and those are
  two different questions that a single `readdir` conflated.* The candidates migrate because a
  shipped test validates them; they are **not** graduation subjects, because the gate is a
  drafts→packs move. The alternative — excluding them from the closed-schema policy — was
  declined on the RFC's own argument: **buying a cheap schema change by narrowing a sweep is the
  failure shape the RFC is named after.** (§0.3, open question 6)
- **D245** 🐞 *A loose mechanical proxy that moves by two on a word-boundary choice was quoted as
  a bound.* §4.3's residual-clause proxy returns **45** of 48 at HEAD with the nine tokens as
  written, and **47** only with a looser tokenization; the reviewer published 47 as a
  reproducible floor under a hand-counted 42. Both are true and neither is the answer. The
  general form: **a proxy built to be loose cannot also be cited to the unit — quoting its exact
  value repeats the error it was built to expose.** (§4.3)
- **D246** 🐞 *Two live cross-RFC numbers moved under this RFC while it was being reviewed, in
  opposite directions.* `engine-leverage` **landed** 0.23 (`18d2832`), so the register's
  *"implementing"* is stale; and an uncommitted `vocabulary-wiring` implementation carries
  `DRILL_PACK_SCHEMA_VERSION = "0.24"` on disk at HEAD. Neither touches 0.27, and the
  migration-numbers-at-landing rule (`rfc/README.md`, 2026-08-16) is scoped to storage numbers,
  which this RFC does not claim. The general form: **an RFC round that measures a moving tree
  must pin its commit and re-check the lanes, because two of the four cross-RFC facts checked
  here were true when written and false when read.** (§8.1)

## Changelog

- 2026-08-16: created. All figures re-derived at `1b89123`; the corpus population is the 47
  authored packs in `content/drafts/`, excluding the six `*.browser.json` fixtures.
- 2026-08-16: **adversarial cross-review, all figures re-derived at HEAD `a7e700d` and
  re-verified at `9df06c6`** (not `1b89123` — `expression-census.{ts,test.ts}`, `rfc/README.md`
  and `rfc/claim-backing.md` all moved in between; `content/`, `schemas/`, `packages/schema/`,
  `apps/server/src/sourcing/`, `pack-validation.ts`, `pack-studio.ts`, `pack-registry.ts` and
  the `Makefile` did **not** move across either step, so every measurement below stands at both
  commits `[V]`). **Reproduced unchanged:** 47 packs / 240 entries / 177 distinct / min 2 max
  7 / 0 empty; 37 ruling entries in 37 packs across exactly 7 wording variants (25/4/4/1/1/1/1);
  48 resolution-marked entries across 19 packs; the five-key `provenance` census (64/55/53/41/30)
  with no sixth; 32 ledgers all carrying `packDigest`, 27 fresh and the same 5 stale; 27 packs
  with no `engine_eval` record; the §7 class table summing to 155; 97 unbacked machine-checkable
  labels; and every `§0.1`/`§6` code citation. **Corrected in the body, each marked
  `[cross-review]`:** the migration population (240/47 → 383/83, §3.1a, §4.0); the four
  un-retyped emitters (§1.6); `accepted`-by-assertion and the `rulingRef` requirement (§1.2);
  the published-severity clean set (7 → 4) and the 15 packs failing at draft severity today
  (§5); `sourcing-check` not being wired to `make verify` and pointing at the vacated root
  (§5, §6); the 16 files hardcoding pack paths (§6); the `perfect_tablebase` 3+2 split and the
  five-versus-four self-contradiction (§1.1, open question 2); the digest race with
  `claim-backing` (§4.5); the stale `$defs/feedbackClaim` and *"claims no pack version"*
  sentences (§3.1, §7); the already-granted 0.27 register row (§8.1); six more prefix inversions
  and one misattributed one (§4.3); and three misattributed pack names (§1.2, §4.3). New ledger
  block **D203–D212**.
- 2026-08-16: **author return round, all returned figures re-measured at HEAD `0241a98`** (the
  tree moved twice during the round — `7650d41` → `0241a98` — and carried an uncommitted
  `vocabulary-wiring` implementation throughout; `content/`, `schemas/`, `packages/schema/
  drill-pack.test.ts`'s closed-policy list, the four emitters, `pack-studio.ts`, `pack-registry.ts`
  and the `Makefile` were untouched by both, while `sourcing/check.ts` and `pack-validation.ts`
  **did** move since the cross-review's `a7e700d` — which is why §5 was re-run rather than
  re-read `[V]`). **Ratified, all four returns, none declined:** the candidate population
  (36 documents / 143 entries / 7 texts / 0 Stage-A matches / no sixth provenance key,
  independently re-counted); the four un-retyped emitters; `accepted.rulingRef`; and the
  published-severity numbers (4 clean / 43 fail / 15 fail at draft today / 66 across 28 packs /
  97 = 66 + 31 in 12 ledger-less packs, re-run with the shipped checker). Also reproduced: 47 /
  240 / 177 / min 2 max 7 / 0 empty; 37 ruling entries in 7 variants 25/4/4/1/1/1/1; 48
  resolution-marked across 19 packs; `perfect_tablebase` 3 + 2; 32 ledgers, 27 fresh, the same 5
  stale; 16 files hardcoding a drafts path with 5 naming `anti-caro-advance`; `STILL UNTESTED`
  in `anti-italian-center-attack-black`; the three `CORPUS-CHECKED … NOT ANSWERABLE` packs, both
  `ENGINE-CHECKED … REFUTED` packs, `anti-caro-advance`'s defect-opening entry, the four
  `UNGROUNDED`-as-debt entries and `maroczy-bind-white-squeeze`'s unmarked completed pass;
  `make verify` = `typecheck test schema-check` with no corpus-wide `checkSourcingDirectory`
  caller; the 0.27 register row and 0.28 as next free. **Amended by the author, each in the
  section it governs:** the candidate scope ruling (§0.3, open question 6 — in scope for the
  schema, not a graduation subject, exclusion declined); the emitter template-id registry (§1.6,
  §4.0) and the three emitters that throw rather than emit; `rulingRef`'s grammar narrowed to
  `path` / `path#L<line>` with the append-only-file rule (§1.2); the never-wired sourcing gate
  split into a strict `content/packs/` gate, a ≤15-of-47 `content/drafts/` ratchet and an owned
  strict flip (§5.1, criterion 14, open question 3); the report's merged corpus total removed
  (§3.3, criterion 3). **Corrected against the cross-review:** owner-ruling dates are 6 distinct,
  not 8 (§1.2); the §4.3 residual proxy returns 45, not 47, and is restated as unquotable to the
  unit; `engine-leverage` has *landed* 0.23 and `vocabulary-wiring`'s 0.24 is in the working tree
  (§8.1). **Confirmed not to apply:** the migration-numbers-at-landing rule, since §8.2 claims no
  migration. New ledger block **D237–D246**.
