# The core self-hosts; the release platform does not yet clear 1.0

**Question:** platform-alignment R18 — what exact self-host, provider-off, data-lifecycle, rights,
accessibility, responsive-input and operational floor can the committed product support?

**Status:** mechanical/code/desk arm answered `[V]`; physical-device and screen-reader participant
usability remain external.

## Verdict

The narrow core claim passes: a clean single-host deployment can start without an LLM key, Maia,
Lichess token or paid/cloud provider; a learner can create an account, run a deterministic rehearsal,
commit moves and recover the run after restart. Optional engine loss is *not* honest: capabilities
stay green while an uncached request hangs. `[V]`
`planning/platform-alignment/release-platform/results.md` §Deployment arms.

The 1.0 release claim fails on five independent floors:

1. no portable account export, incomplete deletion and no supported backup/restore/update rollback;
2. no keyboard or assistive-technology move entry, plus unmodified Tab is captured as a shortcut;
3. the documented development/release entry points do not provide one safe complete HTTP/TLS story;
4. the main image has no project/source/notices/SBOM surface and ships the authoring tree;
5. the optional Maia image is 5.11 GB and contains 15 proprietary-labelled NVIDIA components in
   the measured CPU deployment.

These are release blockers, not reasons to abandon the product. They are bounded platform work
behind O13/F12, and none requires changing chess content. `[V]` D605–D615 in
`design/BACKLOG.md`; `[M]` scope synthesis.

The honest current label is therefore **self-hostable development/technical-preview foundation**, not
1.0-ready private FOSS appliance. The project code and the provider-off core are FOSS; the shipped
optional engine bundle cannot yet support the broader “entire distributed stack is FOSS” claim.

## 1. Method and baseline

The product baseline was committed `24430fed2fd1c354dbf2091cf6e07c411867a085`. Because the shared
working tree contained unrelated feedback-delivery changes, deployment used a clean `git archive`
extraction under `/private/tmp`. Research artifacts alone were written in the living tree. `[V]`
`planning/platform-alignment/release-platform/plan.md`; `release-platform/results.md`.

Both root Compose profiles and both rendered release profiles were validated. The audit used a
dedicated project name, port and named volume. It compared default/provider-off and local-engine
profiles, injected Maia loss, exercised account deletion and the absent export route, inspected the
produced images, and drove the built client in Chromium. `[V]` same result; disposable browser
instrument at `tools/r18-release-platform-harness/`.

Resource numbers are observations from one arm64 host, not minimum requirements. Builds were
cache-warm and therefore do not establish cold-network install time. `[V]` same result.

## 2. Provider-off is real, but deployment documentation is split

### 2.1 What works without a cloud secret

The default profile started one 490,016,169-byte server image, migrated a fresh SQLite volume
through migration 23, became healthy, served 50 packs and completed a two-ply rehearsal. The run
survived restart. Initial idle use was 53.3 MiB/11 PIDs; a later post-browser snapshot was
76.42 MiB/11 PIDs. No LLM, corpus, TTS or tablebase provider was configured. `[V]`
`release-platform/results.md` §Deployment arms.

The default mock provider is deterministic product scaffolding rather than a human opponent, but it
is a useful provider-off rehearsal floor. A request for unavailable perfect-tablebase play returned
typed `TABLEBASE_UNAVAILABLE` instead of silently falling back. The core therefore meets “no
mandatory paid/cloud service”; it does not meet “all optional providers degrade honestly.” `[V]`
same result.

No analytics, telemetry, remote font or error-reporting integration was found. Runtime outbound
paths are feature-scoped: Lichess game/study import, explorer/corpus, the public Lichess tablebase,
and explicitly configured external voice/TTS. The default mock profile creates none of those
providers. Maia mode creates the public tablebase source even without a token, so “local engines”
is not synonymous with “offline.” `[V]` `apps/server/src/main.ts`, `tablebase.ts`, `corpus.ts`,
`import-source.ts`, `external-voice.ts`, `external-tts.ts`.

### 2.2 The operator entry points are unsafe/incomplete in opposite directions

Root `compose.yaml` binds `0.0.0.0:${TABIYA_PORT:-3000}` over plain HTTP and forces insecure session
cookies. The release template also binds all interfaces, omits TLS/reverse-proxy configuration and
leaves secure cookies at their production default. The development guide tells operators to run the
release Compose file directly; the TLS prerequisite lives in a different identity document. `[V]`
`compose.yaml`; `deploy/compose.release.template.yaml`; `docs/development.md`;
`docs/identity-and-authorization.md`.

