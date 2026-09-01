# Research queue — the whole research lane, one ranked list

**Written 2026-08-16 against `ef0305f`.** This is a **routing document, not research**. Nothing was
run, no dossier was written, no ledger row, gate, or design doc was touched. It consolidates four
scattered inputs — `planning/exploration/plan.md` (Q-series), `planning/exploration/gates.md`
(H1–H5, K1–K10, E1–E5, C1–C7), `planning/campaign-research-queue.md` (R1–R11), and
`planning/defect-triage.md` §5 (19 NEEDS-RESEARCH rows) — into one ranked queue.

**How to read the evidence labels.** Law 3 applies: `[V]` = I opened the file or the symbol in this
pass; `[P]` = a living document asserts it and I did not re-derive it; `[M]` = my judgement, no
external evidence. Where a claim is the *row's* and not mine it is marked `[row]`. **Column 3 of the
defect table is not a status** ([[D419]], [[D459]]) — every ledger id below was read from column 1.

**Ids through D487 are in use.** Proposals in §7 start at D488 and **are not written to the ledger.**

---

## 0. The headline, before the queue

**Three findings outrank the ordering itself.**

1. **The play-session axis is not the real blocker — a corpus-visibility ruling is.** Three
   questions (R6, R7, R8) wait on the owner playing a run. But `make up` currently serves **one
   pack, and it is the JSON schema example fixture**; the 56-pack corpus is development-only and
   **zero packs are graduable** (`planning/app-reality-check.md` §1, hands-on 2026-08-16, `[V]` at
   the source: `Makefile` targets exist and `content/packs/` holds only `.gitkeep` `[V]`). A session
   played today runs a 4-ply schema fixture and answers none of R6/R7/R8. **The action is not
   "schedule a session"; it is "make an owner ruling on [[D481]], then schedule a session."**
2. **A second ordering constraint already binds that session.** Owner ruling [[D462]] (2026-08-16,
   `4ca7792`): *"ship the surface, then run the binding wave before anyone plays."* `[V]` in
   `rfc/feedback-delivery.md:399`. So the play session queues behind claim-delivery stage 2 — and
   **[[D476]] records that the binding wave is currently ownerless** `[row]`. Two decisions, not one
   experiment, stand between here and the loop being felt.
3. **The three questions that are pure kill-criterion work are all cheap.** K6's close-out is a
   re-run of a harness that exists; K9 has never had its *own* arm measured at all; K5 has two
   dossiers of relevant measured evidence that its gate row does not cite. None of them needs a
   human subject. Details in §5.

### Gating split — the axis that decides what you do about each

| Gating state | Count | Entries | What it needs from you |
|---|---|---|---|
| **A — gated on someone running it** | **12** | Q-02, Q-03, Q-04, Q-06 to Q-10, Q-13, Q-15, Q-16, Q-17 | assign an agent; the instrument exists or is ~a day's work |
| **B — gated on the owner playing a session** | **4** | Q-01 (R8), Q-11 (R6), Q-12 (R7), Q-14 (Q9) | and the session is itself blocked on two rulings (§0) |
| **C — gated on human subjects beyond the owner** | **7** | Q-18 to Q-24 | a study: recruitment, N, delay period. **None is blocking construction** |
| **D — not research at all: an owner ruling** | **5** | Q-05, Q-25 to Q-28 | routed to §6, which spells out **10 rulings and standing guards**, including three that block the queue above |

**28 entries total.** The A/B split is the one that matters: **12 of the 16 non-study questions can
start today**, and none of the 12 is waiting on the owner for anything but a "go". Only **four** are
genuinely waiting on the loop being felt — and R6 and R7 are each smaller than their rows claim
(Q-11, Q-12).

---

## 1. The ranked queue

Ranked by **what changes what we build next**, not by cost and not by interest. Cost vocabulary:
**[afternoon]** = a shipped `make` target or an existing harness pointed at the corpus;
**[day]** = a small new disposable harness (~tens of lines);
**[compute]** = harness exists, engine hours;
**[study]** = human subjects;
**[ruling]** = not an experiment (routed to §6, kept in rank order for context).

---

### Q-01 · Can the loop hold attention for one session? (R8)
- **Question:** played end to end, at real length, on real content — does the drill loop reward
  being wrapped in a campaign, or is the campaign scaffolding around a void?
- **Settled by:** the owner playing one run to termination on a pack that is not the schema fixture,
  against a real engine (`make up-engines`, not the `ENGINE_MODE=mock` default — the audit ran mock
  and says so, `[V]` `app-reality-check.md` §10), followed by the `design/05` §1 invariant review.
- **Cost:** [ruling] then [afternoon]. **Gating: B**, blocked behind §0's two rulings.
- **Unblocks:** `design/06-campaign.md` §4 states it directly — *"R8 gates the whole build"* `[V]`.
  Also [[D486]] *"Campaign mode is unbuilt at every tier, and no document says so"*.
