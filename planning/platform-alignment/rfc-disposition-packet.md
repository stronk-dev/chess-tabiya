# RFC disposition packet — `assistance-controls`, and the `measurement-records` / `claim-semantic-anchors` collision

- **Prepared:** 2026-08-23, by claude (agent), for the register owner
- **Scope:** two stale dispositions cluttering `rfc/README.md`'s Active table, plus the F3 unblock
  re-check that changes what the acceptor may do next
- **Method:** every section and criterion of the returned parents was walked against the shipped
  text of the documents that claim to carry them, and against code at HEAD (`d82f2bb`). Line
  numbers are advisory; locate by symbol or heading.
- **Working-tree note:** `git status` at preparation time showed 22 modified implementation files
  and 5 untracked paths, none of them an RFC. `rfc/f3-capability-contract.md`,
  `rfc/exact-legal-mobility.md` and `rfc/runtime-opening-identity.md` are held by other agents and
  were **read only**. `rfc/measurement-records.md` was dirty at session start and was committed by
  another agent at `fb7a147` before this pass began; everything below is against the committed text.
  **This packet writes no RFC and flips no ledger row.** It is a decision input.

---

## Part 1 — `rfc/assistance-controls.md`: the returned parent

### 1.1 The question

Status at HEAD (`rfc/assistance-controls.md:3-5`):

> **Status:** draft — returned to author 2026-08-22 on D715. The owner chose option C in D532,
> but §4.3 and criterion 11 still specify option A, and the current runtime context cannot express
> the six shipped preference contexts or the ruling's rules-floor example.

Both children have landed:

| child | status | what it took |
|---|---|---|
| `rfc/archive/assistance-control-wiring.md:3` | **implemented — 2026-08-22** | the D308/D309 + on-ramp-default subset |
| `rfc/intent-presets.md:3` | **implementing — 2026-08-22** (accepted 2026-08-22) | D532/D715, "discharges its D532 per-context-ceiling obligation whole" (`intent-presets.md:9`) |

The parent's own header already concedes most of the ground (`assistance-controls.md:25-27`):

> **Supersedes / superseded by:** §§2, 3, 4.1–4.2 and their acceptance criteria are
> superseded by `assistance-control-wiring.md`; this document retains only D307's F5-coordinated
> permission-ceiling question and its historical audit.

### 1.2 The walk — section by section, criterion by criterion

**Carried. No residue.**

| parent section | carried by | evidence |
|---|---|---|
| §2.1–2.4 (reveal chain, store, controller, `DrillScreen` control, copy) | wiring §1 | wiring `:39-57` reproduces both normative sentences byte-for-byte, the `feedbackPolicy === "attempt_end"` predicate, and the deliberate non-pre-emption of `MATCH_LIVE` |
| §2.5 (what opening delivery unlocks) | — | an *enumeration of existing consequences*, explicitly "Nothing new is built" (`:357-358`). Not an obligation. Its rung-6 correction is an audit note |
| §2.6 (what it deliberately does not do) | wiring `:35` out-of-scope + `:80` | "any automatic reveal", "does not implement a rating-driven fade" |
| §3.1–3.3 (gate path A, delete path B, rehome the absence sentence) | wiring §2 | wiring `:59-71`; and wiring **corrects** the parent — the deletion target moved to the inspector's Recorded-moment section (`DrillScreen.svelte:1139-1141`), not the pivotal dialog the parent census named (wiring `:62`, `:143-147`) |
| §4.1–4.2 (defaults ruling, `PROFILE_DEFAULTS`) | wiring §3 | wiring `:73-80`; landing-order seam with `intent-presets` §8.2 mirrored at `:82-87` |
| §4.3 + Open question 1 (the D532 ceiling) | `intent-presets` §3, §3.1 | `intent-presets.md:120-187` — the `ContextContract` table stated as the complement ("may NEVER show"), the `"legal"` permission member, and `deriveWorkflowContext` giving `permittedAssistance` a context that can be `match`/`stream`/`academy`/`onramp`. `:184-185` names the parent's own `:526-535` as the defect it kills |
| §5 (register claims — nothing versioned) | both | wiring criterion 12; `intent-presets` "Claims nothing versioned" (`:32`) |
| §6 (composition with two in-flight RFCs) | — | both counterparties are now `rfc/archive/`. Historical |
| §7 (docs obligations: `adaptive-guidance.md`, `drill-client.md`) | wiring §4 surfaces 8–9, criterion 12 | and the register records both docs at `rfc/README.md:330` |
| criteria 1–10, 12–14 | wiring criteria 1–12 | one-to-one; wiring's are tighter (criterion 10 splits stored-beats-default from malformed-storage) |
| criterion 11 (**WITHDRAWN by D532**) | `intent-presets` criterion 2 | explicit and cited: "discharging, strengthened from one fixture to one per context, the negative-fixture obligation from `assistance-controls.md:697-701`" (`intent-presets.md:393-394`) |
| Open question 3 (should the control state what is withheld?) | ledger row **D494** | `design/BACKLOG.md:683`, 🐞 open. The parent deliberately deferred to it |

**That is the whole document except four things.**

### 1.3 Orphaned — four items, three of them real

The verdict is **(c): something IS orphaned.** None of it is a large obligation, and none of it
changes the disposition — but the parent is the only place each currently lives, so archiving it
without rehoming deletes the record. Named precisely:

---

**O1 — the live-surface register row for the shape-marker channel. Real, and it is an
obligation the parent explicitly handed on rather than discharged.**

