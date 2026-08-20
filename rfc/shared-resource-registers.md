# RFC: Shared-resource registers

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-16
- **Design refs:** **None, and the absence is deliberate.** This RFC specifies repo process,
  not product surface. Its normative homes are `rfc/0000-rfc-process.md` §Rules (rule 2,
  scope discipline; rule 6, the index) and the register sections of `rfc/README.md`. Citing a
  `design/` section here would be a fabricated citation — the standing hazard *a closure citing
  a ruling that says the opposite* in its cheapest form.
- **Exploration gate:** opened by the owner ruling of 2026-08-12, logged in
  `planning/exploration/log.md` (*"OWNER RULINGS: gate transition"*, line 200) and recorded at
  `rfc/README.md:96-98`: E1 met, E2 advisory, E3/E4/E5 accepted as in-flight risk. This RFC
  additionally claims nothing versioned and specifies no product behaviour, so law 1's
  "no RFC from a GAP row" does not bind it: every row it discharges is a ledgered defect with
  first-hand evidence, not an open question.
- **Depends on:** nothing. **Five of the seven documents in `planning/rfc-drafting-queue.md`
  depend on this one** — they must claim a lane from a register, and four of the six lanes have
  no register to claim from.
- **Parent / amends:** amends `rfc/0000-rfc-process.md` **§Rules** (adds rule 7) and the
  register sections of `rfc/README.md`. **It does not touch §RFC lifecycle** — that section is
  `rfc-lifecycle-completion`'s (RFC-2 in the drafting queue) and the boundary is stated in §7.
- **Supersedes / superseded by:** —
- **Planning:** `planning/shared-resource-registers/` (once implementing)

---

## Summary

This repo has **six shared, single-writer versioned resources** and **two registers**. Four
resources — the run schema, the shape-entry schema, the principle-entry schema and the
evidence-ledger vocabulary — can be moved by any draft with nothing recording who holds them.
The two registers that do exist are hand-written prose, and both are wrong at HEAD.

This RFC does two things. It **creates the four missing registers**, and it **changes what a
register is**: today a register is a table someone remembers to edit, and the measured result is
that `rfc/README.md` currently advertises two pack lanes — `0.23` and `0.24` — as held by
in-flight documents whose content shipped four versions ago. Under this RFC a register has two
halves with two different truth sources. The **landed** half is *derived from the tree* and never
hand-written. The **claimed** half is *declared in the RFC that makes the claim*, because a claim
is a statement about the future and the tree cannot know it. A `make register-check` target joins
them and fails when they disagree.

It claims nothing versioned: no pack lane, no run lane, no shape-entry lane, no
principle-entry lane, no migration position, no vocabulary member.

---

## Motivation

### The measurement

Every fact in this section was re-derived at HEAD `4a6ad91` by opening the named symbol. The
drafting queue that commissioned this RFC was written against `2160d2c`; the tree has moved twice
since, which is itself the argument.

**Six resources, two registers.** I enumerated by three passes: every `$id` in `schemas/*.json`;
every version constant in `packages/schema/src/index.ts` and `apps/server/src/storage.ts`; and
every closed vocabulary an in-flight draft proposes to widen.

| # | Resource | Identifier symbol | Head at HEAD | Register today |
|---|---|---|---|---|
| 1 | Pack schema | `DRILL_PACK_SCHEMA_VERSION` (`packages/schema/src/index.ts:2`); `drill_pack.schema.json` `$id` | **0.27** | `rfc/README.md:38` **Pack-schema-version register** |
| 2 | Run schema | `DRILL_RUN_SCHEMA_VERSION` (`:1`); `drill_run.schema.json` `$id` | **0.17** | **none** — run versions appear only as prose inside migration rows |
| 3 | Shape-entry schema | `SHAPE_ENTRY_SCHEMA_VERSION` (`:3`); `shape_entry.schema.json` `$id` | **0.3** | **none** |
| 4 | Principle-entry schema | `PRINCIPLE_ENTRY_SCHEMA_VERSION` (`:8`); `principle_entry.schema.json` `$id` | **0.1** | **none** |
| 5 | Migration ladder | `STORAGE_VERSION` (`apps/server/src/storage.ts:407`); `migrations` array head `{version: 23}` (`:2345`) | **23** | `rfc/README.md:112` **Migration register** |
| 6 | Evidence-ledger vocabulary | `EVIDENCE_KINDS` (`apps/server/src/sourcing/types.ts:57-65`) | **7 members**, and **no version identifier of any kind** | **none** |

`rfc/README.md` has two further `## … register` sections — **Cross-draft ownership pins**
(`:177`) and **Deferred decisions register** (`:271`). Neither governs a version, and this RFC
leaves both alone.

