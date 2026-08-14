# RFC: Structural predicate vocabulary, wave 2 — from authoring evidence

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-14
- **Design refs:** `design/BACKLOG.md:196` (row "Predicate vocabulary wave 2 (from authoring
  gaps)" — the collected gap ledger this RFC answers); `design/03-product-breadth.md` gate
  **B9** (the four admission rules); `docs/structural-reading.md` (canonical description of
  the shipped twelve-kind vocabulary); `docs/shape-library.md` (entry anatomy and the shared
  `StructuralExpression` grammar)
- **Exploration gate:** opened by owner ruling 2026-08-12 (`rfc/README.md`); the wave-2 row is
  **collected authoring evidence, not a GAP row** — every gap below is cited to the authoring
  session that hit it (`planning/content-era/log.md:569-620` endgame wave,
  `:622-681` middlegame wave, both 2026-08-14)
- **Depends on:** nothing unshipped. `rfc/archive/structural-reading.md` is implemented and
  supplies the twelve leaves, the expression grammar, the evaluator, the evidence facts, and
  the admission rules this RFC extends; `rfc/archive/shape-library.md` is implemented and
  supplies the shape-entry format whose triggers and signatures reuse that grammar
- **Parent / amends:** **`rfc/archive/structural-reading.md`** (the vocabulary: two new
  feature leaves, two new expression nodes, two new evidence facts),
  **`rfc/archive/drill-pack-format.md`** (pack schema 0.12 → 0.13, additive),
  **`rfc/archive/shape-library.md`** (shape-entry schema 0.1 → 0.2, additive; four official
  entries improve as this RFC's acceptance demonstrations)
- **Supersedes / superseded by:** —
- **Migration:** **none, and that is normative.** Parent law 1c holds: a rung-0 fact is never
  persisted. The grammar widens additively, so every committed pack, every fixture, every
  official shape entry, and every immutable registered community shape
  (`registered_shapes`, migration 10) remains valid unchanged. Run schema stays 0.10;
  `STORAGE_VERSION` stays 12.
- **Pack schema:** **0.13.** Claimed in `rfc/README.md`'s pack-schema-version register in the
  same edit that adds this RFC's Active row. This draft claims **first** in a four-draft
  wave; `corpus-evidence`, `adoption-wave-1`, and `social-match` claim behind it.
- **Shape-entry schema:** **0.2** (`SHAPE_ENTRY_SCHEMA_VERSION`,
  `packages/schema/src/index.ts:3`; `schemas/shape_entry.schema.json:3` `$id`). No register
  exists for this constant; it is recorded here and in the pack-schema register row so the
  single-writer discipline covers it.
- **Planning:** `planning/predicate-wave-2/` (once implementing)

## Summary

The twelve-kind structural vocabulary shipped on 2026-08-13 and was immediately spent against
real content: two parallel authoring waves produced eighteen shape entries on 2026-08-14 and
filed their format-gap reports, exactly as the wave-2 BACKLOG row was designed to collect.
The gaps are measured, not hypothesized: `bishop-good-bad` and `opposite-coloured-bishops`
are **structurally indistinguishable censuses whose triggers co-fire today**; one trigger
needed a **48-leaf** `passed_pawn` fan and one plan signature needed two 18-leaf fans and
another a 16-leaf fan; **five families are mirror-symmetric but every entry pins one
canonical orientation**, silently halving library coverage; and "up a pawn" — the claim the
OCB entry's own family description makes — is inexpressible.

This RFC admits four mechanisms under the parent's four admission rules and refuses the
rest by name: two new feature leaves (`bishop_on_shade`, `pawn_count` — twelve kinds become
fourteen), and two new expression nodes (`mirrored`, an orientation combinator that is
deliberately **not** a leaf, and `quantified`, a bounded some/every quantifier over a file
range or square region that collapses every fan the waves produced and gives kings a
region-addressable position without any king-specific leaf). Every union it widens is
re-dispatched exhaustively with a `never` refusal (the D26 law), including two sites that are
duck-typed walks today and would otherwise silently skip the new nodes. Four official shape
entries are updated as the acceptance demonstrations, including the required
disambiguation, mirror, and fan-collapse before/afters.

Everything the parent made normative is inherited unchanged: no verdict is expressible, no
sentence carries valence, nothing is persisted, silence stays the default, and detection
remains separate from significance.

## Motivation

### 1. The gap ledger, measured

Both authoring waves passed `make shape-check` for all eighteen entries — the vocabulary was
*sufficient* to name every family. The cost report is where the evidence is
(`planning/content-era/log.md:583-587`: roughly 30% of the endgame wave's effort was "trigger
engineering (finding honest encodings inside the twelve-predicate vocabulary)"):

| # | Gap | Measured cost | Source |
|---|---|---|---|
| 1 | No bishop square-colour predicate | `content/shapes/bishop-good-bad.json` and `content/shapes/opposite-coloured-bishops.json` share a byte-similar census (both bishops exist; no queens, rooks, or knights) and **co-fire on every position either matches**; each entry's watch list names the other as a known false positive. OCB is narrowed by a White-passer fan, which its own log entry admits "encodes 'conversion attempt', not colour" | log `:604-607` |
| 2 | Kings invisible in family prose | Opposition, key squares, Lucena/Philidor king placement — "the defining content of pawn and rook technique" — inexpressible except as per-square `pieceOnSquare` fans that overfit to one position | log `:608-611` |
| 3 | No pawn count or comparison | "Up a pawn", "only one pawn", "majority without a passer yet" all inexpressible; the OCB entry's family description claims "up-a-pawn OCB fortress" and its trigger cannot say so | log `:612-613` |
| 4 | Fan verbosity | The OCB trigger carries a **48-leaf** `any` of `passed_pawn` (files a–h × ranks 2–7, verified by counting the committed JSON); its `white-two-wings-two-passers` signature carries two 18-leaf wing fans (36 leaves); `queenless-middlegame`'s `white-first-weakness` signature spends **16 leaves** on "some Black pawn is isolated or doubled" | log `:614-615`, `:653-655` |
| 5 | No mirror/orientation abstraction | Five middlegame families (hanging-pawns, closed-centre-chain, doubled-c-pawns, opposite-castling-race, fianchetto-g7) are colour- or wing-symmetric; each entry pins one canonical orientation and declares the mirror unauthored — "silently halving library coverage per entry" | log `:643-652` |
| 6 | No file quantification | "An isolated pawn exists" is not sayable except as the 16-leaf fan of gap 4 | log `:653-655` |

The wave-2 BACKLOG row (`design/BACKLOG.md:196`) collects exactly these and instructs: "Each
admitted under B9's four rules or refused with the reason."

### 2. The four admission rules, restated

From `rfc/archive/structural-reading.md` §2b, mirrored in `docs/structural-reading.md`; every
candidate below is tried against them **in order**:

1. **Computable from the position alone.** No engine, no history, no network, no author input.
2. **Exactly definable in one sentence with no free parameter that encodes taste.**
3. **Dual role.** Something an author would write into a plan's success sentence *or*
   something a learner needs pointed at in order to see it.
4. **No name that contains a verdict.**

A combinator (a node that composes leaves rather than detecting a fact) is held to the same
rules applied to what it produces: every expression it can form must itself be exact,
position-computable arithmetic with no taste constant and no verdict name.

### 3. Scope boundary

Outside this RFC, each with the rule that closes it rather than deferral language:

- **Castling rights or castling history** (log gap `:659-661`). Castling *rights* are in the
  FEN and pass rule 1, but the authoring gap was castling *history* ("kings that walked there
  fire") — game history fails rule 1 outright, and rights alone were not what any entry
  needed. No leaf is admitted; `opposite-castling-race` keeps its king-square proxy and its
  honest note.
- **Structure memory** ("the fianchetto structure persists after the bishop trade", log
  `:668-671`). A fact about a *past* position fails rule 1. Refused.
- **Pawn tension / "practically open" centre** (log `:665-667`). "One mobile pawn each" is a
  judgement about which pawns count as mobile — a taste parameter. Fails rule 2. Refused.
- **Board symmetry test / middlegame–endgame boundary marker** (log `:662-664`). Exact
  placement symmetry is computable but no entry's family is defined by literal symmetry (the
  queenless family means *material* parity, which `pawn_count` plus the existing
  reach-existence idiom now states); a phase *boundary* is a convention, failing rule 2.
  Refused.
- **Everything the parent already refused** (§2b of
  `rfc/archive/structural-reading.md`): scores, "weak", good/bad bishop *as a name*, trapped,
  hanging, skeleton equality. Still refused. `bishop_on_shade` (§4a below) is admissible
  precisely because it is the arithmetic underneath the good/bad-bishop verdict without the
  verdict: it names where a bishop stands, not what that is worth.

## Specification

### 1. Verdicts on the six candidates

| Candidate | Verdict | Deciding rule |
|---|---|---|
| Mirror/orientation combinator | **Admitted** as expression node `mirrored` (§3) — an expression wrapper, **not** a new leaf: it detects nothing itself, so making it a leaf would create a fact-shaped node with no fact | Rules 1–4 applied to its output: a mirrored leaf is exactly the leaf's arithmetic on mirrored coordinates |
| Bishop square-colour | **Admitted** as leaf `bishop_on_shade` (§4a) | Passes all four; rule 4 satisfied because the name states placement, not value |
| King position/geometry | **Split.** A named `opposition` leaf is **refused** under rule 2: direct, distant, diagonal, and virtual opposition are competing conventions, and picking one is a taste constant — and unlike the outpost detector there is no honest "Tabiya's strict opposition" that closes the cited gap, because the entries need the *concept*, which includes the variants. A raw `king_distance` leaf is **refused** under rule 3: no collected gap is closed by it (Chebyshev distance alone cannot state opposition — alignment, parity, and side-to-move all matter — so no author would write it and no learner needs it pointed at). The honest minimal addition is **no king-specific leaf at all**: kings become region-addressable through `quantified` with the `piece` template (§3b), which is what Lucena/Philidor king placement actually needed | Rule 2 (opposition), rule 3 (king_distance) |
| Pawn-count comparison | **Admitted** as leaf `pawn_count` (§4b), with a `basis` of `count` or `difference` | Passes all four; §4b states why `difference` does not violate the parent's no-balance rule |
| Range-over-squares | **Admitted** as expression node `quantified` with a square-region domain (§3b) | Rules 1–4 applied to its output; it quantifies existing exact leaves over a bounded domain and can express nothing a finite `any`/`all` fan cannot already express — it removes the fan, not a limit |
| File quantification | **Admitted** as the same `quantified` node with a file-range domain (§3b) — one mechanism, not two | Same |

Net: **fourteen** feature kinds (twelve + `bishop_on_shade` + `pawn_count`), **seven**
expression node kinds (`all`, `any`, `not`, `feature`, `pieceOnSquare` + `mirrored` +
`quantified`).

### 2. Where the vocabulary lives, exactly

The unions this RFC widens exist in **two TypeScript copies and two JSON Schema copies**, and
all four move in the same commit:

- `packages/schema/src/drill-pack/types.ts:198-224` — `STRUCTURAL_FEATURE_KINDS`,
  `StructuralFeature` (`:205`), `StructuralExpression` (`:219`). The wire types.
- `packages/runtime/src/structure.ts:13-35` — the runtime re-declaration of both unions
  (it already imports `STRUCTURAL_FEATURE_KINDS` from schema at `:4`; the union bodies are
  duplicated). The duplication predates this RFC; widening one side without the other is a
  compile error at the evaluator boundary (`apps/server/src/pack-orchestrator.ts` passes
  schema-typed expressions into the runtime matcher), and the existing four-way sync test
  (`packages/runtime/src/structure.test.ts:34`) is extended by criterion 10.
- `schemas/drill_pack.schema.json:359-382` — `$defs/structuralFeature` (twelve-branch
  `oneOf`) and `$defs/structuralExpression` (four-branch `oneOf`).
- `schemas/shape_entry.schema.json:26-49` — a **duplicated copy** of both `$defs` trees
  (shape entries validate standalone). Both files gain identical branches.

`STRUCTURAL_FEATURE_KINDS` gains `"bishop_on_shade"` and `"pawn_count"` **appended at the
end**. The array's order is the canonical observation sort key
(`packages/runtime/src/structure.ts:244-246`); appending keeps every existing reading's order
byte-stable, and the parent already ruled that kind order is canonical-arbitrary, never
significance.

### 3. Two new expression nodes

#### 3a. `mirrored` — the orientation combinator

```ts
export type MirrorAxis = "colors" | "files" | "both";

// new StructuralExpression member
| { readonly kind: "mirrored"; readonly axis: MirrorAxis; readonly of: StructuralExpression }
```

**Semantics.** `mirrored(axis, e)` holds on a position exactly when `e` holds on the position
mirrored across `axis`. It is implemented as a pure **leaf rewrite** — `mirrorExpression(e,
axis)` maps every leaf's coordinates and colours and the result is evaluated by the one
existing evaluator — so no mirrored FEN is ever constructed and there is still exactly one
evaluator (`matchesStructuralExpression`, `packages/runtime/src/structure.ts:218-230`).

The coordinate maps, in chessops 0-indexed file/rank terms:

| axis | square `(f, r)` | file | rank in a domain | colour fields |
|---|---|---|---|---|
| `colors` | `(f, 7−r)` | unchanged | `r → 7−r` | every `Color` field flips, including inside `pieceOnSquare`/`piece` payloads |
| `files` | `(7−f, r)` | `f → 7−f` (a↔h, b↔g, …) | unchanged | unchanged |
| `both` | `(7−f, 7−r)` — the 180° rotation | `f → 7−f` | `r → 7−r` | flips |

Per-leaf transform rules, stated because two of them are subtle:

- `line_blockers`: both endpoints map; alignment and span size are preserved by all three
  maps, so a valid span cannot become `LINE_SPAN_EMPTY`.
- `outpost`: square and colour map together under `colors`, so the **relative rank is
  preserved** — a load-valid outpost leaf cannot become `OUTPOST_RANK_OUT_OF_RANGE` by
  mirroring. Same argument for `passed_pawn` and `backward_pawn` direction.
- `bishop_on_shade`: the shade **flips under `colors` and under `files`, and is preserved
  under `both`**, because `(f, 7−r)` and `(7−f, r)` each flip the parity of `f + r` (7 is
  odd) while the 180° rotation flips it twice. This is normative and tested (criterion 5);
  getting it wrong would silently invert every mirrored OCB signature.
- `pawn_count`: `color` flips under `colors`/`both`; `basis`, `comparison`, `count`
  unchanged (a difference for White becomes the same difference asked of Black).
- `quantified`: the domain maps (file ranges reverse under `files`, rank ranges reverse under
  `colors`, both re-normalised so `from ≤ to`); the template's colour fields map.
- `named_structure`: **refused inside `mirrored`**, at load
  (`MIRRORED_NAMED_STRUCTURE`, §7) and by a runtime `TypeError` guard. The catalogue names
  are conventions bound to one orientation; evaluating "Carlsbad" against a colour-mirrored
  board and reporting the *name* would claim a Carlsbad of a position that is not one. An
  author who wants the reversed skeleton writes the mirrored *arithmetic*, which carries no
  name. (That `mirrored("colors", iqp-white)` would coincide with `iqp-black` is true and is
  not a reason to bless the general case.)

`mirrorExpression` is an **exhaustive switch over all fourteen leaf kinds and all seven node
kinds with `never` defaults**. This is the D26 dividend stated as a rule: a fifteenth leaf
kind added later without a mirror rule is a compile error, not a silently unmirrored leaf.
All fourteen leaves are functions of piece placement alone — none reads side-to-move,
castling rights, or en passant — which is why the three axis maps are total. A future leaf
that reads any of those cannot be added without the `never` check forcing its mirror rule to
be written.

**Depth:** a `mirrored` node counts one nesting level, exactly like `not`, against the
existing cap of four (`apps/server/src/pack-validation.ts:98-102`).

**The side-label law (shape entries).** Mirroring an expression is exact; mirroring an
*entry* is not, because plan `side` labels are per-entry constants
(`packages/schema/src/shape-entry/types.ts` `ShapePlan.side`). The law, documented in
`docs/shape-library.md` and demonstrated in §9:

- `mirrored("files", …)` preserves colours, so a single entry may widen its own trigger to
  cover the mirror wing (fianchetto g7 → b7) with its plans intact.
- `mirrored("colors", …)` and `"both"` flip which colour owns each plan, so colour-mirrored
  coverage lives in a **separate entry** that wraps the shared trigger arithmetic and
  authors its own correctly-sided plans (the cheap path the middlegame log asked for:
  trigger re-derivation cost drops to one wrapper node; plan prose remains an authored,
  per-orientation artifact, which is honest because plans are claims and claims carry
  provenance). No lint can distinguish the two uses mechanically, so this is documentation
  plus the acceptance demonstrations, not a refusal code.

#### 3b. `quantified` — bounded some/every over files or squares

```ts
export type Quantifier = "some" | "every";
export interface FileRange { readonly from: FileName; readonly to: FileName }   // inclusive
export interface RankRange { readonly from: number; readonly to: number }      // 1–8, algebraic, inclusive
export interface SquareRegion { readonly files: FileRange; readonly ranks: RankRange }

export type FileTemplateFeature =
  | { readonly kind: "backward_pawn"; readonly color: Color }
  | { readonly kind: "isolated_pawn"; readonly color: Color }
  | { readonly kind: "doubled_pawn"; readonly color: Color }
  | { readonly kind: "half_open_file"; readonly color: Color }
  | { readonly kind: "open_file" };

export type SquareTemplateFeature =
  | { readonly kind: "pawn_safe_square"; readonly color: Color }
  | { readonly kind: "outpost"; readonly color: Color }
  | { readonly kind: "passed_pawn"; readonly color: Color }
  | { readonly kind: "direct_attack_count"; readonly color: Color; readonly comparison: FeatureComparison; readonly count: number }
  | { readonly kind: "piece"; readonly piece: { readonly color: Color; readonly role: Role } | null };

// new StructuralExpression members (one kind, two domain-matched arms)
| { readonly kind: "quantified"; readonly quantifier: Quantifier; readonly over: { readonly files: FileRange }; readonly feature: FileTemplateFeature }
| { readonly kind: "quantified"; readonly quantifier: Quantifier; readonly over: { readonly squares: SquareRegion }; readonly feature: SquareTemplateFeature }
```

**Semantics.** A template is an existing leaf minus its `file`/`square` field (`piece` is the
shipped `pieceOnSquare` anchor minus its square). `some` holds when the instantiated leaf
holds for at least one file/square in the domain; `every` when it holds for all of them.
Evaluation instantiates and calls the existing leaf evaluators — the node adds **no new
detectable fact**, only the quantifier, which is why it passes the admission rules: every
expressible `quantified` node is extensionally equal to a finite `any`/`all` fan that is
already legal today. Domains are inclusive rectangles; a validated domain is never empty
(§7), and the runtime throws `TypeError` on a reversed range as the can't-happen guard
behind that refusal.

**What is deliberately not templatable:** `line_blockers` (two squares — quantifying one
endpoint has no evidenced use and doubles the template surface), `named_structure` (no
positional field), `open_file` over squares, `piece_reach_count`/`pawn_count`/
`bishop_on_shade` (no file/square field). The template unions are closed and
schema-enumerated exactly like the leaves.

**Kings.** `quantified("some", squares(...), piece {color, role: "king"})` is the whole
king-geometry admission: "the White king stands inside this region" — exact, region-shaped,
and free of any opposition claim. The Lucena/Philidor king-placement gap (Motivation gap 2)
is closed by regions; relative two-king geometry stays refused per §1.

`every` composes honestly: `quantified("every", region, piece null)` is "the region is
empty"; `quantified("every", region, pawn_safe_square(C))` is a shelter statement in pure
eviction arithmetic. Both are exact and verdict-free.

**Depth:** counts one nesting level. **Evidence:** the node contributes its template's kind
fact (`structure-passed-pawn` for a passed-pawn template, etc.); the `piece` template
contributes none, matching the parent's `pieceOnSquare`-is-an-anchor rule
(`rfc/archive/structural-reading.md` §3d).

### 4. Two new feature leaves

Notation as in the parent: `C` is the colour asked about, `X = opposite(C)`.

#### 4a. `bishop_on_shade`

```ts
| { readonly kind: "bishop_on_shade"; readonly color: Color; readonly shade: "light" | "dark" }
```

True exactly when at least one bishop of `C` stands on a square of `shade`, where a square
`(f, r)` (0-indexed) is **light** iff `f + r` is odd (h1 light, a1 dark). The field is named
`shade`, not a second `color`, so no expression ever contains two unrelated colour
vocabularies.

Admission: rule 1 trivially; rule 2 — one sentence, no parameter; rule 3 — the two OCB/BGB
entries are the standing author evidence, and "your bishop is a light-squared bishop" is a
canonical thing a learner needs pointed at; rule 4 — the name states placement. The
good/bad-bishop *verdict* stays refused as in the parent's exclusion table: an author may
compose `bishop_on_shade` with pawn facts and call it a bad bishop **in their own prose**,
which then carries their provenance.

Bishop pairs and promoted bishops are handled by composition, not special-casing:
`bishop_on_shade(C, light) ∧ bishop_on_shade(C, dark)` states both complexes are occupied;
`bishop_on_shade(C, light) ∧ ¬bishop_on_shade(C, dark)` states every bishop of `C` is
light-squared and at least one exists — which is the honest single-bishop form the OCB
signature needs, with no piece-counting predicate required.

#### 4b. `pawn_count`

```ts
| { readonly kind: "pawn_count"; readonly color: Color; readonly basis: "count" | "difference"; readonly comparison: FeatureComparison; readonly count: number }
```

- `basis: "count"` — `|pawns(C)|` satisfies `comparison count`. `count` must be 0–8 (§7).
- `basis: "difference"` — `|pawns(C)| − |pawns(X)|` satisfies `comparison count`. `count`
  may be −8–8; "up a pawn" is `difference atLeast 1` in the author's prose, never in the
  detector's.

**Why `difference` does not break the no-balance law.** The parent forbids subtracting the
two sides' *attack* counts into a "balance"
(`docs/structural-reading.md:20-21`) because attack counts are not commensurable units — the
subtraction manufactures a pressure verdict. Pawns are a conserved, identical unit, and the
codebase already treats signed material comparison as census, not judgement: the
`materialBalance` objective predicate (`packages/runtime/src/objective.ts:38,131,224-225`)
and the `material_balance` success condition
(`packages/schema/src/drill-pack/types.ts:182`) both ship signed values. `pawn_count` with
`basis: "difference"` is that census restricted to pawns, and its sentences (§8) state the
arithmetic ("White has at least one more pawn than Black") with no *up/ahead/advantage*
vocabulary. The presentation-side rule is kept intact: the **reading projection** (§6) emits
per-colour counts only and never renders a subtraction, exactly as it does for attack
counts; the difference form exists for authors, whose conjunctions need it in one leaf.

Admission: rules 1–2 trivially; rule 3 — Motivation gap 3 is three authored entries' worth of
evidence; rule 4 — `pawn_count` names a census.

### 5. Exhaustive dispatch — every widened union, every site (D26)

The parent closed the D26 fallthrough for `FenPredicate`; this RFC widens two more unions and
inherits the law: **every dispatch over a widened union is a `switch` (or if-chain) ending in
a `never` binding, and a missing case is a compile error followed by a runtime refusal.**
The full site inventory, from reading the shipped code:

| Site | Today | Under this RFC |
|---|---|---|
| `matchesStructuralFeature` (`packages/runtime/src/structure.ts:171-216`) | `never` guard at `:214` | compiler forces the two leaf cases; guard retained |
| `matchesStructuralExpression` (`structure.ts:218-230`) | `never` guard at `:223` | compiler forces `mirrored`/`quantified` cases; guard retained |
| `mirrorExpression` (new) | — | exhaustive over 7 node kinds **and** 14 leaf kinds, `never` defaults (§3a) |
| `structuralFeatureKinds` (`structure.ts:307-316`) | **duck-typed if/else visitor — an unmatched node kind silently contributes no evidence kinds.** A `quantified` conjunct in a graded objective would silently lose its evidence ref, the exact silent-partial-evidence failure the parent's §3d closed one layer up | rewritten as an exhaustive switch with a `never` default; `mirrored` recurses (mirroring never changes a leaf's kind), `quantified` contributes its template kind (`piece` contributes none) |
| `structuralIssues` (`apps/server/src/pack-validation.ts:93-116`) | **duck-typed walk with silent fall-through for unknown kinds** — a `mirrored` or `quantified` node would be skipped whole, so the depth cap and every leaf refusal beneath it would go unchecked | split into an expression walk exhaustive over the 7 node kinds and a leaf check exhaustive over the 14 leaf kinds, each with a default that pushes `STRUCTURAL_KIND_UNRECOGNISED` (§7). The schema's closed `oneOf` makes the default a can't-happen guard, which is precisely D26's "compile-time failure followed by a default runtime refusal" shape |
| `renderStructuralObservation` (`apps/web/src/lib/structural-sentences.ts:7-28`) | `never` guard at `:26` | compiler forces the two new observation sentences |
| `renderFeatureSpec` (`structural-sentences.ts:34-49`) | `never` guard at `:47` | compiler forces the two new spec sentences |
| `renderStructuralExpressionSpec` (`structural-sentences.ts:51-63`) | `never` guard at `:61` | compiler forces `mirrored`/`quantified` sentences |
| `shapeFirings` (`packages/runtime/src/shape-firing.ts:23`), guidance trigger evaluation (`apps/server/src/guidance.ts:37`), boundary/checkpoint/success evaluation (`packages/runtime/src/objective.ts:166`) | all call the one evaluator | no change — this is the one-evaluator dividend |

### 6. Reading projection additions

`structuralReading` (`packages/runtime/src/structure.ts:248-281`) gains, inside the existing
finite-enumerator contract:

- one `pawn_count` observation per colour: `{ kind: "pawn_count", color, count: |pawns(C)|,
  squares: [] }` — always two observations, per-colour, **never a difference** (§4b);
- one `bishop_on_shade` observation per bishop on the board:
  `{ kind: "bishop_on_shade", color, squares: [square], shade }`.

`StructuralObservation` (`structure.ts:46-55`) gains an optional readonly
`shade?: "light" | "dark"`. The projection stays score-free, rank-free, and canonically
ordered; the two appended kinds sort last (§2). `mirrored` and `quantified` add nothing to
the projection — they are author queries, and the parent's rule that the observation
projection never enumerates author-query space is untouched. `structuralDelta` and
`vacationReading` are unchanged.

### 7. Load-time refusals

New codes in the `runtimeIssue` style, enforced through the shared `structuralIssues` path so
they apply identically to packs (`validatePackDocument`, all three predicate doors) and to
shape entries (`validateShapeEntry`, `apps/server/src/shape-validation.ts:50-53`, which
already reuses `structuralIssues` for triggers and signatures — one new rule set, two
artifact kinds, no second implementation):

| Code | Fires when |
|---|---|
| `MIRRORED_NAMED_STRUCTURE` | a `named_structure` leaf appears anywhere under a `mirrored` node (§3a). Path points at the leaf |
| `QUANTIFIED_DOMAIN_EMPTY` | a `FileRange` or `RankRange` with `from > to` — the domain denotes nothing, so `some` would be constant-false and `every` constant-true, two different silent answers to one malformed input |
| `PAWN_COUNT_OUT_OF_RANGE` | `basis: "count"` with `count` outside 0–8, or `basis: "difference"` with `count` outside −8–8 — every such leaf is a constant |
| `OUTPOST_RANK_OUT_OF_RANGE` (existing code, extended) | a `quantified` node with an `outpost` template whose region contains **no** square of relative rank 4–6 for the template's colour — the detector cannot hold anywhere in the domain, so the node asserts a contradiction (`some`) or vacuous noise (`every`). Regions that partially overlap ranks 4–6 are legal; out-of-range squares simply evaluate false, matching the shipped single-square rule at `pack-validation.ts:109-111` |
| `STRUCTURAL_KIND_UNRECOGNISED` | the exhaustive-walk default of §5 — unreachable behind the schema, present so the walk can never silently skip |

Existing codes extend naturally: `NEGATIVE_FEATURE_COUNT` covers the `direct_attack_count`
template's count; `STRUCTURAL_EXPRESSION_TOO_DEEP` counts `mirrored` and `quantified` as one
level each against the unchanged cap of four. Each new code gets a fixture under
`schemas/fixtures/drill-pack/` and `make pack-check FILE=<fixture>` / `make shape-check
FILE=<fixture>` exit non-zero, asserted on the exit code (parent criterion 5 precedent).

### 8. Evidence facts and sentences

`RULES_EVIDENCE_FACTS` (`packages/runtime/src/evidence-ref.ts:1-23`) gains
`structure-bishop-on-shade` and `structure-pawn-count` (twelve `structure-*` facts become
fourteen). No new namespace, per the parent's §6a reasoning. The kind↔fact sync test
(`packages/runtime/src/structure.test.ts:34`) continues to pass by construction.

Sentences, held to the parent's no-valence rule and banned-word test (§6b there), fixed
strings only:

| Detection | Sentence |
|---|---|
| observation `pawn_count(white, 7)` | "White has 7 pawns." |
| observation `bishop_on_shade(white, d3, light)` | "White's bishop on d3 stands on a light square." |
| spec `pawn_count(white, count, equal, 5)` | "white has exactly 5 pawns" |
| spec `pawn_count(white, difference, atLeast, 1)` | "white has at least 1 more pawn than black" |
| spec `bishop_on_shade(black, dark)` | "black has a bishop on a dark square" |
| spec `mirrored("files", e)` | "with files mirrored (a↔h): …" |
| spec `mirrored("colors", e)` | "with colours reversed and ranks mirrored: …" |
| spec `mirrored("both", e)` | "rotated 180 degrees: …" |
| spec `quantified("some", files a–h, isolated_pawn(black))` | "on some file from a to h, black has an isolated pawn" |
| spec `quantified("every", squares a4–h7, …)` | "on every square from a4 to h7, …" |

No sentence says *up*, *ahead*, *majority*, *better*, or any word on the banned list; the
difference form renders as counting ("more pawn than"), which asserts arithmetic, not
advantage.

### 9. The named entries improve — before/after

Four official entries are updated as acceptance demonstrations. Entry ids are immutable
identity; each updated entry bumps its own semver `version` field (0.1.0 → 0.2.0), which is
the shape-entry-level versioning `docs/shape-library.md` establishes. All updated entries
pass `make shape-check` and their probe FENs.

**9a. `bishop-good-bad` vs `opposite-coloured-bishops` — the disambiguation.**

Before: both triggers are the same census (each side has a bishop; neither side has a queen,
rook, or knight — via the `piece_reach_count atLeast 0` existence idiom), so they **co-fire**;
OCB is narrowed only by the 48-leaf White-passer fan, which encodes a conversion attempt,
not bishop colours. Each entry's watch text names the other as a known false positive.

After, with `S(w, b) = all[bishop_on_shade(white, w), ¬bishop_on_shade(white, opposite-shade),
bishop_on_shade(black, b), ¬bishop_on_shade(black, opposite-shade)]` written as explicit
arms (the two-assignment `any` stays inside the depth cap without needing `mirrored`):

- `opposite-coloured-bishops` trigger: census ∧ `any[S(light, dark), S(dark, light)]`
  ∧ `pawn_count(white, difference, atLeast, 1)` — the entry's own "up-a-pawn OCB fortress"
  family claim, expressible for the first time — ∧ the §9c passer clause.
- `bishop-good-bad` trigger: census ∧ `any[S(light, light), S(dark, dark)]`.

The two triggers are now **mutually exclusive by construction** (opposite-shade vs same-shade
assignments cannot both hold when each side's bishops occupy one complex), the co-fire watch
warnings are deleted, and the disambiguation is census arithmetic, not narrative.

**9b. `fianchetto-g7` — the mirror-symmetric family.**

Before (`content/shapes/fianchetto-g7.json`): `all[pieceOnSquare(g6, black pawn),
pieceOnSquare(g7, black bishop)]` — Black's kingside corner only; b7, g2, b2 declared
unauthored, the coverage-halving cost the middlegame log measured.

After: `any[base, mirrored("files", base)]` where `base` is the shipped conjunction — the
entry now fires for Black's queenside fianchetto (b6 pawn, b7 bishop) with its plans intact,
because a files mirror preserves colours and therefore plan `side` labels (§3a's side-label
law). The `name` and prose state the widened coverage; the id stays `fianchetto-g7`. The
White corners (g2/b2) remain a separate colour-mirrored entry under the side-label law and
are **not** silently folded in — that is the law working, not a residual gap: an entry whose
plans say "black" may not fire on positions where the plans belong to White.

**9c. The fan collapses.**

- OCB trigger, 48-leaf `any` of `passed_pawn(white, a2…h7)` →
  `quantified("some", squares {files a–h, ranks 2–7}, passed_pawn(white))` — **48 leaves to
  one node**, extensionally identical by construction (§3b).
- OCB `white-two-wings-two-passers` signature, two 18-leaf wing fans (36 leaves) →
  `all[quantified("some", squares {files a–c, ranks 2–7}, passed_pawn(white)),
  quantified("some", squares {files f–h, ranks 2–7}, passed_pawn(white))]` — 36 leaves to
  two nodes.
- `queenless-middlegame` `white-first-weakness` signature, 16-leaf `any` of
  `isolated_pawn`/`doubled_pawn(black, a…h)` →
  `any[quantified("some", files a–h, isolated_pawn(black)),
  quantified("some", files a–h, doubled_pawn(black))]` — 16 leaves to two nodes.

### 10. Boundary conditions, enumerated

| Condition | Behaviour |
|---|---|
| `bishop_on_shade` with no bishop of `color` | False, not an error |
| `bishop_on_shade` with two bishops of `color` on both shades | True for both shades; exclusivity is authored with `not`, never assumed (§4a) |
| `pawn_count(count)` with `count` 0 and `equal` | Legal and useful ("no pawns"); 0 is inside 0–8 |
| `pawn_count(difference)` with negative `count` | Legal (−8–8); "White at most −1" is the same census as "Black at least 1" and neither spelling is privileged |
| `pawn_count(count)` with `count` 9, or `difference` with 9 | Refused at load (`PAWN_COUNT_OUT_OF_RANGE`) — a constant |
| `mirrored` of `mirrored` | Legal within the depth cap; `mirrored(a, mirrored(a, e))` ≡ `e` (involution, criterion 4) |
| `mirrored` containing `named_structure` at any depth | Refused at load; runtime `TypeError` guard (§3a) |
| `mirrored("colors")` of an `outpost`/`passed_pawn`/`backward_pawn` leaf | Relative geometry preserved; a load-valid leaf stays load-valid (§3a) |
| `bishop_on_shade` under `mirrored` | Shade flips under `colors` and `files`, holds under `both` (§3a, criterion 5) |
| `quantified` domain of one file or one square | Legal; degenerate domains are just small, not errors |
| `quantified` reversed range | Refused at load (`QUANTIFIED_DOMAIN_EMPTY`); runtime `TypeError` guard |
| `quantified("every", …)` over a valid domain | Never vacuous — validated domains are non-empty by the reversed-range refusal |
| `quantified` outpost template with region wholly outside relative ranks 4–6 | Refused at load (§7); partial overlap legal, out-of-range squares evaluate false |
| `quantified` `piece` template with `piece: null` and `every` | "The region is empty" — exact, legal |
| A `quantified` conjunct in a graded objective's evidence | Contributes its template's kind fact; the `piece` template contributes none (§3b, §5) |
| An eighth expression kind or fifteenth leaf kind added later without a case in any dispatch site | Compile error at every site in §5's table, then `STRUCTURAL_KIND_UNRECOGNISED` at the walk — never a silent skip |
| Community shapes registered under grammar 0.1 | Still valid; the widening is additive and registered documents are immutable |

### 11. Schema changes

**Pack schema 0.12 → 0.13** (`DRILL_PACK_SCHEMA_VERSION`, `packages/schema/src/index.ts:2`;
`$id` at `schemas/drill_pack.schema.json:3`). Additive only; pack digests are content digests
unaffected by the `$id`, so no committed digest moves. Additions: two branches in
`$defs/structuralFeature` (`bishop_on_shade` with `shade` enum; `pawn_count` with `basis`
enum and integer `count`); three branches in `$defs/structuralExpression` (`mirrored`;
`quantified` files-arm; `quantified` squares-arm); new `$defs/fileRange`, `$defs/rankRange`,
`$defs/squareRegion`, `$defs/fileTemplateFeature`, `$defs/squareTemplateFeature`. Every new
object is `additionalProperties: false` — the parent's pinned passthrough inventory
(criterion 12 there) must still count exactly three sites, and criterion 13 here re-runs it.

**Shape-entry schema 0.1 → 0.2** (`SHAPE_ENTRY_SCHEMA_VERSION`,
`packages/schema/src/index.ts:3`; `$id` at `schemas/shape_entry.schema.json:3`): the
identical additions to its duplicated `$defs` copy. Individual entries version themselves
with their own semver `version` field; the four updated entries bump 0.1.0 → 0.2.0 (§9).

**No migration** (header). Nothing persisted changes shape; `shape_drafts` and
`registered_shapes` store documents whose old grammar remains valid.

### 12. Cost

Both new leaves are O(piece-count) board scans; `quantified` is at most 64 leaf evaluations
per node; `mirrored` is a one-pass expression rewrite. The reading projection gains at most
six observations (two pawn counts, four bishops). The existing instrumented envelope applies
unchanged: the structure test records a non-vacuous sample, 100 ms stays the worry threshold
that prompts investigation, and no wall-clock pass/fail gate is added — the parent's
measured-not-gated ruling (`docs/structural-reading.md:70-78`) showed a gate that can report
either answer on identical code is not evidence. Criterion 14 re-records the sample.

**Baselines, verified 2026-08-14 on this checkout:** `pnpm test` — **399 tests, 69 files,
all passing**; the drill-pack schema constant is `"0.12"` and the shape-entry constant
`"0.1"`; the browser suite's structural-reading section drives the control at
`tests/browser/drill.spec.ts:337`.

## Deviations from design

1. **The BACKLOG row sketches the mirror as "a `mirrored:` expression wrapper flipping
   colors+files" (`design/BACKLOG.md:196`).** This RFC ships the wrapper but with an explicit
   three-value `axis` instead of one fused flip, because the two authoring costs the row
   itself cites need *different* axes: wing symmetry (fianchetto b7) is a files flip that
   preserves plan sides, and colour symmetry (doubled-c-pawns' Ruy case) is a colours flip
   that cannot honestly live inside the same entry (§3a side-label law). A fused-only flip
   would have made the one in-entry-safe use inexpressible. The row's "NOT a new leaf" call
   is followed exactly.
2. **The middlegame log's gap list includes castling history, structure memory, pawn
   tension, and a symmetry/boundary test; this RFC refuses them rather than deferring them**
   (Motivation §3), each under a named admission rule. The BACKLOG row asked for exactly
   admit-or-refuse; recording the refusals in the wave-2 row is a BACKLOG status update the
   implementer proposes, never a `design/` edit (law 5).
3. **The queenless 16-leaf fan lives in a plan signature, not the trigger.** The log entry's
   wording ("took a 16-leaf `any` in queenless-middlegame") is imprecise by one level;
   measured against the committed JSON it is the `white-first-weakness` success signature.
   The collapse lands where the fan actually is.
4. **No design doc names the two duck-typed walk sites** (`structuralFeatureKinds`,
   `structuralIssues`) that would have silently skipped the new node kinds (§5). They are
   the D26 shape one layer out, found while specifying this; closing them here is scope, and
   ledgering the pattern is a BACKLOG row the implementer proposes.

## Acceptance criteria

1. **Disambiguation.** `bishop-good-bad` and `opposite-coloured-bishops` carry the §9a
   triggers; a table-driven test evaluates both against (a) a hand-built OCB position
   (single bishops, opposite shades), (b) a hand-built same-shade position, and (c) a
   both-complexes position (two bishops one side), asserting exactly the intended one (or
   neither, for c against both) fires and never both. Both entries pass `make shape-check`;
   the co-fire watch warnings are removed; both entry `version` fields read 0.2.0.
2. **Mirror demo.** `fianchetto-g7`'s trigger is `any[base, mirrored("files", base)]`; a
   probe with a Black b6/b7 fianchetto fires, the g6/g7 probe still fires, and a White g2/b2
   fianchetto does **not** fire, with a test comment citing the §3a side-label law as the
   reason the colour mirror is absent.
3. **Fan collapses.** The OCB trigger contains exactly one `quantified` node and zero
   `passed_pawn` feature leaves (before: 48, asserted in a comment); its
   `white-two-wings-two-passers` signature contains two `quantified` nodes (before: 36
   leaves); `queenless-middlegame`'s `white-first-weakness` signature contains two
   `quantified` nodes (before: 16 leaves). Equivalence is asserted by evaluating old and new
   forms against the same probe set and requiring identical verdicts.
4. **Mirror soundness, property-based.** For random legal positions and generated
   expressions (leaf kinds excluding `named_structure`),
   `matchesStructuralExpression(fen, mirrored(axis, e))` equals evaluating `e` against the
   brute-force-mirrored board (an independent FEN-level mirror used only as the test
   oracle), for all three axes; and `mirrored(axis, mirrored(axis, e))` evaluates
   identically to `e`.
5. **Shade parity law.** A table test asserts `bishop_on_shade` flips shade under
   `mirrored("colors")` and `mirrored("files")` and preserves it under `mirrored("both")`,
   on positions where the two answers differ.
6. **`pawn_count` table.** Both bases against hand-built positions including 0 pawns, equal
   counts, and negative differences; the reading projection emits exactly two per-colour
   `pawn_count` observations and no difference observation; serialised readings still
   contain no field named `score`, `rank`, `severity`, or `favours`.
7. **Quantified semantics.** `some`/`every` over file ranges and square regions, including a
   one-square region, an `every … piece null` emptiness assertion, a
   king-in-region assertion via the `piece` template, and an outpost template with a
   partially out-of-range region evaluating false on the out-of-range squares.
8. **Load-time refusals.** Fixtures for `MIRRORED_NAMED_STRUCTURE`,
   `QUANTIFIED_DOMAIN_EMPTY`, `PAWN_COUNT_OUT_OF_RANGE` (both bases), and the extended
   `OUTPOST_RANK_OUT_OF_RANGE` region form each fail `validatePackDocument` with that exact
   code and make both `make pack-check` and `make shape-check` exit non-zero, asserted on
   the exit codes; depth fixtures assert `mirrored` and `quantified` each count one level
   against the unchanged cap.
9. **Exhaustive dispatch (D26).** `structuralFeatureKinds` and the rewritten
   `structuralIssues` walk carry `never`-checked defaults, each with a `@ts-expect-error`
   sentinel-variant test and a comment naming the duck-typed fall-through it replaces; a
   test asserts a `quantified` conjunct's template kind reaches objective
   `evidenceRefs` (the silent-evidence-loss regression of §5); `mirrorExpression` has a
   `@ts-expect-error` sentinel for both the leaf and node unions.
10. **One vocabulary, four places, both copies.** The existing sync test is extended: the
    fourteen `STRUCTURAL_FEATURE_KINDS`, the `structuralFeature` `oneOf` `kind` consts in
    **both** schema files, the fourteen `structure-*` facts in `RULES_EVIDENCE_FACTS`, and
    the sentence-table coverage are the same set; the schema and runtime TS unions accept a
    shared fixture list of all fourteen leaves and all seven node kinds in both directions.
11. **No sentence carries a verdict.** Every new observation and spec sentence (both new
    leaves, all three mirror axes, both quantifier domains) is rendered against fixtures and
    asserted free of the parent's banned list, case-insensitive whole words; the
    `pawn_count` difference sentence is asserted to contain no *up/ahead/advantage/majority*
    wording.
12. **Browser.** In `tests/browser/drill.spec.ts`, the structural-reading disclosure
    (control at `:337` region) against the Pack B fixture: still closed on entry with no
    numeral; when opened, the reading now contains "White has 7 pawns.", "Black has 7
    pawns.", and "White's bishop on d3 stands on a light square."; reload returns the
    control to closed; the pack projection still carries no `successConditions` key.
13. **Schema hygiene.** `DRILL_PACK_SCHEMA_VERSION` is `"0.13"`, `SHAPE_ENTRY_SCHEMA_VERSION`
    is `"0.2"`, both `$id`s match, all committed packs and all 22 shape entries validate,
    and the parent's passthrough-inventory test still counts exactly the three pinned
    `additionalProperties: true` sites.
14. **Envelope.** The instrumented structure sample is re-recorded with the widened
    projection; the test asserts a non-vacuous finite sample only, per the parent's
    measured-not-gated rule.
15. **`pnpm verify` passes** (typecheck, unit suite — baseline 399 tests/69 files grows, no
    existing test is deleted — and `pnpm schema:check`), and `pnpm test:browser` passes.
16. **Canonical documentation.** `docs/structural-reading.md` describes fourteen kinds, the
    seven-node expression grammar, the three mirror axes with the shade-parity and
    side-label laws, and the quantifier domains; `docs/drill-pack-format.md` records 0.13;
    `docs/shape-library.md` records shape-entry schema 0.2, the entry-version bumps, and the
    side-label law; `docs/explanation-grounds.md` records fourteen `structure-*` facts.

## Open questions

None.

## Changelog

- 2026-08-14: created. Admits, from the two authoring waves' measured gap reports: the
  `mirrored` orientation combinator (axis colors/files/both, leaf-rewrite semantics,
  catalogue exclusion, side-label law), the `quantified` bounded some/every node over file
  ranges and square regions (collapsing the 48/36/16-leaf fans and giving kings
  region-addressable position), and the `bishop_on_shade` and `pawn_count` leaves. Refuses,
  with the deciding rule named: a named `opposition` leaf (rule 2), `king_distance`
  (rule 3), castling history and structure memory (rule 1), pawn tension and a phase
  boundary (rule 2). Pack schema 0.13, shape-entry schema 0.2, no migration; exhaustive
  `never` dispatch extended to two previously duck-typed walk sites; four official shape
  entries updated as acceptance demonstrations.
