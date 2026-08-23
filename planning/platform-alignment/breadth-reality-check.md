# Breadth reality check — paper vs. shipped, surface by surface

**Run:** 2026-08-23, by claude, on the owner's question, verbatim:

> *"so we have all the breadth and depth? game review? casting of live tournaments? historical
> games? campaign mode? analysing the players playstyle? nice bots that play human / with
> personalities? etc etc etc..."*

**Short answer: no.** The *rehearsal loop* is real and better than its documentation suggests.
Almost everything the owner named in that sentence — game review, casting, famous games, campaign,
style analysis, personality bots — is **paper, research, or nothing**. Five of the six do not exist
in code at all.

**Spine.** `design/03-product-breadth.md` is the authority for what "breadth" means; every surface
row below comes from its own inventory (§Play, §Review and explore, §Learn and return, §Live and
community, §Create and curate, §Branch groups, §Structural reading, §Adaptive guidance, §Reusable
shapes, §Intelligence and explanation, §Stable application shell) plus the owner-named asks. I did
not invent the list.

**Method, and why two columns.**

- **PAPER** — none / research-only / drafted / accepted, with the document named.
- **SHIPPED** — nothing / partial / complete, verified by reading code at HEAD and by running the
  app's own instruments. **No RFC's claim about itself was accepted as evidence.**

**Prior art, deliberately not duplicated:** `capability-reality-audit.md` (2026-08-20, commit
`b8e3649`) audits *integration* reality; `never-started-lanes.md` (2026-08-22) counts lanes;
`refused-vs-asked.md` (2026-08-23) joins asks to refusals. This file answers a different question —
**for each surface, what is written down and what actually runs.**

**Caveat stated once, up front.** The working tree is dirty: 28 files modified and 6 untracked by
concurrent agents (`packages/runtime/src/evidence-*.ts`, `apps/server/src/sourcing/*`, four RFCs).
The browser run below builds from that tree, not from a clean HEAD. Where that matters I say so.
**Anything not verified here is treated as absent.**

---

## 0. Three instrument readings, taken first

| instrument | reading |
|---|---|
| `make work-index` | `1013 ledger rows; 550 open; 549 routed; 1 unrouted` — **exits non-zero** on D1081 |
| `make status-parity` | `24 active, 72 archived, 52 open discharges, P1-P6 green` |
| `make graduation-report` | drafts: `documents: 56; blocking: 220; resolved: 30; accepted: 43`; candidates: `36 documents; 143 blocking`; **`content/packs`: `documents: 0`**; **"Graduable drafts and packs: (none)"** |
| `make verify` | **RED at HEAD** — `work-index` is a member of `verify` (`Makefile:60`) and fails |

**550 open ledger rows and 52 open RFC discharges** is the honest scale of what is not done. **Zero
packs graduate; `content/packs/` is empty.** 56 pack documents exist, all `draft`.

