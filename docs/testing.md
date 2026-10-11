# Testing and CI

Tabiya separates tests by the contract they prove. A failure should identify the owning layer; a
real drill pack's mutable wording is not a product-browser contract, and a direct REST-handler test
is not proof that the production application routes an endpoint.

In one local checkout, run the release checks **serially**:

```sh
make verify-awake build test-browser-ci-awake
```

Do not start a second build or verification process while browser CI serves that checkout's
`apps/web/dist`. Vite replaces that directory during build; a concurrent browser can genuinely
receive `STATIC_NOT_BUILT`. Such a run is invalid, not an excuse for a timeout increase or a
retry. GitHub jobs use separate checkouts. Benchmark budgets and all browser tiers remain intact.

`make authored-simulation-check` covers scratch isolation, selected consequence promotion,
ordinary and charged entry, nested first-child walking, skipped alternatives, horizon truncation
and admission refusal of authored children beyond an achieved objective. The nested-walk fix
has three independently failing predecessor controls. `make authored-simulation-browser-check`
covers both simple and nested authored lines on desktop and phone: actual private Studio
playtest, unchanged saved graph during preview, failed entry/retry, exact promoted path,
checkpoint and durable reload. These tests also run in normal software/browser CI. They do not
complete D1154's missing step-by-step scratch comparison transport.

The focused target also exercises populated inherited scores, lines and machine references under
saved delayed-checkpoint, segment-end and immediate-guard disclosure. D3728 has three controls
that fail with the unfiltered predecessor behavior, including authenticated production HTTP:
private draft/playtest, canonical fixture restoration, application restart, unauthorized/stranger
refusal, isolated preview, actual entry, rewind and retained permitted analysis. A virtual finish
cannot reveal the saved run. Attempt-end packs remain invalid; segment completion requires two
checkpoints on the entered branch. These are transport fixtures, not measured chess conclusions.

`make web-bundle-report` is an optional D3722 dependency investigation, not another
test tier or push gate. It uses the normal web build configuration without writing
served assets or source maps and prints final JavaScript bytes plus rendered-module
weights/importers. It stores no research dump and changes no size limit. A passing
diagnostic does not prove latency, usability or release readiness; `make build`
and the existing browser/performance journeys retain those separate obligations.

`make release-policy-check` includes the native-proof orchestration controls. Each release-native
job must run the seven-command storage journey against the same pulled platform-digest server
image before emitting success; it cannot substitute a development build. A recovery failure is
fatal and removes an earlier generated success. These unit controls prove wiring and failure
propagation, not an actual architecture or storage pass. `make storage-drill` exercises the actual
local image; its dated checkpoint and Linux backup-directory ownership residual are documented in
`docs/storage-backup-and-recovery.md`. Ordinary push CI and heavy native release proof remain
separate; no pre-push Docker journey is added.

`make prediction-workflow-check` covers independent perspective/move authority, legal opponent
guess admission, repeated-client-guess refusal, failed prediction/retry, durable receipt resume and playing
the same distribution without selecting again. It also covers exact private-playtest pack lookup
and crossed-id refusal before selector execution. Actual HTTP negative controls cover writer/role,
checkpoint occurrence, legal turn/guess, forged start/history/seed/session/pack, asynchronous
cursor/lease races, identical/concurrent replay and imported-game revisits. Client controls
recover missing event tails while refusing conflicting or non-contiguous snapshots. The actual
server public projection also tests score disclosure versus changed visible measurements,
rank and mass. D3700's expected-rejection control records a known withheld-reasoning contract
conflict, not a fixed or complete reasoning journey. The D3700 paired HTTP controls in
the same focused command prove reachability through an admitted segment-end pack: the
original branch discloses and replays; a fork between checkpoints withholds and currently
fails public replay while its saved canonical record stays valid. They are evidence
controls for the draft public-run-reconstruction contract, not waived browser failures.
`make prediction-workflow-browser-check` runs
real saved private Studio playtests with both perspectives: genuine pointer guesses, provider
failure/retry and a committed-but-lost response, unchanged nodes until Continue, full candidate
receipts, reload and exact reply. Background evidence delivery is held only to ensure the native
case exercises explicit retry rather than recovering first through another response's snapshot;
its actual server collection and commitment are unchanged. The focused browser command also
covers Line Drill, granted spectators and desktop/phone Support reveal/return.
These tests run in ordinary CI. They do not discharge the schema example's wrong-turn trigger
(D3695). The server admission (D3694) and event-gap recovery (D3698) have separate negative
controls; successful UI submission alone is not their security or integrity proof.

