# Intent presets — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/intent-presets.md` after the D1659–D1663/D1437/D1500 author amendment
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make intent-presets-fresh-review` — 8/8 blocker arms
- **Prior contract:** `make intent-presets-author-contract` remains green (7/7)
- **Production status:** the already-shipped candidate vocabularies/tables remain; no v2
  persistence, compiler, clamp, Custom semantics, campaign origin, pill/footer or module activation
  is authorized by this return

The author amendment fixes the previous review's central failure: unset storage no longer becomes
nine explicit Quiet choices, and higher overrides no longer hide behind a named preset. The fresh
pass traced those repaired types through the real browser writers and the newly returned module
delivery/campaign contracts. Eight seams still permit a truthful-looking preset to compile from no
single request, do nothing, or disagree with the server that delivers it.

## B1 — the persisted override type does not exist ([[D2127]])

`WorkflowPreferenceReceipt` and the v2 JSON grammar both use
`Partial<AssistancePreferenceFields>`, but `AssistancePreferenceFields` is never declared. That
leaves the exact keys, domains, unknown-field rule and version/head relation to the implementer.
A TypeScript alias guessed as `Omit<AssistanceConfig,"version">` still does not supply a strict
runtime parser for localStorage bytes.

**Required repair:** declare one exported closed field map derived from the registered assistance
head, plus exact v2 parser/serializer. Cross unknown keys, invalid values, arrays/null, duplicate
authority, wrong version and a future assistance field that lacks a migration decision.

## B2 — preset identity arrives twice and is never correlated ([[D2128]])

`compileAssistance` accepts `input.preset`; both `explicit` and `migrated_snapshot` receipts carry
their own `preset`. Rule 0 correctly refuses duplicate context disagreement but no equivalent rule
exists for preset. A caller can compile Quiet from an Analysis receipt, or label Analysis from a
Quiet receipt, and receive a result no stored request supports.

**Required repair:** derive the requested preset inside the compiler from the receipt plus context
default, or require exact equality as an input-integrity check. Cross every receipt arm and a
mismatch before any module/config/effect compilation.

## B3 — client-only compilation conflicts with server-authoritative delivery ([[D2129]])

This RFC says `compileAssistance` has one client-side caller and is not a security boundary.
`module-registration` now requires the server to parse untrusted requested help, rederive effective
modules/config against authoritative context/access/provider facts and return requested/effective
digests. The two documents cite coordination but publish no shared request projection or split
compiler. Browser availability includes facts the server does not own; server campaign/access
ceilings include facts the browser cannot assert.

**Required repair:** define a shared two-stage algebra. The client builds a strictly parsed
requested-preference receipt and browser-only channel clamp; the server recomputes authoritative
context/access/server-source/module effects from that untrusted request; the client may only narrow
the returned effective result for browser-local channels. Bind both digests and suppression
origins, and cross forged widening, stale availability and client/server disagreement.

## B4 — Custom can be visibly higher and behaviorally inert ([[D2130]])

§4a explicitly says a learner who wants Analyze plus named guidance sets `guided:"live"` by
hand. Rule 4 marks the higher value Custom. The effect law later says a module absent from
`compiled.modules` produces zero effects regardless of a higher Advanced value. Because Analyze
does not contain `structure_nudge` or `guided_hint`, the promised Custom combination cannot render
either. The Advanced matrix remains complete only as stored enum values, not product behavior.

**Required repair:** decide the Custom composition algebra explicitly. A higher primitive may map
to a closed additional-module capability before ceilings/access are applied, or Custom may edit a
complete module set directly; it cannot silently widen only an inert legacy config. Cross every
domain value through its actual governed effect, including cross-preset combinations, while proving
context/access ceilings still only narrow.

## B5 — suppression records cannot support their own footer ([[D2131]])

The declared `SuppressionRecord` contains only `{subject, by}`. The availability section and
criterion 4 require `{requested,effective,reason}` as well. Without those bytes the footer cannot
say what changed or why from compiler output alone, and two suppressions of the same field collapse
to indistinguishable records.

**Required repair:** publish one discriminated suppression union per narrowing term with exact
requested/effective values, stable reason vocabulary and source/module identity where applicable.
Derive footer copy through registered deterministic renderers; cross conflicting and multiple
suppressions without relying on caller prose.

## B6 — “source-dependent effect” has no source dependency ([[D2132]])

`AssistanceAvailabilityReceipt` names ten broad sources. `CompiledAssistanceEffect` is keyed only
by module, timing, form, optional subsurface and output channel. No record joins an effect to F1
producer ids or AND/OR dependency alternatives. A mixed local/provider module such as Inspector
cannot know which effects availability suppresses, and pending/unavailable/no-witness can be
conflated before module assembly has produced source receipts.

**Required repair:** derive effect-source requirements from the compiled module bindings and the
module assembler's exact dependency graph, not a second hand table. Keep browser output channels
separate from chess-evidence providers. Cross mixed-source modules, alternative sources, pending
transition, no witness and unavailable provider with only the dependent effect removed.

## B7 — the v2 migration leaves v1 writers alive ([[D2133]])

The RFC calls `tabiya.workflow.v1.*` and `tabiya.assistance.v1.*` read-only migration inputs.
Criterion 15 censes old loaders but not writers. At HEAD `saveAssistance` is called by both
Settings and DrillScreen. Unless all are redirected/deleted atomically, a legacy full snapshot can
be written after v2 exists and later compete with or overwrite the migration interpretation.

**Required repair:** include every legacy reader and writer in one closure. The v2 landing must
make production writes to both v1 namespaces impossible, define precedence when v2 and legacy bytes
coexist and cross a stale screen attempting a legacy write after migration.

## B8 — Campaign's authoritative origin is not a buildable dependency ([[D2134]])

`CampaignEncounterReceipt` has no definition in this RFC, `campaign-core` or production. The
campaign RFC is currently returned on ten blockers, including its start/resume journey and reward
authority, while `intent-presets` does not list it as a dependency. Criterion 21 therefore cannot
be green and the eight-context compiler cannot truthfully claim complete production reach.

**Required repair:** either make accepted `campaign-core` plus its exact receipt/issuer/verification
a hard dependency, or phase Campaign as declared-awaiting while the other seven contexts land.
Never invent the receipt locally. Cross issuer, ids, expiry/lifecycle, active-pointer join, resume
and ordinary-pack refusal once the owner contract exists.

## Re-review order

1. Define the v2 field/parser authority and remove duplicate preset identity.
2. Reconcile client request compilation with server-authoritative module delivery.
3. Make Custom values reach real effects and derive effect-source dependencies.
4. Complete suppression bytes and retire every v1 writer.
5. Phase or satisfy the returned Campaign dependency.
6. Invert all eight arms, preserve the prior 7 checks, run governance and full verification, then
   request another fresh review.

No production, schema, content, archive or protected-design byte is authorized by this return.
