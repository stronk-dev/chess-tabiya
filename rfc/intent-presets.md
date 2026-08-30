# RFC: Intent presets — the workflow/preset layer over the module foundation

- **Status:** draft — **third author repair complete 2026-08-30 on [[D2171]]–[[D2178]];
  dependency-blocked before another fresh review.** One four-stage typed pipeline replaces the
  monolith; v2 persists its intent arm losslessly; named preset selection clears Custom module
  deltas; browser readiness has one post-server receipt; `rules_floor` is unconfigurable; and
  recovery has a safe typed notice. The repaired module artifacts are correctly treated as
  requirements-only, so effect compilation remains blocked until module-registration is freshly
  accepted and its sealed sources land. The three new shared resources are explicitly routed to a
  register extension, which is also a hard predecessor. `make intent-presets-second-author-repair`
  passes 9/9. Exact repair: `planning/intent-presets/third-author-repair-2026-08-30.md`. No
  implementation is authorised.
- **Author:** claude (drafted from `planning/evidence-foundation-ux/presets-head-derivation.md`, the HEAD derivation of every surface this document composes)
- **Created:** 2026-08-22
- **Design refs:** `design/05-in-run-experience.md` §3-forms O4 amendment (the algebra), §3a (silence default), §5 Q4; `design/03-product-breadth.md` §Play, §Review and explore, §Live and community, shell table
- **Exploration gate:** Phase 5 of `planning/evidence-foundation-ux/plan.md` (the D717 program), unblocked by `learner-modules` acceptance 2026-08-22
- **Depends on:** `rfc/learner-modules.md` (accepted — the 11 module ids and their contracts),
  `rfc/play-composition.md` (implementing — the preset pill slot and disclosure seat),
  author-repaired `rfc/module-registration.md` (the complete binding and execution/DAG authority),
  `rfc/assistance-control-wiring.md` (draft, in review — landing-order assumptions in §8.2), and
  author-repaired `rfc/campaign-core.md` for the Campaign arm only. Campaign remains
  declared-awaiting until that dependency is freshly accepted and implemented; the other seven
  contexts may land first but cannot claim eight-context completion.
- **Parent / amends:** `rfc/assistance-controls.md` (draft, returned on D715) — this RFC discharges its D532 per-context-ceiling obligation whole, per its own return instruction
- **Supersedes / superseded by:** —
- **Planning:** `planning/evidence-foundation-ux/`

```tabiya-claims
none
```

## Second fresh independent return (2026-08-30)

The second author repair was executable enough to expose eight further buildability blockers:
[[D2171]]–[[D2178]].

1. Effect/source alternatives derive from module artifacts independently returned as incomplete
   and false: Guided Hint is absent and the DAG has nine unowned inputs.
2. The original monolithic `compileAssistance` signature remains normative beside a prose-only
   four-stage compiler, leaving two authorities and no exact stage types.
3. The v2 storage image carries neither receipt kind nor migration identity, so first reload turns
   unset into explicit and can turn migrated Custom into a named preset.
4. Choosing a named preset preserves `moduleOverrides`, while any delta forces Custom; the learner
   can select Quiet or Guided and remain in a different effective mode.
5. Browser-channel readiness rides inside the pre-server request/digest and is read again after the
   response, with no freshness or precedence rule.
6. `moduleOverrides.exclude` accepts `rules_floor`, although the legal-interaction floor is
   universally mandatory and criterion 3 requires it in every output.
7. Whole-preference recovery promises a visible suppression, but the union has only
   module/field/effect arms that require valid requested/effective operands.
8. `WorkflowPreferenceV2`, `RequestedAssistanceV1` and the extended closed
   `AssistancePermission` vocabulary are shared versioned resources while the claims block says
   `none` and no register owns them.

`make intent-presets-second-fresh-review` reproduces all eight. The exact evidence and repair order
are in the linked review dossier. The candidate tables and staged-authority direction survive;
implementation remains forbidden until author repair and another fresh review.
The prior **client request/server authority/client channel narrowing** direction is retained; the
return requires its four stages to replace the still-live monolithic API with exact types.

## Third author repair — one lossless, staged authority (2026-08-30)

This section is controlling and supersedes the earlier monolithic `compileAssistance` signature,
the five-key `WorkflowPreferenceV2` interface and every later example that places
`browserChannels` inside the server request.

### One pipeline, four non-interchangeable stages

The only compiler path is:

1. `RequestedAssistanceV1` — `{stage:"requested", schemaVersion:1, contextHint, preference,
   requestDigest}`. It contains no effective values, provider state or browser readiness.
2. `AuthoritativeAssistanceV1` — server-derived context/access/ceilings plus
   `{requestedDigest,effectiveDigest}`. Only this stage may decide modules and chess-evidence
   permissions.
3. `FinalizedAssistanceV1` — joins the authoritative result to sealed source receipts and carries
   `{authoritativeDigest,sourceDigest,finalDigest}`.
4. `BrowserNarrowedAssistanceV1` — binds exactly one current
   `BrowserChannelReceiptV1 {generation,browserSpeech,receiptDigest}` to `finalDigest` and may only
   reduce the browser speech channel. It cannot change modules, chess evidence or other config.

Every stage carries a literal discriminator and the prior stage's digest. A parser for one stage
rejects bytes from any other stage. `compileAssistance` is deleted; the four named functions in
§5.1 are the sole API.

### Lossless preference storage

`WorkflowPreferenceV2` has exactly three envelope fields:
`{version:2, assistanceHead:4, intent}`. `intent` is a closed union:

- `{kind:"unset"}`;
- `{kind:"explicit", preset, overrides, moduleOverrides}`;
- `{kind:"migrated_snapshot", preset, config, sourceVersion, moduleOverrides}`; or
- `{kind:"invalid_fallback", reason:"malformed"}`.

The serializer preserves the arm and its provenance across any number of reloads. A future context
default therefore still applies to `unset`; it never silently becomes explicit. A migrated
snapshot remains Custom even if its bytes happen to equal a named preset. Storage-unavailable is a
runtime recovery receipt and is not falsely persisted as a successful write.

`CustomModuleOverrides` uses `ConfigurableModuleId = Exclude<ModuleId,"rules_floor">` for both
include and exclude. The strict storage and wire parsers independently refuse `rules_floor`, and
the authoritative compiler reinserts the floor before every ceiling as a defence against forged
untyped bytes. Legal board interaction is a platform invariant, not configurable assistance.

Selecting a named preset is literal: it clears both Custom module-delta arrays and retains only
explicit field overrides that are no higher than the chosen preset. Keeping module customization
is an explicit Advanced action, not an invisible side effect of clicking Quiet, Guided or Support.

Malformed/storage-unavailable recovery uses a fourth `SuppressionRecord` arm,
`{kind:"preference_recovery", reason:"malformed"|"storage_unavailable"}`. Its registered renderer
uses fixed copy only; attacker-controlled stored bytes are never reflected.

### Dependency and shared-resource refusal

The repaired module execution/binding artifacts say `completionClaim: requirements_only` and
carry an explicit D1639 Guided Hint blocker. `effectSourceDependencies` must refuse them with
`MODULE_AUTHORITY_NOT_ACCEPTED`; it may compile only after the 117 rows emit sealed projections,
the 205 exact module presentation pairs are registered and Guided Hint is non-vacuous. This makes
module-registration acceptance and implementation a hard predecessor rather than inheriting a
plausible-looking JSON file.

Three shared resources are now named in order: `workflow-preference`, `assistance-exchange`, and
`assistance-permission`. Their register implementation is a hard predecessor to this RFC's next
fresh review and any production landing. The first owns the durable v2 grammar, the second owns all
four exchange-stage grammars and digests, and the third owns the closed permission vocabulary.
Until the shared-resource checker and README register can express those names, this document keeps
`tabiya-claims none` and claims no implementation; it may not smuggle unregistered resource names
into a block the checker cannot read.

## Summary

This RFC names the two vocabularies production has never had — the **workflow context** a
learner is in and the **preset** they request — and specifies one staged authority that turns a
strictly parsed client preference into a server-compiled result, then permits only browser-local
channel narrowing. Preset identity is derived once from the preference receipt; authoritative
context, access, evidence availability and module effects are re-derived by the server. The result
contains the modules that may render and the `AssistanceConfig` the shipped screen consumes. It is
the activation layer the accepted module
foundation is waiting for: `learner-modules`' Discharge D1 and `play-composition`'s Discharge D1
both name this RFC's **Checkpoint B** commit as their recording site. The eleven contracted module
ids and registered renderers now exist; their preset activation edge remains open until a real
consumer reads this compiler and produces a non-vacuous disclosure receipt. It also discharges the
D532/D715 obligation inherited from `assistance-controls`: every shipped context gets an
enumerated ceiling ("what it may never show"), the permission vocabulary becomes able to express
the rules floor, and `permittedAssistance` finally receives a context input that can see
`match`/`stream`/`onramp`. Preset names, defaults and per-context allowances ship as
**candidates behind an owner-use validation gate** — the [[D906]](3) budgets→backstops shape —
because R3's exit is owner use, not desk work. Claims nothing versioned.

## Motivation

`design/05` §3-forms (O4, quoted verbatim in §2) mandates a layered configuration model —
*"Ordinary views expose **modules and presets**; raw source/form switches live in
Advanced/Custom surfaces or the inspector"* — and ends with *"Exact preset names, budgets,
defaults and Review Map moments are deliberately not chosen here — they remain with R3/R7."*
This is the document that chooses. At HEAD (`presets-head-derivation.md` §0): a grep for
`preset|Preset` over `apps/web/src`, `packages/runtime/src`, `apps/server/src` returns **zero
production hits**. What exists instead is five overlapping vocabularies, no two of which
agree — the six `ASSISTANCE_PROFILES`, the seven capability `SURFACE_IDS`, the eight shell
routes, design/03's surface names, and the disposable R3 harness's six workflows × five
presets — plus a 54-control raw preference matrix the A5 audit measured as the negative
baseline.

