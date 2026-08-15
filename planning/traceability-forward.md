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

---

## Delta re-run — 2026-08-15 (twelve-wave delta)

Run by claude at HEAD `e200ba8`. **The largest delta the gate has absorbed:**
eleven RFCs archived since the last run (`authoring-frictions` 0.16,
`validator-integrity`, `tempo-vocabulary` 0.17, `resistance-spectrum` run 0.14 +
migration 19, `predicate-wave-3` 0.18 + shape-entry 0.3, `opening-evidence-path`
0.20, `branch-set-scale`, `deviation-classes` 0.21, `transition-primitives` 0.22,
`expression-census`, `engine-request-contract` run 0.15 + migration 20), plus a
D56 fix, a refusal-coverage sweep, nine research dossiers, `design/06-campaign.md`,
and ~25 new defect rows. Delta scope only; the 2026-08-14 full trace stands
except where corrected below. Every claim below was checked by grep against
`apps/*/src`, `packages/*/src`, `schemas/` and `content/` — never against ledger
prose.

### The headline

**The ledger absorbed all eleven waves; the design tier and the gate mirrors
absorbed none of them.** Every one of the eleven has BACKLOG rows (2–11 each);
**none of the eleven is named anywhere in `design/03-product-breadth.md` or
`planning/exploration/gates.md`** (`grep -c` = 0 in both files, for all eleven).
This is the reverse of the 2026-08-14 finding, where registers held and the
ledger lagged. The failure has moved one tier up: it is now the **gate surface**
that is not being maintained, and the gate table is the design's own honesty
instrument.

The second-order consequence is that the gate table is now wrong in **both**
directions at once, and — the sharper finding — **three of its rows are stale
because the previous delta run's own corrections were never carried into them.**
The 2026-08-14 delta verified `comparisonStrips`, `/runs/:id/distill` and
`/progress/recommendations` in code and wrote that verification into *this
dossier*; the gate rows it was verifying still say all three do not exist.

### A. Gate-table OVERCLAIMS (design says shipped or names a false residual)

1. **B4 residual is wrong — `design/03:284` + `gates.md:127`.** Both name
   "Syzygy runtime rendering" as a true residual. It ships:
   `apps/server/src/service.ts:1002-1021` probes the tablebase live inside
   `branchDecidedness`, routed at `apps/server/src/rest.ts:1347-1350`, rendered
   with a full provenance sentence at `packages/runtime/src/branch-scale.ts:83`
   ("…Source: Syzygy (tablebase.lichess.org/standard)") and in
   `apps/web/src/lib/BranchRail.svelte:75`. Meanwhile the row **omits** the
   residuals the canonical doc actually names —
   `docs/explanation-grounds.md:245-260` says outright "it does not complete
   breadth gate B4" and lists authored claim triggers, per-assertion grounding,
   **durable** corpus/Syzygy evidence records, and feedback packets/claim
   anchors. *Fix: replace the residual with those four, citing
   `docs/explanation-grounds.md` §Current boundary.*
2. **`gates.md:111` "Breadth gates — COMPLETE 2026-08-14: B1–B11 all green"** —
   false, and unmirrored (`design/03` never declares completion). B4 in the very
   same table carries a "True residual", B1/B3/B8 carry residuals, and the
   canonical doc denies B4 completion. *Fix: strike the banner or restate as
   "B1–B3, B5–B11 green; B4 partial".*
3. **B5 still says "Twitch" — `design/03:285` + `gates.md:128`.**
   `grep -rni twitch apps/ packages/ docs/ workers/` = zero hits. Orphan #6 from
   the 2026-08-14 run; neither mirror was fixed. *Fix: "chat-adapter seam +
   chrome-free overlay"; ledger the Twitch bridge.*
