# Drill-pack authoring cost — the Q7 / K10 verdict

**Question:** Q7, "What does a drill pack cost to author?" — the input to kill criterion
K10, "Pack production cost is so high that only a handful can ever exist"
(`planning/exploration/gates.md:73`), and to continuation gate C6, "Pack authors can
create a reviewed pack with a documented, repeatable workflow" (`:103`).

**Status of the question before this dossier:** `planning/exploration/plan.md:29` records
Q7 as `🔬 job open`. The only prior verdict attempt is `design/BACKLOG.md:292`
("K10 framing corrected 2026-08-12"), which measured **one** pack at 105 minutes with 43%
tooling friction and correctly concluded that "no K10 verdict is supportable in either
direction yet". This dossier harvests the nine waves that have run since.

---

## 1. Verdict

**K10 is not firing. Pack production cost is a manageable cost, not a kill risk — and it
is not a solved problem, because the cheapest packs measured are the least grounded ones
and the runtime-playtest half of the cost was measured exactly once and never again.**

The supporting facts, each expanded below:

- **35 authored pack files exist** in `content/drafts/` `[V]`, 33 of them with
  minute-level cost instrumentation, at a mean of **43.5 minutes per pack** `[P]`. That is
  not "a handful", and it is not a bounded-session failure — `design/04-content-architecture.md:329-331`
  sets the bar as "a reviewed pack cannot be produced in a bounded session"; every wave
  produced multiple packs inside one session.
- **Tooling friction fell from 42.9% (pack A) to 11.6% across the whole corpus** `[P]`,
  and to **9.2% excluding pack A** — below the ~25% threshold that fires
  `planning/content-era/plan.md:35-37`'s build-tooling rule. **But a large part of that
  fall is a change of activity, not a fix** (§4.2).
- **Cost per pack is rising, not falling** — 25.9 min/pack at the cheapest wave, 97.5 at
  the most recent `[P]` — because the *grounding* bar rose, not because authoring got
  harder. The cheap packs are the ungrounded ones.

**One sentence:** at 43.5 measured agent-minutes per pack across 33 packs and nine waves,
pack production cost does not fire K10 — but the number covers only the drafting half of
the pipeline, and the ungrounded opening packs that make the average look cheap have not
paid their §3b grounding bill yet.

---

## 2. Method, and what these numbers are not

**Instrument.** Six-category minute logging defined at `planning/content-era/plan.md:12-24`
(`research`, `encoding`, `engine-validation`, `review`, `revision`, `tooling-friction`),
appended per session to `planning/content-era/log.md`. The log holds **27 dated entries**
spanning **2026-08-12 to 2026-08-15** `[V]` — a four-day span, not the week the framing
assumed.

**Honesty limits, stated before the numbers:**

1. **Every minute figure is self-reported by the authoring agent, not stopwatch-measured.**
   Wave 5a's own entry marks its split "approximate" (`planning/content-era/log.md:944`).
   Treat every cost figure in this dossier as `[P]`: source-backed to a cited log line, not
   independently reproducible. The **arithmetic over them is `[V]`** — recomputable from
   the cited lines — but the inputs are estimates.
2. **Two of the 35 packs carry no minute data at all.** The wave-3 trajectory entry
   (`log.md:824-828`, `trajectory-qgd-exchange-minority.json` and
   `trajectory-caro-advance-chain-bishops.json`) logs only a percentage split of "one long
   session" with no total. **No total is extrapolated over that gap.** The 10-entry endgame
   shape-library wave (`log.md:586-588`) is likewise percentage-only; shape entries are not
   packs and are excluded from every per-pack figure below regardless.
3. **`review` is zero everywhere and always was.** It was retired 2026-08-13
   (`plan.md:22`, `:60-66`), and new entries log 0 — but the pre-retirement entries
   (packs A, B, C, `log.md:70`, `:319`, `:417`) **also logged `owner-review 0`**. The
   retirement therefore removed a clock that had never run; **none of the cost decline in
   §3 is attributable to it.** `planning/content-era/plan.md:56-58` predicted that
   `owner-review` would dominate the pipeline total. It never registered a minute.
4. **The 33 instrumented packs map 1:1 onto named files** `[V]` — packs A/B/C (3) + wave 2
   (6) + wave 5a (4) + wave 5b (6) + wave 4a (8) + wave 5c (4) + B+N (2) = 33, with the two
   wave-3 trajectories making up the 35 files in `content/drafts/` (four `*.browser.json`
   runtime fixtures and all `*.evidence/job/sources.json` sidecars excluded). No pack is
   double-counted and none is missing.
