# RFC index

Process: `rfc/0000-rfc-process.md`. Template: `rfc/template.md`.

## Active

Status cells and RFC body Status lines begin with one of the seven lifecycle tokens after Markdown
emphasis is stripped. Dates and text after the first separator are prose; only an `awaiting` cell's
first `D<n>` token is machine-read as its discharge pointer.

| RFC | Status | Parent | Implementation |
|---|---|---|---|
| `0000-rfc-process.md` | accepted | — | process |
| `tactical-collectors.md` | **awaiting D1 — implementation complete 2026-08-22; all 30 projections compile and the permanent authored/imported instrument passes; local discharge D1 is globally tracked by D921** | `planning/tactical-collectors/plan.md`, `tools/tactical-collector-measurement-harness/` | **claims nothing versioned**; authorable vocabulary and D743 opening identity remain separate |
| `bot-policy.md` | **accepted 2026-08-22 by claude as register owner, after a cross-review that reproduced every load-bearing number from committed artifacts (~60 citations, zero errors) and found ONE structural blocker: the profile grammar was unreachable from production** — `run.opponentPolicy` admitted no profile, so A1's parser accepted a request no shipped caller can send and a resumed run could not know which bot it was playing ([[D938]]; fixed with the digest-validated `RunOpponentPolicy.profile` triple persisted in `run.started`). Honesty claims hardened from prose to mechanism: the guard disclosure must **embed the typed engine/bound/threshold literals verbatim** (an empty-check would have passed *"plays carefully"*); the [[D843]] wall now closes over parameter **provenance**, not names — the offline-constant evasion is dead; T > 0 and topP ∈ (0,1] pinned with truncation ties through `neutralTiebreak` (T→0 is the refused modal-opponent doctrine). **The R5 inheritance stated outright**: generation-determinism is fixed on the composed path (server draw, `seedHonored`), and profile-less `human_common` inherits the unseeded sample — said, not implied. Sampler conformance real: 0.2725 cp / 0.028 pp recomputed exact from `results.json` | `planning/platform-alignment/bot-policy/` | claims **run-schema lane 0.18** (`OpponentSelection.policy`) + **one migration position behind `longitudinal-store`** — both verified free at HEAD; policy definitions are a **catalog-local registry, not a table**, argued on four grounds with the user-composition exit named ([[D936]]) |
| `move-quality-grades.md` | **accepted 2026-08-22 by claude as register owner, after a cross-review that recomputed the arithmetic to four decimals and found the report ladder WRONG BY A FACTOR OF TWO** — the taxonomy dossier's gloss was trusted over the source, but `Advice.scala`'s thresholds live on raw `[−1,+1]` winningChances, so 10/20/30 is really **5/10/15 Win%-points**; every report/imported grade would have been ~one class lenient (+1.00→−1.00 — a Lichess Blunder — would have read *inaccuracy*), and the celebrated "4×-stricter practice ladder" is a **cross-normalization artifact** (true ratios 2×/1.67×/1.07×) — erratum landed in the dossier ([[D939]]). The mate arm's floor/boundary generalizations **contradicted pinned source cells** (+800→Mistake; the missing countermate row → Blunder, F-MATE-LOST-M) and are replaced by the complete fixed-cp three-tier table — which also makes the mate arm genuinely context-independent, dissolving an internal contradiction. *"Zero `voice.ts` changes"* was false by one word: `BANNED_JUDGEMENTS` lacks *inaccuracy* and `\baccurate\b` cannot match inside *inaccurate* ([[D940]]). Clamp-the-input now declared against Lichess's unclamped feed (F-CLAMP-2). ~45 claims checked, 12 failed, concentrated exactly where a gloss was trusted over a source — the law-3 lesson in one review. The kill exhibit stands unchanged: under the shipped mate→cp coercion a missed mate-in-2 from +8 measures below every threshold (F-MATE-NEG). **Owner flag: report grades will be ~2× more common than the draft implied** — worth knowing before a play session judges the drill ladder | `planning/evidence-foundation-ux/` | **claims nothing versioned** — catalogue-local ids, no migration (nothing persists); WDL basis deferred on [[D927]]; consumed by `postcommit_nudge`/`review_map` only, compiling the two ◇ rows |
| `longitudinal-store.md` | **accepted 2026-08-22 by claude as register owner, after a cross-review whose center question was a real blocker: the grain could not distinguish PLAYED from GAME from PREDICTED** — `importGame` commits the historic player's moves as `actor: "user"`, nothing guards rewind inside imported runs, and [[D869]]'s prediction runs are real — so one imported run mixes all three classes and the drafted key would have pooled them into one habit denominator, **the exact corruption the store exists to prevent**. Fixed: `decision_class` in the PK with pinned derivations ([[D934]]). **The shared-run half made byte-equality unsatisfiable as specified** (incremental attributed to the acting writer, rebuild to the owner) — owner-only attribution pinned via the durable authorship seam. Rebuild determinism holds after three pins (float order; the forced-move 0/0 case; AC-11's derivation digest making unbumped semantic changes diff-visible). The crash window between run-persist and projection is **stated, unreadable at landing, and fixtured** — an honesty note, not a hole. ~90% symbol spot-check, zero citation errors | `planning/evidence-foundation-ux/` | claims **one migration position, `behind learner-rating`** (the position grammar avoiding a C3 collision at HEAD `STORAGE_VERSION` 24); nothing on the other five registers; ingest set referenced **by symbol**, not copied |
| `semantic-collectors.md` | **accepted 2026-08-22 by claude as register owner, after a cross-review whose center held: all eight observed multi-ply ids are CHECKABLE, none is intention-inference** — but only after the causal bindings were pinned from the measured bytes (deflection's displacement bound by capturing-the-bait or answering-check plus a positive final exchange; attraction requiring the consequence on the arrival square, with the any-piece discriminator as an executable hard negative; interference vs clearance separable by destination-enters vs source-vacates). Seven blockers fixed: **the pass-device census was wrong for every clause it named** (no registered predicate in the wave flips a turn — the clone lives in the harness's internal falsifier, and C9 now *fails* a declaration claiming it); square clearance's declared grounding was **mechanically impossible** under the shipped widening checker; a measured prior was mis-attributed to the wrong id's kind; **`mate-proof@1` was non-deterministic at the cap** — node accounting, enumeration order and the transposition memo all pinned, the digest deferred honestly (the harness produces none), and the horizon cleanly layered beside 2c's `mate_in_one@1`; two permanent hard negatives became executable fixtures (16/16 green). Zwischenzug **honestly refuses the gained-relative-to-recapture value question** | `planning/evidence-foundation-ux/` |  | `planning/evidence-foundation-ux/` | **claims nothing versioned** — verified against all six registers; `at_commit` explicitly left to `learner-modules`; [[D904]] untouched. Four Discharges rows, P4/P6-clean: the literal-id module amendment (codex item 5), the Review lane, the opening trio, and [[D926]]'s authored witness debt |
| `play-composition.md` | **implementing 2026-08-22 — shell checkpoint landed.** Exact seven-viewport geometry now has one runtime/test authority; the stage is closed over board + fixed strip + compact objective; desktop rail/tablet band/phone overlay sheet are live; raw evidence moved to the explicit Inspector; text entry no longer resizes the board; the keyed Chessground remount is replaced by `board.set()` plus a capture reset token. Browser: **30 passed, 1 optional skipped**, including post-gesture rect equality and stable DOM identity. **Not complete:** the eleven compiled module seats, remaining SAN/vocabulary leak cleanup and the full 7×16 / 112-screenshot matrix | `planning/play-composition/plan.md` | **claims nothing versioned** — web composition code/tests/docs only |
| `learner-modules.md` | **accepted 2026-08-22 by claude as register owner, on the buildability test — the wall-breaker is real: 181 declared / 179 compiled eligibility rows (175/173 at cross-review, +6 by the D924 in-place Appendix-B amendment), every original row verified by literal id, against a measured wall of zero production module ids.** Cross-review fixed nine blockers in place (the guided hint's stage gate was **prose over a typed compiler** — PV bytes would have passed at stage 1, now a typed per-stage ceiling; the lift claim was false when admitted exceeds budget and the fixture now splits three ways; three shipped closed unions had no image and `EvidenceTiming` **lacks `at_commit`** — the mirror was uncompilable). The owner's three rulings folded ([[D906]]): threat radar pre-commit in Support only; `outpost` returns when the **priority [[D566]] fix** lands; **budgets demoted to backstops — semantic reducers are the mechanism** ([[D907]]), with exceeding a backstop logging a reduction-quality event instead of silently truncating. **The reducer obligation entered post-review** and is flagged in the Status line as the implementer's section to return if underspecified. Grades are a projection, not a module; the class-9 comparison is answered honestly — inert at landing, held open by **five discharge rows across three RFCs** | `planning/evidence-foundation-ux/` | **claims nothing versioned** — no preference stored, no schema lane; verified against all six registers with the draft present |
| `breadth-collectors.md` | **accepted 2026-08-22 by claude as register owner, on the buildability test, after the INDEPENDENT acceptance review the plan reserved** (codex authored and amended; self-review cannot accept — the false-independence row's lesson applied). Verdict accept-after-corrections, five convention repairs applied in place with FENs ([[D895]]): the king-square rule was chess-wrong at the mechanism (pseudo-only manifests **by abstention** — the checking side's turn clone is always `OppositeCheck`-invalid, so the listed fixture was unsatisfiable); `pressure-line@1` lacked the slider-ray compatibility clause; `defender_exposure@1` was unreproducible without its pass-state device; a count paired with the wrong kind; asymmetry had no ordering. **All nine D851–D859 amendment repairs verified at the symbol**; ~95% of quoted measurements cross-checked exact; the 2c seam sound with one over-declared dependency flagged ([[D896]]). 18 ids, research/inspector-only at landing; implementation follows 2c | `planning/evidence-foundation-ux/` | **claims nothing versioned**; consumes 2c's `legal-exchange@1`; landing order 2c-first stated with the seam |
| `accessible-board-input.md` | **awaiting D3 2026-08-21 after the mechanically complete `2b68103` landing; D1/D2 are discharged and the sole hold is the owner's normal device/browser/AT validation-by-use session, not pending code work or a participant panel.** Cross-review verdict was accept-after-corrections with **nine blockers fixed in place**: the central verification number (150) was arithmetically impossible under the RFC's own text and **conflated the disposable A2 harness's one-time 90/90 reading with the permanent 18-cell click-only gate** (drag/touch are *promoted* into the gate, the 18 click cells the never-deleted floor); promotion was **unrepresentable in the specified state machine** (`awaiting_promotion` + role-typed `promote` added); the ARIA grid lacked `role="row"` context; the unconditional destination announcement would have given keyboard users **more sight than pointer users** with lighting off — semantic projections now inherit the visible board's assistance ceiling ([[D655]]); Alt+C matched on `key`, a trap on the owner's own Macs (macOS reports `"ç"`) — `event.code` now, material because [[D649]] makes those the release instrument; and the tree probe asserted resting state only, repeating [[D538]] — post-gesture assertions added. **[[D649]] clean; builds on the landed [[D537]] repair, does not inherit it** | `archive/client-surface-floor.md`; F12 work order | claims nothing versioned; web input/accessibility code, tests and docs only. One board-input controller, four projections, to the existing validated UCI submission |
| `portable-account-data.md` | **accepted 2026-08-22 by claude as register owner, after buildability (D711–D714) and an independent cross-review that re-derived ~45 claims at source and failed 5 — headline: the browser-clearing promise named ONE localStorage prefix where the shipped grammars are THREE** (`tabiya:` / `tabiya.` / `chess-tabiya:` — a `tabiya:` clear reaches only the mark-scope/branch keys and misses writer ids, assistance preferences, and the same-day-accepted `tabiya.workflow.v1.*`), **and §4.3's tombstone journal record was impossible as drafted** (`session_journal.kind` is a closed 16-kind CHECK and the RFC claims no migration — pinned to the existing `session.closed` kind). Also: the migration queue predated today's acceptances (learner-rating → longitudinal-store → bot-policy all named, with longitudinal-store's D1 export hand-off honored), `live_sessions.classroom_id` restored to the migration-24 enumeration, teacher-surface joined Parent/amends. Verified clean where it counts: the R18 motivation paragraph exact against shipped `deleteLearner`, the D657 collision characterized precisely, every named symbol exists (~40 clean). Adds a deterministic versioned account export, exhaustive durable-data and identity-transform inventories, exact/stale-safe account and per-run deletion previews, and one dependency-aware classifier. Private/solo history hard-deletes; anonymous links revoke rather than retain; authenticated shared runs and registered pack/shape artifacts survive only as immutable identity-tombstoned records. Shared tombstones lose every real writer while existing collaborators retain read access. `teacher-surface` landed first at migration 24; F12-B supersedes only its account-deletion clause atomically. The corrected implementation surface now owns archived-classroom reads and both pre-publication retention warnings rather than leaving those criteria consumerless | amends eight implemented identity/data/social RFCs plus `archive/teacher-surface.md`; F12-C supplies only the final configured backup-retention sentence | **claims nothing in the six shared-resource registers and no migration.** Account format V1 is produced only by the server and downloaded opaquely; a future importer, second producer or package consumer must first register it as a shared resource |
| `graduation-clearance.md` | **accepted 2026-08-17 by claude as register owner, third author round — on the buildability test.** Returned by the implementer **twice**; this round resolved [[D503]] **as an instance of a class, not as six entries**. The six `shape_firing` packs carry no `shapes` key at all and are **F `unbuilt`**, which is what their own statements say; the real fix is that **three of six kinds join their evidence through a pointer grammar the shipped code enforces and the RFC stated it for one** ([[D523]]) — including a **55-entry class** that could have been migrated with subjects whose predicate can never hold. **The bigger find came from running the predicate rather than reading it** ([[D522]]): for the 16 remaining rule-6 entries the D predicate **already holds today at 2–24 firings each**, so the migration's first run would have **retired sixteen debts by doing nothing**. Ruleset re-published and re-run over all 220: `unbuilt` 29→**35**, `shape` 22→**16**; clearable **173/47**; pack split **28/22**. **Unmoved and worth noting: 0 of 50 packs graduate on instrument runs alone.** Five things the implementer would have hit cold are fixed — `ExpressionCensus` **is not a type in the tree**, `MACHINE_LABELS` **is not the symbol's name**, every `:line` into `sourcing/check.ts` had drifted 4–24 lines, the D predicate costs a **full corpus walk** despite a `FILE=` argument, and `make graduation-clear` **had no recipe**. §3.2c is **half-reversed by [[D468]]'s packaging fix** — the lint stays whole in `validatePackDocument`, and only the `git blame` half splits | — | keeps its **pack schema 0.28** claim while accepted. No migration, run-schema, or shape-entry claim |
| `measurement-records.md` | **draft — returned to author 2026-08-16** (core sound; 3 open questions + D391 block acceptance) | — | claims **shape-entry schema 0.4** only — one optional `measurements` property + three `$defs`. **No pack lane** (0.28 is claimed and held by `graduation-clearance` — corrected 2026-08-16, [[D472]])**, no run schema, no migration.** Splits the record into a normative half the gate may fail on (`textSha256` + span agreement) and a diagnostic half it may never fail on. **Cross-reviewed 2026-08-16: sound in its core, RETURNED TO AUTHOR** — three open questions must be ruled before `accepted`, and sub-expression readings (D391) were promoted to a blocker. The 4-vs-8 refutation **reproduces independently**; qualified in review to *4 errors + 8 one-flag warnings vs 12 indistinguishable failures* |
| `learner-rating.md` | **accepted 2026-08-22 by claude as register owner, after an independent cross-review (~80 claims re-derived, 14 failed, all corrected in place) whose center catch was a live engine assist inside a rated game**: R6's refused-route enumeration missed `/reveal` → `/analysis` → `/evidence` — `service.analysis` enqueues engine lines behind `#forWrite` alone, so a rated run could read Stockfish mid-game through routes the withholding never named (now in `ASSISTANCE_WITHHELD`; `POST /rated-games` pins `feedbackPolicy: "attempt_end"`; AC-5 extended). Also corrected: *six of nine axes unrefusable* was stale at HEAD (v4's `spoken: "provider"` tier is server-refusable — recounted everywhere it appears); §10a.3's score orientation was inverted (0.8431 is band **2200's** score — right conclusion, backwards premise); `AttemptVerdict`-adjacent counts, `#project` call sites, and `BANNED_JUDGEMENTS` now asserted **by symbol, never by count** (32 at HEAD). Verified clean where it counts: **the Glicko-2 arithmetic end-to-end to four decimals** (constants, update rule, the §7.3 window derivation, calibration against `derived.json`), the void mechanism **event/branch-keyed across all four persisted rewind-family paths**, and the witnessed-play seam composing over shipped `run_grants` with no new mechanism. Five remaining open questions (3/5/6/8/9) registered as non-blocking opens. The two questions that blocked acceptance are ruled: **11** by the earned-rewind economy (a fourth shape — R11 stands unchanged, the economy lives on the encounter-verdict side per accepted `campaign-core` §2, the boss is *rated when clean, winnable regardless*) and **12** by the pinned witnessed-play seam (new §10a.2a — a cohort may one day require it, default not-required, nothing built until a real cohort exists); [[D962]]'s persona/`targetElo` disjointness recorded at the rated predicate without foreclosing either arm. Prior round: **author round 2026-08-16 implementing two owner rulings.** **R10 REVERSED, not narrowed** ([[D437]]): cross-learner comparison ships as a **cohort standing** over an existing `classrooms` row — no second grouping object, no new role or token scope — with consent **transposed** from `teacher-surface` §2.2's submission shape rather than duplicated, since enrolment authorises addressing and *"does not authorise reading anything at all"*. Three layers, **marks as the default on measurement** (RD ≤ 60 needs ≈34 games, so every rating cell in a new club is empty for weeks); **rank by results, group by rating**, with AC-14 requiring that permuting every member's rating changes the order by zero bytes; the self-cheating limitation stated at **four normative sites** and AC-16 failing if any is missing. **The substantive finding is that R10's own reasoning did not survive** ([[D438]]) — *manufactured number vs record of what happened* contradicts this RFC's §1, and relocating the defect to **provenance** is what made it addressable. **A boss is a full game** ([[D439]]): a `position` session played to `terminalOutcome`, **Act II only** — and Act III, the climax, is the one act that cannot carry a result. **Six changes are owed to `design/06-campaign.md`, named and not written (law 5).** Open questions 11 and 12 were opened by that round and **ruled 2026-08-22** ([[D945]]/[[D946]], absorbed in place); [[D420]]'s repair was itself incoherent and is re-fixed ([[D442]]), with the clock-closing simulation arm still **unrun** | — | **claims no pack lane, no run schema, no shape-entry** — the rating is a projection over the existing event log. Its two table sets now hold the **next migration position** after implemented migration 24; create-table only with no backfill. Glicko-2 is argued from three repo numbers; **16 named refusals** (one reversed into §10a's cohort standing plus three narrower clauses). Finds all three no-rating sentences in `docs/return-and-progression.md` **surface-scoped and true verbatim**; owes an **addition** (a doc for the rating's own surface), not an amendment ([[D968]]) |
| `assistance-controls.md` | **draft 2026-08-16 — and TWO OF THE THREE ROWS WERE NOT OWNER QUESTIONS AT ALL.** D307/D308/D309 were bucketed NEEDS-OWNER on their `DESIGN-GAP:` markers; read against `design/05`, two are **defects against a ruling that already shipped**. **D308**: §3a-i says `attempt_end` *"re-closes on the next committed move — the rule that stops a Just Play reveal becoming a live engine feed"*, and **a rule whose job is to bound a reveal presupposes the reveal is reachable**. Four layers implement it — runtime, `RunService.reveal`, the route, `RunApi.reveal` — and **the fifth never wired the switch**: `api.reveal` has exactly two client call sites, both in `App.svelte`, and `RunStateStore` has no `reveal` at all. **D309**: §3b says guided mode *is* the shape library rendered live and `SILENT_ASSISTANCE` sets `guided: "off"` — **the constant and the behaviour disagree**, because the live path reads no `assistance` value anywhere while the gated path is a strict subset. **D307 is split and its row is half wrong**: the defaults claim is a mis-diagnosis — §5 Q4 is marked **RESOLVED** (*"silence is the product's opinion"*), so six identically silent profiles **is** the ruling; only its permission half is genuinely owner-tier, which the row and `teacher-surface` both already say. **One genuine owner question remains and does not block**: does permission vary by session kind at all — priced three ways including *implement it properly*, because a fork offering only "keep the dead field or delete it" omits that option. **⚠ Coordinate: the implementer has `packages/runtime/src/assistance.ts` open** | — | **claims nothing versioned** — verified at HEAD: no lane, no migration position, no route, no error code, `AssistanceConfig.version` stays **4**. No collision with `teacher-surface` (adds two fields to `AssistanceContext`, touches neither existing fields nor the body — landing order free) or `live-marker-quality` (removes one block identified by its own guard expression; the 2026-08-16 *"for the duration of live play"* amendment read and honoured). **Criterion 5 fails at HEAD — that failure IS D309's fix**; criterion 11 is labelled a regression guard **that cannot fail today**, stated plainly so it is never scored as evidence ([[D444]], [[D451]]) |
| `assistance-control-wiring.md` | **accepted 2026-08-22 by claude as register owner, after an independent cross-review whose headline catch was a moved deletion target: the RFC sent the implementer to the pivotal dialog's named-plan block, but feedback stage 1 had relocated it to the inspector's Recorded-moment section — the pivotal dialog now contains nothing to delete** (fixed with the grep-stable consumer id; the parent RFC and D309 described pre-stage-1 code). Scoping de-staled against `intent-presets`' same-day D532/D715 discharge at four sites, with the §8.2 landing-order seam mirrored (wiring lands FIRST, owning the on-ramp `guided` default until `ContextContract` subsumes it; single-owner in either order, verified non-colliding — wiring's stored-wins rule never touches `boardLighting`). Verified clean: the whole reveal chain exists dependency-free (`RunApi.reveal` → `MATCH_LIVE`-honest refusal → `revealFeedback`), criterion 1's policy split is type-enforced (a pack can never expose the control, so no vacuous pass), criteria 8/11 anchored to exactly two files with the two tests that will break. ~40 claims, 2 failed, both corrected.** Wires the already-shipped `attempt_end` reveal into the run controller, makes `guided` own the live shape-marker channel, removes the smaller duplicate, preserves the honest-empty sentence, and applies the one explicitly ruled on-ramp default. It deliberately owns no context ceiling or preset composition; D532 remains with the returned parent/F5 | extracts the dependency-free subset of `assistance-controls.md`; amends `archive/adaptive-guidance.md` controls only | claims nothing versioned |
| `intent-presets.md` | **accepted 2026-08-22 by claude as register owner, after a cross-review that re-derived ~52 claims at source and failed 14 — starting with this RFC's own acceptance-grid arithmetic: 24 admitted / 11 refused, not the drafted 19/16, which ALSO summed to 35 (exactly how a wrong count hides).** The review's center catch: §3's *"structurally impossible"* D493-regression claim was **false in five of six contexts** — only `match` carried the `"legal"` clamp, so a pre-D493 stored `boardLighting: "off"` would have compiled everywhere else; the rules floor is now universal (clamp tokens restricted to `"legal"|"sight"|"evidence"`, each denoting `["legal", token]`, registry-invariant). Also caught: the Summary claimed eleven **production-registered** module ids where zero exist at HEAD; §6 claimed grant events the run log does not carry (only `feedback.revealed` exists); criterion 9's fixture was D444-vacuous for the proactive path (arm (b) added); the dual-source context input gained a typed-refusal equality rule. Verified clean where it counts: the design/05 ∩ algebra quote is **byte-exact** (the misquote class did not recur), all five vocabulary mappings in §1 hold cell-by-cell, and no conflict with `assistance-control-wiring` or the D938 opponent seam. **The Phase-5 activation layer the accepted module foundation waits for; both `learner-modules` D1 and `play-composition` D1 name its landing commit.** Names the two vocabularies production never had: seven `WorkflowContextId`s (the six shipped `ASSISTANCE_PROFILES` + `academy`, whose fall-through to solo-drill defaults is the proposed-D943 defect) and R3's five `PresetId`s promoted as **candidates behind an owner-use validation gate** (the [[D906]](3) budgets→backstops shape; [[D649]]). Quotes the design/05 ∩ algebra **verbatim** (the plan row's `role`/`availability` phrasing is the paraphrase learner-modules' review already caught once) and types all four terms. **Discharges D532/D715 whole**: per-context may-never-show table, `AssistancePermission` gains `"legal"` so the rules floor is a floor and ceiling in one token ([[D493]] structurally unrepeatable), and `deriveWorkflowContext` is one runtime symbol imported by client AND server — `permittedAssistance` must return different permissions than HEAD for match/stream/onramp or criterion 5 fails the landing as vacuous. Preset compiles to modules + the existing v4 config (no migration); stored choices beat preset defaults both directions; mid-run change is argued to be no run event with the reopen condition as a standing criterion (lane 0.19 explicitly not claimed). Opponent policy stays beside, never inside ([[D938]] seam). 5×7 grid: 24 admitted pairs, 11 typed refusals | `planning/evidence-foundation-ux/` | **claims nothing versioned** — new localStorage key grammar `tabiya.workflow.v1.*` (client-only, version inside the value); run lane 0.19 named-and-declined with its reopen condition; server-side store deferred to the future personalization RFC (Discharge D2) |
| `live-sources.md` | **accepted 2026-08-22 by claude as register owner, after a cross-review that found the record UNWRITABLE as drafted and the sanitizer beaten by the fixture itself**: `imported_games.source_kind` is a STRICT CHECK closed over `('pgn_paste','lichess_url')` (`storage.ts:3356`) — §4's INSERT of `'lichess_broadcast'` fails on every database at HEAD, so "no schema change" and claims-none were both false (now a claimed migration, criterion 11 pinning both arms); and the finished fixture carries **61 third-party SAN suffix glyphs OUTSIDE any comment** (`??`×13, `?!`×39, `?`×9 — `33. Kf1??`) that the drafted comment-strip missed entirely — Lichess's blunder verdicts stored as authored-looking text, the exact [[D410]] trap; the strip is now structural (movetext must contain zero `{ } ; [% $ ! ?`) with the six-token arm demoted to evidence that the verdict vocabulary is open (two more classes found in the fixture). ~49 claims re-derived, 6 failed, all corrected; 4/4 harness tests re-run green at HEAD; D959's paste-path claim confirmed live. Phase A of the owner-commissioned [[D947]] lane, drafted on executed evidence: the d947 harness ran 20 real tournament games (10 finished, 10 fetched mid-round) through the shipped `parsePgnMainline` — all parsed, multi-game round bodies refused whole (the splitter is the first new symbol), and the input's **972 `[%eval]` / 59 literate verdicts survive nowhere in the parse but DO survive into storage** because `importGame` retains `pgn: source.pgn` verbatim (`service.ts:555`) — so [[D410]]'s strip lands at the record boundary as `sanitizeBroadcastPgn` with a fail-closed `BROADCAST_ANNOTATION_RESIDUE` assertion, criterion-paired with a paste-path negative control (the [[D444]] vacuity guard). Finished-round ingestion only: URL grammar → split → pick board → strip-with-assertion → the existing `importGame` path, no new session kind, the accepted longitudinal `decision_class='game'` grain consumed untouched. Live-follow, the [[D411]] ceiling bit (pinned as intent-presets §2's second ∩ term, a dynamic `AssistanceContext` sibling of `seatedInContest`), and casting (B5-gated) defer to rows D957/D958; two owner forks + the [[D412]] design clause held in Open questions, not decided | `planning/live-sources/` | claims **one migration position, `behind campaign-core`** — `imported_games.source_kind` CHECK gains `'lichess_broadcast'` (STRICT-table rebuild; the drafted record was unwritable at HEAD, cross-review 2026-08-22); no run-schema lane (no new persisted run field — `movetextDigest` is over parsed moves and the longitudinal rebuild reads `drill_runs` only, so sanitization cannot break byte-identity), `ImportSource`'s new `broadcast` member is server-code union growth, not a register entry |
| `campaign-core.md` | **accepted 2026-08-22 by claude as register owner, after an independent cross-review that re-derived ~70 claims at source and corrected 15 findings in place** (migration position fourth→fifth; the spend-site re-pinned to `RunService.fork`/`enterSimulation` — the drafted compare-path target was a never-persisted scratch mutation; the seal source moved from `TrajectoryLegSpan.sealedState` to `Node.objectiveState` with the campaign verdict pinned as a new object in the `node_sealed` payload; the reward grant, the boss-dodging lint, and `startingModules`' schema home all added; five post-D945 `design/06` citations re-derived; the suspected economy-direction inversion REFUTED — act1 ≥ act2 ≥ act3 is the owner's ruling encoded exactly). **The pure-chess campaign, drafted under the owner's same-day gate waiver ([[D953]]) with [[D945]]'s earned-rewind economy promoted to v1 core**: a 9-node/3-act authored map whose every node is a shape-1 encounter (the only class whose seal mechanism ships — `ObjectiveState`/`sealedState`), module unlocks over the **typed ten** (`Exclude<ModuleId, "rules_floor">` — an earnable rules floor would break the floor-and-ceiling token), the suppressor boss (Balatro's blind, law-8-legal: speaks about the learner's information, never chess), and charges earned by sealing nodes and spent by rewind/proactive-branch inside encounters, enforced server-internal at `RunService.rewind` with typed `CAMPAIGN_REWIND_EXHAUSTED` and **no run field** — the run record honestly does not know it served an encounter; lane 0.19 named-and-declined with a reopen condition (proposed row 2). Registers the **eighth `WorkflowContextId`**, discharging intent-presets D3. Seed numbers ship as `validation: "candidate"` behind the owner-use gate. Deferred with named Discharge rows, never silently decided: the rated boss (incl. the persona/`targetElo` disjointness), shapes 3–4, the prestige/D334 OWNER fork, evidence-dark nodes, time controls. The three traps get refusal clauses with criteria behind them (grep guards for eval vocabulary and charge-counts-as-score) | `planning/campaign/` | claims **one migration position, `behind bot-policy`** — fifth in the landing order at HEAD (`campaign_runs`, `campaign_events`; STRICT, create-table/index only, no backfill); nothing on the other five registers — the eighth-context registration is registry growth inside intent-presets' shipped machinery, and campaign preferences reuse the existing localStorage grammar |
| `pack-population-provenance.md` | **draft 2026-08-17 — RFC-5, the largest of the seven, and its new evidence kind is the mechanism the owner's grounding ruling needs.** Through-line: *a pack may state a fact; the format has nowhere to put where the evidence for that fact lives, and nothing refuses a statement whose evidence cannot exist.* Measured over committed `content/`: **92 packs, all `draft`, 0 published; 68 ledgers, 893 records — and ZERO of either explorer kind** against **31 packs labelling 60 claims `corpus_observed`**. **Spot-check 8 of 8 at the symbol, and 3 of 8 rows carried a materially stale claim** — including [[D157]], whose own update is **false at HEAD** (it says a pack *"now carries the position census"*; the pack carries it as a **prose string** and has no `.evidence.json` at all). It also caught itself citing the **retracted** [[D506]] and rewrote both passages before shipping. **Two refusals it makes and argues**: a pack-side population field (the population already lives in the census record, validated against the manifest request URL — a copy would be validated against nothing), and a corpus basis for `deviationCost`. **A prose-scanning population check is refused too**, because *Classical* is a speed in 14 packs and an **opening name** in ≥6, so the false-positive rate is unboundable. **Found: `refusal-coverage.test.ts` has a `has()` helper and no negative counterpart**, so the suite structurally cannot express a negative fixture — criterion 3 adds `lacks()` | — | claims **pack schema 0.29** plus the **`citable_text` member of `EVIDENCE_KINDS`** — which is exactly what [[D530]]/[[D531]] need to reground the 13 principles from `authors_practice` to `chess_tradition`. No run lane, no shape-entry lane, no principle-entry lane, no migration; all five re-verified at the symbol. `tabiya-claims` carried **at landing, not now**, on law-1 grounds, matching `graduation-clearance`. Two `## Discharges` rows. **RFC-6 inherits pack 0.30** and the don't-copy refusal, which bites harder there because `$defs/structuralExpression` is duplicated across both schemas |
| `feedback-delivery.md` | **accepted 2026-08-16 — lands in TWO STAGES, and does not archive on stage 1.** The owner ruling ([[D462]]) is *ship the surface, then run the binding wave before anyone plays*, and its three obligations were **mentioned in an open question and specified nowhere** until this pass. New §0 fixes that: **stage 1** ships the delivery surface, **stage 2** runs the wave, the RFC stays `implementing` between them, and **criterion 11's ledger flips move to stage 2's commit** so no row closes on a day-zero share. **Criterion 21 deliberately demands no percentage** — §3.2 establishes a permanent residue, so a share target would be unsatisfiable by construction; it demands a **named reason for every still-withheld claim**, in two forms, because `validateClaimBindings` **raises nothing for a claim with no binding** and an issue-code-only test would have been unsatisfiable for exactly the 98 claims the wave has not reached. The wave is priced as **three** kinds of work with the pack-edit population (**63 floor / 83 ceiling**) first-class, and because it changes pack bytes it is a **content wave** carrying that closeout. **One thing is left open and named: the binding wave has no owner** ([[D476]]) — `claim-backing` was named for it and then archived. That blocks **stage 2**, not acceptance. Criteria audited at HEAD: **2a passes vacuously** and is now recorded as `vacuous` rather than as a pass; **criterion 6's kill-gate instrument does not exist**; criterion 5's N=4/N=8 columns have no corpus source | — | **claims nothing versioned**, and takes **no migration position** — deliberately, so it does not join [[D423]]'s contest, now two-way after `opponent-contracts` landed. C7 turned out to have **already shipped** (`PackRecord.boundClaimIds` + `claimBackings`), so it adds no field to `PackRecord` at all |

