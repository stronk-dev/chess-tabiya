# RFC: Semantic convention provenance — definitions survive collection, derivation and disclosure

- **Status:** draft — amended 2026-08-27 with executable D1921–D1926/D1934–D1937 contracts;
  the process predecessor and repeat independent review still block acceptance
- **Author:** codex (agent), for Marco
- **Created:** 2026-08-27
- **Design refs:** `design/04-content-architecture.md` §2d and §7;
  `design/05-in-run-experience.md` §3 and §3-forms; law 8 in `AGENTS.md`
- **Exploration gate:** breadth architecture is owner-open; D1722 is answered by
  `design/research/declared-convention-identity-closure.md` and its seven-arm executable harness
- **Depends on:** implemented `rfc/archive/evidence-contract-manifest.md`; implemented
  `rfc/archive/shared-resource-registers.md`; implemented
  `rfc/archive/semantic-evidence-selection.md`; draft `rfc/semantic-convention-register.md` must
  implement before this RFC can be accepted
- **Parent / amends:** follow-up to `rfc/archive/evidence-contract-manifest.md`
- **Supersedes / superseded by:** —
- **Planning:** `planning/semantic-convention-provenance/`

```tabiya-claims
run-schema | lane 0.24 | EvidenceAttachedEvent gains optional semanticReceipts carrying exact projection/value/convention receipts; schema 0.17 -> 0.24 through the registered lane chain
```

The run-schema claim is required now by the durable Review/history guarantee in §6.1. The future
`semantic-conventions` claim remains absent while its process resource is a draft: this RFC creates
an eighth shared resource and the current checked claim grammar knows seven. The
reviewed 39-member initial census is published in §1.2 and the exact process repair is
`semantic-convention-register.md`. Before acceptance, that register/checker must land and this block
must gain its set-equal membership claim beside the retained run lane. A private
catalogue-local list or an unregistered exported constant is not an acceptable shortcut.

## Summary

Tabiya labels 42 compiled projections `declared_convention`, but only ten emitted payloads carry a
machine-readable convention identity. Sixteen more projections name a version-like token only in
prose, sixteen name none, and eighteen convention-dependent projections use another scalar
grounding. The compiler accepts an in-place meaning rewrite and rejects one truthful composition
convention. That is not provenance: a projection can reach a learner or voice provider without the
definition that made it true.

This RFC adds one compiled convention registry, direct convention references on evidence
projections, path-specific transitive convention closure, and sealed disclosure of the resulting
authority. A convention is separate from primary grounding: a fact may be position arithmetic,
recorded history or bounded search and still depend on a declared definition. Definition changes
require a new convention version; truth-set changes require a new projection version. Ordinary UX
receives module wording and an optional “How this was detected” explanation; raw ids remain in the
Advanced inspector.

## Motivation

### 1. The current scalar cannot express the truth

`ProjectionDeclaration.grounding` answers what class of evidence primarily establishes a fact. It
does not answer which exact definition, threshold, ordering or bounded window was applied.
Conflating the two creates both observed failure modes:

- `backward_pawn` and `king_opposition` predicates/readings are labelled
  `position_rules/exact`, while their same-family events are
  `declared_convention/convention`; and
- `derived.tactic.square_clearance_observed@1` is grounded in recorded move order but also uses
  `observed-window@1`. Changing its scalar grounding to the latter is rejected as widening.

The repair is an independent convention closure, not another scalar grounding value.

### 2. This blocks every downstream promise

A Support card cannot responsibly say “backward pawn”, a Review map cannot compare old and new
definitions, a bot feature vector cannot explain which convention affected a choice, and an LLM
cannot paraphrase a definition that never entered its sealed request. The Advanced inspector may
show the raw projection regardless; learner/module admission requires the complete convention
closure.

### 3. Scope

This RFC owns convention identity, compilation, sealing and disclosure. It does not:

- choose whether an admitted fact is important, favorable or worthy of a hint;
- define new chess predicates or silently repair `backward_pawn`, `king_opposition`, outposts or
  pawn safety;
