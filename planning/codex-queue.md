# Codex queue — rewritten in full 2026-08-16

**Rewritten wholesale, not patched, because two of my last three edits to this file silently
did nothing.** They were scripted string replacements anchored on section headings you had
already rewritten at `a702372`; the anchors stopped matching, the replacements no-opped, and I
committed them with messages describing content that was never in the file. **So you never saw
[[D468]], [[D469]], or the two RFCs accepted since.** That is why the queue looked thin and you
went looking for work elsewhere. Ledgered as [[D478]].

**You were right to stop on `teacher-surface`, and you named both places while I fixed one.**
The Status line *and* Open question 1 both said an owner was waiting. Both now say otherwise
(`224e258` and this wave). Fifth instance of the queue-vs-body failure, ledgered as [[D477]]
with the point that five instances is a **missing instrument**, not a habit: the rule lives in
this file as a lesson and nothing reads it.

---

## THE BATCH DOCUMENT IS LIVE — `planning/defect-triage.md`

All **289** open rows routed. **Work batches, not rows**: one pass, one test run, one commit
naming the rows it closes ([[D416]]). Take them in the order below; the file has the full
membership, the files each batch touches, and the members flagged as riskier than they look.

**A0 completed 2026-08-16 by re-reading the rows and their current symbols.** The triage's
headline was conservative and its partial list contained an internal count error: **45** routed
rows were fully closed, not 40, and **15** retained a real residue, not 19. D203, D204, D209 and
D210 were fully shipped; D400 was answered/superseded. D204's four emitters are typed — the
remaining legacy schema arm is a different residue — while D240 genuinely lacks the shared
template registry its own remedy requires. Four process rows also closed in the same pass:
D418, D419, D459 and the already-shipped D474. The table header now calls column 3
**Disposition / history (not status)**. **A1 is blocked on status reconciliation:**
`rfc/README.md` calls `graduation-clearance` accepted, while the RFC's governing Status line says
**draft** and explicitly says the second author round *"does not re-declare"* acceptance. Do not
implement it or patch D467 outside it until the body itself is accepted.

Then: **A1** (4 rows — item 0 below, the boot failure and the ungated release) → **A2** (6 —
opponent selection serves the wrong move) → **A3** (5 — disclosure holes on live surfaces) →
**B1** (7 — claim binding and the evidence maps, one file, one live in the corpus) → **B3**
(4 — corpus denominators and fixture contamination; widest downstream effect for the least
work) → **B4** (8 — the gate on the gate; zero runtime risk, cheapest here) → **B8** (6 — the
graduation-emitter residue) → **B5** (8) → **B2** (6, three of which are record-only and
flagged).

**B6 and B7 are listed as traps**, not batches: B6 is mostly owner-tier `DESIGN-GAP:` rows with
one takeable member, B7 is convention with one.

**Two findings in that document outrank most of the batches.** `db243f5` edited nineteen defect
rows and **changed column 3 only** — writing *"✅ closed by pack-graduation 0.27"* into the
disposition while leaving column 1 at 🐞/💡. So [[D418]] is exactly right, and **the wave that
fixed the defects performed [[D419]]'s defect while doing it.** The disposition is not
trustworthy either: of the nineteen, 13 shipped, 4 are partial, and **2 (D207, D239) never
started** — which is why they are in a batch rather than in the closable set. Separately, a
**24% stale rate among rows nobody suspected**: 6 full closures out of ~25 sampled on a hunch.

**The content split you can act on is §7.** **27 mechanical rows reduce to five jobs**, three of
which are a shipped `make` target pointed at the corpus: the explorer position-census wave (60
`corpus_observed` claims against **0** backing records — 22 directly attachable, 38 needing a
sidecar first), the tablebase legal-successor census (**0 of 277** choice-bearing positions
censused), the engine pass (8 claims), the fixture relocation, and citation/digest repair.
**Nothing was over-called into it**: where the record is mechanical but the sentence it backs
must be authored, the row was split and the sentence sent to the authored side. Note
`packDigest` re-stamps are done for drafts but **26 of 36 candidate ledgers are digest-stale**,
which no row records — and it must **not** be bulk-fixed, because the `blocking → resolved`
writer does not exist yet.

