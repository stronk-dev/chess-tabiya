# RFC: Intent presets — the workflow/preset layer over the module foundation

- **Status:** draft — 2026-08-22
- **Author:** claude (drafted from `planning/evidence-foundation-ux/presets-head-derivation.md`, the HEAD derivation of every surface this document composes)
- **Created:** 2026-08-22
- **Design refs:** `design/05-in-run-experience.md` §3-forms O4 amendment (the algebra), §3a (silence default), §5 Q4; `design/03-product-breadth.md` §Play, §Review and explore, §Live and community, shell table
- **Exploration gate:** Phase 5 of `planning/evidence-foundation-ux/plan.md` (the D717 program), unblocked by `learner-modules` acceptance 2026-08-22
- **Depends on:** `rfc/learner-modules.md` (accepted — the 11 module ids and their contracts), `rfc/play-composition.md` (accepted — the preset pill slot and disclosure seat), `rfc/assistance-control-wiring.md` (draft, in review — landing-order assumptions in §8.2)
- **Parent / amends:** `rfc/assistance-controls.md` (draft, returned on D715) — this RFC discharges its D532 per-context-ceiling obligation whole, per its own return instruction
- **Supersedes / superseded by:** —
- **Planning:** `planning/evidence-foundation-ux/`

```tabiya-claims
none
```

## Summary

This RFC names the two vocabularies production has never had — the **workflow context** a
learner is in and the **preset** they request — and specifies the pure compiler that turns
`(preset, context, access, availability)` into the modules that may render and the
`AssistanceConfig` the shipped screen consumes. It is the activation layer the accepted module
foundation is waiting for: `learner-modules`' Discharge D1 and `play-composition`'s Discharge D1
both name this RFC's landing commit as their recording site, and until it lands the eleven
registered modules are production-registered but preset-inert. It also discharges the
D532/D715 obligation inherited from `assistance-controls`: every shipped context gets an
enumerated ceiling ("what it may never show"), the permission vocabulary becomes able to express
the rules floor, and `permittedAssistance` finally receives a context input that can see
`match`/`stream`/`onramp`. Preset names, defaults and per-context allowances ship as
**candidates behind an owner-use validation gate** — the D907 shape — because R3's exit is
owner use, not desk work. Claims nothing versioned.

## Motivation

`design/05` §3-forms (O4, quoted verbatim in §2) mandates a layered configuration model —
*"Ordinary views expose **modules and presets**; raw source/form switches live in
Advanced/Custom surfaces or the inspector"* — and ends with *"Exact preset names, budgets,
defaults and Review Map moments are deliberately not chosen here — they remain with R3/R7."*
This is the document that chooses. At HEAD (`presets-head-derivation.md` §0): a grep for
`preset|Preset` over `apps/web/src`, `packages/runtime/src`, `apps/server/src` returns **zero
production hits**. What exists instead is five overlapping vocabularies that no two of which
agree — the six `ASSISTANCE_PROFILES`, the seven capability `SURFACE_IDS`, the eight shell
routes, design/03's surface names, and the disposable R3 harness's six workflows × five
presets — plus a 54-control raw preference matrix the A5 audit measured as the negative
baseline.