- change avoidance denominators or their subject grammar;
- activate learner modules, Review, bots, campaign rewards or longitudinal style metrics;
- migrate pack/shape content; or
- expose a convention registry as an ordinary learner settings surface.

Those consumers depend on this contract and migrate explicitly after their own RFCs pass.

## Specification

### 1. Convention registry

The runtime exports a single compiled registry:

```ts
export interface ConventionRef {
  readonly id: string;
  readonly version: number;
}

export type ConventionAuthority =
  | Readonly<{ kind: "position_rules"; implementation: string }>
  | Readonly<{
      kind: "landed_contract";
      witnesses: readonly string[];
      snapshotRef: string;
    }>
  | Readonly<{ kind: "published_source"; citation: string; licence: string }>
  | Readonly<{ kind: "product_rule"; rulingRef: string }>
  | Readonly<{ kind: "measured_record"; recordRef: string }>;

export interface ConventionDeclaration {
  readonly ref: ConventionRef;
  readonly definition: string;
  readonly limitations: readonly string[];
  readonly authority: readonly ConventionAuthority[];
  readonly disclosure:
    | Readonly<{ kind: "definition_and_limitations" }>
    | Readonly<{ kind: "reviewed_text"; summary: string; detail: string }>;
}

export interface CompiledConventionRegistry {
  readonly declarations: readonly ConventionDeclaration[];
  readonly digest: string;
}
```

`landed_contract` is a migration-only authority for meaning already present in shipped bytes.
`witnesses` are exact projection refs and/or implementation paths/symbols and `snapshotRef` is the
immutable committed tree whose bytes were reviewed. The compiler verifies the witnesses against
that snapshot. It cannot authorize a new convention whose meaning is absent from those witnesses; new chess
truth still requires position-rule code, a published source, owner product ruling or measured
record. This prevents bounded-search, recorded-run and deterministic product composition from being
misfiled as `position_rules` merely to migrate them ([[D1936]]).

`definition_and_limitations` is the initial migration disclosure: summary is the exact registered
definition and detail is that definition followed by every mandatory limitation. It introduces no
new prose and is intentionally used only for the initial source-recovery population. A later
source-reviewed concise disclosure uses `reviewed_text`; changing its meaning follows the normal
version rule. Ordinary module wording remains separate from both.

`compileConventionRegistry` freezes and orders declarations by `(id, version)`, rejects duplicate
refs, blank definition/limitations/disclosure, unsupported authority shapes, and any citation or
ruling reference the repository's existing source grammar cannot resolve. The digest covers every
semantic field, not file path or declaration order.

The compiler also compares the current registry with an append-only semantic-history artifact. One
line records each newly landed `id@version`, its semantic digest (definition, limitations,
authority and disclosure), the full registry digest at that landing, owner RFC and landing commit.
The artifact is not a co-editable snapshot:

- the staged governance check compares the index with `HEAD` and permits only appended lines;
- repository CI checks the committed file against its first parent and likewise refuses edits,
  reordering or deletion of any prior byte (the governance checkout therefore requires history
  depth of at least two); and
- the registry compiler requires every current/historical declaration digest to equal its one
  immutable history row, while a new version appends one new row.

Changing `space@1` and its old history row in one change therefore fails before refreshed manifest
or receipt digests matter. `space@2` is legal only as the next lineage version and appends a new
row. Initial bootstrap appends all reviewed initial rows once; subsequent changes may never rewrite
them. Removal is permitted only through an explicit retained `retired` declaration that names its
successor or refusal reason; historical evidence and the registry snapshots named by persisted
receipts remain readable.

### 1.1 Shared-resource registration

`semantic-conventions` is a membership register analogous to `evidence-kinds`:

- tree authority: the compiled `CONVENTION_DECLARATIONS` refs;
- landed rows: every shipped `id@version` and its owner RFC/SHA;
- live claims: exact `members <id@version>...` declarations;
- collision: two live RFCs may not claim the same new member; and
- head check: the landed member set equals the tree set.

The initial population is derived mechanically from exported convention constants, payload
operands, version tokens in projection semantics/limitations and the D1722 other-grounding review
set. Acceptance requires a literal reviewed table; a regex result alone cannot decide that prose is
a real convention.