## 0-OWNER. Two rulings landed 2026-08-16 — these outrank the batches

**[[D502]] — the corpus reaches learners through BOTH channels.** Ship all 56 packs behind a
clear **unreviewed draft** badge, and promote onto an official shelf as clearance lands. The
registry **already carries** `channel: "official" | "community"` and the UI already renders the
badge, so this is wiring, not new surface. **Explicitly NOT by flipping `NODE_ENV`** — [[D481]]
found `PackRegistry.loadDefault` reads `content/drafts/` only when `options.development === true`
and `compose.yaml` never sets it, which is the bug, not the mechanism to use.

**[[D502]] — remove the schema example fixture from the served library.** It is a format
fixture, not content; its own commentary reads *"Schema-only annotation; requires human
review."* It validates the schema in tests and never reaches a user. `content/packs/` currently
holds only `.gitkeep`.

**[[D493]] — one token, and it is a same-day regression, not a ruling.**
`SILENT_ASSISTANCE.boardLighting` was flipped `"legal"` → `"off"` at `f304384` (11:44 today) in a
7-file batch, on the rationale that the constant is *"now silent in all nine fields"* — a claim
about tidiness, not about a learner. **`docs/adaptive-guidance.md:61` still calls `"legal"` the
single named exception to literal off, and all three migration branches in
`assistance-preference.ts` still write it.** Restoring it brings back move dots **and** the
last-move highlight, because `DrillScreen.svelte:882-883` gates `highlightMoves` — run history,
not evidence — on the same `!== "off"`. **Silence over evidence stays; the rules floor was never
on the assistance ladder.**

**Highest impact-per-line in the whole UX audit, take with the above:** `.board-frame`'s
`calc(100dvh - 34rem)` → the container-query sizing **already present in the same file's mobile
branch** (`DrillScreen.svelte:1479-1480`). **~2 lines; the board roughly doubles.** And a
code→sentence map at `SessionController.#fail` — **10 call sites, one choke point** — which
turns out to fix *both* `Run is terminal at node: run-<uuid>:node:4` **and** the fork button that
409s silently ([[D495]]). They are the same event.

Full lane: `planning/ux-work-lane.md`. Entry point for everything: `planning/WORK.md`.

## 0. [[D468]] — a live boot failure. Take this before anything else.

**Not hypothetical and not scheduled work.** `GRADUATION_RULING_UNCITED` resolves living-tier
paths against `process.cwd()` (`pack-validation.ts:848-851`). All **43** acceptances cite
`planning/exploration/log.md#L1231` (40) or `docs/tablebase-grounding.md` (3). `apps/server/Dockerfile`
copies **only** dist, web dist, schemas and content; `.dockerignore` excludes `.git`. The issue
is **error** severity and `PackRegistry.load` throws `PACK_INVALID` (`pack-registry.ts:252/258`).

**So the first graduated pack carrying an acceptance makes the server fail to boot, and 40 of 56
drafts carry one.** Reproduced with one `cd`: `node apps/server/dist/pack-check.js` on
`anti-caro-advance-early-c5.json` prints *"Pack check passed"* from the repo root and
`ERROR [GRADUATION_RULING_UNCITED]` from a temp directory.

**The framing generalises:** a check whose evidence is excluded by `.dockerignore` is **not a
weaker check in production — it is a different check under an identical code name.**
`graduation-clearance` §3.2c specifies the split: a runtime *shape* rule with a zero-filesystem
budget, and an authoring *admission* rule that may read `.git`. **The `repoRoot` option was
explicitly refused** — one code name with two silent behaviours is the defect, not the fix.

Take **[[D469]]** with it: `release.yml` runs **nothing** between checkout (`:17`) and
build/push (`:24-33`), which is why this could reach production undetected. [[D208]]'s shape,
one workflow over.

## 0b. `rfc/graduation-clearance.md` — ACCEPTED 2026-08-16, second round