- **Note on the standing claim:** `campaign-research-queue.md` R8 says *"nobody has played a run
  since 2026-08-12."* **Stale as written** `[V]`: a run was played to termination, forked and
  compared on 2026-08-16 (`app-reality-check.md` §6). What has not happened is *the owner* playing,
  and what that run proves is that the mechanic works — not that it holds attention, because it was
  four plies of a schema fixture.

### Q-02 · Does the delivered feedback discriminate, once claims can reach a learner? (K6)
- **Question:** after claim delivery ships and the 98-claim binding wave runs, does what a learner
  actually receives discriminate the played move above the measured **1.01×** baseline?
- **Settled by:** re-running `tools/q8-feedback-surface-harness/` (exists, disposable, documented,
  `[V]`) over the corpus post-wave. Its README names exactly what it cannot measure without a played
  run — `human_divergence`, the recorded-engine guard tier, the voice packet `[V]`.
- **Cost:** [afternoon] for the re-run; the **binding wave itself is a content wave, not research**,
  and is ownerless ([[D476]]).
- **Unblocks:** **K6**, which has two independent readings toward firing (`gates.md` K6 `[V]`), and
  B4, and the quality signal that replaced the withdrawn C1.
- **Gating: A** (after the wave). **This is the single highest-value measurement in the queue that
  is not an owner ruling** — see §8.

### Q-03 · How often does `practical_resistance` actually refuse? ([[D375]] — *"How often does
`practical_resistance` actually refuse?"*)
- **Question:** across the in-range corpus, what fraction of roots yield a selection, a named
  refusal, or nothing — now that the float32 tolerance bug is fixed?
- **Settled by:** re-running the R5 arm (`tools/r5-maia-stability-harness/`, exists `[V]`) over the
  same 40 in-range roots.
- **Cost:** [afternoon] + Maia container time.
- **Unblocks:** whether one of five shipped opponent modes is a real alternative or *"a refusal
  wearing a mode's name"* (the row's words), which is E4's framing and the two in-range `hold` packs.
- **Gating: A.** **And the row understates the problem — I verified this.** The only existing
  measurement is `design/research/maia-policy-scalar-stability.md:314` `[V]`: of 40 in-range roots,
  **30 (75%) returned HTTP 500**, 5 refused correctly, 5 selected. That 75% was a `TypeError` from a
  tolerance two orders of magnitude too tight — and it has since been fixed
  (`packages/runtime/src/practical-difficulty.ts:43,49` now compare against
  `FLOAT32_POLICY_MASS_TOLERANCE` `[V]`). **So the refusal frequency is not unmeasured; it is
  measured under a confound that no longer exists.** Proposed as [[D490]].

### Q-04 · Is our endgame mode materially faster and more usable than Chess Endgame Training? (K9, C7)
- **Question:** restart latency, response latency, and unaided task completion in *our* endgame
  mode, against the CET numbers already on file.
- **Settled by:** the CET arm is done and hands-on — cold load 593/672 ms, 80–224 ms per tablebase
  call, ~2.1 s first reply, instant move-list navigation
  (`design/research/teardown-cet.md`, `[V]`). **Our arm has never been measured.** The instrument
  exists: `tests/browser/` drives the real app under Playwright (52 KB suite, `[P]` — asserted by
  `app-reality-check.md` §9.5, I did not open it).
- **Cost:** [afternoon]. **Gating: A.**
- **Unblocks:** **K9** (a kill criterion with literally no evidence on our side of the comparison)
  and **C7** (*"endgame restart and response latency feel effectively instant"*, `unmet`, `[V]`).
- **Caveat that is itself a finding:** the browser suite runs `NODE_ENV=development` with a draft
  fixture ([[D482]]), so a latency number taken there is **not** a number about `make up`. Measure
  both configurations or the result inherits the same defect the gates did.

### Q-05 · Does the pack corpus reach production as graduated packs or as a disclosed draft channel?
- **[ruling], not research.** Routed to §6.1. Placed fourth because **six of eight surfaces are
  empty states downstream of it** (`app-reality-check.md` §8 `[V]`) and because Q-01 cannot start
  until it is answered.

### Q-06 · How many rungs does the band ladder actually have? ([[D390]] — *"The campaign has FOUR
measured rungs today, not five to nine"*)
- **Question:** do bands 1200 / 1600 / 2000 against the fixed band-1400 reference extend the
  measured ladder from four points to seven?
- **Settled by:** three more arms of `tools/d333-band-outcome-harness/` — which exists, is
  documented, reuses the shipped `EngineSupervisor` and `maiaDockerSpec`, and has already been
  extended once with `step100` arms `[V]`.
