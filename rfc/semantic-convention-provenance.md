# RFC: Semantic convention provenance — definitions survive collection, derivation and disclosure

- **Status:** draft — 2026-08-27; authored from the completed D1722 research and awaiting
  independent buildability review
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
- **Planning:** `planning/semantic-convention-provenance/` (once implementing)

```tabiya-claims
none
```

The claim block is intentionally `none` while this document is a draft. This RFC creates a seventh
shared resource, `semantic-conventions`; the current checked claim grammar knows only six. The
reviewed 39-member initial census is published in §1.2 and the exact process repair is
`semantic-convention-register.md`. Before acceptance, that register/checker must land and this block
must become its set-equal membership claim. A private
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
  | Readonly<{ kind: "published_source"; citation: string; licence: string }>
  | Readonly<{ kind: "product_rule"; rulingRef: string }>
  | Readonly<{ kind: "measured_record"; recordRef: string }>;

export interface ConventionDeclaration {
  readonly ref: ConventionRef;
  readonly definition: string;
  readonly limitations: readonly string[];
  readonly authority: readonly ConventionAuthority[];
  readonly disclosure: Readonly<{
    summary: string;
    detail: string;
  }>;
}

export interface CompiledConventionRegistry {
  readonly declarations: readonly ConventionDeclaration[];
  readonly digest: string;
}
```

`compileConventionRegistry` freezes and orders declarations by `(id, version)`, rejects duplicate
refs, blank definition/limitations/disclosure, unsupported authority shapes, and any citation or
ruling reference the repository's existing source grammar cannot resolve. The digest covers every
semantic field, not file path or declaration order.

The compiler also compares the current registry with a checked previous-release snapshot. The same
`id@version` with different semantic bytes raises `CONVENTION_MEANING_CHANGED_IN_PLACE`, even if a
manifest/receipt digest was refreshed. Removal is permitted only through an explicit retained
`retired` declaration that names its successor or refusal reason; historical evidence must remain
readable.

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
never enter the register. The `story-title@1` declaration is also blocked on [[D1851]]: production
is learner-relative after D667, while the manifest prose still says White-relative; the migration
must repair that declaration before the registry snapshot freezes it.

### 2. Projection declarations and path closure

`ProjectionDeclaration` gains:

```ts
readonly conventions: Readonly<{
  direct: readonly ConventionRef[];
  instanceOperands?: readonly string[];
}>;
```

`direct` names fixed definitions applied by the projection itself. `instanceOperands` is required
only when different payload instances of one projection may select different registered
conventions. Every named operand must already be in `projection.operands`, and the retained value
must parse as an exact registered `id@version` ref.

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

`DeclaredEvidence` remains producer/projection sealed. After manifest admission, the compiler
attaches an immutable `ConventionReceipt` containing:

```ts
export interface ConventionReceipt {
  readonly path: number;
  readonly refs: readonly ConventionRef[];
  readonly registryDigest: string;
}
```

Only the evidence compiler can construct the receipt. A caller cannot add, drop or replace refs by
object spread, JSON round-trip or type assertion; the runtime seal check fails before rendering.
Reducer and module narrowing preserve the exact receipt of every retained fact.

Registered evidence renderers may request convention disclosures from the compiled registry. The
result is a typed renderer output, not caller prose:

```ts
export interface RenderedConventionDisclosure {
  readonly refs: readonly ConventionRef[];
  readonly summary: string;
  readonly detail: string;
  readonly registryDigest: string;
}
```

Deterministic screen output and an external voice request derive from the same rendered item and
receipt. `voiceCheck` includes the registered disclosure in its allow-list. A provider may shorten
or rephrase it within the normal evidence rules; it may not invent a definition, strip a limitation
or substitute another convention.

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

### 7. Implementation order

1. Extend the shared-resource claim grammar/register with `semantic-conventions` and publish the
   reviewed initial member table.
2. Land the convention compiler, previous-release snapshot and projection declaration field.
3. Migrate every current projection and source adapter; produce a zero-unresolved closure report.
4. Bind receipts through admitted/reduced/rendered/provider views.
5. Land opposition/backward-pawn and avoidance successor RFCs on the stable contract.
6. Bind executable semantic validation and only then activate modules, Review, bots and packs.

No content migration occurs in steps 1–4.

## Deviations from design

None. This makes the existing grounding and “LLM renders validated evidence” laws enforceable. It
does not add a learner-facing evidence settings surface or strategic judgement.

## Acceptance criteria

1. `semantic-conventions` is a checked shared-resource register; its landed/live/tree member sets
   agree, and the RFC's claim block no longer says `none` before acceptance.
2. Registry compilation rejects duplicate, missing and orphan refs, blank semantic fields and an
   unresolved authority reference.
3. Mutating a registered definition at the same `id@version` fails against the previous-release
   snapshot even after all generated digests are refreshed.
4. Every compiled projection declares convention applicability. All
   `grounding: declared_convention` projections have a non-empty closure.
5. The exact D1722 42-row population and 18-row other-grounding population are migrated or receive
   an explicit checked `not_applicable` disposition; the closure report has zero unresolved rows.
6. Backward-pawn and king-opposition predicate, reading and event chains resolve to their legacy
   refs, while a v1 evidence item fails a synthetic v2 consumer.
7. `square_clearance_observed` compiles with recorded-run provenance plus
   `observed-window@1`; deleting either the source closure or composition ref fails.
8. An alternative derivation fixture executes two paths and proves each receipt contains only the
   conventions of the path actually used.
9. An instance-varying source adapter cannot omit or forge its retained convention operand; a
   fixed projection-level convention needs no payload duplication.
10. A derived projection cannot omit an input ref, add an undeclared ref or widen grounding,
    exactness, confidence or answer content through a convention declaration.
11. A forged, spread, JSON-round-tripped or stripped `ConventionReceipt` fails the existing
    admitted/rendered-item seal before deterministic or provider rendering.
12. Deterministic output and the external voice body carry byte-equal refs/disclosure; an
    unregistered disclosure sentence fails `voiceCheck`.
13. Ordinary module fixtures contain no raw projection/convention id; the Advanced inspector shows
    the exact refs, definition, limitations and authorities.
14. The convention disclosure does not widen answer distance, assistance timing, seat permission
    or board-visible forms.
15. `make evidence-manifest-check`, semantic evidence checks, typecheck, software tests,
    governance checks and the external-provider negative suite pass on Node 24.
16. Canonical evidence docs describe direct/path convention closure and the ordinary-versus-
    Advanced presentation boundary; D1722 is closed with the implementation SHA and a log entry.

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

## Changelog

- 2026-08-27: created from D1722's measured 42 + 18 populations and author handoff. Defines a
  separate convention closure, path-specific derivation, sealed disclosure, version/migration law,
  exact 18-row classification and the shared-resource-register prerequisite. Claims no current
  resource while draft; acceptance requires the new membership register and exact claim.
- 2026-08-27: published the executable 39-member seed census (23 existing identities plus 16
  identities for shipped meanings), excluded two non-semantic version tokens, and corrected grade
  context from an invalid pseudo-version to a retained operand. Logged [[D1851]] rather than freezing
  the stale White-relative story-title declaration into the registry.