**Claim-cell correction, 2026-08-21:** `pack-population-provenance`'s legacy cell phrase
*"`tabiya-claims` carried at landing, not now"* is superseded by RFC-1's landing. Its two-line
declaration is present now and is the authority joined to the pack/evidence live-claim rows.

**Assistance-controls status correction, 2026-08-22:** D532 answered the cell's remaining owner
question with option C, a real per-context ceiling. The RFC is returned on D715 because its §4.3
and criterion 11 still encoded rejected option A, and because `RunSessionKind` plus the current
permission vocabulary cannot express all six shipped preference contexts or the rules floor. The
independent reveal/guided/default subset remains buildable and must be split or coordinated with F5
before acceptance.

**Three-draft wave, 2026-08-14** — claim order: `repertoire-gap-finding` first, then
`onramp-guard`, then `open-answer-grading`. Shared-resource claims (migrations, pack
schema, ownership pins) land in that order; a draft that cannot land behind its
predecessor renegotiates here.

**Four-draft wave, 2026-08-14** — claim order: `predicate-wave-2` first, then
`corpus-evidence`, `adoption-wave-1`, `social-match`. Shared-resource claims (pack
schema, migrations, ownership pins) land in that order; a draft that cannot land
behind its predecessor renegotiates here.

**Three-draft wave, 2026-08-14 (second)** — claim order: `polish-surfaces` first, then
`orphan-completion`, then `grounding-pair`. Shared-resource claims (migrations, pack
schema, ownership pins) land in that order; a draft that cannot land behind its
predecessor renegotiates here.

