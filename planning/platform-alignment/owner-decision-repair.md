# Owner-decision repair — the unrecorded-ruling sweep, and the derived decision queue

- **Written:** 2026-08-23 by claude, commissioned off [[D1232]] (`design/BACKLOG.md:444`).
- **Two repairs, one defect.** Repair 1 sweeps for owner rulings that exist nowhere on disk, or
  whose consequence was never applied. Repair 2 specifies `decision-queue.md` as a **derived**
  artefact so the class cannot recur, and produces the queue's true contents.
- **Corpus pinned at `e51b5a3`.** Counts here rot exactly as `refused-vs-asked.md:16-18` says of
  itself. The durable content is §2.8, §3 and §4.
- **Nothing committed. Nothing edited.** No ledger row written, no RFC amended, no `design/`
  document touched (law 5), and no file held dirty by another agent modified —
  `rfc/pack-capability-contract.md`, `planning/review/`, `planning/exact-legal-mobility/` and the
  `apps/`/`packages/` working set were **read only**.

---

## 1. Why this document exists

[[D1232]] recorded that the owner's rejection of [[D1193]] **existed nowhere on disk**. The row
still read *"the cheapest real path to the owner's skills ask"*, so `make work-index` reported it
routed and the next reader would have acted on an overruled recommendation. The audit that found it
flagged its own caveat verbatim (`planning/platform-alignment/scope-cut-audit.md:769`):

> *"The owner's rejection of [[D1193]] is not on disk in any form… If other verbal rulings from
> this session are likewise unrecorded, this file understates the problem."*

This document discharges that caveat. Two prior defects give the sweep its shape, and they are
**opposite directions of one failure**:

| Direction | Instance | Row |
|---|---|---|
| A ruling was made and **its consequence was never applied** | [[D1060]] lifted the famous-game refusal; `capabilities.ts:159` still carried it hours later | [[D1086]] `:408` |
| A consequence was applied and **no ruling was ever made** | `design/06` §5 wrote the survival producer citing *"owner ruling 2026-08-22, D886"* — D886 was `💡 open` | [[D1165]] `:458` |

Both come from the same missing step, which [[D1165]] names: **reconcile the document against the
ledger's ⚖️ rows before writing.** The sweep below looks for both shapes plus a third the D1193 case
introduces — **a ruling that produced no row at all**.

---

## 2. Repair 1 — the sweep for unrecorded and unapplied rulings

### 2.1 Method

1. Enumerated every `⚖️` row in `design/BACKLOG.md` and read its status cell.
2. Enumerated every ledger row dated `2026-08-23` (140) and every one of those mentioning the owner
   (51).
3. Read `planning/exploration/log.md`'s 2026-08-22/23 window and the ruling batches recorded in
   `planning/rfc-drafting-queue.md:845-1003`, which is where the second and third batches actually
   landed.
4. For each ruling, cross-checked the documents it contradicts: `planning/platform-alignment/decision-queue.md`,
   `planning/exploration/gates.md`, `design/03-product-breadth.md`, `design/06-campaign.md`, the
   active `rfc/` set, and the code sites each ruling names.
5. Grepped for the owner-facing markers in use and measured how well they separate *ruled* from
   *awaiting a ruling*.

### 2.2 The ruling inventory

**28 `⚖️` rows exist.** 27 carry a `ruled`/`commissioned` status cell; exactly **one** — [[D1212]]
`:441`, `⚖️ open — owner question, drafting-blocking` — is a **question, not a ruling**. This is the
first structural finding, and §3.2 turns on it: **the `⚖️` glyph is overloaded**, so no derivation
may key on the glyph alone.

Of the 28, **24 were made on 2026-08-22 or 2026-08-23**: D945, D946, D947, D949, D950, D953, D976,
D977, D982, D995, D996, D997, D1005, D1006, D1029, D1040, D1041, D1042, D1043, D1058, D1060, D1061,
D1077, D1093, D1151, D1152, D1153 (`:52`, `:53`, `:282`, `:289-291`, `:296-297`, `:330-332`, `:335`,
`:337-338`, `:370`, `:373-375`, `:385`, `:388-390`, `:421-422`, `:461`, `:472`, `:479`).

### 2.3 Class A — the ruling produced no `⚖️` row (the D1193 template, **still live**)

**The template case is not repaired.** [[D1232]] recorded *that* the rejection was unrecorded; it
did not record *the ruling*. At HEAD:

| Row | Line | Status cell | Asserts |
|---|---|---|---|
| [[D1193]] | `:454` | `💡 open — the cheapest real path to the owner's skills ask` | **do NOT draft a skills RFC** |
| [[D1222]] | `:449` | `💡 open — RFC commissioned; fork 1 goes to the owner` | **DRAFT the skills RFC — the earlier recommendation is WITHDRAWN** |

Two rows in one ledger assert opposite things, both `💡 open`, and `make work-index` reports both
routed. The owner's actual ruling — *"well what do you mean no rfc at all? does it have the depth we
need?"* (`planning/skills/rfc-derivation.md:24`) — **still has no `⚖️` row.** It is recorded only as
(a) a withdrawal note inside a `💡` recommendation row, (b) a struck-through line at
`planning/rfc-drafting-queue.md:919`, and (c) prose at `planning/skills/full-depth-derivation.md:612`.

This is exactly the [[D1165]] failure mode inverted at the ledger tier: an intent-bearing decision
whose citation resolves to no `⚖️` row. **D1193 must be superseded or struck, and the ruling must
get its own `⚖️` row.**

A second, structurally identical case: [[D1190]] `:432` — *"I FRAMED [[D1151]] TO THE OWNER ON A
FALSE PREMISE"*. The ruling [[D1151]] `:421` stands and its `design/06` §5 amendment landed
(`design/06-campaign.md:368`), but the **ground the owner was given was stale when given**, and the
row's own status is `🐞 open — owner re-confirmation owed on the ground, not the conclusion`. The
re-confirmation has not been sought and is in no queue.