### 1.2 Reviewed initial membership

The executable census in `tools/d1722-convention-identity-harness/initial-member-census.test.ts`
pins **39** initial members. Twenty-three identities already occur in production bytes. Sixteen
assign an identity to an already-shipped, unversioned meaning; they name migration work and do not
invent chess semantics.

| class | exact members |
|---|---|
| already identified (23) | `back_rank_susceptible@1`, `candidate-majority@1`, `chessops-king-takes-rook@1`, `defence-duty@1`, `development@1`, `grade-convention@1`, `king-landing-square@1`, `king-shelter@1`, `king-zone@1`, `legal-exchange@1`, `local-non-losing@1`, `material-role-signature@1`, `mate-proof@1`, `maximal_pawn_reach@1`, `mover-turn-ep-cleared@1`, `observed-window@1`, `overload-conflict@1`, `pressure-line@1`, `race-arrival@1`, `space@1`, `standard-uci-king-destination@1`, `threat@1`, `trapped@1` |
| identity assigned to shipped meaning (16) | `backward-pawn-legacy@1`, `candidate-feature-vector@1`, `discovered-latency@1`, `double-attack@1`, `evidence-reference-resolution@1`, `fork-survival@1`, `king-opposition-blocker-blind@1`, `loose-piece@1`, `opening-deepest-reached@1`, `pawn-relations@1`, `ray-classification@1`, `square-control@1`, `story-last-level@1`, `story-rank@1`, `story-title@1`, `trade-completed@1` |

`mate-proof-traversal-fnv64@1` is a proof-digest serialization identity and
`module-reducers@1` is an implementation version; neither defines evidence truth, so both are
explicitly excluded. Projection/producer/consumer `foo@1` refs are likewise resource identities,
not conventions. A new member therefore requires a reviewed semantic witness, not merely a suffix.

The census also corrects an invalid draft shape: `grade-convention@1` is the convention ref and
`context` remains a retained instance operand. `grade-convention@1/<context>` is not a ref and may
never enter the register. [[D1851]] is already closed: `story-title@1` production and manifest
semantics are both learner-relative, and a focused regression binds the declaration to the paired
opposite-side outputs before the registry snapshot freezes it.

The literal migration population is
`planning/semantic-convention-provenance/initial-declarations.json`. Its 39 rows are set-equal to
the stable membership seed; every row contains an exact definition, at least one mandatory
limitation and one or more live projection/implementation witnesses. The envelope supplies the
single migration snapshot, `landed_contract` authority kind and
`definition_and_limitations` disclosure kind. The compiler expands each row without authoring or
paraphrasing it:

```ts
{
  ref: parseConventionRef(row.ref),
  definition: row.definition,
  limitations: row.limitations,
  authority: [{ kind: envelope.authorityKind, witnesses: row.witnesses,
    snapshotRef: envelope.snapshotRef }],
  disclosure: { kind: envelope.disclosureKind },
}
```

The source-recovery harness refuses a missing/extra member, blank definition or limitation,
unresolvable projection, absent file/symbol fragment or a shipped-identity row whose literal ref
has no witness. This artifact is the reviewed declaration authority; the seed remains membership
authority only. A future declaration is authored directly under the normal authority union and
does not reuse the migration envelope.

### 2. Projection declarations and path closure

`ProjectionDeclaration` gains:

```ts
readonly conventions: Readonly<{
  direct: readonly ConventionRef[];
  instance?: Readonly<{
    extractor: ConventionOperandExtractorId;
    operands: readonly string[];
  }>;
}>;
```

`direct` names fixed definitions applied by the projection itself. `instance` is required only
when different payload instances of one projection may select different registered conventions.
Every named operand must already be in `projection.operands`. Its extractor is not generic key
lookup: it validates one of the three live value shapes and returns exact refs plus any retained
non-identity operand:

```ts
export interface ConventionOperandExtraction {
  readonly refs: readonly ConventionRef[];
  readonly retained: Readonly<Record<string, unknown>>;
}

export interface ConventionOperandExtractor<TPayload> {
  readonly projection: VersionedEvidenceId;
  readonly operands: readonly string[];
  readonly extract: (payload: TPayload, registry: CompiledConventionRegistry) =>
    ConventionOperandExtraction;
}
```

