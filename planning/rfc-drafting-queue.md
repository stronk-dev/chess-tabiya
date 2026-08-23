# RFC drafting queue — the unowned NEEDS-RFC rows, collapsed into documents

**Written 2026-08-16 against `2160d2c`.** Input: `planning/defect-triage.md` §4 (47 NEEDS-RFC rows)
and every row it names in `design/BACKLOG.md`. This is a **drafting queue, not a spec and not a
fix**. Nothing in the tree was changed to produce it; no RFC was drafted; no ledger row, register
row or line of code was touched.

**The tree moved under this pass, for the fourth time in three days.** I started against `790a4de`;
`ef0305f` and then `2160d2c` landed while I worked, and `2160d2c` created `planning/WORK.md`, which
**queues [[D477]] and [[D487]] as `make` targets at item 0**. Both were candidate documents in my
draft of this file. I have reconciled rather than duplicated — see §2.1 and §4 — and the reconciling
is itself the evidence for [[D416]]'s *"name the rows you flip in the commit subject"*. All counts
below are as of `2160d2c`.

**Reading convention.** Per [[D419]] and [[D459]] the defect table is
`| <id> <status> | <description> | <disposition note> |` and **column 3 is not a status**. Every
row below was read at **column 1**. Where I opened the file and checked the symbol, the claim is
marked `[V]` with the symbol named. Where the claim is the triage's or the row's and I did not
re-derive it, it is marked `[triage]` or `[row]` and belongs to them, not to me.

---

## 0. Ranking rationale — read this before the list

The owner's stated bias is that **things that unblock a user, or that stop a class of defect from
recurring, outrank things that tidy**. Applying it produced one non-obvious result: **the
top-ranked document has no user consequence at all and is still first**, because it is the only one
whose absence is actively mis-directing the other six.

Three ordering forces, in the order they bind:

1. **A document that cannot pick a lane cannot be drafted.** Five of the seven documents below claim
   a pack, run or shape-entry schema lane. I checked all four shared-resource registers against the
   tree and **three of the four are wrong at HEAD** (§5). Until that is fixed, every draft here picks
   its lane from a register that does not know what the tree holds — the exact collision class those
   registers exist to prevent.
2. **A blocked user beats a blocked implementer.** [[D476]] leaves the claim-binding wave ownerless,
   and owner ruling [[D462]] requires that wave to run *before anyone plays*. `planning/WORK.md` §3
   names it *"Nobody owns it."* That is a user gate held open by a missing lifecycle state — cheap
   to write, high consequence.
3. **A live security-shaped defect beats a format gap.** [[D216]] lets an anonymous link holder act
   as the sharing host on a surface nobody scoped for them; [[D450]] states the permission rule that
   would have caught it, in prose that nothing reads.

**Named as pure hygiene, so it is not smuggled up the list:** [[D460]] (*count statements, not
sites* — a specification technique) and [[D478]] (*assert before replacing* — an agent-discipline
rule). Neither has a user or defect-class consequence beyond how carefully a document is written.
Both ride as passengers in RFC-2 rather than justifying it. **No proposed document here is pure
hygiene end-to-end** — the two that would have been (a status-parity checker, a derived work
register) are now queued as `make` targets rather than RFCs, which is the correct home for both and
is explained in §2.1.

---

## 1. The headline

| | Count |
|---|---|
| Rows in triage §4 (NEEDS-RFC) | 47 |
| Already owned by an active RFC — **do not draft** | 18 (`graduation-clearance` 14, `measurement-records` 4) |
| **Unowned rows I routed** | **40** |
| — into documents | 28 |
| — closed on my own verification | 1 |
| — returned to another lane | 11 |
| **Proposed documents** | **7** |
| **Collapse ratio** | **28 rows → 7 documents (4 : 1)** |
| My spot-check rate | **25 of 40 verified at a named symbol or file — 63%** (§6) |
| Rows found stale or materially wrong by that check | **3** (plus 5 facts in no row at all) |

**Why my 40 ≠ the brief's ~29.** The triage counts several entries as halves
(`D470-format-half`, `D106-refusal-half`, `D430-removal-half`, `D428-union-half`) and names some ids
in two sections. I expanded every half back to a whole row so the destination is unambiguous, and I
added the two instrument rows the brief asked me to judge ([[D477]], [[D487]]) plus two rows the
triage routed elsewhere that belong to a document here ([[D433]], [[D461]]). The arithmetic is
stated per document so it can be disagreed with per row.

**Verified shared-resource state, at the symbol, myself:**

| Resource | Head in the tree | Register says | Next free |
|---|---|---|---|
| Pack schema | **0.27** — `packages/schema/src/index.ts:2 DRILL_PACK_SCHEMA_VERSION`, `schemas/drill_pack.schema.json` `$id: urn:chess-tabiya:schema:drill-pack:0.27` `[V]` | 0.28 claimed and held by `graduation-clearance`; 0.29 next free `[V]` | **0.29** |
| Run schema | **0.17** — `schemas/drill_run.schema.json` `$id: …drill-run:0.17` `[V]` | **no register exists** — run versions are recorded only inside migration rows `[V]` | 0.18 |
| Shape-entry schema | **0.3** — `schemas/shape_entry.schema.json` `$id: …shape-entry:0.3` `[V]` | **no register exists**; last registered change is 0.2 (`archive/predicate-wave-2.md`) `[V]` | 0.4 claimed by `measurement-records` → **0.5** |
| Migration / `STORAGE_VERSION` | **23** — `apps/server/src/storage.ts:407`; migrations array ends `{version: 23}` at `:2345` `[V]` | 23 recorded implemented; a *position* is claimed, never an integer ([[D423]], [[D447]]) `[V]` | position behind `teacher-surface` |
| Evidence-ledger sidecar | `EVIDENCE_KINDS` **7 members**, `apps/server/src/sourcing/types.ts:57-65` `[V]` | **no register, no version** at all `[V]` | — |

---

## 2. The ranked queue

### 2.1 — First, what `2160d2c` already took off this list

`planning/WORK.md` §0 queues **`make status-parity`** ([[D477]]) and **`make work-index`**
([[D487]]) as `make verify` targets. Both were documents in my draft. **I am withdrawing them as
RFCs, and I think the queue is right**, on the triage's own reasoning (§B4): *the guard is a lint,
not a rule change*. A script that compares two strings changes no contract and claims no shared
resource; law 1 does not gate a lint.

**What does NOT dissolve with them, and stays as RFC-1 below:** the registers those checks would
read **do not exist**. `make status-parity` can run today. `make work-index` can run today. But
neither can check a run-schema lane, a shape-entry lane or the evidence-ledger vocabulary, because
there is no register for any of the three `[V]` — and adding a register to `rfc/README.md` is a
change to the normative structure that governs every future draft's landing order, which is
RFC-shaped and which [[D385]] explicitly asks to be *"promote[d] to register doctrine"*.

