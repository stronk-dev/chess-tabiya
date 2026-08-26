# King-opposition semantic repair — author handoff (D1717)

**Author action, not implementation authority.** The archived `predicate-wave-2` RFC deliberately
defined opposition without checking intervening occupancy. D1717 has now refuted that convention
against three instructional sources and an executable population census. Because the archived RFC
is immutable and the meaning changes, this requires a successor RFC/amendment and new versioned
identities before production code, schema or authored content changes.

## Measured input

`design/research/king-opposition-semantic-boundary.md` and
`tools/d1717-king-opposition-harness/` establish:

- the necessary source relation is aligned kings, one intervening empty square for `direct` or
  three/five intervening empty squares for `distant`, and the opponent of the controlling color to
  move;
- `between(ownKing, enemyKing) ∩ occupied` must be empty;
- the shipped predicate emits 90 observations over the fixed 754 authored + 579 imported
  decisions; 61 are unobstructed and 29 are blocked;
- authored splits 73 current / 61 unobstructed / 12 blocked; imported splits 17 / 0 / 17;
- all 73 authored observations happen to be endgame positions, but imported observations appear
  in opening, middlegame, endgame and unclear phases. Phase concentration is not a source rule;
  and
- authored JSON contains eight `king_opposition` leaves across exactly two documents:
  `content/drafts/pawn-opposition-convert.json` and
  `content/shapes/pawn-opposition-key-squares.json`.

## Contract to author

1. Supersede the current opposition convention with an **unobstructed linear opposition v2**
   contract. Its exact operands are both king squares/identities, controlling color, side to move,
   form, the ordered/interpretable between-square set, and proof that every between square is
   empty. The fact carries no claim that the position is won, forced, important or best.
2. Publish new `@2` identities for the structural reading, signed event and D1718 avoidance
   derivation. `@1` remains readable as historical/research evidence and cannot satisfy v2 event,
   validation or learner-module eligibility.
3. Give authored structural predicates an explicit versioned convention rather than changing the
   meaning of the existing unversioned JSON leaf in place. Recommended wire shape: retain
   `kind: "king_opposition"` and add a closed convention discriminator whose legacy/default member
   preserves v1 and whose new member selects unobstructed v2. Claim the required drill-pack and
   shape-entry schema lanes, update both duplicated grammars, and migrate all eight authored leaves
   only after checking their intended reachable positions against v2.
4. Keep phase and significance out of the source predicate. Endgame-only Support/campaign/pack
   presentation is a consumer selector over the truthful source fact, with an honest suppression
   receipt; it must not rewrite the source as false outside endgames.
5. Feed v2 into D1718's subject-first avoidance grammar using the color-identified king pair as the
   root subject. Count distinct legal supporting moves for that exact root subject/outcome. Never
   derive v2 avoidance from the current retained `@1` alternative-event array.
6. Add the new identities to D1711's executable validation authority only after the fixtures below
   run through the production emitter. The old v1 defect witnesses remain excluded from learner
   admission.

## Able-to-fail criteria

- Direct empty-line and three-/five-square distant positives, horizontal and vertical, both
  controlling colors.
- One occupied between square refuses direct, distant-three and distant-five forms even when every
  other operand matches.
- Turn reversal, even gap, misalignment and wrong-color cases refuse.
- The legal D1714 nearly full-material opening is a v2 source/event negative, not a phase-based
  rejection.
- The fixed population receipt reproduces 90 current, 61 v2 and 29 blocked observations, including
  imported 17/0/17. Input and result digests are bound by D1711 rather than copied as prose.
- All eight authored leaves are classified as migrated-v2 or intentionally legacy-v1; no implicit
  default change is permitted. Pack/shape checks and an actual predicate trace cover both classes.
- A consumer endgame filter may suppress a truthful non-endgame v2 fact without changing the
  source result or admitting it through another surface.
- Manifest declarations, source adapters, event producers, validation profiles, module accepts and
  consumer bindings are set-equal for the new `@2` identities; no stale `@1` learner binding remains.

## Explicit non-goals

- No diagonal/rectangular opposition, corresponding-square solver or key-square verdict.
- No claim that opposition wins, draws, forces a line or is the best plan.
- No material cutoff inside the source collector.
- No silent rewrite of archived RFC text, historical evidence or authored JSON semantics.

## Landing order

Author and independently review this semantic/schema successor; serialize its schema claim; land
the v2 source/predicate and content migration; bind its executable validation profile through
D1711; then let D1718/D1719 land v2 avoidance and learner modules consume it. Until that sequence is
complete, `king_opposition` avoidance remains research-only.