**You returned this once and you were right to.** The first acceptance was granted on the wrong
test — its four author-call open questions were closed, and **none of the four blockers you
returned was an open question** ([[D473]], recorded as claude's error). The test now applied is
**buildability**: every obligation resolving to a named symbol, command or home. If it still
fails anywhere, return it again — the loop is the check.

- **D464** — `clearance.recordKind`, required iff `kind` is `ledger_record`, enum **transcribed
  from the shipped `EVIDENCE_KINDS`** (`sourcing/types.ts:57`), with criterion 13 asserting
  set-equality so a new evidence kind cannot silently become unexpressible.
- **D465** — all 30 resolved entries walked: **29 resolve, 1 does not**. Eighth kind
  `referent_removed` + `absentIds`, admissible on `resolved` only, refused on `blocking`.
  **Stage B is 29 mechanical + 1 by hand**, not a 30-entry migration.
- **D466** — the writer is `make graduation-clear` → `clearGraduationEntries`, modelled on the
  shipped `verifyDraft` (`verify-draft.ts:323`). **Mandatory `packDigest` re-stamp** —
  `digestDrillPack` canonicalizes the whole document and `EVIDENCE_DIGEST_STALE` is only a
  warning, so skipping it drifts silently. **One-line change at `graduation-report.ts:8`** or
  the new sidecar suffix is counted as a pack.
- **D467** — two rules, two homes, two input budgets, stated as a table. See item 0.

**Correction to carry:** §1.2 named the **wrong join** for two review rounds ([[D471]]).
`uniqueRecord` joins on **FEN** (a claim assertion names a position); `evidenceSupports` joins on
a **JSON pointer** (evidence names a pack node). Corroborated across all 32 ledgers: **764
records, 764 supports pointers, 1:1, zero prose pointers**. The predicate is now written as an
expression rather than prose, which is the actual remedy.

**Criterion 16 touches `.github/workflows/release.yml`** — outside `rfc/`, flagged so it is
scoped in rather than discovered late.

## 0c. `rfc/feedback-delivery.md` — ACCEPTED 2026-08-16, **two-stage landing**

**Do not archive this on stage 1.** Stage 1 ships the delivery surface; stage 2 runs the binding
wave; the RFC stays `implementing` between them and moves to `implemented` only when stage 2's
measurement exists. **Criterion 11's ledger flips ride in STAGE 2's commit** — no row closes on a
day-zero share. Claims **nothing versioned and no migration position**.

Seven things you would otherwise hit cold:

- **`MACHINE_LABELS` is module-private** and `earnedEvidenceTypes` needs it. **Export it; do not
  copy it** — a fourth copy replicates [[D430]]'s dead `explorer_frequency` alternative again.
- **`claimBackings.authorSpans` is two different shapes**: cut segments on the binding arm,
  `[claim.text]` — the **whole sentence** — on the `author_principle` arm, which is **66 of the
  67** day-zero rows.
- **C1(iii) is not a free read.** The reveal loop is
  `for (…) { if (!revealIsReleased(…)) continue; … }` and keeps no reference to the last admitted
  reveal. One assignment inside the loop, not zero.
- **Criterion 6's kill-gate instrument does not exist**, and it must rewind-and-branch **and**
  drive the opponent policy — **14 of 50** packs need the first, **17 of 50** the second. A
  mainline-only harness measures the 19 single-line packs and trips the gate for the wrong reason.
- **`items` sorts by `revealedBy.eventSeq` before `KIND_ORDER`** — `claim: 4` is last *within an
  occurrence*, not globally.
- **A stale pack digest cannot withhold a claim.** `EVIDENCE_DIGEST_STALE` is a CLI warning and
  `validateClaimBindings`' `before` is captured **inside** the per-binding loop. The re-stamp is
  hygiene, not a delivery blocker — do not spend stage 1 on it.
- **Re-running the Q8 harness overwrites its committed artefact** ([[D446]]) and dirties the tree.

**Stage 2 has no owner and cannot start without one** ([[D476]]). `claim-backing` was named for
it and then archived; an archived RFC can own a mechanism's design, not a corpus pass's
execution. **Do not adopt it silently** — commissioning it is claude's to arrange.

## 0d. `rfc/teacher-surface.md` — ACCEPTED, body reconciled, UNBLOCKED

Both places you named now read `accepted`: the Status line at `224e258` and **Open question 1**
in this wave. **Nothing waits on an owner.** The owner confirmed the one narrowing on 2026-08-16 —
`live-marker-quality` §6.2's cost from *"permanently"* to **"for the duration of live play"**,
with the 2026-08-15 record left intact beside it.

Claims **one migration position** (`STORAGE_VERSION + 1`; head **23**) — `ALTER TABLE run_grants
ADD COLUMN granted_via TEXT`, nullable, **no backfill, no CHECK**. Four tables,
`run_grants.expires_at`, `live_sessions.classroom_id`. **No run- or pack-schema change, no new
token scope, no fourth `RunRole`, no new session kind.** Also claims **D92** and **D93**.

**One rule carries the design:** on a terminal, disclosed run with no live session open, a
submission-granted teacher gets **the run host's own table** — never a reviewer tier. `reviewing`
sits in the **role** disjunct and never beside `deliveryOpen`, because `design/05` §3a-i says
*"the run — not the viewer — carries the barrier"*.

**Go straight to these four criteria — each exists because the spec as written passed every
other check:** **7a** counts *statements, not sites* (both promotion sites contain a fresh-grant
`INSERT` as well as an `UPDATE`); **10c's second fixture** (the original was a solo pack, where
every candidate implementation agrees — the [[D444]] shape); **10e's extended loop**, ranging over
the two sides independently and shown failing against the old predicate; and **10g**, which
exists because a reviewer could see strictly *more* than the run's own host — `seatedInContest`
had no time bound and sessions are **closed, never deleted**.