`make semantic-validation-discovered-check` checks actual completed discovered-execution
operations against independent legal replay and integer ray geometry. Six positives cover
rook, bishop and queen checks in both colours, including kings at board-edge ray endpoints;
ten populated negatives distinguish a moved piece's direct check, another blocker, a screen
remaining on the ray, an unrelated move and the slider itself moving. Canonical registration,
borrowed-input refusal and all 249 unchanged predecessor cases are also checked. These tests
run in ordinary software CI and in the existing cited/foundation commands. They repair and
validate an executed relation, not hint quality, move quality or whole semantic qualification.

`make support-seat-lifecycle-check` covers automatic Nudge/Structure transport and malformed
response failures, explicit single-flight recovery, exact subject/help/decision, pending focus
and removal by Quiet. The tablet control uses the real query's populated packet rather than
assuming that a pawn-free position produces silence. `make support-seat-lifecycle-browser-check`
includes four desktop/touch-phone failures followed by actual server recovery: rendered components,
owned focus, responsive geometry and unchanged recorded moves/branches/events. Transport is
deliberately refused; successful packets are fetched from the application, not invented by the test.
These cases run in normal software/browser CI. D3713 retains the source-bound silent-success
journey, and selection usefulness remains separate from transport recovery.

`make checkpoint-readiness-check` covers the pending session-to-checkpoint handoff and
continuation failure/retry. `make checkpoint-readiness-browser-check` deliberately holds
the move's feedback response open, checks that Continue waits, then crosses both distinct
checkpoints and opens a branch group. It also runs the complete three-candidate group journey.
These controls run in ordinary software/browser CI with unchanged deadlines and no retries;
the backdrop is neither bypassed nor dismissed by the test.

`make classroom-detail-check` checks exact classroom roots and child relationships through the
HTTP adapter and mounted application, alongside existing server consent/authorization tests.
`make classroom-detail-browser-check` exercises actual desktop and touch-phone creation,
detail refusal/retry, invitation and assignment: a deliberately crossed secondary read cannot
disguise mutation success or cause the retry to repeat the mutation. These permanent tests also
run in ordinary software/browser CI; they do not complete the broader coach/streamer workflows.

`make longitudinal-worker-start-check` covers real starting-thread ownership on invalid first
frames, reported refusal, late readiness and startup deadline, including actual application
SQLite cleanup and immediate reopening. All six controls reproduce the predecessor's early
settlement. They run in normal software CI with explicit empty catalogues; existing projector,
worker ready/crash/drain and isolated 80-ply performance checks remain separate and unchanged.

`make play-start-check` covers the visible normal/FEN choice, current roster, busy/repeated
submission and retry, plus complete bot-reference admission in both the response and recorded
start. `make play-start-browser-check` exercises actual desktop/phone start, play, reload,
crossed HTTP response refusal and exact-bot retry. These cases also run in normal CI.

`make predicate-validation-check` retains the real Carlsbad plan-resolution and four refusal
scenarios as independent functional tests. Each has the unchanged five-second test deadline;
five full-document validations no longer share one deadline. This is functional coverage,
not a validator performance benchmark or proof of a particular runtime latency.

`make review-route-check` includes exact Analyze run/branch/move/entry admission, crossed
responses, single-flight focus continuity, read failure/retry and departed-result controls.
`make review-analysis-browser-check` exercises the built application on desktop and a
touch-enabled phone: two crossed HTTP responses, a late navigated-away read, keyboard
Analyze/Hide, unchanged recorded play, a real different retry move and Compare. Both journeys
also run in ordinary browser CI; they add no source, search or move-quality policy.

`make bot-label-check` covers the distinction between raw Maia model-band settings and
measured profile strength through shared copy, mounted Play/Rating, all four unchanged
selection payloads and resistance presentation. `make bot-label-browser-check` exercises
actual desktop/phone Play and Rating, Compare replay and registered-profile resume journeys. These cases also run
in ordinary software/browser verification; no calibration or profile behaviour is inferred
from passing presentation tests.

