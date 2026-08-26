# Open/half-open file state and heavy-piece access

**Question.** Are the shipped open/half-open file primitives complete enough for strategy modules,
Review, bots, authored drills and longitudinal style, or is a source/event relation still missing?

**Verdict.** The narrow file predicates are correct and complete for authored state, and their
exact pawn membership derives from the shipped pawn-connectivity source. Keep both. The missing
primitive is a distinct played event: a pawn leaves a file and newly exposes an open/half-open
file to a stationary rook or queen. It is not the same event as moving a heavy piece onto a file,
and it is more discriminating in both fixed populations. Neither event implies activity, value,
control, intent or move quality. `[V]`

## Method

The disposable Node-24 harness in `tools/d1732-file-activity-harness/` derives, per file, exact
white and black pawn squares from `pawnConnectivityReading`. It proves the resulting open and
color-relative half-open booleans set-equal to both legacy predicates across every fixed
authored/imported before/after position. It then measures exact rook/queen occupancy, the shipped
moved-heavy event, and a stationary-heavy reveal over every played edge and every distinct legal
alternative. `[V]`

The harness uses the repository's fixed denominator: 754 authored decisions with 19,639 distinct
alternatives, and 579 imported decisions with 18,842 alternatives. Lift is played firing rate /
alternative firing rate; it is a selection clue, not a move grade. `[V]`

## State source

The current predicate boundary is exact:

```text
open(file) = no white pawn and no black pawn on file
halfOpen(color,file) = no own pawn and at least one opponent pawn on file
```

An open file is therefore not simultaneously a half-open file for either color. The synthetic
controls pin that distinction. `pawnConnectivityReading` already retains every pawn square inside
its islands, so a second board scan and a second pawn ontology are unnecessary. `[V]`

| population | unique positions | open file states | color-relative half-open states | rook/queen occupancies on eligible files |
|---|---:|---:|---:|---:|
| authored | 643 | 1,758 | 604 | 552 |
| imported | 1,152 | 577 | 1,877 | 1,222 |

The legacy `{file}` / `{color,file}` readings are the complete narrow predicate, but not the
complete source receipt for a transition or explanation: they cannot name which pawn left, was
captured, or remains on the opponent half-open file. `[V]`

## Two different access events

The shipped `derived.activity.event.open_file_occupancy` requires a rook/queen to move from a
non-eligible source file onto an already eligible destination file. Its explicit limitation says
stationary-piece file-class changes do not fire. `[V]`

| population | moved heavy piece: played / alternatives / lift | stationary access revealed: played / alternatives / lift |
|---|---:|---:|
| authored | 19 / 353 / **1.40×** | 27 / 289 / **2.43×** |
| imported | 26 / 682 / **1.24×** | 35 / 297 / **3.83×** |

The missing case is stable, non-vacuous and sharper in both populations. It is also a different
causal relation. A moved-piece event answers “this rook/queen entered an eligible file.” A
stationary reveal answers “this exact pawn change made the file eligible for this retained
rook/queen.” Merging them behind optional operands would prevent a module from naming the cause
truthfully. `[V]`

Played stationary reveals split as follows: authored 18 queen + 9 rook, all newly half-open;
imported 19 queen-half-open, 11 rook-half-open, 4 queen-open and 1 rook-open. The corpus mix does
not define the schema: both roles and both resulting classes remain required fixtures. `[V]`

## Successor contracts

File state is a derived view of the exact pawn source introduced by D1728, not another collector:

```text
rules.pawn.reading.file_state@1
  fen
  files[]
    file
    whitePawns[] + blackPawns[]
    open
    halfOpenFor[]
```

The transition retains both exact states and the edge:

```text
rules.pawn.event.file_state_changed@1
  beforeFen + moveUci + afterFen
  file
  beforeState + afterState
  movedPawn? + capture?
```

The missing activity event then derives from that source:

```text
derived.activity.event.file_access_revealed@1
  beforeFen + moveUci + afterFen
  retainedPiece { square, color, role: rook|queen }
  file
  beforeState + afterState
  resultingClass: open_file | half_open_file
```

The existing moved-piece event remains distinct. Both consume the same canonical file-state
identity. “Controls the file,” “active rook,” “good move,” “should occupy” and strategic plans are
outside these collectors; they require square-control, legal consequence, evaluation or cited
theory joins.

## Consumer boundary

- **Requested sight:** selected file or heavy piece may show exact pawn absence/presence and the
  literal file relation; no automatic strategic verdict.
- **Postcommit Support:** may name the moved pawn and the stationary rook/queen whose access was
  revealed. The module decides whether this event outranks other facts.
- **Review:** moved-entry and stationary-reveal are separate moments with separate highlights.
- **Drills:** existing open/half-open predicates stay byte-compatible. New guided claims may bind
  the exact file-state/access event without rewriting unrelated packs.
- **Bots:** candidate vectors may consume both literal events as separate declared features.
- **Style/skills:** count opportunities and responses by phase over the longitudinal store; a raw
  file-state census is not a trait.
- **Advanced:** may show all file states and exact pawn membership.

## Repair order

1. Reuse D1728's exact pawn-file authority to derive file states; do not scan/define pawns twice.
2. Register exact file-state changes and the stationary-access derivation with independent
   open/half-open and rook/queen fixtures.
3. Keep the shipped moved-entry event intact and test that neither event impersonates the other.
4. Bind D1710 production operations and D1711 semantic fixtures before module/bot activation.
5. Amend module-registration per D1726 so ordinary workflows select these exact relations while
   the legacy full file census remains Advanced/author compatibility.

## Gate result

The exploration gate is open. Static truth is reproduced exactly from one shipped source, the
missing event fires and abstains over both fixed populations, both signs/classes can fail in
fixtures, and its selection signal is measured. No production, RFC, schema, pack, content or
learner-UX byte changed. `[V]`
