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
  `rfc/README.md:95-97`: E1 met, E2 advisory, E3/E4/E5 accepted as in-flight risk. This RFC
  additionally claims nothing versioned and specifies no product behaviour, so law 1's
  "no RFC from a GAP row" does not bind it: every row it discharges is a ledgered defect with
  first-hand evidence, not an open question.
- **Depends on:** nothing. **Five of the seven documents in `planning/rfc-drafting-queue.md`
  depend on this one** — they must claim a lane from a register, and four of the six lanes have
  no register to claim from. Three of the seven are now drafted, and the dependency is no longer
  hypothetical: `pack-population-provenance.md` (RFC-5) holds two live claims — pack **0.29** and
  the `citable_text` member of `EVIDENCE_KINDS` — **neither of which has a register row anywhere**,
  while the pack register's hand-written next-free row still names 0.29 as free (see §Motivation).
- **Parent / amends:** amends `rfc/0000-rfc-process.md` **§Rules** (adds rule 7) and the
  register sections of `rfc/README.md`. **It does not touch §RFC lifecycle** — that section is
  `rfc-lifecycle-completion`'s (RFC-2 in the drafting queue) and the boundary is stated in §7.
- **Supersedes / superseded by:** —
- **Planning:** `planning/shared-resource-registers/` (once implementing)

```tabiya-claims
none
```

*(The block above sits in the ruled location — immediately before `## Summary` — per the owner
answer to Q2 (D648, 2026-08-21). It is inert until this RFC's own checker lands; it is carried now
so the document demonstrates its own §3.)*

---

## Summary