`assistance-controls.md:474-479`:

> **One obligation is handed on rather than discharged here**, per that RFC's own rule that
> *"Amending [the §3.1 register] is how a kind's status changes"*: the shape-marker channel
> should gain a register row reading **renders live: yes (behind `guided`); evidence basis:
> none; measurement status: never measured**. It is an amendment to an `implementing` RFC,
> it is not blocking for this one — the channel is live today with no row at all — and it is
> named here so it does not evaporate.

**Verified orphaned.** `rfc/archive/live-marker-quality.md` §3.1's register (its seven rows:
`irreversibility:last_of_role`, `:castled`, `:pawn_break`, `phase_change`, `human_divergence`,
`option_collapse`, `defended_duty_acquired`) has **no shape-marker row**. A grep for
`shape-marker|shape_marker|shapeMarkers` over `rfc/archive/live-marker-quality.md` and
`design/BACKLOG.md` returns **zero hits**. Wiring §2 declines it in terms — "Pivotal sentences,
endgame reading, re-voice and marker admission are unchanged" (`:63`) — and `intent-presets` never
mentions the channel. The parent's prediction that it would "evaporate" is exactly what happens on
an unconditional archive.

It also got *more* load-bearing since drafting: wiring shipped, so the channel now renders live
behind `guided`, and `intent-presets` `WORKFLOW_CONTEXT_POLICIES` defaults `onramp` and `academy`
to `defaultPreset: "guided"` (`packages/runtime/src/presets.ts:47-48`) — an unmeasured live
surface that is now on by default in two contexts, still with no register row.

**Adopting document: `rfc/archive/live-marker-quality.md` §3.1, by amendment.** It is that RFC's
own stated amendment mechanism. It is a one-row edit to an archived RFC, so it needs the archived-RFC
amendment path, not a new RFC. **Cheapest correct route: land the row in the same commit that
archives `assistance-controls`, since that commit is already touching the lineage.** If the acceptor
will not amend an archived RFC in a disposition commit, the fallback is a ledger row — but the row
must then say the register is knowingly incomplete, because "the channel is live today with no row
at all" is now a shipped fact rather than a pending one.

---

**O2 — Open question 2, and it is a standing law-4 breach the archive would make permanent.**

`assistance-controls.md:747-756`:

> 2. **Should a pack-loaded run see the whole shape catalogue or only its declared subset?**
>    `SessionController.#loadShapes` loads a pack's declared `document.shapes` for pack runs
>    and the entire catalogue — **25** entries under `content/shapes` at HEAD — for
>    `position` and `imported` runs. […] **Deferred, not resolved here** […] Proposed as a new
>    ledger row — ids are free from **D503**; **no row is written by this draft.**

**Verified orphaned, and verified never written.** A grep for `shape catalogue|whole shape|declared
subset|loadShapes` over `design/BACKLOG.md` and all of `rfc/` returns the question **only inside
`assistance-controls.md` itself**. D503 (`design/BACKLOG.md:681`) is ✅ closed by
`graduation-clearance` and is not this question. Wiring declines it explicitly — "does not alter
which shapes a pack loads" (`:80`) — and `intent-presets` scopes it out (module *eligibility* is the
D660 bar, `intent-presets.md:49`; the catalogue question is content-authoring, not eligibility).

This is the failure CLAUDE.md law 4 exists to prevent: *"an idea missing from the ledger is a
process bug."* The parent noticed the idea, correctly declined to answer it, and then declined to
write the row — so the archive would be the moment the idea stops existing.

**Adopting document: `design/BACKLOG.md`, a new row at ledger head.** It is a content-authoring
question, not a controls question; no active RFC owns it. It must be written **before** the supersede
commit, or in it.

---

**O3 — the three design-tier naming requests under §Deviations. Real, owner-tier, and both
children declare "Deviations from design: None."**

`assistance-controls.md:616-632` — "**Law 5: this RFC does not write `design/05`. What it needs
named:**"

1. §6 open question 1 should say in one clause that it governs *unrequested* assistance, so its
   rung-2 parenthetical stops reading as a prohibition on the learner-initiated reveal §3a-i
   specifies. *"As written, two sections of one document answer the same question differently,
   and an implementer must guess."*
2. §3-forms' *"each get their own defaults"* should say what *own defaults* means, given §5 Q4
   resolved silence as the product's opinion for all of them.
3. §3b's *"band-shaped… and off by default above, with an explicit intent that it fades"* should
   name its band source.

**Verified unaddressed at HEAD.** `grep -n "unrequested" design/05-in-run-experience.md` returns
**zero hits** (item 1 untouched). `:216` still reads "own defaults; the learner adjusts within what
disclosure permits" with no gloss (item 2 untouched). `:352-355` still reads "band-shaped — the
natural default for the 1000–1400 on-ramp… explicit intent that it **fades**" with no band source
named (item 3 untouched). `assistance-control-wiring.md:107` declares "Deviations from design:
None." and `intent-presets.md:372` declares "None."

Item 1 is the sharpest: the reveal control it concerns **shipped on 2026-08-22**, so `design/05`
now contains a section that reads as a prohibition on a surface the product has. Note that
`intent-presets` §3-forms O4 amendment moved design/05's *algebra* (`:230-232`), which is a
different clause — it did not touch any of these three.

**Adopting document: none can be, under law 5.** These are amendments to `design/00`–`06`, which
only the owner or claude-on-an-owner-ruling may write. **They must be raised as an owner item or a
ledger row, not adopted by an implementing RFC.** Recommend one ledger row carrying all three, cited
to `assistance-controls.md:616-632`, so the supersede does not delete a law-5 request that was
correctly routed and then never actioned.

