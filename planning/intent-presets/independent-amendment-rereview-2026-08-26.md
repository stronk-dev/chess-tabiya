# Intent presets amendment — independent buildability return

**Reviewed:** 2026-08-26

**Reviewer:** codex

**Document:** `rfc/intent-presets.md` after the 2026-08-24 D971 amendment

**Verdict:** **RETURNED.** The closed preset/context vocabularies, module ceilings, context
derivation and separate workflow key remain useful shipped foundation. The amended compiler and
surface contract cannot yet be implemented without making named presets inert or contradictory.

## Method

The pass traced the amended tables and all sixteen criteria through:

- `packages/runtime/src/presets.ts`, `assistance.ts` and the current module/reducer contracts;
- the complete `loadAssistance`/`saveAssistance` and workflow-preference persistence path;
- every non-test assistance/preset caller in `DrillScreen`, Settings, REST and `RunService`;
- `/capabilities`, browser speech availability and the proposed availability input;
- Campaign context reach and the RFC's claimed counterparty discharges.

The review tests whether choosing Guided/Support/Analysis can actually change the ordinary product
while preserving an explicit learner choice and every context ceiling. It does not review pixels;
Claude's concurrent UX pass owns the visual composition.

## What survives

- Preset and workflow context are different axes and should remain separately persisted.
- The five named candidates and eight contexts are a coherent starting vocabulary, subject to the
  existing owner-use validation markers.
- Context module ceilings, the universal rules floor, match-only Quiet ceiling and server-side
  `permittedAssistance` enforcement are the correct algebraic direction.
- Raw primitives remain available through Advanced/Custom or Inspector; ordinary screens should
  consume compiled preset/module outcomes.
- `PROFILE_DEFAULTS` should be deleted once a truthful compiled default owns the value.

## Blockers

### 1. “Stored explicit choices” cannot be distinguished from an unset fallback ([[D1659]])

The compiler takes `stored: AssistanceConfig` and rule 4 treats every field as an explicit learner
override. `loadAssistance`, however, returns a complete `AssistanceConfig` for all three states:
an actual saved object, no storage object, and a missing/malformed key. After the proposed deletion
of `PROFILE_DEFAULTS`, both unset states return `SILENT_ASSISTANCE`.

The documented client call therefore passes nine apparently explicit Quiet values on first use.
Guided starts from its projection and is immediately overridden to markers/guided off, legal-only
lighting, no arrows and ambient off. Support and Analysis collapse the same way. A fixture that
constructs a hand-picked “stored off” object does not test this production path.

Introduce a typed preference receipt that distinguishes `unset` from an explicit override. Because
the current key stores a full snapshot even when one switch changed, publish the migration rule for
existing v1-v4 keys rather than pretending field-level intent can be recovered. The first-use,
missing-key, malformed-key, one-old-snapshot and explicit-off cases must exercise the actual loader
plus compiler.

### 2. Advanced/Custom overrides versus named presets is still an owner decision ([[D1660]])

Rule 4 says a stored value beats a named preset “in both directions.” That lets a stored higher value
widen Quiet—e.g. `humanSplit: on_request` or evidence lighting—even though the protected design
equation says every term only narrows and Quiet promises no guidance. It also makes changing from
Analysis to Quiet preserve the Analysis-level raw switches, so the pill's name and footer can lie.

The archived parent criterion establishes the important narrower case: an explicit `off` must not
be silently re-enabled by a default. It does not license every stored higher value to widen every
named preset. The owner needs one explicit product rule:

1. **recommended:** named presets are literal; explicit lower/off choices may narrow them, while
   higher raw choices live in a sixth Custom/Advanced state; or
2. per-preset override profiles, which are more flexible but require separate storage/migration and
   a visible “modified” state.

Whichever is ruled must make the pill/footer truthful and keep every primitive configurable
somewhere. Do not implement the current global full-config overlay.

### 3. `compiled.modules` and `compiled.config` are two unbound authorities ([[D1661]])

The RFC derives legacy config values from module membership and then states that the two axes “meet
only in the compiler.” No runtime invariant binds them after compilation. A stored
`guided: off` leaves `structure_nudge` and `guided_hint` in `compiled.modules`; when the module
consumer lands those modules may render despite the learner turning guidance off. Conversely, a raw
switch can expose today's pivotal/shape/inspector panels even when the active preset's module set
excludes their future module identity.