The compiled extractor catalogue is set-equal to the manifest-derived population of
instance-varying projections. That population is fourteen at the 2026-08-27 gate: twelve
single-string refs, king-zone's two refs, and grade's structured `{id, version, context}` value.
Grade `context` is validated and retained but is not a pseudo-ref. Missing, broad, malformed,
unregistered and invalid-context values fail before evidence sealing. Removing an extractor or
adding one for a projection that declares no instance conventions fails compilation.

Before extraction, every exact source adapter enforces payload-key set equality with its declared
operands. The live `exactObject` only checks for missing keys; [[D1934]] proves that an undeclared
extra `conventionId` or arbitrary caller field is otherwise sealed. A fixed projection therefore
cannot smuggle an instance ref simply because no extractor runs.

Primary `grounding`, `exactness`, `confidence`, source provenance and abstention remain unchanged.
Convention refs cannot promote any of them.

For a source projection, the compiled closure is its `direct` refs plus its validated instance
refs. For a derived projection, the compiler produces one closure per declared derivation member:

```text
closure(path) = union(input closures actually used by path, projection.direct)
```

Alternative paths remain alternatives. The compiler must not union refs from paths that did not
run, and a derived receipt records which member supplied the output. A derived projection may add a
composition convention such as `observed-window@1`; it may not omit an input convention, name an
orphan ref, or claim a ref absent from both its inputs and `direct` set.

An empty convention set is legal only after a total convention-dependency audit marks the
projection `not_applicable` with a checked reason. `grounding: "declared_convention"` with an empty
set is always an error.

### 3. The eighteen other-grounding rows

Unit: one D1722 projection carrying convention-dependent semantics under a scalar grounding other
than `declared_convention`. Total: 18, set-equal to the executable D1722 census.

| projection | primary grounding retained | convention treatment |
|---|---|---|
| `rules.structural.{predicate,reading}.backward_pawn@1` | `position_rules` | direct legacy backward-pawn convention; successor truth-set changes require `@2` |
| `rules.structural.{predicate,reading}.king_opposition@1` | `position_rules` | direct legacy blocker-blind convention; opposition v2 is a new convention and projection |
| `rules.structural.{predicate,reading}.{outpost,pawn_safe_square}@1` | `position_rules` | direct maximal-pawn-reach/pawn-safety convention; D566 keeps learner admission closed |
| `rules.tactic.consequence.forced_mate_after_move@1` | `position_rules` | direct `mate-proof@1`; bounded-search limits remain explicit limitations |
| `rules.tactic.reading.defender_duty_set@1` | `position_rules` | direct `defence-duty@1` |
| `rules.tactic.event.{defender_removed,defender_duty_relocated}@1` | `position_rules` | inherit `defence-duty@1` from their declared source and retain exact event operands |
| `derived.compare.structure_delta@1` | `position_rules` | inherit the exact closures of the before/after facts; no new comparison convention |
| `derived.grade.move_quality@1` | `bounded_search` | direct `grade-convention@1`; its retained `convention.context` selects the registered threshold arm, plus engine-source provenance |
| `derived.material.reading.role_signature@1` | `position_rules` | direct `material-role-signature@1` |
| `derived.material.event.role_asymmetry@1` | `position_rules` | inherit/direct `material-role-signature@1`; no piece-value verdict |
| `derived.pawn.sequence.harassment_pressure@1` | `recorded_run` | retain its exact payload convention plus observed sequence closure |
| `derived.tactic.square_clearance_observed@1` | `recorded_run` | direct `observed-window@1` plus every source convention used by the observed relation |

The braced rows expand to the exact 18 identities. A permanent set-equality test compares this table
to the D1722-derived population. A new other-grounding candidate therefore fails until classified;
it cannot silently inherit a neighbor's decision.

### 4. Sealed evidence and rendering

Convention-bearing evidence is created by compiler-owned source and derived constructors. The
compiler never attaches ancestry after `DeclaredEvidence` has frozen. A source constructor runs
the exact adapter, validates its direct/instance closure and seals evidence plus receipt in one
operation. A derived constructor accepts the exact already-sealed input values actually used,
resolves them to exactly one declared derivation member, derives the closure and seals output plus
receipt in one operation.

