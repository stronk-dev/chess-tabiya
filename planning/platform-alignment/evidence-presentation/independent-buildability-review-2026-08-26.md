# Evidence-presentation independent buildability review

**Date:** 2026-08-26

**RFC:** `rfc/evidence-presentation.md`

**Verdict:** return to author before acceptance

**Scope:** buildability, authority preservation and end-to-end falsifiability; no production or
protected-design edits

The component vocabulary is the right missing product layer. The distribution, outcome split,
magnitude trail, one-fact square set, directed relation overlay, citation and honest-empty states
describe materially different learner objects that the current string renderers flatten. The RFC
also correctly refuses component-local selection and board-rule recomputation.

The contract is not buildable as written. Its central guarantee—one typed visual and one sentence
over the same admitted fact—cannot currently be established by the types or instruments it names.
Nine findings below return it before those assurances become decorative tests around a second
presentation authority.

## R1 — manifest strings do not type or seal a component operand (D1664)

`DeclaredEvidence<T>` is used as `DeclaredEvidence<unknown>` in production renderers, and
`apps/server/src/guidance.ts` obtains every payload through an unchecked cast. F1 seals which
declared item a consumer received, but `EvidenceRendererRegistry` is still a map from projection
key to a function returning prose. The amendment proposes that this function also return one of
thirteen component operands, while §8.2 tries to prove that relation through the manifest's
`payloadType` and `operands` **strings**. Those strings cannot prove that a returned arrow endpoint,
chart point, citation or label was copied from the admitted payload.

An adapter can therefore receive real admitted evidence and manufacture arbitrary component bytes;
the item remains sealed and every declared type can pass after a cast. This is the F1
sentence-with-evidence bypass moved into `components`.

Specify a projection-keyed component-adapter registry whose result is runtime-sealed, with literal
operand retention checked against the declared payload. The negative fixtures must forge an edge,
swap a component between two admitted items, add a component after rendering, and place a sentinel
only in an undeclared/dropped operand; all four must fail before Svelte sees the item.

## R2 — `Convention` is a caller-writable second provenance authority (D1665)

`Convention` repeats `producer`, adds an independent free-string `producerLabel`, accepts a
free-string `basis`, and lets the renderer supply search depth/nodes, sample size or model band.
The type proves only that some metadata was typed, not that it belongs to the admitted measurement.
A Stockfish score can be paired with a Maia label or a different depth and still satisfy every
field and criterion 7.

Derive labels from the registered producer id and the remaining convention from the exact admitted
source/receipt or a registered declared convention. Provider-backed bounds need the same-exchange
identity work already recorded in D1647. Add cross-evidence producer/bound/basis swaps; presence-only
fixtures are not provenance tests.

## R3 — `citation` has no passage or summary to render (D1666)

The component says it renders “one cited passage” and an attributed quoted or summarised passage,
but its operand contains only `sourceLabel`, `title`, `locator`, `licence`, optional URL and
revision. No quoted text, summary, claim binding or admitted fact is present. An implementation must
either render metadata with no theory content or manufacture the passage it promises.

Add a typed content arm whose exact bytes and binding come from admitted cited/theory evidence, or
narrow this component to citation metadata and give the content a separately sealed operand. A
wrong-source swap and a metadata-only record must be able to fail.

## R4 — `enum_state`'s proposed type does not constrain value by vocabulary (D1667)

The RFC promises that an unregistered member is a compile error, then specifies
`{ vocabulary: LabelVocabularyId; value: string }`. That is not a discriminated union and accepts
every string for every vocabulary. A total `Record<T, LabelEntry>` makes each individual registry
complete; it does not bind a runtime vocabulary id to the corresponding member union.

Define a mapped/discriminated operand union (or a generic constructor hidden behind a closed
registry) that couples each vocabulary id to its literal member type, plus a runtime refusal for
untrusted JSON. Cross-vocabulary values such as an opponent mode in an objective-state operand must
fail at both boundaries.

## R5 — the abstention vocabulary and lifecycle do not exist (D1668)

