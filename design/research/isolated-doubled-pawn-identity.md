# Isolated and doubled pawn identity boundary

**Question.** Can the existing file-level `isolated_pawn` and `doubled_pawn` readings safely power
ordinary highlights, post-move nudges, Review, style, bots and authored drills, or must the evidence
retain the exact pawns that make each relation true?

**Verdict.** Keep the file predicates for authored compatibility, but do not use their readings or
events as learner evidence. The shipped `pawnConnectivityReading` already retains every pawn square
and occupied-file island, and an exact derivation matches both old predicate truth sets over every
fixed authored/imported position. The successor needs exact per-file pawn groups and before/after
membership. “Weak,” good/bad, target, plan and move quality remain separate theory/evaluation
joins. `[V]`

The conventional term boundary supports this split. Chess.com's isolated-pawn reference defines
isolation by the absence of friendly pawns on adjacent files and explicitly notes that an isolated
pawn is not necessarily weak or bad. Its pawn-structure reference treats doubled/isolated/islands
as observable structural categories but discusses their value in position-dependent terms. `[P]`
([isolated pawn](https://www.chess.com/terms/isolated-pawn-chess),
[pawn structure](https://www.chess.com/terms/pawn-structure))

## Method

The disposable Node-24 harness in `tools/d1728-pawn-file-identity-harness/` derives records only
from `pawnConnectivityReading`:

```text
color + file + every pawn square + adjacent-file occupancy
  → isolated boolean
  → doubled boolean
```

It proves both booleans set-equal to `matchesStructuralFeature` across the 611 authored and 577
imported fixed positions (18,912 color/file comparisons). It then measures every exact group and
every changed group over 754 authored + 579 imported committed edges. A synthetic tripled-pawn
fixture proves the payload is not accidentally capped at two even though the fixed populations
contain no tripled file. `[V]`

## Static subject collapse

| population | isolated file rows | exact isolated pawns | multi-pawn isolated files | doubled file rows | exact doubled pawns | tripled+ | isolated + doubled |
|---|---:|---:|---:|---:|---:|---:|---:|
| authored | 163 | 180 | 17 | 98 | 196 | 0 | 17 |
| imported | 369 | 408 | 39 | 180 | 360 | 0 | 39 |

The old isolated reading says only `{ color, file }`. It collapses more than one exact pawn on
**17/163 authored (10.43%)** and **39/369 imported (10.57%)** isolated files. Every such case in
the fixed populations is simultaneously doubled and isolated. That overlap is not a contradiction:
“same file has at least two pawns” and “no friendly pawn occupies an adjacent file” are independent
facts. `[V]`

The doubled reading likewise contains no pawn squares or group size. The current fixed populations
happen to contain exactly two pawns per doubled file, but legal chess permits three or more and the
successor fixture retains `c3,c4,c5`. A schema fixed to `first/second` would therefore be wrong even
if today's corpus passed it. `[V]`

## Transition identity loss

An exact group changed when its ordered pawn-square set changed while the family was true before,
after or both. “Truth changed” means the boolean appeared/disappeared. “Identity-only” means the
file remained isolated/doubled but its exact member set changed. “Cross-subject” means the changed
group contained neither the moved pawn's origin before nor its destination after. `[V]`

| population/family | changed groups | truth changed | identity-only | cross-subject |
|---|---:|---:|---:|---:|
| authored isolated | 36 | 22 | **14** | **13** |
| authored doubled | 41 | 37 | **4** | **15** |
| imported isolated | 65 | 58 | **7** | **40** |
| imported doubled | 44 | 42 | **2** | **9** |

The 18 authored and 9 imported identity-only changes cannot be represented by v1's file-level
`before`/`after` observations: both sides are byte-equivalent `{kind,color,file,squares:[]}`. Yet
the manifest describes every structural event as an *“identity-preserving signed before/after
relation.”* For these two families that statement is false. `[V]`

Cross-subject changes are not corner cases: **28/77 (36.36%)** authored and **49/109 (44.95%)**
imported isolated+doubled changes do not contain the moved pawn. Captures and pawn-file changes can
isolate, reconnect, double or undouble stationary pawns elsewhere. Joining an event to the mover
alone would therefore reproduce the subject error D1718 already found in avoidance. `[V]`

## Successor payloads

The source reading can be derived without a second board scan:

```text
rules.pawn.reading.file_groups@1
  fen
  colors[]
    color
    files[]
      file
      pawns[]                  // every exact square, stable board order
      adjacentOccupiedFiles[] // literal support context
      islandId                // local identity within this FEN, not longitudinal pawn identity
      isolated
      doubled
      frontPawn               // color-relative foremost member
      rearPawns[]             // zero or more; never a two-pawn assumption
```

It is exact `position_rules` evidence derived from `pawnConnectivityReading`. It says no pawn is
weak, immobile, attackable or strategically desirable. `frontPawn`/`rearPawns` are ordering facts;
whether the front pawn blocks useful progress is a separate legal-move/consequence join.

The event successor retains both groups plus the exact source edge:

```text
rules.pawn.event.file_group_changed@1
  beforeFen + moveUci + afterFen
  family: isolated | doubled
  color + file
  beforeGroup | null
  afterGroup | null
  sign: gained | lost | membership_changed | preserved
```

`membership_changed` is the missing state at v1. It is factual but is not automatically eligible
for a proactive nudge. The module reducer may select it only when another admitted relation makes
the change useful; Advanced may show it directly.

## Consumer boundary

- **Requested sight:** highlight the exact pawns and adjacent files; one compact fact, never the
  whole pawn census.
- **Postcommit/Review:** name every affected group, including stationary cross-subject pawns; use
  a selected validated event and keep value separate.
- **Drill authoring:** preserve current file predicates until explicit versioned migration. An
  author may continue to ask whether any isolated/doubled pawn exists on a file.
- **Bots/style/skills:** consume exact groups and opportunity denominators. A single occurrence is
  not a player trait and an isolated pawn is not automatically a weakness.
- **Theory:** may join the exact record to an authored/cited structure explanation; the source
  collector never supplies the plan.

## Repair order

1. Register the exact group reading and event as derivations of pawn connectivity; no duplicate
   scan or second pawn ontology.
2. Bind executable positives/negatives plus multi-pawn, tripled, truth-change, identity-only and
   cross-subject fixtures into D1711.
3. Give D1718 avoidance exact group identity and distinct-move denominators; never group only by
   color/file after the successor exists.
4. Emit through D1710's one-edge packet before activating nudge/Review/bot/style consumers.
5. Amend module-registration per D1726: exact group facts enter ordinary question-bound modules;
   legacy rows remain predicate/compatibility inputs, not competing learner authorities.
6. Migrate authored expressions only if their predicate semantics change. This additive payload
   repair alone requires no pack rewrite.

## Gate result

The exploration gate is open. The standard term boundary is sourced, source arithmetic is already
shipped, old truth sets are reproduced exactly, subject loss is measured on both populations, and
positive/negative/compound/cross-subject fixtures can fail. No production, RFC, schema, pack,
content or learner-UX byte changed. `[V]`