The receipt is value-level and contains:

```ts
export type ConventionDerivationReceipt =
  | Readonly<{ kind: "source" }>
  | Readonly<{
      kind: "derived";
      member: string;
      inputs: readonly Readonly<{
        projection: VersionedEvidenceId;
        valueDigest: string;
      }>[];
    }>;

export interface ConventionReceipt {
  readonly refs: readonly ConventionRef[];
  readonly registryDigest: string;
  readonly derivation: ConventionDerivationReceipt;
  readonly digest: string;
}
```

`member` is the canonical sorted exact-ref identity of the selected declaration member, never its
array index. `inputs` is a canonical multiset, not a set: it retains every concrete input value,
including repeated values of one projection. `valueDigest` covers producer, exact projection,
payload and the input's own convention-receipt digest, so two nested paths with equal output bytes
cannot collapse. Input order does not affect the receipt; input multiplicity does.

Member selection uses exact projection membership but does not discard value identities afterward.
Missing, extra or ambiguous members fail. An `anyOf` declaration with two canonically identical
members is invalid at manifest compilation, rather than allowing runtime ambiguity. Closure is the
union of the exact input receipts actually present plus direct and validated instance refs. An
unused alternative contributes nothing.

Only the evidence compiler can construct the receipt. A caller cannot add, drop or replace refs or
inputs by object spread, JSON round-trip or type assertion; the runtime seal check fails before
rendering. Reducer and module narrowing preserve the exact receipt of every retained fact. The
fourteen-arm disposable contract in
`tools/d1921-semantic-convention-review-harness/semantic-convention-contract.test.ts` proves
same-output/different-path identity, repeated-input multiplicity, canonical order and the negative
forgery/member cases before production implementation.

Registered evidence renderers may request convention disclosures from the compiled registry. The
result is a typed renderer output, not caller prose:

```ts
export interface RenderedConventionDisclosure {
  readonly refs: readonly ConventionRef[];
  readonly summary: string;
  readonly mandatoryLimitations: readonly string[];
  readonly detail: string;
  readonly registryDigest: string;
}
```

Deterministic screen output and an external voice request derive from the same rendered item and
receipt. The provider may shorten or rephrase only the registered summary within the normal
evidence rules. Mandatory limitations are never provider-authored and never tested by an omission-
blind allow-list: the application appends/renders the exact registered limitation clauses after a
valid provider result. Provider-off output uses the same deterministic clauses. `voiceCheck`
continues to reject invention/substitution in the optional summary; completeness is established by
the deterministic assembler, not by asking `voiceCheck` to detect missing words. A negative fixture
returns only a valid summary from the provider and proves the final user-visible disclosure still
contains every mandatory clause byte-for-byte.

### 5. Product presentation boundary

Ordinary surfaces show a module-composed sentence/card/highlight. If explanation is useful they may
offer one progressive control labelled “How this was detected”. Its first disclosure is the
registered summary; the detail is the next explicit level. Neither level changes the chess answer
distance or reveals hidden candidate moves.

The Advanced inspector may show raw convention and projection refs, definitions, limitations,
authority links and closure paths. There is no global list of convention toggles and no ordinary
screen exposes the registry as a producer dump.

### 6. Version and migration rules

The following rules are mandatory:

1. Definition/limitation/authority/disclosure meaning change → new convention version.
2. A projection begins using a different convention, or its truth set changes → new projection
   version, even if the payload shape is unchanged.
3. Derived projections, module eligibility, validation profiles, pack predicates and stored
   evidence migrate explicitly to the new projection/convention refs.
4. Old refs remain readable but cannot satisfy a newer consumer by name similarity.
5. A refreshed digest detects changed bytes; it never authorizes semantic reuse.

Opposition v1/v2 is the permanent positive control: old blocker-blind evidence remains inspectable
and cannot satisfy v2 validation, avoidance, pack capability or learner-module bindings.

### 6.1 Durable run/history receipt

