# Feedback-delivery Stage 2 — the binding-wave work order

**Drafted 2026-08-22 at HEAD `a3b1e01`. Every population below is re-derived from the tree at
that commit, not inherited from the RFC** (criterion 22 rejects an inherited count;
`rfc/feedback-delivery.md:2496-2499`). Status: **R1 RULED 2026-08-22 ([[D949]]): the whole wave holds until Gate F — both arms. Steps 1–2 (tooling) proceed; steps 3+ wait for Gate F.** R2 ruled too ([[D950]]: registry may grow, claude authors counterCases under owner veto), dormant behind Gate F. Original status line: executable pending one owner ruling (R1, §5);
steps 1–2 are legal to queue immediately.

This is the commissioning brief criterion 22 requires — the wave `rfc/archive/claim-backing.md`
was named to own (OQ5) and could not own after archival ([[D476]], [[D514]]). The RFC's own
Discharges table (`rfc/feedback-delivery.md:2533-2535`, row `D1`) already assigns the wave to
`OWNER`. **Proposed ownership: the owner (Marco) holds the wave; codex executes the mechanical
and tooling steps; claude lands ledger/log edits; authoring decisions are the owner's or
claude-on-an-owner-ruling** (law 5, law 8).

---

## 1. What Stage 2 actually is

Owner ruling [[D462]] (`4ca7792`, 2026-08-16): *"Ship the surface, then run the binding wave
before anyone plays."* §0.1 of `rfc/feedback-delivery.md` makes Job 1 a two-stage landing:
stage 1 (C1–C9, CR1–CR5 — the delivery path, admission gate, provenance lines, strip filter)
landed at `a64e6c5` on 2026-08-21 and is criterion-complete
(`planning/feedback-delivery/stage-1-criteria.md`). Stage 2 is **validating `claimBindings` for
the withheld claims, by the three kinds of work §0.2 prices** (`rfc/feedback-delivery.md:415`),
measured by criteria 21–23. The RFC stays `implementing` until stage 2's measurement exists;
criterion 11's ledger flips ride stage 2's commit (`:2365-2366`, `:2469-2470`).

### 1.1 The population, pinned at HEAD `a3b1e01`

Re-derived 2026-08-22 through the **shipped predicate** (`admittedFeedbackClaimIds` /
`PackRecord.boundClaimIds` via `PackRegistry.loadDefault`, the same path
`tools/feedback-delivery-harness` uses), not by re-reading the RFC:

| measure | at HEAD | vs 2026-08-16 |
|---|---|---|
| claim-bearing packs | **50** | unchanged |
| claims | **196** (61,531 chars) | unchanged |
| admitted | **98** (26,735 chars, 43.4%) | unchanged |
| withheld | **98** (34,796 chars) | unchanged — **"98 claims" still holds** |
| bound (validating binding) | **1** (`philidor-third-rank-hold/philidor-is-drawn`) | unchanged |

`git diff a64e6c5..HEAD -- content/` is empty; the only predicate-path change since stage 1
(`e74c10a`/`7944ecb`, routing `claim-binding.ts` records through the evidence manifest) moves no
count — verified by running the predicate, above.

Label populations at HEAD (direct corpus count, matches `rfc/feedback-delivery.md` §3.2 exactly):

| label | claims / packs | withheld |
|---|---|---|
| `corpus_observed` | 60 / 31 | 60 — **0** `explorer_position_census` and **0** `explorer_frequency` records exist in the corpus (764 records = 391 `engine_eval` / 341 `tablebase_result` / 32 `position_legality`) |
| `tablebase_exact` | 37 / 12 | 36 — `CLAIM_CENSUS_INCOMPLETE`: 0 of 277 choice-bearing positions have a full legal-successor census (D110) |
| `engine_validated` | 8 / 3 | 8 — records exist (391 `engine_eval`); the blocker is `normalizes`-exact prose |
| `author_principle` | 82 / 35 | n/a — registry-carried, already at 100% (§3.2 verdict) |
| `derived_feature` | 43 / 29; `hypothesis` 24 / 21 | not machine-checkable; never withheld |

Ledger-less claim-bearing packs at HEAD: **18**, of which **15 hold 39 machine-labelled claims**
(`berlin-queenless-press`, `carlsbad-minority-attack`, `closed-centre-chain-black-base-strike`,
`dragon-yugoslav-race`, `french-advance-chain-white`, `grunfeld-exchange-fianchetto`,
`iqp-black-tarrasch-defence`, `iqp-white-panov-attack`, `kid-mar-del-plata-white`,
`london-wedge-black-counterplay`, `maroczy-bind-white-squeeze`, `nimzo-doubled-c-pawns`,
`open-centre-french-exchange-black`, `open-centre-ruy-exchange`,
`trajectory-caro-advance-chain-bishops`) — the RFC §3.2 list, unchanged. For these the debt is
**a sourcing run plus a ledger plus a binding** (D128 class).