Thus the development command works locally but is unsafe as a LAN/Internet deployment; the release
command is digest-pinned but login over the documented direct HTTP URL cannot carry its secure
cookie. D607 records the required split: an explicit loopback-only local profile and a complete
TLS/reverse-proxy hosted profile. `[V]` same files; `[M]` release consequence.

The root README compounds this by advertising “Zero open defects; 399 tests” as current state while
the latest committed verification log records 754 tests and the shared ledger contains open release
defects. D614 treats generated status as release honesty, not cosmetic cleanup. `[V]` `README.md`;
`planning/exploration/log.md`; `design/BACKLOG.md`.

## 3. Engine-on works until it does not

The optional engine profile started Stockfish 18 and pinned Maia3. One human-common selection
returned in 0.257 s. A one-point idle snapshot used about 1.31 GiB across server and Maia. The
server advertised Maia, Stockfish, public Lichess tablebase and five opponent modes. `[V]`
`release-platform/results.md` §Deployment arms.

Stopping Maia exposed a cache-sensitive false green. The same cached request still returned in
2 ms; a changed-position request produced no response before a 10.006 s client timeout.
`/capabilities` stayed fully green throughout. This distinguishes “cached policy remains usable”
from “provider is healthy for a new position,” a distinction the current registry cannot express.
`[V]` same result; D609.

F12 therefore needs bounded provider calls and a capability state that can represent at least
`available`, `degraded_cached_only`, `unavailable` and `not_configured` (exact names are RFC work).
The client must render the typed state and keep provider-off journeys usable. `[M]`

## 4. Persistence exists; a data lifecycle does not

### 4.1 Durable-data map

| Data class | Stored | Current export | Account deletion | 1.0 gap |
|---|---|---|---|---|
| learner/session/security state | SQLite | none | learner and sessions deleted | account bundle and inventory |
| run snapshots/events/imported game | SQLite | per-run PGN only | retained; owner/writer/grant become `__legacy` | per-run delete + portable full-fidelity run/event export |
| attempts/concepts/schedules/position stats | SQLite | none | cascade/delete with learner | versioned progress export |
| marks | SQLite | own marks may appear in PGN | deleted | document exact inclusion/exclusion |
| repertoires/scans/gap runs | SQLite | repertoire-specific paths | deleted | account-level bundle and restore |
| pack/shape drafts | SQLite | object-specific export | mutable draft withdrawn and reassigned | ownership/withdrawal disclosure |
| registered packs/shapes | SQLite | object-specific export | retained and publisher reassigned | provenance and identity policy |
| live/social state, invitations, votes, journals | SQLite | no account bundle | some creator/actor references become legacy/null via explicit updates or foreign keys | retention, shared-state and moderator policy |
| future R12 style vector | not production | none | unspecified | private-by-default, explicit sharing, export/delete/version expiry |

`[V]` `apps/server/src/storage.ts` migrations and `deleteLearner`; `service.ts` PGN export;
`docs/identity-and-authorization.md`; R12 in `player-style-metrics.md`.

The runtime deletion arm proved the surprising row: after deleting the only real learner from a
solo run, attempts/schedules disappeared but the run remained owned and actively written by
`__legacy`. The UI says only “Shared runs are reassigned,” and no per-run deletion route exists.
This is not a judgment that shared/public artifacts must be erased; it is evidence that the present
button is not full data erasure and does not explain its solo-history retention. `[V]`
`release-platform/results.md` §Data lifecycle; D606.

`GET /auth/export` returned 405. Individual PGN/pack/shape/repertoire exports cannot reconstruct an
account's progress, schedules, provenance, social state or future style metrics. D605 therefore
requires a versioned account data bundle rather than renaming PGN. `[V]` same result.

### 4.2 Operations

The named SQLite volume survives restart and migrations run automatically. No supported command or
document defines a quiesced backup, restore verification, pre-upgrade snapshot, failed-migration
recovery or compatible rollback. The audit deliberately did not turn an ad-hoc copy into product
support. `[V]` `compose.yaml`; `apps/server/src/storage.ts`; repository documentation search; D608.