The completed breadth batch and its dependency history are kept in the archive
documents and planning logs rather than duplicated in this index.

## Pack-schema-version register

<!-- register: pack-schema head=0.27 -->

Instituted 2026-08-13 after `pack-studio.md` (then named `pack-studio-and-review.md`) and
`return-and-progression.md` were
both drafted claiming pack schema **0.6**. `DRILL_PACK_SCHEMA_VERSION`
(`packages/schema/src/index.ts:2`) and `schemas/drill_pack.schema.json`'s `$id` are a **shared,
single-writer resource** for exactly the reason a migration number is; claim here before
writing a version into a draft. Unlike a migration, a pack version rebases cheaply — pack
digests are content digests and are unaffected by the `$id`
(`packages/schema/src/drill-pack/digest.ts:58-66`) — so the cost of a collision is a stalled
landing order, not lost data.

### Landed

| version | owner RFC | what it changed |
|---|---|---|
| 0.3 | `archive/outcome-drill-grading.md` | implemented — `objective.grading`, closed `successConditions` union, closed `objective` |
| 0.4 | `archive/line-drill-theory-grading.md` | implemented — `follow_theory`, the `atAuthoredBoundary` trigger |
| 0.5 | `archive/defect-sweep.md` | implemented — required `start.side`, vocabulary-constant collapse |
| 0.6 | `archive/return-and-progression.md` | implemented — `retryVariants`, typed `concepts` |
| 0.7 | `archive/trajectory-drill.md` | implemented — `legs`, `run_trajectory` |
| 0.8 | `archive/pack-studio.md` | implemented — source-derived channel; `provenance.reviewStatus` narrowed to `schema_example \| draft \| published`; typed `reviewers` removed |
| 0.9 | `archive/n-way-comparison.md` | implemented — prediction `grading` removed; numbers are recorded and rendered without a verdict |
| 0.10 | `archive/structural-reading.md` | implemented 2026-08-13, draft — `$defs/structuralFeature` and `$defs/structuralExpression`, a fourth `fenPredicate` variant, a fifth `successCondition` kind (`structural_feature`), `$defs/file`. No migration: rung-0 facts are never persisted |
| 0.11 | `archive/shape-library.md` | implemented — additive only: optional top-level `shapes` (referenced shape-entry ids) and optional `planClass.shapePlan`. `planClasses` stays fully valid; no committed digest moves (the `$id` is not part of any pack document) |
| 0.12 | `archive/defect-batch-2.md` | implemented — tightening only: `$defs/opponentPolicy` gets `additionalProperties: false` (D22); all committed packs and fixtures validate unchanged; no committed digest moves |
| 0.13 | `archive/predicate-wave-2.md` | implemented — additive: `structuralFeature` gains `bishop_on_shade`, `pawn_count` and `king_opposition`; `structuralExpression` gains `mirrored` and `quantified`; shape-entry schema 0.1 → 0.2 with the same duplicated grammar. No migration; rung-0 facts remain derived |
| 0.14 | `archive/onramp-guard.md` | implemented — additive: `feedbackPolicy` enum gains `immediate_guard`; optional top-level `guard` tuning block |
| 0.15 | `archive/open-answer-grading.md` | implemented — additive: checkpoint `interaction` union gains `stated_reasoning` with grounded key points (closed four-kind union); reconciled behind 0.14 |
| 0.16 | `archive/authoring-frictions.md` | implemented — additive/widening only: `deviationLocation` gains `{atStart}`, `simpleTrigger` gains `atStart`, new `variantOf` (three directional relations), `branchLengthTarget` max 20→40, guard gains `fireOnMate`/`rulesTier`/`window`/`overrides`, `rules_fact` enum gains `draw`, tablebase category enum widens to five determinate values. All committed content remains valid; no content digest moved |
| 0.17 | `archive/tempo-vocabulary.md` | implemented — a timing window is a branch-local ledger: commitment opening, ordered closes, move-set readiness/tolerance, luxury spend, seven verdicts, authored `outpaced` control, and `tempo:` applied evidence. Additive plus removal of the unused checkpoint-local point-pair form; no committed content digest moved |
| 0.18 | `archive/predicate-wave-3.md` | implemented — additive: `plan_consequence` success-condition kind, `king_zone`, `piece_distance`, `piece_count`, `pack.shapes` relation `present`/`prospective`. Ships `pawn_count` and `piece_reach_count scope:"every"` as deprecation WARNINGS (schema removal deferred to wave 4 because `registered_shapes` rows are immutable) |
| 0.20 | `archive/opening-evidence-path.md` | implemented — additive: `$defs/objectiveGrading.assessedBy` gains a third `oneOf` member `kind: "engine"`. Retires `VERIFY_ASSESSMENT_NOT_SYZYGY`; narrows `OBJECTIVE_GRADING_UNSUPPORTED` to legs |
| 0.21 | `archive/deviation-classes.md` | implemented — additive: `mistake` (`plan\|timing\|tactical`) and `cost` on `$defs/deviation`, `moveUci` on `guard.overrides[]`. Ships `cost` author-declared and UNBACKED per the 2026-08-15 coordinator ruling |
| 0.22 | `archive/transition-primitives.md` | implemented — additive: an eighth `successCondition` arm `transition_feature`, a `transitionFeature` `ObjectivePredicate` member, six transition leaves and a `position` bridge node. Widens `RULES_EVIDENCE_FACTS` by six (verified migration-free as a *mechanism* — refs are bare strings, no schema enum). **0.19 is frozen shut**, not free |
| 0.23 | `archive/engine-leverage.md` | implemented 2026-08-20 closeout — `guard.conditions[]`, `$defs/engineCondition`, a fourth `deviationCost` arm; landed at `18d2832` plus `b65bd4e` |
| 0.24 | `archive/vocabulary-wiring.md` | implemented 2026-08-20 closeout — `plan_signature` leaf on `$defs/structuralExpression`, deprecating `plan_consequence`; landed at `caa8afa` plus `e9695cf` |
| 0.25 | `archive/format-surface.md` | implemented 2026-08-16 — per-leg `opponentPolicy` and `shapes` on `$defs/trajectoryLeg` (D96); `$defs/legOpponentPolicy`; `$defs/shapeReference` extracted; `retryVariants` warning and schema-owned dispositions. No run-schema change, no migration |
| 0.26 | `archive/claim-backing.md` | implemented 2026-08-16 — optional ledger-side `claimBindings` key prose by claim id plus text digest, direct prose support is refused, explorer attachment preserves pack bytes, and `feedbackClaim.principles` resolves against the official principle-entry 0.1 registry. `$defs/feedbackClaim` is closed. The content migration linked 82 author-principle claims to 12 used entries and refreshed affected ledger digests; one real Philidor claim is now tablebase-bound without changing its prose |
| 0.27 | `archive/pack-graduation.md` | `provenance.graduationBlockers` states and closed `provenance` |

