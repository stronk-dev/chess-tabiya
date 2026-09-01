# Endgame methods are paths; reachability is a quantified game claim

**Question:** After a source-bounded Lucena, Philidor or Vančura setup match, what may a
collector truthfully say about the method played and whether that setup can be reached?

**Ledger:** [[D2496]] (follow-up to [[D2495]])

**Date:** 2026-09-01

**Instrument:** `tools/d2496-endgame-method-path/`

**Result:** `planning/endgame-method-path/results.json`

## Verdict

A setup, an observed method stage, an outcome-preserving edge, a witnessed setup arrival and a
forceable setup are five different facts. They must not share one `technique`, `applicable` or
`reachable` field.

- A **setup match** is position-local geometry under a cited convention. [[D2495]] measured this
  arm already.
- An **observed method stage** is a source-bounded predicate over a concrete legal edge plus the
  earlier setup/stage lineage on that same path. It says what happened, not that it was best.
- An **outcome-preserving stage** is the observed edge joined separately to before/after outcome
  evidence in the method beneficiary's perspective.
- A **witnessed arrival** says one recorded path entered a setup. It proves neither that another
  position can reach it nor that a player can force it.
- **Possible**, **forceable** and **inevitable** use different path quantifiers. A product prompt
  such as “aim for the Lucena position” needs a declared forceability provider or authored theory;
  neither a static match nor one witnessed path is sufficient.

This closes the semantic research arm. It does **not** authorize a production method or
reachability projection: source-registry ownership, path identity, horizon/provider receipts and
consumer eligibility still belong in an accepted RFC.

## Published method boundaries

The stage vocabulary below is deliberately narrower than the names of the techniques.