### 1.2 What "binding" means mechanically

- **The writer is the evidence sidecar, not the pack**: a `claimBindings` entry in
  `<stem>.evidence.json` that **validates in full** under `validateClaimBindings`
  (`apps/server/src/sourcing/claim-binding.ts`) — a binding is admitted only under
  `if (issues.length === before)`, so any single issue withholds the claim entirely
  (`rfc/feedback-delivery.md:1381-1386`).
- C6 reads `PackRecord.boundClaimIds` (`apps/server/src/pack-registry.ts`); the delivered value is
  `PackRecord.claimBackings.get(claimId)?.binding ?? "self_declared"` — three-valued:
  `ledger_bound` / `author_attributed` / `self_declared` (§2.5, §2.6 C5(4)).
- **`claimBackings.authorSpans` is not one shape** (`rfc/feedback-delivery.md:1072-1075`, changelog
  `:3014`): on the machine-bound arm `pack-registry.ts` writes `binding.authorSpans` (the **cut
  author-attributed segments**); on the `author_principle`-without-machine-label arm it writes
  `authorSpans: [claim.text]` — **the whole sentence**. Wave edits that add `author_principle`
  therefore change what C8's provenance line attributes; criterion 20's boundary test
  (67 projected rows at stage 1) must stay green after every pack edit.
- The `author_principle` remedy is a **pack** edit: `evidenceTypes` gains `author_principle` AND
  `principles` names a `content/principles/` entry, else `CLAIM_AUTHOR_LABEL_REQUIRED` refuses
  outright (§0.2(b), §3.2a). `CLAIM_PRINCIPLE_OFF_PHASE` cannot refuse any of them — all 13
  registry entries list all three phases (`:2505-2506`).
- Refusal codes the wave will meet: `CLAIM_ASSERTION_UNRECORDED` (all 60 explorer claims today),
  `CLAIM_CENSUS_INCOMPLETE`, `CLAIM_FEN_OFF_PACK`, `CLAIM_AUTHOR_LABEL_REQUIRED`,
  `CLAIM_SPAN_CONTRADICTED`; `normalizes` is exact — *"+0.66"* binds, *"about two thirds"* does
  not (§3.2 per-class tables).

### 1.3 The acceptance measurement stage 2 needs (criteria 21–23)

`feedback-delivery` moves to `implemented` **only** when `planning/feedback-delivery/` holds a
**second** admission measurement, from the **same shipped predicate over the same shipped code**
(`:2464-2470`), recording:

- **(a)** stage-2 admitted/withheld claim and character counts beside stage 1's 98/196 +
  26,735/61,531, with the delta stated;
- **(b)** **every** still-withheld claim listed with a **named reason** — either **(b-i)** the
  `SourcingIssue` codes a declared binding raised, or **(b-ii)** *no binding declared* plus which
  of the three kinds of work would supply one. A withheld claim with neither form **blocks the
  transition** (`:2477-2489`). All 98 are (b-ii) today;
- **(c)** each reason classified **permanent** (no instrument in this repo can produce the record
  — `claim-backing` §4 Bucket 3's cross-ledger/reimplementation residue) or **deferred** (names
  who holds it). *"N% delivered" is deliberately not the criterion* — Bucket 3 makes any share
  unsatisfiable by construction (`:2471-2474`).
- **Criterion 22**: this brief, with populations re-derived (done above) and the two
  stale-on-success rows carried: **[[D432]]** (`RECORDED_READING_DISPOSITIONS` records
  `explorer_position_census` as `refused` — false the moment the explorer pass runs, and
  `assertRecordedReadingDispositions` cannot catch it) and **§3.2a item 3** (every
  `evidenceTypes` edit moves `digestDrillPack` → `EVIDENCE_DIGEST_STALE` on the sidecar →
  re-stamp in the same commit; `CLAIM_TEXT_DRIFTED` does *not* fire because the text is
  untouched).
- **Criterion 23**: the measurement commit asserts **no dated entry** appended to
  `planning/exploration/log.md` or `planning/content-era/log.md` between stage 1's commit
  (`a64e6c5`, 2026-08-21) and stage 2's measurement records a play session or owner walkthrough
  on a claim-bearing pack. Basis line: *"nobody has played a run since 2026-08-12."* A trip is
  **escalated to the owner, not fixed in code**. (Checked while drafting this order: no such
  entry exists through 2026-08-22.)