### Live claims

| claim | claimant RFC | changes | declared at |
|---|---|---|---|
| lane 0.28 | `graduation-clearance.md` | $defs/graduationEntry.clearance (new, closed object); .resolved.clearance (new, required); .accepted.unreachableBecause (new, required); clearedBy (withdrawn, with its oneOf arm) | `tabiya-claims` |
| lane 0.29 | `pack-population-provenance.md` | $defs/provenance.corpusEvidence (new, closed union on state); $defs/timingWindow.properties.note maxLength 400 -> 2000; $defs/feedbackClaim.evidenceTypes (+ provenance_note) | `tabiya-claims` |

Landing order follows the numbers. A draft that cannot land behind its
predecessor renegotiates here rather than renumbering unilaterally.

## Run-schema-version register

<!-- register: run-schema head=0.17 -->

### Landed

| version | owner RFC | what it changed | landed at |
|---|---|---|---|
| 0.17 | `archive/opponent-contracts.md` | optional `OpponentSelection.orderingBasis` | `6ba0736` |

### Live claims

| claim | claimant RFC | changes | declared at |
|---|---|---|---|
| lane 0.18 | `bot-policy.md` | OpponentSelection.policy (packages/runtime/src/types.ts:102 OpponentSelection gains an optional typed policy-decision record; opponent.move_selected payload widens) | `tabiya-claims` |

