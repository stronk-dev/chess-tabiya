# Codex queue — rewritten in full 2026-08-16

**Rewritten wholesale, not patched, because two of my last three edits to this file silently
did nothing.** They were scripted string replacements anchored on section headings you had
already rewritten at `a702372`; the anchors stopped matching, the replacements no-opped, and I
committed them with messages describing content that was never in the file. **So you never saw
[[D468]], [[D469]], or the two RFCs accepted since.** That is why the queue looked thin and you
went looking for work elsewhere. Ledgered as [[D478]].

**You were right to stop on `teacher-surface`, and you named both places while I fixed one.**
The Status line *and* Open question 1 both said an owner was waiting. Both now say otherwise
(`224e258` and this wave). Fifth instance of the queue-vs-body failure, ledgered as [[D477]]
with the point that five instances is a **missing instrument**, not a habit: the rule lives in
this file as a lesson and nothing reads it.

---

## THE BATCH DOCUMENT IS LIVE — `planning/defect-triage.md`

All **289** open rows routed. **Work batches, not rows**: one pass, one test run, one commit
naming the rows it closes ([[D416]]). Take them in the order below; the file has the full
membership, the files each batch touches, and the members flagged as riskier than they look.

**A0 completed 2026-08-16 by re-reading the rows and their current symbols.** The triage's
headline was conservative and its partial list contained an internal count error: **45** routed
rows were fully closed, not 40, and **15** retained a real residue, not 19. D203, D204, D209 and
D210 were fully shipped; D400 was answered/superseded. D204's four emitters are typed — the
remaining legacy schema arm is a different residue — while D240 genuinely lacks the shared
template registry its own remedy requires. Four process rows also closed in the same pass:
D418, D419, D459 and the already-shipped D474. The table header now calls column 3
**Disposition / history (not status)**. **A1 is blocked on status reconciliation:**
`rfc/README.md` calls `graduation-clearance` accepted, while the RFC's governing Status line says
**draft** and explicitly says the second author round *"does not re-declare"* acceptance. That
status mismatch was later reconciled, but implementation then found **[[D503]]**: six entries the
literal classifier assigns to `shape_firing` have no shape reference, while `subject` must resolve
and the writer requires a named shape. `graduation-clearance` is returned on buildability again;
do not implement it or patch D467 outside it until the body supplies an honest subject/predicate.

The implementation half of A1 landed on 2026-08-17: D468, D469, D481, D493, D495, D496 and
D502 are closed and the packaged stack was exercised against its persisted volume.
Graduation-clearance remains returned on D503.

Then: **A1** (returned RFC only) → **A2** (6 —
opponent selection serves the wrong move) → **A3** (5 — disclosure holes on live surfaces) →
**B1** (7 — claim binding and the evidence maps, one file, one live in the corpus) → **B3**
(4 — corpus denominators and fixture contamination; widest downstream effect for the least
work) → **B4** (8 — the gate on the gate; zero runtime risk, cheapest here) → **B8** (6 — the
graduation-emitter residue) → **B5** (8) → **B2** (6, three of which are record-only and
flagged).

**B6 and B7 are listed as traps**, not batches: B6 is mostly owner-tier `DESIGN-GAP:` rows with
one takeable member, B7 is convention with one.

**Queue correction 2026-08-17:** A2 and A3 are routing headings, not executable batches.
A2 contains format work that needs an RFC (D106/D195), measurements (D375/D457), and a behaviour
change whose own row requires a census first (D373). In A3, D232 was already implemented by
`evidence-at-runtime` and is now reconciled; D448/D92 remain teacher-surface-owned, while D259
and D214 specify no mechanical remedy. Do not invent the missing decisions. The next independently
takeable subset is B2's D219/D229/D258/D213, re-derived against the current tree before editing.

**B2 subset landed 2026-08-17:** D219, D229, D258 and D213 are closed. Storage now asserts a
contiguous migration range, the assessment category has one declaration, and one executable run
pins all three authoritative event adjacencies. The record-only B2 rows remain untouched.

**B3 fixture subset landed 2026-08-17:** D227 and D257 are closed. Default catalogue discovery
uses the exported pack-document predicate and excludes `.browser.json`; the browser server names
its six fixtures explicitly. D262 remains a terminology rule, and D211 was already closed.

