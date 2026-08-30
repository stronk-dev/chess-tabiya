# Intent presets — second fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/intent-presets.md` after the D2127–D2134 second author repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make intent-presets-second-fresh-review` — 8/8 blocker arms
- **Preserved checks:** `make intent-presets-author-contract` and
  `make intent-presets-second-author-repair`
- **Production status:** no v2 preference, staged compiler, Custom activation, preset pill/footer
  or Campaign preset implementation is authorised

The repair correctly moves authority toward a strict preference receipt, a server-owned chess
decision and a browser-only output clamp. It also makes Custom module activation explicit and
refuses to invent Campaign bytes. The fresh pass followed those types through storage reload,
named-preset selection, the returned module artifacts and the shared-resource rules. Eight seams
still allow the ordinary surface to lie, lose intent, or compile from two authorities.

## B1 — source dependencies derive from a returned false authority ([[D2171]])

The RFC says effect dependencies derive from 205 binding rows and the 117-row execution/DAG
artifact. The independent module-registration review proved that authority incomplete: Guided Hint
has zero binding rows and nine DAG inputs are neither operations nor declared sources. A preset
availability compiler built now can pass with an empty required module or suppress from a graph
that is not closed.

**Required repair:** make the repaired and freshly accepted module execution authority a hard
predecessor. Derive effect alternatives only from its typed operation/source graph and inherit its
non-vacuity, subject-grain and per-row sealed-output gates.

## B2 — two compiler APIs remain normative ([[D2172]])

§5 still declares one `compileAssistance` taking context, access, server availability and module
authority together. §5.1 then declares a four-stage request → authoritative compile → source
finalize → browser narrow pipeline, but the request and stage result types exist only as prose.
Later clauses continue to cite `compileAssistance`. An implementer must choose which contract wins,
where source assembly occurs and which bytes each digest covers.

**Required repair:** delete the superseded API and publish every stage's exact input, output,
error/refusal and digest projection. Correlate request, authoritative, finalized and browser-narrowed
types so a stage cannot accept another stage's bytes.

## B3 — v2 persistence destroys the receipt arms ([[D2173]])

`WorkflowPreferenceReceipt` distinguishes unset, explicit, migrated snapshot and invalid fallback.
`WorkflowPreferenceV2` persists only preset, overrides and module deltas. First load writes unset as
the current default with empty overrides; reload therefore cannot distinguish it from an explicit
choice. Migrated snapshots likewise lose their marker and may reload as named instead of the
required Custom. This contradicts criteria 10 and 17 and makes later default changes behave
differently before and after one reload.

**Required repair:** persist the intent arm/provenance or define a lossless canonical representation
from which it is derived. Cross at least two reloads, default changes between reloads, migrated
snapshots equal to a named projection, malformed v2 and coexistence with legacy bytes.

## B4 — named selection preserves Custom module deltas ([[D2174]])

The normative save call for choosing a preset carries `moduleOverrides` forward. Any non-empty
module delta forces `displayMode: "custom"`. A learner can click Quiet or Guided and remain Custom,
with modules the chosen preset did not request, even though the prose says a named preset is
literal.

**Required repair:** rule the interaction explicitly. The ordinary expectation is that selecting a
named preset clears widening module deltas while preserving only safe explicit narrowing, with a
separate Advanced action if customization should be retained. Cross label, promise, modules,
config and persisted bytes after every named-from-Custom transition.

## B5 — browser availability is supplied twice ([[D2175]])

`RequestedAssistanceV1` includes `browserChannels`, although the server must not trust browser
provider facts. The same value is then supplied again to `narrowBrowserChannels` after the server
returns. The two readings can differ, and the request digest gives stale browser readiness an
authority-shaped place in the server exchange without specifying which reading wins.

**Required repair:** keep browser-only readiness out of the server request unless it has a named
server purpose. Bind one current browser receipt to the narrowing operation and its digest; cross a
readiness transition while a server request is in flight.

## B6 — Custom can remove the rules floor ([[D2176]])

`moduleOverrides.exclude` accepts any `ModuleId`, and the compiler says exclusions always narrow.
Nothing refuses `rules_floor`. Criterion 3 simultaneously requires every output to include it and
the ruled floor says legal interaction is not configurable assistance.

**Required repair:** make `rules_floor` unrepresentable in exclude at both type and parser levels,
and reinsert/refuse it at the untrusted server boundary. Cross local persisted bytes, forged wire
bytes and direct compiler calls.

## B7 — invalid-preference recovery has no suppression shape ([[D2177]])

Malformed input becomes `invalid_fallback` and must produce a visible recovery reason. Every
`SuppressionRecord` arm requires a valid module, field or effect plus requested/effective values.
A malformed whole receipt has none, so the compiler must fabricate a subject/value or omit the
promised notice.

**Required repair:** add a typed preference/recovery record with safe, non-echoed operands and a
registered deterministic renderer, or move recovery to a separately typed notice channel. Cross
malformed and storage-unavailable cases without rendering attacker-controlled raw bytes.

## B8 — shared versions are unregistered ([[D2178]])

The RFC exports a durable `WorkflowPreferenceV2`, a web/server `RequestedAssistanceV1` wire and a
new member of the closed exported `AssistancePermission` vocabulary while its claims block says
`none`. All three satisfy the repository's shared-resource risk: parallel documents can change
them and web/server/runtime consumers must agree.

**Required repair:** register each genuinely shared grammar/vocabulary once and claim its lane or
closed-set change. If one is deliberately local, enforce that boundary rather than relying on
prose. The staged result/digest wire must be included in the same census.

## Re-review order

1. Repair and accept module-registration's execution/source authority.
2. Collapse the compiler to one typed four-stage pipeline and register its shared wires.
3. Make v2 persistence lossless across reloads and settle named-from-Custom behavior.
4. Remove duplicate browser availability and make `rules_floor` non-configurable.
5. Add a truthful recovery notice/suppression arm.
6. Invert all eight checks, preserve both author suites, run governance and full verification,
   then request another independent review.

No production, schema, content, archive or protected-design byte is authorised by this return.