**Two of these resources moved in the working tree while this RFC was being written, and the
fact is recorded rather than smoothed over — it is the argument.** The figures above are at
committed HEAD `4a6ad91`. At the moment of drafting, `git status` shows an implementer mid-flight
on `graduation-clearance` with:

- `DRILL_PACK_SCHEMA_VERSION` **0.27 → 0.28** and `drill_pack.schema.json` `$id`
  **…drill-pack:0.27 → 0.28**, uncommitted. The pack register's `:77` row — *"0.28 claimed and
  held"* — is hours from becoming a landed row, and **nothing in the repo will notice when it
  does.** That is F1 about to recur on the very next lane. It does not change this RFC's derived
  next-free of **0.29**; it changes only which side of the head 0.28 sits on.
- `EVIDENCE_KINDS`' seven members **hand-transcribed into a second location**:
  `schemas/drill_pack.schema.json:1140`, as `clearance.recordKind`'s enum. The constant itself is
  unchanged at seven (`apps/server/src/sourcing/types.ts:57-65`). So resource 6 now has **two
  copies in two languages, one register-less shared vocabulary, and a queued document
  (`pack-population-provenance`) that must widen it** for [[D268]] and [[D171]].

A version that moves between a document being drafted and being read is not an unusual event in
this repo — `planning/rfc-drafting-queue.md` opens by recording that the tree moved under it *"for
the fourth time in three days"*, and it moved twice more before this RFC was written. **That is
the condition this RFC is designed for**, and it is why the landed half must be derived rather
than transcribed: a transcribed number is correct only until someone else commits.

**Resource 4 is new.** The drafting queue names five resources; there are six. The
principle-entry schema is a shared versioned resource with a consumer
(`apps/server/src/principle-validation.ts`), a named claimant in the pack register's 0.26 row
(*"resolves against the official principle-entry 0.1 registry"*), and it is **the only one of the
four schema constants with no test binding it to its `$id`**: `drill-pack.test.ts:62-64`,
`shape-entry.test.ts:32-33` and `drill-run.test.ts:115-116` each pin their constant and `$id`
together; `packages/schema/src/` contains no `principle-entry.test.ts`. It is unregistered *and*
unasserted. It is proposed as a new ledger row in §Open questions.

### The four measured failures, each at the symbol

**F1 — two documents advertise held lanes for content that already shipped ([[D497]]).**
`rfc/README.md:72` lists pack **0.23** owned by `engine-leverage.md`, status *implementing
2026-08-16*; `:73` lists pack **0.24** owned by `vocabulary-wiring.md`, same status.
`DRILL_PACK_SCHEMA_VERSION` is **0.27**. Their content is in the tree: `$defs/engineCondition`
at `schemas/drill_pack.schema.json:1001` with `properties.guard.conditions[]` referencing it at
`:104-107`; the `plan_signature` leaf at `drill_pack.schema.json:555` **and**
`shape_entry.schema.json:84`, both landed at `caa8afa` *"feat: wire pack vocabulary reach"*;
`searchBound` in `drill_run.schema.json`; and migration **21** landed as
`{version: 21, name: "engine leverage run schema"}` at `apps/server/src/storage.ts:2335`.

The row understates it. `rfc/archive/engine-leverage.md:1289-1291` is an **acceptance criterion**:

> `DRILL_PACK_SCHEMA_VERSION` is `"0.23"`, `DRILL_RUN_SCHEMA_VERSION` is `"0.16"`, the two
> `$id`s match, and `STORAGE_VERSION` is 21 …

At HEAD those constants read `"0.27"`, `"0.17"` and `23`. **This is a criterion that cannot be
satisfied, live, in an Active RFC** — the first standing hazard, sitting in the register's own
evidence. `:148` compounds it with a live instruction to every parallel drafter: *"do not claim
pack 0.23, run 0.16, or migration 21."* All three are long gone.

**F2 — a lane moved with nothing to notice ([[D498]], [[D376]]).** `shape_entry.schema.json`'s
`$id` is `urn:chess-tabiya:schema:shape-entry:0.3`. The last *recorded* shape-entry change is
**0.2**, recorded not in a shape-entry register but as a clause inside the *pack* register's 0.13
row (`rfc/README.md:62`, `archive/predicate-wave-2.md`). The 0.2→0.3 move was made by
`vocabulary-wiring` at `caa8afa`, and `vocabulary-wiring`'s register row (`:73`) records only a
pack claim. `measurement-records`' claim of shape-entry **0.4** is therefore correct **by luck**:
nothing compared it to anything.

**F3 — the register contradicted itself inside four lines ([[D461]]).** **Verify first, and it
verifies clean: this row is fixed. Close it.** At HEAD, `rfc/README.md:12`, `:13`, `:77` and
`:78` all read 0.28 as claimed and held by `graduation-clearance`, with `:78` naming 0.29 as next
free. No contradiction survives. [[D472]] (the partial fix) is already ✅ at `design/BACKLOG.md:159`;
**D461 still reads 🐞 in column 1 at `:178`** and is discharged by this verification, not by work.
This RFC's §5 nevertheless removes the *shape* that produced it — see F3's lesson below.