**B4 takeable residue landed 2026-08-17:** D446 is closed. Q8 verification is side-effect free,
fails when its committed artifact is stale, and refreshes only under explicit `UPDATE_Q8=1`.
D477 overlaps the in-flight shared-resource-registers RFC; D416/D402 are protocol work, not an
unowned code patch. The other B4 rows were already closed.

**B8 takeable members landed 2026-08-17:** D207 and D239 are closed. Missing ledgers no longer
mask machine-labelled claims, and distillation now shares every other emitter's self-validation
refusal. D430's map-duplication half also landed; its vocabulary-removal half remains RFC-owned.
The remaining B8 rows are schema/content work and stay untouched.

**Two findings in that document outrank most of the batches.** `db243f5` edited nineteen defect
rows and **changed column 3 only** — writing *"✅ closed by pack-graduation 0.27"* into the
disposition while leaving column 1 at 🐞/💡. So [[D418]] is exactly right, and **the wave that
fixed the defects performed [[D419]]'s defect while doing it.** The disposition is not
trustworthy either: of the nineteen, 13 shipped, 4 are partial, and **2 (D207, D239) never
started** — which is why they are in a batch rather than in the closable set. Separately, a
**24% stale rate among rows nobody suspected**: 6 full closures out of ~25 sampled on a hunch.

**The content split you can act on is §7.** **27 mechanical rows reduce to five jobs**, three of
which are a shipped `make` target pointed at the corpus: the explorer position-census wave (60
`corpus_observed` claims against **0** backing records — 22 directly attachable, 38 needing a
sidecar first), the tablebase legal-successor census (**0 of 277** choice-bearing positions
censused), the engine pass (8 claims), the fixture relocation, and citation/digest repair.
**Nothing was over-called into it**: where the record is mechanical but the sentence it backs
must be authored, the row was split and the sentence sent to the authored side. Note
`packDigest` re-stamps are done for drafts but **26 of 36 candidate ledgers are digest-stale**,
which no row records — and it must **not** be bulk-fixed, because the `blocking → resolved`
writer does not exist yet.

## 0-F1-RESUME. F1 amendment accepted 2026-08-21 — finish the 25 real bindings

Your return was right on both blockers, and the amendment adopted your choice 1. The second
cross-review then found **the next bypass in the exact spot the last one lived**: rendered items
were unbranded, so `{ evidence: admittedItem, sentences: narrative.groups.flatMap(...) }`
typechecked — [[D662]] one level up. Read the amended §6.1 before resuming:

- **The seal now covers the sentence layer**: sentences exist only as a registered per-projection
  renderer's output over an admitted item, inside a brand-constructed `RenderedEvidenceView` —
  and **the brand is a runtime symbol property** asserted by both `voiceCheck` and provider-body
  assembly, so `as unknown as` double-assertion fails at runtime, not just review.
- **`derived.story.rank@1` is a new declared projection** — `story.rank` reaches `/story`, the
  screen's top-8, and the public shared page; its inputs are now truthful, and `last_level`
  gains `run.record.imported_result@1` (its `learnerLost` gate reads the result tag), flipping
  its grounding to `declared_convention` per §4.3's own mixed-inputs rule.
- **The deterministic Review surfaces have accepts ceilings** (`review.story@1`, compare strips) —
  without them `evidenceForConsumer` would silently drop items and force a choice between
  criterion 7 and criterion 11.
- **Naming is yours to settle** under §5's pre-acceptance rule: the reviewer wrote
  `renderEvidenceItems` in one place and `renderedEvidenceItems` in another — pick one.
- Census is **25**; all four negative fixtures verified genuinely red at your checkpoint;
  criterion 26 is now about base-packet *items*, not projections (`rules.pivotal.marker@1`
  legitimately sits in both accept sets via the timing strip).
- **[[D668]]**: the `declareEvidence` payload forge is deferred to F2 by row — do not solve it
  en passant; bound it with the census as the RFC says.
- **[[D667]]** is registered-not-endorsed: the story title says "Won" to a learner who lost as
  Black in imported games (`story.ts:37`). Criterion 11 preserves bytes — do NOT fix it inside
  F1; it waits on the owner's timing.

## 0-ACCEPTED-2026-08-21. F1 and accessible-board-input — both accepted, implement in this order