`make make-toolchain-check` proves standalone JavaScript recipes select the configured runtime
even when an ambient `node` disagrees. It runs in the software gate; its fixtures invoke Make with
two controlled executable choices rather than checking only a PATH string. Normal caller commands
and CI's runtime/package-manager requirements are unchanged.

`make recorded-semantic-path-check` includes demand-bound defender-consequence controls: quiet
and non-positive captures need no defense populations, an undefended target needs only the initial
population, and a lost defender needs no reply population. Complete legal-window validation and
both observed consequence arms remain. The complete quiet-path control retains all 39 window
receipts. The fixed imported census, eager/exact parity and unchanged 500 ms performance tier
remain separate; a passing replay does not explain D3532's historical excursion.

`make square-control-presentation-check` covers attack-only legal control through the collector,
sealed reading/events, complete candidate packets, presentation adapters and actual Inspector API.
Pawn advances remain legal moves, not attacks; all 112 king/rook home-rank geometries preserve
friendly-target castling separation, including adjacent Chess960 rooks. The actual opponent adapter
also checks the controller subset in its ordinary software test. `make square-control-browser-check`
checks exact counts and saved-play preservation on the built desktop/touch-phone Inspector and
reload. These controls run in normal software/browser tiers; they do not complete selected-Sight
delivery, bot calibration or semantic qualification.

`make castling-evidence-check` includes local trapped-piece escape testing through collector,
factory, complete candidates, opponent consumer and authenticated Inspector. Safe castling rook
landings escape; locally losing landings and same-board no-right controls remain trapped.
`make trapped-piece-browser-check` runs eight actual desktop/phone-width Inspector journeys with
exact captions, responsive layout and unchanged saved play. These permanent controls also run in
the ordinary software/browser tiers; they are not a new chess convention or bot calibration.

`make campaign-actions-check campaign-actions-browser-check` covers Campaign read/action
recovery at the mounted boundary and actual desktop/phone HTTP journeys. The in-game strip
withdraws command authority during failed/pending reads; repeated read-only retries preserve the
saved encounter, recorded play, keyboard focus ownership and all 64 hittable squares. A confirmed
seal after a lost submit response does not submit again. These cases run in the normal software
and browser tiers; they do not establish official curriculum or whole-Campaign completion.

`make narration-lifetime-check` checks delayed voice/speech through actual REST authority and
composed HTTP grants, then reasoning review in the separate content tier and workspace types.
It covers disclosure/position changes, revocation, demotion, shared-run deletion, cancellation,
retry/fallback and rejected voice-cache reuse. These permanent cases also run in ordinary
software/content CI. Controlled providers test the application's delivery boundary, not the
quality or availability of an external LLM/TTS service.

`make review-route-check review-evidence-runtime-check` covers complete recorded-event components
through runtime projection, receipt parsing, mounted Review and authenticated application HTTP.
`make review-navigation-browser-check` checks both-color recorded evidence on desktop and phone:
caption/chip paint, navigation cleanup, stable scroll-independent board geometry and unchanged
saved play, alongside the existing keyboard/Retry/Compare journey. DOM-only tests supply explicit
board bounds because happy-dom has no layout; native Playwright owns the geometry proof.
All these cases also run in the ordinary software and browser CI tiers.

`make studio-publication-check` covers mounted Studio publication, JSON-content equality, both
graduation blocker grammars, structured publication-error parsing and the server's existing
immutable community-version contract, then checks workspace types. `make studio-publication-browser-check`
executes actual desktop and phone authoring: Position seed → edit → blocked/failed Save → retry →
reload → private playtest/checkpoint → edit/save → server publication refusal → corrected source
declarations → community Library entry → rehearsal. It verifies that private drafts are not served,
the exact edited title is published and the earlier playtest's pinned document and recorded graph
are unchanged. The fixture reuses existing schema-example chess bytes in an isolated test database;
it is not an authored or graduated official pack. These permanent tests run in normal software and
browser smoke CI, not only through the focused commands.

`make local-module-execution-check` includes D3607's eight runtime landing-square cases and
REST-query control: standard castling from both colors, stationary-king Chess960, ordinary moves,
promotion and en passant. Sealed post-commit Sight matches an explicit query at the actual landing;
feedback withholding, budgets and recorded play remain intact. This repair does not establish the
draft selected-source/native-gesture integration or complete Sight usefulness.

