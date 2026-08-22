# Presets over intent — HEAD derivation dossier (Phase 5 input)

Derived 2026-08-22 at HEAD for the Phase-5 RFC mandated by
`planning/evidence-foundation-ux/plan.md:28` (row 5): *"Presets over intent (Just Play /
Guided / Support / Drill / Review / Analyze / Academy / Stream); effective config = preset ∩
ceiling ∩ role ∩ availability; ceilings only remove"* — *"RFC (with `assistance-controls`
reconciliation)"*. Every claim below carries a file:line or symbol citation read during this
pass; absences are stated as absences. Planning-tier; no design doc is edited by this file.

**Headline finding: no preset, mode, or intent symbol exists in production code.** A grep for
`preset|Preset` over `apps/web/src`, `packages/runtime/src`, `apps/server/src` (excluding
tests) returns **zero hits**. The only executable preset/workflow vocabulary in the repo is
the disposable R3 research harness (`tools/r3-presentation-harness/workflow-contract.ts`,
header: *"DISPOSABLE research harness — platform-alignment R3. Not production code."*). The
RFC names every symbol from scratch.

---

## 1. The existing assistance/preference machinery

### 1.1 The runtime schema — `AssistanceConfig` (`packages/runtime/src/assistance.ts:3-14`)

| field | enum | silent default |
|---|---|---|
| `version` | `4` (literal) | `4` |
| `markers` | `"off" \| "live"` | `"off"` |
| `guided` | `"off" \| "live"` | `"off"` |
| `humanSplit` | `"off" \| "on_request"` | `"off"` |
| `corpus` | `"off" \| "on_request"` | `"off"` |
| `voice` | `"authored" \| "persona"` | `"authored"` |
| `spoken` | `"off" \| "browser" \| "provider"` | `"off"` |
| `boardLighting` | `"off" \| "legal" \| "sight" \| "evidence"` | `"legal"` |
| `arrows` | `"off" \| "sight" \| "evidence"` | `"off"` |
| `ambient` | `"off" \| "on"` | `"off"` |

`SILENT_ASSISTANCE`, quoted verbatim (`packages/runtime/src/assistance.ts:16-18`):

```ts
export const SILENT_ASSISTANCE: AssistanceConfig = Object.freeze({
  version: 4, markers: "off", guided: "off", humanSplit: "off", corpus: "off", voice: "authored", spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off",
});
```

Note `boardLighting: "legal"`, not `"off"` — this is the D493 restoration (§8, trap 2).

### 1.2 The permission ceiling — `permittedAssistance` (`assistance.ts:29-33`)

- `AssistancePermission = "free" | "locked_off" | "sight" | "evidence"` (`assistance.ts:20`).
- `AssistanceContext` (`assistance.ts:21-27`): `sessionKind: RunSessionKind`,
  `deliveryOpen: boolean`, `role: "solo" | "host" | "participant" | "spectator"`,
  `seatedInContest: boolean`, `reviewing: boolean`.
- Body (`assistance.ts:30-32`): `mayRequestSplit = context.deliveryOpen &&
  !context.seatedInContest && (context.role === "solo" || context.role === "host" ||
  context.reviewing)`. Returns `humanSplit`/`corpus` = `"free"` or `"locked_off"`;
  `boardLighting`/`arrows` = `"evidence"` or `"sight"`; `markers`, `guided`, `voice`,
  `spoken`, `ambient` unconditionally `"free"`.
- **`sessionKind` is declared and never read in the body** — the D532/D715 defect (§2).
- `reviewingGrant` (`assistance.ts:35-42`): reviewing requires
  `grantMintedBySubmission && !liveSessionOpen` and an `outcome.reached` event.
- Non-test call sites of `permittedAssistance`: `apps/web/src/lib/DrillScreen.svelte:365`,
  `apps/server/src/rest.ts:98`, `:1234`, `:1253`, `apps/server/src/service.ts:888`,
  `packages/runtime/src/pivotal.ts:98` (verified by grep this pass).

### 1.3 Preference profiles, persistence and migrations (`apps/web/src/lib/assistance-preference.ts`)

- `ASSISTANCE_PROFILES = ["pack", "position", "imported", "match", "stream", "onramp"]`
  (`assistance-preference.ts:4`).
- Profile derivation (`assistance-preference.ts:7-12`): `immediate_guard` → `"onramp"`
  first, then `liveKind === "stream"` → `"stream"`, `liveKind === "match"` → `"match"`,
  else `sessionKind` (`pack`/`position`/`imported`).
