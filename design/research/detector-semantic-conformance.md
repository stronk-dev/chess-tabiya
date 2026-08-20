# Detector semantic conformance — the shipped matcher, reader and consumer are not one contract

**Question:** Which of the 18 structural and six transition families currently have a stable,
operand-preserving meaning suitable for authoring, inspection or learner guidance?

**Status:** answered `[V]` for the shipped code and current corpus at commit `1e19c67`; semantic
learner usefulness still requires the per-consumer R3/R7 studies. This dossier does not define a
universal chess ontology or authorize product implementation.

**Instrument:** `tools/detector-conformance-harness/`; raw result:
`tools/detector-conformance-harness/output.md`.

## Result

The schema enum is not a semantic contract. It currently names three different things:

1. predicates authors can place in a pack or shape;
2. observations the generic structural/transition readers happen to emit; and
3. prose/marks that generic client sinks render without a per-family admission decision.

Only **11/18 structural families round-trip** between the predicate and reading surfaces. Three are
reader subsets, three are lossy, and `pawn_count` is matcher-only. All **six transition families are
lossy**: 3,371 observations across the current committed corpus preserve **zero affected squares**.
Five production sinks accept whole generic readings rather than declaring which producer/version
they can safely present. Therefore **zero complete detector families are unconditionally
learner-eligible today**. Exact atoms remain useful for an explicit inspector or a named authored
condition; a learner module still needs semantic eligibility, operand preservation, local selection,
budget and consumer validation. `[V]`

This sharpens rather than reverses R1/R2. R1 separated exact atoms from conventions and semantic
events; R2 proved local distinctiveness does not establish teaching significance. This pass proves
the current *interfaces* cannot yet carry the evidence record D618 requires even when the underlying
arithmetic is exact. `[V]` (`design/research/detection-landscape.md` §§3, 6;
`design/research/selection-sign-and-significance.md`; D618)

## Method and population

The disposable register enumerates all 18 values of `STRUCTURAL_FEATURE_KINDS` and all six values
of `TRANSITION_FEATURE_KINDS`. For every family it records the literal code computation,
matcher/reader fidelity, current safe disposition and blocking limitation. Closure tests fail if an
enum or register changes alone. `[V]` (`packages/schema/src/drill-pack/types.ts`;
`tools/detector-conformance-harness/registry.ts`)

Every structural matcher receives one explicit positive and one hard-negative FEN fixture. The
transition arm walks all **754 committed transitions from 50 packs**, covering **643 distinct
positions**, and requires a positive witness plus an exact-count negative for every emitted count
leaf. All four irreversibility subkinds are witnessed. The run also scans all JSON under `content/`
for literal authored use and pins the five generic reader sinks by source assertion. `[V]`
(`tools/detector-conformance-harness/audit.test.ts`, `fixtures.ts`, `output.md`)

These fixtures prove current implementation semantics, not whether a chess teacher would endorse
the label. Strategic conventions remain conventions and semantic tactics remain outside this
vocabulary. `[V]` for the test boundary; `[M]` for the refusal consequence.

## Structural conformance

| Contract class | Families | Consequence |
|---|---|---|
| Round-trip exact state atoms | `isolated_pawn`, `doubled_pawn`, `passed_pawn`, `open_file`, `half_open_file`, `line_blockers`, `direct_attack_count`, `piece_count`, `king_zone` | Eligible for a raw inspector and as inputs to a later event; not automatically important, good or bad |
| Round-trip declared conventions | `backward_pawn`, `king_opposition` | Usable as versioned authored conditions; learner wording must disclose the convention and add no valence |
| Reader subset | `outpost`, `bishop_on_shade`, `piece_distance` | Matcher capability and evidence capability must receive separate projections/versions |
| Lossy | `pawn_safe_square`, `piece_reach_count`, `named_structure` | Rename/version or retain missing identity before consumer admission |
| Matcher-only | `pawn_count` | Cannot be advertised as a reading; deprecate in favour of `piece_count(role=pawn)` or explicitly add a reader |

`[V]` (`packages/runtime/src/structure.ts`; conformance registry and fixtures)

Two distinctions are especially important for pack stability:

- `outpost` is not merely a noisy observation. The matcher accepts a supported *empty* square,
  while `structuralReading()` considers only occupied non-pawn/non-king squares. It also delegates
  its pawn-safety condition to the D566 projection. A shape predicate and a hover observation can
  therefore disagree while both truthfully say `kind: outpost`. `[V]`
- `piece_reach_count` is a role-level `any/every` predicate but a per-piece reading;
  `piece_distance` supports five roles in predicates but emits only king-to-king distance; and the
  generic `named_structure` observation drops the catalogue ID retained in the separate
  `structures` array. These are projection differences, not missing enum members. `[V]`

The corpus exposure is already non-zero. `outpost` occurs **23 times across three content
documents**, `named_structure` 14 times across nine, and `piece_distance` twice across two packs.
No document names `pawn_safe_square` directly, but all 23 outpost expressions depend on its current
boolean. A migration census based only on literal kind names would therefore report zero D566 users
while changing three documents' truth sets. `[V]` (`output.md`; D632)

## Transition conformance

All 14 declared leaf/direction combinations fire in the committed corpus, so this is not a dead-
vocabulary result. The problem is operand erasure. `[V]`

