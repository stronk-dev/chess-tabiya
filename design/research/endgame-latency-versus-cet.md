# Endgame latency and usability versus Chess Endgame Training (K9's missing arm)

- **Feeds:** Q-04 (`planning/research-queue.md` §1, §8) → **K9** · **C7** · [[D488]]
- **Session 1 — 2026-08-16**, macOS 15 / Apple silicon, Chromium via Playwright, against commit
  `4a6ad91` extracted to a clean tree outside the repo. Instrument:
  `tools/k9-endgame-latency-harness/` (disposable, labelled, README states why the shipped
  harness could not be used). **§§0–9 below are that session and are not edited.**
- **Session 2 — 2026-08-17 (the re-run)**, same machine, against commit **`451bb44`**, after the
  D507 layout fix (`442b8a3`, 2026-08-17). **§10 is the re-run and supersedes §0.3, §6 and §8's
  K9 verdict where they disagree.** §§1–5, §7 and §9 stand as written. Read §10 before quoting
  any occlusion or playability number from §6.
- **Provenance:** `[V]` unless marked. Every number in §§0–9 was produced in session 1 and every
  number in §10 was produced in session 2; the commands are in the harness README. CET's numbers
  are `[P]` — inherited from `design/research/teardown-cet.md` (2026-08-11) — except the one CET
  figure session 1 re-measured itself, which is `[V]`.
- **Why session 2 exists:** `planning/exploration/gates.md` was escalated to
  `📊 EVIDENCE TOWARD FIRING` on session 1's usability numbers, and the defect those numbers
  named was then repaired. Escalated kill-criterion evidence whose cause has been fixed and
  which nobody has re-derived is the [[D368]] family on the most consequential surface in the
  repo; law 6 cuts both ways, so the favourable direction is re-run as carefully as the
  unfavourable one.

---

## 0. The finding that outranks the stopwatch

> **2026-08-17 re-run notice.** Point 3 below is **repaired at HEAD** and point 4 is **obsolete**.
> The board is now 0/64 occluded at rest on all six packs at all five viewports, and production
> now serves all six. **The criterion still does not clear**, for a different and pre-existing
> cause. Points 1 and 2 are re-confirmed. §10.

**K9 fires — on its usability clause, not its speed clause, and the two answers point in
opposite directions.** Stated plainly, because law 6 says evidence against the thesis is the job
working:

1. **Every published latency budget is met, comfortably.** Board ready 37.9 ms median, rewind
   11.9 ms median, a full `perfect_tablebase` opponent selection against real Syzygy 33.0 ms
   median, cached opponent reply 0.3 ms. Nothing is near a tripwire. `[V]` §3, §4.
2. **"Materially faster than CET" is nonetheless *not* established, and this pass is evidence
   against it.** The decisive endgame instrument is the same for both products — the Lichess
   Syzygy endpoint — and measured back to back from this machine today, CET's endpoint and ours
   are the same speed: median **30.8 ms** vs **30.1 ms** `[V]` §5. The 80–224 ms in the CET
   teardown is that machine on that day, not a slower instrument. There is no speed gap to win
   on the shared call.
3. **Our endgame mode cannot be played at all.** On 5 of the 6 served endgame packs at
   1440×1000, the authored first move cannot be made by drag or by click, because the board's
   lower ranks are covered by the timeline and the objective block; at 1280×720 and 1366×768 —
   one of them a viewport the shipped browser suite itself tests — **all 64 squares of all 6
   packs** are unhittable. `[V]` §6. CET, by the teardown, is playable and fast.
4. **And in production none of this is reachable anyway.** `make up` at HEAD serves **one pack,
   the schema example fixture, phase `cross_phase`** — zero endgame packs — while
   `/capabilities` advertises `perfect_tablebase`, which returns **HTTP 503 for every position**
   because `ENGINE_MODE=mock` installs an empty `FixtureTablebaseSource`. `[V]` §2.

So the honest summary is: **we are not slower than CET; we are not faster than CET on the call
that matters; and where CET has a working endgame trainer we currently have a surface a learner
cannot move a piece on.** The speed half of K9 is answered and does not fire. The usability half
fires on measured evidence, and its cause is a fixable layout defect rather than a refutation of
the thesis — which is the owner's call to make, not this dossier's.

**What a stopwatch cannot answer, and this dossier does not claim to have answered:** §7.

---

## 1. What K9 asks, and what half of it a measurement can reach

K9: *"Endgame mode is not materially faster or more usable than Chess Endgame Training"*
(`planning/exploration/gates.md` K9, status `open`, evidence cell `—`) `[V]`.

`design/02-product-shape.md:191-196` records what the budgets are for, and it is a warning
against exactly the report this could have been: *"they exist because the owner's field report
was that Chess Endgame Training felt slow… The criterion is perceptual and comparative… and a
stopwatch cannot answer it. The numbers are a tripwire for when to go look, not the thing being
measured."* `[V]`

This pass therefore treats the budgets as tripwires and reports three things separately: which
tripwires were crossed (none), what the comparison against CET actually shows on a common task
(parity), and what happened when the instrument went to *use* the surface (it could not).

The **two-axis ruling** (`design/02-product-shape.md:165-180`, owner, 2026-08-15) is respected
throughout: everything in §3 is **per instrument call**, and where a selection is more than one
call that is said explicitly. For `perfect_tablebase` the two coincide — the selector probes the
tablebase exactly once per selection (`apps/server/src/opponent-selector.ts:642`) `[V]` — so its
per-call figure *is* its per-selection figure.

---

## 2. What is actually running: two configurations, and only one of them has an endgame

Measured against HEAD as committed, booted from a clean extraction of `4a6ad91`.

### 2a. Production — `make up` defaults

| Probe | Result |
|---|---|
| `GET /packs` | **1 pack**: `najdorf-transition-schema-example`, `reviewStatus: schema_example`, `phase: cross_phase` `[V]` |
| Endgame packs served | **0** `[V]` |
| `GET /capabilities` → `policyModes` | `human_common, strong_engine, theory_strict, perfect_tablebase, practical_resistance` `[V]` |
| `POST /select-move` mode `perfect_tablebase` | **HTTP 503** `TABLEBASE_UNAVAILABLE — "No fixture tablebase position"` `[V]` |
| `POST /select-move` mode `practical_resistance` | **HTTP 503**, same message `[V]` |

The cause is mechanical and worth stating exactly: `PackRegistry.loadDefault` builds production
paths from `schemas/drill_pack.example.json` plus `content/packs/`, and `content/packs/` contains
only `.gitkeep` (`apps/server/src/pack-registry.ts:314-341`) `[V]`; and
`apps/server/src/application.ts:301-303` wires `new FixtureTablebaseSource()` whenever
`engineMode === "mock"`, whose default fixture map is empty
(`apps/server/src/tablebase.ts`, `FixtureTablebaseSource` constructor default `{}`) `[V]`.

This confirms [[D481]] hands-on and adds a second half to it: **it is not only that the corpus
is invisible; the endgame opponent the endgame content declares is advertised and non-functional
in the shipped default.** Two of the corpus's endgame packs — `mate-bishop-knight` and
`trajectory-mate-bishop-knight` — declare `opponentPolicy.mode: "perfect_tablebase"` `[V]`, so
even if the [[D502]] draft-shelf ruling ships them, they land on a mode that answers 503.

The owner's 2026-08-16 ruling (`271e031`) that all 56 drafts reach learners behind an
"unreviewed draft" badge had **not** reached code at the time of this measurement `[V]` — no
change to `pack-registry.ts`, `application.ts` or `compose.yaml` in that commit.