**F4 — drafts carry stale version literals ([[D384]], [[D423]], [[D447]]).** D384's own row
(`design/BACKLOG.md:245`) states *"HEAD is 22"*; `STORAGE_VERSION` is **23**. The row is stale in
the direction that flatters the register. [[D423]] and [[D447]] record the same defect one level
up: three documents held one migration position, `opponent-contracts` landed 23 at `6ba0736` and
left the ladder, and **the register could not see the contest shrink** because it has no row for a
position at all. At HEAD the ladder is `teacher-surface` → `learner-rating`, enforced by a foreign
key (`cohort_standings.classroom_id … REFERENCES classrooms(id)`) rather than by the register.

**One row is also materially wrong and is worth stating**, because this RFC is built on it:
[[D376]]'s text (`design/BACKLOG.md:248`) asserts *"Pack schema, run schema and migrations each
have a register in `rfc/README.md`"*. **There is no run-schema register.** The row is right about
its subject and wrong about its premise; a ledger row is a claim about the past, and this one has
a false clause in it.

### Why this scope boundary

**In scope:** which resources have registers, what a register records, where a claim is written,
and one check that reads both. **Out of scope:** the RFC lifecycle vocabulary (RFC-2), the
`design/BACKLOG.md` routing invariant (`make work-index`), the body/register status contradiction
(`make status-parity`), and any change to any of the six resources. §7 states each boundary and
why it falls there.

---

## Specification

### §1 — The six resources are named, and the list is closed by a criterion

`rfc/0000-rfc-process.md` §Rules gains **rule 7**:

> 7. **Shared versioned resources are registered.** A *shared versioned resource* is anything
>    satisfying all three of: (a) it carries a version identifier or is a closed vocabulary;
>    (b) two documents drafted in parallel can move it independently and then cannot both land;
>    (c) it is exported across a package boundary or embedded in a `schemas/*.json` document.
>    Every such resource has a register section in `rfc/README.md`. A draft declares its claims
>    on them in one machine-readable block (§3) before writing a version into its body.

The criterion is what keeps this bounded. `ABSTENTION_REASONS` (`sourcing/types.ts:68`) satisfies
(a) and (c) and fails (b) — no in-flight draft moves it — so it is **not registered today and
enters the register the day a draft claims it**, by the same rule. The register grows by claim,
not by inventory.

The six resources of §Motivation are the closed set at HEAD. Their canonical names, used verbatim
in every declaration block, are:

`pack-schema` · `run-schema` · `shape-entry-schema` · `principle-entry-schema` · `migration` ·
`evidence-kinds`

### §2 — A register has two halves, and only one of them can be derived

This is the load-bearing decision of this RFC and it is argued rather than asserted.

**The landed half is derived.** What version the tree holds, and which document shipped it, is a
fact about the past that is already written in the tree in machine-readable form:
`packages/schema/src/index.ts` exports `schemaBuildInfo` — a frozen object naming all four schema
versions at `:11-16` — and `STORAGE_VERSION` and `EVIDENCE_KINDS` are single exported constants.
**Half the join already exists.** Writing that half by hand a second time is what produced F1, F2,
F3 and F4, and there is no benefit to set against it: a hand-copied constant can only ever agree
with the tree or be wrong.

**The claimed half cannot be derived, and pretending otherwise would be the second standing
hazard.** A claim is a statement about the *future* — *"I intend to take the next pack lane."*
Pack 0.29 does not exist in the tree and will not until it lands. A checker that derived lane
state purely from the tree would report `pack-schema: 0.27, next free 0.28` and be **confidently
wrong**, because `graduation-clearance` holds 0.28. That is a check that passes while measuring
nothing, and it is the exact defect [[D444]] names.

So the mechanism is neither *standardise the prose* nor *derive everything*:

> **The landed half is derived from the tree and never written. The claimed half is declared
> exactly once, in the RFC that makes the claim. A check joins them and fails when they
> disagree.**

**Why not simply standardise the hand-written registers.** Because it has now failed measurably
in four places (F1–F4) and the failure mode is not carelessness — it is that *nothing reads
prose*. Adding four more hand-written tables adds four more surfaces with the same defect, and
`planning/WORK.md` §0 already names *"a normative rule written in prose has no reader"* as the
dominant defect class in this repo. `planning/work-register.md` going 121 rows stale ([[D487]])
and the body/register contradiction blocking an implementer ([[D477]]) are the same species.