`make submission-review-check` covers the mounted run/result components, classroom shell
and teacher consent/access boundaries. `make submission-review-browser-check` executes
the actual two-account completed assignment → share → teacher inspect → learner revoke
journey at desktop and phone widths. It checks read-only role, unchanged recorded nodes,
cursor and events, zero teacher play/lease writes, and refusal after revocation/reload.
The permanent tests also run in the ordinary software and browser tiers.
Current-checkpoint restoration includes continuation, rewind, already-dismissed sequence
and same-node terminal controls; the browser journey reopens a pack that passed a checkpoint.
The same targets cover incomplete prediction/reasoning submissions at both widths:
share → inspect → reload → learner remains paused → revoke. They assert the closed
incomplete-review ceiling, unchanged cursor/recorded nodes, preserved event prefixes with
evidence-only suffixes, no teacher run writes and
no learner-only inputs in the reader sheet. Mounted controls retain admitted recorded
reasoning without cross-attempt history or provider actions, and scope recorded reply
predictions by checkpoint sequence and node rather than reusing an earlier occurrence.
The pure assistance-compilation POST on reload is not a play write. Background provider
completion may append evidence; exact whole-event-page equality would be a race, not a
stronger read-only contract. The existing recorded-play helper refuses every non-evidence
suffix and any alteration of the recorded prefix.

`make square-control-presentation-check` verifies populated-target arithmetic through both exact
Sight/Inspector adapters, receipt parsing and the real REST module query. Initial-position control
and check-restricted destinations are distinct; an invalid turn clone stays unavailable.
`make square-control-browser-check` checks the actual desktop and touch-phone Inspector, reload and
unchanged recorded play. These permanent tests also run in their normal software/browser tiers.
`make requested-sight-contract-check` is different: strict TypeScript, six disposable D3578
preimage controls and 26 proposed-model controls over genuine sources. The first six expose
current missing square scopes and the complete-set/budget conflict; the others check the authored
selection/identity/availability proposal and full human-readable legal lists. It is excluded from
ordinary software CI and proves no production binding, gesture, acceptance or feature completion.

`make play-composition-max-load-check` exercises all eight play seats through the real assistance
compiler, domain branches, requests and sealed receipts at seven viewports. It includes held-cue
priority, every badge, native swaps/hits, compact tokens and board stability; no packet fixtures or
forced input. `make play-composition-client-check` adds mounted snapshot/decision/badge controls.
These focused commands do not replace the full CI tiers or remaining complete UX acceptance.

`make training-set-catalogue-check` exercises the installed set loader, validators and actual
HTTP catalogue. `make training-pass-model-check` is a **disposable D3535 author model**, also
run by the explicit `verify-rfc-evidence` tier, not ordinary CI: nine tests execute the draft SQL
and shipped pure pass/budget helpers. Its attempts are fabricated, not chess validation. It proves no production tempo,
scheduler isolation, account lifecycle, client journey or amendment acceptance. Those remain
the actual application/client criteria in `rfc/pack-training-forms.md` §4.10.
`make support-theory-navigation-check` checks strict shape receipt rendering and the actual
desktop/phone Support → Library → saved-run return, including unchanged recorded events.
It is a focused development check; the same journeys also run in the browser smoke tier.
`make library-disclosure-check` checks channel-versus-review labels on the catalogue and all four
entry kinds, including filtered publications. `make library-disclosure-browser-check` exercises
the built Library → principle → rehearsal and desktop/phone Support → shape → saved-run return,
retaining source notes and recorded events. Neither check establishes content review or graduation.
`make play-composition-tablet-check` additionally runs final Hint resize/retention, every compact
head swap, staged/empty/consequence states and four independent header separation checks with an
overlap negative control. Native matrix actions have a finite fail-fast timeout, not forced clicks.
`make play-composition-client-check` includes the persistent frame/native-button controls.
It also delays a genuine proactive packet after selecting Theory or More, and replays a guard
snapshot to verify that neither steals the learner's current card; a genuinely new guard retains
its foreground-selection behavior.
`make play-composition-board-controls-check` measures whole shell-control bounds, strip seating and all 64
physical square centers at six projections, including native scroll/recovery at 320×256. Actual
back-rank clicks, promotion Cancel/drag retry and native notation-versus-draft submission remain
separate gestures, not forced clicks or a screenshot-only proof. Mounted notation tests retain
grounded refusal text, modal focus/background release and the read-only controller boundary.
The same focused command checks the actual inert background regions and full native forward/reverse
Tab traversal. The containing workspace is not made inert when it owns the active dialog.
The conformance predicate follows actual fixed-position containing blocks, not every DOM ancestor.
A native-hit positive calibrates viewport-fixed escape; transformed/contained ancestors, an overlay's
own clipped label and an off-viewport fixed edge remain negative controls.

