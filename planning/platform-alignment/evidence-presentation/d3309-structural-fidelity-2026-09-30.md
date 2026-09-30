# D3309 — structural Inspector fidelity boundary

**Status:** implementation finding and proposed amendment; not an accepted projection-version change.
**Measured at:** `e33869ce` on 2026-09-30. **Owner:** `rfc/evidence-presentation.md` with the
versioned evidence contract. This note does not authorize rewriting an existing projection.

## Why a renderer swap is wrong

`DrillScreen.svelte` currently calls `positionStructureEvidence(rawStructure)` and renders each
observation with `renderStructuralObservation`. That helper has already admitted the reading for
`inspector.position_structure@1`, but it discards the evidence identity after admission. The exact
presentation adapter (`presentation-consumer-adapters.ts`, `structuralCaption`) then retains only
`kind` and `squares` and says `Position reading: …`. The current visible section retains more chess
facts. The served Pack-B browser journey asserts “White has 7 pawns,” “Black has 7 pawns,” and a
bishop on d3 standing on a light square. The generic adapter cannot state any of those facts.

The source factory already computes them in `structure.ts:computeStructuralReading`; the loss is in
the declared `rules.structural.reading.<kind>@1` operands (`evidence-catalog.ts`, the mapped
`structuralOutputs` declaration) and in the presentation adapter, not in chess detection. The
versioning rule is `rfc/archive/evidence-contract-manifest.md` §4.2: a change to declared operands
increments the projection version. `rfc/evidence-value-authority.md` §3.3 applies that rule to the
existing `named_structure@1` → `@2` successor. Adding the missing fields to these sixteen `@1`
declarations in place is therefore not a legal shortcut.

## Exact affected population

`STRUCTURAL_FEATURE_KINDS` has eighteen members. `pawn_count` is matcher-only/retired and has no
emitted reading; `named_structure@1` is retired and its rich `@2` successor already exists. The
remaining sixteen have computed `@1` factories in `evidence-factories.ts:STRUCTURAL_READING_FACTORIES`.
Every one needs more than `kind`/`squares` to preserve the current Inspector sentence:

| Family | Additional observed operands needed for its current sentence |
|---|---|
| backward_pawn, isolated_pawn, doubled_pawn, half_open_file | `color`, `file` |
| open_file | `file` |
| passed_pawn, outpost | `color` |
| pawn_safe_square | `color`, `detail` (`safe`, bounded push/capture attacker steps and source basis) |
| bishop_on_shade | `color`, `shade` |
| line_blockers | `count` |
| direct_attack_count | `color`, `count` |
| piece_reach_count | `color`, `role`, `count` |
| king_opposition | `color`, `form` |
| piece_count | `color`, `role`, `count` |
| king_zone | `color`, `zone` |
| piece_distance | `role`, `count` |

The baseline `squares` remain necessary where emitted; this table names *additional* fields. The
`pawn_safe_square.detail` arm must preserve the maximal-reach caveat and cannot be rendered as a
legal-move forecast. `structure.ts:StructuralObservation` is broad/optional, so v2's presentation
parser must require the fields by kind rather than accept one permissive bag of optionals.

## Proposed versioned migration for RFC review

1. Keep all sixteen `@1` declarations, factories, consumers and renderers byte-stable. Add sixteen
   `@2` reading declarations with kind-specific operands and FEN-computed source factories. Do not
   broaden their grounding into strategic value, move quality or relevance.
2. Split the shared `allStructuralReadingIds` binding: `board.selected_square_sight@1` may retain
   its narrow `@1` square views; `inspector.position_structure@1` accepts the detailed `@2` views
   plus the existing `named_structure@2`. `CompareView` also uses this exact Inspector consumer and
   must migrate with `DrillScreen`, not remain a hidden v1 call site.
3. Use one closed, kind-partitioned fact renderer over the exact admitted `@2` payload. It must
   preserve at least the currently stated side, square, count, role, file, shade, opposition form
   and maximal-pawn-reach qualification. It must never infer usefulness or a recommended move.
4. Positive fixtures: real FENs for all sixteen kinds, the Pack-B visible seven-pawn/light-square
   assertions, and a typed component at the opened Inspector section and in Compare. Negative
   fixtures: missing/mismatched kind-required operands, malformed nested pawn-safety detail, a
   forged component sentence, and a v1 reading presented to the v2-only Inspector binding.
5. Only after these pass, replace `DrillScreen`'s raw loop with sealed presented items, preserving
   collapse and no-reading states. No new permission or learner-facing proactive module is implied.

The evidence-foundation Claude worktree has an unmerged `evidence-catalog.ts` rewrite unrelated to
these operand lines, and the UX worktree changes `DrillScreen` phone layout. Recheck both before
editing their shared files; neither branch is part of this note or the `e33869ce` commit.