### 2.4 Class B — the ruling is recorded, but a document still asserts the overruled position

This is the largest class and `decision-queue.md` is the worst offender. **Every one of the four
2026-08-23 rows the queue does mention is stale**, and the staleness inverts the ruling:

| Queue text | Line | Ruled by | Reality |
|---|---|---|---|
| *"[[D886]] — verdict shape 4… **UNRULED**"* | `decision-queue.md:72-75` | [[D1152]] `:422` | ✅ ruled 2026-08-23; producer row landed at `design/06-campaign.md:444` |
| *"[[D887]] — the material/board balance law… **UNRULED as intent law**"* | `:76-80` | [[D1042]] `:375` | ✅ ruled 2026-08-23; law landed at `design/06-campaign.md:271` |
| *"[[D304]]… ⚠ owner-facing… the owner should confirm the clause"* | `:81-84` | [[D1040]] `:373` | ✅ closed; and [[D1150]] `:420` records that re-asking it **was itself the defect** |
| *"[[D327]] variants… the refusal itself still stands in code"* | `:108-110` | [[D1031]] `:492`, [[D1029]] `:370`, [[D1093]] `:472` | lane opened, RFC drafted; the code half is still true (§2.5) |
| *"[[D329]] famous-game packs… the NEEDS-OWNER question… never reached this file"* | `:111-113` | [[D1043]] `:385` → [[D1060]] `:388` | ✅ **FULL LIFT** ruled; RFC drafted |
| *"[[D330]]/[[D355]]/[[D357]]/[[D364]] time controls… sits in no queue"* | `:114-117` | [[D1041]] `:374` | ✅ ruled **both ways** — simulated pressure *and* real clocks |
| *"[[D334]]… an RFC currently in `implementing` is blocked on this owner fork"* | `:119-120` | [[D1040]] `:373` | ✅ ruled; `campaign-core` Discharge D3 discharged 2026-08-23 at `1300303` |
| O6 — *"PARTIAL OWNER CHOICE READY"* | `:43` | [[D995]] `:289`, [[D996]] `:290` | O6.1 **approved**, O6.2 ruled *"decide per release"* |

**4 of 4 present rows are wrong, and 8 of the queue's rows state a position the owner has since
overruled.** The file that exists to hold owner decisions is simultaneously the repo's densest
concentration of overruled positions asserted as live.

The same staleness reaches the **ledger's own rows**, which is worse because `work-index` reads them:

| Row | Line | Status cell at HEAD | Ruled by |
|---|---|---|---|
| [[D887]] | `:516` | `💡 open, found 2026-08-22` | [[D1042]] |
| [[D334]] | `:1137` | `💡 open, owner ruling 2026-08-16` — body reads *"deliberately not decided now"* | [[D1040]] |
| [[D329]] | `:1091` | `💡 open, owner idea 2026-08-16` | [[D1060]] |
| [[D330]] | `:1092` | `💡 open, owner idea 2026-08-16` | [[D1041]] |
| [[D355]] | — | `💡 open, answered 2026-08-16, owner ruling pending` | [[D1041]] |
| [[D357]] | `:1107` | `💡 open, found 2026-08-16, blocks on the D317–D326 owner question` | [[D1041]] (ordering only — see [[D1132]] `:466`) |
| [[D364]] | `:1114` | `💡 open, owner ruling requested 2026-08-16` | [[D1041]]; the two `design/06` §5 amendments remain owed as `recorded-clocks` D2 |
| [[D305]] | `:1123` | `💡` (no ruled marker) | [[D1151]]; `design/06-campaign.md:368` already says *"RULED… answering the long-open [[D305]]"* |
| [[D327]] | — | `💡 open, owner idea 2026-08-16` | [[D1031]]/[[D1093]] |
| [[D1001]] | `:301` | `📊 measured 2026-08-23 — put to the owner as a hold-split question` | [[D1005]] `:296`, whose own text says *"Evidence that earned the split ([[D1001]])"* — asked and answered the same day |

**Ten ledger rows still read as open questions the owner has already answered.** [[D1150]] `:420`
proves the cost is not hypothetical: claude re-asked [[D304]] *hours after* [[D1040]] ruled it,
because the row still looked open.

One document-tier instance of the same shape: `planning/variants/rfc-derivation.md:509` still carries
fork 1 as *"⚖ **Does the owner accept a Maia-dark Chess960?** … **Nothing else in this lane should be
drafted before this is ruled.**"* — [[D1153]] `:461` ruled it on 2026-08-23 (*don't accept the gap;
compose a bot that does not depend on Maia*), and [[D1160]] `:423` then answered the mechanism. The
lane's real residual is [[D1162]] `:425`'s fund/defer/refuse fork on [[D810]]'s selector, which is a
**different question**. The stale text asserts a drafting block the ruling lifted.

### 2.5 Class C — the ruling was made and its consequence was never applied

[[D1086]] `:408` is **still open and still true**, a day later:

| Site | Text at HEAD | Contradicted by |
|---|---|---|
| `apps/server/src/capabilities.ts:159` | `{ instrument: "Explorer", capability: "topGames / recentGames / masters database", disposition: "refused", reason: "Per-game scope and licence questions remain unresolved" }` | [[D1060]] — *"FULL LIFT… lifted `capabilities.ts:159` entirely"* |
| `apps/server/src/sourcing/explorer.ts:74` | `url.searchParams.set("topGames", "0");` | [[D1060]] — the pins *"were never an owner decision"* |
| `apps/server/src/capabilities.ts:133` | `{ instrument: "Stockfish", capability: "UCI_Chess960", disposition: "refused", reason: "The shipped drill format is standard chess only" }` | [[D1031]]/[[D1093]]; `rfc/variants.md` acceptance criterion 10 requires this row **amended, not deleted** |