## Shape-entry-schema-version register

<!-- register: shape-entry-schema head=0.3 -->

### Landed

| version | owner RFC | what it changed | landed at |
|---|---|---|---|
| 0.3 | `archive/vocabulary-wiring.md` | `plan_signature` structural-expression leaf | `caa8afa` |

### Live claims

| claim | claimant RFC | changes | declared at |
|---|---|---|---|
| lane 0.4 | `measurement-records.md` | measurements property; $defs/measurementRecord; $defs/measurementSpan; $defs/measurementDisposition | `tabiya-claims` |

## Principle-entry-schema-version register

<!-- register: principle-entry-schema head=0.1 -->

### Landed

| version | owner RFC | what it changed | landed at |
|---|---|---|---|
| 0.1 | `archive/claim-backing.md` | official principle-entry registry contract | `5a63225` |

### Live claims

| claim | claimant RFC | changes | declared at |
|---|---|---|---|

## Evidence-kinds register

<!-- register: evidence-kinds members=7 -->

### Landed

| member | added by | added at |
|---|---|---|
| opening_identity | `archive/content-sourcing-foundation.md` | `a30b36c` |
| position_legality | `archive/content-sourcing-foundation.md` | `a30b36c` |
| explorer_frequency | `archive/content-sourcing-foundation.md` | `a30b36c` |
| explorer_position_census | `archive/claim-backing.md` | `5a63225` |
| tablebase_result | `archive/content-sourcing-foundation.md` | `a30b36c` |
| engine_eval | `archive/content-sourcing-foundation.md` | `a30b36c` |
| puzzle_provenance | `archive/content-sourcing-foundation.md` | `a30b36c` |

