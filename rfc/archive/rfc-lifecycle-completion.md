# RFC: RFC lifecycle completion — the transitions between documents

- **Status:** implemented 2026-08-21
- **Author:** claude
- **Created:** 2026-08-17
- **Design refs:** **None, and the absence is deliberate.** This RFC specifies repo process,
  not product surface. Its normative homes are `rfc/0000-rfc-process.md` §RFC lifecycle,
  §Rules and §Planning docs & the job log, plus `rfc/template.md` and the §Active table of
  `rfc/README.md`. Citing a `design/` section here would be a fabricated citation — the
  cheapest form of the standing hazard *a closure citing a ruling that says the opposite*.
- **Exploration gate:** opened by the owner ruling of 2026-08-12, logged in
  `planning/exploration/log.md` and recorded at `rfc/README.md:95-97`: E1 met, E2 advisory,
  E3/E4/E5 accepted as in-flight risk. This RFC claims nothing versioned and specifies no
  product behaviour; every row it discharges is a ledgered defect with a named artefact, not
  an open question, so law 1's *"no RFC from a GAP row"* does not bind it.
- **Depends on:** nothing unlanded. **Coordinates with `rfc/archive/shared-resource-registers.md`
  (RFC-1, implemented)**, which amends `rfc/0000-rfc-process.md` §Rules and explicitly defers the
  lifecycle vocabulary here (its §7 and Q3). Two documents editing one file in two sections
  is a merge, not a collision; §9 states the seam from this side.
- **Parent / amends:** amends `rfc/0000-rfc-process.md` **§RFC lifecycle**, **§Rules** and
  **§Planning docs & the job log**; amends `rfc/template.md`; specifies one cell edit and one
  header note in `rfc/README.md` §Active. The full list is §9.2.
- **Supersedes / superseded by:** —
- **Planning:** `planning/archive/rfc-lifecycle-completion/`

**Shared-resource claims: none.** No pack lane, no run lane, no shape-entry lane, no
principle-entry lane, no migration position, no vocabulary member. Verified at HEAD `68098e5`
and re-verified unchanged at `29498ba` (2026-08-21) by opening the symbols:
`DRILL_PACK_SCHEMA_VERSION` **0.27**, `DRILL_RUN_SCHEMA_VERSION` **0.17**,
`SHAPE_ENTRY_SCHEMA_VERSION` **0.3**, `PRINCIPLE_ENTRY_SCHEMA_VERSION` **0.1**,
`STORAGE_VERSION` **23** (`apps/server/src/storage.ts:407`), `EVIDENCE_KINDS` seven members.
This RFC moves none of them. The block below is carried now, in RFC-1's ruled position
(immediately before `## Summary`, per the owner answer to its Q2 — [[D648]]), inert until that
RFC's checker lands:

```tabiya-claims
none
```

---

## Summary

This repo has **three protocols for completing work** — the RFC archive, the ledger flip, and
the content-wave closeout — and **none for the transitions between documents**. Finishing X can
make Y actionable, or leave Y's obligations ownerless, and in both cases nothing tells Y. The
measured results are `rfc/README.md` holding a stale block for three hours on the item it
itself called the highest unowned product value ([[D433]]), a specification that had to invent a
two-stage landing inside its own body because the lifecycle had no state for it ([[D475]]), and
**98 claims of work that a landed owner ruling requires before anyone plays, owned by nobody**
([[D476]]).