---

**O4 — the rating-driven fade seam. Weak; named-but-unhomed, not lost.**

`assistance-controls.md:452-458` names `rfc/learner-rating.md` as the fade's home: "when a learner
rating lands, the `onramp` default becomes conditional on it rather than on the pack's feedback
policy, at `assistanceProfile`."

`learner-rating.md` is now **implementing** (accepted 2026-08-22) and does **not** carry it. Its
design ref reads `design/05` §3 "(the assistance ladder, **unmodified here**)" (`:36`), and its
interaction row for `intent-presets` says "**A rated run needs no context of its own**" (`:1637`).
So the seam's named home landed without the seam.

Partial cover exists: `intent-presets`' `onramp` → `defaultPreset: "guided"` is now a
validation-gated **candidate** with Discharge D1 (owner-use validation, `intent-presets.md:442`), so
the *default* is owned and re-tunable. What is unowned is the **fade** — design/05's "explicit
intent that it fades" — which is O3 item 3 by another route. **Recommend folding O4 into O3's ledger
row rather than raising a fifth item;** it is the same unnamed band source seen from the code side.

### 1.4 Verdict

**(c), but the disposition is still supersede-and-archive.**

Nothing orphaned is an *implementable obligation*. O1 is a one-row amendment to an archived
register; O2 is an unwritten ledger row; O3/O4 are design-tier requests only the owner may action.
The parent has no spec left that a child does not carry, and its remaining §4.3 was **returned as
rejected text** — it specifies option A after the owner ruled option C, so leaving it in the Active
table keeps a rejected specification in front of implementers.

This is (c) on the criteria, not on convenience: had the walk found nothing, the answer would have
been (b) and the packet would say so. What (c) changes is not the disposition but the **commit's
contents** — the supersede must rehome O1, O2 and O3 rather than simply moving the file.

**Recommended disposition: supersede-and-archive, conditional on O1/O2/O3 landing in the same
commit.**

### 1.5 Exact text to land

**Body line, replacing `assistance-controls.md:25-27`:**

```
- **Supersedes / superseded by:** **superseded 2026-08-23.** §§2, 3, 4.1–4.2 and criteria 1–10,
  12–14 by `rfc/archive/assistance-control-wiring.md` (implemented 2026-08-22); §4.3, Open
  question 1 and the withdrawn criterion 11 by `rfc/intent-presets.md` (accepted 2026-08-22),
  which discharges D532/D715 whole and re-states the negative-fixture obligation at its
  criterion 2. §1's HEAD census and §§2.5, 3.5's audit findings are retained as history only.
  Three items were rehomed at supersede rather than archived with the document: the shape-marker
  live-surface register row (§3.5 → `rfc/archive/live-marker-quality.md` §3.1), the shape-catalogue
  scope question (Open question 2 → ledger), and the three `design/05` law-5 naming requests
  (§Deviations → ledger, owner-tier).
```

**Status line, replacing `assistance-controls.md:3-5`:**

```
- **Status:** superseded 2026-08-23 — both halves landed as children; no obligation remains.
  D308/D309 and the on-ramp default shipped in `assistance-control-wiring` (implemented
  2026-08-22); D532/D715's per-context ceiling is `intent-presets`' (accepted 2026-08-22). §4.3
  specified the owner-rejected option A and is superseded rather than fixed. Retained as the
  2026-08-16 HEAD census that produced the D307/D308/D309 dispositions. *(Prior line: draft —
  returned to author 2026-08-22 on D715.)*
```

**Register row — move from the Active table (`rfc/README.md:30`) to the Archive table
(`rfc/README.md:325+`), whose columns are `| RFC | Status | Canonical docs link |`:**

```
| `archive/assistance-controls.md` | superseded 2026-08-23 — the returned parent of `assistance-control-wiring` (implemented) and `intent-presets` (accepted); both children landed and no obligation remains. **Its deliverable was the disposition, and the disposition held:** D307/D308/D309 were bucketed NEEDS-OWNER on `DESIGN-GAP:` markers, and reading them against `design/05` proved two were defects against rulings that already shipped — D308's four implemented layers with an unwired fifth, and D309's `SILENT_ASSISTANCE.guided: "off"` that the code did not honour. Both shipped 2026-08-22. Its one genuine owner question became D532, the owner ruled option C, and §4.3 — which still specified option A — is superseded by `intent-presets` rather than repaired. Three items were rehomed at supersede, not archived with it: the shape-marker register row, the shape-catalogue scope question, and three `design/05` law-5 naming requests | `docs/adaptive-guidance.md`, `docs/drill-client.md` (both via `archive/assistance-control-wiring.md`) |
```

Note the Active table's own rule (`rfc/README.md:7-9`): status cells begin with one of the seven
lifecycle tokens. `superseded` is one of them (`rfc/0000-rfc-process.md:52,64`), so this row passes
`make status-parity` and `make register-check` as written.

### 1.6 Which ledger rows flip — and one that must NOT

