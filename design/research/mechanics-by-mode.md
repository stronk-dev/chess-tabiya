# Mechanics × modes — what each mode can actually reach, measured

**Question (owner, 2026-08-16):** *"making sure we have all the right breadth in mechanics
and they're not implemented half-assed, but fully integrated for the drills vs just play vs
coaching/streaming/teaching vs campaign."*

**Answer in one line — and it is not the answer the question expects:** the product does not
have four modes with four mechanic sets. It has **one run surface that all three coded modes
render identically**, a **Live wrapper that adds session controls and removes nothing**, and a
**Campaign with zero lines of code**. The half-integrations are therefore not *inside* the
modes; they are at the **entries** (what a mode may declare when it starts), in the **content**
that populates the shared panels, and in a **small set of controls that exist on one surface and
not the other**. Nine of those are ranked in §7.

Landed 2026-08-16. Ledger block **D307–D316**.

---

## 0. Method, and the honesty ledger for this dossier

Measured at working-tree HEAD `e492919` (tree dirty; no cited file was modified by this pass).
Three instruments:

1. **Code census** — greps and counts, each command's result quoted rather than inherited.
2. **A live server** — `NODE_ENV=development ENGINE_MODE=mock DATABASE_PATH=:memory:`, driven
   over HTTP and through Playwright against the real client bundle. Every `[V]` marked
   *hands-on* below is a control I pressed or a route I called.
3. **Four parallel code audits** over disjoint mechanic clusters, each required to cite
   `file:line` and to distinguish *specified* from *implemented-with-no-entry-point* from
   *absent*.

**One error made and corrected in this pass, recorded because the rule is that counts are
run, not trusted.** A first measurement reported *"10 authored packs are silently not served"*.
That was an artefact of a **stale server process from another agent's session** still bound to
the probe port. Re-measured on a fresh build and a fresh port: **0 packs are unserved**
(§1.3). The finding is withdrawn. The lesson generalises — a running-server measurement must
assert the build it is talking to, and this dossier's server probes were all re-run after a
`pnpm build` on a port confirmed free.

**Counts that moved since the dossiers that carried them** are listed in §8 rather than
silently corrected.

**Ledger.** Findings land as **D307–D316**. The mapping is: §3.3 → D307 · §3.4 → D308 ·
§3.5 → D309 · §3.6 → D310 · §3.1-3.2 → D311 · §5.2 #8/#9/#10 → D312 · §5.2 #18 → D313 ·
§5.2 #13/#19 → D314 · §1.2 + §5.2 #11/#20 → D315 · §4 → D316. Gaps already ledgered or already
owned by an accepted RFC are named as such and **not** re-ledgered (§7, below the ranking).

**Concurrent-work note.** The `D317–D326` job (coaching-vs-cheating and the 1000→2000
trajectory) ran against the same tree and independently found the `permittedAssistance`
`sessionKind` gap, carried there as D321 and here inside D307. Two ids for one fact is the cost
of parallel id blocks; it is recorded rather than reconciled unilaterally.

---

## 1. The mode topology — measure this first or the matrix lies

### 1.1 Three coded modes, one component

`DrillScreen.svelte` is mounted at **exactly one place**: `apps/web/src/App.svelte:574`, under
`route.name === "run"` (`/play/run/:runId`). `[V]`

| Mode | Entry | `sessionKind` | Renders `DrillScreen`? |
|---|---|---|---|
| **Drills** | `PackList` (`App.svelte:559`) → `startPack` (`session-controller.ts:227`) | `pack` | yes |
| **Just Play** | `JustPlayStarter` (`App.svelte:558`) → `startPosition` (`session-controller.ts:258`) | `position` | yes |
| **Live** — board | `/live` (`App.svelte:799`) creates a session **over an existing run**, then "Open shared board" (`App.svelte:809`) navigates to the same `/play/run/:id` | inherits | yes, plus `liveSessionKind` (`App.svelte:589`) and `viewerRole` (`App.svelte:587`) |
| **Live** — overlay | `/live/overlay/:runId` (`App.svelte:812-815`) | — | **no** — a bespoke four-line render: board, `objectiveState`, branch count, vote tally |
| **Campaign** | — | — | no code |

**Measured hands-on `[V]`.** Driving the real client, the run screen exposes **18 interactive
controls in a pack drill and 19 in Just Play**, and the sets are identical apart from one
entry:

```
PACK DRILL:  Assistance · Keyboard shortcuts · Timeline · Branches · Evidence ·
             Structural reading · What changed on this move? · Switch to branch 1 · Hide ·
             Compare all forked here · Classify remaining · Fork · Branch group ·
             Compare[disabled] · Replay · Export                                      (18)
JUST PLAY:   ... identical ... plus "Open assistance" (the ambient ♟ glyph)           (19)
```

So **at the run surface, Drills and Just Play are the same product.** Every difference is
upstream (what the entry may declare) or downstream (what content populates the panels).

### 1.2 Live is a wrapper, not a mode

`LiveSessionService.open` takes an **existing `runId`** (`live-session.ts:53-82`). A live
session never creates a run and never declares a disclosure policy, an opponent, or a pack.
Consequences, all measured:

- **A Live host reaches every mechanic by navigating to the run screen**, minus what
  `MATCH_LIVE` refuses. Neither live surface renders any authored vocabulary at all — the
  session page is a members/proposals/votes/invitations panel `[V]`.
- **`session.kind` is nearly decorative.** Four literal comparisons exist in the whole server
  (`storage.ts:1646`, `storage.ts:1657`, `live-session.ts:74`, `live-session.ts:225`), two of
  them creation-time consistency guards rather than runtime capability. `stream` earns its
  keep in exactly one line — `assistance-preference.ts:9`. **`academy` has zero behavioural
  consumers anywhere, client or server**, and no assistance profile: `assistanceProfile()`
  falls through to `sessionKind` for it (`assistance-preference.ts:11`). So the mode the owner
  calls *coaching/teaching* is, in code, the mode with the least of its own behaviour.
- **A Live match can never carry authored vocabulary**: `live-session.ts:76` refuses a native
  match unless the wrapped run is an untouched `position` run.
- **Only one live session per run** — `"A live session already exists for this run"` `[V]`.
  A run cannot be both a stream and an academy.
- **The overlay renders zero ladder rungs and zero forms** (§4). Plausible by design for a
  broadcast surface; **no design doc states it**.

### 1.3 Campaign has zero code, and the audit is therefore of its *primitives*

`grep -riE 'campaign|run_set|curriculum|playlist'` over `apps/` + `packages/` → **0 hits**
outside disposable research harnesses in `tools/`. `[V]`