### 2b. Development plus a real tablebase — the only configuration with an endgame

Six endgame packs served (`lucena-bridge-convert`, `philidor-third-rank-hold`,
`mate-bishop-knight`, `mate-k-r-technique`, `pawn-opposition-convert`,
`queen-vs-pawn-seventh-convert`), plus the schema-example fixture. The shipped
`LichessTablebaseSource` is injected so `perfect_tablebase` reaches real Syzygy.

**The opponent engine is still a mock.** Under `make up` defaults every evidence provider is
mocked, and this pass did not run the Maia container. So every `human_common` number below is
`mock-opponent` (`engines: [{id: "mock-opponent", …}]` in `/capabilities` `[V]`) and **is not a
latency finding about the real opponent**. The tablebase numbers are the only opponent numbers
here produced by a real instrument.

---

## 3. Per-instrument-call distributions — the API arm

`tools/k9-endgame-latency-harness/api-arm.mjs`, over the shipped HTTP routes on loopback,
against the six endgame packs and 164 distinct ≤7-piece FENs walked from their spines with the
shipped `apps/server/src/fen-walk.ts`. Percentile convention copied from the shipped
`apps/server/src/latency.test.ts:114-120` (median = `sorted[floor(n/2)]`,
p95 = `sorted[ceil(n·0.95)−1]`) so these are comparable to it. All values in ms. `[V]`

| Operation | n | min | **median** | **p95** | max | Budget |
|---|---|---|---|---|---|---|
| `GET /packs` (library) | 60 | 0.3 | **0.5** | **0.9** | 1.6 | — |
| `GET /packs/:id` (projection) | 60 | 0.3 | **0.4** | **0.6** | 1.1 | — |
| `POST /runs` (restart, server half) | 60 | 0.6 | **0.8** | **1.2** | 3.7 | — |
| `GET /runs/:id/graph` (projection) | 60 | 0.3 | **0.3** | **0.4** | 1.0 | — |
| `POST /runs/:id/moves` (commit) | 60 | 1.5 | **3.0** | **4.0** | 14.4 | — |
| `POST /runs/:id/rewind` (= branch switch) | 60 | 0.9 | **2.5** | **3.5** | 4.6 | rewind <100 ✅ |
| `select-move` `human_common` **mock**, first probe | 58 | 0.3 | **0.4** | **0.5** | 1.3 | mocked — no finding |
| `select-move` `human_common` **mock**, repeat | 58 | 0.2 | **0.3** | **0.4** | 0.4 | cached ≈ instant ✅ |
| `select-move` `perfect_tablebase` **real Syzygy**, first probe | 58 | 0.5 | **33.0** | **104.9** | 132.8 | uncached <500 ✅ |
| — of which left the process (≥5 ms) | 57 | 28.0 | **33.0** | **104.9** | 132.8 | |
| `select-move` `perfect_tablebase`, repeat | 58 | 0.3 | **0.5** | **2.2** | 3.3 | cached ≈ instant ✅ |

Notes that keep these honest:

- **One "first probe" was a process-cache hit, not a network call.** `LichessTablebaseSource`
  keys its cache on `transposeKey`, so mirrored/transposed corpus positions collapse onto one
  entry (`apps/server/src/tablebase.ts`, `probe()`) `[V]`. The row above separates the 57 that
  demonstrably left the process.
- **Successful tablebase results are cached with `expiresAt: Number.POSITIVE_INFINITY`** `[V]`.
  So a position costs ~33 ms once per server lifetime and ~0.5 ms thereafter. That is good for
  the learner and it means the 33 ms figure is a **first-visit** cost, not a per-move cost.
- **Two of 60 FENs failed in both modes**, and they failed differently. Both are checkmate
  positions from `mate-bishop-knight` (`7k/8/5BKN/8/8/8/8/8 b - - 39 20` and
  `2k5/2B5/2K3N1/8/8/8/8/8 b - - 13 7`). `perfect_tablebase` returned a **typed 503**
  (`TABLEBASE_UNAVAILABLE — "Tablebase returned no category-preserving move"`); `human_common`
  returned **HTTP 500 `INTERNAL_ERROR`** `[V]`. A terminal position reaching the selector is an
  edge the client normally guards, but an untyped 500 on a legal, reachable corpus position is a
  defect (proposed as D505).

---

## 4. Perceived, in-browser distributions — the browser arm

`tools/k9-endgame-latency-harness/browser-arm.spec.ts`, Chromium at 1440×1000, timed with
`performance.now()` inside the page from the gesture to the DOM state the learner waits for.
Opponent is the **mock**. All values in ms. `[V]`

| Operation | n | min | **median** | **p95** | max | Budget |
|---|---|---|---|---|---|---|
| Cold: fresh context → registered → library rendered | 1 | — | **218** | — | — | — |
| **Restart: library click → board + timeline ready** | 20 | 35.2 | **37.9** | **54.5** | 810.7 | board ready <250 warm ✅ |
| Reload of an existing run URL (full app boot, warm HTTP cache) | 10 | 38 | **55** | **57** | 57 | — |
| **Your move → opponent's reply on the board** | 10 | 124.3 | **128.0** | **133.7** | 133.7 | — |
| **Rewind (preview + confirm)** | 10 | 9.1 | **11.9** | **46.2** | 46.2 | rewind <100 ✅ |

- The 810.7 ms maximum on restart is the **first** sample, before the SPA is warm; every
  subsequent sample is 35–55 ms. Warm and cold are separated exactly this way and nowhere else.
- The opponent-reply window **includes the drag gesture** (eight synthetic mouse-move steps) as
  well as commit → select → append → render. The server-side pieces of that chain are 3.0 ms and
  0.4 ms medians (§3), so the great majority of the 128 ms is client-side work and input
  simulation. It is an upper bound on the perceived reply, not a server figure.
- **Branch switch has no separate browser number, deliberately.** `switchBranch` *is* rewind —
  `apps/web/src/lib/session-controller.ts:428-429` is `await this.rewind({ nodeId: leafNodeId })`
  `[V]` — so the rewind row covers the operation, which is the same collapse
  `design/02-product-shape.md:186-188` already records. An independent DOM measurement was
  attempted and abandoned: with two branches whose leaves differed, clicking
  *"Switch to branch 1: main"* left the rail's active branch on the other branch, so the switch
  was not observable. That is reported as an open question (proposed D508), not as a latency
  number.

### What this replaces

`docs/app-shell.md:213-217` records *"board-ready at 68 ms, rewind at 34 ms, branch switching at
51.2 ms, uncached mock reply at 1.4 ms, and cached mock reply at 0.9 ms"* `[V]`. Those are **one
sample each**, on the Najdorf schema-example opening pack — `tests/browser/drill.spec.ts`
records the envelope exactly once per operation `[V]`. The distributions above are the endgame
surface and are the first ones with an n. They agree with the shipped envelope in magnitude,
which is the useful thing to be able to say about it.

---

## 5. The CET comparison, controlled for network

`design/research/teardown-cet.md` (2026-08-11, `[P]` here) records: cold app load
DOMContentLoaded 593 ms / load 672 ms; tablebase API **80–224 ms per call**; first opponent reply
~2.1 s ("app-side pacing/animation — cause not identified"); subsequent replies ~150–300 ms;
move-list navigation instant. And its own verdict: *"The 'slow, poor UX' field report did not
reproduce on desktop… The app is fast once warm."*

Those were measured on a different machine, network and day, so comparing them to today's
numbers would not be a comparison. This pass therefore re-measured **CET's own endpoint** —
`tablebase.lichess.ovh`, the host observed in CET's network log — alongside ours,
`tablebase.lichess.org/standard`, on the same 40 corpus FENs, back to back, from this machine
(`cet-endpoint-arm.mjs`). `[V]`