- **Cost:** [compute] — the landed run was **16,660 games**; three arms at 1,020 each is roughly a
  fifth of that. Overnight, not an afternoon.
- **Unblocks:** `rfc/learner-rating.md` (status **draft**, `[V]`) reads its calibration straight off
  four points and refuses to interpolate; and [[D336]]'s finding that the usable rung is ~150–208
  band points rests on two `step100` pairs.
- **Gating: A.** **Housekeeping risk I verified:** `tools/d333-band-outcome-harness/` is
  **untracked in git** (`git status` `[V]`). The instrument behind the H5 arm, the D335/D336
  transfer ratios and `learner-rating`'s entire calibration exists only in a working tree.

### Q-07 · DONE 2026-09-01 — exact DTZ census ([[D457]])
- **Answer:** yes against a uniform preserving-move null, but the narrower causal reading matters.
  Across 821 winning roots, the selector chooses capture/pawn moves at **1.275×** uniform
  expectation (`p=0.0096`); against a null that first applies the intended `preciseDtz` primary
  ordering, the residual is **1.079×** (`p=0.172`). The measurable effect is therefore explained
  by DTZ; no hash-tiebreak bias is demonstrated.
- **Settled by:** `make dtz-census-measurement` over a retained 1,919-position JSONL with exact
  selector semantics, two nulls, four able-to-fail controls and source digest `[V]`.
- **Evidence:** `design/research/dtz-selector-census-rerun.md`, `planning/dtz-census/`.
- **Correction retained:** the pre-fix lexical diagnosis remains historical; the discarded
  rounded-DTZ post-fix figures are not promoted into this reproducible result.

### Q-08 · Do the corpus's evidence claims have any backing at all? ([[D403]] — *"Three mechanisms
landed in one day and the corpus uses them once between them"*)
- **Question:** is the adoption gap closing or static — `graduation-report` graduable count, and
  `expression-census` `backedClaims`?
- **Settled by:** two shipped `make` targets. **Already re-measured on 2026-08-16 in the running
  app** `[V]`: `make graduation-report` → *documents: 56; blocking: 220; accepted: 43;* **graduable:
  none**. `make expression-census` at the row's writing: **196 claims, `backedClaims: 1`** `[row]`.
- **Cost:** [afternoon] to re-measure; the **fix** is 27 mechanical corpus rows in
  `defect-triage.md` §7a, three of which are a shipped target pointed at the corpus `[row]`.
- **Unblocks:** B4, K6, Q-02's denominator, and the graduation gate that is holding the product shut.
- **Gating: A.** **The open *question* half is not a measurement** — *"may a mechanism land without
  one exercising customer?"* is a process ruling (§6.4).

### Q-09 · Does real broadcast PGN survive our importer? ([[D414]] — *"No broadcast has been
round-tripped through `pgn-import.ts`"*)
- **Question:** does a live-broadcast PGN parse, and does what comes out the far side hold its
  moves, headers and clocks?
- **Settled by:** ~20 lines under `tools/` against `apps/server/src/pgn-import.ts` (**exists**,
  `[V]`). No such tool is present today `[V]` (`tools/` listing).
- **Cost:** [day]. **Gating: A.**
- **Unblocks:** the one unverified link in an otherwise all-`[V]` dossier
  (`design/research/live-relay-as-drill-source.md`), and therefore whether live relay can be
  proposed as an RFC at all (law 1: no RFC from a GAP row).

### Q-10 · Does the census walk survive a 10× corpus? ([[D378]] — *"`census-check` would join
`verify` on a runtime measured at one corpus size"*)
- **Question:** the walk is `O(subjects × positions)` — 192 × 827 today. What is it at 10×?
- **Settled by:** `make expression-census` over a synthetically multiplied corpus, timed.
- **Cost:** [afternoon]. **Gating: A.**
- **Unblocks:** `rfc/measurement-records.md` (status **draft**, `[V]`) proposing `census-check` as a
  gate. The row's own framing is the reason to run it before the RFC lands: *"or the gate becomes
  the reason not to grow the corpus."*
- **Related and already live:** [[D474]] — *"`make verify` has a load-dependent flake"* — **column 1
  reads ✅** `[V]`; the log records the closure came from the declaration-census cache fix
  (`0752638`), not a timeout setting, and `vitest.config.ts` still sets **no `testTimeout`** `[V]`.
  `defect-triage.md` §5 lists a "D474-successor" as NEEDS-RESEARCH; **that successor is Q-10**.

### Q-11 · Is the run-pooled retry budget the one part of R6 still open? (R6, narrowed)
- **Question as the queue states it:** *"Does a rewind budget preserve or destroy punishment-free
  experimentation?"* **As it actually stands:** only *how often* is open.
