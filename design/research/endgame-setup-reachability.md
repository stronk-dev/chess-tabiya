# Endgame setup reachability needs a quantified, completeness-bearing proof

**Question:** When may the product say that a named rook-endgame setup is possible, forceable or
inevitable rather than merely observed on one line?

**Ledger:** [[D2497]] (follow-up to [[D2495]] and [[D2496]])

**Date:** 2026-09-01

**Instrument:** `tools/d2497-endgame-setup-reachability/`

**Result:** `planning/endgame-setup-reachability/results.json`

## Verdict

A finite claim horizon and an operational search limit are different numbers. A complete search of
every admitted move through one ply can prove “within one ply” false. The same one-ply frontier
cannot prove an unbounded “can eventually reach” claim false; an unexpanded child must remain
`unknown_provider` or `unknown_horizon`.

The three fixed KRPKR controls prove that `possible`, `forceable` and `inevitable` are not labels
for the same fact:

| Source-bounded control | Complete legal moves | Exact beneficiary-WDL preserving | Target moves | possible | forceable | inevitable |
|---|---:|---:|---:|---|---|---|
| Lucena, opponent to move | 5 | 5 | 3 | true | false | false |
| Philidor, defending beneficiary to move | 13 | 5 | 1 | true | true | false |
| Vančura, defending beneficiary to move | 16 | 4 | 4 | true | true | true |

These are exact **within-one-ply** readings under the named target convention and edge filter. They
do not establish eventual reachability, the best practical plan, or that steering toward the setup
is helpful.

## Evidence boundary

Each root is a legal five-piece standard-chess position that does not yet satisfy the D2495
canonical setup predicate. The dated Lichess tablebase snapshot retains the root WDL and every
legal move's child WDL. The instrument independently enumerates the legal move set with chessops
and fails if the snapshot omits or adds a move. It then normalizes root and child WDL to the named
beneficiary before retaining exact-outcome-preserving edges. `[V]`
`tools/d2497-endgame-setup-reachability/fixtures.json`,
`tools/d2497-endgame-setup-reachability/control.ts`, `make endgame-setup-reachability-contract`.

The lila-tablebase API documents a position response with its category and legal moves carrying
tablebase categories. `[P]`
[lila-tablebase HTTP API](https://github.com/lichess-org/lila-tablebase/blob/main/README.md#http-api).
The fixed observations are reproducible at the public endpoint: `[V]`
[Lucena control](https://tablebase.lichess.ovh/standard?fen=1K6%2F1P1k4%2F8%2F8%2F8%2F8%2Fr7%2F3R4%20b%20-%20-%201%201),
[Philidor control](https://tablebase.lichess.ovh/standard?fen=8%2F8%2F8%2F8%2F1R2pk2%2F8%2F7r%2F4K3%20w%20-%20-%200%201),
[Van%C4%8Dura control](https://tablebase.lichess.ovh/standard?fen=R7%2F6k1%2FP5r1%2F8%2F2K5%2F8%2F8%2F8%20b%20-%20-%200%201).

Exact WDL preservation is an explicit research filter, not a universal product rule. It asks
whether the setup can be entered without changing the beneficiary's current theoretical result.
A future provider may instead need a non-worsening or DTZ-aware filter, but it must declare and
validate that different question rather than silently inheriting this answer.

## Quantifier and proof model

For a target predicate `T`, `possible` is existential over all admitted moves. `forceable` is OR at
the beneficiary's turns and AND over every admitted opponent reply. `inevitable` is AND at both
sides' turns. Reachability-game semantics use the same existential player-choice / universal
opponent-choice split. `[P]`
[University of Bordeaux reachability-game notes, pp. 2–3](https://glagarde001.pages.emi.u-bordeaux.fr/game-synthesis-and-control/materials/cours-notes-24/lect1/reachability.pdf).

The executable proof vocabulary is closed:

- `proved_true`: the explored graph contains a witness or strategy sufficient for that quantifier;
- `proved_false`: the complete graph inside the **claim's declared finite horizon** refutes it;
- `unknown_horizon`: the operational ply budget ended before an unbounded or larger claim did;
- `unknown_provider`: a required node has no complete provider expansion.

Provider absence loses only the claims that depend on that branch. A target witness still proves
`possible`; a beneficiary target choice still proves `forceable`; neither proves `inevitable` while
another branch is unexpanded. Seven executable tests cover opponent and beneficiary forks, a
terminal hard negative, finite-vs-operational horizon, provider loss, all three complete tablebase
move sets, and the post-snapshot abstention. `[V]`
`tools/d2497-endgame-setup-reachability/reachability.test.ts`.

## Control readings

### Lucena

From the non-target root, `...Ke6`, `...Ke7` and `...Ke8` enter the narrow Lucena setup while
`...Kc6` and `...Rd2` do not. All five preserve White's tablebase win. Since Black chooses the
reply, entry is possible but not forceable or inevitable within one ply. Beyond that ply,
forceability and inevitability are unknown without child expansions; they are not false. `[V]`
`planning/endgame-setup-reachability/results.json` §`controls[0]`.

### Philidor

Five of thirteen legal moves preserve the defending side's draw. `Rb3` is the only one that enters
the D2495 Philidor setup. Because the defending beneficiary is to move, that one choice proves both
possibility and forceability within one ply; four preserving alternatives refute inevitability.
`[V]` `planning/endgame-setup-reachability/results.json` §`controls[1]`.

### Vančura

Four of sixteen legal moves preserve the defending side's draw, and every one remains inside the
narrow Vančura setup after the move: three lateral rook placements and `Kh7`. Therefore all three
one-ply quantifiers are true under this exact filter. This does not make every legal move safe;
twelve legal alternatives lose the draw and are outside the admitted graph. `[V]`
`planning/endgame-setup-reachability/results.json` §`controls[2]`.

## Product consequences

1. `witnessed_setup_arrival`, `possible`, `forceable` and `inevitable` need separate identities.
2. Every reachability receipt needs the target convention/version, beneficiary, root, claim
   horizon, operational budget, edge filter, provider/version, complete-frontier state and proof
   status. A bare boolean is not sufficient.
3. “This move enters X” needs only the exact resulting position. “You can enter X in one move”
   needs scoped possibility. “Force X” needs the alternating strategy proof. “The game must enter
   X” needs inevitability.
4. A true reachability result is still evidence, not advice. Support eligibility, assistance
   ceiling, salience and wording remain module concerns.
5. A provider must not use a missing probe, node cap or operational horizon as a negative label.

## Cost and limits

The three finite controls visit 17 nodes total, at most six for one control. That is a node-budget
reading, not a production latency result. No wall-clock gate is introduced into ordinary CI from
this tiny research population. `[V]` `planning/endgame-setup-reachability/results.json`
§`nodeBudget`.

- Only one-ply roots are complete. No eventual setup-reachability claim is measured.
- The roots are canonical falsifiers, not a representative KRPKR population.
- The tablebase proves WDL and supplies complete legal root moves; D2495 supplies the setup
  convention. Neither source says that targeting the setup is pedagogically useful.
- Exact WDL preservation can exclude useful result-improving moves and practical resistance; the
  provider contract must choose its filter explicitly.
- Broader setup conventions, DTZ-sensitive policies, transpositions, repetition identity, cache
  semantics and child-frontier latency remain unmeasured.

Next: carry the typed proof receipt into `evidence-value-authority` and the provider-exchange
contract, but with production implementation held until a complete provider, target registry and
consumer module have accepted contracts. Then measure multi-ply child expansion, cache behavior and
latency before any ordinary-language steering sentence ships.