Out of scope: opponent policy (bot-policy's seam ends at `run.opponentPolicy`; §8.1), module
eligibility (the D660 bar; §9), theming/animation (play-composition Discharge D3's lane),
campaign encounter rules (`design/06` — campaign *consumes* this contract; `campaign` remains a
declared eighth context, but no Campaign origin or receipt is executable until accepted and
implemented `campaign-core` exports its authority; §5.2 phases the other seven contexts), and any
change to authored pack bytes. **Also out of scope,
added 2026-08-24:** the visual form of the pill and footer (§7.1), and any tenth
`AssistanceConfig` field (§9a).

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
| Academy | context | `academy` — **new seventh context** | `LIVE_SESSION_KINDS` member `"academy"` (`packages/runtime/src/types.ts:38`), which today **falls through** to the run's `sessionKind` profile — `pack`/`position`/`imported` (`assistance-preference.ts:7-12`) — the defect proposed as [[D943]] |
| — (on-ramp) | context | `onramp` | profile `onramp`; `feedbackPolicy === "immediate_guard"` |
| Guided | preset | `guided` | R3 `guided`; `AssistanceConfig.guided` |
| Support | preset | `support` | R3 `support`; design/05 O4's "explicit Support preset" |
| Analyze | preset | `analysis` | R3 `analysis`; design/03:62 "deep analysis mode" |
| Review | neither | the review surface (route `review`, surface id `review`) | reviewing is **access**, not a context or preset: the `reviewing` boolean minted by `reviewingGrant` enters the algebra through the honesty/access term (§2), and the `analysis` preset is how a reviewer widens what renders there |

`WorkflowContextId` (new, `packages/runtime/src/presets.ts`):

```ts
export const WORKFLOW_CONTEXTS = Object.freeze([
  "pack", "position", "imported", "match", "stream", "academy", "onramp", "campaign",
] as const);
export type WorkflowContextId = (typeof WORKFLOW_CONTEXTS)[number];
```

**Amended 2026-08-24 ([[D971]]): eight contexts, not seven.** The list above is the shipped
constant verbatim (`packages/runtime/src/presets.ts:5-8`). `campaign` was registered by
`rfc/campaign-core.md` §5 on 2026-08-22, discharging this RFC's own Discharge D3, and the
seven-context arithmetic elsewhere in this document was never re-derived after that landing.
Every count in this document is now eight-context: **5 × 8 = 40 pairs, 28 admitted, 12
refused**, which is exactly what `assertPresetFoundation` asserts at import time
(`presets.ts:91-94`).

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

`design/05:230-232`, verbatim — the normative sentence (the plan row's
`preset ∩ ceiling ∩ role ∩ availability` is a paraphrase; quote this, not the gloss):

> **Effective assistance is `requested preset ∩ workflow/session ceiling ∩ honesty/access ∩
> source availability` — every term only narrows.** A workflow or session ceiling can only
> remove assistance, never add it.

The four terms, typed against what ships:

| term | type at HEAD | this RFC |
|---|---|---|
| requested preset | absent | `PresetId` + the learner's stored per-context choice (§6) |
| workflow/session ceiling | **partly shipped**: `moduleCeiling` lands (`presets.ts:41-50`), `configClamp` does not exist — the [[D971]] half | `ContextContract` per `WorkflowContextId` (§3), with the literal `configClamp` in **§3.2** |
| honesty/access | `AssistanceContext` (`assistance.ts:22-29`): `deliveryOpen`, `role`, `seatedInContest`, `reviewing` — with **both** `sessionKind` and `workflowContext` declared-and-unread at HEAD (`:30-33`) | `permittedAssistance` becomes the pointwise minimum of access and `contextClamp` (§3.2), so `workflowContext` is read and `sessionKind` is removed; role stays this term's business — the plan row's "role" is a subset of honesty/access, exactly as `learner-modules` §1.7 encodes it |
| source availability | shipped: `AvailabilityMode`, `ProviderOffBehavior` (`evidence-contract.ts:9,11`), `/capabilities` providers | consumed, not reinvented — a module whose sources are absent renders its declared `emptyBehavior`; the preset layer never masks an honest-empty |

### §3. Context contracts — the D532 table

Each context carries a `ContextContract` (new, `presets.ts`):

```ts
export interface ContextContract {
  readonly id: WorkflowContextId;
  readonly defaultPreset: PresetId;
  readonly allowedPresets: readonly PresetId[];
  readonly moduleCeiling: readonly ModuleId[];     // learner-modules' closed 11-id union
  readonly configClamp: ConfigClamp;               // §3.2 — TOTAL over the nine fields
}

/** Amended 2026-08-24 ([[D971]]): total, and `version` is not a clamped field. */
export type ConfigClamp =
  Readonly<Record<keyof Omit<AssistanceConfig, "version">, AssistancePermission>>;
```

**The `Partial` in the drafted signature is struck.** A partial clamp cannot be checked for
completeness: a missing key reads as "unclamped" and is indistinguishable from a key nobody
wrote, which is the *"a guard that cannot fail is not a decision"* shape [[D532]] refused. The
clamp is now the same total nine-key record `permittedAssistance` already returns
(`assistance.ts:31` — `Readonly<Record<keyof Omit<AssistanceConfig, "version">,
AssistancePermission>>`), so the two ∩ terms are pointwise-comparable **by type**, and
`keyof AssistanceConfig` no longer admits `version` as a clampable field (it did in the
drafted signature — a live type defect, not a style note).

`ModuleId` is the closed eleven-id union — `ModuleDeclaration["id"]` from the registry
`learner-modules` lands in `evidence-catalog.ts` — exported **once** beside that registry
and imported here, never a second literal copy of the list (the [[D523]] class).

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
| `campaign` | `guided` | `quiet`, `guided`, `theory_only`, `analysis` | `blunder_prevention` | **added 2026-08-24** — transcribed from the shipped row `presets.ts:49`, registered by `rfc/campaign-core.md` §5 on Discharge D3. Not re-argued here; campaign-core owns its ceiling |

Every row above is byte-checked against `WORKFLOW_CONTEXT_POLICIES` (`presets.ts:41-50`) as of
this amendment; the eight `moduleCeiling` values ship as `except(...)` complements, which is why
the table's column is the complement.

**The drafted sentence *"`configClamp` carries the same ceilings for the nine legacy fields"* is
STRUCK (2026-08-24, [[D971]]).** It was the whole of that defect: "the same ceilings" names no
value, and the module ceiling and the config ceiling do not even range over the same vocabulary.
**§3.2 is the literal table**; the paragraph below states only the vocabulary it is written in.

To express the rules floor, `AssistancePermission` (`assistance.ts:21`) gains one member:

```ts
export type AssistancePermission = "free" | "locked_off" | "legal" | "sight" | "evidence";
```

`"legal"` means: `boardLighting` may not exceed `"legal"` **and may not fall below it** — the
rules floor is a floor and a ceiling in one token. The floor is universal, not match-only
(corrected in cross-review — the draft stated the floor mechanism only for the `"legal"`
token, leaving criterion 3 unbacked in every context whose clamp is `"sight"`/`"evidence"`):
on the `boardLighting` field, the only clamp values any `ContextContract` may carry are
`"legal" | "sight" | "evidence"`, **each denoting the range `["legal", token]`** — a registry
invariant (compile-time test, the `learner-modules` §6 pattern) refuses `"free"`/`"locked_off"`
there. A stored `boardLighting: "off"` — a pre-[[D493]] artifact that `validV4` still admits —
compiles to `"legal"`; stored-value supremacy (§5 rule 4) does not apply, because the rules
floor is not an assistance control and turning it off was never a choice the surface honestly
offered (the [[D493]] ruling: *"legal-move rendering was never on the assistance ladder — it
is the rules floor, not evidence"*). That is what makes [[D493]]'s regression (a
"quiet-looking" constant flipping the board dark) structurally impossible: no compiled output
can carry `boardLighting: "off"` (acceptance criterion 3). The `match` context's clamp is
`"legal"` on `boardLighting`, `locked_off` on everything optional; `rules_floor` itself is
never in any complement — it is not assistance (`learner-modules.md:322-329`,
`evidence: none`).

#### §3.1 One derivation, two callers

`assistanceProfile` (`assistance-preference.ts:7-12`) moves to runtime as
`deriveWorkflowContext(input: WorkflowContextOrigin): WorkflowContextId`,
gaining one branch — `liveKind === "academy"` → `"academy"` — inserted after the `match`
branch, preserving the shipped precedence (`immediate_guard` first). The web client re-exports
it; the server calls it where it builds `AssistanceContext`, so `permittedAssistance`'s body
finally branches on a context that can be `match`/`stream`/`academy`/`onramp` — the
declared-and-unread `sessionKind` defect (D532/D715, `assistance-controls.md:526-535`) is dead
at the mechanism, not patched at one call site. Acceptance criterion 5 requires the new body
to produce **different** permissions than HEAD for at least three contexts, so the wiring
cannot land vacuous (the [[D444]] lesson).

**Amended 2026-08-24 ([[D971]]) — the derivation landed and the reading did not.**
`deriveWorkflowContext` ships (`presets.ts:107-116`) with the academy branch, and
`assistance-preference.ts:5` re-exports it as `assistanceProfile`, so half of this section is
done. The other half is **not**: `permittedAssistance` at HEAD (`assistance.ts:31-34`) reads
`deliveryOpen`, `seatedInContest`, `role` and `reviewing` and reads **neither** `sessionKind`
**nor** `workflowContext` — `AssistanceContext` now carries *two* declared-and-unread fields
where D307(a) reported one. §3.2's clamp table is the value that body has been missing, and
§3.2's `permittedAssistance` definition is what makes criterion 5 satisfiable.

**Controlling 2026-08-30 repair — Campaign is declared-awaiting, not locally invented.** This RFC
defines only the ordinary seven-context origin arm it can currently build:

```ts
export type OrdinaryWorkflowContextOrigin = {
  readonly kind: "run"; readonly sessionKind: RunSessionKind;
  readonly feedbackPolicy: RunFeedbackPolicy; readonly liveKind?: LiveSessionKind;
};
```

The `campaign` vocabulary/table row stays registered because it is part of the 1.0 contract, but
no origin union member, client request or server compiler branch may select it until accepted and
implemented `campaign-core` exports the exact encounter receipt, issuer and verifier. This RFC
will import that type; it will not copy or forecast its bytes. The Campaign arm must then cross
start, active-resume, issuer, ids, lifecycle/expiry, active-pointer/event join and ordinary-pack
refusal before eight-context completion. Until then Campaign is an explicit typed
`CONTEXT_DECLARED_AWAITING` refusal and does not silently compile as Pack. The seven ordinary
contexts may implement independently; Campaign remains a hard 1.0 dependency and cannot be
archived away.

#### §3.2 `configClamp` — the literal table for all eight contexts

**Written in the shipped permission vocabulary.** Each of the nine fields has a totally ordered
domain; a clamp token names the highest admissible value in that domain. The token spellings are
the ones `permittedAssistance` already returns (`assistance.ts:34`) — `free`/`locked_off` for
the six two- and three-valued switches, `sight`/`evidence` for the two lit-board fields — plus
`"legal"` for the rules floor. Nothing new is invented:

| field | domain, lowest → highest | admissible clamp tokens | what the token means |
|---|---|---|---|
| `markers` | `off` < `live` | `free`, `locked_off` | `locked_off` ⇒ compiled `"off"` |
| `guided` | `off` < `live` | `free`, `locked_off` | `locked_off` ⇒ compiled `"off"` |
| `humanSplit` | `off` < `on_request` | `free`, `locked_off` | `locked_off` ⇒ compiled `"off"` |
| `corpus` | `off` < `on_request` | `free`, `locked_off` | `locked_off` ⇒ compiled `"off"` |
| `voice` | `authored` < `persona` | `free`, `locked_off` | `locked_off` ⇒ compiled `"authored"` — the field's own floor, not an absent field |
| `spoken` | `off` < `browser` < `provider` | `free`, `locked_off` | `locked_off` ⇒ compiled `"off"` |
| `boardLighting` | `off` < `legal` < `sight` < `evidence` | `legal`, `sight`, `evidence` **only** | token `T` ⇒ the range `["legal", T]` — floor *and* ceiling (§3); `free`/`locked_off` are a registry-invariant failure here |
| `arrows` | `off` < `sight` < `evidence` | `locked_off`, `sight`, `evidence` | `evidence` is this field's `free`; `permittedAssistance` already spells it `"evidence"` |
| `ambient` | `off` < `on` | `free`, `locked_off` | `locked_off` ⇒ compiled `"off"` |

**The table.** Rows are in `WORKFLOW_CONTEXTS` order (`presets.ts:5-8`) so a transcription
mismatch is a diff, not a search:

| context | `markers` | `guided` | `humanSplit` | `corpus` | `voice` | `spoken` | `boardLighting` | `arrows` | `ambient` |
|---|---|---|---|---|---|---|---|---|---|
| `pack` | `free` | `free` | `free` | `free` | `free` | `free` | `evidence` | `evidence` | `free` |
| `position` | `free` | `free` | `free` | `free` | `free` | `free` | `evidence` | `evidence` | `free` |
| `imported` | `free` | `free` | `free` | `free` | `free` | `free` | `evidence` | `evidence` | `free` |
| `match` | `locked_off` | `locked_off` | `locked_off` | `locked_off` | `locked_off` | `locked_off` | **`legal`** | `locked_off` | `locked_off` |
| `stream` | `free` | `free` | `free` | `free` | `free` | `free` | `evidence` | `evidence` | `free` |
| `academy` | `free` | `free` | **`locked_off`** | `free` | `free` | `free` | **`sight`** | **`sight`** | `free` |
| `onramp` | `free` | `free` | **`locked_off`** | `free` | `free` | `free` | **`sight`** | **`sight`** | `free` |
| `campaign` | `free` | `free` | `free` | `free` | `free` | `free` | `evidence` | `evidence` | `free` |

**Every cell is derived, and here is the derivation** — one rule, applied to the shipped
`moduleCeiling` (`presets.ts:41-50`), so the two ceilings can never drift apart by hand:

> A context's clamp on field `F` is **the highest value of `F` that some module in that
> context's `moduleCeiling` can drive**, floored at the rules floor. If no admitted module
> drives `F`, the clamp is `F`'s floor.

The field-to-module bindings the rule reads, each grounded in a shipped consumer:

| field | driven by | shipped consumer |
|---|---|---|
| `markers` | any module that renders without a learner request at post-commit or review — `postcommit_nudge`, `structure_nudge`, `review_map` | `DrillScreen.svelte:384` (`projectedPivotal` ← `liveMarkers`) |
| `guided` | `structure_nudge` (the named-shape module, `answerCeiling: pattern`) | `DrillScreen.svelte:282,1140` (shape firings) |
| `humanSplit` | `full_inspector` — the raw human-model split is inspector content, [[D619]]'s *"explicit analysis inspector for raw evidence/providers"* | `DrillScreen.svelte:851-854,1148` |
| `corpus` | `theory_breadcrumb` (accepts `human.explorer.population@1`, `learner-modules.md` §4.7) or `full_inspector` | `DrillScreen.svelte:855-857` |
| `voice` | **provider-channel field, not module-driven** (see the split below) — clamped `free` wherever the ceiling admits any content-bearing module, and to its floor where it admits none | `DrillScreen.svelte:1167` |
| `spoken` | **provider-channel field, not module-driven** — same rule; clamping it where content exists would be an accessibility clamp with no honesty gain | `DrillScreen.svelte:432-442` |
| `boardLighting` | `legal` from `rules_floor` always; `sight` from any module with `maxMarks > 0`; `evidence` from `full_inspector` | `DrillScreen.svelte:380,978` |
| `arrows` | `sight` from any module with `maxArrows > 0`; `evidence` from `full_inspector` | `learner-modules.md` §4 arrow budgets |
| `ambient` | any module with `on_request` initiative — the ambient control is the *opener* for the request channel | `DrillScreen.svelte:845` |

Working the rule against the eight shipped ceilings gives exactly the table above:

- `position`, `pack`, `imported`, `stream`, `campaign` admit `full_inspector`, so both lit-board
  fields reach `evidence` and `humanSplit`/`corpus` are `free`. (`blunder_prevention` is excluded
  from every ceiling except `position`'s, and that exclusion drives **no** config field — it is a
  `board_adjacent` sentence with `maxMarks: 1`, `maxArrows: 0`, already covered by `sight`. Which
  is the honest reading of the Support ceiling: it is a *module* restriction, and the nine legacy
  fields cannot express it. The `allowedPresets` refusal is what enforces it, not the clamp.)
- `academy` and `onramp` exclude `full_inspector`, so `humanSplit` locks off and both lit-board
  fields stop at `sight`. `onramp` additionally excludes `review_map`, which changes no field
  (`markers` still has `postcommit_nudge`/`structure_nudge`; `arrows` still has
  `threat_radar`/`compare_coach`).
- `match` admits `rules_floor` alone. `rules_floor` declares `maxArrows: 0`, no marks and
  `evidence: none` (`learner-modules.md` §4.1), so every field falls to its floor and
  `boardLighting` is `"legal"` exactly — which is the sentence §3 already carried and this
  table now *derives* rather than asserts. `voice` and `spoken` fall too, and only here: a
  context that admits no content-bearing module has nothing to revoice and nothing to speak,
  so their `locked_off` costs no accessibility and keeps `design/03:93-98`'s byte-identical
  disclosure whole.

**The nine fields split two ways, and the split is what makes the rule total.** Seven of them —
`markers`, `guided`, `humanSplit`, `corpus`, `boardLighting`, `arrows`, `ambient` — are
**admission and affordance** fields: each one decides whether a class of content may reach the
learner, so each is driven by the modules that produce that class. The other two — `voice` and
`spoken` — are **provider channels**: they choose *how* already-admitted content is rendered
(an LLM revoicing, a speech synthesizer) and admit nothing on their own. [[D619]] is explicit
that presets *"do not ask a nontechnical player to toggle Stockfish/Maia/classifier sources"*,
so the two provider fields are **outside the module-driven derivation entirely**: no preset
moves them (§4a pins both at their floor in all five) and no context clamps them except where
the ceiling admits no content at all. Stating the split is what stops the derivation rule
quietly meaning two different things in two tables.

**`permittedAssistance` is the pointwise minimum of the two ∩ terms, and that is how the unread
field starts being read.** The shipped body becomes the *access* term only, and the exported
function composes:

```ts
export function accessPermission(context: AssistanceContext): ConfigClamp;   // the HEAD body, renamed
export function contextClamp(id: WorkflowContextId): ConfigClamp;            // §3.2's table, from presets.ts
export function permittedAssistance(context: AssistanceContext): ConfigClamp {
  return pointwiseMin(accessPermission(context), contextClamp(context.workflowContext));
}
```

`permittedAssistance` keeps its shipped name, signature and return type, so **every existing
call site is correct without edit** (`DrillScreen.svelte:380,851,855,1060-1061,1148`) and gains
the context ceiling for free. `pointwiseMin` is per-field under the domain order in the first
table of this section, with `boardLighting`'s `["legal", T]` range semantics applied after the
minimum so the floor cannot be minimised away. Criterion 5's non-vacuity is now *computable*
rather than hoped for: against the HEAD body under a permissive access (`solo`,
`deliveryOpen: true`, not seated), the composed function differs for `match` (nine fields),
`academy` (three fields) and `onramp` (three fields), and agrees for the other five — which is
correct, because those five carry the full ceiling.

**`AssistanceContext.sessionKind` is removed at this landing.** With `workflowContext` read,
`sessionKind` is the last declared-and-unread field and it is strictly derivable
(`deriveWorkflowContext`); keeping it is the [[D523]] two-sources-one-value shape that compiler
rule 0 exists to refuse. Closing D307(a) means the struct has **zero** unread fields, not one.

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
proactive"* — [[D906]], `learner-modules.md:906`). `postcommit_nudge` stays out of `analysis`
exactly as in R3 — not a delta, restated because `guided` gained a post-commit module and
`analysis` deliberately did not (the inspector surface subsumes it). The union of all preset module lists must equal the
11 registered ids exactly — every module reachable through some preset or the explicit
surfaces, none dangling (criterion 6).

### §4a. The config projection — the literal nine fields for all five presets

**Added 2026-08-24 ([[D971]]).** Compiler rule 4 says the compiled config *"starts from the
preset's config projection"*. This section is that projection. `PresetDeclaration` gains one
field, and the shipped file already has the other four:

```ts
export interface PresetDeclaration {
  readonly id: PresetId;
  readonly label: string;
  readonly promise: string;
  readonly modules: readonly ModuleId[];
  readonly config: Omit<AssistanceConfig, "version">;   // NEW — §4a; version is stamped 4 by the compiler
  readonly validation: "candidate";
}
```

`version` is deliberately **not** in the projection. A preset does not choose a schema version;
the compiler stamps `version: 4` on its output (§5), so a preset row cannot express a migration
and `assertPresetFoundation` has one fewer thing to police.

**The table.** Rows in `PRESET_IDS` order (`presets.ts:10-12`); every cell is a literal member
of the shipped `AssistanceConfig` union (`assistance.ts:4-15`):

| preset | `markers` | `guided` | `humanSplit` | `corpus` | `voice` | `spoken` | `boardLighting` | `arrows` | `ambient` |
|---|---|---|---|---|---|---|---|---|---|
| `quiet` | `off` | `off` | `off` | `off` | `authored` | `off` | `legal` | `off` | `off` |
| `guided` | `live` | `live` | `off` | `off` | `authored` | `off` | `sight` | `sight` | `on` |
| `theory_only` | `off` | `off` | `off` | `off` | `authored` | `off` | `legal` | `off` | `on` |
| `support` | `live` | `off` | `off` | `off` | `authored` | `off` | `sight` | `sight` | `on` |
| `analysis` | `live` | `off` | `on_request` | `on_request` | `authored` | `off` | `evidence` | `evidence` | `on` |

`quiet`'s row is `SILENT_ASSISTANCE` minus `version` (`assistance.ts:17-19`), byte-for-byte.
That is not a coincidence and it is the check worth keeping: the silence default (`design/05`
§3a) and the Quiet preset must be the same nine values or one of them is wrong.

**Every cell is derived by the same rule as §3.2's clamp**, applied to the preset's own module
list instead of the context's ceiling:

> A preset's projection of field `F` is **the highest value of `F` that some module in
> `preset.modules` drives**, floored at the rules floor. If no module in the preset drives `F`,
> the projection is `F`'s floor. The rule ranges over the **seven module-driven fields** only;
> the two provider channels `voice` and `spoken` sit outside it by [[D619]] (§3.2's split) and
> are pinned at their floor in every preset.

Field by field, with the modules that force each non-floor value:

- **`markers`** — `live` wherever the preset admits a module that renders *without* a learner
  request after the commit: `postcommit_nudge` (post_commit, proactive) in `guided` and
  `support`, `structure_nudge` (post_commit, proactive) in `guided`, `review_map` (review,
  automatic) in `analysis`. `quiet` and `theory_only` admit no such module — `theory_breadcrumb`
  is `on_request` — so both stay `off`, which is §3a's silence default holding by derivation
  rather than by assertion.
- **`guided`** — `live` only in the `guided` preset, the only one carrying `structure_nudge`.
  **This is a derived consequence worth naming rather than discovering in a fixture:
  `analysis` projects `guided: "off"`.** Analyze does not carry `structure_nudge` (§4's module
  table, unchanged), and named-pattern guidance is a *guidance* channel, not an evidence
  channel; Analyze's width is `full_inspector`, not more nudging. A learner who wants both sets
  `guided: "live"` by hand and rule 4's stored-value supremacy keeps it.
- **`humanSplit`, `corpus`** — `on_request` only in `analysis`. Both switches open the **raw
  evidence inspector** (`DrillScreen.svelte:851-857`), which is [[D619]]'s *"explicit analysis
  inspector for raw evidence/providers"* and nothing else's. `theory_only` carries
  `theory_breadcrumb`, which does consume `human.explorer.population@1` — but it renders it as
  one cited pointer under a 1-fact/60-word cap (`learner-modules.md` §4.7), which is the
  module's own rendering and not the raw-counts switch. The two layers meet only in the
  compiler (§5); a module's source access is never a config field.
- **`voice`** — `authored` in **all five**. Persona voice selects an LLM provider, and D619's
  governing sentence is that presets *"do not ask a nontechnical player to toggle
  Stockfish/Maia/classifier sources"*. A provider is not an amount of help, so no preset moves
  it; a learner who has turned it on keeps it through rule 4 in every preset.
- **`spoken`** — `off` in all five, for the same reason plus one more: `spoken` is an output
  channel over content already admitted by the other eight fields, and a preset that silently
  started speaking would be the surprise §7's footer exists to prevent. Stored value survives.
- **`boardLighting`** — `legal` floor always. `sight` where a preset admits a module with
  `maxMarks > 0` (`sight_on_request` 6, `structure_nudge` 4, `threat_radar` 4, `postcommit_nudge`
  2, `compare_coach` 2, `guided_hint` 1 — `learner-modules.md` §4). `evidence` only in
  `analysis`, via `full_inspector`. `theory_only`'s modules declare `maxMarks: 0`/`—`, so it
  stays at `legal` — which is exactly its promise (*"no evaluation, no candidates, no line"*)
  arriving as a value rather than as copy.
- **`arrows`** — `off` where every admitted module declares `maxArrows: 0` (`quiet`:
  `rules_floor` 0; `theory_only`: + `theory_breadcrumb` 0). `sight` where some module declares
  arrows (`guided`, `support`). `evidence` in `analysis` (`full_inspector` 8, `review_map` 2).
- **`ambient`** — `on` wherever the preset admits at least one `on_request` module, because the
  ambient control *is* the opener for the request channel (`DrillScreen.svelte:845`). `quiet`
  admits only `rules_floor`, whose initiative is `ambient` and whose seat is `board_input`:
  there is nothing to open, so an opener would be an affordance that opens an empty region.
  Quiet's *"unless you ask"* is asked through the preset pill (§7), not through an empty drawer.

**Where a projection meets a clamp, the clamp wins — always, and by construction.** The `∩`
algebra is settled (`design/05:230-232`, *"every term only narrows"*); a preset can never raise
a ceiling. Two worked instances, because they are the ones an implementer will hit first:
`analysis` in `academy` cannot arise at all (`academy.allowedPresets` excludes it — a typed
refusal, rule 1), and `quiet` in `match` compiles `boardLighting: "legal"` from both terms
independently, which is the permanent [[D493]] fixture.

### §5. The compiler

The earlier monolithic function is deleted by the third author repair. Compilation is pure within
each of the four typed stages named above; I/O occurs only at the server/provider boundary between
authoritative compilation and finalization:

```ts
export function compileAssistanceRequest(input: LocalPreferenceInput): RequestedAssistanceV1;
export function compileAuthoritativeAssistance(
  request: RequestedAssistanceV1,
  authority: ServerAssistanceAuthority,
): AuthoritativeAssistanceV1;
export function finalizeAssistanceEffects(
  result: AuthoritativeAssistanceV1,
  sources: SealedModuleSourceReceipts,
): FinalizedAssistanceV1;
export function narrowBrowserChannels(
  result: FinalizedAssistanceV1,
  browser: BrowserChannelReceiptV1,
): BrowserNarrowedAssistanceV1;

export type SuppressionRecord =
  | { readonly kind: "module"; readonly moduleId: ModuleId;
      readonly requested: true; readonly effective: false;
      readonly by: "context_ceiling" | "access" | "stored_choice";
      readonly reason: SuppressionReason }
  | { readonly kind: "field"; readonly field: AssistancePreferenceField;
      readonly requested: AssistancePreferenceFields[AssistancePreferenceField];
      readonly effective: AssistancePreferenceFields[AssistancePreferenceField];
      readonly by: "context_ceiling" | "access" | "stored_choice" | "browser_channel";
      readonly reason: SuppressionReason }
  | { readonly kind: "effect"; readonly effectId: CompiledAssistanceEffectId;
      readonly moduleId: ModuleId; readonly requested: "enabled"; readonly effective: "disabled";
      readonly by: "source_availability"; readonly reason: SuppressionReason;
      readonly failedAlternatives: readonly EffectSourceAlternative[] }
  | { readonly kind: "preference_recovery";
      readonly reason: "malformed" | "storage_unavailable" };

export type SuppressionReason =
  | "context_forbids_module" | "role_forbids_module" | "delivery_closed"
  | "explicitly_disabled" | "context_clamped_field" | "access_clamped_field"
  | "source_pending" | "source_unavailable" | "source_failed"
  | "browser_channel_unavailable" | "invalid_preference_recovered";
```

`SUPPRESSION_RENDERERS` is set-equal to the four `kind` arms and the closed reason union. It
produces footer copy only from the typed requested/effective/module/effect/reason operands; callers
cannot supply prose. Multiple suppressions retain stable compiler order—module registry order,
then field registry order, then effect id—and are never collapsed merely because they share a
subject. An unknown reason, missing requested/effective value or duplicate suppression identity is
a compiler failure, not a generic “some help unavailable” sentence.

Rules, in application order (rule 0 is an input-integrity refusal; rules 1–4 are each an
∩ term — among the ∩ terms, order affects only which `by` a record carries, never
membership):

0. `input.context` must equal `input.access.workflowContext`; the requested preset is derived once
   by `requestedPreset(input.preference, input.context)` and is not a second function argument.
   An explicit or migrated receipt's preset must be allowed by that context; unset/invalid derives
   the context default. A mismatch or forbidden receipt is refused before module, config or effect
   compilation. Two independently supplied preset identities are structurally unrepresentable.
1. `preset.modules ∩ context.moduleCeiling` — a preset not in `allowedPresets` is refused
   before compilation with a typed error; the UI never offers it (criterion 2).
2. `∩ context ∩ access` — **amended 2026-08-24**: the compiler calls `contextClamp(context)`
   and `accessPermission(access)` **separately** (§3.2), takes the pointwise minimum, and
   labels each suppression by whichever term is strictly lower — `"context_ceiling"` when the
   context clamp is lower or the two tie, `"access"` when access is strictly lower. Splitting
   the call is what keeps `SuppressionRecord.by` truthful now that `permittedAssistance`
   composes both; the footer's sentence (§7) is only as honest as this label.
   `reviewing` widens exactly as it does today, nothing else does.
3. `∩ availability` — a module whose declared sources are absent stays **in** `modules` and
   renders its declared `emptyBehavior` (`silent | stated_absence | unavailable_source`);
   availability suppresses config fields (`spoken: "provider"` with `tts: "none"` →
   `"browser"` or `"off"`), never honesty states. Absence is stated, never simulated
   (invariant 5).
4. `∩ preference` — the controlling 2026-08-30 rule supersedes the old “both directions”
   sentence. A named preset is literal. An explicit value below its projection may narrow it;
   an equal value changes nothing. Any higher raw value is still configurable, but compilation
   becomes `displayMode: "custom"` and the ordinary pill/footer says **Custom**, never the named
   preset's promise. Selecting a named preset deletes higher overrides for that context while
   preserving explicit lower/off overrides. Thus selecting Quiet is actually Quiet, an explicit
   off is never re-enabled, and Advanced can still express every member of all nine domains.
   `migrated_snapshot` always displays Custom because field-level intent cannot be recovered.
   Advanced additionally stores a sparse, explicit `moduleOverrides: {include, exclude}` pair.
   Includes enter the requested module set before context/access ceilings; excludes always narrow.
   This is the complete Custom escape hatch and is the only way to request a module absent from a
   named preset. Raw field overrides never conjure an undeclared module. Thus “Analyze plus named
   guidance” is represented as `include:["structure_nudge","guided_hint"]` together with
   `guided:"live"`, and the ordinary surface says Custom. Context and access still only remove.
   The
   compiled `config` starts from the preset's config projection — **`presetDeclaration(preset).config`,
   the literal nine values in §4a's table** — and is overridden per-field by
   explicit sparse values, except where a `configClamp` term narrows below the requested
   value (a clamp is a ceiling; a stored "off" always survives — with the single ruled
   exception of `boardLighting`, which never compiles below `"legal"`, §3). Applying a preset **never
   writes** `tabiya.assistance.v1.*` (§6) — the parent contract's criterion 10 (silently
   re-enabling a turned-off control is *"the exact shape of a control that cannot be turned
   off"*, `assistance-controls.md:692-696`) holds by construction.

Rules 1–4 produce `modules`, `config` and `effects` in one pass. A module is deliverable only
through an effect surviving all four terms; the legacy config is a projection of those same
effects, not a second authority. The closed adapter is:

| field | exact governed effect |
|---|---|
| `markers` | automatic `post_commit`/`review` delivery of `postcommit_nudge`, `structure_nudge`, `review_map` |
| `guided` | named-pattern delivery of `structure_nudge` and staged `guided_hint` |
| `humanSplit` | `full_inspector`'s `human_split` sub-surface, on request |
| `corpus` | `full_inspector`'s raw-corpus sub-surface, on request; it never suppresses the separately rendered cited `theory_breadcrumb` |
| `voice` | renderer selection (`authored` or `persona`) over an already-admitted rendered item; it admits no module |
| `spoken` | output channel (`off`, browser, provider) over an already-admitted rendered item; it admits no module |
| `boardLighting` | mark/lighting forms on admitted module packets, with `legal` permanently retained by `rules_floor` |
| `arrows` | arrow forms on admitted module packets; the retired raw `assistance.arrows` renderer is not a consumer |
| `ambient` | the ordinary on-request opener/rail affordance; it never grants a module absent from `modules` |

`CompiledAssistanceEffect` is a closed union keyed by
`{moduleId, timing, form, subSurface?, outputChannel?}`. `guided: "off"` removes both governed
guidance effects even while unrelated effects from those modules remain eligible. A module absent
from the named preset can enter only through the explicit Custom module include, never as a side
effect of a higher legacy field. Import-time set
equality covers every config field and every module capability. These two negative directions are
criteria 18–19, closing [[D1661]].

#### §5.3 Preference and availability receipts — controlling 2026-08-30 repair

The loader returns state, not a guessed config:

```ts
export const ASSISTANCE_PREFERENCE_FIELDS = Object.freeze([
  "markers", "guided", "humanSplit", "corpus", "voice", "spoken",
  "boardLighting", "arrows", "ambient",
] as const satisfies readonly (keyof Omit<AssistanceConfig, "version">)[]);
export type AssistancePreferenceField = (typeof ASSISTANCE_PREFERENCE_FIELDS)[number];
export type AssistancePreferenceFields = Readonly<Pick<
  Omit<AssistanceConfig, "version">, AssistancePreferenceField
>>;

export interface CustomModuleOverrides {
  readonly include: readonly ConfigurableModuleId[];
  readonly exclude: readonly ConfigurableModuleId[];
}
export type ConfigurableModuleId = Exclude<ModuleId, "rules_floor">;

export type WorkflowPreferenceReceipt =
  | { readonly kind: "unset" }
  | { readonly kind: "explicit"; readonly preset: PresetId;
      readonly overrides: Readonly<Partial<AssistancePreferenceFields>>;
      readonly moduleOverrides: CustomModuleOverrides }
  | { readonly kind: "migrated_snapshot"; readonly preset: PresetId;
      readonly config: AssistanceConfig; readonly sourceVersion: 1 | 2 | 3 | 4;
      readonly moduleOverrides: CustomModuleOverrides }
  | { readonly kind: "invalid_fallback"; readonly reason: "malformed" | "storage_unavailable" };

export interface WorkflowPreferenceV2 {
  readonly version: 2;
  readonly assistanceHead: 4;
  readonly intent:
    | { readonly kind: "unset" }
    | { readonly kind: "explicit"; readonly preset: PresetId;
        readonly overrides: Readonly<Partial<AssistancePreferenceFields>>;
        readonly moduleOverrides: CustomModuleOverrides }
    | { readonly kind: "migrated_snapshot"; readonly preset: PresetId;
        readonly config: AssistanceConfig; readonly sourceVersion: 1 | 2 | 3 | 4;
        readonly moduleOverrides: CustomModuleOverrides }
    | { readonly kind: "invalid_fallback"; readonly reason: "malformed" };
}
```

New writes use `tabiya.workflow.v2.${context}` and
`WorkflowPreferenceV2`. `parseWorkflowPreferenceV2` accepts only a non-null, non-array plain
object with the exact three top-level keys and an exact discriminated intent arm; exact
preset/module ids; `include` and `exclude`
disjoint and duplicate-free; and override keys set-equal to a subset of
`ASSISTANCE_PREFERENCE_FIELDS`, with each value parsed by the registered assistance-head codec.
Unknown keys, invalid values, `null`, arrays, wrong `version`/`assistanceHead`, duplicate module
authority and a head field absent from `ASSISTANCE_PREFERENCE_FIELDS` all fail closed. The field
registry is set-equal to `keyof Omit<AssistanceConfig,"version">`; adding a v5 field without an
explicit v2 migration decision makes the import-time assertion and author fixture fail. Serializer
output is canonical field order and strict-parser round-trips byte-for-byte.

The `Partial` is legal only here: it means “no explicit choice”,
not “missing compiler output”. Migration is total and one-way:

- no v1 workflow key and no assistance key → `unset`, then the context default;
- valid v1 workflow key with no assistance snapshot → `explicit` with no overrides;
- any valid `tabiya.assistance.v1.*` v1–v4 full snapshot → `migrated_snapshot` after the shipped
  value migration, preserving bytes and displaying Custom;
- malformed data → `invalid_fallback`, the context default plus a visible suppression/recovery
  reason; it never masquerades as an explicit choice.

On the first successful load, migration writes the canonical v2 value **with the same intent arm**
before returning it. `unset` remains `{kind:"unset"}` and a migrated snapshot retains its source
version and full config. A valid v2 value always wins; an invalid
v2 value yields visible `invalid_fallback` and never resurrects legacy bytes. After that seal,
legacy keys are ignored. `loadAssistance`, `saveAssistance`, `loadWorkflowPreset` and
`saveWorkflowPreset` lose every production caller; the two old `setItem` paths are deleted, and a
source census fails any write to either v1 namespace. Settings and DrillScreen both call the v2
writer. A storage event from a stale tab attempting a legacy write cannot change the in-memory v2
receipt and triggers no recompile; reload still reads v2 first. `PROFILE_DEFAULTS` is deleted at
the same checkpoint. This closes [[D1659]] and [[D2133]] with one authority rather than precedence
prose.

Availability is split by authority. The browser may report only output-channel readiness; the
server owns chess-evidence source state and never trusts provider facts from the client:

```ts
type AvailabilityState =
  | { readonly state: "pending" }
  | { readonly state: "available" }
  | { readonly state: "unavailable"; readonly reason: string }
  | { readonly state: "failed"; readonly reason: string };
type BrowserChannelAvailability = Readonly<Record<"browser_speech", AvailabilityState>>;
type ServerEvidenceAvailabilityReceipt = Readonly<Record<
  "llm" | "tts" | "stockfish" | "syzygy" | "maia" | "explorer",
  AvailabilityState
>>;
```

The mapping is total: `voice: persona` falls back to authored when LLM is unavailable;
`spoken: provider` falls back to browser only when browser speech is available, otherwise off;
`spoken: browser` falls to off when browser speech is unavailable. Pending never changes the
selected preference and never upgrades disclosure. Evidence-bearing modules remain admitted and
render their registered family-specific honest-empty state.

`effectSourceDependencies` is derived only after module-registration's 205 bindings are registered
and all 117 evidence requirements resolve through sealed upstream operations. The current
requirements-only artifacts fail with `MODULE_AUTHORITY_NOT_ACCEPTED`; they are not a graph the
preset compiler may execute. Once accepted, each effect carries OR alternatives of AND projection inputs, reduced to
their producer/source-family identities. There is no hand-written module→provider table. Module
assembly returns `available | no_witness | pending | unavailable | failed` per demanded family;
`no_witness` completes the effect as honest empty, while pending/unavailable/failed disables only
the effect whose every alternative failed. A mixed Inspector can therefore retain local-rule facts
beside `Stockfish unavailable`, and one unavailable alternative never suppresses an effect whose
other alternative is available. Every removal emits the typed effect suppression above. This
closes [[D1662]]/[[D2132]] without inventing a second evidence authority.

The compiled `config` stays **version 4**. The module axis does not live in the nine fields
and does not need to: `modules` drives the Phase-3 module runtime, `config` drives the shipped
screen switches; the two layers meet only in the compiler. No preset state is inexpressible —
derivation gap 7's answer is that the question dissolved when modules stopped being config
fields.

A preset **filters modules and never touches eligibility** — *"the preset algebra filters
modules, module eligibility filters events"* (`assistance-surface-taxonomy.md:521`, the D660
bar as carried by `learner-modules.md:267-284`). The compiler's inputs contain no event,
evidence-packet, or eligibility type; its signature is the enforcement (criterion 6).

#### §5.1 What compiles what, and where it lives — closing [[D985]]

**Added 2026-08-24.** `compileAssistance` is cited by `rfc/theming.md:383`,
`rfc/review-map.md:384` and `planning/theming/rfc-derivation.md:275` and exists in **zero lines
of code**: at HEAD the only occurrence in the tree is this RFC's own §5 code block. That is the
moved/absent-target class, and it happened because §5 declared a signature without ever naming
a file, an export surface or a caller. Named now, so a future citation resolves:

| symbol | file | exported by | called by |
|---|---|---|---|
| `compileAssistanceRequest` | `packages/runtime/src/presets.ts` | runtime barrel | web client; parses local preference and browser-channel intent into the canonical untrusted request |
| `compileAuthoritativeAssistance` | `packages/runtime/src/presets.ts` | runtime barrel | server module-query boundary; re-derives context, access, source and module authority |
| `finalizeAssistanceEffects` | `packages/runtime/src/presets.ts` | runtime barrel | server after module assembly; joins exact source receipts to derived effect dependencies |
| `narrowBrowserChannels` | `packages/runtime/src/presets.ts` | runtime barrel | web client; may only remove browser-local speech output from the server result |
| `contextClamp` | `packages/runtime/src/presets.ts` — beside `WORKFLOW_CONTEXT_POLICIES`, whose `configClamp` field it reads | runtime barrel | `permittedAssistance`; `compileAuthoritativeAssistance` rule 2 |
| `accessPermission` | `packages/runtime/src/assistance.ts` — the HEAD `permittedAssistance` body, renamed | runtime barrel | `permittedAssistance`; `compileAuthoritativeAssistance` rule 2 |
| `permittedAssistance` | `packages/runtime/src/assistance.ts` — becomes the pointwise minimum (§3.2) | runtime barrel (unchanged) | every shipped call site, unedited |
| `PRESET_DECLARATIONS[].config` | `packages/runtime/src/presets.ts:31-38` — the new §4a field on the shipped rows | already exported | `compileAuthoritativeAssistance` rule 4 |

**One algebra, four authority stages.** The browser strict-parses v2/local migration state and
builds `RequestedAssistanceV1 {stage, schemaVersion, contextHint, preference,
requestDigest}`. It sends that receipt as untrusted intent; it never sends effective modules,
permissions, provider availability or browser readiness. The server strict-parses it, derives authoritative context
from the run/campaign origin, derives access from the authenticated role and run boundary, reads
server provider state, and compiles requested modules/config/effects. It returns
`requestedDigest`, `effectiveDigest`, typed suppressions and source demands. After assembly,
`finalizeAssistanceEffects` applies the exact dependency alternatives and seals a final digest.
The browser then calls `narrowBrowserChannels`, which can only remove `spoken` output based on
browser speech readiness and emits a `browser_channel` suppression; any attempted module/config or
chess-evidence widening fails. Digest fixtures cross forged widening, stale client availability,
context disagreement and a server response altered before browser narrowing.

#### §5.2 The one seat, and the two orphaned functions — [[D971]]'s live half

`apps/web/src/lib/assistance-preference.ts:20-39` ships `loadWorkflowPreset` and
`saveWorkflowPreset` against the `tabiya.workflow.v1.*` grammar §6 specifies, complete with the
`allowedPresets` validation and the fall-to-default posture. **Nothing calls either one outside
`assistance-preference.test.ts`.** The storage half of §6 landed and the reading half did not,
which is why the owner can open the app and find no presets: the value exists and nothing asks
for it.

The seat is `DrillScreen.svelte`, which already owns every consumer of the nine fields and
already derives the context three times over — `assistanceProfile({ sessionKind,
feedbackPolicy, liveKind })` at `:378` (into `assistanceContext.workflowContext`), `:396` (the
save path) and `:766` (the load path), with `permittedAssistance(assistanceContext)` at `:379`.
The context is therefore already in hand at the seat; the preset is not. It becomes:

```ts
// Seven-context phase. Campaign is not admitted through this run-origin branch.
const origin = { kind: "run", sessionKind, feedbackPolicy, liveKind } as const;
const context = deriveWorkflowContext(origin);
const preference = loadWorkflowPreference(context, storage());
const requested = compileAssistanceRequest({ contextHint: context, preference });
const authoritative = serverModuleQuery(requested);
const finalized = finalizeAssistanceEffects(authoritative, sealedSourceReceipts);
const compiled = narrowBrowserChannels(finalized, currentBrowserChannelReceipt());
```

The later Campaign branch is added only by the accepted `campaign-core` implementation, importing
its exact encounter receipt, issuer and verifier. This RFC neither declares nor guesses that type.
Until then, any attempt to derive `campaign` from a run origin, query parameter or client object
returns `CONTEXT_DECLARED_AWAITING` at the server boundary.

`compiled.config` replaces the `assistance` object the nine switches read; `compiled.modules`
and `compiled.suppressed` are what §7's pill and footer render. Choosing a preset calls
`saveWorkflowPreference(context, {version: 2, assistanceHead: 4, intent: {kind:"explicit",
preset: next, overrides: retainedLowerOverrides, moduleOverrides:{include:[],exclude:[]}}})` and
re-derives. Selecting a named preset clears both module-delta arrays; preserving them requires the
separate Advanced action. Advanced edits write sparse v2 field
overrides plus explicit module includes/excludes; either a higher field or any module delta changes
the visible mode to Custom. The v1 workflow and assistance keys are migration inputs, not
parallel writers. The old loaders become private migration helpers or are deleted; neither remains
a non-test ordinary-path authority.

The three repeated `assistanceProfile({...})` calls collapse into the single `context`
`$derived` above at the same edit — three copies of one derivation is the [[D523]] shape, and
the compiler's rule 0 equality check would otherwise be comparing a value against itself.

### §6. Persistence — where the choice lives

`design/05:224-225`: *"Workflow identity and the requested preset are stored separately from
technical source preferences."* Concretely (the v2 receipt in §5.3 supersedes the original v1
write contract while retaining it as a read-only migration source):

- New authoritative key grammar **beside, never inside run state**:
  `` `tabiya.workflow.v2.${contextId}` `` storing
  `{ version: 2, assistanceHead: 4, preset: PresetId,
  overrides: Partial<AssistancePreferenceFields>, moduleOverrides: {include,exclude} }`, through
  the same `PreferenceStorage` seam. The old `tabiya.workflow.v1.*` and
  `tabiya.assistance.v1.*` keys are read-only migration sources under §5.3's total rules.
- **Client-side only, claims nothing versioned.** Precedent: assistance preferences persist in
  localStorage with the version inside the value; `learner-modules` stored no preference and
  claimed none. Server-side per-learner workflow storage is a real future (the longitudinal
  personalization era will want it) and is **deferred by Discharge D2** — the future RFC
  claims its migration position then; nothing here forecloses it.
- **A mid-run preset change is not a run event, and here is the argument rather than the
  omission** (derivation gap 5): raising a preset changes what may be *offered*; nothing
  renders without a disclosure receipt. Post-commit/checkpoint/review receipts are durable. The
  coordinated module-registration amendment's pre/at-commit Support receipt is deliberately
  ephemeral and exact because persisting a staged move would turn run history into a live-help
  feed. The reopen condition
  is named and tested: **if any module rendering path delivers content without the receipt its
  timing class requires, this decision is void** and the successor claims run lane 0.19 with a
  `preset.changed` event (criterion 9 is the guard — changing preset mid-run with no learner
  request must produce zero new rendered items). Run lane 0.19 is explicitly **not claimed**.

### §7. Surfaces, and the owner-use validation gate

- **The preset pill** (`play-composition.md:159-160` reserved the slot; semantics now chosen):
  it shows the active preset's label and opens the per-context preset menu — only
  `allowedPresets` entries are offered; composition state 7 covers the open menu. When rule 4
  admits a higher Advanced override or a migrated full snapshot, it says **Custom** and links to
  Advanced. It never displays a named promise over wider effective assistance.
- **The standing disclosure footer** (`play-composition.md:169-170` reserved the seat): one
  sentence rendering the compiled truth — the preset's promise when nothing is suppressed,
  and the suppression stated when it is (*"Support isn't available in a match"* — rendered
  from `SuppressionRecord`, which is what the record type exists for). Invariant 5 applied to
  configuration itself.
- **Settings** keeps the per-context grid, which already ships all **eight** contexts with
  labels (`AssistanceSettings.svelte:19`, including `campaign: "Campaign"`); raw switches remain
  the Advanced surface per design/05 — the pill is the ordinary view. (The drafted *"gains the
  seventh context"* was already stale at this amendment; the grid gained both.)
- **The validation gate** (the [[D906]](3) budgets→backstops shape; R3's exit is owner use,
  `design/research/evidence-presentation.md:5`; [[D649]]: validation is the owner's own use):
  every entry in the preset table and the context table carries `validation: "candidate"`.
  A candidate is confirmed, renamed, or re-tabled by an owner ruling logged in
  `planning/exploration/log.md` after real sessions; the lint in criterion 8 fails any entry
  that drops the marker without a ruling citation. Acceptance of this RFC does **not** freeze
  the names — it freezes the algebra, the types, and the ceilings' ruled floors (§9).

#### §7.1 What the preset UI can now be built from — and what this amendment does NOT decide

**Added 2026-08-24 ([[D971]]).** This amendment pins values, not pixels. The pill and the footer
belong to the client surface (`play-composition` Discharge D1; the theming lane owns their
appearance), and nothing below chooses a layout, a control shape, a colour, a viewport
breakpoint or a copy voice. What it does do is remove every "we cannot render this because the
value does not exist" blocker. Enumerated, so the surface author can check the list rather than
re-derive it:

| the surface needs | it reads | now pinned at |
|---|---|---|
| which presets to offer in this context | `workflowContextPolicy(context).allowedPresets` | shipped, `presets.ts:41-50` |
| which one is active on entry | `loadWorkflowPreference(context, storage)` + `requestedPreset` | §5.3's typed v2/migration receipt; §5.2 gives it its caller |
| the pill's text | `presetDeclaration(preset).label` | shipped, `presets.ts:31-38` |
| the footer's text when nothing is suppressed | `presetDeclaration(preset).promise` | shipped, `presets.ts:31-38` |
| the footer's text when something is suppressed | `compiled.suppressed` — one `{subject, by}` per removal | §5 rule 2's `by` labelling, amended above |
| what the board, rail and inspector actually render | `compiled.config`, nine fields | **§4a's projection table ∩ §3.2's clamp table** — the two things that did not exist |
| whether an option must be absent rather than disabled | `allowedPresets` membership, enforced by the rule-1 typed refusal | criterion 2, one browser fixture per context |
| whether the learner's own switch survives a preset change | rule 4: lower/off survives; higher remains configurable as visibly Custom | criteria 4, 17–19 |

**Still not decided here, with its owner named:** the pill's and footer's visual form, seating
and motion (`rfc/play-composition.md` Discharge D1 → the Phase-4 composition work, plus
`rfc/theming.md`); the *wording* of labels and promises, which ship as `validation: "candidate"`
and are the owner's to reshape in play (Discharge D1 of this RFC); and the hint-distance rung
control, which is not a field of v4 at all (§9a).

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

**Resolved 2026-08-24: wiring landed first, and both sources now exist.** `PROFILE_DEFAULTS`
ships (`assistance-preference.ts:6-15`) alongside `WORKFLOW_CONTEXT_POLICIES`
(`presets.ts:41-50`), so the "exactly once" this section promised is currently *twice*.
Criterion 10, amended, resolves it by deletion rather than by agreement: §4a derives the
`onramp` value, so the constant has nothing left to own.

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
| Proactive blunder prevention only inside an explicit Support preset; never the rehearsal default | `design/05:233-235` (O4) |
| `blunder_prevention` timing `at_commit`, Support only | `learner-modules.md:303` |
| Threat radar pre-commit: Support only, on-request, never proactive | [[D906]], `learner-modules.md:906` |
| Avoidance/negative readings face learners post-commit/review only, always with the denominator | [[D745]](2) (cross-review dropped the stray [[D718]] — the ledger's own correction note pins D718 as the earlier layout-trace row; the negative-reading ruling is D745's) |
| The rules floor is not assistance and appears in every compiled output | [[D493]]; `learner-modules.md:322-329` |
| A preset filters modules, never eligibility | [[D660]]; `assistance-surface-taxonomy.md:521` |
| Explicit lower/off choices survive named presets; higher raw choices are visibly Custom | owner ruling 2026-08-30 ([[D1660]]), preserving `assistance-controls.md:692-696`'s off guarantee |
| A ceiling is *"a ceiling on what may be *offered*, never a floor on what is *shown*"* | D532 ruling, `design/BACKLOG.md:532` |
| Match: byte-identical disclosure for both players | `design/03:93-98` |
| Relayed marks are attribution-governed, not rung-governed | `design/05:199` |

#### §9a. The projection is nine fields, and a tenth is not assumed

**Added 2026-08-24.** `AssistanceConfig` ships `version: 4` with **nine** fields
(`assistance.ts:4-15`). `rfc/hint-distance.md` proposes a tenth, `hintDistance`, taking
`AssistanceConfig` to v5 and *"`configClamp` retyped per field in one line"* — and that RFC was
**returned to research** (`planning/rfc-drafting-queue.md:1250`, `85a0584`). §4a and §3.2 are
therefore written over nine fields exactly, with no reserved slot and no forward-compatible
shim: a field that does not exist cannot be projected, and inventing its values here would be
the same defect [[D971]] records, one version later.

The seam, so the successor does not have to guess: when `hintDistance` lands, it takes **one new
column in §4a's table and one in §3.2's**, both derived by the rules already stated there
(`guided_hint`'s staged ceiling drives the projection; a context's `moduleCeiling` membership of
`guided_hint` drives the clamp). `rfc/enforced-clocks.md` criterion 13 clamps that column per
context under [[D1290]] — *"a ceiling term per context, not a global clamp"* — which is exactly
a `configClamp` cell and needs nothing new from this document. Until then, criterion 13 is
honestly red ([[D1295]]) and this RFC claims nothing about it.

## Deviations from design

None. The algebra is quoted verbatim from `design/05:230-232`; the plan row's
`preset ∩ ceiling ∩ role ∩ availability` phrasing is treated as the paraphrase it is
(role ⊂ honesty/access), which is conformance, not deviation. The one vocabulary design does
not contain — the seventh context `academy` — extends `ASSISTANCE_PROFILES`, which is code,
not design tier; design/03's Academy surface is its anchor. **Amended 2026-08-24:** the same
sentence now covers the eighth, `campaign`, whose anchor is `design/06-campaign.md` by way of
`rfc/campaign-core.md` §5. §4a's projections and §3.2's clamps are values chosen under
`design/05:230-232`'s narrowing algebra, not extensions of it — no term is widened, and no
preset row can widen one by construction (§4a's closing paragraph). Still none.

## Acceptance criteria

> **Amendment rows landed 2026-08-24.** [[D1435]] discharges [[D971]] — both tables are written and the preset surface is buildable. [[D1436]] — `AssistancePermission` has four members and the `match` clamp needs a fifth, so the strictest ceiling is inexpressible; `permittedAssistance` reads neither of the two fields clamping is for. [[D1437]] — the `campaign` context is unreachable. [[D1438]] — the import-time assertion cannot see either new vocabulary, and the grid arithmetic predated the eighth context. [[D1439]] — the derivation reproduced the one hand-written default.

Unit note **(amended 2026-08-24, [[D971]] — the drafted 24/11 over seven contexts is struck)**:
criteria 1–3 and 6 quantify over the full preset × context cross product. Per [[D1240]] the grid
is asserted as a **derivation**, never as a hand-count: the admitted set is
`WORKFLOW_CONTEXT_POLICIES.flatMap(c => c.allowedPresets.map(p => [c.id, p]))` and the refused
set is its complement in `WORKFLOW_CONTEXTS × PRESET_IDS`. At HEAD that derivation yields
**5 × 8 = 40 pairs, 28 admitted, 12 refused**, which is byte-identical to the numbers
`assertPresetFoundation` already enforces at import time (`presets.ts:91-94`). The two integers
are **drift tripwires only** — a fixture may not restate them as its own arithmetic.

1. **Pointwise narrowing, exhaustively.** For every admitted pair:
   `compiled.modules ⊆ (preset.modules ∪ explicit include) − explicit exclude` and
   `compiled.modules ⊆ context.moduleCeiling`, and
   for every `AssistanceConfig` field the compiled value ≤ the clamp under the per-field domain
   order pinned in §3.2's first table. Flip-a-constant check: widening any single ceiling entry
   makes exactly the fixtures naming that entry fail.
2. **Refusal is typed and total.** Every refused pair produces the typed refusal, and the
   pill menu for each context offers exactly `allowedPresets` — a browser fixture per context
   asserts the absent options are absent (discharging, strengthened from one fixture to one
   per context, the negative-fixture obligation from `assistance-controls.md:697-701`).
3. **The rules floor is unexpressible-off.** Type level: `AssistancePermission` includes
   `"legal"` and no compiler path emits `boardLighting: "off"`. Test level: every compiled
   output has `boardLighting ∈ {"legal","sight","evidence"}` and `modules ∋ rules_floor`;
   the D493 regression fixture (quiet × each context ⇒ `"legal"` exactly) is permanent.
   **The type-level arm is red at HEAD and must be made green by this landing**:
   `assistance.ts:21` ships four members and the fifth, `"legal"`, does not exist, so the
   §3.2 `match` row is currently inexpressible.
4. **Explicit narrowing survives; widening is visibly Custom.** Fixture A: sparse explicit
   `guided: "off"`, apply Guided ⇒ compiled off and the override remains in the v2 receipt.
   Fixture B: requested `arrows: "sight"` in a context whose clamp is `locked_off` ⇒ compiled
   off with a `{by:"context_ceiling",requested:"sight",effective:"off"}` suppression. Fixture
   C: any value above a named projection yields `displayMode:"custom"`; selecting a named preset
   removes higher overrides and writes only `tabiya.workflow.v2.*`. First load seals a canonical v2
   value; subsequent legacy writes cannot affect either the in-memory receipt or reload.
5. **The context reaches the server, non-vacuously.** `deriveWorkflowContext` is the single
   derivation, imported by both client and server (one symbol, two importers — asserted by
   the census test); the fixture matrix over
   `sessionKind × feedbackPolicy × liveKind ∈ {—, match, stream, academy}` matches on both
   sides; and `permittedAssistance` returns a **different** permission set than the HEAD body
   — **amended 2026-08-24**: for `match`, `academy` and `onramp` under a fixed permissive
   access (`solo`, `deliveryOpen: true`, `seatedInContest: false`, `reviewing: false`), which is
   what §3.2's table actually produces. The drafted `stream` is **struck**: `stream` carries the
   full `configClamp`, so demanding a difference there would have demanded a wrong answer — the
   [[D444]] guard pointed at a cell that must not move. Recorded as before/after pairs, and the
   agreeing five contexts are recorded too, so the criterion measures a change and its boundary.
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
9. **The no-run-event guard.** Two arms. (a) Mid-run preset raise with no subsequent learner
   request renders zero new evidence items (fixture over a live run with `guided` →
   `analysis`). (b) `quiet` → `guided` followed by one committed move — the proactive path,
   which arm (a)'s review-timing modules never exercise (strengthened in cross-review): the
   nudge that renders must trace to its durable disclosure event. Every
   post-commit/checkpoint/review item traces to a durable event; every pre/at-commit Support item
   traces to D5's exact ephemeral receipt and cannot appear in durable run history. This criterion
   is the standing condition of §6's no-lane decision — if it cannot be kept green, the
   decision reopens by its own terms.
10. **On-ramp default has one owner.** At landing, exactly one source defines the on-ramp
    `guided` default (grep-census over `PROFILE_DEFAULTS`/`ContextContract`), whichever
    landing order §8.2 resolved to. **Amended 2026-08-24 — the census has a determinate
    answer now, and it is a deletion.** Both sources exist at HEAD:
    `PROFILE_DEFAULTS.onramp = { ...SILENT_ASSISTANCE, guided: "live" }`
    (`assistance-preference.ts:13`) and `WORKFLOW_CONTEXT_POLICIES` `onramp.defaultPreset =
    "guided"` (`presets.ts:48`). §4a's projection of the `guided` preset is
    `SILENT_ASSISTANCE` with `guided: "live"` **plus** `markers: "live"`, `boardLighting:
    "sight"`, `arrows: "sight"`, `ambient: "on"` — so the wiring RFC's constant is the
    projection's `guided` field and nothing else, i.e. a strict subset that is now derived.
    `PROFILE_DEFAULTS` is therefore **deleted at Checkpoint A** and
    `loadWorkflowPreference` returns `{kind:"unset"}` rather than a complete fallback config,
    with the per-context default arriving through `compileAuthoritativeAssistance`. The criterion passes by
    there being one source and by an unset receipt remaining distinguishable from an explicit
    Quiet request.
11. **Academy stops falling through.** `deriveWorkflowContext({liveKind: "academy", ...})`
    = `"academy"`, with the pre-fix behavior (fall-through to the run's `sessionKind`
    profile) as the named regression the fixture kills. **Shipped** (`presets.ts:107-116`);
    the fixture is the part still owed.
12. **The projection and the clamp are transcribed, not invented.** *(New, [[D971]].)*
    `PRESET_DECLARATIONS[i].config` is deep-equal to §4a's table row for row, and
    `WORKFLOW_CONTEXT_POLICIES[i].configClamp` to §3.2's, asserted over all five and all eight
    with **no `Partial`** — a missing key is a type error, not a default. Both tables are then
    re-derived from the module bindings (§3.2's and §4a's derivation rules) by a second,
    independent assertion, so a hand-edited cell that no module justifies fails even if both
    literal tables agree with each other.
13. **`quiet` is the silence default, byte-for-byte.** *(New, [[D971]].)*
    `presetDeclaration("quiet").config` deep-equals `SILENT_ASSISTANCE` minus `version`
    (`assistance.ts:17-19`). Regression named: if either moves independently, `design/05` §3a's
    silence default and the Quiet preset have quietly forked.
14. **The clamp is read, and the two unread fields are gone.** *(New, [[D971]], closing
    [[D307]](a).)* `permittedAssistance(context)` equals
    `pointwiseMin(accessPermission(context), contextClamp(context.workflowContext))` over the
    full input matrix; `AssistanceContext` declares no field the runtime does not read
    (`sessionKind` removed, §3.2); and a lint asserts that no exported symbol in
    `assistance.ts`/`presets.ts` takes a parameter it never references. Non-vacuity is
    criterion 5's before/after pairs.
15. **The authoritative receipt has callers, and the authority split exists.** A census asserts
    `loadWorkflowPreference` and `saveWorkflowPreference` each have at least one non-test caller,
    while every old v1 reader is private to migration and every old writer has zero production
    definitions/callers. `compileAssistanceRequest`, `compileAuthoritativeAssistance`,
    `finalizeAssistanceEffects` and `narrowBrowserChannels` each have their named client/server
    caller. Forged widening, context disagreement, stale availability and changed response bytes
    fail before rendering. The paired negative control fails when the
    `DrillScreen.svelte` seat (§5.2) is reverted.
16. **The preset UI renders from the compiled values only.** *(New, [[D971]].)* The pill and
    footer read `compiled` and never `PRESET_DECLARATIONS` directly; a fixture in `match`
    asserts the footer states the suppression (`SuppressionRecord{by: "context_ceiling"}`)
    rather than the preset promise, and a fixture in `position` asserts the reverse. This is
    criterion 7's D971 half: it fails if the surface renders a promise the config does not keep.
17. **Preference intent is represented, not guessed.** The actual storage loader plus compiler
    fixtures cover empty storage, missing key, malformed key, valid v1 workflow-only, one v1–v4
    assistance snapshot, explicit lower/off and explicit higher values. Empty Guided equals the
    literal Guided projection; migrated snapshots are Custom; malformed data carries a recovery
    reason. No complete fallback config is accepted as nine explicit choices. The strict v2 parser
    crosses unknown keys, invalid domain values, null/array, version/head mismatch, overlapping or
    duplicate module ids and a future assistance-head field with no migration decision.
18. **Named means literal; Advanced remains complete.** Every named preset plus lower/equal sparse
    override stays named and never exceeds its projection. Every higher override is expressible and
    yields Custom. Analysis→Quiet cannot retain Analysis-only help under a Quiet label, while an
    explicit off remains off. The Advanced editor reaches every member of all nine field domains
    and every module through explicit include/exclude. “Analyze plus named guidance” activates the
    guided effects only through its explicit module includes and remains subject to context/access.
19. **One effect authority.** Set equality covers the adapter's nine fields and every registered
    module capability. For each governed field, lowering/off removes exactly its governed effects;
    unrelated effects survive. For every absent module, all its effects remain absent unless the
    explicit Custom module include requests it; a raw field value alone is never a module grant.
    A fixture fails if either `compiled.modules` or `compiled.config` is mutated after effect
    compilation.
20. **Availability is total and stable.** The cross product of all closed source states with the
    availability-sensitive values has one typed effective result, requested/effective suppression
    and registered honest-empty behavior. Dependencies are derived set-equal from the binding/DAG
    authority, including AND/OR alternatives and same-subject inputs. Pending→available finalizes
    from the same preference, never changes the selected preset; no-witness renders honest empty;
    mixed Inspector families and one-live-alternative retain their independent effects.
21. **Campaign is honestly phased.** Until accepted/implemented `campaign-core` exports its exact
    encounter receipt/issuer/verifier, every Campaign origin returns
    `CONTEXT_DECLARED_AWAITING`; no ordinary run, query parameter or client object derives Campaign.
    The seven-context implementation cannot call itself eight-context complete. Once the dependency
    lands, the criterion expands to real start/resume, issuer, ids, lifecycle, active-pointer/event
    join and ordinary-pack refusal before archival.
22. **Two honest implementation checkpoints.** Checkpoint A may prove compiler, migration,
    Advanced/Custom semantics and compiled pill/footer while this RFC remains implementing.
    Checkpoint B requires at least one real registered module delivery through
    `compiled.modules`, its registered renderer and a disclosure receipt. Criterion 9 must fail at
    zero deliveries; only B may discharge learner-modules/play-composition counterpart rows or
    archive this RFC.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Owner-use validation of every `candidate` entry (names, labels, promises, defaults, allowedPresets, the Support-offering set — **and, from 2026-08-24, the 45 projection cells of §4a and the 72 clamp cells of §3.2**, which are derived from shipped module contracts but are still candidates the owner reshapes in play) — confirmed/renamed/re-tabled by logged rulings after real sessions; until then candidates ship as candidates | OWNER | the log entries recording the rulings; the commit dropping each `candidate` marker cites its ruling | |
| D2 | Server-side per-learner workflow persistence (the personalization era's store) — deferred; localStorage is v1's honest scope. The future RFC claims its own migration position (behind `bot-policy` at HEAD ordering) | `planning/exploration/plan.md` | that RFC's registration | |
| D3 | Register Campaign as an eighth context without inventing encounter behavior here | `planning/exploration/plan.md` | the campaign RFC's registration | discharged 2026-08-22 — `rfc/campaign-core.md` registered the context; this discharge covers vocabulary only, not executable origin authority |
| D4 | **The tenth field.** `hintDistance` gets one column in §4a's projection table and one in §3.2's clamp table, both derived by the rules already written there, plus the v4→v5 migration arm. **Genuinely blocked, blocker named:** `rfc/hint-distance.md` is *returned to research* (`planning/rfc-drafting-queue.md:1250`, `85a0584`), so the field's domain and its ordering do not exist to project. Nothing here reserves a slot or shims one (§9a) | claude — `rfc/hint-distance.md`'s author | that RFC's landing commit, which adds both columns in the same commit per the completion protocol | |
| D5 | **Checkpoint B: the real `compiled.modules` consumer.** Module ids and registered renderers now exist, but the edge is not discharged by registration or by a zero-item fixture. It closes only when a production module operation reads the compiled effects, renders at least one item and records its disclosure receipt. Post-commit/checkpoint/review deliveries use durable receipts. The module-registration amendment's tightly bounded pre/at-commit Support receipts are ephemeral and non-persisted by design; they still carry exact run/node/staged-move/module/form identity and are included in criterion 9's trace, without being mislabeled as run events. Checkpoint A may land config/migration/pill while this row stays open | codex — coordinated `module-registration.md` implementation lane | the non-vacuous production delivery/logging commit | |
| D6 | **Executable Campaign origin.** Import the exact encounter receipt, issuer and verifier from accepted and implemented `campaign-core`; cross start/resume, lifecycle, active-pointer/event join and ordinary-pack refusal. Until then the seven-context phase returns `CONTEXT_DECLARED_AWAITING` and cannot claim eight-context completion | campaign-core.md | the campaign-core implementation commit plus this RFC's expanded criterion 21 | |

**Checkpoint truth.** Checkpoint A closes only the compiler/config/persistence/pill obligations and
leaves this RFC implementing. It does not flip `learner-modules` or `play-composition` counterpart
rows. Only Checkpoint B's non-vacuous real delivery commit writes those SHAs and permits archival.
That commit also closes [[D532]]/[[D715]] if their server ceiling remains green and performs the
ledger/log closeout in the same commit.

## Second fresh-review return routing

| row | required repair before another fresh review |
|---|---|
| [[D2171]] | author-routed: requirements-only module artifacts are refused; freshly accepted/implemented sealed source graph remains a hard dependency |
| [[D2172]] | author-repaired: monolith deleted; requested/authoritative/finalized/browser-narrowed stages carry correlated discriminators and digests |
| [[D2173]] | author-repaired: v2 persists the closed intent union and preserves unset/migrated/invalid identity across repeated reloads |
| [[D2174]] | author-repaired: named selection clears all module deltas and retains safe field narrowings; Advanced is the explicit preserve-customization action |
| [[D2175]] | author-repaired: request carries no browser state; one current digest-bound receipt narrows only after server finalization |
| [[D2176]] | author-repaired: `ConfigurableModuleId` excludes `rules_floor`; storage/wire refuse it and server reinserts the floor |
| [[D2177]] | author-repaired: closed `preference_recovery` arm with fixed non-reflective renderer |
| [[D2178]] | author-routed: three resources named; register/check implementation remains a hard predecessor and no false claim is emitted |

### Prior author-repair routing

| row | author repair; fresh review still required |
|---|---|
| [[D2127]] | closed nine-field/head registry plus strict canonical v2 parser/serializer |
| [[D2128]] | preset derives once from the sealed receipt; no duplicate compiler input |
| [[D2129]] | client request → server compile/finalize → client-only narrowing with sealed digests |
| [[D2130]] | explicit Custom module include/exclude plus sparse field effects under ceilings |
| [[D2131]] | discriminated requested/effective/reason suppressions and closed renderers |
| [[D2132]] | effect dependencies derived from the 205-binding/117-operation DAG authority |
| [[D2133]] | first-load v2 seal, v2 precedence and zero production v1 writers |
| [[D2134]] | Campaign declared-awaiting imported owner receipt; seven contexts phase independently |

## Open questions

None blocking acceptance. The genuinely owner-shaped choices — names, promises, defaults,
and **which contexts may offer Support** (the candidate table says Just Play only, R3's
posture) — are deliberately structured as validation-gated candidates (§7, Discharge D1)
rather than acceptance blockers, because the owner ruled validation happens through his own
use ([[D649]]) and the D941 lesson is that holding paper for ceremony delays the only test
that counts. An owner who wants Support offerable in `pack` drills says so after feeling it;
the table absorbs the ruling without re-opening the RFC.

## Ledger rows (landed as D942–D944 at acceptance, 2026-08-22)

- **D942 (landed)** — the plan row's eight-intent list conflates two axes (five contexts,
  two presets, one surface state); resolved by §1's mapping table; the shorthand is retired
  from routing use.
- **D943 (landed)** — 🐞 an `academy` live session falls through to its run's
  `sessionKind` assistance profile — `pack`/`position`/`imported`
  (`assistance-preference.ts:7-12` has no academy branch) — so a coached session inherits
  solo defaults and ceilings; fixed by the seventh context (§3.1, criterion 11).
- **D944 (landed)** — three role vocabularies coexist (`RUN_ROLES`,
  `AssistanceContext.role` + `solo`, `EvidenceRole` + `author`/`operator`); §8.3 pins the
  injection mapping; unification into one vocabulary is real future work nobody owns yet.

### Proposed by the 2026-08-24 amendment

Written **unnumbered** per [[D1130]] as amended by [[D1354]] — *proposed; id assigned at
landing; head was D1434 at drafting*. Each row's durable home is the specification section
named in its own text, never this list.

- **proposed** — 🐞 **`assertPresetFoundation` runs at import time and checks nothing about the
  config.** `presets.ts:97` calls it as a module side effect and it validates ids, module
  ghosts, module-union closure, preset sets and the 28/12 grid — but `PresetDeclaration` has no
  `config` field to validate and `WorkflowContextPolicy` has no `configClamp`, so the two
  vocabularies most likely to drift are the two the startup assertion cannot see. Home: §4a's
  `PresetDeclaration` shape and §3.2's `ConfigClamp`; enforced by criterion 12.
- **proposed** — 🐞 **the `campaign` workflow context is unreachable from
  `deriveWorkflowContext`.** `RunSessionKind` is `"pack" | "position" | "imported"`
  (`types.ts:36`) and `LiveSessionKind` is `"stream" | "academy" | "match"` (`:38`), so the
  function's final `return input.sessionKind` can never yield `"campaign"` and no branch
  produces it (`presets.ts:107-116`). The eighth context is registered, defaulted, ceilinged
  and settings-labelled, and nothing can derive it. Either campaign runs pass the context
  explicitly (in which case `deriveWorkflowContext` is not the single derivation criterion 5
  asserts) or campaign encounters silently compile as `pack`/`position`. Home: §3.1; owner:
  `rfc/campaign-core.md`'s implementation lane, which registered the context.
- **proposed** — 🐞 **`PROFILE_DEFAULTS` is a second per-context default authority and outlives
  its reason.** `assistance-preference.ts:6-15` maps all eight contexts to full
  `AssistanceConfig` values, seven of them `SILENT_ASSISTANCE` and one hand-written; §4a
  derives the same information from preset membership. Criterion 10 now resolves by deleting
  it. Home: §4a and criterion 10.
- **proposed** — 🐞 **`AssistanceSettings.svelte` is the 54-control raw matrix the Motivation
  section names as the negative baseline, and it shipped an eighth column.** Nine raw switches
  × eight contexts = 72 controls in one grid (`AssistanceSettings.svelte:60-73`), with no
  preset anywhere in the file — and a repo-wide grep for `preset` over `*.svelte` returns
  **zero hits**, which is the owner's *"where are the presets?"* measured. Home: §7.1; the
  surface work is `play-composition` Discharge D1's, not this document's.
- **proposed** — 📊 **the preset config projection reproduces the one hand-written default the
  wiring RFC shipped.** `guided`'s projection carries `guided: "live"`, which is exactly
  `PROFILE_DEFAULTS.onramp`'s single deviation from silence, and `onramp.defaultPreset` is
  `"guided"`. A derivation that independently reproduces a value chosen by hand three days
  earlier is the cheapest evidence available that the derivation rule is the right one. Home:
  §4a's derivation rule and criterion 10.

## Changelog

- 2026-08-30 (**third author repair [[D2171]]–[[D2178]]**): replaced the conflicting compiler
  APIs with one four-stage discriminated/digest-correlated pipeline; made v2 intent lossless;
  made named preset selection literal; removed browser readiness from the server request; excluded
  `rules_floor` from configurable module ids; and added a safe recovery notice. Module effect
  compilation now refuses the requirements-only module artifacts. The three shared resources are
  explicitly named and route to a required register extension rather than being smuggled under a
  `none` claim. `make intent-presets-second-author-repair` passes 9/9. Another fresh review waits
  on module authority and register prerequisites; no implementation is authorised.
- 2026-08-30 (**second fresh independent return [[D2171]]–[[D2178]]**): returned the second
  author repair after tracing it through the returned module artifacts, repeated storage reload,
  named-from-Custom selection and the shared-resource rules. The source authority is incomplete;
  compiler APIs conflict; v2 loses intent; module deltas survive named selection; browser readiness
  is duplicated; the mandatory rules floor is excludable; invalid recovery is unrepresentable; and
  the new wires/vocabulary claim no register. `make intent-presets-second-fresh-review` passes 8/8.
  No implementation is authorised.
- 2026-08-30 (**second author repair [[D2127]]–[[D2134]]**): defined and exercised the strict
  v2 field/head/parser/serializer authority; removed duplicate preset input; split client request,
  server authority/finalization and browser-only narrowing; gave Custom an explicit module delta;
  typed suppression renderers; derived effect/source alternatives from the module binding/DAG
  authority; sealed migration against every v1 writer; and phased Campaign behind its returned
  owner without removing it from 1.0. The maintained author contract passes 7/7 and the new return
  contract passes 8/8. Fresh independent review still gates implementation.
- 2026-08-30 (**fresh independent return [[D2127]]–[[D2134]]**): returned the author amendment.
  The repaired unset/explicit/migrated distinction remains, but the compiler cannot yet construct
  one authoritative end-to-end request: its persisted field type is undefined; preset arrives
  twice; client-only and server-authoritative contracts conflict; higher Custom values may be
  inert; suppression and availability effects lack required identity; legacy writers remain; and
  Campaign depends on an undefined receipt from a returned RFC. Exact return and 8/8 reproduction
  are linked in Status; no implementation is authorised.
- 2026-08-30 (**author repair after independent return [[D1659]]–[[D1663]], [[D1437]] and
  [[D1500]]**): replaced ambiguous complete-config input with a four-arm preference receipt and
  total legacy migration; recorded the owner rule for literal named presets versus visibly Custom
  higher Advanced values; introduced one closed nine-field effect adapter binding module and legacy
  outputs; defined the complete server/browser availability receipt and fallbacks; made Campaign
  reachable only through its server-issued encounter authority; split configuration from real
  module-delivery completion; added criteria 17–22 and the seven-test author contract. Fresh
  independent buildability review remains required before implementation resumes.

- 2026-08-24 (**amendment, [[D971]]** — the D971 blocker discharged whole; also touches
  [[D985]], [[D307]](a), [[D619]], [[D1428]]): **(1) §4a is new** — the literal nine-field
  `AssistanceConfig` projection of all five presets, 45 cells, each a member of the shipped v4
  union, plus the single derivation rule that produces them from the presets' own module lists
  and the per-field module bindings that rule reads. `quiet` is `SILENT_ASSISTANCE` byte-for-byte
  (criterion 13). **(2) §3.2 is new** — the literal nine-field `configClamp` for all eight
  contexts, 72 cells, derived from the shipped `moduleCeiling` by the same rule, preceded by the
  per-field domain orders that give the permission tokens meaning. The drafted sentence *"carries
  the same ceilings"* is struck, and `Partial` is struck from `ConfigClamp` — a clamp with
  optional keys cannot be checked for completeness, and `keyof AssistanceConfig` wrongly admitted
  `version`. **(3) `permittedAssistance` is defined** as the pointwise minimum of
  `accessPermission` (the HEAD body, renamed) and `contextClamp` (§3.2), keeping its name,
  signature and every unedited call site while finally *reading* `workflowContext`; criterion 5's
  non-vacuity becomes computable, and its drafted `stream` arm is struck as a demand for a wrong
  answer. `AssistanceContext.sessionKind` is removed, so D307(a)'s two unread fields become zero.
  **(4) §5.1/§5.2 are new** — what compiles what and where it lives, with the file, the export
  barrel and the single client caller named, closing [[D985]]'s phantom; and the seat that lands
  the two orphaned functions `loadWorkflowPreset`/`saveWorkflowPreset`, which ship complete at
  `assistance-preference.ts:20-39` with no non-test caller. **(5) The context axis is corrected
  from seven to eight** everywhere — `campaign` shipped on 2026-08-22 discharging D3 and the
  arithmetic was never re-derived — and the acceptance grid from **24/11 to 28/12**, now asserted
  as a derivation over `WORKFLOW_CONTEXT_POLICIES` with the integers as drift tripwires only
  ([[D1240]]). This matches `assertPresetFoundation` (`presets.ts:91-94`) exactly. **(6) Five
  new criteria** (12–16): table transcription plus independent re-derivation, the silence-default
  identity, the read-clamp/no-unread-field lint, the non-test-caller census that would have caught
  the phantom, and the compiled-truth fixture pair. **(7) §7.1 states exactly what the preset UI
  can now be built from** and what it still cannot, with owners named; **§9a refuses the tenth
  field** — `hint-distance` is returned to research, so `hintDistance` is not projected, not
  reserved and not shimmed, and its seam is Discharge D4. **(8) Two Discharge rows added** for the
  only two genuinely blocked parts of the full ask (D4 the tenth field, D5 the
  `compiled.modules` consumer); neither blocks the config half or the surface. Five proposed
  ledger rows, unnumbered per [[D1130]]/[[D1354]].

- 2026-08-22 (cross-review, in place): **(1)** the acceptance grid recounted from this RFC's
  own `allowedPresets` tables — **24 admitted / 11 refused**, not the drafted 19/16
  (5+4+4+1+4+3+3; criteria 1–3 and the unit note corrected — the register row carries the
  same wrong count and is the acceptor's to fix). **(2)** The rules floor made universal at
  the mechanism: the draft's `"legal"`-token floor left criterion 3 unbacked in every
  context whose `boardLighting` clamp is `"sight"`/`"evidence"`, while §5 rule 4's "a stored
  'off' always survives" would have compiled a pre-D493 stored `boardLighting: "off"` — the
  exact regression the section claims is structurally impossible; §3 now floors the field in
  all contexts with a registry invariant and §5 rule 4 carries the ruled exception.
  **(3)** Summary corrected: zero module ids exist in production at HEAD (grep, this pass —
  `learner-modules` is accepted with implementation in flight); "production-registered" was
  false as a present-tense claim. **(4)** Ledger cites repaired: budgets→backstops is
  [[D906]](3), not [[D907]] (twice); the §9 negative-reading row cited [[D718]], which the
  ledger's own correction note pins as the layout-trace row — now [[D745]](2). **(5)** §6's
  mid-run argument no longer asserts module `on_request` grant events "the run log already
  carries" (none exist at HEAD); the logging is stated as `learner-modules`' implementation
  obligation, and criterion 9 gains the proactive arm (`quiet` → `guided` + one commit) the
  drafted `guided` → `analysis` fixture could never exercise. **(6)** Compiler rule 0 added:
  `input.context` must equal `access.workflowContext`, typed refusal on mismatch. **(7)**
  design/05 line cites corrected against the file (algebra `:230-232` not `:232-235`;
  Support ruling `:233-235` not `:236-238`; storage separation `:224-225` not `:226-228`);
  academy fall-through stated precisely (`sessionKind` profile incl. `imported`);
  `postcommit_nudge`-out-of-`analysis` restated as the non-delta it is; `ModuleId` pinned as
  a single exported union, never a second literal list. Verified clean at source: the §2
  algebra quote byte-exact; the §1 mapping table's five vocabularies re-derived at HEAD
  (all cells hold); the R3 promotion deltas and the 11-id union closure; both counterparty
  Discharge D1 rows (`learner-modules.md:801`, `play-composition.md:672`); D942–D944 free at
  ledger head D941.
- 2026-08-22: created, drafted from the Phase-5 HEAD derivation dossier
  (`planning/evidence-foundation-ux/presets-head-derivation.md`).