- **What I verified:** `design/06-campaign.md` §2c splits the owner's single idea into three —
  *where* you may rewind (*"collides with nothing"*), *how often* (the real conflict), and *play it
  out before you rewind* (*"already the rule"*) — and §4 says R6 *"gates the retry budget but not
  rewind-location limits or the play-out rule"* `[V]`. `design/research/time-as-a-difficulty-lever.md`
  independently identifies the run-pooled clock as *"a rewind budget with a real-valued counter"*
  and records it as the refused object `[V]`.
- **Settled by:** the play session, on one third of the original question.
- **Cost:** [afternoon] once the session happens. **Gating: B.**
- **Proposed as [[D489]]:** the campaign queue states R6 whole while the design tier resolved two of
  its three parts, so the row over-prices the session.

### Q-12 · What does it feel like to lack a rung you need? (R7, narrowed)
- **Settled by:** the play session with the assistance ladder deliberately under-equipped.
- **Narrowing verified:** `design/06` §4 — R7 *"gates scarcity tuning and the synergy payoff but not
  the slot vocabulary or the two-gate architecture"* `[V]`. And standing law 5 of that document
  already forecloses one design answer with measured evidence: *"Rarity is not value. ρ = −0.143"*
  `[V]`.
- **Cost:** [afternoon] once the session happens. **Gating: B.**
- **Unblocks:** the synergy claim (*"a noob beats an IM boss with the right coach"*), which is the
  campaign's load-bearing promise.

### Q-13 · Does the in-run phase/structure classifier abstain honestly, and how often is it wrong? (Q4c)
- **Question:** B10 shipped *"attributed phase classification with honest abstention"* (`gates.md`
  `[V]`). Nothing measures its accuracy or its abstention rate. Q4c's own definition requires
  labeled ground truth, inter-reviewer agreement, and false-transition costs (`plan.md` `[V]`).
- **Settled by:** a labeled set + a harness comparing classifier output against it. **The labels are
  the hard part and law 8 governs them** — they must be authored or derived from a validated
  instrument, never generated.
- **Cost:** [day] for the harness, plus authored labels (content work, not research).
- **Unblocks:** B2/B4's **Just Play** promise, which is the product's widest mode. Q4c is marked
  *"breadth-blocking for Just Play"* in `plan.md` `[V]`.
- **Gating: A** for the harness; the label set is a content wave.
- **I checked for an existing answer and found none:** no dossier in `design/research/` matches
  *"phase classification"* or *"inter-reviewer"* `[V]`.

### Q-14 · Is branch/rewind/compare understandable at scale? (Q9)
- **Status is stale as posed.** `plan.md` carries Q9 at **💡 posed** `[V]` while `gates.md` E5 reads
  *"met by use, qualified"* — fork/rewind passed, compare selection and app-shell fit are the
  follow-up — **and** `design/research/mobile-scope.md` measured the 8-column compare band at
  **2010 px, 1.85 screens of horizontal pan at 1280×720** `[V]`. That is compare-**layout** overload
  at N>2 on every viewport, desktop included.
- **The residual question:** at what N does comparison stop being comprehensible, and does grouping
  fix it?
- **Settled by:** a session with 4- and 8-branch comparisons, on real packs.
- **Cost:** [afternoon] once packs are visible. **Gating: B** (needs a run with content in it).
- **Unblocks:** K3, C2, and the branch-group surface already shipped under B3.

### Q-15 · Does Stage 0 sourcing produce usable spines without bulk ingestion? (Q6)
- **Status is stale as posed.** `plan.md` carries Q6 at **💡** with no evidence column `[V]`. What I
  verified: `content/sources/lichess-explorer/` holds **43 cached source artifacts**, `make
  source-fetch` / `candidate-emit` / `candidate-attach` ship, and B6's mining path is green `[V]`.
  Stage 0 demonstrably *runs*.
- **The residual question, and it is the sharp one:** the corpus has **60 `corpus_observed` claims
  against 0 backing records** (`defect-triage.md` §7a `[row]`). So sourcing works and **binding does
  not** — which is Q-08's finding arriving from the other direction.
- **Settled by:** the explorer position-census wave (§7a job 1), not a new experiment.
- **Cost:** [afternoon] per the triage's sizing. **Gating: A.**
- **Still genuinely open inside Q6:** the **rights audit** — raw move scores vs annotations vs
  metadata vs derived aggregates, separately. Desk work, [day], nobody has done it `[V]` (no dossier
  matches).

### Q-16 · Can the ordinary slow learner ever publish a rating? ([[D442]] — *"[[D420]]'s fix was not
coherent as written, and the arm that decides whether an ordinary learner ever publishes has still
not been run"*)
- **Question:** under a clock-closing period rule, how many periods until a rating is publishable?
- **Settled 2026-08-24 by:** AC-7 of `rfc/learner-rating.md` — two arrival rates, one
  count-closing and one clock-closing, intersected across three response models. Clearing cells
  reach RD ≤ 60 in **17–20 clock-closing periods at p50 and 18–23 at p90**; tail cells can remain
  unpublished through the 104-period cap. The supported bracket narrows to **1500–1800 BCS**.