---

## 2. The split by executor

### (a) Mechanical — codex. Instrument runs and record plumbing, no chess judgement

| row-class | population at HEAD | shipped instrument / symbol |
|---|---|---|
| Tablebase legal-successor census | 36 withheld `tablebase_exact` claims / 12 packs; 0 of 277 choice-bearing positions censused | `make tablebase-walk` / `verifySyzygyDraft`; `tablebase.moveCensus@v1` (`claim-binding.ts:118-121`) |
| Engine pass | 8 claims / 3 packs; 391 `engine_eval` records already warm; 0 ambiguous FENs | `make engine-walk` / `verifyEngineDraft` |
| Explorer position-census | 60 `corpus_observed` claims / 31 packs; **22 directly attachable** (ledgered), **38 need a sidecar first** | emitter `apps/server/src/sourcing/explorer.ts:268`; `make source-fetch`, `make candidate-attach`, `make verify-draft` |
| Sidecar creation | the 15 ledger-less machine-labelled packs (39 claims) | `make source-fetch` + `make candidate-attach` pipeline |
| Bindings over already-committed records | ~20 Bucket-1-style claims (`claim-backing` §4; re-derive at execution) | `claimBindings` entries + `make sourcing-check` |
| Digest re-stamps | every sidecar a commit's pack edit touches | shipped `digestDrillPack` behavior; `verifyDraft` re-stamps in place |
| Split probe (job-1 first task) | grep `provenance.sources` per pack for an explorer rationale — `attachExplorerEvidence` throws `ATTACH_SOURCE_LINE_MISSING` without it ([[D409]]) | hours; misses route to (b) |

**Roughly 96 of the 98 withheld claims get their *records* mechanically** (the other 2 are
`claim-backing` Bucket-3 authoring dispositions). But records alone admit only the minority whose
sentences already bind — §3.2a shows 63–83 of the 98 also need (b).

### (b) Authored chess judgement — law 8 forbids generating it

- **The 63-floor / 83-ceiling `author_principle` pass** (§3.2a, re-derive the exact split at wave
  start): 63 withheld claims provably carry a `MACHINE_TOKEN`-free segment no binding can ever
  attribute; their only remedy is choosing **which of the 13 registry principles the claim rests
  on** — a chess judgement rendered to the learner by C8's second form. Plus OQ8's **31 optional**
  `derived_feature`-side decisions: **up to 94 rung-5 provenance decisions**, D462's *"a human
  must judge each one."*
- **Prose fixes**: `normalizes`-exact spans for the engine claims; quantified sentences for the
  explorer claims whose packs lack the rationale line (split probe output).
- **Two tablebase authoring fixes** (`claim-backing` §4 Bucket 3 rows 4–5):
  `philidor-passive-rook-convert/sibling-drill` (copy the sibling record into this pack's ledger
  or drop the cross-reference) and `why-the-skewer-works` (re-label to `derived_feature`, bind
  against `position_legality`).