**Why not generate `rfc/README.md`.** Tempting and rejected. The file holds wave orders,
ownership pins, split rationales, withdrawal notes and archive links that are not derivable from
anything. Generating it would either destroy that prose or require a template so elaborate that
the generator becomes the thing that rots. **Check, do not generate** — cheap, reversible, and it
does not fight the prose.

**The precedent for the chosen mechanism is already accepted in this repo, and its rationale is
verbatim my argument.** `rfc/graduation-clearance.md` criterion 13 (`:2301-2306`) specifies a test
that imports `EVIDENCE_KINDS` from `apps/server/src/sourcing/types.ts` and asserts it is set-equal
to the `clearance.recordKind` enum it transcribes into the pack schema, and says why:

> Asserting a literal seven-item list on the schema side alone would pass while a new evidence
> kind silently became unexpressible in a clearance, which is the failure this criterion exists
> to catch.

That is a copy of a shared vocabulary asserted equal to its source in the tree. **This RFC
generalises exactly that mechanism from one vocabulary to all six resources.** It is not a new
idea being introduced; it is an accepted idea being applied where it was needed first.

**And that precedent is itself a live collision this RFC would catch — the transcription is no
longer hypothetical.** As of the working tree at drafting, `graduation-clearance`'s implementer
has written the **seven** shipped `EVIDENCE_KINDS` into
`schemas/drill_pack.schema.json:1140` as `clearance.recordKind`'s enum. Meanwhile
`pack-population-provenance` (RFC-5 in the drafting queue) must widen `EVIDENCE_KINDS` with a
bibliographic member for [[D268]] and a `provenance_note` for [[D171]]. **Two documents now move
one closed vocabulary that has no register and no version identifier, and one of them has already
copied it.** If RFC-5 lands first, criterion 13 fails at `graduation-clearance`'s implementation
with no warning to either author; if it lands second, the JSON enum silently disagrees with the
constant until that criterion runs. That is the entire thesis of this RFC, in a resource nobody
registered, happening now.

### §3 — The claim declaration

Every RFC body carries **exactly one** fenced block with the info string `tabiya-claims`. One
claim per line; three `|`-separated fields; comments begin `#`.

````
```tabiya-claims
<resource> | <claim> | <changes>
```
````

- **`<resource>`** — one of the six canonical names in §1. Any other value is an error.
- **`<claim>`** — by resource kind:
  - schema resources: `lane <version>` (e.g. `lane 0.29`)
  - `migration`: `position behind <rfc-slug>`, or `position next`. **A bare integer is refused.**
  - `evidence-kinds`: `members <name>[, <name>…]`
- **`<changes>`** — the named symbol(s) this claim will move: a `$defs` path, an enum, a property,
  a table, or a constant. **It is mandatory and must be non-empty.** This is [[D385]]'s doctrine
  made mechanical rather than remembered — see §5.3.

**The empty case is declared, never inferred:**

````
```tabiya-claims
none
```
````

An RFC that claims nothing versioned writes `none`. It does **not** omit the block. This is the
cheapest guard in the document and it is bought with evidence: `CLAUDE.md` records that
`engine-request-contract` was the single RFC that flowed back to nothing and *"was also the only
one with no log entry — the absence predicted the failure exactly."* An absent declaration is
ambiguous between *claims nothing* and *forgot to say*; a present `none` is not. **Five of the
nine current Active RFCs would write `none`**: `live-marker-quality`, `dead-vocabulary` and
`feedback-delivery` say *"claims nothing versioned"* in their register rows today
(`rfc/README.md:10`, `:15`, `:18`), plus `engine-leverage` and `vocabulary-wiring` once §6's
corrections land. The four that would declare a claim are `teacher-surface` (migration position),
`graduation-clearance` (pack 0.28), `measurement-records` (shape-entry 0.4) and `learner-rating`
(migration position, **two** claim lines per §5.1).

**The declaration is the single writer.** Where an RFC body's prose and its `tabiya-claims` block
disagree, the block is authoritative and the prose is a defect. Where the block and
`rfc/README.md`'s register row disagree, **that is check C3's failure** and neither wins until a
human resolves it.

### §4 — The four new register sections

`rfc/README.md` gains four sections, shaped like the existing two. Each opens with **one
machine-readable head line** in exactly this form, and nothing else in the section states a
version:

```
<!-- register: run-schema head=0.17 -->
```

Then a table of landed rows — `| version | owner RFC | what it changed |` — and a table of live
claims — `| version | claimant RFC | changes | declared at |`.

**No section contains a "next free" row.** The next free lane is `max(head, highest live claim)`
incremented, it is **computed and printed by `make register-check`**, and it is never written into
the file. This is F3's lesson generalised: `rfc/README.md:78`'s hand-written *"0.29 is the next
free pack lane"* went stale against a row four lines above it. **A fact you never write cannot go
stale**, and this removes the only remaining hand-written derived fact in the pack register. The
two existing sections lose their next-free rows on the same rule.