The Review/history promise is durable, not transient recomputation. Run-schema lane 0.24 widens
`EvidenceAttachedEvent.data` with an optional `semanticReceipts` array:

```ts
export interface PersistedSemanticEvidenceReceipt {
  readonly evidenceRef: string;
  readonly producer: VersionedEvidenceId;
  readonly projection: VersionedEvidenceId;
  readonly payloadDigest: string;
  readonly convention: ConventionReceipt;
  readonly attestation: Readonly<{
    readonly algorithm: "ed25519";
    readonly keyId: string;
    readonly signature: string;
  }>;
}
```

Each `evidenceRef` occurs at most once and must also occur in the event's existing `evidenceRefs`.
The exact attachment operation receives sealed evidence values, not caller-written receipts. It
serializes producer, projection, payload digest and the already-sealed convention receipt, then
signs the canonical envelope with the installation's semantic-receipt key. The signature covers
`evidenceRef` and every field above except itself. A bare/recomputed digest is not authenticity:
the current event stores no semantic payload/input graph or event hash chain, so a caller could
alter an input value digest and recompute every unkeyed digest ([[D1937]]). The attestation proves
that the trusted origin's compiler accepted those exact bytes at attachment time. For a
manifest projection whose compiled convention disposition is applicable, omission is an error;
for `not_applicable`, supplying a convention receipt is an error. Non-semantic legacy references
may remain in `evidenceRefs` without a semantic receipt.

On save/export, the bytes remain inside the append-only run event stream. On load/import, a
compiler-owned `reSealPersistedSemanticEvidenceReceipt` first verifies the Ed25519 signature against
a trusted origin key, then checks the receipt digest, exact ref grammar, historical registry digest,
every referenced declaration digest and derivation-input multiset before restoring the runtime
seal. A structurally valid plain object never becomes renderable merely because it parsed. Unknown
keys produce typed `untrusted_receipt_origin`; an invalid signature produces
`persisted_semantic_attestation_invalid`; unknown historical registry/declaration bytes produce
`historical_convention_unavailable`, not recomputation under the current head.

The self-hosted appliance creates and retains this signing key through the existing secrets/storage
boundary; rotation retains old public keys by `keyId`. Account export includes the origin public key
and fingerprint beside the signed run bytes. Same-origin import verifies automatically. A different
installation never treats a self-asserted exported key as trusted silently: the user explicitly
trusts its displayed fingerprint or convention history stays unavailable. Deleting an account/run
does not delete a shared installation public key, but no receipt or learner datum remains attached
to it. This is provenance integrity, not a claim that a signer is universally trusted.

Runs below schema 0.24 and imported games whose original events contain no receipt remain readable
and honestly empty on convention history; no migration manufactures past provenance. New
convention-bearing attachments after 0.24 must carry receipts. Account export includes them through
the existing run event export, and both run/account deletion paths delete them with the containing
run—there is no second retention table. Fixtures cover create→save→reload→Review, export
byte-equality, deletion, a legacy absent receipt, a v1 receipt after v2 lands, tampered refs/input
digests, and a missing historical registry snapshot.

### 7. Implementation order

1. Extend the shared-resource claim grammar/register with `semantic-conventions`, its durable seed
   and base-id lineage serialization.
2. Publish/review the source-grounded 39 declarations and bootstrap the append-only semantic
   history; no implementer authors missing meaning.
3. Land the convention compiler, typed fourteen-projection extractor catalogue, exact adapter-key
   equality and projection declaration field.
4. Migrate every current projection/source adapter and produce a zero-unresolved closure report.
5. Land compiler-owned source/derived value seals, canonical receipts, deterministic limitations
   and admitted/reduced/rendered/provider propagation.
6. Land run-schema 0.24 attested persistence/re-sealing, installation-key lifecycle and its
   save/reload/export/deletion fixtures.
7. Land opposition/backward-pawn and avoidance successor RFCs on the stable contract.
8. Bind executable semantic validation and only then activate modules, Review, bots and packs.

No content migration occurs in steps 1–4.

## Deviations from design

None. This makes the existing grounding and “LLM renders validated evidence” laws enforceable. It
does not add a learner-facing evidence settings surface or strategic judgement.