The remedy is **one new state and one new section, both admitted under a rule that refuses the
rest**: a state or an obligation earns its place only when a **named reader takes a different
action on it**. Applying that rule admits `awaiting` (three readers act differently), admits a
`## Discharges` table (it is the structured home the prose statements never had), refuses a
`returned to author` state (no reader acts differently — it is `draft` plus a reason, which is
[[D500]]'s whole content and one cell edit), and refuses a state for `engine-leverage`'s
unsatisfiable criterion (RFC-0000 rule 3 already covers it).

Everything here resolves to a named file, symbol, command or commit convention, and **the
reader of every obligation is the already-queued `make status-parity`** ([[D477]],
`planning/WORK.md` §0). This RFC writes no checker; it writes the six checks that instrument
consumes, and it names the file they land in.

---

## Motivation

### The through-line, stated once

**Finishing X does not notify Y.** Three faces, all ledgered, all with named artefacts:

| Row | Face | The artefact |
|---|---|---|
| [[D433]] | **unblocking** | `rfc/README.md`'s `feedback-delivery` cell asserted an owner block that had already dissolved |
| [[D476]] | **un-owning** | `claim-backing` was named as the binding wave's owner, then archived |
| [[D475]] | **completing in halves** | `feedback-delivery` invented a two-stage landing inside one document because `implementing → implemented` could not hold it |

They are one gap seen from three sides, which is why one amendment carries all three and three
amendments would each restate the same lifecycle table.

### F1 — the unblocking, re-derived from git rather than from the row

[[D433]]'s row says the stale block stood *"for a day"*. I walked the commits at HEAD `68098e5`
and the true shape is **worse than the row and closer to fixable than the row implies** `[V]`:

- **`5b65048`** (*"docs: archive claim backing lifecycle"*, 2026-08-16 14:58:11) moved
  `rfc/claim-backing.md` → `rfc/archive/claim-backing.md`, deleted its §Active row, corrected
  its pack-register row to 0.26 implemented, flipped 40 lines of `design/BACKLOG.md`, appended
  to `planning/exploration/log.md`, and **edited `rfc/feedback-delivery.md`** — one line,
  correcting `rfc/claim-backing.md` to `rfc/archive/claim-backing.md`.
- The same commit **had `rfc/README.md` open**, and left the `feedback-delivery` cell reading
  *"revised 2026-08-15 — OWNER-BLOCKED on the C6 fork … Cannot be accepted until the owner
  rules the withhold/deliver fork."*
- **`532c7e2`** fixed it at **18:04:59** — **3 h 06 m later**, in a different agent's session.

Two things follow, and both shape the specification. First, **the closeout was one line away in
a file the archiving commit already edited**: this is not a discipline problem an exhortation
fixes, it is a missing clause in the one paragraph an archiver reads. Second, **`532c7e2`'s own
fix was partial in exactly the same way**: it rewrote column 2 to *"UNBLOCKED 2026-08-16"* and
left column 4 ending *"Cannot be accepted until the owner rules the withhold/deliver fork"* —
**the block and its lifting in one row, in one commit** `[V]`. A prose fix repairs the sentence
someone happened to read. That is the argument for structure over exhortation, and it is
written in the repair itself.

### F2 — the un-owning, at the symbol

`rfc/archive/claim-backing.md:1725` reads, verbatim and at HEAD:

> | **Open question 5** (*who owns D97, and is the binding wave a content wave?*) | **answered.**
> This RFC owns it; the wave is content **plus** the two instrument runs of §4's Bucket 2 |

The archiving diff of `5b65048` against that file changed **exactly two lines** — `Status` and
`Planning` `[V]`. So the sentence survived archiving untouched, and **the only extant statement
of who owns the binding wave is inside a frozen document, naming itself.** RFC-0000 rule 3
makes an archived RFC immutable; the claim cannot even be corrected where it lives.

**The root cause is a section contract, not carelessness.** Ownership of the wave was recorded
in an **Open question**, and `rfc/template.md` defines that section as *"Resolved before
`accepted`, or explicitly deferred to a listed future RFC."* An open question is a thing you
close. Closing OQ5 therefore **deleted the ownership rather than transferring it**, and
`feedback-delivery` §5.8 records the other end of the same act (*"Open question 5 is
**answered**"*). The repo had no section whose contract is *"this survives acceptance and
blocks completion"*, so the obligation was filed in the one section guaranteed to stop being
read.

**And the repo is now very good at recording that nobody owns it.** Five documents say so at
HEAD `[V]`: the [[D476]] row, `rfc/feedback-delivery.md` §0.2, that RFC's Open questions,
`planning/WORK.md` §3 (*"Nobody owns it"*), and `planning/codex-queue.md` §0c (*"Stage 2 has no
owner and cannot start without one … commissioning it is claude's to arrange"*). **Five prose
statements, zero owners.** Prose is where this repo puts a fact it cannot act on.

### F3 — completing in halves, and it is not one document's special case

[[D475]] is filed as `feedback-delivery`'s shape. I read all twelve §Active rows and their
bodies at drafting HEAD `68098e5`; **four of the twelve carried an obligation that is outside
the RFC's own code, recorded only in prose, and unreadable by any instrument** `[V]`.
Re-read at `29498ba` (ten rows), **three remain**:

| RFC | The outstanding obligation | Where it is recorded today | Owner today |
|---|---|---|---|
| `feedback-delivery` | the binding wave — 98 claims, 63 mandatory pack edits, two instrument runs; **stage 1 landed at `a64e6c5` (2026-08-21), so this is now the only thing between the RFC and `implemented`** | §0.2, an Open question, three planning files | **none** (archived) |
| `learner-rating` | six changes owed to `design/06-campaign.md`, law 5 (`design/06` was untouched by the `30d1d53` intent amendment, which stopped at `02`–`05`) | §5.3a and its register cell | **OWNER**, unaddressed |
| `teacher-surface` | three edits owed to `live-marker-quality` at landing, one of them a change to the recorded terms of an owner ruling | one cell of a table in §11 | self, at landing |

The fourth, `dead-vocabulary` (*"archival waits for independent review"* — owner unnamed),
**resolved between the two measurements, and how it resolved is evidence on both sides**: the
independent review ran and it archived 2026-08-20 at `b8e3649` (*"docs: close four completed RFC
lifecycles"*; `329c62b`, which this document previously cited here, is its 2026-08-16
*implementation* commit — the frozen status line names both, and conflating them is itself the
findability defect this paragraph describes, now ledgered as [[D654]]) — the obligation was
discharged, not dropped — but the only record of the discharge is a clause in its now-frozen
`**Status:**` line, findable by a reader who already knows to look. That is precisely the record
§3 gives a table and a sha. And the population did not merely shrink: `pack-population-provenance`, drafted
2026-08-17, **already carries a `## Discharges` section citing this RFC's §3.1** with two owned
rows — the mechanism has an adopter before it has landed.

A shape that occurred in one third of the drafted table and holds **three of ten** at the
refresh is a lifecycle gap, not a document's improvisation. It is also **not specific to content
waves**: a design-tier edit under law 5 and a cross-document correction are the same structure —
*the specified surface is done and something the RFC does not execute must happen before it can
complete.*

### F4 — the state vocabulary, measured by hand

I ran the parity check by hand over all **12** §Active rows at drafting HEAD `68098e5`, and
again over the **10** rows at refresh HEAD `29498ba`, comparing each register cell to its
body's `**Status:**` line `[V]`:

- **11 of 12 differed byte-for-byte at drafting; 9 of 10 differ at the refresh.** Only
  `0000-rfc-process.md` matches, both times, because its cell is the bare word `accepted`. Every
  other cell and most bodies carry a dated headline and a paragraph of review history.
- **11 of 12 agreed on their leading token at drafting; 9 of 10 agree at the refresh** after
  stripping `**`. The single disagreement is the same row both times:
  `measurement-records.md` — body `draft`, cell `returned to author 2026-08-16` — and *returned
  to author* is not one of the six states RFC-0000 defines. That is [[D500]], and it is stable
  across four measurements: `planning/rfc-drafting-queue.md` found it at 8 of 9, RFC-1 at 9 of
  10, this RFC at 11 of 12, the refresh at 9 of 10 — one identical row every time, with the
  counts moving only as table membership moves.

**Those two numbers are the whole reason `make status-parity` cannot be written yet, and the
row understates it.** [[D477]] prices the instrument at *"one grep"*. A grep comparing the two
strings reports **11 failures, 10 of them spurious**; a grep comparing leading tokens reports
**1 failure and it is the real one** — but only if a rule says the leading token is the state
and the rest is prose. **The blocker is not a missing word in a vocabulary. It is a missing
grammar**, and no amount of care in writing the checker substitutes for it, because without the
rule the checker's author must invent one and every future cell author must guess it.

### What this costs, priced before it is proposed

The repo has a measured allergy to ceremony, and the content-wave closeout is the calibration:
one commit's discipline against one duplicated wave. Priced honestly:

| | One-time | Per RFC | Per event |
|---|---|---|---|
| the seventh state | 3 lines in `rfc/0000-rfc-process.md` | — | — |
| the cell grammar | 1 cell edit + 2 lines of header note in `rfc/README.md` | — | — |
| `## Discharges` | 10 sections at `29498ba`: **5 read `none`**, 5 carry **6 rows total** — and 3 sections already exist (`pack-population-provenance`'s two rows, RFC-1's `none`, this RFC's own), so the landing writes **7** | **1 line** (`none`) | 1 row per obligation |
| the archiving clause | 4 lines in §Planning docs | — | one `git grep` at archive time |
| P1–P6 | ~40 lines **of** `tools/status-parity.mjs` (a file the queued instrument creates; it does not exist at `29498ba`) | — | — |

**Net prose: negative.** Five documents currently state that the binding wave has no owner; the
mechanism replaces them with one row that a checker reads, and the five sentences become
optional colour rather than the record.

**And the cost lands on the party holding the information.** The archiving clause bites at the
moment the archiver has the whole picture in their head — which is precisely the moment
`5b65048` had `rfc/README.md`, `rfc/feedback-delivery.md` and `design/BACKLOG.md` open in one
commit and still shipped the stale block.

### Why this scope boundary

**In scope:** the state vocabulary and its grammar, the structured home for an obligation that
survives acceptance, what an archiving commit must clear, and two authoring conventions paid for
in incidents. **Out of scope:** shared-resource registers (RFC-1), the routing invariant
(`make work-index`), writing `make status-parity` itself, and any judgement about a specific
RFC's current status. §9 states each boundary and why it falls there.

---

## Specification

### §0 — The admission rule, stated before anything is admitted

> **A lifecycle state earns its place only when a named reader takes a different action on it.
> An obligation earns its place only when a named reader can see it undischarged.**

This is the rule that keeps the document from being ceremony, and it is applied visibly rather
than asserted. Four candidates were considered; **two are admitted and two are refused**:

| Candidate | Reader test | Verdict |
|---|---|---|
| **`awaiting`** — the specified surface has landed; a named obligation the RFC does not execute remains | **Three readers act differently.** The archiver must *not* move the file; the ledger-flipper must *not* flip its rows; an implementer reading `implementing` today is told there is code work and there is none | **admitted** (§1) |
| **`returned to author`** | The only reader is an implementer asking *"may I build this?"*, and the answer is identical to `draft`. `draft` is defined as *"under discussion; anything may change"* — which is exactly a returned document | **refused** — it is a **disposition**, not a state (§2) |
| **`blocked` / `owner-blocked`** | An implementer acts the same as on `draft` or `accepted`-with-an-obligation. What a reader actually needs is *who* is blocking and *on what* — a name, not a token | **refused**; absorbed by a `## Discharges` row with owner `OWNER` (§3.4) |
| **a state for an RFC whose acceptance criteria cannot pass** (`engine-leverage`, [[D505]] — a premise later corrected: the criterion *was* satisfied at its landing commit, see §8) | No reader is served by a new token: RFC-0000 rule 3 already permits amending a not-yet-implemented RFC in place with a changelog line | **refused** (§8), and events confirmed it — closed 2026-08-20 with zero new machinery |

**The corollary matters as much as the rule: a rule goes where it is read at the moment it
binds.** The archiving clause therefore amends the *"On completion:"* paragraph of §Planning
docs & the job log — the paragraph an archiver actually reads — and **not** §Rules, which is
read when the process is learned and not when it is executed. [[D433]] is a rule that existed
in spirit everywhere and in no paragraph anybody read at 14:58.

### §1 — The seventh state: `awaiting`

`rfc/0000-rfc-process.md` §RFC lifecycle becomes:

```
draft → accepted → implementing → (awaiting →) implemented → (superseded | withdrawn)
```

with one added bullet and one amended bullet:

> - **awaiting**: the surface this RFC specifies has landed, and **at least one obligation it
>   does not itself execute remains undischarged**. An `awaiting` RFC does **not** move to
>   `rfc/archive/`, does **not** flip its `design/BACKLOG.md` rows, and carries **no
>   outstanding code work** — that last is the distinction from `implementing`, and it is the
>   whole reason the state exists.
> - **implemented**: shipped; canonical behavior has been distilled into `docs/`, **every row of
>   the RFC's `## Discharges` section is discharged**, and the frozen RFC has moved to
>   `rfc/archive/`.

**`awaiting` is optional and most RFCs never enter it.** An RFC whose discharges all fall due
*at landing* — `teacher-surface`'s three edits to `live-marker-quality`, for instance — goes
`implementing → implemented` as today, because the landing commit discharges them. `awaiting`
exists for the case where the obligation is a separate act by a separate party over a separate
period. At drafting that was **two** documents; at `29498ba` it is **one, and it is now in the
state's exact shape**: `feedback-delivery` shipped its stage 1 at `a64e6c5` (2026-08-21), has no
outstanding code work, and waits only on the binding wave — while its body and cell both read
`accepted` (verified at `29498ba`) and its §0 declares `implementing` between the stages: either
token tells an implementer there is code to write. (`dead-vocabulary`,
the second case at drafting, discharged its independent review and archived 2026-08-20 —
see F3.)

**Why not reuse `implementing`, which is what `feedback-delivery` does today.** Because the one
reader who acts on `implementing` is the implementer, and the signal it sends them is *there is
code to write*. For `feedback-delivery` stage 2 there is none — the work is 63 pack edits and
two instrument runs. A state that tells its only reader the opposite of the truth is worse than
a missing state; the two-stage landing had to be written into the body precisely to countermand
it, and `planning/codex-queue.md` §0c had to be written to countermand it a second time.

**`awaiting` is never written bare.** Its register cell and its body `**Status:**` line both read
`awaiting` followed by a pointer to the `## Discharges` row that holds it open — see §2's
grammar, and check **P4**.

### §2 — What is not a state: the register cell grammar

This is the clause `make status-parity` is owed, and it is four sentences.

> **The state vocabulary is closed at seven tokens:** `draft`, `accepted`, `implementing`,
> `awaiting`, `implemented`, `superseded`, `withdrawn`.
>
> **Both the RFC body's Status line and its `rfc/README.md` §Active status cell begin with a
> state token**, after stripping Markdown emphasis (`*`, `_`, backticks) and leading
> whitespace. Everything from the first date, em dash, en dash, colon, comma, semicolon or
> parenthesis onward is **prose**, and no checker reads it.
>
> **One machine-read exception, for the one state that points:** when the token is `awaiting`,
> the first `D<n>` token after the separator is the discharge-row pointer and check **P4 reads
> it**; the rest of the line stays prose. Without this carve-out, §1's *"never written bare"*
> and the no-checker-reads-prose sentence contradict each other — the contradiction cross-review
> found, resolved in favour of the pointer because a pointer nothing reads is decoration.
>
> **A review disposition is not a state.** *Returned to author*, *owner-blocked*, *revised*,
> *cross-reviewed*, *ready for implementation*, *pending independent review*, *unblocked* and
> *round N complete* are dispositions. They keep their place — **after** the separator.

**What this costs and what it deliberately does not touch.** It costs **one cell edit**:
`measurement-records.md`'s cell becomes `draft — returned to author 2026-08-16 (core sound; 3
open questions + D391 block acceptance)`. **No information is removed from any cell.** The
§Active table's prose is load-bearing — it carries wave orders, correction history, register
facts and cross-draft warnings that derive from nothing — and this RFC touches none of it. It
constrains **the first word**, and nothing else. That is the entire remedy for [[D500]].

**Why the grammar and not merely the vocabulary.** Adding `returned to author` as an eighth
state would satisfy the vocabulary complaint and leave the checker still unwritable, because
**9 of 10 cells would still differ from their bodies byte-for-byte** (F4, at the refresh count).
The vocabulary was
never the blocker. Conversely the grammar alone, without §1's `awaiting`, would force
`feedback-delivery` to keep lying in its leading token. Both are needed and neither is
sufficient — which is the answer to *"states, obligations, or both?"*: **both, and each is
justified by a reader the other does not serve.**

### §3 — `## Discharges`: the structured home for an obligation that survives acceptance

#### §3.1 The section

Every RFC carries **exactly one** `## Discharges` section, placed after `## Acceptance criteria`
and before `## Open questions`. It contains either the single word `none` or a table —
**commentary may surround either** (RFC-1's section and this RFC's own both carry a note, so the
parse rule must say so): P4 reads the first line in the section that is `none` or a `| id |`
table header, and treats every other line as prose. A section containing neither is P4's
failure, not an empty claim:

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| `D1` | what must happen, in one sentence, naming a symbol, command, corpus population or document | see §3.4 | the file or commit convention that will hold the record | commit sha, or empty |

**A discharged row is kept — with its discharge sha — when the RFC archives; archival never
deletes it.** This is **ruled** (owner, D648, 2026-08-21, resolving Q2 below as proposed:
*"Keep, with discharge SHA — preserves history without looking live"*). A row whose `discharged`
cell carries a sha cannot be mistaken for a live claim, and deleting it would destroy the only
record that the obligation existed — which is exactly what happened to `claim-backing`'s OQ5
(F2). The frozen `## Discharges` table of an archived RFC is history; P5 and P6 read only rows
with an **empty** `discharged` cell.

**`none` is written, never inferred.** An absent section is a defect, not a claim of nothing
outstanding. This mirrors RFC-1 §3's `tabiya-claims` `none` and rests on the same evidence
`CLAUDE.md` records: `engine-request-contract` was the single RFC that flowed back to nothing and
**also the only one with no log entry** — the absence predicted the failure exactly. An absent
table is ambiguous between *nothing outstanding* and *forgot*; a present `none` is not.

#### §3.2 What belongs here, and what does not

> **A `## Discharges` row is an obligation that (a) survives `accepted`, (b) blocks
> `implemented`, and (c) is executed by someone or something other than this RFC's
> implementation.**

The contrast with the two neighbouring sections is the point:

- **`## Open questions`** are *resolved before `accepted`*. They are closed and stop being read.
  **Filing an ownership obligation there is what produced [[D476]]** — the ownership was created
  by *answering* a question, and answers are not re-read.
- **`## Acceptance criteria`** are testable gates on *this RFC's own implementation*. A criterion
  is something the implementer can run. A discharge is something the implementer cannot run,
  because it is not their work.

#### §3.3 What an obligation is, by example — the three at HEAD

These are written into the three bodies by this RFC's landing commit, and — together with the
rows `pack-population-provenance` has already written for itself — they are the whole population
at `29498ba`:

| RFC | id | obligation | owner | recorded when discharged |
|---|---|---|---|---|
| `feedback-delivery` | `D1` | the binding wave: 98 withheld claims — 63 mandatory pack edits (`author_principle` + a `principles` entry, else `CLAIM_AUTHOR_LABEL_REQUIRED` refuses), an explorer position-census pass over 60 `corpus_observed` claims in 31 packs, a tablebase legal-successor pass over 36 `tablebase_exact` claims in 12 | **`OWNER`** — §6 | `planning/content-era/log.md` + the ledger flips of criterion 11, in the shipping commit (content-wave closeout) |
| `learner-rating` | `D1` | six changes owed to `design/06-campaign.md`, enumerated in its §5.3a; law 5 makes them owner-tier | **`OWNER`** | `design/06-campaign.md` + `planning/exploration/log.md` |
| `teacher-surface` | `D1` | three edits owed to `rfc/archive/live-marker-quality.md` at landing (criterion 6's two sentences, §6.2's recorded owner cost) | **`teacher-surface`** (self, at landing) | the landing commit |

*(The drafted version had a fourth row — `dead-vocabulary`, owner `OWNER`, the independent
review. The review ran and the RFC archived 2026-08-20 at `b8e3649` before this landed; the
discharge is real and its only record is a clause in a frozen status line ([[D654]]), which is
the argument for the sha column. Its row is not written retroactively — criterion 3 forbids
editing archived RFCs.)*

Note what the table does that five paragraphs of prose did not: **it makes `OWNER` appear twice
in one grep** (plus `pack-population-provenance`'s own `OWNER` row makes three at HEAD). For the
first time the repo can answer *"what is waiting on me?"* mechanically — one
`git grep -n OWNER rfc/*.md` over a column whose vocabulary is closed — which is a benefit the
owner receives rather than a tax the owner pays.

#### §3.4 The owner cell has a closed vocabulary, and it may not be empty

Exactly one of:

- **an Active RFC slug** — that RFC's implementation discharges it;
- **`OWNER`** — discharging it is Marco's act (a ruling, a review, a commissioning);
- **a `planning/` path that exists** — a job owns it;
- **a named agent** — `claude` or `codex`.

**The cell is parsed like §2's status cell — it begins with one of the four forms, and anything
after a comma, em dash or parenthesis is unread prose.** Cross-review added this sentence by
parsing the document's own rows against its own rule: `codex, via planning/codex-queue.md`
(§5's row), `teacher-surface (self, at landing)` (§3.3) and `pack-population-provenance`'s
`planning/codex-queue.md §0-CONTENT` all carry a trailing qualifier, and a P6 that demands the
bare form fails every existing row while a P6 that accepts arbitrary text accepts a sentence.
The leading form is the owner; the qualifier is colour.

**An archived slug is a failure** (check P6), and so is an empty cell, `TBD`, or a description
in place of a name. This is the clause that would have stopped [[D476]]: at `5b65048`, the moment
`claim-backing.md` moved under `rfc/archive/`, `feedback-delivery`'s owner cell would have named
an archived slug and `make verify` would have gone red **in the archiving commit itself**.

**The residual weakness, stated rather than hidden.** Nothing stops an author writing `OWNER` for
an obligation that is really theirs. That failure is visible — it appears in the owner's grep —
which is the outcome we want and is not the outcome prose achieves. What the check cannot do is
judge whether the naming is honest, and no cheap check can.

### §4 — The archiving obligation

`rfc/0000-rfc-process.md` §Planning docs & the job log, *"On completion:"*, gains:

> **Before archiving, clear the document's name from every other document's obligations.** Run
> `git grep -ln '<slug>' rfc/ planning/ design/`. For every `## Discharges` row in another RFC
> whose **owner** cell names this slug, the archiving commit must either **mark it discharged**
> (with the sha) or **re-home it** to another value of §3.4's vocabulary — an archived RFC can
> own a mechanism's design and cannot own an act's execution. **Name both in the commit body**,
> one line each: `lifts: <path> — <what>` and `rehomes: <what> → <owner>`. This is the same
> commit that flips the ledger rows and appends the log entry.

**What reads each half.** The re-homing half is read by **P6** — mechanically, in `make verify`,
in the archiving commit. The `lifts:` lines are read by `git log --grep`, which is the same
reader the [[D416]] convention already uses and the same strength: weak, cheap, and better than
the nothing that read them at 14:58 on 2026-08-16. **I am not claiming the commit-body half is
enforced**; it is a convention whose value is that a future reconciliation can find the act. The
enforced half is the one that mattered — [[D476]] is a re-homing failure, not a prose failure.

**Why the block itself is not given a separate mechanism.** [[D433]] (a stale block) and
[[D476]] (an ownerless obligation) are **the same edge seen from its two ends**: if Y is blocked
by X, Y carries a `## Discharges` row with owner `X`, and X's archival forces the row to be
discharged or re-homed. The prose block in a register cell becomes decoration; the normative
statement is the row. One mechanism, two rows closed — which is why they are one document.

### §5 — What reads all of this: six checks, one instrument, zero new scripts

**This RFC ships no code.** `make status-parity` is queued as implementation at
`planning/WORK.md` §0 and stays there; RFC-1 §7 rules *"share the reader, not the rule"* and
puts the §Active-table parser in `tools/register-check.mjs`. These are the checks that
instrument consumes, and they are the specification `tools/status-parity.mjs` implements. Its
inputs are unchanged — `rfc/README.md` §Active and the RFC bodies — and it gains **no** new
input file.

| | Check | Fails when | Red at HEAD? |
|---|---|---|---|
| **P1** | Every §Active row's status cell and every RFC body's `**Status:**` line begins with one of the seven tokens (§2's stripping rule). | A cell leads with a disposition. **`measurement-records`, today.** | **yes — 1 of 10** |
| **P2** | For each §Active row, the cell's leading token equals the body's leading token. | The defect of [[D477]] (five ledgered instances; `planning/WORK.md` §0 counts six): a resolution in a register that is not a resolution in the body. | **yes — 1 of 10**, the same row |
| **P3** | **Two set equalities — the pair the owner ruling widened to (D648, Q3) — plus an archive status rule (c) that is this RFC's own addition beyond the ruling's text**: (a) the set of `*.md` files in `rfc/` minus `README.md` and `template.md` **equals** the set of §Active rows; (b) the set of files under `rfc/archive/` **equals** the set of `## Archive` rows; (c) every file under `rfc/archive/` reads `implemented`, `superseded` or `withdrawn` — carried from the D638 harness's second assertion (*"every archived body calls itself implemented"*, widened to the three terminal tokens), severable if the owner strikes it. (`rfc/withdrawn/` is a subdirectory, outside both sets; its `## Withdrawn` table is not in the ruled scope.) | A file exists in neither register or a row names no file — **[[D638]] is the concrete failure**: at 2026-08-20 there were 63 files under `rfc/archive/` against 58 `## Archive` rows, with five RFCs findable only through pack-register history and one malformed row, so *a file can disappear from both registers*; or an archived RFC still reads `implementing`; or an RFC vanishes from §Active without an Archive row (`expression-census` at `4a893dc`). | no — 10 = 10 and 64 = 64 at `29498ba`, repaired by the D638 fix |
| **P4** | Every RFC in §Active has exactly one `## Discharges` section; it reads `none` or parses as §3.1's table; if either status side reads `awaiting`, the table has ≥1 row with an empty `discharged` cell, and the status line names one. | A section is dropped in a rewrite; `awaiting` is written with nothing holding it open — a state that passes while measuring nothing ([[D444]]). | n/a until landing |
| **P5** | No RFC with an undischarged row reads `implemented`, and no such RFC sits under `rfc/archive/`. | An RFC archives over an open obligation — **[[D476]] and [[D475]] in one assertion**. | n/a until landing |
| **P6** | Every owner cell is one of §3.4's four forms, and any RFC slug it names is in §Active. | An owner is archived, blank, `TBD`, or a sentence. **This is the check `5b65048` would have failed.** | n/a until landing |

**P3's widening has a prior instrument, and the seam is stated rather than duplicated.** The
D638 repair shipped `tools/rfc-completion-harness/audit.test.ts`, which already asserts both set
equalities (`activeRows` = root files, `archiveRows` = archive files) — and its first line
labels it *"DISPOSABLE research harness"*: it proved the checks; it is not the durable reader.
P3 makes the rule normative and `tools/status-parity.mjs` becomes its `make verify` reader, per
RFC-1's *share the reader, not the rule* — the harness's set logic is the reference
implementation, and once P3 runs in `verify` the harness can retire with its question. Neither
equality is vacuous at `29498ba`: the sets hold **10** and **64** members ([[D444]]'s non-empty
join requirement, satisfied by construction).

**Negative fixtures are required, and two of these can pass vacuously.** P4's `awaiting` clause
and P5 are both **implications with an empty antecedent** while no RFC is `awaiting` — they hold
trivially and measure nothing, which is [[D444]]/[[D451]]'s exact shape. Acceptance criterion 7
therefore requires a fixture in which each is violated, a fixture for P6 containing **at
least two** owner cells, since a check over a singleton proves nothing, and a fixture for P3 in
which a file exists in neither register — the [[D638]] shape.

**Landing order, and this RFC is its own first case.** `status-parity` cannot implement P1–P6
before they exist, and this RFC's obligations have no reader until it does. That is exactly the
condition §1 invents a state for, so **this RFC uses it on itself**: it lands `implementing` →
`awaiting`, carrying one discharge row —

| id | obligation | owner | recorded when discharged |
|---|---|---|---|
| `D1` | P1–P6 implemented in `tools/status-parity.mjs`, wired into `make verify` | `codex`, via `planning/codex-queue.md` | the implementing commit's sha |

— and moves to `implemented` when that lands. The bootstrap is named rather than hidden: for the
window between the two commits, the obligations here are prose, and this document says so in the
one place a reader will look.

### §6 — The ownerless binding wave: a concrete commissioning proposal

**The mechanism above creates the state; it cannot commission the wave — commissioning is an
act.** This section proposes the act, in the form §3.4 requires. It is a proposal to the owner,
not a decision, and it changes nothing until ruled.

**Why the wave is ownerless is not that everyone forgot.** It is **three kinds of work with
three different owners under this repo's own division of labour** (`planning/content-era/log.md`,
2026-08-12: claude authors chess judgement, owner reviews, codex builds tooling), and a job that
splits three ways has no natural single taker:

| lane | population | kind | natural owner |
|---|---|---|---|
| **(a)** instrument runs | 60 `corpus_observed` claims in 31 packs; 36 `tablebase_exact` in 12 | mechanical, shipped `make` targets (`source-fetch`, `candidate-emit`, `candidate-attach`, `sourcing-check`) | **codex** |
| **(b)** pack edits | **63** floor / 83 ceiling, across 33 packs | authored judgement — each claim needs `author_principle` **and** a named `principles` entry | **claude authors, owner reviews** |
| **(c)** prose fixes | unbounded within (a) | authored judgement — `normalizes` is exact | **claude authors, owner reviews** |

**The blocking decision is the owner's, and it is already written down as a question.**
`feedback-delivery` §0.2 measures that 13 principle entries, 12 of them referenced today, would
carry **94** further claims (63 mandatory + 31 optional), and states that whether they can
honestly do so — or whether the registry grows, and who authors each new entry's required
`counterCase` — is *"squarely blocking for the wave."* That is a rung-5 provenance judgement a
learner reads. Law 8 forbids manufacturing it; the content-era division of labour puts the review
on the owner. **So the wave's owner today is `OWNER`, for exactly one decision, and the row says
so rather than pretending a lane can start.**

**The proposal, in four named parts:**

1. **Owner cell today: `OWNER`**, with the obligation text naming `feedback-delivery` Open
   question 8 as the single blocking decision. This is the honest value and it makes the wave
   appear in the owner's grep beside the other two.
2. **On that ruling, the cell becomes `claude`** for lanes (b) and (c), and lane (a)'s two
   instrument runs enter `planning/codex-queue.md` as a **named prerequisite item** — they must
   finish first, because a pack edit binding a claim to a record the census has not produced
   fails `validateClaimBindings` at `if (issues.length === before)`.
3. **Home: `planning/feedback-delivery/`**, which that RFC's metadata already declares *"kept
   open through stage 2"*. **No new lane file is created**, deliberately: [[D492]] measures that
   every hand-made lane document inherits `work-register.md`'s staleness, and a wave that needs a
   new index to be found is a wave that will be lost again.
4. **Closeout: the content-wave clause**, unchanged — the wave flips the `design/BACKLOG.md`
   rows it fixes and appends its entry to `planning/content-era/log.md` **in the commit that
   ships the content**, and criterion 11's flips ride there per that RFC's §0.1.

**What this proposal explicitly refuses.** It does not make `feedback-delivery` the wave's owner
— that RFC states plainly that it *"does not author the wave and does not own it"*, and what it
owns is refusing to complete before the wave's result is measured on the surface it ships. The
`## Discharges` row expresses precisely that relationship: **the obligation is
`feedback-delivery`'s; the execution is the owner cell's.** Separating those two is the thing the
lifecycle could not previously say.

### §7 — Two authoring conventions, placed where they are read

Both ride here as passengers ([[D478]], [[D460]]). Neither has a user or defect-class consequence
beyond how carefully a document is written, and both are named as hygiene so they are not
smuggled up the ranking.

**§7.1 — Assert before replacing ([[D478]]).** `rfc/0000-rfc-process.md` §Rules gains:

> **Scripted edits assert.** Any scripted edit to a repo document asserts its anchor before
> replacing (`assert old in s`), or rewrites the file whole. Anchored patching is not used on a
> file another agent also edits. Before writing a commit message that describes an edit, verify
> it with `git diff --stat`.

**What reads it: the interpreter.** `assert` raises; a bare `str.replace` cannot fail. That is
the whole guard and it is free — the same script that no-opped twice on `planning/codex-queue.md`
used `assert old in s` elsewhere in the same session and caught a miss immediately. The second
reader is `git diff --stat`, a command, run by the agent before it writes the message that
misdescribed the file. **The honest limit: nothing checks that the assert was written.** I am
proposing it anyway, because a rule that costs one token and converts a silent failure into a
loud one is worth having with a weak reader, and I would rather say so than dress it up.

**§7.2 — Count statements, not sites ([[D460]]).** `rfc/template.md`'s §Specification guidance
gains one line:

> A table enumerating code sites states its **unit** and its **total** in the table's caption,
> and the acceptance criterion that verifies it counts the same unit.

**What reads it: the acceptance criterion, at review time — a human.** This is the weakest reader
in the document and it goes in `rfc/template.md` rather than `rfc/0000-rfc-process.md` **because
of §0's corollary**: a template is read at the moment a table is written, which is the moment the
defect occurs; §Rules is read when the process is learned. Three revisions of `teacher-surface`
§4.3 miscounted with the identical shape — *a function listed while one of its two statements was
not* — and the revision that counted statements got it right at seven rows / twelve statements.

### §8 — What this RFC declines to decide

**`engine-leverage` and `vocabulary-wiring` ([[D497]], [[D505]]) — declined at drafting, and
events resolved it exactly as the decline predicted.** RFC-1 §6 routed *"whether those two RFCs
move to `implemented` and archive"* to this document or the owner. This RFC declined to add
machinery, on the ground that RFC-0000 rule 3 already had the remedy and a new state would be
the ceremony this document refuses. **Between drafting and refresh, the A0 active-RFC truth
audit (2026-08-20) closed both rows with zero new lifecycle machinery**: both RFCs passed an
independent clean-tree closeout and archived through the ordinary path ([[D497]] ✅), and the
audit re-derived that the criterion this section — following RFC-1 — had called unsatisfiable
was in fact **satisfied at its own landing commit `18d2832`**; a landing invariant does not fail
retroactively ([[D505]] ✅ *"closed by verified archival"*). The decline stands vindicated, with
one correction to its own premise absorbed: the document was never missing an edit either — the
register was missing the truth, which is RFC-1's subject, not this one's. The residue [[D505]]'s
closure names — *"the future register checker must distinguish landed history from live
claims"* — is RFC-1 §2's landed/claimed split, already specified there.

**Anything about a specific RFC's current status.** P1–P6 are checks; this RFC asserts no
document's state except the three `## Discharges` rows of §3.3 and its own.

### §9 — Boundaries and the amendment list

#### §9.1 The three neighbours

**`rfc/archive/shared-resource-registers.md` (RFC-1).** It amends §Rules (rule 7, shared versioned
resources) and the register sections of `rfc/README.md`; this RFC amends §RFC lifecycle,
§Planning docs, and adds a §Rules rule of its own. **The §Rules numbering is the only collision
and it is resolved by landing order**: RFC-1 takes **7**, this RFC's *scripted edits assert*
takes **8**. If this RFC lands first it takes 7 and RFC-1 takes 8. Neither document renumbers the
other; the implementer reads the file at landing. RFC-1's Q3 (*should a claim held by a
`withdrawn` or archived RFC be released automatically?*) is **answered by §3.4 and P6** for the
owner-of-an-obligation case, and left to RFC-1 for the holder-of-a-lane case — a lane claim lives
in `tabiya-claims`, not in `## Discharges`, and the two tables are not merged.

**`make status-parity` ([[D477]]).** Stays queued as implementation. This RFC supplies its
vocabulary (§2), its grammar (§2), and its six checks (§5); it writes none of them. The
instrument's home is `tools/status-parity.mjs` and it imports RFC-1's §Active-table parser rather
than restating it. **The parser's home is a second landing-order seam, stated here as the
numbering seam is above:** this RFC's D1 does not wait on RFC-1, so if `status-parity.mjs` lands
while `tools/register-check.mjs` does not exist, the shared §Active parser is born in
`status-parity.mjs` and RFC-1's checker imports it — *share the reader* names one parser, not a
fixed file; first lander hosts. (RFC-1 §7 now carries the same clause from its side.)

**`make work-index` ([[D487]]).** No overlap. Different input (`design/BACKLOG.md` **column 1** —
and per [[D419]]/[[D459]] **column 3 is not a status**, which this RFC reads nowhere), different
join, different failure, different landing shape (staged, because its territory spans **355 open
ledger rows** per [[D487]]'s 2026-08-20 refresh, which no landing commit can fix). This RFC's
checks are red on **one** row at HEAD and it lands green.

#### §9.2 Every clause amended, named

| File | Section | Change |
|---|---|---|
| `rfc/0000-rfc-process.md` | **§RFC lifecycle** | the arrow gains `awaiting`; a new `awaiting` bullet; the `implemented` bullet gains the discharge clause (§1) |
| `rfc/0000-rfc-process.md` | **§Rules** | one new rule, *scripted edits assert* (§7.1), numbered per §9.1 |
| `rfc/0000-rfc-process.md` | **§Planning docs & the job log** | the *"On completion:"* paragraph gains the archiving clearance clause (§4) |
| `rfc/template.md` | header block | `Status:` line lists seven states |
| `rfc/template.md` | new section | `## Discharges`, between `## Acceptance criteria` and `## Open questions` |
| `rfc/template.md` | §Specification guidance | one line, *count statements, not sites* (§7.2) |
| `rfc/README.md` | §Active, header note | two lines stating §2's grammar |
| `rfc/README.md` | §Active, one cell | `measurement-records`: `returned to author 2026-08-16` → `draft — returned to author 2026-08-16` |
| three RFC bodies | new `## Discharges` | `feedback-delivery`, `learner-rating`, `teacher-surface` (§3.3; `dead-vocabulary` archived 2026-08-20 with its obligation discharged — see F3) |
| four RFC bodies | new `## Discharges` | `none` — `0000-rfc-process`, `graduation-clearance`, `measurement-records`, `assistance-controls` (`shared-resource-registers` and `pack-population-provenance` already carry theirs; re-census at landing) |

**Not touched:** `design/` (law 5), `archive/` (law 2), any schema, any migration, any code
outside the one queued instrument.

---

## Deviations from design

**None.** This RFC specifies no product surface and cites no `design/` section (see the Design
refs note). It touches no `design/` document. The ledger rows it discharges are flipped in its
landing commit per `CLAUDE.md`'s completion protocol, which establishes `design/BACKLOG.md` as a
register every tier writes to rather than an intent doc.

---

## Acceptance criteria

Each states **how it can fail**, because a criterion whose failure mode cannot be described is a
criterion that measures nothing ([[D444]], [[D451]]).

1. **`rfc/0000-rfc-process.md` §RFC lifecycle lists exactly seven states, the arrow shows
   `awaiting` between `implementing` and `implemented`, and the `implemented` bullet names the
   `## Discharges` condition.**
   *Fails if:* `awaiting` is added to the bullet list but not to the arrow — the transition is
   then undefined and an implementer cannot tell whether it precedes or replaces `implementing`,
   which is the ambiguity `feedback-delivery` already resolved by hand and should not have to.
   *Also fails if:* an `accepted → awaiting` edge is added — the owner ruled it out (Q1,
   [[D648]]: *"accepted means code has not started"*); or an eighth state is added for
   `returned to author`, which §0's admission rule refuses and which would leave the cells still
   unparseable (9 of 10 differ byte-for-byte at `29498ba`).

2. **The grammar of §2 is stated in `rfc/0000-rfc-process.md` §RFC lifecycle and mirrored as a
   two-line note above `rfc/README.md` §Active, and `measurement-records`' cell is the only
   §Active cell edited.**
   *Fails if:* the implementer "tidies" other cells to match a shorter form. The prose in those
   cells is load-bearing review history; this RFC constrains the first word and nothing else, and
   a cleanup pass here would destroy records no other document holds.

3. **Every RFC named in `rfc/README.md` §Active carries exactly one `## Discharges` section, and
   those with nothing outstanding carry `none` rather than omitting it.**
   Count against the §Active row count (**10** at refresh HEAD `29498ba`; 12 at drafting —
   re-census at landing), not `ls rfc/*.md`, which picks up `README.md` and `template.md`.
   *Fails if:* an omitted section is treated as equivalent to `none` — the exact ambiguity §3.1
   exists to remove. *Also fails if:* RFCs already under `rfc/archive/` are edited to add the
   section. Those documents are frozen (RFC-0000 rule 3), so **P4 applies to §Active only**, and
   an RFC archived after this lands carries the section it already had.

4. **The three obligations of §3.3 are written as rows with a non-empty owner cell drawn from
   §3.4's closed vocabulary, and `feedback-delivery`'s reads `OWNER`.**
   *Fails if:* only `feedback-delivery`'s row is written — the RFC would then have specified a
   general mechanism and shipped a one-off, which is [[D475]]'s complaint restated one tier up.
   *Also fails if:* an owner cell is filled with a description (*"whoever runs the wave"*) rather
   than a name; P6 must reject it, and a P6 that accepts prose passes while measuring nothing.

5. **This RFC ships no new script.** `tools/` gains no file; `make` gains no target from this
   RFC.
   *Fails if:* a second reader of `rfc/README.md` §Active is written, duplicating the queued
   instrument — refused by `planning/WORK.md` §0 and by RFC-1 §7's *share the reader, not the
   rule*.

6. **P1–P6 are implemented in `tools/status-parity.mjs`, and `make status-parity` exits zero at
   that commit.** Criterion 2's cell edit lands in the *documentary* commit (criterion 8 puts
   criteria 1–5 there) and must already be in the tree when the instrument runs; only if the
   instrument somehow lands first does the edit ride its commit instead — cross-review removed
   the original wording, which demanded the edit in the instrument commit and contradicted
   criterion 8.
   *Fails if:* the target is written but not wired into `verify`, leaving a checker nobody runs —
   the [[D450]] shape reproduced in a Makefile. *Also fails if:* P1/P2 are softened to pass
   against the unedited cell, which is fixing the check instead of the fact.

7. **Each of P1–P6 has a fixture that makes it fail, and a fixture in which it passes.**
   *Fails if:* only the passing direction is tested. **P4's `awaiting` clause and P5 are
   implications with an empty antecedent at landing** — they hold trivially and prove nothing
   until an `awaiting` fixture exists. **P6's negative fixture must contain at least two owner
   cells**, one valid and one archived, because a check over a singleton is satisfied by
   accident. **P3's negative fixture is a file present in neither register** — the [[D638]]
   shape — and its passing fixture must show both sets non-empty, since a set equality over two
   empty sets is [[D444]]'s vacuous join.

8. **This RFC is `awaiting` between its documentary landing and criterion 6, and its own
   `## Discharges` row names `tools/status-parity.mjs` with owner `codex`.**
   *Fails if:* it is marked `implemented` on the documentary commit — which would archive a
   document whose every obligation is still unread prose, and would be this RFC's own subject
   happening to this RFC. *Also fails if:* the `awaiting` period is used to defer criteria 1–5;
   those land in the documentary commit and only criterion 6's instrument is deferred.

9. **The archiving clause is in §Planning docs & the job log's `"On completion:"` paragraph, not
   in §Rules.**
   *Fails if:* it is filed in §Rules for tidiness. §0's corollary is the whole reason [[D433]]
   happened: the archiver at `5b65048` was executing the completion checklist, and a rule in a
   section they were not reading is a rule that does not exist.

10. **No shared resource moves and no `design/` file is touched.**
    `DRILL_PACK_SCHEMA_VERSION` (**0.27**), `DRILL_RUN_SCHEMA_VERSION` (**0.17**),
    `SHAPE_ENTRY_SCHEMA_VERSION` (**0.3**), `PRINCIPLE_ENTRY_SCHEMA_VERSION` (**0.1**),
    `STORAGE_VERSION` (**23**), `EVIDENCE_KINDS` (7 members) and all four `schemas/*.json` `$id`s
    are byte-identical before and after (all six re-verified unchanged at `29498ba`).
    *Fails if:* the three `## Discharges` rows of §3.3 (the refresh cut the drafted four to
    three; this count was corrected by cross-review) are read as a licence to act on the
    obligations they record. Writing the row is this RFC's work; discharging it is not.

11. **The ledger rows are flipped in the landing commit** ([[D433]], [[D475]], [[D476]],
    [[D478]], [[D460]]), **and the commit names them in its subject or body** ([[D416]]).
    *Fails if:* [[D476]] is flipped on the documentary commit. **The row is not closed by
    creating a place to name an owner; it is closed when the wave has one.** Its flip belongs to
    the commissioning act of §6, and closing it here would be a row dying unfixed under a
    mechanism that describes it — which is the failure mode this whole document is about.

---

## Discharges

*(This section is written under its own §3.1, as the specification's first instance.)*

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| `D1` | P1–P6 — P3 as widened by the D648 Q3 ruling — implemented in `tools/status-parity.mjs` and wired into `make verify` (acceptance criteria 6 and 7) | `codex`, via `planning/codex-queue.md` | the implementing commit's sha | `7bdbafa` |

---

## Open questions

**Q1 — Should `awaiting` be reachable from `accepted`, or only from `implementing`?
✅ ANSWERED — only from `implementing` (owner ruling 2026-08-21, [[D648]]).** The ruling, as
recorded in `planning/platform-alignment/intent-amendment-handoff.md` §Process-RFC owner
rulings: *"**APPROVED — No; only `implementing → awaiting`.** No current reader needs the extra
edge; accepted means code has not started."* §1's arrow already places it there; the arrow is
now closed rather than provisional, and criterion 1 enforces it. The refused alternative is kept
for the record: a hypothetical RFC whose *entire* specified work is a corpus pass would want
`accepted → awaiting` directly — no such RFC exists (still true at `29498ba`), and the extra
edge doubles P5's transition surface.

**Q2 — Does a `## Discharges` row belong in an archived RFC at all, or should archival delete
it? ✅ ANSWERED — keep, with the discharge sha (owner ruling 2026-08-21, [[D648]]).** The
ruling: *"**APPROVED — Yes, with discharge SHA.** Preserves history without looking live."*
§3.1 now states it normatively. `claim-backing`'s archived OQ5 was the argument in both
directions: keeping a stale ownership *sentence* is what made [[D476]] unfixable, but a
*discharged* row carries a sha and cannot be mistaken for a live claim — and `dead-vocabulary`'s
archival between drafting and refresh (F3) supplied a live demonstration of the cost of the
alternative: a real discharge whose only record is a clause in a frozen status line.

**Q3 — Should P3's filesystem-parity clause ship in this RFC or with the instrument?
✅ ANSWERED — ship it, WIDENED (owner ruling 2026-08-21, [[D648]]).** The ruling:
*"**APPROVED — Yes, widened to Active/root and Archive/filesystem set equality.** D638 is the
concrete failure; a file can otherwise disappear from both registers."* The drafted clause
covered only *a root file appears in §Active*; between drafting and the ruling, [[D638]] proved
the wider failure — 63 archive files against 58 `## Archive` rows, five RFCs findable only
through pack-register history — and was repaired 2026-08-20 with a **disposable** harness
asserting exactly the ruled equalities. §5's P3 now specifies both set equalities; the row this
question proposed to file exists (it is D638, ✅); the durable reader is criterion 6's
instrument. **Cross-review boundary note: P3's clause (c) — every archived file reads a
terminal state — is not in the ruling's text**, which names the two set equalities and stops;
(c) is carried from the harness's own second assertion and is this RFC's addition, marked
severable in P3 rather than smuggled under the ruling — *widened* is exactly where an answer
can quietly exceed what was ruled, and this one is fenced instead.

**Proposed new ledger rows — described here, deliberately not written** (ids through **D513**
were in use at drafting; **all four landed 2026-08-17 under their proposed ids** — verified at
`29498ba`: [[D514]] 🐞, [[D515]] 🐞, [[D516]] 🐞, [[D517]] 📊, each with the text below. Ids
through **D651** are now in use; this refresh proposes no further rows):

- **D514** — *The only extant statement of who owns the binding wave is inside a frozen file, and
  it names itself.* `rfc/archive/claim-backing.md:1725` reads *"**answered.** This RFC owns it"*
  at HEAD; the archiving commit `5b65048` changed exactly two lines of that file (`Status`,
  `Planning`) `[V]`. RFC-0000 rule 3 and law 2 make it immutable, so the claim **cannot be
  corrected where it lives**. This sharpens [[D476]] from *the owner was archived* to *the
  ownership statement is now unfixable at its only site*, which is why re-homing must happen in
  the archiving commit rather than afterwards.
- **D515** — *An outstanding obligation outside an RFC's own code is one third of the Active
  table, not one document's improvisation.* Measured at HEAD `68098e5` over all 12 §Active rows
  `[V]`: `feedback-delivery` (the wave, owner archived), `dead-vocabulary` (*"archival waits for
  independent review"* — a completion gate with no owner, no home and no definition anywhere in
  `rfc/0000-rfc-process.md`), `learner-rating` (six changes owed to `design/06-campaign.md`, law
  5), `teacher-surface` (three edits owed to `live-marker-quality` at landing). [[D475]] is filed
  as one RFC's shape and is a lifecycle property.
- **D516** — *[[D477]] prices `make status-parity` at "one grep", and the grep needs a grammar
  before it needs a vocabulary.* Run by hand at HEAD over all 12 §Active rows `[V]`: **11 of 12
  register cells differ byte-for-byte from their body `**Status:**` line** (only
  `0000-rfc-process.md` matches, because its cell is the bare word `accepted`), while **11 of 12
  agree on their leading token**. A string-equality check reports 11 failures, 10 spurious; a
  token check reports the 1 real one. The instrument was blocked on a parsing rule, not on
  [[D500]]'s missing word — and [[D500]]'s remedy turns out to be **one cell edit**, not a state.
- **D517** — *An unblocking commit repaired the sentence it was looking at and left the same
  block standing four columns away.* `532c7e2` rewrote `feedback-delivery`'s status cell to
  *"UNBLOCKED 2026-08-16"* and left column 4 ending *"Cannot be accepted until the owner rules the
  withhold/deliver fork"* — the block and its lifting in one row, in one commit `[V]`. The row is
  since rewritten, so this is record-only; it is worth a row because it is the strongest available
  evidence that a prose correction fixes the sentence a reader happened to open, and it is the
  direct argument for §4's structured re-homing over a *"remember to update the dependents"*
  clause.

---

## Changelog

- 2026-08-21: implemented and discharged. Documentary transition `3aef8df`; P1–P6 reader
  `7bdbafa`; final gate 767 Vitest tests plus 12 register and 11 lifecycle fixtures, with
  9 Active / 65 Archive / 6 honest open obligations at the pre-archive reading.

- 2026-08-17: created. Drafted against HEAD `68098e5`; every register fact re-derived at the named
  symbol at that commit rather than inherited from `planning/rfc-drafting-queue.md` (written
  against `2160d2c`) or `rfc/archive/shared-resource-registers.md` (written against `4a6ad91`). **Three
  findings differ from both.** The pack lane is **0.27** at HEAD and **0.28 has never been
  committed** — `git log -S` over `packages/schema/src/index.ts` returns nothing for it `[V]` — so
  RFC-1's note that the bump was uncommitted in the working tree is superseded: 0.28 remains
  *claimed and held*, 0.29 remains next free. The parity check now reads **11 of 12** rather than
  9 of 10 or 8 of 9, with the same single disagreement, and the byte-difference count (11 of 12)
  is the finding that reframes [[D477]]'s instrument as blocked on a grammar. And the [[D433]]
  timeline is **3 h 06 m, not a day**, with the archiving commit having already edited both the
  register and the dependent's body — which moves the remedy from *notify the dependent* to *one
  clause in the paragraph the archiver reads*.
- 2026-08-21: **owner answers recorded and full refresh at HEAD `29498ba`** (author pass per
  [[D648]]; the `30d1d53` intent amendment, the D649 external-participant descope and Feedback
  Stage 1 `a64e6c5` all landed since drafting — this RFC references no participant work, checked
  against D649). **Q1 answered — only `implementing → awaiting`** (§1 closed, criterion 1
  enforces); **Q2 answered — discharged rows are kept with their sha** (§3.1 now normative);
  **Q3 answered — P3 ships WIDENED** to Active↔root and Archive↔filesystem set equality (§5),
  with [[D638]] as the concrete failure and the disposable `tools/rfc-completion-harness/` as
  the reference implementation the durable instrument replaces. Population refreshed:
  `dead-vocabulary` discharged its independent review and archived 2026-08-20 (`329c62b`), so
  §3.3 writes **three** rows, not four, and `awaiting`'s live case narrows to one —
  `feedback-delivery`, now concretely between its landed stage 1 and the wave;
  `pack-population-provenance` adopted §3.1 before this RFC landed (two rows, one `OWNER`). §8's
  declined machinery was vindicated by events — [[D497]]/[[D505]] closed 2026-08-20 with zero
  new lifecycle states, and the "unsatisfiable criterion" premise is corrected: satisfied at its
  own landing commit `18d2832`. Parity re-run at `29498ba`: **9 of 10** byte-differ, **9 of 10**
  token-agree, same single `measurement-records` row (fourth consecutive measurement of [[D516]]'s
  shape). Proposed rows reconciled: D514–D517 landed 2026-08-17 as proposed; ids run through
  D651. The metadata paragraph now carries the literal `tabiya-claims` block in RFC-1's ruled
  position, and this RFC's own `## Discharges` row absorbs the widened P3.
- 2026-08-21 (adversarial cross-review, joint with `shared-resource-registers`): seven
  corrections, all re-derived at the symbol. **(1)** P3's clause (c) — the archive status rule —
  is **not in the D648 Q3 ruling's text**, which names only the two set equalities; it is now
  attributed to the D638 harness's own assertion and marked severable (P3, Q3) instead of riding
  the ruling. **(2)** §2's *no checker reads the prose* contradicted §1's/P4's `awaiting`
  pointer; the grammar gains the one machine-read exception. **(3)** §3.4's owner cell gains
  §2's leading-form parse rule — this document's own two rows (`codex, via …`;
  `teacher-surface (self, at landing)`) failed a literal reading of its own vocabulary.
  **(4)** Criterion 6 demanded criterion 2's cell edit in the instrument commit while criterion
  8 puts criteria 1–5 in the documentary commit; resolved to the documentary commit.
  **(5)** `329c62b` (2026-08-16) is `dead-vocabulary`'s *implementation* commit, not its
  archival — the archival is `b8e3649` (2026-08-20); both F3 sites corrected and the previous
  changelog entry's citation stands corrected here rather than edited. **(6)** §3.1 gains the
  `none`/table parse rule with surrounding commentary allowed — RFC-1's section and this RFC's
  own both violate a bare reading. **(7)** The shared-parser home made landing-order-symmetric
  (§9.1), mirroring RFC-1 §7. Also corrected: the refresh entry's *"ids run through D651"* was
  true at `29498ba` and false at this document's own landing commit `a4877f4`, which wrote
  [[D652]]–[[D654]] — [[D654]] is this RFC's Q2 evidence and F3 now cites it. Everything else
  re-verified clean: 9-of-10 parity both ways at `29498ba`, P3's 10=10 and 64=64 (all 64
  archived statuses lead `implemented`), the F1 timeline (`5b65048` 14:58:11 → `532c7e2`
  18:04:59, one-line `feedback-delivery` edit in the archiving commit, the surviving column-4
  block), `claim-backing.md:1725`, the five-documents/zero-owners census, the §3.3 obligation
  populations, `30d1d53` touching `design/02`–`05` and not `06`, and all three D648 ruling
  quotes against `planning/platform-alignment/intent-amendment-handoff.md:158-160`.