Every mechanic's Campaign column below therefore answers one question: *does `design/06`
require it, and does the primitive exist?* The summary is that **`design/06`'s own inventory is
accurate**: the two-axis split exists, the lens vocabulary exists and is pack-independent, the
bosses exist as opponent modes, `plyHorizon` is declared by 46 of 47 packs, and the failure
state (`degraded`, one-way, sealed across legs) exists. What does not exist is what `06` says
does not exist: a server-held inventory, a run-level roll-up, a fourth `DecidednessGround`.
**One new find for `06`:** the deck's lens vocabulary is *already* reachable in Just Play and
in fact **wider** there than in a drill (§5.3), so the 278,256-build loadout is buildable today
without any pack.

### 1.4 The catalogue, counted three ways

| What | Count | Command |
|---|---|---|
| Pack documents in `content/drafts/` | **53** | `ls content/drafts/*.json \| grep -vE '\.(evidence\|job\|sources)\.json$' \| wc -l` |
| …of which `.browser.json` test fixtures | **6** | `ls content/drafts/*.browser.json \| wc -l` |
| Authored packs (the "47") | **47** | as above, also excluding `.browser` |
| Shape entries | **25** | `ls content/shapes/*.json \| wc -l` |
| Served by a **development** server | **54** | `GET /packs` `[V]` = 47 drafts + `drill_pack.example.json` + 6 fixtures |
| Served by a **production** server | **1** | `GET /packs` `[V]` — `content/packs/` holds only `.gitkeep` |

**The undocumented `.browser.json` exclusion is load-bearing on at least one widely-quoted
statistic**: the single `stated_reasoning` checkpoint in the entire repository lives in
`content/drafts/stated-reasoning.browser.json` — a browser test fixture (§5.2). And **six test
fixtures appear in the learner-facing pack grid with a working "Open position" button** on any
development deployment `[V]`.

---

## 2. The matrix

**R** = reached (a non-refusing server/runtime path **and** a user-pressable client control in
that mode) · **P** = partially reached · **✗** = unreachable · **n/a** = the mode has no code.
Campaign is answered as *required by `06`? / primitive exists?*

### 2.1 Branch and review

| Mechanic | Drills | Just Play | Live | Campaign |
|---|---|---|---|---|
| rewind | R | R | **P** — `MATCH_LIVE`; and the Timeline path is **not** gated for read-only viewers | req — *"rewind stays free inside an encounter"* (`06:231`) / exists, unbudgeted |
| fork, auto-fork after rewind-then-move | R | R | **P** — `MATCH_LIVE`; the Fork button carries no `read_only` gate | req (implied) / exists |
| branch groups | R | **P** — 3 of 5 designed seed sources unreachable mid-play (§3.4) | **P** — `MATCH_LIVE`, machine sources locked for non-hosts | not required |
| n-way compare | R | R | **R — including for spectators.** `service.compare` has **no** `MATCH_LIVE` guard (`service.ts:965-984`) | not required |
| compare/difference strips | R | R | R | not required |
| **narrative mode** | **R** | **R** | **R** | not required — **shipped**, `CompareView.svelte:28,96-98` |
| **simulate / simulate-enter** | **P — server-complete, zero client bytes** | ✗ `NO_AUTHORED_VARIATIONS` `[V]` — correct | P (same, no UI) | not required |
| prediction checkpoints | **P — code-complete, 0 authored instances** | ✗ (needs a checkpoint) | P | not required |
| opponent-intent prompt | **✗ — `intent_capture` is read-only prose selection, never a prompt** | ✗ | ✗ | not required |
| stated reasoning | P — 1 instance, in a test fixture | ✗ | P | not required |
| `/reasoning-review` | ✗ — no client method | ✗ | ✗ | not required |
| branch race | ✗ — **absent by explicit scope ruling** | ✗ | ✗ | not required |
| replay (single board) | R | R | R | not required |
| **synchronized N-board replay** | **P — manual stepper only; `Space` is dead inside compare** | P | P | not required |
| story slides | R | R (post-outcome) | P — no overlay affordance, correctly | not required |
| PGN export | R | R `[V]` | R | not required |
| game import | n/a | R (`/runs/import`) | ✗ | not required |
| share links | **P** — created from the story screen only; list/revoke have 0 client callers | P | P | not required |
| **duplicate** | **✗ — endpoint + client method, zero callers** | ✗ | ✗ (+`MATCH_LIVE`) | not required |
| flip sides | R | R | P (+`MATCH_LIVE`) | not required |
| **schedule (learner-initiated)** | **✗ — no client caller** (auto-schedules still populate `/learn`, `storage.ts:1584-1610`) | ✗ | ✗ | explicitly *not* required |
| derivations | **P** — renders at `App.svelte:626-630`, but only after navigating away and back | P | P | not required |
| `deriveMoveAuthorship` | **✗ — 5 references repo-wide, all definition/export/test** | ✗ | ✗ | not required |
| branch decidedness (rung-1 render) | R | R | host only | **req** (§2a tiers) / exists, 3 grounds of 4 |
| branch set scale / semantic zoom | R | R | R | not required |
| **graph** | **✗ as a view** — the client reads only `graph.viewer`; no tree/carousel/grid surface exists | ✗ | ✗ | not required; shape deliberately open (`BACKLOG:547`) |
| checkpoints — authored | R | **✗ structurally** — `reachCheckpoint` is pack-only | R (pack runs) | req / exists |
| checkpoints — detected | R | **R** | R | req / exists |
| **submit / seal a branch** | ✗ | ✗ | ✗ | **required (`06:231-232`), does not exist** |
| **run-level roll-up** | ✗ | ✗ | ✗ | **required (`06:242-244`), does not exist** |

### 2.2 The assistance ladder

| Rung | Drills | Just Play | Live-board | Live-overlay | Campaign |
|---|---|---|---|---|---|
| 0 — rules-derived sight | R | R | R (all roles) | ✗ | req / exists |
| 1 — tablebase | P | P | P (host) | ✗ | req / exists |
| 2 — engine evaluation | P | P | P | ✗ | req / exists |
| 3 — Maia human model | P | **✗ in-run**, R post-outcome | ✗ for participant/spectator | ✗ | req / exists |
| 4 — corpus frequency | P | **✗ in-run**, R post-outcome | ✗ for participant/spectator | ✗ | req / exists |
| 5 — authored claims | R | **✗ by construction — and correctly** | pack-runs only | ✗ | req / exists, pack-only |
| 6 — LLM / voice | P | ✗ in-run | ✗ for participant/spectator | ✗ | req / provider-gated |

### 2.3 Forms (`design/05` §3-forms)

| Form | Drills | Just Play | Live | Notes |
|---|---|---|---|---|
| sentence rows / lists | R | R | R (board surface) | the default form |
| timeline markers | R | **P** — checkpoint/authored/guard markers are pack-only (`Timeline.svelte:64,68,71`); shape + pivotal markers fire in all modes | ✗ on live surfaces | |
| board overlays — lit squares | P | P | P | requires `boardLighting ∈ {sight,evidence}` **and** a clicked square; default `legal` ⇒ nothing out of the box |
| **board overlays — arrows & halos** | **✗** | **✗** | **✗** | all three of `05` §3-forms' jobs are dead: (a) `drawable:{enabled:false}`, (b) no relay path, (c) `boardOverlays` emits no `dest`. Ledgered D158/D159; **RFC `board-annotation` accepted 2026-08-16** |
| sheets / panels | R | R | ✗ | |
| spoken voice | P | P | ✗ | fires only from an opened pivotal marker |
| story slides | R | R | ✗ | |
| simul wall | ✗ | ✗ | R | correctly Live-only (`05:168`) |
| ambient presence | **P** | **P** | P | renders; **the button has no `onclick`** |