## Acceptance criteria

1. `semantic-conventions` is a checked shared-resource register; its landed/live/tree member sets
   agree, and the RFC's claim block no longer says `none` before acceptance.
2. Registry compilation rejects duplicate, missing and orphan refs, blank semantic fields and an
   unresolved authority reference.
3. Mutating a registered definition at the same `id@version` fails against the append-only
   semantic history even when the declaration, generated registry/manifest/receipt digests and a
   working-tree copy of the history row are changed together; staged and first-parent CI fixtures
   both fail.
4. Every compiled projection declares convention applicability. All
   `grounding: declared_convention` projections have a non-empty closure.
5. The exact D1722 42-row population and 18-row other-grounding population are migrated or receive
   an explicit checked `not_applicable` disposition; the closure report has zero unresolved rows.
6. Backward-pawn and king-opposition predicate, reading and event chains resolve to their legacy
   refs, while a v1 evidence item fails a synthetic v2 consumer.
7. `square_clearance_observed` compiles with recorded-run provenance plus
   `observed-window@1`; deleting either the source closure or composition ref fails.
8. An alternative derivation fixture executes two paths with the same output payload and proves
   each canonical-member receipt contains only the conventions and exact input-value digests of the
   path actually used. Reversed input order is byte-equal; repeated-projection multiplicity remains.
9. The typed extractor catalogue is set-equal to all fourteen manifest-derived instance-varying
   projections and covers string, two-ref and structured-grade shapes. It refuses absent, broad,
   malformed, unregistered and invalid-context operands. Exact adapters reject every extra key, so
   a fixed projection cannot smuggle an undeclared instance ref or arbitrary caller data.
10. A derived projection cannot omit an input ref, add an undeclared ref or widen grounding,
    exactness, confidence or answer content through a convention declaration.
11. A forged, spread, JSON-round-tripped or stripped `ConventionReceipt` fails the existing
    admitted/rendered-item seal before deterministic or provider rendering. A persisted receipt is
    accepted only after origin-signature verification, historical validation and compiler
    re-sealing. Recomputing every unkeyed digest after changing a ref/input still fails the
    attestation; an unknown key fails `untrusted_receipt_origin`.
12. Deterministic output and the external voice body carry byte-equal refs/summary. The provider
    may omit every limitation and the final assembled output still appends every registered
    mandatory limitation byte-for-byte; an unregistered summary sentence fails `voiceCheck`.
13. Ordinary module fixtures contain no raw projection/convention id; the Advanced inspector shows
    the exact refs, definition, limitations and authorities.
14. The convention disclosure does not widen answer distance, assistance timing, seat permission
    or board-visible forms.
15. A 0.24 run survives create→save→reload→Review and export with byte-equal exact receipts; v1
    remains readable after v2 lands. Legacy absence stays honest-empty, tampering/missing history
    fails typed, and run/account deletion leaves no retained receipt.
16. `make evidence-manifest-check`, semantic evidence checks, run-schema/migration checks,
    typecheck, software tests, governance checks and the external-provider negative suite pass on
    Node 24.
17. Canonical evidence/run docs describe direct/path convention closure, durable history and the
    ordinary-versus-Advanced presentation boundary; D1722/D1921–D1926/D1934 close with the
    implementation SHA and a log entry.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Opposition v2 registers its unobstructed definition and new projection identities; v1 stays historical/research-only | `planning/evidence-foundation-ux/king-opposition-author-repair-2026-08-26.md` | its successor RFC implementation commit | |
| D2 | Backward-pawn v2 retains exact pawn/stop/support/controller/occupancy semantics on this convention boundary | `planning/evidence-foundation-ux/backward-pawn-author-repair-2026-08-26.md` | its successor RFC implementation commit | |
| D3 | D1711 executable validation receipts include the exact convention closure used by each case/population | `planning/evidence-foundation-ux/semantic-validation-author-repair-2026-08-26.md` | its successor RFC implementation commit | |
| D4 | Evidence Presentation renders the registered optional disclosure without exposing raw ids by default | `evidence-presentation.md` | its implementation commit | |