Publish one closed adapter from each legacy field/value to the exact module/affordance effect it
narrows, or formally retire that field from ordinary module control and move it to an Inspector-only
channel. Compile modules and legacy config together and assert cross-output coherence. Fixtures need
both directions: field off cannot leave its governed module deliverable, and a module absent from the
preset cannot be recreated through its legacy control.

### 4. Source availability is an undefined and incomplete input ([[D1662]])

`compileAssistance` names `ProviderAvailability`, but no such type exists in runtime, server or web.
The real `/capabilities` shape is `CapabilityProviders`; browser speech synthesis is a separate
client fact; capabilities may be pending on first render. The RFC gives one example
(`spoken: provider` with no TTS) but no total field/provider table, no fallback order, no pending
state and no suppression payload containing requested/effective values.

Define a runtime-owned closed availability receipt over opponent, judge, LLM, corpus, TTS,
tablebase and browser speech readiness, with `pending | available | unavailable` where needed.
Publish the total fallback for every availability-sensitive config value and module empty behavior.
The same compiled input must cover provider arrival after mount without changing the selected preset
or silently upgrading disclosure.

### 5. Campaign remains registered but unreachable ([[D1437]], corrected by [[D1500]])

The amendment acknowledges that `deriveWorkflowContext` cannot return `campaign` from its declared
inputs and provides no repair. The measured harm is the wrong default (`quiet` instead of `guided`),
not a different module ceiling: Campaign and Pack ceilings are currently equal. This still defeats
the main purpose of the context row and leaves the Campaign preference key unread.

Either add a typed campaign origin to the single derivation input or make the caller supply one
authoritative context with an equality check against derivable run/live state. Name the production
campaign caller and fixture Campaign entry/resume; do not add a dead branch over enums that still
cannot represent Campaign.

### 6. The RFC both defers and claims the module activation edge ([[D1663]])

Discharge D5 correctly says `compiled.modules` has no consumer and waits on learner-module
registration. Criterion 9 simultaneously requires every rendered module item to trace to a logged
disclosure event. The closeout paragraph then says this RFC's landing discharges learner-modules D1
and play-composition D1. Those three statements cannot all hold at one checkpoint.

Split the landing truthfully:

- config compiler + preset persistence + semantic pill/footer may land while the RFC remains
  implementing and module activation/logging stays an explicit open discharge;
- the module edge closes only when a real registered module consumer reads `compiled.modules`,
  produces logged delivery receipts and passes criterion 9 non-vacuously;
- counterpart RFC rows flip only in that second commit.

The acceptance suite must refuse an empty rendered population as proof of disclosure logging.

## Required amendment order

1. Obtain the D1660 owner rule for named-preset versus Custom/Advanced overrides.
2. Replace `stored: AssistanceConfig` with a typed unset/explicit/migrated preference receipt and
   publish old-key migration (D1659).
3. Compile module and legacy-control effects through one closed coherence adapter (D1661).
4. Define the complete availability receipt/fallback table, including browser speech and pending
   capabilities (D1662).
5. Make Campaign reachable through one authoritative context derivation (D1437/D1500).
6. Separate the config/pill checkpoint from the later module-consumer/logged-delivery checkpoint
   (D1663), then repeat independent review before further implementation.

## Able-to-fail fixtures owed

- empty storage + Guided compiles the literal Guided projection rather than Quiet;
- explicit `guided: off` narrows Guided without erasing unrelated preset fields;
- switching Analysis→Quiet cannot retain Analysis-only help while the surface says Quiet;
- a legacy full-snapshot key follows the declared migration and never masquerades as nine known
  field-level choices;
- `compiled.config.guided === off` makes every governed guidance module undeliverable, and an absent
  module cannot be reopened by the raw field;
- every provider/browser availability state has one typed effective value and honest-empty outcome;
- a real Campaign entry and resume select the Campaign default/key;
- criterion 9 fails when zero module deliveries occurred and passes only through the production
  logged-delivery operation.

No implementation, protected design, schema or content byte changed in this review. D1660 is the
only owner choice; the other repairs are technical consequences of the existing narrowing and
truthful-surface rules.
