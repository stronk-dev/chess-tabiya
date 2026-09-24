# Intent presets — Checkpoint A implementation receipt

**Date:** 2026-09-24 · **By:** claude · **Direction:** the owner said to implement RFCs directly, with
no review rounds. Genuine RFC defects are fixed inline with a changelog line; every other finding
becomes a test.

## What landed

| Area | Files | What it does |
|---|---|---|
| Vocabulary + tables | `packages/runtime/src/presets.ts` | 8 contexts × 5 presets (28 admitted / 12 refused). Literal §4a projections and §3.2 clamps, both re-derived at import from the module presentation facts. The facts mirror `module-policy.ts` `MODULE_POLICIES` and are re-checked against it in `assistance-exchange.ts`. |
| ∩ algebra | `packages/runtime/src/assistance.ts` | `"legal"` permission token. `accessPermission` is the old body, renamed. `permittedAssistance` is the `pointwiseMin` of access and the context clamp. `AssistanceContext.sessionKind` is removed. |
| v2 receipt | `presets.ts`, `apps/web/src/lib/assistance-preference.ts` | Strict parser and canonical serializer for `unset \| explicit \| migrated_snapshot \| invalid_fallback`. Total v1–v4 migration seals the same arm; `tabiya.workflow.v2.*` is the only writer. `PROFILE_DEFAULTS` and the four v1 load/save functions are deleted. |
| Four stages | `packages/runtime/src/assistance-exchange.ts` | `compileAssistanceRequest` → `compileAuthoritativeAssistance` → `finalizeAssistanceEffects` → `narrowBrowserChannels`. Each stage has a literal discriminator and a synchronous SHA-256 digest over canonical JSON. The file also holds typed suppressions with closed fixed-copy renderers, the nine-field effect adapter, the effect catalogue derived from the registry, and the D1639 hint ceiling (marked proposed). |
| Server seat | `apps/server/src/rest.ts`, `service.ts` | `POST /runs/:id/assistance` re-derives origin and access (`assistanceAuthority`) and availability from capabilities, then compiles and finalizes. Exchange errors map to `INVALID_REQUEST`, so no new error code. |
| Play | `apps/web/src/lib/DrillScreen.svelte`, `api.ts`, `App.svelte` | The pill menu offers exactly `allowedPresets` as radios. The footer renders `compiledPresetDisclosure`, either the promise or typed suppression sentences, and says **Custom** when appropriate. Advanced holds the 9 switches plus a 10-module include/exclude list. The Nudge seat is gated on the compiled effect. |
| Settings | `AssistanceSettings.svelte`, `AssistanceControlFields.svelte` | One help-style select per context; the 72 primitives and module list sit under a collapsed Advanced. Every disabled control explains itself. |

## Which presets activate what (unset defaults in **bold**)

| Preset | Modules | Config (non-floor fields) | Default in |
|---|---|---|---|
| Quiet | rules_floor | none (= `SILENT_ASSISTANCE`) | **position, pack, imported, match, stream** |
| Guide me | + sight_on_request, postcommit_nudge, structure_nudge, theory_breadcrumb, guided_hint, compare_coach | markers, guided, lighting sight, arrows sight, ambient | **academy, onramp, campaign** (campaign is declared-awaiting) |
| Theory only | + theory_breadcrumb | ambient | — |
| Support | + sight_on_request, threat_radar, blunder_prevention, postcommit_nudge, guided_hint, theory_breadcrumb | markers, lighting sight, arrows sight, ambient | — (offered in position only) |
| Analyze | + review_map, compare_coach, theory_breadcrumb, full_inspector | markers, humanSplit/corpus on request, lighting evidence, arrows evidence, ambient | — |

Each context then intersects the preset's modules with its module ceiling. Access narrows further,
and every narrowing comes with a typed suppression record.

## RFC corrections (inline, with changelog)

1. `corpus` is driven by `full_inspector` alone. The §3.2 binding table contradicted §4a and the §5
   adapter. Academy and on-ramp therefore clamp corpus `locked_off`, and criterion 5's count there
   is four fields.
2. `guided` governs `structure_nudge` only. The drafted row also governed `guided_hint`, which would
   delete Support's own hint because Support projects `guided: "off"`.
3. The field suppression arm gains `by: "source_availability"`.
4. Explicit field choices are recorded even when they equal the projection (fixture A). Named
   selection keeps explicit overrides that are no higher than the new preset.
5. An `unset` with no legacy input is not written.
6. The stages live in `assistance-exchange.ts` to avoid a value-import cycle with `presets.ts`.
7. A v1 workflow key naming a refused preset migrates to `invalid_fallback`.

## Findings kept as tests

- The match clamp has no terminal arm: a post-outcome reviewer of a match-derived run stays at the
  floor, although §3 says "pre-terminal". This is owner-shaped.
- D1639's hint table is the proposed one and is marked `validation: "proposed"`.
- The module contract artifacts are still `requirements_only`. A test pins the claim, so it fails
  when sealed sources land and the finalizer must be completed.

## Remaining

- **Checkpoint B / D5.** The Nudge seat renders through the compiled effect. The server `/nudge`
  operation does not bind to the final digest or record a new receipt. Criterion 9 arm (b), a
  commit after the raise, is covered by construction but not by a component fixture.
- **Five play-composition matrix states (3, 5, 6, 9, 13).** These need module emitters and seats
  beyond the Nudge.
- **Campaign (D6)**, the **D1639 ruling**, **Discharge D1** (owner use of every candidate), and the
  three shared-resource register names (`workflow-preference`, `assistance-exchange`,
  `assistance-permission`). This change does not claim them (`tabiya-claims none`).
