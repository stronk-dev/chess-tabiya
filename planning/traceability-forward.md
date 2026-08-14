# Traceability audit — forward direction (design → implementation)

Date: 2026-08-14. Method: every commitment in `design/00`–`design/05` was extracted and
traced to its home: **SHIPPED** (canonical doc in `docs/` + code spot-check), **PARTIAL**
(core shipped, named residual tracked), **RFC** (in flight — only `rfc/open-answer-grading.md`
is active; `repertoire-gap-finding` and `onramp-guard` already landed and are archived),
**LEDGERED-S** (BACKLOG row, scheduled), **LEDGERED-P** (BACKLOG row, consciously parked),
**ORPHAN** (no home anywhere), and **MISSTATED** (design claims shipped; code and canonical
doc say otherwise — the worst category, because the breadth-gate table is the design's own
honesty instrument). Read-only; no file outside this one was touched.

Companion: `planning/traceability-reverse.md` (sibling audit, RFC deviations → design).

---

## design/00 — Thesis

| Commitment | Status | Home / evidence |
|---|---|---|
| Core loop: commit → consequence → rewind → branch → compare → replay | SHIPPED | `docs/branch-runtime.md`; fork/rewind in `packages/runtime/src/runtime.ts` |
| Whole-game arc: Just Play vs human-like opponent, autodetected checkpoints | SHIPPED | `docs/shape-library.md` (position player), `docs/adaptive-guidance.md` (pivotal markers) |
| Guidance names techniques, never moves | SHIPPED | `docs/adaptive-guidance.md` §Endgame census; guided mode as chosen preference |
| Honest declared target, settable only where assessable | SHIPPED | `docs/outcome-drill-grading.md` — `grading.assessedBy` authored-vs-Syzygy, honesty contract |
| Consequence mandatory, retry free ("play it out, then go back") | SHIPPED | `docs/branch-runtime.md` rewind-forks; ADR-0006 barrier in `feedback.ts` |
| Comparison of two preserved attempts (the novelty claim) | SHIPPED | `docs/n-way-comparison.md` |
| On-ramp knob 1: 2–8-ply branches | SHIPPED | `difficulty.branchLengthTarget` (`schemas/drill_pack.schema.json:133`, `docs/drill-pack-format.md:55`) |
| On-ramp knob 2: immediate blunder-guard feedback | SHIPPED | `rfc/archive/onramp-guard.md` → `immediate_guard`, pack schema 0.14 |
| On-ramp knob 3: principle/threat objectives + on-ramp content | LEDGERED-S | zero on-ramp packs exist; 2 puzzle-seed candidates (`content/candidates/onramp-*`); `04` §8 order item 4 |
| "Packs declare prerequisites and difficulty" | PARTIAL | difficulty shipped; **prerequisites exist nowhere in the schema** (grep) — see orphan list #9 |
| Content system as the hard truth | LEDGERED-S | `planning/content-era/` is the active job |

## design/01 — Training model

| Commitment | Status | Home / evidence |
|---|---|---|
| Four-stage attempt; attempt = branch of a run | SHIPPED | `docs/return-and-progression.md` (attempts projection, migration 6) |
| Intent capture at commit | PARTIAL | branch `intent` + checkpoint `intent_capture` interaction ship (`docs/drill-pack-format.md:43`; `apps/server/src/authored-feedback.ts`); **intent-relative grading** still the ledgered Pack-B friction row |
| Return loop (scheduling, due work) | SHIPPED | `docs/return-and-progression.md` — schedules, 1/3/7/16/35 ladder, `/learn` |
| Attempts scheduled, concepts select, phase never a key | SHIPPED | same doc — concepts pack-scoped tags, never scheduling keys |
| Concept registry (cross-pack concept identity) | LEDGERED-P | deliberately absent; named a studio/B11 contract (B7 note, `04` §0a, content-transfer row) |
| Blocked vs varied repetition; the four variation forms | SHIPPED | `RETRY_VARIANT_KINDS` covers new-defense / related-position / opposite-side / different-material (`packages/schema/src/drill-pack/types.ts:26-32`) |
| Outcome types win/hold/save/resist; hold-vs-save distinction | SHIPPED | `docs/outcome-drill-grading.md` |
| Four modes each runnable (Line/Plan/Outcome/Trajectory) | SHIPPED | B2 shipped in full; `docs/trajectory-drill.md`, `docs/structural-reading.md` (Pack B graded objective) |
| Entry contexts beyond packs (FEN/PGN/study/live/Just Play) | SHIPPED | F2 pack-optional runs; `docs/game-import-and-story.md`; `apps/server/src/import-source.ts` (lichess study fetch) |
| Position Arena (external handoff minimum) | SHIPPED | `docs/live-sessions.md` §Position Arena — two legs as root-forked branches of one run |