**Do not weaken the `granted_via = 'submission'` conjunct.** Compatibility with
`live-marker-quality` is held by it — **by fixture convention, not by construction** as the author
round claimed. **Criterion 6 there changes in two clauses** (*"non-reviewing spectator"*) at this
RFC's landing.

## 1. A defect batch is coming — this is the real throughput fix

`planning/defect-triage.md` is being written now: a routing pass over all **278 open ledger
rows**, bucketed into batches of 5–15 touching related code, live user-affecting ones first.
**The one-RFC-at-a-time cadence was the bottleneck, not the ledger.** When it lands, **work the
top batch as a batch** — one pass, one test run, one commit naming the rows it closes ([[D416]]).

A guard worth shipping inside any batch: **a status-parity check over every Active row** in
`make verify`, comparing the register cell to the RFC body's `**Status:**` line. That is
[[D477]]'s remedy and it would have caught all five instances.

## 2. Not takeable yet

`learner-rating` (open questions 11 and 12), `measurement-records` (returned to author).
`engine-leverage`, `vocabulary-wiring` and `live-marker-quality` are **implementing** — do not
re-enter them.

## 3. Still do NOT take

**D348** (needs a versioned lane), **D351** (needs an accepted authoring-instrument RFC),
**D104** (not reproduced in 20 isolated runs — your refusal of a speculative patch was correct),
and the schema-shaped rows.

## Discharged this wave

`opponent-contracts` archived at `3276a37` with **[[D457]] correctly left open**;
`dead-vocabulary` shipped at `329c62b`; [[D474]]'s gate flake fixed at `0752638` by caching the
declaration-census source scans — **that row can flip when you next touch the ledger.**

## Protocol reminders

- **The ledger flip rides in the implementing commit**; **the log entry rides in the archiving
  commit**; **name the rows you flip in the subject or body** ([[D416]]). You did this at
  `d77a9f1` the first time it was asked for.
- **`design/BACKLOG.md` is a shared ledger, not an intent doc.** Law 5 protects `design/00`–`06`.
- **[[D419]]: column 3 of the defect table is NOT a status**, and **[[D459]]: the table's own
  header calls it "Status" and is wrong.** Read column 1.
- Cite ledger rows by **row title**, never line number. Locate code by **symbol name**.
- Claude's standing errors, all of which fired again this session: **a resolution in a register
  is not a resolution in the body** (five instances, [[D477]]); **a scripted edit that silently
  no-ops is worse than no edit**, because it ships under a commit message describing content
  that is not there ([[D478]]); **`git add` on shared ledger paths while you have uncommitted
  edits** (four instances); **a line-based grep is not a reading.**