| Endpoint | n | min | **median** | **p95** | max |
|---|---|---|---|---|---|
| `tablebase.lichess.ovh` (CET's) | 40 | 28.6 | **30.8** | 42.3 | 167.8 |
| `tablebase.lichess.org` (ours) | 40 | 27.2 | **30.1** | 33.4 | 98.0 |

**The instrument is not a differentiator.** Both products pay ~30 ms for a Syzygy probe on this
network. Our `perfect_tablebase` *selection* costs 33.0 ms median — about 3 ms of our own work
on top of the shared call — so on the endgame task's decisive instrument, we are at parity plus
a rounding error, and CET's 80–224 ms is explained by its network, not by its architecture.

Where a real gap may exist is CET's **~2.1 s first reply per position**, against our 128 ms
median reply. But the CET figure is a single perceived observation whose cause the teardown
explicitly did not identify, and ours is against a mock opponent. Calling that a material
advantage today would be exactly the overclaim `design/02` warns about. It is the most promising
place to look for one.

**This confirms rather than contradicts the design tier — no `DESIGN-GAP` is raised.**
`teardown-cet.md:60-62` already concluded *"K9's bar moves: our edge cannot be raw speed (CET is
already fast on desktop)"*; that was one session's impression and it is now a controlled
measurement. K9's wording — *"materially faster **or** more usable"* — means
the criterion can still be cleared on usability alone, and §6 is what that half currently looks
like.

---

## 6. The measurement that stopped being about milliseconds

> **2026-08-17 re-run notice — this whole section is a 2026-08-16 measurement of `4a6ad91` and
> every number in it is superseded by §10.** The resting-state occlusion it reports is gone; the
> `assertRunViewport` fixture gap it reports is closed; and one of its own readings — the single
> "playable" pack — turns out to have been an artefact of the probe aiming where the defect
> decoded. Kept unedited as the before-half of the comparison.

Before latency on the endgame surface could be sampled, the instrument had to make a move. It
could not. `occlusion-probe.mjs` hit-tests all 64 square centres per pack per viewport and
reports which are covered and by what; `playability-probe.mjs` then attempts the pack's own
authored first move by drag and by click. `[V]`

### 6a. Squares a learner cannot reach

| Viewport | Najdorf (schema example) | Six endgame packs |
|---|---|---|
| 1920×1080 | **0 / 64** occluded | **16–48 / 64** occluded, on every pack |
| **1440×1000** | **0 / 64** | **32–64 / 64** |
| **1440×900** — a viewport the shipped suite tests | **0 / 64** | **32 / 64** on one pack, **64 / 64** on the other five |
| 1366×768 | **0 / 64** | **64 / 64** on all six; board overflows the fold by 30–149 px |
| **1280×720** — a viewport the shipped suite tests | **0 / 64** | **64 / 64** on all six; overflow up to 197 px |

The occluding elements are named by the probe: `section.timeline`, `ol` and
`div.timeline-heading` (the Active-line panel), `section.outcome-context`, `section.position-column`,
and at 1366×768 the viewport edge itself. `[V]`

At 1440×1000 **every one of the six endgame packs has pieces of the side to move standing on
occluded squares** — for `lucena-bridge-convert`, all five pieces on the board. `[V]`

### 6b. The move cannot be made

At 1440×1000, attempting each pack's authored first move: **5 of 6 endgame packs do not move at
all**, by drag or by click. The exception is `queen-vs-pawn-seventh-convert`, whose queen stands
on e4 — high enough to be clickable — and whose first move went through and drew the opponent's
reply (0 plies → 2 plies). `[V]` Every interactive number in §4 was taken on that one pack for
this reason.

There is no workaround: `scrollIntoViewIfNeeded()` moved the board by 0 px, and `.drill-region`
reports `scrollHeight === clientHeight === 944` — the region does not scroll. `[V]`

### 6c. The shipped invariant is correct and is never run against this content

`tests/browser/drill.spec.ts:assertRunViewport` asserts the board sits inside `.position-column`
and that its bottom is at or above the timeline's top `[V]`. Measured:

| Pack | board bottom | timeline top | invariant |
|---|---|---|---|
| `najdorf-transition-schema-example` | 799 | 854 | **passes** |
| `lucena-bridge-convert` | 942 | 854 | fails |
| `mate-bishop-knight` | 962 | 854 | fails |
| `mate-k-r-technique` | 1002 | 854 | fails (also below the 1000 px fold) |
| `pawn-opposition-convert` | 942 | 854 | fails |
| `philidor-third-rank-hold` | 902 | 854 | fails |
| `queen-vs-pawn-seventh-convert` | 942 | 854 | fails |

`.position-column` ends at y=838 in every case, so the board overflows its own container by
64–164 px on all six. `[V]`

**The assertion would catch this. It never sees it.** Its three desktop projections —
1280×720, 1440×900, 768×1024 — run on the **schema-example** pack
(`tests/browser/drill.spec.ts:886-900`), and its compact projections run on a **Just Play** run,
which has no pack and therefore no authored objective at all
(`tests/browser/drill.spec.ts:941-956`) `[V]`. The suite's own draft fixture,
`schemas/fixtures/drill-pack/terminal-outcome.browser.json` loaded through
`playwright.config.ts`, carries a **64-character** objective summary `[V]`. Every surface the
invariant is evaluated against is one whose content cannot trigger the defect — and at the two
desktop viewports it does test, all six endgame packs are 32–64/64 occluded. Same shape as
[[D481]]: a guard that is real, correct, and evaluated only against content that cannot fail
it.

**The trigger is authored content length, and the numbers are small.** The objective summary is
rendered at display size. The schema-example pack's is **68 characters**; the six endgame packs'
are **277, 322, 326, 329, 382 and 444** `[V]`. At 444 characters (`mate-k-r-technique`) the prose
fills the column past y≈650 and the board is pushed below the fold entirely. The board does not
shrink to compensate — it is pushed down, then overlapped, and `.position-column` does not clip
it, so it is drawn over neighbouring regions rather than contained by its own.

**This corrects a living document.** `planning/app-reality-check.md:353-357` (2026-08-16) reports
noticing exactly this and retracting it: *"In full-page screenshots the board appears clipped and
overlapped by the structural-reading panel. **It is not.** I measured board geometry against the
viewport at 1440×900, 1280×800 and 390×844: no clipping, no overlap at any of the three… **No
layout defect here.**"* `[V]` That audit ran against the app as `make up` serves it — the
schema-example pack — where the retraction is correct. On endgame content it is wrong at all five
viewports probed here, by hit test and by attempted move. The audit's own method note was sound; its corpus
was the single pack production serves.

---

## 7. What a stopwatch cannot answer here

Stated explicitly, because the brief and `design/02` both demand it.

1. **Whether it *feels* sluggish.** K9's origin is a felt impression of another product. Nothing
   in §3–§5 speaks to that. 37.9 ms and 128 ms are inside every budget; whether a person
   experiences the loop as immediate, and whether the ~2.1 s CET first reply is what the owner
   actually felt, needs the owner in a session. **This half of K9 is untouched by this pass.**
2. **Whether it is *more usable*, in the sense the criterion means.** §6 answers a much cruder
   question — can a move be made at all — and answers it no. That is a floor, not the criterion.
   Above that floor, "more usable" is comparative and experiential: preserved attempts, branch
   comparison and why-feedback against CET's objective-state banners
   (`teardown-cet.md` §Behaviors) — none of which a timer can weigh.
