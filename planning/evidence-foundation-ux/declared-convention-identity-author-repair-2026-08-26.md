# Declared-convention provenance closure — author handoff (D1722)

**Author action, not implementation authority.** D1722 finds a missing shared contract between the
implemented F1 manifest, D1711 semantic validation, semantic-selection, candidate packets and
evidence presentation. Do not patch individual renderers or add `conventionId` ad hoc. Author one
shared semantic-provenance amendment/RFC, independently review it, then let the dependent RFCs cite
that boundary.

## Measured input

`design/research/declared-convention-identity-closure.md` and
`tools/d1722-convention-identity-harness/` establish:

- 42 compiled projections declare `grounding: "declared_convention"`;
- 10 carry a top-level machine-readable convention operand, 16 name a version-like convention only
  in prose, and 16 do neither;
- 27/42 have a compiled consumer and two currently reach `guidance.voice_story`;
- 18 additional convention-dependent projections use another scalar grounding—twelve
  source/sibling rows and six derived compositions;
- the compiler accepts an in-place meaning rewrite of `backward_pawn@1`; and
- the compiler rejects truthful `declared_convention` grounding on
  `square_clearance_observed@1`, because a single-grounding derivation is forced to repeat its input
  grounding even when the composition itself adds `observed-window@1`.

## Contract to author

1. Add one compiled `ConventionDeclaration` registry with literal id/version, exact definition,
   limitations and authority/citation basis. It is a shared resource and must be registered and
   checked like other F1 vocabularies.
2. Add direct `conventions` references to projection declarations without replacing the existing
   primary `grounding`. This is a provenance set/closure, not a tenth scalar-grounding patch.
3. Compile the transitive convention closure per derivation member/path. Permit a derived projection
   to declare an additional composition convention even when all inputs share one grounding; refuse
   missing, orphaned, widened or path-laundered convention refs.
4. Bind compiled convention closure into sealed admitted/rendered items. The registered renderer
   supplies optional learner disclosure and the same disclosure enters an external voice request.
   Callers may not invent or strip it.
5. Define the version rule: definition change => convention version; truth-set/convention change for
   a projection => projection version; affected derived/module/pack identities migrate explicitly.
   A refreshed manifest/status digest is not semantic authorization.
6. Classify all eighteen other-grounding candidates individually. Preserve legitimate primary
   groundings while making every convention dependency visible. Correct the known structural
   predicate/reading versus event mismatches.
7. Reconcile D1717 opposition v2 and the later backward-pawn decision through the registry rather
   than private schema prose. Feed exact refs into D1711 validation and D1718 avoidance v2.
8. Give Evidence Presentation a product boundary: named module wording by default; expandable
   “How detected” disclosure; raw ids/definitions only in Advanced inspector. Do not expose the
   convention registry as another learner-facing evidence dump.

## Able-to-fail criteria

- Missing/orphan/duplicate convention declaration or projection ref fails compilation.
- A same-id/version definition mutation fails even when all generated receipts are refreshed.
- Backward-pawn and king-opposition predicate, reading, event and avoidance carry one traceable
  versioned convention chain; old opposition v1 cannot satisfy v2 consumers.
- `square_clearance_observed` compiles with recorded-run provenance plus its declared
  `observed-window@1` composition convention; deleting either arm fails.
- Every alternative derivation path reports the path actually used and its exact convention closure.
- Exact source adapters cannot omit an instance-varying convention operand; fixed projection-level
  conventions resolve from the compiled registry without payload duplication.
- Rendered evidence and the external HTTP body retain registered refs/disclosures; a forged, stripped
  or unregistered disclosure fails the seal/voice boundary.
- A total report replaces the D1722 42+18 review census with zero unresolved convention dependencies.

## Landing order

Author and cross-review the shared convention-provenance contract; land compiler/registry and
sealed-view support; migrate source declarations/adapters; land opposition v2 and other semantic
successors; bind D1711 validation; then activate avoidance, Support/Review/theory/bot consumers and
Evidence Presentation. Content migration follows stable versioned contracts, never precedes them.