5. **Machine time is not agent time.** Wave 5a records ~8 minutes of dump download and
   background emitter/engine passes explicitly outside the clocks (`log.md:946-947`);
   wave 5c and B+N ran cached, rate-limited tablebase query streams whose wall-clock is not
   in the totals either.

---

## 3. The real cost curve

All figures `[P]`, computed from the log lines cited in the first column. `packs` counts
pack files produced; `/pack` is total minutes ÷ packs.

| Wave (log line) | packs | research | encoding | engine-val | revision | friction | **total** | **/pack** | **friction %** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Pack A s1 (`:70`) | 1 | 20 | 35 | 0 | 5 | 5 | 65 | 65.0 | 7.7% |
| Pack A s2a playtest (`:238`) | — | 0 | 0 | 0 | 0 | 40 | 40 | — | **100.0%** |
| Pack B (`:319`) | 1 | 25 | 30 | 0 | 5 | 5 | 65 | 65.0 | 7.7% |
| Pack C (`:417`) | 1 | 25 | 30 | 0 | 5 | 5 | 65 | 65.0 | 7.7% |
| Wave 2 openings (`:706-712`) | 6 | 67 | 107 | 0 | 2 | 20 | 196 | 32.7 | 10.2% |
| Wave 5a on-ramp (`:945`) | 4 | 35 | 95 | 25 | 10 | 30 | 195 | 48.8 | 15.4% |
| Wave 5b endgame (`:1010`) | 6 | 40 | 70 | 45 | 15 | 15 | 185 | 30.8 | 8.1% |
| Wave 4a openings (`:1147-1155`) | 8 | 72 | 120 | 0 | 3 | 12 | 207 | **25.9** | **5.8%** |
| Wave 5c mates (`:1215`) | 4 | 97 | 68 | 35 | 11 | 10 | 221 | 55.2 | 4.5% |
| B+N trajectory (`:1323`) | 2 | 25 | 70 | 55 | 20 | 25 | 195 | 97.5 | 12.8% |
| **TOTAL** | **33** | **406** | **625** | **160** | **76** | **167** | **1434** | **43.5** | **11.6%** |

Rows are in log order, which is landing order (the log is append-only). Wave 4a landed
after wave 5b despite its lower number.

**Category shares of the 1434 measured minutes:** encoding 43.6%, research 28.3%,
engine-validation 11.2%, tooling-friction 11.6%, revision 5.3%, review 0.0% `[P]`.

### 3.1 Three things the curve actually says

**(a) Per-pack cost is not converging downward; it is tracking the grounding bar.** The
cheapest wave (4a, 25.9 min/pack) is an opening wave with `engine-validation 0` whose own
entry says "no engine pass on any position (every pack's blockers say so)"
(`log.md:1205-1206`). The most expensive (B+N, 97.5 min/pack) is the only pack in the repo
whose every spine move, every deviation category and every learner decision node was
enumerated and queried against a tablebase (`log.md:1363-1371`). **Cost per pack is a
choice about evidence, not a property of the format.**

**(b) The learning curve is real but it lives in `revision` and validator pass rates, not
in the totals.** `revision` never exceeded 10.3% of a wave and averages 5.3% `[P]`.
First-run `pack-check` results improved from "one schema error, green on the second run"
(pack A, `log.md:71-75`) through 5/6 (wave 2, `log.md:718-720`) and 6/8 (wave 4a,
`log.md:1157-1159`) to 4/4, 6/6, 4/4 and 2/2 green in waves 5a, 5b, 5c and B+N
(`log.md:935`, `:1011`, `:1216`, `:1324`) `[P]`. Pack C's entry names the mechanism:
"the clearest signal yet that the validator's marginal value is falling as the author
learns the format" (`log.md:419-422`).

**(c) `research` spiked once and it was chess, not documentation.** Wave 5c's 97 research
minutes (43.9% of that wave) went to theoretical-mate technique and full legal-move
enumeration at every decision node — the pass that found the B+B "16 of 18 moves are
stalemate" fact (`log.md:1236-1242`). Batch-setup research (docs, priority data, emitter
runs) is separately itemised in waves 2 and 4a at 25 and 35 minutes and is a **per-wave**,
not per-pack, cost — which is why bigger waves are cheaper per pack.