3. **Anything about the real opponent.** Every `human_common` figure here is a mock. Uncached
   Maia (<500 ms) is **unmeasured in this pass**; the closest measured figure remains
   `design/research/practical-difficulty-outside-tablebase.md:441` — Maia at **144 ms median,
   335 ms max per call** `[P]`. Shallow Stockfish feedback (<500 ms) is likewise unmeasured here.
4. **Mobile.** All measurements are desktop Chromium. `design/research/mobile-scope.md` holds the
   compact-tier findings; §6a's 1366×768 result suggests the endgame overlap will be worse, not
   better, on smaller viewports, but that is an inference, not a measurement `[M]`.
5. **Unaided task completion**, which Q-04 names alongside the two latency figures. Nobody
   completed an endgame drill in this pass, because on five of six packs nobody could start one.

---

## 8. Verdicts

### K9 — *"Endgame mode is not materially faster or more usable than Chess Endgame Training"*

> **2026-08-17: the recommended status is unchanged and the reason is not.** See §10.8 for the
> replacement wording. The layout defect named below is fixed; the criterion still does not
> clear.

**Fires, on the usability clause. Does not fire on the speed clause.** Recommended gate status:
**📊 evidence toward firing**, not `fired`, for one reason that the owner should weigh rather
than this dossier: the usability failure is a **layout defect of known shape at a known place**,
not a property of the product idea. The speed clause is now settled enough to stop asking:
neither product is materially faster than the other on the endgame task's decisive call, so K9
cannot be cleared on speed and must be cleared on usability.

### C7 — *"Endgame restart and response latency feel effectively instant"*

**Stays `unmet`, but its blocker changes.** It was unmet for want of an instrument ([[D488]]);
the instrument now exists and the numbers are inside every budget (restart 37.9 ms median,
reply 128 ms median, rewind 11.9 ms median). It remains unmet because the verb is *feel*, and
(a) no person has felt it and (b) on five of six endgame packs there is nothing to feel. Two
named residuals, in order: fix the layout, then run one owner session.

### The budgets

| Budget (`design/02-product-shape.md:159-163`) | Measured | Verdict |
|---|---|---|
| Board ready <250 ms warm | 37.9 median / 54.5 p95 | met `[V]` |
| Branch switch: worry 100, intervene 200 | 11.9 median / 46.2 p95 (as rewind) | below the worry line `[V]` |
| Rewind <100 ms | 11.9 browser / 2.5 server | met `[V]` |
| Cached opponent move perceived-instant | 0.3–0.5 ms | met `[V]` |
| Uncached Maia <500 ms | **not measured** (mock only) | open |
| Shallow Stockfish feedback <500 ms | **not measured** | open |
| `perfect_tablebase` selection (1 call, per-call = per-selection) | 33.0 median / 104.9 p95 | met `[V]` |

---

## 9. Method notes and limitations

- **The working tree was not the commit.** Throughout this pass a concurrent session held
  uncommitted changes to `schemas/drill_pack.schema.json`, `packages/schema`,
  `apps/server/src/pack-validation.ts` and five `sourcing/` files. Under that tree **55 of 56
  draft packs fail validation**, `NODE_ENV=development` throws at boot, `make test-browser`
  cannot start its web server, and a `make up` rebuild during this pass produced a container that
  crash-loops on `GRADUATION_RULING_UNCITED` `[V]` — the local `chess-tabiya-server-1` container
  is in that state as this dossier lands, and recovers by rebuilding from a clean tree. **None of that is reported as a product finding**: every
  measurement above was taken against `4a6ad91` extracted with `git archive` into a tree whose
  `@chess-tabiya/*` links point at that same extraction, so no in-flight source was bundled. At
  HEAD, `pack-check` reports **0 errors** on the endgame packs used here `[V]`.
- **Why the shipped harness was not used.** Two reasons, both above: it could not start, and its
  latency envelope is one sample per operation on an opening pack. Where the shipped instrument
  *could* be reused it was — `apps/server/src/fen-walk.ts` produced the FEN set, and the
  percentile convention is copied from `apps/server/src/latency.test.ts`.
- **The corpus was reached by a route production does not use.** The six endgame packs were
  served by placing them in the extracted tree's `content/drafts/` and booting with
  `NODE_ENV=development`. Production does not do this and, per [[D481]], must not: it would serve
  unresolved graduation blockers. The packs themselves are byte-identical to the repo's.
- **Single machine, single network, single session.** Loopback HTTP removes network from §3 and
  §4 entirely; §5 is the only arm where the internet is in the path, and it is the arm where the
  control matters, which is why it was run back to back.
- **n is small on four rows** (n=10 for reload, reply, rewind; n=1 for cold load). Those are
  marked and should not be read as p95s in any strong sense.
- **Nothing here grades a chess move** (law 8). The only chess judgements used are the
  tablebase's own categories and the packs' own authored first moves.

---

## 10. Proposed ledger rows — **not written** (ids from D503; D502 is in use)

- **D503 🐞** — *The endgame board is unreachable: 5 of 6 served endgame packs cannot receive
  their own authored first move at 1440×1000, and 6 of 6 have all 64 squares occluded at
  1280×720 — a viewport the shipped browser suite itself tests.* At 1440×1000 the board overflows
  `.position-column` by 64–164 px on all six and is drawn under the timeline.
  `assertRunViewport` in `tests/browser/drill.spec.ts` **would fail on all six** and never sees
  them, because its desktop projections run on the schema-example pack and its compact ones on a
  Just Play run with no pack at all. Corrects
  `planning/app-reality-check.md` §6.8, which retracted this exact suspicion after measuring only
  the pack production serves. Trigger is authored objective length rendered at display size.
- **D504 🐞** — *`make up` advertises two opponent modes it cannot serve.* `/capabilities` lists
  `perfect_tablebase` and `practical_resistance`; both return HTTP 503 for every position because
  `ENGINE_MODE=mock` installs an empty `FixtureTablebaseSource`
  (`application.ts:301-303`). Two corpus packs declare `perfect_tablebase` as their opponent, so
  the [[D502]] draft shelf would ship content onto a mode that answers 503. Sibling of [[D481]].
- **D505 🐞** — *`POST /select-move` returns HTTP 500 `INTERNAL_ERROR` on a checkmate position
  under `human_common`*, where `perfect_tablebase` returns a typed 503 on the same FEN. 2 of 60
  corpus positions; both are terminal nodes of `mate-bishop-knight`.
- **D506 💡** — *K9 cannot be cleared on speed.* CET's tablebase endpoint and ours are the same
  speed from one machine on one day (30.8 vs 30.1 ms median, n=40 each), so the 80–224 ms in
  `teardown-cet.md` is that network, not that architecture. The speed clause is answered; the
  criterion now turns entirely on usability, and the one measured place a real gap may exist is
  CET's ~2.1 s first reply against our 128 ms.
- **D507 🐞** — *The published latency envelope is n=1 per operation on an opening pack.*
  `docs/app-shell.md:213-217` states five figures as if measured; `tests/browser/drill.spec.ts`
  takes each once. Distributions now exist (§3, §4) and agree in magnitude; the doc should say
  which are single samples.
- **D508 💡** — *Branch switch may be unobservable when two branches share a node.* Clicking
  *"Switch to branch 1: main"* left the rail's active branch on the other branch in a two-branch
  run. Either a documented no-op or a defect; it is the reason this dossier has no independent
  browser figure for the branch-switch budget.