1. **F1 (`rfc/evidence-contract-manifest.md`)** — the producer→projection→consumer spine. Read the
   cross-review changelog first: the consumer census is **twenty-three** operations (five were
   missing, including the **public shared-story route**), `ConsumerDeclaration` gained
   `disposition` (fixture: `assistance.arrows` as `experimental`), and **emission status is pinned
   to the executable census** — a declarations-only closure test is the shared-assumption failure.
   **Owner nod recorded 2026-08-21: the §10.1 "Evidence inspector" relabel IS approved at landing.**
   Seams: your `assistance-controls` D308 reveal wiring adds a consumer call site that must take a
   literal consumer ID; `feedback-delivery`'s landing order affects row 19's anchors;
   `pack-population-provenance` inherits the `citable_text` manifest declaration at its landing.
2. **accessible-board-input** — independent, parallel-safe. The corrected matrix is **150 = 6
   packs × 5 A2 viewports × 5 modes** with the 18 click cells the never-deleted floor; the state
   machine now has `awaiting_promotion`; semantic enumeration **follows `showDests`** ([[D659]] —
   never widen the ceiling from a projection); Alt+C matches on `event.code`. Holds in `awaiting`
   on the owner-run discharge — that does not block implementation, only archival.

**D650 is closed** — the three stale intent residuals are corrected and `make intent-parity`
guards them. **[[D660]]**: when F2 is drafted it must ingest D542/D543 measured lift; the row owns
that seam until then — do not absorb selection into F1.

## 0-PROCESS. Both register RFCs ACCEPTED 2026-08-21 — implement them, RFC-1 first

`rfc/shared-resource-registers.md` and `rfc/rfc-lifecycle-completion.md`, accepted on the
buildability test after a **joint** cross-review (they are one contract). The owner's five
process answers are recorded in their open-question sections with the rulings quoted.

**The seam rule, which the review had to add because neither document stated it: ONE parser,
FIRST LANDER HOSTS.** `status-parity` imports the §Active parser; if you land RFC-2's
instrument before RFC-1's, the parser lives in `status-parity.mjs` and `register-check`
imports it later — never two copies. This is why RFC-1 first is the recommendation, not a
hard order.

- **RFC-1** (`make register-check`): landed half derived from `schemaBuildInfo`, claimed half
  from `tabiya-claims` blocks parsed **with the nested-fence rule** — the review found the
  spec counted RFC-1's own example blocks as claims. Component-wise integer version compare
  (shape-entry `0.3` vs pack `0.27` is the live trap). §6's landing list now includes the
  run-schema row and the seven `EVIDENCE_KINDS` member rows — without them the check is red
  at its own landing. **Discharges [[D653]]** (four live claims currently have no register
  row anywhere) and closes [[D461]]/[[D497]]'s class.
- **RFC-2** (`tools/status-parity.mjs`, six checks P1–P6): the state vocabulary is seven
  tokens with the leading-token grammar (D516: byte-equality would false-positive 9 of 10);
  **P4 reads exactly one thing after the separator** — the `awaiting` pointer; P3 is the two
  owner-ruled set equalities plus a **severable** archive-status clause (retained for now).
  `awaiting` has exactly one live case to fixture against: `feedback-delivery`. Discharge
  rows keep their SHA on archival ([[D654]] is the motivating case).

Both claim **nothing versioned**. The ledger flips ride in your implementing commits and name
their rows ([[D416]]). After these two: the graduation-clearance mechanism + read-only
migration report, then **F1**, per `planning/platform-alignment/execution-queue.md`.

## 0-KILL2. ✅ CLOSED 2026-08-21 — [[D537]]/[[D538]]/[[D573]] exact board interaction

Selection-bound cache invalidation plus compact board-first sizing moved the identical A2 matrix
from 4/90 to **90/90 exact** live click/drag/touch cells. The permanent browser gate hit-tests the
source, remeasures after selection and asserts the exact outgoing UCI for all six served endgames
at desktop/tablet/phone. The failure record below is retained as the queue item's measured premise,
not as current product status.

**Your [[D507]] fix is complete and it is the right shape** — 0 of 64 squares occluded at all
five viewports on all six packs, overflow 64–164 px → **0 px**, and **no length ceiling verified
to 4,000 characters** ([[D540]]), because `max-height: clamp(5.5rem,16dvh,10rem)` + `overflow:auto`
sends growth into the block's own scroll. That is length-**independent**, not length-tolerant.

