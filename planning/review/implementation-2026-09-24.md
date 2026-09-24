# Review Map — implementation receipt (2026-09-24)

Authority: owner direction in session, 2026-09-24 — build `rfc/review-map.md` now as a parallel agent,
with no further review cycle; genuine RFC defects are fixed inline with a changelog line, every other
finding becomes a test. Status after this commit: **`awaiting D1–D6`** (see *What remains*).

## What landed

| site | change |
|---|---|
| `packages/runtime/src/voice.ts` | [[D1409]] licence-by-span for the judgement arm: `ungroundedResidue` (leftmost, longest, byte-exact, non-overlapping grounding spans) and `judgementWordsOutsideGrounding`; `voiceCheck` no longer joins the sentence partition for that arm. Squares, moves, nouns and prescriptive verbs stay packet-relative ([[D1419]] follow-up) |
| `packages/runtime/src/grade-reading.ts` | one reading of a recorded eval payload as a White-perspective grade operand (instrument = requested search limit) and the mover's Win% through `winPercentFromCp` |
| `packages/runtime/src/evidence-factories.ts` | `derived.grade.move_quality@1` implemented: the single production caller of `moveQualityGrade`; below threshold it emits nothing, an abstention is an unavailable reason. Pinned value profile regenerated |
| `packages/runtime/src/review-map.ts` | `reviewMapProjection` (rows for every ply, grade sentences, accuracy with coverage gate, 0..3 moments, per-move evidence panel incl. recorded-semantic-path events, computed footer) and `selectReviewMoments` (the only moment selector) |
| `packages/runtime/src/review-map-templates.ts` | `REVIEW_MAP_TEMPLATES` / `reviewText`: every authored string on the surface |
| `packages/runtime/src/story.ts` | removed the ranked-eight reducer (`storyMomentSelection`, `selectedStoryMoments`); `storyEvaluation` now honours `perspective: "white"` (the Stockfish executor's declared perspective — previously a black-to-move node read with the wrong sign); `evidenceGroundingLabel` exported |
| `apps/server/src/service.ts` | `review()` (read-only: enqueues no job, writes no event; consumes `recordedSemanticPathOperation` — that RFC's D1 production consumer), `#storyContext` shared with `story()`, `publicStory()` reading the same `reviewMapProjection` moments |
| `apps/server/src/rest.ts` | `GET /runs/:id/review`; the `/shared/:token` card page renders the review's moments, selection sentence and computed footer through templates |
| `apps/server/src/application.ts` | the mock evidence executor declares `perspective: "white"` like the real one |
| `apps/web/src/lib/ReviewMapScreen.svelte` | the surface; replaces `GameStoryScreen.svelte` (deleted with its test) |
| `apps/web/src/lib/review-response.ts` | closed payload check, incl. "a grade renders only as its grounded sentence" and "accuracy renders only at full coverage" |
| `apps/web/src/lib/story-card.ts` | card built from the review's moment list; footer from admitted sources; `momentIds` exposed |
| `apps/web/src/App.svelte`, `apps/web/src/lib/api.ts` | `/review/game/:runId` renders the Review Map from `api.review`; retry = lease → rewind → fork `story-reentry` → open run |
| `docs/game-import-and-story.md` | Review Map section; stale Story paragraphs updated |

## Criteria → tests

| # | test(s) | state |
|---|---|---|
| 1 | `packages/runtime/src/review-map.test.ts` "[criterion 1]" (70-ply real game), "[criterion 1 guard]"; `apps/web/src/lib/review-map-screen.test.ts` "[criterion 1]"; `apps/server/src/review-map.test.ts` (40 plies over HTTP); browser import journey | green |
| 2 | runtime "[criterion 2]" (grade count = independent Win%-drop count; < half the rows; no ok/good class); web "[criteria 2, 3]" | green |
| 3 | runtime "[criterion 3]" (operand regexes, F-COR-1 `assertMoveQualityGradeSentence(grade, "Mistake")` throws, word-only is a D1409 violation); web "[criteria 2, 3]" (chip text = sentence; replacing a chip with its word turns the check red; payload validator refuses a word-only grade) | green |
| 4 | server "serves every ply…" (row mid-line, last row and every moment entry each fork `story-reentry` from a second writer id; original mainline node list unchanged); web "[criterion 4]" (enabled Retry on every row and card, entry ids); browser import journey (retry from move 2 on a device without the writer id, play Bc4, original line intact) | green |
| 5 | server "[criterion 5]" (spectator gets `viewer.mayWrite: false`; lease claim refused); web "[criterion 5]" (read-only: all Retry disabled + reason; BOARD_HELD and FORBIDDEN render reasons; no unhandled rejection) | green |
| 6 | runtime "[criterion 6]" (imported full coverage renders with denominator, independent recomputation; native run evaluated through ply 12 abstains with 6-of-N); server HTTP (100.0% with "all 20 of White's"), server "[criterion 6]" (partial pass abstains, read enqueues nothing); web "[criterion 6]"; browser | green |
| 7 | runtime "[criterion 7]" (constant only in `grade.ts` across `apps/ packages/ tools/ tests/`; no `Math.exp` in the review modules), plus "keeps the shipped grader's only production caller…" | green |
| 8 | server HTTP (public JSON moment ids = private ids; HTML card); web "[criterion 8]" (card `momentIds` = rendered cards); `adoption-wave.test.ts` (public payload = `selectReviewMoments`); browser native-story test | green |
| 9 | web "[criterion 9]" (set-equality of `REVIEW_MAP_TEMPLATES` keys with ids derived from the screen, projection, card and public page; markup has no literal prose or literal aria/title/alt); runtime "[criterion 9 / D1409]" (no template carries a judgement word; operand discipline) | green |
| 10 | web "[criterion 10]" (footer = computed sentence, per-card sources; literal absent from all non-test source in `apps/` and `packages/`); `story-card.test.ts` "[criterion 10]" (a rules-only card never says engine); server HTTP card | green |
| 11 | runtime "[criterion 11]"; web "[criterion 11]" (zero moments, zero coverage, abstaining accuracy, no empty region) | green |
| 12 | runtime "[criterion 12]" (eval packets carrying `bestMoveUci`/`pv` never leak); web "[criterion 12]" (no best/PV/praise/Analyze); browser | green |
| 13 | web "[criterion 13]" (`rfc/play-composition.md` §6: rows 1..16, SHA-256 pinned; only `App.svelte` imports the screen) | green |
| 14 | server HTTP (every SQLite table's row count and the run's event log unchanged across two review reads); server "[criterion 6]" (read enqueues no evaluation job) | green |
| D1409 | `packages/runtime/src/voice.test.ts` "licence-by-span…" (D1406 reproduction red, byte-exact quoting only, same-packet word banned elsewhere, longest-span); runtime "[D1409]" over the whole rendered projection | green |

## Verification

`make typecheck`, `make verify-software` and `make test-browser-smoke` — results in the commit report.

## What remains

- **D1 (owner):** O7.1–O7.5 sub-choices. Implemented on the handoff's recommendations (0..3 per phase;
  every story family may nominate; engine as grades/evaluations only, never a verdict; Retry on every
  row and moment, no Analyze or theory door; share = same ids, order and computed footer).
- **D2 (owner):** the `design/03` amendment giving game review an intent-tier home. No design sentence
  was falsified by this change, so no intent-amendment proposal was filed.
- **D3:** cross-game longitudinal trends — not built; the store has no review-grain refs.
- **D4:** Wave-C id amendment; the per-position review packet renders as an explicit abstention.
- **D5:** `compileModuleRegistry` is still never invoked in production. [[D1445]] makes
  `derived.grade.move_quality@1` admissible to no module, so a `review_map` declaration cannot
  admit the grade it exists to show until `rfc/module-registration.md` fixes the answer image.
- **D6:** preset-config projections — the surface does not depend on `compileAssistance` output.
- **Not built (at this commit):** the eval graph (§6), the Compare handoff after a second branch (§4),
  and an explicit Analyze/PV action (O7.3). All three landed in the remainder commit below.
- **[[D1419]]:** only the judgement arm of `voiceCheck` is span-licensed; squares, moves, nouns and
  prescriptive verbs remain packet-relative. The caption escalation vector is pinned by a test
  (`review-map.test.ts` "[D1409]") but templates are the only guard against it.
- **[[D1422]]:** the surface renders `grade-convention@1` (5/10/15); the @2 ladder (2.5/10/15) is a
  `move-quality-grades` register amendment that has not landed.
- **`rfc/recorded-semantic-path.md` D1:** this commit adds the production consumer its criterion 13
  waits for (`RunService.review` → `recordedSemanticPathOperation`); flipping that RFC's status is the
  coordinator's closeout.
- **Ledger/log closeout** (`design/BACKLOG.md` D880/D687/D688/D689/D1409 rows, `rfc/README.md`,
  `planning/exploration/log.md`): left to the coordinator, as instructed.

## Remainder — eval graph, Compare handoff, Analyze (2026-09-24, second commit)

Authority: owner direction in session — build the three unbuilt pieces directly, no review rounds.

| site | change |
|---|---|
| `packages/runtime/src/review-map.ts` | `evalGraph` (per-ply points, per-region gaps, coverage; drawn for the review side through `moverWinPercent`), `compareDoors` (lines leaving the reviewed line with ≥1 own move, reviewed first, ≤ 8), `openRetryEntryNodeId` / `openRetryEntry` |
| `packages/runtime/src/review-analysis.ts` | `reviewAnalysis`: the recorded engine line at the position before a move (`bestline`, else the eval's recorded search first move), SAN with move numbers, attributed to engine + requested bound; abstains `none` / `unattributed`; `withheld` during an open retry |
| `packages/runtime/src/review-map-templates.ts` | `graph.*`, `compare.*`, `analysis.*` templates |
| `apps/server/src/service.ts`, `rest.ts` | `reviewAnalysis()` and `GET /runs/:id/review-analysis?node=` (read-only); `review()` passes the run side |
| `apps/server/src/application.ts` | the mock evidence executor records `bestMoveUci` on eval readings like the Stockfish executor |
| `apps/web/src/lib/ReviewEvalGraph.svelte` | the graph: SVG, roving tab stop, arrow/Home/End keys, shaded gaps, text list |
| `apps/web/src/lib/ReviewMapScreen.svelte` | graph region; *Compare lines from here* on rows and moment cards; the secondary Analyze section (withheld reason, reveal, hide) |
| `apps/web/src/lib/review-response.ts` | payload checks for the graph, doors and "no engine line in the ordinary map"; `assertReviewAnalysisResponse` (attribution, no advice phrasing) |
| `apps/web/src/App.svelte`, `api.ts` | compare handoff (navigate to the run, then `controller.compare(ids)` once) and `api.reviewAnalysis` |
| `docs/game-import-and-story.md` | Review Map section: eval graph, compare handoff, Analyze |

| piece | tests |
|---|---|
| eval graph | runtime `review-map-remainder.test.ts` (independent Win% recomputation; Black review mirrors White's reading; partial/unreadable/absent coverage abstains per region with the accuracy gate); web `review-map-remainder.test.ts` (one point per row, single tab stop, arrow/End/Home/click select the row, text list, gaps, no segment bridges a gap, validator refuses a wrong-side graph or a drawn missing point); server (complete graph over HTTP; Black import plots < 50 where White plots > 50); browser remainder journey |
| compare handoff | runtime (no door for an empty retry; door ids and grouping; eight-column cap with `omitted`); web (button only where a door exists; hands the ids; failure renders); server (door appears after the retry's move; `POST /compare` accepts the ids verbatim with the reviewed entry as fork); browser (handoff opens "Same decision, two consequences.") |
| Analyze | runtime (attributed PV sentence; first-move sentence with Black numbering; unbounded/illegal/absent abstain; withheld during an open retry and back after leaving it; projection carries no line); web (door only; reveal after click; closes on reselection and on retry; withheld reason; validator refuses unattributed or advice-phrased lines and a map carrying `bestMoveUci`); server (attributed line; read writes nothing; withheld after the fork; 400 on a non-move); browser |

Criterion 9's set-equality derivation now also reads `ReviewEvalGraph.svelte` and `review-analysis.ts`,
and its no-literal-prose check covers the graph component.

**Still not built:** Analyze reveals only what is recorded — it does not request a fresh search (that
would make the review write, criterion 14); a deeper line needs the in-run analysis request. The
open questions and discharges D1–D6 above are unchanged.