- **D509 💡** — *Tablebase results are cached forever* (`expiresAt: POSITIVE_INFINITY`), so the
  33 ms first-probe cost is once per position per server lifetime. Worth stating wherever the
  <500 ms uncached budget is quoted, because it makes the budget a first-visit budget.

---

# 10. THE RE-RUN — 2026-08-17, commit `451bb44`

Everything from here down is session 2. Session 1's numbers are above and are not edited.

- **Commit under measurement:** `451bb44` (*"queue: job A — the content work that survived the
  D518 correction"*). The D507 fix is `442b8a3` (*"fix(web): keep endgame boards playable"*,
  2026-08-17), three commits earlier `[V]`.
- **How it was isolated.** The tree was busy again — an implementer held uncommitted
  `feedback-delivery` work across `apps/web/src/lib/`, `apps/server/src/` and
  `packages/runtime/src/` `[V]`. Session 1's `make-headtree.sh` extracts HEAD with `git archive`
  but then **copies the repo's `apps/web/dist`**, which is whatever the working tree last built —
  and the D507 fix lives in `apps/web/src/lib/DrillScreen.svelte`, so reusing that bundle would
  have measured the implementer's uncommitted CSS. `rerun-2026-08-17.sh` is session 1's script
  with that one correction: it runs `vite build` **inside the extracted tree** and asserts the
  D507 clamp is present in the built CSS before the server starts `[V]`. Nothing was staged; the
  repo was read, never written except this dossier and the harness directory.
- **Configuration.** Identical to §2b: the six endgame drafts served from the extracted tree,
  `NODE_ENV=development ENGINE_MODE=mock K9_REAL_TABLEBASE=1`, mock opponent, real Syzygy. §10.7
  additionally measures the **shipped production default**, which has changed since session 1.
- **What was re-run and what was carried forward.** Re-run: the whole usability arm (§10.1–§10.5)
  and the **browser** latency arm (§10.6), because the layout changed under it. Carried forward
  unchanged: the API arm (§3) and the CET endpoint comparison (§5) — neither touches the client
  layout, and §5's controlled result is the finding that settles the speed clause either way.

---

## 10.1 Playability at the three viewports, against the originals

`occlusion-probe.mjs`, unmodified from session 1, same method: hit-test all 64 square centres per
pack per viewport, count those whose topmost element is not the board. `[V]`

| Viewport | 2026-08-16 · `4a6ad91` — six endgame packs | **2026-08-17 · `451bb44`** |
|---|---|---|
| 1920×1080 | **16–48 / 64** occluded, every pack | **0 / 64**, every pack |
| **1440×1000** | **32–64 / 64** | **0 / 64** |
| 1440×900 | **32 / 64** on one, **64 / 64** on five | **0 / 64** |
| **1366×768** | **64 / 64** on all six; board overflows the fold by 30–149 px | **0 / 64**; board bottom sits **162 px above** the fold |
| **1280×720** | **64 / 64** on all six; overflow up to 197 px | **0 / 64**; board bottom **162 px above** the fold |

Per-pack, at HEAD, every one of the eighteen pack×viewport cells at the three named viewports
reads **0 occluded squares, no blockers, and 0 px of `.position-column` overflow** — against
**64–164 px** of overflow on all six in session 1 `[V]`. Board sizes: 326 px at 1440×1000,
241 px at 1366×768, **193 px** at 1280×720.

**Both control columns from §6a are gone and one of them was wrong.** The schema-example pack is
no longer served at all (owner ruling [[D502]] removed it from the library), so the "Najdorf
0/64" column cannot be reproduced; §10.2 replaces it with a synthetic 68-character pack. And the
control was misleading anyway — §10.4 shows the schema-example pack was **not** playable at
`4a6ad91` either, under the aiming model a learner actually uses.

### Can the authored first move be made?

`playability-probe-2.mjs` — session 1's probe with two corrections it needed (each gesture gets
its own fresh run, and board **orientation** is honoured; `philidor-third-rank-hold` starts with
Black to move and renders flipped, so session 1's probe aimed its drag at the mirrored square and
nobody could see it because everything failed for layout reasons). Aiming as session 1 did, with
coordinates taken **before** the gesture: `[V]`

| Viewport | 2026-08-16: authored first move made | **2026-08-17** |
|---|---|---|
| 1440×1000 | **1 of 6** (`queen-vs-pawn-seventh-convert` only) | **6 of 6** by drag, 5 of 6 by click |
| 1366×768 | 0 of 6 (all 64 squares unhittable) | **6 of 6** by drag, 5 of 6 by click |
| 1280×720 | 0 of 6 (all 64 squares unhittable) | **6 of 6** by drag, 4 of 6 by click |

**Read that row with §10.4 or it will mislead you.** Those coordinates are where the squares
*were*, and §10.4 shows that is exactly where the remaining defect decodes them. The number a
learner gets is in §10.4 and it is much worse.

---

## 10.2 Does the fix generalise, or is it pinned to today's corpus?

**It generalises. No ceiling was found, and the fix is length-independent rather than
length-tolerant.** `[V]`

The session-1 trigger was authored objective length — 68 characters in the schema example against
**277, 322, 326, 329, 382 and 444** in the corpus (re-confirmed at HEAD, `objective.summary`)
`[V]`. `length-sweep.mjs` writes clones of `mate-k-r-technique` differing **only** in
`objective.summary` length, at 68 / 150 / 300 / 444 / 600 / 900 / 1400 / 2200 / 4000 characters
of real prose, and re-runs the occlusion probe on each. `[V]`

| `objective.summary` chars | 68 | 150 | 300 | 444 | 600 | 900 | 1400 | 2200 | 4000 |
|---|---|---|---|---|---|---|---|---|---|
| 1440×1000 occluded / board y / size | 0 / 417 / 421 | 0 / 513 / 326 | 0 / 513 / 326 | 0 / 513 / 326 | 0 / 513 / 326 | 0 / 513 / 326 | 0 / 513 / 326 | 0 / 513 / 326 | **0 / 513 / 326** |
| 1366×768 occluded | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0** |
| 1280×720 occluded | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0** |

The board geometry is **byte-identical from 150 characters to 4,000** — 9× the current corpus
maximum. The mechanism is why: `442b8a3` gives `.objective-copy h1` a
`max-height: clamp(5.5rem, 16dvh, 10rem)` with `overflow: auto`, plus a
`min-width:720px and max-height:800px` rule capping it at `3rem`
(`apps/web/src/lib/DrillScreen.svelte`) `[V]`. Past the point where the prose fills the clamp — a
little under 150 characters at these viewports — additional characters go into the block's own
scroll, not into the column's height. **A bounded box has no ceiling to find**, which is a
stronger property than surviving 600 characters, and it is the right shape given that
`objective.summary` is `nonEmptyString` in `schemas/drill_pack.schema.json:223` with **no
`maxLength`** `[V]` — nothing stops the corpus growing.

**The residual is the floor, not the ceiling.** At 1280×720 the board renders **193 px** against
the fix's own `expect(board.width).toBeGreaterThanOrEqual(192)` — **1 px of headroom**, and
24-pixel squares. That is a pass by the thinnest possible margin, and the next region to gain a
row at that viewport spends it. Proposed as D535.

---

## 10.3 `assertRunViewport` — the fixtures were fixed too, and the invariant is still blind

**Fixed, not CSS-only.** `442b8a3` added `tests/browser/drill.spec.ts:949`, *"served endgame packs
keep the board above the timeline at supported desktop projections"*, which opens **all six**
served endgame packs by title at **five** projections — 1280×720, 1366×768, 1440×900, 1440×1000,
768×1024 — and runs `assertRunViewport` on each `[V]`. The assertion itself gained two clauses: a
192 px minimum board width and a `.timeline-row` containment check `[V]`. Session 1's finding —
*"its desktop projections run on the schema-example pack and its compact ones on a Just Play run
with no pack at all"* — is closed. Verified by execution, not by reading: the shipped test was run
against this session's harness server and **passes** (`1 passed`, 3.9 s) `[V]`.