| row | current | action at supersede | why |
|---|---|---|---|
| **D308** | ✅ closed 2026-08-22 by `assistance-control-wiring` (`BACKLOG.md:1046`) | **none** | already flipped by the child's own commit |
| **D309** | ✅ closed 2026-08-22 by `assistance-control-wiring` (`BACKLOG.md:1047`) | **none** | already flipped |
| **D715** | 🐞 open (`BACKLOG.md:537`) | **flip ✅** | D715's text is an *instruction to this RFC*: "The RFC must split its independent D308/D309 controls from F5 **or** adopt F5's compiled workflow input and pointwise clamp; it may not implement choice A after choice C was ruled." **Both disjuncts have now happened** — split (wiring, implemented) and adopt (`intent-presets`, accepted) — and the supersede removes the option-A text the row objects to. Close it against the *disposition*, with the residual named: the exact clamps are **D971**'s, not D715's |
| **D532** | 💡 owner-ruling row (`BACKLOG.md:654`) | **leave 💡, or flip only on `intent-presets`' completion** | `intent-presets.md:449` reserves D532's closure for **its own landing commit**. That commit has not happened: the RFC is `implementing`, and D971 blocks "the exact config projections and clamps, compiler, preset pill, and footer" (`intent-presets.md:3`). **Flipping D532 here would claim an implementation that does not exist.** Not this commit's row |
| **D307** | 🐞 open (`BACKLOG.md:1045`) | **leave 🐞 open — retarget the row, do not close it** | see below |

**D307 must stay open, and the reason is a finding rather than a formality.** Its half (b) — six
identically-silent defaults — is closed by wiring's `PROFILE_DEFAULTS`. Its half (a) is not:

> (a) **`permittedAssistance` takes `sessionKind` and never reads it** — the body […] uses only
> `role` and `deliveryOpen` (`BACKLOG.md:1045`)

At HEAD, `packages/runtime/src/assistance.ts:22-34`: `AssistanceContext` now declares **both**
`sessionKind` **and** `workflowContext: WorkflowContextId` (`:23-24`) — and the body of
`permittedAssistance` (`:30-34`) reads **neither**. It uses `deliveryOpen`, `seatedInContest`,
`role` and `reviewing` only. `packages/runtime/src/presets.ts` landed `WORKFLOW_CONTEXT_POLICIES`
with `moduleCeiling` (`:41-49`) but **no `configClamp` field** and **no `compileAssistance`** —
exactly the surface `intent-presets` §3 specified and D971 blocks.

So the declared-and-unread defect D307(a) names has not been fixed; it has **moved from
`sessionKind` to `workflowContext`, and the context now has two unread fields instead of one.**
That is the precise shape D532 refused — *"Refused: pinning the no-op (a guard that cannot fail is
not a decision)"* (`BACKLOG.md:654`). Closing D307 on the supersede would score a live defect as
discharged.

