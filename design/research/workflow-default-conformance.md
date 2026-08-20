# Workflow and default conformance — do people choose an intent or configure machinery?

**Question:** Do the shipped entry points provide opinionated defaults and real per-workflow
ceilings while keeping every primitive configurable on an advanced surface?

**Ledger:** D635; re-verifies/corrects D307–D311, D321, D484, D532, D582 and D619.

**Method:** executable source/contract audit using `tools/workflow-default-harness/`. It compares
the six shipped preference profiles, nine production axes, permission function, Svelte settings and
in-run controls, live-session kinds, Story route and the six R3 research workflow contracts. It
does not claim participant comprehension or preference. `[V]`

**Result:** 4/4 tests pass at commit `789b000` plus this disposable harness. A green run means the
negative baseline is accurately pinned. `[V]`

## 1. Verdict

The product has **context-addressed mechanism preferences**, not workflow presets. A new user gets
one coherent product opinion—quiet play, with legal-move lighting—but it is unnamed and copied
byte-for-byte into six technical profiles. The only way to change it is a 54-control advanced page
or a six-axis in-run source/mechanism panel. `[V]`

That means two superficially conflicting statements are both true:

- **The default is not arbitrary:** `SILENT_ASSISTANCE` implements the protected design ruling
  “play it, live with it” and preserves basic legal interaction through `boardLighting: "legal"`.
- **There are no useful product defaults by job:** Guided Rehearsal, Learn This Position, Review &
  Retry and Analyze Freely have no persisted workflow identity to which a different preset could
  attach.

The fix is therefore not “turn more stuff on.” It is to name the quiet default, attach preset
requests to user workflows, intersect them with real ceilings, and leave all raw axes behind
Customize/Inspector/Authoring. `[M]`

## 2. What actually persists

`ASSISTANCE_PROFILES` contains six keys: `pack`, `position`, `imported`, `match`, `stream` and
`onramp`. `loadAssistance()` returns the same `SILENT_ASSISTANCE` object for every unset key. The
default has markers/guided/human-split/corpus/spoken/arrows/ambient off, authored voice, and legal
move lighting. `[V]` (`apps/web/src/lib/assistance-preference.ts:4-34`;
`packages/runtime/src/assistance.ts:3-18`)

Settings exposes all nine axes for all six profiles: **54 primary controls**. The in-run Assistance
panel exposes six axes: markers, guided, human split, corpus, voice and speech. Board lighting,
system arrows and ambient presence are Settings-only. `[V]`
(`apps/web/src/lib/AssistanceSettings.svelte:16-50`;
`apps/web/src/lib/DrillScreen.svelte:764-781`)

This corrects D311 and the older `mechanics-by-mode.md` count. Settings no longer has six axes/36
controls, and there are no in-run-only axes. The remaining D311 residues are real: arrows have no
reader; ambient is labelled “Open assistance” but has no click action; mounted runs load once; and
`sight`/`evidence` board lighting currently draw the same structural overlays. `[V]`

## 3. Profiles are not workflows

| Intended workflow | Current entry | Current preference identity | Consequence |
|---|---|---|---|
| Just Play | Play → arbitrary position | `position` | direct mapping, but no named Quiet/Support choice |
| Guided Rehearsal | Play → any pack | `pack` | Line/Plan/Outcome/Trajectory and every pack share one setting |
| Learn This Position | Learn repertoire gap or Play pack | `position` **or** `pack` | workflow identity depends on implementation route |
| Review & Retry | Story/re-enter or reopen run | inherits `imported`/`pack`/`position` | no Review default; retry changes if source context changed |
| Analyze Freely | “Analyze missing evidence” inside a branch group | inherits source | not an analysis mode; no inspector profile/default |
| Campaign | no route | absent | no current default or ceiling can attach |

Only two of six workflow candidates map directly to one profile. The profile taxonomy answers “what
kind of technical run created this?” while the workflow taxonomy answers “what job is the learner
doing now?” Those must be separate IDs because Review and Analyze are views over an existing run,
not new run kinds. `[V]` for the current mappings; the separation is an architectural conclusion
`[M]` (`tools/workflow-default-harness/output.md`).

This is why merely placing preset buttons on Settings would be insufficient. If “Guided” writes the
`pack` profile, it changes every curated drill. If “Analyze” writes the source run's profile, it can
raise what appears when the learner returns to committed play. The selected workflow/preset must be
view/session state constrained by a ceiling, not a mutation of the evidence-source preferences that
happens to share a run. `[M]`

## 4. The ceiling is still not per kind

`permittedAssistance()` accepts `sessionKind`, `deliveryOpen` and `role`; its output is byte-identical
for `pack`, `position` and `imported` in every tested role/disclosure cell. Only disclosure and role
affect the result. This re-verifies D307/D321 and proves the D532 owner ruling has not shipped. `[V]`
(`packages/runtime/src/assistance.ts:20-30`)

The research workflow compiler demonstrates the correct algebra: requested preset modules are
intersected with a workflow ceiling and the ceiling can only remove. It is still disposable code;
production has no module, preset or workflow IDs. `[V]`
(`tools/r3-presentation-harness/workflow-contract.ts`;
`design/research/evidence-contract-topology.md`)