Release CI does useful supply-chain work: it tests first, builds amd64/arm64 server and Maia images,
publishes immutable digests and attaches a digest-pinned Compose file. It does not emit an SBOM,
signature, provenance attestation, database compatibility declaration or rollback artifact. `[V]`
`.github/workflows/release.yml`; `tools/verify-packaging.mjs`.

## 5. Rights: good engine pinning, incomplete application distribution

This section is an engineering inventory, not legal advice.

| Distributed component | Basis checked | What is already good | Unresolved release work |
|---|---|---|---|
| Tabiya code/UI | repository AGPL-3.0 | source repository carries licence | main image/UI has no licence, warranty/source link or corresponding-source pointer; root manifest omits licence |
| Ajv / formats / Svelte | MIT | exact direct versions pinned in lock/manifests | transitive inventory/notices absent |
| chessops / Chessground | GPL-3.0-or-later | exact direct versions pinned | transitive/source/notices surface absent |
| Stockfish 18 | GPLv3 | exact commit and release/source digests; image ships licence and full pinned source | expose through unified notices/source inventory |
| Maia3 source | AGPL-3.0 | exact commit, source checkout, licence and applied patch ship in Maia image | unified source/notice route |
| Maia3 5M weights | model card points to repo for code/weights licence; card labels CC BY 4.0 for paper | exact revision and weight digest | record an explicit resolved weight licence/attribution rather than infer SPDX from ambiguous prose |
| Lichess open database/openings | CC0 on official source pages | source manifests can name/digest inputs | only runtime-allowlisted licensed artifacts should ship |
| authored packs/shapes/principles | mostly declared CC-BY-SA-4.0 at document level | schemas contain provenance fields | source-sidecar census remains mostly no-rights-asserted/ungrounded; Gate F owns substantive grounding |
| Maia Python/CUDA stack | mixed FOSS plus NVIDIA proprietary licence refs | image metadata is inspectable | CPU default must remove proprietary CUDA payload; every variant needs an SBOM/notices |