- **Cost:** [day] (a simulation, no engine time). **Gating: A.**
- **Artifact:** `planning/learner-rating/ac7-bracket-results.json`, source-sealed by
  `make learner-rating-bracket-check`; the complete rerun is `make learner-rating-bracket`.
- **Note:** the *generalisable* half of D420 — *"a falsifier that simulates under the assumption it
  tests is not a falsifier"* — is **not research**. It is a standing rule (§6.7).

### Q-17 · What does the corpus-wide tablebase legal-successor census say? (`defect-triage.md` §7a)
- **Question:** **0 of 277** choice-bearing positions have been censused `[row]`.
- **Settled by:** `make tablebase-walk` pointed at the corpus.
- **Cost:** [afternoon] + API time. **Gating: A.**
- **Unblocks:** graduation blockers on endgame packs, and the evidence layer B4's Syzygy residual
  sits on.
- **Ranked below Q-08 because it is a subset of the same adoption gap**, not a separate question.

### Q-18 · Does branch comparison beat viewing two engine lines? (H2, K4)
- **Settled by:** a controlled comparison — played-branches condition vs two-PV viewing, measuring
  explanation quality and later choice (`gates.md` H2 `[V]`).
- **Cost:** [study]. **Gating: C.**
- **Adjacent measured evidence the gate row does not cite** `[V]`: the compare strip discriminates
  the played move at **1.01×** ([[D78]], via `design/research/feedback-versus-the-dashboard.md`).
  That is mechanism-level evidence pointing at K4 and **K4's evidence column is empty** `[V]`.
- **Blocking?** No. Q1c *"cannot gate construction of the slice needed to test it"* (`plan.md` `[V]`).

### Q-19 · Does drilling past the book boundary beat line recall? (H1, K1, K2)
- **Cost:** [study] — two conditions, a delay period, related-position transfer. **Gating: C.**
- **Blocking?** No. Gates C2–C4, i.e. **slice → product build**, not anything being built now.

### Q-20 · Does whole-segment replay transfer? (H3, K8)
- **Cost:** [study]. **Gating: C.** **Blocking?** No.

### Q-21 · Does outcome drilling beat key-move puzzles? (H4)
- **Cost:** [study]. **Gating: C.** **Blocking?** No.

### Q-22 · Do Maia/corpus opponents keep a coherent plan over 10–20 plies? (K5, H5 main statement)
- **Settled by:** blinded strong reviewers scoring plan continuity over 10–20 plies (`gates.md` H5
  test design `[V]`).
- **Cost:** [study] — it needs strong human reviewers, and that is the whole point of the design.
  **Gating: C.**
- **Evidence that exists and is uncredited — I verified both** `[V]`, proposed as [[D491]]:
  `design/research/maia-endgame-fidelity.md` measures **810 probes**, result preservation
  **88.1/88.9/91.9%** vs a uniform baseline's 67.0%, and **all 84 errors were `win→draw`, none
  `win→loss` or `draw→loss`**; `design/research/maia-band-outcome-transfer.md` records **0 ply-cap
  adjudications in 16,660 games**, mean length 63 plies. K5's evidence cell in `gates.md` reads
  `—` with a note saying the D324 pass does not touch it — **which is true, and the endgame-fidelity
  dossier is a different pass that nobody credited to K5 at all.** It does not close K5 (no
  middlegame, no plan inspected), but *"no evidence either way"* is no longer the accurate summary.

### Q-23 · Do target learners and coaches want this? (Q1b, E2, K2–K3)
- **Cost:** [study] — interviews plus a low-fidelity concept test. **Gating: C.**
- **Blocking?** **No, by owner ruling 2026-08-12** — E2 is **advisory** and re-gates only a public
  push (`gates.md` `[V]`). Named here because it looks important and is the single most expensive
  thing in the lane. See §4.

### Q-24 · Does rehearsal improve learning versus simpler formats? (Q1c, C2–C4)
- **Cost:** [study], the full battery — H1–H4 plus delayed retention. **Gating: C.**
- **Blocking?** No, and `plan.md` says so structurally: *"Q1c cannot gate construction of the slice
  needed to test it"* `[V]`.

### Q-25 to Q-28 · Routed out of the research lane
Four entries the inputs carry as research that are not experiments: **Q-25** [[D380]] (may a pack
graduate with `declared: 0`), **Q-26** [[D411]] (assistance lock while the source game is live),
**Q-27** [[D377]] (instrument-version field on measurement records), **Q-28** [[D389]] (assistance
state is unverifiable server-side). [[D403]]'s question half rides with Q-08. All are in §6.

---