## design/02 — Product shape

| Commitment | Status | Home / evidence |
|---|---|---|
| Hosted multi-user consequences: identity, lease≠auth, AGPL §13, cost | SHIPPED | `docs/identity-and-authorization.md` (F3, sessions, grants) |
| ADR-0004 re-decision (monolith under hosting) | ORPHAN-lite | trigger fired 2026-08-12; the explicit re-decision the doc demands has never been made anywhere — see orphan list #8 |
| CC-BY-SA-4.0 pack prose + provenance attribution chains | SHIPPED | `docs/content-sourcing.md` licence enforcement; provenance allow-list (`docs/pack-studio.md`) |
| Adoption posture / transformation doctrine | SHIPPED | `design/research/adoption-audit.md` → `docs/adoption-wave-1.md`; no-version-survives set measured empty |
| Rewind is experiment, not undo; branches immutable | SHIPPED | invariant, enforced in runtime |
| Layout: board center, semantic timeline markers, branch-card rail | SHIPPED | `docs/drill-client.md`, `docs/app-shell.md` |
| Keyboard-first (rewind, fork, branch switch, compare swap) | SHIPPED | `docs/drill-client.md:301`, `docs/app-shell.md:163` (`g`-chords) |
| Anti-contamination defaults | SHIPPED | withholding barrier + silence default (`docs/adaptive-guidance.md`) |
| Latency budgets as tripwires (100/200 ms band etc.) | SHIPPED | measured envelopes in `docs/branch-runtime.md`, `docs/structural-reading.md`, `docs/adaptive-guidance.md` |
| — stale citation | note | `design/02` cites `session-controller.ts:314-316` for "switchBranch *is* rewind"; that region is now lease-claiming code — citation has drifted |
| Compare mode: dual board, aligned plies | SHIPPED | `docs/n-way-comparison.md` (N-way, common-fork alignment) |
| Compare mode: **difference strip** (eval/WDL + structure changes + timing events + piece routes) | PARTIAL→ORPHAN | only the eval-trajectory component ships (`docs/explanation-grounds.md` aligned score trajectories); structure-change/timing/piece-route strip components have **no doc, no RFC, no BACKLOG row** |
| Compare mode: **narrative mode** (causal, not move-by-move) | **ORPHAN** | zero hits in `docs/`, `apps/web/src`, BACKLOG — see orphan list #3 |
| Branch race (two boards, alternating) | LEDGERED-P | BACKLOG row; largely superseded by branch-groups lockstep (`docs/branch-groups.md`) |
| Session resume, event-log persistence, PGN-with-variations export | SHIPPED | `docs/branch-runtime.md`, `docs/app-shell.md` |
| Mobile/PWA fit (Q3) | LEDGERED-P | open exploration question; `docs/app-shell.md:206` defers honestly |

## design/03 — Product breadth (the gate table, re-audited)

Gates B1–B11: B2, B5, B6, B7, B9, B10, B11 marked shipped; B1/B8 shipped-with-residuals;
B3 "largely shipped"; B4 open. Spot-checks confirm the *runtime* claims (structural
predicates in `packages/runtime/src/structure.ts`; `/learn`, `/live`, overlay routes in
`apps/web/src/lib/router.ts`; `ObjectivePredicate.pawnStructure` at
`packages/runtime/src/objective.ts:55,159`). Two gate rows overclaim:

| Commitment | Status | Home / evidence |
|---|---|---|
| B7 "**opt-in recommender**" (shipped per gate row) | **MISSTATED** | `rfc/archive/return-and-progression.md` §12 specs `GET /progress/recommendations`; grep for `recommend` over `apps/*/src packages` hits only a corpus-sentence test; `docs/return-and-progression.md:59-60` says personal-PGN import and pack ranking "not yet" — the RFC section was never implemented, yet the B7 row lists it as part of "shipped 2026-08-13" |
| B6 "**session distillation**" (shipped per gate row) | **MISSTATED** | `docs/pack-studio.md:54-55`: distillation and structured import "remain follow-up authoring affordances"; `session_distilled` is a *reserved* provenance source with zero producers (`docs/drill-pack-format.md:58`; grep) |
| B3 difference strips / narrative mode (inside "largely shipped") | ORPHAN | see design/02 rows above |
| B3 branch groups | SHIPPED | `docs/branch-groups.md` (the "no RFC yet" note in the B3 row is stale — it shipped 2026-08-14) |
| B4 corpus runtime rendering ("remains unmet" per gate row) | stale the *other* way | `docs/runtime-corpus-evidence.md` shipped 2026-08-14; the row under-claims. Syzygy runtime rendering and evidence-bound LLM rendering genuinely remain unmet (`docs/explanation-grounds.md` §Current boundary, `docs/engine-workers.md:242`) |
| B5 "**Twitch** host/chat/overlay" (shipped per gate row) | PARTIAL | what ships is a vendor-neutral chat-adapter relay namespace + chrome-free `/live/overlay/:runId` (`docs/live-sessions.md`); **no Twitch-named integration exists in source**, and no row owns building the actual bridge |
| Just Play, from-position, phase discovery, Learn IA | SHIPPED | B2/B7 + `docs/shape-library.md`, `/learn` |
| Review: manual N-selection, simulate grid, prediction, deep mode, export | SHIPPED | `docs/n-way-comparison.md` |
| Review: opposite-side replay | SHIPPED | `docs/adoption-wave-1.md` §Opposite-side replay (`POST /runs/:id/flip`) |
| Review: new-defense replay | SHIPPED (vocabulary) | `same_root_new_defense` retry variant + varied scheduling |
| Review: opponent-intent prompts | LEDGERED-S | BACKLOG row (2026-08-10); prediction checkpoints ship, intent prompts do not |
| Live: academy roles, voting, proposals, spectate, friend links | SHIPPED | `docs/live-sessions.md` |
| Live: **pack nights, cohorts, team relays** ("Arena and events") | **ORPHAN** | no doc, no RFC, no BACKLOG row; only pre-RFC analysis at `planning/breadth/live-and-platform.md` L6. `live-session-platform` shipped without them and the B5 row does not name them as deferred |
| Live: session replay + distillation into a pack | half-ORPHAN | replay ships; distillation is the B6 misstatement above |
| Create: authoring, lint, playtest, versioning, channels, community interchange | SHIPPED | `docs/pack-studio.md` |
| Create: corpus mining → one unpublished candidate | SHIPPED | `docs/content-sourcing.md`; 8 candidates in `content/candidates/` |
| Create: imports (studies, repertoires, games) | SHIPPED | `import-source.ts` (study), `docs/repertoire-gap-finding.md`, `docs/game-import-and-story.md`; structured *candidate* import into Studio remains follow-up per `docs/pack-studio.md` |
| Structural reading (B9): predicates, denial, discovered consequence, pressure counts, naming | SHIPPED | `docs/structural-reading.md` — 15 kinds, `vacationReading`, pawn-safety-as-denial with scope sentences |
| Adaptive guidance (B10): classifier, config, pivotal detection, technique naming | SHIPPED | `docs/adaptive-guidance.md` — all four detector families incl. irreversibility |
| Reusable shapes (B11): entries, references, one play surface | SHIPPED | `docs/shape-library.md`; 23 entries in `content/shapes/` |
| Opponent resistance spectrum "perfect, strong, practical, annoying, fallible" | PARTIAL→ORPHAN | shipped modes: `human_common`, `strong_engine`, `theory_strict` (`docs/engine-workers.md:197`). `perfect_tablebase` was *removed* by defect-sweep (D8) as unbacked and **no row schedules its return**; "annoying/fallible" gradations and the policy mixer sit loosely under Q5 |
| Shell: 8 areas, viewport-contained, role controls | SHIPPED | `docs/app-shell.md` |
| Shell: Library incl. "historical sources"; Settings with controls | PARTIAL | `/library` is packs + run artifacts only; `/settings` display-only — both named residuals of the foundation edge (tracked) |
| Drill-in-a-URL grammar routed | PARTIAL (tracked) | grammar tested in `packages/schema/src/drill-pack/urls.ts`, still zero production consumers — named residual |
| PWA/responsive transformation | PARTIAL (tracked) | `docs/app-shell.md:206` |