This repo has **six shared, single-writer versioned resources** and **two registers**. Four
resources — the run schema, the shape-entry schema, the principle-entry schema and the
evidence-ledger vocabulary — can be moved by any draft with nothing recording who holds them.
The two registers that do exist are hand-written prose, and each has now been measurably wrong
at a HEAD: at this RFC's drafting the pack register advertised lanes `0.23` and `0.24` as held
by in-flight documents whose content had shipped four versions earlier; that instance was
closed by the A0 audit of 2026-08-20 ([[D497]] ✅), and **at the refresh HEAD `29498ba` the same
class is live again** — the hand-written *"0.29 is the next free pack lane"* row stands while
`pack-population-provenance` claims 0.29, and that claim (plus its `citable_text` member claim,
plus `measurement-records`' shape-entry 0.4) has **no register row anywhere**.

This RFC does two things. It **creates the four missing registers**, and it **changes what a
register is**: today a register is a table someone remembers to edit. Under this RFC a register has two
halves with two different truth sources. The **landed** half is *derived from the tree* and never
hand-written. The **claimed** half is *declared in the RFC that makes the claim*, because a claim
is a statement about the future and the tree cannot know it. A `make register-check` target joins
them and fails when they disagree.

It claims nothing versioned: no pack lane, no run lane, no shape-entry lane, no
principle-entry lane, no migration position, no vocabulary member.

---

## Motivation

### The measurement

Every fact in this section was derived at drafting HEAD `4a6ad91` by opening the named symbol,
and **re-derived in full at refresh HEAD `29498ba` (2026-08-21)** — the changelog lists what
moved. The drafting queue that commissioned this RFC was written against `2160d2c`; the tree
had moved twice by drafting and many times more by the refresh, which is itself the argument.

**Six resources, two registers.** I enumerated by three passes: every `$id` in `schemas/*.json`;
every version constant in `packages/schema/src/index.ts` and `apps/server/src/storage.ts`; and
every closed vocabulary an in-flight draft proposes to widen.

| # | Resource | Identifier symbol | Head at HEAD | Register today |
|---|---|---|---|---|
| 1 | Pack schema | `DRILL_PACK_SCHEMA_VERSION` (`packages/schema/src/index.ts:2`); `drill_pack.schema.json` `$id` | **0.27** | `rfc/README.md:38` **Pack-schema-version register** |
| 2 | Run schema | `DRILL_RUN_SCHEMA_VERSION` (`:1`); `drill_run.schema.json` `$id` | **0.17** | **none** — run versions appear only as prose inside migration rows |
| 3 | Shape-entry schema | `SHAPE_ENTRY_SCHEMA_VERSION` (`:3`); `shape_entry.schema.json` `$id` | **0.3** | **none** |
| 4 | Principle-entry schema | `PRINCIPLE_ENTRY_SCHEMA_VERSION` (`:8`); `principle_entry.schema.json` `$id` | **0.1** | **none** |
| 5 | Migration ladder | `STORAGE_VERSION` (`apps/server/src/storage.ts:407`); `migrations` array head `{version: 23}` (`:2360`) | **23** | `rfc/README.md:111` **Migration register** |
| 6 | Evidence-ledger vocabulary | `EVIDENCE_KINDS` (`apps/server/src/sourcing/types.ts:57-65`) | **7 members**, and **no version identifier of any kind** | **none** |

`rfc/README.md` has two further `## … register` sections — **Cross-draft ownership pins**
(`:176`) and **Deferred decisions register** (`:280`). Neither governs a version, and this RFC
leaves both alone.

**Correction, 2026-08-21 — this section originally reported two working-tree moves, and one of
them was a false record.** The original text claimed that at drafting, `git status` showed
`DRILL_PACK_SCHEMA_VERSION` bumped 0.27 → 0.28 uncommitted, and `EVIDENCE_KINDS`' seven members
hand-transcribed into `schemas/drill_pack.schema.json` as `clearance.recordKind`'s enum. **Both
claims rested on a sub-agent's working-tree observation and neither survived re-derivation**:
the pack bump was never committed — `DRILL_PACK_SCHEMA_VERSION` is **0.27 at `29498ba`** and
`rfc-lifecycle-completion`'s changelog verified by `git log -S` that 0.28 never landed — and the
transcription **does not exist**: `grep recordKind schemas/drill_pack.schema.json` returns
nothing at HEAD. The ledger row this RFC's drafting produced for the second claim, [[D506]], was
**retracted 2026-08-17 as a false record**, the ledger's third. What survives is exactly what
the retraction preserved: `EVIDENCE_KINDS` is a shared resource with **no version and no
register** ([[D499]]); the duplication becomes real the moment `graduation-clearance` (accepted,
holding pack 0.28) implements its §1.2b transcription; and `pack-population-provenance` now
**claims** the `citable_text` member for [[D268]] (the [[D171]] `provenance_note` residue remains
unclaimed). Two documents still move one register-less vocabulary — the collision is now named,
not observed-in-flight.

A version that moves between a document being drafted and being read is not an unusual event in
this repo — `planning/rfc-drafting-queue.md` opens by recording that the tree moved under it *"for
the fourth time in three days"*, and it moved twice more before this RFC was written. **That is
the condition this RFC is designed for**, and it is why the landed half must be derived rather
than transcribed: a transcribed number is correct only until someone else commits. The false
record above is the same lesson one level up: **an observation of the working tree is not a fact
about the tree**, and this document now carries only facts re-derived at a named commit.

**Resource 4 is new.** The drafting queue names five resources; there are six. The
principle-entry schema is a shared versioned resource with a consumer
(`apps/server/src/principle-validation.ts`), a named claimant in the pack register's 0.26 row
(*"resolves against the official principle-entry 0.1 registry"*), and it is **the only one of the
four schema constants with no test binding it to its `$id`**: `drill-pack.test.ts:64`,
`shape-entry.test.ts:33` and `drill-run.test.ts:116` each pin their constant (the `$id` pins sit
beside them); `packages/schema/src/` contains no `principle-entry.test.ts` — re-verified at
`29498ba`. It is unregistered *and* unasserted. This finding is now ledgered as **[[D504]]**
(open), and the owner has ruled on Q1 below that its register section ships with this RFC.

### The four measured failures, each at the symbol

**F1 — two documents advertised held lanes for content that already shipped ([[D497]] —
CLOSED 2026-08-20; the class immediately recurred one lane up.** At drafting, `rfc/README.md`
listed pack **0.23** (`engine-leverage.md`) and **0.24** (`vocabulary-wiring.md`) as *implementing*
while `DRILL_PACK_SCHEMA_VERSION` was **0.27** and their content was in the tree:
`$defs/engineCondition` at `schemas/drill_pack.schema.json:1001` with
`properties.guard.conditions[]` referencing it at `:107`; the `plan_signature` leaf at
`drill_pack.schema.json:555` **and** `shape_entry.schema.json:84`, both landed at `caa8afa`;
`searchBound` in `drill_run.schema.json`; and migration **21** landed as
`{version: 21, name: "engine leverage run schema"}` (`apps/server/src/storage.ts:2350`).

**How it resolved matters, because it corrects this section's own framing.** The A0 active-RFC
truth audit (2026-08-20) put both documents through an independent clean-tree closeout and
archived them; `rfc/README.md:71-72` are now **landed rows** (*"implemented 2026-08-20
closeout"*). And the audit re-derived what this RFC had called an *unsatisfiable acceptance
criterion* (`rfc/archive/engine-leverage.md:1289-1291`, requiring pack `"0.23"` / run `"0.16"` /
`STORAGE_VERSION` 21): **the criterion was satisfied at its own landing commit `18d2832`, and
later schema evolution does not make a landing invariant fail retroactively** ([[D505]] ✅). The
defect was never in the criterion — it was in the register still advertising the lanes as held,
which is this RFC's thesis stated back at it.

**Closed by hand once, the class recurred within a day at `29498ba`, unnoticed by anything:**
the pack register's hand-written row `rfc/README.md:77` still reads *"0.29 is the next free pack
lane"* while `pack-population-provenance` claims **0.29** (its §Active row, `:16`) — and neither
that claim, nor its `citable_text` member claim, nor `measurement-records`' shape-entry **0.4**
claim, nor either live migration-position claim has a register claim row anywhere. A reader who
trusts the register today claims 0.29 and collides. **The same failure, third instance, still
with no reader** — which is why the fix is a check, not another correction.

**F2 — a lane moved with nothing to notice ([[D498]], [[D376]]) — still open at `29498ba`.**
`shape_entry.schema.json`'s `$id` is `urn:chess-tabiya:schema:shape-entry:0.3`. The last
*recorded* shape-entry change is **0.2**, recorded not in a shape-entry register but as a clause
inside the *pack* register's 0.13 row (`rfc/README.md:62`, `archive/predicate-wave-2.md`). The
0.2→0.3 move was made by `vocabulary-wiring` at `caa8afa`, and `vocabulary-wiring`'s register
row (`:72`) — even now that it is a landed archive row — records only the pack facts.
`measurement-records`' claim of shape-entry **0.4** is therefore correct **by luck**: nothing
compared it to anything, and the A0 audit that fixed F1 did not touch this because there is
still no shape-entry register to fix.

**F3 — the register contradicted itself inside four lines ([[D461]]).** **Verify first, and it
verifies clean: this row is fixed. Close it.** Re-verified at `29498ba`: `rfc/README.md:11`,
`:12` and `:76` read 0.28 as claimed and held by `graduation-clearance` (now accepted), and no
0.28 contradiction survives. [[D472]] (the partial fix) is already ✅ (column 1,
`design/BACKLOG.md:306`); **D461 still reads 🐞 in column 1 at `:325`** and is discharged by
this verification, not by work. But note what the surviving `:77` next-free row did while D461
sat verified-fixed: it went stale **again**, against `pack-population-provenance`'s 0.29 claim
(F1 above). This RFC's §4 removes the *shape* that produced both instances — see F3's lesson
below.

**F4 — drafts carry stale version literals ([[D384]], [[D423]], [[D447]]).** D384's own row
(`design/BACKLOG.md:392`) states *"HEAD is 22"*; `STORAGE_VERSION` is **23**. The row is stale in
the direction that flatters the register. [[D423]] and [[D447]] record the same defect one level
up: three documents held one migration position, `opponent-contracts` landed 23 at `6ba0736` and
left the ladder, and **the register could not see the contest shrink** because it has no row for a
position at all. At `29498ba` the ladder is `teacher-surface` → `learner-rating` — recorded
nowhere but in two §Active-row prose cells, with nothing in the tree or the migration register
enforcing the order. *(This paragraph originally claimed the order was "enforced by a foreign
key" on `cohort_standings` — that table is `learner-rating`'s unlanded specification, and
`grep cohort_standings apps/server/src/storage.ts` returns nothing at HEAD. Corrected 2026-08-21;
the corrected fact is worse for the status quo and better for this RFC.)*

**One row is also materially wrong and is worth stating**, because this RFC is built on it:
[[D376]]'s text (`design/BACKLOG.md:395`) asserts *"Pack schema, run schema and migrations each
have a register in `rfc/README.md`"*. **There is no run-schema register.** The row is right about
its subject and wrong about its premise; a ledger row is a claim about the past, and this one has
a false clause in it (the row now carries its own correction note, appended 2026-08-16).

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
verbatim my argument.** `rfc/graduation-clearance.md` criterion 13 (`:2859-2862`) specifies a test
that imports `EVIDENCE_KINDS` from `apps/server/src/sourcing/types.ts` and asserts it is set-equal
to the `clearance.recordKind` enum it transcribes into the pack schema, and says why:

> Asserting a literal seven-item list on the schema side alone would pass while a new evidence
> kind silently became unexpressible in a clearance, which is the failure this criterion exists
> to catch.

That is a copy of a shared vocabulary asserted equal to its source in the tree. **This RFC
generalises exactly that mechanism from one vocabulary to all six resources.** It is not a new
idea being introduced; it is an accepted idea being applied where it was needed first.

**And that precedent is itself a live collision this RFC would catch — now by declared claim
rather than by (falsely) observed transcription.** *(This paragraph originally reported the
transcription as already present in the working tree; that observation was a false record,
retracted as [[D506]] — see §The measurement.)* At `29498ba` the collision stands as two
commitments: `graduation-clearance` is **accepted** and its §1.2b will transcribe the shipped
`EVIDENCE_KINDS` into `clearance.recordKind`'s enum at implementation, with criterion 13
asserting set-equality; `pack-population-provenance` (RFC-5, drafted 2026-08-17) **claims the
`citable_text` member** for [[D268]] (the [[D171]] `provenance_note` residue remains open and
unclaimed). **Two documents move one closed vocabulary that has no register and no version
identifier.** If RFC-5 lands first, criterion 13 fails at `graduation-clearance`'s
implementation with no warning to either author; if it lands second, the JSON enum silently
disagrees with the constant until that criterion runs. That is the entire thesis of this RFC, in
a resource nobody registered — and under §4 the member claim finally gets a row two claimants
can collide on visibly.

### §3 — The claim declaration

Every RFC body carries **exactly one** fenced block with the info string `tabiya-claims`,
**placed immediately before `## Summary`** — after the metadata header, before the first `---`
rule that precedes the summary. This placement is **ruled** (owner, D648, 2026-08-21: *"Fixed
metadata block immediately before `## Summary` — one unambiguous parser/reader location"*, Q2
below) and C1's locator accepts no other position. One claim per line; three `|`-separated
fields; comments begin `#`.

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
ambiguous between *claims nothing* and *forgot to say*; a present `none` is not. Censused at
`29498ba` over the ten §Active rows (nine excluding `0000-rfc-process.md`): **four would write
`none`** — `assistance-controls`, `rfc-lifecycle-completion`, `feedback-delivery` (all three say
*"claims nothing versioned"* in their register rows, `rfc/README.md:14`, `:15`, `:18`) and this
RFC, which already carries the block. **Five would declare claims, seven claim lines between
them**: `teacher-surface` (one migration position), `graduation-clearance` (pack 0.28),
`measurement-records` (shape-entry 0.4), `learner-rating` (migration position, **two** claim
lines per §5.1) and `pack-population-provenance` (pack 0.29 **and** the `citable_text`
evidence-kinds member — two lines).

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

**The `principle-entry-schema` section ships now, with a landed row for 0.1 and an empty claim
table — ruled** (owner, D648, 2026-08-21, resolving Q1 as proposed: *"it is the only versioned
schema whose constant is not test-bound to its `$id` [[D504]]; four lines buy coverage before a
claimant appears"*). This is the one deliberate exception to §1's grow-by-claim rule, and the
exception is the ruling's to make: C4 covers the resource most likely to drift silently from the
day this lands, instead of from the day someone first wants it.

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
| **C2** | For each schema resource, every live `lane X` satisfies `X` **strictly greater than** the tree head. | A document's content ships and its claim is not withdrawn. *Was red at drafting on `engine-leverage` 0.23 and `vocabulary-wiring` 0.24 against 0.27 (F1); the A0 audit cleared it by hand 2026-08-20 — green at `29498ba`, guarded by nothing until this lands.* |
| **C3** | No two live claims name the same resource **and** the same lane; and every register claim row has a matching declaration in the named RFC's block, and conversely. | Two drafts pick one number (the original 0.6 collision that instituted the pack register); or a register row and an RFC body disagree about what is held. **Red at `29498ba` once blocks exist**: four live claims — pack 0.29, shape-entry 0.4, `citable_text`, and `learner-rating`'s second migration line — have no register claim row (F1's recurrence). |
| **C4** | (a) The tree head of each resource has a landed row naming a document. (b) **No landed row at or below the tree head advertises a held or claimed lane.** | (a) A version moves with no register row. **Red at `29498ba`**: shape-entry 0.3, last recorded 0.2 (F2). (b) A shipped lane still reads as held. *Was red on the 0.23/0.24 rows; those are landed rows since 2026-08-20 — green today.* |
| **C5** | No `migration` claim line contains a bare integer. | A drafter writes `migration 24` instead of a position ([[D423]]). |
| **C6** | Each register's head line equals the tree constant it names; and no register section contains a hand-written next-free row. | A head line goes stale (F4); or someone reintroduces the row that produced F3. |

**Wiring.** `register-check` joins `verify` (`verify: typecheck test schema-check
register-check` — the current recipe is `typecheck test schema-check`, re-verified in the
`Makefile` at `29498ba`). It is a **one-stage landing**, unlike the staged shape
`planning/WORK.md` prescribes for `make work-index`, and the difference is measured rather than
assumed: D487's territory spans **355 open ledger rows** (its 2026-08-20 refresh; the derived
work register remains unbuilt), which cannot be fixed in a landing commit; this one is red on **a
handful of register facts**, all of which are register edits in the landing commit. A gate that
is green the day it lands is worth more than a reporting target nobody reads.

**What the landing commit must correct to reach green** — re-derived at `29498ba`, and no more:

1. A shape-entry landed row for **0.3**, owner `vocabulary-wiring`, landed at `caa8afa` — it
   ships inside the new shape-entry section (F2).
2. The hand-written next-free row (`rfc/README.md:77`) is deleted with the other next-free rows
   per §4 — it is stale a second time, naming 0.29 while `pack-population-provenance` claims it.
3. Claim rows for the live claims that have none: pack **0.29** and `citable_text`
   (`pack-population-provenance`), shape-entry **0.4** (`measurement-records`), and the two
   migration positions (`teacher-surface`, `learner-rating` — the latter with **two** claim
   lines per §5.1). Pack 0.28's existing row (`:76`) converts to the new claim-table shape.
4. `tabiya-claims` blocks for the §Active documents that lack one, per criterion 3's census.

*(The drafted version of this list also corrected the 0.23/0.24 held-lane rows and required
`none` blocks for `engine-leverage` and `vocabulary-wiring`; the A0 audit of 2026-08-20 archived
both and landed their rows, so those items are done and gone.)*

**Explicitly not corrected here:** anyone's lifecycle status. That is a lifecycle act and
belongs to RFC-2 or to the owner; this RFC records the tree's facts without deciding a status.
The `engine-leverage` criterion this RFC once proposed to ledger as unsatisfiable resolved the
other way — satisfied at its own landing commit, [[D505]] ✅, see F1.

### §7 — Boundaries, stated rather than left implicit

**`make status-parity` ([[D477]]) — does not belong to this RFC, and should not.** It compares an
RFC body's `**Status:**` line to its `rfc/README.md` §Active status cell. That is *lifecycle*
state, not shared-resource state; a wrong status blocks an implementer, a wrong lane corrupts a
landing order. `planning/WORK.md` §0 has it queued as implementation and that is right — a script
comparing two strings changes no contract and law 1 does not gate a lint.

**Two things it is owed, and they come from two different documents.** From RFC-2: a state
vocabulary. I ran the parity check by hand across all §Active rows, twice — ten rows at drafting
HEAD and, with different membership, **ten rows again at `29498ba`** — and both times **nine
agree on their leading token** with the same single disagreement: `measurement-records.md`'s
body reads `- **Status:** draft` while its register cell reads *"returned to author
2026-08-16"*, and *returned to author* is not one of the six states in `rfc/0000-rfc-process.md`
§RFC lifecycle. (The drafting queue reports 8 of 9; RFC-2 reports 11 of 12 at its own drafting
HEAD; every measurement finds the one identical row. The counts differ only in table membership.)
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
   verbatim (numbered per RFC-2 §9.1's seam if it lands first), and §RFC lifecycle is
   byte-identical across this RFC's landing commit.**
   *Fails if:* the criterion is paraphrased into something unbounded (*"anything shared"*), which
   would put every exported constant in the register; or if the edit strays into §RFC lifecycle
   and collides with RFC-2. (Rewritten 2026-08-21: the original pinned §RFC lifecycle to its
   bytes at `4a6ad91`, which becomes unsatisfiable the moment RFC-2 legitimately lands first —
   the invariant was always *this commit does not touch that section*, so it now says that.)

2. **`rfc/README.md` contains six register sections, each with exactly one head line matching
   `<!-- register: <name> head=… -->` (or `members=…` for `evidence-kinds`), and no section
   contains a next-free row.**
   *Fails if:* a section is added with prose head text instead of the machine-readable line —
   which would parse as absent and make C6 vacuous; or if a helpful next-free row is left in,
   reintroducing F3.

3. **Every RFC named in `rfc/README.md` §Active except `0000-rfc-process.md` carries exactly one
   `tabiya-claims` block in §3's ruled position (immediately before `## Summary`); the **four**
   that claim nothing versioned carry `none` rather than omitting it, and the **five** that
   claim carry **seven** claim lines between them (§3's census; §5.1).**
   Count the blocks against the §Active row count, not against `ls rfc/*.md`, and **re-census at
   landing** — these counts moved once already (5/4/5 at drafting → 4/5/7 at `29498ba`).
   *Fails if:* the implementer treats an omitted block as equivalent to `none` — the exact
   ambiguity §3 exists to remove; if a block sits anywhere but the ruled position (one in-flight
   draft, `pack-population-provenance`, stages its block inside a body section §8 and must
   relocate it when carried at landing); or if the file-glob is used and picks up `README.md` and
   `template.md`, giving 12 where §Active gives 10 (both numbers re-verified at `29498ba`).

4. **`make register-check` exists, is listed in `.PHONY`, and is a prerequisite of `verify`.**
   *Fails if:* the target is added but not wired into `verify`, leaving a checker nobody runs —
   the [[D450]] shape (a rule in a document no test reads) reproduced in a Makefile.

5. **`make register-check` exits zero at the landing commit**, and the corrections of §6's
   landing list are in that same commit.
   *Fails if:* the checks are weakened to pass instead of the facts being fixed — at `29498ba`
   the checks red on real facts are C4(a) (the unrecorded shape-entry 0.3) and C3 (four live
   claims with no register row), so those are the ones most likely to be softened. (At drafting
   the exposed check was C4(b), red on the 0.23/0.24 held-lane rows; the A0 audit fixed those
   facts by hand — the check stays, unweakened, as the guard against the fourth instance.)

6. **Each of C1–C6 has a test that makes it fail.** For every check, a fixture in which the
   assertion is violated and the checker exits non-zero, plus one in which it passes.
   *Fails if:* only the passing direction is tested. Two of these checks are joins, and a join
   whose key matches nothing passes silently — [[D444]]'s census defect. **C3's negative fixture
   must contain at least two live claims**, because an equality over a singleton set holds
   trivially and would pass while measuring nothing.

7. **The derived next-free lane is printed for all six resources and is correct against a
   hand-derivation recorded in the planning log.** At committed HEAD `29498ba` that is: pack
   **0.30** (head 0.27, 0.28 held by `graduation-clearance`, 0.29 held by
   `pack-population-provenance`); run **0.18**; shape-entry **0.5** (head 0.3, 0.4 held by
   `measurement-records`); principle-entry **0.2**; migration **position behind
   `teacher-surface` → `learner-rating`**, integer taken at landing; evidence-kinds
   **n/a — a member name, not a number** (`citable_text` held by `pack-population-provenance`).
   *Fails if:* the checker reports pack next-free as **0.28** — which is what a purely
   tree-derived implementation returns, and is the §2 error this RFC exists to argue against; or
   if it prints an integer for `migration`, breaching [[D423]].
   **Re-derive at landing, do not trust this list.** This list has already moved once between
   drafting and refresh — pack next-free went 0.29 → 0.30 when RFC-5 claimed a lane — which is
   the demonstration that a printed list in a document is exactly the artifact §4 refuses to
   store. The criterion is that the printed value equals a fresh hand-derivation **at the
   landing commit**, not that it equals the six values printed above.

8. **`tools/register-check.mjs` re-derives every version and member list from the tree and
   hard-codes none of them.** A grep of the script for the literals `0.27`, `0.28`, `0.17`,
   `0.3`, `0.1`, `23` and the seven `EVIDENCE_KINDS` member names returns nothing outside test
   fixtures.
   *Fails if:* the implementer pins a literal for convenience, which reproduces the defect being
   fixed **inside the fix** — the checker would then go stale on the first bump and report green.
   The concrete instance: `graduation-clearance` is accepted and holds pack 0.28, so the head
   can move 0.27 → 0.28 at any moment between this RFC's refresh and its landing; a checker
   pinned to either number is already wrong.

9. **No shared resource moves.** `DRILL_PACK_SCHEMA_VERSION`, `DRILL_RUN_SCHEMA_VERSION`,
   `SHAPE_ENTRY_SCHEMA_VERSION`, `PRINCIPLE_ENTRY_SCHEMA_VERSION`, `STORAGE_VERSION`,
   `EVIDENCE_KINDS` and all four `schemas/*.json` `$id`s are byte-identical before and after.
   *Fails if:* the shape-entry 0.3 row of §6 is mistaken for a licence to bump shape-entry, or
   the `evidence-kinds` register is read as a licence to add a version field to
   `EVIDENCE_KINDS` — §4 refuses that explicitly.

10. **The ledger rows are flipped in the landing commit** ([[D376]], [[D385]], [[D423]],
    [[D447]], [[D384]] register-half, [[D498]], [[D499]], [[D504]] register-half), and
    **[[D461]] is flipped on this RFC's verification with no work attached**.
    *Fails if:* D461 is left open — it is discharged, re-verified at `4a6ad91` and again at
    `29498ba`, and a criterion that tells an implementer to flip a row that is already flipped
    is the first standing hazard; this one is the inverse and equally real. Also fails if
    [[D384]]'s **collision half** is flipped (only its register half is in scope; its collision
    half is superseded by [[D423]]/[[D447]]), or if [[D504]] is flipped **whole**: this landing
    registers the principle-entry schema and does not write the missing
    `principle-entry.test.ts` — the test half stays open and named, because closing a row on a
    document that took half of it is how a row dies unfixed. **[[D497]] is no longer in this
    list**: the A0 audit closed it 2026-08-20 (verified ✅ in column 1 at `29498ba`), and
    flipping an already-flipped row is the hazard this criterion polices.

---

## Discharges

none

*(Section per `rfc/rfc-lifecycle-completion.md` §3.1, carried before that RFC lands for the same
reason it carries this one's block: each document demonstrates the other's mechanism on itself.
Everything this RFC obliges is executed by its own landing commit; nothing survives `accepted`
for another party to discharge.)*

---

## Open questions

**Q1 — Does the `principle-entry-schema` register earn its section today?
✅ ANSWERED — YES (owner ruling 2026-08-21, [[D648]]).** The ruling, as recorded in
`planning/platform-alignment/intent-amendment-handoff.md` §Process-RFC owner rulings:
*"**APPROVED — Yes.** It is the only versioned schema whose constant is not test-bound to `$id`;
four lines buy coverage before a claimant appears."* The proposed resolution stands as proposed:
the section ships with a landed row for 0.1 and an empty claim table, and §4 now states it
normatively. The original question is kept below the line for the record: it satisfied §1's
criterion (a) and (c) but failed (b) — no in-flight draft claims it and its version has never
moved — so by rule 7's own logic it would otherwise enter the register only on first claim.

**Q2 — Where does the `tabiya-claims` block sit in an RFC body?
✅ ANSWERED — immediately before `## Summary` (owner ruling 2026-08-21, [[D648]]).** The ruling:
*"**APPROVED — Fixed metadata block immediately before `## Summary`.** One unambiguous
parser/reader location."* §3 now states the placement normatively, this document's own block
demonstrates it, and criterion 3 enforces it — including on `pack-population-provenance`, whose
staged block currently sits in its §8 and must move to the ruled position when carried at
landing. The alternatives considered (a `## Shared resources` section near the specification)
are recorded here and refused by the ruling.

**Q3 — Should the check refuse a claim by a `withdrawn` or archived RFC?**
Once RFC-2 defines the state vocabulary, a claim held by a withdrawn document is detectable and
should be released automatically. Today the states are not defined ([[D500]]), so C2/C3 read
§Active membership as the liveness signal, which is sound but coarse. **Deferred to
`rfc-lifecycle-completion`**, which owns the vocabulary — and which has since **split the answer
in two** (its §9.1): the *owner-of-an-obligation* case is answered there by its §3.4 and P6,
while the *holder-of-a-lane* case remains this RFC's, gained by the checker when RFC-2's
vocabulary lands. Not among the five D648 rulings; still open, still deferred, and named so it
is not rediscovered.

**Ledger disposition of this RFC's proposed rows — reconciled 2026-08-21 at `29498ba`.** The
rows this section proposed at drafting landed under shifted ids, and two have since resolved:

- The *sixth shared resource, unregistered and untested* finding landed as **[[D504]]** (open;
  this RFC's landing discharges its register half only — criterion 10).
- The *`engine-leverage` unsatisfiable criterion* finding landed as **[[D505]]** and was
  **closed 2026-08-20 the other way**: the A0 audit re-derived that the criterion was satisfied
  at its own landing commit `18d2832`, and a landing invariant does not fail retroactively. This
  RFC's F1 carries the correction.
- The *two-copies-of-`EVIDENCE_KINDS`* finding landed as **[[D506]]** and was **RETRACTED
  2026-08-17 as a false record** — see the correction in §The measurement. What survives is
  [[D499]] plus the now-declared `citable_text` claim.
- The *WORK.md-says-six / D477-says-five* counter discrepancy **never landed a row and is still
  live at `29498ba`**: `planning/WORK.md` §0 reads *"Six instances"* and [[D477]]'s row title
  reads *"FIVE times"*. Proposed as **D652** (ids through **D651** are in use): two
  hand-maintained documents, one incrementing counter, written a day apart — the defect class of
  this RFC appearing in the very file that queues the fix for it. Described here, deliberately
  not written.

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
- 2026-08-21: **owner answers recorded and full refresh at HEAD `29498ba`** (author pass per
  [[D648]]; the amendment `30d1d53`, the D649 descope and Feedback Stage 1 `a64e6c5` all landed
  since drafting — this RFC references no external-participant work, checked against D649).
  **Q1 answered YES** (principle-entry register ships now — §4) and **Q2 answered** (block
  immediately before `## Summary` — §3, demonstrated by this document's own block). Facts
  refreshed, in both directions: **the 2026-08-16 changelog entry above records what was in
  fact a false observation** — the pack 0.28 bump was never committed (pack is **0.27** at
  `29498ba`) and the `EVIDENCE_KINDS` copy never existed; its ledger row [[D506]] was retracted,
  and §The measurement now carries the correction in place of the claim. **F1 closed the other
  way** — the A0 audit (2026-08-20) archived `engine-leverage`/`vocabulary-wiring` ([[D497]] ✅)
  and re-derived their criterion as satisfied at its own landing commit ([[D505]] ✅) — **and
  the class recurred within a day**: the next-free row names 0.29 while
  `pack-population-provenance` claims it, with no register row anywhere for that claim,
  `citable_text`, or shape-entry 0.4. Census updated (4 `none` / 5 claiming / 7 claim lines over
  10 §Active rows); derived next-free list updated (pack **0.30**); criterion 1 made
  landing-order-safe; criterion 10's flip list reconciled (D497 out, D504 register-half in);
  proposed rows reconciled against the ledger (propose from **D652**). Parity re-run: 9 of 10
  tokens agree, same single `measurement-records` row. A `## Discharges` section (`none`) and
  this document's own `tabiya-claims` block added, each demonstrating the mechanism of the
  companion document.