**A different, pre-existing bug still stops the drill.** Selecting a piece renders `overlayCaption`
(`DrillScreen.svelte:899`) below the board; `.position-column` re-centres and the board rises by
**exactly half the caption height plus margin** — `(caption + 5.6) / 2` reproduces every observed
shift to the pixel, 17–89 px — **and chessground's bounds cache is never invalidated.**

**Proved by controlled flip**: click where e5 is *drawn* → **0 plies**; dispatch a `window resize`
first, **same coordinates** → **2 plies**.

Aiming where squares are drawn, authored first move delivered: **1 of 6** at 1440×1000, **0 of 6**
at 1366×768 and 1280×720. **And two packs deliver a different legal move than the square clicked**
— `mate-k-r-technique` gives `Rh7+`/`Rh8` for `Rh6`; `queen-vs-pawn` gives `Qc6+` for `Qc4+`.
**A wrong move silently played is worse than a click that does nothing**, and this is on the
community drafts [[D502]] now serves.

**Independent of D507** — the schema-example pack shows the same −60 px shift at `4a6ad91`.

**Take [[D538]] in the same pass, and note a fixture list will not fix it.** `442b8a3` genuinely
closed the fixture gap — all six packs at five projections, passing. But re-evaluated **one click
later**, all **eight** `assertRunViewport` clauses pass in **all eighteen** cells, in a state where
up to 32/64 squares are un-hit-testable. **The invariant asserts a resting geometry and the defect
exists only after a gesture.** It needs a post-selection assertion, not more fixtures.

**And read [[D539]] before trusting any playability number, including mine.** Session 1's
*"1 of 6 playable"* was its probe computing coordinates before the gesture — **probe and bug
cancelled**. That is the **second instrument in two days** to return a clean reading by sharing
the defect's own assumption, after the CR1 harness ([[D526]]). Related: [[D541]] —
`philidor-third-rank-hold` is **Black to move** and coordinate probes assumed White at bottom.

## 0-CONTENT. Job A — the only genuinely mechanical content job. ~21 edits.

Full order: `planning/content-wave-work-order.md`. **Read [[D518]] first**: claude reported this
lane as *"27 mechanical rows, five jobs, three of them a shipped `make` target"* and **withdrew
that framing** — the explorer wave is **0 of 60** mechanical, not 22 of 60, because
`attachExplorerEvidence` needs an `EXPLORER_RATIONALE` entry in `provenance.sources` and **0 of 50
packs carry one**. Jobs B and E are blocked on authored judgement. **This is what survives.**

**Job A — provenance-promise repair ([[D470]]).** 20 packs' `provenance.sources` strings promise
data in `provenance.engineValidation`, which `PROVENANCE_EVIDENCE_INLINE` (`pack-validation.ts:867-868`,
severity **error**) forbids the pack from carrying. Plus the `bxc5-recoup` citation in
`anti-caro-advance-early-c5.json` — **present twice**, naming an id that exists nowhere, deleted
2026-08-15. **21 edits, all mechanical, 0 human.**

Sequence: hand-edit → `make pack-check` → `make verify-draft` (**performs the mandatory digest
re-stamp** — `digestDrillPack` canonicalizes the whole document and `EVIDENCE_DIGEST_STALE` is
only a warning, so skipping it drifts silently) → `make sourcing-check`.

**Fold job C in on the same `verify-draft` run**: the engine pass is **7 claims across 2 packs**,
not 8 across 3 — `maroczy-bind-white-squeeze` has no ledger and no `assessedBy`.

**This is a content wave**, so it carries `CLAUDE.md`'s content closeout: ledger rows flipped
**and** an entry appended to `planning/content-era/log.md` **in the shipping commit**.

**Say in the commit message what it does not do: it will not move `backedClaims` off 1.** No
mechanical job in this lane does.

**Also job D — denominator convergence** (code only, not a content wave): [[D519]] measured
`make expression-census` printing **`corpus.packs: 56` alongside `totals.packs: 50` in the same
report**, and `make graduation-report` still reporting **56** via its own inline filter at
`graduation-report.ts:8`. The fixtures were **excluded from discovery, never relocated**.

**And [[D521]] while you are there**: `make graduation-report` **writes `content/accepted-conditions.md`**,
so the headline graduation instrument cannot be run by a reviewer without dirtying the corpus it
measures — exactly [[D446]]'s defect, which you fixed for the Q8 harness at `5c66680`, surviving
in the more load-bearing tool.