The **evidence-kinds** register is shaped differently and the difference is normative: that
resource has **no version identifier**, so a claim on it names *members*, not a number. Its landed
table is `| member | added by | added at |`, its head line is
`<!-- register: evidence-kinds members=7 -->`, and two claims on the same member name are a
collision while two claims on *different* members are not. Giving `EVIDENCE_KINDS` a version
number is deliberately **refused**: the members are the resource, the count is derivable, and a
second version identifier would be a third thing to keep in sync.

### §5 — Register doctrine, three rules, each measured

**§5.1 — Count claims, not documents ([[D423]] addendum).** The unit in the claim table is one
line of a `tabiya-claims` block, not one document. `learner-rating` carries two independent table
sets (§10.1's rating tables and §10a.7's standing tables), so on the migration ladder there are
**two documents and three claims** at HEAD — `teacher-surface` one, `learner-rating` two.
Counted by document the contest is invisible.

**§5.2 — A register records a claimant leaving, and derivation is how ([[D447]]).**
`opponent-contracts` landed migration 23 at `6ba0736` and left the ladder; the register could not
see the contest shrink from three to two. Under §2 it is automatic: when a claim lands, the tree
head moves past it, C2 fires until the stale claim is removed, and the derived next-free
recomputes. No one has to remember. **This is the single strongest argument for deriving the
landed half** — a hand-written register can be updated when a claim *arrives* (someone is
writing) and reliably is not when a claim *departs* (nobody is).

**§5.3 — A register-only lane is not a lane ([[D385]]).** Every pack lane 0.3 → 0.27 carried a
`$defs`, enum or property change; not one was claimed register-only. `opponent-contracts` claimed
pack 0.28 for four `FORMAT_DISPOSITIONS` rows and cross-review released it, on the ground that
*version events live in a field, not the `$id`*. The rule is enforced by §3's mandatory
non-empty `<changes>` field: a claim that cannot name a symbol it moves is refused by the parser,
not by a reviewer's memory.

**§5.4 — A position is claimed, never an integer ([[D423]], [[D447]]) — preserved and
strengthened.** The migration register's existing rule stands verbatim and is not restated here.
This RFC adds only its enforcement: §3 refuses a bare integer in a `migration` claim, and check C5
fails on one. The rule was already correct and had already *worked* — D423 records that no integer
collision occurred — and the failure was that nothing could see the *position*. §4's claim table
gives the position a row; §3's `position behind <rfc-slug>` gives it an order.

### §6 — `make register-check`

A single Node script, `tools/register-check.mjs`, in the family of `tools/verify-scaffold.mjs`
(135 lines) and `tools/verify-packaging.mjs` (87 lines). It reads: four `schemas/*.json` `$id`s;
`packages/schema/src/index.ts`; `apps/server/src/storage.ts` for `STORAGE_VERSION` and the
`migrations` array head; `apps/server/src/sourcing/types.ts` for `EVIDENCE_KINDS`; the
`tabiya-claims` block of every RFC named in `rfc/README.md` §Active; and the six register head
lines. Regex-level parsing throughout — no TypeScript AST, no JSON-schema traversal.

It prints the derived next-free lane for each of the six resources, then runs six checks. It
exits non-zero on any failure and names the two disagreeing sites in every message.

| | Check | Fails when |
|---|---|---|
| **C1** | Every RFC in §Active except `0000-rfc-process.md` has **exactly one** `tabiya-claims` block, and every line parses against §3's grammar. | An RFC lands without a block; a block is deleted in a rewrite; two blocks after a merge; a resource name is misspelled. |
| **C2** | For each schema resource, every live `lane X` satisfies `X` **strictly greater than** the tree head. | A document's content ships and its claim is not withdrawn. **Red at HEAD**: `engine-leverage` 0.23 and `vocabulary-wiring` 0.24 against 0.27 (F1). |
| **C3** | No two live claims name the same resource **and** the same lane; and every register claim row has a matching declaration in the named RFC's block, and conversely. | Two drafts pick one number (the original 0.6 collision that instituted the pack register); or a register row and an RFC body disagree about what is held. |
| **C4** | (a) The tree head of each resource has a landed row naming a document. (b) **No landed row at or below the tree head advertises a held or claimed lane.** | (a) A version moves with no register row. **Red at HEAD**: shape-entry 0.3, last recorded 0.2 (F2). (b) A shipped lane still reads as held. **Red at HEAD**: rows `:72` and `:73` (F1). |
| **C5** | No `migration` claim line contains a bare integer. | A drafter writes `migration 24` instead of a position ([[D423]]). |
| **C6** | Each register's head line equals the tree constant it names; and no register section contains a hand-written next-free row. | A head line goes stale (F4); or someone reintroduces the row that produced F3. |