**And it would still not catch what is now wrong, because it measures the board at rest.**
`invariant-after-select-probe.mjs` transcribes all eight of the shipped assertion's clauses and
evaluates them twice — once at rest, once after clicking the pack's own authored origin square.
Over all six packs at 1440×1000, 1366×768 and 1280×720, **eighteen cells, all eight clauses pass
in both states** `[V]` — while in the second state **0–32 of 64 squares** are un-hit-testable
(0 or 8–16 at 1440×1000, 8–24 at 1366×768, 8–32 at 1280×720, blocked by `div.reading-controls`,
`section.outcome-context`, `p.grade` and the reading buttons, all of them siblings *inside*
`.position-column`), and five of six packs at 1440×1000 — six of six at the smaller two — deliver
no move or the wrong one (§10.4).

This is not the same failure as session 1's and no fixture list fixes it. The assertion checks
*containment* of a *static* board: inside the viewport, inside `.position-column`, above the
timeline, at least 192 px wide, region not scrolling. Every one of those survives a board that
**moves 17–89 px the moment a learner touches a piece** and whose squares then decode to the wrong
coordinates — because the board is still inside its column, and its siblings are drawn over it
from inside that same column. **Session 1's guard was blind to the corpus; this one is blind to
the interaction state**, and the honest statement is that the next content wave does *not* reopen
it — the current content already does, and the guard is green. Proposed as D531.

---

## 10.4 The defect that replaces it: the board jumps when you touch a piece

**This is the finding of the re-run.** It is not a regression from `442b8a3`, it is not caused by
authored length, and it is not visible to any resting-state measurement — which is why session 1
missed it and why session 1's one "playable" reading was an artefact.

### 10.4a Mechanism, measured

1. `overlayCaption` (`apps/web/src/lib/DrillScreen.svelte:899`, derived at `:345-347` from
   `selectedSquare`) renders one `<p>` per structural observation touching the selected square,
   inside `div.overlay-caption` **below the board**, with no assistance gate `[V]`.
2. `.position-column` centres its content, so the board rises by **exactly half** the caption's
   height plus its `0.35rem` margin. Measured at 1440×1000, one row per pack `[V]`:

   | Pack | caption | sentences | board shift |
   |---|---|---|---|
   | `pawn-opposition-convert` | 29 px | 1 | **−17 px** |
   | `mate-k-r-technique` | 73 px | 4 | **−39 px** |
   | `lucena-bridge-convert` | 87 px | 5 | **−46 px** |
   | `philidor-third-rank-hold` | 87 px | 5 | **−46 px** |
   | `mate-bishop-knight` | 130 px | 7 | **−68 px** |
   | `queen-vs-pawn-seventh-convert` | 173 px | 10 | **−89 px** |

   `(caption + 5.6 px margin) / 2` reproduces every shift to the pixel. The shift is therefore
   **position-dependent authored/derived content**, not a constant that could be designed around.
3. **Chessground's cached board bounds are not invalidated by the shift.** Proof by controlled
   flip, `mate-bishop-knight` at 1440×1000, identical coordinates in both runs: select c3, then
   click the point where e5 is **drawn** → **0 plies**. Same again but dispatching a
   `window resize` (which invalidates the bounds memo) before the second click → **2 plies** `[V]`.
   The DOM agrees the destination is there — `elementFromPoint` at that point returns
   `square.move-dest` — and chessground still decodes it as a different square `[V]`.

### 10.4b What a learner gets

`human-aim-probe.mjs` aims every pointer event at where the square is **drawn at that instant**
(re-measuring the grid between the two clicks, and mid-drag), and records the **SAN actually
delivered** against the pack's authored first move. Session 1's probes only asked whether *any*
move happened; after the fix that is the wrong question, because a mis-aimed click on a rook's
file still produces a legal move. `[V]`

| Viewport | authored move delivered | **wrong move delivered** | nothing happens |
|---|---|---|---|
| **1440×1000** | **1 / 6** (`pawn-opposition-convert`) | **2 / 6** | 3 / 6 |
| **1366×768** | **0 / 6** | 1 / 6 | 5 / 6 |
| **1280×720** | **0 / 6** | 1 / 6 | 5 / 6 |

Identical for drag and for click, at every viewport `[V]`. The wrong moves are specific:
`mate-k-r-technique` delivers **Rh7+** (1440×1000, 1366×768) or **Rh8** (1280×720) where the pack
authored **Rh6**; `queen-vs-pawn-seventh-convert` delivers **Qc6+** where the pack authored
**Qc4+** `[V]`. `pawn-opposition-convert` succeeds at 1440×1000 only because its caption is a
single sentence and the 17 px shift is under half a square.

**A drill that silently records a move the learner did not choose is worse than one that ignores
the click** — the run is preserved, the branch is real, and the comparison the product exists to
give is now about a move nobody made.

### 10.4c It pre-dates the fix, and it was never about length

Two controls `[V]`:

- **At `4a6ad91`**, the pre-fix commit, the **schema-example pack** — 68 characters, **0/64
  occluded at rest**, the exact pack `assertRunViewport` ran on, the pack session 1 used as its
  clean control — shifts **−60 px** on selection and delivers **no move** under human aim at
  1440×1000 or 1280×720, by drag or by click.
- **At HEAD**, the synthetic 68-character pack from §10.2 shifts **−39 px** at 1440×1000 and
  **−40 px** at 1280×720 — the same as the 4,000-character clone.

So the shift is independent of the D507 trigger and of the D507 fix. It was in front of the
shipped browser suite the whole time.

### 10.4d This corrects session 1

§6b reports that `queen-vs-pawn-seventh-convert`'s authored first move *"went through and drew the
opponent's reply (0 plies → 2 plies)"* at 1440×1000, and every interactive number in §4 was taken
on that pack for that reason. **That reading was the probe agreeing with the defect.** Session 1
computed its coordinates from the resting board and then clicked — which is precisely the mapping
chessground's stale bounds apply, so the probe and the bug cancelled. The same cancellation is why
§10.1's drag column reads 6/6 and §10.4b's reads 0/6 at the same viewport, in the same session,
against the same build. Session 1's §4 latency numbers survive (they measure the same operations
regardless of which square was aimed at), but *"this pack is playable"* does not.

Same family as [[D526]] — a criterion that fired on its own instrument — and it is the reason
§10.4b was measured at all. Proposed as D532.

---

## 10.5 What is left of the K9 usability floor

Stated as plainly as session 1 stated the reverse:

1. **The layout defect [[D507]] named is fixed, completely, and the fix generalises.** 0/64
   occluded at rest on all six packs at all five viewports, 0 px of column overflow, no length
   ceiling to 4,000 characters, and the shipped invariant now runs on the real corpus. Session 1's
   §6a and §6c are closed on measurement, not on assertion.
2. **The criterion still does not clear on usability**, because the floor session 1 defined —
   *"can a move be made at all"* — is still not met once the question is asked the way a learner
   asks it: **1 of 6 packs at 1440×1000, 0 of 6 at 1366×768 and 1280×720**.
3. **The cause is different, older, and cheaper to fix**: one stale bounds cache and one caption
   that resizes the column under the pointer. It is not a property of the product idea, exactly
   as session 1 said of the previous cause — and that is now the second time the same sentence has
   been written about this surface, which is itself worth the owner's attention.