### 2.4 Authored-content mechanics

| Mechanic | Drills | Just Play | Live | Campaign |
|---|---|---|---|---|
| objective grading | R | **✗ — stated design** (`05:50-51`) | ✗ own surface | req / pack-only |
| theory following | R (18/53 `follow_theory`) | **✗ — no stated reason, and `03:35-39` promises it** | ✗ | req (Act I) / pack-only |
| plan classes | P — 131 authored, **3 graded** | ✗ | ✗ | req (Act II) / barely graded |
| tempo / timing windows | P — 4 packs, **all middlegame**; `0 of 20` opening packs still | ✗ — `unauthoredTempoTransition` has **zero callers** | ✗ | not named / exists, unexercised |
| deviation classes | R | ✗ | ✗ | req / exists |
| shape entries / firing | R (pack's subset) | **R — the full 25-entry catalogue** | ✗ | req / exists |
| transition primitives | R read + R graded | **R read only** | ✗ | req / exists |
| evidence packets | R | P — packet yes, authored ledger no | ✗ | not named / exists |
| pack studio | R at `/create` | n/a | n/a | prereq / exists |
| session→pack distillation | R | **R** | R (host) | not named / exists |
| repertoire gap finding | ✗ | **R at `/learn`** | ✗ | not named / exists |
| corpus mining | ✗ CLI only | ✗ | ✗ | prereq / CLI only |
| progress / scheduling | R graded | **P — rows and schedules, never graded, zero concept tags** | P inherits | req / **run-level roll-up absent** |
| `variantOf` | R (2 packs) | ✗ | ✗ | not named / exists |

### 2.5 Opponents, engine conditions, live machinery

| Mechanic | Drills | Just Play | Live | Campaign |
|---|---|---|---|---|
| `human_common` | R (pack declares) | R | P (inherited) | req / exists |
| `strong_engine` | R | R | P | — / exists |
| `theory_strict` | R (34 packs) | **✗** `rest.ts:371-373` | P | req (Act I boss) / exists |
| `perfect_tablebase` | R (2 packs) | **✗** — refused under a *`theory_strict`* error message | P | req (Act III boss) / exists |
| `practical_resistance` | **✗ in practice — 0 packs** | ✗ | ✗ | caveated / exists, unused |
| opponent band / difficulty | pack declares `targetElo` | **✗ — no control anywhere** | ✗ | req / exists in wire, no UI |
| replay under different resistance | ✗ | **P** — `/flip` accepts `resistance`; the client never passes it (`App.svelte:338`) | ✗ | req / server-only |
| engine conditions (a reading that FIRES) | R (pack-authored) | **✗ — stated design** (`05:134-137`) | P (inherited) | map row / exists |
| guard / on-ramp (`immediate_guard`) | R (31 packs incl. candidates) | **✗ — type-fenced** | P | req / pack-only |
| live votes — *open a window* | ✗ | ✗ | R (host) | — |
| live votes — **cast a vote** | ✗ | ✗ | **✗ — `castVote` has 0 client callers** | — |
| chat relay adapter | ✗ | ✗ | **✗ — client cannot send `voteAdapterHandle`** | — |
| board control `rotation` | ✗ | ✗ | **✗ — offered in the picker, always 400s** | — |
| board control `match` / pause / Arena legs | ✗ | ✗ | R | — |
| proposals — make / **resolve** | ✗ | ✗ | R / **✗ — 0 client callers** | — |
| friend-link join tokens | ✗ | ✗ | **P — participant only, native matches only** | — |
| spectator grants | ✗ | ✗ | P — `updateGrants` has 0 client callers | — |
| simul wall | ✗ | ✗ | R | — |
| writer lease | R | R | R | — |
| assistance role-parameterisation | R | R | R | req / exists |

---

## 3. Owner check 1 — *"configurable as to what is exposed"*

This is Just Play's whole promise. Measured, it is **three separate problems**, and only one of
them is the one everybody has been discussing.

### 3.1 The config has nine axes, two of which drive nothing

`AssistanceConfig` v4 (`packages/runtime/src/assistance.ts:3-14`) — nine axes, verified by
count, not assumed. Per-axis consumer audit:

| Axis | Consumer that changes behaviour | Verdict |
|---|---|---|
| `markers` | `DrillScreen.svelte:302` → `liveMarkers()` | live |
| `guided` | `DrillScreen.svelte:306`, `:1018` — only inside the pivotal modal | **near-dead** (§3.5) |
| `humanSplit` | `DrillScreen.svelte:717,1021`; server `rest.ts:1090` | live |
| `corpus` | `DrillScreen.svelte:719-722`; server `rest.ts:1107` | live |
| `voice` | `DrillScreen.svelte:723,1023` | live |
| `spoken` | `DrillScreen.svelte:339-351` | live |
| `boardLighting` | `DrillScreen.svelte:298-300,826-835` | live; **`sight` ≡ `evidence` behaviourally** |
| **`arrows`** | **`AssistanceSettings.svelte:43` alone** | **dead switch** |
| **`ambient`** | `DrillScreen.svelte:711` — a `<button>` with **no `onclick`** | **half-dead** |

`arrows` is typed, defaulted, migrated across four schema versions, validated, asserted in a
test, **permissioned** (`assistance.ts:29` computes `arrows: mayRequestSplit ? "evidence" :
"sight"`) and rendered as a three-value `<select>` — with **zero readers, including of its own
permission**. It is the cleanest instance of the shape the owner is asking about, and it is
already ledgered (D158/D159) and owned by the **implemented** `rfc/archive/board-annotation.md`.

`ambient` is new: the button's `aria-label` is `"Open assistance"`, it opens nothing, and its
`title` *is* reactive — so it is a live status glyph mislabelled as a control.

### 3.2 No single surface configures all nine, and the split is undesigned `[V]`

Measured hands-on by rendering both surfaces:

| Axis | `/settings` (`AssistanceSettings.svelte`) | in-run panel (`DrillScreen.svelte:712-726`) |
|---|---|---|
| `boardLighting`, `arrows`, `ambient` | ✓ | **✗** |
| `humanSplit`, `corpus`, `voice` | **✗** | ✓ |
| `markers`, `guided`, `spoken` | ✓ | ✓ |

Six axes each; **three overlap**. Board lighting can only be changed by *leaving the run*;
human-split only from *inside* one. And `DrillScreen` reads the config **once, in `onMount`**
(`:644`), so a `/settings` change during an open run does not apply until remount. No stated
design reason.

Correction while measuring: **`design/03:297`'s "`/settings` remains display-only" is stale.**
The page renders **36 live controls** (6 contexts × 6 axes) `[V]`; only the *Deployment
capabilities* block is display-only, and it says so.

### 3.3 Six contexts exist — and every one of them defaults identically

`ASSISTANCE_PROFILES = ["pack","position","imported","match","stream","onramp"]`
(`assistance-preference.ts:4`), selected by `feedbackPolicy` → `liveKind` → `sessionKind`
(`:7-12`). Rendered as six labelled fieldsets `[V]`: *Curated drill · Just Play · Imported game
· Match / Arena · Streamed session · On-ramp*.

**The prior "three localStorage keys ever" claim is refuted** — it counted `RunSessionKind` and
missed the `liveKind`/`onramp` overrides. D82 is correctly closed. But its closing sentence —
*"profiles select defaults and never permission"* — is **half true, and the wrong half ships**:

> `loadAssistance` returns `SILENT_ASSISTANCE` for **every** unset profile
> (`assistance-preference.ts:30-33`). **All six contexts default byte-identically.**

So `design/05` §3-forms' *"A curated drill, Just Play, a match, a stream, and the on-ramp each
get their own defaults"* is **not implemented**. What six profiles buy today is six empty
localStorage slots the learner must fill by hand, six times. **This is the sharpest single
answer to the owner's question**: the mode-awareness of the config is entirely in its
addressing and entirely absent from its content.

And `permittedAssistance` — the honesty half — **takes `sessionKind` and never reads it**
(`assistance.ts:27-30`: the body uses only `role` and `deliveryOpen`). `design/05` §4 says
*"A curated drill withholds by design. Just Play is the learner's own game and they may want
everything"*; measured, `pack`, `position` and `imported` receive identical permissions.
There is no lever to make Just Play more permissive than a drill **even if the owner rules that
it should be.**

### 3.4 The hard consequence: Just Play cannot open disclosure mid-run

Just Play's policy is **`attempt_end`, forced by three independent fences**:
`session-controller.ts:271` (client always sends it), `rest.ts:368` (server rejects anything
else for `kind:"position"`), `events.ts:157` (runtime invariant). Under `attempt_end`,
`feedbackDeliveryOpen` re-closes on the next committed move (`feedback.ts:22-30`), and
`permittedAssistance` keys `humanSplit`/`corpus`/`boardLighting`/`arrows` off `deliveryOpen`.

`api.reveal` has exactly **two** call sites in the whole client — `App.svelte:292` (story load)
and `App.svelte:317` (game import). **There is no reveal control anywhere in
`DrillScreen.svelte`.**

Measured hands-on `[V]`, a fresh Just Play run's assistance panel renders seven entries, of
which two are lock explanations and one an unavailability notice:

```
Passive pivotal markers
Named-pattern guidance
Human move split on request        [disabled]
  "Available only after this run opens feedback, and never to participants or spectators."
Corpus counts on request           [disabled]
  "Available only after this run opens feedback, and never to participants or spectators."
Speech synthesis is unavailable in this browser.
```

> **So during a Just Play game in progress, rungs 3, 4 and 6 are structurally unreachable.**
> The owner's *"gives the FULL toolkit… all the engines, analysis, theory tie-ins"* is, as
> shipped, *"rung 0 plus a locked panel until the game ends."*

This is not a bug in the disclosure model — the model is right and ADR-0006 is being honoured.
It is a **missing control**: `design/05` §3a-i describes `attempt_end` as the boundary that
*"re-closes on the next committed move"*, which presumes the learner can **open** it. Nothing
lets them. The same three fences also mean **the `onramp` profile is structurally unreachable
from Just Play** (it requires `immediate_guard`, and `PositionRun.feedbackPolicy` is type-locked
to `"attempt_end"` at `packages/runtime/src/session.ts:47`) — so a 1000-rated beginner who just
plays gets the `position` profile's silence, and `design/05` §3b's *"natural default for the
1000–1400 on-ramp"* has no path to them.

Related: branch groups in Just Play. Four seed sources ship (`hand_picked`, `authored`,
`human_replies`, `engine_top_n` — `types.ts:250`), against the **five** `design/03:140-144`
names as *"one mechanism, five ways to fill it"*; the missing one is the rung-4 corpus-variant
source. Of the four, `authored` requires a pack and `human_replies`/`engine_top_n` are gated on
`assistancePermission.humanSplit` (`DrillScreen.svelte:917-918`). **In a Just Play game in
progress, exactly one of five designed seed sources is available.** The server itself does not
refuse: `POST /runs/:id/group {source:"engine_top_n"}` on a pack-less run reaches seed
selection and fails only on the mock engine's candidate count `[V]`.

### 3.5 Guided mode is inverted

`grep -rni 'clippy|guidedMode'` → **0 hits**. But the *mechanism* `design/05` §3b describes —
"the shape library rendered live" — **ships and is completely ungated**: `shapeFirings`
(`DrillScreen.svelte:206`) → `shapeMarkers` (`:207`) → `Timeline.svelte:74` renders a marker on
every ply where a shape triggers → `ShapePanel.svelte:30` shows exactly §3b's sentence,
*"Named plans for this structure — general to the kind of position, not advice for this one."*
No config axis, no disclosure predicate, no rung gate touches that path, and a position run
loads the **entire** 25-entry catalogue (`session-controller.ts:620,275`).

What `assistance.guided` controls is a **narrower duplicate** of the same entries inside the
pivotal-marker modal (`:305-309`, `:1018-1020`) — which additionally requires
`assistance.markers === "live"` to have produced a marker the learner then clicks (`:302`,
`:320`).

> **Guided mode is on by default via the timeline, while the switch labelled "Named-pattern
> guidance" gates a strictly smaller copy that needs an unrelated switch turned on first.**

Two escalations follow. It **contradicts §3a's silence default in code** (`SILENT_ASSISTANCE`
sets `guided: "off"`, yet shape markers render regardless). And **band-shaping does not
exist** — nothing in `shapeFirings`, `Timeline.svelte:74` or `assistanceProfile` reads a rating
band, and per §3.3 the `onramp` profile carries no different default.