And the warning from the owner's own morning holds: a green instrument is not proof. `make
work-index` was green over an unrouted row yesterday (D1078); `packages/runtime/src/compare.test.ts`
is green today over a compare strip that renders empty in the real app (§3).

---

## 1. The B1–B11 gate — true state, and which criteria cannot fail

`design/03-product-breadth.md:321-333` and its mirror `planning/exploration/gates.md:239-249`.

| gate | design/03 says | true state | is the criterion falsifiable? |
|---|---|---|---|
| **B1** shell/entry | shipped; residual is presentation quality | **true.** 9 routes (`router.ts:22-32`), 9 nav destinations (`ShellFrame.svelte:25-35`), resume card (`App.svelte:624-634`). `/settings` renders 72 assistance controls + 5 appearance selects + account forms | yes — "resume works" is testable |
| **B2** solo modes | shipped in full | **true at fixture level.** Just Play (`JustPlayStarter.svelte`), Line/Plan/Outcome/Trajectory all have served fixtures and passing browser specs | **NO.** *"each completes one fixture run"* is satisfied by fixtures we wrote ourselves. It cannot fail |
| **B3** review/compare | shipped in full; residual is strip *content* | **overstated.** N-way compare, simulate, prediction, export, branch groups are real. But the difference-strip band renders **three empty containers** in the running app (§3) — worse than the D78 "low lift" residual the row describes | **NO** as written; §3 gives a falsifiable version |
| **B4** evidence | authored/SF/Maia/corpus/structural ✓; LLM half unbuilt | **true, with the default caveat**: the shipped default deployment has `ENGINE_MODE=mock` and no LLM (`compose.yaml:11`, `capabilities.ts:305`). Compiled contract is real: 20 producers / 126 projections / 25 consumers / 175 bindings | partly — the manifest compile is a real gate; "work with timing controls" is not |
| **B5** live | shipped 2026-08-13 | **true for native roles.** Host/spectator/academy/vote/overlay/Arena-leg all render (`App.svelte:907-950`). **No Twitch bridge, no casting, no live tournament follow** | **NO.** *"each complete one scenario"* |
| **B6** create | shipped; *"session distillation … does NOT exist"* | **STALE — distillation now exists.** `apps/server/src/distill.ts`, route `rest.ts:1411`, client `api.ts:1157`, button `App.svelte:714`. It writes `provenance.sources: ["session_distilled", …]` (`distill.ts:95`) | **NO.** Disjunctive: *"a candidate, **or** an import, **or** a completed run"* — any one passes |
| **B7** return | shipped; recommender orphaned | **true.** SRS + milestones + `/learn`. The repertoire-gap recommender does ship (`App.svelte:775-779`); the *pack* recommender does not | **NO.** "work" undefined |
| **B8** platform | **negative** against the O13 floor | **partly STALE.** *"no account export/backup contract"* and *"deletion retains solo runs"* are **both false at HEAD** — password-gated export (`identity.ts:177`, `rest.ts:833`) and digest-pinned hard deletion (`identity.ts:171`, `storage.ts:2120`), gated by `make account-data-lifecycle-check`. The other three clauses (Maia degradation, SBOM/notices, PWA) were not re-verified here | **yes** — the only gate with a real, failable floor |
| **B9** structural reading | shipped, qualified by A3 | **true as stated.** 11/18 families round-trip; 0/3,371 transition observations retain squares; zero families unconditionally admitted as learner events | yes, after the A3 qualification |
| **B10** adaptive guidance | shipped, qualified by A5 | **true as stated.** Mechanism ships; **one unnamed default, 2/6 workflow bindings, no per-kind ceiling.** Confirmed independently: `AssistanceSettings.svelte` renders 8 contexts × 9 raw controls and **zero presets** | yes, after the A5 qualification |
| **B11** reusable shapes | shipped, qualified by R8 | **true as stated.** 25 shape documents in `content/shapes/`; no learner-facing theory↔drill handoff | yes, after the R8 qualification |

**Six of eleven gates rest on a criterion that cannot fail.** B2, B3, B5, B6, B7 and B10's original
wording are satisfied by a fixture, a scenario, or a disjunction we author ourselves. The gates that
*did* get falsifiable criteria — B8's O13 floor, B9/B10/B11's A3/A5/R8 qualifications — are exactly
the gates that later turned out to be **negative or qualified**. That correlation is the finding: a
gate only tells the truth once someone writes a criterion that can say no.

---

## 2. The six surfaces the owner named

### 2.1 Game review — **PAPER: drafted. SHIPPED: nothing that a chess player would call game review.**

- **PAPER:** `rfc/review-evidence-compiler.md` — **draft 2026-08-23**, never accepted, nothing
  landed. Its Discharge **D1** (`:464`) explicitly puts the *learner-facing review surface out of
  scope*: *"this RFC lands packet + Story compatibility only."* `rfc/move-quality-grades.md` is
  `implementing` with D1 open.
- **SHIPPED — `/review` is a file browser with a PGN box.** The entire block is `App.svelte:728-750`:
  an `<h1>Run history</h1>`, one import form (Lichess URL / PGN textarea / your-side select /
  "Build game story"), and a flat list of runs with one button each.
- **SHIPPED — the closest thing is a highlight reel.** `GameStoryScreen.svelte` (68 lines) renders
  **at most 8 moments** (`:14`, `story.rank.slice(0, 8)`), a *disabled* board, the moment kinds
  joined by `+`, its sentences, optionally one line `Recorded trajectory: N → M cp` (`:52`), and
  "Re-enter and play from here". Moment selection is a raw 150-cp threshold (`story.ts:34,140`) over
  a scalar that coerces every mate to ±1000 (`story.ts:33,104,107`).
- **Per-move grading is dead code.** `packages/runtime/src/grade.ts` implements
  `inaccuracy|mistake|blunder` completely and has **zero production callers**. `postcommit_nudge`
  and `review_map` are string literals in `module-contract.ts:5-6`, not modules.
- `grep -riw accuracy apps/web/src apps/server/src` → **zero hits.**

| a player expects | HEAD |
|---|---|
| accuracy % | absent, zero references |
| move list with ?!/?/?? | absent (computed, never rendered) |
| eval graph | absent — one before/after line on one selected moment |
| "best move was…" | **refused by design** (law 8; `review-evidence-compiler.md:388`) |
| blunder/mistake counts | absent |
| click through every move | absent — 8 cards |

**This is not polish missing. There is no game-review feature.** Some of the gap is a deliberate
law-8 refusal (no grading, no best-move) and should stay refused. Accuracy, an eval graph and a
navigable move list are simply unbuilt, and even the honest substitutes are still draft.

### 2.2 Casting live tournaments — **PAPER: Phase A accepted. SHIPPED: nothing.**

- **PAPER:** `rfc/live-sources.md` — **accepted 2026-08-22**, Phase A (finished-round import) only.
  Phase B (the round follower) is ledger row **D957**, *"💡 open — Phase B RFC unowned."* Casting
  itself is **D958**, *"💡 open — owner B5 ruling pending, then Phase B."*
- **SHIPPED: zero lines.** `grep -rn broadcast apps/server/src apps/web/src packages/` → **no
  matches.** `imported_games.source_kind` is still `CHECK (source_kind IN ('pgn_paste',
  'lichess_url'))` at `storage.ts:4388` — the `'lichess_broadcast'` value the accepted RFC needs is
  not there. The only broadcast artifact in the repo is the disposable harness
  `tools/d947-broadcast-roundtrip-harness/`.
- **What a streamer can actually do today:** create a `stream` session from their own run
  (`App.svelte:936-938`), hold or hand off the board, open a 2–8 option vote window with a
  prompt and a duration, watch a tally with attribution, and point OBS at `/live/overlay/:runId` —
  a chrome-free board + objective + branch count + vote tally (`App.svelte:951-953`).
- **What they cannot do:** follow a real tournament, cast someone else's game, bridge Twitch or
  YouTube chat (votes are native only), or apply editorial delay. Casting a live tournament is
  **two unowned RFCs and one pending owner ruling away.**

### 2.3 Historical / famous games — **PAPER: an owner ruling, no RFC. SHIPPED: a PGN box.**

- **PAPER:** ledger **D1060** (`BACKLOG.md:388`) — *"OWNER RULING 2026-08-23: FULL LIFT of the
  famous-game refusal."* Backed by `design/research/famous-game-sources-licensing.md` (written
  today). **No RFC exists.**
- **The ruling is not in code.** `apps/server/src/capabilities.ts:159` still reads verbatim:
  `{ instrument: "Explorer", capability: "topGames / recentGames / masters database", disposition:
  "refused", reason: "Per-game scope and licence questions remain unresolved" }`, and
  `sourcing/explorer.ts:74` still pins `topGames=0`.
- **What works:** paste a Morphy PGN into `/review` and you get a run plus a story. `import-source.ts`
  accepts `{kind:"pgn"}` and `{kind:"lichess"}`; `imported_games` persists source, digest, headers,
  original bytes and licence note (`storage.ts:4386,1747`).
- **What is missing:** the lift commit; a masters/broadcast fetch client carrying the D1060
  obligations (serialised + 429 backoff, token+contact UA, no index walk, NAG/annotation stripping);
  a `sourceGame` provenance object (**zero occurrences** outside prose); any curation surface; and a
  packaging path. **Distance is not small:** `content/packs/` is empty, so a famous-game pack is
  downstream of a pack pipeline that has never produced a single published pack.
- One thing to keep in view: the ruling **strips annotations, NAGs and move verdicts at the record
  boundary**. "Fischer's 11…Nh5?? lost the bishop" is therefore *refused*, not merely unbuilt. A
  famous-game pack must be narrated by our own detectors or by an author.

### 2.4 Campaign mode — **PAPER: accepted + implementing. SHIPPED: schema and a validator.**

`rfc/campaign-core.md` is `implementing 2026-08-23`. What is code at HEAD:

| exists | file |
|---|---|
| closed JSON Schema, 3-act tuple, 10-module unlock enum | `schemas/campaign.schema.json` (138 lines) |
| TypeScript interfaces, no runtime | `packages/schema/src/campaign/index.ts` (31 lines) |
| module-set algebra | `packages/runtime/src/campaign-contract.ts` (76 lines) |
| Ajv validation + 3 semantic rules | `apps/server/src/campaign-validation.ts` |
| in-memory document registry | `apps/server/src/campaign-registry.ts` |
| the 8th workflow context | `packages/runtime/src/presets.ts:49` |

What does **not** exist: `grep -n campaign apps/server/src/storage.ts` → **zero matches**. No
`campaign_runs`, no `campaign_events`, no migration (`STORAGE_VERSION = 25`, `storage.ts:631`, and
25 is the *rating* migration). No route in `rest.ts`. **No `/campaign` route** in `router.ts:22-32`,
no campaign component, no campaign string in the client except an assistance-profile label and one
placeholder sentence. `content/campaigns/` **does not exist**; `find content -iname "*campaign*"` →
zero.

`CampaignRegistry` is never instantiated in the server bootstrap — it is reachable only from its own
unit tests.

**Fraction that is code a learner could reach: zero.** A campaign document can be type-checked and
validated; it cannot be stored, served, played or displayed. Deferred with named rows: **D1** rated
boss, **D2** prediction (shape 3) and survival (shape 4) encounter classes, **D4** evidence-dark
nodes and time controls, **D5** the whole v1 implementation. **D3** (prestige gate) was discharged
today by owner ruling D1040.

### 2.5 Player style analysis — **PAPER: research-only, closed today at 0/12. SHIPPED: nothing.**

- **PAPER:** ledger **D552** (`BACKLOG.md:148`) — the owner's ask, routed to R21. Today's landing is
  `design/research/longitudinal-style-feedback-contract.md`, whose own title is *"twelve measured
  habits, **zero production-ready cards**"* and whose status reads *"desk contract complete;
  production/transfer measurement blocked."* **There is no RFC.** Ledger **D1055** records the
  routing: *"foundation amendments + measurement precede D552 surface RFC."*
- `rfc/longitudinal-store.md` is **accepted 2026-08-22** and its own summary says it ships *"the
  store and its rebuild instrument only; every reader of it is a later RFC."* At HEAD it ships
  neither: `learner_observations` and `learner_structure_stats` appear in **three prose files and
  nowhere in `apps/` or `packages/`.**
- **SHIPPED: nothing a learner can see.** `grep -rn "habit\|longitudinal\|tendency" apps/web/src` →
  **zero hits.** Every `style` hit in the client is a CSS tag. No accuracy. No opening report —
  `rfc/runtime-opening-identity.md` was only *accepted today*, and the refusal D552 cites at
  `position-evidence.ts:25` is still shipped behaviour.
- The nearest durable data is `learner_position_stats(learner_id, transpose_key, seen_count)` — a
  "you've seen this position N times" counter with **no reading surface** — and `attempt_concepts`,
  whose only consumer is the `/learn` recommendation sentence.
- Part of the ask is already **refused on measurement**: D843 records maps-to-the-greats failing at
  ARI 0.251–0.417 against a 0.70 gate. The honest form is a labelled quiz, not a classifier.

**What a learner could see today about their own style: zero pixels.**

### 2.6 Human-like bots with personalities — **PAPER: implementing. SHIPPED: two words in a dropdown.**

`rfc/bot-policy.md` says *"no production profile is registered."* **Verified, and it is stronger
than that.**

- `apps/server/src/bot-policy-catalog.ts` is a complete 534-line stack — 7 layer kinds, compile +
  digest, Maia distribution reconstruction, SHA-256 seeded draw, ordered composition.
- `:296` — `export const BOT_POLICY_PROFILES = compileBotPolicyCatalog([]);` **Literal empty
  array.** So `botPolicyProfile()` can never return anything, and `validateProfilePolicy`
  (`opponent-selector.ts:157-171`) rejects *every* profile request against an empty roster.
- **`composeBotPolicySelection` has zero production callers** — grep across `apps/`, `packages/`,
  `tools/` returns only its own unit test. The sampler is dead code.
- `OpponentSelection` (`packages/runtime/src/types.ts:102-108`) still has **no `policy` field**; the
  decision record is never persisted.
- **What a learner can pick:** one `<select>`, `JustPlayStarter.svelte:17`, with exactly two options
  — **"Human-common"** and **"Strong engine"**. No strength dial, no name, no description. The three
  other shipped modes (`theory_strict`, `perfect_tablebase`, `practical_resistance`) are reachable
  only through an authored pack.
- **Elo honesty is genuinely good.** `outcome-presentation.ts:74-82,137-148` prints the band only
  when `eloHonored === true`, prints the literal `", band not recorded"` when honored but
  unrecorded, and explicitly says *"Target Elo N was requested but is not recorded as applied"*
  otherwise. `engine-band.ts:68-88` refuses rather than clamps. One soft spot: `DrillScreen.svelte:1132`
  renders `rating target {targetElo ?? "unrated"}` — the *requested* value, unqualified.
- **Personality is a compile error, on purpose.** `bot-policy-catalog.ts:172,236-238` rejects any
  presentation name or bio containing `human-like|aggressive|solid|tactical|positional|tricky|
  adaptive|plays like`. A shipped persona may state only what it mechanically does. That is the
  right doctrine and it means "nice bots with personalities" needs its vocabulary built first
  (D812/D843), not just a roster filled.
- **Maia is off by default.** `compose.yaml:28` puts it behind `profiles: [engines]`; server default
  is `ENGINE_MODE=mock` (`:11`). `make up` gives you a **mock opponent**; `make up-engines` gives the
  real one. Degradation is honest (`capabilities.ts:240-274,337-346`), never silently substituted.

---

## 3. The core loop — measured, not asserted

This is the product's identity: **commit → play the consequence → rewind → branch → compare →
replay under different resistance.** I ran the repo's own end-to-end acceptance test for it.

```
pnpm exec playwright test tests/browser/drill.spec.ts \
  -g "served Najdorf pack plays, rewinds, branches, compares, and exports"
