# Deferral retrofit, batch 2 — every ACTIVE RFC, row by row

**Run:** 2026-08-23, by claude. `git status` taken first, as instructed: at pass start the working
tree held 33 modified/untracked files from other agents, **four of them under `rfc/`**
(`README.md`, `pack-capability-contract.md` modified; `live-following.md`, `skills.md` untracked).
**Nothing in this pass edits any RFC.** This document is the acceptor's packet.

**The tree moved under the pass, and that is itself a finding.** Batch 2 began at `6654f05` and
ended at `d5ce431`. During it, `3e09f93` drafted `rfc/skills.md`, `954ff4b` repaired
`pack-capability-contract`'s six blockers, and `d5ce431` landed [[D1240]]. **Two RFCs in scope did
not exist when the pass was commissioned.** Line citations below are the ones each reader actually
found at HEAD, not the ones `deferral-inventory.md` §4.1 quotes; several had drifted and I say where.

**Authority:** [[D1134]]. **Scope:** every RFC in `rfc/README.md` §Active — **27 at commissioning,
29 at HEAD**. Three (`learner-rating`, `measurement-records`, `breadth-collectors` §4) were done in
batch 1 and are not re-adjudicated; five (`variants`, `recorded-clocks`, `famous-games`, `skills`,
`live-following`) had **never been inventoried** and were surveyed from scratch.

---

## 0. The headline, before the receipts

**171 prose rows read across 26 active RFCs: the 100 §4.1 rows for the 21 that had them, plus 71
that §4.1 never counted — 39 of those from three RFCs drafted after the inventory was written.**

| disposition | §4.1 rows (100) | all rows (171) |
|---|---:|---:|
| **Scope statement, not a deferral** — refusal with a stated rule, decided option, architectural boundary, author call with a shipped default, corrected over-claim | **74 (74%)** | **88** |
| **Already discharged, or tracked somewhere the RFC does not cite** ([[D1202]]) | **13 (13%)** | **40** |
| **Live, real, and tracked by nothing** | **10 (10%)** | **25** |
| **[[D1230]] scope cut** — deferred on size/landability alone; belongs in `scope-cut-audit.md` (C), not a Discharges row | **4 (4%)** | **9** |
| **Acceptance blocker** on an unaccepted draft — reported, never converted to a row | 0 | **5** |

> **Total real obligations: 25 — 23 Discharges rows plus 2 that belong elsewhere.**
> **Six are owner-tier: 3 register rows and 3 written into an acceptance commit.**
> **The [[D1230]] scope-cut class is 9, every one already in `scope-cut-audit.md` bucket (C); zero
> newly minted.**
> **Batch 1's "nearly all real for active RFCs" prediction did NOT hold — 10%, not "nearly all."
> §8.2 explains why the 44% that produced it was a property of one document, not of activeness.**

**The single most important finding is a deadline.** `rfc/graduation-clearance.md` is `accepted`,
its read-only planner **already landed** (`execution-queue.md:19`, `bafe62e`), it carries **three
live untracked obligations** — and its `## Discharges` section (`:2961-2963`) contains the single
word **`none`**. [[D1201]] is exact about what happens next: `rfc-lifecycle-completion` §4's gate
reads only the register, so when the D560 apply commit archives this RFC, all three vanish with no
record. Second is `rfc/exact-legal-mobility.md`, accepted 2026-08-23 and **substantially
implemented at HEAD**, whose only live obligation sits in a **Status paragraph** the gate does not
read.

**And one finding that is not a retrofit target but is larger than the retrofit.** Batch 2 counted
**14 Discharges rows that already exist and point at a destination that does not exist or cannot
hold them** — thirteen in the three new drafts plus `live-sources`, one in
`pack-capability-contract`. Three of them route to `planning/platform-alignment/decision-queue.md`,
**last written 2026-08-23 at 14:27, while the RFCs citing it were drafted at 17:41, 17:59 and
19:00.** The register cannot be stale-checked by the gate that reads it. See §7.5.

---

## 1. Method

### 1.1 The test, and batch 1's three sub-rules

> **Is there an act that someone must perform?** A *state the author chose* — this is not built,
> this is refused, this is the boundary — is a **scope statement**. An *act nobody has performed
> yet* — measure this, rule on this, write this file, add this writer — is an **obligation**.

Batch 1's three sub-rules earned their keep again. **(1) A refusal with a stated rule is not a
deferral** — 74% of the §4.1 rows, and in the collector lane the rules are *in the type system
rather than in prose*; §3.3 lists what each verdict rests on. **(2) An author call with a shipped
default is a decision** — verified in code every time, never taken on the RFC's word. **(3) An open
question on an unaccepted draft is an acceptance blocker** — five such (§5.2), and the rule mattered
most as a *guard*: converting `pack-capability-contract` OQ2 into a Discharges row would launder a
return-class blocker past a return not yet lifted.

**Two clauses added here on measured evidence.**

**(a) The [W] split.** A withdrawn or narrowed criterion — 22 of the 100 — splits cleanly, and not
by judgement: a withdrawal that **corrected a false over-claim** owes nothing (`theming`'s
brush-pair 10→6, where `MARK_BRUSHES` has 4 members so C(4,2)=6 and the rest were ΔE-0.0 self-pairs;
`learner-modules` A9, whose withdrawn sentence *contradicted its own A7*), while one that **left an
assertion someone must still pay** is an obligation. **Twenty of 22 were over-claim corrections.**
[W] is the most over-counted kind in the inventory.

**(b) "Settled at acceptance" is a promise with an expiry, and must be checked against the status.**
`bot-policy` OQ2 reads *"to be settled at acceptance."* `bot-policy` is `implementing` — past
acceptance — and it was **not** settled: `bot-policy-catalog.ts:296` reads
`compileBotPolicyCatalog([])`, an empty catalog with no band roster. The same phrase in
`live-sources` OQ3 is safe only because that RFC put it in a Discharges row. **The phrase becomes an
obligation the moment the status token moves past `accepted`.**

### 1.2 The two cautions, and what each cost

- **[[D1202]] — check for an existing owner before minting.** Batch 1 measured 9%; batch 2 measures
  **13% of §4.1 rows and 23% overall**, because active RFCs sit inside a denser ledger. Every one
  is a *missing cross-reference, not a missing owner*: `learner-modules` Deviations 3 → **D880**;
  `tactical-collectors` A5 → **D801**, whose own status field literally reads *"tactical collector
  A5 reconciliation"*; `feedback-delivery` OQ6 → **D526 ✅ already answered** (N=8 measured at
  70/450 = 15.6%, the reopening threshold did not fire) while the OQ still reads open; `bot-policy`
  OQ2 → **D970**, which the RFC's own README status line names while its body does not;
  `longitudinal-store` OQ3's ruling half → **D973** and **D1011**; `claim-semantic-anchors` D1 →
  `pack-capability-contract` §4.4, **which absorbed the declaration specifically so this RFC would
  not be blocked on F3's acceptance day** and says so. **A naive retrofit would have minted 40
  duplicate rows.**
- **[[D1201]] — the archiving gate reads only the register.** Its text is `0000-rfc-process.md:112-115`;
  it enumerates `## Discharges` rows and nothing else. Ranked in §2.1.

### 1.3 The [[D1230]] lens, which batch 1 did not have

A deferral whose **only** justification is document size, landability or reviewer load is not a
legitimate deferral — it is a scope cut needing reversal, belonging in bucket (C) of
`scope-cut-audit.md`, never in a Discharges row. Applying it strictly produced a result I did not
expect, so §6 is given over to it. In short: the justification test and the audit's destination
test are **different tests**, they disagree on most active-RFC rows, and the honest count of
genuine size-cuts across all 171 is **9**.

### 1.4 What this pass did not do

No RFC was edited. Nothing was committed. Line numbers inside RFCs drift under active forks — six
of `scope-cut-audit.md`'s citations for `pack-capability-contract` no longer resolve (§7.6b) — so
every row below is locatable by **heading plus symbol** as well as by line.

---

## 2. The register census, and the [[D1201]] exposure ranking