---

## 10.6 The latency arm — re-run, because the layout moved under it

The browser arm was re-run unchanged (`browser-arm.spec.ts`, Chromium 1440×1000, mock opponent).
The API arm (§3) and the CET endpoint comparison (§5) were **not** re-run: neither is downstream of
a client layout change, and §5's back-to-back control is the arm that decides the speed clause.
`[V]`

| Operation | 2026-08-16 median / p95 | **2026-08-17 median / p95** | Budget |
|---|---|---|---|
| Cold: fresh context → library (n=1) | 218 | **277** | — |
| Restart: library click → board + timeline (n=20) | 37.9 / 54.5 | **39.9 / 51.5** | board ready <250 warm ✅ |
| Reload of a run URL (n=10) | 55 / 57 | **56 / 66** | — |
| Your move → opponent's reply (n=10) | 128.0 / 133.7 | **130.0 / 147.0** | — |
| Rewind, preview + confirm (n=10) | 11.9 / 46.2 | **14.6 / 41.8** | rewind <100 ✅ |

**Nothing moved.** Every difference is inside the spread of the samples that produced it, and every
budget is still met with the same margin. The D507 fix cost no measurable latency, and §8's budget
table stands unchanged. The one long tail behaves as before: a single 876 ms first sample on
restart, every subsequent sample 33–52 ms.

**Carried forward, not re-measured**, and flagged so nobody quotes them as fresh: §3's per-call
distributions, §5's 30.8 vs 30.1 ms CET comparison, and §7's list of what a stopwatch cannot
answer. One item in §3 is known to have changed by other means and is **not** re-measured here —
the untyped HTTP 500 on a terminal position under `human_common` is recorded closed by [[D510]]
(`design/BACKLOG.md`, *"closed 2026-08-17 by terminal selector preflight"*) `[P]`.

---

## 10.7 What production serves now — §2a is obsolete

Measured at HEAD with the harness booted **without** `NODE_ENV=development` and **without** an
injected tablebase, i.e. the shipped default: `[V]`

| Probe | 2026-08-16 · `4a6ad91` | **2026-08-17 · `451bb44`** |
|---|---|---|
| `GET /packs` | 1 pack, the schema-example fixture, `cross_phase` | **6 packs, all `endgame`, all `channel: community`**, badged *unreviewed draft* |
| Endgame packs served | **0** | **6** |
| `policyModes` | `human_common, strong_engine, theory_strict, perfect_tablebase, practical_resistance` | **`human_common, strong_engine, theory_strict`** |
| `perfect_tablebase` selection | HTTP 503 for every position | **not advertised**; `providers.tablebase: none` |

[[D502]]/[[D524]] and [[D509]] both shipped. One consequence is measured and worth recording:
`mate-bishop-knight` declares `perfect_tablebase` as its opponent, so in the shipped default it
**cannot be started** — its *Open position* button is enabled, the click does not open a board,
and the library states *"perfect_tablebase is unavailable"* `[V]`. That is disclosed rather than
silent, which is the posture [[D509]] promised; the residual is only that the affordance is
offered before the refusal.

**The consequence for K9 is the opposite of comforting.** On 2026-08-16 the endgame surface was
unplayable *and* unreachable, so no learner met it. At HEAD five of six endgame packs are
reachable by any visitor, and §10.4 is what they meet.

---

## 10.8 The K9 gate row — proposed text and state

**Proposed state: `📊 EVIDENCE TOWARD FIRING` — unchanged. The reason is entirely replaced and
must not be left as it reads.**

Why not `open`: the criterion's usability floor is still unmet on measurement, at the same three
viewports, on the same six packs — **1 of 6 authored first moves delivered at 1440×1000, 0 of 6 at
1366×768 and 1280×720** — and the speed clause is settled in the direction that removes the other
route to clearing it (§5: 30.8 vs 30.1 ms, no gap to win). Moving to `open` would say the
measurement no longer supports escalation, and it does.

Why not `fired`: unchanged from session 1, and for the same reason. The cause is a defect of known
shape at a named place — a caption that resizes the column and a bounds cache that is not
invalidated — not a property of the product idea. Calling the criterion remains the owner's.

Why the row cannot stay as written: **every specific number in it is now false.** It says 5 of 6
packs cannot receive their first move at 1440×1000 (repaired), that all 64 squares are unhittable
at 1280×720 and 1366×768 (repaired), that the board overflows `.position-column` by 64–164 px
(0 px), and that the trigger is authored objective length (it is not, and the fix is
length-independent to 4,000 characters). A row that is right about its verdict and wrong about
every fact supporting it is [[D368]]'s failure with the conclusion accidentally intact.

Proposed replacement for the K9 row's evidence cell — **not written by this pass**:

> `design/research/endgame-latency-versus-cet.md` `[V]`, measured 2026-08-16 at `4a6ad91` and
> **re-measured 2026-08-17 at `451bb44`**. **Speed: settled, and K9 cannot be CLEARED on it** —
> every budget met (restart 39.9 ms median perceived, rewind 14.6 ms, opponent reply 130.0 ms,
> first Syzygy probe 33.0 ms), and CET's endpoint and ours are the same speed back-to-back on one
> machine (30.8 vs 30.1 ms, n=40 each), so the 80–224 ms in `teardown-cet.md` was that network,
> not that architecture. **Usability: the first cause is FIXED and the floor is still unmet.**
> [[D507]]'s resting-state defect is closed and the fix generalises — 0/64 squares occluded on all
> six endgame packs at all five viewports, 0 px of `.position-column` overflow, and **no length
> ceiling out to 4,000 characters** against a corpus maximum of 444 and a schema with no
> `maxLength`. `assertRunViewport` now runs on all six packs at five projections and passes.
> **What still fires:** selecting a piece renders `overlayCaption` below the board, `.position-column`
> re-centres, and the board rises by exactly half the caption's height — **17–89 px, content-dependent** —
> while chessground's cached bounds are not invalidated. Aiming where the square is drawn, **1 of 6
> packs delivers its authored first move at 1440×1000 and 0 of 6 at 1366×768 and 1280×720**, and two
> packs deliver a **different legal move** than the one aimed at (Rh7+/Rh8 for Rh6, Qc6+ for Qc4+).
> **Pre-existing, not a regression:** the same −60 px shift and the same failure are measurable at
> `4a6ad91` on the schema-example pack the suite tested. The shipped invariant passes all eight of
> its clauses in that state, so it is now blind to the interaction rather than to the corpus.
> **And it is now reachable**: production serves all six as unreviewed community drafts ([[D502]]),
> where on 2026-08-16 it served none. Recorded as evidence toward firing rather than `fired`: the
> cause is again a defect at a named place, and calling the criterion is the owner's. The half a
> stopwatch cannot answer is untouched — whether it *feels* immediate, and *"more usable"* in the
> comparative sense.

### C7 — *"Endgame restart and response latency feel effectively instant"*

**Stays `unmet`, and its blocker is unchanged in shape.** The numbers are still inside every budget
(§10.6). It remains unmet because the verb is *feel*, no person has felt it, and on five of six
packs there is still nothing to feel. §8's two named residuals stand in the same order: fix the
interaction, then run one owner session.

---

## 10.9 Method notes and limitations for the re-run