### 3.6 One more casualty of the same modal

`renderEndgameReading` has **exactly one call site in the client** — `DrillScreen.svelte:1017`,
inside `{#if openPivotalNodeId !== undefined}`. So **B10's "endgame steering names a technique
rather than a move" is reachable only when an unrelated pivotal detector has fired on that node,
markers are on, and the learner clicks the marker.** In an endgame, the four honest forward
detectors (irreversibility, phase change, Maia divergence, option collapse) may well not fire —
and the surface that names Lucena/Philidor/Vancura is behind them in every mode.

---

## 4. Owner check 2 — *"it steers you by classifying openings, strategies, endgames"*

**Verdict: almost entirely aspirational. One instrument steers; everything else describes.**

### 4.1 Every consumer of every classifier, censused

`classifyPhase`, `structuralReading`, `endgameReading`, `shapeFirings` and `pivotalMarkers` have
between them **four** non-test consumer sites, and all four are renderers:

| Consumer | What it does with the classification |
|---|---|
| `DrillScreen.svelte:288-295, 776-779, 799-815, 1017` | renders sentences and lit squares |
| `apps/server/src/guidance.ts:30-46` (`evidencePacket`) | assembles sentences for the voice renderer |
| `packages/runtime/src/story.ts:97-122` | post-game story slides — *after the fact* by construction |
| `packages/runtime/src/pivotal.ts:47` | marks the timeline — passive by owner ruling |