So: **the checkers are implementation and already queued; the registers and their doctrine are
RFC-1.** They should land in that order — checker first against the registers that exist, RFC-1
second to give it the other three.

---

### 1 — `shared-resource-registers` · claims nothing versioned · **write this one first**

**Scope.** Create a register for every shared, single-writer resource that has none, and record the
three counting rules the existing registers were found to be missing.

| Row | Title |
|---|---|
| [[D376]] | The shape-entry schema is a shared versioned resource with no register |
| [[D385]] | A register-only lane has no precedent and now has a ruling against it |
| [[D423]] | Three documents now hold one migration position and the register cannot see it — *addendum: the register counts DOCUMENTS and should count CLAIMS* |
| [[D447]] | `learner-rating` §9 says three documents hold `STORAGE_VERSION + 1` and `storage.ts` says two |
| [[D384]] | Three active drafts carry a stale `STORAGE_VERSION`, and two contest one migration position — **register half only**; its collision half is superseded by [[D423]]/[[D447]] (triage §8) |
| [[D461]] | `rfc/README.md` asserts in two consecutive rows that 0.28 is both claimed and free — **discharged by verification, close it** (§5) |

**Rows: 6 (5 specified, 1 closed on evidence).**

**Claims:** nothing versioned. No pack lane, no run lane, no shape-entry lane, no migration position.
It *creates* three register tables (run schema, shape-entry schema, evidence-ledger vocabulary) and
records doctrine; it changes no schema. This is [[D385]]'s question answered in the affirmative for
the only case where a register-only document is correct — one that adds registers rather than a
`$id`.

**Three doctrine rules the document must record, each measured:**
- **Count claims, not documents** ([[D423]] addendum) — `learner-rating` carries two independent
  table sets, so three claimant documents are four claims on one position.
- **A register must record a claimant *leaving*** ([[D447]]) — `opponent-contracts` landed migration
  23 at `6ba0736` and the register could not see the contest shrink from three to two.
- **A register-only lane is not a lane** ([[D385]]) — every pack lane 0.3→0.27 carried a
  `$defs`/enum/property change; version events live in a field, not the `$id`.

**Dependencies and landing order.** Depends on nothing. **Every other document in this queue depends
on it** — five of the seven pick a lane, and §5 shows three of four registers are wrong right now.
Land it after `make status-parity` (which can run against the register that already exists) and
before any other draft here.

**Size: three tables plus one doctrine section — small.**

**Exploration gate: PASSES.** All five specified rows are ledgered defects with first-hand evidence,
and I re-derived every one of them against `rfc/README.md` and the tree constants. Nothing here is an
open question — each row names its own remedy.

---

### 2 — `rfc-lifecycle-completion` · claims nothing versioned · amends RFC-0000

**Scope.** Three closeout states the lifecycle cannot express, plus the two conventions that were
paid for in incidents.

| Row | Title |
|---|---|
| [[D476]] | An RFC can be archived while a wave it owns is unrun, leaving the wave ownerless — and one is ownerless right now |
| [[D475]] | The RFC lifecycle cannot express a specification whose completion depends on a content wave |
| [[D433]] | An RFC's *unblocking* has no closeout protocol, so `rfc/README.md` held a stale block for a day |
| [[D478]] | A scripted edit that silently no-ops is worse than no edit — *hygiene passenger* |
| [[D460]] | Both new `permittedAssistance` inputs were mis-specified the same way; count statements, not sites — *hygiene passenger* |

**Rows: 5** (3 specified, 2 hygiene conventions).

**Claims:** nothing versioned. It amends `rfc/0000-rfc-process.md` §RFC lifecycle and §Rules.

**Why these three group.** They are one gap with three faces: **finishing X does not notify Y.**
D476 is un-owning, D475 is completing-in-halves, D433 is unblocking. `feedback-delivery` already had
to invent a two-stage landing *inside one RFC* to hold D475's shape, and its own text says it should
not have had to be invented per-document. One amendment carries all three; three amendments would
each restate the same lifecycle table.

**The user consequence, and it is why this is #2.** [[D476]] is not hypothetical: `claim-backing` was
named as the binding wave's owner in `feedback-delivery` OQ5 and then archived, so **98 claims of
work that owner ruling [[D462]] requires before anyone plays are ownerless**, blocking
`feedback-delivery` **stage 2**. `planning/WORK.md` §3 lists it among the things *"bigger than any
row"*. This document creates the state; it cannot commission the wave — commissioning is an owner
act, and the RFC must say so rather than imply it.

**Dependencies and landing order.** Independent of RFC-1 in code; land it **behind** RFC-1 and
**ahead of** the queued `make status-parity`, because that checker needs a defined lifecycle
vocabulary and this document is what defines it — see D500 in §5.

**Size: one section — small.** It edits one document and adds no code.

**Exploration gate: PASSES.** All five are recorded incidents with named artefacts
(`feedback-delivery` §0, `claim-backing`'s archival, `532c7e2`, the `planning/codex-queue.md`
no-ops). None is an open question.

---

### 3 — `permission-contract` · claims nothing versioned · lands behind `teacher-surface`

**Scope.** The authorization and assistance-permission layer states its contract in prose,
fabricates one of its principals, and enumerates its inputs nowhere.

| Row | Title |
|---|---|
| [[D216]] | A `story_read` token passes `requireRead` as the token's *creator*, through a fabricated principal — the scoping is a hand-narrowed projection, not an authorization scope |
| [[D449]] | `permittedAssistance` has no register for its inputs, and it now takes two that are neither `role` nor persisted in the run |
| [[D450]] | `docs/live-sessions.md` §Accepted limitation asserts a permission rule in prose that no test reads |

**Rows: 3.**

**Claims:** nothing versioned. No pack lane, no run lane, no migration position. It changes
`apps/server/src/authorization.ts` (a `Principal` token variant), `packages/runtime/src/assistance.ts`
(a declared, enumerated `AssistanceContext`), and adds the test [[D450]]'s rule needs.

**Verified at the symbol, myself.** `Principal` is `{learnerId, handle}` at
`apps/server/src/authorization.ts:12-15` — **no token variant exists**, so no anonymous caller can be
represented `[V]`. `AssistanceContext` is `{sessionKind, deliveryOpen, role}` at
`packages/runtime/src/assistance.ts:21-25`, and `permittedAssistance` at `:27-29` reads only `role`
and `deliveryOpen` `[V]`. `docs/live-sessions.md:136` carries *"…never raise it…"* as prose `[V]`.

**Why these three group.** One defect at three altitudes: the permission layer's contract is
**asserted rather than enforced**. D216 is a fabricated input, D449 is an unenumerated input space,
D450 is an unenforced output rule. One document that types the principal, declares the input space
and pins the ceiling closes all three; split, each produces a change whose sibling re-opens it.