The eventual composition needs at least three separately explained masks:

```text
requested preset modules
  ∩ workflow/session ceiling       (product intent)
  ∩ role/disclosure/fair-play gate (honesty and access)
  ∩ provider availability          (deployment fact)
```

A campaign encounter may add an inner suppression mask, as D298 already requires. It must not be
folded into the honesty gate, because “this encounter withholds theory” and “the source game is
still live” are different reasons shown to the user. `[M]`

## 5. Two routing defects beyond missing presets

### Academy has no assistance address

The live-session API has `stream`, `academy` and `match`, but `assistanceProfile()` special-cases
only stream and match. An academy session silently returns the source run's `pack`, `position` or
`imported` profile. Thus the surface intended for teaching/coaching is the only live kind without a
separate assistance preference, even while Settings offers Stream and Match columns. `[V]`
(`apps/web/src/lib/api.ts`; `apps/web/src/lib/assistance-preference.ts:7-12`)

This does not answer what Coach mode should do—that remains R15/O11—but it proves the current code
cannot give it a distinct default without hijacking another context. `[M]`

### Story ignores the imported voice preference

`App.svelte` supplies `GameStoryScreen.onVoice` whenever an external LLM provider is configured.
Neither `App.svelte` nor `GameStoryScreen` loads the `imported` assistance profile, so the Story
screen offers “Narrate grounded moment” even when that profile says `voice: "authored"`. The setting
does gate voice inside `DrillScreen`; it does not gate the imported game's primary Review surface.
`[V]` (`apps/web/src/App.svelte:643-645`;
`apps/web/src/lib/GameStoryScreen.svelte:6-16,54`)

The action is explicit and post-game, so this is not a cheating leak. It is a preference/route
contract violation: the label “Imported game → External voice” does not control the main imported
game view. `[M]`

## 6. What should be configurable where

The owner's D619 ruling survives the audit and becomes more concrete:

| Layer | Normal user sees | Advanced/configuration home |
|---|---|---|
| Workflow | Just Play, Guided Rehearsal, Learn Position, Review & Retry, Analyze; later Campaign/Coach | workflow identity and current preset |
| Preset | Quiet, Guide me, Theory only, Support, Analyze (names remain participant candidates) | Customize composition within ceiling |
| Module | one promise such as post-commit nudge, theory breadcrumb or full inspector | budget, forms and honest unavailable state |
| Evidence primitive | normally invisible | Inspector filter if learner-safe; Authoring/Operator if not |
| Provider | normally source attribution/status, not a choice | deployment Settings; optional source preference where substitutes are meaningful |

Every registered primitive remains configurable or explicitly disposed somewhere, but “somewhere”
does not mean 54 front-page controls. A raw matcher may be `inspector_only`; a validation predicate
may be `author_only`; an experimental model feature may be `operator_only`; a source may be
unavailable. F1 makes that complete mechanically, while F5 turns admitted consumers into user
workflows. `[M]`

## 7. Proposed production state model (research input, not RFC)

```text
WorkflowSession {
  workflowId
  requestedPresetId
  customComposition?   // optional advanced override, never wider than ceiling
  workflowCeilingVersion
}

AdvancedEvidencePreferences {
  producer/module dispositions and user-safe source preferences
}
```

The workflow state may be ephemeral for Analyze and persisted per workflow for ordinary defaults;
that lifecycle is an F5 design/RFC decision. It must not be encoded as another `RunSessionKind`,
because Review/Analyze can change while the preserved run remains the same. `[M]`

## 8. Preset-specific conclusions

- **Quiet:** valid default for Just Play and a valid choice everywhere. It names today's posture;
  it does not mean no legal affordances.
- **Guided:** post-commit nudge plus progressive requested hints; no proactive warning by default.
- **Theory only:** first-class. It requires F4/F7 applicability/citation and must honestly say when
  no passage or pack applies.
- **Support:** explicit pre-commit opt-in, principally Just Play/free play. It may warn about a
  validated staged-move consequence but may not silently reveal an alternative/PV.
- **Analyze:** explicit inspector mode, allowed to show attributed evaluations, candidates and
  lines. Returning to play must restore the prior workflow rather than retain analysis exposure.
- **Campaign/Coach/Stream:** no exact defaults should be invented here. Campaign waits on R14/O10;
  Coach/Stream waits on R15/R16/O11, with fair-play/delay masks independent from preference.

These are the D619/R3 candidate contracts, not participant-validated names or compositions. `[M]`

## 9. Roadmap and gate effect

- **D635 research closes negatively.** Production has no workflow/preset identity and cannot attach
  distinct defaults to four of six intended learner jobs.
- **D311 is corrected, not closed.** Its surface-count half was false; four functional residues
  remain.
- **R3 remains external-to-complete.** The executable prototype proves composition, but 12
  nontechnical participants still own naming/comprehension/default evidence.
- **F5 remains blocked by F2 and R3/O4.** Implementing preset UI against today's raw facts would
  package noise more attractively without fixing eligibility.
- **No content wave opens.** Workflow state does not stabilize detector semantics or pack
  capability migration.