**Nothing selects an opponent, a band, a position, an objective, a pack, a next node or an
assistance rung from a classification.** Detection is complete and honest; steering is absent.

The one place classification meets *availability* is `permittedAssistance` — and §3.3 showed it
ignores mode entirely. So `design/05` §4's *"a live phase classifier is not a navigation nicety:
**it is what makes the assistance rail selectable**"* is not shipped: the rail is not selectable
by phase, by structure, or by anything else.

### 4.2 The catalogue does not steer either

- **`PackList.svelte` renders `phase` as a display chip and has no filter, no sort, no
  grouping** — `grep -c 'filter\|sort\|select' PackList.svelte` → **0** `[V]`. `design/03:70-72`
  makes phase *"first-class navigation and filters."*
- **`/learn` contains the words "opening", "middlegame" and "endgame" zero times** —
  `grep -c` over `App.svelte` → **0** `[V]`. `design/03`'s Learn destinations (*opening,
  middlegame, endgame, trajectories, progress/schedule*) do not exist as navigation.
- **`shapeRecommendations` is a real detector that steers nowhere.** It ranks shapes you met in
  your own preserved runs and have no countable attempt against (`service.ts:758-778`), emits a
  provenance sentence and a `packIds` list — and the client's entry point is
  `onclick={() => navigate("/play")}` labelled *"Find {packId}"* (`App.svelte:667`). **The
  packId is computed, printed, and then discarded**, dropping the learner on an unfiltered
  45-card grid to find it by eye. `design/06:58` counts on this detector for encounter unlocks;
  it is one navigation argument short of being one.

### 4.3 The exception, and it is a good one

**Repertoire gap finding genuinely steers.** `/learn` → import a Lichess study or PGN → *Scan
gaps* → *Go to biggest gap* → `enterRepertoireGap` → `POST /repertoires/:id/enter` →
`createRepertoireGapRun` builds a **position run at the gap FEN, at the repertoire's
`targetElo`, against `human_common`** (`service.ts:586`, `repertoire.ts` `enter`). That is
classification (corpus frequency at your band, bounded by a coverage denominator) selecting the
position you play next. It is exactly the shape the owner describes — and it is the **only**
instance in the product.

Two half-integrations inside it:
- **Only the top-ranked gap is enterable.** `{#if index===0}` on the button (`App.svelte:694`)
  — every other listed gap is inert, though the server's `enter` accepts any `gapKey`.
- **`chooseRepertoireAnswer` has zero client callers** (`api.ts:768`). The write-back loop —
  play the gap, choose the answer, and the repertoire absorbs it — is server-complete and
  client-absent, so scanning never converges.
- Cosmetic but real: the population line renders `{JSON.stringify(page.scan.population)}`
  (`App.svelte:691`).

**And the gap run itself is a bare Just Play run** — no objective, no theory verdict, no
checkpoints. So the product's one steering mechanism steers you into its least-instrumented
mode.

---

## 5. What is absent by design, and what is a defect

### 5.1 Absent by design, with the reason found and cited

| Absence | Stated reason |
|---|---|
| **Objectives in Just Play** | `design/05:50-51` — *"With no pack there is no objective, and the region says that rather than inventing one"*; implemented verbatim at `DrillScreen.svelte:768` |
| **Authored claims (rung 5) in Just Play** | `design/05:341-345` — the run *"says honestly that nothing was written about this position"*; `service.ts:1353-1356` returns an empty page |
| **Engine conditions / `immediate_guard` in Just Play** | `design/05:134-137` — *"the pack-declared exception for the on-ramp — the guard fires post-commit because **the pack consented for the learner's band**"*; generalised at `BACKLOG:507` |
| **The simul wall outside Live** | `design/05:168` names it a *"multi-run form for hosts"*; a wall of one is not a mechanism |
| **The possession journal outside Live** | it records people and possession; a solo run has one of each |
| **Voting / chat relay outside Live** | audience machinery; `design/03:83-86` |
| **Simulate in Just Play** | `service.ts:1246` `NO_AUTHORED_VARIATIONS`; a position session has no authored variations to walk. `docs/branch-groups.md:43-44` states the same for the `authored` group source |
| **Branch race, anywhere** | `rfc/archive/n-way-comparison.md:97-99` puts it **explicitly out of scope** (*"needs program #4's mode semantics"*); `BACKLOG:568` carries it as experimental/optional; `design/03:163` calls it *"the two-board special case"*. A correct deliberate absence |
| **Opponent-intent prompts** | `rfc/archive/structural-reading.md:182-186` — *"no intent is recorded anywhere: `intent_capture` is read only to decide which plan-class prose to reveal… the learner's choice is never written to the event log"*, deferred to a future intent-grading RFC. So `03:64`'s "opponent-intent prompts" is a **specified deferral**, not a defect |
| **`atStart` checkpoints not re-firing after rewind-and-fork** | `rfc/archive/authoring-frictions.md:385-394` names it and defers it for want of an orchestration hook on `branch.forked`/`run.rewound`. Worth noting that the deferred case *is* the product's core loop |
| **No branch-graph view** | shape deliberately unfixed — `design/03:163-165` (*"grid, carousel, stack — deliberately unfixed"*), `BACKLOG:547` |
| **The config never reaching the server** | architecturally correct — it is why a preference cannot smuggle a source past its rung. Worth stating as a *feature*, not a gap |

### 5.2 Defects — capability with no entry point, or an entry point with no capability

Each of these ships as code and reaches nobody.

1. **No mid-run reveal control in Just Play** → rungs 3/4/6 unreachable while playing (§3.4).
   No stated reason; `design/05` §3a-i implies the opposite.
2. **`arrows`** — nine-axis member, permissioned, zero readers (§3.1). *Already ledgered
   D158/D159 and owned by the accepted `board-annotation` RFC.*
3. **Guided mode inverted** — ungated mechanism, switch gates a duplicate (§3.5).
4. **All six assistance contexts default identically** — `design/05` §3-forms requires per-context
   defaults (§3.3).
5. **`permittedAssistance` ignores `sessionKind`** — dead parameter, and the missing lever for
   `design/05` §4 (§3.3).