**Dependencies and landing order. Must land behind `teacher-surface`** — that RFC is `accepted` and
adds the two viewer-side inputs D449 names, and [[D460]] records that both were mis-specified on
first writing. Drafting this before `teacher-surface` lands would register an input set about to
change. Coordinate with `live-marker-quality` (`implementing`), which owns the live disclosure rule
D450 restates.

**Size: one section per row — small to medium.** The `Principal` variant touches every `requireRead`
caller's type, which is wide but mechanical.

**Exploration gate: PASSES.** All three are measured defects. D216 names the exact call chain
(`RunService.publicStory` → `learnerById(record.createdBy)` → `this.story(...)`); I confirmed the
type it rests on. No open question — the row states the standing rule the RFC must encode.

---

### 4 — `run-log-refusals` · claims **run schema 0.18** + one **migration position** (stamp-only)

**Scope.** Three fields the run log accepts and cannot represent, honour or read. Each fix is a
*refusal* or a *closure*, not a new capability.

| Row | Title |
|---|---|
| [[D195]] | `score mate` remains unrepresentable in `SelectionCandidate` |
| [[D106]] | `targetElo` is accepted beside `strong_engine` and silently dropped — **refusal half** |
| [[D361]] | `clockState` accepts and persists literally anything, and nothing reads it |

**Rows: 3.**

**Claims:** **run schema 0.18** (head is 0.17, `schemas/drill_run.schema.json` `$id` `[V]`) and **one
migration position** — a *position in the landing order*, never an integer ([[D423]], [[D447]]);
stamp-only, frozen literals, no data rewrite. **No pack lane, no shape-entry lane.**

**Verified at the symbol, myself.** `clockState` has exactly **six** non-test references —
`packages/runtime/src/types.ts:124`, `runtime.ts:57` and `:341`, `apps/web/src/lib/api.ts:486`,
`apps/server/src/rest.ts:524-530` and `:1395-1397` — **zero `.svelte` senders and zero readers**, and
`schemas/drill_run.schema.json:218` defines it `additionalProperties: true` `[V]`. D106's
`policyUsesMaiaBand` finding and D195's `SelectionCandidate` gap are `[triage, V]`; I did not
re-open `engine-band.ts` or `packages/runtime/src/types.ts:80-88`.

**Why these three group.** All three claim the **same run-schema lane and the same migration
position**, and all three are stamp-only. Splitting them produces three stamp-only migrations for
three fields — the shape the migration register exists to prevent. Their theme is also one: *the run
log's contract is wider than what any reader can consume.*

**Two scope fences the document must carry.**
- **D361 may only delete the field or close its shape.** [[D364]] is an explicit owner ruling request
  on clock semantics; specifying clock semantics here would pre-empt it. The row sets the fence
  itself: *"delete the field, or give it a closed shape in the same commit that gives it a reader."*
- **[[D183]] is the standing constraint, not a member.** Triage §8 supersedes it by [[D213]], but its
  rule binds this document: *any proposal to add an event type must name when its event can fire and
  prove that instant is controlled.* D195 adds a **field**, not an event — which is why this document
  is safe under it, and the RFC should say so explicitly rather than leave it inferred.

**Dependencies and landing order.** Behind RFC-1 (there is no run-schema register to claim into
today). Behind `teacher-surface` and `learner-rating` on the migration ladder, per [[D423]]/[[D447]].
Independent of every pack-lane document here.

**Size: one section per field plus one stamp-only migration — small.**

**Exploration gate: PASSES, with D106's half named.** D106's takeable half is the refusal, and the
row states why the alternative is closed: honouring the value is rejected doctrine (weakened
Stockfish, `AGENTS.md` §Rejected). That is a spec decision, not research. D361's shape is fenced
above.

---

### 5 — `pack-population-provenance` · claims **pack schema 0.29** · the largest document here

**Scope.** A pack can state a number and has nowhere to record the population behind it, no field to
cite a source, and one field capped too short to explain the threshold it exists to justify.

| Row | Title |
|---|---|
| [[D124]] | The corpus quotes two different explorer populations and no pack states its band in a machine-readable field |
| [[D157]] | `carlsbad-minority-attack` carried no corpus evidence of any kind and nothing flags it — *a pack quoting no population is indistinguishable from a pack quoting the wrong one* |
| [[D153]] | [[D123]]'s 400-character cap now blocks the D126 ruling specifically, measured (337/394/372/359 of 400) |
| [[D123]] | `timingWindows[].note` is capped at 400 characters — the one field that must justify an authored threshold is the most constrained in the format |
| [[D268]] | A retrievable, licence-compatible source cannot enter the sourcing manifest, because `EVIDENCE_KINDS` has no bibliographic member |
| [[D171]] | Provenance narration remains inexpressible as an evidence type — no `provenance_note` |
| [[D470]] | 20 packs' `provenance.sources` promise data in `provenance.engineValidation`, which the format forbids — **format half only** |
| [[D148]] | `$defs/deviationCost` has no corpus basis — **carried as a recorded refusal, not a change** |

**Rows: 8** (7 specified, 1 refusal-of-record).

**Claims:** **pack schema 0.29** — 0.28 is claimed and held by `graduation-clearance` `[V]`, 0.29 is
the next free lane `[V]`. Also widens `EVIDENCE_KINDS` (`apps/server/src/sourcing/types.ts:57`),
which is a **fifth shared resource with no register at all** — RFC-1 must create that register before
this document claims into it. **No run lane, no shape-entry lane, no migration.**

**Verified at the symbol, myself.**
`$defs/timingWindow.properties.note` is `{type: string, minLength: 1, maxLength: 400}` `[V]`.
`$defs/provenance` requires only `reviewStatus` and closes `additionalProperties` over six keys —
`reviewStatus`, `sources`, `licence`, `reviewers`, `attribution`, `graduationBlockers`
(`schemas/drill_pack.schema.json:1132-1163`) — with **no `engineValidation` and no band or population
key of any kind** `[V]`, which is D470's format half and D124's gap in one place.
`$defs/feedbackClaim.evidenceTypes` is a closed **seven**-member enum with no `provenance_note`
(`:1072-1087`) `[V]`. `EVIDENCE_KINDS` has **seven** members and no bibliographic one `[V]`.
`$defs/deviationCost` admits **four** arms, not the three D148 quotes (`:977-998`) `[V]` — see §5.

**Why these eight group, and it is the strongest grouping in this set.** Every one is the same
sentence: *a pack states a fact and the format has nowhere to put the evidence for it.* D124 is the
band, D157 the absence of a band, D153/D123 the justification text, D268 the citation, D171 the
narration, D470 the engine evidence, D148 the split. They all claim the one pack lane, they land in
one order, and any two shipped separately would move the same `$defs` in consecutive versions. Eight
documents here would be eight pack lanes for one idea.