`[V]` package manifests and built images;
[Stockfish upstream GPL/source requirement](https://github.com/official-stockfish/Stockfish);
[pinned Maia3 AGPL licence](https://raw.githubusercontent.com/CSSLab/maia3/1e13597c42d4858b7cfd7cfdae01e297263364b2/LICENSE);
[pinned Maia3-5M model card](https://huggingface.co/UofTCSSLab/Maia3-5M/blob/b6559de2398d7140b985f28fd2c19fb5e47ddabe/README.md);
[Lichess open database licences](https://database.lichess.org/).

The server image is 490 MB while its `/app` tree is about 11 MB. The Maia image is 5.11 GB while
the model is about 21 MiB and Maia source checkout about 616 KiB. Installed metadata identifies 18
CUDA/NVIDIA packages, 15 proprietary/licence-ref. The measured sidecar ran on CPU. This is D615:
the optional local-engine distribution presently defeats both the simple-appliance resource story
and an unqualified all-FOSS-bundle claim. `[V]` built-image inventory in
`release-platform/results.md`.

The server Dockerfile also copies all of `content/`: candidates, jobs, evidence/source sidecars and
local authoring provenance, not merely runtime packs/shapes/principles. Five manifests expose an
absolute `/private/tmp/claude-501/-Users-stronk-…` path. D611 requires an allow-listed immutable
runtime bundle and a packaging refusal for local/absolute paths. `[V]` image and corpus scan in the
result record.

This does not duplicate Gate F's chess-grounding question. Gate F decides which claims/content may
graduate; F12 decides which exact, rights-cleared bundle is distributed and how recipients receive
licences/notices/source. `[M]`

## 6. Accessibility: the chrome is operable; chess is not

The built run exposes one accessibility-tree node named “Chessboard” with generic role. The board
`div` has `tabIndex=-1`, zero focusable descendants and zero named descendants. There is no square
focus, active-square state, destination announcement, keyboard move entry or alternate text move
form. The surrounding run has many named buttons and inputs, so this is a core-input gap rather
than total disregard for semantics. `[V]` `release-platform/browser-results.json`;
`apps/web/src/lib/Chessboard.svelte`; D612.

Normal focus traversal has a second independent failure. The drill deliberately owns unmodified
Tab as “toggle comparison.” Its interactive-target exception includes inputs, textareas, selects,
buttons and links but not `<summary>`. In the served run, focus reached Assistance and then stayed
there for the next 28 Tab presses. The unit suite currently asserts that Tab is prevented inside the
drill, so this is specified behavior, not browser flakiness. `[V]`
`apps/web/src/lib/DrillScreen.svelte`; `keyboard.ts`; `app-shell.test.ts`;
`release-platform/browser-results.json`; D613.

The tested disabled controls all referenced visible reason text, global focus-visible styling
exists, and the reduced-motion probe found no active animation. Dialog and full screen-reader
usability were not participant-tested, so these observations cannot become an accessibility pass.
`[V]` browser result; `[M]` limitation.

At 390×844 the resting board bottom was 880.52 px in a fixed, non-scrolling viewport. More
importantly, A2 already tested the interaction state rather than geometry: click, drag and emulated
touch delivered the exact authored UCI in only 4/90 cells overall, delivered another legal move in
15/90, and made no request in 71/90. Every phone arm was 0/6 exact. R18 therefore carries D537 and
D573 forward; a resting responsive screenshot cannot clear them. `[V]`
`design/research/interaction-state-correctness.md`; browser result.

A manifest exists but there is no service worker. The current product is installable only to the
degree browsers accept a manifest; it has no offline application/update contract. Evidence does not
show offline rehearsal is necessary for 1.0, so this is an O13 choice rather than a newly invented
defect. `[V]` browser result; `[M]` scope classification.

## 7. Proposed O13 choice set

### Choice A — coherent minimum 1.0 floor (recommended)

Require before 1.0:

- **profiles:** loopback-only provider-off core; CPU Maia/Stockfish local profile; hosted TLS proxy
  contract. Public tablebase/corpus/voice are separately named optional network capabilities;
- **honesty:** live/bounded provider status, typed degradation, no silent substitution and a useful
  deterministic fallback;
- **data:** versioned account export, per-run delete, explicit shared/public retention policy,
  complete account-delete disclosure, private-by-default R12 metrics;
- **operations:** tested quiesced backup/restore, pre-upgrade snapshot, migration compatibility and
  rollback/recovery guide;
- **rights:** runtime-content allow-list, generated SBOM/notices/source links, resolved model-weight
  basis and a FOSS CPU engine image without proprietary CUDA packages;
- **input/accessibility:** exact-UCI click/drag/touch tests; keyboard/assistive board-entry model;
  normal Tab/Shift+Tab traversal; named board status; phone one-board loop and 768 px full-surface
  floor. Participant screen-reader/physical-device sessions remain a release proof, not a claim from
  ARIA inspection;
- **PWA:** manifest/responsive web app only; offline/service worker explicitly deferred and not
  advertised.

This is the smallest floor consistent with “free, self-hostable and usable” as a product identity.
It creates no new chess primitives and does not release the content hold. `[M]`

### Choice B — ship the current boundary as a technical preview

Support desktop pointer use and provider-off Compose for technically capable operators; label local
HTTP, deletion retention, missing export/backup, optional-engine health and accessibility limits.
Do **not** call it 1.0, private-by-default for all data, accessible, offline, or an entirely FOSS
engine bundle. `[M]`

### Choice C — stronger appliance floor

Add offline tablebases/knowledge, service-worker update semantics, signed/attested images,
multi-architecture resource tiers and a complete reverse proxy to Choice A. This is valuable but not
required by the measured core journey; it should be a separate owner promotion rather than silently
inflating F12. `[M]`

Current evidence refuses a fourth option: calling the present state 1.0 with known issues. The
failures prevent the core action for keyboard users, prevent portable data exit and leave the
optional engine state false, rather than merely reducing polish. `[V]` results above; `[M]`
classification.

## 8. Consequences and residual evidence

R18's internal research exit is met negatively: the deployment profiles, provider-off fallback,
resource observations, data lifecycle, rights gaps and mechanical accessibility/mobile floors are
measured. O13 can now be ruled. R18 does **not** clear F12 or release readiness. `[M]`

External/late validation still required:

1. keyboard and screen-reader participants complete move, rewind, assistance, compare and exit;
2. physical phone/tablet users exercise exact moves after selection/layout changes;
3. a genuinely cold pull/build is timed on a clean supported host after the image variants are
   fixed;
4. backup/restore/update and provider-failure drills rerun against the eventual F12 implementation;
5. legal counsel may review the produced inventory, but engineering must first make the inventory
   complete enough to review.

No design intent, product code, schema or authored chess content changes are authorized by this
dossier. D560 remains active. `[M]`