**29 active RFCs carry 88 `## Discharges` rows; 79 are open.** The register is not thin — it is
thin *in specific places*, and the places correlate with drafting date, not with subject weight.

| rows | RFCs |
|---:|---|
| 7 | `skills` |
| 6 | `theming` |
| 5 | `bot-policy` · `campaign-core` · `famous-games` · `live-following` · `pack-capability-contract` · `recorded-clocks` · `variants` |
| 4 | `learner-modules` · `live-sources` · `play-composition` · `semantic-collectors` |
| 3 | `accessible-board-input` · `claim-semantic-anchors` · `intent-presets` · `review-evidence-compiler` |
| 2 | `pack-population-provenance` · `runtime-opening-identity` · `tactical-collectors` |
| 1 | `breadth-collectors` · `exact-legal-mobility` · `feedback-delivery` · `learner-rating` · `longitudinal-store` · `move-quality-grades` |
| **0** | **`0000-rfc-process`** · **`graduation-clearance`** · **`measurement-records`** |

**Every RFC drafted on 2026-08-23** — `skills` 7, `live-following` 5, `variants` 5,
`recorded-clocks` 5, `famous-games` 5 — **carries a full register.** `graduation-clearance`,
accepted 2026-08-17, carries none while deferring sixteen things in prose. That is [[D1134]]'s
thesis restated as a measurement: **the register works when authors have it; the documents that
predate the habit are the exposure.**

### 2.1 The exposure ranking — who loses what, and when