| Tier | Command | Owns | Must not substitute for |
|---|---|---|---|
| Fast commit checks | Lefthook `pre-commit` | Staged diff hygiene, affected package checks, and process contracts over an isolated Git-index snapshot | Full CI or a push gate |
| Software contracts | `make verify-software` | Types, framework-free reducers/selectors, server contracts, schemas and compiled runtime manifests | Real-corpus acceptance, process ledgers, browser behavior or deployed routing |
| Performance contracts | `make test-performance` | Required latency/complexity envelopes in a single-worker process, also included by `verify-software` | Functional assertions or benchmarks sharing the generic parallel test pool |
| Repository governance | `make verify-governance` | RFC/register/work/roadmap/intent consistency, a source-sealed 1.0 status receipt, documentation-index completeness, and test-tier ownership | Product behavior, content quality or release proof |
| Draft-RFC evidence | `make verify-rfc-evidence` or the RFC's named target | Historical review images, author models and counterexamples used to review active RFCs | A required release gate or proof that product code ships |
| Real-content contracts | `make verify-content` | Schema and application compatibility against committed draft/pack/candidate bytes, including the published-pack evidence-digest invariant | Authored chess judgement or software contracts already expressible with synthetic fixtures |
| Browser journeys | `make test-browser-smoke` | Stable user journeys asserted through roles, state and outcomes | Mutable authored prose or exhaustive viewport coverage |
| Real-content integration | `make test-browser-content` | Representative draft/pack integration with the application | Chess-truth validation or product behavior already expressible with a synthetic fixture |
| Responsive/accessibility matrices | `make test-browser-matrix` | Post-gesture geometry/input/accessibility plus all 112 distinct successful unretried composition screenshot attachments | A resting screenshot, cell names alone, or complete every-module semantic conformance |
| Packaged default journey | `make test-browser-production` | Built default configuration, disclosed committed catalogue content, and a real rehearsal without development fixture injection | A deployment-envelope, migration or backup drill |
| Complete browser gate | `make test-browser-ci` | The same four named browser tiers used by GitHub | Release-image, migration or backup proof |
| Full non-browser gate | `make verify` | Software + governance + real-content targets, matching the three required GitHub jobs | Browser or release-image proof |
| Exact local CI | `make ci-local` | Pinned Node/pnpm, Stockfish and Compose preflight, then all required non-browser and browser tiers | Ordinary development checks |

Required microbenchmarks time bounded operation batches and report per-operation batch means. State is
reset before every operation, so the production path still executes each time; batching prevents one
shared-runner scheduler or garbage-collection pause from becoming a false product regression. Absolute
budgets and sample populations remain explicit in the tests. User-perceived tail latency belongs to the
browser and owner-use instruments, not a lucky or unlucky single Node timer observation.

All three verification jobs fetch two commits, not checkout's default one. The content
job's graduation sweep distinguishes a previously committed cited line from one added
in the commit under review; a depth-one clone incorrectly blames both to HEAD. A real
shallow-clone regression covers depth one, depth two and a genuine same-commit refusal.
This requires a parent, not a full-history checkout, and changes no graduation criterion.

`make review-evidence-runtime-check` includes the shared ordinary-response projection:
private provider captures and eval move answers stay out of event pages, run snapshots and
mutation replies. Actual coordinator/HTTP and authenticated application/SQLite-restart
cases retain scalar evidence and the explicit read-only Analyze line. Desktop/phone
`make review-navigation-browser-check` additionally inspects the real Retry response and
continues the alternate move through Compare. These are disclosure and recovery checks,
not new tablebase coverage or completed Review.

