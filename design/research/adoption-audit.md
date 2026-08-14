# Adoption audit — every loved competitor feature vs what we ship

- Date: 2026-08-14
- Feeds: `design/02` §Adoption posture (the mining-list mandate), Q1a/E1 (closes the
  loop on the teardown program's second question), Q2 (pricing observations routed),
  `design/BACKLOG.md` (ledger-row proposals in §7).
- Method: synthesis, no new external research. Every teardown and sweep in this
  directory was read in full (taketaketake, ChessMotive, Chess2Story, ChessMind AI,
  365chess, chess.com practice + platform, Dr. Wolf, CET, Noctie, Chessable, both
  coverage sweeps, `competitor-value-props.md`); every "best steal" / loved-feature /
  one-good-feature finding was extracted and checked against the shipped surface
  (`docs/*`, B1–B11 states in `design/03-product-breadth.md`) and the ledger
  (`design/BACKLOG.md`). Evidence labels are inherited from the cited dossiers; claims
  about our own product cite the canonical doc. This dossier makes no new external
  factual claims.
- Owner ruling applied throughout (2026-08-14): **a conflict with an invariant is a
  design prompt, not a veto.** Rulings constrain the *form* of a feature, never its
  existence. The proof-pattern already in the repo: real-time move advice collides
  with the silence default, and guided mode (`05` §3b) *is* its transformation —
  opt-in, names patterns, never prescribes here. §5 does that same move for every
  collision found. "No version survives" would require the transformation to collapse
  the invariant itself; this audit found **zero** such cases.

## 1. The governing rule

`design/02` §Adoption posture: the market's shape IS the fragmentation — each product
is one good feature with the rest missing. The differentiator is the integrated loop;
everything else may be adopted freely, each adopted feature entering through a `05` §1
invariant (silence default, commit-before-learning, attempts preserved, grounded
claims). The coverage matrix is a mining list. This audit is the mine's ledger.

## 2. The audit table

Statuses: **SHIPPED** (works today, doc cited — includes features shipped in
transformed, invariant-compatible form), **LEDGERED** (BACKLOG row exists, cited),
**MISSING** (no row, no surface). Partial states are noted inline rather than given a
fourth status.

### Take Take Take (`teardown-taketaketake-desk.md`)

| # | Feature + love-evidence | Status | Missing: entry / cost / conflict | Verdict |
|---|---|---|---|---|
| 1 | Zero-effort game-story summary of a finished game — "picks out the key moments… generates a short summary" `[V]`; a funded team bet the product on it | **SHIPPED** for imported games — grounded moments, ≤8 displayed, every moment a door into play (`docs/game-import-and-story.md`) | — | adopted-and-exceeded: theirs is read+confabulated, ours is grounded+re-enterable. Residuals are rows 2–3 |
| 2 | One-tap share card with a suggested title — "share with a single tap. It even suggests a title" `[V]` | **MISSING** — the doc names it: "Story-card image rendering and public share-card hosting are not implemented; the story JSON is the future renderer's grounded data contract" | Entry: grounded claims (card renders story JSON only; title via packet-bound voice or deterministic) + attempts-preserved (card links back into the run). Cost: client renderer + a public read path (live platform has no anonymous share token, `docs/live-sessions.md` §limits). Conflict: none | **adopt** — cheap shortlist |
| 3 | Ambient accountability — "when the people who follow you can see that you haven't played in two weeks, there's a quiet pull back to the board" `[V]` | partial: the single-player transformation ships (`/learn` due queue, `docs/return-and-progression.md`); the social-graph form is **MISSING** | Entry: would need a follower surface (B5-community depth). Cost: hosted social layer + moderation. Conflict: none of the `05` invariants; purely sequencing | transform: due-work is our pull-back today; follower feed deferred to B5's revival conditions |
| 4 | Medals as re-enterable records — "Revisit the games and sessions behind every medal" `[V]` | **MISSING** | Entry: attempts-preserved (a milestone is a pointer into preserved runs) + honest-progress posture transformed: milestones record *events* ("first held save", "ten attempts on one root"), never skill percentages (`docs/return-and-progression.md` deliberately shows no mastery number). Cost: server derivation over existing `attempts` tables + client. Conflict: none once event-shaped | **adopt** — cheap shortlist |
| 5 | Cross-rating club competitions — "built to work across rating levels" `[V]` | LEDGERED as a design surface (`design/03` §Live: events, cohorts, pack nights); minimal-real B5 shipped without it | — | adopt later via B5 events depth |

### ChessMotive (`teardown-chessmotive-desk.md`)

| # | Feature + love-evidence | Status | Missing | Verdict |
|---|---|---|---|---|
| 6 | Step-indexed reasoning transcript — "where did your process break: generation, elimination, selection, calculation, judgment" `[V]` | **LEDGERED** — BACKLOG "Step-indexed reasoning transcript (steal from ChessMotive)", 2026-08-12 | — | adopt per row; composes with prediction checkpoints and row 20 |
| 7 | Category-scan scaffold (checks → captures → threats → improvement → pawn moves) `[V]` | **LEDGERED** — BACKLOG "Category-scan scaffold for the on-ramp", 2026-08-12 | — | adopt per row; on-ramp band |
| 8 | Withhold-until-commit feedback timing `[V]` | **SHIPPED** (ADR-0006; `docs/explanation-grounds.md` withholding) + ledgered as external validation (BACKLOG "Feedback-timing convergence") | — | already ours; their convergence is corroboration |
| 9 | Retention layer: XP, coins, streaks, leaderboard, collection `[V]` | **MISSING** | Entry: collides with the honest-progress posture (no mastery claims). Transformation: the return ladder (shipped) + event-shaped milestones (row 4); streak pressure and skill-scores dropped, revisitability kept. Cost: covered by row 4. Conflict: resolved by the transformation | transform into row 4; do not import XP/streaks as-is |
| 10 | Per-position comment threads `[V]` (same shelf as chessgames.com kibitzing, sweep 2) | **MISSING** | Entry: grounded claims — comments are attributed human prose (rung 5) with visible channel/provenance, never system voice. Cost: hosted community layer + moderation. Conflict: none structurally; cost is the issue | adopt later — structural shortlist, low rank |

### Chess2Story (`teardown-chess2story-desk.md`)

| # | Feature + love-evidence | Status | Missing | Verdict |
|---|---|---|---|---|
| 11 | Provenance block — machine-replayed score verification, cited lineage, dated verification, honest hedging `[V]` ("the best grounding discipline yet seen on the fan shelf") | **SHIPPED** in substance: movetext digest + licence note + verbatim source PGN on import (`docs/game-import-and-story.md`), licence enforcement and evidence/source linkage in sourcing (`docs/content-sourcing.md`), pack provenance + rendering allow-list (`docs/pack-studio.md`) | — | ours matches the discipline; a user-facing "verified" presentation is polish, not a gap |
| 12 | Moment-card + board-jump — "Click one — the board above jumps there" `[V]` | **SHIPPED** and exceeded: selecting a moment forks a `story-reentry` branch into live play (`docs/game-import-and-story.md` §Re-entry) | — | adopted; the unclaimed atom (the door into play) is exactly what we ship |
| 13 | Per-artifact pricing with credits-refund-on-failure `[V]` | not a feature — a business observation | — | **route to Q2** (monetization axis open); ledger proposal §7.9 with 365chess PWYC and the chess.com paywall-resentment finding |
| 14 | Audio-narrated fiction renderings `[V]` | **MISSING** and out of scope: fan-shelf artifact direction, orthogonal to the loop | — | no adoption; the grounded slice of it (audio delivery of *our* story sentences) is row 24 |

### ChessMind AI (`teardown-chessmindai-desk.md`)

| # | Feature + love-evidence | Status | Missing | Verdict |
|---|---|---|---|---|
| 15 | Course-position → Maia sparring as one motion — "the closest any surveyed product comes to our opening→play-out seam" `[V]` | **SHIPPED** — Line Drill theory → boundary crossing → play on vs recorded policy (`docs/README.md` Line Drill cross-layer contract); trajectory legs (`docs/trajectory-drill.md`) | — | adopted and exceeded (preserved attempts + comparison after the seam) |
| 16 | Maia-2 as in-browser ONNX with Elo conditioning `[V]` (code-verified) | **LEDGERED** — BACKLOG "Browser-run engines" row, updated 2026-08-14 with this exact proof | — | adopt per row when hosting cost bites (Q2) |
| 17 | Endgame trainer resistance framing — "mistakes punished immediately… the only way the technique becomes automatic" `[V]` | **SHIPPED** — outcome grading with independent resistance attribution (`docs/outcome-drill-grading.md`) | — | adopted; ours additionally proves which resistance actually played |
| 18 | Weakness scan → study plan (bulk username import) `[V]` | transformed & **SHIPPED**: opt-in recommender (B7) + one-game import by choice (`docs/game-import-and-story.md`); account-level fetch-all stays out (ADR-0003, game-import BACKLOG row) | — | transformation already ruled and shipped |
| 19 | ChessGPT open-answer quiz — learner types their answer in prose, graded into covered/missed key points `[V]` | **MISSING** | Entry: commit-before-learning (a stated-reasoning checkpoint interaction) + grounded claims, transformed: grade *coverage of authored key points only* — "the author's points you did not mention" — never a free chess verdict; LLM as comparator with deterministic fallback, same seam as `docs/adaptive-guidance.md` voice. Cost: schema (key-point vocabulary on claims) + server grading contract + client. Conflict: ADR-0005 tension is real and the transformation is exactly what contains it | **adapt via RFC** — structural shortlist; composes with row 6 |

### 365chess (`teardown-365chess-desk.md`)

| # | Feature + love-evidence | Status | Missing | Verdict |
|---|---|---|---|---|
| 20 | Per-position evidence row: frequency + **last-played recency** + depth-labelled eval `[V]` — 19 years of survival on this surface | **LEDGERED** — BACKLOG "Last-played recency in explorer evidence", 2026-08-14. But the carrier surface (in-product explorer evidence at runtime) is a **B4 residual** — explorer data is operator-side only today (`docs/branch-groups.md`: "the live explorer remains an operator-side sourcing tool") | Entry: grounded claims (source + population + window on every number). Cost: server crossing (runtime explorer evidence kind) + client rail rendering. Conflict: ADR-0006 timing only — evidence rail rules already govern it | adopt — recency per ledger row; the runtime corpus surface is structural shortlist #1 and the honesty item in §6 |
| 21 | Named-opening browse funnel (name → stats → games → play it) — "the browse path is a natural funnel whose last hop they leave as a bare Stockfish game" `[V]` | partial: the last hop (position → play) is **SHIPPED** (`docs/shape-library.md` position player); named-opening catalog browsing is **MISSING** | Entry: Learn IA + grounded rung-4. Cost: content (opening skeletons exist in sourcing, `docs/content-sourcing.md`) + client pages. Conflict: none | adopt in the content era; low urgency |
| 22 | Per-position personal notes (supporter feature) `[V]` | **MISSING** | Entry: attempts-preserved adjacency (notes on your own runs/positions); Library surface (`design/03` shell). Cost: small schema + client. Conflict: none | adopt later; cheap but low love-evidence |
| 23 | Guess-the-database-move trainer (popularity-graded recall) `[V]` | transformed & **SHIPPED**: frequency is evidence, never the grader — theory grading is authored membership + three-way verdict (Line Drill contract) | — | the transformation is the shipped design; the raw form is the rung-4 classic error and stays out |

### Chess.com — practice + platform (`teardown-chesscom-desk.md`, `teardown-chesscom-platform-desk.md`)

| # | Feature + love-evidence | Status | Missing | Verdict |
|---|---|---|---|---|
| 24 | **Auto-offered post-game review ritual** — review offered the moment the game ends, walkable Key Moments, coach voice; "the habit loop is proven at ~175M-visit scale" `[V]`; a free user credits it for 900→1250 | **MISSING** for our own runs — the story projection ships for *imported* games only (`docs/game-import-and-story.md`); no auto-offer motion exists at a native run's terminal | Entry: commit-before-learning (post-game = the one surface where the full ladder may speak, `05` §3a backward detectors) + attempts-preserved (every moment a door back into play). Cost: server — extend `GET /runs/:id/story` to native runs (all detectors already shipped: `docs/adaptive-guidance.md` retrospective pivots, phase changes, endgame census, shape spans); client — terminal offer sheet. Conflict: none | **adopt — #1 cheap adoption.** The single highest love-evidence × lowest cost item in the audit |
| 25 | Retry Mistakes — re-enter your own mistake (1-ply puzzle, Diamond $119.99/yr) `[V]` | transformed & **SHIPPED**: full re-entry under resistance with preserved attempts (branch runtime; story re-entry) vs their one-ply form | — | already exceeded; their gating is demand evidence for our free posture |
| 26 | One-click "Practice vs Computer from any position" `[V]` | **SHIPPED** with fork semantics instead of overwrite (rewind forks; `docs/branch-runtime.md`) | — | adopted-and-corrected (their takeback destroys, ours preserves) |
| 27 | Outcome-framed drill titles ("Holding The Draw") `[V]` | **SHIPPED** — win/hold/save/resist objectives + declared honest target (`docs/outcome-drill-grading.md`; `design/00-thesis.md` §Why anyone would use it) | — | adopted; ours adds assessability honesty (tablebase vs authored claim) |
| 28 | Switch Sides one click mid-drill `[V]` (users report years of confusion finding it) | **LEDGERED**/partial — mirror/opposite-side actions are design-committed (`design/03` B2 Outcome Drill actions; `02` §UX commitments; pack 0.6 `retryVariants` vocabulary shipped) but no doc evidences a shipped one-click mirror control | Entry: attempts-preserved (mirror = a new attempt, source preserved). Cost: client + run-creation option. Conflict: none | **adopt — cheap shortlist**; close the residual and make discoverable what chess.com hides |
| 29 | Play Coach — praise/warnings/hints during play, four voiced coaches `[V]` | transformation **SHIPPED**: silence default + assistance rail on request + guided mode that names patterns and never prescribes here (`05` §3a/§3b; `docs/adaptive-guidance.md` per-session preferences). The worked contrast is already canon (`design/02`) | — | transformed and shipped; the remaining adoptable half (the *voice*) is row 31 |
| 30 | Largest pool / instant human matchmaking `[P]` (top loved feature) | **MISSING** natively — B5 ships external handoff + two-leg Arena by design | Entry: B5's posture is *sequencing*, not never (revival conditions: loop validated + community exists). Transformations available now: (a) "play this position vs a friend" link — grants + sessions + Arena legs nearly ship it; missing only an anonymous/public share token (`docs/live-sessions.md` §limits); (b) scheduled pack nights (design surface, row 5); (c) async two-leg position matches — **shipped**. Cost of (a): token + invite flow. Conflict: none at friend-link scale | transform: ship the friend-link; native pool stays behind B5's revival conditions |

### Dr. Wolf (`teardown-drwolf-desk.md`)

| # | Feature + love-evidence | Status | Missing | Verdict |
|---|---|---|---|---|
| 31 | **Spoken patient-coach persona** — "just like my grandfather"; voice mode "transformed our app"; the single most-praised element at 4.8★/27k `[V]` | partial: the persona *text* seam is **SHIPPED** — packet-checked voice endpoint, persona prompt, deterministic fallback, no provider bundled (`docs/adaptive-guidance.md` §voice). Spoken audio (TTS) and a shipped provider are **MISSING** | Entry: silence default — same warmth, arriving *after* commitment (the teardown's own entry spec) + ADR-0005 (packet-only wording). Cost: provider config + client audio; zero schema. Conflict: none — the timing transformation is already ruled | **adopt — cheap shortlist.** The beloved tone with our timing and grounding |
| 32 | "Are you certain?" blunder-guard before the move stands `[V]` (the grandfather quote is literally about this dialog) | **LEDGERED** in transformed form: pre-commit retraction inverts commit-before-learning, so the ruled form is the on-ramp *post-commit* blunder-guard — consequence within ~2 plies, then rewind offered (`design/00-thesis.md` §Target player; BACKLOG authoring-friction row: re-add `immediate_blunder_guard` as a real policy; BACKLOG "Punishment-free experimentation": rewind *offered* after failed recovery) | — | transform per ledger; the encoding gap is real and already on the books |
| 33 | Flip sides after a blunder — "so I can better appreciate my mistake" `[V]` | **MISSING** | Entry: attempts-preserved — fork at the mistake, learner takes the punishing side, both lines survive. Cost: small (fork + side-swap option, composes with row 28). Conflict: none | **adopt — cheap shortlist** |
| 34 | Mistake-resurfacing ritual ("reviews past moves with users") `[V]` | transformed & **SHIPPED**: return queue resurfaces the *attempt in its run*, forkable, linked to source (`docs/return-and-progression.md`) — vs their orphaned positions | — | adopted per the teardown's own upgrade spec |
| 35 | Unlimited undo / judgment-free practice `[V]` | transformed & **SHIPPED**: rewind forks, consequence mandatory, retry free (`05` §1; `design/00-thesis.md` §Why) | — | the founding transformation of the product |

### Chess Endgame Training (`teardown-cet.md`, `competitor-value-props.md` §1)

| # | Feature + love-evidence | Status | Missing | Verdict |
|---|---|---|---|---|
| 36 | Instant-restart / speed — fast warm loop `[V]` hands-on; K9's origin | **SHIPPED** as ruled worry/intervene budgets + measured envelopes (`design/02` §UX commitments; branch switch 45–53 ms measured, D16 closed; per-doc envelopes in `docs/*`) | — | adopted as a standing tripwire; K9 stays armed |
| 37 | Real-time objective-state banners ("Unfeasible mate") — "the closest thing to outcome-preservation feedback seen in any product" `[V]` | **SHIPPED** and exceeded — monotone objective grading plus the *why* CET never gives (`docs/outcome-drill-grading.md`, `docs/explanation-grounds.md`) | — | adopted; their gap (state-flip without teaching) is our filled Q8 surface |
| 38 | What-if mode — "move also the opponent's pieces" `[V]` | **MISSING** — `/simulate` walks authored variations only (`docs/n-way-comparison.md`); no free two-sided steering exists | Entry: run-is-sole-truth — record steered plies as a real branch with honest actor attribution (the `system`-actor seam simulate already uses), never fabricated selection events. Cost: runtime actor path + client toggle. Conflict: assistance timing — available at checkpoints/review like other exploration, not mid-commitment | **adopt — cheap shortlist** |
| 39 | Automatic resolution of trivial positions `[V]` | **MISSING** — Syzygy triviality is a named B4 evidence layer (`design/03` §Intelligence) with runtime rendering unmet | Entry: grounded claims (rung 1; abstain out of range). Cost: server Syzygy runtime crossing + orchestration rule. Conflict: none | adopt inside B4 completion |
| 40 | Per-position personal record `[V]` | **SHIPPED** as data (`learner_position_stats`, migration 6, `docs/return-and-progression.md`); presentation deliberately claim-free | — | adopted; visible form arrives with row 4 milestones |
| 41 | FEN-in-URL with a target objective `[V]` | **SHIPPED** — position player from FEN (`docs/shape-library.md`); drill-address grammar tooled (BACKLOG notes its routing residual) | — | adopted; residual tracked |

### Noctie (`teardown-noctie-desk.md`, `competitor-value-props.md` §2)

| # | Feature + love-evidence | Status | Missing | Verdict |
|---|---|---|---|---|
| 42 | Human-like resistance from any position, no clock pressure `[V]` | **SHIPPED** — Maia sidecar policies + position runs (`docs/engine-workers.md`, `docs/shape-library.md`) | — | adopted; the strongest demand-proof for our opponent layer |
| 43 | Live per-move color labels, per-quality configurable `[V]` ("real time feedback works much better for me" — one user) | transformation **SHIPPED**: the *information* arrives post-commitment via the evidence rail; the *configurability* ships as per-session-kind assistance preferences with silence default (`docs/adaptive-guidance.md`) | — | transformed; the raw timing stays out (ADR-0006) |
| 44 | Saved sparring positions revisited with varied replies `[V]` | **SHIPPED** — varied-repetition ladder (`docs/return-and-progression.md`) + `per_branch` resistance variation (`docs/branch-groups.md`) | — | adopted |

### Chessable + Chessbook (`teardown-chessable-desk.md`, sweep 1 cluster 6)

| # | Feature + love-evidence | Status | Missing | Verdict |
|---|---|---|---|---|
| 45 | MoveTrainer SRS — the proven retention engine `[P]` | transformed & **SHIPPED**: scheduling over episodes/attempts, not cards; deliberately explainable, not FSRS (`docs/return-and-progression.md`) | — | adopted at our unit of learning |
| 46 | Bot-from-course-position — "the highly requested feature" `[V]` | **SHIPPED** with the tie-back Chessable lacks (the loop itself; Line Drill boundary crossing) | — | adopted-and-exceeded: theirs is a one-way handoff, ours returns the game as attempts |
| 47 | Soft-fail engine-vetted alternatives `[V]` | **SHIPPED** — `accepted_alternative` deviations + three-way verdict (Line Drill contract, `docs/drill-pack-format.md`) | — | adopted; ours explains the alternative rather than bouncing you to the text move |
| 48 | **Chessbook repertoire gap-finding** — per-opening coverage, transposition handling, scanning your games for repertoire mistakes; "the default recommendation in this space" `[V]` | **MISSING** | Entry: grounded claims — coverage computed against band-explorer data with population labels; ADR-0003 transformed — the repertoire and any games are *imported by choice* (importers ship: `docs/pack-studio.md`, `docs/game-import-and-story.md`); no account-level mining. Cost: server (coverage analysis; needs the runtime explorer crossing, row 20) + client tree view. Conflict: none after the opt-in transformation | **adapt via RFC** — structural shortlist |

### Sweep-only finds (`coverage-gap-sweep.md`, `coverage-sweep-2-notability.md`, `competitor-value-props.md`)

| # | Feature + love-evidence | Status | Missing | Verdict |
|---|---|---|---|---|
| 49 | OpeningTrainer corpus-exact opponent ("plays Nf6 68% of the time") `[V]` | adapted & **SHIPPED** via Maia `human_common` (human-likeness with policy mass recorded); explorer-frequency-sampled replies deliberately kept operator-side (`docs/branch-groups.md`) | — | hold the shipped form; revisit only if Line Drill believability fails (H5) |
| 50 | Chess vs Chat — chat votes tallied per turn, names rendered `[V]` | **SHIPPED** — advisory vote windows + chat-adapter relay namespace (`docs/live-sessions.md`) | — | adopted; emote cosmetics are polish |
| 51 | Chessido coach-controlled classroom board + homework analytics `[V]` | board control **SHIPPED** (`host_directed`/`rotation` policies, possession journal, `docs/live-sessions.md`); homework/assignment analytics **MISSING** | Entry: B7 attempt data already exists; a cohort view is derivation. Cost: hosted cohort surface. Conflict: none; B5-depth sequencing | defer to B5 depth; note the analytics angle for the academy surface |
| 52 | ChessDojo sparring protocol — "our pedagogy with humans doing the orchestration by hand" `[P]` | **SHIPPED** — the loop industrializes exactly this (instant partner, preserved branches, objective tracking) | — | adopted wholesale, as `competitor-value-props.md` prescribed |
| 53 | WhyThisMove checkpoint AI sidebar (fast/deep tiers) `[V]` | partial **SHIPPED**: evidence rail + grounded deterministic sentences + deep analysis (`docs/explanation-grounds.md`, `docs/n-way-comparison.md`); evidence-bound LLM *rendering* remains the packet-checked seam without a provider (B4 residual) | Entry: ADR-0005 packet contract (ruled). Cost: provider config; prompt/UX. Conflict: none — designed for | adopt the remaining half with row 31 |
| 54 | Lichess studies — shareable persistent variation trees `[P]` (loved as a teaching medium) | **SHIPPED** as runs + preserved branches + branch-selective PGN export + spectator projections (`docs/branch-runtime.md`, `docs/live-sessions.md`) | — | adopted with opponent + attempts semantics studies lack |
| 55 | Lichess identity: everything free, no ads, open source `[P]` (its top loved "feature") | **SHIPPED** as posture — AGPL-3.0, free thesis, CC-BY-SA content (`design/02`) | — | ours by construction |
| 56 | WintrChess free unlimited review — the paywall resentment valve `[P]` | **SHIPPED** by posture + game import; our review adds re-entry, which their users name as the gap ("lacks feedback") | — | adopted |
| 57 | chessvision.ai capture-anything position import (scan books/sites/video) `[V]` | **MISSING** | Entry: Create imports adjacency (B6). Cost: third-party model/integration. Conflict: none | adopt later; low priority, note for the import surface |
| 58 | Chess Yourself — an opponent model trained on *your own* games `[V]` ("your toughest opponent is in the mirror") | **MISSING** | Entry: ADR-0003 transformed — opt-in, an *opponent* rather than a diagnosis engine, so the v1-identity hazard does not apply to the form. Cost: heavy — Q5-class model work. Conflict: none in form; large in effort | watch — ledger row proposed, not near-term |
| 59 | En Croissant / ChessMonitor — all-your-games personal database, progress dashboards, opponent scouting `[V]` | transformed & partial: one-game import + `/learn` history ship; bulk personal-history mining stays opt-in-never-required (ADR-0003); Library depth is a designed surface (`design/03` shell) | — | hold; dashboard-style skill claims stay out, run history depth grows with the Library surface |
| 60 | Aimchess weakness diagnosis → exercise feed `[P]` | transformed & **SHIPPED**: opt-in recommender (B7) without the auto-generated drill feed the thesis excludes | — | transformation already ruled and shipped |

## 3. Counts

Of 60 audited features: **34 SHIPPED** (including 12 shipped in explicitly transformed
form), **7 LEDGERED** (rows 5, 6, 7, 16, 20, 28, 32 — citations inline), **19 MISSING**
in whole or in decisive part (rows 2, 3, 4, 10, 14, 19, 20-carrier, 21, 22, 24, 30,
31-audio, 33, 38, 39, 48, 51-analytics, 57, 58). No loved feature was found whose every
invariant-compatible form collapses an invariant: **the refusal set is empty**; every
collision transformed (§5).

## 4. Shortlist A — cheap adoptions (high love-evidence, low cost, no conflict)

1. **Auto-offered post-game story for native runs** (row 24; chess.com ritual × TTT
   appetite × our shipped detectors). Everything hard already ships — extend the story
   projection past imported runs and offer it at the terminal. The habit loop is proven
   at platform scale and monetized elsewhere at $119.99/yr; ours is the version with
   doors back into play.
2. **Spoken coach persona** (row 31; Dr. Wolf's most-praised element). The packet-check
   seam, persona prompt and deterministic fallback ship today; add provider config and
   audio delivery. Beloved tone, our timing, our grounding.
3. **Revisitable milestones** (row 4; TTT medals + CET personal records + ChessMotive's
   retention need, transformed). Event-shaped, claim-free, every milestone a link into
   preserved runs. Pure derivation over shipped tables.
4. **Flip-sides + one-click mirror retry** (rows 33 + 28; Dr. Wolf + chess.com). Fork at
   the mistake and take the punishing side; close the design-committed mirror residual.
   Small client/runtime work on shipped fork machinery.
5. **Grounded share card with suggested title** (row 2; TTT). The doc already names the
   story JSON as the renderer's contract; add the renderer and a public read token.
   Honourable mention: **what-if steering** (row 38) — cheap and the only CET feature we
   still lack.

## 5. Shortlist B — structural adoptions (worth an RFC)

1. **Runtime corpus/explorer evidence surface** (row 20 carrier + row 21). The one place
   incumbents are honestly ahead of us (§6.1). Brings frequency + recency + population-
   labelled stats into the in-run rail and Learn browse; unblocks row 48. B4's
   corpus-rendering residual is the natural RFC home.
2. **Repertoire gap-finding** (row 48, Chessbook). Coverage analysis of an imported
   repertoire against band-explorer data; opt-in own-game scan. Depends on #1.
3. **Stated-reasoning capture + open-answer grading** (rows 6 + 19, ChessMotive +
   ChessMind transformed). One RFC: transcript rows as checkpoint interactions, graded
   as coverage of authored key points, LLM as comparator behind the shipped packet
   seam. The most design-care-intensive item here (ADR-0005 adjacency).
4. **Friend-link play** (row 30 transformation (a)). Anonymous share token + invite
   flow over shipped grants/sessions/Arena legs — the minimal loved version of "the
   pool" that B5's posture already permits.
5. **Community annotation threads** (row 10) — structurally fine (attributed rung-5
   prose), expensive in moderation; last in line until hosting matures.

## 6. Where our shipped version is WEAKER than the incumbent's

Honesty over flattery:

1. **Runtime corpus evidence.** 365chess shows any visitor frequency + last-played +
   depth-labelled eval per position; Lichess's explorer is free and universal. Our
   explorer data is operator-side sourcing only; the B4 corpus/Syzygy runtime layers
   are unmet. A 2007 PHP site out-ships us on rung 4 today (row 20; §5.1).
2. **Share artifacts.** TTT ships one-tap share cards; Chess2Story ships four
   renderings. We ship story JSON with no image, no public token, no card (row 2).
3. **Voice.** Dr. Wolf ships four ElevenLabs coach voices; Chessvia is voice-first. We
   ship a text seam with no provider and no audio (row 31).
4. **Catalog depth.** ChessMind sells 56–69 GM courses, 365chess 258, Chessable
   thousands; we hold ~3 packs and 4 shape entries. Deliberate (content-last ruling) —
   but a user comparing shelves today sees ours nearly empty.
5. **Mobile.** Dr. Wolf, TTT, ChessMind are native apps; our PWA transformation is an
   open B8 residual. The band we serve lives on phones.

## 7. Proposed ledger rows (report-only; BACKLOG is owner-tier)

1. Post-game story ritual for native runs — auto-offer at terminal; story projection
   beyond imports (row 24).
2. Grounded share card renderer + suggested title + public read token (row 2).
3. Spoken voice delivery (TTS + provider config) over the packet-checked persona seam
   (row 31).
4. Revisitable event-shaped milestones linking into preserved runs (rows 4/40).
5. Flip-sides-after-mistake retry variant; one-click mirror control residual
   (rows 33/28).
6. What-if both-sides steering recorded as an honest-actor branch (row 38).
7. Repertoire gap-finding over imported repertoires vs band-explorer coverage
   (row 48).
8. Open-answer key-point grading as a checkpoint interaction (row 19; extends the
   reasoning-transcript row).
9. Q2 pricing datapoints: Chess2Story per-artifact credits with refund-on-failure;
   365chess pay-what-you-choose; chess.com $119.99/yr paywall resentment as the
   demand-side counter-signal (rows 13/§6).
10. Position-scan import (chessvision.ai shape) for the Create surface (row 57).
11. Personal-model opponent (Chess Yourself shape) — watch row, Q5-class cost
    (row 58).
12. Friend-link play: anonymous share token + invite flow as the minimal B5-compatible
    human-pool transformation (row 30).

## Honest limits

- This audit inherits every limit of its sources: most dossiers are desk research, and
  a "loved feature" grounded in store copy overclaims by construction. Love-evidence
  strength varies by row and is cited, not re-weighed.
- SHIPPED statuses rest on `docs/*` as the canonical record, not on re-execution;
  where a doc was ambiguous (row 28's mirror control) the row says so rather than
  claiming either way.
- The transformation verdicts in §5 are design sketches at ledger fidelity, not
  specs; each still owes the normal RFC path before implementation.
- The matrix's own coverage limits apply (`README.md` §Coverage limits): both sweeps
  are snapshots, and a future loved feature is not in this table.