---

## 4. Cost by pack type

A single average hides the finding. All `[P]`, same sources.

| Type | Waves | packs | min/pack | engine-val share | friction share |
|---|---|---:|---:|---:|---:|
| **Opening** (line / `follow_theory`) | 2 + 4a | 14 | **28.8** | **0%** | 7.9% |
| **Middlegame** (plan) | pack B | 1 | 65.0 | 0% | 7.7% |
| **Endgame, Syzygy-grounded** | 5b + 5c | 10 | **40.6** | **19.7%** | 6.2% |
| **Endgame, ungrounded** | pack C | 1 | 65.0 | 0% | 7.7% |
| **On-ramp** (guard packs + 24 emitted candidates) | 5a | 4 | 48.8 | 12.8% | 15.4% |
| **Trajectory** (multi-leg) | B+N | 2 | **97.5** | 28.2% | 12.8% |

**Openings are the cheap tier and the reason is mechanisation, not simplicity.** Wave 2
used machine-emitted skeletons for 5 of 6 packs and wave 4a for 8 of 8
(`log.md:713-717`, `:1103-1127`); the openings emitter turns an ECO/TSV row into a spine
skeleton, so `encoding` becomes prose-writing rather than move-tree construction. Both
waves also had zero engine validation and record blockers saying so — **the 28.8-minute
opening pack is a draft, not a publishable one.**

**Endgame packs are ~40% more expensive and they are the only genuinely grounded content.**
Waves 5b and 5c spent 80 minutes of engine-validation across ten packs querying
`tablebase.lichess.org` for every root, spine node and deviation category
(`log.md:1042-1049`, `:1259-1267`). That pass caught **seven authored chess errors before
they shipped** across the two waves — a drafted mainline move that queried as a draw, a
both-bishops-on-dark-squares root that queried as a draw, a mis-spliced mate, a 23-ply
finish over the format cap, two prose claims contradicted by enumeration, and an illegal
deviation caught by `pack-check` (`log.md:1050-1054`, `:1269-1277`) `[P]`. **This is the
best cost/benefit ratio in the corpus: ~8 minutes of engine time per pack buying seven
caught errors in ten packs.**

**Trajectories are the expensive tier, attested twice and quantified once.** B+N measured
195 minutes for one commissioned trajectory (its outcome sibling exists only because
`verify-draft` structurally cannot ground a trajectory pack — `log.md:1417-1430`). The
wave-3 trajectory entry carries **no minutes**, but states the same shape qualitatively:
~75% of the session went to authoring the two causal spines, and "this is the real
authoring cost of guided trajectories and it is an order of magnitude above per-phase
packs" (`log.md:824-828`) `[P]`. **The data supports "trajectories are the most expensive
type"; it does not support any specific multiple, and the "order of magnitude" phrase is
the author's estimate with no clock behind it.**

**On-ramp's 48.8 min/pack is an overstatement of the hand-authoring cost.** The wave's 195
minutes also produced 24 machine-emitted, sourcing-checked candidates
(`log.md:888-902`); the four hand-authored packs did not cost 48.8 minutes each. The
figure is reported as logged and should not be quoted as the on-ramp per-pack rate.

---

## 5. The tooling-friction verdict

**The build-tooling rule (`planning/content-era/plan.md:35-37`) does not fire. Friction is
11.6% corpus-wide, 9.2% excluding pack A, and never exceeded 15.4% in any wave after pack
A** `[P]`. The 43% figure in `design/BACKLOG.md:292` is superseded: it was one pack, and
one of that pack's two sessions was pure friction.

### 5.1 What fixed it — traceable to commits

| Tool | Landed | Evidence it moved the number |
|---|---|---|
| `make pack-check` / `pack-preview` | `a5c172b`, 2026-08-12 `[V]` | Pack A: "Tooling-friction was 5 minutes and would have been 45+ without the validator" — a self-reported counterfactual, `log.md:73-76` `[P]` |
| `candidate-emit` + `sourcing-check` (openings/explorer) | `a30b36c`, 2026-08-12 `[V]` | Wave 2 emitted 5/6 skeletons, wave 4a 8/8; wave 4a is the cheapest and lowest-friction wave measured (25.9 min/pack, 5.8%) `[P]` |
| `candidate-emit PIPELINE=position-seeds` | `608d80a`, 2026-08-12 `[V]` | Wave 5a's 24 candidates, `--engine-eval` at depth 22, all `sourcing-check` strict (`log.md:890-899`) `[P]` |
| `make shape-check` | `7cf2e32`, 2026-08-14 `[V]` | Shape-library waves; not a pack cost |
| `make verify-draft` (+ `perfect_tablebase`) | `2fd82be`, 2026-08-14 `[V]` | B+N earned `ledger_verified` with emitted sidecars on the first try (`log.md:1336-1339`) `[P]` |