**Wiring.** `register-check` joins `verify` (`verify: typecheck test schema-check
register-check`). It is a **one-stage landing**, unlike the staged shape `planning/WORK.md`
prescribes for `make work-index`, and the difference is measured rather than assumed: D487's
checker is red on **213 of 248 open rows**, which cannot be fixed in a landing commit; this one is
red on **exactly three facts** — `rfc/README.md:72`, `:73` and a missing shape-entry 0.3 row —
all of which are register edits in the landing commit. A gate that is green the day it lands is
worth more than a reporting target nobody reads.

**What the landing commit must correct to reach green**, and no more:

1. `rfc/README.md:72` and `:73` become landed rows recording what shipped under 0.23 and 0.24,
   and stop advertising held lanes.
2. A shape-entry landed row for **0.3**, owner `vocabulary-wiring`, landed at `caa8afa`.
3. `engine-leverage`'s and `vocabulary-wiring`'s `tabiya-claims` blocks read `none`.

**Explicitly not corrected here:** whether those two RFCs move to `implemented` and archive.
That is a lifecycle act, it belongs to RFC-2 or to the owner, and this RFC records the tree's
facts without deciding anyone's status. `rfc/archive/engine-leverage.md:1289`'s unsatisfiable acceptance
criterion is **named, not edited**, for the same reason — it is proposed as a ledger row in
§Open questions.

### §7 — Boundaries, stated rather than left implicit

**`make status-parity` ([[D477]]) — does not belong to this RFC, and should not.** It compares an
RFC body's `**Status:**` line to its `rfc/README.md` §Active status cell. That is *lifecycle*
state, not shared-resource state; a wrong status blocks an implementer, a wrong lane corrupts a
landing order. `planning/WORK.md` §0 has it queued as implementation and that is right — a script
comparing two strings changes no contract and law 1 does not gate a lint.

**Two things it is owed, and they come from two different documents.** From RFC-2: a state
vocabulary. I ran the parity check by hand at HEAD across all ten §Active rows — **nine agree**;
`measurement-records.md`'s body reads `- **Status:** draft` while its register cell reads
*"returned to author 2026-08-16"*, and *returned to author* is not one of the six states in
`rfc/0000-rfc-process.md` §RFC lifecycle. (The drafting queue reports 8 of 9 on the same finding;
the difference is only whether `0000-rfc-process.md` is counted. One disagreement either way.)
From **this** RFC: the reader. C1's block-locator and C3's §Active-table parser are the same
plumbing `status-parity` needs, and `tools/register-check.mjs` is where it lives. **Share the
reader, not the rule** — `status-parity` may import from it and must not restate its parsing.

**`make work-index` ([[D487]]) — does not belong here at all.** Different input
(`design/BACKLOG.md` column 1, not schemas), different join (rows to destinations), different
failure (an unrouted row, not a contested lane), and a different landing shape (staged, because
it is red on 213 rows). No overlap beyond both being `make verify` targets.

**RFC-2's §RFC lifecycle amendment.** This RFC amends `rfc/0000-rfc-process.md` **§Rules** only,
adding rule 7. RFC-2 amends **§RFC lifecycle**. Two documents editing one file in two sections is
a merge, not a collision, and this note exists so neither drafter has to discover the other.

---

## Deviations from design

**None.** This RFC specifies no product surface and cites no `design/` section (see the
Design refs note). It touches no `design/` document; the ledger rows it discharges are flipped in
its landing commit per `CLAUDE.md`'s completion protocol, which that file establishes as a
register every tier writes to rather than an intent doc.

---

## Acceptance criteria

Each criterion states **how it can fail**, because a criterion whose failure mode cannot be
described is a criterion that measures nothing.

1. **`rfc/0000-rfc-process.md` §Rules contains rule 7 with the three-part criterion of §1
   verbatim, and §RFC lifecycle is byte-identical to its state at `4a6ad91`.**
   *Fails if:* the criterion is paraphrased into something unbounded (*"anything shared"*), which
   would put every exported constant in the register; or if the edit strays into §RFC lifecycle
   and collides with RFC-2.

2. **`rfc/README.md` contains six register sections, each with exactly one head line matching
   `<!-- register: <name> head=… -->` (or `members=…` for `evidence-kinds`), and no section
   contains a next-free row.**
   *Fails if:* a section is added with prose head text instead of the machine-readable line —
   which would parse as absent and make C6 vacuous; or if a helpful next-free row is left in,
   reintroducing F3.