For the registered-bot completed-game replay, `make bot-rematch-check` covers exact duplicate
admission, one pending owner, result-modal actions, failure/departure and a real SQLite/HTTP
response through the web validator. `make bot-rematch-browser-check` rebuilds the application and
exercises recovery, retained original moves, exact opponent/seed, reload and departure on desktop
and touch-enabled phone. These cases also remain in the ordinary software/browser tiers; the
focused commands are not substitute release gates or bot-calibration tests.

`make review-route-check` covers route-generation/cited-branch polling and recorded-play
assertion controls; `make pack-loading-check` covers single-pass catalogue admission and
unchanged sibling refusals. `make review-arrival-browser-check` runs all ten arrival samples
plus desktop/phone Nudge, cited Review and same-bot replay. Browser preservation assertions
permit additive background evidence, but reject changed play fields, lost evidence and
non-evidence event writes. These focused checks supplement the complete gates above.

ARR-a9 measures warm arrival inside the browser, from the native catalogue click through an
enabled 8×8/64-cell square board and two further animation frames. It gates the unrounded
five-sample p95 against the unchanged 250 ms limit. The former automation envelope is retained
separately, alongside bounded request counts, so click preparation and assertion polling cannot
be mistaken for application latency. Calibration refuses disabled, incomplete, hidden, zero-size
and non-square boards and retains a deliberately slow arrival above the limit. Real creation
asserts one saved-pack hydration; reload preserves recorded nodes, branches and cursor. Cold
URL-to-board remains the separately named automation envelope, with no invented cold threshold.

`make campaign-actions-check` exercises the mounted campaign map and encounter strip: departure,
replacement, double activation, crossed responses, exact response-loss retries and independent
abandonment-result recovery. `make campaign-actions-browser-check` uses the real built app/server
to accept a command, hold its response, navigate through the shell and then deliver it. Desktop
and touchscreen-phone journeys resume accepted create/start/seal/loadout/abandon operations;
a lost declaration response replays identical input without another reward. These permanent
cases also run in the normal software/browser tiers; they do not graduate the draft curriculum.

`make campaign-preparation-browser-check` exercises the actual built desktop/touchscreen-phone
preparation workflow: modal focus/Tab/Escape, inert background and shell-shortcut ownership,
bounded phone and 640×360 layout, server-persisted kit edits/reload, and dismissal after the real
server accepts Start but before its response arrives. Mounted Campaign checks additionally cover
suppressed tools, refusal rollback, revision ordering and closing a pending kit edit. These cases
run in ordinary CI too; the reduced viewport is a layout projection, not an owner-device zoom
discharge.

`make campaign-result-browser-check` exercises actual desktop/touchscreen-phone
seal → reload → Review → map → next encounter/tool unlock. It checks separate act/reward
income, current kit, unchanged board size, all 64 square centres remaining hittable, and no
horizontal overflow after sealing/reload. Reload preserves the recorded event prefix, nodes,
branches and cursor; only new evidence attachments are permitted. Eight mounted result controls
cover no reward, zero income, equipment/restriction copy, malformed unlocks and a replay with
a later map. These checks also run in ordinary software/browser CI; they do not establish
official content or complete Campaign accessibility/release proof.

`make campaign-history-check` runs mounted campaign-history controls in the software tier
and the actual campaign application contracts in the real-content tier.
`make campaign-history-browser-check` runs the built desktop/touchscreen-phone history journeys:
sealed and abandoned recordings, deletion after loading, preserved progress and recorded moves.
These cases also run in the ordinary CI tiers; opening a recorded encounter is not proof of
the separate complete campaign-to-Review journey.

`make test-browser` remains a convenient single Playwright invocation with the complete screenshot
artifact check for local debugging. GitHub
runs the named browser tiers separately so the failing step says whether the regression is a core
journey, real-content integration, interaction matrix, or packaged default. Traces, screenshots and
the HTML report are uploaded on every outcome. On a local Mac, `make test-browser-ci-awake` runs
those same four tiers under `caffeinate -i` to prevent idle sleep; elsewhere it runs
`make test-browser-ci` directly. Keep the lid open: this wrapper does not prevent clamshell sleep.
A run interrupted by system sleep is not a completed verification; retain the failure and rerun
the unchanged gate while awake, without increasing deadlines or adding retries.
The matrix verifier reads the current JSON report,
refuses missing/duplicate/foreign/failed/retried/wrong-size or out-of-run attachments, then preserves
the report and PNG bytes under `test-results/composition/<report-hash>/`. Later tiers cannot erase
that matrix generation. Its Node negative controls test the evidence join, not image content or complete
A3/A4/A6 acceptance. The genuine eight-seat population fixture is recorded as D3435's
maximum-load checkpoint. The compact tablet queue adds head/selector geometry and native-hit
coverage; D3436 retains phone contract reconciliation. Neither checkpoint treats population/counts
as the complete UX contract.