| # | RFC | status | standing prose obligations | what the gate would drop |
|---|---|---|---|---|
| **1** | `graduation-clearance` | accepted; planner **landed** `bafe62e`; `Discharges: none` | **3** | all three — the register is empty, so the gate reads clean and archives |
| **2** | `exact-legal-mobility` | accepted 2026-08-23; **implementation substantially landed** (`legal-moves.ts` exists; `allDests()` sites 14 → 8) | **1** | the [[D1029]] display-layer constant, which lives in a **Status paragraph** |
| **3** | `live-sources` | accepted; only D4 (codex) remains | **0** | nothing — but three of its four rows point at a **directory** (§7.5) |
| **4** | `tactical-collectors` | **awaiting D1 — implementation complete** | **0** | nothing. Its one real obligation (A5's authored zeroes) is held by **D801**, an open ledger row that survives archival |
| **5** | `theming` | **awaiting D1 — implementation complete** | **0** | nothing. Its register carries every live obligation its prose names |
| **6** | `accessible-board-input` | **awaiting D3** | **0** | nothing |
| **7** | `longitudinal-store` | accepted; D1 self-discharges *"at landing"* | **1** | the `derived_rev` enforcement gap — D1's discharge event **is** the archival trigger |
| **8** | `feedback-delivery` | accepted; **does not archive on stage 1** | **1** | fenced by criterion 21, blocked twice (D560; no owner at all, [[D476]]) |
| — | `bot-policy` · `campaign-core` · `intent-presets` · `learner-modules` · `move-quality-grades` · `play-composition` · `semantic-collectors` | implementing | 10 combined | not imminent, but 10 rows are owed |
| — | six drafts | draft | n/a | no archival exposure; their OQs are acceptance blockers |

**Ranks 3–6 are the good news and should be said plainly.** Four RFCs sit at or near archival and
**none of them loses anything**, because each either put its obligations in the register or handed
them to an open ledger row. The retrofit's cost is concentrated in two documents.

---

## 3. Per-RFC adjudication

Key: **S** standing · **T** tracked elsewhere ([[D1202]]) · **R** rhetorical · **AB** acceptance
blocker · **C** [[D1230]] scope cut · **⚠** row exists, destination does not.

### 3.1 The master table

| RFC | status | §4.1 | R | T | **S** | C | +missed (S) | archival exposure |
|---|---|---:|---:|---:|---:|---:|---:|---|
| `graduation-clearance` | accepted, planner landed, **`Discharges: none`** | 16 | 12 | 1 | **3** | 0 | 5 (0) | **rank 1 — loses all three** |
| `pack-capability-contract` | draft, returned | 8 | 5 | 0 | 0 | 3 | 7 (0) | none |
| `learner-modules` | accepted | 7 | 3 | 3 | **1** | 0 | 1 (**1**) | not near |
| `tactical-collectors` | **awaiting D1** | 7 | 6 | 1 | 0 | 0 | 0 | **clear** |
| `theming` | **awaiting D1** | 7 | 6 | 0 | 0 | 1 | 0 | **clear** |
| `longitudinal-store` | accepted, unimplemented | 6 | 5 | 1 | **1** | 0 | 0 | rank 7 — D1 self-discharges at landing |
| `pack-population-provenance` | accepted | 6 | 5 | 0 | **1** | 0 | 2 (**1**) | not near (D560 hold) |
| `play-composition` | implementing | 6 | 5 | 0 | **1** | 0 | 2 (**1**) | not near |
| `feedback-delivery` | accepted, 2-stage | 5 | 1 | 3 | **1** | 0 | 1 (0, cond.) | rank 8 — fenced by criterion 21 |
| `claim-semantic-anchors` | draft | 4 | 4 | 0 | 0 | 0 | 1 (**1**) | none |
| `exact-legal-mobility` | accepted, **impl. landed** | 4 | 3 | 0 | **1** | 0 | 1 (0) | **rank 2 — a Status paragraph** |
| `runtime-opening-identity` | accepted | 4 | 3 | 1 | **1** | 0 | 1 (0) | not near |
| `bot-policy` | implementing | 3 | 2 | 1 | 0 | 0 | 7 (**3**) | not near |
| `campaign-core` | implementing | 3 | 3 | 0 | 0 | 0 | 2 (**2**) | not near |
| `intent-presets` | implementing | 3 | 2 | 1 | 0 | 0 | 1 (**1**) | not near |
| `semantic-collectors` | implementing | 3 | 3 | 0 | 0 | 0 | 1 (**1**) | not near |
| `accessible-board-input` | **awaiting D3** | 2 | 2 | 0 | 0 | 0 | 0 | **clear** |
| `live-sources` | accepted | 2 | 1 | 1 | 0 | 0 | 4 (0) | rank 3 — **clear**, but 3 rows ⚠ |
| `move-quality-grades` | implementing | 2 | 2 | 0 | 0 | 0 | 0 | not near |
| `0000-rfc-process` | accepted (process) | 1 | 0 | 1 | 0 | 0 | 0 | never archives |
| `review-evidence-compiler` | draft | 1 | 1 | 0 | 0 | 0 | 2 (**1**) | none |
| **`variants`** | draft — *first survey* | — | 4 | 8 | 0 | 7 | 15 (0) · **3 AB** | none |
| **`recorded-clocks`** | draft — *first survey* | — | 5 | 6 | **1** | 4 | 13 (**1**) · **1 AB** | none |
| **`famous-games`** | draft — *first survey* | — | 4 | 6 | **1** | 6 | 11 (**1**) · 0 AB | none |
| **`skills`** · **`live-following`** | drafts — *first survey* | — | 14 | 3 | 0 | 0 | 0 | none |
| **totals** | | **100** | **74** | **13** | **10** | **4** | **+15 S** | |

*(101 verdicts over 100 §4.1 rows — `longitudinal-store` OQ3 splits. Survey rows carry dual
classifications where a row is both tracked and a scope cut; the C column counts audit-row identity,
not exclusive disposition.)*

### 3.2 The fourteen standing obligations, and why each is real

| RFC | § + line | the act nobody has performed | pre-check ([[D1202]]) |
|---|---|---|---|
| `graduation-clearance` | §4.2 `:1712-1724` | *"this round did not re-derive how many of the 43 sit on those 18 packs"* — a measurement | negative: [[D518]] states the 18-pack finding without asking for the intersection; [[D409]] carries the 43 without the re-derivation |
| `graduation-clearance` | OQ3 `:2995-3008` | flip `GRADUATION_RESOLUTION_STALE` warning→error at the first content wave. Explicitly **not** owner-tier (`:3002`) | negative: the symbol appears in **exactly two files in the tree** — this RFC and `deferral-inventory.md` |
| `graduation-clearance` | OQ5 `:3044-3059` | who re-reads the 220 statements for compound conditions. The refinement is the **structural** signal (two instruments named vs one `kind`), not the length threshold cross-review refuted | negative across `planning/`, `design/`, `docs/` |
| `learner-modules` | Changelog `:1146` | correct **[[D898]]**, which still asserts verbatim the over-claim this RFC withdrew — *"lift … can never change membership"* — against the accepted A7's three-arm form | [[D903]] tracks only the eligibility-count flip, not the claim |
| `learner-modules` | §4.2 `:516-526` **(missed)** | **restore `outpost`**: [[D906]](2) called the exclusion *"a gate on the fix, not a scope decision"*; **[[D566]] closed ✅ 2026-08-22** and `:519` still reads *"minus `outpost`"* | the only pointer is `codex-queue.md:700-710`, whose code half is complete and whose residual sentence has no owner (§7.1) |
| `semantic-collectors` | §2 `:226` **(missed)** | pin the `mate-proof@1` proof-tree digest. `proofDigest` ships as a literal operand (`evidence-catalog.ts:442`) against a semantics string with **no** digest/hash/serialization text (`:196`); C3's pin list omits it | one hit tree-wide, a research restatement. The [[D523]] class |
| `play-composition` | **OQ1 `:688-692`** | **★ OWNER** — owner-use validation of the 1023/1024 breakpoint, *"claude-chosen, not measured"*, *"moves by token if owner use disagrees"* | zero tracker hits anywhere; value shipped at `play-composition.ts:18` |
| `play-composition` | OQ2 `:693-696` **(missed)** | OQ2 promised *"its resolution lands in the planning log, not silently"*; `compactTab` shipped and `planning/play-composition/plan.md` has **zero** hits | negative |
| `intent-presets` | §6 `:290-294` **(missed)** | the module-delivery disclosure logging §6's no-lane decision *"rests on"* — asserted onto `learner-modules`, whose register does not carry it (§7.2) | negative in BACKLOG, both queues, `evidence-foundation-ux/plan.md` |
| `longitudinal-store` | OQ3 `:744-747` | the **enforcement** half: `derived_rev` appears in exactly two RFCs and the second (`skills.md:349`) is a checklist row. **Zero RFCs comply** with the proposal; §4.4's *"a bump outside an RFC is a defect"* has no detector | the *ruling* half is tracked twice ([[D973]], [[D1011]]) and cited nowhere |
| `pack-population-provenance` | Q3 `:735-739` | source-drift for `citable_text`: `sha256`/`etag` detect **pack** drift, never **source** drift, so a citation whose page changed stays green forever | negative; [[D263]] is the same failure one field over and is still open |
| `pack-population-provenance` | §8a `:561-577` **(missed)** | the `claim-semantic-anchors` reconciliation, **with a false self-citation**: §8a says it is *"recorded in this RFC's Discharges"* (it is not — only D1/D2) and that *"both now do"* name each other (`claim-semantic-anchors` has **zero** occurrences of `citable_text` or this slug) | assigned to *"whoever next edits that draft"* — not a person |
| `feedback-delivery` | OQ2 `:2705-2708` | `renderStructuralObservation` did not move; the client renders through `structural-sentences.ts:7` while `comparisonNarrative`, the evidence packet and `/voice` use the poorer `renderStructuralObservationChange` (`structure.ts:597`). CR4's upgrade reaches one of four surfaces | negative. **Not [[D1230]]** — the cost is a cross-package refactor, not size |
| `exact-legal-mobility` | Status `:24-28` | name [[D1029]]'s **display** layer. Two of three exist (`legal-moves.ts:9-10`); `grep MOVE_DISPLAY_CONVENTION` returns **zero**; the layer is `moveSanFromUci` (`board-input.ts:72`). The RFC's own defence — *"criterion 15 makes the naming failable"* — fails: criterion 15 asserts only the two that exist | [[D1027]] covers emit + ingest naming, **not** display |
| `runtime-opening-identity` | §6 refusal 2 `:418` + OQ2 | **"out of book" is an ownership vacuum**: the RFC does not merely refuse it, it asserts *"neither endpoint nor prefix absence owns that convention"*. (Move-order comparison and descendant families are separately (A)-blocked — one prefix key had **2,023** descendants, pinned by criterion 6) | no carrier anywhere |
| `claim-semantic-anchors` | §Summary `:41-42` **(missed)** | author review of the **43 legacy claim candidates** (36 `tablebase_exact` + 7 `engine_validated`) left *"unbound until an author reviews a rewrite"*. Criterion 12 asserts they **stay** unbound — it locks the state in, it does not discharge it | negative |
| `review-evidence-compiler` | §4.1 `:310-312` **(missed)** | remove `ready`/`pendingEvidence`, retained *"temporarily"*. Both are live and learner-visible (`run-state.ts:41,48`, `api.ts:529`, `GameStoryScreen.svelte:43`); *"temporarily"* names no end condition and no owner | negative |
| `bot-policy` | OQ3 `:807-809` **(missed)** | pack-side profile references, *"deferred to a future RFC"* that does not exist | negative in BACKLOG, both queues, `pack-capability-contract` |
| `bot-policy` | `roster.md:101-104` **(missed)** | **★ OWNER** — the twelve persona names are *"placeholder … the owner or design tier picks the final set"* | negative everywhere |
| `bot-policy` | `roster.md:494` **(missed)** | **★ OWNER** — [[D810]]'s evidence-to-move selector: *"fund / defer / refuse explicitly — a refusal must be recorded, not implied"* | topic rows exist ([[D810]] 💡, [[D1162]] 📊); neither names the owner act, and the queue has no entry |
| `campaign-core` | §8.4 `:441-443` **(missed)** | what the prestige layer contains — deferred to *"this row's successor amendment"*, i.e. **inside D3's discharge cell**, and D3 now reads DISCHARGED (§7.1) | negative |
| `campaign-core` | D4 `:539` **(missed)** | re-point D4's time-control half: *"nothing exists to build on — `clockState` is an untyped passthrough"* was falsified the same day by [[D1041]] and `rfc/recorded-clocks.md`, which proposes the correction as an **unlanded** 💡 row | nothing holds the act |
| `famous-games` | Deviations `:222-224` **(missed)** | the Library *"historical sources"* surface (`design/03:293`) — this RFC supplies the data shape and builds no surface. **Not** D4, which is cross-pack *authoring* consumers | negative; the audit's own note says *"routed nowhere at all"* |

*(23 obligations listed; `recorded-clocks`' find is the `campaign-core` D4 re-point, counted once
under `campaign-core`. Plus `feedback-delivery` OQ7, conditional, and the Library row — 25 total.)*

### 3.3 What the 74 rhetorical verdicts rest on

Not one was accepted on the RFC's word. **The collector lane's refusals are in the type system**:
`criticalEvents` byte-identical at four members (`evidence-catalog.ts:987`); `EvidenceGrounding` at
nine with no `chess_tradition`; `ruleOfSquareVerdict` at **zero hits**, ratified as [[D909]] ✅;
`module-contract.ts:159` hard-failing unless `rules_floor` is the sole registry-only module;
`evidence-contract.ts:493-495`'s `groundingWidens` check, which makes `semantic-collectors`
Deviation 4 **mechanically enforced rather than chosen** (and `square_clearance_observed` declares
the *opposite* direction, exactly what that checker forbids in reverse). **The surface lane's are in
shipped code and tests**: `THEME_TOKENS` at exactly 12 with `--paper-soft`/`--panel-soft` at zero
occurrences; `MARK_BRUSHES` at 4 so C(4,2)=6 and the 10→6 correction is arithmetic;
`board-input.test.ts:170` asserting assistive labels never match `/best|good|blunder|engine|detector/iu`;
`preset.changed` at zero occurrences; `campaign.schema.json`'s 3/3/≤3 bounds and
`campaign-state.ts`'s single `charge_spent` decrement; `grade.ts`'s pure frozen value object with no
storage column. **And the doctrine refusals cite rulings that exist**: `capabilities.ts:128` marks
`UCI_LimitStrength / UCI_Elo / Skill Level` refused with reason *"Weakened Stockfish is rejected
doctrine"*; `pack-capability-contract`'s five refusals rest on a quoted owner approval clause
([[D995]]); `graduation-clearance`'s on [[D162]] and `exploration/log.md:1231`, with
`pack-validation.ts` carrying no `reviewers` check.

**Twenty of the 22 [W] weakenings were over-claim corrections** — a criterion withdrawn because it
was false or unsatisfiable, with a shipped substitute. `learner-modules` A9's withdrawn sentence
*contradicted its own A7*, and the replacement runs `applyBackstop` **last**
(`module-reducers.ts:311-329`). `exact-legal-mobility` criterion 12 was **unsatisfiable by
construction** (a colour-flipped clone's legal set cannot equal the actual-turn authority's); the
8+6=14 split reproduces exactly. `graduation-clearance` criterion 16's substitute is real —
`release.yml:12` has a `verify` job and `:33`/`:57` both `needs: verify`.

### 3.4 The five first-survey RFCs

**`variants` (15 rows) is the cleanest on the retrofit axis and the dirtiest on the scope-cut axis.**
Every prose deferral is its own D-row, an acceptance blocker, or held by an open ledger row:
solitaire → [[D869]]/[[D870]] + `decision-queue.md:88-92`; reduced armies → [[D873]]/[[D884]]/[[D887]];
xiangqi/shogi → D3 + [[D328]]. chessops ships all **seven** Tier-2 rulesets (verified by class at
`variant.ts:36,118,239,347,384,448,552`), so nothing technical blocks Tier 2 except §2.2 — this
RFC's own section. The criterion that forbade Tier 2 **was already corrected in-tree** ([[D1231]],
*"Corrected before acceptance"*); do not re-mint. Also owed pre-acceptance, not a deferral:
[[D1161]] requires criterion 5 to suppress Maia at *request construction* (`policyUsesMaiaBand`),
because the pinned `maia3/uci.py` builds `chess.Board(fen)` with **no `chess960=True`** and fails by
silent castling corruption. **Correction to this pass's brief: `planning/variants/` does exist**, so
audit #18's objection is about D3's *"recorded when discharged"* cell, not §3.4 validity.