Commit dates and Makefile target provenance checked directly with `git log -S` over
`Makefile` `[V]`.

### 5.2 The disqualifier: friction fell partly because the expensive activity stopped

**Pack A session 2's 40 minutes were 100% friction and 100% *runtime playtest and run
assembly*** — driving `POST /runs` and `/select-move` against the real server
(`log.md:236-272`). `design/BACKLOG.md:292` correctly identified that as the lever.

**No wave since has played a run.** Grepping the entire content-era log for
`pack-preview`, `play-through`, `POST /runs` or `playtest` returns nothing after the
2026-08-12 pack-A correction entry `[V]`. Every subsequent wave verified content with
`pack-check`, scratch chessops/python-chess walkers, and tablebase queries — all
*static* instruments. So:

- the ~9% steady-state friction is the friction of **drafting and statically validating**
  a pack, not of **producing a playable one**;
- the 40-minute run-assembly cost is **neither fixed-and-proven nor still-present** in the
  data — it is unmeasured since 2026-08-12. `rfc/archive/pack-optional-runs.md:591` shows
  the server now derives run `opponentPolicy` from the pack document, so the lever
  plausibly did fire `[P]`, but **no wave re-measured it and this dossier does not claim
  it did.**

### 5.3 What is still eating the friction time — the frictions RFC's justification

The residual friction is concentrated in one recurring item, and it is the item
`rfc/authoring-frictions.md` ranks first:

**Every wave re-built a throwaway chess-verification harness.** Pack B asked for it
(`log.md:333-337`), pack C paid an esbuild-bundling tax to run it at all
(`log.md:422-426`), wave 2 hit it a third time (`log.md:756-759`), wave 3 switched to
python-chess and recommended blessing it (`log.md:813-816`), and waves 5b, 5c and B+N each
installed python-chess into a scratchpad venv again — recorded as the **second, third and
fourth attestations** (`log.md:1093-1094`, `:1309-1310`, `:1466-1467`) `[P]`.
`rfc/authoring-frictions.md` lists "Tablebase walker blessed as repo tooling" as item 1 at
4 attestations `[V]`.

**Verdict for the RFC: justified on recurrence, not on magnitude.** The harness ritual is
attested four times independently, which is the repo's own bar; but it is buying back
single-digit percentages of a wave, not a 25%-threshold breach. The other seven items in
that RFC are format-expressiveness fixes, not cost fixes — the cost data neither supports
nor refutes them, and this dossier makes no claim about them.

**One friction item the data does flag as under-costed:** wave 5a's Node zstd failure on
the 304MB puzzle dump (`log.md:973-980`) made the documented streaming path unusable and
forced a CLI decompress. That is a reproducibility defect sitting inside a 30-minute
friction figure, and it is not in the frictions RFC's eight items `[V]`.

---

## 6. What the other decision rules say

`planning/content-era/plan.md:35-39` defines three rules. Two fire ambiguously and are
worth stating rather than leaving implied:

- **"`encoding` dominating means the format is wrong."** Encoding **is** the largest
  category — 43.6% corpus-wide, 58.0% in wave 4a `[P]`. But the rule's premise does not
  hold here: wave 5a states "encoding dominated by deviation notes and per-pack provenance
  honesty, not by format fights — the schema absorbed all four packs without a single
  validation battle" (`log.md:948-950`), and wave 3 reports the `legs` contract "held real
  content without a single schema fight" (`log.md:873-874`) `[P]`. **Encoding-dominant here
  means prose-dominant. The rule as written would misfire; the format is not the
  bottleneck, writing honest chess prose is.** This is a correction to the instrument, not
  to the format.
- **"`revision` dominating means objectives are being written after engine analysis."**
  Revision is 5.3% and wave 5b explicitly confirms the discipline held: "Objectives were
  written before the engine pass per the authoring rule; the pass then disciplined the
  lines, which is the rule working" (`log.md:1052-1054`) `[P]`. **Rule satisfied.**
