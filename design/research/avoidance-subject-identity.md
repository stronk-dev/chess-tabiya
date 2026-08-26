# Avoidance subject identity — family/sign frequency is not an exact avoided outcome

**Question:** Does the current thirteen-family counterfactual-absence selector retain enough
identity to support truthful learner-facing “you avoided …” evidence, and what total grammar would
make it safe?

**Status:** answered `[V]` at 2026-08-26 HEAD for the shipped selector and fixed authored/imported
populations. The current output is useful as broad research prevalence, but not as exact avoidance
evidence. It groups by family/sign, drops same-move subjects, and retains no played/root outcome
join. A successor must enumerate root subjects and typed outcomes before counting moves.

**Instrument:** `tools/d1718-avoidance-subject-harness/`. The opt-in census replays 754 authored
and 579 imported decisions through the actual `selectLocalSemanticEvidence` operation, including
every legal alternative and the experimental policy's top-two cap. Default cases pin the all-family
grammar, the D1716 isolated-pawn counterexample and a twelve-subject same-edge collision.

## What the current selector measures

`familyKey` is exactly `projection@version:sign`. Alternative events enter one map under that key;
the selector retains at most one event for each `moveUci`, divides those move entries by the number
of legal alternatives and emits a family-level absence when the played edge has no event with the
same family/sign. `[V]` (`packages/runtime/src/semantic-evidence.ts:982-1037`)

That computation can truthfully answer a research question such as “what share of alternatives
had some `isolated_pawn:preserved` transition?” It cannot answer which file/pawn the alternatives
refer to, whether the played child still has the condition elsewhere, or how many subjects within
one alternative supported the outcome. `[V]` (D1718 cases 2–3)

Across the current policy's selected top two facts, avoidance appears **790 times**: 462 across 754
authored decisions and 328 across 579 imported decisions. Nine of thirteen families appear; the
current fixed populations select zero `half_open_file`, `king_opposition`, `passed_pawn` or
`piece_count` avoidance facts. Zero here is observed reach under this policy/corpus, not proof the
mechanism cannot fire—D1714 has exact mechanical positives for the latter families. `[V]` (D1718
full census; `design/research/semantic-authority-empty-execution.md`)

The policy cap matters: these are facts that survive `maxFacts: 2`, not the complete candidate
population and not chess prevalence. `[V]` (`packages/runtime/src/evidence-catalog.ts:991-998`)

The root-key replay distinguishes two child checks. **Family** means the played child still has at
least one active/retained state in the source family. **Subject** means it has the exact retained
alternative root subject plus predicate parameters; it does not yet assert the same numeric value
or transition relation.

| Family | Authored selected / family / subject | Imported selected / family / subject |
|---|---:|---:|
| `backward_pawn` | 2 / 0 / 0 | 0 / 0 / 0 |
| `doubled_pawn` | 2 / 0 / 0 | 6 / 0 / 0 |
| `half_open_file` | 0 / 0 / 0 | 0 / 0 / 0 |
| `isolated_pawn` | 1 / 1 / 0 | 0 / 0 / 0 |
| `open_file` | 0 / 0 / 0 | 1 / 0 / 0 |
| `king_opposition` | 0 / 0 / 0 | 0 / 0 / 0 |
| `king_zone` | 3 / 0 / 0 | 0 / 0 / 0 |
| `line_blockers` | 173 / 173 / 171 | 91 / 91 / 91 |
| `passed_pawn` | 0 / 0 / 0 | 0 / 0 / 0 |
| `piece_count` | 0 / 0 / 0 | 0 / 0 / 0 |
| `direct_attack_count` | 142 / 125 / 108 | 69 / 69 / 67 |
| `loose_piece` | 133 / 5 / 3 | 156 / 16 / 4 |
| `pawn_islands` | 6 / 6 / 6 | 5 / 5 / 5 |
| **Total** | **462 / 310 / 288** | **328 / 181 / 167** |

`[V]` (D1718 frozen baseline). Combined, 491/790 selected facts retain the broad family and
455/790 retain the exact condition key. **Thirty-six** retain the family only on another subject,
the measured generic-wording collision class. The 455 exact-key cases are not automatically
wrong: the played value/relation may differ truthfully. They prove why an id alone is still
insufficient and both child values must be retained. Numeric families such as blocker count and
pawn-island count naturally retain their subject while changing value. `[M]`

## The two distinct identity failures

### 1. The played child is never joined to the selected subject

On the exact authored `a4b5` edge from
`r1b1r1k1/1p4pp/2p1pq2/1p1p4/P2P4/2QBP3/5PPP/1R3RK1 w - - 0 19`, the move removes White's
a-file isolated-pawn state and creates one on the b-file. All 41 alternatives preserve the a-file
state. The selector emits generic `derived.semantic_avoidance.isolated_pawn@1`; it carries no
subject or played value. `[V]` (D1718 case 2; D1714 case 4)