**Recommended D307 action: amend the row in place** — mark half (b) closed by
`assistance-control-wiring`, restate half (a) against `workflowContext` at
`assistance.ts:23-24,30-34`, and retarget its owner from `assistance-controls` to
`intent-presets`/**D971**. Do not flip.

---

## Part 2 — `measurement-records` vs `claim-semantic-anchors`

### 2.1 The real state of `measurement-records`, established

Body Status (`rfc/measurement-records.md:3`), in full:

```
- **Status:** draft
```

That is the whole line. But `rfc/README.md:28`:

> `measurement-records.md` | **draft — returned to author 2026-08-16** (core sound; 3 open
> questions + D391 block acceptance) […] **Cross-reviewed 2026-08-16: sound in its core, RETURNED
> TO AUTHOR** — three open questions must be ruled before `accepted`

**The drift is known and already indicted.** `planning/rfc-drafting-queue.md:532-536` — ledger row
**D500** — ran `make status-parity` by hand over all nine Active RFCs and found *"eight agree;
`measurement-records.md` body reads `- **Status:** draft` while its register cell reads 'returned to
author 2026-08-16'"*.

Under `rfc/0000-rfc-process.md:64-67` the state vocabulary is closed at seven tokens and *"everything
after the first colon, comma, semicolon or parenthesis is prose"* — so "returned to author" is
prose, and both cells carry the same **state** (`draft`). Status-parity therefore passes on the
token while the *return itself* lives only in the register. Corroborated at
`planning/platform-alignment/active-rfc-audit.md:91` ("**returned/draft**"),
`rfc-graph.md:35` and `rfc-completion-refresh.md:63`.

**Real state: `draft`, returned to author 2026-08-16, four unresolved blockers, no
implementation.** Its blockers (`measurement-records.md:1448-1490`): OQ1 packs-vs-shape
`measurements` surface ("Resolve before `accepted`"); OQ2 subject too narrow, **promoted to a
blocker at cross-review** ("Resolve before `accepted`"); OQ3 the permanent-warning asymmetry ("Named
as a real asymmetry, not resolved"); OQ4 does `census.firesInShape@v1` belong at all ("Resolve
before `accepted`"). `make census-check`, the tool its §3b hangs on, **does not exist** — the
Makefile's `.PHONY` list (`Makefile:1`) has `expression-census` and no `census-check`.

The commit history is worth one line: `fb7a147` (2026-08-21, "Record measurement RFC cross-review
return", +277/−64) landed the cross-review body edits **five days after** the review dated in the
changelog, and did not update the Status line. `planning/rfc-drafting-queue.md:578-579` caught it in
flight ("277 uncommitted insertions in the working tree").

### 2.2 What each document does with the array — both quoted at HEAD

**Shipped, `apps/server/src/sourcing/claim-binding.ts:15-21`** — exactly 15 members:

```ts
export const CLAIM_ASSERTION_KINDS = Object.freeze([
  "tablebase.category@v1", "tablebase.dtm@v1", "tablebase.dtz@v1", "tablebase.pieceCount@v1",
  "tablebase.moveCategory@v1", "tablebase.lineUniformCategory@v1", "tablebase.moveCensus@v1",
  "tablebase.uniqueMoveOfCategory@v1", "engine.centipawns@v1", "engine.depth@v1",
  "explorer.total@v1", "explorer.scorePct@v1", "explorer.moveSharePct@v1",
  "explorer.window@v1", "explorer.ratingBand@v1",
] as const);
```

**`measurement-records` — grows it by six.**

`:513-514`:
> `CLAIM_ASSERTION_KINDS` (`apps/server/src/sourcing/claim-binding.ts`) gains six members. Each
> takes a **census site** […] and returns an **integer**.

`:342` (register-claims table):
> | **`CLAIM_ASSERTION_KINDS`** | **+6 members** | A **code-level frozen array**, not a versioned
> resource — the same standing that `rfc/archive/opening-evidence-path.md` §0 gives
> `EVIDENCE_KINDS`. §3b. |

Acceptance criterion 3, `:1385-1387`:
> `CLAIM_ASSERTION_KINDS` contains **exactly 21 members: the shipped 15 plus the six `census.*`**,
> and **no `census.observation@v1`, `census.satisfiability@v1`, or any percentage/ratio kind** —
> asserted as an exact-set equality so a later addition is a deliberate act (§3c, law 8).

The six are `census.fires@v1`, `census.firesInPack@v1`, `census.packsFiring@v1`,
`census.firesInShape@v1`, `census.of@v1`, `census.corpus@v1` (`:516-523`).

**`claim-semantic-anchors` — deletes it.**

`:135-138`:
> One canonical list in `packages/runtime/src/evidence-catalog.ts` replaces
> `CLAIM_ASSERTION_KINDS`; the server imports the typed identities instead of copying strings. The
> table's unit is **one currently supported claim assertion meaning**; total **15**, set-equal to
> the 15 members shipped by `CLAIM_ASSERTION_KINDS` at drafting HEAD.

Acceptance criterion 1, `:335-336`:
> The canonical claim-fact projection list is set-equal to Appendix A (15/15), and the old
> `CLAIM_ASSERTION_KINDS` definition has **zero production occurrences**.

**The two acceptance criteria are literal contradictions on one symbol:** "exactly 21 members"
versus "zero production occurrences."

### 2.3 Is the collision genuine, or stale text in the older draft?

**Genuine, and structural — not a stale-text artifact.** Three checks:

1. **The older draft is not stale *about the array*.** Its cross-review sweep re-verified the count
   at source: *"no `census.*` assertion kind exists in `CLAIM_ASSERTION_KINDS` (verified: a frozen
   **15**-member array of `tablebase.*` / `engine.*` / `explorer.*` only)"* (`:343`). HEAD still
   reads 15. Both documents describe the same true HEAD; they disagree about what to do to it.
2. **The conflict survives renaming.** It is not "one adds, one renames." Anchors changes the *unit
   of admission*: `:70-72` — *"A **claim fact** is one admitted F1 projection evaluated from
   evidence records already present in **the pack's ledger**."* A census reading is a fact about all
   56 packs at once, and `measurement-records:253-254` says so itself: *"A census reading is a fact
   about **all 56 packs at once**, and no caller ever holds more than one."* A `census.*` fact has
   no ledger record and cannot inhabit `ClaimFactRefV1` as defined.
3. **The validation postures are incompatible.** Anchors `:254-255`: *"Any failure rejects the
   whole binding. There is no partially admitted machine claim."* `measurement-records` §3b's
   deferral clause (`:1076-1083`) requires the opposite: *"When `validateClaimBindings` is called
   without a census report, a `census.*` span is **skipped and counted**, never refused."* A
   skipped-and-counted span is precisely a partially admitted machine claim.

So the collision is real at three independent layers: the array's cardinality, the definition of a
fact, and the all-or-nothing rule. Confirmed independently by a prior pass at
`planning/exploration/log.md:6053-6055`: *"it collides with `measurement-records`' plan to grow
`CLAIM_ASSERTION_KINDS` from 15 to 21; the two cannot both land."*

### 2.4 Which approach is better supported

**Shipped code — anchors, decisively.**

- `claim-binding.ts:15-21` ships exactly the 15 anchors' Appendix A is set-equal to. The six
  `census.*` kinds exist nowhere; `measurement-records`' own sweep confirms all its new literals
  occur **zero** times (`:343`).
- **The F1 manifest already registers the consumer anchors narrows.**
  `packages/runtime/src/evidence-catalog.ts:889` declares `authoring.claim_binding` with exactly
  the four projections anchors §3 names — `sourcing.ledger.engine_eval`,
  `sourcing.ledger.tablebase_result`, `sourcing.ledger.explorer_position_census`,
  `theory.opening_identity.record`. Anchors' §3 removal list is one-to-one against a **shipped**
  registry entry. `measurement-records` predates the F1 manifest and never mentions it: its
  register table (`:340`) reasons about `EVIDENCE_KINDS` and the sidecar, not about projections.
- **The seal anchors depends on is shipped.** `EVIDENCE_GENERIC_BYPASS` and `renderEvidenceItems`
  are live at `packages/runtime/src/evidence-contract.ts:401,405`, which is what makes anchors'
  criterion 15 assertable today.
- **`learner-modules` (accepted) puts its registry in the same file** anchors §3 puts the canonical
  projection list in (`evidence-catalog.ts`), so anchors composes with the module foundation
  rather than forking a second vocabulary.

**Measured evidence — anchors, and it is evidence *against* the mechanism `measurement-records`
would extend.** The D1007/D1008 executable audit found **one** validator-green candidate among 43
record-kind co-presence rows, **and that one is semantically false** — "the one common mate" bound
to DTM 1 (`claim-semantic-anchors.md:36-37,46-48`). Adding six more kinds to
`CLAIM_ASSERTION_KINDS` extends the licence that audit refuted. Under law 8 that is the wrong
direction on measured grounds, not on taste.

**Drift — against `measurement-records`.** Its acceptance criterion 2 (`:1380-1384`) asserts
`DRILL_RUN_SCHEMA_VERSION` *"unchanged at `0.16`"* and `STORAGE_VERSION` *"reads `22`"*. At HEAD:
`packages/schema/src/index.ts:1` is **`0.17`** and `apps/server/src/storage.ts:631` is **`25`**. The
criterion fails at HEAD by its own stated rule — *"The test must assert the values the tree has, not
the values this RFC remembers; that is the whole point of the criterion and the draft's version of
it demonstrates the failure it exists to catch."* Its one surviving lane claim, shape-entry **0.4**,
is still free (`SHAPE_ENTRY_SCHEMA_VERSION = "0.3"`), so the drift is repairable — but an author
round is required regardless of this collision.

**What `measurement-records` has that anchors does not:** ownership of five closed-by-it ledger rows
(D368, D103, D157, D151, D154/D161 — `:19-33`) and four more per
`planning/rfc-drafting-queue.md:480` (D368, D386, D391, D392), plus a central refutation that
*"reproduces independently"* (`rfc/README.md:28`). Its core is not in question. Its **binding
mechanism** is.

### 2.5 The resolution options, priced

| # | option | cost | verdict |
|---|---|---|---|
| **R1** | **`measurement-records` narrows: drop the `CLAIM_ASSERTION_KINDS` growth entirely; make `census.*` a `census-check`-local vocabulary** | **Low.** Rewrite §3a's framing sentence, §Register table row `:342`, criterion 3, and §3b's deferral clause. No change to its §4/§5 measurement-record format, its shape-entry 0.4 lane, or any of the five rows it closes | **Recommended.** See 2.6 |
| **R2** | **anchors absorbs the six as `sourcing.claim.census.*` projections** | **High, and it breaks anchors at three load-bearing points.** §1's fact definition would have to stop requiring "evidence records already present in the pack's ledger"; §5's "no partially admitted machine claim" would have to admit the skip-and-count deferral; Appendix A's "set-equal to the 15 shipped" anchor and criterion 1 would both dissolve. It also forces the runtime `PackRegistry.loadDefault` path (`measurement-records:1064`) to reason about a census report it *"is not admissible at runtime, at any severity"* to build | **Refuse.** It pays anchors' whole architecture to buy a family that R1 shows needs nothing from it |
| **R3** | **one supersedes the other** | — | **Refuse: not a supersession relation.** The subjects are disjoint. Anchors governs facts about a chess position drawn from a pack's evidence ledger; `measurement-records` governs facts about the corpus drawn from a census report. Neither contains the other |
| **R4** | **withdraw `measurement-records`** | **High and destructive.** It is the only owner of D368, D103, D157, D151, D154/D161, D386, D391, D392 and shape-entry lane 0.4 (`rfc/README.md:150`), and `f3-derivation.md:782` (G19) requires F3 to *reconcile* it, not bury it | **Refuse** |

### 2.6 Recommendation — R1, and it is not an owner call

**Recommend R1: `measurement-records` drops the `CLAIM_ASSERTION_KINDS` growth. `claim-semantic-anchors`'
deletion of the array stands unmodified.**

**This does not turn on product intent**, and the decisive evidence is inside `measurement-records`
itself. Its §3b enumerates the callers of `validateClaimBindings` — *"the callers are exactly two"*
(`:1058-1064`):

| caller | why it cannot build a census report (its words) |
|---|---|
| `apps/server/src/sourcing/check.ts:198` | *"it is invoked on one pack or one candidate directory; the corpus walk is not its job"* |
| `apps/server/src/pack-registry.ts:266` | *"a 192-subject × 827-position census on every pack load is not admissible at runtime, at any severity"* |

And its own deferral clause (`:1078-1083`) states the consequence: with no census report, a
`census.*` span is *"**skipped and counted**, never refused"*, emits `CENSUS_ASSERTION_DEFERRED`
(info), and *"does not count toward the instrument-attribution tallies."*
`CENSUS_ASSERTION_UNEVALUABLE` *"fires **only** in `census-check`, where a report is guaranteed
present."*

**Therefore: at both shipped call sites of `validateClaimBindings`, a `census.*` member is never
evaluated.** Membership in `CLAIM_ASSERTION_KINDS` buys `measurement-records` exactly one thing —
the array is global, so *"once the six `census.*` members exist a pack ledger can declare one, and
the runtime registry will evaluate it on load"* (`:1069-1070`) — and §3b treats that reachability as
a **hazard to be suppressed**, not a capability to be gained. R1 removes the hazard at the source
instead of deferring around it. The six kinds move to the one tool that can evaluate them, which
`measurement-records` already names as their real home.

**Cost to `measurement-records` of R1: it loses nothing it was using.** The format half — the
`measurements` property, `measurementRecord`/`measurementSpan`/`measurementDisposition` `$defs`,
shape-entry lane 0.4, the `illustrative`/`superseded`/`abstained`/`closure` dispositions, the
4-vs-8 refutation — is untouched. It closes the same five rows. What changes is where the six kinds
are declared and which tool refuses them.

**Two consequences the acceptor should book, not discover:**

1. **R1 strictly improves `measurement-records`' own position.** Its §Register table's
   `CLAIM_ASSERTION_KINDS` row and the `SourcingIssue.severity` `+1 member` row (`:344`, adding
   `"info"` solely to carry `CENSUS_ASSERTION_DEFERRED`) both **disappear** under R1, since the
   deferral exists only to handle a span that can no longer reach the two callers. Its
   "claims nothing else" surface gets smaller.
2. **One owner-shaped residue survives and R1 does not touch it.** `measurement-records` OQ1
   (`:1448-1461`) — do packs get the `measurements` surface, or is `CLAIM_POINTER_INVALID` widened
   to `PROSE_POINTERS`, or is it deferred? — is a real format/product call ("that trade should be
   ruled on explicitly rather than inherited"). It is orthogonal to this collision and remains one
   of the four blockers on the RFC's return. **R1 resolves the collision; it does not un-return the
   RFC.**

**Sequencing note that makes R1 nearly free.** Neither document can be accepted today: anchors is
blocked on F3 (Part 3), and `measurement-records` has four open questions it must rule before
`accepted`. So no race exists. **R1 should be written into `measurement-records`' next author
round, which is required for OQ1–OQ4 anyway** — the narrowing costs that round roughly four edits.
Nothing needs to be done to `claim-semantic-anchors` for this half at all.

**If the owner disagrees, the trade-off to state is this:** R1 assumes corpus-census facts and
chess-position facts are different kinds of thing that should not share an admission path. The
contrary position — that a learner-visible numeral is a learner-visible numeral and all of them
should pass one byte-equality gate — is coherent, and it argues for R2. The price of R2 is that
anchors must admit a fact with no ledger record and a validation path that skips rather than
refuses, which is the two properties the D1008 audit's failure was made of.

---

## Part 3 — Does D1058 unblock `claim-semantic-anchors` §7?

### 3.1 What §7 needs

`claim-semantic-anchors.md:302-305`, verbatim:

> F3 must supply the **accepted** compatibility declaration that distinguishes the old and new
> binding semantics while the top-level evidence sidecar remains `tabiya.sourcing.evidence.v1`, or
> require a top-level move. This RFC does not choose a competing syntax. **Acceptance is blocked
> until §7 can name the literal F3 declaration and refusal behavior.**

§7 defers **entirely** — it defines no fallback and no provisional syntax. Contrast the parts of §7
it *does* decide for itself (the V1/V2 dispatch-by-presence rule at `:282-289`, Stage A/Stage B at
`:291-300`, the migration planner at `:307-310`), all of which are complete and F3-independent.

### 3.2 What D1058 actually settled

`design/BACKLOG.md:390`:

> **D1058 ⚖️ | OWNER RULING 2026-08-23: the capability stamp lives IN THE PACK, and the Gate F cost
> is accepted knowingly.** F3's central fork ruled for binding integrity: the stamp sits inside
> `digestDrillPack`'s canonicalization so it cannot drift from the content it describes. **Stated
> cost, accepted at the option:** this claims a **third pack-schema lane** […] pushing **Gate F
> clause 1** […] from two-deep to three […] The sidecar alternative was refused despite preserving
> clause 1, because absence would have defaulted permissive […] | ⚖️ ruled — F3 drafts with a
> pack-lane claim

Mirrored at `planning/rfc-drafting-queue.md:709-711`. D1058 resolves **G1** of the derivation
dossier (`planning/platform-alignment/f3-derivation.md:762` — *"Lane, sidecar, or derivation? […]
F3 cannot be drafted without this answer and it is not claude's to make"*). Its own status cell
says what it is: **a licence to draft.**

### 3.3 Verdict: not unblocked. Three reasons, in increasing severity.

**(1) The F3 RFC does not exist on disk.** `rfc/f3-capability-contract.md` is absent — not tracked,
not untracked, no separate worktree (`git worktree list` shows one worktree at `main`, `d82f2bb`).
`rfc/README.md` has no F3 row. So there is no Status line to cite and no section to quote. The fork
is drafting; the work has not landed. **Nothing can be named yet in any case.**

**(2) D1058's subject is a different surface from §7's.** D1058 places the **pack** capability stamp
inside `digestDrillPack`'s canonicalization. §7 asks for a compatibility declaration for the
**evidence sidecar** — *"while the top-level evidence sidecar remains
`tabiya.sourcing.evidence.v1`, or require a top-level move."* Pack and sidecar are different
artifacts. D1058 constrains where a stamp lives in one of them and is silent on the other.

**(3) And this is the finding that should change what gets commissioned: the declaration §7 needs
is not currently in F3's recommended scope.** `f3-derivation.md:798-810` lists six in-scope items —
capability id namespace with version-as-data; complete capability enumeration; the
pack-required/runtime-supported handshake with typed refusal; `make migration-plan`/`-check`/
`-apply`; typed deprecation with successor-or-refusal; the D566/D632 regression test. **None is an
evidence-sidecar compatibility declaration.** `f3-derivation.md` never mentions
`claim-semantic-anchors` at all (zero hits). The nearest adjacent gaps are G4 (`:766` — three
spellings, one idea), G5 (`:767` — the version is an assertion literal, not data) and G16 (`:780` —
`EVIDENCE_KINDS` has no version axis), none of which is the same thing.

So `claim-semantic-anchors` is waiting on a clause that no one has yet been asked to write. **If the
F3 draft ships its recommended scope unchanged, §7 will still be blocked on the day F3 is
accepted.**

### 3.4 Drafted vs. accepted — the answer, stated explicitly

The RFC is internally inconsistent about which it needs, and the difference is operational:

| site | text | requires |
|---|---|---|
| `:302` | "the **accepted** compatibility declaration" | accepted |
| `:393` | "refresh this draft against **the accepted F3 contract**" | accepted |
| `:31` | "Refresh this block if **F3's accepted contract** makes that seam a registered resource" | accepted |
| `rfc/README.md:14` | "must be refreshed onto F3's **accepted** compatibility declaration before acceptance" | accepted |
| `:16` | "must **land or provide its final declaration syntax**" | drafted-with-final-syntax |
| `:4-5` | "ready for independent cross-review after the in-flight F3 capability RFC **supplies its literal compatibility declaration syntax**" | drafted-with-final-syntax |

**Reading them together — and this is the answer to the question:** a *drafted* F3 stating a
**final** literal declaration syntax is enough to rewrite §7 and send `claim-semantic-anchors` to
**independent cross-review**. Only an *accepted* F3 is enough to **accept**
`claim-semantic-anchors`. Four of six sites say accepted, including the register cell, and the
register cell governs.

**One criterion settles it beyond the header's ambiguity.** Acceptance criterion 7 (`:350-351`):

> Changing a renderer or projection version makes the previous binding fail closed or **appear in
> the explicit F3 migration plan**; no "latest" lookup exists.

That is untestable until F3's migration planner **exists as an artifact** — F3 scope item 4,
`f3-derivation.md:806`. A name in a draft cannot satisfy it. **`claim-semantic-anchors` needs F3
accepted, not merely drafted.**

### 3.5 F3 is not a §7-only coupling — four more sites

Stated because the acceptor will otherwise refresh §7 and believe the RFC is clear:

| site | what depends on F3 |
|---|---|
| `:30-31` | The **`tabiya-claims: none` verdict is conditional on F3.** *"Refresh this block if F3's accepted contract makes that seam a registered resource."* D1058 gives F3 a pack-schema lane; whether it also makes the sidecar declaration a registered resource is unresolved. If it does, this RFC's claims block stops being `none` |
| `:236` | Renderer output/semantics changes require *"a renderer version bump **under F3**"* |
| `:351` | Criterion 7, above — needs the F3 migration plan to exist |
| `:386` | Discharge **D1** — *"Name the literal F3 capability/version declaration and top-level ledger compatibility rule"*, owner `planning/platform-alignment/`, recorded at *"the F3 RFC refresh commit"*, **discharged column empty** |

### 3.6 What the acceptor can do next — stated explicitly

**Cannot:** accept `claim-semantic-anchors`. Two independent blockers stand — F3 (Part 3) and the
`CLAIM_ASSERTION_KINDS` collision (Part 2). D1058 clears **neither**.

**Can, and should, in this order:**

1. **Tell the F3 fork that `claim-semantic-anchors` §7 is a customer**, and that the
   evidence-sidecar compatibility declaration is **absent from `f3-derivation.md`'s recommended
   scope cut** (`:798-815`). This is the cheapest moment to add it — while F3 is being drafted —
   and it is the single action that most changes the critical path. Without it, F3 acceptance
   leaves §7 blocked.
2. **Resolve the collision now, on the `measurement-records` side (R1).** It needs no F3, no owner
   ruling and no change to `claim-semantic-anchors`. It folds into an author round that
   OQ1–OQ4 already require. Doing it now means F3's arrival leaves exactly one blocker instead of
   two.
3. **Land the `assistance-controls` supersede** (Part 1) with O1/O2/O3 rehomed, and **amend D307
   rather than closing it** (§1.6). Independent of both F3 and the collision.

**A note on ordering that the packet would be dishonest to omit:** `f3-derivation.md:782` (G19)
already requires F3 to *"reconcile the three lane-adjacent RFCs […] `measurement-records` (returned,
uncommitted revision)."* R1 does part of G19's job early and from the better-evidenced side. It
should be recorded as such so F3 does not re-open it.

---

## Summary of recommended actions

| # | action | blocking? | owner |
|---|---|---|---|
| 1 | Supersede-and-archive `rfc/assistance-controls.md`; body lines and register row drafted at §1.5 | no | register owner |
| 2 | Rehome **O1** — shape-marker row into `rfc/archive/live-marker-quality.md` §3.1 | **yes, same commit as 1** | register owner |
| 3 | Rehome **O2** — new ledger row, shape-catalogue scope (law 4) | **yes, same commit as 1** | register owner |
| 4 | Rehome **O3+O4** — one ledger row carrying the three `design/05` law-5 naming requests | **yes, same commit as 1** | ledger; the amendments themselves are **owner-tier** |
| 5 | Flip **D715** ✅; **amend D307** (half b closed, half a retargeted to `workflowContext`/D971); leave **D532** 💡 | with 1 | register owner |
| 6 | **R1** — `measurement-records` drops the `CLAIM_ASSERTION_KINDS` growth; `census.*` becomes `census-check`-local | no; fold into the required author round | `measurement-records` author |
| 7 | Ask the F3 fork to bring the evidence-sidecar compatibility declaration into F3's scope | **yes — it is the critical path for `claim-semantic-anchors`** | platform-alignment |
| 8 | Append this disposition to `planning/exploration/log.md` when 1–5 land | per the completion protocol | whoever lands 1 |