The refusal reason at `:159` is the exact string [[D1043]] `:385` commissioned research to disprove —
*"a question written down 2026-08-16 and never answered, standing in for a decision ever since"*.
It is still standing in for one.

**Two mitigations, recorded so the finding is not overstated:**

- `rfc/famous-games.md:75-85` handles the lift **correctly**. It re-imposes `topGames=0` *"on their
  own merits"* as a **separate, revisitable product judgement** — which is what [[D1060]] explicitly
  authorised (*"that is now a separate decision on its own merits rather than a rider on a licence
  question"*) — and registers it as Discharge `D5` owned by `OWNER`. This is the model behaviour.
  Its one failure is the destination: `D5` points at `decision-queue.md`, **where it does not
  appear** (§3.6).
- [[D1231]] `:443` already fixed the deadline item the scope-cut audit named: `rfc/variants.md`
  acceptance criterion 12 no longer asserts *"no code path admits a `Rules` value other than
  `'chess'`"*, which would have **machine-enforced a refusal the owner had lifted**. Verified at
  `rfc/variants.md:311-315`. This is class C caught **before** it shipped, and it is the only one.

### 2.6 Class D — a consequence applied without a ruling (the D1165 shape)

**No new instance found.** [[D1165]]'s own case is corrected: `design/06-campaign.md:444` now reads
*"proposed 2026-08-22 as [[D886]]; **RULED 2026-08-23, [[D1152]]**"*, and `:451` attributes the §5
amendment to [[D1152]] *"written by claude on the ruling"*. `:271` and `:368` carry the same explicit
form for [[D1042]] and [[D1151]]. Every 2026-08-23 `design/06` amendment names an existing `⚖️` row.

The class is dormant, not extinct: **nothing enforces the citation.** [[D1165]]'s proposed guard —
*"an intent-tier ruling citation must name a `⚖️` row that exists"* — is unimplemented, and §3.5
check 5 specifies it.

### 2.7 Every instance, consolidated

**16 instances where a ruled position is still asserted somewhere as live**, of which 2 are rulings
with no row at all:

| # | Where the overruled position is asserted | Ruling it contradicts | Class |
|---|---|---|---|
| 1 | `design/BACKLOG.md:454` — [[D1193]] *"the cheapest real path"* | the owner's skills push-back (**no `⚖️` row exists**) | A |
| 2 | `design/BACKLOG.md:432` — [[D1190]] re-confirmation never sought | [[D1151]]'s ground | A |
| 3 | `decision-queue.md:72-75` — D886 *"UNRULED"* | [[D1152]] | B |
| 4 | `decision-queue.md:76-80` — D887 *"UNRULED as intent law"* | [[D1042]] | B |
| 5 | `decision-queue.md:81-84` — D304 *"the owner should confirm"* | [[D1040]], [[D1150]] | B |
| 6 | `decision-queue.md:111-113` — D329 *"never reached this file"* | [[D1043]]/[[D1060]] | B |
| 7 | `decision-queue.md:114-117` — time controls *"sits in no queue"* | [[D1041]] | B |
| 8 | `decision-queue.md:119-120` — D334 *"an RFC… is blocked on this owner fork"* | [[D1040]]; discharged `1300303` | B |
| 9 | `decision-queue.md:43` — O6 *"PARTIAL OWNER CHOICE READY"* | [[D995]], [[D996]] | B |
| 10 | `design/BACKLOG.md` — 10 rows still open (D887, D334, D329, D330, D355, D357, D364, D305, D327, D1001) | D1040/D1041/D1042/D1060/D1151/D1031/D1005 | B |
| 11 | `planning/variants/rfc-derivation.md:509` — *"nothing else in this lane should be drafted before this is ruled"* | [[D1153]] | B |
| 12 | `apps/server/src/capabilities.ts:159` | [[D1060]] | C |
| 13 | `apps/server/src/sourcing/explorer.ts:74` | [[D1060]] | C |
| 14 | `apps/server/src/capabilities.ts:133` | [[D1031]]/[[D1093]] | C |
| 15 | `planning/exploration/gates.md` — entire file (§2.8) | D949/D953/D1005/D1093 | B |
| 16 | `rfc/famous-games.md:270` Discharge D5 routed to a queue it is absent from | procedural | C |

### 2.8 The systematic finding — `planning/exploration/gates.md` has received nothing since D815

**The highest D-id anywhere in `planning/exploration/gates.md` is `D815`.** Zero occurrences of any
id in the `D816`–`D1234` range. The file was last written 2026-08-23 12:25, so this is not staleness
by neglect of the file — it is staleness of the **join**.

`CLAUDE.md` law 5 is explicit: *"Gate definitions are mirrored into `planning/exploration/gates.md`
so the gate surface is never split."* Four 2026-08-22/23 rulings are gate definitions and none is
mirrored:

- **[[D949]]** `:331` — *"the binding wave falls under the D560 hold WHOLE — hold everything until
  Gate F"*, resolving the [[D462]]×[[D560]] deadlock **in Gate F's favour**.
- **[[D953]]** `:330` — *"the campaign-RFC gate is **WAIVED** — draft v1 now"*. A gate that
  `planning/campaign-research-queue.md` defines, waived by the owner, unmirrored.
- **[[D1005]]** `:296` — *"the [[D949]] content hold is **SPLIT** — the binding arm is RELEASED, the
  graduation arm stays held"*.
- **[[D1093]]** `:472` — the **drafting mandate**, which the ledger itself calls *"the owner ruling
  RFC-0000's exploration gate requires"* and which three RFCs (`variants`, `recorded-clocks`,
  `famous-games`) cite as their exploration gate at line 7 of each.

**This is the single worst finding in the sweep**, because it is not one row: the gate surface *is*
split, exactly as law 5 forbids, and a reader consulting the canonical gate document today would
conclude the campaign-RFC gate is shut and the content hold is whole. Both are false, by owner
ruling, in the file whose one job is to say so.