3. **Every RFC named in `rfc/README.md` §Active except `0000-rfc-process.md` carries exactly one
   `tabiya-claims` block; the **five** that claim nothing versioned carry `none` rather than
   omitting it, and the **four** that claim carry **five** claim lines between them (§5.1).**
   Count the blocks against the §Active row count, not against `ls rfc/*.md`.
   *Fails if:* the implementer treats an omitted block as equivalent to `none` — the exact
   ambiguity §3 exists to remove; or if the file-glob is used and picks up `README.md` and
   `template.md`, giving 12 where §Active gives 10.

4. **`make register-check` exists, is listed in `.PHONY`, and is a prerequisite of `verify`.**
   *Fails if:* the target is added but not wired into `verify`, leaving a checker nobody runs —
   the [[D450]] shape (a rule in a document no test reads) reproduced in a Makefile.

5. **`make register-check` exits zero at the landing commit**, and the three corrections of §6 are
   in that same commit.
   *Fails if:* the checks are weakened to pass instead of the facts being fixed — specifically if
   C4(b) is dropped, since it is the one check that is red on `rfc/README.md:72` and `:73` and
   therefore the one most likely to be softened.

6. **Each of C1–C6 has a test that makes it fail.** For every check, a fixture in which the
   assertion is violated and the checker exits non-zero, plus one in which it passes.
   *Fails if:* only the passing direction is tested. Two of these checks are joins, and a join
   whose key matches nothing passes silently — [[D444]]'s census defect. **C3's negative fixture
   must contain at least two live claims**, because an equality over a singleton set holds
   trivially and would pass while measuring nothing.

7. **The derived next-free lane is printed for all six resources and is correct against a
   hand-derivation recorded in the planning log.** At committed HEAD `4a6ad91` that is: pack
   **0.29** (head 0.27, 0.28 held by `graduation-clearance`); run **0.18**; shape-entry **0.5**
   (head 0.3, 0.4 held by `measurement-records`); principle-entry **0.2**; migration **position
   behind `teacher-surface` → `learner-rating`**, integer taken at landing; evidence-kinds
   **n/a — a member name, not a number**.
   *Fails if:* the checker reports pack next-free as **0.28** — which is what a purely
   tree-derived implementation returns, and is the §2 error this RFC exists to argue against; or
   if it prints an integer for `migration`, breaching [[D423]].
   **Re-derive at landing, do not trust this list.** The pack bump to 0.28 was already
   uncommitted in the working tree while this RFC was written, which moves 0.28 from the claimed
   side of the head to the landed side and leaves next-free at 0.29 by a different route. The
   criterion is that the printed value equals a fresh hand-derivation **at the landing commit**,
   not that it equals the six values printed above.

8. **`tools/register-check.mjs` re-derives every version and member list from the tree and
   hard-codes none of them.** A grep of the script for the literals `0.27`, `0.28`, `0.17`,
   `0.3`, `0.1`, `23` and the seven `EVIDENCE_KINDS` member names returns nothing outside test
   fixtures.
   *Fails if:* the implementer pins a literal for convenience, which reproduces the defect being
   fixed **inside the fix** — the checker would then go stale on the first bump and report green.
   The pack lane moving from 0.27 to 0.28 between this RFC's drafting and its landing is the
   concrete instance: a checker pinned to either number is already wrong.

9. **No shared resource moves.** `DRILL_PACK_SCHEMA_VERSION`, `DRILL_RUN_SCHEMA_VERSION`,
   `SHAPE_ENTRY_SCHEMA_VERSION`, `PRINCIPLE_ENTRY_SCHEMA_VERSION`, `STORAGE_VERSION`,
   `EVIDENCE_KINDS` and all four `schemas/*.json` `$id`s are byte-identical before and after.
   *Fails if:* the shape-entry 0.3 row of §6 is mistaken for a licence to bump shape-entry, or
   the `evidence-kinds` register is read as a licence to add a version field to
   `EVIDENCE_KINDS` — §4 refuses that explicitly.

10. **The ledger rows are flipped in the landing commit** ([[D376]], [[D385]], [[D423]],
    [[D447]], [[D384]] register-half, [[D497]], [[D498]], [[D499]]), and **[[D461]] is flipped
    on this RFC's verification with no work attached**.
    *Fails if:* D461 is left open — it is discharged and re-verified at `4a6ad91`, and a criterion
    that tells an implementer to flip a row that is already flipped is the first standing hazard;
    this one is the inverse and equally real. Also fails if [[D384]]'s **collision half** is
    flipped: only its register half is in scope, its collision half is superseded by
    [[D423]]/[[D447]], and closing a row on a document that took half of it is how a row dies
    unfixed.

---

## Open questions

**Q1 — Does the `principle-entry-schema` register earn its section today?**
It satisfies §1's criterion (a) and (c) but currently fails (b): no in-flight draft claims it, and
its version has not moved since it was created at 0.1. By rule 7's own logic it should enter the
register the day a draft claims it, not before. **Proposed resolution: create the section anyway**,
with a landed row for 0.1 and an empty claim table. The cost is four lines; the benefit is that C4
covers the one resource whose constant is bound to its `$id` by **no test at all**, so it is the
resource most likely to drift silently. *Resolve before `accepted`.*

