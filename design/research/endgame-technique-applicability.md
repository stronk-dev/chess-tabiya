# Named KRPKR technique applicability

**Question:** what may a collector mean when it emits `Lucena`, `Philidor` or `Vancura`, and
which evidence is required before Support, Review or a drill may turn that name into a setup,
method, reachability or outcome claim?

**Verdict:** material class is not technique applicability. The first production contract must
keep five meanings separate: exact material classification, a versioned cited setup match, a
method stage, bounded reachability and tablebase outcome. A static collector can implement the
first two. It cannot turn either into “aim for this”, “use this method” or “this is won/drawn”.

## 1. Source boundary

[P] “Lucena” is not one source-independent set. English Chess explicitly says the term does not
mean exactly the same thing to everyone and then adopts a broader family with the defending king
cut off; Chess.com gives the narrower familiar setup: non-rook pawn on the seventh rank, attacking
king on the promotion square, and attacking rook cutting off the defending king. The first
collector therefore needs a declared convention and source revision rather than an unversioned
boolean.

- English Chess, *Lucena and More*:
  <https://www.englishchess.org.uk/wp-content/uploads/2024/05/Yearbook-2024-complete-compressed.pdf>
- Chess.com, *Lucena Position*:
  <https://www.chess.com/terms/lucena-position-chess>

[P] Philidor is both a setup and a staged defensive method. The published summary keeps the
defending king in front, holds the rook on the defender's third rank until the pawn advances, then
moves the rook to the far rank and checks from behind. A single-position matcher can identify the
declared third-rank setup; it cannot claim that the later stage was executed or remains reachable.

- <https://en.wikipedia.org/wiki/Philidor_position>
- <https://en.wikipedia.org/wiki/Rook_and_pawn_versus_rook_endgame#Philidor_position>

[P] Vancura is narrower again: a rook pawn no farther than its sixth rank, stronger rook in front,
defending rook attacking from the side, and the defending king on the opposite side; after the
pawn reaches the seventh rank, the method changes to checking from behind. The setup and its later
method stage are therefore distinct evidence.

- <https://en.wikipedia.org/wiki/Rook_and_pawn_versus_rook_endgame#The_Van%C4%8Dura_position>
- Lichess's separate practice chapter corroborates that Vancura is taught as its own endgame
  method: <https://lichess.org/practice/-/intermediate-rook-endings/heQDnvq7>

These are source-bounded working conventions, not an attempt to settle all endgame literature.
The harness names them `canonicalSetup` deliberately: it tests whether a position meets the
declared geometry, not whether every author would use the same name.

## 2. Disposable instrument

[V] `make endgame-technique-applicability-census` runs a disposable exact-position instrument over
all 50 draft packs. It recognizes exact five-piece KRPKR material, orients operands to the pawn
side, and exposes every geometric operand used by the three setup intersections. Four prototype
arms cover canonical positives, hard negatives, a blocked rook ray and colour symmetry.

Evidence:

- `tools/d2495-endgame-technique-applicability/geometry.ts`
- `tools/d2495-endgame-technique-applicability/geometry.test.ts`
- `planning/endgame-technique-applicability/results.json`

The instrument does **not** claim method applicability, best-play reachability, advice, a universal
definition or learner significance. Its output records that boundary as data.

## 3. Current corpus result

[V] The corpus contains 31 exact KRPKR positions across three packs. The current material-derived
reading labels all 31 as Lucena and all 31 as Philidor. Under the source-bounded setup
intersections, 4 match canonical Lucena geometry, 6 match the canonical Philidor third-rank setup,
and 0 match Vancura. Thus 27 Lucena labels and 25 Philidor labels currently outrun even these
narrow static operands. The two setup intersections never co-fire.

| Population | Current material label | Source-bounded setup match | Recorded attacker outcome |
|---|---:|---:|---|
| Lucena | 31 | 4 | 4 win |
| Philidor | 31 | 6 | 6 draw |
| Vancura | 0 | 0 | no population |

[V] All 31 positions have recorded tablebase evidence. The raw side-to-move categories are 9 win,
8 loss and 14 draw; after orienting to the pawn side, they are 17 win and 14 draw. One canonical
Lucena row is a raw `loss` because the defender is to move, while the pawn-side result is still a
win. A consumer that reads a tablebase category without its perspective can invert the lesson.

[V] The absence of a Vancura match is not negative validation of Vancura. This corpus contains
zero rook-pawn KRPKR positions, so it cannot measure recall or false-positive rate for that family.
A published positive prototype plus hard negatives is enough to falsify an implementation shape;
an independent populated corpus is still required to qualify product use.

## 4. Required evidence identities

The result rejects one broad `theory.endgame.technique_candidate@1`. The minimum honest split is:

1. `rules.endgame.classification@1` — exact material/phase class only; no technique name.
2. `theory.endgame.setup_match@1` — declared technique, convention/version, citation, exact
   geometry operands and `matched | not_matched | unavailable`.
3. `theory.endgame.method_stage@1` — a cited stage witnessed by the current position or transition;
   it never derives from the setup name alone.
4. `derived.endgame.setup_reachable@1` — only from a declared bounded path/search/provider, with
   start subject, target setup convention and result. Static geometry cannot mint it.
5. Existing tablebase evidence — retained separately with side-to-move and beneficiary
   perspective. It supplies outcome, not the technique label.

Rendering follows the same boundary:

- “This matches the declared Philidor third-rank setup” may render from a setup match.
- “The rook has left the third rank and is now checking from behind” needs a method-stage event.
- “Aim for Philidor” needs bounded reachability plus authored theory; a nearby shape is insufficient.
- “This is drawn” needs tablebase or another declared outcome authority.
- “Play …” remains authored drill content or a separately admitted move-disclosure module.

No LLM may bridge a missing identity by paraphrasing the other four.

## 5. Consequences and residual research

**DESIGN-GAP:** B10 previously counted material-only endgame naming as mechanically shipped. The
mechanism exists, but the named-technique claim is not qualified. The current product must withhold
Lucena/Philidor/Vancura until the split contract and its cited setup collector land.

The static setup arm is now research-complete for an RFC contract. These remain open:

- source selection and version ownership for production conventions;
- method-stage transition predicates and their hard negatives;
- bounded reachability semantics, cost and provider identity;
- a populated Vancura validation set;
- independent precision/recall or reviewer agreement for any broader family label; and
- ordinary-player wording and usefulness in Support, Review and drills.

The measured 4/31 and 6/31 intersections are a corpus overreach diagnostic, not universal
precision or recall: the packs are curated trajectories and the predicates implement only the
declared source-bounded setup conventions.