Out of scope: opponent policy (bot-policy's seam ends at `run.opponentPolicy`; §8.1), module
eligibility (the D660 bar; §9), theming/animation (play-composition Discharge D3's lane),
campaign encounter rules (`design/06` — campaign *consumes* this contract as one more context
when its RFC arrives; it is deliberately **not** one of the seven contexts here), and any
change to authored pack bytes.

## Specification

### §1. Two axes, not one — and the retirement of the eight-name shorthand

The program plan's row 5 lists eight intents: *Just Play / Guided / Support / Drill / Review /
Analyze / Academy / Stream* (`plan.md:28`). Derivation §3.5 shows that list **conflates two
axes**: five of the names are places a learner is (contexts), two are amounts of help they
asked for (presets), and one (Review) is a surface state. design/05 itself types "Support" as
a preset (*"an explicit Support preset"*, O4). This RFC resolves the conflation; the
eight-name shorthand is retired by proposed row [[D942]].

**The normative mapping table** — every prior vocabulary resolves here:

| plan-row name | axis | production symbol (this RFC) | existing anchors it subsumes |
|---|---|---|---|
| Just Play | context | `position` | profile `position` ("Just Play", `AssistanceSettings.svelte:16`); surface `justPlay`; `JustPlayStarter.svelte` |
| Drill | context | `pack` | profile `pack` ("Curated drill"); the pack run machinery |
| — (imported) | context | `imported` | profile `imported` ("Imported game") |
| — (match) | context | `match` | profile `match`; `liveKind === "match"`; `seatedInContest` |
| Stream | context | `stream` | profile `stream`; `liveKind === "stream"`; routes `live`/`live-overlay` |
| Academy | context | `academy` — **new seventh context** | `LIVE_SESSION_KINDS` member `"academy"` (`packages/runtime/src/types.ts:38`), which today **falls through** to `pack`/`position` (`assistance-preference.ts:7-12`) — the defect proposed as [[D943]] |
| — (on-ramp) | context | `onramp` | profile `onramp`; `feedbackPolicy === "immediate_guard"` |
| Guided | preset | `guided` | R3 `guided`; `AssistanceConfig.guided` |
| Support | preset | `support` | R3 `support`; design/05 O4's "explicit Support preset" |
| Analyze | preset | `analysis` | R3 `analysis`; design/03:62 "deep analysis mode" |
| Review | neither | the review surface (route `review`, surface id `review`) | reviewing is **access**, not a context or preset: the `reviewing` boolean minted by `reviewingGrant` enters the algebra through the honesty/access term (§2), and the `analysis` preset is how a reviewer widens what renders there |

`WorkflowContextId` (new, `packages/runtime/src/presets.ts`):

```ts
export const WORKFLOW_CONTEXTS = Object.freeze([
  "pack", "position", "imported", "match", "stream", "academy", "onramp",
] as const);
export type WorkflowContextId = (typeof WORKFLOW_CONTEXTS)[number];
```

This is the shipped `ASSISTANCE_PROFILES` set (`assistance-preference.ts:4`) **plus
`academy`**; `AssistanceProfile` becomes a re-export of `WorkflowContextId` at landing (one
vocabulary, client and server — the derivation function moves to runtime, §3.1). `PresetId`
promotes R3's five ids:

```ts
export const PRESET_IDS = Object.freeze([
  "quiet", "guided", "theory_only", "support", "analysis",
] as const);
export type PresetId = (typeof PRESET_IDS)[number];
```

### §2. The algebra, quoted then typed

`design/05:232-235`, verbatim — the normative sentence (the plan row's
`preset ∩ ceiling ∩ role ∩ availability` is a paraphrase; quote this, not the gloss):

> **Effective assistance is `requested preset ∩ workflow/session ceiling ∩ honesty/access ∩
> source availability` — every term only narrows.** A workflow or session ceiling can only
> remove assistance, never add it.

The four terms, typed against what ships:

| term | type at HEAD | this RFC |
|---|---|---|
| requested preset | absent | `PresetId` + the learner's stored per-context choice (§6) |
| workflow/session ceiling | absent (the D532 debt) | `ContextContract` per `WorkflowContextId` (§3) |
| honesty/access | `AssistanceContext` (`assistance.ts:21-27`): `deliveryOpen`, `role`, `seatedInContest`, `reviewing` — with `sessionKind` declared-and-unread | `AssistanceContext` gains `workflowContext: WorkflowContextId` and `permittedAssistance` reads it (§3.1); role stays this term's business — the plan row's "role" is a subset of honesty/access, exactly as `learner-modules` §1.7 encodes it |
| source availability | shipped: `AvailabilityMode`, `ProviderOffBehavior` (`evidence-contract.ts:9,11`), `/capabilities` providers | consumed, not reinvented — a module whose sources are absent renders its declared `emptyBehavior`; the preset layer never masks an honest-empty |

### §3. Context contracts — the D532 table

Each context carries a `ContextContract` (new, `presets.ts`):

```ts
export interface ContextContract {
  readonly id: WorkflowContextId;
  readonly defaultPreset: PresetId;
  readonly allowedPresets: readonly PresetId[];
  readonly moduleCeiling: readonly ModuleId[];     // learner-modules' closed 11-id union
  readonly configClamp: Readonly<Partial<Record<keyof AssistanceConfig, AssistancePermission>>>;
}
```

**The candidate table** (validation-gated, §7; `moduleCeiling` is stated as the complement —
what the context **may never show** — because that is the sentence D532 requires):

| context | default | allowed presets | may NEVER show (module ceiling complement) | ruling anchors |
|---|---|---|---|---|
| `position` (Just Play) | `quiet` | all five | nothing — full ceiling | R3 `just_play`; §3a silence stays the default |
| `pack` (Drill) | `quiet` | `quiet`, `guided`, `theory_only`, `analysis` | `blunder_prevention` (Support not offerable here — candidate, owner-tunable) | design/05 O4: proactive prevention only in explicit Support; R3 excluded Support outside just_play |
| `imported` | `quiet` | `quiet`, `guided`, `theory_only`, `analysis` | `blunder_prevention` (historic moves; a proactive guard over a replay is noise wearing a safety label) | [[D934]] decision-class grain |
| `match` | `quiet` | `quiet` only | everything except `rules_floor` — a seated contest shows the rules floor and nothing else pre-terminal | `seatedInContest` already locks `humanSplit`/`corpus`; both players see byte-identical disclosure (`design/03:93-98`) |
| `stream` | `quiet` | `quiet`, `guided`, `theory_only`, `analysis` | `blunder_prevention` | the streamer *"may cheat on themselves"* (`design/05:435-437`) — analysis is offerable; relayed marks stay attribution-governed (`design/05:199`), cited not re-derived |
| `academy` | `guided` | `quiet`, `guided`, `theory_only` | `blunder_prevention`, `full_inspector` (the coach relays; the participant's own inspector waits for the review surface) | `design/05:199`; `design/03:84-86` |
| `onramp` | `guided` | `quiet`, `guided`, `theory_only` | `blunder_prevention`, `full_inspector`, `review_map` | wiring RFC's `onramp` `guided: "live"` fallback (`assistance-control-wiring.md:74-77`) — same value, now with a reason attached |

`configClamp` carries the same ceilings for the nine legacy fields. To express the rules floor,
`AssistancePermission` (`assistance.ts:20`) gains one member:

```ts
export type AssistancePermission = "free" | "locked_off" | "legal" | "sight" | "evidence";
```

`"legal"` means: `boardLighting` may not exceed `"legal"` **and may not fall below it** — the
rules floor is a floor and a ceiling in one token, which is what makes [[D493]]'s regression
(a "quiet-looking" constant flipping the board dark) structurally impossible: no compiled
output can carry `boardLighting: "off"`, because no permission value admits it (acceptance
criterion 3). The `match` context's clamp is `"legal"` on `boardLighting`, `locked_off` on
everything optional; `rules_floor` itself is never in any complement — it is not assistance
(`learner-modules.md:322-329`, `evidence: none`).

#### §3.1 One derivation, two callers

`assistanceProfile` (`assistance-preference.ts:7-12`) moves to runtime as
`deriveWorkflowContext(input: { sessionKind, feedbackPolicy, liveKind? }): WorkflowContextId`,
gaining one branch — `liveKind === "academy"` → `"academy"` — inserted after the `match`
branch, preserving the shipped precedence (`immediate_guard` first). The web client re-exports
it; the server calls it where it builds `AssistanceContext`, so `permittedAssistance`'s body
finally branches on a context that can be `match`/`stream`/`academy`/`onramp` — the
declared-and-unread `sessionKind` defect (D532/D715, `assistance-controls.md:526-535`) is dead
at the mechanism, not patched at one call site. Acceptance criterion 5 requires the new body
to produce **different** permissions than HEAD for at least three contexts, so the wiring
cannot land vacuous (the [[D444]] lesson).

### §4. Presets — the candidate five

Promoted from R3 (`tools/r3-presentation-harness/workflow-contract.ts:29-60`) with module
membership updated to the accepted 11-id contract. Each entry is
`{ id, label, promise, modules, validation: "candidate" }`; labels and promise sentences are
**copy candidates the owner reshapes in play** (§7).

| id | label (candidate) | modules | promise (candidate) |
|---|---|---|---|
| `quiet` | Quiet | `rules_floor` | "Legal interaction stays visible; no chess guidance appears unless you ask." |
| `guided` | Guide me | `rules_floor`, `sight_on_request`, `postcommit_nudge`, `structure_nudge`, `guided_hint`, `compare_coach`, `theory_breadcrumb` | "After you commit, a small consequence nudge; ask for more when you want it." |
| `theory_only` | Theory only | `rules_floor`, `theory_breadcrumb` | "Cited applicable theory; no evaluation, no candidates, no line." |
| `support` | Support | `rules_floor`, `sight_on_request`, `threat_radar`, `blunder_prevention`, `postcommit_nudge`, `guided_hint`, `theory_breadcrumb` | "Staged-move risk warnings, on request, before you commit. Never the best move." |
| `analysis` | Analyze | `rules_floor`, `review_map`, `compare_coach`, `theory_breadcrumb`, `full_inspector` | "Attributed raw evidence, evaluations and lines, in an explicit inspector." |

Deltas from R3, each with its reason: `structure_nudge` joins `guided` (it registered after R3
ran; same post-commit timing class as `postcommit_nudge`); `threat_radar` joins `support` only
(its pre-commit arm is ruled *"pre-commit, inside the Support preset only, on-request, never
proactive"* — [[D906]], `learner-modules.md:906`); `postcommit_nudge` is out of `analysis`
(the inspector surface subsumes it). The union of all preset module lists must equal the
11 registered ids exactly — every module reachable through some preset or the explicit
surfaces, none dangling (criterion 6).

### §5. The compiler

One pure function, no I/O, no clock (new, `presets.ts`):

```ts
export function compileAssistance(input: {
  readonly preset: PresetId;
  readonly context: WorkflowContextId;
  readonly access: AssistanceContext;        // includes workflowContext after §3.1
  readonly stored: AssistanceConfig;         // the learner's per-context stored prefs, v4
  readonly availability: ProviderAvailability; // from /capabilities, F1 vocabulary
}): CompiledAssistance;

export interface CompiledAssistance {
  readonly modules: readonly ModuleId[];              // ⊆ preset.modules ∩ context.moduleCeiling
  readonly config: AssistanceConfig;                  // v4 — no new version, no migration
  readonly suppressed: readonly SuppressionRecord[];  // every removal, with its removing term
}
export interface SuppressionRecord {
  readonly subject: ModuleId | keyof AssistanceConfig;
  readonly by: "context_ceiling" | "access" | "availability" | "stored_choice";
}
```

Rules, in application order (each is an ∩ term — order affects only which `by` a record
carries, never membership):

1. `preset.modules ∩ context.moduleCeiling` — a preset not in `allowedPresets` is refused
   before compilation with a typed error; the UI never offers it (criterion 2).
2. `∩ access` — the existing `permittedAssistance` clamps, now context-aware (§3.1);
   `reviewing` widens exactly as it does today, nothing else does.
3. `∩ availability` — a module whose declared sources are absent stays **in** `modules` and
   renders its declared `emptyBehavior` (`silent | stated_absence | unavailable_source`);
   availability suppresses config fields (`spoken: "provider"` with `tts: "none"` →
   `"browser"` or `"off"`), never honesty states. Absence is stated, never simulated
   (invariant 5).
4. `∩ stored` — **stored explicit choices beat preset defaults, in both directions.** The
   compiled `config` starts from the preset's config projection and is overridden per-field by
   the learner's stored v4 values, except where a `configClamp` term narrows below the stored
   value (a clamp is a ceiling; a stored "off" always survives). Applying a preset **never
   writes** `tabiya.assistance.v1.*` (§6) — the parent contract's criterion 10 (silently
   re-enabling a turned-off control is *"the exact shape of a control that cannot be turned
   off"*, `assistance-controls.md:692-696`) holds by construction.

The compiled `config` stays **version 4**. The module axis does not live in the nine fields
and does not need to: `modules` drives the Phase-3 module runtime, `config` drives the shipped
screen switches; the two layers meet only in the compiler. No preset state is inexpressible —
derivation gap 7's answer is that the question dissolved when modules stopped being config
fields.

A preset **filters modules and never touches eligibility** — *"the preset algebra filters
modules, module eligibility filters events"* (`assistance-surface-taxonomy.md:521`, the D660
bar as carried by `learner-modules.md:267-284`). The compiler's inputs contain no event,
evidence-packet, or eligibility type; its signature is the enforcement (criterion 6).

### §6. Persistence — where the choice lives

`design/05:226-228`: *"Workflow identity and the requested preset are stored separately from
technical source preferences."* Concretely:

- New key grammar **beside, never inside** the existing one:
  `` `tabiya.workflow.v1.${contextId}` `` storing `{ version: 1, preset: PresetId }`,
  through the same `PreferenceStorage` seam. Unknown/malformed values fall to the context's
  `defaultPreset` — same posture as `loadAssistance`.
- **Client-side only, claims nothing versioned.** Precedent: assistance preferences persist in
  localStorage with the version inside the value; `learner-modules` stored no preference and
  claimed none. Server-side per-learner workflow storage is a real future (the longitudinal
  personalization era will want it) and is **deferred by Discharge D2** — the future RFC
  claims its migration position then; nothing here forecloses it.
- **A mid-run preset change is not a run event, and here is the argument rather than the
  omission** (derivation gap 5): raising a preset changes what may be *offered*; nothing
  renders to the learner without passing through the disclosure events the run log already
  carries (the `attempt_end` reveal wiring, module `on_request` grants). The reopen condition
  is named and tested: **if any module rendering path delivers content without a logged
  disclosure event, this decision is void** and the successor claims run lane 0.19 with a
  `preset.changed` event (criterion 9 is the guard — changing preset mid-run with no learner
  request must produce zero new rendered items). Run lane 0.19 is explicitly **not claimed**.

### §7. Surfaces, and the owner-use validation gate

- **The preset pill** (`play-composition.md:159-160` reserved the slot; semantics now chosen):
  it shows the active preset's label and opens the per-context preset menu — only
  `allowedPresets` entries are offered; composition state 7 covers the open menu.
- **The standing disclosure footer** (`play-composition.md:169-170` reserved the seat): one
  sentence rendering the compiled truth — the preset's promise when nothing is suppressed,
  and the suppression stated when it is (*"Support isn't available in a match"* — rendered
  from `SuppressionRecord`, which is what the record type exists for). Invariant 5 applied to
  configuration itself.
- **Settings** keeps the six-profile grid and gains the seventh context; raw switches remain
  the Advanced surface per design/05 — the pill is the ordinary view.
- **The validation gate** (the [[D907]] budgets→backstops shape; R3's exit is owner use,
  `design/research/evidence-presentation.md:5`; [[D649]]: validation is the owner's own use):
  every entry in the preset table and the context table carries `validation: "candidate"`.
  A candidate is confirmed, renamed, or re-tabled by an owner ruling logged in
  `planning/exploration/log.md` after real sessions; the lint in criterion 8 fails any entry
  that drops the marker without a ruling citation. Acceptance of this RFC does **not** freeze
  the names — it freezes the algebra, the types, and the ceilings' ruled floors (§9).

### §8. Seams

#### §8.1 Opponent selection sits beside the preset, not inside it

Bot-policy's seam ends at `run.opponentPolicy` (`bot-policy.md:434-437`: the roster picker is
surface work; the request composer is `#selectionRequest` reading the run's persisted policy).
A preset is viewer preference layered over a run; opponent policy is run-creation state. A
preset therefore **never writes run state**: the Just Play starter may pre-fill its
run-creation form's policy independently of whatever preset is active, and a preset applies
identically to a run whose opponent was chosen an hour ago. No coupling, no exception.

#### §8.2 Landing order

`assistance-control-wiring` (in review) and this RFC touch `assistance-preference.ts` and the
run screen. Assumed order: **wiring lands first** (it is smaller and already in review). Its
`PROFILE_DEFAULTS` (`onramp` → `guided: "live"`) becomes the `onramp` context's
`defaultPreset: "guided"` projection here — same value, one owner. If this RFC lands first,
it ships that default itself and wiring rebases to consume `ContextContract`. Either way the
on-ramp default exists exactly once (the [[D523]] class: a grammar stated once and assumed
elsewhere is how this fails — criterion 10 asserts single ownership at landing). Bot-policy's
`session-controller.ts` member is disjoint; no file-level conflict beyond ordinary rebase.

#### §8.3 Three role vocabularies, one pinned mapping

`RUN_ROLES = ["host","participant","spectator"]` (`storage.ts:33-34`);
`AssistanceContext.role` adds `"solo"`; F1's `EvidenceRole` adds `"learner"`, `"author"`,
`"operator"`. The mapping this RFC pins (proposed row [[D944]] tracks eventual unification):
a run with no session and one seat is `solo`; `RunRole` injects into `AssistanceContext.role`
unchanged otherwise; `EvidenceRole.learner` is the F1-side name for the acting
`solo|host|participant` viewer; `author`/`operator` never reach the preset layer (their
surfaces are explicit, outside ordinary views). The preset layer reads **only**
`AssistanceContext` — it never invents a fourth vocabulary.

### §9. What a preset may never do — the ruled floor

Bindings this document's candidates and any future owner re-tabling may **not** loosen; each
is cited, none is re-argued:

| binding | source |
|---|---|
| Proactive blunder prevention only inside an explicit Support preset; never the rehearsal default | `design/05:236-238` (O4) |
| `blunder_prevention` timing `at_commit`, Support only | `learner-modules.md:303` |
| Threat radar pre-commit: Support only, on-request, never proactive | [[D906]], `learner-modules.md:906` |
| Avoidance/negative readings face learners post-commit/review only, always with the denominator | [[D745]]/[[D718]] |
| The rules floor is not assistance and appears in every compiled output | [[D493]]; `learner-modules.md:322-329` |
| A preset filters modules, never eligibility | [[D660]]; `assistance-surface-taxonomy.md:521` |
| Stored explicit choices beat preset defaults, both directions | `assistance-controls.md:692-696` (criterion 10 lineage) |
| A ceiling is *"a ceiling on what may be **offered**, never a floor on what is **shown**"* | D532 ruling, `design/BACKLOG.md` |
| Match: byte-identical disclosure for both players | `design/03:93-98` |
| Relayed marks are attribution-governed, not rung-governed | `design/05:199` |

## Deviations from design

None. The algebra is quoted verbatim from `design/05:232-235`; the plan row's
`preset ∩ ceiling ∩ role ∩ availability` phrasing is treated as the paraphrase it is
(role ⊂ honesty/access), which is conformance, not deviation. The one vocabulary design does
not contain — the seventh context `academy` — extends `ASSISTANCE_PROFILES`, which is code,
not design tier; design/03's Academy surface is its anchor.

## Acceptance criteria

Unit note: criteria 1–3 and 6 quantify over the full preset × context cross product —
**5 × 7 = 35 pairs**, of which the `allowedPresets` tables admit **19** (the other 16 must be
refused, criterion 2 counts them).

1. **Pointwise narrowing, exhaustively.** For all 19 admitted pairs:
   `compiled.modules ⊆ preset.modules` and `compiled.modules ⊆ context.moduleCeiling`, and
   for every `AssistanceConfig` field the compiled value ≤ the clamp under the permission
   order. Flip-a-constant check: widening any single ceiling entry makes exactly the fixtures
   naming that entry fail.
2. **Refusal is typed and total.** All 16 disallowed pairs produce the typed refusal, and the
   pill menu for each context offers exactly `allowedPresets` — a browser fixture per context
   asserts the absent options are absent (the negative-fixture-per-context obligation from
   `assistance-controls.md:697-701`, discharged).
3. **The rules floor is unexpressible-off.** Type level: `AssistancePermission` includes
   `"legal"` and no compiler path emits `boardLighting: "off"`. Test level: all 19 compiled
   outputs have `boardLighting ∈ {"legal","sight","evidence"}` and `modules ∋ rules_floor`;
   the D493 regression fixture (quiet × each context ⇒ `"legal"` exactly) is permanent.
4. **Stored-value supremacy, both directions.** Fixture A: stored `guided: "off"`, apply
   preset `guided` ⇒ compiled `guided: "off"` and `tabiya.assistance.v1.*` byte-unchanged.
   Fixture B: stored `arrows: "sight"` in a context whose clamp is `locked_off` ⇒ compiled
   `"off"` with a `SuppressionRecord{by: "context_ceiling"}`. Preset apply writes only
   `tabiya.workflow.v1.*`.
5. **The context reaches the server, non-vacuously.** `deriveWorkflowContext` is the single
   derivation, imported by both client and server (one symbol, two importers — asserted by
   the census test); the fixture matrix over
   `sessionKind × feedbackPolicy × liveKind ∈ {—, match, stream, academy}` matches on both
   sides; and `permittedAssistance` returns a **different** permission set than the HEAD body
   for at least `match`, `stream`, and `onramp` inputs — recorded as before/after pairs so
   the criterion measures a change, not a run ([[D444]]/[[D482]]).
6. **Module closure and eligibility isolation.** Set equality:
   `⋃ preset.modules = the 11 registered ids` (fails when a module registers without a
   home or a preset names a ghost). Type level: `presets.ts` imports no eligibility, event,
   or evidence-packet symbol — enforced by a dependency assertion in the module-boundary
   test, not by review.
7. **The pill and the footer render the compiled truth.** Composition state 7 fixtures: pill
   label = active preset label per context; the footer states each `SuppressionRecord` as a
   sentence when non-empty and the preset promise when empty — asserted post-gesture
   ([[D539]]) at the play-composition viewport set.
8. **Candidate lint.** Every preset/context table entry carries `validation: "candidate"` or
   a ruling citation (log-entry date + anchor); the lint fails a bare non-candidate. Shape
   precedent: grades' `{value, source, pinnedAt}` fields.
9. **The no-run-event guard.** Mid-run preset raise with no subsequent learner request
   renders zero new evidence items (fixture over a live run with `guided` → `analysis`);
   every rendered item in the fixture run traces to a logged disclosure event. This criterion
   is the standing condition of §6's no-lane decision — if it cannot be kept green, the
   decision reopens by its own terms.
10. **On-ramp default has one owner.** At landing, exactly one source defines the on-ramp
    `guided` default (grep-census over `PROFILE_DEFAULTS`/`ContextContract`), whichever
    landing order §8.2 resolved to.
11. **Academy stops falling through.** `deriveWorkflowContext({liveKind: "academy", ...})`
    = `"academy"`, with the pre-fix behavior (`pack`/`position`) as the named regression
    the fixture kills.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Owner-use validation of every `candidate` entry (names, labels, promises, defaults, allowedPresets, the Support-offering set) — confirmed/renamed/re-tabled by logged rulings after real sessions; until then candidates ship as candidates | OWNER | the log entries recording the rulings; the commit dropping each `candidate` marker cites its ruling | |
| D2 | Server-side per-learner workflow persistence (the personalization era's store) — deferred; localStorage is v1's honest scope. The future RFC claims its own migration position (behind `bot-policy` at HEAD ordering) | `planning/exploration/plan.md` | that RFC's registration | |
| D3 | Campaign as an eighth context — `design/06`'s encounter rules compose this contract (a campaign encounter is a `ContextContract` with encounter-authored ceilings); nothing here forecloses it and nothing here builds it | `planning/exploration/plan.md` | the campaign RFC's registration | |

**Discharged BY this RFC's landing** (the SHAs are written into the counterparties' tables in
the landing commit, per their own "recorded when discharged" cells): `learner-modules.md`
Discharge D1 (`:801`) and `play-composition.md` Discharge D1 (`:672`). The landing commit
also closes [[D532]] and [[D715]] (the ceiling obligation, implemented) and flips this RFC's
proposed rows — ledger and log in the same commit, per the completion protocol.

## Open questions

None blocking acceptance. The genuinely owner-shaped choices — names, promises, defaults,
and **which contexts may offer Support** (the candidate table says Just Play only, R3's
posture) — are deliberately structured as validation-gated candidates (§7, Discharge D1)
rather than acceptance blockers, because the owner ruled validation happens through his own
use ([[D649]]) and the D941 lesson is that holding paper for ceremony delays the only test
that counts. An owner who wants Support offerable in `pack` drills says so after feeling it;
the table absorbs the ruling without re-opening the RFC.

## Ledger rows (proposed — renumber at landing; head D941 at drafting, registered block D942–D944)

- **D942 (proposed)** — the plan row's eight-intent list conflates two axes (five contexts,
  two presets, one surface state); resolved by §1's mapping table; the shorthand is retired
  from routing use.
- **D943 (proposed)** — 🐞 an `academy` live session falls through to the `pack`/`position`
  assistance profile (`assistance-preference.ts:7-12` has no academy branch), so a coached
  session inherits solo-drill defaults and ceilings; fixed by the seventh context (§3.1,
  criterion 11).
- **D944 (proposed)** — three role vocabularies coexist (`RUN_ROLES`,
  `AssistanceContext.role` + `solo`, `EvidenceRole` + `author`/`operator`); §8.3 pins the
  injection mapping; unification into one vocabulary is real future work nobody owns yet.

## Changelog

- 2026-08-22: created, drafted from the Phase-5 HEAD derivation dossier
  (`planning/evidence-foundation-ux/presets-head-derivation.md`).