- **`planning/content-era/plan.md:56-58`'s prediction that the pipeline total would be
  "dominated in practice by `owner-review` + `revision`" is falsified by the data.** Those
  two categories together are 5.3% of 1434 measured minutes. The pipeline is dominated by
  `encoding` + `research` at 71.9% `[P]`.

---

## 7. What is not measured, and therefore not claimed

1. **The cost of grounding an opening pack.** Fifteen opening packs have `engine-validation
   0` and carry `graduationBlockers` saying no engine has seen any position
   (`log.md:761-763`, `:1205-1207`) `[V]`. Waves 5b/5c suggest ~8–9 minutes per pack for a
   tablebase-range endgame; an opening pack needs a fixed-depth Stockfish pass over a
   branching spine, which is a different and unmeasured shape of work. **The 28.8-minute
   opening pack has an unpaid bill of unknown size.**
2. **Runtime playtest cost since 2026-08-12** (§5.2).
3. **Any human clock.** `owner-review` is 0 by construction and the review workflow is
   retired (`plan.md:60-66`). If a published tier ever needs a human, this entire dossier
   measures the wrong pipeline.
4. **The two wave-3 trajectory packs**, which have no minutes (§2.2).
5. **Cost at scale.** 33 packs is a corpus, not a catalogue. At the measured mean, 100
   packs is ~72 agent-hours `[M]` — arithmetic on a self-reported mean, offered as an order
   of magnitude only. `design/04-content-architecture.md:326-328`'s stage 5 ("the long tail
   via study-import and session-distillation tooling rather than hand authoring") has not
   been started, so the long-tail rate is entirely unmeasured.

---

## 8. What would change the verdict

K10 would move back toward firing if any of these lands:

| Trigger | Why it would change the verdict |
|---|---|
| A grounding pass over the 15 opening packs costs more than ~30 min/pack | Doubles the real cost of the cheap tier and makes the corpus mean a fiction |
| A human review clock is reintroduced at any tier | The pipeline this dossier measures is the drafting half only; §2.3 |
| Runtime playtest is re-measured and still costs ~40 min/pack | Restores a friction share near the 25% threshold and revives the playtest-harness lever |
| Trajectory content becomes the main line rather than the exception | 97.5 min/pack against 28.8 for openings; a trajectory-heavy catalogue is a different cost regime |
| Stage 5 (import/distillation) proves unable to produce packs faster than hand authoring | The long tail then costs 43.5 min/pack forever, and catalogue size becomes a budget question again |

Conversely, K10 would be **closed as settled-no** if a grounding pass over the openings
lands at or under the endgame rate and a playtest re-measurement confirms the run-assembly
lever fired.

---

## 9. What this feeds

- **K10** — evidence against firing; see §1 and the proposed status in the report.
- **C6** ("repeatable workflow") — nine waves ran the same documented loop
  (emit or hand-build → `pack-check` → machine-verify the chess → record blockers) and it
  produced 33 packs with a falling first-run error rate (§3.1b). The word "reviewed" in
  C6's text is dead (C1 withdrawn 2026-08-13, `gates.md:98`); on the surviving half,
  **C6 has evidence.**
- **K7** ("authors cannot reliably encode timing and structure without excessive custom
  code") — this dossier's data is **partly relevant and is not a verdict on K7**. Two
  observations worth carrying: *structure* was encodable (structural leg boundaries,
  `king_opposition`, shape signatures — `log.md:1341-1351`, `:1085-1092`), while *timing*
  was not, attested independently by pack A (`log.md:84-91`) and pack C (`log.md:492-496`);
  and "custom code" is literal — every wave wrote a scratch harness (§5.3). K7 remains
  open and needs its own pass.
- **`rfc/authoring-frictions.md`** — §5.3: justified on recurrence, not on threshold breach.
- **`design/BACKLOG.md:292`** — the "105 min, 43% friction, no verdict supportable"
  framing is superseded by §3 and §5.

---

## Appendix — reproducing the arithmetic

Every figure in §3 and §4 is a sum over the cost lines at `planning/content-era/log.md`
lines 70, 238, 319, 417, 706–712, 945, 1010, 1147–1155, 1215 and 1323. Line 624 (the
middlegame shape-library wave: research 20 · encoding 45 · engine-validation 0 ·
revision 10 · friction 10) is **excluded** from all per-pack figures: shape entries are not
packs. Pack counts per wave are taken from each entry's own "Landed" list and were checked
against `content/drafts/` by filename `[V]`.