The exact subject-specific fact is potentially useful: “41/41 alternatives preserved the a-file
isolation; your move removed it.” The current generic reading “you avoided an isolated pawn” is
false because the b-file condition exists in the played child. The repair is therefore not to drop
negative evidence; it is to retain the root subject and both outcomes. `[M]`

### 2. Subjects are discarded before the receipt is built

The legal edge `d4c5` from
`rnbqkbnr/pp2pppp/8/2ppP3/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4` emits twelve distinct
`direct_attack_count:preserved` observations, over twelve controller-color/target-square subjects.
All share one family/sign/move key. The selector's `values.some(candidate.anchor.moveUci ===
event.anchor.moveUci)` keeps one and discards eleven before `alternativeEvents` is sealed. `[V]`
(D1718 case 3; `semantic-evidence.ts:1008-1014`)

Consequently, filtering the retained `alternativeEvents` by a newly added subject field cannot
repair `@1`: the missing same-move subjects and their denominators are already gone. Grouping must
be subject-first, with distinct supporting moves counted afterward. `[M]`

## Total subject/outcome grammar

An avoidance relation needs three separate identities: a root subject, a predicate/value over that
subject, and a transition relation from the common root into each child. Family and sign are only
the outer projection and relation class. `[M]`

| Family | Root subject | Predicate/value | Honest maximum claim |
|---|---|---|---|
| `backward_pawn` | color + file | boolean file state | named color/file state changed or persisted |
| `doubled_pawn` | color + file | boolean file state | named color/file state changed or persisted |
| `half_open_file` | color + file | boolean file state | named color/file state changed or persisted |
| `isolated_pawn` | color + file | boolean file state | named file state—not “this pawn” |
| `open_file` | file | boolean file state | named file state |
| `king_opposition` | the two color kings | controlling color + form + applicability + boolean relation | held pending D1717's source repair |
| `king_zone` | color king | zone parameter + membership | same king across child squares |
| `line_blockers` | root slider + ray direction | integer blocker count | count change on that slider/ray |
| `passed_pawn` | color + root pawn | boolean passed state | same pawn across child squares |
| `piece_count` | color + role | integer count | literal material-count relation; no valence |
| `direct_attack_count` | controller color + fixed target square | integer count | square/count only—not a stable target piece |
| `loose_piece` | color + role + root piece | boolean en-prise state | same piece across child squares |
| `pawn_islands` | color | integer island count | literal color/count relation |

`[V]` for current operand availability and event arithmetic
(`packages/runtime/src/semantic-evidence.ts:106-139,325-405`;
`packages/runtime/src/tactics.ts:340-467`); `[M]` for the successor grammar.

For booleans, the complete state transition distinguishes false→true, true→false and true→true.
For integer measures it distinguishes increase, decrease and equality. A transition event alone is
not a total state vector: event absence may mean false, zero, unchanged, unavailable or merely not
emitted, depending on the family. The successor therefore evaluates one declared state function
over the root, played child and every alternative child. `[M]`

## Perspective is not valence

Color and role are part of factual identity. If White moves and an alternative decreases Black's
queen count, the factual relation is an alternative capture White did not make; it is not “White
avoided losing a queen.” Likewise, avoiding a gained backward pawn and avoiding a lost passed pawn
have different practical directions, but neither receives praise or a move grade from the
selector. `[M]`

The derived fact must retain mover/root perspective for a later consumer-specific renderer. That
renderer may state the literal relation within its assistance ceiling; any favorable/unfavorable
claim still needs a separate admitted authority. This preserves ADR-0005/law 8. `[M]`

## Versioning and execution consequence

The `@1` payload's declared operands are only relation, family/sign, legal denominator, broad-family
numerator and the truncated alternative event list. Adding a subject and changing the denominator
would change its meaning. The safe migration is new `derived.semantic_avoidance.*@2` identities,
with `@1` retained as research-only until retired. `[V]` (current adapter at
`packages/runtime/src/evidence-source-adapters.ts:249-254`); `[M]` (versioning consequence)

The successor must:

1. enumerate a declared root-subject domain;
2. evaluate typed root/played/alternative values, abstaining on any incomplete required child;
3. group exact subject + predicate parameters + relation before distinct-move counting;
4. retain complete supporting move/source receipts and both root/played values;
5. keep family/sign prevalence under a separately named research aggregate; and
6. remain research-only until D1711 validates the exact outcome and D1710 emits it through a live
   production operation.

`[M]` The executable author contract is
`planning/evidence-foundation-ux/avoidance-subject-author-repair-2026-08-26.md`.

## Limits

- The census measures selected output under one experimental policy and two fixed populations; it
  does not estimate universal frequency or usefulness.
- Current payloads cannot reconstruct all root subjects after selection. The harness projects the
  strongest root identity available from exact edge operands; the successor contract requires the
  producer to make that identity explicit.
- No external chess label is needed to establish these data-loss defects. Whether a source
  predicate such as opposition is good chess semantics remains separate research.
- No production, RFC, schema, content, pack or learner-UX byte changed.