### Live claims

| claim | claimant RFC | changes | declared at |
|---|---|---|---|
| members citable_text | `pack-population-provenance.md` | EVIDENCE_KINDS (apps/server/src/sourcing/types.ts) | `tabiya-claims` |

**Content-sourcing split, 2026-08-12.** An adversarial review rejected the single
`content-sourcing-pipelines.md` draft and recommended a four-way split; the draft
is deleted, not stubbed, and its content is fully rehomed. **B6a is the
foundation and the other three name it in `Depends on:`** — it ships the artifact
triple (`pack.json` / `evidence.json` / `sources.json`), the fetch manifest, the
deterministic-output rule, the licence and attribution encoding required by the
2026-08-12 content-rights ruling, the `sourcing-check` gate, and the
`chess-openings` line skeleton. The batch landed **B6a → B6b → B6c → B6d**
(reasoning in `archive/content-sourcing-foundation.md` §6). B6d is a **redesign**, not a
rehome: the withdrawn §5 asked the learner to solve the tactic, which
`design/00-thesis.md:70,93-94` rejects.


**Exploration gate opened by owner ruling 2026-08-12** (logged in
`planning/exploration/log.md`): E1 met, E2 advisory, E3/E4/E5 accepted as in-flight
risk with their experiments folded into implementation. Previously: The repo is in the exploratory phase.
The first experimental vertical-slice RFC may be drafted only after the
exploration-to-slice gate in `planning/exploration/gates.md` passes, or an owner ruling
(logged in `planning/exploration/log.md`) opens it early. Product RFCs remain closed until
the slice passes the later continuation gates. See the "Exploration gate" section of
`0000-rfc-process.md`.

**Breadth sequencing ruling, 2026-08-11:** the owner opened design and RFC
planning for the complete B1–B8 product surface in
`design/03-product-breadth.md`. This does not waive RFC review or authorize
unspecified implementation; it supersedes the assumption that the next work is
content for one narrow slice. Breadth RFCs must preserve the global shell and
name the B-gates they complete before code begins.

## Migration register

<!-- register: migration head=24 -->

Instituted 2026-08-12 after two RFCs drafted in parallel both claimed database
migration 2 and `STORAGE_VERSION` 1→2, so neither could land independently. A
migration number is a **shared, single-writer resource**; claim it here before
writing it into a draft.

### Landed

| migration | `STORAGE_VERSION` | owner RFC | what it changed |
|---|---|---|---|
| 1 | 0→1 | shipped | implemented; **body** rewritten by `archive/pack-optional-runs.md` §8 to stop replaying through `projectRun` (no version change, no new number) |
| 2 | 1→2 | `archive/learner-identity-and-authorization.md` | implemented |
| 3 | 2→3 | `archive/pack-optional-runs.md` | implemented after migration 2 |
| 4 | 3→4 | `archive/terminal-outcome-events.md` | implemented; upgrades ordinary v0.5 snapshots and quarantines pre-producer outcome events. Its body is frozen to literal `"0.6"` by `archive/line-drill-theory-grading.md` §11b so later schema constants cannot mis-stamp rows before migration 5 |
| 5 | 4→5 | `archive/line-drill-theory-grading.md` | implemented — run schema v0.7; adds `policyModeApplied` to `opponent.move_selected.selection`, historical selections migrate to `unknown` and are never inferred |
| 6 | 5→6 | `archive/return-and-progression.md` | implemented — attempts, schedules, progress and position statistics; create-table/index plus one-time backfill. Body corrected 2026-08-16: the backfill selects only the frozen `schema_version = '0.7'`, so quarantined pre-0.5 rows never enter `projectAttempts`. |
| 7 | 6→7 | `archive/pack-studio.md` | implemented — studio drafts, retained playtest bytes, and registered packs |
| 8 | 7→8 | `archive/n-way-comparison.md` | implemented — run schema v0.8, branch origin and prediction event |
| 9 | 8→9 | `archive/live-session-platform.md` | implemented — live-session tables; create-table/index only |
| 10 | 9→10 | `archive/shape-library.md` | implemented — `shape_drafts` and `registered_shapes`; create-table/index plus the pack-style account-deletion tombstone. Run schema stays 0.8 by design (firings are derived projections, never events) |
| 11 | 10→11 | `archive/branch-groups.md` | implemented — run schema v0.9: adds the `group.created` event and widens `policyModeApplied` with `enumerated`. Stamp-only body (frozen literals `"0.8"`→`"0.9"`, no data rewrite exists to do); mandatory because reads filter on the current run-schema version |
| 12 | 11→12 | `archive/game-import-and-story.md` | implemented — run schema v0.10: `sessionKind` gains `imported` (non-pack projection rules unchanged). Creates `imported_games` (one row per imported run: source kind/url, movetext digest, headers, original PGN bytes, licence note) plus the pack-style account-deletion tombstone, and stamps frozen literals `"0.9"`→`"0.10"` (no data rewrite). Landed behind implemented migration 11 |
| 13 | 12→13 | `archive/adoption-wave-1.md` | implemented — creates `public_tokens` + `run_derivations`; literal CHECK strings per the migration-9 freeze lesson |
| 14 | 13→14 | `archive/social-match.md` | implemented — creates `match_states`; rebuilds `live_sessions`, `session_journal`, and `public_tokens` with widened closed vocabularies; no run/pack schema change. Landed behind implemented migration 13 |
| 15 | 14→15 | `archive/repertoire-gap-finding.md` | implemented — creates `repertoires`, `repertoire_moves`, `repertoire_scans`, `repertoire_gap_runs`; create-table/index only, no backfill or rebuild; no run/pack schema change |
| 16 | 15→16 | `archive/onramp-guard.md` | implemented — stamp-only: run schema `"0.10"`→`"0.11"` (`RunFeedbackPolicy` gains `immediate_guard`; no new event type, no data rewrite). Rebased from an initial 15 claim behind `repertoire-gap-finding`'s wave claim #1 |
| 17 | 16→17 | `archive/open-answer-grading.md` | implemented — **stamp-only, no table** (transcripts are run events; run deletion is the retention story); run schema 0.11→**0.12** (`reasoning.recorded` event). Reconciled behind onramp-guard per the pinned wave order |
| 18 | 17→18 | `archive/grounding-pair.md` | implemented — stamp-only: run schema 0.12→**0.13** (`RunOpponentMode`/`PolicyModeApplied` gain `perfect_tablebase`; no new event type, no data rewrite) |
| 19 | 18→19 | `archive/resistance-spectrum.md` | implemented — stamp-only: run schema 0.13→**0.14** (`practical_resistance` applied-record widenings, `eloHonored`/`eloApplied`). No data rewrite; historical group-journal rows compare equal |
| 20 | 19→20 | `archive/engine-request-contract.md` | implemented — stamp-only: run schema 0.14→**0.15** (`SelectionCandidate.offWindow`); D60's narrowing mechanism ships but D60 remains open pending R10 |
**MIGRATION NUMBERS ARE ASSIGNED AT LANDING, NOT AT CLAIM — instituted 2026-08-16, and this
register was wrong until now.** `storage.ts` migrates with `if (migration.version <= version)
continue`, so **a database that reaches N skips every migration numbered below N that lands
afterwards, silently and permanently.** A claimed-but-unlanded number is therefore not a
reservation; it is a hole that the next migration to land will seal shut. Claude created
exactly that hazard on 2026-08-16 by telling `board-annotation` to claim **23** while **22**
(`teacher-surface`) was claimed, owner-blocked and unlanded — its cross-review caught it.

