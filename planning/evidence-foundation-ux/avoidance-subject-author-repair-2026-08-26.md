# D1716/D1718/D1719 author handoff — subject-safe counterfactual evidence

## Why this is an author action

The implemented selector contract is frozen in `rfc/archive/semantic-evidence-selection.md`.
Its `derived.semantic_avoidance.*@1` facts mean projection/sign frequency across legal alternatives,
not an exact avoided outcome on an exact subject. Changing that meaning in place would silently
reinterpret a versioned evidence identity. Author a successor semantic-selection RFC, independently
review it, and ship new `@2` avoidance projections; keep `@1` research-only until retired.

Authority: `design/research/avoidance-subject-identity.md`, [[D1716]], [[D1718]], [[D1719]], and
the exact D1714 isolated-pawn witness. This handoff does not authorize design-tier edits.

## Contract the successor must close

1. Declare one set-equal `AvoidanceOutcomeDeclaration` for every supported family. Each declaration
   names its source projection, root-subject domain, predicate parameters, value type, transition
   relation and perspective fields. A generic JSON/evidence-digest identity is refused.
2. Enumerate subjects from the common root position before evaluating any child. Piece subjects
   retain root piece identity even when they move; ray subjects retain root slider + direction;
   aggregate and file subjects use their exact declared dimensions.
3. Evaluate the declared predicate/value for the played child and every legal alternative. Binary
   values use false→true / true→false / true→true relations; numeric values use increase / decrease /
   equality. Absence of an emitted transition is not silently treated as a complete state value.
4. Group by exact `(projection, subject, predicate parameters, relation)` before deduplicating by
   move. `alternativesWithOutcome` counts distinct supporting legal moves. The current
   family/sign-first `byFamily` path and its one-event-per-move truncation cannot construct `@2`.
5. Retain the root value, played-child value, typed alternative outcome, complete legal denominator,
   distinct supporting move identities and their source evidence. If any required child is
   unavailable, the complete population abstains.
6. Keep factual outcome, learner perspective and valence separate. Color/role must distinguish
   “avoided losing own material” from “did not capture opposing material”; no avoidance fact grades,
   praises or infers intention.
7. Preserve broad family/sign prevalence only as a separately named research aggregate. It may not
   enter modules, Review, hints, bot traits, longitudinal records, pack conditions or prose as an
   exact avoided outcome.
8. `king_opposition` remains excluded from `@2` until [[D1717]] versions its blocker/applicability
   boundary. A subject-safe derivation over a false source predicate is still false.
9. `@2` remains eligible only for research selection until [[D1711]] binds executable positive,
   semantic-negative, orientation, counterfactual and population authority. Phase-3 module
   activation requires the emitted production operation from [[D1710]] as well.

## Total root-subject/outcome grammar

| Source family | Root subject | Predicate/value |
|---|---|---|
| `backward_pawn` | color + file | file has the declared backward-pawn state (boolean) |
| `doubled_pawn` | color + file | file has the declared doubled-pawn state (boolean) |
| `half_open_file` | color + file | file is half-open for that color (boolean) |
| `isolated_pawn` | color + file | file has the declared isolated-pawn state (boolean); this is not a pawn identity |
| `open_file` | file | file is open (boolean) |
| `king_opposition` | the two color-identified kings | controlling color + form + versioned applicability + relation (boolean); blocked on [[D1717]] |
| `king_zone` | color-identified king | zone parameter + membership (boolean); square is a child value, not identity |
| `line_blockers` | root slider square + ray direction | blocker count on that ray (integer) |
| `passed_pawn` | color + root pawn square | declared passed-pawn state (boolean); child square is a value |
| `piece_count` | color + role | count (integer) |
| `direct_attack_count` | controlling color + fixed target square | direct-attack count (integer); it cannot name a target piece |
| `loose_piece` | color + role + root piece square | exact en-prise state (boolean) |
| `pawn_islands` | color | island count (integer) |

File-state evidence may render a file; it may not say “this pawn” without a root-pawn collector.
Fixed-square attack evidence may render a square/count; it may not name the occupant as the stable
target. Root-piece projections may name the exact piece only after their identity survives every
evaluated branch.

## Required able-to-fail fixtures

- the D1714 `a4b5` edge: isolated-a is removed, isolated-b is created, and no generic “avoided an
  isolated pawn” fact can compile; the exact a-file outcome may compile with its denominator;
- one alternative move emits twelve `direct_attack_count:preserved` subjects; all twelve remain
  available to their own subject groups after distinct-move counting;
- a moved passed pawn and moved king retain root identity while their child squares change;
- two rays from one slider and the same direction from two sliders never merge;
- a capture decreasing the opponent's role count cannot render as avoiding the learner's material
  loss, while the factual color/role/count outcome remains available;
- a family existing on a different played-child subject does not satisfy the selected subject;
- a numeric family distinguishes increase, decrease and equality at the same subject;
- one unavailable alternative produces a typed incomplete-population abstention rather than a
  smaller denominator;
- family/sign aggregation remains executable as a research statistic but fails module admission;
- all thirteen declaration rows are set-equal to the source/derived registry, including an honest
  held disposition for opposition.

## Ordering and consumers

This successor is upstream of D1711 avoidance validation, D1710 production emission, learner
modules, Review opportunity cards, hint selection, longitudinal habits, bot traits and pack
conditions. It does not require content edits. When it lands, consumers migrate by projection
version and only after their own exact acceptance rows exist; no consumer receives an automatic
`@1`→`@2` widening.