4. **Resistance adjectives — `design/03:48-49`** still promise "perfect, strong,
   practical, **annoying, or fallible**". `RUN_OPPONENT_MODES`
   (`packages/runtime/src/types.ts:38-44`) has exactly five and contains no
   "annoying" or "fallible". Orphan #5 is now *half* closed —
   `resistance-spectrum` and `grounding-pair` shipped `practical_resistance` and
   `perfect_tablebase` — but two promised policies remain declared-unimplemented
   in a design doc, which is precisely what M-1's declared-vs-executable rule
   forbids. *Fix: drop them or mark them ledgered.*
5. **Branch-group seed sources — `design/03:140-144`** says "one mechanism,
   **five** ways to fill it", including "opening variants from corpus (rung 4)".
   `GroupSource` (`packages/runtime/src/types.ts:247`) has **four**, and
   `docs/branch-groups.md:117` states corpus is "not a runtime seed source".
6. **B4 proof column + `design/03:238`** promise "continuation clusters, and
   historical examples". `apps/server/src/corpus.ts:23` returns only
   total/white/draws/black/moves/recency; no `modelGame`, `historicalExample` or
   continuation-cluster symbol exists in the tree.

### B. Gate-table UNDERCLAIMS (design says absent; it shipped)

7. **B6 — `design/03:286` + `gates.md:129`** still carry the 2026-08-14
   correction "**session distillation … does NOT exist** — `session_distilled` is
   a reserved enum with zero producers". It shipped in `orphan-completion`:
   `apps/server/src/distill.ts`, route registered `rest.ts:559`, handled
   `:1081-1086`, client `api.ts:604,905`, browser action `App.svelte:340,613`,
   documented `docs/pack-studio.md:56`.
8. **B7 — `design/03:287` + `gates.md:130`** still carry "**the opt-in
   recommender … does NOT exist** — no route, disclaimed in the canonical doc".
   False on both halves: route `rest.ts:773-775`, client `api.ts:603,904`,
   rendered `App.svelte:654-656`, and `docs/return-and-progression.md:51-56` now
   *documents* it rather than disclaiming it.
9. **B3 residual — `design/03:283` + `gates.md:126`** still read "Residual:
   narrative mode + difference strips (forward-trace orphan, ledgered)". Both
   shipped: `packages/runtime/src/compare-strips.ts`, wired `rest.ts:14-15,1125`,
   rendered in `CompareView.svelte:27-28` (eval sparkline), `:91` (structure +
   timing strips), `:92` (piece routes), `:96-98` (narrative panel). B3 has **no
   named residual left**; `branch-set-scale`'s rail collapse
   (`packages/runtime/src/branch-scale.ts`, `BRANCH_COLLAPSE_FLOOR`) is new B3
   surface neither mirror records.
10. **B1 + B8 residuals — `design/03:281`/`:288` + `gates.md:124`/`:134`** —
    "`/settings` remains display-only" / "Residuals: PWA transformation, settings
    controls". `/settings` mounts `AssistanceSettings.svelte`
    (`App.svelte:811-814`) with six live per-context controls (`:42-47`),
    sign-out (`:62`) and password-confirmed deletion (`:64-65`); responsive
    transformation ships (`docs/app-shell.md:140-144`) and the build is
    installable (`apps/web/public/manifest.webmanifest`). *Fix: re-scope to what
    is genuinely missing — no opponent/engine/LLM-provider or accessibility
    controls, and "no service worker / offline queue" rather than "PWA
    transformation".*

### C. Count errors in the gate table

11. **B11 — `design/03:291`: "23 entries authored … the London wedge and the KID
    arrangement chain are outstanding, not authored".** Both are now real
    trigger-bearing entries (`content/shapes/london-wedge.json`,
    `content/shapes/kid-chain-arrangement.json`, landed `ae8aab7`); the true count
    is **25**. The 2026-08-14 delta corrected this number *downward* from 24 and
    was right that day; it is now wrong in the other direction. Same stale text
    at `planning/roadmap-to-done.md:26`.