- **Lucena:** the cited explanation moves the attacking rook to its fourth rank, walks the king
  out under checks, then uses the rook as a shield so the pawn can promote. The setup restrictions
  include a non-rook pawn, the attacking king on the promotion square and the defending king cut
  off. `[P]` [Chess.com, “Lucena Position”](https://www.chess.com/terms/lucena-position-chess)
- **Philidor:** the defender keeps the rook on the defender's third rank until the pawn enters that
  rank, moves the rook to the far/rear rank and checks from behind. The published description also
  warns that other drawing defenses exist; observing this sequence must not become the universal
  definition of “correct defense.” `[P]`
  [Philidor position, description and qualifications](https://en.wikipedia.org/wiki/Philidor_position#Description)
- **Vančura:** the defender attacks a rook pawn laterally while denying king shelter; when the pawn
  reaches the seventh rank, the defending rook moves behind it. `[P]`
  [Rook and pawn versus rook, Vančura position](https://en.wikipedia.org/wiki/Rook_and_pawn_versus_rook_endgame#Van%C4%8Dura_position)

These sources establish recognisable stage relations; they do not establish that every position
resembling a named setup admits the full method, or that a bounded engine search should recommend
it.

## Executable model

`observedMethodStages()` consumes exact `{beforeFen, moveUci, afterFen}` steps. Each stage requires:

1. legal, identity-preserving piece movement;
2. a prior source-bounded setup match on the same path;
3. the stage-specific before/after geometry; and
4. prior stages where the published method is sequential.

The seven fixed controls cover the full Lucena line, full Philidor line, the canonical Vančura
`a7 ...Ra6` pair, the outcome-losing `a7 ...Rf7` contrast, same-move/no-lineage refusal, and three
small game-graph quantifier cases. `[V]` `make endgame-method-path-contract` and
`tools/d2496-endgame-method-path/method.test.ts`.

The Vančura control is not inferred from prose alone. On the fixed root
`R7/6k1/P4r2/8/2K5/8/8/8 w - - 0 1`, the Lichess standard tablebase reports a draw and retains
`a6a7`; after that move, only `...Rf4+` and `...Ra6` among eighteen legal replies preserve the
draw, while `...Rf7` gives the pawn side a win. `[V]`
[root probe](https://tablebase.lichess.ovh/standard?fen=R7%2F6k1%2FP4r2%2F8%2F2K5%2F8%2F8%2F8%20w%20-%20-%200%201),
[post-`a7` probe](https://tablebase.lichess.ovh/standard?fen=R7%2FP5k1%2F5r2%2F8%2F2K5%2F8%2F8%2F8%20b%20-%20-%200%201).
The API documents that its standard response supplies position categories and legal moves ordered
with tablebase information. `[P]`
[lila-tablebase HTTP API](https://github.com/lichess-org/lila-tablebase/blob/main/README.md#http-api).

## Corpus measurement

The deterministic pass walks every authored root-to-leaf spine path in all 50 draft packs. `[V]`
`planning/endgame-method-path/results.json`.

| Reading | Result |
|---|---:|
| Authored root-to-leaf paths | 100 |
| Paths with an observed named-method stage | 2 |
| Lucena stages | 3 |
| Philidor stages | 3 |
| Vančura stages in authored content | 0 |
| Stages with before and after tablebase evidence | 6 / 6 |
| Stages preserving the method beneficiary's recorded outcome | 6 / 6 |
| Witnessed entries into a canonical setup | 1 (Lucena) |

The one witnessed arrival is `...Ke7` in the Lucena pack: that authored edge enters the narrow
canonical setup intersection. The Lucena and Philidor method lines each fire exactly their three
declared stages. Nothing else in the 100 paths acquires a method label. `[V]`
`planning/endgame-method-path/results.json` §§`observedStages`, `witnessedSetupArrivals`.

The outcome join is perspective-sensitive. Lucena's beneficiary is the pawn side; Philidor and
Vančura belong to the defender. The report normalizes each recorded side-to-move tablebase
category to that beneficiary before testing preservation. `[V]`
`tools/d2496-endgame-method-path/measure.ts` (`outcomeFor`, `eventRow`).

## Reachability algebra

A path existing in a directed graph is ordinary existential reachability. In a two-player game,
a strategy claim alternates existential choice for the beneficiary with universal coverage of the
opponent's replies; AND/OR game trees use precisely that OR/AND distinction. `[P]`
[University of Bordeaux, reachability-game notes, pp. 2–3](https://glagarde001.pages.emi.u-bordeaux.fr/game-synthesis-and-control/materials/cours-notes-24/lect1/reachability.pdf).

For a declared target predicate `T` and ply horizon `h`, this research uses:

| Reading | Quantifier meaning |
|---|---|
| `possible` | Some legal continuation reaches `T` within `h`; both sides may cooperate. |
| `forceable` | At beneficiary nodes, some move works; at opponent nodes, every legal reply still works. |
| `inevitable` | Every move by either side reaches `T` within `h`. |

The executable micrograph proves the readings differ: an opponent fork with one target child is
possible but not forceable; a beneficiary fork with one target child is forceable but not
inevitable; and a target one ply outside the horizon is none of them. `[V]`
`tools/d2496-endgame-method-path/method.test.ts` §`bounded reachability quantifiers`.

`witnessed_setup_arrival` is intentionally absent from this table. It is evidence about one stored
path, not a game-graph solver result.

## Product consequences

1. A deterministic Review sentence may say that a named, registered stage occurred, and may add
   that the stage preserved a recorded tablebase outcome when both receipts exist.
2. Support may reveal the setup geometry or a stage-appropriate nudge only through its module's
   assistance ceiling. The collector itself must not emit advice.
3. “This move reaches Lucena” is legal only for the exact resulting node. “You can reach Lucena”
   requires `possible`; “aim for/force Lucena” requires `forceable`; “the game will transpose”
   requires `inevitable` or a still narrower authored claim.
4. A bounded search result must carry target convention/version, beneficiary, provider, root FEN,
   horizon, explored frontier/completeness and the exact quantifier. An incomplete frontier cannot
   silently return `false`; it must return `unknown`/`incomplete`.
5. Method stages should remain sparse. The current result is six meaningful events, not a new dump
   of “Lucena” on all 31 KRPKR positions.

## Limits and next evidence

- Only two authored packs contain the studied method paths. The Vančura arm is a fixed external
  control, not corpus population.
- The stage predicates reproduce the cited canonical sequences; they are not independently
  labelled for broader variants and do not establish recall.
- The corpus pass follows authored spine edges only. Deviations and arbitrary legal game trees are
  not searched.
- The bounded-reachability evaluator is a disposable semantic falsifier over explicit finite
  graphs. It is not a chess search provider and makes no performance claim.
- No ordinary learner has reviewed the eventual wording or timing.

Next: specify the production path identity and provider receipt only after the shared-resource and
value-authority dependencies accept; populate at least one authored Vančura consequence pack after
the foundation contract stabilizes; then validate presentation through the Support/Review module
eligibility layer rather than exposing raw stages.