- **Persistence: browser localStorage only.** Key grammar
  `` `tabiya.assistance.v1.${kind}` `` (`assistance-preference.ts:15`), via the
  `PreferenceStorage` interface (`:14`). Nothing server-side; no migration register or
  storage version is involved. The version lives *inside the value* (`version: 4`).
- **Migration branches** (`assistance-preference.ts:21-29`): v3→v4 maps
  `spoken: "on"` → `"browser"` and adds `boardLighting: "legal"`, `arrows: "off"`,
  `ambient: "off"`; v2→v4 adds `spoken: "off"` plus the same three; v1→v4 additionally adds
  `corpus: "off"`. **All three branches write `boardLighting: "legal"`** and carry the
  learner's stored `markers`/`guided`/`humanSplit`/`voice` values forward unchanged.
  Malformed/unknown input falls to `SILENT_ASSISTANCE` (`loadAssistance`, `:30-33`).
- **Runtime readers**: `DrillScreen.svelte:742` loads (per profile at run entry),
  `DrillScreen.svelte:387` saves; `AssistanceSettings.svelte:32` loads all six profiles for
  the settings surface (labels at `AssistanceSettings.svelte:16`: *"Curated drill"*, *"Just
  Play"*, *"Imported game"*, *"Match / Arena"*, *"Streamed session"*, *"On-ramp"*), rendered
  from `App.svelte:911`.
- **`PROFILE_DEFAULTS` does not exist at HEAD** — it is specified by
  `rfc/assistance-control-wiring.md` §3 (`:74-77`: five values `SILENT_ASSISTANCE`, `onramp`
  = `{...SILENT_ASSISTANCE, guided:"live"}`) but is absent from
  `assistance-preference.ts` today (read in full this pass; the file ends at `:35`).

### 1.4 No preset/mode/intent concept in code

- `preset|Preset` in production `apps/`+`packages/`: **absent at HEAD** (grep, this pass).
- The only `intent` symbol in the web client is **branch intent** — a free-text label on a
  branch (`screen-model.ts:151`) — unrelated to workflow intent.
- The closest shipped ancestors of "intent" are (a) the six `AssistanceProfile` contexts
  (§1.3) and (b) the run's `sessionKind`/`feedbackPolicy`/`liveKind` triple they derive from.

---

## 2. The `assistance-controls` reconciliation

Two documents, one lineage:

### 2.1 `rfc/assistance-controls.md` — **draft, returned to author 2026-08-22 on D715**

- Status line (`assistance-controls.md:3-5`): *"draft — returned to author 2026-08-22 on
  D715. The owner chose option C in D532, but §4.3 and criterion 11 still specify option A,
  and the current runtime context cannot express the six shipped preference contexts or the
  ruling's rules-floor example."*
- Supersession (`:25-27`): *"§§2, 3, 4.1–4.2 and their acceptance criteria are superseded by
  `assistance-control-wiring.md`; this document retains only D307's F5-coordinated
  permission-ceiling question and its historical audit."*
- **The load-bearing sentence the presets RFC must satisfy** (`assistance-controls.md:533-535`,
  §4.3 item 3): *"O4 now requires `requested preset ∩ workflow/session ceiling ∩
  honesty/access ∩ source availability`, pointwise and narrowing-only. A branch over three
  run kinds is not that contract and would fork ceiling logic before F5 compiles it."*
- The return instruction (`:536-541`): the author must *"either **split** the already-ruled
  reveal/guided/default fixes … and route D532 wholly to F5, or **adopt** F5's compiled
  workflow-context input plus a pointwise permission clamp"*; *"In either shape the final
  table must name what all six shipped contexts may never show; presets may request less and
  may never raise the table."* The split has been taken (D716, §2.2), so **D532's real
  ceiling is now wholly F5's / the presets RFC's to implement.**
- The shape mismatches it hands over (`:526-535`): (1) `RunSessionKind` covers only
  `pack|position|imported` while the shipped preference contexts are six (`match`/`stream`
  arrive via `liveKind`, `onramp` via `feedbackPolicy` — neither reaches
  `permittedAssistance`); (2) `AssistancePermission` has no `"legal"` value, so the D532
  rules-floor example (*"a pack's pre-disclosure boardLighting/arrows drop to the rules
  floor"*, `:742`) **cannot be typed today** — the client only clamps requested `"evidence"`
  to `"sight"`; (3) the ∩ algebra quoted above.
- Withdrawn criterion 11 (`:697-701`): its replacement *"must enumerate every shipped
  workflow context, prove pointwise narrowing against requested preferences, and include a
  negative fixture showing that one context cannot request a capability another forbids."*

### 2.2 `rfc/assistance-control-wiring.md` — **draft 2026-08-22, ready for independent review**

The dependency-free D308/D309/on-ramp-default split (Status `:3`; Codex-authored `:4`).
Summary (`:26`): *"It does not define workflow presets or context ceilings."* Out of scope
(`:34-35`): *"`permittedAssistance`, D532's per-context ceilings, F5 presets/modules"*.
Open questions (`:131`): *"None. D532/D715 is deliberately outside this RFC rather than
silently answered."* Claims nothing versioned (`:16-18`).

**What the presets RFC must therefore reconcile with, concretely:**
1. If wiring lands first, `PROFILE_DEFAULTS` exists with `onramp.guided = "live"` — a
   *fallback default*, never merged over a stored value (`assistance-control-wiring.md:74-77`);
   a preset layer must not re-silence the on-ramp or override stored `guided: "off"`.
2. The reveal control (`Open evidence for this position`, `attempt_end` only, `:44-57`) is a
   run-screen fact any preset composition inherits.
3. D532's ruling (BACKLOG `design/BACKLOG.md:532`): *"the RFC must state what each of the
   five contexts may never show, and `design/05` §3-forms' 'each get their own defaults'
   becomes a ceiling rather than a default"*; explicitly *"a ceiling on what may be
   **offered**, never a floor on what is **shown**"* (against D78/D359's 978-word all-on
   measurement).
4. D715 (BACKLOG `:415`): *"it may not implement choice A after choice C was ruled"* — the
   presets RFC inherits the obligation to give `permittedAssistance` (or its successor) a
   real per-context input covering **all six** shipped contexts plus a permission vocabulary
   that can express the rules floor.

---

## 3. Design tier: ladder, invariants, regions, surfaces

### 3.1 The six invariants (`design/05-in-run-experience.md:35-42`, table, verbatim heads)

1. *"You commit before you learn anything"* (:37)
2. *"An attempt is never destroyed"* (:38)
3. *"Rewind is an experiment, not an undo"* (:39)
4. *"Nothing here invents chess truth"* (:40)
5. *"Absence is stated, never simulated"* (:41)
6. *"The run is the sole source of chess truth"* (:42)

### 3.2 The five regions (`design/05:44-61`)

1 Board and objective; 2 Timeline; 3 Branch rail; 4 Assistance and evidence rail; 5 Session
and role controls (`design/05:48-61`).

### 3.3 The assistance ladder (`design/05:69-77`)

| rung | source (verbatim head) |
|---|---|
| 0 | *"Rules-derived sight"* (:71) |
| 1 | *"Tablebase (≤7 pieces)"* (:72) |
| 2 | *"Engine evaluation"* (:73) |
| 3 | *"Human model (Maia)"* (:74) |
| 4 | *"Corpus frequency"* (:75) |
| 5 | *"Authored claims"* (:76) |
| 6 | *"LLM rendering"* (:77) |

O1/O2/O3 amendment (`design/05:79-105`): eligibility precedes selection; selection is
deterministic; the ladder ranks source risk, not wiring.

### 3.4 The config algebra — the presets RFC's normative sentences (`design/05:221-239`, O4 amendment)

- *"Workflow identity and the requested preset are stored separately from technical source
  preferences."* Ordinary views expose *"modules and presets"*; raw switches live in
  Advanced/Custom/inspector (`:226-230`).
- *"Effective assistance is `requested preset ∩ workflow/session ceiling ∩ honesty/access ∩
  source availability` — every term only narrows. A workflow or session ceiling can only
  remove assistance, never add it."* (`:232-235`). **Note: the design formula's third/fourth
  terms are `honesty/access` and `source availability`, not `role`/`availability`** — the
  plan row's `preset ∩ ceiling ∩ role ∩ availability` is a paraphrase; learner-modules
  cross-review already caught one RFC misquoting this (`rfc/learner-modules.md:148-151`,
  blocker 3 of its changelog). Quote the design sentence, not the plan gloss.
- *"Requested exact sight is legal pre-commit; proactive blunder prevention belongs only to
  an explicit Support preset and is not the rehearsal default."* (`:236-238`).
- *"Theory-only, honest-empty and source-unavailable are first-class states"* (`:239-240`).
- §5 Q4 as updated (`design/05:608-612`): *"raw per-context configuration is no longer the
  ordinary default model. Workflows carry product opinions — presets and modules"* — while
  §3a silence remains *"the product's opinion for rehearsal."*
- Deliberate non-choices (`:241-246`): *"Exact preset names, budgets, defaults and Review
  Map moments are deliberately not chosen here — they remain with R3/R7."* **The presets RFC
  is the document that finally chooses names.**

### 3.5 The eight plan-row intents vs design/03's surfaces

The eight-name list *"Just Play / Guided / Support / Drill / Review / Analyze / Academy /
Stream"* appears **only** in `planning/evidence-foundation-ux/plan.md:28` (grep over `*.md`,
this pass) — it is the D717-handoff routing shorthand, not a design-tier enumeration.
Mapping to what actually exists:

| intent name | design/03 anchor | in code at HEAD |
|---|---|---|
| Just Play | `design/03:35-39` (*"start a normal game … without first selecting a pack"*) | yes — `JustPlayStarter.svelte:13-14`; capability surface id `"justPlay"` (`apps/server/src/capabilities.ts:40-48`, `apps/web/src/lib/api.ts` `SurfaceId`); run title fallback `"Just Play"` (`App.svelte:175`, `DrillScreen.svelte:812`); preference profile `position` labeled "Just Play" (`AssistanceSettings.svelte:16`) |
| Guided | no surface named "Guided" in design/03; the concept is design/05 §3b guided mode (`design/05:305-337`) + R3's `guided_rehearsal` workflow (harness only) | **absent as a surface**; `AssistanceConfig.guided` field only |
| Support | design/05 O4's *"explicit Support preset"* (`design/05:236-238`); module contract `blunder_prevention` *"Support only"* (`rfc/learner-modules.md:303`) | **absent** — no Support symbol in production code |
| Drill | design/03 Play section: Line/Plan/Outcome/Trajectory drills (`design/03:43-52`) | yes as run modes/pack machinery; no "Drill" intent symbol |
| Review | design/03 §Review and explore (`design/03:57-66`); shell area `Review` (`design/03:290`) | route `"review"` (`router.ts:4`), surface id `"review"` (`capabilities.ts:41`) |
| Analyze | design/03:62 *"deep analysis mode"*; R3 `analyze_freely` (harness) | **absent as a route/intent**; deep-analysis features exist inside review surfaces |
| Academy | design/03 §Live and community, *"Academy/coached session"* (`design/03:84-86`) | yes — `LIVE_SESSION_KINDS = ["stream", "academy", "match"]` (`packages/runtime/src/types.ts:38`); note **`academy` is a live-session kind but NOT an assistance profile** — `assistanceProfile` maps only `stream`/`match`; an academy session falls through to its `sessionKind` profile (`assistance-preference.ts:7-12`) |
| Stream | design/03:81-83 (*"Streamer/Twitch"*) | yes — live kind `"stream"` (`types.ts:38`), profile `"stream"`, route `"live"` + `live-overlay` (`router.ts:6,16`) |

Shell routes at HEAD (`apps/web/src/lib/router.ts:1-17`): static `home | play | review |
learn | live | create | library | settings`, plus `run/:id`, `story/:id`,
`live-session/:id`, `live-overlay/:id`. Matches design/03's shell table
(`design/03:286-294`).

---

## 4. The learner-modules contract points a preset composes

`rfc/learner-modules.md` — **accepted 2026-08-22** (`:3`). What presets consume:

- **The closed module list — 11 ids** (`learner-modules.md:299-311`, §4 table):
  `rules_floor`, `sight_on_request`, `blunder_prevention`, `threat_radar`,
  `postcommit_nudge`, `structure_nudge`, `theory_breadcrumb`, `guided_hint`,
  `compare_coach`, `review_map`, `full_inspector`.
- **The 13-field `ModuleDeclaration`** (`:119-197`): `id`, `intent`, `learnerAction`,
  `accepts` (literal projection ids), `timings` (with initiative
  `ambient|proactive|on_request|explicit_mode`), `answerCeiling`
  (`none|fact|pattern|threat|candidate_move|principal_variation`), `ceilings`, `budgets`
  (demoted to backstops by D907 — reducers are the mechanism, `:818-828`), `selection`,
  `emptyBehavior` (`silent|stated_absence|unavailable_source`), `seatClass`
  (`board_input|board_adjacent|rail|timeline|explicit_surface`), `forms`, `rendering`.
  **A preset toggles module membership and may narrow — never widen — timings, ceilings and
  budgets**; §1.7 quotes the ∩ formula and the honesty/access encoding as F1's closed role
  set `learner|host|participant|spectator|author|operator`
  (`evidence-contract.ts:8`, verified).
- **Timing vocabulary** (`:201-209`): `pre_commit | at_commit | post_commit | checkpoint |
  review` — `at_commit` extends the shipped `EvidenceTiming` union
  (`evidence-contract.ts:5`: `"precommit" | "postcommit" | "checkpoint" | "attempt_end" |
  "terminal" | "review" | "analysis"`) at landing (`:219-228`).
- **Eligibility**: 181 declared / **179 compiled** rows, 2 declared-awaiting
  (`derived.grade.move_quality@1`) (`:313-317`, Appendix B `:917-937`). Its role for presets:
  it fixes *what each module may show*; a preset never touches eligibility (R3/D660 bar,
  `:267-284`: *"the preset algebra filters modules, module eligibility filters events"* —
  quoting `design/research/assistance-surface-taxonomy.md:521`).
- **Inspector count: 40** — `module.full_inspector` rows went 34 → **40** by the D924
  Appendix-B amendment (`:581-589`, `:937`).
- **The "effective config" seam exists only as prose + the R3 harness compiler.** Production
  has no compiled workflow input. The harness shape the returned parent RFC tells the F5
  author to adopt (`assistance-controls.md:536-541`) is
  `compileWorkflow(workflow, preset) → { modules, suppressedByCeiling }`
  (`tools/r3-presentation-harness/workflow-contract.ts:83-96`) with
  `WorkflowContract = { id, label, defaultPreset, allowedPresets, ceiling }` (`:21-27`) —
  disposable research vocabulary (`WorkflowId` = `just_play | guided_rehearsal |
  learn_position | review_retry | analyze_freely | campaign`, `:4-10`; `PresetId` = `quiet |
  guided | theory_only | support | analysis`, `:12`). **Note: six R3 workflow ids ≠ the
  plan row's eight intent names** — the RFC must resolve that mismatch explicitly.
- **Discharge D1 held for the presets RFC** (`learner-modules.md:801`): *"Preset/workflow
  activation of the ordinary modules … recorded when discharged: the Phase-5 preset RFC's
  landing commit."* Modules are *"production-registered but preset-inert"* until then
  (`:805-810`).

### 4.1 Play-composition (Phase 4, **accepted**) — what a preset changes composition of

`rfc/play-composition.md`: **16 composition states** (`:502-524`), the closed acceptance
axis (7 viewports × 16 states, 112 screenshots): 1 calm rest; 2 square selected (requested
sight); 3 move staged, cue present (at-commit); 4 post-commit nudge/guard present; 5 rail
module expanded; 6 guided hint at final stage; 7 **menu/popover open ("preset pill or seat
menu open")**; 8 long objective; 9 evidence-unavailable/honest-empty; 10 inspector open;
11 timeline changed; 12 compare open; 13 max load; 14 terminal/outcome reached; 15 promotion
pending; 16 keyboard/text entry active.

Its preset seams, reserved not chosen (`play-composition.md:95-100`): *"This RFC reserves
the preset pill's **slot** in the shell topbar and the 'quiet by choice' disclosure's
**seat**; their semantics are not chosen here."* Topbar carries *"the preset pill slot
(semantics Phase 5)"* (`:159-160`); the rail footer carries *"the standing disclosure footer
(the silence/preset sentence — presentation of a Phase-5 fact, seat only)"* (`:169-170`).
Its Discharge D1 (`:672`) is likewise recorded at *"the Phase-5 preset RFC's landing
commit."* The 54-control assistance matrix is *"Phase 5's to transform"* (`:99-100`).

---

## 5. Role and availability at HEAD

### 5.1 Roles

- `RUN_ROLES = ["host", "participant", "spectator"]`
  (`apps/server/src/storage.ts:33-34`). **No `RunRole` named "reviewer" or "solo" exists** —
  `solo` appears only in `AssistanceContext.role` (`assistance.ts:24`), and reviewing is the
  boolean `reviewing` fed by `reviewingGrant` (`assistance.ts:35-42`), teacher-surface's
  submission-minted grant (migration 24, `rfc/README.md` migration table).
- F1's evidence role set: `EvidenceRole = "learner" | "host" | "participant" | "spectator" |
  "author" | "operator"` (`packages/runtime/src/evidence-contract.ts:8`).
- Session-join invited roles: `"participant" | "spectator"` (`api.ts` `SessionJoinLink`).
- **Three role vocabularies coexist** (RunRole; AssistanceContext.role incl. `solo`;
  EvidenceRole incl. `author`/`operator`) — the presets RFC must pick its "role" term and
  pin the mapping.

### 5.2 Availability

- **Engine mode**: `EngineMode = "mock" | "maia"` (`apps/server/src/application.ts:53`);
  `ENGINE_MODE` env, default `"mock"` (`apps/server/src/main.ts:14`).
- **`/capabilities`** (`apps/server/src/rest.ts:886-894`) serves the `Capabilities` object
  (`apps/server/src/capabilities.ts:79-101`): `engines`, `policyModes`, `feedbackPolicies`,
  `providers`, `surfaces`, `evidenceManifest`, `policyProfiles`, `runSchemaVersion`, plus
  `capabilityDispositions` (`reached|refused|unmeasured|impossible`, `:105-107`).
- **Providers** (`capabilities.ts:65-72`): `opponent: "maia"|"mock"|"none"`,
  `judge: "stockfish"|"mock"|"none"`, `llm: "none"|"external"`,
  `corpus: "lichess-explorer"|"mock"|"none"`, `tts: "none"|"external"`,
  `tablebase: "lichess"|"mock"|"none"`.
- **Surfaces** (`capabilities.ts:40-48`): `SURFACE_IDS = ["play", "review", "learn", "live",
  "create", "justPlay", "fromPosition"]`, each `"available" | "unavailable-here"` (`:51`).
- **Pack/shape channel**: `"official" | "community"`, server-stamped
  (`apps/server/src/pack-registry.ts:42,52,82`; `shape-studio.ts:26,33`).
- Modules already encode availability per F1: `AvailabilityMode = "local" | "recorded" |
  "provider" | "build_time"`, `ProviderOffBehavior = "available" | "honest_empty" |
  "unavailable"` (`evidence-contract.ts:9,11`). The ∩ term "source availability" has a
  shipped vocabulary; the presets RFC consumes it rather than inventing one.

---

## 6. The bot-policy seam — opponent selection sits beside the preset, not inside it

`rfc/bot-policy.md` — **accepted 2026-08-22** (`:3`), claims run-schema **lane 0.18**
(`:48`) plus a migration position behind `longitudinal-store` (`:49`).

- `RunOpponentPolicy` (`packages/runtime/src/types.ts:69-74`): `{ mode: RunOpponentMode,
  targetElo?, temperature?, topP? }`; `RUN_OPPONENT_MODES = ["human_common",
  "strong_engine", "theory_strict", "perfect_tablebase", "practical_resistance"]`
  (`types.ts:41-47`). Bot-policy adds an optional digest-validated `profile` triple to it
  under the 0.18 stamp (`bot-policy.md:418-431`).
- **The D938 seam, quoted** (`bot-policy.md:418-423`): *"Production selection requests are
  not composed ad hoc: the web client assembles every `SelectMoveRequest` from the run's
  persisted policy (`#selectionRequest`, `apps/web/src/lib/session-controller.ts`, reading
  `run.opponentPolicy`)"* — validated **at run creation** via `validateOpponentPolicy`
  (`apps/server/src/service.ts:345` per the RFC).