| Family | Literal scope | Information lost before `transitionReading()` |
|---|---|---|
| `attacked_squares_changed` | shared enemy-occupied targets crossing zero/non-zero pseudo-attackers | target squares and attacker identities; captures/new occupants excluded |
| `defended_squares_changed` | shared friendly-occupied targets crossing zero/non-zero pseudo-defenders | target squares and defender identities; moved/captured/new pieces excluded |
| `slider_lines_changed` | shared slider-to-edge keys whose blocker count changes | slider, ray, blocker and affected target; added/removed sliders excluded |
| `escape_squares_changed` | geometric destinations gained/lost by every piece that remains on its square | piece and destination identities; legality/pins; the kind name suggests a narrower object |
| `defended_duties_changed` | stationary piece crosses a two-attacked-allies threshold | defender and both duties; no overload/consequence is established |
| `move_irreversibility` | priority result plus separately emitted halfmove-clock reset | simultaneous lower-priority property and subkind-specific exactness |

`[V]` (`packages/runtime/src/transition.ts`; `output.md`)

The first two helpers actually compute target-square arrays, but `counts()` stores only lengths.
The observation type permits `squares`, yet **0/3,371** current observations populate it. A board
overlay cannot show what changed, a theory lookup cannot key the event, and an LLM cannot legally
recover the missing subject/object under law 8. `[V]` (D630)

`move_irreversibility` is also not one uniform family. On the legal fixture `d4e5`, a white pawn
captures Black's last queen and creates pawn contact. The reading emits `clock_zeroed` and
`last_of_role`, but not `pawn_break`, because `irreversibility()` returns at the first matching
branch. Castling has the separate imported-UCI defect D547. A future evidence contract should
publish independent, versioned rules events rather than preserve this priority as an exhaustive
family. `[V]` (D633; harness priority control)

## Consumer audit

The following source assertions all pass: `[V]`

- `apps/server/src/guidance.ts` assigns every structural feature to the evidence packet;
- `DrillScreen.svelte` renders every structural and transition observation in its evidence region;
- the same screen's selected-square lighting filters only by square membership;
- `CompareView.svelte` renders the complete structural reading at branch leaves; and
- `compare-strips.ts` diffs complete readings before any family-specific semantic admission.

The deterministic sentence functions are often candid—`piece_reach_count` says pins/check are not
evaluated and transition rows call themselves geometric censuses. That is better than invented
coaching, but a correct disclaimer does not turn an 80-row raw census into a useful nudge. `[V]`
(`apps/web/src/lib/structural-sentences.ts`, `transition-sentences.ts`; D542/D583)

This is the exact gap D617's compiled producer→evidence→consumer manifest must close. A kind must
not become learner-visible merely because it is serializable and has a renderer. The inspector may
legitimately expose all raw atoms; authoring may legitimately use a disclosed convention; Review,
Support, Theory-only and Guided Rehearsal may admit different semantic projections and budgets.
`[M]` synthesis from D617–D619 and measured generic sinks.

## Decisions this permits

1. **Keep raw facts without promising they are hints.** The 11 round-trip structural atoms can
   remain inspector inputs and authored operands while the learner surface is rebuilt. `[M]`
2. **Version matcher and reader projections separately.** One enum value cannot stand for a broad
   author predicate, a narrower observation and a semantic event. `[M]`
3. **Require identity-preserving transition events before tactical modules.** D630 is a foundation
   dependency for touch highlights, discovered-line explanations, overload candidates and theory
   links. `[M]`
4. **Traverse semantic dependencies during migration.** Repairing `pawn_safe_square` must recheck
   the three documents using `outpost`; literal token counts are insufficient. `[V]`/`[M]`
5. **Use subkind-level admission.** `last_of_role`, castling, clock reset and pawn contact need
   separate contracts and tests; admitting `move_irreversibility` as one family is too coarse. `[M]`

## Decisions this refuses

1. Declaring “the current 18+6 primitives are ready” because every enum branch is exhaustive or
   every family fires somewhere. `[V]`
2. Expanding packs against `outpost`, `piece_reach_count`, `piece_distance` or transition counts
   without naming which projection/version the pack requires. `[V]`
3. Feeding current count-only transitions to an LLM and asking it to infer the piece, square,
   cause, tactic or advice. That violates law 8 and cannot be made safe by prompt wording. `[M]`
4. Treating exact literal atoms as universal live hints. Learner eligibility remains a
   consumer-specific decision after R3/R7, not a property of the arithmetic. `[M]`

## Roadmap consequence

This pass closes D629's research instrument but does **not** clear O2 or Gate F. It supplies the
current-family input to F1/F2:

- F1: compile separately versioned producer outputs, predicate projections and consumer joins;
- F2: preserve typed operands/sign/abstention and admit semantic events per module;
- F3: dry-run dependency-aware migrations, including the indirect D566→`outpost` population;
- R7/R8: validate which admitted events make useful Review and theory↔drill modules; and
- the sacrificial official pilot: exercise every required v1 family through authoring, runtime,
  presentation and provider-off/empty paths before D560 lifts.

Phase bands, endgame technique labels, pivotal markers, engine/tablebase/model outputs, theory
records, authored claims and future tactic detectors are deliberately outside this 24-family
register. They remain separate producer planes and must enter the same compiled manifest; this
dossier does not pretend an enum audit completed the whole evidence architecture. `[V]` scope;
`[M]` roadmap synthesis.