**The rule:** a draft claims a **position in the landing order**, never a number. The number is
taken when the migration actually lands, and it is always `STORAGE_VERSION + 1`. The rows below
record order and history; a row for an unlanded migration is a *claim on the next free slot at
its turn*, not on the integer printed in it. **An implementer who finds the next contiguous
number already taken renegotiates here rather than skipping.** The earlier 21/22 reassignment
was sound for the same reason — the draft that could not land is the one that moved.

| 21 | 20→21 | `archive/engine-leverage.md` | **implemented 2026-08-20 closeout** — landed at `18d2832`; stamp-only run schema 0.15→**0.16**. **Reassigned from 22.** Migration body uses frozen literals, never the moving schema constant |
| 22 | 21→22 | `archive/board-annotation.md` | **implemented 2026-08-16** — creates `run_marks` plus two indexes; create-table/index only, no snapshot rewrite and no run-schema change. `teacher-surface` remains unlanded and therefore takes the next contiguous number at its turn |
| 23 | 22→23 | `archive/opponent-contracts.md` | **implemented 2026-08-16** at `6ba0736`, independently approved and archived after the A10 correction plus D452–D458 follow-ups. Stamp-only run schema 0.16→**0.17**; optional `OpponentSelection.orderingBasis`, historical selections remain absent and are never inferred. Body uses frozen literals. **D457 remains open** pending a newly retained precise-DTZ corpus |
| 24 | 23→24 | `archive/teacher-surface.md` | **implemented 2026-08-22** — creates classrooms, memberships, assignments and submissions; adds expiring/provenanced run grants and optional classroom ownership for live sessions. Additive schema only; no run- or pack-schema change |

### Live claims

| claim | claimant RFC | changes | declared at |
|---|---|---|---|
| position next | `learner-rating.md` | learner_ratings; rated_games; rating_periods | `tabiya-claims` |
| position next | `learner-rating.md` | cohort_standings; standing_members; learner_marks | `tabiya-claims` |
| position behind learner-rating | `longitudinal-store.md` | learner_observations; learner_structure_stats | `tabiya-claims` |
| position behind longitudinal-store | `bot-policy.md` | stamp-only frozen-literal run-schema stamp "0.17"->"0.18" in apps/server/src/storage.ts; no table, no data rewrite | `tabiya-claims` |
| position behind bot-policy | `campaign-core.md` | campaign_runs; campaign_events | `tabiya-claims` |
| position behind campaign-core | `live-sources.md` | imported_games.source_kind CHECK gains 'lichess_broadcast' (storage.ts:3356; STRICT table — SQLite CHECK edits require a rebuild migration) | `tabiya-claims` |

A migration's *number* is the shared resource, but its *body* is shared too: an
already-applied migration still runs on databases that never reached it, so a
schema change can break a migration it did not touch. Record body edits here as
well.

**F3 landed before F2**, decided 2026-08-12 on three grounds: D1 was a
live defect (a run link is a write credential) and the deployment ruling is
hosted multi-user, so identity is a prerequisite to exposing anything at all;
F2's v0.4 snapshot quarantine is simpler to write once ownership columns exist
than the reverse; and F2 is the riskier change (`RunService.create` becomes
async across ~15 call sites), so it should not also carry the migration that
another draft depends on. F2 therefore rebased its migration to 3 and recorded
the dependency explicitly.

Any RFC touching persisted shape adds its row here in the same commit that
drafts the migration.

## Cross-draft ownership pins

Instituted 2026-08-14 after `archive/shape-library.md` and `adaptive-guidance.md`, drafted in
parallel, **both** scoped the minimal Just Play position player — the register-collision
class on an implementation surface instead of a number. Pin: **`archive/shape-library.md` owns the
position player** (it scoped it concretely as its largest surface, and its acceptance test
cannot exist without it); `adaptive-guidance.md` names it in `Depends on:` and ships no
client entry of its own. Landing order follows: shape-library before adaptive-guidance.

Pin, 2026-08-14 (parallel wave): **`archive/adoption-wave-1.md` owns the `public_tokens` table** —
the single trust surface for anonymous capability tokens (hashed 32-byte tokens, closed
typed `scope` CHECK, per-token revocation, uniform 404 non-disclosure, creator-cascade
deletion). `archive/social-match.md` (friend-link tokens, same trust surface) adds its
scopes by widening the CHECK in migration 14, names `archive/adoption-wave-1.md` in
`Depends on:`, and creates no second token table.

## Withdrawn

Kept for the record (RFC-0000: `withdrawn` = abandoned, not superseded). Their
findings are salvaged into content-era BACKLOG rows — read the withdrawal notes
before re-attempting this territory.

| RFC | Why |
|---|---|
| `withdrawn/authoring-contracts-v03.md` | Specified an authored vocabulary with no authored content to design against; three reviews, three variations of that fault |
| `withdrawn/evidence-composer.md` | Prerequisite withdrawn; the packet abstraction proved unnecessary for v1 |

## Archive