## 2. Cheap and unblocking — the set that has been sitting because nobody sized it

Every one of these is an afternoon-to-a-day, uses an instrument that already exists, and unblocks a
gate, a kill criterion, or an RFC that cannot otherwise be drafted. **Nine entries.**

| Rank | Entry | Instrument | Unblocks |
|---|---|---|---|
| 1 | **Q-03** [[D375]] | `tools/r5-maia-stability-harness/` `[V]` | is `practical_resistance` a real mode (E4) |
| 2 | **Q-04** K9/C7 | `tests/browser/` + CET numbers on file `[V]` | **K9** (kill criterion, zero own-side evidence) and **C7** |
| ~~3~~ | **Q-07 DONE 2026-09-01** [[D457]] | `make dtz-census-measurement` `[V]` | exact retained rerun landed; no longer queued |
| 4 | **Q-08** [[D403]] | `make graduation-report`, `make expression-census` `[V]` | B4, K6, the graduation gate |
| 5 | **Q-09** [[D414]] | ~20 lines vs `pgn-import.ts` `[V]` | whether live relay can become an RFC |
| 6 | **Q-10** [[D378]] | `make expression-census` `[V]` | `rfc/measurement-records.md` (draft) |
| 7 | **Q-15** Q6 residual | explorer position-census wave `[row]` | 60 `corpus_observed` claims with 0 backing |
| 8 | **Q-16** [[D442]] | simulation, no engine `[V]` | `rfc/learner-rating.md` (draft) cannot accept an unrun falsifier |
| 9 | **Q-17** tablebase successors | `make tablebase-walk` `[V]` | endgame graduation blockers, B4's Syzygy residual |

**Q-02 is deliberately not in this table.** The re-run is an afternoon, but it is gated on a content
wave that has no owner ([[D476]]) — it is cheap and **blocked**, which is a different action: assign
the wave.

**The triage's own suspicion is confirmed, and it undercounted.** `defect-triage.md` §5 says
*"several are measurement rows the harnesses could answer cheaply"* and names three (D375, D390,
D414). Reading all nineteen and checking each against the tree:

- **8 are cheap measurements** — D375, D378, D390, D403, D414, D442, D456-successor (= D457), and
  D474-successor (which is D378 restated, so **7 distinct questions**);
- **11 are not research at all** — D377, D380, D388, D389, D411, D420, D422, D424, D438, D443,
  D451 — they are rulings, guards, or standing cautions (§6);
- **0 are unknown-and-expensive.** Not one of the nineteen needs a study.

**So the NEEDS-RESEARCH bucket contains no research that is both open and hard.** It contains seven
afternoons and eleven decisions, and it has been sitting because the two were mixed together.

---

## 3. Expensive and not blocking anything — name it so it stops attracting effort

- **Q-23 / Q1b — learner and coach interviews.** The most legitimate-looking research in the lane
  and it is **advisory by owner ruling** `[V]`. It re-gates a *public push*, which is not on the
  roadmap. Running it now buys nothing that changes what we build next.
- **Q-24 / Q1c and Q-18 to Q-21 — the H1–H4 learning battery.** Needs conditions, subjects, a delay
  period, and a related-position instrument that does not exist. It gates **C2–C4**, i.e. slice →
  product build. `plan.md` states the ordering rule outright.
