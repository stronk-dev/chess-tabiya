# Endgame latency and usability versus Chess Endgame Training (K9's missing arm)

- **Feeds:** Q-04 (`planning/research-queue.md` §1, §8) → **K9** · **C7** · [[D488]]
- **Session:** 2026-08-16, macOS 15 / Apple silicon, Chromium via Playwright, against commit
  `4a6ad91` extracted to a clean tree outside the repo. Instrument:
  `tools/k9-endgame-latency-harness/` (disposable, labelled, README states why the shipped
  harness could not be used).
- **Provenance:** `[V]` unless marked. Every number below was produced in this pass and the
  command that produced it is in the harness README. CET's numbers are `[P]` — inherited from
  `design/research/teardown-cet.md` (2026-08-11) — except the one CET figure this pass
  re-measured itself, which is `[V]`.

---

## 0. The finding that outranks the stopwatch

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