Playwright has explicit desktop Chromium and Pixel 7 projects. Project-level test filters keep
ordinary journeys on one desktop browser while `@mobile` matrix cases inherit the device's mobile
user agent, touch points and coarse pointer. The accessibility matrix runs axe-core against the
authenticated catalogue, Settings and an active rehearsal; it gates WCAG A/AA violations and
complements interaction assertions for focus ownership, announcements and responsive state.

The permanent endgame-input matrix checks six packs at five viewports through click, drag,
touch, keyboard and text: 150 exact-move cells. Each case uses the runner-owned page/context,
including touch capability and coarse-pointer assertions for touch cases. Registration, opening
each rehearsal and submitting each exact move have named steps; touch does not register an unused
desktop page or close a second context inside an expired test body. Failure artifacts and context
cleanup remain owned by Playwright. This fixture ownership does not prove the cause of a past timeout.

Local Support HTTP tests construct a fresh application in `beforeEach` and release it in
`afterEach`, with normal runner hook budgets and unchanged five-second operation-test budgets.
The test fixture owns the pending construction from the start. Teardown hides its handle
immediately and awaits the eventual application close exactly once, including construction that
finishes after a setup timeout. It never publishes that late application into the next test.
`make application-fixture-check` proves pending, ready, rejected and failed-shutdown ownership
without artificial sleeps, including closure of a real late-arriving listening server.
Every response body is consumed before teardown. Failure diagnostics distinguish application
construction's shape/principle/pack/training/Campaign phases from listen, authentication, module
requests and shutdown. The unauthored Support software controls use real empty shape, principle,
pack, training-set and Campaign registries at the content-acquisition boundary; a permanent check
inspects the exact five objects returned to application composition. Authentication, SQLite,
HTTP, execution compilation and module factories remain production code. The two installed-pack
controls run separately in `local-module-content.test.ts` through the original loaders, with their
original five-second case deadlines explicitly retained. The installed Campaign control also
distinguishes pack loading from Campaign loading and retains real installed validation.
A later passing run or this dependency isolation does not establish the cause of an earlier timeout.

Pre-commit process checks intentionally do not read the shared working tree. The hook materializes
the Git index and runs register, status, work, roadmap and intent checks inside that temporary
snapshot. This makes the commit's staged bytes the unit under review and prevents an unrelated
unstaged schema, migration or planning edit from another worker from blocking it. Direct
`make register-check`, `make status-parity`, and related commands continue to inspect the working
tree during development.

Draft-RFC evidence is deliberately outside `make verify` and GitHub's required jobs. A fresh-review
counterexample proves that an RFC is not buildable; an author model can pin prose or a historical
source image. Those are useful review artifacts, but repeatedly passing them does not prove current
software, content, repository governance, or release behavior. They remain runnable by their named
Make targets and through `make verify-rfc-evidence` for an intentional whole-portfolio audit.
Changes to an RFC run its named target before `make verify-governance`; release CI stays valid on a
normal shallow checkout and never depends on repository history solely for a draft review.

Long-running research and migration instruments also receive named Make targets instead of requiring
contributors to reconstruct environment-prefixed commands. For example,
`make feedback-delivery-measurement` re-runs the accepted Feedback Stage 2 population and tripwire
instrument, while `make feedback-binding-audit` retains the false semantic join that blocks blind
content edits. `make capability-watch-check` validates and regenerates the capability-first
competitor receipt after a product or capability is added. None is a release gate: their job is to
measure and commission product or content work.

Content is shipped product data and therefore still receives schema, provenance, compatibility and
integration validation. Its exact prose is not pinned unless the wording itself is a declared public
contract. Browser tests assert semantic labels and effects such as an `Alternative move` item being
present; content instruments identify which pack and content rule failed.