6. **Endgame technique naming behind an unrelated detector** (§3.6).
7. **`ambient` button has no `onclick`** (§3.1).
8. **`tablebase:` evidence refs render as the three words "Evidence recorded."** —
   `evidence-sentences.ts:143-176` branches on `engine:` and `tempo:` only; the DTZ number,
   category and Syzygy provenance are fetched, stored, disclosed and then thrown away. This is
   the **actual** residual behind `design/03:300`'s B4 "Syzygy runtime rendering", and it is one
   `if` block. (The *other* Syzygy path — `branch-decidedness` → `renderCollapseExplanation` →
   `BranchRail.svelte:75`, pressable as "Classify remaining" — **does** ship, so `03:300` is
   over-broad.)
9. **`CompareView.svelte:33` calls `renderEvidenceRef(ref, pack)` with no payload map** ⇒ every
   engine ref in compare renders *"Engine evidence recorded; details are pending."* permanently.
10. **Rung 2 on request is reachable only via "Analyze missing evidence" inside a branch-group
    panel** (`GroupPanel.svelte:123`, rendered only when `activeGroup !== undefined`).
11. **Live audience machinery is client-absent**: `castVote`, `closeVote`, `resolveProposal`,
    `updateGrants` and `chooseRepertoireAnswer` all have **zero Svelte callers**; `rotation`
    board control is offered in the picker and always 400s because the client never sends
    `rotationHandles`; friend links hardcode `invitedRole:"participant"`, so spectator links are
    unreachable. `docs/live-sessions.md:67` claims the browser exposes the vote range — true for
    *opening* a window, false for *casting into it*.
12. **`rest.ts:371-373` refuses `perfect_tablebase` and `practical_resistance` for pack-less runs
    under a `theory_strict` error message.** The spine rationale is true only of `theory_strict`;
    the other two are refused silently under a wrong reason, and no design doc makes them
    pack-only. This is also `design/06` §2b's Act III boss being unreachable outside a pack.
13. **Just Play attempts are never graded and contribute zero concept tags** (`progress.ts:107`,
    `:138-149`). Rows and schedules are produced; `verdict` is `"open"` forever. Concepts are the
    only cross-pack grouping key, so the mode the owner wants to be the wide one contributes
    nothing to the return loop's vocabulary.
14. **Just Play has no difficulty control at all** — `JustPlayStarter.svelte` has side, opponent
    (2 of 5 modes) and an optional FEN, and `session-controller.ts:266-271` sends no `targetElo`,
    so every run silently uses the engine's advertised default band. The band profile *is*
    published to the client (`capabilities.ts:310-313`) and unused; the only client that sets a
    band is game import, hardcoded to 1800 (`App.svelte:312`). `BACKLOG:477`'s *"an Elo slider
    already exists"* is true of the wire format and of nothing a learner can touch.
15. **`unauthoredTempoTransition` (`tempo.ts:289`) has zero production callers** — the
    unauthored-default half of the owner's own `outpaced` ruling (`BACKLOG:507`, `design/06`
    standing law 4) is built and wired to nothing.
16. **`stated_reasoning` reaches nothing**: full server path, client sheets, validator codes,
    and **one checkpoint in the repository — in a `.browser.json` test fixture**. The gating
    mechanism is `authored-feedback.ts:99-108`; with no such checkpoint the reasoning routes
    (`service.ts:1166,1199,1224`) are dead.
17. **Dead vocabulary**: `AssistanceContext.role` admits `"solo"` with zero producers (server
    roles are `host|participant|spectator`, client defaults to `"host"`); `segment_end` is a live
    branch with **0 packs**; `practical_resistance` is a shipped mode with **0 packs**; both
    tablebase guard conditions have **0 content**; `academy` has zero behavioural consumers.
18. **Simulate has two complete server verbs and zero client bytes** — `service.simulate:1233`,
    `enterSimulation:1305`, a canonical doc section (`docs/n-way-comparison.md:29-32`), an
    in-scope RFC clause (`rfc/archive/n-way-comparison.md:91`) and a **specified acceptance test
    that was never written** (`:1383-1395`; `grep -rn -i simulate tests/` → **0**). No client
    method, no controller method, no control. This is the largest single
    implemented-with-no-entry-point in the repository.
19. **The learner-initiated half of the return loop is server-only.** `duplicate` has a client
    method with **zero callers** (`api.ts:798`) and `schedule` has **no client method at all** —
    the only two run verbs in that state. Auto-schedules still populate `/learn`
    (`storage.ts:1584-1610`), so the surface is not empty; but `design/03:303` claims B7 shipped
    *"duplicate, related retry"* and the entry points did not.
20. **Three run-mutating controls are not gated for read-only viewers**: Fork
    (`DrillScreen.svelte:887`), Branch group (`:888`), and the Timeline rewind path
    (`Timeline.svelte` has **no** `access` prop; `confirmPreview` at `DrillScreen.svelte:491-494`
    fires regardless). The sibling controls at `:752`, `:825` and `:969` *are* gated, and the
    spectator browser test (`drill.spec.ts:862-864`) does not cover the three. A spectator gets a
    raw `requireWrite` error string instead of a `HonestControl` reason.
21. **Synchronized N-board replay is manual-only.** `toggleReplay` (`DrillScreen.svelte:515-533`)
    drives `previewNodeId`, which `CompareView` never reads, and the drill body is replaced while
    comparing — so `Space` is a dead key inside a comparison, though
    `rfc/archive/n-way-comparison.md:90` put synchronised replay in scope.
22. **`deriveMoveAuthorship` still reaches nothing** — 5 references repo-wide (definition
    `live-session.ts:18`, barrel export, three tests), no route, no client reference.
    `rfc/archive/social-match.md:476` intends it composed with the session journal; that
    composition was never built. *(The companion claim about `/derivations` is now false — see
    §8.)*
23. **`/graph` is not a graph.** The client reads only `graph.viewer` for lease/role resolution
    (`session-controller.ts:201-216`) and reconstructs the run from the event page; branch
    structure is surfaced only as a flat rail and a linear timeline. The endpoint's name promises
    a mechanic it does not deliver — though the *view shape* is a deliberately open question.
24. **Prediction checkpoints are code-complete and content-empty.** Parsing every JSON under
    `content/`: `intent_capture` **48**, `stated_reasoning` **1**, `prediction` **0**. The
    `CheckpointSheet` prediction UI (`:79-88`) cannot fire from any shipped pack. This one is a
    **content** gap, not a code gap — and it is the cheapest of the lot to close.

### 5.3 Absent, and arguably the most important thing in this dossier

**Theory recognition in Just Play.** `design/03:35-39` promises Just Play will *"recognize
theory, phases, structures, checkpoints, and learning opportunities as play develops… **without
first selecting a pack**."* Phases ✓, structures ✓, detected checkpoints ✓. **Theory ✗, and
completely**: every export in `packages/runtime/src/line.ts` takes a `DrillPackDefinition` as its
first argument; `compare.ts:300` sets `theory: null` without a pack; `theory_verdict` items are
produced only inside `if (pack.document.objective.type === "follow_theory")`
(`authored-feedback.ts:343`); the renderer phrases all three sentences as *"the pack"*
(`theory-presentation.ts:15-27`). And the corpus that could ground a pack-free recogniser is
CLI-only (`sourcing/`), with no `/sourcing` route.