**Why D148 is carried as a refusal.** Its *structural* half is real and I verified it; its *semantic*
half — *cost is a quality claim by definition, so converting a split into one is precisely the
conversion the [[D126]] ruling refuses* — is an owner matter. The RFC should record the refusal with
the measured reason (the four `unmeasurable` deviations are played 30/10987, 2/158, 0/742, 0/730, all
below `explorer.ts:91`'s 100-game abstention floor) and change nothing. That closes the row honestly;
specifying a corpus basis would breach the ruling.

**Dependencies and landing order.** Behind RFC-1 (needs the evidence-ledger register). Behind
`graduation-clearance` (holds 0.28). It is the **prerequisite for CONTENT-7a jobs 1 and 5** and for
`feedback-delivery` stage 2 — the binding wave's 63 `CLAIM_AUTHOR_LABEL_REQUIRED` pack edits need
somewhere to put the population they are labelling.

**Size: LARGE.** Two `$defs` additions, two vocabulary widenings, one cap change, one new validation
check, plus a content migration across 20+ packs. **This is the one document I would consider
splitting**, and the natural seam is *pack-side provenance* (D124, D157, D153, D123, D470, D148)
versus *ledger-side vocabulary* (D268, D171). I recommend **not** splitting it: the seam runs straight
through D157's remedy, which is a check that a pack carries a band-bearing **source** — one foot on
each side.

**Exploration gate: PASSES, with one carve-out.** Seven rows are ledgered defects I verified. The
carve-out is D124's *value*: the format field is an RFC question, but **which** population a pack
declares is authored chess judgement (triage §7b names exactly this). The RFC specifies the field and
must not populate it.

---

### 6 — `shape-layer-parity` · claims **pack schema (behind 0.29)** + **shape-entry 0.5**

**Scope.** The shape library and the pack layer disagree about what is expressible, and a shape entry
cannot record why its trigger says what it says.

| Row | Title |
|---|---|
| [[D348]] | No expression leaf names a shape entry's TRIGGER, so every structure-keyed predicate in a pack is a hand copy of the library |
| [[D127]] | The shape library can author a plan success signature the pack layer refuses to grade on |
| [[D103]] | A shape entry has nowhere to record why its trigger says what it says |

**Rows: 3.**

**Claims: two lanes, and this is the split-forcing detail.** D348's `shape_trigger` leaf lives in
`$defs/structuralExpression`, whose grammar is **duplicated** across
`schemas/drill_pack.schema.json` and `schemas/shape_entry.schema.json` `[V]` — so the document claims
a **pack lane behind 0.29** *and* a **shape-entry lane**. Shape-entry head is **0.3** `[V]`,
`measurement-records` claims 0.4, so this document claims **0.5**. Precedent for one document
claiming both exists: `archive/predicate-wave-2.md` took pack 0.13 and shape-entry 0.1→0.2 *"with the
same duplicated grammar"*. **No run lane, no migration.**

**Verified at the symbol, myself.** `named_structure`'s id enum is closed at exactly
`["carlsbad", "iqp-white", "iqp-black", "maroczy-bind"]` (`drill_pack.schema.json:531`), and
`shape_trigger` occurs **zero** times in either schema `[V]` — D348 exactly.
`shape_entry.schema.json:18` is `"additionalProperties": false` at the document root and there is no
`triggerNote` `[V]` — D103 exactly. `STRUCTURAL_CONDITION_HAS_NO_FEATURE` is live at
`apps/server/src/pack-orchestrator.ts:514` `[V]` — D127's refusal is real.

**Why these three group.** One boundary, three failures: the shape entry can author more than the
pack can consume (D127), name less than the pack needs to reference (D348), and explain none of it
(D103). They touch the same two schemas and the same validator pair (`shape-check` / `pack-check`).
Grouped, the document states the boundary once and fixes all three sides of it.

**Dependencies and landing order.** Behind RFC-1 — shape-entry has **no register**, so this document
literally cannot claim its lane today. Behind `measurement-records` on the shape-entry ladder. Behind
RFC-5 on the pack ladder.

**Size: medium.** One expression leaf duplicated across two grammars, one optional field, and one
fork to resolve in D127 (refuse un-gradeable signatures at authoring time, **or** let the objective
compiler accept what a checkpoint already may).

**Exploration gate: PASSES.** All three are measured defects with worked instances named in the rows
(`queenless-middlegame/white-king-into-the-game`, `berlin-queenless-press`'s disclosed substitution,
`rook-4v3-same-side`'s D75 trigger clauses). D127's fork is a **specification** fork — exactly what an
RFC exists to resolve — not a research question.

---

### 7 — `selection-receipt` · claims a REST contract and possibly a run lane · **borderline; does not earn a draft yet**

**Scope.** Selection measurements cross the wire before disclosure through the direct selection
responses, and no projection filter can close it.

| Row | Title |
|---|---|
| [[D233]] | The selection measurements fixed at the public event projection still cross the wire earlier through direct selection responses |

**Rows: 1.**

**Claims:** a **REST response contract** on `/select-move`, `/runs/:id/prediction` and
`/runs/:id/group-reply`, and — depending on which arm is chosen — a **run-schema lane behind RFC-4's
0.18**. `POST /select-move` is live at `apps/server/src/rest.ts:1008` `[V]`; that it returns
`OpponentSelection` before disclosure is `[row]` and I did not walk the handler to the response body.

**Why it stands alone.** It claims a different resource from every other document here (route
contracts, not schema fields), it is the only one that could require a **new route** (an atomic
select-and-commit), and it sits on a live surface `teacher-surface` is mid-implementation on — the
same disclosure family as [[D448]], which `rfc/teacher-surface.md` §5.2 *deliberately does not take*.
Grouping it with RFC-4 would couple three cheap stamp-only refusals to an API redesign.

**Dependencies and landing order.** Behind `teacher-surface` and behind RFC-4. Coordinate with
`live-marker-quality`, which owns the live admission rule.

**Size: medium to large**, and the size is not yet knowable — which is the problem.

**Exploration gate: BORDERLINE — this is the one I would not draft yet.** The row is a ledgered
defect with first-hand evidence and says of itself *"requires an RFC/API lane"*. But its remedy is
stated as a **fork between two very different architectures** — *"a server-owned selection/opaque-receipt
contract **(or an equivalent atomic select-and-commit route)**"* — and nothing has measured which the
client can live with. That is a design question, not a spec gap. **Recommendation: a scoped design
note first** (what does the browser actually need back from `/select-move` to render, and can it
render from an opaque handle?), then a draft. A cheaper interim that does not need the fork resolved:
refuse to return measurements pre-disclosure and see what breaks.

---

## 3. Groupings I considered and rejected

- **RFC-1 absorbing the two queued checkers** — rejected in §2.1; a lint is not RFC-shaped, and
  `2160d2c` already queued both correctly.
- **RFC-5 split into pack-side and ledger-side provenance** — rejected; D157's remedy (a check that a
  pack carries a band-bearing *source*) has one foot on each side of the seam.
- **RFC-4 + RFC-7 as one "selection" document** — rejected; RFC-4 is three stamp-only field decisions
  and RFC-7 is a route architecture with an unresolved fork. Coupling them makes three cheap refusals
  wait on a design question.
- **D449/D450 folded into RFC-1** — rejected; the same *species* of gap (a shared resource with no
  register) but a different resource. A function's input space is enumerated in a **type**, not a
  markdown table, and it lands behind `teacher-surface` rather than ahead of everything.
- **RFC-6's D103 folded into RFC-5 with D123/D153** — genuinely tempting (both are *"the field that
  must justify a threshold cannot hold the justification"*), and rejected because D103 claims the
  **shape-entry** lane and D123/D153 claim the **pack** lane. Grouping would couple RFC-5's landing to
  `measurement-records` for no benefit.

---

## 4. Sent back to another lane — 11 rows, with the question named

| Row | Row title | Lane | The question that must be answered first |
|---|---|---|---|
| [[D477]] | The body/register contradiction has now blocked an implementer FIVE times, and the check that catches it is one grep | **IMPLEMENTATION — already queued** | None. `planning/WORK.md` §0 queues it as `make status-parity`; the triage calls it batch-ready. **It needs one thing from RFC-2**: a defined mapping for register states RFC-0000 does not name (see D500, §5). |
| [[D487]] | The index that answers *"what is unscheduled"* declares itself complete, is hand-maintained, and is missing 121 of 289 rows | **IMPLEMENTATION — already queued** | None as a script. **One staging condition**: it cannot land as a *failing* gate on day one — I measured **213 of 248 open rows with no destination** at `2160d2c` `[V]`. Land it as a reporting target first, a gate second. That two-stage shape is [[D475]]'s subject, which is another argument for RFC-2. |
| [[D307]] | Per-context assistance is ADDRESSING only — there is no per-context content | **NEEDS-OWNER** | *May Just Play be more permissive than a curated drill?* The row carries `DESIGN-GAP:` and says *"owner tier"* in its own text. `AssistanceContext.sessionKind` is declared at `assistance.ts:22` and never read at `:28-29` `[V]` — the lever is missing, but **what the lever should do is a `design/05` ruling**, and law 5 forbids an implementer writing it. |
| [[D308]] | Just Play cannot open disclosure mid-run, so rungs 3, 4 and 6 are structurally unreachable | **NEEDS-OWNER** | Same ruling as D307. **Flagging its value explicitly:** the row calls itself *"highest cost:value ratio in the audit"* and the remedy is one control plus one prop. **Once ruled, this is the highest user-value item in the entire NEEDS-RFC set** and should be drafted ahead of everything in §2. |
| [[D309]] | Guided mode is inverted: the mechanism ships ungated and ON | **NEEDS-OWNER** | *Is guided mode a mode a learner chooses, or a live render?* `DESIGN-GAP:`, owner tier. Note the sharpest finding — **`design/05` §3a's silence default is violated in code** — which makes it a live design/code divergence, not merely an unwritten decision. |
| [[D313]] | Simulate is the largest implemented-with-no-entry-point in the repository | **NEEDS-OWNER (IA)** | *Where does a simulation entry point live in Drills and Live?* Refusal in Just Play is correct and stated (`service.ts:1246 NO_AUTHORED_VARIATIONS`); the Drills and Live absence has no stated reason, and choosing one is an IA question against `design/03-product-breadth.md`. **The batch-ready half stays in triage B5**: the acceptance test `rfc/archive/n-way-comparison.md:1383-1395` names and nobody wrote. |
| [[D399]] | `DESIGN-GAP:` the thesis's third on-ramp knob has no encoding | **NEEDS-OWNER (design)** | *What is the third on-ramp knob, encoded?* The measurement is first-hand (28 of 31 on-ramp packs collapse onto `play_until_checkpoint`; 6/31 vs 43/61 opponent-intent checkpoints) and `OBJECTIVE_TYPES` has no principle- or threat-shaped member `[V]` — but naming the missing objective type is a `design/00-thesis.md` ruling. |
| [[D329]] | Packs are typed on TWO axes, not one — a famous-game pack is expressible as prose but not as data | **NEEDS-OWNER** | *Are famous-game packs in scope as a first-class provenance axis?* The gap is verified — `$defs/provenance` requires only `reviewStatus`, and `sourceGame` occurs zero times `[V]` — but the row is an **owner idea from 2026-08-16 with no ruling**, and its consumers (indexing, *"more from this game"*, campaign themes) are unbuilt. Cheap once ruled; not draftable before. |
| [[D183]] | `projectRun` enforces adjacency invariants, so a new `DrillRunEvent` member is only safe if its emission instant is controlled | **DUPLICATE** | Superseded by [[D213]] per triage §8, which states the invariants and the consequence correctly (D183's *"permanently unloadable"* is wrong for the normal path). **Its rule survives as a binding constraint on RFC-4** and is cited there. |
| [[D428]] | The authoring-issue code space has no closed union, so no census can ever enumerate it | **`dead-vocabulary` follow-up** | `runtimeIssue(code: string, …)` at `apps/server/src/pack-validation.ts:142-148` `[V]` — real and takeable. But it was **found by `dead-vocabulary`'s own cross-review**, and its remedy (`PackIssueCode`) exists to make *that RFC's* declaration census total over both halves. It belongs to the census's owner, not to a new document. |
| [[D430]] | `explorer_frequency` is a dead alternative inside a live map — **removal half** | **`dead-vocabulary`** | Already routed there by triage §B1. The export half is batch-ready and stays in B1. |

**Also confirmed owned — do not draft, listed so nobody re-proposes them:** `graduation-clearance`
owns D404, D405, D407, D408, D425, D426, D427, D434, D435, D436, D464, D465, D466, D467;
`measurement-records` owns D368, D386, D391, D392; `teacher-surface` owns D92 and D93.

---

## 5. What the spot-check found — three stale rows and five facts in no row at all

**The check that mattered most:** I compared all four shared-resource registers to the tree instead
of to the rows. **Three of the four are wrong at HEAD.**

### Stale or materially wrong rows

1. **[[D461]] is fixed — close it.** The row says `rfc/README.md` asserts 0.28 both claimed and free.
   At `2160d2c`, rows `:12`, `:13`, `:77` and `:78` all read 0.28 as claimed and held by
   `graduation-clearance`, with 0.29 next free `[V]`. [[D472]] (which recorded the partial fix) is
   already ✅ in column 1; **D461 still reads 💡 open in column 1** and should be flipped. It is
   inside RFC-1's scope only as a verification, not as work.
2. **[[D268]]'s count is stale.** The row states *"The six kinds are `opening_identity`,
   `position_legality`, `explorer_frequency`, `tablebase_result`, `engine_eval`, `puzzle_provenance`
   (`sourcing/types.ts:57`) [V]"*. There are **seven** — `explorer_position_census` was added and the
   row does not know `[V]`. **The core claim survives untouched**: none of the seven is bibliographic.
3. **[[D384]]'s numbers are stale in the worse direction.** The row says HEAD is 22 and three drafts
   carry 21/20/20. `STORAGE_VERSION` is **23** (`storage.ts:407`) `[V]` — and, per D497 below,
   `engine-leverage`'s migration 21 has **already landed**, so its framing understates a register that
   has lost track of what shipped.

### Facts I could not find in any row — propose as new ledger rows from **D497**

I have **not written these**, per the brief.

- **D497 — two Active RFCs hold pack lanes the tree passed four versions ago, and their content has
  already shipped.** `rfc/README.md:72` lists pack **0.23** owned by `engine-leverage`
  (*implementing*) and `:73` lists **0.24** owned by `vocabulary-wiring` (*implementing*), while
  `DRILL_PACK_SCHEMA_VERSION` is **0.27** `[V]`. Their content is in the tree: `engineCondition`
  appears in `schemas/drill_pack.schema.json` `[V]`, `plan_signature` appears in both
  `drill_pack.schema.json:555` and `shape_entry.schema.json:84` `[V]`, `searchBound` is in
  `drill_run.schema.json` `[V]`, and **migration 21 is landed** as
  `{version: 21, name: "engine leverage run schema"}` at `apps/server/src/storage.ts:2335` `[V]`.
  Meanwhile `rfc/engine-leverage.md:104` still reasons from *"`STORAGE_VERSION` is **20**"* and `:148`
  still says *"do not claim pack 0.23, run 0.16, or migration 21"* `[V]`. **This is [[D423]]'s and
  [[D477]]'s defect combined and live: two substantively-implemented documents are advertising held
  lanes to every future drafter.** It is the strongest single piece of evidence for RFC-1 and it
  exists in no row.
- **D498 — the shape-entry schema is one lane ahead of its last registered change, and there is no
  register to notice.** `schemas/shape_entry.schema.json` `$id` is **0.3** `[V]`; the last registered
  shape-entry change is 0.2 (`archive/predicate-wave-2.md`, recorded inside the *pack* register's 0.13
  row) `[V]`. `measurement-records` claims 0.4 and is correct **by luck**, not by register. Sharpens
  [[D376]] from *"no register"* to *"no register, and the lane has already moved unrecorded."*
- **D499 — the evidence-ledger sidecar format is a fifth shared resource with no version and no
  register.** `EVIDENCE_KINDS` and `EvidenceRecord` (`apps/server/src/sourcing/types.ts:57-76`) are a
  closed vocabulary that [[D268]], [[D171]] and `graduation-clearance`'s `clearance.recordKind` all
  want to widen, and nothing records who holds it `[V]`. Same species as [[D376]]; RFC-1 should create
  this register and RFC-5 claims into it.
- **D500 — the RFC register uses lifecycle states RFC-0000 does not define**, so the queued
  `make status-parity` cannot run without a mapping. I ran the check by hand over all nine Active
  RFCs `[V]`: **eight agree**; `measurement-records.md` body reads `- **Status:** draft` while its
  register cell reads *"returned to author 2026-08-16"* — and *returned to author* is not one of the
  five states in `rfc/0000-rfc-process.md` §RFC lifecycle. Also live: *"implementing — owner amendment
  2026-08-16"*. This is a prerequisite for [[D477]]'s instrument and belongs to RFC-2.
- **D501 — [[D487]]'s arithmetic has moved and the row does not say so.** At `2160d2c`:
  **248 open rows in the ledger, 213 of them absent from `planning/work-register.md`**, which now
  names 82 distinct ids — but only **4 above D365**, and all four appear inside the staleness warning
  that D487's own commit (`ef0305f`) added `[V]`. The row's core claim is intact; its numbers are
  stale in the direction that makes the file look better than it is.

---

## 6. Spot-check methodology and rate

**Rate: 25 of the 40 unowned rows in scope checked against the tree — 63%.** Twenty-two were checked
at a **named symbol or schema pointer**; three at a whole-file read or a measurement I ran myself.

**Checked by me** (`[V]`): D103 (`shape_entry.schema.json:18`, no `triggerNote`), D123 + D153
(`$defs/timingWindow.properties.note` = `maxLength 400`), D124 + D157 (no band or population key
anywhere in the pack schema), D127 (`pack-orchestrator.ts:514`), D148 (`$defs/deviationCost` — four
arms), D171 (`$defs/feedbackClaim.evidenceTypes`, seven members), D216
(`authorization.ts:12-15`), D268 (`sourcing/types.ts:57-65`, seven kinds), D307 + D449
(`assistance.ts:21-29`), D329 (`$defs/provenance`, no `sourceGame`), D348
(`drill_pack.schema.json:531`, closed four-id enum; no `shape_trigger` anywhere), D361 (six refs,
zero readers, `drill_run.schema.json:218`), D399 (`OBJECTIVE_TYPES`, `types.ts:1-11`), D428
(`pack-validation.ts:142-148`), D450 (`docs/live-sessions.md:136`), D470 (`$defs/provenance` closed,
no `engineValidation`), D477 (all nine Active bodies vs their register cells), D487
(`planning/work-register.md` — 82 ids, 4 above D365, 213 of 248 open rows absent), D461 + D472
(`rfc/README.md` 0.28 rows), D376 + D384 + D423 + D447 (all four registers against the tree
constants).

**Taken from the triage's `[V]` and not re-derived by me** (`[triage]`): D106, D195, D308, D309,
D313, D430. **Taken from the row** (`[row]`): D183, D233, D385, D433, D460, D475, D476, D478.

**How I chose.** Priority order: (a) every row whose remedy names a schema `$defs` or a version
constant — those are the rows a wrong reading would send a drafter into the wrong lane; (b) every row
I proposed to group with another, since a grouping justified by a stale row is a bad grouping; (c)
the four shared-resource registers, which no row asked me to check and which produced the five
highest-value finds in §5. **Stale-row yield: 3 of 25 ≈ 12%**, against the triage's 24% among rows
nobody suspected — lower, and expected to be lower, because §4 rows describe *absent* fields and an
absence goes stale less often than a count.

**What I did not check:** the eight `[row]` process and doctrine rows (their evidence is git history
and RFC prose, not the tree), and the 18 rows already owned by `graduation-clearance` and
`measurement-records` — those are their authors' to re-verify, not mine. Note also that
`rfc/measurement-records.md` has **277 uncommitted insertions in the working tree** at the time of
writing `[V]`; another agent is mid-revision on it, and its four owned rows may have moved.

---

## 7. Answer to the question asked

**Which single document I would write first: `shared-resource-registers` (RFC-1).**

Not because it is the most valuable — RFC-2 and RFC-3 have consequences a user can feel and this one
does not. Because it is the only one whose absence is currently **producing wrong work**: two Active
RFCs advertise held pack lanes for content that shipped four versions ago (D497), the shape-entry lane
moved a version with nobody recording it (D498), the run-schema and evidence-ledger resources have no
register at all (D499), and **five of the seven documents in this queue must claim a lane from those
registers.** Drafting RFC-5 against the pack register today means reading a table that lists 0.23 and
0.24 as live claims when both have shipped. Every hour spent on the rest of this queue before RFC-1
lands is an hour of drafting against a register that cannot see the tree — which is, verbatim, the
failure [[D423]] describes and [[D477]] has now cost five implementers.

It is also the cheapest: three tables and one doctrine section, no code, no schema.

**And one thing outranks all seven, once it exists:** [[D308]]'s owner ruling. The remedy is one
control and one prop, and it makes rungs 3, 4 and 6 reachable in Just Play for the first time. It sits
in §4 rather than §2 only because law 1 forbids drafting from a `DESIGN-GAP:` row. **If the owner
rules on D307/D308/D309, that document jumps to the front of this queue.**

---

## Added 2026-08-22 — residue reconciliation (D952 repair)

**daily-position** — one shared position a day + spoiler-free share artifact ([[D301]], twice
unrouted). Cheapest complete feature in the campaign cluster; all inputs shipped (see the D301
cell: `public_tokens` + `story_read` anonymous scope at `storage.ts:1306-1317`, the run graph,
47 packs + 43 mined candidates). Precondition: the glyph prototype (exploration gate, disposable,
tied to D301 and logged) — the spoiler-free branch-set glyph is the row's named killer; the glyph
must not become a score. Scope: deterministic date→position rule, the daily run kind, share
token (story_read reuse or one new scope — a register lane if widened), share artifact =
branch-set shape, never a score. Explicitly out: notifications, streaks, leaderboards.

## Variant family lane — opened 2026-08-23 by owner ruling [[D1031]]

*"why only 960? the idea was to offer many different variants as we need the campaign mode to be
interesting and it's also fun to be able play/import/analyse fantasy games or w/e."*

Consolidates five idea rows the owner raised over a week and that never became a lane: [[D327]]
(Just Play variants incl. Fischer Random), [[D328]] (westernised xiangqi/shogi, degraded support
accepted), [[D869]]/[[D870]] (solitaire chess standalone + campaign encounter class; a FAMILY, not
one), [[D873]]/[[D887]] (fairy pieces, reduced armies, balanced against *"we don't need to forget
we're learning chess here"*). Derivation in flight at `planning/variants/rfc-derivation.md`;
[[D327]]'s degradation-tier frame is its spine, and the existing research base
(`design/research/fun-mechanics-outside-roguelikes.md`) rates Chess960 top-three as a **legibility**
mechanic rewarding calculation over recall. Chess960 is likely the cheapest — standard rules, only
setup and castling differ, so the whole detector stack survives.

## Refusal accountability — [[D1030]]

*"what ELSE has been 'refused' even though i asked for it explicitly this is like the 10th time we
find out after the fact major compoments are being deferred for no reason."* The full join of owner
asks against shipped/documented refusals is in flight at
`planning/platform-alignment/refused-vs-asked.md`. The instrument gap is named and distinct from
routing decay: `make work-index` catches a ledger row with no lane, but **nothing catches a refusal
asserted in code, an RFC scope section, or a research verdict that contradicts a standing owner
ask**. The audit owes an instrument proposal alongside the list.

### Variant lane findings 2026-08-23 (`planning/variants/rfc-derivation.md`)

- **[[D1039]]** — Chess960's measured cost: chessops is 960-native by data model, so five small
  edits plus ~20 lines (or zero with pasted FENs). Destination: the variant RFC, drafting gated.
- **[[D1033]]** — import refuses valid 960 PGN on the header, and a header without a FEN silently
  yields the standard position. One allow-list entry plus a refusal for the FEN-less case; covers
  paste, Lichess-URL, broadcast and Arena legs together.
- **[[D1034]]** — Maia dies in Tier 1 (3 of 5 opponent modes); Stockfish is *wrong not missing* in
  Tier 2. The Tier-1 half is an owner fork the derivation names as Gap 1.
- **[[D1035]]** — D327's storage premise refuted (name collision) and its importer count restated
  (24, not 13); five citation drifts corrected.

## Time controls — lane opened 2026-08-23 by owner ruling [[D1041]]

Both arms ruled in: **simulated pressure in drills** (the owner's 2026-08-16 idea — what a great
move costs under 10+0, without a clock running during rehearsal) **and real clocks in play**
(Just Play, matches, campaign encounters). Rows [[D330]]/[[D355]]/[[D357]]/[[D364]] consolidate
here. Derivation commissioned; carry into it: `clockState` stops being a zero-reader passthrough;
bots need move-time models (and `bot-policy:638`'s artificial-delay refusal is scoped to
guard-disclosure honesty, not to clocks); rating interacts with timed play; campaign gains a timed
encounter class.

## Famous-game packs — licence research commissioned 2026-08-23 by owner ruling [[D1043]]

The masters DB is refused at `capabilities.ts:159` on *"licence questions remain unresolved"*.
Ruling: resolve it properly. Commissioned check covers the Lichess masters-database terms and
public-domain historical sources, against the prior that individual game scores are **facts, not
copyrightable works**, and that any restriction attaches to a database compilation or API terms
rather than to the moves. Rule with an answer once it exists.

### Famous-game licence verdict 2026-08-23 (`design/research/famous-game-sources-licensing.md`)

- **[[D1044]]** — the refusal is **not supported on its licence limb**. Lichess's terms are silent
  on the masters DB (the Puzzles tag in the same document *does* declare public domain — the
  silence is meaningful); the per-game PGN endpoint returns a bare score with zero annotations;
  game scores are facts under *Feist* for the US and probably the EU. The real EU exposure is the
  **database right on systematic extraction**, which constrains harvesting method, not games.
- **[[D1046]]** — the coverage gap is **1930–2018**, where no source carries an affirmative grant,
  which is what makes the lift substantive: broadcasts (CC BY-SA 4.0) cover modern elite only and
  Project Gutenberg covers pre-1929 annotated classics. Also: `provenance` already has `licence`
  and `attribution` slots, so only a `sourceGame` object is missing.
- **[[D1045]]** — routed to the [[D1038]] instrument (a `refused` row costs less than an
  `unmeasured` one, which is the incentive behind the whole defect class).

### Time-control derivation findings 2026-08-23 (`planning/time-controls/rfc-derivation.md`)

- **[[D1047]]** — claude's own D1041 row mischaracterized `bot-policy`'s refusal; §2.7's *"there is
  no timing layer, deliberately"* is compile-enforced. **v1 ships no bot clock**; only learner runs.
- **[[D1048]]** — `live-sources` (accepted the same day) strips the `[%clk]` tags this lane needs,
  failing closed. Extract-before-strip amendment owed before either lands.
- **[[D1049]]** — arm (a) splits: **depicted** clock times are grounded and already in the database
  retroactively; **predicted** deliberation time has no corpus and is law-8-forbidden to invent.
- **[[D1050]]** — `clockState` is per-node and per-move, not per-run; 9 refs; lane claims run 0.19+;
  flag-fall needs a fifth `terminalOutcome` reason behind a STRICT-table CHECK.
- **[[D1051]]** — D357's precondition (hint-ladder ruling first) was unmet; owner-facing sequencing.

## Owner rulings 2026-08-23 — famous games, hint distance, capability stamp, clock arms

- **[[D1060]] — FULL lift of the famous-game refusal**, not the scoped variant. Obligations still
  ride it (serialised requests, no systematic index walk, provenance recorded, annotations stripped
  at the record boundary). The product-scope judgement bundled into the refused row was never an
  owner decision and does not survive by default — if per-game listings should stay narrow, that is
  a separate call on its own merits.
- **[[D1061]] — hint distance ships as an assistance axis** (square → piece → ply-distance → move,
  derived not authored). Settles [[D357]]'s precondition for the clock lane. **Step 1 is a bestline
  collection pass**, because 0 of 764 records are `bestline` despite end-to-end plumbing.
- **[[D1058]] — the capability stamp lives IN THE PACK.** F3 drafts with a pack-schema lane claim;
  Gate F clause 1 goes from two-deep to three, accepted knowingly for binding integrity over a
  sidecar that would default permissive on absence.
- **[[D1059]] — the clock fork is three-way**: depicted (grounded, in imported PGN), **measured**
  (the learner's own time, already in `Node.createdAt` deltas, retroactive over every run), and
  predicted (no corpus, law-8-refused). **No arm of the owner's stated idea needs prediction.**
  The time-control derivation's arm (a) is reshaped accordingly.

### Hint-distance research findings 2026-08-23 (codex, on ruling [[D1061]])

Codex took the hint-distance ruling to research within the hour and returned findings that
**qualify the ruling** — routed here so they reach the RFC author rather than sitting unlaned:

- **[[D1069]] — the ruled FOUR-rung hint distance contradicts the accepted THREE-stage Guided Hint
  contract.** This is a live conflict between an owner ruling and accepted text; it must be
  resolved in the drafting, not discovered during implementation. Options belong in the RFC's open
  questions with the trade-off stated, not decided silently.
- **[[D1064]] — "run a bestline collection pass" names no writable collection path.** Claude's
  instruction was unbuildable as written; the RFC must name the path or the pass cannot start.
- **[[D1065]] — a bestline is NOT the four-level hint primitive**; it needs a *selected semantic
  event*, so the disclosure ladder is not simply a truncation of a principal variation.
- **[[D1068]] — observed-run sequence identities cannot be reused on an engine PV** without
  laundering their source, which is the [[D982]] provenance class again.
- **[[D1070]] — a stageable event is still not necessarily a useful hint target** (measured over 64
  fixed depths).
- **[[D1067]] — registered basic multi-edge tactics have constructors but no path compiler or
  production site**; adjacent, routed here because the hint ladder would consume them.

### Campaign run-state finding

- **[[D1063]]** — `campaignRunState` cannot derive its declared `"abandoned"` status from the
  authoritative event log. Routed to the `campaign-core` implementation lane.

### Capability availability — owner ruling [[D1077]] reframes F3's open question 1

*"during runtime capas can get missing right... or reappear? ... so it would be a 'temporarily
unavailable' if it's a runtime issue or outright unsupported if the server is started without the
capa outright... other than that how can a capa ever be missing? the operator configures it or not."*

Two states, distinguished by **cause**, not by what we do to the pack:
- **not configured at startup → outright unsupported** (static, knowable at boot, honestly listed);
- **configured but unreachable → temporarily unavailable** (transient, retryable, may reappear).

**F3 must reuse the shipped vocabulary**, not invent: `ProviderOffBehavior` /`AvailabilityMode`
(`evidence-contract.ts:9,11`) beside `/capabilities`' disposition kinds. The three options F3
recorded (boot failure / listing exclusion / per-request 4xx) are superseded — they described
responses without asking the cause. Also routed here: [[D1076]], [[D494]], and [[D1075]] (the law-4 rehome of assistance-controls' OQ2 — whole shape catalogue vs pack-declared subset, rescued from the archive rather than deleted with it).

**Also routed here at the `assistance-controls` supersede: [[D1074]]** — the shape-marker channel's
missing live-surface register row. Its real destination is `rfc/archive/live-marker-quality.md`
§3.1, by that RFC's own stated amendment mechanism (*"Amending [the §3.1 register] is how a kind's
status changes"*), but an archived RFC is outside `make work-index`'s scanned set and amending a
shipped register is the register owner's act, not a disposition side-effect — so the row is parked
here until that amendment lands. **Standing state, not a pending one:** the channel renders live
behind `guided` today, and `presets.ts:47-48` defaults `onramp` and `academy` to `guided`, so this
is an unmeasured live surface **on by default in two contexts** with no register row at all.


- **[[D1078]]** — `make work-index`'s join accepts a *proposed* row id as a destination, so it can
  report green over a genuinely unrouted row. Fix queued for codex alongside [[D1038]].

- **[[D1083]]** — an RFC status line is a load-bearing routing surface; an acceptance can de-route a
  row whose only mention lives there. Mirror of [[D1079]]; folds into the same instrument fix.
- **[[D1082]]** — acceptance practice: a cross-reviewer may draft the *status* half of a register
  cell, but **Parent and Claims are written from the RFC body by the acceptor**. Two instances of a
  reviewer-supplied cell contradicting its own body, both caught at acceptance.

- **[[D1081]]** (codex's bot-experiment finding) — the first D1078/D1080 sequence generator inherited
  D35's Stockfish hash-carryover defect; identical guarded-Maia line ids shifted aggregate loss.
  Routed to the bot-policy experiment lane; its destination is codex's own measurement work.

### Breadth reality-check 2026-08-23 — rows [[D1085]]–[[D1089]]

66 surfaces measured: **38 shipped / 12 partial / 16 absent**. Of the 16 absent, 5 have an
accepted-or-implementing RFC, 5 have research or an owner ruling only, and **6 are a bare ledger
row**. Full walk and per-surface table: `planning/platform-alignment/breadth-reality-check.md`.
Six corrections are owed to intent docs (law 5 — proposed there, not written).