12. **B9 — `design/03:289` + `gates.md:131`: "twelve scoped feature
    predicates".** `STRUCTURAL_FEATURE_KINDS`
    (`packages/schema/src/drill-pack/types.ts:325-330`) has **18**;
    `docs/structural-reading.md:14` says "eighteen closed feature kinds". A
    further **six** transition feature kinds shipped via `transition-primitives`
    (`types.ts:381-388`). *Fix: "eighteen structural feature kinds plus six
    transition primitives".*

### D. Mirror disagreements (`design/03` vs `gates.md`)

13. **`gates.md:113`** titles the table "Breadth gates (**B1–B8**)" while the
    table runs B1–B11.
14. **`gates.md:129`** B6 definition still says "pack studio/import/**review**/
    session-distill" — the review gate was struck by owner ruling 2026-08-13 and
    replaced by publication channels; `design/03:286` correctly says "a served
    **community** pack, its channel visible wherever it is surfaced". The mirror
    carries an abolished gate and drops the channel requirement.
15. **B11 status text differs entirely between the two mirrors**
    (`design/03:291` vs `gates.md:133`) — not contradictory, but not a mirror.
16. **`gates.md:131-134`** orders rows B9, B10, B11, then B8 — the two tables are
    not diffable.

### E. Other stale claims in `design/03` outside the gate table

17. **`design/03:316-323` "zero producers" list** — five of its seven entries now
    have producers: `outcome.reached` (`runtime.ts:350`), `transfer.scheduled`
    (`service.ts:1584`), `feedback.generated` (`guard.ts:142`), the prediction
    checkpoint (`rest.ts:1384`), the generic predicate evaluator
    (`packages/runtime/src/structure.ts`). Genuinely still zero-producer:
    **`human_model_predicted`** and the **drill-address grammar**
    (`packages/schema/src/drill-pack/urls.ts:88`).
18. **`design/03:325-328`** says item #1 is "not finished: `/settings` with no
    controls, **`phase` never projected**, the address grammar unrouted" — the
    same document's B1 row says `phase` is projected (D6 closed), and
    `apps/web/src/lib/api.ts:30` confirms it. Only the address grammar survives.
19. **`design/03:217` and `:402-403`** say reusable shapes are "pending the
    ruling" / "blocked on" `04` §0 — `design/04:16` reads "## 0. **RULED**
    (owner, 2026-08-14)" and B11 is shipped.
20. **`design/03:149-158`** presents the group-level reply journal as the
    *specified* remedy ("Real constancy **is** a group-level reply journal"). It
    shipped: `service.ts:941-957` replays a recorded selection verbatim on a
    matching `transposeKey` under `fixed`, returning `reusedFromNodeId`. The
    `seedHonored: false` explanation around it is still accurate
    (`apps/server/src/maia.ts:33`, `engine-supervisor.ts:199-200`).

### F. `design/06-campaign.md` — the new design doc, audited claim by claim

This doc was authored by claude on owner rulings and its load-bearing content is
claims about shipped code, so it was checked hardest. **Two of its three headline
claims verify; the third overstates, and there are four smaller precision
errors.** None is a fabrication — the pattern is a careful synthesis losing its
qualifiers on the way into the design tier.

**Verified true:**

- `:36-40` **the policy⟂inventory split is real.** `permittedAssistance`
  (`packages/runtime/src/assistance.ts:27`) computes per-axis permission from
  `{sessionKind, deliveryOpen, role}`; `AssistanceConfig` (`:3-14`) is `version: 4`
  plus **exactly nine** named axes (markers, guided, humanSplit, corpus, voice,
  spoken, boardLighting, arrows, ambient). Two separate artefacts, as claimed.