## Open questions

None require an owner product choice. The exact initial convention member table is §1.2 and the
18-row classification is §3; both are author/buildability obligations, not preferences. Any row whose definition
cannot be traced is refused from learner admission and returned to its source RFC; it is not filled
with model knowledge.

## Independent-review routing

| finding | blocker | repair owner |
|---|---|---|
| [[D1921]] | repaired in §4 by canonical member + exact input-value multiset and compiler-owned source/derived seals; repeat review required | executable amendment: `design/research/semantic-convention-value-authority.md` |
| [[D1922]] | repaired in §2 by typed extractors set-equal to all fourteen instance projections | executable amendment: `design/research/semantic-convention-value-authority.md` |
| [[D1923]] | repaired by the literal, source-resolved, set-equal 39-row migration population in `planning/semantic-convention-provenance/initial-declarations.json`; repeat review required | executable amendment: `tools/d1923-semantic-declarations-harness/` |
| [[D1924]] | repaired in §4: provider authors only the summary; deterministic assembler owns mandatory limitations | author amendment; repeat provider-boundary review |
| [[D1925]] | repaired in §1 by append-only staged + first-parent semantic history; process-register amendment still required | process/product reconciliation |
| [[D1926]] | repaired in §6.1 with run lane 0.24, origin attestation and durable re-sealing contract; core executable candidate passes | executable amendment + live register claim |
| [[D1934]] | `exactObject` accepts extra fields | exact key-set repair included before instance extraction |
| [[D1937]] | an unkeyed persisted digest can be rewritten self-consistently because the run stores neither the semantic payload graph nor an event hash chain | repaired by Ed25519 origin attestation over the canonical persisted envelope; executable tamper/unknown-origin negatives |

## Changelog

- 2026-08-27: independent review returned the draft on [[D1921]]–[[D1926]]. Exact return:
  `planning/semantic-convention-provenance/independent-buildability-review-2026-08-27.md`.
- 2026-08-27: created from D1722's measured 42 + 18 populations and author handoff. Defines a
  separate convention closure, path-specific derivation, sealed disclosure, version/migration law,
  exact 18-row classification and the shared-resource-register prerequisite. Claims no current
  resource while draft; acceptance requires the new membership register and exact claim.
- 2026-08-27: published the executable 39-member seed census (23 existing identities plus 16
  identities for shipped meanings), excluded two non-semantic version tokens, and corrected grade
  context from an invalid pseudo-version to a retained operand. Logged [[D1851]] rather than freezing
  the stale White-relative story-title declaration into the registry.
- 2026-08-27: [[D1851]] closed under the implemented F1/D667 contract: the Story-title manifest
  now declares the learner-relative behavior production already used, with a regression over both
  opposite-side output and declaration prose.
- 2026-08-27: amended after the independent return. D1921/D1922 now have a fourteen-arm executable
  candidate: canonical selected-member identity, exact nested input-value multiset, typed extractors
  set-equal to all fourteen live instance projections and anti-forgery. The pass found D1934
  (`exactObject` accepts extras), included its exact-key repair, made mandatory limitations
  deterministic, replaced the co-mutable snapshot with append-only staged/first-parent history and
  claimed run-schema 0.24 for durable Review receipts. Process-register reconciliation still
  blocks repeat acceptance.
- 2026-08-27: closed the D1923 authoring gap with one literal 39-row migration artifact, set-equal
  to the stable member seed. Every definition carries mandatory limitations and resolves to live
  projection and/or implementation witnesses at immutable snapshot `62a5731f`. The pass found and
  repaired two missing literal-identity witnesses (D1935) and added the migration-only
  `landed_contract` authority after proving the original union misclassified recorded, bounded
  search and product-composition contracts (D1936).
- 2026-08-27: executed the D1924 deterministic limitation, D1925 append-only history and D1926
  persistence cores. Persistence tracing found D1937: the run stores no semantic payload graph or
  event hash chain, so unkeyed digests can be forged self-consistently. Added Ed25519 origin
  attestation, explicit unknown-origin behavior and key rotation/export trust boundaries; the
  candidate rejects ref/input mutation even after digest recomputation.
