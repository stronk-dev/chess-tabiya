# Deferral retrofit, batch 1 — the eight heaviest destinationless RFCs, row by row

**Run:** 2026-08-23, by claude, against the working tree at `3e40491` (`git status` taken first;
28 files modified and 8 untracked by other agents — **nothing in this pass edits any RFC**, per the
commissioning instruction. This document is the acceptor's packet).

**Authority:** [[D1134]] — *retrofit prose deferrals into Discharges rows, or the instrument stays
blind to 539 of them*. Batch selected by `deferral-inventory.md` §4.1 as the heaviest contributors:
`learner-rating`, `measurement-records`, `archive/predicate-wave-3`, `archive/teacher-surface`,
`archive/branch-set-scale`, `archive/learner-identity-and-authorization`, `archive/fixture-realism`,
and `breadth-collectors` §4.

**What an acceptor does with this file.** §2 holds ready-to-paste `## Discharges` rows for the one
active RFC that earns them. §3 holds ready-to-paste `design/BACKLOG.md` rows for obligations that
belong to archived RFCs, which cannot gain a row that blocks an archival that already happened. §4
holds drafted `decision-queue.md` entries for the owner-tier residue. §5 is the honest count and
what it implies for the other 454 rows nobody has read yet.

---

## 0. The headline, before the receipts

**85 destinationless prose rows were counted across the eight. 19 are live untracked obligations.**

| disposition | rows | share |
|---|---|---|
| **Scope statement, not a deferral** — a permanent refusal, a decided option, an architectural boundary, an author call with a shipped default, or an acceptance blocker on a document that is still a draft | **58** | **68%** |
| **Already discharged, or already tracked somewhere the inventory did not look** — the obligation is real and the destination exists; the RFC just does not cite it | **8** | **9%** |
| **Live, real, and tracked by nothing** | **19** | **22%** |

Four further live obligations surfaced that §4.1 did **not** count — three from §6.2's `OWNER` list
and one cross-RFC row `teacher-surface` explicitly handed to `learner-rating` and `learner-rating`
never took. **Total real obligations this batch surfaces: 23. Twelve are owner-tier.**

**The single most important correction to the inventory's method.** §4.1 measured whether a
destination is named *inside the RFC text*. It is not the same question as whether the obligation is
tracked. Five of this batch's rows are held by open `design/BACKLOG.md` rows the RFC does not
cite — `D388` carries `learner-rating` §11.3 by name in its own 2026-08-22 addendum, `D417` carries
`measurement-records` OQ8's exact regex, `D307` carries both `teacher-surface` rows. Those are
**missing cross-references, not missing owners**, and they cost a grep rather than an RFC. Counting
them as untracked overstates the hole; they are still worth fixing, at about one line each.

**And one correction that runs the other way.** `fixture-realism`'s `SourcingIssue.code` follow-on
is named *inside `D54`, which reads `✅` — a closed row.* An open obligation living in a closed
ledger row is invisible to `make work-index` by construction, which is the same failure class as a
prose deferral and is not visible from either end. That one needs a row of its own (§3.6).

---

## 1. Method, and the judgement rule I applied

Every row in `deferral-inventory.md` §4.1 for the eight named RFCs was located in its source
document, read in its own section, and classified against one test:

> **Is there an act that someone must perform?** If the sentence describes a *state the author
> chose* — this is not built, this is refused, this is what the boundary is — it is a **scope
> statement**. If it describes an *act nobody has performed yet* — measure this, rule on this, write
> this file, add this writer — it is an **obligation**.

Three sub-rules did most of the work, and each of them is why the 539 is smaller than it reads:

1. **A refusal with a stated rule is not a deferral.** `predicate-wave-3` §7 refuses six predicate
   families, each against one of four numbered admission rules, each with arithmetic
   (`archive/predicate-wave-3.md:1233-1330`). Nothing is owed. The section is titled *Refusals* and
   means it.
2. **An author call with a shipped default is a decision, not a deferral.** `teacher-surface` OQ9
   and OQ10 both say so in their own text — *"an author call with a stated default, not an owner
   block"* (`archive/teacher-surface.md:1817-1830`). The code shipped one way. There is no act.
3. **An open question on an unaccepted draft is an acceptance blocker, not a deferral.**
   `rfc/archive/rfc-lifecycle-completion.md:356` is explicit: *"`## Open questions` are resolved
   before `accepted`"*. `measurement-records` is `draft — returned to author 2026-08-16`
   (`rfc/measurement-records.md:3`) and four of its OQs say *"Resolve before `accepted`"* verbatim.
   Those are the reason it is still a draft. Converting them to Discharges rows would assert they
   survive an acceptance that has not happened.

---

## 2. Discharges rows to add — `rfc/learner-rating.md` only

`learner-rating` is the only RFC in the batch that both (a) is active and (b) carries live
obligations. It reads **`implementing`** (`rfc/learner-rating.md:3`) and its `## Discharges` table
(`:2056-2060`) holds exactly one row, `D1`, discharged 2026-08-22 by [[D836]]. Every row below has an
empty `discharged` cell by design and blocks `implemented`.

`breadth-collectors` needs **none** (§3.8). `measurement-records` needs none *yet* (§2.6).

**Paste these five rows beneath the existing `D1` row, ids continuing from `D1`.** Owner cells use
`rfc/archive/rfc-lifecycle-completion.md` §3.4's closed vocabulary. Note: `planning/learner-rating/`
is named in the RFC header (`:64`, *"once implementing"*) and **does not exist at HEAD** — a
`planning/` owner cell must name a path that exists (§3.4), so `planning/platform-alignment/` is
used where a job owns the row.

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| `D2` | `void_reason` ships six members and **four writers**: `'assistance'` and `'calibration_retired'` are in the type (`apps/server/src/storage.ts:223-229`), in the SQL CHECK (`:4575`) and in the client union (`apps/web/src/lib/api.ts:332`), and are written by nothing — every `voidRatedGame` call site covers only `rewound`/`forked`/`engine_changed`/`abandoned` (`service.ts:2112,:2117,:2129`; `storage.ts:1672`). Either land the two writers or narrow the enum; a reserved-but-dead void reason is a claim the storage layer makes and the service never honours | `codex` | the implementing commit, plus the [[D1130]]-style ledger row if the enum narrows instead | |
| `D3` | The 11–20-piece rating arm (Open question 2). §5.1 refuses the band on **n = 48** — the thinnest cell in the study, *"not a measured null"* — and names the exact remedy: one arm on `tools/d333-band-outcome-harness/` restricted to that material band. Until it runs, R5's ≥21-piece floor is an artefact of sample size rather than a measurement | `claude` | a dossier in `design/research/` plus the row flip; the RFC's §5.1 and Open question 2 are amended in the same commit | |
| `D4` | Three more calibration rungs (Open question 4) — bands 1200/1600/2000 against the same band-1400 reference, taking the ladder from four rungs to seven at ~200-band spacing, still above D336's ~150-point resolution floor. The RFC calls it *"the cheapest available improvement to the instrument"* and it is a re-run of an existing harness arm. Distinct from `bot-policy` Discharge `D3` ([[D819]]), which calibrates the **persona roster**, not the rating ladder | `claude` | the calibration dossier in `design/research/` plus §4.1's table update and the ledger flip | |
| `D5` | The human anchor (Open question 6) — the RFC's own *"single highest-value unrun experiment this RFC creates"*. **It is not merely unrun: as specified it is unrunnable.** The design regresses recovered BCS on external Lichess rapid ratings across recruited learners, and [[D649]] descopes recruited participants. The owner must rule between the n=1 owner-anchor arm D649 leaves open, the league-participation route [[the league row, `design/BACKLOG.md:1295`]] proposes, and leaving **R7 permanent**. Until one is chosen, no absolute human-scale claim may appear anywhere | `OWNER` | `planning/exploration/log.md` ruling entry, then the dossier if an arm is chosen | |
| `D6` | `design/06-campaign.md` §2b states Maia's usable band as `[1000, 2400]` with no magnitude; this RFC uses `[1000, 2200]` for rated play and refuses 2400 on D338 (Deviations 1). **Verified unrepaired at HEAD** — `design/06-campaign.md:139` still reads `[1000, 2400]` and carries neither the ratio nor the ceiling. This is *not* one of the six §5.3a amendments [[D836]] discharged (those were Deviations 2); it is the separate `DESIGN-GAP:` escalated by `maia-band-outcome-transfer.md` §1. Law 5 makes the edit owner-tier | `OWNER` | `design/06-campaign.md` §2b plus the `planning/exploration/log.md` entry | |
| `D7` | The review rail on a rated run — `teacher-surface` Open question 11 (`rfc/archive/teacher-surface.md:1832-1845`), which that RFC explicitly assigns to *"whichever lands second, which is `learner-rating`"*. §5.2 refuses every server-routed assistance route for a rated run's whole lifetime **with no role exception**, so a learner who plays a rated game and submits it to an assignment gets a teacher whose rail is silently void. **Verified at HEAD: the string `review rail` does not occur in `rfc/learner-rating.md`, and the assignment was never taken.** `teacher-surface` archived 2026-08-22, which under §4's archiving obligation should have forced this to be re-homed or discharged and did not | `claude` | the specification section this RFC gains, plus the acceptance criterion that pins it | |

### 2.6 `measurement-records` — a row is owed at acceptance, not now

Its `## Discharges` reads `none` (`rfc/measurement-records.md:1478-1480`) and that is **correct
today**: the RFC is a draft. One row should be written *into the acceptance commit*, because OQ7 is
the one question in the set that acceptance cannot answer — it is a law-5 act:

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| `D1` | Place D161's standing rule — *worked examples in ledger and design tier are claims and must carry their provenance or be marked synthetic*. §9 states this RFC cannot lint process documents and explains why; the rule is currently written down **only inside the row that reports its violation**. Its home is `CLAIM.md`-tier guidance or `design/research/README.md`'s citation rules, and placing it is a law-5 act this RFC has no standing to perform (Open question 7) | `OWNER` | the amended `design/research/README.md` (or `CLAIM.md`) plus the `planning/exploration/log.md` entry | |

The other four OQs (1, 2, 4, 8) are **acceptance blockers**, not deferrals — §1 rule 3. They stay
where they are. What *is* wrong is that they have blocked since 2026-08-16 with nothing scheduling
their resolution; that is §4.6's decision-queue entry, not a Discharges row.

---

## 3. Ledger rows for the archived RFCs

An archived RFC cannot gain a `## Discharges` row that blocks its archival — the archival already
happened, and `rfc-lifecycle-completion` criterion 3 forbids editing archived RFCs at all. The
correct home is a `design/BACKLOG.md` row **with a destination in column 3**, which is what
`make work-index` reads.

Ids below are **provisional — renumber at landing** ([[D1130]]'s rule; the highest id at HEAD is
`D1165`). Each row is written in the ledger's shipped three-column form
(`| <id> <status> | <description> | <disposition note> |`).

### 3.1 `archive/branch-set-scale` — the two engineering obligations

Both verified live at HEAD.

```
| D1166 🐞 | **The branch-collapse rule has no imported-run opt-out, and folding the game the learner came to study is the one case it must not do.** `rfc/archive/branch-set-scale.md` Open question 5 named this unresolved and named the attachment point. Verified at HEAD: `collapsedBranchIds` (`packages/runtime/src/branch-scale.ts:75-81`) exempts exactly three things — the active cursor branch, `compareIds` and `pinnedExpanded` — receives a `DrillRun` and **never reads `sessionKind`**. The shipped `importedMainline` notion survives at one unrelated site (`apps/server/src/service.ts:876-878`, guarding `STORY_UNAVAILABLE`) with no wiring between the two. An imported game's mainline is a recorded loss roughly half the time, so the unauthored default (fold recorded losses) folds the subject of the session | 💡 open, found 2026-08-23 — retrofitted from `archive/branch-set-scale` OQ5 ([[D1134]]); destination: the branch-scale defect fix, `planning/branch-set-scale/` |
| D1167 🐞 | **Branch-set collapse was accepted at a size the runtime envelope does not cover, and the envelope has not moved since.** `rfc/archive/branch-set-scale.md` Open question 4: the documented envelope is *"at most 1000 events per drill run"* and *"3000+ event sessions have not been accepted or characterized"*; ninety-nine branches of twenty plies is ~2000 events. **Verified unchanged at HEAD** — `docs/branch-runtime.md:418` and `:434-435` carry both sentences verbatim (the RFC's `:394-396`/`:410` locators have drifted) and the benchmark table at `:415-416` still tops out at the 1000-event row. The RFC predicted its own acceptance criterion 5 might surface the envelope as the real limit rather than the rail; nothing re-ran it | 💡 open, found 2026-08-23 — retrofitted from `archive/branch-set-scale` OQ4 ([[D1134]]); destination: a characterization run appended to `docs/branch-runtime.md` |
```

### 3.2 `archive/teacher-surface` — the four unrouted design questions

`teacher-surface` archived `implemented 2026-08-22` with OQs 2–7 registered and unanswered. OQs 9
and 10 are author calls with shipped defaults (§1 rule 2) and get no row. OQ11 is re-homed to
`learner-rating` as Discharge `D7` (§2). These four remain:

```
| D1168 🐞 | **Four teacher-surface design questions archived unanswered, none of them an author call.** `rfc/archive/teacher-surface.md` Open questions 3–6, registered at acceptance and owned by nothing since: **(3)** assigning a position, shape entry, branch or repertoire gap is refused in v1 and *"which one arrives first should follow a real coaching session"* — [[D649]] posture, owner-use gated; **(4)** whether a submission may carry a learner's message — *"the most useful thing a teacher could receive and costs one column"*, left out to keep consent minimal, *"genuinely uncertain"*; **(5)** whether an expiring grant warns — a teacher losing access at day 90 mid-review, currently silent because no notification surface exists; **(6)** what the teacher view says when a submitted run's pack version has moved — `registered_packs` is keyed `(pack_id, version)` and an assignment stores only `pack_id`, so *"the teacher view should probably say so"* and does not. (4) and (6) are one column and one sentence respectively; (5) needs a surface that does not exist | 💡 open, found 2026-08-23 — retrofitted from `archive/teacher-surface` OQ3–OQ6 ([[D1134]]); destination: the teacher-surface follow-on RFC named by [[D1169]], or `planning/platform-alignment/decision-queue.md` O11 for (3) |
| D1169 🐞 | **OWNER-TIER: does a teacher-initiated observation request exist at all?** `rfc/archive/teacher-surface.md` Open question 2. The RFC ships only learner-initiated sharing on an explicit argument — *"a request from a teacher is a pressure surface: a student who can technically decline may not feel able to"* — and defers the primitive *"to a follow-up RFC unless the owner rules otherwise"*. **No follow-up RFC exists and none is commissioned.** The question is not whether to build it but whether declining can be made costless; if it cannot, the refusal should be made permanent rather than left as a deferral to a document nobody is writing. Directly downstream of O11 (coach/streamer workflows, READY FOR OWNER) | 💡 open, found 2026-08-23 — retrofitted from `archive/teacher-surface` OQ2 ([[D1134]]); destination: `planning/platform-alignment/decision-queue.md` O11 addendum (§4.2 of `deferral-retrofit-batch-1.md`) |
```

**Not given rows, and why**, so a later reader does not re-mint them: `teacher-surface` §6's
*"D307's unshipped per-context assistance defaults"* and Deviations 3's restatement of the same are
**already tracked** — `design/BACKLOG.md:1093` `D307 🐞` holds them, open, by name. The fix there is
a cross-reference in the RFC, which is impossible (archived), so the fix is nothing: the obligation
is visible where it needs to be.

### 3.3 `archive/fixture-realism` — the two concrete follow-ons

```
| D1170 🐞 | **The two sourcing fixtures F2 was written for still carry no provenance.** `rfc/archive/fixture-realism.md` §6 Follow-on named `tablebase-response.json` and `explorer-response.json` as the F2 provenance targets outside `verify-draft` and deliberately did not attempt them. **Verified at HEAD:** both exist (`apps/server/src/sourcing/fixtures/tablebase-response.json`, 243 bytes; `.../explorer-response.json`, 440 bytes), both are bare API-shaped bodies with no `origin`/`retrievedAt`/`sha256` wrapper, no sidecar and no README, read as raw bodies at `apps/server/src/sourcing/syzygy.ts:89` and `explorer.ts:152`. Unchanged since 2026-08-12. This is F1's own family — an assertion against a convenient invention — inside the RFC that named the rule | 💡 open, found 2026-08-23 — retrofitted from `archive/fixture-realism` §6 ([[D1134]]); destination: the F2 sidecar pair plus the identity assertion, per that RFC's F2c split |
```

### 3.4 `archive/fixture-realism` — the second unregistered code vocabulary

See §3.6 for why this one needs a row of its own rather than living where it currently lives.

### 3.5 `archive/fixture-realism` — the owner-tier micro-question

OQ5 (*"Does this RFC need a `docs/` page?"* — *"Owner call"*) is real, owner-tier and trivially
small; the RFC itself names the answer it expects (`docs/development.md`, beside `make verify`). It
is drafted as a decision-queue line in §4.5 rather than a ledger row, because a `💡` row for *"write
one paragraph if the owner wants it"* is exactly the furniture `fixture-realism`'s own OQ3 warns
about.

### 3.6 The closed-row trap — `SourcingIssue.code`

```
| D1171 🐞 | **AN OPEN OBLIGATION IS LIVING INSIDE A CLOSED LEDGER ROW, which is the prose-deferral defect wearing a ledger row's clothes.** `SourcingIssue.code` is still a bare unregistered `string` (`apps/server/src/sourcing/types.ts:125`) with 15 literals, invisible to the refusal-discovery gate for exactly the reason `SourcingError.code` was — and the registered 62-member `SourcingErrorCode` union (`types.ts:130`) is applied only to the thrown-error class at `:196`, never to the issue record. `rfc/archive/fixture-realism.md` §6 named it as a follow-on *"so its omission is not read as coverage"*, and its only ledger home is a clause **inside `D54`, which reads `✅`** (`design/BACKLOG.md:1161`: *"`SourcingIssue.code` remains a separately named vocabulary follow-on"*). `make work-index` does not read the interior of closed rows, so this obligation has been invisible from both ends since 2026-08-15. **Second finding in the same sweep:** `ServerErrorCode` has grown **61 → 68 members** (`apps/server/src/errors.ts:1`) while `fixture-realism` §6 recorded the 61 as accepted debt, and `refusal-coverage.test.ts:53-59` discovers codes from *emitter call sites* rather than from the type alias — so a declared-but-never-thrown member is still invisible to the gate that was supposed to bound the debt. The shrink-only register itself is working as designed (`refusal-debt.fixture.json` 103 codes against the `refusal-debt-ceiling.fixture.json` 108 frozen 2026-08-15); it is the *type* side that grew unwatched | 🐞 open, found 2026-08-23 — retrofitted from `archive/fixture-realism` §6 ([[D1134]]); destination: close `SourcingIssue.code` to the existing union; separately, decide whether `ServerErrorCode`'s type alias joins the discovery gate |
```

### 3.7 `archive/predicate-wave-3` — **nothing is owed; one obligation discharged itself**

All seven §4.1 rows resolve without a new row, and one of them is the batch's cleanest example of
*check, do not assume*:

- **§7 F2 / F3 / F6 / F8** are refusals with numbered admission rules and arithmetic
  (`:1233-1330`). F3's refusal even computes that castling rights *"add exactly zero discriminating
  bits over the shipped proxy"*. **Scope statements.**
- **OQ2** — *"Resolved in favour of one array on backward-compatibility grounds"*. **Resolved.**
- **OQ3** — *"Left as two exact zones; a filed gap naming a band would reopen it."* A decision with a
  stated reopen trigger. **Resolved.**
- **OQ5 — ALREADY DISCHARGED.** The question was whether F4's disjunctive promotion trigger is
  *"a clean hand-off or a lost specification"*. It was a clean hand-off. The owner ruled it directly
  (`rfc/archive/predicate-wave-3.md:146-151`, **Q6**: *"the transition grammar SHIPS, with
  consumers… §7 F4 becomes that RFC's specification input"*), and `rfc/archive/transition-primitives.md`
  landed **implemented, created 2026-08-15**, with `matchesTransitionExpression` exported at
  `packages/runtime/src/index.ts:87`, two production consumers (`apps/server/src/objective.ts:322`,
  `apps/server/src/pack-validation.ts:275-285`), `docs/transition-primitives.md`, pack schema 0.22
  and three content files authoring `kind: "transition_feature"`. **Mark closed with that evidence;
  do not convert it into a live row.**
  *(One residue worth a sentence rather than a row: F4's inventory said `structuralDelta` was
  consumed by nothing but tests, and that is **still true** — `packages/runtime/src/structure.ts:648`,
  re-exported at `index.ts:147`, with `transition.test.ts:61-62` actively asserting the transition
  module does not call it. `vacationReading` did get a production consumer,
  `packages/runtime/src/tactics.ts:9,:659`.)*

### 3.8 `breadth-collectors` §4 — **zero of four counted rows is a deferral**

The section is titled *"Refused and deferred"* and carries no D-ids, which is what put it in the
batch. Read against the test, **all four counted rows are refusals**, three of them measured:

| §4 bullet (`rfc/breadth-collectors.md:345-358`, *"Refused and deferred"*) | disposition |
|---|---|
| no global restriction / activity / weak-square / outpost / pawn-break / king-attack / initiative events | **scope statement** — *"the exact operands above are the reusable layer"*; a vocabulary boundary, not a queue |
| slider coordination, connected-rook, pawn-contact prominence | **scope statement** — refused as *"measured near background or population-reversing"*; a measurement, not a deferral |
| no longer-than-three-edge tactic search, forced win, sacrifice or mating-net classifier | **scope statement** — the horizon bound of B8, and law 8 for the classifier half |
| engine eval/WDL, Maia, explorer, opening identity, theory, authored claims stay separate producers | **architectural statement** — a producer-boundary rule, not withheld work |

The section's two bullets that *are* deferrals were **not among the four counted**: *"player types,
habit verdicts or bot personalities. F8/F9 consume these events with their own opportunity/phase/policy
contracts"* — which belongs in the inventory's §2 (F9 has no RFC) rather than §4.1 — and *"authorable
pack vocabulary or content relabelling"*, whose destination the RFC's own `tabiya-claims` note names:
*"A later authorable-vocabulary RFC must make and register that separate decision"*
(`rfc/breadth-collectors.md:32`). **No new Discharges row.** The RFC's one live obligation is
already `D1` in its own table (production-module eligibility, owner
`planning/evidence-foundation-ux/plan.md` Phase 3), and `## Open questions` correctly reads *"None
require an owner ruling. Module prominence, prose, presets, authorable vocabulary, bot-policy
weights and habit/type interpretation are explicitly later contracts rather than hidden choices."*

**This RFC is the batch's counter-example and it matters.** A section named *"Refused and deferred"*
with zero D-ids looked like the worst offender in the inventory and is one of the best-formed
documents in the corpus. The textual matcher cannot see the difference between *refused* and
*deferred* — which is precisely `deferral-inventory.md` §1's own stated caution, here measured at
4-for-4 in the section that triggered the flag.

### 3.9 `archive/learner-identity-and-authorization` — **zero new rows; one already discharged**

Thirteen counted rows, and this RFC is the strongest single piece of evidence that the 539 is
inflated. **§12 is a named-limitations section** (`:1078-1102`) whose own first line reads *"Named,
because a security primitive that overstates itself is worse than one that does not exist."* Ten of
its bullets are permanent, argued refusals: no OAuth, no MFA, no audit log, lease expiry *"rejected
on merits"*, no multi-tenant isolation, no session-revocation UI, no pack authorization, no anonymous
access (*"the change with the largest product consequence and it is intentional"*), the capability-token
deviation (a fork the owner ruled), and the handle-oracle revision (a **fix**, with its residual
non-equalized work named). **The §6.2 row flagging *"administrative roles of any kind"* as an
un-queued `OWNER` deferral is a false positive**: §13 records it as a *completed* owner ruling of
2026-08-12 — *"there is no operator concept"* — with the three back doors it forbids enumerated. A
ruling that has been made is not a decision awaiting a queue.

**One row is a real obligation and it is already discharged.** §12's password-recovery bullet
carries an act: the limitation *"must be stated in `docs/` and in the sign-up copy, not
discovered"*. **Verified at HEAD, both halves:**

- `docs/identity-and-authorization.md:92-93`, under *"## Operational limits"*: *"There is no
  password recovery, email, device list, global sign-out, or account administration UI. A forgotten
  password has no in-application recovery path."*
- `apps/web/src/App.svelte:711`: *"There is no password recovery yet. Keep your password somewhere
  safe."* — outside the `authRegister` conditional (`:708-710`), so it renders on both the register
  and sign-in forms.

**Mark closed.** One nuance, recorded rather than turned into a row: the UI copy says *"yet"*, which
implies a future recovery flow the RFC says will not exist. A one-word edit, not an obligation.

**Two rows are real and already routed, so they get no new row either.** §12's *"no rate limiting
beyond the per-handle lockout"* and *"no TLS opinion"* are both stated as **deployment obligations**.
Verified absent at HEAD — the only limiter is the 15-minute per-handle lockout at
`apps/server/src/storage.ts:2047-2056`; `main.ts:81-83` listens on plain HTTP with only
`cookieSecureFromEnv`; `compose.yaml` and `deploy/compose.release.template.yaml` publish the server
port directly with no proxy service. **Their destination exists and was ruled**: O13 Choice C
(2026-08-20) makes *"a complete reverse-proxy deployment"* part of the 1.0 appliance floor, and
`docs/identity-and-authorization.md:94-98` already documents both as deployment obligations. They
belong to **F12**, which per `deferral-inventory.md` §2.1 has no RFC — which is F12's problem, not a
retrofit target. Adding ledger rows here would duplicate O13.

---

## 4. Owner-tier routing — drafted `decision-queue.md` entries

`deferral-inventory.md` §1 count 2 found **163 `OWNER`-owned deferrals with exactly one in the
queue**. This batch contributes **12**. Six are substantive enough to earn a queue row; the rest are
micro-rulings and are drafted as a single grouped row (§4.5) so they do not each become furniture.

The queue's shipped table is `| ID | State | Decision | Evidence required | Intent home | What the
ruling must say |`, and its post-table sections take a prose form. Two of these six are amendments
to existing rows (O6, O11) rather than new Os; the other four are new.

### 4.1 New row — the rating instrument's three unruled forks

```
| O15 | **UNRULED — three forks the rating cannot resolve for itself** | (a) Does `strong_engine` join the rated ladder? (b) Does voiding on rewind price experimentation? (c) May a tablebase-exact result seal a rated game as a disclosed adjudication? | `rfc/learner-rating.md` Open questions 3, 8, 9; `design/research/maia-band-outcome-transfer.md` (D338: the Maia dial is inert above band 2200); `design/research/maia-endgame-fidelity.md` (the over-credit rate that withdrew §5.4) | `design/06-campaign.md`, `design/00-thesis.md` §experimentation-without-cost | **(a)** `go nodes 50000` is reproducible and would widen the pool upward past 2200 where the Maia dial is inert; it is not a human-choice model but it *is* an opponent whose rating is measurable. Doctrine rejects **weakened** Stockfish as a default opponent and full-strength fixed-node Stockfish already ships as a mode — so the doctrinal bar is not obviously crossed. The RFC's own framing is *"owner call on whether to ask the question at all."* **(b)** §11.4: voiding a rewound game creates a reason not to rewind inside rated mode. It is not a budget — nothing is spent, nothing is gated — but `00-thesis.md` names *"experimentation without cost"* as one of two answers to why anyone uses this. `06` §2c ruled a rewind **budget** prices the thesis's selling point; a **measurement** that cannot see a rewound game is a different object and the owner should confirm that reading. **(c)** Cross-review withdrew tablebase sealing because it fails §1's own test and over-credits at a measured rate; the defensible version seals it, records `terminal_reason: 'tablebase_exact'` and **discloses it as an adjudication rather than a result**, with a count printed beside the rating the way `abandoned_games` is. Default until ruled: refused |
```

### 4.2 Amendment to the existing **O11** row (professional workflows)

Append to O11's notes, beneath the existing entry:

> **Two `teacher-surface` questions are downstream of this ruling and are in no queue
> ([[D1134]] retrofit, 2026-08-23).** **(1) Teacher-initiated observation requests** —
> `rfc/archive/teacher-surface.md` Open question 2. The RFC ships only learner-initiated sharing
> because *"a request from a teacher is a pressure surface: a student who can technically decline may
> not feel able to"*, and defers the primitive *"to a follow-up RFC unless the owner rules
> otherwise."* No follow-up RFC exists or is commissioned. The ruling needed is not build/don't-build
> but **whether declining can be made costless**; if it cannot, the refusal should become permanent
> rather than remain a deferral to an unwritten document. **(2) What a teacher may assign beyond a
> pack** — Open question 3: a position, a shape entry, a branch of the teacher's own run, or a
> repertoire gap are all plausible units, all refused in v1, and the RFC says *"which one arrives
> first should follow a real coaching session, not this draft"* — a [[D649]]-posture owner-use gate,
> not a desk question. Both archived unanswered on 2026-08-22.

### 4.3 Amendment to the existing **O13** row (the 1.0 release floor)

Append to O13's notes:

> **The identity RFC's two deployment obligations are inside this ruling and nothing joins them to
> it ([[D1134]] retrofit, 2026-08-23).** `rfc/archive/learner-identity-and-authorization.md` §12
> records *"no rate limiting beyond the per-handle lockout"* and *"no TLS opinion; cookie `Secure`
> assumes something terminates TLS in front"* as **deployment obligations the application does not
> implement**. Verified at HEAD: the only limiter is the 15-minute per-handle lockout
> (`apps/server/src/storage.ts:2047-2056`); `apps/server/src/main.ts:81-83` listens on plain HTTP;
> no nginx/caddy/traefik exists in `compose.yaml` or `deploy/compose.release.template.yaml`. Choice
> C's *"complete reverse-proxy deployment"* clause is the destination and **F12 has no RFC**, so
> these two are inside O13's execution gap rather than outside it. Named here so F12's drafting
> inherits them instead of rediscovering them.

### 4.4 New row — the measurement-records draft has been blocked for a week with nothing scheduling it

```
| O16 | **PROCESS — a returned draft with four acceptance blockers and no owner of the return** | Does `measurement-records` resume, narrow, or stop? | `rfc/measurement-records.md` Open questions 1, 2, 4, 8, each marked *"Resolve before `accepted`"*; the R1 narrowing of 2026-08-23 already resolved the `claim-semantic-anchors` collision | `rfc/README.md` register state; no design-tier intent is at stake | Two of the four are genuine format decisions the owner should make rather than an author: **OQ1** — do packs get the `measurements` surface, or keep `claimBindings`? The RFC defers *"and the deferral is the reason §0 can claim no pack lane"* and says *"that trade should be ruled on explicitly rather than inherited."* Verified at HEAD: `schemas/drill_pack.schema.json` carries no `measurements` property and reads `drill-pack:0.27`, so **lane 0.28 is still free exactly as promised**. **OQ2** — is `subject` too narrow? Readings about *part* of an expression have no subject at all, and the RFC's own honest coverage claim collapses to *"whole expressions, not their parts."* OQ4 and OQ8 are author-resolvable once these two are ruled. **The ruling this queue actually needs is smaller than the questions**: whether the draft is still wanted, since it has sat `returned to author` since 2026-08-16 while its subject matter kept moving |
```

### 4.5 New grouped row — the micro-rulings, so they are visible without being ceremony

```
| O17 | **UNRULED — five one-line rulings retrofitted from archived RFCs** | Five decisions, each a single line of code or prose, each explicitly named as the owner's by the RFC that deferred it | The five source RFCs; four of the five are [[D649]] owner-use questions the owner's own sessions answer | none — these do not amend intent tier | **(1)** `archive/branch-set-scale` OQ3 — is eight the right collapse floor? It is aliased to the comparison cap; the owner's number was nine. *"Answerable only by use, not by argument."* **(2)** same RFC OQ6 — a large `save`-objective run gets no automatic relief at all because the tablebase ground never fires; manual fold may be the right answer but *"should be confirmed by use rather than patched by loosening the rule."* **(3)** same RFC OQ7 — does `cursed-win` under a `win` objective belong in the collapse set? `assessmentAdmissionCode` returns `CURSED_WIN_CANNOT_ROOT_WIN` and `CATEGORY_RANK` puts it below `win`, so §3a-bis collapses it. Defensible, and *"a one-line change if the owner rules otherwise."* **(4)** `archive/fixture-realism` OQ5 — does the fixture-realism rule need a `docs/` page? The RFC names the expected home itself (`docs/development.md`, beside `make verify`) and calls it an owner call. **(5)** `archive/teacher-surface` OQ7 — is a 90-day grant cap right? It was copied from `mintLink`'s shipped bound rather than derived from any evidence about how long a coach needs a submitted game. **None of these blocks anything. They are here because [[D1134]] found 163 owner-tier deferrals in no queue, and the honest number includes the small ones** |
```

### 4.6 Two rows already drafted above that also need queue presence

`learner-rating` Discharges `D5` (the human anchor — unrunnable as specified under [[D649]]) and
`D6` (the `design/06` §2b band amendment — law 5) both carry owner `OWNER` in the register and
should appear in the queue as well, so the owner's *"what is waiting on me?"* grep over the queue
matches the grep over `## Discharges`. Suggested placement: as bullets under the existing
**Missing-decision refresh** section, in the form that section already uses:

> - **[[D1134]] retrofit — the human anchor is unrunnable, not merely unrun.**
>   `rfc/learner-rating.md` Open question 6 calls it *"the single highest-value unrun experiment this
>   RFC creates"*; the design regresses recovered BCS on external Lichess rapid ratings across
>   recruited learners, and [[D649]] descopes recruited participants. Three arms remain: the n=1
>   owner-anchor D649 leaves open, the league-participation route (`design/BACKLOG.md:1295`,
>   *"participating in one measures our anchor better than hosting one would"*), or leaving **R7
>   permanent**. Until one is chosen, no absolute human Elo may be stated anywhere — the same
>   posture `bot-policy` Discharge D4 already holds for the bot roster.
> - **[[D1134]] retrofit — `design/06` §2b's band still says `[1000, 2400]`.** `learner-rating`
>   Deviations 1 narrows rated play to `[1000, 2200]` on D338 and states *"not acted on here (law
>   5)"*. Verified at HEAD: `design/06-campaign.md:139` is unchanged and carries neither the ratio
>   nor the ceiling. This is **not** among the six §5.3a amendments [[D836]] discharged. One owner
>   nod authorizes claude to write the magnitude in.

---

## 5. The count, and what it says about the other 454

### 5.1 Per-RFC

| RFC | §4.1 rows | scope statements / not obligations | already discharged or tracked | **live untracked** | owner-tier among live |
|---|---|---|---|---|---|
| `learner-rating` | 16 | 8 | 1 (§11.3 → `D388` addendum) | **7** | 4 |
| `measurement-records` | 10 | 9 (5 scope + 4 draft acceptance blockers) | 1 (OQ8 → `D417` + `planning/defect-triage.md:214`) | **0** | 0 |
| `archive/predicate-wave-3` | 7 | 6 | 1 (OQ5 → `archive/transition-primitives.md`, implemented) | **0** | 0 |
| `archive/teacher-surface` | 12 | 6 | 2 (both → `D307`) | **4** | 1 |
| `archive/branch-set-scale` | 11 | 6 | 0 | **5** | 3 |
| `archive/learner-identity-and-authorization` | 13 | 10 | 3 (docs/copy discharged; rate-limit + TLS → O13/F12) | **0** | 0 |
| `archive/fixture-realism` | 12 | 9 | 0 | **3** | 1 |
| `breadth-collectors` §4 | 4 | 4 | 0 | **0** | 0 |
| **total** | **85** | **58** | **8** | **19** | **9** |

Four further live obligations were surfaced that §4.1 did not count — `learner-rating` Deviations 1
(§6.2), `measurement-records` OQ7 (§6.2), `teacher-surface` OQ2 (§6.2) and `teacher-surface` OQ11
(cross-RFC, re-homed to `learner-rating` as Discharge `D7`). **Total real obligations surfaced: 23.
Owner-tier: 12.**

### 5.2 What fraction of the 539 is live work

**On this sample: 22% (19 / 85), and 27% (23 / 85) counting the four §4.1 missed. Extrapolated to
the full 539: roughly 120–145 genuinely live untracked obligations.** I would state the range as
**20–30%** rather than a point estimate, for three reasons that pull in different directions:

**Why the true fraction may be lower than 22%.** The batch was chosen as the *heaviest* contributors,
and weight correlates with exactly the document shape that inflates the count: a well-written
named-limitations section. `learner-identity-and-authorization` §12 contributes ten rows and zero
obligations; `breadth-collectors` §4 contributes four rows and zero obligations. **An RFC that
enumerates its refusals carefully scores worse on this instrument than one that says nothing**, which
is a measurement artefact, not a finding about the product. Sixty-four RFCs predate the Discharges
register (`deferral-inventory.md` §Two structural facts), and the older ones are the ones with the
long §Scope sections.

**Why it may be higher.** The one *active* RFC in the batch scored **44%** (7 of 16), more than
double the batch mean. Active RFCs defer forward, into work that has not happened; archived RFCs
defer into refusals that already resolved. §4.1's list is dominated by archived documents, but the
active ones carry the live obligations. If the 24 active RFCs behave like `learner-rating`, their
share of the 539 is nearly all real.

**And one effect the inventory could not have measured, which cuts the number by about a tenth.**
Eight of 85 rows — **9%** — are obligations whose destination exists somewhere the RFC does not
name: `D388`, `D417`, `D307`×2, the shipped `transition-primitives` RFC, a discharged docs edit, and
two clauses of a ruled O13. Every one of them is a **missing cross-reference**, not a missing owner,
and the repair is a grep rather than an RFC. Any retrofit that treats the 539 as uniformly untracked
will manufacture eight duplicate rows for every eighty-five it reads.

### 5.3 The one structural finding worth carrying up

[[D1134]] says the register works and the prose does not, and this batch confirms it — with one
addition the register cannot fix. **`rfc-lifecycle-completion` §4's archiving obligation** requires
that before archiving, an RFC clears its name from every other document's obligations, re-homing any
`## Discharges` row whose owner cell names it. `teacher-surface` archived 2026-08-22 with Open
question 11 explicitly assigned to *"whichever lands second, which is `learner-rating`"* — and
`learner-rating` never took it, because the assignment was in an **Open questions** section, not a
Discharges row, and §4's check reads only the register. **The archiving obligation and the prose
defect are the same defect**: the one instrument built to catch a dangling hand-off cannot see a
hand-off written one section away from where it looks. That is Discharge `D7` in §2, and it is the
best single argument in this batch for the retrofit being worth its cost.

---

## Provenance

Every claim above is anchored to a file and a line at `3e40491` or to a symbol name. Code and
document state was verified at HEAD rather than inherited from the RFCs: the `void_reason` writer
set, the `RATE_TOKEN` regex, `CLAIM_POINTER_INVALID`'s pointer test, the pack schema's `$id`, the
two sourcing fixtures, `SourcingIssue.code`, `ServerErrorCode`'s member count, the refusal-debt
fixture pair, `collapsedBranchIds`' exemption set, `docs/branch-runtime.md`'s envelope sentences,
`matchesTransitionExpression` and its consumers, `design/06-campaign.md` §2b's band,
`docs/identity-and-authorization.md`'s operational limits, `apps/web/src/App.svelte`'s sign-up copy,
and the absence of any rate limiter or reverse proxy. Line numbers in archived RFCs are advisory and
several had already drifted — locate by symbol or heading, per those RFCs' own locator rules.

**No RFC was edited by this pass. Nothing was committed.**