- **The tree was busy and the isolation is stated.** Uncommitted `feedback-delivery` work was
  present throughout (`apps/server/src/authored-feedback.ts`, `apps/web/src/lib/CompareView.svelte`,
  `packages/runtime/src/compare-strips.ts` and others) `[V]`. Every number above was taken against
  `git archive 451bb44` extracted outside the repo, with `@chess-tabiya/*` re-pointed into that
  extraction and **the web client rebuilt from that extraction** — the last of which session 1 did
  not do and which matters more for a layout re-run than for a latency one. Nothing was staged and
  nothing was committed.
- **What is new instrumentation and why.** Session 1's probes were reused where they answered the
  question (`occlusion-probe.mjs` unmodified; `browser-arm.spec.ts` unmodified;
  `make-headtree.sh`'s logic, with the client-build correction). Four probes were added because
  the question moved once the board became reachable: `playability-probe-2.mjs` (fresh run per
  gesture, orientation-aware), `selection-shift-probe.mjs` (rest vs selected geometry),
  `human-aim-probe.mjs` (aim at the drawn square, record delivered SAN),
  `invariant-after-select-probe.mjs` (the shipped assertion's eight clauses, re-evaluated one click
  later), plus `length-sweep.mjs`. All disposable, all labelled, all under
  `tools/k9-endgame-latency-harness/`.
- **Two session-1 probe errors found and corrected here**, both invisible while everything failed:
  board orientation was ignored (`philidor-third-rank-hold` is Black to move), and the wrapper
  element's border made square centres ~3 px low at 1440×1000 — enough to land in a 13 px caption
  line. §10's probes use the inner `cg-board` rect.
- **`n` is small on the same four rows as session 1** (n=10 for reload, reply, rewind; n=1 for cold
  load), and the usability arm is a **census, not a sample**: every pack × viewport × gesture cell
  was measured once, deterministically, and re-measured across two independent probes that agree.
- **Desktop Chromium only**, as session 1. The selection shift is a fraction of the board at
  1440×1000 and a larger fraction at 1280×720; the compact tier is unmeasured here and §7.4's
  inference still applies `[M]`.
- **Nothing here grades a chess move** (law 8). The only chess judgements are the packs' own
  authored first moves and the SAN the application itself rendered.

---

## 10.10 Proposed ledger rows — **not written** (ids from D530; D529 is in use)

- **D530 🐞** — *Touching a piece moves the board out from under the pointer, and chessground is
  never told.* `overlayCaption` (`DrillScreen.svelte:899`, derived `:345-347`) renders one sentence
  per structural observation below the board when a square is selected; `.position-column` centres
  its content, so the board rises by exactly half the caption's height plus margin —
  **17–89 px measured, one row per pack, `(caption+5.6)/2` reproducing every shift to the pixel**.
  Chessground's bounds memo is not invalidated, so every subsequent pointer event decodes against
  the pre-shift grid. Measured consequence at HEAD, aiming where the square is drawn: **1 of 6
  endgame packs delivers its authored first move at 1440×1000, 0 of 6 at 1366×768 and 1280×720**,
  identical for drag and click — and two packs deliver a **different legal move** than the one
  aimed at (**Rh7+/Rh8** for Rh6, **Qc6+** for Qc4+). *A drill that records a move the learner did
  not choose is worse than one that ignores the click.* **Pre-existing:** the same shift (−60 px)
  and the same total failure are measurable at `4a6ad91` on the **schema-example pack**, and the
  synthetic 68-character pack at HEAD shifts the same as the 4,000-character one — so this is
  independent of [[D507]]'s trigger and of [[D507]]'s fix. Reachable in production since [[D502]].
  `design/research/endgame-latency-versus-cet.md` §10.4 `[V]`.
- **D531 🐞** — *`assertRunViewport`'s fixtures were fixed and the invariant is still blind — it
  measures the board at rest.* `442b8a3` closed [[D507]]'s fixture gap properly: all six endgame
  packs at five projections, verified passing at HEAD. But all **eight** of its clauses were
  re-evaluated one click later, over six packs × three viewports, and **all eight pass in every
  cell** while up to **32/64** squares are un-hit-testable and five of six packs at 1440×1000 —
  six of six at 1366×768 and 1280×720 — cannot deliver their authored move.
  The assertion checks *containment of a static board*; the defect is *displacement of a live one*,
  and the siblings that overlap the board do so from inside the container it is asserted to be
  inside. **The next content wave does not reopen this — the current content already does, and the
  guard is green.** Remedy is a clause that asserts a click on a square produces that square's
  move, not another fixture. Same family as [[D481]] and session 1's own finding, one level up.
- **D532 🐞** — *A probe that computes its coordinates before the gesture agrees with the bug, and
  that is why [[D507]]'s dossier reported one pack playable.* Session 1 aimed at the resting grid —
  exactly the mapping the stale bounds apply — so its drag succeeded on
  `queen-vs-pawn-seventh-convert` and every interactive latency number was taken there on the
  strength of it. Re-aimed at the drawn square, that pack fails. The same cancellation makes the
  re-run's own naive column read **6/6** where the human-aimed column reads **0/6**, in one session
  against one build. Sibling of [[D526]] (a criterion firing on its own harness) and [[D420]]: **an
  instrument that shares the defect's assumption cannot see the defect.** Cheap guard: any
  coordinate-based board probe or test must re-measure the grid between the events it synthesises.
- **D533 📊** — *The [[D507]] fix has no length ceiling, which is a stronger property than
  surviving the corpus.* Measured across clones differing only in `objective.summary` length —
  68/150/300/444/600/900/1400/2200/**4000** characters — the board geometry is identical from 150
  up and **0/64 occluded at every length at 1440×1000, 1366×768 and 1280×720**. The mechanism is a
  bounded box (`max-height: clamp(5.5rem,16dvh,10rem)` + `overflow:auto`), so growth goes into the
  block's own scroll rather than the column's height. Recorded because `objective.summary` is
  `nonEmptyString` with **no `maxLength`** (`schemas/drill_pack.schema.json:223`) — nothing stops
  the corpus growing, and now nothing needs to.
- **D534 🐞** — *One of the six served endgame packs starts with Black to move and every
  coordinate-based instrument in this repo assumed White at the bottom.* `philidor-third-rank-hold`
  renders `orientation-black`; session 1's playability probe aimed its drag at the mirrored square
  and the error was undetectable because the board was unreachable anyway. Small on its own; filed
  because it is the second measurement error in the same arm that only surfaced once a different
  bug stopped masking it.
- **D535 📊** — *The board is 193 px at 1280×720 against a 192 px floor: one pixel of headroom.*
  `442b8a3`'s own assertion is `expect(board.width).toBeGreaterThanOrEqual(192)` and the measured
  width at the smallest supported desktop projection is **193**, with 24-pixel squares. The
  invariant passes by the thinnest possible margin, so the next region to gain a row at that
  viewport spends the entire budget. Record-only; not a defect today.

---

## 11. 2026-08-20 A2 recheck — current interaction evidence

`design/research/interaction-state-correctness.md` is the current A2 interaction dossier. It
reproduces §10's desktop result at clean commit `68b9a98`, extends the population to 768×1024 and
390×844, adds emulated touch, independently verifies every authored UCI and captures the exact
request UCI. `[V]`

The result remains evidence toward firing K9: 4/90 live click/drag/touch cells deliver the authored
move, 15 submit a different legal move and 71 submit nothing. At 390×844 every gesture is 0/6;
five source squares are covered before selection, a separate compact-layout defect (D573). The
stale-coordinate arm is now explicitly a negative control (19/30 exact versus 1/30 live click),
closing D539's instrument error rather than cancelling the product defect. `[V]`

This section supersedes only §10's statement that compact viewports were unmeasured and its
instrument status. The historical measurements, D507 closure, latency results and causal account
remain as recorded. `[V]`