Projection abstention reasons are currently per-projection `readonly string[]`; module
`emptyBehavior` is a different three-member contract; `pending` is introduced later in rule 4e but
belongs to neither. The proposed `AbstentionReason` is therefore not one closed shipped union.
`asked: string` is also free learner prose, and “every form its host component may serve” is not a
literal declaration compatible with criterion 1's closed component table.

Specify an admitted source-specific abstention receipt carrying projection, reason, request state
and provider availability; distinguish never-requested, pending, withheld, unavailable, failed and
genuine empty. Register the learner question/label instead of accepting free prose. Define the
pending replacement/stale-response protocol or consume the protocol from the owning provider RFC.

## R6 — `structured_document` is neither schema-typed nor byte-round-trippable (D1669)

`{ schemaId: string; document: unknown }` is the opposite of “the schema is the type”: any id can
be paired with any object, no registered schema lookup or validator is named, and the source bytes
needed for byte-identical raw round-trip are absent. JSON parse/stringify cannot preserve original
whitespace or all byte representations from `document: unknown`. A route reachability grep also
cannot establish the role of a shared component invoked indirectly.

Bind a closed registered schema identity to validated data and, if byte identity is required, carry
the original validated bytes and digest. Name the author/operator capability check at the actual
route/component boundary. Otherwise narrow the RFC to a read-only structured viewer and leave the
two editors to their authoring RFCs.

## R7 — component coverage ranges over the wrong population (D1670)

Criteria 2 and §8.2 require every projection in `PRIMARY_EVIDENCE_MANIFEST` to map to a component,
while the same manifest deliberately includes retired, experimental, inspector-only,
author/operator-only and `machine_condition` projections. Many have no learner consumer by design.
Forcing them into a learner component contradicts their disposition; excluding them ad hoc makes
the promised set-equality false.

Derive the required population from real consumer bindings, roles, sessions, forms and disposition,
and publish separate learner, inspector and author/operator coverage sets. A newly retired or
machine-only projection must not create a fake learner widget; a newly learner-bound projection
must fail until it has one.

## R8 — a caller-controlled chart range can still grade by geometry (D1671)

`magnitude_trail` correctly refuses silent auto-scaling, then accepts an explicit caller-provided
domain/range with no registered scale policy or evidence identity. Any caller can make the same
0.2-pawn drift fill the chart or look flat. Stating that arbitrary extent does not remove the
visual judgement; it only prints the second authority.

Make the scale a fixed component convention or a registered consumer policy derived from the
measurement domain, and fixture identical evidence under attempted alternate ranges. The caller
must not control perceived significance through raw coordinates.

## R9 — acceptance still depends on unresolved intent and returned contracts (D1672)

Discharge D1 requires an owner-tier form/component amendment. Theming remains awaiting D1;
module-registration is returned on D1585–D1591; hint-distance is returned on D1638–D1643; the real
module seats, hint relation family and effective arrow clamp are therefore absent. Five open
questions also decide learner-visible behavior, including whether `full_inspector` is composed or
raw and how claim caveats render.

Split a component-foundation checkpoint if it can compile independently, or resolve the named
dependencies and owner questions before claiming the full thirteen-component landing. Criteria
13a, 16 and the Discharges may not be satisfied by red placeholders or zero delivered items.

## Non-blocking corrections for the author pass

- Criterion 1 says “add a thirteenth id” although the closed list already has thirteen; it means a
  fourteenth id.
- `claim` names `guidance.authored_claim@1` as though it were the evidence view; that is a consumer.
  The admitted projection carrying these fields is `pack.authored.claim_delivery@1`.
- The RFC's headline 20/126/25/175 manifest tuple is historical; current executable baselines must
  be re-derived rather than mixed with dated evidence.

## Re-review entry condition

Re-review after R1–R9 resolve to exact types, production constructors and able-to-fail fixtures.
The next pass should begin from one real projection through admission, component adaptation,
serialization (if any), client parsing, seat rendering and equivalent sentence, then prove a
forged operand cannot travel the same path.