**Q2 — Where does the `tabiya-claims` block sit in an RFC body?**
Adjacent options: immediately after the metadata header, or in a `## Shared resources` section
near the specification. The header keeps it in one place for the parser and for a reader deciding
whether a draft blocks theirs; a section keeps the header short. **Proposed: immediately after the
metadata header, before `## Summary`**, since C1 is a locator and the least ambiguous location is
a fixed one. *Resolve before `accepted`.*

**Q3 — Should the check refuse a claim by a `withdrawn` or archived RFC?**
Once RFC-2 defines the state vocabulary, a claim held by a withdrawn document is detectable and
should be released automatically. Today the states are not defined ([[D500]]), so C2/C3 read
§Active membership as the liveness signal, which is sound but coarse. **Deferred to
`rfc-lifecycle-completion`**, which owns the vocabulary; this RFC's checker gains the rule when
that lands, and this deferral is named so it is not rediscovered.

**Proposed new ledger rows — described here, deliberately not written** (ids through D502 are in
use):

- **D503** — *The principle-entry schema is a sixth shared versioned resource, and the only one
  whose constant no test binds to its `$id`.* `PRINCIPLE_ENTRY_SCHEMA_VERSION` is `"0.1"`
  (`packages/schema/src/index.ts:8`) and `principle_entry.schema.json`'s `$id` is
  `urn:chess-tabiya:schema:principle-entry:0.1`; `drill-pack.test.ts`, `drill-run.test.ts` and
  `shape-entry.test.ts` each pin their pair, and there is no `principle-entry.test.ts`. It is
  unregistered and unasserted. Same species as [[D376]] and [[D498]]; found while enumerating the
  resources this RFC registers.

- **D504** — *`engine-leverage` carries an acceptance criterion that cannot be satisfied.*
  `rfc/archive/engine-leverage.md:1289-1291` requires `DRILL_PACK_SCHEMA_VERSION` to be `"0.23"`,
  `DRILL_RUN_SCHEMA_VERSION` `"0.16"` and `STORAGE_VERSION` 21; at HEAD they are `"0.27"`,
  `"0.17"` and 23, and its content has already shipped. `:148` additionally instructs parallel
  drafters not to claim three lanes that are all long gone. This is [[D497]]'s register defect
  reaching into an Active RFC's acceptance test; naming it separately matters because flipping
  D497 would close the register half and leave the criterion in place.

- **D505** — *`planning/WORK.md` §0 says the body/register contradiction blocked an implementer
  **six** times; [[D477]]'s own row title says **five**.* Two hand-maintained documents,
  one incrementing counter, written a day apart. Harmless in itself and worth one row because it
  is the defect class of this RFC appearing in the very file that queues the fix for it.

- **D506** — *`EVIDENCE_KINDS` now exists in two hand-maintained copies in two languages, and
  still has no version and no register.* The seven members are the TS constant
  (`apps/server/src/sourcing/types.ts:57-65`) and, in the working tree at drafting, a literal JSON
  enum at `schemas/drill_pack.schema.json:1140` (`clearance.recordKind`). `graduation-clearance`
  criterion 13 asserts the two are set-equal, which is the right guard and only fires at that
  RFC's own test time; `pack-population-provenance` must widen the constant for [[D268]] and
  [[D171]] and has no way to learn the copy exists. Sharpens [[D499]] from *a fifth resource with
  no register* to *a resource with two writers, two copies, and no register*. Found by
  re-checking the working tree at the end of this drafting pass, not the start — which is itself
  the [[D478]] *assert before replacing* discipline paying out.

---

## Changelog

- 2026-08-16: created. Drafted against HEAD `4a6ad91`; every register fact in §Motivation
  re-derived at the named symbol at that commit, not inherited from
  `planning/rfc-drafting-queue.md` (written against `2160d2c`). Four findings differ from the
  queue: a **sixth** shared resource (`principle-entry-schema`, unregistered *and* the only one
  no test binds to its `$id`); an **unsatisfiable acceptance criterion** inside `engine-leverage`
  (`:1289-1291`); **[[D461]] confirmed already fixed** and closed on verification rather than
  work; and — found by re-checking the working tree at the end of the pass rather than the start
  — **two of the six resources moved uncommitted while this RFC was being written**
  (`DRILL_PACK_SCHEMA_VERSION` 0.27→0.28, and `EVIDENCE_KINDS` acquiring a second hand-written
  copy at `schemas/drill_pack.schema.json:1140`). The second of those converts [[D499]] from *a
  resource with no register* into *a resource with two copies and no register*, and is the
  sharpest single piece of evidence in the document.