- `:46-49` **the "what does not exist" list is accurate.** `AssistanceConfig` is
  browser-local (`apps/web/src/lib/assistance-preference.ts`, keyed by session
  kind); `clockState` is an untyped `Record<string, unknown>` passthrough that is
  parsed (`rest.ts:418-424`) and stored (`runtime.ts:341`) and read by nothing;
  `clock_zeroed` is indeed the halfmove clock
  (`packages/runtime/src/transition.ts:360`, "Capture-or-pawn-move halfmove-clock
  convention").
- `:85-86` **`perfect_tablebase` "already used by two packs"** — exactly two:
  `content/drafts/mate-bishop-knight.json:539` and
  `content/drafts/trajectory-mate-bishop-knight.json:693`.
- `:59-63` the measured numbers all reproduce: 10.2% / 43 cp / 5.8% at depth 16
  (`design/research/practical-difficulty-outside-tablebase.md:47,339-345`),
  κ = 1.000 (`:39`), ply ~20 and zero by 27
  (`human-outcome-coverage-depth.md:43,277,280`), ρ = −0.143
  (`census-hint-false-positives.md:40`).

**Overstated — the one design-tier error worth the owner's attention:**

21. **`:41-42` "The difficulty-availability axis exists as `branchDecidedness`
    (`decided` / `undecided` / `unknown`), each with a named ground."** Two
    problems. (a) **"each with a named ground" is false**: only `decided` carries
    `ground: DecidednessGround`; `undecided` and `unknown` carry a `reason`
    (`no_terminal_fact | uncertain_category`; `out_of_range | not_probed |
    provider_unavailable | withheld`) —
    `packages/runtime/src/branch-scale.ts:11-19`. (b) More substantively, the
    doc's own §2a availability vocabulary is *measured-by-outcome (openings) /
    measured-by-tablebase / authored / none*, while `DecidednessGround` is
    *terminal_outcome / objective_terminal / tablebase* — **there is no
    human-outcome ground in the shipped type**, so the axis §2a specifies is not
    the axis that exists. `planning/campaign-synthesis.md:738-745` states this
    correctly ("C1's axis already implemented **at the branch level** … **promoted**
    from branch scale to campaign scale"); the design doc dropped both qualifiers
    and asserts the axis flatly "exists". *Fix (owner-tier): restate as "exists at
    branch scale as `branchDecidedness`, with a ground on `decided` only; the
    campaign promotes it to encounter scale and must add the human-outcome
    ground."*

**Smaller precision errors in the same doc:**

22. **`:43-44` "The encounter unlock exists as `shapeRecommendations`."**
    `service.ts:758` and `rest.ts:763` are real and the provenance sentence is
    real, but the function *recommends* shapes met-but-undrilled — nothing gates
    or unlocks on it anywhere. §1's "load-bearing half" framing partly covers
    this; the bullet does not. *Fix: "the encounter **detector** exists".*
23. **`:91` "only three of six opponent modes are reproducible at all."**
    `RUN_OPPONENT_MODES` has **five**. The "six" is a row count from
    `planning/campaign-synthesis.md:872-879`, whose table splits `theory_strict`
    into on-spine and off-spine. *Fix: "three of six move-source paths across
    five modes".*
24. **`:77` "Maia's bands run ≈1100–1900."** R10
    (`design/research/maia-band-calibrated-range.md:148`) explicitly labels that
    exact sentence `[M]` — unsupported model knowledge quoted from
    `design/BACKLOG.md:126,254` — and measures band availability at **1100–1939**
    with an emitter clamp of `[1100, 2000]`. The owner then **ruled `[1000, 2400]`**
    on 2026-08-15 (`design/BACKLOG.md:116`). §2b's "no IM/GM opponent" conclusion
    is not overturned by this, but the doc restates an `[M]` claim as fact in the
    tier that is supposed to be most careful. *Fix: cite the measured range and
    the ruled bound.*
25. **`:120-122` law 6 imports "the live-surface admission rule
    (`live-marker-quality` L1–L6)" as a standing law.** That RFC is
    `implementing`, not archived (`rfc/README.md:10`) — a design-tier law resting
    on unlanded normative text that may still change.
26. **`:6-7` points at `planning/campaign-synthesis.md` for "the assembled
    evidence and every file:line citation" — that file is UNTRACKED**
    (`git status`: `?? planning/campaign-synthesis.md`). A committed design doc's
    entire evidence base is not in the repository. *Fix: commit it.* Same for
    `tools/q8-feedback-surface-harness/`, an untracked research harness for a
    still-`💡` question (Q8), which AGENTS.md requires to be labelled disposable,
    tied to a ledger row and logged.
27. **`design/06-campaign.md` has zero inbound links** — no reference from any
    file in `design/`, `planning/`, `docs/`, `rfc/`, `AGENTS.md` or `CLAUDE.md`.
    Its own gate file `planning/campaign-research-queue.md` still opens "**Status:
    research tier. Nothing here may become an RFC yet**" and "before the cluster
    earns a design doc", never recording that the doc was earned and written.
    **R10 has no row in that queue at all**, though it is answered, dossiered and
    ruled on.

### G. Registers vs code — verified, with two register gaps

Verified exact against implementation: `DRILL_PACK_SCHEMA_VERSION = "0.22"`,
`DRILL_RUN_SCHEMA_VERSION = "0.15"`, `SHAPE_ENTRY_SCHEMA_VERSION = "0.3"`
(`packages/schema/src/index.ts:1-3`), `STORAGE_VERSION = 20`
(`apps/server/src/storage.ts:387`), `schemas/drill_pack.schema.json` `$id`
…drill-pack:0.22, `drill_run.schema.json` …drill-run:0.15,
`shape_entry.schema.json` …shape-entry:0.3. **0.19 is confirmed frozen shut** —
the register skips 0.18→0.20 and nothing in `packages/`, `schemas/`, `design/`,
`docs/` or any live draft claims it; `rfc/live-marker-quality.md:868`,
`rfc/client-surface-floor.md:59` and `rfc/fixture-realism.md:33` all explicitly
decline it. Two gaps, both in the single-writer file (**report only, not edited
here**):

28. **`rfc/README.md` never records `expression-census` anywhere.** Commit
    `4a893dc` ("docs: archive expression census") **removed** its Active-table row
    and added no Archive-table row, so an implemented RFC with a canonical doc
    (`rfc/archive/expression-census.md`, `docs/expression-census.md`) is absent
    from the index entirely.
29. **The shape-entry 0.2 → 0.3 bump is unregistered.** `predicate-wave-3` shipped
    it (`rfc/archive/predicate-wave-3.md:1598,1900`), but the register row for
    0.18 (`rfc/README.md:60`) does not mention it, though the analogous row for
    0.13 recorded the 0.1 → 0.2 bump.
30. **`rfc/README.md:125`** says "D60 remains open pending R10" — R10 landed and
    the owner ruled `[1000, 2400]` on 2026-08-15.
31. **`rfc/fixture-realism.md` is an active draft absent from the Active table**
    (`rfc/README.md:5-11`), while `planning/codex-queue.md:10` lists it READY.
32. **`docs/README.md` does not index `docs/expression-census.md` or
    `docs/transition-primitives.md`** — two canonical docs outside the docs index.

### H. `planning/roadmap-to-done.md` — six stale rows

33. **`:17`** calls the polish wave "**the LAST feature wave**" and states "the
    feature column is empty … run 0.13, storage 18, **no active product RFCs**".
    Eleven feature waves have landed since; run is 0.15, storage 20, and three
    product RFCs are active (`live-marker-quality` implementing,
    `client-surface-floor` and `fixture-realism` drafts).
34. **`:26`** "23 entries … 2 commissioned, unauthored: London wedge, KID
    arrangement chain" — both authored; **25** entries.
35. **`:28`** "**39 packs committed** total" — `content/drafts/` holds **43** pack
    documents, of which 6 are `.browser.json` fixtures → **37 authored packs**.
    39 is right under neither reading. (`planning/exploration/log.md` reports "43
    packs / 694 positions" from the census instrument.)
36. **`:29`** "Scandinavian wave-4b **deferred** on depth-commensurability;
    **B+N mate awaits an owner ruling**" — `scandinavian-mainline-black.json`,
    `anti-scandinavian-white.json`, `mate-bishop-knight.json` and
    `trajectory-mate-bishop-knight.json` all exist and are authored.
37. **`:30`** is now stale in the *unsafe* direction: "What remains at zero is
    *engine* (Stockfish) validation of middlegame/opening authored claims."
    `opening-evidence-path` (pack 0.20) shipped `objective.grading.assessedBy`
    `kind: "engine"` and **20 opening packs now carry engine-assessed grading**
    (12 carry `syzygy`, 7 `authored`; counted across `content/drafts/*.json`).
    The row also says 10 packs carry `ledger_verified` evidence sidecars — the
    true syzygy count is 12, and `ledger_verified` is a *computed* verification
    status (`apps/server/src/sourcing/ledger-validation.ts:384-406`), not a field
    present in any content file.
38. **`:15`** "onramp-guard (**+D28**) ✅ shipped" is a **narrower-than-it-reads
    closure**, and the D28 row itself was never flipped (`design/BACKLOG.md:242`
    still reads `🐞 found 2026-08-14`). The first half of D28's remedy landed —
    outcome objectives now fall through to automatic win/draw/loss rules
    (`apps/server/src/pack-orchestrator.ts:450-480`). The second half did not:
    `OBJECTIVE_GRADES_NOTHING` fires only when `PLAN_OBJECTIVES.has(objective.type)`
    (`apps/server/src/pack-validation.ts:421-423`), so a grading-free **outcome**
    leg still is not a load refusal.
39. **`:18`** gamification row reads "📋 post-session by design" without noting
    that `design/06-campaign.md` and the R1–R10 research queue now exist.
40. **`:34-38` §2b** still reads "First run complete 2026-08-14 … Re-run cheaply
    after the last feature wave". This is that re-run.

### I. `planning/codex-queue.md`

41. **`:3` "Landed and verified today (9 waves)"** then lists **eleven**.
42. Otherwise current and accurate (refreshed 2026-08-15 night); its D60 ruling,
    D73/D74 rows and three READY drafts all reconcile with the tree.

### J. `AGENTS.md` / `CLAUDE.md` (identical files) — three stale facts

43. **`:25`** "**6 living docs**" — seven, since `design/06-campaign.md`.
44. **`:26`** "**No active product RFC; 23 implemented RFCs** frozen in
    `rfc/archive/`" — three active drafts and **50** archived RFCs.
45. **`:27`** describes the planning tier as only `planning/exploration/`; it now
    holds a dozen sibling jobs including the campaign queue and synthesis.

### Verified clean

- All nine new research dossiers have coverage-matrix rows in
  `design/research/README.md`.
- `planning/exploration/plan.md` is current — Q3, Q4a, Q4b and Q7 all carry
  2026-08-15 evidence statuses matching their dossiers.
- `gates.md` E5 was refreshed 2026-08-15 with the mobile-scope compare-scale
  evidence — the one place the gate file *was* maintained this cycle.
- Every one of the eleven waves has BACKLOG rows (2–11 each). The ledger
  discipline held; only the design tier and gate mirrors lapsed.
- B1, B2, B3, B5, B6, B9, B10, B11 runtime claims spot-checked green (routes,
  modes, channel derivation, four pivotal detectors with eval-swing excluded
  live, `SHAPE_PROSE_CONTAINS_FEN`, `present`/`prospective` relations) — details
  in the sub-audit; only the residual/count text on those rows is wrong, not the
  shipped-ness.
- `perfect_tablebase` still publishes conditionally on provider presence
  (`capabilities.ts`), i.e. D8's declared-vs-executable law is still executing.

### Gate status

**Orphan/stale list is 45 items and NOT triaged.** Per the §2b rule, done is not
declared. The severe subset is: the B4 residual (both mirrors), the
`gates.md:111` COMPLETE banner, the three previous-delta corrections that were
never carried into the gate rows (B3/B6/B7), the `design/06` decidedness
overstatement, and the two `rfc/README.md` register gaps. All design-tier fixes
are **reports for the owner** (law 5); nothing in `design/`, `rfc/README.md`,
`apps/` or `packages/` was edited by this run.