| RFC | Status | Canonical docs link |
|---|---|---|
| `archive/teacher-surface.md` | implemented 2026-08-22 — classroom rosters, assignments and explicit submission consent; bounded review grants; scheduled pack nights; reviewer/contest assistance context | `docs/classrooms.md`, `docs/live-sessions.md`, `docs/adaptive-guidance.md`, `docs/app-shell.md` |
| `archive/semantic-evidence-selection.md` | implemented 2026-08-21 — 33 operand-preserving events, research-only eligibility, complete local-alternative selection, exact source adapters and retained authored/CC0 baselines | `docs/semantic-evidence.md` |
| `archive/evidence-contract-manifest.md` | implemented 2026-08-21 — 19 producers, 93 exact projections, 23 sealed consumer operations and 142 bindings | `docs/evidence-contract.md` |
| `archive/rfc-lifecycle-completion.md` | implemented 2026-08-21 — seven-state grammar, surviving-obligation sections, P1–P6 and archive/root parity | `rfc/0000-rfc-process.md`, `docs/development.md` |
| `archive/shared-resource-registers.md` | implemented 2026-08-21 — six derived landed/live registers, active-RFC declarations, C1–C6 and `make verify` integration | `docs/development.md`, `rfc/0000-rfc-process.md` |
| `archive/authored-consequence-lifecycle.md` | implemented 2026-08-21 — D645/D646 closed; lifecycle replay 8→0 packs and Feedback C1 42/50→50/50 | `docs/branch-runtime.md`, `docs/outcome-drill-grading.md` |
| `archive/branch-runtime.md` | implemented | `docs/branch-runtime.md` |
| `archive/drill-pack-format.md` | implemented | `docs/drill-pack-format.md` |
| `archive/engine-workers.md` | implemented | `docs/engine-workers.md` |
| `archive/drill-client.md` | implemented | `docs/drill-client.md` |
| `archive/app-shell.md` | implemented | `docs/app-shell.md` |
| `archive/explanation-grounds.md` | implemented | `docs/explanation-grounds.md` |
| `archive/authored-feedback-delivery.md` | implemented | `docs/drill-client.md`, `docs/drill-pack-format.md` |
| `archive/authored-explanation-surface.md` | implemented | `docs/explanation-grounds.md` |
| `archive/learner-identity-and-authorization.md` | implemented | `docs/identity-and-authorization.md`, `docs/branch-runtime.md` |
| `archive/pack-optional-runs.md` | implemented | `docs/branch-runtime.md`, `docs/drill-client.md` |
| `archive/terminal-outcome-events.md` | implemented | `docs/branch-runtime.md`, `docs/drill-client.md`, `docs/explanation-grounds.md` |
| `archive/content-sourcing-foundation.md` | implemented | `docs/content-sourcing.md` |
| `archive/content-sourcing-syzygy.md` | implemented | `docs/content-sourcing.md` |
| `archive/content-sourcing-explorer.md` | implemented | `docs/content-sourcing.md` |
| `archive/content-sourcing-position-seeds.md` | implemented | `docs/content-sourcing.md` |
| `archive/outcome-drill-grading.md` | implemented | `docs/outcome-drill-grading.md`, `docs/drill-pack-format.md`, `docs/branch-runtime.md`, `docs/drill-client.md`, `docs/content-sourcing.md` |
| `archive/line-drill-theory-grading.md` | implemented | `docs/drill-pack-format.md`, `docs/branch-runtime.md`, `docs/engine-workers.md`, `docs/drill-client.md`, `docs/explanation-grounds.md`, `docs/outcome-drill-grading.md` |
| `archive/defect-sweep.md` | implemented | `docs/drill-pack-format.md`, `docs/drill-client.md`, `docs/engine-workers.md`, `docs/development.md`, `docs/content-sourcing.md`, `docs/outcome-drill-grading.md` |
| `archive/return-and-progression.md` | implemented | `docs/return-and-progression.md`, `docs/drill-pack-format.md`, `docs/app-shell.md` |
| `archive/trajectory-drill.md` | implemented | `docs/trajectory-drill.md`, `docs/drill-pack-format.md`, `docs/branch-runtime.md`, `docs/drill-client.md` |
| `archive/pack-studio.md` | implemented | `docs/pack-studio.md`, `docs/drill-pack-format.md`, `docs/app-shell.md` |
| `archive/n-way-comparison.md` | implemented | `docs/n-way-comparison.md`, `docs/branch-runtime.md`, `docs/explanation-grounds.md`, `docs/drill-pack-format.md` |
| `archive/live-session-platform.md` | implemented | `docs/live-sessions.md`, `docs/identity-and-authorization.md`, `docs/app-shell.md` |
| `archive/shape-library.md` | implemented | `docs/shape-library.md`, `docs/drill-pack-format.md`, `docs/drill-client.md`, `docs/pack-studio.md` |
| `archive/adaptive-guidance.md` | implemented | `docs/adaptive-guidance.md`, `docs/explanation-grounds.md`, `docs/app-shell.md` |
| `archive/defect-batch-2.md` | implemented | `docs/branch-runtime.md`, `docs/drill-pack-format.md`, `docs/structural-reading.md` |
| `archive/branch-groups.md` | implemented | `docs/branch-groups.md`, `docs/branch-runtime.md`, `docs/engine-workers.md`, `docs/drill-client.md` |
| `archive/game-import-and-story.md` | implemented | `docs/game-import-and-story.md`, `docs/branch-runtime.md` |
| `archive/predicate-wave-2.md` | implemented | `docs/structural-reading.md`, `docs/drill-pack-format.md`, `docs/shape-library.md`, `docs/explanation-grounds.md` |
| `archive/runtime-corpus-evidence.md` | implemented | `docs/runtime-corpus-evidence.md`, `docs/adaptive-guidance.md`, `docs/explanation-grounds.md`, `docs/branch-groups.md` |
| `archive/adoption-wave-1.md` | implemented | `docs/adoption-wave-1.md`, `docs/game-import-and-story.md`, `docs/adaptive-guidance.md`, `docs/return-and-progression.md`, `docs/live-sessions.md` |
| `archive/social-match.md` | implemented | `docs/live-sessions.md`, `docs/identity-and-authorization.md`, `docs/app-shell.md` |
| `archive/repertoire-gap-finding.md` | implemented | `docs/repertoire-gap-finding.md`, `docs/runtime-corpus-evidence.md`, `docs/return-and-progression.md` |
| `archive/onramp-guard.md` | implemented | `docs/drill-pack-format.md`, `docs/drill-client.md`, `docs/branch-runtime.md`, `docs/explanation-grounds.md`, `docs/outcome-drill-grading.md`, `docs/trajectory-drill.md`, `docs/adaptive-guidance.md` |
| `archive/open-answer-grading.md` | implemented | `docs/open-answer-grading.md`, `docs/drill-pack-format.md`, `docs/drill-client.md`, `docs/explanation-grounds.md` |
| `archive/board-annotation.md` | implemented | `docs/board-annotation.md`, `docs/live-sessions.md`, `docs/branch-runtime.md` |
| `archive/polish-surfaces.md` | implemented | `docs/app-shell.md`, `docs/adaptive-guidance.md` |
| `archive/orphan-completion.md` | implemented | `docs/n-way-comparison.md`, `docs/pack-studio.md`, `docs/return-and-progression.md` |
| `archive/grounding-pair.md` | implemented | `docs/tablebase-grounding.md`, `docs/content-sourcing.md`, `docs/engine-workers.md`, `docs/outcome-drill-grading.md` |
| `archive/authoring-frictions.md` | implemented | `docs/drill-pack-format.md`, `docs/tablebase-grounding.md`, `docs/content-sourcing.md`, `docs/outcome-drill-grading.md`, `docs/branch-runtime.md`, `docs/development.md` |
| `archive/validator-integrity.md` | implemented | `docs/drill-pack-format.md`, `docs/trajectory-drill.md`, `docs/outcome-drill-grading.md` |
| `archive/tempo-vocabulary.md` | implemented | `docs/drill-pack-format.md`, `docs/drill-client.md`, `docs/branch-runtime.md`, `docs/explanation-grounds.md`, `docs/outcome-drill-grading.md`, `docs/structural-reading.md` |
| `archive/resistance-spectrum.md` | implemented | `docs/engine-workers.md`, `docs/outcome-drill-grading.md`, `docs/branch-runtime.md`, `docs/drill-pack-format.md` |
| `archive/predicate-wave-3.md` | implemented | `docs/structural-reading.md`, `docs/drill-pack-format.md`, `docs/shape-library.md`, `docs/explanation-grounds.md` |
| `archive/opening-evidence-path.md` | implemented | `docs/engine-grounding.md`, `docs/content-sourcing.md`, `docs/tablebase-grounding.md`, `docs/drill-pack-format.md` |
| `archive/branch-set-scale.md` | implemented | `docs/branch-set-scale.md`, `docs/n-way-comparison.md`, `docs/branch-groups.md` |
| `archive/deviation-classes.md` | implemented | `docs/drill-pack-format.md`, `docs/drill-client.md` |
| `archive/engine-request-contract.md` | implemented | `docs/engine-workers.md`, `docs/branch-runtime.md`, `workers/maia/README.md` |
| `archive/fixture-realism.md` | implemented | `docs/development.md`, `docs/tablebase-grounding.md`, `docs/content-sourcing.md` |
| `archive/client-surface-floor.md` | implemented | `docs/app-shell.md` |
| `archive/live-surface-honesty.md` | implemented | `docs/live-sessions.md`, `docs/adaptive-guidance.md` |
| `archive/pack-graduation.md` | implemented | `docs/pack-graduation.md`, `docs/drill-pack-format.md` |
| `archive/evidence-at-runtime.md` | implemented | `docs/recorded-evidence.md`, `docs/explanation-grounds.md` |
| `archive/opponent-contracts.md` | implemented | `docs/engine-workers.md`, `docs/tablebase-grounding.md`, `docs/branch-runtime.md` |
| `archive/live-marker-quality.md` | implemented | `docs/adaptive-guidance.md` |
| `archive/dead-vocabulary.md` | implemented | `docs/expression-census.md` |
| `archive/engine-leverage.md` | implemented | `docs/engine-workers.md`, `docs/content-sourcing.md`, `docs/drill-pack-format.md`, `docs/explanation-grounds.md` |
| `archive/vocabulary-wiring.md` | implemented | `docs/drill-pack-format.md`, `docs/structural-reading.md` |
| `archive/structural-reading.md` | implemented | `docs/structural-reading.md`, `docs/drill-pack-format.md`, `docs/explanation-grounds.md` |
| `archive/transition-primitives.md` | implemented | `docs/transition-primitives.md`, `docs/structural-reading.md`, `docs/drill-pack-format.md` |
| `archive/expression-census.md` | implemented | `docs/expression-census.md`, `docs/development.md` |
| `archive/format-surface.md` | implemented | `docs/drill-pack-format.md`, `docs/trajectory-drill.md`, `docs/shape-library.md` |
| `archive/claim-backing.md` | implemented | `docs/claim-backing.md`, `docs/drill-pack-format.md`, `docs/content-sourcing.md` |

## The archive sketches are quarry, not RFCs

`archive/brief-v2/rfcs/RFC-0001..0008` and `archive/brief-v2/adrs/ADR-0001..0006` are
pre-validation decision sketches from the brief. They are design-tier material: future
real RFCs mine them for content and cite them, but nothing in `archive/` has RFC status.
Their topics are tracked as rows in `design/BACKLOG.md`; the ADR decisions are tracked
in that file's Provisional decisions table with revisit triggers.

## Deferred decisions register

Decisions deliberately punted, each with a named owner so defaults are not chosen
silently later.

| Deferred decision | Origin | Owner | Why it matters |
|---|---|---|---|
| Server language | ✅ resolved 2026-08-12: **TS core + Go workers** doctrine (chess-semantics code is TS/shared runtime; self-contained data-format workers are Go; Python only inside Maia sidecar containers) | — | `design/research/stack-selection.md` |
| Client framework | ✅ resolved 2026-08-12: **Svelte 5** + Vite | — | `design/research/stack-selection.md` |
| Client routing | ✅ resolved 2026-08-11: **hand-rolled history-API router** (~100 lines); no SvelteKit migration, no routing dependency | — | `rfc/archive/app-shell.md` AS-C5 |
| SQLite vs PostgreSQL for runs/branches | ✅ resolved 2026-08-12: **SQLite ratified**. PostgreSQL remains a bounded follow-up for multi-host deployment or demonstrated write contention. Ruling and proposal: `planning/archive/branch-runtime/log.md` | — | `docs/branch-runtime.md` |
| Source model, deployment, monetization, and content/data rights | exploration Q2 | Marco | Gates public release; GPL/AGPL obligations constrain combinations but do not prohibit charging |