→ 1 failed   (run twice; identical failure both times)
```

**What passed** (`drill.spec.ts:785-871`), i.e. what genuinely works end to end:

open pack → board renders → Inspector → "Position structure" discloses closed-by-default structural
facts → return to play → commit `Be3` → authored checkpoint *"Choose the setup"* → prediction
checkpoint *"Predict the reply"* → commit `f3` → *"Critical race resolved"* → **rewind with `r`** →
**branch with `b`**, label + intent → play the alternative → **switch branches both ways** → **`Alt+C`
opens compare** → two synchronized boards → per-branch decision sentences (*"Decision: Qd2 at +1."*),
ply counts, objective states, and honest checkpoint absence (*"Checkpoint not reached on this branch"*).

**What failed** (`:872-876`): the difference strips are **empty**. The page snapshot shows the band
heading and both `.sparkline` containers present with **zero `<span>` children**, and the
"structure and timing" and "Piece routes" groups empty too:

```
- 'heading "Evidence inspector: recorded branch strips"'
- article: strong "quiet setup" / generic "quiet setup recorded evaluation points"   ← empty
- article: strong "main"        / generic "main recorded evaluation points"          ← empty
```

`packages/runtime/src/compare.test.ts` — which asserts `evalTrail.length === [1,1]` — **passes.**
The unit test is green over a surface that renders empty in the running app. That is the same shape
as the D1078 finding this morning, and it is why I ran the browser rather than the suite.

**Honest attribution:** the harness builds from the dirty tree, and `packages/runtime/src/evidence-*.ts`
are uncommitted by another agent. I cannot separate "broken at HEAD" from "broken by in-flight work"
without a clean worktree build. Either way it is what a person running the app right now hits, and
**`design/03:325`'s B3 row is optimistic**: it describes the strip's *content* as low-lift (D78:
1.004×); it is currently **not rendering at all**.

Also note the whole browser suite runs with `ENGINE_MODE=mock` and an in-memory database
(`playwright.config.ts`). **A green browser suite does not prove real Maia or real Stockfish play.**

---

## 4. The table

Legend, and the **SHIPPED** column is judged from the user's side: **✅ shipped** (a user can reach
and use it) · **🟡 partial** (real code, real hole) · **❌ absent to a user** (nothing reachable —
including two rows where substantial code exists that no user can get to, marked in the note below
the table).

| # | surface (design/03 section) | paper | shipped | what a user can do today |
|---|---|---|---|---|
| 1 | Application shell, 9 routes, resume | accepted (`app-shell`) | ✅ | Navigate Home/Play/Learn/Review/Record/Live/Create/Library/Settings; resume the last run |
| 2 | Just Play (pack-optional) | accepted | ✅ | Start a game from either of two opponent words and play it |
| 3 | From position — FEN / PGN / shared URL | accepted | ✅ | Start from a FEN or a pasted PGN |
| 4 | From position — imported study / repertoire | accepted | 🟡 | Import a Lichess study as a repertoire; not as a drill start |
| 5 | From position — historical game | ruling D1060, no RFC | 🟡 | Paste any PGN; there is no famous-game source |
| 6 | Line Drill (opening) | accepted | ✅ | Play a served line pack, cross the book boundary, get graded theory |
| 7 | Plan Drill (middlegame) | accepted | ✅ | Commit a plan class and play the consequence |
| 8 | Outcome Drill (endgame) | accepted | ✅ | Convert/hold/save/resist against tablebase or Maia resistance |
| 9 | Trajectory Drill | accepted | ✅ | Play a multi-leg opening→middlegame→endgame fixture |
| 10 | Position Arena (two-leg) | accepted | 🟡 | Host a match session, mint invitations, paste a leg PGN back by hand |
| 11 | Run history / resume / duplicate / export | accepted | ✅ | List runs, reopen, duplicate, export PGN-with-variations |
| 12 | Rewind + fork at any legal node | accepted | ✅ | `r` to rewind, `b` to branch, label and intent recorded |
| 13 | Pairwise / N-way comparison | accepted | ✅ | `Alt+C`; up to `MAX_COMPARISON_BRANCHES` synchronized boards |
| 14 | **Difference strips** | accepted | 🟡 | The band renders; **its contents are empty** (§3) |
| 15 | Narrative mode | accepted | ✅ | Toggle a deterministic narrative over the compared branches |
| 16 | Simulate-all authored variations | accepted | ✅ | Auto-walk authored variations to a result grid |
| 17 | Deep analysis mode | accepted | ✅ | Request engine analysis on selected nodes |
| 18 | Prediction checkpoints | accepted | ✅ | Predict the reply; the number is recorded, never graded |
| 19 | Stated reasoning | accepted | ✅ | Type a reason; attributed key points unlock after recording |
| 20 | Opposite-side replay | accepted | ✅ | Flip a terminal run and replay the mirror; both link back |
| 21 | Branch groups (N candidates in parallel) | accepted | ✅ | Fork 3–N candidates, rotate through them, compare, export |
| 22 | Branch race | ledger row | ❌ | — |
| 23 | **Game review (post-game)** | **draft** (`review-evidence-compiler`) | ❌ | ≤8 highlight cards, no move list, no accuracy, no eval graph |
| 24 | Move quality grades | implementing | ❌ | Computed in `grade.ts`; **zero consumers** |
| 25 | Phase navigation and filters | accepted | ✅ | Filter the library by phase |
| 26 | Attempt scheduling (SRS) / due work | accepted | ✅ | See "Due now", repeat blocked or varied, dismiss |
| 27 | Progress / attempt history | accepted | ✅ | Flat attempt history; the UI itself says *"not a mastery score"* |
| 28 | Milestones | accepted | ✅ | Seven hard-coded firsts (first win, ten attempts one root, …) |
| 29 | Repertoire gap finding | accepted | ✅ | Import a repertoire, scan, enter the biggest corpus gap |
| 30 | Pack recommender (personal history) | orphan row | ❌ | — |
| 31 | On-ramp / immediate guard | accepted | ✅ | Guard waits for the consequence, then rewinds the decision |
| 32 | **Skills / progression (D549)** | research-only | ❌ | Zero `skill*` identifiers in code |
| 33 | **Daily position (D301)** | queued for drafting | ❌ | Nothing; only a CSV column named `dailyDate` |
| 34 | **Difficulty / rating controls** | implementing | 🟡 | Read a rating you can never earn (§ row 44) |
| 35 | Streamer session + chat vote + overlay | accepted | 🟡 | Native votes and a chrome-free overlay; **no Twitch/YouTube bridge** |
| 36 | **Casting a live tournament** | Phase B unowned; **owner B5 ruling pending** | ❌ | Nothing |
| 37 | Live tournament import (finished rounds) | **accepted** (`live-sources`) | ❌ | Zero lines; the `source_kind` CHECK still refuses it |
| 38 | Academy / coached session | accepted | ✅ | Host, invite, propose moves, vote, spectate |
| 39 | Native two-human match | accepted | ✅ | Alternate on one board; mutual pause opens rehearsal; friend links seat a player |
| 40 | Teacher / classroom | accepted, implemented | ✅ | Create a classroom, invite, assign a **pack**, receive and review submissions |
| 41 | Cohort standing | implementing | 🟡 | Renders; empty without rated games |
| 42 | Share links / spectator read-only | accepted | ✅ | Mint a scoped public token; spectators get no write control |
| 43 | Events / scheduled nights / relays / matchmaking | ledger rows | ❌ | Invitations exist but `session_invitations.state` never transitions |
| 44 | **Learner rating (Glicko-2)** | implementing | 🟡 | **The screen is reachable and can only ever say "no rated-game result."** The client API has no verb for `POST /rated-games` |
| 45 | Pack studio: author / lint / version / channel | accepted | ✅ | Create a draft, see validation issues, register it with a stamped channel |
| 46 | Session → pack distillation | accepted | ✅ | **Ships** — "Distill to draft" on a terminal run (design/03 says otherwise) |
| 47 | Corpus mining → candidate | accepted | ✅ | `make candidate-emit`; 36 candidate documents exist |
| 48 | Shape studio | accepted | ✅ | Author a shape draft, probe its trigger, register it |
| 49 | **Famous / historical game packs** | ruling only | ❌ | **Zero packs of any kind are published** |
| 50 | Structural reading (rung 0) | accepted | ✅ | Open "Position structure"; 12 predicates, closed by default, attributed |
| 51 | Adaptive guidance / pivotal markers | accepted | ✅ | Passive markers you choose to open; honest abstention |
| 52 | **Assistance presets** | implementing, D971-blocked | 🟡 | **72 raw toggles across 8 contexts; zero presets.** Ceilings unenforced client-side |
| 53 | Reusable shapes | accepted | 🟡 | Shapes attach and render; no theory↔drill handoff |
| 54 | Evidence layers (authored/SF/Maia/corpus/Syzygy/structural) | accepted | ✅ | Reveal at permitted times; **off by default** (`ENGINE_MODE=mock`, no LLM) |
| 55 | LLM-rendered explanation | accepted (seam) | 🟡 | Seam exists; requires an external provider that is off by default |
| 56 | Engine-condition surface | accepted | ✅ | Authors can make an engine reading fire a guard |
| 57 | **Player style analysis (D552)** | research-only, **0/12** | ❌ | Zero pixels |
| 58 | **Bot personas / personalities** | implementing | ❌ | **Zero registered profiles**; two words in one dropdown |
| 59 | **Campaign mode** | implementing | ❌ | No route, no table, no content |
| 60 | **Variants (D1031)** | research + derivation | ❌ | **Actively refused** in three places incl. PGN import |
| 61 | **Time controls (D1041)** | ruling + research | ❌ | `clockState` is a zero-reader passthrough; **no clock anywhere** |
| 62 | Theming (app / board / pieces) | accepted, complete | ✅ | Three independent selectors + motion, live, persisted, cross-tab |
| 63 | Account export / deletion | audit + harness | ✅ | Password-gated JSON bundle; digest-pinned four-bucket deletion preview |
| 64 | Accessible board input | awaiting owner validation | ✅ | Five input modes, permanent semantic grid, keyboard traversal |
| 65 | PWA / responsive transformation | ledger | 🟡 | Manifest only |
| 66 | Reaching a learner off-site (notifications) | ledger | ❌ | **Zero hits** for notify/email/webpush/reminder |

---

## 5. What could a person do with this right now, end to end?

Honestly, and without flattery. Assume `make up` (the documented default).

**They sign up.** A handle and a password ≥10 chars. **Wall 1:** *"There is no password recovery
yet. Keep your password somewhere safe."* (`App.svelte:605`). Forget it and the account is gone.

**They land on Home.** One sentence, one resume card (empty on day one), one "Go to Play" button.

**They go to Play.** Two things: a Just Play starter and a pack list. The Just Play starter offers
**one opponent control with two options — "Human-common" and "Strong engine."** **Wall 2:** under
`make up` the engine mode is `mock`. The opponent is a stub. To get a real human-like opponent they
must know to run `make up-engines`, which builds a 5.11 GB image. Nothing in the UI says this; it
says the capability is unavailable, which is honest but not actionable.

**They pick a pack.** **Wall 3, the big one: `content/packs/` is empty and zero packs graduate.**
What they see are 56 `draft` documents with the channel and status stamped honestly next to them —
schema examples and browser fixtures included. The graduation report counts **220 blocking issues**
across them, many of the form *"objective.summary is the emitter's mechanical placeholder; an author
must replace it."* The product is honest about this. It is still an empty library.

**They play a drill, and here it is genuinely good.** They commit a move and the consequence plays
out. An authored checkpoint fires. A prediction checkpoint asks what the opponent will do and
records the answer **without grading it**. They press `r` and the position rewinds; the first
attempt is preserved. They press `b`, name the branch *"quiet setup"*, state the intent, and play
the alternative. They switch between branches. They press `Alt+C` and get two synchronized boards
with per-branch decision sentences and honest absence (*"Checkpoint not reached on this branch"*).
They can fork four candidates as a group and rotate through all of them. **This loop is the product
and it works.** It is also, as far as I can tell, not a thing any other chess product does.

**Wall 4: the comparison stops short of explaining itself.** The difference-strip band — the part
that is supposed to say *what changed between these two branches* — renders as empty containers
(§3). What the learner gets is two boards and a sentence each. `design/03:460` names this exact
failure mode: *"a surface that shows difference without explaining consequence is a mode-menu entry,
not a drill."*

**They finish the attempt and want to know how they did.** **Wall 5.** The run banner offers
"Story": ≤8 threshold-triggered moment cards, each a door back into play. There is **no accuracy, no
move list, no eval graph, no blunder count, no opening name**. If they came from Lichess or
Chess.com, this is the moment they conclude the product doesn't have review.

**They look for a rating.** Nav says **"Record."** The screen is real, and it will say *"No
rated-game result has been recorded. Rated campaign games will appear here after they reach a
chess-rules result."* **Wall 6:** rated games are created only by `POST /rated-games`, and **the web
client has no method for it** — not an unwired button, no verb on the API type at all. And the
copy points at **campaign**, which has no route. So the Record tab is permanently empty by
construction.

**They look for a campaign, a daily puzzle, a skill tree, a style report, a named bot, a clock, or
Chess960.** **Wall 7: none of these exist.** Not hidden, not behind a flag — no route, no table, no
component. Chess960 is refused in three separate places, including PGN import, so they cannot even
*analyse* a 960 game.

**They open Settings.** Theming works beautifully: three independent selectors (app theme, board,
pieces) plus motion, applied live, persisted, synced across tabs. Then **Wall 8:** assistance is
**72 raw toggles across 8 contexts** — "Ambient presence", "Passive markers", "Human move split",
"Corpus counts" — with no presets and no explanation of what a good combination is. The five
carefully-written preset promises (*"Staged-move risk warnings, on request, before you commit. Never
the best move."*) exist in `presets.ts:31-37` and are **unreachable from the UI**.

**They try to bring a friend.** This works: a friend link seats someone in a native match, both
players see byte-identical disclosure, and a mutually-accepted pause opens rehearsal. **Wall 9:**
match runs are forced `countable:false` (`service.ts:1763`), so **two-human play and the return loop
are disjoint** — playing a friend contributes nothing to progress.

**They close the tab.** **Wall 10:** nothing can reach them again. Zero hits for notify, email,
webpush, reminder. Whatever brings them back tomorrow, it is not this product.

**The honest summary:** a person can complete a real, distinctive rehearsal loop on a fixture pack
against a mock opponent, and can share it, teach with it, or play a friend through it. They cannot
find content, cannot learn how they did, cannot earn a number, cannot progress, cannot be brought
back, and cannot reach five of the six things the owner asked about.

---

## 6. Breadth verdict

Of the **66 surfaces** `design/03-product-breadth.md` names (plus the owner's asks):

| state | count | share |
|---|---|---|
| ✅ **shipped** — a user can reach and use it | **38** | 58% |
| 🟡 **partial** — real code, real hole | **12** | 18% |
| ❌ **absent to a user** | **16** | 24% |

Splitting the 16 absent rows by what stands behind them on paper:

| behind the absence | count | rows |
|---|---|---|
| **accepted or implementing RFC, zero user reach** | **5** | game review grades (24), live tournament import (37), bot personas (58), campaign (59), and the review compiler as a draft (23) |
| **research-only or an owner ruling, no RFC** | **5** | skills (32), famous-game packs (49), style (57), variants (60), time controls (61) |
| **a ledger row and nothing else** | **6** | branch race (22), pack recommender (30), daily position (33), casting (36), events/matchmaking (43), notifications (66) |

Two of the absent rows have substantial code that no user can reach: **campaign** (schema, validator,
registry, module algebra — never instantiated in the server bootstrap) and **move-quality grades**
(complete arithmetic, zero callers). Counting them as shipped would be exactly the theatre
`design/03:18` forbids.

**Read the 38 carefully before it reads as good news.** The shipped surfaces are heavily
concentrated in one place: the **rehearsal loop and its immediate surroundings** — play, rewind,
branch, compare, groups, structural reading, shapes, live roles, studio, teacher, theming, account.
That is the foundation working exactly as breadth-first intended.

The 16 absent surfaces are concentrated somewhere else: **everything that makes a person come back
tomorrow.** Review, rating entry, campaign, skills, daily, style, personas, clocks, variants,
notifications. The build has a superb middle and no front door and no back door.

### The three biggest gaps, ranked by the owner's stated interest

**1. Game review — the highest-frequency thing every competitor has and we do not.** Draft RFC whose
own D1 puts the learner surface out of scope; grading arithmetic complete with zero consumers; no
accuracy, no move list, no eval graph. This is also the surface that feeds three others the owner
wants: skills (D549 credits from review), style (D552 aggregates from review), and campaign progress.
**It is the single highest-leverage unbuilt thing in the repo.**

**2. Nothing a learner does accumulates into anything.** Campaign is a schema. Rating is a screen
that cannot be fed. Skills do not exist. Style does not exist. The longitudinal store is accepted
with zero tables. `attempt_concepts` has been shipped and consumerless since D300. Friend games are
`countable:false`. Today's R21 result — **0 of 12 habit metrics production-ready even after the
accepted store** — is the measured version of this: the accumulation layer is not one missing RFC,
it is a chain of five, none of which has shipped a line.

**3. Content — the library is empty, and the loop that would fill it produces nothing publishable.**
Zero graduable packs, zero published packs, 220 blocking issues across 56 drafts, and 0 packs built
from a historical game. Every authoring mechanism works (studio, distillation, mining, channels);
the output is zero. The famous-game lift the owner ruled today lands into a pipeline that has never
produced a pack, so "famous game pack" is two problems, not one.

**Runner-up worth naming:** the difference strips (§3). It is small, it is in the core loop, and
`design/03` itself says a comparison that shows difference without explaining consequence is the
failure shape this product dies in.

---

## 7. Corrections owed to intent documents (law 5 — proposed, not written)

I did not edit `design/`, `planning/exploration/gates.md`, or `design/BACKLOG.md` (the ledger is held
dirty by another agent). These are owed:

1. **`design/03:328` (B6) is stale in the product's favour.** *"Session distillation … does NOT
   exist"* is false: `apps/server/src/distill.ts`, `rest.ts:1411`, `api.ts:1157`, `App.svelte:714`.
2. **`design/03:330` (B8) is stale on two of five clauses.** *"no account export/backup contract"*
   and *"deletion retains solo runs"* are both false at HEAD and gated by
   `make account-data-lifecycle-check`. The other three clauses were not re-verified.
3. **`design/03:325` (B3) is optimistic.** The difference strips do not render content at all; the
   D78 "low lift" framing understates it. A falsifiable replacement criterion is owed.
4. **`gates.md:239` (B1) is stale**: it still says *"`/settings` remains display-only"*, which
   `design/03:323` already corrected on 2026-08-21 but the mirror did not inherit. **The gate
   surface is split right now.**
5. **A ledger row is owed** for the empty-difference-strip defect found in §3, with the clean-tree
   attribution question named.
6. **A ledger row is owed** for `capabilities.ts:159` still carrying the refusal that D1060 lifted.

---

## 8. What this file does not claim

- It does not re-verify Maia degradation behaviour, SBOM/distributed notices, or PWA state — three
  of B8's five floor clauses.
- It does not measure quality of anything: whether a drill teaches, whether a moment is worth
  reading, whether the loop is fun. Those are validation-by-use questions and belong to a play
  session, not an audit.
- Its counts are true at this HEAD with this working tree and at no other. `make work-index` is the
  instrument that should make the ledger half of this file unnecessary; it fails today.