The real-content Vitest tier has a 30-second per-test deadlock ceiling because its contracts load
and cross-check the complete committed corpus concurrently. That ceiling is not a product-latency
budget: latency and complexity thresholds live in the isolated performance tier. Do not weaken a
content population, add retries, or copy the ceiling into software unit tests to make a red run pass.

Application and runtime unit tests assert exported values, mounted DOM, reducer output and events;
they do not parse `.svelte` source text or pin private variable names, class expressions, or literal
CSS declarations. Layout, hit-target and region-reach contracts run against rendered boxes and
interactive state in the browser matrix. A research or governance census may inspect source only
when source topology is itself the named subject, and it must not stand in for a product-behavior
test.

The evidence-manifest consumer census follows the same rule. Runtime, server, and web register the
twenty-three real consumer callables; the manifest check requires their IDs and exported function
names to agree exactly with the compiled catalogue. It does not open implementation files or grep
for anchor text. Provider-input safety is covered separately by behavior tests over sealed rendered
views, including a forged-sentence negative, so the topology census is not mistaken for data-flow
proof.

`make graduation-plan-check` is deliberately not a required CI dependency. It freezes the current
draft/candidate population and classification plan for an authoring migration; changing that
population is planning evidence, not a software regression. Run it while working on graduation or
content-wave planning. `make test-tier-check` prevents a test that reads real corpus bytes from
silently entering the software-contract suite.

Campaign registry identity/refusal fixtures run in software. The installed-pilot compatibility
case lives in `campaign-core.test.ts` in the content tier because `PackRegistry.loadDefault()`
loads the whole committed corpus. It retains its own five-second timeout, complete pack
population and community/node-count assertions; moving it does not diagnose loading stalls.
The installed pack-list case similarly lives in `evidence-at-runtime.test.ts`, retaining its
fifteen-second limit and every fixture-exclusion assertion. The existing tier guard now also
recognizes the default PackRegistry loader; fixture-only `fromDocuments` tests remain software.

`make docs-check` is a deliberately narrow navigation contract. It requires every Markdown file
directly under `docs/` to appear exactly once in `docs/README.md` and requires the root README to
link the architecture, feature map, extension guide, contributor guide and complete docs index. It
does not claim that prose is current merely because the file is reachable; behavioral tests and
the tier reconciliation process remain the truth checks for content.

`make graduation-report` is the author-facing freshness census. It may report stale working
candidates without failing CI; it fails only when stale or unreadable evidence would otherwise be
called graduable. The real-content suite also examines every published pack directly, so moving a
stale pair into `content/packs/` cannot bypass the report by changing roots.

Release proof remains a separate roadmap obligation: application-boundary API reachability,
container boot, prior-schema migration, provider degradation, backup/restore, update/rollback and
artifact/SBOM/signature checks cannot be inferred from the tiers above.

`make http-streaming-check` runs the real Node adapter's streaming/failure controls, also discovered
by `make test-software`. `make http-streaming-proxy-check` is a separate Docker release-tier check:
it bundles the same adapter into a disposable upstream, uses the production checksum-pinned Node
base and exact rendered appliance Caddyfile/image, and proves first-byte-before-completion plus
disconnect cancellation through trusted TLS. It owns and removes only its random test containers,
networks and temporary directory. Native release CI runs it on amd64 and arm64. Neither target
discharges body budgets, WebSocket product routes or the complete self-host release journey.

`make http-ingress-check` runs ten actual HTTP controls, automatically in the software tier.
Incomplete-header/body cases exercise the real 10 s/30 s production deadlines, with per-case
deadlock guards; no global timeout is raised. `http-streaming-proxy-check` also proves early
Origin refusal and cancellation-response delivery on unfinished uploads through pinned TLS.
`make verify-deployment` validates both exact rendered Caddyfiles with inert identity fixtures,
not the operator startup wrappers or an actual Maia deployment. Native release CI runs these
proxy/configuration checks on both architectures; a local pass is not remote matrix evidence.

`make maia-identity-check` tests both native config choices and the actual Python sidecar→server
artifact-probe protocol using every rendered profile's identity metadata. Its UCI process is a
readiness-only stub, not model inference. The five JS/Python checks also run in the offline
release-policy tier, and the six TCP tests run in software contracts, including observed real
fragmentation and an abandoned probe followed by intact UCI commands. Native release CI runs the
named identity target on both architectures. Python 3 is required for these bounded sidecar tests.