## design/04 — Content architecture (the content map vs the shelf)

The map promises hundreds of packs. The shelf today: **0 published packs**
(`content/packs/` is empty), **11 real authored drafts** + 5 browser fixtures
(`content/drafts/`), **23 shape entries**, **8 candidates**. All authoring flows through
the active `planning/content-era/` job, so unauthored map rows are **scheduled work, not
orphans** — but the coverage numbers deserve stating:

| Map region | Promised | Exists | Status |
|---|---|---|---|
| §0 ruling: shape library + packs reference it | — | shipped | B11; 23 entries cover all 10 middlegame structure families + endgame families |
| §2a/b repertoire spines (chosen, both colours) | ~40+ families | 4 drafts (caro-kann-advance-black, french-advance-black, najdorf-english-attack-black, D35 candidate) | LEDGERED-S (content-era) |
| §2c anti-opening first wave (6 named) | 6 | **3 of 6** (anti-Caro Advance ×2, anti-French Advance, anti-Sicilian Najdorf); anti-KID, anti-London, anti-Dutch absent | LEDGERED-S |
| §3 middlegame families | 10 × 8–15 roots | 1 pack (Carlsbad minority attack); families exist only as shape entries | LEDGERED-S |
| §4 endgame families | 7 families × convert/hold/save | 1 pack (rook-4v3) + Pack C; endgame shapes authored | LEDGERED-S |
| §5 launch trajectories (6 named) | 6 | **2 of 6** (QGD Exchange→Carlsbad, Caro Advance→chain→bishops) | LEDGERED-S |
| §6 on-ramp content (principles, opponent-intent series, re-cut puzzles, mates) | 6 content families | **0 packs**; 2 puzzle-seed candidates | LEDGERED-S (order item 4) |
| §1 unit taxonomy: **Track** (curriculum path per rating band) | — | nothing; no BACKLOG row, not in content-era plan | **ORPHAN** (see #7) |
| §7 unblocks: claim triggers, tempo contract, provenanceMode, save/resist | — | save/resist SHIPPED; claim triggers + tempo contract + timing-window semantics consciously parked as content-era work (`docs/explanation-grounds.md` §Current boundary; revived authoring-contracts BACKLOG row) | LEDGERED-P |
| §8 cost discipline (K10 measurement) | — | measured (105 min; `owner-review` still 0 — verdict open) | LEDGERED-S |

Note: none of the 11 drafts has had an engine validation pass, none is published, and the
content-era log says the flagship trajectory's win/hold assessments are "the files'
strongest ungrounded claims." The design's own rule — content earns its cost by firing in
unauthored games — is being followed (shape-first), which is to its credit.

## design/05 — In-run experience

| Commitment | Status | Home / evidence |
|---|---|---|
| Six invariants; invariant review at content-complete | SHIPPED / scheduled | enforced across runtime; review is a dated owner commitment |
| Five regions | SHIPPED | `docs/drill-client.md`, `docs/app-shell.md` |
| Assistance ladder rungs 0–6 with scope corrections | SHIPPED | rung 0 `docs/structural-reading.md`; 1 partial (Syzygy authoring-only); 2 shipped; 3 shipped; 4 `docs/runtime-corpus-evidence.md`; 5 shipped; 6 voice seam (wording-only) |
| §3-forms: sentences, markers, sheets, story slides, simul wall, spoken voice | SHIPPED | `docs/adoption-wave-1.md` (speech), `docs/live-sessions.md` (simul wall) — the form table's own "shipped" labels verify |
| §3-forms: lit-square lighting dial, sight arrows/halos, ambient presence | LEDGERED-S | BACKLOG rows: board-lighting ladder, assistance form matrix |
| §3a silence default; recovery as normal path; retrospective detection split | SHIPPED | `docs/adaptive-guidance.md` — universal `off` defaults; `retrospectivePivot` disclosed-only |
| §3b guided mode: named patterns, passive marker, chosen | SHIPPED (core) | `guided: off\|live` preference + shape firings; **band-shaping (on-ramp default) and fade-out intent** live only inside the BACKLOG guided-mode row — LEDGERED-S |
| §3b-i LLM voice: packet, persona, machine-check, degradation | SHIPPED | `docs/adaptive-guidance.md` §Deterministic packet (with honest checker-insufficiency note); external provider in `docs/adoption-wave-1.md` |
| §5 detection/significance split; prophylaxis readable | SHIPPED | pawn-safety denial with current-scope sentences |
| §5a four forward detectors (irreversibility, phase, divergence, collapse); eval-swing excluded live | SHIPPED | `docs/adaptive-guidance.md` §Pivotal markers — all four, exactly as specified |
| §5b endgame technique naming | SHIPPED | endgame census; Lucena/Philidor/Vancura named, attributed |
| §5c structural plan grading (Pack B objective) | SHIPPED | `docs/structural-reading.md` §Objective grounding |
| §6 open questions 1–4 | open by design | correctly framed as forks, no action owed |

---

## Counts

~103 discrete commitments traced. SHIPPED **58** · PARTIAL (tracked residual) **12** ·
RFC in flight **1** (open-answer-grading; stated-reasoning transcript row) ·
LEDGERED-scheduled **18** · LEDGERED-parked **6** · **ORPHAN 6** · **MISSTATED 2**.

## Orphans and misstatements, ranked by load

1. **B7 "opt-in recommender" — MISSTATED.** The gate row folds it into "shipped
   2026-08-13"; the RFC section was specced but never implemented, no code exists, and the
   canonical doc says so. The breadth gate is the design's proof-of-honesty table and this
   row is wrong on it.
2. **B6 "session distillation" — MISSTATED.** Same table, same shape: `session_distilled`
   is a reserved enum with no producer; `docs/pack-studio.md` explicitly lists distillation
   as not-yet. Also silently hollows the Live promise "replayed and distilled into a pack"
   and the shell's Create row.
3. **Narrative mode + difference-strip components — ORPHAN.** Promised twice (design/02
   compare-mode bullet, design/03 B3 bullet), absorbed into "largely shipped," yet
   structure-change/timing/piece-route strips and the causal narrative have no doc, RFC,
   or ledger row. The comparison surface is where K4 lives; an unhomed chunk of it matters.
4. **Events layer (pack nights, cohorts, team relays) — ORPHAN.** design/03 names them in
   §Live; the shipped live platform covers none and the B5 row does not record them as
   deferred. Low urgency (B5's revival conditions apply) but they should be rows, not ghosts.
5. **Perfect-tablebase / graded-resistance spectrum — ORPHAN.** design/03 promises
   "perfect, strong, practical, annoying, or fallible" resistance; three modes ship,
   `perfect_tablebase` was deleted by a defect fix, and nothing schedules the spectrum.
6. **Twitch bridge — semi-ORPHAN.** B5's "Twitch" is satisfied by a vendor-neutral adapter
   seam; the actual integration is nobody's row. Defensible minimal-real reading, but the
   gate row should say "chat-adapter seam," not "Twitch."
7. **Track (curriculum unit) — ORPHAN.** The fifth unit of design/04's taxonomy has no
   content, no plan mention, no row.
8. **ADR-0004 re-decision — ORPHAN-lite.** design/02 states the fired trigger "needs an
   explicit re-decision"; nobody owns making it.
9. **Pack prerequisites — ORPHAN-lite.** design/00: "packs declare prerequisites and
   difficulty." Difficulty shipped; prerequisites appear nowhere.
10. **Stale citation:** design/02's `session-controller.ts:314-316` no longer points at
    `switchBranch`.

## Verdict

**The design is substantially honest — more honest than most repos' aspirational tiers —
but its honesty instrument has two false positives.** The striking pattern is that nearly
everything is *somewhere*: the BACKLOG discipline ("every idea gets a row") works, which is
why only six true orphans exist across ~103 commitments, and several of those are
single-phrase promises rather than load-bearing systems. Where the design under-claims
(B4's corpus row, B3's branch-groups note), the errors are staleness in the conservative
direction, which is the safe failure.

The unsafe failures are the two MISSTATED rows: **B6 and B7 each list a feature as part of
a shipped gate that the code does not contain and the canonical doc disclaims.** Both rows
cite the RFC that *specified* the feature — the exact "a slot with no producer reads like a
working feature" hazard the foundation-edge section itself warns about, now present in the
gate table that exists to prevent it. The fix is one edit per row (move recommender and
distillation to named residuals) plus BACKLOG rows so they are scheduled rather than
imaginary. Secondary finding: design/04's content map is honest *as a map* (it never claims
the content exists), but the ratio — 11 unpublished drafts, 0 engine-validated, against a
map of hundreds — means the product's stated critical path (§7: "content is the reason this
is the critical path") is the least-realized commitment in the design tier, and the B-gate
greenness should not be read as product-completeness.

## Delta re-run — 2026-08-14 (post polish wave)

Run by claude after the last feature wave landed (`765efb5` polish-surfaces,
`0939070` orphan-completion, `2fd82be` grounding-pair; all archived, Active
table empty). Delta scope only — the 2026-08-14 full trace above stands.

**Verified clean by grep against real code, not prose:**

- Registers match implementation exactly: `STORAGE_VERSION = 18`
  (`storage.ts:387`), `DRILL_RUN_SCHEMA_VERSION = "0.13"`, pack schema 0.15.
- polish-surfaces: `boardLighting` in `AssistanceSettings.svelte` +
  `DrillScreen.svelte`; TTS provider gated at `main.ts:23-26`.
- orphan-completion: `comparisonStrips`/`comparisonNarrative` wired at
  `rest.ts:1094`; `/runs/:id/distill` in the route matcher (`rest.ts:529`)
  and handled at `:1051`; `/progress/recommendations` at `rest.ts:743` with
  the corpus guard in the sentence grammar (`repertoire.ts:82`).
- grounding-pair: `perfect_tablebase` published conditionally —
  `capabilities.ts:190` filters it out when the tablebase provider is `none`,
  which is the D8 declared-vs-executable law executing correctly.
- Gates run personally: `ENGINES_REQUIRED=1 make verify` 474/80 exit 0;
  `make test-browser` 24 passed, zero retries, 1 optional Maia skip.

**Found and fixed:**

1. Ledger flow-back missed by the implementing commit — `2fd82be` flipped the
   RFC register but not the BACKLOG rows it ships (verify-draft item,
   resistance-spectrum, the cross-link row). Flipped post-hoc in `4cb7bfd`
   with attribution. This is the failure the completion law names, recurring.
2. Shape-entry count overstated as 24 in `design/03-product-breadth.md` §B11
   and `roadmap-to-done.md`; the true count is 23 (this dossier had it right).
   Two commissioned entries — London wedge, KID arrangement chain — were being
   counted as authored. Corrected in both.
3. Stale roadmap content rows: waves 4a/5a/5b still read "three agents
   authoring"; theoretical mates read as pending. All landed; 39 packs.
4. "Engine-validation 0 run" was true-but-misleading: tablebase grounding is
   now real for 10 packs. Restated so what is actually at zero — Stockfish
   validation of middlegame/opening claims — stays visible.

**Reverse-trace orphan (open, owner-facing):** `cursed-win` / `blessed-loss`
ship in code (`tablebase.ts:5-11`, correct inversion and rank) and in
`docs/tablebase-grounding.md`, but flow back to **no design doc**, and they
contradict `01-training-model.md` §Outcome types — a *Win* drill's "keep the
position winning and finish the conversion" is unsatisfiable in a cursed win
under the 50-move rule. Ledgered; needs an owner ruling. No shipped pack roots
on one, so nothing is broken today.

**Gate status:** orphan list is 1 item, triaged (ledgered + escalated to the
owner). Stale list is empty. Per the §2b rule, done is not declared while
either list is non-empty *and untriaged* — this one is triaged.