**No stated design reason exists for this absence anywhere in `design/`, `docs/` or
`rfc/archive/`.** The nearest statements are implementation-status notes
(`docs/branch-groups.md:119`, `rfc/archive/runtime-corpus-evidence.md:102`), not doctrine — and
`design/03:346-353` explicitly *permits* shipping pack-free recognition as a passive marker.
That makes it the largest gap between a written promise and shipped behaviour in the audit.

### 5.4 The micro-DLC model, tested

The owner's frame — *"drill packs are kinda like micro-DLC… they add primitives for the engine
to detect, tips/tricks, theory tie-ins, and SOME mechanics for the campaign"* — is **half
right, and the two halves are wired in opposite directions.**

- **Grading vocabulary is pack-only through a single gate**: `service.ts:615-618`
  (`pack === undefined ? committed : orchestratePackMove(...)`). Objectives, theory verdicts,
  tempo, plan grading, deviation classes, authored checkpoints and `variantOf` all hang off it,
  and the one unauthored fallback that exists has no caller (§5.2 #15).
- **Lens vocabulary already leaks out of packs, in the learner's favour.** Shape firing,
  structural reading, transition reading and phase detection are pure FEN functions, and **a
  position run loads the full 25-entry shape catalogue while a pack loads only its declared
  subset** (`session-controller.ts:620`, documented at `docs/shape-library.md:64-65`). Just Play
  sees *more* lens vocabulary than a drill.

So packs are micro-DLC for *judgement*, and not for *sight* — which is the right split, and
which means `design/06`'s 278,256-build loadout is buildable in Just Play today at zero
authoring cost.

---

## 6. What Live tells us about the coaching/streaming/teaching mode

The owner names three activities. In code there is **one enum with three members, two of which
are load-bearing for nothing.** Combined with `broadcast-and-teacher-surfaces.md`'s finding that
*teacher* appears in no design doc, RFC or line of code, and with `rfc/teacher-surface.md`
sitting at draft, the honest statement is:

- **Streaming** is the best-served of the three, and its audience half is unreachable from a
  browser (§5.2 #11).
- **Coaching** = `academy`, which has zero behavioural consumers.
- **Teaching** does not exist as a concept; the closest primitive — a host- or teacher-drawn
  mark relayed to viewers, which `design/05` §3-forms calls *"the core communication tool for
  teaching and streaming"* — is form (b) of the dead `arrows` triad.

Nothing here is new *design* work; the `board-annotation` and `teacher-surface` RFCs own it. It
is worth stating that all three of the owner's live activities converge on the same two missing
pieces: **a mark a person can draw and relay, and an audience input path that reaches the
server.**

---

## 7. The half-integrations, ranked by cost to finish × value of finishing

Cost is an engineering estimate against the named file. Value is measured against how many
modes and how many written promises the fix unblocks.

| # | Half-integration | Cost | Value | Why here |
|---|---|---|---|---|
| **1** | **A reveal control in the run screen** — `DrillScreen.svelte:712-726` + an `onReveal` prop at `App.svelte:574`. | **XS** — one button, one prop; `api.reveal` already exists and is called twice elsewhere | **XL** | Unblocks **rungs 3, 4 and 6 in Just Play** — the owner's *"FULL toolkit"* — without touching the disclosure model, because `attempt_end` already re-closes on the next move. Highest ratio in the audit by a wide margin |
| **2** | **Per-context assistance defaults** — `assistance-preference.ts:30-33`, replacing the single `SILENT_ASSISTANCE` fallback with a per-profile default table | **XS** | **L** | Makes the six profiles mean something, delivers `design/05` §3-forms as written, and is the only way §3b's *on-ramp default* can ever exist |
| **3** | **A `tablebase:` branch in `evidence-sentences.ts:143`** | **XS** | **L** | Closes the true residual of B4's Syzygy row; the data is already fetched, stored and disclosed and currently renders as three words |
| **4** | **`shapeRecommendations` → the pack it names** — pass the `packId` through `navigate()` and give `PackList` a selection/filter (`App.svelte:667`, `PackList.svelte`) | **S** | **L** | Turns the one classification detector that ranks your own play into an actual steer, and is `design/06` §1's encounter-unlock detector becoming usable |
| **5** | **Just Play band control** — a `targetElo` field in `JustPlayStarter.svelte`, passed at `session-controller.ts:271`; bound by the shipped `MAIA3_BAND_RANGE {1000,2400}` | **S** | **L** | `BACKLOG:477` is open, the wire format and `/capabilities` already carry it, and today every Just Play game is played at an undeclared default band |
| **6** | **Authored prediction checkpoints** — add `interaction: {type: "prediction"}` to a handful of packs | **XS** — *content*, no code at all | **M** | The `CheckpointSheet` prediction UI, its server verb and its client method are all complete and **0 of 189** checkpoints can fire them. Cheapest capability-activation in the audit |
| **7** | **Read-only gating on Fork, Branch group and Timeline rewind** — `disabled` + `HonestControl` at `DrillScreen.svelte:887-888`, an `access` prop on `Timeline.svelte` | **XS** | **M** | Three run-mutating controls a live spectator can press today; the sibling controls already carry the pattern, and the honesty posture is the product's whole claim |
| **8** | **Un-invert guided mode** — decide whether `guided` gates the timeline shape markers or is retired, at `DrillScreen.svelte:207` / `Timeline.svelte:74` | **S** | **M** | A switch that gates a duplicate of an ungated feature is worse than no switch; and §3a's silence default is currently violated in code |
| **9** | **Endgame technique naming out of the pivotal modal** — a second render site alongside the structural panels (`DrillScreen.svelte:799-815`) | **S** | **M** | B10's endgame-steering gate is currently satisfied only when an unrelated forward detector fires |
| **10** | **A client for simulate** — `simulate`/`enterSimulation` on `DrillApi`, a controller method beside `createGroup`, a control in the quick-action row, a mini-board grid | **M** | **M** | Two complete server verbs, a canonical doc section and a never-written acceptance test. High value *for Drills*, none for Just Play (correctly refused) |
| **11** | **Live audience input** — wire `castVote`/`closeVote`/`resolveProposal` and either send `rotationHandles` or remove the option (`App.svelte:806-808`, `api.ts:620`) | **M** | **M** | The audience half of streaming/coaching is server-complete and browser-absent; `docs/live-sessions.md:67` currently overclaims |
| **12** | **The Just Play opponent-mode refusal** — split `rest.ts:371-373` so only `theory_strict` cites the spine, and rule whether `perfect_tablebase` is legal pack-lessly | **XS** (message) / **S** (ruling) | **M** | Cheap correctness; and if the ruling is *legal*, it hands `design/06` its Act III boss outside a pack |
| **13** | **Theory recognition without a pack** | **XL** — a corpus-backed recogniser, a pack-free `line.ts` path, and a renderer that does not say *"the pack"* | **XL** | The largest promise/behaviour gap in the product (§5.3). Ranked last **because of cost, not value** — it is a research question (`Q4c` is still a GAP row) before it is an RFC, and R9 has already bounded what a corpus oracle can reach |

Below the line, cheap and worth doing when the file is next open: `ambient`'s missing `onclick`;
the repertoire gap list's `{#if index===0}`; `CompareView.svelte:33`'s missing payload map;
`{JSON.stringify(population)}` at `App.svelte:691`; the *"Create academy"* button label that
ignores the selected kind; hoisting `api.runDerivations` out of the id-changed guard at
`App.svelte:242-252` so the derivation banners appear on the run you just entered; making
`toggleReplay` drive `compareStep` when a comparison is open; a share list + revoke control
beside `GameStoryScreen.svelte:39`; a `duplicate` control in the `/review` run list.

**Explicitly not ranked, because an accepted RFC already owns them:** the `arrows` triad
(`board-annotation`, accepted 2026-08-16); the evidence ledger (`evidence-at-runtime`,
accepted); the compare strip's census printing (`feedback-delivery`, draft); the teacher surface
(`teacher-surface`, draft).

---

## 8. Corrections to prior evidence

Each of these was checked in this pass and the earlier figure is superseded, not silently
replaced.

| Prior claim | Where | Now measured |
|---|---|---|
| *"three `localStorage` assistance keys ever"* | `campaign-intermediate-consequence.md`; `rfc/teacher-surface.md:678` | **six** (`assistance-preference.ts:4`). D82 is correctly closed; the derived claim is stale |
| *"`/settings` remains display-only"* | `design/03:297` | **36 live controls** across 6 contexts `[V]` |
| *"23 shape entries, two commissioned outstanding"* | `design/03:307` | **25**; `london-wedge.json` and `kid-chain-arrangement.json` both exist |
| *"`variantOf` has never appeared in `content/` in the entire git history"* | `authoring-vocabulary-completeness.md:270,332` | **2 packs** use it, added by `caa8afa`; D90 closed 2026-08-16 |
| *"0 of 145 checkpoints are `stated_reasoning`"* | `feedback-versus-the-dashboard.md`, `authoring-vocabulary-completeness.md` | **0 of 189** in the 47 shipping packs. The one in the repo is a `.browser.json` fixture |
| *"131 undeliverable feedback claims"* | as above | there are **182** `feedbackClaims`; **131** is the **plan-class** count. The undeliverability finding stands; the number was attached to the wrong noun |
| *"275 deviations carry no `mistake` and no `cost`"* | as above | **330** deviations; `cost` now on **144**; `mistake` still on **5** |
| *"0 of 20 opening packs declare a timing window"* | `authored-transitions-and-features.md`, `authoring-vocabulary-completeness.md` | **still exactly 0 of 20.** Four windows landed this week and **all four are `phase: middlegame`** — the `design/04` §2d gap is untouched |
| *"`SelfElo`/`OppoElo` at 1500 makes every Maia request run at band 1500"* | `engine-layer-capability-audit.md` | **fixed** by `0985fa4`; `Elo` is now sent last (`opponent-selector.ts:511-514`); D91/D60/D70 closed |
| *"`session.kind` has exactly two behavioural branches, and nothing distinguishes `stream` from `academy`"* | `broadcast-and-teacher-surfaces.md` | **four** server comparisons (two are creation-time consistency guards); `stream` **does** branch, at `assistance-preference.ts:9`. **`academy` is the fully decorative one** |
| *"`design/03:300`: Syzygy runtime rendering is a B4 residual"* | `design/03:300` | over-broad — `branch-decidedness` → `BranchRail.svelte:75` ships and is pressable. The residual is one missing `tablebase:` branch in `evidence-sentences.ts` |
| *"rewind/branch/**compare**/reveal are refused while live (`MATCH_LIVE`)"* | `design/03:94-95` | **overstated by one verb.** `service.compare` (`service.ts:965-984`) calls `requireRead` only — there are **11** `#refuseWhileMatchLive` call sites and compare is not among them. `docs/live-sessions.md:47-49` is accurate |
| *"B3 residual: narrative mode + difference strips (forward-trace orphan, ledgered)"* | `design/03:299` | **stale.** Both ship and both render — `CompareView.svelte:27-28`, `:86-98`. `BACKLOG:537` already records narrative mode as shipped 2026-08-14 |
| *"`deriveMoveAuthorship` is specified, implemented, exported, tested and reaches no viewer"* | prior inventory | **split in two.** `/derivations` **does** now reach a viewer (`App.svelte:626-630`) — that half is false. `deriveMoveAuthorship` itself still reaches nothing — that half is true, 5 references repo-wide |
| *"B7 shipped… duplicate, related retry"* | `design/03:303` | the **endpoints** shipped; `duplicate` has a client method with zero callers and `schedule` has no client method. Auto-schedules do populate `/learn` |
| *"10 authored packs are not served"* | **this dossier's own first pass** | **withdrawn** — stale server process. 0 unserved (§0) |

---

## 9. What this changes for the design tier

Three `DESIGN-GAP:` flags, all escalated to `planning/exploration/log.md` rather than resolved
here (design tier is intent tier; these are proposals, not edits).

1. **`DESIGN-GAP:` `design/05` §4 and §3-forms require assistance to vary by context; nothing
   in the code can express that.** `permittedAssistance` ignores `sessionKind` and all six
   profiles default identically. The docs describe a two-axis system where only the addressing
   axis exists.
2. **`DESIGN-GAP:` `design/03:35-39` promises pack-free theory recognition and no document
   states why it is absent.** Either the promise is amended or `Q4c` gets scheduled; today it is
   the product's largest silent shortfall.
3. **`DESIGN-GAP:` `design/05` §3b specifies guided mode as *a mode a learner chooses*, and it
   ships on by default through a different path while the switch gates a duplicate.** The
   band-shaping and fading the section requires have no implementation surface.

Two things that are **not** gaps and should stop being reported as such: the config never
reaching the server (correct by construction), and rung 5's absence in Just Play (stated design,
`design/05:341-345`).

---

## 10. Residual — what this pass did not measure

- **The four-and-eight-branch comprehension question** is untouched; `mobile-scope.md` and
  `planning/drill-client/log.md` still own it.
- **No real-engine measurement.** Every server probe ran under `ENGINE_MODE=mock`, so opponent
  *quality* claims are out of scope; R4/R5/R9/R10 own those.
- **Nothing was measured on a phone or tablet.** The control-set counts in §1.1 are at
  1440×1000.
- **Campaign is measured only as primitives.** Nothing here says whether the loop is fun; R6,
  R7 and R8 remain unanswered and experiential.