Adjacent and smaller: `design/03-product-breadth.md` carries **no** 2026-08-23 ruling id either.
[[D1042]] is surface-scoped by its own text (*"the balance law is SURFACE-SCOPED, not
variant-scoped"*), which makes `design/03` a home it never reached; `design/06-campaign.md:271`
carries it alone. Flagged, not asserted — a `design/03` amendment is law-5 owner-tier and this
document may not write one.

---

## 3. Repair 2 — the derivation spec for `decision-queue.md`

### 3.1 The measured case for deriving it

| Measurement | Value | Source |
|---|---|---|
| Open rows naming an owner decision as blocker, missing from the queue | **26 of 32** | [[D1037]] `:489` |
| Owner-touching rows created 2026-08-23, missing from the queue | **40 of 44** at audit time; **47 of 51** at `e51b5a3` | [[D1232]] `:444`; re-measured here |
| Of the 4 present, how many are stale | **4 of 4** (§2.4) | re-measured here |
| Open `OWNER` Discharges rows across `rfc/`, present in the queue | **0 of 14** | §3.6 |
| Prose `OWNER` rows across `rfc/`, present in the queue | **1 of 153** | [[D1133]] `:416` |
| Total recorded scope cuts with an owner decision in no queue | **163** | [[D1133]] `:416`, via `deferral-inventory.md` |
| Explicit owner asks refused or with no execution path | **19 of 80**, 6 of them refused with **no owner ruling at all** | [[D1036]] `:488`, via `refused-vs-asked.md` |
| Rows filed as NEEDS-RESEARCH that are actually owner decisions | **10 of 19** | [[D491]] `:770` |

The failure is not neglect. It is that **a hand-written index of a 1,567-row append-only ledger
cannot stay joined to it**, and every miss is invisible because there is no instrument that reads
both. `make work-index` proves `ledger row → lane`; `make refusal-index` ([[D1038]] `:490`) will
prove `artifact refusal → owner ruling`; this closes the third edge, **`open question → owner`**.

`make decision-queue` belongs in the [[D1038]] family and should ship with it or immediately after.

### 3.2 The source of truth — four channels, and the marker problem

**Measured marker usage at HEAD**, and none of it is sufficient on its own:

| Marker | Occurrences in `design/BACKLOG.md` | Verdict |
|---|---|---|
| `⚖️` glyph in the id cell | 28 rows | **Overloaded** — 27 mean *ruling made*, 1 ([[D1212]]) means *question pending* |
| `⚠️` | 3 rows (D506 as a retraction glyph; D304, D305 as `⚠️ **owner-facing**` in body text) | Real but **near-unused** |
| `OWNER-TIER` in body text | 3 rows (D886, D887, D1076) | Real, unused since 2026-08-22 |
| `owner's to rule` | 2 rows (D886, D1165) | Real, effectively dead |
| Status cell contains `owner` | 56 open rows | **Ambiguous** — `💡 owner ruling 2026-08-22` means *recorded from a ruling*; `💡 open, owner ruling 2026-08-16` means *awaiting one*. Not machine-separable |
| `| OWNER |` in an RFC `## Discharges` owner column | 18 rows (14 open) | **Reliable**, but see the escape below |
| `**⚖️ Owner —` heading an RFC Open question | e.g. `rfc/live-sources.md:376` | Reliable where used |
| `⚖` in a derivation `## Gaps` table Kind column | e.g. `planning/variants/rfc-derivation.md:509`, `planning/review/rfc-derivation.md:537-543`, `planning/skills/full-depth-derivation.md:630-680` | Reliable where used |

**Conclusion: no existing marker can be the sole key.** The derivation must therefore do two things
at once — read the four channels *as they are today*, and mandate a normalized marker going forward
so the reader stops being a heuristic.

**The mandated marker (proposed, owner-vetoable):** a ledger row awaiting an owner ruling carries
**`⚠️ OWNER` as the first token of its status cell**, e.g.
`⚠️ OWNER — blocks: rfc/skills.md drafting`. Chosen over reusing `⚖️` because `⚖️` already means
*ruled* in 27 of 28 live cases and re-defining it would silently reclassify them; chosen over
`OWNER-TIER` in body text because a status cell is one field and a body is prose. `⚠️` already
carries this meaning at `design/BACKLOG.md:1122-1123`, so this promotes an existing convention
rather than inventing one.

**Channel 1 — the ledger (`design/BACKLOG.md`).** A row is queue-eligible iff:
- its status cell is **open** (contains neither `✅` nor `⛔`, matching `work-index.mjs:9`'s `CLOSED` set), **and**
- it matches either the mandated marker, or — during the transition — the legacy set:
  status-cell `/⚠️\s*OWNER/`, `/owner (ruling|decision|call|question|fork|confirmation)\s+(pending|requested|owed|required|open)/i`,
  `/open,.*owner (idea|ruling|extension|question)/i`, `/owner-facing/i`, `/owner-tier/i`,
  `/goes to the owner/i`, `/awaiting owner/i`; or body-text `/⚠️\s*\*\*owner-facing/i`,
  `/OWNER-TIER/`, `/owner's to (rule|accept|veto)/i`, `/put to the owner/i`, `/an owner (fork|decision|ruling)/i`.
- **and** no `⚖️` row in the ledger names it as ruled (§3.5 check 1).

**Channel 2 — RFC `## Discharges` rows.** Owner column `OWNER`, discharged column empty. The
column layout is byte-identical across all 29 table-form occurrences:
`| id | the obligation | owner | recorded when discharged | discharged |`. **The regex must not
anchor on an exact `| OWNER |` cell**: `rfc/pack-population-provenance.md:703` writes
`` **`OWNER`** — commissioning a content wave is an owner act ``. Match `/\bOWNER\b/` within the
third cell, unanchored.

**Channel 3 — RFC `## Open questions`.** Items whose text opens with `⚖️ Owner` / `**⚖️ Owner —`
or whose body contains `owner call`, `an owner ruling`, `owner's to rule`.

**Channel 4 — derivation `## Gaps` tables in `planning/*/rfc-derivation.md` and
`*-derivation.md`.** Rows whose Kind cell is `⚖` or whose owner column is `owner`. This channel is
where the largest **unqueued** population lives (§4): the review lane alone carries seven.

### 3.3 What each derived entry must carry

Six required fields. An entry missing any of them is a build failure (§3.5 check 4) — the point is
that the owner can rule **from the queue alone**, without opening five files.

| Field | Source | Rule |
|---|---|---|
| `id` | the row/discharge/gap id | `D<n>`, `O<n>`, or `<rfc-slug>#<discharge-id>` / `<rfc-slug>#OQ<n>` |
| `question` | first bolded sentence of the row, or the Gap cell | **In the owner's terms** — no projection ids, no file paths, no glyphs. Max 200 chars. Where the source has an owner-verbatim quote, prefer it |
| `options` | the row's enumerated alternatives | ≥2, each with its **consequence** stated. A single-option entry is a recommendation, not a decision, and must be rejected by check 4 |
| `blocks` | derived, **not** authored | The join: every RFC in `rfc/README.md`'s active set, every `planning/**/rfc-derivation.md`, and every Discharges row whose durable text mentions the id. Empty `blocks` is legal and ranks last |
| `evidence` | `file:line` list | Where the measurement lives. At least one. `work-index.mjs`'s `durableRouteText` exclusions apply so a changelog mention does not count |
| `recommendation` | optional, explicitly labelled | Must be marked `RECOMMENDATION` and must **not** be the only option. [[D1230]] `:442` measured 71 of 209 scope decisions half-assed by a template that asked for a cut; [[D1041]] `:374` and [[D97]] both record the owner refusing a pre-pruned fork. A queue that offers one branch reproduces that defect |

Ranking is by `blocks`, three keys in order: (1) count of **drafting-blocked** RFCs and derivations,
(2) count of **implementing** RFCs blocked, (3) id ascending for stability.

### 3.4 Output

`make decision-queue` writes `planning/platform-alignment/decision-queue.md` **in full**, between
sentinel comments, exactly as a generated file:

```
<!-- BEGIN GENERATED — make decision-queue; edits below this line are overwritten -->
```

The prose above the sentinel — authority, the O0–O14 table, decision order — stays hand-written,
because O-rows are a *different object*: they are named programme decisions with intent homes, and
the derivation **adopts them as channel 0** rather than replacing them. Their `State` column becomes
derived: an O-row whose ledger evidence includes a `⚖️` ruling flips to `RULED` automatically, which
is precisely what did not happen for O6 (§2.4).

`--json` emits the same structure for `make verify` and for any successor instrument, matching
`work-index.mjs:129-137`'s convention.

### 3.5 The checks that fail the build

Six. Checks 1–4 are the failure modes this document measured; 5–6 close [[D1165]] and [[D1086]].

1. **A ruled question must leave the queue automatically.** For every derived entry, if any `⚖️` row
   whose status cell matches `/ruled|approved|commissioned/i` textually names the entry's id, the
   entry is **excluded and the source row is reported as needing its status cell flipped**. Exit
   non-zero with `RULED-BUT-OPEN: D887 ruled by D1042` — which is exactly the nine rows in §2.4 and
   would have printed on day one for all of them.
2. **An unruled question must not be able to hide.** Every open ledger row matching *any* legacy
   owner pattern must resolve to a derived entry. A row that matches a pattern but cannot be given
   the six fields fails with `UNDERSPECIFIED-OWNER-ROW: D<n>` rather than being dropped. **Silent
   exclusion is the defect** — 47 of 51 rows were silently excluded by a human doing exactly this.
3. **Every open `OWNER` Discharges row must appear.** Cross-check the derived set against channel 2;
   fail with `DISCHARGE-NOT-QUEUED: rfc/theming.md#D1`. Prints 14 on day one (§3.6).
4. **Every entry carries all six fields, with ≥2 options.** Fail with
   `INCOMPLETE-ENTRY: D1212 (options: 1)`.
5. **An intent-tier ruling citation must resolve to a `⚖️` row** ([[D1165]]'s proposed guard).
   Scan `design/0*.md` for `/[Oo]wner ruling[^.]*\[\[D(\d+)\]\]/` and `/RULED [\d-]+ \(\[\[D(\d+)\]\]/`;
   every captured id must be a `⚖️` row in the ledger. Fail with
   `PHANTOM-RULING: design/06-campaign.md:444 cites D886 which is not a ⚖️ row`. This is the check
   that would have caught D1165 on the day it was written, and it costs one grep.
6. **A ruling naming a code site must name its implementing commit** ([[D1086]]'s stated lesson:
   *"Every owner ruling that lifts a code-level refusal needs an implementing commit named at ruling
   time, not assumed"*). Where a `⚖️` row's text contains a `path.ts:NN` reference, its status cell
   must contain either a 7-hex SHA or the literal `IMPLEMENTATION OWED`. Fail with
   `UNAPPLIED-RULING: D1060 names capabilities.ts:159, no implementing commit`. Prints on
   [[D1060]] today.

Checks 1, 3 and 5 belong in `make verify`. Checks 2, 4 and 6 should start as **warnings** — check 2
will print a long tail on first run, and turning it fatal before the tail is triaged would block
every commit.

### 3.6 The Discharges half — 14 open `OWNER` rows, 0 in the queue

Verified across `rfc/` and `rfc/archive/` (no archive RFC carries an `OWNER` row). **The deferral
inventory's figure of 11 is wrong by three**: 18 `OWNER` rows exist, 4 are discharged
(`campaign-core#D3` 2026-08-23 `1300303`; `learner-rating#D1` 2026-08-22; `pack-capability-contract#D1`
2026-08-23 `cc98fcb`; `theming#D3` 2026-08-23).

| RFC | id | Line | The obligation |
|---|---|---|---|
| `rfc/bot-policy.md` | D4 | 794 | The human-scale anchor ruling — anchor accounts vs learner-derived Glicko vs stay band-relative |
| `rfc/bot-policy.md` | D5 | 795 | Owner-use roster validation via the retained 42-branch blind packet (O8.5) |
| `rfc/famous-games.md` | D3 | 268 | Broadcast share-alike: what CC BY-SA 4.0 requires of a pack embedding a broadcast game |
| `rfc/famous-games.md` | D5 | 270 | Whether a per-game corpus surface is ever wanted (§1 re-imposes `topGames=0`, revisitably) |
| `rfc/feedback-delivery.md` | D1 | 2535 | The binding wave: 63 mandatory pack edits, 60 `corpus_observed` claims, 36 `tablebase_exact` claims |
| `rfc/intent-presets.md` | D1 | 442 | Owner-use validation of every `candidate` entry — names, labels, promises, defaults |
| `rfc/live-sources.md` | D2 | 370 | Casting composition ([[D705]]) — blocked on the B5 justification ruling; **this is [[D1212]]** |
| `rfc/live-sources.md` | D3 | 371 | The [[D412]] events-row clause in `design/03` — law 5 |
| `rfc/pack-population-provenance.md` | D1 | 703 | Populate `provenance.corpusEvidence` across all 92 packs — authored judgement per pack |
| `rfc/recorded-clocks.md` | D2 | 357 | [[D364]]'s two owner-tier `design/06` §5 amendments plus the run-pooled refusal in writing |
| `rfc/recorded-clocks.md` | D3 | 358 | Does a drill's pressure ever *fail* the learner, or stay informational? |
| `rfc/review-evidence-compiler.md` | D3 | 470 | Learner usefulness of the selected Review moments; external panels descoped by D649 |
| `rfc/theming.md` | D1 | 602 | Owner picks the shipped roster — second piece set, extra board theme, `--warning` variant, olive-square repair |
| `rfc/theming.md` | D5 | 606 | Felt-quality verification — [[D840]]'s flip rides the owner's own session |

`rfc/theming.md` is **status-blocked on D1** (`rfc/theming.md:3`, *"awaiting D1"*), and
`rfc/famous-games.md:270` names `decision-queue.md` as D5's destination — a destination that has
never contained it. That is [[D1201]] `:436`'s archiving defect one tier earlier: **a register
pointing at a file that does not carry the row.**

### 3.7 What the derivation deliberately does not do

- **It does not rule.** It does not infer an answer from a recommendation, and it does not close an
  entry because a lane proceeded without one.
- **It does not write `design/`.** Law 5. Where a ruling implies an intent amendment, the entry says
  so in `blocks` and stops.
- **It does not merge O-rows into D-rows.** Different objects, different lifecycles (§3.4).
- **It does not delete history.** A ruled entry leaves the generated block; the `⚖️` row is its
  record.

---

## 4. The queue's true contents at `e51b5a3`

Ranked by what is blocked. This table is the derived output's expected first run; where an entry
carries a recommendation it is labelled, and every entry offers ≥2 branches.

### Tier 1 — blocking drafting or implementation **right now**

| # | id | The question, in the owner's terms | Options | Blocked while unruled | Evidence |
|---|---|---|---|---|---|
| 1 | **[[D1212]]** | Is casting-over-a-followed-run new B5 investment (gated by the streamer-audience revival condition), ordinary Phase B wiring (ungated), or should casting **lead**? The answer also picks the follower architecture — held-stream vs polling | (a) new B5 investment → gated, Phase B proceeds without it; (b) Phase B wiring → ungated, **RECOMMENDATION**, with a grep-guarded fence; (c) casting leads → reopens the B5 audience gate and selects the held stream | `rfc/live-sources.md` Phase B drafting; Discharge `live-sources#D2`; [[D957]] `:326`, [[D958]] `:327` | `design/BACKLOG.md:441`; `rfc/live-sources.md:376-380`; d947 harness 0.24 s vs 4.6 s |
| 2 | **Skills fork 1 — may valence be declared at all?** | `valenceAuthority: []` is an **unfilled slot** with a compiler-enforced filling procedure, not a refusal. May a skills credit declare a valence sourced from the five enumerated authorities? | (a) yes, from the five enumerated authorities only; (b) yes, and admit a sixth (fork 2, outcome correlation); (c) no — the slot stays empty and the skills lane dies | `rfc/skills.md` drafting ([[D1222]] `:449`); the whole [[D549]] `:145` ask | `planning/skills/full-depth-derivation.md:630`, `:122-170`; [[D1220]] `:447`, [[D1221]] `:448` |
| 3 | **O7.1–O7.5** (five sub-rulings) | What is a Review Map moment and how may it label a move? Map size; which families may nominate; engine role and move labels; action doors; share contract | Each has a written recommendation plus named alternatives at `o7-handoff.md` | **`rfc/review.md` drafting is self-blocked**: `o7-handoff.md:4` reads *"Does not authorize: F6 drafting until the choices below are ruled"* | `planning/review/rfc-derivation.md:537-541`; `decision-queue.md:44` |
| 4 | **[[D1193]] must be struck** | The owner rejected *"do not draft a skills RFC"*. The rejection has **no `⚖️` row** and D1193 still reads as live guidance | (a) strike D1193 and record the ruling as a `⚖️` row; (b) supersede it by [[D1222]] with an explicit withdrawal note in D1193's own status cell | Every reader of the skills lane; `make work-index` reports it green | `design/BACKLOG.md:454` vs `:449`; `scope-cut-audit.md:350`, `:769`; [[D1232]] `:444` |
| 5 | **[[D1162]]** — the non-Maia bot fork | [[D810]]'s evidence-to-move selector is the only variant-portable route to a human-shaped base, and it is unbuilt. **Fund, defer, or refuse.** | (a) fund it now — unblocks Chess960 human opposition; (b) defer — 960 ships `strong_engine`-only and says so; (c) refuse — [[D1153]]'s ruling cannot be satisfied | `rfc/variants.md` acceptance; the Chess960 opponent story | `design/BACKLOG.md:425`; [[D1153]] `:461`; [[D1160]] `:423`; [[D1034]] `:487` |
| 6 | **Review fork 6 — [[D880]]** | Does the review RFC **claim** post-game accuracy % and the eval graph, or **refuse** them? D880 is ledgered *admitted, availability-gated honest-empty* and has **no RFC and no owner** | (a) claim it in the review RFC; (b) refuse by name with the 0/29 native-coverage abstention stated inside the RFC | `rfc/review.md` scope | `planning/review/rfc-derivation.md:542`; `design/BACKLOG.md:529` |
| 7 | **Review fork 7** | Is a review a `design/03` surface? The intent tier's "Review" is branch-compare (`:57-67`, `:290`) | (a) amend `design/03` to name it; (b) it is not a surface — the review RFC lands under an existing one | intent-tier parity; law 5 forbids claude writing it | `planning/review/rfc-derivation.md:543` |
| 8 | **`theming#D1`** | Pick the shipped roster: second piece set, any additional board theme, the `--warning` repair variant, the olive-square repair | Licensed candidate lists are already assembled | **`rfc/theming.md` status is literally `awaiting D1`** (`:3`) | `rfc/theming.md:602`; [[D976]] `:53`, [[D982]] `:282` |

### Tier 2 — blocking a lane's next step

| # | id | The question | Blocked while unruled | Evidence |
|---|---|---|---|---|
| 9 | **[[D1051]]** | [[D357]]'s stated precondition (*hint-ladder ruling before the clock ruling*) was unmet when [[D1041]] was taken. Take the D317–D326 hint-ladder fork first, or record why the dependency is severable? | `recorded-clocks` sequencing | `design/BACKLOG.md:382`; [[D1132]] `:466` |
| 10 | **`recorded-clocks#D2`** | [[D364]]'s two `design/06` §5 amendments — the pursuit-clock sentence and the legibility/power dichotomy — plus the run-pooled refusal **in writing** | `recorded-clocks` archival; `design/06` §5 correctness | `rfc/recorded-clocks.md:357`; `design/BACKLOG.md:1114` |
| 11 | **`recorded-clocks#D3`** | Does a drill's time pressure ever **fail** the learner (enforced), or stay informational? If enforced, [[D357]]'s cheating gradient reopens | the clock lane's core semantics | `rfc/recorded-clocks.md:358` |
| 12 | **`bot-policy#D4`** | The human-scale anchor: anchor accounts, learner-derived Glicko, or stay band-relative? Until ruled, **no absolute human Elo is stated anywhere** | bot roster labelling; [[D970]] | `rfc/bot-policy.md:794` |
| 13 | **[[D1190]]** | Re-confirm [[D1151]] on a **true** ground: the *"first number about themselves"* premise was already false — `RatingScreen.svelte` ships one | the catalogue's justification, not its conclusion | `design/BACKLOG.md:432` |
| 14 | **`famous-games#D5`** | Is a per-game corpus surface ever wanted? §1 re-imposes `topGames=0` on product grounds, revisitably, per [[D1060]]'s own authorisation | the per-game half of the famous-games lane | `rfc/famous-games.md:270`, `:75-85`; [[D1060]] `:388` |
| 15 | **`famous-games#D3`** | What does CC BY-SA 4.0 share-alike require of a pack embedding a broadcast game? | broadcast-sourced pack authoring | `rfc/famous-games.md:268` |
| 16 | **`live-sources#D3`** | The [[D412]] events-row clause in `design/03` — rule at acceptance, or sever to its own ruling? | `live-sources` acceptance | `rfc/live-sources.md:371` |
| 17 | **[[D1076]]** | Three `design/05` naming requests routed under law 5 and never actioned, plus the unhomed rating-driven fade | `assistance-controls` follow-through | `design/BACKLOG.md:483` |
| 18 | **Variants scope** | First variant RFC: Chess960 alone, or a `rules` axis admitting chessops' seven at once? | `rfc/variants.md` §2.2 scope | `planning/variants/rfc-derivation.md:510` |
| 19 | **Variants: do 960 packs exist in v1?** | Or is 960 Just-Play-and-import only? The pack lint says *"legal standard chess"* and all 47 packs are standard | `rfc/variants.md` pack lane | `planning/variants/rfc-derivation.md:516` |
| 20 | **Variants: is a 960 result rated?** | Glicko-2's arithmetic works but the opponent must be measured; with Maia dark there is no calibrated human opponent. Likely **unrated, and say so** | `learner-rating` × variants seam | `planning/variants/rfc-derivation.md:517` |
| 21 | **[[D973]] + [[D1011]]** | `longitudinal-store` is registered **accepted** while its own clauses say the questions resolve *before* acceptance: the v1 ingest set, whether an unmeasured bulk-import cost is accepted, and who owns every future `derived_rev` bump | **an accepted RFC's implementation and its dependent migrations**; the skills lane's store half | `design/BACKLOG.md:50`, `:303`. **The two rows are duplicates filed a day apart** (`planning/skills/full-depth-derivation.md:685`) and one should close as such so the store has one blocker |
| 22 | **[[D970]]** | Ratify the Human-baseline roster as the pre-registered bands `[1000,1400,1800,2200]`? `bot-policy` was **accepted while its concrete roster was still open** | production band declarations; `bot-policy` Stage A | `design/BACKLOG.md:47`; `design/research/maia-production-band-roster.md` |
| 23 | **[[D1049]]** | Clock arm (a) splits: **depicted** (`[%clk]` from the stored raw PGN — grounded, retroactive) vs **predicted** (*"this move would take you 40 seconds"* — no human deliberation-time corpus exists anywhere). Only one is buildable | `recorded-clocks` arm (a) scope | `design/BACKLOG.md:380` |
| 24 | **[[D837]]** | The §2a *"second axis"* reading is claude-derived and **the owner's to veto**; the ruling named a *"fifth label or second axis"* fork and did not choose | the veto window is open and unattended | `design/BACKLOG.md:560` |
| 25 | **[[D369]]** | Should an endgame pack declare a `targetElo` band **at all**? Twelve packs declare one that does nothing measurable below ten pieces (transfer ratio ~0.07) | pack-format honesty; the band's meaning in endgame packs | `design/BACKLOG.md:887`; `design/research/maia-band-outcome-transfer.md` |
| 26 | **[[D1034]]** Tier-1 half | Chess960 kills 3 of 5 opponent modes; Tier-2 variants make Stockfish's centipawn output **wrong, not missing**. Ship degraded with declared dark rungs, or refuse the tier? | `rfc/variants.md` tier admission | `design/BACKLOG.md:487`; [[D1030]]'s class — *never put to the owner* |

### Tier 3 — programme decisions and validation-by-use (nothing blocks today)

| # | id | The question | Note |
|---|---|---|---|
| 27 | **O5** | 1.0 theory source and knowledge-builder posture | READY FOR OWNER; R4/R8/R18 complete |
| 28 | **O9** | Which player metrics/archetypes/tips ship? | READY FOR OWNER. **Covers habit cards, a ledger and three modules — says nothing about credits, milestones or tiers**, so full O9 approval still leaves half of [[D549]] unlicensed ([[D1193]] `:454` is right about this much) |
| 29 | **O11** | What coach and streamer workflows belong in 1.0? | READY FOR OWNER; external participants descoped by [[D649]] |
| 30 | **O12** | Native human play, adapter-first, or explicit external handoff? | READY FOR OWNER |
| 31 | **O6.3** | Final pilot membership | [[D995]]/[[D996]] ruled O6.1/O6.2; [[D1006]] `:297` ruled *retire nothing*. Membership waits on F5/F7/use |
| 32 | **[[D868]]** | Content strategy: is the author marketplace a 1.0 object at all? | `📊 measured 2026-08-22`; gates any monetization design; nothing blocks | 
| 33 | **[[D810]]/[[D811]]/[[D812]]** | The bot-personality ideation set | owner ideas 2026-08-21, unrouted beyond [[D1162]] |
| 34 | **`intent-presets#D1`**, **`bot-policy#D5`**, **`review-evidence-compiler#D3`**, **`theming#D5`** | Four **validation-by-use** obligations | Not desk decisions. They discharge in the owner's own play session, which per standing memory is the last step, not a pending action |
| 35 | **`feedback-delivery#D1`** | The binding wave: 63 mandatory pack edits, 60 `corpus_observed` claims, 36 `tablebase_exact` claims | Commissioning is an owner act; [[D1005]] `:296` **released the binding arm** 2026-08-23 — this may already be discharged and the derivation's check 1 should say so |
| 36 | **`pack-population-provenance#D1`** | Populate `provenance.corpusEvidence` across 92 packs — `ledger`, `abstained` or `unsourced` per pack | Authored judgement; a content wave, owner-commissioned |

**36 genuinely outstanding owner decisions.** 8 block drafting or implementation today, 18 block a
lane's next step, 10 are programme-level or discharge by use.

---

## 5. Ledger rows this document proposes

Proposed, not written — id assigned at landing per [[D1130]]; head was D1234 at drafting.

1. 🐞 **Nine ledger rows still read `💡 open` for questions the owner ruled on 2026-08-23**
   (D887, D334, D329, D330, D355, D357, D364, D305, D327), and `decision-queue.md` states the
   overruled position for eight. [[D1150]]'s re-asked question is the measured cost. §2.4.
2. 🐞 **`planning/exploration/gates.md` has received no id above D815**, so [[D949]], [[D953]],
   [[D1005]] and [[D1093]] — four gate rulings — are unmirrored, and the gate surface is split in
   exactly the way law 5 forbids. §2.8. **The worst finding in this sweep.**
3. 🐞 **The owner's skills ruling still has no `⚖️` row**; [[D1193]] and [[D1222]] assert opposite
   things, both `💡 open`. [[D1232]] recorded the defect without recording the ruling. §2.3.
4. 💡 **`make decision-queue`** — derive the queue from four channels, six required fields, six
   checks. Pairs with `make refusal-index` ([[D1038]]) and `make work-index`. §3.
5. 📊 **14 open `OWNER` Discharges rows, 0 in the queue** — the deferral inventory's 11 is wrong by
   three; 18 exist and 4 are discharged. §3.6.
6. 🐞 **[[D1086]] is still open**: `capabilities.ts:159`, `explorer.ts:74` and `capabilities.ts:133`
   all still assert refusals the owner lifted. Check 6 (§3.5) is the guard. §2.5.

---

## 6. What this document did not do, deliberately

- **No file was edited.** The nine stale ledger rows, the eight stale queue entries and the three
  code refusals are **reported, not fixed** — flipping a ledger row on a verbal ruling is exactly
  the act [[D1165]] shows going wrong when the ruling is not first recorded as a `⚖️` row.
- **`planning/exploration/gates.md` was not amended.** Gate definitions are law-5 owner-tier; §2.8
  is a finding for the owner, not an edit.
- **The marker in §3.2 is a proposal.** It changes how every future row is written and is the
  owner's to approve or veto.
- **The queue in §4 is this document's reading**, not a generated artefact. Its value is as the
  derivation's first-run fixture: if `make decision-queue` lands and produces a materially different
  set, the difference is the spec's bug and should be triaged before the tool is trusted.