- **The authoring session**: per-pack passes over the **33 packs holding the 63**, principle
  registry (13 entries, 12 referenced) open beside each claim's text and each candidate
  principle's `statement`/`counterCase`. The human decides; codex applies the field edits and
  re-stamps. **Size: 63–94 decisions ≈ 3–6 sessions of ~15–25 decisions**; law 8 is the floor on
  speed (D462's own words). Decisions recorded per claim (claim id → principle id, or "registry
  must grow" → R2).

### (c) Owner rulings — named precisely

1. **R1 — D560 × D462 reconciliation (blocks step 3 onward).**
   `planning/feedback-delivery/plan.md:3` says *"Stage 2 remains under D560"*; the 2026-08-20
   content hold (`design/BACKLOG.md` D560; `planning/platform-alignment/plan.md:39` — *"Do not
   launch a scale content wave"* until Gate F) and D462's *"run the binding wave before anyone
   plays"* currently deadlock the owner's first play session. The ruling needed, exactly: **does
   the binding wave fall under the D560 hold?** Options: (i) exempt the whole wave (it adds no
   new packs or claims — it backs existing ones, the D462-commissioned pre-play obligation);
   (ii) exempt the mechanical arm (a) now, hold the 63-edit authored arm (b) behind Gate F's
   migration/budget clauses (D560's own rationale — schema churn forcing repeated pack editing —
   applies to (b), not to sidecar records); (iii) hold everything until Gate F, accepting the
   play session stays blocked.
2. **R2 — Open question 8 (blocks step 5 only)**: may the principle registry grow beyond 13, and
   who authors a new entry's required `counterCase`? (`rfc/feedback-delivery.md:10-11`,
   `:451-456` — *"non-blocking for the delivery mechanism and squarely blocking for the wave"*.)
3. **R3 — criterion 21(c) sign-off (wave end)**: accept the permanent/deferred classification of
   every still-withheld claim, including Bucket 3 staying dark as *the mechanism working*.
4. **R4 (optional, severable)**: whether graduation `blocking → resolved` transitions ride this
   wave's commits or wait for `graduation-clearance`'s own corpus-apply authorization
   (D642's owner-acceptance clause). Deferring R4 does not block criteria 21–23.

### (d) Tooling that must be BUILT first

1. **The `blocking → resolved` writer — [[D466]], does not exist at HEAD** (verified: no
   `graduation-clear` target in `Makefile`, no `clearGraduationEntries` symbol in the tree).
   Spec is already pinned to buildability in `rfc/graduation-clearance.md` §6.5
   (`:2356-2420`): **`make graduation-clear FILE=<pack.json>` →
   `apps/server/src/sourcing/graduation-clear.ts` exporting
   `clearGraduationEntries(file: string, options?: { readonly now?: () => Date; readonly census?:
   ReturnType<typeof runExpressionCensus>; readonly check?: boolean }):
   Promise<GraduationTransitionResult>`** — modeled on the shipped `verifyDraft`
   (`sourcing/verify-draft.ts:323`: read pack + sidecars, run the instrument, rewrite in place
   via `writeCanonicalJson`, emit a `tabiya.sourcing.job.v1` document). It evaluates clearance
   kinds A–E at their named shipped symbols, refuses the whole file on
   `GRADUATION_CLEARANCE_VACUOUS` (all-or-nothing), machine-renders `resolved.by`, and —
   **mandatory, §6.5 step 4** — re-stamps `packDigest` via the shipped `digestDrillPack`. A
   sweep builds the census **once** and passes `options.census` (`runExpressionCensus` walks
   directories; 50 uncached calls = 50 corpus walks, `:2387-2394`). Building the mechanism is
   legal **now**: D642's sequence permits plan/mechanism after Feedback Stage 1 landed
   (2026-08-21); only the corpus **apply** stays owner-gated.
2. **The criterion-21(b) accounting instrument**: extend `tools/feedback-delivery-harness`
   (disposable, exploration-gate labelled) to emit, per withheld claim, its (b-i) issue codes or
   (b-ii) *no binding declared* + kind-of-work — the list the stage-2 measurement file must carry
   verbatim.
3. **The criterion-23 trip assertion**: a check that scans both append-only logs for dated
   entries after `a64e6c5` recording play/walkthrough on claim-bearing packs, and fails by
   design when one exists.
4. **The job-1 split probe** (see (a)): trivially small; build inside the harness.

---

## 3. The digest-stale trap — re-verified at HEAD

**26 of 36 `content/candidates/*/evidence.json` raise `EVIDENCE_DIGEST_STALE` at HEAD
`a3b1e01`** — re-measured 2026-08-22 by running the shipped `sourcing-check` over every candidate
directory; the 2026-08-16 count (`planning/defect-triage.md:430`, `planning/codex-queue.md:227`)
is unchanged. **0 of 32 draft ledgers are stale.**

**They must NOT be bulk re-stamped before the writer exists.** [[D269]]'s discipline: a re-stamp
erases a signal it did not create; [[D406]] and D209's candidate half are explicitly *"blocked,
and say so"* on the writer (`planning/defect-triage.md:642`). Hand-editing graduation entries or
digests in those 26 files is forbidden until `make graduation-clear` lands
(`planning/content-wave-work-order.md:570`).

Sequencing consequences baked into §4:

- The candidate re-stamps **ride the writer**: they happen inside `clearGraduationEntries` runs
  (its mandatory step-4 re-stamp accompanies a recorded transition) or an explicitly
  owner-authorized post-writer hygiene pass — never as a standalone cleanup commit.
- The wave's **draft**-side obligation is separate and per-commit: each (b)/(c) pack edit moves
  `digestDrillPack`, so the touched sidecars are re-stamped **in the same commit**
  (`rfc/feedback-delivery.md` §3.2a item 3; criterion 22). The stale digest cannot withhold a
  claim (`EVIDENCE_DIGEST_STALE` is a warning on a CLI path the registry does not run,
  `:1441-1447`) — this is hygiene, not a delivery blocker, and it keeps "0 of 32 stale" true at
  every landing.

---

## 4. Execution sequence

| # | step | executor | effort | the landing commit must contain |
|---|---|---|---|---|
| 0 | **R1 ruled** (§2c.1) | owner | one ruling | nothing lands; recorded as a BACKLOG row + `planning/feedback-delivery/log.md` entry when ruled |
| 1 | **Tooling** (§2d): `clearGraduationEntries` + criterion-21(b) accounting + criterion-23 assertion + split probe | codex | 1–2 days | code + tests only; zero content bytes; `planning/feedback-delivery/log.md` entry. D466's flip belongs to `graduation-clearance`'s closeout, not this commit |
| 2 | **Brief finalization** (criterion 22): re-run §1's derivations at wave start, run the split probe, freeze the (b) queue | codex/claude | hours | this file updated; log entry. Legal under D560 (planning, no content) |
| 3 | **Instrument runs on ledgered packs**: tablebase census (12 packs / 277 positions), engine pass (3 packs), explorer attach for the 22 | codex | 1.5–2 days total | records + bindings + same-commit sidecar re-stamps; **content-wave closeout**: `design/BACKLOG.md` flips for rows fixed (D110's census half, D231/D147 partials) + `planning/content-era/log.md` entry **in the shipping commit** (CLAUDE.md); [[D432]]'s disposition text corrected in the first explorer commit |
| 4 | **Sidecar creation + explorer runs** for the 38 claims in 15 ledger-less packs | codex | ~1 day | ledgers + records + bindings + re-stamps + content-wave closeout per commit |
| 5 | **Authoring sessions** (§2b): 63–94 principle decisions, prose fixes, 2 tablebase fixes | owner or claude-on-ruling decides; codex applies | 3–6 sessions over days (law 8 floor); R2 needed if the registry must grow | pack edits + same-commit re-stamps + criterion-20 boundary suite green + content-wave closeout per commit |
| 6 | **Candidate hygiene** (severable; needs R4): `graduation-clear CHECK=1` sweep, then transitions where predicates hold — the 26 stale re-stamps ride these runs | codex | half day | transition documents + re-stamps + log entry. Not a criterion-21–23 blocker; may trail |
| 7 | **Stage-2 measurement + archival**: same shipped predicate re-run; `stage-2-measurement.md` with (a) delta, (b) per-claim named reasons, (c) permanent/deferred + holder (R3); criterion-23 assertion; criterion-11 ledger flips exactly per `rfc/feedback-delivery.md:2365-2389` (D77 ✅ end-of-wave split + C1 reach, 22.1%-text retired; D78 → 🚧 partial with corrected figures; D79 stays open, 0-of-201 re-derived; D167 ✅; D417/D421 annotated; vocabularies row annotated); RFC → `implemented`, moved to `rfc/archive/`; `planning/exploration/log.md` entry | claude (ledger edits proposed by implementer, landed by claude — `:2388-2389`) | ~1 day | all of the above **in one commit** — the RFC completion protocol's both halves |

Steps 3–5 may interleave per pack; step 7 runs once, after the queue is worked or every remainder
has a named reason. The wave is allowed to end incomplete; it is not allowed to end unaccounted
(criterion 21(c)).

---

## 5. The commissioning question

**Who owns what**: owner — R1 now, R2 before step 5, R3 at step 7, the 63–94 authored decisions
(or a ruling delegating them to claude per pack); codex — steps 1–4, 6, and the mechanical
application inside step 5; claude — step 2 finalization, step 7, and every `design/BACKLOG.md` /
log edit.

**Is any owner decision genuinely required before step 1 can start? No.** Steps 1 and 2 are code
and planning: the writer's spec is pinned in an accepted RFC (`graduation-clearance` §6.5), D642's
sequence explicitly permits mechanism-building now that Stage 1 has landed, and no content byte
moves. **Queue steps 1–2 immediately.**

**One owner ruling is genuinely required before step 3** — R1, because the repo currently holds
two owner rulings in tension: D462 (2026-08-16) requires this wave **before anyone plays**, and
D560 (2026-08-20) holds scale content work behind Gate F, with
`planning/feedback-delivery/plan.md` placing Stage 2 under that hold. Until R1 is ruled, the
wave, the RFC's archival, and the owner's first play session are all blocked on a single
five-minute question. Recommended framing for the ruling: option (ii) of §2c.1 — release the
mechanical arm (a) now (records and sidecars are not authored content and no schema lane is
touched), and decide the 63-edit authored arm (b) against Gate F's re-authoring-budget clause —
but the choice is the owner's, and this order executes under any of the three.