- **The boundary statement** (`bot-policy.md:434-437`): *"The roster **picker** UI (which
  surface offers which profile) is Just Play / `play-composition` surface work and is not
  this RFC's; the seam specified here ends at `run.opponentPolicy`."*
- Consequence for presets: opponent policy is **run-creation state persisted on the run**
  (`run.started` payload), while assistance preset/config is **viewer preference layered
  over a run**. A preset that embedded opponent policy would have to write run state at
  creation and could never apply to an existing run. The clean seam HEAD offers: a preset
  (or intent surface) may *pre-fill* the run-creation request's `opponentPolicy`, but the
  persisted policy remains the run's own field under bot-policy's lane — composition beside,
  not containment. The plan's phase 6 keeps them separate too (*"policy generation distinct
  from guidance"*, `plan.md:29`).

---

## 7. Persistence, versioning, and register claims available to the RFC

Head values, read from the constants this pass:

| register | head | file |
|---|---|---|
| pack schema | `DRILL_PACK_SCHEMA_VERSION = "0.27"` | `packages/schema/src/index.ts:2` |
| run schema | `DRILL_RUN_SCHEMA_VERSION = "0.17"` | `packages/schema/src/index.ts:1` |
| shape-entry schema | `SHAPE_ENTRY_SCHEMA_VERSION = "0.3"` | `packages/schema/src/index.ts:3` |
| principle-entry schema | `PRINCIPLE_ENTRY_SCHEMA_VERSION = "0.1"` | `packages/schema/src/index.ts:8` |
| storage (migrations) | `STORAGE_VERSION = 24` | `apps/server/src/storage.ts:476` |
| evidence kinds | `EVIDENCE_KINDS` — 7 members (`opening_identity`, `position_legality`, `explorer_frequency`, `explorer_position_census`, `tablebase_result`, `engine_eval`, `puzzle_provenance`) | `apps/server/src/sourcing/types.ts:57-65` |