- **Q-22 / K5's blinded reviewer panel.** Needs strong human reviewers. **And the cheap arm has
  already been run twice** (Q-22's evidence note) — the marginal value of the panel is lower than it
  was on 2026-08-12, while its cost is unchanged.
- **A general note on all six:** they share one recruitment problem, and C1 was **withdrawn on
  exactly that ground** — *"no review workflow exists or will"* `[V]`. A study lane that assumes
  reviewers exists in tension with a continuation gate that was struck for assuming the same thing.

---

## 4. Kill-criterion experiments — what could actually kill the product

Law 6: evidence against the thesis is the job working. **Plainly, which experiments could kill it:**

| Criterion | Could it fire? | What it would take | Gating |
|---|---|---|---|
| **K6** — explanations stay generic | **Two readings toward firing already** `[V]` | Q-02: run the binding wave, re-run the Q8 harness. If delivered feedback still discriminates at ~1× after 98 claims are bound, **the authored tier has been tried and failed**, and K6 fires on the remedy its own first note proposed | **A**, after a content wave |
| **K9** — endgame mode not materially better than CET | **Untested on our side entirely** | Q-04: an afternoon. CET's numbers are already on file. This is the cheapest live kill test in the repo | **A** |
| **K7** — timing/structure not encodable | **Half-fired** `[V]`: 0/135 timing usage, two independent attestations | The boundary half is met; the timing half fires or clears when authored packs adopt the new executable window object (E3's content-tier residual) | content wave |
| **K10** — pack cost too high | **Evidence against** `[V]` (43.5 agent-min/pack) | The unmeasured half is **runtime playtest cost**, which needs Q-01's session | **B** |
| **K5** — incoherent plans over the horizon | Open; two dossiers of adjacent measured evidence | Q-22 panel, or a cheaper middlegame proxy nobody has designed | **C** |
| **K1, K2, K3, K4, K8** | No evidence either way | All five need learners using the product over time. **They are unmeasurable while the product serves one schema fixture** — which makes [[D481]] their blocker too | **C**, behind §6.1 |

**The honest summary: exactly two kill criteria can be tested right now, and one of them (K9) costs
an afternoon.** The rest are gated on content, a session, or subjects — in that order.

---

## 5. What I found already answered, or answered enough to restate

The brief warned about a measured **24% stale rate**. I spot-checked and found **eight** entries
whose stated status no longer matches the tree or the dossiers. Six materially change the queue.

1. **R8's *"nobody has played a run since 2026-08-12"*** — stale `[V]`. A run was played to
   termination, forked and compared 2026-08-16. What is missing is the *owner*, on *real content*.
2. **[[D375]] *"frequency is unmeasured"*** — stale `[V]`. It was measured (5/40 refusals, 40 roots)
   under a bug that has since been fixed. It needs **re-measuring**, which is a different job.
3. **[[D390]] *"FOUR measured rungs"*** — narrowly stale `[V]`. The dossier already carries
   `step100-1500-1600`, `step100-1900-2000` and `camp-1000-2000` arms. Four rungs is right for the
   *against-1400 ladder*; the transfer ratio at 100-band steps is already measured twice.
4. **[[D474]]** — **column 1 reads ✅** `[V]`, closed by the declaration-census cache fix. The triage
   lists a "D474-successor" as research; that successor is Q-10, and it is a different question.
5. **R6** — two of its three parts are resolved in `design/06` §2c `[V]`. Only the retry budget is
   experiential.
6. **Q9 at 💡 posed** — stale against E5 (*"met by use, qualified"*) and against `mobile-scope.md`'s
   2010 px compare-band measurement `[V]`.
7. **Q6 at 💡** — Stage 0 sourcing demonstrably runs (43 cached explorer artifacts, three shipped
   `make` targets) `[V]`. The residual is binding and rights, not sourcing.
8. **`campaign-research-queue.md:3` *"Nothing here may become an RFC yet"*** — stale `[V]`:
   `design/06-campaign.md` and `rfc/learner-rating.md` both exist. Already flagged by
   `app-reality-check.md` §9.4; repeated here because the line still governs a file people read.

**Check rate: I spot-checked 19 of the 28 entries against the tree or a dossier (68%).** The nine I
did **not** check are Q-17 (its `0 of 277` figure is the triage's `[row]`), Q-18 to Q-21, Q-23 and
Q-24 (the six study-lane entries — I ran keyword sweeps for *"spaced repetition"*, *"book
boundary"*, *"phase classification"*, *"inter-reviewer"* and *"rewind budget"* across
`design/research/` `[V]` but did not read each dossier), and Q-26 / Q-28, where I read the ledger
row and did not open the code it names. **Eight of nineteen checks found a stale statement — a 42%
hit rate on the checked set**, higher than the 24% the brief expected, because I deliberately
sampled the rows most likely to have moved rather than sampling at random.

---

## 6. Sent back — these are design decisions, not experiments

Each names the ruling needed. **None of them is answerable by a measurement, and three are blocking
the queue above.**

1. **[[D481]] — *"`make up` serves ONE pack, and it is the schema example fixture"*. BLOCKING Q-01,
   Q-14, and every usage-based kill criterion.** The ruling: does the corpus reach a learner by
   **graduating 3–5 packs properly**, or by a **disclosed draft/preview channel** behind an explicit
   "unreviewed content" acknowledgement? The registry already carries `channel: official |
   community` and the UI already renders the badge `[V]`. Flipping `NODE_ENV` is the one option that
   is not available — it serves 220 unresolved blockers into law 8's face.
2. **[[D476]] — the binding wave is ownerless. BLOCKING Q-02.** The ruling: who owns 98 claims of
   corpus work that a landed owner ruling requires to happen *before anyone plays*? An archived RFC
   cannot own a corpus pass's execution.
3. **[[D486]] — *"Campaign mode is unbuilt at every tier, and no document says so"*.** The ruling:
   does the campaign get an RFC before or after Q-01? `design/06` §4 says R8 gates the build; it
   does not say whether it gates the specification.
4. **[[D403]]'s question half — *"whether a mechanism should be allowed to land without one
   exercising customer"*.** A process rule for `rfc/0000-rfc-process.md`. The measurement half is
   Q-08 and is done.
5. **[[D380]] — *"May a pack graduate with `declared: 0`?"*** The row files itself explicitly as a
   hand-off between two RFCs so neither assumes the other owns it `[V]`. It is a policy call.
6. **[[D411]] — *"Assistance must be lockable on 'the source game is still live'"*.** A design
   constraint with a named first consumer (`sessionKind`), not an open question.
7. **[[D377]] — *"An evaluator-semantics change silently moves every census reading at once"*.**
   The row says *"named rather than solved"* `[V]`. The decision is whether measurement records
   carry an instrument-version field — an RFC call, owned by `rfc/measurement-records.md`.
8. **[[D420]], [[D422]], [[D424]], [[D438]], [[D443]], [[D451]] — six standing guards, not six
   questions.** I read all six rows: each records that its **local instance was already fixed,
   withdrawn, or corrected** at the site that found it `[V]`, and what remains is a generalisable
   rule (*don't validate a model by simulating under it*; *a tablebase seal is an adjudication*; *a
   caveat that survives in one section will not survive the next reader*; *before refusing a surface
   because a number is manufactured, check whether the refusing document has argued it is not*; *a
   criterion whose failure clause fires and is read as a pass is worse than one that cannot fail*).
   **They belong in RECORD-ONLY or in `rfc/0000-rfc-process.md`, not in a research queue** — with
   one exception already extracted as Q-16. `rfc/learner-rating.md`'s status line confirms D420's
   and D424's fixes are folded into the current round `[V]`.
9. **[[D389]] — *"Assistance state is unverifiable server-side"*.** `tabiya.assistance.v1.*` is
   browser-only and never reaches the server, so *"this run was played unassisted"* cannot be
   checked — only refused at the route layer `[row]`. **No measurement can change that; it is an
   architecture ruling**: either assistance state becomes a server-held fact (a schema/API change
   needing an RFC) or **every claim about how a run was played carries a stated limitation
   forever**. The row itself says the consequence generalises well past `learner-rating`.
10. **[[D388]] — *"A rated ladder has an undetectable abandonment bias, because the product has no
    resignation"*.** The remedy already ships as a mandatory `abandoned_games` disclosure beside the
    rating `[row]`. What remains is a **standing caution for any future measurement over played
    games** — RECORD-ONLY, with no experiment attached. It matters to Q-19/Q-24 if those ever run,
    which is the only reason it is named here rather than dropped.

---

## 7. Proposed ledger rows — **not written**

Ids from D488, per the brief. Each is something this pass found that no existing row states.

- **D488 🐞** — *K9 has only one measured arm.* CET's latency and UX were measured hands-on
  2026-08-11; **our own endgame restart/response latency has never been measured**, so a kill
  criterion framed as a comparison has one side of the comparison missing, and C7 is `unmet` by
  absence of an instrument rather than by a result.
- **D489 💡** — *R6 is stated whole in the campaign queue and resolved in two of three parts by
  `design/06` §2c.* The queue therefore prices a session for a question that is a third the size it
  claims, and `time-as-a-difficulty-lever.md` has already identified the run-pooled clock as the
  same refused object.
- **D490 🐞** — *[[D375]]'s frequency is not unmeasured; it is measured under a confound that has
  since been fixed.* `maia-policy-scalar-stability.md:314` records 30/40 roots returning HTTP 500
  from a float32 tolerance now corrected in `packages/runtime/src/practical-difficulty.ts`. A row
  saying *"unmeasured"* will be re-found by the next sweep as a fresh question rather than a re-run.
- **D491 🐞** — *K5's evidence cell reads `—` while two dossiers measure the opponent over a
  horizon.* `maia-endgame-fidelity.md` (810 probes; all 84 errors `win→draw`) and
  `maia-band-outcome-transfer.md` (0 ply-cap adjudications in 16,660 games) are both uncredited to
  it. Neither closes K5; *"no evidence either way"* is nonetheless not accurate.
- **D492 🐞** — *the research lane has no derived index, and this file will go stale exactly as
  `planning/work-register.md` did ([[D487]], 121 rows stale, measured).* Four documents hold research
  questions and nothing reconciles them; this file is hand-written prose over four hand-written
  sources. Until a target derives it, it is a snapshot with a date on it.

---

## 8. If you run one thing

**Q-04 — measure our own endgame restart and response latency against the CET numbers already on
file.** An afternoon, an instrument that exists, and it is the **only kill criterion in the repo
that can be tested today without a content wave, an owner ruling, or a human subject**. K9 has never
had its own side measured; C7 is `unmet` for the same reason. Either it clears two gate rows at once
or it produces the first live evidence toward a kill — and law 6 says both outcomes are the job
working.

**The runner-up is not an experiment.** It is ruling on [[D481]], because Q-01, Q-11, Q-12, Q-14 and
five kill criteria are all behind it, and no amount of research throughput moves them until someone
decides how a pack reaches a learner.