## 0-UNBLOCK. `feedback-delivery` Stage 1 — CR1 is fine, the harness is not

**You were right to stop, and criterion 16 was right to be able to fail. The reading was of the
instrument.** Diagnosis at `planning/feedback-delivery/cr1-diagnosis.md`.

**CR1 works.** `common` is never empty — over **44** real spine fork sets its median size is **72**
(min 23, max 94), **0 of 44 empty**; CR1 removes **592 of 5,000** candidate entries corpus-wide and
fires in **41 of 44** fork sets. Positive controls behave: a transposition filters **62/64**,
identical branches **48/48** (CR3's named case). The fork exclusion is implemented exactly as
§4.1 specifies (`node.ply > fork.ply`, `node.id !== fork.id` with `previous` seeded from the fork)
— **not the cause**, and the choice is live: a fork-inclusive reading disagrees on 20/44 sets.

**The defect is `comparisonMeasurement`** (`tools/feedback-delivery-harness/feedback-delivery.test.ts:105-127`):
it gives every column **exactly one ply past the fork**. At one ply the candidate set is
`obs(fork+1) \ obs(fork)` while `common` is dominated by what did **not** change — **the two are
disjoint by construction**, so admission is 100% at every N whatever the filter does. Decomposed:
`|common|` = 70/61/53 at N=2/4/8 with **0 filtered each**.

**Fix the instrument, then re-run criteria 5 and 16.** Re-shaped with multi-ply columns the same
harness gives **N=8 admission 29.4% (depth 8), 27.6% (depth 12)** — criterion 16 does not fire and
Stage 1 is unblocked. ([[D526]].)

Two things to take in the same pass, both measured:

- **[[D528]] — add the empty-column case to CR3.** A column with **zero** plies past the fork makes
  `common = ∅` and silently disables CR1 for the whole comparison. CR3 enumerates degenerate cases
  *"named, not discovered"* and misses this one, and **19 of 44** fork sets have a 1-ply column.
- **[[D527]] — `compare-strips` re-declares its own `observationKey`** instead of reusing
  `structure.ts`'s `observationIdentity`. Reusing the shared one deletes **971 of 5,000** strip
  entries (**−19.4%**) **independent of CR1**, because the local key makes `pawn_safe_square`
  **25.4%** of all candidates. Sibling of [[D430]].

**Context worth carrying: [[D529]] — no authored fork in this corpus is wider than 3 columns**
(38 binary, 6 ternary, **0 at N ≥ 4**) against `MAX_COMPARISON_BRANCHES = 8`, and the median fork's
shortest column runs **2 plies**. So every N ≥ 4 number here is synthetic, **including criterion
16's own threshold** — do not read a re-run at N=8 as a corpus fact.

## 0-KILL. [[D507]] — COMPLETED 2026-08-17

**Measured hands-on 2026-08-16** (`design/research/endgame-latency-versus-cet.md`): at 1440×1000,
**5 of 6 served endgame packs cannot receive their own authored first move**; at **1280×720 and
1366×768, all 64 squares of all 6 are unhittable**. The board overflows `.position-column` by
**64–164 px** and is drawn under the timeline; `.drill-region` does not scroll and
`scrollIntoView` moves it **0 px**.

**The trigger is authored objective length** — **68** chars in the schema example against
**277–444** in the endgame packs. That is why the single pack production served is **0/64
occluded** and the whole corpus is not, and why nothing caught it.

**`assertRunViewport` would fail on all six packs at the very viewports it tests** — its desktop
projections run on the schema-example pack and its compact ones on a pack-less Just Play run.
**Fix the invariant's fixtures in the same pass**, or the next content wave reopens this.
Same shape as [[D482]].

**Related and already in the UX lane:** `.board-frame`'s `calc(100dvh - 34rem)` → the
container-query sizing **already present in the same file's mobile branch**
(`DrillScreen.svelte:1479-1480`) — ~2 lines, and the board roughly doubles ([[D496]]).

**[[D509]] COMPLETED 2026-08-17:** `/capabilities` advertised `perfect_tablebase` and
`practical_resistance` even though both returned **HTTP 503 for every position** under
`ENGINE_MODE=mock`. An empty fixture is now provider absence, and pack start checks the authored
mode before creating a run.

**[[D510]] COMPLETED 2026-08-17:** `/select-move` returned an **untyped HTTP 500** on a
checkmate position under `human_common`. Selector preflight now returns typed `INVALID_REQUEST`
/ HTTP 400 before any policy branch runs. [[D56]]'s family.

**Do not take [[D508]]** — it is a finding, not a defect: CET's endpoint measures **30.8 ms**
against our **30.1 ms** on the same FENs, so there is no speed gap to win and nothing to fix.

**D507 closeout:** long objectives retain their complete text in a bounded scroll region and the
board retains a 192px interaction floor. `assertRunViewport` now runs against all six served
endgame packs at 1280×720, 1366×768, 1440×900, 1440×1000, and 768×1024. The pre-change
regression reproduced a hidden 0px board and then a 90.7px board before the floor held.

## 0-OWNER. COMPLETED 2026-08-17 — two rulings landed 2026-08-16

**[[D502]] — the corpus reaches learners through BOTH channels.** Ship all 56 packs behind a
clear **unreviewed draft** badge, and promote onto an official shelf as clearance lands. The
registry **already carries** `channel: "official" | "community"` and the UI already renders the
badge, so this is wiring, not new surface. **Explicitly NOT by flipping `NODE_ENV`** — [[D481]]
found `PackRegistry.loadDefault` reads `content/drafts/` only when `options.development === true`
and `compose.yaml` never sets it, which is the bug, not the mechanism to use.

**[[D502]] — remove the schema example fixture from the served library.** It is a format
fixture, not content; its own commentary reads *"Schema-only annotation; requires human
review."* It validates the schema in tests and never reaches a user. `content/packs/` currently
holds only `.gitkeep`.

**[[D493]] — one token, and it is a same-day regression, not a ruling.**
`SILENT_ASSISTANCE.boardLighting` was flipped `"legal"` → `"off"` at `f304384` (11:44 today) in a
7-file batch, on the rationale that the constant is *"now silent in all nine fields"* — a claim
about tidiness, not about a learner. **`docs/adaptive-guidance.md:61` still calls `"legal"` the
single named exception to literal off, and all three migration branches in
`assistance-preference.ts` still write it.** Restoring it brings back move dots **and** the
last-move highlight, because `DrillScreen.svelte:882-883` gates `highlightMoves` — run history,
not evidence — on the same `!== "off"`. **Silence over evidence stays; the rules floor was never
on the assistance ladder.**

**Highest impact-per-line in the whole UX audit, take with the above:** `.board-frame`'s
`calc(100dvh - 34rem)` → the container-query sizing **already present in the same file's mobile
branch** (`DrillScreen.svelte:1479-1480`). **~2 lines; the board roughly doubles.** And a
code→sentence map at `SessionController.#fail` — **10 call sites, one choke point** — which
turns out to fix *both* `Run is terminal at node: run-<uuid>:node:4` **and** the fork button that
409s silently ([[D495]]). They are the same event.

Full lane: `planning/ux-work-lane.md`. Entry point for everything: `planning/WORK.md`.

## 0. [[D468]] and [[D469]] — CLOSED 2026-08-17

**Not hypothetical and not scheduled work.** `GRADUATION_RULING_UNCITED` resolves living-tier
paths against `process.cwd()` (`pack-validation.ts:848-851`). All **43** acceptances cite
`planning/exploration/log.md#L1231` (40) or `docs/tablebase-grounding.md` (3). `apps/server/Dockerfile`
copies **only** dist, web dist, schemas and content; `.dockerignore` excludes `.git`. The issue
is **error** severity and `PackRegistry.load` throws `PACK_INVALID` (`pack-registry.ts:252/258`).

**So the first graduated pack carrying an acceptance makes the server fail to boot, and 40 of 56
drafts carry one.** Reproduced with one `cd`: `node apps/server/dist/pack-check.js` on
`anti-caro-advance-early-c5.json` prints *"Pack check passed"* from the repo root and
`ERROR [GRADUATION_RULING_UNCITED]` from a temp directory.

**The framing generalises:** a check whose evidence is excluded by `.dockerignore` is **not a
weaker check in production — it is a different check under an identical code name.**
`graduation-clearance` §3.2c specifies the split: a runtime *shape* rule with a zero-filesystem
budget, and an authoring *admission* rule that may read `.git`. **The `repoRoot` option was
explicitly refused** — one code name with two silent behaviours is the defect, not the fix.

**[[D469]] closed alongside it:** both image jobs now depend on an engine-required `make verify`
release job, so no image is built or pushed from a corpus that fails the repository gate.

## 0b. `rfc/graduation-clearance.md` — RETURNED ON [[D503]]

**You returned this once and you were right to.** The first acceptance was granted on the wrong
test — its four author-call open questions were closed, and **none of the four blockers you
returned was an open question** ([[D473]], recorded as claude's error). The test now applied is
**buildability**: every obligation resolving to a named symbol, command or home. If it still
fails anywhere, return it again — the loop is the check.

- **D464** — `clearance.recordKind`, required iff `kind` is `ledger_record`, enum **transcribed
  from the shipped `EVIDENCE_KINDS`** (`sourcing/types.ts:57`), with criterion 13 asserting
  set-equality so a new evidence kind cannot silently become unexpressible.
- **D465** — all 30 resolved entries walked: **29 resolve, 1 does not**. Eighth kind
  `referent_removed` + `absentIds`, admissible on `resolved` only, refused on `blocking`.
  **Stage B is 29 mechanical + 1 by hand**, not a 30-entry migration.
- **D466** — the writer is `make graduation-clear` → `clearGraduationEntries`, modelled on the
  shipped `verifyDraft` (`verify-draft.ts:323`). **Mandatory `packDigest` re-stamp** —
  `digestDrillPack` canonicalizes the whole document and `EVIDENCE_DIGEST_STALE` is only a
  warning, so skipping it drifts silently. **One-line change at `graduation-report.ts:8`** or
  the new sidecar suffix is counted as a pack.
- **D467** — two rules, two homes, two input budgets, stated as a table. See item 0.

**Correction to carry:** §1.2 named the **wrong join** for two review rounds ([[D471]]).
`uniqueRecord` joins on **FEN** (a claim assertion names a position); `evidenceSupports` joins on
a **JSON pointer** (evidence names a pack node). Corroborated across all 32 ledgers: **764
records, 764 supports pointers, 1:1, zero prose pointers**. The predicate is now written as an
expression rather than prose, which is the actual remedy.

**Criterion 16 touches `.github/workflows/release.yml`** — outside `rfc/`, flagged so it is
scoped in rather than discovered late.

## 0c. `rfc/feedback-delivery.md` — ACCEPTED 2026-08-16, **two-stage landing**

**Do not archive this on stage 1.** Stage 1 ships the delivery surface; stage 2 runs the binding
wave; the RFC stays `implementing` between them and moves to `implemented` only when stage 2's
measurement exists. **Criterion 11's ledger flips ride in STAGE 2's commit** — no row closes on a
day-zero share. Claims **nothing versioned and no migration position**.

Seven things you would otherwise hit cold:

- **`MACHINE_LABELS` is module-private** and `earnedEvidenceTypes` needs it. **Export it; do not
  copy it** — a fourth copy replicates [[D430]]'s dead `explorer_frequency` alternative again.
- **`claimBackings.authorSpans` is two different shapes**: cut segments on the binding arm,
  `[claim.text]` — the **whole sentence** — on the `author_principle` arm, which is **66 of the
  67** day-zero rows.
- **C1(iii) is not a free read.** The reveal loop is
  `for (…) { if (!revealIsReleased(…)) continue; … }` and keeps no reference to the last admitted
  reveal. One assignment inside the loop, not zero.
- **Criterion 6's kill-gate instrument does not exist**, and it must rewind-and-branch **and**
  drive the opponent policy — **14 of 50** packs need the first, **17 of 50** the second. A
  mainline-only harness measures the 19 single-line packs and trips the gate for the wrong reason.
- **`items` sorts by `revealedBy.eventSeq` before `KIND_ORDER`** — `claim: 4` is last *within an
  occurrence*, not globally.
- **A stale pack digest cannot withhold a claim.** `EVIDENCE_DIGEST_STALE` is a CLI warning and
  `validateClaimBindings`' `before` is captured **inside** the per-binding loop. The re-stamp is
  hygiene, not a delivery blocker — do not spend stage 1 on it.
- **Re-running the Q8 harness overwrites its committed artefact** ([[D446]]) and dirties the tree.

**Stage 2 has no owner and cannot start without one** ([[D476]]). `claim-backing` was named for
it and then archived; an archived RFC can own a mechanism's design, not a corpus pass's
execution. **Do not adopt it silently** — commissioning it is claude's to arrange.

## 0d. `rfc/teacher-surface.md` — ACCEPTED, body reconciled, UNBLOCKED

Both places you named now read `accepted`: the Status line at `224e258` and **Open question 1**
in this wave. **Nothing waits on an owner.** The owner confirmed the one narrowing on 2026-08-16 —
`live-marker-quality` §6.2's cost from *"permanently"* to **"for the duration of live play"**,
with the 2026-08-15 record left intact beside it.

Claims **one migration position** (`STORAGE_VERSION + 1`; head **23**) — `ALTER TABLE run_grants
ADD COLUMN granted_via TEXT`, nullable, **no backfill, no CHECK**. Four tables,
`run_grants.expires_at`, `live_sessions.classroom_id`. **No run- or pack-schema change, no new
token scope, no fourth `RunRole`, no new session kind.** Also claims **D92** and **D93**.

**One rule carries the design:** on a terminal, disclosed run with no live session open, a
submission-granted teacher gets **the run host's own table** — never a reviewer tier. `reviewing`
sits in the **role** disjunct and never beside `deliveryOpen`, because `design/05` §3a-i says
*"the run — not the viewer — carries the barrier"*.

**Go straight to these four criteria — each exists because the spec as written passed every
other check:** **7a** counts *statements, not sites* (both promotion sites contain a fresh-grant
`INSERT` as well as an `UPDATE`); **10c's second fixture** (the original was a solo pack, where
every candidate implementation agrees — the [[D444]] shape); **10e's extended loop**, ranging over
the two sides independently and shown failing against the old predicate; and **10g**, which
exists because a reviewer could see strictly *more* than the run's own host — `seatedInContest`
had no time bound and sessions are **closed, never deleted**.

**Do not weaken the `granted_via = 'submission'` conjunct.** Compatibility with
`live-marker-quality` is held by it — **by fixture convention, not by construction** as the author
round claimed. **Criterion 6 there changes in two clauses** (*"non-reviewing spectator"*) at this
RFC's landing.

## 1. A defect batch is coming — this is the real throughput fix

`planning/defect-triage.md` is being written now: a routing pass over all **278 open ledger
rows**, bucketed into batches of 5–15 touching related code, live user-affecting ones first.
**The one-RFC-at-a-time cadence was the bottleneck, not the ledger.** When it lands, **work the
top batch as a batch** — one pass, one test run, one commit naming the rows it closes ([[D416]]).

A guard worth shipping inside any batch: **a status-parity check over every Active row** in
`make verify`, comparing the register cell to the RFC body's `**Status:**` line. That is
[[D477]]'s remedy and it would have caught all five instances.

## 2. Not takeable yet

`learner-rating` (open questions 11 and 12), `measurement-records` (returned to author).
`engine-leverage`, `vocabulary-wiring` and `live-marker-quality` are **implementing** — do not
re-enter them.

## 3. Still do NOT take

**D348** (needs a versioned lane), **D351** (needs an accepted authoring-instrument RFC),
**D104** (not reproduced in 20 isolated runs — your refusal of a speculative patch was correct),
and the schema-shaped rows.

## Discharged this wave

`opponent-contracts` archived at `3276a37` with **[[D457]] correctly left open**;
`dead-vocabulary` shipped at `329c62b`; [[D474]]'s gate flake fixed at `0752638` by caching the
declaration-census source scans — **that row can flip when you next touch the ledger.**

## Protocol reminders

- **The ledger flip rides in the implementing commit**; **the log entry rides in the archiving
  commit**; **name the rows you flip in the subject or body** ([[D416]]). You did this at
  `d77a9f1` the first time it was asked for.
- **`design/BACKLOG.md` is a shared ledger, not an intent doc.** Law 5 protects `design/00`–`06`.
- **[[D419]]: column 3 of the defect table is NOT a status**, and **[[D459]]: the table's own
  header calls it "Status" and is wrong.** Read column 1.
- Cite ledger rows by **row title**, never line number. Locate code by **symbol name**.
- Claude's standing errors, all of which fired again this session: **a resolution in a register
  is not a resolution in the body** (five instances, [[D477]]); **a scripted edit that silently
  no-ops is worse than no edit**, because it ships under a commit message describing content
  that is not there ([[D478]]); **`git add` on shared ledger paths while you have uncommitted
  edits** (four instances); **a line-based grep is not a reading.**