**`recorded-clocks` (13 rows).** §3's *"Predicted — REFUSED, law 8"* is a refusal with a rule **and**
a measurement, cited correctly to `capabilities.ts:128` and `:132`. `Node.clockState` is verified
untyped at HEAD (`types.ts:124`; `drill_run.schema.json:218-222` *"Reserved until clock semantics are
specified by a later RFC"*), so its description of the state it narrows is exact. **Confirmed: this
RFC has no §10** — headings run §1 `:52` … §9 `:296`, then `## Deviations` — so audit #3's route is a
**dangling cross-reference, not a lost obligation** (D1 and D3 hold it).

**`famous-games` (11 rows)** is the only draft of the three with **zero** acceptance blockers,
verified. Its deferral list is explicitly *"Named, with homes, so none of it becomes a silent scope
cut."* The masters-import blocker is real: `storage.ts:4388` is `source_kind TEXT NOT NULL CHECK
(source_kind IN ('pgn_paste','lichess_url'))`, a closed CHECK on a STRICT table. [[D959]]'s
paste-path raw bytes **is** tracked (`BACKLOG.md:328`, 🐞 open), contra audit #25 — what is missing
is a lane, not a row.

**`skills` and `live-following` carry ~zero standing prose residue, and the reason is instructive.**
`skills` (7 rows, 9 OQs all explicitly acceptance-blocking) is **drafted at full depth on the
owner's explicit rejection of a scope cut** ([[D1232]]): a prior derivation recommended *"do not
draft a skills RFC — the first visible pixel ships inside the review lane"*, and the owner overruled
it. §8 refuses eight things, each with a stated rule; its one design-tier deviation is Discharge D6
(`OWNER`). **It is the [[D1230]] mechanism reversed in real time, and the document has nothing left
in prose.** `live-following` (5 rows) refuses six things in a table where every row names its
reason, and correctly identifies the [[D412]] `design/03` clause as already held by `live-sources`
D3 rather than re-minting it. Its §7.1 honest note — *"the store is accepted and entirely
unimplemented; `decision_class` has zero code hits… this seam is paper consuming paper"* — is a
**disclosure, not an obligation**, and I verified the zero-hit claim independently.

**Three dead ends closed mid-pass because these two landed.** `live-sources` OQ2's destination and
audit **#17** are both now `live-following` D3; audit **#16**'s *"Phase B RFC unowned"* is now
`live-following` itself; `longitudinal-store`'s *"it belongs to the F9 RFC that can validate it"* is
now `skills` D1. **The retrofit's target is a moving one, and it moved toward us.**

## 4. The Discharges rows to add — consolidated

**Twenty-three rows.** Every owner cell was checked against `rfc-lifecycle-completion` §3.4's closed
vocabulary and every `planning/` path verified to exist at HEAD. **`planning/learner-rating/`,
`planning/claim-semantic-anchors/`, `planning/runtime-opening-identity/`,
`planning/review-evidence-compiler/`, `planning/famous-games/` and `planning/review-map/` do NOT
exist and must not be used as owner cells.** `planning/variants/` and `planning/campaign/` **do**.

### 4.1 `graduation-clearance` — replace `none` at `:2961-2963` · **land before the D560 apply commit**

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Re-derive how many of §4.2's **43 machine-producible-unaided** blocking entries sit on the **18 ledger-less packs** `verifyDraft` refuses ([[D518]]), and correct §4.2's four-cost table | `claude` | the measurement's landing commit, with the figure written into §4.2 and [[D409]] | |
| D2 | Flip `GRADUATION_RESOLUTION_STALE` from `warning` to **`error`** for `content/drafts/` in §6.3's lint table, in the same commit as the first content wave that drives it to zero | `planning/content-wave-work-order.md` | the wave's shipping commit (ledger flip + `planning/content-era/log.md` entry) | |
| D3 | Build OQ5's compound-entry lead — warn when a `blocking` entry's statement names **two or more distinct instruments** while its `clearance` names one `kind` — and re-read the 220 statements against it | `planning/content-wave-work-order.md` | the first content wave's shipping commit | |

### 4.2 `learner-modules` — after `:1017`

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D5 | Restore `outpost` to `sight_on_request`: [[D906]](2) made the exclusion *"a gate on the fix, not a scope decision"* and [[D566]] closed 2026-08-22, so §4.2's *"minus `outpost`"* (`:519`) and Appendix B's 20-row enumeration are stale; totals move 181/179 → 182/180. Carry the [[D632]] note that the authored truth-set migration does **not** ride it | `claude` | the Appendix-B amendment commit restoring the row | |
| D6 | Correct the recorded [[D898]] ledger row, which still asserts the over-claim this RFC withdrew — `design/BACKLOG.md:509` reads *"lift … can never change membership"*, contradicting the accepted A7's three-arm form. [[D903]] tracks only the eligibility-count flip; the ledger is the machine-read surface and carries the false version | `claude` | the implementation landing commit that flips [[D898]] | |

### 4.3 `semantic-collectors` — after `:648`

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D5 | Pin the `mate-proof@1` proof-tree digest encoding: §2 `:226` promises the serialization and hash are *"pinned in the declaration's semantics at implementation"*, but `rules.tactic.consequence.forced_mate_after_move` ships `proofDigest` as a literal operand (`evidence-catalog.ts:442`) against a semantics string carrying no digest, hash or serialization text (`:196`). C3's pin list omits it | `codex` | the declaration commit that pins the serialization, with its changelog line | |

### 4.4 `play-composition` — after `:675`

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| **D5 ★** | Owner-use validation of the tablet/desktop boundary — 1023/1024 is claude-chosen, not measured (`play-composition.ts:18`); if landscape tablets read cramped in rail form the boundary moves by token (OQ1) | **`OWNER`** | the owner-use session log entry in `planning/platform-alignment/log.md` | |
| D6 | Record the compact-tab successor's resolution rather than shipping it silently — the implementation kept `compactTab` within §2.3's bound, but OQ2's promise that *"its resolution lands in the planning log"* is unpaid: `planning/play-composition/plan.md` has zero hits | `planning/play-composition/plan.md` | the plan entry naming the shipped switcher as OQ2's resolution | |

### 4.5 `intent-presets` — after `:444`

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D4 | The module-delivery disclosure logging §6's no-lane decision rests on — no module `on_request` grant event exists at HEAD, so criterion 9's *"every rendered item traces to a logged disclosure event"* is vacuous and §6's refusal of run lane 0.19 and `preset.changed` is unbacked by its own guard. `learner-modules`' register carries no such row | `learner-modules.md` | the `learner-modules` commit that logs a disclosure event for every module-rendered item, criterion 9 green on a live run | |

### 4.6 `longitudinal-store` — after `:722`

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D2 | The `derived_rev` bump duty is unenforced: OQ3 proposes every RFC changing the derivation or ingest set names the bump in its own criteria, and **zero RFCs at HEAD do** (`skills.md:349` is a checklist row). Recording the OQ3 answer under [[D973]]/[[D1011]] settles who rules; it does not create the mechanism. Either a detector exists beyond AC-11's fixture, or §4.4's *"a bump outside an RFC is a defect"* is withdrawn | `longitudinal-store` | the landing commit that resolves OQ3, alongside [[D973]]/[[D1011]] | |

### 4.7 `pack-population-provenance` — after `:704`

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D3 | Rule on Q3 — whether `citable_text` records are re-fetched and re-hashed on a schedule. §1's `sha256`/`etag` and `EVIDENCE_DIGEST_STALE` detect **pack** drift, never **source** drift, so a citation whose source page changed stays green forever; [[D263]] is the same failure one field over and is still open | `pack-population-provenance` | the ruling, recorded here or in a `design/BACKLOG.md` row this section cites | |
| D4 | §8a Seam 2 — the `provenance_note → citable_text` wiring rests on `MACHINE_LABEL_EVIDENCE_KINDS`, which draft `claim-semantic-anchors` deletes. §8a asserts this is *"recorded in this RFC's Discharges"* and it is **not**, and asserts *"both now do"* name each other while `rfc/claim-semantic-anchors.md` has **zero** occurrences of `citable_text` or this slug | `pack-population-provenance` | the second-landing commit, in whichever direction it falls | |

### 4.8 `feedback-delivery` — after `:2535`

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D2 | Rule on OQ2 — whether `renderStructuralObservation` moves into `packages/runtime`. At HEAD the client renders through `structural-sentences.ts:7` while `comparisonNarrative`, the evidence packet and `/voice` render through the poorer `renderStructuralObservationChange` (`structure.ts:597`), so CR4's upgrade reaches one of four surfaces. Either the move lands, or the two-renderer split is declared permanent and stated where a reader of the strip can see it | `feedback-delivery` | the ruling, recorded in `planning/feedback-delivery/` alongside the stage-2 measurement | |

### 4.9 `exact-legal-mobility` — after `:436` · **land before archival**

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D2 | Name the display layer of [[D1029]]'s three-layer castling split — a `MOVE_DISPLAY_CONVENTION`-class exported constant over the SAN path (`board-input.ts:72` `moveSanFromUci`), asserted by the same emit-boundary fixture as criterion 15's other two. [[D1027]] covers emit + ingest naming, not display | `planning/exact-legal-mobility/` | the constant's landing commit + criterion 15 fixture extension | |

### 4.10 `campaign-core` — after `:540`

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D6 | What the prestige layer contains — army building, cosmetic tiers, and §8.4's adoptable fragments (reset/retirement, the pity guarantee). Deferred by D3's **discharge cell** to *"this row's successor amendment"*, i.e. inside a row that reads DISCHARGED and is therefore invisible to the register ([[D1201]]'s class) | `planning/campaign/` | that amendment's registration | |
| D7 | Re-point D4's time-control half. Its parenthetical *"nothing exists to build on — `clockState` is an untyped passthrough"* was falsified the same day by [[D1041]] and `rfc/recorded-clocks.md` §4; the half belongs to `planning/time-controls/`, and D4's own destination is a directory | `claude` | this RFC's next amendment | |

### 4.11 `bot-policy` — after `:795`

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D6 | Pack-side profile references (OQ3) — a pack declaring an `opponentPolicy.profile`; it claims a pack-schema lane and is deferred to a future RFC that does not exist | `claude` | that RFC's landing commit | |
| **D7 ★** | Bot persona naming — the twelve profile names are placeholder and carry zero policy content (`planning/bot-roster/roster.md:101-104`); the final set is a presentation/design-tier call that is in no queue | **`OWNER`** | `planning/platform-alignment/decision-queue.md` | |
| **D8 ★** | [[D810]]'s evidence-to-move selector — fund, defer, or **refuse explicitly** (`roster.md:494`): the only variant-portable route to a human-shaped base, and [[D1030]]'s pattern requires a recorded refusal rather than an implied one | **`OWNER`** | `planning/platform-alignment/decision-queue.md` | |

### 4.12 `runtime-opening-identity` — after `:510`

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D3 | Assign an owner to the *"out of book"* convention that §6 refusal 2 declares unowned — either a named consumer that defines it over declared inputs, or an explicit ruling that the product never renders it | `planning/evidence-foundation-ux/` | the defining RFC's projection section, or the recorded refusal | |

### 4.13 `claim-semantic-anchors` — after `:388`

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D4 | Author review of the 43 legacy claim candidates Stage B leaves permanently unbound (36 `tablebase_exact` + 7 `engine_validated`, [[D1007]]); each is rewritten into a V2 machine clause or explicitly kept author-attributed. Criterion 12 asserts they *stay* unbound — it locks the state in, it does not discharge it | `planning/platform-alignment/` | the corpus rewrite commits, or the recorded decision to keep them authored | |

### 4.14 `review-evidence-compiler` — after `:470`

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D4 | Remove the deprecated `ready` / `pendingEvidence` summaries §4.1 `:310-312` retains *"temporarily"* once per-family states have a consumer; both are shipped and learner-visible today (`run-state.ts:41,48`, `api.ts:529`, `GameStoryScreen.svelte:43`) and *"temporarily"* names no end condition and no owner | `planning/evidence-foundation-ux/` | the deprecation-removal commit + a Story fixture asserting the fields are gone | |

### 4.15 `famous-games` — after `:270`

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D6 | The Library *"historical sources"* surface (`design/03-product-breadth.md:293`) — this RFC supplies `sourceGame`, the data shape that surface needs, and builds no surface. Distinct from D4's cross-pack **authoring** consumers: this is the learner-facing Library entry, routed nowhere today | `claude` | a `design/BACKLOG.md` 💡 row minted at this RFC's acceptance, then that row's lane | |

*Deliberately **not** *"a successor RFC"* — that is the destination pattern the audit indicts at #12
and #6. A ledger row minted at acceptance gives it a destination `make work-index` can see.*

### 4.16 Not rows — recorded so they are not lost

- **`feedback-delivery` OQ7** — *"ledger row **if** the measurement confirms it"* for
  `hasWithheldAuthoredContent`. Conditional; the corpus has already made the case worse. Belongs in
  `design/BACKLOG.md`, not the register.
- **`pack-population-provenance` §7's proposed ids D533–D536 are declared dead by the RFC itself**
  at `:743-745`. §4.1 saw the pointer but not the retraction — a **self-invalidated destination**,
  one class worse than a missing cross-reference.
- **`variants` [[D1161]]** — criterion 5 must suppress Maia at *request construction*, not at the
  offered set. A pre-acceptance correctness item, not a deferral.

---

## 5. Owner-tier

### 5.1 Three register rows for the decision queue

```
Append under decision-queue.md's Missing-decision refresh section:

- **[[D1134]] batch-2 — the tablet breakpoint is a shipped guess, not a measurement.**
  `rfc/play-composition.md` OQ1 states the 1023/1024 boundary is *"claude-chosen, not measured"* and
  *"moves by token if owner use disagrees"* — a [[D649]] owner-use validation obligation. The value
  is shipped (`play-composition.ts:18`, `DrillScreen.svelte:1603`, fixture
  `play-composition.test.ts:10`) and **zero trackers carry the validation**. One session answers it;
  until then a structural claim about landscape tablets rests on nothing.

- **[[D1134]] batch-2 — the twelve bot persona names are placeholders nobody has ruled on.**
  `planning/bot-roster/roster.md:101-104`: *"Naming is placeholder … the owner or design tier picks
  the final set."* Zero rows in `design/BACKLOG.md` or either queue. Presentation-tier, cheap, and
  it becomes expensive once a name ships in a card a learner reads.

- **[[D1134]] batch-2 — [[D810]]'s evidence-to-move selector needs an explicit fund/defer/refuse.**
  `roster.md:494` is emphatic that *"a refusal must be recorded, not implied"*. The topic has ledger
  rows ([[D810]] 💡, [[D1162]] 📊); neither is an obligation row naming the owner act, and the queue
  has no entry. It is the only variant-portable route to a human-shaped base, so a silent defer is a
  decision about the bot roster made by not deciding.
```

**Note for whoever lands D7/D8**: their destination is `decision-queue.md`, which **must be edited in
the same commit**. That file has not been written since 2026-08-23 14:27 and is already the
destination three existing rows point at and miss (§7.5).

### 5.2 Five acceptance blockers — reported, never converted

`rfc-lifecycle-completion:356`: *"`## Open questions` are resolved before `accepted`."* Converting
these would assert they survive an acceptance that has not happened.

| RFC | OQ | disposition |
|---|---|---|
| `variants` | **OQ1 `:329-333`** — ⚖ OWNER, self-labelled BLOCKING: is a Maia-dark Chess960 acceptable? `PositionOpponentPolicy` (`types.ts:76-78`) restricts Just Play to `human_common \| strong_engine`. [[D1153]] ruled the direction (*compose a non-Maia bot*) and holds this OQ open pending its return | **owner act → earns a row written into the acceptance commit** |
| `variants` | **OQ2 `:334-335`** — ⚖ OWNER: is 960 opening-explorer data wanted? *"One line at `explorer.ts:67` buys it, and 960's point is having no book."* **Not in the decision queue** | **owner act → row at acceptance** |
| `variants` | OQ3 `:336-339` — 960 ratedness, recommendation *"unrated, stated"* | author-resolvable; plain blocker |
| `recorded-clocks` | **OQ1 `:364-366`** — ⚖️ readout placement, *"unmeasurable from a document; an owner-use question"* | **owner-use act → row at acceptance** |
| `review-evidence-compiler` | Depends `:14` — the D921 Wave-C amendment, required *"before acceptance"*, tracked at `BACKLOG.md:514`, cited only in a Depends bullet | tracked; cite it |

`famous-games` has **zero** acceptance blockers, verified.

### 5.3 Why the new owner-tier count is small, stated honestly

Batch 1 surfaced 12 owner-tier obligations from 85 rows; batch 2 surfaces **3 register rows from
171**. The reason is not that the corpus is healthier: the active corpus's owner-tier obligations
are already *in* registers — `bot-policy` D4/D5, `campaign-core` D1, `feedback-delivery` D1,
`intent-presets` D1, `live-sources` D2/D3, `pack-population-provenance` D1, `recorded-clocks` D2/D3,
`review-evidence-compiler` D3, `theming` D1/D5, `famous-games` D3/D5, `skills` D6, `live-following`
D1, `variants` implicit. That is **~18 open `OWNER` rows across the active table**, and
`deferral-inventory.md` §6.1 already records that **none of them is in the decision queue**.
**The queue-vs-register split is the live defect, not the prose.**

Two facts worth the acceptor's attention, neither a new row:

- **Four standing obligations converge on one held wave.** `graduation-clearance` D2/D3,
  `feedback-delivery` D1 and `pack-population-provenance` D1 all wait on a content wave behind
  **[[D560]]** (owner ruling 2026-08-20). Correctly blocked, not lost — but blocked on the same
  thing, which is worth seeing in one place.
- **`feedback-delivery`'s stage 2 has no owner at all** ([[D476]]) while criterion 21 hangs
  archival on it.

---

## 6. The [[D1230]] scope-cut class — the honest number is 9, not 24

Applying the brief's test — *is document size, landability or reviewer load the **only**
justification?* — yields **9 rows across all 171**, every one already in `scope-cut-audit.md` bucket
(C), **none newly minted here**:

| # | row | where | why it is a pure size cut |
|---|---|---|---|
| #1 | Tier 2 + Tier 3 excluded, **and a criterion added forbidding them** | `variants:135-136`, `:307-309` | chessops ships all seven Tier-2 rulesets; the only blocker is §2.2, this RFC's own section |
| #4 / #20 | Chess960 drill packs + the 960 pack lane, cut on Gate F lane depth | `variants:254`, `:315` | the justification is literally lane accounting — and `famous-games` claimed lane 0.31 **eighteen minutes later** while saying so |
| #7 | Reduced armies / pawns-only → *"its own lane"* | `variants:257` | the RFC calls it *"the highest evidence-per-effort item in the family"* and *"it needs nothing from this RFC"* |
| #8 | Solitaire chess → *"its own lane, running in parallel"* | `variants:256` | the named blocker is `campaign-core` D2's, not this RFC's |
| #43 | digest staleness *"deferred rather than answered"* | `pack-capability-contract:709-714` | |
| #46 | detector semantics v1 + the 14 F1 mismatch rows | `pack-capability-contract:82-83` | |
| #48 | 3D boards, background images, per-context themes, zen mode | `theming:83-84` | *"no reason and no destination given"* |
| **T3** | the seven ledger rows moved out of F3's Discharges register **for a closed-vocabulary formatting reason** | `pack-capability-contract:587-591` | see below |

That last one deserves its own sentence. An author removed seven obligations from *the only
machine-checked register in the repo* because the owner column's vocabulary was inconvenient. **That
is [[D1134]]'s defect being re-created deliberately, five days after it was diagnosed.**

### 6.1 Why the two instruments disagree, and which is right for which purpose

`scope-cut-audit.md` §1 defines (C) as *"remainder has no named home **and** owner"* — a
**destination** test. The D1230 lens is a **justification** test. On active RFCs they diverge, and
five independent readers hit the same wall:

| audit row | why it is not a size cut |
|---|---|
| **#38** `claim-semantic-anchors`' nine-item list | architectural (*"the missing system is the join between them"*); eight of nine have a named Active owner |
| **#40 / #41** `review-evidence-compiler` | #40 is *a rule constraining any future actor* — nobody is promised to act; #41 is a construction-level impossibility (`beforeFen`/`afterFen` are provably not declared operands) |
| **#5** 8 of 12 bot profiles | `ErrorGuardLayer.searchBound` is `"nodes" \| "movetime"` (`types.ts:99`) — depth genuinely is not expressible. Held by [[D1181]] |
| **#12** learner-facing masters import | the closed `source_kind` CHECK (`storage.ts:4388`) is a verified technical blocker |
| **#37 / #42** `runtime-opening-identity`, `exact-legal-mobility` | evidence- and coverage-gated, **but genuinely uncarried** — which is why they appear in §4 as rows **D3** and **D2**. The complaint is right; the bucket is wrong |
| **T3** six local `allDests()` sites | not a cut at all — the reason is a proof that a colour-flipped clone's legal set *cannot* equal the actual-turn authority's, and criterion 12 CI-classifies them |

**The reconciliation, and it should be adopted:** a row that is uncarried *and* size-justified is a
scope cut to reverse; a row that is uncarried *and* substantively justified is an **obligation to
register**. (C) currently merges both. **Fifteen (C)/Tier-3 rows over active RFCs should move —
five to Discharges rows (§4.9, §4.12, §4.14, §4.15, and #46's live half), ten out of (C)
entirely.** A further **four are stale at HEAD** (#16, #17, and the two `variants` criterion halves
[[D1231]] already corrected) because the tree moved after the audit ran.

### 6.2 The class is confined to one drafting burst, and that is checkable

`scope-cut-audit.md`'s corpus is *"the 8 RFCs created 2026-08-23"* plus nine planning documents — so
**20 of the 29 active RFCs have never been scope-cut-audited.** Batch 2 read all of them and found
**zero** new D1230 instances. An exhaustive grep over `rfc/*.md` for the vocabulary (`smallest real
range`, `first visible pixel`, `smaller document`, `landable`, `reviewer load`, `keeps the RFC
small`, `to keep this document…`, `comprehensive one`) returns **two hits in the entire active
corpus**: `live-sources:56` (*"the smallest slice that lets a URL paste work ships first"* — since
carried by `live-following` D3) and `skills:52`, which is the sentence **rejecting** the cut.

**Finding: the [[D1230]] pathology is a property of the 2026-08-23 derivation-template burst, not of
the active RFC corpus.** That is good news for the template repair — a bounded, dated problem with a
known cause — and it means the retrofit and the scope-cut reversal are largely disjoint work.

---

## 7. Six findings the inventory's method could not see

### 7.1 The closed-tracker class — an act whose gate fired and whose tracker then closed

**Three of batch 2's standing obligations are one species, and §4.1 could not see any of them,
because all three DID name a destination.** The destination then closed and took the tracker:

- **`outpost`** waited on [[D566]]. D566 went **✅** 2026-08-22; `learner-modules.md:519` still reads
  *"minus `outpost`"*. The only surviving pointer is `codex-queue.md:700-710`, whose code half is
  complete and whose residual sentence — *"outpost returns … **and the accepted module table is
  amended**"* — has no owner and no gate.
- **The `mate-proof@1` digest** waited on *"at implementation"*. The implementation landed; no
  criterion was watching.
- **`campaign-core`'s prestige contents** were deferred *"to this row's successor amendment"* —
  inside **D3's discharge cell**. D3 now reads DISCHARGED, so the obligation is inside a row
  `make work-index` cannot see by construction.

Batch 1 found the same shape once — `SourcingIssue.code` inside **[[D54]], a closed ledger row**.
Four instances across two batches makes it a class:

> **An obligation is invisible if its tracker's closure condition is narrower than the obligation.**
> A ✅ row is not read again by anything. `make work-index` reads open rows; the archiving gate reads
> the register; nothing re-reads a closed row to ask whether it closed *everything* it carried.

**The instrument's next refinement is not more prose scanning.** It is checking, for each named
destination, whether that destination is **still open** — a cheap join `work-index` could already
compute, and the one that would have caught all four.

### 7.2 Counterparty assertion — an obligation one RFC places on another's register

| asserting document | asserted onto | held there? |
|---|---|---|
| `intent-presets` §6 — the disclosure logging §6's no-lane decision *"rests on"* | `learner-modules` | **no** — D1–D4 are preset activation, composition seating, the grade-family RFC and durable novelty |
| `pack-population-provenance` §8a — *"recorded in this RFC's Discharges"*, *"both now do"* name each other | itself **and** `claim-semantic-anchors` | **no** in both directions |
| `play-composition` OQ3 — the post-commit echo | `theming` D5 | **yes** — the healthy case: the counterparty's register **does** carry it, and only the citation is missing |

The gate reads clean on **both** sides of a broken assertion: the asserting RFC has no row (it
believes the counterparty holds it) and the counterparty has no row (nobody told it). This is
`teacher-surface` OQ11 generalised — and the healthy third row shows the fix is one line.

### 7.3 The dead chain [[D1134]] names, confirmed at both ends

1. `runtime-opening-identity:425-426` §6 refusal 8: *"Accuracy-by-opening and player style require
   the observation store, denominators and **their own RFC**"* — **it names no slug at all.**
2. Resolving *"the observation store"* to `longitudinal-store`, that document hands the same work
   onward at `:113-114`: *"Those are F6/F9 consumers ([[D549]]/[[D552]]/[[D844]]) with their own
   RFCs, floors, and validation obligations."*
3. **The F6/F9 RFCs do not exist** (`rfc-graph.md:73`, `:76`; no `rfc/review-map.md`).
4. Both owner asks are visible as open 💡 ledger rows but **neither RFC cites either**, and
   [[D549]]'s own row waits on `longitudinal-store` implementation — **the chain is circular as
   well as dead.**

**Half of it closed during this pass**: `rfc/skills.md` D1 is now the F9 consumer for the rate-and-
tier arm. The F6 half is still open.

### 7.4 The unnamed successor — *"whichever RFC lands second"*

**Ten occurrences across five active RFCs**, and *"whichever RFC lands second"* / *"whoever next
edits that row"* is **not a member of §3.4's closed vocabulary**. It names no one — so §4.1 and §6.2
both counted these as *having* a destination:

| where | wording | state |
|---|---|---|
| `graduation-clearance:2721` | *"whichever lands second adopts the other's vocabulary in one commit"* | open |
| `graduation-clearance:2833` | criterion 10 — *"whichever RFC lands second re-stamps every ledger"* | **held** by `pack-capability-contract` D3 |
| `graduation-clearance:2971`, `:2990` | the D227 move; §8's landing-order rule | closed / a rule |
| `feedback-delivery:2106` | *"Whichever RFC lands second owns reconciling it"* — the three meanings of *"withheld"* | open |
| `measurement-records:1325` | *"Whichever lands second should confirm the flag names"* — **and the premise is stale**: it calls `rfc/dead-vocabulary.md` *"(draft)"* while that RFC is **implemented and archived** (`rfc/README.md:403`). Dead-vocabulary already landed; the obligation fell to `measurement-records` and nothing records it | open |
| `pack-capability-contract:716` | `checkpointInteraction` arity — *"owned by whoever next edits that row"* (audit #44, *"Not a person"*) | open |
| `pack-population-provenance:576`, `:725`, `:890` | the reciprocal note; Q2's *"whichever RFC first has a non-empty official shelf"*; *"whichever lands second owes the reconciliation"* | open ×3 |

**Recommendation:** the archiving-gate repair [[D1201]] already needs should include a lint for this
phrase family. It is a fixed, greppable vocabulary, and every instance is either an obligation with
no owner or a rule that should be stated as one.

### 7.5 The ⚠ class is bigger than the retrofit, and one instance is timestamp-provable

**Fourteen Discharges rows exist and point at a destination that does not exist or cannot hold
them**: `variants` D1/D2/D3, `recorded-clocks` D1/D2/D3, `famous-games` D2/D3/D4/D5, `live-sources`
D1/D2/D3, `pack-capability-contract` D4. That is **16% of the active register**, against 23 rows this
retrofit adds.

The sharpest instance is checkable by clock. `famous-games` D3 and D5 and `recorded-clocks` D3 all
name `planning/platform-alignment/decision-queue.md` as their destination. **That file was last
written at 2026-08-23 14:27:05 (`a77621e`); the three RFCs were drafted at 17:41, 17:59 and 19:00.**
The rows could not have been recorded there, and nothing checks. A destination cell naming an
existing file passes every check the repo has, whether or not the file was ever edited to hold the
row.

**Batch 2's recommendation, and it is cheap:** a row whose destination is a *file* should be
verifiable by grepping that file for the row's id. Three of these fourteen would fail that grep
immediately.

### 7.6 Three corrections

**(a) Batch 1 §4.4's parenthetical is false at HEAD, and was false when written.** Batch 1 verified
`schemas/drill_pack.schema.json` reads `drill-pack:0.27` and concluded *"lane 0.28 is still free
exactly as promised"*. **Shipped version ≠ unclaimed lane.** `rfc/README.md`'s register is the
authority: **0.28 `graduation-clearance` · 0.29 `pack-population-provenance` · 0.30
`pack-capability-contract` · 0.31 `famous-games`.** Lane 0.28 has been claimed since
graduation-clearance's 2026-08-17 acceptance — **six days before batch 1 ran**. Next free is
**0.32**, itself contested (`skills` OQ9). There is **no sentinel row**.

This is not only a batch-1 erratum. `rfc/measurement-records.md` asserts *"0.28 stays free"* in
**four places** (`:125`, `:344`, `:363`, `:1354`), including its §Registers resource claim and a
quoted sentinel row that does not exist. **Open question 1's stated reason for deferring the
`measurements` surface — *"to keep pack lane 0.28 free"* — is therefore void: the lane it was
preserving was already taken.** That upgrades OQ1 from an acceptance blocker with a rationale to an
acceptance blocker whose rationale is false.

**(b) Six of `scope-cut-audit.md`'s citations for `pack-capability-contract` no longer resolve**,
drifted by the six-blocker repair: #43 `:632-637`→**`:709-714`**, #44 `:638-641`→**`:716-718`**, #45
`:616`→**`:693`**, #46 `:77-78`→**`:82-83`**, Tier-3 `:510-513`→**`:587-591`** and
`:379-381`→**`:457-459`**. Worth one commit before bucket (C) is worked.

**(c) One rule conflict, flagged not resolved.** `refused-vs-asked.md:436` proposes that *"a planning
directory is not a discharge target"*. `rfc-lifecycle-completion` §3.4 explicitly permits *"a
`planning/` path that exists"*, and it is the shipped rule — **nine** of this batch's proposed and
existing rows depend on it. The proposal is stricter than the standing law; someone should rule
rather than let two documents disagree.

---

## 8. The count, and whether batch 1's prediction held

### 8.1 Did batch 1's prediction hold? No — and the reason matters more than the answer

Batch 1 wrote: *"If the 24 active RFCs behave like `learner-rating`, their share of the 539 is nearly
all real."* It rested on one observation — the single active RFC in that sample scored **44%**.

**Batch 2 measures the active corpus at 10% of §4.1 rows, not "nearly all."** The prediction failed,
for a reason batch 1 could not have known: **44% was a property of `learner-rating`, not of
activeness.** `learner-rating` is a *measurement* RFC whose Open questions are literally **unrun
experiments** — a human anchor, three calibration rungs, a material-band arm. Unrun experiments are
obligations by construction. Most active RFCs are **contract** RFCs, whose Open questions are
*decided options with shipped defaults*, and whose refusals live in closed type unions a grep
verifies in seconds.

The variable that predicts the live share is not active-vs-archived. It is **whether the document's
deferrals are experiments or decisions** — and, secondarily, **whether the document was written
after the `## Discharges` register existed.** Every RFC drafted 2026-08-23 carries a full register
and near-zero prose residue; `graduation-clearance`, three weeks older, carries `none` and three
live obligations. That is [[D1134]]'s own thesis, measured from the other side.

**Batch 1's headline finding survives intact and is strengthened**: a well-written named-limitations
section scores *worst* on a textual matcher. Batch 2 reproduces it at **74%** versus batch 1's 68%,
on a different corpus, with the collector lane at 86% rhetorical because its refusals are in the
type system rather than in prose.

### 8.2 What this implies for the rows still unread

Batch 1 read 85 rows; batch 2 read 171. **Between them the two batches have adjudicated 256 rows and
produced 48 real obligations — 19%.** The samples now bracket the corpus: batch 1 took the heaviest
documents, batch 2 took every active one. They agree on the rhetorical share (68% / 74%) and
disagree on the owner-tier share, which collapsed because active RFCs already put their owner
questions in registers.

**Revised estimate for the ~354 §4.1 rows still unread — all in archived RFCs: 12–18%, or roughly
45–65 real obligations.** Lower than batch 1's 20–30%, for one structural reason batch 2 can now
state with evidence: **archived RFCs defer into refusals that already resolved, and their real
obligations were largely re-homed at archival by the very gate [[D1201]] criticises.** The gate is
leaky, not absent. The residue that matters is concentrated in the handful of documents that
archived *before* the register convention existed and whose hand-offs were written in an Open
questions section.

**Recommendation for batch 3, if there is one: do not sample by row weight.** Sample by the
**closed-tracker join** in §7.1 — every prose deferral whose named destination is a `✅` ledger row,
an archived slug, or a file that never mentions the row's id. That is a mechanical query, it is
where both batches found their genuinely invisible obligations, and it is a far smaller set than
354.

### 8.3 The check this batch validates

`refused-vs-asked.md:435` proposes: *"an RFC whose body contains an Out of scope / Deferred / Refused
section may not declare `Discharges: none`."* **Batch 2 is the measurement that validates it.** Three
active RFCs declare `none`. Two — `graduation-clearance` and `measurement-records` — have exactly
such a section and carry standing obligations; the third, `0000-rfc-process`, does not and its `none`
is correct. **The check would have fired twice with zero false positives on the active corpus.** It
is the cheapest single repair in this document, and it would have caught the batch's worst case.

---

## Provenance

Every claim above is anchored to a file and a line, or to a symbol name, at `6654f05`–`d5ce431`.
Code and document state was verified at HEAD rather than inherited from the RFCs — the evidence
column of §3.2, the symbol roundup in §3.3, and the `## Discharges` census across all 29 active
RFCs. The claims most load-bearing for the verdicts, each re-derived independently: `decision_class`
and the two store tables at **zero** code hits; `derived_rev` in exactly **two** RFCs;
`MOVE_DISPLAY_CONVENTION`, `preset.changed` and `ruleOfSquareVerdict` at **zero**;
`GRADUATION_RESOLUTION_STALE` in **two files**; `bot-policy-catalog.ts:296`'s empty catalog;
`learner-modules.md:519`'s *"minus `outpost`"* against [[D566]] ✅; `design/BACKLOG.md:509`'s
surviving [[D898]] over-claim; the pack-schema lane register at 0.28–0.31 with no sentinel row; the
absence of a `§10` in `recorded-clocks`; the absence of `rfc/dead-vocabulary.md` against
`measurement-records`' *"(draft)"*; `decision-queue.md`'s 14:27 mtime against three RFC drafting
times; and the ten *"whichever lands second"* occurrences.

RFC line numbers drift under active forks — six of `scope-cut-audit.md`'s are already stale (§7.6b)
— so locate by heading and symbol, per those RFCs' own locator rules.

**No RFC was edited by this pass. Nothing was committed.**

---

## Addendum 2026-08-23 19:38 — four findings overtaken by owner rulings `0209645`

Rulings **[[D1270]]–[[D1275]]** landed minutes after this pass finished. **Read these before minting
any row from §4 or §5**; four items move.

| this document | what changed |
|---|---|
| §4.11 **`bot-policy` D8** (`OWNER` — [[D810]]'s selector, *fund/defer/refuse*) | **RULED: FUND** ([[D1271]]). The obligation is real and now *funded*, so the row should still be minted — but its owner cell is **no longer `OWNER`**; it becomes an implementer row. **Do not put it in the decision queue.** §5.1's third bullet is withdrawn |
| §3.21 / §5.3 — `live-sources` **D2**, `live-following` **D1**, both blocked on the B5 ruling | **RULED** ([[D1272]]): *"a live game is just a game that updates; casting is a separate surface that integrates with it."* Both rows' blocker is lifted; they need re-homing or discharge, not retrofit |
| §5.2 — `variants` **OQ1/OQ2** as acceptance blockers | **`rfc/variants.md` is RETURNED** ([[D1275]], 97 claims re-derived, 27 failed, 6 return-class) and one return-class blocker is precisely that **it asks the owner a question the owner had already closed**. The blockers stand, but their framing is part of what returned the draft |
| §3.4 — my citing [[D1231]] as *"already corrected in-tree; do not re-mint"* | **[[D1274]]: that correction OVERSHOT** — the rewritten criterion 12 **cannot fail**. My "do not re-mint" verdict was right about the original defect and wrong to treat the repair as settled |

**Nothing else in this document is affected**: the 25 obligations, the [[D1201]] ranking, and the
two archival deadlines (`graduation-clearance`, `exact-legal-mobility`) are untouched by these
rulings. **Owner-tier register rows to mint drop from 3 to 2** — `play-composition` D5 and
`bot-policy` D7 (persona naming), which no ruling touches.

This addendum is itself an instance of §7.1's finding: **a document that records obligations goes
stale the moment its destinations move, and nothing re-reads it.** The pass took roughly four hours;
three of its rows were overtaken inside that window.