Live claims (`rfc/README.md` register sections, read this pass):

| resource | claimed | by |
|---|---|---|
| pack lane 0.28 | held | `graduation-clearance.md` (accepted) |
| pack lane 0.29 | held | `pack-population-provenance.md` |
| run lane 0.18 | held | `bot-policy.md` (`OpponentSelection.policy` + `run.opponentPolicy.profile`) |
| shape lane 0.4 | held | `measurement-records.md` |
| `EVIDENCE_KINDS` member `citable_text` | held | `pack-population-provenance.md` |
| migration position next | `learner-rating.md` (two claims: rating tables; cohort tables) |
| migration position behind learner-rating | `longitudinal-store.md` |
| migration position behind longitudinal-store | `bot-policy.md` (stamp-only 0.17→0.18) |

**Free for a presets RFC**: run lane **0.19** (next after claimed 0.18), pack lane **0.30**
(noted as inherited by RFC-6 in `rfc/README.md:29`, so renegotiate if pack bytes were ever
needed — they should not be), migration **position behind bot-policy** if server-side
preference storage is chosen.

**What HEAD suggests the RFC actually needs to claim: plausibly nothing versioned.**
Precedent: assistance preferences persist in localStorage with the version inside the value
(§1.3); `learner-modules` stored no preference and claimed `none` (`learner-modules.md:41-49`:
*"No `AssistanceConfig` version move: this RFC stores no preference — preset storage is
Phase 5's"*); `play-composition` claims nothing versioned. The genuinely open storage
decisions the RFC must make (§8, gaps 4-6): where workflow identity + requested preset
persist (design/05:226-228 requires them *"stored separately from technical source
preferences"*), whether that store is a new localStorage key grammar (no register touched)
or a server-side per-learner table (one migration position, behind `bot-policy`), and
whether choosing a preset is ever a **run event** (it is a "disclosure-adjacent" act;
invariant 6 puts disclosures in the run log — a preset *raising* assistance mid-run
arguably is one). If any run event or field is added, that is run lane 0.19.

---

## 8. Gaps and traps for the RFC author

Questions HEAD does not answer:

1. **No intent/preset symbol exists — the RFC names everything.** Zero production hits for
   `preset` (§0). It must pin: the intent/workflow id enum, the preset id enum, the
   compiled-config type, and their relation to the six shipped `AssistanceProfile` strings
   (`assistance-preference.ts:4`) — keep, subsume, or migrate.
2. **Eight plan-row intents vs six R3 workflow ids vs six assistance profiles vs seven
   capability surfaces vs eight shell routes.** Five overlapping vocabularies
   (§3.5, §5.2, §1.3); no two agree. "Drill", "Analyze", "Guided", "Support" have no
   surface/route/profile at HEAD; "Academy" exists as a live-session kind that today falls
   through to the `pack`/`position` assistance profile rather than having its own.
3. **The ∩ formula's terms need typing.** Design says `requested preset ∩ workflow/session
   ceiling ∩ honesty/access ∩ source availability` (`design/05:232-235`); the plan says
   `preset ∩ ceiling ∩ role ∩ availability` (`plan.md:28`). The RFC must quote design/05 and
   state the mapping (honesty/access ⊇ role, per `learner-modules.md` §1.7's encoding), or
   it repeats the misquote learner-modules' cross-review had to fix.
4. **Where does the chosen preset persist?** design/05:226-228 mandates separation from
   source preferences; nothing at HEAD stores it. localStorage (new key grammar beside
   `tabiya.assistance.v1.*`) vs server-side (migration position) vs per-run.
5. **Is a preset change mid-run a run event?** Invariant 6 (`design/05:42`) names
   *disclosure* as run-log content; a preset that turns on `full_inspector` mid-run is a
   disclosure-shaped act. If yes: run lane 0.19 + event type; if no: state why the existing
   `feedback.revealed` (D308 wiring) already carries the honest record.
6. **The D532/D715 ceiling obligation transfers here whole** (§2.1): enumerate all six
   contexts' ceilings ("what each may never show"), extend the permission vocabulary so the
   rules floor is expressible (`AssistancePermission` has no `"legal"`; `assistance.ts:20`),
   give `permittedAssistance` a compiled workflow input that can see `liveKind` and
   `feedbackPolicy` (today they die at the client's `assistanceProfile`,
   `assistance-preference.ts:7-12` — the server never learns `match`/`stream`/`onramp`), and
   supply criterion 11's replacement: pointwise-narrowing proof + a negative fixture per
   context (`assistance-controls.md:697-701`).
7. **Preset ∩ existing 9-field `AssistanceConfig`: two layers, one truth.** Modules consume
   the manifest; the shipped run screen consumes `AssistanceConfig` (`markers`, `guided`,
   `boardLighting`…). The RFC must say whether a preset compiles *down to* an
   `AssistanceConfig` (keeping v4, no migration) or replaces it (v5 + a migration branch) —
   and if the former, which preset states are inexpressible in 9 fields.
8. **The on-ramp exception and stored-value supremacy** (trap): once
   `assistance-control-wiring` lands, `onramp` defaults `guided: "live"` as a *fallback,
   never a merge* (`assistance-control-wiring.md:74-77`; parent criterion 10,
   `assistance-controls.md:692-696` — silently re-enabling a turned-off control is *"the
   exact shape of a control that cannot be turned off"*). A preset default must obey the
   same rule: stored explicit choices beat preset defaults, in both directions.
9. **The D493 boardLighting trap** (`design/BACKLOG.md:561`): `SILENT_ASSISTANCE.boardLighting`
   was flipped `"legal"` → `"off"` in a 7-file tidiness batch (`f304384`) *"eight hours
   before the owner opened the app"* — a dark board shipped because a constant looked
   cleaner all-off. Closed: the rules floor is `"legal"` again. Binding lessons: (a) all
   three migration branches write `boardLighting: "legal"` (`assistance-preference.ts:25-27`)
   — any preset compiling to a config must never emit `boardLighting: "off"` as a side
   effect of "quiet"; (b) *"legal-move rendering was never on the assistance ladder — it is
   the rules floor, not evidence"* — mirrored by `rules_floor`'s `evidence: none`
   (`learner-modules.md:322-329`); a Quiet preset includes the rules floor
   (R3's `quiet.modules = ["rules_floor"]`, `workflow-contract.ts:34`).
10. **The Support boundary is ruled, not open**: proactive blunder prevention *only* inside
    an explicit Support preset (`design/05:236-238`); `blunder_prevention` timing
    `at_commit`, *"Support only"* (`learner-modules.md:303`); threat radar's pre-commit arm
    ruled *"pre-commit, inside the Support preset only, on-request, never proactive"* (D906,
    `learner-modules.md:906`). The presets RFC decides which workflows may *offer* Support —
    R3's harness excluded it from every ceiling except `just_play`
    (`workflow-contract.ts:75-80`) — but may not loosen these module facts.
11. **Preset-inert discharge debts**: the RFC's landing commit is the named recording site
    for `learner-modules` D1 (`learner-modules.md:801`) and `play-composition` D1
    (`play-composition.md:672`) — write the SHAs into both tables, flip ledger rows, append
    the log entry in the same commit (CLAUDE.md ledger-and-log clause).
12. **R3's exit is owner use, not desk work** (`design/research/evidence-presentation.md:5`:
    *"owner-use exit"* outstanding; `learner-modules.md:96-99`: choosing preset defaults
    without that validation is what Phase 3 refused to do). The RFC should ship names +
    algebra + defaults as *candidates with a validation gate*, not frozen constants —
    matching how budgets were demoted to backstops (D907).
13. **Academy/stream ceilings interact with live-surface rulings**: both players see
    byte-identical disclosure in native match (`design/03:93-98`); the streamer *"may cheat
    on themselves"* (`design/05:435-437`); marks relayed by a host are attribution-governed,
    not rung-governed (`design/05:199`). Per-intent ceilings for Academy/Stream must not
    re-derive these — cite them.
14. **`sessionErrorMessage`/reveal, guided-gate and profile plumbing are moving under this
    RFC** — `assistance-control-wiring` is in independent review and touches
    `assistance-preference.ts`, `DrillScreen.svelte`, `session-controller.ts`
    (`assistance-control-wiring.md:85-96`); bot-policy touches `session-controller.ts` in a
    disjoint member (`bot-policy.md:37`, `:695`). Draft against both landings; state landing
    order assumptions explicitly.
